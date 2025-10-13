// import puppeteer from "puppeteer";
import puppeteer from "../Tools/puppeteers.js";
import * as cheerio from "cheerio";
function checkStructuredData($) {
    const selector = 'script[type="application/ld+json"]';
    const scripts = $(selector);

    if (scripts.length === 0) return 0;

    let validCount = 0;

    scripts.each((i, el) => {
        try {
            const json = JSON.parse($(el).html());
            if (json && typeof json === 'object') validCount++;
        } catch (e) {
            // ignore invalid JSON
        }
    });

    const score = validCount > 0 ? 1 : 0; // 1 if at least one valid JSON-LD found
    return score;
}

function checkContentNLPFriendly($) {
    // Check for semantic tags
    const semanticTags = ['article', 'section', 'header', 'footer', 'main'];
    const hasSemanticTag = semanticTags.some(tag => $(tag).length > 0);

    // Check for proper heading structure
    const headings = ['h1', 'h2', 'h3'];
    const hasHeadings = headings.some(tag => $(tag).length > 0);

    // Optional: check for paragraphs / lists
    const hasParagraphs = $('p').length > 0;
    const hasLists = $('ul, ol').length > 0;

    // If page has semantic structure + headings + content → NLP-friendly
    const score = (hasSemanticTag && hasHeadings && (hasParagraphs || hasLists)) ? 1 : 0;
    return score;
}

function checkFastPageLoadForAI() {
    try {
        let loadTime = 0;

        if (performance.getEntriesByType) {
            // Modern API
            const [entry] = performance.getEntriesByType('navigation');
            if (entry) {
                loadTime = entry.loadEventEnd - entry.startTime; // in ms
            }
        }

        // Fallback to legacy timing
        if (!loadTime && performance.timing) {
            const t = performance.timing;
            loadTime = t.loadEventEnd - t.navigationStart;
        }

        // Convert to seconds
        const loadTimeSec = loadTime / 1000;

        // Score 1 if under 2s, else 0
        return loadTimeSec > 0 && loadTimeSec <= 2 ? 1 : 0;
    } catch (err) {
        console.error('Error checking page load time:', err);
        return 0;
    }
}

function checkAPIDataAccess($) {
    // Heuristic checks for API/data endpoints
    let apiFound = false;

    // 1. Check for script tags fetching JSON
    $('script[src]').each((i, el) => {
        const src = $(el).attr('src').toLowerCase();
        if (src.includes('.json') || src.includes('api') || src.includes('graphql')) {
            apiFound = true;
            return false; // break loop
        }
    });

    // 2. Check for <link> tags for manifest/api
    if (!apiFound) {
        $('link[rel]').each((i, el) => {
            const rel = $(el).attr('rel').toLowerCase();
            if (rel.includes('manifest') || rel.includes('api')) {
                apiFound = true;
                return false; // break loop
            }
        });
    }

    // 3. Optional: check inline scripts for "fetch" or "XMLHttpRequest" (basic)
    if (!apiFound) {
        $('script:not([src])').each((i, el) => {
            const text = $(el).html().toLowerCase();
            if (text.includes('fetch(') || text.includes('xmlhttprequest')) {
                apiFound = true;
                return false;
            }
        });
    }

    const score = apiFound ? 1 : 0; // 1 if any API/data access found
    return score;
}

function checkKeywordsEntitiesAnnotated($) {
    let hasKeywords = false;

    // 1. Meta keywords
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (metaKeywords && metaKeywords.trim().length > 0) {
        hasKeywords = true;
    }

    // 2. Headings (H1/H2) as entity indicators
    const headings = $('h1, h2').length > 0;

    // 3. Images with meaningful alt
    const imagesWithAlt = $('img[alt]').filter((i, el) => {
        const altText = $(el).attr('alt').trim();
        return altText.length > 0;
    }).length > 0;

    // If any of these present → AI can detect keywords/entities
    const score = (hasKeywords || headings || imagesWithAlt) ? 1 : 0;
    return score;
}
function checkContentUpdatedRegularly($) {
    let score = 0;
    try {
        // 1. Check meta last-modified
        const metaModified = $('meta[name="last-modified"]').attr('content');
        if (metaModified) {
            const date = new Date(metaModified);
            const now = new Date();
            const diffDays = (now - date) / (1000 * 60 * 60 * 24);
            if (diffDays <= 30) score = 1; // consider updated in last 30 days
        }

        // 2. Check <time datetime=""> tags
        if (score === 0) {
            const timeTags = $('time[datetime]');
            timeTags.each((i, el) => {
                const dateStr = $(el).attr('datetime');
                const date = new Date(dateStr);
                const now = new Date();
                const diffDays = (now - date) / (1000 * 60 * 60 * 24);
                if (diffDays <= 30) {
                    score = 1; // recent update found
                    return false; // break loop
                }
            });
        }

    } catch (e) {
        console.error('Error checking content update:', e);
        score = 0;
    }

    return score;
}
function checkDynamicContentAvailable($) {
    let dynamicFound = false;

    // 1. Look for fetch / XHR usage in inline scripts
    $('script:not([src])').each((i, el) => {
        const text = $(el).html().toLowerCase();
        if (text.includes('fetch(') || text.includes('xmlhttprequest') || text.includes('axios')) {
            dynamicFound = true;
            return false; // break loop
        }
    });

    // 2. Look for framework indicators in inline scripts
    if (!dynamicFound) {
        const frameworks = ['react', 'vue', 'angular', 'svelte'];
        $('script:not([src])').each((i, el) => {
            const text = $(el).html().toLowerCase();
            if (frameworks.some(fw => text.includes(fw))) {
                dynamicFound = true;
                return false; // break loop
            }
        });
    }

    // 3. Look for data-* attributes as hint for dynamic injection
    if (!dynamicFound) {
        $('*').each((i, el) => {
            const attrs = el.attribs || {};
            if (Object.keys(attrs).some(attr => attr.startsWith('data-'))) {
                dynamicFound = true;
                return false; // break loop
            }
        });
    }

    const score = dynamicFound ? 1 : 0;
    return score;
}

function checkBehaviorTrackingImplemented($) {
    let trackingFound = false;

    // 1. Look for common analytics scripts
    const analyticsKeywords = [
        'google-analytics',
        'gtag(',
        'ga(',
        'mixpanel',
        'heap',
        'segment'
    ];

    $('script').each((i, el) => {
        const src = ($(el).attr('src') || '').toLowerCase();
        const text = ($(el).html() || '').toLowerCase();
        if (
            analyticsKeywords.some(keyword => src.includes(keyword) || text.includes(keyword))
        ) {
            trackingFound = true;
            return false; // break loop
        }
    });

    // 2. Look for inline event listeners (click/scroll/mousemove)
    if (!trackingFound) {
        const events = ['addEventListener(\'click\'', 'addEventListener("click"',
                        'addEventListener(\'scroll\'', 'addEventListener("scroll"',
                        'addEventListener(\'mousemove\'', 'addEventListener("mousemove"'];
        $('script:not([src])').each((i, el) => {
            const scriptText = $(el).html();
            if (events.some(ev => scriptText.includes(ev))) {
                trackingFound = true;
                return false; // break loop
            }
        });
    }

    const score = trackingFound ? 1 : 0;
    return score;
}
function checkSegmentationProfilingReady($) {
    let segmentationFound = false;

    // 1. Look for analytics libraries that support segmentation
    const analyticsKeywords = ['google-analytics', 'gtag', 'mixpanel', 'heap', 'segment'];
    $('script').each((i, el) => {
        const src = ($(el).attr('src') || '').toLowerCase();
        const text = ($(el).html() || '').toLowerCase();
        if (analyticsKeywords.some(keyword => src.includes(keyword) || text.includes(keyword))) {
            segmentationFound = true;
            return false; // break loop
        }
    });

    // 2. Look for data-* attributes on DOM elements
    if (!segmentationFound) {
        if ($('[data-user], [data-segment], [data-profile], [data-audience]').length > 0) {
            segmentationFound = true;
        }
    }

    // 3. Look for inline scripts containing segmentation keywords
    if (!segmentationFound) {
        const keywords = ['userid', 'segment', 'profile', 'audience'];
        $('script:not([src])').each((i, el) => {
            const scriptText = ($(el).html() || '').toLowerCase();
            if (keywords.some(k => scriptText.includes(k))) {
                segmentationFound = true;
                return false;
            }
        });
    }

    const score = segmentationFound ? 1 : 0;
    return score;
}
function checkInternalLinkingAIFriendly($, domain) {
    if (!domain) {
        console.error('Domain parameter required for internal linking check');
        return 0;
    }

    let internalLinks = 0;
    let descriptiveLinks = 0;

    $('a[href]').each((i, el) => {
        const href = $(el).attr('href').trim();
        const text = $(el).text().trim().toLowerCase();

        // Skip empty or anchor-only links
        if (!href || href.startsWith('#')) return;

        // Check if link is internal
        if (href.includes(domain) || href.startsWith('/')) {
            internalLinks++;

            // Check if anchor text is descriptive (more than 3 chars and not generic)
            const genericTexts = ['click here', 'read more', 'here', 'link'];
            if (text.length > 3 && !genericTexts.includes(text)) {
                descriptiveLinks++;
            }
        }
    });

    // Score 1 if at least one descriptive internal link exists
    const score = descriptiveLinks > 0 ? 1 : 0;
    return score;
}
function checkDuplicateContentDetectionReady($) {
    let ready = false;

    // 1. Canonical tag exists
    const canonical = $('link[rel="canonical"]').attr('href');
    if (canonical && canonical.trim().length > 0) ready = true;

    // 2. Meta robots handling duplicate content
    if (!ready) {
        const robots = $('meta[name="robots"]').attr('content');
        if (robots && robots.toLowerCase().includes('noindex')) ready = true;
    }

    // 3. Optional heuristic: repeated paragraph texts
    if (!ready) {
        const paragraphs = {};
        let repeatedFound = false;
        $('p').each((i, el) => {
            const text = $(el).text().trim();
            if (!text) return;
            if (paragraphs[text]) {
                repeatedFound = true;
                return false; // break loop
            } else {
                paragraphs[text] = true;
            }
        });
        if (repeatedFound) ready = true;
    }

    const score = ready ? 1 : 0;
    return score;
}
function checkMultilingualSupport($) {
    let multilingualFound = false;

    // 1. Check <html lang=""> attribute
    const htmlLang = $('html').attr('lang');
    if (htmlLang && htmlLang.trim().length > 0 && htmlLang.trim().toLowerCase() !== 'en') {
        multilingualFound = true;
    }

    // 2. Check for <link rel="alternate" hreflang="">
    if (!multilingualFound) {
        const alternateLinks = $('link[rel="alternate"][hreflang]');
        if (alternateLinks.length > 0) multilingualFound = true;
    }

    // 3. Optional: meta tags for language
    if (!multilingualFound) {
        const metaLang = $('meta[http-equiv="content-language"]').attr('content');
        if (metaLang && metaLang.trim().length > 0 && metaLang.trim().toLowerCase() !== 'en') {
            multilingualFound = true;
        }
    }

    const score = multilingualFound ? 1 : 0;
    return score;
}

function checkEventGoalTrackingIntegrated($) {
    let trackingFound = false;

    // 1. Look for common analytics / tag manager scripts
    const analyticsKeywords = [
        'google-analytics',
        'gtag',
        'ga(',
        'mixpanel',
        'heap',
        'segment',
        'googletagmanager'
    ];

    $('script').each((i, el) => {
        const src = ($(el).attr('src') || '').toLowerCase();
        const text = ($(el).html() || '').toLowerCase();
        if (analyticsKeywords.some(keyword => src.includes(keyword) || text.includes(keyword))) {
            trackingFound = true;
            return false; // break loop
        }
    });

    // 2. Look for inline event tracking
    if (!trackingFound) {
        if ($('[onclick], [onchange], [data-event]').length > 0) {
            trackingFound = true;
        }
    }

    const score = trackingFound ? 1 : 0;
    return score;
}
function checkABTestingReady($) {
    let abTestingFound = false;

    // 1. Look for known A/B testing libraries
    const abKeywords = [
        'googleoptimize',
        'optimizely',
        'vwo',
        'convert.com',
        'ab-test',
        'experiment'
    ];

    $('script').each((i, el) => {
        const src = ($(el).attr('src') || '').toLowerCase();
        const text = ($(el).html() || '').toLowerCase();
        if (abKeywords.some(keyword => src.includes(keyword) || text.includes(keyword))) {
            abTestingFound = true;
            return false; // break loop
        }
    });

    // 2. Look for inline data attributes indicating experiments
    if (!abTestingFound) {
        if ($('[data-variant], [data-experiment]').length > 0) {
            abTestingFound = true;
        }
    }

    const score = abTestingFound ? 1 : 0;
    return score;
}
function checkUserFeedbackLoops($) {
    let feedbackFound = false;

    // 1. Look for common third-party feedback widgets
    const feedbackKeywords = [
        'hotjar',
        'typeform',
        'surveymonkey',
        'qualtrics',
        'feedback',
        'rating'
    ];

    $('script').each((i, el) => {
        const src = ($(el).attr('src') || '').toLowerCase();
        const text = ($(el).html() || '').toLowerCase();
        if (feedbackKeywords.some(keyword => src.includes(keyword) || text.includes(keyword))) {
            feedbackFound = true;
            return false; // break loop
        }
    });

    // 2. Look for forms / textarea with feedback hints
    if (!feedbackFound) {
        $('form, textarea, input').each((i, el) => {
            const placeholder = ($(el).attr('placeholder') || '').toLowerCase();
            const name = ($(el).attr('name') || '').toLowerCase();
            if (placeholder.includes('feedback') || name.includes('feedback') || name.includes('rating')) {
                feedbackFound = true;
                return false;
            }
        });
    }

    // 3. Look for data-* attributes indicating feedback
    if (!feedbackFound) {
        if ($('[data-feedback], [data-rating]').length > 0) feedbackFound = true;
    }

    const score = feedbackFound ? 1 : 0;
    return score;
}

function checkMetadataComplete($) {
    let metaScore = 0;

    try {
        const hasTitle = $('title').length > 0 && $('title').text().trim().length > 0;
        const hasMetaDesc = $('meta[name="description"]').attr('content')?.trim().length > 0;

        // OpenGraph tags
        const hasOGTitle = $('meta[property="og:title"]').attr('content')?.trim().length > 0;
        const hasOGDesc = $('meta[property="og:description"]').attr('content')?.trim().length > 0;

        // Twitter tags
        const hasTwitterTitle = $('meta[name="twitter:title"]').attr('content')?.trim().length > 0;
        const hasTwitterDesc = $('meta[name="twitter:description"]').attr('content')?.trim().length > 0;

        // Consider metadata complete if at least 4/6 tags present
        const presentCount = [hasTitle, hasMetaDesc, hasOGTitle, hasOGDesc, hasTwitterTitle, hasTwitterDesc].filter(Boolean).length;
        metaScore = presentCount >= 4 ? 1 : 0;

    } catch (e) {
        console.error('Error checking metadata:', e);
        metaScore = 0;
    }

    return metaScore;
}


export default async function aioReadiness(url, robotsText,page) {
  const report = {};
 await page.goto(url, {waitUntil: "networkidle2",timeout: 240000});
  await page.waitForSelector("body", { timeout: 240000 });
  const htmlData = await page.content();
  const $ = cheerio.load(htmlData);
  
  function runAIAudit($, domain) {
    const results = {
        structuredData: checkStructuredData($),
        contentNLPFriendly: checkContentNLPFriendly($),
        fastPageLoad: checkFastPageLoadForAI(),
        apiDataAccess: checkAPIDataAccess($),
        keywordsEntitiesAnnotated: checkKeywordsEntitiesAnnotated($),
        contentUpdatedRegularly: checkContentUpdatedRegularly($),
        dynamicContentAvailable: checkDynamicContentAvailable($),
        behaviorTrackingImplemented: checkBehaviorTrackingImplemented($),
        segmentationProfilingReady: checkSegmentationProfilingReady($),
        internalLinkingAIFriendly: checkInternalLinkingAIFriendly($, domain),
        duplicateContentDetectionReady: checkDuplicateContentDetectionReady($),
        multilingualSupport: checkMultilingualSupport($),
        eventGoalTrackingIntegrated: checkEventGoalTrackingIntegrated($),
        abTestingReady: checkABTestingReady($),
        userFeedbackLoopsPresent: checkUserFeedbackLoops($)
    };

    return results;
}

// Usage:
const domain =url; // Replace with your site's domain
const auditResults = runAIAudit($, domain);

// Console log all results
console.log('AI Optimization Readiness Audit Results:', auditResults);


}
