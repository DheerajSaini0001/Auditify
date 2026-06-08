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
    if (signals.structuredContent.dataStuckInImages) {
        recommendations.push({
            priority: "High",
            title: "Replace Image Charts with HTML Tables",
            action: "Your comparison charts or data are'stuck' in images. Perplexity and AI crawlers cannot 'read' images reliably. Re-implement charts as <table> elements for better RAG extraction.",
            platform: "Perplexity",
            impact: 40
        });
    } else if (signals.structuredContent.score < 60) {
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

    // 6. Markdown Headers Recommendation
    if (signals.markdownHeaders.score < 80) {
        recommendations.push({
            priority: "Medium",
            title: "Improve Header Hierarchy",
            action: "Ensure your page uses a single H1 and follow-up H2, H3 tags in sequence. This creates a clean Markdown representation that ChatGPT and LLMs use to map your page.",
            platform: "ChatGPT",
            impact: 20
        });
    }

    // 7. Citations Recommendation
    if (signals.citations.score < 70) {
        recommendations.push({
            priority: "Medium",
            title: "Add External Factual Sources",
            action: "Link to reputable 3rd party research or data sources. Use superscript style markers [1] or reference lists. Perplexity and factual AIs prioritize cited data.",
            platform: "Perplexity",
            impact: 20
        });
    }

    if (signals.botAccess.isNoindexed) {
        recommendations.push({
            priority: "Critical",
            title: "Remove Meta 'noindex' Tag",
            action: "Your page has a meta robots 'noindex' tag. This prevents Google and search-based AI engines from indexing your page entirelly.",
            platform: "Gemini",
            impact: 40
        });
    }

    // Sort by impact descending
    return recommendations.sort((a, b) => b.impact - a.impact);
};

export default getAEORecommendations;
