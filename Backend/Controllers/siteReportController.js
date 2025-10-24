// Controllers/siteReportController.js
import connectDB from "../DB/db.js";
import SiteReport from "../Model/SiteReport.js";
import main from "../Main/main.js";

export const generateAndSaveReport = async (req, res) => {
  try {
    await connectDB();

    const { message } = req.body; 
    console.log(message);
    

    const { Raw_Data } = await main(message);

    // Save to MongoDB
    const newReport = new SiteReport(Raw_Data);
    await newReport.save();

    res.status(201).json({
      success: true,
      message: "✅ Report saved successfully!",
      data: newReport
    });
  } catch (error) {
    console.error("❌ Error saving report:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};
