import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as cheerio from "cheerio";

// Use stealth plugin to evade common bot detection techniques
puppeteer.use(StealthPlugin());

// Intelligent Auto-Scroll to trigger lazy-loaded images and infinite scroll content
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight || totalHeight > 10000) { // Limit scroll to avoid infinite loops
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Handles common cookie consent and popup overlays that might block content or screenshots
async function handlePopups(page) {
  try {
    await page.evaluate(() => {
      // General selectors for common consent/popup IDs and classes
      const commonSelectors = [
        '[id*="cookie"]', '[class*="cookie"]',
        '[id*="consent"]', '[class*="consent"]',
        '[id*="modal"]', '[class*="modal"]',
        '.cmp-container', '#onetrust-consent-sdk', '.banner-content'
      ];

      commonSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          // We hide them instead of clicking to avoid triggering navigation or unknown side effects
          if (el && (el.innerText.toLowerCase().includes('accept') || el.innerText.toLowerCase().includes('agree') || el.innerText.toLowerCase().includes('consent'))) {
            el.style.display = 'none';
          }
        });
      });
    });
  } catch (e) {
    // Silently fail if popup handling fails as it's a non-critical enhancement
  }
}

// Detects if the page is currently showing a Cloudflare/Browser Challenge or other WAF barriers
export async function detectChallenge(page) {
  try {
    const title = await page.title();
    const content = await page.content();
    
    const selectors = [
      '#challenge-running',
      '#challenge-form',
      '.challenge-form',
      '#cf-bubbles',
      '#cloudflare-static-wrapper',
      '#turnstile-wrapper',
      '#challenge-stage',
      '#cf-spinner',
      '.cf-browser-verification',
      '#hcaptcha-box',
      'iframe[src*="cloudflare"]',
      'iframe[src*="hcaptcha"]',
      'iframe[src*="recaptcha"]',
      '.g-recaptcha',
      '#px-captcha', // PerimeterX
      '#captcha-container',
      '.distil-captcha' // Distil Networks
    ];

    const hasSelector = await page.evaluate((selList) => {
      return selList.some(s => document.querySelector(s));
    }, selectors);

    const isChallengeTitle = 
      title.includes("Just a moment...") ||
      title.includes("Attention Required! | Cloudflare") ||
      title.includes("Please Wait | Cloudflare") ||
      title.includes("Cloudflare") ||
      title.includes("Access Denied") ||
      title.includes("Checking your browser");

    const isChallengeContent = 
      content.includes("cf-browser-verification") ||
      content.includes("cf-challenge") ||
      content.includes("cf_challenge") ||
      content.includes("hcaptcha") ||
      content.includes("g-recaptcha") ||
      content.includes("ray_id") ||
      content.includes("verification required") ||
      content.includes("human verification");

    return isChallengeTitle || isChallengeContent || hasSelector;
  } catch (e) {
    return false; // If we can't check, assume it might not be a challenge or page crashed
  }
}

// Check if page has some "real" content that suggests we are past the bot wall
async function hasRealContent(page) {
  try {
    return await page.evaluate(() => {
      const bodyText = document.body.innerText || "";
      // If we have actual nav, sections, or significant amount of text, it's likely real content
      const linkCount = document.querySelectorAll('a').length;
      const paragraphCount = document.querySelectorAll('p').length;
      
      return (bodyText.length > 500 && (linkCount > 5 || paragraphCount > 2)) || 
             document.querySelector('nav') !== null || 
             document.querySelector('main') !== null || 
             document.querySelector('header') !== null;
    });
  } catch (e) {
    return false;
  }
}

// Function to wait for challenge resolution with polling and verification
export async function waitForChallengeResolution(page, timeout = 60000) {
  const startTime = Date.now();
  console.log("🛡️ Entering challenge detection loop...");
  
  while (Date.now() - startTime < timeout) {
    const isChallenged = await detectChallenge(page);
    
    if (!isChallenged) {
      // If markers are gone, verify we have real content
      const contentLoaded = await hasRealContent(page);
      if (contentLoaded) {
        console.log("✅ Verified: Real content is visible.");
        // Double check a moment later to ensure no last-minute redirects
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (!await detectChallenge(page)) return true;
      } else {
        console.log("⏳ No challenge markers, but no real content yet. Waiting...");
      }
    } else {
      console.log("⏳ Bot verification in progress or challenge detected, waiting 3s...");
    }
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Safety check: if the page title changed significantly, maybe we navigated?
    const currentTitle = await page.title();
    if (currentTitle && !currentTitle.includes("Cloudflare") && !currentTitle.includes("moment")) {
       // If title seems normal, try a content check
       if (await hasRealContent(page)) return true;
    }
  }
  
  return false;
}

export default async function Puppeteer_Cheerio(url, device = 'Desktop') {
  let browser;

  try {
    const launchOptions = {
      headless: true,
      defaultViewport: null,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--hide-scrollbars",
        "--window-size=1920,1080",
        "--mute-audio",
        "--disable-blink-features=AutomationControlled" // Further helps stealth
      ]
    };

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    if (device === "Mobile") {
      await page.setViewport({
        width: 393,
        height: 852,
        isMobile: true,
        deviceScaleFactor: 3,
        hasTouch: true,
        isLandscape: false,
      });
      await page.setUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1");
    } else {
      await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36");
    }

    // Advanced evasions
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Referer": "https://www.google.com/",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "cross-site",
      "Sec-Fetch-User": "?1"
    });

    const response = await page.goto(url, {
      waitUntil: "networkidle2", // Wait for network to settle more before checking challenge
      timeout: 90000 
    });

    // Handle bot verification
    console.log("🔍 Checking for bot verification page...");
    const challengeResolved = await waitForChallengeResolution(page, 120000); // Wait up to 2 mins for complex challenges
    
    if (!challengeResolved) {
      const isStillChallenged = await detectChallenge(page);
      if (isStillChallenged) {
        throw new Error("Bot verification failed: Stuck on challenge page.");
      }
      console.warn("⚠️ Challenge resolution uncertain, but no markers found. Proceeding with caution.");
    } else {
      console.log("✅ Challenge cleared or not detected.");
    }

    // Standard wait for initial network activity to settle
    try {
      await page.waitForNetworkIdle({ idleTime: 1000, timeout: 15000 });
    } catch (e) { }

    // Ensure critical DOM element (body) is present
    await page.waitForSelector("body", { timeout: 30000 });

    // Handle Popups/Consents to clear the view
    await handlePopups(page);

    // Trigger Lazy-loaded content via auto-scroll
    await autoScroll(page);

    await page.evaluate(() => window.scrollTo(0, 0));

    // Give SPAs (React/Vue/Next) a final moment to finish state updates/hydration
    await new Promise(resolve => setTimeout(resolve, 2000));

    const viewport = device === "Mobile"
      ? { width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
      : { width: 1920, height: 1080, deviceScaleFactor: 2, isMobile: false, hasTouch: false };

    await page.setViewport(viewport);

    // Re-check for challenge one last time before screenshot/data extraction
    if (await detectChallenge(page)) {
      console.log("⚠️ Still on challenge page before screenshot, trying one last wait (10s)...");
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Final hard check - if still challenged, we really don't want to capture this
      if (await detectChallenge(page)) {
         throw new Error("Aborted: Still on bot verification page after final wait.");
      }
    }

    const screenshot = await page.screenshot({
      encoding: "base64",
      type: "jpeg",
      quality: 50,
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width: viewport.width,
        height: viewport.height
      }
    });

    const htmlData = await page.content();
    const $ = cheerio.load(htmlData);

    return { browser, page, response, $, screenshot };

  } catch (error) {
    if (browser) await browser.close();
    console.error(`Scraping Error [${url}]:`, error.message);
    throw error;
  }
}
