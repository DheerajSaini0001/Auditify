// import puppeteer from "puppeteer";

function coreWebVitalsScore(value, threshold) {
  return value <= threshold ? 1 : 0;
}

function actualCalculation(observed,good,poor,weight) {
    let score = 0;
    if (observed <= good) {
      score = 100;
    } else if (observed >= poor) {
      score = 0;
    } else {
      score = ((poor - observed) / (poor - good)) * 100;
    }
  return parseFloat((score * weight).toFixed(0));
}

export default async function technicalMetrics(url,data,page) {

  // Technical Performance (Core Web Vitals)
  const lcpValue = parseFloat(((data?.lighthouseResult?.audits?.["largest-contentful-paint"]?.numericValue || 0)/1000).toFixed(1)); 
  const lcpScore = coreWebVitalsScore(lcpValue,2.5);
  const actuallcpScore = actualCalculation(lcpValue,2.5,4.0,0.25);
  
  const fidValue = parseFloat(((data?.lighthouseResult?.audits?.['max-potential-fid']?.numericValue || 0)/1000).toFixed(1)); 
  const fidScore = coreWebVitalsScore(fidValue,0.1);
  
  const clsValue = parseFloat((data?.lighthouseResult?.audits?.["cumulative-layout-shift"]?.numericValue || 0).toFixed(1)); 
  const clsScore = coreWebVitalsScore(clsValue,0.1);
  const actualclsScore = actualCalculation(clsValue,0.1,0.25,0.05);
  
  const fcpValue = parseFloat(((data?.lighthouseResult?.audits['first-contentful-paint']?.numericValue || 0)/1000).toFixed(1));
  const fcpScore = coreWebVitalsScore(fcpValue,1.8);
  const actualfcpScore = actualCalculation(fcpValue,1.8,3.0,0.10);

  const ttfbValue = parseFloat(((data?.lighthouseResult?.audits?.["server-response-time"]?.numericValue || 0)/1000).toFixed(1)); 
  const ttfbScore = coreWebVitalsScore(ttfbValue,0.2);
  const actualttfbScore = actualCalculation(ttfbValue,0.2,0.6,0.10);

  const tbtValue = parseFloat(((data?.lighthouseResult?.audits?.["total-blocking-time"]?.numericValue || 0)/1000).toFixed(1));
  const tbtScore = coreWebVitalsScore(tbtValue,0.3);
  const actualtbtScore = actualCalculation(tbtValue,0.3,0.6,0.25);
  
  const siValue = parseFloat(((data?.lighthouseResult?.audits?.["speed-index"]?.numericValue || 0)/1000).toFixed(1));
  const siScore = coreWebVitalsScore(siValue,3.0);
  const actualsiScore = actualCalculation(siValue,3.0,5.0,0.10);

  const inpValue = parseFloat(((data?.lighthouseResult?.audits?.["interactive"]?.numericValue || 0)/1000).toFixed(0)); 
  const inpScore = coreWebVitalsScore(inpValue,3.8);
  const actualinpScore = actualCalculation(inpValue,3.8,7.0,0.15);

  const coreWebVitalsTotal = lcpScore + fidScore + clsScore + ttfbScore + tbtScore + siScore + fcpScore + inpScore
  
  const coreWebVitals ={
    lcpValue,lcpScore,
    fidValue,fidScore,
    clsValue,clsScore,
    fcpValue,fcpScore,
    ttfbValue,ttfbScore,
    tbtValue,tbtScore,
    siValue,siScore,
    inpValue,inpScore,
    coreWebVitalsTotal
  }
  
  // Technical Performance (Delivery & Render)
  const compressionValue = data?.lighthouseResult?.audits?.["uses-text-compression"]?.score || 0; 
  const compressionScore = compressionValue === 1 ? 1 : 0; 
  
  const cachingValue = parseFloat(((data?.lighthouseResult?.audits?.["uses-long-cache-ttl"]?.numericValue || 0)/86400).toFixed(0));
  const cachingScore = cachingValue >= 7 ? 1 : 0; 

  const imagesOptimized = data?.lighthouseResult?.audits?.["uses-optimized-images"]?.score || 0;
  const offscreenImages = data?.lighthouseResult?.audits?.["offscreen-images"]?.score || 0;
  const cssJsMinified = Math.min( data?.lighthouseResult?.audits?.["unminified-css"]?.score || 1, data?.lighthouseResult?.audits?.["unminified-javascript"]?.score || 1);
  const resourceOptimizationScore = (imagesOptimized === 1 && offscreenImages === 1 && cssJsMinified === 1) ? 1 : 0;
  
  const renderBlockingValue = data?.lighthouseResult?.audits?.["render-blocking-resources"]?.score || 0;
  const renderBlockingScore = renderBlockingValue === 1 ? 1 : 0;

  const httpsValue = data?.lighthouseResult?.audits?.["uses-http2"]?.score || 0;
  const httpsScore = httpsValue === 1 ? 1 : 0;

  const deliveryAndRenderTotal = compressionScore + cachingScore + httpsScore + renderBlockingScore + resourceOptimizationScore;

  const deliveryAndRender = {
    compressionValue,compressionScore,
    cachingValue,cachingScore,
    resourceOptimizationScore,
    renderBlockingValue,renderBlockingScore,
    httpsScore,httpsValue,
    deliveryAndRenderTotal
  }

  // Technical Performance (Crawlability & Hygiene)
  const response = await page.goto(url, { waitUntil: "networkidle2",timeout: 240000 });

  const chain = response.request().redirectChain();
  const hops = chain.length; 
  const redirectScore = hops <= 1 ? 1 : 0;

  const structuredDataScore = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    .map(el => {
        try { return JSON.parse(el.innerText); } catch { return null; }
      })
      .filter(Boolean)
    return scripts.length > 0 ? 1 : 0;
  });

  const links = await page.$$eval("a[href]", (anchors) =>
    anchors
      .map((a) => a.href)
      .filter((l) => l && l.startsWith("http"))
  );

  let brokenCount = 0;
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

        if (status === 0 || status >= 400) brokenCount++;
      } catch {
        brokenCount++;
      }
    })
  );

  const totalLinks = links.length || 1;
  const brokenPercent = parseFloat(((brokenCount / totalLinks) * 100).toFixed(0));
  const brokenScore = brokenPercent === 0 ? 1 : 0;
  
  let sitemapScore = 0;
  try {
  const sitemapUrl = new URL("/sitemap.xml", url).href;
  const sitemapPage = await browser.newPage();
  const response = await sitemapPage.goto(sitemapUrl);
  sitemapScore = response.status() === 200 ? 1 : 0;
  }
  catch {
  sitemapScore = 0; 
  }

  let robotsScore = 0;
  try {
  const robotsUrl = new URL("/robots.txt", url).href;
  const robotsPage = await browser.newPage();;
  const response = await robotsPage.goto(robotsUrl);
  robotsScore = response.status() === 200 ? 1 : 0;
  }
  catch {
  robotsScore = 0; 
  }
  
  page.close()

  const crawlabilityAndHygieneTotal = sitemapScore + robotsScore + structuredDataScore + brokenScore + redirectScore
  
  const crawlabilityAndHygiene = {
    sitemapScore,
    robotsScore,
    structuredDataScore,
    brokenPercent,brokenScore,
    hops,redirectScore,
    crawlabilityAndHygieneTotal
  }
  
  const Total = parseFloat((((coreWebVitalsTotal + deliveryAndRenderTotal + crawlabilityAndHygieneTotal)/18)*100).toFixed(0))
  
  // Passed
  const passed = [];
  
  // Improvements
  const improvements = [];

// Technical Performance (Core Web Vitals)
if (fidScore === 0) {
  improvements.push({
    metric: "First Input Delay (FID)",
    current: fidValue + "s",
    recommended: "< 0.1s",
    severity: "High 🟠",
    suggestion: "Reduce JavaScript execution time and break up long tasks to improve interactivity."
  });
} else {
  passed.push({
    metric: "First Input Delay (FID)",
    current: fidValue + "s",
    recommended: "< 0.1s",
    severity: "✅ Passed",
    suggestion: "FID is within optimal range."
  });
}

// Technical Performance (Delivery & Render)
if (compressionScore === 0) {
  improvements.push({
    metric: "Text Compression",
    current: "Disabled",
    recommended: "Enabled (gzip/brotli)",
    severity: "Medium 🟡",
    suggestion: "Enable text compression to reduce payload size and speed up page load."
  });
} else {
  passed.push({
    metric: "Text Compression",
    current: "Enabled",
    recommended: "Enabled (gzip/brotli)",
    severity: "✅ Passed",
    suggestion: "Text compression is enabled."
  });
}

if (cachingScore === 0) {
  improvements.push({
    metric: "Caching",
    current: cachingValue + "days",
    recommended: "≥ 7 days",
    severity: "Medium 🟡",
    suggestion: "Set long cache TTL for static resources to improve repeat visit speed."
  });
} else {
  passed.push({
    metric: "Caching",
    current: cachingValue + "days",
    recommended: "≥ 7 days",
    severity: "✅ Passed",
    suggestion: "Caching is properly set."
  });
}

if (resourceOptimizationScore === 0) {
  improvements.push({
    metric: "Resource Optimization",
    current: "Not fully optimized",
    recommended: "Images optimized, CSS/JS minified, offscreen images deferred",
    severity: "High 🟠",
    suggestion: "Compress images, minify CSS/JS, and lazy-load offscreen images to improve load times."
  });
} else {
  passed.push({
    metric: "Resource Optimization",
    current: "Optimized",
    recommended: "Images optimized, CSS/JS minified, offscreen images deferred",
    severity: "✅ Passed",
    suggestion: "Resources are optimized."
  });
}

if (renderBlockingScore === 0) {
  improvements.push({
    metric: "Render-Blocking Resources",
    current: "Present",
    recommended: "None",
    severity: "High 🟠",
    suggestion: "Defer or async non-critical CSS/JS to improve first render speed."
  });
} else {
  passed.push({
    metric: "Render-Blocking Resources",
    current: "None",
    recommended: "None",
    severity: "✅ Passed",
    suggestion: "No render-blocking resources found."
  });
}

if (httpsScore === 0) {
  improvements.push({
    metric: "HTTP/2 Protocol",
    current: "Not enabled",
    recommended: "Enabled",
    severity: "Medium 🟡",
    suggestion: "Enable HTTP/2 to allow multiplexing and faster delivery of resources."
  });
} else {
  passed.push({
    metric: "HTTP/2 Protocol",
    current: "Enabled",
    recommended: "Enabled",
    severity: "✅ Passed",
    suggestion: "HTTP/2 is enabled."
  });
}

// Technical Performance (Crawlability & Hygiene)
if (sitemapScore === 0) {
  improvements.push({
    metric: "Sitemap",
    current: "Missing",
    recommended: "Available",
    severity: "Medium 🟡",
    suggestion: "Add sitemap.xml and submit it to search engines for better indexing."
  });
} else {
  passed.push({
    metric: "Sitemap",
    current: "Available",
    recommended: "Available",
    severity: "✅ Passed",
    suggestion: "Sitemap is present."
  });
}

if (robotsScore === 0) {
  improvements.push({
    metric: "Robots.txt",
    current: "Missing",
    recommended: "Available",
    severity: "Medium 🟡",
    suggestion: "Ensure robots.txt exists and allows proper crawling."
  });
} else {
  passed.push({
    metric: "Robots.txt",
    current: "Available",
    recommended: "Available",
    severity: "✅ Passed",
    suggestion: "Robots.txt is properly configured."
  });
}

if (structuredDataScore === 0) {
  improvements.push({
    metric: "Structured Data",
    current: "Not present",
    recommended: "JSON-LD structured data present",
    severity: "Low 🟢",
    suggestion: "Add structured data to improve search results display."
  });
} else {
  passed.push({
    metric: "Structured Data",
    current: "Present",
    recommended: "JSON-LD structured data present",
    severity: "✅ Passed",
    suggestion: "Structured data is implemented."
  });
}

if (brokenScore === 0) {
  improvements.push({
    metric: "Broken Links",
    current: `${brokenPercent}% broken`,
    recommended: "0%",
    severity: "High 🟠",
    suggestion: "Fix all broken links to improve user experience and SEO."
  });
} else {
  passed.push({
    metric: "Broken Links",
    current: "0% broken",
    recommended: "0%",
    severity: "✅ Passed",
    suggestion: "No broken links found."
  });
}

if (redirectScore === 0) {
  improvements.push({
    metric: "Redirect Chains",
    current: `${hops} hops`,
    recommended: "≤ 1 hop",
    severity: "Medium 🟡",
    suggestion: "Reduce redirect chains to speed up page load and improve crawlability."
  });
} else {
  passed.push({
    metric: "Redirect Chains",
    current: `${hops} hops`,
    recommended: "≤ 1 hop",
    severity: "✅ Passed",
    suggestion: "Redirect chains are within acceptable limits."
  });
}

// Warning
const warning = [];

// Technical Performance (Core Web Vitals)
if (lcpScore === 0) {
  warning.push({
    metric: "Largest Contentful Paint (LCP)",
    current: lcpValue + "s",
    recommended: "< 2.5s",
    severity: "Critical 🔴",
    suggestion: "Optimize hero images, defer non-critical CSS, and improve server response for faster page loading."
  });
} else {
  passed.push({
    metric: "Largest Contentful Paint (LCP)",
    current: lcpValue + "s",
    recommended: "< 2.5s",
    severity: "✅ Passed",
    suggestion: "LCP is within optimal range."
  });
}

if (tbtScore === 0) {
  warning.push({
    metric: "Total Blocking Time (TBT)",
    current: tbtValue + "s",
    recommended: "< 0.3s",
    severity: "High 🟠",
    suggestion: "Split heavy JS tasks, defer non-essential scripts to unblock main thread."
  });
} else {
  passed.push({
    metric: "Total Blocking Time (TBT)",
    current: tbtValue + "s",
    recommended: "< 0.3s",
    severity: "✅ Passed",
    suggestion: "TBT is within optimal range."
  });
}

if (clsScore === 0) {
  warning.push({
    metric: "Cumulative Layout Shift (CLS)",
    current: clsValue,
    recommended: "< 0.1",
    severity: "High 🟠",
    suggestion: "Set size attributes for images, videos, and ads to prevent layout shifts."
  });
} else {
  passed.push({
    metric: "Cumulative Layout Shift (CLS)",
    current: clsValue,
    recommended: "< 0.1",
    severity: "✅ Passed",
    suggestion: "CLS is within optimal range."
  });
}

if (fcpScore === 0) {
  warning.push({
    metric: "First Contentful Paint (FCP)",
    current: fcpValue + "s",
    recommended: "< 1.8s",
    severity: "Medium 🟡",
    suggestion: "Prioritize above-the-fold content and optimize critical rendering paths."
  });
} else {
  passed.push({
    metric: "First Contentful Paint (FCP)",
    current: fcpValue + "s",
    recommended: "< 1.8s",
    severity: "✅ Passed",
    suggestion: "FCP is within optimal range."
  });
}

if (siScore === 0) {
  warning.push({
    metric: "Speed Index (SI)",
    current: siValue + "s",
    recommended: "< 3s",
    severity: "Medium 🟡",
    suggestion: "Improve above-the-fold content loading for faster perceived speed."
  });
} else {
  passed.push({
    metric: "Speed Index (SI)",
    current: siValue + "s",
    recommended: "< 3s",
    severity: "✅ Passed",
    suggestion: "Speed Index is within optimal range."
  });
}

if (ttfbScore === 0) {
  warning.push({
    metric: "Time To First Byte (TTFB)",
    current: ttfbValue + "s",
    recommended: "< 0.2s",
    severity: "Critical 🔴",
    suggestion: "Use a CDN, optimize server performance, or enable caching to reduce server response time."
  });
} else {
  passed.push({
    metric: "Time To First Byte (TTFB)",
    current: ttfbValue + "s",
    recommended: "< 0.2s",
    severity: "✅ Passed",
    suggestion: "TTFB is within optimal range."
  });
}

if (inpScore === 0) {
  warning.push({
    metric: "Time to Interactive (TTI)",
    current: inpValue + "s",
    recommended: "< 3.8s",
    severity: "High 🟠",
    suggestion: "Reduce main-thread work and optimize JS execution for faster interactivity."
  });
} else {
  passed.push({
    metric: "Time to Interactive (TTI)",
    current: inpValue + "s",
    recommended: "< 3.8s",
    severity: "✅ Passed",
    suggestion: "TTI is within optimal range."
  });
}

const actualPercentage = actuallcpScore + actualtbtScore + actualclsScore + actualfcpScore + actualsiScore + actualttfbScore + actualinpScore

// console.log(actuallcpScore);
// console.log(actualtbtScore);
// console.log(actualclsScore);
// console.log(actualfcpScore);
// console.log(actualsiScore);
// console.log(actualttfbScore);
// console.log(actualinpScore);
  // console.log(coreWebVitals);
  // console.log(deliveryAndRender);
  // console.log(crawlabilityAndHygiene);
  // console.log(actualPercentage);
  // console.log(warning);
  // console.log(passed);
  // console.log(Total);
  // console.log(improvements);
  
  return {
    coreWebVitals,
    deliveryAndRender,
    crawlabilityAndHygiene,
    actualPercentage,warning,
    passed,
    Total,improvements
  };
}