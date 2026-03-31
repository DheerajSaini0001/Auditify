import express from 'express';
import * as websiteController from '../controllers/websiteController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 4.8.2 Website endpoints (All protected)
router.use(protect);

router.get('/', websiteController.getWebsites);
router.post('/add', websiteController.addWebsite);
router.post('/verify', websiteController.verifyWebsite);
router.post('/sync', websiteController.syncWebsites);
router.delete('/:websiteId', websiteController.removeWebsite);

export default router;
