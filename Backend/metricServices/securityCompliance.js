securityCompliance.mjs
import dotenv from "dotenv";
import fetch from "node-fetch";
import { URL } from "url";
import { waitForChallengeResolution } from "../utils/puppeteer_cheerio.js";
import configService from "../services/configService.js";
import { collectTrackingData, checkGA4Installed, checkGTMConfiguration, checkConversionTracking } from "./conversionLeadFlow.js";

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

// Domain Blacklist
async function checkDomainBlacklist(domain, url) {
  const [googleSafeBrowsing, virusTotal] = await Promise.all([
    checkGoogleSafeBrowsing(url),
    checkVirusTotal(domain),
  ]);

  const isGoogleSafe = googleSafeBrowsing.status === "pass";
  const isVirusTotalSafe = virusTotal.status === "pass";
  const allSafe = isGoogleSafe && isVirusTotalSafe;

  let details = "Domain not found in blacklists";
  if (!allSafe) {
    if (!isGoogleSafe && !isVirusTotalSafe) details = "Domain found in both Google Safe Browsing and VirusTotal blacklists";
    else if (!isGoogleSafe) details = "Domain found in Google Safe Browsing blacklist";
    else details = "Domain found in VirusTotal blacklist";
  }

  return {
    score: allSafe ? 100 : 0,
    status: allSafe ? "pass" : "fail",
    details,
    meta: {
      googleSafeBrowsing,
      virusTotal
    },
    analysis: allSafe ? null : {
      cause: "The domain or URL is listed in one or more security blacklists (Google Safe Browsing or VirusTotal).",
      recommendation: "Review the detailed reports from Google and VirusTotal. Request a review from the respective services after cleaning up any malware or security issues."
    }
  };
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
          details: `SQL injection vulnerability detected with payload: ${p}`,
          meta: {
            payload: p,
            param: param
          },
          analysis: {
            cause: "The application exposed a database error message in response to the injected payload.",
            recommendation: "Ensure all user inputs are sanitized and use parameterized queries (Prepared Statements) to prevent SQL injection."
          }
        };
      }

      // Check for significant content length difference (heuristic for blind SQLi)
      if (baselineLength > 0 && length > 0) {
        const diff = Math.abs(length - baselineLength) / baselineLength;
        if (diff >= lengthDiffThreshold && res.status >= 200 && res.status < 400) {
          return {
            score: 0,
            status: "fail",
            details: `Significant response length difference with payload: ${p}`,
            meta: {
              payload: p,
              param: param,
              diff: diff
            },
            analysis: {
              cause: "Response length changed significantly with SQL injection payload, suggesting potential blind SQL injection.",
              recommendation: "Ensure application handles invalid input gracefully without altering response structure unpredictably."
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
];

function matchFinanceProvider(haystack) {
  if (!haystack) return null;
  const h = String(haystack).toLowerCase();
  for (const p of FINANCE_PROVIDERS) {
    if (p.patterns.some((s) => h.includes(s))) return p.name;
  }
  return null;
}

// Find the finance / credit-application page from the homepage links.
async function discoverFinanceUrl(page) {
  try {
    return await page.evaluate(() => {
      const bad = (raw) => /^(mailto:|tel:|javascript:|#)/i.test(raw || "");
      const kw = /financ|credit[-_ ]?app|get[-_ ]?approved|pre[-_ ]?approv|apply.*financ|auto.*loan/i;
      const links = Array.from(document.querySelectorAll("a[href]"))
        .map((a) => ({ href: a.href, raw: a.getAttribute("href") || "", text: (a.textContent || "").trim().toLowerCase() }))
        .filter((l) => l.href && !bad(l.raw));
      const byHref = links.find((l) => /financ|credit[-_ ]?app|pre[-_ ]?approv|get[-_ ]?approved/i.test(l.href));
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
          const isFinancePage = financeKw.some((k) => hay.includes(k));

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

          return { protocol: location.protocol, isFinancePage, forms, fieldTokens, providerHaystack, hasPrivacy, hasTerms, secureMessaging };
        });
        if (d && d.isFinancePage) { data = d; meta.checkedUrl = scanPage.url(); break; }
      } catch (e) {
        continue;
      }
    }

    if (!data) {
      // No finance / credit-application page → Not Applicable (neutral score).
      meta.rawScore = 0;
      meta.missingPoints = 0;
      return {
        score: 100,
        status: "not_applicable",
        details: "No finance / credit application page found on the site",
        meta,
        analysis: null,
      };
    }

    meta.financePageFound = true;

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

    meta.breakdown = [
      {
        label: "Page served over HTTPS",
        points: POINTS.https,
        earned: meta.httpsSecure,
        detail: meta.httpsSecure ? "Finance page loads over HTTPS." : "Serve the finance / credit-application page over HTTPS with a valid SSL certificate.",
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
        label: "Trusted finance provider",
        points: POINTS.provider,
        earned: meta.detectedProviders.length > 0,
        detail: meta.detectedProviders.length ? `Detected: ${meta.detectedProviders.join(", ")}` : "No trusted finance / lending provider detected. Process credit applications through a PCI-compliant provider (RouteOne, Dealertrack, CreditIQ, Stripe, PayPal).",
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
    let status, details, analysis;
    if (rawScore >= 8) {
      status = "pass";
      details = `Finance form security is strong — ${rawScore}/10${where}`;
      analysis = null;
    } else if (rawScore >= 5) {
      status = "warning";
      details = `Finance form security is partial — ${rawScore}/10${where}`;
      analysis = {
        cause: "The finance / credit-application page is missing one or more PCI best practices (see the per-item breakdown).",
        recommendation: "Address the unearned items: enforce HTTPS end-to-end, delegate sensitive data to a PCI-compliant provider, and add clear privacy/terms/secure-application messaging.",
      };
    } else {
      status = "fail";
      details = `Finance form security is weak — ${rawScore}/10${where}`;
      analysis = {
        cause: "The finance / credit-application page collects or submits financial data without adequate PCI safeguards.",
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

export default async function securityCompliance(url, page, response, browser) {

  const domain = Domain(url);
  const httpsResult = checkHTTPS(url);
  const sslResult = await checkSSLConnection(response);
  const tlsVersionResult = await checkTLSVersion(response);
  const hstsResult = checkHSTS(response);

  const xFrameOptionsResult = checkXFrameOptions(response);
  const cspResult = checkCSP(response);
  const xContentTypeOptionsResult = checkXContentTypeOptions(response);

  const cookieSecureResult = await checkCookiesSecureFlag(page);
  const cookieHttpOnlyResult = await checkCookiesHttpOnlyFlag(page);
  const thirdPartyCookiesResult = await checkThirdPartyCookies(url, page);

  const safeBrowsingResult = await checkGoogleSafeBrowsing(url);
  const blacklistResult = await checkDomainBlacklist(domain, url);
  const malwareScanResult = await checkVirusTotal(domain);

  const sqliExposureResult = await checkSQLiExposure(url);

  const cookieConsentResult = await checkCookieConsent(page);
  const privacyPolicyResult = await checkPrivacyPolicy(page);
  const gdprCcpaResult = await checkGDPRCCPA(page);
  const dataCollectionResult = await checkDataCollection(page);

  const formsUseHTTPSResult = await checkFormsUseHTTPS(page);
  const weakDefaultCredsResult = await checkWeakDefaultCredentials(page, browser);
  const mfaEnabledResult = await checkMFAEnabled(page);
  const adminPanelPublicResult = await checkAdminPanelPublic(url);

  const xssVulnerabilityResult = await checkXSS(url, browser);

  const crmIntegrationResult = await checkCRMIntegration(url, page, browser);

  const financeFormSecurityResult = await checkFinanceFormSecurity(url, page, browser);

  // Analytics & conversion tracking — shown in the Security section for visibility.
  // These are DISPLAY-ONLY here (not added to `results`/weights below) so they
  // don't distort the security score with non-security signals. The same checks
  // are scored in the Conversion & Lead Flow module.
  let ga4Result = null, gtmResult = null, conversionTrackingResult = null;
  try {
    const trackingData = await collectTrackingData(page);
    ga4Result = checkGA4Installed(trackingData);
    gtmResult = checkGTMConfiguration(trackingData);
    conversionTrackingResult = checkConversionTracking(trackingData);
  } catch (e) {
    // Tracking detection is best-effort; never fail the security audit over it.
  }

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

    // Business Integration (Lead Transfer)
    CRM_Integration: 5,

    // Finance / PCI
    Finance_Form_Security: 7,
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
    CRM_Integration: crmIntegrationResult,
    Finance_Form_Security: financeFormSecurityResult,
  };

  let totalWeightedScore = 0;
  let maxWeightedScore = 0;

  for (const key in results) {
    const weight = weights[key] || 1;
    const result = results[key];
    totalWeightedScore += (result.score || 0) * weight;
    maxWeightedScore += 100 * weight;
  }

  const totalPercentage = parseFloat(((totalWeightedScore / maxWeightedScore) * 100).toFixed(0));

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
    CRM_Integration: crmIntegrationResult,
    Finance_Form_Security: financeFormSecurityResult,
    // Display-only (not part of the weighted security score)
    GA4_Installed: ga4Result,
    GTM_Configuration: gtmResult,
    Conversion_Tracking: conversionTrackingResult,
  };


}
