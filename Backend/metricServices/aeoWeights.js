/**
 * AEO Platform Weight Matrix
 * Single Source of Truth for all AI platform weighting logic.
 * Weights must sum to 100 for each platform.
 */

const aeoWeights = {
    gemini: {
        schema: 40,           // User Priority: FAQ/Product/JSON-LD
        pageSpeed: 30,        // User Priority: <2s load
        botAccess: 10,
        answerFirst: 10,
        structuredContent: 10,
        llmsTxt: 0,
        citations: 0
    },
    chatgpt: {
        llmsTxt: 40,          // User Priority: llms.txt
        answerFirst: 30,       // User Priority: TL;DR check
        markdownHeaders: 10,
        botAccess: 10,
        schema: 10,
        structuredContent: 0,
        citations: 0,
        pageSpeed: 0
    },
    perplexity: {
        structuredContent: 60, // User Priority: Tables vs Images
        citations: 20,         // Citations/Sources
        pageSpeed: 10,
        botAccess: 10,
        answerFirst: 0,
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
