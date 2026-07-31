/**
 * Per-process TTL memo + in-flight dedup for tiny static files (robots.txt,
 * llms.txt) that every audited page re-fetches for the SAME origin.
 *
 * Why: the AEO pillar runs per page, and a full audit covers 1 homepage +
 * MAX_KEY_PAGES key pages — so one audit fired up to 7 identical /robots.txt
 * and 7 identical /llms.txt fetches. Worse, on WAF-fronted sites each miss
 * escalates to a full stealth-Chromium launch (Puppeteer_Simple) holding a
 * browser-pool permit. Fetch once, share the in-flight promise, reuse for TTL.
 *
 * Notes:
 *  - Concurrent callers always share ONE in-flight attempt, even for results
 *    that turn out non-cacheable (a burst of 7 failures still costs 1 attempt).
 *  - Only results the caller marks cacheable (e.g. HTTP 200/404) are kept for
 *    the TTL — a transient 0/5xx is retried by the next wave, never memoized.
 *  - In a worker_thread this module lives exactly as long as the audit. On the
 *    main process (the /api/aeo endpoint) the TTL keeps entries fresh.
 */

const TTL_MS = Math.max(0, parseInt(process.env.STATIC_FILE_CACHE_TTL_MS || "600000", 10) || 0); // 10 min
const MAX_ENTRIES = 300;

const cache = new Map(); // url -> { at, promise }

export function cachedStaticFetch(url, fetcher, isCacheable = () => true) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise;

  const entry = { at: Date.now(), promise: null };
  entry.promise = (async () => {
    try {
      const res = await fetcher();
      // Drop non-cacheable results once resolved so the NEXT caller retries —
      // but everyone who joined during the in-flight window still shares this one.
      if (!isCacheable(res) && cache.get(url) === entry) cache.delete(url);
      return res;
    } catch (err) {
      if (cache.get(url) === entry) cache.delete(url);
      throw err;
    }
  })();

  cache.set(url, entry);
  // FIFO bound — Maps iterate in insertion order, so the first key is the oldest.
  if (cache.size > MAX_ENTRIES) cache.delete(cache.keys().next().value);
  return entry.promise;
}

export default cachedStaticFetch;
