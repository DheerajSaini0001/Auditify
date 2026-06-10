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

  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    // PageSpeed returns HTTP 200 + lighthouseResult on success, or a non-2xx with
    // { error: { code, message } } on failure. The most common failure is that
    // Lighthouse simply couldn't analyze THIS url (slow/blocked site, NO_FCP, quota).
    // Surface it — otherwise it shows up as a silently blank Technical section.
    if (!response.ok || data?.error) {
      logger.warn(
        `[PageSpeed] No lab/field data for ${url} (strategy=${device}) — ` +
        `HTTP ${response.status}: ${data?.error?.message || 'unknown error'}`
      );
    } else if (!data?.lighthouseResult) {
      logger.warn(`[PageSpeed] Response for ${url} contained no lighthouseResult.`);
    }

    return data;
  } catch (error) {
    // Network/transport error. Return {} so technicalMetrics degrades gracefully
    // (the asset-level checks — compression, caching, render-blocking, redirects —
    // still run on the live page) instead of throwing and failing the whole audit.
    logger.error(`[PageSpeed] Request failed for ${url}: ${error.message}`);
    return {};
  }
}
