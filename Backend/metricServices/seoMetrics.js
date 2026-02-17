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
    // Weighted Score: Alt (50%), Meaningful (20%), Title (10%), Size (20%)
    const weightedScore = (altScore * 0.5) + (meaningfulScore * 0.2) + (titleScore * 0.1) + (sizeScore * 0.2);
    const score = parseFloat(weightedScore.toFixed(2));

    const details = score === 1 ? "Images are fully optimized" : "Image optimization opportunities found";

    // Simplified Logic for Explanations
    let explanation = "";
    let recommendation = "";

    if (total === 0) {
      explanation = "No images were found on this page.";
      recommendation = "Use relevant images to enhance user engagement where necessary.";
    } else {
      const issues = [];
      if (withAlt < total) issues.push(`${total - withAlt} images missing Alt text`);
      if (largeImages.length > 0) issues.push(`${largeImages.length} images file size > 150KB`);
      if (meaningfulAlt < total) issues.push(`${total - meaningfulAlt} images have weak/generic Alt text`);

      if (issues.length > 0) {
        explanation = `Found optimization opportunities: ${issues.join(", ")}.`;
        recommendation = "Add descriptive Alt text to all images and compress large files to under 150KB (WebP format recommended).";
      } else {
        explanation = "All images have valid Alt text, titles, and are optimized for size.";
        recommendation = "Continue using descriptive Alt tags and optimized image formats.";
      }
    }

    return evaluateParameter(score, details, {
      total,
      withAlt,
      meaningfulAlt,
      missingAlt: missingAlt.slice(0, 50),
      withTitle,
      missingTitle: missingTitle.slice(0, 50),
      largeImages,
      why_this_occurred: explanation,
      how_to_fix: recommendation,
      importance: "High",
      seo_best_practices: "Images should have descriptive Alt text for accessibility and SEO. File sizes should be compressed (WebP) for fast loading.",
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

    let baseHostname;
    try {
      baseHostname = new URL(url).hostname;
    } catch (e) {
      baseHostname = "";
    }

    links.forEach(link => {
      const href = $(link).attr("href");
      if (!href) return;

      // Filter obviously non-link schemes to avoid noise if desired, 
      // but new URL() check below handles protocols well.
      // We keep raw href in unique set to match previous behavior or consider resolving it.
      unique.add(href);

      const originalText = $(link).text().trim();
      const lowerText = originalText.toLowerCase();
      if (lowerText && !genericAnchors.includes(lowerText)) descriptiveCount++;

      const target = ($(link).attr("target") || "_self").trim();

      try {
        // Resolve absolute URL to handle relative paths and base tags implicitly
        const resolvedUrl = new URL(href, url);

        // Only count http/https links
        if (resolvedUrl.protocol === "http:" || resolvedUrl.protocol === "https:") {
          // Normalize (strip www.)
          const linkHostname = resolvedUrl.hostname.replace(/^www\./, '');
          const baseHost = baseHostname.replace(/^www\./, '');

          // Internal: Same Hostname
          if (linkHostname === baseHost) {
            internal++;
            internalLinksList.push({ href, text: originalText || "[No Text]", target });
          }
          // External: Different Hostname
          else {
            external++;
            externalLinksList.push({ href, text: originalText || "[No Text]", target });
          }
        }
      } catch (e) {
        // Skip invalid URLs (javascript:..., mailto:..., or malformed)
      }
    });

    const uniqueCount = unique.size;
    const descRatio = total > 0 ? descriptiveCount / total : 1;
    const score = descRatio > 0.75 ? 1 : 0.5;
    const details = score === 1 ? "Start links use descriptive text" : "Some links use generic text";

    let explanation = "";
    let recommendation = "";
    const issueList = [];

    // Analyze Descriptive Text
    if (descRatio < 0.75) {
      issueList.push(`${total - descriptiveCount} links use generic text (e.g., "click here")`);
    }

    // Analyze Internal/External Balance
    if (internal === 0 && total > 0) {
      issueList.push("No internal links found (orphan page risk)");
    }

    // Analyze Open Targets
    const unsafeExternal = externalLinksList.filter(l => l.target !== "_blank").length; // Simplified check, ideally check rel=noopener too
    if (unsafeExternal > 0) {
      // Not a hard failure usually, but good to note
    }

    if (total === 0) {
      explanation = "No navigational or content links were found on this page.";
      recommendation = "Add internal links to other relevant pages and external links to authoritative sources.";
    } else if (issueList.length > 0) {
      explanation = `Link profile analysis found issues: ${issueList.join(", ")}.`;
      recommendation = "Update generic link text to be descriptive and ensure a healthy mix of internal and external links.";
    } else {
      explanation = "The page has a healthy link profile with descriptive anchor text.";
      recommendation = "Maintain this balance. Ensure external links open in new tabs where appropriate.";
    }

    return evaluateParameter(score, details, {
      total,
      internal,
      external,
      unique: uniqueCount,
      internalLinks: internalLinksList,
      externalLinks: externalLinksList,
      why_this_occurred: explanation,
      how_to_fix: recommendation,
      seo_best_practices: "Use descriptive anchor text. Internal links help structure. External links add authority.",
      parameter: "1 if ≥ 75% links are descriptive, else 0"
    });
  } catch (err) {
    return evaluateParameter(0, "Error checking links", { error: err.message });
  }
};


const checkSemanticTags = async ($) => {
  try {
    const tags = ["main", "nav", "article", "section", "header", "footer", "aside"];
    const result = {};
    const foundTags = [];
    const missingTags = [];
    const potentialReplacements = []; // Store detected class-based alternatives

    tags.forEach(tag => {
      const count = $(tag).length;
      result[tag] = count > 0 ? 1 : 0;

      if (count > 0) {
        foundTags.push(tag);
      } else {
        missingTags.push(tag);
        // Heuristic Check: Check for IDs or Classes that suggest this tag should exist
        // e.g. <div class="header"> or <div id="nav">
        const heuristicSelector = `div[class*="${tag}"], div[id*="${tag}"]`;
        if ($(heuristicSelector).length > 0) {
          potentialReplacements.push(tag);
        }
      }
    });

    // Scoring Logic
    // Weight core tags higher: Main, Nav, Header, Footer
    const coreTags = ["main", "nav", "header", "footer"];
    const optionalTags = ["article", "section", "aside"];

    let coreCount = 0;
    coreTags.forEach(t => { if (result[t]) coreCount++; });

    let optionalCount = 0;
    optionalTags.forEach(t => { if (result[t]) optionalCount++; });

    let finalScore = 0;

    // Core is 70% of score, Optional is 30%
    // 4 core tags = 0.7 points
    // 3 optional tags = 0.3 points

    const coreScore = (coreCount / coreTags.length) * 0.7;
    const optionalScore = (optionalCount / optionalTags.length) * 0.3;

    finalScore = parseFloat((coreScore + optionalScore).toFixed(2));

    let details = "";
    let explanation = "";
    let recommendation = "";

    if (finalScore === 1) {
      details = "Excellent Semantic Structure";
      explanation = "The page effectively uses all key HTML5 semantic elements (header, nav, main, footer, etc.).";
      recommendation = "Maintain this structure to ensure accessibility and clear document outlines.";
    } else if (finalScore >= 0.7) {
      details = "Good Semantic Structure";
      explanation = `Most core structure tags are present. Missing: ${missingTags.join(", ")}.`;

      if (potentialReplacements.length > 0) {
        recommendation = `We detected divs that might serve as semantic elements. Try converting <div class="${potentialReplacements[0]}"> to <${potentialReplacements[0]}>.`;
      } else {
        recommendation = `Consider adding the missing <${missingTags[0]}> tag to further define your content structure.`;
      }
    } else {
      details = "Weak Semantic Structure";
      explanation = `The page relies heavily on generic <div> elements. Missing critical tags: ${missingTags.join(", ")}.`;

      if (potentialReplacements.length > 0) {
        recommendation = `Detected potential ${potentialReplacements.join(", ")} usage in divs. Using native HTML5 tags like <${potentialReplacements[0]}> is better for SEO and accessibility than <div class="${potentialReplacements[0]}">.`;
      } else {
        recommendation = "Refactor the layout to use <header>, <nav>, <main>, and <footer> for better accessibility and SEO understanding.";
      }
    }

    return evaluateParameter(finalScore, details, {
      ...result,
      found: foundTags,
      missing: missingTags,
      potentialReplacements, // Explicitly return this for frontend use
      why_this_occurred: explanation,
      how_to_fix: recommendation,
      importance: "Medium",
      seo_best_practices: "HTML5 semantic tags provide meaning to page structure, helping screen readers and search engines understand content roles.",
      parameter: "Weighted presence of Header, Nav, Main, Footer (Core) + Article, Section, Aside"
    });
  } catch (err) {
    return evaluateParameter(0, "Error checking semantic tags", { error: err.message, importance: "Medium" });
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
      const $el = $(el);
      const href = $el.attr("href");

      // STRICT CHECK: Ensure this link is NOT inside a known navigation container
      // (nav, header, footer, .navbar, .menu, .sidebar)
      // .closest() checks parent ancestry.
      if ($el.closest("nav, header, footer, .navbar, .menu, .sidebar, .nav").length > 0) {
        return; // Skip nav links
      }

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
    // List of utility keywords to ignore in "Missing" check
    const ignoredPatterns = ["login", "signin", "sign-in", "register", "signup", "sign-up", "cart", "checkout", "account", "profile", "logout", "contact", "about", "privacy", "terms"];

    menuLinks.forEach(link => {
      // logic to check importance? Assume top-level nav is important.
      // Only check internal links
      if (link.startsWith("/") || link.includes(url)) {
        if (!contentLinks.has(link)) {
          // Check if it's a utility page
          const lowerLink = link.toLowerCase();
          if (!ignoredPatterns.some(pattern => lowerLink.includes(pattern))) {
            missingLinks.push(link);
          }
        }
      }
    });

    if (score === 1 && missingLinks.length > 5) { // Increased threshold slightly to be less sensitive
      score = 0.8;
    }

    const details = score === 1 ? "Good contextual linking" : score === 0.8 ? "Optimization Opportunity" : "No contextual links found";

    let explanation = "";
    let recommendation = "";

    if (totalContentLinks === 0) {
      explanation = "No links were found within the main content body (paragraphs, articles).";
      recommendation = "Add internal links naturally within your content to guide users to related topics.";
    } else if (missingLinks.length > 0) {
      explanation = `Found ${totalContentLinks} links in content, but some key menu items are not referenced in the text.`;
      recommendation = "Consider linking to your key service or category pages directly from the article text where relevant to boost their authority.";
    } else {
      explanation = "The page effectively uses in-text links to reference related content.";
      recommendation = "Continue using descriptive anchor text for your contextual links.";
    }

    return evaluateParameter(score, details, {
      totalContextual: totalContentLinks,
      foundLinks: Array.from(contentLinks),
      missingLinks: missingLinks.slice(0, 20),
      issues: issues,
      why_this_occurred: explanation,
      how_to_fix: recommendation,
      seo_best_practices: "Contextual links (in-body) carry more weight than navigation links. They help search engines understand the relationship between pages.",
      parameter: "1 if content links exist, 0.8 if key menu links missing, 0 if none"
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
  // Use a clone to avoid modifying the original DOM for other checks
  const $body = $("body").clone();

  // Remove scripts, styles, and non-visible elements
  $body.find("script, style, noscript, template, svg, img, video, iframe, link, meta, [hidden], [aria-hidden='true'], header, footer, nav").remove();

  const text = $body.text().replace(/\s+/g, " ").trim();
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

    const score = Math.max(0, 1 - (issues.length * 0.2));
    const details = issues.length === 0 ? "URL structure matches best practices" : `${issues.length} issues found`;

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
      importance: "Medium",
      seo_best_practices: "URLs should be short, descriptive, lowercase, use hyphens as separators, and avoid unnecessary parameters.",
      parameter: 'Clean, short, lowercase, hyphen-separated, no params, shallow depth'
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
    importance: "Critical",
    seo_best_practices: "Titles should be unique, include main keywords near the beginning, and ideally be between 30-60 characters.",
    parameter: '1 if title exists and 30–60 characters, else 0'
  });
};

/* ... meta description and canonical code is skipped for brevity ... */

const checkH1 = ($) => {
  const h1Count = $("h1").length;
  const content = $("h1").map((i, el) => $(el).text().trim()).get();

  let score = 0;
  let details = "H1 tag missing";
  let explanation = "";
  let recommendation = "";

  if (h1Count === 0) {
    score = 0;
    details = "Missing H1 tag";
    explanation = "No <h1> tag was found on the page.";
    recommendation = "Add exactly one <h1> tag that describes the main topic of the page. It's crucial for SEO and accessibility.";
  } else if (h1Count === 1) {
    score = 1;
    details = "Exactly one H1 tag found";
    explanation = "The page correctly contains a single H1 tag.";
    recommendation = "Ensure the H1 text contains your primary keyword and is compelling to users.";
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
    importance: "High",
    seo_best_practices: "Use a single H1 tag for the main page title. It helps search engines understand the primary topic of your content.",
    parameter: '1 if exactly one H1, 0.5 if >1, 0 if none'
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
    importance: "High",
    seo_best_practices: "Meta descriptions should be unique, actionable summaries of the page content, ideally between 50-160 characters.",
    parameter: '1 if meta description exists and 50-160 characters, else 0'
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
    score = 0;
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
          score = 0.5;
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
    importance: "High",
    seo_best_practices: "Every page should have a self-referencing canonical tag unless it is a duplicate of another page. It prevents duplicate content issues.",
    parameter: '1 if valid canonical exists'
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
  let ogScore = ogCount === ogRequired.length ? 1 : (ogCount > 0 ? 0.5 : 0);
  const ogMissing = ogRequired.filter(key => !ogTags[key]);
  const ogDetails = ogScore === 1 ? "Open Graph tags are optimized" : ogScore === 0.5 ? `Missing key OG tags: ${ogMissing.join(", ")}` : "No Open Graph tags found";
  const ogMetric = evaluateParameter(ogScore, ogDetails, { tags: ogTags, missing: ogMissing, parameter: "1 if og:title, og:image, og:url exist" });

  // 2. Twitter Card
  const twTags = {
    "twitter:site": $('meta[name="twitter:site"]').attr("content"),
    "twitter:card": $('meta[name="twitter:card"]').attr("content"),
    "twitter:image": $('meta[name="twitter:image"]').attr("content"),
    "twitter:title": $('meta[name="twitter:title"]').attr("content"),
    "twitter:description": $('meta[name="twitter:description"]').attr("content")
  };
  const twRequired = ["twitter:card", "twitter:title"];
  const twCount = twRequired.reduce((acc, key) => acc + (twTags[key] ? 1 : 0), 0);
  let twScore = twCount === twRequired.length ? 1 : (twCount > 0 ? 0.5 : 0);
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
  const linkScore = uniqueLinks.length > 0 ? 1 : 0;
  const linkDetails = linkScore === 1 ? `${uniqueLinks.length} social profiles found` : "No social media links found";
  const socialLinksMetric = evaluateParameter(linkScore, linkDetails, { links: uniqueLinks, count: uniqueLinks.length, parameter: "1 if at least one social profile link exists" });

  return { ogMetric, twitterMetric, socialLinksMetric };
};

export default async function seoMetrics(url, $, page) {

  // Scrape Schema
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

  // Consoliated Social Check
  const { ogMetric, twitterMetric, socialLinksMetric } = checkSocial($);

  // 3. Scoring Weights (Sum = 100)
  const weights = {
    Title: 12,
    Meta_Description: 9,
    URL_Structure: 6,
    Canonical: 8,
    H1: 9,
    Image: 11,
    Video: 3,
    Heading_Hierarchy: 6,
    Semantic_Tags: 3,
    Contextual_Linking: 9,
    Links: 5,
    Duplicate_Content: 9,
    URL_Slugs: 4,
    HTTPS: 6
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

  return {
    Schema: structuredData,
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
    Open_Graph: ogMetric,
    Twitter_Card: twitterMetric,
    Social_Links: socialLinksMetric,
    Percentage: actualPercentage,
  };
}