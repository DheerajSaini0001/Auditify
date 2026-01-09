import mongoose from "mongoose";

const SiteReportSchema = new mongoose.Schema(
  {
    Site: { type: String, required: true },
    Report: { type: String, required: true },
    Device: { type: String, required: true },
    Status: { type: String, default: 'inprogress' },
    Schema: { type: Array, default: null },
    Time_Taken: { type: String, default: null },
    Score: { type: Number, default: null },
    Grade: { type: String, default: null },
    AIO_Compatibility_Badge: { type: String, default: null },
    Section_Score: { type: Array, default: null },
    Technical_Performance: { type: Object, default: null },
    On_Page_SEO: { type: Object, default: null },
    Accessibility: { type: Object, default: null },
    Security_or_Compliance: { type: Object, default: null },
    UX_or_Content_Structure: { type: Object, default: null },
    Conversion_and_Lead_Flow: { type: Object, default: null },
    AIO_Readiness: { type: Object, default: null },
    Screenshot: { type: String, default: null },
    createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 1 }, // 1 hour expiry
  }
);

const SiteReport = mongoose.model("SiteReport", SiteReportSchema);
export default SiteReport;
