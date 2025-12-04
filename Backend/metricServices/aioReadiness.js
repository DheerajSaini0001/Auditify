import SiteReport from "../models/SiteReport.js";

// Helper to create standardized metric result
function createMetricResult(score, status, details, meta = {}) {
  return { score, status, details, meta };
}

// Artificial Intelligence Optimization Readiness (Technical Performance (AI-specific metrics))
function checkStructuredData($) {
  const selector = 'script[type="application/ld+json"]';
  const scripts = $(selector);
  let validCount = 0;
  let foundTypes = [];

  scripts.each((i, el) => {
    try {
      const json = JSON.parse($(el).html());
      if (json && typeof json === 'object') {
        validCount++;
        if (json['@type']) {
          foundTypes.push(json['@type']);
        } else if (json['@graph']) {
          json['@graph'].forEach(item => {
            if (item['@type']) foundTypes.push(item['@type']);
          });
        }
      }
    } catch (e) {
      // ignore invalid JSON
    }
  });

  if (validCount > 0) {
    return createMetricResult(100, "pass", "Structured data detected.", { count: validCount, types: foundTypes });
  }
  return createMetricResult(0, "fail", "No valid structured data found.", { count: 0 });
}

function checkContentNLPFriendly($) {
  const semanticTags = ['article', 'section', 'header', 'footer', 'main'];
  const foundTags = semanticTags.filter(tag => $(tag).length > 0);

  const headings = ['h1', 'h2', 'h3'];
  const foundHeadings = headings.filter(tag => $(tag).length > 0);

  const hasParagraphs = $('p').length > 0;
  const hasLists = $('ul, ol').length > 0;

  if (foundTags.length > 0 && foundHeadings.length > 0 && (hasParagraphs || hasLists)) {
    return createMetricResult(100, "pass", "Content structure is NLP-friendly.", {
      semanticTags: foundTags,
      headings: foundHeadings,
      hasParagraphs,
      hasLists
    });
  }
  return createMetricResult(50, "warning", "Content structure needs improvement for NLP.", {
    missingTags: semanticTags.filter(t => !foundTags.includes(t)),
    foundHeadings
  });
}

async function checkFastPageLoadForAI(page) {
  try {
    if (!page) {
      return createMetricResult(100, "pass", "Page load check skipped (no page object).", { note: "Browser context missing." });
    }

    const loadTime = await page.evaluate(() => {
      try {
        const nav = performance.getEntriesByType('navigation')[0];
        if (nav) return (nav.loadEventEnd - nav.startTime) / 1000;
        if (performance.timing) {
          return (performance.timing.loadEventEnd - performance.timing.navigationStart) / 1000;
        }
      } catch (e) {
        return null;
      }
      return null;
    });

    if (loadTime !== null && loadTime > 0) {
      if (loadTime <= 2) {
        return createMetricResult(100, "pass", "Page loads quickly for AI crawlers.", { loadTime: `${loadTime.toFixed(2)}s` });
      } else {
        return createMetricResult(50, "warning", "Page load could be faster.", { loadTime: `${loadTime.toFixed(2)}s`, threshold: "2s" });
      }
    }

    return createMetricResult(100, "pass", "Load time check skipped (no data).", { note: "Could not retrieve timing." });
  } catch (err) {
    return createMetricResult(100, "pass", "Load time check skipped.", { error: err.message });
  }
}

function checkAPIDataAccess($) {
  let apiFound = false;
  let evidence = [];

  $('script[src]').each((i, el) => {
    const src = $(el).attr('src').toLowerCase();
    if (src.includes('.json') || src.includes('api') || src.includes('graphql')) {
      apiFound = true;
      if (evidence.length < 3) evidence.push(src);
    }
  });

  if (!apiFound) {
    $('link[rel]').each((i, el) => {
      const rel = $(el).attr('rel').toLowerCase();
      if (rel.includes('manifest') || rel.includes('api')) {
        apiFound = true;
        evidence.push(`<link rel="${rel}">`);
      }
    });
  }

  if (apiFound) {
    return createMetricResult(100, "pass", "API or data endpoints detected.", { evidence });
  }
  return createMetricResult(0, "fail", "No obvious API data access points found.", { checked: "script src, link rel" });
}

// Artificial Intelligence Optimization Readiness (Content Optimization Readiness)
function checkKeywordsEntitiesAnnotated($) {
  const metaKeywords = $('meta[name="keywords"]').attr('content');
  const hasKeywords = metaKeywords && metaKeywords.trim().length > 0;

  const headingsCount = $('h1, h2').length;
  const imagesWithAlt = $('img[alt]').filter((i, el) => $(el).attr('alt').trim().length > 0).length;

  if (hasKeywords || headingsCount > 0 || imagesWithAlt > 0) {
    return createMetricResult(100, "pass", "Keywords and entities are annotated.", {
      hasMetaKeywords: hasKeywords,
      headingsCount,
      imagesWithAlt
    });
  }
  return createMetricResult(0, "fail", "No keyword/entity annotations found.", { checked: "meta keywords, h1/h2, img alt" });
}

function checkMetadataComplete($) {
  const missing = [];
  const present = [];

  const checks = {
    'Title': $('title').length > 0 && $('title').text().trim().length > 0,
    'Meta Description': $('meta[name="description"]').attr('content')?.trim().length > 0,
    'OG Title': $('meta[property="og:title"]').attr('content')?.trim().length > 0,
    'OG Description': $('meta[property="og:description"]').attr('content')?.trim().length > 0,
    'Twitter Title': $('meta[name="twitter:title"]').attr('content')?.trim().length > 0,
    'Twitter Description': $('meta[name="twitter:description"]').attr('content')?.trim().length > 0
  };

  for (const [key, val] of Object.entries(checks)) {
    if (val) present.push(key);
    else missing.push(key);
  }

  if (present.length >= 4) {
    return createMetricResult(100, "pass", "Metadata is mostly complete.", { present, missing });
  }
  return createMetricResult(0, "fail", "Essential metadata is missing.", { missing, present });
}

function checkContentUpdatedRegularly($) {
  const metaModified = $('meta[name="last-modified"]').attr('content') ||
    $('meta[property="article:modified_time"]').attr('content');

  let dateFound = metaModified;
  if (!dateFound) {
    const timeTag = $('time[datetime]').first().attr('datetime');
    if (timeTag) dateFound = timeTag;
  }

  if (dateFound) {
    const date = new Date(dateFound);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      return createMetricResult(100, "pass", "Content updated recently.", { lastModified: dateFound, daysAgo: diffDays });
    }
    return createMetricResult(50, "warning", "Content might be outdated.", { lastModified: dateFound, daysAgo: diffDays });
  }

  return createMetricResult(50, "warning", "Could not determine last update time.", { checked: "meta last-modified, time tag" });
}

// Artificial Intelligence Optimization Readiness (Personalization & User Interaction)
function checkDynamicContentAvailable($) {
  let evidence = [];

  $('script:not([src])').each((i, el) => {
    const text = $(el).html().toLowerCase();
    if (text.includes('fetch(')) evidence.push('fetch()');
    if (text.includes('xmlhttprequest')) evidence.push('XHR');
    if (text.includes('react') || text.includes('vue') || text.includes('angular')) evidence.push('Framework detected');
  });

  const dataAttrs = $('*').filter((i, el) => Object.keys(el.attribs || {}).some(a => a.startsWith('data-'))).length;
  if (dataAttrs > 0) evidence.push(`${dataAttrs} elements with data- attributes`);

  if (evidence.length > 0) {
    return createMetricResult(100, "pass", "Dynamic content capabilities detected.", { evidence: [...new Set(evidence)].slice(0, 5) });
  }
  return createMetricResult(0, "fail", "No dynamic content indicators found.", { checked: "fetch, frameworks, data- attributes" });
}

function checkBehaviorTrackingImplemented($) {
  const keywords = ['google-analytics', 'gtag', 'mixpanel', 'segment', 'hotjar'];
  let foundTools = [];

  $('script').each((i, el) => {
    const src = ($(el).attr('src') || '').toLowerCase();
    const text = ($(el).html() || '').toLowerCase();
    keywords.forEach(k => {
      if ((src.includes(k) || text.includes(k)) && !foundTools.includes(k)) foundTools.push(k);
    });
  });

  if (foundTools.length > 0) {
    return createMetricResult(100, "pass", "Behavior tracking detected.", { tools: foundTools });
  }
  return createMetricResult(0, "fail", "No behavior tracking scripts found.", { checkedKeywords: keywords });
}

function checkSegmentationProfilingReady($) {
  const keywords = ['userid', 'segment', 'profile', 'audience', 'crm'];
  let found = [];

  $('script').each((i, el) => {
    const text = ($(el).html() || '').toLowerCase();
    keywords.forEach(k => {
      if (text.includes(k) && !found.includes(k)) found.push(k);
    });
  });

  const dataAttrs = $('[data-user], [data-segment], [data-profile]').length;
  if (dataAttrs > 0) found.push('data-segment/profile attributes');

  if (found.length > 0) {
    return createMetricResult(100, "pass", "Segmentation capabilities detected.", { indicators: found });
  }
  return createMetricResult(0, "fail", "No segmentation indicators found.", { checkedKeywords: keywords });
}

// Artificial Intelligence Optimization Readiness (SEO & AI-Driven Optimization Potential)
function Domain(urlString) {
  try {
    const u = new URL(urlString);
    let host = u.hostname;
    if (host.startsWith("www.")) host = host.slice(4);
    return host;
  } catch (e) {
    return "";
  }
}

function checkInternalLinkingAIFriendly($, domain) {
  if (!domain) return createMetricResult(0, "fail", "Invalid domain.", {});

  let internalLinks = 0;
  let descriptiveLinks = 0;
  let examples = [];

  $('a[href]').each((i, el) => {
    const href = $(el).attr('href');
    if (!href || href.startsWith('#')) return;

    if (href.includes(domain) || href.startsWith('/')) {
      internalLinks++;
      const text = $(el).text().trim();
      if (text.length > 3 && !['click here', 'read more'].includes(text.toLowerCase())) {
        descriptiveLinks++;
        if (examples.length < 3) examples.push(text);
      }
    }
  });

  if (descriptiveLinks > 0) {
    return createMetricResult(100, "pass", "Internal linking is descriptive.", { internalLinks, descriptiveLinks, examples });
  }
  return createMetricResult(50, "warning", "Internal links lack descriptive text.", { internalLinks, descriptiveLinks });
}

function checkDuplicateContentDetectionReady($) {
  const canonical = $('link[rel="canonical"]').attr('href');
  const noindex = $('meta[name="robots"]').attr('content')?.toLowerCase().includes('noindex');

  if (canonical) {
    return createMetricResult(100, "pass", "Canonical tag present.", { canonical });
  }
  if (noindex) {
    return createMetricResult(100, "pass", "Noindex tag present (prevents duplication).", {});
  }
  return createMetricResult(0, "fail", "No duplicate content protection found.", { checked: "canonical tag, meta robots" });
}

function checkMultilingualSupport($) {
  const lang = $('html').attr('lang');
  const hreflangs = [];
  $('link[rel="alternate"][hreflang]').each((i, el) => {
    hreflangs.push($(el).attr('hreflang'));
  });

  if ((lang && lang !== 'en') || hreflangs.length > 0) {
    return createMetricResult(100, "pass", "Multilingual support detected.", { lang, hreflangs });
  }
  return createMetricResult(0, "fail", "No multilingual signals found.", { lang: lang || "missing", hreflangsCount: 0 });
}

// Artificial Intelligence Optimization Readiness (Analytics & Feedback Loops)
function checkEventGoalTrackingIntegrated($) {
  const keywords = ['ga(', 'gtag', 'mixpanel', 'track', 'event'];
  let found = [];

  $('script').each((i, el) => {
    const text = ($(el).html() || '').toLowerCase();
    keywords.forEach(k => {
      if (text.includes(k) && !found.includes(k)) found.push(k);
    });
  });

  const eventAttrs = $('[onclick], [data-event]').length;
  if (eventAttrs > 0) found.push('Inline event attributes');

  if (found.length > 0) {
    return createMetricResult(100, "pass", "Event tracking integrated.", { indicators: found });
  }
  return createMetricResult(0, "fail", "No event tracking found.", { checkedKeywords: keywords });
}

function checkABTestingReady($) {
  const keywords = ['optimizely', 'vwo', 'googleoptimize', 'ab-test'];
  let found = [];

  $('script').each((i, el) => {
    const src = ($(el).attr('src') || '').toLowerCase();
    keywords.forEach(k => {
      if (src.includes(k)) found.push(k);
    });
  });

  if (found.length > 0) {
    return createMetricResult(100, "pass", "A/B testing tools detected.", { tools: found });
  }
  return createMetricResult(0, "fail", "No A/B testing tools found.", { checkedKeywords: keywords });
}

function checkUserFeedbackLoops($) {
  const keywords = ['hotjar', 'typeform', 'surveymonkey', 'feedback'];
  let found = [];

  $('script').each((i, el) => {
    const src = ($(el).attr('src') || '').toLowerCase();
    keywords.forEach(k => {
      if (src.includes(k)) found.push(k);
    });
  });

  const feedbackForms = $('form, input, textarea').filter((i, el) => {
    const name = ($(el).attr('name') || '').toLowerCase();
    return name.includes('feedback') || name.includes('review');
  }).length;

  if (found.length > 0 || feedbackForms > 0) {
    return createMetricResult(100, "pass", "Feedback mechanisms detected.", { tools: found, feedbackForms });
  }
  return createMetricResult(0, "fail", "No user feedback loops found.", { checkedKeywords: keywords });
}


export default async function aioReadiness(url, device, selectedMetric, page, $, auditId) {

  // Execute checks
  const structuredData = checkStructuredData($);
  const contentNLPFriendly = checkContentNLPFriendly($);
  const fastPageLoad = await checkFastPageLoadForAI(page); // AWAIT ADDED HERE
  const apiDataAccess = checkAPIDataAccess($);

  const keywordsEntitiesAnnotated = checkKeywordsEntitiesAnnotated($);
  const metadataComplete = checkMetadataComplete($);
  const contentUpdatedRegularly = checkContentUpdatedRegularly($);

  const dynamicContentAvailable = checkDynamicContentAvailable($);
  const behaviorTrackingImplemented = checkBehaviorTrackingImplemented($);
  const segmentationProfilingReady = checkSegmentationProfilingReady($);

  const domain = Domain(url);
  const internalLinkingAIFriendly = checkInternalLinkingAIFriendly($, domain);
  const duplicateContentDetectionReady = checkDuplicateContentDetectionReady($);
  const multilingualSupport = checkMultilingualSupport($);

  const eventGoalTrackingIntegrated = checkEventGoalTrackingIntegrated($);
  const abTestingReady = checkABTestingReady($);
  const userFeedbackLoopsPresent = checkUserFeedbackLoops($);

  // Weights
  const weights = {
    Structured_Data: 3, Metadata_Complete: 2, API_Data_Access: 2, Fast_Page_Load: 2,
    Content_NLP_Friendly: 2, Keywords_Entities_Annotated: 2, Content_Updated_Regularly: 1,
    Internal_Linking_AI_Friendly: 2, Duplicate_Content_Detection_Ready: 1, Multilingual_Support: 1,
    Behavior_Tracking_Implemented: 2, Segmentation_Profiling_Ready: 1, Event_Goal_Tracking_Integrated: 2,
    AB_Testing_Ready: 1, User_Feedback_Loops_Present: 1, Dynamic_Content_Available: 1
  };

  const metricsMap = {
    Structured_Data: structuredData,
    Content_NLP_Friendly: contentNLPFriendly,
    Fast_Page_Load: fastPageLoad,
    API_Data_Access: apiDataAccess,
    Keywords_Entities_Annotated: keywordsEntitiesAnnotated,
    Metadata_Complete: metadataComplete,
    Content_Updated_Regularly: contentUpdatedRegularly,
    Dynamic_Content_Available: dynamicContentAvailable,
    Behavior_Tracking_Implemented: behaviorTrackingImplemented,
    Segmentation_Profiling_Ready: segmentationProfilingReady,
    Internal_Linking_AI_Friendly: internalLinkingAIFriendly,
    Duplicate_Content_Detection_Ready: duplicateContentDetectionReady,
    Multilingual_Support: multilingualSupport,
    Event_Goal_Tracking_Integrated: eventGoalTrackingIntegrated,
    AB_Testing_Ready: abTestingReady,
    User_Feedback_Loops_Present: userFeedbackLoopsPresent
  };

  let totalWeight = 0;
  let earnedScore = 0;

  for (const [key, metric] of Object.entries(metricsMap)) {
    const weight = weights[key] || 1;
    totalWeight += weight;
    if (metric.score === 100) {
      earnedScore += weight;
    } else if (metric.score === 50) {
      earnedScore += weight * 0.5;
    }
  }

  const actualPercentage = totalWeight > 0 ? parseFloat(((earnedScore / totalWeight) * 100).toFixed(0)) : 0;

  let badge = actualPercentage >= 50 ? "Yes" : "No";

  // Update Database
  await SiteReport.findByIdAndUpdate(auditId, {
    AIO_Compatibility_Badge: badge,
    AIO_Readiness: {
      Percentage: actualPercentage,
      AIO_Compatibility_Badge: badge,
      ...metricsMap
    }
  });

  return actualPercentage;
}
