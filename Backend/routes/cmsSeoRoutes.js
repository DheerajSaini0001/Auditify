import express from 'express';
import {
  getSummary,
  listPages,
  getPage,
  updatePageSeo,
  createPage,
} from '../controllers/cms/seoController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

// super_admin only, matching the sidebar entry and the /seo route guard. Gating the
// UI alone would be cosmetic — the API is the real boundary, and anyone can type a
// URL or curl an endpoint.
//
// To open this up to admins or editors later, widen this one line; the controller
// already scopes a non-privileged caller to the entries they authored.
router.use(verifyToken);
router.use(checkRole('super_admin'));

router.get('/summary', getSummary);

router.get('/pages', listPages);
router.post('/pages', createPage);
router.get('/pages/:id', getPage);
router.put('/pages/:id', updatePageSeo);

export default router;
