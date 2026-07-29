import axios from "axios";

/**
 * [NEW] — WAF guard for every BROWSERLESS (axios/fetch) request an audit makes.
 *
 * WHY THIS EXISTS — measured on fusz.com (Lou Fusz, a Dealer Inspire site behind
 * Cloudflare), which the UI reported as "Bot Protected":
 *
 *   • Our stealth browser, hitting the site FIRST, loads it perfectly:
 *     HTTP 200, real title, full screenshot. There is no JS challenge to solve.
 *   • A plain axios/curl GET is ALWAYS 403 — Cloudflare answers the non-browser
 *     TLS/HTTP fingerprint with the "Sorry, you have been blocked" WAF page
 *     (title "Attention Required! | Cloudflare"). That page is NOT solvable:
 *     it carries no challenge script, so reloading it can never clear it.
 *   • After ~7 of those blocked plain-HTTP requests from the same IP, Cloudflare
 *     escalates to an IP-level block and THEN the browser gets a blank 403 too —
 *     which is exactly what the audit's hard-block detector reports as
 *     "Bot Protected". The block decays again after a few minutes.
 *
 * A full audit fires dozens of browserless requests at the target (page
 * discovery HEAD/GET probes, robots.txt probes under bot UAs, llms.txt,
 * index-coverage, topical-authority, link checks). On a WAF-fronted site every
 * one of them is a 403 that damages the IP's reputation — so the audit blocks
 * ITSELF, and the visible symptom is a "Bot Protected" preview on a site that
 * our browser can actually render.
 *
 * WHAT THIS DOES
 *   1. Sends browser-shaped requests (real Chrome UA + Sec-CH-UA/Sec-Fetch
 *      headers) instead of curl-shaped ones.
 *   2. Replays the `cf_clearance` / `__cf_bm` / `datadome` / `incap_ses`
 *      cookies our stealth browser legitimately earned, so plain-HTTP requests
 *      ride the browser's own clearance instead of getting challenged.
 *   3. Paces requests per host (min gap + max in-flight) so we never burst.
 *   4. On a WAF block: warms clearance ONCE through the real browser and
 *      retries; if that fails, puts the host in a cooldown during which every
 *      further browserless request is SKIPPED rather than sent — this is what
 *      stops the escalation that was blinding the page render.
 *
 * Nothing here bypasses a challenge the browser didn't legitimately pass; it
 * only stops us from looking like a scraper and from hammering a WAF.
 */

// The exact UA our stealth browser advertises. Clearance cookies (cf_clearance
// especially) are bound to IP + UA, so browserless replays MUST match it.
export const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

// Header set a real Chrome navigation sends. curl-shaped requests (UA only) are
// the single easiest thing for a WAF to score as automation.
export const BROWSER_HEADERS = {
  "User-Agent": BROWSER_UA,
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Sec-Ch-Ua": '"Not_A Brand";v="8", "Chromium";v="125", "Google Chrome";v="125"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  Referer: "https://www.google.com/",
};

// Pacing, in two gears. An unprotected host (the ~95% case) gets a barely-there
// gap so audit timings don't regress; a host that has shown WAF behaviour — it
// blocked us once, or we hold clearance cookies for it — gets real spacing,
// because a burst is the loudest bot signal there is.
const SOFT_GAP_MS = Number(process.env.WAF_SOFT_GAP_MS || 80);
const MIN_GAP_MS = Number(process.env.WAF_MIN_GAP_MS || 500);
const SOFT_INFLIGHT = Number(process.env.WAF_SOFT_INFLIGHT || 6);
const MAX_INFLIGHT_PER_HOST = Number(process.env.WAF_MAX_INFLIGHT || 2);

// Escalating cooldowns. Cloudflare's IP-level block on the measured site decayed
// in ~1-3 minutes, so these are sized to outlast it rather than to punish.
const COOLDOWN_LADDER_MS = [45_000, 90_000, 180_000, 300_000];

// Don't pay for a browser warm-up more than once per host per this window.
const WARM_COOLDOWN_MS = 10 * 60 * 1000;

const WAF_COOKIE_RE =
  /^(cf_clearance|__cf_bm|cf_chl_|datadome|incap_ses|visid_incap|nlbi_|ak_bmsc|bm_sv|bm_mi|_abck)/i;

// host key → runtime state
const hosts = new Map();

function stateFor(key) {
  let s = hosts.get(key);
  if (!s) {
    s = {
      blockedUntil: 0,
      strikes: 0,
      lastRequestAt: 0,
      inflight: 0,
      queue: [],
      warmedAt: 0,
      warming: null,
      cookies: null, // { header: string, expiresAt: number }
    };
    hosts.set(key, s);
  }
  return s;
}

/**
 * Registrable-ish domain key (eTLD+1 approximation), matching the browser-side
 * clearance cache: a cf_clearance issued on www.foo.com is scoped to .foo.com,
 * so www / apex / subpaths all share one entry.
 */
export function wafHostKey(urlString) {
  try {
    const host = new URL(urlString).hostname.toLowerCase().replace(/^www\./, "");
    const parts = host.split(".").filter(Boolean);
    return parts.length <= 2 ? host : parts.slice(-2).join(".");
  } catch {
    return null;
  }
}

// ── Block detection ─────────────────────────────────────────────────────────

const BLOCK_BODY_RE =
  /attention required|sorry, you have been blocked|you are unable to access|cf-error-details|cf-browser-verification|just a moment|checking your browser|enable javascript and cookies to continue|error code:\s*10\d\d|ray id|incapsula|imperva|request unsuccessful|_incapsula_resource|datadome|perimeterx|px-captcha|access denied|akamai reference/i;

const BLOCKED_STATUSES = new Set([401, 403, 406, 409, 429, 503]);

/**
 * Does this browserless response mean "a WAF stopped us" (as opposed to a plain
 * application 403/404)? Needs a blocked status AND a WAF fingerprint — either a
 * marker in the body or a vendor header — so an ordinary permissions 403 never
 * puts a host into cooldown.
 */
export function isWafBlockResponse(status, body = "", headers = {}) {
  const h = {};
  for (const [k, v] of Object.entries(headers || {})) h[String(k).toLowerCase()] = v;

  const vendorHeader =
    h["cf-ray"] ||
    h["cf-mitigated"] ||
    h["x-iinfo"] ||
    h["x-datadome"] ||
    h["x-akamai-transformed"] ||
    /cloudflare/i.test(String(h["server"] || ""));

  // Body may be a Buffer (gzipped sitemaps are fetched as arraybuffer) — slice
  // before stringifying so a multi-MB binary body isn't decoded in full.
  const snippet = Buffer.isBuffer(body)
    ? body.subarray(0, 8000).toString("utf8")
    : String(body || "").slice(0, 8000);
  const markedBody = BLOCK_BODY_RE.test(snippet);

  if (BLOCKED_STATUSES.has(Number(status))) return !!(vendorHeader || markedBody);

  // A 200 that is really an interstitial ("Just a moment…") still means blocked.
  return markedBody && /just a moment|checking your browser|cf-browser-verification|enable javascript and cookies to continue/i.test(snippet);
}

// ── Reputation / cooldown ───────────────────────────────────────────────────

/** Record that this host blocked us (from the axios path OR the browser path). */
export function noteWafBlock(urlString, source = "http") {
  const key = wafHostKey(urlString);
  if (!key) return 0;
  const s = stateFor(key);
  const cooldown = COOLDOWN_LADDER_MS[Math.min(s.strikes, COOLDOWN_LADDER_MS.length - 1)];
  s.strikes += 1;
  s.blockedUntil = Math.max(s.blockedUntil, Date.now() + cooldown);
  console.warn(
    `🛡️ [WAF] ${key} blocked us (${source}) — pausing browserless requests for ${Math.round(cooldown / 1000)}s (strike ${s.strikes}).`
  );
  return cooldown;
}

/**
 * Record a clean response — the host isn't holding a grudge, reset the ladder.
 *
 * `source` matters: a clean BROWSER render says nothing about whether plain HTTP
 * is welcome, so on a zone that has already proven it blocks browserless traffic
 * even with clearance, a good render must not re-open the browserless gate.
 *
 * @param {string} urlString
 * @param {"http"|"browser"} [source="http"]
 */
export function noteWafOk(urlString, source = "http") {
  const key = wafHostKey(urlString);
  if (!key) return;
  const s = hosts.get(key);
  if (!s) return;
  if (source === "browser" && s.clearanceDidNotHelp) return;
  if (source === "http") s.clearanceDidNotHelp = false;
  s.strikes = 0;
  s.blockedUntil = 0;
}

/** Milliseconds left in this host's cooldown (0 when it may be requested). */
export function wafCooldownRemaining(urlString) {
  const key = wafHostKey(urlString);
  if (!key) return 0;
  const s = hosts.get(key);
  if (!s) return 0;
  return Math.max(0, s.blockedUntil - Date.now());
}

/** True when browserless requests to this host should be skipped entirely. */
export function isWafCoolingDown(urlString) {
  return wafCooldownRemaining(urlString) > 0;
}

// ── Clearance cookie sharing (browser → browserless) ────────────────────────

/**
 * Called by the browser layer whenever a stealth context legitimately earns WAF
 * clearance cookies. Stored as a ready-to-send Cookie header so plain-HTTP
 * requests inherit the browser's solve instead of being challenged on their own.
 */
export function registerClearanceCookies(urlString, cookies = [], expiresAt = 0) {
  try {
    const key = wafHostKey(urlString);
    if (!key || !Array.isArray(cookies) || !cookies.length) return;
    const usable = cookies.filter((c) => c && c.name && c.value && WAF_COOKIE_RE.test(c.name));
    if (!usable.length) return;
    const header = usable.map((c) => `${c.name}=${c.value}`).join("; ");
    const s = stateFor(key);
    s.cookies = { header, expiresAt: expiresAt || Date.now() + 15 * 60 * 1000 };
    // Clearance in hand → the host is workable again, so drop any cooldown and
    // let the browserless probes try once more. UNLESS this host has already
    // shown that clearance cookies don't rescue a non-browser request (Cloudflare
    // binds cf_clearance to the TLS fingerprint too, so on some zones only a real
    // browser ever gets through) — there, re-opening the gate would just feed the
    // WAF another 403 per page render.
    if (!s.clearanceDidNotHelp) {
      s.strikes = 0;
      s.blockedUntil = 0;
    }
  } catch {
    /* cookie sharing is best-effort */
  }
}

/** The Cookie header to attach for this host, or "" when we hold no clearance. */
export function clearanceCookieHeader(urlString) {
  const key = wafHostKey(urlString);
  if (!key) return "";
  const s = hosts.get(key);
  if (!s?.cookies) return "";
  if (s.cookies.expiresAt <= Date.now()) {
    s.cookies = null;
    return "";
  }
  return s.cookies.header;
}

// ── Per-host pacing ─────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// A host is "sensitive" once it has blocked us or once we have had to earn WAF
// clearance for it — only then is the slower, safer gear worth the latency.
function isSensitive(s) {
  return s.strikes > 0 || !!s.cookies;
}

async function acquireSlot(key) {
  const s = stateFor(key);
  const limit = isSensitive(s) ? MAX_INFLIGHT_PER_HOST : SOFT_INFLIGHT;
  if (s.inflight >= limit) {
    await new Promise((resolve) => s.queue.push(resolve));
  }
  s.inflight += 1;
  const gapTarget = isSensitive(s) ? MIN_GAP_MS : SOFT_GAP_MS;
  const gap = gapTarget - (Date.now() - s.lastRequestAt);
  if (gap > 0) await sleep(gap);
  s.lastRequestAt = Date.now();
}

function releaseSlot(key) {
  const s = stateFor(key);
  s.inflight = Math.max(0, s.inflight - 1);
  const next = s.queue.shift();
  if (next) next();
}

// ── Browser-backed clearance warm-up ────────────────────────────────────────

/**
 * Solve the host's protection ONCE in the real stealth browser so we obtain a
 * reusable clearance cookie, then let the caller retry its plain request with
 * it. Dynamic import keeps this module free of a static cycle with
 * puppeteer_cheerio (which imports this one). Never throws.
 */
async function warmClearance(urlString) {
  const key = wafHostKey(urlString);
  if (!key) return false;
  const s = stateFor(key);
  if (s.warming) return s.warming;
  if (Date.now() - s.warmedAt < WARM_COOLDOWN_MS) return false;

  s.warming = (async () => {
    try {
      s.warmedAt = Date.now();
      const { ensureDomainClearance } = await import("./puppeteer_cheerio.js");
      // Short acquire timeout: this is a degradable escalation that must never
      // queue behind (or deadlock with) a real page render holding a permit.
      await ensureDomainClearance(urlString, "Desktop", { acquireTimeoutMs: 15000 });
      return !!clearanceCookieHeader(urlString);
    } catch {
      return false;
    } finally {
      s.warming = null;
    }
  })();

  return s.warming;
}

// ── The guarded request ─────────────────────────────────────────────────────

const SKIPPED_RESPONSE = (url) => ({
  status: 0,
  data: "",
  headers: {},
  config: { url },
  wafSkipped: true,
  wafBlocked: true,
});

/**
 * Drop-in replacement for `axios.get`/`axios.head` against an AUDIT TARGET.
 *
 * Behaves like axios (network errors throw, HTTP statuses don't) plus:
 *   - returns a synthetic `{ status: 0, wafSkipped: true }` instead of sending
 *     a request to a host that is currently cooling down,
 *   - flags `wafBlocked` on the response when the answer was a WAF block,
 *   - warms browser clearance and retries once the first time a host blocks us.
 *
 * @param {string} url
 * @param {object} [opts] axios options, plus:
 *   @param {"get"|"head"} [opts.method="get"]
 *   @param {boolean} [opts.allowBrowserFallback=true] warm clearance + retry on block
 *   @param {boolean} [opts.respectCooldown=true] skip while the host is cooling down
 */
export async function guardedRequest(url, opts = {}) {
  const {
    method = "get",
    allowBrowserFallback = true,
    respectCooldown = true,
    headers: callerHeaders = {},
    ...axiosOpts
  } = opts;

  const key = wafHostKey(url);
  if (!key) {
    // Unparseable target — nothing to guard, behave exactly like axios.
    return axios({ url, method, validateStatus: () => true, ...axiosOpts, headers: { ...BROWSER_HEADERS, ...callerHeaders } });
  }

  if (respectCooldown && isWafCoolingDown(url)) {
    return SKIPPED_RESPONSE(url);
  }

  const send = async () => {
    const cookie = clearanceCookieHeader(url);
    const headers = { ...BROWSER_HEADERS, ...callerHeaders };
    if (cookie) headers.Cookie = headers.Cookie ? `${headers.Cookie}; ${cookie}` : cookie;

    await acquireSlot(key);
    try {
      return await axios({
        url,
        method,
        timeout: 12000,
        maxRedirects: 5,
        validateStatus: () => true,
        responseType: "text",
        ...axiosOpts,
        headers,
      });
    } finally {
      releaseSlot(key);
    }
  };

  const hadClearance = !!clearanceCookieHeader(url);
  let res = await send();

  if (!isWafBlockResponse(res.status, res.data, res.headers)) {
    noteWafOk(url);
    return res;
  }

  // Blocked while carrying the browser's clearance cookies → on this zone, no
  // browserless request will ever pass. Remember it so a later solve doesn't
  // re-open the gate and hand the WAF another 403.
  if (hadClearance) stateFor(key).clearanceDidNotHelp = true;

  // Blocked. If the browser can earn clearance for this host, replay the
  // request with it — that is the only thing that legitimately gets a
  // browserless request past a Cloudflare/Imperva gate.
  if (allowBrowserFallback && !clearanceCookieHeader(url)) {
    const warmed = await warmClearance(url);
    if (warmed) {
      res = await send();
      if (!isWafBlockResponse(res.status, res.data, res.headers)) {
        noteWafOk(url);
        return res;
      }
      stateFor(key).clearanceDidNotHelp = true;
    }
  }

  noteWafBlock(url, method);
  res.wafBlocked = true;
  return res;
}

export const guardedGet = (url, opts = {}) => guardedRequest(url, { ...opts, method: "get" });
export const guardedHead = (url, opts = {}) => guardedRequest(url, { ...opts, method: "head" });

export default guardedGet;
