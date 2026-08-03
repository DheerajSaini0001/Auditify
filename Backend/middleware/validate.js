import { ZodError } from 'zod';
import { sendError } from '../utils/apiResponse.js';

/**
 * Route-level input validation (architecture doc §6).
 *
 * Usage:
 *   router.post('/pages', validate({ body: createPageSchema }), createPage)
 *
 * Validation runs BEFORE the controller, so a controller never has to ask whether
 * its input is shaped correctly — by the time it runs, it is. Parsed output is
 * written back onto the request, so Zod's coercion and defaults actually take
 * effect rather than being computed and thrown away.
 */
const validate = (schemas = {}) => (req, res, next) => {
  try {
    for (const key of ['body', 'query', 'params']) {
      if (!schemas[key]) continue;
      const parsed = schemas[key].parse(req[key]);
      // req.query and req.params are getter-only on newer Express, so assigning
      // straight to them throws. Redefining the property is the supported way.
      Object.defineProperty(req, key, { value: parsed, writable: true, configurable: true });
    }
    return next();
  } catch (err) {
    if (err instanceof ZodError) {
      // Flatten to the { field, message } shape sendError already promises, so a
      // client parses validation failures the same way as any other error.
      const errors = err.issues.map((i) => ({
        field: i.path.join('.') || '(root)',
        message: i.message,
      }));
      return sendError(res, 'Validation failed', 400, errors);
    }
    return next(err);
  }
};

export default validate;
