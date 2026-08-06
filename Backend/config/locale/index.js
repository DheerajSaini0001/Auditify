// ─────────────────────────────────────────────────────────────────────────────
// Locale pack registry.
//
// One entry point for every market-aware check. A check never imports `us.js` or
// `au.js` directly and never branches on `market === "AU"` — it calls
// `getLocale(market)` and grades against whatever list comes back. That keeps
// the market logic in exactly the three places it belongs (which parameters
// apply, which reference list is compared against, what the finding says) and
// out of the 150-odd parameters that are identical in both markets.
//
// Adding a third market is therefore a new data file plus one line in MARKETS —
// no engine change.
// ─────────────────────────────────────────────────────────────────────────────

import US from "./us.js";
import AU from "./au.js";

/** Every market the engine can score for, keyed by ISO 3166-1 alpha-2. */
export const MARKETS = { US, AU };

/**
 * The market used when nothing else resolves. US is the reference pack, so this
 * also means "behave exactly as the engine did before locale packs existed" —
 * an unresolved market can never silently change a US score.
 */
export const DEFAULT_MARKET = "US";

/** Codes offered on the audit form. Mirrors Frontend/src/config/countries.js. */
export const SUPPORTED_MARKETS = Object.keys(MARKETS);

export const isSupportedMarket = (code) =>
  typeof code === "string" && Object.hasOwn(MARKETS, code.trim().toUpperCase());

/**
 * Resolve a market code to its locale pack.
 *
 * Never throws and never returns null: an unknown code (an older saved run
 * carrying "GB", the literal "OTHER", undefined from a caller that has not been
 * plumbed yet) falls back to the reference pack. A check can therefore always
 * assume it has a locale.
 */
export function getLocale(market) {
  const code = typeof market === "string" ? market.trim().toUpperCase() : "";
  return MARKETS[code] || MARKETS[DEFAULT_MARKET];
}

// ── Shared, genuinely global data ────────────────────────────────────────────
// Anything identical in both markets lives here rather than being duplicated in
// both packs, so the packs only ever contain what actually DIFFERS. That is the
// property that makes the diff between them reviewable.

/** Marques sold in both markets under the same name. */
export const GLOBAL_MAKES = [
  "toyota", "ford", "honda", "nissan", "mazda", "mitsubishi", "subaru",
  "hyundai", "kia", "volkswagen", "audi", "bmw", "mercedes-benz", "mercedes",
  "lexus", "volvo", "porsche", "jaguar", "land rover", "mini", "peugeot",
  "renault", "skoda", "suzuki", "tesla", "jeep", "ram", "fiat", "alfa romeo",
  "genesis", "polestar", "cupra",
];

/** Action verbs that read as a clear CTA anywhere in English. */
export const GLOBAL_CTA_VERBS = [
  "buy", "get", "download", "sign up", "subscribe", "start", "join",
  "register", "learn", "book", "order", "contact", "call", "request",
  "schedule", "apply", "shop", "find", "compare", "view", "explore",
];

/** Social platforms that matter in every market. */
export const GLOBAL_SOCIAL_PLATFORMS = [
  "facebook", "instagram", "youtube", "linkedin", "tiktok", "twitter", "x.com",
];

// ── Term-matching helpers ────────────────────────────────────────────────────
// Every locale list is a flat array of lowercase phrases, or an array of
// { label, terms } groups. These two helpers are the only way a check should
// consume them, so matching stays consistent across all 8 pillars.

/** Lowercase a blob once, safely, for repeated matching. */
export const hay = (s) => String(s || "").toLowerCase();

/** Does the haystack contain ANY of these phrases? */
export function anyTerm(haystack, terms) {
  if (!haystack || !Array.isArray(terms)) return false;
  const h = typeof haystack === "string" ? haystack : String(haystack);
  return terms.some((t) => t && h.includes(t));
}

/** Which of these phrases does the haystack contain? */
export function matchedTerms(haystack, terms) {
  if (!haystack || !Array.isArray(terms)) return [];
  const h = typeof haystack === "string" ? haystack : String(haystack);
  return terms.filter((t) => t && h.includes(t));
}

/**
 * Grade a haystack against an array of { label, terms } groups.
 *
 * Returns the labels found and missing plus the ratio, which is what the nav,
 * facet, gallery-shot and FAQ-topic checks all need. Grading on a RATIO rather
 * than a fixed count matters: the two markets expect a different NUMBER of
 * items (AU inventory filtering has 14 expected facets to the US list's 12), so
 * a raw count would quietly move the bar between markets.
 */
export function matchGroups(haystack, groups) {
  const h = hay(haystack);
  const found = [];
  const missing = [];
  for (const g of Array.isArray(groups) ? groups : []) {
    if (anyTerm(h, g.terms)) found.push(g.label);
    else missing.push(g.label);
  }
  const total = found.length + missing.length;
  return { found, missing, total, ratio: total ? found.length / total : 0 };
}

export default getLocale;
