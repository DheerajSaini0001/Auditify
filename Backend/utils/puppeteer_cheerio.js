import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as cheerio from "cheerio";

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

export default async function Puppeteer_Cheerio(url, device = 'Desktop') {
  let browser;

  try {
    // Configure launch options for cloud environments
    const launchOptions = {
      headless: true,
      defaultViewport: null,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        // "--no-zygote",
        // "--single-process",
        "--start-maximized"
      ]
    };

    // Launch browser (Chrome location is configured in .puppeteerrc.cjs)
    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    if (device === "Mobile") {
      await page.setViewport({
        width: 393, // Modern industry standard (iPhone 15/16 Pro)
        height: 852,
        isMobile: true,
        deviceScaleFactor: 3, // Retina display quality
        hasTouch: true,
        isLandscape: false,
      });

      await page.setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) " +
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"
      );

    } else {
      await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 }); // Full HD Standard Desktop
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/125.0.0.0 Safari/537.36"
      );
    }

    // Set realistic headers to avoid bot detection
    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1"
    });

    const response = await page.goto(url, { waitUntil: "networkidle2", timeout: 360000 }); // 6 minutes
    await page.waitForSelector("body", { timeout: 360000 }); // 6 minutes

    const screenshot = await page.screenshot({
      encoding: "base64",
      type: "jpeg",
      quality: 50,
      fullPage: false
    });

    const htmlData = await page.content();
    const $ = cheerio.load(htmlData);

    return { browser, page, response, $, screenshot };

  } catch (error) {
    if (browser) await browser.close();
    console.error("Error fetching Puppeteer_Cheerio data:", error);
    throw error;
  }
}
