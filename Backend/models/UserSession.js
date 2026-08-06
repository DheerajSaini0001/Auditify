import mongoose from 'mongoose';

/**
 * One row per browsing session, keyed by the `sessionId` cookie that
 * middleware/tracking.js already sets for every visitor (signed in or not).
 *
 * Answers "when did this session start and when did it end" without replaying the
 * activity log: a session is opened on first sight, `lastSeenAt` is bumped as the
 * visitor does things, and it is closed either by an explicit SESSION_END beacon
 * (tab closed / logout) or by the idle sweep below.
 *
 * A browser that is killed mid-session never sends the beacon, so `endedAt` alone
 * would leave sessions open forever and make "average session length" grow without
 * bound. `isStale()` + `closeStaleSessions()` give those an end time derived from
 * the last thing the visitor actually did, which is the honest answer.
 */

// A session with no activity for this long is treated as over. 30 minutes is the
// web-analytics convention (GA uses the same), and it matches the point where a
// returning visitor genuinely feels like a new visit.
export const SESSION_IDLE_MS = 30 * 60 * 1000;

const UserSessionSchema = new mongoose.Schema({
  sessionId:  { type: String, required: true, unique: true, index: true },
  // Null while the visitor is signed out. Filled in on login, so a session that
  // starts anonymous and later signs in is ONE session, correctly attributed.
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestEmail: { type: String, default: null },

  ip:      { type: String, default: 'unknown' },
  country: { type: String, default: 'unknown' },
  region:  { type: String, default: 'unknown' },
  city:    { type: String, default: 'unknown' },

  device:    { type: String, default: 'unknown' },
  browser:   { type: String, default: 'unknown' },
  os:        { type: String, default: 'unknown' },
  userAgent: { type: String, default: null },
  screenResolution: { type: String, default: 'unknown' },

  referrer:  { type: String, default: 'direct' },
  entryPage: { type: String, default: '/' },
  exitPage:  { type: String, default: null },

  startedAt:  { type: Date, default: Date.now },
  lastSeenAt: { type: Date, default: Date.now },
  endedAt:    { type: Date, default: null },
  // Filled in when the session is closed, so reporting never has to compute it
  // across two nullable dates.
  durationMs: { type: Number, default: null },
  // How the session ended — useful when a "5 second session" turns out to be an
  // idle sweep on a page the visitor left open, not a real bounce.
  endReason:  { type: String, enum: ['beacon', 'logout', 'idle', null], default: null },

  pageViews:      { type: Number, default: 0 },
  auditsStarted:  { type: Number, default: 0 },
  reportsViewed:  { type: Number, default: 0 },
  reportsDownloaded: { type: Number, default: 0 },
}, { timestamps: true });

UserSessionSchema.index({ userId: 1, startedAt: -1 });
UserSessionSchema.index({ startedAt: -1 });
// The idle sweep scans open sessions only; this keeps that a targeted lookup
// rather than a scan of every session ever recorded.
UserSessionSchema.index({ endedAt: 1, lastSeenAt: 1 });

/**
 * Close every session that has been silent past the idle window.
 *
 * Called opportunistically from the admin analytics endpoints rather than on a
 * timer: session stats are only ever read there, so sweeping on read keeps the
 * numbers correct without adding a background job to a process that already runs
 * audit workers.
 */
UserSessionSchema.statics.closeStaleSessions = async function (now = new Date()) {
  const cutoff = new Date(now.getTime() - SESSION_IDLE_MS);
  const stale = await this.find({ endedAt: null, lastSeenAt: { $lt: cutoff } })
    .select('_id startedAt lastSeenAt')
    .limit(2000); // bounded so one sweep can never stall an admin page load

  if (!stale.length) return 0;

  await this.bulkWrite(
    stale.map((s) => ({
      updateOne: {
        filter: { _id: s._id },
        update: {
          $set: {
            endedAt: s.lastSeenAt,
            endReason: 'idle',
            durationMs: Math.max(0, s.lastSeenAt - s.startedAt),
          },
        },
      },
    }))
  );

  return stale.length;
};

const UserSession = mongoose.model('UserSession', UserSessionSchema);

export default UserSession;
