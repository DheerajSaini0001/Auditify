// securityCompliance.js
import dotenv from "dotenv";
import fetch from "node-fetch";
import { URL } from "url";
import { waitForChallengeResolution } from "../utils/puppeteer_cheerio.js";
import configService from "../services/configService.js";

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
  const { timeout = 15000, lengthDiffThreshold = 0.25 } = options;

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

  // Identify parameters to test
  const params = Array.from(url.searchParams.keys());
  const testParams = params.length ? params : ["q", "id", "search"]; // added generic params

  for (const param of testParams) {
    for (const p of payloads) {
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
    }
  }

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

  try {
    page = await browser.newPage();

    // Listen for alert dialogs to confirm script execution
    page.on('dialog', async dialog => {
      if (dialog.message() === 'XSS') {
        xssTriggered = true;
      }
      await dialog.dismiss();
    });

    const testUrl = new URL(url);
    testUrl.searchParams.set("xss_test", payload);

    // Navigate with a reasonable timeout
    await page.goto(testUrl.toString(), { waitUntil: "domcontentloaded", timeout: 30000 });

    // Handle bot verification if it appears during XSS test
    await waitForChallengeResolution(page, 20000);

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
async function checkCookieConsent(page) {

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

    const cookiesUsed = document.cookie && document.cookie.length > 0;
    const cookieString = cookiesUsed ? document.cookie : "";

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

  // 🔥 STEP 3: SMART DECISION LOGIC

  // ❌ No tracking → Not required
  if (!hasTracking) {
    return {
      score: 100,
      status: "not_applicable",
      details: "No tracking or cookies detected, consent banner not required.",
      meta: { trackingData },
      analysis: null
    };
  }

  // ✅ Tracking + Banner found → PASS
  if (bannerFound) {
    return {
      score: 100,
      status: "pass",
      details: `Cookie consent banner detected (Pattern: ${foundSelector})`,
      meta: {
        selector: foundSelector,
        trackingData
      },
      analysis: null
    };
  }

  // ❌ Tracking + No banner → FAIL
  return {
    score: 0,
    status: "fail",
    details: "Tracking detected but no visible cookie consent banner found",
    meta: { trackingData },
    analysis: {
      cause: "Tracking scripts or cookies detected but no consent banner present.",
      recommendation: "Implement a visible cookie consent banner compliant with GDPR/CCPA."
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

// GDPR/CCPA (General Data Protection Regulation/California Consumer Privacy Act)
async function checkGDPRCCPA(page) {
  // Check for specific GDPR/CCPA keywords in the page text
  const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
  const keywords = [
    "gdpr",
    "ccpa",
    "california consumer privacy act",
    "general data protection regulation",
    "do not sell my personal information",
    "don't sell my personal information",
    "cookie preferences",
    "manage cookies",
    "legal notice",
    "imprint"
  ];

  const foundKeyword = keywords.find(k => pageText.includes(k));

  // Also check for specific element identifiers related to compliance frameworks (CMP)
  const complianceSelectors = [
    "[id*='gdpr']",
    "[class*='gdpr']",
    "[id*='ccpa']",
    "[class*='ccpa']",
    "[data-ccpa]",
    "#onetrust-pc-btn-handler", // OneTrust preference center
    ".fc-preference-consent", // Funding Choices
    "[aria-label*='privacy settings']"
  ];

  let foundSelector = null;
  for (const selector of complianceSelectors) {
    const element = await page.$(selector);
    if (element) {
      const box = await element.boundingBox();
      if (box && box.height > 0 && box.width > 0) {
        foundSelector = selector;
        break;
      }
    }
  }

  if (foundKeyword || foundSelector) {
    return {
      score: 100,
      status: "pass",
      details: foundKeyword
        ? `GDPR/CCPA compliance text found: "${foundKeyword}"`
        : `GDPR/CCPA compliance element found (${foundSelector})`,
      meta: {
        foundKeyword,
        foundSelector
      },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "No specific GDPR/CCPA notice or text found",
    meta: {},
    analysis: {
      cause: "No text mentioning GDPR, CCPA, or data rights was found, nor were any standard compliance widgets detected.",
      recommendation: "Ensure explicit mention of user rights (GDPR/CCPA) or a link to 'Do Not Sell My Personal Information' is present."
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

  const adminPaths = [
    "/admin", "/admin/login", "/administrator", "/wp-admin/", "/wp-login.php",
    "/cms", "/backend", "/controlpanel", "/admin.php", "/phpmyadmin/",
    "/sqladmin/", "/dashboard", "/login.php"
  ];

  const adminKeywords = [
    "wp-login.php", "wordpress", "phpmyadmin", "administrator",
    "admin panel", "control panel", "dashboard", "administration", "admin area"
  ];

  const checkPath = async (path) => {
    const tryUrl = new URL(path, origin).toString();
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(tryUrl, { method: 'GET', redirect: "follow", signal: controller.signal });

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

// MFA Enabled
// MFA is only meaningful when an authentication surface exists. Enforcement cannot be
// proven black-box (no credentials), so we scope to whether a login exists and grade
// the strength of the evidence honestly instead of passing on any stray keyword.
async function checkMFAEnabled(page) {
  const surface = await page.evaluate(() => {
    const lc = (s) => (s || "").toLowerCase();
    const bodyText = lc(document.body.innerText);

    // Authentication surface: a password field or a login affordance
    const hasPasswordField = !!document.querySelector('input[type="password"]');
    const loginPatterns = ["login", "log in", "log-in", "signin", "sign in", "sign-in", "my account", "/account", "customer portal"];
    let loginAffordance = false;
    document.querySelectorAll("a, button").forEach(el => {
      const hay = lc(el.innerText) + " " + lc(el.getAttribute("href")) + " " + lc(el.getAttribute("aria-label"));
      if (loginPatterns.some(p => hay.includes(p))) loginAffordance = true;
    });

    // Genuine MFA signals
    // Specific MFA tokens only — bare "code" is excluded so zip/postal/promo-code
    // inputs don't false-positive as MFA fields.
    const mfaNameRe = /\b(otp|mfa|2fa|totp|one[-_]?time[-_]?(code|password)|verification[-_]?code|auth(entication)?[-_]?code|security[-_]?code)\b/i;
    const mfaInput = Array.from(document.querySelectorAll("input")).some(i =>
      i.autocomplete === "one-time-code" ||
      (i.name && mfaNameRe.test(i.name)) ||
      (i.placeholder && /verification code|one-time|6-digit/i.test(i.placeholder))
    );
    const mfaKeywords = ["two-factor", "2fa", "multi-factor", "mfa", "authenticator app", "verification code", "security key", "one-time password", "backup code"];
    const mfaKeyword = mfaKeywords.find(k => bodyText.includes(k)) || null;

    // SSO / federated auth — may delegate MFA, but not proof of enforcement
    const ssoKeywords = ["continue with google", "continue with microsoft", "continue with apple", "sign in with google", "login with", "okta", "auth0", "saml", "duo security"];
    const ssoKeyword = ssoKeywords.find(k => bodyText.includes(k)) || null;

    return { hasPasswordField, loginAffordance, mfaInput, mfaKeyword, ssoKeyword };
  });

  const hasAuthSurface = surface.hasPasswordField || surface.loginAffordance || surface.mfaInput || !!surface.ssoKeyword;

  // No authentication surface -> MFA not applicable (info-only, excluded from the score)
  if (!hasAuthSurface) {
    return {
      score: 100,
      status: "not_applicable",
      infoOnly: true,
      details: "No customer login / authentication surface found — MFA not applicable.",
      meta: { hasAuthSurface: false },
      analysis: null
    };
  }

  // Genuine MFA signal at the login surface
  if (surface.mfaInput || surface.mfaKeyword) {
    return {
      score: 100,
      status: "pass",
      details: surface.mfaInput ? "MFA code input detected at login" : `MFA indicator found: "${surface.mfaKeyword}"`,
      meta: { hasAuthSurface: true, method: surface.mfaInput ? "input" : "keyword", mfaKeyword: surface.mfaKeyword, note: "Presence detected; enforcement cannot be verified without credentials." },
      analysis: null
    };
  }

  // SSO present — delegated auth may carry MFA, but not proof of enforcement
  if (surface.ssoKeyword) {
    return {
      score: 70,
      status: "warning",
      details: `SSO/federated login detected ("${surface.ssoKeyword}") — may delegate MFA, but native MFA is not confirmed`,
      meta: { hasAuthSurface: true, method: "sso", ssoKeyword: surface.ssoKeyword },
      analysis: {
        cause: "Login is delegated to an SSO / identity provider. MFA may be enforced there, but it cannot be confirmed from this page.",
        recommendation: "Verify the identity provider enforces MFA, or offer native MFA (authenticator / OTP) on the login flow."
      }
    };
  }

  // Auth surface exists but only single-factor (password), no MFA signals
  return {
    score: 40,
    status: "warning",
    details: "A login exists but no MFA / second-factor option was detected (single-factor).",
    meta: { hasAuthSurface: true, method: "password-only", hasPasswordField: surface.hasPasswordField },
    analysis: {
      cause: "An authentication surface is present but only single-factor (password) login was detected; no MFA option was visible.",
      recommendation: "Offer and enforce MFA (authenticator app, OTP, or security key) for customer and admin accounts. Note: a post-login MFA step may not be visible to this scan."
    }
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

async function checkFinanceFormSecurity(url, page, browser) {
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
  let scanPage = null;

  try {
    const discovered = await discoverFinanceUrl(page);
    const origin = new URL(page.url()).origin;
    const candidates = [];
    const pushUniq = (u) => { if (u && !candidates.includes(u)) candidates.push(u); };
    pushUniq(discovered);
    pushUniq(origin + "/finance");
    pushUniq(origin + "/financing");
    pushUniq(origin + "/credit-application");
    pushUniq(origin + "/apply-for-financing");
    pushUniq(origin + "/finance-application");
    // Trade-In page types (spec §2.4 — Finance-form PII security also applies to Trade-In)
    pushUniq(origin + "/value-your-trade");
    pushUniq(origin + "/trade-in");
    pushUniq(origin + "/trade");
    pushUniq(origin + "/value-trade");

    scanPage = await browser.newPage();

    // Navigate candidates until we land on a page that actually looks like a
    // finance / credit-application page. If none qualify → Not Applicable.
    let data = null;
    for (let i = 0; i < candidates.length; i++) {
      const cand = candidates[i];
      try {
        const resp = await scanPage.goto(cand, { waitUntil: "domcontentloaded", timeout: 30000 });
        if (resp && resp.status() >= 400) continue;
        await waitForChallengeResolution(scanPage, 12000).catch(() => {});
        const d = await scanPage.evaluate(() => {
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
        if (d && (d.isFinancePage || d.isTradeInPage)) { data = d; meta.checkedUrl = scanPage.url(); break; }
      } catch (e) {
        continue;
      }
    }

    if (!data) {
      // No finance / credit-application or trade-in page → Not Applicable (neutral score).
      meta.rawScore = 0;
      meta.missingPoints = 0;
      return {
        score: 100,
        status: "not_applicable",
        details: "No finance / credit-application or trade-in page found on the site",
        meta,
        analysis: null,
      };
    }

    meta.financePageFound = true;
    meta.pageKind = data.pageKind || "finance";

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
        detail: meta.secureEndpoint ? "The application form submits to an HTTPS endpoint." : "The form posts to an insecure (HTTP) endpoint. Point the form action to an HTTPS URL.",
      },
      {
        label: "Security signals (privacy / terms / SSL)",
        points: POINTS.signals,
        earned: signalsEarned,
        detail: signalsEarned ? `Present: ${signals.join(", ")}` : "Add at least two trust signals: a Privacy Policy link, a Terms link, and visible secure-application / SSL messaging.",
      },
    ];

    const where = meta.checkedUrl ? ` (tested ${meta.checkedUrl})` : "";
    const pciLabel = meta.pageKind === "trade-in" ? "Trade-in form security" : "Finance form security";
    let status, details, analysis;
    if (rawScore >= 8) {
      status = "pass";
      details = `${pciLabel} is strong — ${rawScore}/10${where}`;
      analysis = null;
    } else if (rawScore >= 5) {
      status = "warning";
      details = `${pciLabel} is partial — ${rawScore}/10${where}`;
      analysis = {
        cause: `The ${kindLabel} page is missing one or more PCI best practices (see the per-item breakdown).`,
        recommendation: "Address the unearned items: enforce HTTPS end-to-end, delegate sensitive data to a PCI-compliant provider, and add clear privacy/terms/secure-application messaging.",
      };
    } else {
      status = "fail";
      details = `${pciLabel} is weak — ${rawScore}/10${where}`;
      analysis = {
        cause: `The ${kindLabel} page collects or submits sensitive data without adequate PCI safeguards.`,
        recommendation: "Serve the page over HTTPS, never collect raw SSN/card/bank data outside a PCI-compliant provider, ensure the submission endpoint is HTTPS, and surface privacy/terms/secure-application signals.",
      };
    }

    return { score: rawScore * 10, status, details, meta, analysis };
  } catch (error) {
    return {
      score: 0,
      status: "error",
      details: `Finance Form Security check failed: ${error.message}`,
      meta,
      analysis: { cause: error.message },
    };
  } finally {
    if (scanPage) await scanPage.close().catch(() => {});
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
async function checkPrivacyCompliance(page) {
  const gdpr = await checkGDPRCCPA(page);
  const dataCollection = await checkDataCollection(page);
  const gdprPass = gdpr?.status === "pass";
  const dcPass = dataCollection?.status === "pass";

  let score, status, analysis = null;
  if (gdprPass && dcPass) { score = 100; status = "pass"; }
  else if (gdprPass || dcPass) {
    score = 70; status = "warning";
    analysis = {
      cause: gdprPass ? "A GDPR/CCPA rights notice was found, but no explicit data-collection disclosure." : "A data-collection disclosure was found, but no GDPR/CCPA rights notice.",
      recommendation: "Provide both a GDPR/CCPA rights notice (e.g. 'Do Not Sell My Personal Information') and a clear data-collection disclosure."
    };
  } else {
    score = 0; status = "fail";
    analysis = {
      cause: "No GDPR/CCPA rights notice or data-collection disclosure was found.",
      recommendation: "Add explicit privacy-rights language (GDPR/CCPA) and a data-collection disclosure, typically in the privacy policy and footer."
    };
  }
  return {
    score, status, confidence: "heuristic",
    details: status === "pass" ? "GDPR/CCPA notice and data-collection disclosure present" : status === "warning" ? "Partial privacy disclosure" : "No GDPR/CCPA or data-collection disclosure found",
    meta: { gdpr: gdpr?.meta || null, dataCollection: dataCollection?.meta || null, gdprPass, dcPass, foundKeyword: gdpr?.meta?.foundKeyword || null, foundSelector: gdpr?.meta?.foundSelector || null },
    analysis
  };
}

// ---------------------------------------------------------------------------
// Legal / financial disclaimers (Reg-Z / Reg-M / FTC) — page-specific
// (Finance / Offers / Lease / VDP). On a single-URL audit: score the audited page if it
// is one of those types, else discover such a page from links and score the first that loads.
// N/A (renormalized out) when no such page exists.
// ---------------------------------------------------------------------------
const DISCLAIMER_GROUPS = {
  finance: { label: "Finance terms (Reg-Z)", terms: ["apr", "annual percentage rate", "with approved credit", "on approved credit", "w.a.c", "wac", "o.a.c", "finance charge", "qualified buyers", "qualified credit", "subject to credit approval"] },
  lease: { label: "Lease terms (Reg-M)", terms: ["due at signing", "capitalized cost", "cap cost", "residual", "money factor", "total of payments", "lease term", "lessee", "acquisition fee", "disposition fee", "excess mileage", "security deposit"] },
  price: { label: "Price disclaimer (FTC)", terms: ["plus tax", "plus tax and", "tax, title", "title and license", "doc fee", "documentation fee", "does not include", "see dealer for details", "see dealer for complete details", "dealer for details", "prior sale", "excludes tax", "additional fees", "fees not included"] },
  expiry: { label: "Offer expiry", terms: ["offer ends", "offer expires", "valid through", "valid until", "must take delivery", "while supplies last", "ends on", "by the end of"] },
};

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

async function checkLegalDisclaimers(url, page, browser) {
  const meta = { checkedUrl: null, pageType: null, groupsFound: [], groupsRequired: [], details: {} };
  let scanPage = null;
  try {
    // Is the AUDITED page itself a finance/offers/lease/VDP page?
    const hereHay = await page.evaluate(() => ((document.title || "") + " " + (document.body ? document.body.innerText : "")).toLowerCase().slice(0, 8000)).catch(() => "");
    let pageType = classifyDisclaimerPageType(new URL(page.url()).pathname, hereHay);
    let targetPage = null;

    if (pageType) { targetPage = page; meta.checkedUrl = page.url(); }
    else {
      // Discover a relevant page from links.
      const link = await page.evaluate(() => {
        const bad = (raw) => /^(mailto:|tel:|javascript:|#)/i.test(raw || "");
        const kw = /financ|credit[-_ ]?app|special|offer|incentive|rebate|lease/i;
        const links = Array.from(document.querySelectorAll("a[href]"))
          .map(a => ({ href: a.href, raw: a.getAttribute("href") || "", text: (a.textContent || "").toLowerCase() }))
          .filter(l => l.href && !bad(l.raw));
        const m = links.find(l => kw.test(l.href)) || links.find(l => kw.test(l.text));
        return m ? m.href : null;
      }).catch(() => null);

      const origin = new URL(page.url()).origin;
      const candidates = [];
      const push = (u) => { if (u && !candidates.includes(u)) candidates.push(u); };
      push(link); push(origin + "/specials"); push(origin + "/offers"); push(origin + "/finance"); push(origin + "/lease-specials");

      scanPage = await browser.newPage();
      for (let i = 0; i < candidates.length; i++) {
        const cand = candidates[i];
        try {
          const resp = await scanPage.goto(cand, { waitUntil: "domcontentloaded", timeout: 30000 });
          if (resp && resp.status() >= 400) continue;
          await waitForChallengeResolution(scanPage, 12000).catch(() => {});
          const hay = await scanPage.evaluate(() => ((document.title || "") + " " + (document.body ? document.body.innerText : "")).toLowerCase().slice(0, 8000)).catch(() => "");
          const pt = classifyDisclaimerPageType(new URL(scanPage.url()).pathname, hay);
          if (pt) { pageType = pt; targetPage = scanPage; meta.checkedUrl = scanPage.url(); break; }
        } catch (e) { continue; }
      }
    }

    if (!pageType || !targetPage) {
      return { score: 100, status: "not_applicable", infoOnly: true, confidence: "heuristic", details: "No finance / offers / lease / VDP page found to assess legal disclaimers", meta, analysis: null };
    }
    meta.pageType = pageType;

    const scan = await scanDisclaimerText(targetPage);
    const haystack = scan.bodyText + " \n " + scan.fineText;
    const groupHit = (g) => DISCLAIMER_GROUPS[g].terms.some(t => haystack.includes(t));

    const requiredByType = { finance: ["finance", "price"], lease: ["lease", "price"], offers: ["price", "expiry"], vdp: ["price"] };
    const required = requiredByType[pageType] || ["price"];
    meta.groupsRequired = required.map(g => DISCLAIMER_GROUPS[g].label);

    const allGroups = ["finance", "lease", "price", "expiry"];
    const found = allGroups.filter(groupHit);
    meta.groupsFound = found.map(g => DISCLAIMER_GROUPS[g].label);
    allGroups.forEach(g => { meta.details[DISCLAIMER_GROUPS[g].label] = groupHit(g); });

    const requiredFound = required.filter(groupHit).length;
    let score = Math.round((requiredFound / required.length) * 100);
    if (score < 100) {
      const optionalBonus = found.filter(g => !required.includes(g)).length * 5;
      score = Math.min(100, score + optionalBonus);
    }
    const status = score >= 80 ? "pass" : score >= 40 ? "warning" : "fail";
    const missing = required.filter(g => !groupHit(g)).map(g => DISCLAIMER_GROUPS[g].label);

    return {
      score, status, confidence: "heuristic",
      details: missing.length ? `Missing ${pageType} disclaimers: ${missing.join(", ")}` : `Required ${pageType} disclaimers present`,
      meta,
      analysis: status === "pass" ? null : {
        cause: `The ${pageType} page is missing required legal/financial disclaimers (${missing.join(", ")}). Reg-Z (finance), Reg-M (lease), and FTC advertising rules require clear, conspicuous terms.`,
        recommendation: pageType === "lease"
          ? "Add Reg-M lease disclosures: capitalized cost, residual, money factor, due-at-signing, and total of payments — legibly, not buried."
          : pageType === "finance"
            ? "Add Reg-Z finance disclosures: APR, finance terms, and 'with approved credit' qualifiers, clearly and conspicuously."
            : "Add FTC price/offer disclaimers: tax/title/doc-fee exclusions, 'see dealer for details', and offer expiry dates."
      }
    };
  } catch (error) {
    return { score: 100, status: "not_applicable", infoOnly: true, confidence: "heuristic", details: `Legal disclaimers check skipped: ${error.message}`, meta, analysis: null };
  } finally {
    if (scanPage) await scanPage.close().catch(() => {});
  }
}

export default async function securityCompliance(url, page, response, browser) {

  const domain = Domain(url);

  // Transport
  const httpsResult = await checkHTTPS(url, page);
  const sslResult = await checkSSLConnection(response);
  const sslExpiryResult = await checkSSLExpiry(response);
  const tlsVersionResult = await checkTLSVersion(response);
  const hstsResult = checkHSTS(response);

  // Headers
  const xFrameOptionsResult = checkXFrameOptions(response);
  const cspResult = checkCSP(response);
  const xContentTypeOptionsResult = checkXContentTypeOptions(response);

  // Cookies
  const cookieFlagsResult = await checkCookieFlags(page);

  // Reputation — composite gate (Safe Browsing + VirusTotal folded into one; spec §4.4)
  const reputationResult = await checkReputation(domain, url);

  // App-exposure (heuristic surface indicators)
  const sqliExposureResult = await checkSQLiExposure(url);
  const xssVulnerabilityResult = await checkXSS(url, browser);
  const formsUseHTTPSResult = await checkFormsUseHTTPS(page);
  const weakDefaultCredsResult = await checkWeakDefaultCredentials(page, browser);
  const mfaEnabledResult = await checkMFAEnabled(page);
  const adminPanelPublicResult = await checkAdminPanelPublic(url);

  // Privacy / legal
  const cookieConsentResult = await checkCookieConsent(page);
  const privacyPolicyResult = await checkPrivacyPolicy(page);
  const thirdPartyCookiesResult = await checkThirdPartyCookies(url, page, cookieConsentResult, privacyPolicyResult);
  const privacyComplianceResult = await checkPrivacyCompliance(page);

  // Page-specific
  const financeFormSecurityResult = await checkFinanceFormSecurity(url, page, browser);
  const legalDisclaimersResult = await checkLegalDisclaimers(url, page, browser);

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
    // Cookies
    { key: "Cookie_Flags", metric: cookieFlagsResult, weight: 5, confidence: "measured" },
    { key: "Third_Party_Cookies", metric: thirdPartyCookiesResult, weight: 2, confidence: "measured" },
    // Reputation (gate)
    { key: "Reputation", metric: reputationResult, weight: 9, confidence: "field", gate: "reputation" },
    // App-exposure (heuristic surface indicators)
    { key: "SQLi_Exposure", metric: sqliExposureResult, weight: 4, confidence: "heuristic" },
    { key: "XSS", metric: xssVulnerabilityResult, weight: 4, confidence: "heuristic" },
    { key: "Forms_Use_HTTPS", metric: formsUseHTTPSResult, weight: 4, confidence: "heuristic" },
    // Admin exposure / weak creds / MFA — spec groups as one High (≈0.04); split across the three.
    { key: "Weak_Default_Credentials", metric: weakDefaultCredsResult, weight: 2, confidence: "heuristic" },
    { key: "Admin_Panel_Public", metric: adminPanelPublicResult, weight: 1, confidence: "heuristic" },
    { key: "MFA_Enabled", metric: mfaEnabledResult, weight: 1, confidence: "heuristic" },
    // Privacy / legal
    { key: "Cookie_Consent", metric: cookieConsentResult, weight: 3, confidence: "heuristic" },
    { key: "Privacy_Policy", metric: privacyPolicyResult, weight: 3, confidence: "heuristic" },
    { key: "Privacy_Compliance", metric: privacyComplianceResult, weight: 4, confidence: "heuristic" },
    // Page-specific (renormalized out when no such page exists)
    { key: "Finance_Form_Security", metric: financeFormSecurityResult, weight: 10, confidence: "heuristic" },
    { key: "Legal_Disclaimers", metric: legalDisclaimersResult, weight: 8, confidence: "heuristic" },
  ];

  const CONF_RANK = { heuristic: 1, estimate: 1, lab: 2, measured: 2, field: 3 };
  let totalWeight = 0, earned = 0;
  let noHttps = false, reputationFlagged = false;
  let lowestConf = "field";
  for (const w of weighted) {
    const m = w.metric;
    // N/A / info-only params drop out of the denominator (rule 6).
    if (!m || m.infoOnly || m.status === "not_applicable" || typeof m.score !== "number") continue;
    m.confidence = m.confidence || w.confidence; // stamp for the UI
    totalWeight += w.weight;
    earned += (m.score / 100) * w.weight;
    if (CONF_RANK[m.confidence] < CONF_RANK[lowestConf]) lowestConf = m.confidence;
    if (w.gate === "https" && m.score === 0) noHttps = true;
    if (w.gate === "reputation" && m.status === "fail") reputationFlagged = true;
  }

  let pct = totalWeight > 0 ? parseFloat(((earned / totalWeight) * 100).toFixed(0)) : 0;
  // Gates (spec §2.4 / §5.3): transport + reputation dominate the section.
  if (noHttps) pct = Math.min(pct, 30);
  if (reputationFlagged) pct = Math.min(pct, 25);

  return {
    Percentage: pct,
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
    MFA_Enabled: mfaEnabledResult,
    // Privacy / legal
    Cookie_Consent: cookieConsentResult,
    Privacy_Policy: privacyPolicyResult,
    Privacy_Compliance: privacyComplianceResult,
    // Page-specific
    Finance_Form_Security: financeFormSecurityResult,
    Legal_Disclaimers: legalDisclaimersResult,
  };
}
