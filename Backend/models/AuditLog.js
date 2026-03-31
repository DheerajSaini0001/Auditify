import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    sessionId: {
      type: String,
      required: true,
    },
    ip: {
      type: String,
      default: "unknown",
    },
    country: {
      type: String,
      default: "unknown",
    },
    region: {
      type: String,
      default: "unknown", // State / Province
    },
    city: {
      type: String,
      default: "unknown",
    },
    device: {
      type: String,
      default: "unknown",
    },
    browser: {
      type: String,
      default: "unknown",
    },
    os: {
      type: String,
      default: "unknown",
    },
    screenResolution: {
      type: String,
      default: "unknown",
    },
    url: {
      type: String,
      required: true,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SingleAuditReport",
      default: null,
    },
    reportType: {
      type: String,
      default: "All",
    },
    score: {
      type: Number,
      default: null,
    },
    grade: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["success", "failed", "pending"],
      default: "pending",
    },
    auditDuration: {
      type: Number,
      default: null, // in milliseconds
    },
    referrer: {
      type: String,
      default: "direct",
    },
    entryPage: {
      type: String,
      default: "/",
    },
    exitPage: {
      type: String,
      default: null,
    },
    actions: {
      type: [String],
      default: [],
    },
    captchaPassed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Indexes for efficient querying
auditLogSchema.index({ ip: 1 });
auditLogSchema.index({ sessionId: 1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
