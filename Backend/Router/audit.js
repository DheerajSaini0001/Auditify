import express from "express";
import SiteReport from "../Model/SiteReport.js";
import { Worker } from 'worker_threads';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

router.post("/site", async (req, res) => {
  try {
    // 1. Router file 'req.body' se data leti hai
    let { Site, Device, Report } = req.body;

    if (!Site || !Device || !Report) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    Site = Site.trim();
    if (!/^https?:\/\//i.test(Site)) {
      Site = "https://" + Site;
    }

    console.log(`URL Received: ${Site}, Device: ${Device}, Report: ${Report}`);

    const existingData = await SiteReport.findOne({ Site: Site, Report: Report, Device: Device });
    if (existingData) {
      console.log("✅ Data already exists in DB");
      return res.status(200).json(existingData);
    }

    const newReport = new SiteReport({
      Site: Site,
      Report: Report,
      Device: Device,
      Status: "inprogress",
    });
    await newReport.save();
    const auditId = newReport._id;

    // 2. Client ko turant response bhej do
    res.status(201).json(newReport); 
    console.log("✅ Client ko 'inprogress' response bhej diya.");

    // 3. Worker ko data bhejo (yahaan 'workerData' define hota hai)
    const workerData = {
      Site: Site,
      Device: Device,
      Report: Report,
      auditId: auditId.toString()
    };

    const workerPath = join(__dirname, '../Calculation/auditWorker.js');
    const worker = new Worker(workerPath, { workerData });

    console.log(`MAIN THREAD: Worker ko kaam de diya [${auditId}]`);

    // 4. Worker ke events ko handle karo
    worker.on('error', (error) => {
      console.error(`MAIN THREAD: Worker [${auditId}] error:`, error);
      SiteReport.findByIdAndUpdate(auditId, { Status: 'failed' }).catch(err => console.error("DB update failed:", err));
    });
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`MAIN THREAD: Worker [${auditId}] exit code ${code}`);
      } else {
        console.log(`MAIN THREAD: Worker [${auditId}] done his work.`);
      }
    });

  } catch (error) {
    console.error("❌ Error in audit route:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Internal Server Error", details: error.message });
    }
  }
});

// 5. File ke end mein 'export default router' hona chahiye
export default router;