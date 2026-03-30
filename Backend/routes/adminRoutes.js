import express from 'express';
import { param, body, query, validationResult } from 'express-validator';
import * as adminController from '../controllers/adminController.js';
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
], adminController.getAllUsers);

router.get('/users/:id', [
  param('id').isMongoId().withMessage('Invalid user ID format'),
  validate
], adminController.getUserById);

router.post('/users/block', [
  body('userId').isMongoId().withMessage('Invalid user ID format'),
  body('reason').not().isEmpty().withMessage('Reason is required'),
  validate
], adminController.blockUser);

router.post('/users/unblock', [
  body('userId').isMongoId().withMessage('Invalid user ID format'),
  validate
], adminController.unblockUser);

router.delete('/users/:id', [
  param('id').isMongoId().withMessage('Invalid user ID format'),
  validate
], adminController.deleteUser);

router.get('/audit-logs', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1 }),
  query('ip').optional().isString(),
  validate
], adminController.getAuditLogs);

router.get('/stats', adminController.getStats);

export default router;
