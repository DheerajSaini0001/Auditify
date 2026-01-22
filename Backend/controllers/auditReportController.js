import SingleAuditReport from "../models/singleAuditReport.js";
import BulkAuditReport from "../models/bulkAuditReport.js";

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

export const getBulkAuditStatus = async (req, res) => {
  try {
    const { bulkAuditId } = req.params;

    const bulkAudit = await BulkAuditReport.findById(bulkAuditId);

    if (!bulkAudit) {
      return res.status(404).json({ error: "Bulk audit not found" });
    }

    res.status(200).json(bulkAudit);

  } catch (error) {
    console.error("Error fetching bulk audit status:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
