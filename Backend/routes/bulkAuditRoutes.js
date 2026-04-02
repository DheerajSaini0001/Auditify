import express from "express";
import { discoverUrls, auditSelectedUrls, getBulkAuditStatus } from "../controllers/bulkAuditController.js";
import rateLimit from "express-rate-limit";
import { tryAuthenticate } from "../middleware/auth.js";
import verifyRecaptcha from "../middleware/verifyCaptcha.js";

const router = express.Router();

const auditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 5, // Max 5 audits per IP per 15 mins
  message: { error: "Too many audit requests, Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Discover all URLs from a website
router.post("/discover", tryAuthenticate, verifyRecaptcha, discoverUrls);

// Start audit for selected URLs
router.post("/audit", auditLimiter, tryAuthenticate, verifyRecaptcha, auditSelectedUrls);

// Get Bulk Audit Status
router.get("/:bulkAuditId", getBulkAuditStatus);

export default router;
