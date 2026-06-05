import fetch from 'node-fetch'
import configService from '../services/configService.js';

const TRANSIENT_CODES = new Set(['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN', 'ECONNREFUSED', 'EPIPE', 'ENOTFOUND']);

const isTransient = (err) =>
  TRANSIENT_CODES.has(err?.code) ||
  err?.name === 'AbortError' ||
  err?.type === 'request-timeout' ||
  /socket hang up|network|timeout|econnreset/i.test(err?.message || '');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Fetches Google PageSpeed Insights data.
 * The PageSpeed API is slow and flaky, so this:
 *  - bounds each attempt with a timeout (AbortController),
 *  - retries transient network errors and 5xx/429 with backoff,
 *  - returns `null` (instead of throwing) on final failure, so a flaky external API
 *    never fails the entire audit — technicalMetrics degrades gracefully.
 *
 * @returns {Promise<object|null>}
 */
export default async function googleAPI(url, device, { retries = 2, timeout = 45000 } = {}) {
  const API_KEY = configService.getConfig('API_KEY');
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${encodeURIComponent(device)}&key=${API_KEY}`;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    try {
      const response = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timer);

      // Retry transient server-side errors (rate limit / 5xx) with backoff.
      if ((response.status === 429 || response.status >= 500) && attempt < retries) {
        await sleep(1000 * (attempt + 1));
        continue;
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timer);
      console.error(`Error fetching Google PageSpeed data (attempt ${attempt + 1}/${retries + 1}): ${error.message}`);
      if (isTransient(error) && attempt < retries) {
        await sleep(1000 * (attempt + 1)); // linear backoff: 1s, 2s
        continue;
      }
      // Final failure — degrade gracefully so the audit still completes with partial data.
      return null;
    }
  }

  return null;
}
