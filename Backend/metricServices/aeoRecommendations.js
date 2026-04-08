/**
 * AEO Recommendation Engine
 * Maps failed or partial signal scores to actionable recommendations.
 */

const getAEORecommendations = (signals) => {
    const recommendations = [];

    // 1. Answer-First Recommendation
    if (signals.answerFirst.score < 100) {
        recommendations.push({
            priority: signals.answerFirst.score === 0 ? "Critical" : "Medium",
            title: signals.answerFirst.score === 40 ? "Simplify Your Summary" : "Add Direct Answer Block",
            action: signals.answerFirst.score === 40 
                ? "Your intro is too wordy (>5 sentences). Scale it down to a 1-2 sentence direct answer ('TL;DR') to improve AI extraction and voice search compatibility."
                : "Add a 1-2 sentence direct answer (TL;DR) within the first 100 words of your content. AI models prioritize these 'Instant Answer' blocks for search snippets.",
            platform: "All",
            impact: 30
        });
    }

    // New: Active Voice / Tone Recommendation (Bonus for Perplexity/Gemini)
    if (signals.answerFirst.score > 0) {
        recommendations.push({
            priority: "Low",
            title: "Switch to Active Voice",
            action: "Ensure your primary answers use active voice and objective facts rather than marketing prose. AI models prefer direct, factual statements.",
            platform: "All",
            impact: 10
        });
    }

    // 2. llms.txt Recommendation
    if (signals.llmsTxt.score < 100) {
        recommendations.push({
            priority: "High",
            title: "Create /llms.txt File",
            action: "Create a plain text file at the root of your domain at /llms.txt. Include: title, description, and links to key pages. See llmstxt.org for format.",
            platform: "ChatGPT",
            impact: 25
        });
    }

    // 3. Schema Markup Recommendation
    if (signals.schema.score === 0) {
        recommendations.push({
            priority: "High",
            title: "Implement JSON-LD Schema",
            action: "Add a <script type='application/ld+json'> block. Preferred types: FAQPage for Q&A content, HowTo for guides, Product for product pages.",
            platform: "Gemini",
            impact: 20
        });
    } else if (signals.schema.score < 100) {
        recommendations.push({
            priority: "Medium",
            title: "Upgrade Schema to FAQPage or HowTo",
            action: "Your page has schema but not the highest-value types. Add FAQPage schema for your most common questions. This is the single biggest Gemini signal.",
            platform: "Gemini",
            impact: 15
        });
    }

    // 4. Structured Content Recommendation
    if (signals.structuredContent.score < 60) {
        recommendations.push({
            priority: "High",
            title: "Convert Prose to Tables or Lists",
            action: "Replace comparison paragraphs with <table> elements. Use <ul>/<ol> for feature lists, steps, and comparisons. AI models parse tables 3× more accurately than prose.",
            platform: "Perplexity",
            impact: 25
        });
    }

    // 5. Bot Access Recommendations
    if (signals.botAccess.bots.GPTBot === "blocked") {
        recommendations.push({
            priority: "Critical",
            title: "Allow GPTBot in robots.txt",
            action: "Remove or replace 'Disallow: /' under 'User-agent: GPTBot' in your robots.txt. Without access, ChatGPT cannot read your site regardless of content quality.",
            platform: "ChatGPT",
            impact: 30
        });
    }

    if (signals.botAccess.bots["Google-Extended"] === "blocked") {
        recommendations.push({
            priority: "Critical",
            title: "Allow Google-Extended in robots.txt",
            action: "Remove 'Disallow: /' under 'User-agent: Google-Extended'. Blocking this agent prevents Gemini from learning from your content.",
            platform: "Gemini",
            impact: 30
        });
    }

    if (signals.botAccess.bots.PerplexityBot === "blocked") {
        recommendations.push({
            priority: "Critical",
            title: "Allow PerplexityBot in robots.txt",
            action: "Remove 'Disallow: /' under 'User-agent: PerplexityBot' in robots.txt to restore Perplexity AI crawl access.",
            platform: "Perplexity",
            impact: 30
        });
    }

    // Sort by impact descending
    return recommendations.sort((a, b) => b.impact - a.impact);
};

export default getAEORecommendations;
