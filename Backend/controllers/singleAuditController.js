import { Worker } from "worker_threads";
import { join } from "path";
import SingleAuditReport from "../models/singleAuditReport.js";
import AuditLog from "../models/AuditLog.js";
import ActivityLog from "../models/ActivityLog.js";
import Puppeteer_Cheerio from "../utils/puppeteer_cheerio.js";
 
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

  try {
    let { url, device, report, force } = req.body;

    if (!url || !device || !report) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    url = url.trim().toLowerCase().replace(/\/$/, "");
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: "Invalid or Restricted URL" });
    }

    if (force) {
      console.log(`🗑️ Force run: Deleting existing single audit report for: ${url}`);
      await SingleAuditReport.deleteMany({
        url,
        device,
        report,
        userId: req.user?.userId || null
      });
    }

    // Strict Deduplication: Check if a successful audit already exists or a very recent in-progress one
    let existing = null;
    if (!force) {
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

    if (existing) {
      console.log(`♻️ Safeguard: Reusing existing Audit (${existing.status}) for: ${url}`);
      
      // Save an AuditLog so it appears in User's history even though it was cached
      const auditLog = new AuditLog({
        userId: req.user?.userId || null, 
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
        }).catch(err => console.error("Error saving cached ActivityLog:", err));
      }

      auditLog.save().catch(err => console.error("Error saving cached AuditLog:", err));

      return res.status(200).json(existing);
    }
 
    // ⭐ ENHANCEMENT: Extract section from existing "Full Audit"
    if (report !== "All") {
      const fullAudit = await SingleAuditReport.findOne({
        url,
        device,
        report: "All",
        userId: req.user?.userId || null,
        status: "completed"
      }).sort({ createdAt: -1 });
 
      if (fullAudit) {
        const fieldName = reportFieldMap[report];
        if (fieldName && fullAudit[fieldName]) {
          console.log(`✨ Section Reuse: Extracting ${report} from existing Full Audit for: ${url}`);
 
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
          auditLog.save().catch(err => console.error("Error saving extracted AuditLog:", err));
 
          return res.status(200).json(newSectionReport);
        }
      }
    }

    // Double-check race condition (buffer for parallel requests)
    await new Promise(resolve => setTimeout(resolve, 200)); 
    const raceCheck = await SingleAuditReport.findOne({ url, device, report, status: "inprogress", userId: req.user?.userId || null });
    if (raceCheck) return res.status(200).json(raceCheck);

    console.log(`➡️ Starting NEW Audit Request → ${url} | ${device} | ${report}`);

    let newReport;
    try {
      newReport = new SingleAuditReport({
        url,
        device,
        report,
        status: "inprogress",
        userId: req.user?.userId || null
      });
      await newReport.save();
    } catch (dbError) {
      // Handle race condition: If two requests hit exactly at the same time
      if (dbError.code === 11000) {
        console.log(`⚠️ Race condition caught: Audit already exists or is in-progress for: ${url}`);
        const raceCheck = await SingleAuditReport.findOne({ url, device, report, status: { $ne: "failed" }, userId: req.user?.userId || null });
        if (raceCheck) return res.send(raceCheck);
      }
      throw dbError; // Otherwise, re-throw server errors
    }

    // Create a pending AuditLog entry asynchronously
    const auditLog = new AuditLog({
      userId: req.user?.userId || null, 
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
      }).catch(err => console.error("Error saving ActivityLog:", err));
    }

    auditLog.save().catch(err => console.error("Error saving AuditLog:", err));

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

    worker.on("message", async (msg) => {
      if (msg?.error) {
        console.log(`❌ Audit Failed: ${msg.error}`);

        await SingleAuditReport.findByIdAndUpdate(newReport._id, {
          status: "failed",
          error: msg.error,
        });

        // Update AuditLog entry on message error
        try {
          const duration = Date.now() - startTime;
          await AuditLog.updateMany(
            { reportId: newReport._id, status: "pending" },
            { 
              status: "failed",
              auditDuration: duration,
              $push: { actions: "failed" }
            }
          );
        } catch (err) {
          console.error("Error updating AuditLog on message error:", err);
        }

        return;
      }

      console.log("✅ Audit Completed Successfully");

      const duration = Date.now() - startTime;

      // Update AuditLog entry
      try {
        await SingleAuditReport.findByIdAndUpdate(newReport._id, { status: "completed" });
        const finalReport = await SingleAuditReport.findById(newReport._id);
        if (finalReport) {
          await AuditLog.updateMany(
            { reportId: newReport._id, status: "pending" },
            {
              status: "success",
              score: finalReport.score,
              grade: finalReport.grade,
              auditDuration: duration,
              exitPage: "/report",
              $push: { actions: "completed" }
            }
          );
        }
      } catch (err) {
        console.error("Error updating status/AuditLog on success:", err);
      }
    })

    worker.on("error", async (err) => {
      const duration = Date.now() - startTime;
      await SingleAuditReport.findByIdAndUpdate(newReport._id, { status: "failed" });
      console.log(`❌ Audit Failed with worker error:`, err);

      // Update AuditLog entry
      try {
        await AuditLog.updateMany(
          { reportId: newReport._id, status: "pending" },
          { 
            status: "failed",
            auditDuration: duration,
            $push: { actions: "failed" }
          }
        );
      } catch (err) {
        console.error("Error updating AuditLog on error:", err);
      }
    });

  } catch (error) {
    if (!res.headersSent) {
      console.error("Audit Controller Error:", error);
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  }
};

export const getReportById = async (req, res) => {
  try {
    const query = { _id: req.params.singleAuditId };
    
    // Non-admins can only see their own reports
    if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      query.userId = req.user.userId;
    }

    const report = await SingleAuditReport.findOne(query);
    if (!report) {
      return res.status(404).json({ message: "Report not found or access denied" });
    }
    res.status(200).json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getReportStatusById = async (req, res) => {
  try {
    const query = { _id: req.params.singleAuditId };
    
    // Non-admins can only see their own reports
    if (req.user && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      query.userId = req.user.userId;
    }

    // Highly optimized status-only projection
    const report = await SingleAuditReport.findOne(query).select("_id status screenshotUrl error");
    if (!report) {
      return res.status(404).json({ message: "Report not found or access denied" });
    }

    let progress = 0;
    let message = "";
    switch (report.status) {
      case "launching":
        progress = 15;
        message = "🚀 Launching browser...";
        break;
      case "navigating":
        progress = 35;
        message = "⏳ Navigating to URL...";
        break;
      case "waiting_for_render":
        progress = 55;
        message = "⏳ Waiting for website to fully load... (~20s)";
        break;
      case "screenshot_ready":
        progress = 75;
        message = "✅ Website loaded successfully — crawling this page";
        break;
      case "extracting_data":
        progress = 90;
        message = "🧠 Extracting audit data...";
        break;
      case "completed":
        progress = 100;
        message = "✅ Audit completed successfully!";
        break;
      case "failed":
        progress = 100;
        message = report.error || "❌ Audit failed";
        break;
      default:
        progress = 0;
        message = "Initializing...";
    }

    res.status(200).json({ 
      _id: report._id, 
      status: report.status, 
      screenshotUrl: report.screenshotUrl, 
      progress, 
      message 
    });
  } catch (error) {
    console.error("Error fetching report status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const captureScreenshot = async (req, res) => {
  try {
    const { url, auditId } = req.body;
    if (!url || !auditId) {
      return res.status(400).json({ error: "Missing url or auditId" });
    }

    const report = await SingleAuditReport.findById(auditId);
    if (!report) {
      return res.status(404).json({ error: "Audit report not found" });
    }

    const device = report.device || "Desktop";

    console.log(`📸 Taking parallel screenshot for ${url} on ${device}...`);
    let result;
    try {
      result = await Puppeteer_Cheerio(url, device);
    } catch (scrapingError) {
      console.error("Puppeteer capture failed:", scrapingError);
      await SingleAuditReport.findByIdAndUpdate(auditId, {
        screenshot: null,
        screenshotUrl: null
      });
      return res.status(200).json({ screenshotUrl: null, error: "timeout" });
    }

    const { screenshot, isBotProtected, browser } = result;

    if (browser) {
      try { await browser.close(); } catch (_) {}
    }

    if (!screenshot) {
      console.warn("Screenshot capture returned empty.");
      await SingleAuditReport.findByIdAndUpdate(auditId, {
        screenshot: null,
        screenshotUrl: null,
        isBotProtected: isBotProtected || false
      });
      return res.status(200).json({ screenshotUrl: null, error: "empty" });
    }

    // Dynamic self-hosted URL
    const screenshotUrl = `/api/screenshot/view/${auditId}`;

    await SingleAuditReport.findByIdAndUpdate(auditId, {
      screenshot,
      screenshotUrl,
      isBotProtected: isBotProtected || false
    });

    console.log(`📸 Screenshot captured successfully and saved for ${url}`);
    return res.status(200).json({ screenshotUrl });

  } catch (error) {
    console.error("Screenshot Endpoint Error:", error);
    return res.status(200).json({ screenshotUrl: null, error: error.message });
  }
};

export const getScreenshotImage = async (req, res) => {
  try {
    const report = await SingleAuditReport.findById(req.params.auditId).select("screenshot");
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
    console.error("Error serving screenshot:", err);
    res.status(500).send("Internal Server Error");
  }
};
