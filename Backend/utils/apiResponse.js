/**
 * The one place a response shape is decided (architecture doc §7).
 *
 *   success: { success: true,  message, data }
 *   error:   { success: false, message, errors: [] }
 *
 * This codebase predates the standard and currently answers in three different
 * shapes across ~208 call sites. Rewriting all of them at once would be a breaking
 * change for a live frontend, so the rule adopted here is: every NEW endpoint uses
 * these helpers, and existing ones migrate when they are next touched. The helpers
 * are the only sanctioned way to write a response — a hand-rolled res.json() with a
 * different shape is the thing this exists to prevent.
 */

/** 2xx. `data` is always an object so clients can rely on `data` being present. */
export const sendSuccess = (res, data = {}, statusCode = 200, message = 'Success') =>
  res.status(statusCode).json({ success: true, message, data });

export const sendCreated = (res, data = {}, message = 'Created') =>
  sendSuccess(res, data, 201, message);

/**
 * Non-2xx. `errors` is a flat array of { field?, message } — the shape the Zod
 * validation middleware emits, so a validation failure and a hand-raised error are
 * indistinguishable to the client.
 */
export const sendError = (res, message = 'Something went wrong', statusCode = 500, errors = []) =>
  res.status(statusCode).json({ success: false, message, errors });

/**
 * An error carrying its own HTTP status, so a service can fail meaningfully without
 * importing `res`. The central error handler reads these fields; anything thrown
 * without them is treated as a 500, which is the correct default for a surprise.
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, errors = []) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true; // distinguishes "expected failure" from "bug"
    Error.captureStackTrace?.(this, AppError);
  }
}

/**
 * Wraps an async handler so a rejected promise reaches the error middleware instead
 * of becoming an unhandled rejection. Without this every controller needs its own
 * try/catch whose only job is `next(err)`.
 */
export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default { sendSuccess, sendCreated, sendError, AppError, catchAsync };
