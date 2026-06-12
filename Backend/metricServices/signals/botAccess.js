import axios from 'axios';
import Puppeteer_Simple from '../../utils/puppeteer_simple.js';

/**
 * Signal 5: Search Index Status (crawl + index eligibility).
 *
 * Measures whether AI/search crawlers can actually CRAWL the audited URL and whether
 * the page is INDEXABLE. (True index *coverage* — how many pages Google has indexed —
 * needs the Search Console URL Inspection API: free, but requires a connected+verified
 * property, so it can't run on an arbitrary audited URL.)
 *
 * Upgrades over the old presence-only check:
 *   • Path-aware robots.txt matching for the actual URL (not just a blanket Disallow: /)
 *   • Honours the X-Robots-Tag HTTP header (not just the <meta robots> tag)
 *   • Reports an expanded set of AI bots; flags whether a Sitemap is declared in robots.txt
 */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// The 3 bots that map to the scored platforms (keys preserved for downstream overrides).
const CORE_BOTS = ['GPTBot', 'Google-Extended', 'PerplexityBot'];
// Extra AI crawlers — reported for visibility, not scored.
const EXTRA_BOTS = ['ClaudeBot', 'anthropic-ai', 'CCBot', 'Bytespider', 'Amazonbot', 'Applebot-Extended', 'Meta-ExternalAgent', 'cohere-ai', 'Google-CloudVertexBot'];

// robots.txt is a static text file. Fetch it fast with axios; only escalate to the
// stealth browser (slow) if a WAF appears to block the plain request — never for a
// clean 404 (which just means "no robots.txt", i.e. everything allowed).
const fetchRobots = async (robotsUrl) => {
    try {
        const resp = await axios.get(robotsUrl, {
            timeout: 6000,
            maxRedirects: 3,
            responseType: 'text',
            transformResponse: [(d) => d],
            headers: { 'User-Agent': UA, Accept: 'text/plain,*/*' },
            validateStatus: () => true,
        });
        if (resp.status === 200 || resp.status === 404) {
            return { status: resp.status, content: typeof resp.data === 'string' ? resp.data : '' };
        }
    } catch { /* fall through to browser */ }

    try {
        const r = await Puppeteer_Simple(robotsUrl);
        if (r.browser) await r.browser.close();
        return { status: r.status, content: r.html };
    } catch {
        return { status: 0, content: '' };
    }
};

// Convert a robots.txt path pattern (supports * wildcard and $ end-anchor) to a regex.
const robotsToRegex = (pattern) => {
    const anchored = pattern.endsWith('$');
    let p = anchored ? pattern.slice(0, -1) : pattern;
    p = p.replace(/[.+?^${}()|[\]\\]/g, '\\$&'); // escape regex specials (note: * not in class)
    p = p.replace(/\*/g, '.*');                  // robots wildcard
    return new RegExp('^' + p + (anchored ? '$' : ''));
};

// Parse robots.txt into user-agent groups + sitemap/crawl-delay directives.
const parseRobots = (content) => {
    const groups = [];
    const sitemaps = [];
    let crawlDelay = null;
    let current = null;
    let lastWasAgent = false;

    for (const raw of content.split(/\r?\n/)) {
        const line = raw.split('#')[0].trim();
        if (!line) continue;
        const idx = line.indexOf(':');
        if (idx === -1) continue;
        const field = line.slice(0, idx).trim().toLowerCase();
        const value = line.slice(idx + 1).trim();

        if (field === 'user-agent') {
            if (!lastWasAgent || !current) { current = { agents: [], rules: [] }; groups.push(current); }
            current.agents.push(value.toLowerCase());
            lastWasAgent = true;
        } else if (field === 'allow' || field === 'disallow') {
            if (!current) { current = { agents: ['*'], rules: [] }; groups.push(current); }
            current.rules.push({ type: field, pattern: value });
            lastWasAgent = false;
        } else if (field === 'sitemap') {
            if (value) sitemaps.push(value);
            lastWasAgent = false;
        } else if (field === 'crawl-delay') {
            const n = parseFloat(value);
            if (!Number.isNaN(n)) crawlDelay = n;
            lastWasAgent = false;
        }
    }
    return { groups, sitemaps, crawlDelay };
};

// Rules that apply to a given bot: its specific group(s) if any, else the * group(s).
const rulesForBot = (groups, bot) => {
    const b = bot.toLowerCase();
    const specific = groups.filter((g) => g.agents.some((a) => a !== '*' && b.startsWith(a)));
    const src = specific.length ? specific : groups.filter((g) => g.agents.includes('*'));
    return src.flatMap((g) => g.rules);
};

// Is `path` allowed for these rules? (longest-match wins; Allow beats Disallow on a tie)
const isPathAllowed = (path, rules) => {
    let best = null; // { type, len }
    for (const r of rules) {
        if (!r.pattern) continue;                // empty Disallow = allow-all (no constraint)
        let re;
        try { re = robotsToRegex(r.pattern); } catch { continue; }
        if (re.test(path)) {
            const len = r.pattern.length;
            if (!best || len > best.len || (len === best.len && r.type === 'allow')) best = { type: r.type, len };
        }
    }
    return !best || best.type === 'allow';
};

const analyzeBotAccess = async (url, $) => {
    try {
        const parsed = new URL(url);
        const path = parsed.pathname || '/';
        const robotsUrl = `${parsed.origin}/robots.txt`;

        const results = {};
        CORE_BOTS.forEach((b) => { results[b] = 'allowed'; });
        const extraBots = {};
        EXTRA_BOTS.forEach((b) => { extraBots[b] = 'allowed'; });

        let robotsFound = false;
        let sitemapDeclared = false;
        let crawlDelay = null;

        try {
            const { status, content } = await fetchRobots(robotsUrl);
            if (status === 200 && content) {
                robotsFound = true;
                const { groups, sitemaps, crawlDelay: cd } = parseRobots(content);
                sitemapDeclared = sitemaps.length > 0;
                crawlDelay = cd;

                CORE_BOTS.forEach((bot) => {
                    if (!isPathAllowed(path, rulesForBot(groups, bot))) results[bot] = 'blocked';
                });
                EXTRA_BOTS.forEach((bot) => {
                    if (!isPathAllowed(path, rulesForBot(groups, bot))) extraBots[bot] = 'blocked';
                });
            }
        } catch { /* robots missing/unreachable — assume crawlable */ }

        const allowedCount = CORE_BOTS.filter((b) => results[b] === 'allowed').length;
        const robotsScore = Math.round((allowedCount / CORE_BOTS.length) * 100);

        // ── Indexability: <meta robots> + X-Robots-Tag header ──
        let metaNoindex = false;
        if ($) {
            const metaRobots = ($('meta[name="robots"]').attr('content') || '').toLowerCase();
            if (metaRobots.includes('noindex') || metaRobots.includes('none')) metaNoindex = true;
        }

        let xRobotsNoindex = false;
        try {
            const head = await axios.head(url, { timeout: 5000, maxRedirects: 3, headers: { 'User-Agent': UA }, validateStatus: () => true });
            const xr = String(head.headers['x-robots-tag'] || '').toLowerCase();
            if (xr.includes('noindex') || xr.includes('none')) xRobotsNoindex = true;
        } catch { /* HEAD unsupported/blocked — rely on meta only */ }

        const isNoindexed = metaNoindex || xRobotsNoindex;
        const metaScore = isNoindexed ? 0 : 100;
        const finalScore = Math.min(robotsScore, metaScore);

        // ── Issues + reason ──
        const blockedCore = CORE_BOTS.filter((b) => results[b] === 'blocked');
        const blockedExtra = EXTRA_BOTS.filter((b) => extraBots[b] === 'blocked');
        const issues = [];
        blockedCore.forEach((b) => issues.push(`${b} is disallowed for ${path === '/' ? 'this site' : `"${path}"`} in robots.txt — allow it so this AI engine can crawl the page.`));
        if (metaNoindex) issues.push('Page has a <meta name="robots" content="noindex"> tag — remove it so the page can be indexed.');
        if (xRobotsNoindex) issues.push('The X-Robots-Tag HTTP header contains "noindex" — remove it (server/CDN config) so the page can be indexed.');
        if (robotsFound && !sitemapDeclared) issues.push('No Sitemap: directive in robots.txt — add "Sitemap: https://…/sitemap.xml" so crawlers find your full URL list.');
        if (blockedExtra.length) issues.push(`Other AI crawlers also blocked: ${blockedExtra.join(', ')}.`);
        if (!robotsFound) issues.push('No robots.txt found — crawlers default to allowed, but a robots.txt with a Sitemap directive is recommended.');

        let reason;
        if (finalScore === 100) {
            reason = '✅ Why: All AI crawlers are allowed and the page is indexable (no noindex via meta or X-Robots-Tag).';
        } else if (isNoindexed) {
            reason = `⚠️ Why no: The page is set to noindex (${metaNoindex ? 'meta robots' : 'X-Robots-Tag'}), so it is excluded from indexing regardless of crawl access.`;
        } else {
            reason = `⚠️ Why no: ${blockedCore.length} of ${CORE_BOTS.length} AI crawlers are blocked in robots.txt (${blockedCore.join(', ')}).`;
        }

        return {
            signal: 'botAccess',
            score: finalScore,
            bots: results,                 // 3 core bots — keys preserved for platform overrides
            extraBots,                     // expanded AI-bot visibility
            isNoindexed,
            metaNoindex,
            xRobotsNoindex,
            robotsScore,
            metaScore,
            robotsFound,
            sitemapDeclared,
            crawlDelay,
            urlPath: path,
            issues,
            reason,
        };
    } catch (error) {
        // Fail open: assume crawlable so a transient robots/HEAD failure doesn't tank the audit.
        return {
            signal: 'botAccess',
            score: 100,
            bots: { GPTBot: 'allowed', 'Google-Extended': 'allowed', PerplexityBot: 'allowed' },
            isNoindexed: false,
            robotsScore: 100,
            metaScore: 100,
            error: error.message,
        };
    }
};

export default analyzeBotAccess;
