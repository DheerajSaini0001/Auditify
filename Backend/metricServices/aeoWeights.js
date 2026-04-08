/**
 * AEO Platform Weight Matrix
 * Single Source of Truth for all AI platform weighting logic.
 * Weights must sum to 100 for each platform.
 */

const aeoWeights = {
    gemini: {
        schema: 45,
        botAccess: 45,
        answerFirst: 5,
        llmsTxt: 5,
        structuredContent: 0,
        pageSpeed: 0
    },
    chatgpt: {
        llmsTxt: 45,
        structuredContent: 45,
        answerFirst: 5,
        botAccess: 5,
        schema: 0,
        pageSpeed: 0
    },
    perplexity: {
        structuredContent: 35,
        answerFirst: 35,
        pageSpeed: 30,
        botAccess: 0,
        schema: 0,
        llmsTxt: 0
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
