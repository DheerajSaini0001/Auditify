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
        if (signals.botAccess.bots['GPTBot'] === 'blocked') {
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
            return `Visibility is 0% because ${botName} is blocked in your robots.txt.`;
        }

        if (platform === 'gemini') {
            if (signals.schema.score >= 50) {
                return "High Schema.org coverage (FAQ/HowTo) detected. Gemini leverages this for featured snippets and multi-step answers.";
            } else if (signals.botAccess.score < 100) {
                return "Google Search Index status is compromised; ensure Googlebot-Extended is allowed and 'noindex' is removed.";
            } else {
                return "Improve Gemini visibility by adding FAQPage or HowTo markup to structure your data.";
            }
        }

        if (platform === 'chatgpt') {
            if (signals.llmsTxt.exists && signals.markdownHeaders.score >= 80) {
                return "Optimized for ChatGPT: Clear llms.txt found and clean Markdown-style header hierarchy detected.";
            } else if (!signals.llmsTxt.exists) {
                return "Missing llms.txt. ChatGPT agents use this for efficient context mapping.";
            } else {
                return "Header hierarchy is weak. Use a clean H1->H2->H3 structure for better Markdown extraction.";
            }
        }

        if (platform === 'perplexity') {
            if (signals.structuredContent.tables > 0 && signals.citations.score >= 70) {
                return "Perplexity ready: Strong data tables and verifiable external citations detected for real-time verification.";
            } else if (signals.structuredContent.tables === 0) {
                return "Data is unstructured. Add tables to make your facts 'scrapable' for RAG-based search engines.";
            } else {
                return "Low citation signals. Perplexity values pages that link to reputable sources and use structured references.";
            }
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
