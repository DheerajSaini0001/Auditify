import * as cheerio from 'cheerio';
import aeoWeights from './aeoWeights.js';
import getAEORecommendations from './aeoRecommendations.js';
import analyzeAnswerFirst from './signals/answerFirst.js';
import analyzeLlmsTxt from './signals/llmsTxt.js';
import analyzeSchemaMarkup from './signals/schemaMarkup.js';
import analyzeStructuredContent from './signals/structuredContent.js';
import analyzeBotAccess from './signals/botAccess.js';
import analyzeMarkdownHeaders from './signals/markdownHeaders.js';
import analyzeCitations from './signals/citations.js';
import analyzeIndexCoverage from './signals/indexCoverage.js';
import analyzeEntityRecognition from './signals/entityRecognition.js';
import analyzeBrandEntityStrength from './signals/brandEntityStrength.js';
import analyzeCitationConsistency from './signals/citationConsistency.js';
import analyzeTopicalAuthority from './signals/topicalAuthority.js';
import analyzeExperienceSignals from './signals/experienceSignals.js';
import analyzeExpertiseSignals from './signals/expertiseSignals.js';
import analyzeAuthoritySignals from './signals/authoritySignals.js';
import logger from '../utils/logger.js';

// Safety net: no single signal may stall the whole AEO. If one exceeds this budget
// it resolves to a neutral fallback so the rest of the audit still completes.
const SIGNAL_TIMEOUT_MS = 20000;
const timeoutFallback = (key) => ({ signal: key, score: 50, timedOut: true, issues: ['This check timed out and was skipped.'] });
const withTimeout = (value, key) => {
    let timer;
    return Promise.race([
        // Clear the pending timer as soon as the real signal settles, so a fast
        // signal doesn't log a false "timed out" warning (or keep a timer alive) 20s later.
        Promise.resolve(value).then((v) => { clearTimeout(timer); return v; }),
        new Promise((resolve) => {
            timer = setTimeout(() => {
                logger.warn(`[AEO] signal "${key}" timed out after ${SIGNAL_TIMEOUT_MS}ms — using neutral fallback`);
                resolve(timeoutFallback(key));
            }, SIGNAL_TIMEOUT_MS);
        }),
    ]);
};

/**
 * AEO Service Orchestrator
 * Calls each signal analyzer and computes platform-weighted scores.
 */
class AEOService {
    // Fold real Google Search Console index status into the botAccess signal (when a
    // logged-in dealer audits their own verified property). Real "not indexed" is a
    // concrete problem, so it can only LOWER the score — never mask an on-page noindex.
    static enrichBotAccessWithGSC(signals, gsc) {
        if (!gsc || !signals || !signals.botAccess) return;
        const ba = signals.botAccess;
        ba.gsc = gsc;
        ba.source = 'search-console';
        if (gsc.onGoogle) {
            ba.gscIndexed = true;
            ba.reason = `✅ Google Search Console (real data): URL is indexed — "${gsc.coverageState}"${gsc.lastCrawlTime ? `, last crawled ${String(gsc.lastCrawlTime).slice(0, 10)}` : ''}.`;
        } else {
            ba.gscIndexed = false;
            ba.score = Math.min(typeof ba.score === 'number' ? ba.score : 100, 35);
            const note = `Google Search Console (real data): "${gsc.coverageState || gsc.verdict}" — this page is NOT currently indexed by Google.`;
            ba.issues = [note, ...(Array.isArray(ba.issues) ? ba.issues : [])];
            ba.reason = `⚠️ ${note}`;
        }
    }

    static async runAudit(url, $, htmlBody, performanceScore = 100, options = {}) {
        // Use existing cheerio instance if provided to save overhead
        if (!$) {
            $ = cheerio.load(htmlBody);
        }
        
        // Execute all signals
        const results = await Promise.all([
            withTimeout(analyzeAnswerFirst($), 'answerFirst'),
            withTimeout(analyzeLlmsTxt(url, $), 'llmsTxt'),
            withTimeout(analyzeSchemaMarkup($, url), 'schema'),
            withTimeout(analyzeStructuredContent($), 'structuredContent'),
            withTimeout(analyzeBotAccess(url, $), 'botAccess'),
            withTimeout(analyzeMarkdownHeaders($), 'markdownHeaders'),
            withTimeout(analyzeCitations($, url), 'citations'),
            withTimeout(analyzeIndexCoverage(url), 'indexCoverage'),
            withTimeout(analyzeEntityRecognition(url, $), 'entityRecognition'),
            withTimeout(analyzeBrandEntityStrength(url, $), 'brandEntityStrength'),
            withTimeout(analyzeCitationConsistency(url, $), 'citationConsistency'),
            withTimeout(analyzeTopicalAuthority(url, $), 'topicalAuthority'),
            withTimeout(analyzeExperienceSignals(url, $), 'experienceSignals'),
            withTimeout(analyzeExpertiseSignals(url, $), 'expertiseSignals'),
            withTimeout(analyzeAuthoritySignals(url, $), 'authoritySignals')
        ]);

        const signals = {
            answerFirst: results[0],
            llmsTxt: results[1],
            schema: results[2],
            structuredContent: results[3],
            botAccess: results[4],
            markdownHeaders: results[5],
            citations: results[6],
            indexCoverage: results[7],
            entityRecognition: results[8],
            brandEntityStrength: results[9],
            citationConsistency: results[10],
            topicalAuthority: results[11],
            experienceSignals: results[12],
            expertiseSignals: results[13],
            authoritySignals: results[14],
            pageSpeed: { score: performanceScore }
        };

        // Real GSC index status (if available) — applied before scoring so it counts.
        this.enrichBotAccessWithGSC(signals, options.gsc);

        // Compute platform-specific scores
        const platforms = {
            gemini: this.computePlatformScore('gemini', signals, aeoWeights.gemini),
            chatgpt: this.computePlatformScore('chatgpt', signals, aeoWeights.chatgpt),
            perplexity: this.computePlatformScore('perplexity', signals, aeoWeights.perplexity)
        };

        // Apply bot-blocking overrides (Accessibility is 0 if bot blocked).
        // Guard `bots` with ?. — when botAccess times out its neutral fallback has no
        // `bots`, and a missing entry must read as "not blocked" rather than throw.
        if (signals.botAccess.bots?.['Google-Extended'] === 'blocked') {
            platforms.gemini.score = 0;
            platforms.gemini.blocked = true;
        }
        if (signals.botAccess.bots?.['GPTBot'] === 'blocked' && !signals.llmsTxt.exists) {
            platforms.chatgpt.score = 0;
            platforms.chatgpt.blocked = true;
        }
        if (signals.botAccess.bots?.['PerplexityBot'] === 'blocked') {
            platforms.perplexity.score = 0;
            platforms.perplexity.blocked = true;
        }

        // Generate reasons for each platform using the user's provided terminology
        platforms.gemini.reason = this.generatePlatformReason('gemini', signals, platforms.gemini.score);
        platforms.chatgpt.reason = this.generatePlatformReason('chatgpt', signals, platforms.chatgpt.score);
        platforms.perplexity.reason = this.generatePlatformReason('perplexity', signals, platforms.perplexity.score);

        // Compute overall score (average of 3 platforms)
        const overallScore = Math.round(
            (platforms.gemini.score + platforms.chatgpt.score + platforms.perplexity.score) / 3
        );

        // Generate recommendations
        const recommendations = getAEORecommendations(signals);

        return {
            url,
            overallScore,
            platforms,
            signals,
            recommendations,
            auditedAt: new Date().toISOString()
        };
    }

    static async runAuditStream(url, $, htmlBody, performanceScore = 100, onSignalComplete, options = {}) {
        if (!$) {
            $ = cheerio.load(htmlBody);
        }

        const runAndEmit = async (signalKey, fn) => {
            try {
                const result = await withTimeout(fn(), signalKey);
                if (onSignalComplete) onSignalComplete(signalKey, result);
                return result;
            } catch (err) {
                logger.error(`Error in AEO signal ${signalKey}`, err);
                const errorResult = { score: 0, error: err.message };
                if (onSignalComplete) onSignalComplete(signalKey, errorResult);
                return errorResult;
            }
        };

        const results = await Promise.all([
            runAndEmit('answerFirst', () => analyzeAnswerFirst($)),
            runAndEmit('llmsTxt', () => analyzeLlmsTxt(url, $)),
            runAndEmit('schema', () => analyzeSchemaMarkup($, url)),
            runAndEmit('structuredContent', () => analyzeStructuredContent($)),
            runAndEmit('botAccess', () => analyzeBotAccess(url, $)),
            runAndEmit('markdownHeaders', () => analyzeMarkdownHeaders($)),
            runAndEmit('citations', () => analyzeCitations($, url)),
            runAndEmit('indexCoverage', () => analyzeIndexCoverage(url)),
            runAndEmit('entityRecognition', () => analyzeEntityRecognition(url, $)),
            runAndEmit('brandEntityStrength', () => analyzeBrandEntityStrength(url, $)),
            runAndEmit('citationConsistency', () => analyzeCitationConsistency(url, $)),
            runAndEmit('topicalAuthority', () => analyzeTopicalAuthority(url, $)),
            runAndEmit('experienceSignals', () => analyzeExperienceSignals(url, $)),
            runAndEmit('expertiseSignals', () => analyzeExpertiseSignals(url, $)),
            runAndEmit('authoritySignals', () => analyzeAuthoritySignals(url, $))
        ]);

        const signals = {
            answerFirst: results[0],
            llmsTxt: results[1],
            schema: results[2],
            structuredContent: results[3],
            botAccess: results[4],
            markdownHeaders: results[5],
            citations: results[6],
            indexCoverage: results[7],
            entityRecognition: results[8],
            brandEntityStrength: results[9],
            citationConsistency: results[10],
            topicalAuthority: results[11],
            experienceSignals: results[12],
            expertiseSignals: results[13],
            authoritySignals: results[14],
            pageSpeed: { score: performanceScore }
        };

        // Real GSC index status (if available) — applied before scoring so it counts.
        this.enrichBotAccessWithGSC(signals, options.gsc);

        const platforms = {
            gemini: this.computePlatformScore('gemini', signals, aeoWeights.gemini),
            chatgpt: this.computePlatformScore('chatgpt', signals, aeoWeights.chatgpt),
            perplexity: this.computePlatformScore('perplexity', signals, aeoWeights.perplexity)
        };

        if (signals.botAccess.bots?.['Google-Extended'] === 'blocked') {
            platforms.gemini.score = 0;
            platforms.gemini.blocked = true;
        }
        if (signals.botAccess.bots?.['GPTBot'] === 'blocked' && !signals.llmsTxt.exists) {
            platforms.chatgpt.score = 0;
            platforms.chatgpt.blocked = true;
        }
        if (signals.botAccess.bots?.['PerplexityBot'] === 'blocked') {
            platforms.perplexity.score = 0;
            platforms.perplexity.blocked = true;
        }

        platforms.gemini.reason = this.generatePlatformReason('gemini', signals, platforms.gemini.score);
        platforms.chatgpt.reason = this.generatePlatformReason('chatgpt', signals, platforms.chatgpt.score);
        platforms.perplexity.reason = this.generatePlatformReason('perplexity', signals, platforms.perplexity.score);

        const overallScore = Math.round(
            (platforms.gemini.score + platforms.chatgpt.score + platforms.perplexity.score) / 3
        );

        const recommendations = getAEORecommendations(signals);

        return {
            url,
            overallScore,
            platforms,
            signals,
            recommendations,
            auditedAt: new Date().toISOString()
        };
    }

    static generatePlatformReason(platform, signals, score) {
        if (score === 0) {
            const botName = platform === 'gemini' ? 'Google-Extended' : (platform === 'chatgpt' ? 'GPTBot' : 'PerplexityBot');
            if (platform === 'chatgpt' && signals.llmsTxt.exists) {
                return `⚠️ Configuration Conflict: Even though you have an /llms.txt file, your robots.txt is currently blocking GPTBot, resulting in 0% visibility.`;
            }
            return `Visibility is 0% because ${botName} is blocked in your robots.txt.`;
        }

        const reasons = [];

        if (platform === 'gemini') {
            const issues = [];
            if (signals.botAccess.bots?.['Google-Extended'] === 'blocked') issues.push("Google-Extended is blocked in robots.txt.");
            if (signals.schema.score < 40) issues.push("Missing FAQPage/Product schema.");
            if (signals.pageSpeed.score < 80) issues.push("page load is too slow.");
            
            if (issues.length === 0) return "✅ Why: You have excellent JSON-LD Schema and your site loads in under 2 seconds.";
            return `⚠️ Why no: ${issues.join(' ')}`;
        }

        if (platform === 'chatgpt') {
            const issues = [];
            if (signals.botAccess.bots?.['GPTBot'] === 'blocked') issues.push("GPTBot is blocked in robots.txt (Critical Visibility Issue).");
            if (!signals.llmsTxt.exists) issues.push("Missing an llms.txt file.");
            if (signals.answerFirst.score < 80) issues.push("Content structure is too 'wordy'—missing a TL;DR at the top.");
            
            if (issues.length === 0) return "✅ Why: Optimized for ChatGPT: Clear llms.txt found and concise 'Answer-First' summary detected.";
            return `⚠️ Why no: ${issues.join(' ')}`;
        }

        if (platform === 'perplexity') {
            const issues = [];
            if (signals.botAccess.bots?.['PerplexityBot'] === 'blocked') issues.push("PerplexityBot is blocked in robots.txt.");
            if (signals.structuredContent.dataStuckInImages) issues.push("Your data is stuck in images, not Markdown tables.");
            else if (signals.structuredContent.tables === 0) issues.push("Data is unstructured (missing tables).");
            
            if (signals.citations.score < 70) issues.push("Low citation signals.");

            if (issues.length === 0) return "✅ Why: Perplexity ready: Strong data tables and verifiable external citations detected.";
            return `⚠️ Why no: ${issues.join(' ')} Perplexity cannot 'read' non-structured data easily.`;
        }

        return "Good overall signals detected.";
    }

    static computePlatformScore(platformName, signals, weights) {
        let weightedSum = 0;
        const breakdown = {};

        Object.keys(weights).forEach(signalKey => {
            const signalScore = signals[signalKey].score;
            const signalWeight = weights[signalKey];
            const contribution = (signalScore * signalWeight) / 100;
            
            weightedSum += contribution;
            breakdown[signalKey] = Math.round(contribution);
        });

        return {
            score: Math.round(weightedSum),
            breakdown
        };
    }
}

export default AEOService;
