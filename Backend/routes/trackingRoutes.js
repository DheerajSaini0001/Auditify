import express from 'express';
import rateLimit from 'express-rate-limit';
import { trackEvent, heartbeat } from '../controllers/trackingController.js';
import { tryAuthenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * Analytics beacons are unauthenticated by necessity — guests generate most of
 * the traffic this dashboard exists to measure. The cap is therefore generous
 * (a busy tab legitimately fires page views, a button click, a report view and a
 * heartbeat within a minute of each other) but finite, so a script cannot flood
 * the activity log from one IP. An office behind one NAT must not be silenced,
 * which is why this is ~4x the global POST budget rather than tighter.
 */
const trackingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, error: 'Too many events' },
  standardHeaders: true,
  legacyHeaders: false,
});

// tryAuthenticate, not verifyToken: a bearer token attributes the event to the
// account, but its absence just means "guest" rather than a rejection.
router.post('/event', trackingLimiter, tryAuthenticate, trackEvent);
router.post('/heartbeat', trackingLimiter, tryAuthenticate, heartbeat);

export default router;
