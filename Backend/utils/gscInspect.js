import { fetchGSC } from './gscAuth.js';
import logger from './logger.js';

/**
 * Google Search Console URL Inspection — the FREE (no-billing) real index-coverage
 * source. It only works for a property the user has connected (OAuth) and verified,
 * so it returns null for arbitrary/unowned URLs and the caller falls back to the
 * on-page robots/noindex analysis.
 *
 * Docs: https://developers.google.com/webmaster-tools/v1/urlInspection.index/inspect
 */

const INSPECT_ENDPOINT = 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect';

// Reduce a GSC siteUrl ("sc-domain:example.com" or "https://example.com/") or a page
// URL down to a bare host for matching.
const normalizeDomain = (s) => String(s || '')
    .replace(/^sc-domain:/i, '')
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '')
    .replace(/^www\./i, '')
    .toLowerCase()
    .trim();

// Find the verified GSC property (siteUrl) the user owns that covers this URL, or null.
export const findMatchingProperty = (user, url) => {
    if (!user || !Array.isArray(user.websites) || !user.websites.length) return null;
    let host;
    try { host = new URL(url).hostname.replace(/^www\./i, '').toLowerCase(); } catch { return null; }
    const match = user.websites.find((w) => w.siteId && normalizeDomain(w.siteId) === host);
    return match ? match.siteId : null;
};

/**
 * Inspect the audited URL against the user's verified property.
 * @returns real coverage object, or null if not connected / no matching property / API error.
 */
export const inspectUrl = async (user, auditUrl) => {
    if (!user || (!user.googleAccessToken && !user.googleRefreshToken)) return null;
    const siteUrl = findMatchingProperty(user, auditUrl);
    if (!siteUrl) return null; // user hasn't connected/verified this domain in GSC

    try {
        const resp = await fetchGSC(INSPECT_ENDPOINT, user, {
            method: 'POST',
            body: { inspectionUrl: auditUrl, siteUrl, languageCode: 'en-US' },
        });
        if (!resp.ok) {
            logger.warn(`[GSC Inspect] ${resp.status} for ${auditUrl} (${siteUrl})`);
            return null;
        }
        const data = await resp.json();
        const r = data?.inspectionResult?.indexStatusResult;
        if (!r) return null;

        return {
            source: 'search-console',
            siteUrl,
            verdict: r.verdict || null,                 // PASS = "URL is on Google"
            coverageState: r.coverageState || null,     // human-readable status
            indexingState: r.indexingState || null,
            robotsTxtState: r.robotsTxtState || null,
            pageFetchState: r.pageFetchState || null,
            lastCrawlTime: r.lastCrawlTime || null,
            googleCanonical: r.googleCanonical || null,
            userCanonical: r.userCanonical || null,
            onGoogle: r.verdict === 'PASS',
            inspectionLink: data?.inspectionResult?.inspectionResultLink || null,
        };
    } catch (err) {
        logger.warn(`[GSC Inspect] failed for ${auditUrl}: ${err.message}`);
        return null;
    }
};

export default inspectUrl;
