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
    return {
      score: 100,
      status: 'pass',
      details: 'Breadcrumbs are not required on the homepage.',
      analysis: {
        cause: "The page is a root-level homepage.",
        recommendation: "Breadcrumbs are not necessary here. Maintain clearly visible primary navigation."
      },
      meta: { isHomepage: true }
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
    const searchSelectors = [
      'input[type="search"]', 'input[placeholder*="search" i]',
      '[role="search"]', 'button[class*="search" i]', '#search-btn', '.search-icon'
    ];
    const navSelectors = [
      'nav', '[role="navigation"]', '.nav', '.navigation', '.navbar',
      '.main-menu', '#main-menu', '.site-nav', '.header-nav',
      'ul[class*="menu"]', 'div[class*="menu"] > ul'
    ];

    let hamburgerFound = false;
    for (let sel of hamburgerSelectors) if (document.querySelector(sel)) { hamburgerFound = true; break; }

    let searchFound = false;
    for (let sel of searchSelectors) if (document.querySelector(sel)) { searchFound = true; break; }

    let navFound = false;
    for (let sel of navSelectors) if (document.querySelector(sel)) { navFound = true; break; }

    return {
      hamburger_present: hamburgerFound ? 1 : 0,
      search_present: searchFound ? 1 : 0,
      nav_menu_present: navFound ? 1 : 0
    };
  });

  const score = (navDiscoverability.hamburger_present * 30) + (navDiscoverability.search_present * 30) + (navDiscoverability.nav_menu_present * 40);
  const status = score === 100 ? 'pass' : (score >= 40 ? 'warning' : 'fail');

  let analysis = {
    cause: "Key navigation elements (Menu, Search) are clearly presence.",
    recommendation: "Maintain the visibility of these elements. Ensure search is easily accessible from any page."
  };

  if (status === 'fail') {
    analysis = {
      cause: "Multiple essential navigation controls are missing or hidden.",
      recommendation: "Ensure that at least a primary navigation menu and a search bar are easily discoverable for all users."
    };
  } else if (status === 'warning') {
    analysis = {
      cause: "One or more useful navigation elements (like search) are missing.",
      recommendation: "Consider adding a search bar or a more visible hamburger menu to improve content discoverability."
    };
  }

  return {
    score,
    status: status,
    details: `Found: ${navDiscoverability.nav_menu_present ? 'Navigation Menu' : 'No Menu'}, ${navDiscoverability.hamburger_present ? 'Menu Icon' : 'No Icon'}, ${navDiscoverability.search_present ? 'Search Bar' : 'No Search'}.`,
    analysis: analysis,
    meta: {
      hasHamburger: !!navDiscoverability.hamburger_present,
      hasSearch: !!navDiscoverability.search_present,
      hasNavMenu: !!navDiscoverability.nav_menu_present
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
      brokenLinks: brokenLinks.slice(0, 20),
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

  let status = 'pass';
  if (navData.hasLongPage && navData.anchorLinks === 0 && !navData.backToTop) status = 'warning';
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

export default async function evaluateMobileUX(device, page) {
  const deviceType = device === 'Mobile' ? 'mobile' : 'desktop';

  const readability = await checkReadability(page);
  const stickyHeader = await checkStickyHeader(page, deviceType);
  const interstitials = await checkInterstitials(page, deviceType);
  const breadcrumbs = await checkBreadcrumbs(page);
  const navDiscoverability = await checkNavDiscoverability(page);
  const atf = await checkATF(page);
  const clickFeedback = await checkClickFeedback(page, deviceType);
  const loadingFeedback = await checkLoadingFeedback(page);
  const brokenLinks = await checkBrokenLinks(page);
  const hierarchy = await checkHierarchyClarity(page);
  const labeling = await checkSectionLabeling(page);
  const density = await checkContentDensity(page, deviceType);
  const flow = await checkPageFlow(page);
  const layout = await checkLayoutConsistency(page);
  const inPageNav = await checkInPageNav(page, deviceType);

  const results = {
    Text_Readability: readability,
    Sticky_Header_Usage: stickyHeader,
    Intrusive_Interstitials: interstitials,
    Breadcrumbs: breadcrumbs,
    Navigation_Discoverability: navDiscoverability,
    Above_the_Fold_Content: atf,
    Interactive_Click_Feedback: clickFeedback,
    Loading_Feedback: loadingFeedback,
    Broken_Links: brokenLinks,
    UX_Content_Hierarchy_Clarity: hierarchy,
    Section_Labeling_Clarity: labeling,
    Content_Density_Balance: density,
    Page_to_Page_Flow: flow,
    Layout_Consistency: layout,
    In_Page_Navigation: inPageNav
  };

  let weightedSum = 0;
  let totalPossibleWeight = 0;

  const weights = {
    Text_Readability: 2,
    Sticky_Header_Usage: 1,
    Intrusive_Interstitials: 3,
    Breadcrumbs: 1,
    Navigation_Discoverability: 3,
    Above_the_Fold_Content: 3,
    Interactive_Click_Feedback: 2,
    Loading_Feedback: 2,
    Broken_Links: 3,
    UX_Content_Hierarchy_Clarity: 3,
    Section_Labeling_Clarity: 2,
    Content_Density_Balance: 2,
    Page_to_Page_Flow: 2,
    Layout_Consistency: 1,
    In_Page_Navigation: 1
  };

  for (const [key, result] of Object.entries(results)) {
    const weight = weights[key] || 1;
    const score = result ? Math.max(0, Math.min(100, result.score || 0)) : 0;

    weightedSum += (score * weight);
    totalPossibleWeight += (100 * weight);
  }

  const overallScore = totalPossibleWeight > 0 ? Math.round((weightedSum / totalPossibleWeight) * 100) : 0;

  return {
    Percentage: overallScore,
    ...results
  };
}
