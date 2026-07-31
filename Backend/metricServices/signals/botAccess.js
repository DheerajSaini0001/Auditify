import { guardedGet, guardedHead } from '../../utils/wafGuard.js';
import cachedStaticFetch from '../../utils/staticFileCache.js';
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

// Each AI platform crawls under SEVERAL user-agents (a training crawler + a
// search/answer bot + a user-triggered fetcher). For AI *visibility* the platform is
// reachable if AT LEAST ONE of its agents may crawl the path — a site that blocks the
// training crawler (e.g. GPTBot) but allows the answer bot (OAI-SearchBot / ChatGPT-User)
// is still visible to that AI. So a platform is "blocked" only when EVERY one of its
// agents is disallowed. The map key is the representative bot name kept for downstream
// overrides (aeoService / aeoRecommendations / frontend all key off these three).
const CORE_BOT_GROUPS = {
    'GPTBot': ['GPTBot', 'OAI-SearchBot', 'ChatGPT-User'],       // ChatGPT / OpenAI
    'Google-Extended': ['Google-Extended', 'Googlebot'],         // Gemini / Google AI (Googlebot powers AI Overviews)
    'PerplexityBot': ['PerplexityBot', 'Perplexity-User'],       // Perplexity
};
// Extra AI crawlers — reported for visibility, not scored. Grouped the same way so a
// partially-allowed AI reads as allowed.
const EXTRA_BOT_GROUPS = {
    'ClaudeBot': ['ClaudeBot', 'anthropic-ai', 'Claude-User', 'Claude-SearchBot'], // Claude / Anthropic
    'CCBot': ['CCBot'],
    'Bytespider': ['Bytespider', 'TikTokSpider'],
    'Amazonbot': ['Amazonbot'],
    'Applebot-Extended': ['Applebot-Extended', 'Applebot'],
    'Meta-ExternalAgent': ['Meta-ExternalAgent'],
    'cohere-ai': ['cohere-ai'],
    'Google-CloudVertexBot': ['Google-CloudVertexBot'],
};
// Representative keys — the rest of the file iterates these (output shape unchanged).
const CORE_BOTS = Object.keys(CORE_BOT_GROUPS);
const EXTRA_BOTS = Object.keys(EXTRA_BOT_GROUPS);

// OpenAI's three crawlers, scored INDIVIDUALLY (not grouped) for the "GPT Bot Access:
// X/3" breakdown. Each is detected independently from robots.txt; the score is the
// count of the three that may crawl the audited path.
const OPENAI_BOTS = ['GPTBot', 'ChatGPT-User', 'OAI-SearchBot'];

// robots.txt is a static text file. Fetch it fast with axios; only escalate to the
// stealth browser (slow) if a WAF appears to block the plain request — never for a
// clean 404 (which just means "no robots.txt", i.e. everything allowed).
const fetchRobotsUncached = async (robotsUrl) => {
    try {
        const resp = await guardedGet(robotsUrl, {
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

// Cached + in-flight-deduped per URL (utils/staticFileCache.js): every audited page's
// AEO pillar wants the SAME origin's robots.txt, so a full audit fired the fetch —
// and, on WAF-fronted sites, the full Chromium escalation above — up to 7 times.
const fetchRobots = (robotsUrl) =>
    cachedStaticFetch(robotsUrl, () => fetchRobotsUncached(robotsUrl),
        (r) => r.status === 200 || r.status === 404);

// Convert a robots.txt path pattern (supports * wildcard and $ end-anchor) to a regex.
const robotsToRegex = (pattern) => {
    const anchored = pattern.endsWith('$');
    let p = anchored ? pattern.slice(0, -1) : pattern;
    p = p.replace(/[.+?^${}()|[\]\\]/g, '\\$&'); // escape regex specials (note: * not in class)
    p = p.replace(/\*/g, '.*');                  // robots wildcard
    return new RegExp('^' + p + (anchored ? '$' : ''));
};

// Parse a `Content-Signal: search=yes,ai-train=no,use=reference` value into a map.
const parseContentSignal = (value) => {
    const out = {};
    for (const part of value.split(',')) {
        const [k, v] = part.split('=').map((s) => (s || '').trim().toLowerCase());
        if (k) out[k] = v || '';
    }
    return out;
};

// Parse robots.txt into user-agent groups + sitemap/crawl-delay directives.
// Content-Signal (Cloudflare's content-usage preference) is captured per group and
// aggregated for the "*" group — it is a reservation of usage rights, NOT a crawl
// block, so it is reported for visibility but never flips a bot to "blocked".
const parseRobots = (content) => {
    const groups = [];
    const sitemaps = [];
    let crawlDelay = null;
    let current = null;
    let lastWasAgent = false;
    let contentSignals = null; // signals declared on the "*" (all-agents) group

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
        } else if (field === 'content-signal') {
            const sig = parseContentSignal(value);
            if (current) current.contentSignal = sig;
            // Surface the wildcard group's signal (the site-wide usage preference).
            if (current && current.agents.includes('*')) contentSignals = { ...(contentSignals || {}), ...sig };
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
    return { groups, sitemaps, crawlDelay, contentSignals };
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

// A platform (group of user-agents) is allowed if AT LEAST ONE of its agents may crawl
// the path. Blocked only when every agent in the group is disallowed.
const isGroupAllowed = (robotsGroups, agents, path) =>
    agents.some((a) => isPathAllowed(path, rulesForBot(robotsGroups, a)));

const analyzeBotAccess = async (url, $) => {
    try {
        const parsed = new URL(url);
        const path = parsed.pathname || '/';
        const robotsUrl = `${parsed.origin}/robots.txt`;

        const results = {};
        CORE_BOTS.forEach((b) => { results[b] = 'allowed'; });
        const extraBots = {};
        EXTRA_BOTS.forEach((b) => { extraBots[b] = 'allowed'; });
        // OpenAI crawlers scored one-by-one (default allowed; flipped per robots.txt).
        const openaiStatus = {};
        OPENAI_BOTS.forEach((b) => { openaiStatus[b] = 'allowed'; });

        let robotsFound = false;
        let sitemapDeclared = false;
        let crawlDelay = null;
        let contentSignals = null;
        let robotsReadable = true; // false only when robots.txt can't be fetched/parsed

        try {
            const { status, content } = await fetchRobots(robotsUrl);
            if (status === 200 && content) {
                robotsFound = true;
                const { groups, sitemaps, crawlDelay: cd, contentSignals: cs } = parseRobots(content);
                sitemapDeclared = sitemaps.length > 0;
                crawlDelay = cd;
                contentSignals = cs;

                // A platform is blocked only when ALL of its user-agents are disallowed.
                Object.entries(CORE_BOT_GROUPS).forEach(([key, agents]) => {
                    if (!isGroupAllowed(groups, agents, path)) results[key] = 'blocked';
                });
                Object.entries(EXTRA_BOT_GROUPS).forEach(([key, agents]) => {
                    if (!isGroupAllowed(groups, agents, path)) extraBots[key] = 'blocked';
                });
                // Each OpenAI crawler is judged on its OWN rules (no grouping).
                OPENAI_BOTS.forEach((bot) => {
                    if (!isPathAllowed(path, rulesForBot(groups, bot))) openaiStatus[bot] = 'blocked';
                });
            } else if (status !== 404) {
                // Not a clean 404 (no file = crawlable) — the fetch failed or was blocked.
                robotsReadable = false;
            }
        } catch { robotsReadable = false; } // robots.txt unreachable

        // Per spec: if robots.txt can't be fetched/parsed, all three GPT bots are Missing.
        if (!robotsReadable) OPENAI_BOTS.forEach((b) => { openaiStatus[b] = 'blocked'; });
        const gptFound = OPENAI_BOTS.filter((b) => openaiStatus[b] === 'allowed');
        const gptMissing = OPENAI_BOTS.filter((b) => openaiStatus[b] === 'blocked');
        const gptBotAccess = {
            score: gptFound.length,          // number of OpenAI crawlers allowed
            max: OPENAI_BOTS.length,         // always 3
            bots: openaiStatus,              // per-bot allowed/blocked
            found: gptFound,                 // allowed bots (✓)
            missing: gptMissing,             // blocked / not-allowed bots (✗)
        };

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
            const head = await guardedHead(url, { timeout: 5000, maxRedirects: 3, headers: { 'User-Agent': UA }, validateStatus: () => true });
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
        // A core bot appears here only when EVERY user-agent in its group is disallowed.
        blockedCore.forEach((b) => issues.push(`Every ${b} crawler (${CORE_BOT_GROUPS[b].join(', ')}) is disallowed for ${path === '/' ? 'this site' : `"${path}"`} in robots.txt — allow at least one so this AI engine can crawl the page.`));
        if (metaNoindex) issues.push('Page has a <meta name="robots" content="noindex"> tag — remove it so the page can be indexed.');
        if (xRobotsNoindex) issues.push('The X-Robots-Tag HTTP header contains "noindex" — remove it (server/CDN config) so the page can be indexed.');
        if (robotsFound && !sitemapDeclared) issues.push('No Sitemap: directive in robots.txt — add "Sitemap: https://…/sitemap.xml" so crawlers find your full URL list.');
        if (blockedExtra.length) issues.push(`Other AI crawlers also blocked: ${blockedExtra.join(', ')}.`);
        if (!robotsFound) issues.push('No robots.txt found — crawlers default to allowed, but a robots.txt with a Sitemap directive is recommended.');
        // Content-Signal is a usage-rights reservation (not a crawl block) — inform only.
        if (contentSignals && (contentSignals['ai-input'] === 'no' || contentSignals['ai-train'] === 'no')) {
            const restricted = ['ai-input', 'ai-train'].filter((k) => contentSignals[k] === 'no');
            issues.push(`robots.txt declares a Content-Signal restricting ${restricted.join(' and ')} — crawling is still allowed, but this reserves rights against ${restricted.includes('ai-input') ? 'AI answer/RAG use' : 'AI training'}. Compliant AIs may exclude your content from those uses.`);
        }

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
            gptBotAccess,                  // OpenAI crawlers scored individually (X/3 + found/missing)
            isNoindexed,
            metaNoindex,
            xRobotsNoindex,
            robotsScore,
            metaScore,
            robotsFound,
            sitemapDeclared,
            crawlDelay,
            contentSignals,                // Content-Signal usage prefs (informational; not a block)
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
            // robots.txt couldn't be resolved here — per spec all GPT bots are Missing (0/3).
            gptBotAccess: {
                score: 0,
                max: OPENAI_BOTS.length,
                bots: OPENAI_BOTS.reduce((o, b) => ({ ...o, [b]: 'blocked' }), {}),
                found: [],
                missing: [...OPENAI_BOTS],
            },
            isNoindexed: false,
            robotsScore: 100,
            metaScore: 100,
            error: error.message,
        };
    }
};

export default analyzeBotAccess;
