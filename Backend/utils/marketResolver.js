// ─────────────────────────────────────────────────────────────────────────────
// Market resolution — run once, at the top of an audit.
//
// Answers "which market's norms is this run scored against?" and, just as
// importantly, records WHY, so the report can explain itself instead of
// asserting a jurisdiction the customer never picked.
//
// ── Which signal wins, and a deliberate deviation from the norms reference ──
//
// docs/reference/US-vs-AU-Audit-Norms.pdf recommends resolving strongest-signal
// first and treating the audit form's dropdown as authoritative only when the
// page is silent. This module does something slightly different ON PURPOSE:
//
//   an EXPLICIT market selection always wins.
//
// The reason is a product one. The dropdown is a promise — a customer who picks
// Australia expects an Australian report, and silently scoring them against US
// norms because their template still says "MSRP" would be the engine arguing
// with the user. So the selection decides which norms apply, and the page
// signals are still resolved and compared against it.
//
// Where they disagree, that disagreement is returned as `conflict` and becomes a
// FINDING rather than an override — which is the more valuable outcome anyway:
// "you asked for an Australian audit and this page publishes USD prices, MPG and
// a US state dropdown" is the unlocalised-template insight the reference calls
// the single most sellable observation in the whole document.
//
// With no explicit selection (an API caller, an older saved run, a re-audit of a
// report created before this existed) the reference's ordering applies exactly:
// ccTLD → schema country → page signals → html lang → US.
// ─────────────────────────────────────────────────────────────────────────────

import { getLocale, isSupportedMarket, DEFAULT_MARKET, MARKETS } from "../config/locale/index.js";

/** Confidence tiers, highest first. Used for both resolution and conflict. */
const TIER = { CONCLUSIVE: 4, STRONG: 3, DECLARED: 2, WEAK: 1 };

/** ccTLD → market. Only unambiguous ones; ".com" says nothing. */
const CCTLD = { au: "AU", us: "US" };

/**
 * Locality and region tokens distinctive enough to identify a market on their
 * own. Deliberately short: these must not fire on a US page that happens to
 * mention Sydney, so each list is checked as a whole-word match and only the
 * state/territory codes plus the largest metros are included.
 */
const PLACE_TOKENS = {
  AU: /\b(?:NSW|VIC|QLD|TAS|ACT|WA|SA|NT)\b|\b(?:sydney|melbourne|brisbane|perth|adelaide|hobart|canberra|darwin|gold coast|newcastle|wollongong|geelong|townsville)\b/i,
  US: /\b(?:california|texas|florida|new york|illinois|ohio|georgia|michigan|arizona)\b|\b(?:los angeles|chicago|houston|phoenix|philadelphia|dallas|atlanta|miami|seattle|denver)\b/i,
};

/** Collect every JSON-LD object on the page, flattened through @graph. */
const collectJsonLd = ($) => {
  const out = [];
  if (!$) return out;
  $('script[type="application/ld+json"]').each((_, el) => {
    const raw = $(el).contents().text() || $(el).text() || "";
    if (!raw.trim()) return;
    try {
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (node && typeof node === "object") {
          out.push(node);
          if (node["@graph"]) walk(node["@graph"]);
          for (const v of Object.values(node)) if (v && typeof v === "object") walk(v);
        }
      };
      walk(JSON.parse(raw.replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "")));
    } catch (_) { /* a malformed block is Schema_Markup's finding, not ours */ }
  });
  return out;
};

/** Normalise a schema addressCountry value ("Australia", "AU", "AUS") to a code. */
const countryToCode = (value) => {
  if (!value) return null;
  const v = typeof value === "object" ? (value.name || value["@id"] || "") : value;
  const s = String(v).trim().toUpperCase();
  if (!s) return null;
  if (s.length === 2 && isSupportedMarket(s)) return s;
  if (s === "AUS" || s === "AUSTRALIA") return "AU";
  if (s === "USA" || s === "UNITED STATES" || s === "UNITED STATES OF AMERICA" || s === "US") return "US";
  return null;
};

/**
 * Gather every market signal the page carries. Pure read — no scoring, no
 * decision. Returned separately so a caller (or a test) can inspect the raw
 * evidence behind a verdict.
 */
export function collectMarketSignals(url, $) {
  const signals = [];
  const add = (market, tier, source, evidence) => {
    if (market && MARKETS[market]) signals.push({ market, tier, source, evidence });
  };

  // 1 — ccTLD. Near-conclusive: .com.au is auDA-restricted and requires an ABN,
  //     ACN or Australian trade mark, so it is not a domain a US business holds
  //     casually.
  try {
    const host = new URL(url).hostname.toLowerCase();
    const tld = host.split(".").pop();
    if (CCTLD[tld]) add(CCTLD[tld], TIER.CONCLUSIVE, "ccTLD", `.${tld}`);
  } catch (_) { /* an unparseable URL is the caller's problem, not this one's */ }

  if ($) {
    // 2 — schema addressCountry. Machine-declared by the business itself.
    for (const node of collectJsonLd($)) {
      const addrs = Array.isArray(node.address) ? node.address : (node.address ? [node.address] : []);
      for (const a of addrs) {
        if (a && typeof a === "object") {
          const code = countryToCode(a.addressCountry || a.addresscountry);
          if (code) { add(code, TIER.CONCLUSIVE, "schema addressCountry", code); break; }
        }
      }
    }

    // 3 — phone country code on a tel: link.
    const tels = [];
    $('a[href^="tel:"]').each((_, el) => { const h = $(el).attr("href"); if (h) tels.push(h); });
    const telBlob = tels.join(" ");
    if (/tel:\+?61/i.test(telBlob)) add("AU", TIER.STRONG, "phone country code", "+61");
    else if (/tel:\+1/.test(telBlob)) add("US", TIER.STRONG, "phone country code", "+1");

    // 4 — place tokens in the parts of the page that carry an address.
    const addrText = [
      $("address").text(),
      $('[class*="address" i], [id*="address" i], [itemprop="address"]').text(),
      $("footer").text(),
    ].join(" ").slice(0, 6000);
    for (const [code, re] of Object.entries(PLACE_TOKENS)) {
      const m = addrText.match(re);
      if (m) add(code, TIER.STRONG, "place tokens", m[0]);
    }

    // 5 — currency and market-idiomatic pricing language.
    const body = ($("body").text() || "").slice(0, 20000).toLowerCase();
    if (/\baud\b|\bau\$|drive ?away|no more to pay|on-road costs/.test(body)) add("AU", TIER.STRONG, "currency / pricing language", "AUD / drive-away");
    if (/\busd\b|\bus\$|\bmsrp\b|out-the-door|doc fee/.test(body)) add("US", TIER.STRONG, "currency / pricing language", "USD / MSRP");

    // 6 — html lang / hreflang. Weakest by design: on ported templates this is
    //     wrong more often than it is right, which is exactly the case we are
    //     trying to detect rather than trust.
    const lang = String($("html").attr("lang") || "").trim().toUpperCase();
    const region = lang.includes("-") ? lang.split("-").pop() : (lang.includes("_") ? lang.split("_").pop() : null);
    if (region && isSupportedMarket(region)) add(region, TIER.WEAK, "html lang", lang);
  }

  return signals;
}

/**
 * Resolve the market for a run.
 *
 * @param {object}  args
 * @param {string}  args.url       the audited URL
 * @param {object} [args.$]        cheerio handle for the landing page, if loaded
 * @param {string} [args.selected] the market chosen on the audit form
 * @returns {{market:string, locale:object, source:string, confidence:string,
 *            selected:string|null, detected:string|null, signals:Array,
 *            conflict:object|null}}
 */
export function resolveMarket({ url, $ = null, selected = null } = {}) {
  const signals = collectMarketSignals(url, $);

  // Strongest page-derived verdict: highest tier wins, ties broken by how many
  // independent signals agree.
  let detected = null;
  let detectedSource = null;
  if (signals.length) {
    const byMarket = new Map();
    for (const s of signals) {
      const cur = byMarket.get(s.market) || { tier: 0, count: 0, sources: [] };
      cur.tier = Math.max(cur.tier, s.tier);
      cur.count += 1;
      cur.sources.push(s.source);
      byMarket.set(s.market, cur);
    }
    let best = null;
    for (const [market, v] of byMarket) {
      if (!best || v.tier > best.v.tier || (v.tier === best.v.tier && v.count > best.v.count)) best = { market, v };
    }
    if (best) { detected = best.market; detectedSource = best.v.sources.join(", "); }
  }

  const explicit = isSupportedMarket(selected) ? String(selected).trim().toUpperCase() : null;

  let market, source, confidence;
  if (explicit) {
    market = explicit;
    source = "audit form selection";
    confidence = "declared";
  } else if (detected) {
    market = detected;
    source = detectedSource;
    confidence = signals.some((s) => s.tier === TIER.CONCLUSIVE) ? "high" : "medium";
  } else {
    market = DEFAULT_MARKET;
    source = "default";
    confidence = "low";
  }

  // A conflict is only worth raising when the page said something definite and
  // it contradicts the selection. Weak signals (html lang) are excluded: being
  // wrong is their normal state on a ported template, so they would fire
  // constantly and the finding would stop meaning anything.
  let conflict = null;
  if (explicit && detected && detected !== explicit) {
    const contrary = signals.filter((s) => s.market === detected && s.tier >= TIER.STRONG);
    if (contrary.length) {
      conflict = {
        selected: explicit,
        detected,
        signals: contrary.map((s) => ({ source: s.source, evidence: s.evidence })),
        summary: `This audit was run for ${getLocale(explicit).name}, but the page carries ${getLocale(detected).name} signals (${contrary.map((s) => s.source).join(", ")}).`,
      };
    }
  }

  return {
    market,
    locale: getLocale(market),
    source,
    confidence,
    selected: explicit,
    detected,
    signals,
    conflict,
  };
}

export default resolveMarket;
