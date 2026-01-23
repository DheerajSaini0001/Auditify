import { Worker } from "worker_threads";
import { join } from "path";
import SingleAuditReport from "../models/singleAuditReport.js";

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

    url = url.trim().toLowerCase();
    if (!/^https?:\/\//i.test(url)) {
      url = "https://" + url;
    }

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: "Invalid or Restricted URL" });
    }

    console.log(`➡️ New Audit Request → ${url} | ${device} | ${report}`);

    const existing = await SingleAuditReport.findOne({ url, device, report }).sort({ createdAt: -1 });

    // if (existing && existing.Status === "completed") {
    if (existing && existing.status !== "failed") {
      const diff = (Date.now() - new Date(existing.createdAt)) / (1000 * 60);

      if (diff < 60) {                          // Set 60 Minutes
        console.log("✅ Already in DB");
        return res.status(200).json(existing);
      }
    }

    const newReport = new SingleAuditReport({
      url,
      device,
      report,
      status: "inprogress",
    });
    await newReport.save();

    res.status(201).json({
      message: "Audit started successfully",
      _id: newReport._id,
      url,
      device,
      report,
      Status: "inprogress",
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

        return;
      }

      console.log("✅ Audit Completed Successfully");
    })

    worker.on("error", async () => {
      await SingleAuditReport.findByIdAndUpdate(newReport._id, { status: "failed" });
      console.log("❌ Audit Failed");
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
