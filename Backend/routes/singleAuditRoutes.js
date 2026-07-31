import express from "express";
import { startAudit, getReportById, getReportStatusById, mergeReports, findMergedReport } from "../controllers/singleAuditController.js";
import { discover } from "../controllers/discoveryController.js";
import { generatePDFReport } from "../controllers/pdfController.js";
import rateLimit from "express-rate-limit";
import { tryAuthenticate } from "../middleware/auth.js";
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

// ── No guest verification ──
// Guests once had to clear a gate before auditing: first an emailed OTP, then a
// one-sum captcha. Both are gone — a visitor now goes straight from the URL box
// to a running audit. What still protects this surface is the per-IP report
// budget (5 site runs / 15 min, see middleware/reportBudget.js), which is the
// limit that actually matters given each run costs a headless Chrome session.

// Discover the dealer's main pages (sitemap → robots.txt → crawl).
// Discovery never charges the report budget, but a maxed-out IP is turned away.
router.post("/discover", enforceReportBudget, tryAuthenticate, discover);

// Start Audit — open to everyone.
// The first audit of a site opens a run (1 report); its batch-mates ride free.
router.post("/audit", chargeReportBudget, tryAuthenticate, startAudit);

// Merge several sample reports (e.g. the VDP samples) into ONE averaged report.
router.post("/merge", mergeLimiter, tryAuthenticate, mergeReports);

// Look up an existing merged report for a site + pageType so a repeat audit can
// reuse the VDP/SRP average instead of re-auditing every sample. Cheap read —
// never charges the report budget.
router.post("/find-merged", mergeLimiter, tryAuthenticate, findMergedReport);

// Export PDF — guests may export their own report (the controller scopes access
// by report id when there's no authenticated user); logged-in users are scoped
// to their own reports as before.
router.get("/:id/export/pdf", tryAuthenticate, generatePDFReport);

// Get Single Audit Status
router.get("/:singleAuditId/status", tryAuthenticate, getReportStatusById);

// Get Single Audit Details
router.get("/:singleAuditId", tryAuthenticate, getReportById);

export default router;
