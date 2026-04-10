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
      '#px-captcha',
      '#captcha-container',
      '.distil-captcha',
      '#captchacharacters', // Amazon specific
      'form[action*="/errors/validateCaptcha"]' // Amazon specific
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
      title.includes("Checking your browser") ||
      title.includes("Robot Check"); // Amazon/Google specific

    const isChallengeContent = 
      content.includes("cf-browser-verification") ||
      content.includes("cf-challenge") ||
      content.includes("cf_challenge") ||
      content.includes("hcaptcha") ||
      content.includes("g-recaptcha") ||
      content.includes("ray_id") ||
      content.includes("verification required") ||
      content.includes("human verification") ||
      content.includes("Enter the characters you see below") || // Amazon
      content.includes("automated access to Amazon"); // Amazon

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
        "--disable-blink-features=AutomationControlled"
      ]
    };

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    // Extra Stealth: Override Webdriver and common bot detection markers
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      // Mock hardware concurrency
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    });

    // Consistent headers to match User-Agent
    const commonHeaders = {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': device === "Mobile" ? '?1' : '?0',
      'Sec-Ch-Ua-Platform': device === "Mobile" ? '"Android"' : '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Referer': 'https://www.google.com/'
    };

    await page.setExtraHTTPHeaders(commonHeaders);

    // Set User Agent
    const userAgent = device === "Mobile" 
      ? "Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
      : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
    
    await page.setUserAgent(userAgent);

    if (device === "Mobile") {
      await page.setViewport({
        width: 393,
        height: 852,
        isMobile: true,
        deviceScaleFactor: 3,
        hasTouch: true,
        isLandscape: false,
      });
    } else {
      await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
    }

    // Simulate thinking/loading time before navigation
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1000) + 1000));

    console.log(`🌐 Navigating to: ${url} (${device})`);

    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 90000 
    });

    const statusCode = response ? response.status() : "No Response";
    const pageTitle = await page.title();
    console.log(`📡 Status: ${statusCode} | Title: ${pageTitle}`);

    if (statusCode === 403 || statusCode === 503 || (pageTitle === "" && statusCode === 200)) {
        console.warn("⚠️ Likely bot detection detected (Blank page or 403/503).");
    }

    // Capture screenshot if possible

    // Handle bot verification (Cloudflare, etc.)
    console.log(`🔍 Checking bot verification for: ${url}`);
    const challengeResolved = await waitForChallengeResolution(page, 60000); // 1 minute timeout for challenge
    
    const isBotProtected = await detectChallenge(page);

    if (isBotProtected) {
      console.log(`🛡️ Bot Protection Detected: ${url}`);
      // Even if protected, we take a screenshot and pass the HTML (which will be the challenge page)
      // but we flag it so the system can mark it as "Bot Protected"
      const screenshot = await page.screenshot({ encoding: "base64", type: "jpeg", quality: 30 });
      const htmlData = await page.content();
      const $ = cheerio.load(htmlData);
      return { browser, page, response, $, screenshot, isBotProtected: true };
    }

    // Success: Challenge cleared or not detected
    console.log(`✅ Page accessible: ${url}`);

    // Simulate real behavior: random scrolling and delays
    await handlePopups(page);
    await autoScroll(page);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for any lazy animations
    await page.evaluate(() => window.scrollTo(0, 0));

    // Final screenshot of the fully rendered page
    const screenshot = await page.screenshot({
      encoding: "base64",
      type: "jpeg",
      quality: 50,
      fullPage: false,
      clip: { x: 0, y: 0, width: device === "Mobile" ? 393 : 1920, height: device === "Mobile" ? 852 : 1080 }
    });

    const htmlData = await page.content();
    const $ = cheerio.load(htmlData);

    return { browser, page, response, $, screenshot, isBotProtected: false };

  } catch (error) {
    if (browser) await browser.close();
    console.error(`Scraping Error [${url}]:`, error.message);
    throw error;
  }
}

