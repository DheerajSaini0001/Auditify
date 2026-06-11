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
        }
        return;
      }

      // Non-nav (content area) links:
      // Include if → has no visible text (icon/image anchor) OR text is related to the URL
      if (!text || isTextRelatedToUrl(text, href)) {
        contentLinks.add(href);
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

const checkRobotsTxt = async (url, page) => {
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

    // Gather + dedupe same-origin candidates.
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
        // skip
      }
    });

    // Classify into page types.
    const byType = {};
    for (const u of candidateSet) {
      const type = tuClassifyPageType(u);
      if (!type) continue;
      (byType[type] = byType[type] || []).push(u);
    }

    // Select target pages: one per type, then fill with extra VDP/SRP (for
    // uniqueness comparison), capped at 6 fetches.
    const pickShortest = (arr) => arr.slice().sort((a, b) => a.length - b.length)[0];
    const targets = [];
    ["contact", "about", "tradein", "service", "srp", "vdp"].forEach((t) => {
      if (byType[t]?.length) targets.push({ type: t, url: pickShortest(byType[t]) });
    });
    const used = new Set(targets.map((x) => x.url));
    for (const t of ["vdp", "srp"]) {
      for (const u of byType[t] || []) {
        if (targets.length >= 6) break;
        if (!used.has(u)) {
          targets.push({ type: t, url: u });
          used.add(u);
        }
      }
    }

    if (!targets.length) {
      return evaluateParameter(0.5, "No target content pages found", {
        score10: 0, maxScore: 10, pagesAnalyzed: 0, pages: [],
        failureReasons: ["No target pages (SRP, VDP, Service, Trade-In, About, Contact) found to analyze"],
        statusLabel: "Inconclusive",
        why_this_occurred:
          "Could not identify any target content pages (inventory, vehicle, service, trade-in, about or contact) in the site's navigation or sitemap.",
        how_to_fix: "Ensure key pages are crawlable via the sitemap and homepage navigation.",
      });
    }

    // Fetch + extract content for each target.
    const pages = [];
    for (const tgt of targets) {
      const html = await tuFetchRaw(tgt.url, page);
      if (!html) {
        pages.push({ ...tgt, loaded: false });
        continue;
      }
      const $b = cheerio.load(html);
      $b('script, style, noscript, header, footer, nav, [role=navigation], [class*="cookie" i], [id*="cookie" i], [class*="consent" i], [id*="consent" i], [class*="gdpr" i]').remove();
      const text = ($b("body").text() || "").replace(/\s+/g, " ").trim();
      const headings = $b("h1,h2,h3,h4,h5,h6").map((i, el) => $b(el).text().trim()).get().join(" | ");
      const tokens = text.toLowerCase().split(/\s+/).filter((w) => /[a-z0-9]/i.test(w));
      const wordCount = tokens.length;
      pages.push({
        ...tgt,
        loaded: true,
        text,
        headings,
        wordCount,
        fp: tuFingerprint(tokens.slice(0, 2000)),
      });
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
  const contextualMetric = await checkContextualLinks($, url);
  const linksMetric = checkLinks($, url);



  const contentRelevanceMetric = checkContentRelevance($, titleMetric.meta.title, metaDescMetric.meta.description);
  const slugMetric = checkSlugs(url);
  const robotsMetric = await checkRobotsTxt(url, page);
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
  // Standalone 0–10 service-page quality score (output-only, not weighted).
  const serviceContentMetric = await checkServiceContentQuality(url, $, page, sitemapMetric?.meta?.content);
  // Standalone 0–10 content depth/uniqueness/relevance score (output-only).
  const contentDepthMetric = await checkContentDepthQuality(url, $, page, sitemapMetric?.meta?.content);
  // E-E-A-T (Experience, Expertise, Authoritativeness, Trust) 0–10 score (weighted).
  const eeatMetric = await checkEEAT(url, $, page, sitemapMetric?.meta?.content);
  // Local SEO signals (8 sub-signals). Output-only — not weighted into Percentage.
  const localSEOMetric = await checkLocalSEO(
    url,
    $,
    page,
    structuredDataMetric?.meta?.content,
    titleMetric?.meta?.title,
    metaDescMetric?.meta?.description
  );

  const { ogMetric, twitterMetric, socialLinksMetric } = checkSocial($);

  const weights = {
    Title: 0.04,
    Title_Uniqueness: 0.04,
    Title_Keyword_Optimization: 0.04,
    Title_Location_Optimization: 0.03,
    Meta_Description: 0.05,
    Meta_Description_Uniqueness: 0.03,
    H1: 0.10,
    Content_Relevance: 0.10,
    Duplicate_Content: 0.02,
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
    Social_Links: 0.01,
    EEAT: 0.08
  };

  const getScore = (metric) => metric?.score || 0;

  const weightedScore =
    (getScore(titleMetric) * weights.Title) +
    (getScore(titleUniquenessMetric) * weights.Title_Uniqueness) +
    (getScore(titleKeywordMetric) * weights.Title_Keyword_Optimization) +
    (getScore(titleLocationMetric) * weights.Title_Location_Optimization) +
    (getScore(metaDescMetric) * weights.Meta_Description) +
    (getScore(metaDescUniquenessMetric) * weights.Meta_Description_Uniqueness) +
    (getScore(h1Metric) * weights.H1) +
    (contentRelevanceMetric.percentage * weights.Content_Relevance) +
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
    (getScore(socialLinksMetric) * weights.Social_Links) +
    (getScore(eeatMetric) * weights.EEAT);

  // Normalize by the sum of weights actually used above (Duplicate_Content and
  // URL_Structure are defined in the map but NOT weighted, so we can't blindly
  // sum Object.values). Dividing by this total proportionally rescales every
  // weight to sum to 1.0, putting the score on a true 0–100 scale.
  const totalWeight =
    weights.Title + weights.Title_Uniqueness + weights.Title_Keyword_Optimization +
    weights.Title_Location_Optimization + weights.Meta_Description + weights.Meta_Description_Uniqueness +
    weights.H1 + weights.Content_Relevance + weights.Image + weights.Canonical +
    weights.Contextual_Linking + weights.Sitemap + weights.Robots_Txt + weights.Structured_Data +
    weights.Heading_Hierarchy + weights.URL_Slugs + weights.Links + weights.Semantic_Tags +
    weights.Video + weights.Open_Graph + weights.Twitter_Card + weights.Social_Links + weights.EEAT;

  const actualPercentage = parseFloat((weightedScore / totalWeight).toFixed(0));

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
    Video: videoMetric,
    Heading_Hierarchy: hierarchyMetric,
    Semantic_Tags: semanticMetric,
    Contextual_Linking: contextualMetric,
    Links: linksMetric,
    Content_Relevance: contentRelevanceMetric,
    URL_Slugs: slugMetric,
    Robots_Txt: robotsMetric,
    Sitemap: sitemapMetric,
    Structured_Data: structuredDataMetric,
    Service_Content_Quality: serviceContentMetric,
    Content_Depth_Quality: contentDepthMetric,
    Local_SEO: localSEOMetric,
    Open_Graph: ogMetric,
    Twitter_Card: twitterMetric,
    Social_Links: socialLinksMetric,
    EEAT: eeatMetric,
    Percentage: actualPercentage,
  };
}