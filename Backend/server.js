import express from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import crypto from "crypto";
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
import configService from "./services/configService.js";
import SingleAuditReport from "./models/singleAuditReport.js";

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const startServer = async () => {
  // ── 1. DB ──
  await connectDB();

  // ── 2. Load Config ──
  await configService.initialize();

  // ── 2b. Reconcile audit indexes ──
  // Drops stale/incompatible indexes (e.g. the old non-partial url_1_device_1_report_1
  // unique index) and builds the correct partial index from the schema. Without this,
  // Mongoose's autoIndex silently keeps the old index because the key matches.
  try {
    await SingleAuditReport.syncIndexes();
    logger.info("✅ SingleAuditReport indexes reconciled");
  } catch (e) {
    logger.warn("⚠️  SingleAuditReport index sync failed: " + e.message);
  }

  const FRONTEND_URL = configService.getConfig("FRONTEND_URL", "http://localhost:5173");
  const PORT = configService.getConfig("PORT", "2000");
  const IS_PROD = configService.getConfig("NODE_ENV") === "production";

  // Never fall back to a hardcoded/guessable session secret. If one isn't configured,
  // generate a strong ephemeral secret (sessions reset on restart, but stay unforgeable).
  let SESSION_SECRET = configService.getConfig("SESSION_SECRET");
  if (!SESSION_SECRET) {
    SESSION_SECRET = crypto.randomBytes(32).toString("hex");
    logger.warn("⚠️  SESSION_SECRET not configured — using an ephemeral random secret for this process.");
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
          FRONTEND_URL,
          // Local dev origins only outside production
          ...(IS_PROD ? [] : ["http://localhost:2000", "ws://localhost:2000", "http://localhost:5173"])
        ].filter(Boolean),
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
  app.use(express.json({ limit: "1mb" }));
  app.use(cookieParser());

  // ── 5b. NoSQL-injection guard: strip Mongo operator keys ($, .) from input ──
  const sanitizeMongo = (obj) => {
    if (!obj || typeof obj !== "object") return;
    for (const key of Object.keys(obj)) {
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
        continue;
      }
      const val = obj[key];
      if (val && typeof val === "object") sanitizeMongo(val);
    }
  };
  app.use((req, res, next) => {
    sanitizeMongo(req.body);
    sanitizeMongo(req.query);
    sanitizeMongo(req.params);
    next();
  });

  // ── 6. Tracking ──
  app.use(trackingMiddleware);

  // ── 7. Session ──
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      // 'auto' sets the Secure flag only when the connection is actually HTTPS
      // (honors `trust proxy`). This keeps sessions working over local HTTP dev
      // — even with NODE_ENV=production — while still using Secure cookies behind
      // an HTTPS proxy in real production. A hardcoded `true` breaks HTTP-localhost
      // because browsers refuse to store Secure cookies over HTTP.
      secure: "auto",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    }
  }));

  // ── 8. Passport ──
  passportConfig(passport);
  app.use(passport.initialize());
  app.use(passport.session());

  // ── 9. Routes ──
  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  // Mount the super-admin config router BEFORE the broader admin router so the more
  // specific /api/admin/config path is matched by its isSuperAdmin guard.
  app.use("/api/admin/config", adminConfigRoutes);
  app.use("/api/admin", adminRoutes);
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

startServer().catch(err => {
  logger.error("❌ Startup Error", err);
});