import googleAPI from "../utils/googleAPI.js";
import SiteReport from "../models/SiteReport.js";

function calculateScore(observed, good, poor) {
  if (observed <= good) return 100;
  if (observed >= poor) return 0;
  return parseFloat((((poor - observed) / (poor - good)) * 100).toFixed(0));
}

// METRIC EVALUATION FUNCTIONS

const evaluateLCP = (data) => {
  const value = parseFloat((data?.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue || 0).toFixed(0));
  const score = calculateScore(value, 2500, 4000);
  const status = score >= 90 ? "pass" : score >= 50 ? "warning" : "fail";

  return {
    score,
    status,
    details: `Largest Contentful Paint is ${value}ms`,
    suggestion: "Optimize hero images and defer non-critical CSS.",
    meta: {
      value,
      unit: "ms",
      target: "≤ 2500ms",
      thresholds: { good: "0–2500 ms", poor: "4000+ ms" }
    }
  };
};

const evaluateFID = (data) => {
  const value = parseFloat((data?.lighthouseResult?.audits?.['max-potential-fid']?.numericValue || 0).toFixed(0));
  const score = calculateScore(value, 100, 300);
  const status = score >= 90 ? "pass" : score >= 50 ? "warning" : "fail";

  return {
    score,
    status,
    details: `First Input Delay is ${value}ms`,
    suggestion: "Reduce JavaScript execution time and break up long tasks to improve interactivity.",
    meta: {
      value,
      unit: "ms",
      target: "≤ 100ms",
      thresholds: { good: "0–100 ms", poor: "300+ ms" }
    }
  };
};

const evaluateCLS = (data) => {
  const value = parseFloat((data?.lighthouseResult?.audits?.["cumulative-layout-shift"]?.numericValue || 0).toFixed(2));
  const score = calculateScore(value, 0.1, 0.25);
  const status = score >= 90 ? "pass" : score >= 50 ? "warning" : "fail";
  const shiftCount = data?.lighthouseResult?.audits?.['layout-shifts']?.details?.items?.length || 0;

  return {
    score,
    status,
    details: `Cumulative Layout Shift is ${value}`,
    suggestion: "Set size attributes for images, videos, and ads to prevent layout shifts.",
    meta: {
      value,
      unit: "",
      target: "≤ 0.1",
      shiftEvents: shiftCount,
      thresholds: { good: "0–0.1", poor: "0.25+" }
    }
  };
};

const evaluateFCP = (data) => {
  const value = parseFloat((data?.lighthouseResult?.audits['first-contentful-paint']?.numericValue || 0).toFixed(0));
  const score = calculateScore(value, 1800, 3000);
  const status = score >= 90 ? "pass" : score >= 50 ? "warning" : "fail";

  return {
    score,
    status,
    details: `First Contentful Paint is ${value}ms`,
    suggestion: "Prioritize above-the-fold content and optimize critical rendering paths.",
    meta: {
      value,
      unit: "ms",
      target: "≤ 1800ms",
      thresholds: { good: "0–1800 ms", poor: "3000+ ms" }
    }
  };
};

const evaluateTTFB = (data) => {
  const value = parseFloat((data?.lighthouseResult?.audits?.["server-response-time"]?.numericValue || 0).toFixed(0));
  const score = calculateScore(value, 800, 1800);
  const status = score >= 90 ? "pass" : score >= 50 ? "warning" : "fail";

  return {
    score,
    status,
    details: `Time To First Byte is ${value}ms`,
    suggestion: "Use a CDN, optimize server performance, or enable caching to reduce server response time.",
    meta: {
      value,
      unit: "ms",
      target: "≤ 800ms",
      thresholds: { good: "0–800 ms", poor: "1800+ ms" }
    }
  };
};

const evaluateTBT = (data) => {
  const value = parseFloat((data?.lighthouseResult?.audits?.["total-blocking-time"]?.numericValue || 0).toFixed(0));
  const score = calculateScore(value, 200, 600);
  const status = score >= 90 ? "pass" : score >= 50 ? "warning" : "fail";

  return {
    score,
    status,
    details: `Total Blocking Time is ${value}ms`,
    suggestion: "Split heavy JS tasks, defer non-essential scripts to unblock main thread.",
    meta: {
      value,
      unit: "ms",
      target: "≤ 200ms",
      thresholds: { good: "0–200 ms", poor: "600+ ms" }
    }
  };
};

const evaluateSI = (data) => {
  const value = parseFloat(((data?.lighthouseResult?.audits?.["speed-index"]?.numericValue || 0)).toFixed(0));
  const score = calculateScore(value, 3400, 5800);
  const status = score >= 90 ? "pass" : score >= 50 ? "warning" : "fail";

  return {
    score,
    status,
    details: `Speed Index is ${value}ms`,
    suggestion: "Improve above-the-fold content loading for faster perceived speed.",
    meta: {
      value,
      unit: "ms",
      target: "≤ 3400ms",
      thresholds: { good: "0–3400 ms", poor: "5800+ ms" }
    }
  };
};

const evaluateINP = (data) => {
  const value = parseFloat((data?.lighthouseResult?.audits?.["interactive"]?.numericValue || 0).toFixed(0));
  const score = calculateScore(value, 3800, 7300);
  const status = score >= 90 ? "pass" : score >= 50 ? "warning" : "fail";

  return {
    score,
    status,
    details: `Time to Interactive is ${value}ms`,
    suggestion: "Reduce main-thread work and optimize JS execution for faster interactivity.",
    meta: {
      value,
      unit: "ms",
      target: "≤ 3800ms",
      thresholds: { good: "0–3800 ms", poor: "7300+ ms" }
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
export default async function technicalMetrics(url, device, selectedMetric, page, response, browser, auditId) {

  const data = await googleAPI(url, device);

  // Real User Experience (CrUX Data)
  const cruxMetrics = data?.loadingExperience?.metrics || {};
  const cruxData = {
    LCP: { value: cruxMetrics["LARGEST_CONTENTFUL_PAINT_MS"]?.percentile, category: cruxMetrics["LARGEST_CONTENTFUL_PAINT_MS"]?.category },
    CLS: { value: cruxMetrics["CUMULATIVE_LAYOUT_SHIFT_SCORE"]?.percentile, category: cruxMetrics["CUMULATIVE_LAYOUT_SHIFT_SCORE"]?.category },
    INP: { value: cruxMetrics["INTERACTION_TO_NEXT_PAINT"]?.percentile, category: cruxMetrics["INTERACTION_TO_NEXT_PAINT"]?.category },
    FCP: { value: cruxMetrics["FIRST_CONTENTFUL_PAINT_MS"]?.percentile, category: cruxMetrics["FIRST_CONTENTFUL_PAINT_MS"]?.category },
    TTFB: { value: cruxMetrics["EXPERIMENTAL_TIME_TO_FIRST_BYTE"]?.percentile, category: cruxMetrics["EXPERIMENTAL_TIME_TO_FIRST_BYTE"]?.category }
  };

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


  // Calculate Overall Score (Weighted)
  const actualPercentage = parseFloat((
    (lcp.score * 0.25) +
    (tbt.score * 0.25) +
    (cls.score * 0.05) +
    (fcp.score * 0.10) +
    (si.score * 0.10) +
    (ttfb.score * 0.10) +
    (inp.score * 0.15)
  ).toFixed(0));

  await SiteReport.findByIdAndUpdate(auditId, {
    Technical_Performance: {
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
      Percentage: actualPercentage,
      Real_User_Experience: cruxData,
    },
  });

  return actualPercentage;
}