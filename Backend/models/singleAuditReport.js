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

// Canonical `scopeKey` values (see the field's comment on the schema below).
// "full" is the unrestricted crawl; "home" is the single page the visitor typed,
// which is what the client's DEFAULT_PAGE_SCOPES (["home"]) resolves to.
export const FULL_SITE_SCOPE_KEY = "full";
export const SINGLE_PAGE_SCOPE_KEY = "home";

/**
 * The scope key for a run, from its normalized pageScopes list.
 *
 * Sorted before joining so ["srp","home"] and ["home","srp"] are the SAME run —
 * two orderings of one selection must not become two reports (and two audits).
 * A null/empty list is "no restriction", which is the widest run there is.
 *
 * This is the single definition of the value: the dedupe filter, the in-memory
 * store and the unique index all have to agree on it, and the last time two of
 * them disagreed about what "the same target" means, reports were lost to E11000
 * on flush (see the index comment below).
 */
export const scopeKeyFor = (pageScopes) =>
  Array.isArray(pageScopes) && pageScopes.length
    ? [...pageScopes].sort().join("+")
    : FULL_SITE_SCOPE_KEY;

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
    // Set on a KEY-PAGE (child) report: the run that fanned out to it. The parent
    // already lists its children in crawledPagesSummary; this is the same edge read
    // the other way, and it is what lets a child report answer "which run am I part
    // of" on its own — the audit summary is addressed by the root report id, so
    // without it a key page opened directly (an admin from Journeys, a shared link)
    // has no route back to the run it belongs to. Null on a root/single-page report.
    parentReportId: { type: mongoose.Schema.Types.ObjectId, default: null },
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
    // Set ONLY on a delivery that actually succeeded. It used to be stamped
    // optimistically, before the send, so a run whose mail bounced looked forever
    // after exactly like one that arrived — and "the audit finished but nothing
    // came" had no evidence left to answer it with.
    notifiedAt: { type: Date, default: null },
    // Why the mail did not go out, when it didn't. The send sites swallow their
    // failures on purpose (a dead relay must not take an audit down), so this is
    // the one place that failure survives for anyone to find later.
    notifyError: { type: String, default: null },
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
    // WHICH PAGES this run covers — the other half of a report's identity, next to
    // `report` (which names which SECTIONS run). "full" is an unrestricted crawl of
    // every key page discovery finds; anything else is the sorted list of page types
    // the visitor kept ticked, so a "this page only" run is "home".
    //
    // It is stored, and it is in the unique index, because it changes what the report
    // IS: a full-site run carries a crawledPagesSummary row per key page, a
    // single-page run carries none. Without it both runs shared one identity, and a
    // "this page only" request for a URL that already had a completed full-site
    // report was handed that full-site report straight out of the dedupe — for the
    // whole 24h TTL, and in the other direction too (a full-site request served a
    // single-page report, i.e. asking for more and silently getting less).
    //
    // Reports written before this existed have no field at all and index as null,
    // which is a distinct key from "full"/"home" — they are re-audited rather than
    // served under a scope they were never actually run at.
    scopeKey: { type: String, default: null },
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
// ⚠️ THIS KEY MUST MATCH THE DEDUPE FILTER in singleAuditController.startAudit
// exactly. Every field the dedupe scopes by has to be in here, or the two
// disagree about what "the same target" means — and a run the dedupe waved
// through then fails its insert with E11000 and is LOST (auditStore.flush can
// only keep a report Mongo is willing to accept).
//
// `market` is part of the key because it is part of what makes a run distinct:
// the same URL scored against US norms and against Australian norms compares
// against different reference lists and produces a different score, so both must
// be able to exist at once. Without it the second market's insert fails with a
// duplicate-key error — and the dedupe in singleAuditController would have
// served the first market's report anyway.
//
// `userId` is here for the same reason, learned the hard way: the dedupe is
// per-user, so a GUEST run of a URL that some signed-in account already holds a
// completed report for found no duplicate, ran the full audit, and then lost the
// insert to that account's report. The visitor's report existed only in memory,
// so the page they were reading kept rendering from React state while every
// server call for it 404'd — "Report not found or access denied" on the download
// and email buttons, seconds after a successful audit.
//
// `scopeKey` is here because `report` only says which SECTIONS ran, never how
// many PAGES. "Full site" and "this page only" therefore reached this key
// identical, so the second one was served the first one's report — a visitor who
// asked for a single page got a whole site's crawl back (and vice versa, which is
// worse: asking for the whole site and silently getting one page).
//
// Reports written before these fields existed have no `market` / `userId` /
// `scopeKey` and index as null, which is a distinct key from "US"/"AU", a real
// account id, or "full"/"home" — so they never collide with new runs.
SiteReportSchema.index(
  { url: 1, device: 1, report: 1, market: 1, userId: 1, scopeKey: 1 },
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
