import express from "express";
import { startAudit, getReportById, getReportStatusById, mergeReports } from "../controllers/singleAuditController.js";
import { discover } from "../controllers/discoveryController.js";
import { requestAuditOTP, verifyAuditOTP } from "../controllers/guestAuditController.js";
import { generatePDFReport } from "../controllers/pdfController.js";
import rateLimit from "express-rate-limit";
import guestAuditGate from "../middleware/auditGate.js";
import { tryAuthenticate } from "../middleware/auth.js";
import { auditOtpRequestLimiter, otpLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

const auditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 20, // Each audit spawns a Chromium worker — keep this bounded to prevent DoS.
  message: { error: "Too many audit requests, Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Discovery is lighter than a full audit (no Chromium worker on the happy path),
// but still fans out HTTP requests — bound it on its own counter so it can't be
// abused and so it never starves the audit limiter.
const discoverLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 40,
  message: { error: "Too many discovery requests, Please wait 15 minutes." },
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

// Discover the dealer's main pages (sitemap → robots.txt → crawl). Same gate as
// /audit, so guests reuse the email-verification grant they already hold.
router.post("/discover", discoverLimiter, tryAuthenticate, guestAuditGate, discover);

// Start Audit — logged-in users pass; guests must present a verified-email grant.
router.post("/audit", auditLimiter, tryAuthenticate, guestAuditGate, startAudit);

// Merge several sample reports (e.g. the 5 VDP samples) into ONE averaged report.
// Same gate as /audit so guests reuse their email-verification grant.
router.post("/merge", auditLimiter, tryAuthenticate, guestAuditGate, mergeReports);

// Export PDF — guests may export their own report (the controller scopes access
// by report id when there's no authenticated user); logged-in users are scoped
// to their own reports as before.
router.get("/:id/export/pdf", tryAuthenticate, generatePDFReport);

// Get Single Audit Status
router.get("/:singleAuditId/status", tryAuthenticate, getReportStatusById);

// Get Single Audit Details
router.get("/:singleAuditId", tryAuthenticate, getReportById);

export default router;
