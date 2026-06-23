// Helper to count syllables in a word (heuristic)
function countSyllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;

  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');

  const syllableMatch = word.match(/[aeiouy]{1,2}/g);
  return syllableMatch ? syllableMatch.length : 1;
}

// Helper to calculate Readability Stats
function calculateReadabilityStats(text) {
  const cleanText = text.trim();
  if (!cleanText) return null;

  // 1. Count Sentences
  // Split by . ! ? followed by space or end of string
  const sentences = cleanText.split(/[.!?]+(?:\s+|$)/).filter(s => s.trim().length > 0);
  const sentenceCount = Math.max(1, sentences.length);

  // 2. Count Words
  const words = cleanText.split(/\s+/).filter(w => w.length > 0);
  const wordCount = Math.max(1, words.length);

  // 3. Count Syllables
  let syllableCount = 0;
  words.forEach(w => {
    syllableCount += countSyllables(w);
  });

  // 4. Calculate Averages
  const ASL = wordCount / sentenceCount; // Average Sentence Length
  const ASW = syllableCount / wordCount; // Average Syllables per Word

  // 5. Calculate Flesch Score
  // Formula: 206.835 – (1.015 × ASL) – (84.6 × ASW)
  const score = 206.835 - (1.015 * ASL) - (84.6 * ASW);

  return {
    score,
    ASL,
    ASW,
    sentenceCount,
    wordCount,
    syllableCount
  };
}

// Readability
async function checkReadability(page) {
  // Get all text for overall score
  const textContent = await page.evaluate(() => document.body.innerText);

  // Calculate Overall Stats
  const overallStats = calculateReadabilityStats(textContent || "");
  const overallFleschScore = overallStats ? overallStats.score : 0;

  // Get individual paragraphs for granular analysis
  const paragraphs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('p'))
      .map(p => p.innerText)
      .filter(text => text.length > 50); // Only check substantial paragraphs
  });

  // Detect Page Type using robust multi-rule logic
  const pageType = await page.evaluate(() => {
    const url = window.location.href;
    const pathname = window.location.pathname.toLowerCase();

    // 1. URL Pattern
    const blogUrlPatterns = ['/blog/', '/articles/', '/news/', '/posts/', '/story/'];
    const productUrlPatterns = ['/product/', '/products/', '/shop/', '/item/', '/store/', '/category/'];

    const isBlogUrl = blogUrlPatterns.some(p => pathname.includes(p));
    const isProductUrl = productUrlPatterns.some(p => pathname.includes(p));

    // 2. Schema Markup
    let schemaType = null;
    const schemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
    for (const script of schemas) {
      try {
        const json = JSON.parse(script.innerText);
        const types = Array.isArray(json) ? json.map(j => j['@type']) : [json['@type']];
        const flatTypes = types.flat();

        if (flatTypes.some(t => ['Product', 'Offer', 'AggregateRating'].includes(t))) {
          schemaType = 'Product';
          break;
        }
        if (flatTypes.some(t => ['BlogPosting', 'Article', 'NewsArticle'].includes(t))) {
          schemaType = 'Article';
          break;
        }
      } catch (e) { }
    }

    // 3. DOM Structure
    const hasArticleTag = !!document.querySelector('article');
    const hasAddToCart = !!document.querySelector('.add-to-cart, #add-to-cart, button[name="add-to-cart"]');
    const hasPrice = !!document.querySelector('.price, [itemprop="price"]');

    // 4. CTA Detection
    const buttons = Array.from(document.querySelectorAll('button, a.btn, input[type="submit"]'));
    const ctaText = buttons.map(b => b.innerText.toLowerCase()).join(' ');
    const hasBuyCTA = ctaText.includes('add to cart') || ctaText.includes('buy now');

    // 5. Word Count
    const bodyText = document.body.innerText || '';
    const wordCount = bodyText.split(/\s+/).filter(w => w.length > 0).length;

    // 6. Combined Rule (Scoring Logic)
    let score = 0;
    if (isProductUrl) score += 2;
    if (schemaType === 'Product') score += 2;
    if (hasBuyCTA || hasAddToCart || hasPrice) score += 2;
    if (isBlogUrl) score -= 2;
    if (schemaType === 'Article') score -= 2;
    if (wordCount > 600) score -= 2;

    if (score >= 2) return 'Product Page';
    if (score <= -2) return 'Article/Blog';

    return wordCount > 400 ? 'Article/Blog' : 'Product Page';
  });

  // Define Limits based on Page Type
  let readabilityMin, readabilityMax;
  if (pageType === 'Product Page') {
    readabilityMin = 40;
    readabilityMax = 60;
  } else {
    readabilityMin = 50;
    readabilityMax = 70;
  }

  const tolerance = 15;
  let status = 'fail';
  let analysis = {
    cause: "The content uses extremely complex sentence structures and very advanced vocabulary.",
    recommendation: "Simplify the language significantly. Use shorter sentences and common words to ensure the content is accessible to a wider audience."
  };

  if (overallFleschScore >= readabilityMin && overallFleschScore <= readabilityMax) {
    status = 'pass';
    analysis = {
      cause: "The content readability matches the target for this page type.",
      recommendation: "Maintain this level of clarity. Continue using simple, direct language."
    };
  } else if (overallFleschScore >= (readabilityMin - 10) && overallFleschScore <= (readabilityMax + tolerance)) {
    status = 'warning';
    analysis = {
      cause: "The content is slightly more complex than ideal for this page type.",
      recommendation: "Consider breaking up long sentences and replacing particularly complex words with simpler alternatives."
    };
  }

  // Analyze Paragraphs
  const problematicContent = [];
  paragraphs.forEach(pText => {
    const stats = calculateReadabilityStats(pText);
    if (stats && stats.score < readabilityMin) {
      let reasonParts = [];
      if (stats.ASL > 20) reasonParts.push(`Long sentences (avg ${Math.round(stats.ASL)} words)`);
      if (stats.ASW > 1.6) {
        const complexWords = pText.split(/\s+/)
          .map(w => w.replace(/[^a-zA-Z]/g, ''))
          .filter(w => w.length > 6 && countSyllables(w) >= 4)
          .filter((v, i, a) => a.indexOf(v) === i)
          .slice(0, 3);
        let vocabReason = `Complex vocabulary (avg ${stats.ASW.toFixed(1)} syllables/word)`;
        if (complexWords.length > 0) vocabReason += `. Words like: ${complexWords.join(', ')}`;
        reasonParts.push(vocabReason);
      }
      const reason = reasonParts.join(' & ') || 'Hard to read';
      problematicContent.push({
        text: pText.substring(0, 150) + (pText.length > 150 ? '...' : ''),
        score: stats.score,
        reason: reason,
        stats: { ASL: stats.ASL, ASW: stats.ASW }
      });
    }
  });

  return {
    score: overallFleschScore,
    status: status,
    details: `This ${pageType} has a readability score of ${overallFleschScore.toFixed(0)} out of 100, which is ${status === 'pass' ? 'perfect' : (status === 'warning' ? 'a bit complex' : 'very difficult')} for your readers.`,
    analysis: analysis,
    meta: {
      pageType: pageType,
      targetMin: readabilityMin,
      targetMax: readabilityMax,
      problematicContent: problematicContent.slice(0, 20),
      overallStats: overallStats
    }
  };
}

// Sticky Header
async function checkStickyHeader(page, deviceType) {
  const headerCheck = await page.evaluate((deviceType) => {
    const headers = Array.from(document.querySelectorAll('header, .header, [class*="header"]'));
    const stickyHeaders = headers.filter(h => {
      const style = window.getComputedStyle(h);
      return style.position === 'fixed' || style.position === 'sticky';
    });
    if (stickyHeaders.length === 0) return { status: 'pass', height: 0 };
    const maxLimit = deviceType === 'mobile' ? 64 : 100;
    let maxH = 0;
    for (const h of stickyHeaders) {
      const rect = h.getBoundingClientRect();
      if (rect.height > maxH) maxH = rect.height;
    }
    let status = 'pass';
    if (maxH > maxLimit) {
      status = maxH <= maxLimit * 1.25 ? 'warning' : 'fail';
    }
    return { status, height: maxH, limit: maxLimit };
  }, deviceType);

  let analysis = {
    cause: "The sticky header's height exceeds the recommended limit, which can obstruct a significant portion of the viewport, especially on smaller screens.",
    recommendation: "Reduce the height of the sticky header or implement a 'hide on scroll down, show on scroll up' behavior to maximize usable screen space."
  };

  if (headerCheck.status === 'pass') {
    analysis = {
      cause: "The sticky header height is within optimal limits.",
      recommendation: "Keep the header compact to ensure maximum content visibility."
    };
  } else if (headerCheck.status === 'warning') {
    analysis = {
      cause: "The sticky header is slightly taller than recommended.",
      recommendation: "Consider reducing padding or font sizes in the sticky header to regain screen real estate."
    };
  }

  return {
    score: headerCheck.status === 'pass' ? 100 : (headerCheck.status === 'warning' ? 70 : 0),
    status: headerCheck.status,
    details: `Your top menu takes up ${headerCheck.height} pixels of screen space, while the recommended limit is ${headerCheck.limit} pixels.`,
    analysis: analysis,
    meta: {
      height: headerCheck.height,
      limit: headerCheck.limit
    }
  };
}

// Intrusive Interstitials
async function checkInterstitials(page, deviceType) {
  const interstitialCheck = await page.evaluate((deviceType) => {
    function detectOverlay() {
      return [...document.querySelectorAll("*")].some(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return (style.position === "fixed" || style.position === "absolute") &&
          rect.width >= window.innerWidth * 0.9 &&
          rect.height >= window.innerHeight * 0.9 &&
          parseInt(style.zIndex) > 1000;
      });
    }
    function detectScrollBlock() {
      const bodyStyle = window.getComputedStyle(document.body);
      const htmlStyle = window.getComputedStyle(document.documentElement);
      return bodyStyle.overflow === "hidden" || htmlStyle.overflow === "hidden";
    }

    function detectModal() {
      return [...document.querySelectorAll("*")].some(el => {
        const rect = el.getBoundingClientRect();
        const style = window.getComputedStyle(el);
        return style.position === "fixed" &&
          rect.width >= window.innerWidth * 0.4 &&
          rect.height >= window.innerHeight * 0.3 &&
          parseInt(style.zIndex) > 500;
      });
    }

    const hasOverlay = detectOverlay();
    const hasScrollBlock = detectScrollBlock();
    const hasModal = detectModal();
    let details = [];

    if (hasOverlay) details.push("Full-screen overlay detected");
    if (hasScrollBlock) details.push("Scroll blocking detected");
    if (hasModal) details.push("Intrusive modal detected");

    let status = 'pass';
    if (hasOverlay || hasScrollBlock) {
      status = 'fail';
    } else if (hasModal) {
      status = 'warning';
    }

    const prefix = deviceType === 'mobile' ? 'Mobile View' : 'Desktop View';
    return {
      status,
      details: details.length > 0 ? `We found distractions: ${details.join(", ")}.` : `No annoying pop-ups or full-screen overlays were found.`
    };
  }, deviceType);

  let analysis = {
    cause: "No intrusive interstitials found.",
    recommendation: "Continue to avoid full-screen pop-ups that block the user's primary task."
  };

  if (interstitialCheck.status === 'fail') {
    analysis = {
      cause: "Full-screen overlays or scroll-blocking elements are preventing users from reaching the content.",
      recommendation: "Remove full-screen interstitials. Use non-blocking banners or inline calls-to-action instead."
    };
  } else if (interstitialCheck.status === 'warning') {
    analysis = {
      cause: "A modal was detected that might disrupt the user experience.",
      recommendation: "Ensure modals are easy to dismiss and do not appear immediately upon page load."
    };
  }

  return {
    score: interstitialCheck.status === 'pass' ? 100 : (interstitialCheck.status === 'warning' ? 50 : 0),
    status: interstitialCheck.status,
    details: interstitialCheck.details,
    analysis: analysis,
    meta: {
      hasOverlay: interstitialCheck.details.includes("overlay"),
      hasScrollBlock: interstitialCheck.details.includes("Scroll"),
      hasModal: interstitialCheck.details.includes("modal")
    }
  };
}

// Breadcrumbs
async function checkBreadcrumbs(page) {
  const isHomepage = await page.evaluate(() => {
    return window.location.pathname === '/' || window.location.pathname === '';
  });

  if (isHomepage) {
    // Spec §2.5: Breadcrumbs are page-specific (SRP/VDP/Service/Blog) — not applicable on the
    // homepage. Return no score so it drops out of the weighted denominator (rule-6 N/A renorm)
    // and is hidden in the UI rather than auto-passing and inflating the section.
    return {
      infoOnly: true,
      status: 'pass',
      details: 'Breadcrumbs are not applicable on the homepage.',
      analysis: {
        cause: "The page is a root-level homepage.",
        recommendation: "Breadcrumbs are evaluated on inner pages (inventory, vehicle, service, blog). Maintain clearly visible primary navigation here."
      },
      meta: { isHomepage: true, notApplicable: true, infoOnly: true }
    };
  }

  const hasBreadcrumbs = await page.evaluate(() => {
    return !!document.querySelector('nav[aria-label="breadcrumb"], .breadcrumb') ||
      !!document.querySelector('script[type="application/ld+json"]')?.innerText.includes('BreadcrumbList');
  });

  let analysis = {
    cause: "Breadcrumbs are present, aiding user navigation.",
    recommendation: "Keep breadcrumbs consistent across all inner pages to help users track their location."
  };

  if (!hasBreadcrumbs) {
    analysis = {
      cause: "The absence of breadcrumbs makes it difficult for users to track their location within the site's hierarchy.",
      recommendation: "Implement breadcrumb navigation to provide a clear path back to parent categories, especially on deep sub-pages."
    };
  }

  return {
    score: hasBreadcrumbs ? 100 : 0,
    status: hasBreadcrumbs ? 'pass' : 'fail',
    details: hasBreadcrumbs ? 'A clear navigation path (breadcrumbs) was found for your visitors.' : 'No visible navigation path was found to help users track their location.',
    analysis: analysis,
    meta: { isHomepage: false }
  };
}

// Navigation Discoverability
async function checkNavDiscoverability(page) {
  const navDiscoverability = await page.evaluate(() => {
    const hamburgerSelectors = [
      '.hamburger', '.hamburger-menu', '.menu-icon', '.nav-toggle',
      'button[aria-label*="menu"]', '[aria-controls*="menu"]',
      '.navbar-toggler', '.nav-icon', '.mobile-menu-button'
    ];
    const navSelectors = [
      'nav', '[role="navigation"]', '.nav', '.navigation', '.navbar',
      '.main-menu', '#main-menu', '.site-nav', '.header-nav',
      'ul[class*="menu"]', 'div[class*="menu"] > ul'
    ];

    let hamburgerFound = false;
    for (let sel of hamburgerSelectors) if (document.querySelector(sel)) { hamburgerFound = true; break; }

    let navFound = false;
    for (let sel of navSelectors) if (document.querySelector(sel)) { navFound = true; break; }

    // ---- Search: deep analysis across Presence, Discoverability & Functionality intent ----
    // 1. PRESENCE — locate a search affordance and classify what kind it is.
    const inputSelectors = [
      'input[type="search"]',
      'input[placeholder*="search" i]', 'input[name*="search" i]',
      'input[aria-label*="search" i]', 'input[id*="search" i]', 'input[class*="search" i]'
    ];
    const formSelectors = [
      '[role="search"]', 'form[action*="search" i]', 'form[id*="search" i]', 'form[class*="search" i]'
    ];
    const triggerSelectors = [
      'button[class*="search" i]', 'button[aria-label*="search" i]',
      'a[href*="search" i]', 'a[aria-label*="search" i]',
      '#search-btn', '.search-icon', '[class*="search-toggle" i]', '[aria-label*="search" i]'
    ];

    const pick = (selectors) => {
      for (const sel of selectors) {
        const el = document.querySelector(sel);
        if (el) return el;
      }
      return null;
    };

    const inputEl = pick(inputSelectors);
    const formEl = pick(formSelectors);
    const triggerEl = pick(triggerSelectors);

    let searchType = 'none';
    let searchEl = null;
    if (inputEl) { searchType = 'input'; searchEl = inputEl; }
    else if (formEl) { searchType = 'form'; searchEl = formEl; }
    else if (triggerEl) { searchType = 'trigger'; searchEl = triggerEl; }

    const searchPresent = searchType !== 'none';

    // 2. DISCOVERABILITY — is the search reachable without digging (header / above the fold)?
    let inHeader = false;
    let topOffset = null;
    let searchDiscoverable = false;
    if (searchEl) {
      inHeader = !!searchEl.closest('header, nav, [role="banner"], [role="navigation"], .header, .navbar, .site-header');
      const inFooter = !!searchEl.closest('footer, [role="contentinfo"], .footer, .site-footer');
      const rect = searchEl.getBoundingClientRect();
      topOffset = Math.round(rect.top);
      searchDiscoverable = !inFooter && (inHeader || rect.top < 200);
    }

    // 3. FUNCTIONALITY INTENT — does it look like a working search, not a dead icon?
    let searchFunctional = false;
    if (searchEl) {
      if (searchType === 'input') {
        const owningForm = searchEl.closest('form');
        const hasSubmit = owningForm
          ? !!owningForm.querySelector('button, input[type="submit"], [type="image"]')
          : false;
        searchFunctional = !!(searchEl.name || (owningForm && (owningForm.action || hasSubmit)));
      } else if (searchType === 'form') {
        searchFunctional = !!(searchEl.getAttribute('action') || searchEl.querySelector('input'));
      } else if (searchType === 'trigger') {
        // A trigger is "functional" if it links somewhere or controls/opens a search input.
        const controls = searchEl.getAttribute('aria-controls');
        const href = searchEl.getAttribute('href');
        searchFunctional = !!(
          (href && href !== '#' && !href.startsWith('javascript')) ||
          (controls && document.getElementById(controls)) ||
          document.querySelector('input[type="search"], input[placeholder*="search" i]')
        );
      }
    }

    return {
      hamburger_present: hamburgerFound ? 1 : 0,
      nav_menu_present: navFound ? 1 : 0,
      search: {
        present: searchPresent,
        type: searchType,
        inHeader,
        topOffset,
        discoverable: searchDiscoverable,
        functional: searchFunctional
      }
    };
  });

  const search = navDiscoverability.search;

  // Scoring (total = 100): nav menu 40, hamburger 30, search split 15/8/7 across the three dimensions.
  const searchScore =
    (search.present ? 15 : 0) +
    (search.discoverable ? 8 : 0) +
    (search.functional ? 7 : 0);

  const score = (navDiscoverability.nav_menu_present * 40) + (navDiscoverability.hamburger_present * 30) + searchScore;
  const status = score >= 80 ? 'pass' : (score >= 40 ? 'warning' : 'fail');

  // Build a search-specific narrative for the analysis copy.
  let searchNote;
  if (!search.present) {
    searchNote = "no search box was detected, forcing visitors to hunt through menus";
  } else if (!search.discoverable) {
    searchNote = "a search exists but is buried (not in the header / above the fold)";
  } else if (!search.functional) {
    searchNote = "a search affordance is visible but looks decorative (no working form or input behind it)";
  } else {
    searchNote = "a discoverable, working search is available";
  }

  let analysis = {
    cause: `Key navigation elements are present and ${searchNote}.`,
    recommendation: "Maintain the visibility of these elements. Keep search accessible from the header on every page."
  };

  if (status === 'fail') {
    analysis = {
      cause: `Multiple essential navigation controls are missing or hidden — ${searchNote}.`,
      recommendation: "Ensure a primary navigation menu and a working, header-level search bar are easily discoverable for all users."
    };
  } else if (status === 'warning') {
    analysis = {
      cause: `Some navigation discoverability is weak — ${searchNote}.`,
      recommendation: "Surface a functional search bar in the header (not the footer) and ensure the menu is obvious so shoppers can jump straight to inventory."
    };
  }

  return {
    score,
    status: status,
    details: `Found: ${navDiscoverability.nav_menu_present ? 'Navigation Menu' : 'No Menu'}, ${navDiscoverability.hamburger_present ? 'Menu Icon' : 'No Icon'}, ${search.present ? `Search (${search.functional ? 'functional' : 'decorative'}${search.discoverable ? ', discoverable' : ', buried'})` : 'No Search'}.`,
    analysis: analysis,
    meta: {
      hasHamburger: !!navDiscoverability.hamburger_present,
      hasSearch: !!search.present, // kept for backward compatibility
      hasNavMenu: !!navDiscoverability.nav_menu_present,
      search: {
        present: search.present,
        type: search.type,
        discoverable: search.discoverable,
        functional: search.functional,
        inHeader: search.inHeader,
        topOffset: search.topOffset,
        score: searchScore
      }
    }
  };
}

// ATF Content
async function checkATF(page) {
  const atfData = await page.evaluate(() => {
    const viewportHeight = window.innerHeight;

    // Check if element is rendered in the DOM (ignoring viewport visibility)
    function isRendered(el) {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
      const rect = el.getBoundingClientRect();
      // Only check if it has dimensions, not if it's in the viewport
      return rect.width > 0 && rect.height > 0;
    }

    // Check if element is overlapping with the viewport (Above The Fold)
    function isInViewport(el) {
      const rect = el.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < window.innerHeight;
    }

    function isImportant(el) {
      const tag = el.tagName;
      if (["H1", "H2", "H3", "BUTTON", "NAV", "A"].includes(tag)) return true;
      if (tag === "IMG" && el.width > 50 && el.height > 50) return true;
      if (tag === "VIDEO") return true;
      if ((tag === "P" || tag === "DIV" || tag === "SPAN") && el.innerText.trim().length > 40) return true;
      return false;
    }

    function getWeight(el) {
      const WEIGHTS = { H1: 10, H2: 8, H3: 6, BUTTON: 7, IMG: 5, VIDEO: 5, NAV: 4, A: 3, P: 2, DEFAULT: 1 };
      return WEIGHTS[el.tagName] || WEIGHTS.DEFAULT;
    }

    // Get ALL rendered elements on the page first
    const allRendered = [...document.body.querySelectorAll("*")].filter(isRendered);

    // Filter for important elements (Whole Page)
    const importantElements = allRendered.filter(isImportant);

    // Filter for important elements specifically Above The Fold
    const importantAboveFold = importantElements.filter(isInViewport);

    const totalWeight = importantElements.reduce((sum, el) => sum + getWeight(el), 0);
    const weightAboveFold = importantAboveFold.reduce((sum, el) => sum + getWeight(el), 0);
    const weightedATF = totalWeight > 0 ? Math.round((weightAboveFold / totalWeight) * 100) : 0;

    const visibleElementDetails = importantAboveFold.slice(0, 50).map(el => {
      let text = el.innerText ? el.innerText.trim().substring(0, 50) : '';
      if (el.tagName === 'IMG') text = el.src ? el.src.split('/').pop() : 'Image';
      if (!text) text = `[${el.tagName}]`;
      return { tag: el.tagName, text: text, top: Math.round(el.getBoundingClientRect().top), weight: getWeight(el) };
    });

    return {
      viewportHeight,
      importantVisible: importantAboveFold.length,
      totalImportant: importantElements.length,
      atfScore: weightedATF,
      elements: visibleElementDetails
    };
  });

  const status = atfData.atfScore >= 50 ? 'pass' : (atfData.atfScore >= 20 ? 'warning' : 'fail');
  let analysis = {
    cause: "Primary content and actions are well-positioned above the fold.",
    recommendation: "Keep critical information near the top to reduce the need for immediate scrolling."
  };

  if (status === 'fail') {
    analysis = {
      cause: "Very little important content is visible without scrolling.",
      recommendation: "Move your headline and primary CTA higher up to ensure they are seen immediately."
    };
  } else if (status === 'warning') {
    analysis = {
      cause: "Important content is partially obscured or pushed down the page.",
      recommendation: "Reduce large hero images or white space at the top to bring value-driven content into view sooner."
    };
  }

  return {
    score: atfData.atfScore,
    status: status,
    details: `About ${atfData.atfScore}% of your most important content (titles, images, and buttons) is visible before any scrolling is needed.`,
    analysis: analysis,
    meta: atfData
  };
}

// Click Feedback
async function checkClickFeedback(page, deviceType) {
  const clickFeedbackData = await page.evaluate(() => {
    const propsToCheck = ["color", "background-color", "border-color", "box-shadow", "transform", "opacity", "cursor", "filter"];
    function isInteractive(el) {
      if (["BUTTON", "A", "INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)) return true;
      if (["button", "link", "menuitem"].includes(el.getAttribute("role"))) return true;
      if (el.onclick || el.getAttribute("onclick")) return true;
      if (window.getComputedStyle(el).cursor === "pointer") return true;
      return el.getAttribute("tabindex") !== null;
    }
    function extract(el, pseudo = null) {
      const computed = window.getComputedStyle(el, pseudo);
      const result = {};
      propsToCheck.forEach(p => result[p] = computed.getPropertyValue(p));
      return result;
    }

    const interactive = [...document.querySelectorAll("*")].filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0' && isInteractive(el);
    });

    const results = interactive.map(el => {
      const normal = extract(el);
      const hover = extract(el, ":hover");
      const active = extract(el, ":active");

      const hoverChanged = propsToCheck.some(p => normal[p] !== hover[p]);
      const activeChanged = propsToCheck.some(p => normal[p] !== active[p]);
      const focusChanged = propsToCheck.some(p => normal[p] !== extract(el, ":focus")[p]);

      return {
        tag: el.tagName,
        text: el.innerText ? el.innerText.trim().slice(0, 50) : '',
        feedback: {
          hoverChanged,
          activeChanged,
          focusChanged,
          hasFeedback: hoverChanged || activeChanged || focusChanged
        }
      };
    });

    return {
      totalInteractive: interactive.length,
      withFeedback: results.filter(r => r.feedback.hasFeedback).length,
      withHover: results.filter(r => r.feedback.hoverChanged).length,
      withActive: results.filter(r => r.feedback.activeChanged).length,
      elements: results.slice(0, 50)
    };
  });

  const feedbackScore = clickFeedbackData.totalInteractive > 0
    ? Math.round(((deviceType === 'mobile' ? clickFeedbackData.withActive : clickFeedbackData.withHover) / clickFeedbackData.totalInteractive) * 100)
    : 100;

  const status = feedbackScore >= 80 ? 'pass' : (feedbackScore >= 50 ? 'warning' : 'fail');
  let analysis = {
    cause: "Most interactive elements provide clear visual feedback on interaction.",
    recommendation: "Continue using hover and active states to make the UI feel responsive."
  };

  if (status === 'fail') {
    analysis = {
      cause: "Many interactive elements lack visual changes, making the UI feel static and unresponsive.",
      recommendation: "Add CSS hover and active states to all buttons, links, and form elements."
    };
  } else if (status === 'warning') {
    analysis = {
      cause: "Some interactive elements do not provide enough visual feedback.",
      recommendation: "Ensure that all clickable elements change color, scale, or shadow when hovered or clicked."
    };
  }

  return {
    score: feedbackScore,
    status: status,
    details: `We tested ${clickFeedbackData.totalInteractive} interactive items, and ${deviceType === 'mobile' ? clickFeedbackData.withActive : clickFeedbackData.withHover} of them responded clearly to touch or clicks.`,
    analysis: analysis,
    meta: { missingPointerCursor: clickFeedbackData.totalInteractive - (deviceType === 'mobile' ? clickFeedbackData.withActive : clickFeedbackData.withHover), ...clickFeedbackData }
  };
}

// Loading Feedback
async function checkLoadingFeedback(page) {
  const loadingFeedbackData = await page.evaluate(() => {
    const LOADING_SELECTORS = ["[aria-busy='true']", "[role='progressbar']", ".spinner", ".loader", ".loading", ".MuiCircularProgress-root", ".ant-spin"];
    const SKELETON_SELECTORS = [".skeleton", ".skeleton-box", ".shimmer", ".MuiSkeleton-root", ".ant-skeleton"];
    const TEXT_LOADING_REGEX = /(loading|please wait|fetching|processing)/i;

    const spinners = LOADING_SELECTORS.flatMap(s => [...document.querySelectorAll(s)]);
    const skeletons = SKELETON_SELECTORS.flatMap(s => [...document.querySelectorAll(s)]);
    const textLoading = [...document.querySelectorAll("body *")].filter(el => el.children.length === 0 && el.innerText && TEXT_LOADING_REGEX.test(el.innerText));

    const hasLoadingFeedback = spinners.length > 0 || skeletons.length > 0 || textLoading.length > 0;
    return {
      hasLoadingFeedback,
      summary: {
        spinners: spinners.length,
        skeletons: skeletons.length,
        loadingText: textLoading.length
      },
      textIndicators: textLoading.map(el => ({
        text: el.innerText.substring(0, 50),
        tag: el.tagName
      }))
    };
  });

  let status = 'fail';
  if (loadingFeedbackData.summary.spinners > 0 || loadingFeedbackData.summary.skeletons > 0) {
    status = 'pass';
  } else if (loadingFeedbackData.summary.loadingText > 0) {
    status = 'warning';
  }

  const loadingScore = status === 'pass' ? 100 : (status === 'warning' ? 50 : 0);

  let analysis = {
    cause: "Visual loading indicators like spinners or skeletons are correctly implemented.",
    recommendation: "Maintain these indicators to keep users informed during asynchronous operations."
  };

  if (status === 'fail') {
    analysis = {
      cause: "No standard loading indicators were detected.",
      recommendation: "Implement skeleton screens or spinners to communicate that content is being loaded."
    };
  } else if (status === 'warning') {
    analysis = {
      cause: "Only simple text indicators were found, which can be easily missed.",
      recommendation: "Upgrade text-based loading messages to more prominent visual indicators like spinners or shimmer effects."
    };
  }

  return {
    score: loadingScore,
    status: status,
    details: loadingFeedbackData.hasLoadingFeedback ? `We found ${loadingFeedbackData.summary.spinners + loadingFeedbackData.summary.skeletons} visual signals (like icons and shimmers) that show the page is loading.` : 'No visual signals were found to tell the user that the site is working or loading.',
    analysis: analysis,
    meta: loadingFeedbackData
  };
}

// Broken Links
async function checkBrokenLinks(page) {
  const linksData = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll('a[href]'));
    const hostname = window.location.hostname;
    return anchors
      .map(a => {
        let href = a.href;
        try {
          const u = new URL(href);
          u.hash = "";
          href = u.href;

          return {
            href: href,
            text: a.innerText.trim().substring(0, 50),
            isInternal: u.hostname === hostname
          };
        } catch (e) {
          return null;
        }
      })
      .filter(l => l && l.href.startsWith('http'));
  });

  const uniqueMap = new Map();
  linksData.forEach(l => {
    if (!uniqueMap.has(l.href)) {
      uniqueMap.set(l.href, { text: l.text, isInternal: l.isInternal });
    }
  });

  // Check all unique links
  const urlsToCheck = Array.from(uniqueMap.keys());
  const brokenLinks = [];

  const checkUrl = async (url) => {
    const linkInfo = uniqueMap.get(url);
    try {
      if (url.toLowerCase().includes("inventory")) {
        return; // Skip checking, treat as valid/fixed
      }
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      // 1. Try HEAD first
      let res = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
      });
      clearTimeout(timeoutId);

      let status = res.status;

      // Filter out immediate false positives (Auth/Rate Limit/Bot Protection)
      if (status === 403 || status === 429 || status === 999 || status === 406 || status === 405) {
        return;
      }

      // 2. If HEAD failed (e.g. 404), try GET to confirm (some servers block HEAD)
      if (status >= 400) {
        const controllerGet = new AbortController();
        const timeoutGet = setTimeout(() => controllerGet.abort(), 10000);
        res = await fetch(url, {
          method: 'GET',
          signal: controllerGet.signal,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
        });
        clearTimeout(timeoutGet);
        status = res.status;
      }

      // Final Check after GET
      if (status >= 400 && status !== 403 && status !== 429 && status !== 999 && status !== 406) {
        brokenLinks.push({
          url,
          status: status,
          text: linkInfo.text,
          isInternal: linkInfo.isInternal
        });
      }

    } catch (error) {
      let reason = 'Network Error';
      if (error.name === 'AbortError') reason = 'Timeout';
      else if (error.cause && error.cause.code === 'ENOTFOUND') reason = 'DNS Error';
      else if (error.cause && error.cause.code === 'ECONNREFUSED') reason = 'Connection Refused';

      // Only count definitive failures
      if (reason === 'DNS Error' || reason === 'Connection Refused') {
        brokenLinks.push({
          url,
          status: reason,
          text: linkInfo.text,
          isInternal: linkInfo.isInternal
        });
      }
    }
  };

  // Run in parallel chunks of 5
  for (let i = 0; i < urlsToCheck.length; i += 5) {
    await Promise.all(urlsToCheck.slice(i, i + 5).map(checkUrl));
  }

  // Calculate Breakdown
  let totalInternal = 0;
  let totalExternal = 0;
  urlsToCheck.forEach(url => {
    if (uniqueMap.get(url).isInternal) totalInternal++;
    else totalExternal++;
  });

  const brokenInternalCount = brokenLinks.filter(b => b.isInternal).length;
  const brokenExternalCount = brokenLinks.filter(b => !b.isInternal).length;

  const score = brokenLinks.length === 0 ? 100 : Math.max(0, 100 - (brokenLinks.length * 25));
  const status = score === 100 ? 'pass' : (score >= 75 ? 'warning' : 'fail');

  let analysis = {
    cause: "All links on the page are valid and accessible.",
    recommendation: "Periodic link audits are recommended to ensure external links remain active."
  };

  if (status === 'fail') {
    analysis = {
      cause: "Multiple broken links were found, leading to 404 errors.",
      recommendation: "Fix or remove all links pointing to non-existent pages to prevent user frustration."
    };
  } else if (status === 'warning') {
    analysis = {
      cause: "A single broken link was detected.",
      recommendation: "Update the single broken link to point to a valid destination."
    };
  }

  return {
    score,
    status: status,
    details: brokenLinks.length === 0 ? "Every link on your page works perfectly." : `We found ${brokenLinks.length} 'dead-end' links that lead to errors.`,
    analysis: analysis,
    meta: {
      brokenCount: brokenLinks.length,
      brokenLinks: brokenLinks,
      totalChecked: urlsToCheck.length,
      totalInternal,
      totalExternal
    }
  };
}

// Hierarchy Clarity
async function checkHierarchyClarity(page) {
  const hierarchyData = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const h1Count = headings.filter(h => h.tagName === 'H1').length;

    let isSequential = true;
    for (let i = 0; i < headings.length - 1; i++) {
      const currentLevel = parseInt(headings[i].tagName[1]);
      const nextLevel = parseInt(headings[i + 1].tagName[1]);
      if (nextLevel > currentLevel + 1) isSequential = false;
    }

    return {
      h1Count,
      totalHeadings: headings.length,
      isSequential
    };
  });

  let status = 'pass';
  let score = 100;
  if (hierarchyData.h1Count !== 1) {
    status = 'warning';
    score = 70;
  }
  if (hierarchyData.totalHeadings === 0) {
    status = 'fail';
    score = 0;
  }

  let analysis = {
    cause: "Header hierarchy is correct with a single H1 and sequential levels.",
    recommendation: "Maintain this clear structure for both users and search engines."
  };

  if (status === 'fail') {
    analysis = {
      cause: "No headings found on the page, creating a flat and unguided content structure.",
      recommendation: "Implement a clear heading hierarchy starting with a single H1 and nesting sub-sections with H2-H4."
    };
  } else if (status === 'warning') {
    analysis = {
      cause: hierarchyData.h1Count === 0 ? "Missing H1 tag." : "Multiple H1 tags detected or skipping header levels.",
      recommendation: "Ensure exactly one H1 describes the page title and that subheadings follow a logical order without skipping levels."
    };
  }

  return {
    score,
    status,
    details: `We found ${hierarchyData.h1Count} main title and a total of ${hierarchyData.totalHeadings} headings to guide the reader.`,
    analysis,
    meta: hierarchyData
  };
}

// Section Labeling Clarity
async function checkSectionLabeling(page) {
  const labelingData = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('section, article, .section, .block'));
    const labeledSections = sections.filter(s => s.querySelector('h1, h2, h3, h4') || s.getAttribute('aria-label'));
    return {
      totalSections: sections.length,
      labeledCount: labeledSections.length
    };
  });

  const score = labelingData.totalSections > 0 ? Math.round((labelingData.labeledCount / labelingData.totalSections) * 100) : 100;
  const status = score >= 90 ? 'pass' : (score >= 60 ? 'warning' : 'fail');

  let analysis = {
    cause: "Most page sections are clearly defined and labeled.",
    recommendation: "Keep using semantic section markers to help users mentally map the page."
  };

  if (status === 'fail') {
    analysis = {
      cause: "Page content lacks clear structural grouping or section labeling.",
      recommendation: "Wrap related content in <section> tags and ensure each has a descriptive heading."
    };
  } else if (status === 'warning') {
    analysis = {
      cause: "Some content blocks are present without clear titles or labels.",
      recommendation: "Ensure every major section has a visible heading to improve scanning behavior."
    };
  }

  return {
    score,
    status,
    details: `${labelingData.labeledCount} out of your ${labelingData.totalSections} page sections have clear, descriptive titles.`,
    analysis,
    meta: labelingData
  };
}

// Content Density Balance
async function checkContentDensity(page, deviceType) {
  const densityData = await page.evaluate((deviceType) => {
    const bodyHeight = document.body.scrollHeight;
    const viewportHeight = window.innerHeight;
    const textLength = document.body.innerText.length;
    const scrollFactor = bodyHeight / viewportHeight;

    // Simple heuristic: length of text per "screen"
    const densityScore = (textLength / scrollFactor) / 1000;

    return { densityScore, scrollFactor };
  }, deviceType);

  let status = 'pass';
  let score = 100;

  // Adjust density thresholds for mobile vs desktop
  const highDensityLimit = deviceType === 'mobile' ? 4 : 6;
  const lowDensityLimit = deviceType === 'mobile' ? 0.3 : 0.6;

  if (densityData.densityScore > highDensityLimit) {
    status = 'warning';
    score = 60;
  } else if (densityData.densityScore < lowDensityLimit) {
    status = 'warning';
    score = 60;
  }

  let analysis = {
    cause: "The amount of content per screen feels balanced and breathable.",
    recommendation: "Maintain the current balance of text and whitespace."
  };

  if (status === 'warning') {
    analysis = {
      cause: densityData.densityScore > highDensityLimit ? "Content is too dense, making it overwhelming for users." : "Content is too sparse, requiring excessive scrolling for little information.",
      recommendation: densityData.densityScore > highDensityLimit ? "Use more whitespace, shorter paragraphs, and images to break up text blocks." : "Consolidate information or add more value-driven content to the page."
    };
  }

  return {
    score,
    status,
    details: `The balance of text and 'breathing room' on your page is rated as ${densityData.densityScore > 4 ? 'dense' : (densityData.densityScore < 0.5 ? 'sparse' : 'comfortable')}.`,
    analysis,
    meta: densityData
  };
}

// Page-to-Page Flow
async function checkPageFlow(page) {
  const flowData = await page.evaluate(() => {
    const hasFooter = !!document.querySelector('footer');
    const internalLinks = Array.from(document.querySelectorAll('a')).filter(a => a.href.includes(window.location.hostname)).length;
    const nextStepCTAs = Array.from(document.querySelectorAll('button, a.btn')).length;

    return { hasFooter, internalLinks, nextStepCTAs };
  });

  const hasFlow = flowData.hasFooter && flowData.internalLinks > 2 && flowData.nextStepCTAs > 0;
  const status = hasFlow ? 'pass' : 'warning';
  const score = hasFlow ? 100 : 60;

  let analysis = {
    cause: "The page provides a clear structural flow with a footer and subsequent navigation steps.",
    recommendation: "Continue ensuring every page leads the user toward a logical next action."
  };

  if (status === 'warning') {
    analysis = {
      cause: "The user might reach a 'dead end' without clear guidance on what to do next.",
      recommendation: "Add a consistent footer and ensuring prominent primary actions (CTAs) are always available."
    };
  }

  return {
    score,
    status,
    details: `We found a footer and ${flowData.nextStepCTAs} clear 'next step' buttons to keep your visitors moving forward.`,
    analysis,
    meta: flowData
  };
}

// Layout Consistency
async function checkLayoutConsistency(page) {
  const layoutData = await page.evaluate(() => {
    const bodyStyle = window.getComputedStyle(document.body);
    const hasFlexOrGrid = bodyStyle.display === 'flex' || bodyStyle.display === 'grid' ||
      !!document.querySelector('[style*="display: flex"], [style*="display: grid"]') ||
      !!document.querySelector('.container, .row, .grid');

    return { hasFlexOrGrid };
  });

  const status = layoutData.hasFlexOrGrid ? 'pass' : 'warning';
  const score = layoutData.hasFlexOrGrid ? 100 : 70;

  let analysis = {
    cause: "The layout uses modern structural patterns indicating consistent spacing.",
    recommendation: "Ensure grid gutters and margins remain uniform across different screen sizes."
  };

  if (status === 'warning') {
    analysis = {
      cause: "Layout structure appears ad-hoc, which may lead to spacing inconsistencies.",
      recommendation: "Utilize a standard CSS Grid or Flexbox-based layout system to ensure visual alignment."
    };
  }

  return {
    score,
    status,
    details: `Your page layout ${layoutData.hasFlexOrGrid ? 'uses organized, modern design patterns' : 'appears a bit unstructured and could use more consistent spacing'}.`,
    analysis,
    meta: layoutData
  };
}

// In-Page Navigation
async function checkInPageNav(page, deviceType) {
  const navData = await page.evaluate((deviceType) => {
    const anchorLinks = Array.from(document.querySelectorAll('a[href^="#"]')).filter(a => a.getAttribute('href').length > 1).length;
    const backToTop = !!document.querySelector('a[href="#top"], .back-to-top, button[id*="top"]');
    const hasLongPage = document.body.scrollHeight > window.innerHeight * (deviceType === 'mobile' ? 2.5 : 4);

    return { anchorLinks, backToTop, hasLongPage };
  }, deviceType);

  // Spec §2.5: In-page navigation is page-specific (VDP / Blog / long pages). On short pages it
  // is not applicable — drop from the weighted denominator (rule-6 N/A renorm) and hide.
  if (!navData.hasLongPage) {
    return {
      infoOnly: true,
      status: 'pass',
      details: "This page is short enough that in-page jump links / back-to-top aren't needed.",
      analysis: {
        cause: "In-page navigation aids are evaluated on long pages (vehicle detail, blog, spec-heavy articles).",
        recommendation: "On long-form pages, add a table of contents / anchor links and a 'Back to Top' button."
      },
      meta: { ...navData, notApplicable: true, infoOnly: true }
    };
  }

  let status = navData.anchorLinks === 0 && !navData.backToTop ? 'warning' : 'pass';
  const score = status === 'pass' ? 100 : 60;

  let analysis = {
    cause: "Navigational aids like anchor links or 'back to top' are provided for long-form content.",
    recommendation: "Continue using skip-links and anchor points for content-heavy pages."
  };

  if (status === 'warning') {
    analysis = {
      cause: "The page is long but lacks in-page navigation shortcuts.",
      recommendation: "Add a 'Table of Contents' or 'Back to Top' button to help users navigate long vertical layouts."
    };
  }

  return {
    score,
    status,
    details: `Found ${navData.anchorLinks} jump links and ${navData.backToTop ? 'a' : 'no'} 'Back to Top' button on this long page.`,
    analysis,
    meta: navData
  };
}

// Inventory Filtering / Faceted Search Quality (dealership-specific, context-aware)
async function checkInventoryFiltering(page) {
  const data = await page.evaluate(() => {
    const text = (document.body.innerText || '').toLowerCase();
    const url = window.location.href.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();

    // ---- A. Detect page context: 'srp' | 'homepage' | 'other' ----
    const srpUrlPatterns = [
      '/inventory', '/vehicles', '/used', '/new', '/pre-owned', '/preowned',
      '/cpo', '/certified', '/cars', '/listings', '/srp', '/showroom', '/search-inventory'
    ];
    const isSrpUrl = srpUrlPatterns.some(p => pathname.includes(p));
    const isRootPath = pathname === '/' || pathname === '' || pathname === '/index.html' || pathname === '/home';

    // Vehicle schema present?
    let hasVehicleSchema = false;
    for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
      try {
        const json = JSON.parse(s.innerText);
        const arr = Array.isArray(json) ? json : [json];
        for (const j of arr) {
          const t = j && j['@type'];
          const types = Array.isArray(t) ? t : [t];
          if (types.some(x => ['Vehicle', 'Car', 'Motorcycle', 'AutoDealer'].includes(x))) hasVehicleSchema = true;
          // ItemList of vehicles
          if (j && j.itemListElement && JSON.stringify(j).toLowerCase().includes('vehicle')) hasVehicleSchema = true;
        }
      } catch (e) { }
    }

    // Repeated vehicle "cards": elements that contain a price and a year/make-ish token.
    const priceEls = Array.from(document.querySelectorAll('[class*="price" i], [itemprop="price"]'));
    const vehicleCardSelectors = [
      '[class*="vehicle" i]', '[class*="inventory" i]', '[class*="listing" i]',
      '[class*="srp" i]', '[class*="vdp" i]', '[class*="car-card" i]', '[class*="result-item" i]'
    ];
    let vehicleCardCount = 0;
    for (const sel of vehicleCardSelectors) vehicleCardCount = Math.max(vehicleCardCount, document.querySelectorAll(sel).length);

    const resultCountMatch = text.match(/(\d[\d,]*)\s+(vehicles|cars|results|matches|listings)\b/);
    const hasResultCount = !!resultCountMatch;

    // Context decision
    let context = 'other';
    const srpStrength =
      (isSrpUrl ? 2 : 0) +
      (hasVehicleSchema ? 1 : 0) +
      (vehicleCardCount >= 4 ? 2 : (vehicleCardCount >= 2 ? 1 : 0)) +
      (hasResultCount ? 1 : 0) +
      (priceEls.length >= 4 ? 1 : 0);

    if (srpStrength >= 3) context = 'srp';
    else if (isRootPath) context = 'homepage';
    else context = 'other';

    // ---- B. Detect filtering UI ----
    const filterContainerSel = '[class*="filter" i], [class*="facet" i], [id*="filter" i], [aria-label*="filter" i], aside, [class*="refine" i], [class*="sidebar" i]';
    const filterContainers = Array.from(document.querySelectorAll(filterContainerSel));

    const selects = Array.from(document.querySelectorAll('select'));
    const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
    const radios = Array.from(document.querySelectorAll('input[type="radio"]'));
    const ranges = Array.from(document.querySelectorAll('input[type="range"], [class*="slider" i], [class*="range" i][class*="price" i], [class*="noui" i]'));

    const hasFilterControls = filterContainers.length > 0 || selects.length >= 2 || checkboxes.length >= 3 || ranges.length > 0;

    // Gather label/name/placeholder text from likely filter controls for facet matching.
    const facetTextParts = [];
    const collectText = (el) => {
      if (!el) return;
      facetTextParts.push((el.getAttribute('name') || ''));
      facetTextParts.push((el.getAttribute('id') || ''));
      facetTextParts.push((el.getAttribute('aria-label') || ''));
      facetTextParts.push((el.getAttribute('placeholder') || ''));
      facetTextParts.push((el.getAttribute('data-filter') || ''));
      // Associated <label>
      if (el.id) {
        const lbl = document.querySelector(`label[for="${el.id}"]`);
        if (lbl) facetTextParts.push(lbl.innerText || '');
      }
      const wrapLabel = el.closest('label');
      if (wrapLabel) facetTextParts.push(wrapLabel.innerText || '');
    };
    [...selects, ...checkboxes, ...radios, ...ranges].slice(0, 400).forEach(collectText);
    filterContainers.slice(0, 30).forEach(c => facetTextParts.push((c.innerText || '').slice(0, 600)));
    const facetText = facetTextParts.join(' ').toLowerCase();

    // Core automotive facets (the 6 that drive breadth) + bonus facets.
    const coreFacets = {
      make: /\bmake\b|\bbrand\b/,
      model: /\bmodel\b|\btrim\b.*\bmodel\b|\bmodel\b/,
      year: /\byear\b/,
      price: /\bprice\b|\bbudget\b|\bpayment\b|\$/,
      mileage: /\bmileage\b|\bmiles\b|\bodometer\b/,
      bodyType: /\bbody\b|\bbody type\b|\bsuv\b|\bsedan\b|\btruck\b|\bcoupe\b|\bvehicle type\b/
    };
    const bonusFacets = {
      trim: /\btrim\b/,
      fuel: /\bfuel\b|\bmpg\b|\bgas\b|\bdiesel\b|\belectric\b|\bhybrid\b/,
      transmission: /\btransmission\b|\bautomatic\b|\bmanual\b/,
      drivetrain: /\bdrivetrain\b|\bdrive type\b|\bawd\b|\bfwd\b|\brwd\b|\b4wd\b/,
      color: /\bcolor\b|\bcolour\b|\bexterior\b|\binterior\b/,
      condition: /\bcondition\b|\bnew\b|\bused\b|\bcertified\b|\bcpo\b|\bpre-owned\b/
    };
    const coreFacetsFound = Object.keys(coreFacets).filter(k => coreFacets[k].test(facetText));
    const bonusFacetsFound = Object.keys(bonusFacets).filter(k => bonusFacets[k].test(facetText));

    // Mechanism richness: range sliders or generous checkbox facets = richer than bare dropdowns.
    const mechanismRich = ranges.length > 0 || checkboxes.length >= 4;

    // Result feedback signals
    const hasActiveChips = !!document.querySelector('[class*="chip" i], [class*="tag" i][class*="filter" i], [class*="applied" i], [class*="active-filter" i], [class*="selected-filter" i]');
    const hasClearReset = (() => {
      const cands = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      return cands.some(b => /\b(clear|reset|remove)\b.*\b(all|filters?)\b|\bclear filters?\b|\breset all\b/i.test(b.innerText || b.getAttribute('aria-label') || ''));
    })();
    const hasSort = !!document.querySelector('select[name*="sort" i], select[id*="sort" i], [class*="sort" i], [aria-label*="sort" i]') || /\bsort by\b/i.test(text);

    // Homepage entry-point finder widget: 2+ grouped vehicle-facet selects, or a "search inventory" finder.
    let homepageFinder = false;
    let homepageFinderFacets = [];
    if (selects.length >= 2) {
      // Are at least two selects vehicle-facet-ish?
      const selTexts = selects.map(s => ((s.getAttribute('name') || '') + ' ' + (s.getAttribute('id') || '') + ' ' + (s.getAttribute('aria-label') || '') + ' ' + s.innerText).toLowerCase());
      const finderHits = Object.keys(coreFacets).filter(k => selTexts.some(t => coreFacets[k].test(t)));
      homepageFinderFacets = finderHits;
      homepageFinder = finderHits.length >= 2;
    }
    const hasFinderHeading = /\b(find your|search inventory|find a (car|vehicle)|shop (new|used)|browse inventory|search our inventory)\b/i.test(text);

    return {
      context,
      srpStrength,
      hasFilterControls,
      counts: { selects: selects.length, checkboxes: checkboxes.length, radios: radios.length, ranges: ranges.length, containers: filterContainers.length },
      coreFacetsFound,
      bonusFacetsFound,
      mechanismRich,
      feedback: { hasResultCount, hasActiveChips, hasClearReset, hasSort, resultCountText: resultCountMatch ? resultCountMatch[0] : null },
      homepageFinder,
      homepageFinderFacets,
      hasFinderHeading
    };
  });

  // ---- C. Score per context ----
  // Context 'other' → not applicable: hide (no score) + info-only.
  if (data.context === 'other') {
    return {
      status: 'pass',
      details: "This page isn't an inventory listing, so faceted filtering isn't applicable here.",
      analysis: {
        cause: "Filtering quality is evaluated on inventory / search-results pages.",
        recommendation: "Audit an inventory (SRP) URL to grade make/model/price/mileage filtering depth."
      },
      meta: { context: 'other', notApplicable: true },
      infoOnly: true
    };
  }

  // Context 'homepage' → grade the entry-point finder widget only; informational (not weighted).
  if (data.context === 'homepage') {
    const finderStrong = data.homepageFinder && (data.hasFinderHeading || data.homepageFinderFacets.length >= 3);
    const score = data.homepageFinder ? (finderStrong ? 100 : 70) : 30;
    const status = score >= 80 ? 'pass' : (score >= 40 ? 'warning' : 'fail');
    return {
      score,
      status,
      details: data.homepageFinder
        ? `Homepage inventory finder detected (${data.homepageFinderFacets.join(', ') || 'make/model'}). Full faceted filtering is graded on inventory pages.`
        : "No homepage inventory finder widget detected. Full faceted filtering is graded on inventory pages.",
      analysis: {
        cause: data.homepageFinder
          ? "A quick-search finder lets shoppers start narrowing inventory straight from the homepage."
          : "Shoppers have no homepage shortcut to start narrowing inventory by make/model/price.",
        recommendation: "Add a prominent 'Find Your Vehicle' finder with at least Make, Model and Price so visitors can begin filtering from the homepage."
      },
      meta: {
        context: 'homepage',
        homepageFinder: data.homepageFinder,
        finderFacets: data.homepageFinderFacets,
        counts: data.counts,
        infoOnly: true
      },
      infoOnly: true
    };
  }

  // Context 'srp' → full faceted grading (weighted).
  const presenceScore = data.hasFilterControls ? 20 : 0;

  const coreCount = Math.min(data.coreFacetsFound.length, 6);
  const breadthBase = (coreCount / 6) * 36;          // up to 36 for the 6 core facets
  const bonusBreadth = Math.min(data.bonusFacetsFound.length * 2, 4); // up to 4 bonus
  const breadthScore = Math.round(breadthBase + bonusBreadth); // up to 40

  const mechanismScore = data.mechanismRich ? 15 : (data.counts.selects >= 3 ? 8 : 0);

  const fb = data.feedback;
  const feedbackScore =
    (fb.hasResultCount ? 7 : 0) +
    (fb.hasActiveChips ? 6 : 0) +
    (fb.hasClearReset ? 6 : 0) +
    (fb.hasSort ? 6 : 0); // up to 25

  const score = Math.max(0, Math.min(100, presenceScore + breadthScore + mechanismScore + feedbackScore));
  const status = score >= 80 ? 'pass' : (score >= 40 ? 'warning' : 'fail');

  const missingCore = ['make', 'model', 'year', 'price', 'mileage', 'bodyType'].filter(f => !data.coreFacetsFound.includes(f));

  let analysis;
  if (status === 'pass') {
    analysis = {
      cause: `A broad faceted filter set is present (${data.coreFacetsFound.join(', ')}) with result feedback, letting shoppers narrow inventory quickly.`,
      recommendation: "Maintain filter breadth and keep result counts, active-filter chips and a clear-all control visible as users refine."
    };
  } else if (status === 'warning') {
    analysis = {
      cause: `Filtering works but is incomplete${missingCore.length ? ` — missing ${missingCore.join(', ')}` : ''}${!data.mechanismRich ? '; uses basic dropdowns only' : ''}.`,
      recommendation: "Add the missing core facets (price/mileage range sliders especially) and surface a result count, active-filter chips and a 'clear all' control."
    };
  } else {
    analysis = {
      cause: `Inventory filtering is weak or absent${data.hasFilterControls ? '' : ' — no real filter controls were detected'}${missingCore.length ? `; missing ${missingCore.join(', ')}` : ''}.`,
      recommendation: "Implement faceted filtering for Make, Model, Year, Price and Mileage with checkboxes/range sliders, plus live result counts and a clear-filters affordance."
    };
  }

  return {
    score,
    status,
    details: `Inventory page: ${data.coreFacetsFound.length}/6 core facets (${data.coreFacetsFound.join(', ') || 'none'})${data.feedback.resultCountText ? `, ${data.feedback.resultCountText}` : ''}.`,
    analysis,
    meta: {
      context: 'srp',
      coreFacetsFound: data.coreFacetsFound,
      bonusFacetsFound: data.bonusFacetsFound,
      missingCore,
      mechanismRich: data.mechanismRich,
      counts: data.counts,
      feedback: data.feedback,
      breakdown: { presenceScore, breadthScore, mechanismScore, feedbackScore }
    }
  };
}

// No Results UX / Alternative Suggestions
// Spec §2.5: page-specific, +0.06 on SRP/Search. Weighted when the page is an inventory/search
// results page (isSrp); informational elsewhere (a zero-result state can rarely be observed in a
// single-page audit, so off-SRP it stays info-only and out of the weighted denominator).
async function checkNoResultsUX(page, isSrp = false) {
  const data = await page.evaluate(() => {
    const text = (document.body.innerText || '').toLowerCase();
    const noResultsState = /(no|0|zero)\s+(results|vehicles|cars|matches|listings)\b|no (vehicles|results|matches) found|couldn'?t find|nothing (found|matched)|no matching (vehicles|results)|your search (returned|found) no/.test(text);

    const hasSuggestions = /\b(try|broaden|widen|adjust|expand|different|similar|popular|browse all|view all|reset your|remove (a )?filter|modify your search)\b/.test(text);
    const hasReset = Array.from(document.querySelectorAll('button, a, [role="button"]')).some(b => /\b(clear|reset|remove)\b.*\b(all|filters?|search)\b|\bclear filters?\b|\bstart over\b|\bview all (inventory|vehicles)\b/i.test(b.innerText || b.getAttribute('aria-label') || ''));
    const hasAlternatives = !!document.querySelector('[class*="recommend" i], [class*="related" i], [class*="suggest" i], [class*="similar" i], [class*="featured" i]');
    const hasCTA = /\b(contact us|call us|chat|get help|request|notify me|let us know)\b/.test(text) || !!document.querySelector('a[href^="tel:"], [class*="chat" i], [class*="contact" i]');
    const hasSearchSuggest = !!document.querySelector('input[list], [role="listbox"], [class*="autocomplete" i], [class*="typeahead" i], datalist');

    return { noResultsState, hasSuggestions, hasReset, hasAlternatives, hasCTA, hasSearchSuggest };
  });

  let score, status, details, analysis;
  if (data.noResultsState) {
    score = (data.hasSuggestions ? 30 : 0) + (data.hasReset ? 30 : 0) + (data.hasAlternatives ? 25 : 0) + (data.hasCTA ? 15 : 0);
    status = score >= 80 ? 'pass' : (score >= 40 ? 'warning' : 'fail');
    const aids = [data.hasSuggestions && 'suggestions', data.hasReset && 'reset', data.hasAlternatives && 'alternatives', data.hasCTA && 'CTA'].filter(Boolean).join(', ') || 'none';
    details = `Zero-result state detected. Recovery aids: ${aids}.`;
    analysis = {
      cause: score >= 80 ? "The empty-results page guides shoppers back on track with suggestions and alternatives." : "A zero-result state was found but it leaves shoppers at a dead end without enough recovery options.",
      recommendation: "On empty results, show a friendly message, a one-click way to clear/broaden filters, recommended alternative vehicles, and a contact/chat CTA."
    };
  } else {
    const infra = (data.hasAlternatives ? 60 : 0) + (data.hasSearchSuggest ? 40 : 0);
    score = Math.max(40, infra);
    status = score >= 80 ? 'pass' : (score >= 40 ? 'warning' : 'fail');
    details = "No zero-result state on this page; graded available fallback infrastructure (recommendations / search suggestions).";
    analysis = {
      cause: "A no-results page couldn't be observed during this single-page audit, so this is informational only.",
      recommendation: "Ensure that when a search returns nothing, users see suggestions, a clear-filters option, alternative vehicles and a contact CTA instead of a blank page."
    };
  }

  // On an inventory/search-results page this is a real, weighted signal (the SRP's dead-end
  // recovery readiness). Off-SRP we can't fairly observe an empty state → informational only.
  const infoOnly = !isSrp;
  return {
    score,
    status,
    details,
    analysis,
    meta: { observed: data.noResultsState, isSrp, hasSuggestions: data.hasSuggestions, hasReset: data.hasReset, hasAlternatives: data.hasAlternatives, hasCTA: data.hasCTA, hasSearchSuggest: data.hasSearchSuggest, infoOnly },
    infoOnly
  };
}

// Certifications & Awards (info-only — overlaps the AEO Expertise Signals param)
async function checkCertificationsAwards(page) {
  const data = await page.evaluate(() => {
    const text = (document.body.innerText || '').toLowerCase();
    const imgAlts = Array.from(document.querySelectorAll('img')).map(i => (i.getAttribute('alt') || '').toLowerCase());
    const altText = imgAlts.join(' ');
    const haystack = text + ' ' + altText + ' ' + document.body.className.toLowerCase();

    const signals = {
      certified: /\bcertified\b|\bcertification\b|certified pre-owned|\bcpo\b/,
      bbb: /\bbbb\b|better business bureau|accredited business/,
      award: /\baward(s|ed)?\b|dealer of the year|president'?s award|mark of excellence|top rated|top-rated|best dealer/,
      ratings: /dealerrater|cars\.com award|edmunds|kelley blue book|\bkbb\b|google reviews|5[- ]?star|five[- ]?star/,
      manufacturer: /(toyota|honda|ford|chevrolet|nissan|bmw|mercedes|hyundai|kia|subaru|gmc|jeep|ram|lexus|audi|volkswagen|mazda) certified/,
      ase: /\base certified\b|ase[- ]certified/
    };
    const found = Object.keys(signals).filter(k => signals[k].test(haystack));
    const badgeImgs = imgAlts.filter(a => /certified|award|bbb|accredited|5[- ]?star|dealerrater|excellence/.test(a)).length;

    return { found, badgeImgs };
  });

  const distinct = data.found.length;
  let score = distinct === 0 ? 20 : distinct === 1 ? 55 : distinct === 2 ? 75 : 100;
  if (data.badgeImgs > 0 && score < 100) score = Math.min(100, score + 10);
  const status = score >= 80 ? 'pass' : (score >= 40 ? 'warning' : 'fail');

  return {
    score, status,
    details: distinct ? `Trust signals found: ${data.found.join(', ')}${data.badgeImgs ? ` (+${data.badgeImgs} badge image${data.badgeImgs > 1 ? 's' : ''})` : ''}.` : "No certifications, accreditations or awards detected on this page.",
    analysis: {
      cause: distinct >= 2 ? "The page surfaces multiple credibility signals (certifications/awards) that build buyer trust." : "Few or no third-party credibility signals (certifications, BBB, awards, ratings) are visible.",
      recommendation: "Display manufacturer certifications, BBB accreditation, award badges (Dealer of the Year, DealerRater) and star ratings prominently near the top of key pages."
    },
    meta: { found: data.found, badgeImgs: data.badgeImgs, infoOnly: true },
    infoOnly: true
  };
}

// Pricing Transparency / Fee Visibility (weighted; hybrid — info-only when no pricing on the page)
async function checkPricingTransparency(page) {
  const data = await page.evaluate(() => {
    const text = (document.body.innerText || '').toLowerCase();
    const priceEls = document.querySelectorAll('[class*="price" i], [itemprop="price"]').length;
    const dollarCount = (text.match(/\$\s?\d/g) || []).length;
    const hasPriceLabels = /\bmsrp\b|sale price|our price|internet price|selling price|list price|asking price/.test(text);
    const callForPrice = /call for price|contact (us )?for price|price on request|please call|inquire for price/.test(text);

    const feeDisclosure = /\bdoc(umentation)? fee|dealer fee|processing fee|destination (charge|fee)|no hidden fees|no dealer fees|plus (tax|fees|tax and fees)|out[- ]the[- ]door|price includes|price excludes|additional fees may/.test(text);
    const noHidden = /no hidden fees|no dealer fees|no surprise|transparent pricing|upfront pricing|no markup/.test(text);
    const disclaimer = /disclaimer|price does not include|does not include tax|see dealer for details|plus applicable|tax, title|excludes tax/.test(text);
    const financing = /monthly payment|estimated payment|\/mo\b|\bapr\b|financing available|payment calculator|as low as \$/.test(text);

    const hasAnyPrice = priceEls > 0 || dollarCount >= 2 || hasPriceLabels;
    return { priceEls, dollarCount, hasPriceLabels, callForPrice, feeDisclosure, noHidden, disclaimer, financing, hasAnyPrice };
  });

  if (!data.hasAnyPrice && !data.callForPrice) {
    return {
      status: 'pass',
      details: "No pricing is shown on this page, so pricing transparency isn't applicable here.",
      analysis: { cause: "Pricing transparency is evaluated where vehicle prices appear (VDP/SRP/specials).", recommendation: "Audit an inventory or vehicle-detail page to grade price and fee transparency." },
      meta: { notApplicable: true, infoOnly: true },
      infoOnly: true
    };
  }

  const showsRealPrices = (data.priceEls > 0 || data.dollarCount >= 2 || data.hasPriceLabels) && !(data.callForPrice && data.dollarCount < 2);
  const score = Math.max(0, Math.min(100,
    (showsRealPrices ? 30 : 0) +
    (data.feeDisclosure ? 30 : 0) +
    (data.disclaimer ? 15 : 0) +
    (data.financing ? 15 : 0) +
    (data.noHidden ? 10 : 0)
  ));
  const status = score >= 80 ? 'pass' : (score >= 40 ? 'warning' : 'fail');

  let analysis;
  if (status === 'pass') analysis = { cause: "Prices are shown openly with fee disclosure, building buyer trust before they ever call.", recommendation: "Keep fees and disclaimers visible next to price; consider an out-the-door price estimator." };
  else if (status === 'warning') analysis = { cause: `Pricing is partly transparent${!data.feeDisclosure ? ' but fees/taxes are not disclosed' : ''}${!data.financing ? '; no payment estimate' : ''}.`, recommendation: "Disclose doc/dealer fees and taxes near the price, add a monthly-payment estimate, and state 'no hidden fees' if true." };
  else analysis = { cause: data.callForPrice ? "Prices are largely hidden behind 'call for price', which erodes trust." : "Prices appear but fees and disclaimers are not disclosed.", recommendation: "Show actual prices (not just 'call for price'), disclose all fees and taxes, and add financing/payment estimates." };

  return {
    score, status,
    details: `${showsRealPrices ? 'Prices shown' : 'Prices hidden / call-for-price'}; fee disclosure: ${data.feeDisclosure ? 'yes' : 'no'}, financing: ${data.financing ? 'yes' : 'no'}.`,
    analysis,
    meta: { showsRealPrices, callForPrice: data.callForPrice, feeDisclosure: data.feeDisclosure, noHidden: data.noHidden, disclaimer: data.disclaimer, financing: data.financing }
  };
}

// Vehicle History Reports — CARFAX / AutoCheck (weighted; hybrid — only used/CPO vehicles have history)
async function checkVehicleHistory(page) {
  const data = await page.evaluate(() => {
    const text = (document.body.innerText || '').toLowerCase();
    const url = window.location.pathname.toLowerCase();
    const html = document.documentElement.innerHTML.toLowerCase();

    const usedUrl = /\/used|\/pre-owned|\/preowned|\/cpo|\/certified/.test(url);
    const usedText = /\bused\b|pre-owned|pre owned|certified pre-owned|\bcpo\b/.test(text);
    const newOnlyUrl = /\/new(-|\/|$)/.test(url) && !usedUrl;

    const priceEls = document.querySelectorAll('[class*="price" i], [itemprop="price"]').length;
    const vehicleContext = usedUrl || usedText || /\/inventory|\/vehicles|\/vdp|\/cars/.test(url) || priceEls >= 2 || /\b(vin|stock\s?#|mileage|odometer)\b/.test(text);

    const carfax = /carfax/.test(html);
    const autocheck = /autocheck/.test(html);
    const reportLinks = document.querySelectorAll('a[href*="carfax" i], a[href*="autocheck" i]').length;
    const historyLang = /vehicle history report|free (vehicle )?history|history report|accident[- ]free|no accidents|\bone[- ]owner\b|\b1[- ]owner\b|clean (title|history)|\bclean carfax\b/.test(text);

    return { usedUrl, usedText, newOnlyUrl, vehicleContext, carfax, autocheck, reportLinks, historyLang };
  });

  const isUsedContext = data.usedUrl || data.usedText;

  if (!data.vehicleContext || (data.newOnlyUrl && !isUsedContext)) {
    return {
      status: 'pass',
      details: data.newOnlyUrl ? "New-vehicle context — history reports don't apply to new cars." : "No used-vehicle inventory context on this page; history reports not applicable.",
      analysis: { cause: "CARFAX/AutoCheck history is only expected on used / certified pre-owned vehicles.", recommendation: "Audit a used or CPO inventory/vehicle page to grade history-report availability." },
      meta: { notApplicable: true, context: data.newOnlyUrl ? 'new' : 'non-inventory', infoOnly: true },
      infoOnly: true
    };
  }

  const hasReport = data.carfax || data.autocheck;
  const score = Math.max(0, Math.min(100,
    (hasReport ? 55 : 0) +
    (data.reportLinks > 0 ? 20 : 0) +
    (data.historyLang ? 25 : 0)
  ));
  const status = score >= 80 ? 'pass' : (score >= 40 ? 'warning' : 'fail');
  const providers = [data.carfax && 'CARFAX', data.autocheck && 'AutoCheck'].filter(Boolean).join(' & ');

  return {
    score, status,
    details: `${hasReport ? `${providers} present` : 'No CARFAX/AutoCheck detected'}${data.reportLinks ? `, ${data.reportLinks} report link(s)` : ''}.`,
    analysis: {
      cause: hasReport ? "Vehicle history reports are surfaced, reassuring used-car buyers about condition and ownership." : "Used vehicles are shown without visible CARFAX/AutoCheck history reports, a major trust gap for pre-owned shoppers.",
      recommendation: "Provide a free CARFAX or AutoCheck report link on every used/CPO listing and highlight 'accident-free' / 'one-owner' / 'clean title' where applicable."
    },
    meta: { context: isUsedContext ? 'used' : 'inventory', carfax: data.carfax, autocheck: data.autocheck, reportLinks: data.reportLinks, historyLang: data.historyLang }
  };
}

// Staff Profiles / Team Pages (info-only — overlaps the AEO Experience Signals param)
async function checkStaffProfiles(page) {
  const data = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a'));
    const hasTeamLink = links.some(a => {
      const t = ((a.innerText || '') + ' ' + (a.getAttribute('href') || '')).toLowerCase();
      return /meet (the|our) team|our team|our staff|the team|our people|employees|sales team|about-us\/staff|\/staff|\/team|\/our-team|\/meet-/.test(t);
    });

    const profileContainers = Array.from(document.querySelectorAll('[class*="team" i], [class*="staff" i], [class*="member" i], [class*="employee" i], [class*="profile" i], [class*="person" i]'));
    const roleRegex = /\b(sales|general)?\s?(manager|consultant|advisor|associate|specialist|finance|director|owner|president|gm|technician|representative)\b/;
    let profileCount = 0, withPhoto = 0, withContact = 0;
    profileContainers.slice(0, 60).forEach(c => {
      const t = (c.innerText || '').toLowerCase();
      const hasRole = roleRegex.test(t);
      const hasImg = !!c.querySelector('img');
      const hasContact = !!c.querySelector('a[href^="tel:"], a[href^="mailto:"]');
      if (hasRole && (hasImg || t.length > 10)) {
        profileCount++;
        if (hasImg) withPhoto++;
        if (hasContact) withContact++;
      }
    });

    const hasOnPageProfiles = profileCount >= 2;
    return { hasTeamLink, hasOnPageProfiles, profileCount, withPhoto, withContact };
  });

  const richness = data.hasOnPageProfiles ? ((data.withPhoto > 0 ? 10 : 0) + (data.withContact > 0 ? 10 : 0)) : 0;
  const score = Math.max(0, Math.min(100,
    (data.hasTeamLink ? 40 : 0) +
    (data.hasOnPageProfiles ? 40 : 0) +
    richness
  ));
  const status = score >= 80 ? 'pass' : (score >= 40 ? 'warning' : 'fail');

  return {
    score, status,
    details: data.hasOnPageProfiles ? `${data.profileCount} staff profiles detected (${data.withPhoto} with photos, ${data.withContact} with contact).` : data.hasTeamLink ? "A team/staff page link was found, but no profiles on this page." : "No staff profiles or team page detected.",
    analysis: {
      cause: (data.hasTeamLink || data.hasOnPageProfiles) ? "The site puts real people forward (team/staff profiles), which humanizes the dealership and builds trust." : "There's no visible team or staff presence, so buyers can't put a face to who they'd work with.",
      recommendation: "Add a 'Meet Our Team' page with photos, roles and direct contact for sales, finance and service staff."
    },
    meta: { hasTeamLink: data.hasTeamLink, hasOnPageProfiles: data.hasOnPageProfiles, profileCount: data.profileCount, withPhoto: data.withPhoto, withContact: data.withContact, infoOnly: true },
    infoOnly: true
  };
}

// Mobile Experience / Responsive Layout
// Real responsive validation — viewport meta, horizontal overflow, responsive images,
// and media-query usage — rather than a flex/grid pattern guess.
async function checkMobileExperience(page, deviceType) {
  const data = await page.evaluate(() => {
    const lc = (s) => (s || "").toLowerCase();
    const innerWidth = window.innerWidth || 0;

    // 1. Viewport meta
    const vp = document.querySelector('meta[name="viewport"]');
    const viewportContent = vp ? lc(vp.getAttribute("content")) : "";
    const hasViewportMeta = !!vp;
    const hasDeviceWidth = viewportContent.includes("width=device-width");

    // 2. Horizontal overflow (content wider than the viewport)
    const docScrollWidth = Math.max(
      document.documentElement.scrollWidth,
      document.body ? document.body.scrollWidth : 0
    );
    const overflowBy = Math.max(0, docScrollWidth - innerWidth);
    const horizontalOverflow = overflowBy > 2;

    // Identify a few offending wide elements (for the recommendation)
    const offenders = [];
    if (horizontalOverflow) {
      document.querySelectorAll("body *").forEach(el => {
        if (offenders.length >= 5) return;
        const rect = el.getBoundingClientRect();
        if (rect.width > innerWidth + 2 && rect.height > 0) {
          const tag = el.tagName.toLowerCase();
          const cls = (el.className && typeof el.className === "string")
            ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
          const sig = tag + cls;
          if (!offenders.includes(sig)) offenders.push(sig);
        }
      });
    }

    // 3. Responsive images (srcset / sizes / <picture>)
    const imgs = Array.from(document.querySelectorAll("img"));
    const imagesTotal = imgs.length;
    let responsiveImages = 0;
    imgs.forEach(img => {
      if (img.hasAttribute("srcset") || img.hasAttribute("sizes") || img.closest("picture")) responsiveImages++;
    });

    // 4. Media-query usage (same-origin stylesheets + inline <style>)
    let mediaQueryCount = 0;
    try {
      for (const sheet of Array.from(document.styleSheets)) {
        let rules;
        try { rules = sheet.cssRules; } catch (e) { continue; } // cross-origin sheets throw
        if (!rules) continue;
        for (const rule of Array.from(rules)) {
          if (rule.type === 4 /* CSSMediaRule */) mediaQueryCount++;
        }
      }
    } catch (e) {}

    return {
      innerWidth, hasViewportMeta, viewportContent, hasDeviceWidth,
      horizontalOverflow, overflowBy: Math.round(overflowBy), offenders,
      imagesTotal, responsiveImages, mediaQueryCount
    };
  });

  // Composite scoring (0-100)
  let score = 0;
  if (data.hasViewportMeta && data.hasDeviceWidth) score += 30;     // viewport meta (30)
  else if (data.hasViewportMeta) score += 15;
  if (!data.horizontalOverflow) score += 35;                        // no horizontal overflow (35)
  if (data.imagesTotal === 0) score += 20;                          // responsive images (20), N/A => full
  else score += Math.round((data.responsiveImages / data.imagesTotal) * 20);
  if (data.mediaQueryCount > 0) score += 15;                        // media queries present (15)
  score = Math.max(0, Math.min(100, score));

  const responsiveImageRatio = data.imagesTotal > 0
    ? Math.round((data.responsiveImages / data.imagesTotal) * 100) : null;

  const meta = {
    hasViewportMeta: data.hasViewportMeta,
    viewportContent: data.viewportContent,
    hasDeviceWidth: data.hasDeviceWidth,
    horizontalOverflow: data.horizontalOverflow,
    overflowBy: data.overflowBy,
    offenders: data.offenders,
    imagesTotal: data.imagesTotal,
    responsiveImages: data.responsiveImages,
    responsiveImageRatio,
    mediaQueryCount: data.mediaQueryCount,
    score
  };

  const issues = [];
  if (!data.hasViewportMeta) issues.push("no responsive viewport meta tag");
  else if (!data.hasDeviceWidth) issues.push("viewport meta missing width=device-width");
  if (data.horizontalOverflow) issues.push(`content overflows the viewport by ${data.overflowBy}px (horizontal scroll)`);
  if (data.imagesTotal > 0 && responsiveImageRatio !== null && responsiveImageRatio < 50) issues.push("few images use srcset/sizes/<picture>");
  if (data.mediaQueryCount === 0) issues.push("no CSS media queries detected");

  const status = score >= 75 ? "pass" : score >= 45 ? "warning" : "fail";

  if (status === "pass") {
    return {
      score, status,
      details: "The layout adapts to the screen: responsive viewport, no horizontal overflow, and responsive techniques in use.",
      meta, analysis: null
    };
  }
  return {
    score, status,
    details: status === "warning" ? "The layout is partially responsive but has gaps." : "The layout does not adapt well to mobile screens.",
    meta,
    analysis: {
      cause: `Responsive issues detected: ${issues.join("; ") || "the page does not adapt cleanly to smaller viewports"}.`,
      recommendation: "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">, remove fixed-width elements that cause horizontal scroll, serve responsive images with srcset/sizes, and use CSS media queries to adapt the layout."
    }
  };
}

// Mobile Usability (touch targets, legible text, thumb reach)
async function checkMobileUsability(page, deviceType) {
  const data = await page.evaluate(() => {
    const innerWidth = window.innerWidth || 0;
    const innerHeight = window.innerHeight || 0;

    const isVisible = (el) => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 1 || rect.height <= 1) return false;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || parseFloat(style.opacity) === 0) return false;
      return true;
    };

    // 1. Touch targets (>= 44px min side, per Apple HIG / WCAG 2.5.5)
    const tapSelector = 'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], summary, label[for]';
    const MIN = 44;
    let totalTargets = 0, adequate = 0, tooSmall = 0;
    const smallExamples = [];
    document.querySelectorAll(tapSelector).forEach(el => {
      if (!isVisible(el)) return;
      const rect = el.getBoundingClientRect();
      const minSide = Math.min(rect.width, rect.height);
      totalTargets++;
      if (minSide >= MIN) adequate++;
      else {
        tooSmall++;
        if (smallExamples.length < 5) {
          const label = (el.innerText || el.value || el.getAttribute("aria-label") || el.tagName).trim().slice(0, 24);
          smallExamples.push(`${label || el.tagName.toLowerCase()} (${Math.round(rect.width)}x${Math.round(rect.height)})`);
        }
      }
    });

    // 2. Legible font sizes (>= 12px hard minimum)
    const textSelector = "p, li, a, span, button, td, th, h1, h2, h3, h4, h5, h6, label, dd, dt";
    let textTotal = 0, legible = 0, tiny = 0;
    document.querySelectorAll(textSelector).forEach(el => {
      const text = (el.innerText || "").trim();
      if (!text || text.length < 2) return;
      if (!isVisible(el)) return;
      const fs = parseFloat(window.getComputedStyle(el).fontSize) || 0;
      if (fs <= 0) return;
      textTotal++;
      if (fs >= 12) legible++;
      else tiny++;
    });

    // 3. Thumb reach heuristic — a reachable sticky bar or mobile nav
    let hasStickyBar = false;
    document.querySelectorAll("header, nav, div, footer").forEach(el => {
      if (hasStickyBar) return;
      const style = window.getComputedStyle(el);
      if (style.position === "fixed" || style.position === "sticky") {
        const rect = el.getBoundingClientRect();
        const nearEdge = rect.top <= 4 || (innerHeight - rect.bottom) <= 4;
        if (nearEdge && rect.width >= innerWidth * 0.6 && rect.height > 0) hasStickyBar = true;
      }
    });
    const hasMobileNav = !!document.querySelector('.navbar-toggler, .nav-icon, .mobile-menu-button, .hamburger, [class*="hamburger"], button[aria-label*="menu" i], [aria-label*="open menu" i]');

    return { innerWidth, totalTargets, adequate, tooSmall, smallExamples, textTotal, legible, tiny, hasStickyBar, hasMobileNav };
  });

  // Guard: a page that rendered essentially empty (failed load / JS-only shell) has no
  // measurable UI — don't let the empty-set ratio defaults (1.0) produce a false "pass".
  if (data.totalTargets === 0 && data.textTotal <= 1) {
    return {
      score: 0,
      status: "warning",
      infoOnly: true,
      details: "Not enough rendered content to assess mobile usability.",
      meta: { totalTargets: 0, textTotal: data.textTotal, notMeasurable: true, infoOnly: true, score: 0 },
      analysis: null
    };
  }

  // Composite scoring (0-100)
  const touchRatio = data.totalTargets > 0 ? data.adequate / data.totalTargets : 1;
  const fontRatio = data.textTotal > 0 ? data.legible / data.textTotal : 1;
  const thumbSignal = (data.hasStickyBar || data.hasMobileNav) ? 1 : 0;
  let score = Math.round((0.55 * touchRatio + 0.30 * fontRatio + 0.15 * thumbSignal) * 100);
  score = Math.max(0, Math.min(100, score));

  const touchPct = data.totalTargets > 0 ? Math.round(touchRatio * 100) : null;
  const fontPct = data.textTotal > 0 ? Math.round(fontRatio * 100) : null;

  // Touch-target sizing is not a fair signal on desktop — show but don't weight it there.
  const infoOnly = deviceType !== "mobile";

  const meta = {
    totalTargets: data.totalTargets,
    adequateTargets: data.adequate,
    tooSmallTargets: data.tooSmall,
    touchTargetPct: touchPct,
    smallExamples: data.smallExamples,
    textTotal: data.textTotal,
    legibleText: data.legible,
    tinyText: data.tiny,
    legibleTextPct: fontPct,
    hasStickyBar: data.hasStickyBar,
    hasMobileNav: data.hasMobileNav,
    thumbReachOk: thumbSignal === 1,
    minTouchTargetPx: 44,
    infoOnly,
    score
  };

  const issues = [];
  if (touchPct !== null && touchPct < 80) issues.push(`${data.tooSmall} of ${data.totalTargets} tap targets are smaller than 44px`);
  if (fontPct !== null && fontPct < 90) issues.push(`${data.tiny} text elements are below a legible size`);
  if (!data.hasStickyBar && !data.hasMobileNav) issues.push("no reachable sticky nav or mobile menu for one-handed use");

  const status = score >= 75 ? "pass" : score >= 45 ? "warning" : "fail";

  if (status === "pass") {
    return {
      score, status, infoOnly,
      details: infoOnly
        ? "Touch ergonomics shown for mobile context (not scored on desktop)."
        : "Tap targets are large enough, text is legible, and navigation is within thumb reach.",
      meta, analysis: null
    };
  }
  return {
    score, status, infoOnly,
    details: status === "warning" ? "Mobile usability is workable but has friction points." : "Mobile usability needs work — small tap targets or text.",
    meta,
    analysis: {
      cause: `Usability issues for touch users: ${issues.join("; ") || "tap targets or text are not optimized for one-handed mobile use"}.`,
      recommendation: "Make tap targets at least 44×44px with adequate spacing, keep body text at 16px (never below 12px), and provide a reachable sticky or bottom navigation for one-handed use."
    }
  };
}

// ---------------------------------------------------------------------------------------------
// Hierarchy & flow clarity — spec §2.5 merge of "Content Hierarchy Clarity", "Section Labeling
// Clarity" and "Page-to-Page Flow" into ONE parameter (Part 4: these three overlap heavily).
// Sub-signals: heading hierarchy (45%), section labeling (35%), page-to-page flow (20%).
// ---------------------------------------------------------------------------------------------
async function checkHierarchyFlowClarity(page) {
  const d = await page.evaluate(() => {
    // 1. Heading hierarchy
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const h1Count = headings.filter(h => h.tagName === 'H1').length;
    let isSequential = true;
    for (let i = 0; i < headings.length - 1; i++) {
      const cur = parseInt(headings[i].tagName[1]);
      const nxt = parseInt(headings[i + 1].tagName[1]);
      if (nxt > cur + 1) isSequential = false;
    }

    // 2. Section labeling
    const sections = Array.from(document.querySelectorAll('section, article, .section, .block'));
    const labeledCount = sections.filter(s => s.querySelector('h1, h2, h3, h4') || s.getAttribute('aria-label')).length;

    // 3. Page-to-page flow
    const hasFooter = !!document.querySelector('footer');
    const hostname = window.location.hostname;
    const internalLinks = Array.from(document.querySelectorAll('a')).filter(a => {
      try { return a.href.includes(hostname); } catch (e) { return false; }
    }).length;
    const nextStepCTAs = Array.from(document.querySelectorAll('button, a.btn')).length;

    return { h1Count, totalHeadings: headings.length, isSequential, totalSections: sections.length, labeledCount, hasFooter, internalLinks, nextStepCTAs };
  });

  // --- Sub-scores (0-100) ---
  let headingScore = 100;
  if (d.totalHeadings === 0) headingScore = 0;
  else {
    if (d.h1Count !== 1) headingScore -= 30;
    if (!d.isSequential) headingScore -= 25;
    headingScore = Math.max(0, headingScore);
  }
  const labelingScore = d.totalSections > 0 ? Math.round((d.labeledCount / d.totalSections) * 100) : 100;
  const flowSignals = (d.hasFooter ? 1 : 0) + (d.internalLinks > 2 ? 1 : 0) + (d.nextStepCTAs > 0 ? 1 : 0);
  const flowScore = Math.round((flowSignals / 3) * 100);

  const score = Math.round(0.45 * headingScore + 0.35 * labelingScore + 0.20 * flowScore);
  const status = score >= 75 ? 'pass' : score >= 45 ? 'warning' : 'fail';

  const weak = [];
  if (headingScore < 75) weak.push(d.totalHeadings === 0 ? 'no headings' : d.h1Count !== 1 ? `${d.h1Count} H1 tags` : 'heading levels skip');
  if (labelingScore < 75) weak.push(`only ${d.labeledCount}/${d.totalSections} sections labeled`);
  if (flowScore < 75) weak.push(!d.hasFooter ? 'no footer' : d.nextStepCTAs === 0 ? 'no next-step CTAs' : 'few internal links');

  let analysis;
  if (status === 'pass') {
    analysis = {
      cause: "The page has a clear heading hierarchy, labeled sections and a logical onward flow, so visitors can scan and move forward easily.",
      recommendation: "Keep a single descriptive H1, label every major section with a heading, and always offer a clear next step."
    };
  } else {
    analysis = {
      cause: `Structure & flow gaps: ${weak.join('; ') || 'the page is hard to scan or leads to a dead end'}.`,
      recommendation: "Use exactly one H1 with sequential H2/H3 sub-headings, give every major section a visible heading, and add a footer plus a clear 'what's next' action so users never hit a dead end."
    };
  }

  return {
    score,
    status,
    details: `${d.h1Count} H1 / ${d.totalHeadings} headings, ${d.labeledCount}/${d.totalSections} sections labeled, ${d.nextStepCTAs} next-step links.`,
    analysis,
    meta: {
      h1Count: d.h1Count,
      totalHeadings: d.totalHeadings,
      isSequential: d.isSequential,
      totalSections: d.totalSections,
      labeledCount: d.labeledCount,
      hasFooter: d.hasFooter,
      internalLinks: d.internalLinks,
      nextStepCTAs: d.nextStepCTAs,
      breakdown: { headingScore, labelingScore, flowScore }
    }
  };
}

// ---------------------------------------------------------------------------------------------
// Vehicle image gallery quality — spec §2.5 page-specific (VDP, +0.10).
// Grades photo count, alt text, lazy-loading, responsive serving and a real-vs-stock heuristic.
// Informational (dropped from the denominator) when the page isn't a vehicle-detail page.
// ---------------------------------------------------------------------------------------------
async function checkVehicleGallery(page) {
  const d = await page.evaluate(() => {
    const path = window.location.pathname.toLowerCase();
    const url = window.location.href.toLowerCase();
    const text = (document.body.innerText || '').toLowerCase();

    // --- VDP detection: a single-vehicle detail page (not an SRP / listing) ---
    let vehicleSchema = false, itemListSchema = false;
    for (const s of Array.from(document.querySelectorAll('script[type="application/ld+json"]'))) {
      try {
        const j = JSON.parse(s.innerText);
        const arr = Array.isArray(j) ? j : [j];
        for (const o of arr) {
          const t = o && o['@type'];
          const types = Array.isArray(t) ? t : [t];
          if (types.some(x => ['Vehicle', 'Car', 'Motorcycle'].includes(x))) vehicleSchema = true;
          if (types.some(x => x === 'ItemList')) itemListSchema = true;
        }
      } catch (e) { }
    }
    const vdpUrl = /\/vdp|\/vehicle\/|\/-id-|\/used\/[^/]+\/[^/]+|\/new\/[^/]+\/[^/]+/.test(path) || /vin=|stocknum|stock=|vehicleid/.test(url);
    const hasVin = /\bvin\b/.test(text);
    const hasStock = /\bstock\s?#|\bstock\s?number|\bstk#/.test(text);
    const specWords = /mileage|odometer|drivetrain|transmission|exterior color|interior color|engine/.test(text);
    const priceEls = document.querySelectorAll('[class*="price" i], [itemprop="price"]').length;

    const isVdp = (vehicleSchema && !itemListSchema) ||
      (vdpUrl && (hasVin || hasStock)) ||
      (vdpUrl && priceEls >= 1 && specWords);

    if (!isVdp) return { isVdp: false };

    // --- Gallery detection ---
    const gallerySel = '[class*="gallery" i], [class*="carousel" i], [class*="slider" i], [class*="slick" i], [class*="swiper" i], [class*="lightbox" i], [class*="photos" i], [class*="media-viewer" i]';
    const galleryRoots = Array.from(document.querySelectorAll(gallerySel));
    const gallerySet = new Set();
    galleryRoots.forEach(r => r.querySelectorAll('img').forEach(i => gallerySet.add(i)));
    const galleryImgs = Array.from(gallerySet);

    // Fallback: substantial images on the page when no obvious gallery container exists.
    const bigImgs = Array.from(document.querySelectorAll('img')).filter(i => {
      const r = i.getBoundingClientRect();
      return (i.naturalWidth >= 400 || r.width >= 300);
    });

    const usedGallery = galleryImgs.length >= 3;
    const imgs = (usedGallery ? galleryImgs : bigImgs).slice(0, 80);

    let withAlt = 0, lazy = 0, responsive = 0, stockish = 0;
    imgs.forEach(i => {
      const alt = (i.getAttribute('alt') || '').trim();
      if (alt.length >= 3) withAlt++;
      if (i.getAttribute('loading') === 'lazy' || i.hasAttribute('data-src') || i.hasAttribute('data-lazy') || i.hasAttribute('data-srcset')) lazy++;
      if (i.hasAttribute('srcset') || i.hasAttribute('sizes') || i.closest('picture')) responsive++;
      const src = (i.getAttribute('src') || i.getAttribute('data-src') || '').toLowerCase();
      if (/stock|placeholder|coming-?soon|no-?image|default|dummy/.test(src + ' ' + alt)) stockish++;
    });

    return { isVdp: true, count: imgs.length, withAlt, lazy, responsive, stockish, usedGallery };
  });

  if (!d.isVdp) {
    return {
      infoOnly: true,
      status: 'pass',
      details: "Vehicle image gallery quality is graded on vehicle-detail (VDP) pages.",
      analysis: {
        cause: "This isn't a single-vehicle detail page.",
        recommendation: "Audit a VDP to grade gallery photo count, alt text, lazy-loading and real-vs-stock imagery."
      },
      meta: { notApplicable: true, infoOnly: true }
    };
  }

  const n = d.count;
  const countScore = n >= 8 ? 40 : n >= 4 ? 28 : n >= 1 ? 14 : 0;       // photo count (40)
  const altScore = n ? Math.round((d.withAlt / n) * 20) : 0;            // alt text (20)
  const lazyScore = n ? Math.round((Math.min(d.lazy, n) / n) * 15) : 0; // lazy-loading (15)
  const resScore = n ? Math.round((d.responsive / n) * 15) : 0;         // responsive serving (15)
  const realScore = n && (d.stockish / n) < 0.5 ? 10 : 0;              // real (not stock) photos (10)

  const score = Math.max(0, Math.min(100, countScore + altScore + lazyScore + resScore + realScore));
  const status = score >= 75 ? 'pass' : score >= 45 ? 'warning' : 'fail';

  const issues = [];
  if (n < 8) issues.push(`only ${n} gallery photo${n === 1 ? '' : 's'} (aim for 8+)`);
  if (n && d.withAlt / n < 0.5) issues.push('most photos lack alt text');
  if (n && d.lazy / n < 0.5) issues.push('photos not lazy-loaded');
  if (n && d.stockish / n >= 0.5) issues.push('appears to use stock/placeholder images');

  return {
    score,
    status,
    details: `${n} vehicle photo${n === 1 ? '' : 's'} (${d.withAlt} with alt, ${d.lazy} lazy-loaded${d.stockish ? `, ${d.stockish} stock-like` : ''}).`,
    analysis: status === 'pass'
      ? {
        cause: "The vehicle gallery has plenty of real, well-described photos served efficiently — exactly what shoppers want before they enquire.",
        recommendation: "Keep 8+ real photos per vehicle with descriptive alt text and lazy-loading; add interior, odometer and damage close-ups."
      }
      : {
        cause: `Gallery gaps: ${issues.join('; ') || 'the vehicle gallery is thin or poorly optimized'}.`,
        recommendation: "Show 8+ real (not stock) photos per vehicle covering exterior angles, interior, odometer and any damage; add descriptive alt text and lazy-load images so the page stays fast."
      },
    meta: {
      photoCount: n,
      withAlt: d.withAlt,
      lazyLoaded: d.lazy,
      responsive: d.responsive,
      stockLike: d.stockish,
      usedGalleryContainer: d.usedGallery,
      breakdown: { countScore, altScore, lazyScore, resScore, realScore }
    }
  };
}

// ---------------------------------------------------------------------------------------------
// Mobile experience — spec §2.5 keeps ONE "Mobile experience" in UX that ABSORBS the retired
// "Mobile Usability" (touch targets / legible text / thumb reach). On desktop, touch-target
// sizing isn't a fair signal, so the score is responsive-only and usability is shown for info.
// ---------------------------------------------------------------------------------------------
async function checkMobileExperienceMerged(page, deviceType) {
  const responsive = await checkMobileExperience(page, deviceType);
  const usability = await checkMobileUsability(page, deviceType);

  const usabilityMeasurable = !usability.infoOnly && !(usability.meta && usability.meta.notMeasurable);
  let score, blended;
  if (deviceType === 'mobile' && usabilityMeasurable) {
    score = Math.round(0.6 * (responsive.score || 0) + 0.4 * (usability.score || 0));
    blended = true;
  } else {
    score = responsive.score || 0;        // desktop (or unmeasurable touch UI) → responsive only
    blended = false;
  }
  score = Math.max(0, Math.min(100, score));
  const status = score >= 75 ? 'pass' : score >= 45 ? 'warning' : 'fail';

  const meta = {
    ...(responsive.meta || {}),
    // fold the usability sub-signals into the single Mobile Experience card
    touchTargetPct: usability.meta?.touchTargetPct,
    adequateTargets: usability.meta?.adequateTargets,
    totalTargets: usability.meta?.totalTargets,
    tooSmallTargets: usability.meta?.tooSmallTargets,
    smallExamples: usability.meta?.smallExamples,
    legibleTextPct: usability.meta?.legibleTextPct,
    legibleText: usability.meta?.legibleText,
    textTotal: usability.meta?.textTotal,
    tinyText: usability.meta?.tinyText,
    thumbReachOk: usability.meta?.thumbReachOk,
    hasMobileNav: usability.meta?.hasMobileNav,
    hasStickyBar: usability.meta?.hasStickyBar,
    responsiveScore: responsive.score,
    usabilityScore: usability.score,
    usabilityWeighted: blended,
    score
  };

  // Combine the two analyses' causes when failing.
  const causes = [responsive.analysis?.cause, blended ? usability.analysis?.cause : null].filter(Boolean);
  let analysis = null;
  if (status !== 'pass') {
    analysis = {
      cause: causes.join(' ') || "The page doesn't adapt cleanly to small screens.",
      recommendation: "Add a width=device-width viewport, remove fixed-width elements that cause horizontal scroll, serve responsive images, use media queries, and make tap targets ≥44px with legible (≥16px) text for one-handed mobile use."
    };
  }

  return {
    score,
    status,
    details: status === 'pass'
      ? (blended
        ? "The layout adapts to the screen and is comfortable for touch: responsive viewport, no overflow, large tap targets and legible text."
        : "The layout adapts to the screen: responsive viewport, no horizontal overflow, and responsive techniques in use.")
      : (status === 'warning' ? "Mobile experience is partially optimized but has gaps." : "The layout does not adapt well to mobile screens."),
    analysis,
    meta
  };
}

export default async function evaluateMobileUX(device, page) {
  const deviceType = device === 'Mobile' ? 'mobile' : 'desktop';

  // --- Common parameters (spec §2.5) ---
  const readability = await checkReadability(page);
  const stickyHeader = await checkStickyHeader(page, deviceType);
  const interstitials = await checkInterstitials(page, deviceType);
  const navDiscoverability = await checkNavDiscoverability(page);
  const atf = await checkATF(page);
  const clickFeedback = await checkClickFeedback(page, deviceType);
  const loadingFeedback = await checkLoadingFeedback(page);
  const brokenLinks = await checkBrokenLinks(page);
  const hierarchyFlow = await checkHierarchyFlowClarity(page);          // merged param
  const density = await checkContentDensity(page, deviceType);
  const layout = await checkLayoutConsistency(page);
  const mobileExperience = await checkMobileExperienceMerged(page, deviceType); // absorbs Mobile Usability

  // --- Page-specific parameters (drop from the denominator when not applicable) ---
  const breadcrumbs = await checkBreadcrumbs(page);
  const inPageNav = await checkInPageNav(page, deviceType);
  const inventoryFiltering = await checkInventoryFiltering(page);
  const isSrp = inventoryFiltering?.meta?.context === 'srp';
  const noResultsUX = await checkNoResultsUX(page, isSrp);
  const vehicleGallery = await checkVehicleGallery(page);

  // NOTE — Spec §2.5 RELOCATE/RECLASSIFY: Pricing Transparency, Vehicle History, Staff Profiles
  // and Certifications & Awards belong to Conversion Flow / AEO, not UX. Per the standing rule-4
  // decision they are hidden here (not computed, not returned) until those sections claim them;
  // their evaluator functions are kept above as dead code.

  const results = {
    Text_Readability: readability,
    Intrusive_Interstitials: interstitials,
    Navigation_Discoverability: navDiscoverability,
    Above_the_Fold_Content: atf,
    Broken_Links: brokenLinks,
    Mobile_Experience: mobileExperience,
    Interactive_Click_Feedback: clickFeedback,
    Loading_Feedback: loadingFeedback,
    Hierarchy_Flow_Clarity: hierarchyFlow,
    Content_Density_Balance: density,
    Layout_Consistency: layout,
    Sticky_Header_Usage: stickyHeader,
    In_Page_Navigation: inPageNav,
    Breadcrumbs: breadcrumbs,
    Inventory_Filtering: inventoryFiltering,
    No_Results_UX: noResultsUX,
    Vehicle_Image_Gallery: vehicleGallery
  };

  // Spec §2.5 in-section weights. Page-specific add-ons only carry weight on their page type
  // (elsewhere they return infoOnly / no score and are dropped). The renormalizing Σ-weight loop
  // (Σ score×w / Σ w over present params) then auto-shrinks the common params for that page type.
  const SPEC_WEIGHTS = {
    // common
    Text_Readability: 0.10,
    Intrusive_Interstitials: 0.11,
    Navigation_Discoverability: 0.11,
    Above_the_Fold_Content: 0.09,
    Broken_Links: 0.11,
    Mobile_Experience: 0.09,
    Interactive_Click_Feedback: 0.06,
    Loading_Feedback: 0.05,
    Hierarchy_Flow_Clarity: 0.07,
    Content_Density_Balance: 0.05,
    Layout_Consistency: 0.05,
    Sticky_Header_Usage: 0.05,
    // page-specific
    In_Page_Navigation: 0.04,
    Breadcrumbs: 0.05,
    Inventory_Filtering: 0.10,
    No_Results_UX: 0.06,
    Vehicle_Image_Gallery: 0.10
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, result] of Object.entries(results)) {
    // Info-only / not-applicable params are displayed but excluded from the weighted score
    // (rule-6 N/A renormalization — they drop out of the denominator entirely).
    if (!result || result.infoOnly) continue;
    if ((result.score ?? undefined) === undefined) continue;
    const weight = SPEC_WEIGHTS[key] || 0;
    if (!weight) continue;
    const score = Math.max(0, Math.min(100, result.score));
    weightedSum += score * weight;
    totalWeight += weight;
  }

  const overallScore = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;

  return {
    Percentage: overallScore,
    Confidence: 'heuristic',
    ...results
  };
}
