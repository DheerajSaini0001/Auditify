import { workerData, parentPort } from "worker_threads";
import mongoose from "mongoose";
import dbConnect from "../config/db.js";
import configService from "../services/configService.js";
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

function isBenignTeardownError(error) {
  if (!error) return true;
  const lmsg = (error.message || '').toLowerCase();
  return (
    lmsg.includes('detached') || lmsg.includes('target closed') ||
    lmsg.includes('session closed') || lmsg.includes('context was destroyed') ||
    lmsg.includes('frame is not ready') || lmsg.includes('cdpsession')
  );
}

process.on('unhandledRejection', handleWorkerSafetyError);
process.on('uncaughtException', (error) => {
  handleWorkerSafetyError(error);
  // A genuine uncaught exception leaves the thread in an undefined state. Exit so the
  // parent's exit handler fails the report, rather than continuing on corrupt state.
  if (!isBenignTeardownError(error)) process.exit(1);
});


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
    // NEVER let one metric sink the whole audit. A failed metric returns null → that
    // section is simply marked unavailable in the report; every other section still completes.
    if (isDetachedFrameError(err)) {
      logger.warn(`[Worker] ${name} skipped (detached frame) — continuing with partial data.`);
    } else {
      logger.error(`[Worker] ${name} failed — continuing with partial data: ${err?.message || err}`);
    }
    return null;
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

// Hard wall-clock cap so a hung site/metric can never pin a Chromium + DB connection forever.
// A full "All" audit (Lighthouse API + 7 metric services + AEO + render waits) can legitimately
// take a few minutes, so this must be generous. Tune via AUDIT_WORKER_TIMEOUT_MS.
const WORKER_TIMEOUT_MS = parseInt(process.env.AUDIT_WORKER_TIMEOUT_MS || "300000", 10); // 5 min
const watchdog = setTimeout(async () => {
  logger.error(`[Worker] Audit timed out after ${WORKER_TIMEOUT_MS}ms — failing report ${auditId}`);
  try {
    // Only fail it if it hasn't already finished — never clobber a "completed" report.
    if (auditId) await SingleAuditReport.findOneAndUpdate(
      { _id: auditId, status: { $ne: "completed" } },
      { status: "failed", error: "Audit timed out" }
    );
  } catch (_) {}
  process.exit(1);
}, WORKER_TIMEOUT_MS);
if (watchdog.unref) watchdog.unref();

(async () => {
  let browser;
  const start = performance.now();
  let currentAuditId = auditId;

  try {
    if (mongoose.connection.readyState !== 1) {
      await dbConnect({ maxPoolSize: 1 });
    }

    // Prime this worker's config cache from the DB so admin-set keys (API keys, Safe
    // Browsing/VirusTotal) are available — otherwise those checks silently skip.
    try { await configService.refreshCache(); } catch (_) {}

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

    // ── Run the 6 page-SAFE metrics in PARALLEL, streaming each result to the DB ──────
    // All of these are READ-ONLY on the shared page (they only call page.evaluate, which
    // Playwright serializes internally), so running them together is safe — and their
    // network I/O overlaps (the big win: Technical's slow Google PageSpeed call runs
    // concurrently with everything else).
    //
    // Each metric writes ITS OWN section to the DB the instant it resolves (not after the
    // whole batch). Because the frontend re-polls the report every ~3s while it's
    // "inprogress", each section pops into the UI as soon as that particular parallel
    // metric finishes — in whatever order they complete. Concurrent findByIdAndUpdate calls
    // each touch a DIFFERENT field, so they're atomic and don't conflict.
    const writeSection = (fields) =>
      SingleAuditReport.findByIdAndUpdate(currentAuditId, fields).catch((e) =>
        logger.error("Error writing section result", e)
      );

    const pTech = safeMetric("Technical Performance", () => technicalMetrics(url, device, page, response, browser))
      .then(async (r) => { await writeSection({ technicalPerformance: r }); return r; });
    const pSeo = safeMetric("On Page SEO", () => seoMetrics(url, $, page))
      .then(async (r) => { await writeSection({ onPageSEO: r, siteSchema: r?.Schema }); return r; });
    const pA11y = safeMetric("Accessibility", () => accessibilityMetrics(page, $))
      .then(async (r) => { await writeSection({ accessibility: r }); return r; });
    // In parallel mode UX self-computes its broken links (SEO's result isn't ready yet).
    const pUx = safeMetric("UX & Content Structure", () => uxContentStructure(device, page))
      .then(async (r) => { await writeSection({ UXOrContentStructure: r }); return r; });
    const pConv = safeMetric("Conversion & Lead Flow", () => conversionLeadFlow(page, $))
      .then(async (r) => { await writeSection({ conversionAndLeadFlow: r }); return r; });
    const pAio = safeMetric("AIO Readiness", () => aioReadiness(url, page, $))
      .then(async (r) => { await writeSection({ aioReadiness: r, aioCompatibilityBadge: r?.AIO_Compatibility_Badge }); return r; });
    const pAeo = safeMetric("AEO", () => AEOService.runAudit(url, $, null, 100))
      .then(async (r) => { await writeSection({ aeo: r }); return r; });

    const [A_Res, B_Res, C_Res, E_Res, F_Res, G_Res, aeoRes] =
      await Promise.all([pTech, pSeo, pA11y, pUx, pConv, pAio, pAeo]);

    // ── Security runs AFTER the parallel batch ──
    // It is the ONE metric that mutates the shared page (it submits forms / opens tabs,
    // which can navigate the page). Running it concurrently would corrupt the other metrics'
    // DOM reads, so it runs on its own once they're done — then writes its section too.
    const D_Res = await safeMetric("Security/Compliance", () => securityCompliance(url, page, response, browser));
    await writeSection({ securityOrCompliance: D_Res });

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
    clearTimeout(watchdog);
    if (browser) {
      try { await browser.close(); } catch { }
    }
    // Always disconnect when worker finishes to free up Atlas connections
    try { await mongoose.disconnect(); } catch { }
  }
})();
