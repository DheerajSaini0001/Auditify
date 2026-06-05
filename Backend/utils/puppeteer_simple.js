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

    // Random delay before navigation to mimic human behavior (was a no-op)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.floor(Math.random() * 1500)));

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
