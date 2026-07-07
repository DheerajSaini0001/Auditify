// Calibration harness — SCORING_FORMAT.md §9.
//
// Verifies that Auditify section scores land close to their external reference
// tools on real sites, so "is our score accurate?" is a repeatable report, not
// an opinion. Run before every demo/release.
//
// Usage:
//   node scripts/calibrateScores.js <urls.txt>                 # reference-only sweep
//   node scripts/calibrateScores.js <urls.txt> --ours <ours.json>
//
//   urls.txt   one URL per line (# comments allowed), 15–20 dealer sites recommended
//   ours.json  optional map of our audit results, produced by exporting reports:
//              { "<url>": { "technical": 62, "accessibility": 26, "onPageSEO": 78,
//                           "headerGrade": "D" }, ... }
//
// References pulled per URL (mobile strategy):
//   • PageSpeed Insights API  → Lighthouse performance / accessibility / seo (×100)
//     (uses the same API_KEY env/config the Technical section uses)
//   • securityheaders.com     → letter grade (x-grade response header, HTML fallback)
//
// Pass criteria (SCORING_FORMAT.md §6):
//   Technical      |Δ| ≤ 10 AND same Lighthouse band (0-49 / 50-89 / 90-100)
//   Accessibility  same band
//   On-Page SEO    |Δ| ≤ 10
//   Header grade   within 1 letter step of securityheaders.com
//
// Output: per-URL table + per-section summary (mean |Δ|, band-match rate,
// Spearman rank correlation) + overall PASS/FAIL verdict.

import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const API_KEY = process.env.API_KEY;
const PSI = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

const band = (s) => (s == null ? null : s >= 90 ? "good" : s >= 50 ? "needs-improvement" : "poor");
const GRADES = ["F", "E", "D-", "D", "D+", "C-", "C", "C+", "B-", "B", "B+", "A-", "A", "A+"];
const gradeDistance = (a, b) => {
  const ia = GRADES.indexOf(a), ib = GRADES.indexOf(b);
  return ia < 0 || ib < 0 ? null : Math.abs(ia - ib);
};

async function psiScores(url) {
  if (!API_KEY) return { error: "API_KEY not configured (.env)" };
  const endpoint = `${PSI}?url=${encodeURIComponent(url)}&strategy=mobile` +
    `&category=performance&category=accessibility&category=seo&key=${API_KEY}`;
  try {
    const res = await fetch(endpoint);
    const data = await res.json();
    if (!res.ok || data?.error) return { error: data?.error?.message || `HTTP ${res.status}` };
    const cat = data?.lighthouseResult?.categories || {};
    const pct = (c) => (typeof c?.score === "number" ? Math.round(c.score * 100) : null);
    return {
      performance: pct(cat.performance),
      accessibility: pct(cat.accessibility),
      seo: pct(cat.seo),
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function securityHeadersGrade(url) {
  try {
    const res = await fetch(`https://securityheaders.com/?q=${encodeURIComponent(url)}&followRedirects=on&hide=on`, {
      headers: { "User-Agent": "Auditify-Calibration/1.0" },
    });
    // securityheaders.com exposes the grade as an x-grade response header;
    // fall back to scraping the result page if that ever changes.
    const headerGrade = res.headers.get("x-grade");
    if (headerGrade) return headerGrade.toUpperCase();
    const html = await res.text();
    const m = html.match(/class="score[^"]*"[^>]*>\s*<span>([A-F][+-]?)<\/span>/i) || html.match(/grade[^A-F]*([A-F][+-]?)</i);
    return m ? m[1].toUpperCase() : null;
  } catch (_) {
    return null;
  }
}

// Spearman rank correlation over pairs that have both values.
function spearman(pairs) {
  const usable = pairs.filter(([a, b]) => typeof a === "number" && typeof b === "number");
  const n = usable.length;
  if (n < 3) return null;
  const rank = (values) => {
    const sorted = values.map((v, i) => [v, i]).sort((x, y) => x[0] - y[0]);
    const ranks = new Array(n);
    for (let i = 0; i < n; i++) ranks[sorted[i][1]] = i + 1;
    return ranks;
  };
  const ra = rank(usable.map((p) => p[0]));
  const rb = rank(usable.map((p) => p[1]));
  const d2 = ra.reduce((s, r, i) => s + (r - rb[i]) ** 2, 0);
  return parseFloat((1 - (6 * d2) / (n * (n * n - 1))).toFixed(2));
}

async function main() {
  const [urlFile, ...rest] = process.argv.slice(2);
  if (!urlFile) {
    console.error("Usage: node scripts/calibrateScores.js <urls.txt> [--ours <ours.json>]");
    process.exit(1);
  }
  const oursFlag = rest.indexOf("--ours");
  const ours = oursFlag >= 0 && rest[oursFlag + 1]
    ? JSON.parse(fs.readFileSync(rest[oursFlag + 1], "utf8"))
    : null;

  const urls = fs.readFileSync(urlFile, "utf8")
    .split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));

  console.log(`Calibrating against ${urls.length} URL(s)${ours ? " (with our scores)" : " (reference-only sweep)"}\n`);

  const rows = [];
  for (const url of urls) {
    process.stdout.write(`→ ${url} ... `);
    const [psi, shGrade] = await Promise.all([psiScores(url), securityHeadersGrade(url)]);
    const row = { url, psi, shGrade, ours: ours?.[url] || null };
    rows.push(row);
    console.log(psi.error ? `PSI error: ${psi.error}` : `perf ${psi.performance} a11y ${psi.accessibility} seo ${psi.seo} headers ${shGrade || "?"}`);
  }

  console.log("\n== Reference results ==");
  console.table(rows.map((r) => ({
    url: r.url.slice(0, 55),
    "PSI perf": r.psi.performance ?? r.psi.error?.slice(0, 20) ?? "-",
    "PSI a11y": r.psi.accessibility ?? "-",
    "PSI seo": r.psi.seo ?? "-",
    "SecHeaders": r.shGrade ?? "-",
  })));

  if (!ours) {
    console.log("No --ours file supplied — reference sweep only. Export your audit scores and re-run with --ours to compute deltas.");
    return;
  }

  const checks = [
    { name: "Technical vs PSI performance", our: (o) => o.technical, ref: (r) => r.psi.performance, pass: (d, o, ref) => d <= 10 && band(o) === band(ref) },
    { name: "Accessibility vs PSI a11y (band)", our: (o) => o.accessibility, ref: (r) => r.psi.accessibility, pass: (d, o, ref) => band(o) === band(ref) },
    { name: "On-Page SEO vs PSI seo", our: (o) => o.onPageSEO, ref: (r) => r.psi.seo, pass: (d) => d <= 10 },
  ];

  let allPass = true;
  for (const c of checks) {
    const pairs = [];
    const results = [];
    for (const r of rows) {
      if (!r.ours) continue;
      const o = c.our(r.ours), ref = c.ref(r);
      if (typeof o !== "number" || typeof ref !== "number") continue;
      const d = Math.abs(o - ref);
      const ok = c.pass(d, o, ref);
      if (!ok) allPass = false;
      pairs.push([o, ref]);
      results.push({ url: r.url.slice(0, 45), ours: o, reference: ref, delta: d, ok: ok ? "✓" : "✗" });
    }
    const meanDelta = results.length ? (results.reduce((s, x) => s + x.delta, 0) / results.length).toFixed(1) : "-";
    console.log(`\n== ${c.name} == mean |Δ| ${meanDelta}, Spearman ${spearman(pairs) ?? "n/a"}, ${results.filter((x) => x.ok === "✓").length}/${results.length} pass`);
    console.table(results);
  }

  // Header grade: ours vs securityheaders.com (±1 letter step)
  const gradeResults = [];
  for (const r of rows) {
    if (!r.ours?.headerGrade || !r.shGrade) continue;
    const dist = gradeDistance(r.ours.headerGrade.toUpperCase(), r.shGrade);
    const ok = dist != null && dist <= 1;
    if (!ok) allPass = false;
    gradeResults.push({ url: r.url.slice(0, 45), ours: r.ours.headerGrade, securityheaders: r.shGrade, steps: dist ?? "-", ok: ok ? "✓" : "✗" });
  }
  if (gradeResults.length) {
    console.log("\n== Header grade vs securityheaders.com (±1 step) ==");
    console.table(gradeResults);
  }

  console.log(`\n======== CALIBRATION ${allPass ? "PASS ✓" : "FAIL ✗ — investigate before demoing"} ========`);
  process.exitCode = allPass ? 0 : 2;
}

main().catch((e) => { console.error(e); process.exit(1); });
