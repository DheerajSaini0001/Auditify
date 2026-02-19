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

// Detects if the page is currently showing a Cloudflare/Browser Challenge
async function detectChallenge(page) {
  const title = await page.title();
  const content = await page.content();
  return (
    title.includes("Just a moment...") ||
    title.includes("Attention Required! | Cloudflare") ||
    content.includes("cf-browser-verification") ||
    content.includes("cf-challenge")
  );
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
        "--mute-audio"
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

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Referer": "https://www.google.com/",
      "Upgrade-Insecure-Requests": "1"
    });

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // Continuous Check for Cloudflare/WAF Challenges
    if (await detectChallenge(page)) {
      console.log("⚠️ Challenge detected, waiting for resolution...");
      // Wait longer for Challenges to pass (automatic in many cases with Stealth plugin)
      await page.waitForNavigation({ waitUntil: "networkidle2", timeout: 45000 }).catch(() => { });
    } else {
      // Standard wait for initial network activity to settle
      try {
        await page.waitForNetworkIdle({ idleTime: 1000, timeout: 15000 });
      } catch (e) {
        // If network idle fails, we continue anyway as the page might have persistent connections
      }
    }

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
