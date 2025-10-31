import SiteReport from "../Model/SiteReport.js";

// Artificial Intelligence Optimization Readiness (Technical Performance (AI-specific metrics))
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

// Artificial Intelligence Optimization Readiness (Content Optimization Readiness)
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

// Artificial Intelligence Optimization Readiness (Personalization & User Interaction)
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

// Artificial Intelligence Optimization Readiness (SEO & AI-Driven Optimization Potential)
function Domain(urlString) {
  const u = new URL(urlString);
  let host = u.hostname;
  if (host.startsWith("www.")) host = host.slice(4);
  return host;
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

// Artificial Intelligence Optimization Readiness (Analytics & Feedback Loops)
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

export default async function aioReadiness(url,device,selectedMetric, $, auditId) {

  // Artificial Intelligence Optimization Readiness (Technical Performance (AI-specific metrics))
  const structuredData = checkStructuredData($)
  const contentNLPFriendly = checkContentNLPFriendly($)
  const fastPageLoad = checkFastPageLoadForAI()
  const apiDataAccess = checkAPIDataAccess($)

  // Artificial Intelligence Optimization Readiness (Content Optimization Readiness)
  const keywordsEntitiesAnnotated = checkKeywordsEntitiesAnnotated($)
  const metadataComplete = checkMetadataComplete($)
  const contentUpdatedRegularly = checkContentUpdatedRegularly($)
  
  // Artificial Intelligence Optimization Readiness (Personalization & User Interaction)
  const dynamicContentAvailable = checkDynamicContentAvailable($)
  const behaviorTrackingImplemented = checkBehaviorTrackingImplemented($)
  const segmentationProfilingReady = checkSegmentationProfilingReady($)
  
  // Artificial Intelligence Optimization Readiness (SEO & AI-Driven Optimization Potential)
  const domain = Domain(url); 
  const internalLinkingAIFriendly = checkInternalLinkingAIFriendly($, domain)
  const duplicateContentDetectionReady = checkDuplicateContentDetectionReady($)
  const multilingualSupport = checkMultilingualSupport($)
  
  // Artificial Intelligence Optimization Readiness (Analytics & Feedback Loops)
  const eventGoalTrackingIntegrated = checkEventGoalTrackingIntegrated($)
  const abTestingReady = checkABTestingReady($)
  const userFeedbackLoopsPresent = checkUserFeedbackLoops($)

  const AIO_Compatibility_Score =parseFloat(((structuredData * 3 + metadataComplete * 2 + apiDataAccess * 2 + fastPageLoad * 1.5 + contentNLPFriendly * 1.5 + internalLinkingAIFriendly * 1) / 11).toFixed(0));
  const AIO_Compatibility_Badge = AIO_Compatibility_Score >= 0.7 ? "Yes" : "No";

  const Total = parseFloat((((structuredData+contentNLPFriendly+fastPageLoad+apiDataAccess+keywordsEntitiesAnnotated+metadataComplete+contentUpdatedRegularly+dynamicContentAvailable+behaviorTrackingImplemented+segmentationProfilingReady+internalLinkingAIFriendly+duplicateContentDetectionReady+multilingualSupport+eventGoalTrackingIntegrated+abTestingReady+userFeedbackLoopsPresent)/16)*100).toFixed(0))

  // Passed
  const passed = [];
  
  // Improvements
  const improvements = [];

  if (structuredData === 0) {
  improvements.push({
    metric: "Structured Data",
    current: "Missing or incomplete",
    recommended: "Implement valid JSON-LD schema",
    severity: "High 🟠",
    suggestion: "Add structured data markup to improve SEO and AI understanding."
  });
} else {
  passed.push({
    metric: "Structured Data",
    current: "Present",
    recommended: "Valid JSON-LD schema",
    severity: "✅ Passed",
    suggestion: "Structured data is correctly implemented."
  });
}

if (contentNLPFriendly === 0) {
  improvements.push({
    metric: "Content NLP Friendliness",
    current: "Low semantic clarity",
    recommended: "Optimize for NLP readability",
    severity: "Medium 🟡",
    suggestion: "Use natural language tone, entity-rich content, and proper grammar for AI comprehension."
  });
} else {
  passed.push({
    metric: "Content NLP Friendliness",
    current: "Optimized",
    recommended: "Maintain NLP-friendly tone",
    severity: "✅ Passed",
    suggestion: "Content is well-structured and AI-readable."
  });
}

if (fastPageLoad === 0) {
  improvements.push({
    metric: "Fast Page Load",
    current: "Slow",
    recommended: "< 2s load time",
    severity: "High 🟠",
    suggestion: "Optimize images, scripts, and enable caching to improve page load speed."
  });
} else {
  passed.push({
    metric: "Fast Page Load",
    current: "Fast",
    recommended: "< 2s load time",
    severity: "✅ Passed",
    suggestion: "Page loads quickly."
  });
}

if (apiDataAccess === 0) {
  improvements.push({
    metric: "API Data Access",
    current: "Not implemented",
    recommended: "Provide accessible API endpoints",
    severity: "Medium 🟡",
    suggestion: "Enable secure API access for real-time data integration."
  });
} else {
  passed.push({
    metric: "API Data Access",
    current: "Available",
    recommended: "Accessible and documented API",
    severity: "✅ Passed",
    suggestion: "API endpoints are functional and accessible."
  });
}

if (keywordsEntitiesAnnotated === 0) {
  improvements.push({
    metric: "Keyword & Entity Annotation",
    current: "Not detected",
    recommended: "Use semantic markup",
    severity: "Medium 🟡",
    suggestion: "Annotate important keywords and entities with schema or metadata for better AI understanding."
  });
} else {
  passed.push({
    metric: "Keyword & Entity Annotation",
    current: "Annotated",
    recommended: "Maintain rich metadata",
    severity: "✅ Passed",
    suggestion: "Entities and keywords are well-tagged."
  });
}

if (metadataComplete === 0) {
  improvements.push({
    metric: "Metadata Completeness",
    current: "Incomplete",
    recommended: "Title, description, OpenGraph, Twitter tags",
    severity: "High 🟠",
    suggestion: "Add missing metadata for SEO and better social sharing."
  });
} else {
  passed.push({
    metric: "Metadata Completeness",
    current: "Complete",
    recommended: "Keep metadata updated",
    severity: "✅ Passed",
    suggestion: "All essential metadata is present."
  });
}

if (contentUpdatedRegularly === 0) {
  improvements.push({
    metric: "Content Updated Regularly",
    current: "Outdated",
    recommended: "Update monthly or as needed",
    severity: "Medium 🟡",
    suggestion: "Refresh outdated pages and ensure content stays relevant."
  });
} else {
  passed.push({
    metric: "Content Updated Regularly",
    current: "Up-to-date",
    recommended: "Maintain schedule",
    severity: "✅ Passed",
    suggestion: "Content is current and relevant."
  });
}

if (dynamicContentAvailable === 0) {
  improvements.push({
    metric: "Dynamic Content Availability",
    current: "Static only",
    recommended: "Add interactive or personalized elements",
    severity: "Medium 🟡",
    suggestion: "Incorporate dynamic sections like carousels or personalized content."
  });
} else {
  passed.push({
    metric: "Dynamic Content Availability",
    current: "Available",
    recommended: "Maintain interactivity",
    severity: "✅ Passed",
    suggestion: "Dynamic content is implemented."
  });
}

if (behaviorTrackingImplemented === 0) {
  improvements.push({
    metric: "Behavior Tracking",
    current: "Not tracked",
    recommended: "Implement analytics tools",
    severity: "Medium 🟡",
    suggestion: "Use Google Analytics or similar tools to monitor user behavior."
  });
} else {
  passed.push({
    metric: "Behavior Tracking",
    current: "Enabled",
    recommended: "Continuous tracking",
    severity: "✅ Passed",
    suggestion: "User interactions are properly tracked."
  });
}

if (segmentationProfilingReady === 0) {
  improvements.push({
    metric: "Segmentation & Profiling",
    current: "Not ready",
    recommended: "Enable user segmentation",
    severity: "Medium 🟡",
    suggestion: "Implement user data segmentation for targeted personalization."
  });
} else {
  passed.push({
    metric: "Segmentation & Profiling",
    current: "Ready",
    recommended: "Maintain data segmentation",
    severity: "✅ Passed",
    suggestion: "Segmentation is functional."
  });
}

if (internalLinkingAIFriendly === 0) {
  improvements.push({
    metric: "Internal Linking AI Friendliness",
    current: "Poor linking structure",
    recommended: "Add contextual internal links",
    severity: "Medium 🟡",
    suggestion: "Use meaningful anchor texts and ensure crawlable link hierarchy."
  });
} else {
  passed.push({
    metric: "Internal Linking AI Friendliness",
    current: "Optimized",
    recommended: "Maintain link structure",
    severity: "✅ Passed",
    suggestion: "Internal linking is AI-friendly."
  });
}

if (duplicateContentDetectionReady === 0) {
  improvements.push({
    metric: "Duplicate Content Detection",
    current: "Not implemented",
    recommended: "Enable plagiarism checks",
    severity: "Medium 🟡",
    suggestion: "Use duplicate content detection to ensure originality."
  });
} else {
  passed.push({
    metric: "Duplicate Content Detection",
    current: "Active",
    recommended: "Regular scans",
    severity: "✅ Passed",
    suggestion: "Duplicate content checks are working."
  });
}

if (multilingualSupport === 0) {
  improvements.push({
    metric: "Multilingual Support",
    current: "Not supported",
    recommended: "Add multiple language versions",
    severity: "Medium 🟡",
    suggestion: "Implement hreflang tags and translated content."
  });
} else {
  passed.push({
    metric: "Multilingual Support",
    current: "Available",
    recommended: "Maintain language parity",
    severity: "✅ Passed",
    suggestion: "Multiple language support is active."
  });
}

if (eventGoalTrackingIntegrated === 0) {
  improvements.push({
    metric: "Event & Goal Tracking",
    current: "Not integrated",
    recommended: "Set up conversion goals",
    severity: "High 🟠",
    suggestion: "Use Google Tag Manager or Analytics events for goal tracking."
  });
} else {
  passed.push({
    metric: "Event & Goal Tracking",
    current: "Integrated",
    recommended: "Monitor goals regularly",
    severity: "✅ Passed",
    suggestion: "Goals and events are properly tracked."
  });
}

if (abTestingReady === 0) {
  improvements.push({
    metric: "A/B Testing",
    current: "Not ready",
    recommended: "Implement testing framework",
    severity: "Medium 🟡",
    suggestion: "Set up A/B testing for optimizing user experience."
  });
} else {
  passed.push({
    metric: "A/B Testing",
    current: "Ready",
    recommended: "Maintain testing cadence",
    severity: "✅ Passed",
    suggestion: "A/B testing framework is active."
  });
}

if (userFeedbackLoopsPresent === 0) {
  improvements.push({
    metric: "User Feedback Loops",
    current: "Missing",
    recommended: "Add surveys or feedback widgets",
    severity: "Medium 🟡",
    suggestion: "Encourage users to provide feedback for improvement."
  });
} else {
  passed.push({
    metric: "User Feedback Loops",
    current: "Present",
    recommended: "Keep collecting insights",
    severity: "✅ Passed",
    suggestion: "Feedback loops are active."
  });
}

   // Warning
  const warning = [];

  const actualPercentage = parseFloat((((structuredData+contentNLPFriendly+fastPageLoad+apiDataAccess+keywordsEntitiesAnnotated+metadataComplete+contentUpdatedRegularly+dynamicContentAvailable+behaviorTrackingImplemented+segmentationProfilingReady+internalLinkingAIFriendly+duplicateContentDetectionReady+multilingualSupport+eventGoalTrackingIntegrated+abTestingReady+userFeedbackLoopsPresent)/16)*100).toFixed(0))

  // console.log(actualPercentage);
  // console.log(warning);
  // console.log(passed);
  // console.log(Total);
  // console.log(improvements);

    await SiteReport.findByIdAndUpdate(auditId, {
    AIO_Compatibility_Badge: AIO_Compatibility_Badge,
    AIO_Readiness: {
        Structured_Data: {
          Score: structuredData,
          Parameter: "1 if valid structured data (schema.org/JSON-LD) is implemented, else 0"
        },
        Metadata_Complete: {
          Score: metadataComplete,
          Parameter: "1 if metadata (title, description, OG/Twitter tags) is complete, else 0"
        },
        Fast_Page_Load: {
          Score: fastPageLoad,
          Parameter: "1 if page load time is under 2s, else 0"
        },
        API_Data_Access: {
          Score: apiDataAccess,
          Parameter: "1 if secure and documented API endpoints exist, else 0"
        },
        Dynamic_Content_Available: {
          Score: dynamicContentAvailable,
          Parameter: "1 if dynamic or interactive content is present, else 0"
        },
        Multilingual_Support: {
          Score: multilingualSupport,
          Parameter: "1 if hreflang and multilingual versions exist, else 0"
        },
        Content_NLP_Friendly: {
          Score: contentNLPFriendly,
          Parameter: "1 if content uses natural, entity-rich language and NLP-friendly structure, else 0"
        },
        Keywords_Entities_Annotated: {
          Score: keywordsEntitiesAnnotated,
          Parameter: "1 if entities and keywords are annotated with schema or metadata, else 0"
        },
        Content_Updated_Regularly: {
          Score: contentUpdatedRegularly,
          Parameter: "1 if website content is updated frequently, else 0"
        },
        Internal_Linking_AI_Friendly: {
          Score: internalLinkingAIFriendly,
          Parameter: "1 if internal links are structured and contextually relevant, else 0"
        },
        Duplicate_Content_Detection_Ready: {
          Score: duplicateContentDetectionReady,
          Parameter: "1 if duplicate content detection mechanisms are active, else 0"
        },
        Behavior_Tracking_Implemented: {
          Score: behaviorTrackingImplemented,
          Parameter: "1 if user behavior tracking is implemented (e.g., analytics), else 0"
        },
        Segmentation_Profiling_Ready: {
          Score: segmentationProfilingReady,
          Parameter: "1 if audience segmentation and profiling are in place, else 0"
        },
        Event_Goal_Tracking_Integrated: {
          Score: eventGoalTrackingIntegrated,
          Parameter: "1 if event or goal tracking is active, else 0"
        },
        AB_Testing_Ready: {
          Score: abTestingReady,
          Parameter: "1 if A/B testing setup exists, else 0"
        },
        User_Feedback_Loops_Present: {
          Score: userFeedbackLoopsPresent,
          Parameter: "1 if feedback collection systems (surveys, reviews) are active, else 0"
        },
        Dynamic_Personalization: {
          Score: dynamicContentAvailable,
          Parameter: "1 if dynamic content adjusts based on user segments or behavior, else 0"
        },
        AI_Content_Distribution: {
          Score: apiDataAccess,
          Parameter: "1 if content delivery through APIs or feeds is available, else 0"
        },
        AI_Friendly_Structure: {
          Score: internalLinkingAIFriendly,
          Parameter: "1 if website structure aids AI comprehension and crawling, else 0"
        },
      Percentage: actualPercentage,
      Warning: warning,
      Passed: passed,
      Total: Total,
      Improvements: improvements
    },
    $set: {
          'Raw.Site': url,
          'Raw.Report': selectedMetric,
          'Raw.Device': device,
          'Raw.AIO_Compatibility_Badge':AIO_Compatibility_Badge,
          'Raw.AIO_Readiness':{
        Structured_Data: {
          Score: structuredData,
          Parameter: "1 if valid structured data (schema.org/JSON-LD) is implemented, else 0"
        },
        Metadata_Complete: {
          Score: metadataComplete,
          Parameter: "1 if metadata (title, description, OG/Twitter tags) is complete, else 0"
        },
        Fast_Page_Load: {
          Score: fastPageLoad,
          Parameter: "1 if page load time is under 2s, else 0"
        },
        API_Data_Access: {
          Score: apiDataAccess,
          Parameter: "1 if secure and documented API endpoints exist, else 0"
        },
        Dynamic_Content_Available: {
          Score: dynamicContentAvailable,
          Parameter: "1 if dynamic or interactive content is present, else 0"
        },
        Multilingual_Support: {
          Score: multilingualSupport,
          Parameter: "1 if hreflang and multilingual versions exist, else 0"
        },
        Content_NLP_Friendly: {
          Score: contentNLPFriendly,
          Parameter: "1 if content uses natural, entity-rich language and NLP-friendly structure, else 0"
        },
        Keywords_Entities_Annotated: {
          Score: keywordsEntitiesAnnotated,
          Parameter: "1 if entities and keywords are annotated with schema or metadata, else 0"
        },
        Content_Updated_Regularly: {
          Score: contentUpdatedRegularly,
          Parameter: "1 if website content is updated frequently, else 0"
        },
        Internal_Linking_AI_Friendly: {
          Score: internalLinkingAIFriendly,
          Parameter: "1 if internal links are structured and contextually relevant, else 0"
        },
        Duplicate_Content_Detection_Ready: {
          Score: duplicateContentDetectionReady,
          Parameter: "1 if duplicate content detection mechanisms are active, else 0"
        },
        Behavior_Tracking_Implemented: {
          Score: behaviorTrackingImplemented,
          Parameter: "1 if user behavior tracking is implemented (e.g., analytics), else 0"
        },
        Segmentation_Profiling_Ready: {
          Score: segmentationProfilingReady,
          Parameter: "1 if audience segmentation and profiling are in place, else 0"
        },
        Event_Goal_Tracking_Integrated: {
          Score: eventGoalTrackingIntegrated,
          Parameter: "1 if event or goal tracking is active, else 0"
        },
        AB_Testing_Ready: {
          Score: abTestingReady,
          Parameter: "1 if A/B testing setup exists, else 0"
        },
        User_Feedback_Loops_Present: {
          Score: userFeedbackLoopsPresent,
          Parameter: "1 if feedback collection systems (surveys, reviews) are active, else 0"
        },
        Dynamic_Personalization: {
          Score: dynamicContentAvailable,
          Parameter: "1 if dynamic content adjusts based on user segments or behavior, else 0"
        },
        AI_Content_Distribution: {
          Score: apiDataAccess,
          Parameter: "1 if content delivery through APIs or feeds is available, else 0"
        },
        AI_Friendly_Structure: {
          Score: internalLinkingAIFriendly,
          Parameter: "1 if website structure aids AI comprehension and crawling, else 0"
        },
      Percentage: actualPercentage
         }
        }
    });

    return actualPercentage
}
