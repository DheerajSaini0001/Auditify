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

const { Site, Device, Report, auditId } = workerData;

const OverAll = (A, B, C, D, E, F, G) => {
  A ||= 0; B ||= 0; C ||= 0; D ||= 0; E ||= 0; F ||= 0; G ||= 0;
  const total = (A + B + C + D + E + F + G) / 7;

  return {
    totalScore: Number(total.toFixed(1)),
    grade:
      total >= 90 ? "A" :
      total >= 80 ? "B" :
      total >= 70 ? "C" :
      total >= 60 ? "D" : "F",
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

  try {
    if (mongoose.connection.readyState !== 1) {
      await dbConnect();
    }

    const { browser: b, page, response, $ } = await Puppeteer_Cheerio(Site, Device);
    browser = b;

    if (Report !== "All") {
      let result;

      switch (Report) {
        case "Technical Performance":
          result = await technicalMetrics(Site, Device, Report, page, response, browser, auditId);
          break;
        case "On Page SEO":
          result = await seoMetrics(Site, Device, Report, $, auditId, page);
          break;
        case "Accessibility":
          result = await accessibilityMetrics(Site, Device, Report, page, auditId);
          break;
        case "Security/Compliance":
          result = await securityCompliance(Site, Device, Report, page, response, browser, auditId);
          break;
        case "UX & Content Structure":
          result = await uxContentStructure(Site, Device, Report, $, auditId);
          break;
        case "Conversion & Lead Flow":
          result = await conversionLeadFlow(Site, Device, Report, page, $, auditId);
          break;
        case "AIO (AI-Optimization) Readiness":
          result = await aioReadiness(Site, Device, Report, $, auditId);
          break;
      }

      const timeTaken = ((performance.now() - start) / 1000).toFixed(0);

      await SiteReport.findByIdAndUpdate(auditId, {
        Status: "completed",
        Time_Taken: `${timeTaken}s`,
        $set: { "Raw.Time_Taken": `${timeTaken}s` }
      });

      console.log(`🧠 Worker Completed → ID: ${auditId}`);

      parentPort.postMessage({ success: true });
      return;
    }

    const A = await technicalMetrics(Site, Device, Report, page, response, browser, auditId);
    const B = await seoMetrics(Site, Device, Report, $, auditId, page);
    const C = await accessibilityMetrics(Site, Device, Report, page, auditId);
    const D = await securityCompliance(Site, Device, Report, page, response, browser, auditId);
    const E = await uxContentStructure(Site, Device, Report, $, auditId);
    const F = await conversionLeadFlow(Site, Device, Report, page, $, auditId);
    const G = await aioReadiness(Site, Device, Report, $, auditId);

    const overall = OverAll(A, B, C, D, E, F, G);

    const timeTaken = ((performance.now() - start) / 1000).toFixed(0);

     await SiteReport.findByIdAndUpdate(auditId, {
      Status: "completed",
      Time_Taken: `${timeTaken}s`,
      Score: overall.totalScore,
      Grade: overall.grade,
      Section_Score: overall.sectionScores,
      $set: {
        "Raw.Time_Taken": `${timeTaken}s`,
        "Raw.Score": overall.totalScore,
        "Raw.Grade": overall.grade,
        "Raw.Section_Score": overall.sectionScores
      }
    });

    console.log(`🧠 Worker Completed → ID: ${auditId}`);

    parentPort.postMessage({ success: true });

  } catch (err) {
    await SiteReport.findByIdAndUpdate(auditId, {
      Status: "failed",
      Error_Message: err.message,
    });

    parentPort.postMessage({ error: err.message });

  } finally {
    if (browser) {
      try { await browser.close(); } catch {}
    }
  }
})();
