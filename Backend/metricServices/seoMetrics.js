import * as cheerio from "cheerio";

// Helper to standardized return object
const evaluateParameter = (score, details, meta = {}) => {
  const status = score === 1 ? "pass" : score >= 0.5 ? "warning" : "fail";
  const { why_this_occurred, how_to_fix, ...restMeta } = meta;

  return {
    score: Math.round(score * 100),
    status,
    details,
    meta: {
      ...restMeta,
      value: Math.round(score * 100) + "%"
    },
    analysis: status === "pass" ? null : {
      cause: why_this_occurred || "Issue detected with this metric.",
      recommendation: how_to_fix || "Follow SEO best practices to improve this score."
    }
  };
};

const stopWords = new Set([
  "a", "an", "the", "and", "or", "but", "is", "if", "then", "else", "when", "at", "from", "by", "for", "with", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now", "to", "of", "it", "that", "was", "as", "are", "be", "this", "which", "they", "had", "has", "have", "been", "were", "my", "your", "his", "her", "its", "our", "their", "who", "whom", "whose", "what", "these", "those", "am", "being", "do", "does", "did", "doing", "because", "until", "while", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "up", "down",
  "online", "site", "website", "page", "home", "official", "best", "top", "good", 
  "better", "great", "excellent", "services", "company", "business", "buy", "shop", 
  "order", "price", "cost", "free", "quality", "review", "reviews", "product", 
  "products", "item", "items", "welcome", "contact", "login", "signin", "register", 
  "signup", "help", "support", "faq", "faqs", "terms", "privacy", "policy", "rights", 
  "reserved", "click", "read", "view", "details", "info", "information", "get", "started", 
  "start", "now", "using", "use", "make", "made", "every", "find", "everything", "latest",
  "available", "offering", "offers", "offer", "providing", "provides", "provide", "become",
  "truly", "really", "very", "quite", "rather", "extremely", "basically", "actually","like","see","updates","filter"
]);

const cleanText = (text, includeNgrams = false) => {
  if (!text) return [];
  const rawWords = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2);

  const filteredWords = rawWords.filter(word => !stopWords.has(word) && !(/^\d+$/.test(word) && word.length !== 4));
  
  if (!includeNgrams || filteredWords.length < 2) return filteredWords;

  // Extract 2-word phrases (N-grams)
  const ngrams = [];
  for (let i = 0; i < filteredWords.length - 1; i++) {
    ngrams.push(`${filteredWords[i]} ${filteredWords[i+1]}`);
  }
  
  return [...filteredWords, ...ngrams];
};

const checkSlugs = (url, $ = null) => {
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

    let decoded = lastSegment;
    try { decoded = decodeURIComponent(lastSegment); } catch (_) {}
    const slugNoExt = decoded.replace(/\.(html?|php|aspx?|jsp|cfm)$/i, ""); // strip ext for readability
    const tokens = slugNoExt.split(/[-_]/).filter(Boolean);
    const charLength = lastSegment.length;
    const wordCount = tokens.length;
    const issues = []; // { msg, sev: 'high' | 'low' }

    // ── Length ────────────────────────────────────────────────────
    if (charLength > 75) issues.push({ msg: "Slug is very long (>75 chars)", sev: "high" });
    else if (charLength > 60) issues.push({ msg: "Slug is long (>60 chars)", sev: "low" });

    // ── Format ────────────────────────────────────────────────────
    if (/[A-Z]/.test(lastSegment)) issues.push({ msg: "Contains uppercase letters", sev: "high" });
    if (/_/.test(lastSegment)) issues.push({ msg: "Uses underscores (prefer hyphens)", sev: "high" });

    // ── Readability / keywords ────────────────────────────────────
    const lowerTokens = tokens.map(t => t.toLowerCase());
    const numericTokens = lowerTokens.filter(t => /^\d+$/.test(t) || /^[a-f0-9]{8,}$/i.test(t));
    const meaningful = lowerTokens.filter(t => t.length > 1 && !/^\d+$/.test(t) && !stopWords.has(t));
    const stopCount = lowerTokens.filter(t => stopWords.has(t)).length;

    if (meaningful.length === 0) issues.push({ msg: "No descriptive keywords in slug", sev: "high" });
    if (numericTokens.length && numericTokens.length >= lowerTokens.length / 2) issues.push({ msg: "Slug is mostly numbers/IDs", sev: "low" });
    if (wordCount > 8) issues.push({ msg: `Too many words (${wordCount}); keep it concise`, sev: "low" });
    if (wordCount >= 2 && stopCount > wordCount / 2) issues.push({ msg: "Heavy on filler/stop words", sev: "low" });

    // ── Keyword alignment with title / H1 (when $ is available) ────
    let keywordAligned = null;
    let matchedKeywords = [];
    if ($ && meaningful.length) {
      const titleText = ($("title").first().text() || "") + " " + ($("h1").first().text() || "");
      const titleTerms = new Set(cleanText(titleText));
      matchedKeywords = meaningful.filter(t => titleTerms.has(t));
      keywordAligned = matchedKeywords.length > 0;
      if (titleTerms.size > 0 && !keywordAligned) {
        issues.push({ msg: "Slug keywords don't match the page title/H1", sev: "low" });
      }
    }

    // ── Severity-tiered score ─────────────────────────────────────
    const highCount = issues.filter(i => i.sev === "high").length;
    const lowCount = issues.filter(i => i.sev === "low").length;
    let score;
    if (issues.length === 0) score = 1;
    else if (highCount === 0) score = lowCount >= 3 ? 0.5 : 0.7;
    else score = highCount >= 2 ? 0.3 : 0.5;

    const issueMsgs = issues.map(i => i.msg);
    const details = issues.length === 0
      ? `SEO-friendly slug (${wordCount} word${wordCount === 1 ? "" : "s"})`
      : `Slug issues: ${issueMsgs.join(", ")}`;

    return evaluateParameter(parseFloat(score.toFixed(2)), details, {
      slug: lastSegment,
      decoded: slugNoExt,
      valid: issues.length === 0,
      charLength,
      wordCount,
      tokens,
      meaningfulKeywords: meaningful,
      numericTokens,
      keywordAligned,
      matchedKeywords,
      issues: issueMsgs,
      why_this_occurred: issues.length
        ? `The slug has ${issues.length} issue(s): ${issueMsgs.join(", ")}.`
        : "The slug is concise, lowercase, hyphenated and keyword-rich.",
      how_to_fix: issues.length
        ? "Use a short (3-5 word) lowercase, hyphenated slug built from the page's primary keywords; avoid IDs, dates, stop-word filler, and uppercase."
        : "No changes needed.",
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
      // Spec rule 6: image-SEO doesn't apply to a page with no images, so flag
      // it N/A (present:false) to drop it from the weighted denominator rather
      // than award an undeserved 100.
      return evaluateParameter(1, "No images found", { total: 0, present: false });
    }

    let withAlt = 0;
    let meaningfulAlt = 0;
    let withTitle = 0;

    const missingAlt = [];
    const missingTitle = [];

    const brokenImages = []; // 🔥 NEW

    // Image-optimization accumulators (next-gen formats, lazy loading, file naming)
    let nextGenCount = 0;        // webp / avif
    let lazyCount = 0;           // loading="lazy"
    let responsiveCount = 0;     // srcset / sizes
    let descriptiveNameCount = 0;
    let namingDenom = 0;         // non-data images considered for naming
    const legacyExamples = [];
    const badNameExamples = [];
    const GENERIC_NAME = /^(img|image|dsc|dscn|photo|pic|picture|screenshot|untitled|download|unnamed|file|scaled|cropped|asset)[-_]?\d*$|^\d+$|^[a-f0-9]{16,}$|^[a-z0-9]{1,3}$/i;

    const meaningless = ["", "image", "logo", "icon", "pic", "picture", "photo", " ", "12345", "-", "graphics", "img", "undefined", "null", "spacer"];

    // 🔍 Metadata + Broken Image Check
    for (const img of images) {
      const el = $(img);
      const src = el.attr("src") || "";
      const alt = el.attr("alt")?.trim() || "";
      const title = el.attr("title")?.trim() || "";

      // ALT CHECK
      if (alt) {
        withAlt++;
        const words = alt.split(/\s+/);
        if (!meaningless.includes(alt.toLowerCase()) && (words.length >= 2 || alt.length > 5)) {
          meaningfulAlt++;
        }
      } else {
        missingAlt.push({ src });
      }

      // TITLE CHECK
      if (title) {
        withTitle++;
      } else {
        missingTitle.push({ src });
      }

      // FORMAT (next-gen) / LAZY / RESPONSIVE / NAMING
      const srcset = el.attr("srcset") || "";
      const fmtHay = (src + " " + srcset).toLowerCase();
      const inPicture = el.closest("picture");
      const pictureNextGen = inPicture.length > 0 &&
        inPicture.find('source[type="image/webp"], source[type="image/avif"], source[srcset*=".webp"], source[srcset*=".avif"]').length > 0;
      const isNextGen = /\.(webp|avif)(\?|#|$)/.test(fmtHay) || fmtHay.includes("format=webp") || fmtHay.includes("format=avif") || pictureNextGen;
      if (isNextGen) nextGenCount++;
      else if (/\.(jpe?g|png)(\?|#|$)/.test(fmtHay) && legacyExamples.length < 10) legacyExamples.push(src);

      if ((el.attr("loading") || "").toLowerCase() === "lazy") lazyCount++;
      if (srcset || el.attr("sizes")) responsiveCount++;

      if (src && !src.startsWith("data:") && !src.startsWith("blob:")) {
        namingDenom++;
        const fname = (src.split("?")[0].split("#")[0].split("/").pop() || "").replace(/\.[a-z0-9]+$/i, "");
        const descriptive = fname && !GENERIC_NAME.test(fname) && /[a-z]{3,}/i.test(fname);
        if (descriptive) descriptiveNameCount++;
        else if (badNameExamples.length < 10) badNameExamples.push(fname || src);
      }
    }

    const altScore = total > 0 ? (withAlt / total) : 1;
    const meaningfulScore = total > 0 ? (meaningfulAlt / total) : 1;
    const titleScore = total > 0 ? (withTitle / total) : 1;
    const nextGenScore = total > 0 ? (nextGenCount / total) : 1;
    // Lazy loading: don't penalise pages with only a few (above-the-fold) images.
    const lazyScore = total <= 4 ? 1 : (lazyCount / total);
    const namingScore = namingDenom > 0 ? (descriptiveNameCount / namingDenom) : 1;
    const responsiveScore = total > 0 ? (responsiveCount / total) : 1;

    // 🔍 SIZE CHECK
    const largeImages = [];
    let sizeScore = 1;

    const validSrcs = images
      .map(img => $(img).attr("src"))
      .filter(src => src && !src.startsWith("data:") && !src.startsWith("blob:"));

    const uniqueSrcs = [...new Set(validSrcs)].slice(0, 15);

    if (uniqueSrcs.length > 0) {
      const sizePromises = uniqueSrcs.map(async (src) => {
        try {
          const fullUrl = new URL(src, base_url).href;
          // ⚡ Supply an explicit User-Agent to bypass standard CDN/Proxy Bot-blockers returning fake 403s
          const res = await fetch(fullUrl, { 
            method: "HEAD", 
            headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
            signal: AbortSignal.timeout(4000) 
          });
          
          const contentType = res.headers.get("content-type");
          if (!res.ok || !contentType || !contentType.startsWith("image/")) {
             let errorMsg = "Broken";
             if (res.status === 403 || res.status === 401) {
               errorMsg = "Permission Denied";
             } else if (!res.ok) {
               errorMsg = `HTTP ${res.status}`;
             } else if (!contentType) {
               errorMsg = "No Content-Type";
             } else {
               errorMsg = "Not Image Type";
             }
             return { action: "broken", src: fullUrl, error: errorMsg };
          }

          const bytes = res.headers.get("content-length");
          if (bytes) {
            const kb = parseInt(bytes) / 1024;
            if (kb > 150) {
              return { action: "heavy", src, size: Math.round(kb) };
            }
          }
          return null;
        } catch (e) {
          return { action: "broken", src, error: "Network Error/Timeout" };
        }
      });

      const results = await Promise.all(sizePromises);
      
      const heavyImages = results.filter(r => r && r.action === "heavy");
      const brokenList = results.filter(r => r && r.action === "broken");

      brokenImages.push(...brokenList.map(r => ({ src: r.src, error: r.error })));

      if (heavyImages.length > 0) {
        largeImages.push(...heavyImages.map(r => ({ src: r.src, size: r.size })));
        const penalty = heavyImages.length * 0.1;
        sizeScore = Math.max(0, 1 - penalty);
      }
    }

    // 🎯 SCORE
    const weightedScore =
      (altScore * 0.35) +
      (meaningfulScore * 0.13) +
      (titleScore * 0.05) +
      (sizeScore * 0.15) +
      (nextGenScore * 0.12) +
      (lazyScore * 0.10) +
      (namingScore * 0.10);

    let score = parseFloat(weightedScore.toFixed(2));
    if (score < 1 && score < 0.5) score = 0.5;

    let details = "Images are fully optimized";

    if (brokenImages.length > 0) {
      score = 0.5; // ⚠️ WARNING override
      details = "Broken images found";
    } else if (score < 1) {
      details = "Image optimization opportunities found";
    }

    // 🧠 Explanation
    let explanation = "";
    let recommendation = "";

    const issues = [];

    if (withAlt < total) issues.push(`${total - withAlt} images missing Alt text`);
    if (meaningfulAlt < total) issues.push(`${total - meaningfulAlt} weak Alt text`);
    if (largeImages.length > 0) issues.push(`${largeImages.length} large images (>150KB)`);
    if (brokenImages.length > 0) issues.push(`${brokenImages.length} broken images`);
    if (nextGenCount < total) issues.push(`${total - nextGenCount} images not next-gen (WebP/AVIF)`);
    if (total > 4 && lazyCount < total - 2) issues.push(`${total - lazyCount} images not lazy-loaded`);
    if (descriptiveNameCount < namingDenom) issues.push(`${namingDenom - descriptiveNameCount} non-descriptive file names`);

    if (issues.length > 0) {
      explanation = `Issues found: ${issues.join(", ")}.`;
      recommendation = "Fix broken images, add descriptive Alt text, serve WebP/AVIF, lazy-load below-the-fold images, use keyword-rich file names, and compress large images.";
    } else {
      explanation = "All images are optimized and accessible.";
      recommendation = "Maintain this optimization.";
    }

    return evaluateParameter(score, details, {
      total,
      withAlt,
      meaningfulAlt,
      withTitle,
      missingAlt: missingAlt.slice(0, 50),
      missingTitle: missingTitle.slice(0, 50),
      largeImages,
      broken_images_count: brokenImages.length, // 🔥 NEW
      broken_images: brokenImages, // 🔥 NEW
      nextGenCount,
      nextGenPct: total > 0 ? Math.round((nextGenCount / total) * 100) : 100,
      lazyCount,
      lazyPct: total > 0 ? Math.round((lazyCount / total) * 100) : 100,
      responsiveCount,
      descriptiveNameCount,
      namingDenom,
      namingPct: namingDenom > 0 ? Math.round((descriptiveNameCount / namingDenom) * 100) : 100,
      legacyExamples,
      badNameExamples,
      why_this_occurred: explanation,
      how_to_fix: recommendation
    });

  } catch (err) {
    return evaluateParameter(0, "Error checking images", {
      error: err.message
    });
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

  let score = 1;
  if (counts.h1 > 1) score = 0.5; // WARNING
  if (counts.h1 === 0 && headings.length === 0) score = 0; // High Severity
  else if (issues.length > 0) score = 0.5; // WARNING
  const details = score === 1 ? "Proper hierarchy" : (score === 0 ? "No headings at all" : "Heading hierarchy issues found");

  return evaluateParameter(score, details, {
    counts,
    headings: headingList,
    issues,
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

    const genericAnchors = [
      "click here",
      "click me",
      "read more",
      "more",
      "details",
      "here",
      "learn more",
      "view more"
    ];

    let descriptiveCount = 0;
    let badLinks = [];

    let baseHostname;
    try {
      baseHostname = new URL(url).hostname;
    } catch (e) {
      baseHostname = "";
    }

    links.forEach(link => {
      const href = $(link).attr("href");
      if (!href) return;

      unique.add(href);

      const originalText = $(link).text().trim();
      const lowerText = originalText.toLowerCase();

      // 🔥 Generic anchor detection
      if (lowerText) {
        const isGeneric = genericAnchors.some(g => lowerText === g);

        if (isGeneric) {
          badLinks.push({ text: originalText, href });
        } else {
          descriptiveCount++;
        }
      }

      const target = ($(link).attr("target") || "_self").trim();

      try {
        const resolvedUrl = new URL(href, url);

        if (resolvedUrl.protocol === "http:" || resolvedUrl.protocol === "https:") {
          const linkHostname = resolvedUrl.hostname.replace(/^www\./, '');
          const baseHost = baseHostname.replace(/^www\./, '');

          if (linkHostname === baseHost) {
            internal++;
            internalLinksList.push({ href, text: originalText || "[No Text]", target });
          } else {
            external++;
            externalLinksList.push({ href, text: originalText || "[No Text]", target });
          }
        }
      } catch (e) {
        // ignore invalid URLs
      }
    });

    const uniqueCount = unique.size;

    // 🔥 Ratio calculation
    const descRatio = total > 0 ? descriptiveCount / total : 1;

    let score = 1;
    let details = "Good link profile";

    if (badLinks.length > 0 || descRatio < 0.75) {
      score = 0.5; // ⚠️ WARNING
      details = "Generic anchor text found";
    }

    let explanation = "";
    let recommendation = "";
    const issueList = [];

    // 🔍 Issues
    if (badLinks.length > 0) {
      issueList.push(`${badLinks.length} links use generic text (e.g., "click here")`);
    }

    if (internal === 0 && total > 0) {
      issueList.push("No internal links found (orphan page risk)");
    }

    if (total === 0) {
      explanation = "No links found on this page.";
      recommendation = "Add internal and external links for better SEO.";
    } 
    else if (issueList.length > 0) {
      explanation = `Link profile issues detected: ${issueList.join(", ")}.`;
      recommendation = "Replace generic anchor text with descriptive keywords and maintain a balanced link structure.";
    } 
    else {
      explanation = "The page has a strong link profile with descriptive anchor text.";
      recommendation = "Maintain descriptive links and proper internal linking.";
    }

    return evaluateParameter(score, details, {
      total,
      internal,
      external,
      unique: uniqueCount,
      bad_links_count: badLinks.length,
      bad_links: badLinks,
      internalLinks: internalLinksList,
      externalLinks: externalLinksList,
      why_this_occurred: explanation,
      how_to_fix: recommendation
    });

  } catch (err) {
    return evaluateParameter(0, "Error checking links", {
      error: err.message
    });
  }
};


const checkSemanticTags = async ($) => {
  try {
    const tags = ["main", "nav", "article", "section", "header", "footer", "aside"];
    const result = {};
    const foundTags = [];
    const missingTags = [];
    const potentialReplacements = [];

    tags.forEach(tag => {
      const count = $(tag).length;
      result[tag] = count;
      if (count > 0) foundTags.push(tag);
      else {
        missingTags.push(tag);
        const heuristicSelector = `div[class*="${tag}"], div[id*="${tag}"], section[class*="${tag}"], article[class*="${tag}"]`;
        if ($(heuristicSelector).length > 0) potentialReplacements.push(tag);
      }
    });

    const mainCount = result["main"];

    // ARIA landmark fallback for missing native tags
    const ariaLandmarks = {
      main: $('[role="main"]').length,
      navigation: $('[role="navigation"]').length,
      banner: $('[role="banner"]').length,           // header
      contentinfo: $('[role="contentinfo"]').length, // footer
    };
    const hasMain = mainCount === 1 || (mainCount === 0 && ariaLandmarks.main > 0);
    const hasHeader = result["header"] > 0 || ariaLandmarks.banner > 0;
    const hasNav = result["nav"] > 0 || ariaLandmarks.navigation > 0;
    const hasFooter = result["footer"] > 0 || ariaLandmarks.contentinfo > 0;

    // Sectioning content (section/article) should each carry a heading.
    const sectioning = $("section, article").toArray();
    let sectioningWithHeadings = 0;
    const sectionsWithoutHeadings = [];
    sectioning.forEach(el => {
      const $el = $(el);
      const labelled = $el.find("h1,h2,h3,h4,h5,h6,[role='heading']").length > 0 || $el.attr("aria-label") || $el.attr("aria-labelledby");
      if (labelled) sectioningWithHeadings++;
      else if (sectionsWithoutHeadings.length < 10) {
        const cls = ($el.attr("class") || "").split(/\s+/).slice(0, 2).filter(Boolean).join(".");
        sectionsWithoutHeadings.push(`${el.name}${cls ? "." + cls : ""}`);
      }
    });
    const sectioningCount = sectioning.length;

    // Div-soup ratio: semantic block elements vs <div>.
    const semanticCount = $("main,nav,article,section,header,footer,aside,figure,figcaption,details,summary").length;
    const divCount = $("div").length;
    const semanticRatio = (semanticCount + divCount) > 0 ? semanticCount / (semanticCount + divCount) : 1;

    // ── Composite score ───────────────────────────────────────────
    let raw = 0;
    const issues = [];
    if (mainCount === 1) raw += 0.25;
    else if (hasMain) { raw += 0.15; issues.push(mainCount > 1 ? "Multiple <main> elements" : "<main> via ARIA role only"); }
    else issues.push("No <main> landmark");
    if (hasHeader) raw += 0.10; else issues.push("No <header>/banner");
    if (hasNav) raw += 0.10; else issues.push("No <nav>");
    if (hasFooter) raw += 0.10; else issues.push("No <footer>/contentinfo");
    if (result["article"] > 0 || result["section"] > 0) raw += 0.10;
    else issues.push("No <section>/<article> sectioning content");
    if (sectioningCount === 0) raw += 0.20; // nothing to fault
    else {
      const r = sectioningWithHeadings / sectioningCount;
      raw += 0.20 * r;
      if (r < 0.7) issues.push(`${sectioningCount - sectioningWithHeadings}/${sectioningCount} sections lack a heading`);
    }
    raw += 0.15 * Math.min(1, semanticRatio / 0.25); // ~25%+ semantic is healthy
    if (semanticRatio < 0.1) issues.push("Heavily div-based markup (low semantic ratio)");

    raw = Math.max(0, Math.min(1, raw));
    // Snap strong structures to a clean pass (evaluateParameter passes only at exactly 1).
    const score = raw >= 0.9 ? 1 : parseFloat(raw.toFixed(2));

    const details = score === 1
      ? "Strong semantic structure"
      : (score >= 0.5 ? `Semantic structure could improve: ${issues.slice(0, 3).join(", ")}` : `Weak semantic structure: ${issues.slice(0, 3).join(", ")}`);

    return evaluateParameter(score, details, {
      ...result,
      found: foundTags,
      missing: missingTags,
      potentialReplacements,
      ariaLandmarks,
      sectioningCount,
      sectioningWithHeadings,
      sectionsWithoutHeadings,
      semanticCount,
      divCount,
      semanticRatio: parseFloat(semanticRatio.toFixed(2)),
      semanticScore: parseFloat(raw.toFixed(2)),
      issues,
      why_this_occurred: issues.length ? `Semantic issues: ${issues.join(", ")}.` : "All major semantic landmarks and sectioning are properly used.",
      how_to_fix: issues.length
        ? "Use a single <main> plus <header>/<nav>/<footer>; wrap content in <section>/<article> each with a heading; replace generic <div>s with semantic elements."
        : "Maintain this structure.",
    });
  } catch (err) {
    return evaluateParameter(0, "Error checking semantic tags", { error: err.message });
  }
};

const isTextRelatedToUrl = (text, href) => {
  if (!text || !href) return false;
  const t = text.toLowerCase().trim();
  const h = href.toLowerCase();

  // 1. Direct Synonyms / Intents (e.g. Sign in -> /login)
  const intentMap = {
  // --- AUTHENTICATION ---
  "sign in": ["login", "signin", "log-in", "sign-in", "auth", "portal-login", "client-login", "secure-access", "start-session", "account-access", "gateway", "verify-identity"],
  "sign up": ["register", "signup", "sign-up", "join", "enroll", "create-account", "get-started", "onboarding", "become-a-member", "trial-signup", "free-trial", "open-account"],
  "logout": ["logout", "signout", "sign-out", "log-out", "exit", "end-session", "terminate-session", "disconnect"],
  "password management": ["forgot-password", "reset-password", "recover-account", "password-recovery", "change-password", "update-credentials"],

  // --- IDENTITY & REPUTATION ---
  "about": ["about", "about-us", "our-story", "who-we-are", "company", "mission", "vision", "values", "culture", "background", "history", "heritage", "company-profile", "biography"],
  "team": ["team", "leadership", "our-people", "executive-team", "management", "board-members", "staff", "meet-the-team", "employees", "founders", "faculty"],
  "careers": ["careers", "jobs", "hiring", "work-with-us", "opportunities", "openings", "join-the-team", "internships", "vacancies", "employment", "recruitment"],
  "press": ["press", "media", "newsroom", "press-kit", "media-kit", "brand-assets", "news", "announcements", "public-relations", "press-releases", "coverage"],

  // --- CUSTOMER CONVERSION ---
  "contact": ["contact", "contact-us", "get-in-touch", "reach-out", "contact-me", "write-to-us", "enquiry", "sales-inquiry", "business-contact", "ask-a-question", "request-info", "inbound"],
  "pricing": ["pricing", "plans", "subscription", "cost", "rates", "fees", "billing", "compare-plans", "tiers", "enterprise-pricing", "calculator", "estimates", "price-list"],
  "quote": ["get-quote", "estimate", "quotation", "purchase", "buy", "order-now", "request-quote", "book-demo", "schedule-call"],
  "services": ["services", "our-services", "what-we-do", "solutions", "features", "capabilities", "expertise", "specializations", "offerings", "platform", "infrastructure"],

  // --- E-COMMERCE & ACCOUNT ---
  "ecommerce": ["cart", "bag", "basket", "checkout", "shop", "store", "marketplace", "catalog", "collections", "wishlist", "shopping-cart", "pay-online"],
  "profile": ["profile", "account", "dashboard", "my-account", "settings", "preferences", "me", "user-profile", "personal-info", "security-settings", "manage-account"],
  "orders": ["orders", "my-orders", "purchase-history", "track-order", "shipments", "receipts", "invoices", "downloads", "my-digital-assets"],

  // --- SUPPORT & RESOURCES ---
  "support": ["help", "support", "help-center", "customer-care", "service-desk", "ticketing", "knowledge-base", "faq", "faqs", "troubleshooting", "how-to", "tutorial-center"],
  "resources": ["resources", "whitepapers", "ebooks", "guides", "tutorials", "webinars", "case-studies", "documentation", "learning-center", "academy", "training"],
  "developer": ["docs", "api", "api-docs", "developers", "dev-portal", "documentation", "sdk", "integrations", "changelog", "github-repo", "sandbox"],
  "blog": ["blog", "news", "articles", "insights", "magazine", "updates", "editorial", "posts", "latest", "newsletter", "stories"],

  // --- SOCIAL PROOF ---
  "social proof": ["testimonials", "reviews", "customer-reviews", "ratings", "success-stories", "portfolio", "our-work", "projects", "partners", "clients", "affiliates", "sponsors", "certifications", "awards"],

  // --- LEGAL & COMPLIANCE ---
  "legal": ["privacy", "privacy-policy", "terms", "terms-of-service", "tos", "terms-and-conditions", "t-and-c", "legal", "disclaimer", "cookie-policy", "gdpr", "compliance", "data-protection"],
  "security": ["security", "trust-center", "vulnerability", "responsible-disclosure", "security-policy", "encryption", "system-status", "uptime"],
  "refunds": ["refund-policy", "return-policy", "shipping-policy", "delivery-info", "cancellation-policy"],

  // --- PHYSICAL LOCATION ---
  "location": ["location", "find-us", "map", "offices", "headquarters", "branches", "store-locator", "directions", "contact-details", "reach-us-at"]
};

  if (intentMap[t]) {
    if (intentMap[t].some(keyword => h.includes(keyword))) return true;
  }

  // 2. Slug match (e.g. "About" in /about-us)
  const slug = h.split('/').filter(Boolean).pop() || "";
  if (t.length > 3 && (slug.includes(t) || t.includes(slug))) return true;

  // 3. TLD/Country logic (Australia -> .au)
  const countryTLDs = {
  ".au": ["australia", "oz", "aus", "down-under"],
  ".uk": ["uk", "united-kingdom", "britain", "gb", "great-britain", "england"],
  ".in": ["india", "bharat", "ind"],
  ".ca": ["canada", "can"],
  ".us": ["usa", "united-states", "america", "states"],
  ".de": ["germany", "deutschland", "de"],
  ".fr": ["france", "fr"],
  ".jp": ["japan", "nippon", "jp"],
  ".cn": ["china", "prc"],
  ".br": ["brazil", "brasil"],
  ".mx": ["mexico", "mx"],
  ".ru": ["russia", "rf"],
  ".za": ["south-africa", "sa"],
  ".ae": ["uae", "emirates", "dubai"],
  ".sg": ["singapore", "sg"],
  ".nz": ["new-zealand", "nz", "kiwi"],
  ".es": ["spain", "espana", "es"],
  ".it": ["italy", "italia", "it"],
  ".nl": ["netherlands", "holland", "nl"],
  ".se": ["sweden", "sverige"],
  ".no": ["norway", "norge"],
  ".fi": ["finland", "suomi"],
  ".dk": ["denmark", "danmark"],
  ".ch": ["switzerland", "swiss"],
  ".at": ["austria", "osterreich"],
  ".be": ["belgium", "belgie"],
  ".ie": ["ireland", "eire"],
  ".my": ["malaysia", "my"],
  ".th": ["thailand", "thai"],
  ".vn": ["vietnam", "vn"],
  ".id": ["indonesia", "id"],
  ".pk": ["pakistan", "pk"],
  ".bd": ["bangladesh", "bd"],
  ".sa": ["saudi-arabia", "ksa"],
  ".tr": ["turkey", "turkiye"],
  ".eg": ["egypt", "eg"],
  ".ng": ["nigeria", "ng"],
  ".ar": ["argentina", "arg"],
  ".cl": ["chile", "cl"]
};

  for (const [ext, names] of Object.entries(countryTLDs)) {
    if (h.includes(ext) && names.some(name => t.includes(name))) return true;
  }

  return false;
};

const checkContextualLinks = async ($, url) => {
  try {
    const contentLinks = new Set();
    const contentLinkText = new Map(); // href -> anchor text (for semantic relatedness)
    const menuLinks = new Set();
    const issues = [];

    // 🔍 Identify Content Area
    const contentArea = $("main, article, .content, #content, .post, .entry").first();
    const scope = contentArea.length > 0 ? contentArea : $("body");

    // 🔗 Extract Contextual Links
    scope.find("a").each((i, el) => {
      const $el = $(el);
      const href = $el.attr("href");

      if (!href) return;

      if (
        href.startsWith("#") ||
        href.startsWith("javascript") ||
        href.startsWith("tel") ||
        href.startsWith("mailto")
      ) return;

      const isNav = $el.closest("nav, header, footer, .navbar, .menu, .sidebar, .nav").length > 0;
      const text = $el.text().trim();

      if (isNav) {
        // Nav links: only include if text is semantically related to the URL
        if (isTextRelatedToUrl(text, href)) {
          contentLinks.add(href);
          if (!contentLinkText.has(href)) contentLinkText.set(href, text);
        }
        return;
      }

      // Non-nav (content area) links:
      // Include if → has no visible text (icon/image anchor) OR text is related to the URL
      if (!text || isTextRelatedToUrl(text, href)) {
        contentLinks.add(href);
        if (!contentLinkText.has(href)) contentLinkText.set(href, text);
      }
    });

    // 🔗 Extract Menu Links
    $("nav, header, footer, .menu, .nav, .sidebar").find("a").each((i, el) => {
      const href = $(el).attr("href");
      if (href) menuLinks.add(href);
    });

    const totalContextual = contentLinks.size;
    const totalMenu = menuLinks.size;

    // 🎯 Ratio
    const ratio = (totalContextual + totalMenu) > 0
      ? totalContextual / (totalContextual + totalMenu)
      : 1;

    let score = 1;

    // ⚠️ Base checks
    if (totalContextual === 0) {
      score = 0.5;
      issues.push("No contextual links found in main content.");
    } else if (totalContextual > 100) {
      score = 0.5;
      issues.push("Too many contextual links (spam risk).");
    } else if (ratio < 0.3) {
      score = 0.5;
      issues.push("Low contextual linking ratio.");
    }

    // 🔍 Missing important links
    const missingLinks = [];
    const ignoredPatterns = [];

    menuLinks.forEach(link => {
      if (link.startsWith("/") || link.includes(url)) {
        if (!contentLinks.has(link)) {
          const lower = link.toLowerCase();
          if (!ignoredPatterns.some(p => lower.includes(p))) {
            missingLinks.push(link);
          }
        }
      }
    });

    if (score === 1 && missingLinks.length > 5) {
      score = 0.5;
      issues.push("Important pages not linked contextually.");
    }

   // 🔥 BROKEN LINK CHECK (IMPROVED)
const brokenLinks = [];
const headers = { "User-Agent": "Mozilla/5.0" };

const maxChecks = 150;
const linksToCheck = Array.from(contentLinks).slice(0, maxChecks);

// 🚀 Parallel requests (faster + accurate)
const requests = linksToCheck.map(async (href) => {
  try {
    if (href.toLowerCase().includes("inventory")) {
      return null; // Skip check, treat as valid
    }

    const fullUrl = new URL(href, url).href;

    if (fullUrl.toLowerCase().includes("inventory")) {
      return null; // Skip check, treat as valid
    }

    const res = await fetch(fullUrl, {
      method: "GET", // ✅ real page load
      headers,
      signal: AbortSignal.timeout(6000) // ⏳ wait properly
    });

    if (!res.ok) {
      return {
        url: fullUrl,
        status: res.status
      };
    }

    return null;

  } catch (e) {
    return {
      url: href,
      error: "Request failed / timeout"
    };
  }
});

// ⏳ wait for all links to load
const results = await Promise.all(requests);

// collect broken links
results.forEach(r => {
  if (r) brokenLinks.push(r);
});

// ⚠️ scoring impact
if (brokenLinks.length > 0) {
  score = 0.5;
  issues.push(`${brokenLinks.length} broken contextual links found.`);
}

// 🧠 Semantic relatedness — are the in-content links topically related to THIS page?
const topicTerms = new Set();
const titleTxt = $("title").first().text() || "";
const h1Txt = $("h1").first().text() || "";
const headTxt = $("h2, h3").map((i, el) => $(el).text()).get().join(" ");
[titleTxt, h1Txt, headTxt].forEach(t => cleanText(t).forEach(w => topicTerms.add(w)));
// Add the most frequent body terms so a single generic heading doesn't dominate the topic.
const _freq = {};
cleanText((scope.text() || "").slice(0, 1500)).forEach(w => { _freq[w] = (_freq[w] || 0) + 1; });
Object.entries(_freq).sort((a, b) => b[1] - a[1]).slice(0, 15).forEach(([w]) => topicTerms.add(w));

const relatedExamples = [];
const unrelatedExamples = [];
let relatedCount = 0;
const uniqueLinks = Array.from(contentLinks);
uniqueLinks.forEach(href => {
  const anchor = contentLinkText.get(href) || "";
  let slug = "";
  try { slug = new URL(href, url).pathname.replace(/[-_/]+/g, " "); } catch (_) { slug = String(href).replace(/[-_/]+/g, " "); }
  const linkTerms = new Set([...cleanText(anchor), ...cleanText(slug)]);
  const shared = [...linkTerms].filter(t => topicTerms.has(t));
  if (shared.length > 0) {
    relatedCount++;
    if (relatedExamples.length < 8) relatedExamples.push({ href, anchor: anchor.slice(0, 40), shared: shared.slice(0, 4) });
  } else if (unrelatedExamples.length < 8) {
    unrelatedExamples.push({ href, anchor: anchor.slice(0, 40) });
  }
});
const relatedRatio = uniqueLinks.length > 0 ? relatedCount / uniqueLinks.length : 1;

// Only judge relatedness when there are enough links for it to be meaningful.
if (uniqueLinks.length >= 5 && relatedRatio < 0.3) {
  if (score === 1) score = 0.5;
  issues.push(`Only ${Math.round(relatedRatio * 100)}% of in-content links are topically related to this page.`);
}

const details = score === 1
  ? "Good contextual linking"
  : "Contextual linking issues found";

// 🧠 Explanation
let explanation = "";
let recommendation = "";

if (totalContextual === 0) {
  explanation = "No links found inside the main content area.";
  recommendation = "Add internal links within content.";
} 
else if (brokenLinks.length > 0) {
  explanation = `Found ${brokenLinks.length} broken links inside content.`;
  recommendation = "Fix or replace broken links to improve SEO and UX.";
}
else if (ratio < 0.3) {
  explanation = "Most links are in navigation instead of content.";
  recommendation = "Increase contextual linking.";
}
else if (uniqueLinks.length >= 5 && relatedRatio < 0.3) {
  explanation = "Most in-content links point to topically unrelated pages.";
  recommendation = "Link to pages that share this page's topic (e.g. related models, services, or guides) to build topical clusters.";
}
else if (missingLinks.length > 0) {
  explanation = "Important pages are not linked within content.";
  recommendation = "Link key pages inside content.";
}
else {
  explanation = "Links are well distributed inside content.";
  recommendation = "Maintain contextual linking strategy.";
}
    return evaluateParameter(score, details, {
      totalContextual,
      totalMenu,
      contextual_ratio: ratio.toFixed(2),
      related_ratio: relatedRatio.toFixed(2),
      related_count: relatedCount,
      related_examples: relatedExamples,
      unrelated_examples: unrelatedExamples,
      topic_terms: Array.from(topicTerms).slice(0, 20),
      foundLinks: Array.from(contentLinks).slice(0, 50),
      missingLinks: missingLinks.slice(0, 20),
      broken_links_count: brokenLinks.length, // 🔥 NEW
      broken_links: brokenLinks, // 🔥 NEW
      issues,
      why_this_occurred: explanation,
      how_to_fix: recommendation
    });

  } catch (err) {
    return evaluateParameter(0, "Error checking contextual links", {
      error: err.message
    });
  }
};



const checkContentRelevance = ($, title, metaDesc) => {
  try {
    const $body = $("body").clone();
    
    // For relevance, we check all visible text (including header/nav where branding often lives)
    // but we still remove non-visible/technical tags
    $body.find("script, style, noscript, template, svg, img, video, iframe, link, meta, [hidden], [aria-hidden='true']").remove();
    const visibleText = $body.text().replace(/\s+/g, " ").trim();
    
    const stem = (word) => {
      if (!word || word.length <= 3) return word;
      if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
      if (word.endsWith('es')) return word.slice(0, -2);
      if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
      return word;
    };

    const titleKws = cleanText(title, false);
    const metaKws = cleanText(metaDesc, false).filter(kw => !titleKws.includes(kw));
    const allTargetKeywords = [...new Set([...titleKws, ...metaKws])];
    const N = allTargetKeywords.length;

    if (N === 0) {
      return { score: "LOW", percentage: 0, matchedKeywords: [], missingKeywords: [], reason: "No significant keywords found.", status: "fail" };
    }

    const contentTextClean = visibleText.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    const contentWordsRaw = contentTextClean.split(/\s+/).filter(w => w.length > 2);
    
    const contentInventory = new Set(contentWordsRaw);
    const stemmedInventory = new Set(contentWordsRaw.map(w => stem(w)));
    
    // Add phrases
    for (let i = 0; i < contentWordsRaw.length - 1; i++) {
      const phrase = `${contentWordsRaw[i]} ${contentWordsRaw[i+1]}`;
      contentInventory.add(phrase);
      stemmedInventory.add(`${stem(contentWordsRaw[i])} ${stem(contentWordsRaw[i+1])}`);
    }

    // Advanced match for brands/compound words (like CarDekho matching "Car Dekho")
    const matchedKws = allTargetKeywords.filter(kw => {
      if (contentInventory.has(kw)) return true;
      
      const stemmedKw = kw.includes(" ") ? kw.split(" ").map(w => stem(w)).join(" ") : stem(kw);
      if (stemmedInventory.has(stemmedKw)) return true;
      
      // Compound check: If keyword is "cardekho" and content has "car" and "dekho" adjacent
      // (This is already handled by phrases if they are adjacent)
      
      // Partial check for brand names (Keyword exists as a substring of a content word)
      // or a content word exists as a substantial substring of a keyword
      if (kw.length >= 5) {
        for (let word of contentWordsRaw) {
          if (word.length >= 5 && (word.includes(kw) || kw.includes(word))) return true;
        }
      }
      
      return false;
    });
    
    const M = matchedKws.length;
    const P = Math.round((M / N) * 100);
    const missingKws = allTargetKeywords.filter(kw => !matchedKws.includes(kw));
    const X = missingKws.length;

    // Quality penalties (Stuffing/Repetition) - Use stricter body-only text for this
    const $mainOnly = $("body").clone();
    $mainOnly.find("script, style, noscript, template, svg, img, video, iframe, link, meta, [hidden], [aria-hidden='true'], header, footer, nav").remove();
    const mainText = $mainOnly.text().trim();
    const mainWords = cleanText(mainText, false);
    
    const keywordFrequency = {};
    mainWords.forEach(word => {
      keywordFrequency[word] = (keywordFrequency[word] || 0) + 1;
    });
    
    const totalWords = mainWords.length || 1;
    let stuffingPenalty = 0;
    Object.keys(keywordFrequency).forEach(kw => {
      if ((keywordFrequency[kw] / totalWords) * 100 > 7) stuffingPenalty += 10;
    });

    let finalScore = P - stuffingPenalty;
    finalScore = Math.max(0, Math.min(100, finalScore));

    let scoreLabel = "LOW";
    let status = "fail";
    if (finalScore >= 75) { scoreLabel = "HIGH"; status = "pass"; }
    else if (finalScore >= 40) { scoreLabel = "MEDIUM"; status = "warning"; }

    return {
      score: scoreLabel,
      percentage: P,
      matchedKeywords: matchedKws,
      missingKeywords: missingKws,
      reason: P === 100 ? "Perfect match! Your content perfectly reflects your metadata." : `Match Status: ${P}% Match (${M}/${N}).`,
      status,
      details: `Topic Alignment: ${M}/${N} keywords found.`
    };
  } catch (err) {
    return { score: "LOW", percentage: 0, matchedKeywords: [], missingKeywords: [], reason: "Calculation error", status: "fail" };
  }
};

const checkURLStructure = (url) => {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    const fullLen = url.length;
    const segments = path.split('/').filter(Boolean);
    const depth = segments.length;
    const issues = []; // { msg, sev: 'high' | 'low' }

    // ── Format checks ─────────────────────────────────────────────
    if (path.length > 1 && path !== path.toLowerCase()) issues.push({ msg: "Contains uppercase letters", sev: "high" });
    if (path.includes("_")) issues.push({ msg: "Uses underscores (prefer hyphens)", sev: "high" });
    if (parsed.search) issues.push({ msg: "Has query parameters", sev: "high" });
    if (/%20|\s/.test(path)) issues.push({ msg: "Contains spaces / %20", sev: "high" });
    let decodedPath = path;
    try { decodedPath = decodeURIComponent(path); } catch (_) {}
    if (/[^a-z0-9\-\/._~%]/i.test(decodedPath)) issues.push({ msg: "Contains special characters", sev: "low" });

    // ── Hierarchy / folder checks ─────────────────────────────────
    if (depth > 3) issues.push({ msg: `Deep path (${depth} folders, recommend ≤ 3)`, sev: depth > 4 ? "high" : "low" });

    const hasFileExtension = /\.(html?|php|aspx?|jsp|cfm)$/i.test(path);
    if (hasFileExtension) issues.push({ msg: "Ends in a file extension (.html/.php/…)", sev: "low" });

    const hasDateInPath = /\/(19|20)\d{2}\/(0?[1-9]|1[0-2])(\/(0?[1-9]|[12]\d|3[01]))?(\/|$)/.test(path + "/");
    if (hasDateInPath) issues.push({ msg: "Contains a date in the path", sev: "low" });

    // Per-segment analysis: non-descriptive IDs / hashes, overly long segments
    const nonDescriptive = [];
    const longSegments = [];
    segments.forEach(seg => {
      let s = seg.toLowerCase();
      try { s = decodeURIComponent(s); } catch (_) {}
      if (/^\d+$/.test(s) || /^[a-f0-9]{12,}$/i.test(s)) nonDescriptive.push(seg);
      if (s.length > 40) longSegments.push(seg);
    });
    if (nonDescriptive.length) issues.push({ msg: `Non-descriptive segment(s): ${nonDescriptive.slice(0, 3).join(", ")}`, sev: "low" });
    if (longSegments.length) issues.push({ msg: "Overly long path segment(s)", sev: "low" });

    // Repeated consecutive segments (/blog/blog/)
    for (let i = 1; i < segments.length; i++) {
      if (segments[i].toLowerCase() === segments[i - 1].toLowerCase()) { issues.push({ msg: "Repeated path segment", sev: "low" }); break; }
    }

    if (fullLen > 115) issues.push({ msg: `URL is long (${fullLen} chars)`, sev: "low" });

    // ── Severity-tiered score ─────────────────────────────────────
    const highCount = issues.filter(i => i.sev === "high").length;
    const lowCount = issues.filter(i => i.sev === "low").length;
    let score;
    if (issues.length === 0) score = 1;
    else if (highCount === 0) score = lowCount >= 3 ? 0.5 : 0.7;
    else score = highCount >= 2 ? 0.3 : 0.5;

    const issueMsgs = issues.map(i => i.msg);
    const hierarchy = depth === 0 ? "root" : segments.join(" › ");
    const details = issues.length === 0
      ? (depth === 0 ? "Clean root URL" : `Clean URL hierarchy (${depth} folder${depth === 1 ? "" : "s"})`)
      : `URL structure issues: ${issueMsgs.join(", ")}`;

    return evaluateParameter(parseFloat(score.toFixed(2)), details, {
      url, path, depth, segments, length: fullLen,
      hierarchy, hasFileExtension, hasDateInPath,
      nonDescriptiveSegments: nonDescriptive,
      issues: issueMsgs,
      why_this_occurred: issues.length
        ? `The URL has ${issues.length} structural issue(s): ${issueMsgs.join(", ")}.`
        : "The URL uses a clean, shallow, descriptive folder hierarchy.",
      how_to_fix: issues.length
        ? "Use lowercase, hyphen-separated, descriptive folders; keep depth ≤ 3; drop file extensions, dates, numeric IDs, and query parameters from indexable URLs."
        : "No changes needed. Maintain this structure for future pages.",
    });
  } catch (err) {
    return evaluateParameter(0, "Invalid URL format", { url, error: err.message, why_this_occurred: "The provided URL could not be parsed.", how_to_fix: "Ensure the URL is correctly formatted (e.g. https://example.com)." });
  }
};

const checkTitle = ($) => {
  const titleTag = $("title");
  const exists = titleTag.length > 0;
  const title = exists ? titleTag.text().trim() : "";
  const titleLength = title.length;
  let score = 0;
  let explanation = "";
  let recommendation = "";

  if (!exists || titleLength === 0) {
    score = 0;
    explanation = exists
      ? "The <title> tag is present but contains no text."
      : "The document is missing a <title> tag in the <head> section.";
    recommendation = "Add a descriptive <title> (50–60 characters) with the primary keyword near the front and the brand name as a suffix.";
  } else {
    // Graded length curve (spec rule 1: continuous, not pass/fail). Optimal
    // 50–60 chars = 1.0; shorter wastes SERP space, longer truncates.
    if (titleLength >= 50 && titleLength <= 60) score = 1;
    else if (titleLength >= 40 && titleLength < 50) score = 0.9;
    else if (titleLength >= 30 && titleLength < 40) score = 0.8;
    else if (titleLength >= 20 && titleLength < 30) score = 0.65;
    else if (titleLength < 20) score = 0.5;
    else if (titleLength > 60 && titleLength <= 65) score = 0.9;
    else if (titleLength > 65 && titleLength <= 75) score = 0.7;
    else score = 0.5; // > 75 — truncates badly in SERPs

    if (score === 1) {
      explanation = `The title length (${titleLength} chars) is within the optimal 50–60 character range.`;
      recommendation = "No substantial changes needed. Keep the primary keyword near the front and the brand as a suffix.";
    } else if (titleLength < 50) {
      explanation = `The title is ${titleLength} characters — shorter than the optimal 50–60 range, leaving SERP space unused.`;
      recommendation = "Expand toward 50–60 characters, e.g. \"{Year} {Make} {Model} for Sale in {City} | {Dealer}\".";
    } else {
      explanation = `The title is ${titleLength} characters — beyond the ~60-character SERP display limit, so it will be truncated.`;
      recommendation = "Trim to ~60 characters so the full title shows in search results; keep the primary keyword in the visible portion.";
    }
  }

  const details = score === 1 ? "Title tag is optimized" : "Title tag requires attention";

  return evaluateParameter(score, details, {
    title,
    exists, // boolean
    length: titleLength,
    why_this_occurred: explanation,
    how_to_fix: recommendation,
  });
};

const checkH1 = ($) => {
  const h1Count = $("h1").length;
  const content = $("h1").map((i, el) => $(el).text().trim()).get();

  let score = 0;
  let details = "H1 tag missing";
  let explanation = "";
  let recommendation = "";

  if (h1Count === 0) {
    score = 0.5;
    details = "Missing H1 tag";
    explanation = "No <h1> tag was found on the page.";
    recommendation = "Add exactly one <h1> tag that describes the main topic of the page. It's crucial for SEO and accessibility.";
  } else if (h1Count === 1) {
    if (content[0].length === 0) {
      score = 0.5;
      details = "H1 tag empty";
      explanation = "The <h1> tag exists but contains no text.";
      recommendation = "Add descriptive text to your <h1> tag.";
    } else {
      score = 1;
      details = "Exactly one H1 tag found";
    explanation = "The page correctly contains a single H1 tag.";
    recommendation = "Ensure the H1 text contains your primary keyword and is compelling to users.";
    }
  } else {
    score = 0.5;
    details = `Multiple H1 tags found (${h1Count})`;
    explanation = "Multiple <h1> tags were detected. While HTML5 allows this, it is generally recommended to have only one main heading per page.";
    recommendation = "Consolidate your main headings. Use a single <h1> for the page title and <h2>-<h6> for subsections.";
  }

  return evaluateParameter(score, details, {
    count: h1Count,
    content,
    why_this_occurred: explanation,
    how_to_fix: recommendation,
  });
};

const checkMetaDescription = ($) => {
  const metaTag = $('meta[name="description"]');
  const exists = metaTag.length > 0;
  const metaDesc = exists ? (metaTag.attr("content") || "").trim() : "";
  const metaDescLength = metaDesc.length;

  let score = 0;
  let explanation = "";
  let recommendation = "";

  if (!exists || metaDescLength === 0) {
    score = 0;
    explanation = exists
      ? "The meta description tag exists but the content attribute is empty."
      : "The document is missing a meta description tag.";
    recommendation = "Add a unique 120–160 character <meta name=\"description\"> that summarizes the page and includes a primary keyword and call to action.";
  } else {
    // Graded length curve (spec rule 1). Optimal 120–160 chars = 1.0.
    if (metaDescLength >= 120 && metaDescLength <= 160) score = 1;
    else if (metaDescLength >= 90 && metaDescLength < 120) score = 0.9;
    else if (metaDescLength >= 50 && metaDescLength < 90) score = 0.75;
    else if (metaDescLength < 50) score = 0.5;
    else if (metaDescLength > 160 && metaDescLength <= 180) score = 0.85;
    else score = 0.6; // > 180 — truncates in SERPs

    if (score === 1) {
      explanation = "The meta description length is within the optimal 120–160 character range.";
      recommendation = "Ensure it accurately reflects the page content and includes a call to action if appropriate.";
    } else if (metaDescLength < 120) {
      explanation = `The meta description is ${metaDescLength} characters — shorter than the optimal 120–160 range, so it under-uses the SERP snippet.`;
      recommendation = "Expand toward 120–160 characters with a compelling, keyword-relevant summary and a call to action.";
    } else {
      explanation = `The meta description is ${metaDescLength} characters — beyond ~160, so search engines will truncate it.`;
      recommendation = "Trim to ~155–160 characters so the full snippet displays.";
    }
  }

  const details = score === 1 ? "Meta description is optimized" : "Meta description requires attention";

  return evaluateParameter(score, details, {
    description: metaDesc,
    length: metaDescLength,
    exists, // boolean
    why_this_occurred: explanation,
    how_to_fix: recommendation,
  });
};

const checkCanonical = ($, url) => {
  const links = $('link[rel="canonical"]');
  const exists = links.length > 0;
  const canonical = exists ? (links.attr("href") || "").trim() : "";

  // Duplicate-content / pagination context signals
  const inHead = $('head link[rel="canonical"]').length > 0;
  const robotsContent = (($('meta[name="robots"]').attr('content') || "") + " " + ($('meta[name="googlebot"]').attr('content') || "")).toLowerCase();
  const hasNoindex = /noindex/.test(robotsContent);
  const hasRelNext = $('link[rel="next"]').length > 0;
  const hasRelPrev = $('link[rel="prev"]').length > 0;
  const pageMatch = String(url).match(/[?&]page=(\d+)|\/page\/(\d+)/i);
  const pageNum = pageMatch ? parseInt(pageMatch[1] || pageMatch[2], 10) : null;
  const isPaginated = hasRelNext || hasRelPrev || (pageNum != null);
  const isDeepPage = (pageNum != null && pageNum > 1) || hasRelPrev;

  let score = 0;
  let details = "Canonical tag missing";
  let explanation = "";
  let recommendation = "";
  let isSelfReferencing = false;
  let canonicalizesParams = false;
  let paginationIssue = false;
  let noindexConflict = false;

  if (!exists) {
    score = 0.5;
    details = "Canonical tag missing";
    explanation = "No canonical tag was found in the <head> of the page.";
    recommendation = "Add a <link rel=\"canonical\" href=\"...\" /> pointing to the authoritative URL for this page to prevent duplicate-content issues.";
  } else if (links.length > 1) {
    score = 0;
    details = "Multiple canonical tags found";
    explanation = "Multiple <link rel=\"canonical\"> tags were detected; search engines may ignore all of them.";
    recommendation = "Keep exactly one canonical tag per page and remove the duplicates.";
  } else if (!canonical) {
    score = 0;
    details = "Canonical tag empty";
    explanation = "A canonical tag exists but its href attribute is empty.";
    recommendation = "Set the correct absolute URL in the href attribute of the canonical tag.";
  } else if (!inHead) {
    score = 0.5;
    details = "Canonical tag not in <head>";
    explanation = "The canonical tag is not inside the <head>; canonicals placed in the <body> are ignored by search engines.";
    recommendation = "Move the <link rel=\"canonical\"> into the <head> section.";
  } else {
    try {
      const canonicalUrl = new URL(canonical, url);
      const currentUrl = new URL(url);

      const getComparisonString = (uObj) => {
        const host = uObj.hostname.replace(/^www\./, '').toLowerCase();
        let path = uObj.pathname;
        if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
        return host + path + uObj.search;
      };

      const canonStr = getComparisonString(canonicalUrl);
      const currStr = getComparisonString(currentUrl);
      isSelfReferencing = canonStr === currStr;

      const canonHost = canonicalUrl.hostname.replace(/^www\./, '');
      const currHost = currentUrl.hostname.replace(/^www\./, '');
      // Same path, params present on current but stripped on canonical => canonicalizing a parameterized variant
      canonicalizesParams =
        canonHost === currHost &&
        canonicalUrl.pathname.replace(/\/$/, '') === currentUrl.pathname.replace(/\/$/, '') &&
        !!currentUrl.search && !canonicalUrl.search;

      if (isSelfReferencing) {
        score = 1;
        details = isDeepPage ? "Self-referencing canonical (paginated page)" : "Self-referencing canonical tag";
        explanation = isDeepPage
          ? "The paginated page correctly canonicalizes to itself, keeping its deep content indexable."
          : "The canonical tag correctly points to the current page URL.";
        recommendation = "No action needed.";
      } else if (canonHost === currHost) {
        if (isPaginated && isDeepPage) {
          score = 0.5;
          paginationIssue = true;
          details = "Paginated page canonicalizes to another page";
          explanation = "This is a deep paginated page but its canonical points to a different page (often page 1). Items unique to this page may not get indexed.";
          recommendation = "Self-canonicalize each paginated page (page N canonical = page N), using rel=prev/next or a 'view-all' page rather than canonicalizing every page to page 1.";
        } else if (canonicalizesParams) {
          score = 1;
          details = "Canonicalizes a parameterized URL variant";
          explanation = "The canonical strips query parameters and points to the clean base URL — correct handling of tracking/sort/filter variants.";
          recommendation = "No action needed; this consolidates duplicate parameterized URLs.";
        } else {
          score = 1;
          details = "Canonical points to another internal URL";
          explanation = "The canonical points to a different URL on the same domain, marking this page as a duplicate/variant of it.";
          recommendation = "Confirm this is intentional. If this page should be indexed on its own, point the canonical to itself.";
        }
      } else {
        score = 0;
        details = "Canonical points to external domain";
        explanation = "The canonical tag points to a different domain.";
        recommendation = "Verify this is intentional cross-domain syndication; otherwise point the canonical to your own domain.";
      }
    } catch (e) {
      score = 0;
      details = "Invalid Canonical URL";
      explanation = "The URL in the canonical tag is malformed.";
      recommendation = "Correct the URL format (include the protocol, e.g. https://).";
    }
  }

  // noindex + canonical-to-a-different-URL is a contradictory signal
  if (canonical && hasNoindex && !isSelfReferencing && score > 0.5) {
    noindexConflict = true;
    score = 0.5;
    details = "noindex conflicts with canonical";
    explanation = "The page is set to noindex but also has a canonical pointing to a different URL — contradictory signals that search engines may handle unpredictably.";
    recommendation = "Use either noindex OR a cross-URL canonical, not both. For a duplicate you want consolidated, drop the noindex and keep the canonical.";
  }

  return evaluateParameter(score, details, {
    canonical,
    exists: exists ? 1 : 0,
    isSelfReferencing,
    inHead,
    hasNoindex,
    noindexConflict,
    isPaginated,
    isDeepPage,
    pageNum,
    hasRelNext,
    hasRelPrev,
    canonicalizesParams,
    paginationIssue,
    why_this_occurred: explanation,
    how_to_fix: recommendation,
  });
};

const checkSocial = ($) => {
  // 1. Open Graph
  const ogTags = {
    "og:site_name": $('meta[property="og:site_name"]').attr("content"),
    "og:type": $('meta[property="og:type"]').attr("content"),
    "og:image": $('meta[property="og:image"]').attr("content"),
    "og:title": $('meta[property="og:title"]').attr("content"),
    "og:description": $('meta[property="og:description"]').attr("content"),
    "og:url": $('meta[property="og:url"]').attr("content")
  };
  const ogRequired = ["og:title", "og:image", "og:url"];
  const ogCount = ogRequired.reduce((acc, key) => acc + (ogTags[key] ? 1 : 0), 0);
  let ogScore = ogCount === ogRequired.length ? 1 : 0.5; // WARNING for missing or incomplete
  const ogMissing = ogRequired.filter(key => !ogTags[key]);
  const ogDetails = ogScore === 1 ? "Open Graph tags are optimized" : ogScore === 0.5 ? `Missing key OG tags: ${ogMissing.join(", ")}` : "No Open Graph tags found";
  const ogMetric = evaluateParameter(ogScore, ogDetails, { tags: ogTags, missing: ogMissing, parameter: "1 if og:title, og:image, og:url exist" });

  // 2. Twitter Card
  const getTw = (key) => $(`meta[name="${key}"], meta[property="${key}"]`).attr("content");

  const twTags = {
    "twitter:site": getTw("twitter:site"),
    "twitter:card": getTw("twitter:card"),
    "twitter:image": getTw("twitter:image") || getTw("twitter:image:src"),
    "twitter:title": getTw("twitter:title"),
    "twitter:description": getTw("twitter:description")
  };
  const twRequired = ["twitter:card", "twitter:title"];
  const twCount = twRequired.reduce((acc, key) => acc + (twTags[key] ? 1 : 0), 0);
  let twScore = twCount === twRequired.length ? 1 : 0.5; // WARNING for missing or incomplete
  const twMissing = twRequired.filter(key => !twTags[key]);
  const twDetails = twScore === 1 ? "Twitter Card tags are optimized" : twScore === 0.5 ? `Missing key Twitter tags: ${twMissing.join(", ")}` : "No Twitter Card tags found";
  const twitterMetric = evaluateParameter(twScore, twDetails, { tags: twTags, missing: twMissing, parameter: "1 if twitter:card and twitter:title exist" });

  // 3. Social Profiles (sameAs consistency)
  const platformOf = (u) => {
    const map = {
      "facebook.com": "facebook", "fb.com": "facebook", "twitter.com": "twitter", "x.com": "twitter",
      "linkedin.com": "linkedin", "instagram.com": "instagram", "youtube.com": "youtube", "youtu.be": "youtube",
      "pinterest.com": "pinterest", "tiktok.com": "tiktok", "reddit.com": "reddit", "snapchat.com": "snapchat",
      "medium.com": "medium", "yelp.com": "yelp"
    };
    if (!u || typeof u !== "string") return null;
    const raw = u.trim();
    // Ignore anchors, mailto/tel/javascript and other non-navigational links outright.
    if (/^(#|mailto:|tel:|sms:|javascript:|data:)/i.test(raw)) return null;
    let hostname;
    try {
      // Only accept absolute (http/https) or protocol-relative URLs. Relative paths
      // (e.g. "/about", "?q=1") must NOT be resolved against a social base — doing so
      // misclassifies every internal link as that base's platform.
      if (/^\/\//.test(raw)) hostname = new URL("https:" + raw).hostname;
      else if (/^https?:\/\//i.test(raw)) hostname = new URL(raw).hostname;
      else return null;
    } catch (e) { return null; }
    hostname = hostname.replace(/^www\./, "").toLowerCase();
    // Exact host or subdomain match only — avoids substring false positives like "notfacebook.com".
    for (const d in map) if (hostname === d || hostname.endsWith("." + d)) return map[d];
    return null;
  };
  const normProfile = (u) => {
    try {
      const x = new URL(u, "https://x.com");
      return (x.hostname.replace(/^www\./, "") + x.pathname.replace(/\/$/, "")).toLowerCase();
    } catch (e) { return String(u).toLowerCase(); }
  };

  // On-page social links
  const foundLinks = [];
  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (href && platformOf(href)) foundLinks.push(href);
  });
  const uniqueLinks = [...new Set(foundLinks)];

  // sameAs URLs from JSON-LD (Organization/LocalBusiness, recursively through @graph/nesting)
  const sameAsUrls = [];
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const json = JSON.parse($(el).html().trim().replace(/<!\[CDATA\[|\]\]>|<!--|-->/g, ''));
      const collect = (o) => {
        if (!o || typeof o !== 'object') return;
        if (o.sameAs) [].concat(o.sameAs).forEach(s => { if (typeof s === 'string') sameAsUrls.push(s); });
        const kids = Array.isArray(o) ? o : (o['@graph'] && Array.isArray(o['@graph']) ? o['@graph'] : Object.values(o));
        kids.forEach(k => { if (k && typeof k === 'object') collect(k); });
      };
      collect(json);
    } catch (e) {}
  });
  const uniqueSameAs = [...new Set(sameAsUrls)];
  const inSameAsSet = new Set(uniqueSameAs.map(normProfile));

  // Profiles with sameAs-declared flag, platform diversity, and per-platform handle conflicts
  const profiles = uniqueLinks.map(u => ({ platform: platformOf(u), url: u, inSameAs: inSameAsSet.has(normProfile(u)) }));
  const onPagePlatforms = [...new Set(profiles.map(p => p.platform).filter(Boolean))];
  const sameAsPlatforms = [...new Set(uniqueSameAs.map(platformOf).filter(Boolean))];

  const byPlatform = {};
  [...uniqueLinks, ...uniqueSameAs].forEach(u => {
    const p = platformOf(u);
    if (!p) return;
    (byPlatform[p] = byPlatform[p] || new Set()).add(normProfile(u));
  });
  const conflicts = Object.entries(byPlatform).filter(([, set]) => set.size > 1).map(([platform, set]) => ({ platform, handles: [...set] }));

  const missingFromSameAs = profiles.filter(p => !p.inSameAs).map(p => p.url);
  const sameAsOnly = sameAsPlatforms.filter(p => !onPagePlatforms.includes(p));

  const hasSocial = uniqueLinks.length > 0;
  const hasSameAs = uniqueSameAs.length > 0;

  let linkScore, linkDetails, lExpl, lFix;
  if (!hasSocial && !hasSameAs) {
    linkScore = 0.5;
    linkDetails = "No social profiles found";
    lExpl = "No social-media links or sameAs entries were found.";
    lFix = "Link your social profiles (footer) and declare them in Organization/LocalBusiness sameAs.";
  } else if (conflicts.length > 0) {
    linkScore = 0.5;
    linkDetails = `Inconsistent profiles (${conflicts.length} platform conflict)`;
    lExpl = `Conflicting handles for: ${conflicts.map(c => c.platform).join(", ")} — the same platform points to different profiles.`;
    lFix = "Use one consistent profile per platform across on-page links and sameAs.";
  } else if (hasSocial && !hasSameAs) {
    linkScore = 0.7;
    linkDetails = `${onPagePlatforms.length} platform(s) linked, but none declared in sameAs`;
    lExpl = "Profiles are linked on-page but not declared in structured-data sameAs, weakening entity recognition by search engines.";
    lFix = "Add the profile URLs to your Organization/LocalBusiness sameAs array.";
  } else if (hasSameAs && missingFromSameAs.length > 0) {
    linkScore = 0.7;
    linkDetails = `${missingFromSameAs.length} linked profile(s) not in sameAs`;
    lExpl = "Some on-page social profiles are not declared in sameAs, so the entity graph is incomplete.";
    lFix = "Add every linked social profile to the sameAs array for consistent entity signals.";
  } else {
    linkScore = 1;
    linkDetails = `${onPagePlatforms.length || sameAsPlatforms.length} platform(s), consistent with sameAs`;
    lExpl = "Social profiles are linked and consistently declared in sameAs.";
    lFix = "Maintain consistent profiles across pages and sameAs.";
  }

  const socialLinksMetric = evaluateParameter(linkScore, linkDetails, {
    links: uniqueLinks,
    count: uniqueLinks.length,
    profiles,
    platforms: onPagePlatforms,
    platformCount: onPagePlatforms.length,
    sameAs: uniqueSameAs,
    sameAsCount: uniqueSameAs.length,
    sameAsPlatforms,
    missingFromSameAs,
    sameAsOnly,
    conflicts,
    why_this_occurred: lExpl,
    how_to_fix: lFix,
  });

  return { ogMetric, twitterMetric, socialLinksMetric };
};

const checkRobotsTxt = async (url, page, $ = null) => {
  try {
    const robotsUrl = new URL("/robots.txt", url).href;

    let exists = false;
    let content = null;

    // 🔥 Attempt to fetch via Puppeteer page to bypass Cloudflare/WAF
    if (page) {
      try {
        const result = await page.evaluate(async (rUrl) => {
          try {
            const res = await fetch(rUrl);
            return { status: res.status, text: await res.text() };
          } catch (e) {
            return null;
          }
        }, robotsUrl);

        if (result) {
          if (result.status < 400) {
            exists = true;
            content = result.text;
          } else if (result.text && result.text.includes("User-agent")) {
            exists = true;
            content = result.text;
          }
        }
      } catch (e) {
        // proceed to node-fetch fallback
      }
    }

    // 🔥 fallback to direct node-fetch
    if (!exists) {
      const response = await fetch(robotsUrl, { 
        headers: { 
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        },
        redirect: "follow", // 🔥 handle redirects
        signal: AbortSignal.timeout(6000) 
      });

      const resText = await response.text().catch(() => null);

      // 🔥 Better existence check
      if (response && response.status < 400) {
        exists = true;
        content = resText;
      }

      // 🔥 fallback (sometimes blocked but content still available)
      if (!exists && resText && resText.includes("User-agent")) {
        exists = true;
        content = resText;
      }
    }

    let score = 0;
    let details = "Robots.txt check";

    if (!exists) {
      score = 0.5;
      details = "Robots.txt missing";
    } 
    else if (!content || content.trim() === "") {
      score = 0.5;
      details = "Robots.txt empty";
    } 
    else {
      // Normalize content
      const normalized = content.replace(/\r\n/g, "\n");

      // 👉 Extract User-agent: *
      const globalBlockMatch = normalized.match(
        /User-agent:\s*\*([\s\S]*?)(?=User-agent:|$)/i
      );

      const globalRules = globalBlockMatch ? globalBlockMatch[1] : "";

      // 🚨 Full site blocked
      const isFullyBlocked = /Disallow:\s*\/\s*$/m.test(globalRules);

      if (isFullyBlocked) {
        score = 0;
        details = "Wrong config (site fully blocked)";
      } 
      else {
        // ⚠️ Query params blocked
        const blocksAllParams = /Disallow:\s*\/\*\?(?:\*|\s*$)/m.test(globalRules);

        if (blocksAllParams) {
          score = 0.7;
          details = "Robots.txt OK but query params blocked";
        } else {
          score = 1;
          details = "Proper robots.txt";
        }
      }
    }

    let explanation = exists
      ? "Robots.txt file detected and analyzed for crawler access rules."
      : "Robots.txt is missing. Crawlers may index sensitive or unwanted pages.";

    let recommendation = exists
      ? "Ensure important pages are allowed and only sensitive or duplicate URLs are disallowed."
      : "Add a robots.txt file at the root to control crawler behavior.";

    // ── Page-level robots-meta index intent (spec §2.2: "Robots meta + robots.txt intent") ──
    // An accidental noindex/nofollow on a normally-indexable template is
    // catastrophic and invisible to users, so it dominates this parameter.
    const metaRobots = (($ && $('meta[name="robots"]').attr("content")) || "").toLowerCase();
    const googlebot = (($ && $('meta[name="googlebot"]').attr("content")) || "").toLowerCase();
    const directives = `${metaRobots} ${googlebot}`;
    const hasNoindex = /\bnoindex\b/.test(directives) || /\bnone\b/.test(directives);
    const hasNofollow = /\bnofollow\b/.test(directives) || /\bnone\b/.test(directives);

    if (hasNoindex) {
      score = Math.min(score, 0.3); // catastrophic if this page should be indexed
      details = "Page is set to noindex";
      explanation = "A robots meta tag sets this page to noindex, telling search engines to drop it from their index. If this is a money page (home/VDP/SRP) this is catastrophic and usually unintended.";
      recommendation = "Remove the noindex directive from this page unless it is deliberately a thin/duplicate page. Reserve noindex for thin filter combinations and utility pages only.";
    } else if (hasNofollow) {
      score = Math.min(score, 0.6);
      details = exists ? "Page links set to nofollow" : "Robots.txt missing · links nofollowed";
      explanation = "A robots meta tag applies nofollow to this page, so search engines won't follow its links — this can strip internal-link equity and slow inventory crawling.";
      recommendation = "Remove the page-level nofollow so internal links (SRP→VDP, related vehicles) pass crawl signals.";
    }

    return evaluateParameter(score, details, {
      content,
      exists: exists ? 1 : 0,
      metaRobots: metaRobots || null,
      googlebot: googlebot || null,
      hasNoindex,
      hasNofollow,
      why_this_occurred: explanation,
      how_to_fix: recommendation,
    });

  } catch (e) {
    return evaluateParameter(0, "Robots.txt check failed", { 
      error: e.message 
    });
  }
};

const checkSitemap = async (url, robotsContent = null, page) => {
  try {
    let urlsToTry = [];

    // 🔍 First, extract sitemap URLs from robots.txt
    if (robotsContent) {
      const robotsSitemaps = robotsContent.match(/Sitemap:\s*(\S+)/gi);
      if (robotsSitemaps) {
        robotsSitemaps.forEach(m => {
          const sUrl = m.replace(/Sitemap:\s*/i, '').trim();
          if (sUrl && !urlsToTry.includes(sUrl)) {
            urlsToTry.push(sUrl);
          }
        });
      }
    }

    // Then add the default fallbacks
    const sitemapUrl = new URL("/sitemap.xml", url).href;
    const sitemapIndexUrl = new URL("/sitemap_index.xml", url).href;

    if (!urlsToTry.includes(sitemapUrl)) urlsToTry.push(sitemapUrl);
    if (!urlsToTry.includes(sitemapIndexUrl)) urlsToTry.push(sitemapIndexUrl);

    let exists = false;
    let content = null;

    const headers = { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' 
    };

    // 🔄 Try multiple sitemap URLs
    for (const target of urlsToTry) {
      if (exists) break;

      let fetchedUsingPage = false;

      // 🔥 Attempt via Puppeteer first to bypass Cloudflare
      if (page) {
        try {
          const result = await page.evaluate(async (sUrl) => {
            try {
              const res = await fetch(sUrl);
              return { ok: res.ok, text: await res.text() };
            } catch (e) {
              return null;
            }
          }, target);

          if (result && result.ok) {
            const lower = result.text.toLowerCase();
            if (
              lower.includes('<urlset') ||
              lower.includes('<sitemapindex') ||
              (target.endsWith('.txt') && lower.includes('http'))
            ) {
              exists = true;
              content = result.text;
              fetchedUsingPage = true;
              break;
            }
          }
        } catch (e) {
          // Fallback to node fetch
        }
      }

      if (!exists && !fetchedUsingPage) {
        try {
          const response = await fetch(target, { 
            headers, 
            signal: AbortSignal.timeout(5000) 
          });

          if (response.ok) {
            const text = await response.text();

            const lower = text.toLowerCase();

            // Heuristic check
            if (
              lower.includes('<urlset') ||
              lower.includes('<sitemapindex') ||
              (target.endsWith('.txt') && lower.includes('http'))
            ) {
              exists = true;
              content = text;
              break;
            }
          }
        } catch (e) {
          continue;
        }
      }
    }

    let score = 0;
    let details = "Sitemap check";
    let explanation = "";
    let recommendation = "";

    // Coverage / freshness / broken-URL signals (populated when a valid sitemap exists)
    let isIndex = false;
    let urlCount = 0;
    let lastmodCount = 0;
    let mostRecentLastmod = null;
    let oldestLastmod = null;
    let sampledUrls = [];
    let brokenUrls = [];
    let hasImageSitemap = false;
    let hasHreflang = false;

    if (!exists) {
      score = 0.5;
      details = "sitemap.xml missing";
      explanation = "No sitemap was found via robots.txt or the common default locations.";
      recommendation = "Create a sitemap.xml, list your important URLs with <lastmod>, and reference it in robots.txt.";
    } else if (!(content.includes("<urlset") || content.includes("<sitemapindex"))) {
      score = 0;
      details = "Sitemap broken / invalid";
      explanation = "A file was returned but it is not a valid XML sitemap (<urlset>/<sitemapindex>).";
      recommendation = "Fix the sitemap so it is well-formed XML with a <urlset> or <sitemapindex> root.";
    } else {
      isIndex = content.includes("<sitemapindex");
      const locMatches = content.match(/<loc>\s*([\s\S]*?)\s*<\/loc>/gi) || [];
      const locUrls = locMatches.map(t => t.replace(/<\/?loc>/gi, "").trim()).filter(Boolean);
      urlCount = locUrls.length;
      hasImageSitemap = /<image:image|<image:loc/i.test(content);
      hasHreflang = /hreflang=/i.test(content);

      // Freshness — use the MOST RECENT <lastmod> (a sitemap legitimately holds older pages too,
      // so the old "any entry > 180d = outdated" rule wrongly penalised normal sitemaps).
      const lastmodMatches = content.match(/<lastmod>(.*?)<\/lastmod>/gi) || [];
      const dates = lastmodMatches
        .map(t => new Date(t.replace(/<\/?lastmod>/gi, "").trim()))
        .filter(d => !isNaN(d.getTime()));
      lastmodCount = dates.length;
      if (dates.length) {
        const sorted = dates.slice().sort((a, b) => b - a);
        mostRecentLastmod = sorted[0].toISOString().slice(0, 10);
        oldestLastmod = sorted[sorted.length - 1].toISOString().slice(0, 10);
      }
      const newestDays = dates.length
        ? Math.floor((Date.now() - Math.max(...dates.map(d => d.getTime()))) / 86400000)
        : null;

      // Broken-URL sampling — spread up to 5 <loc> URLs and check status. Prefer the
      // Puppeteer page (bypasses bot protection) so 403s don't read as broken.
      const sample = [];
      if (locUrls.length) {
        const step = Math.max(1, Math.floor(locUrls.length / 5));
        for (let i = 0; i < locUrls.length && sample.length < 5; i += step) sample.push(locUrls[i]);
      }
      sampledUrls = sample;
      const fetchStatus = async (u) => {
        try {
          if (page) {
            return await page.evaluate(async (x) => {
              try { const r = await fetch(x, { method: "GET" }); return r.status; } catch { return -1; }
            }, u);
          }
          const r = await fetch(u, { headers, signal: AbortSignal.timeout(6000) });
          return r.status;
        } catch { return -1; }
      };
      const statuses = await Promise.all(sample.map(async (u) => ({ url: u, status: await fetchStatus(u) })));
      // Only definitive failures count as broken; 401/403/429/-1 are blocked/unverified.
      brokenUrls = statuses.filter(s => s.status === 404 || s.status === 410 || (s.status >= 500 && s.status < 600));

      if (urlCount === 0) {
        score = 0;
        details = "Sitemap is empty";
        explanation = "The sitemap is valid XML but contains no <loc> URLs.";
        recommendation = "Populate the sitemap with your indexable URLs.";
      } else if (brokenUrls.length > 0) {
        score = 0.5;
        details = `${brokenUrls.length} of ${sample.length} sampled sitemap URLs are broken`;
        explanation = "Some URLs listed in the sitemap return 404/410/5xx, wasting crawl budget and signalling poor maintenance.";
        recommendation = "Remove or fix dead URLs in the sitemap and regenerate it automatically from live content.";
      } else if (lastmodCount === 0) {
        score = 0.5;
        details = `Sitemap found (${urlCount} ${isIndex ? "child sitemaps" : "URLs"}) but no <lastmod>`;
        explanation = "The sitemap lists URLs but none carry a <lastmod>, so crawlers can't tell what changed.";
        recommendation = "Add accurate <lastmod> timestamps so search engines prioritise recently updated pages.";
      } else if (newestDays != null && newestDays > 180) {
        score = 0.5;
        details = `Sitemap stale — newest <lastmod> ${newestDays}d ago`;
        explanation = "Even the most recently changed entry is over six months old, suggesting the sitemap (or site) isn't being maintained.";
        recommendation = "Regenerate the sitemap so <lastmod> reflects recent content changes.";
      } else {
        score = 1;
        details = isIndex
          ? `Sitemap index found (${urlCount} child sitemaps)`
          : `Proper sitemap (${urlCount} URLs, freshest ${newestDays}d ago)`;
        explanation = "A valid, fresh sitemap was found with reachable sampled URLs.";
        recommendation = "Keep the sitemap auto-generated and reference it in robots.txt.";
      }
    }

    return evaluateParameter(score, details, {
      content,
      exists: exists ? 1 : 0,
      isIndex,
      urlCount,
      lastmodCount,
      lastmodCoverage: urlCount ? Math.round((lastmodCount / urlCount) * 100) : 0,
      mostRecentLastmod,
      oldestLastmod,
      sampledUrls,
      brokenUrls,
      broken_count: brokenUrls.length,
      hasImageSitemap,
      hasHreflang,
      why_this_occurred: explanation,
      how_to_fix: recommendation,
    });

  } catch (e) {
    return evaluateParameter(0, "Sitemap check failed", { 
      error: e.message 
    });
  }
};

const checkStructuredData = async (page) => {
  try {
    const result = await page.evaluate(() => {
      const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
        .map(el => { try { return JSON.parse(el.innerText); } catch { return null; } })
        .filter(Boolean);
      return { hasData: scripts.length > 0, content: scripts };
    });

    if (!result.hasData) {
      return evaluateParameter(0.5, "Structured Data missing", {
        content: [], types: "", exists: false, detectedTypes: [], otherTypes: [], validated: [], errorCount: 0,
        why_this_occurred: "No JSON-LD structured data found on the page.",
        how_to_fix: "Add Schema.org JSON-LD (Organization/LocalBusiness, Product/Vehicle, Offer, FAQPage, BreadcrumbList) so the page is eligible for rich results.",
      });
    }

    // Flatten every object that carries an @type (through @graph, arrays, and nested values).
    const nodes = [];
    const visit = (obj) => {
      if (!obj || typeof obj !== 'object') return;
      if (Array.isArray(obj)) { obj.forEach(visit); return; }
      if (Array.isArray(obj['@graph'])) obj['@graph'].forEach(visit);
      if (obj['@type']) nodes.push(obj);
      for (const k of Object.keys(obj)) {
        if (k === '@graph') continue;
        const v = obj[k];
        if (v && typeof v === 'object') visit(v);
      }
    };
    result.content.forEach(visit);

    const typeOf = (o) => [].concat(o['@type']).filter(Boolean).map(String);
    const truthy = (v) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
    const has = (o, f) => truthy(o[f]);

    const LOCALBIZ = new Set(["LocalBusiness", "AutoDealer", "AutomotiveBusiness", "CarDealer", "Store", "AutoRepair", "AutoPartsStore", "MotorcycleDealer", "AutoBodyShop", "GasStation"]);
    const ORG = new Set(["Organization", "Corporation", "NGO", "GovernmentOrganization", "EducationalOrganization"]);
    const REQ = {
      Organization:    { required: ["name", "url"], recommended: ["logo", "sameAs", "contactPoint"] },
      LocalBusiness:   { required: ["name", "address"], recommended: ["telephone", "openingHours", "geo", "image", "url", "priceRange"] },
      Product:         { required: ["name"], recommended: ["image", "offers", "brand", "description"] },
      Offer:           { required: ["price", "priceCurrency"], recommended: ["availability", "url"] },
      Vehicle:         { required: ["name"], recommended: ["brand", "model", "offers", "vehicleIdentificationNumber", "mileageFromOdometer"] },
      Article:         { required: ["headline"], recommended: ["image", "datePublished", "author"] },
      Review:          { required: ["reviewRating", "author"], recommended: ["itemReviewed"] },
      AggregateRating: { required: ["ratingValue"], recommended: ["reviewCount", "ratingCount"] },
    };
    const hasField = (o, f) => {
      if (f === "openingHours") return has(o, "openingHours") || has(o, "openingHoursSpecification");
      if (f === "url") return has(o, "url") || has(o, "@id");
      if (f === "telephone") return has(o, "telephone") || (o.contactPoint && [].concat(o.contactPoint).some(c => c && c.telephone));
      if (f === "name") return has(o, "name") || has(o, "legalName");
      return has(o, f);
    };

    const validated = [];
    const otherTypes = new Set();
    let errorCount = 0;

    const validateGeneric = (o, rules, label) => {
      const missingRequired = rules.required.filter(f => !hasField(o, f));
      const missingRecommended = rules.recommended.filter(f => !hasField(o, f));
      if (missingRequired.length) errorCount++;
      validated.push({ type: label, valid: missingRequired.length === 0, missingRequired, missingRecommended });
    };
    const validateFAQ = (o) => {
      const ents = [].concat(o.mainEntity || []).filter(Boolean);
      const missingRequired = [];
      if (ents.length === 0) missingRequired.push("mainEntity (Question list)");
      else if (!ents.some(q => q && hasField(q, "name") && q.acceptedAnswer && [].concat(q.acceptedAnswer).some(a => a && truthy(a.text)))) {
        missingRequired.push("Question.name + acceptedAnswer.text");
      }
      if (missingRequired.length) errorCount++;
      validated.push({ type: "FAQPage", valid: missingRequired.length === 0, missingRequired, missingRecommended: [], count: ents.length });
    };
    const validateBreadcrumb = (o) => {
      const items = [].concat(o.itemListElement || []).filter(Boolean);
      const missingRequired = [];
      if (items.length === 0) missingRequired.push("itemListElement");
      else if (items.some(it => !(it && (truthy(it.name) || (it.item && (truthy(it.item.name) || truthy(it.item['@id'])))))) ) {
        missingRequired.push("ListItem.name/item on some entries");
      }
      if (missingRequired.length) errorCount++;
      validated.push({ type: "BreadcrumbList", valid: missingRequired.length === 0, missingRequired, missingRecommended: [], count: items.length });
    };

    nodes.forEach(o => {
      const types = typeOf(o);
      if (types.includes("FAQPage")) return validateFAQ(o);
      if (types.includes("BreadcrumbList")) return validateBreadcrumb(o);
      const lb = types.find(t => LOCALBIZ.has(t));
      if (lb) return validateGeneric(o, REQ.LocalBusiness, lb);
      const og = types.find(t => ORG.has(t));
      if (og) return validateGeneric(o, REQ.Organization, og);
      const known = types.find(t => REQ[t]);
      if (known) return validateGeneric(o, REQ[known], known);
      types.forEach(t => otherTypes.add(t)); // present but not a rich-result type we validate
    });

    const detectedTypes = [...new Set(validated.map(v => v.type))];
    const typesStr = [...detectedTypes, ...otherTypes].join(", ");

    let score, details, explanation, recommendation;
    if (errorCount > 0) {
      const bad = validated.filter(v => !v.valid);
      score = 0.5;
      details = `Structured Data incomplete (${errorCount} type(s) missing required fields)`;
      explanation = `These schema types are missing required fields: ${bad.map(b => `${b.type} [${b.missingRequired.join(", ")}]`).join("; ")}.`;
      recommendation = "Add the missing required Schema.org properties so the markup qualifies for rich results.";
    } else if (validated.length === 0) {
      score = 0.7;
      details = `Structured Data present but no rich-result types (${[...otherTypes].join(", ") || "generic"})`;
      explanation = "JSON-LD is present but none of the high-value rich-result types (Organization/LocalBusiness, Product/Vehicle, Offer, FAQPage, BreadcrumbList) were found.";
      recommendation = "Add LocalBusiness/AutoDealer, Product/Vehicle + Offer, FAQPage and BreadcrumbList markup to unlock rich results.";
    } else {
      score = 1;
      details = `Valid structured data (${detectedTypes.join(", ")})`;
      explanation = `Found valid JSON-LD: ${detectedTypes.join(", ")}.`;
      const recs = validated.filter(v => v.missingRecommended && v.missingRecommended.length);
      recommendation = recs.length
        ? `Optional: add recommended fields — ${recs.map(r => `${r.type} [${r.missingRecommended.join(", ")}]`).join("; ")}.`
        : "Structured data is valid for the detected types. Keep it in sync with on-page content.";
    }

    return evaluateParameter(score, details, {
      content: result.content,
      types: typesStr,
      exists: true,
      detectedTypes,
      otherTypes: [...otherTypes],
      validated,
      errorCount,
      why_this_occurred: explanation,
      how_to_fix: recommendation,
    });
  } catch (e) {
    return evaluateParameter(0, "Structured Data check failed", { error: e.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────
// Cross-page Uniqueness (titles & meta descriptions)
// Samples up to 5 eligible internal content pages (from sitemap, else by
// crawling the homepage), extracts each page's <title> and meta description
// in a single fetch, normalizes them and scores how many are unique.
// Duplicate / missing values lower the score.
// ──────────────────────────────────────────────────────────────────────────

// Paths that are templated / boilerplate and therefore not useful for a
// title-uniqueness comparison (inventory, VDPs, legal pages, etc.).
const TU_EXCLUDE_RE = /(vdp|vehicle-?details?|\/vehicles?\/|inventory|\/new\/|\/used\/|search|about|contact|privacy|terms|condition|disclaimer|cookie|sitemap)/i;
const TU_ASSET_RE = /\.(jpe?g|png|gif|webp|svg|css|js|pdf|xml|json|ico|mp4|webm|woff2?|ttf|eot)(\?|#|$)/i;
// 17-char VIN pattern → typical of vehicle detail pages.
const TU_VIN_RE = /\/[A-HJ-NPR-Z0-9]{17}(\/|$)/i;

const tuNormalizeText = (raw) => {
  if (!raw) return "";
  return raw
    .replace(/&amp;/gi, "&")
    .replace(/&#0?38;/g, "&")
    .replace(/\s+/g, " ") // collapse line breaks + multiple spaces → single space
    .trim();
};

const tuIsEligible = (href) => {
  try {
    const { pathname } = new URL(href);
    if (TU_ASSET_RE.test(pathname)) return false;
    if (TU_VIN_RE.test(pathname)) return false;
    if (TU_EXCLUDE_RE.test(pathname)) return false;
    return true;
  } catch {
    return false;
  }
};

// Fisher–Yates shuffle then slice — random selection without bias.
const tuPickRandom = (arr, n) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
};

// Fetch raw text, preferring the Puppeteer page context (to reuse cookies /
// bypass Cloudflare), falling back to node-fetch.
const tuFetchRaw = async (target, page) => {
  if (page) {
    try {
      const html = await page.evaluate(async (u) => {
        try {
          const r = await fetch(u);
          if (!r.ok) return null;
          return await r.text();
        } catch {
          return null;
        }
      }, target);
      if (html) return html;
    } catch {
      // fall through to node-fetch
    }
  }
  try {
    const r = await fetch(target, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      redirect: "follow",
      signal: AbortSignal.timeout(7000),
    });
    if (r.ok) return await r.text();
  } catch {
    // ignore
  }
  return null;
};

const tuExtractLocs = (xml) => {
  const locs = [];
  const re = /<loc>\s*([\s\S]*?)\s*<\/loc>/gi;
  let m;
  while ((m = re.exec(xml))) {
    const v = m[1].trim();
    if (v) locs.push(v);
  }
  return locs;
};

// Collect candidate URLs from sitemap XML (resolving a sitemap index by
// fetching a few child sitemaps), or [] if not a usable sitemap.
const tuUrlsFromSitemap = async (sitemapContent, page) => {
  if (!sitemapContent) return [];
  const lower = sitemapContent.toLowerCase();
  if (lower.includes("<sitemapindex")) {
    const children = tuExtractLocs(sitemapContent).slice(0, 3);
    const urls = [];
    for (const child of children) {
      const xml = await tuFetchRaw(child, page);
      if (xml) urls.push(...tuExtractLocs(xml));
      if (urls.length > 300) break;
    }
    return urls;
  }
  if (lower.includes("<urlset")) {
    return tuExtractLocs(sitemapContent);
  }
  return [];
};

// Fallback: collect internal links by crawling the current (home) page DOM.
const tuUrlsFromHomepage = ($, baseUrl) => {
  let origin;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return [];
  }
  const out = [];
  $("a[href]").each((i, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const abs = new URL(href, baseUrl);
      if (abs.origin !== origin) return;
      abs.hash = "";
      out.push(abs.href);
    } catch {
      // skip invalid hrefs
    }
  });
  return out;
};

const tuExtractTitle = (html) => {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (!m) return null;
  const norm = tuNormalizeText(m[1]);
  return norm.length ? norm : null;
};

const tuExtractMetaDescription = (html) => {
  const metaTags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of metaTags) {
    if (/\bname\s*=\s*["']description["']/i.test(tag)) {
      const m = tag.match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i);
      if (m) {
        const norm = tuNormalizeText(m[1] ?? m[2] ?? "");
        return norm.length ? norm : null;
      }
    }
  }
  return null;
};

const tuExtractH1 = (html) => {
  const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  const text = tuNormalizeText(m[1].replace(/<[^>]+>/g, " "));
  return text.length ? text : null;
};

// Lightweight visible-text extraction (prefers <main>), capped for performance.
const tuExtractBodyText = (html) => {
  let h = html;
  const mainMatch = h.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) h = mainMatch[1];
  const text = h
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return tuNormalizeText(text).slice(0, 5000);
};

// Derive a target keyword for a page — URL slug first, then H1, then the most
// frequent significant word in the main content (mirrors the spec's methods).
const tuKeywordFromSlug = (pageUrl) => {
  try {
    const { pathname } = new URL(pageUrl);
    const segs = pathname.split("/").filter(Boolean);
    if (!segs.length) return [];
    const last = segs[segs.length - 1].replace(/\.(html?|php|aspx?)$/i, "");
    return last
      .split(/[-_]+/)
      .map((t) => t.toLowerCase())
      .filter((t) => t.length > 2 && !stopWords.has(t) && !/^\d+$/.test(t));
  } catch {
    return [];
  }
};

const tuDeriveKeyword = (page) => {
  // Method 1 — URL slug.
  let tokens = tuKeywordFromSlug(page.url);
  if (tokens.length) return { tokens, source: "url" };

  // Method 2 — Page H1.
  if (page.h1) {
    tokens = cleanText(page.h1).slice(0, 3);
    if (tokens.length) return { tokens, source: "h1" };
  }

  // Method 3 — Most frequent significant words in main content.
  if (page.bodyText) {
    const words = cleanText(page.bodyText);
    const freq = {};
    words.forEach((w) => { freq[w] = (freq[w] || 0) + 1; });
    const top = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map((e) => e[0]);
    if (top.length) return { tokens: top, source: "content" };
  }

  return { tokens: [], source: "none" };
};

// Loose match: direct substring or a stemmed substring so "finance" matches
// "Financing" and "specials" matches "Special Offers".
const tuStem = (w) => w.replace(/(ing|ed|es|s|e)$/i, "");
const tuTitleHasKeyword = (title, tokens) => {
  if (!title || !tokens.length) return false;
  const t = title.toLowerCase();
  return tokens.some((tok) => {
    const k = tok.toLowerCase();
    if (k.length >= 3 && t.includes(k)) return true;
    const stem = tuStem(k);
    return stem.length >= 4 && t.includes(stem);
  });
};

// ── Location helpers (Title Location Optimization) ──────────────────────────
const TU_STATES = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi",
  MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire",
  NJ: "New Jersey", NM: "New Mexico", NY: "New York", NC: "North Carolina",
  ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming", DC: "District of Columbia",
};
const TU_STATE_BY_NAME = Object.fromEntries(
  Object.entries(TU_STATES).map(([abbr, name]) => [name.toLowerCase(), abbr])
);

// Walk parsed JSON-LD looking for a postal address (LocalBusiness etc.).
const tuFindSchemaAddress = (node) => {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) {
    for (const n of node) {
      const r = tuFindSchemaAddress(n);
      if (r) return r;
    }
    return null;
  }
  const fromAddrObj = (a) => {
    if (a && typeof a === "object" && !Array.isArray(a)) {
      const city = a.addressLocality || a.addresslocality;
      const state = a.addressRegion || a.addressregion;
      if (city || state) {
        return {
          city: city ? String(city).trim() : null,
          state: state ? String(state).trim() : null,
        };
      }
    }
    return null;
  };
  if (node.address) {
    if (Array.isArray(node.address)) {
      for (const a of node.address) {
        const r = fromAddrObj(a);
        if (r) return r;
      }
    } else {
      const r = fromAddrObj(node.address);
      if (r) return r;
    }
  }
  const direct = fromAddrObj(node);
  if (direct) return direct;
  for (const k of Object.keys(node)) {
    const r = tuFindSchemaAddress(node[k]);
    if (r) return r;
  }
  return null;
};

// Parse a US-style "City, ST ZIP" (or full state name) out of free text.
const tuParseUsAddress = (text) => {
  if (!text) return null;
  const abbr = text.match(/(?:^|,)\s*([A-Za-z][A-Za-z .'-]{1,40}?)\s*,\s*([A-Z]{2})\b\s*(?:\d{5})?/);
  if (abbr && TU_STATES[abbr[2].toUpperCase()]) {
    return { city: abbr[1].trim(), state: abbr[2].toUpperCase() };
  }
  const names = Object.values(TU_STATES).join("|");
  const full = text.match(
    new RegExp(`(?:^|,)\\s*([A-Za-z][A-Za-z .'-]{1,40}?)\\s*,\\s*(${names})\\b`, "i")
  );
  if (full) {
    const stateName = full[2];
    return {
      city: full[1].trim(),
      state: TU_STATE_BY_NAME[stateName.toLowerCase()] || null,
      stateName,
    };
  }
  return null;
};

// Does the title mention the city or state? Abbreviations are matched
// case-sensitively (uppercase) to avoid false hits on words like "in"/"or".
const tuTitleHasLocation = (title, loc) => {
  if (!title || !loc) return { found: false, hits: [] };
  const t = title.toLowerCase();
  const hits = [];
  if (loc.city && loc.city.length > 2 && t.includes(loc.city.toLowerCase())) {
    hits.push(loc.city);
  }
  if (loc.state) {
    if (new RegExp(`\\b${loc.state.toUpperCase()}\\b`).test(title)) hits.push(loc.state);
    const full = TU_STATES[loc.state.toUpperCase()];
    if (full && t.includes(full.toLowerCase())) hits.push(full);
  }
  if (loc.stateName && t.includes(loc.stateName.toLowerCase())) hits.push(loc.stateName);
  return { found: hits.length > 0, hits: [...new Set(hits)] };
};

// Find a same-origin "Contact" page link on the current page.
const tuFindContactUrl = ($, baseUrl) => {
  let origin;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return null;
  }
  let found = null;
  $("a[href]").each((i, el) => {
    if (found) return;
    const href = $(el).attr("href") || "";
    const text = ($(el).text() || "").toLowerCase();
    if (/contact/i.test(href) || /contact/.test(text)) {
      try {
        const abs = new URL(href, baseUrl);
        if (abs.origin === origin) found = abs.href;
      } catch {
        // skip
      }
    }
  });
  return found;
};

// Sample up to 5 eligible internal pages ONCE, extracting the title, meta
// description, H1 and main-content text from each. Shared by the title- and
// meta-description uniqueness checks and the keyword-optimization check so the
// same pages are fetched only one time.
const tuSamplePages = async (url, $, page, sitemapContent = null) => {
  try {
    let origin;
    try {
      origin = new URL(url).origin;
    } catch {
      return { ok: false, reason: "Invalid base URL", results: [] };
    }

    // 1️⃣ Gather candidate URLs — prefer sitemap, else crawl homepage.
    let candidates = await tuUrlsFromSitemap(sitemapContent, page);
    if (!candidates.length) candidates = tuUrlsFromHomepage($, url);

    // 2️⃣ Filter: same-origin, dedupe, drop excluded / asset URLs.
    const seen = new Set();
    const eligible = [];
    for (const c of candidates) {
      let abs;
      try {
        abs = new URL(c, url);
      } catch {
        continue;
      }
      if (abs.origin !== origin) continue;
      abs.hash = "";
      const clean = abs.href;
      if (seen.has(clean)) continue;
      if (!tuIsEligible(clean)) continue;
      seen.add(clean);
      eligible.push(clean);
    }

    if (!eligible.length) {
      return {
        ok: false,
        reason:
          "No eligible content pages were found (after excluding inventory, vehicle detail, about, contact and legal pages) to compare across the site.",
        results: [],
      };
    }

    // 3️⃣ Eligible < 5 → use all; else randomly select 5.
    const selected = eligible.length <= 5 ? eligible : tuPickRandom(eligible, 5);

    // 4️⃣ Visit each page once; extract + normalize title AND meta description.
    const results = [];
    for (const target of selected) {
      const html = await tuFetchRaw(target, page);
      results.push({
        url: target,
        title: html ? tuExtractTitle(html) : null,
        metaDescription: html ? tuExtractMetaDescription(html) : null,
        h1: html ? tuExtractH1(html) : null,
        bodyText: html ? tuExtractBodyText(html) : null,
      });
    }

    return { ok: true, results };
  } catch (e) {
    return { ok: false, reason: e.message, results: [] };
  }
};

// Generic uniqueness scorer driven by which field of the sample to evaluate.
// cfg = { field: "title"|"metaDescription", noun: "title", tag: "<title> tag" }
const tuScoreUniqueness = (sample, cfg) => {
  const { field, noun, tag } = cfg;

  if (!sample || !sample.ok) {
    return evaluateParameter(0.5, `Not enough eligible pages to compare ${noun}s`, {
      pagesChecked: 0,
      found: 0,
      uniqueCount: 0,
      duplicateCount: 0,
      missingCount: 0,
      values: [],
      results: [],
      statusLabel: "Inconclusive",
      why_this_occurred:
        (sample && sample.reason) ||
        `No eligible content pages were found to evaluate ${noun} uniqueness across the site.`,
      how_to_fix: `Expose crawlable content pages through a valid sitemap.xml or homepage navigation so ${noun}s can be compared.`,
    });
  }

  // Project the sampled pages onto the field we're scoring.
  const results = sample.results.map((r) => ({ url: r.url, value: r[field] || null }));
  const pagesChecked = results.length;
  const found = results.filter((r) => r.value);
  const foundCount = found.length;
  const missingCount = pagesChecked - foundCount;

  // All values missing → score 0.
  if (foundCount === 0) {
    return evaluateParameter(0, `All sampled pages are missing a ${tag}`, {
      pagesChecked,
      found: 0,
      uniqueCount: 0,
      duplicateCount: 0,
      missingCount,
      values: [],
      results,
      statusLabel: "Critical",
      why_this_occurred: `None of the ${pagesChecked} sampled page(s) returned a usable ${tag}.`,
      how_to_fix: `Add a unique, descriptive ${tag} to every page on the site.`,
    });
  }

  // Count unique values (case-insensitive). Missing values count against.
  const uniqueCount = new Set(found.map((r) => r.value.toLowerCase())).size;
  const duplicateCount = foundCount - uniqueCount;

  // Score = uniqueValues / pagesChecked (5 unique of 5 → 100).
  const score = uniqueCount / pagesChecked;
  const scorePct = Math.round(score * 100);

  let statusLabel;
  if (scorePct >= 100) statusLabel = "Excellent";
  else if (scorePct >= 80) statusLabel = "Good";
  else if (scorePct >= 60) statusLabel = "Fair";
  else if (scorePct >= 40) statusLabel = "Needs Improvement";
  else statusLabel = "Poor";

  const issues = [];
  if (duplicateCount > 0) issues.push(`${duplicateCount} duplicate ${noun}(s)`);
  if (missingCount > 0) issues.push(`${missingCount} missing ${noun}(s)`);

  const details =
    score === 1
      ? `All ${pagesChecked} sampled pages have unique ${noun}s`
      : `Checked ${pagesChecked} pages — ${uniqueCount} unique${
          issues.length ? ` (${issues.join(", ")})` : ""
        }`;

  const explanation =
    score === 1
      ? `Sampled ${pagesChecked} content pages and every ${noun} was unique.`
      : `Out of ${pagesChecked} sampled pages, only ${uniqueCount} ${noun}(s) were unique${
          issues.length ? ` — ${issues.join(" and ")}` : ""
        }. Duplicate or missing ${noun}s weaken keyword targeting and confuse search engines.`;

  const recommendation =
    score === 1
      ? `Maintain a unique, descriptive ${tag} for every page.`
      : `Give each page a distinct ${tag} that reflects its specific content, and ensure none are left empty.`;

  return evaluateParameter(score, details, {
    pagesChecked,
    found: foundCount,
    uniqueCount,
    duplicateCount,
    missingCount,
    values: found.map((r) => r.value),
    results,
    statusLabel,
    why_this_occurred: explanation,
    how_to_fix: recommendation,
  });
};

const checkTitleUniqueness = (sample) =>
  tuScoreUniqueness(sample, { field: "title", noun: "title", tag: "<title> tag" });

const checkMetaDescriptionUniqueness = (sample) =>
  tuScoreUniqueness(sample, {
    field: "metaDescription",
    noun: "meta description",
    tag: "meta description",
  });

// Title Keyword Optimization — for each sampled page derive a target keyword
// (URL → H1 → main content) and check whether the <title> contains it.
// Score = optimized pages / pages checked (4 of 5 → 80).
const checkTitleKeywordOptimization = (sample) => {
  if (!sample || !sample.ok) {
    return evaluateParameter(0.5, "Not enough eligible pages to check keyword optimization", {
      pagesChecked: 0,
      optimizedCount: 0,
      results: [],
      statusLabel: "Inconclusive",
      why_this_occurred:
        (sample && sample.reason) ||
        "No eligible content pages were found to evaluate title keyword optimization across the site.",
      how_to_fix:
        "Expose crawlable content pages through a valid sitemap.xml or homepage navigation so titles can be evaluated.",
    });
  }

  const results = sample.results.map((r) => {
    const { tokens, source } = tuDeriveKeyword(r);
    const optimized = tuTitleHasKeyword(r.title, tokens);
    return {
      url: r.url,
      title: r.title || null,
      keyword: tokens.join(" ") || null,
      source,
      optimized,
    };
  });

  const pagesChecked = results.length;
  const optimizedCount = results.filter((r) => r.optimized).length;
  const score = pagesChecked ? optimizedCount / pagesChecked : 0;
  const scorePct = Math.round(score * 100);

  let statusLabel;
  if (scorePct >= 100) statusLabel = "Excellent";
  else if (scorePct >= 80) statusLabel = "Good";
  else if (scorePct >= 60) statusLabel = "Fair";
  else if (scorePct >= 40) statusLabel = "Needs Improvement";
  else statusLabel = "Poor";

  const details =
    score === 1
      ? `All ${pagesChecked} sampled titles include their target keyword`
      : `Checked ${pagesChecked} pages — ${optimizedCount} title(s) include the target keyword`;

  const explanation =
    score === 1
      ? `Every one of the ${pagesChecked} sampled pages has a title that includes its target keyword.`
      : `Only ${optimizedCount} of ${pagesChecked} sampled pages have a title that includes the page's target keyword (derived from the URL, H1 or main content). Titles missing their keyword rank weaker for the terms the page is about.`;

  const recommendation =
    score === 1
      ? "Keep including each page's primary keyword naturally in its <title> tag."
      : "Include each page's primary keyword (what the page is actually about) near the start of its <title> tag.";

  return evaluateParameter(score, details, {
    pagesChecked,
    optimizedCount,
    results,
    statusLabel,
    why_this_occurred: explanation,
    how_to_fix: recommendation,
  });
};

// Title Location Optimization — determine the dealership's city/state (from
// LocalBusiness schema → footer → contact page) and check whether the home
// page <title> mentions it. Binary: location in title → 100, else 0.
const checkTitleLocationOptimization = async (url, $, page, titleText, structuredData) => {
  try {
    const title = titleText || ($("title").first().text() || "").trim();

    let loc = null;
    let source = null;

    // 1️⃣ LocalBusiness schema (most reliable).
    if (structuredData) {
      const s = tuFindSchemaAddress(structuredData);
      if (s && (s.city || s.state)) {
        loc = s;
        source = "schema";
      }
    }

    // 2️⃣ Footer address.
    if (!loc) {
      const footerText = tuNormalizeText($("footer").text() || "");
      const f = tuParseUsAddress(footerText);
      if (f) {
        loc = f;
        source = "footer";
      }
    }

    // 3️⃣ Contact page address.
    if (!loc) {
      const contactUrl = tuFindContactUrl($, url);
      if (contactUrl) {
        const html = await tuFetchRaw(contactUrl, page);
        if (html) {
          const c = tuParseUsAddress(tuExtractBodyText(html));
          if (c) {
            loc = c;
            source = "contact";
          }
        }
      }
    }

    // 4️⃣ Last resort — scan the whole page body text.
    if (!loc) {
      const b = tuParseUsAddress(tuNormalizeText($("body").text() || ""));
      if (b) {
        loc = b;
        source = "page";
      }
    }

    if (!loc || (!loc.city && !loc.state)) {
      return evaluateParameter(0.5, "Dealership location could not be determined", {
        title,
        locationFound: false,
        statusLabel: "Inconclusive",
        why_this_occurred:
          "Could not determine the dealership's city/state from LocalBusiness schema, the footer, or a contact page.",
        how_to_fix:
          "Add a LocalBusiness schema with a complete postal address and display your city & state in the site footer.",
      });
    }

    const match = tuTitleHasLocation(title, loc);
    const score = match.found ? 1 : 0;
    const locStr = [loc.city, loc.stateName || loc.state].filter(Boolean).join(", ");

    const details = match.found
      ? `Title includes the dealership location (${locStr})`
      : `Title is missing the dealership location (${locStr})`;

    const explanation = match.found
      ? `The home page title references the dealership location: ${match.hits.join(", ")}.`
      : `The dealership is located in ${locStr}, but the home page title does not mention the city or state, weakening local search relevance.`;

    const recommendation = match.found
      ? "Keep your city/state in the title to reinforce local relevance."
      : `Add your city and/or state (e.g. "${locStr}") to the home page <title> to capture local search traffic.`;

    return evaluateParameter(score, details, {
      title,
      city: loc.city || null,
      state: loc.state || null,
      stateName: loc.stateName || (loc.state ? TU_STATES[loc.state.toUpperCase()] : null),
      location: locStr,
      source,
      matched: match.hits,
      locationFound: true,
      statusLabel: match.found ? "Excellent" : "Poor",
      why_this_occurred: explanation,
      how_to_fix: recommendation,
    });
  } catch (e) {
    return evaluateParameter(0, "Title location optimization check failed", {
      error: e.message,
    });
  }
};

// ── Service Content Quality (0–10) ──────────────────────────────────────────
// Finds the site's service page, then scores it across 4 checks
// (description, content length, booking, pre-service info), each worth 0–2.
const TU_SERVICE_RE = /(\bservices?\b|consultation|treatment|repair|install|support|booking|\bbook\b|appointment|schedule|maintenance|detailing|body-?shop|oil-?change)/i;
const TU_NON_SERVICE_RE = /(blog|news|about|contact|privacy|terms|career|inventory|vehicle|\.(jpe?g|png|gif|webp|pdf|xml|css|js))/i;

const tuFindServicePage = (candidates) => {
  let best = null;
  let bestScore = -1;
  for (const u of candidates) {
    let path;
    try {
      path = new URL(u).pathname.toLowerCase();
    } catch {
      continue;
    }
    if (TU_NON_SERVICE_RE.test(path)) continue;
    if (!TU_SERVICE_RE.test(path)) continue;
    const segs = path.split("/").filter(Boolean);
    const last = segs[segs.length - 1] || "";
    let s;
    if (/^services?$/.test(last)) s = 100 - path.length;
    else if (/services?/.test(last)) s = 80 - path.length;
    else if (TU_SERVICE_RE.test(last)) s = 60 - path.length;
    else s = 40 - path.length;
    if (s > bestScore) {
      bestScore = s;
      best = u;
    }
  }
  return best;
};

const checkServiceContentQuality = async (url, $, page, sitemapContent = null) => {
  try {
    // 1️⃣ Gather candidate URLs (sitemap + homepage nav + current page).
    let origin;
    try {
      origin = new URL(url).origin;
    } catch {
      return evaluateParameter(0, "Service Page Not Found", {
        score10: 0, maxScore: 10, serviceFound: false,
        failureReasons: ["No Service Page Found"],
        statusLabel: "Critical",
        why_this_occurred: "The site URL could not be parsed to locate a service page.",
        how_to_fix: "Publish a dedicated service page describing your services.",
      });
    }

    const candidateSet = new Set();
    const fromSitemap = await tuUrlsFromSitemap(sitemapContent, page);
    [...fromSitemap, ...tuUrlsFromHomepage($, url), url].forEach((c) => {
      try {
        const abs = new URL(c, url);
        if (abs.origin === origin) {
          abs.hash = "";
          candidateSet.add(abs.href);
        }
      } catch {
        // skip
      }
    });

    const servicePageUrl = tuFindServicePage([...candidateSet]);

    // 2️⃣ No service page → score 0.
    if (!servicePageUrl) {
      return evaluateParameter(0, "Service Page Not Found", {
        score10: 0, maxScore: 10, serviceFound: false,
        failureReasons: ["No Service Page Found"],
        statusLabel: "Critical",
        why_this_occurred:
          "No dedicated service page (services, consultation, repair, booking, appointment, etc.) was found in the site's navigation or sitemap.",
        how_to_fix:
          "Create a dedicated service page that explains your services, who they're for, and how to book.",
      });
    }

    // 3️⃣ Fetch & parse the service page.
    const html = await tuFetchRaw(servicePageUrl, page);
    if (!html) {
      return evaluateParameter(0, "Service page could not be loaded", {
        score10: 0, maxScore: 10, serviceFound: true, servicePageUrl,
        failureReasons: ["Service page could not be loaded"],
        statusLabel: "Critical",
        why_this_occurred: `A service page was found (${servicePageUrl}) but its content could not be retrieved.`,
        how_to_fix: "Ensure the service page is publicly accessible and not blocking crawlers.",
      });
    }

    const $$ = cheerio.load(html);
    const title = ($$("title").first().text() || "").trim();
    const h1 = ($$("h1").first().text() || "").trim();

    // Interactive elements (CTAs) from the FULL document.
    const interactive = [];
    $$("a, button, input[type=submit], input[type=button], [role=button]").each((i, el) => {
      const txt = ($$(el).text() || $$(el).attr("value") || "").trim();
      if (txt) interactive.push(txt);
    });
    const ctaBlob = interactive.join(" | ").toLowerCase();

    // Forms (full document) + booking-form detection.
    const formCount = $$("form").length;
    let hasBookingForm = false;
    $$("form").each((i, el) => {
      const attrs = [
        $$(el).attr("action"), $$(el).attr("id"),
        $$(el).attr("class"), $$(el).attr("name"),
      ].filter(Boolean).join(" ");
      const ftext = $$(el).text().toLowerCase();
      if (/appoint|book|schedul|reserv/i.test(attrs) || /appointment|book now|schedule/i.test(ftext)) {
        hasBookingForm = true;
      }
    });
    const hasCalendly = /calendly|acuityscheduling|youcanbook|cal\.com\/|squareup\.com\/appointments|setmore|simplybook/i.test(html);
    const hasFaqSchema = /"@type"\s*:\s*"FAQPage"/i.test(html) || $$('[itemtype*="FAQPage" i]').length > 0;

    // Headings (full document) for FAQ / section detection.
    const headingsBlob = $$("h1,h2,h3,h4,h5,h6")
      .map((i, el) => $$(el).text().trim())
      .get()
      .join(" | ")
      .toLowerCase();

    // Visible content (exclude chrome) for word count + section keywords.
    const $body = cheerio.load(html);
    $body("script, style, noscript, header, footer, nav, [role=navigation]").remove();
    const contentText = ($body("body").text() || "").replace(/\s+/g, " ").trim();
    const contentLower = contentText.toLowerCase();
    const wordCount = contentText ? contentText.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length : 0;
    const listItems = $body("ul li, ol li").length;

    // ── CHECK 1: Service Description (0–2) ──
    const hasWhat = !!h1 && wordCount >= 40;
    const hasBenefits =
      /benefit|features?|why choose|advantage|guarantee|certified|expert|trusted|quality|professional|warrant|reliable/i.test(contentLower) ||
      listItems >= 3;
    const hasWho =
      /for (you|your|drivers|customers|owners|families|businesses|clients)|ideal for|designed for|whether you|all makes|any (vehicle|model|car)|perfect for|suited (for|to)|tailored (for|to)/i.test(contentLower);
    const descAspects = [hasWhat, hasBenefits, hasWho].filter(Boolean).length;
    const descMark = descAspects >= 2 ? 2 : descAspects === 1 ? 1 : 0;

    // ── CHECK 2: Content Length (0–2) ──
    const lengthMark = wordCount >= 150 ? 2 : wordCount >= 75 ? 1 : 0;

    // ── CHECK 3: Appointment / Booking (0–2) ──
    const BOOKING_RE = /(book\s*(now|an?\s*appointment|online|service)|schedule\s*(service|consultation|appointment|now|online|a\s*visit)|request\s*(service|an?\s*appointment|a\s*quote)|make\s*an?\s*appointment|reserve\s*(your|a)|appointment|book\s*now)/i;
    const hasBookingSystem = hasCalendly || hasBookingForm || BOOKING_RE.test(ctaBlob);
    let bookingMark, bookingType;
    if (hasBookingSystem) {
      bookingMark = 2;
      bookingType = "Appointment/Booking system";
    } else if (formCount > 0) {
      bookingMark = 1;
      bookingType = "Contact form only";
    } else {
      bookingMark = 0;
      bookingType = "No booking option";
    }

    // ── CHECK 4: Pre-Service Information (0–2) ──
    const sectionBlob = `${contentLower} ${headingsBlob}`;
    const sections = {
      process: /how it works|our process|the process|what to expect|step-by-step|step\s*\d|steps\b/i.test(sectionBlob),
      timeline: /timeline|turnaround|how long|duration|estimated time|same.?day|within \d+ (hours|days)/i.test(sectionBlob),
      pricing: /pricing|packages|price list|\$\s?\d|cost estimate|our rates|fees?\b|quote/i.test(sectionBlob),
      requirements: /requirements?|what you need|what to bring|eligibility|prerequisite|before your (visit|appointment|service)/i.test(sectionBlob),
      faq: /faq|frequently asked|common questions/i.test(headingsBlob) || hasFaqSchema || $body("details").length > 0,
    };
    const sectionsFound = Object.entries(sections).filter(([, v]) => v).map(([k]) => k);
    const preMark = sectionsFound.length >= 2 ? 2 : sectionsFound.length === 1 ? 1 : 0;

    // ── Final score: raw 0–8 scaled to 0–10 ──
    const rawScore = descMark + lengthMark + bookingMark + preMark;
    const score10 = Math.round((rawScore / 8) * 10);
    const fraction = rawScore / 8;

    // Failure reasons.
    const failureReasons = [];
    if (descMark === 0) failureReasons.push("Service description missing (does not explain what the service is, its benefits, or who it's for)");
    else if (descMark === 1) failureReasons.push("Service description is only partial");
    if (wordCount < 75) failureReasons.push("Content is too thin (under 75 words)");
    else if (wordCount < 150) failureReasons.push("Content is below the 150-word recommendation");
    if (bookingMark === 0) failureReasons.push("No appointment/booking option found");
    else if (bookingMark === 1) failureReasons.push("Only a generic contact form (no dedicated booking option)");
    if (preMark === 0) failureReasons.push("No process, pricing, requirements, or FAQ information found");
    else if (preMark === 1) failureReasons.push("Only one pre-service info section found (process, pricing, requirements, or FAQ)");

    let statusLabel;
    if (score10 >= 9) statusLabel = "Excellent";
    else if (score10 >= 7) statusLabel = "Good";
    else if (score10 >= 5) statusLabel = "Fair";
    else if (score10 >= 3) statusLabel = "Needs Improvement";
    else statusLabel = "Poor";

    const details = `Service content quality: ${score10}/10`;
    const explanation =
      score10 >= 9
        ? `The service page (${servicePageUrl}) is comprehensive across description, depth, booking and pre-service information.`
        : `The service page scored ${score10}/10. ${failureReasons.length ? failureReasons.join("; ") + "." : ""}`;
    const recommendation =
      score10 >= 9
        ? "Maintain the depth and booking experience on your service page."
        : "Strengthen the weak areas: explain the service fully, exceed 150 words, offer a clear booking/appointment option, and add process, pricing, requirements or FAQs.";

    return evaluateParameter(fraction, details, {
      score10,
      maxScore: 10,
      rawScore,
      serviceFound: true,
      servicePageUrl,
      pageTitle: title || null,
      h1: h1 || null,
      wordCount,
      checks: {
        serviceDescription: { mark: descMark, max: 2, hasWhat, hasBenefits, hasWho },
        contentLength: { mark: lengthMark, max: 2, wordCount },
        booking: { mark: bookingMark, max: 2, type: bookingType, formCount },
        preServiceInfo: { mark: preMark, max: 2, sectionsFound },
      },
      failureReasons,
      statusLabel,
      why_this_occurred: explanation,
      how_to_fix: recommendation,
    });
  } catch (e) {
    return evaluateParameter(0, "Service content quality check failed", {
      score10: 0, maxScore: 10, serviceFound: false,
      failureReasons: ["Check failed: " + e.message],
      error: e.message,
    });
  }
};

// ── Content Depth + Uniqueness + Relevance (0–10) ───────────────────────────
const TU_AUTO_BRANDS = [
  "toyota", "honda", "ford", "chevrolet", "chevy", "nissan", "hyundai", "kia",
  "jeep", "ram", "dodge", "chrysler", "gmc", "buick", "cadillac", "subaru",
  "mazda", "volkswagen", "vw", "bmw", "mercedes", "audi", "lexus", "acura",
  "infiniti", "volvo", "porsche", "jaguar", "land rover", "mitsubishi",
  "lincoln", "tesla", "genesis", "fiat", "alfa romeo", "mini", "maserati",
];
const TU_DEPTH_THRESHOLDS = { srp: 150, vdp: 200, service: 150, tradein: 150, about: 200, contact: 100, other: 150 };
const TU_TYPE_LABELS = { srp: "SRP (Inventory)", vdp: "VDP (Vehicle)", service: "Service", tradein: "Trade-In", about: "About Us", contact: "Contact Us", other: "Content" };
const TU_FILLER_RE = /lorem ipsum|welcome to our website|quality service to our customers|the best solutions|we provide quality|your one.?stop|industry.?leading solutions|committed to excellence/i;

const tuClassifyPageType = (u) => {
  let path;
  try {
    path = new URL(u).pathname.toLowerCase();
  } catch {
    return null;
  }
  if (/\/contact/.test(path)) return "contact";
  if (/\/about|meet-the-team|our-story|dealership-info|who-we-are/.test(path)) return "about";
  if (/trade.?in|value-your-trade|sell-(us-)?your-(car|vehicle)|appraisal/.test(path)) return "tradein";
  if (/service|schedule-service|auto-repair|maintenance/.test(path)) return "service";
  if (TU_VIN_RE.test(path)) return "vdp";
  if (/\/(vehicle|vehicles|vdp)\//.test(path) && /\d{4,}/.test(path)) return "vdp";
  if (/-\d{4}-/.test(path) && /\/(new|used|inventory|vehicle)/.test(path)) return "vdp";
  if (/inventory|\/new\b|\/used\b|\/search|vehicles?(\/|$)|for-sale/.test(path)) return "srp";
  return null;
};

const tuFingerprint = (words, k = 4) => {
  const set = new Set();
  for (let i = 0; i + k <= words.length; i++) set.add(words.slice(i, i + k).join(" "));
  if (!set.size && words.length) set.add(words.join(" "));
  return set;
};
const tuJaccard = (a, b) => {
  if (!a.size || !b.size) return 0;
  const [small, big] = a.size < b.size ? [a, b] : [b, a];
  let inter = 0;
  for (const x of small) if (big.has(x)) inter++;
  return inter / (a.size + b.size - inter);
};

// Per-type mandatory mentions ("Fail if only generic content").
const tuSpecialValidation = (type, blob) => {
  switch (type) {
    case "srp": {
      const hasBrand = TU_AUTO_BRANDS.some((b) => blob.includes(b));
      const hasCat = /inventory|new|used|sedan|suv|truck|crossover|coupe|hatchback|van|lease|in stock|browse|for sale/i.test(blob);
      return { pass: hasBrand && hasCat, need: "vehicle category, brand & inventory info" };
    }
    case "vdp": {
      const ok = /engine|mpg|horsepower|transmission|mileage|\bvin\b|\btrim\b|features|specifications?|interior|exterior|drivetrain|warranty/i.test(blob);
      return { pass: ok, need: "vehicle model, features & specifications" };
    }
    case "service": {
      const ok = /oil change|brake|tire|maintenance|repair|diagnostic|inspection|alignment|battery|transmission|coolant|process|how it works/i.test(blob);
      return { pass: ok, need: "specific service, process & benefits" };
    }
    case "tradein": {
      const ok = /trade.?in|valuation|appraisal|kelley blue book|\bkbb\b|value your|trade.?in offer|estimate your/i.test(blob);
      return { pass: ok, need: "trade-in process, valuation & instructions" };
    }
    case "about": {
      const ok = /since \d{4}|founded|established|history|mission|our team|family.?owned|locally owned|our story/i.test(blob);
      return { pass: ok, need: "dealer name, history, mission, team & location" };
    }
    case "contact": {
      const hasPhone = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(blob);
      const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(blob);
      const hasAddr = !!tuParseUsAddress(blob);
      return { pass: hasPhone && (hasEmail || hasAddr), need: "business name, address, phone & email" };
    }
    default:
      return { pass: true, need: "" };
  }
};

const checkContentDepthQuality = async (url, $, page, sitemapContent = null) => {
  try {
    let origin, host;
    try {
      const parsed = new URL(url);
      origin = parsed.origin;
      host = parsed.hostname;
    } catch {
      return evaluateParameter(0, "Content quality check failed", {
        score10: 0, maxScore: 10, pagesAnalyzed: 0,
        failureReasons: ["Invalid site URL"],
        statusLabel: "Critical",
      });
    }

    // Domain brand tokens (for dealer-name relevance).
    const domainTokens = host
      .replace(/^www\./, "")
      .split(".")[0]
      .split(/[^a-z0-9]+/i)
      .filter((t) => t.length > 3)
      .map((t) => t.toLowerCase());

    // ── Source candidate URLs SITEMAP-FIRST, homepage nav only as a fallback. ──
    // Each source is classified separately so a sitemap URL is always preferred
    // over a navigation link of the same type.
    const toSameOrigin = (list) => {
      const out = [];
      const seen = new Set();
      for (const c of list || []) {
        try {
          const abs = new URL(c, url);
          if (abs.origin !== origin) continue;
          abs.hash = "";
          if (!seen.has(abs.href)) { seen.add(abs.href); out.push(abs.href); }
        } catch { /* skip invalid href */ }
      }
      return out;
    };
    const classifyByType = (urls) => {
      const m = {};
      for (const u of urls) {
        const t = tuClassifyPageType(u);
        if (!t) continue;
        (m[t] = m[t] || []).push(u);
      }
      return m;
    };
    const sitemapByType = classifyByType(toSameOrigin(await tuUrlsFromSitemap(sitemapContent, page)));
    const homepageByType = classifyByType(toSameOrigin(tuUrlsFromHomepage($, url)));

    // Ordered candidates for a type: sitemap URLs first (shortest = most
    // canonical first), then homepage URLs, deduped.
    const byLength = (a, b) => a.length - b.length;
    const candidatesFor = (t) => {
      const out = [];
      const seen = new Set();
      for (const u of [...(sitemapByType[t] || []).slice().sort(byLength),
                       ...(homepageByType[t] || []).slice().sort(byLength)]) {
        if (!seen.has(u)) { seen.add(u); out.push(u); }
      }
      return out;
    };

    const TYPES = ["contact", "about", "tradein", "service", "srp", "vdp"];
    if (!TYPES.some((t) => candidatesFor(t).length)) {
      return evaluateParameter(0.5, "No target content pages found", {
        score10: 0, maxScore: 10, pagesAnalyzed: 0, pages: [],
        failureReasons: ["No target pages (SRP, VDP, Service, Trade-In, About, Contact) found to analyze"],
        statusLabel: "Inconclusive",
        why_this_occurred:
          "Could not identify any target content pages (inventory, vehicle, service, trade-in, about or contact) in the site's navigation or sitemap.",
        how_to_fix: "Ensure key pages are crawlable via the sitemap and homepage navigation.",
      });
    }

    // Turn a fetched HTML doc into a scored-page input object.
    const extractPage = (type, pageUrl, html) => {
      const $b = cheerio.load(html);
      $b('script, style, noscript, header, footer, nav, [role=navigation], [class*="cookie" i], [id*="cookie" i], [class*="consent" i], [id*="consent" i], [class*="gdpr" i]').remove();
      const text = ($b("body").text() || "").replace(/\s+/g, " ").trim();
      const headings = $b("h1,h2,h3,h4,h5,h6").map((i, el) => $b(el).text().trim()).get().join(" | ");
      const tokens = text.toLowerCase().split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
      return { type, url: pageUrl, loaded: true, text, headings, wordCount: tokens.length, fp: tuFingerprint(tokens.slice(0, 2000)) };
    };

    // Fetch + extract, capped at 6 pages. For each type we try its candidates in
    // order and keep the FIRST that actually loads — so a dead URL that happens to
    // be in the sitemap (e.g. a 404 "/vehicle") is skipped in favour of a working
    // same-type page (e.g. "/vehicles"). Probing is capped per type.
    const MAX_PAGES = 6;
    const PROBE_PER_TYPE = 3;
    const pages = [];
    const usedUrls = new Set();

    for (const t of TYPES) {
      if (pages.length >= MAX_PAGES) break;
      let firstTried = null, added = false, tries = 0;
      for (const u of candidatesFor(t)) {
        if (usedUrls.has(u) || tries >= PROBE_PER_TYPE) continue;
        usedUrls.add(u);
        if (firstTried === null) firstTried = u;
        tries++;
        const html = await tuFetchRaw(u, page);
        if (html) { pages.push(extractPage(t, u, html)); added = true; break; }
      }
      // Every candidate we tried failed to load → record the attempt so the
      // report still shows what was tried (as "not loaded").
      if (!added && firstTried) pages.push({ type: t, url: firstTried, loaded: false });
    }

    // Fill extra VDP/SRP pages (needed for the uniqueness comparison), validating
    // each fetch and bounding how many dead URLs we probe.
    let extraTries = 0;
    for (const t of ["vdp", "srp"]) {
      for (const u of candidatesFor(t)) {
        if (pages.length >= MAX_PAGES || extraTries >= 5) break;
        if (usedUrls.has(u)) continue;
        usedUrls.add(u);
        extraTries++;
        const html = await tuFetchRaw(u, page);
        if (html) pages.push(extractPage(t, u, html));
      }
      if (pages.length >= MAX_PAGES || extraTries >= 5) break;
    }

    // Score each page.
    const loaded = pages.filter((p) => p.loaded);
    const aggReasons = new Set();

    const scored = pages.map((p) => {
      if (!p.loaded) {
        aggReasons.add("A target page could not be loaded");
        return { type: p.type, typeLabel: TU_TYPE_LABELS[p.type], url: p.url, loaded: false, score10: 0 };
      }

      const blob = `${p.text} ${p.headings}`.toLowerCase();
      const contentLower = p.text.toLowerCase();

      // CHECK 1 — Relevance.
      const hasBrand = TU_AUTO_BRANDS.some((b) => contentLower.includes(b));
      const hasLocation = !!tuParseUsAddress(p.text);
      const hasPhone = /(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/.test(p.text);
      const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(p.text);
      const hasYear = /\b(since|established|est\.?|founded(?: in)?|serving)\b[^.]{0,40}(19|20)\d{2}\b/i.test(contentLower);
      const hasDealerName = domainTokens.some((t) => contentLower.includes(t));
      const isFiller = TU_FILLER_RE.test(contentLower);
      const signalCount = [hasBrand, hasLocation, hasPhone || hasEmail, hasYear, hasDealerName].filter(Boolean).length;

      let relevanceMark;
      if (isFiller && signalCount < 2) relevanceMark = 0;
      else if (signalCount >= 3) relevanceMark = 2;
      else if (signalCount >= 1) relevanceMark = 1;
      else relevanceMark = 0;

      // Special validation can cap relevance (mandatory mentions missing).
      const special = tuSpecialValidation(p.type, blob);
      if (!special.pass) {
        relevanceMark = Math.min(relevanceMark, 1);
        aggReasons.add(`${TU_TYPE_LABELS[p.type]} is missing required content (${special.need})`);
      }

      // CHECK 2 — Depth.
      const threshold = TU_DEPTH_THRESHOLDS[p.type] || 150;
      const depthMark = p.wordCount >= threshold ? 2 : p.wordCount >= Math.round(threshold * 0.6) ? 1 : 0;

      // CHECK 3 — Uniqueness (vs other loaded pages).
      let maxSim = null;
      for (const other of loaded) {
        if (other.url === p.url) continue;
        const sim = tuJaccard(p.fp, other.fp);
        if (maxSim === null || sim > maxSim) maxSim = sim;
      }
      const uniquenessMark = maxSim === null ? 2 : maxSim < 0.3 ? 2 : maxSim <= 0.6 ? 1 : 0;

      // Page-level failure reasons → aggregate.
      if (relevanceMark === 0) aggReasons.add("Content appears generic and not dealer-specific");
      if (isFiller) aggReasons.add("Content contains filler or template text");
      if (!hasLocation && !hasBrand && !hasDealerName) aggReasons.add("Content lacks business/location references");
      if (depthMark === 0) aggReasons.add("Content below recommended word count");
      if (uniquenessMark === 0) aggReasons.add("Content appears duplicated across pages");
      if (!special.pass) aggReasons.add("Page lacks unique business information");

      const raw = relevanceMark + depthMark + uniquenessMark; // 0–6
      const score10 = Math.round((raw / 6) * 10);

      return {
        type: p.type,
        typeLabel: TU_TYPE_LABELS[p.type],
        url: p.url,
        loaded: true,
        wordCount: p.wordCount,
        threshold,
        relevance: relevanceMark,
        depth: depthMark,
        uniqueness: uniquenessMark,
        similarity: maxSim === null ? null : Math.round(maxSim * 100),
        specialPass: special.pass,
        raw,
        score10,
      };
    });

    const scoredLoaded = scored.filter((s) => s.loaded);
    const avg10 = scoredLoaded.length
      ? Math.round(scoredLoaded.reduce((s, p) => s + p.score10, 0) / scoredLoaded.length)
      : 0;
    const fraction = avg10 / 10;

    let statusLabel;
    if (avg10 >= 9) statusLabel = "Excellent";
    else if (avg10 >= 7) statusLabel = "Good";
    else if (avg10 >= 5) statusLabel = "Fair";
    else if (avg10 >= 3) statusLabel = "Needs Improvement";
    else statusLabel = "Poor";

    const failureReasons = [...aggReasons];
    const details = `Content depth/uniqueness/relevance: ${avg10}/10 across ${scoredLoaded.length} page(s)`;
    const explanation =
      avg10 >= 9
        ? `Analyzed ${scoredLoaded.length} target page(s); content is deep, unique and dealer-specific.`
        : `Analyzed ${scoredLoaded.length} target page(s), averaging ${avg10}/10. ${failureReasons.length ? failureReasons.slice(0, 4).join("; ") + "." : ""}`;
    const recommendation =
      avg10 >= 9
        ? "Keep content specific, detailed and distinct on each key page."
        : "Add dealer-specific detail (names, locations, brands, history), exceed the per-page word thresholds, and make each page's content unique.";

    return evaluateParameter(fraction, details, {
      score10: avg10,
      maxScore: 10,
      pagesAnalyzed: scoredLoaded.length,
      pages: scored,
      failureReasons,
      statusLabel,
      why_this_occurred: explanation,
      how_to_fix: recommendation,
    });
  } catch (e) {
    return evaluateParameter(0, "Content quality check failed", {
      score10: 0, maxScore: 10, pagesAnalyzed: 0,
      failureReasons: ["Check failed: " + e.message],
      error: e.message,
    });
  }
};

// E-E-A-T (Experience, Expertise, Authoritativeness, Trust) signals — 0–10.
// Discovers key trust pages (About, Contact, Team, Privacy, Terms) via the
// sitemap/homepage links, fetches one best (shortest) match per category
// (bounded — ≤5 extra fetches plus the already-loaded homepage), then scores
// five 0–2 checks per the E-E-A-T spec. Missing pages score 0 + a failure
// reason and never abort the audit.
// Keyword variants per category, incl. hyphen/underscore/concatenated forms
// (e.g. CarDekho uses /info/about_us, /info/contact_us). Matched against whole
// path SEGMENTS by exact equality, so long content slugs that merely contain a
// keyword (e.g. /web-stories/7-things-to-know-about-the-…) never false-match.
const EEAT_CATEGORIES = {
  about: ["about-us", "about_us", "aboutus", "about", "our-story", "our_story", "company", "history", "mission", "who-we-are", "who_we_are"],
  contact: ["contact-us", "contact_us", "contactus", "contact", "get-in-touch", "reach-us"],
  team: ["our-team", "our_team", "team", "staff", "leadership", "management", "people", "authors", "author"],
  privacy: ["privacy-policy", "privacy_policy", "privacypolicy", "privacy"],
  terms: ["terms-and-conditions", "terms_and_condition", "terms_and_conditions", "terms-of-service", "terms-conditions", "terms", "tos"],
};

// Probe slugs used as a fallback when a category isn't linked from the homepage
// or sitemap (often the case for JS-rendered footers). Combined with the path
// prefix observed on already-discovered pages (e.g. /info/).
const EEAT_PROBE_SLUGS = {
  about: ["about-us", "about_us", "aboutus", "about"],
  contact: ["contact-us", "contact_us", "contactus", "contact"],
  team: ["our-team", "our_team", "team", "leadership"],
  privacy: ["privacy-policy", "privacy_policy", "privacy"],
  terms: ["terms-and-conditions", "terms_and_condition", "terms-of-service", "terms"],
};

// Match a category by exact path-segment equality (extensions stripped).
const eeatMatchCategory = (pathname) => {
  const segs = (pathname || "")
    .toLowerCase()
    .split("/")
    .filter(Boolean)
    .map((s) => s.replace(/\.(html?|php|aspx?)$/, ""));
  for (const [cat, kws] of Object.entries(EEAT_CATEGORIES)) {
    if (segs.some((seg) => kws.includes(seg))) return cat;
  }
  return null;
};

// Lightweight existence check (HEAD, GET fallback) for fallback page probing.
const eeatUrlExists = async (target) => {
  try {
    const head = await fetch(target, {
      method: "HEAD",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    if (head.ok) return true;
    if (head.status !== 405 && head.status !== 501) return false;
    // Some servers reject HEAD — retry with a GET.
    const get = await fetch(target, {
      method: "GET",
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      redirect: "follow",
      signal: AbortSignal.timeout(7000),
    });
    return get.ok;
  } catch {
    return false;
  }
};

const checkEEAT = async (url, $, page, sitemapContent = null) => {
  try {
    let origin, protocol;
    try {
      const parsed = new URL(url);
      origin = parsed.origin;
      protocol = parsed.protocol;
    } catch {
      return evaluateParameter(0, "E-E-A-T check failed", {
        score10: 0, maxScore: 10, pagesAnalyzed: 0,
        failureReasons: ["Invalid site URL"],
        statusLabel: "Critical",
      });
    }

    // 1️⃣ Gather same-origin candidate URLs (sitemap first, homepage fallback).
    const candidateSet = new Set();
    const fromSitemap = await tuUrlsFromSitemap(sitemapContent, page);
    [...fromSitemap, ...tuUrlsFromHomepage($, url)].forEach((c) => {
      try {
        const abs = new URL(c, url);
        if (abs.origin === origin) {
          abs.hash = "";
          candidateSet.add(abs.href);
        }
      } catch {
        // skip invalid hrefs
      }
    });

    // 2️⃣ Pick ONE best (shortest) match per category — bounded discovery.
    const pickShortest = (arr) => arr.slice().sort((a, b) => a.length - b.length)[0];
    const byCat = {};
    for (const u of candidateSet) {
      let cat = null;
      try {
        cat = eeatMatchCategory(new URL(u).pathname);
      } catch {
        cat = null;
      }
      if (!cat) continue;
      (byCat[cat] = byCat[cat] || []).push(u);
    }
    const discoveredPages = {};
    for (const cat of Object.keys(EEAT_CATEGORIES)) {
      if (byCat[cat]?.length) discoveredPages[cat] = pickShortest(byCat[cat]);
    }

    // 2️⃣b Fallback: for any still-missing category, probe common URL patterns
    //      under the site root AND any path prefix seen on discovered pages
    //      (e.g. CarDekho keeps these under /info/ with underscores). Bounded by
    //      a small HEAD-request budget; stops at the first hit per category.
    const observedPrefixes = new Set();
    for (const u of Object.values(discoveredPages)) {
      try {
        const segs = new URL(u).pathname.split("/").filter(Boolean);
        if (segs.length > 1) observedPrefixes.add("/" + segs.slice(0, -1).join("/") + "/");
      } catch {
        // skip
      }
    }
    // Observed prefixes (e.g. /info/) first — strong signal — then the root.
    const prefixes = [...observedPrefixes, "/"];
    let probeBudget = 14;
    for (const cat of Object.keys(EEAT_PROBE_SLUGS)) {
      if (discoveredPages[cat] || probeBudget <= 0) continue;
      let hit = null;
      for (const pre of prefixes) {
        for (const slug of EEAT_PROBE_SLUGS[cat]) {
          if (probeBudget <= 0) break;
          probeBudget--;
          const candidate = origin + pre + slug;
          if (await eeatUrlExists(candidate)) {
            hit = candidate;
            break;
          }
        }
        if (hit) break;
      }
      if (hit) discoveredPages[cat] = hit;
    }

    // 3️⃣ Reuse the already-loaded homepage; fetch each discovered page (≤5).
    //    Build per-category text + a combined site-wide blob.
    const homepageText = ($("body").text() || "").replace(/\s+/g, " ").trim().slice(0, 8000);
    const pageText = { home: homepageText }; // category -> visible text
    const fetchedHtml = []; // raw html of fetched category pages (for <form> detection)
    let fetchCount = 0;
    for (const cat of Object.keys(discoveredPages)) {
      if (fetchCount >= 5) break;
      const html = await tuFetchRaw(discoveredPages[cat], page);
      fetchCount++;
      if (html) {
        pageText[cat] = tuExtractBodyText(html);
        fetchedHtml.push(html);
      }
    }
    const siteBlob = Object.values(pageText).join(" \n ").toLowerCase();
    const pagesAnalyzed = Object.keys(pageText).length;

    const failureReasons = [];

    // Shared signal helpers.
    const phoneRe = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const emailRe = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
    const streetRe = /\b\d{1,5}\s+[a-z0-9.\s]{2,30}\b(street|st|avenue|ave|road|rd|blvd|boulevard|lane|ln|drive|dr|suite|ste|court|ct|way|highway|hwy)\b/i;
    const hasForm = $("form").length > 0 || fetchedHtml.some((h) => /<form[\s>]/i.test(h));

    // Original-case all-pages blob, used to surface the actual matched values.
    const rawBlob = Object.values(pageText).join("  ");

    // ── CHECK 1 — About page (0–2) ─────────────────────────────────────────
    let aboutMark = 0;
    const aboutFound = [];
    const aboutText = pageText.about || "";
    if (discoveredPages.about && aboutText) {
      const aboutTerms = ["our story", "history", "founded", "established", "since \\d{4}", "mission", "vision", "values", "our team", "who we are"];
      aboutTerms.forEach((t) => {
        if (new RegExp(`\\b${t}\\b`, "i").test(aboutText)) aboutFound.push(t.replace("\\d{4}", "year").replace(/\b\w/g, (c) => c.toUpperCase()));
      });
      const wordCount = aboutText.split(/\s+/).filter(Boolean).length;
      aboutFound.push(`${wordCount} words`);
      aboutMark = aboutFound.length > 1 && wordCount >= 150 ? 2 : 1;
    }
    if (aboutMark === 0) failureReasons.push("About Us page missing");
    else if (aboutMark === 1) failureReasons.push("About page is thin — add company story, history & mission");

    // ── CHECK 2 — Contact information (0–2) ────────────────────────────────
    const phoneMatch = rawBlob.match(phoneRe);
    const emailMatch = rawBlob.match(emailRe);
    const addr = tuParseUsAddress(rawBlob);
    const hasStreet = streetRe.test(rawBlob);
    const contactFound = [];
    if (phoneMatch) contactFound.push("Phone: " + phoneMatch[0].replace(/\s+/g, " ").trim());
    if (emailMatch) contactFound.push("Email: " + emailMatch[0]);
    if (addr) contactFound.push("Address: " + [addr.city, addr.state || addr.stateName].filter(Boolean).join(", "));
    else if (hasStreet) contactFound.push("Postal address");
    if (hasForm) contactFound.push("Contact form");
    const contactSignals = contactFound.length;
    const contactMark = contactSignals >= 3 ? 2 : contactSignals >= 1 ? 1 : 0;
    if (contactMark === 0) failureReasons.push("Contact information missing");
    else if (contactMark === 1) failureReasons.push("Contact information incomplete — add phone, email, address & a contact form");

    // ── CHECK 3 — Author / Team credentials (0–2) ──────────────────────────
    const teamBlob = (pageText.team || "") + " " + siteBlob;
    const hasTeam = !!discoveredPages.team || /\b(our team|meet the team|leadership|staff|founder|ceo|director|owner)\b/i.test(teamBlob);
    const credRe = /\b(certified|certification|licensed|license|accredit\w*|cpa|m\.?d\.?|ph\.?d\.?|esq\.?|llb|degree|qualified|chartered|ase|award-winning|specialist|registered)\b/i;
    const credMatch = teamBlob.match(credRe);
    const hasCredentials = !!credMatch;
    const credFound = [];
    if (hasTeam) credFound.push(discoveredPages.team ? "Team / author page" : "Team / author section");
    if (credMatch) credFound.push("Credential: " + credMatch[0].trim());
    let credMark = 0;
    if (hasTeam && hasCredentials) credMark = 2;
    else if (hasTeam) credMark = 1;
    if (credMark === 0) failureReasons.push("No author or team credentials found");
    else if (credMark === 1) failureReasons.push("Team/author found but no professional credentials listed");

    // ── CHECK 4 — Experience & expertise (0–2) ─────────────────────────────
    const expChecks = [
      { label: "Established / since year", re: /\b(serving|established|est\.?|founded(?: in)?|since)\b[^.]{0,30}(19|20)\d{2}\b/i },
      { label: "Years of experience", re: /\b\d{1,3}\+?\s*years?\b[^.]{0,20}(experience|business|industry|serving)/i },
      { label: "Awards & recognition", re: /\b(award|awards|awarded|recognition)\b/i },
      { label: "Testimonials / reviews", re: /\b(testimonial|testimonials|reviews?|rated|rating)\b/i },
      { label: "Case studies / success stories", re: /\b(case stud(y|ies)|success stor(y|ies)|portfolio)\b/i },
      { label: "Certifications", re: /\b(certified|certification|accredited)\b/i },
    ];
    const expFound = expChecks.filter((c) => c.re.test(siteBlob)).map((c) => c.label);
    const expMark = expFound.length >= 2 ? 2 : expFound.length >= 1 ? 1 : 0;
    if (expMark === 0) failureReasons.push("No experience or expertise signals found");

    // ── CHECK 5 — Trust signals (0–2) ──────────────────────────────────────
    const hasPrivacy = !!discoveredPages.privacy || /\bprivacy policy\b/i.test(siteBlob);
    const hasTerms = !!discoveredPages.terms || /\bterms (of service|and conditions|& conditions)\b/i.test(siteBlob);
    const reviewMatch = siteBlob.match(/\b(google reviews|trustpilot|yelp|bbb|better business bureau|verified reviews?|trust badge|secure checkout|ssl secured)\b/i);
    const trustFound = [];
    if (protocol === "https:") trustFound.push("HTTPS");
    if (hasPrivacy) trustFound.push("Privacy Policy");
    if (hasTerms) trustFound.push("Terms & Conditions");
    if (reviewMatch) trustFound.push("Reviews/Trust: " + reviewMatch[0]);
    const trustSignals = trustFound.length;
    const trustMark = trustSignals >= 3 ? 2 : trustSignals >= 1 ? 1 : 0;
    if (protocol !== "https:") failureReasons.push("Site is not served over HTTPS");
    if (!hasPrivacy) failureReasons.push("Privacy Policy missing");
    if (!hasTerms) failureReasons.push("Terms & Conditions missing");
    if (trustMark === 0) failureReasons.push("Trust signals missing");

    // ── Aggregate ──────────────────────────────────────────────────────────
    const checks = {
      about: { mark: aboutMark, max: 2, pageFound: !!discoveredPages.about, url: discoveredPages.about || null, found: aboutFound },
      contact: { mark: contactMark, max: 2, signals: contactSignals, hasForm, found: contactFound },
      credentials: { mark: credMark, max: 2, teamFound: hasTeam, credentialsFound: hasCredentials, url: discoveredPages.team || null, found: credFound },
      experience: { mark: expMark, max: 2, signals: expFound.length, found: expFound },
      trust: { mark: trustMark, max: 2, https: protocol === "https:", privacy: hasPrivacy, terms: hasTerms, signals: trustSignals, found: trustFound },
    };

    const score10 = aboutMark + contactMark + credMark + expMark + trustMark; // 0–10
    const fraction = score10 / 10;

    let statusLabel;
    if (score10 >= 9) statusLabel = "Excellent";
    else if (score10 >= 7) statusLabel = "Good";
    else if (score10 >= 5) statusLabel = "Fair";
    else if (score10 >= 3) statusLabel = "Needs Improvement";
    else statusLabel = "Poor";

    const details = `E-E-A-T signals: ${score10}/10 across ${pagesAnalyzed} page(s)`;
    const explanation =
      score10 >= 9
        ? "Strong E-E-A-T: about, contact, credentials, experience and trust signals are all present."
        : `Scored ${score10}/10 for E-E-A-T. ${failureReasons.length ? failureReasons.slice(0, 4).join("; ") + "." : ""}`;
    const recommendation =
      score10 >= 9
        ? "Maintain detailed About/Team pages, complete contact details, credentials and trust signals."
        : "Add a detailed About page, complete contact info, author credentials, experience signals (years/awards/testimonials) and trust signals (HTTPS, Privacy Policy, Terms, reviews).";

    return evaluateParameter(fraction, details, {
      score10,
      maxScore: 10,
      pagesAnalyzed,
      discoveredPages,
      checks,
      failureReasons,
      statusLabel,
      why_this_occurred: explanation,
      how_to_fix: recommendation,
    });
  } catch (e) {
    return evaluateParameter(0, "E-E-A-T check failed", {
      score10: 0, maxScore: 10, pagesAnalyzed: 0,
      failureReasons: ["Check failed: " + e.message],
      error: e.message,
    });
  }
};

// ──────────────────────────────────────────────────────────────────────────
// Local SEO Signals (separate card)
// Eight URL-detectable local-search signals: NAP consistency, LocalBusiness
// schema, location targeting, local keyword usage, local landing pages,
// location-page completeness, Google Business Profile link, and review signals.
// Output-only (not weighted into the on-page Percentage), mirroring the
// Service_Content_Quality / Content_Depth_Quality pattern. Each sub-signal is a
// lightweight { key, label, score (0–100), status, details, found, … } object
// collected under meta.parameters so the front-end can render one row per signal.
// ──────────────────────────────────────────────────────────────────────────

// Schema.org @types that represent a physical/local business (lower-cased).
const LOCAL_BUSINESS_TYPES = new Set([
  "localbusiness", "autodealer", "store", "restaurant", "dentist", "autorepair",
  "hotel", "lodgingbusiness", "professionalservice", "homeandconstructionbusiness",
  "medicalbusiness", "legalservice", "financialservice", "realestateagent",
  "generalcontractor", "plumber", "electrician", "hvacbusiness", "cafeorcoffeeshop",
  "foodestablishment", "healthandbeautybusiness", "automotivebusiness", "shoppingcenter",
]);

// Walk parsed JSON-LD (handles arrays + @graph), invoking visit() on every object node.
const ldWalk = (node, visit) => {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) { node.forEach((n) => ldWalk(n, visit)); return; }
  visit(node);
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (v && typeof v === "object") ldWalk(v, visit);
  }
};

// First LocalBusiness-like JSON-LD node (or null).
const ldFindLocalBusiness = (content) => {
  let found = null;
  ldWalk(content, (n) => {
    if (found) return;
    const types = [].concat(n["@type"] || []).map((t) => String(t).toLowerCase());
    if (types.some((t) => LOCAL_BUSINESS_TYPES.has(t))) found = n;
  });
  return found;
};

// Standardised sub-signal object (mirrors evaluateParameter's status thresholds).
const mkLocalSub = (key, label, frac, details, extra = {}) => {
  const f = Math.max(0, Math.min(1, frac));
  const status = f >= 1 ? "pass" : f >= 0.5 ? "warning" : "fail";
  return { key, label, score: Math.round(f * 100), status, details, ...extra };
};

// Resolve the business city/state once (schema → footer → contact page → body).
// Refactor of the cascade also used by checkTitleLocationOptimization.
const resolveBusinessLocation = async (url, $, page, structuredData) => {
  let loc = null;
  let source = null;
  if (structuredData) {
    const s = tuFindSchemaAddress(structuredData);
    if (s && (s.city || s.state)) { loc = s; source = "schema"; }
  }
  if (!loc) {
    const f = tuParseUsAddress(tuNormalizeText($("footer").text() || ""));
    if (f) { loc = f; source = "footer"; }
  }
  if (!loc) {
    const contactUrl = tuFindContactUrl($, url);
    if (contactUrl) {
      const html = await tuFetchRaw(contactUrl, page);
      if (html) {
        const c = tuParseUsAddress(tuExtractBodyText(html));
        if (c) { loc = c; source = "contact"; }
      }
    }
  }
  if (!loc) {
    const b = tuParseUsAddress(tuNormalizeText($("body").text() || ""));
    if (b) { loc = b; source = "page"; }
  }
  return { loc, source };
};

// Collect distinct 10-digit phone numbers from tel: links and footer text.
const localExtractPhones = ($) => {
  const phones = new Set();
  $('a[href^="tel:"]').each((i, el) => {
    const d = ($(el).attr("href") || "").replace(/[^\d]/g, "");
    if (d.length >= 10) phones.add(d.slice(-10));
  });
  const footer = $("footer").text() || "";
  (footer.match(/\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/g) || []).forEach((p) => {
    const d = p.replace(/[^\d]/g, "");
    if (d.length >= 10) phones.add(d.slice(-10));
  });
  return [...phones];
};

// 1️⃣ NAP Consistency — name/address/phone present and agreeing across sources.
const localCheckNAP = ($, schemaBiz, structuredData) => {
  const phones = localExtractPhones($);
  const schemaPhone = schemaBiz?.telephone
    ? String(schemaBiz.telephone).replace(/[^\d]/g, "").slice(-10) : null;
  const schemaName = schemaBiz?.name ? String(schemaBiz.name).trim() : null;
  const addr = tuFindSchemaAddress(structuredData) ||
    tuParseUsAddress(tuNormalizeText($("footer").text() || ""));

  const found = [];
  let pts = 0;
  let max = 0;

  max++;
  if (schemaName) { pts++; found.push(`Name: ${schemaName}`); }

  max++;
  const phonePresent = phones.length > 0 || !!schemaPhone;
  if (phonePresent) { pts++; found.push(`Phone: ${phones[0] || schemaPhone}`); }

  max++;
  if (addr && (addr.city || addr.state)) {
    pts++;
    found.push(`Address: ${[addr.city, addr.state].filter(Boolean).join(", ")}`);
  }

  max++;
  let consistent;
  if (schemaPhone && phones.length) consistent = phones.includes(schemaPhone);
  else consistent = phones.length <= 1; // a single number used site-wide can't conflict
  if (consistent) pts++;
  else found.push("⚠ Phone differs between schema and page");

  const frac = max ? pts / max : 0;
  const details = phonePresent || addr
    ? (consistent ? "NAP present and consistent" : "NAP found but inconsistent (phone mismatch)")
    : "No NAP (name/address/phone) detected";

  return mkLocalSub("NAP_Consistency", "NAP Consistency", frac, details, {
    found,
    phones,
    schemaPhone,
    why_this_occurred: phonePresent || addr
      ? (consistent
        ? "Name, address and phone are present and agree across sources."
        : "The phone number in your schema differs from the one shown on the page.")
      : "No name/address/phone could be extracted from the page, footer or schema.",
    how_to_fix:
      "Display a single, identical Name, Address and Phone (NAP) in your footer, contact page and LocalBusiness schema.",
  });
};

// Organization-like @types whose fields (telephone, sameAs, …) describe the
// same business entity when present alongside a LocalBusiness node in a graph.
const ORG_LIKE_TYPES = new Set(["organization", "corporation", "ngo", "onlinebusiness"]);

// True if `node` (or any nested object within it, e.g. a contactPoint) has a
// non-empty value for any of the given property keys.
const ldDeepHas = (node, keys) => {
  let hit = false;
  ldWalk(node, (n) => {
    if (hit) return;
    for (const k of keys) {
      const v = n[k];
      if (v === undefined || v === null) continue;
      if (Array.isArray(v) ? v.length > 0 : v !== "") { hit = true; return; }
    }
  });
  return hit;
};

// 2️⃣ LocalBusiness Schema — present with the key fields filled in. Fields are
// aggregated across ALL LocalBusiness + Organization nodes in the JSON-LD graph
// (and their nested objects), because real sites split telephone / sameAs /
// hours across sibling nodes that Google merges into one entity.
const localCheckSchema = (structuredData) => {
  const bizNodes = [];
  const entityNodes = []; // business + organization nodes describing the entity
  ldWalk(structuredData, (n) => {
    const types = [].concat(n["@type"] || []).map((t) => String(t).toLowerCase());
    if (types.some((t) => LOCAL_BUSINESS_TYPES.has(t))) {
      bizNodes.push(n);
      entityNodes.push(n);
    } else if (types.some((t) => ORG_LIKE_TYPES.has(t))) {
      entityNodes.push(n);
    }
  });

  if (!bizNodes.length) {
    return mkLocalSub("LocalBusiness_Schema", "LocalBusiness Schema", 0,
      "No LocalBusiness schema found", {
        found: [],
        missing: ["name", "address", "telephone", "geo", "openingHours", "sameAs"],
        why_this_occurred:
          "No JSON-LD of type LocalBusiness (or a subtype like AutoDealer) was detected.",
        how_to_fix:
          "Add a LocalBusiness JSON-LD block with name, address, telephone, geo, openingHours and sameAs.",
      });
  }

  const has = (...keys) => entityNodes.some((n) => ldDeepHas(n, keys));
  const fields = {
    name: has("name", "legalName"),
    address: has("address"),
    telephone: has("telephone", "phone"),
    geo: has("geo", "latitude", "hasMap"),
    openingHours: has("openingHours", "openingHoursSpecification"),
    sameAs: has("sameAs"),
  };
  const keys = Object.keys(fields);
  const present = keys.filter((k) => fields[k]);
  const missing = keys.filter((k) => !fields[k]);
  const frac = present.length / keys.length;
  const schemaType = [
    ...new Set(bizNodes.flatMap((n) => [].concat(n["@type"] || []))),
  ].join(", ");

  return mkLocalSub("LocalBusiness_Schema", "LocalBusiness Schema", frac,
    missing.length ? `Schema present, missing: ${missing.join(", ")}` : "Complete LocalBusiness schema", {
      found: present.map((k) => `${k} ✓`),
      missing,
      schemaType,
      why_this_occurred: missing.length
        ? `Your LocalBusiness schema is missing ${missing.length} recommended field(s): ${missing.join(", ")}.`
        : "Your LocalBusiness schema includes all key fields.",
      how_to_fix: missing.length
        ? `Add the missing properties (${missing.join(", ")}) to your LocalBusiness JSON-LD.`
        : "Keep the schema valid and in sync with your on-page NAP.",
    });
};

// 3️⃣ Location Targeting — city/state present in title, meta description and body.
const localCheckTargeting = ($, loc, title, metaDesc) => {
  if (!loc) {
    return mkLocalSub("Location_Targeting", "Location Targeting", 0,
      "No business location to target", {
        found: [],
        why_this_occurred: "No city/state could be determined, so location targeting cannot be evaluated.",
        how_to_fix: "Add your city & state to the page and to a LocalBusiness schema.",
      });
  }
  const inTitle = tuTitleHasLocation(title, loc).found;
  const inMeta = tuTitleHasLocation(metaDesc, loc).found;
  const body = ($("body").text() || "").toLowerCase();
  const cityLc = loc.city ? loc.city.toLowerCase() : null;
  const stateFull = loc.state ? (TU_STATES[loc.state.toUpperCase()] || "").toLowerCase() : null;
  const inBody = (cityLc && cityLc.length > 2 && body.includes(cityLc)) ||
    (stateFull && body.includes(stateFull));

  const zones = [["Title", inTitle], ["Meta description", inMeta], ["Body", inBody]];
  const hits = zones.filter(([, v]) => v);
  const missing = zones.filter(([, v]) => !v).map(([z]) => z);
  const frac = hits.length / zones.length;
  const locStr = [loc.city, loc.stateName || loc.state].filter(Boolean).join(", ");

  return mkLocalSub("Location_Targeting", "Location Targeting", frac,
    `Geo terms in ${hits.length}/3 zones (${locStr})`, {
      found: hits.map(([z]) => z),
      location: locStr,
      why_this_occurred: hits.length === zones.length
        ? "Your city/state appears in the title, meta description and body."
        : `Your location (${locStr}) is missing from: ${missing.join(", ")}.`,
      how_to_fix: `Include "${locStr}" in your title tag, meta description and visible page copy.`,
    });
};

// 4️⃣ Local Keyword Usage — geo-modified / "near me" keywords in headings & content.
const LOCAL_NEAR_ME = [
  "near me", "nearby", "in my area", "areas we serve", "service area",
  "serving", "directions", "local",
];
const localCheckKeywords = ($, loc) => {
  const text = (
    ($("h1,h2,h3").text() || "") + " " +
    ($("title").text() || "") + " " +
    ($("body").text() || "")
  ).toLowerCase();
  const nearMe = LOCAL_NEAR_ME.filter((k) => text.includes(k));
  let cityHits = 0;
  if (loc?.city && loc.city.length > 2) {
    const esc = loc.city.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    cityHits = (text.match(new RegExp(esc, "g")) || []).length;
  }
  let frac = 0;
  if (cityHits >= 2 || nearMe.length >= 1) frac = 1;
  else if (cityHits === 1) frac = 0.5;

  const found = [];
  if (cityHits) found.push(`${cityHits}× city mention`);
  nearMe.forEach((k) => found.push(`"${k}"`));

  return mkLocalSub("Local_Keyword_Usage", "Local Keyword Usage", frac,
    found.length ? `Local keywords: ${found.slice(0, 5).join(", ")}` : "No local/geo keywords found", {
      found,
      cityHits,
      why_this_occurred: found.length
        ? "Geo-modified or near-me keywords are present in your headings/content."
        : "No city names or 'near me'-style local phrases were found in headings or content.",
      how_to_fix:
        "Add geo-modified keywords (e.g. \"<service> in <city>\", \"near me\") to headings and body copy.",
    });
};

// 5️⃣ Local Landing Pages — dedicated location/store pages discovered by crawling.
const LOCATION_URL_RE =
  /\/(locations?|store-?locator|stores?|branch(?:es)?|dealers?|find-?(?:us|a-?store)|areas?-?we-?serve|service-?areas?|cities|near-?me)(?:\/|$|-)/i;
const localCheckLandingPages = ($, url, loc) => {
  const links = tuUrlsFromHomepage($, url);
  const seen = new Set();
  const pages = [];
  for (const u of links) {
    let path;
    try { path = new URL(u).pathname; } catch { continue; }
    const low = path.toLowerCase();
    if (TU_ASSET_RE.test(low)) continue;
    if (LOCATION_URL_RE.test(low) && !seen.has(low)) {
      seen.add(low);
      pages.push(u);
    }
  }

  // 3-tier scoring: dedicated location page → 100; no page but a business
  // location was detected → 50; neither → 0.
  const hasLocation = !!(loc && (loc.city || loc.state));
  const locStr = hasLocation ? [loc.city, loc.stateName || loc.state].filter(Boolean).join(", ") : null;

  let frac;
  let details;
  let why;
  if (pages.length >= 1) {
    frac = 1;
    details = `${pages.length} location page(s) found`;
    why = "The site links to dedicated location/store pages.";
  } else if (hasLocation) {
    frac = 0.5;
    details = `No dedicated location page, but a business location was detected (${locStr})`;
    why = `No dedicated location page (e.g. /locations) was found, but the business location "${locStr}" is present on the site.`;
  } else {
    frac = 0;
    details = "No dedicated location pages or business location found";
    why = "No URLs matching location-page patterns (e.g. /locations, /store-locator) and no business location were found.";
  }

  const found = pages.slice(0, 8).map((p) => { try { return new URL(p).pathname; } catch { return p; } });
  if (!pages.length && hasLocation) found.push(`Location: ${locStr}`);

  return mkLocalSub("Local_Landing_Pages", "Local Landing Pages", frac, details, {
    found,
    pages: pages.slice(0, 8),
    count: pages.length,
    locationFound: hasLocation,
    why_this_occurred: why,
    how_to_fix: "Create a dedicated landing page for each location or service area (e.g. /locations/<city>).",
  });
};

// 6️⃣ Location Page Completeness — map, hours, directions and NAP on a location page.
const localCheckCompleteness = async (landingPages, $, url, page, contactUrlHint) => {
  let html = null;
  let source = "home page";
  const target = landingPages[0] || null;
  if (target) { html = await tuFetchRaw(target, page); source = "location page"; }
  if (!html && contactUrlHint) { html = await tuFetchRaw(contactUrlHint, page); source = "contact page"; }

  const rawHtml = html || $.html() || "";
  const low = rawHtml.toLowerCase();

  const hasMap =
    /(google\.[a-z.]+\/maps|maps\.google|\/maps\/embed)/i.test(rawHtml) ||
    /<iframe[^>]+maps/i.test(rawHtml) ||
    /class=["'][^"']*\bmap\b/i.test(rawHtml);
  const hasDirections = /maps\/dir|get\s+directions|driving\s+directions/i.test(low);
  const hasHours =
    /opening\s*hours|openinghours|hours of operation/i.test(low) ||
    /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\s*[-–:]/i.test(low) ||
    /\b\d{1,2}(:\d{2})?\s*(am|pm)\b/i.test(low);
  const hasPhone = /href=["']tel:/i.test(rawHtml) || /\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]?\d{4}/.test(low);

  const checks = [["Map", hasMap], ["Hours", hasHours], ["Directions", hasDirections], ["Phone/NAP", hasPhone]];
  const present = checks.filter(([, v]) => v);
  const missing = checks.filter(([, v]) => !v).map(([l]) => l);
  const frac = present.length / checks.length;

  let inspected = target || contactUrlHint || url;
  try { inspected = new URL(inspected).pathname; } catch { /* keep as-is */ }

  return mkLocalSub("Location_Page_Completeness", "Location Page Completeness", frac,
    `${present.length}/4 elements present (${source})`, {
      found: present.map(([l]) => l),
      missing,
      inspected,
      why_this_occurred: present.length === checks.length
        ? "The location page includes a map, hours, directions and contact details."
        : `The location page is missing: ${missing.join(", ")}.`,
      how_to_fix:
        "On each location page add an embedded Google Map, opening hours, a directions link and a click-to-call phone/NAP.",
    });
};

// 7️⃣ Google Business Profile — detect a link to the GBP / Maps listing (link-only).
const GBP_RE =
  /(g\.page|business\.google\.com|google\.[a-z.]+\/maps\/place|maps\.app\.goo\.gl|goo\.gl\/maps)/i;
const localCheckGBP = ($, schemaBiz) => {
  const links = [];
  $("a[href]").each((i, el) => {
    const href = $(el).attr("href") || "";
    if (GBP_RE.test(href)) links.push(href);
  });
  const sameAs = schemaBiz && schemaBiz.sameAs ? [].concat(schemaBiz.sameAs) : [];
  const schemaGbp = sameAs.filter((s) => GBP_RE.test(String(s)));
  const all = [...new Set([...links, ...schemaGbp])];
  const frac = all.length ? 1 : 0;

  return mkLocalSub("Google_Business_Profile", "Google Business Profile", frac,
    all.length ? "Google Business Profile link detected" : "No Google Business Profile link found", {
      found: all.slice(0, 5),
      partial: true,
      why_this_occurred: all.length
        ? "A link to your Google Business Profile / Maps listing was found."
        : "No link to a Google Business Profile (g.page, Maps listing) was detected. Only the link can be verified from the page — full profile data (reviews, photos, posts) requires the Google Places API.",
      how_to_fix:
        "Claim your Google Business Profile and link to it (g.page or Maps) from your site; keep it active with posts, photos and accurate hours.",
    });
};

// 8️⃣ Review Signals — AggregateRating/Review schema, widgets, or review-platform links.
const REVIEW_PLATFORM_RE =
  /(dealerrater\.com|yelp\.com|trustpilot\.com|cars\.com|bbb\.org|google\.[a-z.]+\/maps|facebook\.com\/[^"']*\/reviews|g\.page\/[^"']*\/review)/i;
const localCheckReviews = ($, structuredData) => {
  const found = [];
  let rating = null;
  let count = null;
  ldWalk(structuredData, (n) => {
    const types = [].concat(n["@type"] || []).map((t) => String(t).toLowerCase());
    if (types.includes("aggregaterating") || n.ratingValue) {
      rating = rating ?? n.ratingValue;
      count = count ?? (n.reviewCount || n.ratingCount);
    }
    if (n.aggregateRating && typeof n.aggregateRating === "object") {
      rating = rating ?? n.aggregateRating.ratingValue;
      count = count ?? (n.aggregateRating.reviewCount || n.aggregateRating.ratingCount);
    }
    if (types.includes("review")) found.push("Review schema");
  });
  if (rating) found.push(`Rating ${rating}${count ? ` (${count} reviews)` : ""} in schema`);

  const platforms = new Set();
  $("a[href]").each((i, el) => {
    const href = $(el).attr("href") || "";
    if (REVIEW_PLATFORM_RE.test(href)) {
      try { platforms.add(new URL(href, "https://x.invalid").hostname.replace(/^www\./, "")); } catch { /* skip */ }
    }
  });
  platforms.forEach((p) => found.push(p));

  const hasStars = $('[class*="rating"], [class*="stars"], [itemprop="ratingValue"]').length > 0;
  if (hasStars && !rating) found.push("Star/rating widget");

  let frac = 0;
  if (rating || platforms.size) frac = 1;
  else if (hasStars) frac = 0.5;

  return mkLocalSub("Review_Signals", "Review Signals", frac,
    found.length ? `Review signals: ${[...new Set(found)].slice(0, 4).join(", ")}` : "No review signals found", {
      found: [...new Set(found)].slice(0, 6),
      rating: rating || null,
      reviewCount: count || null,
      partial: true,
      why_this_occurred: found.length
        ? "Review/rating signals (schema, widgets or links to review platforms) were detected."
        : "No AggregateRating schema, review widgets or links to review platforms (Google, Yelp, DealerRater) were found. Live ratings require each platform's API.",
      how_to_fix:
        "Collect reviews on Google and relevant platforms, link to them, and add AggregateRating structured data.",
    });
};

// Aggregate all eight Local SEO signals into a single output-only metric.
const checkLocalSEO = async (url, $, page, structuredData, title, metaDesc) => {
  try {
    const { loc, source } = await resolveBusinessLocation(url, $, page, structuredData);
    const schemaBiz = ldFindLocalBusiness(structuredData);
    const contactUrlHint = tuFindContactUrl($, url);

    const nap = localCheckNAP($, schemaBiz, structuredData);
    const schema = localCheckSchema(structuredData);
    const targeting = localCheckTargeting($, loc, title, metaDesc);
    const keywords = localCheckKeywords($, loc);
    const landing = localCheckLandingPages($, url, loc);
    const completeness = await localCheckCompleteness(landing.pages || [], $, url, page, contactUrlHint);
    const gbp = localCheckGBP($, schemaBiz);
    const reviews = localCheckReviews($, structuredData);

    // Strip the heavy 'pages' array from the landing sub-signal before exposing.
    const parameters = [nap, schema, targeting, keywords, landing, completeness, gbp, reviews]
      .map(({ pages, ...rest }) => rest);

    const avg = parameters.reduce((s, p) => s + p.score, 0) / parameters.length / 100;
    const locStr = loc ? [loc.city, loc.stateName || loc.state].filter(Boolean).join(", ") : null;
    const passing = parameters.filter((p) => p.status === "pass").length;

    const details = locStr
      ? `Local SEO: ${passing}/${parameters.length} signals optimized · ${locStr}`
      : `Local SEO: ${passing}/${parameters.length} signals optimized`;

    return evaluateParameter(avg, details, {
      score10: Math.round(avg * 10),
      locationFound: !!loc,
      location: locStr,
      locationSource: source,
      parameters,
      passing,
      total: parameters.length,
      why_this_occurred: loc
        ? `Detected business location "${locStr}" (via ${source}). ${passing}/${parameters.length} local signals are fully optimized.`
        : "No clear local-business location was detected. If this is a local business, add a LocalBusiness schema and display your NAP.",
      how_to_fix:
        "Strengthen the weak signals below: consistent NAP, complete LocalBusiness schema, geo-targeted titles & keywords, dedicated location pages, a linked Google Business Profile and review signals.",
    });
  } catch (e) {
    return evaluateParameter(0, "Local SEO check failed", { error: e.message, parameters: [] });
  }
};

// Content Freshness (On-Page SEO) — recency of the page's update signals.
// Mirrors the AEO freshness signals but scores by recency tiers and feeds the SEO score.
const checkContentFreshness = ($) => {
  const sources = [];
  const pushDate = (raw, src) => {
    if (!raw) return;
    const d = new Date(raw);
    if (!isNaN(d.getTime())) sources.push({ date: d, source: src });
  };

  // 1. Meta tags
  const metaPairs = [
    ['meta[property="article:modified_time"]', 'article:modified_time'],
    ['meta[name="last-modified"]', 'last-modified'],
    ['meta[name="revised"]', 'revised'],
    ['meta[name="dcterms.modified"]', 'dcterms.modified'],
    ['meta[name="lastmod"]', 'lastmod'],
    ['meta[itemprop="dateModified"]', 'itemprop:dateModified'],
    ['meta[property="og:updated_time"]', 'og:updated_time'],
    ['meta[property="article:published_time"]', 'article:published_time'],
  ];
  metaPairs.forEach(([sel, name]) => { const v = $(sel).attr('content'); if (v) pushDate(v, name); });

  // 2. JSON-LD dateModified / datePublished (recursive)
  const findDates = (obj, acc) => {
    if (!obj || typeof obj !== 'object') return;
    if (obj.dateModified) acc.push(obj.dateModified);
    if (obj.datePublished) acc.push(obj.datePublished);
    const kids = Array.isArray(obj) ? obj : (obj['@graph'] && Array.isArray(obj['@graph']) ? obj['@graph'] : Object.values(obj));
    kids.forEach(k => { if (k && typeof k === 'object') findDates(k, acc); });
  };
  $('script[type="application/ld+json"]').each((i, el) => {
    try {
      const c = $(el).html().trim().replace(/<!\[CDATA\[|\]\]>|<!--|-->/g, '');
      const acc = []; findDates(JSON.parse(c), acc);
      acc.forEach(d => pushDate(d, 'jsonld'));
    } catch (e) {}
  });

  // 3. <time datetime> elements
  $('time[datetime]').each((i, el) => pushDate($(el).attr('datetime'), 'time-tag'));

  // 4. Visible "last updated" text
  const m = $('body').text().match(/(last updated|updated on|last modified|published on)[:\s]+([A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (m) pushDate(m[2], 'visible-text');

  if (sources.length === 0) {
    return evaluateParameter(0.5, "No content freshness signal found.", {
      mostRecent: null, signalCount: 0,
      checked: "meta tags, JSON-LD dateModified/datePublished, <time>, visible 'last updated' text",
      why_this_occurred: "No update timestamp (meta tag, structured-data date, <time> element, or visible 'last updated' text) was found, so search engines can't tell how fresh this content is.",
      how_to_fix: "Expose a last-updated date via dateModified in JSON-LD, an article:modified_time meta tag, or a visible 'Last updated' label — especially on inventory, service, and blog pages."
    });
  }

  sources.sort((a, b) => b.date - a.date);
  const newest = sources[0];
  const daysAgo = Math.floor((Date.now() - newest.date.getTime()) / 86400000);
  const baseMeta = {
    mostRecent: newest.date.toISOString().slice(0, 10),
    daysAgo, source: newest.source,
    signalCount: sources.length,
    signals: [...new Set(sources.map(s => s.source))]
  };

  if (daysAgo < 0) return evaluateParameter(1, `Content carries a future-dated timestamp (${baseMeta.mostRecent}).`, baseMeta);
  if (daysAgo <= 180) return evaluateParameter(1, `Content is fresh — last updated ${daysAgo} day(s) ago.`, baseMeta);
  if (daysAgo <= 365) return evaluateParameter(0.7, `Content is aging — last updated ${daysAgo} day(s) ago.`, {
    ...baseMeta,
    why_this_occurred: `The most recent update signal is ${daysAgo} days old.`,
    how_to_fix: "Refresh and re-date key pages at least every 6–12 months; stale dates signal lower relevance to search engines."
  });
  return evaluateParameter(0.4, `Content looks stale — last updated ${daysAgo} day(s) ago.`, {
    ...baseMeta,
    why_this_occurred: `The most recent update signal is over a year old (${daysAgo} days).`,
    how_to_fix: "Update the content and its dateModified/last-updated signal. Outdated pages — especially inventory and pricing — lose ranking strength."
  });
};

// ── Viewport meta (spec §2.2 · Common · Low · 3%) ───────────────────────────
// Mobile-readiness arm; shares evidence with the Accessibility "zoom" check.
const checkViewport = ($) => {
  const tag = $('meta[name="viewport"]');
  const exists = tag.length > 0;
  const content = exists ? (tag.attr("content") || "").toLowerCase().trim() : "";

  if (!exists || !content) {
    return evaluateParameter(0, exists ? "Viewport meta empty" : "Viewport meta missing", {
      exists, content: content || null, hasDeviceWidth: false, zoomDisabled: false,
      why_this_occurred: exists
        ? "A <meta name=\"viewport\"> tag is present but its content is empty, so mobile browsers fall back to a desktop-width layout."
        : "The page has no <meta name=\"viewport\"> tag, so mobile browsers render it at desktop width — failing Google's mobile-first indexing.",
      how_to_fix: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\"> to the <head>.",
    });
  }

  const hasDeviceWidth = /width\s*=\s*device-width/.test(content);
  const initialScaleMatch = content.match(/initial-scale\s*=\s*([\d.]+)/);
  const hasInitialScale1 = !!initialScaleMatch && parseFloat(initialScaleMatch[1]) === 1;
  const userScalableNo = /user-scalable\s*=\s*(no|0)\b/.test(content);
  const maxScaleMatch = content.match(/maximum-scale\s*=\s*([\d.]+)/);
  const zoomCapped = !!maxScaleMatch && parseFloat(maxScaleMatch[1]) < 2;
  const zoomDisabled = userScalableNo || zoomCapped;

  let score;
  if (!hasDeviceWidth) score = 0.5;          // present but not responsive-correct
  else if (!hasInitialScale1) score = 0.85;  // device-width but odd/absent initial-scale
  else score = 1;
  if (zoomDisabled) score = Math.min(score, 0.5); // blocking pinch-zoom is a mobile-UX/a11y fault

  const issues = [];
  if (!hasDeviceWidth) issues.push("missing width=device-width");
  if (!hasInitialScale1) issues.push("initial-scale not set to 1");
  if (zoomDisabled) issues.push("pinch-zoom disabled (user-scalable=no / maximum-scale<2)");

  return evaluateParameter(parseFloat(score.toFixed(2)),
    score === 1 ? "Responsive viewport configured" : `Viewport issues: ${issues.join(", ")}`, {
    exists, content, hasDeviceWidth, hasInitialScale1, zoomDisabled,
    why_this_occurred: score === 1
      ? "The viewport is set to width=device-width with initial-scale=1 and allows zoom — correct for mobile-first indexing."
      : `The viewport meta has issues: ${issues.join(", ")}.`,
    how_to_fix: score === 1
      ? "No changes needed."
      : "Use <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">; do not set user-scalable=no or maximum-scale below 2 (it blocks zoom and fails accessibility).",
  });
};

// Shared VDP-URL matcher (mirrors tuClassifyPageType's vdp heuristics).
const tuIsVdpPath = (p) =>
  TU_VIN_RE.test(p) ||
  (/\/(vehicle|vehicles|vdp|inventory)\//.test(p) && /\d{4,}/.test(p)) ||
  (/-\d{4}-/.test(p) && /\/(new|used|inventory|vehicle)/.test(p));

// ── SRP → VDP internal links (spec §5.2 SRP · +6% · crawl depth to inventory) ──
const checkSrpToVdpLinks = ($, url) => {
  let baseHost = "";
  try { baseHost = new URL(url).hostname.replace(/^www\./, ""); } catch {}
  const vdpLinks = new Set();
  $("a[href]").each((i, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const abs = new URL(href, url);
      if (abs.hostname.replace(/^www\./, "") !== baseHost) return;
      if (tuIsVdpPath(abs.pathname)) vdpLinks.add(abs.href);
    } catch {}
  });
  const count = vdpLinks.size;

  let score, why, fix;
  if (count === 0) {
    score = 0.2;
    why = "No crawlable links to vehicle detail pages were found on this inventory page. If vehicle cards open via JavaScript (onclick) instead of <a href>, search engines and AI crawlers can't reach the inventory.";
    fix = "Render each vehicle card as a real <a href> link to its VDP so crawlers can discover and index every vehicle.";
  } else if (count < 10) {
    score = 0.6;
    why = `Only ${count} vehicle-detail link(s) were found. A healthy results page links to the full set of vehicles so crawlers can reach all inventory.`;
    fix = "Ensure every result card links to its VDP with a crawlable <a href>, and that pagination / 'load more' exposes the rest as links.";
  } else {
    score = 1;
    why = `${count} crawlable links to vehicle detail pages — inventory is reachable for indexing.`;
    fix = "No changes needed; keep VDP links as crawlable <a href> elements.";
  }
  return evaluateParameter(parseFloat(score.toFixed(2)),
    score === 1 ? `${count} SRP→VDP links` : "SRP→VDP linking needs attention", {
    vdpLinkCount: count, examples: [...vdpLinks].slice(0, 12),
    why_this_occurred: why, how_to_fix: fix,
  });
};

// ── SRP pagination & faceted index control (spec §2.2 SRP add-on · +8%) ──────
const checkSrpIndexControl = ($, url) => {
  let parsed; try { parsed = new URL(url); } catch { parsed = null; }
  const canonicalEl = $('head link[rel="canonical"]');
  const canonical = (canonicalEl.attr("href") || "").trim();
  const hasCanonical = canonicalEl.length > 0 && !!canonical;
  const robotsContent = (($('meta[name="robots"]').attr("content") || "") + " " + ($('meta[name="googlebot"]').attr("content") || "")).toLowerCase();
  const hasNoindex = /noindex/.test(robotsContent);
  const hasRelNext = $('link[rel="next"]').length > 0;
  const hasRelPrev = $('link[rel="prev"]').length > 0;
  const params = parsed ? [...parsed.searchParams.keys()] : [];
  const isPageParam = params.some(k => /^(page|p|pg|start|offset)$/i.test(k)) || /\/page\/\d+/i.test(parsed?.pathname || "");
  const isPaginated = hasRelNext || hasRelPrev || isPageParam;
  const filterParams = params.filter(k => !/^(page|p|pg|start|offset)$/i.test(k));
  const hasFilters = filterParams.length > 0;

  let selfCanonical = false, canonicalStripsParams = false;
  if (hasCanonical && parsed) {
    try {
      const c = new URL(canonical, url);
      const norm = (u) => u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
      selfCanonical = norm(c) === norm(parsed) && c.search === parsed.search;
      canonicalStripsParams = norm(c) === norm(parsed) && !!parsed.search && !c.search;
    } catch {}
  }

  let score = 0; const issues = [];
  if (hasCanonical) score += 0.4; else issues.push("no canonical tag");
  if (!hasFilters) score += 0.3;                                   // clean SRP, nothing to control
  else if (canonicalStripsParams || hasNoindex) score += 0.3;      // filters consolidated / de-indexed
  else { score += 0.1; issues.push("filter parameters are indexable & self-canonical (index-bloat risk)"); }
  if (!isPaginated) score += 0.3;
  else if (hasRelNext || hasRelPrev || selfCanonical) score += 0.3; // paginated pages self-canonical / rel next-prev
  else { score += 0.1; issues.push("paginated page doesn't self-canonicalize or use rel=next/prev"); }
  score = parseFloat(Math.max(0, Math.min(1, score)).toFixed(2));

  return evaluateParameter(score,
    score >= 0.9 ? "Pagination & faceted indexing well-controlled" : `Index-control issues: ${issues.join(", ")}`, {
    hasCanonical, selfCanonical, canonicalStripsParams, hasNoindex,
    isPaginated, hasRelNext, hasRelPrev, hasFilters, filterParams: filterParams.slice(0, 10), issues,
    why_this_occurred: issues.length
      ? `Inventory index-control issues: ${issues.join(", ")}. Uncontrolled filter/sort URLs and mis-canonicalized pagination create thousands of near-duplicate pages that waste crawl budget.`
      : "Filter parameters and pagination are handled so search engines index one clean version of each results page.",
    how_to_fix: issues.length
      ? "Self-canonical page 1, keep a consistent parameter order, noindex thin filter combinations, and use rel=next/prev (or a view-all page) instead of canonicalizing every page to page 1."
      : "No changes needed.",
  });
};

// ── VDP unique description / duplicate-vs-OEM (spec §2.2 VDP add-on · +12%) ──
// Fingerprints the vehicle description and compares it against sibling VDPs;
// high similarity ⇒ templated/OEM copy reused across the catalogue (duplicate
// content — the #1 VDP ranking killer). Thin copy is itself a failure.
const checkVdpUniqueness = async (url, $, page, sitemapContent = null) => {
  try {
    const $scope = $("main").length ? $("main") : $("body");
    const ownText = tuNormalizeText($scope.text() || "").slice(0, 5000);
    const ownWords = cleanText(ownText);
    const wordCount = ownWords.length;
    const ownPrint = tuFingerprint(ownWords);
    const hasFiller = TU_FILLER_RE.test(ownText.toLowerCase());

    if (wordCount < 40) {
      return evaluateParameter(0.3, "Thin VDP description", {
        present: true, wordCount, comparedAgainst: 0, maxSimilarity: null, hasFiller,
        why_this_occurred: `The vehicle description has only ~${wordCount} content words — too thin to rank and typically just the spec table or OEM boilerplate.`,
        how_to_fix: "Write a unique 100+ word description per vehicle covering its condition, options and a local selling point — not the manufacturer's stock copy.",
      });
    }

    // Sibling VDP URLs (sitemap-first, homepage fallback), excluding self.
    let candidates = await tuUrlsFromSitemap(sitemapContent, page);
    if (!candidates.length) candidates = tuUrlsFromHomepage($, url);
    let selfHref = url; try { selfHref = new URL(url).href; } catch {}
    const otherVdps = [...new Set(candidates.filter((c) => {
      try {
        const abs = new URL(c, url);
        return tuIsVdpPath(abs.pathname) && abs.href !== selfHref;
      } catch { return false; }
    }))];
    const sample = tuPickRandom(otherVdps, 3);

    let maxSim = 0; const comparisons = [];
    for (const other of sample) {
      const abs = new URL(other, url).href;
      const html = await tuFetchRaw(abs, page);
      if (!html) continue;
      const otherWords = cleanText(tuExtractBodyText(html));
      if (otherWords.length < 20) continue;
      const sim = tuJaccard(ownPrint, tuFingerprint(otherWords));
      comparisons.push({ url: abs, similarity: parseFloat(sim.toFixed(2)) });
      if (sim > maxSim) maxSim = sim;
    }

    let score;
    if (!comparisons.length) {
      // No siblings to compare → score on depth + filler only (still applicable).
      score = hasFiller ? 0.5 : (wordCount >= 100 ? 0.85 : 0.7);
    } else {
      score = 1 - maxSim;          // 0 similarity → 1.0; 0.7 similarity → 0.3
      if (hasFiller) score -= 0.15;
      if (wordCount < 100) score -= 0.1;
      score = Math.max(0.1, Math.min(1, score));
    }
    score = parseFloat(score.toFixed(2));

    const dup = comparisons.length > 0 && maxSim >= 0.5;
    return evaluateParameter(score,
      score >= 0.9 ? "Unique vehicle description"
        : dup ? "Description largely duplicated across vehicles" : "Vehicle description could be more unique", {
      present: true, wordCount, comparedAgainst: comparisons.length,
      maxSimilarity: comparisons.length ? parseFloat(maxSim.toFixed(2)) : null,
      comparisons, hasFiller,
      why_this_occurred: dup
        ? `This description is ~${Math.round(maxSim * 100)}% similar to other vehicles on the site — the same templated/OEM copy is reused across VDPs, which search engines treat as duplicate content.`
        : hasFiller
          ? "The description leans on generic boilerplate phrasing rather than vehicle-specific detail."
          : (comparisons.length ? "The description is sufficiently distinct from the sibling VDPs sampled." : "The description has reasonable depth (no sibling VDPs were available to compare against)."),
      how_to_fix: (dup || hasFiller || wordCount < 100)
        ? "Write a unique, 100+ word description per vehicle (condition, options, history, local selling points). Don't paste the manufacturer's stock description used on every trim."
        : "No changes needed; keep descriptions vehicle-specific.",
    });
  } catch (e) {
    // Treat as N/A so it drops from the weighted denominator (spec rule 6).
    return evaluateParameter(0, "VDP uniqueness check failed", { present: false, error: e.message });
  }
};

export default async function seoMetrics(url, $, page) {

  const titleMetric = checkTitle($);
  const metaDescMetric = checkMetaDescription($);
  const urlStructureMetric = checkURLStructure(url);
  const canonicalMetric = checkCanonical($, url);
  const h1Metric = checkH1($);
  const imageMetric = await checkImages($, url);
  // Video HIDDEN: not an On-Page SEO parameter in the spec (§2.2).
  const hierarchyMetric = checkHeadingHierarchy($);
  const semanticMetric = await checkSemanticTags($);
  const contextualMetric = await checkContextualLinks($, url);
  const linksMetric = checkLinks($, url);



  const contentRelevanceMetric = checkContentRelevance($, titleMetric.meta.title, metaDescMetric.meta.description);
  // Content_Freshness HIDDEN (rule 4): double-counts AIO "content freshness markers".
  const slugMetric = checkSlugs(url, $);
  const robotsMetric = await checkRobotsTxt(url, page, $);
  const sitemapMetric = await checkSitemap(url, robotsMetric?.meta?.content, page);
  // Sample eligible internal pages once, then score title & meta-desc uniqueness.
  const uniquenessSample = await tuSamplePages(url, $, page, sitemapMetric?.meta?.content);
  const titleUniquenessMetric = checkTitleUniqueness(uniquenessSample);
  const metaDescUniquenessMetric = checkMetaDescriptionUniqueness(uniquenessSample);
  const titleKeywordMetric = checkTitleKeywordOptimization(uniquenessSample);
  const structuredDataMetric = await checkStructuredData(page);
  const titleLocationMetric = await checkTitleLocationOptimization(
    url,
    $,
    page,
    titleMetric?.meta?.title,
    structuredDataMetric?.meta?.content
  );
  // HIDDEN — not On-Page SEO parameters in the spec (§2.2). Their checks are left
  // in place (dead code) for whichever section claims them in its rebuild:
  //   Service_Content_Quality / Content_Depth_Quality — output-only diagnostics
  //   EEAT → AEO   ·   Local_SEO → AEO/local
  // (checkStructuredData above stays CALLED only because Title_Location depends on it.)

  const { ogMetric, twitterMetric, socialLinksMetric } = checkSocial($);

  // ── Common + page-type-specific extras (spec §2.2 add-ons / §5.2) ──
  // Viewport applies to every page; the VDP/SRP add-ons are computed only on
  // their page type and added to the weight set below (renormalizing the
  // common params downward for that page type, per spec §5.2).
  const viewportMetric = checkViewport($);
  const pageType = tuClassifyPageType(url);
  const vdpUniquenessMetric = pageType === "vdp"
    ? await checkVdpUniqueness(url, $, page, sitemapMetric?.meta?.content)
    : null;
  const srpIndexMetric = pageType === "srp" ? checkSrpIndexControl($, url) : null;
  const srpVdpLinksMetric = pageType === "srp" ? checkSrpToVdpLinks($, url) : null;

  // ── Spec-aligned On-Page SEO weights (AUDIT_FRAMEWORK_SPECIFICATION.md §2.2 / §5.1) ──
  // The product splits some spec parameters into sub-cards whose weights SUM to
  // that spec parameter's within-section weight:
  //   Meta title 15%  → Title(7) + Uniqueness(3) + Keyword(3) + Location(2)
  //   Heading 11%     → H1(7) + Heading_Hierarchy(4)
  //   Meta desc 9%    → Meta_Description(6) + Meta_Description_Uniqueness(3)
  //   URL 8%          → URL_Structure(5) + URL_Slugs(3)
  //   Internal link 7%→ Contextual_Linking(4) + Links(3)
  //   Open Graph 6%   → Open_Graph(3) + Twitter_Card(2) + Social_Links(1)
  //   Canonical 11 · Robots meta+intent 8 · Image 8 · Content relevance 6 · Semantic 5
  //
  // HIDDEN (rule-4 standing decision — double-counted in the already-existing
  // AIO/AEO sections, so NOT weighted and NOT returned): Structured_Data
  // (AIO structured-data validity), Content_Freshness (AIO freshness markers),
  // EEAT (AEO E-E-A-T). checkStructuredData stays COMPUTED because Title_Location
  // and Local_SEO depend on its parsed schema, but it is dropped from the return.
  // INFORMATIONAL (weight 0, still returned/shown — mis-sectioned, relocation
  // deferred): Sitemap (→ Technical), Video (not in spec). Output-only already:
  // URL_Structure is dual — weighted here AND shown; Service/Content_Depth/Local_SEO.
  const weights = {
    Title: 0.07,
    Title_Uniqueness: 0.03,
    Title_Keyword_Optimization: 0.03,
    Title_Location_Optimization: 0.02,
    Canonical: 0.11,
    H1: 0.07,
    Heading_Hierarchy: 0.04,
    Meta_Description: 0.06,
    Meta_Description_Uniqueness: 0.03,
    Robots_Txt: 0.08,
    URL_Structure: 0.05,
    URL_Slugs: 0.03,
    Image: 0.08,
    Contextual_Linking: 0.04,
    Links: 0.03,
    Open_Graph: 0.03,
    Twitter_Card: 0.02,
    Social_Links: 0.01,
    Content_Relevance: 0.06,
    Semantic_Tags: 0.05,
    Viewport: 0.03,
  };

  // Page-type-specific add-ons (spec §5.2) — only weighted on the relevant page
  // type. Adding their weight here automatically renormalizes the common params
  // downward via the Σ-weight division below.
  if (vdpUniquenessMetric) weights.VDP_Content_Uniqueness = 0.12; // VDP unique-vs-OEM
  if (srpIndexMetric) weights.SRP_Index_Control = 0.08;           // SRP pagination/faceted
  if (srpVdpLinksMetric) weights.SRP_To_VDP_Links = 0.06;         // SRP→VDP crawl depth

  const getScore = (metric) => metric?.score || 0;

  // Map each weighted key to its metric object and its 0–100 score.
  // Content_Relevance reports a 0–100 `percentage` rather than `score`.
  const metricOf = {
    Title: titleMetric,
    Title_Uniqueness: titleUniquenessMetric,
    Title_Keyword_Optimization: titleKeywordMetric,
    Title_Location_Optimization: titleLocationMetric,
    Canonical: canonicalMetric,
    H1: h1Metric,
    Heading_Hierarchy: hierarchyMetric,
    Meta_Description: metaDescMetric,
    Meta_Description_Uniqueness: metaDescUniquenessMetric,
    Robots_Txt: robotsMetric,
    URL_Structure: urlStructureMetric,
    URL_Slugs: slugMetric,
    Image: imageMetric,
    Contextual_Linking: contextualMetric,
    Links: linksMetric,
    Open_Graph: ogMetric,
    Twitter_Card: twitterMetric,
    Social_Links: socialLinksMetric,
    Content_Relevance: contentRelevanceMetric,
    Semantic_Tags: semanticMetric,
    Viewport: viewportMetric,
  };
  if (vdpUniquenessMetric) metricOf.VDP_Content_Uniqueness = vdpUniquenessMetric;
  if (srpIndexMetric) metricOf.SRP_Index_Control = srpIndexMetric;
  if (srpVdpLinksMetric) metricOf.SRP_To_VDP_Links = srpVdpLinksMetric;
  const scoreOf = (key) =>
    key === "Content_Relevance" ? (contentRelevanceMetric.percentage || 0) : getScore(metricOf[key]);

  // Spec rule 6 — renormalize N/A: a parameter flagged meta.present === false
  // (e.g. Image on a page with no images) is dropped from BOTH numerator and
  // denominator, not scored 0. Dividing by the *included* weight rescales the
  // applicable set to a true 0–100 scale.
  let weightedScore = 0;
  let totalWeight = 0;
  for (const key of Object.keys(weights)) {
    if (metricOf[key]?.meta?.present === false) continue;
    weightedScore += scoreOf(key) * weights[key];
    totalWeight += weights[key];
  }

  const actualPercentage = totalWeight > 0 ? parseFloat((weightedScore / totalWeight).toFixed(0)) : 0;

  return {
    Title: titleMetric,
    Title_Uniqueness: titleUniquenessMetric,
    Title_Keyword_Optimization: titleKeywordMetric,
    Title_Location_Optimization: titleLocationMetric,
    Meta_Description: metaDescMetric,
    Meta_Description_Uniqueness: metaDescUniquenessMetric,
    URL_Structure: urlStructureMetric,
    Canonical: canonicalMetric,
    H1: h1Metric,
    Image: imageMetric,
    Heading_Hierarchy: hierarchyMetric,
    Semantic_Tags: semanticMetric,
    Contextual_Linking: contextualMetric,
    Links: linksMetric,
    Content_Relevance: contentRelevanceMetric,
    URL_Slugs: slugMetric,
    Robots_Txt: robotsMetric,
    Open_Graph: ogMetric,
    Twitter_Card: twitterMetric,
    Social_Links: socialLinksMetric,
    Viewport: viewportMetric,
    // Page-type-specific (present only on the relevant page type).
    ...(vdpUniquenessMetric ? { VDP_Content_Uniqueness: vdpUniquenessMetric } : {}),
    ...(srpIndexMetric ? { SRP_Index_Control: srpIndexMetric } : {}),
    ...(srpVdpLinksMetric ? { SRP_To_VDP_Links: srpVdpLinksMetric } : {}),
    Percentage: actualPercentage,
    // Spec §0.5 — every section carries a confidence enum. On-Page SEO is scored
    // entirely from DOM/markup inference (titles, headings, meta tags, link graph),
    // so the whole section is `heuristic` (not field/lab measurement).
    Confidence: "heuristic",
  };
}
