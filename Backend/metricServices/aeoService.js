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

/**
 * AEO Service Orchestrator
 * Calls each signal analyzer and computes platform-weighted scores.
 */
class AEOService {
    static async runAudit(url, $, htmlBody, performanceScore = 100) {
        // Use existing cheerio instance if provided to save overhead
        if (!$) {
            $ = cheerio.load(htmlBody);
        }
        
        // Execute all signals
        const results = await Promise.all([
            analyzeAnswerFirst($),
            analyzeLlmsTxt(url),
            analyzeSchemaMarkup($),
            analyzeStructuredContent($),
            analyzeBotAccess(url, $),
            analyzeMarkdownHeaders($),
            analyzeCitations($)
        ]);

        const signals = {
            answerFirst: results[0],
            llmsTxt: results[1],
            schema: results[2],
            structuredContent: results[3],
            botAccess: results[4],
            markdownHeaders: results[5],
            citations: results[6],
            pageSpeed: { score: performanceScore }
        };

        // Compute platform-specific scores
        const platforms = {
            gemini: this.computePlatformScore('gemini', signals, aeoWeights.gemini),
            chatgpt: this.computePlatformScore('chatgpt', signals, aeoWeights.chatgpt),
            perplexity: this.computePlatformScore('perplexity', signals, aeoWeights.perplexity)
        };

        // Apply bot-blocking overrides (Accessibility is 0 if bot blocked)
        if (signals.botAccess.bots['Google-Extended'] === 'blocked') {
            platforms.gemini.score = 0;
            platforms.gemini.blocked = true;
        }
        if (signals.botAccess.bots['GPTBot'] === 'blocked' && !signals.llmsTxt.exists) {
            platforms.chatgpt.score = 0;
            platforms.chatgpt.blocked = true;
        }
        if (signals.botAccess.bots['PerplexityBot'] === 'blocked') {
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
            if (signals.botAccess.bots['Google-Extended'] === 'blocked') issues.push("Google-Extended is blocked in robots.txt.");
            if (signals.schema.score < 40) issues.push("Missing FAQPage/Product schema.");
            if (signals.pageSpeed.score < 80) issues.push("page load is too slow.");
            
            if (issues.length === 0) return "✅ Why: You have excellent JSON-LD Schema and your site loads in under 2 seconds.";
            return `⚠️ Why no: ${issues.join(' ')}`;
        }

        if (platform === 'chatgpt') {
            const issues = [];
            if (signals.botAccess.bots['GPTBot'] === 'blocked') issues.push("GPTBot is blocked in robots.txt (Critical Visibility Issue).");
            if (!signals.llmsTxt.exists) issues.push("Missing an llms.txt file.");
            if (signals.answerFirst.score < 80) issues.push("Content structure is too 'wordy'—missing a TL;DR at the top.");
            
            if (issues.length === 0) return "✅ Why: Optimized for ChatGPT: Clear llms.txt found and concise 'Answer-First' summary detected.";
            return `⚠️ Why no: ${issues.join(' ')}`;
        }

        if (platform === 'perplexity') {
            const issues = [];
            if (signals.botAccess.bots['PerplexityBot'] === 'blocked') issues.push("PerplexityBot is blocked in robots.txt.");
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
