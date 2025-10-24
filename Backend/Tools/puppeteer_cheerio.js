import puppeteer from "puppeteer";
import * as cheerio from "cheerio";

export default async function Puppeteer_Cheerio(url, device = 'Desktop') {
let browser;

  try {
      browser = await puppeteer.launch({
      headless: true,
      defaultViewport: null,
      args: ["--no-sandbox", "--disable-setuid-sandbox","--start-maximized"]
  });

  const page = await browser.newPage();

  if (device === "Mobile") {

      await page.setViewport({
        width: 414,    
        height: 896,   
        isMobile: true,
        deviceScaleFactor: 2.5, 
        hasTouch: true,
        isLandscape: false,
      });

      await page.setUserAgent(
        "Mozilla/5.0 (Linux; Android 11; Mobile; rv:109.0) " +
        "Gecko/109.0 Firefox/109.0"
      );

    } else {
      await page.setUserAgent(
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/140.0.0.0 Safari/537.36"
      );
    }
     
  await page.setExtraHTTPHeaders({ "Accept-Language": "en-US,en;q=0.9" });
  const response = await page.goto(url, { waitUntil: "networkidle2",timeout: 360000 }); // 6 minutes
  await page.waitForSelector("body", { timeout: 360000 }); // 6 minutes

  const htmlData = await page.content();
  const $ = cheerio.load(htmlData);

  return {browser,page,response,$}; 

  } catch (error) {
    if (browser) await browser.close();
    console.error("Error fetching Puppeteer_Cheerio data:", error);
    res.status(500).json({ success: false, error: "Failed to fetch Puppeteer_Cheerio API data" });
    return null;
  }
}
