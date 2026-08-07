import mongoose from "mongoose";
import SingleAuditReport, { ACTIVE_REPORT_STATUSES } from "../models/singleAuditReport.js";
import logger from "./logger.js";

/**
 * In-memory audit store (MAIN PROCESS ONLY).
 *
 * Why this exists:
 *  - Workers no longer touch MongoDB. They stream progress to the main thread via
 *    parentPort.postMessage(), and THIS module is the single owner of report state.
 *  - While an audit is in-progress, the frontend polls it (every 3s) and is served
 *    straight from memory — zero DB reads, zero DB writes during the audit.
 *  - Completed reports are buffered and written to Mongo in BATCHES of BATCH_SIZE
 *    (one insertMany), instead of ~10 findByIdAndUpdate calls per audit.
 *
 * Lifecycle of one report object:
 *   createInProgress()  -> lives in `live` Map, status "inprogress"
 *   applyPatch()        -> progressive metric/status updates merged in (served to polls)
 *   complete()          -> status terminal; pushed into `pendingWrites`
 *   flush()             -> insertMany(pendingWrites); flushed entries removed from `live`
 *                          (subsequent polls fall back to Mongo, which now has the doc)
 *
 * TTLs:
 *   - In memory: MEM_TTL_MS (1 hour). A stuck/abandoned in-progress entry is dropped.
 *     A completed-but-still-unflushed entry is FLUSHED before eviction so finished
 *     work is never silently lost.
 *   - In Mongo: REPORT_TTL_SECONDS (default 24h, env AUDIT_REPORT_TTL_SECONDS) via the
 *     TTL index on the model — this is also the reuse window for startAudit's
 *     completed-report dedup, so a repeat audit inside it is served without a worker.
 *
 * IMPORTANT: this is per-process state. It assumes a SINGLE backend instance. If the
 * app is ever run in cluster mode / multiple pods, this must move to Redis, otherwise
 * a poll can land on an instance that never saw the audit.
 */

// One audit run now fans out into up to 10 page audits (the full dealer page-type
// set) that all complete within a few seconds of each other. Size the batch to a
// whole site so those reports persist in a single insertMany instead of being split.
const BATCH_SIZE = parseInt(process.env.AUDIT_WRITE_BATCH_SIZE || "10", 10);
const MEM_TTL_MS = parseInt(process.env.AUDIT_MEM_TTL_MS || `${60 * 60 * 1000}`, 10); // 1 hour
const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // sweep every 5 minutes
// Safety net for the larger batch: flush whatever is buffered shortly after activity
// quiets down, so a site that produces fewer than BATCH_SIZE reports (e.g. 7 found
// pages) doesn't sit memory-only until the next run or the hourly sweep.
const IDLE_FLUSH_MS = parseInt(process.env.AUDIT_IDLE_FLUSH_MS || "4000", 10);

// Fields that carry a computed metric result (used for basic result logging).
const METRIC_KEYS = [
  "technicalPerformance", "onPageSEO", "accessibility", "securityOrCompliance",
  "UXOrContentStructure", "conversionAndLeadFlow", "aioReadiness", "aeo",
];

/**
 * Log which metric category was fetched and where it landed — no payloads, just
 * the category name and storage location (the in-memory store, pre-flush).
 */
function logMetricResults(auditId, patch) {
  if (!patch) return;
  for (const key of METRIC_KEYS) {
    if (patch[key] != null) {
      logger.info(`📊 "${key}" result fetched → stored in memory (auditStore) for audit ${auditId}`);
    }
  }
}

// Only these keys are persisted (mirror of singleAuditReport schema). Anything else
// on the in-memory object (e.g. updatedAt) is bookkeeping and not written.
const SCHEMA_FIELDS = [
  "_id", "url", "report", "device", "status", "pageType", "siteType", "siteSubType", "siteSchema", "timeTaken",
  "score", "grade", "aioCompatibilityBadge", "sectionScore", "technicalPerformance",
  "onPageSEO", "accessibility", "securityOrCompliance", "UXOrContentStructure",
  "conversionAndLeadFlow", "aioReadiness", "aeo", "stage1Completed", "stage2Completed",
  "stage2Progress", "crawledPagesCount", "crawledPagesSummary", "isBotProtected", "isDealership",
  "dealershipDetection", "error", "screenshot", "screenshotUrl", "userId",
  "notifyEmail", "notifiedAt", "notifyError", "country", "plannedPages", "estimatedSeconds", "createdAt",
  // Which market's norms the run was scored against, and the evidence behind
  // that choice. `country` above is what the visitor picked; these two are what
  // the engine actually resolved and used, which is not always the same thing —
  // see utils/marketResolver.js.
  "market", "marketResolution",
];

const TERMINAL = new Set(["completed", "failed"]);

/** auditId(string) -> report object */
const live = new Map();
/** completed report objects awaiting batch insert */
const pendingWrites = [];

const idStr = (v) => (v == null ? "" : String(v));
const sameUser = (a, b) => idStr(a) === idStr(b);

/** Create a fresh in-progress report held only in memory (no DB write). */
function createInProgress({
  _id, url, device, report, userId, pageType, siteType, siteSubType,
  notifyEmail, country, market, plannedPages, estimatedSeconds, parentReportId,
}) {
  const now = new Date();
  const doc = {
    _id,
    url,
    report,
    device,
    status: "inprogress",
    pageType: pageType || null,
    siteType: siteType || null,
    siteSubType: siteSubType || null,
    siteSchema: null,
    timeTaken: null,
    score: null,
    grade: null,
    aioCompatibilityBadge: null,
    sectionScore: null,
    technicalPerformance: null,
    onPageSEO: null,
    accessibility: null,
    securityOrCompliance: null,
    UXOrContentStructure: null,
    conversionAndLeadFlow: null,
    aioReadiness: null,
    aeo: null,
    psiPending: false,
    stage1Completed: false,
    stage2Completed: false,
    stage2Progress: null,
    crawledPagesCount: 0,
    crawledPagesSummary: [],
    // Only a key-page (child) report carries this — the run it belongs to. Set at
    // creation so it is already on the doc every poll and the final flush see.
    parentReportId: parentReportId || null,
    isBotProtected: false,
    isDealership: null,
    dealershipDetection: null,
    error: null,
    screenshot: null,
    screenshotUrl: null,
    userId: userId || null,
    // Set once, at creation. `notifyEmail` is the whole reason a long run can be
    // walked away from, so it must survive into the live doc — the completion
    // handler reads it off this object, not off Mongo.
    notifyEmail: notifyEmail || null,
    // Both written only once the send has actually settled — see
    // recordNotifyOutcome in controllers/singleAuditController.js.
    notifiedAt: null,
    notifyError: null,
    country: country || null,
    // Resolved at creation, not by the worker, because it is part of this
    // audit's IDENTITY: the same URL scored for the US and for Australia are two
    // legitimately different reports, so dedupe has to be able to tell them
    // apart before any worker starts. See findActiveDuplicate.
    market: market || null,
    plannedPages: plannedPages || 1,
    estimatedSeconds: estimatedSeconds || null,
    createdAt: now,
    updatedAt: now,
  };
  live.set(idStr(_id), doc);
  logger.debug(`[auditStore] registered in-memory audit ${idStr(_id)} (${report} | ${device}) — ${live.size} live`);
  return doc;
}

/** Get a live (in-memory) report by id, or null if not held in memory. */
function get(id) {
  return live.get(idStr(id)) || null;
}

/** Merge a progressive patch (metric result / status change) into a live report. */
function applyPatch(id, patch) {
  const doc = live.get(idStr(id));
  if (!doc) {
    logger.warn(`[auditStore] applyPatch: no live audit ${idStr(id)} (already flushed/evicted?)`);
    return null;
  }
  if (patch?.status && patch.status !== doc.status) {
    logger.debug(`[auditStore] audit ${idStr(id)} status: ${doc.status} → ${patch.status}`);
  }
  if (patch?.screenshot && !patch.screenshotUrl) {
    patch.screenshotUrl = `/api/screenshot/view/${idStr(id)}`;
  }
  logMetricResults(idStr(id), patch); // basic "category fetched → stored" log, no payload
  Object.assign(doc, patch);
  doc.updatedAt = new Date();
  return doc;
}

/**
 * Mark a live report terminal and queue it for batched persistence.
 * Returns the completed doc (still readable from `live` until the next flush).
 */
function complete(id, patch = {}) {
  const doc = live.get(idStr(id));
  if (!doc) {
    logger.warn(`[auditStore] complete: no live audit ${idStr(id)} (already flushed/evicted?)`);
    return null;
  }
  logMetricResults(idStr(id), patch); // final patch may carry a metric — log category only
  Object.assign(doc, patch);
  if (!TERMINAL.has(doc.status)) doc.status = "completed";
  doc.updatedAt = new Date();

  if (!doc.__queued) {
    doc.__queued = true;
    pendingWrites.push(doc);
    logger.info(
      `🧾 Audit ${idStr(id)} ${doc.status} (score ${doc.score ?? "—"}) — buffered ${pendingWrites.length}/${BATCH_SIZE} for next flush`
    );
  }
  flushIfNeeded();
  scheduleIdleFlush();
  return doc;
}

/**
 * Find a still-active in-memory duplicate for de-duplication, mirroring the Mongo
 * query in the controller: a completed report, or an in-progress one started within
 * the last 5 minutes, for the same url/device/report/user.
 */
function findActiveDuplicate({ url, device, report, userId, market = null }) {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  for (const doc of live.values()) {
    if (doc.url !== url || doc.device !== device || doc.report !== report) continue;
    if (!sameUser(doc.userId, userId)) continue;
    // Market is part of the identity: a US run and an AU run of the same URL
    // grade against different reference lists and produce different scores, so
    // reusing one for the other would silently hand back the wrong market's
    // report. Reports created before market existed carry null and therefore
    // only ever dedupe against another null.
    if ((doc.market || null) !== (market || null)) continue;
    if (doc.status === "completed") return doc;
    // Any non-terminal status (inprogress, launching, navigating, waiting_for_render,
    // screenshot_ready, extracting_data) is an in-flight audit — dedupe against it so a
    // concurrent request can't spawn a second worker mid-audit.
    if (doc.status !== "failed" && doc.createdAt.getTime() > fiveMinAgo) return doc;
  }
  return null;
}

/**
 * Find a completed full ("All") audit held in memory, for section reuse.
 *
 * Market-scoped for the same reason findActiveDuplicate is: the sections are
 * cloned verbatim, so cloning them out of a run scored against another market's
 * reference lists would hand back a score for a jurisdiction the visitor did not
 * ask about — and the clone would then carry a market its numbers never came from.
 */
function findCompletedFullAudit({ url, device, userId, market = null }) {
  for (const doc of live.values()) {
    if (doc.report !== "All" || doc.status !== "completed") continue;
    if ((doc.market || null) !== (market || null)) continue;
    if (doc.url === url && doc.device === device && sameUser(doc.userId, userId)) return doc;
  }
  return null;
}

/**
 * A live report for this identity whose audit is STILL RUNNING, or null.
 *
 * `live` is the only place an in-progress report exists (it is not written to Mongo
 * until it finishes), so a non-terminal entry here means a worker is streaming into
 * it right now. Callers that are about to delete a report use this to tell a stale
 * leftover apart from a run in flight.
 */
function findInFlight({ url, device, report, userId, market = null }) {
  for (const doc of live.values()) {
    if (doc.url !== url || doc.device !== device || doc.report !== report) continue;
    if (!sameUser(doc.userId, userId)) continue;
    if ((doc.market || null) !== (market || null)) continue;
    if (!TERMINAL.has(doc.status)) return doc;
  }
  return null;
}

/**
 * Remove any live entries matching a force-rerun delete (mirror of deleteMany).
 *
 * NEVER removes a report whose audit is still running. Doing so orphaned the worker:
 * it kept streaming into an id that no longer existed, so every applyPatch() and
 * finally complete() hit the `no live audit` branch and were dropped on the floor.
 * The report therefore never reached a terminal status, and because an in-progress
 * report lives ONLY in memory, every subsequent GET /single-audit/:id/status 404'd —
 * the client froze on a spinner forever with whatever sections had landed before the
 * delete, and the ones still in flight stayed null. Reproduced 2026-08-07: a second
 * request for the same {url, device, report} wiped a run 2s into its 8 pillars.
 *
 * Guest runs made it worse: their userId is null for EVERYONE, so sameUser(null,null)
 * matched across visitors and one guest's re-run could freeze another's live report.
 *
 * Returns the ids that were skipped for being in flight, so the caller can reuse the
 * running audit instead of silently doing nothing.
 */
function removeMatching({ url, device, report, userId, market = null }) {
  const skipped = [];
  for (const [key, doc] of live.entries()) {
    if ((doc.market || null) !== (market || null)) continue;
    if (doc.url === url && doc.device === device && doc.report === report && sameUser(doc.userId, userId)) {
      if (!TERMINAL.has(doc.status)) {
        logger.warn(`[auditStore] refusing to remove ${key} — its audit is still running (status ${doc.status})`);
        skipped.push(key);
        continue;
      }
      live.delete(key);
    }
  }
  return skipped;
}

/**
 * Hard-remove specific reports by id from memory — both the `live` map AND the
 * `pendingWrites` flush queue, so a buffered (not-yet-flushed) report can't be
 * re-inserted into Mongo after the caller deletes it there. Used when merging the
 * VDP samples into one master report and discarding the sources. Returns the count
 * removed from `live`.
 */
function removeByIds(ids) {
  const set = new Set((ids || []).map(idStr));
  if (!set.size) return 0;
  let removed = 0;
  for (const key of [...live.keys()]) {
    if (set.has(key)) { live.delete(key); removed++; }
  }
  for (let i = pendingWrites.length - 1; i >= 0; i--) {
    if (set.has(idStr(pendingWrites[i]._id))) pendingWrites.splice(i, 1);
  }
  return removed;
}

/**
 * _ids of every report still held in memory for a user — both in-progress and
 * completed-but-not-yet-flushed (buffered). These have an AuditLog entry but no Mongo
 * report doc yet, so the history endpoint must union these with the Mongo ids to show
 * the true count (e.g. 3 buffered + 4 in Mongo = 7).
 */
/**
 * Attach an in-memory guest report to an account.
 *
 * A visitor's audit is created with `userId: null`. When they sign in to read it,
 * the report has to become theirs or it never shows up in their history. Reports
 * that are already owned are left alone, so this can't be used to take over
 * someone else's run. A doc already queued in `pendingWrites` is the same object,
 * so the next flush persists the new owner.
 */
function claimForUser(id, userId) {
  const doc = live.get(idStr(id));
  if (!doc || doc.userId) return false;
  doc.userId = userId;
  doc.updatedAt = new Date();
  logger.info(`[auditStore] audit ${idStr(id)} claimed by user ${idStr(userId)}`);
  return true;
}

function liveReportIdsForUser(userId) {
  const ids = [];
  for (const doc of live.values()) {
    if (sameUser(doc.userId, userId)) ids.push(doc._id);
  }
  return ids;
}

function toPersistable(doc) {
  const out = {};
  for (const k of SCHEMA_FIELDS) if (doc[k] !== undefined) out[k] = doc[k];
  return out;
}

function flushIfNeeded() {
  if (pendingWrites.length >= BATCH_SIZE) {
    // fire-and-forget; errors handled inside flush()
    flush().catch((err) => logger.error("auditStore flush error", err));
  }
}

// Debounced "activity has settled" flush. The first buffered report arms a single
// timer; by the time it fires, the rest of that site's parallel reports have landed
// and flush() writes them all together. flush() no-ops if the threshold already
// drained the buffer, so this is harmless when BATCH_SIZE is reached on its own.
let idleFlushTimer = null;
function scheduleIdleFlush() {
  if (idleFlushTimer) return;
  idleFlushTimer = setTimeout(() => {
    idleFlushTimer = null;
    if (pendingWrites.length) flush().catch((err) => logger.error("auditStore idle flush error", err));
  }, IDLE_FLUSH_MS);
  if (idleFlushTimer.unref) idleFlushTimer.unref();
}

// How many times a report Mongo refused is retried before it is left in memory.
const MAX_FLUSH_ATTEMPTS = 3;

/**
 * Which documents in an insertMany batch the server rejected, by position.
 *
 * `ordered: false` means the rest DID land, so this is what separates "these two
 * need attention" from "nothing was written". Returns null when the failure is
 * not per-document (connection dropped, auth, timeout) — then nothing landed and
 * the whole batch has to be retried.
 */
function rejectedPositions(err, batchLength) {
  const writeErrors = err?.writeErrors || err?.result?.writeErrors || [];
  if (Array.isArray(writeErrors) && writeErrors.length) {
    const out = new Set();
    for (const we of writeErrors) {
      const i = typeof we?.index === "number" ? we.index : we?.err?.index;
      if (typeof i === "number") out.add(i);
    }
    if (out.size) return out;
  }
  // A single-document insert fails with a bare duplicate-key error and carries
  // no writeErrors array.
  if (err?.code === 11000 && batchLength === 1) return new Set([0]);
  return null;
}

/**
 * One report Mongo refused: work out why, and either get it persisted or keep it
 * in memory. The one thing this must never do is drop it.
 *
 * This used to read a duplicate-key error as "already persisted — safe to
 * forget", which is only true for a clash on _id. The unique index is on
 * {url, device, report, market, userId}, so it ALSO fires when a different
 * report is sitting on this one's target — and forgetting the report then left
 * it in neither Mongo nor memory. The page that was already open kept rendering
 * it from client state while every server call for it 404'd, so the failure
 * surfaced as "Report not found or access denied" on the download and email
 * buttons, seconds after a successful audit.
 */
async function resolveRejected(doc) {
  const id = idStr(doc._id);
  try {
    // Genuinely already there (a re-flush of the same doc) — safe to release.
    if (await SingleAuditReport.exists({ _id: doc._id })) {
      live.delete(id);
      return;
    }

    // Something else holds this report's target. THIS report has to win: its id
    // is what the open report page, the PDF export and the emailed link all
    // point at, while the occupant is a superseded run of the same target that
    // the dedupe would never serve again. Clearing it is the same thing a forced
    // re-run and the key-page fan-out already do.
    const occupants = await SingleAuditReport.find(
      {
        _id: { $ne: doc._id },
        url: doc.url,
        device: doc.device,
        report: doc.report,
        market: doc.market ?? null,
        userId: doc.userId ?? null,
        status: { $in: ACTIVE_REPORT_STATUSES },
        // Never evict a run NEWER than this one — that one is the current report
        // for this target and somebody may be reading it right now.
        createdAt: { $lt: doc.createdAt },
      },
      { _id: 1 }
    );

    if (occupants.length) {
      await SingleAuditReport.deleteMany({ _id: { $in: occupants.map((o) => o._id) } });
      logger.warn(
        `[auditStore] ${id}: cleared ${occupants.length} superseded report(s) holding the same target — ${occupants.map((o) => idStr(o._id)).join(", ")}`
      );
    }

    await SingleAuditReport.create(toPersistable(doc));
    logger.info(`💾 auditStore persisted ${id} on retry`);
    live.delete(id);
  } catch (err) {
    doc.__flushAttempts = (doc.__flushAttempts || 0) + 1;
    if (doc.__flushAttempts < MAX_FLUSH_ATTEMPTS) {
      logger.warn(
        `[auditStore] ${id}: still unpersisted (attempt ${doc.__flushAttempts}/${MAX_FLUSH_ATTEMPTS}) — ${err?.message}`
      );
      pendingWrites.push(doc); // still __queued: this is the same buffered object
      scheduleIdleFlush();
      return;
    }
    // Out of retries. KEEP IT IN MEMORY — a report that is readable until the
    // process restarts beats one that vanishes while its owner is reading it.
    // Clearing __queued lets the hourly sweeper make one more attempt.
    doc.__queued = false;
    logger.error(
      `[auditStore] ${id}: could not be persisted after ${MAX_FLUSH_ATTEMPTS} attempts — kept in memory only`,
      err
    );
  }
}

/**
 * Persist all buffered completed reports in a single insertMany, then drop the
 * flushed entries from memory (Mongo now serves them).
 *
 * A report is removed from `live` ONLY once Mongo is known to hold it — `live`
 * is the only other copy, so anything else is silent data loss.
 */
async function flush() {
  if (!pendingWrites.length) return;
  if (mongoose.connection.readyState !== 1) {
    scheduleIdleFlush(); // no DB yet — come back rather than waiting on the next audit
    return;
  }
  const batch = pendingWrites.splice(0, pendingWrites.length);
  logger.debug(`[auditStore] flushing batch of ${batch.length} report(s) → insertMany`);

  let rejected = new Set();
  try {
    await SingleAuditReport.insertMany(batch.map(toPersistable), { ordered: false });
    logger.info(`💾 auditStore flushed ${batch.length} report(s) to MongoDB`);
  } catch (err) {
    const positions = rejectedPositions(err, batch.length);
    if (!positions) {
      logger.error("auditStore flush failed — re-queueing batch", err);
      pendingWrites.unshift(...batch);
      scheduleIdleFlush();
      return;
    }
    rejected = positions;
    logger.warn(
      `auditStore flush: ${batch.length - rejected.size}/${batch.length} report(s) written, ${rejected.size} rejected — resolving individually`
    );
  }

  // Everything not rejected did land (ordered: false), so only those are released.
  for (let i = 0; i < batch.length; i++) {
    if (!rejected.has(i)) live.delete(idStr(batch[i]._id));
  }
  for (const i of rejected) await resolveRejected(batch[i]);
}

/** Force-persist everything still buffered (used on graceful shutdown). */
async function flushAll() {
  await flush();
}

/**
 * Periodic memory cleanup:
 *  - in-progress entries older than the TTL are abandoned → dropped (no write).
 *  - completed entries somehow still unflushed past the TTL are flushed first
 *    (never lose finished work), then dropped at the following flush.
 */
async function sweep() {
  const cutoff = Date.now() - MEM_TTL_MS;
  let stuckCompleted = false;
  for (const [key, doc] of live.entries()) {
    if (doc.updatedAt.getTime() > cutoff) continue;
    if (doc.status === "inprogress") {
      logger.warn(`🧹 auditStore evicting stale in-progress audit ${key} (TTL ${MEM_TTL_MS}ms)`);
      live.delete(key);
    } else if (!doc.__queued) {
      // terminal but never queued (shouldn't happen) — queue it so it's not lost
      doc.__queued = true;
      pendingWrites.push(doc);
      stuckCompleted = true;
    }
  }
  if (stuckCompleted) await flush().catch((err) => logger.error("auditStore sweep flush error", err));
}

const sweepTimer = setInterval(() => {
  sweep().catch((err) => logger.error("auditStore sweep error", err));
}, SWEEP_INTERVAL_MS);
// Don't keep the event loop alive just for the sweeper.
if (sweepTimer.unref) sweepTimer.unref();

export default {
  BATCH_SIZE,
  createInProgress,
  get,
  applyPatch,
  complete,
  findActiveDuplicate,
  findInFlight,
  findCompletedFullAudit,
  removeMatching,
  removeByIds,
  claimForUser,
  liveReportIdsForUser,
  flush,
  flushAll,
  sweep,
};
