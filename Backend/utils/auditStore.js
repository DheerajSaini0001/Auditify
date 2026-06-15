import mongoose from "mongoose";
import SingleAuditReport from "../models/singleAuditReport.js";
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
 *   - In Mongo: 3 hours, enforced by the `expires: 10800` TTL index on the model.
 *
 * IMPORTANT: this is per-process state. It assumes a SINGLE backend instance. If the
 * app is ever run in cluster mode / multiple pods, this must move to Redis, otherwise
 * a poll can land on an instance that never saw the audit.
 */

const BATCH_SIZE = parseInt(process.env.AUDIT_WRITE_BATCH_SIZE || "5", 10);
const MEM_TTL_MS = parseInt(process.env.AUDIT_MEM_TTL_MS || `${60 * 60 * 1000}`, 10); // 1 hour
const SWEEP_INTERVAL_MS = 5 * 60 * 1000; // sweep every 5 minutes

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
  "_id", "url", "report", "device", "status", "siteSchema", "timeTaken",
  "score", "grade", "aioCompatibilityBadge", "sectionScore", "technicalPerformance",
  "onPageSEO", "accessibility", "securityOrCompliance", "UXOrContentStructure",
  "conversionAndLeadFlow", "aioReadiness", "aeo", "isBotProtected", "isDealership",
  "dealershipDetection", "error", "screenshot", "screenshotUrl", "userId", "createdAt",
];

const TERMINAL = new Set(["completed", "failed"]);

/** auditId(string) -> report object */
const live = new Map();
/** completed report objects awaiting batch insert */
const pendingWrites = [];

const idStr = (v) => (v == null ? "" : String(v));
const sameUser = (a, b) => idStr(a) === idStr(b);

/** Create a fresh in-progress report held only in memory (no DB write). */
function createInProgress({ _id, url, device, report, userId }) {
  const now = new Date();
  const doc = {
    _id,
    url,
    report,
    device,
    status: "inprogress",
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
    isBotProtected: false,
    isDealership: null,
    dealershipDetection: null,
    error: null,
    screenshot: null,
    screenshotUrl: null,
    userId: userId || null,
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
  return doc;
}

/**
 * Find a still-active in-memory duplicate for de-duplication, mirroring the Mongo
 * query in the controller: a completed report, or an in-progress one started within
 * the last 5 minutes, for the same url/device/report/user.
 */
function findActiveDuplicate({ url, device, report, userId }) {
  const fiveMinAgo = Date.now() - 5 * 60 * 1000;
  for (const doc of live.values()) {
    if (doc.url !== url || doc.device !== device || doc.report !== report) continue;
    if (!sameUser(doc.userId, userId)) continue;
    if (doc.status === "completed") return doc;
    // Any non-terminal status (inprogress, launching, navigating, waiting_for_render,
    // screenshot_ready, extracting_data) is an in-flight audit — dedupe against it so a
    // concurrent request can't spawn a second worker mid-audit.
    if (doc.status !== "failed" && doc.createdAt.getTime() > fiveMinAgo) return doc;
  }
  return null;
}

/** Find a completed full ("All") audit held in memory, for section reuse. */
function findCompletedFullAudit({ url, device, userId }) {
  for (const doc of live.values()) {
    if (doc.report !== "All" || doc.status !== "completed") continue;
    if (doc.url === url && doc.device === device && sameUser(doc.userId, userId)) return doc;
  }
  return null;
}

/** Remove any live entries matching a force-rerun delete (mirror of deleteMany). */
function removeMatching({ url, device, report, userId }) {
  for (const [key, doc] of live.entries()) {
    if (doc.url === url && doc.device === device && doc.report === report && sameUser(doc.userId, userId)) {
      live.delete(key);
    }
  }
}

/**
 * _ids of every report still held in memory for a user — both in-progress and
 * completed-but-not-yet-flushed (buffered). These have an AuditLog entry but no Mongo
 * report doc yet, so the history endpoint must union these with the Mongo ids to show
 * the true count (e.g. 3 buffered + 4 in Mongo = 7).
 */
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

/**
 * Persist all buffered completed reports in a single insertMany, then drop the
 * flushed entries from memory (Mongo now serves them).
 */
async function flush() {
  if (!pendingWrites.length) return;
  if (mongoose.connection.readyState !== 1) return; // no DB yet — try again on next trigger
  const batch = pendingWrites.splice(0, pendingWrites.length);
  logger.debug(`[auditStore] flushing batch of ${batch.length} report(s) → insertMany`);
  try {
    await SingleAuditReport.insertMany(batch.map(toPersistable), { ordered: false });
    logger.info(`💾 auditStore flushed ${batch.length} report(s) to MongoDB`);
  } catch (err) {
    // Duplicate-key (11000) means it's already persisted — safe to drop.
    // Any other hard failure: re-queue so we retry on the next trigger.
    const isDup = err?.code === 11000 || Array.isArray(err?.writeErrors);
    if (!isDup) {
      logger.error("auditStore flush failed — re-queueing batch", err);
      pendingWrites.unshift(...batch);
      return;
    }
    logger.warn("auditStore flush completed with duplicates ignored");
  }
  for (const r of batch) live.delete(idStr(r._id));
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
  findCompletedFullAudit,
  removeMatching,
  liveReportIdsForUser,
  flush,
  flushAll,
  sweep,
};
