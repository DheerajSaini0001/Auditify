import googleAPI from "../utils/googleAPI.js";
import fetch from "node-fetch";
import * as cheerio from "cheerio";

function calculateScore(observed, good, poor) {
  if (observed <= good) return 100;
  if (observed >= poor) return 0;
  return parseFloat((((poor - observed) / (poor - good)) * 100).toFixed(0));
}

function calculateStatus(value, goodThreshold, needsImprovementThreshold) {
  if (value <= goodThreshold) return "pass";
  if (value <= needsImprovementThreshold) return "warning";
  return "fail";
}

// Format a millisecond value as seconds for display (e.g. 1800 -> "1.8s", 234 -> "0.23s").
// Used by the latency Core Web Vitals (FCP, INP, FID, TBT) whose value + threshold scale
// are surfaced in seconds. Scoring still runs on the raw ms numbers above.
const msToSec = (ms) => `${parseFloat(((Number(ms) || 0) / 1000).toFixed(2))}s`;

// LCP - Largest Contentful Paint
const evaluateLCPLab = (audits) => {
  const labValue = parseFloat((audits["largest-contentful-paint"]?.numericValue || 0).toFixed(0));
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
  const labValue = parseFloat((audits["cumulative-layout-shift"]?.numericValue || 0).toFixed(3));
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
  const labValue = parseFloat((audits['first-contentful-paint']?.numericValue || 0).toFixed(0));
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
  const labValue = parseFloat((audits["server-response-time"]?.numericValue || 0).toFixed(0));
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
const evaluateINPLab = (audits) => {
  const labValue = parseFloat((audits["interactive"]?.numericValue || 0).toFixed(0));
  const labScore = calculateScore(labValue, 3800, 7300);
  const labStatus = calculateStatus(labValue, 3800, 7300);

  const causes = [];
  const recommendations = [];

  if (labStatus !== "pass") {
    // Check Long Tasks
    const longTasks = audits["long-tasks"]?.details?.items || [];
    if (longTasks.length > 0) {
      causes.push(`${longTasks.length} Long Tasks detected on main thread`);
      recommendations.push("Defer heavy JS execution and break up long tasks.");
    }

    // Check Bootup Time
    const bootup = audits["bootup-time"]?.numericValue || 0;
    if (bootup > 2000) {
      causes.push("High JavaScript bootup time");
      recommendations.push("Reduce initial JS payload and code-split bundles.");
    }

    // Main thread work
    const mainThread = audits["mainthread-work-breakdown"]?.numericValue || 0;
    if (mainThread > 4000) {
      causes.push("Excessive main thread work");
      recommendations.push("Optimize third-party scripts and minimize main thread activity.");
    }

    if (causes.length === 0) {
      causes.push("Input delay due to background tasks");
      recommendations.push("Profile 'Interaction' cost in DevTools.");
    }
  }

  return {
    score: labScore,
    status: labStatus,
    details: labStatus === "pass" ? "Interaction responsiveness is good." : `Responsiveness is low (${msToSec(labValue)}).`,
    meta: {
      value: msToSec(labValue),
      thresholds: { Good: "0-3.8s", Warning: "3.8-7.3s", Poor: "7.3s+" }
    },
    analysis: labStatus === "pass" ? null : {
      cause: causes[0] || "Input delay due to background tasks",
      recommendation: recommendations[0] || "Profile 'Interaction' cost in DevTools."
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
  const labValue = parseFloat((audits["total-blocking-time"]?.numericValue || 0).toFixed(0));
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
  const labValue = parseFloat(((audits["speed-index"]?.numericValue || 0)).toFixed(0));
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
              "Enable Gzip or Brotli compression on your web server."
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
              "Set a long max-age (e.g. 1 year) for static assets."
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
      recommendation: recommendations[0] || "Compress and minify your site resources."
    }
  };
};

// Render Blocking Resources
const evaluateRenderBlocking = async (page) => {
  const blockingResources = await page.evaluate(() => {
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

  const blockingCount = blockingResources.length;
  const score = blockingCount === 0 ? 100 : Math.max(0, 100 - (blockingCount * 10));

  let status = "pass";
  if (score < 100) status = "warning";
  if (score < 50) status = "fail";

  const causes = [];
  const recommendations = [];

  if (status !== "pass") {
    causes.push(`${blockingCount} render-blocking resources found`);
    recommendations.push("Defer non-critical JavaScript and inline critical CSS.");

    if (blockingResources.some(u => u.url.endsWith(".css"))) {
      causes.push("Blocking CSS files delaying paint");
      recommendations.push("Load non-critical CSS asynchronously.");
    }
  }

  return {
    score: score,
    status,
    details: status === "pass" ? "No render-blocking resources." : `${blockingCount} render-blocking resources detected.`,
    meta: {
      value: score + "%",
      target: "0 Blocking Resources",
      blockingCount,
      blockingResources,
      thresholds: { Good: "100%", Warning: "50-99%", Poor: "<50%" }
    },
    analysis: status === "pass" ? null : {
      cause: causes[0] || "Blocking resources delaying paint",
      recommendation: recommendations[0] || "Review critical rendering path."
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
  const score = hops <= 1 ? 100 : 0;

  let status = "pass";
  if (hops > 1) status = "fail";

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

// MAIN FUNCTION
export default async function technicalMetrics(url, device, page, response, browser) {

  // Inventory & service page timings run in parallel with the (slow) PageSpeed
  // request — each uses its own browser tab, so the shared page other metrics use
  // in parallel is never touched.
  const [data, inventoryLoad, serviceLoad] = await Promise.all([
    googleAPI(url, device),
    evaluateInventoryLoad(url, device, page, browser),
    evaluateServiceLoad(url, device, page, browser),
  ]);
  const audits = data?.lighthouseResult?.audits || {};
  const cruxMetrics = data?.loadingExperience?.metrics || {};

  const lcpLab = evaluateLCPLab(audits);
  const lcpCrux = evaluateLCPCrux(audits, cruxMetrics);
  const clsLab = evaluateCLSLab(audits);
  const clsCrux = evaluateCLSCrux(audits, cruxMetrics);
  const fcpLab = evaluateFCPLab(audits);
  const fcpCrux = evaluateFCPCrux(audits, cruxMetrics);
  const ttfbLab = evaluateTTFBLab(audits);
  const ttfbCrux = evaluateTTFBCrux(cruxMetrics);
  const inpLab = evaluateINPLab(audits);
  const inpCrux = evaluateINPCrux(audits, cruxMetrics);
  const fidLab = evaluateFIDLab(audits);
  const fidCrux = evaluateFIDCrux(audits, cruxMetrics);
  const tbt = evaluateTBT(audits);
  const si = evaluateSI(audits);

  const compression = await evaluateCompression(page);
  const caching = await evaluateCaching(page);
  const resourceOptimization = await evaluateResourceOptimization(page);
  const renderBlocking = await evaluateRenderBlocking(page);
  const redirect = evaluateRedirectChains(response);

  const getScore = (metric) => metric?.score || 0;
  const scoreLCP = (getScore(lcpLab) * 0.07) + (getScore(lcpCrux) * 0.08); // 15%
  const scoreINP = (getScore(inpLab) * 0.07) + (getScore(inpCrux) * 0.08); // 15%
  const scoreCLS = (getScore(clsLab) * 0.07) + (getScore(clsCrux) * 0.08); // 15%
  const scoreFCP = (getScore(fcpLab) * 0.03) + (getScore(fcpCrux) * 0.03); // 6%
  const scoreTTFB = (getScore(ttfbLab) * 0.04) + (getScore(ttfbCrux) * 0.04); // 8%
  // FID scores from the best available source: real-user CrUX when Google still
  // reports it, otherwise the lab Max Potential FID (always present in Lighthouse).
  // Its 4% is shifted out of the two lab proxies (TBT, SI) so the total stays at
  // 100%, and if neither source is measurable nothing is penalized — the TBT/SI
  // weights simply revert to their original 8% split.
  const fidPrimary = fidCrux || fidLab;
  const hasFID = !!fidPrimary;
  const scoreFID = hasFID ? getScore(fidPrimary) * 0.04 : 0;       // 4% when available
  const scoreTBT = getScore(tbt) * (hasFID ? 0.06 : 0.08); // 8% (6% when FID present)
  const scoreSI = getScore(si) * (hasFID ? 0.06 : 0.08);   // 8% (6% when FID present)
  // Inventory & Service page load times each earn 5% when that page is found and
  // timed. Every present timed-metric is funded by shifting 1% out of each of the
  // five asset checks, so the Technical total always stays at exactly 100% whether
  // zero, one, or both timed pages are discovered.
  const hasInventory = !!inventoryLoad;
  const hasService = !!serviceLoad;
  const shift = ((hasInventory ? 1 : 0) + (hasService ? 1 : 0)) * 0.01; // per-asset-check reduction
  const scoreInventory = hasInventory ? getScore(inventoryLoad) * 0.05 : 0; // 5% when available
  const scoreService = hasService ? getScore(serviceLoad) * 0.05 : 0;       // 5% when available
  const scoreCompression = getScore(compression) * (0.05 - shift);         // 5% base
  const scoreCaching = getScore(caching) * (0.05 - shift);                 // 5% base
  const scoreResourceOpt = getScore(resourceOptimization) * (0.06 - shift); // 6% base
  const scoreRenderBlocking = getScore(renderBlocking) * (0.05 - shift);    // 5% base
  const scoreRedirect = getScore(redirect) * (0.04 - shift);               // 4% base

  const actualPercentage = parseFloat((
    scoreLCP + scoreINP + scoreCLS + scoreFCP + scoreTTFB +
    scoreFID + scoreTBT + scoreSI +
    scoreCompression + scoreCaching + scoreResourceOpt + scoreRenderBlocking +
    scoreRedirect + scoreInventory + scoreService
  ).toFixed(0));

  return {
    Percentage: actualPercentage,
    LCP: { lab: lcpLab, crux: lcpCrux },
    CLS: { lab: clsLab, crux: clsCrux },
    FCP: { lab: fcpLab, crux: fcpCrux },
    TTFB: { lab: ttfbLab, crux: ttfbCrux },
    INP: { lab: inpLab, crux: inpCrux },
    FID: (fidLab || fidCrux) ? { lab: fidLab, crux: fidCrux } : null,
    TBT: { lab: tbt, crux: null },
    SI: { lab: si, crux: null },
    Compression: compression,
    Caching: caching,
    Resource_Optimization: resourceOptimization,
    Render_Blocking: renderBlocking,
    Redirect_Chains: redirect,
    Inventory_Load_Time: inventoryLoad,
    Service_Load_Time: serviceLoad,
  };
}