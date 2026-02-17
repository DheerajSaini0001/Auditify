import googleAPI from "../utils/googleAPI.js";

function calculateScore(observed, good, poor) {
  if (observed <= good) return 100;
  if (observed >= poor) return 0;
  return parseFloat((((poor - observed) / (poor - good)) * 100).toFixed(0));
}

function calculateStatus(value, goodThreshold, needsImprovementThreshold) {
  if (value <= goodThreshold) return "good";
  if (value <= needsImprovementThreshold) return "needs_improvement";
  return "poor";
}

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

  if (labStatus !== "good") {

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

    if (causes.length === 0 && labStatus !== "good") {
      causes.push("General main-thread blocking or large resources");
      recommendations.push("Review network waterfall and reduce main-thread work.");
    }
  }

  return {
    value: labValue + "ms",
    score: labScore,
    status: labStatus,
    thresholds: {
      Good: "0-2500ms",
      Warning: "2500-4000ms",
      Poor: "4000ms+"
    },
    analysis: labStatus === "good" ? null : {
      lcpElement,
      causes,
      recommendations,
      insight: `LCP is delayed. Primary bottleneck appears to be: ${causes[0] || "unknown"}.`
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

  if (fieldStatus !== "good") {
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
    value: fieldValue + "ms",
    score: fieldScore,
    p75: true,
    status: fieldStatus,
    thresholds: {
      Good: "0-2500ms",
      Warning: "2500-4000ms",
      Poor: "4000ms+"
    },
    analysis: fieldStatus === "good" ? null : {
      causes,
      recommendations,
      insight: `LCP is delayed. Primary bottleneck appears to be: ${causes[0] || "unknown"}.`
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

  if (labStatus !== "good") {
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
    value: labValue,
    score: labScore,
    status: labStatus,
    thresholds: {
      Good: "0-0.1",
      Warning: "0.1-0.25",
      Poor: "0.25+"
    },
    analysis: labStatus === "good" ? null : {
      causes,
      recommendations,
      insight: `Visual stability is low. Shifts are caused by: ${causes[0] || "dynamic content"}.`
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

  if (fieldStatus !== "good") {
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
    value: fieldValue,
    score: fieldScore,
    p75: true,
    status: fieldStatus,
    thresholds: {
      Good: "0-0.1",
      Warning: "0.1-0.25",
      Poor: "0.25+"
    },
    analysis: fieldStatus === "good" ? null : {
      causes,
      recommendations,
      insight: `Real users see layout shifts. Primary cause: ${causes[0] || "dynamic elements"}.`
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

  if (labStatus !== "good") {
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
    value: labValue + "ms",
    score: labScore,
    status: labStatus,
    thresholds: {
      Good: "0-1800ms",
      Warning: "1800-3000ms",
      Poor: "3000ms+"
    },
    analysis: labStatus === "good" ? null : {
      causes,
      recommendations,
      insight: `First Paint is delayed. Main bottleneck: ${causes[0] || "unknown"}.`
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

  if (fieldStatus !== "good") {
    // Correlate with Lab data findings for FCP issues

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
    value: fieldValue + "ms",
    score: fieldScore,
    p75: true,
    status: fieldStatus,
    thresholds: {
      Good: "0-1800ms",
      Warning: "1800-3000ms",
      Poor: "3000ms+"
    },
    analysis: fieldStatus === "good" ? null : {
      causes,
      recommendations,
      insight: `Real users experience delayed rendering. Primary factor: ${causes[0] || "network conditions"}.`
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

  if (labStatus !== "good") {
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
    value: labValue + "ms",
    score: labScore,
    status: labStatus,
    thresholds: {
      Good: "0-800ms",
      Warning: "800-1800ms",
      Poor: "1800ms+"
    },
    analysis: labStatus === "good" ? null : {
      causes,
      recommendations,
      insight: `Server response is slow. Primary issue: ${causes[0] || "backend latency"}.`
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

  if (fieldStatus !== "good") {
    causes.push("Slow field TTFB (high server latency)");
    recommendations.push("Cache dynamic content and optimize database performance.");

    causes.push("Geographic distance from server");
    recommendations.push("Use a CDN to serve content from edge locations.");
  }

  return {
    value: fieldValue + "ms",
    score: fieldScore,
    p75: true,
    status: fieldStatus,
    thresholds: {
      Good: "0-800ms",
      Warning: "800-1800ms",
      Poor: "1800ms+"
    },
    analysis: fieldStatus === "good" ? null : {
      causes,
      recommendations,
      insight: `Real users face slow server response. Primary factor: ${causes[0] || "server latency"}.`
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

  if (labStatus !== "good") {
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
    value: labValue + "ms",
    score: labScore,
    status: labStatus,
    thresholds: {
      Good: "0-3800ms",
      Warning: "3800-7300ms",
      Poor: "7300ms+"
    },
    analysis: labStatus === "good" ? null : {
      causes,
      recommendations,
      insight: `Responsiveness is low. Delays caused by: ${causes[0] || "main thread blocking"}.`
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

  if (fieldStatus !== "good") {
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
    value: fieldValue + "ms",
    score: fieldScore,
    p75: true,
    status: fieldStatus,
    thresholds: {
      Good: "0-200ms",
      Warning: "200-500ms",
      Poor: "500ms+"
    },
    analysis: fieldStatus === "good" ? null : {
      causes,
      recommendations,
      insight: `Real users face input delays. Primary cause: ${causes[0] || "unknown"}.`
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

  if (labStatus !== "good") {
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
    value: labValue + "ms",
    score: labScore,
    status: labStatus,
    thresholds: {
      Good: "0-200ms",
      Warning: "200-600ms",
      Poor: "600ms+"
    },
    analysis: labStatus === "good" ? null : {
      sourceOfTruth: "lab",
      causes,
      recommendations,
      insight: `Main thread is blocked. Primary culprit: ${causes[0] || "JavaScript execution"}.`
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

  if (labStatus !== "good") {
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
    value: labValue + "ms",
    score: labScore,
    status: labStatus,
    thresholds: {
      Good: "0-3400ms",
      Warning: "3400-5800ms",
      Poor: "5800ms+"
    },
    analysis: labStatus === "good" ? null : {
      sourceOfTruth: "lab",
      causes,
      recommendations,
      insight: `Visual page load is slow. Main factor: ${causes[0] || "main thread blocking"}.`
    }
  };
};

// Compression
const evaluateCompression = async (page) => {
  const resources = await page.evaluate(async () => {
    const urls = Array.from(document.querySelectorAll('script[src], link[rel="stylesheet"][href]'))
      .map(el => el.src || el.href)
      .filter(url => url.startsWith('http'));

    const sample = urls.slice(0, 10);
    const results = await Promise.all(sample.map(async (url) => {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        const encoding = res.headers.get('content-encoding');
        const isCompressed = !!(encoding && (encoding.includes('gzip') || encoding.includes('br') || encoding.includes('deflate')));
        return { url, isCompressed, actualEncoding: encoding || 'None' };
      } catch {
        return { url, isCompressed: true, actualEncoding: 'Error' };
      }
    }));
    return results;
  });

  const total = resources.length;
  const compressedCount = resources.filter(r => r.isCompressed).length;
  const uncompressedResources = resources.filter(r => !r.isCompressed).map(r => ({
    url: r.url,
    currentEncoding: r.actualEncoding
  }));

  const score = total === 0 ? 100 : parseFloat(((compressedCount / total) * 100).toFixed(0));

  let status = "good";
  if (score < 100) status = "needs_improvement";
  if (score < 70) status = "poor";

  const causes = [];
  const recommendations = [];

  if (status !== "good") {
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
    value: score + "%",
    score: score,
    status,
    total: total,
    compressedCount: compressedCount,
    uncompressedResourcesCount: uncompressedResources.length,
    thresholds: {
      Good: "100%",
      Warning: "70-99%",
      Poor: "<70%"
    },
    analysis: status === "good" ? null : {
      target: "Use gzip or brotli compression",
      causes,
      recommendations,
      uncompressedResources,
      insight: `Bandwidth is wasted. Primary cause: ${causes[0] || "uncompressed assets"}.`
    }
  };
};

// Caching
const evaluateCaching = async (page) => {
  const resources = await page.evaluate(async () => {
    const urls = Array.from(document.querySelectorAll('img[src], script[src], link[rel="stylesheet"][href]'))
      .map(el => el.src || el.href)
      .filter(url => url.startsWith('http'));

    const sample = urls.slice(0, 10);
    const results = await Promise.all(sample.map(async (url) => {
      try {
        const res = await fetch(url, { method: 'HEAD' });
        const cacheControl = res.headers.get('cache-control');
        const policy = cacheControl || "None";
        if (!cacheControl) return { url, isCached: false, policy };

        const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
        if (!maxAgeMatch) return { url, isCached: false, policy };

        const isCached = parseInt(maxAgeMatch[1], 10) >= 604800; // 7 days
        return { url, isCached, policy };
      } catch {
        return { url, isCached: true, policy: "Error" };
      }
    }));
    return results;
  });

  const total = resources.length;
  const cachedCount = resources.filter(r => r.isCached).length;
  const uncachedResources = resources.filter(r => !r.isCached).map(r => ({
    url: r.url,
    cachePolicy: r.policy
  }));

  const score = total === 0 ? 100 : parseFloat(((cachedCount / total) * 100).toFixed(0));

  let status = "good";
  if (score < 90) status = "needs_improvement";
  if (score < 50) status = "poor";

  const causes = [];
  const recommendations = [];

  if (status !== "good") {
    causes.push(`${uncachedResources.length} resources with short or missing cache policy`);
    recommendations.push("Set a long `max-age` (e.g. 1 year) for static assets.");

    if (uncachedResources.some(u => u.url.match(/\.(jpg|png|webp|css|js)$/))) {
      causes.push("Static assets (images/JS/CSS) not effectively cached");
      recommendations.push("Ensure your CDN or server sends correct `Cache-Control` headers.");
    }
  }

  return {
    value: score + "%",
    score: score,
    status,
    total: total,
    cachedCount: cachedCount,
    uncachedResourcesCount: uncachedResources.length,
    thresholds: {
      Good: "≥90%",
      Warning: "50-89%",
      Poor: "<50%"
    },
    analysis: status === "good" ? null : {
      target: "≥ 7 days",
      causes,
      recommendations,
      uncachedResources,
      insight: `Repeat visits are slow. Caching issues found in: ${causes[0] || "static resources"}.`
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

  let status = "good";
  if (score < 90) status = "needs_improvement";
  if (score < 50) status = "poor";

  const causes = [];
  const recommendations = [];

  if (status !== "good") {
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
    value: score + "%",
    score: score,
    status,
    totalImages: result.totalImages,
    optimizedImagesCount: result.optimizedImagesCount,
    unoptimizedImagesCount: result.unoptimizedImagesList.length,
    totalScripts: result.totalScripts,
    minifiedScriptsCount: result.minifiedScriptsCount,
    unminifiedScriptsCount: result.unminifiedScriptsList.length,
    thresholds: {
      Good: "≥90%",
      Warning: "50-89%",
      Poor: "<50%"
    },
    analysis: status === "good" ? null : {
      target: "Optimized Assets",
      causes,
      recommendations,
      unoptimizedImages: result.unoptimizedImagesList,
      unminifiedScripts: result.unminifiedScriptsList,
      insight: `Resources are heavy. Optimization needed for: ${causes[0] || "assets"}.`
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

  let status = "good";
  if (score < 100) status = "needs_improvement";
  if (score < 50) status = "poor";

  const causes = [];
  const recommendations = [];

  if (status !== "good") {
    causes.push(`${blockingCount} render-blocking resources found`);
    recommendations.push("Defer non-critical JavaScript and inline critical CSS.");

    if (blockingResources.some(u => u.url.endsWith(".css"))) {
      causes.push("Blocking CSS files delaying paint");
      recommendations.push("Load non-critical CSS asynchronously.");
    }
  }

  return {
    value: score + "%",
    score: score,
    status,
    blockingCount,
    thresholds: {
      Good: "100%",
      Warning: "50-99%",
      Poor: "<50%"
    },
    analysis: status === "good" ? null : {
      target: "0 Blocking Resources",
      causes,
      recommendations,
      blockingResources,
      insight: `First Paint is delayed. Blocking resources: ${blockingCount}.`
    }
  };
};

// Redirect Chains
const evaluateRedirectChains = (response) => {
  const chain = response.request().redirectChain();
  const redirectDetails = chain.map(req => req.url()).concat(response.url());
  const hops = chain.length;
  const score = hops <= 1 ? 100 : 0;

  let status = "good";
  if (hops > 1) status = "poor";

  const causes = [];
  const recommendations = [];

  if (status !== "good") {
    causes.push(`${hops} redirect hops detected`);
    recommendations.push("Remove unnecessary redirects and point links directly to the final destination.");
  }


  return {
    value: score + "%",
    score: score,
    status,
    hops,
    redirectDetails,
    thresholds: {
      Good: "≤ 1 hop",
      Poor: "> 1 hop"
    },
    analysis: status === "good" ? null : {
      target: "≤ 1 hop",
      causes,
      recommendations,
      insight: `Latency increased by ${hops} redirects. Simplify the URL structure.`
    }
  };
};

// MAIN FUNCTION
export default async function technicalMetrics(url, device, page, response, browser) {

  const data = await googleAPI(url, device);
  const audits = data?.lighthouseResult?.audits || {};
  const cruxMetrics = data?.loadingExperience?.metrics || {};

  // Evaluate Metrics
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
  const tbt = evaluateTBT(audits);
  const si = evaluateSI(audits);

  const compression = await evaluateCompression(page);
  const caching = await evaluateCaching(page);
  const resourceOptimization = await evaluateResourceOptimization(page);
  const renderBlocking = await evaluateRenderBlocking(page);
  const redirect = evaluateRedirectChains(response);

  const getScore = (metric) => metric?.score || 0;

  // 1. Core Vitals & Lab Metrics
  const scoreLCP = (getScore(lcpLab) * 0.07) + (getScore(lcpCrux) * 0.08); // 15%
  const scoreINP = (getScore(inpLab) * 0.07) + (getScore(inpCrux) * 0.08); // 15%
  const scoreCLS = (getScore(clsLab) * 0.07) + (getScore(clsCrux) * 0.08); // 15%
  const scoreFCP = (getScore(fcpLab) * 0.03) + (getScore(fcpCrux) * 0.03); // 6%
  const scoreTTFB = (getScore(ttfbLab) * 0.04) + (getScore(ttfbCrux) * 0.04); // 8%

  // 2. Other Lab Metrics
  const scoreTBT = getScore(tbt) * 0.08; // 8%
  const scoreSI = getScore(si) * 0.08;   // 8%

  // 3. Assets & Performance
  const scoreCompression = getScore(compression) * 0.05; // 5%
  const scoreCaching = getScore(caching) * 0.05;         // 5%
  const scoreResourceOpt = getScore(resourceOptimization) * 0.06; // 6%
  const scoreRenderBlocking = getScore(renderBlocking) * 0.05;    // 5%
  const scoreRedirect = getScore(redirect) * 0.04;       // 4%

  // Calculate Overall Score
  const actualPercentage = parseFloat((
    scoreLCP + scoreINP + scoreCLS + scoreFCP + scoreTTFB +
    scoreTBT + scoreSI +
    scoreCompression + scoreCaching + scoreResourceOpt + scoreRenderBlocking +
    scoreRedirect
  ).toFixed(0));

  return {
    Percentage: actualPercentage,
    LCP: { lab: lcpLab, crux: lcpCrux },
    CLS: { lab: clsLab, crux: clsCrux },
    FCP: { lab: fcpLab, crux: fcpCrux },
    TTFB: { lab: ttfbLab, crux: ttfbCrux },
    INP: { lab: inpLab, crux: inpCrux },
    TBT: { lab: tbt, crux: null },
    SI: { lab: si, crux: null },
    Compression: compression,
    Caching: caching,
    Resource_Optimization: resourceOptimization,
    Render_Blocking: renderBlocking,
    Redirect_Chains: redirect,
  };
}