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
      /(financ|credit-app|credit-application|pre-?approv|get-?(pre-?)?approved|payment-calc|loan|auto-loan|apply-?(for|online|now|today)?)/.test(p),
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

const normPath = (pathname) => (pathname.toLowerCase().replace(/\/+$/, "") || "/");

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
  for (const def of MATCH_ORDER) {
    if (def.test(path, lower)) return { key: def.key, path, lower };
  }
  return null;
}

// True once the pool already holds BOTH an inventory (SRP) page and a
// vehicle-detail (VDP) page. Those two are what the large inventory sitemaps
// exist to serve, so once we have one of each there's nothing the remaining
// sitemaps can add that we still need — callers use this to stop reading early.
function poolHasSrpAndVdp(pool) {
  let srp = false;
  let vdp = false;
  for (const raw of pool) {
    const c = categoryOf(raw);
    if (!c) continue;
    if (c.key === "srp") srp = true;
    else if (c.key === "vdp") vdp = true;
    if (srp && vdp) return true;
  }
  return false;
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
      if (poolHasSrpAndVdp(pool)) break;
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

/**
 * Discover the dealership's main pages.
 * @param {string} rawUrl  the dealer URL the user entered
 * @returns {Promise<object>} discovery result (source, steps, categories, …)
 */
export async function discoverDealerPages(rawUrl) {
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
      if (poolHasSrpAndVdp(pool)) break;
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

  // ── Step 3: link crawl ──
  if (pool.size === 0) {
    let links = await axiosCrawl(baseUrl, origin, MAX_CRAWL_PAGES);
    // Homepage blocked or JS-only → escalate to the Playwright crawler, which
    // also retries the sitemap through a real browser (beats bot protection).
    if (links.length < 5) {
      try {
        const browserLinks = await discoverPages(baseUrl, MAX_CRAWL_PAGES);
        links = [...new Set([...links, ...browserLinks])];
      } catch (err) {
        logger.error(`[discovery] browser crawl failed: ${err.message}`);
      }
    }
    links.forEach((l) => pool.add(l));
    if (pool.size > 0) source = "crawl";
    steps.push({
      key: "crawl",
      label: "Link crawl",
      status: pool.size ? "used" : "failed",
      detail: pool.size ? `Crawled ${pool.size} internal links` : "Could not crawl any links",
    });
  } else {
    steps.push({ key: "crawl", label: "Link crawl", status: "skipped", detail: "Sitemap provided the pages" });
  }

  // ── Categorize, then validate each category's link by HTTP status ──
  // A sitemap can list URLs that now 404. For each category we walk its ranked
  // candidates and keep the first that isn't a dead 404/410 link (e.g. if
  // /vehicle is gone but /vehicles is live, /vehicles is what we add).
  const ranked = rankCandidates(pool);
  const picks = {};
  const resolved = await Promise.all(
    Object.keys(ranked).map(async (key) => [key, await firstLiveUrl(ranked[key])])
  );
  for (const [key, url] of resolved) if (url) picks[key] = url;

  // VDPs are often dynamic and absent from sitemaps. If we found a (live) SRP but
  // no VDP, fetch the SRP once and mine the first live vehicle link off it.
  if (!picks.vdp && picks.srp) {
    try {
      const r = await safeGet(picks.srp);
      if (r.ok && r.data) {
        const links = new Set();
        extractLinks(r.data, picks.srp, origin, links, 250);
        let tries = 0;
        for (const u of links) {
          if (tries >= 5) break; // bound the per-VDP status checks
          if (isVdp(normPath(new URL(u).pathname), u.toLowerCase())) {
            tries++;
            if (!isDeadStatus(await checkStatus(u))) {
              picks.vdp = u;
              break;
            }
          }
        }
      }
    } catch {
      /* best-effort only */
    }
  }

  const categories = DISPLAY.map((d) => ({
    key: d.key,
    label: d.label,
    hint: d.hint,
    url: d.key === "home" ? `${baseUrl}/` : picks[d.key] || null,
    found: d.key === "home" ? true : Boolean(picks[d.key]),
  }));

  const result = {
    url: baseUrl,
    origin,
    source,
    sitemapUrl,
    totalDiscovered: pool.size,
    foundCount: categories.filter((c) => c.found).length,
    totalCategories: categories.length,
    steps,
    categories,
  };

  logger.info(`🧭 Page discovery for ${origin} → source=${source}, ${result.foundCount}/${result.totalCategories} pages, ${pool.size} URLs`);
  return result;
}

export default discoverDealerPages;
