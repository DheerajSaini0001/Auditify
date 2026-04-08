/**
 * AEO Platform Weight Matrix
 * Single Source of Truth for all AI platform weighting logic.
 * Weights must sum to 100 for each platform.
 */

const aeoWeights = {
    gemini: {
        schema: 50,           // FAQ/HowTo - High weight
        botAccess: 30,        // Google Search Index Status (Robots + Indexability)
        answerFirst: 10,
        llmsTxt: 5,
        structuredContent: 5,
        citations: 0,
        pageSpeed: 0
    },
    chatgpt: {
        llmsTxt: 40,          // llms.txt presence - High weight
        markdownHeaders: 40,   // Markdown-style headers - High weight
        answerFirst: 10,
        botAccess: 5,
        schema: 5,
        structuredContent: 0,
        citations: 0,
        pageSpeed: 0
    },
    perplexity: {
        structuredContent: 35, // Data Tables - High weight
        citations: 35,         // Citations/Sources - High weight
        pageSpeed: 30,         // Page Speed - High weight
        answerFirst: 0,
        botAccess: 0,
        schema: 0,
        llmsTxt: 0,
        markdownHeaders: 0
    }
};

// Validation Assertion
Object.keys(aeoWeights).forEach(platform => {
    const sum = Object.values(aeoWeights[platform]).reduce((a, b) => a + b, 0);
    if (sum !== 100) {
        throw new Error(`AEO Weight Matrix Error: ${platform} weights sum to ${sum}, expected 100.`);
    }
});

export default aeoWeights;
