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

    // [NEW] — Full audit ("All"): each metric individually wrapped in safeMetric()
    // A detached frame in any one metric is non-fatal — audit continues with 0 for that section
    const A_Res = await safeMetric("Technical Performance", () => technicalMetrics(url, device, page, response, browser));
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { technicalPerformance: A_Res });

    const B_Res = await safeMetric("On Page SEO", () => seoMetrics(url, $, page));
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { onPageSEO: B_Res, siteSchema: B_Res?.Schema });

    const C_Res = await safeMetric("Accessibility", () => accessibilityMetrics(page, $));
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { accessibility: C_Res });

    const D_Res = await safeMetric("Security/Compliance", () => securityCompliance(url, page, response, browser));
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { securityOrCompliance: D_Res });

    const E_Res = await safeMetric("UX & Content Structure", () => uxContentStructure(device, page));
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { UXOrContentStructure: E_Res });

    const F_Res = await safeMetric("Conversion & Lead Flow", () => conversionLeadFlow(page, $));
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { conversionAndLeadFlow: F_Res });

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
