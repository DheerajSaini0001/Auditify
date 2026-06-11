import AxeBuilder from "@axe-core/playwright";
import logger from "../utils/logger.js";

function evaluateRule(results, ruleId) {
  if (!results || !results.violations) {
    return { score: 100, status: "pass", violation: null };
  }

  const violation = results.violations.find(v => v.id === ruleId);

  if (!violation) {
    return { score: 100, status: "pass", violation: null };
  }

  let score = 0;
  let status = "fail";

  if (violation.impact === "minor" || violation.impact === "moderate" || violation.impact === "serious") {
    score = 50;
    status = "warning";
  }

  return { score, status, violation };
}

// Color Contrast
const checkColorContrast = (results) => {
  const { score, status, violation } = evaluateRule(results, "color-contrast");

  if (status === "pass") {
    return {
      score,
      status,
      details: "Text elements meet minimum contrast ratios (4.5:1 / 3:1).",
      meta: {
        threshold: "Standard text should have 4.5:1 ratio, large text 3:1.",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: `Insufficient color contrast found (${violation.nodes.length} occurrences).`,
    meta: {
      threshold: "Standard text should have 4.5:1 ratio, large text 3:1.",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Text elements do not have enough contrast against their background colors, making them hard to read.",
      recommendation: "Increase contrast between text and background. Aim for at least 4.5:1 for normal text and 3:1 for large text.",
    }
  };
};

// Focus Order
const checkFocusOrder = (results) => {
  const { score, status, violation } = evaluateRule(results, "focus-order");

  if (status === "pass") {
    return {
      score,
      status,
      details: "Focus order follows a logical, sequential path.",
      meta: {
        threshold: "Tab order must match visual layout.",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: `Illogical focus order detected (${violation.nodes.length} occurrences).`,
    meta: {
      threshold: "Tab order must match visual layout.",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "The tab order of interactive elements does not match the visual layout, confusing keyboard users.",
      recommendation: "Rearrange DOM elements or use tabindex='0' to match visual order. Avoid positive tabindex.",
    }
  };
};

// Focusable Content
const checkFocusableContent = (results) => {
  const { score, status, violation } = evaluateRule(results, "focusable-content");

  if (status === "pass") {
    return {
      score,
      status,
      details: "All interactive elements are reachable via keyboard.",
      meta: {
        threshold: "All clickable items must be keyboard accessible.",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: `Keyboard unreachable elements found (${violation.nodes.length} occurrences).`,
    meta: {
      threshold: "All clickable items must be keyboard accessible.",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Interactive elements (like buttons, links) cannot be reached using the Tab key.",
      recommendation: "Make elements focusable by using semantic HTML (button, a) or adding tabindex='0'.",
    }
  };
};

// Tab Index
const checkTabIndex = (results) => {
  const { score, status, violation } = evaluateRule(results, "tabindex");

  if (status === "pass") {
    return {
      score,
      status,
      details: "No elements use positive tabindex.",
      meta: {
        threshold: "Avoid custom tab orders for natural navigation.",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: `Positive tabindex usage detected (${violation.nodes.length} occurrences).`,
    meta: {
      threshold: "Avoid custom tab orders for natural navigation.",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Elements with tabindex > 0 disrupt the natural tab order.",
      recommendation: "Remove positive tabindex values. Use document order or tabindex='0'.",
    }
  };
};

// Interactive Element Affordance
const checkInteractiveElementAffordance = (results) => {
  const { score, status, violation } = evaluateRule(results, "interactive-element-affordance");

  if (status === "pass") {
    return {
      score,
      status,
      details: "All interactive elements have proper roles and affordances.",
      meta: {
        threshold: "Buttons and links must look and act clickable.",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: `Ambiguous interactive elements found (${violation.nodes.length} occurrences).`,
    meta: {
      threshold: "Buttons and links must look and act clickable.",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Clickable elements (like divs with onclick) lack semantic roles.",
      recommendation: "Add role='button' and tabindex='0', or use native <button>.",
    }
  };
};

// Label
const checkLabel = (results) => {
  const { score, status, violation } = evaluateRule(results, "label");

  if (status === "pass") {
    return {
      score,
      status,
      details: "All form inputs have proper labels.",
      meta: {
        threshold: "Every form input must have a clear text label.",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: `Unlabeled form fields detected (${violation.nodes.length} occurrences).`,
    meta: {
      threshold: "Every form input must have a clear text label.",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Inputs without labels are inaccessible to screen readers.",
      recommendation: "Associate a <label for='id'> or use aria-label/aria-labelledby.",
    }
  };
};

// ARIA Allowed Attr
const checkAriaAllowedAttr = (results) => {
  const { score, status, violation } = evaluateRule(results, "aria-allowed-attr");

  if (status === "pass") {
    return {
      score,
      status,
      details: "ARIA attributes are valid for their roles.",
      meta: {
        threshold: "Accessibility tags must match their intended use.",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: `Invalid ARIA attributes detected (${violation.nodes.length} occurrences).`,
    meta: {
      threshold: "Accessibility tags must match their intended use.",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Some attributes are not permitted for the element's role (e.g., aria-checked on a button).",
      recommendation: "Remove invalid attributes or change the role to one that supports them.",
    }
  };
};

// ARIA Roles
const checkAriaRoles = (results) => {
  const { score, status, violation } = evaluateRule(results, "aria-roles");

  if (status === "pass") {
    return {
      score,
      status,
      details: "All ARIA roles are valid.",
      meta: {
        threshold: "Elements must be correctly identified (e.g., 'button').",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: `Invalid ARIA roles found (${violation.nodes.length} occurrences).`,
    meta: {
      threshold: "Elements must be correctly identified (e.g., 'button').",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Elements use non-existent or abstract ARIA roles.",
      recommendation: "Check role spelling and ensure it exists in the WAI-ARIA specification.",
    }
  };
};

// ARIA Hidden Focus
const checkAriaHiddenFocus = (results) => {
  const { score, status, violation } = evaluateRule(results, "aria-hidden-focus");

  if (status === "pass") {
    return {
      score,
      status,
      details: "Hidden content (aria-hidden) contains no focusable elements.",
      meta: {
        threshold: "Hidden content must not trap keyboard focus.",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: `Focusable elements hidden with aria-hidden (${violation.nodes.length} occurrences).`,
    meta: {
      threshold: "Hidden content must not trap keyboard focus.",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "User can tab to elements that screen readers will ignore.",
      recommendation: "Remove aria-hidden from focusable elements or add tabindex='-1'.",
    }
  };
};

// Image Alt
const checkImageAlt = (results) => {
  const { score, status, violation } = evaluateRule(results, "image-alt");

  if (status === "pass") {
    return {
      score,
      status,
      details: "All images have valid alt text.",
      meta: {
        threshold: "All images must have text descriptions or be marked decorative.",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: `Images missing alt text detected (${violation.nodes.length} occurrences).`,
    meta: {
      threshold: "All images must have text descriptions or be marked decorative.",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Images without alt text are invisible to screen readers.",
      recommendation: "Add descriptive alt text or use alt='' for decorative images.",
    }
  };
};

// Link Name
const checkLinkName = (results) => {
  const { score, status, violation } = evaluateRule(results, "link-name");

  if (status === "pass") {
    return {
      score,
      status,
      details: "All links have discernible text.",
      meta: {
        threshold: "All links must have clear, descriptive text.",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: `Links without text detected (${violation.nodes.length} occurrences).`,
    meta: {
      threshold: "All links must have clear, descriptive text.",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Empty links or icon-only links without labels are confusing.",
      recommendation: "Add text content or use aria-label for icon links.",
    }
  };
};

// Button Name
const checkButtonName = (results) => {
  const { score, status, violation } = evaluateRule(results, "button-name");

  if (status === "pass") {
    return {
      score,
      status,
      details: "All buttons have discernible text.",
      meta: {
        threshold: "All buttons must have clear, descriptive labels.",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: `Buttons missing labels detected (${violation.nodes.length} occurrences).`,
    meta: {
      threshold: "All buttons must have clear, descriptive labels.",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Icon buttons or empty buttons without labels are unusable for screen readers.",
      recommendation: "Add text inside <button>, or use aria-label/aria-labelledby.",
    }
  };
};

// Document Title
const checkDocumentTitle = (results) => {
  const { score, status, violation } = evaluateRule(results, "document-title");

  if (status === "pass") {
    return {
      score,
      status,
      details: "Page has a valid, non-empty <title>.",
      meta: {
        threshold: "Page must have a descriptive browser tab title.",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: "Document title is missing or empty.",
    meta: {
      threshold: "Page must have a descriptive browser tab title.",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Without a title, users cannot identify the page content in tabs or search results.",
      recommendation: "Add a <title> element to the <head>.",
    }
  };
};

// HTML Has Lang
const checkHtmlHasLang = (results) => {
  const { score, status, violation } = evaluateRule(results, "html-has-lang");

  if (status === "pass") {
    return {
      score,
      status,
      details: "The <html> element has a valid lang attribute.",
      meta: {
        threshold: "Document language must be clearly defined (e.g., lang='en').",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: "Missing or invalid lang attribute on <html>.",
    meta: {
      threshold: "Document language must be clearly defined (e.g., lang='en').",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Screen readers need lang to set the correct voice profile.",
      recommendation: "Add lang='en' (or checked code) to the <html> tag.",
    }
  };
};

// Meta Viewport
const checkMetaViewport = (results) => {
  const { score, status, violation } = evaluateRule(results, "meta-viewport");

  if (status === "pass") {
    return {
      score,
      status,
      details: "Viewport allows user scaling.",
      meta: {
        threshold: "Users must be allowed to zoom in for readability.",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: "Viewport meta tag restricts zooming.",
    meta: {
      threshold: "Users must be allowed to zoom in for readability.",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Disabling zoom prevents low-vision users from increasing text size.",
      recommendation: "Remove user-scalable='no' or maximum-scale='1'.",
    }
  };
};

// List
const checkList = (results) => {
  const { score, status, violation } = evaluateRule(results, "list");

  if (status === "pass") {
    return {
      score,
      status,
      details: "All lists use valid structure (ul/ol/dl).",
      meta: {
        threshold: "Lists must be correctly structured for screen readers.",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: `Improper list structure detected (${violation.nodes.length} occurrences).`,
    meta: {
      threshold: "Lists must be correctly structured for screen readers.",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Lists (ul/ol) must only contain li elements.",
      recommendation: "Ensure <ul> and <ol> only contain <li> elements directly.",
    }
  };
};

// Heading Order
const checkHeadingOrder = (results) => {
  const { score, status, violation } = evaluateRule(results, "heading-order");

  if (status === "pass") {
    return {
      score,
      status,
      details: "Headings follow a logical hierarchy (h1 -> h2).",
      meta: {
        threshold: "Headings must follow a logical hierarchy (H1, H2, etc.).",
      },
      analysis: null
    };
  }

  const failedNodes = violation.nodes.map(node => node).slice(0, 10);
  return {
    score,
    status,
    details: `Skipped heading levels detected (${violation.nodes.length} occurrences).`,
    meta: {
      threshold: "Headings must follow a logical hierarchy (H1, H2, etc.).",
      impact: violation.impact,
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      tags: violation.tags,
      failedNodes: failedNodes,
      count: violation.nodes.length
    },
    analysis: {
      cause: "Headings that skip levels (e.g., h1 to h3) confuse screen reader navigation.",
      recommendation: "Ensure headings are sequential (h1 -> h2 -> h3).",
    }
  };
};

// Landmark 
async function checkLandmarks(page) {
  const checks = [
    { name: "Main Content", selector: 'main, [role="main"]' },
    { name: "Navigation", selector: 'nav, [role="navigation"]' },
    { name: "Banner (Header)", selector: 'header, [role="banner"]' },
    { name: "Content Info (Footer)", selector: 'footer, [role="contentinfo"]' },
    { name: "Complementary (Aside)", selector: 'aside, [role="complementary"]' }
  ];

  const present = [];
  const missing = [];

  for (const check of checks) {
    if (await page.$(check.selector)) {
      present.push(check.name);
    } else {
      missing.push(check.name);
    }
  }

  const count = present.length;

  const analysisData = {
    present,
    missing,
    count
  };

  if (count > 0) {
    return {
      score: 100,
      status: "pass",
      details: `Landmarks found: ${present.join(", ")}.`,
      meta: {
        threshold: "Primary sections (Header, Main, Footer) must be present.",
        ...analysisData
      },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No primary landmarks found (Main, Nav, Header).",
    meta: {
      threshold: "Primary sections (Header, Main, Footer) must be present.",
      ...analysisData
    },
    analysis: {
      cause: "Page structure is difficult for screen readers to navigate without landmarks.",
      recommendation: "Use HTML5 semantic elements (main, nav, header) or ARIA roles.",
    }
  };
}

// Skip Links
async function checkSkipLinks(page) {

  const links = await page.$$('a[href^="#"]');
  let brokenSkipLinks = [];

  for (const link of links) {
    const { href, text } = await page.evaluate(el => ({
      href: el.getAttribute('href'),
      text: el.innerText.toLowerCase()
    }), link);

    if (text.includes("skip")) {
      const targetId = href.startsWith('#') ? href.substring(1) : href;
      const targetExists = targetId ? await page.evaluate(id => !!document.getElementById(id), targetId) : false;

      if (targetExists) {
        return {
          score: 100,
          status: "pass",
          details: `Valid skip link found ("${text.trim()}" -> "${href}") targeting existing element.`,
          meta: {
            threshold: "A 'Skip to Content' link is required for keyboard users.",
            linkText: text.trim(),
            target: href
          },
          analysis: null
        };
      } else {
        brokenSkipLinks.push(href);
      }
    }
  }

  if (brokenSkipLinks.length > 0) {
    return {
      score: 0,
      status: "fail",
      details: `Skip link(s) found but target element(s) missing: ${brokenSkipLinks.join(", ")}.`,
      meta: {
        threshold: "A 'Skip to Content' link is required for keyboard users.",
        brokenLinks: brokenSkipLinks
      },
      analysis: {
        cause: "Clicking the skip link does nothing.",
        recommendation: "Ensure the skip link URL matches the ID of the main content container.",
      }
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No valid 'Skip to Content' link found.",
    meta: {
      threshold: "A 'Skip to Content' link is required for keyboard users.",
    },
    analysis: {
      cause: "Keyboard users cannot bypass repetitive navigation.",
      recommendation: "Add a link with text 'Skip to content' pointing to <main id='content'>.",
    }
  };
}

// Keyboard Navigation (summary aggregate of focus-order, focusable-content, tab-index, aria-hidden-focus)
const checkKeyboardNavigation = ({ focusOrder, focusableContent, tabindex, ariaHiddenFocus }) => {
  const parts = [
    { key: "Focus_Order", weight: 8, metric: focusOrder },
    { key: "Focusable_Content", weight: 6, metric: focusableContent },
    { key: "Tab_Index", weight: 5, metric: tabindex },
    { key: "Aria_Hidden_Focus", weight: 3, metric: ariaHiddenFocus }
  ];

  let totalWeight = 0;
  let earnedScore = 0;
  const breakdown = {};
  const failing = [];

  for (const part of parts) {
    const m = part.metric;
    breakdown[part.key] = { score: m.score, status: m.status, details: m.details };
    totalWeight += part.weight;
    earnedScore += (m.score / 100) * part.weight;
    if (m.status !== "pass") failing.push(part.key.replace(/_/g, " "));
  }

  const score = totalWeight > 0 ? parseFloat(((earnedScore / totalWeight) * 100).toFixed(0)) : 100;

  let status = "pass";
  if (parts.some(p => p.metric.status === "fail")) status = "fail";
  else if (parts.some(p => p.metric.status === "warning")) status = "warning";

  if (status === "pass") {
    return {
      score,
      status,
      details: "Page is fully operable by keyboard (logical focus order, reachable content, natural tab order, no focus traps).",
      meta: {
        threshold: "All interactive content must be operable with a keyboard alone.",
        components: parts.map(p => p.key),
        breakdown
      },
      analysis: null
    };
  }

  return {
    score,
    status,
    details: `Keyboard navigation issues detected in: ${failing.join(", ")}.`,
    meta: {
      threshold: "All interactive content must be operable with a keyboard alone.",
      components: parts.map(p => p.key),
      breakdown
    },
    analysis: {
      cause: "One or more keyboard-operability checks failed (focus order, focusable content, tab index, or aria-hidden focus traps).",
      recommendation: "Resolve the individual failing checks: ensure a logical focus order, make all interactive elements focusable, avoid positive tabindex, and remove focusable elements from aria-hidden regions.",
    }
  };
};

export default async function accessibilityMetrics(page) {

  // [NEW] — Neutralize the stealth plugin's Function.prototype.toString proxy
  // before running axe. The stealth plugin (puppeteer-extra-plugin-stealth) wraps
  // toString in a Proxy to mask its evasions; axe-core's injected bundle calls
  // String()/toString() on functions while serializing, which re-enters that
  // proxy and recurses forever ("Maximum call stack size exceeded"). The page has
  // already passed bot-detection during navigation, so the mask is no longer
  // needed — restore a plain native-looking toString so axe can run. Scoped to
  // this page; harmless if the proxy isn't present.
  try {
    await page.evaluate(() => {
      const native = function toString() { return "function () { [native code] }"; };
      try {
        Object.defineProperty(Function.prototype, "toString", {
          value: native, writable: true, configurable: true,
        });
      } catch (_) { /* non-configurable — best effort */ }
    });
  } catch (_) { /* page context unavailable — axe will try anyway */ }

  let axeResults;
  try {
    axeResults = await new AxeBuilder({ page }).analyze();
  } catch (err) {
    logger.error("Axe analysis failed", new Error(err.message));
    axeResults = { violations: [] };
  }

  const colorContrast = checkColorContrast(axeResults);
  const focusOrder = checkFocusOrder(axeResults);
  const focusableContent = checkFocusableContent(axeResults);
  const tabindex = checkTabIndex(axeResults);
  const interactiveElementAffordance = checkInteractiveElementAffordance(axeResults);
  const label = checkLabel(axeResults);
  const ariaAllowedAttr = checkAriaAllowedAttr(axeResults);
  const ariaRoles = checkAriaRoles(axeResults);
  const ariaHiddenFocus = checkAriaHiddenFocus(axeResults);
  const imageAlt = checkImageAlt(axeResults);
  const linkName = checkLinkName(axeResults);
  const buttonName = checkButtonName(axeResults);
  const documentTitle = checkDocumentTitle(axeResults);
  const htmlHasLang = checkHtmlHasLang(axeResults);
  const metaViewport = checkMetaViewport(axeResults);
  const list = checkList(axeResults);
  const headingOrder = checkHeadingOrder(axeResults);

  const keyboardNavigation = checkKeyboardNavigation({ focusOrder, focusableContent, tabindex, ariaHiddenFocus });

  let skipLinks, landMarks;
  try {
    skipLinks = await checkSkipLinks(page);
  } catch (skipErr) {
    skipLinks = { score: 0, status: "fail", details: "Skip link check skipped — page context unavailable.", meta: {}, analysis: null };
  }
  try {
    landMarks = await checkLandmarks(page);
  } catch (landmarkErr) {
    landMarks = { score: 0, status: "fail", details: "Landmark check skipped — page context unavailable.", meta: {}, analysis: null };
  }


  const weights = {
    Color_Contrast: 10,
    Image_Alt: 10,
    Label: 10,
    Focus_Order: 8,
    Link_Name: 8,
    Button_Name: 8,
    Focusable_Content: 6,
    Tab_Index: 5,
    Html_Has_Lang: 5,
    Aria_Roles: 4,
    Document_Title: 4,
    Heading_Order: 4,
    Aria_Allowed_Attr: 3,
    Aria_Hidden_Focus: 3,
    Landmarks: 3,
    Meta_Viewport: 3,
    Skip_Links: 2,
    List: 2,
    Interactive_Element_Affordance: 2
  };

  const metricsMap = {
    Color_Contrast: colorContrast,
    Focus_Order: focusOrder,
    Focusable_Content: focusableContent,
    Tab_Index: tabindex,
    Interactive_Element_Affordance: interactiveElementAffordance,
    Label: label,
    Aria_Allowed_Attr: ariaAllowedAttr,
    Aria_Roles: ariaRoles,
    Aria_Hidden_Focus: ariaHiddenFocus,
    Image_Alt: imageAlt,
    Skip_Links: skipLinks,
    Landmarks: landMarks,
    Link_Name: linkName,
    Button_Name: buttonName,
    Document_Title: documentTitle,
    Html_Has_Lang: htmlHasLang,
    Meta_Viewport: metaViewport,
    List: list,
    Heading_Order: headingOrder
  };

  let totalWeight = 0;
  let earnedScore = 0;

  for (const [key, metric] of Object.entries(metricsMap)) {
    if (metric && typeof metric.score === 'number') {
      const weight = weights[key] || 1;
      totalWeight += weight;
      earnedScore += (metric.score / 100) * weight;
    }
  }

  const actualPercentage = totalWeight > 0 ? parseFloat(((earnedScore / totalWeight) * 100).toFixed(0)) : 0;

  return {
    Percentage: actualPercentage,
    Color_Contrast: colorContrast,
    Focus_Order: focusOrder,
    Focusable_Content: focusableContent,
    Tab_Index: tabindex,
    Interactive_Element_Affordance: interactiveElementAffordance,
    Label: label,
    Aria_Allowed_Attr: ariaAllowedAttr,
    Aria_Roles: ariaRoles,
    Aria_Hidden_Focus: ariaHiddenFocus,
    Keyboard_Navigation: keyboardNavigation,
    Image_Alt: imageAlt,
    Skip_Links: skipLinks,
    Landmarks: landMarks,
    Link_Name: linkName,
    Button_Name: buttonName,
    Document_Title: documentTitle,
    Html_Has_Lang: htmlHasLang,
    Meta_Viewport: metaViewport,
    List: list,
    Heading_Order: headingOrder
  };
}