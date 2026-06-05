import express from 'express';
import { param, body, query, validationResult } from 'express-validator';
import {
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  deleteUser,
  getAuditLogs,
  getStats,
  getOverviewStats
} from '../controllers/adminController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: errors.array() });
  }
  next();
};

// Global admin middleware
router.use(verifyToken);
router.use(checkRole('admin'));

router.get('/users', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  validate
], getAllUsers);

router.get('/users/:id', [
  param('id').isMongoId().withMessage('Invalid user ID format'),
  validate
], getUserById);

router.post('/users/block', [
  body('userId').isMongoId().withMessage('Invalid user ID format'),
  body('reason').not().isEmpty().withMessage('Reason is required'),
  validate
], blockUser);

router.post('/users/unblock', [
  body('userId').isMongoId().withMessage('Invalid user ID format'),
  validate
], unblockUser);

router.delete('/users/:id', [
  param('id').isMongoId().withMessage('Invalid user ID format'),
  validate
], deleteUser);

router.get('/audit-logs', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1 }),
  query('ip').optional().isString(),
  validate
], getAuditLogs);

router.get('/stats', getStats);
router.get('/overview-stats', getOverviewStats);

// NOTE: Platform configuration routes live ONLY in adminConfigRoutes.js, guarded by
// isSuperAdmin. They were removed from here because this router is mounted at /api/admin
// and only requires the 'admin' role — keeping /config here let a plain admin read/overwrite
// super-admin-only secrets (e.g. JWT_SECRET) via route shadowing.

export default router;
