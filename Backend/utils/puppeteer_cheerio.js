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
      console.log('✅ Successfully launched Chrome with default settings');
    } catch (error) {
      // If default fails, try to find Chrome manually
      console.error('Failed to launch with default settings:', error.message);

      // Function to recursively search for Chrome executable
      const findChromeExecutable = async (baseDir) => {
        const { readdirSync, statSync, existsSync } = await import('fs');
        const { join } = await import('path');

        if (!existsSync(baseDir)) {
          console.log(`Directory does not exist: ${baseDir}`);
          return null;
        }

        console.log(`Searching for Chrome in: ${baseDir}`);

        try {
          const searchDirs = (dir, depth = 0) => {
            if (depth > 5) return null; // Limit recursion depth

            try {
              const items = readdirSync(dir);

              for (const item of items) {
                const fullPath = join(dir, item);

                try {
                  const stat = statSync(fullPath);

                  // Check if it's the chrome executable
                  if (item === 'chrome' && !stat.isDirectory()) {
                    console.log(`Found Chrome executable: ${fullPath}`);
                    return fullPath;
                  }

                  // Recursively search subdirectories
                  if (stat.isDirectory() && !item.startsWith('.')) {
                    const found = searchDirs(fullPath, depth + 1);
                    if (found) return found;
                  }
                } catch (err) {
                  // Skip files we can't access
                  continue;
                }
              }
            } catch (err) {
              console.log(`Cannot read directory ${dir}:`, err.message);
            }

            return null;
          };

          return searchDirs(baseDir);
        } catch (err) {
          console.error(`Error searching ${baseDir}:`, err.message);
          return null;
        }
      };

      // Try to find Chrome in Puppeteer's cache
      let chromePath = await findChromeExecutable('/opt/render/.cache/puppeteer');

      if (!chromePath) {
        // Try other common locations
        const commonPaths = [
          '/usr/bin/google-chrome-stable',
          '/usr/bin/google-chrome',
          '/usr/bin/chromium-browser',
          '/usr/bin/chromium',
        ];

        const { existsSync } = await import('fs');
        for (const path of commonPaths) {
          if (existsSync(path)) {
            chromePath = path;
            console.log(`Found Chrome at: ${chromePath}`);
            break;
          }
        }
      }

      if (chromePath) {
        console.log(`Attempting to launch Chrome from: ${chromePath}`);
        launchOptions.executablePath = chromePath;
        browser = await puppeteer.launch(launchOptions);
        console.log(`✅ Successfully launched Chrome from: ${chromePath}`);
      } else {
        throw new Error('Could not find Chrome executable in any known location. Please set PUPPETEER_EXECUTABLE_PATH environment variable.');
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
