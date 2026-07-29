import fetch from 'node-fetch'
import configService from '../services/configService.js';
import logger from './logger.js';

export default async function googleAPI(url, device) {
  const API_KEY = configService.getConfig('API_KEY');
  if (!API_KEY) {
    logger.error('[PageSpeed] API_KEY is not configured — Technical Performance data will be empty.');
    return {};
  }

  // encodeURIComponent the url/device: an unencoded url containing `?`, `&` or `#`
  // (e.g. any page with query params) corrupts the PageSpeed query string and the
  // API returns an error instead of a lighthouseResult.
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`
    + `?url=${encodeURIComponent(url)}`
    + `&strategy=${encodeURIComponent(device || 'mobile')}`
    + `&key=${API_KEY}`;

  // PageSpeed failures are often transient — a rate-limit blip (429), a Lighthouse
  // timeout on a slow site, or a momentary 5xx. Retry a couple of times with a short
  // backoff before giving up so we don't mark the whole Technical section "Not Run"
  // over a hiccup. A 400 (bad URL) is permanent, so we don't burn retries on it.
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAY_MS = 1500;
  // [FIX] Per-attempt deadline. `fetch` had no timeout, so a PageSpeed request that
  // hung could burn the whole retry budget on one attempt — and 3 unbounded attempts
  // blow straight past PILLAR_TECH_TIMEOUT_MS (150s), which then kills Technical
  // wholesale instead of letting a retry succeed. 45s × 3 + 2 backoffs = 138s, so the
  // full ladder now fits INSIDE the pillar timeout with headroom.
  const ATTEMPT_TIMEOUT_MS = parseInt(process.env.PAGESPEED_ATTEMPT_TIMEOUT_MS || '45000', 10);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  // Consistent [PageSpeed] tag on every line so the whole retry→outcome trail is one
  // `grep "\[PageSpeed\]"`. `attempt N/M` lets you see retries firing; the ✓/✗ prefix
  // makes the final outcome scannable at a glance.
  const tag = `[PageSpeed] ${device}`;
  let lastData = {};
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS);
    try {
      const response = await fetch(endpoint, { signal: controller.signal });
      const data = await response.json();
      lastData = data;

      // Success: a usable Lighthouse result.
      if (response.ok && !data?.error && data?.lighthouseResult) {
        // Only log when a retry actually saved us — a clean first-try success stays quiet.
        if (attempt > 1) logger.info(`${tag} ✓ recovered on attempt ${attempt}/${MAX_ATTEMPTS} — ${url}`);
        return data;
      }

      const status = response.status;
      const nonRetryable = status === 400 || data?.error?.code === 400;
      const canRetry = attempt < MAX_ATTEMPTS && !nonRetryable;
      const reason = `HTTP ${status}: ${data?.error?.message || 'no lighthouseResult'}`;
      if (canRetry) {
        logger.warn(`${tag} attempt ${attempt}/${MAX_ATTEMPTS} failed (${reason}) — retrying in ${RETRY_DELAY_MS}ms — ${url}`);
      } else {
        logger.error(`${tag} ✗ giving up after ${attempt} attempt(s) (${reason}) — Technical will be "Not Run" — ${url}`);
        return data;
      }
    } catch (error) {
      // Network/transport error — retryable. An AbortError here is our own
      // per-attempt deadline firing, not a server fault, so name it as such.
      const isTimeout = error.name === 'AbortError';
      const what = isTimeout ? `timed out after ${ATTEMPT_TIMEOUT_MS}ms` : `network: ${error.message}`;
      const canRetry = attempt < MAX_ATTEMPTS;
      if (canRetry) {
        logger.warn(`${tag} attempt ${attempt}/${MAX_ATTEMPTS} ${what} — retrying in ${RETRY_DELAY_MS}ms — ${url}`);
      } else {
        logger.error(`${tag} ✗ giving up after ${attempt} attempt(s) (${what}) — Technical will be "Not Run" — ${url}`);
        return {};
      }
    } finally {
      clearTimeout(timer);
    }
    await sleep(RETRY_DELAY_MS);
  }
  // Return {} so technicalMetrics degrades gracefully (asset-level checks still run
  // on the live page) instead of throwing and failing the whole audit.
  return lastData || {};
}
