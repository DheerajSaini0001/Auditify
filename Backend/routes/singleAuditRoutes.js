import express from "express";
import { startAudit } from "../controllers/singleAuditController.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const auditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 5, // Max 5 audits per IP per 15 mins
  message: { error: "Too many audit requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/audit", auditLimiter, startAudit);

export default router;
