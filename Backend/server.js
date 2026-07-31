// Load .env BEFORE anything else: ESM hoists and evaluates the whole static import
// graph before the first statement of this file runs, so a `dotenv.config()` call
// placed below the imports executed AFTER modules like utils/browserManager.js had
// already read process.env at module scope — every module-level tunable in .env
// (MAX_CONCURRENT_BROWSERS, MAX_KEY_PAGES, …) was silently ignored. The
// side-effect import form is the one way to guarantee env vars exist first.
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import logger from "./utils/logger.js";
import passport from "passport";

import singleAuditRoutes from "./routes/singleAuditRoutes.js";
import aiExplainRoutes from "./routes/aiExplainRoutes.js";
import websiteRoutes from "./routes/websiteRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminConfigRoutes from "./routes/adminConfigRoutes.js";
import aeoRoutes from "./routes/aeoRoutes.js";
import { captureScreenshot, getScreenshotImage } from "./controllers/singleAuditController.js";
import { tryAuthenticate } from "./middleware/auth.js";

import connectDB from "./config/db.js";
import passportConfig from "./config/passport.js";
import trackingMiddleware from "./middleware/tracking.js";
import { globalLimiter } from "./middleware/rateLimiter.js";
import configService from "./services/configService.js";
import auditStore from "./utils/auditStore.js";
import SingleAuditReport, { REPORT_TTL_SECONDS } from "./models/singleAuditReport.js";

const app = express();
app.set("trust proxy", 1);

const startServer = async () => {
  // ── 1. DB ──
  await connectDB();

  // ── 1b. Index migration ──
  // The report TTL moved from field-level `expires` (3h) to an explicit index with
  // REPORT_TTL_SECONDS (default 24h). Mongo keeps whatever expireAfterSeconds the
  // existing index was created with, so syncIndexes() must drop and recreate it once.
  // Never fatal: on failure the old TTL simply stays in effect until the next boot.
  try {
    await SingleAuditReport.syncIndexes();
    logger.info(`[DB] Report indexes synced — TTL ${REPORT_TTL_SECONDS}s (${(REPORT_TTL_SECONDS / 3600).toFixed(1)}h reuse window)`);
  } catch (err) {
    logger.error("[DB] Report index sync failed (old TTL stays in effect)", err);
  }

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
  // FRONTEND_URL may hold several origins, comma-separated. For each one we also
  // allow its www/apex counterpart: the site answers on BOTH dealersiteaudit.com
  // and www.dealersiteaudit.com with no redirect between them, so pinning the
  // allowlist to whichever form happens to be configured silently breaks every
  // visitor who reaches the other one — the browser blocks the audit call and the
  // UI can only report "Server connection failed. Is the backend running?".
  const originVariants = (raw) => {
    const cleaned = String(raw || "").trim().replace(/\/+$/, "");
    if (!cleaned) return [];
    try {
      const u = new URL(cleaned);
      const bare = u.host.replace(/^www\./i, "");
      return [`${u.protocol}//${bare}`, `${u.protocol}//www.${bare}`];
    } catch {
      return [cleaned]; // not a parseable URL — pass through untouched
    }
  };

  const allowedOrigins = [
    ...new Set([
      ...String(FRONTEND_URL || "").split(",").flatMap(originVariants),
      "http://localhost:5173",
      "http://localhost:3000",
    ]),
  ].filter(Boolean);

  logger.info(`[CORS] Allowed origins: ${allowedOrigins.join(", ")}`);

  app.use(cors({
    origin: allowedOrigins,
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
  // [FIX] Sessions live in Mongo, not in process memory. The default MemoryStore kept
  // every session in one process's RAM, so an App Service restart / recycle / scale-out
  // silently wiped every pending CAPTCHA — the user got "CAPTCHA session expired" through
  // no fault of their own, and express-session itself warns MemoryStore is not for
  // production (it also leaks). Reuses the mongoose connection opened by connectDB()
  // above rather than dialing a second pool.
  app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      client: mongoose.connection.getClient(),
      collectionName: "sessions",
      // Mongo drops the document itself once the session's own maxAge elapses.
      ttl: 24 * 60 * 60,
      // Don't rewrite the doc on every single request — only once per 24h of activity.
      touchAfter: 24 * 3600,
    }),
    cookie: {
      secure: IS_PROD, // HTTPS-only in production
      httpOnly: true,
      // [FIX] In production the frontend (dealersiteaudit.com) and this API
      // (…azurewebsites.net) are different SITES, so "lax" meant the browser never
      // attached connect.sid to a cross-site fetch — every request landed on a brand-new
      // empty session and the CAPTCHA lookup always missed. "none" is what allows a
      // cross-site XHR to carry the cookie, and it is only valid alongside Secure (which
      // IS_PROD already sets). Dev stays on "lax" because localhost is plain http, where
      // Secure — and therefore "none" — would be rejected by the browser.
      sameSite: IS_PROD ? "none" : "lax",
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
  app.post("/api/screenshot", tryAuthenticate, captureScreenshot);
  app.get("/api/screenshot/view/:auditId", getScreenshotImage);

  app.use("/single-audit", singleAuditRoutes);
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

// ── Main-process crash safety net ──
// singleAuditWorker.js (the worker_threads path) already has this exact
// handler — mirrored here because site-type detection (discoveryController.js
// / singleAuditController.js's fallback path) calls the SAME shared Playwright
// browser pool (puppeteer_cheerio.js) directly on the MAIN process, not inside
// a worker. Without this, a late/background CDP session error firing after a
// page or context has already closed (confirmed under concurrent load — see
// getSharedBrowser's activeContexts gating) would crash the entire server,
// taking down every in-flight request, not just one audit. Detached-frame /
// closed-session errors are expected during page teardown and are silently
// suppressed; anything else is logged so it isn't silently lost.
function handleProcessSafetyError(error) {
  const msg = error?.message || (typeof error === "string" ? error : "");
  const lmsg = msg.toLowerCase();
  const isPageTeardownError =
    lmsg.includes("detached") ||
    lmsg.includes("session closed") ||
    lmsg.includes("target closed") ||
    lmsg.includes("context was destroyed") ||
    lmsg.includes("frame is not ready") ||
    lmsg.includes("cdpsession") ||
    !error;
  if (!isPageTeardownError) {
    logger.warn("[Server] Uncaught safety exception/promise rejection (non-fatal):", error);
  }
}
process.on("unhandledRejection", handleProcessSafetyError);
process.on("uncaughtException", handleProcessSafetyError);

startServer().catch(err => {
  logger.error("❌ Startup Error", err);
});