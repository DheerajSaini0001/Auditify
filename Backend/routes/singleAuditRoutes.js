import express from "express";
import { startAudit, getReportById } from "../controllers/singleAuditController.js";
import { generatePDFReport } from "../controllers/pdfController.js";
import rateLimit from "express-rate-limit";
import captchaValidator from "../middleware/captchaValidator.js";
import { verifyToken, tryAuthenticate } from "../middleware/auth.js";

const router = express.Router();

const auditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 500000, // Max 5 audits per IP per 15 mins
  message: { error: "Too many audit requests, Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Start Audit
router.post("/audit", auditLimiter, tryAuthenticate, captchaValidator, startAudit);

// Export PDF
router.get("/:id/export/pdf", verifyToken, generatePDFReport);

// Get Single Audit Status
router.get("/:singleAuditId", getReportById);

export default router;
