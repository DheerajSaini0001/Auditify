import mongoose from 'mongoose';

/**
 * Append-only log of everything a visitor does — the "Activity Logs" surface in
 * the admin panel.
 *
 * Two deliberate departures from the original shape:
 *
 *  1. `userId` is OPTIONAL. It used to be required, which meant every guest
 *     action was silently dropped: the create() rejected, the .catch() swallowed
 *     it, and the log showed only signed-in traffic. Most audits on this platform
 *     are run signed-out, so that was most of the activity.
 *  2. Actions carry a `status`. An action that failed (a rejected audit, a failed
 *     login, a download that errored) is exactly what an admin is looking for, and
 *     a log that only records successes cannot show it.
 */

// Every action the tracker may write. Kept as a named export so the public
// tracking endpoint can whitelist against the same list the schema enforces —
// otherwise a client could invent action names and pollute the log.
export const ACTIVITY_ACTIONS = [
  // auth / account
  'LOGIN', 'LOGOUT', 'REGISTER', 'FAILED_LOGIN', 'PROFILE_UPDATE',
  // admin actions
  'BLOCKED', 'UNBLOCKED', 'ROLE_CHANGED',
  // audit journey
  'AUDIT_BUTTON_CLICK', 'AUDIT_DISCOVER', 'AUDIT_RUN', 'AUDIT_RUN_CACHED',
  'AUDIT_QUEUED', 'AUDIT_COMPLETED', 'AUDIT_FAILED', 'AUDIT_CANCELLED',
  // report outcomes
  'REPORT_VIEW', 'REPORT_DOWNLOAD',
  // session lifecycle
  'SESSION_START', 'SESSION_END', 'PAGE_VIEW',
];

const ActivityLogSchema = new mongoose.Schema({
  // Optional — a guest has no account, and their activity is still activity.
  // Attributed by sessionId (+ guestEmail when they gave us one) instead.
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestEmail: { type: String, default: null },
  sessionId:  { type: String, required: true },   // uuid.v4() generated per login
  ip:         { type: String, required: true },
  country:    { type: String, default: 'unknown' },
  region:     { type: String, default: 'unknown' },
  city:       { type: String, default: 'unknown' },
  device:     { type: String },                   // 'Desktop' | 'Mobile' | 'Tablet'
  browser:    { type: String },                   // e.g. 'Chrome 123'
  os:         { type: String },                   // e.g. 'Windows 11'
  userAgent:  { type: String, default: null },
  // The URL the action was about (the audited site, the report opened, …) —
  // not the API path. Lets the log be searched the way admins actually ask:
  // "everything that ever happened to example.com".
  url:        { type: String, default: null },
  action: {
    type: String,
    enum: ACTIVITY_ACTIONS,
    required: true
  },
  status: {
    type: String,
    enum: ['SUCCESS', 'FAILURE'],
    default: 'SUCCESS'
  },
  // Present when status is FAILURE — what actually went wrong.
  errorMessage: { type: String, default: null },
  metadata:  { type: mongoose.Schema.Types.Mixed },  // extra context per action
  timestamp: { type: Date, default: Date.now }
}, { timestamps: false });

ActivityLogSchema.index({ userId: 1, timestamp: -1 });
ActivityLogSchema.index({ action: 1, timestamp: -1 });
ActivityLogSchema.index({ ip: 1 });
ActivityLogSchema.index({ sessionId: 1, timestamp: -1 });
ActivityLogSchema.index({ timestamp: -1 });
ActivityLogSchema.index({ status: 1 });

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

export default ActivityLog;
