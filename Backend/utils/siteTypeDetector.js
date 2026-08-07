import * as cheerio from "cheerio";
import fastFetch from "./fastFetch.js";
import { validateUrlSafety } from "./ssrfGuard.js";
import { detectSiteType as classifySiteType } from "./dealershipDetector.js";
import { classifyPageType, classifyCorporatePageType } from "./pageClassifier.js";
import { fetchWithBotBypass } from "./puppeteer_cheerio.js";
import { cachedSiteType } from "./siteTypeCache.js";
import logger from "./logger.js";

// Stealth-browser escalations here are now bounded by the SINGLE global browser
// pool (utils/browserManager.js, default MAX_CONCURRENT_BROWSERS=1) that every
// headless-Chrome launch in the app shares — this used to keep its own separate
// per-process limiter, which meant classification browsers weren't counted
// against the audit browsers and total concurrent Chrome could exceed the cap.
// fetchWithBotBypass takes a short-timeout permit and fails open if none is
// free, so under load classification yields to real audits (it was always a
// best-effort escalation that falls back to the plain-HTTP result anyway).

// A plain HTTP GET (fastFetch) can miss the real page for two different
// reasons a stealth browser can fix: (1) a Cloudflare/Turnstile/hCaptcha
// challenge page instead of the real site, or (2) a JS-only SPA shell whose
// real content only renders client-side (fastFetch just sees an empty <div
// id="root">). Both cases would otherwise be misclassified as "unknown" — and
// "unknown" is REFUSED, not failed open (see the gate in discoveryController.js
// and singleAuditController.js), so a real dealership that happens to sit
// behind a WAF is told it isn't one. Escalating is therefore the only thing
// standing between a transient block and a hard HTTP 400: use the same stealth
// browser the full audit uses whenever that's a real risk (see below).
//
// fetchWithBotBypass bounds itself internally rather than being raced against
// an external timeout — racing would occasionally orphan a still-launching
// browser with no reference left to close it, leaking a Chromium process.
// Awaiting it directly and closing in `finally` guarantees cleanup no matter
// how long it takes.
//
// That internal bound is NOT the "~45s" this comment used to claim. Adding up
// puppeteer_cheerio.js's own budgets — 15s to acquire a pool permit, 15s goto
// + 10s goto retry, then up to 2 bot-retry reloads at 10s — gives ~60s, on top
// of fastFetch's 8s + 8s. Measured against a host that black-holes packets:
// kwik-fit.com 84s, and 158s once the WAF guard's cooldown lands on top. A
// user is waiting on this at audit start, so treat those as the real numbers;
// shortening them means tightening puppeteer_cheerio.js's budgets, which the
// full audit path shares.
const MIN_HOMEPAGE_LINKS = 6;

// Visible-text floor below which the static HTML is treated as a shell rather
// than the page. Chosen from the gap in the measured distribution (see
// looksLikeJsShell), not tuned: shells topped out at 462 chars, real pages
// started at 2,722.
const MIN_HOMEPAGE_TEXT = 1200;

// The stock "this page needs JS" notice that every CRA/Vite/Next shell ships in
// its <noscript>. Matched against the <noscript> text only — the same words can
// appear in a cookie banner or an accessibility statement on a fully-rendered
// page, and treating those as shells would escalate half the web to a browser.
const JS_REQUIRED_RE = /\b(enable|turn on)\s+(java\s?script|js)\b|\bjava\s?script\s+(is\s+)?(required|must be enabled|disabled)\b/i;

// Homepage evidence alone is often too thin to confirm "dealer" — the anchor
// signals (VIN/stock#/inventory listings) usually live on a VDP/SRP subpage,
// not the hero/nav. Cap how many extra pages we'll fetch to keep this bounded.
const MAX_PROBE_PAGES = 2;

// Re-fetch the homepage with the stealth browser and re-classify. Returns null
// (never throws) on any failure — callers fall back to the original fast-path
// result, which is exactly today's fail-open behavior. Also hands back the
// cheerio doc + status so the caller can still run the subpage-probing step
// below against the REAL (unblocked/rendered) homepage. Bounded by the global
// browser pool (browserManager) shared with every audit browser — with a short
// acquire timeout, so under load it yields and falls back rather than queueing.
//
// No IP rotation / residential proxies here by design — routing traffic
// through someone else's residential IP to get past a site's own bot defenses
// sits in a legal/ethical gray area (ToS violations, jurisdiction-dependent
// legality) that isn't worth it for this feature. A site whose WAF blocks
// this app's IP/ASN outright (a static 403 with no solvable JS challenge) is
// a genuine, accepted limitation: it stays "unknown"/inconclusive, and the
// controller gate then refuses the audit with HTTP 400 — see
// dealershipDetector.js's unknownType()/inconclusive handling.
async function detectViaBrowser(url) {
  // Concurrency is now enforced globally inside fetchWithBotBypass's shared
  // browser (via the browserManager permit) — no separate limiter needed here.
  return runBrowserFetch(url);
}

async function runBrowserFetch(url) {
  try {
    // fetchWithBotBypass owns a shared, reused browser's lifecycle internally
    // (see puppeteer_cheerio.js) — it only opens/closes its own short-lived
    // context per call, so there's nothing left for this caller to clean up.
    const launched = await fetchWithBotBypass(url, "Desktop");
    if (!launched.$) return null;

    const result = await classifySiteType({ url, $: launched.$, statusCode: launched.statusCode });
    return { result, $: launched.$, statusCode: launched.statusCode };
  } catch (err) {
    logger.warn(`[siteTypeDetector] Browser escalation failed for ${url}: ${err.message}`);
    return null;
  }
}

// Visible-text length of a loaded document, scripts/styles excluded — the same
// notion of "text" collectPageSignals uses to match keywords, so the shell test
// and the signal engine agree on what the page actually says.
function visibleTextLength($doc) {
  if (!$doc) return 0;
  try {
    const $body = $doc("body").clone();
    $body.find("script, style, noscript, template").remove();
    return ($body.text() || "").replace(/\s+/g, " ").trim().length;
  } catch (_) {
    return 0;
  }
}

// Find same-origin links on the homepage that LOOK like a dealer inventory
// page (srp/vdp) or a corporate page (locator/models) — reusing the same
// classifiers the rest of the app uses to bucket pages, so "looks like an
// inventory link" means exactly what it means everywhere else. Best-effort:
// a malformed href is skipped, never thrown.
function findProbeCandidates(baseUrl, $homepage) {
  let origin;
  try { origin = new URL(baseUrl).origin; } catch (_) { return []; }

  const hrefs = new Set();
  try {
    $homepage("a[href]").each((_, el) => {
      const href = $homepage(el).attr("href");
      if (!href) return;
      try {
        const abs = new URL(href, baseUrl);
        if (abs.origin === origin) hrefs.add(abs.origin + abs.pathname);
      } catch (_) { /* malformed href — skip */ }
    });
  } catch (_) { /* ignore */ }

  const links = [...hrefs];
  const dealerCandidates = links.filter((u) => ["srp", "vdp"].includes(classifyPageType(u)));
  const corporateCandidates = links.filter((u) => ["locator", "models"].includes(classifyCorporatePageType(u)));

  // Prefer covering BOTH hypotheses (one dealer-looking + one corporate-looking
  // link) — but a single candidate on either side is one timeout away from a
  // wasted probe. If one side has nothing, spend its slot on a second
  // candidate from the other side instead of leaving it empty.
  const picks = [dealerCandidates[0], corporateCandidates[0]].filter(Boolean);
  for (const c of [...dealerCandidates.slice(1), ...corporateCandidates.slice(1)]) {
    if (picks.length >= MAX_PROBE_PAGES) break;
    if (!picks.includes(c)) picks.push(c);
  }
  return picks.slice(0, MAX_PROBE_PAGES);
}

// Fetch each candidate (fast plain GET — no browser; if a subpage itself is
// bot-protected we just skip it rather than escalating again) and return the
// ones that parsed, ready to hand to dealershipDetector as extraPages. In
// parallel — there are at most MAX_PROBE_PAGES of these, and a slow/timed-out
// one shouldn't cost the others their own budget. Every skip is logged so a
// "probing didn't help" outcome is diagnosable instead of silent.
async function fetchProbePages(candidateUrls) {
  const results = await Promise.all(candidateUrls.map(async (candidateUrl) => {
    const safe = await validateUrlSafety(candidateUrl);
    if (!safe.ok) {
      logger.info(`[siteTypeDetector] Probe candidate skipped (${safe.reason}): ${candidateUrl}`);
      return null;
    }
    const { html, status, errorCode } = await fastFetch(safe.url || candidateUrl);
    if (!html) {
      logger.info(`[siteTypeDetector] Probe fetch failed for ${candidateUrl} (${errorCode || status || "empty response"})`);
      return null;
    }
    try {
      return { url: candidateUrl, $: cheerio.load(html) };
    } catch (err) {
      logger.info(`[siteTypeDetector] Probe page unparsable for ${candidateUrl}: ${err.message}`);
      return null;
    }
  }));
  return results.filter(Boolean);
}

/**
 * Fetch a site's homepage and classify it as dealer / service / corporate /
 * unknown (plus the `siteSubType` that keys parameter applicability — see
 * dealershipDetector.js's header) via its signal engine. Tries a fast plain
 * HTTP GET first; if
 * that fetch was inconclusive (blocked, timed out, empty) OR the page came
 * back looking like a JS-only SPA shell (real content, but almost no links in
 * the raw HTML), escalates to a stealth browser that can render/bypass it. If
 * the (real) homepage still isn't confident either way, probes 1-2 subpages
 * that look like inventory or dealer-locator pages and merges their signals
 * in before giving up — a homepage alone frequently lacks the VIN/inventory
 * anchors that only show up on a VDP/SRP.
 *
 * dealershipDetector.detectSiteType() expects a pre-fetched cheerio doc — this
 * is the orchestrator that gets one. Used by the discovery endpoint (the single
 * homepage fetch for the whole audit-start flow) and, as a fallback, by the
 * audit-start controller when the frontend didn't already supply a siteType.
 *
 * `resolvedUrl` on the result is THIS url with only its HOSTNAME corrected —
 * equal to `url` unless the www. fallback below kicked in, in which case it is
 * the same page on the www. hostname. Callers that go on to crawl/audit the site
 * (e.g. discoveryController) MUST use `resolvedUrl`, not the original `url` —
 * the original may be a bare apex domain that fails outright (TLS/DNS-level),
 * even though classification itself succeeded against the working hostname.
 * It NEVER points at a different page: the path/query submitted is the page the
 * caller asked about, and site-type detection has no business changing it.
 *
 * @param {string} url
 * @returns {Promise<{siteType: 'dealer'|'service'|'corporate'|'unknown', siteSubType: 'franchise'|'independent'|'service'|'repair'|'corporate'|null, inconclusive: boolean, confidence: number, detectedBy: string[], reason: string, report: string, resolvedUrl: string}>}
 */
export async function detectSiteType(url, { bypassCache = false } = {}) {
  const result = await cachedSiteType(url, () => detectSiteTypeUncached(url), { bypass: bypassCache });
  return { ...result, resolvedUrl: resolvedUrlFor(url, result?.resolvedHost) };
}

/**
 * Build `resolvedUrl` for the URL actually being asked about.
 *
 * The verdict is cached per HOSTNAME — deliberately, since "is this a dealer" is
 * a property of the site, not of the page submitted. A full `resolvedUrl` is a
 * property of the PAGE, so caching one handed every later caller the URL of
 * whoever filled the cache. Not theoretical: auditing one inventory page pinned
 * carweek.com's entry to it, and for the next 7 days every "audit carweek.com"
 * was rewritten by the controller into an audit of that one page.
 *
 * What IS a site property, and the only thing this was ever for, is the working
 * hostname (`resolvedHost`, set only when the apex → www fallback actually
 * fired). Apply it to the submitted URL, keeping that URL's own path — and only
 * when it really is the www. form of the host asked about.
 */
function resolvedUrlFor(submittedUrl, resolvedHost) {
  if (!resolvedHost) return submittedUrl;
  try {
    const submitted = new URL(submittedUrl);
    const host = submitted.hostname.toLowerCase();
    if (host === resolvedHost) return submittedUrl;
    if (resolvedHost !== `www.${host}`) return submittedUrl;
    submitted.hostname = resolvedHost;
    return submitted.toString();
  } catch (_) {
    return submittedUrl;
  }
}

// The real work. Wrapped by detectSiteType above so repeat audits of the same
// host skip the homepage fetch (+ probes, + any browser escalation) entirely.
// Returns `resolvedHost` — the hostname that actually worked, and null when the
// submitted one did. NOT a full URL: this result is memoized per host and shared
// by every page on it, so anything page-specific in here becomes another page's
// answer. resolvedUrlFor() turns it back into a URL for each caller.
async function detectSiteTypeUncached(url) {
  const result = await detectSiteTypeForUrl(url);
  if (!result.inconclusive) return { ...result, resolvedHost: null }; // got a real, confident read either way — done

  // Bare-apex-domain fallback: a common real-world misconfiguration is a site
  // whose CDN/DNS only routes "www.example.com" to the real origin — the bare
  // "example.com" can fail completely (TLS handshake error, or the edge/CDN
  // itself returning a "can't resolve this hostname" error page) even though
  // the real site is one hostname away and works fine. Only tried once, and
  // only when we're not ALREADY on a www. hostname (no infinite ping-pong) and
  // only when the first attempt was truly inconclusive — a confident "unknown"
  // (a real, evaluated non-automotive site) never reaches here, so this adds
  // zero extra cost for the common case.
  let hasWww = false;
  try { hasWww = /^www\./i.test(new URL(url).hostname); } catch (_) { return { ...result, resolvedHost: null }; }
  if (hasWww) return { ...result, resolvedHost: null };

  let wwwUrl, wwwHost;
  try {
    const u = new URL(url);
    u.hostname = "www." + u.hostname;
    wwwHost = u.hostname;
    wwwUrl = u.toString();
  } catch (_) {
    return { ...result, resolvedHost: null };
  }

  logger.info(`[siteTypeDetector] ${url} was inconclusive — retrying with www. prefix: ${wwwUrl}`);
  const wwwResult = await detectSiteTypeForUrl(wwwUrl);
  return wwwResult.inconclusive ? { ...result, resolvedHost: null } : { ...wwwResult, resolvedHost: wwwHost };
}

async function detectSiteTypeForUrl(url) {
  const unknown = (reason, inconclusive = true) => ({
    siteType: "unknown",
    siteSubType: null,
    inconclusive,
    confidence: 0,
    detectedBy: [],
    reason,
    report: "",
  });

  const safe = await validateUrlSafety(url);
  if (!safe.ok) {
    return unknown(`Restricted URL — ${safe.reason}`);
  }

  const { html, status, errorCode } = await fastFetch(safe.url || url);

  let result;
  let $homepage = null;
  let homepageStatus = status;

  if (html) {
    try {
      $homepage = cheerio.load(html);
      result = await classifySiteType({ url, $: $homepage, statusCode: status });
    } catch (err) {
      result = unknown(`Failed to parse HTML: ${err.message}`);
    }
  } else {
    logger.info(`[siteTypeDetector] No HTML fetched for ${url} (${errorCode || status}) — unknown/inconclusive`);
    result = unknown("Could not fetch homepage HTML — inconclusive");
  }

  // A real page that just has very few links in its raw HTML is almost always
  // a JS-rendered SPA shell (React/Vue/Angular) — the actual nav/inventory
  // links only exist after client-side JS runs, which fastFetch never does.
  const linkCount = $homepage ? $homepage("a[href]").length : 0;

  // The link count alone badly under-detects, because a shell that
  // server-renders its top nav clears MIN_HOMEPAGE_LINKS while carrying no page
  // content whatsoever. Two better tells, measured across the corpus:
  //
  //   TEXT VOLUME — how much visible text the static HTML actually has. The
  //     separation is not marginal, it is a chasm: every confirmed shell came
  //     in at 0–462 characters (valvoline.com 0, driveway.com 20,
  //     texasdirectauto.com 152, discounttire.com 256, polestar.com 442,
  //     mclaren.com 462) while every fully-rendered page cleared 2,700
  //     (macktrucks.com 2,722 … longotoyota.com 14,690). MIN_HOMEPAGE_TEXT sits
  //     in the empty middle, so it is not a tuned number.
  //   DECLARED JS REQUIREMENT — the stock CRA/Vite <noscript>. discounttire.com
  //     ships ~10 nav links AND that notice; the link count alone let it
  //     through and a national tyre chain was refused an audit.
  // Strip script/style before measuring, exactly as collectPageSignals does.
  // Without that, a shell's inline bundles and JSON-LD count as "text" and the
  // thinnest pages in the corpus measure as the fattest — polestar.com (442
  // real characters) and mclaren.com (462) both sailed past the floor and were
  // never escalated.
  const bodyTextLength = visibleTextLength($homepage);
  const declaresJsRequired = $homepage ? JS_REQUIRED_RE.test($homepage("noscript").text() || "") : false;
  const looksLikeJsShell =
    result && result.siteType === "unknown" && !result.inconclusive &&
    (linkCount < MIN_HOMEPAGE_LINKS || bodyTextLength < MIN_HOMEPAGE_TEXT || declaresJsRequired);

  // A confident "unknown" verdict where the static page ALREADY shows real
  // automotive vocabulary (hasAutomotiveContext) is a different failure mode
  // than looksLikeJsShell above: the nav/links are fine, but a modern SPA
  // (e.g. rivian.com) can still gate its corporate hallmarks — investor
  // relations, sustainability — behind client-side JS in the footer, so the
  // static fetch never sees enough Group C evidence to clear the corporate
  // threshold. Confirmed empirically: rivian.com's static HTML already has
  // hasAutomotiveContext=true and only lacks the JS-rendered footer links; a
  // full render correctly resolves it to corporate.
  //
  // ALSO require hasRichCommerceSignals (a handful of genuine vehicle-sale
  // signals — trade-in, test-drive, payment, service, specials — beyond the
  // one generic Finance signal): a 250-site scale test showed bare
  // hasAutomotiveContext alone is too weak and escalates (and, before a
  // matching dealershipDetector.js fix, misclassified) companies for whom
  // automotive is just one vertical/product among many — eBay (sells auto
  // parts), Nvidia/Intel (automotive is one business unit), Salesforce
  // (automotive is one CRM industry vertical), Progressive/State Farm (they
  // insure vehicles, they don't make them). None of those have a real vehicle
  // sales process; rivian.com does (6 total signals). Requiring richness here
  // avoids wasting a browser escalation on sites that will end up "unknown"
  // anyway now that dealershipDetector.js's own verdict logic requires it too.
  const looksAutomotiveButUnresolved = result && result.siteType === "unknown" && !result.inconclusive && result.hasAutomotiveContext && result.hasRichCommerceSignals;

  if ((result && result.inconclusive) || looksLikeJsShell || looksAutomotiveButUnresolved) {
    logger.info(
      looksLikeJsShell
        ? `[siteTypeDetector] Homepage for ${url} looks like a JS-only shell (${linkCount} raw links) — escalating to stealth browser`
        : looksAutomotiveButUnresolved
          ? `[siteTypeDetector] ${url} already shows automotive context but couldn't confirm dealer/corporate statically — escalating to stealth browser in case JS-rendered content (e.g. footer) carries more evidence`
          : `[siteTypeDetector] Fast fetch was inconclusive for ${url} (${result.reason}) — escalating to stealth browser`
    );
    const escalated = await detectViaBrowser(url);
    if (escalated) {
      result = escalated.result;
      $homepage = escalated.$;
      homepageStatus = escalated.statusCode;
    }
  }

  // Homepage read succeeded and was genuinely evaluated (not blocked/empty),
  // but didn't carry enough evidence either way — top up with likely subpages
  // before settling for "unknown".
  if (result.siteType === "unknown" && !result.inconclusive && $homepage) {
    const candidates = findProbeCandidates(safe.url || url, $homepage);
    if (candidates.length) {
      logger.info(`[siteTypeDetector] Homepage inconclusive for ${url} — probing ${candidates.length} subpage(s): ${candidates.join(", ")}`);
      const extraPages = await fetchProbePages(candidates);
      if (!extraPages.length) {
        logger.info(`[siteTypeDetector] All probe candidate fetches failed for ${url} — staying with homepage-only result (unknown → audit refused at the controller gate)`);
      } else {
        const probed = await classifySiteType({ url, $: $homepage, statusCode: homepageStatus, extraPages });
        if (probed.siteType !== "unknown") {
          logger.info(`[siteTypeDetector] Probing resolved ${url} to "${probed.siteType}"`);
          result = probed;
        } else {
          logger.info(`[siteTypeDetector] Probing fetched ${extraPages.length} page(s) but still not enough evidence for ${url} — staying unknown (audit refused at the controller gate)`);
        }
      }
    } else {
      logger.info(`[siteTypeDetector] No inventory/locator-looking links found on ${url}'s homepage to probe — staying unknown (audit refused at the controller gate)`);
    }
  }

  return result;
}

export default detectSiteType;
