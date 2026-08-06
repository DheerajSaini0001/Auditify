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

// Corporate/OEM sites use pageClassifier.js's own corporate taxonomy (models/
// locator/press/about/content) rather than a 4th duplicated regex set here —
// re-exported so callers that already import classifyPageType from this module
// (e.g. singleAuditController.js's section-reuse path) can pick the right one.
export { classifyCorporatePageType, classifyServicePageType } from "./pageClassifier.js";

import { siteWeightMultipliers } from "../config/siteTypeProfiles.js";

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
//
// AI-forward weighting (July 2026 product decision): AIO+AEO carry ~20 combined
// on customer-facing dealer pages (AEO leads — reach/visibility in answer
// engines), funded by Accessibility/UX. Transactional pages (trade-in, finance)
// stay lower (~16) — bots don't fill out credit apps. This is a strategic,
// forward-looking tilt (AI referral growth), not a current-traffic-share claim.
//
// THIS IS THE ONLY COPY. singleAuditWorker.js used to carry a byte-identical
// second table under a slightly different vocabulary (`trade`/`specials` where
// this one says `tradein`/`offers`, because each matched its own classifier),
// kept aligned by a comment in both files saying "keep BOTH tables in sync".
// They were identical right up until they wouldn't have been. The worker now
// reads this table through weightsForPageType() below, which resolves either
// vocabulary — so there is one row per page type and no synchronisation to
// forget.
export const SECTION_PAGE_WEIGHTS = {
  generic: [18, 17,  8, 12, 11, 14, 8, 12],
  home:    [18, 18,  8, 12, 10, 14, 8, 12],
  srp:     [20, 20,  7,  8, 11, 14, 8, 12],
  vdp:     [18, 18,  8,  8, 11, 18, 7, 12],
  offers:  [15, 16,  8, 13, 11, 17, 8, 12],
  lease:   [15, 16,  8, 14, 11, 16, 8, 12],
  tradein: [14, 12,  9, 16, 11, 22, 7, 9],
  finance: [14, 12,  9, 22,  9, 18, 7, 9],
  service: [16, 16,  8, 10, 11, 19, 8, 12],
  about:   [14, 16, 11, 10, 15, 12, 10, 12],
  blog:    [14, 22,  9,  9, 15,  7, 10, 14],
  // Corporate/OEM page types (mirrors singleAuditWorker's SECTION_WEIGHTS_BY_PAGE_TYPE).
  models:  [18, 20, 10,  8, 14, 10, 9, 11],
  locator: [16, 14,  8,  8, 14, 20, 8, 12],
  press:   [14, 18, 10,  8, 14,  6, 10, 20],
  // classifyCorporatePageType (pageClassifier.js) labels its blog/news bucket
  // "content", not "blog" — same weights as the dealer "blog" row above so the
  // two classifiers' vocab differences don't change the actual tilt applied.
  content: [14, 22,  9,  9, 15,  7, 10, 14],
  // Service/repair page types (mirrors singleAuditWorker's table). `booking` is
  // the whole funnel for those sites; `pricing` is both a conversion surface and
  // the thing answer engines quote; `locations` is local discovery.
  booking:  [15, 12, 11, 10, 14, 25, 6,  7],
  pricing:  [14, 16,  9,  8, 13, 20, 8, 12],
  locations:[15, 18,  9,  8, 16, 14, 7, 13],
};

// The dealer classifier in utils/pageClassifier.js names three buckets
// differently from the local classifyPageType() below, which the controller's
// section-reuse path uses. Same page, same row — only the label differs, so
// they are aliased rather than duplicated.
const PAGE_TYPE_ALIASES = {
  trade:    "tradein",   // pageClassifier: "trade"    · local: "tradein"
  specials: "offers",    // pageClassifier: "specials" · local: "offers"
  content:  "content",   // both, and identical to "blog" — listed for completeness
};

/**
 * The 8-entry weight row for a page type, in either vocabulary.
 * Falls back to the `generic` spec base row for anything unrecognised.
 */
export const weightsForPageType = (pageType) =>
  SECTION_PAGE_WEIGHTS[pageType]
  || SECTION_PAGE_WEIGHTS[PAGE_TYPE_ALIASES[pageType]]
  || SECTION_PAGE_WEIGHTS.generic;

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

// The page tilt above says what kind of PAGE this is; the site profile in
// config/siteTypeProfiles.js says what kind of BUSINESS runs it. They multiply:
// a franchise dealer's Finance page keeps its heavy Security tilt, while a
// repair shop's contact page never inherits a franchise dealer's compliance
// weighting in the first place. Sites with no profile (corporate, or a type the
// detector couldn't resolve) get the page tilt alone, exactly as before.
const combinedWeights = (pageType, siteSubType) => {
  const pageWeights = weightsForPageType(pageType);
  const mult = siteWeightMultipliers(siteSubType);
  return mult ? pageWeights.map((w, i) => w * mult[i]) : pageWeights;
};

// Weighted, renormalized page score.
// `pcts` is an array of length 8 in SECTION_ORDER; entries that are not finite
// numbers (null/undefined/NaN) are treated as N/A and dropped from the denominator.
export const computePageScore = (pcts, pageType, siteSubType = null) => {
  const weights = combinedWeights(pageType, siteSubType);
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
export const computePageScoreFromMap = (pctBySection, pageType, siteSubType = null) => {
  const pcts = new Array(SECTION_ORDER.length).fill(null);
  for (const [name, pct] of Object.entries(pctBySection || {})) {
    const idx = indexOfSection(name);
    if (idx >= 0) pcts[idx] = pct;
  }
  return computePageScore(pcts, pageType, siteSubType);
};
