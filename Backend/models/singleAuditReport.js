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
    aeo: { type: Object, default: null },
    isBotProtected: { type: Boolean, default: false },
    error: { type: String, default: null },
    screenshot: { type: String, default: null },
    screenshotUrl: { type: String, default: null },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    createdAt: { type: Date, default: Date.now, expires: 10800 }, 
  }
);

// Partial Unique Index to prevent two concurrent IN-PROGRESS audits for the same
// target BY THE SAME USER (the creation race). Only 'inprogress' is constrained, so:
//   - a 'failed' record never blocks a re-audit
//   - a 'completed' record never blocks a new audit (the controller reuses it via dedup)
//   - different users can audit the same URL simultaneously (userId is part of the key)
SiteReportSchema.index(
  { url: 1, device: 1, report: 1, userId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'inprogress' }
  }
);

const SingleAuditReport = mongoose.model("SingleAuditReport", SiteReportSchema);
export default SingleAuditReport;
