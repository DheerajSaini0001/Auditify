import mongoose from "mongoose";

/**
 * One row per audit *journey* — from the moment a visitor asks for an audit to the
 * moment they read or download the resulting report.
 *
 * The lifecycle columns (startedAt → completedAt, status, failureReason) and the
 * outcome columns (reportViewed*, reportDownloaded*) live on this one document on
 * purpose: the admin panel's journey view has to answer "what happened to THIS
 * run" in a single read. Splitting them across collections would turn every row
 * of that table into a join.
 */
const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    // Email a guest verified via the OTP gate before running this audit
    // (null for logged-in users, who are attributed via userId instead).
    guestEmail: {
      type: String,
      default: null,
    },
    sessionId: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      default: "unknown",
    },
    country: {
      type: String,
      default: "unknown",
    },
    region: {
      type: String,
      default: "unknown", // State / Province
    },
    city: {
      type: String,
      default: "unknown",
    },
    device: {
      type: String,
      default: "unknown",
    },
    browser: {
      type: String,
      default: "unknown",
    },
    os: {
      type: String,
      default: "unknown",
    },
    // Raw UA string. Kept alongside the parsed browser/os because a UA we cannot
    // parse today (a new browser, a bot) is still worth having verbatim when an
    // admin is trying to work out who ran something.
    userAgent: {
      type: String,
      default: null,
    },
    screenResolution: {
      type: String,
      default: "unknown",
    },
    url: {
      type: String,
      required: true,
    },
    // What the detector decided this site is — the "website category" column in
    // the admin journey table. Stored on the log rather than read through to the
    // report because a report can be deleted (or never written, for a run that
    // failed early) while the journey row must still say what was audited.
    siteType: {
      type: String,
      default: null, // 'dealer' | 'service' | 'corporate' | null
    },
    siteSubType: {
      type: String,
      default: null, // 'franchise' | 'independent' | 'service' | 'repair' | null
    },
    // Which page category (home / VDP / SRP / …) this particular run targeted.
    pageType: {
      type: String,
      default: null,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SingleAuditReport",
      default: null,
    },
    reportType: {
      type: String,
      default: "All",
    },
    score: {
      type: Number,
      default: null,
    },
    grade: {
      type: String,
      default: null,
    },
    /**
     * `pending` is kept as the default for backwards compatibility with rows
     * written before the queue existed — every historical row uses it, and the
     * admin filters treat pending/queued/running together as "in flight".
     */
    status: {
      type: String,
      enum: ["success", "failed", "pending", "queued", "running", "cancelled"],
      default: "pending",
    },
    // Why a failed run failed, in the worker's own words. Powers the "failed
    // audits and their reasons" breakdown — a failure count with no reason tells
    // an admin something is wrong but not what.
    failureReason: {
      type: String,
      default: null,
    },
    // Explicit lifecycle stamps. createdAt is when the row was written, which is
    // *not* the same as when the audit actually began work: a queued run can wait
    // minutes for a slot, and charging that wait to the audit's duration makes the
    // "average completion time" metric meaningless.
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    auditDuration: {
      type: Number,
      default: null, // in milliseconds
    },
    // Time spent waiting for an audit slot before the worker started, in ms.
    queueWaitMs: {
      type: Number,
      default: null,
    },
    // ── Outcome: did anyone actually look at what we produced? ──
    reportViewed: {
      type: Boolean,
      default: false,
    },
    reportViewedAt: {
      type: Date,
      default: null,
    },
    reportViewCount: {
      type: Number,
      default: 0,
    },
    reportDownloaded: {
      type: Boolean,
      default: false,
    },
    reportDownloadedAt: {
      type: Date,
      default: null,
    },
    reportDownloadCount: {
      type: Number,
      default: 0,
    },
    referrer: {
      type: String,
      default: "direct",
    },
    entryPage: {
      type: String,
      default: "/",
    },
    exitPage: {
      type: String,
      default: null,
    },
    actions: {
      type: [String],
      default: [],
    },
    captchaPassed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
auditLogSchema.index({ ip: 1 });
auditLogSchema.index({ sessionId: 1 });
auditLogSchema.index({ createdAt: -1 });
// The admin analytics queries all filter or group by these, over the whole
// collection. Without them every dashboard load is a collection scan.
auditLogSchema.index({ status: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ country: 1 });
auditLogSchema.index({ url: 1 });
// Lets the completion handler find the row it needs to close out by report id.
auditLogSchema.index({ reportId: 1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
