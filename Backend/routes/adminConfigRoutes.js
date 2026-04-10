import express from 'express';
import { getConfigs, updateConfig, getConfigAuditLogs } from '../controllers/adminConfigController.js';
import { protect, isSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require Super Admin
router.use(protect);
router.use(isSuperAdmin);

router.get('/', getConfigs);
router.put('/', updateConfig);
router.get('/logs', getConfigAuditLogs);

export default router;
