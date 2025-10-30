import AxePuppeteer from "@axe-core/puppeteer";
import { performance } from "perf_hooks";
import SiteReport from "../Model/SiteReport.js";

export default async function accessibilityMetrics(url,device,selectedMetric,page, auditId) {

  let start, end, timeTaken;
  start = performance.now();

  let results;
  try {
    results = await new AxePuppeteer(page).analyze();
  } catch (err) {
    console.error("Axe analysis failed:", err.message);
    results = { violations: [] };
  } 

function calculatePassRate(results, rules) {
  if (!results || !results.violations) return 1;

  const hasViolation = results.violations.some(v => rules.includes(v.id) && v.nodes.length > 0);

  return hasViolation ? 0 : 1;
}

  async function Landmarks(page) {
    const landmarks = await page.$$(
      '[role="banner"], [role="main"], [role="contentinfo"], [role="navigation"], [role="complementary"]'
    );
    return landmarks.length > 0 ? 1 : 0;
  }

  const colorContrast = calculatePassRate(results, ["color-contrast"]);
  const focusOrder = calculatePassRate(results, ["focus-order"]);
  const focusableContent = calculatePassRate(results, ["focusable-content"]);
  const tabindex = calculatePassRate(results, ["tabindex"]);
  const interactiveElementAffordance = calculatePassRate(results, ["interactive-element-affordance"]);
  const label = calculatePassRate(results, ["label"]);
  const ariaAllowedAttr = calculatePassRate(results, ["aria-allowed-attr"]);
  const ariaRoles = calculatePassRate(results, ["aria-roles"]);
  const ariaHiddenFocus = calculatePassRate(results, ["aria-hidden-focus"]);
  const imageAlt = calculatePassRate(results, ["image-alt"]);
  const skipLinks = await page.$('a[href^="#"]:not([hidden])') ? 0 : 1
  const landMarks = await Landmarks(page);

  end = performance.now();
  timeTaken = ((end-start)/1000).toFixed(0);

  const Total = colorContrast+focusOrder+focusableContent+tabindex+interactiveElementAffordance+label+ariaAllowedAttr+ariaRoles+ariaHiddenFocus+imageAlt+skipLinks+landMarks

  // Passed
  const passed = [];

  // Warning
  const warning = [];

if (colorContrast === 0) {
  warning.push({
    metric: "Color Contrast",
    current: "Insufficient contrast detected",
    recommended: "Ensure sufficient contrast between text and background (WCAG AA standard)",
    severity: "High 🔴",
    suggestion: "Adjust text and background colors to improve readability for all users."
  });
} else {
  passed.push({
    metric: "Color Contrast",
    current: "Sufficient contrast",
    recommended: "Ensure sufficient contrast between text and background (WCAG AA standard)",
    severity: "✅ Passed",
    suggestion: "Text and background contrast meet accessibility standards."
  });
}

if (focusOrder === 0) {
  warning.push({
    metric: "Focus Order",
    current: "Incorrect tab/focus order",
    recommended: "Logical focus sequence following the DOM order",
    severity: "Medium 🟡",
    suggestion: "Ensure that keyboard navigation follows a logical and intuitive order."
  });
} else {
  passed.push({
    metric: "Focus Order",
    current: "Logical focus order",
    recommended: "Logical focus sequence following the DOM order",
    severity: "✅ Passed",
    suggestion: "Focus order is correct."
  });
}

if (focusableContent === 0) {
  warning.push({
    metric: "Focusable Content",
    current: "Focusable elements not accessible",
    recommended: "All interactive elements must be focusable",
    severity: "Medium 🟡",
    suggestion: "Add proper focus handling to all interactive elements."
  });
} else {
  passed.push({
    metric: "Focusable Content",
    current: "All interactive elements focusable",
    recommended: "All interactive elements must be focusable",
    severity: "✅ Passed",
    suggestion: "Interactive elements are properly focusable."
  });
}

if (tabindex === 0) {
  warning.push({
    metric: "Tabindex",
    current: "Invalid tabindex usage",
    recommended: "Use tabindex correctly (avoid >0 values unless necessary)",
    severity: "Medium 🟡",
    suggestion: "Correct tabindex attributes to maintain proper navigation order."
  });
} else {
  passed.push({
    metric: "Tabindex",
    current: "Tabindex used correctly",
    recommended: "Use tabindex correctly (avoid >0 values unless necessary)",
    severity: "✅ Passed",
    suggestion: "Tabindex implementation is correct."
  });
}

if (interactiveElementAffordance === 0) {
  warning.push({
    metric: "Interactive Element Affordance",
    current: "Interactive elements lack visual cues",
    recommended: "Provide clear affordance (buttons, links visually distinct)",
    severity: "Medium 🟡",
    suggestion: "Ensure clickable elements look interactive (e.g., hover, focus styles)."
  });
} else {
  passed.push({
    metric: "Interactive Element Affordance",
    current: "Interactive elements visually clear",
    recommended: "Provide clear affordance (buttons, links visually distinct)",
    severity: "✅ Passed",
    suggestion: "Interactive elements provide clear visual cues."
  });
}

if (label === 0) {
  warning.push({
    metric: "Form Labels",
    current: "Form inputs missing labels",
    recommended: "All form elements must have descriptive labels",
    severity: "High 🔴",
    suggestion: "Add <label> or aria-label attributes to improve accessibility."
  });
} else {
  passed.push({
    metric: "Form Labels",
    current: "All form inputs labeled",
    recommended: "All form elements must have descriptive labels",
    severity: "✅ Passed",
    suggestion: "Form labels are implemented correctly."
  });
}

if (ariaAllowedAttr === 0) {
  warning.push({
    metric: "ARIA Allowed Attributes",
    current: "Invalid ARIA attributes used",
    recommended: "Use only valid ARIA attributes",
    severity: "Medium 🟡",
    suggestion: "Remove or correct invalid ARIA attributes for compliance."
  });
} else {
  passed.push({
    metric: "ARIA Allowed Attributes",
    current: "Valid ARIA attributes",
    recommended: "Use only valid ARIA attributes",
    severity: "✅ Passed",
    suggestion: "ARIA attributes are valid."
  });
}

if (ariaRoles === 0) {
  warning.push({
    metric: "ARIA Roles",
    current: "Incorrect ARIA roles",
    recommended: "Use valid ARIA roles for elements",
    severity: "Medium 🟡",
    suggestion: "Assign correct ARIA roles according to element purpose."
  });
} else {
  passed.push({
    metric: "ARIA Roles",
    current: "Correct ARIA roles",
    recommended: "Use valid ARIA roles for elements",
    severity: "✅ Passed",
    suggestion: "ARIA roles are implemented correctly."
  });
}

if (ariaHiddenFocus === 0) {
  warning.push({
    metric: "Hidden Focusable Elements",
    current: "Hidden elements receive focus",
    recommended: "Hidden elements should not be focusable",
    severity: "Medium 🟡",
    suggestion: "Ensure elements with aria-hidden=true are removed from focus order."
  });
} else {
  passed.push({
    metric: "Hidden Focusable Elements",
    current: "Hidden elements not focusable",
    recommended: "Hidden elements should not be focusable",
    severity: "✅ Passed",
    suggestion: "Hidden elements correctly excluded from focus."
  });
}

if (imageAlt === 0) {
  warning.push({
    metric: "Image Alt Text",
    current: "Images missing descriptive alt text",
    recommended: "All images should have meaningful alt attributes",
    severity: "High 🔴",
    suggestion: "Add descriptive alt text to all meaningful images for accessibility and SEO."
  });
} else {
  passed.push({
    metric: "Image Alt Text",
    current: "All images have alt text",
    recommended: "All images should have meaningful alt attributes",
    severity: "✅ Passed",
    suggestion: "Alt text is correctly implemented for all images."
  });
}

if (skipLinks === 0) {
  warning.push({
    metric: "Skip Links",
    current: "Skip links missing",
    recommended: "Provide skip navigation links",
    severity: "Low 🟢",
    suggestion: "Add a skip-to-content link for keyboard users to improve navigation."
  });
} else {
  passed.push({
    metric: "Skip Links",
    current: "Skip links present",
    recommended: "Provide skip navigation links",
    severity: "✅ Passed",
    suggestion: "Skip links implemented correctly."
  });
}

if (landMarks === 0) {
  warning.push({
    metric: "Landmark Roles",
    current: "No landmark roles present",
    recommended: "Include banner, main, contentinfo, navigation, complementary roles",
    severity: "Medium 🟡",
    suggestion: "Add ARIA landmark roles to improve screen reader navigation."
  });
} else {
  passed.push({
    metric: "Landmark Roles",
    current: "Landmark roles present",
    recommended: "Include banner, main, contentinfo, navigation, complementary roles",
    severity: "✅ Passed",
    suggestion: "Landmark roles are correctly implemented."
  });
}

  const actualPercentage = parseFloat((((Total)/12)*100).toFixed(0));

  // console.log(actualPercentage);
  // console.log(warning);
  // console.log(passed);
  // console.log(Total);

  await SiteReport.findByIdAndUpdate(auditId, {
    Time_Taken:timeTaken + 's',
    Accessibility: {
      Color_Contrast:{
        Score:colorContrast,
        Parameter:'1 if color contrast passes, else 0'
      },
      Focus_Order:{
        Score:focusOrder,
        Parameter:'1 if tab/focus order is correct, else 0'
      },
      Focusable_Content:{
        Score:focusableContent,
        Parameter:'1 if focusable elements are correctly used, else 0'
      },
      Tab_Index:{
        Score:tabindex,
        Parameter:'1 if tabindex attributes are valid, else 0'
      },
      Interactive_Element_Affordance:{
        Score:interactiveElementAffordance,
        Parameter:'1 if interactive elements have clear affordance, else 0'
      },
      Label:{
        Score:label,
        Parameter:'1 if form elements have labels, else 0'
      },
      Aria_Allowed_Attr:{
        Score:ariaAllowedAttr,
        Parameter:'1 if only allowed ARIA attributes are used, else 0'
      },
      Aria_Roles:{
        Score:ariaRoles,
        Parameter:'1 if ARIA roles are correctly applied, else 0'
      },
      Aria_Hidden_Focus:{
        Score:ariaHiddenFocus,
        Parameter:'1 if hidden elements do not receive focus, else 0'
      },
      Image_Alt:{
        Score:imageAlt,
        Parameter:'1 if images have descriptive alt text, else 0'
      },
      Skip_Links:{
        Score:skipLinks,
        Parameter:'1 if skip links exist, else 0',
      },
      Landmarks:{
        Score:landMarks,
        Parameter:'1 if landmark roles (banner, main, contentinfo, navigation, complementary) exist, else 0'
      },
      Percentage: actualPercentage,
      Warning: warning,
      Passed: passed,
      Total: Total
    },
    $set: {
          'Raw.Site': url,
          'Raw.Report': selectedMetric,
          'Raw.Device': device,
          'Raw.Time_Taken': timeTaken + 's',
          'Raw.Accessibility':{
      Color_Contrast:{
        Score:colorContrast,
        Parameter:'1 if color contrast passes, else 0'
      },
      Focus_Order:{
        Score:focusOrder,
        Parameter:'1 if tab/focus order is correct, else 0'
      },
      Focusable_Content:{
        Score:focusableContent,
        Parameter:'1 if focusable elements are correctly used, else 0'
      },
      Tab_Index:{
        Score:tabindex,
        Parameter:'1 if tabindex attributes are valid, else 0'
      },
      Interactive_Element_Affordance:{
        Score:interactiveElementAffordance,
        Parameter:'1 if interactive elements have clear affordance, else 0'
      },
      Label:{
        Score:label,
        Parameter:'1 if form elements have labels, else 0'
      },
      Aria_Allowed_Attr:{
        Score:ariaAllowedAttr,
        Parameter:'1 if only allowed ARIA attributes are used, else 0'
      },
      Aria_Roles:{
        Score:ariaRoles,
        Parameter:'1 if ARIA roles are correctly applied, else 0'
      },
      Aria_Hidden_Focus:{
        Score:ariaHiddenFocus,
        Parameter:'1 if hidden elements do not receive focus, else 0'
      },
      Image_Alt:{
        Score:imageAlt,
        Parameter:'1 if images have descriptive alt text, else 0'
      },
      Skip_Links:{
        Score:skipLinks,
        Parameter:'1 if skip links exist, else 0',
      },
      Landmarks:{
        Score:landMarks,
        Parameter:'1 if landmark roles (banner, main, contentinfo, navigation, complementary) exist, else 0'
      },
      Percentage: actualPercentage
    }
        }
    });

    return actualPercentage
}

