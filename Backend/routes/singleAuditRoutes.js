import express from "express";
import { startAudit, getReportById } from "../controllers/singleAuditController.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const auditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 500000, // Max 5 audits per IP per 15 mins
  message: { error: "Too many audit requests, Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Start Audit
router.post("/audit", auditLimiter, startAudit);

// Get Single Audit Status
router.get("/:singleAuditId", getReportById);

export default router;
