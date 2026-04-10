import express from 'express';
import { body, validationResult } from 'express-validator';
import * as userController from '../controllers/userController.js';
import { startAudit, getReportById } from '../controllers/singleAuditController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';
import captchaValidator from '../middleware/captchaValidator.js';

const router = express.Router();

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: 'Validation failed', code: 'VALIDATION_ERROR', details: errors.array() });
  }
  next();
};

// Global user middleware
router.use(verifyToken);
router.use(checkRole('user', 'admin'));

// Audit
router.post('/audit', [
  body('url').isURL({ require_protocol: true }).withMessage('Valid URL with http/https required'),
  body('device').isIn(['Desktop', 'Mobile']).withMessage('Invalid device type'),
  validate,
  captchaValidator,
], startAudit);

router.get('/report/:singleAuditId', getReportById);

// History & Activity
router.get('/history', userController.getHistory);
router.get('/activity', userController.getActivity);

// Profile
router.put('/profile', [
  body('name').trim().isLength({ min: 2, max: 100 }).escape(),
  validate
], userController.updateProfile);

export default router;
