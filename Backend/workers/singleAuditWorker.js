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

const { url, device, report, auditId } = workerData;

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

    const { browser: b, page, response, $, screenshot, isBotProtected } = await Puppeteer_Cheerio(url, device);
    browser = b;
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { screenshot, isBotProtected });

    if (isBotProtected) {
      console.log(`🛡️ Marking report as Bot Protected: ${url}`);
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

      switch (report) {
        case "Technical Performance":
          result = await technicalMetrics(url, device, page, response, browser);
          break;
        case "On Page SEO":
          result = await seoMetrics(url, $, page);
          break;
        case "Accessibility":
          result = await accessibilityMetrics(page, $);
          break;
        case "Security/Compliance":
          result = await securityCompliance(url, page, response, browser);
          break;
        case "UX & Content Structure":
          result = await uxContentStructure(device, page);
          break;
        case "Conversion & Lead Flow":
          result = await conversionLeadFlow(page, $);
          break;
        case "AIO (AI-Optimization) Readiness":
          // For single report, we might need to run technical metrics first if not already run
          const techRes = await technicalMetrics(url, device, page, response, browser);
          result = await aioReadiness(url, page, $);
          // Run AEO - Passing performance score for Perplexity weighting
          const aeoResultSingle = await AEOService.runAudit(url, $, null, techRes?.Percentage || 100);
          result.aeo = aeoResultSingle;
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
        updateData.siteSchema = result.Schema;
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

      console.log(`🧠 Worker Completed for URL: ${url}`);

      parentPort.postMessage({ success: true, reportId: currentAuditId });
      return;
    }

    const A_Res = await technicalMetrics(url, device, page, response, browser);
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { technicalPerformance: A_Res });

    const B_Res = await seoMetrics(url, $, page);
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { onPageSEO: B_Res, siteSchema: B_Res?.Schema });

    const C_Res = await accessibilityMetrics(page, $);
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { accessibility: C_Res });

    const D_Res = await securityCompliance(url, page, response, browser);
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { securityOrCompliance: D_Res });

    const E_Res = await uxContentStructure(device, page);
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { UXOrContentStructure: E_Res });

    const F_Res = await conversionLeadFlow(page, $);
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { conversionAndLeadFlow: F_Res });

    const G_Res = await aioReadiness(url, page, $);
    const aeoRes = await AEOService.runAudit(url, $, null, A_Res?.Percentage || 100);
    await SingleAuditReport.findByIdAndUpdate(currentAuditId, { 
      aioReadiness: G_Res, 
      aioCompatibilityBadge: G_Res?.AIO_Compatibility_Badge,
      aeo: aeoRes
    });

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

    console.log(`🧠 Worker Completed for URL: ${url}`);

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
