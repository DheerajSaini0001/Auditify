import AEOService from "../metricServices/aeoService.js";
import SingleAuditReport from "../models/singleAuditReport.js";
import Puppeteer_Cheerio from "../utils/puppeteer_cheerio.js";

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
        console.error("AEO Analyze Error:", error);
        res.status(500).json({ error: "AEO Audit Failed", details: error.message });
    }
};

export const getAEOReport = async (req, res) => {
    try {
        const report = await SingleAuditReport.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ error: "Report not found" });
        }

        // The aeo data is stored inside the report document
        res.status(200).json(report.aeo || { message: "AEO data not found in this report" });
    } catch (error) {
        console.error("AEO Report Fetch Error:", error);
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
        console.error("AEO Batch Error:", error);
        res.status(500).json({ error: "Batch AEO Audit Failed" });
    }
};
