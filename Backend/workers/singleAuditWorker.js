import { workerData, parentPort } from "worker_threads";
import mongoose from "mongoose";
import dbConnect from "../config/db.js";
import SingleAuditReport from "../models/singleAuditReport.js";

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
import { detectDealership } from "../utils/dealershipDetector.js";
import * as cheerio from "cheerio";
import { performance } from "perf_hooks";
import logger from "../utils/logger.js";

const { url, device, report, auditId } = workerData;

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

const OverAll = (A, B, C, D, E, F, G) => {
  A ||= 0; B ||= 0; C ||= 0; D ||= 0; E ||= 0; F ||= 0; G ||= 0;
  const total = (A + B + C + D + E + F + G) / 7;

  return {
    totalScore: Number(total.toFixed(1)),
    grade:
      total >= 90 ? "A+" :
        total >= 80 ? "A" :
          total >= 70 ? "B" :
            total >= 60 ? "C" :
              total >= 50 ? "D" : "F",
    sectionScores: [
      { name: "Technical Performance", score: A },
      { name: "On-Page SEO", score: B },
      { name: "Accessibility", score: C },
      { name: "Security/Compliance", score: D },
      { name: "UX & Content Structure", score: E },
      { name: "Conversion & Lead Flow", score: F },
      { name: "AIO Readiness", score: G },
    ],
  };
};

(async () => {
  let browser;
  const start = performance.now();
  let currentAuditId = auditId;

  try {
    if (mongoose.connection.readyState !== 1) {
      await dbConnect({ maxPoolSize: 1 });
    }

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
      await SingleAuditReport.findByIdAndUpdate(currentAuditId, {
        status: "failed",
        error: `WEBSITE NOT FOUND — ${existence.reason}`,
        score: 0,
        grade: "F",
        timeTaken: `${((performance.now() - start) / 1000).toFixed(0)}s`,
      });
      parentPort.postMessage({ success: true, reportId: currentAuditId });
      return;
    }

    // [NEW] — DEALERSHIP DETECTION GATE (runs FIRST, BEFORE the audit)
    // A fast, lightweight page fetch is classified up front. If the site is
    // definitively NOT a dealership, we record the verdict and STOP here —
    // the heavy audit (render wait, screenshot, metrics) never starts, so the
    // user never sees an audit begin and then get terminated mid-way.
    // Reuses the html/status already fetched by the existence gate above, so the
    // detector reads raw HTML without launching Chromium or re-fetching. If that
    // markup was blocked/empty, detection is inconclusive and we fall through to
    // the full-render audit below (which has proper bot-bypass handling).
    let preDetection = null;
    try {
      preDetection = await detectDealership({ url, $: cheerio.load(existence.html || ""), statusCode: existence.status });
    } catch (gateErr) {
      logger.warn(`[Worker] Pre-audit dealership check failed — will re-check after full load: ${gateErr.message}`);
    }
    // "Inconclusive" = the quick fetch couldn't evaluate (blocked / challenge /
    // empty). We FAIL OPEN — never reject on inconclusive; fall through to the
    // full-render audit (which has proper bot-protection handling).
    const preInconclusive = !preDetection || preDetection.inconclusive;

    if (preDetection && preDetection.isDealership === false && !preInconclusive) {
      logger.info(`🚫 Audit gated (pre-check) — not a dealership: ${url}`);
      await SingleAuditReport.findByIdAndUpdate(currentAuditId, {
        status: "completed",
        isDealership: false,
        dealershipDetection: preDetection,
        error: `NOT A DEALERSHIP WEBSITE — ${preDetection.reason}`,
        score: 0,
        grade: "F",
        timeTaken: `${((performance.now() - start) / 1000).toFixed(0)}s`,
      });
      parentPort.postMessage({ success: true, reportId: currentAuditId });
      return;
    }

    const { browser: b, page, response, $, screenshot, isBotProtected } = await Puppeteer_Cheerio(url, device, currentAuditId);
    browser = b;
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { screenshot, isBotProtected });

    // [NEW] — Guard: if page is null (Puppeteer_Cheerio returned a partial result due to
    // a top-level detached frame), complete audit gracefully with zero scores
    if (!page) {
      logger.warn(`[Worker] page is null after Puppeteer_Cheerio — frame detached during crawl. Completing audit with partial data.`);
      await SingleAuditReport.findByIdAndUpdate(currentAuditId, {
        status: "completed",
        error: "Audit completed with partial data — page context was lost due to a frame detachment event.",
        score: 0,
        grade: "F",
        timeTaken: `${((performance.now() - start) / 1000).toFixed(0)}s`
      });
      parentPort.postMessage({ success: true, reportId: currentAuditId });
      return;
    }

    if (isBotProtected) {
      logger.info(`🛡️ Marking report as Bot Protected: ${url}`);
      await SingleAuditReport.findByIdAndUpdate(currentAuditId, {
        status: "completed",
        error: "Bot Protected: This site is using advanced bot detection (CAPTCHA/Cloudflare). Only partial analysis was possible.",
        score: 0,
        grade: "F",
        timeTaken: `${((performance.now() - start) / 1000).toFixed(0)}s`
      });
      parentPort.postMessage({ success: true, reportId: currentAuditId });
      return;
    }

    // [NEW] — DEALERSHIP DETECTION GATE (fallback, full-render)
    // Only re-runs detection when the fast pre-check above was inconclusive
    // (site was blocked/empty for the lightweight fetch). The fully-rendered page
    // gives a reliable final verdict. If the pre-check already decided, reuse it.
    let detection = preInconclusive ? null : preDetection;
    if (!detection) {
      detection = await safeMetric("Dealership Detection", () =>
        detectDealership({ url, $, page, response })
      );
    }
    // FAIL OPEN: only block on a CONFIDENT negative. If detection is inconclusive
    // (challenge/blocked/empty even after full render) we proceed with the audit
    // rather than wrongly reject a real dealership.
    if (detection && detection.isDealership === false && !detection.inconclusive) {
      logger.info(`🚫 Audit gated — not a dealership: ${url}`);
      await SingleAuditReport.findByIdAndUpdate(currentAuditId, {
        status: "completed",
        isDealership: false,
        dealershipDetection: detection,
        error: `NOT A DEALERSHIP WEBSITE — ${detection.reason}`,
        score: 0,
        grade: "F",
        timeTaken: `${((performance.now() - start) / 1000).toFixed(0)}s`,
      });
      parentPort.postMessage({ success: true, reportId: currentAuditId });
      return;
    }
    // Confirmed dealership (or inconclusive/unavailable — proceeding either way).
    // Only record a positive flag for a CONFIRMED dealership; leave it null
    // (unknown) when detection was inconclusive so we don't mislabel the report.
    const confirmedDealer = !!(detection && detection.isDealership === true);
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, {
      isDealership: confirmedDealer ? true : null,
      dealershipDetection: confirmedDealer ? detection : null,
    });

    if (report !== "All") {
      let result;

      // [NEW] — Each metric wrapped in safeMetric() to catch detached frame errors
      switch (report) {
        case "Technical Performance":
          result = await safeMetric("Technical Performance", () => technicalMetrics(url, device, page, response, browser));
          break;
        case "On Page SEO":
          result = await safeMetric("On Page SEO", () => seoMetrics(url, $, page));
          break;
        case "Accessibility":
          result = await safeMetric("Accessibility", () => accessibilityMetrics(page, $));
          break;
        case "Security/Compliance":
          result = await safeMetric("Security/Compliance", () => securityCompliance(url, page, response, browser));
          break;
        case "UX & Content Structure":
          result = await safeMetric("UX & Content Structure", () => uxContentStructure(device, page));
          break;
        case "Conversion & Lead Flow":
          result = await safeMetric("Conversion & Lead Flow", () => conversionLeadFlow(page, $));
          break;
        case "AIO (AI-Optimization) Readiness":
          const techRes = await safeMetric("Technical Performance (AIO pre-req)", () => technicalMetrics(url, device, page, response, browser));
          result = await safeMetric("AIO Readiness", () => aioReadiness(url, page, $));
          const aeoResultSingle = await safeMetric("AEO (AIO)", () => AEOService.runAudit(url, $, null, techRes?.Percentage || 100));
          if (result) result.aeo = aeoResultSingle;
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

      await SingleAuditReport.findByIdAndUpdate(currentAuditId, updateData);

      logger.info(`🧠 Worker Completed for URL: ${url}`);

      parentPort.postMessage({ success: true, reportId: currentAuditId });
      return;
    }

    // [NEW] — Run AIO & AEO FIRST so guests get results instantly
    const G_Res = await safeMetric("AIO Readiness", () => aioReadiness(url, page, $));
    const aeoRes = await safeMetric("AEO", () => AEOService.runAudit(url, $, null, 100)); // Using 100 as placeholder for fast AEO return
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, {
      aioReadiness: G_Res,
      aioCompatibilityBadge: G_Res?.AIO_Compatibility_Badge,
      aeo: aeoRes
    });

    // [CHANGE] — Full audit ("All"): run ALL metrics in PARALLEL.
    // Each is still wrapped in safeMetric() (a detached frame in one is non-fatal)
    // and still writes its own section as soon as it finishes, so the UI fills in
    // progressively. Promise.all runs them concurrently instead of one-by-one.
    const [A_Res, B_Res, C_Res, D_Res, E_Res, F_Res] = await Promise.all([
      (async () => {
        const r = await safeMetric("Technical Performance", () => technicalMetrics(url, device, page, response, browser));
        await SingleAuditReport.findByIdAndUpdate(currentAuditId, { technicalPerformance: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("On Page SEO", () => seoMetrics(url, $, page));
        await SingleAuditReport.findByIdAndUpdate(currentAuditId, { onPageSEO: r, siteSchema: r?.Schema });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("Accessibility", () => accessibilityMetrics(page, $));
        await SingleAuditReport.findByIdAndUpdate(currentAuditId, { accessibility: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("Security/Compliance", () => securityCompliance(url, page, response, browser));
        await SingleAuditReport.findByIdAndUpdate(currentAuditId, { securityOrCompliance: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("UX & Content Structure", () => uxContentStructure(device, page));
        await SingleAuditReport.findByIdAndUpdate(currentAuditId, { UXOrContentStructure: r });
        return r;
      })(),
      (async () => {
        const r = await safeMetric("Conversion & Lead Flow", () => conversionLeadFlow(page, $));
        await SingleAuditReport.findByIdAndUpdate(currentAuditId, { conversionAndLeadFlow: r });
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

    const overall = OverAll(A, B, C, D, E, F, G);

    const timeTaken = ((performance.now() - start) / 1000).toFixed(0);

    await SingleAuditReport.findByIdAndUpdate(currentAuditId, {
      status: "completed",
      timeTaken: `${timeTaken}s`,
      score: overall.totalScore,
      grade: overall.grade,
      sectionScore: overall.sectionScores,
    });

    logger.info(`🧠 Worker Completed for URL: ${url}`);

    parentPort.postMessage({ success: true, reportId: currentAuditId });

  } catch (err) {
    if (currentAuditId) {
      await SingleAuditReport.findByIdAndUpdate(currentAuditId, {
        status: "failed",
        error: err.message,
      });
    }

    parentPort.postMessage({ error: err.message });

  } finally {
    if (browser) {
      try { await browser.close(); } catch { }
    }
    // Always disconnect when worker finishes to free up Atlas connections
    try { await mongoose.disconnect(); } catch { }
  }
})();
