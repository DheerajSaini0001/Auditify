import SiteReport from "../models/SiteReport.js";

// UX & Content Structure (Navigation & Layout)
function checkNavigationClarity($) {
    const nav = $('nav'); // select main nav
    if (nav.length === 0) return 0; // no navigation → 0

    const menuItems = nav.find('li, a'); // get all menu items
    if (menuItems.length === 0) return 0; // empty menu → 0

    // Check if each menu item has text and is unique
    const texts = [];
    menuItems.each((i, el) => {
        const text = $(el).text().trim();
        if (text) texts.push(text);
    });

    const uniqueTexts = new Set(texts);
    if (uniqueTexts.size !== texts.length) return 0; // repeated items → 0
    if (texts.length !== menuItems.length) return 0; // some empty → 0

    return 1; // menus exist, labeled, unique → 1
}

function checkBreadcrumbs($) {
    // Try to find typical breadcrumb containers
    const breadcrumbSelectors = [
        '.breadcrumb',      // common class
        'nav[aria-label="breadcrumb"]', // accessibility-friendly
        '.breadcrumbs',     // alternative class
        'ol.breadcrumb',    // ordered list breadcrumbs
        'ul.breadcrumb'     // unordered list breadcrumbs
    ];

    let breadcrumbFound = false;

    for (const selector of breadcrumbSelectors) {
        const breadcrumbs = $(selector);
        if (breadcrumbs.length > 0) {
            // Check if it has at least one visible item with text
            const items = breadcrumbs.find('li, a, span');
            const hasTextItem = items.toArray().some(el => $(el).text().trim() !== '');
            if (hasTextItem) {
                breadcrumbFound = true;
                break;
            }
        }
    }

    return breadcrumbFound ? 1 : 0;
}

function Domain(urlString) {
  const u = new URL(urlString);
  let host = u.hostname;
  if (host.startsWith("www.")) host = host.slice(4);
  return host;
}

function checkClickableLogo($, baseDomain) {
    // Find common logo selectors
    const logoSelectors = [
        'a.logo',
        'a.site-logo',
        'a[href]',
        'header a img',
        '.navbar-brand',
        'a[aria-label*="logo" i]',
        'a img[alt*="logo" i]'
    ];

    let foundClickableLogo = false;

    for (const selector of logoSelectors) {
        const logoLink = $(selector).first();

        if (logoLink.length > 0) {
            // If it's an <a> tag wrapping an <img> or text
            const href = logoLink.attr('href');

            if (href) {
                // Normalize the href and compare with baseDomain or home path
                if (
                    href === '/' ||
                    href === './' ||
                    href === '#' ||
                    href.includes(baseDomain)
                ) {
                    foundClickableLogo = true;
                    break;
                }
            }
        }
    }

    return foundClickableLogo ? 1 : 0;
}

function checkMobileResponsiveness($) {
    // 1. Check for viewport meta tag
    const viewport = $('meta[name="viewport"]').attr('content');
    const hasViewport = viewport && viewport.includes('width=device-width');

    // 2. Check if CSS includes media queries
    const hasMediaQueries = $('style, link[rel="stylesheet"]').toArray().some(el => {
        const elTag = $(el).prop('tagName').toLowerCase();
        if (elTag === 'style') {
            return $(el).html().includes('@media');
        } else if (elTag === 'link') {
            // basic pattern for responsive stylesheets
            const href = $(el).attr('href') || '';
            return href.toLowerCase().includes('responsive') || href.toLowerCase().includes('mobile');
        }
        return false;
    });

    return hasViewport && hasMediaQueries ? 1 : 0;
}

// UX & Content Structure (Readability & Visual Layout)
function checkFontStyleAndSizeConsistency($) {
    // Collect all inline font styles (for <p>, <h1>-<h6>, <span>, <div>)
    const elements = $('p, h1, h2, h3, h4, h5, h6, span, div');

    if (elements.length === 0) return 0; // no text elements → 0

    const fontFamilies = [];
    const fontSizes = [];

    elements.each((i, el) => {
        const style = ($(el).attr('style') || '').toLowerCase();

        // extract font-family
        const familyMatch = style.match(/font-family\s*:\s*([^;]+)/);
        if (familyMatch) fontFamilies.push(familyMatch[1].trim());

        // extract font-size
        const sizeMatch = style.match(/font-size\s*:\s*([\d.]+)(px|em|rem|pt)?/);
        if (sizeMatch) fontSizes.push(parseFloat(sizeMatch[1]));
    });

    // If no font info found, assume consistent (likely defined in CSS)
    if (fontFamilies.length === 0 && fontSizes.length === 0) return 1;

    // Check font-family consistency
    const uniqueFamilies = new Set(fontFamilies);
    const consistentFamily = uniqueFamilies.size <= 2; // small variations allowed

    // Check font-size consistency
    if (fontSizes.length === 0) return consistentFamily ? 1 : 0;
    const avgSize = fontSizes.reduce((a, b) => a + b, 0) / fontSizes.length;
    const inconsistentCount = fontSizes.filter(size => Math.abs(size - avgSize) > 2).length;
    const consistentSize = inconsistentCount / fontSizes.length <= 0.2;

    return consistentFamily && consistentSize ? 1 : 0;
}

function checkWhitespaceUsage($) {
  const elements = $('div, section, article, p, h1, h2, h3, h4, h5, h6');
  if (elements.length === 0) return 0;

  let spacedCount = 0;
  let totalChecked = 0;

  elements.each((i, el) => {
    const style = ($(el).attr('style') || '').toLowerCase();

    // Extract inline margin/padding if available
    const marginMatch = style.match(/margin\s*:\s*([0-9]+)px/);
    const paddingMatch = style.match(/padding\s*:\s*([0-9]+)px/);

    const margin = marginMatch ? parseInt(marginMatch[1]) : 0;
    const padding = paddingMatch ? parseInt(paddingMatch[1]) : 0;

    // if either margin or padding ≥ 8px, consider it well spaced
    if (margin >= 8 || padding >= 8) spacedCount++;
    totalChecked++;
  });

  const ratio = spacedCount / totalChecked;
  return ratio >= 0.6 ? 1 : 0; // Pass if 60% of blocks have enough space
}

function checkParagraphLengthAndSpacing($) {
    const paragraphs = $('p');
    if (paragraphs.length === 0) return 0; // no paragraphs → 0

    let totalWords = 0;
    let tooLongCount = 0;

    paragraphs.each((i, el) => {
        const text = $(el).text().trim();
        const wordCount = text.split(/\s+/).length;

        totalWords += wordCount;
        if (wordCount > 120) tooLongCount++; // paragraph too long
    });

    const avgWords = totalWords / paragraphs.length;

    // Rule of thumb:
    // ✅ Ideal paragraph length: 40–120 words
    // ❌ If avg > 120 or >30% of paragraphs too long → 0
    if (avgWords <= 120 && tooLongCount / paragraphs.length <= 0.3) {
        return 1; // good readability
    } else {
        return 0; // too long paragraphs
    }
}

function getLuminance(color) {
    if (!color) return 1; // default white
    let r, g, b;

    if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
    } else if (color.startsWith('rgb')) {
        const nums = color.match(/\d+/g).map(Number);
        [r, g, b] = nums;
    } else {
        // unknown or named color → assume readable
        return 1;
    }

    [r, g, b] = [r, g, b].map(v => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastRatio(fg, bg) {
    const L1 = getLuminance(fg);
    const L2 = getLuminance(bg);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
}

function checkContrastAndColorHarmony($) {
    const elements = $('p, span, div, h1, h2, h3, h4, h5, h6');
    if (elements.length === 0) return 0;

    let lowContrastCount = 0;
    let totalChecked = 0;

    elements.each((i, el) => {
        const style = ($(el).attr('style') || '').toLowerCase();
        const colorMatch = style.match(/color\s*:\s*([^;]+)/);
        const bgMatch = style.match(/background(-color)?\s*:\s*([^;]+)/);

        const fg = colorMatch ? colorMatch[1].trim() : '#000000';
        const bg = bgMatch ? bgMatch[2].trim() : '#ffffff';

        const ratio = contrastRatio(fg, bg);
        totalChecked++;

        if (ratio < 4.5) lowContrastCount++;
    });

    // Pass condition: at least 80% elements have acceptable contrast
    const acceptable = (lowContrastCount / totalChecked) <= 0.2;
    return acceptable ? 1 : 0;
}

// UX & Content Structure (Content & Engagement Flow)
function checkContentRelevance($) {
    // 1️⃣ Get page title
    const title = $('title').text().trim().toLowerCase();
    if (!title) return 0;

    // 2️⃣ Get main page content text
    const content = $('p, li, h1, h2, h3').text().trim().toLowerCase();
    if (!content) return 0;

    // 3️⃣ Split title into keywords
    const titleWords = title.split(/\s+/).filter(w => w.length > 2); // ignore small words

    // 4️⃣ Count how many title words appear in content
    let matchCount = 0;
    titleWords.forEach(word => {
        if (content.includes(word)) matchCount++;
    });

    // 5️⃣ Compute ratio
    const relevanceRatio = titleWords.length > 0 ? matchCount / titleWords.length : 0;

    // 6️⃣ Threshold: ≥50% title words appear in content → relevant
    return relevanceRatio >= 0.5 ? 1 : 0;
}

function checkCallToActionClarity($) {
    // Find common CTA elements
    const ctas = $('button, a, input[type="button"], input[type="submit"]');
    if (ctas.length === 0) return 0; // no CTA → 0

    let validCTA = 0;

    ctas.each((i, el) => {
        let text = '';
        const tag = el.tagName.toLowerCase();

        if (tag === 'button' || tag === 'a') {
            text = $(el).text().trim();
        } else if (tag === 'input') {
            text = $(el).attr('value') ? $(el).attr('value').trim() : '';
        }

        // Consider it purposeful if text length ≥3 (not empty/generic)
        if (text.length >= 3) validCTA++;
    });

    // Pass if at least 1 visible, labeled CTA exists
    return validCTA >= 1 ? 1 : 0;
}

function checkMultimediaBalance($) {
    const textElements = $('p, h1, h2, h3, h4, h5, h6, li');
    const mediaElements = $('img, video, iframe');

    const textCount = textElements.length;
    const mediaCount = mediaElements.length;

    if (textCount === 0) return 0; // no text → not balanced

    const ratio = textCount / (mediaCount + 1); // +1 to avoid division by 0

    // Rule of thumb: at least 1 text element per media element
    return ratio >= 1 ? 1 : 0;
}

function checkErrorEmptyState($) {
    // 1️⃣ Extract body text
    const bodyText = $('body').text().trim().toLowerCase();

    if (!bodyText) return 0; // completely empty → fail

    // 2️⃣ Check for common empty/error state keywords
    const keywords = ['404', 'not found', 'page not found', 'no results', 'empty', 'nothing here'];
    const hasKeyword = keywords.some(kw => bodyText.includes(kw));

    if (!hasKeyword) return 0; // no helpful messaging → fail

    // 3️⃣ Check for next-step guidance (button or link)
    const guidance = $('a, button, input[type="button"], input[type="submit"]').filter((i, el) => {
        const text = $(el).text().trim().toLowerCase() || $(el).attr('value')?.trim().toLowerCase();
        return text && text.length >= 3; // some guidance text
    });

    return guidance.length > 0 ? 1 : 0; // 1 = helpful, 0 = unhelpful
}

// UX & Content Structure (Accessibility & Usability Extras)
function checkInteractiveFeedback($) {
    // 1️⃣ Check for hover/active styles (inline or class)
    const interactiveElements = $('button, a, input[type="submit"], input[type="button"]');

    let feedbackFound = false;

    interactiveElements.each((i, el) => {
        const style = ($(el).attr('style') || '').toLowerCase();
        const classNames = ($(el).attr('class') || '').toLowerCase();

        // Heuristic: if inline hover-like styles exist or class names include common feedback keywords
        if (style.includes('hover') || style.includes('active') ||
            classNames.includes('hover') || classNames.includes('active') || 
            classNames.includes('focus')) {
            feedbackFound = true;
        }
    });

    // 2️⃣ Check forms for submission feedback messages
    const feedbackMessages = $('form + div, form + span, .error, .success, .message');
    if (feedbackMessages.length > 0) feedbackFound = true;

    // 3️⃣ Check for onclick attributes (click feedback)
    if ($('[onclick]').length > 0) feedbackFound = true;

    return feedbackFound ? 1 : 0;
}

// UX & Content Structure (Optional (Add if tu UX depth badhaana chahe))
function checkStickyNavigation($) {
    // Find common navigation elements
    const navElements = $('nav, .navbar, .menu, .header');

    if (navElements.length === 0) return 0; // no nav → fail

    let stickyFound = false;

    navElements.each((i, el) => {
        const style = ($(el).attr('style') || '').toLowerCase();
        const classes = ($(el).attr('class') || '').toLowerCase();

        // 1️⃣ Check inline CSS for sticky/fixed
        if (style.includes('position: sticky') || style.includes('position: fixed')) {
            stickyFound = true;
        }

        // 2️⃣ Check class names indicating sticky (common naming conventions)
        if (classes.includes('sticky') || classes.includes('fixed')) {
            stickyFound = true;
        }
    });

    return stickyFound ? 1 : 0;
}

function checkScrollDepthLogic($) {
    // 1️⃣ Identify long pages
    const headings = $('h2, h3');
    const paragraphs = $('p');
    const isLongPage = headings.length >= 10 || paragraphs.length >= 20;
    
    if (!isLongPage) return 1; // short page → automatically pass

    // 2️⃣ Check for Table of Contents (links to internal anchors)
    const tocLinks = $('a[href^="#"]');
    const tocExists = tocLinks.length > 0;

    // 3️⃣ Check for Back-to-top button/link
    const backToTop = $('a[href="#top"], button.back-to-top, .back-to-top');
    const backToTopExists = backToTop.length > 0;

    // Pass if TOC or Back-to-top exists
    return (tocExists || backToTopExists) ? 1 : 0;
}

function checkLoadingIndicators($) {
    // 1️⃣ Look for common loading classes
    const loadingClasses = $('.loading, .spinner, .skeleton, .placeholder');
    if (loadingClasses.length > 0) return 1;

    // 2️⃣ Look for loading text
    const bodyText = $('body').text().toLowerCase();
    const loadingTexts = ['loading', 'please wait', 'fetching', 'loading...'];
    const hasLoadingText = loadingTexts.some(text => bodyText.includes(text));

    return hasLoadingText ? 1 : 0;
}


function checkInternalLinkingQuality($, domain) {
    const links = $('a[href]').map((i, el) => $(el).attr('href')).get();

    if (links.length === 0) return 0; // no links → fail

    // Filter internal links
    const internalLinks = links.filter(link => {
        return link.startsWith('/') || link.includes(domain);
    });

    if (internalLinks.length === 0) return 0; // no internal links → fail

    // Optional: check logical flow using keywords
    const pageKeywords = $('h1, h2, h3').text().toLowerCase().split(/\s+/);
    let relevantLinkCount = 0;

    internalLinks.forEach(link => {
        const lowerLink = link.toLowerCase();
        // simple heuristic: link URL contains any keyword from headings
        if (pageKeywords.some(word => word.length > 3 && lowerLink.includes(word))) {
            relevantLinkCount++;
        }
    });

    // Pass if at least 1 internal link matches page keywords → logical flow
    return relevantLinkCount >= 1 ? 1 : 0;
}

function checkUserJourneyContinuity($) {
    // Find potential next-step elements
    const ctas = $('button, a, input[type="button"], input[type="submit"]');

    if (ctas.length === 0) return 0; // no next step → fail

    let validCTA = 0;

    ctas.each((i, el) => {
        let text = '';
        const tag = el.tagName.toLowerCase();

        if (tag === 'button' || tag === 'a') {
            text = $(el).text().trim();
        } else if (tag === 'input') {
            text = $(el).attr('value') ? $(el).attr('value').trim() : '';
        }

        // Consider valid if text indicates action (length ≥3)
        if (text.length >= 3) validCTA++;
    });

    // Pass if at least 1 valid CTA exists
    return validCTA >= 1 ? 1 : 0;
}

export default async function evaluateMobileUX(url,device,selectedMetric, $, auditId) {

    // UX & Content Structure (Navigation & Layout)
    const checkNavigationClarityScore = checkNavigationClarity($);
    const checkBreadcrumbsScore = checkBreadcrumbs($);
    const domain = Domain(url);
    const checkClickableLogoScore = checkClickableLogo($,domain);
    const checkMobileResponsivenessScore = checkMobileResponsiveness($);

    // UX & Content Structure (Readability & Visual Layout)
    const checkFontStyleAndSizeConsistencyScore = checkFontStyleAndSizeConsistency($);
    const checkWhitespaceUsageScore = checkWhitespaceUsage($);
    const checkParagraphLengthAndSpacingScore = checkParagraphLengthAndSpacing($);
    const checkContrastAndColorHarmonyScore = checkContrastAndColorHarmony($);

    // UX & Content Structure (Content & Engagement Flow)
    const checkContentRelevanceScore = checkContentRelevance($);
    const checkCallToActionClarityScore = checkCallToActionClarity($);
    const checkMultimediaBalanceScore = checkMultimediaBalance($);
    const checkErrorEmptyStateScore = checkErrorEmptyState($);
    
    // UX & Content Structure (Accessibility & Usability Extras)
    const checkInteractiveFeedbackScore = checkInteractiveFeedback($);

    // UX & Content Structure (Optional (Add if tu UX depth badhaana chahe))
    const checkStickyNavigationScore = checkStickyNavigation($);
    const checkScrollDepthLogicScore=checkScrollDepthLogic($);
    const checkLoadingIndicatorsScore = checkLoadingIndicators($);
    
    const checkInternalLinkingQualityScore = checkInternalLinkingQuality($,domain);
    const checkUserJourneyContinuityScore = checkUserJourneyContinuity($);

    const Total = parseFloat((((checkNavigationClarityScore+checkBreadcrumbsScore+checkClickableLogoScore+checkMobileResponsivenessScore+checkParagraphLengthAndSpacingScore+checkFontStyleAndSizeConsistencyScore+checkContrastAndColorHarmonyScore+checkWhitespaceUsageScore+checkContentRelevanceScore+checkCallToActionClarityScore+checkMultimediaBalanceScore+checkInternalLinkingQualityScore+checkUserJourneyContinuityScore+checkErrorEmptyStateScore+checkInteractiveFeedbackScore+checkStickyNavigationScore+checkScrollDepthLogicScore+checkLoadingIndicatorsScore)/18)*100).toFixed(0));

  // Passed
  const passed = [];
  
  // Improvements
  const improvements = [];

if (checkNavigationClarityScore === 0) {
  improvements.push({
    metric: "Navigation Clarity",
    current: "Unclear",
    recommended: "Menus should be visible, labeled, and unique",
    severity: "High 🟠",
    suggestion: "Ensure all navigation menus have labels and unique items."
  });
} else {
  passed.push({
    metric: "Navigation Clarity",
    current: "Clear",
    recommended: "Menus should be visible, labeled, and unique",
    severity: "✅ Passed",
    suggestion: "Navigation menus are clear and properly labeled."
  });
}

if (checkBreadcrumbsScore === 0) {
  improvements.push({
    metric: "Breadcrumbs",
    current: "Missing",
    recommended: "Use breadcrumbs for page hierarchy",
    severity: "Medium 🟡",
    suggestion: "Add breadcrumbs for better navigation and context."
  });
} else {
  passed.push({
    metric: "Breadcrumbs",
    current: "Present",
    recommended: "Use breadcrumbs for page hierarchy",
    severity: "✅ Passed",
    suggestion: "Breadcrumbs are present."
  });
}

if (checkClickableLogoScore === 0) {
  improvements.push({
    metric: "Clickable Logo",
    current: "No clickable logo",
    recommended: "Logo should link to homepage",
    severity: "Medium 🟡",
    suggestion: "Make sure the logo is clickable and returns to the homepage."
  });
} else {
  passed.push({
    metric: "Clickable Logo",
    current: "Logo links to homepage",
    recommended: "Logo should link to homepage",
    severity: "✅ Passed",
    suggestion: "Logo is clickable and links to homepage."
  });
}

if (checkMobileResponsivenessScore === 0) {
  improvements.push({
    metric: "Mobile Responsiveness",
    current: "Not fully responsive",
    recommended: "Page should be responsive for mobile devices",
    severity: "High 🟠",
    suggestion: "Add viewport meta and responsive styles to improve mobile UX."
  });
} else {
  passed.push({
    metric: "Mobile Responsiveness",
    current: "Responsive",
    recommended: "Page should be responsive for mobile devices",
    severity: "✅ Passed",
    suggestion: "Page is mobile-friendly."
  });
}

if (checkFontStyleAndSizeConsistencyScore === 0) {
  improvements.push({
    metric: "Font Style & Size Consistency",
    current: "Inconsistent",
    recommended: "Consistent font styles and sizes",
    severity: "Medium 🟡",
    suggestion: "Ensure consistent font-family and font-size across the page."
  });
} else {
  passed.push({
    metric: "Font Style & Size Consistency",
    current: "Consistent",
    recommended: "Consistent font styles and sizes",
    severity: "✅ Passed",
    suggestion: "Font styles and sizes are consistent."
  });
}

if (checkWhitespaceUsageScore === 0) {
  improvements.push({
    metric: "Whitespace Usage",
    current: "Insufficient",
    recommended: "Maintain sufficient padding/margins",
    severity: "Medium 🟡",
    suggestion: "Add spacing around elements to improve readability."
  });
} else {
  passed.push({
    metric: "Whitespace Usage",
    current: "Adequate",
    recommended: "Maintain sufficient padding/margins",
    severity: "✅ Passed",
    suggestion: "Whitespace usage is adequate."
  });
}

if (checkParagraphLengthAndSpacingScore === 0) {
  improvements.push({
    metric: "Paragraph Length & Spacing",
    current: "Too long",
    recommended: "Paragraphs 40–120 words; spacing adequate",
    severity: "Medium 🟡",
    suggestion: "Break long paragraphs and add spacing for better readability."
  });
} else {
  passed.push({
    metric: "Paragraph Length & Spacing",
    current: "Good",
    recommended: "Paragraphs 40–120 words; spacing adequate",
    severity: "✅ Passed",
    suggestion: "Paragraph length and spacing are good."
  });
}

if (checkContrastAndColorHarmonyScore === 0) {
  improvements.push({
    metric: "Contrast & Color Harmony",
    current: "Low contrast",
    recommended: "Contrast ratio ≥ 4.5 for text",
    severity: "High 🟠",
    suggestion: "Adjust text and background colors for better accessibility."
  });
} else {
  passed.push({
    metric: "Contrast & Color Harmony",
    current: "Good",
    recommended: "Contrast ratio ≥ 4.5 for text",
    severity: "✅ Passed",
    suggestion: "Contrast and color harmony are good."
  });
}

if (checkContentRelevanceScore === 0) {
  improvements.push({
    metric: "Content Relevance",
    current: "Irrelevant",
    recommended: "Page content should match title/keywords",
    severity: "High 🟠",
    suggestion: "Ensure page content aligns with the title and main keywords."
  });
} else {
  passed.push({
    metric: "Content Relevance",
    current: "Relevant",
    recommended: "Page content should match title/keywords",
    severity: "✅ Passed",
    suggestion: "Content is relevant to the page title."
  });
}

if (checkCallToActionClarityScore === 0) {
  improvements.push({
    metric: "Call-to-Action (CTA) Clarity",
    current: "Unclear",
    recommended: "CTAs should be visible and descriptive",
    severity: "High 🟠",
    suggestion: "Make sure buttons and links have meaningful text for actions."
  });
} else {
  passed.push({
    metric: "Call-to-Action (CTA) Clarity",
    current: "Clear",
    recommended: "CTAs should be visible and descriptive",
    severity: "✅ Passed",
    suggestion: "CTAs are clear and actionable."
  });
}

if (checkMultimediaBalanceScore === 0) {
  improvements.push({
    metric: "Multimedia Balance",
    current: "Text-heavy or media-heavy",
    recommended: "At least 1 text element per media element",
    severity: "Medium 🟡",
    suggestion: "Balance text and media to improve engagement."
  });
} else {
  passed.push({
    metric: "Multimedia Balance",
    current: "Balanced",
    recommended: "At least 1 text element per media element",
    severity: "✅ Passed",
    suggestion: "Multimedia and text are well balanced."
  });
}

if (checkErrorEmptyStateScore === 0) {
  improvements.push({
    metric: "Error & Empty State Handling",
    current: "Not handled",
    recommended: "Provide guidance on error/empty states",
    severity: "Medium 🟡",
    suggestion: "Include helpful messages and next-step guidance on empty/error pages."
  });
} else {
  passed.push({
    metric: "Error & Empty State Handling",
    current: "Handled",
    recommended: "Provide guidance on error/empty states",
    severity: "✅ Passed",
    suggestion: "Error and empty states provide guidance."
  });
}

if (checkInteractiveFeedbackScore === 0) {
  improvements.push({
    metric: "Interactive Feedback",
    current: "Missing",
    recommended: "Buttons/links/forms should provide feedback",
    severity: "Medium 🟡",
    suggestion: "Add hover, focus, active styles and feedback messages."
  });
} else {
  passed.push({
    metric: "Interactive Feedback",
    current: "Present",
    recommended: "Buttons/links/forms should provide feedback",
    severity: "✅ Passed",
    suggestion: "Interactive feedback is present."
  });
}

if (checkStickyNavigationScore === 0) {
  improvements.push({
    metric: "Sticky Navigation",
    current: "Not implemented",
    recommended: "Navigation should remain accessible while scrolling",
    severity: "Low 🟢",
    suggestion: "Consider adding sticky navigation for easier access."
  });
} else {
  passed.push({
    metric: "Sticky Navigation",
    current: "Implemented",
    recommended: "Navigation should remain accessible while scrolling",
    severity: "✅ Passed",
    suggestion: "Sticky navigation is implemented."
  });
}

if (checkScrollDepthLogicScore === 0) {
  improvements.push({
    metric: "Scroll Depth / TOC Logic",
    current: "Missing TOC/back-to-top",
    recommended: "Provide TOC or back-to-top for long pages",
    severity: "Medium 🟡",
    suggestion: "Add table of contents or back-to-top buttons for long pages."
  });
} else {
  passed.push({
    metric: "Scroll Depth / TOC Logic",
    current: "Good",
    recommended: "Provide TOC or back-to-top for long pages",
    severity: "✅ Passed",
    suggestion: "Scroll depth logic is properly handled."
  });
}

if (checkLoadingIndicatorsScore === 0) {
  improvements.push({
    metric: "Loading Indicators",
    current: "Missing",
    recommended: "Show loading/spinner indicators when content is loading",
    severity: "Low 🟢",
    suggestion: "Add visible loading indicators for better UX feedback."
  });
} else {
  passed.push({
    metric: "Loading Indicators",
    current: "Present",
    recommended: "Show loading/spinner indicators when content is loading",
    severity: "✅ Passed",
    suggestion: "Loading indicators are present."
  });
}

if (checkInternalLinkingQualityScore === 0) {
  improvements.push({
    metric: "Internal Linking Quality",
    current: "Poor",
    recommended: "Internal links should be relevant and flow logically",
    severity: "Medium 🟡",
    suggestion: "Add internal links that match page headings/keywords."
  });
} else {
  passed.push({
    metric: "Internal Linking Quality",
    current: "Good",
    recommended: "Internal links should be relevant and flow logically",
    severity: "✅ Passed",
    suggestion: "Internal linking quality is good."
  });
}

if (checkUserJourneyContinuityScore === 0) {
  improvements.push({
    metric: "User Journey Continuity",
    current: "Broken",
    recommended: "Provide clear next-step actions for users",
    severity: "High 🟠",
    suggestion: "Ensure at least one meaningful CTA exists for next-step actions."
  });
} else {
  passed.push({
    metric: "User Journey Continuity",
    current: "Smooth",
    recommended: "Provide clear next-step actions for users",
    severity: "✅ Passed",
    suggestion: "User journey continuity is smooth."
  });
}

// Warning
const warning = [];

const actualPercentage = parseFloat((((checkMobileResponsivenessScore+checkClickableLogoScore+checkBreadcrumbsScore+checkCallToActionClarityScore+checkUserJourneyContinuityScore+checkInternalLinkingQualityScore+checkContrastAndColorHarmonyScore+checkFontStyleAndSizeConsistencyScore+checkInteractiveFeedbackScore+checkLoadingIndicatorsScore+checkStickyNavigationScore+checkParagraphLengthAndSpacingScore+checkContentRelevanceScore+checkMultimediaBalanceScore)/14)*100).toFixed(0));

    // console.log("Navigation Clarity Score:", checkNavigationClarityScore);
    // console.log("Breadcrumbs Score:", checkBreadcrumbsScore);
    // console.log("Clickable Logo Score:", checkClickableLogoScore);
    // console.log("Mobile Responsiveness Score:", checkMobileResponsivenessScore);
    // console.log("Font Style & Size Consistency Score:", checkFontStyleAndSizeConsistencyScore);
    // console.log("Whitespace Usage Score:", checkWhitespaceUsageScore);
    // console.log("Paragraph Length & Spacing Score:", checkParagraphLengthAndSpacingScore);
    // console.log("Contrast & Color Harmony Score:", checkContrastAndColorHarmonyScore);
    // console.log("Content Relevance Score:", checkContentRelevanceScore);
    // console.log("Call to Action Clarity Score:", checkCallToActionClarityScore);
    // console.log("Multimedia Balance Score:", checkMultimediaBalanceScore);
    // console.log("Error & Empty State Score:", checkErrorEmptyStateScore);
    // console.log("Interactive Feedback Score:", checkInteractiveFeedbackScore);
    // console.log("Sticky Navigation Score:", checkStickyNavigationScore);
    // console.log("checkScrollDepthLogic Score",checkScrollDepthLogicScore);
    // console.log("Loading Indicators Score:", checkLoadingIndicatorsScore);
    // console.log("Internal Linking Quality Score:", checkInternalLinkingQualityScore);
    // console.log("User Journey Continuity Score:", checkUserJourneyContinuityScore);
    // console.log(actualPercentage);
    // console.log(warning);
    // console.log(passed);
    // console.log(Total);
    // console.log(improvements);

    await SiteReport.findByIdAndUpdate(auditId, {
        UX_or_Content_Structure: {
      Navigation_Clarity: {
        Score: checkNavigationClarityScore,
        Parameter: '1 if navigation menus are visible, labeled, and unique, else 0'
      },
      Breadcrumbs: {
        Score: checkBreadcrumbsScore,
        Parameter: '1 if breadcrumbs are present with at least one text item, else 0'
      },
      Clickable_Logo: {
        Score: checkClickableLogoScore,
        Parameter: '1 if logo links to homepage, else 0'
      },
      Mobile_Responsiveness: {
        Score: checkMobileResponsivenessScore,
        Parameter: '1 if viewport meta is set and responsive CSS exists, else 0'
      },
      Font_Style_and_Size_Consistency: {
        Score: checkFontStyleAndSizeConsistencyScore,
        Parameter: '1 if font-family and font-size are consistent, else 0'
      },
      Whitespace_Usage: {
        Score: checkWhitespaceUsageScore,
        Parameter: '1 if sufficient padding/margins exist in most blocks, else 0'
      },
      Paragraph_Length_and_Spacing: {
        Score: checkParagraphLengthAndSpacingScore,
        Parameter: '1 if paragraphs are 40–120 words and spacing is adequate, else 0'
      },
      Contrast_and_Color_Harmony: {
        Score: checkContrastAndColorHarmonyScore,
        Parameter: '1 if text-background contrast ratio ≥ 4.5, else 0'
      },
      Content_Relevance: {
        Score: checkContentRelevanceScore,
        Parameter: '1 if ≥50% of title keywords appear in content, else 0'
      },
      Call_to_Action_Clarity: {
        Score: checkCallToActionClarityScore,
        Parameter: '1 if at least 1 meaningful CTA exists, else 0'
      },
      Multimedia_Balance: {
        Score: checkMultimediaBalanceScore,
        Parameter: '1 if text and media are balanced (≥1 text per media element), else 0'
      },
      Error_and_Empty_State_Handling: {
        Score: checkErrorEmptyStateScore,
        Parameter: '1 if empty/error states provide guidance, else 0'
      },
      Interactive_Feedback: {
        Score: checkInteractiveFeedbackScore,
        Parameter: '1 if buttons/links/forms provide visual or textual feedback, else 0'
      },
      Sticky_Navigation: {
        Score: checkStickyNavigationScore,
        Parameter: '1 if navigation remains visible when scrolling, else 0'
      },
      Scroll_Depth_Logic: {
        Score: checkScrollDepthLogicScore,
        Parameter: '1 if TOC or back-to-top exists for long pages, else 0'
      },
      Loading_Indicators: {
        Score: checkLoadingIndicatorsScore,
        Parameter: '1 if visible loading indicators exist, else 0'
      },
      Internal_Linking_Quality: {
        Score: checkInternalLinkingQualityScore,
        Parameter: '1 if internal links exist and are relevant, else 0'
      },
      User_Journey_Continuity: {
        Score: checkUserJourneyContinuityScore,
        Parameter: '1 if at least one meaningful CTA exists for next steps, else 0'
      },
      Percentage: actualPercentage,
      Warning: warning,
      Passed:passed,
      Total: Total,
      Improvements: improvements
        },
        $set: {
          'Raw.Site': url,
          'Raw.Report': selectedMetric,
          'Raw.Device': device,
          'Raw.UX_or_Content_Structure':{
      Navigation_Clarity: {
        Score: checkNavigationClarityScore,
        Parameter: '1 if navigation menus are visible, labeled, and unique, else 0'
      },
      Breadcrumbs: {
        Score: checkBreadcrumbsScore,
        Parameter: '1 if breadcrumbs are present with at least one text item, else 0'
      },
      Clickable_Logo: {
        Score: checkClickableLogoScore,
        Parameter: '1 if logo links to homepage, else 0'
      },
      Mobile_Responsiveness: {
        Score: checkMobileResponsivenessScore,
        Parameter: '1 if viewport meta is set and responsive CSS exists, else 0'
      },
      Font_Style_and_Size_Consistency: {
        Score: checkFontStyleAndSizeConsistencyScore,
        Parameter: '1 if font-family and font-size are consistent, else 0'
      },
      Whitespace_Usage: {
        Score: checkWhitespaceUsageScore,
        Parameter: '1 if sufficient padding/margins exist in most blocks, else 0'
      },
      Paragraph_Length_and_Spacing: {
        Score: checkParagraphLengthAndSpacingScore,
        Parameter: '1 if paragraphs are 40–120 words and spacing is adequate, else 0'
      },
      Contrast_and_Color_Harmony: {
        Score: checkContrastAndColorHarmonyScore,
        Parameter: '1 if text-background contrast ratio ≥ 4.5, else 0'
      },
      Content_Relevance: {
        Score: checkContentRelevanceScore,
        Parameter: '1 if ≥50% of title keywords appear in content, else 0'
      },
      Call_to_Action_Clarity: {
        Score: checkCallToActionClarityScore,
        Parameter: '1 if at least 1 meaningful CTA exists, else 0'
      },
      Multimedia_Balance: {
        Score: checkMultimediaBalanceScore,
        Parameter: '1 if text and media are balanced (≥1 text per media element), else 0'
      },
      Error_and_Empty_State_Handling: {
        Score: checkErrorEmptyStateScore,
        Parameter: '1 if empty/error states provide guidance, else 0'
      },
      Interactive_Feedback: {
        Score: checkInteractiveFeedbackScore,
        Parameter: '1 if buttons/links/forms provide visual or textual feedback, else 0'
      },
      Sticky_Navigation: {
        Score: checkStickyNavigationScore,
        Parameter: '1 if navigation remains visible when scrolling, else 0'
      },
      Scroll_Depth_Logic: {
        Score: checkScrollDepthLogicScore,
        Parameter: '1 if TOC or back-to-top exists for long pages, else 0'
      },
      Loading_Indicators: {
        Score: checkLoadingIndicatorsScore,
        Parameter: '1 if visible loading indicators exist, else 0'
      },
      Internal_Linking_Quality: {
        Score: checkInternalLinkingQualityScore,
        Parameter: '1 if internal links exist and are relevant, else 0'
      },
      User_Journey_Continuity: {
        Score: checkUserJourneyContinuityScore,
        Parameter: '1 if at least one meaningful CTA exists for next steps, else 0'
      },
      Percentage: actualPercentage
    }
        }
        });

        return actualPercentage
}
