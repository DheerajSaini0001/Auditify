import { Worker } from "worker_threads";
import { join } from "path";
import SingleAuditReport from "../models/singleAuditReport.js";
import AuditLog from "../models/AuditLog.js";
import ActivityLog from "../models/ActivityLog.js";

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
    let { url, device, report } = req.body;

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

    console.log(`➡️ New Audit Request → ${url} | ${device} | ${report}`);

    // Strict Deduplication: Check if a successful or in-progress audit already exists
    const existing = await SingleAuditReport.findOne({ 
      url, 
      device, 
      report, 
      status: { $in: ["inprogress", "completed"] } 
    }).sort({ createdAt: -1 });

    if (existing) {
      console.log(`✅ Reusing existing Audit (${existing.status}) for: ${url}`);
      return res.status(200).json(existing);
    }

    // Double-check race condition (buffer for parallel requests)
    await new Promise(resolve => setTimeout(resolve, 200)); 
    const raceCheck = await SingleAuditReport.findOne({ url, device, report, status: "inprogress" });
    if (raceCheck) return res.status(200).json(raceCheck);

    let newReport;
    try {
      newReport = new SingleAuditReport({
        url,
        device,
        report,
        status: "inprogress",
      });
      await newReport.save();
    } catch (dbError) {
      // Handle race condition: If two requests hit exactly at the same time
      if (dbError.code === 11000) {
        console.log(`⚠️ Race condition caught: Audit already exists or is in-progress for: ${url}`);
        const raceCheck = await SingleAuditReport.findOne({ url, device, report, status: { $ne: "failed" } });
        if (raceCheck) return res.send(raceCheck);
      }
      throw dbError; // Otherwise, re-throw server errors
    }

    // Create a pending AuditLog entry asynchronously
    const auditLog = new AuditLog({
      userId: req.user?.userId || null, 
      sessionId: req.tracking?.sessionId || 'N/A',
      ip: req.tracking?.ip || '0.0.0.0',
      country: req.tracking.country,
      city: req.tracking.city,
      device: req.tracking.device,
      browser: req.tracking.browser,
      os: req.tracking.os,
      screenResolution: req.body.screenResolution || req.tracking.screenResolution,
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
        console.log("❌ Audit Failed");

        await SingleAuditReport.findByIdAndUpdate(newReport._id, {
          status: "failed",
          error: msg.error,
        });

        // Update AuditLog entry on message error
        try {
          const duration = Date.now() - startTime;
          await AuditLog.findByIdAndUpdate(auditLog._id, { 
            status: "failed",
            auditDuration: duration,
            $push: { actions: "failed" }
          });
        } catch (err) {
          console.error("Error updating AuditLog on message error:", err);
        }

        return;
      }

      console.log("✅ Audit Completed Successfully");

      const duration = Date.now() - startTime;

      // Update AuditLog entry
      try {
        const finalReport = await SingleAuditReport.findById(newReport._id);
        if (finalReport) {
          await AuditLog.findByIdAndUpdate(auditLog._id, {
            status: "success",
            score: finalReport.score,
            grade: finalReport.grade,
            auditDuration: duration,
            exitPage: "/report",
            $push: { actions: "completed" }
          });
        }
      } catch (err) {
        console.error("Error updating AuditLog on success:", err);
      }
    })

    worker.on("error", async () => {
      const duration = Date.now() - startTime;
      await SingleAuditReport.findByIdAndUpdate(newReport._id, { status: "failed" });
      console.log("❌ Audit Failed");

      // Update AuditLog entry
      try {
        await AuditLog.findByIdAndUpdate(auditLog._id, { 
          status: "failed",
          auditDuration: duration,
          $push: { actions: "failed" }
        });
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
    const report = await SingleAuditReport.findById(req.params.singleAuditId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(200).json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
