import * as cheerio from "cheerio";

export const key = "performance";
export const label = "Performance";

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
      if (!p) continue;
      const url = p.finalUrl || p.url;

      // Non-200 status (even if not ok we can flag it)
      if (typeof p.status === "number" && (p.status < 200 || p.status >= 300)) {
        push(url, "non-200-status", `Page returned status ${p.status}`, "warning");
      }

      if (!p.ok || !p.html) continue;
      analyzed++;
      const $ = cheerio.load(p.html);

      // Timing
      if (typeof p.timingMs === "number") {
        if (p.timingMs > 4000) {
          push(url, "slow-response", `Response took ${p.timingMs}ms (>4000ms)`, "critical");
        } else if (p.timingMs > 1500) {
          push(url, "slow-response", `Response took ${p.timingMs}ms (>1500ms)`, "warning");
        }
      }

      // Size
      if (typeof p.sizeBytes === "number") {
        if (p.sizeBytes > 2 * 1024 * 1024) {
          push(url, "large-html", `HTML is ${Math.round(p.sizeBytes / 1024)}KB (>2MB)`, "critical");
        } else if (p.sizeBytes > 500 * 1024) {
          push(url, "large-html", `HTML is ${Math.round(p.sizeBytes / 1024)}KB (>500KB)`, "warning");
        }
      }

      // Script count
      const scriptCount = $("script").length;
      if (scriptCount > 30) {
        push(url, "many-scripts", `Page has ${scriptCount} <script> tags`, "warning");
      }

      // Images without width/height (layout shift)
      let imgNoDims = 0;
      $("img").each((_, el) => {
        const w = $(el).attr("width");
        const h = $(el).attr("height");
        if (w === undefined || h === undefined) imgNoDims++;
      });
      if (imgNoDims > 0) {
        push(url, "img-no-dimensions", `${imgNoDims} image(s) missing width/height (layout shift risk)`, "info");
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
