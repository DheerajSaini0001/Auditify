import logger from '../utils/logger.js';
import { sendError } from '../utils/apiResponse.js';

/**
 * The single place an error becomes a response (architecture doc §4).
 *
 * Must be registered LAST, after every route. Express identifies an error handler by
 * its four-argument signature, so `next` stays in the list even though it is unused.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;

  // An operational error is an expected outcome (not found, forbidden) and its
  // message is safe to show. Anything else is a bug: log it in full, but return a
  // generic message so an internal detail never leaks to a client.
  const isOperational = err.isOperational === true || statusCode < 500;
  const message = isOperational ? err.message : 'Something went wrong.';

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl} — ${err.message}`, err);
  } else {
    logger.warn?.(`${req.method} ${req.originalUrl} — ${statusCode} ${err.message}`);
  }

  return sendError(res, message, statusCode, err.errors || []);
};

/** 404 for anything no route matched — same shape as every other error. */
export const notFoundHandler = (req, res) =>
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);

export default errorHandler;
