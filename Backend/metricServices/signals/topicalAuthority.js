import axios from 'axios';
import * as cheerio from 'cheerio';
import pLimit from 'p-limit';

/**
 * Signal 12: Topical Authority (Industry / Local Authority).
 *
 * True topical authority is site-wide + off-site (content breadth across the whole
 * site, backlinks, domain authority). For a per-page audit we measure strong on-page
 * proxies, plus a SHALLOW CRAWL of a few internal links to verify the topic cluster
 * is real (substantive pages, not just nav links):
 *
 *   • Content depth        — main-content word count                         (max 20)
 *   • Heading breadth       — # of H2/H3 subtopics                            (max 15)
 *   • Internal link breadth — same-domain, descriptive-anchor links           (max 15)
 *   • Verified cluster      — sampled internal links that are real, deep pages (max 15)
 *   • Industry coverage     — # of automotive subtopics covered               (max 20)
 *   • Local authority       — locality/region, near-me, areaServed, directions (max 15)
 */

const UA = 'Mozilla/5.0 (compatible; DealerPulseAudit/1.0; +https://dealerpulse.app)';
const CRAWL_SAMPLE = 6;
const CRAWL_CONCURRENCY = 4;
const CRAWL_TIMEOUT = 6000;
const MAX_BYTES = 5 * 1024 * 1024;
const SUBSTANTIVE_WORDS = 300;

// Automotive/dealership subtopics — each matched category counts once.
const INDUSTRY_TOPICS = {
    financing: /financ|lease|loan|credit|pre.?approv|payment estimat|apr\b/i,
    tradeIn: /trade.?in|value your (car|trade|vehicle)|apprais/i,
    service: /\bservice\b|maintenance|repair|oil change|tire|brake|service center/i,
    parts: /\bparts\b|accessories|part(s)? department/i,
    warranty: /warrant|protection plan|coverage plan|extended (service|warranty)/i,
    certified: /certified|\bcpo\b|pre.?owned/i,
    inventory: /inventory|new (vehicle|car|truck|suv)|used (vehicle|car|truck|suv)|browse (our )?(inventory|stock)/i,
    specials: /special|offer|deal|incentive|rebate|promotion|clearance/i,
    testDrive: /test drive|schedule (a )?(test )?drive|book a drive/i,
    research: /compare|model|review|buying guide|vs\.?\b|specs|specifications/i,
};

const LOCAL_TERMS = /near me|serving|service area|directions|get directions|areaserved|neighborhood|located in|proudly serv|visit us|our location/i;

const hostnameOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return null; } };

const wordCount = ($) => {
    const body = $('body').clone();
    body.find('script, style, noscript').remove();
    const text = body.text().replace(/\s+/g, ' ').trim();
    return text ? text.split(' ').length : 0;
};

const fetchHtml = async (u) => {
    const res = await axios.get(u, {
        timeout: CRAWL_TIMEOUT,
        maxRedirects: 4,
        maxContentLength: MAX_BYTES,
        responseType: 'text',
        transformResponse: (d) => d,
        headers: { 'User-Agent': UA, Accept: 'text/html' },
        validateStatus: () => true,
    });
    return res;
};

// Same-origin content links (exclude anchors, tel/mailto, files, obvious utility paths).
const extractInternalLinks = ($, baseUrl, origin) => {
    const links = new Set();
    $('a[href]').each((_, el) => {
        const raw = ($(el).attr('href') || '').trim();
        if (!raw || raw.startsWith('#') || /^(tel:|mailto:|javascript:)/i.test(raw)) return;
        let abs;
        try { abs = new URL(raw, baseUrl); } catch { return; }
        if (abs.origin !== origin) return;
        if (/\.(pdf|jpg|jpeg|png|gif|svg|webp|zip|mp4|css|js|xml)$/i.test(abs.pathname)) return;
        if (/\/(cart|checkout|login|signin|account|wp-admin|privacy|terms|sitemap)\b/i.test(abs.pathname)) return;
        abs.hash = '';
        links.add(abs.href);
    });
    return [...links];
};

const pickSample = (arr, n) => {
    if (arr.length <= n) return arr;
    const step = Math.floor(arr.length / n);
    const out = [];
    for (let i = 0; i < arr.length && out.length < n; i += step) out.push(arr[i]);
    return out;
};

const countIndustryTopics = (text) =>
    Object.values(INDUSTRY_TOPICS).filter((re) => re.test(text)).length;

// ── component scorers ──
const depthPoints = (w) => (w >= 700 ? 20 : w >= 400 ? 16 : w >= 200 ? 10 : 4);
const headingPoints = (h) => (h >= 8 ? 15 : h >= 4 ? 11 : h >= 2 ? 6 : 2);
const linkPoints = (n) => (n >= 20 ? 15 : n >= 10 ? 11 : n >= 4 ? 6 : 2);
const clusterPoints = (verified) => (verified >= 5 ? 15 : verified >= 3 ? 11 : verified >= 1 ? 6 : 0);
const industryPoints = (c) => (c >= 6 ? 20 : c >= 4 ? 14 : c >= 2 ? 8 : c >= 1 ? 3 : 0);

const analyzeTopicalAuthority = async (url, $, useCrawl = true) => {
    try {
        const origin = (() => { try { return new URL(url).origin; } catch { return null; } })();
        const mainText = $('body').text();
        const words = wordCount($);
        const headings = $('h2').length + $('h3').length;
        const internalLinks = origin ? extractInternalLinks($, url, origin) : [];

        // ── Shallow crawl: verify a sample of internal links are real, deep pages ──
        let verifiedCluster = 0;
        let crawledTopicText = '';
        if (useCrawl && internalLinks.length) {
            const sample = pickSample(internalLinks, CRAWL_SAMPLE);
            const limit = pLimit(CRAWL_CONCURRENCY);
            const checks = await Promise.all(sample.map((u) => limit(async () => {
                try {
                    const r = await fetchHtml(u);
                    if (r.status !== 200 || !r.data) return null;
                    const c = cheerio.load(r.data);
                    const w = wordCount(c);
                    const hasHeadings = (c('h1').length + c('h2').length) >= 1;
                    return { substantive: w >= SUBSTANTIVE_WORDS && hasHeadings, text: c('body').text().slice(0, 5000) };
                } catch { return null; }
            })));
            checks.filter(Boolean).forEach((r) => {
                if (r.substantive) verifiedCluster += 1;
                crawledTopicText += ' ' + r.text;
            });
        }

        // ── Industry & local coverage (main page + crawled pages) ──
        const combinedText = mainText + ' ' + crawledTopicText;
        const industryCount = countIndustryTopics(combinedText);

        // Local authority signals
        const localTermHit = LOCAL_TERMS.test(mainText);
        const mapEmbed = $('iframe[src*="google.com/maps"], iframe[src*="maps.google"]').length > 0;
        // locality from LocalBusiness schema, checked against page text
        let schemaLocality = null;
        $('script[type="application/ld+json"]').each((_, el) => {
            if (schemaLocality) return;
            try {
                const s = JSON.stringify(JSON.parse($(el).html()));
                const m = s.match(/"addressLocality"\s*:\s*"([^"]+)"/i);
                if (m) schemaLocality = m[1];
            } catch { /* skip */ }
        });
        const localityInText = schemaLocality && new RegExp(schemaLocality.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(mainText);
        const areaServed = /"areaserved"/i.test($('script[type="application/ld+json"]').text() || '');

        const localSignals = [localTermHit, mapEmbed, Boolean(localityInText), areaServed].filter(Boolean).length;
        const localPoints = localSignals >= 3 ? 15 : localSignals === 2 ? 10 : localSignals === 1 ? 5 : 0;

        // ── Compose score ──
        const breakdown = {
            depth: depthPoints(words),
            headings: headingPoints(headings),
            internalLinks: linkPoints(internalLinks.length),
            verifiedCluster: clusterPoints(verifiedCluster),
            industry: industryPoints(industryCount),
            local: localPoints,
        };
        const score = Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0));

        const issues = [];
        if (words < 200) issues.push(`Thin content (~${words} words) — add depth on your core topics.`);
        if (headings < 4) issues.push('Few subtopic headings (H2/H3) — structure the page into topic sections.');
        if (internalLinks.length < 10) issues.push(`Only ${internalLinks.length} internal topic links — build out a topic cluster with related-page links.`);
        if (industryCount < 4) issues.push('Limited industry topic coverage (financing, service, trade-in, CPO, etc.).');
        if (localPoints < 10) issues.push('Weak local-authority signals (city/region terms, "near me", service area, map/directions).');

        const reason = score >= 100
            ? '✅ Why: Deep, well-linked topic coverage with strong industry breadth and clear local signals — engines treat this as an authority on the subject and area.'
            : `⚠️ Why no: Topical authority is incomplete (${score}/100). ${issues.join(' ')}`;

        return {
            signal: 'topicalAuthority',
            score,
            source: useCrawl ? 'on-page+crawl' : 'on-page',
            breakdown,
            wordCount: words,
            headingCount: headings,
            internalLinkCount: internalLinks.length,
            verifiedClusterPages: verifiedCluster,
            industryTopicCount: industryCount,
            localSignals,
            issues,
            reason,
        };
    } catch (error) {
        return {
            signal: 'topicalAuthority',
            score: 50,
            source: 'on-page',
            breakdown: { depth: 0, headings: 0, internalLinks: 0, verifiedCluster: 0, industry: 0, local: 0 },
            issues: [`Topical authority check failed: ${error.message}`],
            error: error.message,
        };
    }
};

export default analyzeTopicalAuthority;
