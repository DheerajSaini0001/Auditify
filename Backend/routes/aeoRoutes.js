import express from "express";
import rateLimit from "express-rate-limit";
import { analyzeAEO, getAEOReport, batchAEO, streamAEO } from "../controllers/aeoController.js";
import { tryAuthenticate } from "../middleware/auth.js";

const router = express.Router();

// Bound abuse: these endpoints drive a headless browser and/or read reports.
// tryAuthenticate populates req.user when a token is present so the per-report
// ownership checks in the controller actually apply.
const aeoLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: { error: "Too many AEO requests, please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(aeoLimiter);
router.use(tryAuthenticate);

router.post("/analyze", analyzeAEO);
router.post("/stream", streamAEO);
router.get("/report/:id", getAEOReport);
router.post("/batch", batchAEO);

export default router;
