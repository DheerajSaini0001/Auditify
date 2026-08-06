/**
 * reportPdfTemplate — the HTML behind the downloadable audit report.
 *
 * Shape of the document (and why it is shaped that way):
 *
 *   p1  Executive summary   — one page a dealer principal can read in 30 seconds:
 *                             overall score, band, check tallies, pillar bars.
 *   p2  Action plan         — the issues ranked by what they cost THIS page type,
 *                             then the fixes, numbered.
 *   p3+ Pillar detail       — every parameter, issues expanded, passes collapsed.
 *   pN  Methodology         — how the score is built and what the bands mean.
 *
 * The previous version rendered one full-height card per parameter (a hard
 * `min-height: 400px`, commented "ensuring high page count") and pasted the raw
 * meta object in as JSON. That produced a ~150-page document whose first useful
 * sentence was on page 4. Length is not the deliverable — the ranked fix list is.
 *
 * Parity rule: the flatten/normalise helpers below mirror
 * Frontend/src/utils/sectionFindings.js field for field. A finding read on screen
 * and the same finding in the downloaded PDF must not be able to disagree, so if
 * one side's precedence chain changes, change the other.
 */

import { weightsForPageType } from "./sectionWeights.js";

// ── Brand + score tokens ────────────────────────────────────────────────────
// Mirrors Frontend/src/index.css (@theme) and utils/statusColors.js. Hard-coded
// rather than imported because this file renders in Chromium with no stylesheet
// pipeline — but the values are the brand's, not new ones.
const C = {
  ink: "#0F1C2C",       // Heritage Navy — headings
  navy: "#101C2C",
  muted: "#5C6674",     // Graphite — body copy
  faint: "#8B949E",     // Steel Gray — captions
  line: "#E4E1D9",      // warm border
  lineSoft: "#EFEBE3",
  ivory: "#F7F5F0",     // Warm Ivory — page bands
  card: "#FFFFFF",
  accent: "#F26419",    // Performance Orange
  accentSoft: "#FDE9DD",
};

// The five product score bands (statusColors.js). Ordered high → low.
const SCORE_BANDS = [
  { min: 90, label: "Excellent",         hex: "#22C55E", ink: "#15803D", soft: "#E8F8EE" },
  { min: 75, label: "Good",              hex: "#84CC16", ink: "#4D7C0F", soft: "#F0F7E0" },
  { min: 50, label: "Needs Improvement", hex: "#F59E0B", ink: "#B45309", soft: "#FEF3E0" },
  { min: 25, label: "Poor",              hex: "#F97316", ink: "#C2410C", soft: "#FEEFE6" },
  { min: 0,  label: "Critical",          hex: "#EF4444", ink: "#B91C1C", soft: "#FDECEC" },
];

const bandFor = (score) => {
  const n = Number(score);
  if (score === null || score === undefined || score === "" || !Number.isFinite(n)) return null;
  return SCORE_BANDS.find((b) => n >= b.min) || SCORE_BANDS[SCORE_BANDS.length - 1];
};

const STATUS_STYLE = {
  pass:    { label: "Pass",    hex: "#22C55E", ink: "#15803D", soft: "#E8F8EE" },
  warning: { label: "Warning", hex: "#F59E0B", ink: "#B45309", soft: "#FEF3E0" },
  fail:    { label: "Fail",    hex: "#EF4444", ink: "#B91C1C", soft: "#FDECEC" },
  na:      { label: "N/A",     hex: "#8B949E", ink: "#5C6674", soft: "#F1F0EC" },
};

// Section key → the label used everywhere else, the name the worker writes into
// `sectionScore`, and a one-line "what this pillar measures" for its detail page.
// Order is A..H — the same order weightsForPageType() returns, so the index doubles
// as the weight lookup.
const SECTIONS = [
  {
    key: "technicalPerformance", title: "Technical Performance", scoreName: "Technical Performance",
    blurb: "Load speed, Core Web Vitals and render behaviour — lab measurements plus real-world Chrome UX data.",
  },
  {
    key: "onPageSEO", title: "On-Page SEO", scoreName: "On-Page SEO",
    blurb: "Titles, metadata, headings, links, images and content relevance as search engines read them.",
  },
  {
    key: "accessibility", title: "Accessibility", scoreName: "Accessibility",
    blurb: "WCAG-aligned checks: contrast, keyboard operation, labelling, structure and assistive-tech support.",
  },
  {
    key: "securityOrCompliance", title: "Security & Compliance", scoreName: "Security/Compliance",
    blurb: "Transport security, response headers, cookie and privacy disclosures, and exposure of known weaknesses.",
  },
  {
    key: "UXOrContentStructure", title: "UX & Content Structure", scoreName: "UX & Content Structure",
    blurb: "Navigation, readability, layout stability and how clearly the page organises what it is offering.",
  },
  {
    key: "conversionAndLeadFlow", title: "Conversion & Lead Flow", scoreName: "Conversion & Lead Flow",
    blurb: "Calls to action, forms, contact paths and everything between a visitor arriving and a lead landing.",
  },
  {
    key: "aioReadiness", title: "AIO Readiness", scoreName: "AIO Readiness",
    blurb: "How well the page can be parsed, quoted and reused by AI assistants and generative search surfaces.",
  },
  {
    key: "aeo", title: "AEO (Answer Engine Optimization)", scoreName: "AEO",
    blurb: "Whether answer engines can find, trust and cite this page when a customer asks a question it answers.",
  },
];

// ── Escaping ────────────────────────────────────────────────────────────────
// Everything below flows from the scanned site (recommendations, causes, details)
// or a user-supplied URL, and is rendered by Chromium — so every interpolation is
// an injection vector until it goes through here.
const esc = (val) => String(val ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");

const clamp = (text, max) => {
  const s = String(text ?? "").replace(/\s+/g, " ").trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};

const prettyName = (key) => String(key)
  .replace(/_/g, " ")
  .replace(/([a-z])([A-Z])/g, "$1 $2")
  .replace(/\b\w/g, (c) => c.toUpperCase());

// ── Metric flattening (parity with Frontend/src/utils/sectionFindings.js) ────

const NON_METRIC_KEYS = new Set([
  "Percentage", "Graded_Percentage", "Score_Breakdown", "Confidence", "Coverage",
  "Note", "Band", "Real_User_Experience", "Schema", "siteSchema", "Section_Score",
  "score", "grade", "Focus_Order", "Focusable_Content", "Tab_Index", "Aria_Hidden_Focus",
  // Section-level bookkeeping that only exists on the server-side shapes.
  "Grade", "pageType", "parametersScored", "parametersNotCalculated", "locked",
  "passedCount", "warningCount", "failedCount",
]);

const normalizeStatus = (metric) => {
  // AEO marks params it could not probe, and params that do not apply to this page
  // type, on the metric itself rather than through `status`. Neither is a failure.
  if (metric?.notCalculated === true) return "na";
  if (metric?.infoOnly === true && metric?.applicable === false) return "na";

  // A renormalized-out metric carries a null score AND no status: it was not
  // measured, which is not the same as failing.
  if (metric?.meta?.notScored || metric?.score == null) {
    if (!metric?.status) return "na";
  }
  const raw = String(metric?.status ?? metric?.Status ?? "").toLowerCase();
  if (raw.includes("pass") || raw === "good") return "pass";
  if (raw.includes("warn") || raw.includes("needs")) return "warning";
  if (raw.includes("fail") || raw.includes("poor")) return "fail";
  if (typeof metric?.score === "number") {
    return metric.score >= 90 ? "pass" : metric.score >= 50 ? "warning" : "fail";
  }
  return "na";
};

// Keys already rendered as prose elsewhere in the card, or pure bookkeeping —
// showing them again in the evidence strip is noise.
const EVIDENCE_SKIP = new Set([
  "value", "how_to_fix", "why_this_occurred", "notScored", "present", "weight",
  "applicable", "infoOnly", "notCalculated", "score", "status", "cause",
  "recommendation", "details", "description",
]);

/** Up to six scalar meta fields, as `label: value` chips. Replaces the old raw JSON dump. */
const readEvidence = (metric) => {
  const source = { ...(metric?.meta || {}) };
  if (metric?.details && typeof metric.details === "object" && !Array.isArray(metric.details)) {
    Object.assign(source, metric.details);
  }

  const out = [];
  for (const [key, raw] of Object.entries(source)) {
    if (EVIDENCE_SKIP.has(key) || out.length >= 6) continue;
    let value;
    if (raw === null || raw === undefined || raw === "") continue;
    else if (typeof raw === "boolean") {
      // A false flag is the absence of evidence, not evidence. A true one reads
      // better as a bare label — "P75" says more than "P75 true".
      if (!raw) continue;
      value = "";
    } else if (Array.isArray(raw)) {
      if (raw.length === 0 || raw.some((v) => typeof v === "object" && v !== null)) continue;
      value = `${raw.slice(0, 4).join(", ")}${raw.length > 4 ? ` +${raw.length - 4} more` : ""}`;
    } else if (typeof raw === "object") continue;
    else value = String(raw);

    out.push({ label: prettyName(key), value: clamp(value, 90) });
  }
  return out;
};

const readMetric = (metric, name) => {
  if (!metric || typeof metric !== "object" || Array.isArray(metric)) return null;

  const detailsRaw = metric.details ?? metric.Details ?? metric.description ?? metric.value;
  const details = typeof detailsRaw === "object" && detailsRaw !== null ? "" : String(detailsRaw ?? "");

  return {
    name,
    status: normalizeStatus(metric),
    score: typeof metric.score === "number" ? metric.score : null,
    details: clamp(details, 400),
    cause: clamp(metric.cause || metric.analysis?.cause || metric.meta?.why_this_occurred || "", 400),
    // Same precedence chain sectionFindings.js uses, so both surfaces quote the same fix.
    recommendation: clamp(
      metric.recommendation ||
      metric.analysis?.recommendation ||
      metric.meta?.how_to_fix ||
      metric.suggestion ||
      metric.Suggestion || "",
      400
    ),
    evidence: readEvidence(metric),
  };
};

/**
 * One section → the flat list of parameter results behind its score.
 * Core Web Vitals nest a level deeper (`{ lab, crux }`) and AEO hangs its
 * parameters off `params`; both are unwrapped here.
 */
const flattenSection = (section) => {
  if (!section || typeof section !== "object") return [];
  const source = section.params && typeof section.params === "object" ? section.params : section;

  const out = [];
  for (const [key, value] of Object.entries(source)) {
    if (NON_METRIC_KEYS.has(key)) continue;
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;

    const label = prettyName(key);
    if (value.lab || value.crux) {
      const lab = readMetric(value.lab, `${label} (lab)`);
      const crux = readMetric(value.crux, `${label} (real-world)`);
      if (lab) out.push(lab);
      if (crux) out.push(crux);
    } else {
      const metric = readMetric(value, label);
      if (metric) out.push(metric);
    }
  }
  return out;
};

const SEVERITY = { fail: 0, warning: 1, pass: 2, na: 3 };

// ── Small render helpers ────────────────────────────────────────────────────

const hostOf = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch { return String(url || "").replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]; }
};

const formatDate = (value) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  });
};

const bar = (score, width = 100) => {
  const band = bandFor(score);
  const pct = band ? Math.max(0, Math.min(100, Number(score))) : 0;
  return `<div class="bar" style="width:${width}px">
    <div class="bar-fill" style="width:${pct}%;background:${band ? band.hex : C.line}"></div>
  </div>`;
};

const donut = (score, size = 104) => {
  const band = bandFor(score);
  const r = 40;
  const circ = 2 * Math.PI * r;
  const pct = band ? Math.max(0, Math.min(100, Number(score))) : 0;
  const shown = band ? Math.round(Number(score)) : "—";
  return `<svg viewBox="0 0 96 96" width="${size}" height="${size}" class="donut">
    <circle cx="48" cy="48" r="${r}" fill="none" stroke="${C.lineSoft}" stroke-width="9"/>
    <circle cx="48" cy="48" r="${r}" fill="none" stroke="${band ? band.hex : C.line}" stroke-width="9"
      stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}"
      stroke-dashoffset="${(circ - (circ * pct) / 100).toFixed(1)}"
      transform="rotate(-90 48 48)"/>
    <text x="48" y="53" text-anchor="middle" font-size="27" font-weight="800" fill="${C.ink}">${shown}</text>
  </svg>`;
};

const statusChip = (status) => {
  const s = STATUS_STYLE[status] || STATUS_STYLE.na;
  return `<span class="chip" style="background:${s.soft};color:${s.ink}">${s.label}</span>`;
};

const bandChip = (score) => {
  const band = bandFor(score);
  if (!band) return `<span class="chip" style="background:${C.lineSoft};color:${C.muted}">Not run</span>`;
  return `<span class="chip" style="background:${band.soft};color:${band.ink}">${band.label}</span>`;
};

/**
 * Build the whole report document.
 *
 * @param {object} report            Completed audit report (Mongo doc or auditStore object).
 * @param {object} opts
 * @param {string|null} opts.logoDataUri  Brand logo, already inlined as a data URI.
 * @returns {string} A full HTML document.
 */
export const buildReportHtml = (report, { logoDataUri = null } = {}) => {
  const domain = hostOf(report.url);
  const generatedAt = formatDate(report.createdAt);
  const weights = weightsForPageType(report.pageType);

  // ── Gather every finding once, keyed by section ──
  const sectionViews = SECTIONS.map((sec, index) => {
    const data = report[sec.key];
    const scoreRow = Array.isArray(report.sectionScore)
      ? report.sectionScore.find((s) => s?.name === sec.scoreName)
      : null;
    const score = scoreRow && scoreRow.score !== null && scoreRow.score !== undefined
      ? Number(scoreRow.score)
      : (typeof data?.Percentage === "number" ? data.Percentage : null);

    const locked = !!data?.locked;
    const findings = locked ? [] : flattenSection(data);
    findings.sort((a, b) => SEVERITY[a.status] - SEVERITY[b.status] || a.name.localeCompare(b.name));

    const tally = { pass: 0, warning: 0, fail: 0, na: 0 };
    for (const f of findings) tally[f.status] += 1;
    // A gated section still ships its tallies (reportGating.js keeps them precisely
    // so the counts do not read as zero next to a real score).
    if (locked) {
      tally.pass = data.passedCount || 0;
      tally.warning = data.warningCount || 0;
      tally.fail = data.failedCount || 0;
    }

    return { ...sec, index, weight: weights[index] ?? 12, present: !!data, locked, score, findings, tally };
  });

  const scored = sectionViews.filter((s) => s.score !== null);
  const totals = sectionViews.reduce((acc, s) => {
    acc.pass += s.tally.pass; acc.warning += s.tally.warning;
    acc.fail += s.tally.fail; acc.na += s.tally.na;
    return acc;
  }, { pass: 0, warning: 0, fail: 0, na: 0 });
  const totalChecks = totals.pass + totals.warning + totals.fail + totals.na;

  const overall = typeof report.score === "number" ? report.score : null;
  const overallBand = bandFor(overall);
  const pillarsWithFails = sectionViews.filter((s) => s.tally.fail > 0).length;

  // ── Ranked issue list ──
  // Ordered by what the issue costs THIS page: how far below 100 it sits, doubled
  // for an outright failure, times the pillar's own weight for this page type
  // (sectionWeights.js). A failing Security check on a finance page outranks the
  // same check on a blog post, which is the whole point of the weighting.
  const issues = sectionViews
    .flatMap((sec) => sec.findings
      .filter((f) => f.status === "fail" || f.status === "warning")
      .map((f) => {
        const gap = 100 - (typeof f.score === "number" ? f.score : f.status === "fail" ? 0 : 60);
        return { ...f, pillar: sec.title, rank: gap * (f.status === "fail" ? 2 : 1) * sec.weight };
      }))
    .sort((a, b) => b.rank - a.rank);

  const priorityLabel = (f) => {
    if (f.status === "fail") return typeof f.score === "number" && f.score < 25 ? "Critical" : "High";
    return "Medium";
  };

  const topIssues = issues.slice(0, 14);

  // Fixes for things actually broken — a recommendation on a passing check is noise.
  // Deduped, because one root cause often produces the same instruction in several
  // checks. Then capped at two per pillar: the ranking is honest, but a weak pillar
  // with ten failures would otherwise fill the entire fix list and leave the reader
  // with nothing to do anywhere else on the site. Every one of them is still listed
  // in full in that pillar's detail pages.
  const FIX_LIMIT = 7;
  const PER_PILLAR = 2;
  const seenFix = new Set();
  const candidates = issues.filter((f) => {
    if (!f.recommendation) return false;
    const dedupeKey = f.recommendation.slice(0, 80).toLowerCase();
    if (seenFix.has(dedupeKey)) return false;
    seenFix.add(dedupeKey);
    return true;
  });

  const perPillar = new Map();
  const topFixes = candidates.filter((f) => {
    const used = perPillar.get(f.pillar) || 0;
    if (used >= PER_PILLAR) return false;
    perPillar.set(f.pillar, used + 1);
    return true;
  }).slice(0, FIX_LIMIT);
  // Short list because the whole site is healthy apart from one pillar — top back
  // up from the ranked remainder rather than under-delivering.
  if (topFixes.length < FIX_LIMIT) {
    const picked = new Set(topFixes);
    topFixes.push(...candidates.filter((f) => !picked.has(f)).slice(0, FIX_LIMIT - topFixes.length));
  }

  const pagesScanned = Math.max(1, Number(report.crawledPagesCount) || 1);
  const scopeLabel = report.report && report.report !== "All"
    ? clamp(String(report.report).split(",").map((s) => s.trim()).join(" · "), 90)
    : "All 8 pillars";

  // Our own capture, but it lands inside an attribute — anything that is not
  // base64 has no business being there, so it is dropped rather than escaped.
  const shot = /^[A-Za-z0-9+/=\s]+$/.test(String(report.screenshot || "")) ? report.screenshot : null;
  const thumbnail = shot
    ? `<div class="thumb"><img src="data:image/jpeg;base64,${shot.replace(/\s/g, "")}" alt=""></div>`
    : "";

  // ── p1 · Executive summary ────────────────────────────────────────────────
  const coverPage = `
  <section class="sheet">
    <header class="brandbar">
      ${logoDataUri
        ? `<img class="logo" src="${logoDataUri}" alt="DealerSiteAudit">`
        : `<div class="wordmark">DealerSiteAudit</div>`}
      <div class="brandbar-meta">
        <div class="eyebrow">Website Audit Report</div>
        <div>${esc(generatedAt)}</div>
      </div>
    </header>

    <div class="title-row">
      <div>
        <h1>Website Audit Summary for ${esc(domain)}</h1>
        <p class="url">${esc(clamp(report.url, 96))}</p>
        <div class="tags">
          <span class="tag">${esc(report.device || "Desktop")}</span>
          ${report.pageType ? `<span class="tag">${esc(prettyName(report.pageType))} page</span>` : ""}
          ${report.siteSubType ? `<span class="tag">${esc(prettyName(report.siteSubType))} site</span>` : ""}
          <span class="tag">${esc(scopeLabel)}</span>
          ${report.isBotProtected ? `<span class="tag tag-warn">Bot protection detected</span>` : ""}
        </div>
      </div>
      ${thumbnail}
    </div>

    <div class="stats">
      <div class="stat">
        <div class="stat-label">Overall Score</div>
        <div class="stat-main">
          ${donut(overall, 96)}
          <div>
            <div class="stat-strong" style="color:${overallBand ? overallBand.ink : C.muted}">
              ${overallBand ? esc(overallBand.label) : "Not scored"}
            </div>
            <div class="stat-note">Grade ${esc(report.grade || "—")}</div>
          </div>
        </div>
        <p class="stat-caption">Weighted across ${scored.length} pillar${scored.length === 1 ? "" : "s"}${
          report.pageType ? `, tilted for a ${esc(prettyName(report.pageType))} page` : ""}.</p>
      </div>

      <div class="stat">
        <div class="stat-label">Needs Attention</div>
        <div class="stat-figure" style="color:${totals.fail ? STATUS_STYLE.fail.ink : STATUS_STYLE.pass.ink}">${totals.fail}</div>
        <div class="stat-strong">failing checks</div>
        <p class="stat-caption">
          ${totals.warning} more raised a warning${pillarsWithFails ? `, across ${pillarsWithFails} pillar${pillarsWithFails === 1 ? "" : "s"}` : ""}.
        </p>
      </div>

      <div class="stat">
        <div class="stat-label">Checks Run</div>
        <table class="mini">
          <tr><td>Passed</td><td class="num" style="color:${STATUS_STYLE.pass.ink}">${totals.pass}</td></tr>
          <tr><td>Warnings</td><td class="num" style="color:${STATUS_STYLE.warning.ink}">${totals.warning}</td></tr>
          <tr><td>Failed</td><td class="num" style="color:${STATUS_STYLE.fail.ink}">${totals.fail}</td></tr>
          <tr><td>Not applicable</td><td class="num">${totals.na}</td></tr>
        </table>
        <p class="stat-caption">${totalChecks} parameters evaluated in total.</p>
      </div>

      <div class="stat">
        <div class="stat-label">Scope</div>
        <div class="stat-figure">${pagesScanned}</div>
        <div class="stat-strong">page${pagesScanned === 1 ? "" : "s"} scanned</div>
        <p class="stat-caption">
          ${pagesScanned === 1 ? "Single page, not the whole domain." : `Key pages across ${esc(domain)}.`}
          ${report.timeTaken ? `Completed in ${esc(report.timeTaken)}.` : ""}
        </p>
      </div>
    </div>

    <h2>Pillar Scores</h2>
    <table class="pillars">
      <thead>
        <tr><th>Pillar</th><th class="c">Weight</th><th>Score</th><th class="c">Rating</th><th class="c">Pass / Warn / Fail</th></tr>
      </thead>
      <tbody>
        ${sectionViews.map((s) => `
          <tr>
            <td class="name">${esc(s.title)}</td>
            <td class="c muted">${Math.round(s.weight)}%</td>
            <td class="scorecell">
              ${bar(s.score, 96)}
              <span class="scorenum" style="color:${bandFor(s.score)?.ink || C.faint}">
                ${s.score === null ? "—" : Math.round(s.score)}
              </span>
            </td>
            <td class="c">${bandChip(s.score)}</td>
            <td class="c muted tally">
              ${s.locked || s.present
                ? `${s.tally.pass} / ${s.tally.warning} / ${s.tally.fail}`
                : "not run"}
            </td>
          </tr>`).join("")}
      </tbody>
    </table>

    <div class="callout">
      <strong>How this score is built.</strong>
      Each pillar is scored independently from its own parameters, then combined with the weights above —
      which are set by the type of page audited${report.siteSubType ? ` and the type of business running the site` : ""},
      not applied flat. Pillars that could not be measured are excluded and the rest renormalised, so a
      missing measurement never counts as a failure. Bands: 90+ Excellent · 75+ Good · 50+ Needs Improvement ·
      25+ Poor · below 25 Critical.
    </div>
  </section>`;

  // ── p2 · Action plan ──────────────────────────────────────────────────────
  const actionPage = `
  <section class="sheet">
    <h2 class="lead">Priority Issues</h2>
    <p class="sub">Ranked by impact on this page — how far the check falls short, weighted by how much its pillar counts here.</p>
    ${topIssues.length ? `
    <table class="issues">
      <thead>
        <tr><th class="idx">#</th><th>Issue</th><th>Pillar</th><th class="c">Priority</th><th class="c">Score</th></tr>
      </thead>
      <tbody>
        ${topIssues.map((f, i) => `
          <tr>
            <td class="idx">${i + 1}</td>
            <td>
              <span class="issue-name">${esc(f.name)}</span>
              ${f.details ? `<span class="issue-detail">${esc(clamp(f.details, 150))}</span>` : ""}
            </td>
            <td class="muted">${esc(f.pillar)}</td>
            <td class="c">${statusChip(f.status)}<span class="prio">${priorityLabel(f)}</span></td>
            <td class="c num">${f.score === null ? "—" : Math.round(f.score)}</td>
          </tr>`).join("")}
      </tbody>
    </table>
    ${issues.length > topIssues.length
      ? `<p class="sub">Showing the top ${topIssues.length} of ${issues.length} open issues. Every one is listed in full in the pillar detail that follows.</p>`
      : ""}
    ` : `<div class="callout">No failing or warning checks were recorded on this audit.</div>`}

    <h2>Recommendations for ${esc(domain)}</h2>
    ${topFixes.length ? topFixes.map((f, i) => `
      <div class="rec">
        <div class="rec-num">${i + 1}</div>
        <div>
          <div class="rec-title">${esc(f.name)} <span class="rec-pillar">${esc(f.pillar)}</span></div>
          ${f.cause ? `<p class="rec-why">${esc(f.cause)}</p>` : ""}
          <p class="rec-fix">${esc(f.recommendation)}</p>
        </div>
      </div>`).join("")
      : `<div class="callout">No outstanding fixes — every measured parameter passed.</div>`}
  </section>`;

  // ── p3+ · Pillar detail ───────────────────────────────────────────────────
  const detailPages = sectionViews.filter((s) => s.present).map((sec) => {
    if (sec.locked) {
      return `
      <section class="sheet">
        ${pillarHeader(sec)}
        <div class="callout locked">
          <strong>Detail locked.</strong> This pillar's parameter-level findings and fixes are available on a
          signed-in account. The score and check counts above are the full picture of <em>what</em> is wrong;
          the detail is <em>why</em>, and how to fix it.
        </div>
      </section>`;
    }

    const failing = sec.findings.filter((f) => f.status === "fail" || f.status === "warning");
    const passing = sec.findings.filter((f) => f.status === "pass");
    const na = sec.findings.filter((f) => f.status === "na");

    return `
    <section class="sheet">
      ${pillarHeader(sec)}

      ${failing.length ? `
        <h3 class="group">Issues found <span class="count">${failing.length}</span></h3>
        ${failing.map((f) => findingCard(f)).join("")}
      ` : `<div class="callout">Every measured parameter in this pillar passed.</div>`}

      ${passing.length ? `
        <h3 class="group">Passing checks <span class="count">${passing.length}</span></h3>
        <table class="passes">
          <tbody>
            ${passing.map((f) => `
              <tr>
                <td class="dot"><span style="background:${STATUS_STYLE.pass.hex}"></span></td>
                <td class="name">${esc(f.name)}</td>
                <td class="muted">${esc(clamp(f.details, 130))}</td>
                <td class="num">${f.score === null ? "—" : Math.round(f.score)}</td>
              </tr>`).join("")}
          </tbody>
        </table>
      ` : ""}

      ${na.length ? `
        <h3 class="group">Not applicable <span class="count">${na.length}</span></h3>
        <p class="sub">Excluded from this pillar's score — these checks do not apply to this page, or could not be measured:
          ${na.map((f) => esc(f.name)).join(" · ")}.</p>
      ` : ""}
    </section>`;
  }).join("");

  // ── pN · Methodology ──────────────────────────────────────────────────────
  const methodologyPage = `
  <section class="sheet">
    <h2 class="lead">Methodology</h2>
    <p class="body">
      This report evaluates <strong>${esc(domain)}</strong> against ${totalChecks} parameters grouped into eight pillars.
      Every parameter is measured directly against the live page — rendered in a real browser at
      ${esc(report.device || "desktop")} viewport — rather than inferred from a checklist.
    </p>
    <table class="legend">
      <thead><tr><th>Result</th><th>What it means</th><th>Action</th></tr></thead>
      <tbody>
        <tr><td>${statusChip("pass")}</td><td>The parameter meets its threshold.</td><td class="muted">None required.</td></tr>
        <tr><td>${statusChip("warning")}</td><td>Measurably short of the threshold, but not broken.</td><td class="muted">Schedule within the current sprint.</td></tr>
        <tr><td>${statusChip("fail")}</td><td>Below the acceptable threshold; costing traffic, leads or compliance.</td><td class="muted">Fix first — see Priority Issues.</td></tr>
        <tr><td>${statusChip("na")}</td><td>Does not apply to this page, or could not be measured.</td><td class="muted">Excluded from the score.</td></tr>
      </tbody>
    </table>

    <table class="legend">
      <thead><tr><th>Band</th><th>Range</th><th>Reading</th></tr></thead>
      <tbody>
        ${SCORE_BANDS.map((b, i) => {
          const upper = i === 0 ? 100 : SCORE_BANDS[i - 1].min - 1;
          return `<tr>
            <td><span class="chip" style="background:${b.soft};color:${b.ink}">${b.label}</span></td>
            <td class="num">${b.min}–${upper}</td>
            <td class="muted">${[
              "Competitive. Hold the line and re-audit after releases.",
              "Solid, with specific gaps worth closing.",
              "Real losses are likely; prioritise the ranked list.",
              "Structural problems across several pillars.",
              "Urgent — the page is failing its basic job.",
            ][i]}</td>
          </tr>`;
        }).join("")}
      </tbody>
    </table>

    <h2>Next steps</h2>
    <ol class="steps">
      <li>Work the Priority Issues table top-down — it is already ordered by what each fix is worth on this page type.</li>
      <li>Hand the Recommendations section to whoever owns the site; each one names the parameter, the cause and the fix.</li>
      <li>Clear the failures before the warnings. A warning on a heavily-weighted pillar can still outrank a failure on a light one — the ranking accounts for that.</li>
      <li>Re-run the audit after deployment. Lab measurements respond immediately; real-world (CrUX) data trails by up to 28 days.</li>
    </ol>

    <div class="endmark">
      ${logoDataUri ? `<img src="${logoDataUri}" alt="" style="height:34px;opacity:.35">` : ""}
      <p>End of report · ${esc(domain)} · ${esc(generatedAt)}</p>
    </div>
  </section>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Website Audit Report — ${esc(domain)}</title>
<style>
  /* Manrope is the brand face; the stack falls through to the host's own
     sans if the font service is unreachable, so the export never blocks on it. */
  @font-face { font-family: 'Manrope'; font-style: normal; font-weight: 400 800; src: local('Manrope'); }

  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    font-family: 'Manrope', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 11.5px;
    line-height: 1.55;
    color: ${C.muted};
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .sheet { padding: 0 40px; break-after: page; }
  .sheet:last-child { break-after: auto; }

  h1 { font-size: 25px; line-height: 1.2; font-weight: 800; color: ${C.ink}; margin: 0 0 6px; letter-spacing: -.4px; }
  h2 {
    font-size: 15px; font-weight: 800; color: ${C.ink}; margin: 26px 0 10px;
    padding-bottom: 7px; border-bottom: 2px solid ${C.line}; position: relative;
  }
  h2::after { content: ""; position: absolute; left: 0; bottom: -2px; width: 46px; height: 2px; background: ${C.accent}; }
  h2.lead { margin-top: 0; }
  h3.group {
    font-size: 11px; font-weight: 800; color: ${C.ink}; text-transform: uppercase; letter-spacing: .8px;
    margin: 20px 0 9px;
  }
  h3.group .count {
    display: inline-block; margin-left: 6px; padding: 1px 7px; border-radius: 20px;
    background: ${C.ivory}; color: ${C.muted}; font-size: 10px; letter-spacing: 0;
  }
  p { margin: 0 0 8px; }
  .sub { font-size: 10.5px; color: ${C.faint}; margin: 0 0 12px; }
  .body { font-size: 12px; }
  .muted { color: ${C.muted}; }
  .num { font-variant-numeric: tabular-nums; }
  .c { text-align: center; }

  /* ── Cover ── */
  .brandbar {
    display: flex; justify-content: space-between; align-items: center;
    padding-bottom: 14px; border-bottom: 1px solid ${C.line}; margin-bottom: 22px;
  }
  .logo { height: 30px; width: auto; display: block; }
  .wordmark { font-size: 17px; font-weight: 800; color: ${C.ink}; letter-spacing: -.4px; }
  .brandbar-meta { text-align: right; font-size: 10.5px; color: ${C.faint}; }
  .eyebrow { font-size: 9px; font-weight: 800; letter-spacing: 1.4px; text-transform: uppercase; color: ${C.accent}; }

  .title-row { display: flex; gap: 22px; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .url { font-size: 11px; color: ${C.faint}; word-break: break-all; margin-bottom: 9px; }
  .tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .tag {
    font-size: 9.5px; font-weight: 700; padding: 3px 9px; border-radius: 20px;
    background: ${C.ivory}; color: ${C.muted}; border: 1px solid ${C.line};
  }
  .tag-warn { background: ${C.accentSoft}; color: #A2410B; border-color: #F8C9AC; }
  .thumb {
    flex: 0 0 168px; height: 112px; border: 1px solid ${C.line}; border-radius: 8px;
    overflow: hidden; background: ${C.ivory};
  }
  .thumb img { width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block; }

  .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 6px; }
  .stat {
    border: 1px solid ${C.line}; border-radius: 10px; padding: 13px 14px 12px;
    background: ${C.card}; break-inside: avoid;
  }
  .stat-label {
    font-size: 8.5px; font-weight: 800; letter-spacing: 1.1px; text-transform: uppercase;
    color: ${C.faint}; margin-bottom: 8px;
  }
  .stat-main { display: flex; align-items: center; gap: 8px; }
  .donut { flex: 0 0 auto; margin-left: -6px; }
  .stat-figure { font-size: 34px; font-weight: 800; color: ${C.ink}; line-height: 1.05; }
  .stat-strong { font-size: 11.5px; font-weight: 800; color: ${C.ink}; }
  .stat-note { font-size: 10px; color: ${C.faint}; font-weight: 700; }
  .stat-caption { font-size: 9.5px; color: ${C.faint}; line-height: 1.45; margin: 8px 0 0; }
  .mini { width: 100%; border-collapse: collapse; }
  .mini td { padding: 2.5px 0; font-size: 10.5px; }
  .mini td.num { text-align: right; font-weight: 800; font-size: 12px; }

  /* ── Tables ── */
  table { width: 100%; border-collapse: collapse; }
  thead th {
    font-size: 8.5px; font-weight: 800; letter-spacing: .9px; text-transform: uppercase;
    color: ${C.faint}; text-align: left; padding: 0 8px 6px; border-bottom: 1px solid ${C.line};
  }
  tbody td { padding: 7px 8px; border-bottom: 1px solid ${C.lineSoft}; vertical-align: middle; font-size: 11px; }
  tbody tr:last-child td { border-bottom: none; }
  td.name { font-weight: 700; color: ${C.ink}; }

  .pillars td.scorecell { white-space: nowrap; }
  .bar { display: inline-block; height: 6px; background: ${C.lineSoft}; border-radius: 6px; overflow: hidden; vertical-align: middle; }
  .bar-fill { height: 100%; border-radius: 6px; }
  .scorenum { display: inline-block; min-width: 26px; margin-left: 9px; font-weight: 800; font-size: 12px; vertical-align: middle; }
  .tally { font-size: 10.5px; font-variant-numeric: tabular-nums; }

  .chip {
    display: inline-block; padding: 2px 8px; border-radius: 20px;
    font-size: 9px; font-weight: 800; letter-spacing: .3px; text-transform: uppercase; white-space: nowrap;
  }

  .issues td.idx, .issues th.idx { width: 22px; color: ${C.faint}; font-weight: 800; }
  .issue-name { display: block; font-weight: 700; color: ${C.ink}; }
  .issue-detail { display: block; font-size: 10px; color: ${C.faint}; margin-top: 1px; }
  .prio { display: block; font-size: 9px; color: ${C.faint}; font-weight: 700; margin-top: 3px; }

  .passes td { padding: 5px 8px; font-size: 10.5px; }
  .passes td.dot { width: 12px; padding-right: 0; }
  .passes td.dot span { display: inline-block; width: 6px; height: 6px; border-radius: 50%; }
  .passes td.name { width: 30%; }
  .passes td.num { width: 34px; text-align: right; font-weight: 800; color: ${C.ink}; }

  .legend { margin-bottom: 18px; }
  .legend td { font-size: 11px; }

  /* ── Findings ── */
  .finding {
    border: 1px solid ${C.line}; border-left: 3px solid ${C.line}; border-radius: 8px;
    padding: 11px 14px; margin-bottom: 9px; break-inside: avoid; background: ${C.card};
  }
  .finding-head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; margin-bottom: 5px; }
  .finding-head h4 { margin: 0; font-size: 12px; font-weight: 800; color: ${C.ink}; }
  .finding-score { font-size: 10px; font-weight: 800; color: ${C.faint}; white-space: nowrap; }
  .finding p { font-size: 10.5px; margin: 0 0 5px; }
  .lbl { font-weight: 800; color: ${C.ink}; }
  .fix { background: ${C.ivory}; border-radius: 6px; padding: 7px 9px; margin-top: 7px; font-size: 10.5px; }
  .fix .lbl { color: #A2410B; }
  .evidence { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 7px; }
  .ev {
    font-size: 9px; padding: 2px 7px; border-radius: 5px; background: ${C.ivory};
    border: 1px solid ${C.lineSoft}; color: ${C.muted};
  }
  .ev b { color: ${C.ink}; font-weight: 700; }

  /* ── Pillar header ── */
  .pillar-head {
    display: flex; align-items: center; gap: 16px; padding: 14px 16px; margin-bottom: 16px;
    background: ${C.ivory}; border: 1px solid ${C.line}; border-radius: 10px; break-inside: avoid;
  }
  .pillar-head h2 { margin: 0 0 3px; border: none; padding: 0; font-size: 17px; }
  .pillar-head h2::after { display: none; }
  .pillar-head p { font-size: 10.5px; color: ${C.muted}; margin: 0; }
  .pillar-figures { margin-left: auto; text-align: right; white-space: nowrap; }
  .pillar-score { font-size: 30px; font-weight: 800; line-height: 1; }
  .pillar-tally { font-size: 10px; color: ${C.faint}; margin-top: 5px; }

  /* ── Blocks ── */
  .callout {
    background: ${C.ivory}; border: 1px solid ${C.line}; border-left: 3px solid ${C.accent};
    border-radius: 8px; padding: 11px 14px; font-size: 10.5px; margin: 14px 0; break-inside: avoid;
  }
  .callout strong { color: ${C.ink}; }
  .callout.locked { border-left-color: ${C.faint}; }

  .rec { display: flex; gap: 11px; padding: 10px 0; border-bottom: 1px solid ${C.lineSoft}; break-inside: avoid; }
  .rec:last-of-type { border-bottom: none; }
  .rec-num {
    flex: 0 0 22px; height: 22px; border-radius: 50%; background: ${C.ink}; color: #fff;
    font-size: 10.5px; font-weight: 800; text-align: center; line-height: 22px;
  }
  .rec-title { font-size: 12px; font-weight: 800; color: ${C.ink}; margin-bottom: 3px; }
  .rec-pillar { font-size: 9px; font-weight: 700; color: ${C.faint}; text-transform: uppercase; letter-spacing: .6px; margin-left: 6px; }
  .rec-why { font-size: 10.5px; color: ${C.muted}; margin: 0 0 4px; }
  .rec-fix { font-size: 10.5px; color: ${C.ink}; margin: 0; }

  .steps { margin: 0; padding-left: 18px; font-size: 11.5px; }
  .steps li { margin-bottom: 7px; }
  .endmark { margin-top: 40px; text-align: center; }
  .endmark p { font-size: 10px; color: ${C.faint}; margin-top: 8px; }
</style>
</head>
<body>
  ${coverPage}
  ${actionPage}
  ${detailPages}
  ${methodologyPage}
</body>
</html>`;
};

// ── Fragments used by buildReportHtml ───────────────────────────────────────

function pillarHeader(sec) {
  const band = bandFor(sec.score);
  return `
  <div class="pillar-head">
    <div>
      <h2>${esc(sec.title)}</h2>
      <p>${esc(sec.blurb)}</p>
    </div>
    <div class="pillar-figures">
      <div class="pillar-score" style="color:${band ? band.ink : C.faint}">${sec.score === null ? "—" : Math.round(sec.score)}</div>
      <div>${bandChip(sec.score)}</div>
      <div class="pillar-tally">${sec.tally.pass} passed · ${sec.tally.warning} warning · ${sec.tally.fail} failed</div>
    </div>
  </div>`;
}

function findingCard(f) {
  const s = STATUS_STYLE[f.status] || STATUS_STYLE.na;
  return `
  <div class="finding" style="border-left-color:${s.hex}">
    <div class="finding-head">
      <h4>${esc(f.name)}</h4>
      <div class="finding-score">
        ${statusChip(f.status)}
        ${f.score === null ? "" : `<span style="margin-left:6px">${Math.round(f.score)}/100</span>`}
      </div>
    </div>
    ${f.details ? `<p>${esc(f.details)}</p>` : ""}
    ${f.cause ? `<p><span class="lbl">Why:</span> ${esc(f.cause)}</p>` : ""}
    ${f.evidence.length ? `<div class="evidence">${f.evidence
      .map((e) => `<span class="ev"><b>${esc(e.label)}</b>${e.value ? ` ${esc(e.value)}` : ""}</span>`).join("")}</div>` : ""}
    ${f.recommendation ? `<div class="fix"><span class="lbl">Fix:</span> ${esc(f.recommendation)}</div>` : ""}
  </div>`;
}

/** Bare hostname for a report's URL — used by the PDF footer and file name. */
export const reportDomain = (url) => hostOf(url);

/** `DealerSiteAudit-example-com-2026-08-06.pdf` — sortable, and safe on every OS. */
export const reportFileName = (report) => {
  const d = new Date(report?.createdAt || Date.now());
  const day = Number.isNaN(d.getTime()) ? new Date() : d;
  const stamp = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
  const slug = hostOf(report?.url).replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "report";
  return `DealerSiteAudit-${slug}-${stamp}.pdf`;
};

export const __testables = { flattenSection, normalizeStatus, bandFor, hostOf };
