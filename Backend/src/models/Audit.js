// The ONLY MongoDB document for an audit. Touched at most 3 times in its lifetime:
//   1) created  -> status "queued"
//   2) completed -> status "completed" + report
//   3) failed   -> status "failed" + error   (only after all retries exhausted)
import mongoose from "mongoose";
import { env } from "../config/env.js";

const SummarySchema = new mongoose.Schema(
  {
    pagesScanned: { type: Number, default: 0 },
    issuesFound: { type: Number, default: 0 },
    score: { type: Number, default: 0 },
    criticalIssues: { type: Number, default: 0 },
  },
  { _id: false }
);

const ErrorSchema = new mongoose.Schema(
  {
    message: { type: String },
    code: { type: String },
  },
  { _id: false }
);

const AuditSchema = new mongoose.Schema(
  {
    // _id is the UUID we generate, which is ALSO the BullMQ job id.
    _id: { type: String, required: true },

    url: { type: String, required: true },
    options: { type: Object, default: {} }, // { maxPages, checks: [...] }

    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      index: true,
    },

    queuedAt: { type: Date, default: Date.now },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    failedAt: { type: Date, default: null },
    durationMs: { type: Number, default: null },

    report: { type: Object, default: null }, // full report — written once at the end
    summary: { type: SummarySchema, default: () => ({}) },

    error: { type: ErrorSchema, default: null },
    attemptsMade: { type: Number, default: 0 },
  },
  { _id: false, versionKey: false, minimize: false }
);

// Newest-first list view.
AuditSchema.index({ queuedAt: -1 });
// Auto-delete old audits (retention).
AuditSchema.index(
  { queuedAt: 1 },
  { expireAfterSeconds: env.AUDIT_RETENTION_DAYS * 24 * 60 * 60, name: "audit_ttl" }
);

const Audit = mongoose.model("Audit", AuditSchema);
export default Audit;
