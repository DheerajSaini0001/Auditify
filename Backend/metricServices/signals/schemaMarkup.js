/**
 * Signal 3: Schema Markup Detection (JSON-LD)
 * Detects presence and types of structured data.
 */

const analyzeSchemaMarkup = ($) => {
    const scripts = $('script[type="application/ld+json"]');
    const detectedTypes = new Set();
    let score = 0;

    scripts.each((i, el) => {
        try {
            const json = JSON.parse($(el).html());
            const extractTypes = (obj) => {
                if (Array.isArray(obj)) {
                    obj.forEach(extractTypes);
                } else if (obj && typeof obj === 'object') {
                    if (obj['@type']) {
                        if (Array.isArray(obj['@type'])) {
                            obj['@type'].forEach(t => detectedTypes.add(t));
                        } else {
                            detectedTypes.add(obj['@type']);
                        }
                    }
                    if (obj['@graph']) {
                        extractTypes(obj['@graph']);
                    }
                }
            };
            extractTypes(json);
        } catch (e) {
            // Ignore parse errors
        }
    });

    // Score computation
    const types = Array.from(detectedTypes);
    let faqPoints = 0;
    let howToPoints = 0;
    let productPoints = 0;
    let articlePoints = 0;
    let otherPoints = 0;
    let otherCount = 0;

    types.forEach(type => {
        if (type === 'FAQPage') faqPoints = 50;
        else if (type === 'HowTo') howToPoints = 40;
        else if (type === 'Product') productPoints = 15;
        else if (type === 'Article') articlePoints = 10;
        else {
            if (otherCount < 2) {
                otherPoints += 5;
                otherCount++;
            }
        }
    });

    score = faqPoints + howToPoints + productPoints + articlePoints + otherPoints;
    score = Math.min(score, 100);

    return {
        signal: "schema",
        score: score,
        types: types,
        count: types.length
    };
};

export default analyzeSchemaMarkup;
