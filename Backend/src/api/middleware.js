// Tiny middleware helpers for the audit API.

// Wrap async route handlers so thrown/rejected errors reach the error handler.
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Central error handler. Honors err.status / err.code; defaults to 500.
export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) console.error(`[api] ${req.method} ${req.originalUrl} —`, err.message);
  res.status(status).json({ error: err.message || "Internal Server Error", code: err.code || undefined });
}

export default { asyncHandler, errorHandler };
