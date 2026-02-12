import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

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
        "--no-first-run",
        "--no-zygote",
        "--single-process", // Important for Render
        "--start-maximized"
      ]
    };

    // Check if PUPPETEER_EXECUTABLE_PATH is set (from Render environment variables)
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
      console.log(`Using Chrome from PUPPETEER_EXECUTABLE_PATH: ${process.env.PUPPETEER_EXECUTABLE_PATH}`);
    }

    // Try to use Puppeteer's default Chrome first
    try {
      browser = await puppeteer.launch(launchOptions);
    } catch (error) {
      // If default fails, try to find Chrome manually
      console.error('Failed to launch with default settings:', error.message);

      // Try common Chrome locations on Linux
      const chromePaths = [
        '/opt/render/.cache/puppeteer/chrome/linux-140.0.7339.82/chrome-linux64/chrome',
        '/usr/bin/google-chrome-stable',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
      ];

      for (const chromePath of chromePaths) {
        try {
          const { existsSync } = await import('fs');
          if (existsSync(chromePath)) {
            console.log(`Trying Chrome at: ${chromePath}`);
            launchOptions.executablePath = chromePath;
            browser = await puppeteer.launch(launchOptions);
            console.log(`✅ Successfully launched Chrome from: ${chromePath}`);
            break;
          }
        } catch (pathError) {
          console.log(`Failed with ${chromePath}:`, pathError.message);
          continue;
        }
      }

      if (!browser) {
        throw new Error('Could not find Chrome in any known location');
      }
    }

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
