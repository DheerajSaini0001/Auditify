// ─────────────────────────────────────────────────────────────────────────────
// Per-page-type SECTION weights (spec §5.4 + §5.6).
//
// The page score is NOT a flat average of the 8 sections. Each page type tilts the
// section weights (e.g. Finance leans on Security, Trade-In on Conversion). This
// replaces the former `OverAll = (A+…+H)/8` flat 12.5%-per-section model.
//
//   page_score = Σ( section_score × w_section(pageType) ) / Σ( w_section(pageType) )
//
// Weights are renormalized over the APPLICABLE sections only (a section with a
// null/absent score — e.g. a subset audit — is dropped from the denominator).
// ─────────────────────────────────────────────────────────────────────────────

// Canonical section order (A..H) — matches singleAuditWorker's OverAll() ordering.
export const SECTION_ORDER = [
  "Technical Performance",
  "On Page SEO",
  "Accessibility",
  "Security/Compliance",
  "UX & Content Structure",
  "Conversion & Lead Flow",
  "AIO (AI-Optimization) Readiness",
  "AEO (Answer Engine Optimization)",
];

// Spec §5.6 — each row is [Tech, OnPage, A11y, Security, UX, Conversion, AIO, AEO]
// and every row sums to 100. `generic` = the spec base weights (fallback when the
// page type can't be classified).
export const SECTION_PAGE_WEIGHTS = {
  generic: [18, 17, 10, 12, 13, 15, 8, 7],
  home:    [18, 18, 10, 12, 12, 14, 8, 8],
  srp:     [20, 20,  9,  8, 13, 14, 8, 8],
  vdp:     [18, 18,  9,  8, 13, 18, 7, 9],
  offers:  [15, 16,  9, 13, 12, 17, 6, 12],
  lease:   [15, 16,  9, 14, 12, 16, 6, 12],
  tradein: [14, 12, 11, 16, 13, 22, 6, 6],
  finance: [14, 12, 11, 22, 11, 18, 6, 6],
  service: [16, 16, 10, 10, 13, 19, 8, 8],
  about:   [14, 16, 11, 10, 15, 12, 10, 12],
  blog:    [14, 22, 11,  9, 15,  7, 10, 12],
};

// URL → page-type classifier (spec §1 / §5.6 columns). URL-pattern based, mirroring
// the existing cvfClassifyPageType (Conversion) and aeoClassifyPageType (AEO) so the
// page score, Conversion and AEO all agree on what kind of page this is.
// Order matters: most-specific patterns first (VDP before SRP, finance before lease).
export const classifyPageType = (rawUrl) => {
  let path = "";
  try { path = new URL(rawUrl).pathname.toLowerCase(); }
  catch { path = String(rawUrl || "").toLowerCase(); }

  if (path === "" || path === "/" || path === "/index.html" || path === "/home") return "home";

  // VDP — a single vehicle (VIN/stock in URL, or /new|used/<make>/<model>)
  if (/\/vdp|\/vehicle\/|\/-id-|vin=|stocknum|stock=|vehicleid|\/(new|used|certified|cpo)\/[^/]+\/[^/]+/.test(path)) return "vdp";
  // SRP — inventory / search listings
  if (/inventory|\/new\b|\/used\b|\/search|vehicles?(\/|$)|for-sale|cars-for-sale|listings|showroom/.test(path)) return "srp";
  // Trade-in / appraisal
  if (/trade.?in|value-(your|my)-(trade|car|vehicle|auto)|sell-(us-|my-|your-)?(car|vehicle|auto)|appraisal|kbb/.test(path)) return "tradein";
  // Finance / credit application (before lease so "finance/lease" → finance)
  if (/finance|financing|credit-app|credit-application|get-(pre-?)?approved|pre-?approval|apply-for-(financing|credit)|loan|payment-calculator/.test(path)) return "finance";
  // Lease specials
  if (/lease/.test(path)) return "lease";
  // Offers / specials / promotions
  if (/offers|specials|deals|promotions|incentives|coupons|rebates/.test(path)) return "offers";
  // Service & parts
  if (/service|schedule-service|auto-repair|maintenance|\/parts/.test(path)) return "service";
  // About / Contact / staff
  if (/about|our-story|who-we-are|meet-the-team|staff|team|contact|locations?|directions|hours/.test(path)) return "about";
  // Blog / FAQ / guides
  if (/blog|article|news|post|story|guide|tips|resources|faq|faqs|questions|help|support/.test(path)) return "blog";

  return "generic";
};

const indexOfSection = (name) => SECTION_ORDER.indexOf(name);

// Weighted, renormalized page score.
// `pcts` is an array of length 8 in SECTION_ORDER; entries that are not finite
// numbers (null/undefined/NaN) are treated as N/A and dropped from the denominator.
export const computePageScore = (pcts, pageType) => {
  const weights = SECTION_PAGE_WEIGHTS[pageType] || SECTION_PAGE_WEIGHTS.generic;
  let num = 0;
  let den = 0;
  for (let i = 0; i < weights.length; i++) {
    const p = pcts[i];
    if (typeof p !== "number" || !Number.isFinite(p)) continue; // N/A → renormalize out
    num += p * weights[i];
    den += weights[i];
  }
  return den > 0 ? Number((num / den).toFixed(1)) : 0;
};

// Convenience for the subset / section-extract paths: take a {sectionName: pct} map,
// place each into its SECTION_ORDER slot (others null), and score with the page tilt.
export const computePageScoreFromMap = (pctBySection, pageType) => {
  const pcts = new Array(SECTION_ORDER.length).fill(null);
  for (const [name, pct] of Object.entries(pctBySection || {})) {
    const idx = indexOfSection(name);
    if (idx >= 0) pcts[idx] = pct;
  }
  return computePageScore(pcts, pageType);
};
