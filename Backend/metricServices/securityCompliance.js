securityCompliance.mjs
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import dotenv from "dotenv";
import fetch from "node-fetch";
import { URL } from "url";

dotenv.config();
puppeteer.use(StealthPlugin());

const safeBrowsingAPI = process.env.SafeBrowsing;
const VT_KEY = process.env.vt_key;



// Security/Compliance (HTTPS / SSL)
function checkHTTPS(url) {
  try {
    const parsedUrl = new URL(url);
    const isHttps = parsedUrl.protocol === "https:";
    return {
      score: isHttps ? 100 : 0,
      status: isHttps ? "pass" : "fail",
      details: isHttps ? "Protocol is HTTPS" : "Protocol is HTTP, not HTTPS",
      meta: { location: "URL Protocol" }
    };
  } catch {
    return {
      score: 0,
      status: "fail",
      details: "Invalid URL",
      meta: { location: "URL Parsing" }
    };
  }
}

function checkSSLDetails(response) {
  try {
    if (!response) throw new Error("Response is null");
    const securityDetails = response.securityDetails();
    const headers = response.headers();

    let certificateValid, tlsVersion;

    if (securityDetails) {
      const expiryDate = new Date(securityDetails.validTo() * 1000);
      const isValidDate = !isNaN(expiryDate.getTime());
      const isCertValid = isValidDate && expiryDate > new Date();

      certificateValid = {
        score: isCertValid ? 100 : 0,
        status: isCertValid ? "pass" : "fail",
        details: isCertValid ? "Certificate is valid" : (isValidDate ? `Certificate expired on ${expiryDate.toISOString()}` : "Certificate expiry date invalid"),
        meta: { location: "SSL Certificate", expiryDate: isValidDate ? expiryDate.toISOString() : null }
      };

      const tls = securityDetails.protocol(); // e.g., "TLS 1.3"
      const isStrongTls = tls.includes('1.2') || tls.includes('1.3');
      tlsVersion = {
        score: isStrongTls ? 100 : 0,
        status: isStrongTls ? "pass" : "fail",
        details: isStrongTls ? `Strong TLS version: ${tls}` : `Weak TLS version: ${tls}`,
        meta: { location: "SSL Protocol", version: tls }
      };
    } else {
      certificateValid = { score: 0, status: "fail", details: "No security details available", meta: { location: "SSL Certificate" } };
      tlsVersion = { score: 0, status: "fail", details: "No security details available", meta: { location: "SSL Protocol" } };
    }

    const hstsVal = headers['strict-transport-security'];
    const hstsEnabled = hstsVal
      ? { score: 100, status: "pass", details: "HSTS header is present", meta: { location: "Response Headers", value: hstsVal } }
      : { score: 0, status: "fail", details: "HSTS header is missing", meta: { location: "Response Headers" } };

    const xFrameVal = headers['x-frame-options'];
    const xFrameOptions = xFrameVal
      ? { score: 100, status: "pass", details: "X-Frame-Options header is present", meta: { location: "Response Headers", value: xFrameVal } }
      : { score: 0, status: "fail", details: "X-Frame-Options header is missing", meta: { location: "Response Headers" } };

    const cspVal = headers['content-security-policy'];
    const contentSecurityPolicy = cspVal
      ? { score: 100, status: "pass", details: "CSP header is present", meta: { location: "Response Headers", value: cspVal } }
      : { score: 0, status: "fail", details: "CSP header is missing", meta: { location: "Response Headers" } };

    const xContentTypeVal = headers['x-content-type-options'];
    const xContentTypeOptions = xContentTypeVal
      ? { score: 100, status: "pass", details: "X-Content-Type-Options header is present", meta: { location: "Response Headers", value: xContentTypeVal } }
      : { score: 0, status: "fail", details: "X-Content-Type-Options header is missing", meta: { location: "Response Headers" } };

    return {
      certificateValid, tlsVersion, hstsEnabled, xFrameOptions, contentSecurityPolicy, xContentTypeOptions
    };
  } catch (error) {
    console.error("Error in checkSSLDetails:", error.message);
    const errorResult = { score: 0, status: "fail", details: "Error checking SSL details", meta: { location: "SSL" } };
    return {
      certificateValid: { ...errorResult },
      tlsVersion: { ...errorResult },
      hstsEnabled: { ...errorResult },
      xFrameOptions: { ...errorResult },
      contentSecurityPolicy: { ...errorResult },
      xContentTypeOptions: { ...errorResult }
    };
  }
}

// Security/Compliance (Security Headers)
async function checkCookiesSecure(page) {
  try {
    const cookies = await page.cookies();
    if (!cookies.length) {
      return {
        cookies: [],
        hasSecure: { score: 0, status: "fail", details: "No cookies found", meta: { location: "Cookies", cookies: [] } },
        hasHttpOnly: { score: 0, status: "fail", details: "No cookies found", meta: { location: "Cookies", cookies: [] } }
      };
    }
    const hasSecureBool = cookies.some((c) => c.secure);
    const hasHttpOnlyBool = cookies.some((c) => c.httpOnly);

    return {
      cookies,
      hasSecure: {
        score: hasSecureBool ? 100 : 0,
        status: hasSecureBool ? "pass" : "fail",
        details: hasSecureBool ? "Secure flag set on cookies" : "Secure flag missing on some cookies",
        meta: { location: "Cookies", totalCookies: cookies.length }
      },
      hasHttpOnly: {
        score: hasHttpOnlyBool ? 100 : 0,
        status: hasHttpOnlyBool ? "pass" : "fail",
        details: hasHttpOnlyBool ? "HttpOnly flag set on cookies" : "HttpOnly flag missing on some cookies",
        meta: { location: "Cookies", totalCookies: cookies.length }
      }
    };
  } catch (err) {
    return {
      cookies: [],
      hasSecure: { score: 0, status: "fail", details: "Error checking cookies", meta: { location: "Cookies" } },
      hasHttpOnly: { score: 0, status: "fail", details: "Error checking cookies", meta: { location: "Cookies" } }
    };
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
  if (!safeBrowsingAPI) return { score: 100, status: "pass", details: "Safe Browsing API key missing", meta: { location: "Configuration" } }; // Default to pass if no key
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
    const isSafe = !j.matches;
    return {
      score: isSafe ? 100 : 0,
      status: isSafe ? "pass" : "fail",
      details: isSafe ? "URL not found in Safe Browsing database" : "URL found in Safe Browsing database",
      meta: { location: "Google Safe Browsing", matches: j.matches || [] }
    };
  } catch {
    return { score: 0, status: "fail", details: "Error checking Safe Browsing", meta: { location: "Google Safe Browsing" } };
  }
}

async function checkVirusTotal(domain) {
  try {
    if (!VT_KEY) return { score: 100, status: "pass", details: "VirusTotal API key missing", meta: { location: "Configuration" } };
    const endpoint = `https://www.virustotal.com/api/v3/domains/${domain}`;
    const res = await fetch(endpoint, { headers: { "x-apikey": VT_KEY } });
    if (!res.ok) return { score: 0, status: "fail", details: "VirusTotal API error", meta: { location: "VirusTotal" } };
    const j = await res.json();
    const stats = j?.data?.attributes?.last_analysis_stats || {};
    const isMalicious = stats.malicious && stats.malicious > 0;
    return {
      score: isMalicious ? 0 : 100,
      status: isMalicious ? "fail" : "pass",
      details: isMalicious ? `Malicious detections: ${stats.malicious}` : "No malicious detections",
      meta: { location: "VirusTotal", stats }
    };
  } catch {
    return { score: 0, status: "fail", details: "Error checking VirusTotal", meta: { location: "VirusTotal" } };
  }
}

async function checkDomainBlacklist(domain, url) {
  const [g, v] = await Promise.all([
    checkGoogleSafeBrowsing(url),
    checkVirusTotal(domain),
  ]);
  if (g.score === 0) return { score: 0, status: "fail", details: g.details, meta: g.meta };
  if (v.score === 0) return { score: 0, status: "fail", details: v.details, meta: v.meta };
  return { score: 100, status: "pass", details: "Domain not found in blacklists", meta: { location: "Blacklist Databases" } };
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
    return { score: 100, status: "pass", details: "Invalid URL, skipping SQLi check", meta: { location: "URL Parsing" } };
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

      if (looksLikeSQLError(body)) return { score: 0, status: "fail", details: `SQL error detected with payload: ${p}`, meta: { location: `Param: ${param}`, payload: p } };
      if (baselineLength > 0) {
        const diff = Math.abs(length - baselineLength) / baselineLength;
        if (diff >= lengthDiffThreshold) return { score: 0, status: "fail", details: `Significant response length difference with payload: ${p}`, meta: { location: `Param: ${param}`, payload: p } };
      } else {
        if (length > 0) return { score: 0, status: "fail", details: `Response content appeared with payload: ${p}`, meta: { location: `Param: ${param}`, payload: p } };
      }
      if (res.status === 500) return { score: 0, status: "fail", details: `Server error (500) with payload: ${p}`, meta: { location: `Param: ${param}`, payload: p } };
    }
  }

  return { score: 100, status: "pass", details: "No SQL injection vulnerabilities detected", meta: { location: "URL Parameters" } };
}

async function checkXSS(url, browser) {
  try {
    const payload = `<script>alert(1)</script>`;
    const testUrl = url.includes("?")
      ? `${url}&xss=${encodeURIComponent(payload)}`
      : `${url}?xss=${encodeURIComponent(payload)}`;

    const testURLPage = await browser.newPage()
    await testURLPage.goto(testUrl, { waitUntil: "networkidle2", timeout: 360000 });
    await testURLPage.waitForSelector("body", { timeout: 360000 });
    const html = await testURLPage.content(); // Fixed: use testURLPage instead of page
    await testURLPage.close();
    const isXssReflected = html.toLowerCase().includes(payload.toLowerCase());
    return {
      score: isXssReflected ? 0 : 100,
      status: isXssReflected ? "fail" : "pass",
      details: isXssReflected ? "XSS payload reflected in response" : "XSS payload not reflected",
      meta: { location: "HTML Body" }
    };
  } catch {
    return { score: 0, status: "fail", details: "Error checking XSS", meta: { location: "XSS Check" } };
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
        return { score: 100, status: "pass", details: "Cookie consent banner found", meta: { location: `Selector: ${selector}` } };
      }
    }
    return { score: 0, status: "fail", details: "No cookie consent banner found", meta: { location: "HTML DOM" } };
  } catch (err) {
    return { score: 0, status: "fail", details: "Error checking cookie consent", meta: { location: "HTML DOM" } };
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
    return found
      ? { score: 100, status: "pass", details: "Privacy policy link found", meta: { location: "Footer/Menu" } }
      : { score: 0, status: "fail", details: "No privacy policy link found", meta: { location: "Footer/Menu" } };
  } catch (err) {
    return { score: 0, status: "fail", details: "Error checking privacy policy", meta: { location: "HTML DOM" } };
  }
}

async function checkFormsUseHTTPS(page) {
  try {
    const forms = await page.$$eval("form", (forms) =>
      forms.map((f) => f.getAttribute("action") || "")
    );

    if (!forms.length) return { score: 100, status: "pass", details: "No forms found", meta: { location: "HTML DOM" } };

    const insecureForms = forms.filter((action) => {
      if (!action || action.startsWith("/")) return false;
      try {
        return new URL(action).protocol !== "https:";
      } catch {
        return false;
      }
    });

    return insecureForms.length === 0
      ? { score: 100, status: "pass", details: "All forms use HTTPS", meta: { location: "Forms" } }
      : { score: 0, status: "fail", details: `Found ${insecureForms.length} form(s) using HTTP`, meta: { location: "Forms", insecureForms } };
  } catch (err) {
    return { score: 0, status: "fail", details: "Error checking forms", meta: { location: "HTML DOM" } };
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
        return { score: 100, status: "pass", details: "GDPR/CCPA notice found", meta: { location: `Selector: ${selector}` } };
      }
    }

    return { score: 0, status: "fail", details: "No GDPR/CCPA notice found", meta: { location: "HTML DOM" } };
  } catch (err) {
    return { score: 0, status: "fail", details: "Error checking GDPR/CCPA", meta: { location: "HTML DOM" } };
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
    return found
      ? { score: 100, status: "pass", details: "Data collection disclosure found", meta: { location: "Footer/Menu" } }
      : { score: 0, status: "fail", details: "No data collection disclosure found", meta: { location: "Footer/Menu" } };
  } catch (err) {
    return { score: 0, status: "fail", details: "Error checking data collection", meta: { location: "HTML DOM" } };
  }
}

// Security/Compliance ( Authentication & Access Control)
async function checkAdminPanelPublic(baseUrl, options = {}) {
  const {
    timeout = 5000, // Reduced timeout for faster execution
    maxBodyChars = 20000,
  } = options;

  // Refined paths: Focus on ADMIN interfaces, not user logins
  const adminPaths = [
    "/admin",
    "/admin/login",
    "/administrator",
    "/wp-admin/",
    "/wp-login.php",
    "/cms",
    "/backend",
    "/controlpanel",
    "/admin.php",
    "/phpmyadmin/",
    "/sqladmin/",
    "/dashboard",
  ];

  // Refined keywords: Avoid generic "login" terms that match 404 pages or user areas
  const adminKeywords = [
    "wp-login.php",
    "wordpress",
    "phpmyadmin",
    "administrator",
    "admin panel",
    "control panel",
    "dashboard",
    "administration",
    "admin area"
  ];

  function looksLikeAdmin(body) {
    if (!body) return false;
    const low = body.slice(0, maxBodyChars).toLowerCase();
    return adminKeywords.some((kw) => low.includes(kw));
  }

  let origin;
  try {
    const u = new URL(baseUrl);
    origin = `${u.protocol}//${u.host}`;
  } catch {
    return { score: 100, status: "pass", details: "Invalid URL", meta: { location: "URL Parsing" } };
  }

  async function checkPath(path) {
    const tryUrl = new URL(path, origin).toString();
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(tryUrl, { redirect: "follow", signal: controller.signal });
      clearTimeout(id);

      // 401/403 means it exists but is protected -> Pass (or Warning, but usually Pass for "Publicly Accessible")
      if (res.status === 401 || res.status === 403) return null;

      if (res.status === 200) {
        // Check if it's a soft 404 or just a generic page
        const body = await res.text();
        if (looksLikeAdmin(body)) {
          return { score: 0, status: "fail", details: `Admin panel exposed at ${path}`, meta: { location: "Admin Paths", url: tryUrl } };
        }
      }
      return null; // Path is safe or not an admin panel
    } catch (err) {
      clearTimeout(id);
      return null; // Network error/timeout -> assume unreachable/safe
    }
  }

  // Execute checks in parallel for speed
  const results = await Promise.all(adminPaths.map(p => checkPath(p)));

  const failure = results.find(r => r !== null);
  if (failure) return failure;

  return { score: 100, status: "pass", details: "No public admin panels found", meta: { location: "Admin Paths", checked: adminPaths.length } };
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
      return { score: 0, status: "fail", details: "Default credentials mentioned in text", meta: { location: "Page Content" } };
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
        return { score: 0, status: "fail", details: "Username field preset with default value", meta: { location: "Login Form" } };
      }

      if (!hasCsrf && !captchaPresent) {
        // no CSRF and no captcha — higher chance weak/default creds could be exploited
        return { score: 0, status: "fail", details: "Login form missing CSRF token and Captcha", meta: { location: "Login Form" } };
      }

      if (actionLooksAdmin) {
        // exposed admin login endpoint present
        return { score: 0, status: "fail", details: "Login form action points to admin endpoint", meta: { location: "Login Form" } };
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
        return { score: 0, status: "fail", details: "Basic Auth (WWW-Authenticate) detected", meta: { location: "Response Headers" } };
      }
    } catch (e) {
      // non-fatal; ignore
    }

    // 4) If we reached here, no obvious passive indicators found
    return { score: 100, status: "pass", details: "No weak credential indicators found", meta: { location: "Page Content" } };
  } catch (err) {
    // on error treat as safe (1) — or you may choose to return 0 to be conservative
    return { score: 100, status: "pass", details: "Error checking credentials, assuming safe", meta: { location: "Page Content" } };
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
          name: i.name || "",
          id: i.id || ""
        })),
        text: f.innerText || "",
        action: f.getAttribute("action") || ""
      }))
    );

    for (const form of forms) {
      const hasPassword = form.inputs.some(i => i.type === "password");
      if (!hasPassword) continue;

      // Heuristic: look for MFA keywords in text or input names/placeholder
      const text = form.text.toLowerCase();
      const inputsText = form.inputs.map(i => (i.placeholder + i.name + i.id).toLowerCase()).join(" ");
      const action = form.action.toLowerCase();

      // Expanded keywords including SSO/SAML which often imply MFA
      const mfaKeywords = [
        "otp", "two-factor", "2fa", "authenticator", "verification code", "mfa",
        "security key", "yubikey", "webauthn", "one-time password",
        "sso", "saml", "single sign-on", "okta", "auth0"
      ];

      const foundKeyword = mfaKeywords.find(k => text.includes(k) || inputsText.includes(k) || action.includes(k));

      if (foundKeyword) {
        return {
          score: 100,
          status: "pass",
          details: `MFA/SSO indicator found: "${foundKeyword}"`,
          meta: { location: "Login Form", keyword: foundKeyword }
        };
      }
    }

    return {
      score: 0,
      status: "fail",
      details: "No visible MFA or SSO indicators on login page",
      meta: { location: "Login Form", note: "MFA might be on a second screen" }
    };
  } catch (err) {
    return { score: 0, status: "fail", details: "Error checking MFA", meta: { location: "Login Form" } };
  }
}

// Lighthouse
async function checkViewportMetaTag(page) {

  // Evaluate in the browser context
  const hasViewport = await page.evaluate(() => {
    const meta = document.querySelector('meta[name="viewport"]');
    if (!meta) return { score: 0, status: "fail", details: "No viewport meta tag found", meta: { location: "HTML Head" } };

    const content = meta.getAttribute("content") || "";
    // check for "width=" or "initial-scale="
    if (content.includes("width=") || content.includes("initial-scale=")) {
      return { score: 100, status: "pass", details: "Viewport meta tag configured correctly", meta: { location: "HTML Head" } };
    } else {
      return { score: 0, status: "fail", details: "Viewport meta tag missing width or initial-scale", meta: { location: "HTML Head" } };
    }
  });

  return hasViewport;
}

async function checkHtmlDoctype(page) {
  // Evaluate in the page context
  const hasDoctype = await page.evaluate(() => {
    const dt = document.doctype;
    if (!dt) return { score: 0, status: "fail", details: "No DOCTYPE declared", meta: { location: "Document Start" } };
    // Check if it's <!DOCTYPE html>
    return dt.name.toLowerCase() === "html"
      ? { score: 100, status: "pass", details: "DOCTYPE is HTML5", meta: { location: "Document Start" } }
      : { score: 0, status: "fail", details: `DOCTYPE is ${dt.name}, expected html`, meta: { location: "Document Start" } };
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
  if (hasMetaCharset) return { score: 100, status: "pass", details: "Charset defined in meta tag", meta: { location: "HTML Head" } };
  if (hasHeaderCharset) return { score: 100, status: "pass", details: "Charset defined in HTTP header", meta: { location: "Response Headers" } };

  return { score: 0, status: "fail", details: "No charset defined in meta tag or headers", meta: { location: "HTML Head / Headers" } };
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
  return hasConsoleErrors
    ? { score: 0, status: "fail", details: "Browser console errors detected", meta: { location: "Console" } }
    : { score: 100, status: "pass", details: "No browser console errors detected", meta: { location: "Console" } };
}

async function checkGeolocationRequest(url, page) {

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
  return geolocationRequested
    ? { score: 0, status: "fail", details: "Geolocation permission requested on load", meta: { location: "Page Load" } }
    : { score: 100, status: "pass", details: "No geolocation permission requested", meta: { location: "Page Load" } };
}

async function checkInputPasteAllowed(page) {
  // Evaluate in browser context
  const allowsPaste = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll("input, textarea"));

    for (let input of inputs) {
      // Check for onpaste attribute that blocks pasting
      const onpaste = input.getAttribute("onpaste");
      if (onpaste && onpaste.toLowerCase().includes("return false")) {
        return { score: 0, status: "fail", details: "Paste blocked via onpaste attribute", meta: { location: `Input: ${input.name || input.id || 'unknown'}` } };
      }

      // Programmatically test if paste is blocked
      let blocked = false;
      // We can't easily dispatch events inside evaluate that trigger the actual blocking if it's done via addEventListener in a complex way without more context,
      // but we can try a simple dispatch.
      // However, for this check, we'll rely on the previous logic or a simplified version.
      // The previous logic had:
      /*
      const testEvent = new ClipboardEvent("paste", { ... });
      const blocked = !input.dispatchEvent(testEvent);
      */
      // But ClipboardEvent constructor might not work in all contexts or might need specific handling.
      // Let's stick to the onpaste check and a basic event dispatch if possible, or just the onpaste check if that's safer for now.
      // The previous code had a complex event dispatch. Let's try to restore it.

      try {
        const testEvent = new Event("paste", { bubbles: true, cancelable: true });
        // We can't easily check if preventDefault was called without wrapping it, but we are in the page context.
        // Let's just check if the event returns false.
        const result = input.dispatchEvent(testEvent);
        if (result === false) {
          return { score: 0, status: "fail", details: "Paste blocked via event listener", meta: { location: `Input: ${input.name || input.id || 'unknown'}` } };
        }
      } catch (e) {
        // ignore
      }
    }

    return { score: 100, status: "pass", details: "Paste allowed in all inputs", meta: { location: "Input Fields" } };
  });

  return allowsPaste;
}

async function checkNotificationRequest(page) {

  let notificationRequested = 0;

  // Override Notification.requestPermission to detect requests
  await page.evaluateOnNewDocument(() => {
    const original = Notification.requestPermission;
    Notification.requestPermission = function (...args) {
      window.__notificationRequested = true;
      return original.apply(this, args);
    };
    window.__notificationRequested = false;
  });

  // Check if notification was requested
  const requested = await page.evaluate(() => window.__notificationRequested);
  if (requested) notificationRequested = 1;

  // Return 1 if notifications are NOT requested (pass), 0 if requested
  return notificationRequested
    ? { score: 0, status: "fail", details: "Notification permission requested on load", meta: { location: "Page Load" } }
    : { score: 100, status: "pass", details: "No notification permission requested", meta: { location: "Page Load" } };
}

async function checkThirdPartyCookies(url, page) {

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
  return thirdPartyCookieFound
    ? { score: 0, status: "fail", details: "Third-party cookies detected", meta: { location: "Response Headers" } }
    : { score: 100, status: "pass", details: "No third-party cookies detected", meta: { location: "Response Headers" } };
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
  return deprecatedAPIUsed
    ? { score: 0, status: "fail", details: "Deprecated APIs used", meta: { location: "Console Warnings" } }
    : { score: 100, status: "pass", details: "No deprecated APIs used", meta: { location: "Console" } };
}

export default async function securityCompliance(url, page, response, browser) {
  try {

    // Security/Compliance (HTTPS / SSL)
    const httpsResult = checkHTTPS(url);

    const sslDetailsResult = checkSSLDetails(response);
    const sslResult = response.ok()
      ? { score: 100, status: "pass", details: "SSL connection established", meta: { location: "Connection" } }
      : { score: 0, status: "fail", details: `SSL connection failed (Status: ${response.status()})`, meta: { location: "Connection" } };

    // Security/Compliance (Security Headers)
    const cookieResult = await checkCookiesSecure(page);

    // Security/Compliance (Vulnerability / Malware Check)
    const domain = Domain(url);
    const safeBrowsingResult = await checkGoogleSafeBrowsing(url);

    const blacklistResult = await checkDomainBlacklist(domain, url);

    const malwareScanResult = await checkVirusTotal(domain);

    const sqliExposureResult = await checkSQLiExposure(url);

    // Security/Compliance (Privacy & Compliance)
    const cookieConsentResult = await checkCookieConsent(page);

    const privacyPolicyResult = await checkPrivacyPolicy(page);

    const formsUseHTTPSResult = await checkFormsUseHTTPS(page);

    const gdprCcpaResult = await checkGDPRCCPA(page);

    const dataCollectionResult = await checkDataCollection(page);

    // Security/Compliance ( Authentication & Access Control)
    const weakDefaultCredsResult = await checkWeakDefaultCredentials(page);

    const mfaEnabledResult = await checkMFAEnabled(page);

    const adminPanelPublicResult = await checkAdminPanelPublic(url);

    // Security/Compliance (Vulnerability / Malware Check)
    const xssVulnerabilityResult = await checkXSS(url, browser);

    // Lighthouse
    const viewportMetaTagResult = await checkViewportMetaTag(page);

    const htmlDoctypeResult = await checkHtmlDoctype(page);

    const charsetDefinedResult = await checkCharsetDefined(page);

    const browserErrorsResult = await checkNoBrowserErrors(page);

    const geolocationRequestResult = await checkGeolocationRequest(url, page);

    const inputPasteAllowedResult = await checkInputPasteAllowed(page);

    const notificationRequestResult = await checkNotificationRequest(page);

    const thirdPartyCookiesResult = await checkThirdPartyCookies(url, page);

    const deprecatedAPIsResult = await checkDeprecatedAPIs(page);

    // Weighted Score Calculation
    // Weights: Critical=5, High=3, Medium=2, Low=1
    const weights = {
      HTTPS: 5,
      SSL: 5,
      SSL_Expiry: 5,
      HSTS: 3,
      TLS_Version: 3,
      X_Frame_Options: 2,
      CSP: 3,
      X_Content_Type_Options: 2,
      Cookies_Secure: 3,
      Cookies_HttpOnly: 3,
      Google_Safe_Browsing: 5,
      Blacklist: 5,
      Malware_Scan: 5,
      SQLi_Exposure: 5,
      XSS: 5,
      Cookie_Consent: 2,
      Privacy_Policy: 2,
      Forms_Use_HTTPS: 5,
      GDPR_CCPA: 2,
      Data_Collection: 2,
      Weak_Default_Credentials: 5,
      MFA_Enabled: 3,
      Admin_Panel_Public: 3,
      Viewport_Meta_Tag: 1,
      HTML_Doctype: 1,
      Character_Encoding: 1,
      Browser_Console_Errors: 2,
      Geolocation_Request: 1,
      Input_Paste_Allowed: 1,
      Notification_Request: 1,
      Third_Party_Cookies: 2,
      Deprecated_APIs: 1
    };

    const results = {
      HTTPS: httpsResult,
      SSL: sslResult,
      SSL_Expiry: sslDetailsResult.certificateValid,
      HSTS: sslDetailsResult.hstsEnabled,
      TLS_Version: sslDetailsResult.tlsVersion,
      X_Frame_Options: sslDetailsResult.xFrameOptions,
      CSP: sslDetailsResult.contentSecurityPolicy,
      X_Content_Type_Options: sslDetailsResult.xContentTypeOptions,
      Cookies_Secure: cookieResult.hasSecure,
      Cookies_HttpOnly: cookieResult.hasHttpOnly,
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
      Viewport_Meta_Tag: viewportMetaTagResult,
      HTML_Doctype: htmlDoctypeResult,
      Character_Encoding: charsetDefinedResult,
      Browser_Console_Errors: browserErrorsResult,
      Geolocation_Request: geolocationRequestResult,
      Input_Paste_Allowed: inputPasteAllowedResult,
      Notification_Request: notificationRequestResult,
      Third_Party_Cookies: thirdPartyCookiesResult,
      Deprecated_APIs: deprecatedAPIsResult
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
      SSL_Expiry: sslDetailsResult.certificateValid,
      HSTS: sslDetailsResult.hstsEnabled,
      TLS_Version: sslDetailsResult.tlsVersion,
      X_Frame_Options: sslDetailsResult.xFrameOptions,
      CSP: sslDetailsResult.contentSecurityPolicy,
      X_Content_Type_Options: sslDetailsResult.xContentTypeOptions,
      Cookies_Secure: cookieResult.hasSecure,
      Cookies_HttpOnly: cookieResult.hasHttpOnly,
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
      Viewport_Meta_Tag: viewportMetaTagResult,
      HTML_Doctype: htmlDoctypeResult,
      Character_Encoding: charsetDefinedResult,
      Browser_Console_Errors: browserErrorsResult,
      Geolocation_Request: geolocationRequestResult,
      Input_Paste_Allowed: inputPasteAllowedResult,
      Notification_Request: notificationRequestResult,
      Third_Party_Cookies: thirdPartyCookiesResult,
      Deprecated_APIs: deprecatedAPIsResult
    };

  } catch (error) {
    console.error("❌ Error in securityCompliance:", error);
    throw error;
  }
}
