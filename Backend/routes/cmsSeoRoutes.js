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

// Authenticated surface only — there is no guest path into content editing.
// The controller narrows further: a plain 'user' sees and edits only entries they
// authored, while admin/super_admin see every entry.
router.use(verifyToken);
router.use(checkRole('user', 'admin', 'super_admin'));

router.get('/summary', getSummary);

router.get('/pages', listPages);
router.post('/pages', createPage);
router.get('/pages/:id', getPage);
router.put('/pages/:id', updatePageSeo);

export default router;
