import dotenv from "dotenv";
import fetch from "node-fetch";
import { URL } from "url";
import pLimit from "p-limit";
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

// HTTPS (Hypertext Transfer Protocol Secure)
function checkHTTPS(url) {
  const parsedUrl = new URL(url);
  const isHttps = parsedUrl.protocol === "https:";
  return {
    score: isHttps ? 100 : 0,
    status: isHttps ? "pass" : "fail",
    details: isHttps ? "Protocol is HTTPS" : `Protocol is ${parsedUrl.protocol}, not HTTPS`,
    meta: {
      protocol: parsedUrl.protocol
    },
    analysis: isHttps ? null : {
      cause: `The website is served over ${parsedUrl.protocol} instead of HTTPS.`,
      recommendation: "Enforce HTTPS by obtaining an SSL certificate and redirecting all HTTP traffic to HTTPS."
    }
  };
}

// SSL (Secure Sockets Layer) Connection
async function checkSSLConnection(response) {
  if (!response) return { score: 0, status: "fail", details: "No response available for SSL check", meta: {}, analysis: { cause: "No response received.", recommendation: "Check server connectivity." } };
  if (!response.ok()) {
    return {
      score: 0,
      status: "fail",
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
  const securityDetails = await response.securityDetails();
  const validTo = securityDetails && securityDetails.validTo ? new Date(securityDetails.validTo * 1000).toISOString() : null;

  if (validTo) {
    const expiryDate = new Date(validTo);
    const daysUntilExpiry = Math.floor((expiryDate - new Date()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 30) {
      return {
        score: 75,
        status: "warning",
        details: `SSL connection established, but certificate expires soon (in ${daysUntilExpiry} days)`,
        meta: {
          validTo,
          daysUntilExpiry
        },
        analysis: {
          cause: "The SSL certificate is valid but nearing expiration.",
          recommendation: "Renew the SSL certificate soon to avoid service interruption."
        }
      };
    }
  }

  return {
    score: 100,
    status: "pass",
    details: "SSL connection established",
    meta: {
      validTo
    },
    analysis: null
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

// CSP (Content Security Policy)
function checkCSP(response) {
  if (!response) return { score: 0, status: "fail", details: "No response available for CSP check", meta: {}, analysis: { cause: "No response received.", recommendation: "Check server connectivity." } };

  const headers = response.headers();
  const cspVal = headers['content-security-policy'];

  if (cspVal) {
    return {
      score: 100,
      status: "pass",
      details: "CSP header is present",
      meta: {
        value: cspVal
      },
      analysis: null
    };
  }

  return {
    score: 0,
    status: "fail",
    details: "CSP header is missing",
    meta: {},
    analysis: {
      cause: "The Content-Security-Policy (CSP) header is missing.",
      recommendation: "Implement a robust CSP header to prevent XSS and data injection attacks."
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

// Cookies - Secure Flag
async function checkCookiesSecureFlag(page) {
  const cookies = await page.context().cookies();

  if (!cookies.length) {
    return {
      score: 100,
      status: "pass",
      details: "No cookies found - Safe",
      meta: {
        cookies: []
      },
      analysis: null
    };
  }

  // Check if *all* cookies have the Secure flag
  const allSecure = cookies.every((c) => c.secure);
  const insecureCookies = cookies.filter(c => !c.secure).map(c => c.name);

  return {
    score: allSecure ? 100 : 0,
    status: allSecure ? "pass" : "fail",
    details: allSecure
      ? "All cookies have the Secure flag"
      : `Secure flag missing on: ${insecureCookies.join(", ")}`,
    meta: {
      cookies,
      insecureCookies,
      allSecure
    },
    analysis: allSecure ? null : {
      cause: "Some cookies are set without the 'Secure' flag, allowing them to be sent over unencrypted connections.",
      recommendation: "Ensure all cookies are set with the 'Secure' attribute so they are only sent over HTTPS."
    }
  };
}

// Cookies - HttpOnly Flag
async function checkCookiesHttpOnlyFlag(page) {
  const cookies = await page.context().cookies();

  if (!cookies.length) {
    return {
      score: 100,
      status: "pass",
      details: "No cookies found - Safe",
      meta: {
        cookies: []
      },
      analysis: null
    };
  }

  // Check if *all* cookies have the HttpOnly flag
  const allHttpOnly = cookies.every((c) => c.httpOnly);
  const scriptAccessibleCookies = cookies.filter(c => !c.httpOnly).map(c => c.name);

  return {
    score: allHttpOnly ? 100 : 0,
    status: allHttpOnly ? "pass" : "fail",
    details: allHttpOnly
      ? "All cookies have the HttpOnly flag"
      : `HttpOnly flag missing on: ${scriptAccessibleCookies.join(", ")}`,
    meta: {
      cookies,
      scriptAccessibleCookies,
      allHttpOnly
    },
    analysis: allHttpOnly ? null : {
      cause: "Some cookies are set without the 'HttpOnly' flag, making them accessible to client-side scripts.",
      recommendation: "Set the 'HttpOnly' attribute on sensitive cookies to prevent access via XSS."
    }
  };
}

// Cookies - Third Party Cookies
async function checkThirdPartyCookies(url, page) {
  const pageHostname = new URL(url).hostname;
  const cookies = await page.context().cookies();

  const thirdPartyCookies = cookies.filter(cookie => {
    const cookieDomain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
    return !pageHostname.includes(cookieDomain) && !cookieDomain.includes(pageHostname);
  });

  if (thirdPartyCookies.length > 0) {
    const uniqueDomains = [...new Set(thirdPartyCookies.map(c => c.domain))].join(", ");
    return {
      score: 0,
      status: "fail",
      details: `Third-party cookies detected from: ${uniqueDomains}`,
      meta: {
        thirdPartyCookies,
        uniqueDomains
      },
      analysis: {
        cause: "Cookies from external domains are being stored on the user's browser.",
        recommendation: "Audit third-party scripts (ads, analytics) and ensure they comply with privacy regulations (GDPR/CCPA)."
      }
    };
  }

  return {
    score: 100,
    status: "pass",
    details: "No third-party cookies detected",
    meta: {
      thirdPartyCookies: []
    },
    analysis: null
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
// async function checkVirusTotal(domain) {
//   const VT_KEY = getVTKey();
//   if (!VT_KEY) return { score: 100, status: "pass", details: "VirusTotal API key missing (Skipped)", meta: {}, analysis: null };

//   const endpoint = `https://www.virustotal.com/api/v3/domains/${domain}`;

//   try {
//     const res = await fetch(endpoint, { headers: { "x-apikey": VT_KEY } });

//     if (!res.ok) {
//       return {
//         score: 0,
//         status: "error",
//         details: `VirusTotal API error: ${res.status}`,
//         meta: { httpStatus: res.status },
//         analysis: { cause: `API responded with status ${res.status}` }
//       };
//     }

//     const j = await res.json();
//     const stats = j?.data?.attributes?.last_analysis_stats || {};

//     const malicious = stats.malicious || 0;
//     const suspicious = stats.suspicious || 0;
//     const isClean = malicious === 0 && suspicious === 0;

//     if (isClean) {
//       return {
//         score: 100,
//         status: "pass",
//         details: "No malicious or suspicious detections",
//         meta: { stats },
//         analysis: null
//       };
//     } else {
//       return {
//         score: 0,
//         status: "fail",
//         details: `Detections occurred: ${malicious} malicious, ${suspicious} suspicious`,
//         meta: { stats },
//         analysis: {
//           cause: "The domain is flagged by one or more security vendors.",
//           recommendation: "Investigate the specific flags on VirusTotal. Clean up any malware or compromised content if confirmed."
//         }
//       };
//     }
//   } catch (error) {
//     return { score: 0, status: "error", details: `Check failed: ${error.message}`, meta: {}, analysis: { cause: error.message } };
//   }
// }

// Domain Blacklist
// async function checkDomainBlacklist(domain, url) {
//   const [googleSafeBrowsing, virusTotal] = await Promise.all([
//     checkGoogleSafeBrowsing(url),
//     checkVirusTotal(domain),
//   ]);

//   const isGoogleSafe = googleSafeBrowsing.status === "pass";
//   const isVirusTotalSafe = virusTotal.status === "pass";
//   const allSafe = isGoogleSafe && isVirusTotalSafe;

//   let details = "Domain not found in blacklists";
//   if (!allSafe) {
//     if (!isGoogleSafe && !isVirusTotalSafe) details = "Domain found in both Google Safe Browsing and VirusTotal blacklists";
//     else if (!isGoogleSafe) details = "Domain found in Google Safe Browsing blacklist";
//     else details = "Domain found in VirusTotal blacklist";
//   }

//   return {
//     score: allSafe ? 100 : 0,
//     status: allSafe ? "pass" : "fail",
//     details,
//     meta: {
//       googleSafeBrowsing,
//       virusTotal
//     },
//     analysis: allSafe ? null : {
//       cause: "The domain or URL is listed in one or more security blacklists (Google Safe Browsing or VirusTotal).",
//       recommendation: "Review the detailed reports from Google and VirusTotal. Request a review from the respective services after cleaning up any malware or security issues."
//     }
//   };
// }

// SQL Injection
async function checkSQLiExposure(urlString, options = {}) {
  const { timeout = 5000, lengthDiffThreshold = 0.25 } = options;

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

  // Build all (param × payload) combinations and probe them CONCURRENTLY
  // (was a nested sequential loop — the single biggest time sink in this metric).
  const tests = [];
  for (const param of testParams) {
    for (const p of payloads) {
      const testUrl = new URL(url);
      testUrl.searchParams.set(param, p);
      tests.push({ param, p, testUrl });
    }
  }

  const sqliLimit = pLimit(10); // up to 10 concurrent probe requests
  const findings = await Promise.all(tests.map((t) => sqliLimit(async () => {
    const res = await fetchBody(t.testUrl);
    const body = res.text || "";
    const length = body.length || 0;

    if (looksLikeSQLError(body)) {
      return { type: "error", param: t.param, p: t.p };
    }
    if (baselineLength > 0 && length > 0) {
      const diff = Math.abs(length - baselineLength) / baselineLength;
      if (diff >= lengthDiffThreshold && res.status >= 200 && res.status < 400) {
        return { type: "length", param: t.param, p: t.p, diff };
      }
    }
    return null;
  })));

  const errorHit = findings.find((f) => f && f.type === "error");
  if (errorHit) {
    return {
      score: 0,
      status: "fail",
      details: `SQL injection vulnerability detected with payload: ${errorHit.p}`,
      meta: { payload: errorHit.p, param: errorHit.param },
      analysis: {
        cause: "The application exposed a database error message in response to the injected payload.",
        recommendation: "Ensure all user inputs are sanitized and use parameterized queries (Prepared Statements) to prevent SQL injection."
      }
    };
  }

  const lengthHit = findings.find((f) => f && f.type === "length");
  if (lengthHit) {
    return {
      score: 0,
      status: "fail",
      details: `Significant response length difference with payload: ${lengthHit.p}`,
      meta: { payload: lengthHit.p, param: lengthHit.param, diff: lengthHit.diff },
      analysis: {
        cause: "Response length changed significantly with SQL injection payload, suggesting potential blind SQL injection.",
        recommendation: "Ensure application handles invalid input gracefully without altering response structure unpredictably."
      }
    };
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
    await page.goto(testUrl.toString(), { waitUntil: "domcontentloaded", timeout: 10000 });

    // Handle bot verification if it appears during XSS test
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
async function checkWeakDefaultCredentials(page) {
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

  try {
    // Attempt to fill likely username/password fields
    const userField = await page.$("input[type='text'], input[type='email'], input[name*='user'], input[name*='login']");
    const passField = await page.$("input[type='password']");
    const submitBtn = await page.$("button[type='submit'], input[type='submit']");

    if (userField && passField && submitBtn) {
      await userField.type(cred.u);
      await passField.type(cred.p);

      // Wait for navigation or failure message
      const navigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => null);
      await submitBtn.click();
      await navigationPromise;

      // Check for success indicators (URL change, "dashboard", "welcome", logout button)
      const newUrl = page.url();
      const newText = await page.evaluate(() => document.body.innerText.toLowerCase());

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
async function checkMFAEnabled(page) {
  // 1. Check for specific input fields indicative of MFA (e.g., 6-digit code fields)
  const mfaInputs = await page.$$eval("input", (inputs) =>
    inputs.some(i =>
      (i.autocomplete === "one-time-code") ||
      (i.name && /otp|mfa|2fa|verification|code/i.test(i.name)) ||
      (i.placeholder && /enter code|verification code|6-digit/i.test(i.placeholder))
    )
  );

  if (mfaInputs) {
    return {
      score: 100,
      status: "pass",
      details: "MFA-related input field detected",
      meta: {
        method: "input-detection"
      },
      analysis: null
    };
  }

  // 2. Check for text indicators on the page (e.g., "Login with SSO", "Use Security Key")
  const pageText = await page.evaluate(() => document.body.innerText.toLowerCase());
  const mfaKeywords = [
    "two-factor",
    "2fa",
    "multi-factor",
    "mfa",
    "authenticator app",
    "verification code",
    "security key",
    "one-time password",
    "send sms",
    "backup code"
  ];

  const foundKeyword = mfaKeywords.find(k => pageText.includes(k));

  if (foundKeyword) {
    return {
      score: 100,
      status: "pass",
      details: `MFA indicator found in text: "${foundKeyword}"`,
      meta: {
        method: "text-detection",
        foundKeyword
      },
      analysis: null
    };
  }

  // 3. Check for SSO/Federated Login buttons which imply delegated auth (often enforcing MFA)
  const ssoKeywords = ["sso", "saml", "okta", "auth0", "duo", "continue with google", "continue with microsoft", "login with"];
  const ssoFound = ssoKeywords.find(k => pageText.includes(k));

  if (ssoFound) {
    return {
      score: 100,
      status: "pass",
      details: `SSO/Federated login detected: "${ssoFound}" (Likely supports MFA)`,
      meta: {
        method: "sso-detection",
        ssoFound
      },
      analysis: null
    };
  }

  return {
    score: 50,
    status: "warning",
    details: "No visible MFA/2FA indicators found on login page",
    meta: {},
    analysis: {
      cause: "Could not detect explicit Multi-Factor Authentication (MFA) or SSO options on the entry page.",
      recommendation: "Ensure MFA is available and enforced for sensitive accounts. If it is a post-login step, this check may miss it."
    }
  };
}

function skippedResult(label, error) {
  return {
    score: 0,
    status: error ? "error" : "skipped",
    details: error ? `${label}: check could not be completed` : `${label}: skipped`,
    meta: { skipped: true, ...(error ? { error } : {}) },
    analysis: null,
  };
}

export default async function securityCompliance(url, page, response, browser) {
  const domain = Domain(url);

  // Per-check guard: a single failing check must NEVER null the whole Security section.
  // On error / non-result it returns a "skipped" placeholder, which the scoring loop ignores.
  const safe = async (fn, label) => {
    try {
      const r = await fn();
      return (r && typeof r === "object" && typeof r.score === "number") ? r : skippedResult(label);
    } catch (e) {
      console.warn(`[Security] ${label} check failed: ${e?.message || e}`);
      return skippedResult(label, e?.message || String(e));
    }
  };

  try {
    // ── Probes run CONCURRENTLY, KEYED by name so toggling any probe on/off can NEVER
    // misalign results (the old positional destructuring was the recurring bug). Comment a
    // line out to disable a probe — it'll simply show as "skipped", nothing else breaks. ──
    const PROBES = [
      ["ssl",          () => checkSSLConnection(response)],
      ["tls",          () => checkTLSVersion(response)],
      // ["safeBrowsing", () => checkGoogleSafeBrowsing(url)],
      // ["blacklist",    () => checkDomainBlacklist(domain, url)], // disabled (duplicates SafeBrowsing + VirusTotal)
      // ["malware",      () => checkVirusTotal(domain)],
      ["adminPanel",   () => checkAdminPanelPublic(url)],
      // ["sqli",         () => checkSQLiExposure(url)],            // disabled (active-attack probe)
      // ["xss",          () => checkXSS(url, browser)],            // disabled (active-attack probe)
    ];
    const probeResults = {};
    const probesPromise = Promise.all(
      PROBES.map(async ([key, fn]) => { probeResults[key] = await safe(fn, key); })
    );

    // ── Synchronous header checks (instant) — guarded just in case ──
    const httpsResult = await safe(() => checkHTTPS(url), "HTTPS");
    const hstsResult = await safe(() => checkHSTS(response), "HSTS");
    const xFrameOptionsResult = await safe(() => checkXFrameOptions(response), "X-Frame-Options");
    const cspResult = await safe(() => checkCSP(response), "CSP");
    const xContentTypeOptionsResult = await safe(() => checkXContentTypeOptions(response), "X-Content-Type-Options");

    // ── Page-based checks: sequential so the cookie-consent navigation can't race the reads. ──
    const cookieSecureResult = await safe(() => checkCookiesSecureFlag(page), "Cookies Secure");
    const cookieHttpOnlyResult = await safe(() => checkCookiesHttpOnlyFlag(page), "Cookies HttpOnly");
    const thirdPartyCookiesResult = await safe(() => checkThirdPartyCookies(url, page), "Third-Party Cookies");
    const cookieConsentResult = await safe(() => checkCookieConsent(page), "Cookie Consent");
    const privacyPolicyResult = await safe(() => checkPrivacyPolicy(page), "Privacy Policy");
    const gdprCcpaResult = await safe(() => checkGDPRCCPA(page), "GDPR/CCPA");
    const dataCollectionResult = await safe(() => checkDataCollection(page), "Data Collection");
    const formsUseHTTPSResult = await safe(() => checkFormsUseHTTPS(page), "Forms Use HTTPS");
    const weakDefaultCredsResult = await safe(() => checkWeakDefaultCredentials(page), "Weak Default Credentials");
    const mfaEnabledResult = await safe(() => checkMFAEnabled(page), "MFA Enabled");

    // ── Await the concurrent probes, then pull results BY KEY (never by position). ──
    // Any probe that's disabled/absent falls back to a "skipped" placeholder, so the results
    // object can never contain `undefined` regardless of which probes are enabled.
    await probesPromise;
    const sslResult = probeResults.ssl || skippedResult("SSL");
    const tlsVersionResult = probeResults.tls || skippedResult("TLS Version");
    const safeBrowsingResult = probeResults.safeBrowsing || skippedResult("Safe Browsing");
    const blacklistResult = probeResults.blacklist || skippedResult("Blacklist");
    const malwareScanResult = probeResults.malware || skippedResult("Malware Scan");
    const adminPanelPublicResult = probeResults.adminPanel || skippedResult("Admin Panel");
    const sqliExposureResult = probeResults.sqli || skippedResult("SQLi Exposure");
    const xssVulnerabilityResult = probeResults.xss || skippedResult("XSS");

  // Weights: Critical=10, Severe=8-9, High=7, Medium=4-6, Low=1-3
  const weights = {
    // Critical Infrastructure & Vulnerabilities
    HTTPS: 10,
    SSL: 10,
    SQLi_Exposure: 10,
    XSS: 10,
    Weak_Default_Credentials: 10,
    Google_Safe_Browsing: 10,
    Blacklist: 10,
    Malware_Scan: 10,

    // Severe Risks
    Admin_Panel_Public: 9,
    Forms_Use_HTTPS: 8,
    CSP: 8,

    // High Importance / Best Practices
    TLS_Version: 7,
    HSTS: 7,
    Cookies_Secure: 7,
    Cookies_HttpOnly: 7,

    // Medium Importance / Defense in Depth
    MFA_Enabled: 6,
    X_Frame_Options: 5,
    X_Content_Type_Options: 5,

    // Compliance & Privacy
    Cookie_Consent: 4,
    GDPR_CCPA: 4,
    Privacy_Policy: 4,

    // Low / Informational
    Data_Collection: 3,
    Third_Party_Cookies: 3,
  };

  const results = {
    HTTPS: httpsResult,
    SSL: sslResult,
    HSTS: hstsResult,
    TLS_Version: tlsVersionResult,
    X_Frame_Options: xFrameOptionsResult,
    CSP: cspResult,
    X_Content_Type_Options: xContentTypeOptionsResult,
    Cookies_Secure: cookieSecureResult,
    Cookies_HttpOnly: cookieHttpOnlyResult,
    Google_Safe_Browsing: safeBrowsingResult,
    Blacklist: blacklistResult,
    Malware_Scan: malwareScanResult,
    SQLi_Exposure: sqliExposureResult,
    XSS: xssVulnerabilityResult,
    Cookie_Consent: cookieConsentResult,
    Privacy_Policy: privacyPolicyResult,
    Forms_Use_HTTPS: formsUseHTTPSResult,
    GDPR_CCPA: gdprCcpaResult,
    Data_Collection: dataCollectionResult,
    Weak_Default_Credentials: weakDefaultCredsResult,
    MFA_Enabled: mfaEnabledResult,
    Admin_Panel_Public: adminPanelPublicResult,
    Third_Party_Cookies: thirdPartyCookiesResult,
  };

  let totalWeightedScore = 0;
  let maxWeightedScore = 0;

  for (const key in results) {
    const result = results[key];
    // Ignore disabled (skipped) checks and guard against any missing result so the whole
    // section can never crash on one bad/absent check.
    if (!result || result.meta?.skipped) continue;
    const weight = weights[key] || 1;
    totalWeightedScore += (result.score || 0) * weight;
    maxWeightedScore += 100 * weight;
  }

  const totalPercentage = maxWeightedScore > 0
    ? parseFloat(((totalWeightedScore / maxWeightedScore) * 100).toFixed(0))
    : 0;

  return {
    Percentage: totalPercentage,
    HTTPS: httpsResult,
    SSL: sslResult,
    HSTS: hstsResult,
    TLS_Version: tlsVersionResult,
    X_Frame_Options: xFrameOptionsResult,
    CSP: cspResult,
    X_Content_Type_Options: xContentTypeOptionsResult,
    Cookies_Secure: cookieSecureResult,
    Cookies_HttpOnly: cookieHttpOnlyResult,
    Google_Safe_Browsing: safeBrowsingResult,
    Blacklist: blacklistResult,
    Malware_Scan: malwareScanResult,
    SQLi_Exposure: sqliExposureResult,
    XSS: xssVulnerabilityResult,
    Cookie_Consent: cookieConsentResult,
    Privacy_Policy: privacyPolicyResult,
    Forms_Use_HTTPS: formsUseHTTPSResult,
    GDPR_CCPA: gdprCcpaResult,
    Data_Collection: dataCollectionResult,
    Weak_Default_Credentials: weakDefaultCredsResult,
    MFA_Enabled: mfaEnabledResult,
    Admin_Panel_Public: adminPanelPublicResult,
    Third_Party_Cookies: thirdPartyCookiesResult,
  };
  } catch (fatalErr) {
    // Absolute last resort: this metric must NEVER throw. Return a minimal valid result so the
    // Security section renders (degraded) instead of showing "Section data unavailable".
    console.error(`[Security] fatal error: ${fatalErr?.message || fatalErr}`);
    return { Percentage: 0, error: fatalErr?.message || String(fatalErr) };
  }
}
