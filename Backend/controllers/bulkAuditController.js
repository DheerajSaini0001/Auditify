import { Worker } from "worker_threads";
import { join } from "path";
import BulkAuditReport from "../models/bulkAuditReport.js";
import SingleAuditReport from "../models/singleAuditReport.js";
import AuditLog from "../models/AuditLog.js";
import discoverPages from "../utils/sitemapCrawler.js";
import { checkWebsiteExists } from "../utils/fastFetch.js";
import logger from "../utils/logger.js";

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

        // EXISTENCE CHECK — hit the site before crawling. If the domain doesn't
        // resolve / the host refuses, there's nothing to discover: reject now.
        const existence = await checkWebsiteExists(url);
        if (!existence.exists) {
            logger.info(`🌐 Rejected discovery — website does not exist: ${url} (${existence.errorCode})`);
            return res.status(400).json({ error: `Website not found — ${existence.reason}` });
        }

        // Set max pages limit (default: 5, max: 200)
        maxPages = Math.min(parseInt(maxPages) || 1, 200);

        logger.info(`🔍 Discovering URLs for: ${url} | Max: ${maxPages} pages`);

        // Discover all pages
        const discoveredUrls = await discoverPages(url, maxPages);

        logger.info(`✅ Discovered ${discoveredUrls.length} URLs`);

        res.status(200).json({
            url,
            totalUrls: discoveredUrls.length,
            urls: discoveredUrls
        });

    } catch (error) {
        logger.error("Error discovering URLs", error);
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

        logger.info(`🚀 Starting audit for ${selectedUrls.length} selected URLs`);

        const userId = req.user?._id || req.user?.id || req.user?.userId || null;

        // Check if an identical Bulk Audit already exists
        const existingAudits = await BulkAuditReport.find({
            site: url,
            device: device,
            userId: userId,
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

                logger.info(`♻️ Found existing Bulk Audit: ${audit._id}, reusing.`);
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
            pages,
            userId: userId
        });

        // Send immediate response
        res.status(201).json({
            message: "Audit started successfully",
            bulkAuditId: bulkAudit._id,
            status: "inprogress",
            totalPages: selectedUrls.length
        });

        // Start auditing selected pages in background with tracking info
        processSelectedUrls(bulkAudit._id.toString(), userId, selectedUrls, device, report, req.tracking);

    } catch (error) {
        logger.error("Error starting audit", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};

// Background process to audit selected URLs with concurrency control
async function processSelectedUrls(bulkAuditId, userId, selectedUrls, device, report, tracking) {
    try {
        const CONCURRENCY_LIMIT = 5; // Run max 5 workers at once
        const total = selectedUrls.length;
        let currentIndex = 0;
        const activeAudits = new Set();

        logger.info(`🚀 Starting parallel audit for ${total} URLs (Concurrency: ${CONCURRENCY_LIMIT})`);

        // Helper to run next available task
        const runNext = async () => {
            if (currentIndex >= total) return;

            const index = currentIndex++;
            const pageUrl = selectedUrls[index];
            const startTime = Date.now();

            logger.info(`📡 Preparing audit ${index + 1}/${total}: ${pageUrl}`);

            // 1. Check for existing data (reuse)
            let foundData = await SingleAuditReport.findOne({
                url: pageUrl,
                device: device,
                status: 'completed',
                userId: userId || null,
                $or: [{ report: report }, { report: "All" }]
            }).sort({ createdAt: -1 });

            if (!foundData) {
                const previousBulk = await BulkAuditReport.findOne({
                    _id: { $ne: bulkAuditId },
                    device: device,
                    userId: userId || null,
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
                logger.info(`♻️ Reusing data for: ${pageUrl}`);
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
                userId: userId || null, 
                sessionId: tracking?.sessionId || "bulk-session",
                ip: tracking?.ip || "unknown",
                country: tracking?.country || "unknown",
                city: tracking?.city || "unknown",
                device: device || "Desktop",
                browser: tracking?.browser || "unknown",
                os: tracking?.os || "unknown",
                screenResolution: tracking?.screenResolution || "unknown",
                url: pageUrl,
                referrer: tracking?.referrer || "bulk-audit",
                entryPage: tracking?.entryPage || "/bulk-audit",
                actions: ["visited", "bulk_audit_run"],
                captchaPassed: true,
                status: "pending",
                parentBulkAuditId: bulkAuditId
            });
            await auditLog.save().catch(err => logger.error("Error saving bulk item AuditLog", err));

            // Start worker and wait for completion
            const auditPromise = auditSinglePage(bulkAuditId, pageUrl, device, report, auditLog._id, startTime, userId);
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

        logger.info(`✅ Bulk audit completed: ${bulkAuditId}`);

    } catch (error) {
        logger.error("Error in parallel audit process", error);
        await BulkAuditReport.findByIdAndUpdate(bulkAuditId, {
            status: 'failed',
            completedAt: new Date()
        });
    }
}

// Audit a single page and save results directly in BulkAudit document
async function auditSinglePage(bulkAuditId, pageUrl, device, report, auditLogId, startTime, userId) {
    return new Promise(async (resolve) => {
        try {
            const workerPath = join(process.cwd(), "workers", "bulkAuditWorker.js");

            const worker = new Worker(workerPath, {
                workerData: {
                    url: pageUrl,
                    device: device,
                    report: report,
                    bulkAuditId,
                    pageUrl,
                    userId
                },
            });

            worker.on("message", async (msg) => {
                if (msg?.error) {
                    logger.error(`❌ Page audit failed: ${pageUrl}`);

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
                            logger.error("Error updating bulk item AuditLog on error message", err);
                        }
                    }
                } else if (msg?.success) {
                    logger.info(`✅ Page audit completed: ${pageUrl}`);

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
                            logger.error("Error updating bulk item AuditLog on success", err);
                        }
                    }
                }

                resolve();
            });

            worker.on("error", async (error) => {
                const duration = Date.now() - startTime;
                logger.error(`❌ Worker error for ${pageUrl}`, error);

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
                        logger.error("Error updating bulk item AuditLog on worker error", err);
                    }
                }

                resolve();
            });

        } catch (error) {
            logger.error(`Error auditing page ${pageUrl}`, error);

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

        const query = { _id: bulkAuditId };
        
        // Non-admins can only see their own audits
        if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            query.userId = req.user.userId;
        }

        const bulkAudit = await BulkAuditReport.findOne(query);

        if (!bulkAudit) {
            return res.status(404).json({ error: "Bulk audit not found or access denied" });
        }

        // Calculate progress and average score
        const totalAudits = bulkAudit.pages.length;
        // Count both completed and failed as "finished" for progress
        const completedAudits = bulkAudit.pages.filter(p => p.status === 'completed' || p.status === 'failed').length;
        const progress = totalAudits > 0 ? Math.round((completedAudits / totalAudits) * 100) : 0;

        // Average score only from successful pages
        const scoredPages = bulkAudit.pages.filter(p => p.status === 'completed' && p.score !== null);
        const averageScore = scoredPages.length > 0 
            ? Math.round(scoredPages.reduce((acc, p) => acc + (p.score || 0), 0) / scoredPages.length) 
            : 0;

        const responseData = {
            ...bulkAudit.toObject(),
            completedAudits,
            totalAudits,
            progress,
            averageScore
        };

        res.status(200).json(responseData);

    } catch (error) {
        logger.error("Error fetching bulk audit status", error);
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

        // EXISTENCE CHECK — hit the site before discovering/auditing. If the
        // domain doesn't resolve / the host refuses, reject now (no audit created).
        const existence = await checkWebsiteExists(url);
        if (!existence.exists) {
            logger.info(`🌐 Rejected auto-bulk audit — website does not exist: ${url} (${existence.errorCode})`);
            return res.status(400).json({ error: `Website not found — ${existence.reason}` });
        }

        // Defaults
        maxPages = Math.min(parseInt(maxPages) || 50, 100);
        device = device || "Desktop";
        report = report || "All";

        logger.info(`🤖 Auto-Bulk Audit for: ${url} | Max: ${maxPages} pages | Device: ${device}`);

        const userId = req.user?._id || req.user?.id || req.user?.userId || null;

        // 0. Safeguard: Check if an identical audit is already in progress (prevent double-triggering)
        const recentAudit = await BulkAuditReport.findOne({
            site: url,
            device: device,
            status: "inprogress",
            userId: userId,
            createdAt: { $gte: new Date(Date.now() - 2 * 60 * 1000) } // Last 2 mins buffer
        }).sort({ createdAt: -1 });

        if (recentAudit) {
            logger.info(`♻️ Safeguard: Found recent in-progress Bulk Audit for ${url}. Re-routing.`);
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

        logger.info(`✅ Discovered ${discoveredUrls.length} URLs for auto-audit`);

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
            pages,
            userId: userId
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
        processSelectedUrls(bulkAudit._id.toString(), userId, discoveredUrls, device, report, req.tracking);

    } catch (error) {
        logger.error("Error in auto discover-and-audit", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error during auto-audit" });
        }
    }
};
export const getBulkPageReport = async (req, res) => {
    try {
        const { bulkAuditId } = req.params;
        const { url } = req.query;

        if (!bulkAuditId || !url) {
            return res.status(400).json({ error: "Bulk Audit ID and Page URL are required" });
        }

        const query = { _id: bulkAuditId };
        
        // Non-admins can only see their own audits
        if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
            query.userId = req.user.userId;
        }

        const bulkAudit = await BulkAuditReport.findOne(query);
        if (!bulkAudit) {
            return res.status(404).json({ error: "Bulk audit not found or access denied" });
        }

        const pageData = bulkAudit.pages.find(p => p.url === url);
        if (!pageData) {
            return res.status(404).json({ error: "Page not found in this bulk audit" });
        }

        // Reshape to look like a SingleAuditReport for the frontend
        const reportData = {
            _id: `${bulkAuditId}_${Buffer.from(url).toString('base64')}`, // Virtual ID
            url: pageData.url,
            device: bulkAudit.device,
            report: bulkAudit.report,
            status: pageData.status,
            score: pageData.score,
            grade: pageData.grade,
            overallScore: pageData.score,
            timeTaken: pageData.timeTaken,
            sectionScore: pageData.sectionScore,
            technicalPerformance: pageData.technicalPerformance,
            onPageSEO: pageData.onPageSEO,
            accessibility: pageData.accessibility,
            securityOrCompliance: pageData.securityOrCompliance,
            UXOrContentStructure: pageData.UXOrContentStructure,
            conversionAndLeadFlow: pageData.conversionAndLeadFlow,
            aioReadiness: pageData.aioReadiness,
            screenshot: pageData.screenshot,
            fromBulkAudit: true,
            parentBulkAuditId: bulkAuditId
        };

        res.status(200).json(reportData);

    } catch (error) {
        logger.error("Error fetching bulk page report", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};
