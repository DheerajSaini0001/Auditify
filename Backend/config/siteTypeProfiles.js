// ─────────────────────────────────────────────────────────────────────────────
// Per-SITE-TYPE scoring profile — the second axis of the score, alongside the
// per-PAGE-type tilt that already lives in Backend/utils/sectionWeights.js.
//
// Source: docs/reports/Automotive-Site-Type-Parameter-Matrix.html (6 Aug 2026),
// which rates all 164 implemented parameters against the four automotive site
// types the platform audits. Two things come out of that matrix and both live
// here:
//
//   1. APPLICABILITY — 12 parameters are inventory-scoped and genuinely do not
//      exist on a site that sells no vehicles. The matrix is blunt about the
//      cost of getting this wrong: scoring them as failures is "the single
//      largest source of false-low scores in any audit product", worth roughly
//      a section and a half of a garage's total score. They are renormalised
//      OUT of the denominator, never scored zero.
//
//   2. SECTION WEIGHTS — how much each of the 8 sections is worth for this kind
//      of business. A repair shop lives on AEO (symptom queries answered by AI)
//      and barely touches finance compliance; a franchise dealer is the reverse.
//
// Keyed on `siteSubType` from utils/dealershipDetector.js — franchise /
// independent / service / repair. "corporate" and an unresolved site
// deliberately have NO profile: they return null and every caller falls back to
// exactly the pre-existing behaviour, so this file can only ever change scores
// for the four types it was built from.
// ─────────────────────────────────────────────────────────────────────────────

// The coarse verdicts DealerSiteAudit  will actually audit. "unknown" (which covers
// marketplaces, media sites, non-automotive sites and every inconclusive read)
// is refused at both the discovery and audit gates.
export const ACCEPTED_SITE_TYPES = new Set(["dealer", "service", "corporate"]);

// Which sub-types are legal under each coarse verdict, most-common first — the
// first entry doubles as the fallback when a caller supplies a sub-type that
// doesn't belong to the site type it came with.
const SUB_TYPES_BY_SITE_TYPE = {
  dealer: ["independent", "franchise"],
  service: ["service", "repair"],
  corporate: ["corporate"],
};

// ─────────────────────────────────────────────────────────────────────────────
// The crawl plan: WHICH pages a full-site audit visits, per site type.
// ─────────────────────────────────────────────────────────────────────────────
//
// A full-site run visits at most MAX_CRAWL_PAGES pages, and every one of them is
// a full Chromium render plus an 8-pillar pass (~12–14 CPU-seconds). That makes
// the page list the single biggest lever on audit cost — and, because the page
// decides which parameters can be scored at all, the single biggest lever on
// what the report is able to say.
//
// So the slots are not "whatever the crawler happened to find first", which is
// what they used to be: discovery returned URLs in sitemap order and the first
// six categories won. A dealer could burn all six on About, Blog, Specials and
// Service and never fetch a VDP — the page that alone unlocks VDP uniqueness,
// the vehicle gallery, vehicle history and sold-vehicle handling.
//
// Each list below is ordered by what the page uniquely unlocks for THAT kind of
// business, per the parameter matrix. Home is not listed: it is the URL the
// visitor typed and Stage 1 always audits it, so these are the slots AFTER it.
export const MAX_CRAWL_PAGES = 6;

export const KEY_PAGES_BY_SUBTYPE = {
  // Both dealer types share the first four — inventory and the credit
  // application are where a vehicle sale is actually won or lost. They diverge
  // on the last slot, and it is a compliance divergence: a franchise store
  // advertises APR and lease terms (Reg-Z / Reg-M), an independent lot
  // advertises price and add-ons (the FTC CARS Rule's primary target).
  franchise: ["vdp", "srp", "finance", "trade", "lease"],
  independent: ["vdp", "srp", "finance", "trade", "specials"],

  // Neither servicing type sells vehicles, so the whole inventory block is gone
  // and the funnel is a booking scheduler. They diverge on slot 5: a chain is
  // found branch by branch (locations, NAP), a single-location garage is found
  // on its credentials (ASE / I-CAR), because it has no brand badge to borrow.
  service: ["booking", "service", "pricing", "locations", "content"],
  repair: ["booking", "service", "pricing", "about", "content"],

  // Corporate/OEM: no inventory of its own, so the lineup and the dealer
  // locator carry what a VDP and an SRP carry for a dealer.
  corporate: ["models", "locator", "press", "about", "content"],
};

/**
 * The ordered key pages to crawl for a site type, after the home page.
 *
 * Falls back to the independent-dealer list for an unresolved sub-type, which
 * is the pre-existing behaviour: an unknown site has always been treated as a
 * dealer by the rest of the pipeline.
 */
export function keyPagesFor(siteSubType) {
  return KEY_PAGES_BY_SUBTYPE[siteSubType] || KEY_PAGES_BY_SUBTYPE.independent;
}

/**
 * How many pages a full-site run will visit, home included — the number behind
 * the "this takes about N minutes" estimate shown before an audit starts.
 *
 * This used to be the size of VALID_PAGE_SCOPES, which is the union of all three
 * page taxonomies at once (16 keys), so it promised a garage a 16-page crawl of
 * a 6-page plan.
 */
export function keyPageCountFor(siteSubType) {
  return Math.min(MAX_CRAWL_PAGES, keyPagesFor(siteSubType).length + 1);
}

/**
 * Coerce a (siteType, siteSubType) pair into a consistent one.
 *
 * The frontend round-trips both values from /discover so a re-audit doesn't
 * re-fetch the homepage, which means a caller can hand back any pair it likes.
 * A mismatched pair is not merely untidy — "dealer" + "repair" would
 * renormalise the 12 inventory parameters out of a genuine dealer's score — so
 * an inconsistent sub-type is replaced with the site type's default rather than
 * trusted.
 *
 * @param {string} siteType
 * @param {string|null|undefined} siteSubType
 * @returns {string|null} a sub-type valid for `siteType`, or null if the site
 *   type itself isn't one we audit.
 */
export function normalizeSubType(siteType, siteSubType) {
  const allowed = SUB_TYPES_BY_SITE_TYPE[siteType];
  if (!allowed) return null;
  return allowed.includes(siteSubType) ? siteSubType : allowed[0];
}

// Matches SECTION_ORDER in utils/sectionWeights.js:
// [Technical, On-Page SEO, Accessibility, Security, UX, Conversion, AIO, AEO]
//
// Rows are the matrix's Part 4 "Recommended section-weight profile per site
// type" verbatim; each sums to 100. They are NOT applied as-is — see
// siteWeightMultipliers() below for why they are read as a tilt relative to the
// base row rather than an absolute replacement.
export const SECTION_SITE_WEIGHTS = {
  // Balanced retail profile. Security carries the finance/lease compliance
  // load; Conversion carries the multi-tool funnel.
  franchise: [18, 18, 9, 13, 11, 17, 7, 7],
  // Conversion up and On-Page slightly down versus franchise: fewer pages to
  // optimise, more weight on turning a smaller audience into leads.
  independent: [18, 17, 9, 13, 12, 18, 6, 7],
  // Security down (no credit applications), Conversion and AEO up. Booking is
  // the funnel and answer engines are a primary discovery surface.
  service: [16, 16, 9, 9, 13, 19, 7, 11],
  // Highest AEO weight of the four and the lowest Security. Discovery is local
  // and question-driven; the conversion is a phone call.
  repair: [16, 15, 9, 8, 14, 18, 7, 13],
};

// The neutral reference the rows above are read against — the `generic` row of
// SECTION_PAGE_WEIGHTS. Kept as a literal rather than imported so a future edit
// to the page table cannot silently re-scale every site profile; the assertion
// in assertProfilesValid() below catches the two drifting apart.
const BASE_WEIGHTS = [18, 17, 8, 12, 11, 14, 8, 12];

/**
 * The site profile as MULTIPLIERS against the base row, which is how it gets
 * combined with the page tilt.
 *
 * Multiplying the two weight tables together directly (the obvious reading of
 * "multiply into SECTION_PAGE_WEIGHTS") compounds them: a section that is
 * modestly below average on both axes ends up far below either. Accessibility
 * on a repair site's home page is the worked example — 8 (page) × 9 (site)
 * lands at ~5% of the page score when both tables independently say ~9%.
 *
 * Reading the site row as a RATIO against the base fixes that and has the
 * property you actually want: applying a site profile to a `generic` page
 * reproduces the matrix row exactly, and applying it to any other page type
 * moves that page's own tilt by the same proportion. A franchise dealer's
 * Finance page keeps its heavy Security tilt; a repair site's contact page
 * never inherits a franchise dealer's compliance weighting to begin with.
 *
 * @param {string|null|undefined} siteSubType
 * @returns {number[]|null} 8 multipliers, or null when this site type has no
 *   profile (corporate / unknown / unset) and the page tilt should stand alone.
 */
export function siteWeightMultipliers(siteSubType) {
  const row = SECTION_SITE_WEIGHTS[siteSubType];
  if (!row) return null;
  return row.map((w, i) => w / BASE_WEIGHTS[i]);
}

// ─────────────────────────────────────────────────────────────────────────────
// Parameter applicability
// ─────────────────────────────────────────────────────────────────────────────

// The 12 inventory-scoped parameters, by the key each metric service actually
// returns them under. Every one of them presupposes a vehicle for sale, so on a
// site that sells none they are Not Applicable — dropped from the denominator,
// not scored zero.
//
// These already carry a PAGE-type gate inside their own metric service (e.g.
// Sold_Vehicle only runs on vdp/srp). This is a second, SITE-level gate on top,
// and it is not redundant: page type is decided by URL regex, so a repair shop
// with a /finance-options page (payment plans for a big repair bill are common)
// classifies as `finance` and would otherwise run — and fail — the whole credit
// application battery.
export const INVENTORY_SCOPED_PARAMS = {
  "Technical Performance": ["Sold_Vehicle"],
  "On Page SEO": ["VDP_Content_Uniqueness", "SRP_Index_Control", "SRP_To_VDP_Links"],
  "UX & Content Structure": ["Inventory_Filtering", "No_Results_UX", "Vehicle_Image_Gallery"],
  "Conversion & Lead Flow": ["Vehicle_History", "TradeIn_Flow", "Financing_Flow", "Finance_Calculator"],
  "Security/Compliance": ["Finance_Form_Security"],
};

const ALL_INVENTORY_SCOPED = new Set(Object.values(INVENTORY_SCOPED_PARAMS).flat());

// Site types that sell no vehicles of their own. Kept as a set rather than a
// `=== "service"` check so the intent survives a future 5th sub-type.
const NON_SELLING_SUBTYPES = new Set(["service", "repair"]);

/**
 * Is `paramKey` scoreable for this site type?
 *
 * Defaults to TRUE for every unknown/absent sub-type, so a site the detector
 * could not resolve is scored exactly as it is today.
 *
 * @param {string} paramKey     e.g. "TradeIn_Flow"
 * @param {string|null} siteSubType
 * @returns {boolean}
 */
export function isParamApplicable(paramKey, siteSubType) {
  if (!NON_SELLING_SUBTYPES.has(siteSubType)) return true;
  return !ALL_INVENTORY_SCOPED.has(paramKey);
}

/**
 * Strip inapplicable parameters out of a `{key: metric}` map before it is
 * weighted. Metric services call this on their candidate map; keys removed here
 * never reach the Σ(score×w)/Σ(w) roll-up, which is what "renormalised out of
 * the denominator" means in practice — the existing roll-ups already drop
 * null/absent entries, so nothing about the scoring maths changes.
 *
 * @param {object} candidateMap
 * @param {string|null} siteSubType
 * @returns {object} the same map, or a filtered copy when something was dropped
 */
export function applySiteApplicability(candidateMap, siteSubType) {
  if (!NON_SELLING_SUBTYPES.has(siteSubType)) return candidateMap;
  const out = {};
  for (const [key, metric] of Object.entries(candidateMap || {})) {
    out[key] = ALL_INVENTORY_SCOPED.has(key) ? null : metric;
  }
  return out;
}

/**
 * Guard for the two invariants this file has to hold. Called from the test
 * suite; exported rather than run at import time so a bad edit surfaces as a
 * failing assertion rather than a boot loop.
 */
export function assertProfilesValid() {
  for (const [name, row] of Object.entries(SECTION_SITE_WEIGHTS)) {
    if (row.length !== BASE_WEIGHTS.length) {
      throw new Error(`[siteTypeProfiles] ${name} has ${row.length} weights, expected ${BASE_WEIGHTS.length}`);
    }
    const sum = row.reduce((a, b) => a + b, 0);
    if (sum !== 100) throw new Error(`[siteTypeProfiles] ${name} weights sum to ${sum}, expected 100`);
  }
  if (ALL_INVENTORY_SCOPED.size !== 12) {
    throw new Error(`[siteTypeProfiles] expected 12 inventory-scoped params, found ${ALL_INVENTORY_SCOPED.size}`);
  }
  return true;
}
