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
import { performance } from "perf_hooks";

const { url, device, report, bulkAuditId, pageUrl } = workerData;

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

        const { browser: b, page, response, $, screenshot } = await Puppeteer_Cheerio(url, device);
        browser = b;

        // Update screenshot in BulkAudit document
        await BulkAuditReport.findOneAndUpdate(
            { _id: bulkAuditId, "pages.url": pageUrl },
            { $set: { "pages.$.screenshot": screenshot } }
        );

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
            const grade = score >= 90 ? "A" :
                score >= 80 ? "B" :
                    score >= 70 ? "C" :
                        score >= 60 ? "D" : "F";

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

            console.log(`🧠 Bulk Worker Completed for URL: ${pageUrl}`);

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

        console.log(`🧠 Bulk Worker Completed for URL: ${pageUrl}`);

        parentPort.postMessage({ success: true });

    } catch (err) {
        console.error(`Error in bulk audit worker for ${pageUrl}:`, err);
        parentPort.postMessage({ error: err.message });

    } finally {
        if (browser) {
            try { await browser.close(); } catch { }
        }
    }
})();
