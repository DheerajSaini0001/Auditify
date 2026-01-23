import { Worker } from "worker_threads";
import { join } from "path";
import BulkAuditReport from "../models/bulkAuditReport.js";
import SingleAuditReport from "../models/singleAuditReport.js";
import discoverPages from "../utils/sitemapCrawler.js";

// validate URL and prevent SSRF
const isValidUrl = (string) => {
    try {
        const url = new URL(string);
        // Block localhost, private IPs, and non-http/https protocols
        if (url.protocol !== "http:" && url.protocol !== "https:") return false;
        if (
            url.hostname === "localhost" ||
            url.hostname === "127.0.0.1" ||
            url.hostname === "::1" ||
            url.hostname.startsWith("192.168.") ||
            url.hostname.startsWith("10.") ||
            url.hostname.startsWith("172.")
        ) {
            return false;
        }
        return true;
    } catch (_) {
        return false;
    }
};

// Discover URLs from a website
export const discoverUrls = async (req, res) => {
    try {
        let { url, maxPages } = req.body;

        if (!url) {
            return res.status(400).json({ error: "Site URL is required" });
        }

        // Normalize URL
        url = url.trim().toLowerCase();
        if (!/^https?:\/\//i.test(url)) {
            url = "https://" + url;
        }

        if (!isValidUrl(url)) {
            return res.status(400).json({ error: "Invalid or Restricted URL" });
        }

        // Set max pages limit (default: 5, max: 50)
        maxPages = Math.min(parseInt(maxPages) || 1, 50);

        console.log(`🔍 Discovering URLs for: ${url} | Max: ${maxPages} pages`);

        // Discover all pages
        const discoveredUrls = await discoverPages(url, maxPages);

        console.log(`✅ Discovered ${discoveredUrls.length} URLs`);

        res.status(200).json({
            url,
            totalUrls: discoveredUrls.length,
            urls: discoveredUrls
        });

    } catch (error) {
        console.error("Error discovering URLs:", error);
        res.status(500).json({ error: "Failed to discover URLs. Please try again." });
    }
};

// Start audit for selected URLs
export const auditSelectedUrls = async (req, res) => {
    try {
        let { url, selectedUrls, device, report } = req.body;

        if (!url || !selectedUrls || !device || !report) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        if (!Array.isArray(selectedUrls) || selectedUrls.length === 0) {
            return res.status(400).json({ error: "Please select at least one URL to audit" });
        }

        // Limit to 50 URLs max
        if (selectedUrls.length > 50) {
            return res.status(400).json({ error: "Maximum 50 URLs can be audited at once" });
        }

        console.log(`🚀 Starting audit for ${selectedUrls.length} selected URLs`);

        // Check if an identical Bulk Audit already exists
        const existingAudits = await BulkAuditReport.find({
            site: url,
            device: device,
            $or: [{ report: report }, { report: "All" }]
        }).sort({ createdAt: -1 });

        for (const audit of existingAudits) {
            // Skip reusing if the audit itself failed or has any failed pages
            if (audit.status === 'failed' || audit.pages.some(p => p.status === 'failed')) {
                continue;
            }

            const auditUrls = audit.pages.map(p => p.url).sort();
            const requestUrls = [...selectedUrls].sort();

            // Compare arrays
            if (auditUrls.length === requestUrls.length &&
                auditUrls.every((value, index) => value === requestUrls[index])) {

                console.log(`♻️ Found existing Bulk Audit: ${audit._id}, reusing.`);
                return res.status(200).json({
                    message: "Existing audit found",
                    bulkAuditId: audit._id,
                    status: audit.status,
                    totalPages: audit.totalPages,
                    existing: true
                });
            }
        }

        // Create bulk audit record with all pages
        const pages = selectedUrls.map(pageUrl => ({
            url: pageUrl,
            report: report,
            device: device,
            status: 'pending'
        }));

        const bulkAudit = await BulkAuditReport.create({
            site: url,
            device: device,
            report: report,
            status: "inprogress",
            totalPages: selectedUrls.length,
            pages
        });

        // Send immediate response
        res.status(201).json({
            message: "Audit started successfully",
            bulkAuditId: bulkAudit._id,
            status: "inprogress",
            totalPages: selectedUrls.length
        });

        // Start auditing selected pages in background
        processSelectedUrls(bulkAudit._id.toString(), selectedUrls, device, report);

    } catch (error) {
        console.error("Error starting audit:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};

// Background process to audit selected URLs
async function processSelectedUrls(bulkAuditId, selectedUrls, device, report) {
    try {
        // Audit pages one by one
        for (let i = 0; i < selectedUrls.length; i++) {
            const pageUrl = selectedUrls[i];

            console.log(`🚀 Starting audit ${i + 1}/${selectedUrls.length}: ${pageUrl}`);

            // Check for existing valid report in SiteReport OR previous BulkAudits
            let foundData = await SingleAuditReport.findOne({
                url: pageUrl,
                device: device,
                status: 'completed',
                $or: [{ report: report }, { report: "All" }]
            }).sort({ createdAt: -1 });

            if (!foundData) {
                const previousBulk = await BulkAuditReport.findOne({
                    _id: { $ne: bulkAuditId },
                    device: device,
                    $or: [{ report: report }, { report: "All" }],
                    "pages": {
                        $elemMatch: {
                            url: pageUrl,
                            status: 'completed'
                        }
                    }
                }).sort({ createdAt: -1 });

                if (previousBulk) {
                    foundData = previousBulk.pages.find(p => p.url === pageUrl && p.status === 'completed');
                }
            }

            if (foundData) {
                console.log(`♻️ Found existing data for: ${pageUrl}, reusing.`);

                const updateData = {
                    "pages.$.status": "completed",
                    "pages.$.completedAt": new Date(),
                    "pages.$.timeTaken": foundData.timeTaken,
                    "pages.$.score": foundData.score,
                    "pages.$.grade": foundData.grade,
                    "pages.$.sectionScore": foundData.sectionScore,
                    "pages.$.siteSchema": foundData.siteSchema,
                    "pages.$.aioCompatibilityBadge": foundData.aioCompatibilityBadge,
                    "pages.$.technicalPerformance": foundData.technicalPerformance,
                    "pages.$.onPageSEO": foundData.onPageSEO,
                    "pages.$.accessibility": foundData.accessibility,
                    "pages.$.securityOrCompliance": foundData.securityOrCompliance,
                    "pages.$.UXOrContentStructure": foundData.UXOrContentStructure,
                    "pages.$.conversionAndLeadFlow": foundData.conversionAndLeadFlow,
                    "pages.$.aioReadiness": foundData.aioReadiness,
                    "pages.$.screenshot": foundData.screenshot
                };

                await BulkAuditReport.findOneAndUpdate(
                    { _id: bulkAuditId, "pages.url": pageUrl },
                    {
                        $set: updateData,
                        $inc: { completedPages: 1 }
                    }
                );

                continue;
            }

            // Update page status to inprogress
            await BulkAuditReport.findOneAndUpdate(
                { _id: bulkAuditId, "pages.url": pageUrl },
                { $set: { "pages.$.status": "inprogress" } }
            );

            // Start worker for this page
            await auditSinglePage(bulkAuditId, pageUrl, device, report);

            // Small delay between audits to prevent overwhelming the server
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // Mark bulk audit as completed
        await BulkAuditReport.findByIdAndUpdate(bulkAuditId, {
            status: 'completed',
            completedAt: new Date()
        });

        console.log(`✅ Bulk audit completed: ${bulkAuditId}`);

    } catch (error) {
        console.error("Error in audit process:", error);

        await BulkAuditReport.findByIdAndUpdate(bulkAuditId, {
            status: 'failed',
            completedAt: new Date()
        });
    }
}

// Audit a single page and save results directly in BulkAudit document
async function auditSinglePage(bulkAuditId, pageUrl, device, report) {
    return new Promise(async (resolve) => {
        try {
            const workerPath = join(process.cwd(), "workers", "bulkAuditWorker.js");

            const worker = new Worker(workerPath, {
                workerData: {
                    url: pageUrl,
                    device: device,
                    report: report,
                    bulkAuditId,
                    pageUrl
                },
            });

            worker.on("message", async (msg) => {
                if (msg?.error) {
                    console.log(`❌ Page audit failed: ${pageUrl}`);

                    await BulkAuditReport.findOneAndUpdate(
                        { _id: bulkAuditId, "pages.url": pageUrl },
                        {
                            $set: {
                                "pages.$.status": "failed",
                                "pages.$.error": msg.error,
                                "pages.$.completedAt": new Date()
                            },
                            $inc: { failedPages: 1 }
                        }
                    );
                } else if (msg?.success) {
                    console.log(`✅ Page audit completed: ${pageUrl}`);

                    await BulkAuditReport.findOneAndUpdate(
                        { _id: bulkAuditId, "pages.url": pageUrl },
                        {
                            $set: {
                                "pages.$.status": "completed",
                                "pages.$.completedAt": new Date()
                            },
                            $inc: { completedPages: 1 }
                        }
                    );
                }

                resolve();
            });

            worker.on("error", async (error) => {
                console.log(`❌ Worker error for ${pageUrl}:`, error.message);

                await BulkAuditReport.findOneAndUpdate(
                    { _id: bulkAuditId, "pages.url": pageUrl },
                    {
                        $set: {
                            "pages.$.status": "failed",
                            "pages.$.error": error.message,
                            "pages.$.completedAt": new Date()
                        },
                        $inc: { failedPages: 1 }
                    }
                );

                resolve();
            });

        } catch (error) {
            console.error(`Error auditing page ${pageUrl}:`, error);

            await BulkAuditReport.findOneAndUpdate(
                { _id: bulkAuditId, "pages.url": pageUrl },
                {
                    $set: {
                        "pages.$.status": "failed",
                        "pages.$.error": error.message,
                        "pages.$.completedAt": new Date()
                    },
                    $inc: { failedPages: 1 }
                }
            );

            resolve();
        }
    });
}

export const getBulkAuditStatus = async (req, res) => {
    try {
        const { bulkAuditId } = req.params;

        const bulkAudit = await BulkAuditReport.findById(bulkAuditId);

        if (!bulkAudit) {
            return res.status(404).json({ error: "Bulk audit not found" });
        }

        res.status(200).json(bulkAudit);

    } catch (error) {
        console.error("Error fetching bulk audit status:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
