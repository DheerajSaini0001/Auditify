import googleAPI from "../utils/googleAPI.js";

function calculateScore(observed, good, poor) {
  if (observed <= good) return 100;
  if (observed >= poor) return 0;
  return parseFloat((((poor - observed) / (poor - good)) * 100).toFixed(0));
}

// METRIC EVALUATION FUNCTIONS
const evaluateLCP = (data) => {
  // Lab data (Lighthouse)
  const labValue = parseFloat((data?.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue || 0).toFixed(0));
  const labScore = calculateScore(labValue, 2500, 4000);
  const labStatus = labValue <= 2500 ? "good" : labValue <= 4000 ? "needs_improvement" : "poor";

  // Field data (CrUX P75)
  const cruxMetrics = data?.loadingExperience?.metrics || {};
  const fieldValue = cruxMetrics["LARGEST_CONTENTFUL_PAINT_MS"]?.percentile || null;

  let fieldStatus = null;
  if (fieldValue !== null) {
    if (fieldValue <= 2500) fieldStatus = "good";
    else if (fieldValue <= 4000) fieldStatus = "needs_improvement";
    else fieldStatus = "poor";
  }

  // Determine AI Insight based on both lab and field
  let aiInsight = "";
  const sourceOfTruth = fieldValue !== null ? "field" : "lab";

  if (fieldValue !== null) {
    if (labStatus === "good" && fieldStatus !== "good") {
      aiInsight = "Lab data looks good, but real users experience slower LCP performance.";
    } else if (labStatus === "good" && fieldStatus === "good") {
      aiInsight = "LCP is within the recommended range and performing well for real users.";
    } else if (labStatus !== "good" && fieldStatus !== "good") {
      aiInsight = "LCP is slow for real users and requires immediate optimization.";
    } else {
      aiInsight = "LCP performance varies between lab and field conditions.";
    }
  } else {
    aiInsight = labStatus === "good"
      ? "LCP is within the recommended range and performing well."
      : "LCP is higher than recommended. Optimizing hero elements and reducing render-blocking resources can improve this.";
  }

  return {
    lab: {
      value: labValue,
      unit: "ms",
      score: labScore,
      status: labStatus
    },
    field: fieldValue !== null ? {
      value: fieldValue,
      unit: "ms",
      p75: true,
      status: fieldStatus
    } : null,
    thresholds: {
      good: 2500,
      needsImprovement: 4000
    },
    analysis: {
      sourceOfTruth,
      causes: [
        "Slow server response times",
        "Render-blocking JavaScript and CSS",
        "Slow resource load times"
      ],
      recommendations: [
        "Optimize hero images",
        "Defer non-critical CSS/JS",
        "Use a CDN"
      ],
      aiInsight
    }
  };
};

const evaluateFID = (data) => {
  // Lab data (Lighthouse - using max-potential-fid as proxy)
  const labValue = parseFloat((data?.lighthouseResult?.audits?.['max-potential-fid']?.numericValue || 0).toFixed(0));
  const labScore = calculateScore(labValue, 100, 300);
  const labStatus = labValue <= 100 ? "good" : labValue <= 300 ? "needs_improvement" : "poor";

  // Field data (CrUX P75) - FID is deprecated, but keeping for legacy support
  const cruxMetrics = data?.loadingExperience?.metrics || {};
  const fieldValue = cruxMetrics["FIRST_INPUT_DELAY_MS"]?.percentile || null;

  let fieldStatus = null;
  if (fieldValue !== null) {
    if (fieldValue <= 100) fieldStatus = "good";
    else if (fieldValue <= 300) fieldStatus = "needs_improvement";
    else fieldStatus = "poor";
  }

  // Determine AI Insight
  let aiInsight = "";
  const sourceOfTruth = fieldValue !== null ? "field" : "lab";

  if (fieldValue !== null) {
    if (labStatus === "good" && fieldStatus !== "good") {
      aiInsight = "Lab data looks good, but real users experience slower FID performance.";
    } else if (labStatus === "good" && fieldStatus === "good") {
      aiInsight = "FID is within the recommended range and performing well for real users.";
    } else if (labStatus !== "good" && fieldStatus !== "good") {
      aiInsight = "FID is slow for real users and requires immediate optimization.";
    } else {
      aiInsight = "FID performance varies between lab and field conditions.";
    }
  } else {
    aiInsight = labStatus === "good"
      ? "FID is within the recommended range and does not require immediate optimization."
      : "FID is higher than recommended due to main-thread blocking JavaScript execution.";
  }

  return {
    lab: {
      value: labValue,
      unit: "ms",
      score: labScore,
      status: labStatus
    },
    field: fieldValue !== null ? {
      value: fieldValue,
      unit: "ms",
      p75: true,
      status: fieldStatus
    } : null,
    thresholds: {
      good: 100,
      needsImprovement: 300
    },
    analysis: {
      sourceOfTruth,
      causes: [
        "Long JavaScript execution blocking main thread",
        "Heavy third-party scripts"
      ],
      recommendations: [
        "Break long JavaScript tasks into smaller chunks",
        "Defer non-critical JavaScript",
        "Remove unused third-party scripts"
      ],
      aiInsight
    }
  };
};

const evaluateCLS = (data) => {
  // Lab data (Lighthouse)
  const labValue = parseFloat((data?.lighthouseResult?.audits?.["cumulative-layout-shift"]?.numericValue || 0).toFixed(3));
  const labScore = calculateScore(labValue, 0.1, 0.25);
  const labStatus = labValue <= 0.1 ? "good" : labValue <= 0.25 ? "needs_improvement" : "poor";

  // Field data (CrUX P75) - CLS is reported in hundredths, convert to decimal
  const cruxMetrics = data?.loadingExperience?.metrics || {};
  const fieldValueRaw = cruxMetrics["CUMULATIVE_LAYOUT_SHIFT_SCORE"]?.percentile || null;
  const fieldValue = fieldValueRaw !== null ? parseFloat((fieldValueRaw / 100).toFixed(3)) : null;

  let fieldStatus = null;
  if (fieldValue !== null) {
    if (fieldValue <= 0.1) fieldStatus = "good";
    else if (fieldValue <= 0.25) fieldStatus = "needs_improvement";
    else fieldStatus = "poor";
  }

  // Determine AI Insight
  let aiInsight = "";
  const sourceOfTruth = fieldValue !== null ? "field" : "lab";

  if (fieldValue !== null) {
    if (labStatus === "good" && fieldStatus !== "good") {
      aiInsight = "Lab data looks good, but real users experience more layout shifts.";
    } else if (labStatus === "good" && fieldStatus === "good") {
      aiInsight = "CLS is excellent for real users. The page maintains visual stability.";
    } else if (labStatus !== "good" && fieldStatus !== "good") {
      aiInsight = "CLS is poor for real users and requires immediate optimization.";
    } else {
      aiInsight = "CLS performance varies between lab and field conditions.";
    }
  } else {
    aiInsight = labStatus === "good"
      ? "CLS is excellent. The page maintains visual stability during loading."
      : "CLS indicates visual instability. Configuring size attributes and reserving space for dynamic content will help.";
  }

  return {
    lab: {
      value: labValue,
      unit: "",
      score: labScore,
      status: labStatus
    },
    field: fieldValue !== null ? {
      value: fieldValue,
      unit: "",
      p75: true,
      status: fieldStatus
    } : null,
    thresholds: {
      good: 0.1,
      needsImprovement: 0.25
    },
    analysis: {
      sourceOfTruth,
      causes: [
        "Images without dimensions",
        "Ads, embeds, and iframes without dimensions",
        "Dynamically injected content"
      ],
      recommendations: [
        "Set size attributes for images, videos, and ads",
        "Reserve space for ads to prevent layout shifts",
        "Avoid inserting new content above existing content"
      ],
      aiInsight
    }
  };
};

const evaluateFCP = (data) => {
  // Lab data (Lighthouse)
  const labValue = parseFloat((data?.lighthouseResult?.audits['first-contentful-paint']?.numericValue || 0).toFixed(0));
  const labScore = calculateScore(labValue, 1800, 3000);
  const labStatus = labValue <= 1800 ? "good" : labValue <= 3000 ? "needs_improvement" : "poor";

  // Field data (CrUX P75)
  const cruxMetrics = data?.loadingExperience?.metrics || {};
  const fieldValue = cruxMetrics["FIRST_CONTENTFUL_PAINT_MS"]?.percentile || null;

  let fieldStatus = null;
  if (fieldValue !== null) {
    if (fieldValue <= 1800) fieldStatus = "good";
    else if (fieldValue <= 3000) fieldStatus = "needs_improvement";
    else fieldStatus = "poor";
  }

  // Determine AI Insight
  let aiInsight = "";
  const sourceOfTruth = fieldValue !== null ? "field" : "lab";

  if (fieldValue !== null) {
    if (labStatus === "good" && fieldStatus !== "good") {
      aiInsight = "Lab data looks good, but real users see content slower.";
    } else if (labStatus === "good" && fieldStatus === "good") {
      aiInsight = "FCP is excellent for real users. Content appears quickly.";
    } else if (labStatus !== "good" && fieldStatus !== "good") {
      aiInsight = "FCP is slow for real users and requires immediate optimization.";
    } else {
      aiInsight = "FCP performance varies between lab and field conditions.";
    }
  } else {
    aiInsight = labStatus === "good"
      ? "FCP is within the recommended range. Users see content quickly."
      : "FCP is affected by render-blocking resources. Prioritizing above-the-fold content can improve this metric.";
  }

  return {
    lab: {
      value: labValue,
      unit: "ms",
      score: labScore,
      status: labStatus
    },
    field: fieldValue !== null ? {
      value: fieldValue,
      unit: "ms",
      p75: true,
      status: fieldStatus
    } : null,
    thresholds: {
      good: 1800,
      needsImprovement: 3000
    },
    analysis: {
      sourceOfTruth,
      causes: [
        "Render-blocking resources",
        "Slow font loading",
        "Network latency"
      ],
      recommendations: [
        "Eliminate render-blocking resources",
        "Ensure text remains visible during webfont load",
        "Reduce hydration time"
      ],
      aiInsight
    }
  };
};

const evaluateTTFB = (data) => {
  // Lab data (Lighthouse)
  const labValue = parseFloat((data?.lighthouseResult?.audits?.["server-response-time"]?.numericValue || 0).toFixed(0));
  const labScore = calculateScore(labValue, 800, 1800);
  const labStatus = labValue <= 800 ? "good" : labValue <= 1800 ? "needs_improvement" : "poor";

  // Field data (CrUX P75)
  const cruxMetrics = data?.loadingExperience?.metrics || {};
  const fieldValue = cruxMetrics["EXPERIMENTAL_TIME_TO_FIRST_BYTE"]?.percentile || null;

  let fieldStatus = null;
  if (fieldValue !== null) {
    if (fieldValue <= 800) fieldStatus = "good";
    else if (fieldValue <= 1800) fieldStatus = "needs_improvement";
    else fieldStatus = "poor";
  }

  // Determine AI Insight
  let aiInsight = "";
  const sourceOfTruth = fieldValue !== null ? "field" : "lab";

  if (fieldValue !== null) {
    if (labStatus === "good" && fieldStatus !== "good") {
      aiInsight = "Lab data looks good, but real users experience slower server response.";
    } else if (labStatus === "good" && fieldStatus === "good") {
      aiInsight = "TTFB is excellent for real users. Server responds quickly.";
    } else if (labStatus !== "good" && fieldStatus !== "good") {
      aiInsight = "TTFB is slow for real users and requires immediate optimization.";
    } else {
      aiInsight = "TTFB performance varies between lab and field conditions.";
    }
  } else {
    aiInsight = labStatus === "good"
      ? "TTFB is excellent. Server is responding quickly to requests."
      : "TTFB indicates slow server response times. Caching and CDN usage are key strategies to improve this.";
  }

  return {
    lab: {
      value: labValue,
      unit: "ms",
      score: labScore,
      status: labStatus
    },
    field: fieldValue !== null ? {
      value: fieldValue,
      unit: "ms",
      p75: true,
      status: fieldStatus
    } : null,
    thresholds: {
      good: 800,
      needsImprovement: 1800
    },
    analysis: {
      sourceOfTruth,
      causes: [
        "Slow server response",
        "Database queries",
        "Resource intensive API calls"
      ],
      recommendations: [
        "Use a CDN",
        "Optimize server performance and database queries",
        "Enable caching to reduce server response time"
      ],
      aiInsight
    }
  };
};

const evaluateTBT = (data) => {
  // Lab data (Lighthouse)
  const labValue = parseFloat((data?.lighthouseResult?.audits?.["total-blocking-time"]?.numericValue || 0).toFixed(0));
  const labScore = calculateScore(labValue, 200, 600);
  const labStatus = labValue <= 200 ? "good" : labValue <= 600 ? "needs_improvement" : "poor";

  // TBT doesn't have CrUX field data (lab-only metric)
  const aiInsight = labStatus === "good"
    ? "TBT is within acceptable limits. The main thread is not significantly blocked."
    : "TBT is high, indicating the main thread is blocked. Breaking up long tasks will improve responsiveness.";

  return {
    lab: {
      value: labValue,
      unit: "ms",
      score: labScore,
      status: labStatus
    },
    field: null,
    thresholds: {
      good: 200,
      needsImprovement: 600
    },
    analysis: {
      sourceOfTruth: "lab",
      causes: [
        "Heavy JavaScript execution",
        "Long tasks blocking the main thread",
        "Unnecessary script loading"
      ],
      recommendations: [
        "Split heavy JS tasks",
        "Defer non-essential scripts",
        "Implement code splitting"
      ],
      aiInsight
    }
  };
};

const evaluateSI = (data) => {
  // Lab data (Lighthouse)
  const labValue = parseFloat(((data?.lighthouseResult?.audits?.["speed-index"]?.numericValue || 0)).toFixed(0));
  const labScore = calculateScore(labValue, 3400, 5800);
  const labStatus = labValue <= 3400 ? "good" : labValue <= 5800 ? "needs_improvement" : "poor";

  // SI doesn't have CrUX field data (lab-only metric)
  const aiInsight = labStatus === "good"
    ? "Speed Index is excellent. Content appears quickly for users."
    : "Speed Index reflects how quickly content is visually populated. Reducing JS execution time helps improve this.";

  return {
    lab: {
      value: labValue,
      unit: "ms",
      score: labScore,
      status: labStatus
    },
    field: null,
    thresholds: {
      good: 3400,
      needsImprovement: 5800
    },
    analysis: {
      sourceOfTruth: "lab",
      causes: [
        "Slow visible content population",
        "JavaScript execution delaying rendering",
        "Main thread blocking"
      ],
      recommendations: [
        "Minimize main thread work",
        "Reduce JavaScript execution time",
        "Ensure text remains visible during font load"
      ],
      aiInsight
    }
  };
};

const evaluateINP = (data) => {
  // Lab data (Lighthouse - using TTI as proxy for INP)
  const labValue = parseFloat((data?.lighthouseResult?.audits?.["interactive"]?.numericValue || 0).toFixed(0));
  const labScore = calculateScore(labValue, 3800, 7300);
  const labStatus = labValue <= 3800 ? "good" : labValue <= 7300 ? "needs_improvement" : "poor";

  // Field data (CrUX P75) - actual INP values
  const cruxMetrics = data?.loadingExperience?.metrics || {};
  const fieldValue = cruxMetrics["INTERACTION_TO_NEXT_PAINT"]?.percentile || null;

  let fieldStatus = null;
  if (fieldValue !== null) {
    if (fieldValue <= 200) fieldStatus = "good";
    else if (fieldValue <= 500) fieldStatus = "needs_improvement";
    else fieldStatus = "poor";
  }

  // Determine AI Insight
  let aiInsight = "";
  const sourceOfTruth = fieldValue !== null ? "field" : "lab";

  if (fieldValue !== null) {
    if (labStatus === "good" && fieldStatus !== "good") {
      aiInsight = "Lab data looks good, but real users experience slower interactions.";
    } else if (labStatus === "good" && fieldStatus === "good") {
      aiInsight = "INP is excellent for real users. The page responds quickly to interactions.";
    } else if (labStatus !== "good" && fieldStatus !== "good") {
      aiInsight = "INP is slow for real users and requires immediate optimization.";
    } else {
      aiInsight = "INP performance varies between lab and field conditions.";
    }
  } else {
    aiInsight = labStatus === "good"
      ? "INP is performing well. The page responds quickly to user interactions."
      : "INP values are improved by reducing input latency. Optimizing event handlers is recommended.";
  }

  return {
    lab: {
      value: labValue,
      unit: "ms",
      score: labScore,
      status: labStatus
    },
    field: fieldValue !== null ? {
      value: fieldValue,
      unit: "ms",
      p75: true,
      status: fieldStatus
    } : null,
    thresholds: {
      good: fieldValue !== null ? 200 : 3800,
      needsImprovement: fieldValue !== null ? 500 : 7300
    },
    analysis: {
      sourceOfTruth,
      causes: [
        "Long event handlers",
        "Complex layout or style recalculations",
        "Input delay"
      ],
      recommendations: [
        "Reduce main-thread work",
        "Optimize JS execution",
        "Break up long tasks"
      ],
      aiInsight
    }
  };
};

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
        return { url, isCompressed };
      } catch {
        return { url, isCompressed: true };
      }
    }));
    return results;
  });

  const total = resources.length;
  const compressedCount = resources.filter(r => r.isCompressed).length;
  const uncompressedResources = resources.filter(r => !r.isCompressed).map(r => r.url);

  const score = total === 0 ? 100 : parseFloat(((compressedCount / total) * 100).toFixed(0));
  const status = score === 100 ? "pass" : "warning";

  return {
    score,
    status,
    details: `${compressedCount}/${total} text resources compressed`,
    suggestion: "Enable Gzip or Brotli compression for all text-based resources.",
    meta: {
      value: score,
      target: "100%",
      thresholds: { good: "100%", poor: "0%" },
      unit: "%",
      uncompressedResources
    }
  };
};

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
        if (!cacheControl) return { url, isCached: false };
        const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
        if (!maxAgeMatch) return { url, isCached: false };
        const isCached = parseInt(maxAgeMatch[1], 10) >= 604800; // 7 days
        return { url, isCached };
      } catch {
        return { url, isCached: true };
      }
    }));
    return results;
  });

  const total = resources.length;
  const cachedCount = resources.filter(r => r.isCached).length;
  const uncachedResources = resources.filter(r => !r.isCached).map(r => r.url);

  const score = total === 0 ? 100 : parseFloat(((cachedCount / total) * 100).toFixed(0));
  const status = score >= 90 ? "pass" : "warning";

  return {
    score,
    status,
    details: `${cachedCount}/${total} static resources cached > 7 days`,
    suggestion: "Configure long cache TTL (max-age) for static assets.",
    meta: {
      value: score,
      target: "≥ 7 days",
      thresholds: { good: 100, poor: 50 },
      unit: "%",
      uncachedResources
    }
  };
};

const evaluateResourceOptimization = async (page) => {
  const result = await page.evaluate(() => {
    const images = Array.from(document.querySelectorAll('img'));
    const totalImages = images.length;

    const unoptimizedImagesList = images.filter(img => {
      if (img.naturalWidth === 0) return false;
      return !(img.naturalWidth <= (img.clientWidth * 2) && img.naturalHeight <= (img.clientHeight * 2));
    }).map(img => img.src);

    const optimizedImagesCount = totalImages - unoptimizedImagesList.length;

    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const totalScripts = scripts.length;

    const unminifiedScriptsList = scripts.filter(s => {
      return !(s.src.includes('.min') || s.src.includes('cdn'));
    }).map(s => s.src);

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
  const status = score >= 80 ? "pass" : "warning";

  return {
    score,
    status,
    details: "Image sizing and script minification check",
    suggestion: "Resize images to display dimensions and minify JavaScript files.",
    meta: {
      value: score,
      target: "Optimized",
      thresholds: { good: "80%", poor: "50%" },
      imagesOptimized: `${result.optimizedImagesCount}/${result.totalImages}`,
      scriptsMinified: `${result.minifiedScriptsCount}/${result.totalScripts}`,
      unoptimizedImages: result.unoptimizedImagesList,
      unminifiedScripts: result.unminifiedScriptsList
    }
  };
};

const evaluateRenderBlocking = async (page) => {
  const blockingResources = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('head link[rel="stylesheet"]'));
    const scripts = Array.from(document.querySelectorAll('head script[src]'));

    const blockingLinks = links.filter(link => {
      const media = link.media;
      return !media || media === 'all' || media === 'screen';
    }).map(link => link.href);

    const blockingScripts = scripts.filter(script => {
      return !script.hasAttribute('async') && !script.hasAttribute('defer');
    }).map(script => script.src);

    return [...blockingLinks, ...blockingScripts];
  });

  const blockingCount = blockingResources.length;
  const score = blockingCount === 0 ? 100 : Math.max(0, 100 - (blockingCount * 10));
  const status = score === 100 ? "pass" : "warning";

  return {
    score,
    status,
    details: `${blockingCount} render-blocking resources found`,
    suggestion: "Defer non-critical JS and use media attributes for CSS.",
    meta: {
      value: blockingCount,
      target: "0 items",
      thresholds: { good: "0 items", poor: "5 items" },
      unit: "items",
      blockingResources
    }
  };
};

const evaluateHTTPS = (response) => {
  const security = response.securityDetails();
  const isSecure = !!security;
  const protocol = security ? security.protocol() : 'http';

  const score = isSecure ? 100 : 0;
  const status = isSecure ? "pass" : "fail";

  return {
    score,
    status,
    details: isSecure ? `Secure (${protocol})` : "Insecure",
    suggestion: "Migrate to HTTPS and enable HTTP/2.",
    meta: {
      value: score,
      target: "Enabled",
      thresholds: { good: "100%", poor: "0%" },
      protocol: protocol
    }
  };
};

const evaluateRedirectChains = (response) => {
  const chain = response.request().redirectChain();
  const hops = chain.length;
  const score = hops <= 1 ? 100 : 0;
  const status = score === 100 ? "pass" : "warning";

  return {
    score,
    status,
    details: `${hops} redirect hops`,
    suggestion: "Reduce redirect chains to speed up page load and improve crawlability.",
    meta: {
      value: hops,
      unit: "hops",
      target: "≤ 1 hop",
      thresholds: { good: "1 hop", poor: "3 hops" }
    }
  };
};

const evaluateStructuredData = async (page) => {
  const result = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      .map(el => {
        try { return JSON.parse(el.innerText); } catch { return null; }
      })
      .filter(Boolean);

    const types = scripts.map(s => s['@type']).filter(Boolean);
    return { hasData: scripts.length > 0, types: types.join(', ') };
  });

  const score = result.hasData ? 100 : 0;
  const status = result.hasData ? "pass" : "pass";

  return {
    score,
    status,
    details: result.hasData ? "Structured data found" : "Structured data missing",
    suggestion: "Add structured data to improve search results display.",
    meta: {
      hasStructuredData: result.hasData,
      target: "Present",
      thresholds: { good: "Present", poor: "None" },
      typesFound: result.types || "None"
    }
  };
};

const evaluateBrokenLinks = async (page) => {
  const links = await page.$$eval("a[href]", (anchors) =>
    anchors
      .map((a) => a.href)
      .filter((l) => l && l.startsWith("http"))
  );

  let brokenCount = 0;
  const brokenLinksList = [];

  await Promise.all(
    links.map(async (link) => {
      try {
        const status = await page.evaluate(async (l) => {
          try {
            const res = await fetch(l, { method: "HEAD" });
            return res.status;
          } catch {
            return 0;
          }
        }, link);

        if (status === 0 || status >= 400) {
          brokenCount++;
          brokenLinksList.push({ url: link, status });
        }
      } catch {
        brokenCount++;
        brokenLinksList.push({ url: link, status: 'Error' });
      }
    })
  );

  const totalLinks = links.length || 1;
  const brokenPercent = parseFloat(((brokenCount / totalLinks) * 100).toFixed(0));
  const score = brokenPercent === 0 ? 100 : 0;
  const status = score === 100 ? "pass" : "fail";

  return {
    score,
    status,
    details: `${brokenPercent}% broken links`,
    suggestion: "Fix all broken links to improve user experience and SEO.",
    meta: {
      brokenCount,
      totalLinks,
      brokenPercent,
      target: "0 broken",
      thresholds: { good: "0 broken", poor: "1 broken" },
      brokenLinksList
    }
  };
};

const evaluateSitemap = async (url, browser) => {
  let exists = false;
  try {
    const sitemapUrl = new URL("/sitemap.xml", url).href;
    const sitemapPage = await browser.newPage();
    const response = await sitemapPage.goto(sitemapUrl, { waitUntil: "networkidle2", timeout: 60000 });
    exists = response.status() === 200;
    sitemapPage.close();
  } catch {
    exists = false;
  }

  const score = exists ? 100 : 0;
  const status = exists ? "pass" : "warning";

  return {
    score,
    status,
    details: exists ? "Sitemap found" : "Sitemap missing",
    suggestion: "Add sitemap.xml and submit it to search engines for better indexing.",
    meta: { exists, target: "Present", thresholds: { good: "Present", poor: "Missing" } }
  };
};

const evaluateRobots = async (url, browser) => {
  let exists = false;
  try {
    const robotsUrl = new URL("/robots.txt", url).href;
    const robotsPage = await browser.newPage();
    const response = await robotsPage.goto(robotsUrl, { waitUntil: "networkidle2", timeout: 60000 });
    exists = response.status() === 200;
    robotsPage.close();
  } catch {
    exists = false;
  }

  const score = exists ? 100 : 0;
  const status = exists ? "pass" : "warning";

  return {
    score,
    status,
    details: exists ? "Robots.txt found" : "Robots.txt missing",
    suggestion: "Ensure robots.txt exists and allows proper crawling.",
    meta: { exists, target: "Present", thresholds: { good: "Present", poor: "Missing" } }
  };
};

// MAIN FUNCTION
export default async function technicalMetrics(url, device, page, response, browser) {

  const data = await googleAPI(url, device);

  // Evaluate Metrics
  const lcp = evaluateLCP(data);
  const fid = evaluateFID(data);
  const cls = evaluateCLS(data);
  const fcp = evaluateFCP(data);
  const ttfb = evaluateTTFB(data);
  const tbt = evaluateTBT(data);
  const si = evaluateSI(data);
  const inp = evaluateINP(data);

  const compression = await evaluateCompression(page);
  const caching = await evaluateCaching(page);
  const resourceOptimization = await evaluateResourceOptimization(page);
  const renderBlocking = await evaluateRenderBlocking(page);
  const https = evaluateHTTPS(response);

  const redirect = evaluateRedirectChains(response);
  const structuredData = await evaluateStructuredData(page);
  const brokenLinks = await evaluateBrokenLinks(page);
  const sitemap = await evaluateSitemap(url, browser);
  const robots = await evaluateRobots(url, browser);



  // Calculate Overall Score (Weighted) - using lab scores
  const actualPercentage = parseFloat((
    (lcp.lab.score * 0.25) +
    (tbt.lab.score * 0.25) +
    (cls.lab.score * 0.05) +
    (fcp.lab.score * 0.10) +
    (si.lab.score * 0.10) +
    (ttfb.lab.score * 0.10) +
    (inp.lab.score * 0.15)
  ).toFixed(0));

  return {
    Percentage: actualPercentage,
    LCP: lcp,
    FID: fid,
    CLS: cls,
    FCP: fcp,
    TTFB: ttfb,
    TBT: tbt,
    SI: si,
    INP: inp,
    Compression: compression,
    Caching: caching,
    Resource_Optimization: resourceOptimization,
    Render_Blocking: renderBlocking,
    HTTP: https,
    Sitemap: sitemap,
    Robots: robots,
    Structured_Data: structuredData,
    Broken_Links: brokenLinks,
    Redirect_Chains: redirect,
  };
}