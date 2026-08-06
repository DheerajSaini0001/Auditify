// ─────────────────────────────────────────────────────────────────────────────
// Market-aware format primitives — addresses, phones, dates, and the
// cross-market contamination signal derived from all three.
//
// These are the Phase-1 fixes: every one of them replaces a US-shaped parser
// that produced an OUTRIGHT WRONG answer on an Australian page rather than a
// merely different one.
//
//   • parseLocalAddress  — the old tuParseUsAddress required "City, ST 12345".
//     "Fortitude Valley QLD 4006" has no comma and a 3-letter state code, so it
//     matched nothing and Title_Location_Optimization failed. Worse,
//     "Perth, WA 6000" DID match — as Perth, Washington.
//   • normalisePhone     — the old rule kept the last 10 digits, which rejects
//     every Australian 13-number ("13 12 34" is six digits).
//   • parseLocalDate     — a US-shaped parser reads 04/08/2026 as 4 August in
//     one market and 8 April in the other, and silently rejects 25/12/2026.
//
// All four take a locale pack from config/locale and hold no market knowledge
// of their own, so a new market needs no change here.
// ─────────────────────────────────────────────────────────────────────────────

import { parsePhoneNumberFromString } from "libphonenumber-js";
import { getLocale, hay, matchedTerms } from "../config/locale/index.js";

// ── Addresses ────────────────────────────────────────────────────────────────

/** Escape a harvested string for safe use inside a RegExp. */
const esc = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Pull a locality + region out of free text, using the audited market's own
 * address shape.
 *
 * Three patterns are tried in descending order of confidence:
 *   A. locality + state CODE + postcode   — strongest; the postcode confirms it
 *   B. locality , state CODE              — comma required, so a bare "WA" in
 *                                           prose cannot masquerade as a state
 *   C. locality , full state NAME         — spelled out
 *
 * State codes are matched CASE-SENSITIVELY (they are uppercase in real
 * addresses) so common words never match: without that, "SA" hits inside
 * "…in SAles", and the old parser's 2-letter rule had exactly this problem.
 *
 * @param {string} text    free text, typically a footer or <address> block
 * @param {string} market  ISO alpha-2; anything unknown falls back to US
 * @returns {{city:string,state:string|null,stateName:string|null,postcode:string|null}|null}
 */
export function parseLocalAddress(text, market) {
  if (!text) return null;
  const locale = getLocale(market);
  const states = locale.address.states || {};
  const codes = Object.keys(states);
  if (!codes.length) return null;

  // Longest first so a 3-letter code is never shadowed by a 2-letter prefix.
  const codeAlt = codes.slice().sort((a, b) => b.length - a.length).map(esc).join("|");
  const nameAlt = Object.values(states).map(esc).join("|");
  const post = locale.address.postcodePattern.source;
  const locality = "([A-Za-z][A-Za-z .'\\-]{1,40}?)";

  const build = (r, flags) => new RegExp(r, flags);
  const out = (city, code, postcode) => ({
    city: String(city || "").trim().replace(/[,\s]+$/, ""),
    state: code || null,
    stateName: code ? states[code] || null : null,
    postcode: postcode || null,
  });

  // A — locality, optional comma, CODE, postcode. Handles both "Fortitude
  // Valley QLD 4006" and "Springfield, IL 62704".
  const a = String(text).match(build(`(?:^|,|\\n)\\s*${locality}\\s*,?\\s+(${codeAlt})\\b\\s*(${post})`));
  if (a && states[a[2]]) return out(a[1], a[2], a[3]);

  // B — locality, comma, CODE. No postcode to confirm it, so the comma is
  // mandatory here.
  const b = String(text).match(build(`(?:^|,|\\n)\\s*${locality}\\s*,\\s*(${codeAlt})\\b`));
  if (b && states[b[2]]) return out(b[1], b[2], null);

  // C — locality, comma, spelled-out state name. Case-insensitive: a full name
  // is unambiguous enough that casing does not have to carry the signal.
  const c = String(text).match(build(`(?:^|,|\\n)\\s*${locality}\\s*,\\s*(${nameAlt})\\b`, "i"));
  if (c) {
    const nameLc = c[2].toLowerCase();
    const code = codes.find((k) => String(states[k]).toLowerCase() === nameLc) || null;
    const res = out(c[1], code, null);
    if (!code) res.stateName = c[2];
    return res;
  }

  return null;
}

// ── Phones ───────────────────────────────────────────────────────────────────

/**
 * Is this digit string a plausible national phone number in this market?
 *
 * Driven entirely by `locale.phone.nationalDigits`, which is why Australia's
 * 6-digit 13-numbers survive here and did not under the old hardcoded rule.
 * A leading country code or trunk zero is allowed on top of any valid length.
 */
export function isPhoneLikeDigits(digits, market) {
  const d = String(digits || "").replace(/\D/g, "");
  if (!d) return false;
  const locale = getLocale(market);
  const lengths = locale.phone.nationalDigits || [10];
  if (lengths.includes(d.length)) return true;
  // Same number carrying a trunk "0" or a country code: +61 7 3000 1234 → 11–12.
  return lengths.some((n) => d.length === n + 1 || d.length === n + 2 || d.length === n + 3);
}

/**
 * Normalise a phone to E.164 for comparison, using the market's dialling region.
 *
 * Falls back to a digits-only form rather than null when libphonenumber rejects
 * the input — a 13-number is a real, dialable Australian number that
 * libphonenumber does not consider "valid", and dropping it would recreate the
 * bug this function exists to fix.
 */
export function normalisePhone(value, market) {
  if (!value) return null;
  const locale = getLocale(market);
  const raw = String(value).trim();

  try {
    const parsed = parsePhoneNumberFromString(raw, locale.phone.region);
    if (parsed && parsed.isValid()) return parsed.format("E.164");
  } catch (_) {
    // fall through to the digit form
  }

  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  // Short codes (AU 13-numbers) are their own canonical form — there is no
  // country-code version of them to normalise to.
  const isShort = (locale.phone.shortCodePatterns || []).some((re) => re.test(raw.replace(/[^\d\s]/g, "").trim()));
  if (isShort) return digits;

  return isPhoneLikeDigits(digits, market) ? digits : null;
}

/** Pull the first plausible phone out of a blob of text, market-aware. */
const PHONE_CANDIDATE = /\(?\+?\d[\d\s().\-]{4,15}\d/g;
export function phoneFromText(text, market) {
  const candidates = String(text || "").match(PHONE_CANDIDATE) || [];
  for (const c of candidates) {
    // "11.49 - 21.29" style numeric ranges (opening hours) are not phones.
    if (/\d\s*[-–—]\s+\d|\d\s+[-–—]\s*\d/.test(c)) continue;
    if (isPhoneLikeDigits(c, market)) return c.replace(/\s+/g, " ").trim();
  }
  return null;
}

// ── Dates ────────────────────────────────────────────────────────────────────

const NUMERIC_DATE = /\b(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})\b/;

/**
 * Parse a human-visible numeric date in the market's own field order.
 *
 * ISO 8601 is handled first and identically in both markets — it is the machine
 * form everywhere. Only the visible order differs, and getting it wrong is not
 * cosmetic: 04/08/2026 is a four-month swing, and 25/12/2026 is simply rejected
 * by a month-first parser, which reads as "no freshness signal on the page".
 */
export function parseLocalDate(value, market) {
  if (!value) return null;
  const raw = String(value).trim();

  const iso = raw.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (iso) {
    const d = new Date(Date.UTC(+iso[1], +iso[2] - 1, +iso[3]));
    return Number.isNaN(d.getTime()) ? null : d;
  }

  const m = raw.match(NUMERIC_DATE);
  if (!m) {
    const loose = new Date(raw);
    return Number.isNaN(loose.getTime()) ? null : loose;
  }

  const locale = getLocale(market);
  const [, p1, p2, p3] = m;
  let day, month;
  if (locale.date.order === "DMY") { day = +p1; month = +p2; }
  else { month = +p1; day = +p2; }

  // An unambiguous value overrides the convention: 25/12 can only be D/M, and
  // a ported template mixing both orders is common enough to be worth catching.
  if (month > 12 && day <= 12) { const t = day; day = month; month = t; }
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  let year = +p3;
  if (year < 100) year += year < 70 ? 2000 : 1900;

  const d = new Date(Date.UTC(year, month - 1, day));
  return Number.isNaN(d.getTime()) ? null : d;
}

// ── Locale contamination ─────────────────────────────────────────────────────

/**
 * Detect the other market's vocabulary, currency or units on a page audited for
 * this one.
 *
 * This is the derived finding the norms reference calls out as the most
 * distinctive thing the audit can say: an AU-market site publishing USD prices,
 * MPG and a US state dropdown is running an unlocalised American template, and
 * that single observation justifies the audit. It is deliberately reported as
 * EVIDENCE, not as a score — a page can legitimately mention a foreign term
 * (an imported vehicle, a US parent company), so the caller decides severity.
 */
export function detectLocaleContamination(text, market, opts = {}) {
  const locale = getLocale(market);
  const h = hay(text);
  if (!h) return { market: locale.code, terms: [], units: [], currency: [], total: 0 };

  const terms = matchedTerms(h, locale.vocabulary.foreign || []);

  // Units belonging to the other market. Only flag the ones this market does
  // NOT also use, so "km" on a US page is a genuine signal and "$" never is.
  const units = [];
  const foreignUnitTests = locale.code === "AU"
    ? [{ label: "MPG", re: /\bmpg\b|miles per gallon/i }, { label: "miles", re: /\b\d+[,\d]*\s*(?:miles|mi)\b/i }]
    : [{ label: "L/100km", re: /\bl\s*\/\s*100\s*km\b/i }, { label: "kilometres", re: /\b\d+[,\d]*\s*(?:km|kilometres|kilometers)\b/i }];
  for (const t of foreignUnitTests) if (t.re.test(h)) units.push(t.label);

  // An explicitly-declared foreign currency. A bare "$" is shared between the
  // two markets and can never be evidence on its own.
  const currency = [];
  const foreignCurrency = locale.code === "AU" ? ["usd", "us$"] : ["aud", "au$", "a$"];
  for (const c of foreignCurrency) if (h.includes(c)) currency.push(c.toUpperCase());

  // Structured signals the caller may have gathered from the DOM (a US state
  // dropdown, a 5-digit ZIP mask) — passed in rather than re-queried here.
  const formFields = Array.isArray(opts.formFields) ? opts.formFields : [];

  return {
    market: locale.code,
    terms,
    units,
    currency,
    formFields,
    total: terms.length + units.length + currency.length + formFields.length,
  };
}

export default {
  parseLocalAddress,
  normalisePhone,
  isPhoneLikeDigits,
  phoneFromText,
  parseLocalDate,
  detectLocaleContamination,
};
