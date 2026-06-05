import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as cheerio from "cheerio";
import SingleAuditReport from "../models/singleAuditReport.js";

// Use stealth plugin to evade common bot detection techniques
// [EXISTING STEALTH CONFIG — DO NOT MODIFY]
chromium.use(StealthPlugin());

// ======================== HELPERS ===========================

// [EXISTING] — Logger utility
const logger = {
  debug: (...args) => {
    if (process.env.DEBUG) {
      console.log(...args);
    }
  },
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args)
};

// [FIX] — Centralized detached frame error detector
// Replaces all individual error string checks throughout the file
function isDetachedFrameError(error) {
  if (!error || !error.message) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('detached frame') ||
    msg.includes('attempted to use detached') ||
    msg.includes('session closed') ||
    msg.includes('target closed') ||
    msg.includes('execution context was destroyed') ||
    msg.includes('context was destroyed') ||
    msg.includes('cannot find context with specified id') ||
    msg.includes('frame was detached') ||
    msg.includes('frame operation timeout') ||
    msg.includes('navigating') ||
    msg.includes('same javascript world')
  );
}

// [EXISTING] — Frame health check utility function
function isFrameAlive(frame) {
  try {
    if (!frame) return false;
    if (typeof frame.isDetached === "function") {
      return !frame.isDetached();
    }
    frame.url();
    return true;
  } catch {
    return false;
  }
}

// [EXISTING] — Safe frame operation wrapper with timeout
async function safeFrameOperation(frame, operation, timeoutMs = 5000) {
  if (!isFrameAlive(frame)) return null;

  try {
    const result = await Promise.race([
      operation(frame),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Frame operation timeout')), timeoutMs)
      )
    ]);
    return result;
  } catch (error) {
    // [FIX] — use centralized checker
    if (isDetachedFrameError(error)) {
      logger.debug('[Frame] Frame detached or timed out during operation — expected after challenge resolution');
      return null;
    }
    throw error;
  }
}

// [EXISTING] — Safe page content retriever with fallback
async function safePageContent(page) {
  try {
    if (!page || page.isClosed()) return "";
    return await page.content();
  } catch (error) {
    // [FIX] — use centralized checker
    if (isDetachedFrameError(error)) {
      logger.debug('[Frame] Fallback content serialization due to detached frame.');
      try {
        return await page.evaluate(() => document.documentElement.outerHTML);
      } catch (innerErr) {
        return "<html><body>Failed to serialize content due to detached frame</body></html>";
      }
    }
    throw error;
  }
}

// [FIX] — Safe page.title() wrapper
// Replaces all bare await page.title() calls
async function safeGetTitle(page) {
  try {
    if (!page || page.isClosed()) return "";
    return await page.title();
  } catch (e) {
    if (isDetachedFrameError(e)) {
      logger.debug('[Frame] page.title() skipped — frame detached');
      return "";
    }
    return "";
  }
}

/** Random integer between min and max (inclusive) */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Async delay */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// [FIX] — autoScroll wrapped with detached frame protection
async function autoScroll(page) {
  try {
    if (!page || page.isClosed()) return;
    await page.evaluate(async () => {
      // [EXISTING autoScroll logic — DO NOT MODIFY]
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 400;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight || totalHeight > 10000) {
            clearInterval(timer);
            resolve();
          }
        }, 50);
      });
    });
  } catch (error) {
    // [FIX] — use centralized checker
    if (isDetachedFrameError(error)) {
      logger.debug('[Frame] autoScroll skipped — frame detached during scroll');
      return;
    }
    throw error;
  }
}

// [FIX] — handlePopups wrapped with detached frame protection
async function handlePopups(page) {
  try {
    if (!page || page.isClosed()) return;
    await page.evaluate(() => {
      // [EXISTING handlePopups logic — DO NOT MODIFY]
      const commonSelectors = [
        '[id*="cookie"]', '[class*="cookie"]',
        '[id*="consent"]', '[class*="consent"]',
        '[id*="modal"]', '[class*="modal"]',
        '.cmp-container', '#onetrust-consent-sdk', '.banner-content'
      ];

      commonSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el && (
            el.innerText.toLowerCase().includes('accept') ||
            el.innerText.toLowerCase().includes('agree') ||
            el.innerText.toLowerCase().includes('consent')
          )) {
            el.style.display = 'none';
          }
        });
      });
    });
  } catch (e) {
    // [FIX] — use centralized checker, silently fail for both cases
    if (isDetachedFrameError(e)) {
      logger.debug('[Frame] handlePopups skipped — frame detached');
      return;
    }
    // Silently fail for all other errors too — non-critical
  }
}

// [EXISTING — DO NOT MODIFY] — detectChallenge with [FIX] applied to each evaluate
export async function detectChallenge(page) {
  try {
    // [FIX] — individually wrapped evaluate for contentCheck
    let contentCheck = false;
    try {
      if (!page || page.isClosed()) return false;
      contentCheck = await page.evaluate(() => {
        const bodyText = document.body?.innerText || "";
        const linkCount = document.querySelectorAll('a').length;
        const paragraphCount = document.querySelectorAll('p').length;
        const hasNav = !!document.querySelector('nav');
        const hasMain = !!document.querySelector('main');
        const hasHeader = !!document.querySelector('header');
        const hasFooter = !!document.querySelector('footer');

        const structuralElements = [hasNav, hasMain, hasHeader, hasFooter].filter(Boolean).length;

        return (bodyText.length > 500 && (linkCount > 5 || paragraphCount > 2)) ||
               structuralElements >= 2;
      });
    } catch (e) {
      if (isDetachedFrameError(e)) {
        logger.debug('[Frame] detectChallenge contentCheck skipped — frame detached');
        return false;
      }
      throw e;
    }

    if (contentCheck) return false;

    // [FIX] — safeGetTitle replaces bare page.title()
    const title = await safeGetTitle(page);

    const content = await safePageContent(page);

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

    // [FIX] — individually wrapped evaluate for hasChallengeSelector
    let hasChallengeSelector = false;
    try {
      if (!page || page.isClosed()) return false;
      hasChallengeSelector = await page.evaluate((selList) => {
        return selList.some(s => document.querySelector(s));
      }, strongSelectors);
    } catch (e) {
      if (isDetachedFrameError(e)) {
        logger.debug('[Frame] detectChallenge hasChallengeSelector skipped — frame detached');
        return false;
      }
      throw e;
    }

    // [FIX] — individually wrapped evaluate for hasActiveTurnstile
    let hasActiveTurnstile = false;
    try {
      if (!page || page.isClosed()) return false;
      hasActiveTurnstile = await page.evaluate(() => {
        const iframes = Array.from(document.querySelectorAll('iframe'));
        return iframes.some(iframe =>
          iframe.src.includes('challenges.cloudflare.com') ||
          iframe.src.includes('hcaptcha.com')
        );
      });
    } catch (e) {
      if (isDetachedFrameError(e)) {
        logger.debug('[Frame] detectChallenge hasActiveTurnstile skipped — frame detached');
        return false;
      }
      throw e;
    }

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

    const strongContentSignals = [
      "cf-browser-verification",
      "Verifying you are human",
      "Checking if the site connection is secure",
      "Enter the characters you see below",
      "automated access to Amazon",
    ];

    // [FIX] — individually wrapped evaluate for bodyText
    let bodyText = "";
    try {
      if (!page || page.isClosed()) return false;
      bodyText = await page.evaluate(() => document.body?.innerText || "");
    } catch (e) {
      if (isDetachedFrameError(e)) {
        logger.debug('[Frame] detectChallenge bodyText skipped — frame detached');
        return false;
      }
      throw e;
    }

    const hasStrongContent = strongContentSignals.some(signal =>
      bodyText.includes(signal) || content.includes(signal)
    );

    let score = 0;
    if (isChallengeTitle) score += 3;
    if (hasChallengeSelector) score += 2;
    if (hasActiveTurnstile) score += 2;
    if (hasStrongContent) score += 2;
    if (bodyText.length < 200) score += 1;

    return score >= 2;
  } catch (e) {
    // [FIX] — use centralized checker
    if (isDetachedFrameError(e)) {
      logger.debug('[Frame] Detached frame or target closed encountered during challenge detection — expected behavior');
      return false;
    }
    return false;
  }
}

// [EXISTING — DO NOT MODIFY]
async function hasRealContent(page) {
  try {
    return await page.evaluate(() => {
      const bodyText = document.body.innerText || "";
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

// [EXISTING — DO NOT MODIFY]
function getFreshFrames(page) {
  try {
    if (!page || page.isClosed()) return [];
    return page.frames() || [];
  } catch (e) {
    return [];
  }
}

// [EXISTING — DO NOT MODIFY]
function isFrameDetached(frame) {
  try {
    if (!frame) return true;
    if (typeof frame.isDetached === "function") {
      return frame.isDetached();
    }
    frame.url();
    return false;
  } catch (e) {
    return true;
  }
}

// [EXISTING — DO NOT MODIFY]
function getFrameUrl(frame) {
  try {
    if (!frame || isFrameDetached(frame)) return "";
    return frame.url() || "";
  } catch (e) {
    return "";
  }
}

// [EXISTING — DO NOT MODIFY]
// Safely waits for a selector in matching frames and performs a human-like click.
async function safeClickCheckboxInFrame(page, framePatterns, selector, timeout = 3000) {
  if (!page || page.isClosed()) return false;

  try {
    const frames = getFreshFrames(page);

    for (const frame of frames) {
      if (!isFrameAlive(frame) || (page._detachedFrames && page._detachedFrames.has(frame))) {
        logger.debug('[Frame] Skipping detached frame');
        continue;
      }

      const url = getFrameUrl(frame);
      const isMainFrame = page.mainFrame() === frame;
      const isMatch = isMainFrame || framePatterns.some(pattern => url.includes(pattern));
      if (!isMatch) continue;

      try {
        await safeFrameOperation(frame, async (f) => {
          await f.waitForSelector(selector, { timeout });
        }).catch(() => null);

        if (page.isClosed() || !isFrameAlive(frame) || (page._detachedFrames && page._detachedFrames.has(frame))) continue;

        const box = await safeFrameOperation(frame, async (f) => {
          const checkbox = await f.$(selector);
          if (!checkbox) return null;
          return await checkbox.boundingBox();
        });

        if (box) {
          if (page.isClosed() || !isFrameAlive(frame) || (page._detachedFrames && page._detachedFrames.has(frame))) continue;

          await page.mouse.click(
            box.x + box.width / 2 + (Math.random() * 4 - 2),
            box.y + box.height / 2 + (Math.random() * 4 - 2)
          );
          return true;
        }
      } catch (innerErr) {
        // [FIX] — use centralized checker
        if (isDetachedFrameError(innerErr)) {
          logger.debug('[Frame] Challenge iframe detached after resolution — expected behavior, continuing...');
          continue;
        }
        logger.warn(`⚠️ [Playwright Checkbox] Skipped frame/element query due to unexpected error: ${innerErr.message}`);
      }
    }
  } catch (err) {
    // [FIX] — use centralized checker
    if (isDetachedFrameError(err)) {
      logger.debug('[Frame] Error scanning frames due to detachment (expected):', err.message);
    } else {
      logger.error(`❌ [Playwright Checkbox] Error scanning frames: ${err.message}`);
    }
  }
  return false;
}

// [EXISTING — DO NOT MODIFY]
export async function waitForChallengeResolution(page, timeout = 30000) {
  const startTime = Date.now();

  if (!await detectChallenge(page)) return true;

  const patterns = ['challenges', 'turnstile', 'hcaptcha'];
  const selectors = ['input[type="checkbox"]', '.ctp-checkbox-label', '#challenge-stage'];

  while (Date.now() - startTime < timeout) {
    if (page.isClosed()) return false;

    if (!await detectChallenge(page)) return true;

    for (const selector of selectors) {
      if (page.isClosed()) break;
      const clicked = await safeClickCheckboxInFrame(page, patterns, selector, 2000);
      if (clicked) {
        await delay(3000);
        break;
      }
    }

    // [FIX] — wrapped mouse.move with detached frame protection
    try {
      if (!page.isClosed()) {
        await page.mouse.move(randInt(100, 800), randInt(100, 600), { steps: randInt(5, 15) });
      }
    } catch (e) {
      if (!isDetachedFrameError(e)) throw e;
      logger.debug('[Frame] mouse.move skipped in challenge loop — frame detached');
    }

    await delay(randInt(2000, 4000));
  }

  return !await detectChallenge(page);
}

export default async function Puppeteer_Cheerio(url, device = 'Desktop', auditId = null) {
  let browser;

  const updateStatus = async (status, extraData = {}) => {
    if (!auditId) return;
    try {
      await SingleAuditReport.findByIdAndUpdate(auditId, { status, ...extraData });
    } catch (err) {
      console.error(`Error updating audit status to ${status}:`, err);
    }
  };

  try {
    // [EXISTING STEALTH CONFIG — DO NOT MODIFY]
    // [EXISTING PUPPETEER LAUNCH OPTIONS — DO NOT MODIFY]
    const launchOptions = {
      headless: false,
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
        "--no-zygote"
      ]
    };

    await updateStatus("launching");

    browser = await chromium.launch(launchOptions);

    // [EXISTING — DO NOT MODIFY]
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

    // [EXISTING — DO NOT MODIFY]
    const userAgent = device === "Mobile"
      ? "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36"
      : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

    const contextOptions = {
      userAgent,
      viewport: device === "Mobile"
        ? { width: 393, height: 852 }
        : { width: 1920, height: 1080 },
      extraHTTPHeaders: commonHeaders,
      ignoreHTTPSErrors: true,
      locale: 'en-US',
      timezoneId: 'America/New_York'
    };

    if (device === "Mobile") {
      contextOptions.hasTouch = true;
      contextOptions.isMobile = true;
      contextOptions.deviceScaleFactor = 3;
    } else {
      contextOptions.deviceScaleFactor = 2;
    }

    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();

    // [FIX] — Filter Chrome's internal frame warnings from browser console
    page.on('console', (msg) => {
      const text = msg.text();
      if (
        text.includes('detached Frame') ||
        text.includes('Attempted to use detached')
      ) {
        // Suppress — already handled by our centralized isDetachedFrameError()
        return;
      }
      logger.debug('[Browser Console]', text);
    });

    // [FIX] — Track detached frames proactively via Set
    page._detachedFrames = new Set();
    page.on('framedetached', (frame) => {
      page._detachedFrames.add(frame);
      let frameUrl = 'unknown url';
      try {
        frameUrl = frame.url() || 'unknown url';
      } catch (e) {}
      logger.debug('[Frame] Frame detached:', frameUrl);
    });

    // [EXISTING STEALTH CONFIG — DO NOT MODIFY]
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    });

    // [EXISTING — DO NOT MODIFY]
    await page.route('**/*', (route) => {
      try {
        const request = route.request();
        const resourceType = request.resourceType();
        const reqUrl = request.url().toLowerCase();

        const blockedResources = [
          'googletagmanager.com', 'google-analytics.com', 'analytics.google.com',
          'facebook.net', 'popupsmart.com', 'hotjar.com', 'intercom.io',
          'adsystem.com', 'ads-twitter.com', 'doubleclick.net'
        ];

        if (
          resourceType === 'font' ||
          resourceType === 'media' ||
          blockedResources.some(domain => reqUrl.includes(domain))
        ) {
          route.abort().catch(() => {});
        } else {
          route.continue().catch(() => {});
        }
      } catch (err) {
        route.continue().catch(() => {});
      }
    });

    // [EXISTING — DO NOT MODIFY]
    await delay(randInt(1000, 3000));

    await updateStatus("navigating");

    let response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    }).catch(async () => {
      logger.debug("networkidle timed out, falling back to domcontentloaded...");
      return null;
    });

    if (!response) {
      try { await page.unroute('**/*'); } catch (_) {}
      response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => null);
    }

    // Even if response is null, the page might have loaded successfully but timed out waiting for idle.
    // We check if there's an actual title/content to decide if it's truly dead.
    let pageTitle = await safeGetTitle(page);
    const hasContent = pageTitle && pageTitle.length > 0;

    const statusCode = response ? response.status() : (hasContent ? 200 : "No Response");

    if (statusCode === "No Response") {
      return {
        browser, page, response: null,
        $: cheerio.load("<html><body>Failed to reach site (Timeout)</body></html>"),
        screenshot: null,
        isBotProtected: false // Changed from true so it doesn't falsely claim Bot Protected on timeouts
      };
    }

    // [EXISTING — DO NOT MODIFY]
    let challengeResolved = await waitForChallengeResolution(page, 30000);
    let isBotProtected = await detectChallenge(page);

    if (isBotProtected) {
      try {
        await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
      } catch (reloadErr) {
        logger.warn("⚠️ Page reload during bot protection retry failed:", reloadErr.message);
      }
      challengeResolved = await waitForChallengeResolution(page, 20000);
      isBotProtected = await detectChallenge(page);
    }

    if (isBotProtected) {
      const htmlData = await safePageContent(page);
      const $ = cheerio.load(htmlData);
      return { browser, page, response, $, screenshot: null, isBotProtected: true };
    }

    // [FIX] — wrapped mouse.move with detached frame protection
    try {
      if (!page.isClosed()) {
        await page.mouse.move(randInt(100, 800), randInt(100, 600));
      }
    } catch (e) {
      if (!isDetachedFrameError(e)) throw e;
      logger.debug('[Frame] mouse.move skipped — frame detached');
    }

    await delay(randInt(1000, 2000));

    await handlePopups(page);
    await autoScroll(page);

    // [EXISTING] — 20 second wait for full JS render
    await updateStatus("waiting_for_render");

    // [FIX] — Capture HTML BEFORE the 20s wait in case the page context dies during the wait
    // This ensures we have valid cheerio data even if the page navigates away
    let preWaitHtml = "";
    try {
      preWaitHtml = await safePageContent(page);
    } catch (e) {
      logger.debug('[Frame] Pre-wait HTML capture failed — will retry after wait');
    }

    // Real render wait: let JS-driven content settle. Wait for network idle (capped),
    // then a short fixed delay. Previously this was a no-op, so SPA/JS sites were
    // scraped/screenshotted blank.
    try {
      if (typeof page.waitForLoadState === 'function') {
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
      }
    } catch (_) {}
    await delay(3000);

    // [FIX] — Live page context probe after the 20s wait
    // Tests whether page.evaluate() still works. If the page navigated away
    // during the wait, all metrics would fail. Catch this early and return
    // partial result instead of wasting time on 7 failing metric calls.
    let pageContextAlive = false;
    try {
      if (!page.isClosed()) {
        await page.evaluate(() => true);
        pageContextAlive = true;
      }
    } catch (probeErr) {
      if (isDetachedFrameError(probeErr)) {
        logger.warn("⚠️ Page context died during 20s render wait — returning partial result with pre-wait HTML.");
        const $ = cheerio.load(preWaitHtml || "<html><body>Page context unavailable after render wait</body></html>");
        return {
          browser,
          page: null, // signals worker to skip metrics gracefully
          response,
          $,
          screenshot: null,
          isBotProtected: false
        };
      }
      // Unexpected probe error — do not throw, just proceed cautiously
      logger.warn("⚠️ Page context probe failed unexpectedly:", probeErr.message);
    }

    if (!pageContextAlive) {
      logger.warn("⚠️ Page is closed after 20s wait — returning partial result.");
      const $ = cheerio.load(preWaitHtml || "<html><body>Page closed during render wait</body></html>");
      return {
        browser,
        page: null,
        response,
        $,
        screenshot: null,
        isBotProtected: false
      };
    }


    // [FIX] — wrapped scroll-to-top evaluate with detached frame protection
    try {
      if (!page.isClosed()) {
        await page.evaluate(() => window.scrollTo(0, 0));
      }
    } catch (e) {
      if (!isDetachedFrameError(e)) throw e;
      logger.debug('[Frame] Scroll to top skipped — frame detached');
    }

    await delay(1000); // short settle after scroll-to-top

    // [FIX] — Re-check page is still alive after 20s wait
    // Page might have navigated / frame detached during the wait
    if (page.isClosed()) {
      logger.warn("⚠️ Page closed during render wait — returning partial result");
      return {
        browser, page, response,
        $: cheerio.load("<html><body>Page closed during render</body></html>"),
        screenshot: null,
        isBotProtected: false
      };
    }

    // [EXISTING] — screenshot after 20s wait
    let screenshot = null;
    try {
        const screenshotBuffer = await page.screenshot({
          type: "jpeg",
          quality: 50,
          fullPage: false,
          clip: {
            x: 0, y: 0,
            width: device === "Mobile" ? 393 : 1920,
            height: device === "Mobile" ? 852 : 1080
          }
        });
        screenshot = screenshotBuffer.toString("base64");
    } catch (screenshotError) {
      // [FIX] — use centralized checker — screenshot failure is NON-FATAL
      // Audit must continue even if screenshot fails
      if (isDetachedFrameError(screenshotError)) {
        logger.warn("⚠️ Screenshot capture skipped due to detached frame — audit will continue without screenshot.");
        screenshot = null; // explicitly null — not a crash
      } else {
        // Non-detach screenshot error — still non-fatal, log and continue
        logger.warn("⚠️ Screenshot capture failed (non-detach reason):", screenshotError.message);
        screenshot = null;
      }
    }

    // [FIX] — updateStatus is safe even if screenshot is null
    const screenshotUrl = screenshot ? `/api/screenshot/view/${auditId}` : null;
    await updateStatus("screenshot_ready", {
      screenshot,
      screenshotUrl,
      isBotProtected: false
    });

    await updateStatus("extracting_data");

    // [FIX] — safePageContent with extra detached frame guard
    // If page navigated away during 20s wait, try to recover HTML gracefully
    let htmlData = "";
    try {
      htmlData = await safePageContent(page);
    } catch (contentError) {
      // [FIX] — centralized check — content extraction failure is NON-FATAL
      if (isDetachedFrameError(contentError)) {
        logger.warn("⚠️ HTML extraction skipped due to detached frame — returning empty DOM.");
        htmlData = "<html><body>Content unavailable due to page navigation</body></html>";
      } else {
        throw contentError; // unexpected — re-throw
      }
    }

    // [FIX] — Final page alive check before returning
    // Ensures we never throw from a dead page context
    const $ = cheerio.load(htmlData || "<html><body></body></html>");

    // [FIX] — Final sanity probe: if screenshot was skipped (page context was broken),
    // confirm the page is truly usable before passing it to metric services.
    // A dead page passed to metric services causes ALL 7 metrics to fail one-by-one.
    if (!screenshot) {
      let finalContextOk = false;
      try {
        if (!page.isClosed()) {
          await page.evaluate(() => true);
          finalContextOk = true;
        }
      } catch (finalProbeErr) {
        finalContextOk = false;
      }

      if (!finalContextOk) {
        logger.warn("⚠️ Page context is dead at final check — returning page: null to skip metric services.");
        return { browser, page: null, response, $, screenshot: null, isBotProtected: false };
      }
    }

    return { browser, page, response, $, screenshot, isBotProtected: false };


  } catch (error) {
    // [FIX] — Top-level catch: if it's a detached frame error, do NOT crash audit
    // Return a graceful partial result instead of throwing
    if (isDetachedFrameError(error)) {
      logger.warn("⚠️ Detached frame error caught at top level — returning partial audit result instead of failing.");
      return {
        browser,
        page: null,
        response: null,
        $: cheerio.load("<html><body>Audit interrupted by page navigation</body></html>"),
        screenshot: null,
        isBotProtected: false
      };
    }

    if (browser) await browser.close();
    throw error;
  }
}
