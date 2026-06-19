import jwt from 'jsonwebtoken';
import configService from '../services/configService.js';

/**
 * guestAuditGate — the audit-start gate that replaces captchaValidator.
 *
 *  - Logged-in users (req.user set by tryAuthenticate) pass straight through,
 *    exactly as they did with the old CAPTCHA check.
 *  - Anonymous users must prove they verified their email via the OTP flow
 *    (POST /single-audit/request-otp -> /verify-otp). Proof is the short-lived
 *    grant token returned by verify-otp, presented either in the request body
 *    (`auditToken`) or the `x-audit-token` header. A matching session grant is
 *    accepted as a fallback.
 *
 * On success for a guest, req.guestEmail holds the verified address.
 */
const guestAuditGate = (req, res, next) => {
  // Authenticated users bypass the email gate.
  if (req.user) return next();

  // In non-production, skip the email-verification gate entirely so developers
  // can run audits straight from a URL without the OTP step. Production (NODE_ENV
  // === 'production') still enforces verification; this fails safe — anything that
  // isn't explicitly production keeps the gate off, matching how the rest of the
  // backend treats NODE_ENV (e.g. server.js IS_PROD, tracking.js secure cookies).
  if (configService.getConfig('NODE_ENV', 'development') !== 'production') {
    return next();
  }

  // 1) Signed grant token (primary mechanism — stateless, survives cross-origin).
  const token = req.body?.auditToken || req.headers['x-audit-token'];
  if (token) {
    try {
      const decoded = jwt.verify(token, configService.getConfig('JWT_SECRET'));
      if (decoded?.purpose === 'guest_audit' && decoded.email) {
        req.guestEmail = decoded.email;
        return next();
      }
    } catch (_) {
      // fall through to the session fallback / rejection below
    }
  }

  // 2) Session grant fallback (set by verify-otp on the same browser session).
  const sessionGrant = req.session?.guestAudit;
  if (sessionGrant?.email && sessionGrant.expiresAt > Date.now()) {
    req.guestEmail = sessionGrant.email;
    return next();
  }

  return res.status(401).json({
    success: false,
    code: 'EMAIL_VERIFICATION_REQUIRED',
    error: 'Please verify your email to run an audit.',
  });
};

export default guestAuditGate;
