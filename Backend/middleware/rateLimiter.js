import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // default 15 mins
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 10, // Limit each IP to 10 requests per `window`
  message: {
    error: 'Too many requests, try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

export { authLimiter };
