import SiteReport from "../models/SiteReport.js";

const checkSlugs = (url) => {
  try {
    const u = new URL(url);
    const slug = u.pathname;

    // Root URL case
    if (slug === "/" || slug === "") {
      return evaluateParameter(1, "Root URL", { slug: "/", valid: true });
    }

    const segments = slug.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    if (!lastSegment) return evaluateParameter(1, "Root URL", { slug: "/", valid: true });

    const checks = [];
    if (lastSegment.length > 50) checks.push("Slug is too long (>50 chars)");
    if (/[A-Z]/.test(lastSegment)) checks.push("Slug contains uppercase letters");
    if (/_/.test(lastSegment)) checks.push("Slug contains underscores (use hyphens)");
    if (/[0-9]/.test(lastSegment) && segments.length > 2) checks.push("Slug contains numbers (check for dates/IDs)"); // Soft check

    const valid = checks.length === 0;
    const score = valid ? 1 : 0.5;
    const details = valid ? "URL slug is SEO friendly" : `Slug issues: ${checks.join(", ")}`;

    return evaluateParameter(score, details, {
      slug: lastSegment,
      valid,
      issues: checks,
      parameter: '1 if slug exists, ≤50 characters, lowercase hyphenated'
    });
  } catch (e) {
    return evaluateParameter(0, "Invalid URL for slug check", { error: e.message });
  }
};

const checkImages = async ($, base_url) => {
  try {
    const images = $("img").toArray();
    const total = images.length;

    if (total === 0) {
      return evaluateParameter(1, "No images found", { total: 0 });
    }

    let withAlt = 0;
    let meaningfulAlt = 0;
    let withTitle = 0;
    const missingAlt = [];
    const missingTitle = [];
    // Expanded meaningless list
    const meaningless = ["", "image", "logo", "icon", "pic", "picture", "photo", " ", "12345", "-", "graphics", "img", "undefined", "null", "spacer"];

    // 1. Metadata Checks
    images.forEach(img => {
      const el = $(img);
      const src = el.attr("src") || "";
      const alt = el.attr("alt")?.trim() || "";
      const title = el.attr("title")?.trim() || "";

      // Check Alt
      if (alt) {
        withAlt++;
        // Relaxed check: A single word excluded from 'meaningless' is okay, 
        // but 2+ words is better. Let's say >= 2 words OR a long enough single word not in discard list.
        const words = alt.split(/\s+/);
        if (!meaningless.includes(alt.toLowerCase()) && (words.length >= 2 || alt.length > 5)) {
          meaningfulAlt++;
        }
      } else {
        missingAlt.push({ src });
      }

      // Check Title
      if (title) {
        withTitle++;
      } else {
        missingTitle.push({ src });
      }
    });

    const altScore = total > 0 ? (withAlt / total) : 1;
    const meaningfulScore = total > 0 ? (meaningfulAlt / total) : 1;
    const titleScore = total > 0 ? (withTitle / total) : 1;

    // 2. Size Checks (Real Content-Length)
    const largeImages = [];
    let sizeScore = 1;

    // Filter valid srcs for checking
    const validSrcs = images
      .map(img => $(img).attr("src"))
      .filter(src => src && !src.startsWith("data:") && !src.startsWith("blob:"));

    // Limit checks to first 15 distinct images to ensure performance
    const uniqueSrcs = [...new Set(validSrcs)].slice(0, 15);

    if (uniqueSrcs.length > 0) {
      const sizePromises = uniqueSrcs.map(async (src) => {
        try {
          const fullUrl = new URL(src, base_url).href;
          const res = await fetch(fullUrl, { method: "HEAD", signal: AbortSignal.timeout(3000) }); // 3s timeout
          if (res.ok) {
            const bytes = res.headers.get("content-length");
            if (bytes) {
              const kb = parseInt(bytes) / 1024;
              if (kb > 150) { // 150KB threshold
                return { src, size: Math.round(kb) };
              }
            }
          }
          return null;
        } catch (e) {
          return null; // Ignore fetch errors
        }
      });

      const results = await Promise.all(sizePromises);
      const heavyImages = results.filter(Boolean);

      if (heavyImages.length > 0) {
        largeImages.push(...heavyImages);
        // Score penalty: -0.1 for each heavy image found in sample, max penalty 100%
        // If 5 images are heavy, score reduces by 0.5.
        const penalty = heavyImages.length * 0.1;
        sizeScore = Math.max(0, 1 - penalty);
      }
    }

    // Weighted Score: Alt (50%), Meaningful (20%), Title (10%), Size (20%)
    const weightedScore = (altScore * 0.5) + (meaningfulScore * 0.2) + (titleScore * 0.1) + (sizeScore * 0.2);
    const score = parseFloat(weightedScore.toFixed(2));

    const details = score === 1 ? "Images are fully optimized" : "Image optimization opportunities found";

    return evaluateParameter(score, details, {
      total,
      withAlt,
      meaningfulAlt,
      missingAlt: missingAlt.slice(0, 50),
      missingTitle: missingTitle.slice(0, 50),
      largeImages, // New: heavy images list
      altScore,
      meaningfulScore,
      titleScore,
      sizeScore,
      parameter: 'Weighted: 50% Alt, 20% Meaningful, 10% Title, 20% Size (<150KB)'
    });
  } catch (err) {
    return evaluateParameter(0, "Error checking images", { error: err.message });
  }
};

const checkVideos = ($) => {
  try {
    const videos = $("video, iframe[src*='youtube'], iframe[src*='vimeo']");
    const total = videos.length;

    if (total === 0) {
      return evaluateParameter(1, "No videos found", { total: 0 });
    }

    let embedding = 0;
    let lazyLoading = 0;
    let metadata = 0;

    videos.each((i, el) => {
      embedding++;
      if ($(el).attr("loading") === "lazy" || $(el).hasClass("lazy")) {
        lazyLoading++;
      }
      if ($(el).attr("itemprop") || $(el).find("[itemprop]").length > 0) {
        metadata++;
      }
    });

    const embedScore = 1;
    const lazyScore = total > 0 ? (lazyLoading / total) : 1;
    const metaScore = total > 0 ? (metadata / total) : 0;

    const score = parseFloat(((embedScore + lazyScore + metaScore) / 3).toFixed(2));
    const details = score === 1 ? "Videos are optimized" : "Video optimization needed";

    return evaluateParameter(score, details, {
      total,
      embedScore,
      lazyScore,
      metaScore,
      embeddingCount: embedding,
      lazyCount: lazyLoading,
      metaCount: metadata,
      parameter: 'Avg of Embedding, Lazy-Load, and Metadata scores'
    });

  } catch (err) {
    return evaluateParameter(0, "Error checking videos", { error: err.message });
  }
};

const checkHeadingHierarchy = ($) => {
  const headings = $("h1, h2, h3, h4, h5, h6").get();
  const counts = { h1: 0, h2: 0, h3: 0, h4: 0, h5: 0, h6: 0 };
  const issues = [];
  const headingList = [];

  headings.forEach(h => {
    const tag = h.tagName.toLowerCase();
    counts[tag]++;
    headingList.push({ tag, text: $(h).text().trim() });
  });

  // Hierarchy Logic
  // Check H1
  if (counts.h1 === 0) issues.push({ finding: "Missing H1 tag" });
  if (counts.h1 > 1) issues.push({ finding: "Multiple H1 tags found" });

  let lastLevel = 0;
  headingList.forEach(h => {
    const currentLevel = parseInt(h.tag.replace("h", ""));
    // Jump check (e.g. H2 -> H4). But H1->H2 is normal (1->2).
    // Start at 0. First heading should be H1 (1). 1 > 0+1 is false. Correct.
    if (currentLevel > lastLevel + 1 && lastLevel !== 0) {
      issues.push({ finding: `Skipped heading level: ${h.tag.toUpperCase()} follows H${lastLevel}` });
    }
    lastLevel = currentLevel;
  });

  const valid = issues.length === 0;
  const score = valid ? 1 : 0;
  const details = valid ? "Heading hierarchy is logical" : `${issues.length} hierarchy issues found`;

  return evaluateParameter(score, details, {
    counts,
    headings: headingList,
    issues,
    parameter: '1 if headings follow proper H1→H2→H3 order, else 0'
  });
};

const checkLinks = ($, url) => {
  try {
    const links = $("a").toArray();
    const total = links.length;
    let internal = 0;
    let external = 0;
    let unique = new Set();
    const internalLinksList = [];
    const externalLinksList = [];
    const genericAnchors = ["click here", "read more", "more", "details", "here"];
    let descriptiveCount = 0;

    links.forEach(link => {
      const href = $(link).attr("href");
      if (!href) return;

      unique.add(href);
      const text = $(link).text().trim().toLowerCase();
      if (text && !genericAnchors.includes(text)) descriptiveCount++;

      if (href.startsWith("/") || href.includes(url)) {
        internal++;
        internalLinksList.push(href);
      } else if (href.startsWith("http")) {
        external++;
        externalLinksList.push(href);
      }
    });

    const uniqueCount = unique.size;
    const descRatio = total > 0 ? descriptiveCount / total : 1;
    const score = descRatio > 0.75 ? 1 : 0.5;
    const details = score === 1 ? "Start links use descriptive text" : "Some links use generic text";

    return evaluateParameter(score, details, {
      total,
      internal,
      external,
      unique: uniqueCount,
      internalLinks: internalLinksList.slice(0, 50),
      externalLinks: externalLinksList.slice(0, 50),
      parameter: "1 if ≥ 75% links are descriptive, else 0"
    });
  } catch (err) {
    return evaluateParameter(0, "Error checking links", { error: err.message });
  }
};

const checkSemanticTags = async ($) => {
  try {
    const tags = ["main", "nav", "article", "section", "header", "footer"];
    const result = {};
    let totalScore = 0;

    tags.forEach(tag => {
      const exists = $(tag).length > 0 ? 1 : 0;
      result[tag] = exists;
      totalScore += exists;
    });

    let score = 0;
    // Core tags (Main, Nav, Header, Footer) are most important.
    const coreTags = result.main + result.nav + result.header + result.footer;
    if (coreTags === 4) score = 1;
    else if (coreTags >= 2) score = 0.5;
    else score = 0;

    // Or use the average calculation user liked
    const avgScore = parseFloat((totalScore / 6).toFixed(2));

    // Let's stick to the average score for granularity
    const finalScore = avgScore;
    const details = finalScore === 1 ? "Excellent use of semantic tags" : "Partial use of semantic tags";

    return evaluateParameter(finalScore, details, {
      ...result, // main: 1, nav: 0 etc
      main_score: result.main, // mapping for frontend compatibility if needed
      nav_score: result.nav,
      header_score: result.header,
      footer_score: result.footer,
      article_score: result.article,
      section_score: result.section,
      parameter: "Avg of Main, Nav, Header, Footer, Article, Section existence"
    });
  } catch (err) {
    return evaluateParameter(0, "Error checking semantic tags", { error: err.message });
  }
};

// On-Page SEO (Structure & Uniqueness) 
const checkContextualLinks = ($, url) => {
  try {
    const contentLinks = new Set();
    const menuLinks = new Set();
    const issues = [];

    // 1. Identify "Content" Area 
    // Heuristic: Look for main, article, or div with many paragraphs
    const contentArea = $("main, article, .content, #content, .post, .entry").first();
    const scope = contentArea.length > 0 ? contentArea : $("body");

    // 2. Extract Links from Content
    scope.find("a").each((i, el) => {
      const href = $(el).attr("href");
      // Filter out anchors, javascript, tel, mailto
      if (href && !href.startsWith("#") && !href.startsWith("javascript") && !href.startsWith("tel") && !href.startsWith("mailto")) {
        contentLinks.add(href);
      }
    });

    // 3. Extract Links from Navigation (Header/Footer/Nav)
    $("nav, header, footer, .menu, .nav, .sidebar").find("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href) menuLinks.add(href);
    });

    // 4. Analysis: Do content links point to important pages?
    // Simplified: Check if content links exist separate from nav links
    const totalContentLinks = contentLinks.size;
    let score = 1;

    // Check for "Orphaned" important menu items (pages in menu but never linked in content)
    // This is computationally expesive to match exact URLs, so we'll do simpler counts first.

    if (totalContentLinks === 0) {
      score = 0;
      issues.push("No contextual links found in main content area.");
    }

    // Advanced: Check if key menu items are linked in content
    const missingLinks = [];
    menuLinks.forEach(link => {
      // logic to check importance? Assume top-level nav is important.
      // Only check internal links
      if (link.startsWith("/") || link.includes(url)) {
        if (!contentLinks.has(link)) {
          missingLinks.push(link);
        }
      }
    });

    if (score === 1 && missingLinks.length > 3) {
      score = 0.5;
      issues.push(`${missingLinks.length} key menu pages are not linked contextually.`);
    }

    const details = score === 1 ? "Good contextual linking" : score === 0.5 ? "Some key links missing from content" : "No contextual links found";

    return evaluateParameter(score, details, {
      totalContextual: totalContentLinks,
      missingLinks: missingLinks.slice(0, 5), // Limit size
      issues: issues,
      parameter: "1 if content links exist, 0.5 if key menu links missing, 0 if none"
    });

  } catch (err) {
    return evaluateParameter(0, "Error checking contextual links", { error: err.message });
  }
};

// Helper to standardized return object
const evaluateParameter = (score, details, meta = {}) => {
  return {
    score,
    status: score === 1 ? "pass" : score > 0 ? "warning" : "fail",
    details,
    meta
  };
};

const checkContentQuality = ($) => {
  const text = $("body").text().replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(w => w.length > 0);
  const wordCount = words.length;

  // 1. Thin Content Check
  if (wordCount < 300) {
    return evaluateParameter(0, "Thin content (<300 words)", { wordCount, repeatedSentences: [] });
  }

  // 2. Internal Duplication
  const sentences = text.split(/[.!?]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 20);

  if (sentences.length === 0) {
    return evaluateParameter(1, "Content quality is good", { wordCount, repeatedSentences: [] });
  }

  const sentenceCounts = {};
  sentences.forEach(s => {
    sentenceCounts[s] = (sentenceCounts[s] || 0) + 1;
  });

  const repeatedSentences = Object.entries(sentenceCounts)
    .filter(([_, count]) => count > 1)
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count);

  const uniqueCount = Object.keys(sentenceCounts).length;
  const totalSentences = sentences.length;

  const repetitionRatio = 1 - (uniqueCount / totalSentences);

  if (repetitionRatio > 0.10) {
    return evaluateParameter(0.5, "High sentence repetition detected", { wordCount, repeatedSentences });
  }

  return evaluateParameter(1, "Content is unique and sufficient", { wordCount, repeatedSentences });
};

const checkURLStructure = (url) => {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    const issues = [];

    if (path.length > 1 && path === path.toUpperCase()) issues.push("URL should be lowercase");
    if (path.includes("_")) issues.push("Use hyphens instead of underscores");
    if (parsed.search) issues.push("URL contains query parameters");

    const segments = path.split('/').filter(Boolean);
    if (segments.length > 3) issues.push("URL is too deep (> 3 segments)");

    const score = Math.max(0, 1 - (issues.length * 0.2));
    const details = issues.length === 0 ? "URL structure matches best practices" : `${issues.length} issues found`;

    return evaluateParameter(parseFloat(score.toFixed(2)), details, {
      url,
      issues,
      parameter: 'Clean, short, lowercase, hyphen-separated, no params, shallow depth'
    });
  } catch (err) {
    return evaluateParameter(0, "Invalid URL format", { url, error: err.message });
  }
};

const checkTitle = ($) => {
  const title = $("title").text().trim() || "";
  const titleLength = title.length;
  let score = 0;

  if ($("title").length > 0) {
    if (titleLength >= 30 && titleLength <= 60) score = 1;
    else score = 0.5;
  }

  const details = score === 1 ? "Title tag is optimized" : "Title tag length needs improvement (30-60 chars)";
  return evaluateParameter(score, details, {
    title,
    exists: $("title").length > 0 ? 1 : 0,
    length: titleLength,
    parameter: '1 if title exists and 30–60 characters, else 0'
  });
};

const checkMetaDescription = ($) => {
  const metaDesc = $('meta[name="description"]').attr("content") || "";
  const metaDescLength = metaDesc.length;
  let score = 0;

  if ($('meta[name="description"]').length > 0) {
    if (metaDescLength >= 50 && metaDescLength <= 160) score = 1;
    else score = 0.5;
  }

  const details = score === 1 ? "Meta description is optimized" : score === 0.5 ? "Meta description length needs improvement (50-160 chars)" : "Meta description missing";
  return evaluateParameter(score, details, {
    description: metaDesc,
    length: metaDescLength,
    exists: $('meta[name="description"]').length > 0 ? 1 : 0,
    parameter: '1 if meta description exists and ≤ 165 characters, else 0'
  });
};

const checkCanonical = ($, url) => {
  const links = $('link[rel="canonical"]');
  const exists = links.length > 0 ? 1 : 0;
  const canonical = links.attr("href") || ""; // Gets first one if multiple

  let score = 0;
  let details = "Canonical tag missing";
  let isSelfReferencing = false;

  if (exists) {
    if (links.length > 1) {
      score = 0;
      details = "Multiple canonical tags found (only one allowed)";
    } else if (!canonical.trim()) {
      score = 0;
      details = "Canonical tag exists but href is empty";
    } else {
      try {
        const canonicalUrl = new URL(canonical, url);
        const currentUrl = new URL(url);

        // Helper: Get comparison string (host without www + path without trailing slash + search) using lowercase
        const getComparisonString = (uObj) => {
          const host = uObj.hostname.replace(/^www\./, '').toLowerCase();
          let path = uObj.pathname;
          if (path.length > 1 && path.endsWith('/')) {
            path = path.slice(0, -1);
          }
          return host + path + uObj.search;
        };

        const canonStr = getComparisonString(canonicalUrl);
        const currStr = getComparisonString(currentUrl);

        isSelfReferencing = canonStr === currStr;

        if (isSelfReferencing) {
          score = 1;
          details = "Self-referencing canonical tag";
        } else {
          // Check if same root domain (ignoring protocol and www)
          const canonHost = canonicalUrl.hostname.replace(/^www\./, '');
          const currHost = currentUrl.hostname.replace(/^www\./, '');

          if (canonHost === currHost) {
            score = 1;
            details = "Canonical points to another internal URL";
          } else {
            score = 0.5; // Warning check for cross-domain
            details = "Canonical points to external domain";
          }
        }
      } catch (e) {
        score = 0;
        details = "Invalid Canonical URL";
      }
    }
  }

  return evaluateParameter(score, details, {
    canonical,
    exists,
    isSelfReferencing,
    parameter: '1 if valid canonical exists'
  });
};

const checkH1 = ($) => {
  const h1Count = $("h1").length;
  const content = $("h1").map((i, el) => $(el).text().trim()).get();

  let score = 0;
  let details = "H1 tag missing";

  if (h1Count === 1) {
    score = 1;
    details = "Exactly one H1 tag found";
  } else if (h1Count > 1) {
    score = 0.5;
    details = "Multiple H1 tags found (use only one)";
  }

  return evaluateParameter(score, details, {
    count: h1Count,
    content,
    parameter: '1 if exactly one H1, 0.5 if >1, 0 if none'
  });
};

const checkHTTPS = (url) => {
  try {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === 'https:';

    return evaluateParameter(isHttps ? 1 : 0, isHttps ? "Site is served over HTTPS" : "Site is not using HTTPS", { url, isHttps });
  } catch (error) {
    return evaluateParameter(0, "Invalid URL", { error: error.message });
  }
};



export default async function seoMetrics(url, device, selectedMetric, $, auditId, page) {

  // Scrape Schema (keeping original logic)
  const structuredData = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(el => {
        try { return JSON.parse(el.innerText); } catch { return null; }
      })
      .filter(Boolean)
    return scripts
  });

  // 1. Run all checks (Standardized)
  const titleMetric = checkTitle($);
  const metaDescMetric = checkMetaDescription($);
  const urlStructureMetric = checkURLStructure(url);
  const canonicalMetric = checkCanonical($, url);
  const h1Metric = checkH1($);
  const imageMetric = await checkImages($, url);
  const videoMetric = checkVideos($);
  const hierarchyMetric = checkHeadingHierarchy($);
  const semanticMetric = await checkSemanticTags($);
  const contextualMetric = checkContextualLinks($, url);
  const linksMetric = checkLinks($, url);
  const contentQualityMetric = checkContentQuality($);
  const slugMetric = checkSlugs(url);
  const httpsMetric = checkHTTPS(url);

  // 3. Scoring Weights
  const weights = {
    Title: 10,
    Meta_Description: 8,
    URL_Structure: 6,
    Canonical: 8,
    H1: 10,
    Image: 13,
    Video: 3,
    Heading_Hierarchy: 5,
    Semantic_Tags: 3,
    Contextual_Linking: 10,
    Links: 4,
    Duplicate_Content: 8,
    URL_Slugs: 4,
    HTTPS: 8
  };

  // 4. Calculate Weighted Score
  const weightedScore =
    (titleMetric.score * weights.Title) +
    (metaDescMetric.score * weights.Meta_Description) +
    (urlStructureMetric.score * weights.URL_Structure) +
    (canonicalMetric.score * weights.Canonical) +
    (h1Metric.score * weights.H1) +
    (imageMetric.score * weights.Image) +
    (videoMetric.score * weights.Video) +
    (hierarchyMetric.score * weights.Heading_Hierarchy) +
    (semanticMetric.score * weights.Semantic_Tags) +
    (contextualMetric.score * weights.Contextual_Linking) +
    (linksMetric.score * weights.Links) +
    (contentQualityMetric.score * weights.Duplicate_Content) +
    (slugMetric.score * weights.URL_Slugs) +
    (httpsMetric.score * weights.HTTPS);

  const actualPercentage = parseFloat(weightedScore.toFixed(0));

  // 5. Save to Database
  await SiteReport.findByIdAndUpdate(auditId, {
    Schema: structuredData,
    On_Page_SEO: {
      Title: titleMetric,
      Meta_Description: metaDescMetric,
      URL_Structure: urlStructureMetric,
      Canonical: canonicalMetric,
      H1: h1Metric,
      Image: imageMetric,
      Video: videoMetric,
      Heading_Hierarchy: hierarchyMetric,
      Semantic_Tags: semanticMetric,
      Contextual_Linking: contextualMetric,
      Links: linksMetric,
      Duplicate_Content: contentQualityMetric,
      URL_Slugs: slugMetric,
      HTTPS: httpsMetric,
      Percentage: actualPercentage,
    }
  });

  return actualPercentage;
}