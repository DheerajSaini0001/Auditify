import { workerData, parentPort } from "worker_threads";
import mongoose from "mongoose";
import dbConnect from "../config/db.js";
import BulkAuditReport from "../models/bulkAuditReport.js";

import technicalMetrics from "../metricServices/technicalMetrics.js";
import seoMetrics from "../metricServices/seoMetrics.js";
import accessibilityMetrics from "../metricServices/accessibilityMetrics.js";
import securityCompliance from "../metricServices/securityCompliance.js";
import uxContentStructure from "../metricServices/uxContentStructure.js";
import conversionLeadFlow from "../metricServices/conversionLeadFlow.js";
import aioReadiness from "../metricServices/aioReadiness.js";
import Puppeteer_Cheerio from "../utils/puppeteer_cheerio.js";
import { checkWebsiteExists } from "../utils/fastFetch.js";
import { detectDealership } from "../utils/dealershipDetector.js";
import * as cheerio from "cheerio";
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

process.on('unhandledRejection', handleWorkerSafetyError);
process.on('uncaughtException', handleWorkerSafetyError);

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

    try {
        if (mongoose.connection.readyState !== 1) {
            await dbConnect({ maxPoolSize: 1 });
        }

        // [NEW] — WEBSITE EXISTENCE GATE (runs FIRST, BEFORE anything else)
        // One lightweight HTTP GET per URL. If the domain doesn't resolve or the
        // host refuses/drops the connection, there is no website to audit — record
        // the failure for this page and STOP before launching Chromium or any
        // metric. A timeout/block/TLS error is treated as "exists" (fail open) so
        // a slow or bot-protected real site is never wrongly rejected. The fetched
        // html/status is reused for the dealership pre-check (no second request).
        const existence = await checkWebsiteExists(url);
        if (!existence.exists) {
            logger.info(`🌐 Bulk audit gated — website does not exist / unreachable: ${pageUrl} (${existence.errorCode})`);
            const timeTaken = ((performance.now() - start) / 1000).toFixed(0);
            await BulkAuditReport.findOneAndUpdate(
                { _id: bulkAuditId, "pages.url": pageUrl },
                {
                    $set: {
                        "pages.$.status": "failed",
                        "pages.$.error": `WEBSITE NOT FOUND — ${existence.reason}`,
                        "pages.$.score": 0,
                        "pages.$.grade": "F",
                        "pages.$.timeTaken": `${timeTaken}s`,
                        "pages.$.completedAt": new Date(),
                    },
                    $inc: { completedPages: 1 },
                }
            );
            parentPort.postMessage({ success: true });
            return;
        }

        // [NEW] — DEALERSHIP DETECTION GATE (runs FIRST, BEFORE the audit)
        // A fast lightweight fetch is classified up front. Definitively non-dealership
        // pages are recorded and STOP here — the heavy audit never starts.
        // Reuses the html/status from the existence gate above (no browser, no
        // re-fetch): the detector only reads raw HTML. Blocked/empty => inconclusive
        // => fall through to the full-render audit below.
        let preDetection = null;
        try {
            preDetection = await detectDealership({ url, $: cheerio.load(existence.html || ""), statusCode: existence.status });
        } catch (gateErr) {
            logger.warn(`[BulkWorker] Pre-audit dealership check failed — will re-check after full load: ${gateErr.message}`);
        }
        // FAIL OPEN on inconclusive (blocked / challenge / empty) — never reject.
        const preInconclusive = !preDetection || preDetection.inconclusive;

        if (preDetection && preDetection.isDealership === false && !preInconclusive) {
            logger.info(`🚫 Bulk audit gated (pre-check) — not a dealership: ${pageUrl}`);
            const timeTaken = ((performance.now() - start) / 1000).toFixed(0);
            await BulkAuditReport.findOneAndUpdate(
                { _id: bulkAuditId, "pages.url": pageUrl },
                {
                    $set: {
                        "pages.$.status": "completed",
                        "pages.$.isDealership": false,
                        "pages.$.dealershipDetection": preDetection,
                        "pages.$.error": `NOT A DEALERSHIP WEBSITE — ${preDetection.reason}`,
                        "pages.$.score": 0,
                        "pages.$.grade": "F",
                        "pages.$.timeTaken": `${timeTaken}s`,
                        "pages.$.completedAt": new Date(),
                    },
                    $inc: { completedPages: 1 },
                }
            );
            parentPort.postMessage({ success: true });
            return;
        }

        const { browser: b, page, response, $, screenshot, isBotProtected } = await Puppeteer_Cheerio(url, device);
        browser = b;

        // Update screenshot and bot status in BulkAudit document
        await BulkAuditReport.findOneAndUpdate(
            { _id: bulkAuditId, "pages.url": pageUrl },
            { $set: { "pages.$.screenshot": screenshot, "pages.$.isBotProtected": isBotProtected } }
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

        // [NEW] — DEALERSHIP DETECTION GATE (fallback, full-render)
        // Only re-runs when the fast pre-check above was inconclusive (blocked/empty).
        // Otherwise the pre-check verdict is reused.
        let detection = preInconclusive ? null : preDetection;
        if (!detection) {
            try {
                detection = await detectDealership({ url, $, page, response });
            } catch (gateErr) {
                logger.warn(`[BulkWorker] Dealership detection failed (continuing): ${gateErr.message}`);
            }
        }
        // FAIL OPEN: only block on a CONFIDENT negative, never on inconclusive.
        if (detection && detection.isDealership === false && !detection.inconclusive) {
            logger.info(`🚫 Bulk audit gated — not a dealership: ${pageUrl}`);
            const timeTaken = ((performance.now() - start) / 1000).toFixed(0);
            await BulkAuditReport.findOneAndUpdate(
                { _id: bulkAuditId, "pages.url": pageUrl },
                {
                    $set: {
                        "pages.$.status": "completed",
                        "pages.$.isDealership": false,
                        "pages.$.dealershipDetection": detection,
                        "pages.$.error": `NOT A DEALERSHIP WEBSITE — ${detection.reason}`,
                        "pages.$.score": 0,
                        "pages.$.grade": "F",
                        "pages.$.timeTaken": `${timeTaken}s`,
                        "pages.$.completedAt": new Date(),
                    },
                    $inc: { completedPages: 1 },
                }
            );
            parentPort.postMessage({ success: true });
            return;
        }
        if (detection && detection.isDealership === true) {
            await BulkAuditReport.findOneAndUpdate(
                { _id: bulkAuditId, "pages.url": pageUrl },
                { $set: { "pages.$.isDealership": true, "pages.$.dealershipDetection": detection } }
            );
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

        // Full audit - run all metrics
        const A = await technicalMetrics(url, device, page, response, browser);
        const B = await seoMetrics(url, $, page);
        const C = await accessibilityMetrics(page);
        const D = await securityCompliance(url, page, response, browser);
        const E = await uxContentStructure(device, page);
        const F = await conversionLeadFlow(page, $);
        const G = await aioReadiness(url, page, $);

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
        if (browser) {
            try { await browser.close(); } catch { }
        }
        // Always disconnect when worker finishes to free up Atlas connections
        try { await mongoose.disconnect(); } catch { }
    }
})();
