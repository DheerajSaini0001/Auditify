import ActivityLog from '../models/ActivityLog.js';
import UserSession from '../models/UserSession.js';
import logger from './logger.js';

/**
 * The one place the app writes user activity through.
 *
 * Everything here is FIRE-AND-FORGET and swallows its own errors. That is a
 * deliberate trade: tracking is observability, not business logic, and a logging
 * failure must never turn a working audit into a 500. Every failure is still
 * logged locally, so a broken tracker is visible in the server log rather than
 * silently losing data.
 *
 * Callers therefore do NOT await these, and must not depend on their return value
 * for control flow.
 */

/**
 * Query parameters that must never reach the activity log.
 *
 * This is not hypothetical: the OAuth callback lands on `/api/auth/google/callback
 * ?code=4/0AXEQx…`, so recording the entry page verbatim wrote a live Google
 * authorization code into the database — and straight out again through the admin
 * panel and its CSV export. An analytics log is one of the most widely-read,
 * longest-retained stores in the system; a credential in it is a credential
 * everywhere.
 *
 * Matched case-insensitively as a substring, so `access_token`, `refreshToken`
 * and `id_token` are all caught by `token`.
 */
const SENSITIVE_PARAMS = [
  'code', 'token', 'secret', 'password', 'passwd', 'pwd',
  'key', 'auth', 'session', 'jwt', 'otp', 'signature', 'sig',
];

const isSensitiveParam = (name) => {
  const n = String(name).toLowerCase();
  return SENSITIVE_PARAMS.some((bad) => n.includes(bad));
};

/**
 * Strip credentials out of a URL or path before it is stored.
 *
 * Redacts rather than drops the whole query string: `?utm_source=…` and
 * `?tab=logs` are exactly the context that makes a page view worth recording, and
 * throwing the query away to be safe would take those with it. The parameter NAME
 * is kept so a reader can still see that a code was present.
 */
export const sanitizeUrl = (value) => {
  if (!value) return value;
  const raw = String(value);
  const cut = raw.indexOf('?');
  if (cut === -1) return raw.slice(0, 2048);

  const path = raw.slice(0, cut);
  const params = new URLSearchParams(raw.slice(cut + 1));
  let touched = false;
  for (const name of [...params.keys()]) {
    if (isSensitiveParam(name)) {
      params.set(name, 'REDACTED');
      touched = true;
    }
  }
  const query = params.toString();
  const out = query ? `${path}?${touched ? decodeURIComponent(query) : query}` : path;
  return out.slice(0, 2048);
};

/**
 * Normalize the per-request tracking context.
 *
 * middleware/tracking.js populates `req.tracking` for every request, but several
 * call sites (workers, retries, direct API calls that skipped the middleware)
 * can reach here without it — so every field falls back rather than throwing.
 */
export const trackingContext = (req = {}) => {
  const t = req.tracking || {};
  return {
    sessionId: t.sessionId || req.cookies?.sessionId || 'unknown',
    ip: t.ip || req.headers?.['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || 'unknown',
    country: t.country || 'unknown',
    region: t.region || 'unknown',
    city: t.city || 'unknown',
    device: t.device || 'unknown',
    browser: t.browser || 'unknown',
    os: t.os || 'unknown',
    userAgent: req.headers?.['user-agent'] || null,
    screenResolution: t.screenResolution || 'unknown',
    // Both are URLs that can carry an auth code or token — see sanitizeUrl.
    referrer: sanitizeUrl(t.referrer) || 'direct',
    entryPage: sanitizeUrl(t.entryPage) || '/',
  };
};

/**
 * Record one activity row.
 *
 * @param {object} req      the Express request (for tracking context + req.user)
 * @param {object} entry
 * @param {string} entry.action        one of ACTIVITY_ACTIONS
 * @param {string} [entry.status]      'SUCCESS' (default) | 'FAILURE'
 * @param {string} [entry.url]         the site/report the action was about
 * @param {string} [entry.errorMessage] why it failed, when status is FAILURE
 * @param {object} [entry.metadata]    anything else worth keeping
 * @param {string} [entry.guestEmail]  address a signed-out visitor gave us
 * @returns {Promise<void>} always resolves
 */
export const logActivity = async (req, entry = {}) => {
  try {
    const ctx = trackingContext(req);
    await ActivityLog.create({
      userId: req?.user?.userId || entry.userId || null,
      guestEmail: entry.guestEmail || req?.guestEmail || null,
      sessionId: ctx.sessionId,
      ip: ctx.ip,
      country: ctx.country,
      region: ctx.region,
      city: ctx.city,
      device: ctx.device,
      browser: ctx.browser,
      os: ctx.os,
      userAgent: ctx.userAgent,
      // Sanitized even for server-supplied URLs: a page view posted by the client
      // carries whatever query string the visitor was on, callback pages included.
      url: sanitizeUrl(entry.url) || null,
      action: entry.action,
      status: entry.status || 'SUCCESS',
      errorMessage: entry.errorMessage || null,
      metadata: entry.metadata || {},
      timestamp: new Date(),
    });
  } catch (err) {
    // Never rethrow — see the note at the top of this file.
    logger.error(`[Tracker] Failed to log ${entry.action}`, err);
  }
};

/**
 * Open the session if it is new, otherwise mark it alive.
 *
 * One upsert does both, keyed on the sessionId cookie. `$setOnInsert` holds
 * everything that describes how the session BEGAN (entry page, referrer, device)
 * so a later request can never rewrite the session's own origin story; `$set`
 * holds only what legitimately changes as it goes (last seen, and the userId once
 * an anonymous session signs in).
 *
 * @param {object} req
 * @param {object} [counters] fields to $inc, e.g. { auditsStarted: 1 }
 * @param {string} [userId] attribute to this account explicitly. Needed on the
 *   login routes, where the account is known but `req.user` is not set yet —
 *   authentication is what the request is in the middle of establishing.
 */
export const touchSession = async (req, counters = {}, userId = null) => {
  try {
    const ctx = trackingContext(req);
    if (!ctx.sessionId || ctx.sessionId === 'unknown') return;

    const set = { lastSeenAt: new Date() };
    // Claim the session for the account the moment we know one — this is what
    // turns "anonymous session that later signed in" into one attributable row.
    const owner = userId || req?.user?.userId;
    if (owner) set.userId = owner;

    const update = {
      $set: set,
      $setOnInsert: {
        sessionId: ctx.sessionId,
        ip: ctx.ip,
        country: ctx.country,
        region: ctx.region,
        city: ctx.city,
        device: ctx.device,
        browser: ctx.browser,
        os: ctx.os,
        userAgent: ctx.userAgent,
        screenResolution: ctx.screenResolution,
        referrer: ctx.referrer,
        entryPage: ctx.entryPage,
        startedAt: new Date(),
      },
    };

    const inc = Object.fromEntries(
      Object.entries(counters).filter(([, v]) => Number.isFinite(v) && v !== 0)
    );
    if (Object.keys(inc).length) update.$inc = inc;

    await UserSession.updateOne({ sessionId: ctx.sessionId }, update, { upsert: true });
  } catch (err) {
    // A duplicate-key here means two requests raced to open the same session.
    // Both wanted the same row to exist, and it now does — nothing to report.
    if (err?.code !== 11000) logger.error('[Tracker] Failed to touch session', err);
  }
};

/**
 * Close a session explicitly (tab closed, or logout).
 *
 * Filters on `endedAt: null` so a second beacon — browsers can and do fire both
 * `pagehide` and `visibilitychange` — cannot overwrite the real end time with a
 * later one and inflate the recorded duration.
 */
export const endSession = async (req, { reason = 'beacon', exitPage = null } = {}) => {
  try {
    const ctx = trackingContext(req);
    if (!ctx.sessionId || ctx.sessionId === 'unknown') return;

    const session = await UserSession.findOne({ sessionId: ctx.sessionId, endedAt: null })
      .select('startedAt');
    if (!session) return;

    const now = new Date();
    await UserSession.updateOne(
      { _id: session._id, endedAt: null },
      {
        $set: {
          endedAt: now,
          endReason: reason,
          durationMs: Math.max(0, now - session.startedAt),
          ...(exitPage ? { exitPage: sanitizeUrl(exitPage) } : {}),
        },
      }
    );
  } catch (err) {
    logger.error('[Tracker] Failed to end session', err);
  }
};

/**
 * Convenience wrapper: log the activity AND keep the session alive in one call.
 * Returns immediately — the two writes run in the background together.
 */
export const track = (req, entry = {}, counters = {}) => {
  // Deliberately not awaited by callers; both halves swallow their own errors.
  void Promise.all([logActivity(req, entry), touchSession(req, counters)]);
};

export default { logActivity, touchSession, endSession, track, trackingContext };
