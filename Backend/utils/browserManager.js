import { isMainThread, parentPort } from "worker_threads";
import os from "os";
import logger from "./logger.js";

/**
 * ============================================================================
 *  Global Headless-Browser Concurrency Pool
 * ============================================================================
 * ONE hard cap on how many headless Chromium instances may be doing work at the
 * same time across the ENTIRE process tree — the main Express process AND every
 * audit worker_thread. Default 3, configurable via MAX_CONCURRENT_BROWSERS.
 *
 * Why this exists
 * ---------------
 * A single audit fans out into many browser workloads: the page render
 * (Puppeteer_Cheerio), per-pillar robots.txt/llms.txt fetches (Puppeteer_Simple),
 * site-type classification + sitemap discovery (the shared stealth browser), and
 * PDF export. Left ungoverned, a handful of concurrent audits spawned 13-15
 * Chromium processes at once and pinned the CPU at 100%. Every launch site now
 * takes a permit from this pool first and returns it on close, so the number of
 * *active* browsers can never exceed the cap.
 *
 * HARD cap — no force-grant
 * -------------------------
 * The previous implementation force-granted an EXTRA permit when a request
 * waited too long in the queue. Under slow (PageSpeed-bound) audits that hold a
 * browser for 40-150s, the queue always timed out and the "cap" leaked without
 * bound — that is the actual cause of the 13-15 processes. This version NEVER
 * hands out more than MAX_CONCURRENT_BROWSERS permits. Instead:
 *
 *   • Callers that can degrade gracefully (site-type classification, per-pillar
 *     static-file fetches) pass an acquire `timeoutMs`; on timeout they get a
 *     rejection they handle by falling back to a plain HTTP fetch / partial
 *     result — no browser is spawned.
 *   • A watchdog force-RELEASES (never grants) any permit held longer than
 *     SLOT_MAX_HOLD_MS, reclaiming a leaked/zombie slot so the queue keeps
 *     moving. Reclaiming can momentarily allow a replacement browser while a
 *     genuinely-stuck one lingers, but — unlike force-granting — it can never
 *     multiply the cap.
 *
 * Threading model
 * ---------------
 * The authoritative counter lives in the MAIN thread. Worker threads each get
 * their own module instance (worker_threads share no JS memory), so they can't
 * hold the counter themselves — instead they request/return permits over the
 * parentPort IPC channel and the main thread services them against the single
 * shared pool. registerWorkerWithManager(worker) MUST be called on every Worker
 * for this to hold (see singleAuditController.js / scripts/batchAudit.js).
 *
 * Deadlock safety (nested acquisition)
 * ------------------------------------
 * A task may hold a permit (the page-render browser) and, while holding it, need
 * a SECOND permit for a nested workload (a per-pillar robots.txt fetch during
 * Stage 1). If every permit were held by such parents all waiting on nested
 * children, nothing could progress. So NESTED / degradable acquisitions MUST be
 * bounded (pass `timeoutMs`) and fail open — Puppeteer_Simple and the
 * classification path always do. Only top-level page renders (Puppeteer_Cheerio)
 * wait unbounded, and even they carry an IPC backstop so a dead main thread
 * can't hang a worker forever.
 */

// ── Configuration ──
const MAX_CONCURRENT_BROWSERS = Math.max(
  1,
  parseInt(process.env.MAX_CONCURRENT_BROWSERS || "3", 10) || 3
);
// A permit held longer than this is presumed leaked (crashed holder, lost
// release) and reclaimed by the watchdog. Set well above a normal hold: a full
// render holds its browser for navigation/challenge (~35-60s) PLUS the longest
// pillar — Technical Performance waits on Google PageSpeed (~50-75s, capped at
// PILLAR_TECH_TIMEOUT_MS=120s). So a legitimate audit can hold ~150-180s; 300s
// leaves margin above that and still trips only on genuine zombies.
const SLOT_MAX_HOLD_MS = parseInt(process.env.BROWSER_SLOT_MAX_HOLD_MS || "300000", 10);
// How often the watchdog reclaims leaked slots and emits a monitoring heartbeat.
const WATCHDOG_INTERVAL_MS = parseInt(process.env.BROWSER_POOL_WATCHDOG_MS || "15000", 10);

// ── Authoritative pool state (meaningful only in the main thread) ──
let activeBrowsers = 0;
let peakBrowsers = 0;
let slotSeq = 0;
const waiters = [];        // FIFO queue of { grant, label, enqueuedAt, timer }
const activeSlots = new Map(); // slotId -> { since, label }

function newId(prefix) {
  slotSeq = (slotSeq + 1) % Number.MAX_SAFE_INTEGER;
  return `${prefix}${slotSeq.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function sysMetrics() {
  const mem = process.memoryUsage();
  const rssMB = (mem.rss / 1048576).toFixed(0);
  const heapMB = (mem.heapUsed / 1048576).toFixed(0);
  let load = "n/a";
  try { load = os.loadavg()[0].toFixed(2); } catch { /* not on all platforms */ }
  return `rss=${rssMB}MB heap=${heapMB}MB load1=${load}`;
}

/** Live snapshot of the pool — for logging / monitoring endpoints. */
export function getBrowserPoolStats() {
  const now = Date.now();
  return {
    max: MAX_CONCURRENT_BROWSERS,
    active: activeBrowsers,
    queued: waiters.length,
    peak: peakBrowsers,
    slots: [...activeSlots.entries()].map(([id, s]) => ({
      id,
      label: s.label || null,
      ageMs: now - s.since,
    })),
  };
}

/** Emit a one-line pool + resource status (browser count + CPU/memory). */
export function logBrowserPoolStats(context = "") {
  const s = getBrowserPoolStats();
  logger.info(
    `🌐 [BrowserPool]${context ? ` ${context} |` : ""} active=${s.active}/${s.max} queued=${s.queued} peak=${s.peak} | ${sysMetrics()}`
  );
}

function logSlot(action, slotId, label) {
  logger.info(
    `🌐 [BrowserPool] ${action} ${slotId}${label ? `(${label})` : ""} | active=${activeBrowsers}/${MAX_CONCURRENT_BROWSERS} queued=${waiters.length} peak=${peakBrowsers} | ${sysMetrics()}`
  );
}

// ── Main-thread slot management (the single source of truth) ──
function acquireLocalSlot({ timeoutMs, label } = {}) {
  const slotId = newId("L");
  return new Promise((resolve, reject) => {
    const grant = () => {
      activeBrowsers++;
      if (activeBrowsers > peakBrowsers) peakBrowsers = activeBrowsers;
      activeSlots.set(slotId, { since: Date.now(), label });
      logSlot("acquired", slotId, label);
      resolve(slotId);
    };

    if (activeBrowsers < MAX_CONCURRENT_BROWSERS) {
      grant();
      return;
    }

    // At capacity — enqueue FIFO. No force-grant, ever.
    const waiter = { label, enqueuedAt: Date.now(), timer: null, grant: null };
    waiter.grant = () => {
      if (waiter.timer) clearTimeout(waiter.timer);
      grant();
    };

    if (timeoutMs && timeoutMs > 0) {
      waiter.timer = setTimeout(() => {
        const i = waiters.indexOf(waiter);
        if (i !== -1) waiters.splice(i, 1);
        logger.warn(
          `⏳ [BrowserPool] acquire for ${slotId}${label ? `(${label})` : ""} timed out after ${timeoutMs}ms — caller falls back (no browser spawned). active=${activeBrowsers}/${MAX_CONCURRENT_BROWSERS} queued=${waiters.length}`
        );
        reject(new Error(`browser slot acquire timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      // NOT unref'd — this is a real pending operation the caller is awaiting,
      // not a background keepalive (only the watchdog interval is unref'd).
    }

    waiters.push(waiter);
    logger.info(
      `⏳ [BrowserPool] queued ${slotId}${label ? `(${label})` : ""} — active=${activeBrowsers}/${MAX_CONCURRENT_BROWSERS} queued=${waiters.length}`
    );
  });
}

function releaseLocalSlot(slotId) {
  if (!activeSlots.has(slotId)) return; // unknown / double release — ignore (never drives the counter negative)
  activeSlots.delete(slotId);
  activeBrowsers = Math.max(0, activeBrowsers - 1);
  logSlot("released", slotId);

  const next = waiters.shift();
  if (next) next.grant();
}

// Reclaim leaked permits + emit a monitoring heartbeat. Runs only in the main
// thread, where the authoritative state lives.
function watchdogTick() {
  const now = Date.now();
  for (const [slotId, s] of activeSlots) {
    if (now - s.since > SLOT_MAX_HOLD_MS) {
      logger.warn(
        `⚠️ [BrowserPool] ${slotId}${s.label ? `(${s.label})` : ""} held ${Math.round((now - s.since) / 1000)}s > ${Math.round(SLOT_MAX_HOLD_MS / 1000)}s — reclaiming (presumed leaked).`
      );
      releaseLocalSlot(slotId);
    }
  }
  if (activeBrowsers > 0 || waiters.length > 0) {
    logger.info(
      `💓 [BrowserPool] active=${activeBrowsers}/${MAX_CONCURRENT_BROWSERS} queued=${waiters.length} peak=${peakBrowsers} | ${sysMetrics()}`
    );
  }
}

if (isMainThread) {
  const wd = setInterval(watchdogTick, WATCHDOG_INTERVAL_MS);
  if (wd.unref) wd.unref(); // never keep the process alive just for the watchdog
}

// ── Worker registration (main thread): bridge a worker's IPC to the pool ──
export function registerWorkerWithManager(worker) {
  if (!worker) return;

  const workerSlots = new Set(); // permits currently held on this worker's behalf

  worker.on("message", (msg) => {
    if (!msg || msg.type == null) return;

    if (msg.type === "ACQUIRE_BROWSER_SLOT") {
      const { reqId, timeoutMs, label } = msg;
      acquireLocalSlot({ timeoutMs, label }).then(
        (slotId) => {
          workerSlots.add(slotId);
          try {
            worker.postMessage({ type: "BROWSER_SLOT_GRANTED", reqId, slotId });
          } catch {
            // Worker died before delivery — don't leak the permit.
            workerSlots.delete(slotId);
            releaseLocalSlot(slotId);
          }
        },
        (err) => {
          try {
            worker.postMessage({ type: "BROWSER_SLOT_DENIED", reqId, reason: err.message });
          } catch { /* worker gone */ }
        }
      );
    } else if (msg.type === "RELEASE_BROWSER_SLOT") {
      if (msg.slotId) {
        workerSlots.delete(msg.slotId);
        releaseLocalSlot(msg.slotId);
      }
    }
  });

  // If the worker dies mid-audit, reclaim everything it was holding.
  const cleanup = () => {
    for (const slotId of workerSlots) releaseLocalSlot(slotId);
    workerSlots.clear();
  };
  worker.on("exit", cleanup);
  worker.on("error", cleanup);
}

// ── Worker-thread IPC client (single shared dispatcher, no listener leak) ──
let ipcInited = false;
const pendingAcquires = new Map(); // reqId -> { resolve, reject, timer }

function initWorkerIpc() {
  if (ipcInited || isMainThread || !parentPort) return;
  ipcInited = true;
  parentPort.on("message", (msg) => {
    if (!msg || msg.reqId == null) return;
    const p = pendingAcquires.get(msg.reqId);
    if (!p) {
      // GRANTED arrived after we already gave up (backstop fired) — hand it back
      // immediately so the pool doesn't leak a permit no one is using.
      if (msg.type === "BROWSER_SLOT_GRANTED" && msg.slotId) {
        try { parentPort.postMessage({ type: "RELEASE_BROWSER_SLOT", slotId: msg.slotId }); } catch { /* closing */ }
      }
      return;
    }
    if (msg.type === "BROWSER_SLOT_GRANTED") {
      pendingAcquires.delete(msg.reqId);
      if (p.timer) clearTimeout(p.timer);
      p.resolve(msg.slotId);
    } else if (msg.type === "BROWSER_SLOT_DENIED") {
      pendingAcquires.delete(msg.reqId);
      if (p.timer) clearTimeout(p.timer);
      p.reject(new Error(msg.reason || "browser slot denied"));
    }
  });
}

function acquireViaIpc({ timeoutMs, label } = {}) {
  initWorkerIpc();
  const reqId = newId("W");
  return new Promise((resolve, reject) => {
    // The MAIN thread enforces the real timeoutMs and replies DENIED. This local
    // backstop only guards against the main thread never replying at all (e.g.
    // it crashed) — we REJECT rather than local-grant, so the global cap is
    // never bypassed the way the old 50s local-fallback did.
    const backstopMs = timeoutMs && timeoutMs > 0 ? timeoutMs + 5000 : SLOT_MAX_HOLD_MS + 30000;
    const timer = setTimeout(() => {
      if (pendingAcquires.has(reqId)) {
        pendingAcquires.delete(reqId);
        reject(new Error(`browser slot acquire timed out after ${backstopMs}ms (no reply from pool)`));
      }
    }, backstopMs);
    // NOT unref'd — a real pending acquire the worker is awaiting.

    pendingAcquires.set(reqId, { resolve, reject, timer });
    try {
      parentPort.postMessage({ type: "ACQUIRE_BROWSER_SLOT", reqId, timeoutMs, label });
    } catch (e) {
      pendingAcquires.delete(reqId);
      clearTimeout(timer);
      reject(e);
    }
  });
}

function releaseViaIpc(slotId) {
  if (!slotId) return;
  try {
    parentPort.postMessage({ type: "RELEASE_BROWSER_SLOT", slotId });
  } catch { /* worker closing — main-thread exit handler reclaims it */ }
}

// ── Unified public API (identical call site in main thread & workers) ──
/**
 * Acquire one browser permit. Resolves with an opaque slotId to pass to
 * releaseBrowserSlot(). Options:
 *   - timeoutMs : reject if no permit becomes free within this many ms. OMIT to
 *                 wait indefinitely (top-level page renders). REQUIRED for any
 *                 acquisition made while already holding a permit (nested) or
 *                 anywhere that can degrade to a non-browser fallback.
 *   - label     : short tag for logs (e.g. "audit:example.com", "classify").
 */
export async function acquireBrowserSlot(opts = {}) {
  if (isMainThread || !parentPort) return acquireLocalSlot(opts);
  return acquireViaIpc(opts);
}

export async function releaseBrowserSlot(slotId) {
  if (!slotId) return;
  if (isMainThread || !parentPort) {
    releaseLocalSlot(slotId);
    return;
  }
  releaseViaIpc(slotId);
}

/**
 * Run `fn(slotId)` while holding a permit, guaranteeing release even on throw.
 *   - acquireTimeoutMs : passed through to acquireBrowserSlot (see above).
 *   - execTimeoutMs    : hard cap on the workload itself so a hung page/pillar
 *                        can't hold a browser forever (default 120s; 0 disables).
 */
export async function withBrowserSlot(fn, opts = {}) {
  const { execTimeoutMs = 120000, acquireTimeoutMs, label } = opts;
  const slotId = await acquireBrowserSlot({ timeoutMs: acquireTimeoutMs, label });
  try {
    if (!execTimeoutMs) return await fn(slotId);
    let timer;
    const timeout = new Promise((_, reject) => {
      timer = setTimeout(
        () => reject(new Error(`browser workload timed out after ${execTimeoutMs}ms`)),
        execTimeoutMs
      );
    });
    try {
      return await Promise.race([Promise.resolve(fn(slotId)), timeout]);
    } finally {
      clearTimeout(timer);
    }
  } finally {
    await releaseBrowserSlot(slotId);
  }
}

export default {
  acquireBrowserSlot,
  releaseBrowserSlot,
  withBrowserSlot,
  registerWorkerWithManager,
  getBrowserPoolStats,
  logBrowserPoolStats,
  MAX_CONCURRENT_BROWSERS,
};
