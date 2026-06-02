# 🎭 Auditify: Puppeteer → Playwright Migration Prompt
## AI Agent Instructions (Zero Human Interaction)

---

## 🧠 ROLE & OBJECTIVE

You are an expert Node.js backend engineer. Your sole task is to **fully migrate the Auditify repository** (`https://github.com/DheerajSaini0001/Auditify`) from **Puppeteer (with puppeteer-extra stealth plugin)** to **Playwright** — with zero human prompting, zero confirmation dialogs, and zero manual steps.

You must:
1. Read and understand every file in `Backend/` before changing anything.
2. Replace ALL Puppeteer usage with idiomatic Playwright equivalents.
3. Preserve 100% of the existing functionality (audits, scraping, metrics, workers).
4. Write clean, well-commented code that clearly explains what each block does and why.
5. Never leave a `TODO`, `FIXME`, or placeholder — every replacement must be complete.

---

## 📁 REPO STRUCTURE (what you'll be working in)

```
Auditify/
├── Backend/
│   ├── Server.js                    ← Entry point
│   ├── controllers/                 ← Audit & report orchestration
│   ├── workers/                     ← Heavy-duty browser automation (PRIMARY FOCUS)
│   │   └── puppeteer.js             ← Main file to replace
│   ├── metricServices/              ← Logic for each of the 7 audit pillars
│   │   ├── technicalPerformance.js
│   │   ├── seo.js
│   │   ├── accessibility.js         ← Uses axe-core
│   │   ├── security.js
│   │   ├── ux.js
│   │   ├── aio.js
│   │   └── conversion.js
│   └── models/                      ← MongoDB schemas
├── package.json                     ← Root-level deps
└── Backend/package.json             ← Backend deps (Puppeteer lives here)
```

---

## 🔍 STEP 1 — AUDIT THE CODEBASE FIRST

Before writing a single line, **read every relevant file** using your file/code reading tools. Build a complete internal map of:

| What to find | Where to look |
|---|---|
| All `require('puppeteer')` or `require('puppeteer-extra')` imports | Every `.js` file in `Backend/` |
| All `puppeteer.launch(...)` calls | `workers/`, `metricServices/` |
| All `browser.newPage()` calls | Same as above |
| All `page.goto(url, options)` calls | Note `waitUntil` values |
| All `page.evaluate(...)` calls | Note return structures |
| All `page.waitForSelector(...)` calls | Note timeout values |
| All `page.waitForNavigation(...)` calls | Note `waitUntil` values |
| All `page.$eval(...)` / `page.$$eval(...)` | Note selectors + return types |
| All `page.screenshot(...)` calls | Note `fullPage`, `type`, `path` |
| All `page.pdf(...)` calls | Note options |
| All `page.setUserAgent(...)` calls | Note UA strings |
| All `page.setExtraHTTPHeaders(...)` | Note headers |
| All `page.setRequestInterception(...)` | Note what is blocked/allowed |
| All `page.on('request', ...)` handlers | Note abort patterns |
| All `page.on('response', ...)` handlers | Note what data is captured |
| All `page.on('console', ...)` handlers | Note what is logged |
| All `StealthPlugin` usage | Note which evasions are enabled |
| All `page.metrics()` calls | These do NOT exist in Playwright — see Step 4 |
| All `page.coverage.*` calls (JS/CSS coverage) | Playwright equivalent differs |
| All timeout configurations | Note global vs per-call |
| All `browser.close()` / `page.close()` cleanup | Must remain in finally blocks |
| All `try/catch` wrappers | Preserve all error handling |

---

## 📦 STEP 2 — DEPENDENCY CHANGES

### Remove (uninstall):
```bash
npm uninstall puppeteer puppeteer-extra puppeteer-extra-plugin-stealth
```

### Install (in `Backend/` directory):
```bash
npm install playwright playwright-extra playwright-extra-plugin-stealth
# Also install the Chromium browser binary:
npx playwright install chromium
```

### Update `Backend/package.json`:
- Remove: `"puppeteer"`, `"puppeteer-extra"`, `"puppeteer-extra-plugin-stealth"`
- Add: `"playwright": "^1.44.0"`, `"playwright-extra": "^4.3.6"`, `"playwright-extra-plugin-stealth": "^2.11.2"`

---

## 🔄 STEP 3 — CORE API MIGRATION TABLE

Apply every substitution below. Do NOT leave any Puppeteer imports or calls.

### 3a. Imports

```javascript
// ❌ BEFORE (Puppeteer)
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

// ✅ AFTER (Playwright)
const { chromium } = require('playwright-extra');
const StealthPlugin = require('playwright-extra-plugin-stealth');
chromium.use(StealthPlugin());
```

### 3b. Browser Launch

```javascript
// ❌ BEFORE
const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  executablePath: process.env.CHROMIUM_PATH || undefined,
});

// ✅ AFTER
const browser = await chromium.launch({
  headless: true,  // In Playwright: true = headless, false = headed (no 'new' keyword needed)
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  executablePath: process.env.CHROMIUM_PATH || undefined,
});
// NOTE: Playwright launches a persistent browser context; each test/run
// should create its own browser context for isolation.
```

### 3c. Page Creation (IMPORTANT DIFFERENCE)

```javascript
// ❌ BEFORE (Puppeteer: browser.newPage() creates a page in default context)
const page = await browser.newPage();

// ✅ AFTER (Playwright: always create a context first for proper isolation)
const context = await browser.newContext({
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ...',
  viewport: { width: 1366, height: 768 },
  // Playwright bakes in locale, timezone, permissions — set them here:
  locale: 'en-US',
  timezoneId: 'America/New_York',
});
const page = await context.newPage();
```

### 3d. Navigation

```javascript
// ❌ BEFORE
await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

// ✅ AFTER
// Playwright uses 'networkidle' (no number suffix)
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
// OR for faster loads (waits for DOMContentLoaded only):
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
// NOTE: Playwright's 'networkidle' = no network requests for 500ms (similar to Puppeteer's networkidle0)
```

### 3e. Waiting for Elements

```javascript
// ❌ BEFORE
await page.waitForSelector('.my-class', { timeout: 5000 });

// ✅ AFTER (same API, works identically)
await page.waitForSelector('.my-class', { timeout: 5000 });
// Playwright also supports:
await page.locator('.my-class').waitFor({ timeout: 5000 }); // preferred modern API
```

### 3f. Evaluate / DOM Access

```javascript
// ❌ BEFORE
const title = await page.evaluate(() => document.title);
const links = await page.$$eval('a', els => els.map(el => el.href));
const metaDesc = await page.$eval('meta[name="description"]', el => el.content);

// ✅ AFTER (identical — page.evaluate works the same in Playwright)
const title = await page.evaluate(() => document.title);
const links = await page.$$eval('a', els => els.map(el => el.href));
const metaDesc = await page.$eval('meta[name="description"]', el => el.content);
// NOTE: page.$eval and page.$$eval exist in Playwright — no change needed here.
```

### 3g. User Agent

```javascript
// ❌ BEFORE
await page.setUserAgent('Mozilla/5.0 ...');

// ✅ AFTER (set at context level — more reliable)
// Done in context creation (see 3c above). If you need page-level override:
// Playwright does NOT have page.setUserAgent(). Use context instead.
// If the codebase calls page.setUserAgent() anywhere, refactor to set it
// in browser.newContext({ userAgent: '...' }) and document this clearly.
```

### 3h. Extra HTTP Headers

```javascript
// ❌ BEFORE
await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });

// ✅ AFTER (identical API)
await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' });
// OR set in context:
const context = await browser.newContext({
  extraHTTPHeaders: { 'Accept-Language': 'en-US,en;q=0.9' }
});
```

### 3i. Request Interception

```javascript
// ❌ BEFORE (Puppeteer)
await page.setRequestInterception(true);
page.on('request', (req) => {
  if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
    req.abort();
  } else {
    req.continue();
  }
});

// ✅ AFTER (Playwright — completely different API, but same effect)
// Playwright uses route() instead of setRequestInterception
await page.route('**/*', (route) => {
  // Block images, CSS, and fonts to speed up audits
  const blockedTypes = ['image', 'stylesheet', 'font'];
  if (blockedTypes.includes(route.request().resourceType())) {
    route.abort(); // Block the request
  } else {
    route.continue(); // Allow everything else
  }
});
// NOTE: No need to call setRequestInterception(true) in Playwright.
// page.route() automatically intercepts. Always add a catch-all route.continue()
// for unmatched routes or use page.unroute() to clean up.
```

### 3j. Response Listener

```javascript
// ❌ BEFORE
page.on('response', async (response) => {
  if (response.url() === url && response.status() === 200) {
    const headers = response.headers();
    // capture headers for security audit
  }
});

// ✅ AFTER (identical event API)
page.on('response', async (response) => {
  if (response.url() === url && response.status() === 200) {
    const headers = response.headers(); // same method
    // capture headers for security audit
  }
});
// NOTE: Playwright's response API is nearly identical to Puppeteer's.
```

### 3k. Screenshots

```javascript
// ❌ BEFORE
await page.screenshot({ path: './screenshot.png', fullPage: true, type: 'png' });
const buffer = await page.screenshot({ encoding: 'base64' });

// ✅ AFTER (identical API)
await page.screenshot({ path: './screenshot.png', fullPage: true, type: 'png' });
const buffer = await page.screenshot({ type: 'png' }); // returns Buffer, not base64 string
// To get base64: buffer.toString('base64')
// NOTE: Playwright returns a Buffer by default. If the codebase uses encoding:'base64',
// replace with: (await page.screenshot()).toString('base64')
```

### 3l. PDF Generation

```javascript
// ❌ BEFORE
await page.pdf({ path: 'report.pdf', format: 'A4', printBackground: true });

// ✅ AFTER (identical API)
await page.pdf({ path: 'report.pdf', format: 'A4', printBackground: true });
// NOTE: PDF generation in Playwright requires headless: true (which we already set).
```

### 3m. Viewport

```javascript
// ❌ BEFORE
await page.setViewport({ width: 1366, height: 768 });

// ✅ AFTER (set at context level — preferred)
// Set in browser.newContext({ viewport: { width: 1366, height: 768 } })
// Or on the page directly (still supported):
await page.setViewportSize({ width: 1366, height: 768 });
// NOTE: Method renamed from setViewport → setViewportSize in Playwright.
```

### 3n. Cookies

```javascript
// ❌ BEFORE
const cookies = await page.cookies();
await page.setCookie(...cookieArray);
await page.deleteCookie(...cookies);

// ✅ AFTER
const cookies = await context.cookies();       // moved to context
await context.addCookies(cookieArray);          // renamed
await context.clearCookies();                   // clears all
```

### 3o. Cleanup

```javascript
// ❌ BEFORE
await page.close();
await browser.close();

// ✅ AFTER
await page.close();
await context.close(); // ← ADD THIS — close context too
await browser.close();
```

---

## ⚠️ STEP 4 — CRITICAL: MISSING APIs (Playwright doesn't have these)

### 4a. `page.metrics()` — Does NOT exist in Playwright

```javascript
// ❌ BEFORE (Puppeteer) — returns Chrome DevTools Protocol metrics
const metrics = await page.metrics();
// metrics.TaskDuration, metrics.JSEventListeners, etc.

// ✅ AFTER — Use Performance API via page.evaluate()
const metrics = await page.evaluate(() => {
  // Get navigation timing data (same data, different approach)
  const timing = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  return {
    // Map to the same shape the rest of the code expects:
    domContentLoaded: timing.domContentLoadedEventEnd - timing.startTime,
    loadComplete: timing.loadEventEnd - timing.startTime,
    firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
    firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
    // TaskDuration alternative: measure long tasks
    longTaskCount: window.__longTaskCount || 0, // see observer injection below
  };
});

// To track long tasks (PerformanceObserver injection — inject before page.goto):
await page.addInitScript(() => {
  // This script runs in the browser context before any page scripts
  window.__longTaskCount = 0;
  const observer = new PerformanceObserver((list) => {
    window.__longTaskCount += list.getEntries().length;
  });
  observer.observe({ type: 'longtask', buffered: true });
});
```

### 4b. `page.coverage` — Different API in Playwright

```javascript
// ❌ BEFORE (Puppeteer)
await page.coverage.startJSCoverage();
await page.coverage.startCSSCoverage();
// ... navigate ...
const jsCoverage = await page.coverage.stopJSCoverage();
const cssCoverage = await page.coverage.stopCSSCoverage();

// ✅ AFTER — Use CDP (Chrome DevTools Protocol) session in Playwright
const client = await context.newCDPSession(page);
await client.send('Profiler.enable');
await client.send('Profiler.startPreciseCoverage', { callCount: true, detailed: true });
// ... navigate ...
const { result } = await client.send('Profiler.takePreciseCoverage');
await client.send('Profiler.stopPreciseCoverage');
// result is an array of ScriptCoverage objects — same data as Puppeteer
```

### 4c. `page.on('dialog', ...)` — Works same way

```javascript
// ❌ BEFORE
page.on('dialog', async dialog => { await dialog.dismiss(); });

// ✅ AFTER (identical)
page.on('dialog', async dialog => { await dialog.dismiss(); });
```

### 4d. Geolocation

```javascript
// ❌ BEFORE
await page.setGeolocation({ latitude: 28.6, longitude: 77.2 });

// ✅ AFTER
await context.setGeolocation({ latitude: 28.6, longitude: 77.2 });
// Permission needed too:
await context.grantPermissions(['geolocation']);
```

---

## ♿ STEP 5 — AXE-CORE ACCESSIBILITY (Special Handling)

The repo uses `axe-core` for WCAG 2.1 accessibility audits. The injection method changes slightly:

```javascript
// ❌ BEFORE (Puppeteer)
const { createRequire } = require('module');
// Inject axe-core script into the page
await page.addScriptTag({ path: require.resolve('axe-core') });
const axeResults = await page.evaluate(async () => {
  return await axe.run();
});

// ✅ AFTER (Playwright — same approach, identical result)
await page.addScriptTag({ path: require.resolve('axe-core') });
// page.evaluate works identically
const axeResults = await page.evaluate(async () => {
  // axe is now available in browser context
  return await axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }
  });
});
// NOTE: No change needed for axe-core injection — the API is the same.
// axe-core is browser-side JS, independent of Puppeteer/Playwright.
```

---

## 🛡️ STEP 6 — STEALTH CONFIGURATION

`playwright-extra-plugin-stealth` covers the same evasions as `puppeteer-extra-plugin-stealth`. However, verify the stealth plugin is correctly initialized:

```javascript
// ✅ CORRECT Playwright stealth setup
const { chromium } = require('playwright-extra');
const StealthPlugin = require('playwright-extra-plugin-stealth');

// Apply stealth plugin — this patches fingerprinting, navigator.webdriver,
// Chrome runtime, plugin arrays, and more — same as puppeteer stealth
chromium.use(StealthPlugin());

// Launch with these args for server environments (Docker, CI, cloud):
const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',              // Required for running as root in containers
    '--disable-setuid-sandbox',  // Additional sandbox bypass for containers
    '--disable-dev-shm-usage',   // Use /tmp instead of /dev/shm (prevents crashes)
    '--disable-gpu',             // No GPU in headless server environments
    '--disable-blink-features=AutomationControlled', // Extra stealth flag
    '--no-first-run',
    '--no-default-browser-check',
  ],
});
```

---

## 🏗️ STEP 7 — REWRITE `workers/puppeteer.js` → `workers/browser.js`

Rename the file to `workers/browser.js` (or keep the name — your choice). Rewrite it completely with this structure:

```javascript
/**
 * workers/browser.js
 *
 * Browser automation worker for Auditify.
 * Migrated from Puppeteer to Playwright for improved reliability,
 * built-in browser management, and better async handling.
 *
 * Architecture:
 * - Each audit run creates its own BrowserContext (isolated cookies/storage/cache)
 * - The Browser instance is shared and reused across requests
 * - All resources are cleaned up in finally{} blocks to prevent memory leaks
 */

const { chromium } = require('playwright-extra');
const StealthPlugin = require('playwright-extra-plugin-stealth');

// Apply stealth patches before any browser launch
chromium.use(StealthPlugin());

/**
 * Launches a new Playwright browser instance.
 * Call this once at server startup and reuse across requests.
 *
 * @returns {Promise<import('playwright').Browser>} A running browser instance
 */
async function launchBrowser() {
  return await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-blink-features=AutomationControlled',
    ],
  });
}

/**
 * Creates a new isolated browser context + page for one audit run.
 * Each audit gets its own context so cookies, storage, and cache
 * don't leak between concurrent audits.
 *
 * @param {import('playwright').Browser} browser - Reusable browser instance
 * @param {Object} options
 * @param {string} options.userAgent - User agent string to spoof
 * @param {'desktop'|'mobile'} options.deviceType - Viewport preset
 * @returns {Promise<{ context, page }>}
 */
async function createAuditPage(browser, { userAgent, deviceType = 'desktop' } = {}) {
  // Viewport presets matching common device profiles
  const viewport = deviceType === 'mobile'
    ? { width: 390, height: 844 }   // iPhone 14 dimensions
    : { width: 1366, height: 768 }; // Standard desktop HD

  const defaultUA = deviceType === 'mobile'
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
    : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

  // Create isolated context — each has its own cookies, localStorage, sessionStorage
  const context = await browser.newContext({
    userAgent: userAgent || defaultUA,
    viewport,
    locale: 'en-US',
    timezoneId: 'America/New_York',
    // Block third-party cookies to better simulate real user experience
    // and avoid audit noise from ad networks
  });

  const page = await context.newPage();

  // Block resource types that slow down audits without adding metric value.
  // Images, fonts, and media don't affect SEO/security/accessibility data we collect.
  await page.route('**/*', (route) => {
    const blockedTypes = ['image', 'media', 'font'];
    if (blockedTypes.includes(route.request().resourceType())) {
      // Silently abort blocked resource types
      route.abort();
    } else {
      // Pass through all other requests (HTML, CSS, JS, XHR, fetch, etc.)
      route.continue();
    }
  });

  return { context, page };
}

/**
 * Safely closes a page, its context, and optionally the browser.
 * Always call this in a finally{} block to prevent resource leaks.
 *
 * @param {object} params
 * @param {import('playwright').Page} params.page
 * @param {import('playwright').BrowserContext} params.context
 * @param {import('playwright').Browser} [params.browser] - Only pass if you want to close the whole browser
 */
async function cleanup({ page, context, browser } = {}) {
  try { if (page && !page.isClosed()) await page.close(); } catch (_) { /* ignore cleanup errors */ }
  try { if (context) await context.close(); } catch (_) {}
  try { if (browser) await browser.close(); } catch (_) {}
}

module.exports = { launchBrowser, createAuditPage, cleanup };
```

---

## 📊 STEP 8 — METRICS SERVICE REWRITES

For each file in `metricServices/`, apply the following pattern:

```javascript
// ❌ BEFORE pattern in each metricService:
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function analyzeX(url) {
  let browser, page;
  try {
    browser = await puppeteer.launch({ headless: true, args: [...] });
    page = await browser.newPage();
    await page.setUserAgent('...');
    await page.setViewport({ width: 1366, height: 768 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });
    // ... metric logic ...
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

// ✅ AFTER pattern — use shared browser worker:
const { launchBrowser, createAuditPage, cleanup } = require('../workers/browser');

async function analyzeX(url, browser) {
  // browser is passed in from the controller (shared instance)
  let context, page;
  try {
    ({ context, page } = await createAuditPage(browser, { deviceType: 'desktop' }));
    
    // Inject performance observer BEFORE navigation
    await page.addInitScript(() => {
      window.__auditMetrics = { longTasks: 0, cls: 0 };
      // Track Cumulative Layout Shift
      new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) window.__auditMetrics.cls += entry.value;
        });
      }).observe({ type: 'layout-shift', buffered: true });
      // Track Long Tasks (INP proxy)
      new PerformanceObserver((list) => {
        window.__auditMetrics.longTasks += list.getEntries().length;
      }).observe({ type: 'longtask', buffered: true });
    });

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    
    // ... metric logic using page.evaluate(), page.locator(), etc. ...

  } finally {
    // Always clean up context + page; browser is managed by the controller
    await cleanup({ page, context });
  }
}
```

---

## 🔧 STEP 9 — CONTROLLER CHANGES

In `controllers/`, the audit orchestrator likely launches a browser and calls metric services. Update to share one browser:

```javascript
// ✅ AFTER pattern in controller
const { launchBrowser, cleanup } = require('../workers/browser');

async function runFullAudit(url, deviceType) {
  let browser;
  try {
    // Launch ONE browser, share across all 7 metric services
    browser = await launchBrowser();
    
    // Run all 7 audits — pass browser into each
    const [technical, seo, accessibility, security, ux, aio, conversion] = await Promise.allSettled([
      technicalPerformanceService.analyze(url, browser),
      seoService.analyze(url, browser),
      accessibilityService.analyze(url, browser),
      securityService.analyze(url, browser),
      uxService.analyze(url, browser),
      aioService.analyze(url, browser),
      conversionService.analyze(url, browser),
    ]);

    // Extract results (allSettled never throws — check .status)
    return {
      technical: technical.status === 'fulfilled' ? technical.value : { error: technical.reason?.message },
      seo: seo.status === 'fulfilled' ? seo.value : { error: seo.reason?.message },
      // ... etc
    };
  } finally {
    // Close browser after ALL audits complete
    await cleanup({ browser });
  }
}
```

---

## 📝 STEP 10 — CODE QUALITY REQUIREMENTS

Every file you write or modify must follow these rules:

### Comments: Every block must explain WHY, not just WHAT
```javascript
// ✅ GOOD: explains the reason
// We use 'networkidle' instead of 'load' because many audit targets are SPAs
// that render content after the initial load event fires.
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

// ❌ BAD: just restates the code
// Go to URL and wait
await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
```

### Error handling: Always include context
```javascript
// ✅ GOOD
try {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
} catch (err) {
  // Navigation can fail for many reasons: DNS failure, SSL error, redirect loops,
  // or the site being too slow. We throw with context so the controller
  // can return a meaningful error to the API consumer.
  throw new Error(`[TechPerf] Navigation failed for ${url}: ${err.message}`);
}
```

### No silent catch blocks
```javascript
// ❌ NEVER do this
} catch (e) { }

// ✅ Always log or rethrow
} catch (e) {
  console.error('[browser.js cleanup] Context close failed:', e.message);
  // Don't rethrow cleanup errors — they shouldn't mask the original error
}
```

---

## ✅ STEP 11 — VERIFICATION CHECKLIST (run after migration)

After completing all changes, verify by checking these automatically:

```bash
# 1. No Puppeteer imports remain anywhere in Backend/
grep -r "puppeteer" Backend/ --include="*.js" | grep -v "node_modules"
# Expected: zero results

# 2. Playwright is imported correctly
grep -r "playwright" Backend/ --include="*.js" | grep -v "node_modules"
# Expected: appears in workers/browser.js and any metricService that imports it

# 3. No page.setViewport() calls (renamed to setViewportSize)
grep -r "setViewport(" Backend/ --include="*.js" | grep -v "node_modules"
# Expected: zero results

# 4. No page.setUserAgent() calls (moved to context)
grep -r "setUserAgent(" Backend/ --include="*.js" | grep -v "node_modules"  
# Expected: zero results

# 5. No page.setRequestInterception() calls (replaced with page.route())
grep -r "setRequestInterception" Backend/ --include="*.js" | grep -v "node_modules"
# Expected: zero results

# 6. No networkidle0 or networkidle2 (use 'networkidle')
grep -r "networkidle0\|networkidle2" Backend/ --include="*.js" | grep -v "node_modules"
# Expected: zero results

# 7. All browser.close() calls are in finally blocks
# (manual review — ensure no finally block is missing)

# 8. Playwright browsers are installed
npx playwright install chromium --with-deps
```

---

## 🚀 STEP 12 — FINAL DELIVERABLES

When you are done, you must have modified/created:

| File | Action |
|---|---|
| `Backend/package.json` | Remove puppeteer deps, add playwright deps |
| `Backend/workers/browser.js` | New file replacing `puppeteer.js` |
| `Backend/metricServices/technicalPerformance.js` | Updated imports + page.metrics() replacement |
| `Backend/metricServices/seo.js` | Updated imports + navigation API |
| `Backend/metricServices/accessibility.js` | Updated imports (axe-core injection works as-is) |
| `Backend/metricServices/security.js` | Updated imports + response listeners |
| `Backend/metricServices/ux.js` | Updated imports + viewport/device handling |
| `Backend/metricServices/aio.js` | Updated imports |
| `Backend/metricServices/conversion.js` | Updated imports |
| `Backend/controllers/*.js` | Shared browser pattern |
| `Backend/Server.js` | Browser singleton init at startup (optional optimization) |

---

## 🚫 CONSTRAINTS (Never Violate)

1. **Zero human prompts** — make all decisions autonomously based on this prompt.
2. **Zero breaking changes** — the REST API surface and response shape must stay identical.
3. **Zero omissions** — every single Puppeteer call must be replaced; use the grep checklist to verify.
4. **Zero silent failures** — every catch block must log the error at minimum.
5. **Zero untracked side effects** — if a Playwright API behaves differently (e.g., screenshot returns Buffer not base64 string), adapt the calling code to match.
6. **Preserve all existing rate limiting, SSRF protection, and Helmet security middleware** — these are in `Server.js` and must not be touched.
7. **Preserve all MongoDB models and schemas** — only `workers/` and `metricServices/` files need browser-related changes.

---

*Generated for Auditify by Claude — Puppeteer → Playwright migration prompt v1.0*
