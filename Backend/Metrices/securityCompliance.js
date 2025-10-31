securityCompliance.mjs
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { URL } from "url";
import SiteReport from "../Model/SiteReport.js";

dotenv.config();
puppeteer.use(StealthPlugin());

const safeBrowsingAPI = process.env.SafeBrowsing;
const VT_KEY = process.env.vt_key;

// Security/Compliance (HTTPS / SSL)
function checkHTTPS(url) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "https:" ? 1 : 0;
  } catch {
    return 0;
  }
}

function checkSSLDetails(response){

  const securityDetails = response.securityDetails();

      const expiryDate = new Date(securityDetails.validTo * 1000);
      const certificateValid = expiryDate > new Date() ? 1 : 0;
      const tls = securityDetails.protocol(); // e.g., "TLS 1.3"
      const tlsVersion = tls.includes('1.2') || tls.includes('1.3') ? 1 : 0;
    

    const headers = response.headers();
    const hstsEnabled = headers['strict-transport-security'] ? 1 : 0;
    const xFrameOptions = headers['x-frame-options'] ? 1 : 0;
    const contentSecurityPolicy = headers['content-security-policy'] ? 1 : 0;
    const xContentTypeOptions = headers['x-content-type-options'] ? 1 : 0;
    
    return {
      certificateValid,tlsVersion,hstsEnabled,xFrameOptions,contentSecurityPolicy,xContentTypeOptions
    }
}

// Security/Compliance (Security Headers)
async function checkCookiesSecure(page) {

  try {
    const cookies = await page.cookies();
    if (!cookies.length) {
      return { cookies: [], hasSecure: false, hasHttpOnly: false };
    }
    const hasSecure = cookies.some((c) => c.secure);
    const hasHttpOnly = cookies.some((c) => c.httpOnly);

    return { cookies, hasSecure, hasHttpOnly };
  } catch (err) {
    return { cookies: [], hasSecure: false, hasHttpOnly: false };
  }
}

// Security/Compliance (Vulnerability / Malware Check)
function Domain(urlString) {
  const u = new URL(urlString);
  let host = u.hostname;
  if (host.startsWith("www.")) host = host.slice(4);
  return host;
}
async function checkGoogleSafeBrowsing(url) {
  if (!safeBrowsingAPI) return false;
  try {
    const endpoint = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${safeBrowsingAPI}`;
    const body = {
      client: { clientId: "myapp", clientVersion: "1.0" },
      threatInfo: {
        threatTypes: ["MALWARE"],
        platformTypes: ["ANY_PLATFORM"],
        threatEntryTypes: ["URL"],
        threatEntries: [{ url }],
      },
    };
    const res = await fetch(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });
    const j = await res.json();
    return !j.matches;
  } catch {
    return false;
  }
}

async function checkVirusTotal(domain) {
  try {
    if (!VT_KEY) return false;
    const endpoint = `https://www.virustotal.com/api/v3/domains/${domain}`;
    const res = await fetch(endpoint, { headers: { "x-apikey": VT_KEY } });
    if (!res.ok) return false;
    const j = await res.json();
    const stats = j?.data?.attributes?.last_analysis_stats || {};
    return stats.malicious && stats.malicious > 0 ? 0 : 1;
  } catch {
    return false;
  }
}

async function checkDomainBlacklist(domain, url) {
  const [g, v] = await Promise.all([
    checkGoogleSafeBrowsing(url),
    checkVirusTotal(domain),
  ]);
  return g || v ? 1 : 0;
}

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

  let url;
  try {
    url = new URL(urlString);
  } catch {
    return 1;
  }

  async function fetchBody(u) {
    try {
      const res = await fetch(u.toString(), { redirect: "follow", timeout });
      const text = await res.text();
      return { status: res.status, text };
    } catch {
      return { status: 0, text: "" };
    }
  }

  const baseline = await fetchBody(url);
  const baselineText = baseline.text || "";
  const baselineLength = baselineText.length || 0;

  const params = Array.from(url.searchParams.keys());
  const testParams = params.length ? params : ["q"];

  for (const param of testParams) {
    for (const p of payloads) {
      const testUrl = new URL(url);
      testUrl.searchParams.set(param, p);

      const res = await fetchBody(testUrl);
      const body = res.text || "";
      const length = body.length || 0;

      if (looksLikeSQLError(body)) return 0;
      if (baselineLength > 0) {
        const diff = Math.abs(length - baselineLength) / baselineLength;
        if (diff >= lengthDiffThreshold) return 0;
      } else {
        if (length > 0) return 0;
      }
      if (res.status === 500) return 0;
    }
  }

  return 1;
}

async function checkXSS(url,browser) {
  try {
    const payload = `<script>alert(1)</script>`;
    const testUrl = url.includes("?")
      ? `${url}&xss=${encodeURIComponent(payload)}`
      : `${url}?xss=${encodeURIComponent(payload)}`;

    const testURLPage = await browser.newPage()  
    await testURLPage.goto(testUrl, { waitUntil: "networkidle2", timeout: 360000 });
    await testURLPage.waitForSelector("body", { timeout: 360000 });
    testURLPage.close()
    const html = await page.content();
    return html.toLowerCase().includes(payload.toLowerCase()) ? 0 : 1;
  } catch {
    return 0;
  }
}

// Security/Compliance (Privacy & Compliance)
async function checkCookieConsent(page) {
  try {
    const consentSelectors = [
      "[id*=cookie]",
      "[class*=cookie]",
      "[id*=consent]",
      "[class*=consent]",
      "[aria-label*=cookie]",
      "[data-cookie-banner]",
    ];

    for (const selector of consentSelectors) {
      const exists = await page.$(selector);
      if (exists) {
        return 1;
      }
    }
    return 0;
  } catch (err) {
    return 0;
  }
}

async function checkPrivacyPolicy(page) {
  try {
    const links = await page.$$eval("a", (anchors) =>
      anchors.map((a) => (a.href || "").toLowerCase())
    );
    const privacyPatterns = ["privacy", "privacy-policy", "privacy_policy"];
    const found = links.some((link) =>
      privacyPatterns.some((pattern) => link.includes(pattern))
    );
    return found ? 1 : 0;
  } catch (err) {
    return 0;
  }
}

async function checkFormsUseHTTPS(page) {
  try {
    const forms = await page.$$eval("form", (forms) =>
      forms.map((f) => f.getAttribute("action") || "")
    );

    if (!forms.length) return 1;

    const allHttps = forms.every((action) => {
      if (!action || action.startsWith("/")) return true;
      try {
        return new URL(action).protocol === "https:";
      } catch {
        return false;
      }
    });

    return allHttps ? 1 : 0;
  } catch (err) {
    return 0;
  }
}

async function checkGDPRCCPA(page) {
  try {
    // Common selectors for GDPR/CCPA consent banners
    const consentSelectors = [
      "[id*=gdpr]",
      "[class*=gdpr]",
      "[id*=cookie]",
      "[class*=cookie]",
      "[id*=consent]",
      "[class*=consent]",
      "[aria-label*=cookie]",
      "[data-cookie-banner]",
      "[id*=ccpa]",
      "[class*=ccpa]",
      "[data-ccpa-consent]",
    ];

    for (const selector of consentSelectors) {
      const exists = await page.$(selector);
      if (exists) {
        return 1; // GDPR/CCPA notice present
      }
    }

    return 0; // Not present
  } catch (err) {
    return 0; // On error, treat as not present
  }
}

async function checkDataCollection(page) {
  try {
    // Get all anchor hrefs
    const links = await page.$$eval("a", (anchors) =>
      anchors.map((a) => (a.href || "").toLowerCase())
    );

    // Keywords for data collection disclosure
    const dataKeywords = [
      "data-collection",
      "data-usage",
      "how we collect data",
      "information we collect",
      "personal information",
      "user data",
      "privacy",
      "terms-of-service",
      "terms-of-use",
      "cookies",
    ];

    const found = links.some((link) =>
      dataKeywords.some((keyword) => link.includes(keyword))
    );
    return found ? 1 : 0; // 1 if disclosure found, else 0
  } catch (err) {
    return 0; // Treat errors as not disclosed
  }
}

// Security/Compliance ( Authentication & Access Control)
async function checkAdminPanelPublic(baseUrl, options = {}) {
  const {
    timeout = 10000, // ms per request
    maxBodyChars = 20000, // only read first N chars for detection
  } = options;

  // candidate admin paths (add/remove as you need)
  const adminPaths = [
    "/admin",
    "/admin/login",
    "/administrator",
    "/administrator/index.php",
    "/user",
    "/users",
    "/login",
    "/wp-admin/",
    "/wp-login.php",
    "/cms",
    "/manage",
    "/backend",
    "/controlpanel",
    "/control-panel",
    "/admin.php",
    "/admin/login.php",
    "/adminpanel",
    "/admin-console",
    "/phpmyadmin/",
    "/pma/",
    "/dbadmin/",
    "/sqladmin/",
  ];

  // common keywords that indicate admin/login pages
  const adminKeywords = [
    "wp-login.php",
    "wordpress",
    "phpmyadmin",
    "phpmyadmin",
    "administrator",
    "admin panel",
    "admin login",
    "sign in",
    "sign-in",
    "login",
    "username",
    "user name",
    "password",
    "enter password",
    "panel",
    "control panel",
    "manage",
  ];

  function looksLikeAdmin(body, urlChecked) {
    if (!body) return false;
    const low = body.slice(0, maxBodyChars).toLowerCase();
    if (adminKeywords.some((kw) => low.includes(kw))) return true;
    // also check url path hints
    if (adminPaths.some((p) => urlChecked.toLowerCase().endsWith(p.replace(/\/$/, "")))) return true;
    return false;
  }

  // build origin and ensure trailing slash handling
  let origin;
  try {
    const u = new URL(baseUrl);
    origin = `${u.protocol}//${u.host}`;
  } catch {
    // invalid URL -> treat as safe
    return 1;
  }

  // helper to fetch with timeout
  async function fetchWithTimeout(url) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
      const res = await fetch(url, { redirect: "follow", signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (err) {
      clearTimeout(id);
      return null;
    }
  }

  for (const path of adminPaths) {
    // ensure we don't produce double slashes
    const tryUrl = new URL(path, origin).toString();

    const res = await fetchWithTimeout(tryUrl);
    if (!res) continue; // network error/timeout -> skip

    // If redirected to another location (login pages often redirect), consider it reachable
    if (res.redirected) {
      // fetch the final URL body small sample to inspect
      try {
        const txt = await res.text();
        if (looksLikeAdmin(txt, res.url)) return 0;
      } catch {
        return 0; // redirected and reachable -> consider exposed
      }
    }

    // handle status codes
    const status = res.status;

    // 401/403 -> requires auth or blocked => treat as not publicly accessible
    if (status === 401 || status === 403) {
      continue;
    }

    // 200 => may be login/admin page, read body and check keywords
    if (status === 200) {
      let body = "";
      try {
        body = await res.text();
      } catch {
        body = "";
      }
      if (looksLikeAdmin(body, tryUrl)) {
        return 0; // publicly reachable admin/login detected
      } else {
        // some sites return generic 200 but not admin — keep checking others
        continue;
      }
    }

    // other statuses (404, 301, 302 handled above via redirected) -> skip
  }

  // no admin endpoints found as publicly reachable
  return 1;
}

async function checkWeakDefaultCredentials(page) {
  try {
    // 1) quick page text scan for explicit "default credentials" mentions
    const pageText = await page.evaluate(() => document.documentElement.innerText || "");
    const lowText = (pageText || "").toLowerCase();
    const explicitIndicators = [
      "default password",
      "default credentials",
      "username: admin",
      "password: admin",
      "admin/admin",
      "demo login",
      "test credentials",
      "login with admin",
      "use admin",
    ];
    if (explicitIndicators.some((kw) => lowText.includes(kw))) {
      return 0;
    }

    // 2) find login forms (forms that contain an input[type=password])
    const forms = await page.$$eval("form", (forms) =>
      forms.map((f) => {
        const inputs = Array.from(f.querySelectorAll("input")).map((i) => ({
          name: i.getAttribute("name") || "",
          id: i.getAttribute("id") || "",
          type: i.getAttribute("type") || "",
          placeholder: i.getAttribute("placeholder") || "",
          value: i.getAttribute("value") || "",
          autocomplete: i.getAttribute("autocomplete") || "",
        }));
        return {
          action: f.getAttribute("action") || "",
          method: (f.getAttribute("method") || "get").toLowerCase(),
          inputs,
          html: f.innerHTML.slice(0, 2000), // small sample
        };
      })
    );

    // If no forms, that's fine (no direct login form)
    for (const form of forms) {
      // does the form have a password field?
      const hasPassword = form.inputs.some((i) => (i.type || "").toLowerCase() === "password");
      if (!hasPassword) continue;

      // check for CSRF token style fields (name contains csrf, token, _token, auth)
      const hasCsrf = form.inputs.some((i) =>
        /csrf|token|authenticity_token|_token|anti_csrf/i.test(i.name + " " + i.id)
      );

      // check for captcha presence in form html or page (recaptcha iframe, captcha text etc.)
      const captchaPresent =
        /recaptcha|g-recaptcha|captcha|hcaptcha|data-sitekey/i.test(form.html) ||
        /recaptcha|g-recaptcha|captcha|hcaptcha|data-sitekey/i.test(lowText);

      // check username-like input placeholders/values that equal common defaults
      const usernameDefaults = ["admin", "root", "administrator", "user", "test"];
      const usernamePreset = form.inputs.some((i) =>
        usernameDefaults.includes((i.value || i.placeholder || "").toLowerCase())
      );

      // check if form action points to suspicious known endpoints
      const actionLower = (form.action || "").toLowerCase();
      const adminActionIndicators = ["wp-login.php", "phpmyadmin", "pma", "/admin", "/login"];

      const actionLooksAdmin = adminActionIndicators.some((s) => actionLower.includes(s));

      // Heuristics: flag if login form exists AND:
      //  - username preset to 'admin' OR
      //  - no CSRF token AND no captcha (makes brute forcing/default creds easier) OR
      //  - action looks like common admin endpoint
      if (usernamePreset) {
        return 0;
      }

      if (!hasCsrf && !captchaPresent) {
        // no CSRF and no captcha — higher chance weak/default creds could be exploited
        return 0;
      }

      if (actionLooksAdmin) {
        // exposed admin login endpoint present
        return 0;
      }
    }

    // 3) Inspect headers for WWW-Authenticate (basic auth) — weaker check via fetch to origin
    try {
      // use page's location origin
      const origin = await page.evaluate(() => location.origin);
      const headRes = await fetch(origin, { method: "HEAD", redirect: "follow" });
      const wwwAuth = headRes.headers.get("www-authenticate") || "";
      if (wwwAuth) {
        // presence of Basic auth does not mean weak creds, but we flag for review
        return 0;
      }
    } catch (e) {
      // non-fatal; ignore
    }

    // 4) If we reached here, no obvious passive indicators found
    return 1;
  } catch (err) {
    // on error treat as safe (1) — or you may choose to return 0 to be conservative
    return 1;
  }
}

async function checkMFAEnabled(page) {
  try {
    // Find all login forms
    const forms = await page.$$eval("form", (forms) =>
      forms.map((f) => ({
        inputs: Array.from(f.querySelectorAll("input")).map(i => ({
          type: i.type,
          placeholder: i.placeholder || "",
          name: i.name || ""
        })),
        text: f.innerText || ""
      }))
    );

    for (const form of forms) {
      const hasPassword = form.inputs.some(i => i.type === "password");
      if (!hasPassword) continue;

      // Heuristic: look for MFA keywords in text or input names/placeholder
      const text = form.text.toLowerCase();
      const inputsText = form.inputs.map(i => (i.placeholder + i.name).toLowerCase()).join(" ");

      const mfaKeywords = ["otp", "two-factor", "2fa", "authenticator", "verification code", "mfa"];
      if (mfaKeywords.some(k => text.includes(k) || inputsText.includes(k))) {
        return 1; // MFA enabled
      }
    }
    return 0; // MFA not detected
  } catch (err) {
    return 0; // on error, assume not detected
  }
}

// Lighthouse
async function checkViewportMetaTag(page) {

  // Evaluate in the browser context
  const hasViewport = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return 0; // no viewport tag found

    const content = meta.getAttribute("content") || "";
    // check for "width=" or "initial-scale="
    if (content.includes("width=") || content.includes("initial-scale=")) {
      return 1; // valid
    } else {
      return 0; // missing width or scale
    }
  });

  return hasViewport;
}

async function checkHtmlDoctype(page) {
  // Evaluate in the page context
  const hasDoctype = await page.evaluate(() => {
    const dt = document.doctype;
    if (!dt) return 0; // no doctype
    // Check if it's <!DOCTYPE html>
    return dt.name.toLowerCase() === "html" ? 1 : 0;
  });

  return hasDoctype;
}

async function checkCharsetDefined(page) {

  let hasHeaderCharset = 0;

  // Listen for response headers to detect charset
  page.on("response", (response) => {
    const headers = response.headers();
    const contentType = headers["content-type"];
    if (contentType && contentType.toLowerCase().includes("charset=")) {
      hasHeaderCharset = 1;
    }
  });

  // Check <meta charset> tag in HTML
  const hasMetaCharset = await page.evaluate(() => {
    const meta = document.querySelector("meta[charset]");
    return meta ? 1 : 0;
  });

  // Pass if either HTML or HTTP header defines charset
  const result = hasMetaCharset || hasHeaderCharset ? 1 : 0;
  return result;
}

async function checkNoBrowserErrors(page) {

  let hasConsoleErrors = 0;

  // Listen for console messages
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      hasConsoleErrors = 1;
    }
  });

  // Also listen for runtime exceptions (JS errors)
  page.on("pageerror", () => {
    hasConsoleErrors = 1;
  });

  // Return 1 if no errors, 0 if errors found
  return hasConsoleErrors ? 0 : 1;
}

async function checkGeolocationRequest(url,page) {

  let geolocationRequested = 0;

  // Create CDP session to listen to permission requests
  const client = await page.target().createCDPSession();
  await client.send("Browser.grantPermissions", {
    origin: url,
    permissions: [], // initially no permissions granted
  });

  client.on("Permission.requested", (event) => {
    if (event.permissionType === "geolocation") {
      geolocationRequested = 1; // geolocation requested
    }
  });

  // Navigate to the page

  // Return 1 if page does NOT request geolocation (pass), 0 if it does
  return geolocationRequested ? 0 : 1;
}

async function checkInputPasteAllowed(page) {
  // Evaluate in browser context
  const allowsPaste = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input, textarea"));

    for (let input of inputs) {
      // Check for onpaste attribute that blocks pasting
      const onpaste = input.getAttribute("onpaste");
      if (onpaste && onpaste.toLowerCase().includes("return false")) {
        return 0; // Pasting blocked
      }

      // Programmatically test if paste is blocked
      let blocked = false;

      const testEvent = new Event("paste", { bubbles: true, cancelable: true });
      const originalPreventDefault = testEvent.preventDefault.bind(testEvent);

      testEvent.preventDefault = () => {
        blocked = true; // If preventDefault is called, pasting is blocked
        originalPreventDefault();
      };

      input.dispatchEvent(testEvent);

      if (blocked) {
        return 0; // Pasting blocked via JS listener
      }
    }

    return 1; // All inputs allow pasting
  });


  return allowsPaste;
}

async function checkNotificationRequest(page) {

  let notificationRequested = 0;

  // Override Notification.requestPermission to detect requests
  await page.evaluateOnNewDocument(() => {
    const original = Notification.requestPermission;
    Notification.requestPermission = function(...args) {
      window.__notificationRequested = true;
      return original.apply(this, args);
    };
    window.__notificationRequested = false;
  });

  // Check if notification was requested
  const requested = await page.evaluate(() => window.__notificationRequested);
  if (requested) notificationRequested = 1;

  // Return 1 if notifications are NOT requested (pass), 0 if requested
  return notificationRequested ? 0 : 1;
}

async function checkThirdPartyCookies(url,page) {

  let thirdPartyCookieFound = 0;

  // Parse the origin of the page
  const pageOrigin = new URL(url).origin;

  // Intercept responses to check Set-Cookie headers
  page.on("response", async (response) => {
    const headers = response.headers();
    if (headers["set-cookie"]) {
      // Sometimes multiple cookies in one header
      const cookies = headers["set-cookie"].split(",");
      for (let cookie of cookies) {
        // Extract cookie domain if specified
        const domainMatch = cookie.match(/domain=([^;]+)/i);
        const cookieDomain = domainMatch ? domainMatch[1] : null;

        if (cookieDomain && !cookieDomain.includes(new URL(pageOrigin).hostname)) {
          // Cookie domain is different → third-party cookie
          thirdPartyCookieFound = 1;
        }
      }
    }
  });

  // Return 1 if no third-party cookies, 0 if any found
  return thirdPartyCookieFound ? 0 : 1;
}

async function checkDeprecatedAPIs(page) {

  let deprecatedAPIUsed = 0;

  // Listen for console warnings
  page.on("console", (msg) => {
    if (msg.type() === "warning") {
      const text = msg.text().toLowerCase();
      // Some browsers label deprecated APIs in warning messages
      if (text.includes("deprecated") || text.includes("is deprecated")) {
        deprecatedAPIUsed = 1;
      }
    }
  });


  // Return 1 if no deprecated APIs used, 0 if found
  return deprecatedAPIUsed ? 0 : 1;
}

export default async function securityCompliance(url,device,selectedMetric, page, response, browser, auditId) {

  // Security/Compliance (HTTPS / SSL)
  const checkHTTPSScore = checkHTTPS(url);
  const checkSSLDetail = checkSSLDetails(response);
  const checkSSLScore = response.ok() ? 1 : 0;
  const checkSSLCertificateExpiryScore = checkSSLDetail.certificateValid;
  const checkHSTSScore = checkSSLDetail.hstsEnabled;
  const checkTLSVersionScore = checkSSLDetail.tlsVersion;

  // Security/Compliance (Security Headers)
  const checkXFrameOptionsScore = checkSSLDetail.xFrameOptions;
  const checkCSPScore = checkSSLDetail.contentSecurityPolicy;
  const checkXContentTypeOptionsScore = checkSSLDetail.xContentTypeOptions;
  const cookieResult = await checkCookiesSecure(page);
  const checkCookiesSecureScore = cookieResult.hasSecure ? 1 : 0;
  const checkCookiesHttpOnlyScore = cookieResult.hasHttpOnly ? 1 : 0;
  
  // Security/Compliance (Vulnerability / Malware Check)
  const domain = Domain(url);
  const safeBrowsingScore = (await checkGoogleSafeBrowsing(url)) ? 1 : 0;
  const blacklistScore = await checkDomainBlacklist(domain, url);
  const malwareScanScore = await checkVirusTotal(domain);
  const sqliExposureScore = await checkSQLiExposure(url);

  // Security/Compliance (Privacy & Compliance)
  const cookieConsentScore = await checkCookieConsent(page);
  const privacyPolicyScore = await checkPrivacyPolicy(page);
  const formsUseHTTPSScore = await checkFormsUseHTTPS(page);
  const checkGDPRCCPAScore = await checkGDPRCCPA(page);
  const checkDataCollectionScore = await checkDataCollection(page);

  // Security/Compliance ( Authentication & Access Control)
  const weakDefaultCredsScore = await checkWeakDefaultCredentials(page);
  const mfaEnabledScore = await checkMFAEnabled(page);
  const checkAdminPanelPublicScore = await checkAdminPanelPublic(url);

  // Security/Compliance (Vulnerability / Malware Check)
  const xssVulnerabilityScore = await checkXSS(url,browser);

  // Lighthouse
  const checkViewportMetaTagScore = await checkViewportMetaTag(page);
  const checkHtmlDoctypeScore = await checkHtmlDoctype(page);
  const checkCharsetDefinedScore = await checkCharsetDefined(page);
  const checkBrowserErrorsScore = await checkNoBrowserErrors(page);
  const checkGeolocationRequestScore = await checkGeolocationRequest(url,page);
  const checkInputPasteAllowedScore = await checkInputPasteAllowed(page);
  const checkNotificationRequestScore = await checkNotificationRequest(page);
  const checkThirdPartyCookiesScore = await checkThirdPartyCookies(url,page);
  const checkDeprecatedAPIsScore = await checkDeprecatedAPIs(page);

  // Total Score Calculation
const Total = parseFloat((((checkHTTPSScore+checkSSLScore+checkSSLCertificateExpiryScore+checkHSTSScore+checkTLSVersionScore+checkXFrameOptionsScore+checkCSPScore+checkXContentTypeOptionsScore+checkCookiesSecureScore+checkCookiesHttpOnlyScore+cookieConsentScore+privacyPolicyScore+safeBrowsingScore+blacklistScore+malwareScanScore+xssVulnerabilityScore+sqliExposureScore+formsUseHTTPSScore+checkGDPRCCPAScore+checkDataCollectionScore+checkAdminPanelPublicScore+weakDefaultCredsScore+mfaEnabledScore) / 23) * 100).toFixed(0));

// Passed
const passed = [];

// Improvements
const improvements = [];

// Security/Compliance (HTTPS / SSL)
if (checkSSLScore === 0) {
  improvements.push({
    metric: "SSL Reachable",
    current: "SSL connection failed",
    recommended: "Ensure SSL certificate is valid and reachable",
    severity: "High 🔴",
    suggestion: "Check server SSL configuration."
  });
} else {
  passed.push({
    metric: "SSL Reachable",
    current: "SSL reachable",
    recommended: "Ensure SSL certificate is valid and reachable",
    severity: "Pass 🟢",
    suggestion: "SSL connection is properly established."
  });
}

if (checkSSLCertificateExpiryScore === 0) {
  improvements.push({
    metric: "SSL Certificate",
    current: "Expired or invalid",
    recommended: "Valid SSL certificate",
    severity: "High 🔴",
    suggestion: "Renew or configure a valid SSL certificate."
  });
} else {
  passed.push({
    metric: "SSL Certificate",
    current: "Valid",
    recommended: "Valid SSL certificate",
    severity: "Pass 🟢",
    suggestion: "Certificate is valid."
  });
}

if (checkHSTSScore === 0) {
  improvements.push({
    metric: "HSTS",
    current: "Missing",
    recommended: "Enable HSTS",
    severity: "Medium 🟡",
    suggestion: "Add 'Strict-Transport-Security' header."
  });
} else {
  passed.push({
    metric: "HSTS",
    current: "Enabled",
    recommended: "Enable HSTS",
    severity: "Pass 🟢",
    suggestion: "HSTS header is correctly set."
  });
}

if (checkTLSVersionScore === 0) {
  improvements.push({
    metric: "TLS Version",
    current: "Weak TLS",
    recommended: "TLS 1.2 or higher",
    severity: "High 🔴",
    suggestion: "Update server to support TLS 1.2/1.3."
  });
} else {
  passed.push({
    metric: "TLS Version",
    current: "Strong TLS",
    recommended: "TLS 1.2 or higher",
    severity: "Pass 🟢",
    suggestion: "TLS version is up-to-date."
  });
}

// Security/Compliance (Security Headers)
if (checkCookiesSecureScore === 0) {
  improvements.push({
    metric: "Cookies Secure Flag",
    current: "Not set",
    recommended: "Set 'Secure' flag",
    severity: "Medium 🟡",
    suggestion: "Ensure cookies are sent only over HTTPS."
  });
} else {
  passed.push({
    metric: "Cookies Secure Flag",
    current: "Set",
    recommended: "Set 'Secure' flag",
    severity: "Pass 🟢",
    suggestion: "Cookies are secure."
  });
}

if (checkCookiesHttpOnlyScore === 0) {
  improvements.push({
    metric: "Cookies HttpOnly Flag",
    current: "Not set",
    recommended: "Set 'HttpOnly' flag",
    severity: "Medium 🟡",
    suggestion: "Prevent client-side scripts from reading cookies."
  });
} else {
  passed.push({
    metric: "Cookies HttpOnly Flag",
    current: "Set",
    recommended: "Set 'HttpOnly' flag",
    severity: "Pass 🟢",
    suggestion: "Cookies HttpOnly flag is set."
  });
}

// Security/Compliance (Vulnerability / Malware Check)
if (safeBrowsingScore === 0) {
  improvements.push({
    metric: "Google Safe Browsing",
    current: "Unsafe URL detected",
    recommended: "No malware or phishing",
    severity: "High 🔴",
    suggestion: "Clean site and request Google Safe Browsing review."
  });
} else {
  passed.push({
    metric: "Google Safe Browsing",
    current: "Safe",
    recommended: "No malware or phishing",
    severity: "Pass 🟢",
    suggestion: "No threats detected."
  });
}

if (blacklistScore === 0 || malwareScanScore === 0) {
  improvements.push({
    metric: "Domain Blacklist / Malware Scan",
    current: "Flagged or malicious",
    recommended: "Clean domain",
    severity: "High 🔴",
    suggestion: "Remove malware or request delisting from blacklists."
  });
} else {
  passed.push({
    metric: "Domain Blacklist / Malware Scan",
    current: "Safe",
    recommended: "Clean domain",
    severity: "Pass 🟢",
    suggestion: "Domain is not blacklisted and clean."
  });
}

if (sqliExposureScore === 0) {
  improvements.push({
    metric: "SQL Injection Exposure",
    current: "Vulnerable",
    recommended: "Use prepared statements",
    severity: "High 🔴",
    suggestion: "Sanitize inputs and use parameterized queries."
  });
} else {
  passed.push({
    metric: "SQL Injection Exposure",
    current: "Safe",
    recommended: "Use prepared statements",
    severity: "Pass 🟢",
    suggestion: "No SQL injection vulnerability detected."
  });
}

if (xssVulnerabilityScore === 0) {
  improvements.push({
    metric: "Cross-Site Scripting (XSS)",
    current: "Vulnerable",
    recommended: "Sanitize inputs & implement CSP",
    severity: "High 🔴",
    suggestion: "Use proper output encoding and CSP headers."
  });
} else {
  passed.push({
    metric: "Cross-Site Scripting (XSS)",
    current: "Safe",
    recommended: "Sanitize inputs & implement CSP",
    severity: "Pass 🟢",
    suggestion: "No XSS vulnerability detected."
  });
}

if (xssVulnerabilityScore === 0) {
  improvements.push({
    metric: "XSS Vulnerability",
    current: "Vulnerable",
    recommended: "Sanitize all user inputs",
    severity: "High 🔴",
    suggestion: "Implement input validation and output encoding to prevent XSS attacks."
  });
} else {
  passed.push({
    metric: "XSS Vulnerability",
    current: "Safe",
    recommended: "Sanitize all user inputs",
    severity: "Pass 🟢",
    suggestion: "No XSS vulnerability detected."
  });
}

// Security/Compliance (Privacy & Compliance)
if (cookieConsentScore === 0) {
  improvements.push({
    metric: "Cookie Consent",
    current: "Not implemented",
    recommended: "Add cookie consent banner",
    severity: "Low 🟡",
    suggestion: "Implement cookie consent to comply with privacy regulations."
  });
} else {
  passed.push({
    metric: "Cookie Consent",
    current: "Implemented",
    recommended: "Add cookie consent banner",
    severity: "Pass 🟢",
    suggestion: "Cookie consent is present."
  });
}

if (privacyPolicyScore === 0) {
  improvements.push({
    metric: "Privacy Policy",
    current: "Not found",
    recommended: "Provide privacy policy page",
    severity: "Low 🟡",
    suggestion: "Add a privacy policy accessible from site footer."
  });
} else {
  passed.push({
    metric: "Privacy Policy",
    current: "Found",
    recommended: "Provide privacy policy page",
    severity: "Pass 🟢",
    suggestion: "Privacy policy is present."
  });
}

if (formsUseHTTPSScore === 0) {
  improvements.push({
    metric: "Forms Using HTTPS",
    current: "Form actions not secure",
    recommended: "Submit all forms over HTTPS",
    severity: "High 🔴",
    suggestion: "Update form action URLs to use HTTPS to protect data in transit."
  });
} else {
  passed.push({
    metric: "Forms Using HTTPS",
    current: "All forms use HTTPS",
    recommended: "Submit all forms over HTTPS",
    severity: "Pass 🟢",
    suggestion: "Forms are correctly submitted over HTTPS."
  });
}

if (checkGDPRCCPAScore === 0) {
  improvements.push({
    metric: "GDPR/CCPA Notice",
    current: "Not present",
    recommended: "Display GDPR/CCPA consent notice",
    severity: "Medium 🟡",
    suggestion: "Add GDPR/CCPA consent banner for compliance."
  });
} else {
  passed.push({
    metric: "GDPR/CCPA Notice",
    current: "Present",
    recommended: "Display GDPR/CCPA consent notice",
    severity: "Pass 🟢",
    suggestion: "GDPR/CCPA notice is present."
  });
}

if (checkDataCollectionScore === 0) {
  improvements.push({
    metric: "Data Collection Disclosure",
    current: "Not found",
    recommended: "Provide information on data collection",
    severity: "Medium 🟡",
    suggestion: "Add a page detailing what data is collected and how it is used."
  });
} else {
  passed.push({
    metric: "Data Collection Disclosure",
    current: "Found",
    recommended: "Provide information on data collection",
    severity: "Pass 🟢",
    suggestion: "Data collection information is present."
  });
}

// Security/Compliance ( Authentication & Access Control)
if (weakDefaultCredsScore === 0) {
  improvements.push({
    metric: "Weak/Default Credentials",
    current: "Default or weak credentials detected",
    recommended: "Use strong unique passwords",
    severity: "High 🔴",
    suggestion: "Change default passwords and enforce strong password policy."
  });
} else {
  passed.push({
    metric: "Weak/Default Credentials",
    current: "No weak/default credentials detected",
    recommended: "Use strong unique passwords",
    severity: "Pass 🟢",
    suggestion: "Credentials are safe."
  });
}

if (mfaEnabledScore === 0) {
  improvements.push({
    metric: "Multi-Factor Authentication (MFA)",
    current: "Not detected",
    recommended: "Enable MFA for all accounts",
    severity: "Medium 🟡",
    suggestion: "Implement MFA to strengthen authentication security."
  });
} else {
  passed.push({
    metric: "Multi-Factor Authentication (MFA)",
    current: "Detected",
    recommended: "Enable MFA for all accounts",
    severity: "Pass 🟢",
    suggestion: "MFA is enabled."
  });
}

if (checkAdminPanelPublicScore === 0) {
  improvements.push({
    metric: "Admin Panel Accessibility",
    current: "Publicly reachable",
    recommended: "Restrict access to admin panels",
    severity: "High 🔴",
    suggestion: "Protect admin pages with authentication and IP restrictions."
  });
} else {
  passed.push({
    metric: "Admin Panel Accessibility",
    current: "Not publicly accessible",
    recommended: "Restrict access to admin panels",
    severity: "Pass 🟢",
    suggestion: "Admin pages are not exposed to the public."
  });
}

// Lighthouse
if (checkViewportMetaTagScore === 0) {
  improvements.push({
    metric: "Viewport Meta Tag",
    current: "Missing or invalid",
    recommended: "Include a responsive viewport meta tag",
    severity: "High 🔴",
    suggestion: `Add <meta name="viewport" content="width=device-width, initial-scale=1.0"> in the <head> for better mobile compatibility.`
  });
} else {
  passed.push({
    metric: "Viewport Meta Tag",
    current: "Present and valid",
    recommended: "Maintain responsive configuration",
    severity: "Pass 🟢",
    suggestion: "Viewport tag correctly defines width and scale."
  });
}

if (checkHtmlDoctypeScore === 0) {
  improvements.push({
    metric: "HTML Doctype",
    current: "Not defined or incorrect",
    recommended: "Use <!DOCTYPE html>",
    severity: "Medium 🟠",
    suggestion: "Ensure the page starts with <!DOCTYPE html> to trigger standards mode."
  });
} else {
  passed.push({
    metric: "HTML Doctype",
    current: "Valid",
    recommended: "Maintain correct doctype declaration",
    severity: "Pass 🟢",
    suggestion: "Doctype correctly set to HTML5."
  });
}

if (checkCharsetDefinedScore === 0) {
  improvements.push({
    metric: "Character Encoding",
    current: "Undefined",
    recommended: "Define charset in header or meta",
    severity: "Medium 🟠",
    suggestion: "Add <meta charset='UTF-8'> or specify charset in HTTP headers."
  });
} else {
  passed.push({
    metric: "Character Encoding",
    current: "Defined",
    recommended: "Maintain charset definition",
    severity: "Pass 🟢",
    suggestion: "Character encoding properly defined."
  });
}

if (checkBrowserErrorsScore === 0) {
  improvements.push({
    metric: "Browser Console Errors",
    current: "Errors detected",
    recommended: "Fix runtime and console issues",
    severity: "High 🔴",
    suggestion: "Review console errors and JavaScript exceptions to improve stability."
  });
} else {
  passed.push({
    metric: "Browser Console Errors",
    current: "No errors",
    recommended: "Keep code error-free",
    severity: "Pass 🟢",
    suggestion: "No browser or console errors found."
  });
}

if (checkGeolocationRequestScore === 0) {
  improvements.push({
    metric: "Geolocation Request",
    current: "Requests user location",
    recommended: "Avoid unnecessary geolocation prompts",
    severity: "Medium 🟠",
    suggestion: "Request geolocation only when required and explain the purpose clearly to users."
  });
} else {
  passed.push({
    metric: "Geolocation Request",
    current: "No geolocation request",
    recommended: "Maintain privacy standards",
    severity: "Pass 🟢",
    suggestion: "No unnecessary geolocation permissions requested."
  });
}

if (checkInputPasteAllowedScore === 0) {
  improvements.push({
    metric: "Input Paste Allowed",
    current: "Paste restricted",
    recommended: "Allow paste in input fields unless critical",
    severity: "Low 🟡",
    suggestion: "Avoid disabling paste for better user experience unless needed (e.g., OTP fields)."
  });
} else {
  passed.push({
    metric: "Input Paste Allowed",
    current: "Allowed",
    recommended: "Maintain input flexibility",
    severity: "Pass 🟢",
    suggestion: "Pasting is allowed in input fields."
  });
}

if (checkNotificationRequestScore === 0) {
  improvements.push({
    metric: "Notification Request",
    current: "Requests notifications",
    recommended: "Request only when necessary",
    severity: "Low 🟡",
    suggestion: "Avoid automatic notification permission prompts on page load."
  });
} else {
  passed.push({
    metric: "Notification Request",
    current: "No notification requests",
    recommended: "Maintain minimal permission requests",
    severity: "Pass 🟢",
    suggestion: "No unsolicited notification requests detected."
  });
}

if (checkThirdPartyCookiesScore === 0) {
  improvements.push({
    metric: "Third-Party Cookies",
    current: "Detected",
    recommended: "Remove or minimize third-party cookies",
    severity: "High 🔴",
    suggestion: "Review dependencies and switch to first-party storage wherever possible."
  });
} else {
  passed.push({
    metric: "Third-Party Cookies",
    current: "Not detected",
    recommended: "Maintain cookie hygiene",
    severity: "Pass 🟢",
    suggestion: "No third-party cookies found."
  });
}

if (checkDeprecatedAPIsScore === 0) {
  improvements.push({
    metric: "Deprecated API Usage",
    current: "Deprecated APIs used",
    recommended: "Update to modern API equivalents",
    severity: "Medium 🟠",
    suggestion: "Replace deprecated APIs to ensure long-term compatibility."
  });
} else {
  passed.push({
    metric: "Deprecated API Usage",
    current: "No deprecated APIs used",
    recommended: "Maintain updated standards",
    severity: "Pass 🟢",
    suggestion: "No deprecated API warnings detected."
  });
}


// Warning
const warning = [];

// Security/Compliance (HTTPS / SSL)
if (checkHTTPSScore === 0) {
  warning.push({
    metric: "HTTPS",
    current: "Not served over HTTPS",
    recommended: "Serve all pages over HTTPS",
    severity: "High 🔴",
    suggestion: "Configure an SSL certificate and redirect HTTP traffic to HTTPS."
  });
} else {
  passed.push({
    metric: "HTTPS",
    current: "Served over HTTPS",
    recommended: "Serve all pages over HTTPS",
    severity: "Pass 🟢",
    suggestion: "HTTPS is correctly configured."
  });
}

// Security/Compliance (Security Headers)
if (checkXContentTypeOptionsScore === 0) {
  warning.push({
    metric: "X-Content-Type-Options",
    current: "Missing",
    recommended: "Use 'nosniff'",
    severity: "Medium 🟡",
    suggestion: "Add X-Content-Type-Options header to prevent MIME sniffing."
  });
} else {
  passed.push({
    metric: "X-Content-Type-Options",
    current: "Set",
    recommended: "Use 'nosniff'",
    severity: "Pass 🟢",
    suggestion: "Header is correctly set."
  });
}

if (checkCSPScore === 0) {
  warning.push({
    metric: "Content Security Policy (CSP)",
    current: "Not set",
    recommended: "Implement CSP header",
    severity: "High 🔴",
    suggestion: "Define a CSP to restrict scripts and resources."
  });
} else {
  passed.push({
    metric: "Content Security Policy (CSP)",
    current: "Set",
    recommended: "Implement CSP header",
    severity: "Pass 🟢",
    suggestion: "CSP header is correctly configured."
  });
}

if (checkXFrameOptionsScore === 0) {
  warning.push({
    metric: "X-Frame-Options",
    current: "Missing",
    recommended: "Use 'DENY' or 'SAMEORIGIN'",
    severity: "Medium 🟡",
    suggestion: "Add X-Frame-Options header to prevent clickjacking."
  });
} else {
  passed.push({
    metric: "X-Frame-Options",
    current: "Set",
    recommended: "Use 'DENY' or 'SAMEORIGIN'",
    severity: "Pass 🟢",
    suggestion: "X-Frame-Options header is correctly set."
  });
}


const actualPercentage =  parseFloat((((checkViewportMetaTagScore+checkHtmlDoctypeScore+checkCharsetDefinedScore+checkBrowserErrorsScore+checkGeolocationRequestScore+checkInputPasteAllowedScore+checkNotificationRequestScore+checkThirdPartyCookiesScore+checkDeprecatedAPIsScore) / 9) * 100).toFixed(0));

  // console.log("HTTPS:", checkHTTPSScore);
  // console.log("SSL:", checkSSLScore);
  // console.log("SSL Expiry:", checkSSLCertificateExpiryScore);
  // console.log("HSTS:", checkHSTSScore);
  // console.log("TLS:", checkTLSVersionScore);
  // console.log("X-Frame-Options:", checkXFrameOptionsScore);
  // console.log("CSP:", checkCSPScore);
  // console.log("X-Content-Type-Options:", checkXContentTypeOptionsScore);
  // console.log("Cookies HttpOnly:", checkCookiesHttpOnlyScore);
  // console.log("Cookies Secure:", checkCookiesSecureScore);
  // console.log("Cookie Consent (1=present,0=not):", cookieConsentScore);
  // console.log("Privacy Policy (1=exists,0=not):", privacyPolicyScore);
  // console.log("Google Safe Browsing (1=safe,0=unsafe):", safeBrowsingScore);
  // console.log("SQLi Exposure (0=vulnerable,1=safe):", sqliExposureScore);
  // console.log("Forms Use HTTPS (0=unsafe,1=safe):", formsUseHTTPSScore);
  // console.log("VirusTotal Blacklist Score (1=safe,0=blacklisted):", blacklistScore);
  // console.log("Malware Scan (1=safe,0=malicious):", malwareScanScore);
  // console.log("XSS Vulnerability (0=vulnerable,1=safe):", xssVulnerabilityScore);
  // console.log("GDPR/CCPA Notice (1=present,0=not):", checkGDPRCCPAScore);
  // console.log("Data Collection Disclosure (1=found,0=not):", checkDataCollectionScore);
  // console.log("Admin Panel Publicly Accessible (1=no,0=yes):", checkAdminPanelPublicScore);
  // console.log("Weak/Default Credentials Indicators (1=no,0=yes):", weakDefaultCredsScore);
  // console.log("MFA Enabled (1=yes,0=no):", mfaEnabledScore);
  // console.log("checkViewportMetaTagScore",checkViewportMetaTagScore);
  // console.log("checkHtmlDoctypeScore",checkHtmlDoctypeScore);
  // console.log("checkCharsetDefinedScore",checkCharsetDefinedScore);
  // console.log("checkBrowserErrorsScore",checkBrowserErrorsScore);
  // console.log("checkGeolocationRequestScore",checkGeolocationRequestScore);
  // console.log("checkInputPasteAllowedScore",checkInputPasteAllowedScore);
  // console.log("checkNotificationRequestScore",checkNotificationRequestScore);
  // console.log("checkThirdPartyCookiesScore",checkThirdPartyCookiesScore);
  // console.log("checkDeprecatedAPIsScore",checkDeprecatedAPIsScore);
  // console.log(actualPercentage);
  // console.log(warning);
  // console.log(passed);
  // console.log(Total);
  // console.log(improvements);

    await SiteReport.findByIdAndUpdate(auditId, {
    Security_or_Compliance: {
      HTTPS: {
        Score: checkHTTPSScore,
        Parameter: '1 if HTTPS is implemented, else 0'
      },
      SSL: {
        Score: checkSSLScore,
        Parameter: '1 if SSL/TLS certificate is valid, else 0'
      },
      SSL_Expiry: {
        Score: checkSSLCertificateExpiryScore,
        Parameter: '1 if SSL certificate is not expired, else 0'
      },
      HSTS: {
        Score: checkHSTSScore,
        Parameter: '1 if HSTS header is present, else 0'
      },
      TLS_Version: {
        Score: checkTLSVersionScore,
        Parameter: '1 if secure TLS version is used, else 0'
      },
      X_Frame_Options: {
        Score: checkXFrameOptionsScore,
        Parameter: '1 if X-Frame-Options header is set, else 0'
      },
      CSP: {
        Score: checkCSPScore,
        Parameter: '1 if Content Security Policy (CSP) is set, else 0'
      },
      X_Content_Type_Options: {
        Score: checkXContentTypeOptionsScore,
        Parameter: '1 if X-Content-Type-Options header is set, else 0'
      },
      Cookies_Secure: {
        Score: checkCookiesSecureScore,
        Parameter: '1 if cookies are set with Secure flag, else 0'
      },
      Cookies_HttpOnly: {
        Score: checkCookiesHttpOnlyScore,
        Parameter: '1 if cookies are HttpOnly, else 0'
      },
      Google_Safe_Browsing: {
        Score: safeBrowsingScore,
        Parameter: '1 if site is safe according to Google Safe Browsing, else 0'
      },
      Blacklist: {
        Score: blacklistScore,
        Parameter: '1 if site is not blacklisted, else 0'
      },
      Malware_Scan: {
        Score: malwareScanScore,
        Parameter: '1 if no malware detected, else 0'
      },
      SQLi_Exposure: {
        Score: sqliExposureScore,
        Parameter: '1 if site is not vulnerable to SQL injection, else 0'
      },
      XSS: {
        Score: xssVulnerabilityScore,
        Parameter: '1 if site is not vulnerable to XSS, else 0'
      },
      Cookie_Consent: {
        Score: cookieConsentScore,
        Parameter: '1 if cookie consent banner is implemented, else 0'
      },
      Privacy_Policy: {
        Score: privacyPolicyScore,
        Parameter: '1 if privacy policy exists, else 0'
      },
      Forms_Use_HTTPS: {
        Score: formsUseHTTPSScore,
        Parameter: '1 if forms submit over HTTPS, else 0'
      },
      GDPR_CCPA: {
        Score: checkGDPRCCPAScore,
        Parameter: '1 if GDPR/CCPA compliance implemented, else 0'
      },
      Data_Collection: {
        Score: checkDataCollectionScore,
        Parameter: '1 if data collection practices are compliant, else 0'
      },
      Weak_Default_Credentials: {
        Score: weakDefaultCredsScore,
        Parameter: '1 if no weak default credentials exist, else 0'
      },
      MFA_Enabled: {
        Score: mfaEnabledScore,
        Parameter: '1 if multi-factor authentication is enabled, else 0'
      },
      Admin_Panel_Public: {
        Score: checkAdminPanelPublicScore,
        Parameter: '1 if admin panel is not publicly accessible, else 0'
      },
      Viewport_Meta_Tag: {
        Score: checkViewportMetaTagScore,
        Parameter: '1 if <meta name="viewport" content="width=device-width, initial-scale=1.0"> is present, else 0'
      },
      HTML_Doctype: {
        Score: checkHtmlDoctypeScore,
        Parameter: '1 if <!DOCTYPE html> is declared at document start, else 0'
      },
      Character_Encoding: {
        Score: checkCharsetDefinedScore,
        Parameter: '1 if charset is defined in <meta> or HTTP headers, else 0'
      },
      Browser_Console_Errors: {
        Score: checkBrowserErrorsScore,
        Parameter: '1 if no console or JS errors are detected, else 0'
      },
      Geolocation_Request: {
        Score: checkGeolocationRequestScore,
        Parameter: '1 if geolocation is not requested automatically, else 0'
      },
      Input_Paste_Allowed: {
        Score: checkInputPasteAllowedScore,
        Parameter: '1 if paste is allowed in input fields, else 0'
      },
      Notification_Request: {
        Score: checkNotificationRequestScore,
        Parameter: '1 if no unsolicited notification request is made, else 0'
      },
      Third_Party_Cookies: {
        Score: checkThirdPartyCookiesScore,
        Parameter: '1 if no third-party cookies are detected, else 0'
      },
      Deprecated_APIs: {
        Score: checkDeprecatedAPIsScore,
        Parameter: '1 if no deprecated APIs are used, else 0'
      },
      Percentage: actualPercentage,
      Warning: warning,
      Passed: passed,
      Total: Total,
      Improvements: improvements
    },
    $set: {
          'Raw.Site': url,
          'Raw.Report': selectedMetric,
          'Raw.Device': device,
          'Raw.Security_or_Compliance':{
      HTTPS: {
        Score: checkHTTPSScore,
        Parameter: '1 if HTTPS is implemented, else 0'
      },
      SSL: {
        Score: checkSSLScore,
        Parameter: '1 if SSL/TLS certificate is valid, else 0'
      },
      SSL_Expiry: {
        Score: checkSSLCertificateExpiryScore,
        Parameter: '1 if SSL certificate is not expired, else 0'
      },
      HSTS: {
        Score: checkHSTSScore,
        Parameter: '1 if HSTS header is present, else 0'
      },
      TLS_Version: {
        Score: checkTLSVersionScore,
        Parameter: '1 if secure TLS version is used, else 0'
      },
      X_Frame_Options: {
        Score: checkXFrameOptionsScore,
        Parameter: '1 if X-Frame-Options header is set, else 0'
      },
      CSP: {
        Score: checkCSPScore,
        Parameter: '1 if Content Security Policy (CSP) is set, else 0'
      },
      X_Content_Type_Options: {
        Score: checkXContentTypeOptionsScore,
        Parameter: '1 if X-Content-Type-Options header is set, else 0'
      },
      Cookies_Secure: {
        Score: checkCookiesSecureScore,
        Parameter: '1 if cookies are set with Secure flag, else 0'
      },
      Cookies_HttpOnly: {
        Score: checkCookiesHttpOnlyScore,
        Parameter: '1 if cookies are HttpOnly, else 0'
      },
      Google_Safe_Browsing: {
        Score: safeBrowsingScore,
        Parameter: '1 if site is safe according to Google Safe Browsing, else 0'
      },
      Blacklist: {
        Score: blacklistScore,
        Parameter: '1 if site is not blacklisted, else 0'
      },
      Malware_Scan: {
        Score: malwareScanScore,
        Parameter: '1 if no malware detected, else 0'
      },
      SQLi_Exposure: {
        Score: sqliExposureScore,
        Parameter: '1 if site is not vulnerable to SQL injection, else 0'
      },
      XSS: {
        Score: xssVulnerabilityScore,
        Parameter: '1 if site is not vulnerable to XSS, else 0'
      },
      Cookie_Consent: {
        Score: cookieConsentScore,
        Parameter: '1 if cookie consent banner is implemented, else 0'
      },
      Privacy_Policy: {
        Score: privacyPolicyScore,
        Parameter: '1 if privacy policy exists, else 0'
      },
      Forms_Use_HTTPS: {
        Score: formsUseHTTPSScore,
        Parameter: '1 if forms submit over HTTPS, else 0'
      },
      GDPR_CCPA: {
        Score: checkGDPRCCPAScore,
        Parameter: '1 if GDPR/CCPA compliance implemented, else 0'
      },
      Data_Collection: {
        Score: checkDataCollectionScore,
        Parameter: '1 if data collection practices are compliant, else 0'
      },
      Weak_Default_Credentials: {
        Score: weakDefaultCredsScore,
        Parameter: '1 if no weak default credentials exist, else 0'
      },
      MFA_Enabled: {
        Score: mfaEnabledScore,
        Parameter: '1 if multi-factor authentication is enabled, else 0'
      },
      Admin_Panel_Public: {
        Score: checkAdminPanelPublicScore,
        Parameter: '1 if admin panel is not publicly accessible, else 0'
      },
      Viewport_Meta_Tag: {
        Score: checkViewportMetaTagScore,
        Parameter: '1 if <meta name="viewport" content="width=device-width, initial-scale=1.0"> is present, else 0'
      },
      HTML_Doctype: {
        Score: checkHtmlDoctypeScore,
        Parameter: '1 if <!DOCTYPE html> is declared at document start, else 0'
      },
      Character_Encoding: {
        Score: checkCharsetDefinedScore,
        Parameter: '1 if charset is defined in <meta> or HTTP headers, else 0'
      },
      Browser_Console_Errors: {
        Score: checkBrowserErrorsScore,
        Parameter: '1 if no console or JS errors are detected, else 0'
      },
      Geolocation_Request: {
        Score: checkGeolocationRequestScore,
        Parameter: '1 if geolocation is not requested automatically, else 0'
      },
      Input_Paste_Allowed: {
        Score: checkInputPasteAllowedScore,
        Parameter: '1 if paste is allowed in input fields, else 0'
      },
      Notification_Request: {
        Score: checkNotificationRequestScore,
        Parameter: '1 if no unsolicited notification request is made, else 0'
      },
      Third_Party_Cookies: {
        Score: checkThirdPartyCookiesScore,
        Parameter: '1 if no third-party cookies are detected, else 0'
      },
      Deprecated_APIs: {
        Score: checkDeprecatedAPIsScore,
        Parameter: '1 if no deprecated APIs are used, else 0'
      },
      Percentage: actualPercentage
    }
        }
    });

    return actualPercentage
}
