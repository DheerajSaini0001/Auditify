import express from "express";
import { startAudit, getReportById, getReportStatusById } from "../controllers/singleAuditController.js";
import { requestAuditOTP, verifyAuditOTP } from "../controllers/guestAuditController.js";
import { generatePDFReport } from "../controllers/pdfController.js";
import rateLimit from "express-rate-limit";
import guestAuditGate from "../middleware/auditGate.js";
import { verifyToken, tryAuthenticate } from "../middleware/auth.js";
import { auditOtpRequestLimiter, otpLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

const auditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 20, // Each audit spawns a Chromium worker — keep this bounded to prevent DoS.
  message: { error: "Too many audit requests, Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Guest email-verification gate (replaces CAPTCHA for not-logged-in users) ──
// Step 1: send a verification code to the entered email.
router.post("/request-otp", auditOtpRequestLimiter, requestAuditOTP);
// Step 1b: resend the code (same handler; per-email cooldown applies).
router.post("/resend-otp", auditOtpRequestLimiter, requestAuditOTP);
// Step 2: verify the code → returns a short-lived audit grant token.
router.post("/verify-otp", otpLimiter, verifyAuditOTP);

// Start Audit — logged-in users pass; guests must present a verified-email grant.
router.post("/audit", auditLimiter, tryAuthenticate, guestAuditGate, startAudit);

// Export PDF
router.get("/:id/export/pdf", verifyToken, generatePDFReport);

// Get Single Audit Status
router.get("/:singleAuditId/status", tryAuthenticate, getReportStatusById);

// Get Single Audit Details
router.get("/:singleAuditId", tryAuthenticate, getReportById);

export default router;
