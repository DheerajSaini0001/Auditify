import { Worker } from "worker_threads";
import { join } from "path";
import mongoose from "mongoose";
import SingleAuditReport from "../models/singleAuditReport.js";
import AuditLog from "../models/AuditLog.js";
import ActivityLog from "../models/ActivityLog.js";
import Puppeteer_Cheerio from "../utils/puppeteer_cheerio.js";
import { checkWebsiteExists } from "../utils/fastFetch.js";
import { validateUrlSafety } from "../utils/ssrfGuard.js";
import auditStore from "../utils/auditStore.js";
import logger from "../utils/logger.js";
 
const reportFieldMap = {
  "Technical Performance": "technicalPerformance",
  "On Page SEO": "onPageSEO",
  "Accessibility": "accessibility",
  "Security/Compliance": "securityOrCompliance",
  "UX & Content Structure": "UXOrContentStructure",
  "Conversion & Lead Flow": "conversionAndLeadFlow",
  "AIO (AI-Optimization) Readiness": "aioReadiness"
};

export const startAudit = async (req, res) => {

  try {
    let { url, device, report, force } = req.body;

    if (!url || !device || !report) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    url = url.trim().toLowerCase().replace(/\/$/, "");
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    // SSRF guard: resolves the host and rejects private/reserved/metadata targets.
    const safety = await validateUrlSafety(url);
    if (!safety.ok) {
      return res.status(400).json({ error: `Invalid or Restricted URL — ${safety.reason}` });
    }

    // EXISTENCE CHECK — hit the URL up front. If the domain doesn't resolve or
    // the host refuses the connection, there's no website to audit: reject now,
    // BEFORE creating any report or spawning a worker. (Timeouts / blocks / TLS
    // errors are treated as "exists" so a slow or protected real site still runs.)
    const existence = await checkWebsiteExists(url);
    if (!existence.exists) {
      logger.info(`🌐 Rejected audit — website does not exist: ${url} (${existence.errorCode})`);
      return res.status(400).json({ error: `Website not found — ${existence.reason}` });
    }

    if (force) {
      logger.info(`🗑️ Force run: Deleting existing single audit report for: ${url}`);
      await SingleAuditReport.deleteMany({
        url,
        device,
        report,
        userId: req.user?.userId || null
      });
      // Also drop any in-memory copy that hasn't been flushed yet.
      auditStore.removeMatching({ url, device, report, userId: req.user?.userId || null });
    }

    // Strict Deduplication: Check if a successful audit already exists or a very recent in-progress one.
    // Check the in-memory store FIRST (reports may not be flushed to Mongo yet), then Mongo.
    let existing = null;
    if (!force) {
      existing = auditStore.findActiveDuplicate({ url, device, report, userId: req.user?.userId || null });
      if (!existing) {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        existing = await SingleAuditReport.findOne({
          url,
          device,
          report,
          userId: req.user?.userId || null,
          $or: [
            { status: "completed" },
            { status: "inprogress", createdAt: { $gt: fiveMinutesAgo } }
          ]
        }).sort({ createdAt: -1 });
      }
    }

    if (existing) {
      logger.info(`♻️ Safeguard: Reusing existing Audit (${existing.status}) for: ${url}`);
      
      // Save an AuditLog so it appears in User's history even though it was cached
      const auditLog = new AuditLog({
        userId: req.user?.userId || null,
        guestEmail: req.guestEmail || null,
        sessionId: req.tracking?.sessionId || 'N/A',
        ip: req.tracking?.ip || '0.0.0.0',
        country: req.tracking?.country,
        city: req.tracking?.city,
        device: existing.device || device || 'Desktop',
        browser: req.tracking?.browser,
        os: req.tracking?.os,
        screenResolution: req.body.screenResolution || req.tracking?.screenResolution,
        url: url,
        reportId: existing._id,
        reportType: report,
        referrer: req.tracking?.referrer || 'direct',
        entryPage: req.tracking?.entryPage || '/',
        actions: ["visited", "audit_run_cached"],
        captchaPassed: true,
        status: existing.status === "completed" ? "success" : existing.status === "failed" ? "failed" : "pending",
        score: existing.score,
        grade: existing.grade,
      });

      if (req.user) {
        ActivityLog.create({
          userId: req.user.userId,
          sessionId: req.tracking?.sessionId || 'N/A',
          ip: req.tracking?.ip || '0.0.0.0',
          device: device,
          browser: req.tracking?.browser || 'Unknown',
          os: req.tracking?.os || 'Unknown',
          action: 'AUDIT_RUN_CACHED',
          metadata: { url, device, reportId: existing._id }
        }).catch(err => logger.error("Error saving cached ActivityLog", err));
      }

      auditLog.save().catch(err => logger.error("Error saving cached AuditLog", err));

      return res.status(200).json(existing);
    }
 
    // ⭐ ENHANCEMENT: Extract section from existing "Full Audit"
    if (report !== "All") {
      // Prefer an in-memory completed full audit; fall back to Mongo.
      let fullAudit = auditStore.findCompletedFullAudit({ url, device, userId: req.user?.userId || null });
      if (!fullAudit) {
        fullAudit = await SingleAuditReport.findOne({
          url,
          device,
          report: "All",
          userId: req.user?.userId || null,
          status: "completed"
        }).sort({ createdAt: -1 });
      }
 
      if (fullAudit) {
        const fieldName = reportFieldMap[report];
        if (fieldName && fullAudit[fieldName]) {
          logger.info(`✨ Section Reuse: Extracting ${report} from existing Full Audit for: ${url}`);
 
          const sectionScore = fullAudit[fieldName].Percentage || 0;
          const sectionGrade = sectionScore >= 90 ? "A+" : sectionScore >= 80 ? "A" : sectionScore >= 70 ? "B" : sectionScore >= 60 ? "C" : sectionScore >= 50 ? "D" : "F";
 
          const newSectionReport = new SingleAuditReport({
            url: fullAudit.url,
            device: fullAudit.device,
            report: report,
            status: "completed",
            [fieldName]: fullAudit[fieldName],
            score: sectionScore,
            grade: sectionGrade,
            screenshot: fullAudit.screenshot,
            timeTaken: "0s (cached)",
            isBotProtected: fullAudit.isBotProtected,
            userId: req.user?.userId || null
          });
 
          // Include sub-dependencies
          if (report === "On Page SEO") newSectionReport.siteSchema = fullAudit.siteSchema;
          if (report === "AIO (AI-Optimization) Readiness") {
            newSectionReport.aioCompatibilityBadge = fullAudit.aioCompatibilityBadge;
            newSectionReport.aeo = fullAudit.aeo;
          }
 
          await newSectionReport.save();
 
          // Log the cached audit run
          const auditLog = new AuditLog({
            userId: req.user?.userId || null,
            guestEmail: req.guestEmail || null,
            sessionId: req.tracking?.sessionId || 'N/A',
            ip: req.tracking?.ip || '0.0.0.0',
            url: url,
            reportId: newSectionReport._id,
            reportType: report,
            status: "success",
            score: sectionScore,
            grade: sectionGrade,
            actions: ["visited", "audit_section_extracted"],
          });
          auditLog.save().catch(err => logger.error("Error saving extracted AuditLog", err));
 
          return res.status(200).json(newSectionReport);
        }
      }
    }

    // Double-check race condition (buffer for parallel requests). Check the
    // in-memory store first (the in-progress report isn't in Mongo yet), then Mongo.
    await new Promise(resolve => setTimeout(resolve, 200));
    const raceDup = auditStore.findActiveDuplicate({ url, device, report, userId: req.user?.userId || null });
    if (raceDup) return res.status(200).json(raceDup);
    const raceCheck = await SingleAuditReport.findOne({ url, device, report, status: "inprogress", userId: req.user?.userId || null });
    if (raceCheck) return res.status(200).json(raceCheck);

    logger.info(`➡️ Starting NEW Audit Request → ${url} | ${device} | ${report}`);

    // No DB write here. The report lives in memory until the worker finishes; the
    // main thread then batches it to Mongo. We generate the id up front so the
    // client can poll immediately and AuditLog can reference it.
    const newReport = auditStore.createInProgress({
      _id: new mongoose.Types.ObjectId(),
      url,
      device,
      report,
      userId: req.user?.userId || null,
    });

    // Create a pending AuditLog entry asynchronously
    const auditLog = new AuditLog({
      userId: req.user?.userId || null,
      guestEmail: req.guestEmail || null,
      sessionId: req.tracking?.sessionId || 'N/A',
      ip: req.tracking?.ip || '0.0.0.0',
      country: req.tracking?.country || 'unknown',
      city: req.tracking?.city || 'unknown',
      device: device || 'Desktop',
      browser: req.tracking?.browser || 'unknown',
      os: req.tracking?.os || 'unknown',
      screenResolution: req.body.screenResolution || req.tracking?.screenResolution || 'unknown',
      url: url,
      reportId: newReport._id,
      reportType: report,
      referrer: req.tracking?.referrer || 'direct',
      entryPage: req.tracking?.entryPage || '/',
      actions: ["visited", "audit_run"],
      captchaPassed: true,
      status: "pending",
    });

    // Create detailed activity log for RBAC (Section 3.3)
    if (req.user) {
      ActivityLog.create({
        userId: req.user.userId,
        sessionId: req.tracking?.sessionId || 'N/A',
        ip: req.tracking?.ip || '0.0.0.0',
        device: device,
        browser: req.tracking?.browser || 'Unknown',
        os: req.tracking?.os || 'Unknown',
        action: 'AUDIT_RUN',
        metadata: { url, device, reportId: newReport._id }
      }).catch(err => logger.error("Error saving ActivityLog", err));
    }

    auditLog.save().catch(err => logger.error("Error saving AuditLog", err));

    const startTime = Date.now();

    res.status(201).json({
      message: "Audit started successfully",
      _id: newReport._id,
      url,
      device,
      report,
      status: "inprogress",
    });

    const workerPath = join(process.cwd(), "workers", "singleAuditWorker.js");

    const worker = new Worker(workerPath, {
      workerData: {
        url,
        device,
        report,
        auditId: newReport._id.toString(),
      },
    });

    // The worker is DB-free: it streams progress and the final result here. The
    // main thread owns the in-memory store and batches the final write to Mongo.
    const markAuditLog = async (fields) => {
      try {
        await AuditLog.updateMany(
          { reportId: newReport._id, status: "pending" },
          fields
        );
      } catch (err) {
        logger.error("Error updating AuditLog", err);
      }
    };

    worker.on("message", async (msg) => {
      if (!msg || !msg.type) return;

      if (msg.type === "progress") {
        // Live, in-memory update — served straight to polling clients, no DB hit.
        auditStore.applyPatch(newReport._id, msg.patch || {});
        return;
      }

      if (msg.type === "error") {
        logger.error(`❌ Audit Failed: ${msg.error}`);
        auditStore.complete(newReport._id, { status: "failed", error: msg.error });
        await markAuditLog({
          status: "failed",
          auditDuration: Date.now() - startTime,
          $push: { actions: "failed" },
        });
        return;
      }

      if (msg.type === "done") {
        const duration = Date.now() - startTime;
        // Finalize in memory; this queues the report for the next batched flush.
        const finalDoc = auditStore.complete(newReport._id, msg.patch || {});

        if (finalDoc?.status === "failed") {
          await markAuditLog({
            status: "failed",
            auditDuration: duration,
            $push: { actions: "failed" },
          });
          return;
        }

        logger.info("✅ Audit Completed Successfully");
        await markAuditLog({
          status: "success",
          score: finalDoc?.score,
          grade: finalDoc?.grade,
          auditDuration: duration,
          exitPage: "/report",
          $push: { actions: "completed" },
        });
      }
    });

    worker.on("error", async (err) => {
      logger.error(`❌ Audit Failed with worker error`, err);
      auditStore.complete(newReport._id, { status: "failed", error: err.message });
      await markAuditLog({
        status: "failed",
        auditDuration: Date.now() - startTime,
        $push: { actions: "failed" },
      });
    });

  } catch (error) {
    if (!res.headersSent) {
      logger.error("Audit Controller Error", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  }
};

// Enforce the same per-user access control whether the report comes from the
// in-memory store or Mongo. Returns true if the requester may see this report.
const canAccessReport = (req, report) => {
  if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return String(report.userId || "") === String(req.user.userId || "");
  }
  return true;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Completed reports are buffered in memory and written to Mongo in batches, so a
// report can briefly be in neither place (mid-flush) or lag a DB write/replication.
// These give a refresh a short cooldown to settle before we declare it missing.
const REPORT_LOOKUP_RETRIES = 3;
const REPORT_LOOKUP_COOLDOWN_MS = 400; // up to ~1.2s total before a 404

// Resolve a report by id: memory first, then Mongo with a cooldown+retry, then null.
// `projection` (optional) restricts the Mongo fields fetched (used by the status poll).
const resolveReport = async (req, id, projection = null) => {
  // 1) Memory — in-progress and not-yet-flushed reports live only here.
  const liveDoc = auditStore.get(id);
  if (liveDoc) return { doc: liveDoc, ok: canAccessReport(req, liveDoc) };

  // 2) Mongo, with a short cooldown+retry to ride out the flush / write-lag window.
  const query = { _id: id };
  if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    query.userId = req.user.userId; // non-admins only see their own reports
  }

  for (let attempt = 0; attempt < REPORT_LOOKUP_RETRIES; attempt++) {
    const q = SingleAuditReport.findOne(query);
    const found = await (projection ? q.select(projection) : q);
    if (found) return { doc: found, ok: true }; // Mongo query already scoped by userId

    // Cheap re-check of memory in case a failed flush re-queued the report.
    const reappeared = auditStore.get(id);
    if (reappeared) return { doc: reappeared, ok: canAccessReport(req, reappeared) };

    if (attempt < REPORT_LOOKUP_RETRIES - 1) await sleep(REPORT_LOOKUP_COOLDOWN_MS);
  }

  return { doc: null, ok: false };
};

export const getReportById = async (req, res) => {
  try {
    const id = req.params.singleAuditId;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Report not found or access denied" });
    }

    const { doc, ok } = await resolveReport(req, id);
    if (!doc || !ok) {
      return res.status(404).json({ message: "Report not found or access denied" });
    }
    res.status(200).json(doc);
  } catch (error) {
    logger.error("Error fetching report", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getReportStatusById = async (req, res) => {
  try {
    const id = req.params.singleAuditId;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({ message: "Report not found or access denied" });
    }

    // Memory first (no DB read on the in-progress 3s poll), then Mongo. We also need
    // each section's Percentage so progress can track SECTION COMPLETION — the status
    // field only moves through the browser/crawl phases, then sits still through the
    // (longest) scoring phase, so on its own it stalls the bar. Project just the
    // Percentage sub-fields (cheap) — never the full section objects or screenshot.
    const { doc: report, ok } = await resolveReport(
      req,
      id,
      "_id status screenshotUrl error technicalPerformance.Percentage onPageSEO.Percentage " +
      "accessibility.Percentage securityOrCompliance.Percentage UXOrContentStructure.Percentage " +
      "conversionAndLeadFlow.Percentage aioReadiness.Percentage"
    );
    if (!report || !ok) {
      return res.status(404).json({ message: "Report not found or access denied" });
    }

    // How many of the 7 dimensions have finished scoring. These stream in as the worker
    // completes each metric, so this climbs steadily even while `status` is unchanged.
    const SECTION_KEYS = [
      "technicalPerformance", "onPageSEO", "accessibility", "securityOrCompliance",
      "UXOrContentStructure", "conversionAndLeadFlow", "aioReadiness",
    ];
    const total = SECTION_KEYS.length;
    const completedSections = SECTION_KEYS.filter(
      (k) => report[k] && typeof report[k].Percentage === "number"
    ).length;

    // Browser/crawl phases own the first ~45%; section completion drives 45 → 100%.
    // Mirrors the dashboard loading model so a page's progress never freezes mid-run.
    const PHASES = {
      launching: [10, "Launching browser"],
      navigating: [20, "Opening your website"],
      waiting_for_render: [30, "Rendering the page"],
      screenshot_ready: [40, "Capturing the page"],
      extracting_data: [45, "Scoring sections"],
    };

    let progress = 0;
    let message = "";
    if (report.status === "failed") {
      progress = 100;
      message = report.error || "Audit failed";
    } else if (report.status === "completed") {
      progress = 100;
      message = "Audit completed";
    } else if (completedSections > 0) {
      progress = Math.min(99, 45 + Math.round((completedSections / total) * 55));
      message = `Analyzing your site — ${completedSections}/${total} sections scored`;
    } else if (PHASES[report.status]) {
      progress = PHASES[report.status][0];
      message = PHASES[report.status][1];
    } else {
      progress = 8;
      message = "Starting audit";
    }

    res.status(200).json({
      _id: report._id,
      status: report.status,
      screenshotUrl: report.screenshotUrl,
      progress,
      message,
      completedSections,
      totalSections: total,
    });
  } catch (error) {
    logger.error("Error fetching report status", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const captureScreenshot = async (req, res) => {
  try {
    const { url, auditId } = req.body;
    if (!url || !auditId) {
      return res.status(400).json({ error: "Missing url or auditId" });
    }

    // SSRF guard: this endpoint drives Puppeteer against the supplied URL.
    const safety = await validateUrlSafety(url);
    if (!safety.ok) {
      return res.status(400).json({ error: `Invalid or Restricted URL — ${safety.reason}` });
    }

    // The report may still be in memory (not yet flushed to Mongo).
    const liveReport = auditStore.get(auditId);
    const report = liveReport || await SingleAuditReport.findById(auditId);
    if (!report) {
      return res.status(404).json({ error: "Audit report not found" });
    }

    // Only the report owner (or an admin) may trigger a screenshot for it.
    if (!canAccessReport(req, report)) {
      return res.status(404).json({ error: "Audit report not found" });
    }

    // Write a patch to wherever the report currently lives.
    const patchReport = async (patch) => {
      if (auditStore.get(auditId)) auditStore.applyPatch(auditId, patch);
      else await SingleAuditReport.findByIdAndUpdate(auditId, patch);
    };

    const device = report.device || "Desktop";

    logger.info(`📸 Taking parallel screenshot for ${url} on ${device}...`);
    let result;
    try {
      result = await Puppeteer_Cheerio(url, device);
    } catch (scrapingError) {
      logger.error("Puppeteer capture failed", scrapingError);
      await patchReport({ screenshot: null, screenshotUrl: null });
      return res.status(200).json({ screenshotUrl: null, error: "timeout" });
    }

    const { screenshot, isBotProtected, browser } = result;

    if (browser) {
      try { await browser.close(); } catch (_) {}
    }

    if (!screenshot) {
      logger.warn("Screenshot capture returned empty.");
      await patchReport({
        screenshot: null,
        screenshotUrl: null,
        isBotProtected: isBotProtected || false
      });
      return res.status(200).json({ screenshotUrl: null, error: "empty" });
    }

    // Dynamic self-hosted URL
    const screenshotUrl = `/api/screenshot/view/${auditId}`;

    await patchReport({
      screenshot,
      screenshotUrl,
      isBotProtected: isBotProtected || false
    });

    logger.info(`📸 Screenshot captured successfully and saved for ${url}`);
    return res.status(200).json({ screenshotUrl });

  } catch (error) {
    logger.error("Screenshot Endpoint Error", error);
    return res.status(200).json({ screenshotUrl: null, error: error.message });
  }
};

export const getScreenshotImage = async (req, res) => {
  try {
    // The screenshot is held in memory during the audit; fall back to Mongo after flush.
    const report =
      auditStore.get(req.params.auditId) ||
      await SingleAuditReport.findById(req.params.auditId).select("screenshot");
    if (!report || !report.screenshot) {
      return res.status(404).send("Screenshot not found");
    }
    const imgBuffer = Buffer.from(report.screenshot, "base64");
    res.writeHead(200, {
      "Content-Type": "image/jpeg",
      "Content-Length": imgBuffer.length,
      "Cache-Control": "public, max-age=86400"
    });
    res.end(imgBuffer);
  } catch (err) {
    logger.error("Error serving screenshot", err);
    res.status(500).send("Internal Server Error");
  }
};
