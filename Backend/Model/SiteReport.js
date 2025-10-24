import mongoose from "mongoose";

const SiteReportSchema = new mongoose.Schema(
  {
    createdAt: { type: Date, default: Date.now ,expires: 20 },
  },
  { strict: false } // allows any extra fields
);

const SiteReport = mongoose.model("SiteReport", SiteReportSchema);
export default SiteReport;
