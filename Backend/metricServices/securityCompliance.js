import dotenv from "dotenv";
import fetch from "node-fetch";
import { URL } from "url";
import { waitForChallengeResolution } from "../utils/puppeteer_cheerio.js";
import { BROWSER_HEADERS, isWafCoolingDown } from "../utils/wafGuard.js";
import configService from "../services/configService.js";
import { classifyPageType } from "../utils/pageClassifier.js";
import { humanizeSecuritySection } from "./securityCopy.js";
import { isParamApplicable } from "../config/siteTypeProfiles.js";
import { importanceFor } from "../config/parameterImportance.js";
import { getLocale, anyTerm, matchedTerms, matchGroups, hay } from "../config/locale/index.js";

// Per-parameter weight tilt for this section, by site sub-type — 1.0 for a
// franchise dealer and for corporate/unresolved sites. The differences here are
// regulatory, not technical: a garage advertising a $99 brake special carries
// almost none of the GLBA / Reg-Z / CARS load a credit application does, but
// transport and reputation stay Critical for everyone because they are gates.
const importance = importanceFor("Security/Compliance");

dotenv.config();

// Read at function call time via configService (not module load)
const getSafeBrowsingKey = () => configService.getConfig('SafeBrowsing');
const getVTKey = () => configService.getConfig('vt_key');

function Domain(urlString) {
  const u = new URL(urlString);
  let host = u.hostname;
  if (host.startsWith("www.")) host = host.slice(4);
  return host;
}

// HTTPS (Hypertext Transfer Protocol Secure) + mixed-content scan
// Checks the actually-landed URL (after redirects) and scans the rendered page for
// insecure http:// subresources (mixed content), not just the input URL's protocol.
async function checkHTTPS(url, page) {
  // Use the actual landed URL (after any HTTP -> HTTPS redirects), not just the input.
  let finalUrl = url;
  try { if (page && !page.isClosed()) finalUrl = page.url() || url; } catch (e) {}
  let parsedUrl;
  try { parsedUrl = new URL(finalUrl); } catch (e) { parsedUrl = new URL(url); }
  const isHttps = parsedUrl.protocol === "https:";

  // Not HTTPS at all -> hard fail (no point scanning mixed content)
  if (!isHttps) {
    return {
      score: 0,
      status: "fail",
      details: `Page is served over ${parsedUrl.protocol}, not HTTPS`,
      meta: { protocol: parsedUrl.protocol, finalUrl, mixedContent: { active: [], passive: [] }, activeCount: 0, passiveCount: 0 },
      analysis: {
        cause: `The website is served over ${parsedUrl.protocol} instead of HTTPS.`,
        recommendation: "Obtain an SSL certificate and redirect all HTTP traffic to HTTPS."
      }
    };
  }

  // HTTPS page -> scan for mixed content (insecure http:// subresources)
  let mixed = { active: [], passive: [] };
  try {
    mixed = await page.evaluate(() => {
      const active = [];   // scripts, stylesheets, iframes — browsers BLOCK these
      const passive = [];  // images, media — browsers WARN / try to upgrade
      const push = (arr, kind, val) => {
        if (val && /^http:\/\//i.test(val) && arr.length < 15) arr.push(`${kind}: ${val}`);
      };
      document.querySelectorAll('script[src]').forEach(el => push(active, "script", el.getAttribute("src")));
      document.querySelectorAll('link[rel="stylesheet"][href]').forEach(el => push(active, "css", el.getAttribute("href")));
      document.querySelectorAll('iframe[src]').forEach(el => push(active, "iframe", el.getAttribute("src")));
      document.querySelectorAll('img[src]').forEach(el => push(passive, "img", el.getAttribute("src")));
      document.querySelectorAll('video[src], audio[src], source[src]').forEach(el => push(passive, "media", el.getAttribute("src")));
      document.querySelectorAll('img[srcset], source[srcset]').forEach(el => {
        (el.getAttribute("srcset") || "").split(",").forEach(part => push(passive, "img", part.trim().split(/\s+/)[0]));
      });
      return { active, passive };
    });
  } catch (e) {}

  const activeCount = mixed.active.length;
  const passiveCount = mixed.passive.length;

  // Active mixed content — browsers block these, breaking the page and security
  if (activeCount > 0) {
    return {
      score: 30,
      status: "fail",
      details: `HTTPS, but ${activeCount} active mixed-content resource(s) loaded over HTTP`,
      meta: { protocol: "https:", finalUrl, mixedContent: mixed, activeCount, passiveCount },
      analysis: {
        cause: "The HTTPS page loads scripts, stylesheets, or iframes over insecure HTTP. Browsers block active mixed content, which can break functionality and expose users.",
        recommendation: "Update all script, stylesheet, and iframe URLs to https:// (or protocol-relative //) and add a Content-Security-Policy 'upgrade-insecure-requests' directive."
      }
    };
  }

  // Passive mixed content — browser 'not fully secure' warnings
  if (passiveCount > 0) {
    return {
      score: 65,
      status: "warning",
      details: `HTTPS, but ${passiveCount} passive mixed-content resource(s) (images/media) loaded over HTTP`,
      meta: { protocol: "https:", finalUrl, mixedContent: mixed, activeCount: 0, passiveCount },
      analysis: {
        cause: "The HTTPS page loads images or media over insecure HTTP, triggering 'not fully secure' browser warnings.",
        recommendation: "Serve all images and media over https:// and add 'upgrade-insecure-requests' to your CSP."
      }
    };
  }

  return {
    score: 100,
    status: "pass",
    details: "Served over HTTPS with no mixed content",
    meta: { protocol: "https:", finalUrl, mixedContent: { active: [], passive: [] }, activeCount: 0, passiveCount: 0 },
    analysis: null
  };
}

// SSL/TLS certificate validity (spec §2.4 — Critical).
// If the browser established the HTTPS response at all, the chain validated and the host
// matched (a security error would have surfaced otherwise); we additionally confirm the
// certificate validity window. Expiry-window grading is a SEPARATE param (checkSSLExpiry).
async function checkSSLConnection(response) {
  if (!response) return { score: 0, status: "fail", confidence: "measured", details: "No response available for SSL check", meta: {}, analysis: { cause: "No response received.", recommendation: "Check server connectivity." } };
  if (!response.ok()) {
    return {
      score: 0,
      status: "fail",
      confidence: "measured",
      details: `SSL connection failed (Status: ${response.status()})`,
      meta: {
        httpStatus: response.status()
      },
      analysis: {
        cause: "The SSL connection could not be established.",
        recommendation: "Check the SSL certificate and server configuration."
      }
    };
  }
  let securityDetails = null;
  try { securityDetails = await response.securityDetails(); } catch (e) {}
  const validTo = securityDetails && securityDetails.validTo ? new Date(securityDetails.validTo * 1000).toISOString() : null;
  const validFrom = securityDetails && securityDetails.validFrom ? new Date(securityDetails.validFrom * 1000).toISOString() : null;
  const issuer = securityDetails?.issuer || null;
  const subjectName = securityDetails?.subjectName || null;

  const now = Date.now();
  const expired = validTo ? new Date(validTo).getTime() < now : false;
  const notYetValid = validFrom ? new Date(validFrom).getTime() > now : false;

  if (expired || notYetValid) {
    return {
      score: 0,
      status: "fail",
      confidence: "measured",
      details: expired ? "SSL certificate has expired" : "SSL certificate is not yet valid",
      meta: { validTo, validFrom, issuer, subjectName },
      analysis: {
        cause: expired ? "The SSL certificate has expired." : "The SSL certificate's validity period has not started.",
        recommendation: "Install a current, valid SSL certificate from a trusted certificate authority."
      }
    };
  }

  return {
    score: 100,
    status: "pass",
    confidence: "measured",
    details: "Valid SSL certificate (trusted chain, host match)",
    meta: { validTo, validFrom, issuer, subjectName },
    analysis: null
  };
}

// SSL expiry window (spec §2.4 — High). Days remaining, graded: <14d warn-hard, <30d warn, expired fail.
async function checkSSLExpiry(response) {
  if (!response) return { score: 0, status: "fail", confidence: "measured", details: "No response available for SSL expiry check", meta: {}, analysis: { cause: "No response received.", recommendation: "Check server connectivity." } };
  let securityDetails = null;
  try { securityDetails = await response.securityDetails(); } catch (e) {}
  const validTo = securityDetails && securityDetails.validTo ? new Date(securityDetails.validTo * 1000).toISOString() : null;
  if (!validTo) {
    // No certificate window available (e.g. HTTP page) — renormalized out, not scored.
    return { score: 100, status: "not_applicable", infoOnly: true, confidence: "measured", details: "Certificate expiry not available", meta: {}, analysis: null };
  }
  const days = Math.floor((new Date(validTo).getTime() - Date.now()) / 86400000);
  let score, status, analysis = null;
  if (days < 0) { score = 0; status = "fail"; analysis = { cause: "The SSL certificate has expired.", recommendation: "Renew the SSL certificate immediately and enable auto-renewal." }; }
  else if (days < 14) { score = 50; status = "warning"; analysis = { cause: `The SSL certificate expires very soon (in ${days} day(s)).`, recommendation: "Renew now and enable auto-renewal to avoid an outage." }; }
  else if (days < 30) { score = 80; status = "warning"; analysis = { cause: `The SSL certificate expires in ${days} days.`, recommendation: "Renew soon; enable auto-renewal." }; }
  else { score = 100; status = "pass"; }
  return {
    score, status, confidence: "measured",
    details: days < 0 ? "SSL certificate has expired" : `SSL certificate valid for ${days} more day(s)`,
    meta: { validTo, daysUntilExpiry: days },
    analysis
  };
}

// TLS(Transport Layer Security) Version
async function checkTLSVersion(response) {
  if (!response) return { score: 0, status: "fail", details: "No response available", meta: {}, analysis: { cause: "No response to check TLS version", recommendation: "Ensure server is reachable" } };

  const securityDetails = await response.securityDetails();
  if (!securityDetails) {
    return {
      score: 0,
      status: "fail",
      details: "No security details available",
      meta: {},
      analysis: {
        cause: "Unable to determine TLS version.",
        recommendation: "Ensure the server supports standard TLS protocols."
      }
    };
  }

  const tls = securityDetails.protocol; // e.g., "TLS 1.3"
  const isStrongTls = tls.includes('1.2') || tls.includes('1.3');

  return {
    score: isStrongTls ? 100 : 0,
    status: isStrongTls ? "pass" : "fail",
    details: isStrongTls ? `Strong TLS version: ${tls}` : `Weak TLS version: ${tls}`,
    meta: {
      version: tls
    },
    analysis: isStrongTls ? null : {
      cause: "The server supports older, insecure TLS versions (e.g., TLS 1.0 or 1.1).",
      recommendation: "Disable TLS 1.0/1.1 and enable TLS 1.2 or TLS 1.3 on your server."
    }
  };
}

// HSTS (HTTP Strict Transport Security)
function checkHSTS(response) {
  if (!response) return { score: 0, status: "fail", details: "No response available for HSTS check", meta: {}, analysis: { cause: "No response received.", recommendation: "Check server connectivity." } };

  const headers = response.headers();
  const hstsVal = headers['strict-transport-security'];

  if (hstsVal) {
    return {
      score: 100,
      status: "pass",
      details: "HSTS header is present",
      meta: {
        value: hstsVal
      },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "HSTS header is missing",
    meta: {},
    analysis: {
      cause: "The HTTP Strict Transport Security (HSTS) header is missing.",
      recommendation: "Add the 'Strict-Transport-Security' header to enforce HTTPS connections."
    }
  };
}

// X-Frame-Options
function checkXFrameOptions(response) {
  if (!response) return { score: 0, status: "fail", details: "No response available for X-Frame-Options check", meta: {}, analysis: { cause: "No response received.", recommendation: "Check server connectivity." } };

  const headers = response.headers();
  const xFrameVal = headers['x-frame-options'];

  if (xFrameVal) {
    return {
      score: 100,
      status: "pass",
      details: "X-Frame-Options header is present",
      meta: {
        value: xFrameVal
      },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "X-Frame-Options header is missing",
    meta: {},
    analysis: {
      cause: "The X-Frame-Options header is missing, making the site vulnerable to clickjacking.",
      recommendation: "Set the 'X-Frame-Options' header to 'DENY' or 'SAMEORIGIN'."
    }
  };
}

// CSP (Content Security Policy) — graded by directive coverage & safety (spec §2.4, High).
// Presence alone is not enough: 'unsafe-inline'/'unsafe-eval'/wildcards gut the protection,
// while default-src/script-src + object-src 'none' + frame-ancestors make it effective.
function checkCSP(response) {
  if (!response) return { score: 0, status: "fail", confidence: "measured", details: "No response available for CSP check", meta: {}, analysis: { cause: "No response received.", recommendation: "Check server connectivity." } };

  const headers = response.headers();
  const cspVal = headers['content-security-policy'];
  const cspRO = headers['content-security-policy-report-only'];

  if (!cspVal) {
    if (cspRO) {
      return {
        score: 30, status: "warning", confidence: "measured",
        details: "Only a report-only CSP is set (monitoring, not enforced)",
        meta: { value: cspRO, reportOnly: true },
        analysis: {
          cause: "A Content-Security-Policy-Report-Only header is present, which logs violations but does not block attacks.",
          recommendation: "Promote the policy to an enforced 'Content-Security-Policy' header once reported violations are resolved."
        }
      };
    }
    return {
      score: 0, status: "fail", confidence: "measured",
      details: "CSP header is missing", meta: {},
      analysis: {
        cause: "The Content-Security-Policy (CSP) header is missing.",
        recommendation: "Implement a CSP with a restrictive default-src/script-src, object-src 'none', and frame-ancestors to mitigate XSS and clickjacking."
      }
    };
  }

  const lower = cspVal.toLowerCase();
  const directiveMap = {};
  lower.split(';').map(d => d.trim()).filter(Boolean).forEach(d => {
    const [name, ...vals] = d.split(/\s+/);
    directiveMap[name] = vals.join(' ');
  });
  const has = (d) => Object.prototype.hasOwnProperty.call(directiveMap, d);
  const scriptSrc = directiveMap['script-src'] ?? directiveMap['default-src'] ?? '';
  const hasBasePolicy = has('default-src') || has('script-src');

  const unsafeInline = /'unsafe-inline'/.test(scriptSrc);
  const unsafeEval = /'unsafe-eval'/.test(scriptSrc);
  const wildcardScript = /(^|\s)\*(\s|$)/.test(scriptSrc) || /(^|\s)https?:(\s|$)/.test(scriptSrc);
  const usesNonceOrHash = /'nonce-|'sha(256|384|512)-/.test(scriptSrc);

  let score = 40; // present at all
  const weaknesses = [];
  if (hasBasePolicy) score += 15; else weaknesses.push("no default-src/script-src directive");
  if (has('object-src') && /'none'/.test(directiveMap['object-src'] || '')) score += 10; else weaknesses.push("object-src 'none' not set");
  if (has('frame-ancestors')) score += 10; else weaknesses.push("no frame-ancestors (clickjacking) directive");
  if (has('base-uri')) score += 5;
  if (!unsafeInline || usesNonceOrHash) score += 12; else weaknesses.push("script-src allows 'unsafe-inline'");
  if (!unsafeEval) score += 5; else weaknesses.push("script-src allows 'unsafe-eval'");
  if (!wildcardScript) score += 3; else weaknesses.push("script sources use a wildcard");
  if (score > 100) score = 100;

  const status = score >= 80 ? "pass" : score >= 50 ? "warning" : "fail";
  return {
    score, status, confidence: "measured",
    details: status === "pass" ? "CSP present with strong directive coverage" : `CSP present but weak: ${weaknesses.join(", ")}`,
    meta: { value: cspVal, directives: Object.keys(directiveMap), unsafeInline, unsafeEval, wildcardScript, usesNonceOrHash, weaknesses },
    analysis: status === "pass" ? null : {
      cause: `The Content-Security-Policy is present but not robust: ${weaknesses.join("; ")}.`,
      recommendation: "Tighten the CSP: restrictive default-src/script-src, prefer nonces/hashes over 'unsafe-inline', remove 'unsafe-eval' and wildcards, and add object-src 'none' and frame-ancestors."
    }
  };
}

// Referrer-Policy — one of the six headers SecurityHeaders.com grades. Graded by
// value safety, not mere presence: unsafe-url leaks full URLs cross-origin.
function checkReferrerPolicy(response) {
  if (!response) return { score: 0, status: "fail", details: "No response available for Referrer-Policy check", meta: {}, analysis: { cause: "No response received.", recommendation: "Check server connectivity." } };

  const headers = response.headers();
  const raw = headers['referrer-policy'];
  if (!raw) {
    return {
      score: 0, status: "fail",
      details: "Referrer-Policy header is missing",
      meta: {},
      analysis: {
        cause: "Without a Referrer-Policy, browsers may send full page URLs (including query strings) to third-party sites users navigate to.",
        recommendation: "Add 'Referrer-Policy: strict-origin-when-cross-origin' (or stricter, e.g. 'same-origin')."
      }
    };
  }

  // Multiple policies may be comma-separated; the last valid one wins.
  const policies = raw.toLowerCase().split(',').map(p => p.trim()).filter(Boolean);
  const effective = policies[policies.length - 1] || "";
  const SAFE = ["no-referrer", "same-origin", "strict-origin", "strict-origin-when-cross-origin"];
  const WEAK = ["no-referrer-when-downgrade", "origin", "origin-when-cross-origin"];

  if (SAFE.includes(effective)) {
    return { score: 100, status: "pass", details: `Referrer-Policy set to a safe value ('${effective}')`, meta: { value: raw, effective }, analysis: null };
  }
  if (WEAK.includes(effective)) {
    return {
      score: 50, status: "warning",
      details: `Referrer-Policy present but permissive ('${effective}')`,
      meta: { value: raw, effective },
      analysis: {
        cause: `The policy '${effective}' still shares origin (or full URL over HTTPS) with cross-origin destinations.`,
        recommendation: "Tighten to 'strict-origin-when-cross-origin' or 'same-origin'."
      }
    };
  }
  // unsafe-url or an unrecognized value
  return {
    score: 25, status: "fail",
    details: `Referrer-Policy set to an unsafe or invalid value ('${effective}')`,
    meta: { value: raw, effective },
    analysis: {
      cause: effective === "unsafe-url"
        ? "'unsafe-url' sends the full URL (including paths and query strings) to every destination."
        : "The Referrer-Policy value is not a recognized policy, so browsers fall back to their default.",
      recommendation: "Use 'strict-origin-when-cross-origin' (a safe modern default) or stricter."
    }
  };
}

// Permissions-Policy — hardening header restricting powerful browser features
// (camera, microphone, geolocation, payment…). SecurityHeaders.com grades on it.
function checkPermissionsPolicy(response) {
  if (!response) return { score: 0, status: "fail", details: "No response available for Permissions-Policy check", meta: {}, analysis: { cause: "No response received.", recommendation: "Check server connectivity." } };

  const headers = response.headers();
  const raw = headers['permissions-policy'] || headers['feature-policy']; // legacy fallback
  const legacyOnly = !headers['permissions-policy'] && !!headers['feature-policy'];

  if (!raw) {
    return {
      score: 0, status: "fail",
      details: "Permissions-Policy header is missing",
      meta: {},
      analysis: {
        cause: "Without a Permissions-Policy, embedded third-party content can request powerful features (camera, geolocation, payment) by default.",
        recommendation: "Add a Permissions-Policy that disables features you don't use, e.g. 'camera=(), microphone=(), geolocation=()'."
      }
    };
  }
  if (legacyOnly) {
    return {
      score: 50, status: "warning",
      details: "Only the deprecated Feature-Policy header is set",
      meta: { value: raw, legacy: true },
      analysis: {
        cause: "Feature-Policy has been replaced by Permissions-Policy; modern browsers ignore the legacy header.",
        recommendation: "Replace Feature-Policy with an equivalent Permissions-Policy header."
      }
    };
  }
  const directiveCount = raw.split(',').map(d => d.trim()).filter(Boolean).length;
  return {
    score: 100, status: "pass",
    details: `Permissions-Policy present (${directiveCount} directive${directiveCount === 1 ? "" : "s"})`,
    meta: { value: raw, directives: directiveCount },
    analysis: null
  };
}

// X-Content-Type-Options
function checkXContentTypeOptions(response) {
  if (!response) return { score: 0, status: "fail", details: "No response available for X-Content-Type-Options check", meta: {}, analysis: { cause: "No response received.", recommendation: "Check server connectivity." } };

  const headers = response.headers();
  const xContentTypeVal = headers['x-content-type-options'];

  if (xContentTypeVal) {
    return {
      score: 100,
      status: "pass",
      details: "X-Content-Type-Options header is present",
      meta: {
        value: xContentTypeVal
      },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "X-Content-Type-Options header is missing",
    meta: {},
    analysis: {
      cause: "The X-Content-Type-Options header is missing.",
      recommendation: "Add the 'X-Content-Type-Options: nosniff' header to prevent MIME type sniffing."
    }
  };
}

// Cookies - Third Party Cookies (disclosure-aware)
// Third-party cookies are normal (analytics/ads); the compliance question is whether
// they are DISCLOSED (consent banner + privacy policy), not merely whether they exist.
async function checkThirdPartyCookies(url, page, cookieConsentResult, privacyPolicyResult) {
  const pageHostname = new URL(url).hostname;
  const cookies = await page.context().cookies();

  const thirdPartyCookies = cookies.filter(cookie => {
    const cookieDomain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
    return !pageHostname.includes(cookieDomain) && !cookieDomain.includes(pageHostname);
  });
  const uniqueDomains = [...new Set(thirdPartyCookies.map(c => c.domain))];

  // No third-party cookies -> nothing to disclose
  if (thirdPartyCookies.length === 0) {
    return {
      score: 100,
      status: "pass",
      details: "No third-party cookies detected",
      meta: { thirdPartyCookies: [], uniqueDomains: [], disclosed: null },
      analysis: null
    };
  }

  // Disclosure signals (reuse already-computed consent + privacy-policy checks)
  const hasConsent = cookieConsentResult?.status === "pass";
  const hasPrivacyPolicy = privacyPolicyResult?.status === "pass";
  const disclosed = hasConsent || hasPrivacyPolicy;

  if (disclosed) {
    const via = [hasConsent ? "consent banner" : null, hasPrivacyPolicy ? "privacy policy" : null].filter(Boolean).join(" + ");
    return {
      score: 100,
      status: "pass",
      details: `Third-party cookies from ${uniqueDomains.length} domain(s), disclosed via ${via}.`,
      meta: { thirdPartyCookies, uniqueDomains, disclosed: true, hasConsent, hasPrivacyPolicy },
      analysis: null
    };
  }

  // Third-party cookies but NO disclosure -> GDPR/CCPA risk
  return {
    score: 30,
    status: "fail",
    details: `Third-party cookies from ${uniqueDomains.join(", ")} with no consent banner or privacy-policy disclosure`,
    meta: { thirdPartyCookies, uniqueDomains, disclosed: false, hasConsent, hasPrivacyPolicy },
    analysis: {
      cause: "Cookies from external domains are stored on the user's browser, but no cookie-consent banner or privacy-policy disclosure was found — a GDPR/CCPA risk.",
      recommendation: "Disclose third-party cookies via a cookie-consent banner and a privacy policy that names the third parties, and obtain consent before setting non-essential cookies."
    }
  };
}

// Google Safe Browsing
async function checkGoogleSafeBrowsing(url) {
  const safeBrowsingAPI = getSafeBrowsingKey();
  if (!safeBrowsingAPI) return { score: 100, status: "pass", details: "Safe Browsing API key missing", meta: {}, analysis: { location: "Configuration" } };

  const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${safeBrowsingAPI}`;
  const body = {
    client: { clientId: "myapp", clientVersion: "1.0" },
    threatInfo: {
      threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }],
    },
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    if (!res.ok) {
      return { score: 0, status: "error", details: `Google Safe Browsing API Error: ${res.statusText}`, meta: { status: res.status }, analysis: { cause: "API Request Failed" } };
    }

    const j = await res.json();
    const matches = j.matches || [];
    const isSafe = matches.length === 0;

    if (isSafe) {
      return {
        score: 100,
        status: "pass",
        details: "URL not flagged by Google Safe Browsing",
        meta: { matches },
        analysis: null
      };
    } else {
      return {
        score: 0,
        status: "fail",
        details: "URL flagged by Google Safe Browsing",
        meta: { matches },
        analysis: {
          cause: "The URL is listed as unsafe (malware/phishing/unwanted software).",
          recommendation: "Immediate action required: Check Google Search Console Security Issues report and clean site."
        }
      };
    }
  } catch (error) {
    return { score: 0, status: "error", details: `Check failed: ${error.message}`, meta: {}, analysis: { cause: error.message } };
  }
}

// VirusTotal
async function checkVirusTotal(domain) {
  const VT_KEY = getVTKey();
  if (!VT_KEY) return { score: 100, status: "pass", details: "VirusTotal API key missing (Skipped)", meta: {}, analysis: null };

  const endpoint = `https://www.virustotal.com/api/v3/domains/${domain}`;

  try {
    const res = await fetch(endpoint, { headers: { "x-apikey": VT_KEY } });

    if (!res.ok) {
      return {
        score: 0,
        status: "error",
        details: `VirusTotal API error: ${res.status}`,
        meta: { httpStatus: res.status },
        analysis: { cause: `API responded with status ${res.status}` }
      };
    }

    const j = await res.json();
    const stats = j?.data?.attributes?.last_analysis_stats || {};

    const malicious = stats.malicious || 0;
    const suspicious = stats.suspicious || 0;
    const isClean = malicious === 0 && suspicious === 0;

    if (isClean) {
      return {
        score: 100,
        status: "pass",
        details: "No malicious or suspicious detections",
        meta: { stats },
        analysis: null
      };
    } else {
      return {
        score: 0,
        status: "fail",
        details: `Detections occurred: ${malicious} malicious, ${suspicious} suspicious`,
        meta: { stats },
        analysis: {
          cause: "The domain is flagged by one or more security vendors.",
          recommendation: "Investigate the specific flags on VirusTotal. Clean up any malware or compromised content if confirmed."
        }
      };
    }
  } catch (error) {
    return { score: 0, status: "error", details: `Check failed: ${error.message}`, meta: {}, analysis: { cause: error.message } };
  }
}

// SQL Injection
async function checkSQLiExposure(urlString, options = {}) {
  const { timeout = 6000, lengthDiffThreshold = 0.25 } = options;

  const payloads = [
    `' OR '1'='1`,
    `" OR "1"="1`,
    `' OR 1=1 -- `,
    `') OR ('1'='1`,
    `" OR 1=1 -- `,
    ` ' OR 'a'='a`,
  ];

  const sqlErrorPatterns = [
    /you have an error in your sql syntax/i,
    /warning: mysql/i,
    /unclosed quotation mark after the character string/i,
    /pg_query\(|pg_query\_params\(|pg_connect\(/i,
    /syntax error at or near/i,
    /sqlite_exception/i,
    /sqlite3\.OperationalError/i,
    /oracle.*error/i,
    /mysql_fetch_array\(/i,
    /mysql_num_rows\(/i,
    /sql syntax.*mysql/i,
    /unterminated quoted string/i,
    /SQLSTATE\[/i,
  ];

  function looksLikeSQLError(body) {
    if (!body) return false;
    return sqlErrorPatterns.some((rx) => rx.test(body));
  }

  const url = new URL(urlString);
  const testParams = Array.from(url.searchParams.keys());

  // [PERF] Gate on a REAL injectable surface. This used to fall back to
  // synthesised ["q","id","search"] params when the URL had none — which is the
  // usual case for a homepage/marketing page. The app never reads those params,
  // so the server returns the identical page and no sqlErrorPattern can ever
  // match; the ONLY branch that could fire was the 25% length-diff heuristic,
  // which rotating banners / live inventory counts trip on their own. That cost
  // 19 sequential full-page GETs (15s timeout each) to manufacture a false
  // positive. N/A drops out of the denominator per rule 6 — it does not score 0.
  if (!testParams.length) {
    return {
      score: null,
      status: "not_applicable",
      infoOnly: true,
      confidence: "heuristic",
      details: "No query parameters on this URL — there is no injectable surface to test",
      meta: { testedParams: [], payloadCount: 0, reason: "no-query-params" },
      analysis: null
    };
  }

  // NOTE: deliberately raw fetch, NOT utils/wafGuard.js. These requests carry SQL
  // payloads in the query string, so a WAF answering 403 is the CORRECT outcome —
  // routing them through guardedGet would call noteWafBlock() and park the host in
  // a shared cooldown, starving page discovery / llms.txt / index coverage of
  // their legitimate probes.
  async function fetchBody(u) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(u.toString(), {
        redirect: "follow",
        signal: controller.signal
      });
      const text = await res.text();
      clearTimeout(id);
      return { status: res.status, text };
    } catch (error) {
      clearTimeout(id);
      return { status: 0, text: "" }; // Return empty on error/timeout
    }
  }

  // Baseline request
  const baseline = await fetchBody(url);
  const baselineText = baseline.text || "";
  const baselineLength = baselineText.length || 0;

  // [PERF] Probes fire concurrently instead of in a sequential double loop, so
  // wall time is one round trip rather than params × payloads of them.
  const probes = [];
  for (const param of testParams) {
    for (const p of payloads) probes.push({ param, payload: p });
  }

  const findings = await Promise.all(probes.map(async ({ param, payload: p }) => {
    const testUrl = new URL(url);
    testUrl.searchParams.set(param, p);

    const res = await fetchBody(testUrl);
    const body = res.text || "";
    const length = body.length || 0;

    // Check for SQL error messages in response
    if (looksLikeSQLError(body)) {
      return {
        score: 0,
        status: "fail",
        confidence: "heuristic",
        details: `Possible SQL injection surface — database error echoed for payload: ${p}`,
        meta: {
          payload: p,
          param: param,
          indicator: "sql-error-message"
        },
        analysis: {
          cause: "The application echoed a database error message in response to an injected payload — a strong surface indicator of SQL injection (not a confirmed exploit).",
          recommendation: "Ensure all user inputs are sanitized, use parameterized queries (prepared statements), and never expose raw database errors to clients."
        }
      };
    }

    // Check for significant content length difference (heuristic for blind SQLi)
    if (baselineLength > 0 && length > 0) {
      const diff = Math.abs(length - baselineLength) / baselineLength;
      if (diff >= lengthDiffThreshold && res.status >= 200 && res.status < 400) {
        return {
          score: 40,
          status: "warning",
          confidence: "heuristic",
          details: `Response length changed notably with payload: ${p} (weak blind-SQLi surface indicator)`,
          meta: {
            payload: p,
            param: param,
            diff: diff,
            indicator: "response-length-diff"
          },
          analysis: {
            cause: "Response length changed significantly with an injected payload. This is a weak surface indicator of possible blind SQL injection — not a confirmed vulnerability (content can also vary for benign reasons).",
            recommendation: "Verify the endpoint with manual testing; ensure the application handles invalid input gracefully and uses parameterized queries."
          }
        };
      }
    }

    return null;
  }));

  // Same precedence the old early-return loop had: a hard SQL-error finding wins
  // over the weak length-diff one.
  const hit = findings.find((f) => f && f.status === "fail") || findings.find(Boolean);
  if (hit) return hit;

  return {
    score: 100,
    status: "pass",
    details: "No SQL injection vulnerabilities detected (Basic Scan)",
    meta: {
      testedParams: testParams,
      payloadCount: payloads.length
    },
    analysis: null
  };
}

// XSS (Cross-Site Scripting)
async function checkXSS(url, browser) {
  const payload = "<script>alert('XSS')</script>";
  let page = null;
  let xssTriggered = false;

  // [PERF] Same gate as checkSQLiExposure — a page that reads no query parameters
  // cannot reflect one, so appending ?xss_test=<payload> to a paramless marketing
  // page spent a whole browser tab (goto 30s + challenge wait) to prove nothing.
  // The tab is the expensive part, so this must be checked BEFORE newPage().
  let testUrl;
  try {
    testUrl = new URL(url);
  } catch {
    return { score: null, status: "not_applicable", infoOnly: true, confidence: "heuristic", details: "Invalid URL for XSS check", meta: {}, analysis: null };
  }
  if (!Array.from(testUrl.searchParams.keys()).length) {
    return {
      score: null,
      status: "not_applicable",
      infoOnly: true,
      confidence: "heuristic",
      details: "No query parameters on this URL — there is no reflection surface to test",
      meta: { payload, reason: "no-query-params" },
      analysis: null
    };
  }

  try {
    page = await browser.newPage();

    // Listen for alert dialogs to confirm script execution
    page.on('dialog', async dialog => {
      if (dialog.message() === 'XSS') {
        xssTriggered = true;
      }
      await dialog.dismiss();
    });

    testUrl.searchParams.set("xss_test", payload);

    // Navigate with a reasonable timeout
    await page.goto(testUrl.toString(), { waitUntil: "domcontentloaded", timeout: 15000 });

    // Handle bot verification if it appears during XSS test. [PERF] 20s → 8s: the
    // shared audit page already solved this host's challenge before any pillar ran,
    // so this tab either inherits the clearance quickly or is not getting it at all.
    await waitForChallengeResolution(page, 8000);

    // Also check for raw payload reflection combined with execution status
    const content = await page.content();
    const isReflected = content.includes(payload);

    // If script executed, it's a critical Fail.
    if (xssTriggered) {
      return {
        score: 0,
        status: "fail",
        details: "Confirmed XSS: Script payload executed (alert triggered)",
        meta: {
          payload,
          triggered: true,
          reflected: isReflected
        },
        analysis: {
          cause: "The application reflects user input without sanitization, allowing arbitrary script execution.",
          recommendation: "Implement strict context-sensitive output encoding and Content Security Policy (CSP)."
        }
      };
    }

    // If reflected but didn't execute (e.g. blocked by browser or CSP), it's a warning/fail
    if (isReflected) {
      return {
        score: 50,
        status: "warning",
        details: "XSS payload reflected in response but execution not confirmed",
        meta: {
          payload,
          triggered: false,
          reflected: true
        },
        analysis: {
          cause: "The application reflects user input. While script execution wasn't confirmed (possibly blocked by browser/CSP), reflection is risky.",
          recommendation: "Ensure all reflections are properly escaped."
        }
      };
    }

    return {
      score: 100,
      status: "pass",
      details: "XSS payload not reflected or executed",
      meta: {
        payload,
        triggered: false,
        reflected: false
      },
      analysis: null
    };

  } catch (error) {
    return {
      score: 0, // Error state
      status: "error",
      details: `XSS Check failed: ${error.message}`,
      meta: {},
      analysis: { cause: error.message }
    };
  } finally {
    if (page) await page.close();
  }
}

// Cookie Consent
async function checkCookieConsent(page, market = null) {

  // 🔍 STEP 1: Check tracking / cookies usage
  const trackingData = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll("script"));

    const trackingKeywords = [
      "google-analytics",
      "gtag",
      "googletagmanager",
      "facebook",
      "pixel",
      "analytics",
      "track",
      "hotjar"
    ];

    let detectedTrackers = [];

    scripts.forEach(script => {
      const src = (script.src || "").toLowerCase();
      if (src) {
        trackingKeywords.forEach(k => {
          if (src.includes(k) && !detectedTrackers.includes(src)) {
            detectedTrackers.push(src);
          }
        });
      }
    });

    // [FIX] document.cookie can THROW a SecurityError ("Access is denied for this
    // document") when the document has an opaque origin — e.g. a WAF/bot-protection
    // interstitial or frame served with CSP `sandbox` (Imperva/Incapsula does this;
    // confirmed on lexusofnorthmiami.com), or cookies disabled for the document.
    // Treat unreadable cookies as "no cookies visible" instead of letting the
    // SecurityError abort the whole Security pillar — and with it the audit.
    let cookieString = "";
    try { cookieString = document.cookie || ""; } catch (_) { cookieString = ""; }
    const cookiesUsed = cookieString.length > 0;

    return {
      hasTracking: detectedTrackers.length > 0 || cookiesUsed,
      detectedTrackers: detectedTrackers,
      cookiesUsed: cookiesUsed,
      cookieString: cookieString 
    };
  });

  const hasTracking = trackingData.hasTracking;

  // 🔍 STEP 2: Existing banner detection
  const commonSelectors = [
    "#onetrust-banner-sdk",
    "#CybotCookiebotDialog",
    ".cc-banner",
    "#catapult-cookie-bar",
    "#cookie-law-info-bar",
    ".cookie-banner",
    ".privacy-banner",
    "[id*='cookie-notification']",
    "[class*='cookie-notification']"
  ];

  const genericSelectors = [
    "[id*='cookie']",
    "[class*='cookie']",
    "[id*='consent']",
    "[class*='consent']",
    "[aria-label*='cookie']",
    "[data-cookie-banner]",
  ];

  const allSelectors = [...commonSelectors, ...genericSelectors];

  let bannerFound = false;
  let foundSelector = null;

  for (const selector of allSelectors) {
    const element = await page.$(selector);
    if (element) {
      const box = await element.boundingBox();
      if (box && box.height > 0 && box.width > 0) {
        bannerFound = true;
        foundSelector = selector;
        break;
      }
    }
  }

  // 🔥 STEP 3: SMART DECISION LOGIC (market-aware)
  //
  // Neither market actually mandates a cookie banner, and scoring a site 0 for
  // not having one was the single largest false-positive risk in the product —
  // most damaging in Australia, which has no cookie law at all. What each market
  // DOES require is a different mechanism:
  //
  //   US → an opt-out: a "Do Not Sell or Share" link, a sensitive-information
  //        limit control, and honouring Global Privacy Control where required.
  //   AU → notice at collection (APP 5) and collection limited to what is
  //        reasonably necessary (APP 3), disclosed in the privacy policy.
  //
  // So a banner is still the strongest single piece of evidence and still
  // passes exactly as before. The change is what happens WITHOUT one: instead
  // of a flat failure, the market's own required mechanism is looked for, and
  // its absence is a warning that names the real obligation.
  const locale = getLocale(market);

  // ❌ No tracking → Not required
  if (!hasTracking) {
    return {
      score: 100,
      status: "not_applicable",
      details: "No tracking or cookies detected, consent banner not required.",
      meta: { trackingData, market: locale.code },
      analysis: null
    };
  }

  // ✅ Tracking + Banner found → PASS (unchanged in both markets)
  if (bannerFound) {
    return {
      score: 100,
      status: "pass",
      details: `Cookie consent banner detected (Pattern: ${foundSelector})`,
      meta: { selector: foundSelector, trackingData, market: locale.code },
      analysis: null
    };
  }

  // No banner — look for what this market actually requires instead.
  const rights = await page.evaluate((terms) => {
    const text = (document.body.innerText || "").toLowerCase();
    return terms.filter((t) => text.includes(t));
  }, locale.privacy.rightsTerms).catch(() => []);

  let rightsSelector = null;
  for (const selector of locale.privacy.rightsSelectors) {
    try {
      const el = await page.$(selector);
      if (!el) continue;
      const box = await el.boundingBox();
      if (box && box.height > 0 && box.width > 0) { rightsSelector = selector; break; }
    } catch (_) { /* an invalid selector must not abort the pillar */ }
  }

  const meta = { trackingData, market: locale.code, bannerFound: false, rightsTerms: rights, rightsSelector };

  if (rights.length || rightsSelector) {
    return {
      score: 100,
      status: "pass",
      details: `No banner, but this market's required mechanism is present (${rights[0] || rightsSelector}).`,
      meta,
      analysis: null
    };
  }

  return {
    score: 60,
    status: "warning",
    details: `Tracking detected with no consent banner and no ${locale.code === "AU" ? "collection notice" : "opt-out control"}.`,
    meta,
    analysis: {
      cause: `Tracking starts on load, and no mechanism required in ${locale.name} was found on the page. ${locale.privacy.consentBasis}`,
      recommendation: locale.code === "AU"
        ? "A banner is optional here. What is expected is that the privacy policy discloses the tracking tools in use and any overseas disclosure, and that collection is limited to what is reasonably necessary."
        : "Add a \"Do Not Sell or Share My Personal Information\" link, a sensitive-information limit control, and honour Global Privacy Control signals.",
    }
  };
}

// Privacy Policy
async function checkPrivacyPolicy(page) {
  const links = await page.$$eval("a", (anchors) =>
    anchors.map((a) => ({
      href: (a.href || "").toLowerCase(),
      text: (a.innerText || "").toLowerCase(),
      visible: a.offsetWidth > 0 && a.offsetHeight > 0
    }))
  );

  const privacyPatterns = ["privacy", "privacy policy", "privacy-policy", "privacy_policy", "data protection"];

  const foundLink = links.find((link) =>
    link.visible && (
      privacyPatterns.some((pattern) => link.href.includes(pattern)) ||
      privacyPatterns.some((pattern) => link.text.includes(pattern))
    )
  );

  if (foundLink) {
    return {
      score: 100,
      status: "pass",
      details: "Visible Privacy Policy link found",
      meta: {
        foundLink: foundLink.href
      },
      analysis: null
    };
  } else {
    return {
      score: 0,
      status: "fail",
      details: "No visible privacy policy link found",
      meta: {},
      analysis: {
        cause: "No visible link matching 'Privacy Policy' patterns was found in the page links.",
        recommendation: "Ensure a clearly visible 'Privacy Policy' link is present in the footer or navigation menu."
      }
    };
  }
}

// Privacy-rights notice — the regime named here is whichever one governs the
// audited market. The check itself is unchanged (keyword scan + CMP widget
// detection); only the reference list moves, which is the whole point: an
// Australian policy that correctly cites the Privacy Act and the APPs used to
// FAIL this check for not containing the string "CCPA".
async function checkPrivacyRightsNotice(page, market = null) {
  const locale = getLocale(market);
  const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());

  const foundKeyword = locale.privacy.rightsTerms.find((k) => pageText.includes(k));

  let foundSelector = null;
  for (const selector of locale.privacy.rightsSelectors) {
    try {
      const element = await page.$(selector);
      if (!element) continue;
      const box = await element.boundingBox();
      if (box && box.height > 0 && box.width > 0) { foundSelector = selector; break; }
    } catch (_) { /* an invalid selector must not abort the pillar */ }
  }

  if (foundKeyword || foundSelector) {
    return {
      score: 100,
      status: "pass",
      details: foundKeyword
        ? `${locale.privacy.regime} rights text found: "${foundKeyword}"`
        : `Privacy-rights element found (${foundSelector})`,
      meta: { foundKeyword, foundSelector, market: locale.code, regime: locale.privacy.regime },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: `No ${locale.privacy.regime} rights notice found`,
    meta: { market: locale.code, regime: locale.privacy.regime },
    analysis: {
      cause: `No text referencing ${locale.privacy.regime} or the rights it gives visitors was found, nor any standard consent-management widget.`,
      recommendation: locale.code === "AU"
        ? "State that the site is bound by the Privacy Act 1988 and the Australian Privacy Principles, and describe how a visitor accesses, corrects or complains about their personal information (including escalation to the OAIC)."
        : "Ensure explicit mention of visitor rights (CCPA/CPRA) or a link to 'Do Not Sell or Share My Personal Information' is present."
    }
  };
}

// Data Collection
async function checkDataCollection(page) {
  // 1. Check keywords in visible links (href and text)
  const links = await page.$$eval("a", (anchors) =>
    anchors.map((a) => ({
      href: (a.href || "").toLowerCase(),
      text: (a.innerText || "").toLowerCase(),
      visible: a.offsetWidth > 0 && a.offsetHeight > 0
    }))
  );

  const dataLinkKeywords = [
    "data collection",
    "data usage",
    "data policy",
    "information we collect",
    "usage policy",
    "privacy center"
  ];

  const foundLink = links.find(link =>
    link.visible && dataLinkKeywords.some(k => link.href.includes(k) || link.text.includes(k))
  );

  if (foundLink) {
    return {
      score: 100,
      status: "pass",
      details: "Data collection disclosure link found",
      meta: {
        foundLink: foundLink.href
      },
      analysis: null
    };
  }

  // 2. Check for headings (H1-H6) that expressly mention data collection
  const headings = await page.$$eval("h1, h2, h3, h4, h5, h6", (els) =>
    els.map(el => ({
      text: (el.innerText || "").toLowerCase(),
      visible: el.offsetWidth > 0 && el.offsetHeight > 0
    }))
  );

  const headingKeywords = [
    "how we use your data",
    "information collection",
    "what information we collect",
    "data we collect"
  ];

  const foundHeading = headings.find(h =>
    h.visible && headingKeywords.some(k => h.text.includes(k))
  );

  if (foundHeading) {
    return {
      score: 100,
      status: "pass",
      details: `Data collection section found: "${foundHeading.text}"`,
      meta: {
        foundHeading: foundHeading.text
      },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No explicit 'Data Collection' disclosure found",
    meta: {},
    analysis: {
      cause: "No visible links or headings were found that explicitly mention 'Data Collection', 'Information We Collect', or similar.",
      recommendation: "Ensure your Privacy Policy or Terms have a clearly marked section detailing data collection practices."
    }
  };
}

// Forms Use HTTPS
async function checkFormsUseHTTPS(page) {
  const pageUrl = page.url();

  const forms = await page.$$eval("form", (forms) =>
    forms.map((f) => f.getAttribute("action") || "")
  );

  if (!forms.length) return { score: 100, status: "pass", details: "No forms found", meta: { formsCount: 0 }, analysis: null };

  const insecureForms = forms.filter((action) => {
    try {
      const resolvedUrl = new URL(action, pageUrl);
      return resolvedUrl.protocol !== "https:";
    } catch (e) {
      return false;
    }
  });

  if (insecureForms.length === 0) {
    return {
      score: 100,
      status: "pass",
      details: "All forms use HTTPS",
      meta: {
        formsCount: forms.length,
        insecureForms: []
      },
      analysis: null
    };
  } else {
    return {
      score: 0,
      status: "fail",
      details: `Found ${insecureForms.length} form(s) using insecure protocols`,
      meta: {
        formsCount: forms.length,
        insecureForms
      },
      analysis: {
        cause: "One or more forms on the page are configured to submit data over an unencrypted (HTTP) connection.",
        recommendation: "Update the 'action' attribute of all forms to start with 'https://' or use relative paths on an HTTPS site."
      }
    };
  }
}

// Weak Default Credentials
async function checkWeakDefaultCredentials(page, browser) {
  // 1. Passive Scan: Check page text for explicit mentions
  const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
  const explicitIndicators = [
    "default password",
    "default credentials",
    "username: admin",
    "password: admin",
    "admin/admin",
    "demo login",
    "login with admin",
    "use admin",
  ];

  if (explicitIndicators.some((kw) => pageText.includes(kw))) {
    return {
      score: 0,
      status: "fail",
      details: "Default credentials mentioned in visible text",
      meta: {
        scanType: "passive",
        match: explicitIndicators.find((kw) => pageText.includes(kw))
      },
      analysis: {
        cause: "The page content explicitly mentions default credentials (e.g., 'admin/admin').",
        recommendation: "Remove any mention of default credentials and ensure they are changed in production."
      }
    };
  }

  // 2. Active Scan: Attempt to login with weak credentials if a form exists
  const loginForm = await page.$("form input[type='password']");
  if (!loginForm) {
    return {
      score: 100,
      status: "pass",
      details: "No login form detected",
      meta: {
        scanType: "active",
        formDetected: false
      },
      analysis: null
    };
  }

  const credentials = [
    { u: "admin", p: "admin" },
    { u: "admin", p: "password" },
    { u: "root", p: "root" },
    { u: "user", p: "user" }
  ];

  // We only test the first set to avoid account lockouts or excessive requests in this compliance check
  const cred = credentials[0];

  // The active scan SUBMITS the login form, which navigates the page. Run it on an
  // ISOLATED tab (browser.newPage) — never the shared audit page — so it can't
  // destroy the execution context that UX/SEO/Accessibility read concurrently in
  // the full "All" audit. (checkXSS uses the same own-page pattern.)
  let scanPage = null;
  try {
    scanPage = await browser.newPage();
    await scanPage.goto(page.url(), { waitUntil: "domcontentloaded", timeout: 30000 });

    // Attempt to fill likely username/password fields
    const userField = await scanPage.$("input[type='text'], input[type='email'], input[name*='user'], input[name*='login']");
    const passField = await scanPage.$("input[type='password']");
    const submitBtn = await scanPage.$("button[type='submit'], input[type='submit']");

    if (userField && passField && submitBtn) {
      await userField.type(cred.u);
      await passField.type(cred.p);

      // Wait for navigation or failure message
      const navigationPromise = scanPage.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => null);
      await submitBtn.click();
      await navigationPromise;

      // Check for success indicators (URL change, "dashboard", "welcome", logout button)
      const newUrl = scanPage.url();
      const newText = await scanPage.evaluate(() => document.body.innerText.toLowerCase());

      const successKeywords = ["dashboard", "welcome", "logout", "sign out", "my account"];
      const isSuccess = successKeywords.some(k => newText.includes(k)) && !newText.includes("invalid") && !newText.includes("incorrect");

      if (isSuccess) {
        return {
          score: 0,
          status: "fail",
          details: `Login successful with weak credentials (${cred.u}/${cred.p})`,
          meta: {
            scanType: "active",
            credentials: `${cred.u}/${cred.p}`,
            newUrl
          },
          analysis: {
            cause: "The application accepts weak or default credentials.",
            recommendation: "Enforce strong password policies and change all default accounts immediately."
          }
        };
      }
    }
  } catch (e) {
    // Ignore active check errors (e.g. selectors not found during interaction)
  } finally {
    if (scanPage) { try { await scanPage.close(); } catch {} }
  }

  return {
    score: 100,
    status: "pass",
    details: "No weak default credentials detected (Basic Scan)",
    meta: {
      scanType: "active",
      formDetected: true,
      testedCount: 1
    },
    analysis: null
  };
}

// Authentication & Access Control
async function checkAdminPanelPublic(baseUrl, options = {}) {
  const { timeout = 5000, maxBodyChars = 20000 } = options;

  let origin;
  try {
    const u = new URL(baseUrl);
    origin = u.origin;
  } catch (e) {
    return { score: 100, status: "error", details: "Invalid Base URL for Admin Check", meta: {}, analysis: null };
  }

  // [PERF] 13 paths → 6. Thirteen simultaneous 404-hunting GETs from one IP is a
  // textbook scanner fingerprint and was a main trigger for the self-inflicted WAF
  // blocks. These six cover the platforms that actually ship an exposed panel;
  // the dropped ones (/cms, /backend, /controlpanel, /sqladmin/, /dashboard,
  // /login.php, /admin/login) are either soft-404 noise or already implied by /admin.
  const adminPaths = [
    "/admin", "/administrator", "/admin.php",
    "/wp-admin/", "/wp-login.php", "/phpmyadmin/"
  ];

  const adminKeywords = [
    "wp-login.php", "wordpress", "phpmyadmin", "administrator",
    "admin panel", "control panel", "dashboard", "administration", "admin area"
  ];

  // [PERF] Don't add to the pile while the host is already refusing browserless
  // traffic — every probe sent during a cooldown is a guaranteed 403 that deepens
  // the IP-level block the other pillars are waiting out. (Raw fetch, not
  // guardedGet: a 403 on /phpmyadmin is the correct answer, not a WAF verdict, so
  // it must not call noteWafBlock() and park the host in a shared cooldown.)
  if (isWafCoolingDown(origin)) {
    return {
      score: null,
      status: "not_applicable",
      infoOnly: true,
      confidence: "heuristic",
      details: "Skipped — the host is currently rate-limiting automated requests",
      meta: { reason: "waf-cooldown" },
      analysis: null
    };
  }

  const checkPath = async (path) => {
    const tryUrl = new URL(path, origin).toString();
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      // Browser-shaped headers: a curl-shaped UA is the single easiest thing for a
      // WAF to score as automation (see utils/wafGuard.js).
      const res = await fetch(tryUrl, { method: 'GET', redirect: "follow", signal: controller.signal, headers: BROWSER_HEADERS });

      // 401/403 means it exists but is protected -> Pass
      if (res.status === 401 || res.status === 403) return null;

      if (res.status === 200) {
        // Check content to avoid false positives (e.g. soft 404s)
        const text = await res.text();
        const lowText = text.slice(0, maxBodyChars).toLowerCase();

        if (adminKeywords.some(kw => lowText.includes(kw))) {
          return {
            score: 0,
            status: "fail",
            details: `Admin panel exposed at ${path}`,
            meta: {
              url: tryUrl,
              path,
              status: res.status
            },
            analysis: {
              cause: `An administrative panel appears to be publicly accessible at ${path}.`,
              recommendation: "Restrict access to admin panels using IP whitelisting or move them to a non-public URL."
            }
          };
        }
      }
    } catch (err) {
      // Ignore network errors (timeout, connection refused) as effectively "not public"
      return null;
    } finally {
      clearTimeout(id);
    }
    return null;
  };

  const results = await Promise.all(adminPaths.map(p => checkPath(p)));
  const failure = results.find(r => r !== null);

  if (failure) return failure;

  return {
    score: 100,
    status: "pass",
    details: "No public admin panels found",
    meta: {
      pathsChecked: adminPaths.length
    },
    analysis: null
  };
}

// ---------------------------------------------------------------------------
// CRM Integration (Lead Transfer)  —  scored 0..10, normalised to 0..100
// ---------------------------------------------------------------------------
// Flow (per audit spec):
//   1. Static analysis of contact/lead forms — form action, hidden fields,
//      CRM scripts/SDKs on the page.            CRM evidence found  -> +3
//   2. Active test (isolated tab): fill a clearly-labelled test lead and submit,
//      capturing network requests for known CRM lead endpoints.
//                                               Lead endpoint hit   -> +5
//   3. Endpoint returns HTTP 200/201.           Successful response -> +2
//   Max raw = 10.  score = rawScore * 10.
//
// Known CRM signatures. `patterns` are matched (case-insensitive, substring)
// against form actions, hidden field name=value pairs, script srcs/inline code,
// and the URLs of network requests fired during submission.
const CRM_SIGNATURES = [
  { name: "HubSpot", patterns: ["hsforms.net", "hsforms.com", "hs-scripts.com", "hs-analytics.net", "hubspot.com", "api.hsforms.com", "forms.hubspot.com", "hbspt", "_hsq"] },
  { name: "Salesforce", patterns: ["salesforce.com", "force.com", "pardot.com", "pi.pardot.com", "web-to-lead", "webto.salesforce.com", "sfdcstatic.com", "d.la1-c2-iad.salesforceliveagent.com"] },
  { name: "VinSolutions", patterns: ["vinsolutions.com", "vinmanager", "vindigital"] },
  { name: "DealerSocket", patterns: ["dealersocket.com", "dealersocket", "blackbookcdx"] },
  { name: "Elead", patterns: ["eleadcrm.com", "elead-crm", "eleadtrack", "eleadcrm"] },
  { name: "Zoho", patterns: ["zoho.com", "zohopublic.com", "crm.zoho", "forms.zoho", "zohocdn.com", "zohostatic.com"] },
  // Automotive / dealership CRMs (common on auto-dealer sites)
  { name: "goCRM", patterns: ["gocrm.ai", "gocrm.io", "api.gocrm"] },
  { name: "Selly Automotive", patterns: ["sellyserver.co", "sellyautomotive.com", "sellyauto"] },
  { name: "DriveCentric", patterns: ["drivecentric.com", "drivecentric"] },
  { name: "ProMax", patterns: ["promaxunlimited.com", "promax"] },
  { name: "AutoRaptor", patterns: ["autoraptor.com", "autoraptor"] },
  { name: "CDK Global", patterns: ["cdkglobal.com", "cdk.com", "cobaltgroup"] },
  { name: "Dealer.com / DealerInspire", patterns: ["dealer.com", "dealerinspire.com"] },
  { name: "Gubagoo", patterns: ["gubagoo.com", "gubagoo.io"] },
  { name: "ActivEngage", patterns: ["activengage.com"] },
  { name: "Other CRM/Marketing", patterns: ["/web-to-lead", "/leads", "/lead-capture", "leadform", "marketo.com", "mktoresp.com", "act-on.com", "salesloft.com", "/api/lead", "crm-api", "leadperfection", "cars.com/leads"] },
];

function matchCRM(haystack) {
  if (!haystack) return null;
  const h = String(haystack).toLowerCase();
  for (const crm of CRM_SIGNATURES) {
    if (crm.patterns.some((p) => h.includes(p))) return crm.name;
  }
  return null;
}

// Per-component scoring breakdown so the UI can show exactly why the score is
// what it is, and what's still missing to reach 10/10.
function buildCRMBreakdown(meta) {
  return [
    {
      label: "CRM evidence on page",
      points: 3,
      earned: !!meta.crmEvidenceFound,
      detail: meta.crmEvidenceFound
        ? `Detected: ${meta.detectedCRMs.join(", ")}`
        : "No CRM script, SDK, or CRM form action was found. Add your CRM's official form embed or tracking SDK (e.g., HubSpot, Salesforce, goCRM, Selly) to the page.",
    },
    {
      label: "Lead endpoint detected on submit",
      points: 5,
      earned: !!meta.leadEndpointDetected,
      detail: meta.leadEndpointDetected
        ? `Lead posted to: ${(meta.leadEndpoints || []).map((e) => e.crm).join(", ")}`
        : "Submitting the form did not post to a recognized CRM endpoint — typically because the lead is relayed to the CRM server-side. Post the lead directly to the CRM (client-side form action or API) so the integration is verifiable from the browser.",
    },
    {
      label: "Successful submission (HTTP 200/201)",
      points: 2,
      earned: !!meta.successfulResponse,
      detail: meta.successfulResponse
        ? "The CRM lead endpoint returned a success response."
        : meta.leadEndpointDetected
          ? "The CRM endpoint did not return HTTP 200/201. Ensure the lead endpoint responds with a success status so submissions aren't silently dropped."
          : "Blocked until a CRM lead endpoint is detected (above).",
    },
  ];
}

// Find the site's contact page from the homepage's links (read-only).
// Lead forms live on /contact, not the homepage, so we test there.
async function discoverContactUrl(page) {
  try {
    return await page.evaluate(() => {
      const bad = (raw) => /^(mailto:|tel:|javascript:|#)/i.test(raw || "");
      const links = Array.from(document.querySelectorAll("a[href]"))
        .map((a) => ({
          href: a.href,
          raw: a.getAttribute("href") || "",
          text: (a.textContent || "").trim().toLowerCase(),
        }))
        .filter((l) => l.href && !bad(l.raw));
      // Strongest signal: the URL path itself mentions contact.
      const byHref = links.find((l) => /contact/i.test(l.href));
      if (byHref) return byHref.href;
      // Next: a link whose visible text is "contact".
      const byText = links.find((l) => /\bcontact\b/.test(l.text));
      return byText ? byText.href : null;
    });
  } catch {
    return null;
  }
}

async function checkCRMIntegration(url, page, browser) {
  const meta = {
    checkedUrl: null,
    crmEvidenceFound: false,
    detectedCRMs: [],
    leadEndpointDetected: false,
    leadEndpoints: [],
    submissionAttempted: false,
    successfulResponse: false,
    responseStatuses: [],
    testLead: { name: "Test User", email: "test@example.com" },
    rawScore: 0,
    maxScore: 10,
  };
  let rawScore = 0;
  const detected = new Set();
  let scanPage = null;
  const crmRequests = [];
  const crmResponses = new Map();
  let submitted = false; // flips true the instant we click submit

  // Resource types that are page assets, NOT a lead submission. A request to a
  // CRM host for one of these (e.g. loading the goCRM SDK script) must NOT be
  // mistaken for a lead-transfer endpoint.
  const ASSET_TYPES = ["script", "stylesheet", "image", "font", "media", "manifest", "other"];

  try {
    // ---- Locate the contact page (where the real lead form lives) ----
    const discovered = await discoverContactUrl(page);
    const origin = new URL(page.url()).origin;
    const candidates = [];
    const pushUniq = (u) => { if (u && !candidates.includes(u)) candidates.push(u); };
    pushUniq(discovered);
    pushUniq(origin + "/contact-us");
    pushUniq(origin + "/contact");
    pushUniq(origin + "/contactus");
    pushUniq(page.url()); // homepage — last-resort fallback

    // ISOLATED tab — never the shared audit page, so submitting can't destroy the
    // execution context the other concurrent metrics read.
    scanPage = await browser.newPage();
    scanPage.on("request", (req) => {
      const crm = matchCRM(req.url());
      if (!crm) return;
      crmRequests.push({
        crm,
        url: req.url(),
        method: req.method(),
        isAsset: ASSET_TYPES.includes(req.resourceType()),
        afterSubmit: submitted,
      });
    });
    scanPage.on("response", (resp) => {
      const crm = matchCRM(resp.url());
      if (crm) crmResponses.set(resp.url(), resp.status());
    });

    // Navigate to the first candidate that loads (HTTP < 400) and has a form;
    // otherwise fall through to the homepage.
    for (let i = 0; i < candidates.length; i++) {
      const cand = candidates[i];
      const isLast = i === candidates.length - 1;
      try {
        const resp = await scanPage.goto(cand, { waitUntil: "domcontentloaded", timeout: 30000 });
        if (!isLast && resp && resp.status() >= 400) continue; // 404 etc → try next
        await waitForChallengeResolution(scanPage, 15000).catch(() => {});
        const formCount = await scanPage.$$eval("form", (fs) => fs.length).catch(() => 0);
        meta.checkedUrl = scanPage.url();
        if (formCount > 0 || isLast) break;
      } catch (e) {
        meta.checkedUrl = cand;
        if (isLast) break;
      }
    }

    // ---------- 1. STATIC ANALYSIS (on the contact page) ----------
    const staticData = await scanPage.evaluate(() => {
      const forms = Array.from(document.querySelectorAll("form")).map((f) => ({
        action: f.getAttribute("action") || "",
        hidden: Array.from(f.querySelectorAll("input[type='hidden']")).map(
          (i) => `${i.name || ""}=${i.value || ""}`
        ),
        hasEmail: !!f.querySelector("input[type='email'], input[name*='email' i], input[id*='email' i]"),
        text: ((f.innerText || "") + " " + (f.outerHTML || "")).slice(0, 800),
      }));
      const scripts = Array.from(document.querySelectorAll("script")).map(
        (s) => s.getAttribute("src") || (s.textContent || "").slice(0, 600)
      );
      return { forms, scripts };
    });

    for (const f of staticData.forms) {
      const a = matchCRM(f.action);
      if (a) detected.add(a);
      for (const h of f.hidden) {
        const m = matchCRM(h);
        if (m) detected.add(m);
      }
    }
    for (const s of staticData.scripts) {
      const m = matchCRM(s);
      if (m) detected.add(m);
    }

    if (detected.size > 0) {
      rawScore += 3;
      meta.crmEvidenceFound = true;
    }

    // Identify a testable contact/lead form (prefer one with an email field).
    const leadKeywords = ["contact", "lead", "quote", "get started", "request", "info", "test drive", "schedule", "demo", "inquiry", "enquiry", "subscribe", "sign up", "appointment", "trade-in"];
    const hasLeadForm = staticData.forms.some(
      (f) => f.hasEmail || leadKeywords.some((k) => f.text.toLowerCase().includes(k))
    );

    if (!hasLeadForm) {
      // No contact/lead form found — lead transfer is not applicable.
      // Mirror the Forms_Use_HTTPS "no forms => neutral" convention so sites
      // without lead-gen aren't penalised on their security score.
      meta.detectedCRMs = [...detected];
      meta.rawScore = rawScore;
      meta.missingPoints = meta.maxScore - rawScore;
      meta.breakdown = buildCRMBreakdown(meta);
      return {
        score: 100,
        status: "not_applicable",
        details: meta.crmEvidenceFound
          ? `CRM SDK detected (${meta.detectedCRMs.join(", ")}) but no testable contact/lead form on ${meta.checkedUrl}`
          : `No contact/lead form detected on ${meta.checkedUrl}`,
        meta,
        analysis: null,
      };
    }

    // ---------- 2 & 3. ACTIVE TEST (same contact page, already loaded) ----------
    // Submit a clearly-labelled test lead and watch for a CRM lead endpoint.
    meta.submissionAttempted = true;

    // Pick the first form that has an email field, else the first form.
    const forms = await scanPage.$$("form");
    let targetForm = null;
    for (const fh of forms) {
      const emailField = await fh.$("input[type='email'], input[name*='email' i], input[id*='email' i]");
      if (emailField) { targetForm = fh; break; }
    }
    if (!targetForm && forms.length) targetForm = forms[0];

    if (targetForm) {
      const nameField = await targetForm.$("input[name*='name' i], input[id*='name' i], input[type='text']:not([name*='search' i])");
      const emailField = await targetForm.$("input[type='email'], input[name*='email' i], input[id*='email' i]");
      const phoneField = await targetForm.$("input[type='tel'], input[name*='phone' i], input[id*='phone' i]");
      const submitBtn =
        (await targetForm.$("button[type='submit'], input[type='submit']")) ||
        (await targetForm.$("button"));

      if (nameField) await nameField.type(meta.testLead.name).catch(() => {});
      if (emailField) await emailField.type(meta.testLead.email).catch(() => {});
      if (phoneField) await phoneField.type("0000000000").catch(() => {});

      if (submitBtn) {
        submitted = true; // requests from here on count as lead-transfer traffic
        const navP = scanPage
          .waitForNavigation({ waitUntil: "domcontentloaded", timeout: 8000 })
          .catch(() => null);
        await submitBtn.click().catch(() => {});
        await navP;
        // Give async XHR/fetch lead posts time to fire after submit.
        await scanPage.waitForTimeout(2500).catch(() => {});
      }
    }

    // A lead endpoint = a non-asset CRM request fired AFTER submission (the SDK
    // script loading earlier doesn't count).
    const leadPosts = crmRequests.filter((r) => r.afterSubmit && !r.isAsset);
    if (leadPosts.length > 0) {
      rawScore += 5;
      meta.leadEndpointDetected = true;
      meta.leadEndpoints = leadPosts.slice(0, 10).map((r) => ({ crm: r.crm, url: r.url, method: r.method }));
      leadPosts.forEach((r) => detected.add(r.crm));

      const statuses = leadPosts.map((r) => crmResponses.get(r.url)).filter((s) => s != null);
      meta.responseStatuses = statuses;
      if (statuses.some((s) => s === 200 || s === 201)) {
        rawScore += 2;
        meta.successfulResponse = true;
      }
    }

    if (rawScore > 10) rawScore = 10;
    meta.detectedCRMs = [...detected];
    meta.rawScore = rawScore;
    meta.missingPoints = meta.maxScore - rawScore;
    meta.breakdown = buildCRMBreakdown(meta);

    const where = meta.checkedUrl ? ` (tested ${meta.checkedUrl})` : "";
    let status, details, analysis;
    if (meta.leadEndpointDetected && meta.successfulResponse) {
      status = "pass";
      details = `CRM lead transfer confirmed (${meta.detectedCRMs.join(", ")}) with a successful submission${where}`;
      analysis = null;
    } else if (meta.leadEndpointDetected) {
      status = "warning";
      details = `Lead endpoint detected (${meta.detectedCRMs.join(", ")}) but submission did not return HTTP 200/201${where}`;
      analysis = {
        cause: "A request reached a CRM lead endpoint during the test submission, but no success (200/201) response was observed.",
        recommendation: "Verify the form handler reliably posts leads to your CRM and that the endpoint returns a success status, so no inquiries are silently lost.",
      };
    } else if (meta.crmEvidenceFound) {
      status = "warning";
      details = `CRM SDK detected (${meta.detectedCRMs.join(", ")}) but no lead endpoint fired on form submission${where}`;
      analysis = {
        cause: "CRM scripts/SDKs are present on the page, but submitting the lead form did not trigger any request to a known CRM lead endpoint. The lead may be relayed to the CRM server-side, which cannot be observed from the browser.",
        recommendation: "Confirm the contact form is actually wired to the CRM (correct form action / handler) so submitted leads are captured.",
      };
    } else {
      status = "fail";
      details = `No CRM integration detected for the contact/lead form${where}`;
      analysis = {
        cause: "A contact/lead form exists, but no CRM evidence was found statically and no CRM lead endpoint was contacted on submission.",
        recommendation: "Integrate the lead form with a CRM (e.g., HubSpot, Salesforce, Zoho) so inquiries are automatically captured and routed to sales.",
      };
    }

    return { score: rawScore * 10, status, details, meta, analysis };
  } catch (error) {
    meta.detectedCRMs = [...detected];
    meta.rawScore = rawScore;
    return {
      score: 0,
      status: "error",
      details: `CRM Integration check failed: ${error.message}`,
      meta,
      analysis: { cause: error.message },
    };
  } finally {
    if (scanPage) await scanPage.close().catch(() => {});
  }
}

// ---------------------------------------------------------------------------
// Finance Form Security (PCI)  —  scored 0..10, normalised to 0..100
// ---------------------------------------------------------------------------
// Flow (per audit spec):
//   Find the finance / credit-application page.  Not found -> Not Applicable.
//   On that page (PASSIVE only — we NEVER submit a fake credit application):
//     HTTPS                         +2
//     Sensitive data handled safely +2   (SSN / card / bank collected over HTTPS,
//                                          or not collected client-side at all)
//     Trusted finance provider      +3   (RouteOne, Dealertrack, CreditIQ, Stripe, PayPal…)
//     Secure submission endpoint    +2   (form action is HTTPS)
//     Security signals              +1   (>=2 of: Privacy Policy, Terms, SSL/secure messaging)
//   Max raw = 10.  score = rawScore * 10.
const FINANCE_PROVIDERS = [
  { name: "RouteOne", patterns: ["routeone.com", "routeone.net", "routeone"] },
  { name: "Dealertrack", patterns: ["dealertrack.com", "dealertrack"] },
  { name: "CreditIQ", patterns: ["creditiq.com", "creditiq", "credit-iq"] },
  { name: "Stripe", patterns: ["js.stripe.com", "api.stripe.com", "stripe.com", "stripe.network"] },
  { name: "PayPal", patterns: ["paypal.com", "paypalobjects.com"] },
  { name: "700Credit", patterns: ["700credit.com", "700credit"] },
  { name: "AppOne", patterns: ["appone.net", "appone.com"] },
  { name: "DealerCenter", patterns: ["dealercenter.net", "dealercenter.com"] },
  { name: "Affirm", patterns: ["affirm.com"] },
  { name: "Capital One Auto", patterns: ["capitalone.com"] },
  { name: "CUDL / Origence", patterns: ["cudl.com", "origence.com"] },
  { name: "Santander / Chrysler Capital", patterns: ["santanderconsumerusa.com", "chryslercapital.com"] },
  { name: "Westlake", patterns: ["westlakefinancial.com", "westlake"] },
  { name: "Credit Bureaus", patterns: ["transunion.com", "equifax.com", "experian.com"] },
  // Trade-in valuation providers (a trade-in page's "trusted provider" — Finance-form PII
  // security also applies to Trade-In per spec §2.4, and these are its equivalent of a lender).
  { name: "Kelley Blue Book", patterns: ["kbb.com", "kelleybluebook"] },
  { name: "Black Book", patterns: ["blackbook.com", "blackbookcdx"] },
  { name: "TradePending", patterns: ["tradepending.com", "tradepending"] },
  { name: "Edmunds", patterns: ["edmunds.com"] },
  { name: "AccuTrade", patterns: ["accu-trade.com", "accutrade"] },
  { name: "TrueCar / ALG", patterns: ["truecar.com"] },
];

function matchFinanceProvider(haystack) {
  if (!haystack) return null;
  const h = String(haystack).toLowerCase();
  for (const p of FINANCE_PROVIDERS) {
    if (p.patterns.some((s) => h.includes(s))) return p.name;
  }
  return null;
}

// Find the finance / credit-application OR trade-in page from the homepage links.
// Finance-form PII security applies to both Finance and Trade-In page types (spec §2.4).
async function discoverFinanceUrl(page) {
  try {
    return await page.evaluate(() => {
      const bad = (raw) => /^(mailto:|tel:|javascript:|#)/i.test(raw || "");
      const kw = /financ|credit[-_ ]?app|get[-_ ]?approved|pre[-_ ]?approv|apply.*financ|auto.*loan|value[-_ ]?your[-_ ]?trade|value[-_ ]?my[-_ ]?trade|trade[-_ ]?in|trade[-_ ]?appraisal/i;
      const links = Array.from(document.querySelectorAll("a[href]"))
        .map((a) => ({ href: a.href, raw: a.getAttribute("href") || "", text: (a.textContent || "").trim().toLowerCase() }))
        .filter((l) => l.href && !bad(l.raw));
      const byHref = links.find((l) => /financ|credit[-_ ]?app|pre[-_ ]?approv|get[-_ ]?approved|value[-_ ]?your[-_ ]?trade|trade[-_ ]?in|trade[-_ ]?appraisal/i.test(l.href));
      if (byHref) return byHref.href;
      const byText = links.find((l) => kw.test(l.text));
      return byText ? byText.href : null;
    });
  } catch {
    return null;
  }
}

async function checkFinanceFormSecurity(url, page, browser, pageType = null) {
  const meta = {
    checkedUrl: null,
    financePageFound: false,
    httpsSecure: false,
    sensitiveFields: [],
    sensitiveDataHandledSecurely: false,
    detectedProviders: [],
    secureEndpoint: false,
    securitySignals: [],
    rawScore: 0,
    maxScore: 10,
  };
  const POINTS = { https: 2, handling: 2, provider: 3, endpoint: 2, signals: 1 };
  
  if (pageType !== "finance" && pageType !== "trade") {
    return { score: null, status: "not_applicable", infoOnly: true, confidence: "heuristic", details: "Not applicable on this page type", meta, analysis: null };
  }

  meta.checkedUrl = page.url();

  try {
    const data = await page.evaluate(() => {
      const lower = (s) => (s || "").toLowerCase();
      const bodyText = lower(document.body ? document.body.innerText : "").slice(0, 8000);
      const title = lower(document.title);
      const hay = title + " " + bodyText;
      const financeKw = ["financ", "credit application", "credit app", "auto loan", "car loan", "pre-approval", "preapprov", "get approved", "down payment", "monthly payment", "apply for financ"];
      const tradeInKw = ["value your trade", "value my trade", "trade-in", "trade in value", "trade appraisal", "what's my car worth", "whats my car worth", "instant cash offer", "appraise my"];
      const isFinancePage = financeKw.some((k) => hay.includes(k));
      const isTradeInPage = tradeInKw.some((k) => hay.includes(k));
      const pageKind = isFinancePage ? "finance" : isTradeInPage ? "trade-in" : null;

      const sensSel = "input[name*='ssn' i], input[id*='ssn' i], input[name*='social' i], input[autocomplete*='cc-' i], input[name*='card' i], input[id*='card' i], input[name*='routing' i], input[name*='account' i], input[name*='bank' i]";
      const forms = Array.from(document.querySelectorAll("form")).map((f) => ({
        action: f.getAttribute("action") || "",
        sensitive: !!f.querySelector(sensSel),
      }));

      const fieldTokens = Array.from(document.querySelectorAll("input, select")).map((i) =>
        [i.name, i.id, i.getAttribute("autocomplete"), i.getAttribute("placeholder"), i.getAttribute("aria-label")].filter(Boolean).join(" ")
      );

      const providerHaystack = [
        ...Array.from(document.querySelectorAll("script[src]")).map((s) => s.getAttribute("src")),
        ...Array.from(document.querySelectorAll("iframe[src]")).map((f) => f.getAttribute("src")),
        ...Array.from(document.querySelectorAll("form[action]")).map((f) => f.getAttribute("action")),
        ...Array.from(document.querySelectorAll("a[href]")).map((a) => a.getAttribute("href")),
      ].filter(Boolean);

      const linkText = Array.from(document.querySelectorAll("a"))
        .map((a) => lower(a.textContent) + " " + lower(a.getAttribute("href") || "")).join(" ");
      const hasPrivacy = /privacy/.test(linkText);
      const hasTerms = /terms|conditions/.test(linkText);
      const secureMessaging = /secure|encrypt|256-bit|\bssl\b|your information is protected|safe and secure|secure application/.test(bodyText);

      return { protocol: location.protocol, isFinancePage, isTradeInPage, pageKind, forms, fieldTokens, providerHaystack, hasPrivacy, hasTerms, secureMessaging };
    });

    meta.financePageFound = true;
    meta.pageKind = data.pageKind || (pageType === "trade" ? "trade-in" : "finance");

    const isInsecure = (action) => {
      if (!action) return false; // empty/relative action on an HTTPS page is fine
      try { return new URL(action, meta.checkedUrl).protocol === "http:"; } catch { return false; }
    };

    // 1) HTTPS
    meta.httpsSecure = data.protocol === "https:";

    // 2) Sensitive data handling
    const SENS = ["ssn", "social security", "socialsecurity", "social-security", "credit card", "creditcard", "cc-number", "cardnumber", "card-number", "card number", "cvv", "cvc", "routing", "account number", "accountnumber", "bank account", "iban", "tax id", "taxid"];
    const sensTokens = (data.fieldTokens || []).map((t) => t.toLowerCase());
    meta.sensitiveFields = [...new Set(SENS.filter((s) => sensTokens.some((t) => t.includes(s))))];
    const anyInsecureSensitiveForm = (data.forms || []).some((f) => f.sensitive && isInsecure(f.action));
    const handlingEarned = meta.sensitiveFields.length === 0
      ? true // nothing sensitive collected client-side → PCI scope minimized / delegated
      : (meta.httpsSecure && !anyInsecureSensitiveForm);
    meta.sensitiveDataHandledSecurely = handlingEarned;

    // 3) Trusted finance provider
    const provSet = new Set();
    for (const h of (data.providerHaystack || [])) { const m = matchFinanceProvider(h); if (m) provSet.add(m); }
    meta.detectedProviders = [...provSet];

    // 4) Secure submission endpoint
    meta.secureEndpoint = !(data.forms || []).some((f) => isInsecure(f.action));

    // 5) Security signals
    const signals = [];
    if (data.hasPrivacy) signals.push("Privacy Policy");
    if (data.hasTerms) signals.push("Terms");
    if (data.secureMessaging) signals.push("Secure/SSL messaging");
    meta.securitySignals = signals;
    const signalsEarned = signals.length >= 2;

    let rawScore = 0;
    if (meta.httpsSecure) rawScore += POINTS.https;
    if (handlingEarned) rawScore += POINTS.handling;
    if (meta.detectedProviders.length > 0) rawScore += POINTS.provider;
    if (meta.secureEndpoint) rawScore += POINTS.endpoint;
    if (signalsEarned) rawScore += POINTS.signals;
    if (rawScore > 10) rawScore = 10;
    meta.rawScore = rawScore;
    meta.missingPoints = meta.maxScore - rawScore;

    const kindLabel = meta.pageKind === "trade-in" ? "trade-in" : "finance / credit-application";
    meta.breakdown = [
      {
        label: "Page served over HTTPS",
        points: POINTS.https,
        earned: meta.httpsSecure,
        detail: meta.httpsSecure ? `The ${kindLabel} page loads over HTTPS.` : `Serve the ${kindLabel} page over HTTPS with a valid SSL certificate.`,
      },
      {
        label: "Sensitive data handled securely",
        points: POINTS.handling,
        earned: handlingEarned,
        detail: handlingEarned
          ? (meta.sensitiveFields.length ? `Sensitive fields (${meta.sensitiveFields.join(", ")}) are collected over HTTPS.` : "No raw SSN / card / bank fields are collected on-page (PCI scope minimized).")
          : `Sensitive fields (${meta.sensitiveFields.join(", ")}) are collected over an insecure connection. Collect them only over HTTPS, or hand off to a PCI-compliant provider.`,
      },
      {
        label: "Trusted finance / valuation provider",
        points: POINTS.provider,
        earned: meta.detectedProviders.length > 0,
        detail: meta.detectedProviders.length
          ? `Detected: ${meta.detectedProviders.join(", ")}`
          : (meta.pageKind === "trade-in"
              ? "No trusted valuation provider detected. Power trade-in values through a reputable provider (Kelley Blue Book, Black Book, TradePending, AccuTrade)."
              : "No trusted finance / lending provider detected. Process credit applications through a PCI-compliant provider (RouteOne, Dealertrack, CreditIQ, Stripe, PayPal)."),
      },
      {
        label: "Secure submission endpoint",
        points: POINTS.endpoint,
        earned: meta.secureEndpoint,
        detail: meta.secureEndpoint ? `All forms submit over HTTPS.` : `Configure forms to submit only over HTTPS secure endpoints.`,
      },
      {
        label: "Trust signals / disclaimers visible",
        points: POINTS.signals,
        earned: signalsEarned,
        detail: signalsEarned ? `Visible signals: ${signals.join(", ")}` : `Include a privacy link, terms link, or secure message near the inputs.`,
      }
    ];

    const score = Math.round((rawScore / meta.maxScore) * 100);
    const status = score >= 80 ? "pass" : score >= 40 ? "warning" : "fail";
    
    let analysis = null;
    if (status !== "pass") {
      analysis = {
        cause: meta.httpsSecure ? "Some security details on the finance form (endpoints, trust signals, or third-party validation) are missing or insecure." : "The finance form is missing security elements.",
        recommendation: "Ensure all finance/credit-app forms are served and submitted exclusively over HTTPS, display clear privacy policies and credentials, and power values via a trusted integration."
      };
    }
    
    return { score, status, confidence: "heuristic", details: `Finance form security audit: ${score}/100`, meta, analysis };
  } catch (error) {
    return { score: 100, status: "not_applicable", infoOnly: true, confidence: "heuristic", details: `Form security audit skipped: ${error.message}`, meta, analysis: null };
  }
}

// ---------------------------------------------------------------------------
// Reputation (composite gate) — spec §4.4 collapses Safe Browsing / Blacklist /
// Malware into ONE weighted signal; the individual sources stay as evidence in meta.
// ---------------------------------------------------------------------------
async function checkReputation(domain, url) {
  const [safeBrowsing, virusTotal] = await Promise.all([
    checkGoogleSafeBrowsing(url),
    checkVirusTotal(domain),
  ]);

  const sbSkipped = /key missing/i.test(safeBrowsing?.details || "");
  const vtSkipped = /key missing/i.test(virusTotal?.details || "");
  const sbFlagged = safeBrowsing?.status === "fail";
  const vtFlagged = virusTotal?.status === "fail";
  const anyError = safeBrowsing?.status === "error" || virusTotal?.status === "error";
  const flagged = sbFlagged || vtFlagged;

  // Neither reputation API configured → cannot assess → info-only (renormalized out).
  if (sbSkipped && vtSkipped) {
    return {
      score: 100, status: "not_applicable", infoOnly: true, confidence: "field",
      details: "Reputation APIs not configured (Safe Browsing / VirusTotal keys missing)",
      meta: { googleSafeBrowsing: safeBrowsing, virusTotal, flagged: null },
      analysis: null
    };
  }

  if (flagged) {
    const who = [sbFlagged ? "Google Safe Browsing" : null, vtFlagged ? "VirusTotal" : null].filter(Boolean).join(" + ");
    return {
      score: 0, status: "fail", confidence: "field", gateFlag: true,
      details: `Domain/URL flagged by ${who}`,
      meta: { googleSafeBrowsing: safeBrowsing, virusTotal, flagged: true },
      analysis: {
        cause: "The domain or URL is listed as unsafe (malware / phishing / unwanted software) by a reputation service.",
        recommendation: "Investigate and clean the site, then request a review via Google Search Console Security Issues and VirusTotal."
      }
    };
  }

  return {
    score: 100, status: "pass", confidence: "field",
    details: anyError ? "No active reputation flags (some sources unavailable)" : "Not flagged by Safe Browsing or VirusTotal",
    meta: { googleSafeBrowsing: safeBrowsing, virusTotal, flagged: false },
    analysis: null
  };
}

// ---------------------------------------------------------------------------
// Cookie flags — Secure / HttpOnly / SameSite, scored as one parameter (spec §4.3).
// ---------------------------------------------------------------------------
async function checkCookieFlags(page) {
  const cookies = await page.context().cookies();
  if (!cookies.length) {
    return { score: 100, status: "pass", confidence: "measured", details: "No cookies set", meta: { cookies: [], total: 0 }, analysis: null };
  }
  const total = cookies.length;
  const insecure = cookies.filter(c => !c.secure).map(c => c.name);
  const scriptAccessible = cookies.filter(c => !c.httpOnly).map(c => c.name);
  // Puppeteer sameSite: 'Strict' | 'Lax' | 'None' | undefined. Missing or bare 'None' is weak.
  const noSameSite = cookies.filter(c => !c.sameSite || c.sameSite === "None").map(c => c.name);

  const secureRatio = (total - insecure.length) / total;
  const httpOnlyRatio = (total - scriptAccessible.length) / total;
  const sameSiteRatio = (total - noSameSite.length) / total;
  // Secure & HttpOnly are the protective flags; SameSite (CSRF) weighted lighter.
  const score = Math.round((secureRatio * 0.4 + httpOnlyRatio * 0.4 + sameSiteRatio * 0.2) * 100);
  const status = score >= 80 ? "pass" : score >= 50 ? "warning" : "fail";

  const problems = [];
  if (insecure.length) problems.push(`${insecure.length} missing Secure`);
  if (scriptAccessible.length) problems.push(`${scriptAccessible.length} missing HttpOnly`);
  if (noSameSite.length) problems.push(`${noSameSite.length} missing SameSite`);

  return {
    score, status, confidence: "measured",
    details: problems.length ? `Cookie flag gaps: ${problems.join(", ")} (of ${total})` : `All ${total} cookies set Secure, HttpOnly, and SameSite`,
    meta: { cookies, total, insecureCookies: insecure, scriptAccessibleCookies: scriptAccessible, noSameSiteCookies: noSameSite, secureRatio, httpOnlyRatio, sameSiteRatio },
    analysis: status === "pass" ? null : {
      cause: "Some cookies are missing protective flags (Secure prevents transmission over HTTP; HttpOnly blocks script/XSS theft; SameSite mitigates CSRF).",
      recommendation: "Set Secure, HttpOnly, and SameSite=Lax/Strict on every cookie that does not require third-party cross-site access."
    }
  };
}

// ---------------------------------------------------------------------------
// Privacy compliance — GDPR/CCPA rights notice + data-collection disclosure, as one param.
// ---------------------------------------------------------------------------
/**
 * Read the privacy policy itself and grade it against the market's prescribed
 * content list.
 *
 * Runs on an ISOLATED tab so it cannot destroy the execution context the other
 * pillars are reading concurrently (same rule as checkXSS / checkWeakDefault-
 * Credentials). Fails open: an unreachable policy returns null and the caller
 * treats it as "not measured", never as a failure.
 */
async function fetchPrivacyPolicyContent(page, browser, market) {
  if (!browser) return null;
  const locale = getLocale(market);

  const href = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll("a"));
    const hit = links.find((a) => {
      const h = (a.href || "").toLowerCase();
      const t = (a.innerText || "").toLowerCase();
      return /privacy/.test(h) || /privacy/.test(t);
    });
    return hit ? hit.href : null;
  }).catch(() => null);
  if (!href || !/^https?:/i.test(href)) return null;

  let tab = null;
  try {
    tab = await browser.newPage();
    await tab.goto(href, { waitUntil: "domcontentloaded", timeout: 12000 });
    const text = await tab.evaluate(() => (document.body?.innerText || "").slice(0, 60000));
    const coverage = matchGroups(text, locale.privacy.policyContent);
    return { url: href, ...coverage };
  } catch (_) {
    return null;
  } finally {
    if (tab) { try { await tab.close(); } catch {} }
  }
}

async function checkPrivacyCompliance(page, browser = null, market = null) {
  const locale = getLocale(market);
  const rights = await checkPrivacyRightsNotice(page, market);
  const dataCollection = await checkDataCollection(page);
  const rightsPass = rights?.status === "pass";
  const dcPass = dataCollection?.status === "pass";

  // Base verdict — the original two-signal model, with only the regime NAME
  // localised. Keeping this intact is deliberate: it is what US scores are
  // calibrated against, and the market-specific work below is additive.
  let score, status, analysis = null;
  if (rightsPass && dcPass) { score = 100; status = "pass"; }
  else if (rightsPass || dcPass) {
    score = 70; status = "warning";
    analysis = {
      cause: rightsPass
        ? `A ${locale.privacy.regime} rights notice was found, but no explicit data-collection disclosure.`
        : `A data-collection disclosure was found, but no ${locale.privacy.regime} rights notice.`,
      recommendation: `Provide both a ${locale.privacy.regime} rights notice and a clear data-collection disclosure.`
    };
  } else {
    score = 0; status = "fail";
    analysis = {
      cause: `No ${locale.privacy.regime} rights notice or data-collection disclosure was found.`,
      recommendation: `Add explicit privacy-rights language for ${locale.name} and a data-collection disclosure, typically in the privacy policy and footer.`
    };
  }

  // Market-specific content requirement. Only markets that actually impose one
  // reach this, so a US audit is unaffected by construction — see
  // config/locale/us.js, where overseasDisclosureRequired is false.
  const policy = await fetchPrivacyPolicyContent(page, browser, market);
  let overseas = null;
  if (locale.privacy.overseasDisclosureRequired && policy) {
    const disclosed = policy.found.some((label) => /overseas/i.test(label));
    overseas = { required: true, disclosed, policyUrl: policy.url };
    if (!disclosed) {
      // A real, checkable gap rather than a stylistic one — and one that pairs
      // with the US-hosted CRM, chat and analytics vendors the Conversion and
      // Cookie checks detect on the very same page.
      score = Math.min(score, 70);
      status = score >= 80 ? "pass" : "warning";
      analysis = {
        cause: `The privacy policy does not name the countries personal information is disclosed to. ${locale.privacy.overseasDisclosureBasis}`,
        recommendation: "List the countries personal information is sent to. Most dealer sites disclose overseas without realising it, through a US-hosted CRM, chat widget or analytics tag — the third-party checks in this section show which ones were found here.",
      };
    }
  }

  return {
    score, status, confidence: "heuristic",
    details: status === "pass"
      ? `${locale.privacy.regime} notice and data-collection disclosure present`
      : status === "warning" ? "Partial privacy disclosure"
        : `No ${locale.privacy.regime} notice or data-collection disclosure found`,
    meta: {
      market: locale.code,
      regime: locale.privacy.regime,
      regulator: locale.privacy.regulator,
      rights: rights?.meta || null,
      dataCollection: dataCollection?.meta || null,
      rightsPass, dcPass,
      foundKeyword: rights?.meta?.foundKeyword || null,
      foundSelector: rights?.meta?.foundSelector || null,
      policyCoverage: policy ? { url: policy.url, found: policy.found, missing: policy.missing } : null,
      overseasDisclosure: overseas,
    },
    analysis
  };
}

// ---------------------------------------------------------------------------
// Legal / financial disclaimers (Reg-Z / Reg-M / FTC) — page-specific
// (Finance / Offers / Lease / VDP). On a single-URL audit: score the audited page if it
// is one of those types, else discover such a page from links and score the first that loads.
// N/A (renormalized out) when no such page exists.
// ---------------------------------------------------------------------------
// Offer-expiry wording is the one group that genuinely does not differ: both
// markets require an advertised offer to state when it ends and on what terms.
const EXPIRY_TERMS = [
  "offer ends", "offer expires", "valid through", "valid until",
  "must take delivery", "while supplies last", "ends on", "by the end of",
];

// Generic "see the fine print" escapes. Kept out of the AU price group on
// purpose: under ACL s48 a total price must actually be SHOWN, and "see dealer
// for details" is not a substitute for showing it.
const US_PRICE_ESCAPES = [
  "does not include", "see dealer for details", "see dealer for complete details",
  "dealer for details", "prior sale", "additional fees", "fees not included",
];

/**
 * Build the disclaimer groups this market actually requires.
 *
 * This is the one place where the two markets need genuinely different
 * detection rather than a swapped word list — the reference calls it out as
 * such. Reg-Z's trigger model ("stating a payment forces the APR") and ACL
 * s48's prominence model ("the GST-inclusive total must be at least as
 * prominent as any component") are different obligations, so each market
 * contributes its own groups from its own locale pack.
 */
function disclaimerGroupsFor(locale) {
  const groups = {};

  if (locale.finance.rateDisclosure) {
    const rd = locale.finance.rateDisclosure;
    groups.finance = { label: rd.label, terms: [...rd.requiredTerms, ...rd.supportingTerms], basis: rd.basis };
  }
  if (locale.finance.leaseDisclosure) {
    const ld = locale.finance.leaseDisclosure;
    groups.lease = { label: ld.label, terms: ld.requiredTerms, basis: ld.basis };
  }
  if (locale.finance.licenceDisclosure) {
    const cd = locale.finance.licenceDisclosure;
    groups.licence = { label: cd.label, terms: cd.terms, basis: cd.basis, pattern: cd.pattern };
  }

  groups.price = {
    label: locale.pricing.totalPriceRequired ? "Total (drive-away) price" : "Price disclaimer (FTC)",
    // Where a total price is legally required, only wording that actually
    // states a total counts. Where it is not, fee disclosure plus the usual
    // escapes is the market's standard.
    terms: locale.pricing.totalPriceRequired
      ? [...locale.pricing.totalPriceTerms, ...locale.pricing.feeDisclosureTerms]
      : [...locale.pricing.feeDisclosureTerms, ...US_PRICE_ESCAPES],
    basis: locale.pricing.basis,
  };

  groups.expiry = { label: "Offer expiry", terms: EXPIRY_TERMS, basis: null };
  return groups;
}

/** Which groups each page type must carry, per market. */
function requiredGroupsFor(locale, pageType) {
  if (locale.code === "AU") {
    // No Reg-M analogue exists, so a lease page is graded on price and finance
    // like any other credit-advertising page rather than on a lease-specific
    // vocabulary it has no obligation to use.
    return {
      finance: ["finance", "price", "licence"],
      specials: ["price", "expiry"],
      lease: ["finance", "price"],
      vdp: ["price"],
    }[pageType] || ["price"];
  }
  return {
    finance: ["finance", "price"],
    specials: ["price", "expiry"],
    lease: ["lease", "price"],
    vdp: ["price"],
  }[pageType] || ["price"];
}

function classifyDisclaimerPageType(urlPath, hay) {
  const p = (urlPath || "").toLowerCase();
  const h = hay || "";
  if (/lease/.test(p) || /due at signing|money factor|capitalized cost/.test(h)) return "lease";
  if (/financ|credit[-_]?app|pre[-_]?approv/.test(p) || /credit application|apr financing|auto loan|estimate your payment/.test(h)) return "finance";
  if (/special|offer|incentive|rebate|deal/.test(p)) return "offers";
  if (/\/(vehicle|inventory|vdp|used|new)\//.test(p) || /\bvin:?\b|stock\s*#|\bmsrp\b/.test(h)) return "vdp";
  return null;
}

async function scanDisclaimerText(scanPage) {
  return await scanPage.evaluate(() => {
    const title = (document.title || "").toLowerCase();
    const body = (document.body ? document.body.innerText : "").toLowerCase();
    // Disclaimer copy usually lives in fine print / footnotes / footer.
    const fineSel = "small, sup, .disclaimer, .disclaimers, .legal, .fine-print, [class*='disclaimer' i], [class*='legal' i], [id*='disclaimer' i], footer";
    const fineText = Array.from(document.querySelectorAll(fineSel)).map(el => (el.innerText || "")).join(" \n ").toLowerCase();
    return { bodyText: (title + " " + body).slice(0, 20000), fineText: fineText.slice(0, 20000) };
  });
}

async function checkLegalDisclaimers(url, page, browser, pageType = null, market = null) {
  const locale = getLocale(market);
  const meta = { checkedUrl: null, pageType: null, market: locale.code, groupsFound: [], groupsRequired: [], details: {}, basis: {} };

  if (pageType !== "finance" && pageType !== "specials" && pageType !== "lease" && pageType !== "vdp") {
    return { score: 100, status: "not_applicable", infoOnly: true, confidence: "heuristic", details: "No finance / offers / lease / VDP page found to assess legal disclaimers", meta, analysis: null };
  }

  meta.pageType = pageType;
  meta.checkedUrl = page.url();

  try {
    const GROUPS = disclaimerGroupsFor(locale);
    const scan = await scanDisclaimerText(page);
    const haystack = scan.bodyText + " \n " + scan.fineText;

    // A group with a `pattern` (the Australian Credit Licence number) has to
    // match the actual identifier, not merely the phrase — "we are a credit
    // licensee" without a number is exactly the case the check exists to catch.
    const groupHit = (g) => {
      const grp = GROUPS[g];
      if (!grp) return false;
      if (grp.pattern && grp.pattern.test(haystack)) return true;
      return grp.terms.some((t) => haystack.includes(t));
    };

    const required = requiredGroupsFor(locale, pageType).filter((g) => GROUPS[g]);
    meta.groupsRequired = required.map((g) => GROUPS[g].label);

    const allGroups = Object.keys(GROUPS);
    const found = allGroups.filter(groupHit);
    meta.groupsFound = found.map((g) => GROUPS[g].label);
    allGroups.forEach((g) => { meta.details[GROUPS[g].label] = groupHit(g); });
    required.forEach((g) => { if (GROUPS[g].basis) meta.basis[GROUPS[g].label] = GROUPS[g].basis; });

    // Where the market requires a prominent total price, a page that shows ONLY
    // a component ("+ on-road costs") without one is a specific, nameable
    // defect rather than a generic missing-disclaimer. Recorded as evidence so
    // the finding can quote the page back to the customer.
    if (locale.pricing.totalPriceRequired) {
      const componentOnly = matchedTerms(haystack, locale.pricing.componentOnlyTerms || []);
      const totalShown = anyTerm(haystack, locale.pricing.totalPriceTerms || []);
      meta.totalPrice = { totalShown, componentOnlyTerms: componentOnly, basis: locale.pricing.basis };
    }

    const requiredFound = required.filter(groupHit).length;
    const score = required.length ? Math.round((requiredFound / required.length) * 100) : 100;
    const status = score >= 80 ? "pass" : score >= 40 ? "warning" : "fail";

    let analysis = null;
    if (status !== "pass") {
      const missing = required.filter((g) => !groupHit(g)).map((g) => GROUPS[g].label);
      const bases = required.filter((g) => !groupHit(g)).map((g) => GROUPS[g].basis).filter(Boolean);
      analysis = {
        cause: `Required disclosures (${missing.join(", ")}) were not found on this ${pageType} page.${bases.length ? " " + bases[0] : ""}`,
        recommendation: `Add ${missing.join(", ")} in clear, legible print on the page, typically beside the price or the repayment calculator. Have the wording confirmed by someone who knows motor-dealer advertising rules in ${locale.name}.`
      };
    }

    return {
      score,
      status,
      confidence: "heuristic",
      details: `Regulated disclosures present: ${requiredFound}/${required.length} required groups found (${locale.name} rules)`,
      meta,
      analysis,
    };
  } catch (error) {
    return { score: 100, status: "not_applicable", infoOnly: true, confidence: "heuristic", details: `Legal disclaimers check skipped: ${error.message}`, meta, analysis: null };
  }
}

export default async function securityCompliance(url, page, response, browser, pageType = null, siteSubType = null, market = null) {

  const domain = Domain(url);
  const resolvedPageType = pageType || classifyPageType(url);

  // ── Header checks: pure `response` reads, no I/O ──
  const hstsResult = checkHSTS(response);
  const xFrameOptionsResult = checkXFrameOptions(response);
  const cspResult = checkCSP(response);
  const xContentTypeOptionsResult = checkXContentTypeOptions(response);
  const referrerPolicyResult = checkReferrerPolicy(response);
  const permissionsPolicyResult = checkPermissionsPolicy(response);

  // ── Wave 1: every independent check, concurrently ──
  // [PERF] These ran as ~20 sequential awaits, so the pillar's wall-clock was the
  // SUM of every network round trip (reputation APIs, admin-path probing, cert
  // lookups) and every own-tab probe. They are mutually independent: none of them
  // navigates, clicks or otherwise mutates the shared `page` (verified — the
  // probes that DO navigate, checkXSS / checkWeakDefaultCredentials /
  // checkFinanceFormSecurity / checkLegalDisclaimers, each open their own tab),
  // and concurrent reads on one Playwright page are multiplexed over CDP. So the
  // pillar now costs its SLOWEST check instead of their sum.
  //
  // No timeout is imposed here — every check runs to completion, exactly as before.
  // Promise.all propagates a rejection just like the sequential version did.
  const [
    httpsResult,
    sslResult,
    sslExpiryResult,
    tlsVersionResult,
    cookieFlagsResult,
    reputationResult,
    sqliExposureResult,
    xssVulnerabilityResult,
    formsUseHTTPSResult,
    weakDefaultCredsResult,
    adminPanelPublicResult,
    cookieConsentResult,
    privacyPolicyResult,
    privacyComplianceResult,
    financeFormSecurityResult,
    legalDisclaimersResult,
  ] = await Promise.all([
    // Transport
    checkHTTPS(url, page),
    checkSSLConnection(response),
    checkSSLExpiry(response),
    checkTLSVersion(response),
    // Cookies
    checkCookieFlags(page),
    // Reputation — composite gate (Safe Browsing + VirusTotal folded into one; spec §4.4)
    checkReputation(domain, url),
    // App-exposure (heuristic surface indicators)
    checkSQLiExposure(url),
    checkXSS(url, browser),
    checkFormsUseHTTPS(page),
    checkWeakDefaultCredentials(page, browser),
    checkAdminPanelPublic(url),
    // Privacy / legal
    checkCookieConsent(page, market),
    checkPrivacyPolicy(page),
    checkPrivacyCompliance(page, browser, market),
    // Page-specific
    checkFinanceFormSecurity(url, page, browser, resolvedPageType),
    checkLegalDisclaimers(url, page, browser, resolvedPageType, market),
  ]);

  // ── Wave 2: the one genuine data dependency ──
  // Third-party cookies are scored in the context of the consent banner and the
  // privacy policy, so this must observe both results.
  const thirdPartyCookiesResult = await checkThirdPartyCookies(url, page, cookieConsentResult, privacyPolicyResult);

  // NOTE: GA4 / GTM / Conversion Tracking and CRM lead-transfer are NOT part of the
  // Security section (spec §2.4 relocates them to Conversion Flow). They are no longer
  // computed or surfaced here. CRM detection (checkCRMIntegration + CRM_SIGNATURES) still
  // lives in this file pending relocation to the Conversion & Lead Flow module (§2.6).

  // ── Spec §2.4 weighting. Fractional spec weights ×100, renormalized over the
  // applicable set (N/A params dropped, not zeroed — rule 6). Confidence per param:
  // field = reputation API, measured = transport/header/cert, heuristic = DOM/behavioural.
  const weighted = [
    // Transport
    { key: "HTTPS", metric: httpsResult, weight: 13, confidence: "measured", gate: "https" },
    { key: "SSL", metric: sslResult, weight: 7, confidence: "measured" },
    { key: "SSL_Expiry", metric: sslExpiryResult, weight: 4, confidence: "measured" },
    { key: "TLS_Version", metric: tlsVersionResult, weight: 5, confidence: "measured" },
    { key: "HSTS", metric: hstsResult, weight: 5, confidence: "measured" },
    // Headers
    { key: "CSP", metric: cspResult, weight: 9, confidence: "measured" },
    { key: "X_Frame_Options", metric: xFrameOptionsResult, weight: 4, confidence: "measured" },
    { key: "X_Content_Type_Options", metric: xContentTypeOptionsResult, weight: 3, confidence: "measured" },
    { key: "Referrer_Policy", metric: referrerPolicyResult, weight: 2, confidence: "measured" },
    { key: "Permissions_Policy", metric: permissionsPolicyResult, weight: 2, confidence: "measured" },
    // Cookies
    { key: "Cookie_Flags", metric: cookieFlagsResult, weight: 5, confidence: "measured" },
    { key: "Third_Party_Cookies", metric: thirdPartyCookiesResult, weight: 2, confidence: "measured" },
    // Reputation (gate)
    { key: "Reputation", metric: reputationResult, weight: 9, confidence: "field", gate: "reputation" },
    // App-exposure (heuristic surface indicators)
    { key: "SQLi_Exposure", metric: sqliExposureResult, weight: 4, confidence: "heuristic" },
    { key: "XSS", metric: xssVulnerabilityResult, weight: 4, confidence: "heuristic" },
    { key: "Forms_Use_HTTPS", metric: formsUseHTTPSResult, weight: 4, confidence: "heuristic" },
    // Admin exposure / weak creds — spec groups these as one High (≈0.04); split across the two.
    // MFA_Enabled was removed as a parameter: enforcement cannot be proven black-box
    // without credentials, so the check could only ever report whether a login form
    // looked single-factor — too weak a signal to score a dealer on.
    { key: "Weak_Default_Credentials", metric: weakDefaultCredsResult, weight: 2, confidence: "heuristic" },
    { key: "Admin_Panel_Public", metric: adminPanelPublicResult, weight: 1, confidence: "heuristic" },
    // Privacy / legal
    { key: "Cookie_Consent", metric: cookieConsentResult, weight: 3, confidence: "heuristic" },
    { key: "Privacy_Policy", metric: privacyPolicyResult, weight: 3, confidence: "heuristic" },
    { key: "Privacy_Compliance", metric: privacyComplianceResult, weight: 4, confidence: "heuristic" },
    // Page-specific (renormalized out when no such page exists)
    // Finance-form PII security is about SSN/income fields on a credit
    // application. Neither a service centre nor a repair garage collects that
    // class of data, so on those site types it is N/A rather than failed —
    // which matters because a garage's /finance-options page (payment plans for
    // a big repair bill) classifies as `finance` by URL and would otherwise be
    // graded against a dealer's GLBA Safeguards obligations.
    { key: "Finance_Form_Security", metric: isParamApplicable("Finance_Form_Security", siteSubType) ? financeFormSecurityResult : null, weight: 10, confidence: "heuristic" },
    { key: "Legal_Disclaimers", metric: legalDisclaimersResult, weight: 8, confidence: "heuristic" },
  ];

  // Per-site-type redistribution, RESCALED to leave the deduction scale intact.
  //
  // Unlike every other section, this one is not a Σ(score×w)/Σ(w) average — the
  // headline is an absolute deduction from 100 (see below), so it depends on the
  // weights summing to roughly 100 points of deductible control. Multiplying the
  // matrix's per-parameter tilt straight in would shrink that total on a repair
  // site (most of its controls drop to Recommended), and a garage failing every
  // single control would then still score in the 40s.
  //
  // Rescaling to the original sum keeps the tilt — CSP and the SQLi/XSS surface
  // deduct less on a garage, HTTPS and reputation deduct more — while a total
  // failure still lands at zero for every site type. How much Security is worth
  // relative to the OTHER seven sections is a separate axis, handled by the
  // section profile in config/siteTypeProfiles.js.
  const tilted = weighted.map((w) => ({ ...w, weight: w.weight * importance(w.key, siteSubType) }));
  const originalSum = weighted.reduce((s, w) => s + w.weight, 0);
  const tiltedSum = tilted.reduce((s, w) => s + w.weight, 0);
  const rescale = tiltedSum > 0 ? originalSum / tiltedSum : 1;
  for (const w of tilted) w.weight *= rescale;

  const CONF_RANK = { heuristic: 1, estimate: 1, lab: 2, measured: 2, field: 3 };
  let totalWeight = 0, earned = 0;
  let noHttps = false, reputationFlagged = false;
  let lowestConf = "field";
  let deducted = 0;
  const deductionLog = [];
  for (const w of tilted) {
    const m = w.metric;
    // N/A / info-only params drop out of the denominator (rule 6). In the
    // deduction model an N/A check simply cannot deduct.
    if (!m || m.infoOnly || m.status === "not_applicable" || typeof m.score !== "number") continue;
    m.confidence = m.confidence || w.confidence; // stamp for the UI
    totalWeight += w.weight;
    earned += (m.score / 100) * w.weight;
    // Deduction model (SCORING_FORMAT.md §8.4): each control deducts its spec
    // weight in points, scaled by how badly it fails. A control that passes
    // deducts nothing; a total failure deducts its full weight.
    const d = w.weight * (1 - m.score / 100);
    if (d > 0) {
      deducted += d;
      if (deductionLog.length < 25) deductionLog.push({ control: w.key, score: m.score, deduction: parseFloat(d.toFixed(1)) });
    }
    if (CONF_RANK[m.confidence] < CONF_RANK[lowestConf]) lowestConf = m.confidence;
    if (w.gate === "https" && m.score === 0) noHttps = true;
    if (w.gate === "reputation" && m.status === "fail") reputationFlagged = true;
  }

  // Headline: deduction from 100 in absolute spec points (NOT renormalized to
  // the applicable weight — a site failing more controls falls further).
  let pct = Math.max(0, Math.round(100 - deducted));
  // Diagnostic: the old renormalized weighted average, kept for continuity.
  let graded = totalWeight > 0 ? parseFloat(((earned / totalWeight) * 100).toFixed(0)) : 0;
  // Gates (spec §2.4 / §5.3): transport + reputation dominate the section.
  if (noHttps) { pct = Math.min(pct, 30); graded = Math.min(graded, 30); }
  if (reputationFlagged) { pct = Math.min(pct, 25); graded = Math.min(graded, 25); }

  // ── Header Security sub-grade — the externally comparable number
  // (SecurityHeaders.com / Mozilla HTTP Observatory style): baseline 100,
  // deduct per failed transport/header/cookie test, map to Observatory's
  // published letter table. Info-only: it re-reads controls already weighted
  // above, so it carries no weight itself.
  const headerDeductions = [];
  const hd = (label, points) => { headerDeductions.push({ test: label, deduction: points }); return points; };
  let headerScore = 100;
  if (cspResult.score === 0) headerScore -= hd("CSP missing", 25);
  else if (cspResult.meta?.reportOnly) headerScore -= hd("CSP report-only (not enforced)", 20);
  else if (cspResult.score < 80) headerScore -= hd("CSP present but weak (unsafe directives)", 10);
  if (hstsResult.score === 0) headerScore -= hd("HSTS missing", 20);
  if (xFrameOptionsResult.score === 0 && !(cspResult.meta?.directives || []).includes("frame-ancestors")) headerScore -= hd("X-Frame-Options missing (no frame-ancestors fallback)", 20);
  if (xContentTypeOptionsResult.score === 0) headerScore -= hd("X-Content-Type-Options missing", 5);
  if (referrerPolicyResult.score === 0) headerScore -= hd("Referrer-Policy missing", 5);
  else if (referrerPolicyResult.score < 100) headerScore -= hd("Referrer-Policy permissive/unsafe", 10);
  if (permissionsPolicyResult.score === 0) headerScore -= hd("Permissions-Policy missing", 5);
  if (typeof cookieFlagsResult?.score === "number" && cookieFlagsResult.score < 100 && cookieFlagsResult.status !== "not_applicable") headerScore -= hd("Cookies missing Secure/HttpOnly/SameSite flags", 10);
  if (httpsResult.score === 0) headerScore -= hd("Site not served over HTTPS", 20);
  headerScore = Math.max(0, headerScore);
  const GRADE_TABLE = [[100, "A+"], [90, "A"], [85, "A-"], [80, "B+"], [70, "B"], [65, "B-"], [60, "C+"], [50, "C"], [45, "C-"], [40, "D+"], [30, "D"], [25, "D-"], [0, "F"]];
  const headerGrade = GRADE_TABLE.find(([min]) => headerScore >= min)[1];
  const headerSecurityResult = {
    score: headerScore,
    status: headerScore >= 80 ? "pass" : headerScore >= 50 ? "warning" : "fail",
    infoOnly: true,
    confidence: "measured",
    details: headerDeductions.length
      ? `Header security grade ${headerGrade} (${headerScore}/100): ${headerDeductions.map(d => d.test).join("; ")}.`
      : `Header security grade ${headerGrade} (${headerScore}/100) — all graded transport/header tests pass.`,
    meta: {
      informational: true,
      grade: headerGrade,
      baseline: 100,
      deductions: headerDeductions,
      note: "Observatory-style deduction sub-grade over the tests external checkers (SecurityHeaders.com, Mozilla HTTP Observatory) also run. Compare THIS grade — not the section headline — against those tools. Bonuses (scores above 100) are not modeled, so A+ requires a perfect base score.",
    },
    analysis: headerDeductions.length ? {
      cause: "One or more transport/header hardening tests that external security checkers grade on are failing.",
      recommendation: "Fix in order of deduction size: enforce CSP, HSTS, anti-framing (XFO or frame-ancestors), then Referrer-Policy, Permissions-Policy, X-Content-Type-Options and cookie flags.",
    } : null,
  };

  // Wording pass ONLY — humanizeSecuritySection rewrites details/cause/
  // recommendation into language a dealer can act on, and keeps the original
  // engineer-facing strings alongside as technicalCause/technicalRecommendation.
  // Scores, statuses, weights and meta are untouched (see securityCopy.js).
  return humanizeSecuritySection({
    Percentage: pct,
    Graded_Percentage: graded,
    Score_Breakdown: {
      model: "deduction from 100 in spec points (SCORING_FORMAT.md §8.4); gates preserved",
      base: 100,
      totalDeduction: parseFloat(deducted.toFixed(1)),
      gates: { noHttpsCap30: noHttps, reputationCap25: reputationFlagged },
      items: deductionLog,
    },
    Header_Security: headerSecurityResult,
    Confidence: lowestConf,
    Coverage: "Transport, headers, cookies, reputation, app-exposure and privacy/legal. Injection and credential checks are non-invasive surface indicators, not proof of vulnerability.",
    Note: "Reputation requires API keys (Safe Browsing / VirusTotal); transport, header and certificate checks are measured; injection, admin and privacy checks are heuristic. Page-specific finance/disclaimer checks are renormalized out when no such page exists.",
    // Transport
    HTTPS: httpsResult,
    SSL: sslResult,
    SSL_Expiry: sslExpiryResult,
    TLS_Version: tlsVersionResult,
    HSTS: hstsResult,
    // Headers
    CSP: cspResult,
    X_Frame_Options: xFrameOptionsResult,
    X_Content_Type_Options: xContentTypeOptionsResult,
    Referrer_Policy: referrerPolicyResult,
    Permissions_Policy: permissionsPolicyResult,
    // Cookies
    Cookie_Flags: cookieFlagsResult,
    Third_Party_Cookies: thirdPartyCookiesResult,
    // Reputation (composite gate; Safe Browsing + VirusTotal in meta)
    Reputation: reputationResult,
    // App-exposure
    SQLi_Exposure: sqliExposureResult,
    XSS: xssVulnerabilityResult,
    Forms_Use_HTTPS: formsUseHTTPSResult,
    Weak_Default_Credentials: weakDefaultCredsResult,
    Admin_Panel_Public: adminPanelPublicResult,
    // Privacy / legal
    Cookie_Consent: cookieConsentResult,
    Privacy_Policy: privacyPolicyResult,
    Privacy_Compliance: privacyComplianceResult,
    // Page-specific
    Finance_Form_Security: financeFormSecurityResult,
    Legal_Disclaimers: legalDisclaimersResult,
  });
}
