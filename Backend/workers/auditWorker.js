import { workerData, parentPort } from "worker_threads";
import mongoose from "mongoose";
import dbConnect from "../config/db.js";
import SiteReport from "../models/SiteReport.js";

import technicalMetrics from "../metricServices/technicalMetrics.js";
import seoMetrics from "../metricServices/seoMetrics.js";
import accessibilityMetrics from "../metricServices/accessibilityMetrics.js";
import securityCompliance from "../metricServices/securityCompliance.js";
import uxContentStructure from "../metricServices/uxContentStructure.js";
import conversionLeadFlow from "../metricServices/conversionLeadFlow.js";
import aioReadiness from "../metricServices/aioReadiness.js";
import Puppeteer_Cheerio from "../utils/Puppeteer_Cheerio.js";
import { performance } from "perf_hooks";

// Worker data from controller
const { Site, Device, Report, auditId } = workerData;

console.log(`🚀 [WORKER ${auditId}]: Starting → Site: ${Site}, Device: ${Device}, Report: ${Report}`);

const OverAll = (technicalReport, seoReport, accessibilityReport, securityReport, uxReport, conversionReport, aioReport) => {
  const totalA = technicalReport || 0;
  const totalB = seoReport || 0;
  const totalC = accessibilityReport || 0;
  const totalD = securityReport || 0;
  const totalE = uxReport || 0;
  const totalF = conversionReport || 0;
  const totalG = aioReport || 0;

  const totalScore = (totalA + totalB + totalC + totalD + totalE + totalF + totalG) / 7;

  let grade = "F";
  if (totalScore >= 90) grade = "A";
  else if (totalScore >= 80) grade = "B";
  else if (totalScore >= 70) grade = "C";
  else if (totalScore >= 60) grade = "D";

  const sectionScores = [
    { name: "Technical Performance", score: totalA },
    { name: "On-Page SEO", score: totalB },
    { name: "Accessibility", score: totalC },
    { name: "Security/Compliance", score: totalD },
    { name: "UX & Content", score: totalE },
    { name: "Conversion & Lead Flow", score: totalF },
    { name: "AIO Readiness", score: totalG },
  ];

  return { totalScore: parseFloat(totalScore.toFixed(1)), grade, sectionScores };
};

// 🧠 Run audit
(async () => {
  let browser;
  const start = performance.now();

  try {
    await dbConnect();
    console.log(`📡 [WORKER ${auditId}]: Connected to DB`);

    const { browser: b, page, response, $ } = await Puppeteer_Cheerio(Site, Device);
    browser = b;

    // If single metric selected
    if (Report !== "All") {
      let result;
      switch (Report) {
        case "technicalMetrics":
          result = await technicalMetrics(Site, Device, Report, page, response, browser, auditId);
          break;
        case "seoMetrics":
          result = await seoMetrics(Site, Device, Report, $, auditId);
          break;
        case "accessibilityMetrics":
          result = await accessibilityMetrics(Site, Device, Report, page, auditId);
          break;
        case "securityCompliance":
          result = await securityCompliance(Site, Device, Report, page, response, browser, auditId);
          break;
        case "uxContentStructure":
          result = await uxContentStructure(Site, Device, Report, $, auditId);
          break;
        case "conversionLeadFlow":
          result = await conversionLeadFlow(Site, Device, Report, page, $, auditId);
          break;
        case "aioReadiness":
          result = await aioReadiness(Site, Device, Report, $, auditId);
          break;
        default:
          throw new Error("Invalid metric type");
      }

      const end = performance.now();
      const timeTaken = ((end - start) / 1000).toFixed(0);

      await SiteReport.findByIdAndUpdate(auditId, {
        Status: "completed",
        Time_Taken: `${timeTaken}s`,
        $set: { "Raw.Time_Taken": `${timeTaken}s` },
      });

      console.log(`✅ [WORKER ${auditId}]: ${Report} calculation completed (${timeTaken}s)`);

      if (parentPort) parentPort.postMessage({ success: true });
      await browser.close();
      process.exit(0);
    }

    // If "All" reports selected
    const [
      technicalReport,
      seoReport,
      accessibilityReport,
      securityReport,
      uxReport,
      conversionReport,
      aioReport,
    ] = await Promise.all([
      technicalMetrics(Site, Device, Report, page, response, browser, auditId),
      seoMetrics(Site, Device, Report, $, auditId),
      accessibilityMetrics(Site, Device, Report, page, auditId),
      securityCompliance(Site, Device, Report, page, response, browser, auditId),
      uxContentStructure(Site, Device, Report, $, auditId),
      conversionLeadFlow(Site, Device, Report, page, $, auditId),
      aioReadiness(Site, Device, Report, $, auditId),
    ]);

    const end = performance.now();
    const timeTaken = ((end - start) / 1000).toFixed(0);

    const Overall = OverAll(technicalReport, seoReport, accessibilityReport, securityReport, uxReport, conversionReport, aioReport);

    await SiteReport.findByIdAndUpdate(auditId, {
      Status: "completed",
      Time_Taken: `${timeTaken}s`,
      Score: Overall.totalScore,
      Grade: Overall.grade,
      Section_Score: Overall.sectionScores,
      $set: {
        "Raw.Time_Taken": `${timeTaken}s`,
        "Raw.Score": Overall.totalScore,
        "Raw.Grade": Overall.grade,
        "Raw.Section_Score": Overall.sectionScores,
      },
    });

    console.log(`🎯 [WORKER ${auditId}]: All metrics completed successfully (${timeTaken}s)`);

    if (parentPort) parentPort.postMessage({ success: true });
    await browser.close();
    process.exit(0);

  } catch (err) {
    console.error(`❌ [WORKER ${auditId}]: Failed → ${err.message}`);

    try {
      if (mongoose.connection.readyState !== 1) await dbConnect();

      await SiteReport.findByIdAndUpdate(auditId, {
        Status: "failed",
        Error_Message: err.message || "Audit failed",
        $set: { "Raw.Error_Message": err.message || "Unknown Error" },
      });
    } catch (dbErr) {
      console.error(`💥 [WORKER ${auditId}]: DB update failed: ${dbErr.message}`);
    }

    if (parentPort) parentPort.postMessage({ error: err.message });
    if (browser) try { await browser.close(); } catch {}
    process.exit(1);
  }
})();
