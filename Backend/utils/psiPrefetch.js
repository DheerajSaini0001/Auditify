import googleAPI from './googleAPI.js';
import createLimiter from './concurrencyLimiter.js';
import logger from './logger.js';

/**
 * PageSpeed Insights PREFETCH REGISTRY.
 *
 * PSI is by far the slowest single call in an audit (~50–75s) and it needs nothing
 * but the URL — no browser, no rendered DOM, no bot-challenge clearance. Yet each
 * page's Technical pillar only reaches it after that page's Chrome has launched and
 * rendered, and Stage 2b runs just 3 pages at a time, so page #4's PSI call didn't
 * even *start* until two earlier pages had fully finished.
 *
 * This registry lets the worker fire PSI for a URL the moment the URL is KNOWN —
 * i.e. for every key page as soon as discovery (Stage 2a) names it, while Stage 1 is
 * still running — and hand the already-in-flight promise to technicalMetrics later.
 * By the time a key page's browser is ready, its PSI response is usually already
 * sitting in memory, so the ~50–75s wait collapses to ~0 for all but the first page.
 *
 * Scope: module state, so it is per worker_thread = per audit. Nothing leaks between
 * audits, and there is no cross-thread sharing to reason about.
 */

// `${url}::${device}` → Promise<psiResponse>. Entries are removed on consumption
// (a Lighthouse JSON is MBs — holding 6 of them after use is pure waste).
const inFlight = new Map();

// Bound the burst so a site with many key pages can't fire a dozen simultaneous PSI
// calls at Google and start collecting 429s (which googleAPI would then spend its
// retry budget on). 6 = the max key pages Stage 2a selects, so in practice nothing
// queues; the cap only matters if that limit is ever raised.
const limiter = createLimiter(parseInt(process.env.PSI_PREFETCH_CONCURRENCY || '6', 10));

const normDevice = (d) => (String(d || 'mobile').toLowerCase() === 'desktop' ? 'desktop' : 'mobile');
const keyOf = (url, device) => `${url}::${device}`;

// googleAPI never rejects (it returns {} on every failure path), but these promises
// fly unawaited for minutes — one unexpected throw would surface as an unhandled
// rejection and trip the worker's safety net, so pin the failure to {} here.
const fire = (url, device) => limiter.run(() => googleAPI(url, device)).catch(() => ({}));

/**
 * Start (or reuse) a PSI call for one URL and keep it in the registry.
 * Returns the `{ device, promise }` shape technicalMetrics expects.
 */
export function startPsiPrefetch(url, device) {
  const dev = normDevice(device);
  const k = keyOf(url, dev);
  let promise = inFlight.get(k);
  if (!promise) {
    promise = fire(url, dev);
    inFlight.set(k, promise);
  }
  return { device: dev, promise };
}

/** Prefetch a whole batch of URLs at once (the key pages). Returns how many were newly started. */
export function prefetchPsiBatch(urls, device) {
  const dev = normDevice(device);
  let started = 0;
  for (const u of urls || []) {
    if (!u) continue;
    if (inFlight.has(keyOf(u, dev))) continue;
    startPsiPrefetch(u, dev);
    started++;
  }
  if (started) logger.info(`[PSI Prefetch] Started ${started} parallel PageSpeed call(s) (${dev}) ahead of their audits.`);
  return started;
}

/**
 * Hand the prefetched call to whoever is about to audit this URL, and drop it from
 * the registry (single consumer — the page's own Technical pillar). Falls back to a
 * fresh, unregistered call when the URL was never prefetched, so callers can use this
 * unconditionally and behaviour is identical to calling googleAPI directly.
 */
export function takePsiPrefetch(url, device) {
  const dev = normDevice(device);
  const k = keyOf(url, dev);
  const hit = inFlight.get(k);
  if (hit) {
    inFlight.delete(k);
    logger.info(`[PSI Prefetch] ✓ reusing pre-warmed PageSpeed call (${dev}) — ${url}`);
    return { device: dev, promise: hit };
  }
  return { device: dev, promise: fire(url, dev) };
}

/** Drop anything never consumed (audit failed / page skipped) so the JSON can be GC'd. */
export function clearPsiPrefetch() {
  if (inFlight.size) logger.info(`[PSI Prefetch] Releasing ${inFlight.size} unused prefetched response(s).`);
  inFlight.clear();
}

export default { startPsiPrefetch, prefetchPsiBatch, takePsiPrefetch, clearPsiPrefetch };
