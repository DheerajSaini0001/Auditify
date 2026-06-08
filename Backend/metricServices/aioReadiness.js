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
    recommendation = "Implement Schema.org structured data using JSON-LD to help AI models understand your entities and content relationships.";
  } else if (syntaxErrors > 0) {
    cause = `${syntaxErrors} script tag(s) contain invalid JSON syntax.`;
    recommendation = "Fix the JSON syntax errors in your LD+JSON scripts to ensure they are fully readable by AI crawlers.";
  } else if (uniqueTypes.length < 2) {
    cause = "Limited variety of structured data types found.";
    recommendation = "Increase the depth of your markup by adding more Schema.org types (e.g., BreadcrumbList, Organization, or FAQPage).";
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
    recommendation = "Use semantic elements like <article> and <section> to help AI models understand the document structure.";
  } else if (foundHeadings.length === 0) {
    cause = "No hierarchical headings (h1, h2, h3) detected.";
    recommendation = "Implement a clear heading hierarchy to define content sections for NLP processing.";
  } else if (!hasParagraphs && !hasLists) {
    cause = "Lack of standard text blocks (p, ul, ol).";
    recommendation = "Organize body text into paragraphs and lists for better readability and data extraction.";
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
    recommendation = "Add essential keywords to the meta keywords tag for better entity association by AI crawlers.";
  } else if (headingsCount === 0) {
    cause = "Lack of descriptive h1/h2 headings.";
    recommendation = "Add descriptive headings that contain key entities related to your page content.";
  } else if (totalImages > 0 && imagesWithAlt < totalImages) {
    cause = `${totalImages - imagesWithAlt} images are missing descriptive ALT text.`;
    recommendation = "Ensure all images have ALT attributes to provide visual context for AI models.";
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
function checkContentUpdatedRegularly($) {
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
    const date = new Date(dateFound);
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
    score = 50;
    status = "warning";
    cause = "Could not find content update timestamp (meta tags, time tags, or structured data).";
    recommendation = "Add <meta name='last-modified'>, <time datetime='...'>, or dateModified structured data to signal content freshness.";
    meta.checked = "meta tags (last-modified, modified_time, etc.), JSON-LD (dateModified), time tags";
  }

  return {
    score,
    status,
    details: status === "pass" ? "Content updated recently." : (score === 50 && dateFound ? "Content might be outdated." : "Could not determine last update time."),
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

  if (internalLinks === 0) {
    score = 0;
    status = "fail";
    cause = "No internal links found on the page.";
    recommendation = "Add internal links to help AI models navigate and understand page relationships.";
  } else if (descriptiveLinks < internalLinks * 0.5) {
    score = 50;
    status = "warning";
    cause = "Multiple internal links use generic or non-descriptive anchor text.";
    recommendation = "Use keyword-rich anchor text instead of 'click here' to provide better context for AI.";
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
  let cause = "";
  let recommendation = "";
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
  const hasStrongFocus = overlap.length >= 2 || (titleWords.length > 0 && h1.includes(titleWords[0]));

  let cause = "";
  let recommendation = "";
  if (!hasStrongFocus) {
    cause = "Title and H1 heading lack alignment on primary keywords.";
    recommendation = "Ensure your H1 heading uses the same primary entities as your page title to signal clear topical focus to AI.";
  }

  return {
    score: hasStrongFocus ? 100 : 50,
    status: hasStrongFocus ? "pass" : "warning",
    details: hasStrongFocus ? "Strong topical focus detected." : "Title and H1 alignment could be stronger.",
    qanda: {
      question: "Does the page maintain a clear and consistent topical focus?",
      answer: hasStrongFocus ? "Yes, your title and main headings are perfectly aligned around your primary topic." : "No, there is a mismatch between your title and headings, which confuses AI about your primary focus."
    },
    meta: { overlap, title, h1 },
    analysis: hasStrongFocus ? null : { cause, recommendation }
  };
}

// Answer-Oriented Structure
function checkAnswerOrientedStructure($) {
  const questionWords = ["how", "what", "why", "when", "where", "who", "which"];
  let foundPairs = [];

  // 1. Extract from Question-based Headings (H2/H3)
  $("h2, h3").each((i, el) => {
    const text = $(el).text().trim();
    if (questionWords.some(word => text.toLowerCase().startsWith(word)) || text.includes("?")) {
      // Find the next paragraph or text block as the "Answer"
      const nextText = $(el).nextUntil('h1, h2, h3, h4, h5, h6').filter('p').first().text().trim();
      foundPairs.push({
        type: "heading",
        question: text,
        answer: nextText ? nextText.substring(0, 150) + (nextText.length > 150 ? "..." : "") : "Answer not found in immediate text."
      });
    }
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

  const isAnswerOriented = foundPairs.length > 0;

  let cause = "";
  let recommendation = "";
  if (!isAnswerOriented) {
    cause = "No question-based headings or FAQ schema detected.";
    recommendation = "Structure your content to directly answer user queries using natural language questions in H2/H3 tags.";
  }

  return {
    score: isAnswerOriented ? 100 : 50,
    status: isAnswerOriented ? "pass" : "warning",
    details: isAnswerOriented ? "Content is structured to answer specific queries." : "Content layout is not query-optimized.",
    qanda: {
      question: "Is the content structured to directly answer user questions?",
      answer: isAnswerOriented ? "Yes, the content follows an answer-oriented structure with clear questions and concise responses." : "No, the content does not offer direct query-answer pairs, making it harder for 'Answer Engines' to cite you."
    },
    meta: {
      hasFAQ: foundPairs.some(p => p.type === 'schema'),
      questionHeadingsCount: foundPairs.filter(p => p.type === 'heading').length,
      pairs: foundPairs.slice(0, 6) // Return top 6 discovered pairs
    },
    analysis: isAnswerOriented ? null : { cause, recommendation }
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
    recommendation = "Add an author byline and Author structured data to satisfy EEAT (Experience, Expertise, Authoritativeness, and Trustworthiness).";
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

export default async function aioReadiness(url, page, $) {

  const domain = Domain(url);
  const structuredData = checkStructuredData($);
  const contentNLPFriendly = checkContentNLPFriendly($);
  const keywordsEntitiesAnnotated = checkKeywordsEntitiesAnnotated($);
  const contentUpdatedRegularly = checkContentUpdatedRegularly($);
  const internalLinkingAIFriendly = checkInternalLinkingAIFriendly($, domain);
  const duplicateContentDetectionReady = checkDuplicateContentDetectionReady($);

  const topicalFocusClarity = checkTopicalFocusClarity($, url);
  const answerOrientedStructure = checkAnswerOrientedStructure($);
  const contentChunking = checkContentChunking($);
  const listsStructuredBlocks = checkListsStructuredBlocks($);
  const terminologyConsistency = checkTerminologyConsistency($);
  const authorSourceAttribution = checkAuthorSourceAttribution($);
  const factVsOpinion = checkFactVsOpinion($);
  const contentCompleteness = checkContentCompleteness($);

  // Weights
  const weights = {
    Structured_Data: 3,
    Content_NLP_Friendly: 3,
    Keywords_Entities_Annotated: 2,
    Content_Updated_Regularly: 2,
    Internal_Linking_AI_Friendly: 2,
    Duplicate_Content_Detection_Ready: 1,
    Topical_Focus_Clarity: 3,
    Answer_Oriented_Structure: 3,
    Content_Chunking: 2,
    Lists_Structured_Blocks: 2,
    Terminology_Consistency: 1,
    Author_Source_Attribution: 2,
    Fact_Vs_Opinion: 2,
    Content_Completeness: 2
  };

  const metricsMap = {
    Structured_Data: structuredData,
    Content_NLP_Friendly: contentNLPFriendly,
    Keywords_Entities_Annotated: keywordsEntitiesAnnotated,
    Content_Updated_Regularly: contentUpdatedRegularly,
    Internal_Linking_AI_Friendly: internalLinkingAIFriendly,
    Duplicate_Content_Detection_Ready: duplicateContentDetectionReady,
    Topical_Focus_Clarity: topicalFocusClarity,
    Answer_Oriented_Structure: answerOrientedStructure,
    Content_Chunking: contentChunking,
    Lists_Structured_Blocks: listsStructuredBlocks,
    Terminology_Consistency: terminologyConsistency,
    Author_Source_Attribution: authorSourceAttribution,
    Fact_Vs_Opinion: factVsOpinion,
    Content_Completeness: contentCompleteness
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

  return {
    Percentage: actualPercentage,
    AIO_Compatibility_Badge: badge,
    ...metricsMap
  };
}
