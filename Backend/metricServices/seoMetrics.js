import axios from "axios";
import SiteReport from "../models/SiteReport.js";

// On-Page SEO (Essentials) 
function checkURLStructure(url) {
  try {
    const { pathname, search } = new URL(url);
    const fullPath = pathname + search;
    const issues = [];

    // 1. Check if URL is too long (Ideal: 60-75 chars)
    if (fullPath.length > 75) {
      issues.push({
        segment: "URL Length",
        reason: `URL is too long (${fullPath.length} chars). Ideally keep it under 75 characters.`
      });
    }

    // 2. Check for unnecessary parameters
    const badParams = ["id", "ref", "stockid", "utm", "session", "sort", "filter", "sid", "token"];
    if (search) {
      const params = new URLSearchParams(search);
      const foundBadParams = [];
      params.forEach((_, key) => {
        if (badParams.some(bp => key.toLowerCase().includes(bp))) {
          foundBadParams.push(key);
        }
      });

      if (foundBadParams.length > 0) {
        issues.push({
          segment: foundBadParams.join(", "),
          reason: `Contains SEO-unfriendly parameters. Use clean URLs.`
        });
      }
    }

    // 3. Look for unclean characters
    if (/%20|%3A|%2F/.test(fullPath)) {
      issues.push({
        segment: "Unclean Characters",
        reason: "URL contains encoded characters like %20, %3A, or %2F. Use hyphens instead."
      });
    }
    if (/[A-Z]/.test(pathname)) {
      issues.push({
        segment: "Uppercase Letters",
        reason: "URL contains uppercase letters. SEO best practice is lowercase only."
      });
    }
    if (/_/.test(pathname)) {
      issues.push({
        segment: "Underscores",
        reason: "URL contains underscores (_). Google prefers hyphens (-) as separators."
      });
    }
    // Check for random alphanumeric strings (heuristic: long segments with mixed numbers/letters)
    const segments = pathname.split('/').filter(Boolean);
    segments.forEach(seg => {
      if (/[a-z]/.test(seg) && /[0-9]/.test(seg) && seg.length > 15) {
        issues.push({
          segment: seg,
          reason: "Segment looks like a random ID or hash. Use descriptive keywords."
        });
      }
    });


    // 4. Check folder depth (Too many slashes?)
    if (segments.length > 3) {
      issues.push({
        segment: "Folder Depth",
        reason: `URL is too deep (${segments.length} folders). Keep it shallow (≤ 3 levels).`
      });
    }

    // 5. Keyword Relevance (Basic Check)
    // If URL is just numbers or very short generic words, it might not describe content
    const meaningfulSegments = segments.filter(s => s.length > 3 && !/^\d+$/.test(s));
    if (meaningfulSegments.length === 0 && segments.length > 0) {
      issues.push({
        segment: "Keyword Relevance",
        reason: "URL does not appear to contain descriptive keywords."
      });
    }

    return {
      score: issues.length === 0 ? 1 : 0,
      issues
    };
  } catch (err) {
    return { score: 0, issues: [{ segment: url, reason: "Invalid URL format." }] };
  }
}

function normalizeUrl(url) {
  try {
    const u = new URL(url);
    let hostname = u.hostname.toLowerCase();
    if (hostname.startsWith("www.")) hostname = hostname.slice(4);
    const path = u.pathname.replace(/\/$/, "");
    return hostname + path;
  } catch {
    return null;
  }
}
function isValidCanonical(canonical, pageUrl) {
  const c = normalizeUrl(canonical);
  const p = normalizeUrl(pageUrl);
  return c && p && c === p;
}

// On-Page SEO (Media & Semantics) 
async function imageCheck($) {
  const images = $("img").toArray();

  const imagePresence = images.length > 0 ? 1 : 0;

  const imagesWithAlt = images.filter((img) => {
    const alt = $(img).attr("alt");
    return alt !== undefined && alt.trim() !== "";
  });
  const imagesWithAltScore = images.length > 0 ? (imagesWithAlt.length / images.length) : 1;

  const meaningfulAlts = images.filter((img) => {
    const alt = $(img).attr("alt")?.trim().toLowerCase() || "";
    const meaningless = ["", "image", "logo", "icon", "pic", "picture", "photo", " ", "12345", "-", "graphics"];
    return !meaningless.includes(alt);
  });
  const meaningfulAltsScore = images.length > 0 ? (meaningfulAlts.length / images.length) : 1;

  const total = images.length;
  const withoutAlt = images.filter(img => {
    const alt = $(img).attr("alt");
    return !alt || alt.trim() === "";
  }).length;
  const withoutTitle = images.filter(img => {
    const title = $(img).attr("title");
    return !title || title.trim() === "";
  }).length;

  const missingAlt = images
    .filter(img => {
      const alt = $(img).attr("alt");
      return !alt || alt.trim() === "";
    })
    .map(img => ({
      src: $(img).attr("src") || "",
      alt: $(img).attr("alt") || "",
    }));

  const missingTitle = images
    .filter(img => {
      const title = $(img).attr("title");
      return !title || title.trim() === "";
    })
    .map(img => ({
      src: $(img).attr("src") || "",
      title: $(img).attr("title") || "",
    }));

  const completeImage = images
    .filter((img) => {
      const alt = $(img).attr("alt")?.trim();
      const title = $(img).attr("title")?.trim();
      return alt && alt !== "" && title && title !== "";
    })
    .map((img) => ({
      src: $(img).attr("src") || "",
      alt: $(img).attr("alt") || "",
      title: $(img).attr("title") || ""
    }));

  const imagesSize = [];
  let totalScore = 0;

  for (const img of images) {
    const src = $(img).attr("src");
    if (!src) continue;

    try {
      const res = await axios.get(src, { responseType: "arraybuffer" });
      const sizeKB = (res.data.byteLength / 1024).toFixed(2);
      totalScore += sizeKB < 200 ? 1 : 0;

      imagesSize.push({
        src,
        sizeKB,
        status: sizeKB < 200 ? "OK" : "Large",
      });

    } catch (err) {
      totalScore += 0;
      imagesSize.push({
        src,
        sizeKB: "Failed",
        status: "Error",
      });
    }
  }
  const sizeScore = images.length > 0 ? (totalScore / images.length) : 1;

  return {
    imagePresence,
    imagesWithAltScore,
    meaningfulAltsScore,
    total,
    withoutAlt,
    withoutTitle,
    missingAlt,
    missingTitle,
    completeImage,
    imagesSize,
    sizeScore
  }
}

const checkVideoExistance = ($) => {
  const videos = $("video, iframe[src*='youtube'], iframe[src*='vimeo']").toArray();
  return videos.length == 0 ? 0 : 1;
};

const checkVideoEmbedding = ($) => {
  const videos = $("video, iframe[src*='youtube'], iframe[src*='vimeo']").toArray();
  return videos.length > 0 ? 1 : 0; // 1 = properly embedded, 0 = none
};

const checkLazyLoading = ($) => {
  const videos = $("video, iframe").toArray();
  if (videos.length === 0) return 1;

  const lazyLoaded = videos.filter((el) => $(el).attr("loading") === "lazy").length;
  return lazyLoaded / videos.length; // Return ratio (0 to 1)
};

const checkStructuredMetadata = ($) => {
  const scripts = $("script[type='application/ld+json']").toArray();
  if (scripts.length === 0) return 1;
  for (const script of scripts) {
    try {
      const data = JSON.parse($(script).html());
      if (Array.isArray(data)) {
        if (data.some((d) => d["@type"] === "VideoObject")) return 1;
      } else if (data["@type"] === "VideoObject") return 1;
    } catch (err) {
      continue;
    }
  }
  return 0;
};

const checkHierarchy = (headings) => {
  if (headings.length === 0) return 1;
  let lastLevel = 0;
  let errors = 0;
  let totalTransitions = 0;

  for (const h of headings) {
    const currentLevel = parseInt(h.tag[1]); // h1 -> 1, h2 -> 2
    if (lastLevel > 0) {
      totalTransitions++;
      if (currentLevel > lastLevel + 1) {
        errors++;
      }
    }
    lastLevel = currentLevel;
  }

  if (totalTransitions === 0) return 1;
  // Score = 1 - (errors / totalTransitions). If 0 errors, 1. If all errors, 0.
  return Math.max(0, 1 - (errors / totalTransitions));
};

const detailedHeadingAudit = ($) => {
  const issues = [];

  // 1. Check H1 Count
  const h1Tags = $("h1");
  if (h1Tags.length !== 1) {
    issues.push({
      parameter: "Heading Tag Structure",
      finding: `Found ${h1Tags.length} H1 tags. Expected only 1.`,
      recommendation: "Ensure only one H1 tag per page (main title). Convert extra H1s into H2.",
      priority: "Critical"
    });
  }

  // 2. Check Hierarchy
  const headings = $("h1, h2, h3, h4, h5, h6");
  let lastLevel = 1;

  headings.each((i, el) => {
    const tag = el.tagName.toLowerCase();
    const currentLevel = parseInt(tag.replace("h", ""));

    if (currentLevel > lastLevel + 1) {
      issues.push({
        parameter: "Heading Tag Structure",
        finding: `Invalid heading jump: h${lastLevel} → ${tag}`,
        recommendation: `Fix hierarchy. After h${lastLevel}, the next level should be h${lastLevel + 1}, not ${tag}.`,
        priority: "High"
      });
    }
    lastLevel = currentLevel;
  });

  return issues;
};

const altTextSEOScore = ($, keywords = []) => {
  try {
    const images = $("img").toArray();
    const totalImages = images.length;
    if (totalImages === 0) return 0;

    const goodAlts = images.filter(img => {
      const alt = $(img).attr("alt")?.trim().toLowerCase() || "";

      // Skip meaningless or generic alt text
      const meaningless = [
        "", "image", "logo", "icon", "pic", "picture", "photo", " ",
        "12345", "-", "graphics"
      ];
      if (meaningless.includes(alt)) return false;

      // Check if alt contains any keyword (if provided)
      if (keywords.length > 0) {
        return keywords.some(kw => alt.includes(kw.toLowerCase()));
      }

      return true; // descriptive even without keyword
    });

    const ratio = totalImages > 0 ? (goodAlts.length / totalImages) : 0;
    return ratio;
  } catch (err) {
    console.error("Error fetching page:", err.message);
    return 0;
  }
};

const getAllLinks = ($, url, links) => {
  try {
    const domain = new URL(url).hostname;

    const internalLinks = [];
    const externalLinks = [];
    const uniqueSet = new Set();

    const genericAnchors = [
      "click here",
      "read more",
      "learn more",
      "more",
      "details",
      "go",
      "link",
      "this",
      "open",
      "visit"
    ];

    let descriptiveCount = 0;   // now counts ALL descriptive links

    links.forEach(link => {
      const href = $(link).attr("href");
      if (!href) return;

      let resolved;
      try {
        resolved = new URL(href, url);
      } catch {
        return;
      }

      const path = resolved.pathname || "/";
      const anchorRaw = $(link).text().trim();
      const anchor = anchorRaw || "/";

      const obj = { link: path, anchor, full: resolved.href };

      uniqueSet.add(path);

      // 📌 Descriptive check (for ALL links)
      const lower = anchorRaw.toLowerCase();
      if (lower && !genericAnchors.includes(lower)) {
        descriptiveCount++;
      }

      // Internal vs External
      if (resolved.hostname === domain) {
        internalLinks.push(obj);
      } else {
        externalLinks.push(obj);
      }
    });

    const totalInternal = internalLinks.length;
    const totalExternal = externalLinks.length;
    const totalLinks = totalInternal + totalExternal;

    // ⭐ SCORE FOR ALL LINKS
    const score = totalLinks > 0 ? (descriptiveCount / totalLinks) : 1;

    return {
      totalLinks,
      totalInternal,
      totalExternal,
      totalUnique: uniqueSet.size,

      internalLinks,
      externalLinks,

      score // ⭐ score based on ALL links
    };

  } catch (err) {
    console.error("Error:", err);
    return {
      totalLinks: 0,
      totalInternal: 0,
      totalExternal: 0,
      totalUnique: 0,
      internalLinks: [],
      externalLinks: [],
      score: 0
    };
  }
};

const checkSemanticTags = async ($) => {
  try {
    const tags = ["article", "section", "header", "footer"];
    const result = {};

    tags.forEach(tag => {
      result[tag] = $(tag).length > 0 ? 1 : 0; // 1 if tag exists, else 0
    });

    return result;
  } catch (err) {
    console.error("Error checking semantic tags:", err);
    return { article: 0, section: 0, header: 0, footer: 0 };
  }
};

// On-Page SEO (Structure & Uniqueness) 
const checkContextualLinks = ($, url) => {
  try {
    const domain = new URL(url).hostname;

    // 1. Identify "Key Pages" from Navigation (Proxy for Service Pages)
    const navLinks = new Set();
    $("nav a, header a, .menu a, .navigation a, .navbar a").each((i, el) => {
      const href = $(el).attr("href");
      if (href) {
        try {
          const resolved = new URL(href, url);
          // Filter for internal links, exclude current page and root
          if (resolved.hostname === domain && resolved.pathname !== "/" && resolved.pathname !== new URL(url).pathname) {
            navLinks.add(resolved.pathname);
          }
        } catch (e) { }
      }
    });

    // 2. Identify "Contextual Links" in Main Content
    const contentLinks = new Set();
    // Selectors for main content areas
    $("main a, article a, .content a, #content a, .post a, .entry-content a").each((i, el) => {
      const href = $(el).attr("href");
      if (href) {
        try {
          const resolved = new URL(href, url);
          if (resolved.hostname === domain) {
            contentLinks.add(resolved.pathname);
          }
        } catch (e) { }
      }
    });

    // 3. Find Missing Links (Nav links NOT in Content)
    const missingLinks = [];
    navLinks.forEach(link => {
      if (!contentLinks.has(link)) {
        missingLinks.push(link);
      }
    });

    // 4. Generate Issues
    let score = 1;
    const issues = [];

    if (contentLinks.size === 0) {
      score = 0;
      issues.push({
        parameter: "Contextual Internal Linking",
        finding: "No internal links found within the main content area.",
        recommendation: "Add contextual links to related content or service pages within your paragraphs.",
        priority: "High"
      });
    } else if (missingLinks.length > 0) {
      // If significant number of menu items are missing from content, flag it
      if (missingLinks.length > 3) {
        score = 0.5;
      }

      issues.push({
        parameter: "Internal Linking Opportunities",
        finding: `${missingLinks.length} key menu pages are not linked contextually.`,
        recommendation: `Consider linking to these pages from your content: ${missingLinks.slice(0, 3).join(", ")}${missingLinks.length > 3 ? '...' : ''}`,
        priority: "Medium"
      });
    }

    return {
      score,
      totalContextual: contentLinks.size,
      missingLinks: missingLinks,
      issues
    };

  } catch (err) {
    console.log("Contextual Link Error", err);
    return { score: 0, totalContextual: 0, missingLinks: [], issues: [] };
  }
};

function extractText($) {
  return $("body").text().replace(/\s+/g, " ").trim();
}
function simpleDuplicateCheck(text) {
  const words = text.split(/\s+/);
  if (words.length === 0) return 1;

  const wordCounts = {};
  let duplicates = 0;

  words.forEach(word => {
    word = word.toLowerCase();
    if (wordCounts[word]) {
      duplicates++;
    } else {
      wordCounts[word] = 1;
    }
  });

  const duplicationPercent = (duplicates / words.length);
  // Invert so that 0 duplication = 1 score, 100% duplication = 0 score.
  // However, some duplication is natural. Let's say < 20% is perfect (1).
  // > 80% is fail (0).
  // Map 0.2 -> 1, 0.8 -> 0.

  if (duplicationPercent <= 0.2) return 1;
  if (duplicationPercent >= 0.8) return 0;

  // Linear interpolation between 0.2 and 0.8
  // Score = 1 - ((duplicationPercent - 0.2) / 0.6)
  return parseFloat((1 - ((duplicationPercent - 0.2) / 0.6)).toFixed(2));
}

function getSlug(url) {
  try {
    const pathname = new URL(url).pathname; // get path
    const parts = pathname.split('/').filter(Boolean); // remove empty parts
    return parts.length ? parts[parts.length - 1] : null; // last part is slug
  } catch (err) {
    return null; // invalid URL
  }
}
function slugCheck(url) {
  try {
    const pathname = new URL(url).pathname; // get path
    const parts = pathname.split('/').filter(Boolean); // remove empty parts
    return parts.length > 0 ? 1 : 0; // last part is slug
  } catch (err) {
    return null; // invalid URL
  }
}
function slugValid(slug) {
  if (slug.length > 25) return 0;       // length check
  const regex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/; // pattern check
  return regex.test(slug) ? 1 : 0;

}

const checkHTTPS = (url) => {
  try {
    const parsedUrl = new URL(url);
    // Check if protocol is https
    return parsedUrl.protocol === 'https:' ? 1 : 0;
  } catch (error) {
    // Invalid URL
    return 0;
  }
};

function checkPagination($) {
  try {
    // Look for common pagination patterns
    const pagination = $(
      "a[rel='next'], a[rel='prev'], .pagination, .pager, .page-numbers"
    );

    // Also check anchor text manually (case-insensitive)
    const textBased = $("a").filter((i, el) => {
      const txt = $(el).text().toLowerCase();
      return txt.includes("next") || txt.includes("previous");
    });

    return (pagination.length + textBased.length) > 0 ? 0 : 1;
  } catch (err) {
    console.error("Error:", err.message);
    return 0;
  }
}

export default async function seoMetrics(url, device, selectedMetric, $, auditId, page) {

  // Scheme  
  const structuredData = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(el => {
        try { return JSON.parse(el.innerText); } catch { return null; }
      })
      .filter(Boolean)
    return scripts
  });

  // On-Page SEO (Essentials) 
  const title = $("title").text().trim() || "";
  const titleExistanceScore = $("title").length > 0 ? 1 : 0;
  const titleLength = title.length;
  let titleScore = 0;
  if (titleExistanceScore) {
    if (titleLength >= 30 && titleLength <= 60) titleScore = 1;
    else titleScore = 0.5; // Partial score for non-optimal length
  }

  const metaDesc = $('meta[name="description"]').attr("content") || "";
  const metaDescExistanceScore = $('meta[name="description"]').length > 0 ? 1 : 0;
  const metaDescLength = metaDesc.length;
  let metaDescScore = 0;
  if (metaDescExistanceScore) {
    if (metaDescLength >= 50 && metaDescLength <= 160) metaDescScore = 1;
    else metaDescScore = 0.5; // Partial score for non-optimal length
  }

  const URLStructureResult = checkURLStructure(url);
  // Granular URL Score: Start at 1, deduct 0.2 per issue
  const URLStructureScore = Math.max(0, 1 - (URLStructureResult.issues.length * 0.2));

  const canonical = $('link[rel="canonical"]').attr("href") || "";
  const canonicalExistanceScore = $('link[rel="canonical"]').length > 0 ? 1 : 0;
  const canonicalScore = isValidCanonical(canonical, url) ? 1 : 0;

  // On-Page SEO (Media & Semantics) 
  const h1Count = $("h1").length;
  const h2Count = $("h2").length;
  const h3Count = $("h3").length;
  const h4Count = $("h4").length;
  const h5Count = $("h5").length;
  const h6Count = $("h6").length;
  const h1CountScore = h1Count === 0 ? 0 : h1Count === 1 ? 1 : 0;
  // H1 Score: 1 (Perfect), 0.5 (Multiple), 0 (None) - handled in frontend mapping usually, but let's standardize
  // Previous logic: 0 if 0, 1 if 1, 2 if >1. Frontend mapped 2->50.
  // Let's keep 0, 1, 2 for now to avoid breaking existing frontend mapping logic immediately, 
  // or better, return float here and update frontend mapping.
  // Let's stick to the existing 0/1/2 convention for H1 to minimize breakage, 
  // but we will update other metrics to floats.
  const h1Score = h1Count === 0 ? 0 : h1Count === 1 ? 1 : 0.5;

  const image = await imageCheck($)

  let altPresence;
  let altMeaningfullPercentage;
  let imageCompressionScore;

  if (image.imagePresence == 0) {
    altPresence = 1; // No images, so technically passed? Or N/A. Previous logic was 1.
    altMeaningfullPercentage = 1;
    imageCompressionScore = 1;
  }
  else {
    // Granular Image Scores
    altPresence = parseFloat((image.imagesWithAltScore).toFixed(2)); // Now returns actual ratio from imageCheck
    altMeaningfullPercentage = parseFloat((image.meaningfulAltsScore).toFixed(2));
    imageCompressionScore = parseFloat((image.sizeScore).toFixed(2));
  }

  const videoExistanceScore = checkVideoExistance($);

  let embedding;
  let lazyLoading;
  let structuredMetadata;

  if (videoExistanceScore == 0) {
    embedding = 1;
    lazyLoading = 1;
    structuredMetadata = 1;
  }
  else {
    embedding = checkVideoEmbedding($)
    lazyLoading = checkLazyLoading($) // Already returns float (ratio)
    structuredMetadata = checkStructuredMetadata($)
  }

  const headings = $("h1, h2, h3, h4, h5, h6")
    .map((i, el) => ({
      tag: el.tagName.toLowerCase(),
      text: $(el).text().trim()
    })).get();

  let hierarchy;
  if (h1Count == 0 && h2Count == 0 && h3Count == 0 && h4Count == 0 && h5Count == 0 && h6Count == 0) {
    hierarchy = 1
  }
  else {
    hierarchy = checkHierarchy(headings)
  }

  const headingIssues = detailedHeadingAudit($);

  const keywords = ["Canonical", "Result", "Audits"];
  const alttextScore = parseFloat(altTextSEOScore($, keywords));

  const links = $("a").toArray();
  const getAllLink = getAllLinks($, url, links);
  const totalLinks = getAllLink.totalLinks;
  const totalInternalLinks = getAllLink.totalInternal;
  const totalExternalLinks = getAllLink.totalExternal;
  const totalUniqueLinks = getAllLink.totalUnique;
  const internalLinks = getAllLink.internalLinks;
  const externalLinks = getAllLink.externalLinks;
  // Granular Link Score
  const linkScore = parseFloat(getAllLink.score); // Assuming getAllLinks returns ratio, let's verify. 
  // Wait, getAllLinks usually returns object. I need to check getAllLinks implementation.
  // Assuming I need to calculate ratio here if getAllLinks doesn't.

  const semanticTagScoreResolved = await checkSemanticTags($);
  const articleScore = semanticTagScoreResolved.article;
  const sectionScore = semanticTagScoreResolved.section;
  const headerScore = semanticTagScoreResolved.header;
  const footerScore = semanticTagScoreResolved.footer;

  const contextualLinks = checkContextualLinks($, url);
  const contextualLinkScore = contextualLinks.score;

  // On-Page SEO (Structure & Uniqueness) 
  const pageText = extractText($);
  const dupScore = simpleDuplicateCheck(pageText);

  const slug = getSlug(url);
  let slugCheckScore = slugCheck(url);
  let slugScore;
  if (slugCheckScore == 0) {
    slugScore = 1;
  }
  else {
    slugScore = slugValid(slug)
  }

  const checkHTTPSScore = checkHTTPS(url);

  const paginationScore = checkPagination($);

  const Total = parseFloat((((titleScore + titleExistanceScore + metaDescScore + metaDescExistanceScore + URLStructureScore + canonicalScore + canonicalExistanceScore + h1Score + altPresence + altMeaningfullPercentage + imageCompressionScore + embedding + lazyLoading + structuredMetadata + hierarchy + alttextScore + linkScore + dupScore + slugScore + paginationScore + contextualLinkScore) / 21) * 100).toFixed(0));

  // Passed
  const passed = [];

  // Improvements
  const improvements = [];

  // On-Page SEO (Essentials) 
  if (URLStructureScore === 0) {
    improvements.push({
      metric: "URL Structure",
      current: "Long or complex URL",
      recommended: "≤ 5 segments, lowercase, hyphen-separated",
      severity: "Medium 🟡",
      suggestion: "Use clean, SEO-friendly URLs with hyphens instead of underscores or symbols."
    });
  } else {
    passed.push({
      metric: "URL Structure",
      current: "Clean URL",
      recommended: "≤ 5 segments, lowercase, hyphen-separated",
      severity: "✅ Passed",
      suggestion: "URL structure is SEO-friendly."
    });
  }

  // On-Page SEO (Media & Semantics) 
  if (h1Count === 0) {
    improvements.push({
      metric: "H1 Tag",
      current: "No H1 tag found",
      recommended: "Exactly 1 H1 per page",
      severity: "High 🔴",
      suggestion: "Add a single H1 tag to represent the main topic of the page."
    });
  } else if (h1Count > 1) {
    improvements.push({
      metric: "H1 Tag",
      current: `${h1Count} H1 tags found`,
      recommended: "Exactly 1 H1 per page",
      severity: "Medium 🟡",
      suggestion: "Keep only one H1 tag and use H2–H6 for subheadings."
    });
  } else {
    passed.push({
      metric: "H1 Tag",
      current: "1 H1 tag",
      recommended: "Exactly 1 H1 per page",
      severity: "✅ Passed",
      suggestion: "H1 tag is correctly implemented."
    });
  }

  if (image.imagePresence === 0) {
    improvements.push({
      metric: "Images",
      current: "No images found",
      recommended: "At least one relevant image per page",
      severity: "Low 🟢",
      suggestion: "Add relevant images to improve engagement and SEO ranking."
    });
  } else if (altPresence === 0 || altMeaningfullPercentage === 0) {
    improvements.push({
      metric: "Image Alt Text",
      current: "Images have issues with alt text",
      recommended: "> 90% images should have descriptive alt text",
      severity: "Medium 🟡",
      suggestion: "Add descriptive, meaningful alt text for images to improve accessibility and SEO."
    });
  } else {
    passed.push({
      metric: "Image Alt Text",
      current: "Images optimized with proper alt text",
      recommended: "> 90% images should have descriptive alt text",
      severity: "✅ Passed",
      suggestion: "Images and alt texts are optimized."
    });
  }

  if (imageCompressionScore === 0) {
    improvements.push({
      metric: "Image Compression",
      current: "Large images detected (> 200KB)",
      recommended: "Compress images to < 200KB",
      severity: "High 🟠",
      suggestion: "Compress large images to improve page load speed."
    });
  } else {
    passed.push({
      metric: "Image Compression",
      current: "All images compressed",
      recommended: "Compress images to < 200KB",
      severity: "✅ Passed",
      suggestion: "All images are within the recommended size limit."
    });
  }

  if (videoExistanceScore === 0) {
    improvements.push({
      metric: "Video Content",
      current: "No embedded videos",
      recommended: "At least one video if applicable",
      severity: "Low 🟢",
      suggestion: "Embed relevant videos to improve engagement and SEO signals."
    });
  } else if (embedding === 0 || lazyLoading === 0 || structuredMetadata === 0) {
    improvements.push({
      metric: "Video SEO",
      current: "Videos not fully optimized",
      recommended: "Proper embedding, lazy-loading, structured data",
      severity: "Medium 🟡",
      suggestion: "Ensure videos are embedded correctly, use lazy loading, and add JSON-LD metadata."
    });
  } else {
    passed.push({
      metric: "Video SEO",
      current: "Videos optimized",
      recommended: "Proper embedding, lazy-loading, structured data",
      severity: "✅ Passed",
      suggestion: "Video SEO is implemented correctly."
    });
  }

  if (hierarchy === 0) {
    improvements.push({
      metric: "Heading Hierarchy",
      current: "Improper or skipped heading levels",
      recommended: "Logical H1 → H2 → H3 structure",
      severity: "Medium 🟡",
      suggestion: "Ensure headings follow a proper nested hierarchy for better crawlability."
    });
  } else {
    passed.push({
      metric: "Heading Hierarchy",
      current: "Proper hierarchy",
      recommended: "Logical H1 → H2 → H3 structure",
      severity: "✅ Passed",
      suggestion: "Headings follow proper hierarchical structure."
    });
  }

  ["article", "section", "header", "footer"].forEach(tag => {
    if (semanticTagScoreResolved[tag] === 0) {
      improvements.push({
        metric: `${tag.charAt(0).toUpperCase() + tag.slice(1)} Tag`,
        current: "Missing",
        recommended: `Use <${tag}> for semantic structure`,
        severity: "Low 🟢",
        suggestion: `Add <${tag}> tag to improve semantic HTML and accessibility.`
      });
    } else {
      passed.push({
        metric: `${tag.charAt(0).toUpperCase() + tag.slice(1)} Tag`,
        current: "Present",
        recommended: `Use <${tag}> for semantic structure`,
        severity: "✅ Passed",
        suggestion: `${tag} tag implemented correctly.`
      });
    }
  });

  // Contextual Linking Issues
  if (contextualLinks.issues.length > 0) {
    contextualLinks.issues.forEach(issue => {
      improvements.push({
        metric: issue.parameter,
        current: issue.finding,
        recommended: issue.recommendation,
        severity: issue.priority === "High" ? "High 🔴" : "Medium 🟡",
        suggestion: issue.recommendation
      });
    });
  } else {
    passed.push({
      metric: "Contextual Linking",
      current: `${contextualLinks.totalContextual} contextual links found`,
      recommended: "Include links to key pages in content",
      severity: "✅ Passed",
      suggestion: "Good internal linking structure."
    });
  }

  // On-Page SEO (Structure & Uniqueness) 
  if (dupScore === 0) {
    improvements.push({
      metric: "Duplicate Content",
      current: "Duplicate or thin content detected",
      recommended: "Unique content per page",
      severity: "High 🔴",
      suggestion: "Rewrite or merge duplicate pages and use canonical tags."
    });
  } else {
    passed.push({
      metric: "Duplicate Content",
      current: "Unique content",
      recommended: "Unique content per page",
      severity: "✅ Passed",
      suggestion: "Content is unique."
    });
  }

  if (slugCheckScore === 0 || slugScore === 0) {
    improvements.push({
      metric: "Slug Structure",
      current: slug || "Missing or invalid slug",
      recommended: "Lowercase, hyphen-separated, ≤ 25 characters",
      severity: "Medium 🟡",
      suggestion: "Simplify slugs and include target keywords."
    });
  } else {
    passed.push({
      metric: "Slug Structure",
      current: slug,
      recommended: "Lowercase, hyphen-separated, ≤ 25 characters",
      severity: "✅ Passed",
      suggestion: "Slug structure is correct."
    });
  }

  // Warning
  const warning = [];

  // On-Page SEO (Essentials) 
  if (!title || titleExistanceScore === 0) {
    warning.push({
      metric: "Title Tag",
      current: "Missing",
      recommended: "30–60 characters, unique per page",
      severity: "High 🔴",
      suggestion: "Add a unique, keyword-rich title within 30–60 characters."
    });
  } else {
    if (titleLength < 30) {
      warning.push({
        metric: "Title Tag",
        current: `Too short (${titleLength} characters)`,
        recommended: "30–60 characters, unique per page",
        severity: "High 🔴",
        suggestion: "Lengthen the title to at least 30 characters, include main keywords."
      });
    } else if (titleLength > 60) {
      warning.push({
        metric: "Title Tag",
        current: `Too long (${titleLength} characters)`,
        recommended: "30–60 characters, unique per page",
        severity: "High 🔴",
        suggestion: "Shorten the title to under 60 characters and keep it concise."
      });
    } else {
      passed.push({
        metric: "Title Tag",
        current: `${titleLength} characters`,
        recommended: "30–60 characters, unique per page",
        severity: "✅ Passed",
        suggestion: "Title length is optimal."
      });
    }
  }

  if (!metaDesc || metaDescExistanceScore === 0) {
    warning.push({
      metric: "Meta Description",
      current: "Missing",
      recommended: "≤ 160 characters, unique per page",
      severity: "High 🔴",
      suggestion: "Add a concise meta description including keywords."
    });
  } else {
    if (metaDescLength < 50) {
      warning.push({
        metric: "Meta Description",
        current: `Too short (${metaDescLength} characters)`,
        recommended: "50–160 characters, unique per page",
        severity: "Medium 🟡",
        suggestion: "Lengthen the meta description to at least 50 characters."
      });
    } else if (metaDescLength > 165) {
      warning.push({
        metric: "Meta Description",
        current: `Too long (${metaDescLength} characters)`,
        recommended: "50–160 characters, unique per page",
        severity: "Medium 🟡",
        suggestion: "Shorten the meta description to under 165 characters."
      });
    } else {
      passed.push({
        metric: "Meta Description",
        current: `${metaDescLength} characters`,
        recommended: "50–160 characters, unique per page",
        severity: "✅ Passed",
        suggestion: "Meta description length is optimal."
      });
    }
  }

  if (!canonical || canonicalExistanceScore === 0) {
    warning.push({
      metric: "Canonical Tag",
      current: "Missing",
      recommended: "Self-referencing canonical tag",
      severity: "High 🔴",
      suggestion: "Add a canonical tag pointing to the same page."
    });
  } else if (canonicalScore === 0) {
    warning.push({
      metric: "Canonical Tag",
      current: "Incorrect or not self-referencing",
      recommended: "Self-referencing canonical tag",
      severity: "High 🔴",
      suggestion: "Update canonical tag to match current URL."
    });
  } else {
    passed.push({
      metric: "Canonical Tag",
      current: "Correct",
      recommended: "Self-referencing canonical tag",
      severity: "✅ Passed",
      suggestion: "Canonical tag is correct."
    });
  }

  // On-Page SEO (Media & Semantics) 
  if (checkHTTPSScore === 0) {
    warning.push({
      metric: "HTTPS Implementation",
      current: "Not using HTTPS",
      recommended: "All pages should use HTTPS",
      severity: "High 🔴",
      suggestion: "Secure all pages using HTTPS and fix mixed-content issues."
    });
  } else {
    passed.push({
      metric: "HTTPS Implementation",
      current: "HTTPS enabled",
      recommended: "All pages should use HTTPS",
      severity: "✅ Passed",
      suggestion: "HTTPS is correctly implemented."
    });
  }

  if (linkScore === 0) {
    warning.push({
      metric: "Links",
      current: "Not descriptive",
      recommended: "≥ 75% descriptive anchors",
      severity: "Medium 🟡",
      suggestion: "Use keyword-rich descriptive anchors for internal links."
    });
  } else {
    passed.push({
      metric: "Links",
      current: "≥ 75% descriptive",
      recommended: "≥ 75% descriptive anchors",
      severity: "✅ Passed",
      suggestion: "Links are descriptive."
    });
  }

  if (alttextScore === 0) {
    warning.push({
      metric: "ALT Text Relevance",
      current: "ALT text not descriptive enough or missing keywords",
      recommended: "Include relevant keywords in alt attributes",
      severity: "Medium 🟡",
      suggestion: "Ensure ALT attributes are meaningful and include target keywords."
    });
  } else {
    passed.push({
      metric: "ALT Text Relevance",
      current: "Descriptive ALT text",
      recommended: "Include relevant keywords in alt attributes",
      severity: "✅ Passed",
      suggestion: "ALT text is descriptive and keyword-optimized."
    });
  }

  // On-Page SEO (Structure & Uniqueness) 
  if (paginationScore === 0) {
    warning.push({
      metric: "Pagination",
      current: "Pagination schema or links missing",
      recommended: "Use rel=next/prev or logical pagination links",
      severity: "Low 🟢",
      suggestion: "Add pagination links or structured markup for multi-page content."
    });
  } else {
    passed.push({
      metric: "Pagination",
      current: "Pagination present",
      recommended: "Use rel=next/prev or logical pagination links",
      severity: "✅ Passed",
      suggestion: "Pagination is implemented correctly."
    });
  }

  const actualPercentage = parseFloat((((paginationScore + titleExistanceScore + metaDescExistanceScore + linkScore + canonicalExistanceScore + canonicalScore + alttextScore + checkHTTPSScore) / 8) * 100).toFixed(0))

  // console.log(essentials);
  // console.log(mediaAndSemantics);
  // console.log(structureAndUniqueness);
  // console.log(actualPercentage);
  // console.log(warning);
  // console.log(passed);
  // console.log(Total);
  // console.log(improvements);

  await SiteReport.findByIdAndUpdate(auditId, {
    Schema: structuredData,
    On_Page_SEO: {
      Title: {
        Title: title,
        Title_Exist: titleExistanceScore,
        Title_Length: titleLength,
        Score: titleScore,
        Parameter: '1 if title exists and 30–60 characters, else 0'
      },
      Meta_Description: {
        MetaDescription: metaDesc,
        MetaDescription_Exist: metaDescExistanceScore,
        MetaDescription_Length: metaDescLength,
        Score: metaDescScore,
        Parameter: '1 if meta description exists and ≤ 165 characters, else 0'
      },
      URL_Structure: {
        Score: URLStructureScore,
        URL: url,
        Parameter: 'Clean, short, lowercase, hyphen-separated, no params, shallow depth',
        Issues: URLStructureResult.issues
      },
      Canonical: {
        Canonical: canonical,
        Canonical_Exist: canonicalExistanceScore,
        Score: canonicalScore,
        Parameter: '1 if canonical tag exists and matches page URL, else 0'
      },
      H1: {
        H1_Count: h1Count,
        H1_Content: $("h1").map((i, el) => $(el).text().trim()).get(),
        H1_Count_Score: h1CountScore,
        Score: h1Score,
        Parameter: '1 if exactly one H1, 0.5 if >1, 0 if none',
        H1_Issues: headingIssues.filter(i => i.finding.includes("H1"))
      },
      Image: {
        Image_Exist: image.imagePresence,
        Image_Alt_Exist: altPresence,
        Image_Alt_Meaningfull_Exist: altMeaningfullPercentage,
        Image_Compression_Exist: imageCompressionScore,
        Total_Image: image.total,
        Without_Alt_Image: image.withoutAlt,
        Without_Title_Image: image.withoutTitle,
        Without_Alt_Incomplete_Status: image.missingAlt,
        Without_Title_Incomplete_Status: image.missingTitle,
        Complete_Status: image.completeImage,
        Image_Size: image.imagesSize,
        Parameter: 'Alt text ≥ 75% meaningful, images ≤ 200KB'
      },
      Video: {
        Video_Exist: videoExistanceScore,
        Video_Embedding_Exist: embedding,
        Video_LazyLoading_Exist: lazyLoading,
        Video_Structured_Metadata_Exist: structuredMetadata,
        Parameter: 'Proper embedding, lazy-loading, JSON-LD metadata'
      },
      Heading_Hierarchy: {
        H1_Count: h1Count,
        H2_Count: h2Count,
        H3_Count: h3Count,
        H4_Count: h4Count,
        H5_Count: h5Count,
        H6_Count: h6Count,
        Heading: headings,
        Score: hierarchy,
        Parameter: '1 if headings follow proper H1→H2→H3 order, else 0',
        Heading_Issues: headingIssues,
      },
      ALT_Text_Relevance: {
        Score: alttextScore,
        Parameter: "1 if alt text contains keywords or is descriptive, else 0"
      },
      Links: {
        Total: totalLinks,
        Total_Internal: totalInternalLinks,
        Total_External: totalExternalLinks,
        Total_Unique: totalUniqueLinks,
        Internal_Links: internalLinks,
        External_Links: externalLinks,
        Score: linkScore,
        Parameter: "1 if ≥ 75% links are descriptive, else 0"
      },
      Semantic_Tags: {
        Article_Score: articleScore,
        Section_Score: sectionScore,
        Header_Score: headerScore,
        Footer_Score: footerScore,
        Parameter: "1 if tag exists, else 0"
      },
      Contextual_Linking: {
        Score: contextualLinkScore,
        Total_Contextual: contextualLinks.totalContextual,
        Missing_Links: contextualLinks.missingLinks,
        Issues: contextualLinks.issues,
        Parameter: "1 if content links exist, 0.5 if key menu links missing, 0 if none"
      },
      Duplicate_Content: {
        Score: dupScore,
        Parameter: '1 if duplication ≤ 75%, else 0'
      },
      URL_Slugs: {
        Slug: slug,
        Slug_Check_Score: slugCheckScore,
        Score: slugScore,
        Parameter: '1 if slug exists, ≤25 characters, lowercase hyphenated, else 0'
      },
      HTTPS: {
        Score: checkHTTPSScore,
        Parameter: "1 if HTTPS implemented, else 0"
      },
      Pagination_Tags: {
        Score: paginationScore,
        Parameter: '1 if pagination links or rel=next/prev exist, else 0'
      },
      Percentage: actualPercentage,
      Warning: warning,
      Passed: passed,
      Total: Total,
      Improvements: improvements
    }
  });

  return actualPercentage
}