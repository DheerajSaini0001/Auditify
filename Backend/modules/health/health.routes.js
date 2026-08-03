import express from 'express';
import mongoose from 'mongoose';
import { sendSuccess, sendError } from '../../utils/apiResponse.js';

const router = express.Router();

const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     tags: [System]
 *     summary: Liveness and dependency check
 *     responses:
 *       200: { description: Healthy — database reachable }
 *       503: { description: Degraded — database unreachable }
 */
// Reports 503 rather than 200 when Mongo is down, so an orchestrator can act on it.
// A health check that returns 200 while its database is unreachable is worse than
// having none: it converts an outage into a silent one.
router.get('/health', async (req, res) => {
  const state = mongoose.connection?.readyState ?? 0;
  const connected = state === 1;

  let ping = null;
  if (connected) {
    try {
      const started = Date.now();
      await mongoose.connection.db.admin().ping();
      ping = Date.now() - started;
    } catch {
      return sendError(res, 'Database ping failed', 503, [{ field: 'database', message: 'ping failed' }]);
    }
  }

  const payload = {
    status: connected ? 'ok' : 'degraded',
    uptimeSeconds: Math.round(process.uptime()),
    database: { state: STATES[state] || 'unknown', pingMs: ping },
  };

  return connected
    ? sendSuccess(res, payload, 200, 'Healthy')
    : sendError(res, 'Database unavailable', 503, [{ field: 'database', message: STATES[state] || 'unknown' }]);
});

export default router;
