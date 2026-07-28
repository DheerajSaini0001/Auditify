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
import { classifyPageType } from '../utils/pageClassifier.js';

// Safety net: no single signal may stall the whole AEO. If one exceeds this budget
// it resolves to a NOT-CALCULATED fallback (score null) so the rest of the audit
// still completes. A timed-out probe is renormalized out of the section score and
// platform gauges — it must never masquerade as a measured 50 (rule 4 / §7 policy 4).
const SIGNAL_TIMEOUT_MS = 20000;
const timeoutFallback = (key) => ({ signal: key, score: null, notCalculated: true, timedOut: true, issues: ['This check timed out and was skipped — it does not count toward the score. Re-run the audit to measure it.'] });
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

// Unified page classifier imported from utils/pageClassifier.js holds the classification rules.

// Derive an FAQ / Q&A-block sub-score from the schema signal's content detection
// (it already inspects FAQPage schema + on-page FAQ markers) — no new analyzer.
const deriveFaqScore = (schemaSignal) => {
    const d = schemaSignal?.details || {};
    if (d.hasFAQSchema && d.hasFAQContent) return 100;
    if (d.hasFAQSchema) return 80;
    if (d.hasFAQContent) return 50;
    return 0; // neither FAQ schema nor Q/A content — absent scores 0 (SCORING_FORMAT §7 rule 3)
};

// Derive a sameAs sub-score from the entity-recognition signal's sameAs breadth
// (on-page only — resolution/name-match would need extra round-trips; flagged estimate).
const deriveSameAsScore = (entitySignal) => {
    const n = entitySignal?.orgSchema?.sameAsCount || 0;
    if (n >= 3) return 100;
    if (n === 2) return 80;
    if (n === 1) return 60;
    return 0; // zero sameAs links — absent scores 0 (SCORING_FORMAT §7 rule 3)
};

const aeoParamStatus = (score) => (score >= 75 ? 'pass' : score >= 25 ? 'warning' : 'fail');

// ─────────────────────────────────────────────────────────────────────────
// Per-platform (Gemini / ChatGPT / Perplexity) parameter view.
// Each platform card lists the parameters it actually scores. For every
// parameter we describe WHAT IT WANTS to pass (the requirement, always shown),
// and — only when the parameter does NOT pass — the concrete CAUSE.
// Passed parameters carry no reason (that is the product requirement).
// Note: deliberately no "Why / Why no" phrasing.

// robots.txt user-agent that each engine actually crawls with.
const PLATFORM_BOTS = { gemini: 'Google-Extended', chatgpt: 'GPTBot', perplexity: 'PerplexityBot' };
const PLATFORM_DISPLAY = { gemini: 'Gemini', chatgpt: 'ChatGPT', perplexity: 'Perplexity' };

// Plain-language label for each parameter as it appears on the platform card.
const PARAM_LABELS = {
    schema: 'Page Data Labels (Schema)',
    answerFirst: 'Quick Answer at the Top',
    botAccess: 'Lets AI Bots In',
    structuredContent: 'Tables & Lists',
    pageSpeed: 'Page Loading Speed',
    llmsTxt: 'llms.txt File',
    markdownHeaders: 'Clear Headings',
    citations: 'Links to Sources',
    indexCoverage: 'Findable in Search',
    entityRecognition: 'Business Identity',
    citationConsistency: 'Matching Contact Info',
    topicalAuthority: 'Depth of Content',
};

// "What it wants to pass" — shown for every parameter, in simple words.
const PARAM_REQUIREMENTS = {
    schema: 'Add hidden data labels (schema) so AI can clearly tell what your page is about.',
    answerFirst: 'Put a short, direct answer in the first few lines so AI can grab it fast.',
    botAccess: 'Allow this AI’s bot in your robots.txt file so it can read the page.',
    structuredContent: 'Show key data in real tables and lists, not inside pictures.',
    pageSpeed: 'Make the page load fast — under about 2 seconds.',
    llmsTxt: 'Add an llms.txt file on your site that tells AI what to read.',
    markdownHeaders: 'Use clear headings and sub-headings so AI can follow the page.',
    citations: 'Link to trusted outside sources so AI can check your facts.',
    indexCoverage: 'Make sure your main pages can be found and are listed in your sitemap.',
    entityRecognition: 'Add your business details (name and type) so AI knows who you are.',
    citationConsistency: 'Use the same name, address, and phone everywhere.',
    topicalAuthority: 'Cover your main topics in depth so AI sees you as an expert.',
};

// Simple-language cause shown ONLY when a parameter does not pass.
const PARAM_CAUSES = {
    schema: 'Your page is missing these hidden data labels (schema).',
    answerFirst: 'There’s no short answer at the top — the page is too wordy for AI to pull a quick answer.',
    pageSpeed: 'The page loads too slowly for AI to read it properly.',
    llmsTxt: 'Missing an llms.txt file.',
    markdownHeaders: 'The page doesn’t have clear headings for AI to follow.',
    citations: 'Few or no links to trusted outside sources.',
    indexCoverage: 'Your pages are hard to find or missing from your sitemap.',
    entityRecognition: 'AI can’t clearly tell who your business is — business details are missing.',
    citationConsistency: 'Your name, address, or phone don’t match across the page.',
    topicalAuthority: 'Not enough depth on your topics to look like an expert.',
};

const PARAM_PASS_THRESHOLD = 75;

/**
 * AEO Service Orchestrator
 * Calls each signal analyzer and computes platform-weighted scores.
 */
class AEOService {
    // Spec §2.8 weighted SECTION score (the report headline). Graded aggregator over
    // the applicable params; page-specific params (FAQ/Q&A, sameAs, E-E-A-T) drop out
    // of the denominator on page types where they don't apply (rule-6 N/A renorm).
    static computeSectionScore(signals, url) {
        const pageType = classifyPageType(url);

        // Page-specific applicability.
        const faqApplies = ['content', 'finance', 'service', 'vdp'].includes(pageType);
        const eeatApplies = ['about', 'content', 'service'].includes(pageType);
        const sameAsApplies = ['home', 'about'].includes(pageType);

        // Not-calculated plumbing (rule 4 / §7 policy 4): a crashed or timed-out
        // probe carries score null. `scored` distinguishes "measured a number"
        // from "couldn't measure" — null scores never enter the denominator and
        // never masquerade as a neutral 50.
        const scored = (signal) => typeof signal?.score === 'number';

        // E-E-A-T composite averages only the sub-signals that actually ran.
        const eeatParts = [signals.experienceSignals, signals.expertiseSignals, signals.authoritySignals].filter(scored);
        const eeatComposite = eeatParts.length
            ? Math.round(eeatParts.reduce((s, p) => s + p.score, 0) / eeatParts.length)
            : null;

        // Derived params are only as good as their source signal: if the source
        // probe didn't run, the derived score is unknown — not "absent = 0".
        const faqScore = scored(signals.schema) ? deriveFaqScore(signals.schema) : null;
        const sameAsScore = scored(signals.entityRecognition) ? deriveSameAsScore(signals.entityRecognition) : null;

        // Each entry: [score|null, weight, applicable]. infoOnly params carry weight 0.
        const rows = {
            Schema_Markup:          [signals.schema?.score ?? null,            AEO_SECTION_WEIGHTS.schema,              true],
            Answer_First_Structure: [signals.answerFirst?.score ?? null,       AEO_SECTION_WEIGHTS.answerFirst,         true],
            Bot_Access:             [signals.botAccess?.score ?? null,         AEO_SECTION_WEIGHTS.botAccess,           true],
            Structured_Content:     [signals.structuredContent?.score ?? null, AEO_SECTION_WEIGHTS.structuredContent,   true],
            FAQ_QA_Blocks:          [faqScore,                                 AEO_SECTION_WEIGHTS.faqQa,               faqApplies],
            Entity_Recognition:     [signals.entityRecognition?.score ?? null, AEO_SECTION_WEIGHTS.entityRecognition,   true],
            Citation_NAP_Consistency:[signals.citationConsistency?.score ?? null,AEO_SECTION_WEIGHTS.citationConsistency, true],
            Citations_Attribution:  [signals.citations?.score ?? null,         AEO_SECTION_WEIGHTS.citations,           true],
            Topical_Authority:      [signals.topicalAuthority?.score ?? null,  AEO_SECTION_WEIGHTS.topicalAuthority,    true],
            Index_Coverage:         [signals.indexCoverage?.score ?? null,     AEO_SECTION_WEIGHTS.indexCoverage,       true],
            SameAs_Validation:      [sameAsScore,                              AEO_SECTION_WEIGHTS.sameAs,              sameAsApplies],
            EEAT_Composite:         [eeatComposite,                            AEO_SECTION_WEIGHTS.eeat,                eeatApplies],
            Llms_Txt:               [signals.llmsTxt?.score ?? null,           AEO_SECTION_WEIGHTS.llmsTxt,             true],
        };

        // Informational params (weight 0, displayed but excluded from the denominator).
        const infoRows = {
            Brand_Entity_Strength: signals.brandEntityStrength?.score ?? null,
            Markdown_Structure:    signals.markdownHeaders?.score ?? null,
            Page_Speed:            signals.pageSpeed?.score ?? null,
        };

        let weightedSum = 0;
        let weightTotal = 0;
        let parametersScored = 0;
        let parametersNotCalculated = 0;
        const params = {};

        Object.entries(rows).forEach(([key, [score, weight, applicable]]) => {
            if (typeof score !== 'number') {
                // Probe didn't run — shown as "not calculated", renormalized out.
                params[key] = { score: null, weight, applicable, status: null, notCalculated: true, infoOnly: true };
                if (applicable) parametersNotCalculated += 1;
                return;
            }
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
            params[key] = typeof score === 'number'
                ? { score: Math.round(score), weight: 0, applicable: false, infoOnly: true, status: aeoParamStatus(score) }
                : { score: null, weight: 0, applicable: false, infoOnly: true, status: null, notCalculated: true };
        });

        const Percentage = weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0;

        return {
            Percentage,
            Confidence: 'heuristic',
            pageType,
            parametersScored,
            parametersNotCalculated,
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
            // Real GSC data IS a measurement — a crashed on-page probe no longer
            // makes this signal "not calculated" once we have field data.
            delete ba.notCalculated;
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
        if (signals.botAccess.bots?.['GPTBot'] === 'blocked') {
            platforms.chatgpt.score = 0;
            platforms.chatgpt.blocked = true;
        }
        if (signals.botAccess.bots?.['PerplexityBot'] === 'blocked') {
            platforms.perplexity.score = 0;
            platforms.perplexity.blocked = true;
        }

        // Per-parameter detail (what each parameter wants + cause when not passed),
        // plus a clean one-line summary derived from it.
        for (const key of ['gemini', 'chatgpt', 'perplexity']) {
            platforms[key].parameters = this.buildPlatformParameters(key, signals, aeoWeights[key]);
            platforms[key].reason = this.generatePlatformReason(key, signals, platforms[key].score, platforms[key].parameters);
        }

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
            Percentage: overallScore,
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
                // Crashed probe → not calculated (score null), renormalized out —
                // never a fake 0 or neutral 50 (rule 4 / §7 policy 4).
                const errorResult = { signal: signalKey, score: null, notCalculated: true, error: err.message, issues: [`This check could not run (${err.message}) — it does not count toward the score. Re-run the audit.`] };
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
        if (signals.botAccess.bots?.['GPTBot'] === 'blocked') {
            platforms.chatgpt.score = 0;
            platforms.chatgpt.blocked = true;
        }
        if (signals.botAccess.bots?.['PerplexityBot'] === 'blocked') {
            platforms.perplexity.score = 0;
            platforms.perplexity.blocked = true;
        }

        for (const key of ['gemini', 'chatgpt', 'perplexity']) {
            platforms[key].parameters = this.buildPlatformParameters(key, signals, aeoWeights[key]);
            platforms[key].reason = this.generatePlatformReason(key, signals, platforms[key].score, platforms[key].parameters);
        }

        const overallScore = Math.round(
            (platforms.gemini.score + platforms.chatgpt.score + platforms.perplexity.score) / 3
        );

        const recommendations = getAEORecommendations(signals);

        // Spec §2.8 weighted section score (report headline).
        const section = this.computeSectionScore(signals, url);

        return {
            url,
            overallScore,
            Percentage: overallScore,
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

    // Decide whether a parameter passes for this platform. Most params pass on the
    // signal score; a few have a concrete state test (bot blocked / file present).
    static isParamPassed(key, signals, platform) {
        const score = typeof signals[key]?.score === 'number' ? signals[key].score : 0;
        if (key === 'botAccess') {
            return signals.botAccess?.bots?.[PLATFORM_BOTS[platform]] !== 'blocked';
        }
        if (key === 'llmsTxt') {
            const l = signals.llmsTxt || {};
            return !!l.exists && !l.isEmpty && (l.score ?? 0) >= PARAM_PASS_THRESHOLD;
        }
        return score >= PARAM_PASS_THRESHOLD;
    }

    // State-aware, plain-language cause for a FAILING parameter. Each branch reads the
    // real signal data so the reason fits the actual state (missing → empty → present
    // but weak / irrelevant), the same breakdown style used for llms.txt.
    static causeFor(key, signals, platform) {
        switch (key) {
            case 'botAccess':
                return `This AI’s bot (${PLATFORM_BOTS[platform]}) is blocked in your robots.txt, so ${PLATFORM_DISPLAY[platform]} can’t read the page.`;

            case 'llmsTxt': {
                const l = signals.llmsTxt || {};
                if (!l.exists) {
                    return l.invalidFormat === 'html'
                        ? 'Your llms.txt link opens a normal web page, not a real text file. Add a plain llms.txt file.'
                        : PARAM_CAUSES.llmsTxt; // "Missing an llms.txt file."
                }
                if (l.isEmpty) return 'Your llms.txt file is there but empty. Add your business name and links to your main pages.';
                const d = l.details || {};
                if (d.loremDetected) return 'Your llms.txt has placeholder (lorem ipsum) text. Replace it with real descriptions of your pages.';
                if (d.brandMatch === false && (d.vocabOverlap ?? 0) === 0) return 'Your llms.txt content doesn’t match your site. Describe your real business and pages.';
                return 'Your llms.txt is missing key parts — a clear title, a short summary, and links to your main pages.';
            }

            case 'structuredContent': {
                const s = signals.structuredContent || {};
                if (s.dataStuckInImages) {
                    return platform === 'perplexity'
                        ? 'Your data is stuck in images, not tables. Perplexity can’t easily read data shown as pictures.'
                        : 'Your data is stuck in images instead of real tables AI can read.';
                }
                if ((s.tables ?? 0) === 0 && (s.lists ?? 0) === 0) return 'Your page has no tables or lists. Put key facts into simple tables and bullet lists.';
                if ((s.tables ?? 0) === 0) return 'Your page has lists but no tables. Add tables for data like specs, prices, or comparisons.';
                return 'Add more tables and lists so AI can read your key data easily.';
            }

            case 'schema': {
                const d = signals.schema?.details || {};
                if (d.faqNeeded || d.howToNeeded) return 'Your page has FAQ / how-to content but no schema labels on it. Add the matching schema so AI can read it.';
                return 'Your page has no FAQ or how-to content for AI to label. Add a short FAQ section with schema.';
            }

            case 'answerFirst': {
                const a = signals.answerFirst || {};
                const sc = a.sentenceCount ?? 0;
                if (!a.found || sc === 0) return 'There’s no clear text at the top of the page for AI to read as an answer.';
                if (sc > 4) return 'The opening is too long-winded. Start with a 1–2 sentence direct answer.';
                return 'The opening is a bit wordy. Tighten it to a 1–2 sentence direct answer at the very top.';
            }

            case 'pageSpeed': {
                const ps = signals.pageSpeed?.score ?? 0;
                if (ps === 0) return 'We couldn’t measure your page speed. Check that the page loads normally.';
                if (ps < 40) return 'Your page is very slow to load, so AI may give up before reading it.';
                return 'Your page loads a bit too slowly. Aim for under about 2 seconds.';
            }

            case 'markdownHeaders': {
                const c = signals.markdownHeaders?.counts || {};
                if ((c.h1 ?? 0) === 0) return 'Your page is missing a main heading (H1). Add one clear title at the top.';
                if ((c.h1 ?? 0) > 1) return 'Your page has several main headings (H1). Use just one clear title.';
                if ((c.h2 ?? 0) < 2) return 'Your page has too few sub-headings. Break the content into clear sections with sub-headings.';
                return 'Your headings jump levels (like H2 to H4). Keep them in order so AI can follow the page.';
            }

            case 'citations': {
                const b = signals.citations?.breakdown || {};
                if ((b.citations ?? 0) === 0) return 'Your page doesn’t link to any trusted outside sources. Add links to back up your facts.';
                if ((b.citations ?? 0) < 45) return 'Add more proof — link to a few trusted sources and include a “Sources” section.';
                return 'Some trust details are missing (clear policies or contact / author info). Add them so AI trusts the page.';
            }

            case 'indexCoverage': {
                const ic = signals.indexCoverage || {};
                if (ic.sitemapFound === false) return 'No sitemap found, so engines have no map of your pages. Add an XML sitemap.';
                return 'Some of your pages may not be set up to show in search. Make sure your main pages can be indexed and are in your sitemap.';
            }

            case 'entityRecognition': {
                const e = signals.entityRecognition?.orgSchema || {};
                if (!e.found) return 'Your site has no business details AI can read. Add Organization info (name, address, logo) so AI knows who you are.';
                const miss = [];
                if (!e.hasAddress) miss.push('a postal address');
                if ((e.sameAsCount ?? 0) === 0) miss.push('links to your social / profile pages');
                if (!e.hasLogo) miss.push('a logo');
                return miss.length ? `Your business details are incomplete — missing ${miss.join(', ')}.` : 'Your business identity could be clearer for AI to recognize.';
            }

            case 'citationConsistency': {
                const cc = signals.citationConsistency || {};
                if ((cc.distinctPhoneCount ?? 0) > 2) return 'Your page shows more than two phone numbers. Pick one or two and use them everywhere.';
                if (!cc.hasSchemaPhone) return 'No clear phone number AI can read. Add one in your business details.';
                if (!cc.hasSchemaAddress) return 'No clear address AI can read. Add your full address in your business details.';
                return 'Your name, address, and phone don’t fully match across the page. Use the exact same details everywhere.';
            }

            case 'topicalAuthority': {
                const t = signals.topicalAuthority || {};
                if ((t.wordCount ?? 0) < 200) return 'This page is thin on content. Add more depth on your main topics.';
                return 'Not enough depth or related pages to look like an expert. Cover your topics more fully and link related pages.';
            }

            default:
                return PARAM_CAUSES[key] || 'This parameter did not meet the threshold for this engine.';
        }
    }

    // Build the per-parameter list for one platform card. Each entry says what the
    // parameter wants (always) and — only if it did not pass — the state-aware cause.
    static buildPlatformParameters(platform, signals, weights) {
        // The parameters a platform actually scores are those with non-zero weight.
        const relevant = Object.keys(weights).filter((k) => weights[k] > 0);

        return relevant.map((key) => {
            // Crashed/timed-out probe → not calculated: no pass/fail verdict, no
            // fabricated cause — the card says the check didn't run.
            if (typeof signals[key]?.score !== 'number') {
                return {
                    key,
                    label: PARAM_LABELS[key] || key,
                    weight: weights[key],
                    score: null,
                    passed: null,
                    notCalculated: true,
                    requirement: PARAM_REQUIREMENTS[key] || '',
                    cause: 'This check could not run on this audit, so it was left out of the score. Re-run the audit to measure it.',
                };
            }
            const score = signals[key].score;
            const passed = this.isParamPassed(key, signals, platform);
            return {
                key,
                label: PARAM_LABELS[key] || key,
                weight: weights[key],
                score,
                passed,
                requirement: PARAM_REQUIREMENTS[key] || '',
                // Passed parameters intentionally carry no reason.
                cause: passed ? null : this.causeFor(key, signals, platform),
            };
        });
    }

    // Clean one-line card summary (no "Why / Why no" phrasing). Derived from the
    // same parameter evaluation so the headline never contradicts the detail list.
    static generatePlatformReason(platform, signals, score, parameters) {
        if (score === 0) {
            const botName = PLATFORM_BOTS[platform];
            if (platform === 'chatgpt' && signals.llmsTxt?.exists) {
                return `You have an llms.txt file, but your robots.txt is blocking GPTBot — so visibility is 0%.`;
            }
            return `Visibility is 0% because ${botName} is blocked in your robots.txt.`;
        }

        const params = parameters || this.buildPlatformParameters(platform, signals, aeoWeights[platform]);
        // Not-calculated checks are excluded here — the one-line summary reports
        // real failures only; the parameter list still shows the skipped checks.
        const failingCauses = params.filter((p) => !p.passed && !p.notCalculated && p.cause).map((p) => p.cause);
        const skippedCount = params.filter((p) => p.notCalculated).length;

        if (failingCauses.length === 0) {
            return skippedCount
                ? `This page is well set up for this AI engine (${skippedCount} check${skippedCount === 1 ? '' : 's'} could not run and ${skippedCount === 1 ? 'was' : 'were'} left out of the score).`
                : 'This page is well set up for this AI engine.';
        }
        return failingCauses.join(' ');
    }

    static computePlatformScore(platformName, signals, weights) {
        let weightedSum = 0;
        let weightTotal = 0;
        const breakdown = {};
        const skipped = [];

        Object.keys(weights).forEach(signalKey => {
            const signalScore = signals[signalKey]?.score;
            const signalWeight = weights[signalKey];
            // Not-calculated signals (crashed/timed-out probes, score null) are
            // renormalized out — the gauge scores only what was actually measured.
            if (typeof signalScore !== 'number') {
                breakdown[signalKey] = null;
                skipped.push(signalKey);
                return;
            }
            weightedSum += signalScore * signalWeight;
            weightTotal += signalWeight;
            breakdown[signalKey] = Math.round((signalScore * signalWeight) / 100);
        });

        return {
            score: weightTotal > 0 ? Math.round(weightedSum / weightTotal) : 0,
            breakdown,
            ...(skipped.length ? { skippedSignals: skipped } : {}),
        };
    }
}

export default AEOService;
