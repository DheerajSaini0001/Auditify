import mongoose from "mongoose";

/**
 * One row per person who asked us to email them an audit report.
 *
 * This is a SALES record, not an analytics row. A signed-out visitor who reads a
 * report and hands over a real name and address to get the PDF is the strongest
 * lead this product produces, and the questions asked of it are sales questions —
 * "who asked for a report this week", "has this address come back", "what was
 * their site scoring". ActivityLog already records that a download happened, but
 * it is append-only event exhaust: it answers "what occurred", keyed by action and
 * session, and it is filtered and paged as a firehose. Leads need their own
 * collection so they can be listed, deduped by address and exported on their own.
 *
 * `delivered` is stored rather than assumed: SMTP fails, and a lead whose report
 * never arrived is a lead to follow up by hand, not a silent loss.
 */
const ReportLeadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },

    // What they asked for.
    reportId: { type: mongoose.Schema.Types.ObjectId, ref: "SingleAuditReport", required: true },
    url: { type: String, required: true },
    domain: { type: String, default: null },
    score: { type: Number, default: null },
    grade: { type: String, default: null },
    reportType: { type: String, default: null },   // "All" or the section subset
    auditDevice: { type: String, default: null },  // the audit's Desktop/Mobile profile

    // Who asked. Normally null — this flow exists for signed-out visitors — but a
    // signed-in user can still route a report to a colleague, and that is a lead too.
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    sessionId: { type: String, default: null },

    // Where from. Same shape as ActivityLog so the two can be read side by side.
    ip: { type: String, default: "unknown" },
    country: { type: String, default: "unknown" },
    region: { type: String, default: "unknown" },
    city: { type: String, default: "unknown" },
    visitorDevice: { type: String, default: "unknown" },
    browser: { type: String, default: "unknown" },
    os: { type: String, default: "unknown" },
    userAgent: { type: String, default: null },
    referrer: { type: String, default: null },

    // Did the PDF actually land?
    delivered: { type: Boolean, default: false },
    deliveredAt: { type: Date, default: null },
    deliveryError: { type: String, default: null },

    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
);

// "Show me the newest leads" and "has this address been here before" are the two
// reads this collection exists for.
ReportLeadSchema.index({ createdAt: -1 });
ReportLeadSchema.index({ email: 1, createdAt: -1 });
ReportLeadSchema.index({ reportId: 1 });
ReportLeadSchema.index({ delivered: 1, createdAt: -1 });

const ReportLead = mongoose.model("ReportLead", ReportLeadSchema);

export default ReportLead;
