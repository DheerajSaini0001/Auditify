import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as cheerio from "cheerio";

puppeteer.use(StealthPlugin());

const autoScroll = async (page) => {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight - window.innerHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
};

export default async function Puppeteer_Cheerio(url, device = 'Desktop') {
  let browser;

  try {
    const isHeadless = process.env.SHOW_BROWSER === "true" ? false : "new";

    // Launch configuration with optimal settings for stealth and performance
    const launchOptions = {
      headless: isHeadless,
      defaultViewport: null,
      ignoreDefaultArgs: ["--enable-automation"],
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--disable-blink-features=AutomationControlled",
        "--window-size=1920,1080",
        "--disable-infobars"
      ]
    };

    browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    const context = browser.defaultBrowserContext();
    await context.overridePermissions(url, ['geolocation', 'notifications']);

    if (device === "Mobile") {
      await page.setViewport({
        width: 390,
        height: 844,
        isMobile: true,
        deviceScaleFactor: 3,
        hasTouch: true,
        isLandscape: false,
      });

      await page.setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) " +
        "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
      );
    } else {
      await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/120.0.0.0 Safari/537.36"
      );
    }

    await page.setExtraHTTPHeaders({
      "Accept-Language": "en-US,en;q=0.9",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
      "Accept-Encoding": "gzip, deflate, br",
      "Cache-Control": "max-age=0",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1"
    });

    console.log(`[Puppeteer] Navigating to: ${url}`);
    const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 120000 });

    // Handle bot protections (Cloudflare/CAPTCHA)
    try {
      console.log("[Puppeteer] Checking for bot protection...");

      if (device !== "Mobile") {
        await page.mouse.move(100, 100);
        await page.mouse.move(200, 200, { steps: 10 });
        await page.mouse.move(150, 300, { steps: 20 });
      }

      await page.waitForFunction(
        () => {
          const text = document.body.innerText;
          const challenges = [
            "Verifying you are human", "Checking your browser", "Just a moment...",
            "DDoS protection", "Security check"
          ];
          return !challenges.some(c => text.includes(c));
        },
        { timeout: 45000, polling: 1000 }
      );
    } catch (e) {
      const blocked = await page.evaluate(() => document.body.innerText.includes("Verifying you are human"));
      if (blocked) {
        throw new Error("Bot protection (Cloudflare/CAPTCHA) could not be bypassed. Audit aborted.");
      }
      console.warn("[Puppeteer] Wait for bot check timed out, but proceeding as content seems available.");
    }

    // Auto-scroll to trigger lazy loading
    console.log("[Puppeteer] Auto-scrolling...");
    try {
      await autoScroll(page);
    } catch (e) {
      console.warn("[Puppeteer] Auto-scroll error (continuing):", e.message);
    }

    await new Promise(r => setTimeout(r, 2000));

    // Reset view to top for screenshot
    console.log("[Puppeteer] Scrolling back to top...");
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 1000));

    await page.waitForSelector("body", { timeout: 30000 });

    const htmlData = await page.content();
    const $ = cheerio.load(htmlData);

    return { browser, page, response, $ };

  } catch (error) {
    if (browser) await browser.close();
    console.error("Error fetching Puppeteer_Cheerio data:", error);
    throw error;
  }
}
