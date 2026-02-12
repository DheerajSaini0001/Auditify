import puppeteer from "puppeteer";
import * as cheerio from "cheerio";
import { existsSync, readdirSync } from "fs";
import { join } from "path";

export default async function Puppeteer_Cheerio(url, device = 'Desktop') {
  let browser;

  try {
    // Configure launch options
    const launchOptions = {
      headless: true,
      defaultViewport: null,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",  // Critical for cloud environments
        "--disable-gpu",
        "--start-maximized"
      ]
    };

    // On Render, find Chrome in the cache directory
    if (process.env.RENDER) {
      const cacheDir = '/opt/render/.cache/puppeteer/chrome';

      if (existsSync(cacheDir)) {
        try {
          // Find the Chrome version directory (e.g., linux-140.0.7339.82)
          const versions = readdirSync(cacheDir);
          if (versions.length > 0) {
            // Use the first (and likely only) version found
            const chromeVersion = versions[0];
            const executablePath = join(cacheDir, chromeVersion, 'chrome-linux64', 'chrome');

            if (existsSync(executablePath)) {
              launchOptions.executablePath = executablePath;
              console.log(`✅ Using Chrome at: ${executablePath}`);
            } else {
              console.warn(`⚠️ Chrome executable not found at: ${executablePath}`);
            }
          }
        } catch (err) {
          console.error('Error finding Chrome:', err.message);
        }
      }
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    if (device === "Mobile") {

      await page.setViewport({
        width: 390, // iPhone 13/14 base width
        height: 844,
        isMobile: true,
        deviceScaleFactor: 3, // Higher density for sharper screenshot
        hasTouch: true,
        isLandscape: false,
      });

      await page.setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) " +
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
      );

    } else {
      await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 }); // High DPI Desktop
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/120.0.0.0 Safari/537.36"
      );
    }

    await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
    const response = await page.goto(url, { waitUntil: "networkidle2", timeout: 360000 }); // 6 minutes
    await page.waitForSelector("body", { timeout: 360000 }); // 6 minutes

    const htmlData = await page.content();
    const $ = cheerio.load(htmlData);

    return { browser, page, response, $ };

  } catch (error) {
    if (browser) await browser.close();
    console.error("Error fetching Puppeteer_Cheerio data:", error);
    throw error;
  }
}
