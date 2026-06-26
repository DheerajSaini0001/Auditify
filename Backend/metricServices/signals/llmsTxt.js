import axios from 'axios';
import Puppeteer_Simple from '../../utils/puppeteer_simple.js';

/**
 * Signal 2: llms.txt Standard — presence AND format validation (per llmstxt.org).
 *
 * A valid /llms.txt is a Markdown file: a single H1 (site/business name), an optional
 * blockquote summary, then H2 sections ("## Docs") containing markdown link lists
 * `[name](url): description`. We fetch it and grade how well it follows the spec —
 * not just "does a file exist". Also catches the common soft-404 where a SPA returns
 * its HTML index for /llms.txt with a 200.
 *
 *   • present (valid non-HTML text file)  (max 10)
 *   • h1 (single # title)                 (max 20)
 *   • sections (## headings)              (max 15)
 *   • links (markdown links)              (max 20)
 *   • summary (> blockquote)              (max 10)
 *   • sameDomain (links point to site)    (max  5)
 *   • relevance (content matches the page) (max 20)
 *
 * Relevance guards against a perfectly-formatted file full of Lorem/gibberish: the
 * llms.txt text is compared with the audited page's brand + vocabulary. Lorem-ipsum
 * caps the score at 25; content with no brand/vocabulary overlap caps it at 60.
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const looksLikeHtml = (s) => /<!doctype html|<html[\s>]|<head[\s>]|<body[\s>]/i.test(String(s).slice(0, 3000));

const STOP = new Set(['this', 'that', 'with', 'from', 'your', 'their', 'have', 'will', 'more', 'about', 'page', 'home', 'menu', 'here', 'welcome', 'https', 'http', 'please', 'which', 'these', 'there', 'what', 'when', 'where', 'also', 'into', 'than', 'then', 'them', 'they', 'been', 'were', 'would', 'could', 'should', 'view', 'click', 'learn']);

const tokenize = (s) => {
    const out = new Set();
    String(s || '').toLowerCase().split(/[^a-z0-9]+/).forEach((w) => {
        if (w.length >= 4 && !STOP.has(w) && !/^\d+$/.test(w)) out.add(w);
    });
    return out;
};

const LOREM = /lorem ipsum|dolor sit amet|consectetur adipiscing|sed do eiusmod|ut labore et dolore|excepteur sint/i;

// Brand + vocabulary of the audited page, for comparing against the llms.txt content.
const pageContext = ($) => {
    if (!$) return null;
    const title = $('title').first().text() || '';
    const ogSite = $('meta[property="og:site_name"]').attr('content') || '';
    const desc = $('meta[name="description"]').attr('content') || '';
    const headings = $('h1, h2').map((i, el) => $(el).text()).get().join(' ');
    const bodySlice = $('body').text().replace(/\s+/g, ' ').slice(0, 3000);
    const brandRaw = (ogSite || title.split(/[|\-–—]/)[0] || $('h1').first().text() || '').trim();
    return { pageTokens: tokenize([title, desc, headings, bodySlice].join(' ')), brandTokens: tokenize(brandRaw) };
};

const analyzeLlmsTxt = async (url, $ = null) => {
    const origin = new URL(url).origin;
    const siteHost = new URL(url).hostname.replace(/^www\./, '');
    const llmsUrl = `${origin}/llms.txt`;
    try {
        // /llms.txt is a static text file — fetch fast with axios; escalate to the
        // stealth browser only if a WAF blocks the plain request (not on a clean 404).
        let status = 0;
        let body = '';
        try {
            const resp = await axios.get(llmsUrl, {
                timeout: 6000,
                maxRedirects: 3,
                responseType: 'text',
                transformResponse: [(d) => d],
                headers: { 'User-Agent': UA, Accept: 'text/plain,*/*' },
                validateStatus: () => true,
            });
            status = resp.status;
            body = typeof resp.data === 'string' ? resp.data : '';
        } catch { status = 0; }

        if (status !== 200 && status !== 404) {
            try {
                const r = await Puppeteer_Simple(llmsUrl);
                if (r.browser) await r.browser.close();
                status = r.status;
                body = r.html;
            } catch { /* keep axios result */ }
        }

        // ── Not found ──
        if (status !== 200) {
            return {
                signal: 'llmsTxt', score: 0, exists: false, url: llmsUrl, statusCode: status,
                breakdown: { present: 0, h1: 0, sections: 0, links: 0, summary: 0, sameDomain: 0 },
                issues: ['No /llms.txt found. Create one at your domain root (llmstxt.org): an H1 with your business name, a short > summary, and ## sections linking your key pages.'],
                reason: '⚠️ Why no: No /llms.txt manifest found — ChatGPT/LLM crawlers have no curated map of your key pages.',
            };
        }

        // ── Present but it's an HTML page (SPA / soft-404), not a Markdown file ──
        if (looksLikeHtml(body)) {
            return {
                signal: 'llmsTxt', score: 10, exists: false, url: llmsUrl, statusCode: 200, invalidFormat: 'html',
                breakdown: { present: 10, h1: 0, sections: 0, links: 0, summary: 0, sameDomain: 0 },
                issues: ['/llms.txt returns an HTML page (likely your SPA or 404 fallback), not a Markdown text file. Serve a real plain-text Markdown llms.txt.'],
                reason: '⚠️ Why no: /llms.txt responds 200 but returns HTML, not Markdown — engines will ignore it.',
            };
        }

        // ── Present but empty (no usable content) ──
        if (!body || !body.trim()) {
            return {
                signal: 'llmsTxt', score: 0, exists: true, isEmpty: true, url: llmsUrl, statusCode: 200,
                breakdown: { present: 10, h1: 0, sections: 0, links: 0, summary: 0, sameDomain: 0, relevance: 0 },
                issues: ['/llms.txt exists but is empty — add an H1 with your business name, a short > summary, and ## sections linking your key pages.'],
                reason: '/llms.txt exists but is empty — there is nothing for engines to read.',
            };
        }

        // ── Validate Markdown structure ──
        const hasH1 = /^#(?!#)\s+\S/m.test(body);
        const h2Count = (body.match(/^##(?!#)\s+\S/gm) || []).length;
        const hasSummary = /^>\s+\S/m.test(body);

        // Count page links. Accept BOTH strict Markdown links `[name](url)` and the
        // very common real-world style where pages are listed as bare URLs
        // (`- Home: https://…`). Both give engines the same key-page map, so we don't
        // penalize a useful, on-topic file just for skipping Markdown syntax.
        const mdHrefs = (body.match(/\[[^\]]+\]\(([^)]+)\)/g) || [])
            .map((lm) => (lm.match(/\(([^)]+)\)/) || [])[1] || '');
        const bareHrefs = (body.match(/https?:\/\/[^\s<>")\]]+/g) || [])
            .map((h) => h.replace(/[.,;:]+$/, ''));      // trim trailing punctuation
        const allHrefs = [...new Set([...mdHrefs, ...bareHrefs].filter(Boolean))];
        const linkCount = allHrefs.length;

        let sameDomainLinks = 0;
        for (const href of allHrefs) {
            try {
                const h = href.startsWith('/') ? siteHost : new URL(href).hostname.replace(/^www\./, '');
                if (h === siteHost) sameDomainLinks += 1;
            } catch { if (href.startsWith('/')) sameDomainLinks += 1; }
        }

        // ── Content relevance: does the llms.txt actually describe THIS site? ──
        // Guards against a well-formed file full of Lorem/gibberish.
        const ctx = pageContext($);
        const loremDetected = LOREM.test(body);
        let relevance = 20;          // default full when we have no page to compare against
        let brandMatch = false;
        let overlap = 0;
        let relevanceZero = false;
        if (ctx) {
            const llmsTokens = tokenize(body.replace(/\(([^)]+)\)/g, ' ')); // drop (url) parts, keep descriptive text
            brandMatch = [...ctx.brandTokens].some((t) => llmsTokens.has(t));
            let inter = 0;
            llmsTokens.forEach((t) => { if (ctx.pageTokens.has(t)) inter += 1; });
            overlap = llmsTokens.size ? inter / llmsTokens.size : 0;
            relevance = loremDetected ? 0
                : Math.min(20, (brandMatch ? 10 : 0) + (overlap >= 0.30 ? 10 : overlap >= 0.12 ? 6 : overlap > 0 ? 2 : 0));
            relevanceZero = !loremDetected && !brandMatch && overlap === 0;
        }

        const breakdown = {
            present: 10,
            h1: hasH1 ? 20 : 0,
            sections: h2Count >= 2 ? 15 : h2Count === 1 ? 9 : 0,
            links: linkCount >= 5 ? 20 : linkCount >= 1 ? 12 : 0,
            summary: hasSummary ? 10 : 0,
            sameDomain: sameDomainLinks >= 1 ? 5 : 0,
            relevance,
        };
        let score = Math.min(100, Object.values(breakdown).reduce((a, b) => a + b, 0));
        // Relevance caps: a beautifully-formatted but irrelevant/placeholder file is useless.
        if (loremDetected) score = Math.min(score, 25);
        else if (relevanceZero) score = Math.min(score, 60);

        const issues = [];
        if (loremDetected) issues.push('Contains placeholder Lorem-ipsum text — replace it with real descriptions of your pages (score capped at 25).');
        else if (relevanceZero) issues.push("llms.txt content doesn't match your site (no brand name or shared vocabulary) — describe your actual pages (score capped at 60).");
        else if (relevance < 20) issues.push('Make the H1, summary, and link descriptions reflect your real brand and page content for better relevance.');
        if (!hasH1) issues.push('Add a single H1 (`# Your Business Name`) at the top — the spec requires it.');
        if (h2Count < 2) issues.push(`Organize links under ## sections (e.g. "## Inventory", "## Financing") — found ${h2Count}.`);
        if (linkCount < 5) issues.push(`List more key pages — as \`[name](url): description\` or \`- Name: https://url\` — found ${linkCount}.`);
        if (!hasSummary) issues.push('Add a one-line `>` blockquote summary under the H1.');
        if (sameDomainLinks < 1 && linkCount > 0) issues.push('Link to your own pages (same domain), not just external sites.');

        const reason = score >= 100
            ? '✅ Why: A well-formed, on-topic /llms.txt — H1, summary, sectioned links to your key pages, and content that matches your site.'
            : `⚠️ Why no: /llms.txt scores ${score}/100. ${issues.slice(0, 2).join(' ')}`;

        return {
            signal: 'llmsTxt',
            score,
            exists: true,
            url: llmsUrl,
            statusCode: 200,
            breakdown,
            details: { hasH1, h2Count, linkCount, hasSummary, sameDomainLinks, loremDetected, brandMatch, vocabOverlap: Math.round(overlap * 100) },
            issues,
            reason,
        };
    } catch (error) {
        return {
            signal: 'llmsTxt', score: 0, exists: false, url: llmsUrl, statusCode: 404, fetchError: true,
            breakdown: { present: 0, h1: 0, sections: 0, links: 0, summary: 0, sameDomain: 0 },
            issues: [`llms.txt check failed: ${error.message}`],
            error: error.message,
        };
    }
};

export default analyzeLlmsTxt;
