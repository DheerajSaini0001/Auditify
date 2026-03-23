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

    const brokenImages = []; // 🔥 NEW

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
    }

    const altScore = total > 0 ? (withAlt / total) : 1;
    const meaningfulScore = total > 0 ? (meaningfulAlt / total) : 1;
    const titleScore = total > 0 ? (withTitle / total) : 1;

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
      (altScore * 0.5) +
      (meaningfulScore * 0.2) +
      (titleScore * 0.1) +
      (sizeScore * 0.2);

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

    if (issues.length > 0) {
      explanation = `Issues found: ${issues.join(", ")}.`;
      recommendation = "Fix broken images, add descriptive Alt text, and compress large images.";
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

      if (count > 0) {
        foundTags.push(tag);
      } else {
        missingTags.push(tag);

        // 🔍 Heuristic detection
        const heuristicSelector = `
          div[class*="${tag}"], 
          div[id*="${tag}"],
          section[class*="${tag}"],
          article[class*="${tag}"]
        `;
        if ($(heuristicSelector).length > 0) {
          potentialReplacements.push(tag);
        }
      }
    });

    const mainCount = result["main"];
    const hasHeader = result["header"] > 0;
    const hasNav = result["nav"] > 0;
    const hasFooter = result["footer"] > 0;

    // ⚠️ WARNING: <main> missing or multiple
    if (mainCount === 0 || mainCount > 1) {
      return evaluateParameter(0.5, 
        mainCount === 0 ? "Main tag missing" : "Multiple main tags found",
        {
          ...result,
          found: foundTags,
          missing: missingTags,
          potentialReplacements,
          why_this_occurred: "<main> should exist once to define primary content.",
          how_to_fix: mainCount === 0
            ? "Add a <main> tag wrapping the core content."
            : "Ensure only one <main> tag is used."
        }
      );
    }

    // ⚠️ WARNING: missing header/nav/footer
    if (!hasHeader || !hasNav || !hasFooter) {
      return evaluateParameter(0.5, "Missing core semantic tags", {
        ...result,
        found: foundTags,
        missing: missingTags,
        potentialReplacements,
        why_this_occurred: "Core tags like <header>, <nav>, or <footer> are missing.",
        how_to_fix: "Add <header>, <nav>, and <footer> for better structure."
      });
    }

    // ⚠️ / ❌ Only div structure
    const totalSemanticUsed = foundTags.length;
    const onlyMainPresent = totalSemanticUsed === 1 && mainCount === 1;

    if (onlyMainPresent) {
      const isSevere = potentialReplacements.length === 0;

      return evaluateParameter(
        isSevere ? 0 : 0.5,
        isSevere
          ? "Only div structure (no semantics)"
          : "Div-based structure detected",
        {
          ...result,
          found: foundTags,
          missing: missingTags,
          potentialReplacements,
          why_this_occurred: "Page relies heavily on <div> instead of semantic tags.",
          how_to_fix: potentialReplacements.length > 0
            ? `Replace <div class="${potentialReplacements[0]}"> with <${potentialReplacements[0]}>.`
            : "Refactor layout using semantic tags like <section>, <article>, etc."
        }
      );
    }

    // 🎯 GOOD
    return evaluateParameter(1, "Proper semantic structure", {
      ...result,
      found: foundTags,
      missing: missingTags,
      potentialReplacements,
      why_this_occurred: "All major semantic tags are properly used.",
      how_to_fix: "Maintain this structure."
    });

  } catch (err) {
    return evaluateParameter(0, "Error checking semantic tags", {
      error: err.message,
      importance: "Medium"
    });
  }
};

const checkContextualLinks = async ($, url) => {
  try {
    const contentLinks = new Set();
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

      if ($el.closest("nav, header, footer, .navbar, .menu, .sidebar, .nav").length > 0) return;

      if (
        href.startsWith("#") ||
        href.startsWith("javascript") ||
        href.startsWith("tel") ||
        href.startsWith("mailto")
      ) return;

      contentLinks.add(href);
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
    const ignoredPatterns = [
      "login","signin","sign-in","register","signup","sign-up",
      "cart","checkout","account","profile","logout",
      "contact","about","privacy","terms"
    ];

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

const maxChecks = 25;
const linksToCheck = Array.from(contentLinks).slice(0, maxChecks);

// 🚀 Parallel requests (faster + accurate)
const requests = linksToCheck.map(async (href) => {
  try {
    const fullUrl = new URL(href, url).href;

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

const checkContentQuality = ($) => {
  // Use a clone to avoid modifying the original DOM for other checks
  const $body = $("body").clone();

  // Remove scripts, styles, and non-visible elements
  $body.find("script, style, noscript, template, svg, img, video, iframe, link, meta, [hidden], [aria-hidden='true'], header, footer, nav").remove();

  const text = $body.text().replace(/\s+/g, " ").trim();
  const words = text.split(" ").filter(w => w.length > 0);
  const wordCount = words.length;

  // 1. Thin Content Check
  if (wordCount < 100) {
    return evaluateParameter(0, "No / very low content (<100 words)", { wordCount, repeatedSentences: [] });
  } else if (wordCount < 300) {
    return evaluateParameter(0.5, "Less content (100-300 words)", { wordCount, repeatedSentences: [] });
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
    if (wordCount >= 1500) {
       return evaluateParameter(0.5, "Very long content but poor readability", { wordCount, repeatedSentences });
    }
    return evaluateParameter(0.5, "High sentence repetition detected", { wordCount, repeatedSentences });
  }

  return evaluateParameter(1, wordCount >= 1500 ? "Very long, structured content" : "Proper content", { wordCount, repeatedSentences });
};

const checkURLStructure = (url) => {
  try {
    const parsed = new URL(url);
    const path = parsed.pathname;
    const issues = [];
    let explanation = "";
    let recommendation = "";

    if (path.length > 1 && path !== path.toLowerCase()) {
      issues.push("URL contains uppercase letters");
    }
    if (path.includes("_")) {
      issues.push("URL contains underscores (use hyphens)");
    }
    if (parsed.search) {
      issues.push("URL contains query parameters");
    }

    const segments = path.split('/').filter(Boolean);
    if (segments.length > 3) {
      issues.push("URL is too deep (> 3 segments)");
    }

    const score = issues.length === 0 ? 1 : 0.5; // WARNING
    const details = issues.length === 0 ? "Clean SEO URL" : `Poor URL structure: ${issues.join(", ")}`;

    if (issues.length > 0) {
      explanation = `The URL structure contains ${issues.length} potential issue(s): ${issues.join(", ")}.`;
      recommendation = "Simplify the URL structure. Use lowercase letters, hyphens instead of underscores, avoid query parameters for static pages, and keep the path depth shallow.";
    } else {
      explanation = "The URL follows standard SEO conventions (clean, concise, and descriptive).";
      recommendation = "No changes needed. Maintain this structure for future pages.";
    }

    return evaluateParameter(parseFloat(score.toFixed(2)), details, {
      url,
      issues,
      why_this_occurred: explanation,
      how_to_fix: recommendation,
    });
  } catch (err) {
    return evaluateParameter(0, "Invalid URL format", { url, error: err.message, why_this_occurred: "The provided URL could not be parsed.", how_to_fix: "Ensure the URL is correctly formatted (e.g. https://example.com).", importance: "Critical", seo_best_practices: "URLs must be valid RFC 3986 strings." });
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

  if (!exists) {
    score = 0;
    explanation = "The document is missing a <title> tag in the <head> section.";
    recommendation = "Add a <title> tag with a descriptive title inside the <head> section.";
  } else if (titleLength === 0) {
    score = 0;
    explanation = "The <title> tag is present but contains no text.";
    recommendation = "Add descriptive text that summarizes the page content within the <title> tag.";
  } else if (titleLength < 30) {
    score = 0.5;
    explanation = `The title is ${titleLength} characters long, which is considered too short.`;
    recommendation = "Expand the title to at least 30 characters. Include primary keywords and your brand name.";
  } else if (titleLength > 60) {
    score = 0.5;
    explanation = `The title is ${titleLength} characters long, which exceeds the recommended limit.`;
    recommendation = "Shorten the title to approx. 60 characters to prevent truncation in search engine results (SERPs).";
  } else {
    score = 1;
    explanation = "The title length is within the optimal range (30-60 characters).";
    recommendation = "No substantial changes needed. Ensure the title remains relevant to the page content.";
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

  if (!exists) {
    score = 0;
    explanation = "The document is missing a meta description tag.";
    recommendation = "Add a <meta name=\"description\" content=\"...\"> tag to the <head> of your page.";
  } else if (metaDescLength === 0) {
    score = 0;
    explanation = "The meta description tag exists but the content attribute is empty.";
    recommendation = "Add a concise summary of the page content to the content attribute.";
  } else if (metaDescLength < 50) {
    score = 0.5;
    explanation = `The meta description is ${metaDescLength} characters long, which is too short to be effective.`;
    recommendation = "Expand the description to at least 50 characters to better summarize the page for search engines.";
  } else if (metaDescLength > 160) {
    score = 0.5;
    explanation = `The meta description is ${metaDescLength} characters long, which exceeds the recommended limit.`;
    recommendation = "Shorten the description to around 155-160 characters to prevent truncation in search results.";
  } else {
    score = 1;
    explanation = "The meta description length is within the optimal range (50-160 characters).";
    recommendation = "Ensure the description accurately reflects the page content and includes a call to action if appropriate.";
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
  const exists = links.length > 0; // Boolean for clarity
  const canonical = exists ? (links.attr("href") || "").trim() : "";

  let score = 0;
  let details = "Canonical tag missing";
  let explanation = "";
  let recommendation = "";
  let isSelfReferencing = false;

  if (!exists) {
    score = 0.5; // WARNING
    explanation = "No canonical tag was found in the <head> section of the page.";
    recommendation = "Add a <link rel=\"canonical\" href=\"...\" /> tag pointing to the authoritative URL for this page to prevent duplicate content issues.";
  } else if (links.length > 1) {
    score = 0;
    details = "Multiple canonical tags found";
    explanation = "Multiple <link rel=\"canonical\"> tags were detected on the page.";
    recommendation = "Ensure only one canonical tag is present per page. Remove duplicate tags.";
  } else if (!canonical) {
    score = 0;
    details = "Canonical tag empty";
    explanation = "A canonical tag exists, but the href attribute is empty.";
    recommendation = "Add the correct absolute URL to the href attribute of the canonical tag.";
  } else {
    try {
      const canonicalUrl = new URL(canonical, url);
      const currentUrl = new URL(url);

      // Helper: Get comparison string
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
        explanation = "The canonical tag correctly points to the current page URL.";
        recommendation = "No action needed. This confirms the page is the master version.";
      } else {
        // Check if same root domain
        const canonHost = canonicalUrl.hostname.replace(/^www\./, '');
        const currHost = currentUrl.hostname.replace(/^www\./, '');

        if (canonHost === currHost) {
          score = 1;
          details = "Canonical points to another internal URL";
          explanation = "The canonical tag points to a different URL on the same domain. This indicates this page is a duplicate or variant.";
          recommendation = "Ensure this is intentional (e.g., for tracking parameters or similar content). If this page should be indexed, point the canonical to itself.";
        } else {
          score = 0; // ERROR
          details = "Canonical points to external domain";
          explanation = "The canonical tag points to a completely different domain.";
          recommendation = "Verify if this is a cross-domain syndication. If not, correct the canonical link to point to your own domain.";
        }
      }
    } catch (e) {
      score = 0;
      details = "Invalid Canonical URL";
      explanation = "The URL specified in the canonical tag is malformed.";
      recommendation = "Correct the URL format in the canonical tag (ensure it includes protocol like https://).";
    }
  }

  return evaluateParameter(score, details, {
    canonical,
    exists: exists ? 1 : 0, // Keep 1/0 for compatibility if needed, but logic uses boolean
    isSelfReferencing,
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

  // 3. Social Links
  const socialDomains = ["facebook.com", "twitter.com", "x.com", "linkedin.com", "instagram.com", "youtube.com", "pinterest.com", "tiktok.com", "reddit.com", "whatsapp.com", "snapchat.com", "medium.com"];
  const foundLinks = [];
  $("a").each((i, el) => {
    const href = $(el).attr("href");
    if (href) {
      try {
        const hostname = new URL(href, "https://example.com").hostname.toLowerCase();
        if (socialDomains.some(domain => hostname.includes(domain))) foundLinks.push(href);
      } catch (e) { }
    }
  });
  const uniqueLinks = [...new Set(foundLinks)];
  const linkScore = uniqueLinks.length > 0 ? 1 : 0.5; // WARNING
  const linkDetails = linkScore === 1 ? `${uniqueLinks.length} social profiles found` : "No social media links found";
  const socialLinksMetric = evaluateParameter(linkScore, linkDetails, { links: uniqueLinks, count: uniqueLinks.length, parameter: "1 if at least one social profile link exists" });

  return { ogMetric, twitterMetric, socialLinksMetric };
};

const checkRobotsTxt = async (url) => {
  try {
    const robotsUrl = new URL("/robots.txt", url).href;

    const response = await fetch(robotsUrl, { 
      headers: { 
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(6000) 
    });

    const exists = response.ok;
    const content = exists ? await response.text() : null;

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

      // 👉 Extract only User-agent: * section
      const globalBlockMatch = normalized.match(
        /User-agent:\s*\*([\s\S]*?)(?=User-agent:|$)/i
      );

      const globalRules = globalBlockMatch ? globalBlockMatch[1] : "";

      // 🚨 Check if full site blocked for all bots
      const isFullyBlocked = /Disallow:\s*\/\s*$/m.test(globalRules);

      if (isFullyBlocked) {
        score = 0;
        details = "Wrong config (site fully blocked)";
      } 
      else {
        // ⚠️ Check for aggressive query blocking (matches "Disallow: /*?" or "Disallow: /*?*")
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

    const explanation = exists
      ? "Robots.txt file detected and analyzed for crawler access rules."
      : "Robots.txt is missing. Crawlers may index sensitive or unwanted pages.";

    const recommendation = exists
      ? "Ensure important pages are allowed and only sensitive or duplicate URLs are disallowed."
      : "Add a robots.txt file at the root to control crawler behavior.";

    return evaluateParameter(score, details, {
      content,
      exists: exists ? 1 : 0,
      why_this_occurred: explanation,
      how_to_fix: recommendation,
    });

  } catch (e) {
    return evaluateParameter(0, "Robots.txt check failed", { 
      error: e.message 
    });
  }
};

const checkSitemap = async (url, robotsContent = null) => {
  try {
    const sitemapUrl = new URL("/sitemap.xml", url).href;
    const sitemapIndexUrl = new URL("/sitemap_index.xml", url).href;

    const urlsToTry = [sitemapUrl, sitemapIndexUrl];

    // 🔍 Extract sitemap URLs from robots.txt
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

    let exists = false;
    let content = null;

    const headers = { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' 
    };

    // 🔄 Try multiple sitemap URLs
    for (const target of urlsToTry) {
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

    let score = 0;
    let details = "Sitemap check";

    if (!exists) {
      // ⚠️ MISSING
      score = 0.5;
      details = "sitemap.xml missing";
    } 
    else {
      // ❌ BROKEN / INVALID
      const isValidStructure =
        content.includes("<urlset") || content.includes("<sitemapindex");

      if (!isValidStructure) {
        score = 0;
        details = "Sitemap broken / invalid";
      } 
      else {
        // ⚠️ OUTDATED (no lastmod OR very old)
        const lastmodMatches = content.match(/<lastmod>(.*?)<\/lastmod>/gi);

        let isOutdated = false;

        if (!lastmodMatches) {
          isOutdated = true; // no lastmod at all
        } else {
          const now = new Date();

          for (let tag of lastmodMatches) {
            const dateStr = tag.replace(/<\/?lastmod>/gi, "").trim();
            const date = new Date(dateStr);

            if (!isNaN(date)) {
              const diffDays = (now - date) / (1000 * 60 * 60 * 24);

              if (diffDays > 180) { // 6 months
                isOutdated = true;
                break;
              }
            }
          }
        }

        if (isOutdated) {
          score = 0.5;
          details = "Sitemap outdated";
        } else {
          // ✅ GOOD
          score = 1;
          details = "Proper sitemap";
        }
      }
    }

    const explanation = exists
      ? "A sitemap was found and validated for structure and freshness."
      : "No sitemap was found. Search engines may miss important pages.";

    const recommendation = exists
      ? "Keep your sitemap updated with <lastmod> and submit it to search engines."
      : "Create a sitemap.xml and reference it in robots.txt.";

    return evaluateParameter(score, details, {
      content,
      exists: exists ? 1 : 0,
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
        .map(el => {
          try { return JSON.parse(el.innerText); } catch { return null; }
        })
        .filter(Boolean);

      const types = scripts.map(s => s['@type']).filter(Boolean);
      return { hasData: scripts.length > 0, types: types.join(', '), content: scripts };
    });

    const score = result.hasData ? 1 : 0.5; // WARNING
    const details = result.hasData ? "Structured Data found" : "Structured Data missing";

    const explanation = result.hasData
      ? `Found JSON-LD structured data of type(s): ${result.types}.`
      : "No JSON-LD structured data found on the page.";
    const recommendation = result.hasData
      ? "Ensure your structured data is valid according to Schema.org and covers key elements."
      : "Add Schema.org structured data (JSON-LD) to help search engines understand your content and display rich snippets.";

    return evaluateParameter(score, details, {
      content: result.content,
      types: result.types,
      exists: result.hasData,
      why_this_occurred: explanation,
      how_to_fix: recommendation,
    });
  } catch (e) {
    return evaluateParameter(0, "Structured Data check failed", { error: e.message });
  }
};

export default async function seoMetrics(url, $, page) {

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
  const robotsMetric = await checkRobotsTxt(url);
  const sitemapMetric = await checkSitemap(url, robotsMetric?.meta?.content);
  const structuredDataMetric = await checkStructuredData(page);

  const { ogMetric, twitterMetric, socialLinksMetric } = checkSocial($);

  const weights = {
    Title: 0.15,
    Meta_Description: 0.08,
    H1: 0.10,
    Duplicate_Content: 0.12,
    Image: 0.08,
    Canonical: 0.08,
    Contextual_Linking: 0.08,
    Sitemap: 0.05,
    Robots_Txt: 0.04,
    Structured_Data: 0.06,
    Heading_Hierarchy: 0.03,
    URL_Slugs: 0.03,
    Links: 0.03,
    Semantic_Tags: 0.01,
    Video: 0.01,
    Open_Graph: 0.02,
    Twitter_Card: 0.02,
    Social_Links: 0.01
  };

  const getScore = (metric) => metric?.score || 0;

  const weightedScore =
    (getScore(titleMetric) * weights.Title) +
    (getScore(metaDescMetric) * weights.Meta_Description) +
    (getScore(h1Metric) * weights.H1) +
    (getScore(contentQualityMetric) * weights.Duplicate_Content) +
    (getScore(imageMetric) * weights.Image) +
    (getScore(canonicalMetric) * weights.Canonical) +
    (getScore(contextualMetric) * weights.Contextual_Linking) +
    (getScore(sitemapMetric) * weights.Sitemap) +
    (getScore(robotsMetric) * weights.Robots_Txt) +
    (getScore(structuredDataMetric) * weights.Structured_Data) +
    (getScore(hierarchyMetric) * weights.Heading_Hierarchy) +
    (getScore(slugMetric) * weights.URL_Slugs) +
    (getScore(linksMetric) * weights.Links) +
    (getScore(semanticMetric) * weights.Semantic_Tags) +
    (getScore(videoMetric) * weights.Video) +
    (getScore(ogMetric) * weights.Open_Graph) +
    (getScore(twitterMetric) * weights.Twitter_Card) +
    (getScore(socialLinksMetric) * weights.Social_Links);

  const actualPercentage = parseFloat(weightedScore.toFixed(0));

  return {
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
    Robots_Txt: robotsMetric,
    Sitemap: sitemapMetric,
    Structured_Data: structuredDataMetric,
    Open_Graph: ogMetric,
    Twitter_Card: twitterMetric,
    Social_Links: socialLinksMetric,
    Percentage: actualPercentage,
  };
}