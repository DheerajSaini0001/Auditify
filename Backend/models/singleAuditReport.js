import mongoose from "mongoose";

const SiteReportSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    report: { type: String, required: true },
    device: { type: String, required: true },
    status: { type: String, default: 'inprogress' },
    siteSchema: { type: Array, default: null },
    timeTaken: { type: String, default: null },
    score: { type: Number, default: null },
    grade: { type: String, default: null },
    aioCompatibilityBadge: { type: String, default: null },
    sectionScore: { type: Array, default: null },
    technicalPerformance: { type: Object, default: null },
    onPageSEO: { type: Object, default: null },
    accessibility: { type: Object, default: null },
    securityOrCompliance: { type: Object, default: null },
    UXOrContentStructure: { type: Object, default: null },
    conversionAndLeadFlow: { type: Object, default: null },
    aioReadiness: { type: Object, default: null },
    error: { type: String, default: null },
    screenshot: { type: String, default: null },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 1 }, // 1 hour expiry
  }
);

const SingleAuditReport = mongoose.model("SingleAuditReport", SiteReportSchema);
export default SingleAuditReport;
