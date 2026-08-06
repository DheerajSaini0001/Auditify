/**
 * Per-process TTL memo + in-flight dedup for site-type detection.
 *
 * Why: detectSiteType() costs a real homepage fetch and, on thin homepages, up
 * to MAX_PROBE_PAGES extra subpage fetches — measured at ~2.6s for a live
 * dealer (1.5s homepage + 1.1s probe) and up to ~55s when it escalates to a
 * stealth browser behind a WAF. Every audit of the same site paid that again
 * from scratch.
 *
 * Keyed on HOSTNAME, not URL: "is this a dealer" is a property of the SITE, not
 * of the page that happened to be submitted. Auditing /inventory and /about on
 * the same domain must not re-detect.
 *
 * TTL is long by design (7 days). A dealership does not become a repair shop
 * mid-week, and the cost of a stale label is one wrong taxonomy on one audit —
 * against re-paying seconds on every single run.
 *
 * Cacheability rule (the important one): ONLY confident verdicts are stored.
 * detectSiteType returns `inconclusive: true` when it could not evaluate the
 * site at all — WAF cooldown, challenge page, empty body, network blip. Those
 * are transient and, by design, FAIL OPEN to the dealer taxonomy. Memoizing one
 * would pin a site to a fail-open guess for a week because of a momentary
 * block, so they are always retried.
 */

// 7 days. Override with SITE_TYPE_CACHE_TTL_MS; set to 0 to disable the cache.
const TTL_MS = Math.max(
  0,
  parseInt(process.env.SITE_TYPE_CACHE_TTL_MS || String(7 * 24 * 60 * 60 * 1000), 10) || 0
);

const MAX_ENTRIES = Math.max(
  1,
  parseInt(process.env.SITE_TYPE_CACHE_MAX_ENTRIES || "500", 10) || 500
);

const cache = new Map(); // hostname -> { at, promise }

let hits = 0;
let misses = 0;

/**
 * Cache key: the registrable hostname, lowercased, "www." stripped.
 * Returns null for anything unparseable — callers then skip the cache entirely
 * rather than colliding every malformed URL onto one key.
 */
export function cacheKeyFor(url) {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase() || null;
  } catch (_) {
    return null;
  }
}

// A verdict is only worth keeping if the detector actually evaluated the site.
// `inconclusive` covers "couldn't look" — never memoize that.
const isCacheable = (result) =>
  !!result && typeof result === "object" && result.inconclusive === false;

/**
 * Memoizing wrapper around a site-type detector.
 *
 * @param {string} url                 the URL being audited
 * @param {() => Promise<object>} detect  runs the real detection on a miss
 * @param {object} [opts]
 * @param {boolean} [opts.bypass=false]  skip the read (still writes the result)
 * @returns {Promise<object>} the detection result, plus `cached: true` on a hit
 */
export function cachedSiteType(url, detect, { bypass = false } = {}) {
  const key = TTL_MS > 0 ? cacheKeyFor(url) : null;
  if (!key) return Promise.resolve(detect());

  if (!bypass) {
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) {
      hits++;
      // Touch: re-insert so Map iteration order stays least-recently-used first
      // and the eviction below drops genuinely cold entries, not merely old ones.
      cache.delete(key);
      cache.set(key, hit);
      return hit.promise.then((r) => ({ ...r, cached: true }));
    }
    if (hit) cache.delete(key); // expired
  }

  misses++;

  const entry = { at: Date.now(), promise: null };
  entry.promise = (async () => {
    try {
      const result = await detect();
      // Drop inconclusive/failed reads once resolved so the NEXT caller retries.
      // Anyone who joined during the in-flight window still shares this one, so
      // a burst of concurrent submissions for a blocked site still costs one
      // detection rather than one per request.
      if (!isCacheable(result) && cache.get(key) === entry) cache.delete(key);
      return result;
    } catch (err) {
      if (cache.get(key) === entry) cache.delete(key);
      throw err;
    }
  })();

  cache.set(key, entry);

  // Bound the map. Map preserves insertion order and hits re-insert, so the
  // first key is the least recently used.
  while (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    cache.delete(oldest);
  }

  return entry.promise;
}

/** Drop a single host's entry — e.g. after a manual re-classification. */
export function invalidateSiteType(url) {
  const key = cacheKeyFor(url);
  return key ? cache.delete(key) : false;
}

/** Test hook. */
export function clearSiteTypeCache() {
  cache.clear();
  hits = 0;
  misses = 0;
}

/** Diagnostics for a health/admin endpoint. */
export function siteTypeCacheStats() {
  return { size: cache.size, hits, misses, ttlMs: TTL_MS, maxEntries: MAX_ENTRIES };
}
