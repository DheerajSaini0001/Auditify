// ============================================================================
// Plain-language rewriter for Security & Compliance findings.
// ----------------------------------------------------------------------------
// The checks themselves produced accurate but engineer-facing text — "CSP header
// is missing", "The Content-Security-Policy (CSP) header is missing." A dealer
// principal reading their own audit has no way to act on that: they don't know
// what a CSP is, and nothing tells them what it costs them to not have one.
//
// This module rewrites the three fields the Security page actually renders:
//   details                 → the one-line summary on the card
//   analysis.cause          → shown under "Root Cause"
//   analysis.recommendation → shown under "Recommendation"
//
// House style, applied to every entry below:
//   1. Every acronym is expanded in brackets on first use — CSP (Content
//      Security Policy), MFA (Multi-Factor Authentication). The reader should
//      never have to look one up.
//   2. Cause is TWO sentences, hard limit: what it means, then what can
//      actually happen — concretely, in dealership terms (a finance form, a
//      lead form, a Google warning, phone leads).
//   3. Recommendation is one or two short sentences: the plain action first,
//      then the exact technical instruction so the developer who receives the
//      report can act without a translation step.
// Short on purpose. An owner skims this card; a wall of text gets skipped, and
// a finding that is skipped may as well not exist.
//
// Honesty rule: no scare copy. A missing header is not "you have been hacked".
// The consequence is always stated conditionally ("if a harmful script does get
// in, nothing stops it") because that is what the check actually proves.
//
// Scores, statuses and weights are untouched — this is wording only.
// ============================================================================

// Small helpers so a missing meta field degrades to a still-readable sentence
// rather than "undefined" leaking into customer-facing copy.
const n = (v, fallback = null) => (typeof v === "number" && Number.isFinite(v) ? v : fallback);
const plural = (count, one, many) => `${count} ${count === 1 ? one : many}`;

// Each entry maps a parameter key to a function of the computed metric.
// Return null to leave the original text alone (e.g. a state we don't rewrite).
const COPY = {
  // ── Transport ────────────────────────────────────────────────────────────
  HTTPS: (m) => {
    const insecure = n(m.meta?.activeCount, 0) + n(m.meta?.passiveCount, 0);
    if (m.status === "fail" && m.meta?.protocol && m.meta.protocol !== "https:") {
      return {
        details: "Your site is not using a secure connection",
        cause:
          "Your site runs on HTTP (Hypertext Transfer Protocol) instead of HTTPS (the secure version), so nothing customers type is encrypted. Browsers show a \"Not secure\" warning, and anyone on the same public wifi can read what goes into your enquiry and finance forms.",
        recommendation:
          "Fix this before anything else on the list. Ask your host to install an SSL certificate and redirect all http:// traffic to https:// — most provide one free.",
      };
    }
    if (insecure > 0) {
      return {
        details: `Secure connection, but ${plural(insecure, "file loads", "files load")} insecurely`,
        cause:
          `Your pages are secure, but ${plural(insecure, "file is", "files are")} still loading unencrypted. Browsers block scripts and stylesheets like this outright, so part of your page may not work — and the padlock disappears from the address bar.`,
        recommendation:
          "Update these files to load over https:// instead of http://. Usually a small edit to a template or a third-party embed code.",
      };
    }
    // Failed or warned, but meta didn't say which case — never leave the
    // engineer-facing string as the fallback.
    return {
      details: "There is a problem with your secure connection",
      cause:
        "Something is wrong with how your site serves pages over HTTPS (Hypertext Transfer Protocol Secure). Until it is resolved, some visitors may see a browser warning instead of your page.",
      recommendation:
        "Ask your developer to check that every page loads over https:// and that nothing on the page still loads over http://.",
    };
  },

  SSL: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "There is a problem with your security certificate",
          cause:
            "Your SSL (Secure Sockets Layer) certificate — the file that proves this site is really yours — is invalid or incorrectly installed. Visitors get a full-page browser warning that the site is unsafe, and most leave rather than click past it.",
          recommendation:
            "Ask your host to reissue and reinstall the certificate with the full chain included. Usually fixed within a few hours.",
        },

  SSL_Expiry: (m) => {
    const days = n(m.meta?.daysUntilExpiry);
    if (days === null) {
      return {
        details: "Your security certificate needs checking",
        cause:
          "The expiry date on your SSL (Secure Sockets Layer) certificate could not be read. If it lapses, every visitor sees a full-page warning that your site is unsafe and enquiries stop until it is renewed.",
        recommendation:
          "Ask your host to confirm the expiry date and turn on auto-renewal so it can never lapse unnoticed.",
      };
    }
    if (days < 0) {
      return {
        details: "Your security certificate has expired",
        cause:
          "Your SSL (Secure Sockets Layer) certificate has run out. Every visitor now sees a full-page warning that your site is unsafe, so enquiries and phone leads will drop off sharply until it is renewed.",
        recommendation:
          "Renew it today — this is a live outage, not a future risk. Then turn on auto-renewal with your host.",
      };
    }
    return {
      details: `Your security certificate expires in ${plural(days, "day", "days")}`,
      cause:
        `Your SSL (Secure Sockets Layer) certificate expires in ${plural(days, "day", "days")}. When it does, every visitor sees a full-page "unsafe site" warning and enquiries stop until someone renews it.`,
      recommendation:
        "Renew now rather than waiting, and ask your host to enable auto-renewal so it never becomes an outage.",
    };
  },

  TLS_Version: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Your site is using an outdated encryption standard",
          cause:
            "Your site encrypts customer data with an old version of TLS (Transport Layer Security) that has known weaknesses. Modern browsers are starting to refuse these connections, so some customers may find your site will not open at all.",
          recommendation:
            "Ask your host to enable TLS 1.2 as the minimum and 1.3 where available, and switch off the older versions. Server setting only — no change to your site.",
        },

  HSTS: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Visitors can still reach an insecure version of your site",
          cause:
            "HSTS (HTTP Strict Transport Security) tells browsers to always use the secure version of your site, and yours is not set. A customer typing your address without \"https\" is briefly unprotected, which is long enough to be redirected to a fake copy of your site.",
          recommendation:
            "Ask your developer to add a Strict-Transport-Security header with a max-age of at least one year. One line of server config.",
        },

  // ── Headers ──────────────────────────────────────────────────────────────
  // Composite card (infoOnly) — the individual header params below carry the
  // score. Copy points the reader downward rather than repeating each item.
  Header_Security: (m) => {
    const grade = m.meta?.grade;
    const failing = Array.isArray(m.meta?.deductions) ? m.meta.deductions.length : 0;
    return {
      details: grade
        ? `Your security headers grade is ${grade}`
        : "Your security headers need work",
      cause:
        `Security headers are instructions your server sends with every page telling the browser how to protect the visitor${
          failing ? `, and ${plural(failing, "test is", "tests are")} currently failing` : ""
        }. This is the same grade SecurityHeaders.com and Mozilla Observatory would give you, so it is what anyone checking your site from outside will see.`,
      recommendation:
        "Work through the individual header items listed below — the biggest gains come first from CSP (Content Security Policy) and HSTS (HTTP Strict Transport Security). All of them are server configuration, not changes to your website.",
    };
  },

  CSP: (m) => {
    if (m.status === "pass") return null;
    if (m.meta?.reportOnly) {
      return {
        details: "Your script protection is switched to monitoring only",
        cause:
          "Your CSP (Content Security Policy) is set to watch and report rather than block. It records problems without stopping them, so a harmful script would still run.",
        recommendation:
          "Review what it has been logging, fix the legitimate items, then switch it to the enforcing Content-Security-Policy header.",
      };
    }
    return {
      details: "Your site does not control which code is allowed to run on it",
      cause:
        "A CSP (Content Security Policy) tells the browser which code is allowed to run on your pages, and yours has none. Dealer sites load a lot of outside code — chat widgets, inventory feeds, tracking pixels — and if any one of them is compromised, a harmful script could read what customers type into your finance form.",
      recommendation:
        "Ask your developer to add a Content-Security-Policy header. Run it in report-only mode for a week first to see what your site legitimately loads, then enforce it.",
    };
  },

  X_Frame_Options: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Someone else can embed your site inside theirs",
          cause:
            "Another website can load your pages invisibly inside their own. This is used to trick people into clicking something they cannot see — on your enquiry form, it can submit in a customer's name.",
          recommendation:
            "Ask your developer to add an X-Frame-Options header set to SAMEORIGIN, or a frame-ancestors 'self' rule in your CSP (Content Security Policy).",
        },

  X_Content_Type_Options: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Browsers are guessing what your files are",
          cause:
            "Your server does not firmly state what type each file is, so browsers guess. Someone can upload a file that looks like a harmless image but which the browser decides to run as code.",
          recommendation:
            "Ask your developer to add the X-Content-Type-Options header set to nosniff. A single line with no side effects.",
        },

  Referrer_Policy: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Your site leaks page addresses to other websites",
          cause:
            "When visitors click away, their browser tells the other site exactly which page they came from. That can include pages you would rather keep private — a customer's saved-vehicle page or a quote link.",
          recommendation:
            "Ask your developer to add a Referrer-Policy header set to strict-origin-when-cross-origin. Other sites then see only your domain name.",
        },

  Permissions_Policy: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Your pages do not restrict camera, microphone and location access",
          cause:
            "Your site does not state which device features embedded code may use. A third-party chat or video tool can therefore ask your customers for camera, microphone or location access — and the request looks like it came from you.",
          recommendation:
            "Ask your developer to add a Permissions-Policy header switching off camera, microphone, geolocation and payment if your site does not use them.",
        },

  // ── Cookies ──────────────────────────────────────────────────────────────
  Cookie_Flags: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Your cookies are not fully protected",
          cause:
            "Cookies are the small files that keep a visitor recognised as they browse. Yours are missing protective settings, so scripts on the page can read them — and a stolen login cookie lets someone act as that person.",
          recommendation:
            "Ask your developer to set the Secure, HttpOnly and SameSite flags on your cookies. No change to how the site behaves.",
        },

  Third_Party_Cookies: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Outside companies are tracking your visitors",
          cause:
            "Other companies are setting cookies on your visitors through code embedded in your pages — usually ads, analytics or chat. You stay responsible for that data under privacy law, and your privacy policy has to disclose it.",
          recommendation:
            "Remove any tool you no longer use, and make sure your privacy policy names the ones you keep and what they collect.",
        },

  // ── Reputation ───────────────────────────────────────────────────────────
  Reputation: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Your site is flagged on a security blocklist",
          cause:
            "A security service has flagged your domain as unsafe. Chrome and Safari show a red full-screen warning before your page loads and Google can drop you from search results, so enquiries stop almost completely while a flag is active.",
          recommendation:
            "Treat this as urgent. Have your developer find and remove any injected code, then request a review in Google Search Console — removal usually takes 24 to 72 hours.",
        },

  // ── Application exposure ─────────────────────────────────────────────────
  SQLi_Exposure: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Your site may not be filtering what visitors type into it",
          cause:
            "Signs suggest that text typed into your site — a search box or a form — may reach your database unchecked. Someone could then type instructions instead of text and pull out stored customer enquiries. This is a surface indicator, not proof.",
          recommendation:
            "Have your developer confirm it with a proper test. The fix is parameterised database queries wherever visitor input is involved.",
        },

  XSS: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Your site may allow harmful code to be inserted into a page",
          cause:
            "XSS (Cross-Site Scripting) is when text a visitor supplies gets shown back on the page without being made safe first, and signs suggest that may be possible here. Someone could craft a link that runs their code on your site and captures what a customer types. Surface indicator only, not proof.",
          recommendation:
            "Have your developer verify it properly. The fix is escaping all visitor-supplied content when displaying it; a CSP (Content Security Policy) limits the damage if something slips through.",
        },

  Forms_Use_HTTPS: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "A form on your site submits data insecurely",
          cause:
            "At least one form sends what customers type to an unencrypted address, so their name, phone and finance details travel in plain readable text. Browsers also warn before submitting, which makes most people abandon the form.",
          recommendation:
            "Change the form's action address to https://. Usually a one-word edit for your developer.",
        },

  Weak_Default_Credentials: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Your site may still be using default login details",
          cause:
            "An account appears to still use the username and password the software shipped with. Those defaults are published in the software's own documentation, and bots test them against thousands of sites a day.",
          recommendation:
            "Change every default password now and turn on MFA (Multi-Factor Authentication) for admin accounts. Also review who still has access — former staff and agencies are a common way in.",
        },

  Admin_Panel_Public: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Your admin login page is publicly reachable",
          cause:
            "The page where staff log in to manage your website can be found by anyone. That lets bots sit there guessing passwords, and it tells an attacker exactly which software you run.",
          recommendation:
            "Ask your developer to restrict admin access by IP address or move it off the default address. Turn on MFA (Multi-Factor Authentication) either way.",
        },

  // MFA_Enabled was removed as a parameter — see securityCompliance.js. MFA is
  // still recommended in Weak_Default_Credentials and Admin_Panel_Public, where
  // it is honest advice rather than a scored claim about what we could detect.

  // ── Privacy & legal ──────────────────────────────────────────────────────
  Cookie_Consent: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Visitors are not given a choice about being tracked",
          cause:
            "Tracking starts the moment someone lands on your site, with no way to decline. What the law actually requires here depends on where your customers are, and the rules differ significantly between markets.",
          recommendation:
            "Confirm which privacy rules apply to your customer base. At minimum, your privacy policy should list the tracking tools you use and what each one collects.",
        },

  Privacy_Policy: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "No privacy policy could be found",
          cause:
            "Your forms collect personal details, but there is no reachable page saying what you collect, why, and who else receives it. That is a legal requirement in both the US and Australia, and cautious customers check for it before handing over their details.",
          recommendation:
            "Publish a privacy policy and link it in your footer and next to every form that collects personal details.",
        },

  Privacy_Compliance: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Your privacy disclosures are incomplete",
          cause:
            "Your privacy policy is missing things regulators expect — Australian sites must name the countries data is sent to, while US sites must offer an opt-out from data being sold or shared. Most dealer sites send data overseas without realising it, through a US-hosted CRM (Customer Relationship Management) system or chat tool.",
          recommendation:
            "Have the policy reviewed against your market's rules and list the third-party tools your site actually uses. This check's details show which ones were found.",
        },

  Finance_Form_Security: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Your finance application form has security gaps",
          cause:
            "This is the most sensitive form on your site — customers enter income and identification into it. The checks found gaps in how that information is handled, and a problem here carries far more weight than anywhere else on the site.",
          recommendation:
            "Highest priority in this section. Make sure the form submits over https, that no personal details appear in the page address, and that stored data is encrypted.",
        },

  Legal_Disclaimers: (m) =>
    m.status === "pass"
      ? null
      : {
          details: "Required pricing or finance wording is missing",
          cause:
            "Pages advertising a price, repayment or offer are missing wording regulators expect alongside those claims. The US requires full credit terms wherever a repayment is shown; Australia requires the total drive-away price and a comparison rate.",
          recommendation:
            "Review every page showing a price or offer and add the required wording, including expiry date and conditions. Have it confirmed by someone who knows motor-dealer advertising rules in your market.",
        },
};

/**
 * Rewrite one Security metric's customer-facing wording.
 * Returns the SAME object shape with details/analysis replaced where we have
 * copy for it; anything without an entry is returned untouched.
 *
 * Never alters score, status, confidence, meta or weight — wording only.
 */
export function humanizeSecurityMetric(key, metric) {
  if (!metric || typeof metric !== "object") return metric;

  // Only ever rewrite a metric that actually FAILED or warned.
  // securityCompliance.js has 18 branches that return "not_applicable", a null
  // status, or notCalculated — a page with no finance form, an unavailable
  // certificate date, a check whose API key is absent. Those are "we didn't
  // measure this", NOT "your site has a problem", and telling an owner their
  // finance form is insecure when the site has no finance form is worse than
  // the engineer-facing wording this module exists to replace.
  if (metric.status !== "fail" && metric.status !== "warning") return metric;
  if (metric.notCalculated === true) return metric;
  if (typeof metric.score !== "number") return metric;

  const writer = COPY[key];
  if (typeof writer !== "function") return metric;

  let copy = null;
  try {
    copy = writer(metric);
  } catch (_) {
    return metric; // a broken copy rule must never break an audit
  }
  if (!copy) return metric;

  return {
    ...metric,
    ...(copy.details ? { details: copy.details } : {}),
    analysis: {
      ...(metric.analysis || {}),
      ...(copy.cause ? { cause: copy.cause } : {}),
      ...(copy.recommendation ? { recommendation: copy.recommendation } : {}),
      // Keep the original engineer-facing wording so it is not lost — useful
      // for a "technical detail" toggle and for anyone debugging a finding.
      ...(metric.analysis?.cause && copy.cause ? { technicalCause: metric.analysis.cause } : {}),
      ...(metric.analysis?.recommendation && copy.recommendation
        ? { technicalRecommendation: metric.analysis.recommendation }
        : {}),
    },
    ...(metric.details && copy.details ? { technicalDetails: metric.details } : {}),
  };
}

/** Apply the rewriter across a whole section result, in place-safe fashion. */
export function humanizeSecuritySection(section) {
  if (!section || typeof section !== "object") return section;
  const out = { ...section };
  for (const key of Object.keys(COPY)) {
    if (out[key]) out[key] = humanizeSecurityMetric(key, out[key]);
  }
  return out;
}

export default humanizeSecuritySection;
