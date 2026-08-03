import express from 'express';
import * as ctrl from './seo.controller.js';
import { verifyToken, checkRole } from '../../middleware/auth.js';
import * as v from './seo.validation.js';

const router = express.Router();

/**
 * @openapi
 * /api/v1/seo/public/page-meta:
 *   get:
 *     tags: [SEO]
 *     summary: Published SEO metadata for a path (public)
 *     parameters:
 *       - in: query
 *         name: path
 *         schema: { type: string, default: '/' }
 *     responses:
 *       200: { description: Metadata, or meta:null when the path is not CMS-managed }
 */
// Public and mounted BEFORE the guards — this is what serves an editor's title and
// description to real visitors. Published entries only, and never the raw scripts.
router.get('/public/page-meta', v.validatePublicMeta, ctrl.getPublicPageMeta);

// Everything below is super_admin only, matching the /seo route guard and the
// sidebar entry. The API is the real boundary — a hidden link is not access control.
router.use(verifyToken);
router.use(checkRole('super_admin'));

/**
 * @openapi
 * /api/v1/seo/summary:
 *   get:
 *     tags: [SEO]
 *     summary: Aggregate SEO health across all managed pages
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Average score, page counts, indexed/missing-meta totals }
 *       403: { description: Not a super_admin }
 */
router.get('/summary', ctrl.getSummary);

/**
 * @openapi
 * /api/v1/seo/pages:
 *   get:
 *     tags: [SEO]
 *     summary: List managed pages
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: search, schema: { type: string } }
 *       - { in: query, name: status, schema: { type: string, enum: [draft, scheduled, published, archived] } }
 *       - { in: query, name: sort,   schema: { type: string, enum: [title, updated, status] } }
 *       - { in: query, name: page,   schema: { type: integer, default: 1 } }
 *       - { in: query, name: limit,  schema: { type: integer, default: 25, maximum: 100 } }
 *     responses:
 *       200: { description: Paginated pages, each with a derived seoScore }
 *   post:
 *     tags: [SEO]
 *     summary: Create a draft page
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201: { description: Created }
 *       400: { description: Validation failed }
 */
router.get('/pages', v.validateList, ctrl.listPages);
router.post('/pages', v.validateCreate, ctrl.createPage);

/**
 * @openapi
 * /api/v1/seo/pages/import:
 *   post:
 *     tags: [SEO]
 *     summary: Seed the CMS from the site's route table
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200: { description: Created and skipped paths }
 */
router.post('/pages/import', v.validateImport, ctrl.importRoutes);

/**
 * @openapi
 * /api/v1/seo/pages/{id}:
 *   get:
 *     tags: [SEO]
 *     summary: One page with its score, checklist and keyword presence
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Page }
 *       404: { description: Not found }
 *   put:
 *     tags: [SEO]
 *     summary: Update the seo block only
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Saved, with the recomputed score }
 *       400: { description: Validation failed }
 *   delete:
 *     tags: [SEO]
 *     summary: Soft-delete a page
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Deleted }
 */
router.get('/pages/:id', v.validateIdParam, ctrl.getPage);
router.put('/pages/:id', v.validateUpdate, ctrl.updatePageSeo);
router.delete('/pages/:id', v.validateIdParam, ctrl.deletePage);

/**
 * @openapi
 * /api/v1/seo/pages/{id}/revisions:
 *   get:
 *     tags: [SEO]
 *     summary: Revision timeline, newest first
 *     security: [{ bearerAuth: [] }]
 *     parameters: [{ in: path, name: id, required: true, schema: { type: string } }]
 *     responses:
 *       200: { description: Revisions }
 * /api/v1/seo/pages/{id}/rollback/{version}:
 *   post:
 *     tags: [SEO]
 *     summary: Restore the seo block from a version (appends a new ROLLBACK version)
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: string } }
 *       - { in: path, name: version, required: true, schema: { type: integer } }
 *     responses:
 *       200: { description: Rolled back }
 *       404: { description: Version no longer exists }
 */
router.get('/pages/:id/revisions', v.validateIdParam, ctrl.listRevisions);
router.post('/pages/:id/rollback/:version', v.validateRollback, ctrl.rollbackPage);

export default router;
