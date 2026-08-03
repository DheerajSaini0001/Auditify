import logger from "./logger.js";

/**
 * Audit-level admission control.
 *
 * The browser pool (browserManager.js) caps how many Chrome instances exist, but
 * it does NOT cap how many AUDITS compete for them. Every audit wants
 * 1 + MAX_KEY_PAGES browsers over its life, and Stage 2b sizes its own worker
 * pool to MAX_CONCURRENT_BROWSERS — so a single audit already asks for the whole
 * pool, and each extra concurrent audit multiplies the demand.
 *
 * Measured 2026-08-03: three audits started inside 90s (7 browsers wanted each,
 * 6 available) pinned the pool at 6/6 with up to 4 queued and produced
 *   • 6 × "acquire timed out — caller falls back (no browser spawned)"
 *   • 4 × 'Pillar "On Page SEO" timed out — returning partial result'
 * i.e. not merely slower, but reports scored on DEGRADED data. The same audit
 * run alone finished in 51s with zero timeouts.
 *
 * So admission is gated here: the report is created and its id returned to the
 * client immediately (nothing about the HTTP contract changes), but the worker
 * is not spawned until a slot frees. A waiting audit reports its queue position
 * so the client can say "waiting" instead of pretending work is happening.
 *
 * MAX_CONCURRENT_AUDITS=1 serialises audits completely (strictest, best data);
 * the default of 2 lets a second audit make progress on the pool's spare
 * capacity without the 3-way starvation above.
 */
const MAX_CONCURRENT_AUDITS = Math.max(
  1,
  parseInt(process.env.MAX_CONCURRENT_AUDITS || "2", 10) || 2
);

let running = 0;
/** FIFO of { grant, onPosition, label } waiting for a slot */
const waiting = [];

/** Tell everyone still queued where they now stand (1-based). */
function notifyPositions() {
  waiting.forEach((w, i) => {
    try { w.onPosition?.(i + 1); } catch { /* reporting must never break the queue */ }
  });
}

/**
 * Take an audit slot. Resolves once this audit may spawn its worker.
 *
 * @param {object}   opts
 * @param {string}   opts.label       url/id for the log line
 * @param {function} opts.onPosition  called with the 1-based queue position when
 *                                    the audit has to wait, and again whenever it
 *                                    moves up. Never called if a slot was free.
 * @returns {Promise<function>} release — idempotent; call it exactly once when the
 *                              audit's worker has exited (success OR failure).
 */
export function acquireAuditSlot({ label = "audit", onPosition } = {}) {
  return new Promise((resolve) => {
    const grant = () => {
      running++;
      let released = false;
      resolve(function release() {
        // Idempotent: 'exit' plus an error path must not double-free a slot,
        // which would let running drift below zero and over-admit forever.
        if (released) return;
        released = true;
        running--;
        const next = waiting.shift();
        if (next) {
          logger.info(`🎟️ [AuditQueue] slot freed → starting ${next.label} (${waiting.length} still waiting)`);
          next.grant();
          notifyPositions();
        }
      });
    };

    if (running < MAX_CONCURRENT_AUDITS) return grant();

    waiting.push({ grant, onPosition, label });
    logger.info(`⏳ [AuditQueue] ${label} queued — ${running} audit(s) running, ${waiting.length} waiting (cap ${MAX_CONCURRENT_AUDITS})`);
    notifyPositions();
  });
}

/** Snapshot for logging/diagnostics. */
export function auditQueueStats() {
  return { running, waiting: waiting.length, max: MAX_CONCURRENT_AUDITS };
}
