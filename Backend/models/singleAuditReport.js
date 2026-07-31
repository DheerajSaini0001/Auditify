import mongoose from "mongoose";

// How long finished reports live in Mongo before the TTL monitor deletes them.
// This bound IS the reuse window: startAudit serves a matching completed report
// straight from Mongo instead of re-running the ~90-CPU-s audit, so a longer TTL
// means repeat audits of the same url/device answer in ~1s. Was 3h (field-level
// `expires: 10800`); now 24h, overridable via AUDIT_REPORT_TTL_SECONDS (min 10min).
// NOTE: Mongo never updates expireAfterSeconds on its own — the change is applied
// by SingleAuditReport.syncIndexes() at server boot (see server.js).
const envTtl = parseInt(process.env.AUDIT_REPORT_TTL_SECONDS ?? "", 10);
export const REPORT_TTL_SECONDS =
  Number.isFinite(envTtl) && envTtl >= 600 ? envTtl : 86400;

const SiteReportSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    report: { type: String, required: true },
    device: { type: String, required: true },
    status: { type: String, default: 'inprogress' },
    pageType: { type: String, default: null },
    siteType: { type: String, default: null },
    siteSchema: { type: Array, default: null },
    timeTaken: { type: String, default: null },
    score: { type: Number, default: null },
    grade: { type: String, default: null },
    aioCompatibilityBadge: { type: String, default: null },
    sectionScore: { type: Array, default: null },
    technicalPerformance: { type: Object, default: null },
    onPageSEO: { type: Object, default: null },
    accessibility: { type: Object, default: null },
    securityOrCompliance: { type: Object, default: null },
    UXOrContentStructure: { type: Object, default: null },
    conversionAndLeadFlow: { type: Object, default: null },
    aioReadiness: { type: Object, default: null },
    aeo: { type: Object, default: null },
    // Set only on merged (multi-sample averaged) reports: how many sample
    // reports were averaged in. Lets a repeat audit reuse the merged report
    // and still show the "avg of N" badge.
    // Stage 2 Multi-Page Crawl fields
    stage1Completed: { type: Boolean, default: false },
    stage2Completed: { type: Boolean, default: false },
    stage2Progress: { type: String, default: null },
    crawledPagesCount: { type: Number, default: 0 },
    crawledPagesSummary: { type: Array, default: [] },
    mergedFrom: { type: Number, default: null },
    isBotProtected: { type: Boolean, default: false },
    isDealership: { type: Boolean, default: null },
    dealershipDetection: { type: Object, default: null },
    error: { type: String, default: null },
    screenshot: { type: String, default: null },
    screenshotUrl: { type: String, default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now },
  }
);

// Partial Unique Index to prevent multiple SUCCESSFUL or IN-PROGRESS audits for the same target
// This allows re-auditing if current record is 'failed'
SiteReportSchema.index(
  { url: 1, device: 1, report: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $ne: 'failed' } }
  }
);

// Report TTL — declared as an explicit index (not field-level `expires`) so that
// syncIndexes() can detect a changed REPORT_TTL_SECONDS on an existing collection,
// drop the stale index and recreate it with the new expireAfterSeconds.
SiteReportSchema.index({ createdAt: 1 }, { expireAfterSeconds: REPORT_TTL_SECONDS });

const SingleAuditReport = mongoose.model("SingleAuditReport", SiteReportSchema);
export default SingleAuditReport;
