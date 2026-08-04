#!/usr/bin/env node
/**
 * Measures the REAL memory footprint of the audit's headless Chromium as
 * concurrent page renders are added, so the B2 capacity question can be
 * answered with numbers instead of vendor estimates.
 *
 * Why this exists: browserManager's sysMetrics() logs only the NODE process
 * RSS. Chromium is a separate process tree, so nothing in logs/ tells us what a
 * render actually costs. This opens contexts one at a time against a real
 * audited URL and reads the whole Chromium tree's RSS after each.
 *
 * It mirrors production's actual topology, which is easy to get wrong:
 * concurrent renders inside ONE audit share ONE Chromium process and get a
 * context each (puppeteer_cheerio.js getSharedBrowser), so the per-render cost
 * is a CONTEXT, not a browser. A second concurrent AUDIT is a separate
 * worker_thread with its own module instance, and therefore its own browser
 * process — that one does pay full price.
 *
 * Usage:
 *   node scripts/measureBrowserMemory.js [url] [maxContexts]
 */

import { chromium } from "playwright";
import { execSync } from "child_process";

// Copied verbatim from puppeteer_cheerio.js (it isn't exported). If those args
// change, this measurement drifts — keep them in sync.
const BOT_BYPASS_LAUNCH_OPTIONS = {
  headless: true,
  args: [
    "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas", "--disable-gpu", "--hide-scrollbars",
    "--mute-audio", "--disable-blink-features=AutomationControlled",
    "--disable-features=IsolateOrigins,site-per-process", "--window-size=1920,1080",
    "--ignore-certificate-errors", "--no-zygote", "--disable-infobars",
    "--disable-automation", "--no-first-run", "--no-default-browser-check",
    "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows",
    "--lang=en-US,en",
  ],
};

const URL_TO_LOAD = process.argv[2] || "https://fusz.com";
const MAX_CONTEXTS = parseInt(process.argv[3] || "3", 10);

// Total RSS of the Chromium process tree, in MB. Sums every chrome/chromium
// process the platform reports — browser process, renderers, GPU, network,
// utility — because that whole tree is what counts against the container limit.
function chromiumTreeMB() {
  try {
    const out = execSync(
      "ps -Ao rss,comm | grep -i -E '(chrome|chromium)' | grep -v grep || true",
      { encoding: "utf8" }
    );
    const kb = out.split("\n")
      .map((l) => parseInt(l.trim().split(/\s+/)[0], 10))
      .filter(Number.isFinite)
      .reduce((a, b) => a + b, 0);
    return Math.round(kb / 1024);
  } catch {
    return NaN;
  }
}

const nodeMB = () => Math.round(process.memoryUsage().rss / 1048576);

const rows = [];
const baselineChrome = chromiumTreeMB();

console.log(`\n  Measuring: ${URL_TO_LOAD}`);
console.log(`  Baseline Chromium already on this machine: ${baselineChrome}MB (subtracted below)\n`);

const browser = await chromium.launch(BOT_BYPASS_LAUNCH_OPTIONS);
await new Promise((r) => setTimeout(r, 1500)); // let the process tree settle
const afterLaunch = chromiumTreeMB() - baselineChrome;
rows.push({ label: "browser process, 0 pages", chrome: afterLaunch, node: nodeMB() });

const contexts = [];
for (let i = 1; i <= MAX_CONTEXTS; i++) {
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  });
  contexts.push(ctx);
  const page = await ctx.newPage();
  try {
    await page.goto(URL_TO_LOAD, { waitUntil: "domcontentloaded", timeout: 45000 });
    // Give lazy-loaded imagery and third-party tags a moment — a dealer page's
    // real footprint is not its domcontentloaded footprint.
    await page.waitForTimeout(6000);
  } catch (e) {
    console.log(`  (context ${i}: navigation issue — ${e.message.split("\n")[0]})`);
  }
  await new Promise((r) => setTimeout(r, 1000));
  rows.push({ label: `${i} page render${i > 1 ? "s" : ""} in flight`, chrome: chromiumTreeMB() - baselineChrome, node: nodeMB() });
}

// ── Report ───────────────────────────────────────────────────────────────────
const B2_TOTAL = 3584;   // App Service B2 = 3.5 GB
const OS_OVERHEAD = 300; // container + OS, conservative
// Node RSS is NOT a single number — it scales with how many browsers are live,
// because each concurrent render means another worker_thread holding page data,
// a cheerio DOM and a buffered screenshot. Using one global figure for every row
// is wrong in both directions: it over-states the risk at 1 browser (the global
// max was recorded at 4) and under-states it at 4.
//
// Measured from logs/ by bucketing every BrowserPool line's rss= on its active=
// count (n=3147). Index = concurrent renders.
const NODE_BY_CONCURRENCY = {
  1: { typical: 354, p90: 639, worst: 1240 },
  2: { typical: 440, p90: 718, worst: 1664 },
  3: { typical: 483, p90: 758, worst: 1619 },
  4: { typical: 775, p90: 1232, worst: 2015 },
  5: { typical: 932, p90: 1482, worst: 1997 },
  6: { typical: 742, p90: 1356, worst: 1619 },
};
// Caveat worth remembering when reading the output: these were recorded on a
// 10GB-plus dev box, where V8 grows its heap opportunistically because it can.
// Inside a 3.5GB container Node GCs harder, so real RSS should be LOWER than
// this — the table errs pessimistic, which is the right direction for a
// capacity decision.

console.log(`  ┌${"─".repeat(76)}┐`);
console.log(`  │ MEASURED — Chromium tree RSS as renders are added                           │`);
console.log(`  └${"─".repeat(76)}┘`);
console.log(`  ${"state".padEnd(28)}${"Chromium".padStart(11)}${"+ per render".padStart(15)}`);
let prev = null;
for (const r of rows) {
  const delta = prev == null ? "" : `+${r.chrome - prev}MB`;
  console.log(`  ${r.label.padEnd(28)}${(r.chrome + "MB").padStart(11)}${delta.padStart(15)}`);
  prev = r.chrome;
}

console.log(`\n  ┌${"─".repeat(76)}┐`);
console.log(`  │ B2 BUDGET — 3.5 GB total, memory remaining after each render                │`);
console.log(`  └${"─".repeat(76)}┘`);
console.log(`  ${"renders".padEnd(10)}${"Chromium".padStart(10)}${"Node".padStart(9)}${"OS".padStart(7)}${"used".padStart(9)}${"LEFT".padStart(10)}   verdict`);
for (let i = 1; i < rows.length; i++) {
  const nodeProfile = NODE_BY_CONCURRENCY[i] || NODE_BY_CONCURRENCY[6];
  for (const [tag, node] of [["typical", nodeProfile.typical], ["p90", nodeProfile.p90], ["worst", nodeProfile.worst]]) {
    const used = rows[i].chrome + node + OS_OVERHEAD;
    const left = B2_TOTAL - used;
    const pct = Math.round((left / B2_TOTAL) * 100);
    const verdict = left < 0 ? "*** OOM — CONTAINER DIES ***" : left < 300 ? "OOM RISK" : left < 700 ? "tight" : "ok";
    console.log(
      `  ${(i + " (" + tag + ")").padEnd(10)}${(rows[i].chrome + "MB").padStart(10)}${(node + "MB").padStart(9)}${(OS_OVERHEAD + "MB").padStart(7)}${(used + "MB").padStart(9)}${(left + "MB").padStart(10)}   ${verdict} (${pct}% free)`
    );
  }
}

console.log(`\n  Node RSS is concurrency-matched from Backend/logs (n=3147): each row uses the`);
console.log(`  RSS actually recorded at THAT browser count, not one global figure.`);
console.log(`  This run's own Node process: ${nodeMB()}MB — ignore it, this script isn't the server.`);
console.log(`  NOTE: renders inside ONE audit share this single browser process. A second`);
console.log(`  concurrent AUDIT is a separate worker_thread with its OWN browser tree —`);
console.log(`  add the "browser process" row again for each extra audit.\n`);

for (const c of contexts) { try { await c.close(); } catch {} }
await browser.close();
