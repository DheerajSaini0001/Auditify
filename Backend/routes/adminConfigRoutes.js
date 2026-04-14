import express from 'express';
import {
  getConfigs,
  updateConfig,
  deleteConfig,
  getConfigAuditLogs,
  revealConfig,
  getConfigHistory,
  rollbackConfig,
  refreshCache,
  bulkImport
} from '../controllers/adminConfigController.js';
import { protect, isSuperAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// ── All routes require Super Admin authentication ───────────────────
router.use(protect);
router.use(isSuperAdmin);

// ── Fixed-path routes (must come before parameterized routes) ───────
router.get('/logs', getConfigAuditLogs);
router.post('/refresh', refreshCache);
router.post('/bulk', bulkImport);

// ── Core CRUD ───────────────────────────────────────────────────────
router.get('/', getConfigs);
router.put('/', updateConfig);
router.delete('/:key', deleteConfig);

// ── Version history, rollback & reveal ──────────────────────────────
router.get('/:key/reveal', revealConfig);
router.get('/:key/history', getConfigHistory);
router.post('/:key/rollback', rollbackConfig);

export default router;
