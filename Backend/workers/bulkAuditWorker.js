import { workerData, parentPort } from "worker_threads";
import mongoose from "mongoose";
import dbConnect from "../config/db.js";
import configService from "../services/configService.js";
import BulkAuditReport from "../models/bulkAuditReport.js";

import technicalMetrics from "../metricServices/technicalMetrics.js";
import seoMetrics from "../metricServices/seoMetrics.js";
import accessibilityMetrics from "../metricServices/accessibilityMetrics.js";
import securityCompliance from "../metricServices/securityCompliance.js";
import uxContentStructure from "../metricServices/uxContentStructure.js";
import conversionLeadFlow from "../metricServices/conversionLeadFlow.js";
import aioReadiness from "../metricServices/aioReadiness.js";
import Puppeteer_Cheerio from "../utils/puppeteer_cheerio.js";
import { performance } from "perf_hooks";
import logger from "../utils/logger.js";

const { url, device, report, bulkAuditId, pageUrl } = workerData;

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
  if (!isBenignTeardownError(error)) process.exit(1);
});

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

// Hard wall-clock cap per page so a hung site can't pin a Chromium + DB connection forever.
// Generous because a full per-page audit can take minutes. Tune via AUDIT_WORKER_TIMEOUT_MS.
// We only log + exit here; the controller's worker "exit" handler is the single source of
// truth for marking the page failed (avoids double-counting failedPages).
const WORKER_TIMEOUT_MS = parseInt(process.env.AUDIT_WORKER_TIMEOUT_MS || "300000", 10); // 5 min
const watchdog = setTimeout(() => {
    logger.error(`[Bulk Worker] Page audit timed out after ${WORKER_TIMEOUT_MS}ms — exiting: ${pageUrl}`);
    process.exit(1);
}, WORKER_TIMEOUT_MS);
if (watchdog.unref) watchdog.unref();

(async () => {
    let browser;
    const start = performance.now();

    try {
        if (mongoose.connection.readyState !== 1) {
            await dbConnect({ maxPoolSize: 1 });
        }

        // Prime this worker's config cache from the DB (see singleAuditWorker note).
        try { await configService.refreshCache(); } catch (_) {}

        const { browser: b, page, response, $, isBotProtected } = await Puppeteer_Cheerio(url, device);
        browser = b;

        // NOTE: base64 screenshots are intentionally NOT embedded in the bulk parent
        // document — dozens of them would push it past MongoDB's 16MB BSON limit and
        // permanently break the audit. Only lightweight status fields are stored here.
        await BulkAuditReport.findOneAndUpdate(
            { _id: bulkAuditId, "pages.url": pageUrl },
            { $set: { "pages.$.isBotProtected": isBotProtected } }
        );

        if (isBotProtected) {
            logger.info(`🛡️ Marking page as Bot Protected in Bulk Audit: ${pageUrl}`);
            const timeTaken = ((performance.now() - start) / 1000).toFixed(0);
            await BulkAuditReport.findOneAndUpdate(
                { _id: bulkAuditId, "pages.url": pageUrl },
                {
                    $set: {
                        "pages.$.status": "completed",
                        "pages.$.error": "Bot Protected",
                        "pages.$.score": 0,
                        "pages.$.grade": "F",
                        "pages.$.timeTaken": `${timeTaken}s`,
                        "pages.$.completedAt": new Date()
                    },
                    $inc: { completedPages: 1 }
                }
            );
            parentPort.postMessage({ success: true });
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
                    result = await accessibilityMetrics(page);
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
                    result = await aioReadiness(url, page, $);
                    break;
            }

            const timeTaken = ((performance.now() - start) / 1000).toFixed(0);

            // Save result directly to BulkAudit document (using raw format)
            const updateData = {
                "pages.$.timeTaken": `${timeTaken}s`,
            };

            const score = result?.Percentage || 0;
            const grade = score >= 90 ? "A+" :
                score >= 80 ? "A" :
                    score >= 70 ? "B" :
                        score >= 60 ? "C" :
                            score >= 50 ? "D" : "F";

            updateData["pages.$.score"] = score;
            updateData["pages.$.grade"] = grade;

            // Add the specific report data
            if (report === "Technical Performance") {
                updateData["pages.$.technicalPerformance"] = result;
            } else if (report === "On Page SEO") {
                updateData["pages.$.onPageSEO"] = result;
                if (result?.Schema) {
                    updateData["pages.$.siteSchema"] = result.Schema;
                }
            } else if (report === "Accessibility") {
                updateData["pages.$.accessibility"] = result;
            } else if (report === "Security/Compliance") {
                updateData["pages.$.securityOrCompliance"] = result;
            } else if (report === "UX & Content Structure") {
                updateData["pages.$.UXOrContentStructure"] = result;
            } else if (report === "Conversion & Lead Flow") {
                updateData["pages.$.conversionAndLeadFlow"] = result;
            } else if (report === "AIO (AI-Optimization) Readiness") {
                updateData["pages.$.aioReadiness"] = result;
                if (result?.AIO_Compatibility_Badge) {
                    updateData["pages.$.aioCompatibilityBadge"] = result.AIO_Compatibility_Badge;
                }
            }

            await BulkAuditReport.findOneAndUpdate(
                { _id: bulkAuditId, "pages.url": pageUrl },
                { $set: updateData }
            );

            logger.info(`🧠 Bulk Worker Completed for URL: ${pageUrl}`);

            parentPort.postMessage({ success: true });
            return;
        }

        // Per-metric safety: one metric failing must NOT fail the whole page audit.
        const safe = (p, name) => Promise.resolve(p).catch((e) => {
            logger.error(`[Bulk Worker] ${name} failed — continuing with partial data: ${e?.message || e}`);
            return null;
        });

        // Full audit — run the 6 page-SAFE metrics in PARALLEL (they are read-only on the
        // shared page; only page.evaluate, which Playwright serializes). Their network I/O
        // overlaps, so the slow Google PageSpeed call no longer adds to the total.
        const [A, B, C, E, F, G] = await Promise.all([
            safe(technicalMetrics(url, device, page, response, browser), "Technical Performance"),
            safe(seoMetrics(url, $, page), "On Page SEO"),
            safe(accessibilityMetrics(page), "Accessibility"),
            safe(uxContentStructure(device, page), "UX & Content Structure"), // self-computes broken links
            safe(conversionLeadFlow(page, $), "Conversion & Lead Flow"),
            safe(aioReadiness(url, page, $), "AIO Readiness"),
        ]);
        // Security runs AFTER — it's the only metric that can navigate the shared page.
        const D = await safe(securityCompliance(url, page, response, browser), "Security/Compliance");

        // Extract percentages for overall score calculation
        const overall = OverAll(
            A?.Percentage || 0,
            B?.Percentage || 0,
            C?.Percentage || 0,
            D?.Percentage || 0,
            E?.Percentage || 0,
            F?.Percentage || 0,
            G?.Percentage || 0
        );

        const timeTaken = ((performance.now() - start) / 1000).toFixed(0);

        // Save all results directly to BulkAudit document (using raw format)
        await BulkAuditReport.findOneAndUpdate(
            { _id: bulkAuditId, "pages.url": pageUrl },
            {
                $set: {
                    "pages.$.timeTaken": `${timeTaken}s`,
                    "pages.$.score": overall.totalScore,
                    "pages.$.grade": overall.grade,
                    "pages.$.sectionScore": overall.sectionScores,
                    "pages.$.siteSchema": B?.Schema || null,
                    "pages.$.aioCompatibilityBadge": G?.AIO_Compatibility_Badge || null,
                    "pages.$.technicalPerformance": A,
                    "pages.$.onPageSEO": B,
                    "pages.$.accessibility": C,
                    "pages.$.securityOrCompliance": D,
                    "pages.$.UXOrContentStructure": E,
                    "pages.$.conversionAndLeadFlow": F,
                    "pages.$.aioReadiness": G,
                }
            }
        );

        logger.info(`🧠 Bulk Worker Completed for URL: ${pageUrl}`);

        parentPort.postMessage({ success: true });

    } catch (err) {
        logger.error(`Error in bulk audit worker for ${pageUrl}`, err);
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
