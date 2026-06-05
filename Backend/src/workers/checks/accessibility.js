import * as cheerio from "cheerio";

export const key = "accessibility";
export const label = "Accessibility";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

const GENERIC_LINK_TEXT = new Set([
  "click here",
  "read more",
  "more",
  "here",
  "learn more",
  "this",
  "link",
]);

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

      // <html> lang
      const lang = ($("html").attr("lang") || "").trim();
      if (!lang) {
        push(url, "missing-html-lang", "<html> element missing lang attribute", "critical");
      }

      // Images missing alt
      let imgNoAlt = 0;
      $("img").each((_, el) => {
        if ($(el).attr("alt") === undefined) imgNoAlt++;
      });
      if (imgNoAlt > 0) {
        push(url, "img-missing-alt", `${imgNoAlt} image(s) missing alt attribute`, "warning");
      }

      // Form controls without label / aria-label
      let unlabeled = 0;
      $("input, select, textarea").each((_, el) => {
        const $el = $(el);
        const type = ($el.attr("type") || "").toLowerCase();
        if (type === "hidden" || type === "submit" || type === "button" || type === "reset" || type === "image") {
          return;
        }
        const ariaLabel = $el.attr("aria-label");
        const ariaLabelledby = $el.attr("aria-labelledby");
        const title = $el.attr("title");
        const id = $el.attr("id");
        let hasLabel = false;
        if (id) {
          // escape quotes/special chars minimally for selector safety
          const safeId = id.replace(/["\\]/g, "\\$&");
          if ($(`label[for="${safeId}"]`).length > 0) hasLabel = true;
        }
        if (!hasLabel && $el.closest("label").length > 0) hasLabel = true;
        if (!hasLabel && !ariaLabel && !ariaLabelledby && !title) {
          unlabeled++;
        }
      });
      if (unlabeled > 0) {
        push(url, "unlabeled-form-control", `${unlabeled} form control(s) without an associated label or aria-label`, "warning");
      }

      // Links with empty / generic text
      let genericLinks = 0;
      $("a").each((_, el) => {
        const $el = $(el);
        const text = ($el.text() || "").trim().toLowerCase().replace(/\s+/g, " ");
        const ariaLabel = $el.attr("aria-label");
        const hasImg = $el.find("img[alt]").filter((_, im) => ($(im).attr("alt") || "").trim() !== "").length > 0;
        if (!text && !ariaLabel && !hasImg) {
          genericLinks++;
        } else if (text && GENERIC_LINK_TEXT.has(text)) {
          genericLinks++;
        }
      });
      if (genericLinks > 0) {
        push(url, "generic-link-text", `${genericLinks} link(s) with empty or generic text (e.g. "click here")`, "info");
      }

      // Buttons with no text / aria-label
      let emptyButtons = 0;
      $('button, input[type="button"], input[type="submit"]').each((_, el) => {
        const $el = $(el);
        if (el.tagName && el.tagName.toLowerCase() === "input") {
          const val = ($el.attr("value") || "").trim();
          const ariaLabel = $el.attr("aria-label");
          if (!val && !ariaLabel) emptyButtons++;
          return;
        }
        const text = ($el.text() || "").trim();
        const ariaLabel = $el.attr("aria-label");
        const title = $el.attr("title");
        const hasImgAlt = $el.find("img[alt]").filter((_, im) => ($(im).attr("alt") || "").trim() !== "").length > 0;
        if (!text && !ariaLabel && !title && !hasImgAlt) emptyButtons++;
      });
      if (emptyButtons > 0) {
        push(url, "empty-button", `${emptyButtons} button(s) with no accessible text`, "warning");
      }

      // Heading order skips
      const levels = [];
      $("h1, h2, h3, h4, h5, h6").each((_, el) => {
        levels.push(parseInt(el.tagName.substring(1), 10));
      });
      let skips = 0;
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i - 1] > 1) skips++;
      }
      if (skips > 0) {
        push(url, "heading-skip", `${skips} heading level skip(s) detected (e.g. h1 -> h3)`, "info");
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
