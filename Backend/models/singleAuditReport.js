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
    // "franchise" | "independent" | "service" | "repair" | "corporate".
    // Keys parameter applicability and the section-weight tilt — see
    // config/siteTypeProfiles.js. Null on reports created before site sub-type
    // detection existed, which the scoring path reads as "no profile" and
    // scores exactly as it did then.
    siteSubType: { type: String, default: null },
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
    // True while the report is showing a provisional score (seven pillars scored,
    // PageSpeed/Technical still running). Always false by the time a report is
    // flushed to Mongo — persisted only so the field survives the schema's strict mode.
    psiPending: { type: Boolean, default: false },
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
    // Where to send the "your audit is ready" mail. A multi-page run takes long
    // enough that the visitor is told to leave the page, so the result has to be
    // able to reach them. Null for single-page runs, which finish while they wait.
    notifyEmail: { type: String, default: null },
    notifiedAt: { type: Date, default: null },
    // Market the visitor selected on the audit form (ISO alpha-2, or "OTHER").
    // This is the INPUT to market resolution, not the outcome — see `market`.
    country: { type: String, default: null },
    // The market whose norms this run was actually scored against, and the
    // evidence behind that choice. `market` drives which locale pack every
    // check compares against (config/locale/), so it must be stored with the
    // report: a re-render months later has to explain the same jurisdiction it
    // originally scored, and a US and an AU report of the same URL are two
    // legitimately different documents.
    market: { type: String, default: null },
    marketResolution: { type: mongoose.Schema.Types.Mixed, default: null },
    // Opening ETA, fixed at creation from how many key pages this run will crawl.
    // The status endpoint switches to extrapolating from real elapsed time as soon
    // as there is progress to extrapolate from.
    plannedPages: { type: Number, default: 1 },
    estimatedSeconds: { type: Number, default: null },
    createdAt: { type: Date, default: Date.now },
  }
);

// Every non-terminal-failure status a report can hold. Mongo does NOT support $ne
// (or $not) inside a partialFilterExpression — it rejects the whole index spec with
// "Expression not supported in partial index" — so "anything but failed" has to be
// spelled out as an $in list.
//
// ⚠️ Keep this in sync with everything that writes `status` on a report:
//   utils/puppeteer_cheerio.js  → launching, navigating, waiting_for_render,
//                                 screenshot_ready, extracting_data
//   utils/auditStore.js         → inprogress (also the schema default), completed
//   controllers/singleAuditController.js → queued
//   workers/singleAuditWorker.js        → completed, failed
// A status missing from this list silently drops those reports OUT of the unique
// index — the dedupe backstop stops covering exactly the state it exists to protect.
export const ACTIVE_REPORT_STATUSES = [
  "inprogress",
  "queued",
  "launching",
  "navigating",
  "waiting_for_render",
  "screenshot_ready",
  "extracting_data",
  "completed",
];

// Partial Unique Index to prevent multiple SUCCESSFUL or IN-PROGRESS audits for the same target
// This allows re-auditing if current record is 'failed'
//
// `market` is part of the key because it is part of what makes a run distinct:
// the same URL scored against US norms and against Australian norms compares
// against different reference lists and produces a different score, so both must
// be able to exist at once. Without it the second market's insert fails with a
// duplicate-key error — and the dedupe in singleAuditController would have
// served the first market's report anyway.
//
// Reports written before this field existed have no `market` and index as null,
// which is a distinct key from "US"/"AU" — so they never collide with new runs.
SiteReportSchema.index(
  { url: 1, device: 1, report: 1, market: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ACTIVE_REPORT_STATUSES } }
  }
);

// Report TTL — declared as an explicit index (not field-level `expires`) so that
// syncIndexes() can detect a changed REPORT_TTL_SECONDS on an existing collection,
// drop the stale index and recreate it with the new expireAfterSeconds.
SiteReportSchema.index({ createdAt: 1 }, { expireAfterSeconds: REPORT_TTL_SECONDS });

const SingleAuditReport = mongoose.model("SingleAuditReport", SiteReportSchema);
export default SingleAuditReport;
