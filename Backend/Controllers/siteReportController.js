// Controllers/siteReportController.js
import connectDB from "../DB/db.js";
import SiteReport from "../Model/SiteReport.js";

export const generateAndSaveReport = async (req, res) => {
  try {
    await connectDB();
    
    const newData = new SiteReport(req.body);
    const saved = await newData.save();

    res.status(201).json({
      success: true,
      message: "✅ Report saved successfully!",
      data: saved
    });
  } catch (error) {
    console.error("❌ Error saving report:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
