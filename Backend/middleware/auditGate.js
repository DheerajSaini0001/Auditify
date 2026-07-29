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

  // The gate is ON everywhere by default — a dev environment should exercise the
  // same email → OTP → grant path production does, or the flow only ever gets
  // tested in production. (The old rule was the inverse: ANY non-production
  // NODE_ENV disabled verification entirely, so a staging box or a mis-set
  // NODE_ENV silently ran an open audit endpoint.)
  //
  // Escape hatch for local work, explicit and opt-in: SKIP_GUEST_EMAIL_GATE=true.
  // It is ignored in production so the flag can never disable the gate there.
  const isProd = configService.getConfig('NODE_ENV', 'development') === 'production';
  if (!isProd && String(configService.getConfig('SKIP_GUEST_EMAIL_GATE', 'false')).toLowerCase() === 'true') {
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
