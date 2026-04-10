import express from "express";
import { discoverUrls, auditSelectedUrls, getBulkAuditStatus, discoverAndAuditUrls, getBulkPageReport } from "../controllers/bulkAuditController.js";
import rateLimit from "express-rate-limit";
import { tryAuthenticate } from "../middleware/auth.js";
import captchaValidator from "../middleware/captchaValidator.js";

const router = express.Router();

const auditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 5, // Max 5 audits per IP per 15 mins
  message: { error: "Too many audit requests, Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Discover all URLs from a website
router.post("/discover", tryAuthenticate, captchaValidator, discoverUrls);

// Start audit for selected URLs
router.post("/audit", auditLimiter, tryAuthenticate, captchaValidator, auditSelectedUrls);

// Get Bulk Page Report
router.get("/:bulkAuditId/page", getBulkPageReport);

// Get Bulk Audit Status
router.get("/:bulkAuditId", getBulkAuditStatus);

// Discover and Start Audit combined (Auto flow)
router.post("/auto-audit", tryAuthenticate, captchaValidator, discoverAndAuditUrls);

export default router;
