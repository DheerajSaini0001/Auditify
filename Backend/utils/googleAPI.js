import fetch from 'node-fetch'
import configService from '../services/configService.js';
import logger from './logger.js';
import { getCachedPsi, setCachedPsi } from './psiCache.js';

// ── PSI concurrency gate ────────────────────────────────────────────────────
// A multi-page audit fires PageSpeed for every key page the moment discovery
// names them (prefetchPsiBatch) — 7 simultaneous calls. That burst is exactly
// what Google slow-lanes: measured 2026-08-03, 5 of 7 parallel calls hit the
// 45s attempt deadline and paid a full retry (90-135s/page) while staggered
// calls returned in 20-40s. Cap the in-flight calls per worker instead, so the
// same prefetches trickle through a few at a time. Cache hits never queue —
// the gate is taken only when a real API call is about to go out.
const PSI_MAX_CONCURRENT = Math.max(1, parseInt(process.env.PSI_MAX_CONCURRENT || '3', 10) || 3);
let psiInFlight = 0;
const psiWaiters = [];
const acquirePsiSlot = (tag, url) => new Promise((resolve) => {
  const tryAcquire = (queuedLog) => {
    if (psiInFlight < PSI_MAX_CONCURRENT) {
      psiInFlight++;
      resolve();
    } else {
      if (queuedLog) logger.info(`${tag} queued behind ${psiInFlight} in-flight PageSpeed call(s) — ${url}`);
      psiWaiters.push(() => tryAcquire(false));
    }
  };
  tryAcquire(true);
});
const releasePsiSlot = () => {
  psiInFlight = Math.max(0, psiInFlight - 1);
  const next = psiWaiters.shift();
  if (next) next();
};

// ── PSI failure classification ──────────────────────────────────────────────
// PageSpeed overloads HTTP 400 for two completely different things, and the old
// code treated both as permanent:
//   • `errors[].domain === 'gdata.CoreErrorDomain'` (reason INVALID_PARAMETER) —
//     our query string is malformed. Genuinely permanent; retrying is pointless.
//   • `errors[].domain === 'lighthouse'` (reason lighthouseUserError) — the CRAWL
//     failed (NO_FCP, FAILED_DOCUMENT_REQUEST/ERR_TIMED_OUT, NOT_HTML …). Often
//     transient: measured 2026-08-04, carweek.com/auto-insight/types-of-tires
//     returned 400 FAILED_DOCUMENT_REQUEST on 08-03 and a clean 200 (perf 83) the
//     next day. Worth exactly one retry — a genuinely dead host still fails fast.
// Returning a structured verdict also lets technicalMetrics name the real cause
// instead of the catch-all "Lighthouse returned no data" string.
const classifyPsiFailure = (status, data) => {
  const errors = data?.error?.errors || [];
  const message = data?.error?.message || '';
  const lighthouse = errors.find((e) => e.domain === 'lighthouse');
  // "Lighthouse returned error: NO_FCP. The page did not paint…" → "NO_FCP"
  const lhCode = /Lighthouse returned error:\s*([A-Z_]+)/.exec(message)?.[1] || null;

  if (status === 403) return {
    kind: 'auth', code: 'FORBIDDEN', retryable: false,
    reason: `Google rejected the PageSpeed API key (HTTP 403: ${message || 'forbidden'}). The key is invalid, restricted to HTTP referrers (which blocks server-side calls), or the PageSpeed Insights API is not enabled on its Cloud project.`,
  };
  if (status === 429) return {
    kind: 'quota', code: 'RATE_LIMITED', retryable: true,
    reason: `PageSpeed API quota exceeded (HTTP 429: ${message || 'rate limited'}).`,
  };
  if (lighthouse || lhCode) return {
    kind: 'crawl', code: lhCode || 'LIGHTHOUSE_ERROR', retryable: true, crawlError: true,
    reason: `Google PageSpeed accepted the request but Lighthouse could not measure this URL (${lhCode || 'lighthouse error'}): ${message}`,
  };
  if (status === 400) return {
    kind: 'request', code: 'INVALID_PARAMETER', retryable: false,
    reason: `PageSpeed rejected our request as malformed (HTTP 400: ${message || 'invalid argument'}). This is a bug in how the audit builds the PageSpeed URL, not a problem with the site.`,
  };
  if (status >= 500) return {
    kind: 'upstream', code: `HTTP_${status}`, retryable: true,
    reason: `Google PageSpeed returned a server error (HTTP ${status}: ${message || 'upstream failure'}).`,
  };
  return {
    kind: 'empty', code: 'NO_LIGHTHOUSE_RESULT', retryable: true,
    reason: `Google PageSpeed returned HTTP ${status} with no lighthouseResult${message ? `: ${message}` : '.'}`,
  };
};

// Stamp the verdict onto whatever we hand back so the Technical pillar can report
// the real cause. Non-enumerable: this object is persisted as-is into the audit
// document and serialized to the client, and a stray key would trip strict schemas.
const withFailure = (data, failure) => {
  const out = data && typeof data === 'object' ? data : {};
  Object.defineProperty(out, '_psiFailure', { value: failure, enumerable: false, configurable: true });
  return out;
};

export default async function googleAPI(url, device) {
  // Cache first — a PSI result is ~50-75s to fetch and barely changes hour to
  // hour, so within PSI_CACHE_TTL_MS (default 12h) a re-audit of the same
  // url+device serves the stored Lighthouse JSON in milliseconds. Checked even
  // before the API_KEY guard: a hit needs no key at all.
  const cached = await getCachedPsi(url, device);
  if (cached) {
    const ageMin = Math.round((Date.now() - cached.cachedAt) / 60000);
    logger.info(`[PageSpeed] ${device} ✓ served from cache (${ageMin}m old) — ${url}`);
    return cached.data;
  }

  const API_KEY = configService.getConfig('API_KEY');
  if (!API_KEY) {
    logger.error('[PageSpeed] API_KEY is not configured — Technical Performance data will be empty.');
    return withFailure({}, {
      kind: 'config', code: 'NO_API_KEY', retryable: false,
      reason: 'No PageSpeed API key is configured (API_KEY is empty in both the platform config and the environment), so no PageSpeed call was made.',
    });
  }

  // encodeURIComponent the url/device: an unencoded url containing `?`, `&` or `#`
  // (e.g. any page with query params) corrupts the PageSpeed query string and the
  // API returns an error instead of a lighthouseResult.
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`
    + `?url=${encodeURIComponent(url)}`
    + `&strategy=${encodeURIComponent(device || 'mobile')}`
    + `&key=${API_KEY}`;

  // ONE call, ONE deadline. There is no retry ladder — deliberately.
  //
  // History, because this has swung twice before landing here. It began as a flat
  // 45s deadline tried three times over, which is strictly worse than a single long
  // wait for the case it kept hitting: a genuinely slow site. Measured against the
  // real API, bomninchevrolet.com/preapproved.aspx returns HTTP 200 with a full
  // lighthouseResult in 94.4s — so all three 45s attempts were guaranteed to abort,
  // burning 138s to return nothing where one ~95s wait succeeds. The next version
  // kept a 45s probe on attempt 1 and handed the rest of the budget to attempt 2,
  // which still taxed every slow page 46.5s (probe + backoff) before the real
  // attempt began: that is how a 145s budget reported "did not respond within 98s".
  //
  // [2026-08-07] Retries removed outright; the deadline is one flat 150s. Nothing the
  // ladder bought was worth its complexity. A page slow enough to blow the deadline
  // does not become fast 1.5s later, and the failures that genuinely DO clear on a
  // second try (429, a momentary 5xx, a transport blip) come back in under a second —
  // for those the answer is to re-run the audit, which is exactly what the report's
  // recommendation copy already tells the operator. Trade accepted: a single
  // rate-limit blip now costs this audit its Technical section instead of being
  // papered over in-process.
  //
  // 150s is a deliberate PRODUCT ceiling, not an estimate of what PageSpeed needs.
  // Measured on the real API: bomninchevrolet 94.4s, and rvcountry.com 97.2s / 107.0s
  // from a dev machine but past 180s from the production App Service on 2026-08-07.
  // Some pages simply cannot be measured inside any wait a visitor will tolerate, so
  // the audit stops waiting and reports them as unmeasured — the UI renders "—" for
  // that state rather than a fake 0. Raise PAGESPEED_TOTAL_BUDGET_MS if you would
  // rather wait than show a dash.
  //
  // Keep the deadline UNDER PILLAR_TECH_TIMEOUT_MS (default 300s): if it outlives
  // the pillar, withTimeout kills Technical wholesale instead of letting us return
  // {} and still run the asset-level delivery checks on the live page. Raising one
  // means raising the other. In the normal (prefetched) path the call starts at
  // discovery time and overlaps browser setup, so it has usually finished before the
  // pillar timer even starts — the tight case is only the inline device-mismatch
  // fallback.
  //
  // PAGESPEED_ATTEMPT_TIMEOUT_MS is the legacy name for the same number, still
  // honoured so a deployment that already sets it keeps working.
  const DEADLINE_MS = parseInt(
    process.env.PAGESPEED_TOTAL_BUDGET_MS || process.env.PAGESPEED_ATTEMPT_TIMEOUT_MS || '150000',
    10,
  );

  // Consistent [PageSpeed] tag on every line so the whole call→outcome trail is one
  // `grep "\[PageSpeed\]"`; the ✓/✗ prefix makes the outcome scannable at a glance.
  const tag = `[PageSpeed] ${device}`;
  // The deadline bounds the PageSpeed CALL, not the wait for a free slot. Charging
  // queue time to it meant a call that waited 60s behind other PSI calls entered the
  // fetch with a chunk of its budget already gone, and a site that legitimately needs
  // a long Lighthouse run was reported as "PageSpeed returned no data for this URL"
  // purely because other audits were ahead of it in the queue. So the clock starts
  // once the slot is HELD; the pillar timeout in singleAuditWorker stays the outer
  // wall-clock bound.
  const queueStart = Date.now();
  await acquirePsiSlot(tag, url);
  const queuedMs = Date.now() - queueStart;
  if (queuedMs > 1000) {
    logger.info(`${tag} waited ${Math.round(queuedMs / 1000)}s for a PageSpeed slot — the ${Math.round(DEADLINE_MS / 1000)}s deadline starts now — ${url}`);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEADLINE_MS);
  try {
    const response = await fetch(endpoint, { signal: controller.signal });
    const data = await response.json();

    // Success: a usable Lighthouse result. A clean run stays quiet in the log.
    if (response.ok && !data?.error && data?.lighthouseResult) {
      // Fire-and-forget: never let a cache-write hiccup slow or fail the audit.
      setCachedPsi(url, device, data).catch(() => {});
      return data;
    }

    // `retryable`/`crawlError` on the classified failure are advisory now that
    // nothing retries in-process: they record whether re-running the audit is
    // plausibly worth it, which is what the report tells the operator.
    const failure = classifyPsiFailure(response.status, data);
    logger.error(`${tag} ✗ HTTP ${response.status} [${failure.code}]: ${data?.error?.message || 'no lighthouseResult'} — Technical will be "Not Run" — ${url}`);
    return withFailure(data, failure);
  } catch (error) {
    // An AbortError here is OUR deadline firing, not a server fault, so name it as
    // such — sending the operator to a Cloud Console key they never needed to touch
    // is the most expensive thing this message can get wrong.
    const isTimeout = error.name === 'AbortError';
    const failure = isTimeout
      ? {
          kind: 'timeout', code: 'ATTEMPT_TIMEOUT', retryable: true,
          reason: `Google PageSpeed did not respond within ${Math.round(DEADLINE_MS / 1000)}s. The API was reachable — this audit's own deadline fired first, which usually means the target page is slow enough that Lighthouse needs longer than the budget allows.`,
        }
      : {
          kind: 'network', code: 'NETWORK_ERROR', retryable: true,
          reason: `Could not reach the PageSpeed API: ${error.message}`,
        };
    logger.error(`${tag} ✗ ${isTimeout ? `timed out after ${DEADLINE_MS}ms` : `network: ${error.message}`} — Technical will be "Not Run" — ${url}`);
    // Return {} rather than throwing so technicalMetrics degrades gracefully — the
    // asset-level delivery checks still run against the live page.
    return withFailure({}, failure);
  } finally {
    clearTimeout(timer);
    releasePsiSlot();
  }
}
