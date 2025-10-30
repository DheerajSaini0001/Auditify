import express from "express";
import MetricesCalculation from "../Calculation/MetricesCalculation.js";
import SiteReport from "../Model/SiteReport.js";

const router = express.Router();

router.post("/site", async (req, res) => {
  try {
    let { Site, Device, Report } = req.body;

    if (!Site || !Device || !Report) {
      return res.status(400).json({ error: "Missing required fields: url, device, or report" });
    }

    // Ensure URL format
    Site = Site.trim();
    if (!/^https?:\/\//i.test(Site)) {
      Site = "https://" + Site;
    }

    console.log(`URL Received: ${Site}, Device: ${Device}, Report: ${Report}`);

    // 🔍 Check if already exists in DB
    const existingData = await SiteReport.findOne({ Site: Site, Report: Report, Device: Device });
    if (existingData) {
      console.log("✅ Data already exists in DB");
      return res.status(200).json(existingData);
    }

    // 🆕 Create new record (in progress)
    const newReport = new SiteReport({
      Site: Site,
      Report: Report,
      Device: Device,
      Status: "inprogress",
    });
    await newReport.save();

    const auditId = newReport._id;
    res.status(201).json(newReport); 

    await MetricesCalculation(Site, Device, Report, auditId);

    console.log("✅ Audit Completed & Data Updated to MongoDB");
  } catch (error) {
    console.error("❌ Error in audit route:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

export default router;
