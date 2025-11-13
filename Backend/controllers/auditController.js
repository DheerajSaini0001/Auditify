import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import SiteReport from "../models/SiteReport.js";

export const startAudit = async (req, res) => {
  try {
    let { Site, Device, Report } = req.body;

    if (!Site || !Device || !Report) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    Site = Site.trim().toLowerCase();
    if (!/^https?:\/\//i.test(Site)) {
      Site = "https://" + Site;
    }

    console.log(`➡️ New Audit Request → ${Site} | ${Device} | ${Report}`);

    const existing = await SiteReport.findOne({ Site, Device, Report }).sort({ createdAt: -1 });

    if (existing && existing.Status === "completed") {
      const diff = (Date.now() - new Date(existing.createdAt)) / (1000 * 60);

      if (diff < 10) {                          // Set 10 Minutes
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

    worker.on("message", () => {
      console.log("✅ Audit Completed");
    });

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
