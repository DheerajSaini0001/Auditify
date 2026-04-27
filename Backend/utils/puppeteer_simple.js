import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Stealth modules
import { applyStealthToPage, STEALTH_CHROME_ARGS, PROFILES } from "./stealth/stealthLauncher.js";
import { mouseJiggle } from "./stealth/humanBehavior.js";

puppeteer.use(StealthPlugin());

/**
 * Lightweight Puppeteer fetcher for discovery and simple tasks
 * Bypasses basic WAF and challenge pages without the overhead of full auditing
 */
export default async function Puppeteer_Simple(url) {
  let browser;
  try {
    const profile = PROFILES.desktop;

    browser = await puppeteer.launch({
      headless: true,
      args: [
        ...STEALTH_CHROME_ARGS,
        `--window-size=${profile.viewport.width},${profile.viewport.height}`,
      ],
      env: {
        ...process.env,
        TZ: "America/New_York",
      },
    });
    const page = await browser.newPage();

    // ═══ Apply all stealth patches ═══
    await applyStealthToPage(page, "desktop");

    // Random delay before navigation to mimic human behavior
    await new Promise(resolve => setTimeout(resolve, Math.floor(Math.random() * 1500) + 500));

    console.log(`🔍 [Simple] Navigating to: ${url}`);
    const response = await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 60000
    });

    // Post-navigation mouse jiggle
    await mouseJiggle(page);

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
