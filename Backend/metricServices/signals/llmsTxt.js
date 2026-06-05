import Puppeteer_Simple from '../../utils/puppeteer_simple.js';

/**
 * Intrinsic Quality Check for llms.txt (Case 5 fix)
 * Does NOT depend on UI/page content at all.
 * Evaluates the llms.txt file on its own merits.
 */
function evaluateLlmsIntrinsicQuality(llmsContent) {
    const lines = llmsContent.split('\n').map(l => l.trim()).filter(Boolean);
    let score = 0;
    const issues = [];

    // Check 1: Has standard section headers (# Title or ## Section)
    const hasTitle = lines.some(l => /^#\s+.{3,}/.test(l));
    const hasSections = lines.filter(l => /^##\s+.{3,}/.test(l)).length;
    if (hasTitle) score += 25;
    else issues.push('Missing primary title (# Title)');
    if (hasSections >= 1) score += 25;
    else issues.push('Missing section headers (## Section)');

    // Check 2: Has at least one valid URL
    const urlPattern = /https?:\/\/[^\s)>"]{5,}/;
    const hasUrls = lines.some(l => urlPattern.test(l));
    if (hasUrls) score += 25;
    else issues.push('No URLs found in llms.txt');

    // Check 3: Adequate length (at least 100 chars of meaningful content)
    const meaningfulLength = llmsContent.replace(/\s+/g, ' ').trim().length;
    if (meaningfulLength >= 100) score += 25;
    else issues.push('Content too short to be useful (<100 chars)');

    return { intrinsicScore: score, issues };
}

/**
 * UI-based Content Match (used only when UI content is reliable)
 * Compares llms.txt keywords against page title/description/headings.
 */
function calculateContentMatch(llmsContent, $) {
    // Guard: $ must be a valid cheerio instance
    if (!$ || typeof $ !== 'function') {
        return { matchScore: 0, confidence: 'low', reason: 'no_cheerio' };
    }

    const pageContent = [
        $('title').text() || '',
        $('meta[name="description"]').attr('content') || '',
        $('h1,h2,h3')
            .map((_, el) => $(el).text())
            .get()
            .join(' ')
    ].join(' ');

    // Case 5 trigger: UI content itself is too thin to be reliable
    if (pageContent.trim().length < 50) {
        return { matchScore: 0, confidence: 'low', reason: 'ui_content_thin' };
    }

    const normalize = (text) =>
        text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 4);

    const llmsWords = new Set(normalize(llmsContent));
    const pageWords = new Set(normalize(pageContent));

    // Additional guard: if llms.txt itself has almost no words, confidence is low
    if (llmsWords.size < 3) {
        return { matchScore: 0, confidence: 'low', reason: 'llms_too_sparse' };
    }

    const matches = [...llmsWords].filter(word => pageWords.has(word));

    return {
        matchScore: Math.round(
            (matches.length / Math.max(llmsWords.size, 1)) * 100
        ),
        confidence: 'high'
    };
}

const analyzeLlmsTxt = async (url, $) => {
    try {
        const rootUrl = new URL(url).origin;
        const llmsUrl = `${rootUrl}/llms.txt`;

        console.log(`\x1b[31m[AEO:llmsTxt]\x1b[0m ▶ Fetching ${llmsUrl}...`);
        const { html, status, browser } = await Puppeteer_Simple(llmsUrl);

        if (browser) await browser.close();

        // ─── CASE 1: File doesn't exist ───────────────────────────────────
        if (status !== 200) {
            console.log(`\x1b[31m[AEO:llmsTxt]\x1b[0m ❌ CASE 1 — File missing (HTTP ${status})`);
            return {
                signal: "llmsTxt",
                score: 0,
                exists: false,
                status: "missing",
                details: "Missing: No /llms.txt manifest found for OpenAI context mapping.",
                url: llmsUrl,
                statusCode: status
            };
        }

        // ─── CASE 2: File exists but no content ───────────────────────────
        if (!html || html.trim().length < 10) {
            console.log(`\x1b[31m[AEO:llmsTxt]\x1b[0m ⚠ CASE 2 — File found but empty (${html?.trim().length ?? 0} chars)`);
            return {
                signal: "llmsTxt",
                score: 25,
                exists: true,
                status: "empty",
                details: "Empty: /llms.txt file exists but has no meaningful content.",
                url: llmsUrl,
                statusCode: status
            };
        }

        // ─── CASE 5: UI content is unreliable — use intrinsic quality check ──
        const { matchScore, confidence, reason } = calculateContentMatch(html, $);
        console.log(`\x1b[31m[AEO:llmsTxt]\x1b[0m ✔ File fetched (${html.trim().length} chars), confidence: ${confidence}, matchScore: ${matchScore ?? 'N/A'}`);

        if (confidence === 'low') {
            // Don't depend on UI. Score llms.txt on its own merit.
            const { intrinsicScore, issues } = evaluateLlmsIntrinsicQuality(html);
            console.log(`\x1b[31m[AEO:llmsTxt]\x1b[0m ⚠ CASE 5 — UI unreliable (${reason}). Intrinsic score: ${intrinsicScore}/100. Issues: ${issues.join('; ') || 'none'}`);

            const detailMsg = intrinsicScore >= 75
                ? "File Present: UI content too thin to cross-verify, but llms.txt structure looks good."
                : `Unverifiable: UI content too thin to cross-verify. llms.txt issues: ${issues.join('; ')}.`;

            return {
                signal: "llmsTxt",
                score: intrinsicScore >= 75 ? 70 : 45,
                exists: true,
                status: "unverifiable",
                details: detailMsg,
                url: llmsUrl,
                statusCode: status,
                intrinsicScore,
                uiIssue: reason || 'ui_content_thin'
            };
        }

        // ─── CASE 3: File + content exists but mismatches UI ─────────────
        if (matchScore < 30) {
            console.log(`\x1b[31m[AEO:llmsTxt]\x1b[0m ❌ CASE 3 — Poor match: ${matchScore}% keyword overlap`);
            return {
                signal: "llmsTxt",
                score: 50,
                exists: true,
                status: "poor_match",
                details: `Mismatch: /llms.txt content doesn't reflect your actual site (${matchScore}% keyword overlap). Update it to match your page topics.`,
                url: llmsUrl,
                statusCode: status,
                matchScore
            };
        }

        // Partial Match (between 30–70%)
        if (matchScore < 70) {
            console.log(`\x1b[31m[AEO:llmsTxt]\x1b[0m ⚠ Partial match: ${matchScore}% keyword overlap`);
            return {
                signal: "llmsTxt",
                score: 75,
                exists: true,
                status: "partial_match",
                details: `Partial: llms.txt partially matches your site content (${matchScore}% overlap). Add more topic keywords.`,
                url: llmsUrl,
                statusCode: status,
                matchScore
            };
        }

        // ─── CASE 4: File + content matches UI ───────────────────────────
        console.log(`\x1b[31m[AEO:llmsTxt]\x1b[0m ✅ CASE 4 — Good match: ${matchScore}% keyword overlap`);
        return {
            signal: "llmsTxt",
            score: 100,
            exists: true,
            status: "good_match",
            details: `Optimized: /llms.txt is well-structured and matches your site content (${matchScore}% keyword overlap).`,
            url: llmsUrl,
            statusCode: status,
            matchScore
        };

    } catch (error) {
        console.log(`\x1b[31m[AEO:llmsTxt]\x1b[0m ❌ Fatal error: ${error.message}`);
        return {
            signal: "llmsTxt",
            score: 0,
            exists: false,
            status: "error",
            details: "Error: Could not fetch /llms.txt. Ensure the file is publicly accessible.",
            url: `${new URL(url).origin}/llms.txt`,
            statusCode: 404,
            fetchError: true
        };
    }
};

export default analyzeLlmsTxt;