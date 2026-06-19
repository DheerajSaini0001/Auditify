import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import OTP from '../models/OTP.js';
import sendEmail from '../utils/sendEmail.js';
import generateOTP from '../utils/generateOTP.js';
import configService from '../services/configService.js';
import logger from '../utils/logger.js';

/**
 * Guest-audit email verification.
 *
 * Replaces the CAPTCHA gate for anonymous (not-logged-in) audits. Flow:
 *   1. POST /single-audit/request-otp  { email }          -> emails a 6-digit code
 *   2. POST /single-audit/verify-otp   { email, otp }     -> returns a short-lived
 *                                                            "audit grant" JWT
 *   3. POST /single-audit/audit        { ..., auditToken } -> guestAuditGate accepts
 *                                                            the grant in place of CAPTCHA
 *
 * The OTPs reuse the existing OTP collection with purpose 'guest_audit', so they
 * never collide with the account-registration 'email_verify' codes.
 */

const PURPOSE = 'guest_audit';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OTP_TTL_MS = 10 * 60 * 1000;     // code valid for 10 minutes
const RESEND_COOLDOWN_MS = 60 * 1000;  // one code per email per 60s
const MAX_ATTEMPTS = 5;                // wrong tries before a code is invalidated

// How long the grant returned by verify-otp stays valid. During this window the
// guest can run their audit(s) without re-verifying. Bounded further by the audit
// route's own IP rate limiter (20 / 15 min).
const grantTtlMinutes = () => {
  const n = parseInt(configService.getConfig('GUEST_AUDIT_TOKEN_TTL_MIN', '30'), 10);
  return Number.isFinite(n) && n > 0 ? n : 30;
};

/**
 * Issue the signed grant a verified guest presents to the audit endpoint.
 * Distinct `purpose` so it can never be mistaken for a logged-in user's token
 * (tryAuthenticate only accepts tokens carrying a userId).
 */
const signAuditGrant = (email) =>
  jwt.sign(
    { email, purpose: PURPOSE, scope: 'single_audit' },
    configService.getConfig('JWT_SECRET'),
    { expiresIn: `${grantTtlMinutes()}m` }
  );

const otpEmailHtml = (rawOTP) => `
  <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
    <h2 style="color: #1e3a8a;">Verify your email to run your audit</h2>
    <p>Enter the following 6-digit code to start your website audit. This code is valid for 10 minutes.</p>
    <div style="background: #f3f4f6; color: #1e3a8a; font-size: 32px; font-weight: bold; text-align: center; letter-spacing: 5px; padding: 15px; margin: 20px 0; border-radius: 5px; font-family: monospace;">
      ${rawOTP}
    </div>
    <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
  </div>
`;

/**
 * POST /single-audit/request-otp   (also used by /single-audit/resend-otp)
 * Body: { email }
 * Sends a 6-digit verification code to the email. Calling again before the
 * cooldown elapses is rejected so the endpoint can't be used to email-bomb.
 */
export const requestAuditOTP = async (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Per-email cooldown (the IP limiter is the coarse cap; this is the per-target one).
    const lastOTP = await OTP.findOne({ email, purpose: PURPOSE }).sort({ createdAt: -1 });
    if (lastOTP && (Date.now() - new Date(lastOTP.createdAt).getTime()) < RESEND_COOLDOWN_MS) {
      const waitSec = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - new Date(lastOTP.createdAt).getTime())) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSec}s before requesting another code.`,
        retryAfter: waitSec,
      });
    }

    const rawOTP = generateOTP();
    const hashedOTP = await bcrypt.hash(rawOTP, 10);

    // Only one live guest-audit code per email at a time.
    await OTP.deleteMany({ email, purpose: PURPOSE });
    await OTP.create({
      email,
      otp: hashedOTP,
      purpose: PURPOSE,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    });

    // Respond as soon as the code is persisted — don't block the request on the
    // SMTP round-trip (the slow part). The code is already valid in Mongo, so the
    // user can enter it the instant the email lands; we dispatch it in background.
    res.status(200).json({
      success: true,
      message: 'Verification code sent. Please check your email.',
      email,
    });

    sendEmail({
      to: email,
      subject: 'Your Dealerpulse audit verification code',
      html: otpEmailHtml(rawOTP),
    })
      .then(() => logger.info(`[GuestAudit] Verification code sent to ${email}`))
      .catch((err) => logger.error(`[GuestAudit] Failed to send code to ${email}`, new Error(err.message)));
    return;
  } catch (err) {
    logger.error('[GuestAudit] requestAuditOTP failed', new Error(err.message));
    return res.status(500).json({ success: false, message: 'Could not send verification code. Please try again.' });
  }
};

/**
 * POST /single-audit/verify-otp
 * Body: { email, otp }
 * On success returns a short-lived audit grant token (and mirrors it into the
 * session as a fallback). The client passes `auditToken` to /single-audit/audit.
 */
export const verifyAuditOTP = async (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const otp = (req.body?.otp || '').toString().trim();

    if (!EMAIL_REGEX.test(email) || !otp) {
      return res.status(400).json({ success: false, message: 'Missing or invalid email/OTP.' });
    }

    const doc = await OTP.findOne({ email, purpose: PURPOSE });
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Code expired or not found. Request a new one.' });
    }

    if (new Date(doc.expiresAt) < new Date()) {
      await OTP.deleteOne({ _id: doc._id });
      return res.status(410).json({ success: false, message: 'Code expired. Request a new one.' });
    }

    // Count this try first so a brute-forcer burns through the cap.
    doc.attempts += 1;
    if (doc.attempts > MAX_ATTEMPTS) {
      await OTP.deleteOne({ _id: doc._id });
      return res.status(429).json({ success: false, message: 'Too many attempts. Request a new code.' });
    }

    const isMatch = await bcrypt.compare(otp, doc.otp);
    if (!isMatch) {
      await doc.save();
      return res.status(400).json({
        success: false,
        message: 'Invalid code.',
        attemptsLeft: MAX_ATTEMPTS - doc.attempts,
      });
    }

    // Verified — consume the code and issue the grant.
    await OTP.deleteOne({ _id: doc._id });

    const auditToken = signAuditGrant(email);
    const ttlMin = grantTtlMinutes();

    // Best-effort session fallback so the gate works even if the client doesn't
    // echo the token back (persisted automatically when the response is sent).
    if (req.session) {
      req.session.guestAudit = { email, expiresAt: Date.now() + ttlMin * 60 * 1000 };
    }

    logger.info(`[GuestAudit] Email verified, audit grant issued for ${email}`);
    return res.status(200).json({
      success: true,
      message: 'Email verified. You can now run your audit.',
      email,
      auditToken,
      expiresInMinutes: ttlMin,
    });
  } catch (err) {
    logger.error('[GuestAudit] verifyAuditOTP failed', new Error(err.message));
    return res.status(500).json({ success: false, message: 'Internal server error.' });
  }
};
