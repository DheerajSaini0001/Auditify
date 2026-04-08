import mongoose from "mongoose";

const PageAuditSchema = new mongoose.Schema({
    url: { type: String, required: true },
    report: { type: String, required: true },
    device: { type: String, required: true },
    status: { type: String, default: 'pending' }, // pending, inprogress, completed, failed
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
    completedAt: { type: Date, default: null },
});

const BulkAuditSchema = new mongoose.Schema(
    {
        site: { type: String, required: true },
        device: { type: String, required: true },
        report: { type: String, required: true },
        status: { type: String, default: 'discovering' }, // discovering, inprogress, completed, failed
        totalPages: { type: Number, default: 0 },
        completedPages: { type: Number, default: 0 },
        failedPages: { type: Number, default: 0 },
        pages: [PageAuditSchema],
        startedAt: { type: Date, default: Date.now },
        completedAt: { type: Date, default: null },
        createdAt: { type: Date, default: Date.now, expires: 10800 }, // 3 hours expiry
    }
);

const BulkAuditReport = mongoose.model("BulkAuditReport", BulkAuditSchema);
export default BulkAuditReport;
