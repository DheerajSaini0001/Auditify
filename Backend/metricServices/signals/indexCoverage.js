import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';
import zlib from 'zlib';
import { promisify } from 'util';

const gunzip = promisify(zlib.gunzip);

/**
 * Signal 8: Index Coverage (estimated from the public XML sitemap).
 *
 * Google does not expose another site's real Search Console index data publicly,
 * so this signal *estimates* index eligibility:
 *   1. Discover the sitemap (robots.txt "Sitemap:" → /sitemap.xml → /sitemap_index.xml)
 *   2. Count declared/submitted URLs (following one level of sitemap-index nesting)
 *   3. Sample an *adaptive* number of those URLs (~15% of the total, clamped to
 *      MIN_SAMPLE..MAX_SAMPLE) and check each is genuinely indexable
 *      (HTTP 200, no `noindex`, self-canonical, same origin). Fetches are throttled
 *      to SAMPLE_CONCURRENCY so we stay polite to the target and bound wall-clock.
 *   4. Coverage ≈ indexable / sampled, projected over the submitted total
 *
 * It measures *indexability* (eligibility to be indexed), not whether Google has
 * actually indexed the page — that requires authenticated Search Console access.
 */

const UA = 'Mozilla/5.0 (compatible; DealerPulseAudit/1.0; +https://dealerpulse.app)';

// Adaptive sampling: scale with sitemap size so the check is meaningful on large
// sites without being wasteful on small ones, but never so big it slows the audit.
const SAMPLE_FRACTION = 0.15;   // aim to spot-check ~15% of submitted URLs
const MIN_SAMPLE = 10;          // floor so small sites still get a useful read
const MAX_SAMPLE = 25;          // ceiling so huge sites don't slow the audit
const SAMPLE_CONCURRENCY = 6;   // parallel page fetches (polite + bounded wall-clock)

const MAX_CHILD_SITEMAPS = 5;   // bound nested sitemap-index fetches
const CHILD_CONCURRENCY = 4;    // fetch child sitemaps in parallel (faster discovery)
const MAX_URLS_COUNT = 5000;    // cap the "submitted" tally to avoid huge sitemaps
const SITEMAP_TIMEOUT = 4500;   // ms per sitemap/robots fetch
const SAMPLE_TIMEOUT = 5000;    // ms per sampled-page fetch (kept short for speed)
const MAX_BYTES = 8 * 1024 * 1024;

// Internal deadlines so this signal always returns REAL (possibly partial) data well
// under aeoService's 20s global guard — instead of being killed and faked to a 50.
const DISCOVERY_BUDGET_MS = 10000; // cap sitemap discovery, reserving time to sample
const TOTAL_BUDGET_MS = 16000;     // overall internal budget (≈4s margin under the guard)

// How many URLs to actually fetch given the submitted total.
const computeSampleSize = (submitted) =>
    Math.min(submitted, Math.max(MIN_SAMPLE, Math.min(MAX_SAMPLE, Math.round(submitted * SAMPLE_FRACTION))));

const fetchUrl = async (u, timeout = SITEMAP_TIMEOUT) => {
    const res = await axios.get(u, {
        timeout,
        maxRedirects: 5,
        maxContentLength: MAX_BYTES,
        maxBodyLength: MAX_BYTES,
        responseType: 'text',
        transformResponse: (d) => d, // keep raw text (don't auto-parse JSON)
        headers: { 'User-Agent': UA, Accept: '*/*' },
        validateStatus: () => true,
    });
    return { status: res.status, data: res.data, headers: res.headers };
};

// Compare by registrable host, ignoring a leading "www." and the protocol — so a
// sitemap that lists https://www.cardekho.com/... still counts when the audited
// origin is https://cardekho.com (and vice-versa). The old strict origin check
// silently dropped every URL in that very common case → "0 of 0".
const normHost = (h) => String(h || '').replace(/^www\./i, '').toLowerCase();
const isSameSite = (u, host) => {
    try { return normHost(new URL(u).hostname) === normHost(host); } catch { return false; }
};

// Fetch a sitemap as text, transparently decompressing gzipped sitemaps. Big sites
// commonly serve child sitemaps as .xml.gz (Content-Type application/gzip, NOT
// Content-Encoding: gzip), which axios does NOT auto-decompress — so reading them
// as text yields binary garbage that xml2js can't parse (→ 0 URLs found).
const fetchSitemapText = async (u, timeout = SITEMAP_TIMEOUT) => {
    const res = await axios.get(u, {
        timeout,
        maxRedirects: 5,
        maxContentLength: MAX_BYTES,
        maxBodyLength: MAX_BYTES,
        responseType: 'arraybuffer',
        headers: { 'User-Agent': UA, Accept: '*/*' },
        validateStatus: () => true,
    });
    let buf = Buffer.from(res.data);
    // gzip magic bytes (0x1f 0x8b) or a .gz URL → decompress.
    if ((buf[0] === 0x1f && buf[1] === 0x8b) || /\.gz(?:$|\?)/i.test(u)) {
        try { buf = await gunzip(buf); } catch { /* not actually gzipped — keep raw */ }
    }
    return { status: res.status, data: buf.toString('utf8'), headers: res.headers };
};

const discoverSitemaps = async (origin, deadline) => {
    const found = new Set();
    if (Date.now() < deadline) {
        try {
            const r = await fetchUrl(`${origin}/robots.txt`);
            if (r.status === 200 && typeof r.data === 'string') {
                r.data.split(/\r?\n/).forEach((line) => {
                    const m = line.match(/^\s*sitemap:\s*(\S+)/i);
                    if (m) found.add(m[1].trim());
                });
            }
        } catch { /* no robots.txt — fall back to defaults below */ }
    }
    found.add(`${origin}/sitemap.xml`);
    found.add(`${origin}/sitemap_index.xml`);
    return [...found];
};

// Recursively collect <loc> URLs, following one level of sitemap-index nesting.
// Stops early once past the discovery deadline (acc.truncated flags partial reads).
const collectUrls = async (sitemapUrl, acc, deadline) => {
    if (acc.urls.length >= MAX_URLS_COUNT) return;
    if (Date.now() > deadline) { acc.truncated = true; return; }
    let parsed;
    try {
        const r = await fetchSitemapText(sitemapUrl);
        if (r.status !== 200 || !r.data) return;
        parsed = await parseStringPromise(r.data);
    } catch { return; }

    if (parsed?.sitemapindex?.sitemap) {
        acc.foundSitemap = true;
        const children = parsed.sitemapindex.sitemap
            .map((s) => s.loc?.[0])
            .filter(Boolean)
            .slice(0, MAX_CHILD_SITEMAPS);
        // Fetch child sitemaps in parallel (bounded) so a big index doesn't run serially.
        const limit = pLimit(CHILD_CONCURRENCY);
        await Promise.all(children.map((child) => limit(() => collectUrls(child, acc, deadline))));
    } else if (parsed?.urlset?.url) {
        acc.foundSitemap = true;
        for (const entry of parsed.urlset.url) {
            const loc = entry.loc?.[0];
            if (loc) acc.urls.push(loc.trim());
            if (acc.urls.length >= MAX_URLS_COUNT) break;
        }
    }
};

// Pick an evenly-spaced sample so we don't only test the first N URLs.
const pickSample = (urls, n) => {
    if (urls.length <= n) return urls;
    const step = Math.floor(urls.length / n);
    const out = [];
    for (let i = 0; i < urls.length && out.length < n; i += step) out.push(urls[i]);
    return out;
};

const checkIndexable = async (u, timeout = SAMPLE_TIMEOUT) => {
    try {
        const r = await fetchUrl(u, timeout);
        if (r.status !== 200) return { ok: false, reason: `HTTP ${r.status}` };

        const $ = cheerio.load(r.data);
        const metaRobots = ($('meta[name="robots"]').attr('content') || '').toLowerCase();
        const xRobots = String(r.headers['x-robots-tag'] || '').toLowerCase();
        if (metaRobots.includes('noindex') || xRobots.includes('noindex')) {
            return { ok: false, reason: 'noindex tag' };
        }

        // A canonical pointing at a *different* URL means Google will likely fold
        // this page into another — i.e. it won't be indexed in its own right.
        const canonical = $('link[rel="canonical"]').attr('href');
        if (canonical) {
            try {
                const canon = new URL(canonical, u).href.replace(/\/$/, '');
                const self = new URL(u).href.replace(/\/$/, '');
                if (canon !== self) return { ok: false, reason: 'canonicalized elsewhere' };
            } catch { /* malformed canonical — ignore */ }
        }
        return { ok: true };
    } catch {
        return { ok: false, reason: 'fetch failed' };
    }
};

// The signal card only renders "Passed"/green at score === 100; anything below
// is shown as red/partial. So a fully-indexable sample maps to 100 (green),
// and partial coverage to graded sub-100 scores (red, "needs work").
const scoreFromRate = (rate) => {
    if (rate >= 1) return 100;   // every sampled URL is indexable
    if (rate >= 0.80) return 75;
    if (rate >= 0.50) return 55;
    return 25;
};

const analyzeIndexCoverage = async (url) => {
    const start = Date.now();
    const discoveryDeadline = start + DISCOVERY_BUDGET_MS;
    const overallDeadline = start + TOTAL_BUDGET_MS;
    const timeLeft = () => overallDeadline - Date.now();
    try {
        const origin = new URL(url).origin;
        const originHost = new URL(url).hostname;
        const sitemaps = await discoverSitemaps(origin, discoveryDeadline);

        const acc = { urls: [], foundSitemap: false, truncated: false };
        for (const sm of sitemaps) {
            if (Date.now() > discoveryDeadline) { acc.truncated = true; break; }
            await collectUrls(sm, acc, discoveryDeadline);
            // First working sitemap is enough for an estimate — stop fetching the rest.
            if (acc.urls.length > 0 || acc.urls.length >= MAX_URLS_COUNT) break;
        }

        const submittedUrls = [...new Set(acc.urls)].filter((u) => isSameSite(u, originHost));
        const submitted = submittedUrls.length;

        if (!acc.foundSitemap || submitted === 0) {
            return {
                signal: 'indexCoverage',
                score: 20,
                source: 'sitemap-estimate',
                sitemapFound: acc.foundSitemap,
                submitted,
                sampled: 0,
                indexable: 0,
                estimatedCoverage: 0,
                estimatedIndexed: 0,
                issues: acc.foundSitemap
                    ? ['Sitemap found but it lists no crawlable URLs.']
                    : ['No XML sitemap found via robots.txt, /sitemap.xml, or /sitemap_index.xml.'],
                reason: acc.foundSitemap
                    ? '⚠️ Why no: A sitemap exists but lists no crawlable URLs, so search/AI engines have no index map to follow.'
                    : '⚠️ Why no: No XML sitemap detected. Without one, Google has no reliable list of pages to index — coverage is likely incomplete.',
            };
        }

        const intended = pickSample(submittedUrls, computeSampleSize(submitted));
        const perFetch = Math.max(2500, Math.min(SAMPLE_TIMEOUT, timeLeft()));
        const limit = pLimit(SAMPLE_CONCURRENCY);

        // Run the sample fetches but stop collecting at the overall deadline, scoring
        // from whatever genuinely completed — real partial data, never a fake fallback.
        const collected = [];
        const tasks = intended.map((u) => limit(async () => { collected.push(await checkIndexable(u, perFetch)); }));
        await Promise.race([
            Promise.allSettled(tasks),
            new Promise((res) => setTimeout(res, Math.max(0, timeLeft()))),
        ]);
        const checks = collected.slice(); // snapshot; ignore any late stragglers

        const sampled = checks.length;

        // Edge: discovery ate the budget and nothing got sampled — still real data
        // (we found the sitemap and counted URLs), just no indexability read yet.
        if (sampled === 0) {
            return {
                signal: 'indexCoverage',
                score: 60,
                source: 'sitemap-estimate',
                sitemapFound: true,
                submitted,
                sampled: 0,
                indexable: 0,
                estimatedCoverage: 0,
                estimatedIndexed: 0,
                partial: true,
                issues: [`Sitemap found with ${submitted}${acc.truncated ? '+' : ''} URLs, but indexability sampling ran out of time on this (slow) site — re-run to sample pages.`],
                reason: `⚠️ Partial: sitemap found (${submitted}${acc.truncated ? '+' : ''} URLs) but page sampling timed out — coverage not yet measured.`,
            };
        }

        const indexable = checks.filter((c) => c.ok).length;
        const rate = indexable / sampled;
        const estimatedCoverage = Math.round(rate * 100);
        const estimatedIndexed = Math.round(submitted * rate);
        const score = scoreFromRate(rate);
        const partial = sampled < intended.length || acc.truncated;

        // Summarise why pages failed the indexability check.
        const issueCounts = {};
        checks.filter((c) => !c.ok).forEach((c) => {
            issueCounts[c.reason] = (issueCounts[c.reason] || 0) + 1;
        });
        const issues = Object.entries(issueCounts).map(([reason, count]) => `${count} of ${sampled} sampled: ${reason}`);
        if (sampled < intended.length) issues.push(`Time-limited: sampled ${sampled} of ${intended.length} intended URLs (slow site).`);
        if (acc.truncated) issues.push(`Time-limited sitemap read: "${submitted}" submitted is a lower bound.`);

        const reason = score >= 100
            ? `✅ Why: ~${estimatedCoverage}% of sampled sitemap URLs are indexable (HTTP 200, no noindex, self-canonical). ~${estimatedIndexed} of ${submitted}${acc.truncated ? '+' : ''} submitted pages are likely eligible.`
            : `⚠️ Why no: Only ~${estimatedCoverage}% of sampled sitemap URLs look indexable (~${estimatedIndexed} of ${submitted}${acc.truncated ? '+' : ''}). ${issues.join('; ')}`;

        return {
            signal: 'indexCoverage',
            score,
            source: 'sitemap-estimate',
            sitemapFound: true,
            submitted,
            sampled,
            indexable,
            estimatedCoverage,
            estimatedIndexed,
            partial,
            issues,
            reason,
        };
    } catch (error) {
        // Neutral score on failure so a flaky network doesn't unfairly tank the audit.
        return {
            signal: 'indexCoverage',
            score: 50,
            source: 'sitemap-estimate',
            sitemapFound: false,
            submitted: 0,
            sampled: 0,
            indexable: 0,
            estimatedCoverage: 0,
            estimatedIndexed: 0,
            issues: [`Index coverage check failed: ${error.message}`],
            error: error.message,
        };
    }
};

export default analyzeIndexCoverage;
