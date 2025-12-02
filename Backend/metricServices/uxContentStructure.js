import SiteReport from "../models/SiteReport.js";

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

// ----------------------------------------------------------------------------
// 1. Readability
// ----------------------------------------------------------------------------
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
    const wordCount = bodyText.split(/\s+/).length;

    // 6. Combined Rule (Scoring Logic)
    if (isProductUrl || schemaType === 'Product' || hasBuyCTA || hasAddToCart) {
      return 'Product Page';
    }
    if (isBlogUrl || schemaType === 'Article' || (hasArticleTag && wordCount > 500)) {
      return 'Article/Blog';
    }
    if (wordCount > 500) return 'Article/Blog';
    if (wordCount < 300 && (hasPrice || hasBuyCTA)) return 'Product Page';

    return 'Article/Blog'; // Default safe fallback
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
  const passed = overallFleschScore >= readabilityMin && overallFleschScore <= (readabilityMax + tolerance);

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
    status: passed ? 'pass' : 'fail',
    details: `Type: ${pageType}. Score: ${overallFleschScore.toFixed(2)}. Target: ${readabilityMin}-${readabilityMax} (allowed +${tolerance}).`,
    meta: {
      pageType: pageType,
      targetMin: readabilityMin,
      targetMax: readabilityMax,
      problematicContent: problematicContent.slice(0, 5),
      overallStats: overallStats
    }
  };
}

// ----------------------------------------------------------------------------
// 2. CLS
// ----------------------------------------------------------------------------
async function checkCLS(page, deviceType) {
  const cls = await page.evaluate(() => {
    return new Promise((resolve) => {
      let cumulativeLayoutShift = 0;
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) cumulativeLayoutShift += entry.value;
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        setTimeout(() => resolve(cumulativeLayoutShift), 1000);
      } catch (e) { resolve(0); }
    });
  });

  const clsLimit = deviceType === 'mobile' ? 0.15 : 0.10;
  return {
    score: cls,
    status: cls <= clsLimit ? 'pass' : 'fail',
    details: `CLS is ${cls.toFixed(4)}. Limit is ${clsLimit}.`
  };
}

// ----------------------------------------------------------------------------
// 3. Tap Targets
// ----------------------------------------------------------------------------
async function checkTapTargets(page, deviceType) {
  const tapTargetsData = await page.evaluate((deviceType) => {
    const minSize = deviceType === 'mobile' ? 44 : 24;
    const clickableElements = Array.from(document.querySelectorAll('a, button, input, select, textarea, [role="button"]'));
    const total = clickableElements.length;
    const issues = [];
    clickableElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        if (rect.width < minSize || rect.height < minSize) {
          issues.push({
            tag: el.tagName,
            text: el.innerText ? el.innerText.substring(0, 20) : el.id || el.className,
            width: rect.width,
            height: rect.height
          });
        }
      }
    });
    return { total, issues };
  }, deviceType);

  const tapScore = tapTargetsData.total > 0
    ? Math.round(((tapTargetsData.total - tapTargetsData.issues.length) / tapTargetsData.total) * 100)
    : 100;

  return {
    score: tapScore,
    status: tapScore >= 90 ? 'pass' : 'fail',
    details: `${tapTargetsData.issues.length} tap targets are too small.`,
    meta: {
      total: tapTargetsData.total,
      passed: tapTargetsData.total - tapTargetsData.issues.length,
      failed: tapTargetsData.issues.length,
      smallTargets: tapTargetsData.issues
    }
  };
}

// ----------------------------------------------------------------------------
// 4. Text Size
// ----------------------------------------------------------------------------
async function checkTextSize(page, deviceType) {
  const textSizeData = await page.evaluate((deviceType) => {
    const minSize = deviceType === 'mobile' ? 16 : 14;
    const textElements = Array.from(document.querySelectorAll('p, span, div, li, a, h1, h2, h3, h4, h5, h6'));
    const validElements = textElements.filter(el => {
      return Array.from(el.childNodes).some(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0);
    });
    const issues = [];
    validElements.forEach(el => {
      const style = window.getComputedStyle(el);
      const fontSize = parseFloat(style.fontSize);
      if (fontSize < minSize) {
        issues.push({
          tag: el.tagName,
          text: el.innerText ? el.innerText.substring(0, 20) : '',
          size: style.fontSize,
          fontSize: fontSize
        });
      }
    });
    return { total: validElements.length, issues: issues.slice(0, 20) };
  }, deviceType);

  const textScore = textSizeData.total > 0
    ? Math.round(((textSizeData.total - textSizeData.issues.length) / textSizeData.total) * 100)
    : 100;

  return {
    score: textScore,
    status: textScore >= 90 ? 'pass' : 'fail',
    details: `${textSizeData.issues.length} elements have small font size.`,
    meta: {
      total: textSizeData.total,
      passed: textSizeData.total - textSizeData.issues.length,
      failed: textSizeData.issues.length,
      smallFonts: textSizeData.issues
    }
  };
}

// ----------------------------------------------------------------------------
// 5. Viewport
// ----------------------------------------------------------------------------
async function checkViewport(page, deviceType) {
  if (deviceType !== 'mobile') return { score: 100, status: 'pass', details: 'Not required for desktop.' };

  const viewportMeta = await page.$('meta[name="viewport"]');
  if (viewportMeta) {
    const content = await page.evaluate(el => el.getAttribute('content'), viewportMeta);
    if (content.includes('width=device-width') && content.includes('initial-scale=1')) {
      return { score: 100, status: 'pass', details: 'Viewport meta tag is correct.' };
    }
    return { score: 0, status: 'fail', details: `Viewport content incorrect: ${content}` };
  }
  return { score: 0, status: 'fail', details: 'Viewport meta tag missing.' };
}

// ----------------------------------------------------------------------------
// 6. Horizontal Scroll
// ----------------------------------------------------------------------------
async function checkHorizontalScroll(page, deviceType) {
  const hasHorizontalScroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  let scrollIssues = [];
  if (deviceType === 'mobile') {
    const breakpoints = [320, 375, 414, 480];
    for (const width of breakpoints) {
      await page.setViewport({ width, height: 800, isMobile: true });
      const scroll = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      if (scroll) scrollIssues.push(`${width}px`);
    }
    await page.setViewport({ width: 375, height: 812, isMobile: true });
  }

  if (hasHorizontalScroll || scrollIssues.length > 0) {
    return {
      score: 0,
      status: 'fail',
      details: `Horizontal scroll detected at: ${hasHorizontalScroll ? 'Current Viewport' : ''} ${scrollIssues.join(', ')}`
    };
  }
  return {
    score: 100,
    status: 'pass',
    details: 'No horizontal scroll detected.'
  };
}

// ----------------------------------------------------------------------------
// 7. Sticky Header
// ----------------------------------------------------------------------------
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
    return { status: maxH <= maxLimit ? 'pass' : 'fail', height: maxH, limit: maxLimit };
  }, deviceType);

  return {
    score: headerCheck.status === 'pass' ? 100 : 0,
    status: headerCheck.status,
    details: `Sticky header height: ${headerCheck.height}px. Limit: ${headerCheck.limit}px.`
  };
}

// ----------------------------------------------------------------------------
// 8. Navigation Depth
// ----------------------------------------------------------------------------
async function checkNavigationDepth(page) {
  const navDepth = await page.evaluate(() => {
    const navElements = Array.from(document.querySelectorAll('nav, header, [role="navigation"]'));
    let links = [];
    if (navElements.length > 0) {
      navElements.forEach(nav => links = links.concat(Array.from(nav.querySelectorAll('a[href]'))));
    } else {
      links = Array.from(document.querySelectorAll('a[href]'));
    }

    const internalLinks = links.filter(l => l.hostname === window.location.hostname);
    if (internalLinks.length === 0) return { score: 100, details: 'No internal navigation links found.', links: [] };

    let shallow = 0;
    const linkDetails = [];
    internalLinks.forEach(l => {
      const depth = l.pathname.replace(/^\/|\/$/g, '').split('/').filter(s => s.length > 0).length;
      if (depth <= 3) shallow++;
      if (linkDetails.length < 20) linkDetails.push({ text: l.innerText.substring(0, 30) || 'No Text', href: l.pathname, depth });
    });
    const percentage = (shallow / internalLinks.length) * 100;
    return {
      score: percentage,
      details: `${shallow} out of ${internalLinks.length} navigation links are ≤3 clicks deep.`,
      links: linkDetails
    };
  });

  return {
    score: Math.round(navDepth.score),
    status: navDepth.score >= 80 ? 'pass' : 'fail',
    details: navDepth.details,
    meta: { deepLinks: navDepth.links }
  };
}

// ----------------------------------------------------------------------------
// 9. Intrusive Interstitials
// ----------------------------------------------------------------------------
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
        return style.position === "fixed" && rect.width >= 300 && rect.height >= 250 && parseInt(style.zIndex) > 999;
      });
    }

    const hasOverlay = detectOverlay();
    const hasScrollBlock = detectScrollBlock();
    const hasModal = detectModal();
    let details = [];
    if (hasOverlay) details.push("Full-screen overlay detected");
    if (hasScrollBlock) details.push("Scroll blocking detected");
    if (hasModal) details.push("Intrusive modal detected");

    const prefix = deviceType === 'mobile' ? 'Mobile View' : 'Desktop View';
    return {
      status: (hasOverlay || hasScrollBlock || hasModal) ? 'fail' : 'pass',
      details: details.length > 0 ? `${prefix}: ${details.join(", ")}` : `${prefix}: No intrusive interstitials found.`
    };
  }, deviceType);

  return {
    score: interstitialCheck.status === 'pass' ? 100 : 0,
    status: interstitialCheck.status,
    details: interstitialCheck.details
  };
}

// ----------------------------------------------------------------------------
// 10. Image Stability
// ----------------------------------------------------------------------------
async function checkImageStability(page) {
  const imageStability = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const issues = [];
    images.forEach(img => {
      const hasWidth = img.hasAttribute('width');
      const hasHeight = img.hasAttribute('height');
      const style = window.getComputedStyle(img);
      const hasAspectRatio = style.aspectRatio !== 'auto';
      if (!((hasWidth && hasHeight) || hasAspectRatio)) {
        issues.push({ src: img.src || 'No Source', details: 'Missing explicit width/height or aspect-ratio' });
      }
    });
    return { total: images.length, issues: issues.slice(0, 10) };
  });

  const score = imageStability.total > 0 ? Math.round(((imageStability.total - imageStability.issues.length) / imageStability.total) * 100) : 100;
  return {
    score,
    status: score >= 90 ? 'pass' : 'fail',
    details: `${imageStability.issues.length} unstable images found.`,
    meta: {
      total: imageStability.total,
      passed: imageStability.total - imageStability.issues.length,
      failed: imageStability.issues.length,
      unstableImages: imageStability.issues
    }
  };
}

// ----------------------------------------------------------------------------
// 11. Breadcrumbs
// ----------------------------------------------------------------------------
async function checkBreadcrumbs(page) {
  const hasBreadcrumbs = await page.evaluate(() => {
    return !!document.querySelector('nav[aria-label="breadcrumb"], .breadcrumb') ||
      !!document.querySelector('script[type="application/ld+json"]')?.innerText.includes('BreadcrumbList');
  });
  return {
    score: hasBreadcrumbs ? 100 : 0,
    status: hasBreadcrumbs ? 'pass' : 'fail',
    details: hasBreadcrumbs ? 'Breadcrumbs detected.' : 'No breadcrumbs found.'
  };
}

// ----------------------------------------------------------------------------
// 12. Navigation Discoverability
// ----------------------------------------------------------------------------
async function checkNavDiscoverability(page) {
  const navDiscoverability = await page.evaluate(() => {
    const hamburgerSelectors = ['.hamburger', '.hamburger-menu', '.menu-icon', '.nav-toggle', 'button[aria-label*="menu"]', '[aria-controls="mobile-menu"]'];
    const searchSelectors = ['input[type="search"]', 'input[placeholder*="search" i]', '[role="search"]', 'button[class*="search" i]'];

    let hamburgerFound = false;
    for (let sel of hamburgerSelectors) if (document.querySelector(sel)) { hamburgerFound = true; break; }

    let searchFound = false;
    for (let sel of searchSelectors) if (document.querySelector(sel)) { searchFound = true; break; }

    return { hamburger_present: hamburgerFound ? 1 : 0, search_present: searchFound ? 1 : 0 };
  });

  const score = (navDiscoverability.hamburger_present * 50) + (navDiscoverability.search_present * 50);
  return {
    score,
    status: score === 100 ? 'pass' : (score >= 50 ? 'warning' : 'fail'),
    details: `Hamburger: ${navDiscoverability.hamburger_present ? 'Yes' : 'No'}, Search: ${navDiscoverability.search_present ? 'Yes' : 'No'}`,
    meta: { hasHamburger: !!navDiscoverability.hamburger_present, hasSearch: !!navDiscoverability.search_present }
  };
}

// ----------------------------------------------------------------------------
// 13. ATF Content
// ----------------------------------------------------------------------------
async function checkATF(page) {
  const atfData = await page.evaluate(() => {
    const viewportHeight = window.innerHeight;
    function isVisible(el) {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return false;
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < window.innerHeight;
    }
    function isImportant(el) {
      const tag = el.tagName;
      if (["H1", "H2", "H3", "IMG", "VIDEO", "BUTTON", "INPUT", "A", "NAV"].includes(tag)) return true;
      if ((tag === "P" || tag === "SPAN" || tag === "DIV") && el.innerText.trim().length > 20) return true;
      return el.getBoundingClientRect().height > window.innerHeight * 0.2;
    }
    function getWeight(el) {
      const WEIGHTS = { H1: 5, H2: 4, IMG: 3, VIDEO: 3, P: 2, BUTTON: 2, A: 1, INPUT: 3, NAV: 2, DEFAULT: 1 };
      return WEIGHTS[el.tagName] || WEIGHTS.DEFAULT;
    }

    const allVisible = [...document.body.querySelectorAll("*")].filter(isVisible);
    const importantElements = allVisible.filter(isImportant);
    const importantAboveFold = importantElements.filter(el => el.getBoundingClientRect().top < window.innerHeight);

    const totalWeight = importantElements.reduce((sum, el) => sum + getWeight(el), 0);
    const weightAboveFold = importantAboveFold.reduce((sum, el) => sum + getWeight(el), 0);
    const weightedATF = totalWeight > 0 ? Math.round((weightAboveFold / totalWeight) * 100) : 0;

    const visibleElementDetails = importantAboveFold.slice(0, 50).map(el => {
      let text = el.innerText ? el.innerText.trim().substring(0, 50) : '';
      if (el.tagName === 'IMG') text = el.src ? el.src.split('/').pop() : 'Image';
      if (!text) text = `[${el.tagName}]`;
      return { tag: el.tagName, text: text, top: Math.round(el.getBoundingClientRect().top), weight: getWeight(el) };
    });

    return { viewportHeight, importantVisible: importantAboveFold.length, totalImportant: importantElements.length, atfScore: weightedATF, elements: visibleElementDetails };
  });

  return {
    score: atfData.atfScore,
    status: atfData.atfScore >= 50 ? 'pass' : (atfData.atfScore >= 20 ? 'warning' : 'fail'),
    details: `Weighted ATF Score: ${atfData.atfScore}%. ${atfData.importantVisible} important elements visible out of ${atfData.totalImportant} total important elements.`,
    meta: atfData
  };
}

// ----------------------------------------------------------------------------
// 14. Click Feedback
// ----------------------------------------------------------------------------
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
      return {
        tag: el.tagName,
        text: el.innerText ? el.innerText.trim().slice(0, 100) : '',
        feedback: { hoverChanged, activeChanged, hasFeedback: hoverChanged || activeChanged }
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

  return {
    score: feedbackScore,
    status: feedbackScore >= 80 ? 'pass' : (feedbackScore >= 50 ? 'warning' : 'fail'),
    details: `Interactive Elements: ${clickFeedbackData.totalInteractive}. Feedback detected: ${deviceType === 'mobile' ? clickFeedbackData.withActive : clickFeedbackData.withHover}.`,
    meta: { missingPointerCursor: clickFeedbackData.totalInteractive - (deviceType === 'mobile' ? clickFeedbackData.withActive : clickFeedbackData.withHover), ...clickFeedbackData }
  };
}

// ----------------------------------------------------------------------------
// 15. Form Validation
// ----------------------------------------------------------------------------
async function checkFormValidation(page) {
  const formValidationData = await page.evaluate(() => {
    function getAssociatedLabel(input) {
      if (input.id && document.querySelector(`label[for="${input.id}"]`)) return document.querySelector(`label[for="${input.id}"]`).innerText.trim();
      if (input.closest('label')) return input.closest('label').innerText.trim();
      if (input.getAttribute("aria-label")) return input.getAttribute("aria-label").trim();
      if (input.getAttribute("aria-labelledby") && document.getElementById(input.getAttribute("aria-labelledby"))) return document.getElementById(input.getAttribute("aria-labelledby")).innerText.trim();
      return null;
    }
    function getErrorMessage(input) {
      const selectors = [".error", ".error-message", ".invalid", ".form-error", "[aria-live]", "[role='alert']", ".text-danger", ".text-red-500"];
      const form = input.closest("form") || document;
      for (const selector of selectors) {
        const err = form.querySelector(selector);
        if (err && err.innerText.trim().length > 0) return err.innerText.trim();
      }
      return null;
    }

    const inputs = [...document.querySelectorAll("input:not([type='hidden']), textarea, select")].filter(el => el.style.display !== 'none');
    const results = inputs.map(input => {
      const label = getAssociatedLabel(input);
      const error = getErrorMessage(input);
      return {
        tag: input.tagName,
        hasLabel: !!label,
        hasErrorMessage: !!error,
        labelText: label ? label.substring(0, 50) : null
      };
    });

    return {
      totalInputs: results.length,
      withLabels: results.filter(r => r.hasLabel).length,
      missingLabels: results.filter(r => !r.hasLabel).map(r => r.tag), // For frontend compatibility
      inputs: results
    };
  });

  const formScore = formValidationData.totalInputs > 0 ? Math.round((formValidationData.withLabels / formValidationData.totalInputs) * 100) : 100;
  return {
    score: formScore,
    status: formScore >= 90 ? 'pass' : (formScore >= 50 ? 'warning' : 'fail'),
    details: `Found ${formValidationData.totalInputs} inputs. ${formValidationData.withLabels} have valid labels.`,
    meta: formValidationData
  };
}

// ----------------------------------------------------------------------------
// 16. Loading Feedback
// ----------------------------------------------------------------------------
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
      summary: { spinners: spinners.length, skeletons: skeletons.length, loadingText: textLoading.length }
    };
  });

  const loadingScore = loadingFeedbackData.hasLoadingFeedback ? 100 : 0;
  return {
    score: loadingScore,
    status: loadingScore === 100 ? 'pass' : 'fail',
    details: loadingFeedbackData.hasLoadingFeedback ? `Detected ${loadingFeedbackData.summary.spinners} spinners, ${loadingFeedbackData.summary.skeletons} skeletons.` : 'No standard loading indicators detected.',
    meta: loadingFeedbackData
  };
}


// ----------------------------------------------------------------------------
// Main Execution Function
// ----------------------------------------------------------------------------
export default async function evaluateMobileUX(url, device, selectedMetric, $, page, auditId) {
  const deviceType = device === 'Mobile' ? 'mobile' : 'desktop';

  // Execute all checks independently
  const results = {
    readability: await checkReadability(page),
    cls: await checkCLS(page, deviceType),
    tapTargets: await checkTapTargets(page, deviceType),
    textSize: await checkTextSize(page, deviceType),
    viewport: await checkViewport(page, deviceType),
    horizontalScroll: await checkHorizontalScroll(page, deviceType),
    stickyHeader: await checkStickyHeader(page, deviceType),
    navigationDepth: await checkNavigationDepth(page),
    interstitials: await checkInterstitials(page, deviceType),
    imageStability: await checkImageStability(page),
    breadcrumbs: await checkBreadcrumbs(page),
    navDiscoverability: await checkNavDiscoverability(page),
    atf: await checkATF(page),
    clickFeedback: await checkClickFeedback(page, deviceType),
    formValidation: await checkFormValidation(page),
    loadingFeedback: await checkLoadingFeedback(page)
  };

  // Calculate Overall Score
  let totalScore = 0;
  let maxScore = 0;
  const weights = {
    cls: 2, tapTargets: 3, textSize: 3, viewport: 3, horizontalScroll: 3, stickyHeader: 1,
    readability: 2, navigationDepth: 2, interstitials: 3, imageStability: 2,
    breadcrumbs: 1, navDiscoverability: 2, atf: 3, clickFeedback: 2, formValidation: 3, loadingFeedback: 2
  };

  // Helper to normalize scores for calculation
  const getScore = (key, res) => {
    if (key === 'cls') {
      // Special handling for CLS value
      const val = res.score;
      if (val > 0.25) return 0;
      if (val > 0.1) return 50 + ((0.25 - val) / 0.15) * 40;
      return 90 + ((0.1 - val) / 0.1) * 10;
    }
    return Math.max(0, Math.min(100, res.score));
  };

  for (const key in results) {
    const weight = weights[key] || 1;
    const score = getScore(key, results[key]);
    totalScore += score * weight;
    maxScore += 100 * weight;
  }

  const overallScore = Math.round((totalScore / maxScore) * 100);

  await SiteReport.findByIdAndUpdate(auditId, {
    UX_or_Content_Structure: {
      Percentage: overallScore,
      Text_Readability: {
        Score: parseFloat(results.readability.score.toFixed(0)),
        Status: results.readability.status,
        Details: results.readability.details,
        Meta: results.readability.meta
      },
      Cumulative_Layout_Shift: {
        Score: parseFloat(results.cls.score.toFixed(0)),
        Status: results.cls.status,
        Details: results.cls.details,
        Meta: results.cls.meta
      },
      Tap_Target_Size: {
        Score: results.tapTargets.score,
        Status: results.tapTargets.status,
        Details: results.tapTargets.details,
        Meta: results.tapTargets.meta
      },
      Text_Font_Size: {
        Score: results.textSize.score,
        Status: results.textSize.status,
        Details: results.textSize.details,
        Meta: results.textSize.meta
      },
      Viewport_Meta_Tag: {
        Score: results.viewport.score,
        Status: results.viewport.status,
        Details: results.viewport.details,
        Meta: results.viewport.meta
      },
      Horizontal_Scroll: {
        Score: results.horizontalScroll.score,
        Status: results.horizontalScroll.status,
        Details: results.horizontalScroll.details,
        Meta: results.horizontalScroll.meta
      },
      Sticky_Header_Height: {
        Score: results.stickyHeader.score,
        Status: results.stickyHeader.status,
        Details: results.stickyHeader.details,
        Meta: results.stickyHeader.meta
      },
      Navigation_Depth: {
        Score: results.navigationDepth.score,
        Status: results.navigationDepth.status,
        Details: results.navigationDepth.details,
        Meta: results.navigationDepth.meta
      },
      Intrusive_Interstitials: {
        Score: results.interstitials.score,
        Status: results.interstitials.status,
        Details: results.interstitials.details,
        Meta: results.interstitials.meta
      },
      Image_Stability: {
        Score: results.imageStability.score,
        Status: results.imageStability.status,
        Details: results.imageStability.details,
        Meta: results.imageStability.meta
      },
      Breadcrumbs: {
        Score: results.breadcrumbs.score,
        Status: results.breadcrumbs.status,
        Details: results.breadcrumbs.details,
        Meta: results.breadcrumbs.meta
      },
      Navigation_Discoverability: {
        Score: results.navDiscoverability.score,
        Status: results.navDiscoverability.status,
        Details: results.navDiscoverability.details,
        Meta: results.navDiscoverability.meta
      },
      Above_The_Fold_Content: {
        Score: results.atf.score,
        Status: results.atf.status,
        Details: results.atf.details,
        Meta: results.atf.meta
      },
      Click_Feedback: {
        Score: results.clickFeedback.score,
        Status: results.clickFeedback.status,
        Details: results.clickFeedback.details,
        Meta: results.clickFeedback.meta
      },
      Form_Validation: {
        Score: results.formValidation.score,
        Status: results.formValidation.status,
        Details: results.formValidation.details,
        Meta: results.formValidation.meta
      },
      Loading_Feedback: {
        Score: results.loadingFeedback.score,
        Status: results.loadingFeedback.status,
        Details: results.loadingFeedback.details,
        Meta: results.loadingFeedback.meta
      }
    }
  });

  return overallScore;
}
