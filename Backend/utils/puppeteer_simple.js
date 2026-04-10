import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

/**
 * Lightweight Puppeteer fetcher for discovery and simple tasks
 * Bypasses basic WAF and challenge pages without the overhead of full auditing
 */
export default async function Puppeteer_Simple(url) {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    });
    const page = await browser.newPage();
    
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36");
    
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://www.google.com/"
    });

    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // Integrated robust challenge handling
    const { detectChallenge, waitForChallengeResolution } = await import('./puppeteer_cheerio.js');
    const isChallenged = await detectChallenge(page);
    
    if (isChallenged) {
       console.log("🛡️ Challenge detected in Simple Puppeteer, waiting...");
       await waitForChallengeResolution(page, 45000);
    }

    const html = await page.content();
    return { html, status: response?.status() || 200, browser };
  } catch (error) {
    if (browser) await browser.close();
    throw error;
  }
}
