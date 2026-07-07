import express from "express";
import { startAudit, getReportById, getReportStatusById, mergeReports, findMergedReport } from "../controllers/singleAuditController.js";
import { discover } from "../controllers/discoveryController.js";
import { requestAuditOTP, verifyAuditOTP } from "../controllers/guestAuditController.js";
import { generatePDFReport } from "../controllers/pdfController.js";
import rateLimit from "express-rate-limit";
import guestAuditGate from "../middleware/auditGate.js";
import { tryAuthenticate } from "../middleware/auth.js";
import { auditOtpRequestLimiter, otpLimiter } from "../middleware/rateLimiter.js";
import { chargeReportBudget, enforceReportBudget } from "../middleware/reportBudget.js";

const router = express.Router();

// The audit surface is limited in REPORTS, not requests: 5 site audits per IP
// per 15 minutes (see middleware/reportBudget.js). A whole batch — the ~13-15
// parallel page audits one "Run Full Audit" click fires — counts as ONE report,
// and a maxed-out IP is blocked from discovery too.

// Merging sample reports is cheap (no Chromium — read the samples, write one
// averaged doc) and belongs to an already-charged run, so it only gets a plain
// request cap as an abuse backstop.
const mergeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 40,
  message: { error: "Too many merge requests, Please wait 15 minutes." },
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
// Discovery never charges the report budget, but a maxed-out IP is turned away.
router.post("/discover", enforceReportBudget, tryAuthenticate, guestAuditGate, discover);

// Start Audit — logged-in users pass; guests must present a verified-email grant.
// The first audit of a site opens a run (1 report); its batch-mates ride free.
router.post("/audit", chargeReportBudget, tryAuthenticate, guestAuditGate, startAudit);

// Merge several sample reports (e.g. the VDP samples) into ONE averaged report.
// Same gate as /audit so guests reuse their email-verification grant.
router.post("/merge", mergeLimiter, tryAuthenticate, guestAuditGate, mergeReports);

// Look up an existing merged report for a site + pageType so a repeat audit can
// reuse the VDP/SRP average instead of re-auditing every sample. Cheap read —
// same gate as /merge, never charges the report budget.
router.post("/find-merged", mergeLimiter, tryAuthenticate, guestAuditGate, findMergedReport);

// Export PDF — guests may export their own report (the controller scopes access
// by report id when there's no authenticated user); logged-in users are scoped
// to their own reports as before.
router.get("/:id/export/pdf", tryAuthenticate, generatePDFReport);

// Get Single Audit Status
router.get("/:singleAuditId/status", tryAuthenticate, getReportStatusById);

// Get Single Audit Details
router.get("/:singleAuditId", tryAuthenticate, getReportById);

export default router;
