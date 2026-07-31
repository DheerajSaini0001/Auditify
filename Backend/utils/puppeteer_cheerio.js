import { chromium } from "playwright-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import * as cheerio from "cheerio";
import { acquireBrowserSlot, releaseBrowserSlot } from "./browserManager.js";
import {
  registerClearanceCookies,
  noteWafBlock,
  noteWafOk,
  isWafCoolingDown,
} from "./wafGuard.js";

// Use stealth plugin to evade common bot detection techniques
// [EXISTING STEALTH CONFIG — DO NOT MODIFY]
chromium.use(StealthPlugin());

// ======================== HELPERS ===========================

// [EXISTING] — Logger utility
const logger = {
  debug: (...args) => {
    if (process.env.DEBUG) {
      console.log(...args);
    }
  },
  info: (...args) => console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args)
};

// [FIX] — Centralized detached frame error detector
// Replaces all individual error string checks throughout the file
function isDetachedFrameError(error) {
  if (!error || !error.message) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('detached frame') ||
    msg.includes('attempted to use detached') ||
    msg.includes('session closed') ||
    msg.includes('target closed') ||
    msg.includes('execution context was destroyed') ||
    msg.includes('context was destroyed') ||
    msg.includes('cannot find context with specified id') ||
    msg.includes('frame was detached') ||
    msg.includes('frame operation timeout') ||
    msg.includes('navigating') ||
    msg.includes('same javascript world')
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// [ADD] — Per-domain WAF clearance-cookie cache (purely additive; nothing removed).
//
// WHY: every audit stage opens its OWN fresh browser context (a clean cookie jar):
// Stage 1 (homepage), discovery, and each of the ~6 Stage-2 key pages. On a
// Cloudflare/WAF-protected site that means the "Just a moment…" JS challenge is
// solved from scratch 8+ separate times — and each solve is an independent, timing-
// sensitive coin-flip, so some key pages fail the bypass even when the homepage
// passed. The result: the site is only PARTIALLY crawled.
//
// FIX: when ANY context clears the challenge, Cloudflare issues a `cf_clearance`
// cookie (Imperva → `incap_ses`/`visid_incap`, DataDome → `datadome`, Akamai →
// `ak_bmsc`/`bm_sv`) that is valid for the WHOLE domain for the cookie's lifetime
// (cf_clearance ≈ 30 min). We cache that cookie family keyed by registrable domain,
// and inject it into every later context for the same domain BEFORE its first
// navigation — so those pages get served the real content immediately and skip the
// challenge entirely. The whole site then crawls off a single solve.
//
// Fail-safe: if nothing is cached (or it expired) the injector is a no-op and the
// existing solve-and-retry flow runs exactly as before. Nothing is bypassed that
// the browser didn't already legitimately solve once.
const WAF_CLEARANCE_COOKIE_RE = /^(cf_clearance|__cf_bm|cf_chl_|datadome|incap_ses|visid_incap|nlbi_|ak_bmsc|bm_sv|bm_mi|_abck)/i;
// Fallback lifetime when a clearance cookie is a session cookie (no own expiry).
// Conservative: shorter than cf_clearance's ~30 min so we never present a stale token.
const CLEARANCE_FALLBACK_TTL_MS = 15 * 60 * 1000;
// domain → { cookies: [...playwright cookie objects], expiresAt: epoch-ms }
const wafClearanceCache = new Map();

// Registrable-ish domain key: last two labels of the hostname (eTLD+1 approximation).
// A cf_clearance issued on www.foo.com is scoped to .foo.com, so keying on foo.com
// lets the www/apex/inventory subpaths all share one solve.
function clearanceDomainKey(urlString) {
  try {
    const host = new URL(urlString).hostname.toLowerCase().replace(/^www\./, "");
    const parts = host.split(".").filter(Boolean);
    return parts.length <= 2 ? host : parts.slice(-2).join(".");
  } catch {
    return null;
  }
}

// After a context has legitimately cleared a challenge, stash its clearance cookies
// for the domain so sibling pages can reuse them. Best-effort; never throws.
async function saveClearanceCookies(context, urlString) {
  try {
    const key = clearanceDomainKey(urlString);
    if (!key || !context) return;
    const cookies = await context.cookies();
    const clearance = (cookies || []).filter((c) => c && c.value && WAF_CLEARANCE_COOKIE_RE.test(c.name));
    if (!clearance.length) return;

    // Expiry = the soonest REAL future cookie expiry in the set (use its full
    // lifetime — a cf_clearance is good until it actually expires). Only when no
    // cookie carries a usable expiry (all session cookies) do we fall back to the
    // conservative TTL so we never present a token of unknown age indefinitely.
    const now = Date.now();
    const realExpiries = clearance
      .map((c) => (typeof c.expires === "number" && c.expires > 0 ? c.expires * 1000 : 0))
      .filter((ms) => ms > now);
    const expiresAt = realExpiries.length ? Math.min(...realExpiries) : now + CLEARANCE_FALLBACK_TTL_MS;
    wafClearanceCache.set(key, { cookies: clearance, expiresAt });
    // [ADD] — Share the solve with the BROWSERLESS layer too. Every axios probe
    // the audit makes (page discovery, robots.txt, llms.txt, link checks) can now
    // ride this same clearance instead of being answered with a 403 block page —
    // which is what used to escalate a WAF into an IP-level block and blind the
    // page render itself. See utils/wafGuard.js.
    registerClearanceCookies(urlString, clearance, expiresAt);
    logger.info(`🍪 [WAF] Cached ${clearance.length} clearance cookie(s) for ${key} (reusable for ${Math.round((expiresAt - now) / 60000)} min)`);
  } catch (_) { /* caching is best-effort */ }
}

// Before a context's first navigation, replay any cached clearance cookies for the
// domain so its very first request already carries the token. Returns true if any
// were injected. Best-effort; never throws.
async function injectClearanceCookies(context, urlString) {
  try {
    const key = clearanceDomainKey(urlString);
    if (!key || !context) return false;
    const entry = wafClearanceCache.get(key);
    if (!entry) return false;
    if (entry.expiresAt <= Date.now()) { wafClearanceCache.delete(key); return false; }

    // Re-add exactly as Playwright returned them (name/value/domain/path/expires/
    // httpOnly/secure/sameSite are already in the shape addCookies expects).
    await context.addCookies(entry.cookies);
    logger.info(`🍪 [WAF] Injected ${entry.cookies.length} cached clearance cookie(s) for ${key} — skipping challenge if still valid`);
    return true;
  } catch (_) {
    return false;
  }
}

// [EXISTING] — Frame health check utility function
function isFrameAlive(frame) {
  try {
    if (!frame) return false;
    if (typeof frame.isDetached === "function") {
      return !frame.isDetached();
    }
    frame.url();
    return true;
  } catch {
    return false;
  }
}

// [EXISTING] — Safe frame operation wrapper with timeout
async function safeFrameOperation(frame, operation, timeoutMs = 5000) {
  if (!isFrameAlive(frame)) return null;

  try {
    const result = await Promise.race([
      operation(frame),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Frame operation timeout')), timeoutMs)
      )
    ]);
    return result;
  } catch (error) {
    // [FIX] — use centralized checker
    if (isDetachedFrameError(error)) {
      logger.debug('[Frame] Frame detached or timed out during operation — expected after challenge resolution');
      return null;
    }
    throw error;
  }
}

// [EXISTING] — Safe page content retriever with fallback
async function safePageContent(page) {
  try {
    if (!page || page.isClosed()) return "";
    return await page.content();
  } catch (error) {
    // [FIX] — use centralized checker
    if (isDetachedFrameError(error)) {
      logger.debug('[Frame] Fallback content serialization due to detached frame.');
      try {
        return await page.evaluate(() => document.documentElement.outerHTML);
      } catch (innerErr) {
        return "<html><body>Failed to serialize content due to detached frame</body></html>";
      }
    }
    throw error;
  }
}

// [FIX] — Safe page.title() wrapper
// Replaces all bare await page.title() calls
async function safeGetTitle(page) {
  try {
    if (!page || page.isClosed()) return "";
    return await page.title();
  } catch (e) {
    if (isDetachedFrameError(e)) {
      logger.debug('[Frame] page.title() skipped — frame detached');
      return "";
    }
    return "";
  }
}

/** Random integer between min and max (inclusive) */
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

/** Async delay */
const delay = (ms) => Promise.resolve();

// [FIX] — autoScroll wrapped with detached frame protection
async function autoScroll(page) {
  try {
    if (!page || page.isClosed()) return;
    await page.evaluate(async () => {
      // [EXISTING autoScroll logic — DO NOT MODIFY]
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 400;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight || totalHeight > 10000) {
            clearInterval(timer);
            resolve();
          }
        }, 50);
      });
    });
  } catch (error) {
    // [FIX] — use centralized checker
    if (isDetachedFrameError(error)) {
      logger.debug('[Frame] autoScroll skipped — frame detached during scroll');
      return;
    }
    throw error;
  }
}

// [FIX] — Wait for all images to finish loading via their onload event.
// Navigation uses "domcontentloaded", which fires BEFORE images load, so the
// screenshot was captured with blank/half-loaded images. This waits for each
// <img> onload (or error/timeout) so the preview renders with images present.
async function waitForImagesLoaded(page, timeoutMs = 12000) {
  try {
    if (!page || page.isClosed()) return;
    await page.evaluate(async (maxWait) => {
      const imgs = Array.from(document.images || []);
      await Promise.race([
        Promise.all(imgs.map((img) => {
          // Already loaded (cached or complete)
          if (img.complete && img.naturalWidth > 0) return Promise.resolve();
          return new Promise((resolve) => {
            img.addEventListener('load', resolve, { once: true });
            img.addEventListener('error', resolve, { once: true });
          });
        })),
        // Hard cap so a single stuck image can't hang the audit
        new Promise((resolve) => setTimeout(resolve, maxWait)),
      ]);
    }, timeoutMs);
  } catch (error) {
    if (isDetachedFrameError(error)) {
      logger.debug('[Frame] waitForImagesLoaded skipped — frame detached');
      return;
    }
    // Non-critical — never fail the audit because of image waiting
    logger.debug('[Frame] waitForImagesLoaded non-fatal error:', error.message);
  }
}

// [FIX] — handlePopups wrapped with detached frame protection
async function handlePopups(page) {
  try {
    if (!page || page.isClosed()) return;
    await page.evaluate(() => {
      // [EXISTING handlePopups logic — DO NOT MODIFY]
      const commonSelectors = [
        '[id*="cookie"]', '[class*="cookie"]',
        '[id*="consent"]', '[class*="consent"]',
        '[id*="modal"]', '[class*="modal"]',
        '.cmp-container', '#onetrust-consent-sdk', '.banner-content'
      ];

      commonSelectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          if (el && (
            el.innerText.toLowerCase().includes('accept') ||
            el.innerText.toLowerCase().includes('agree') ||
            el.innerText.toLowerCase().includes('consent')
          )) {
            el.style.display = 'none';
          }
        });
      });
    });
  } catch (e) {
    // [FIX] — use centralized checker, silently fail for both cases
    if (isDetachedFrameError(e)) {
      logger.debug('[Frame] handlePopups skipped — frame detached');
      return;
    }
    // Silently fail for all other errors too — non-critical
  }
}

// [FIX] — Screenshot cleanup: hide cookie/consent banners and chat/messenger
// widgets that render AFTER the initial handlePopups pass (many consent
// platforms and chat SDKs inject themselves a few seconds post-load) and would
// otherwise cover the hero in the captured preview. This ONLY sets
// display:none on matched overlay nodes in the live page for the screenshot —
// the HTML the audit parses is captured separately and is untouched. Fully
// non-fatal: any failure is swallowed so it can never break the audit.
async function dismissOverlays(page) {
  try {
    if (!page || page.isClosed()) return;
    await page.evaluate(() => {
      // Known consent-management platforms + chat/messenger widgets, matched by
      // substrings that appear in their container id/class or iframe src. These
      // are the vendors whose banners/bubbles commonly overlay the fold.
      const VENDOR_HINTS = [
        // consent / cookie platforms
        "onetrust", "ot-sdk", "cookiebot", "coi-banner", "c15t", "osano",
        "termly", "iubenda", "usercentrics", "trustarc", "truste", "quantcast",
        "qc-cmp", "didomi", "klaro", "cookieyes", "borlabs", "complianz",
        "cookie-consent", "cookie-notice", "cookie-law", "cookie-banner",
        "cookiebanner", "cc-banner", "cc-window", "gdpr", "cmpbox", "cmp-",
        "consent", "cookie",
        // chat / messenger widgets
        "kenect", "intercom", "drift", "tawk", "livechat", "live-chat",
        "tidio", "podium", "hs-messages", "hubspot-messages", "zopim",
        "zendesk", "zEChat", "crisp-client", "gorgias-chat", "olark",
        "birdeye", "gubagoo", "activengage", "conversica", "messenger-widget",
        "chat-widget", "chat-bubble", "chatbot",
      ];
      const matchesHint = (s) => {
        if (!s) return false;
        const v = String(s).toLowerCase();
        return VENDOR_HINTS.some((h) => v.includes(h.toLowerCase()));
      };

      const hide = (el) => { try { el.style.setProperty("display", "none", "important"); } catch (_) {} };

      // 1) Elements whose id/class/aria-label matches a known vendor hint.
      try {
        // Guards so overlay-dismissal can NEVER blank the page: a consent widget
        // injected near <body> (e.g. ComplyAuto's ca-cookieconsent on
        // lexusofnorthmiami.com) must not take a big layout wrapper — or <body>
        // itself — down with it. That exact bug made the screenshot come back pure
        // white even though the DOM had fully loaded the real page.
        const STRUCTURAL = new Set(["BODY", "HTML", "MAIN"]);
        const tooBig = (node) => {
          try {
            const r = node.getBoundingClientRect();
            return (r.width * r.height) > (window.innerWidth * window.innerHeight * 0.6);
          } catch (_) { return false; }
        };
        document.querySelectorAll("div, aside, section, iframe").forEach((el) => {
          if (matchesHint(el.id) || matchesHint(el.className) || matchesHint(el.getAttribute("aria-label")) ||
              (el.tagName === "IFRAME" && matchesHint(el.getAttribute("src")))) {
            // Walk up ONLY to find a fixed/sticky overlay ancestor. If none exists,
            // do NOT hide any ancestor — walking into static layout (or <body>) is
            // what blanked the page. And never hide a structural or viewport-sized node.
            let target = el;
            let foundPositioned = false;
            for (let i = 0; i < 4 && target.parentElement; i++) {
              const pos = getComputedStyle(target).position;
              if (pos === "fixed" || pos === "sticky") { foundPositioned = true; break; }
              target = target.parentElement;
            }
            if (!STRUCTURAL.has(el.tagName) && !tooBig(el)) hide(el);
            if (foundPositioned && target !== el && !STRUCTURAL.has(target.tagName) && !tooBig(target)) hide(target);
          }
        });
      } catch (_) { /* ignore */ }

      // 2) Text-based fallback for consent banners whose markup carries no
      //    vendor hint: a fixed/sticky overlay whose (short) text reads like a
      //    cookie/privacy notice. Length-bounded so we never nuke real content.
      try {
        const NEEDLES = ["we value your privacy", "we use cookies", "this site uses cookies",
          "accept all cookies", "cookie policy", "your privacy", "manage cookies"];
        document.querySelectorAll("div, aside, section").forEach((el) => {
          const pos = getComputedStyle(el).position;
          if (pos !== "fixed" && pos !== "sticky") return;
          const txt = (el.innerText || "").toLowerCase();
          if (txt.length > 0 && txt.length < 400 && NEEDLES.some((n) => txt.includes(n))) hide(el);
        });
      } catch (_) { /* ignore */ }
    });
  } catch (error) {
    if (isDetachedFrameError(error)) {
      logger.debug('[Frame] dismissOverlays skipped — frame detached');
      return;
    }
    logger.debug('[Frame] dismissOverlays non-fatal error:', error.message);
  }
}

// [EXISTING — DO NOT MODIFY] — detectChallenge with [FIX] applied to each evaluate
export async function detectChallenge(page) {
  try {
    // [FIX] — individually wrapped evaluate for contentCheck
    let contentCheck = false;
    try {
      if (!page || page.isClosed()) return false;
      contentCheck = await page.evaluate(() => {
        const bodyText = document.body?.innerText || "";
        const linkCount = document.querySelectorAll('a').length;
        const paragraphCount = document.querySelectorAll('p').length;
        const hasNav = !!document.querySelector('nav');
        const hasMain = !!document.querySelector('main');
        const hasHeader = !!document.querySelector('header');
        const hasFooter = !!document.querySelector('footer');

        const structuralElements = [hasNav, hasMain, hasHeader, hasFooter].filter(Boolean).length;

        return (bodyText.length > 500 && (linkCount > 5 || paragraphCount > 2)) ||
               structuralElements >= 2;
      });
    } catch (e) {
      if (isDetachedFrameError(e)) {
        logger.debug('[Frame] detectChallenge contentCheck skipped — frame detached');
        return false;
      }
      throw e;
    }

    if (contentCheck) return false;

    // [FIX] — safeGetTitle replaces bare page.title()
    const title = await safeGetTitle(page);

    const content = await safePageContent(page);

    const strongSelectors = [
      '#challenge-running',
      '#challenge-form',
      '.challenge-form',
      '#cf-bubbles',
      '#challenge-stage',
      '#cf-spinner',
      '.cf-browser-verification',
      '#hcaptcha-box',
      '.g-recaptcha',
      '#px-captcha',
      '#captcha-container',
      '.distil-captcha',
      '#captchacharacters',
      'form[action*="/errors/validateCaptcha"]',
      '#challenge-error-title'
    ];

    // [FIX] — individually wrapped evaluate for hasChallengeSelector
    let hasChallengeSelector = false;
    try {
      if (!page || page.isClosed()) return false;
      hasChallengeSelector = await page.evaluate((selList) => {
        return selList.some(s => document.querySelector(s));
      }, strongSelectors);
    } catch (e) {
      if (isDetachedFrameError(e)) {
        logger.debug('[Frame] detectChallenge hasChallengeSelector skipped — frame detached');
        return false;
      }
      throw e;
    }

    // [FIX] — individually wrapped evaluate for hasActiveTurnstile
    let hasActiveTurnstile = false;
    try {
      if (!page || page.isClosed()) return false;
      hasActiveTurnstile = await page.evaluate(() => {
        const iframes = Array.from(document.querySelectorAll('iframe'));
        return iframes.some(iframe =>
          iframe.src.includes('challenges.cloudflare.com') ||
          iframe.src.includes('hcaptcha.com')
        );
      });
    } catch (e) {
      if (isDetachedFrameError(e)) {
        logger.debug('[Frame] detectChallenge hasActiveTurnstile skipped — frame detached');
        return false;
      }
      throw e;
    }

    const isChallengeTitle =
      title === "Just a moment..." ||
      title.includes("Attention Required!") ||
      title === "Please Wait..." ||
      title === "Cloudflare" ||
      title.includes("Access Denied") ||
      title.includes("Checking your browser") ||
      title.includes("Robot Check") ||
      title.includes("Human Verification") ||
      title.includes("Verify you are human");

    const strongContentSignals = [
      "cf-browser-verification",
      "Verifying you are human",
      "Checking if the site connection is secure",
      "Enter the characters you see below",
      "automated access to Amazon",
    ];

    // [FIX] — individually wrapped evaluate for bodyText
    let bodyText = "";
    try {
      if (!page || page.isClosed()) return false;
      bodyText = await page.evaluate(() => document.body?.innerText || "");
    } catch (e) {
      if (isDetachedFrameError(e)) {
        logger.debug('[Frame] detectChallenge bodyText skipped — frame detached');
        return false;
      }
      throw e;
    }

    const hasStrongContent = strongContentSignals.some(signal =>
      bodyText.includes(signal) || content.includes(signal)
    );

    let score = 0;
    if (isChallengeTitle) score += 3;
    if (hasChallengeSelector) score += 2;
    if (hasActiveTurnstile) score += 2;
    if (hasStrongContent) score += 2;
    if (bodyText.length < 200) score += 1;

    return score >= 2;
  } catch (e) {
    // [FIX] — use centralized checker
    if (isDetachedFrameError(e)) {
      logger.debug('[Frame] Detached frame or target closed encountered during challenge detection — expected behavior');
      return false;
    }
    return false;
  }
}

/**
 * [NEW] — Tell a SOLVABLE challenge apart from a HARD block.
 *
 * detectChallenge() answers "are we being gated?" but not "can we do anything
 * about it?", and the two need opposite handling:
 *
 *   • "challenge"  — Cloudflare/Turnstile interstitial ("Just a moment…",
 *     #challenge-form, a challenges.cloudflare.com iframe). Its JS computes an
 *     answer and issues cf_clearance, so WAITING and RELOADING is exactly right.
 *
 *   • "hardblock"  — a WAF rule said no: HTTP 403/429 with Cloudflare's
 *     "Sorry, you have been blocked" / "Attention Required!" error page (or a
 *     blank body). There is NO challenge script on that page, so reloading can
 *     never clear it — each retry is just one more blocked request teaching the
 *     WAF that this IP is a bot. Measured on fusz.com: the block is IP-scoped
 *     and decays on its own in a couple of minutes, so the only thing that helps
 *     is backing off, not retrying harder.
 *
 * @returns {Promise<"none"|"challenge"|"hardblock">}
 */
export async function classifyBlock(page, statusCode) {
  const gated = await detectChallenge(page);
  const status = Number(statusCode);
  const blockedStatus = [401, 403, 406, 429, 503].includes(status);

  let title = "";
  let body = "";
  let html = "";
  try {
    title = await safeGetTitle(page);
    html = (await safePageContent(page)) || "";
    body = await page.evaluate(() => document.body?.innerText || "").catch(() => "");
  } catch {
    /* best-effort — fall through on whatever we did read */
  }

  const probe = `${title}\n${body}\n${html.slice(0, 8000)}`;
  const hardMarkers =
    /sorry, you have been blocked|attention required|you are unable to access|cf-error-details|error code:\s*10\d\d|access denied|request unsuccessful|_incapsula_resource|reference #\d/i.test(probe);
  const solvableMarkers =
    /just a moment|checking your browser|cf-browser-verification|challenge-platform|_cf_chl|verifying you are human|challenges\.cloudflare\.com|hcaptcha|turnstile/i.test(probe);

  if (hardMarkers && !solvableMarkers) return "hardblock";

  // Blocked status with nothing renderable on the page is the silent variant of
  // the same wall (Imperva serves a completely empty 403 body).
  if (blockedStatus && !solvableMarkers) {
    const looksReal = await hasRealContent(page);
    if (!looksReal) return "hardblock";
  }

  if (gated || solvableMarkers) return "challenge";
  return "none";
}

/**
 * [NEW] — Recover from a hard WAF block by BACKING OFF, not by retrying harder.
 *
 * A Cloudflare IP-reputation block lifts on its own; what keeps it alive is more
 * blocked traffic. So: sit out a cool-off, drop the (worthless, possibly
 * flagged) cookie jar, re-inject any clearance a sibling context earned, land on
 * the origin root the way a person arriving from Google would, and only then go
 * back to the target URL. One attempt — if the wall is still there it is a real
 * block and the report should say so.
 *
 * @returns {Promise<{recovered: boolean, response: object|null, statusCode: number|string}>}
 */
const HARD_BLOCK_COOLOFF_MS = Number(process.env.WAF_HARD_BLOCK_COOLOFF_MS || 20000);

// The module-level `delay()` is a deliberate no-op (all the "human-like" pauses
// were zeroed out for speed), so the cool-off — the one wait whose whole purpose
// is to burn wall-clock while the WAF's block decays — needs a real timer.
const realSleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function recoverFromHardBlock(page, context, url, statusCode) {
  const waitMs = HARD_BLOCK_COOLOFF_MS;
  logger.warn(`🛡️ Hard WAF block (HTTP ${statusCode}) on ${url} — reloading is useless here; cooling off ${Math.round(waitMs / 1000)}s before one clean retry.`);

  try { await context.clearCookies(); } catch (_) { /* jar may already be empty */ }
  await realSleep(waitMs);
  await injectClearanceCookies(context, url);

  // Warm-up hop: a real visitor hits the origin root first, and the root is far
  // less likely to be rule-blocked than a deep path.
  try {
    const origin = new URL(url).origin;
    if (origin !== url.replace(/\/$/, "")) {
      await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => null);
      await realSleep(randInt(1200, 2500));
    }
  } catch (_) { /* warm-up is optional */ }

  let response = null;
  try {
    response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
  } catch (_) {
    return { recovered: false, response: null, statusCode };
  }

  const newStatus = response ? response.status() : statusCode;
  const verdict = await classifyBlock(page, newStatus);
  if (verdict === "hardblock") return { recovered: false, response, statusCode: newStatus };

  logger.info(`✅ Hard block cleared after cool-off for ${url} (HTTP ${newStatus}).`);
  return { recovered: true, response, statusCode: newStatus };
}

// [EXISTING — DO NOT MODIFY]
async function hasRealContent(page) {
  try {
    return await page.evaluate(() => {
      const bodyText = document.body.innerText || "";
      const linkCount = document.querySelectorAll('a').length;
      const paragraphCount = document.querySelectorAll('p').length;

      return (bodyText.length > 500 && (linkCount > 5 || paragraphCount > 2)) ||
             document.querySelector('nav') !== null ||
             document.querySelector('main') !== null ||
             document.querySelector('header') !== null;
    });
  } catch (e) {
    return false;
  }
}

// [EXISTING — DO NOT MODIFY]
function getFreshFrames(page) {
  try {
    if (!page || page.isClosed()) return [];
    return page.frames() || [];
  } catch (e) {
    return [];
  }
}

// [EXISTING — DO NOT MODIFY]
function isFrameDetached(frame) {
  try {
    if (!frame) return true;
    if (typeof frame.isDetached === "function") {
      return frame.isDetached();
    }
    frame.url();
    return false;
  } catch (e) {
    return true;
  }
}

// [EXISTING — DO NOT MODIFY]
function getFrameUrl(frame) {
  try {
    if (!frame || isFrameDetached(frame)) return "";
    return frame.url() || "";
  } catch (e) {
    return "";
  }
}

// [EXISTING — DO NOT MODIFY]
// Safely waits for a selector in matching frames and performs a human-like click.
async function safeClickCheckboxInFrame(page, framePatterns, selector, timeout = 3000) {
  if (!page || page.isClosed()) return false;

  try {
    const frames = getFreshFrames(page);

    for (const frame of frames) {
      if (!isFrameAlive(frame) || (page._detachedFrames && page._detachedFrames.has(frame))) {
        logger.debug('[Frame] Skipping detached frame');
        continue;
      }

      const url = getFrameUrl(frame);
      const isMainFrame = page.mainFrame() === frame;
      const isMatch = isMainFrame || framePatterns.some(pattern => url.includes(pattern));
      if (!isMatch) continue;

      try {
        await safeFrameOperation(frame, async (f) => {
          await f.waitForSelector(selector, { timeout });
        }).catch(() => null);

        if (page.isClosed() || !isFrameAlive(frame) || (page._detachedFrames && page._detachedFrames.has(frame))) continue;

        const box = await safeFrameOperation(frame, async (f) => {
          const checkbox = await f.$(selector);
          if (!checkbox) return null;
          return await checkbox.boundingBox();
        });

        if (box) {
          if (page.isClosed() || !isFrameAlive(frame) || (page._detachedFrames && page._detachedFrames.has(frame))) continue;

          await page.mouse.click(
            box.x + box.width / 2 + (Math.random() * 4 - 2),
            box.y + box.height / 2 + (Math.random() * 4 - 2)
          );
          return true;
        }
      } catch (innerErr) {
        // [FIX] — use centralized checker
        if (isDetachedFrameError(innerErr)) {
          logger.debug('[Frame] Challenge iframe detached after resolution — expected behavior, continuing...');
          continue;
        }
        logger.warn(`⚠️ [Playwright Checkbox] Skipped frame/element query due to unexpected error: ${innerErr.message}`);
      }
    }
  } catch (err) {
    // [FIX] — use centralized checker
    if (isDetachedFrameError(err)) {
      logger.debug('[Frame] Error scanning frames due to detachment (expected):', err.message);
    } else {
      logger.error(`❌ [Playwright Checkbox] Error scanning frames: ${err.message}`);
    }
  }
  return false;
}

// [EXISTING — DO NOT MODIFY]
export async function waitForChallengeResolution(page, timeout = 30000) {
  const startTime = Date.now();

  if (!await detectChallenge(page)) return true;

  const patterns = ['challenges', 'turnstile', 'hcaptcha'];
  const selectors = ['input[type="checkbox"]', '.ctp-checkbox-label', '#challenge-stage'];

  while (Date.now() - startTime < timeout) {
    if (page.isClosed()) return false;

    if (!await detectChallenge(page)) return true;

    for (const selector of selectors) {
      if (page.isClosed()) break;
      const clicked = await safeClickCheckboxInFrame(page, patterns, selector, 2000);
      if (clicked) {
        await delay(3000);
        break;
      }
    }

    // [FIX] — wrapped mouse.move with detached frame protection
    try {
      if (!page.isClosed()) {
        await page.mouse.move(randInt(100, 800), randInt(100, 600), { steps: randInt(5, 15) });
      }
    } catch (e) {
      if (!isDetachedFrameError(e)) throw e;
      logger.debug('[Frame] mouse.move skipped in challenge loop — frame detached');
    }

    await delay(randInt(2000, 4000));
  }

  return !await detectChallenge(page);
}

// --- Shared browser pool for fetchWithBotBypass ----------------------------
// Launching a full Chromium process is by far the most expensive part of a
// bot-bypass fetch (typically 0.5-3s, real CPU/RAM, and a brand-new OS
// process per call) — wasteful when classification runs many fetches over
// the life of the server. A Playwright BrowserContext, by contrast, is a
// cheap, fully-isolated "profile" (its own cookies/storage/cache) inside an
// already-running browser — creating and closing one costs ~10-50ms. So this
// keeps ONE browser alive across calls and hands out a fresh context per
// fetch, closing only the context when done. The browser is recycled after
// RECYCLE_AFTER_USES fetches (long-lived Chromium processes slowly accumulate
// memory) or if it's found disconnected (crashed) — either way the next
// caller transparently gets a freshly-launched one.
const BOT_BYPASS_LAUNCH_OPTIONS = {
  headless: true,
  args: [
    "--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage",
    "--disable-accelerated-2d-canvas", "--disable-gpu", "--hide-scrollbars",
    "--mute-audio", "--disable-blink-features=AutomationControlled",
    "--disable-features=IsolateOrigins,site-per-process", "--window-size=1920,1080",
    "--ignore-certificate-errors", "--no-zygote", "--disable-infobars",
    "--disable-automation", "--no-first-run", "--no-default-browser-check",
    "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows",
    "--lang=en-US,en",
  ],
};
const RECYCLE_AFTER_USES = 50;

let sharedBrowser = null;
let sharedBrowserUses = 0;
// Count of contexts currently open against `sharedBrowser` (incremented on
// creation, decremented via the context's own 'close' event — see
// newStealthContext below). CRITICAL for safe recycling: closing the shared
// browser while another concurrent caller still has an open context/page on
// it crashes that caller with "Target page, context or browser has been
// closed" and, being an unhandled rejection, can take down the whole Node
// process. Confirmed in production-scale testing (100-site concurrent run)
// — the old code recycled purely on a use-count threshold with no idea
// whether anyone was still using the browser.
let activeContexts = 0;
// Serializes getSharedBrowser() calls so concurrent callers can't race the
// check-then-close-then-launch sequence (one deciding to recycle while
// another still believes the old browser is fine to reuse).
let browserSetupPromise = null;

/**
 * Close the shared stealth browser if (and only if) nothing is using it.
 * Called from the audit worker's final cleanup: every worker_thread gets its own
 * instance of this module, so a shared browser spawned inside the worker (site-type
 * classification, robots/llms.txt fetches) outlives the audit as a leaked
 * ~120-250MB Chromium tree — thread exit does not kill the child process.
 * Safe-by-default: if a concurrent caller still holds a context, leave it alone
 * (closing under them crashes their session — see the activeContexts note above).
 */
export async function closeSharedBrowser() {
  if (!sharedBrowser || activeContexts > 0) return false;
  const b = sharedBrowser;
  sharedBrowser = null;
  sharedBrowserUses = 0;
  try { await b.close(); } catch (_) { /* already gone */ }
  return true;
}

async function getSharedBrowser() {
  if (browserSetupPromise) return browserSetupPromise;

  const isDead = sharedBrowser && !sharedBrowser.isConnected();
  const dueForRecycle = sharedBrowser && sharedBrowserUses >= RECYCLE_AFTER_USES && activeContexts === 0;
  if (sharedBrowser && !isDead && !dueForRecycle) {
    return sharedBrowser;
  }

  browserSetupPromise = (async () => {
    if (sharedBrowser) {
      try { await sharedBrowser.close(); } catch (_) { /* already gone */ }
      sharedBrowser = null;
    }
    const browser = await chromium.launch(BOT_BYPASS_LAUNCH_OPTIONS);
    sharedBrowser = browser;
    sharedBrowserUses = 0;
    return browser;
  })();

  try {
    return await browserSetupPromise;
  } finally {
    browserSetupPromise = null;
  }
}

// Best-effort cleanup so the shared browser doesn't linger as a zombie
// process if the app shuts down. Playwright/OS process-group teardown would
// likely catch this anyway, but an explicit close is cheap insurance.
for (const signal of ["SIGINT", "SIGTERM", "beforeExit"]) {
  process.once(signal, () => {
    if (sharedBrowser) { sharedBrowser.close().catch(() => {}); }
  });
}

// Create a fresh, fully-stealthed context+page from the shared browser pool.
// Extracted out of fetchWithBotBypass so OTHER crawlers (sitemapCrawler.js)
// can get the SAME bot-bypass sophistication — and the SAME shared browser,
// instead of each maintaining its own separate, weaker-stealth, non-pooled
// `chromium.launch()` — rather than duplicating this setup. Caller MUST close
// the returned `context` when done (never the browser — it's shared).
async function newStealthContext(device = 'Desktop', opts = {}) {
  const { acquireTimeoutMs = 60000, label = 'shared-browser' } = opts;

  // Take a GLOBAL browser permit before doing any work on the shared Chromium.
  // The shared browser is one reused process, but each concurrent context on it
  // is a real, CPU-costing browser workload — so it draws from the same pool as
  // every dedicated audit browser, keeping total *active* headless work at or
  // below MAX_CONCURRENT_BROWSERS. The permit is held for the whole context
  // lifetime and returned when the context closes (or on any failure below).
  // Degradable callers (site-type classification) pass a short acquireTimeoutMs
  // and fall back to their plain-HTTP result if no permit is free — never
  // forcing an extra browser, never deadlocking on a nested acquire.
  const permitSlotId = await acquireBrowserSlot({ timeoutMs: acquireTimeoutMs, label });
  let permitReleased = false;
  const releasePermit = () => {
    if (permitReleased) return;
    permitReleased = true;
    releaseBrowserSlot(permitSlotId);
  };

  let browser;
  try {
    browser = await getSharedBrowser();
  } catch (err) {
    releasePermit();
    throw err;
  }
  sharedBrowserUses++;

  const userAgent = device === "Mobile"
    ? "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36"
    : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

  const contextOptions = {
    userAgent,
    viewport: device === "Mobile" ? { width: 393, height: 852 } : { width: 1920, height: 1080 },
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="125", "Google Chrome";v="125"',
      'Sec-Ch-Ua-Mobile': device === "Mobile" ? '?1' : '?0',
      'Sec-Ch-Ua-Platform': device === "Mobile" ? '"Android"' : '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Referer': 'https://www.google.com/',
    },
    ignoreHTTPSErrors: true,
    locale: 'en-US',
    timezoneId: 'America/New_York',
  };
  if (device === "Mobile") { contextOptions.hasTouch = true; contextOptions.isMobile = true; }
  else { contextOptions.deviceScaleFactor = 2; }

  let context;
  try {
    context = await browser.newContext(contextOptions);
  } catch (err) {
    releasePermit();
    throw err;
  }
  activeContexts++;
  // Decrement AND return the global browser permit on close, REGARDLESS of who
  // closes it (caller's own finally block, or a crash) — this is what lets
  // getSharedBrowser() know it's safe to recycle and keeps the pool accurate.
  context.on('close', () => {
    activeContexts = Math.max(0, activeContexts - 1);
    releasePermit();
  });
  let page;
  try {
    page = await context.newPage();
  } catch (err) {
    await context.close().catch(() => {});
    releasePermit();
    throw err;
  }

  // Same fingerprint-evasion suite the full-audit path (Puppeteer_Cheerio
  // below) already uses — this lightweight classification path previously
  // only spoofed 3 properties (webdriver/languages/plugins), a much weaker
  // stealth level than the proven full-audit one, which is a real gap since
  // site-type detection is the FIRST thing to touch a new domain and needs to
  // survive the same WAFs. Wrapped so a single evasion failing can't abort
  // the rest.
  try {
  await page.addInitScript(() => {
    const safe = (fn) => { try { fn(); } catch (_) { /* evasion best-effort */ } };

    safe(() => Object.defineProperty(navigator, 'webdriver', { get: () => false }));
    safe(() => Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] }));
    safe(() => Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] }));
    safe(() => Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 }));
    safe(() => Object.defineProperty(navigator, 'platform', { get: () => 'Win32' }));
    safe(() => Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' }));
    safe(() => Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 }));

    safe(() => {
      if (!window.chrome) {
        window.chrome = {
          runtime: {},
          app: { isInstalled: false, InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' }, RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' } },
          csi: function () { },
          loadTimes: function () { },
        };
      }
    });

    safe(() => {
      const originalQuery = window.navigator.permissions && window.navigator.permissions.query;
      if (originalQuery) {
        window.navigator.permissions.query = (parameters) =>
          parameters && parameters.name === 'notifications'
            ? Promise.resolve({ state: Notification.permission })
            : originalQuery(parameters);
      }
    });

    safe(() => {
      Object.defineProperty(navigator, 'mimeTypes', {
        get: () => [
          { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
          { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' },
        ],
      });
    });

    safe(() => {
      const spoof = (proto) => {
        if (!proto) return;
        const getParameter = proto.getParameter;
        proto.getParameter = function (parameter) {
          if (parameter === 37445) return 'Intel Inc.';
          if (parameter === 37446) return 'Intel Iris OpenGL Engine';
          return getParameter.apply(this, [parameter]);
        };
      };
      spoof(window.WebGLRenderingContext && window.WebGLRenderingContext.prototype);
      spoof(window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype);
    });

    safe(() => {
      if (window.outerWidth === 0) Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth });
      if (window.outerHeight === 0) Object.defineProperty(window, 'outerHeight', { get: () => window.innerHeight + 74 });
    });

    safe(() => {
      if (!navigator.connection) {
        Object.defineProperty(navigator, 'connection', {
          get: () => ({ effectiveType: '4g', rtt: 50, downlink: 10, saveData: false }),
        });
      }
    });
  });
  } catch (err) {
    // Registering the evasion script failed (context/browser died mid-setup) —
    // tear down cleanly so we never leak the context or its global browser permit.
    await context.close().catch(() => {});
    releasePermit();
    throw err;
  }

  return { context, page };
}

/**
 * Get a fresh stealth context+page from the same shared browser pool
 * fetchWithBotBypass uses — for other crawlers (sitemapCrawler.js) that need
 * the same bot-bypass sophistication without reimplementing it. Caller MUST
 * call `context.close()` when done (never close the browser itself).
 *
 * @param {string} [device]
 * @returns {Promise<{context: object, page: object}>}
 */
export async function newStealthPage(device = 'Desktop', opts = {}) {
  // Discovery/crawl callers (sitemapCrawler) run BETWEEN audit stages, not
  // nested inside a held page browser, so they can wait for a permit. Default
  // to a generous acquire timeout + a "discovery" label for the pool logs.
  return newStealthContext(device, { acquireTimeoutMs: 60000, label: 'discovery', ...opts });
}

/**
 * [ADD] — WAF clearance WARM-UP. Solve a site's bot challenge ONCE, up front, in a
 * clean stealth context, and cache the resulting cf_clearance so every subsequent
 * page of the domain (the Stage-2 key pages) injects it and is served real content
 * on its FIRST request — no per-page challenge.
 *
 * Why a dedicated warm-up rather than relying on Stage 1: the full-audit render path
 * carries a resource-blocking route and a reload-based solve loop that make challenge
 * resolution timing-sensitive (some pages fail it). A plain navigate + quiet wait in a
 * clean context solves Cloudflare's managed challenge reliably in ~7s and yields a
 * long-lived cf_clearance — VERIFIED live: fresh context + injected cf_clearance loaded
 * a page that returns 403 with no cookies in 2.6s at HTTP 200, no challenge.
 *
 * Cost control for the 95% of sites with NO bot protection: this returns immediately
 * when clearance is already cached (Stage 1 got it), and otherwise gates the browser
 * work behind a ~200ms plain fetch — it only launches a context if that fetch actually
 * looks challenged (403/429/503 or a challenge marker in the body). Never throws;
 * bounded time; returns true iff the domain now has usable clearance.
 */
export async function ensureDomainClearance(url, device = 'Desktop', opts = {}) {
  // [ADD] — acquireTimeoutMs lets a degradable caller (the WAF guard's browserless
  // fallback) bound how long it will wait for a browser permit instead of queueing
  // behind real page renders. Default keeps the original behaviour.
  const { acquireTimeoutMs = 60000 } = opts;
  try {
    const key = clearanceDomainKey(url);
    if (!key) return false;

    // Fast path — a sibling context (e.g. Stage 1 or discovery) already solved it.
    const cached = wafClearanceCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      logger.info(`🍪 [WAF] Clearance for ${key} already cached — skipping warm-up.`);
      return true;
    }

    // Cheap gate: a browserless GET. Only a genuine challenge response is worth the
    // cost of launching a context — a normal 200 means the site isn't gating us.
    let challenged = false;
    // [ADD] — If the host is already known to be blocking our browserless requests,
    // skip the gate fetch entirely: we know the answer, and sending it would only
    // add one more blocked request to the reputation the browser has to survive.
    if (isWafCoolingDown(url)) {
      challenged = true;
    } else try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: {
          'User-Agent': device === 'Mobile'
            ? 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36'
            : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      });
      clearTimeout(id);
      let body = '';
      try { body = (await res.text()).slice(0, 4000).toLowerCase(); } catch (_) { /* body optional */ }

      // (a) An outright challenge in THIS response (status or body markers).
      const challengeNow =
        [403, 429, 503].includes(res.status) ||
        /just a moment|cf-browser-verification|challenge-platform|_cf_chl|attention required|checking your browser|incapsula|imperva incapsula/.test(body);

      // (b) The site sits behind a known WAF (Cloudflare/Imperva/DataDome/Akamai) even
      // when THIS request got a 200. A cookieless plain fetch is often served the cached
      // homepage at 200 while the real browser render — with JS, deep paths, and our
      // automation — gets challenged (exactly the flaky Stage-1 bot-protection we saw).
      // So if a WAF is fronting the domain and we have no clearance yet, warm up anyway:
      // the browser solve is the reliable way to obtain a reusable cf_clearance.
      const h = res.headers;
      const wafFronted =
        /cloudflare/i.test(h.get('server') || '') ||
        h.get('cf-ray') || h.get('cf-mitigated') ||
        h.get('x-datadome') || /datadome/i.test(h.get('set-cookie') || '') ||
        h.get('x-iinfo') || /incap_ses|visid_incap/i.test(h.get('set-cookie') || '') ||
        h.get('x-akamai-transformed') || /ak_bmsc|bm_sv/i.test(h.get('set-cookie') || '');

      challenged = challengeNow || !!wafFronted;
    } catch (_) {
      // A hung/blocked fetch is itself a bot-protection signal — proceed to warm up.
      challenged = true;
    }
    if (!challenged) return false; // No WAF / no challenge → nothing to warm up; audit runs as normal.

    logger.info(`🛡️ [WAF] ${key} is WAF-fronted / challenging — solving once to seed a shared clearance for the crawl...`);

    // Solve in a stealth context that does NOT carry the audit's resource-blocking
    // route — exactly the clean setup that resolves the challenge reliably.
    let context;
    try {
      const created = await newStealthContext(device, { acquireTimeoutMs, label: 'waf-warmup' });
      context = created.context;
      const page = created.page;
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
      await waitForChallengeResolution(page, 25000);
      // A reload once the clearance cookie exists lands on the real content.
      let solved = !(await detectChallenge(page));
      if (!solved) {
        try { await page.reload({ waitUntil: 'domcontentloaded', timeout: 30000 }); } catch (_) {}
        try { await page.waitForTimeout(3000); } catch (_) {}
        solved = !(await detectChallenge(page));
      }
      if (solved) {
        await saveClearanceCookies(context, url);
        return (wafClearanceCache.get(key)?.expiresAt || 0) > Date.now();
      }
      logger.warn(`🛡️ [WAF] Warm-up could not clear ${key} — key pages will fall back to solving individually.`);
      return false;
    } finally {
      if (context) { try { await context.close(); } catch (_) { /* already closed */ } }
    }
  } catch (_) {
    return false;
  }
}

/**
 * Lightweight bot-bypass fetch — for callers that only need the rendered HTML
 * (e.g. site-type classification), not a screenshot or a fully-loaded page.
 * Reuses the same stealth launch config and challenge-resolution logic as
 * Puppeteer_Cheerio below, but skips autoScroll/popup-handling/image-wait/
 * screenshot capture — ~20-30s of work that classification doesn't need —
 * and runs inside a shared, reused browser instance (see getSharedBrowser
 * above) rather than launching a new one per call.
 *
 * Timeouts are tighter than the full-audit path, but this now uses the same
 * clearance-cookie-aware reload-retry loop that path relies on — a Cloudflare
 * managed challenge often issues its cf_clearance cookie within a few
 * seconds, but the DOM the browser is currently looking at doesn't reflect
 * that until the page reloads. A single wait-then-check (the old behavior)
 * misses this and gives up right as the challenge actually clears; a reload
 * catches it. Genuine unsolvable blocks (e.g. Tesla's PerimeterX, or a static
 * 403 with no JS challenge at all) still won't clear no matter how many
 * retries — those are a real, accepted limitation without IP rotation.
 *
 * @param {string} url
 * @param {string} [device]
 * @returns {Promise<{$: object, statusCode: number, isBotProtected: boolean}>}
 *   No `browser` in the result — this function owns the shared browser's
 *   lifecycle itself and only closes the per-call context, so there is
 *   nothing left for the caller to close.
 */
export async function fetchWithBotBypass(url, device = 'Desktop') {
  let context;
  try {
    // Classification is a low-priority, degradable escalation: it only runs when
    // a plain HTTP fetch was inconclusive, and it already fails open. Give it a
    // SHORT acquire timeout so under browser-pool pressure it yields to real
    // audits and falls back to its plain-HTTP result instead of queueing.
    const created = await newStealthContext(device, { acquireTimeoutMs: 15000, label: 'classify' });
    context = created.context;
    const page = created.page;

    // [ADD] — Reuse a sibling page's WAF solve for this domain if one is cached.
    await injectClearanceCookies(context, url);

    let response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 }).catch(() => null);
    if (!response) {
      response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 10000 }).catch(() => null);
    }

    let isBotProtected = await detectChallenge(page);
    if (isBotProtected) {
      await waitForChallengeResolution(page, 15000);
      isBotProtected = await detectChallenge(page);
    }

    const hasClearanceCookie = async () => {
      try {
        const cookies = await context.cookies();
        return cookies.some((c) => /^(cf_clearance|__cf_bm|datadome|incap_ses|ak_bmsc)/i.test(c.name) && c.value);
      } catch (_) {
        return false;
      }
    };

    // Up to 2 reload retries — mirrors the full-audit path's proven approach,
    // scaled down to keep this lightweight path's worst case bounded (~60s
    // total) so one blocked site can't monopolize a global browser-pool permit
    // and back up the queue for other, likely-legitimate sites waiting behind it.
    let botRetries = 0;
    while (isBotProtected && botRetries < 2) {
      botRetries++;
      try {
        await page.reload({ waitUntil: "domcontentloaded", timeout: 10000 });
      } catch (_) { /* reload failure — fall through to re-check below */ }
      try { await page.waitForTimeout(randInt(1000, 2000)); } catch (_) { }
      await waitForChallengeResolution(page, 8000);
      isBotProtected = await detectChallenge(page);

      if (isBotProtected && (await hasClearanceCookie())) {
        try { await page.reload({ waitUntil: "domcontentloaded", timeout: 10000 }); } catch (_) { }
        isBotProtected = await detectChallenge(page);
      }
    }

    // [ADD] — If classification cleared the challenge, seed the domain cache so the
    // audit that follows this escalation reuses the solve.
    if (!isBotProtected) await saveClearanceCookies(context, url);

    const html = await safePageContent(page);
    const statusCode = response ? response.status() : (html ? 200 : 0);
    return { $: cheerio.load(html || "<html><body></body></html>"), statusCode, isBotProtected };
  } catch (err) {
    // Never throw — a failed classification-only fetch should just look
    // "empty" to the caller, not crash the request.
    return { $: cheerio.load("<html><body></body></html>"), statusCode: 0, isBotProtected: false };
  } finally {
    if (context) { try { await context.close(); } catch (_) { /* already closed */ } }
  }
}

/**
 * @param {string} url
 * @param {string} device
 * @param {{auditId?: string, onProgress?: (patch: object) => void}|string|null} opts
 *   - opts.auditId  : id used only to build the screenshot view URL
 *   - opts.onProgress: called with a status/field patch instead of writing to Mongo.
 *     (The worker passes a callback that postMessage()s to the main thread.)
 *   A bare string is accepted for backward-compat (treated as auditId, no progress).
 */
export default async function Puppeteer_Cheerio(url, device = 'Desktop', opts = null) {
  let browser;

  const { auditId = null, onProgress = null } =
    typeof opts === "string" ? { auditId: opts } : (opts || {});

  // Report progress to the caller. No DB access here — this runs inside the worker.
  const updateStatus = (status, extraData = {}) => {
    if (typeof onProgress === "function") onProgress({ status, ...extraData });
  };

  let slotId = null;
  try {
    // Top-level page render: wait (no acquire timeout) for a permit — the whole
    // point of the cap is that page renders queue rather than pile up. The label
    // (site host) makes each acquire/release traceable in the pool logs.
    let hostLabel = "audit";
    try { hostLabel = `audit:${new URL(url).hostname.replace(/^www\./, "")}`; } catch { /* keep default */ }
    slotId = await acquireBrowserSlot({ label: hostLabel });

    // [EXISTING STEALTH CONFIG — DO NOT MODIFY]
    // [EXISTING PUPPETEER LAUNCH OPTIONS — DO NOT MODIFY]
    const launchOptions = {
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--hide-scrollbars",
        "--mute-audio",
        "--disable-blink-features=AutomationControlled",
        "--disable-features=IsolateOrigins,site-per-process",
        "--window-size=1920,1080",
        "--ignore-certificate-errors",
        "--no-zygote",
        // [NEW] — headless-hardening flags to reduce automation fingerprints
        "--disable-infobars",
        "--disable-automation",
        "--disable-features=AutomationControlled,Translate,OptimizationHints",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        "--lang=en-US,en"
      ]
    };

    await updateStatus("launching");

    browser = await chromium.launch(launchOptions);
    const origClose = browser.close.bind(browser);
    let released = false;
    browser.close = async () => {
      if (released) return;
      released = true;
      try {
        await origClose();
      } finally {
        await releaseBrowserSlot(slotId);
      }
    };

    // [EXISTING — DO NOT MODIFY]
    const commonHeaders = {
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'Sec-Ch-Ua-Mobile': device === "Mobile" ? '?1' : '?0',
      'Sec-Ch-Ua-Platform': device === "Mobile" ? '"Android"' : '"Windows"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
      'Referer': 'https://www.google.com/'
    };

    // [EXISTING — DO NOT MODIFY]
    const userAgent = device === "Mobile"
      ? "Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36"
      : "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

    const contextOptions = {
      userAgent,
      viewport: device === "Mobile"
        ? { width: 393, height: 852 }
        : { width: 1920, height: 1080 },
      extraHTTPHeaders: commonHeaders,
      ignoreHTTPSErrors: true,
      locale: 'en-US',
      timezoneId: 'America/New_York'
    };

    if (device === "Mobile") {
      contextOptions.hasTouch = true;
      contextOptions.isMobile = true;
      contextOptions.deviceScaleFactor = 3;
    } else {
      contextOptions.deviceScaleFactor = 2;
    }

    const context = await browser.newContext(contextOptions);

    // [ADD] — If a sibling page already solved this domain's WAF challenge, replay its
    // clearance cookies into this context BEFORE the first navigation so this page is
    // served the real content and skips the challenge. No-op when nothing is cached.
    await injectClearanceCookies(context, url);

    const page = await context.newPage();

    // [FIX] — Filter Chrome's internal frame warnings from browser console
    page.on('console', (msg) => {
      const text = msg.text();
      if (
        text.includes('detached Frame') ||
        text.includes('Attempted to use detached')
      ) {
        // Suppress — already handled by our centralized isDetachedFrameError()
        return;
      }
      logger.debug('[Browser Console]', text);
    });

    // [FIX] — Track detached frames proactively via Set
    page._detachedFrames = new Set();
    page.on('framedetached', (frame) => {
      page._detachedFrames.add(frame);
      let frameUrl = 'unknown url';
      try {
        frameUrl = frame.url() || 'unknown url';
      } catch (e) {}
      logger.debug('[Frame] Frame detached:', frameUrl);
    });

    // [EXISTING STEALTH CONFIG — DO NOT MODIFY]
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
    });

    // [NEW] — Advanced bot-bypass stealth evasions.
    // Runs on every new document (incl. Cloudflare/Turnstile challenge frames) BEFORE
    // their scripts. Each evasion is wrapped so a single failure can't abort the rest,
    // and we avoid redefining properties already set by the init script above.
    await page.addInitScript(() => {
      const safe = (fn) => { try { fn(); } catch (_) { /* evasion best-effort */ } };

      // Real Chrome exposes a window.chrome object; headless does not.
      safe(() => {
        if (!window.chrome) {
          window.chrome = {
            runtime: {},
            app: { isInstalled: false, InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' }, RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' } },
            csi: function () { },
            loadTimes: function () { },
          };
        }
      });

      // permissions.query should mirror Notification.permission (headless mismatches this).
      safe(() => {
        const originalQuery = window.navigator.permissions && window.navigator.permissions.query;
        if (originalQuery) {
          window.navigator.permissions.query = (parameters) =>
            parameters && parameters.name === 'notifications'
              ? Promise.resolve({ state: Notification.permission })
              : originalQuery(parameters);
        }
      });

      // Realistic mimeTypes (Chrome PDF viewer). plugins is already spoofed above.
      safe(() => {
        Object.defineProperty(navigator, 'mimeTypes', {
          get: () => [
            { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
            { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' },
          ],
        });
      });

      // Spoof platform/vendor so they match the Windows Chrome UA we advertise.
      safe(() => Object.defineProperty(navigator, 'platform', { get: () => 'Win32' }));
      safe(() => Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' }));
      safe(() => Object.defineProperty(navigator, 'maxTouchPoints', { get: () => 0 }));

      // WebGL vendor/renderer — headless reports SwiftShader/Google which is a giveaway.
      safe(() => {
        const spoof = (proto) => {
          if (!proto) return;
          const getParameter = proto.getParameter;
          proto.getParameter = function (parameter) {
            if (parameter === 37445) return 'Intel Inc.';                 // UNMASKED_VENDOR_WEBGL
            if (parameter === 37446) return 'Intel Iris OpenGL Engine';   // UNMASKED_RENDERER_WEBGL
            return getParameter.apply(this, [parameter]);
          };
        };
        spoof(window.WebGLRenderingContext && window.WebGLRenderingContext.prototype);
        spoof(window.WebGL2RenderingContext && window.WebGL2RenderingContext.prototype);
      });

      // Headless often leaves these at 0 — give them real-looking values.
      safe(() => {
        if (window.outerWidth === 0) Object.defineProperty(window, 'outerWidth', { get: () => window.innerWidth });
        if (window.outerHeight === 0) Object.defineProperty(window, 'outerHeight', { get: () => window.innerHeight + 74 });
      });

      // navigator.connection (present in real Chrome).
      safe(() => {
        if (!navigator.connection) {
          Object.defineProperty(navigator, 'connection', {
            get: () => ({ effectiveType: '4g', rtt: 50, downlink: 10, saveData: false }),
          });
        }
      });
    });

    // [EXISTING — DO NOT MODIFY]
    await page.route('**/*', (route) => {
      try {
        const request = route.request();
        const resourceType = request.resourceType();
        const reqUrl = request.url().toLowerCase();

        const blockedResources = [
          'googletagmanager.com', 'google-analytics.com', 'analytics.google.com',
          'facebook.net', 'popupsmart.com', 'hotjar.com', 'intercom.io',
          'adsystem.com', 'ads-twitter.com', 'doubleclick.net'
        ];

        if (
          resourceType === 'font' ||
          resourceType === 'media' ||
          blockedResources.some(domain => reqUrl.includes(domain))
        ) {
          route.abort().catch(() => {});
        } else {
          route.continue().catch(() => {});
        }
      } catch (err) {
        route.continue().catch(() => {});
      }
    });

    // [EXISTING — DO NOT MODIFY]
    await delay(randInt(1000, 3000));

    await updateStatus("navigating");

    let response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    }).catch(async () => {
      logger.debug("networkidle timed out, falling back to domcontentloaded...");
      return null;
    });

    if (!response) {
      try { await page.unroute('**/*'); } catch (_) {}
      response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => null);
    }

    // Even if response is null, the page might have loaded successfully but timed out waiting for idle.
    // We check if there's an actual title/content to decide if it's truly dead.
    let pageTitle = await safeGetTitle(page);
    const hasContent = pageTitle && pageTitle.length > 0;

    let statusCode = response ? response.status() : (hasContent ? 200 : "No Response");

    if (statusCode === "No Response") {
      return {
        browser, page, response: null,
        $: cheerio.load("<html><body>Failed to reach site (Timeout)</body></html>"),
        screenshot: null,
        isBotProtected: false // Changed from true so it doesn't falsely claim Bot Protected on timeouts
      };
    }

    // [ENHANCED] — Bot-bypass: give Cloudflare/Turnstile JS challenges time to
    // auto-resolve with our stealthed browser, then retry with reloads if needed.
    let challengeResolved = await waitForChallengeResolution(page, 35000);
    let isBotProtected = await detectChallenge(page);

    // [FIX] — WAF JS challenges (Imperva/Incapsula, and some Cloudflare) auto-clear
    // in a few seconds and THEN render the real page. But the resource-blocking route
    // set up above aborts requests the challenge itself needs — that's the
    // net::ERR_BLOCKED_BY_CLIENT seen on challenge reloads — so it could never finish
    // and the page stayed a blank 403. When a challenge is present, stop blocking
    // resources, let the challenge JS run, then reload onto the cleared page.
    // Confirmed live on lexusofnorthmiami.com (Imperva): blank 403 → after unroute +
    // ~8s + reload, the FULL real homepage rendered and screenshotted from our own
    // browser. Only runs when a challenge is actually detected, so normal (fast) audits
    // keep their resource blocking untouched.
    if (isBotProtected) {
      try { await page.unroute('**/*'); } catch (_) { /* route already removed */ }
      try { await page.waitForTimeout(8000); } catch (_) { /* let the challenge JS compute */ }
      try {
        const cleared = await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
        if (cleared) { response = cleared; statusCode = cleared.status(); }
      } catch (_) { /* keep the prior response */ }
      try { await page.waitForTimeout(3000); } catch (_) {}
      isBotProtected = await detectChallenge(page);
      if (!isBotProtected) logger.info(`✅ WAF challenge auto-cleared after unblocking resources for ${url}`);
    }

    // [NEW] — Split "gated" into SOLVABLE CHALLENGE vs HARD WAF BLOCK before
    // spending any retries. Reloading a hard block (Cloudflare's "Sorry, you have
    // been blocked" page, or a blank 403) cannot possibly clear it — the page
    // carries no challenge script — and every extra blocked request deepens the
    // IP-reputation block that caused it. Measured on fusz.com: our browser loads
    // the site fine on a clean reputation, and only 403s after the audit's own
    // browserless probes have been blocked a few times. So a hard block gets one
    // backed-off retry, not a retry storm.
    let hardBlockRecoveryTried = false;
    const attemptHardBlockRecovery = async () => {
      hardBlockRecoveryTried = true;
      try { await page.unroute('**/*'); } catch (_) { /* route already removed */ }
      const rec = await recoverFromHardBlock(page, context, url, statusCode);
      if (rec.recovered) {
        if (rec.response) response = rec.response;
        statusCode = rec.statusCode;
        isBotProtected = false;
        return true;
      }
      statusCode = rec.statusCode;
      return false;
    };

    if ((await classifyBlock(page, statusCode)) === "hardblock") {
      if (!(await attemptHardBlockRecovery())) {
        noteWafBlock(url, "browser");
        const htmlData = await safePageContent(page);
        const $ = cheerio.load(htmlData || "<html><body></body></html>");
        return { browser, page, response, $, screenshot: null, isBotProtected: true };
      }
    }

    // Positive signal: a Cloudflare clearance cookie means the challenge passed.
    const hasClearanceCookie = async () => {
      try {
        const cookies = await context.cookies();
        return cookies.some((c) => /^(cf_clearance|__cf_bm|datadome|incap_ses|ak_bmsc)/i.test(c.name) && c.value);
      } catch (_) {
        return false;
      }
    };

    // Up to 2 reload retries — managed challenges often clear on a second pass once
    // the clearance cookie is issued.
    let botRetries = 0;
    while (isBotProtected && botRetries < 2) {
      botRetries++;
      logger.info(`🛡️ Challenge still present — bypass retry ${botRetries}/2 for ${url}`);
      // [ADD] — Replay any cached domain clearance before each retry reload. A sibling
      // page (or the pre-crawl warm-up) may have solved the challenge AFTER this context
      // was created, or the site re-challenged mid-session on a heavy page; re-injecting
      // the cached cf_clearance lets the reload land on real content instead of solving
      // from scratch again. No-op when nothing is cached.
      await injectClearanceCookies(context, url);
      try {
        await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 });
      } catch (reloadErr) {
        logger.warn("⚠️ Page reload during bot protection retry failed:", reloadErr.message);
      }
      // Small human-like settle (real wall-clock wait so the challenge JS can run),
      // then wait for the challenge to auto-clear.
      try { await page.waitForTimeout(randInt(1500, 3000)); } catch (_) { }
      challengeResolved = await waitForChallengeResolution(page, 25000);
      isBotProtected = await detectChallenge(page);

      // If a clearance cookie was issued but the DOM check is lagging, reload once
      // more to land on the real content rather than the interstitial.
      if (isBotProtected && (await hasClearanceCookie())) {
        try { await page.reload({ waitUntil: "domcontentloaded", timeout: 30000 }); } catch (_) { }
        isBotProtected = await detectChallenge(page);
      }
    }

    if (isBotProtected) {
      // [NEW] — The challenge never cleared. If what we are actually looking at is
      // a hard WAF block (the site re-blocked us mid-solve), the cool-off retry is
      // the one thing left that can recover it — try it once before giving up.
      if (!hardBlockRecoveryTried && (await classifyBlock(page, statusCode)) === "hardblock") {
        await attemptHardBlockRecovery();
      }
      if (isBotProtected) {
        logger.warn(`🛡️ Bot protection could not be bypassed after ${botRetries} retries: ${url}`);
        noteWafBlock(url, "browser");
        const htmlData = await safePageContent(page);
        const $ = cheerio.load(htmlData);
        return { browser, page, response, $, screenshot: null, isBotProtected: true };
      }
    }

    // [NEW] — Hard-block detection. Some WAFs (Imperva/Incapsula on dealer sites)
    // don't serve a solvable JS challenge at all — they return 401/403/429/503
    // whose body renders COMPLETELY BLANK. detectChallenge() finds no challenge
    // markers on an empty page (score ~1 < 2), so such blocks sailed through as
    // "not protected" and we went on to screenshot a pure-white page and audit an
    // empty document (confirmed live on lexusofnorthmiami.com: HTTP 403, empty
    // title, blank 18KB screenshot). Treat blocked-status + no-real-content as
    // Bot Protected so the report says so instead of showing a white preview.
    const blockedStatus = [401, 403, 429, 503].includes(Number(statusCode));
    if (blockedStatus) {
      const looksReal = await hasRealContent(page);
      const blockTitle = await safeGetTitle(page);
      if (!looksReal && (!blockTitle || blockTitle.trim().length < 2)) {
        logger.warn(`🛡️ Hard block detected (HTTP ${statusCode}, blank/empty page) for ${url}.`);
        // [NEW] — Don't report it until the backed-off retry has had its one go:
        // this silent, body-less 403 is the same IP-reputation block that lifts by
        // itself, and recovering it is the difference between a real audit and a
        // "Bot Protected" card on a site we can actually render.
        const recovered = hardBlockRecoveryTried ? false : await attemptHardBlockRecovery();
        if (!recovered) {
          noteWafBlock(url, "browser");
          const htmlData = await safePageContent(page);
          const $ = cheerio.load(htmlData || "<html><body></body></html>");
          return { browser, page, response, $, screenshot: null, isBotProtected: true };
        }
      }
    }

    logger.info(`✅ Bot protection cleared (or none present) for ${url}`);
    // The host is serving us real content — lift any browserless cooldown so the
    // rest of the audit's probes are allowed to run again.
    noteWafOk(url, "browser");

    // [ADD] — This context is now cleared for the domain (either it solved the
    // challenge, or none was present and it holds a valid __cf_bm). Cache its
    // clearance cookies so the remaining key pages of this site reuse the solve
    // instead of each re-running the flaky challenge. Best-effort; no-op if the
    // site isn't behind a WAF.
    await saveClearanceCookies(context, url);

    // [FIX] — wrapped mouse.move with detached frame protection
    try {
      if (!page.isClosed()) {
        await page.mouse.move(randInt(100, 800), randInt(100, 600));
      }
    } catch (e) {
      if (!isDetachedFrameError(e)) throw e;
      logger.debug('[Frame] mouse.move skipped — frame detached');
    }

    await delay(randInt(1000, 2000));

    await handlePopups(page);
    await autoScroll(page);

    // Wait for the page's load (onload) event instead of a fixed delay
    await updateStatus("waiting_for_render");

    // [FIX] — Capture HTML BEFORE the load wait in case the page context dies during it
    // This ensures we have valid cheerio data even if the page navigates away
    let preWaitHtml = "";
    try {
      preWaitHtml = await safePageContent(page);
    } catch (e) {
      logger.debug('[Frame] Pre-wait HTML capture failed — will retry after wait');
    }

    // [FIX] — Wait for the page 'load' (onload) event so images/resources finish
    // loading before we capture content. domcontentloaded fired too early.
    // This replaces the old fixed 20s render wait — we proceed as soon as the
    // page actually finishes loading instead of blocking for a fixed duration.
    try {
      if (!page.isClosed()) {
        await page.waitForLoadState('load', { timeout: 15000 });
      }
    } catch (e) {
      // load may never fire on heavy pages — proceed; image wait below covers it
      logger.debug('[Frame] waitForLoadState(load) timed out — continuing');
    }

    // [FIX] — Live page context probe after the load wait
    // Tests whether page.evaluate() still works. If the page navigated away
    // during the wait, all metrics would fail. Catch this early and return
    // partial result instead of wasting time on 7 failing metric calls.
    let pageContextAlive = false;
    try {
      if (!page.isClosed()) {
        await page.evaluate(() => true);
        pageContextAlive = true;
      }
    } catch (probeErr) {
      if (isDetachedFrameError(probeErr)) {
        logger.warn("⚠️ Page context died during load wait — returning partial result with pre-wait HTML.");
        const $ = cheerio.load(preWaitHtml || "<html><body>Page context unavailable after render wait</body></html>");
        return {
          browser,
          page: null, // signals worker to skip metrics gracefully
          response,
          $,
          screenshot: null,
          isBotProtected: false
        };
      }
      // Unexpected probe error — do not throw, just proceed cautiously
      logger.warn("⚠️ Page context probe failed unexpectedly:", probeErr.message);
    }

    if (!pageContextAlive) {
      logger.warn("⚠️ Page is closed after load wait — returning partial result.");
      const $ = cheerio.load(preWaitHtml || "<html><body>Page closed during render wait</body></html>");
      return {
        browser,
        page: null,
        response,
        $,
        screenshot: null,
        isBotProtected: false
      };
    }


    // [FIX] — Settle async content BEFORE the final scroll + screenshot.
    // Order matters: previously we scrolled to top and THEN waited ~12s for
    // images, so any client-rendered content (e.g. an inventory carousel that
    // fetches + injects <img>s a few seconds after load) reflowed the page
    // AFTER the scroll — the screenshot caught a mid-reflow state with the
    // top-of-page pushed out of frame and skeleton placeholders still showing.
    // Now we let the network go quiet and let images finish while the page is
    // still scrolled through its content (so lazy/IntersectionObserver widgets
    // stay triggered), then scroll to top LAST, right before capturing.
    //
    // networkidle is best-effort and bounded — on chat-widget/analytics-heavy
    // sites the socket never truly idles, so this just times out harmlessly and
    // the image wait below still gives async content time to render.
    try {
      if (!page.isClosed()) {
        await page.waitForLoadState('networkidle', { timeout: 6000 });
      }
    } catch (e) {
      logger.debug('[Frame] waitForLoadState(networkidle) timed out — continuing');
    }

    // [FIX] — Wait for images (incl. lazy-loaded ones triggered by autoScroll
    // and any injected by the async render above) to finish loading.
    await waitForImagesLoaded(page, 12000);

    // [FIX] — Hide late-appearing cookie/consent banners and chat widgets that
    // otherwise cover the hero in the preview (they render after handlePopups
    // ran earlier in the flow). Display-only, non-fatal — never touches the
    // HTML the audit actually analyses.
    await dismissOverlays(page);

    // [FIX] — Scroll to top LAST, once layout has settled, so the clipped
    // top-viewport screenshot reflects the final page rather than a mid-render
    // frame. The clip is VIEWPORT-relative, so the page must actually be at
    // scrollY 0 when we capture. autoScroll leaves us ~10000px down, and many
    // sites set `scroll-behavior: smooth`, which animates that scroll-back over
    // more than a second — a fixed short delay caught the page mid-animation
    // (the screenshot showed a mid-page section instead of the hero). Force an
    // instant jump (override smooth-scroll) and poll until scrollY is really 0.
    try {
      if (!page.isClosed()) {
        await page.evaluate(async () => {
          const root = document.scrollingElement || document.documentElement;
          const prev = root.style.scrollBehavior;
          root.style.scrollBehavior = "auto"; // defeat CSS `scroll-behavior: smooth`
          for (let i = 0; i < 20; i++) {
            window.scrollTo(0, 0);
            if (root) root.scrollTop = 0;
            await new Promise((r) => setTimeout(r, 50));
            if ((window.scrollY || root.scrollTop || 0) <= 1) break;
          }
          root.style.scrollBehavior = prev;
        });
      }
    } catch (e) {
      if (!isDetachedFrameError(e)) throw e;
      logger.debug('[Frame] Scroll to top skipped — frame detached');
    }
    await delay(300);

    // [FIX] — Re-check page is still alive after the load/image wait
    // Page might have navigated / frame detached during the wait
    if (page.isClosed()) {
      logger.warn("⚠️ Page closed during render wait — returning partial result");
      return {
        browser, page, response,
        $: cheerio.load("<html><body>Page closed during render</body></html>"),
        screenshot: null,
        isBotProtected: false
      };
    }

    // Screenshot after the page load (onload) + image wait
    let screenshot = null;
    try {
        const screenshotBuffer = await page.screenshot({
          type: "jpeg",
          quality: 50,
          fullPage: false,
          clip: {
            x: 0, y: 0,
            width: device === "Mobile" ? 393 : 1920,
            height: device === "Mobile" ? 852 : 1080
          }
        });
        screenshot = screenshotBuffer.toString("base64");
    } catch (screenshotError) {
      // [FIX] — use centralized checker — screenshot failure is NON-FATAL
      // Audit must continue even if screenshot fails
      if (isDetachedFrameError(screenshotError)) {
        logger.warn("⚠️ Screenshot capture skipped due to detached frame — audit will continue without screenshot.");
        screenshot = null; // explicitly null — not a crash
      } else {
        // Non-detach screenshot error — still non-fatal, log and continue
        logger.warn("⚠️ Screenshot capture failed (non-detach reason):", screenshotError.message);
        screenshot = null;
      }
    }

    // [FIX] — updateStatus is safe even if screenshot is null
    const screenshotUrl = screenshot ? `/api/screenshot/view/${auditId}` : null;
    await updateStatus("screenshot_ready", {
      screenshot,
      screenshotUrl,
      isBotProtected: false
    });

    await updateStatus("extracting_data");

    // [FIX] — safePageContent with extra detached frame guard
    // If page navigated away during the load wait, try to recover HTML gracefully
    let htmlData = "";
    try {
      htmlData = await safePageContent(page);
    } catch (contentError) {
      // [FIX] — centralized check — content extraction failure is NON-FATAL
      if (isDetachedFrameError(contentError)) {
        logger.warn("⚠️ HTML extraction skipped due to detached frame — returning empty DOM.");
        htmlData = "<html><body>Content unavailable due to page navigation</body></html>";
      } else {
        throw contentError; // unexpected — re-throw
      }
    }

    // [FIX] — Final page alive check before returning
    // Ensures we never throw from a dead page context
    const $ = cheerio.load(htmlData || "<html><body></body></html>");

    // [FIX] — Final sanity probe: if screenshot was skipped (page context was broken),
    // confirm the page is truly usable before passing it to metric services.
    // A dead page passed to metric services causes ALL 7 metrics to fail one-by-one.
    if (!screenshot) {
      let finalContextOk = false;
      try {
        if (!page.isClosed()) {
          await page.evaluate(() => true);
          finalContextOk = true;
        }
      } catch (finalProbeErr) {
        finalContextOk = false;
      }

      if (!finalContextOk) {
        logger.warn("⚠️ Page context is dead at final check — returning page: null to skip metric services.");
        return { browser, page: null, response, $, screenshot: null, isBotProtected: false };
      }
    }

    return { browser, page, response, $, screenshot, isBotProtected: false };


  } catch (error) {
    // [FIX] — Top-level catch: if it's a detached frame error, do NOT crash audit
    // Return a graceful partial result instead of throwing
    if (isDetachedFrameError(error)) {
      logger.warn("⚠️ Detached frame error caught at top level — returning partial audit result instead of failing.");
      return {
        browser,
        page: null,
        response: null,
        $: cheerio.load("<html><body>Audit interrupted by page navigation</body></html>"),
        screenshot: null,
        isBotProtected: false
      };
    }

    if (browser) {
      await browser.close().catch(() => {});
    } else if (slotId) {
      await releaseBrowserSlot(slotId);
    }
    throw error;
  }
}
