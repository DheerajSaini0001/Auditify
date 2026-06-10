import rateLimit from 'express-rate-limit';
import configService from '../services/configService.js';

// Every limiter here is IP-based: express-rate-limit keys on req.ip by default,
// and server.js sets `app.set('trust proxy', 1)` so req.ip is the real client IP
// behind one proxy hop. Each limiter keeps its own counter, so the endpoint groups
// below get independent per-IP budgets.

const makeLimiter = (windowMs, max, message) =>
  rateLimit({
    windowMs,
    max,
    message: { error: message, code: 'RATE_LIMIT_EXCEEDED' },
    standardHeaders: true, // expose RateLimit-* headers
    legacyHeaders: false,
  });

// ── Existing config-driven limiter (kept; reads config lazily at first request) ──
let _authLimiter = null;
const getAuthLimiter = () => {
  if (_authLimiter) return _authLimiter;
  _authLimiter = makeLimiter(
    parseInt(configService.getConfig('RATE_LIMIT_WINDOW_MS', '900000')),
    parseInt(configService.getConfig('RATE_LIMIT_MAX_REQUESTS', '10')),
    'Too many requests, try again later'
  );
  return _authLimiter;
};
const authLimiter = (req, res, next) => getAuthLimiter()(req, res, next);

// ── Purpose-specific IP-based limiters for the auth surface ──

// Login — throttle password brute force.
const loginLimiter = makeLimiter(
  15 * 60 * 1000, 10,
  'Too many login attempts from this IP. Please wait 15 minutes.'
);

// Forgot / reset password — throttle email-bombing and reset-token guessing.
const passwordResetLimiter = makeLimiter(
  15 * 60 * 1000, 5,
  'Too many password reset requests from this IP. Please wait 15 minutes.'
);

// Registration — throttle bulk account creation from one IP.
const registerLimiter = makeLimiter(
  60 * 60 * 1000, 10,
  'Too many accounts created from this IP. Please wait an hour.'
);

// OTP verify/resend — throttle distributed OTP guessing (these endpoints also
// have their own per-record attempt caps and resend cooldowns).
const otpLimiter = makeLimiter(
  15 * 60 * 1000, 20,
  'Too many OTP requests from this IP. Please wait a few minutes.'
);

// ── Global backstop: a generous per-IP ceiling on state-changing requests. ──
// GET/HEAD/OPTIONS are skipped so high-frequency polling (audit status, screenshot
// views) and CORS preflight are never throttled; the expensive POST endpoints keep
// their own stricter limiters above.
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { error: 'Too many requests from this IP. Please slow down.', code: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS',
});

export {
  authLimiter,
  loginLimiter,
  passwordResetLimiter,
  registerLimiter,
  otpLimiter,
  globalLimiter,
};
