import mongoose from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import UserSession from '../models/UserSession.js';
import { logActivity, touchSession, endSession, trackingContext, sanitizeUrl } from '../utils/activityTracker.js';
import logger from '../utils/logger.js';

/**
 * Public event intake for the things the server cannot observe on its own.
 *
 * Three of the metrics the admin panel needs only exist in the browser:
 *   • the Site Audit button being CLICKED (a click that fails validation, or that
 *     the visitor abandons, never reaches any API — but it is exactly the
 *     click-to-start drop-off an admin wants to see);
 *   • a report being VIEWED (report pages are read from the in-memory store or a
 *     cached response, so a page open is not reliably a server round-trip);
 *   • a session ENDING (only the browser knows the tab closed).
 *
 * Everything else is recorded server-side, where the client cannot lie about it.
 *
 * Trust boundary: this endpoint is unauthenticated by necessity (guests generate
 * most of the traffic), so it is treated as untrusted input throughout — the
 * action must be one of a small whitelist, the identity comes from the session
 * cookie and the bearer token rather than the body, and the free-text fields are
 * length-capped. It can only ever *append* to the log; it cannot change a score,
 * a status, or anyone's account.
 */

// Only events the browser is the authority on. Deliberately NOT the full
// ACTIVITY_ACTIONS list: letting a client post AUDIT_COMPLETED or REGISTER would
// let anyone forge the funnel the dashboard is built on.
const CLIENT_ACTIONS = new Set([
  'AUDIT_BUTTON_CLICK',
  'REPORT_VIEW',
  'REPORT_DOWNLOAD',
  'PAGE_VIEW',
  'SESSION_START',
  'SESSION_END',
]);

// Free-text from the client is stored, so it is bounded. These are generous for
// real values and far below anything that would bloat a document.
const MAX_URL = 2048;
const MAX_TEXT = 512;

// Length-capped AND credential-stripped: a client-posted page view carries the
// visitor's current query string, which on a callback page holds an auth code.
const clip = (value, max) =>
  value == null ? null : sanitizeUrl(String(value)).slice(0, max);

/**
 * Keep only primitive metadata, capped in both key count and value length.
 * A nested object from the client would otherwise be stored verbatim into a
 * Mixed field — unbounded in size and shape.
 */
const sanitizeMetadata = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out = {};
  for (const [key, value] of Object.entries(raw).slice(0, 20)) {
    if (value == null) continue;
    if (typeof value === 'number' || typeof value === 'boolean') out[key] = value;
    else if (typeof value === 'string') out[key] = value.slice(0, MAX_TEXT);
  }
  return out;
};

export const trackEvent = async (req, res) => {
  try {
    const { action, url, reportId, metadata, exitPage } = req.body || {};

    if (!action || !CLIENT_ACTIONS.has(action)) {
      return res.status(400).json({ success: false, error: 'Unknown event' });
    }

    const cleanUrl = clip(url, MAX_URL);
    const meta = sanitizeMetadata(metadata);

    // Which per-session counter this event bumps, if any.
    const counters =
      action === 'PAGE_VIEW' ? { pageViews: 1 }
        : action === 'REPORT_VIEW' ? { reportsViewed: 1 }
          : action === 'REPORT_DOWNLOAD' ? { reportsDownloaded: 1 }
            : {};

    if (action === 'SESSION_END') {
      await Promise.all([
        logActivity(req, { action, url: cleanUrl, metadata: meta }),
        endSession(req, { reason: 'beacon', exitPage: clip(exitPage, MAX_URL) }),
      ]);
      return res.status(202).json({ success: true });
    }

    await Promise.all([
      logActivity(req, { action, url: cleanUrl, metadata: meta }),
      touchSession(req, counters),
    ]);

    // A view/download is also part of the audit's own journey row, so the admin
    // journey table can answer "did they ever read it?" without a second query.
    if ((action === 'REPORT_VIEW' || action === 'REPORT_DOWNLOAD') && mongoose.Types.ObjectId.isValid(reportId)) {
      await markReportOutcome(reportId, action === 'REPORT_VIEW' ? 'view' : 'download');
    }

    res.status(202).json({ success: true });
  } catch (error) {
    logger.error('[Tracking] trackEvent failed', error);
    // 202 even on failure: this endpoint exists to observe, and a tracking error
    // must not surface to the visitor as a broken page or a retry storm.
    res.status(202).json({ success: false });
  }
};

/**
 * Flag the audit journey row(s) for a report as viewed / downloaded.
 *
 * `$min` on the first-time stamp rather than `$set`: a report opened five times
 * should keep the FIRST view time (that is the time-to-first-read the funnel
 * cares about) while the count keeps climbing. `$min` on a null field sets it, so
 * the first call fills it and later calls leave it alone.
 *
 * Exported because the PDF export route marks downloads server-side too — there
 * the server *is* the authority, and going through the same helper keeps the two
 * paths from drifting apart.
 */
export const markReportOutcome = async (reportId, kind) => {
  try {
    const field = kind === 'download' ? 'reportDownload' : 'reportView';
    await AuditLog.updateMany(
      { reportId },
      {
        $set: { [`${field}ed`]: true },
        $min: { [`${field}edAt`]: new Date() },
        $inc: { [`${field}Count`]: 1 },
      }
    );
  } catch (err) {
    logger.error(`[Tracking] Failed to mark report ${kind}`, err);
  }
};

/**
 * Session heartbeat for the current visitor.
 *
 * Split from trackEvent so the client can keep a long-lived tab's session alive
 * (and claim it for the account after a login) without writing an activity row
 * every time — the activity log should record what someone did, not that their
 * tab was still open.
 */
export const heartbeat = async (req, res) => {
  try {
    await touchSession(req);
    res.status(202).json({ success: true, sessionId: trackingContext(req).sessionId });
  } catch (error) {
    res.status(202).json({ success: false });
  }
};

/**
 * Close out sessions that went quiet without a beacon.
 * Exposed for the admin analytics endpoints (see UserSession.closeStaleSessions).
 */
export const sweepStaleSessions = () => UserSession.closeStaleSessions();
