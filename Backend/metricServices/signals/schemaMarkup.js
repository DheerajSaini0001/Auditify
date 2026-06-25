/**
 * Signal 3: Schema Markup Detection (JSON-LD)
 * Smart FAQ/HowTo Schema Check
 */

const analyzeSchemaMarkup = ($, url = '') => {
    const schemaBlocks = [];
    // The full JSON-LD markup found on the page — pretty-printed and surfaced on the
    // card so users see the exact schema engines parse, not just the detected types.
    const rawSchemas = [];
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const parsed = JSON.parse($(el).html());
            rawSchemas.push(JSON.stringify(parsed, null, 2));
            const extractTypes = (obj) => {
                if (Array.isArray(obj)) {
                    obj.forEach(extractTypes);
                } else if (obj && typeof obj === 'object') {
                    if (obj['@type']) {
                        if (Array.isArray(obj['@type'])) {
                            obj['@type'].forEach(t => schemaBlocks.push(String(t)));
                        } else {
                            schemaBlocks.push(String(obj['@type']));
                        }
                    }
                    if (obj['@graph']) {
                        extractTypes(obj['@graph']);
                    }
                }
            };
            extractTypes(parsed);
        } catch (e) {}
    });

    const hasFAQSchema = schemaBlocks.some(t => /faqpage/i.test(t));
    const hasHowToSchema = schemaBlocks.some(t => /howto/i.test(t));

    const bodyText = $('body').text();
    const h1Text = $('h1').first().text().trim();
    const allText = bodyText.toLowerCase();

    const faqContentSignals = [
        /frequently asked/i.test(allText),
        /\bfaq\b/i.test(allText),
        /what is|how to|how do|why is|when to|can i/i.test(allText),
        $('details, summary').length > 0,
        $('[class*="faq"], [id*="faq"]').length > 0,
        $('[class*="accordion"]').length > 0,
    ].filter(Boolean).length;

    const hasFAQContent = faqContentSignals >= 2;

    const howToContentSignals = [
        /step \d+|step-by-step|how to|tutorial|guide/i.test(allText),
        $('ol li').length >= 3,
        /\d+\.\s+[A-Z]/.test(bodyText),
    ].filter(Boolean).length;

    const hasHowToContent = howToContentSignals >= 2;

    const pathInfo = url || '';
    const isBlogOrArticle = /blog|article|news|post|story/i.test(
        pathInfo || $('body').attr('class') || ''
    );

    const isProductOrServicePage = (() => {
        let score = 0;
        if (/₹|\$|price|pricing/i.test(allText)) score += 2;
        if (/buy now|book now|add to cart|get started|order now/i.test(allText)) score += 2;
        if ($('h1').length === 1 && !/top \d+|best \d+|compare/i.test(h1Text)) score += 1;
        if (/in stock|available|availability/i.test(allText)) score += 1;
        return score >= 3;
    })();

    const isListingPage = $('[class*="card"], [class*="listing"]').length > 5;

    let faqNeeded = false;
    let howToNeeded = false;
    let reason = '';

    if (hasFAQContent && !hasFAQSchema) {
        faqNeeded = true;
        reason = 'Page has FAQ-style content but missing FAQPage schema';
    } else if (hasHowToContent && !hasHowToSchema) {
        howToNeeded = true;
        reason = 'Page has step-by-step content but missing HowTo schema';
    } else if (isProductOrServicePage && !hasFAQSchema) {
        faqNeeded = false;
        reason = 'Product/service page — FAQ schema not required';
    } else if (isListingPage) {
        faqNeeded = false;
        reason = 'Listing page — FAQ schema not applicable';
    }

    const isContactPage =
        /contact|get.?in.?touch|reach.?us|support/i.test(allText) &&
        /(phone|email|address|call us)/i.test(allText);

    const isUtilityPage =
        /about.?us|privacy|terms|sitemap|careers|cookie/i.test(url);

    let schemaScore = 0;
    let schemaStatus = '';
    let schemaMessage = '';
    let schemaRecommendation = null;

    if (isContactPage || isUtilityPage) {
        schemaScore = 100;
        schemaStatus = 'pass';
        schemaMessage = 'Contact or utility page — FAQ/HowTo schema not applicable. Full score awarded.';
        schemaRecommendation = null;
    } else if (hasFAQSchema && hasHowToSchema) {
        schemaScore = 100;
        schemaStatus = 'pass';
        schemaMessage = 'FAQPage and HowTo schema both present and correctly implemented.';
    } else if (hasFAQSchema || hasHowToSchema) {
        schemaScore = 75;
        schemaStatus = 'pass';
        schemaMessage = `${hasFAQSchema ? 'FAQPage' : 'HowTo'} schema found.`;
    } else if (faqNeeded || howToNeeded) {
        schemaScore = 20;
        schemaStatus = 'fail';
        schemaMessage = reason;
        schemaRecommendation = faqNeeded
            ? 'Add FAQPage schema to your FAQ section.'
            : 'Add HowTo schema with numbered steps.';
    } else if (isProductOrServicePage || isListingPage) {
        schemaScore = 100;
        schemaStatus = 'pass';
        schemaMessage = 'FAQ/HowTo schema is not required for this page type. Full score awarded.';
    } else {
        schemaScore = 50;
        schemaStatus = 'warning';
        schemaMessage = 'No FAQ or HowTo content detected.';
        schemaRecommendation = 'Consider adding an FAQ section to improve AEO score.';
    }

    return {
        signal: "schema",
        score: schemaScore,
        status: schemaStatus,
        message: schemaMessage,
        recommendation: schemaRecommendation,
        details: {
            hasFAQSchema,
            hasHowToSchema,
            hasFAQContent,
            hasHowToContent,
            isProductOrServicePage,
            isListingPage,
            faqNeeded,
            howToNeeded,
            reason,
            schemaTypes: [...new Set(schemaBlocks)],
            rawSchemas
        }
    };
};

export default analyzeSchemaMarkup;
