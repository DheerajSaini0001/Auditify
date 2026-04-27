// ═══════════════════════════════════════════════════════════════
//  Stealth Fingerprint Test — Run against detection sites
//  Usage: node test_stealth.js
// ═══════════════════════════════════════════════════════════════

import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import { applyStealthToPage, STEALTH_CHROME_ARGS, PROFILES } from "./utils/stealth/stealthLauncher.js";
import { humanMouseMove, humanDwell, humanAutoScroll, mouseJiggle } from "./utils/stealth/humanBehavior.js";

puppeteer.use(StealthPlugin());

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

async function runTest() {
  const profile = PROFILES.desktop;

  const browser = await puppeteer.launch({
    headless: false, // Use headed mode so you can visually verify
    args: [
      ...STEALTH_CHROME_ARGS,
      `--window-size=${profile.viewport.width},${profile.viewport.height}`,
    ],
    env: { ...process.env, TZ: "America/New_York" },
  });

  const page = await browser.newPage();
  await applyStealthToPage(page, "desktop");

  console.log("\n═══════════════════════════════════════════");
  console.log("  🔬 Stealth Fingerprint Self-Test");
  console.log("═══════════════════════════════════════════\n");

  // ─── SELF-CHECK: Verify patches in JS context ─────────────
  const selfCheck = await page.evaluate(() => {
    return {
      webdriver: navigator.webdriver,
      platform: navigator.platform,
      vendor: navigator.vendor,
      language: navigator.language,
      languages: navigator.languages,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: navigator.deviceMemory,
      maxTouchPoints: navigator.maxTouchPoints,
      pluginCount: navigator.plugins.length,
      pluginNames: Array.from(navigator.plugins).map((p) => p.name),
      mimeTypeCount: navigator.mimeTypes.length,
      hasConnection: !!navigator.connection,
      connectionType: navigator.connection?.effectiveType,
      hasChromeRuntime: !!window.chrome?.runtime,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      screenX: window.screenX,
      screenY: window.screenY,
    };
  });

  console.log("── Navigator Properties ──");
  console.log(`  webdriver:           ${selfCheck.webdriver} ${selfCheck.webdriver === undefined ? "✅" : "❌"}`);
  console.log(`  platform:            ${selfCheck.platform} ${selfCheck.platform === "Win32" ? "✅" : "⚠️"}`);
  console.log(`  vendor:              ${selfCheck.vendor} ${selfCheck.vendor === "Google Inc." ? "✅" : "❌"}`);
  console.log(`  language:            ${selfCheck.language} ✅`);
  console.log(`  languages:           ${JSON.stringify(selfCheck.languages)} ✅`);
  console.log(`  hardwareConcurrency: ${selfCheck.hardwareConcurrency} ✅`);
  console.log(`  deviceMemory:        ${selfCheck.deviceMemory} ✅`);
  console.log(`  maxTouchPoints:      ${selfCheck.maxTouchPoints} ${selfCheck.maxTouchPoints === 0 ? "✅" : "⚠️"}`);
  console.log(`  plugins:             ${selfCheck.pluginCount} plugins ${selfCheck.pluginCount >= 5 ? "✅" : "❌"}`);
  console.log(`    Names:             ${selfCheck.pluginNames.join(", ")}`);
  console.log(`  mimeTypes:           ${selfCheck.mimeTypeCount} ✅`);
  console.log(`  connection:          ${selfCheck.connectionType} ${selfCheck.hasConnection ? "✅" : "❌"}`);
  console.log(`  chrome.runtime:      ${selfCheck.hasChromeRuntime ? "present" : "missing"} ${selfCheck.hasChromeRuntime ? "✅" : "❌"}`);
  console.log(`  outerWidth:          ${selfCheck.outerWidth} ${selfCheck.outerWidth > 0 ? "✅" : "❌"}`);
  console.log(`  outerHeight:         ${selfCheck.outerHeight} ${selfCheck.outerHeight > 0 ? "✅" : "❌"}`);
  console.log(`  screenX:             ${selfCheck.screenX} ${selfCheck.screenX > 0 ? "✅" : "❌"}`);
  console.log(`  screenY:             ${selfCheck.screenY} ${selfCheck.screenY > 0 ? "✅" : "❌"}`);

  // ─── WebGL Check ──────────────────────────────────────────
  const webglCheck = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    if (!gl) return { vendor: "N/A", renderer: "N/A" };
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      vendor: ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      renderer: ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
    };
  });

  console.log("\n── WebGL ──");
  console.log(`  Vendor:   ${webglCheck.vendor} ${webglCheck.vendor.includes("NVIDIA") ? "✅" : "⚠️"}`);
  console.log(`  Renderer: ${webglCheck.renderer} ${webglCheck.renderer.includes("NVIDIA") ? "✅" : "⚠️"}`);

  // ─── LIVE SITE TESTS ─────────────────────────────────────
  const testSites = [
    { name: "Bot.sannysoft.com", url: "https://bot.sannysoft.com/" },
    { name: "BrowserLeaks WebGL", url: "https://browserleaks.com/webgl" },
  ];

  for (const site of testSites) {
    console.log(`\n── Testing: ${site.name} ──`);
    try {
      await page.goto(site.url, { waitUntil: "networkidle2", timeout: 30000 });
      await humanDwell(page, 2000, 4000);
      await mouseJiggle(page);

      const screenshot = await page.screenshot({
        path: `./stealth_test_${site.name.replace(/[^a-z0-9]/gi, "_")}.png`,
        fullPage: true,
      });
      console.log(`  ✅ Screenshot saved: stealth_test_${site.name.replace(/[^a-z0-9]/gi, "_")}.png`);
    } catch (e) {
      console.log(`  ❌ Failed: ${e.message}`);
    }
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("  Test complete! Check screenshots for results.");
  console.log("  Browser will stay open for 30s for manual inspection.");
  console.log("═══════════════════════════════════════════\n");

  await delay(30000);
  await browser.close();
}

runTest().catch(console.error);
