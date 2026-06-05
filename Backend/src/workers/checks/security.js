import * as cheerio from "cheerio";

export const key = "security";
export const label = "Security";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function getHeader(headers, name) {
  if (!headers) return undefined;
  // headers are expected lowercase-keyed, but be defensive
  if (name in headers) return headers[name];
  const lower = name.toLowerCase();
  for (const k of Object.keys(headers)) {
    if (k.toLowerCase() === lower) return headers[k];
  }
  return undefined;
}

function leaksVersion(value) {
  // Looks for a digit-dot-digit pattern (e.g. nginx/1.18.0, PHP/7.4)
  return typeof value === "string" && /\d+\.\d+/.test(value);
}

export async function run(pages, ctx) {
  try {
    const issues = [];
    const penalties = { critical: 12, warning: 4, info: 1 };
    let score = 100;
    let analyzed = 0;

    const push = (page, type, message, severity) => {
      if (issues.length < 50) {
        issues.push({ page, type, message, severity });
      }
      score -= penalties[severity] || 0;
    };

    for (const p of pages || []) {
      if (!p || !p.ok || !p.html) continue;
      analyzed++;
      const headers = p.headers || {};
      const url = p.finalUrl || p.url || "";

      // Served over http
      if (/^http:\/\//i.test(url)) {
        push(url, "no-https", "Page served over http, not https", "critical");
      }

      // HSTS
      if (getHeader(headers, "strict-transport-security") === undefined) {
        push(url, "missing-hsts", "Missing strict-transport-security header", "warning");
      }

      // CSP
      const csp = getHeader(headers, "content-security-policy");
      if (csp === undefined) {
        push(url, "missing-csp", "Missing content-security-policy header", "warning");
      }

      // X-Content-Type-Options
      if (getHeader(headers, "x-content-type-options") === undefined) {
        push(url, "missing-x-content-type-options", "Missing x-content-type-options header", "info");
      }

      // X-Frame-Options AND no frame-ancestors in CSP
      const xfo = getHeader(headers, "x-frame-options");
      const cspHasFrameAncestors = typeof csp === "string" && /frame-ancestors/i.test(csp);
      if (xfo === undefined && !cspHasFrameAncestors) {
        push(url, "missing-clickjacking-protection", "Missing x-frame-options and no frame-ancestors in CSP", "warning");
      }

      // Server / X-Powered-By version leak
      const server = getHeader(headers, "server");
      if (leaksVersion(server)) {
        push(url, "server-version-leak", `Server header leaks version info: ${server}`, "info");
      }
      const poweredBy = getHeader(headers, "x-powered-by");
      if (poweredBy !== undefined) {
        const msg = leaksVersion(poweredBy)
          ? `x-powered-by leaks version info: ${poweredBy}`
          : `x-powered-by header exposes technology: ${poweredBy}`;
        push(url, "x-powered-by-leak", msg, "info");
      }

      // Forms with http action
      const $ = cheerio.load(p.html);
      let insecureForms = 0;
      $("form").each((_, el) => {
        const action = ($(el).attr("action") || "").trim();
        if (/^http:\/\//i.test(action)) insecureForms++;
      });
      if (insecureForms > 0) {
        push(url, "insecure-form-action", `${insecureForms} form(s) submit to an http:// action`, "critical");
      }
    }

    const criticalIssues = issues.filter((i) => i.severity === "critical").length;

    return {
      key,
      label,
      status: "done",
      score: clamp(Math.round(score), 0, 100),
      issuesFound: issues.length,
      criticalIssues,
      issues,
      details: { pagesAnalyzed: analyzed },
    };
  } catch (err) {
    return {
      key,
      label,
      status: "failed",
      score: 0,
      issuesFound: 0,
      criticalIssues: 0,
      issues: [],
      details: { error: err.message },
    };
  }
}

export default { key, label, run };
