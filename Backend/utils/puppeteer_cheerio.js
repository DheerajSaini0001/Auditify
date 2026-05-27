import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as cheerio from "cheerio";

// Use stealth plugin to evade common bot detection techniques
puppeteer.use(StealthPlugin());

// ======================== HELPERS ===========================

/** Random integer between min and max (inclusive) */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Async delay */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 400; // Increased distance from 100 to 400
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight || totalHeight > 10000) {
          clearInterval(timer);
          resolve();
        }
      }, 50); // Decreased interval from 100ms to 50ms
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

// Detects if the page is currently showing a REAL Cloudflare/Browser Challenge or other WAF barrier.
// Uses a scoring system to avoid false positives on normal Cloudflare CDN-served sites.
// If the page has real content (nav, header, many links), it's NOT a challenge — override.
export async function detectChallenge(page) {
  try {
    // FIRST: If the page has real content, it's NOT a challenge — fast exit
    const contentCheck = await page.evaluate(() => {
      const bodyText = document.body?.innerText || "";
      const linkCount = document.querySelectorAll('a').length;
      const paragraphCount = document.querySelectorAll('p').length;
      const hasNav = !!document.querySelector('nav');
      const hasMain = !!document.querySelector('main');
      const hasHeader = !!document.querySelector('header');
      const hasFooter = !!document.querySelector('footer');
      
      const structuralElements = [hasNav, hasMain, hasHeader, hasFooter].filter(Boolean).length;
      
      // If page has substantial text + links/structure, it's real content
      return (bodyText.length > 500 && (linkCount > 5 || paragraphCount > 2)) ||
             structuralElements >= 2;
    });

    // Real content found = NOT a bot wall, regardless of CDN artifacts in HTML
    if (contentCheck) return false;

    const title = await page.title();
    const content = await page.content();
    
    // These selectors are strong indicators of an ACTIVE challenge page
    const strongSelectors = [
      '#challenge-running',
      '#challenge-form',
      '.challenge-form',
      '#cf-bubbles',
      '#challenge-stage',
      '#cf-spinner',
      '.cf-browser-verification',
      '#hcaptcha-box',
      '.g-recaptcha',
      '#px-captcha',
      '#captcha-container',
      '.distil-captcha',
      '#captchacharacters',
      'form[action*="/errors/validateCaptcha"]',
      '#challenge-error-title'
    ];

    const hasChallengeSelector = await page.evaluate((selList) => {
      return selList.some(s => document.querySelector(s));
    }, strongSelectors);

    // Active Turnstile iframe (challenge iframes, not CDN scripts)
    const hasActiveTurnstile = await page.evaluate(() => {
      const iframes = Array.from(document.querySelectorAll('iframe'));
      return iframes.some(iframe => 
        iframe.src.includes('challenges.cloudflare.com') || 
        iframe.src.includes('hcaptcha.com')
      );
    });

    // Title-based detection — these are ONLY set on actual challenge pages
    const isChallengeTitle = 
      title === "Just a moment..." ||
      title.includes("Attention Required!") ||
      title === "Please Wait..." ||
      title === "Cloudflare" ||
      title.includes("Access Denied") ||
      title.includes("Checking your browser") ||
      title.includes("Robot Check") ||
      title.includes("Human Verification") ||
      title.includes("Verify you are human");

    // Strong content signals — things only present on actual challenge/block pages
    const strongContentSignals = [
      "cf-browser-verification",
      "Verifying you are human",
      "Checking if the site connection is secure",
      "Enter the characters you see below",
      "automated access to Amazon",
    ];

    const bodyText = await page.evaluate(() => document.body?.innerText || "");
    const hasStrongContent = strongContentSignals.some(signal => 
      bodyText.includes(signal) || content.includes(signal)
    );

    // Scoring: need strong evidence, not just CDN artifacts
    let score = 0;
    if (isChallengeTitle) score += 3;        // Very strong signal
    if (hasChallengeSelector) score += 2;    // Strong signal
    if (hasActiveTurnstile) score += 2;      // Strong signal
    if (hasStrongContent) score += 2;        // Strong signal
    
    // Weak signals — these appear on normal Cloudflare sites too
    if (bodyText.length < 200) score += 1;   // Very little visible text = suspicious

    // Need score >= 2 to flag as challenge (avoids single weak signal false positives)
    return score >= 2;
  } catch (e) {
    return false;
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

// Safely retrieves all frames attached to the page, checking for page closure
function getFreshFrames(page) {
  try {
    if (!page || page.isClosed()) return [];
    return page.frames() || [];
  } catch (e) {
    return [];
  }
}

// Safely checks if a frame is detached
function isFrameDetached(frame) {
  try {
    if (!frame) return true;
    if (typeof frame.isDetached === "function") {
      return frame.isDetached();
    }
    // Fallback: calling frame.url() throws if frame is detached
    frame.url();
    return false;
  } catch (e) {
    return true;
  }
}

// Safely gets the URL of a frame, returning "" if it fails or is detached
function getFrameUrl(frame) {
  try {
    if (!frame || isFrameDetached(frame)) return "";
    return frame.url() || "";
  } catch (e) {
    return "";
  }
}

// Safely waits for a selector in matching frames and performs a human-like click.
// Uses fresh references and handles detached frame scenarios via try-catch.
async function safeClickCheckboxInFrame(page, framePatterns, selector, timeout = 3000) {
  if (!page || page.isClosed()) return false;

  try {
    // 1. Re-fetch all frames to ensure none are stale
    const frames = getFreshFrames(page);

    for (const frame of frames) {
      if (isFrameDetached(frame)) continue;

      const url = getFrameUrl(frame);
      const isMatch = framePatterns.some(pattern => url.includes(pattern));
      if (!isMatch) continue;

      // 2. Wrap all operations inside the frame in a try-catch to isolate detached frame errors
      try {
        // Wait for the selector to become available in the frame
        await frame.waitForSelector(selector, { timeout }).catch(() => null);

        // Verify page/frame status before continuing
        if (page.isClosed() || isFrameDetached(frame)) continue;

        // 3. Query the element with a fresh reference
        const checkbox = await frame.$(selector);
        if (!checkbox) continue;

        // 4. Get its bounding box
        const box = await checkbox.boundingBox();
        if (box) {
          // Double-check page/frame status right before click
          if (page.isClosed() || isFrameDetached(frame)) continue;

          // 5. Click the bounding box with standard random offsets
          await page.mouse.click(
            box.x + box.width / 2 + (Math.random() * 4 - 2),
            box.y + box.height / 2 + (Math.random() * 4 - 2)
          );
          return true; // Successfully clicked
        }
      } catch (innerErr) {
        // Log warning and safely skip this frame to prevent crashing other frames
        console.warn(`⚠️ [Puppeteer Checkbox] Skipped frame/element query due to detachment: ${innerErr.message}`);
      }
    }
  } catch (err) {
    console.error(`❌ [Puppeteer Checkbox] Error scanning frames: ${err.message}`);
  }
  return false;
}

// Function to wait for challenge resolution with polling and verification
export async function waitForChallengeResolution(page, timeout = 30000) {
  const startTime = Date.now();

  // Quick check — most pages won't have a challenge at all
  if (!await detectChallenge(page)) return true;

  const patterns = ['challenges', 'turnstile', 'hcaptcha'];
  const selectors = ['input[type="checkbox"]', '.ctp-checkbox-label', '#challenge-stage'];

  while (Date.now() - startTime < timeout) {
    if (page.isClosed()) return false;

    // Check if challenge is already resolved
    if (!await detectChallenge(page)) return true;

    // Try clicking each selector inside a matching frame
    for (const selector of selectors) {
      if (page.isClosed()) break;
      const clicked = await safeClickCheckboxInFrame(page, patterns, selector, 2000);
      if (clicked) {
        // Wait 3 seconds after successful interaction for verification response to load
        await delay(3000);
        break;
      }
    }

    // Human-like mouse movement
    try {
      if (!page.isClosed()) {
        await page.mouse.move(randInt(100, 800), randInt(100, 600), { steps: randInt(5, 15) });
      }
    } catch (e) {}

    await delay(randInt(2000, 4000));
  }

  return !await detectChallenge(page);
}

export default async function Puppeteer_Cheerio(url, device = 'Desktop') {
  let browser;

  try {
    const launchOptions = {
      headless: true, // Non-headless for maximum stealth — looks like a real browser
      defaultViewport: null,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--hide-scrollbars",
        "--mute-audio",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--window-size=1920,1080",
        "--ignore-certificate-errors",
        "--no-zygote",
        "--single-process" // Recommended for production servers with limited memory
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
      ? "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36"
      : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";
    
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

    // ⚡ Optimization: Block non-essential resources to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      try {
        const resourceType = request.resourceType();
        const url = request.url().toLowerCase();
        
        // Block ads, trackers, and unnecessary heavy stuff
        const blockedResources = [
          'googletagmanager.com', 'google-analytics.com', 'analytics.google.com',
          'facebook.net', 'popupsmart.com', 'hotjar.com', 'intercom.io',
          'adsystem.com', 'ads-twitter.com', 'doubleclick.net'
        ];
        
        if (
          resourceType === 'font' || 
          resourceType === 'media' ||
          blockedResources.some(domain => url.includes(domain))
        ) {
          request.abort().catch(() => {});
        } else {
          request.continue().catch(() => {});
        }
      } catch (err) {
        // Safe fallback in case interception is disabled in-flight
      }
    });

    // Pre-navigation random delay (1-3s) for human-like behavior
    await delay(randInt(1000, 3000));

    // Speed up: Wait for 'load' instead of 'networkidle2' for heavy sites
    let response = await page.goto(url, {
      waitUntil: "load",
      timeout: 60000 
    }).catch(async () => {
      return null;
    });

    // 🔄 [Production Patch] If site is unreachable (No Response), try one more time without request interception
    if (!response) {
        try { page.removeAllListeners('request'); } catch (_) {}
        await page.setRequestInterception(false); // Disable interception for retry
        response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => null);
    }

    const statusCode = response ? response.status() : "No Response";
    const pageTitle = await page.title();


    if (statusCode === "No Response") {
       // Return minimal data to prevent crash
       return { browser, page, response: null, $: cheerio.load("<html><body>Failed to reach site</body></html>"), screenshot: null, isBotProtected: true };
    }



    // Handle bot verification (Cloudflare, etc.)
    let challengeResolved = await waitForChallengeResolution(page, 30000); 
    
    let isBotProtected = await detectChallenge(page);

    // [Retry Logic] If still protected, try one refresh - often works in production
    if (isBotProtected) {
       await page.reload({ waitUntil: "networkidle2", timeout: 30000 });
       challengeResolved = await waitForChallengeResolution(page, 20000);
       isBotProtected = await detectChallenge(page);
    }

    if (isBotProtected) {
      const htmlData = await page.content();
      const $ = cheerio.load(htmlData);
      // Return null screenshot so the bot page is NOT shown in the UI
      return { browser, page, response, $, screenshot: null, isBotProtected: true };
    }

    // Success: Challenge cleared or not detected

    // Simulate small mouse movement (human-like)
    await page.mouse.move(randInt(100, 800), randInt(100, 600));

    // Post-load random delay (1-2s)
    await delay(randInt(1000, 2000));

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

    throw error;
  }
}

