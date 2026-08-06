import express from 'express';
import { param, body, query, validationResult } from 'express-validator';
import { 
  getAllUsers,
  getUserById,
  blockUser,
  unblockUser,
  deleteUser,
  updateUserRole,
  getAuditLogs,
  exportAuditLogs,
  getStats,
  getOverviewStats,
  getConfigs,
  saveConfig,
  testConfig,
  revealConfig
} from '../controllers/adminController.js';
import {
  getRegistrationAnalytics,
  getAuditActivity,
  getDashboardAnalytics,
  getJourneys,
  getJourneyDetail,
  exportJourneys,
  getActivityLogs,
  exportActivityLogs,
  getReportLeads,
  exportReportLeads,
  getSessions,
  getUserJourney
} from '../controllers/analyticsController.js';
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

// Appoint / remove an admin. SUPER-ADMIN ONLY — note the router-level
// checkRole('admin') above also admits super_admins (see middleware/auth.js), so
// this route needs its own stricter gate or any admin could appoint peers.
router.patch('/users/:id/role', [
  checkRole('super_admin'),
  param('id').isMongoId().withMessage('Invalid user ID format'),
  body('role').isIn(['user', 'admin']).withMessage("Role must be 'user' or 'admin'"),
  validate
], updateUserRole);

// CSV export of the same list, with the same filters — see exportAuditLogs.
router.get('/audit-logs/export', [
  query('from').optional().isISO8601().withMessage('from must be a date'),
  query('to').optional().isISO8601().withMessage('to must be a date'),
  validate
], exportAuditLogs);

router.get('/audit-logs', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1 }),
  query('ip').optional().isString(),
  query('from').optional().isISO8601().withMessage('from must be a date'),
  query('to').optional().isISO8601().withMessage('to must be a date'),
  validate
], getAuditLogs);

router.get('/stats', getStats);
router.get('/overview-stats', getOverviewStats);

// ── Analytics & tracking ──────────────────────────────────────────────────────
// Every one of these takes the same range shape: ?range=7d|30d|90d|365d|all, or an
// explicit ?from=&to= which wins over the preset (see analyticsController.resolveRange).

const rangeValidators = [
  query('range').optional().isIn(['7d', '30d', '90d', '365d', 'all']),
  query('from').optional().isISO8601().withMessage('from must be a date'),
  query('to').optional().isISO8601().withMessage('to must be a date'),
  validate,
];

router.get('/analytics/registrations', rangeValidators, getRegistrationAnalytics);
router.get('/analytics/audit-activity', rangeValidators, getAuditActivity);
router.get('/analytics/dashboard', rangeValidators, getDashboardAnalytics);

// The export routes are declared BEFORE their `/:id` siblings — Express matches in
// order, so `/journeys/export` would otherwise be swallowed by `/journeys/:id` and
// arrive at getJourneyDetail with id="export".
router.get('/journeys/export', [
  query('from').optional().isISO8601().withMessage('from must be a date'),
  query('to').optional().isISO8601().withMessage('to must be a date'),
  validate
], exportJourneys);

router.get('/journeys', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('from').optional().isISO8601().withMessage('from must be a date'),
  query('to').optional().isISO8601().withMessage('to must be a date'),
  validate
], getJourneys);

router.get('/journeys/:id', [
  param('id').isMongoId().withMessage('Invalid journey ID format'),
  validate
], getJourneyDetail);

router.get('/activity-logs/export', [
  query('from').optional().isISO8601().withMessage('from must be a date'),
  query('to').optional().isISO8601().withMessage('to must be a date'),
  validate
], exportActivityLogs);

router.get('/activity-logs', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('from').optional().isISO8601().withMessage('from must be a date'),
  query('to').optional().isISO8601().withMessage('to must be a date'),
  validate
], getActivityLogs);

// Report leads — the name/email pairs captured by the emailed-report flow.
router.get('/report-leads/export', [
  query('from').optional().isISO8601().withMessage('from must be a date'),
  query('to').optional().isISO8601().withMessage('to must be a date'),
  validate
], exportReportLeads);

router.get('/report-leads', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('from').optional().isISO8601().withMessage('from must be a date'),
  query('to').optional().isISO8601().withMessage('to must be a date'),
  query('delivered').optional().isIn(['true', 'false']),
  validate
], getReportLeads);

router.get('/sessions', [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  validate
], getSessions);

router.get('/users/:id/journey', [
  param('id').isMongoId().withMessage('Invalid user ID format'),
  validate
], getUserJourney);

// ── Platform Configuration Routes ──
router.get('/config', getConfigs);
router.post('/config', saveConfig);
router.get('/config/:key/reveal', revealConfig);
router.post('/config/test', testConfig);

export default router;
