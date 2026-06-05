/**
 * Signal 3: Schema Markup Detection (JSON-LD)
 * Smart FAQ/HowTo Schema Check
 */

const analyzeSchemaMarkup = ($, url = '') => {
    console.log(`\x1b[90m[AEO:schemaMarkup]\x1b[0m ▶ Analyzing JSON-LD schema blocks...`);
    const schemaBlocks = [];
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const parsed = JSON.parse($(el).html());
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
    console.log(`\x1b[90m[AEO:schemaMarkup]\x1b[0m ✔ Schema types found: [${schemaBlocks.join(', ') || 'none'}]`);

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
    
    // Extract Organization/LocalBusiness schemas recursively
    const orgOrLocalBusinessSchemas = [];
    $('script[type="application/ld+json"]').each((_, el) => {
        try {
            const parsed = JSON.parse($(el).html());
            const extractOrgOrLocalBusiness = (obj) => {
                if (Array.isArray(obj)) {
                    obj.forEach(extractOrgOrLocalBusiness);
                } else if (obj && typeof obj === 'object') {
                    let isOrgOrLocalBusiness = false;
                    if (obj['@type']) {
                        const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
                        isOrgOrLocalBusiness = types.some(t => typeof t === 'string' && /organization|localbusiness/i.test(t));
                    }
                    if (isOrgOrLocalBusiness) {
                        orgOrLocalBusinessSchemas.push(obj);
                    }
                    // Traverse properties recursively
                    for (const key in obj) {
                        if (Object.prototype.hasOwnProperty.call(obj, key) && key !== '@type') {
                            extractOrgOrLocalBusiness(obj[key]);
                        }
                    }
                }
            };
            extractOrgOrLocalBusiness(parsed);
        } catch (e) {}
    });

    const hasOrgOrLocalBusinessSchema = orgOrLocalBusinessSchemas.length > 0;
    const sameAsUrls = [];
    
    orgOrLocalBusinessSchemas.forEach(schemaObj => {
        if (schemaObj.sameAs) {
            const rawUrls = Array.isArray(schemaObj.sameAs) ? schemaObj.sameAs : [schemaObj.sameAs];
            rawUrls.forEach(item => {
                if (typeof item === 'string') {
                    const trimmed = item.trim();
                    if (/^https?:\/\//i.test(trimmed) && !sameAsUrls.includes(trimmed)) {
                        sameAsUrls.push(trimmed);
                    }
                }
            });
        }
    });

    const getAuthoritySource = (url) => {
        try {
            const parsedUrl = new URL(url);
            const hostname = parsedUrl.hostname.toLowerCase();
            const pathname = parsedUrl.pathname.toLowerCase();
            
            if (hostname.includes('wikidata.org')) {
                return 'wikidata';
            }
            if (hostname.includes('wikipedia.org')) {
                return 'wikipedia';
            }
            if (hostname.includes('crunchbase.com')) {
                return 'crunchbase';
            }
            if (hostname.includes('linkedin.com') && pathname.startsWith('/company')) {
                return 'linkedin';
            }
            if (
                hostname.includes('companieshouse.gov.uk') || 
                hostname.includes('company-information.service.gov.uk')
            ) {
                return 'companies_house';
            }
            if (
                hostname.includes('g.page') ||
                hostname.includes('maps.app.goo.gl') ||
                (hostname.includes('google.com') && (pathname.startsWith('/maps') || hostname.startsWith('maps.') || pathname.startsWith('/business')))
            ) {
                return 'google_business_profile';
            }
        } catch (e) {
            const lowerUrl = url.toLowerCase();
            if (lowerUrl.includes('wikidata.org')) return 'wikidata';
            if (lowerUrl.includes('wikipedia.org')) return 'wikipedia';
            if (lowerUrl.includes('crunchbase.com')) return 'crunchbase';
            if (lowerUrl.includes('linkedin.com/company')) return 'linkedin';
            if (lowerUrl.includes('companieshouse.gov.uk') || lowerUrl.includes('company-information.service.gov.uk')) return 'companies_house';
            if (lowerUrl.includes('g.page') || lowerUrl.includes('maps.app.goo.gl') || lowerUrl.includes('google.com/maps') || lowerUrl.includes('maps.google.com') || lowerUrl.includes('google.com/business')) return 'google_business_profile';
        }
        return null;
    };

    const authoritySources = [];
    sameAsUrls.forEach(url => {
        const source = getAuthoritySource(url);
        if (source && !authoritySources.includes(source)) {
            authoritySources.push(source);
        }
    });
    console.log(`\x1b[90m[AEO:schemaMarkup]\x1b[0m ✔ OrgSchema: ${hasOrgOrLocalBusinessSchema}, sameAs: [${sameAsUrls.join(', ') || 'none'}], authoritySources: [${authoritySources.join(', ') || 'none'}]`);

    if (hasOrgOrLocalBusinessSchema) {
        schemaScore = 40;
        if (sameAsUrls.length > 0) {
            schemaScore += 30;
            const uniqueSourcesCount = authoritySources.length;
            if (uniqueSourcesCount >= 1) {
                schemaScore += 15;
            }
            if (uniqueSourcesCount >= 2) {
                schemaScore += 15;
            }
        }
    }

    if (schemaScore > 100) {
        schemaScore = 100;
    }

    let schemaStatus = 'fail';
    let schemaMessage = '';
    let schemaRecommendation = null;

    if (schemaScore === 0) {
        schemaStatus = 'fail';
        schemaMessage = 'No Organization or LocalBusiness schema detected.';
        schemaRecommendation = 'Add an Organization or LocalBusiness JSON-LD schema to establish your digital identity.';
    } else if (schemaScore === 40) {
        schemaStatus = 'warning';
        schemaMessage = 'Organization/LocalBusiness schema is present, but missing sameAs references.';
        schemaRecommendation = 'Add a sameAs array to your schema with links to your official profiles (e.g., Wikipedia, LinkedIn, Wikidata) to prove authenticity.';
    } else if (schemaScore === 70) {
        schemaStatus = 'warning';
        schemaMessage = 'Organization/LocalBusiness schema and sameAs are present, but missing strong authority sources.';
        schemaRecommendation = 'Add links to strong authority sources (such as Wikipedia, Wikidata, Google Business Profile, LinkedIn Company, Crunchbase, or Companies House) to sameAs.';
    } else if (schemaScore === 85) {
        schemaStatus = 'warning';
        schemaMessage = 'Organization/LocalBusiness schema has sameAs and one strong authority source.';
        schemaRecommendation = 'Add an additional strong authority source from a different domain (e.g. Wikidata, Wikipedia, or LinkedIn Company) to maximize your score.';
    } else {
        schemaStatus = 'pass';
        schemaMessage = 'Excellent schema markup: Organization/LocalBusiness schema present with multiple strong authority source references.';
        schemaRecommendation = null;
    }

    console.log(`\x1b[90m[AEO:schemaMarkup]\x1b[0m ✔ status: ${schemaStatus}, score: ${schemaScore} — ${schemaMessage}`);
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
            hasOrgOrLocalBusinessSchema,
            sameAsUrls,
            authoritySources,
            orgSchemaScore: schemaScore
        }
    };
};

export default analyzeSchemaMarkup;
