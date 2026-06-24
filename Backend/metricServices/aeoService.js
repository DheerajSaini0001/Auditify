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

// ─────────────────────────────────────────────────────────────────────────
// Spec §2.8 AEO — single weighted PARAMETER table (the section headline score).
// This is distinct from the per-platform (Gemini/ChatGPT/Perplexity) model below,
// which the spec endorses ONLY for bot access. The section score is a graded
// Σ(score×w)/Σ(w) over the applicable spec params — same aggregator pattern used
// by every other rebuilt section (Technical/On-Page/UX/Conversion/AIO …).
//
// Per the Part-4 consolidation note: the three separate Experience/Expertise/
// Authority signals collapse into ONE weighted E-E-A-T composite (editorial pages
// only); Brand Entity Strength + page speed + markdown structure stay
// informational (weight 0) to end the triple-counting of "dealer authority".
const AEO_SECTION_WEIGHTS = {
    schema: 0.20,              // schema markup (page-appropriate)
    answerFirst: 0.15,         // answer-first structure / TL;DR lead
    botAccess: 0.11,           // bot access per engine (averaged inside the signal)
    structuredContent: 0.09,   // machine-parseable tables / lists
    faqQa: 0.07,               // page-specific: FAQ / Finance / Service / VDP
    entityRecognition: 0.07,   // Org schema + Knowledge Graph presence
    citationConsistency: 0.06, // NAP / brand consistency
    citations: 0.05,           // outbound authority / attribution
    topicalAuthority: 0.05,    // depth + topic clustering
    indexCoverage: 0.04,       // index eligibility (GSC real / sitemap estimate)
    sameAs: 0.04,              // page-specific: Home / About — sameAs breadth
    eeat: 0.10,                // page-specific: About / Blog / Service — E-E-A-T composite
    llmsTxt: 0.02,             // /llms.txt present & well-formed
};

// Page-type classifier (URL-driven, mirrors the other sections' classifiers) used
// to gate the page-specific params. Falls back to "generic" so common params always score.
const aeoClassifyPageType = (url = '') => {
    let path = '';
    try { path = new URL(url).pathname.toLowerCase(); } catch { path = String(url).toLowerCase(); }
    if (path === '' || path === '/') return 'home';
    if (/\/(about|our-story|who-we-are|meet-the-team|staff|team)\b/.test(path)) return 'about';
    if (/\/(blog|article|news|post|story|guide|tips|resources)\b/.test(path)) return 'blog';
    if (/\/(faq|faqs|questions|help|support)\b/.test(path)) return 'faq';
    if (/\/(finance|financing|loan|lease|credit|pre-?approval|apply)\b/.test(path)) return 'finance';
    if (/\/(service|service-center|maintenance|repair|schedule-service|book-service)\b/.test(path)) return 'service';
    // VDP: a vehicle detail page usually has a year + make/model or an explicit /vehicle|/inventory/<id>.
    if (/\/(19|20)\d{2}[-/]/.test(path) || /\/(vehicle|inventory|vehicles|vdp|used|new)\/[^/]+\/[^/]+/.test(path)) return 'vdp';
    if (/\/(inventory|cars-for-sale|used-cars|new-cars|search|listings|showroom)\b/.test(path)) return 'srp';
    if (/\/(contact|locations?|directions|hours)\b/.test(path)) return 'contact';
    return 'generic';
};

// Derive an FAQ / Q&A-block sub-score from the schema signal's content detection
// (it already inspects FAQPage schema + on-page FAQ markers) — no new analyzer.
const deriveFaqScore = (schemaSignal) => {
    const d = schemaSignal?.details || {};
    if (d.hasFAQSchema && d.hasFAQContent) return 100;
    if (d.hasFAQSchema) return 80;
    if (d.hasFAQContent) return 50;
    return 25;
};

// Derive a sameAs sub-score from the entity-recognition signal's sameAs breadth
// (on-page only — resolution/name-match would need extra round-trips; flagged estimate).
const deriveSameAsScore = (entitySignal) => {
    const n = entitySignal?.orgSchema?.sameAsCount || 0;
    if (n >= 3) return 100;
    if (n === 2) return 80;
    if (n === 1) return 60;
    return 20;
};

const aeoParamStatus = (score) => (score >= 75 ? 'pass' : score >= 25 ? 'warning' : 'fail');

/**
 * AEO Service Orchestrator
 * Calls each signal analyzer and computes platform-weighted scores.
 */
class AEOService {
    // Spec §2.8 weighted SECTION score (the report headline). Graded aggregator over
    // the applicable params; page-specific params (FAQ/Q&A, sameAs, E-E-A-T) drop out
    // of the denominator on page types where they don't apply (rule-6 N/A renorm).
    static computeSectionScore(signals, url) {
        const pageType = aeoClassifyPageType(url);

        // Page-specific applicability.
        const faqApplies = ['faq', 'finance', 'service', 'vdp'].includes(pageType);
        const eeatApplies = ['about', 'blog', 'service'].includes(pageType);
        const sameAsApplies = ['home', 'about', 'contact'].includes(pageType);

        const eeatComposite = Math.round(
            ((signals.experienceSignals?.score || 0) +
             (signals.expertiseSignals?.score || 0) +
             (signals.authoritySignals?.score || 0)) / 3
        );

        // Each entry: [score, weight, applicable]. infoOnly params carry weight 0.
        const rows = {
            Schema_Markup:          [signals.schema?.score ?? 0,              AEO_SECTION_WEIGHTS.schema,              true],
            Answer_First_Structure: [signals.answerFirst?.score ?? 0,         AEO_SECTION_WEIGHTS.answerFirst,         true],
            Bot_Access:             [signals.botAccess?.score ?? 0,           AEO_SECTION_WEIGHTS.botAccess,           true],
            Structured_Content:     [signals.structuredContent?.score ?? 0,   AEO_SECTION_WEIGHTS.structuredContent,   true],
            FAQ_QA_Blocks:          [deriveFaqScore(signals.schema),          AEO_SECTION_WEIGHTS.faqQa,               faqApplies],
            Entity_Recognition:     [signals.entityRecognition?.score ?? 0,   AEO_SECTION_WEIGHTS.entityRecognition,   true],
            Citation_NAP_Consistency:[signals.citationConsistency?.score ?? 0,AEO_SECTION_WEIGHTS.citationConsistency, true],
            Citations_Attribution:  [signals.citations?.score ?? 0,           AEO_SECTION_WEIGHTS.citations,           true],
            Topical_Authority:      [signals.topicalAuthority?.score ?? 0,    AEO_SECTION_WEIGHTS.topicalAuthority,    true],
            Index_Coverage:         [signals.indexCoverage?.score ?? 0,       AEO_SECTION_WEIGHTS.indexCoverage,       true],
            SameAs_Validation:      [deriveSameAsScore(signals.entityRecognition), AEO_SECTION_WEIGHTS.sameAs,         sameAsApplies],
            EEAT_Composite:         [eeatComposite,                           AEO_SECTION_WEIGHTS.eeat,                eeatApplies],
            Llms_Txt:               [signals.llmsTxt?.score ?? 0,             AEO_SECTION_WEIGHTS.llmsTxt,             true],
        };

        // Informational params (weight 0, displayed but excluded from the denominator).
        const infoRows = {
            Brand_Entity_Strength: signals.brandEntityStrength?.score ?? 0,
            Markdown_Structure:    signals.markdownHeaders?.score ?? 0,
            Page_Speed:            signals.pageSpeed?.score ?? 0,
        };

        let weightedSum = 0;
        let weightTotal = 0;
        let parametersScored = 0;
        const params = {};

        Object.entries(rows).forEach(([key, [score, weight, applicable]]) => {
            params[key] = {
                score: Math.round(score),
                weight,
                applicable,
                status: aeoParamStatus(score),
            };
            if (applicable) {
                weightedSum += score * weight;
                weightTotal += weight;
                parametersScored += 1;
            } else {
                params[key].infoOnly = true; // shown as "N/A here" by the frontend
            }
        });

        Object.entries(infoRows).forEach(([key, score]) => {
            params[key] = { score: Math.round(score), weight: 0, applicable: false, infoOnly: true, status: aeoParamStatus(score) };
        });

        const Percentage = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;

        return {
            Percentage,
            Confidence: 'heuristic',
            pageType,
            parametersScored,
            params,
        };
    }

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

        // Spec §2.8 weighted section score (report headline).
        const section = this.computeSectionScore(signals, url);

        return {
            url,
            overallScore,
            Percentage: section.Percentage,
            Confidence: section.Confidence,
            pageType: section.pageType,
            parametersScored: section.parametersScored,
            params: section.params,
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

        // Spec §2.8 weighted section score (report headline).
        const section = this.computeSectionScore(signals, url);

        return {
            url,
            overallScore,
            Percentage: section.Percentage,
            Confidence: section.Confidence,
            pageType: section.pageType,
            parametersScored: section.parametersScored,
            params: section.params,
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
