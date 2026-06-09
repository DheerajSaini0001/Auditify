import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

chromium.use(StealthPlugin());

/**
 * Lightweight Playwright fetcher for discovery and simple tasks
 * Bypasses basic WAF and challenge pages without the overhead of full auditing
 */
export default async function Puppeteer_Simple(url) {
  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: [
        "--no-sandbox", 
        "--disable-setuid-sandbox", 
        "--disable-dev-shm-usage",
        "--disable-blink-features=AutomationControlled"
      ]
    });
    
    const context = await browser.newContext({
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/"
      }
    });
    const page = await context.newPage();

    // [NEW] — Advanced bot-bypass stealth evasions (mirrors the audit scraper) so
    // the pre-check can pass Cloudflare/Turnstile and classify the real site.
    await page.addInitScript(() => {
      const safe = (fn) => { try { fn(); } catch (_) { } };
      safe(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
      safe(() => Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] }));
      safe(() => Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] }));
      safe(() => Object.defineProperty(navigator, 'platform', { get: () => 'Win32' }));
      safe(() => Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' }));
      safe(() => { if (!window.chrome) window.chrome = { runtime: {}, app: {}, csi: function () { }, loadTimes: function () { } }; });
      safe(() => {
        const oq = window.navigator.permissions && window.navigator.permissions.query;
        if (oq) window.navigator.permissions.query = (p) => p && p.name === 'notifications' ? Promise.resolve({ state: Notification.permission }) : oq(p);
      });
      safe(() => {
        const spoof = (proto) => {
          if (!proto) return;
          const gp = proto.getParameter;
          proto.getParameter = function (p) {
            if (p === 37445) return 'Intel Inc.';
            if (p === 37446) return 'Intel Iris OpenGL Engine';
            return gp.apply(this, [p]);
          };
        };
        spoof(window.WebGLRenderingContext && window.WebGLRenderingContext.prototype);
        spoof(window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype);
      });
    });

    // Random delay before navigation to mimic human behavior
    await new Promise(resolve => resolve());

    console.log(`🔍 [Simple] Navigating to: ${url}`);
    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    // Integrated robust challenge handling
    const { detectChallenge, waitForChallengeResolution } = await import('./puppeteer_cheerio.js');
    const isChallenged = await detectChallenge(page);
    
    if (isChallenged) {
       console.log("🛡️ [Simple] Challenge detected, waiting for resolution...");
       await waitForChallengeResolution(page, 50000);
    }

    const html = await page.content();
    const status = response?.status() || 200;
    
    return { html, status, browser };
  } catch (error) {
    if (browser) await browser.close();
    console.error(`❌ [Simple] Error for ${url}:`, error.message);
    throw error;
  }
}
