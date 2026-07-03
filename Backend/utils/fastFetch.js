import axios from "axios";

// Error codes that mean the TLS/SSL handshake itself failed — the server
// never got far enough to send an HTTP response. This is a common real-world
// misconfiguration: a site's certificate is only valid for "www.example.com",
// not the bare "example.com" apex, so https://example.com fails outright even
// though the real site is perfectly reachable one hostname away. When a user
// types a bare domain with no protocol, this app defaults to https:// — so
// without a fallback, that whole (very common) misconfiguration pattern would
// make an otherwise-real, otherwise-reachable dealer/OEM site look dead.
const TLS_HANDSHAKE_ERROR_CODES = new Set([
  "EPROTO",                          // SSL/TLS protocol error — most common case
  "ERR_SSL_PROTOCOL_ERROR",
  "CERT_HAS_EXPIRED",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
  "UNABLE_TO_GET_ISSUER_CERT_LOCALLY",
  "DEPTH_ZERO_SELF_SIGNED_CERT",
  "SELF_SIGNED_CERT_IN_CHAIN",
  "ERR_TLS_CERT_ALTNAME_INVALID",
]);

async function rawGet(url, timeout) {
  const res = await axios.get(url, {
    timeout,
    maxRedirects: 5,
    // Treat any status as resolved — a 403/503 block page is still useful
    // signal (the detector flags it as inconclusive and we fall through).
    validateStatus: () => true,
    responseType: "text",
    // Cap the body so a multi-MB page can't stall the gate.
    maxContentLength: 5 * 1024 * 1024,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "Accept":
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Referer": "https://www.google.com/",
    },
  });

  const contentType = String(res.headers?.["content-type"] || "").toLowerCase();
  // Only HTML is useful to the detector; anything else → empty (inconclusive).
  const html =
    contentType.includes("html") || contentType === ""
      ? typeof res.data === "string"
        ? res.data
        : ""
      : "";

  return { html, status: res.status || 200, errorCode: null };
}

/**
 * Ultra-light HTML fetcher for the dealership pre-check.
 *
 * The dealership detector reads ONLY the raw HTML (via cheerio) — it never
 * touches a live browser page. So the pre-check gate does not need Puppeteer at
 * all: a plain HTTP GET returns the same HTML 10–50× faster (no Chromium launch,
 * no render wait, no challenge loop).
 *
 * On any failure (timeout, block, non-HTML) we simply return empty HTML. The
 * caller's "fail open" logic then treats detection as inconclusive and falls
 * through to the full-render audit, which has proper bot-bypass handling. So
 * this fetch never needs to succeed — it only ever makes the happy path fast.
 *
 * @param {string} url
 * @param {object} [opts]
 * @param {number} [opts.timeout=8000]  per-request timeout in ms
 * @returns {Promise<{ html: string, status: number, errorCode: string|null }>}
 */
export default async function fastFetch(url, { timeout = 8000 } = {}) {
  // Defensive: a bare domain ("example.com") makes axios throw ERR_INVALID_URL
  // before it ever attempts DNS, which would mask a genuine "no such site".
  // Normalize to an absolute https:// URL so the request actually resolves.
  if (typeof url === "string" && url.trim() && !/^https?:\/\//i.test(url.trim())) {
    url = "https://" + url.trim();
  }
  try {
    return await rawGet(url, timeout);
  } catch (err) {
    const errorCode = err?.code || "ERR";

    // The TLS handshake itself failed on an https:// request — retry once
    // over plain http://. If the site is actually fine (just missing a valid
    // cert on this exact hostname), this recovers real content instead of
    // reporting the whole site as unreachable.
    if (TLS_HANDSHAKE_ERROR_CODES.has(errorCode) && /^https:\/\//i.test(url)) {
      try {
        return await rawGet("http://" + url.slice("https://".length), timeout);
      } catch (_) {
        // Fall through to the original TLS error below — http:// didn't work either.
      }
    }

    // Network error / timeout / aborted — empty HTML => inconclusive => fall through.
    // Surface the low-level error code (ENOTFOUND, ECONNREFUSED, ECONNABORTED, …)
    // so the caller can tell "site doesn't exist" apart from "blocked/slow".
    return { html: "", status: 0, errorCode };
  }
}

/**
 * Error codes that mean the website genuinely does NOT exist / is unreachable at
 * the network level — the domain didn't resolve or the host refused/dropped the
 * connection. These are reliable "no site here" signals.
 *
 * Notably EXCLUDED: ECONNABORTED / ETIMEDOUT (a slow or bot-protected site can
 * time out yet still be real) and TLS/cert errors (the server clearly answered).
 * Those are treated as "exists" so we never wrongly reject a live dealership.
 */
const NONEXISTENT_ERROR_CODES = new Set([
  "ENOTFOUND",     // DNS: domain has no record
  "EAI_AGAIN",     // DNS: temporary resolution failure
  "ECONNREFUSED",  // host actively refused the connection
  "ENETUNREACH",   // network unreachable
  "EHOSTUNREACH",  // host unreachable
  "EHOSTDOWN",     // host is down
]);

/**
 * Decide whether a website exists by doing a single lightweight HTTP GET.
 *
 * "Exists" is interpreted generously: any HTTP response (even 403/404/503) means
 * the server is there, and an ambiguous failure (timeout, reset, TLS error) is
 * also treated as existing so a slow or protected real site is never rejected.
 * Only a hard DNS/connection-level failure counts as "does not exist".
 *
 * Returns the fetched html/status too, so the caller can reuse this single fetch
 * for downstream checks (e.g. dealership detection) without a second round-trip.
 *
 * @param {string} url
 * @param {object} [opts]
 * @param {number} [opts.timeout=8000]
 * @returns {Promise<{ exists: boolean, html: string, status: number, errorCode: string|null, reason: string }>}
 */
export async function checkWebsiteExists(url, opts = {}) {
  const { html, status, errorCode } = await fastFetch(url, opts);

  if (errorCode && NONEXISTENT_ERROR_CODES.has(errorCode)) {
    return {
      exists: false,
      html,
      status,
      errorCode,
      reason:
        errorCode === "ENOTFOUND" || errorCode === "EAI_AGAIN"
          ? "The domain could not be resolved (no such website)."
          : "The website could not be reached (connection refused or host unreachable).",
    };
  }

  return { exists: true, html, status, errorCode, reason: "" };
}
