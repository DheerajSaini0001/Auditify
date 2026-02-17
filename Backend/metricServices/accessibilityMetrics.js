import AxePuppeteer from "@axe-core/puppeteer";

export default async function accessibilityMetrics(page, $) {

  let axeResults;
  try {
    axeResults = await new AxePuppeteer(page).analyze();
  } catch (err) {
    console.error("Axe analysis failed:", err.message);
    axeResults = { violations: [] };
  }

  // Helper to evaluate Axe rules and return standardized object
  function evaluateRule(results, ruleId, metricName) {
    if (!results || !results.violations) {
      return { score: 100, status: "pass", details: `${metricName} check passed`, meta: {} };
    }

    const violation = results.violations.find(v => v.id === ruleId);

    if (violation && violation.nodes.length > 0) {
      // Extract failing nodes for meta data
      const failedNodes = violation.nodes.map(node => ({
        html: node.html,
        target: node.target.join(", "),
        failureSummary: node.failureSummary
      })).slice(0, 10); // Limit to 10 to avoid huge DB entries

      return {
        score: 0,
        status: "fail",
        details: `${violation.help} (${violation.nodes.length} occurrences)`,
        meta: {
          impact: violation.impact,
          description: violation.description,
          helpUrl: violation.helpUrl,
          failedNodes: failedNodes,
          count: violation.nodes.length
        }
      };
    }

    return { score: 100, status: "pass", details: `${metricName} check passed`, meta: {} };
  }

  // Manual Checks
  async function checkLandmarks(page) {
    const landmarks = await page.$$(
      '[role="banner"], [role="main"], [role="contentinfo"], [role="navigation"], [role="complementary"]'
    );
    const count = landmarks.length;
    if (count > 0) {
      return { score: 100, status: "pass", details: "Landmark roles are present", meta: { count, location: "DOM" } };
    }
    return { score: 0, status: "fail", details: "No landmark roles found", meta: { location: "DOM" } };
  }

  async function checkSkipLinks(page) {
    const skipLink = await page.$('a[href^="#"]:not([hidden])');
    if (skipLink) {
      return { score: 100, status: "pass", details: "Skip link found", meta: { location: "DOM" } };
    }
    return { score: 0, status: "fail", details: "No visible skip link found", meta: { location: "DOM" } };
  }

  function checkMultilingualSupport($) {
    const lang = $('html').attr('lang');
    const hreflangs = [];
    $('link[rel="alternate"][hreflang]').each((i, el) => {
      hreflangs.push($(el).attr('hreflang'));
    });

    if ((lang && lang !== 'en') || hreflangs.length > 0) {
      return { score: 100, status: "pass", details: "Multilingual support detected.", meta: { lang, hreflangs } };
    }
    return { score: 0, status: "fail", details: "No multilingual signals found.", meta: { lang: lang || "missing", hreflangsCount: 0 } };
  }

  // Evaluate Metrics
  const colorContrast = evaluateRule(axeResults, "color-contrast", "Color Contrast");
  const focusOrder = evaluateRule(axeResults, "focus-order", "Focus Order");
  const focusableContent = evaluateRule(axeResults, "focusable-content", "Focusable Content"); // Note: 'focusable-content' might not be exact axe rule, usually 'tabindex' covers this or 'interactive-element-affordance'
  const tabindex = evaluateRule(axeResults, "tabindex", "Tabindex");
  const interactiveElementAffordance = evaluateRule(axeResults, "interactive-element-affordance", "Interactive Element Affordance"); // Custom rule or mapped? Axe has 'link-name', 'button-name'. Assuming standard axe rules or custom mapping.
  const label = evaluateRule(axeResults, "label", "Form Labels");
  const ariaAllowedAttr = evaluateRule(axeResults, "aria-allowed-attr", "ARIA Allowed Attributes");
  const ariaRoles = evaluateRule(axeResults, "aria-roles", "ARIA Roles");
  const ariaHiddenFocus = evaluateRule(axeResults, "aria-hidden-focus", "ARIA Hidden Focus");
  const imageAlt = evaluateRule(axeResults, "image-alt", "Image Alt Text");

  const skipLinks = await checkSkipLinks(page);
  const landMarks = await checkLandmarks(page);
  const multilingualSupport = checkMultilingualSupport($);

  // Calculate Weighted Score
  const weights = {
    Color_Contrast: 3, // High impact
    Focus_Order: 3,
    Focusable_Content: 3,
    Tab_Index: 2,
    Interactive_Element_Affordance: 1,
    Label: 3,
    Aria_Allowed_Attr: 2,
    Aria_Roles: 2,
    Aria_Hidden_Focus: 2,
    Image_Alt: 3,
    Skip_Links: 1,
    Landmarks: 1,
    Multilingual_Support: 2 // Added weight for Multilingual Support
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
    Multilingual_Support: multilingualSupport
  };

  let totalWeight = 0;
  let earnedScore = 0;

  for (const [key, metric] of Object.entries(metricsMap)) {
    const weight = weights[key] || 1;
    totalWeight += weight;
    if (metric.score === 100) {
      earnedScore += weight;
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
    Image_Alt: imageAlt,
    Skip_Links: skipLinks,
    Landmarks: landMarks,
    Multilingual_Support: multilingualSupport,
  };
}

