// Model/SiteReport.js
import mongoose from "mongoose";

const SiteReportSchema = new mongoose.Schema({
  url: { type: String }, // 🔥 required: true hata do
  device: { type: String },
  timeTaken: { type: Number },
  Technical_Performance: { type: Object },
  On_Page_SEO: { type: Object },
  Accessibility: { type: Object },
  Security: { type: Object },
  UX: { type: Object },
  Conversion: { type: Object },
  AIO: { type: Object },
  Overall_Score: { type: Object },
  createdAt: { type: Date, default: Date.now },
});

const SiteReport = mongoose.model("SiteReport", SiteReportSchema);
export default SiteReport;
