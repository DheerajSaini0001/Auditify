import express from 'express';
import {
  getSummary,
  listPages,
  getPage,
  updatePageSeo,
  createPage,
  deletePage,
  listRevisions,
  rollbackPage,
  getPublicPageMeta,
  importRoutes,
} from '../controllers/cms/seoController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// Public, unauthenticated, and deliberately mounted BEFORE the guards below —
// this is what serves an editor's title/description to actual visitors. It only
// ever returns published entries, and never the raw header/footer scripts.
router.get('/public/page-meta', getPublicPageMeta);

// Everything past this point is super_admin only, matching the sidebar entry and
// the /seo route guard. Gating the UI alone would be cosmetic — the API is the real
// boundary, and anyone can type a URL or curl an endpoint.
//
// To open this up to admins or editors later, widen this one line; the controller
// already scopes a non-privileged caller to the entries they authored.
router.use(verifyToken);
router.use(checkRole('super_admin'));

router.get('/summary', getSummary);

router.get('/pages', listPages);
router.post('/pages', createPage);
router.post('/pages/import', importRoutes);
router.get('/pages/:id', getPage);
router.put('/pages/:id', updatePageSeo);
router.delete('/pages/:id', deletePage);

router.get('/pages/:id/revisions', listRevisions);
router.post('/pages/:id/rollback/:version', rollbackPage);

export default router;
