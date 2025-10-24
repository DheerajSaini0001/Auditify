// controllers/siteReportController.js
import SiteReport from "../Model/SiteReport.js";

// POST /api/sitereports
export const saveSiteReport = async (req, res) => {
  try {
    const metricesData = req.body; // frontend se aayega JSON data

    const siteReport = new SiteReport(metricesData);
    await siteReport.save();

    res.status(201).json({ success: true, message: "Site report saved successfully", data: siteReport });
  } catch (error) {
    console.error("Error saving site report:", error);
    res.status(500).json({ success: false, message: "Failed to save site report", error: error.message });
  }
};
