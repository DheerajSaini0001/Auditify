import jwt from 'jsonwebtoken';
import configService from '../services/configService.js';

/**
 * guestAuditGate — the audit-start gate for anonymous users.
 *
 *  - Logged-in users (req.user set by tryAuthenticate) pass straight through.
 *  - Anonymous users must present the grant issued by the verification challenge
 *    (GET /single-audit/captcha -> POST /single-audit/verify-captcha): one
 *    single-digit addition, then a grant that lasts GUEST_AUDIT_TOKEN_TTL_MIN
 *    (default 2 hours). The grant travels in the request body (`auditToken`) or
 *    the `x-audit-token` header; a matching session grant is accepted as a
 *    fallback for clients that can't echo it back.
 *
 * This used to demand an emailed OTP. That was dropped: it stalled every guest
 * (and every tester) behind an inbox round-trip for what is meant to be a bot
 * speed bump. Grants minted by the old email flow carry the same `purpose`, so any
 * still in the wild keep working until they expire.
 *
 * req.guestEmail stays on the request for the AuditLog, and is simply null now
 * that guests aren't asked for an address.
 */
const guestAuditGate = (req, res, next) => {
  // Authenticated users bypass the gate.
  if (req.user) return next();

  // The gate is ON everywhere by default — a dev environment should exercise the
  // same challenge -> grant path production does, or the flow only ever gets
  // tested in production. (The old rule was the inverse: ANY non-production
  // NODE_ENV disabled verification entirely, so a staging box or a mis-set
  // NODE_ENV silently ran an open audit endpoint.)
  //
  // Escape hatch for local work, explicit and opt-in: SKIP_GUEST_AUDIT_GATE=true
  // (SKIP_GUEST_EMAIL_GATE is still read so existing local .env files keep working).
  // Both are ignored in production, so neither can disable the gate there.
  const isProd = configService.getConfig('NODE_ENV', 'development') === 'production';
  const skipFlag = configService.getConfig('SKIP_GUEST_AUDIT_GATE', null)
    ?? configService.getConfig('SKIP_GUEST_EMAIL_GATE', 'false');
  if (!isProd && String(skipFlag).toLowerCase() === 'true') {
    return next();
  }

  // 1) Signed grant token (primary mechanism — stateless, survives cross-origin).
  const token = req.body?.auditToken || req.headers['x-audit-token'];
  if (token) {
    try {
      const decoded = jwt.verify(token, configService.getConfig('JWT_SECRET'));
      if (decoded?.purpose === 'guest_audit') {
        // `email` is only present on grants minted by the retired OTP flow.
        req.guestEmail = decoded.email || null;
        return next();
      }
    } catch (_) {
      // fall through to the session fallback / rejection below
    }
  }

  // 2) Session grant fallback (set by verify-captcha on the same browser session).
  const sessionGrant = req.session?.guestAudit;
  if (sessionGrant?.expiresAt > Date.now()) {
    req.guestEmail = sessionGrant.email || null;
    return next();
  }

  return res.status(401).json({
    success: false,
    code: 'VERIFICATION_REQUIRED',
    error: 'Please complete the quick verification to run an audit.',
  });
};

export default guestAuditGate;
