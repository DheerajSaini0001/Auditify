// ============================================================
//  Puppeteer Stealth Scraper with IP Rotation
//  Run: node scraper.js
// ============================================================

import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Stealth modules
import { applyStealthToPage, STEALTH_CHROME_ARGS, PROFILES } from './utils/stealth/stealthLauncher.js';
import { humanMouseMove, humanDwell, mouseJiggle } from './utils/stealth/humanBehavior.js';

// Apply stealth plugin BEFORE any browser launch
puppeteer.use(StealthPlugin());

// ======================== CONFIG ============================

const PROXY_LIST = [
  // Add proxies here — format: http://user:pass@ip:port
  // Leave empty to connect directly without a proxy
];

const URLS = [
  'https://statewideautogroup.com.au',
];

const MAX_RETRIES = 2;

// ======================== HELPERS ===========================

/** Random integer between min and max (inclusive) */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Async delay */
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

/** Pick a random proxy, optionally excluding one that just failed. Returns null if no proxies configured. */
function pickProxy(exclude = null) {
  if (PROXY_LIST.length === 0) return null;

  const candidates = exclude
    ? PROXY_LIST.filter((p) => p !== exclude)
    : [...PROXY_LIST];

  if (candidates.length === 0) return null;
  return candidates[randInt(0, candidates.length - 1)];
}

// =================== BROWSER FACTORY ========================

/**
 * Launch a fresh browser instance routed through the given proxy.
 * Returns { browser, page }.
 */
async function launchBrowser(proxy = null) {
  const profile = PROFILES.desktop;
  const args = [
    ...STEALTH_CHROME_ARGS,
    `--window-size=${profile.viewport.width},${profile.viewport.height}`,
  ];
  if (proxy) args.unshift(`--proxy-server=${proxy}`);

  const browser = await puppeteer.launch({
    headless: true,
    args,
    env: {
      ...process.env,
      TZ: "America/New_York",
    },
  });

  const page = await browser.newPage();

  // ═══ Apply all stealth patches ═══
  await applyStealthToPage(page, "desktop");

  return { browser, page };
}

// ==================== SCRAPE SINGLE URL =====================

/**
 * Scrape a single URL with proxy rotation and retry logic.
 * @param {string} url — target URL
 * @returns {object} — { url, proxy_used, title, snippet, success, error? }
 */
async function scrapeUrl(url) {
  let lastProxy = null;

  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const proxy = pickProxy(lastProxy);
    lastProxy = proxy;
    let browser = null;

    try {
      console.log(
        `\n🌐 [Attempt ${attempt}] Scraping: ${url}\n   Proxy: ${proxy || 'DIRECT (no proxy)'}`
      );

      // Pre-navigation random delay (1–3 s)
      await delay(randInt(1000, 3000));

      const launched = await launchBrowser(proxy);
      browser = launched.browser;
      const page = launched.page;

      // Navigate
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Human-like bezier mouse movement
      await humanMouseMove(page, randInt(200, 800), randInt(100, 500));

      // Post-load dwell (reading time)
      await humanDwell(page, 1000, 3000);

      // Mouse jiggle for realism
      await mouseJiggle(page);

      // Extract data
      const title = await page.title();
      const snippet = await page.evaluate(() => {
        const body = document.body?.innerText || '';
        return body.substring(0, 500);
      });

      const result = { url, proxy_used: proxy, title, snippet, success: true };

      console.log(`✅ Success: ${title}`);
      console.log(`   Snippet: ${snippet.substring(0, 120)}…`);

      await browser.close();
      return result;
    } catch (err) {
      console.error(`❌ Failed (attempt ${attempt}): ${err.message}`);

      if (browser) {
        try { await browser.close(); } catch (_) { /* ignore */ }
      }

      // Exhausted all retries
      if (attempt > MAX_RETRIES) {
        return {
          url,
          proxy_used: proxy,
          title: null,
          snippet: null,
          success: false,
          error: err.message,
        };
      }

      console.log('   ↻ Retrying with a different proxy…');
    }
  }
}

// ========================= MAIN =============================

(async () => {
  console.log('═══════════════════════════════════════════');
  console.log('  Stealth Scraper — Starting');
  console.log(`  URLs to scrape : ${URLS.length}`);
  console.log(`  Proxies loaded : ${PROXY_LIST.length}`);
  console.log('═══════════════════════════════════════════');

  const results = [];

  for (const url of URLS) {
    const result = await scrapeUrl(url);
    results.push(result);

    // Rate-limit: wait 3–7 s between URL visits
    await delay(randInt(3000, 7000));
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('  All Results');
  console.log('═══════════════════════════════════════════');
  console.table(
    results.map(({ url, proxy_used, title, success, error }) => ({
      url,
      proxy_used,
      title: title || '—',
      success,
      error: error || '',
    }))
  );
})();
