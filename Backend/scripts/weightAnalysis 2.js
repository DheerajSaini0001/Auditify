// Objective weight analysis over batchAudit.js output — SCORING justification study.
//
// Applies the two standard "objective weighting" methods from the MCDM literature
// to real audit data, at both the parameter level (within each section) and the
// section level (within the page score):
//
//   • Entropy Weight Method — a criterion that varies more across sites carries
//     more information; near-constant criteria carry none.
//   • CRITIC (Criteria Importance Through Intercriteria Correlation) — weight ∝
//     contrast intensity (std dev) × conflict (1 − correlation with the others);
//     penalizes redundant criteria that duplicate what others already measure.
//
// Neither method knows business importance — they measure INFORMATION content.
// The output is meant to be read NEXT TO the spec weights: a param with high spec
// weight but zero information (never varies) or high redundancy (r > 0.8 with a
// sibling) is where the spec weighting is empirically weakest.
//
// Usage: node scripts/weightAnalysis.js <outDir> [--min-sites 8] [--json report.json]

import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const dir = args[0];
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const MIN_SITES = Number(opt("min-sites", 8));
const jsonOut = opt("json", null);

if (!dir) { console.error("Usage: node scripts/weightAnalysis.js <outDir> [--min-sites 8] [--json report.json]"); process.exit(1); }

// ── Load completed, non-bot-protected reports ────────────────────────────────
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
const reports = [];
for (const f of files) {
  try {
    const r = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
    if (r.batchStatus !== "completed") continue;
    if (r.isBotProtected) continue;
    if (typeof r.score !== "number" || r.score <= 0) continue;
    reports.push({ file: f, ...r });
  } catch { /* skip unparseable */ }
}
console.log(`Loaded ${reports.length}/${files.length} usable reports from ${dir}\n`);
if (reports.length < 5) { console.error("Too few reports for any meaningful statistics."); process.exit(1); }

const SECTIONS = [
  ["technicalPerformance", "Technical"],
  ["onPageSEO", "On-Page SEO"],
  ["accessibility", "Accessibility"],
  ["securityOrCompliance", "Security"],
  ["UXOrContentStructure", "UX"],
  ["conversionAndLeadFlow", "Conversion"],
  ["aioReadiness", "AIO"],
  ["aeo", "AEO"],
];

// ── Parameter extraction: walk a section object, collect {name → 0-100 score} ──
// A "parameter" is any direct child object with a numeric score/Percentage that
// isn't flagged info-only / not-calculated. Non-param housekeeping keys skipped.
const SKIP_KEYS = new Set(["Percentage", "Graded_Percentage", "Confidence", "Score_Breakdown", "Schema", "meta", "details", "Recommendations", "recommendations"]);
const paramScore = (v) => {
  if (!v || typeof v !== "object") return null;
  if (v.infoOnly || v.notCalculated || v.status === "not_applicable") return null;
  const s = typeof v.score === "number" ? v.score : typeof v.Percentage === "number" ? v.Percentage : null;
  return typeof s === "number" && isFinite(s) ? Math.max(0, Math.min(100, s)) : null;
};
const extractParams = (sectionObj) => {
  const out = {};
  if (!sectionObj || typeof sectionObj !== "object") return out;
  for (const [k, v] of Object.entries(sectionObj)) {
    if (SKIP_KEYS.has(k)) continue;
    const s = paramScore(v);
    if (s !== null) out[k] = s;
  }
  return out;
};

// ── Stats helpers ─────────────────────────────────────────────────────────────
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const std = (a) => { const m = mean(a); return Math.sqrt(mean(a.map((x) => (x - m) ** 2))); };
const pearson = (a, b) => {
  const ma = mean(a), mb = mean(b), sa = std(a), sb = std(b);
  if (sa === 0 || sb === 0) return 0;
  return mean(a.map((x, i) => (x - ma) * (b[i] - mb))) / (sa * sb);
};

// Entropy weights over a matrix (rows = sites, cols = criteria).
const entropyWeights = (matrix, names) => {
  const n = matrix.length, m = names.length;
  const k = 1 / Math.log(n);
  const d = names.map((_, j) => {
    const col = matrix.map((row) => row[j]);
    const sum = col.reduce((a, b) => a + b, 0);
    if (sum === 0) return 0; // no information at all
    let e = 0;
    for (const x of col) { const p = x / sum; if (p > 0) e -= k * p * Math.log(p); }
    return 1 - e; // divergence
  });
  const total = d.reduce((a, b) => a + b, 0);
  return d.map((x) => (total > 0 ? x / total : 0));
};

// CRITIC weights over a matrix.
const criticWeights = (matrix, names) => {
  const m = names.length;
  const cols = names.map((_, j) => matrix.map((row) => row[j]));
  // min-max normalize each column (constant columns stay all-0 → zero weight)
  const norm = cols.map((col) => {
    const lo = Math.min(...col), hi = Math.max(...col);
    return hi > lo ? col.map((x) => (x - lo) / (hi - lo)) : col.map(() => 0);
  });
  const sds = norm.map((col) => std(col));
  const C = names.map((_, j) => {
    let conflict = 0;
    for (let k2 = 0; k2 < m; k2++) if (k2 !== j) conflict += 1 - pearson(norm[j], norm[k2]);
    return sds[j] * conflict;
  });
  const total = C.reduce((a, b) => a + b, 0);
  return C.map((x) => (total > 0 ? x / total : 0));
};

const fmt = (x, w = 6) => String(x).padStart(w);
const pct = (x) => (100 * x).toFixed(1).padStart(5);

const analysis = { nSites: reports.length, sites: reports.map((r) => r.url), sections: {}, sectionLevel: {} };

// ── 1. Parameter-level analysis per section ──────────────────────────────────
for (const [field, label] of SECTIONS) {
  // union of parameter names measured on ≥ MIN_SITES sites
  const perSite = reports.map((r) => extractParams(r[field]));
  const counts = {};
  perSite.forEach((p) => Object.keys(p).forEach((k) => (counts[k] = (counts[k] || 0) + 1)));
  const names = Object.keys(counts).filter((k) => counts[k] >= MIN_SITES).sort();
  if (!names.length) { console.log(`── ${label}: no parameters measured on ≥${MIN_SITES} sites\n`); continue; }

  // matrix over the sites that have ALL selected params? No — entropy/CRITIC need a
  // complete matrix; impute a site's missing param with the param's mean (N/A-renorm analog).
  const colMeans = names.map((k) => {
    const vals = perSite.map((p) => p[k]).filter((v) => v !== undefined);
    return mean(vals);
  });
  const matrix = perSite.map((p) => names.map((k, j) => (p[k] !== undefined ? p[k] : colMeans[j])));

  const ew = entropyWeights(matrix, names);
  const cw = criticWeights(matrix, names);

  // redundancy clusters: pairs with |r| > 0.8
  const redundant = [];
  for (let a = 0; a < names.length; a++)
    for (let b = a + 1; b < names.length; b++) {
      const colA = matrix.map((r) => r[a]), colB = matrix.map((r) => r[b]);
      if (std(colA) === 0 || std(colB) === 0) continue;
      const r = pearson(colA, colB);
      if (Math.abs(r) > 0.8) redundant.push([names[a], names[b], r.toFixed(2)]);
    }

  console.log(`── ${label} — ${names.length} params, ${reports.length} sites ──`);
  console.log(`${"param".padEnd(36)} ${fmt("n", 3)} ${fmt("mean")} ${fmt("std")} ${fmt("min")} ${fmt("max")}  entW%  critW%  flag`);
  const rows = names.map((k, j) => {
    const vals = perSite.map((p) => p[k]).filter((v) => v !== undefined);
    const s = std(vals);
    const flag = s === 0 ? (vals[0] === 0 ? "ALL-ZERO (no info)" : vals[0] === 100 ? "ALL-100 (no info)" : "CONSTANT (no info)") : s < 5 ? "low-variance" : "";
    return { name: k, n: vals.length, mean: +mean(vals).toFixed(1), std: +s.toFixed(1), min: Math.min(...vals), max: Math.max(...vals), entW: +(ew[j] * 100).toFixed(1), critW: +(cw[j] * 100).toFixed(1), flag };
  });
  rows.sort((a, b) => b.critW - a.critW);
  for (const r of rows)
    console.log(`${r.name.padEnd(36)} ${fmt(r.n, 3)} ${fmt(r.mean)} ${fmt(r.std)} ${fmt(r.min)} ${fmt(r.max)}  ${pct(r.entW / 100)}  ${pct(r.critW / 100)}  ${r.flag}`);
  if (redundant.length) {
    console.log(`  redundancy (|r|>0.8):`);
    redundant.forEach(([a, b, r]) => console.log(`    ${a} ↔ ${b}  r=${r}`));
  }
  console.log("");
  analysis.sections[label] = { params: rows, redundantPairs: redundant };
}

// ── 2. Section-level analysis ─────────────────────────────────────────────────
const secMatrix = reports.map((r) => SECTIONS.map(([f]) => (typeof r[f]?.Percentage === "number" ? r[f].Percentage : 0)));
const secNames = SECTIONS.map(([, l]) => l);
const secEw = entropyWeights(secMatrix, secNames);
const secCw = criticWeights(secMatrix, secNames);

console.log(`── SECTION LEVEL — ${reports.length} sites ──`);
console.log(`${"section".padEnd(14)} ${fmt("mean")} ${fmt("std")} ${fmt("min")} ${fmt("max")}  entW%  critW%`);
secNames.forEach((nm, j) => {
  const col = secMatrix.map((r) => r[j]);
  console.log(`${nm.padEnd(14)} ${fmt(+mean(col).toFixed(1))} ${fmt(+std(col).toFixed(1))} ${fmt(Math.min(...col))} ${fmt(Math.max(...col))}  ${pct(secEw[j])}  ${pct(secCw[j])}`);
  analysis.sectionLevel[nm] = { mean: +mean(col).toFixed(1), std: +std(col).toFixed(1), entW: +(secEw[j] * 100).toFixed(1), critW: +(secCw[j] * 100).toFixed(1) };
});

console.log(`\nsection correlation matrix (r):`);
console.log("              " + secNames.map((n) => n.slice(0, 6).padStart(7)).join(""));
secNames.forEach((nm, a) => {
  const row = secNames.map((_, b) => pearson(secMatrix.map((r) => r[a]), secMatrix.map((r) => r[b])).toFixed(2).padStart(7)).join("");
  console.log(nm.slice(0, 12).padEnd(14) + row);
});

if (jsonOut) { fs.writeFileSync(jsonOut, JSON.stringify(analysis, null, 2)); console.log(`\nWrote ${jsonOut}`); }
