import SiteReport from "../models/SiteReport.js";

export const getReportById = async (req, res) => {
  try {
    const report = await SiteReport.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }
    res.status(200).json(report);
  } catch (error) {
    console.error("Error fetching report:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
