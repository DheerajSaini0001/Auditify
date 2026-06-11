/**
 * AEO Platform Weight Matrix
 * Single Source of Truth for all AI platform weighting logic.
 * Weights must sum to 100 for each platform.
 */

const aeoWeights = {
    gemini: {
        schema: 30,           // User Priority: FAQ/Product/JSON-LD (−5 → topicalAuthority)
        pageSpeed: 20,        // User Priority: <2s load
        botAccess: 5,
        answerFirst: 5,
        structuredContent: 10,
        indexCoverage: 10,    // Estimated sitemap index eligibility
        entityRecognition: 10, // Org/LocalBusiness schema + Knowledge Graph presence
        citationConsistency: 5, // NAP / brand consistency across on-page sources
        topicalAuthority: 5,   // Industry/local content depth & coverage
        llmsTxt: 0,
        citations: 0
    },
    chatgpt: {
        llmsTxt: 40,          // User Priority: llms.txt
        answerFirst: 17,       // User Priority: TL;DR check (−5 → topicalAuthority)
        markdownHeaders: 10,
        botAccess: 5,
        schema: 5,
        indexCoverage: 10,    // Estimated sitemap index eligibility
        entityRecognition: 5, // Org/LocalBusiness schema + Knowledge Graph presence
        citationConsistency: 3, // NAP / brand consistency across on-page sources
        topicalAuthority: 5,   // Industry/local content depth & coverage
        structuredContent: 0,
        citations: 0,
        pageSpeed: 0
    },
    perplexity: {
        structuredContent: 40, // User Priority: Tables vs Images (−7 → topicalAuthority)
        citations: 20,         // Citations/Sources
        pageSpeed: 10,
        botAccess: 5,
        indexCoverage: 10,     // Estimated sitemap index eligibility
        entityRecognition: 5,  // Org/LocalBusiness schema + Knowledge Graph presence
        citationConsistency: 3, // NAP / brand consistency across on-page sources
        topicalAuthority: 7,   // Industry/local content depth & coverage (Perplexity values depth)
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
