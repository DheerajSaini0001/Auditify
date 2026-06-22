import axios from "axios";
import * as cheerio from "cheerio";
import { parseStringPromise } from "xml2js";
import { validateUrlSafety } from "./ssrfGuard.js";
import discoverPages from "./sitemapCrawler.js"; // Playwright fallback (bot-protected / JS-only sites)
import logger from "./logger.js";

/**
 * Dealership page discovery.
 *
 * Given the dealer's URL, find the main pages of the website using the order the
 * product spec calls for:
 *
 *   1. XML sitemap        — try the common sitemap paths directly.
 *   2. robots.txt         — if no sitemap, read robots.txt and follow any
 *                           `Sitemap:` directive it declares.
 *   3. Link crawl         — if still nothing, crawl internal links from the
 *                           entered URL (axios+cheerio; a Playwright crawl is the
 *                           last resort for bot-protected / JS-only sites).
 *
 * The discovered URLs are then bucketed into the fixed dealership page types the
 * checklist UI shows: Home, Inventory (SRP), Vehicle Detail (VDP), Special
 * Offers, Trade-In, Lease Specials, Finance, Service & Parts, About, and
 * Content.
 *
 * SECURITY: every URL fetched here is run through validateUrlSafety first. This
 * matters because robots.txt `Sitemap:` lines and sitemap-index children are
 * attacker-controllable and could otherwise point at internal/metadata hosts.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

const AXIOS_OPTS = {
  timeout: 12000,
  maxRedirects: 5,
  validateStatus: () => true, // a 403/503 block page is still useful signal
  responseType: "text",
  maxContentLength: 12 * 1024 * 1024,
  headers: {
    "User-Agent": UA,
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://www.google.com/",
  },
};

// Bounds so a giant sitemap or a crawl trap can't stall / blow up memory.
const MAX_SITEMAP_URLS = 1500;
const MAX_CHILD_SITEMAPS = 15;
const MAX_SITEMAP_DEPTH = 2;
const MAX_CRAWL_PAGES = 60;

// A VIN is 17 chars and never uses I, O, or Q — a strong VDP signal.
const VIN_RE = /\b[a-hj-npr-z0-9]{17}\b/i;

// A model year, 1900–2099.
const YEAR = "(?:19|20)\\d{2}";

// Automotive makes (mainstream, luxury, EV, and still-listed legacy brands),
// with common abbreviations and hyphen variants. Anchoring year-slug VDP rules to
// a real make keeps a non-vehicle page that merely carries a year (e.g.
// "/2024-memorial-day-sale") from being mistaken for a vehicle detail page.
const MAKE =
  "(?:acura|alfa-?romeo|aston-?martin|audi|bentley|bmw|buick|cadillac|chevrolet|chevy|chrysler|dodge|ferrari|fiat|ford|genesis|gmc|honda|hummer|hyundai|infiniti|isuzu|jaguar|jeep|kia|lamborghini|land-?rover|lexus|lincoln|lotus|lucid|maserati|maybach|mazda|mclaren|mercedes(?:-?benz)?|mercury|mini|mitsubishi|nissan|oldsmobile|polestar|pontiac|porsche|ram|rivian|rolls-?royce|saab|saturn|scion|smart|subaru|suzuki|tesla|toyota|vinfast|volkswagen|vw|volvo)";

// ── VDP (single-vehicle page) signals. A VDP always pins down ONE specific car,
// so every rule keys off a single-vehicle marker: a VIN, a stock/vehicle id, an
// explicit "details" segment, or a year+make in the slug. URL-only (never reads
// the page); precompiled so classifying a large pool stays cheap. ──────────────
const VDP_QUERY_RE = /[?&](?:vin|vehicleid|vehicle_id|vid|stocknumber|stocknum)=/i;
const VDP_DETAIL_RE = /\/(vehicle-?details?|vehicle-?info(?:rmation)?|vdp|car-?details?|cardetails?)(\/|$)/;
const VDP_ID_RE = /\/(vehicle|vehicles|listing|listings|detail|details|auto|car)\/\d{3,}(\/|$)/;
const VDP_FOLDER_YEAR_RE = new RegExp(`\\/(?:inventory|vehicles?|new|used|certified|cpo|pre-?owned|auto)\\/[^/]*\\b${YEAR}\\b[^/]*\\/?$`);
const VDP_YEAR_MAKE_RE = new RegExp(`\\/(?:[a-z0-9]+-)*${YEAR}-${MAKE}-`, "i"); // /2024-toyota-camry…
const VDP_MAKE_YEAR_RE = new RegExp(`\\/${MAKE}-[a-z0-9-]*${YEAR}\\b`, "i");    // /toyota-camry-2024…

// VDP detection, also reused to mine a VDP off an SRP. `path` is the normalized
// (lowercased, no trailing slash) pathname; `url` is the full lowercased URL.
const isVdp = (path, url) =>
  VDP_QUERY_RE.test(url) ||
  VIN_RE.test(path) ||
  VDP_DETAIL_RE.test(path) ||
  VDP_ID_RE.test(path) ||
  VDP_FOLDER_YEAR_RE.test(path) ||
  VDP_YEAR_MAKE_RE.test(path) ||
  VDP_MAKE_YEAR_RE.test(path);

// ── SRP (inventory listing / search-results) signals. A listing/landing page for
// MANY vehicles — no single-car identifier. VDP is tested first in MATCH_ORDER, so
// any slug carrying a VIN or year+make is already claimed as a VDP before this. ──
const SRP_KEYWORDS_RE = new RegExp(
  [
    "inventory",                                                     // *-inventory, inventory-*
    "showroom",
    "for-?sale",                                                     // cars-for-sale, vehicles-for-sale
    "pre-?owned",
    "(?:new|used|certified|cpo|all|our|current|featured|available|shop|browse|view|search)-?(?:cars?|vehicles?|trucks?|suvs?|inventory|listings?)",
    "(?:vehicle|car|auto)-?(?:search|finder|listings?)",
    "search-?(?:new|used|inventory|vehicles?|cars?)",
    "search(?:new|used)",                                            // Dealer.com / CDK: searchnew, searchused
    "vehiclesearchresults",
    "searchresults",
  ].join("|")
);
// Bare category folders: /new  /used  /certified  /cpo  /pre-owned  /vehicles  /trucks …
const SRP_FOLDER_RE = /^\/(new|used|certified|cpo|pre-?owned|vehicles?|cars?|trucks?|suvs?|sedans?|coupes?|vans?|minivans?|crossovers?|hatchbacks?|wagons?|convertibles?|hybrids?|electric|commercial(?:-vehicles?)?|fleet)\/?$/;
// Model-filtered listings: /new/<make>  /used/<make>/<model>  /inventory/<make> … (no year ⇒ not a VDP)
const SRP_MODEL_RE = new RegExp(`^\\/(?:new|used|certified|cpo|pre-?owned|inventory|vehicles)\\/${MAKE}(?:[-/]|$)`, "i");

const isSrp = (p) => SRP_KEYWORDS_RE.test(p) || SRP_FOLDER_RE.test(p) || SRP_MODEL_RE.test(p);

// Legal / utility / account pages that are never one of the dealership
// categories. Checked before MATCH_ORDER so a substring collision can't
// mis-bucket them — e.g. "/terms-of-service/" must NOT count as the Service
// department, and "/sitemap/" / "/thank-you/" aren't real pages we surface.
const EXCLUDE_RE =
  /\/(privacy(?:-policy)?|terms(?:-of-service|-of-use|-and-conditions)?|tos|legal|disclaimers?|accessibility|cookies?(?:-policy)?|do-not-sell|sitemap|site-map|thank-?you|404|login|sign-?in|register|my-account|account|cart|wishlist|saved-vehicles?)(?:\/|$)/;

// ── Category matchers, in priority order. First match wins for a given URL, so
// department-specific pages (service-specials, parts-specials, lease-specials)
// are claimed by their department before the generic "specials" bucket. ───────
const MATCH_ORDER = [
  { key: "vdp", test: (p, u) => isVdp(p, u) },
  {
    key: "trade",
    test: (p) =>
      /(trade-?in|value-(your|my)|whats?-?my-?(trade|car|vehicle)|sell-?(my|your|us)|we-(buy|want|pay)|cash-offer|apprais|kelley|kbb|trade-?value|instant-?offer)/.test(p),
  },
  { key: "lease", test: (p) => /lease/.test(p) },
  {
    key: "finance",
    test: (p) =>
      /(financ|credit-app|credit-application|700-?credit|pre-?approv|get-?(pre-?)?approved|payment-calc|loan|auto-loan|apply-?(for|online|now|today)?)/.test(p),
  },
  // Service & Parts — fixed-ops pages (service, repair, maintenance, collision)
  // merged with the parts/accessories department into one category.
  { key: "service", test: (p) => /(service|repair|maintenance|oil-change|brakes?|express-lane|collision|body-shop|detailing|parts|accessor|tires?\b|wheels?\b)/.test(p) },
  { key: "specials", test: (p) => /(special|offer|deal|incentive|saving|clearance|promo|rebate)/.test(p) },
  { key: "srp", test: (p) => isSrp(p) },
  {
    key: "about",
    test: (p) =>
      /(about|dealership|our-story|our-team|meet-(the|our)|staff|why-(us|buy|choose)|who-we-are|our-history|hours-and-direction)/.test(p),
  },
  // Content / Blog — incl. FAQ and How-To pages.
  { key: "content", test: (p) => /(blog|news|articles?|resources?|research|reviews?|tips|guides?|community|car-care|learn|faqs?|frequently-asked|how-?tos?|how-do-i)/.test(p) },
];

// The fixed checklist the UI renders, in the order the dealer expects to see it.
const DISPLAY = [
  { key: "home", label: "Home", hint: "Homepage" },
  { key: "srp", label: "Inventory (SRP)", hint: "Search Results Page — vehicle listings" },
  { key: "vdp", label: "Vehicle Detail (VDP)", hint: "Single vehicle page" },
  { key: "specials", label: "Special Offers", hint: "Sales specials & deals" },
  { key: "trade", label: "Trade-In Tool", hint: "Value-your-trade" },
  { key: "lease", label: "Lease Specials", hint: "Lease deals" },
  { key: "finance", label: "Finance", hint: "Financing / credit application" },
  { key: "service", label: "Service & Parts", hint: "Service, repair, parts & accessories" },
  { key: "about", label: "About", hint: "About the dealership" },
  { key: "content", label: "Content", hint: "Blog, news, FAQ & how-to" },
];

// Conventional URL slugs per category, hub-first. Dealership sites overwhelmingly
// use these paths, so when a page exists but is absent from the sitemap AND not
// linked from the homepage (reachable only by a secondary route), probing the
// known path finds it directly. `home` and `vdp` are intentionally absent —
// home is synthesized, and a VDP is dynamic (mined off an SRP, not guessable).
const CATEGORY_PROBE_PATHS = {
  srp: ["/inventory", "/new-inventory", "/used-inventory", "/new-vehicles", "/used-vehicles", "/vehicles", "/used", "/pre-owned"],
  specials: ["/specials", "/offers", "/current-offers", "/new-vehicle-specials", "/deals", "/incentives", "/manufacturer-specials", "/dealer-specials"],
  trade: ["/value-your-trade", "/trade-in", "/value-your-trade-in", "/trade-in-value", "/sell-us-your-car", "/whats-my-trade", "/kbb-trade-in-value", "/trade-appraisal"],
  lease: ["/lease-specials", "/lease-deals", "/lease-offers", "/leasing", "/lease", "/specials/lease"],
  finance: ["/finance", "/financing", "/finance-center", "/apply-for-financing", "/credit-application", "/apply-online", "/get-pre-approved", "/finance-application"],
  service: ["/service", "/service-center", "/schedule-service", "/service-and-parts", "/parts", "/parts-center", "/service-specials", "/order-parts"],
  about: ["/about-us", "/about", "/meet-our-team", "/our-team", "/staff", "/contact-us", "/contact", "/hours-and-directions"],
  content: ["/blog", "/news", "/resources", "/car-care-tips", "/faq", "/faqs", "/reviews"],
};

const normPath = (pathname) => (pathname.toLowerCase().replace(/\/+$/, "") || "/");

// New vs. used/CPO condition inferred from the URL path. Only applied to URLs we've
// already classified as SRP/VDP, so a segment like "used"/"new" is a reliable signal
// (boundary-anchored so "news"/"focused" don't false-match). null = condition unknown.
const USED_COND_RE = /(?:^|[-/])(?:used|cpo|certified|certified-pre-?owned|pre-?owned)(?:[-/]|$)/i;
const NEW_COND_RE = /(?:^|[-/])new(?:[-/]|$)/i;
const conditionOf = (rawUrl) => {
  let path;
  try { path = normPath(new URL(rawUrl).pathname); } catch { return null; }
  if (USED_COND_RE.test(path)) return "used";
  if (NEW_COND_RE.test(path)) return "new";
  return null;
};

// Resolve a URL to its checklist category (first match in MATCH_ORDER wins), or
// null if it matches none. Shared by rankCandidates (bucketing) and the sitemap
// early-exit check so both agree on exactly what counts as an SRP / VDP.
function categoryOf(raw) {
  let path, lower;
  try {
    const url = new URL(raw);
    path = normPath(url.pathname);
    lower = raw.toLowerCase();
  } catch {
    return null;
  }
  if (EXCLUDE_RE.test(path)) return null; // legal/utility page — never a category
  for (const def of MATCH_ORDER) {
    if (def.test(path, lower)) return { key: def.key, path, lower };
  }
  return null;
}

// True once the pool holds enough inventory to satisfy the sampling rules: an SRP
// story (either a separate new + used pair, or a single combined listing) AND at
// least 5 VDP candidates to sample from. Only then is there nothing more the
// remaining inventory sitemaps can add — callers use this to stop reading early.
// (A site that exposes only one condition never trips the "pair" branch, so it
// just keeps reading the rest of the bounded sitemap set, which is fine.)
const VDP_SAMPLE_SIZE = 5;
function poolHasEnoughInventory(pool) {
  let newSrp = false, usedSrp = false, genSrp = false, vdpCount = 0;
  for (const raw of pool) {
    const c = categoryOf(raw);
    if (!c) continue;
    if (c.key === "vdp") { vdpCount++; continue; }
    if (c.key === "srp") {
      const cond = conditionOf(raw);
      if (cond === "new") newSrp = true;
      else if (cond === "used") usedSrp = true;
      else genSrp = true;
    }
  }
  const srpReady = (newSrp && usedSrp) || genSrp;
  return srpReady && vdpCount >= VDP_SAMPLE_SIZE;
}

// SSRF-guarded GET. Returns empty/!ok on any block, error, or unsafe target.
async function safeGet(url) {
  const safe = await validateUrlSafety(url);
  if (!safe.ok) return { ok: false, blocked: true };
  try {
    const res = await axios.get(url, AXIOS_OPTS);
    const data = typeof res.data === "string" ? res.data : "";
    return {
      ok: res.status >= 200 && res.status < 400,
      status: res.status,
      data,
      contentType: String(res.headers?.["content-type"] || "").toLowerCase(),
    };
  } catch (err) {
    return { ok: false, error: err?.code || err?.message };
  }
}

// Parse a sitemap (or sitemap index, recursively) and add page URLs to `pool`.
async function collectFromSitemap(sitemapUrl, pool, depth = 0) {
  if (pool.size >= MAX_SITEMAP_URLS) return;
  const r = await safeGet(sitemapUrl);
  if (!r.ok || !r.data || !/<urlset|<sitemapindex/i.test(r.data)) return;

  const parsed = await parseStringPromise(r.data).catch(() => null);
  if (!parsed) return;

  if (parsed.sitemapindex?.sitemap && depth < MAX_SITEMAP_DEPTH) {
    let count = 0;
    for (const sm of parsed.sitemapindex.sitemap) {
      if (count++ >= MAX_CHILD_SITEMAPS || pool.size >= MAX_SITEMAP_URLS) break;
      const loc = sm?.loc?.[0];
      if (loc) await collectFromSitemap(loc.trim(), pool, depth + 1);
      // Stop opening further child sitemaps the moment we have an inventory
      // (SRP) page and a vehicle-detail (VDP) page — no need to read all of them.
      if (poolHasEnoughInventory(pool)) break;
    }
  }

  if (parsed.urlset?.url) {
    for (const entry of parsed.urlset.url) {
      if (pool.size >= MAX_SITEMAP_URLS) break;
      const loc = entry?.loc?.[0];
      if (loc) pool.add(loc.trim());
    }
  }
}

// Pull `Sitemap:` directives out of robots.txt.
async function sitemapsFromRobots(origin) {
  const r = await safeGet(`${origin}/robots.txt`);
  if (!r.ok || !r.data) return [];
  return [...r.data.matchAll(/^\s*sitemap:\s*(\S+)/gim)].map((m) => m[1].trim());
}

// Extract same-origin, non-asset internal links from an HTML document.
function extractLinks(html, baseUrl, origin, set, max) {
  const $ = cheerio.load(html);
  $("a[href]").each((_, el) => {
    if (set.size >= max) return false;
    const href = $(el).attr("href");
    if (!href) return;
    try {
      const abs = new URL(href, baseUrl);
      if (abs.origin !== origin) return;
      if (/\.(pdf|jpe?g|png|gif|svg|webp|zip|mp4|mp3|docx?|xlsx?|css|js|json|xml|woff2?|ttf|eot|ico)$/i.test(abs.pathname)) return;
      set.add(abs.origin + abs.pathname);
    } catch {
      /* ignore malformed hrefs */
    }
  });
}

// Lightweight crawl: fetch the homepage and read its (usually server-rendered) nav.
async function axiosCrawl(baseUrl, origin, max) {
  const found = new Set([baseUrl]);
  const r = await safeGet(baseUrl);
  if (r.ok && r.data && (r.contentType.includes("html") || r.contentType === "")) {
    extractLinks(r.data, baseUrl, origin, found, max);
  }
  return [...found];
}

// HTTP status of a URL — HEAD first, GET fallback (some servers reject HEAD).
// Returns 0 when the URL is unreachable. SSRF-guarded.
async function checkStatus(url) {
  const safe = await validateUrlSafety(url);
  if (!safe.ok) return 0;
  const opts = { ...AXIOS_OPTS, timeout: 7000 };
  try {
    const res = await axios.head(url, opts);
    if (res.status === 405 || res.status === 501) {
      const g = await axios.get(url, opts); // server rejects HEAD → confirm with GET
      return g.status;
    }
    return res.status;
  } catch {
    try {
      const g = await axios.get(url, opts);
      return g.status;
    } catch {
      return 0;
    }
  }
}

// A link counts as "dead" only when the server says the resource is missing.
// 403/401/503/timeouts mean "exists but blocked/unavailable", so we keep those.
const isDeadStatus = (status) => status === 404 || status === 410;

// Group pool URLs by category (first matching category wins per URL), with each
// category's candidates ranked best-first: hub pages (fewest path segments /
// shortest) lead, except VDP where a VIN page is preferred.
function rankCandidates(pool) {
  const byCat = {};
  for (const raw of pool) {
    const c = categoryOf(raw);
    if (!c) continue;
    const { key, path, lower } = c;
    const segs = path.split("/").filter(Boolean).length;
    const score =
      key === "vdp"
        ? (/[?&]vin=/.test(lower) || VIN_RE.test(path) ? 0 : 1)
        : segs * 1000 + path.length;
    (byCat[key] = byCat[key] || []).push({ url: raw, score });
  }
  for (const key of Object.keys(byCat)) byCat[key].sort((a, b) => a.score - b.score);
  return byCat;
}

// Walk a category's ranked candidates and return the first whose link isn't a
// dead 404/410 — so a stale sitemap entry (e.g. /vehicle) is skipped in favour
// of a live one (e.g. /vehicles). Bounded so a category can't fan out forever.
async function firstLiveUrl(candidates, max = 3) {
  for (const c of candidates.slice(0, max)) {
    if (!isDeadStatus(await checkStatus(c.url))) return c.url;
  }
  return null;
}

// Fisher–Yates shuffle (new array) — VDP sampling is meant to be random.
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Status-check {url,...} entries in parallel; keep only the ones that aren't a
// dead 404/410, preserving input order.
async function keepLive(items) {
  const checked = await Promise.all(items.map(async (it) => [it, await checkStatus(it.url)]));
  return checked.filter(([, s]) => !isDeadStatus(s)).map(([it]) => it);
}

// SRP plan: when a dealer keeps NEW and USED inventory on separate listing pages,
// audit both; otherwise audit the single combined/whatever listing. `byCat.srp` is
// already ranked best-hub-first, so index [0] of each condition group is the pick.
async function planSrp(byCat) {
  const all = (byCat.srp || []).map((c) => ({ url: c.url, cond: conditionOf(c.url) }));
  const fresh = all.filter((s) => s.cond === "new");
  const used = all.filter((s) => s.cond === "used");
  const general = all.filter((s) => s.cond === null);

  let plan;
  if (fresh.length && used.length) {
    plan = [
      { url: fresh[0].url, cond: "new", label: "New Inventory" },
      { url: used[0].url, cond: "used", label: "Used Inventory" },
    ];
  } else {
    const best = general[0] || fresh[0] || used[0];
    plan = best ? [{ url: best.url, cond: best.cond, label: "Inventory" }] : [];
  }
  return keepLive(plan);
}

// VDP plan: a random sample of up to 5 vehicle-detail pages. If the site has BOTH
// new and used cars, weight it 3 used + 2 new (per spec); otherwise take 5 of
// whatever exists. VDPs are frequently dynamic / missing from sitemaps, so we also
// mine candidates off each SRP page (tagging them with the SRP's condition). Picks
// are liveness-checked, with spares over-sampled to backfill any dead links.
async function sampleVdps(byCat, srpPages, origin) {
  let pool = (byCat.vdp || []).map((c) => ({ url: c.url, cond: conditionOf(c.url) }));

  for (const srp of srpPages) {
    if (pool.length >= 60) break;
    try {
      const r = await safeGet(srp.url);
      if (!r.ok || !r.data) continue;
      const links = new Set();
      extractLinks(r.data, srp.url, origin, links, 250);
      for (const u of links) {
        if (isVdp(normPath(new URL(u).pathname), u.toLowerCase())) {
          pool.push({ url: u, cond: conditionOf(u) || srp.cond || null });
        }
      }
    } catch { /* best-effort mining only */ }
  }

  // Dedupe by URL (mining can re-surface sitemap entries); first tag wins.
  const seen = new Set();
  pool = pool.filter((v) => (seen.has(v.url) ? false : seen.add(v.url)));

  const used = shuffled(pool.filter((v) => v.cond === "used"));
  const fresh = shuffled(pool.filter((v) => v.cond === "new"));
  const unknown = shuffled(pool.filter((v) => v.cond === null));

  let plan;
  if (used.length && fresh.length) plan = [...used.slice(0, 3), ...fresh.slice(0, 2)];
  else if (used.length) plan = used.slice(0, VDP_SAMPLE_SIZE);
  else if (fresh.length) plan = fresh.slice(0, VDP_SAMPLE_SIZE);
  else plan = unknown.slice(0, VDP_SAMPLE_SIZE);

  // Over-sample spares (kept in new/used-preference order) so dead links can be
  // backfilled, then keep the first 5 live ones.
  const chosen = new Set(plan.map((v) => v.url));
  const spares = [...used, ...fresh, ...unknown].filter((v) => !chosen.has(v.url));
  const live = await keepLive([...plan, ...spares].slice(0, VDP_SAMPLE_SIZE + 4));
  return live.slice(0, VDP_SAMPLE_SIZE);
}

/**
 * Discover the dealership's main pages.
 * @param {string} rawUrl  the dealer URL the user entered
 * @param {string[]|null} scopes  page-type keys to discover; null = all of them.
 *   Out-of-scope categories skip the expensive resolution (live-status checks,
 *   SRP planning, VDP sampling) so the backend does no work for pages the user
 *   excluded in the form.
 * @returns {Promise<object>} discovery result (source, steps, categories, …)
 */
export async function discoverDealerPages(rawUrl, scopes = null) {
  // A category is in scope when no filter was passed, or the filter includes it.
  const scopeSet = Array.isArray(scopes) && scopes.length ? new Set(scopes) : null;
  const inScope = (key) => !scopeSet || scopeSet.has(key);

  // Defensive: accept a bare domain ("machens.com") even though the controller
  // normally prefixes the protocol — otherwise new URL() would throw.
  let input = (rawUrl || "").trim();
  if (input && !/^https?:\/\//i.test(input)) input = "https://" + input;

  const safe = await validateUrlSafety(input);
  if (!safe.ok) {
    throw Object.assign(new Error(safe.reason || "Restricted URL"), { code: "UNSAFE_URL" });
  }

  const baseUrl = safe.url.replace(/\/+$/, "");
  const origin = new URL(baseUrl).origin;

  const pool = new Set();
  const steps = [];
  let source = "none";
  let sitemapUrl = null;

  logger.info(`🧭 Page discovery starting for ${origin}`);

  // ── Step 1: XML sitemap (direct) ──
  const candidatePaths = [
    "/sitemap.xml",
    "/sitemap_index.xml",
    "/sitemap-index.xml",
    "/sitemap1.xml",
    "/wp-sitemap.xml",
    "/sitemap/sitemap.xml",
  ];
  for (const path of candidatePaths) {
    const before = pool.size;
    await collectFromSitemap(origin + path, pool);
    if (pool.size > before) {
      sitemapUrl = origin + path;
      source = "sitemap";
      break;
    }
  }
  steps.push(
    sitemapUrl
      ? { key: "sitemap", label: "XML Sitemap", status: "found", url: sitemapUrl, detail: `Parsed ${pool.size} URLs from the sitemap` }
      : { key: "sitemap", label: "XML Sitemap", status: "missing", detail: "No sitemap at the common paths" }
  );

  // ── Step 2: robots.txt → Sitemap directive ──
  if (pool.size === 0) {
    const robotsSitemaps = await sitemapsFromRobots(origin);
    for (const sm of robotsSitemaps) {
      const before = pool.size;
      await collectFromSitemap(sm, pool);
      if (pool.size > before) {
        sitemapUrl = sm;
        source = "robots";
      }
      // Stop opening further robots.txt Sitemap: entries once we already have an
      // inventory (SRP) and a vehicle-detail (VDP) page.
      if (poolHasEnoughInventory(pool)) break;
    }
    steps.push(
      robotsSitemaps.length
        ? {
            key: "robots",
            label: "robots.txt",
            status: sitemapUrl ? "found" : "missing",
            url: sitemapUrl || undefined,
            detail: sitemapUrl
              ? "Sitemap located via robots.txt"
              : "robots.txt declared a sitemap, but it was empty or unreachable",
          }
        : { key: "robots", label: "robots.txt", status: "missing", detail: "No Sitemap directive in robots.txt" }
    );
  } else {
    steps.push({ key: "robots", label: "robots.txt", status: "skipped", detail: "Sitemap already found" });
  }

  // ── Step 3: link crawl — ALWAYS run a lightweight homepage scan and merge it
  // into the pool, even when the sitemap succeeded. Nav/footer links surface
  // category hubs that a sitemap can omit. Escalate to the Playwright crawler
  // only when we still have almost nothing (bot-protected / JS-only site). ──
  const beforeCrawl = pool.size;
  let links = await axiosCrawl(baseUrl, origin, MAX_CRAWL_PAGES);
  if (links.length < 5 && pool.size < 5) {
    try {
      const browserLinks = await discoverPages(baseUrl, MAX_CRAWL_PAGES);
      links = [...new Set([...links, ...browserLinks])];
    } catch (err) {
      logger.error(`[discovery] browser crawl failed: ${err.message}`);
    }
  }
  links.forEach((l) => pool.add(l));
  const crawlAdded = pool.size - beforeCrawl;
  if (pool.size > 0 && source === "none") source = "crawl";
  steps.push({
    key: "crawl",
    label: "Link crawl",
    status: crawlAdded > 0 ? "used" : pool.size ? "skipped" : "failed",
    detail:
      crawlAdded > 0
        ? `Crawled the homepage and added ${crawlAdded} link(s)`
        : pool.size
        ? "Homepage crawl added nothing new"
        : "Could not crawl any links",
  });

  // ── Categorize, then resolve each category's page(s) ──
  // A sitemap can list URLs that now 404. For the single-URL categories we walk
  // their ranked candidates and keep the first that isn't a dead 404/410 link.
  // SRP and VDP can fan out (see planSrp / sampleVdps) so they're resolved apart.
  const ranked = rankCandidates(pool);

  // Only resolve the categories the user kept in scope — out-of-scope ones skip the
  // live-status checks / SRP planning / VDP sampling entirely (no wasted backend work).
  const SINGLE_KEYS = Object.keys(ranked).filter((k) => k !== "srp" && k !== "vdp" && inScope(k));
  const picks = {};
  const resolved = await Promise.all(
    SINGLE_KEYS.map(async (key) => [key, await firstLiveUrl(ranked[key])])
  );
  for (const [key, url] of resolved) if (url) picks[key] = url;

  // SRP: both new + used listing pages when separate, else the single page.
  const srpPages = inScope("srp") ? await planSrp(ranked) : [];
  // VDP: a 5-car sample (3 used + 2 new when both exist), mined off the SRP(s) too.
  const vdpPages = inScope("vdp") ? await sampleVdps(ranked, srpPages, origin) : [];

  // Build the per-category page lists the audit will fan out over. Each entry is
  // { url, label, condition } — `label` distinguishes the multiple SRP/VDP samples.
  const pagesByKey = {};
  for (const key of Object.keys(picks)) {
    pagesByKey[key] = [{ url: picks[key], label: null, condition: null }];
  }
  if (srpPages.length) {
    pagesByKey.srp = srpPages.map((s) => ({ url: s.url, label: s.label, condition: s.cond || null }));
  }
  if (vdpPages.length) {
    const perCond = {};
    pagesByKey.vdp = vdpPages.map((v) => {
      const pretty = v.cond === "used" ? "Used" : v.cond === "new" ? "New" : "Vehicle";
      perCond[pretty] = (perCond[pretty] || 0) + 1;
      return { url: v.url, label: `${pretty} ${perCond[pretty]}`, condition: v.cond || null };
    });
  }

  const categories = DISPLAY.map((d) => {
    // Excluded in the form → not resolved. Flag it so the UI can say "Not included".
    if (!inScope(d.key)) {
      return { key: d.key, label: d.label, hint: d.hint, url: null, found: false, inScope: false, pages: [] };
    }
    if (d.key === "home") {
      const homeUrl = `${baseUrl}/`;
      return { key: d.key, label: d.label, hint: d.hint, url: homeUrl, found: true, inScope: true, pages: [{ url: homeUrl, label: null, condition: null }] };
    }
    const pages = pagesByKey[d.key] || [];
    return {
      key: d.key,
      label: d.label,
      hint: d.hint,
      url: pages[0]?.url || null,
      found: pages.length > 0,
      inScope: true,
      pages,
    };
  });

  const result = {
    url: baseUrl,
    origin,
    source,
    sitemapUrl,
    totalDiscovered: pool.size,
    foundCount: categories.filter((c) => c.found).length,
    totalCategories: categories.length,
    totalPages: categories.reduce((n, c) => n + (c.pages?.length || 0), 0),
    steps,
    categories,
  };

  logger.info(`🧭 Page discovery for ${origin} → source=${source}, ${result.foundCount}/${result.totalCategories} pages, ${pool.size} URLs`);
  return result;
}

export default discoverDealerPages;
