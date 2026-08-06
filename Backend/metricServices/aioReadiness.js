import { importanceFor } from "../config/parameterImportance.js";
import { parseLocalDate } from "../utils/localeFormats.js";

// Per-parameter weight tilt for this section, by site sub-type — 1.0 for a
// franchise dealer and for corporate/unresolved sites.
const importance = importanceFor("AIO (AI-Optimization) Readiness");

// AI Agentic Browsing (WebMCP) lives in the AIO section per spec Part 3 + §5.1.
// The evaluator is defined in technicalMetrics.js (reuses its fetch helper) and imported here.

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

// Structured Data
function checkStructuredData($) {
  const selector = 'script[type="application/ld+json"]';
  const scripts = $(selector);
  let validCount = 0; // counts successfully parsed script blocks
  let foundTypes = [];
  let syntaxErrors = 0;

  scripts.each((i, el) => {
    try {
      let content = $(el).html().trim();
      if (!content) return;

      // Clean CDATA and comments
      content = content.replace(/<!\[CDATA\[|\]\]>|<!--|-->/g, '');
      const json = JSON.parse(content);

      let hasParsedType = false;
      const findTypesRecursive = (obj) => {
        if (!obj || typeof obj !== 'object') return;

        if (Array.isArray(obj)) {
          obj.forEach(item => findTypesRecursive(item));
          return;
        }

        if (obj['@type']) {
          hasParsedType = true;
          if (Array.isArray(obj['@type'])) {
            foundTypes.push(...obj['@type']);
          } else {
            foundTypes.push(obj['@type']);
          }
        }

        // Deep search for nested types or objects in @graph
        for (const key in obj) {
          if (key !== '@context' && typeof obj[key] === 'object') {
            findTypesRecursive(obj[key]);
          }
        }
      };

      findTypesRecursive(json);
      if (hasParsedType) validCount++;
    } catch (e) {
      syntaxErrors++;
    }
  });

  const uniqueTypes = [...new Set(foundTypes)].filter(t => typeof t === 'string' && t.length > 0);
  let cause = "";
  let recommendation = "";

  if (uniqueTypes.length === 0) {
    cause = "No valid JSON-LD structured data detected.";
    recommendation = 'Add Schema.org structured data as a <script type="application/ld+json"> block inside the <head> section of your page HTML (it can also go just before the closing </body> tag). Describe your key entities — e.g. AutoDealer, Organization, or Product — so AI models understand your content relationships.';
  } else if (syntaxErrors > 0) {
    cause = `${syntaxErrors} script tag(s) contain invalid JSON syntax.`;
    recommendation = 'Fix the JSON syntax errors inside your <script type="application/ld+json"> blocks (validate them at schema.org/validator or search.google.com/test/rich-results) so AI crawlers can read them fully.';
  } else if (uniqueTypes.length < 2) {
    cause = "Limited variety of structured data types found.";
    recommendation = 'Add more Schema.org types to your existing <script type="application/ld+json"> block in the <head> (e.g., BreadcrumbList, Organization, or FAQPage) to deepen your markup.';
  }

  if (uniqueTypes.length > 0) {
    const score = syntaxErrors > 0 ? 80 : 100;
    const status = syntaxErrors > 0 ? "warning" : "pass";
    return {
      score,
      status,
      details: "Structured data detected and parsed.",
      qanda: {
        question: "Does the page use Structured Data (JSON-LD)?",
        answer: "Yes, valid code was found that describes your business entities to AI models."
      },
      meta: { count: validCount, types: uniqueTypes },
      analysis: status === "pass" ? null : { cause, recommendation }
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No valid structured data found.",
    qanda: {
      question: "Does the page use Structured Data (JSON-LD)?",
      answer: "No, valid structured data is missing or contains errors that prevent AI from identifying your brand."
    },
    meta: { count: 0 },
    analysis: { cause, recommendation }
  };
}

// Content NLP Friendliness
function checkContentNLPFriendly($) {
  const semanticTags = ['article', 'section', 'header', 'footer', 'main'];
  const foundTags = semanticTags.filter(tag => $(tag).length > 0);

  const headings = ['h1', 'h2', 'h3'];
  const foundHeadings = headings.filter(tag => $(tag).length > 0);

  const hasParagraphs = $('p').length > 0;
  const hasLists = $('ul, ol').length > 0;

  let cause = "";
  let recommendation = "";

  if (foundTags.length === 0) {
    cause = "No semantic HTML5 tags (article, section, etc.) found.";
    recommendation = "Wrap the main content in the <body> with semantic elements like <main>, <article>, and <section> (replacing generic <div> wrappers) so AI models can understand the document structure.";
  } else if (foundHeadings.length === 0) {
    cause = "No hierarchical headings (h1, h2, h3) detected.";
    recommendation = "Add a clear heading hierarchy within the <body> content — a single <h1> near the top, then <h2>/<h3> above each subsection — to define content sections for NLP processing.";
  } else if (!hasParagraphs && !hasLists) {
    cause = "Lack of standard text blocks (p, ul, ol).";
    recommendation = "Organize the body text into <p> paragraphs and <ul>/<ol> lists inside your content sections for better readability and data extraction.";
  }

  if (foundTags.length > 0 && foundHeadings.length > 0 && (hasParagraphs || hasLists)) {
    return {
      score: 100, status: "pass", details: "Content structure is NLP-friendly.",
      qanda: {
        question: "Is the content structure optimized for Natural Language Processing?",
        answer: "Yes, the use of semantic HTML and hierarchical headings makes the content easily interpretable for AI."
      },
      meta: {
        semanticTags: foundTags,
        headings: foundHeadings,
        hasParagraphs,
        hasLists
      },
      analysis: null
    };
  }

  return {
    score: 50, status: "warning", details: "Content structure needs improvement for NLP.",
    qanda: {
      question: "Is the content structure optimized for Natural Language Processing?",
      answer: "No, the absence of semantic tags and clear headings may confuse AI crawlers."
    },
    meta: {
      missingTags: semanticTags.filter(t => !foundTags.includes(t)),
      foundHeadings
    },
    analysis: { cause, recommendation }
  };
}

// Keywords and Entities Annotated
function checkKeywordsEntitiesAnnotated($) {
  const metaKeywords = $('meta[name="keywords"]').attr('content');
  const hasKeywords = metaKeywords && metaKeywords.trim().length > 0;

  const headingsCount = $('h1, h2').length;
  const imagesWithAlt = $('img[alt]').filter((i, el) => $(el).attr('alt').trim().length > 0).length;

  const totalImages = $('img').length;
  let cause = "";
  let recommendation = "";

  if (!hasKeywords) {
    cause = "Missing meta keywords tag.";
    recommendation = 'Add the keywords tag inside the <head> section of your page HTML (alongside your <title> and <meta name="description"> tags): <meta name="keywords" content="keyword1, keyword2, ...">. List your primary keywords/entities so AI crawlers can associate the page with your topics.';
  } else if (headingsCount === 0) {
    cause = "Lack of descriptive h1/h2 headings.";
    recommendation = "Add descriptive <h1> and <h2> headings within the <body> content of the page (an <h1> near the top, <h2> tags above each main section), each containing key entities related to your page content.";
  } else if (totalImages > 0 && imagesWithAlt < totalImages) {
    cause = `${totalImages - imagesWithAlt} images are missing descriptive ALT text.`;
    recommendation = 'Add an alt attribute to each <img> tag in the page body, e.g. <img src="car.jpg" alt="2024 Toyota Camry front view">. Every image should have descriptive ALT text to give AI models visual context.';
  }

  if (hasKeywords && headingsCount > 0 && (totalImages === 0 || imagesWithAlt === totalImages)) {
    return {
      score: 100,
      status: "pass",
      details: "Keywords and entities are well-annotated.",
      qanda: {
        question: "Are key entities and keywords properly annotated?",
        answer: "Yes, metadata and image alt texts provide clear signals for AI to index your primary topics."
      },
      meta: {
        hasMetaKeywords: hasKeywords,
        headingsCount,
        imagesWithAlt,
        totalImages
      },
      analysis: null
    };
  }

  const score = (hasKeywords || headingsCount > 0 || imagesWithAlt > 0) ? 50 : 0;
  const status = score === 50 ? "warning" : "fail";

  return {
    score,
    status,
    details: score === 0 ? "No keyword/entity annotations found." : "Partial keyword/entity annotations detected.",
    qanda: {
      question: "Are key entities and keywords properly annotated?",
      answer: "No, the lack of meta keywords or image alt texts makes it harder for AI to verify your entities."
    },
    meta: {
      hasMetaKeywords: hasKeywords,
      headingsCount,
      imagesWithAlt,
      totalImages
    },
    analysis: { cause, recommendation }
  };
}

// Content Updated Regularly
function checkContentUpdatedRegularly($, market = null) {
  // Enhanced meta tag detection
  const metaModified = $('meta[name="last-modified"]').attr('content') ||
    $('meta[property="article:modified_time"]').attr('content') ||
    $('meta[name="revised"]').attr('content') ||
    $('meta[name="dcterms.modified"]').attr('content') ||
    $('meta[name="lastmod"]').attr('content') ||
    $('meta[name="date"]').attr('content') ||
    $('meta[itemprop="dateModified"]').attr('content') ||
    $('meta[property="og:updated_time"]').attr('content') ||
    $('[itemprop="dateModified"]').attr('content');

  let dateFound = metaModified;

  // Search JSON-LD for dateModified if no meta tag found
  if (!dateFound) {
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        let content = $(el).html().trim();
        content = content.replace(/<!\[CDATA\[|\]\]>|<!--|-->/g, '');
        const json = JSON.parse(content);

        const findDateRecursive = (obj) => {
          if (!obj || typeof obj !== 'object') return null;
          if (obj.dateModified) return obj.dateModified;
          if (Array.isArray(obj)) {
            for (const item of obj) {
              const d = findDateRecursive(item);
              if (d) return d;
            }
          }
          if (obj['@graph'] && Array.isArray(obj['@graph'])) {
            for (const item of obj['@graph']) {
              const d = findDateRecursive(item);
              if (d) return d;
            }
          }
          for (const key in obj) {
            if (typeof obj[key] === 'object') {
              const d = findDateRecursive(obj[key]);
              if (d) return d;
            }
          }
          return null;
        };

        const d = findDateRecursive(json);
        if (d) {
          dateFound = d;
          return false; // break each loop
        }
      } catch (e) { }
    });
  }

  // Fallback to time tags - find the most recent datetime
  if (!dateFound) {
    const timeTags = $('time[datetime]').map((i, el) => $(el).attr('datetime')).get();
    if (timeTags.length > 0) {
      // Sort to find the most recent update if multiple exist
      const validDates = timeTags
        .map(d => new Date(d))
        .filter(d => !isNaN(d.getTime()))
        .sort((a, b) => b - a);
      if (validDates.length > 0) {
        dateFound = validDates[0].toISOString();
      }
    }
  }

  let cause = "";
  let recommendation = "";
  let score = 100;
  let status = "pass";
  let meta = { lastModified: dateFound };

  if (dateFound) {
    // Locale-aware parse. The freshness RULE does not change between markets —
    // only the visible field order does, and getting it wrong is not cosmetic:
    // a month-first parser reads 04/08/2026 four months off and rejects
    // 25/12/2026 outright, which surfaces as "no freshness signal on the page"
    // on a site that publishes its dates perfectly well. ISO 8601 is handled
    // identically in both markets, so machine-readable dates are unaffected.
    const date = parseLocalDate(dateFound, market) || new Date(dateFound);
    const now = new Date();

    if (isNaN(date.getTime())) {
      score = 50;
      status = "warning";
      cause = "Could not parse the found update timestamp.";
      recommendation = "Ensure your update timestamps follow standard formats (e.g., ISO 8601) so AI models can verify content freshness.";
    } else {
      const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
      meta.daysAgo = diffDays;

      if (diffDays > 30) {
        score = 50;
        status = "warning";
        cause = `Content was last updated ${diffDays} days ago.`;
        recommendation = "Refresh content regularly to maintain relevance for AI models that prioritize fresh data.";
      }
    }
  } else {
    // Freshness signal is entirely absent → 0, not 50 (warnings are reserved for present-but-flawed).
    score = 0;
    status = "fail";
    cause = "No content update timestamp found anywhere on the page (meta tags, time tags, or structured data).";
    recommendation = 'Signal freshness by adding <meta name="last-modified" content="2026-01-01"> inside the <head> section, a <time datetime="2026-01-01">…</time> tag next to the content in the <body>, or a dateModified field in your JSON-LD structured data.';
    meta.checked = "meta tags (last-modified, modified_time, etc.), JSON-LD (dateModified), time tags";
  }

  return {
    score,
    status,
    details: status === "pass" ? "Content updated recently." : (score === 50 && dateFound ? "Content might be outdated." : "No freshness signal found on the page."),
    qanda: {
      question: "Has the content been updated recently to maintain freshness?",
      answer: status === "pass" ? "Yes, the content has been updated recently, ensuring relevance for AI users." : "No, the content appears outdated or lacks a clear update signal, which may reduce its priority in AI results."
    },
    meta,
    analysis: status === "pass" ? null : { cause, recommendation }
  };
}

// Internal Linking AI-Friendly
function checkInternalLinkingAIFriendly($, domain) {
  if (!domain) return { score: 0, status: "fail", details: "Invalid domain.", meta: {}, analysis: null };

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

  let score = 100;
  let status = "pass";
  let cause = "";
  let recommendation = "";

  // Graded: descriptive-anchor ratio drives the score (crawlable <a href> + descriptive text).
  const ratio = internalLinks > 0 ? descriptiveLinks / internalLinks : 0;
  if (internalLinks === 0) {
    score = 0;
    status = "fail";
    cause = "No internal links found on the page.";
    recommendation = "Add internal links to help AI models navigate and understand page relationships.";
  } else if (ratio < 0.5) {
    score = Math.round(40 + ratio * 80); // 40–80 band
    status = "warning";
    cause = "Multiple internal links use generic or non-descriptive anchor text.";
    recommendation = "Use keyword-rich anchor text instead of 'click here' to provide better context for AI.";
  } else if (ratio < 0.8) {
    score = Math.round(60 + ratio * 40); // 92–96 band
    status = "warning";
    cause = "Some internal links use generic or non-descriptive anchor text.";
    recommendation = "Tighten the remaining generic anchors into descriptive, keyword-rich text.";
  }

  return {
    score,
    status,
    details: status === "pass" ? "Internal linking is descriptive." : (status === "warning" ? "Internal links lack descriptive text." : "No internal links found."),
    qanda: {
      question: "Is the internal linking structure helpful for AI discovery?",
      answer: status === "pass" ? "Yes, descriptive anchor text is used to guide AI models through your site's hierarchy." : "No, links are either missing or use generic text that provides no context for the destination."
    },
    meta: { internalLinks, descriptiveLinks, examples },
    analysis: status === "pass" ? null : { cause, recommendation }
  };
}

// Duplicate Content Detection Ready
function checkDuplicateContentDetectionReady($) {
  const canonical = $('link[rel="canonical"]').attr('href');

  // Robust noindex check (robots, googlebot, etc.)
  const robotsTags = $('meta[name="robots"], meta[name="googlebot"], meta[name="bingbot"]');
  let hasNoindex = false;
  robotsTags.each((i, el) => {
    if ($(el).attr('content')?.toLowerCase().includes('noindex')) {
      hasNoindex = true;
    }
  });

  let score = 0;
  let status = "fail";
  let cause = "No canonical tag or noindex directive was found, so AI crawlers may index duplicate versions of this page.";
  let recommendation = 'Add a canonical tag inside the <head> section of your page HTML: <link rel="canonical" href="https://yourdomain.com/this-page">, pointing to the preferred URL. For pages that should not be indexed at all, add <meta name="robots" content="noindex"> in the <head> instead.';
  let details = "No duplicate content protection found.";

  if (canonical) {
    return {
      score: 100,
      status: "pass",
      details: "Canonical tag present.",
      qanda: {
        question: "Is the site protected against duplicate content issues?",
        answer: "Yes, canonical tags or noindex directives are correctly implemented to maintain content integrity."
      },
      meta: { canonical, hasNoindex },
      analysis: null
    };
  }
  if (hasNoindex) {
    return {
      score: 100,
      status: "pass",
      details: "Noindex directive present (prevents duplication).",
      qanda: {
        question: "Is the site protected against duplicate content issues?",
        answer: "Yes, canonical tags or noindex directives are correctly implemented to maintain content integrity."
      },
      meta: { canonical, hasNoindex },
      analysis: null
    };
  }
  return {
    score: 0,
    status: "fail",
    details,
    qanda: {
      question: "Is the site protected against duplicate content issues?",
      answer: "No, missing canonical signals could lead to AI indexing redundant versions of your content."
    },
    meta: { canonical, hasNoindex },
    analysis: { cause, recommendation }
  };
}

// Topical Focus Clarity
function checkTopicalFocusClarity($, url) {
  const title = $('title').text().toLowerCase();
  const h1 = $('h1').first().text().toLowerCase();
  const metaDesc = $('meta[name="description"]').attr('content')?.toLowerCase() || "";

  // Extract words from title (ignore common stops)
  const getKeywords = (str) => str.split(/\W+/).filter(w => w.length > 3);
  const titleWords = getKeywords(title);
  const h1Words = getKeywords(h1);

  const overlap = titleWords.filter(w => h1Words.includes(w));
  const firstWordMatch = titleWords.length > 0 && h1.includes(titleWords[0]);

  // Graded: strong (≥2 shared entities) → moderate (1 shared / first-word match) → absent (0, not 50).
  let score, status;
  if (overlap.length >= 2) {
    score = 100; status = "pass";
  } else if (overlap.length === 1 || firstWordMatch) {
    score = 75; status = "warning";
  } else {
    score = 0; status = "fail";
  }
  const hasStrongFocus = status === "pass";

  let cause = "";
  let recommendation = "";
  if (status === "fail") {
    cause = "No topical focus detected — the title and H1 heading share no primary keywords at all.";
    recommendation = "Rewrite your H1 heading to use the same primary entities as your page title so AI can identify a clear topical focus.";
  } else if (!hasStrongFocus) {
    cause = "Title and H1 heading lack alignment on primary keywords.";
    recommendation = "Ensure your H1 heading uses the same primary entities as your page title to signal clear topical focus to AI.";
  }

  return {
    score,
    status,
    details: hasStrongFocus ? "Strong topical focus detected." : (status === "fail" ? "No topical focus detected between title and H1." : "Title and H1 alignment could be stronger."),
    qanda: {
      question: "Does the page maintain a clear and consistent topical focus?",
      answer: hasStrongFocus ? "Yes, your title and main headings are perfectly aligned around your primary topic." : "No, there is a mismatch between your title and headings, which confuses AI about your primary focus."
    },
    meta: { overlap, title, h1 },
    analysis: hasStrongFocus ? null : { cause, recommendation }
  };
}

// Answer-Oriented Structure
// A Q&A / answer-first layout is genuinely EXPECTED on content pages (blog, guides,
// FAQ). On other page types (home, VDP, SRP, about…) it is OPTIONAL — a dealership
// may keep its Q&A on a dedicated FAQ page instead of on every page — so those pages
// are not penalized for lacking it. `pageType` drives whether a missing Q&A layout is
// a fail (content page), a partial (some Q&A present), or Not Applicable (dropped from
// the weighted score via `present:false`, Rule 6 renormalization).
function checkAnswerOrientedStructure($, pageType = null) {
  const questionWords = ["how", "what", "why", "when", "where", "who", "which", "can", "does", "is", "are", "should"];
  let foundPairs = [];

  // 1. Extract from Question-based Headings (H2/H3)
  $("h2, h3").each((i, el) => {
    const text = $(el).text().trim();
    const isInterrogative = text.includes("?");
    const startsWithQuestionWord = questionWords.some(word => text.toLowerCase().startsWith(word + " "));
    if (!isInterrogative && !startsWithQuestionWord) return;

    // Find the next answer block (paragraph, list, table, or generic block).
    const nextText = $(el).nextUntil('h1, h2, h3, h4, h5, h6').filter('p, ul, ol, table, div').first().text().trim();

    // A statement heading that merely starts with a question word (e.g. "What Our
    // Customers Say") but has no "?" and no answer block underneath is NOT a real
    // Q&A pair — skip it so section headings don't pollute the results.
    if (!isInterrogative && !nextText) return;

    foundPairs.push({
      type: "heading",
      question: text,
      answer: nextText ? nextText.substring(0, 150) + (nextText.length > 150 ? "..." : "") : "Answer not found in immediate text."
    });
  });

  // 2. Extract from JSON-LD FAQPage
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      let content = $(el).html().trim();
      content = content.replace(/<!\[CDATA\[|\]\]>|<!--|-->/g, '');
      const json = JSON.parse(content);

      const findFAQRecursive = (obj) => {
        if (!obj || typeof obj !== 'object') return;

        if (obj['@type'] === 'FAQPage' && obj.mainEntity && Array.isArray(obj.mainEntity)) {
          obj.mainEntity.forEach(item => {
            if (item['@type'] === 'Question' && item.name) {
              const answer = item.acceptedAnswer?.text || item.acceptedAnswer?.name || "";
              foundPairs.push({
                type: "schema",
                question: item.name,
                answer: answer.replace(/<[^>]*>?/gm, '').substring(0, 150) + (answer.length > 150 ? "..." : "")
              });
            }
          });
        }

        if (Array.isArray(obj)) {
          obj.forEach(item => findFAQRecursive(item));
        } else {
          for (const key in obj) {
            if (typeof obj[key] === 'object') {
              findFAQRecursive(obj[key]);
            }
          }
        }
      };
      findFAQRecursive(json);
    } catch (e) { }
  });

  const hasSchema = foundPairs.some(p => p.type === 'schema');

  // Does this page point to a dedicated FAQ destination? (nav/footer link anywhere).
  const hasDedicatedFaqPage = $('a[href]').toArray().some(el => {
    const href = ($(el).attr('href') || '').toLowerCase();
    return /(^|\/)(faqs?|frequently-asked|frequently_asked)([/.?#]|$)/.test(href);
  });

  const meta = {
    hasFAQ: hasSchema,
    questionHeadingsCount: foundPairs.filter(p => p.type === 'heading').length,
    hasDedicatedFaqPage,
    pairs: foundPairs.slice(0, 6) // Return top 6 discovered pairs
  };

  // Strong Q&A anywhere (FAQ schema or ≥3 self-contained pairs) → full credit,
  // regardless of page type.
  if (hasSchema || foundPairs.length >= 3) {
    return {
      score: 100,
      status: "pass",
      details: "Content is structured to answer specific queries.",
      meta,
      analysis: null
    };
  }

  // Some Q&A present but thin → partial credit; never a hard fail for trying.
  if (foundPairs.length >= 1) {
    return {
      score: 75,
      status: "warning",
      details: "Content layout is not fully query-optimized.",
      meta,
      analysis: {
        cause: "Only a few question→answer blocks were found.",
        recommendation: 'Add more question-style <h2>/<h3> headings in the <body>, each followed by a concise, self-contained answer, and mark them up with FAQPage schema in a <script type="application/ld+json"> block in the <head>.'
      }
    };
  }

  // No Q&A on this page. Answer-first structure is genuinely expected on CONTENT
  // pages (blog / guides / FAQ), so a miss there is a real gap.
  if (pageType === "content") {
    return {
      score: 0,
      status: "fail",
      details: "No question-and-answer structure found on this content page.",
      meta,
      analysis: {
        cause: "No question-and-answer structure was found on this content page — no question-based headings and no FAQ schema.",
        recommendation: 'Structure the content to answer real user queries: add question-style <h2>/<h3> headings in the <body>, each followed by a concise self-contained answer, and add FAQPage schema in a <script type="application/ld+json"> block in the <head>.'
      }
    };
  }

  // Any other page type (home, VDP, SRP, about…): a Q&A / FAQ layout is optional
  // here — the site may keep it on a dedicated FAQ page — so this page is NOT
  // penalized. Marked Not Applicable and dropped from the weighted score.
  return {
    score: null,
    status: "not_applicable",
    present: false,
    details: hasDedicatedFaqPage
      ? "Not required on this page — the site keeps Q&A on a dedicated FAQ page."
      : "Not required on this page type — a Q&A/FAQ layout is optional here.",
    meta,
    analysis: null
  };
}

// Content Chunking
function checkContentChunking($) {
  const paragraphs = $('p').map((i, el) => $(el).text().split(/\s+/).length).get();
  const longParagraphs = paragraphs.filter(len => len > 80).length;
  const totalParagraphs = paragraphs.length;

  const headings = $('h2, h3, h4').length;
  const headingDensity = totalParagraphs > 0 ? totalParagraphs / Math.max(1, headings) : 0;

  let score = 100;
  let cause = "";
  let recommendation = "";

  if (longParagraphs > 0 && longParagraphs > totalParagraphs * 0.2) {
    score = 50;
    cause = "Presence of several long, uninterrupted text blocks.";
    recommendation = "Break down long paragraphs into smaller chunks (40-60 words) to improve scannability for LLMs.";
  } else if (headings === 0 && totalParagraphs > 3) {
    score = 50;
    cause = "Lack of logical section breaks (headings).";
    recommendation = "Use H2 and H3 tags to divide content into distinct thematic sections.";
  }

  return {
    score,
    status: score === 100 ? "pass" : "warning",
    details: score === 100 ? "Content is well-chunked into readable blocks." : "Content blocks are too dense.",
    qanda: {
      question: "Is the content divided into digestible 'chunks' for AI?",
      answer: score === 100 ? "Yes, the text is broken down into small, readable blocks that are easy for AI to summarize." : "No, long paragraphs and dense text blocks make it difficult for AI models to extract key facts."
    },
    meta: { longParagraphs, totalParagraphs, headingDensity: headingDensity.toFixed(1) },
    analysis: score === 100 ? null : { cause, recommendation }
  };
}

// Lists & Structured Blocks
function checkListsStructuredBlocks($) {
  const listCount = $('ul, ol').length;
  const tableCount = $('table').length;
  const blockquoteCount = $('blockquote').length;
  const totalStructured = listCount + tableCount + blockquoteCount;

  let score = 100;
  let cause = "";
  let recommendation = "";

  if (totalStructured === 0) {
    score = 50;
    cause = "No lists, tables, or callout blocks detected.";
    recommendation = "Incorporate bulleted lists and tables to present data points, which are easily extracted by AI snippets.";
  }

  return {
    score,
    status: score === 100 ? "pass" : "warning",
    details: score === 100 ? "Structured blocks (lists/tables) improve data extraction." : "Content lacks variety in layout elements.",
    qanda: {
      question: "Does the page use lists and tables to present data points?",
      answer: score === 100 ? "Yes, structured elements like lists and tables are used to provide clear, extractable data for AI snippets." : "No, the lack of structured blocks prevents AI from quickly identifying and pulling your data points."
    },
    meta: { listCount, tableCount, blockquoteCount },
    analysis: score === 100 ? null : { cause, recommendation }
  };
}

// Terminology Consistency
function checkTerminologyConsistency($) {
  const text = $('body').text().toLowerCase();
  const keyTerms = $('h1, h2').text().toLowerCase().split(/\W+/).filter(w => w.length > 5);

  // Basic heuristic: check if terms in headings appear in body
  const distinctTerms = [...new Set(keyTerms)];
  const consistent = distinctTerms.every(term => text.split(term).length > 2);

  let cause = "";
  let recommendation = "";
  if (!consistent && distinctTerms.length > 0) {
    cause = "Primary terms in headings are not consistently used in the body text.";
    recommendation = "Maintain consistent terminology throughout the page to help AI models build a robust knowledge graph of your topic.";
  }

  return {
    score: consistent ? 100 : 70,
    status: consistent ? "pass" : "warning",
    details: consistent ? "Terminology is consistent across headings and body." : "Terminology alignment could be improved.",
    qanda: {
      question: "Is your industry terminology used consistently?",
      answer: consistent ? "Yes, consistent language is used throughout the page, helping AI build a stable knowledge graph of your brand." : "No, inconsistent terminology makes it harder for AI models to confidently categorize your expertise."
    },
    meta: { keyTerms: distinctTerms.slice(0, 5) },
    analysis: consistent ? null : { cause, recommendation }
  };
}

// Author / Source Attribution
function checkAuthorSourceAttribution($) {
  const authorMeta = $('meta[name="author"]').length > 0 || $('[itemprop="author"]').length > 0;
  const hasByline = /by\s+[A-Z][a-z]+/i.test($('body').text()) || $('.author, .byline').length > 0;
  const hasAuthorSchema = $('script[type="application/ld+json"]').text().includes('"author"');

  const attributed = authorMeta || hasByline || hasAuthorSchema;

  let cause = "";
  let recommendation = "";
  if (!attributed) {
    cause = "No clear author or source attribution identified.";
    recommendation = 'Add a visible author byline near the top of the content in the <body> (e.g. <p class="byline">By Jane Doe</p>) and declare the author in your JSON-LD structured data with an "author" field. This satisfies EEAT (Experience, Expertise, Authoritativeness, and Trustworthiness).';
  }

  return {
    score: attributed ? 100 : 50,
    status: attributed ? "pass" : "warning",
    details: attributed ? "Author attribution is clearly defined." : "Missing explicit author information.",
    qanda: {
      question: "Is there clear author or source attribution for the content?",
      answer: attributed ? "Yes, a visible author byline and schema data establish human expertise and accountability." : "No, missing author information reduces the trust and authority score (E-E-A-T) of your content."
    },
    meta: { authorMeta, hasByline, hasAuthorSchema },
    analysis: attributed ? null : { cause, recommendation }
  };
}

// Fact vs Opinion Separation
function checkFactVsOpinion($) {
  const citations = $('sup, .citation, .source, a[href*="doi.org"], a[href*="wikipedia"]').length;
  const references = /reference|source|bibliography/i.test($('h2, h3').text());

  const hasEvidence = citations > 0 || references;

  let cause = "";
  let recommendation = "";
  if (!hasEvidence) {
    cause = "Content lacks clear citations or source references.";
    recommendation = "Use citations and link to reputable sources to distinguish factual claims from opinions, increasing AI confidence scores.";
  }

  return {
    score: hasEvidence ? 100 : 50,
    status: hasEvidence ? "pass" : "warning",
    details: hasEvidence ? "Factual claims are supported by citations or references." : "Content would benefit from external citations.",
    qanda: {
      question: "Are factual claims supported by citations or references?",
      answer: hasEvidence ? "Yes, your content includes external citations that verify your claims for AI confidence." : "No, the lack of citations makes it difficult for AI to distinguish facts from opinions on your page."
    },
    meta: { citations, hasReferenceSection: references },
    analysis: hasEvidence ? null : { cause, recommendation }
  };
}

// Content Completeness
function checkContentCompleteness($) {
  const wordCount = $('body').text().split(/\s+/).length;
  const hasIntro = /introduction|overview|summary/i.test($('h1, h2, h3').text()) || $('p').first().text().length > 100;
  const hasConclusion = /conclusion|summary|final thoughts/i.test($('h2, h3, h4').text());

  const isComplete = wordCount > 400 && hasIntro && hasConclusion;

  let cause = "";
  let recommendation = "";
  if (!isComplete) {
    cause = "Content may be incomplete or lacks a standard structural flow (Intro/Body/Conclusion).";
    recommendation = "Ensure the page provides a comprehensive overview with a clear beginning and end to satisfy depth-seeking AI models.";
  }

  return {
    score: isComplete ? 100 : 50,
    status: isComplete ? "pass" : "warning",
    details: isComplete ? "Content provides a comprehensive and complete overview." : "Content structure feels brief or incomplete.",
    qanda: {
      question: "Is the content comprehensive and structurally complete?",
      answer: isComplete ? "Yes, the page provides a thorough overview with a clear beginning, middle, and end." : "No, the content structure feels brief or disjointed, which may signal low quality to AI models."
    },
    meta: { wordCount, hasIntro, hasConclusion },
    analysis: isComplete ? null : { cause, recommendation }
  };
}

// Structured content — merge of Content Chunking + Lists/Tables (spec §2.7 "keep the
// strongest, merge the rest"). INFORMATIONAL (weight 0): overlaps AEO "Structured content".
function checkStructuredContent($) {
  const chunking = checkContentChunking($);
  const lists = checkListsStructuredBlocks($);

  const score = Math.round((chunking.score + lists.score) / 2);
  const status = score >= 80 ? "pass" : score >= 40 ? "warning" : "fail";

  const causes = [chunking.analysis?.cause, lists.analysis?.cause].filter(Boolean);
  const recs = [chunking.analysis?.recommendation, lists.analysis?.recommendation].filter(Boolean);

  return {
    score,
    status,
    infoOnly: true,
    details: status === "pass"
      ? "Content is well-chunked with lists/tables for clean AI extraction."
      : "Content structure could be more machine-parseable (chunks, lists, tables).",
    qanda: {
      question: "Is content broken into machine-parseable chunks, lists, and tables?",
      answer: status === "pass"
        ? "Yes, short chunks plus lists/tables let AI extract facts cleanly."
        : "Partially — dense paragraphs or missing lists/tables make extraction harder for AI."
    },
    meta: {
      listCount: lists.meta.listCount,
      tableCount: lists.meta.tableCount,
      blockquoteCount: lists.meta.blockquoteCount,
      longParagraphs: chunking.meta.longParagraphs,
      totalParagraphs: chunking.meta.totalParagraphs,
      headingDensity: chunking.meta.headingDensity
    },
    analysis: status === "pass" ? null : {
      cause: causes.join(" ") || "Content structure could be more machine-parseable.",
      recommendation: recs.join(" ") || "Use short chunks (40–60 words), bulleted lists, and tables to expose data points to AI."
    }
  };
}

const fetchTextWithTimeout = async (target, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(target, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

const evaluateAgenticBrowsing = async (page, url) => {
  let dom = {
    apiPresent: false, declarativeTools: 0, totalForms: 0, annotatedForms: 0,
    schemaValid: null, totalInteractive: 0, namedInteractive: 0, landmarks: 0,
  };
  try {
    dom = await page.evaluate(() => {
      // Imperative WebMCP / model-context API surface.
      const apiPresent = !!(navigator.modelContext || window.mcp || window.webmcp || window.agent || window.__WEBMCP__);
      // Declarative tool registrations (HTML-defined).
      const mcpScripts = Array.from(document.querySelectorAll('script[type*="mcp"]'));
      const toolEls = Array.from(document.querySelectorAll('tool, [data-mcp-tool], [mcp-tool], [data-webmcp], [data-agent-tool]'));
      const forms = Array.from(document.querySelectorAll('form'));
      const annotatedForms = forms.filter((f) =>
        f.hasAttribute('data-mcp') || f.hasAttribute('data-webmcp') || f.hasAttribute('mcp-tool') ||
        f.hasAttribute('data-agent-tool') || !!f.querySelector('[data-mcp-tool],[mcp-tool],[data-webmcp]')
      ).length;
      let schemaValid = null;
      if (mcpScripts.length) {
        schemaValid = mcpScripts.every((s) => { try { JSON.parse(s.textContent || ''); return true; } catch { return false; } });
      }
      // Agent accessibility: share of interactive elements with an accessible name.
      const interactive = Array.from(document.querySelectorAll('a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [role="link"]'));
      let named = 0;
      for (const el of interactive) {
        const name = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.getAttribute('title') ||
          (el.textContent || '').trim() || el.getAttribute('alt') || el.getAttribute('value') || el.getAttribute('placeholder') ||
          ((el.labels && el.labels.length) ? 'labelled' : '');
        if (name && String(name).trim()) named++;
      }
      const landmarks = document.querySelectorAll('main, nav, header, footer, [role="main"], [role="navigation"], [role="banner"], [role="contentinfo"]').length;
      return {
        apiPresent,
        declarativeTools: toolEls.length + mcpScripts.length,
        totalForms: forms.length,
        annotatedForms,
        schemaValid,
        totalInteractive: interactive.length,
        namedInteractive: named,
        landmarks,
      };
    });
  } catch { /* page.evaluate failed — keep defaults (scores 0) */ }

  const registeredTools = dom.declarativeTools + (dom.apiPresent ? 1 : 0);
  const hasSurface = dom.apiPresent || dom.declarativeTools > 0 || dom.annotatedForms > 0;
  let webmcpScore = 0;
  if (hasSurface) {
    const formCoverage = dom.totalForms ? dom.annotatedForms / dom.totalForms : (registeredTools > 0 ? 1 : 0);
    const toolScore = registeredTools > 0 ? 1 : 0;
    const schemaPenalty = dom.schemaValid === false ? 0.5 : 1;
    webmcpScore = Math.round(100 * (0.6 * formCoverage + 0.4 * toolScore) * schemaPenalty);
  }

  // Informational sub-scores (not folded in — owned by other sections).
  const agentAccessibility = dom.totalInteractive ? Math.round((dom.namedInteractive / dom.totalInteractive) * 100) : 100;
  const origin = (() => { try { return new URL(url).origin; } catch { return null; } })();
  const llmsRaw = origin ? await fetchTextWithTimeout(`${origin}/llms.txt`, 8000) : null;
  const hasLlmsTxt = !!(llmsRaw && llmsRaw.trim().length > 0 && !/<html/i.test(llmsRaw.slice(0, 200)));

  const status = webmcpScore >= 75 ? "pass" : webmcpScore >= 25 ? "warning" : "fail";

  return {
    score: webmcpScore,
    status,
    experimental: true,
    confidence: "lab",
    details: webmcpScore > 0
      ? `WebMCP agent tooling detected (${dom.annotatedForms}/${dom.totalForms} forms annotated).`
      : "No WebMCP agent tooling found — an emerging, early-mover signal most sites don't have yet.",
    meta: {
      value: `${webmcpScore}%`,
      experimental: true,
      registeredTools,
      apiPresent: dom.apiPresent,
      totalForms: dom.totalForms,
      annotatedForms: dom.annotatedForms,
      schemaValid: dom.schemaValid,
      // informational sub-scores (shown, not weighted here):
      agentAccessibility,
      llmsTxt: hasLlmsTxt,
      landmarks: dom.landmarks,
      thresholds: { Good: "≥75%", Warning: "25–74%", Poor: "<25%" },
    },
    analysis: status === "pass" ? null : {
      cause: "The site exposes no machine-callable tools (WebMCP) for AI agents to search inventory, value a trade, or book service.",
      recommendation: "Adopt WebMCP — annotate key forms/actions declaratively and register agent tools. Early adoption is a competitive moat while the standard is new.",
    },
  };
};

export default async function aioReadiness(url, page, $, pageType = null, siteSubType = null, market = null) {

  const domain = Domain(url);

  // ── Weighted parameters (spec §2.7) ──
  const structuredData = checkStructuredData($);                       // validity / matches content
  const contentNLPFriendly = checkContentNLPFriendly($);
  const answerOrientedStructure = checkAnswerOrientedStructure($, pageType);
  const keywordsEntitiesAnnotated = checkKeywordsEntitiesAnnotated($);
  const contentUpdatedRegularly = checkContentUpdatedRegularly($, market);
  const internalLinkingAIFriendly = checkInternalLinkingAIFriendly($, domain);
  const topicalFocusClarity = checkTopicalFocusClarity($, url);
  // AI Agentic Browsing — WebMCP readiness arm (spec Part 3 + §5.1, ~6% in AIO).
  // page may be absent on some call paths; the evaluator guards page.evaluate internally.
  const aiAgenticBrowsing = await evaluateAgenticBrowsing(page, url, null);

  const isAgenticApplicable = !["about", "content"].includes(pageType);
  const agenticResult = isAgenticApplicable
    ? await evaluateAgenticBrowsing(page, url)
    : { score: null, status: "not_applicable", details: "Not applicable on this page type." };
  agenticResult.present = isAgenticApplicable;

  // ── Informational only (weight 0; spec §2.7 "keep the strongest, merge the rest") ──
  const structuredContent = checkStructuredContent($);                 // merge: chunking + lists/tables
  const terminologyConsistency = { ...checkTerminologyConsistency($), infoOnly: true };
  // Duplicate-content readiness (canonical / noindex) is INFO-ONLY here (Bucket-3 de-dup):
  // it scored 100 for mere canonical presence, which On-Page SEO `Canonical` already owns
  // and grades far more thoroughly (self-reference, parameterized-variant canonicalization,
  // noindex conflict, pagination). A single-page audit cannot observe the only facet that
  // would be distinct (one resolvable version across filter/param variants), so per the
  // no-double-counting rule (spec §0.3 rule 4) this stays surfaced but unweighted.
  const duplicateContentDetectionReady = { ...checkDuplicateContentDetectionReady($), infoOnly: true };

  // Spec §2.7 + §5.1 in-section weights (decimals; renormalized at roll-up).
  // AI Agentic Browsing (WebMCP) is the only NEW arm weighted (~0.06); its agent-a11y,
  // CLS and llms.txt sub-scores stay informational (owned by A11y/Technical/AEO).
  const weights = {
    Structured_Data: 0.20,
    Content_NLP_Friendly: 0.16,
    Answer_Oriented_Structure: 0.12,
    Keywords_Entities_Annotated: 0.10,
    Content_Updated_Regularly: 0.10,
    Internal_Linking_AI_Friendly: 0.10,
    Topical_Focus_Clarity: 0.10,
    AI_Agentic_Browsing: 0.06
  };

  const metricsMap = {
    Structured_Data: structuredData,
    Content_NLP_Friendly: contentNLPFriendly,
    Answer_Oriented_Structure: answerOrientedStructure,
    Keywords_Entities_Annotated: keywordsEntitiesAnnotated,
    Content_Updated_Regularly: contentUpdatedRegularly,
    Internal_Linking_AI_Friendly: internalLinkingAIFriendly,
    Topical_Focus_Clarity: topicalFocusClarity,
    AI_Agentic_Browsing: agenticResult,
    // informational (excluded from scoring)
    Duplicate_Content_Detection_Ready: duplicateContentDetectionReady,
    Structured_Content: structuredContent,
    Terminology_Consistency: terminologyConsistency
  };

  // Weighted aggregate over applicable params, graded (uses metric.score directly).
  // Rule 6: any param flagged present:false is dropped from the denominator (renormalized).
  let totalWeight = 0;
  let earned = 0;
  let scored = 0;
  for (const [key, w0] of Object.entries(weights)) {
    const m = metricsMap[key];
    if (!m || m.present === false) continue;
    // Per-site-type tilt: dealers need entity precision and freshness (inventory
    // turns weekly); service and repair need answer-shaped structure, because
    // their queries are questions. 1.0 for a franchise dealer and for
    // corporate/unresolved sites — see config/parameterImportance.js.
    const w = w0 * importance(key, siteSubType);
    if (w <= 0) continue;
    const s = typeof m.score === "number" ? m.score : 0;
    totalWeight += w;
    earned += s * w;
    scored++;
  }

  const actualPercentage = totalWeight > 0 ? Math.round(earned / totalWeight) : 0;
  const badge = actualPercentage >= 50 ? "Yes" : "No";

  return {
    Percentage: actualPercentage,
    AIO_Compatibility_Badge: badge,
    Confidence: "heuristic",
    parametersScored: scored,
    ...metricsMap
  };
}
