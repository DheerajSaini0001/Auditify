import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import SiteReport from "../models/SiteReport.js";

export const startAudit = async (req, res) => {
  // Helper to validate URL and prevent SSRF
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
    let { Site, Device, Report } = req.body;

    if (!Site || !Device || !Report) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    Site = Site.trim().toLowerCase();
    if (!/^https?:\/\//i.test(Site)) {
      Site = "https://" + Site;
    }

    if (!isValidUrl(Site)) {
      return res.status(400).json({ error: "Invalid or Restricted URL" });
    }

    console.log(`➡️ New Audit Request → ${Site} | ${Device} | ${Report}`);

    const existing = await SiteReport.findOne({ Site, Device, Report }).sort({ createdAt: -1 });

    // if (existing && existing.Status === "completed") {
    if (existing && existing.Status !== "failed") {
      const diff = (Date.now() - new Date(existing.createdAt)) / (1000 * 60);

      if (diff < 60) {                          // Set 60 Minutes
        console.log("✅ Already in DB");
        return res.status(200).json(existing);
      }
    }

    const newReport = await SiteReport.create({
      Site,
      Device,
      Report,
      Status: "inprogress",
    });

    res.status(201).json({
      message: "Audit started successfully",
      auditId: newReport._id,
      Site,
      Device,
      Report,
      Status: "inprogress",
    });

    const workerPath = join(process.cwd(), "workers", "auditWorker.js");

    const worker = new Worker(workerPath, {
      workerData: {
        Site,
        Device,
        Report,
        auditId: newReport._id.toString(),
      },
    });

    worker.on("message", async (msg) => {
      if (msg?.error) {
        console.log("❌ Audit Failed");

        await SiteReport.findByIdAndUpdate(newReport._id, {
          Status: "failed",
          Error_Message: msg.error,
        });

        return;
      }

      console.log("✅ Audit Completed Successfully");
    })

    worker.on("error", async () => {
      await SiteReport.findByIdAndUpdate(newReport._id, { Status: "failed" });
      console.log("❌ Audit Failed");
    });

  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};
