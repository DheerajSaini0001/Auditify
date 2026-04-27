import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as cheerio from "cheerio";

// Stealth modules
import { applyStealthToPage, STEALTH_CHROME_ARGS, PROFILES } from "./stealth/stealthLauncher.js";
import { humanMouseMove, humanDwell, humanAutoScroll, mouseJiggle } from "./stealth/humanBehavior.js";

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

// Function to wait for challenge resolution with polling and verification
export async function waitForChallengeResolution(page, timeout = 30000) {
  const startTime = Date.now();

  // Quick check — most pages won't have a challenge at all
  if (!await detectChallenge(page)) return true;

  while (Date.now() - startTime < timeout) {
    // Try to click Turnstile/challenge checkbox if it exists
    try {
      const frames = page.frames();
      for (const frame of frames) {
        if (frame.url().includes('challenges') || frame.url().includes('turnstile') || frame.url().includes('hcaptcha')) {
          const checkbox = await frame.$('input[type="checkbox"], .ctp-checkbox-label, #challenge-stage');
          if (checkbox) {
            const box = await checkbox.boundingBox();
            if (box) {
              await page.mouse.click(
                box.x + box.width / 2 + (Math.random() * 4 - 2),
                box.y + box.height / 2 + (Math.random() * 4 - 2)
              );
              await delay(3000);
            }
          }
        }
      }
    } catch (e) {}

    // Human-like mouse movement (bezier curves instead of straight lines)
    try {
      await humanMouseMove(page, randInt(100, 800), randInt(100, 600));
    } catch (e) {}

    await delay(randInt(2000, 4000));

    // Check if challenge is gone
    if (!await detectChallenge(page)) return true;
  }

  return false;
}

export default async function Puppeteer_Cheerio(url, device = 'Desktop') {
  let browser;

  try {
    const profileKey = device === "Mobile" ? "mobile" : "desktop";
    const profile = PROFILES[profileKey];

    const launchOptions = {
      headless: true,
      defaultViewport: null,
      args: [
        ...STEALTH_CHROME_ARGS,
        `--window-size=${profile.viewport.width},${profile.viewport.height}`,
      ],
      env: {
        ...process.env,
        TZ: "America/New_York", // Timezone must match CDP override
      },
    };

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    // ═══ Apply all stealth patches (fingerprints + headers + viewport) ═══
    await applyStealthToPage(page, profileKey);

    // ⚡ Optimization: Block non-essential resources to speed up loading
    await page.setRequestInterception(true);
    page.on('request', (request) => {
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
        request.abort();
      } else {
        request.continue();
      }
    });

    // Pre-navigation: human-like dwell before loading
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

        await page.setRequestInterception(false); // Disable interception for retry
        response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => null);
    }

    const statusCode = response ? response.status() : "No Response";
    const pageTitle = await page.title();


    if (statusCode === "No Response") {
       // Return minimal data to prevent crash
       return { browser, page, response: null, $: cheerio.load("<html><body>Failed to reach site</body></html>"), screenshot: null, isBotProtected: true };
    }

    // Post-navigation: mouse jiggle to appear human
    await mouseJiggle(page);

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

    // Simulate realistic browsing: bezier mouse move + dwell
    await humanMouseMove(page, randInt(200, 900), randInt(100, 600));
    await humanDwell(page, 1000, 2000);

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
      clip: { x: 0, y: 0, width: profile.viewport.width, height: profile.viewport.height }
    });

    const htmlData = await page.content();
    const $ = cheerio.load(htmlData);

    return { browser, page, response, $, screenshot, isBotProtected: false };

  } catch (error) {
    if (browser) await browser.close();

    throw error;
  }
}
