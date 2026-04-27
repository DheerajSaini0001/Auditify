// ═══════════════════════════════════════════════════════════════
//  Stealth Browser Launcher — Central configuration
//  Applies all fingerprint evasions + HTTP headers + viewport
// ═══════════════════════════════════════════════════════════════

import { buildEvasionScript } from "./fingerprintEvasion.js";

// ─── PROFILES ──────────────────────────────────────────────────

export const PROFILES = {
  desktop: {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36",
    platform: "Win32",
    vendor: "Google Inc.",
    viewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
    maxTouchPoints: 0,
    deviceMemory: 8,
    hardwareConcurrency: 8,
    mobile: false,
    secChUa: '"Chromium";v="136", "Google Chrome";v="136", "Not-A.Brand";v="99"',
    secChUaPlatform: '"Windows"',
    secChUaMobile: "?0",
  },
  mobile: {
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Mobile Safari/537.36",
    platform: "Linux armv81",
    vendor: "Google Inc.",
    viewport: { width: 393, height: 852, deviceScaleFactor: 3, isMobile: true, hasTouch: true, isLandscape: false },
    maxTouchPoints: 5,
    deviceMemory: 4,
    hardwareConcurrency: 8,
    mobile: true,
    secChUa: '"Chromium";v="136", "Google Chrome";v="136", "Not-A.Brand";v="99"',
    secChUaPlatform: '"Android"',
    secChUaMobile: "?1",
  },
};

// ─── CHROME LAUNCH ARGS ────────────────────────────────────────

export const STEALTH_CHROME_ARGS = [
  "--no-sandbox",
  "--disable-setuid-sandbox",
  "--disable-dev-shm-usage",
  "--disable-blink-features=AutomationControlled",
  "--disable-features=IsolateOrigins,site-per-process",
  "--disable-infobars",
  "--disable-background-timer-throttling",
  "--disable-backgrounding-occluded-windows",
  "--disable-renderer-backgrounding",
  "--hide-scrollbars",
  "--mute-audio",
  "--ignore-certificate-errors",
  "--no-zygote",
  "--single-process",
  "--lang=en-US,en",
];

/**
 * Apply all stealth patches to a Puppeteer page.
 * Call this BEFORE navigating to any URL.
 *
 * @param {import('puppeteer').Page} page
 * @param {'desktop'|'mobile'} device
 */
export async function applyStealthToPage(page, device = "desktop") {
  const profile = PROFILES[device] || PROFILES.desktop;

  // 1. Set timezone to match profile
  try {
    const cdp = await page.createCDPSession();
    await cdp.send("Emulation.setTimezoneOverride", { timezoneId: "America/New_York" });
    await cdp.send("Emulation.setLocaleOverride", { locale: "en-US" });
    await cdp.detach();
  } catch (e) {
    // CDP session may fail in some envs; non-fatal
  }

  // 2. Inject full evasion script BEFORE any page JS runs
  const evasionJS = buildEvasionScript({
    platform: profile.platform,
    userAgent: profile.userAgent,
    vendor: profile.vendor,
    maxTouchPoints: profile.maxTouchPoints,
    deviceMemory: profile.deviceMemory,
    hardwareConcurrency: profile.hardwareConcurrency,
  });
  await page.evaluateOnNewDocument(evasionJS);

  // 3. Set user agent
  await page.setUserAgent(profile.userAgent);

  // 4. Set viewport & screen dimensions
  await page.setViewport(profile.viewport);

  // 5. Set HTTP headers (consistent with UA)
  await page.setExtraHTTPHeaders({
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "max-age=0",
    "Sec-Ch-Ua": profile.secChUa,
    "Sec-Ch-Ua-Mobile": profile.secChUaMobile,
    "Sec-Ch-Ua-Platform": profile.secChUaPlatform,
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
  });
}
