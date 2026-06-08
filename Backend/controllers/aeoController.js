import AEOService from "../metricServices/aeoService.js";
import SingleAuditReport from "../models/singleAuditReport.js";
import Puppeteer_Cheerio from "../utils/puppeteer_cheerio.js";
import logger from "../utils/logger.js";

export const analyzeAEO = async (req, res) => {
    try {
        const { url, device = "desktop" } = req.body;

        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        // Fetch HTML using Puppeteer/Cheerio utility
        const { browser, $ } = await Puppeteer_Cheerio(url, device);
        
        try {
            const results = await AEOService.runAudit(url, $);
            res.status(200).json(results);
        } finally {
            if (browser) await browser.close();
        }
    } catch (error) {
        logger.error("AEO Analyze Error", error);
        res.status(500).json({ error: "AEO Audit Failed", details: error.message });
    }
};

export const getAEOReport = async (req, res) => {
    try {
        const query = { _id: req.params.id };
        
        // Non-admins can only see their own reports
        if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            query.userId = req.user.userId;
        }

        const report = await SingleAuditReport.findOne(query);
        if (!report) {
            return res.status(404).json({ error: "Report not found or access denied" });
        }

        // The aeo data is stored inside the report document
        res.status(200).json(report.aeo || { message: "AEO data not found in this report" });
    } catch (error) {
        logger.error("AEO Report Fetch Error", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const batchAEO = async (req, res) => {
    try {
        const { urls, device = "desktop" } = req.body;

        if (!urls || !Array.isArray(urls)) {
            return res.status(400).json({ error: "Array of URLs is required" });
        }

        const results = [];
        for (const url of urls) {
            try {
                const { browser, $ } = await Puppeteer_Cheerio(url, device);
                const result = await AEOService.runAudit(url, $);
                results.push(result);
                if (browser) await browser.close();
            } catch (e) {
                results.push({ url, error: e.message });
            }
        }

        res.status(200).json(results);
    } catch (error) {
        logger.error("AEO Batch Error", error);
        res.status(500).json({ error: "Batch AEO Audit Failed" });
    }
};

export const streamAEO = async (req, res) => {
    let browser;
    try {
        const { url, device = "desktop", reportId } = req.body;

        if (!url) {
            return res.status(400).json({ error: "URL is required" });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        const sendEvent = (type, data) => {
            res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
        };

        sendEvent("status", { message: "Initializing browser..." });
        const pc = await Puppeteer_Cheerio(url, device);
        browser = pc.browser;
        const $ = pc.$;

        sendEvent("status", { message: "Executing signals..." });

        const results = await AEOService.runAuditStream(
            url, 
            $, 
            null, 
            100, 
            (signalName, signalResult) => {
                sendEvent("signal", { name: signalName, data: signalResult });
            }
        );

        sendEvent("complete", results);

        if (reportId) {
            try {
                await SingleAuditReport.findByIdAndUpdate(reportId, { aeo: results });
            } catch (err) {
                logger.error("Error saving AEO results to DB", err);
            }
        }

        res.end();
    } catch (error) {
        logger.error("AEO Stream Error", error);
        res.write(`data: ${JSON.stringify({ type: "error", error: error.message })}\n\n`);
        res.end();
    } finally {
        if (browser) await browser.close();
    }
};
