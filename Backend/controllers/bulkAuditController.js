import { Worker } from "worker_threads";
import { join } from "path";
import BulkAuditReport from "../models/bulkAuditReport.js";
import SingleAuditReport from "../models/singleAuditReport.js";
import AuditLog from "../models/AuditLog.js";
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

        // Set max pages limit (default: 5, max: 200)
        maxPages = Math.min(parseInt(maxPages) || 1, 200);

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

        // Start auditing selected pages in background with tracking info
        processSelectedUrls(bulkAudit._id.toString(), selectedUrls, device, report, req.tracking);

    } catch (error) {
        console.error("Error starting audit:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};

// Background process to audit selected URLs with concurrency control
async function processSelectedUrls(bulkAuditId, selectedUrls, device, report, tracking) {
    try {
        const CONCURRENCY_LIMIT = 10; // Run max 5 workers at once
        const total = selectedUrls.length;
        let currentIndex = 0;
        const activeAudits = new Set();

        console.log(`🚀 Starting parallel audit for ${total} URLs (Concurrency: ${CONCURRENCY_LIMIT})`);

        // Helper to run next available task
        const runNext = async () => {
            if (currentIndex >= total) return;
            
            const index = currentIndex++;
            const pageUrl = selectedUrls[index];
            const startTime = Date.now();

            console.log(`📡 Preparing audit ${index + 1}/${total}: ${pageUrl}`);

            // 1. Check for existing data (reuse)
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
                console.log(`♻️ Reusing data for: ${pageUrl}`);
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
                    { $set: updateData, $inc: { completedPages: 1 } }
                );
                
                return runNext(); // Immediately start next
            }

            // 2. Start Live Worker Audit
            await BulkAuditReport.findOneAndUpdate(
                { _id: bulkAuditId, "pages.url": pageUrl },
                { $set: { "pages.$.status": "inprogress" } }
            );

            const auditLog = new AuditLog({
                sessionId: tracking?.sessionId || "bulk-session",
                ip: tracking?.ip || "unknown",
                country: tracking?.country || "unknown",
                city: tracking?.city || "unknown",
                device: tracking?.device || device,
                browser: tracking?.browser || "unknown",
                os: tracking?.os || "unknown",
                screenResolution: tracking?.screenResolution || "unknown",
                url: pageUrl,
                referrer: tracking?.referrer || "bulk-audit",
                entryPage: tracking?.entryPage || "/bulk-audit",
                actions: ["visited", "bulk_audit_run"],
                captchaPassed: true,
                status: "pending",
            });
            await auditLog.save().catch(err => console.error("Error saving bulk item AuditLog:", err));

            // Start worker and wait for completion
            const auditPromise = auditSinglePage(bulkAuditId, pageUrl, device, report, auditLog._id, startTime);
            activeAudits.add(auditPromise);
            
            await auditPromise;
            activeAudits.delete(auditPromise);

            // Small delay to space out worker starts slightly
            await new Promise(resolve => setTimeout(resolve, 500));
            
            return runNext(); // Continue to next
        };

        // Initialize pool
        const pool = [];
        const initialCount = Math.min(CONCURRENCY_LIMIT, total);
        for (let i = 0; i < initialCount; i++) {
            pool.push(runNext());
        }

        await Promise.all(pool);

        // Final check to mark main report as completed
        await BulkAuditReport.findByIdAndUpdate(bulkAuditId, {
            status: 'completed',
            completedAt: new Date()
        });

        console.log(`✅ Bulk audit completed: ${bulkAuditId}`);

    } catch (error) {
        console.error("Error in parallel audit process:", error);
        await BulkAuditReport.findByIdAndUpdate(bulkAuditId, {
            status: 'failed',
            completedAt: new Date()
        });
    }
}

// Audit a single page and save results directly in BulkAudit document
async function auditSinglePage(bulkAuditId, pageUrl, device, report, auditLogId, startTime) {
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

                    // Update AuditLog
                    if (auditLogId) {
                        try {
                            const duration = Date.now() - startTime;
                            await AuditLog.findByIdAndUpdate(auditLogId, { 
                                status: "failed",
                                auditDuration: duration,
                                $push: { actions: "failed" }
                            });
                        } catch (err) {
                            console.error("Error updating bulk item AuditLog on error message:", err);
                        }
                    }
                } else if (msg?.success) {
                    console.log(`✅ Page audit completed: ${pageUrl}`);

                    const updatedBulk = await BulkAuditReport.findOneAndUpdate(
                        { _id: bulkAuditId, "pages.url": pageUrl },
                        {
                            $set: {
                                "pages.$.status": "completed",
                                "pages.$.completedAt": new Date()
                            },
                            $inc: { completedPages: 1 }
                        },
                        { new: true }
                    );

                    // Update AuditLog with score and grade
                    if (auditLogId) {
                        try {
                            const duration = Date.now() - startTime;
                            const pageData = updatedBulk?.pages?.find(p => p.url === pageUrl);
                            if (pageData) {
                                await AuditLog.findByIdAndUpdate(auditLogId, {
                                    status: "success",
                                    score: pageData.score,
                                    grade: pageData.grade,
                                    auditDuration: duration,
                                    exitPage: "/bulk-report",
                                    $push: { actions: "completed" }
                                });
                            }
                        } catch (err) {
                            console.error("Error updating bulk item AuditLog on success:", err);
                        }
                    }
                }

                resolve();
            });

            worker.on("error", async (error) => {
                const duration = Date.now() - startTime;
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

                // Update AuditLog
                if (auditLogId) {
                    try {
                        await AuditLog.findByIdAndUpdate(auditLogId, { 
                            status: "failed",
                            auditDuration: duration,
                            $push: { actions: "failed" }
                        });
                    } catch (err) {
                        console.error("Error updating bulk item AuditLog on worker error:", err);
                    }
                }

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

// 🚀 Discover & Start Audit (Combined for automation)
export const discoverAndAuditUrls = async (req, res) => {
    try {
        let { url, maxPages, device, report } = req.body;

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

        // Defaults
        maxPages = Math.min(parseInt(maxPages) || 50, 100);
        device = device || "Desktop";
        report = report || "All";

        console.log(`🤖 Auto-Bulk Audit for: ${url} | Max: ${maxPages} pages | Device: ${device}`);

        // 0. Safeguard: Check if an identical audit is already in progress (prevent double-triggering)
        const recentAudit = await BulkAuditReport.findOne({
            site: url,
            device: device,
            status: "inprogress",
            createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) } // Last 2 mins buffer
        }).sort({ createdAt: -1 });

        if (recentAudit) {
            console.log(`♻️ Safeguard: Found recent in-progress Bulk Audit for ${url}. Re-routing.`);
            return res.status(200).json({
                message: "Audit already in progress",
                bulkAuditId: recentAudit._id,
                status: "inprogress",
                totalPages: recentAudit.totalPages,
                discoveredUrls: recentAudit.pages.map(p => p.url)
            });
        }

        // 1. Discover all pages
        const discoveredUrls = await discoverPages(url, maxPages);

        if (discoveredUrls.length === 0) {
            return res.status(404).json({ error: "No URLs found to audit!" });
        }

        console.log(`✅ Discovered ${discoveredUrls.length} URLs for auto-audit`);

        // 2. Start Audit for ALL discovered URLs
        const pages = discoveredUrls.map(pageUrl => ({
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
            totalPages: discoveredUrls.length,
            pages
        });

        // 3. Send response immediately
        res.status(201).json({
            message: "Auto-audit started successfully",
            bulkAuditId: bulkAudit._id,
            status: "inprogress",
            totalPages: discoveredUrls.length,
            discoveredUrls: discoveredUrls // Added for frontend to show total links
        });

        // 4. Background process
        processSelectedUrls(bulkAudit._id.toString(), discoveredUrls, device, report, req.tracking);

    } catch (error) {
        console.error("Error in auto discover-and-audit:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error during auto-audit" });
        }
    }
};
