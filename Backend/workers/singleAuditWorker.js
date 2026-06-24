import { workerData, parentPort } from "worker_threads";

import technicalMetrics from "../metricServices/technicalMetrics.js";
import seoMetrics from "../metricServices/seoMetrics.js";
import accessibilityMetrics from "../metricServices/accessibilityMetrics.js";
import securityCompliance from "../metricServices/securityCompliance.js";
import uxContentStructure from "../metricServices/uxContentStructure.js";
import conversionLeadFlow from "../metricServices/conversionLeadFlow.js";
import aioReadiness from "../metricServices/aioReadiness.js";
import AEOService from "../metricServices/aeoService.js";
import Puppeteer_Cheerio from "../utils/puppeteer_cheerio.js";
import { checkWebsiteExists } from "../utils/fastFetch.js";
import { performance } from "perf_hooks";
import logger from "../utils/logger.js";
import { classifyPageType } from "../utils/pageClassifier.js";

const { url, device, report, auditId, pageType: initialPageType } = workerData;
const pageType = initialPageType || classifyPageType(url);

// `report` is one of: "All" (full audit), a single section name, or a comma-joined
// list of section names — a custom subset chosen via the report-scope checklist.
// Parse it once so the worker can branch between the single / subset / full paths.
const requestedSections = report === "All"
  ? null
  : String(report).split(",").map((s) => s.trim()).filter(Boolean);
const isSubset = Array.isArray(requestedSections) && requestedSections.length > 1;

// Display names for the sectionScore rollup (match OverAll's labels).
const SECTION_DISPLAY_NAMES = {
  "Technical Performance": "Technical Performance",
  "On Page SEO": "On-Page SEO",
  "Accessibility": "Accessibility",
  "Security/Compliance": "Security/Compliance",
  "UX & Content Structure": "UX & Content Structure",
  "Conversion & Lead Flow": "Conversion & Lead Flow",
  "AIO (AI-Optimization) Readiness": "AIO Readiness",
  "AEO (Answer Engine Optimization)": "AEO",
};

const gradeFor = (score) =>
  score >= 90 ? "A+" : score >= 80 ? "A" : score >= 70 ? "B" : score >= 60 ? "C" : score >= 50 ? "D" : "F";

// [NEW] — This worker is DB-FREE. It never opens a Mongo connection. Instead it
// streams progress and the final result to the main thread, which owns the
// in-memory audit store and batches writes to MongoDB. These two helpers replace
// every former `SingleAuditReport.findByIdAndUpdate(...)` call.
//
//   postProgress(patch) — a progressive update (status change / one metric's result)
//   finish(patch)       — terminal update; the audit is done (completed or failed)
const postProgress = (patch) => {
  parentPort.postMessage({ type: "progress", auditId, patch });
};
const finish = (patch) => {
  parentPort.postMessage({ type: "done", auditId, patch });
};

// [NEW] — Worker-level unhandled rejection & uncaught exception safety net
// Catches any fire-and-forget promise rejections or asynchronous exceptions from
// third-party metric libraries or playwright-extra (e.g. cdpSession) that occur during page teardown.
// Without this, a late cdpSession or axe-core error crashes the worker thread.
function handleWorkerSafetyError(error) {
  const msg = error?.message || (typeof error === 'string' ? error : '');
  const lmsg = msg.toLowerCase();
  const isPageError = (
    lmsg.includes('detached') ||
    lmsg.includes('session closed') ||
    lmsg.includes('target closed') ||
    lmsg.includes('context was destroyed') ||
    lmsg.includes('frame is not ready') ||
    lmsg.includes('page/frame is not ready') ||
    lmsg.includes('cdpsession') ||
    !error // undefined/null error
  );
  if (isPageError) {
    // Expected during page teardown — suppress silently
  } else {
    logger.warn(`[Worker] Uncaught safety exception/promise rejection (non-fatal):`, error);
  }
}

process.on('unhandledRejection', handleWorkerSafetyError);
process.on('uncaughtException', handleWorkerSafetyError);


// [NEW] — Centralized detached frame error detector (mirrors puppeteer_cheerio.js)
function isDetachedFrameError(error) {
  if (!error) return true; // undefined/null rejection — treat as page teardown
  if (!error.message) return false;
  const msg = error.message.toLowerCase();
  return (
    msg.includes('detached frame') ||
    msg.includes('attempted to use detached') ||
    msg.includes('session closed') ||
    msg.includes('target closed') ||
    msg.includes('execution context was destroyed') ||
    msg.includes('context was destroyed') ||
    msg.includes('cannot find context with specified id') ||
    msg.includes('frame was detached') ||
    msg.includes('page/frame is not ready') ||  // axe-core specific
    msg.includes('frame is not ready')
  );
}

// [NEW] — Safe metric wrapper
// Runs a metric service function. If a detached frame error occurs mid-metric,
// logs a warning and returns null instead of crashing the entire audit.
async function safeMetric(name, fn) {
  try {
    return await fn();
  } catch (err) {
    if (isDetachedFrameError(err)) {
      logger.warn(`[Worker] ${name} skipped due to detached frame during page evaluation — continuing audit with partial data.`);
      return null;
    }
    // Unexpected error — re-throw so the outer catch can handle it
    throw err;
  }
}

const SECTION_WEIGHTS_BY_PAGE_TYPE = {
  home:    { tech: 18, seo: 18, a11y: 10, sec: 12, ux: 12, conv: 14, aio: 8, aeo: 8 },
  srp:     { tech: 20, seo: 20, a11y: 9,  sec: 8,  ux: 13, conv: 14, aio: 8, aeo: 8 },
  vdp:     { tech: 18, seo: 18, a11y: 9,  sec: 8,  ux: 13, conv: 18, aio: 7, aeo: 9 },
  specials:{ tech: 15, seo: 16, a11y: 9,  sec: 13, ux: 12, conv: 17, aio: 6, aeo: 12 },
  lease:   { tech: 15, seo: 16, a11y: 9,  sec: 14, ux: 12, conv: 16, aio: 6, aeo: 12 },
  trade:   { tech: 14, seo: 12, a11y: 11, sec: 16, ux: 13, conv: 22, aio: 6, aeo: 6 },
  finance: { tech: 14, seo: 12, a11y: 11, sec: 22, ux: 11, conv: 18, aio: 6, aeo: 6 },
  service: { tech: 16, seo: 16, a11y: 10, sec: 10, ux: 13, conv: 19, aio: 8, aeo: 8 },
  about:   { tech: 14, seo: 16, a11y: 11, sec: 10, ux: 15, conv: 12, aio: 10,aeo: 12 },
  content: { tech: 14, seo: 22, a11y: 11, sec: 9,  ux: 15, conv: 7,  aio: 10,aeo: 12 },
  generic: { tech: 18, seo: 17, a11y: 10, sec: 12, ux: 13, conv: 15, aio: 8, aeo: 7 }
};

const OverAll = (A, B, C, D, E, F, G, H, pageType = "generic") => {
  A ||= 0; B ||= 0; C ||= 0; D ||= 0; E ||= 0; F ||= 0; G ||= 0; H ||= 0;
  
  const w = SECTION_WEIGHTS_BY_PAGE_TYPE[pageType] || SECTION_WEIGHTS_BY_PAGE_TYPE.generic;
  const total = (A * w.tech + B * w.seo + C * w.a11y + D * w.sec + E * w.ux + F * w.conv + G * w.aio + H * w.aeo) / 100;

  return {
    totalScore: Number(total.toFixed(1)),
    grade: gradeFor(total),
    sectionScores: [
      { name: "Technical Performance", score: A },
      { name: "On-Page SEO", score: B },
      { name: "Accessibility", score: C },
      { name: "Security/Compliance", score: D },
      { name: "UX & Content Structure", score: E },
      { name: "Conversion & Lead Flow", score: F },
      { name: "AIO Readiness", score: G },
      { name: "AEO", score: H },
    ],
  };
};

(async () => {
  let browser;
  const start = performance.now();
  let currentAuditId = auditId;

  try {
    // [NEW] — WEBSITE EXISTENCE GATE (runs FIRST, BEFORE anything else)
    // Hit the URL with one lightweight HTTP GET. If the domain doesn't resolve
    // or the host refuses/drops the connection, there is no website to audit —
    // record the failure and STOP before launching Chromium or any metric.
    // A timeout/block/TLS error is treated as "exists" (fail open) so a slow or
    // bot-protected real site is never wrongly rejected. We keep the fetched
    // html/status to reuse for the dealership pre-check (no second round-trip).
    const existence = await checkWebsiteExists(url);
    if (!existence.exists) {
      logger.info(`🌐 Audit gated — website does not exist / unreachable: ${url} (${existence.errorCode})`);
      finish({
        status: "failed",
        error: `WEBSITE NOT FOUND — ${existence.reason}`,
        score: 0,
        grade: "F",
        timeTaken: `${((performance.now() - start) / 1000).toFixed(0)}s`,
      });
      return;
    }

    // [CHANGE] — Dealership detection check bypassed to allow auditing any website.
    // Set isDealership to true upfront so frontend knows it is allowed.
    postProgress({
      isDealership: true,
      dealershipDetection: null,
    });

    const { browser: b, page, response, $, screenshot, isBotProtected } = await Puppeteer_Cheerio(url, device, { auditId: currentAuditId, onProgress: postProgress });
    browser = b;
    postProgress({ screenshot, isBotProtected });

    // [NEW] — Guard: if page is null (Puppeteer_Cheerio returned a partial result due to
    // a top-level detached frame), complete audit gracefully with zero scores
    if (!page) {
      logger.warn(`[Worker] page is null after Puppeteer_Cheerio — frame detached during crawl. Completing audit with partial data.`);
      finish({
        status: "completed",
        error: "Audit completed with partial data — page context was lost due to a frame detachment event.",
        score: 0,
        grade: "F",
        timeTaken: `${((performance.now() - start) / 1000).toFixed(0)}s`
      });
      return;
    }

    if (isBotProtected) {
      logger.info(`🛡️ Marking report as Bot Protected: ${url}`);
      finish({
        status: "completed",
        error: "Bot Protected: This site is using advanced bot detection (CAPTCHA/Cloudflare). Only partial analysis was possible.",
        score: 0,
        grade: "F",
        timeTaken: `${((performance.now() - start) / 1000).toFixed(0)}s`
      });
      return;
    }

    // Fallback dealership gate removed.

    // Page type drives the per-section weighting of the page score (spec §5.6).
    // Use the post-redirect URL (page.url()) so a /finance → /credit-app redirect
    // is classified by where the browser actually landed.
    let finalUrl = url;
    try { const u = typeof page?.url === "function" ? page.url() : null; if (u) finalUrl = u; } catch { /* keep url */ }
    const pageType = classifyPageType(finalUrl);

    // ── Custom subset (2–6 sections chosen via the checklist) ──
    // Run only the selected metrics in parallel — each streams its own section the
    // moment it lands (like the full audit), then we roll the selected scores up to
    // a combined score/grade. A single section still uses the focused path below.
    if (isSubset) {
      // One runner per section: runs the metric, streams its result, returns the
      // field name + percentage so we can build the final patch + score rollup.
      const sectionRunners = {
        "Technical Performance": async () => {
          const r = await safeMetric("Technical Performance", () => technicalMetrics(url, device, page, response, browser, pageType));
          postProgress({ technicalPerformance: r });
          return { field: "technicalPerformance", value: r, pct: r?.Percentage || 0 };
        },
        "On Page SEO": async () => {
          const r = await safeMetric("On Page SEO", () => seoMetrics(url, $, page, pageType));
          postProgress({ onPageSEO: r, siteSchema: r?.Schema });
          return { field: "onPageSEO", value: r, pct: r?.Percentage || 0, extra: { siteSchema: r?.Schema } };
        },
        "Accessibility": async () => {
          const r = await safeMetric("Accessibility", () => accessibilityMetrics(page, $, pageType));
          postProgress({ accessibility: r });
          return { field: "accessibility", value: r, pct: r?.Percentage || 0 };
        },
        "Security/Compliance": async () => {
          const r = await safeMetric("Security/Compliance", () => securityCompliance(url, page, response, browser, pageType));
          postProgress({ securityOrCompliance: r });
          return { field: "securityOrCompliance", value: r, pct: r?.Percentage || 0 };
        },
        "UX & Content Structure": async () => {
          const r = await safeMetric("UX & Content Structure", () => uxContentStructure(device, page, pageType));
          postProgress({ UXOrContentStructure: r });
          return { field: "UXOrContentStructure", value: r, pct: r?.Percentage || 0 };
        },
        "Conversion & Lead Flow": async () => {
          const r = await safeMetric("Conversion & Lead Flow", () => conversionLeadFlow(page, $, pageType));
          postProgress({ conversionAndLeadFlow: r });
          return { field: "conversionAndLeadFlow", value: r, pct: r?.Percentage || 0 };
        },
        "AIO (AI-Optimization) Readiness": async () => {
          const r = await safeMetric("AIO Readiness", () => aioReadiness(url, page, $, pageType));
          postProgress({ aioReadiness: r, aioCompatibilityBadge: r?.AIO_Compatibility_Badge });
          return { field: "aioReadiness", value: r, pct: r?.Percentage || 0, extra: { aioCompatibilityBadge: r?.AIO_Compatibility_Badge } };
        },
        "AEO (Answer Engine Optimization)": async () => {
          // AEO is a TOP-LEVEL `aeo` section field; headline is the spec-weighted Percentage.
          const r = await safeMetric("AEO", () => AEOService.runAudit(url, $, null, 100, { pageType }));
          postProgress({ aeo: r });
          return { field: "aeo", value: r, pct: r?.Percentage || 0 };
        },
      };

      const selected = requestedSections.filter((s) => sectionRunners[s]);
      const results = (await Promise.all(selected.map((s) => sectionRunners[s]())));

      const updateData = {
        status: "completed",
        timeTaken: `${((performance.now() - start) / 1000).toFixed(0)}s`,
      };
      
      const w = SECTION_WEIGHTS_BY_PAGE_TYPE[pageType] || SECTION_WEIGHTS_BY_PAGE_TYPE.generic;
      const keyMap = {
        "Technical Performance": "tech",
        "On Page SEO": "seo",
        "Accessibility": "a11y",
        "Security/Compliance": "sec",
        "UX & Content Structure": "ux",
        "Conversion & Lead Flow": "conv",
        "AIO (AI-Optimization) Readiness": "aio",
        "AEO (Answer Engine Optimization)": "aeo"
      };

      let sumOfScoresTimesWeights = 0;
      let sumOfWeights = 0;
      const sectionScores = [];
      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        if (!res) continue;
        updateData[res.field] = res.value;
        if (res.extra) Object.assign(updateData, res.extra);
        
        const weightKey = keyMap[selected[i]];
        const weightVal = w[weightKey] || 0;
        sumOfScoresTimesWeights += res.pct * weightVal;
        sumOfWeights += weightVal;
        
        sectionScores.push({ name: SECTION_DISPLAY_NAMES[selected[i]] || selected[i], score: res.pct });
      }
      const avg = sumOfWeights > 0 ? sumOfScoresTimesWeights / sumOfWeights : 0;
      updateData.score = Number(avg.toFixed(1));
      updateData.grade = gradeFor(avg);
      updateData.sectionScore = sectionScores;

      finish(updateData);
      logger.info(`🧠 Worker Completed (subset: ${selected.join(", ")}) for URL: ${url}`);
      return;
    }

    if (report !== "All") {
      let result;

      // [NEW] — Each metric wrapped in safeMetric() to catch detached frame errors
      switch (report) {
        case "Technical Performance":
          result = await safeMetric("Technical Performance", () => technicalMetrics(url, device, page, response, browser, pageType));
          break;
        case "On Page SEO":
          result = await safeMetric("On Page SEO", () => seoMetrics(url, $, page, pageType));
          break;
        case "Accessibility":
          result = await safeMetric("Accessibility", () => accessibilityMetrics(page, $, pageType));
          break;
        case "Security/Compliance":
          result = await safeMetric("Security/Compliance", () => securityCompliance(url, page, response, browser, pageType));
          break;
        case "UX & Content Structure":
          result = await safeMetric("UX & Content Structure", () => uxContentStructure(device, page, pageType));
          break;
        case "Conversion & Lead Flow":
          result = await safeMetric("Conversion & Lead Flow", () => conversionLeadFlow(page, $, pageType));
          break;
        case "AIO (AI-Optimization) Readiness":
          result = await safeMetric("AIO Readiness", () => aioReadiness(url, page, $, pageType));
          break;
        case "AEO (Answer Engine Optimization)":
          result = await safeMetric("AEO", () => AEOService.runAudit(url, $, null, 100, { pageType }));
          break;
      }

      const timeTaken = ((performance.now() - start) / 1000).toFixed(0);

      const score = result?.Percentage || 0;
      const grade = score >= 90 ? "A+" :
        score >= 80 ? "A" :
          score >= 70 ? "B" :
            score >= 60 ? "C" :
              score >= 50 ? "D" : "F";

      const updateData = {
        status: "completed",
        timeTaken: `${timeTaken}s`,
        score: score,
        grade: grade,
      };

      if (report === "Technical Performance") updateData.technicalPerformance = result;
      if (report === "On Page SEO") {
        updateData.onPageSEO = result;
        updateData.siteSchema = result?.Schema;
      }
      if (report === "Accessibility") updateData.accessibility = result;
      if (report === "Security/Compliance") updateData.securityOrCompliance = result;
      if (report === "UX & Content Structure") updateData.UXOrContentStructure = result;
      if (report === "Conversion & Lead Flow") updateData.conversionAndLeadFlow = result;
      if (report === "AIO (AI-Optimization) Readiness") {
        updateData.aioReadiness = result;
        updateData.aioCompatibilityBadge = result?.AIO_Compatibility_Badge;
      }
      // AEO is its own top-level `aeo` section field; its headline is the spec-weighted Percentage.
      if (report === "AEO (Answer Engine Optimization)") {
        updateData.aeo = result;
      }

      finish(updateData);

      logger.info(`🧠 Worker Completed for URL: ${url}`);
      return;
    }

    // [NEW] — Run AIO & AEO FIRST so guests get results instantly
    const G_Res = await safeMetric("AIO Readiness", () => aioReadiness(url, page, $, pageType));
    const aeoRes = await safeMetric("AEO", () => AEOService.runAudit(url, $, null, 100, { pageType })); // Using 100 as placeholder for fast AEO return
    postProgress({
      aioReadiness: G_Res,
      aioCompatibilityBadge: G_Res?.AIO_Compatibility_Badge,
      aeo: aeoRes
    });

    // [CHANGE] — Full audit ("All"): run ALL metrics in PARALLEL.
    // Each is still wrapped in safeMetric() (a detached frame in one is non-fatal)
    // and still streams its own section to the main thread as soon as it finishes,
    // so the in-memory store fills in progressively and the polling UI updates live.
    // Promise.all runs them concurrently instead of one-by-one.
    const [A_Res, B_Res, C_Res, D_Res, E_Res, F_Res] = await Promise.all([
      (async () => {
        const r = await safeMetric("Technical Performance", () => technicalMetrics(url, device, page, response, browser, pageType));
        postProgress({ technicalPerformance: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("On Page SEO", () => seoMetrics(url, $, page, pageType));
        postProgress({ onPageSEO: r, siteSchema: r?.Schema });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("Accessibility", () => accessibilityMetrics(page, $, pageType));
        postProgress({ accessibility: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("Security/Compliance", () => securityCompliance(url, page, response, browser, pageType));
        postProgress({ securityOrCompliance: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("UX & Content Structure", () => uxContentStructure(device, page, pageType));
        postProgress({ UXOrContentStructure: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("Conversion & Lead Flow", () => conversionLeadFlow(page, $, pageType));
        postProgress({ conversionAndLeadFlow: r });
        return r;
      })(),
    ]);

    // Extract percentages for overall score calculation
    const A = A_Res?.Percentage || 0;
    const B = B_Res?.Percentage || 0;
    const C = C_Res?.Percentage || 0;
    const D = D_Res?.Percentage || 0;
    const E = E_Res?.Percentage || 0;
    const F = F_Res?.Percentage || 0;
    const G = G_Res?.Percentage || 0;
    const H = aeoRes?.Percentage || 0;

    const overall = OverAll(A, B, C, D, E, F, G, H, pageType);

    const timeTaken = ((performance.now() - start) / 1000).toFixed(0);

    finish({
      status: "completed",
      timeTaken: `${timeTaken}s`,
      score: overall.totalScore,
      grade: overall.grade,
      sectionScore: overall.sectionScores,
    });

    logger.info(`🧠 Worker Completed for URL: ${url}`);

  } catch (err) {
    // Report the failure to the main thread; it owns persistence.
    parentPort.postMessage({ type: "error", auditId: currentAuditId, error: err.message });

  } finally {
    if (browser) {
      try { await browser.close(); } catch { }
    }
  }
})();
