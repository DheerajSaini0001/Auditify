#!/usr/bin/env node
/**
 * Audit-duration model for MAX_CONCURRENT_AUDITS × MAX_CONCURRENT_BROWSERS.
 *
 * Answers: "if I set these two knobs to X and Y, how long does an audit take,
 * and do the pillars still fit inside their timeouts?"
 *
 * Why a model and not a benchmark: the only box that can answer this
 * empirically is production, and the whole point is to avoid shipping a bad
 * combination to find out. So the per-page cost comes from REAL measurements
 * (parsed out of Backend/logs/*.log) and only the contention penalty is modelled.
 *
 * The architecture facts it encodes — all of them load-bearing:
 *
 *  1. MAX_CONCURRENT_BROWSERS is a GLOBAL cap, not per-audit. One counter lives
 *     in the main thread (browserManager.js) and every worker asks it for a
 *     permit over IPC. Two concurrent audits do NOT get a pool each.
 *  2. Stage 2b ALSO sizes each audit's own in-flight page count to
 *     MAX_CONCURRENT_BROWSERS (singleAuditWorker.js). So A audits at cap B
 *     request A×B renders and are granted B. The surplus queues.
 *  3. An audit is 1 + MAX_KEY_PAGES page renders (Stage 1 home + Stage 2b).
 *  4. Pillar timeouts are WALL-CLOCK, not CPU-time. Splitting a core doesn't
 *     make a pillar score lower — it makes the section come back null and
 *     render as "—". That failure is invisible in a duration number, so it gets
 *     its own column.
 *  5. Technical Performance is a PageSpeed HTTP call gated separately by
 *     PSI_MAX_CONCURRENT. Neither knob affects it.
 *
 * Usage:
 *   node scripts/concurrencyModel.js                     # production defaults (B2)
 *   node scripts/concurrencyModel.js --cores 4           # model a B3 upgrade
 *   node scripts/concurrencyModel.js --key-pages 4       # model a smaller page set
 *   node scripts/concurrencyModel.js --machine-factor 1  # model THIS mac
 *   node scripts/concurrencyModel.js --base 45           # skip the logs, set T0 by hand
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, "..", "logs");

// ── CLI ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1 || i === argv.length - 1) return fallback;
  const v = Number(argv[i + 1]);
  return Number.isFinite(v) ? v : fallback;
};

const CORES = flag("cores", 2);              // App Service B2 = 2 vCPU
const KEY_PAGES = flag("key-pages", 6);      // MAX_KEY_PAGES default
const PAGES_PER_AUDIT = KEY_PAGES + 1;       // + Stage 1 home
const MACHINE_FACTOR = flag("machine-factor", 1.8); // B2 vs this dev box, single-thread
const BASE_OVERRIDE = flag("base", 0);
const DISCOVERY_S = flag("discovery", 45);   // Stage 2a: sitemap + classify, before renders
const MAX_AUDITS = flag("max-audits", 3);
const MAX_BROWSERS = flag("max-browsers", 4);
const USERS = flag("users", 0);              // model a burst of N users arriving at once

// Pillar wall-clock budgets (singleAuditWorker.js). The tightest one decides
// whether a combination silently drops sections.
//
// `cpu` is an ASSUMPTION, not a measurement — nothing logs per-pillar duration,
// so there is nothing to calibrate against. Rather than pretend otherwise, the
// report below inverts the question and prints the BREAK-EVEN cost: the true
// CPU cost at which each pillar starts getting dropped at each concurrency.
// Compare that against reality instead of trusting the flag.
//
// Production evidence says these are optimistic: Accessibility is already
// failing on 5 of 6 pages, so its real solo cost is nearer its 60s budget than
// the 34s below. Treat every "clean" verdict as the best case.
const PILLARS = [
  { name: "Accessibility",  budget: 60,  cpu: 34 },
  { name: "UX & Content",   budget: 60,  cpu: 30 },
  { name: "Conversion",     budget: 60,  cpu: 28 },
  { name: "On-Page SEO",    budget: 75,  cpu: 38 },
  { name: "Security",       budget: 90,  cpu: 40 },
];

// ── Step 1: measure T0 from real logs ────────────────────────────────────────
// A page-render permit is held for the whole 8-pillar audit of that page, so
// acquire→release IS the per-page cost. Only audit: labels count; waf-warmup,
// classification and pdf-export holds are different workloads.
function measurePageCost() {
  let files = [];
  try {
    files = fs.readdirSync(LOG_DIR).filter((f) => f.endsWith(".log"));
  } catch {
    return null;
  }
  const held = {};
  const samples = [];
  for (const f of files) {
    let lines;
    try { lines = fs.readFileSync(path.join(LOG_DIR, f), "utf8").split("\n"); }
    catch { continue; }
    for (const line of lines) {
      const ts = line.match(/^\[([\d\-T:.Z]+)\]/);
      if (!ts) continue;
      const at = Date.parse(ts[1]);
      if (!Number.isFinite(at)) continue;

      const acq = line.match(/BrowserPool\] acquired (\S+?)\(audit:[^)]*\)/);
      if (acq) { held[acq[1]] = at; continue; }

      const rel = line.match(/BrowserPool\] released (\S+)/);
      if (rel && held[rel[1]] != null) {
        const sec = (at - held[rel[1]]) / 1000;
        delete held[rel[1]];
        // Drop the watchdog-reclaim tail (SLOT_MAX_HOLD_MS = 300s): those are
        // zombie permits, not page audits, and they'd skew the median.
        if (sec > 0 && sec < 300) samples.push(sec);
      }
    }
  }
  if (samples.length < 10) return null;
  samples.sort((a, b) => a - b);
  const q = (p) => samples[Math.floor(samples.length * p)];
  return { n: samples.length, median: q(0.5), p75: q(0.75), p90: q(0.9) };
}

const measured = measurePageCost();
// Median, not mean: the mean is dragged by a couple of WAF-challenge outliers
// that aren't representative of a typical page.
const devPageCost = BASE_OVERRIDE || (measured ? measured.median : 36);
const T0 = devPageCost * (BASE_OVERRIDE ? 1 : MACHINE_FACTOR);

// ── Step 2: the contention model ─────────────────────────────────────────────
// One page render is a headless Chrome plus up to 8 concurrent page.evaluate
// streams — it saturates more than a single core, but not two. Call it ~1.3
// cores of appetite. Below saturation, extra browsers are close to free; above
// it, wall-clock scales with how oversubscribed the box is.
//
// Deliberately linear above saturation, and deliberately NOT modelling memory
// pressure: 3 Chromes in 3.5GB will swap, and swapping is far worse than this
// predicts. Treat every number here as a floor, not a forecast.
const CORE_APPETITE = 1.3;
const slowdown = (liveBrowsers) =>
  Math.max(1, (liveBrowsers * CORE_APPETITE) / CORES);

// ── Step 3: per-combination timing ───────────────────────────────────────────
function model(audits, browsers) {
  // Fact 2: A audits each want `browsers` in flight; the global pool grants
  // `browsers` total. Live browsers is therefore capped at `browsers`, never A×B.
  const live = browsers;
  const f = slowdown(live);
  const pageWall = T0 * f;

  // Stage 2b is a ROLLING pool — each slot pulls the next queued page the instant
  // its current page closes (singleAuditWorker.js). So throughput is continuous,
  // NOT ceil()'d waves; modelling it as fixed chunks invents a quantization step
  // that the code stopped having.
  const solo = DISCOVERY_S + (PAGES_PER_AUDIT / browsers) * pageWall;

  // A audits share the same `browsers` permits fairly, so all A finish at
  // roughly the same moment — total render work over pool throughput.
  const totalRenders = audits * PAGES_PER_AUDIT;
  const saturated = DISCOVERY_S + (totalRenders / browsers) * pageWall;

  // Fact 4: does the tightest pillar still fit in its wall-clock budget?
  const risks = PILLARS.map((p) => ({ ...p, wall: p.cpu * f }))
    .filter((p) => p.wall > p.budget);

  return { solo, saturated, f, risks, live };
}

// ── Output ───────────────────────────────────────────────────────────────────
// Round to whole seconds FIRST, then split. Rounding the remainder separately
// lets 15m59.6s print as "15m60s".
const mins = (s) => {
  const t = Math.round(s);
  return `${Math.floor(t / 60)}m${String(t % 60).padStart(2, "0")}s`;
};
const POLL_CEILING_S = 240; // AuditSummaryPage.jsx: MAX_ROUNDS 80 × 3s

console.log("");
console.log("  Audit duration model — MAX_CONCURRENT_AUDITS × MAX_CONCURRENT_BROWSERS");
console.log("  " + "─".repeat(74));
if (measured) {
  console.log(`  per-page cost   ${measured.median.toFixed(0)}s median (${measured.n} real renders in logs/, p75 ${measured.p75.toFixed(0)}s, p90 ${measured.p90.toFixed(0)}s)`);
  console.log(`                  × ${MACHINE_FACTOR} machine factor → ${T0.toFixed(0)}s assumed on target`);
} else {
  console.log(`  per-page cost   ${T0.toFixed(0)}s assumed (no usable logs found — pass --base)`);
}
console.log(`  target box      ${CORES} vCPU`);
console.log(`  audit shape     ${PAGES_PER_AUDIT} page renders (1 home + ${KEY_PAGES} key pages) + ${DISCOVERY_S}s discovery`);
const satPoint = CORES / CORE_APPETITE;
console.log(`  saturation      ${satPoint.toFixed(1)} browsers uses the box fully — past that, wall clock stops`);
console.log(`                  improving and only the timeout risk grows`);
console.log("");
console.log("  TIME TO COMPLETE — how long ONE audit takes, with N audits in flight");
console.log("  " + "─".repeat(74));
console.log("  audits↓ / browsers→" + Array.from({ length: MAX_BROWSERS }, (_, i) => String(i + 1).padStart(9)).join(""));
for (let a = 1; a <= MAX_AUDITS; a++) {
  const row = [];
  for (let b = 1; b <= MAX_BROWSERS; b++) row.push(mins(model(a, b).saturated).padStart(9));
  console.log(`      ${a}             ` + row.join("") + (a === 1 ? "   ← solo, the common case" : ""));
}
console.log("");
console.log("  DATA INTEGRITY — a dropped pillar renders as \"—\", not as a lower score");
console.log("  " + "─".repeat(74));
console.log("  The break-even is the true solo CPU cost at which a pillar starts being");
console.log("  dropped. Below it the section scores; above it the cell goes blank.");
console.log("");
const tight = PILLARS.slice().sort((x, y) => x.budget / x.cpu - y.budget / y.cpu)[0];
console.log(`  browsers  slowdown   ${"break-even for " + tight.name} (budget ${tight.budget}s)   assumed verdict`);
for (let b = 1; b <= MAX_BROWSERS; b++) {
  const m = model(1, b);
  const breakEven = tight.budget / m.f;
  const verdict = m.risks.length === 0
    ? "clean"
    : `DROPS ${m.risks.map((r) => r.name).join(", ")}`;
  console.log(
    `     ${b}       ×${m.f.toFixed(2)}      true cost must stay under ${breakEven.toFixed(0)}s`.padEnd(62) +
    `   ${verdict}`
  );
}
// ── Burst: N users arrive at once ────────────────────────────────────────────
// The point of this section is that TOTAL drain time is throughput-bound, so it
// barely moves with MAX_CONCURRENT_AUDITS — the box does the same amount of
// render work either way. What the knob changes is WHO waits: serving audits
// serially (audits=1) finishes the first user early and the last user late;
// running them all at once finishes EVERYONE at the late time. Early completion
// is strictly better, which is why "let every user run in parallel" is the wrong
// goal on a CPU-bound box.
if (USERS > 0) {
  console.log("");
  console.log(`  BURST — ${USERS} users click Start at the same moment`);
  console.log("  " + "─".repeat(74));
  console.log("  Total render work: " + USERS * PAGES_PER_AUDIT + " page renders");
  console.log("");
  console.log("  browsers  first user done   last user done   throughput");
  for (let b = 1; b <= MAX_BROWSERS; b++) {
    const f = slowdown(b);
    const pageWall = T0 * f;
    // Serial admission (audits=1): each audit gets the whole pool in turn.
    const perAudit = DISCOVERY_S + (PAGES_PER_AUDIT / b) * pageWall;
    const drain = DISCOVERY_S + (USERS * PAGES_PER_AUDIT / b) * pageWall;
    const perHour = 3600 / perAudit;
    console.log(
      `     ${b}      ${mins(perAudit).padStart(10)}       ${mins(drain).padStart(10)}       ${perHour.toFixed(1)} audits/hr`
    );
  }
  console.log("");
  console.log("  Same totals apply at MAX_CONCURRENT_AUDITS=2 or 10 — the box does the same");
  console.log("  render work. Higher admission only DELAYS the early users to match the last.");
}

console.log("");
console.log("  FRONTEND — summary page stops polling at " + mins(POLL_CEILING_S) + " (AuditSummaryPage.jsx MAX_ROUNDS)");
console.log("  " + "─".repeat(74));
for (let b = 1; b <= MAX_BROWSERS; b++) {
  const s = model(1, b).solo;
  console.log(`  browsers=${b}  solo ${mins(s).padEnd(8)} ${s > POLL_CEILING_S ? "✗ heatmap freezes half-filled" : "✓ completes in time"}`);
}
console.log("");
console.log("  Not modelled: Technical Performance. It is a PageSpeed HTTP call gated by");
console.log("  PSI_MAX_CONCURRENT, so neither knob moves it — it stays \"—\" until API_KEY");
console.log("  reaches the worker's process.env. Memory pressure is also excluded; 3+");
console.log("  Chromes in 3.5GB will swap and blow past every number above.");
console.log("");
