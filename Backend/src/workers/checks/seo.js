import * as cheerio from "cheerio";

export const key = "seo";
export const label = "SEO";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
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
      const $ = cheerio.load(p.html);
      const url = p.finalUrl || p.url;

      // Title
      const title = ($("title").first().text() || "").trim();
      if (!title) {
        push(url, "missing-title", "Page has no <title>", "critical");
      } else if (title.length < 10) {
        push(url, "short-title", `Title is too short (${title.length} chars)`, "warning");
      } else if (title.length > 65) {
        push(url, "long-title", `Title is too long (${title.length} chars)`, "warning");
      }

      // Meta description
      const desc = ($('meta[name="description"]').attr("content") || "").trim();
      if (!desc) {
        push(url, "missing-meta-description", "Page has no meta description", "warning");
      }

      // H1
      const h1Count = $("h1").length;
      if (h1Count === 0) {
        push(url, "missing-h1", "Page has no <h1>", "warning");
      } else if (h1Count > 1) {
        push(url, "multiple-h1", `Page has ${h1Count} <h1> elements`, "warning");
      }

      // Images missing alt
      let imgNoAlt = 0;
      $("img").each((_, el) => {
        const alt = $(el).attr("alt");
        if (alt === undefined) imgNoAlt++;
      });
      if (imgNoAlt > 0) {
        push(url, "img-missing-alt", `${imgNoAlt} image(s) missing alt attribute`, "warning");
      }

      // Canonical
      if ($('link[rel="canonical"]').length === 0) {
        push(url, "missing-canonical", "Page has no <link rel=canonical>", "info");
      }

      // Viewport
      if ($('meta[name="viewport"]').length === 0) {
        push(url, "missing-viewport", "Page has no meta viewport", "warning");
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
