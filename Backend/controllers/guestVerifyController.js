import jwt from 'jsonwebtoken';
import configService from '../services/configService.js';
import logger from '../utils/logger.js';

/**
 * Guest-audit verification — one single-digit addition.
 *
 * Replaces the email + OTP gate that used to stand in front of anonymous audits
 * (request-otp -> verify-otp -> grant). Flow now:
 *   1. GET  /single-audit/captcha         -> { question: "3 + 4", challenge }
 *   2. POST /single-audit/verify-captcha  -> { auditToken }   (default 2 hours)
 *   3. POST /single-audit/audit           -> guestAuditGate accepts the grant
 *
 * Both steps are STATELESS: the challenge is a short-lived signed JWT carrying the
 * two operands, so nothing is parked in the session store. That's deliberate — the
 * older session-backed CAPTCHA failed for real users whenever the session cookie
 * didn't survive the cross-origin round trip, and they got "CAPTCHA session
 * expired" through no fault of their own.
 *
 * On what this does and does not buy: the operands ride inside the challenge token
 * and the question is on screen regardless, so a determined script can solve it.
 * It's a human speed bump, which is what it's meant to be. The real abuse ceiling
 * is unchanged — the per-IP report budget in middleware/reportBudget.js.
 */

const CHALLENGE_PURPOSE = 'guest_audit_challenge';
const GRANT_PURPOSE = 'guest_audit';

// A challenge is only good for a few minutes — long enough to type an answer,
// short enough that a harvested one is useless later.
const CHALLENGE_TTL_MIN = 10;

// How long ONE solved challenge stays good for. Inside this window the guest runs
// audits without being asked again (still bounded by the report budget); once it
// lapses the next audit shows the challenge once more. Default 2 hours.
const grantTtlMinutes = () => {
  const n = parseInt(configService.getConfig('GUEST_AUDIT_TOKEN_TTL_MIN', '120'), 10);
  return Number.isFinite(n) && n > 0 ? n : 120;
};

const secret = () => configService.getConfig('JWT_SECRET');

const CHALLENGE_DEAD = 'Verification expired. Please refresh and try again.';

/**
 * GET /single-audit/captcha
 * Hands out the question plus the signed challenge that proves it came from us.
 */
export const getAuditCaptcha = (req, res) => {
  try {
    // Single-digit addition only: 1-9 + 1-9. No subtraction, no negative results,
    // no two-digit operands — a human should clear this in one glance.
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;

    const challenge = jwt.sign(
      { a, b, purpose: CHALLENGE_PURPOSE },
      secret(),
      { expiresIn: `${CHALLENGE_TTL_MIN}m` }
    );

    return res.status(200).json({
      success: true,
      question: `${a} + ${b}`,
      challenge,
      expiresInMinutes: CHALLENGE_TTL_MIN,
    });
  } catch (err) {
    logger.error('[GuestVerify] getAuditCaptcha failed', new Error(err.message));
    return res.status(500).json({ success: false, error: 'Could not start verification. Please try again.' });
  }
};

/**
 * POST /single-audit/verify-captcha
 * Body: { challenge, answer }
 * Right answer -> the audit grant the gate accepts for the next grantTtlMinutes().
 */
export const verifyAuditCaptcha = (req, res) => {
  try {
    const { challenge, answer } = req.body || {};
    if (!challenge) {
      return res.status(400).json({ success: false, error: CHALLENGE_DEAD });
    }

    let decoded;
    try {
      decoded = jwt.verify(challenge, secret());
    } catch (_) {
      // Expired or tampered with — either way the client needs a fresh question.
      return res.status(400).json({ success: false, error: CHALLENGE_DEAD });
    }

    if (decoded?.purpose !== CHALLENGE_PURPOSE ||
        typeof decoded.a !== 'number' ||
        typeof decoded.b !== 'number') {
      return res.status(400).json({ success: false, error: CHALLENGE_DEAD });
    }

    // Accept a plain integer only. " 7 " passes, "7a" / "" / null do not — parseInt
    // alone would happily read "7a" as 7.
    const raw = typeof answer === 'number' ? String(answer) : String(answer ?? '').trim();
    const given = /^-?\d+$/.test(raw) ? parseInt(raw, 10) : NaN;
    if (!Number.isInteger(given) || given !== decoded.a + decoded.b) {
      return res.status(400).json({
        success: false,
        code: 'WRONG_ANSWER',
        error: "That's not the right answer. Please try again.",
      });
    }

    const ttlMin = grantTtlMinutes();
    const auditToken = jwt.sign(
      { purpose: GRANT_PURPOSE, scope: 'single_audit', verifiedBy: 'captcha' },
      secret(),
      { expiresIn: `${ttlMin}m` }
    );

    // Session fallback, best effort — the gate falls back to this when the client
    // can't echo the token back on a later request.
    if (req.session) {
      req.session.guestAudit = { verifiedBy: 'captcha', expiresAt: Date.now() + ttlMin * 60 * 1000 };
    }

    return res.status(200).json({
      success: true,
      message: 'Verified. You can run your audit now.',
      auditToken,
      expiresInMinutes: ttlMin,
    });
  } catch (err) {
    logger.error('[GuestVerify] verifyAuditCaptcha failed', new Error(err.message));
    return res.status(500).json({ success: false, error: 'Internal server error.' });
  }
};
