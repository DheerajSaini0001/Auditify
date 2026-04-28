import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
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

import connectDB from "./config/db.js";
import passportConfig from "./config/passport.js";
import trackingMiddleware from "./middleware/tracking.js";
import configService from "./services/configService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const startServer = async () => {
  // ── 1. DB ──
  await connectDB();

  // ── 2. Load Config ──
  await configService.initialize();

  const FRONTEND_URL = configService.getConfig("FRONTEND_URL", "http://localhost:5173");
  const SESSION_SECRET = configService.getConfig("SESSION_SECRET", "secret_2026");
  const PORT = configService.getConfig("PORT", "2000");

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

    noSniff: true,

    crossOriginOpenerPolicy: {
      policy: "same-origin-allow-popups"
    },

    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  }));

  // ── 5. Static Files & Headers ──
  const staticPath = path.join(__dirname, "../Frontend/dist");
  
  app.use(express.static(staticPath, {
    setHeaders: (res, path) => {
      // Security & Performance Headers
      res.setHeader("Link", "<https://fonts.gstatic.com>; rel=preconnect; crossorigin");
      
      // Match user's requirement for immediate expiry (security/freshness)
      const now = new Date().toUTCString();
      res.setHeader("Date", now);
      res.setHeader("Expires", now);
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      
      // Ensure CSS has correct content type
      if (path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css; charset=utf-8");
      }
    }
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
      secure: false, // production me true karna (HTTPS)
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
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin/config", adminConfigRoutes);
  app.use("/api/websites", websiteRoutes);
  app.use("/api/aeo", aeoRoutes);
  app.use("/api/captcha", captchaRoutes);

  app.use("/single-audit", singleAuditRoutes);
  app.use("/bulk-audit", bulkAuditRoutes);
  app.use("/api/ai", aiExplainRoutes);

  // ── 11. Root / Frontend Handler ──
  app.get("*", (req, res) => {
    // If it's an API route that didn't match, let it fall through to error handler or 404
    if (req.path.startsWith("/api") || req.path.startsWith("/single-audit") || req.path.startsWith("/bulk-audit")) {
      return res.status(404).json({ error: "API route not found" });
    }
    
    // Serve the frontend for all other routes (SPA support)
    res.sendFile(path.join(__dirname, "../Frontend/dist/index.html"), (err) => {
      if (err) {
        res.status(500).send("✅ Server running (Frontend build not found)");
      }
    });
  });

  // ── 11. Error Handler ──
  app.use((err, req, res, next) => {
    console.error("[ERROR]:", err);
    res.status(500).json({
      error: "Internal Server Error"
    });
  });

  // ── 12. Start Server ──
  app.listen(parseInt(PORT), () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error("❌ Startup Error:", err);
});