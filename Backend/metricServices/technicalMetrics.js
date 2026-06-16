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

// ───────────────── PageSpeed Score (official Lighthouse 0–100) ─────────────────
// The headline Performance-category score Google itself shows. It is an AGGREGATE of
// metrics already scored above (FCP, SI, LCP, TBT, CLS), so it is surfaced as an
// informational card only and is NOT folded into the weighted Technical % — doing so
// would double-count those vitals. Reported for both Mobile and Desktop strategies.
const evaluatePageSpeedScore = (mobileData, desktopData) => {
  const extract = (d) => {
    const s = d?.lighthouseResult?.categories?.performance?.score;
    return typeof s === "number" ? Math.round(s * 100) : null;
  };
  const mobileScore = extract(mobileData);
  const desktopScore = extract(desktopData);

  // Headline = mobile (mobile-first), falling back to desktop when mobile is absent.
  const primary = mobileScore != null ? mobileScore : desktopScore;
  if (primary == null) return notCalculated(
    "Google PageSpeed could not analyze this URL — Lighthouse returned no Performance score (the site may be too slow, blocking automated requests, or the PageSpeed API key/quota is unavailable).",
    "Confirm the site loads in Google PageSpeed Insights and that the PageSpeed API key/quota is configured, then re-run the audit."
  );

  // Lighthouse bands: ≥90 good, 50–89 needs improvement, <50 poor.
  const bandStatus = (s) => (s == null ? null : s >= 90 ? "pass" : s >= 50 ? "warning" : "fail");
  const status = bandStatus(primary);

  const parts = [];
  if (mobileScore != null) parts.push(`Mobile ${mobileScore}/100`);
  if (desktopScore != null) parts.push(`Desktop ${desktopScore}/100`);

  return {
    score: primary,
    status,
    details:
      status === "pass"
        ? `Official Lighthouse Performance score is strong (${parts.join(", ")}).`
        : `Official Lighthouse Performance score needs work (${parts.join(", ")}).`,
    meta: {
      value: primary + "/100",
      mobileScore: mobileScore != null ? mobileScore + "/100" : "Not measured",
      desktopScore: desktopScore != null ? desktopScore + "/100" : "Not measured",
      mobileStatus: bandStatus(mobileScore),
      desktopStatus: bandStatus(desktopScore),
      source: "Lighthouse categories.performance.score",
      informational: true, // shown, not folded into the weighted Technical %
      thresholds: { Good: "90-100", Warning: "50-89", Poor: "0-49" },
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
    analysis: status === "pass" ? null : { cause: causes[0], recommendation: recommendations[0] },
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
    analysis: status === "pass" ? null : { cause: causes[0], recommendation: recommendations[0] },
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
    analysis: status === "pass" ? null : { cause: causes[0], recommendation: recommendations[0] },
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
      analysis: status === "pass" ? null : { cause: causes[0], recommendation: recommendations[0] },
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
      analysis: status === "pass" ? null : { cause: causes[0], recommendation: recommendations[0] },
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
    causes.push(`JavaScript executes for ${fmtSeconds(bootupMs)} during load (target ≤ 2s)`);
    recommendations.push("Code-split and defer non-critical JS, remove unused JavaScript, and trim polyfills.");
    if (mainThreadMs > 4000) {
      causes.push(`Main thread is busy for ${fmtSeconds(mainThreadMs)} (parse/compile/execute)`);
      recommendations.push("Break up long tasks and move heavy work off the main thread (Web Workers).");
    }
  }

  return {
    score,
    status,
    details: status === "pass"
      ? `JavaScript execution is efficient (${fmtSeconds(bootupMs)}).`
      : `JavaScript executes for ${fmtSeconds(bootupMs)} during load.`,
    meta: {
      value: fmtSeconds(bootupMs),
      jsExecutionTime: fmtSeconds(bootupMs),
      mainThreadTime: fmtSeconds(mainThreadMs),
      topScripts,
      thresholds: { Good: "0-2s", Warning: "2-3.5s", Poor: "3.5s+" },
    },
    analysis: status === "pass" ? null : { cause: causes[0], recommendation: recommendations[0] },
  };
};

// MAIN FUNCTION
export default async function technicalMetrics(url, device, page, response, browser) {

  // The audited device drives every lab/field metric below; the OTHER device is
  // requested too, purely to surface the official Lighthouse Performance score for
  // both Mobile and Desktop. Inventory/service/mobile-experience timings each run in
  // their own browser tab and all of this runs in parallel with the (slow) PageSpeed
  // requests, so the shared page other metrics use in parallel is never touched.
  const wantDevice = String(device || "mobile").toLowerCase() === "desktop" ? "desktop" : "mobile";
  const otherDevice = wantDevice === "desktop" ? "mobile" : "desktop";

  const [primaryData, otherData, inventoryLoad, serviceLoad, mobileExp] = await Promise.all([
    googleAPI(url, wantDevice),
    googleAPI(url, otherDevice),
    evaluateInventoryLoad(url, device, page, browser),
    evaluateServiceLoad(url, device, page, browser),
    measureMobileExperience({ url, page, browser }),
  ]);
  const data = primaryData;
  const audits = data?.lighthouseResult?.audits || {};
  const cruxMetrics = data?.loadingExperience?.metrics || {};

  const mobileData = wantDevice === "mobile" ? primaryData : otherData;
  const desktopData = wantDevice === "desktop" ? primaryData : otherData;
  const pageSpeedScore = evaluatePageSpeedScore(mobileData, desktopData);
  const mobileLoadSpeed = mobileExp.mobileLoadSpeed;
  const mobileUsability = mobileExp.mobileUsability;
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
  const renderingPerformance = evaluateRenderingPerformance(audits);
  const lazyLoading = await evaluateLazyLoading(audits, page);
  const thirdPartyOptimization = await evaluateThirdPartyOptimization(audits, page);
  const jsExecution = evaluateJsExecution(audits);
  const getScore = (metric) => metric?.score || 0;
  // A metric counts toward the weighted total only if it was actually measured —
  // `notCalculated()` results are flagged `meta.notScored` so a failed measurement is
  // shown (with its reason) but never penalizes the score as a real 0.
  const scored = (metric) => !!metric && !metric?.meta?.notScored;
  // FID uses the best available source: real-user CrUX when Google still reports it,
  // otherwise the lab Max Potential FID (always present in Lighthouse).
  const fidPrimary = fidCrux || fidLab;
  const hasFID = !!fidPrimary;
  // Weighted average over the metrics that could actually be measured. Each entry
  // contributes its `weight` only when `present`, and the total is normalized by the
  // sum of present weights — so the Technical % is always on a 0-100 scale no matter
  // which optional signals (CrUX field data, FID, the timed/mobile pages) exist.
  // Weights preserve the original relative importance; the three mobile/rendering
  // metrics are folded in at 5 each. PageSpeed Score is intentionally excluded — it
  // is itself an aggregate of the vitals below and would double-count them.
  const components = [
    { score: getScore(lcpLab),    weight: 7, present: true },
    { score: getScore(lcpCrux),   weight: 8, present: !!lcpCrux },
    { score: getScore(inpLab),    weight: 7, present: true },
    { score: getScore(inpCrux),   weight: 8, present: !!inpCrux },
    { score: getScore(clsLab),    weight: 7, present: true },
    { score: getScore(clsCrux),   weight: 8, present: !!clsCrux },
    { score: getScore(fcpLab),    weight: 3, present: true },
    { score: getScore(fcpCrux),   weight: 3, present: !!fcpCrux },
    { score: getScore(ttfbLab),   weight: 4, present: true },
    { score: getScore(ttfbCrux),  weight: 4, present: !!ttfbCrux },
    { score: getScore(fidPrimary), weight: 4, present: hasFID },
    { score: getScore(tbt),       weight: 6, present: true },
    { score: getScore(si),        weight: 6, present: true },
    { score: getScore(compression),          weight: 5, present: true },
    { score: getScore(caching),              weight: 5, present: true },
    { score: getScore(resourceOptimization), weight: 6, present: true },
    { score: getScore(renderBlocking),       weight: 5, present: true },
    { score: getScore(redirect),             weight: 4, present: true },
    { score: getScore(inventoryLoad),        weight: 5, present: scored(inventoryLoad) },
    { score: getScore(serviceLoad),          weight: 5, present: scored(serviceLoad) },
    { score: getScore(mobileUsability),      weight: 5, present: scored(mobileUsability) },
    { score: getScore(renderingPerformance), weight: 5, present: scored(renderingPerformance) },
    { score: getScore(mobileLoadSpeed),      weight: 5, present: scored(mobileLoadSpeed) },
    { score: getScore(lazyLoading),          weight: 5, present: scored(lazyLoading) },
    { score: getScore(thirdPartyOptimization), weight: 5, present: scored(thirdPartyOptimization) },
    { score: getScore(jsExecution),          weight: 5, present: scored(jsExecution) },
  ];
  const presentComponents = components.filter((c) => c.present);
  const totalWeight = presentComponents.reduce((s, c) => s + c.weight, 0);
  const actualPercentage = totalWeight === 0 ? 0 : parseFloat(
    (presentComponents.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight).toFixed(0)
  );
  return {
    Percentage: actualPercentage,
    PageSpeed_Score: pageSpeedScore,
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
    Rendering_Performance: renderingPerformance,
    Lazy_Loading: lazyLoading,
    Third_Party_Optimization: thirdPartyOptimization,
    JS_Execution: jsExecution,
    Redirect_Chains: redirect,
    Mobile_Usability: mobileUsability,
    Mobile_Load_Speed: mobileLoadSpeed,
    Inventory_Load_Time: inventoryLoad,
    Service_Load_Time: serviceLoad,
  };
}