import AxeBuilder from "@axe-core/playwright";
import logger from "../utils/logger.js";
import fastFetch from "../utils/fastFetch.js";

// ============================================================================
// Accessibility — WCAG 2.2 AA, rebuilt to AUDIT_FRAMEWORK_SPECIFICATION.md §2.3
// ----------------------------------------------------------------------------
// Spec rules honored here:
//   • Rule 1 (graded, not binary): every axe-backed parameter scores on the
//     ratio of PASSING to (passing+failing) accessibility-tree NODES, so one bad
//     node among many no longer collapses the whole check to 50/0.
//   • Rule 5 (severity × instance): the section rolls up with per-tier base
//     weights — Critical ×3, Serious ×2, Moderate ×1 — and a single Critical
//     failure caps the headline (≤70), a Serious failure caps it (≤85), so a
//     blocking issue (unlabeled finance form, contrast fail, missing lang)
//     outweighs a pile of cosmetic ones.
//   • Rule 6 (renormalize N/A): a check with no applicable elements on the page
//     (Form Labels with no inputs, List with no lists) returns notCalculated()
//     and is dropped from the weighted denominator instead of scored 0.
//   • §2.3 principle (never claim 100% accessible): automated axe coverage is
//     ~30–40% of WCAG, so the headline is capped (≤96) and the section carries
//     Confidence "heuristic" plus an explicit coverage Note.
//   • §0.5 confidence flag: the section and each parameter are `heuristic`
//     (automated DOM/accessibility-tree inference), consistent with On-Page SEO.
// ============================================================================

const IMPACT_RANK = { minor: 1, moderate: 2, serious: 3, critical: 4 };

const COVERAGE_NOTE =
  "Automated checks (axe-core + DOM probes) cover roughly 30–40% of WCAG 2.2 success criteria. " +
  "A clean result is necessary but not sufficient for full Level AA conformance — manual review is still required. " +
  "The score is therefore capped below 100 and reported with 'heuristic' confidence.";

// Standard result for a check whose subject is genuinely absent on this page
// (e.g. Form Labels on a page with no inputs). score/status are null so the
// parameter is excluded from the weighted total rather than counted as a 0
// (spec rule 6). meta.notScored tells the frontend to render the
// "why this wasn't calculated" banner.
function notCalculated(reason, recommendation) {
  return {
    score: null,
    status: null,
    details: reason,
    analysis: { recommendation },
    meta: {
      value: "Not applicable",
      notScored: true,
      reason,
      informational: true,
      confidence: "heuristic",
    },
  };
}

// Spec rule 1 (graded) + rule 6 (N/A). Reads axe NODE counts for one or more
// rule ids and returns a graded score plus an `applicable` flag. A rule that
// neither passed nor failed (axe "inapplicable" — no matching elements) yields
// applicable:false so the caller can mark the parameter N/A. When several ids
// are folded into one parameter (e.g. the two html-lang rules) their nodes are
// summed and the worst-impact violation is surfaced for the detail panel.
function evaluateRule(results, ruleId) {
  const ids = Array.isArray(ruleId) ? ruleId : [ruleId];
  let failNodes = 0;
  let passNodes = 0;
  let violation = null;
  let worst = null;
  let seen = false;

  for (const id of ids) {
    const v = results.violations?.find((r) => r.id === id);
    const p = results.passes?.find((r) => r.id === id);
    const inc = results.incomplete?.find((r) => r.id === id);
    if (v) {
      failNodes += v.nodes.length;
      seen = true;
      if (!violation || IMPACT_RANK[v.impact] > (IMPACT_RANK[worst] || 0)) {
        violation = v;
        worst = v.impact;
      }
    }
    if (p) {
      passNodes += p.nodes.length;
      seen = true;
    }
    if (inc) seen = true;
  }

  const applicable = seen;
  const total = failNodes + passNodes;

  let score;
  let status;
  if (failNodes === 0) {
    score = 100;
    status = "pass";
  } else {
    // graded: share of nodes that pass. A present violation is never "pass" —
    // it lands in warning (≥50% of nodes still ok) or fail.
    score = total > 0 ? Math.round((passNodes / total) * 100) : 0;
    status = score >= 50 ? "warning" : "fail";
  }

  return { score, status, violation, failNodes, passNodes, applicable };
}

// Shared meta builder for a failing axe rule — preserves the rich shape the
// frontend renders (failedNodes with failureSummary/target/html, impact, etc.).
function violationMeta(violation, threshold, extra = {}) {
  return {
    threshold,
    confidence: "heuristic",
    impact: violation.impact,
    description: violation.description,
    help: violation.help,
    helpUrl: violation.helpUrl,
    tags: violation.tags,
    failedNodes: violation.nodes.map((n) => n).slice(0, 10),
    count: violation.nodes.length,
    ...extra,
  };
}

function passMeta(threshold, extra = {}) {
  return { threshold, confidence: "heuristic", ...extra };
}

// Generic builder for the straightforward axe-backed parameters: graded score,
// pass/warning/fail status, standard meta + cause/recommendation copy.
function axeMetric(results, ruleId, { threshold, passDetails, failDetails, cause, recommendation }) {
  const r = evaluateRule(results, ruleId);
  if (r.status === "pass") {
    return { score: r.score, status: r.status, details: passDetails, meta: passMeta(threshold), analysis: null };
  }
  return {
    score: r.score,
    status: r.status,
    details: failDetails(r.failNodes),
    meta: violationMeta(r.violation, threshold),
    analysis: { cause, recommendation },
  };
}

// ── Color Contrast (Critical) — % of text nodes meeting the contrast ratio ──
const checkColorContrast = (results) =>
  axeMetric(results, "color-contrast", {
    threshold: "Body text ≥ 4.5:1, large text ≥ 3:1, UI/icons ≥ 3:1.",
    passDetails: "Text elements meet minimum contrast ratios (4.5:1 / 3:1).",
    failDetails: (n) => `Insufficient color contrast on ${n} element(s).`,
    cause: "Text elements do not have enough contrast against their background colors, making them hard to read.",
    recommendation: "Increase contrast between text and background. Aim for at least 4.5:1 for normal text and 3:1 for large text.",
  });

// ── Keyboard sub-checks (returned for display; weighted only via the composite) ──
const checkFocusOrder = (results) =>
  axeMetric(results, "focus-order-semantics", {
    threshold: "Tab order must match the visual layout.",
    passDetails: "Focus order follows a logical, sequential path.",
    failDetails: (n) => `Illogical focus order detected (${n} occurrence(s)).`,
    cause: "The tab order of interactive elements does not match the visual layout, confusing keyboard users.",
    recommendation: "Rearrange DOM elements or use tabindex='0' to match visual order. Avoid positive tabindex.",
  });

const checkFocusableContent = (results) =>
  axeMetric(results, "focusable-content", {
    threshold: "All clickable items must be keyboard accessible.",
    passDetails: "All interactive elements are reachable via keyboard.",
    failDetails: (n) => `Keyboard-unreachable elements found (${n} occurrence(s)).`,
    cause: "Interactive elements (like buttons, links) cannot be reached using the Tab key.",
    recommendation: "Make elements focusable by using semantic HTML (button, a) or adding tabindex='0'.",
  });

const checkTabIndex = (results) =>
  axeMetric(results, "tabindex", {
    threshold: "Avoid custom tab orders for natural navigation.",
    passDetails: "No elements use positive tabindex.",
    failDetails: (n) => `Positive tabindex usage detected (${n} occurrence(s)).`,
    cause: "Elements with tabindex > 0 disrupt the natural tab order.",
    recommendation: "Remove positive tabindex values. Use document order or tabindex='0'.",
  });

const checkAriaHiddenFocus = (results) =>
  axeMetric(results, "aria-hidden-focus", {
    threshold: "Hidden content must not trap keyboard focus.",
    passDetails: "Hidden content (aria-hidden) contains no focusable elements.",
    failDetails: (n) => `Focusable elements hidden with aria-hidden (${n} occurrence(s)).`,
    cause: "Users can tab to elements that screen readers will ignore.",
    recommendation: "Remove aria-hidden from focusable elements or add tabindex='-1'.",
  });

// ── ARIA (Serious) ──
const checkAriaAllowedAttr = (results) =>
  axeMetric(results, "aria-allowed-attr", {
    threshold: "Accessibility tags must match their intended use.",
    passDetails: "ARIA attributes are valid for their roles.",
    failDetails: (n) => `Invalid ARIA attributes detected (${n} occurrence(s)).`,
    cause: "Some attributes are not permitted for the element's role (e.g., aria-checked on a button).",
    recommendation: "Remove invalid attributes or change the role to one that supports them.",
  });

const checkAriaRoles = (results) =>
  axeMetric(results, "aria-roles", {
    threshold: "Elements must be correctly identified (e.g., 'button').",
    passDetails: "All ARIA roles are valid.",
    failDetails: (n) => `Invalid ARIA roles found (${n} occurrence(s)).`,
    cause: "Elements use non-existent or abstract ARIA roles.",
    recommendation: "Check role spelling and ensure it exists in the WAI-ARIA specification.",
  });

// ── Image Alt (Serious) — shared evidence with On-Page SEO ──
const checkImageAlt = (results) =>
  axeMetric(results, "image-alt", {
    threshold: "All images must have text descriptions or be marked decorative.",
    passDetails: "All images have valid alt text.",
    failDetails: (n) => `Images missing alt text detected (${n} occurrence(s)).`,
    cause: "Images without alt text are invisible to screen readers.",
    recommendation: "Add descriptive alt text, or use alt='' for purely decorative images.",
  });

// ── Link & Button names (Serious) ──
const checkLinkName = (results) =>
  axeMetric(results, "link-name", {
    threshold: "All links must have clear, descriptive text.",
    passDetails: "All links have discernible text.",
    failDetails: (n) => `Links without discernible text detected (${n} occurrence(s)).`,
    cause: "Empty links or icon-only links without labels are confusing for screen readers.",
    recommendation: "Add text content, or use aria-label for icon links.",
  });

const checkButtonName = (results) =>
  axeMetric(results, "button-name", {
    threshold: "All buttons must have clear, descriptive labels.",
    passDetails: "All buttons have discernible text.",
    failDetails: (n) => `Buttons missing accessible labels detected (${n} occurrence(s)).`,
    cause: "Icon buttons or empty buttons without labels are unusable for screen readers.",
    recommendation: "Add text inside <button>, or use aria-label/aria-labelledby.",
  });

// ── HTML lang (Critical) — binary 0/100 via the two lang rules ──
const checkHtmlHasLang = (results) =>
  axeMetric(results, ["html-has-lang", "html-lang-valid"], {
    threshold: "Document language must be defined and valid (e.g., lang='en').",
    passDetails: "The <html> element has a valid lang attribute.",
    failDetails: () => "Missing or invalid lang attribute on <html>.",
    cause: "Screen readers need a valid lang attribute to select the correct voice profile.",
    recommendation: "Add a valid BCP-47 lang code (e.g. lang='en') to the <html> tag.",
  });

// ── Meta viewport / zoom (Serious) ──
const checkMetaViewport = (results) =>
  axeMetric(results, "meta-viewport", {
    threshold: "Users must be allowed to zoom in for readability (no user-scalable=no).",
    passDetails: "Viewport allows user scaling.",
    failDetails: () => "Viewport meta tag restricts zooming.",
    cause: "Disabling zoom prevents low-vision users from increasing text size.",
    recommendation: "Remove user-scalable='no' / maximum-scale='1' so content scales to at least 200%.",
  });

// ── Heading order (Moderate) ──
const checkHeadingOrder = (results) =>
  axeMetric(results, "heading-order", {
    threshold: "Headings must follow a logical hierarchy (H1 → H2 → H3).",
    passDetails: "Headings follow a logical hierarchy (h1 → h2).",
    failDetails: (n) => `Skipped heading levels detected (${n} occurrence(s)).`,
    cause: "Headings that skip levels (e.g., h1 → h3) confuse screen-reader navigation.",
    recommendation: "Ensure headings are sequential (h1 → h2 → h3) and use CSS for sizing.",
  });

// ── List structure (Moderate) — N/A when the page has no lists (rule 6) ──
const checkList = (results) => {
  const r = evaluateRule(results, "list");
  if (!r.applicable) {
    return notCalculated(
      "No <ul>/<ol> lists on this page, so list structure does not apply.",
      "When you add lists, ensure <ul>/<ol> contain only <li> elements directly."
    );
  }
  return axeMetric(results, "list", {
    threshold: "Lists must be correctly structured for screen readers.",
    passDetails: "All lists use valid structure (ul/ol/dl).",
    failDetails: (n) => `Improper list structure detected (${n} occurrence(s)).`,
    cause: "Lists (ul/ol) must only contain li elements directly.",
    recommendation: "Ensure <ul>/<ol> only contain <li> elements; move other content outside.",
  });
};

// ── Form Labels (Critical; blocking on PII/finance fields) — N/A with no inputs ──
async function checkLabel(results, page) {
  // Inspect the real form surface so we can (a) renormalize N/A when there are
  // no inputs and (b) escalate to blocking when sensitive PII/finance fields
  // are present (spec: label/contrast failures on PII forms are blocking).
  let inputInfo = { count: 0, pii: false, piiFields: [] };
  try {
    inputInfo = await page.evaluate(() => {
      const fields = Array.from(document.querySelectorAll("input, select, textarea")).filter((el) => {
        const t = (el.getAttribute("type") || "").toLowerCase();
        if (["hidden", "submit", "button", "reset", "image"].includes(t)) return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      const PII = /(ssn|social.?security|credit|card|cc.?num|cvv|account|routing|dob|birth|licen[sc]e|passport|tax.?id)/i;
      const piiFields = [];
      fields.forEach((el) => {
        const hay = `${el.name || ""} ${el.id || ""} ${el.getAttribute("autocomplete") || ""} ${el.getAttribute("placeholder") || ""}`;
        if (PII.test(hay)) piiFields.push((el.name || el.id || el.type || "field").slice(0, 40));
      });
      return { count: fields.length, pii: piiFields.length > 0, piiFields: piiFields.slice(0, 8) };
    });
  } catch (_) { /* DOM probe best-effort */ }

  if (!inputInfo.count) {
    return notCalculated(
      "No form inputs on this page, so label coverage does not apply.",
      "When forms are added (contact, finance, trade-in), give every input a programmatic <label> or aria-label."
    );
  }

  const r = evaluateRule(results, ["label", "label-title-only", "form-field-multiple-labels"]);
  const piiNote = inputInfo.pii
    ? ` Sensitive fields detected (${inputInfo.piiFields.join(", ")}) — unlabeled PII/finance inputs are blocking.`
    : "";

  if (r.status === "pass") {
    return {
      score: r.score,
      status: r.status,
      details: `All ${inputInfo.count} form input(s) are programmatically labeled.`,
      meta: passMeta("Every form input must have a programmatic label.", { inputCount: inputInfo.count, pii: inputInfo.pii, piiFields: inputInfo.piiFields }),
      analysis: null,
    };
  }
  return {
    // PII fields make any labeling failure blocking regardless of node ratio.
    score: inputInfo.pii ? Math.min(r.score, 25) : r.score,
    status: "fail",
    details: `Unlabeled form fields detected (${r.failNodes} occurrence(s)).${piiNote}`,
    meta: violationMeta(r.violation, "Every form input must have a programmatic label.", { inputCount: inputInfo.count, pii: inputInfo.pii, piiFields: inputInfo.piiFields }),
    analysis: {
      cause: "Inputs without a programmatic label are inaccessible to screen readers." + (inputInfo.pii ? " On finance/PII forms this is a blocking failure." : ""),
      recommendation: "Associate a <label for='id'>, or use aria-label/aria-labelledby on every input.",
    },
  };
}

// ── Document Title (Serious) — presence (axe) + cross-page uniqueness sampling ──
const checkDocumentTitle = async (results, page) => {
  const r = evaluateRule(results, "document-title");
  if (r.status !== "pass") {
    return {
      score: r.score,
      status: "fail",
      details: "Document title is missing or empty.",
      meta: violationMeta(r.violation, "Every page must have a unique, descriptive <title>."),
      analysis: {
        cause: "Without a title, users cannot identify the page in tabs or search results.",
        recommendation: "Add a unique, descriptive <title> element to the <head> of every page.",
      },
    };
  }

  let currentTitle = "";
  try { currentTitle = (await page.evaluate(() => document.title || "")).trim(); } catch (_) {}

  const sampled = [];
  const duplicates = [];
  let checkedCount = 0;
  try {
    const origin = new URL(page.url()).origin;
    const currentUrl = page.url().split("#")[0];
    const links = await page.evaluate((origin) => {
      const out = new Set();
      document.querySelectorAll("a[href]").forEach((a) => {
        try {
          const u = new URL(a.getAttribute("href"), location.href);
          if (u.origin === origin && !/\.(pdf|jpe?g|png|gif|svg|webp|zip|mp4|docx?|xml|json|css|js)$/i.test(u.pathname)) {
            out.add(u.href.split("#")[0]);
          }
        } catch (_) {}
      });
      return Array.from(out);
    }, origin);

    const candidates = links.filter((u) => u !== currentUrl).slice(0, 4);
    const fetched = await Promise.all(candidates.map(async (link) => {
      try {
        const { html } = await fastFetch(link, { timeout: 6000 });
        if (!html) return null;
        const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const t = m ? m[1].replace(/\s+/g, " ").trim() : "";
        return t ? { url: link, title: t } : null;
      } catch (_) { return null; }
    }));
    fetched.filter(Boolean).forEach(({ url, title }) => {
      checkedCount++;
      sampled.push({ url, title });
      if (currentTitle && title.toLowerCase() === currentTitle.toLowerCase()) duplicates.push({ url, title });
    });
  } catch (_) { /* sampling is best-effort */ }

  if (duplicates.length > 0) {
    return {
      score: 50,
      status: "warning",
      details: `Title "${currentTitle}" is duplicated on ${duplicates.length} other sampled page(s).`,
      meta: passMeta("Every page should have a unique, descriptive <title>.", { currentTitle, sampledPages: sampled, duplicates, checkedCount, unique: false }),
      analysis: {
        cause: "The same <title> is reused across pages, so users and screen readers can't tell them apart in tabs and history.",
        recommendation: "Give each page a unique, descriptive title — include the specific page/section plus the dealership name.",
      },
    };
  }

  const verified = checkedCount > 0;
  return {
    score: 100,
    status: "pass",
    details: verified
      ? `Page has a valid <title>, unique across ${checkedCount} sampled page(s).`
      : "Page has a valid, non-empty <title> (uniqueness not verified — no comparable pages sampled).",
    meta: passMeta("Every page should have a unique, descriptive <title>.", { currentTitle, sampledPages: sampled, duplicates: [], checkedCount, unique: verified ? true : null }),
    analysis: null,
  };
};

// ── Landmarks (Moderate) — graded by share of expected regions present ──
async function checkLandmarks(page) {
  const checks = [
    { name: "Main Content", selector: 'main, [role="main"]' },
    { name: "Navigation", selector: 'nav, [role="navigation"]' },
    { name: "Banner (Header)", selector: 'header, [role="banner"]' },
    { name: "Content Info (Footer)", selector: 'footer, [role="contentinfo"]' },
    { name: "Complementary (Aside)", selector: 'aside, [role="complementary"]' },
  ];
  const present = [];
  const missing = [];
  for (const check of checks) {
    if (await page.$(check.selector)) present.push(check.name);
    else missing.push(check.name);
  }

  // Main + Nav + Header/Footer are the load-bearing ones; weight them heavily.
  const hasMain = present.includes("Main Content");
  const core = ["Main Content", "Navigation", "Banner (Header)", "Content Info (Footer)"];
  const corePresent = core.filter((c) => present.includes(c)).length;
  let score = Math.round((corePresent / core.length) * 100);
  if (!hasMain) score = Math.min(score, 50); // no <main> is the worst single miss
  const status = score >= 75 ? "pass" : score >= 50 ? "warning" : "fail";

  const meta = passMeta("Primary regions (Main, Nav, Header, Footer) must be present.", { present, missing, count: present.length });
  if (status === "pass") {
    return { score, status, details: `Landmarks found: ${present.join(", ")}.`, meta, analysis: null };
  }
  return {
    score,
    status,
    details: missing.length ? `Missing landmark region(s): ${missing.join(", ")}.` : "Incomplete landmark structure.",
    meta,
    analysis: {
      cause: "Page structure is hard for screen readers to navigate without semantic landmark regions" + (hasMain ? "." : " — notably a <main> region is missing."),
      recommendation: "Use HTML5 semantic elements (main, nav, header, footer) or ARIA landmark roles.",
    },
  };
}

// ── Skip link (Moderate) ──
async function checkSkipLinks(page) {
  const links = await page.$$('a[href^="#"]');
  const brokenSkipLinks = [];
  for (const link of links) {
    const { href, text } = await page.evaluate((el) => ({
      href: el.getAttribute("href"),
      text: (el.innerText || "").toLowerCase(),
    }), link);
    if (text.includes("skip")) {
      const targetId = href.startsWith("#") ? href.substring(1) : href;
      const targetExists = targetId ? await page.evaluate((id) => !!document.getElementById(id), targetId) : false;
      if (targetExists) {
        return {
          score: 100,
          status: "pass",
          details: `Valid skip link found ("${text.trim()}" → "${href}").`,
          meta: passMeta("A 'Skip to content' link helps keyboard users bypass nav.", { linkText: text.trim(), target: href }),
          analysis: null,
        };
      }
      brokenSkipLinks.push(href);
    }
  }
  if (brokenSkipLinks.length > 0) {
    return {
      score: 30,
      status: "fail",
      details: `Skip link(s) found but target element(s) missing: ${brokenSkipLinks.join(", ")}.`,
      meta: passMeta("A 'Skip to content' link helps keyboard users bypass nav.", { brokenLinks: brokenSkipLinks }),
      analysis: {
        cause: "Clicking the skip link does nothing because the target ID does not exist.",
        recommendation: "Ensure the skip link href matches the id of the main content container.",
      },
    };
  }
  return {
    score: 40,
    status: "warning",
    details: "No 'Skip to content' link found.",
    meta: passMeta("A 'Skip to content' link helps keyboard users bypass nav."),
    analysis: {
      cause: "Keyboard users cannot bypass repetitive navigation to reach the main content.",
      recommendation: "Add a link with text 'Skip to content' pointing to <main id='content'>.",
    },
  };
}

// ── Interactive element affordance (Moderate) — non-semantic clickable elements ──
async function checkInteractiveElementAffordance(page) {
  let data = { total: 0, bad: 0, offenders: [] };
  try {
    data = await page.evaluate(() => {
      // div/span made clickable but lacking a role + keyboard affordance.
      const clickable = Array.from(document.querySelectorAll("[onclick], [class*='btn'], [class*='button']"))
        .filter((el) => {
          const tag = el.tagName.toLowerCase();
          if (["a", "button", "input", "select", "textarea"].includes(tag)) return false;
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        });
      const offenders = [];
      let bad = 0;
      clickable.forEach((el) => {
        const role = (el.getAttribute("role") || "").toLowerCase();
        const focusable = el.hasAttribute("tabindex") || ["button", "link"].includes(role);
        const named = role || el.getAttribute("aria-label") || (el.innerText || "").trim();
        if (!role || !focusable || !named) {
          bad++;
          if (offenders.length < 10) {
            const cls = typeof el.className === "string" ? el.className.slice(0, 40) : "";
            offenders.push({ tag: el.tagName.toLowerCase(), cls, text: (el.innerText || "").trim().slice(0, 40) });
          }
        }
      });
      return { total: clickable.length, bad, offenders };
    });
  } catch (_) { /* best-effort */ }

  if (data.total === 0) {
    return notCalculated(
      "No non-semantic clickable elements detected to assess affordance.",
      "Continue using native <button>/<a> for interactive controls."
    );
  }
  const score = Math.round(((data.total - data.bad) / data.total) * 100);
  const status = data.bad === 0 ? "pass" : score >= 50 ? "warning" : "fail";
  if (status === "pass") {
    return {
      score,
      status,
      details: "Interactive-looking elements expose proper roles and keyboard affordances.",
      meta: passMeta("Non-button elements must not be styled as buttons without a role.", { total: data.total }),
      analysis: null,
    };
  }
  return {
    score,
    status,
    details: `${data.bad} clickable element(s) lack a role/keyboard affordance.`,
    meta: passMeta("Non-button elements must not be styled as buttons without a role.", { total: data.total, bad: data.bad, offenders: data.offenders, confidence: "heuristic" }),
    analysis: {
      cause: "Elements styled or wired as buttons (div/span with onclick) lack role='button' and keyboard support.",
      recommendation: "Use native <button>/<a>, or add role='button' + tabindex='0' + keydown handling.",
    },
  };
}

// ── Keyboard Navigation (Critical, weighted) — composite of the 4 sub-checks ──
const checkKeyboardNavigation = ({ focusOrder, focusableContent, tabindex, ariaHiddenFocus }) => {
  const parts = [
    { key: "Focus_Order", weight: 8, metric: focusOrder },
    { key: "Focusable_Content", weight: 6, metric: focusableContent },
    { key: "Tab_Index", weight: 5, metric: tabindex },
    { key: "Aria_Hidden_Focus", weight: 3, metric: ariaHiddenFocus },
  ];
  let totalWeight = 0;
  let earned = 0;
  const breakdown = {};
  const failing = [];
  for (const part of parts) {
    const m = part.metric;
    breakdown[part.key] = { score: m.score, status: m.status, details: m.details };
    totalWeight += part.weight;
    earned += (m.score / 100) * part.weight;
    if (m.status !== "pass") failing.push(part.key.replace(/_/g, " "));
  }
  const score = totalWeight > 0 ? parseFloat(((earned / totalWeight) * 100).toFixed(0)) : 100;
  let status = "pass";
  if (parts.some((p) => p.metric.status === "fail")) status = "fail";
  else if (parts.some((p) => p.metric.status === "warning")) status = "warning";

  const meta = passMeta("All interactive content must be operable with a keyboard alone.", { components: parts.map((p) => p.key), breakdown });
  if (status === "pass") {
    return { score, status, details: "Page is fully operable by keyboard (logical focus order, reachable content, natural tab order, no focus traps).", meta, analysis: null };
  }
  return {
    score,
    status,
    details: `Keyboard navigation issues detected in: ${failing.join(", ")}.`,
    meta,
    analysis: {
      cause: "One or more keyboard-operability checks failed (focus order, focusable content, tab index, or aria-hidden focus traps).",
      recommendation: "Resolve the failing sub-checks: logical focus order, all interactive elements focusable, no positive tabindex, no focusable nodes inside aria-hidden regions.",
    },
  };
};

// ── WCAG 2.2: Target Size 2.5.8 (Serious, weighted) — ≥ 24×24 CSS px ──
async function checkTargetSize(page) {
  let data = { total: 0, small: 0, offenders: [] };
  try {
    data = await page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('a[href], button, input:not([type=hidden]), select, [role=button], [role=link]'));
      const offenders = [];
      let total = 0;
      let small = 0;
      for (const el of els) {
        const st = getComputedStyle(el);
        if (st.display === "none" || st.visibility === "hidden") continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // inline links inside a text flow are exempt from 2.5.8
        const inText = el.tagName.toLowerCase() === "a" && st.display === "inline";
        if (inText) continue;
        total++;
        if (r.width < 24 || r.height < 24) {
          small++;
          if (offenders.length < 10) offenders.push({ tag: el.tagName.toLowerCase(), w: Math.round(r.width), h: Math.round(r.height), text: (el.innerText || el.getAttribute("aria-label") || "").trim().slice(0, 40) });
        }
      }
      return { total, small, offenders };
    });
  } catch (_) { /* best-effort */ }

  if (!data.total) {
    return notCalculated(
      "No sizeable interactive targets found to measure on this page.",
      "Ensure tap targets are at least 24×24 CSS px (ideally 44×44) once added."
    );
  }
  const passing = data.total - data.small;
  const score = Math.round((passing / data.total) * 100);
  const status = data.small === 0 ? "pass" : score >= 50 ? "warning" : "fail";
  const threshold = "Tap/click targets should be at least 24×24 CSS px (WCAG 2.5.8).";
  if (status === "pass") {
    return { score, status, details: `All ${data.total} measured targets meet the 24×24px minimum.`, meta: passMeta(threshold, { total: data.total }), analysis: null };
  }
  return {
    score,
    status,
    details: `${data.small} of ${data.total} interactive targets are smaller than 24×24px.`,
    meta: passMeta(threshold, { total: data.total, small: data.small, offenders: data.offenders, confidence: "heuristic" }),
    analysis: {
      cause: "Small tap targets are hard to hit accurately on touch screens — a major issue for mobile dealer CTAs.",
      recommendation: "Increase padding/size so interactive controls are at least 24×24 CSS px (44×44 recommended for primary CTAs).",
    },
  };
}

// ── WCAG 2.2: Reflow 1.4.10 (Serious, weighted) — no horizontal scroll @ 320px ──
async function checkReflow(page) {
  let original = null;
  try { original = page.viewportSize(); } catch (_) {}
  try {
    await page.setViewportSize({ width: 320, height: 800 });
    const res = await page.evaluate(() => {
      const doc = document.documentElement;
      const overflow = doc.scrollWidth - window.innerWidth;
      const offenders = [];
      if (overflow > 1) {
        document.querySelectorAll("body *").forEach((el) => {
          if (offenders.length >= 8) return;
          const r = el.getBoundingClientRect();
          if (r.right > window.innerWidth + 2 && r.width > 40) {
            const cls = typeof el.className === "string" ? el.className.slice(0, 40) : "";
            offenders.push({ tag: el.tagName.toLowerCase(), cls, right: Math.round(r.right) });
          }
        });
      }
      return { scrollWidth: doc.scrollWidth, innerWidth: window.innerWidth, overflow, offenders };
    });
    const threshold = "Content must reflow without horizontal scrolling at 320 CSS px (WCAG 1.4.10).";
    const overflow = res.overflow || 0;
    if (overflow <= 1) {
      return { score: 100, status: "pass", details: "Content reflows cleanly at 320px with no horizontal scroll.", meta: passMeta(threshold, { scrollWidth: res.scrollWidth, viewport: res.innerWidth }), analysis: null };
    }
    // graded: small overflow is a warning, large is a fail
    const score = overflow > 80 ? 25 : 55;
    return {
      score,
      status: overflow > 80 ? "fail" : "warning",
      details: `Page overflows by ${overflow}px at a 320px viewport (horizontal scrolling required).`,
      meta: passMeta(threshold, { overflow, scrollWidth: res.scrollWidth, viewport: res.innerWidth, offenders: res.offenders, confidence: "heuristic" }),
      analysis: {
        cause: "Fixed-width elements (wide tables, images, or containers) force horizontal scrolling on small screens / at high zoom.",
        recommendation: "Use responsive units (%, max-width:100%), wrap wide tables in an overflow-x container, and avoid fixed pixel widths.",
      },
    };
  } catch (err) {
    return notCalculated("Reflow check could not run (viewport resize unavailable).", "Manually verify the page has no horizontal scroll at a 320px width / 400% zoom.");
  } finally {
    try { if (original) await page.setViewportSize(original); } catch (_) {}
  }
}

// ── WCAG 2.2: Text Spacing 1.4.12 (INFO-ONLY) — content survives spacing overrides ──
async function checkTextSpacing(page) {
  let data = { clipped: 0, offenders: [] };
  try {
    data = await page.evaluate(() => {
      const STYLE_ID = "__a11y_text_spacing__";
      const prev = document.getElementById(STYLE_ID);
      if (prev) prev.remove();
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = `* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-bottom: 2em !important; }`;
      document.head.appendChild(style);
      // force reflow
      void document.body.offsetHeight;
      const offenders = [];
      let clipped = 0;
      document.querySelectorAll("p, li, h1, h2, h3, h4, span, a, button, td, label").forEach((el) => {
        const st = getComputedStyle(el);
        const overflowsHidden = (st.overflow === "hidden" || st.overflowY === "hidden" || st.overflowX === "hidden");
        if (overflowsHidden && (el.scrollHeight > el.clientHeight + 2 || el.scrollWidth > el.clientWidth + 2)) {
          clipped++;
          if (offenders.length < 8) {
            const cls = typeof el.className === "string" ? el.className.slice(0, 40) : "";
            offenders.push({ tag: el.tagName.toLowerCase(), cls });
          }
        }
      });
      style.remove();
      return { clipped, offenders };
    });
  } catch (_) { /* best-effort */ }

  const threshold = "Text must not be clipped when users override line/letter/word spacing (WCAG 1.4.12).";
  const ok = data.clipped === 0;
  return {
    score: ok ? 100 : 50,
    status: ok ? "pass" : "warning",
    infoOnly: true,
    details: ok
      ? "Content survives WCAG text-spacing overrides without clipping (automated probe — confirm visually)."
      : `${data.clipped} element(s) clip their content under text-spacing overrides — verify manually.`,
    meta: passMeta(threshold, { informational: true, confidence: "heuristic", clipped: data.clipped, offenders: data.offenders }),
    analysis: ok ? null : {
      cause: "Containers with fixed heights and overflow:hidden cut off text when users increase spacing for readability.",
      recommendation: "Avoid fixed heights on text containers; allow them to grow, and avoid overflow:hidden on body copy.",
    },
  };
}

// ── WCAG 2.2: Focus Not Obscured 2.4.11 (INFO-ONLY) — sticky headers ──
async function checkFocusNotObscured(page) {
  let data = { stickyHeader: false, headerHeight: 0, scrollPadding: false };
  try {
    data = await page.evaluate(() => {
      let stickyHeader = false;
      let headerHeight = 0;
      document.querySelectorAll("header, nav, [class*='header'], [class*='navbar']").forEach((el) => {
        const st = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if ((st.position === "fixed" || st.position === "sticky") && r.top <= 0 && r.height > 10) {
          stickyHeader = true;
          headerHeight = Math.max(headerHeight, Math.round(r.height));
        }
      });
      const rootStyle = getComputedStyle(document.documentElement);
      const scrollPadding = parseFloat(rootStyle.scrollPaddingTop) > 0;
      return { stickyHeader, headerHeight, scrollPadding };
    });
  } catch (_) { /* best-effort */ }

  const threshold = "A focused element must not be fully hidden behind sticky headers (WCAG 2.4.11).";
  if (!data.stickyHeader) {
    return { score: 100, status: "pass", infoOnly: true, details: "No sticky/fixed header that could obscure focused elements.", meta: passMeta(threshold, { informational: true, confidence: "heuristic", stickyHeader: false }), analysis: null };
  }
  const ok = data.scrollPadding;
  return {
    score: ok ? 100 : 50,
    status: ok ? "pass" : "warning",
    infoOnly: true,
    details: ok
      ? `Sticky header (${data.headerHeight}px) is offset by scroll-padding, so focused elements stay visible.`
      : `Sticky header (${data.headerHeight}px) detected with no scroll-padding-top — focused elements may be hidden beneath it. Verify by tabbing.`,
    meta: passMeta(threshold, { informational: true, confidence: "heuristic", stickyHeader: true, headerHeight: data.headerHeight, scrollPadding: data.scrollPadding }),
    analysis: ok ? null : {
      cause: "When a focused element scrolls under a sticky header, keyboard users lose track of where they are.",
      recommendation: "Add scroll-padding-top equal to the header height on the root element, or use scroll-margin on focus targets.",
    },
  };
}

// ── WCAG 2.2-era: Prefers-Reduced-Motion (INFO-ONLY) ──
async function checkReducedMotion(page) {
  let data = { motion: false, reducedMotionRule: false, autoplay: 0 };
  try {
    data = await page.evaluate(() => {
      let reducedMotionRule = false;
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule.media && /prefers-reduced-motion/i.test(rule.media.mediaText || "")) { reducedMotionRule = true; break; }
          }
        } catch (_) { /* cross-origin stylesheet — skip */ }
        if (reducedMotionRule) break;
      }
      let motion = false;
      const sample = Array.from(document.querySelectorAll("body *")).slice(0, 600);
      for (const el of sample) {
        const st = getComputedStyle(el);
        if ((st.animationName && st.animationName !== "none") || (st.transitionDuration && parseFloat(st.transitionDuration) > 0.1)) { motion = true; break; }
      }
      const autoplay = document.querySelectorAll("video[autoplay], [class*='marquee'], [class*='carousel']").length;
      return { motion: motion || autoplay > 0, reducedMotionRule, autoplay };
    });
  } catch (_) { /* best-effort */ }

  const threshold = "Sites with animation should honor the prefers-reduced-motion setting.";
  if (!data.motion) {
    return { score: 100, status: "pass", infoOnly: true, details: "No significant animation/motion detected.", meta: passMeta(threshold, { informational: true, confidence: "heuristic", motion: false }), analysis: null };
  }
  const ok = data.reducedMotionRule;
  return {
    score: ok ? 100 : 50,
    status: ok ? "pass" : "warning",
    infoOnly: true,
    details: ok
      ? "Animation present and a prefers-reduced-motion media query is defined."
      : "Animation/motion present but no prefers-reduced-motion media query found — users who request reduced motion may not be accommodated.",
    meta: passMeta(threshold, { informational: true, confidence: "heuristic", motion: true, reducedMotionRule: data.reducedMotionRule, autoplay: data.autoplay }),
    analysis: ok ? null : {
      cause: "Motion (animations, autoplay carousels) can trigger nausea/migraines for users with vestibular disorders.",
      recommendation: "Add a @media (prefers-reduced-motion: reduce) block that disables or reduces non-essential animation.",
    },
  };
}

// ── WCAG AA Compliance summary (INFO-ONLY) — aggregate over axe A/AA rules ──
const checkWcagAACompliance = (results) => {
  const AA_TAGS = new Set(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]);
  const isAA = (node) => Array.isArray(node.tags) && node.tags.some((t) => AA_TAGS.has(t));

  const violations = (results.violations || []).filter(isAA);
  const passes = (results.passes || []).filter(isAA);

  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const violatedRules = [];
  violations.forEach((v) => {
    const imp = v.impact || "moderate";
    if (byImpact[imp] !== undefined) byImpact[imp]++;
    if (violatedRules.length < 20) violatedRules.push({ id: v.id, impact: imp, help: v.help, nodes: v.nodes ? v.nodes.length : 0 });
  });

  const passCount = passes.length;
  const violationCount = violations.length;
  const totalRules = passCount + violationCount;
  const ratio = totalRules > 0 ? (passCount / totalRules) * 100 : 100;
  let score = Math.round(ratio);
  if (byImpact.critical > 0) score = Math.min(score, 50);
  else if (byImpact.serious > 0) score = Math.min(score, 70);
  else if (byImpact.moderate > 0) score = Math.min(score, 85);
  score = Math.max(0, Math.min(100, score));

  let grade;
  let status;
  if (violationCount === 0) { grade = "Conformant (automated checks)"; status = "pass"; }
  else if (byImpact.critical > 0 || score < 60) { grade = "Non-conformant"; status = "fail"; }
  else { grade = "Partially conformant"; status = "warning"; }

  const meta = {
    grade, score, confidence: "heuristic",
    conformanceRatio: Math.round(ratio),
    passedRules: passCount,
    violatedRuleCount: violationCount,
    byImpact, violatedRules,
    note: COVERAGE_NOTE,
  };

  if (status === "pass") {
    return { score, status, infoOnly: true, details: `Passes all ${passCount} axe-testable WCAG A/AA rules.`, meta, analysis: null };
  }
  return {
    score, status, infoOnly: true,
    details: `${violationCount} WCAG A/AA rule(s) failing (${byImpact.critical} critical, ${byImpact.serious} serious, ${byImpact.moderate} moderate, ${byImpact.minor} minor).`,
    meta,
    analysis: {
      cause: "One or more automated WCAG A/AA success criteria are failing, so the page does not meet Level AA conformance for the axe-testable rules.",
      recommendation: "Fix failing rules starting with critical and serious impact (contrast, names/labels, ARIA, structure), then re-test and complete a manual AA audit.",
    },
  };
};

export default async function accessibilityMetrics(page) {
  // Neutralize the stealth plugin's Function.prototype.toString proxy before
  // running axe — axe serializes functions and the proxy recurses forever.
  try {
    await page.evaluate(() => {
      const native = function toString() { return "function () { [native code] }"; };
      try {
        Object.defineProperty(Function.prototype, "toString", { value: native, writable: true, configurable: true });
      } catch (_) { /* non-configurable — best effort */ }
    });
  } catch (_) { /* page context unavailable — axe will try anyway */ }

  let axeResults;
  try {
    axeResults = await new AxeBuilder({ page }).analyze();
  } catch (err) {
    logger.error("Axe analysis failed", new Error(err.message));
    axeResults = { violations: [], passes: [], incomplete: [], inapplicable: [] };
  }

  // axe-backed parameters
  const colorContrast = checkColorContrast(axeResults);
  const focusOrder = checkFocusOrder(axeResults);
  const focusableContent = checkFocusableContent(axeResults);
  const tabindex = checkTabIndex(axeResults);
  const ariaAllowedAttr = checkAriaAllowedAttr(axeResults);
  const ariaRoles = checkAriaRoles(axeResults);
  const ariaHiddenFocus = checkAriaHiddenFocus(axeResults);
  const imageAlt = checkImageAlt(axeResults);
  const linkName = checkLinkName(axeResults);
  const buttonName = checkButtonName(axeResults);
  const htmlHasLang = checkHtmlHasLang(axeResults);
  const metaViewport = checkMetaViewport(axeResults);
  const list = checkList(axeResults);
  const headingOrder = checkHeadingOrder(axeResults);
  const wcagAACompliance = checkWcagAACompliance(axeResults);

  // async / DOM-probe parameters (each guarded so one failure can't sink the section)
  const safe = async (fn, fallbackReason) => {
    try { return await fn(); } catch (e) {
      return notCalculated(`${fallbackReason} (${e?.message || "probe failed"}).`, "Re-run the audit; if it persists, verify this manually.");
    }
  };

  const label = await safe(() => checkLabel(axeResults, page), "Form-label check could not run");
  const documentTitle = await safe(() => checkDocumentTitle(axeResults, page), "Document-title check could not run");
  const skipLinks = await safe(() => checkSkipLinks(page), "Skip-link check could not run");
  const landMarks = await safe(() => checkLandmarks(page), "Landmark check could not run");
  const interactiveElementAffordance = await safe(() => checkInteractiveElementAffordance(page), "Affordance check could not run");
  const targetSize = await safe(() => checkTargetSize(page), "Target-size check could not run");
  const textSpacing = await safe(() => checkTextSpacing(page), "Text-spacing check could not run");
  const focusNotObscured = await safe(() => checkFocusNotObscured(page), "Focus-obscured check could not run");
  const reducedMotion = await safe(() => checkReducedMotion(page), "Reduced-motion check could not run");
  // Reflow resizes the viewport, so run it LAST and let it restore the size.
  const reflow = await safe(() => checkReflow(page), "Reflow check could not run");

  const keyboardNavigation = checkKeyboardNavigation({ focusOrder, focusableContent, tabindex, ariaHiddenFocus });

  // ── Severity-tiered weighting (spec rule 5): Critical ×3, Serious ×2, Moderate ×1.
  // Keyboard is weighted ONCE via the composite; its sub-parts are display-only.
  // Informational params (WCAG summary + the three manual-review WCAG 2.2 checks)
  // carry weight 0. N/A params (null score) are dropped from the denominator.
  const weighted = [
    // Critical ×3
    { key: "Color_Contrast", metric: colorContrast, weight: 3, tier: "critical" },
    { key: "Label", metric: label, weight: 3, tier: "critical" },
    { key: "Html_Has_Lang", metric: htmlHasLang, weight: 3, tier: "critical" },
    { key: "Keyboard_Navigation", metric: keyboardNavigation, weight: 3, tier: "critical" },
    // Serious ×2
    { key: "Image_Alt", metric: imageAlt, weight: 2, tier: "serious" },
    { key: "Link_Name", metric: linkName, weight: 2, tier: "serious" },
    { key: "Button_Name", metric: buttonName, weight: 2, tier: "serious" },
    { key: "Aria_Roles", metric: ariaRoles, weight: 2, tier: "serious" },
    { key: "Aria_Allowed_Attr", metric: ariaAllowedAttr, weight: 2, tier: "serious" },
    { key: "Document_Title", metric: documentTitle, weight: 2, tier: "serious" },
    { key: "Meta_Viewport", metric: metaViewport, weight: 2, tier: "serious" },
    { key: "Target_Size", metric: targetSize, weight: 2, tier: "serious" },
    { key: "Reflow", metric: reflow, weight: 2, tier: "serious" },
    // Moderate ×1
    { key: "Heading_Order", metric: headingOrder, weight: 1, tier: "moderate" },
    { key: "Landmarks", metric: landMarks, weight: 1, tier: "moderate" },
    { key: "List", metric: list, weight: 1, tier: "moderate" },
    { key: "Skip_Links", metric: skipLinks, weight: 1, tier: "moderate" },
    { key: "Interactive_Element_Affordance", metric: interactiveElementAffordance, weight: 1, tier: "moderate" },
  ];

  let totalWeight = 0;
  let earned = 0;
  let criticalFail = false;
  let seriousFail = false;
  for (const w of weighted) {
    const m = w.metric;
    if (!m || typeof m.score !== "number") continue; // N/A → renormalized out
    totalWeight += w.weight;
    earned += (m.score / 100) * w.weight;
    if (m.status === "fail") {
      if (w.tier === "critical") criticalFail = true;
      else if (w.tier === "serious") seriousFail = true;
    }
  }

  let pct = totalWeight > 0 ? parseFloat(((earned / totalWeight) * 100).toFixed(0)) : 0;
  // Rule 5 — a blocking failure must dominate cosmetics.
  if (criticalFail) pct = Math.min(pct, 70);
  else if (seriousFail) pct = Math.min(pct, 85);
  // §2.3 — automated checks are ~30–40% of WCAG; never claim 100% accessible.
  pct = Math.min(pct, 96);

  return {
    Percentage: pct,
    // §0.5 — automated DOM/accessibility-tree inference (consistent with On-Page SEO).
    Confidence: "heuristic",
    Coverage: "Automated WCAG 2.2 AA coverage (~30–40% of success criteria).",
    Note: COVERAGE_NOTE,
    WCAG_AA_Compliance: wcagAACompliance,
    // Critical
    Color_Contrast: colorContrast,
    Label: label,
    Html_Has_Lang: htmlHasLang,
    Keyboard_Navigation: keyboardNavigation,
    // Keyboard sub-parts (display-only — folded into Keyboard_Navigation, not re-weighted)
    Focus_Order: focusOrder,
    Focusable_Content: focusableContent,
    Tab_Index: tabindex,
    Aria_Hidden_Focus: ariaHiddenFocus,
    // Serious
    Image_Alt: imageAlt,
    Link_Name: linkName,
    Button_Name: buttonName,
    Aria_Roles: ariaRoles,
    Aria_Allowed_Attr: ariaAllowedAttr,
    Document_Title: documentTitle,
    Meta_Viewport: metaViewport,
    Target_Size: targetSize,
    Reflow: reflow,
    // Moderate
    Heading_Order: headingOrder,
    Landmarks: landMarks,
    List: list,
    Skip_Links: skipLinks,
    Interactive_Element_Affordance: interactiveElementAffordance,
    // Informational (weight 0)
    Text_Spacing: textSpacing,
    Focus_Not_Obscured: focusNotObscured,
    Reduced_Motion: reducedMotion,
  };
}
