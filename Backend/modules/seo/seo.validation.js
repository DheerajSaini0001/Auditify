import validate from '../../middleware/validate.js';
import * as schema from './seo.schema.js';

/**
 * Per-route validation middleware for the SEO module (architecture doc §3 — the
 * `validation` file of the six).
 *
 * seo.schema.js declares the DATA SHAPES; this file binds them to routes. Keeping
 * them apart means a shape can be reused outside HTTP — a seeding script or a job
 * can import `seoBlockSchema` and validate without dragging Express middleware in.
 *
 * Routes import only from here, so a route file never has to know which request
 * parts a given endpoint validates.
 */

export const validateList = validate({ query: schema.listQuery });

export const validateCreate = validate({ body: schema.createPageBody });

export const validateImport = validate({ body: schema.importBody });

export const validateIdParam = validate({ params: schema.idParam });

export const validateUpdate = validate({
  params: schema.idParam,
  body: schema.updateSeoBody,
});

export const validateRollback = validate({ params: schema.rollbackParams });

export const validatePublicMeta = validate({ query: schema.publicMetaQuery });

export default {
  validateList,
  validateCreate,
  validateImport,
  validateIdParam,
  validateUpdate,
  validateRollback,
  validatePublicMeta,
};
