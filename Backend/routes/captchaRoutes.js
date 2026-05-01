import express from "express";
import { generateCaptcha, verifyCaptcha } from "../controllers/captchaController.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const captchaLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/generate", captchaLimiter, generateCaptcha);
router.post("/verify", captchaLimiter, verifyCaptcha);

export default router;
