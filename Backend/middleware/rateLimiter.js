import rateLimit from 'express-rate-limit';
import configService from '../services/configService.js';

// Lazy initialization — reads config at first request, not module load
let _authLimiter = null;

const getAuthLimiter = () => {
  if (_authLimiter) return _authLimiter;

  _authLimiter = rateLimit({
    windowMs: parseInt(configService.getConfig('RATE_LIMIT_WINDOW_MS', '900000')),
    max: parseInt(configService.getConfig('RATE_LIMIT_MAX_REQUESTS', '10')),
    message: {
      error: 'Too many requests, try again later',
      code: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });

  return _authLimiter;
};

// Export a middleware that lazily initializes the rate limiter
const authLimiter = (req, res, next) => {
  const limiter = getAuthLimiter();
  return limiter(req, res, next);
};

export { authLimiter };
