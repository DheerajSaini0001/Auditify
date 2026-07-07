import express from 'express';
import { body, validationResult } from 'express-validator';
import * as userController from '../controllers/userController.js';
import { startAudit, getReportById } from '../controllers/singleAuditController.js';
import { verifyToken, checkRole } from '../middleware/auth.js';
import captchaValidator from '../middleware/captchaValidator.js';
import { chargeReportBudget } from '../middleware/reportBudget.js';

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

// Audit — same per-IP report budget as the guest surface (5 site runs / 15 min;
// a whole batch counts once), charged only after validation so bad input is free.
router.post('/audit', [
  body('url').isURL({ require_protocol: true }).withMessage('Valid URL with http/https required'),
  body('device').isIn(['Desktop', 'Mobile']).withMessage('Invalid device type'),
  validate,
  captchaValidator,
  chargeReportBudget,
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
