import googleAPI from "../utils/googleAPI.js";
import fetch from "node-fetch";
import * as cheerio from "cheerio";
import logger from "../utils/logger.js";
import { isParamApplicable } from "../config/siteTypeProfiles.js";
import { importanceFor } from "../config/parameterImportance.js";

// Per-parameter weight tilt for this section, by site sub-type — 1.0 for a
// franchise dealer and for corporate/unresolved sites.
//
// Scope note: this section's HEADLINE (`Percentage`) is PageSpeed's own
// Lighthouse score, not a weighted roll-up of the rows below, so the tilt moves
// the two derived numbers — Delivery_Hygiene and Graded_Percentage — and not the
// headline. That is correct rather than a gap: Lighthouse's weighting is
// Google's, and the matrix rates Technical as nearly flat across the four types
// anyway ("physics does not care about business model"). Where the site type
// genuinely changes what Technical is worth is at the section level, in
// config/siteTypeProfiles.js.
const importance = importanceFor("Technical Performance");

// Abramowitz-Stegun erf approximation (max err ~1.5e-7) — needed for the log-normal CDF.
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// Spec §0.3 rule 1 — "graded, not binary". Lighthouse-style LOG-NORMAL scoring for
// latency/CWV metrics (lower-is-better). The two control points are reused from each
// metric's existing thresholds: `good` is the p10 point (scores ~90) and `poor` is the
// median (scores 50); the tail decays smoothly toward 0. This reproduces the spec's
// worked example (LCP 2.6s → ~88) instead of the old linear cliff (which gave 93/0).
// The constant 0.9061938024368232 = √2·erf⁻¹(0.8), which fixes CDF(p10)=0.9.
function calculateScore(observed, good, poor) {
  const value = Number(observed) || 0;
  if (value <= 0) return 100;
  const p10 = good, median = poor; // good < poor for every lower-is-better metric here
  const location = Math.log(median);
  const shape = Math.abs(Math.log(p10) - location) / (Math.SQRT2 * 0.9061938024368232);
  if (!(shape > 0)) return value <= median ? 100 : 0; // degenerate guard
  const standardizedX = (Math.log(value) - location) / (Math.SQRT2 * shape);
  const score = (1 - erf(standardizedX)) / 2;
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

function calculateStatus(value, goodThreshold, needsImprovementThreshold) {
  if (value <= goodThreshold) return "pass";
  if (value <= needsImprovementThreshold) return "warning";
  return "fail";
}

// Standard result for a metric that genuinely could not be measured (missing upstream
// Lighthouse/CrUX data, a blocked/failed render, or an API/quota failure). score/status
// are null so it is excluded from any weighted total rather than counted as a 0, and
// meta.notScored tells the frontend to render the "Why this wasn't calculated" banner
// (MetricExtras.NotCalculatedNote) using `details` + `analysis.recommendation`.
function notCalculated(reason, recommendation) {
  return {
    score: null,
    status: null,
    details: reason,
    analysis: { recommendation },
    meta: {
      value: "Not measured",
      notScored: true,
      reason,
      informational: true,
    },
  };
}

/**
 * Read one Lighthouse audit's numericValue, distinguishing "measured 0" from "not measured".
 *
 * PageSpeed can return HTTP 200 with a full lighthouseResult whose INDIVIDUAL audits
 * failed. Measured on rvcountry.com 2026-08-07: 47 audits returned, but LCP and TBT
 * carried `errorMessage: "NO_LCP"` and no numericValue — which is exactly why Lighthouse
 * itself scored the whole performance category `null`.
 *
 * `audits[id]?.numericValue || 0` cannot tell that apart from a genuine zero, and
 * calculateScore(0) returns 100. So the two heaviest metrics in this section (LCP 22,
 * INP·TBT 20) were reported as a perfect "pass" on a page where nothing was measured,
 * and the headline came out ~87 where PageSpeed Insights itself shows n/a.
 *
 * null here means "Lighthouse could not measure it" (→ notCalculated, excluded from the
 * weighted total); 0 still means a real, perfect zero, which CLS and TBT legitimately hit.
 */
const labValueOf = (audits, id) => {
  const value = audits?.[id]?.numericValue;
  return typeof value === "number" && Number.isFinite(value) ? value : null;
};

// Why a specific lab metric is missing, in the target page's terms rather than ours.
// Lighthouse's own errorMessage ("NO_LCP", "NO_FCP", …) is the most precise thing we
// have, so lead with it when present.
const labUnmeasured = (audits, id, label) => notCalculated(
  `Lighthouse loaded the page but could not measure ${label} (${audits?.[id]?.errorMessage || "no value returned for this audit"}). It is excluded from the score rather than counted as a perfect zero.`,
  `Open the page in Google PageSpeed Insights to confirm — Google reports the same gap. This usually means the page never produced a qualifying measurement: an immediate redirect, a first paint gated behind JavaScript or a consent wall, or content that only appears after interaction.`
);

// Format a millisecond value as seconds for display (e.g. 1800 -> "1.8s", 234 -> "0.23s").
// Used by the latency Core Web Vitals (FCP, INP, FID, TBT) whose value + threshold scale
// are surfaced in seconds. Scoring still runs on the raw ms numbers above.
const msToSec = (ms) => `${parseFloat(((Number(ms) || 0) / 1000).toFixed(2))}s`;

// LCP - Largest Contentful Paint
const evaluateLCPLab = (audits) => {
  const raw = labValueOf(audits, "largest-contentful-paint");
  if (raw === null) return labUnmeasured(audits, "largest-contentful-paint", "Largest Contentful Paint");
  const labValue = parseFloat(raw.toFixed(0));
  const labScore = calculateScore(labValue, 2500, 4000);
  const labStatus = calculateStatus(labValue, 2500, 4000);

  // Identify specific LCP Element
  const lcpElementAudit = audits["largest-contentful-paint-element"];
  const lcpElementItems = lcpElementAudit?.details?.items || [];
  const lcpItem = lcpElementItems[0] || {};
  const lcpElement = lcpItem.node?.nodeLabel || lcpItem.node?.selector || "Unknown element";

  const causes = [];
  const recommendations = [];

  if (labStatus !== "pass") {
    // Check TTFB (Time to First Byte)
    const ttfbVal = audits["server-response-time"]?.numericValue || 0;
    if (ttfbVal > 600) {
      causes.push(`High Server Response Time (TTFB: ${Math.round(ttfbVal)}ms)`);
      recommendations.push("Optimize backend performance, database queries, or use a CDN.");
    }

    // Check Render Blocking Resources
    const blockingResources = audits["render-blocking-resources"]?.details?.items || [];
    if (blockingResources.length > 0) {
      causes.push(`${blockingResources.length} Render-blocking resource(s) found`);
      recommendations.push("Defer non-critical JS/CSS and inline critical styles.");
    }

    // Check for large unoptimized images if LCP is an image
    const unoptimizedImages = audits["uses-optimized-images"]?.details?.items || [];
    if (unoptimizedImages.length > 0 && lcpElement.includes("Image")) {
      causes.push("Unoptimized images affecting load time");
      recommendations.push("Compress and resize images. Use Next-Gen formats like WebP.");
    }

    if (causes.length === 0) {
      causes.push("General main-thread blocking or large resources");
      recommendations.push("Review network waterfall and reduce main-thread work.");
    }
  }

  return {
    score: labScore,
    status: labStatus,
    details: labStatus === "pass" ? "LCP is within optimal range." : `LCP is delayed (${msToSec(labValue)}).`,
    meta: {
      value: msToSec(labValue),
      lcpElement,
      thresholds: { Good: "0-2.5s", Warning: "2.5-4s", Poor: "4s+" }
    },
    analysis: labStatus === "pass" ? null : {
      cause: causes[0] || "General main-thread blocking or large resources",
      recommendation: recommendations[0] || "Review network waterfall and reduce main-thread work."
    }
  };
};

const evaluateLCPCrux = (audits, cruxMetrics) => {
  const fieldValue = cruxMetrics["LARGEST_CONTENTFUL_PAINT_MS"]?.percentile || null;

  if (fieldValue === null) return null;

  const fieldStatus = calculateStatus(fieldValue, 2500, 4000);
  const fieldScore = calculateScore(fieldValue, 2500, 4000);

  const causes = [];
  const recommendations = [];

  if (fieldStatus !== "pass") {
    // 1. Check TTFB (Server Response Time)
    const ttfbVal = audits["server-response-time"]?.numericValue || 0;
    if (ttfbVal > 600) {
      causes.push(`Slow Server Response detected in lab (${Math.round(ttfbVal)}ms)`);
      recommendations.push("Optimize server/database and implement caching policies.");
    }

    // 2. Check Render Blocking Resources
    const blocking = audits["render-blocking-resources"]?.details?.items || [];
    if (blocking.length > 0) {
      causes.push(`${blocking.length} render-blocking resources delaying paint`);
      recommendations.push("Eliminate render-blocking resources (defer JS, inline critical CSS).");
    }

    // 3. Unoptimized Images
    const unoptimized = audits["uses-optimized-images"]?.details?.items || [];
    if (unoptimized.length > 0) {
      causes.push("Unoptimized images impacting load time");
      recommendations.push("Serve images in next-gen formats (WebP/AVIF) and proper sizes.");
    }

    // 4. Text Compression
    const unminified = audits["unminified-javascript"]?.details?.items?.length || 0;
    if (unminified > 0) {
      causes.push("Unminified JavaScript payloads");
      recommendations.push("Minify JavaScript and enable text compression (Gzip/Brotli).");
    }

    if (causes.length === 0) {
      causes.push("Network or device latency variations");
      recommendations.push("Use a CDN and reduce total page weight for constrained devices.");
    }
  }

  return {
    score: fieldScore,
    status: fieldStatus,
    details: fieldStatus === "pass" ? "LCP (Real Users) is within optimal range." : `Real users experience LCP delay (${msToSec(fieldValue)}).`,
    meta: {
      value: msToSec(fieldValue),
      p75: true,
      thresholds: { Good: "0-2.5s", Warning: "2.5-4s", Poor: "4s+" }
    },
    analysis: fieldStatus === "pass" ? null : {
      cause: causes[0] || "Network or device latency variations",
      recommendation: recommendations[0] || "Use a CDN and reduce total page weight for constrained devices."
    }
  };
};

// CLS - Cumulative Layout Shift
const evaluateCLSLab = (audits) => {
  const raw = labValueOf(audits, "cumulative-layout-shift");
  if (raw === null) return labUnmeasured(audits, "cumulative-layout-shift", "Cumulative Layout Shift");
  const labValue = parseFloat(raw.toFixed(3));
  const labScore = calculateScore(labValue, 0.1, 0.25);
  const labStatus = calculateStatus(labValue, 0.1, 0.25);

  const causes = [];
  const recommendations = [];

  if (labStatus !== "pass") {
    // Check Unsized Images
    const unsized = audits["unsized-images"]?.details?.items || [];
    if (unsized.length > 0) {
      causes.push("Images missing width/height attributes causing reflow");
      recommendations.push("Add explicit `width` and `height` attributes to all images.");
    }

    // Check Layout Shifts
    const largeShifts = audits["layout-shifts"]?.details?.items || [];
    if (largeShifts.length > 0) {
      causes.push("Elements shifting position dynamically");
      recommendations.push("Ensure ads/embeds have reserved space and avoid inserting content above existing content.");
    }

    // Font Loading
    const fontDisplay = audits["font-display"]?.details?.items || [];
    if (fontDisplay.length > 0) {
      causes.push("FOUT/FOIT causing layout shifts on font load");
      recommendations.push("Use `font-display: swap` or preload key fonts.");
    }

    if (causes.length === 0) {
      causes.push("Dynamic content shifts not caught by specific audits");
      recommendations.push("Review late-loading content such as ads or banners.");
    }
  }

  return {
    score: labScore,
    status: labStatus,
    details: labStatus === "pass" ? "Visual stability is excellent." : `Layout shifts detected (${labValue}).`,
    meta: {
      value: labValue,
      thresholds: { Good: "0-0.1", Warning: "0.1-0.25", Poor: "0.25+" }
    },
    analysis: labStatus === "pass" ? null : {
      cause: causes[0] || "Dynamic content shifts",
      recommendation: recommendations[0] || "Review late-loading content such as ads or banners."
    }
  };
};

const evaluateCLSCrux = (audits, cruxMetrics) => {
  const fieldValueRaw = cruxMetrics["CUMULATIVE_LAYOUT_SHIFT_SCORE"]?.percentile || null;
  const fieldValue = fieldValueRaw !== null ? parseFloat((fieldValueRaw / 100).toFixed(3)) : null;

  if (fieldValue === null) return null;

  const fieldStatus = calculateStatus(fieldValue, 0.1, 0.25);
  const fieldScore = calculateScore(fieldValue, 0.1, 0.25);

  const causes = [];
  const recommendations = [];

  if (fieldStatus !== "pass") {
    // Check Lab CLS for layout shifts
    const labCLS = audits["cumulative-layout-shift"]?.numericValue || 0;
    if (labCLS > 0.1) {
      causes.push("Layout shifts detected during load (font loading, late-injected ads)");
      recommendations.push("Reserve space for images/ads and use `font-display: swap`.");
    }

    // Check Unsized Images (common cause)
    const unsized = audits["unsized-images"]?.details?.items || [];
    if (unsized.length > 0) {
      causes.push("Images missing width/height attributes causing reflow");
      recommendations.push("Add explicit `width` and `height` attributes to all images.");
    }

    if (causes.length === 0) {
      causes.push("Post-load layout shifts (ads, popups, dynamic content)");
      recommendations.push("Reserve space for late-loading dynamic content.");
    }
  }

  return {
    score: fieldScore,
    status: fieldStatus,
    details: fieldStatus === "pass" ? "Real-world visual stability is good." : `Real users experience layout shifts (${fieldValue}).`,
    meta: {
      value: fieldValue,
      p75: true,
      thresholds: { Good: "0-0.1", Warning: "0.1-0.25", Poor: "0.25+" }
    },
    analysis: fieldStatus === "pass" ? null : {
      cause: causes[0] || "Post-load layout shifts",
      recommendation: recommendations[0] || "Reserve space for late-loading dynamic content."
    }
  };
};

// FCP - First Contentful Paint
const evaluateFCPLab = (audits) => {
  const raw = labValueOf(audits, "first-contentful-paint");
  if (raw === null) return labUnmeasured(audits, "first-contentful-paint", "First Contentful Paint");
  const labValue = parseFloat(raw.toFixed(0));
  const labScore = calculateScore(labValue, 1800, 3000);
  const labStatus = calculateStatus(labValue, 1800, 3000);

  const causes = [];
  const recommendations = [];

  if (labStatus !== "pass") {
    // Check TTFB
    const ttfbVal = audits["server-response-time"]?.numericValue || 0;
    if (ttfbVal > 600) {
      causes.push(`High Server Response Time (${Math.round(ttfbVal)}ms)`);
      recommendations.push("Reduce server response time (TTFB) to allow quicker painting.");
    }

    // Check Render Blocking
    const blocking = audits["render-blocking-resources"]?.details?.items || [];
    if (blocking.length > 0) {
      causes.push(`${blocking.length} render-blocking resources detected`);
      recommendations.push("Eliminate render-blocking resources by deferring JS and inlining critical CSS.");
    }

    // Check Redirects
    const redirects = audits["redirects"]?.details?.items || [];
    if (redirects.length > 0) {
      causes.push("Page redirects delaying initial load");
      recommendations.push("Minimize redirects to speed up page rendering.");
    }

    if (causes.length === 0) {
      causes.push("Critical request chain depth or script execution");
      recommendations.push("Preload critical requests and reduce critical chain depth.");
    }
  }

  return {
    score: labScore,
    status: labStatus,
    details: labStatus === "pass" ? "First Paint timing is good." : `First Paint is delayed (${msToSec(labValue)}).`,
    meta: {
      value: msToSec(labValue),
      thresholds: { Good: "0-1.8s", Warning: "1.8-3s", Poor: "3s+" }
    },
    analysis: labStatus === "pass" ? null : {
      cause: causes[0] || "Critical request chain depth or script execution",
      recommendation: recommendations[0] || "Preload critical requests and reduce critical chain depth."
    }
  };
};

const evaluateFCPCrux = (audits, cruxMetrics) => {
  const fieldValue = cruxMetrics["FIRST_CONTENTFUL_PAINT_MS"]?.percentile || null;

  if (fieldValue === null) return null;

  const fieldStatus = calculateStatus(fieldValue, 1800, 3000);
  const fieldScore = calculateScore(fieldValue, 1800, 3000);

  const causes = [];
  const recommendations = [];

  if (fieldStatus !== "pass") {
    // Check TTFB correlation
    const ttfbVal = audits["server-response-time"]?.numericValue || 0;
    if (ttfbVal > 600) {
      causes.push(`Slow Server Response detected in lab (${Math.round(ttfbVal)}ms)`);
      recommendations.push("Optimize server timing/database queries to improve real-user FCP.");
    }

    // Render blocking check
    const blocking = audits["render-blocking-resources"]?.details?.items?.length || 0;
    if (blocking > 0) {
      causes.push("Render-blocking resources delaying paint");
      recommendations.push("Defer non-critical resources to unblock initial paint.");
    }

    if (causes.length === 0) {
      causes.push("Network latency or connection setup time");
      recommendations.push("Use a CDN and ensure fast TLS/DNS setup.");
    }
  }

  return {
    score: fieldScore,
    status: fieldStatus,
    details: fieldStatus === "pass" ? "Real-world First Paint is optimal." : `Real users experience FCP delay (${msToSec(fieldValue)}).`,
    meta: {
      value: msToSec(fieldValue),
      p75: true,
      thresholds: { Good: "0-1.8s", Warning: "1.8-3s", Poor: "3s+" }
    },
    analysis: fieldStatus === "pass" ? null : {
      cause: causes[0] || "Network latency or connection setup time",
      recommendation: recommendations[0] || "Use a CDN and ensure fast TLS/DNS setup."
    }
  };
};

// TTFB - Time to First Byte
const evaluateTTFBLab = (audits) => {
  const raw = labValueOf(audits, "server-response-time");
  if (raw === null) return labUnmeasured(audits, "server-response-time", "Time to First Byte");
  const labValue = parseFloat(raw.toFixed(0));
  const labScore = calculateScore(labValue, 800, 1800);
  const labStatus = calculateStatus(labValue, 800, 1800);

  const causes = [];
  const recommendations = [];

  if (labStatus !== "pass") {
    causes.push("Slow server response time detected");
    recommendations.push("Optimize database queries, enable Gzip, and use a CDN.");

    // Check Redirects
    const redirects = audits["redirects"]?.details?.items || [];
    if (redirects.length > 0) {
      causes.push("Multiple redirects increasing latency");
      recommendations.push("Reduce redirect chains.");
    }

    if (causes.length === 0) {
      causes.push("Server processing capacity reached");
      recommendations.push("Upgrade server infrastructure or optimize backend code.");
    }
  }

  return {
    score: labScore,
    status: labStatus,
    details: labStatus === "pass" ? "Server response time is excellent." : `Server response is slow (${msToSec(labValue)}).`,
    meta: {
      value: msToSec(labValue),
      thresholds: { Good: "0-0.8s", Warning: "0.8-1.8s", Poor: "1.8s+" }
    },
    analysis: labStatus === "pass" ? null : {
      cause: causes[0] || "Server processing capacity reached",
      recommendation: recommendations[0] || "Upgrade server infrastructure or optimize backend code."
    }
  };
};

const evaluateTTFBCrux = (cruxMetrics) => {
  const fieldValue = cruxMetrics["EXPERIMENTAL_TIME_TO_FIRST_BYTE"]?.percentile || null;

  if (fieldValue === null) return null;

  const fieldStatus = calculateStatus(fieldValue, 800, 1800);
  const fieldScore = calculateScore(fieldValue, 800, 1800);

  const causes = [];
  const recommendations = [];

  if (fieldStatus !== "pass") {
    causes.push("Slow field TTFB (high server latency)");
    recommendations.push("Cache dynamic content and optimize database performance.");

    causes.push("Geographic distance from server");
    recommendations.push("Use a CDN to serve content from edge locations.");
  }

  return {
    score: fieldScore,
    status: fieldStatus,
    details: fieldStatus === "pass" ? "Real-world server response is good." : `Real users face slow server response (${msToSec(fieldValue)}).`,
    meta: {
      value: msToSec(fieldValue),
      p75: true,
      thresholds: { Good: "0-0.8s", Warning: "0.8-1.8s", Poor: "1.8s+" }
    },
    analysis: fieldStatus === "pass" ? null : {
      cause: causes[0] || "Slow field TTFB (high server latency)",
      recommendation: recommendations[0] || "Use a CDN to serve content from edge locations."
    }
  };
};

// INP - Interaction to Next Paint
// INP is a FIELD-only metric — Lighthouse produces no lab INP. The old code mislabeled
// Time-to-Interactive (TTI) as "INP" (e.g. 8.4s → a scary 39 that wasn't even what the
// score used). Per spec §2.1, Total Blocking Time IS the lab proxy for INP, so when
// there's no CrUX field INP we present the responsiveness estimate FROM TBT — matching
// exactly what the INP·TBT parameter weights, with honest "lab estimate" labeling.
const evaluateINPLab = (audits) => {
  const rawTbt = labValueOf(audits, "total-blocking-time");
  if (rawTbt === null) return labUnmeasured(audits, "total-blocking-time", "responsiveness (its lab proxy, Total Blocking Time)");
  const tbtMs = parseFloat(rawTbt.toFixed(0));
  const labScore = calculateScore(tbtMs, 200, 600);
  const labStatus = calculateStatus(tbtMs, 200, 600);

  const causes = [];
  const recommendations = [];

  if (labStatus !== "pass") {
    const longTasks = audits["long-tasks"]?.details?.items || [];
    if (longTasks.length > 0) {
      causes.push(`${longTasks.length} long tasks blocking the main thread`);
      recommendations.push("Break up long JavaScript tasks so the page can respond to interactions.");
    }

    const thirdParty = audits["third-party-summary"]?.details?.items || [];
    if (thirdParty.length > 0) {
      causes.push("Third-party scripts occupying the main thread");
      recommendations.push("Defer or lazy-load non-essential third-party scripts.");
    }

    const domSize = audits["dom-size"]?.numericValue || 0;
    if (domSize > 1500) {
      causes.push("Large DOM increasing style/layout cost per interaction");
      recommendations.push("Reduce DOM size to speed up interaction handling.");
    }

    if (causes.length === 0) {
      causes.push("Main-thread blocking time is high");
      recommendations.push("Minimize main-thread work and split long tasks.");
    }
  }

  return {
    score: labScore,
    status: labStatus,
    // labProxy flag lets the UI show "no field data — estimated from TBT" honestly.
    details: labStatus === "pass"
      ? "Estimated responsiveness is good (lab proxy from Total Blocking Time)."
      : `Estimated responsiveness is low (lab proxy from Total Blocking Time: ${msToSec(tbtMs)}).`,
    meta: {
      value: `${msToSec(tbtMs)} (lab est.)`,
      labProxy: "TBT",
      thresholds: { Good: "0-0.2s", Warning: "0.2-0.6s", Poor: "0.6s+" }
    },
    analysis: labStatus === "pass" ? null : {
      cause: causes[0] || "Main-thread blocking time is high",
      recommendation: recommendations[0] || "Minimize main-thread work and split long tasks."
    }
  };
};

const evaluateINPCrux = (audits, cruxMetrics) => {
  const fieldValue = cruxMetrics["INTERACTION_TO_NEXT_PAINT"]?.percentile || null;

  if (fieldValue === null) return null;

  const fieldStatus = calculateStatus(fieldValue, 200, 500);
  const fieldScore = calculateScore(fieldValue, 200, 500);

  const causes = [];
  const recommendations = [];

  if (fieldStatus !== "pass") {
    // Check Long Tasks
    const longTasks = audits["long-tasks"]?.details?.items || [];
    if (longTasks.length > 0) {
      causes.push("Long Tasks blocking interactions");
      recommendations.push("Break up long JavaScript tasks to yield to main thread.");
    }

    // Check Third Party
    const thirdParty = audits["third-party-summary"]?.details?.items || [];
    if (thirdParty.length > 0) {
      causes.push("Third-party scripts delaying input");
      recommendations.push("Audit and defer non-essential third-party scripts.");
    }

    // Check Reflows/Layout Thrashing (DOM Size)
    const domSize = audits["dom-size"]?.numericValue || 0;
    if (domSize > 1500) {
      causes.push("Large DOM causing style calc delays");
      recommendations.push("Reduce DOM size to improve layout/paint performance.");
    }

    if (causes.length === 0) {
      causes.push("Input delay on real-world devices");
      recommendations.push("Optimize event handlers and avoid blocking main thread.");
    }
  }

  return {
    score: fieldScore,
    status: fieldStatus,
    details: fieldStatus === "pass" ? "Real-world interaction feedback is fast." : `Real users face input delays (${msToSec(fieldValue)}).`,
    meta: {
      value: msToSec(fieldValue),
      p75: true,
      thresholds: { Good: "0-0.2s", Warning: "0.2-0.5s", Poor: "0.5s+" }
    },
    analysis: fieldStatus === "pass" ? null : {
      cause: causes[0] || "Input delay on real-world devices",
      recommendation: recommendations[0] || "Optimize event handlers and avoid blocking main thread."
    }
  };
};

// FID - First Input Delay
// Lab variant: Lighthouse's "max-potential-fid" (Max Potential FID) — the duration of
// the longest task, i.e. the worst-case input delay a user could hit. This audit is
// still shipped in every PageSpeed response, so it's what keeps the FID card visible
// now that Google has removed real-user FID from CrUX (INP replaced it, Sept 2024).
const evaluateFIDLab = (audits) => {
  const fidAudit = audits["max-potential-fid"];
  if (!fidAudit || fidAudit.numericValue == null) return null;

  const labValue = parseFloat(fidAudit.numericValue.toFixed(0));
  const labScore = calculateScore(labValue, 130, 250);
  const labStatus = calculateStatus(labValue, 130, 250);

  const causes = [];
  const recommendations = [];

  if (labStatus !== "pass") {
    // Check Long Tasks
    const longTasks = audits["long-tasks"]?.details?.items || [];
    if (longTasks.length > 0) {
      causes.push("Long Tasks keeping the main thread busy at first input");
      recommendations.push("Break up long JavaScript tasks so the browser can respond to the first interaction.");
    }

    // Check JS Bootup Time
    const bootup = audits["bootup-time"]?.numericValue || 0;
    if (bootup > 1000) {
      causes.push("Heavy JavaScript execution during page load");
      recommendations.push("Reduce and defer JavaScript so the page becomes interactive sooner.");
    }

    // Check Third Party
    const thirdParty = audits["third-party-summary"]?.details?.items || [];
    if (thirdParty.length > 0) {
      causes.push("Third-party scripts occupying the main thread");
      recommendations.push("Audit and defer non-essential third-party scripts.");
    }

    if (causes.length === 0) {
      causes.push("A long main-thread task could delay the first interaction");
      recommendations.push("Minimize main-thread work and split long tasks.");
    }
  }

  return {
    score: labScore,
    status: labStatus,
    details: labStatus === "pass" ? "Worst-case first input delay is low." : `A user's first input could be delayed up to ${msToSec(labValue)}.`,
    meta: {
      value: msToSec(labValue),
      maxPotential: true,
      thresholds: { Good: "0-0.13s", Warning: "0.13-0.25s", Poor: "0.25s+" }
    },
    analysis: labStatus === "pass" ? null : {
      cause: causes[0] || "A long main-thread task could delay the first interaction",
      recommendation: recommendations[0] || "Minimize main-thread work and split long tasks."
    }
  };
};

// Field variant: real-user FID from CrUX. Google removed FIRST_INPUT_DELAY_MS from
// CrUX in Sept 2024 (INP replaced it), so most current responses omit it — we return
// null then and the card falls back to the lab value above.
const evaluateFIDCrux = (audits, cruxMetrics) => {
  const fieldValue = cruxMetrics["FIRST_INPUT_DELAY_MS"]?.percentile || null;

  if (fieldValue === null) return null;

  const fieldStatus = calculateStatus(fieldValue, 100, 300);
  const fieldScore = calculateScore(fieldValue, 100, 300);

  const causes = [];
  const recommendations = [];

  if (fieldStatus !== "pass") {
    // Check Long Tasks
    const longTasks = audits["long-tasks"]?.details?.items || [];
    if (longTasks.length > 0) {
      causes.push("Long Tasks keeping the main thread busy at first input");
      recommendations.push("Break up long JavaScript tasks so the browser can respond to the first interaction.");
    }

    // Check JS Bootup Time
    const bootup = audits["bootup-time"]?.numericValue || 0;
    if (bootup > 1000) {
      causes.push("Heavy JavaScript execution during page load");
      recommendations.push("Reduce and defer JavaScript so the page becomes interactive sooner.");
    }

    // Check Third Party
    const thirdParty = audits["third-party-summary"]?.details?.items || [];
    if (thirdParty.length > 0) {
      causes.push("Third-party scripts occupying the main thread");
      recommendations.push("Audit and defer non-essential third-party scripts.");
    }

    if (causes.length === 0) {
      causes.push("Main thread busy when real users first interact");
      recommendations.push("Minimize main-thread work and split long tasks.");
    }
  }

  return {
    score: fieldScore,
    status: fieldStatus,
    details: fieldStatus === "pass" ? "Real users get a fast response to their first interaction." : `Real users wait ${msToSec(fieldValue)} before their first input is handled.`,
    meta: {
      value: msToSec(fieldValue),
      p75: true,
      thresholds: { Good: "0-0.1s", Warning: "0.1-0.3s", Poor: "0.3s+" }
    },
    analysis: fieldStatus === "pass" ? null : {
      cause: causes[0] || "Main thread busy when real users first interact",
      recommendation: recommendations[0] || "Minimize main-thread work and split long tasks."
    }
  };
};

// TBT - Total Blocking Time
const evaluateTBT = (audits) => {
  const raw = labValueOf(audits, "total-blocking-time");
  if (raw === null) return labUnmeasured(audits, "total-blocking-time", "Total Blocking Time");
  const labValue = parseFloat(raw.toFixed(0));
  const labScore = calculateScore(labValue, 200, 600);
  const labStatus = calculateStatus(labValue, 200, 600);

  const causes = [];
  const recommendations = [];

  if (labStatus !== "pass") {
    // Check Long Tasks
    const longTasks = audits["long-tasks"]?.details?.items || [];
    if (longTasks.length > 0) {
      causes.push(`${longTasks.length} long tasks blocking the main thread`);
      recommendations.push("Break up Long Tasks and defer non-critical JS.");
    }

    // Check Third Party
    const thirdParty = audits["third-party-summary"]?.details?.items || [];
    const blockingThirdParty = thirdParty.filter(i => i.blockingTime > 0);
    if (blockingThirdParty.length > 0) {
      causes.push("Third-party code blocking main thread");
      recommendations.push("Audit third-party scripts and use facade loading.");
    }

    // Check Script Evaluation
    const scriptEval = audits["bootup-time"]?.details?.items?.filter(i => i.scripting > 500) || [];
    if (scriptEval.length > 0) {
      causes.push("Heavy script evaluation");
      recommendations.push("Optimize script evaluation and remove unused code.");
    }

    if (causes.length === 0) {
      causes.push("General main thread congestion");
      recommendations.push("Minimize main thread work and reduce JS execution time.");
    }
  }

  return {
    score: labScore,
    status: labStatus,
    details: labStatus === "pass" ? "Main thread is clear." : `Main thread is blocked (${msToSec(labValue)}).`,
    meta: {
      value: msToSec(labValue),
      thresholds: { Good: "0-0.2s", Warning: "0.2-0.6s", Poor: "0.6s+" }
    },
    analysis: labStatus === "pass" ? null : {
      cause: causes[0] || "General main thread congestion",
      recommendation: recommendations[0] || "Minimize main thread work and reduce JS execution time."
    }
  };
};

// SI - Speed Index
const evaluateSI = (audits) => {
  const raw = labValueOf(audits, "speed-index");
  if (raw === null) return labUnmeasured(audits, "speed-index", "Speed Index");
  const labValue = parseFloat(raw.toFixed(0));
  const labScore = calculateScore(labValue, 3400, 5800);
  const labStatus = calculateStatus(labValue, 3400, 5800);

  const causes = [];
  const recommendations = [];

  if (labStatus !== "pass") {
    // Check Main Thread Work
    const mainThread = audits["mainthread-work-breakdown"]?.numericValue || 0;
    if (mainThread > 4000) {
      causes.push("Main thread busy parsing/executing JS/CSS");
      recommendations.push("Minimize main thread work and reduce JS execution time.");
    }

    // Check Unused Code
    const unusedCSS = audits["unused-css-rules"]?.details?.overallSavingsMs || 0;
    const unusedJS = audits["unused-javascript"]?.details?.overallSavingsMs || 0;
    if (unusedCSS > 100 || unusedJS > 100) {
      causes.push("Unused CSS/JS delaying visual rendering");
      recommendations.push("Remove unused code or defer non-critical assets.");
    }

    // Check Font Loading
    const fontDisplay = audits["font-display"]?.details?.items?.length || 0;
    if (fontDisplay > 0) {
      causes.push("Invisible text during font load");
      recommendations.push("Ensure text remains visible during font load via `font-display: swap`.");
    }

    if (causes.length === 0) {
      causes.push("Resources competing for bandwidth");
      recommendations.push("Ensure critical resources are prioritized.");
    }
  }

  return {
    score: labScore,
    status: labStatus,
    details: labStatus === "pass" ? "Visual load speed is optimal." : `Visual page load is slow (${msToSec(labValue)}).`,
    meta: {
      value: msToSec(labValue),
      thresholds: { Good: "0-3.4s", Warning: "3.4-5.8s", Poor: "5.8s+" }
    },
    analysis: labStatus === "pass" ? null : {
      cause: causes[0] || "Resources competing for bandwidth",
      recommendation: recommendations[0] || "Ensure critical resources are prioritized."
    }
  };
};

// Compression
const evaluateCompression = async (page) => {
  const resources = await page.evaluate(async () => {
    const urls = Array.from(
      document.querySelectorAll('script[src], link[rel="stylesheet"][href]')
    )
      .map(el => el.src || el.href)
      .filter(url => url.startsWith('http'));

    const sample = urls.slice(0, 10);

    const results = await Promise.all(
      sample.map(async (url) => {
        try {
          const res = await fetch(url, { method: 'HEAD' });

          const encoding = res.headers.get('content-encoding');

          const isCompressed = !!(
            encoding &&
            (encoding.includes('gzip') ||
              encoding.includes('br') ||
              encoding.includes('deflate'))
          );

          return {
            url,
            isCompressed,
            actualEncoding: encoding || 'None'
          };
        } catch {
          return {
            url,
            isCompressed: true,
            actualEncoding: 'Error'
          };
        }
      })
    );

    return results;
  });

  const total = resources.length;
  const compressedCount = resources.filter(r => r.isCompressed).length;

  // 🔥 Extract file names + uncompressed list
  const uncompressedResources = resources
    .filter(r => !r.isCompressed)
    .map(r => {
      let fileName = "unknown-file";

      try {
        const urlObj = new URL(r.url);
        const path = urlObj.pathname;
        fileName = path.substring(path.lastIndexOf("/") + 1) || "unknown-file";
      } catch {}

      return {
        url: r.url,
        fileName, // 🔥 NEW
        currentEncoding: r.actualEncoding
      };
    });

  const score =
    total === 0
      ? 100
      : parseFloat(((compressedCount / total) * 100).toFixed(0));

  let status = "pass";
  if (score < 100) status = "warning";
  if (score < 70) status = "fail";

  const causes = [];
  const recommendations = [];

  if (status !== "pass") {
    causes.push(`${uncompressedResources.length} uncompressed text resources found`);
    recommendations.push("Enable Gzip or Brotli compression on your web server.");

    if (uncompressedResources.some(u => u.url.includes(".js"))) {
      causes.push("JavaScript files have no compression");
      recommendations.push("Ensure .js files are compressed.");
    }

    if (uncompressedResources.some(u => u.url.includes(".css"))) {
      causes.push("CSS files have no compression");
      recommendations.push("Ensure .css files are compressed.");
    }
  }

  return {
    score: score,
    status,
    details:
      status === "pass"
        ? "All text resources are compressed."
        : `Uncompressed assets found (${uncompressedResources.length}).`,
    meta: {
      value: score + "%",
      total,
      compressedCount,
      uncompressedCount: uncompressedResources.length,
      target: "Use gzip or brotli compression",
      uncompressedResources, // 🔥 includes fileName
      thresholds: {
        Good: "100%",
        Warning: "70-99%",
        Poor: "<70%"
      }
    },
    analysis:
      status === "pass"
        ? null
        : {
            cause:
              causes[0] ||
              "Bandwidth waste due to uncompressed assets",
            recommendation:
              recommendations[0] ||
              "Enable Gzip or Brotli compression on your web server.",
            // full lists — the singular fields above only carry the first entry
            causes,
            recommendations
          }
  };
};

// Caching
const evaluateCaching = async (page) => {
  const resources = await page.evaluate(async () => {
    const urls = Array.from(
      document.querySelectorAll('img[src], script[src], link[rel="stylesheet"][href]')
    )
      .map(el => el.src || el.href)
      .filter(url => url.startsWith('http'));

    const sample = urls.slice(0, 10);

    const results = await Promise.all(
      sample.map(async (url) => {
        try {
          const res = await fetch(url, { method: 'HEAD' });

          const cacheControl = res.headers.get('cache-control');
          const policy = cacheControl || "None";

          if (!cacheControl) {
            return { url, isCached: false, policy };
          }

          const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);

          if (!maxAgeMatch) {
            return { url, isCached: false, policy };
          }

          const isCached = parseInt(maxAgeMatch[1], 10) >= 604800; // 7 days

          return { url, isCached, policy };

        } catch {
          return { url, isCached: true, policy: "Error" };
        }
      })
    );

    return results;
  });

  const total = resources.length;
  const cachedCount = resources.filter(r => r.isCached).length;

  // 🔥 UPDATED: fileName extraction
  const uncachedResources = resources
    .filter(r => !r.isCached)
    .map(r => {
      let fileName = "unknown-file";

      try {
        const urlObj = new URL(r.url);
        const path = urlObj.pathname;
        fileName = path.substring(path.lastIndexOf("/") + 1) || "unknown-file";
      } catch {}

      return {
        url: r.url,
        fileName, // 🔥 NEW
        cachePolicy: r.policy
      };
    });

  const score =
    total === 0
      ? 100
      : parseFloat(((cachedCount / total) * 100).toFixed(0));

  let status = "pass";
  if (score < 90) status = "warning";
  if (score < 50) status = "fail";

  const causes = [];
  const recommendations = [];

  if (status !== "pass") {
    causes.push(`${uncachedResources.length} resources with short or missing cache policy`);
    recommendations.push("Set a long `max-age` (e.g. 1 year) for static assets.");

    if (uncachedResources.some(u => u.url.match(/\.(jpg|png|webp|css|js)$/))) {
      causes.push("Static assets (images/JS/CSS) not effectively cached");
      recommendations.push("Ensure your CDN or server sends correct `Cache-Control` headers.");
    }
  }

  return {
    score,
    status,
    details:
      status === "pass"
        ? "Caching policies are optimal."
        : `Caching issues found in ${uncachedResources.length} resources.`,
    meta: {
      value: score + "%",
      total,
      cachedCount,
      uncachedCount: uncachedResources.length,
      target: "≥ 7 days",
      uncachedResources, // 🔥 now includes fileName
      thresholds: {
        Good: "≥90%",
        Warning: "50-89%",
        Poor: "<50%"
      }
    },
    analysis:
      status === "pass"
        ? null
        : {
            cause: causes[0] || "Short or missing cache policies",
            recommendation:
              recommendations[0] ||
              "Set a long max-age (e.g. 1 year) for static assets.",
            causes,
            recommendations
          }
  };
};

// Resource Optimization
const evaluateResourceOptimization = async (page) => {
  const result = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const totalImages = images.length;

    const unoptimizedImagesList = images.filter(img => {
      if (img.naturalWidth === 0) return false;
      return !(img.naturalWidth <= (img.clientWidth * 2) && img.naturalHeight <= (img.clientHeight * 2));
    }).map(img => ({
      url: img.src,
      type: "Image",
      details: `Displayed: ${img.clientWidth}x${img.clientHeight}px, Natural: ${img.naturalWidth}x${img.naturalHeight}px`
    }));

    const optimizedImagesCount = totalImages - unoptimizedImagesList.length;

    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const totalScripts = scripts.length;

    const unminifiedScriptsList = scripts.filter(s => {
      return !(s.src.includes('.min') || s.src.includes('cdn'));
    }).map(s => {
      const loading = s.defer ? 'defer' : (s.async ? 'async' : 'blocking');
      return {
        url: s.src,
        type: "Script",
        details: `Status: Unminified, Loading: ${loading}`
      };
    });

    const minifiedScriptsCount = totalScripts - unminifiedScriptsList.length;

    return {
      totalImages,
      optimizedImagesCount,
      unoptimizedImagesList,
      totalScripts,
      minifiedScriptsCount,
      unminifiedScriptsList
    };
  });

  const imgScore = result.totalImages === 0 ? 100 : (result.optimizedImagesCount / result.totalImages) * 100;
  const scriptScore = result.totalScripts === 0 ? 100 : (result.minifiedScriptsCount / result.totalScripts) * 100;
  const score = parseFloat(((imgScore + scriptScore) / 2).toFixed(0));

  let status = "pass";
  if (score < 90) status = "warning";
  if (score < 50) status = "fail";

  const causes = [];
  const recommendations = [];

  if (status !== "pass") {
    if (result.unoptimizedImagesList.length > 0) {
      causes.push(`${result.unoptimizedImagesList.length} images are larger than their display size`);
      recommendations.push("Resize images to match their specific display dimensions.");
    }
    if (result.unminifiedScriptsList.length > 0) {
      causes.push(`${result.unminifiedScriptsList.length} JavaScript files are unminified`);
      recommendations.push("Minify JavaScript files to reduce payload size.");
    }
  }

  return {
    score: score,
    status,
    details: status === "pass" ? "All resources are properly optimized." : "Asset optimization opportunities found.",
    meta: {
      value: score + "%",
      totalImages: result.totalImages,
      optimizedImagesCount: result.optimizedImagesCount,
      unoptimizedImagesCount: result.unoptimizedImagesList.length,
      totalScripts: result.totalScripts,
      minifiedScriptsCount: result.minifiedScriptsCount,
      unminifiedScriptsCount: result.unminifiedScriptsList.length,
      target: "Optimized Assets",
      unoptimizedImages: result.unoptimizedImagesList,
      unminifiedScripts: result.unminifiedScriptsList,
      thresholds: { Good: "≥90%", Warning: "50-89%", Poor: "<50%" }
    },
    analysis: status === "pass" ? null : {
      cause: causes[0] || "Unoptimized assets",
      recommendation: recommendations[0] || "Compress and minify your site resources.",
      causes,
      recommendations
    }
  };
};

// Render Blocking Resources — spec §2.1: "count + estimated savings (ms); score
// inversely to blocking ms". Primary source is Lighthouse's render-blocking-resources
// audit, which measures how many milliseconds of first paint each blocking file
// actually costs — so fixing ANY one file moves the score by its real cost. When the
// PSI audit is unavailable we fall back to the DOM count on an exponential decay
// (100 × 0.9^count), which also never dead-zones at 0 the way the old
// `100 − 10 × count` floor did.
// Split in two halves on purpose. The DOM half needs the live page; the scoring half
// needs Lighthouse's numbers, which can take anywhere from 30s to over 150s to arrive
// (measured on www.toyota.com, 2026-08-07 — five runs of the same URL spanned 29.6s to
// >150s). Keeping them in one function meant Chromium had to stay open for the whole
// PageSpeed wait just to score this one parameter, so a slow PSI call cost the audit
// its browser slot. Now the page half runs early, the browser is released, and the
// score is computed whenever PageSpeed lands. Scoring is byte-identical either way.
const collectRenderBlockingDom = async (page) =>
  page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('head link[rel="stylesheet"]'));
    const scripts = Array.from(document.querySelectorAll('head script[src]'));

    const blockingLinks = links.filter(link => {
      const media = link.media;
      return !media || media === 'all' || media === 'screen';
    }).map(link => ({
      url: link.href,
      details: link.media
        ? `Blocks rendering due to media attribute: '${link.media}'`
        : "Blocks rendering (missing media attribute defaults to 'all')"
    }));

    const blockingScripts = scripts.filter(script => {
      return !script.hasAttribute('async') && !script.hasAttribute('defer');
    }).map(script => ({
      url: script.src,
      details: "Synchronous script execution blocks DOM construction (missing 'async'/'defer')"
    }));

    return [...blockingLinks, ...blockingScripts];
  });

// Pure: takes the DOM scan collected earlier plus whatever PageSpeed returned (which
// may be nothing — `audits` is {} when PSI failed, and the DOM fallback below is the
// same one that has always covered that case).
const scoreRenderBlocking = (domBlocking, audits) => {
  const lhAudit = audits?.["render-blocking-resources"];
  const lhItems = lhAudit?.details?.items || [];
  const blockingMs = typeof lhAudit?.numericValue === "number"
    ? Math.round(lhAudit.numericValue)
    : (lhItems.length ? Math.round(lhItems.reduce((s, it) => s + (it.wastedMs || 0), 0)) : null);

  let blockingResources, blockingCount, score, source;
  if (blockingMs !== null) {
    // Lighthouse only lists files that measurably delay paint, with the ms each costs.
    blockingResources = lhItems.map(it => ({
      url: it.url,
      details: `Delays first paint by ~${Math.round(it.wastedMs || 0)}ms (${Math.round((it.totalBytes || 0) / 1024)}KB)`,
    }));
    blockingCount = lhItems.length;
    // Same log-normal curve as the CWV metrics: 0ms = 100, ~300ms ≈ 90, 1200ms = 50.
    score = calculateScore(blockingMs, 300, 1200);
    source = "Lighthouse render-blocking-resources (measured ms)";
  } else {
    blockingResources = domBlocking;
    blockingCount = domBlocking.length;
    score = Math.round(100 * Math.pow(0.9, blockingCount));
    source = "DOM head scan (PSI audit unavailable)";
  }

  let status = "pass";
  if (score < 90) status = "warning";
  if (score < 50) status = "fail";

  const causes = [];
  const recommendations = [];

  if (status !== "pass") {
    causes.push(
      blockingMs !== null
        ? `${blockingCount} render-blocking resources delay first paint by ~${blockingMs}ms`
        : `${blockingCount} render-blocking resources found`
    );
    recommendations.push("Defer non-critical JavaScript and inline critical CSS.");

    if (blockingResources.some(u => (u.url || "").includes(".css"))) {
      causes.push("Blocking CSS files delaying paint");
      recommendations.push("Load non-critical CSS asynchronously.");
    }
  }

  return {
    score: score,
    status,
    details: status === "pass"
      ? (blockingMs !== null && blockingCount > 0
        ? `Render-blocking cost is negligible (~${blockingMs}ms across ${blockingCount} file${blockingCount === 1 ? "" : "s"}).`
        : "No render-blocking resources.")
      : (blockingMs !== null
        ? `Blocking resources delay first paint by ~${blockingMs}ms (${blockingCount} file${blockingCount === 1 ? "" : "s"}).`
        : `${blockingCount} render-blocking resources detected.`),
    meta: {
      value: score + "%",
      target: "≲300ms blocked",
      blockingCount,
      blockingMs,
      source,
      blockingResources,
      thresholds: { Good: "≥90% (≲300ms blocked)", Warning: "50-89%", Poor: "<50% (≳1.2s blocked)" }
    },
    analysis: status === "pass" ? null : {
      cause: causes[0] || "Blocking resources delaying paint",
      recommendation: recommendations[0] || "Review critical rendering path.",
      causes,
      recommendations
    }
  };
};

// Redirect Chains
const evaluateRedirectChains = (response) => {
  const chain = [];
  let currentRequest = response.request();
  while (currentRequest.redirectedFrom()) {
    const prev = currentRequest.redirectedFrom();
    chain.unshift(prev);
    currentRequest = prev;
  }
  const redirectDetails = chain.map(req => req.url()).concat(response.url());
  const hops = chain.length;
  // Spec §2.1 — graded, not binary: 0 hops = 100, 1 = 85, 2 = 60, ≥3 decays below 40.
  const score = hops === 0 ? 100 : hops === 1 ? 85 : hops === 2 ? 60 : Math.max(0, 40 - (hops - 3) * 15);

  let status = "pass";
  if (hops === 2) status = "warning";
  if (hops > 2) status = "fail";

  const causes = [];
  const recommendations = [];

  if (status !== "pass") {
    causes.push(`${hops} redirect hops detected`);
    recommendations.push("Remove unnecessary redirects and point links directly to the final destination.");
  }

  return {
    score: score,
    status,
    details: status === "pass" ? "URL redirect structure is efficient." : `Multiple redirect hops detected (${hops}).`,
    meta: {
      value: score + "%",
      hops,
      redirectDetails,
      target: "≤ 1 hop",
      thresholds: { Good: "≤ 1 hop", Poor: "> 1 hop" }
    },
    analysis: status === "pass" ? null : {
      cause: causes[0] || "Redirect chains detected",
      recommendation: recommendations[0] || "Simplify URL structure to avoid hops."
    }
  };
};

// ───────────────── Timed Page Load (Inventory / Service pages) ─────────────────
// Dealership-specific checks: find a key page (vehicle inventory listing, or the
// service department page), open it in its OWN browser tab (never the shared audit
// page) and time it from navigation start until window.onload fires.
// Discovery order: sitemap.xml (incl. sitemap indexes) → links crawled from the
// already-rendered homepage. The same machinery drives every timed-page metric;
// only the path-ranking function and the display copy differ.

const TIMED_PAGE_NAV_TIMEOUT_MS = 45000;

const fetchTextWithTimeout = async (target, timeoutMs = 10000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(target, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
};

// Rank how strongly a path looks like an inventory listing page.
// 3 = used/pre-owned inventory (preferred), 2 = new inventory, 1 = generic inventory.
const rankInventoryPath = (pathname) => {
  const p = pathname.toLowerCase();
  if (/\.(pdf|jpe?g|png|gif|webp|svg|css|js)$/.test(p)) return 0;
  if (/(used|pre[-_]?owned|certified)[-_]?(inventory|vehicles|cars)/.test(p) || p.includes("searchused") || /\/used\/?$/.test(p)) return 3;
  if (/new[-_]?(inventory|vehicles|cars)/.test(p) || p.includes("searchnew") || /\/new\/?$/.test(p)) return 2;
  if (p.includes("vehicles-for-sale") || p.includes("cars-for-sale") || p.includes("inventory") ||
    p.includes("vehiclesearchresults") || /\/srp\b/.test(p) || /\/(all[-_]?)?vehicles\/?$/.test(p) || p.includes("showroom")) return 1;
  return 0;
};

// Rank how strongly a path looks like the service department page.
// 3 = schedule/appointment, 2 = main service page, 1 = service-adjacent (specials/parts/maintenance).
// "customer-service" is support, NOT auto service — explicitly excluded.
const rankServicePath = (pathname) => {
  const p = pathname.toLowerCase();
  if (/\.(pdf|jpe?g|png|gif|webp|svg|css|js)$/.test(p)) return 0;
  if (p.includes("customer-service") || p.includes("customerservice")) return 0;
  if (p.includes("schedule-service") || p.includes("scheduleservice") || p.includes("service-appointment") ||
    p.includes("serviceappointment") || p.includes("book-service") || p.includes("schedule-appointment")) return 3;
  if (/\/service[-_]?(center|department|dept)/.test(p) || p.includes("auto-service") || p.includes("car-service") ||
    p.includes("vehicle-service") || p.includes("service-and-parts") || /\/service\/?$/.test(p)) return 2;
  if (p.includes("service") || p.includes("maintenance") || /\/parts\/?$/.test(p)) return 1;
  return 0;
};

// Choose the highest-ranked URL on the audited host using `rankPath`. Among equal
// ranks the SHORTEST url wins — landing pages are short, detail pages are long slugs.
const pickUrlByRank = (urls, origin, rankPath) => {
  let baseHost;
  try { baseHost = new URL(origin).hostname.replace(/^www\./, ""); } catch { return null; }
  let best = null;
  let bestRank = 0;
  for (const raw of urls) {
    let u;
    try { u = new URL(raw, origin); } catch { continue; }
    if (u.hostname.replace(/^www\./, "") !== baseHost) continue;
    const rank = rankPath(u.pathname);
    if (rank === 0) continue;
    if (rank > bestRank || (rank === bestRank && best && u.href.length < best.href.length)) {
      best = u;
      bestRank = rank;
    }
  }
  return best ? best.href : null;
};

const extractSitemapLocs = (xml) =>
  [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1]);

// Strategy 1 — sitemap.xml (handles both plain sitemaps and sitemap indexes).
// `childHint` prioritizes which child sitemaps to scan first for this page type.
const findUrlFromSitemap = async (origin, rankPath, childHint) => {
  const xml = await fetchTextWithTimeout(`${origin}/sitemap.xml`);
  if (!xml) return null;
  const locs = extractSitemapLocs(xml);
  if (!locs.length) return null;

  const direct = pickUrlByRank(locs.filter((u) => !/\.xml(\?|$)/i.test(u)), origin, rankPath);
  if (direct) return direct;

  // Sitemap index: scan a few child sitemaps — page-like names first (landing
  // pages usually live there), then type-named ones, then the rest.
  const childScore = (s) => (/page|misc|static|site|general/i.test(s) ? 0 : childHint.test(s) ? 1 : 2);
  const children = locs
    .filter((u) => /\.xml(\?|$)/i.test(u))
    .sort((a, b) => childScore(a) - childScore(b))
    .slice(0, 4);

  for (const child of children) {
    const childXml = await fetchTextWithTimeout(child);
    if (!childXml) continue;
    const found = pickUrlByRank(
      extractSitemapLocs(childXml).filter((u) => !/\.xml(\?|$)/i.test(u)),
      origin,
      rankPath
    );
    if (found) return found;
  }
  return null;
};

// Strategy 2 — anchor links from the already-rendered homepage. Reading the live
// page is wrapped in try/catch (it may have detached); falls back to re-fetching
// the HTML over plain HTTP and parsing it with cheerio.
const findUrlFromHomepage = async (url, page, rankPath) => {
  let hrefs = [];
  try {
    hrefs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("a[href]")).map((a) => a.href)
    );
  } catch {
    const html = await fetchTextWithTimeout(url, 15000);
    if (!html) return null;
    const $ = cheerio.load(html);
    $("a[href]").each((_, el) => hrefs.push($(el).attr("href")));
  }
  return pickUrlByRank(hrefs, new URL(url).origin, rankPath);
};

// Generic timed-page-load metric. `cfg` carries the page-type specifics:
//   { rankPath, childHint, noun, timeoutCause, slowCause, recommendation }
const measureTimedPageLoad = async ({ url, device, page, browser }, cfg) => {
  try {
    const origin = new URL(url).origin;
    let discoveredVia = "sitemap";
    let targetUrl = await findUrlFromSitemap(origin, cfg.rankPath, cfg.childHint);
    if (!targetUrl) {
      discoveredVia = "crawl";
      targetUrl = await findUrlFromHomepage(url, page, cfg.rankPath);
    }
    if (!targetUrl) return null; // page not found — metric hidden & unscored

    // Time the page in a dedicated tab so the shared audit page that the other
    // metric services are using in parallel is never touched.
    const isMobile = String(device || "mobile").toLowerCase() !== "desktop";
    const tab = await browser.newPage(
      isMobile
        ? {
          viewport: { width: 390, height: 844 },
          userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
          isMobile: true,
          hasTouch: true,
        }
        : { viewport: { width: 1366, height: 768 } }
    );

    let loadMs;
    let timedOut = false;
    try {
      const t0 = Date.now();
      // waitUntil "load" resolves exactly when window.onload fires.
      await tab.goto(targetUrl, { waitUntil: "load", timeout: TIMED_PAGE_NAV_TIMEOUT_MS });
      loadMs = Date.now() - t0;
    } catch {
      timedOut = true;
      loadMs = TIMED_PAGE_NAV_TIMEOUT_MS;
    } finally {
      try { await tab.close(); } catch { }
    }

    const seconds = parseFloat((loadMs / 1000).toFixed(1));
    const score = timedOut ? 0 : calculateScore(loadMs, 4000, 8000);
    const status = timedOut ? "fail" : calculateStatus(loadMs, 4000, 8000);

    return {
      score,
      status,
      details: timedOut
        ? `${cfg.noun} did not finish loading within ${TIMED_PAGE_NAV_TIMEOUT_MS / 1000}s.`
        : status === "pass"
          ? `${cfg.noun} fully loaded in ${seconds}s.`
          : `${cfg.noun} took ${seconds}s to fully load.`,
      meta: {
        value: seconds + "s",
        pageUrl: targetUrl,
        discoveredVia,
        waitedFor: "window.onload",
        thresholds: { Good: "0-4s", Warning: "4-8s", Poor: "8s+" },
      },
      analysis: status === "pass" ? null : {
        cause: timedOut ? cfg.timeoutCause : cfg.slowCause,
        recommendation: cfg.recommendation,
      },
    };
  } catch {
    return null; // these extra checks must never break the Technical section
  }
};

const evaluateInventoryLoad = (url, device, page, browser) =>
  measureTimedPageLoad({ url, device, page, browser }, {
    rankPath: rankInventoryPath,
    childHint: /inventory|vehicle|car/i,
    noun: "Inventory page",
    timeoutCause: "The inventory page never fired window.onload — likely very heavy listing images/scripts or a hanging third-party request.",
    slowCause: "Heavy vehicle images, large scripts or slow listing requests delaying full load of the inventory page.",
    recommendation: "Lazy-load listing photos, paginate results and defer non-critical third-party widgets (chat, financing) on the inventory page.",
  });

const evaluateServiceLoad = (url, device, page, browser) =>
  measureTimedPageLoad({ url, device, page, browser }, {
    rankPath: rankServicePath,
    childHint: /service|parts|schedule|appointment|maintenance/i,
    noun: "Service page",
    timeoutCause: "The service page never fired window.onload — likely heavy scheduling widgets, maps or a hanging third-party booking script.",
    slowCause: "Heavy scheduling/booking widgets, maps or slow third-party service tools delaying full load of the service page.",
    recommendation: "Defer the service-scheduling widget, lazy-load maps and below-the-fold images, and minimize third-party booking scripts on the service page.",
  });

// ───────────────── PageSpeed Score (official Lighthouse 0–100) ─────────────────
// The headline Performance-category score Google itself shows. It is an AGGREGATE of
// metrics already scored above (FCP, SI, LCP, TBT, CLS), so it is surfaced as an
// informational card only and is NOT folded into the weighted Technical % — doing so
// would double-count those vitals. Reported for both Mobile and Desktop strategies.
const evaluatePageSpeedScore = (data, deviceName) => {
  const s = data?.lighthouseResult?.categories?.performance?.score;
  const score = typeof s === "number" ? Math.round(s * 100) : null;

  if (score == null) return notCalculated(
    "Google PageSpeed could not analyze this URL — Lighthouse returned no Performance score (the site may be too slow, blocking automated requests, or the PageSpeed API key/quota is unavailable).",
    "Confirm the site loads in Google PageSpeed Insights and that the PageSpeed API key/quota is configured, then re-run the audit."
  );

  // Canonical bands (matching overall headline): ≥75 good, 25–74 warning, <25 poor.
  const bandStatus = (s) => (s == null ? null : s >= 75 ? "pass" : s >= 25 ? "warning" : "fail");
  const status = bandStatus(score);
  const label = deviceName.charAt(0).toUpperCase() + deviceName.slice(1);

  return {
    score,
    status,
    details:
      status === "pass"
        ? `Official Lighthouse Performance score is strong (${label} ${score}/100).`
        : `Official Lighthouse Performance score needs work (${label} ${score}/100).`,
    meta: {
      value: score + "/100",
      device: label,
      deviceScore: score + "/100",
      deviceStatus: status,
      source: "Lighthouse categories.performance.score",
      informational: true, // shown, not folded into the weighted Technical %
      thresholds: { Good: "75-100", Warning: "25-74", Poor: "0-24" },
    },
    analysis:
      status === "pass"
        ? null
        : {
            cause:
              "The Lighthouse Performance score is pulled down by the Core Web Vitals (LCP/CLS/TBT) and Speed Index measured below.",
            recommendation:
              "Fix the failing Core Web Vitals and asset checks below — they directly determine this score.",
          },
  };
};

// ───────────────── Mobile Experience (Load Speed + Usability) ─────────────────
// Both metrics need a real mobile-emulated render, so they share ONE dedicated tab
// (never the shared audit page). The tab is throttled to a representative mid-tier
// mobile profile (Slow-4G network + 4× CPU) to TIME the full load, then the throttle
// is lifted and the rendered DOM is inspected for responsiveness, tap-target sizing
// and legible fonts. Returns { mobileLoadSpeed, mobileUsability } (either may be null
// if measurement fails — a null metric is simply excluded from the weighted total).

const MOBILE_NAV_TIMEOUT_MS = 60000;

// Build the Mobile Load Speed metric from the throttled full-load timing.
const buildMobileLoadSpeed = (loadMs, timedOut, navTiming) => {
  const seconds = parseFloat((loadMs / 1000).toFixed(1));
  const GOOD = 5000, POOR = 10000; // throttled (Slow 4G + 4× CPU) full-load thresholds
  const score = timedOut ? 0 : calculateScore(loadMs, GOOD, POOR);
  const status = timedOut ? "fail" : calculateStatus(loadMs, GOOD, POOR);

  const causes = [];
  const recommendations = [];
  if (status !== "pass") {
    if (navTiming && navTiming.ttfb > 1200) {
      causes.push(`Slow server response on mobile (TTFB ${navTiming.ttfb}ms)`);
      recommendations.push("Improve server response time and serve mobile visitors from a CDN/edge cache.");
    }
    if (navTiming && navTiming.transferKB > 2048) {
      causes.push(`Large page weight (${navTiming.transferKB}KB) over a mobile connection`);
      recommendations.push("Reduce total bytes: compress images, code-split JS and defer non-critical assets.");
    }
    if (causes.length === 0) {
      causes.push(
        timedOut
          ? "The page never fired window.onload within the time limit on a throttled mobile connection."
          : "Heavy assets and scripts slow the full load on a throttled mobile connection."
      );
      recommendations.push("Lazy-load below-the-fold media, defer third-party scripts and shrink the critical payload.");
    }
  }

  return {
    score,
    status,
    details: timedOut
      ? `Page did not finish loading on mobile within ${MOBILE_NAV_TIMEOUT_MS / 1000}s.`
      : status === "pass"
        ? `Page fully loaded on mobile in ${seconds}s.`
        : `Page took ${seconds}s to fully load on mobile.`,
    meta: {
      value: seconds + "s",
      emulation: "iPhone viewport · Slow 4G · 4× CPU throttle",
      waitedFor: "window.onload",
      ttfb: navTiming ? navTiming.ttfb + "ms" : null,
      domContentLoaded: navTiming ? navTiming.domContentLoaded + "ms" : null,
      transferKB: navTiming ? navTiming.transferKB : null,
      thresholds: { Good: "0-5s", Warning: "5-10s", Poor: "10s+" },
    },
    analysis: status === "pass" ? null : { cause: causes[0], recommendation: recommendations[0], causes, recommendations },
  };
};

// Build the Mobile Usability metric from the DOM inspection.
// Sub-scores sum to 100: viewport 25, responsive layout 30, tap targets 30, fonts 15.
const buildMobileUsability = (d) => {
  if (!d) return notCalculated(
    "Mobile usability could not be measured — the mobile render returned no DOM data to inspect.",
    "Re-run the audit; if it persists the site may be blocking the mobile/headless browser."
  );

  let viewportPts = 0;
  if (d.hasViewport && d.usesDeviceWidth && d.allowsScaling) viewportPts = 25;
  else if (d.hasViewport && d.usesDeviceWidth) viewportPts = 18; // present but blocks zoom
  else if (d.hasViewport) viewportPts = 12;

  const responsivePts = d.horizontalOverflow
    ? Math.max(0, 30 - Math.min(30, Math.round(d.overflowPx / 15)))
    : 30;

  const tapRatio = d.totalTargets === 0 ? 1 : (d.totalTargets - d.smallCount) / d.totalTargets;
  const tapPts = Math.round(tapRatio * 30);

  const fontRatio = d.fontSampleTotal === 0 ? 1 : (d.fontSampleTotal - d.smallFontCount) / d.fontSampleTotal;
  const fontPts = Math.round(fontRatio * 15);

  const score = Math.max(0, Math.min(100, viewportPts + responsivePts + tapPts + fontPts));
  let status = "pass";
  if (score < 90) status = "warning";
  if (score < 50) status = "fail";

  const causes = [];
  const recommendations = [];
  if (!d.hasViewport) {
    causes.push("No responsive viewport meta tag");
    recommendations.push('Add <meta name="viewport" content="width=device-width, initial-scale=1">.');
  } else if (!d.usesDeviceWidth) {
    causes.push("Viewport meta tag does not use width=device-width");
    recommendations.push("Set the viewport to width=device-width so the layout adapts to the screen.");
  } else if (!d.allowsScaling) {
    causes.push("Viewport disables pinch-zoom (user-scalable=no / maximum-scale=1)");
    recommendations.push("Allow users to zoom — remove user-scalable=no and maximum-scale=1 from the viewport.");
  }
  if (d.horizontalOverflow) {
    causes.push(`Content is ${d.overflowPx}px wider than the screen (horizontal scrolling)`);
    recommendations.push("Make wide elements fluid (max-width:100%, avoid fixed pixel widths) to remove horizontal scroll.");
  }
  if (d.smallCount > 0) {
    causes.push(`${d.smallCount} of ${d.totalTargets} tap targets are smaller than 44×44px`);
    recommendations.push("Enlarge buttons/links to at least 44×44px and space them out for comfortable tapping.");
  }
  if (d.smallFontCount > 0) {
    causes.push(`${d.smallFontCount} text elements use a font smaller than 12px`);
    recommendations.push("Use a base body font size of at least 16px for readable text on mobile.");
  }

  return {
    score,
    status,
    details: status === "pass"
      ? "Page is mobile-friendly: responsive, legible and easy to tap."
      : "Mobile usability issues detected (layout, tap targets or legibility).",
    meta: {
      value: score + "%",
      viewport: d.hasViewport ? (d.allowsScaling ? "Configured" : "Blocks zoom") : "Missing",
      viewportContent: d.vpContent || "None",
      horizontalScroll: d.horizontalOverflow ? `${d.overflowPx}px overflow` : "None",
      tapTargets: `${d.totalTargets - d.smallCount}/${d.totalTargets} adequately sized`,
      smallTapTargets: d.smallTargets,
      overflowingElements: d.overflowingElements,
      legibleFonts: d.fontSampleTotal === 0 ? "N/A" : `${d.fontSampleTotal - d.smallFontCount}/${d.fontSampleTotal} ≥12px`,
      breakdown: { viewport: viewportPts, responsive: responsivePts, tapTargets: tapPts, fonts: fontPts },
      thresholds: { Good: "≥90%", Warning: "50-89%", Poor: "<50%" },
    },
    analysis: status === "pass" ? null : { cause: causes[0], recommendation: recommendations[0], causes, recommendations },
  };
};

const measureMobileExperience = async ({ url, page, browser }) => {
  let tab;
  try {
    tab = await browser.newPage({
      viewport: { width: 390, height: 844 },
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      isMobile: true,
      hasTouch: true,
      deviceScaleFactor: 3,
    });

    // Emulate a mid-tier mobile device on Slow 4G via CDP (Chromium only). Best-effort:
    // if the CDP session can't be created we simply measure unthrottled.
    let client = null;
    try {
      client = await tab.context().newCDPSession(tab);
      await client.send("Network.enable");
      await client.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 150,                                 // ms RTT (Slow 4G)
        downloadThroughput: (1.6 * 1024 * 1024) / 8,  // ~1.6 Mbps
        uploadThroughput: (750 * 1024) / 8,           // ~750 Kbps
      });
      await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    } catch {
      client = null;
    }

    let loadMs;
    let timedOut = false;
    try {
      const t0 = Date.now();
      await tab.goto(url, { waitUntil: "load", timeout: MOBILE_NAV_TIMEOUT_MS });
      loadMs = Date.now() - t0;
    } catch {
      timedOut = true;
      loadMs = MOBILE_NAV_TIMEOUT_MS;
    }

    // Lift throttling so the DOM inspection below runs quickly.
    if (client) {
      try {
        await client.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        await client.send("Network.emulateNetworkConditions", {
          offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1,
        });
      } catch {}
    }

    const navTiming = timedOut
      ? null
      : await tab.evaluate(() => {
          const nav = performance.getEntriesByType("navigation")[0];
          if (!nav) return null;
          return {
            ttfb: Math.round(nav.responseStart),
            domContentLoaded: Math.round(nav.domContentLoadedEventEnd),
            load: Math.round(nav.loadEventEnd),
            transferKB: Math.round((nav.transferSize || 0) / 1024),
          };
        });

    const usabilityData = await tab.evaluate(() => {
      // Viewport meta configuration.
      const vp = document.querySelector('meta[name="viewport"]');
      const vpContent = vp?.getAttribute("content") || "";
      const hasViewport = !!vp;
      const allowsScaling =
        hasViewport &&
        !/user-scalable\s*=\s*no/i.test(vpContent) &&
        !/maximum-scale\s*=\s*1(\.0)?\b/i.test(vpContent);
      const usesDeviceWidth = /width\s*=\s*device-width/i.test(vpContent);

      // Responsiveness — horizontal overflow beyond the viewport width.
      const winWidth = window.innerWidth;
      const docWidth = Math.max(
        document.documentElement.scrollWidth,
        document.body ? document.body.scrollWidth : 0
      );
      const overflowPx = Math.max(0, docWidth - winWidth);
      const horizontalOverflow = overflowPx > 5; // small tolerance for sub-pixel rounding

      const overflowingElements = [];
      if (horizontalOverflow) {
        const all = document.querySelectorAll("body *");
        const cap = Math.min(all.length, 4000);
        for (let i = 0; i < cap; i++) {
          const el = all[i];
          const r = el.getBoundingClientRect();
          if (r.width > 0 && r.right > winWidth + 5) {
            const cls =
              el.className && typeof el.className === "string"
                ? el.className.trim().split(/\s+/).slice(0, 2).join(".")
                : "";
            overflowingElements.push({
              tag: el.tagName.toLowerCase(),
              cls,
              right: Math.round(r.right),
            });
            if (overflowingElements.length >= 6) break;
          }
        }
      }

      // Tap-target sizing — interactive elements should be ≥44×44px.
      const MIN = 44;
      const interactiveSel =
        'a[href], button, input:not([type="hidden"]), select, textarea, [role="button"], [onclick]';
      const targets = Array.from(document.querySelectorAll(interactiveSel)).filter((el) => {
        const style = window.getComputedStyle(el);
        if (style.visibility === "hidden" || style.display === "none") return false;
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0;
      });
      const totalTargets = targets.length;
      const smallTargets = [];
      for (const el of targets) {
        const r = el.getBoundingClientRect();
        if (r.width < MIN || r.height < MIN) {
          if (smallTargets.length < 10) {
            smallTargets.push({
              tag: el.tagName.toLowerCase(),
              text: (el.innerText || el.value || el.getAttribute("aria-label") || "").trim().slice(0, 40),
              size: `${Math.round(r.width)}x${Math.round(r.height)}px`,
            });
          }
        }
      }
      const smallCount = targets.reduce((n, el) => {
        const r = el.getBoundingClientRect();
        return n + (r.width < MIN || r.height < MIN ? 1 : 0);
      }, 0);

      // Legible fonts — leaf text nodes should render at ≥12px.
      const textEls = Array.from(
        document.querySelectorAll("p, span, li, a, td, th, label, h1, h2, h3, h4, h5, h6, div")
      ).filter((el) => el.children.length === 0 && el.textContent && el.textContent.trim().length > 0);
      const sampleFont = textEls.slice(0, 400);
      let smallFontCount = 0;
      for (const el of sampleFont) {
        const fs = parseFloat(window.getComputedStyle(el).fontSize);
        if (fs && fs < 12) smallFontCount++;
      }

      return {
        hasViewport, allowsScaling, usesDeviceWidth, vpContent,
        horizontalOverflow, overflowPx, overflowingElements,
        totalTargets, smallCount, smallTargets,
        fontSampleTotal: sampleFont.length, smallFontCount,
      };
    });

    try { await tab.close(); } catch {}

    return {
      mobileLoadSpeed: buildMobileLoadSpeed(loadMs, timedOut, navTiming),
      mobileUsability: buildMobileUsability(usabilityData),
    };
  } catch {
    try { if (tab) await tab.close(); } catch {}
    // The mobile render failed entirely — surface both metrics as "not calculated"
    // (with the reason) instead of hiding them.
    return {
      mobileLoadSpeed: notCalculated(
        "Mobile load speed could not be measured — the mobile browser render failed (navigation or browser error).",
        "Re-run the audit; if it persists the site may be blocking the mobile/headless browser or timing out."
      ),
      mobileUsability: notCalculated(
        "Mobile usability could not be measured — the mobile browser render failed (page context unavailable).",
        "Re-run the audit; if it persists the site may be blocking the mobile/headless browser or timing out."
      ),
    };
  }
};

// ───────────────── Rendering Performance (layout stability / visual jank) ─────────────────
// How stable the layout is while the page loads — scored on Lighthouse CLS, but its
// value over the raw CLS vital is surfacing the FIXABLE culprits (unsized images and
// the specific shifting elements) with an affected list. Lazy-loading of media is now
// a separate metric (see Lazy Loading) so the two no longer double-count.
const evaluateRenderingPerformance = (audits) => {
  const clsAudit = audits["cumulative-layout-shift"];
  if (clsAudit?.numericValue == null && !audits["layout-shifts"]) {
    return notCalculated(
      "Rendering performance could not be analyzed — Lighthouse returned no layout-stability data for this URL.",
      "Confirm the site loads in Google PageSpeed Insights, then re-run the audit."
    );
  }
  const cls = parseFloat((clsAudit?.numericValue || 0).toFixed(3));
  const shiftItems = audits["layout-shifts"]?.details?.items || [];
  const unsized = audits["unsized-images"]?.details?.items || [];

  const score = calculateScore(cls, 0.1, 0.25);
  const status = calculateStatus(cls, 0.1, 0.25);

  const causes = [];
  const recommendations = [];
  if (status !== "pass") {
    if (unsized.length > 0) {
      causes.push(`${unsized.length} image(s) without width/height attributes causing reflow`);
      recommendations.push("Add explicit width & height (or CSS aspect-ratio) to images so the browser reserves space.");
    }
    if (shiftItems.length > 0) {
      causes.push(`${shiftItems.length} element(s) shifting position during load`);
      recommendations.push("Reserve space for ads/embeds/banners and avoid injecting content above existing content.");
    }
    if (causes.length === 0) {
      causes.push(`Cumulative Layout Shift is ${cls} (target ≤ 0.1)`);
      recommendations.push("Reserve space for late-loading content and use font-display:swap to stop text reflow.");
    }
  }

  const unsizedSamples = unsized.slice(0, 10).map((it) => {
    let fileName = "image";
    try { const p = new URL(it.url).pathname; fileName = p.substring(p.lastIndexOf("/") + 1) || "image"; } catch {}
    return { fileName, snippet: (it.node?.snippet || "").slice(0, 160) };
  });

  return {
    score,
    status,
    details: status === "pass"
      ? "Layout is visually stable — minimal shifting during load."
      : `Layout shifts during load (CLS ${cls}).`,
    meta: {
      value: score + "%",
      cls,
      layoutShiftElements: shiftItems.length,
      unsizedImages: unsized.length,
      unsizedImageSamples: unsizedSamples,
      thresholds: { Good: "≥90%", Warning: "50-89%", Poor: "<50%" },
    },
    analysis: status === "pass" ? null : { cause: causes[0], recommendation: recommendations[0], causes, recommendations },
  };
};

// ───────────────── Lazy Loading Implementation ─────────────────
// Share of deferrable media that actually defers: below-the-fold images & iframes
// using loading="lazy", plus <video> using preload="none"/"metadata". Cross-checked
// against Lighthouse's offscreen-images audit so a good ratio with real offscreen
// waste can't read as a perfect score.
const evaluateLazyLoading = async (audits, page) => {
  try {
    const m = await page.evaluate(() => {
      const vh = window.innerHeight || 800;
      const fileNameOf = (src) => {
        try { const p = new URL(src).pathname; return p.substring(p.lastIndexOf("/") + 1) || "media"; } catch { return "media"; }
      };
      const eager = [];

      const imgs = Array.from(document.querySelectorAll("img"));
      let imgBelow = 0, imgLazy = 0;
      for (const img of imgs) {
        const top = img.getBoundingClientRect().top + window.scrollY;
        if (top > vh) {
          imgBelow++;
          if (img.getAttribute("loading") === "lazy") imgLazy++;
          else if (eager.length < 12) {
            const src = img.currentSrc || img.src || "";
            eager.push({ type: "img", fileName: fileNameOf(src), src: src.slice(0, 160), top: Math.round(top) });
          }
        }
      }

      const iframes = Array.from(document.querySelectorAll("iframe"));
      let ifBelow = 0, ifLazy = 0;
      for (const f of iframes) {
        const top = f.getBoundingClientRect().top + window.scrollY;
        if (top > vh) {
          ifBelow++;
          if (f.getAttribute("loading") === "lazy") ifLazy++;
          else if (eager.length < 12) eager.push({ type: "iframe", fileName: fileNameOf(f.src || ""), src: (f.src || "").slice(0, 160), top: Math.round(top) });
        }
      }

      const vids = Array.from(document.querySelectorAll("video"));
      let vidDeferred = 0;
      for (const v of vids) {
        const preload = (v.getAttribute("preload") || "").toLowerCase();
        if (preload === "none" || preload === "metadata") vidDeferred++;
        else if (eager.length < 12) eager.push({ type: "video", fileName: fileNameOf(v.currentSrc || v.src || "video"), src: (v.currentSrc || v.src || "").slice(0, 160), top: 0 });
      }

      return {
        totalImages: imgs.length, imgBelow, imgLazy,
        totalIframes: iframes.length, ifBelow, ifLazy,
        totalVideos: vids.length, vidDeferred, eager,
      };
    });

    const offscreen = audits["offscreen-images"]?.details?.items || [];
    const offscreenSavingsKB = Math.round((audits["offscreen-images"]?.details?.overallSavingsBytes || 0) / 1024);

    const deferrable = m.imgBelow + m.ifBelow + m.totalVideos;
    const deferred = m.imgLazy + m.ifLazy + m.vidDeferred;
    const eagerCount = Math.max(0, deferrable - deferred);

    let score;
    if (deferrable === 0) score = offscreen.length > 0 ? 70 : 100; // nothing deferrable on screen
    else score = Math.round((deferred / deferrable) * 100);
    if (offscreen.length > 0 && score > 85) score = 85; // Lighthouse still sees deferrable waste

    let status = "pass";
    if (score < 90) status = "warning";
    if (score < 50) status = "fail";

    const causes = [];
    const recommendations = [];
    if (eagerCount > 0) {
      causes.push(`${eagerCount} below-the-fold media item(s) load eagerly instead of lazily`);
      recommendations.push('Add loading="lazy" to below-the-fold images & iframes and preload="none" to videos.');
    } else if (offscreen.length > 0) {
      causes.push(`${offscreen.length} offscreen image(s) could be deferred (~${offscreenSavingsKB}KB)`);
      recommendations.push("Defer offscreen images so the browser renders the visible viewport first.");
    }

    return {
      score,
      status,
      details: deferrable === 0 && offscreen.length === 0
        ? "No below-the-fold media that needs deferring."
        : status === "pass"
          ? "Below-the-fold media is deferred (lazy-loaded)."
          : "Some below-the-fold media loads eagerly instead of lazily.",
      meta: {
        value: score + "%",
        totalImages: m.totalImages,
        belowFoldImages: m.imgBelow,
        lazyImages: m.imgLazy,
        eagerImages: Math.max(0, m.imgBelow - m.imgLazy),
        totalIframes: m.totalIframes,
        belowFoldIframes: m.ifBelow,
        lazyIframes: m.ifLazy,
        totalVideos: m.totalVideos,
        deferredVideos: m.vidDeferred,
        offscreenImages: offscreen.length,
        offscreenSavingsKB,
        eagerMediaSamples: m.eager,
        thresholds: { Good: "≥90%", Warning: "50-89%", Poor: "<50%" },
      },
      analysis: status === "pass" ? null : { cause: causes[0], recommendation: recommendations[0], causes, recommendations },
    };
  } catch {
    return notCalculated(
      "Lazy-loading could not be analyzed — the page context was unavailable during inspection.",
      "Re-run the audit; if it persists the page may have navigated away or blocked script evaluation."
    );
  }
};

// ───────────────── Third-Party Script Optimization ─────────────────
// Extracts each third-party (cross-origin) <script>'s async/defer/blocking status from
// the live DOM, combined with Lighthouse's third-party-summary main-thread blocking time.
const evaluateThirdPartyOptimization = async (audits, page) => {
  try {
    const m = await page.evaluate(() => {
      const host = location.hostname.replace(/^www\./, "");
      const fileNameOf = (src) => {
        try { const p = new URL(src).pathname; return p.substring(p.lastIndexOf("/") + 1) || src; } catch { return src; }
      };
      const scripts = Array.from(document.querySelectorAll("script[src]"));
      const third = [];
      for (const s of scripts) {
        let u; try { u = new URL(s.src, location.origin); } catch { continue; }
        if (!/^https?:$/.test(u.protocol)) continue;
        const h = u.hostname.replace(/^www\./, "");
        const firstParty = h === host || h.endsWith("." + host) || host.endsWith("." + h);
        if (firstParty) continue;
        const loading = s.defer ? "defer" : (s.async ? "async" : "blocking");
        third.push({ url: s.src, fileName: fileNameOf(s.src), host: u.hostname, loading });
      }
      return { totalScripts: scripts.length, third };
    });

    const total = m.third.length;
    const blocking = m.third.filter((s) => s.loading === "blocking");
    const optimized = total - blocking.length; // async or defer

    const tpItems = audits["third-party-summary"]?.details?.items || [];
    const tpBlockingMs = Math.round(tpItems.reduce((s, i) => s + (i.blockingTime || 0), 0));
    const entities = tpItems
      .filter((i) => (i.blockingTime || 0) > 0)
      .sort((a, b) => (b.blockingTime || 0) - (a.blockingTime || 0))
      .slice(0, 10)
      .map((i) => ({
        entity: typeof i.entity === "string" ? i.entity : (i.entity?.text || "Third-party"),
        blockingMs: Math.round(i.blockingTime || 0),
      }));

    let score;
    if (total === 0) score = 100;
    else score = Math.round((optimized / total) * 100);
    // A high async/defer ratio still can't read as perfect if third parties block the
    // main thread for a long time.
    if (tpBlockingMs > 250 && score > 80) score = 80;
    if (tpBlockingMs > 600) score = Math.min(score, 50);

    let status = "pass";
    if (score < 90) status = "warning";
    if (score < 50) status = "fail";

    const causes = [];
    const recommendations = [];
    if (blocking.length > 0) {
      causes.push(`${blocking.length} of ${total} third-party script(s) load synchronously (no async/defer)`);
      recommendations.push("Add async or defer to third-party <script> tags so they don't block HTML parsing.");
    }
    if (tpBlockingMs > 250) {
      causes.push(`Third-party code blocks the main thread for ~${tpBlockingMs}ms`);
      recommendations.push("Lazy-load or facade non-critical third parties (chat, ads, analytics) and remove unused ones.");
    }
    if (causes.length === 0 && total > 0) {
      causes.push(`${total} third-party script(s) present`);
      recommendations.push("Audit third-party scripts periodically and remove any that are unused.");
    }

    return {
      score,
      status,
      details: total === 0
        ? "No third-party scripts detected."
        : status === "pass"
          ? "Third-party scripts load efficiently (async/defer) with low main-thread cost."
          : "Third-party scripts are blocking or main-thread heavy.",
      meta: {
        value: score + "%",
        totalScripts: m.totalScripts,
        thirdPartyScripts: total,
        asyncDeferCount: optimized,
        blockingCount: blocking.length,
        thirdPartyBlockingMs: tpBlockingMs,
        blockingScripts: blocking.slice(0, 10),
        entities,
        thresholds: { Good: "≥90%", Warning: "50-89%", Poor: "<50%" },
      },
      analysis: status === "pass" ? null : { cause: causes[0], recommendation: recommendations[0], causes, recommendations },
    };
  } catch {
    return notCalculated(
      "Third-party script optimization could not be analyzed — the page context was unavailable during inspection.",
      "Re-run the audit; if it persists the page may have navigated away or blocked script evaluation."
    );
  }
};

// ───────────────── JavaScript Execution Efficiency ─────────────────
// A standalone metric for how long JavaScript ties up the main thread, from Lighthouse's
// bootup-time ("Reduce JavaScript execution time") plus mainthread-work-breakdown —
// previously only read as a cause for INP/TBT.
const evaluateJsExecution = (audits) => {
  const bootup = audits["bootup-time"];
  const mainThread = audits["mainthread-work-breakdown"];
  if (!bootup && !mainThread) {
    return notCalculated(
      "JavaScript execution efficiency could not be measured — Lighthouse returned no bootup/main-thread data for this URL.",
      "Confirm the site loads in Google PageSpeed Insights, then re-run the audit."
    );
  }
  const bootupMs = Math.round(bootup?.numericValue || 0);
  const mainThreadMs = Math.round(mainThread?.numericValue || 0);

  // Lighthouse "Reduce JavaScript execution time": good ≤ ~2s, poor ≥ 3.5s.
  const score = calculateScore(bootupMs, 2000, 3500);
  const status = calculateStatus(bootupMs, 2000, 3500);

  const topScripts = (bootup?.details?.items || [])
    .slice()
    .sort((a, b) => (b.scripting || 0) - (a.scripting || 0))
    .slice(0, 10)
    .map((it) => {
      const url = it.url || "";
      let fileName = url;
      try { const p = new URL(url).pathname; fileName = p.substring(p.lastIndexOf("/") + 1) || url; } catch {}
      return { fileName, url, scriptingMs: Math.round(it.scripting || 0), parseMs: Math.round(it.scriptParseCompile || 0) };
    });

  const causes = [];
  const recommendations = [];
  if (status !== "pass") {
    causes.push(`JavaScript executes for ${msToSec(bootupMs)} during load (target ≤ 2s)`);
    recommendations.push("Code-split and defer non-critical JS, remove unused JavaScript, and trim polyfills.");
    if (mainThreadMs > 4000) {
      causes.push(`Main thread is busy for ${msToSec(mainThreadMs)} (parse/compile/execute)`);
      recommendations.push("Break up long tasks and move heavy work off the main thread (Web Workers).");
    }
  }

  return {
    score,
    status,
    details: status === "pass"
      ? `JavaScript execution is efficient (${msToSec(bootupMs)}).`
      : `JavaScript executes for ${msToSec(bootupMs)} during load.`,
    meta: {
      value: msToSec(bootupMs),
      jsExecutionTime: msToSec(bootupMs),
      mainThreadTime: msToSec(mainThreadMs),
      topScripts,
      thresholds: { Good: "0-2s", Warning: "2-3.5s", Poor: "3.5s+" },
    },
    analysis: status === "pass" ? null : { cause: causes[0], recommendation: recommendations[0], causes, recommendations },
  };
};

// Sold-vehicle / 404 handling (VDP/SRP specific) — tests how the website handles invalid
// or expired inventory URLs (e.g. redirected to active inventory / homepage or returning a clean 404).
async function evaluateSoldVehicleHandling(url, pageType) {
  const meta = { checkedUrl: null, finalUrl: null, status: null, redirected: false, detectedKeywords: [] };
  
  if (pageType !== "vdp" && pageType !== "srp") {
    return { score: null, status: "not_applicable", infoOnly: true, confidence: "heuristic", details: "Not applicable on this page type", meta, analysis: null };
  }
  
  let targetUrl = url;
  try {
    const parsed = new URL(url);
    let pathname = parsed.pathname;
    
    // Look for 17-character VIN
    const vinMatch = pathname.match(/\/([a-hj-npr-z0-9]{17})\b/i);
    if (vinMatch) {
      const vin = vinMatch[1];
      const lastChar = vin.slice(-1);
      const newLastChar = lastChar === "1" ? "2" : "1";
      const mutatedVin = vin.slice(0, -1) + newLastChar;
      pathname = pathname.replace(vin, mutatedVin);
    } else {
      // Look for 4+ digit stock/ID sequence
      const digitMatch = pathname.match(/\/(\d{4,})\b/);
      if (digitMatch) {
        const digits = digitMatch[1];
        const lastDigit = digits.slice(-1);
        const newLastDigit = lastDigit === "1" ? "2" : "1";
        const mutatedDigits = digits.slice(0, -1) + newLastDigit;
        pathname = pathname.replace(digits, mutatedDigits);
      } else {
        pathname = pathname.replace(/\/?$/, "-nonexistent-vehicle-12345");
      }
    }
    
    parsed.pathname = pathname;
    targetUrl = parsed.toString();
  } catch (err) {
    targetUrl = url + "-nonexistent-vehicle-12345";
  }
  
  meta.checkedUrl = targetUrl;
  
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    
    const finalUrl = res.url;
    meta.finalUrl = finalUrl;
    meta.status = res.status;
    
    const originalPath = (new URL(url)).pathname.toLowerCase().replace(/\/+$/, "");
    const finalPath = (new URL(finalUrl)).pathname.toLowerCase().replace(/\/+$/, "");
    
    if (finalPath !== originalPath && (finalPath.includes("/inventory") || finalPath.includes("/search") || finalPath.includes("/vehicles") || finalPath === "" || finalPath === "/")) {
      meta.redirected = true;
      const score = (finalPath === "" || finalPath === "/") ? 60 : 100;
      return {
        score,
        status: score === 100 ? "pass" : "warning",
        confidence: "heuristic",
        details: `Redirected to inventory/SRP page: ${finalUrl}`,
        meta,
        analysis: score === 100 ? null : {
          cause: "The mutated VDP URL redirects directly to the homepage instead of a specific SRP/inventory search results page.",
          recommendation: "Configure 301 redirects to send visitors of expired inventory to a relevant make/model search page rather than the main homepage."
        }
      };
    }
    
    if (res.status === 404 || res.status === 410) {
      return {
        score: 40,
        status: "warning",
        confidence: "heuristic",
        details: "Server returned a hard 404 page, which wastes search crawler budget.",
        meta,
        analysis: {
          cause: "The expired/removed vehicle URL returns a hard 404 error instead of redirecting.",
          recommendation: "Implement 301 redirects to guide users and search bots to similar active inventory or search pages."
        }
      };
    }
    
    const text = await res.text();
    const lowerText = text.toLowerCase();
    const soft404Keywords = ["no longer available", "vehicle sold", "sold", "not found", "error 404", "page not found", "vehicle is no longer", "inventory not found"];
    const foundKeywords = soft404Keywords.filter(k => lowerText.includes(k));
    meta.detectedKeywords = foundKeywords;
    
    if (foundKeywords.length > 0) {
      return {
        score: 0,
        status: "fail",
        confidence: "heuristic",
        details: `Soft-404 detected. Server returned status 200 but page copy contains: "${foundKeywords[0]}"`,
        meta,
        analysis: {
          cause: "The URL of the sold vehicle returns a 200 status but displays a 'no longer available' notice, creating a soft-404.",
          recommendation: "Instead of serving a 200 page with sold messages, return a 301 redirect to a relevant SRP or in-stock alternative vehicle."
        }
      };
    }
    
    return {
      score: 100,
      status: "pass",
      confidence: "heuristic",
      details: "URL resolved successfully, no soft-404 keywords detected.",
      meta,
      analysis: null
    };
    
  } catch (e) {
    return {
      score: 40,
      status: "warning",
      confidence: "heuristic",
      details: `Request timed out or failed (${e.message}). Treated as standard 404 handling.`,
      meta,
      analysis: null
    };
  } finally {
    clearTimeout(timer);
  }
}

// MAIN FUNCTION
//
// Rebuilt to AUDIT_FRAMEWORK_SPECIFICATION §2.1 (Technical). Changes vs. the old engine:
//   • Rule 2 (field beats lab, never both): each Core Web Vital is weighted ONCE —
//     CrUX field p75 when present (confidence: field), else the lab estimate
//     (confidence: lab). INP/TBT collapse to one slot (CrUX INP, else lab TBT).
//   • Rule 1 (graded): scoring is log-normal (see calculateScore) + graded redirect.
//   • Spec weights-in-section: LCP 22 / INP·TBT 20 / CLS 18 / FCP 8 / TTFB 8 / SI 6 /
//     Render-blocking 5 / Resource-opt 5 / Compression 4 / Caching 4 / Redirect 3.
//   • Rule 4 + delegated decision: deprecated/duplicate/diagnostic signals (FID,
//     Mobile Usability, Inventory/Service page-load, Rendering/Lazy/Third-party/JS)
//     are no longer computed or returned — they double-counted CWV or were retired.
//   • §0.5 confidence flag surfaced per-CWV and as a section-level summary.
export default async function technicalMetrics(url, device, page, response, browser, pageType = null, psiPrefetch = null, siteSubType = null, market = null, onPageReleased = null) {

  // Only call PageSpeed for the user-selected device strategy (1 API call, not 2).
  const wantDevice = String(device || "mobile").toLowerCase() === "desktop" ? "desktop" : "mobile";

  // ── Phase 1: everything that needs the LIVE PAGE, before PageSpeed is awaited ──
  //
  // Ordering here is load-bearing, not cosmetic. These five checks used to run AFTER
  // the PageSpeed await, which meant Chromium had to stay open for the entire PSI
  // wait even though none of this needs PageSpeed. Measured on www.toyota.com
  // (2026-08-07), five runs of the identical URL took 29.6s, 63.9s, 112.5s, and twice
  // over 150s — so that hold is unpredictable as well as long, and it is the reason a
  // slow PageSpeed call used to cost the audit a browser slot rather than just a
  // metric. Running them first lets the worker release the browser (see
  // `onPageReleased` below) and wait for PageSpeed with nothing expensive held.
  const compression = await evaluateCompression(page);
  const caching = await evaluateCaching(page);
  const resourceOptimization = await evaluateResourceOptimization(page);
  const redirect = evaluateRedirectChains(response);
  // Only the DOM scan needs the page; its scoring happens in phase 2 once Lighthouse's
  // measured milliseconds are (or are not) available.
  const renderBlockingDom = await collectRenderBlockingDom(page);

  // The page is no longer needed. Telling the worker now is what actually frees the
  // browser slot — without this the release would still be gated on PageSpeed.
  // Guarded because a throwing callback here must never fail the pillar.
  try { onPageReleased?.(); } catch { /* never let the caller's hook break Technical */ }

  // ── Phase 2: PageSpeed, and everything derived from it ──
  //
  // [PERF] PageSpeed needs nothing but the URL, yet this pillar only starts after the
  // browser has launched, rendered and cleared bot protection. The worker can therefore
  // fire the call up-front and hand us the in-flight promise (see auditOnePage), which
  // buys back the whole page-setup window — ~2s on a clean site, 10–30s on one with a
  // challenge. `device` is carried alongside so a strategy mismatch falls back to a
  // fresh call rather than silently scoring the wrong viewport.
  const data = await (
    psiPrefetch?.device === wantDevice && psiPrefetch?.promise
      ? psiPrefetch.promise
      : googleAPI(url, wantDevice)
  );
  const audits = data?.lighthouseResult?.audits || {};
  const cruxMetrics = data?.loadingExperience?.metrics || {};

  // If PageSpeed returned no usable Lighthouse result (after retries), `audits` is {}.
  // Every lab evaluator reads `audits[x]?.numericValue || 0`, and calculateScore(0)=100
  // — so a failed API would silently fabricate a PERFECT score for every Core Web Vital
  // and a 100% headline. Detect that and mark the lab metrics "not calculated" instead
  // (the CrUX/field evaluators already return null when their data is absent).
  const psiUsable = !!data?.lighthouseResult;
  // googleAPI attaches a classified `_psiFailure` ({kind, code, reason}) whenever it
  // gives up. Prefer it: the old blanket string listed every possible cause at once
  // ("too slow, blocking automated requests, or the API key/quota is unavailable"),
  // which sent people to the Cloud Console for what was usually a slow target page or
  // our own attempt deadline firing. Fall back to the generic wording only if the
  // failure came from somewhere that predates the classifier.
  const psiFailure = data?._psiFailure;
  const PSI_FAIL_REASON = psiFailure?.reason
    || "Google PageSpeed could not analyze this URL — Lighthouse returned no data (the site may be too slow, blocking automated requests, or the PageSpeed API key/quota is unavailable).";
  // Point the reader at the thing that is actually wrong, not at a generic checklist.
  const PSI_FAIL_REC = {
    auth: "Fix the PageSpeed API key in Google Cloud Console: enable the PageSpeed Insights API on its project and remove any HTTP-referrer restriction (server-side calls send no referrer — use an IP restriction or none).",
    config: "Set API_KEY in the platform configuration (or the backend environment) and re-run the audit.",
    quota: "The PageSpeed daily/per-minute quota is exhausted. Wait for the quota window to reset or request a higher limit, then re-run the audit.",
    crawl: "This is a problem with the target page, not the audit: open it in Google PageSpeed Insights to confirm. Typical causes are bot protection blocking Google's crawler, a redirect chain, a non-HTML response, or a page that never paints.",
    timeout: "The page is slow enough that Lighthouse ran past this audit's whole PageSpeed budget in one uninterrupted attempt — that is a genuinely heavy page, not a hiccup. Treat the page's own load time as the finding; re-run when the site is under less load, or raise PAGESPEED_TOTAL_BUDGET_MS (and PILLAR_TECH_TIMEOUT_MS with it) if you need the numbers regardless.",
    request: "This is an internal bug in how the audit builds the PageSpeed request — report it rather than changing any site or key setting.",
    upstream: "Google PageSpeed itself returned a server error. Re-run the audit shortly; no configuration change is needed.",
    network: "The backend could not reach googleapis.com. Check outbound network/DNS/proxy from the audit host.",
  }[psiFailure?.kind]
    || "Confirm the site loads in Google PageSpeed Insights and that the PageSpeed API key/quota is configured, then re-run the audit.";
  const labOrNA = (fn) => (psiUsable ? fn() : notCalculated(PSI_FAIL_REASON, PSI_FAIL_REC));

  // One clear decision line — pairs with the [PageSpeed] retry trail so you can confirm
  // the whole flow: retries fired → gave up → section marked Not Run.
  if (!psiUsable) {
    logger.warn(`[Technical] PageSpeed unusable for ${url} (${wantDevice}) [${psiFailure?.code || 'UNCLASSIFIED'}] — Core Web Vitals "Not Run", section excluded from overall (delivery checks still run on the live page). Cause: ${PSI_FAIL_REASON}`);
  }

  const pageSpeedScore = evaluatePageSpeedScore(data, wantDevice);

  const lcpLab = labOrNA(() => evaluateLCPLab(audits));
  const lcpCrux = evaluateLCPCrux(audits, cruxMetrics);
  const clsLab = labOrNA(() => evaluateCLSLab(audits));
  const clsCrux = evaluateCLSCrux(audits, cruxMetrics);
  const fcpLab = labOrNA(() => evaluateFCPLab(audits));
  const fcpCrux = evaluateFCPCrux(audits, cruxMetrics);
  const ttfbLab = labOrNA(() => evaluateTTFBLab(audits));
  const ttfbCrux = evaluateTTFBCrux(cruxMetrics);
  const inpLab = labOrNA(() => evaluateINPLab(audits));
  const inpCrux = evaluateINPCrux(audits, cruxMetrics);
  const tbt = labOrNA(() => evaluateTBT(audits));
  const si = labOrNA(() => evaluateSI(audits));
  // compression / caching / resourceOptimization / redirect were all computed in
  // phase 1, before the PageSpeed await — see the ordering note at the top of this
  // function. Only the render-blocking SCORE waits for Lighthouse, and it degrades to
  // the DOM count exactly as before when PageSpeed returned nothing.
  const renderBlocking = scoreRenderBlocking(renderBlockingDom, audits);

  const getScore = (metric) => metric?.score || 0;

  // Rule 2 — pick field-or-lab per CWV and weight it ONCE. `confidence` records which.
  const lcpPick = lcpCrux || lcpLab;
  const clsPick = clsCrux || clsLab;
  const fcpPick = fcpCrux || fcpLab;
  const ttfbPick = ttfbCrux || ttfbLab;
  // INP·TBT is one parameter: real-user INP (field) if available, else lab TBT.
  const inpTbtPick = inpCrux || tbt;
  
  const soldVehicle = await evaluateSoldVehicleHandling(url, pageType);
  const lcpConf = lcpCrux ? "field" : "lab";
  const clsConf = clsCrux ? "field" : "lab";
  const fcpConf = fcpCrux ? "field" : "lab";
  const ttfbConf = ttfbCrux ? "field" : "lab";
  const inpTbtConf = inpCrux ? "field" : "lab";

  // ── Headline (SCORING_FORMAT.md §8.1): the EXACT Lighthouse Performance score
  // for the audited device, so cross-checks against PageSpeed Insights agree by
  // construction. Preference order:
  //   1. Lighthouse's own category score from the PSI response.
  //   2. Lighthouse's per-audit scores re-weighted with the official formula
  //      (FCP 10% / SI 10% / LCP 25% / TBT 30% / CLS 25%).
  //   3. Our lab evaluators (calculateScore log-normal curves) with the same
  //      weights — only when the PSI response carried no usable audit scores.
  const officialScore = data?.lighthouseResult?.categories?.performance?.score;
  const LH_WEIGHTS = [
    { id: "first-contentful-paint",   weight: 10, fallback: fcpLab },
    { id: "speed-index",              weight: 10, fallback: si },
    { id: "largest-contentful-paint", weight: 25, fallback: lcpLab },
    { id: "total-blocking-time",      weight: 30, fallback: tbt },
    { id: "cumulative-layout-shift",  weight: 25, fallback: clsLab },
  ];
  let headline;
  let headlineSource;
  if (!psiUsable) {
    // No Lighthouse data at all — don't fabricate a score from phantom zeros. The
    // section becomes "Not Run": null Percentage, excluded + renormalized in OverAll.
    headline = null;
    headlineSource = "PageSpeed unavailable after retries — Technical performance not scored";
  } else if (typeof officialScore === "number") {
    headline = Math.round(officialScore * 100);
    headlineSource = "Lighthouse categories.performance.score (PSI, audited device)";
  } else {
    let lhEarned = 0, lhWeight = 0;
    for (const m of LH_WEIGHTS) {
      const auditScore = audits?.[m.id]?.score; // Lighthouse's own 0–1 curve score
      // `?? null` not `getScore()`: getScore is `metric?.score || 0`, which turns an
      // unmeasurable metric's null score into a 0 and folds it into the mean. Both
      // that 0 and the phantom 100 it replaced (see labValueOf) are inventions —
      // drop the metric and renormalize over what was actually measured, which is
      // the same rule OverAll applies to a whole "Not Run" section.
      const fallbackScore = m.fallback?.score ?? null;
      const s = typeof auditScore === "number" ? auditScore * 100 : fallbackScore;
      if (typeof s === "number" && !Number.isNaN(s)) {
        lhEarned += s * m.weight;
        lhWeight += m.weight;
      }
    }
    headline = lhWeight > 0 ? Math.round(lhEarned / lhWeight) : null;
    headlineSource = lhWeight > 0
      ? `Lighthouse metric weights over the ${lhWeight}% of the formula Lighthouse could measure (PSI category score unavailable)`
      : "Lighthouse ran but measured none of the performance metrics — Technical performance not scored";
  }

  // ── Delivery Hygiene sub-score: the dealer-relevant infra checks Lighthouse
  // does NOT fold into its Performance score (SCORING_FORMAT.md §8.1). Kept out
  // of the headline so a PSI cross-check compares like for like; surfaced as an
  // info-only composite card. Renormalized over applicable checks.
  const hygieneParts = [
    { key: "TTFB", metric: ttfbPick, weight: 8 },
    { key: "Render_Blocking", metric: renderBlocking, weight: 5 },
    { key: "Resource_Optimization", metric: resourceOptimization, weight: 5 },
    { key: "Compression", metric: compression, weight: 4 },
    { key: "Caching", metric: caching, weight: 4 },
    { key: "Redirect_Chains", metric: redirect, weight: 3 },
    // Sold-vehicle / soft-404 handling only exists where VDPs expire. Nothing
    // on a service or repair site goes out of stock this way, so it is N/A
    // there — dropped from the denominator, not scored zero.
    ...(isParamApplicable("Sold_Vehicle", siteSubType) && (pageType === "vdp" || pageType === "srp")
      ? [{ key: "Sold_Vehicle", metric: soldVehicle, weight: 5 }]
      : []),
  ];
  let hygEarned = 0, hygWeight = 0;
  const hygieneBreakdown = {};
  const hygieneFailing = [];
  for (const p of hygieneParts) {
    const m = p.metric;
    if (!m || typeof m.score !== "number") continue;
    const w = p.weight * importance(p.key, siteSubType);
    if (w <= 0) continue;
    hygEarned += (m.score / 100) * w;
    hygWeight += w;
    hygieneBreakdown[p.key] = { score: m.score, status: m.status };
    if (m.status && m.status !== "pass") hygieneFailing.push(p.key.replace(/_/g, " "));
  }
  const hygieneScore = hygWeight > 0 ? Math.round((hygEarned / hygWeight) * 100) : null;
  const deliveryHygiene = hygieneScore === null ? null : {
    score: hygieneScore,
    status: hygieneScore >= 80 ? "pass" : hygieneScore >= 50 ? "warning" : "fail",
    infoOnly: true,
    confidence: "lab",
    details: hygieneFailing.length
      ? `Delivery hygiene needs work: ${hygieneFailing.join(", ")}.`
      : "Server response, asset delivery and redirect hygiene all look good.",
    meta: {
      informational: true,
      breakdown: hygieneBreakdown,
      note: "Composite of the delivery checks (TTFB, render-blocking, asset optimization, compression, caching, redirects" + (pageType === "vdp" || pageType === "srp" ? ", sold-vehicle handling" : "") + ") that PageSpeed Insights reports as diagnostics but does not score. Shown separately so the headline stays comparable to PSI.",
    },
    analysis: hygieneFailing.length ? {
      cause: "One or more delivery checks outside Lighthouse's scored metrics are failing.",
      recommendation: "Fix the failing checks below — they improve real-world speed even though they don't move the Lighthouse score directly.",
    } : null,
  };

  // Diagnostic: the previous blended headline (CWV + infra at spec weights),
  // kept for continuity as Graded_Percentage.
  const components = [
    { key: "LCP",                   score: getScore(lcpPick),              weight: 22, present: true },
    { key: "INP",                   score: getScore(inpTbtPick),           weight: 20, present: true },
    { key: "CLS",                   score: getScore(clsPick),              weight: 18, present: true },
    { key: "FCP",                   score: getScore(fcpPick),              weight: 8,  present: true },
    { key: "TTFB",                  score: getScore(ttfbPick),             weight: 8,  present: true },
    { key: "SI",                    score: getScore(si),                   weight: 6,  present: true },
    { key: "Render_Blocking",       score: getScore(renderBlocking),       weight: 5,  present: true },
    { key: "Resource_Optimization", score: getScore(resourceOptimization), weight: 5,  present: true },
    { key: "Compression",           score: getScore(compression),          weight: 4,  present: true },
    { key: "Caching",               score: getScore(caching),              weight: 4,  present: true },
    { key: "Redirect_Chains",       score: getScore(redirect),             weight: 3,  present: true },
    { key: "Sold_Vehicle",          score: getScore(soldVehicle),          weight: 5,  present: isParamApplicable("Sold_Vehicle", siteSubType) && (pageType === "vdp" || pageType === "srp") },
  ];
  const presentComponents = components
    .filter((c) => c.present)
    .map((c) => ({ ...c, weight: c.weight * importance(c.key, siteSubType) }))
    .filter((c) => c.weight > 0);
  const totalWeight = presentComponents.reduce((s, c) => s + c.weight, 0);
  // Null when PSI is unusable — the CWV components are all "not calculated", so a
  // number here would reflect only the asset checks and read as a misleading low score.
  const gradedPercentage = !psiUsable ? null : (totalWeight === 0 ? 0 : parseFloat(
    (presentComponents.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight).toFixed(0)
  ));

  // The headline is a lab Lighthouse score (PSI's own gauge is lab too); CWV
  // cards still carry their individual field/lab confidence.
  const sectionConfidence = "lab";

  return {
    Percentage: headline,
    Graded_Percentage: gradedPercentage,
    Score_Breakdown: {
      model: "exact Lighthouse Performance formula (SCORING_FORMAT.md §8.1)",
      source: headlineSource,
      weights: { FCP: 10, Speed_Index: 10, LCP: 25, TBT: 30, CLS: 25 },
      device: wantDevice,
    },
    Confidence: sectionConfidence,
    PageSpeed_Score: pageSpeedScore,
    Delivery_Hygiene: deliveryHygiene,
    LCP: { lab: lcpLab, crux: lcpCrux, source: lcpConf, confidence: lcpConf },
    CLS: { lab: clsLab, crux: clsCrux, source: clsConf, confidence: clsConf },
    FCP: { lab: fcpLab, crux: fcpCrux, source: fcpConf, confidence: fcpConf },
    TTFB: { lab: ttfbLab, crux: ttfbCrux, source: ttfbConf, confidence: ttfbConf },
    INP: { lab: inpLab, crux: inpCrux, source: inpTbtConf, confidence: inpTbtConf },
    TBT: { lab: tbt, crux: null, confidence: "lab" },
    SI: { lab: si, crux: null, confidence: "lab" },
    Compression: compression,
    Caching: caching,
    Resource_Optimization: resourceOptimization,
    Render_Blocking: renderBlocking,
    Redirect_Chains: redirect,
    Sold_Vehicle: soldVehicle,
  };
}