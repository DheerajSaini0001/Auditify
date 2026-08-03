import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";
import passport from "passport";
import swaggerUi from "swagger-ui-express";
import logger from "./utils/logger.js";

import singleAuditRoutes from "./routes/singleAuditRoutes.js";
import aiExplainRoutes from "./routes/aiExplainRoutes.js";
import websiteRoutes from "./routes/websiteRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminConfigRoutes from "./routes/adminConfigRoutes.js";
import aeoRoutes from "./routes/aeoRoutes.js";
import healthRoutes from "./modules/health/health.routes.js";
import seoRoutes from "./modules/seo/seo.routes.js";

import { buildSwaggerSpec } from "./config/swagger.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";
import { captureScreenshot, getScreenshotImage } from "./controllers/singleAuditController.js";
import { tryAuthenticate } from "./middleware/auth.js";
import passportConfig from "./config/passport.js";
import trackingMiddleware from "./middleware/tracking.js";
import { globalLimiter } from "./middleware/rateLimiter.js";

/**
 * Builds the Express application: middleware, routes, error handling (doc §3).
 *
 * Deliberately knows nothing about ports, databases or process signals — those are
 * server.js's job. The split is what lets a test import the app and drive it with
 * supertest without binding a port or connecting to Mongo, and it is why config
 * arrives as an argument rather than being read from configService in here.
 */
export const createApp = ({ FRONTEND_URL, SESSION_SECRET, IS_PROD }) => {
  const app = express();

  // Behind Azure App Service / Cloudflare, so the client IP the rate limiter and
  // session cookies rely on comes from X-Forwarded-For, not the socket.
  app.set("trust proxy", 1);

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

  // ── 4b. Compression ──
  // A finished report is one large JSON doc (8 pillar objects, ~150 params);
  // gzip cuts those responses 5-10x. compression() only compresses compressible
  // content-types, so the base64/binary screenshot route is left alone.
  app.use(compression());

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
  //
  // Versioned surface (architecture doc §10). New modules mount ONLY here and answer
  // in the standard { success, message, data } shape. The unversioned mounts below
  // are the legacy surface the current client still calls; they stay until each is
  // migrated, because renaming them in one go would break a deployed frontend.
  app.use("/api/v1", healthRoutes);
  app.use("/api/v1/seo", seoRoutes);

  // Interactive API docs, generated from the @openapi blocks on the route files.
  const swaggerSpec = buildSwaggerSpec();
  // Raw spec too, so the docs can be diffed/linted in CI rather than only eyeballed.
  app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Site Audit API",
  }));

  // ── 9b. Legacy unversioned routes ──
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
  // One central handler (architecture doc §4/§7): every next(err) resolves here and
  // leaves in the standard { success, message, errors } shape. An operational error
  // keeps its own message and status; anything else is logged in full and answered
  // generically so an internal detail never reaches a client.
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

export default createApp;
