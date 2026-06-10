import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import logger from "./utils/logger.js";
import passport from "passport";

import singleAuditRoutes from "./routes/singleAuditRoutes.js";
import bulkAuditRoutes from "./routes/bulkAuditRoutes.js";
import aiExplainRoutes from "./routes/aiExplainRoutes.js";
import websiteRoutes from "./routes/websiteRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminConfigRoutes from "./routes/adminConfigRoutes.js";
import aeoRoutes from "./routes/aeoRoutes.js";
import captchaRoutes from "./routes/captchaRoutes.js";
import { captureScreenshot, getScreenshotImage } from "./controllers/singleAuditController.js";
import { tryAuthenticate } from "./middleware/auth.js";

import connectDB from "./config/db.js";
import passportConfig from "./config/passport.js";
import trackingMiddleware from "./middleware/tracking.js";
import { globalLimiter } from "./middleware/rateLimiter.js";
import configService from "./services/configService.js";
import auditStore from "./utils/auditStore.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const startServer = async () => {
  // ── 1. DB ──
  await connectDB();

  // ── 2. Load Config ──
  await configService.initialize();

  const FRONTEND_URL = configService.getConfig("FRONTEND_URL", "http://localhost:5173");
  const SESSION_SECRET = configService.getConfig("SESSION_SECRET");
  const PORT = configService.getConfig("PORT", "2000");
  const IS_PROD = process.env.NODE_ENV === "production";

  // Refuse to start with a missing/guessable session secret (was hardcoded "secret_2026").
  if (!SESSION_SECRET || SESSION_SECRET.length < 16) {
    throw new Error("SESSION_SECRET must be set to a strong value (>= 16 chars).");
  }

  // ── 3. CORS ──
  app.use(cors({
    origin: [
      FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:3000"
    ].filter(Boolean),
    credentials: true
  }));

  // ── 4. SECURITY (Helmet - single place) ──
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://static.cloudflareinsights.com",
          "https://accounts.google.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https://*.googleusercontent.com",
          "https://www.gstatic.com"
        ],
        connectSrc: [
          "'self'",
          "https://*.googleapis.com",
          "http://localhost:2000",
          "ws://localhost:2000"
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      }
    },

    frameguard: {
      action: "deny"
    },

    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },

    noSniff: true
  }));

  // ── 5. Parsers ──
  app.use(express.json({ limit: "5mb" }));
  app.use(cookieParser());

  // ── 6. Tracking ──
  app.use(trackingMiddleware);

  // ── 7. Session ──
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: IS_PROD, // HTTPS-only in production
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  // ── 8. Passport ──
  passportConfig(passport);
  app.use(passport.initialize());
  app.use(passport.session());

  // ── 8b. Global IP-based rate limit (backstop for state-changing requests) ──
  app.use(globalLimiter);

  // ── 9. Routes ──
  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin/config", adminConfigRoutes);
  app.use("/api/websites", websiteRoutes);
  app.use("/api/aeo", aeoRoutes);
  app.use("/api/captcha", captchaRoutes);
  app.post("/api/screenshot", tryAuthenticate, captureScreenshot);
  app.get("/api/screenshot/view/:auditId", getScreenshotImage);

  app.use("/single-audit", singleAuditRoutes);
  app.use("/bulk-audit", bulkAuditRoutes);
  app.use("/api/ai", aiExplainRoutes);

  // ── 10. Health ──
  app.get("/", (req, res) => {
    res.send("✅ Server running...");
  });

  // ── 11. Error Handler ──
  app.use((err, req, res, next) => {
    logger.error(`${req.method} ${req.originalUrl} — Unhandled Error`, err);
    res.status(500).json({
      error: "Internal Server Error"
    });
  });

  // ── 12. Start Server ──
  app.listen(parseInt(PORT), () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
  });
};

// ── Graceful shutdown ──
// Completed audits are buffered in memory and written to Mongo in batches. On a
// graceful stop, flush whatever is still buffered so finished work isn't lost.
let shuttingDown = false;
const gracefulShutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`⏳ ${signal} received — flushing buffered audit reports...`);
  try {
    await auditStore.flushAll();
  } catch (err) {
    logger.error("Error flushing audit store on shutdown", err);
  }
  process.exit(0);
};
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

startServer().catch(err => {
  logger.error("❌ Startup Error", err);
});