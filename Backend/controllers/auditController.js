import { Worker } from "worker_threads";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import SiteReport from "../models/SiteReport.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const startAudit = async (req, res) => {
  try {
    let { Site, Device, Report } = req.body;

    // 1️⃣ Validate required fields
    if (!Site || !Device || !Report) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 2️⃣ Normalize URL
    Site = Site.trim();
    if (!/^https?:\/\//i.test(Site)) {
      Site = "https://" + Site;
    }

    console.log(`URL Received: ${Site}, Device: ${Device}, Report: ${Report}`);

    // 3️⃣ Check if existing report exists in DB
    const existing = await SiteReport.findOne({ Site, Device, Report });
    if (existing && existing.Status === "completed") {
      console.log("✅ Existing completed report found — returning cached version");
      return res.status(200).json(existing);
    }

    // 4️⃣ Create new "inprogress" report
    const newReport = new SiteReport({
      Site,
      Device,
      Report,
      Status: "inprogress",
    });
    await newReport.save();

    console.log(`🆕 Created new report in DB (Status: inprogress): ${newReport._id}`);

    // 5️⃣ Send immediate response to frontend
    res.status(201).json({
      message: "Audit started successfully",
      auditId: newReport._id,
      Site,
      Device,
      Report,
      Status: "inprogress",
    });

    // 6️⃣ Launch worker thread
    const workerData = {
      Site,
      Device,
      Report,
      auditId: newReport._id.toString(),
    };

    const workerPath = join(__dirname, "../workers/auditWorker.js");
    const worker = new Worker(workerPath, { workerData });

    console.log(`🧩 Worker launched for auditId: ${newReport._id}`);

    // 7️⃣ Worker event listeners
    worker.on("message", async (msg) => {
      if (msg.error) {
        console.error(`❌ Worker failed: ${msg.error}`);
        await SiteReport.findByIdAndUpdate(newReport._id, { Status: "failed" });
      } else {
        console.log(`✅ Worker completed for auditId: ${newReport._id}`);
        await SiteReport.findByIdAndUpdate(newReport._id, { Status: "completed" });
      }
    });

    worker.on("error", async (error) => {
      console.error(`❌ Worker crashed for [${newReport._id}]:`, error);
      await SiteReport.findByIdAndUpdate(newReport._id, { Status: "failed" });
    });

    worker.on("exit", (code) => {
      if (code !== 0) {
        console.warn(`⚠️ Worker exited with code ${code} for [${newReport._id}]`);
      } else {
        console.log(`🧠 Worker finished cleanly for [${newReport._id}]`);
      }
    });
  } catch (error) {
    console.error("❌ Error in startAudit:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  }
};
