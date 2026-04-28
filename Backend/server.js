import express from "express";
import cors from "cors";
import helmet from "helmet";
import singleAuditRoutes from "./routes/singleAuditRoutes.js";
import bulkAuditRoutes from "./routes/bulkAuditRoutes.js";
import aiExplainRoutes from "./routes/aiExplainRoutes.js";
import websiteRoutes from "./routes/websiteRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import adminConfigRoutes from "./routes/adminConfigRoutes.js";
import aeoRoutes from "./routes/aeoRoutes.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import trackingMiddleware from "./middleware/tracking.js";
import captchaRoutes from "./routes/captchaRoutes.js";
import passportConfig from "./config/passport.js";
import configService from "./services/configService.js";

dotenv.config();

const app = express();
app.set('trust proxy', 1);

// ── Startup Sequence ────────────────────────────────────────────────
// 1. Connect to MongoDB (needs MONGO_URI from .env)
// 2. Load all AppConfig into in-memory cache (ConfigService)
// 3. Set up ALL middleware using configService.getConfig() 
// 4. Start HTTP server
const startServer = async () => {
  // ── Step 1: Database ──
  await connectDB();

  // ── Step 2: Config Service (loads DB configs → in-memory cache) ──
  await configService.initialize();

  // ── Step 3: Middleware (now safe to use configService) ──

  const FRONTEND_URL = configService.getConfig('FRONTEND_URL', 'http://localhost:5173');
  const SESSION_SECRET = configService.getConfig('SESSION_SECRET', 'dealerpulse_secret_2026');
  const PORT = configService.getConfig('PORT', '2000');

  app.use(cors({
    origin: [
      FRONTEND_URL,
      "http://localhost:5173",
      "http://localhost:3000"
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

  app.use(helmet({
    // A Content Security Policy (CSP) is a set of rules that tells the browser which sources are safe to load content from, stopping unauthorized scripts.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://static.cloudflareinsights.com", "https://accounts.google.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https://*.googleusercontent.com", "https://www.gstatic.com"],
        connectSrc: ["'self'", "https://*.googleapis.com", "http://localhost:2000", "ws://localhost:2000"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    // HSTS is a 'force-secure' command that tells browsers to never use an insecure connection when visiting your website.
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    // The X-Frame-Options setting prevents other websites from 'stealing' your site's appearance to trick users into clicking things they shouldn't.
    frameguard: {
      action: 'deny'
    },
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
    noSniff: true
  }));

  // Passport — now has access to DB configs (GOOGLE_CLIENT_ID, etc.)
  passportConfig(passport);

  app.use(express.json({ limit: "5mb" })); 
  app.use(cookieParser());
  app.use(trackingMiddleware);

  // 4.2.3 Session + Passport Middleware
  app.use(session({
    secret: SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: { 
      secure: false, // Force false for local testing as per NODE_ENV=production issue
      httpOnly: true, 
      sameSite: false,
      maxAge: 24 * 60 * 60 * 1000 
    }
  }));

  app.use((req, res, next) => {
    if (req.url.includes('captcha') || req.url.includes('audit')) {
      const storedCount = req.session?.captchas ? Object.keys(req.session.captchas).length : 0;
      console.log(`[Session Debug] ${req.method} ${req.url} | ID: ${req.sessionID} | ActiveCaptchas: ${storedCount}`);
    }
    next();
  });
  app.use(passport.initialize());
  app.use(passport.session());

  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/admin/config", adminConfigRoutes);
  app.use("/api/websites", websiteRoutes);
  app.use("/api/aeo", aeoRoutes);
  app.use("/api/captcha", captchaRoutes);

  // Existing routes (keeping for backward compatibility)
  app.use("/single-audit", singleAuditRoutes);
  app.use("/bulk-audit", bulkAuditRoutes);
  app.use("/api/ai", aiExplainRoutes);

  app.get("/", (req, res) => {
    res.send("Dealerpulse RBAC Server is running");
  });

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error('[Unhandled Error]:', err);
    res.status(500).json({ 
      error: 'Internal server error', 
      code: 'SERVER_ERROR' 
    });
  });

  // ── Step 4: Start listening ──
  app.listen(parseInt(PORT), () => {
    console.log(`✅ Backend running on http://localhost:${PORT}`);
  });
};

startServer().catch(err => {
  console.error('❌ Fatal startup error:', err);
  // Even if startup fails catastrophically, try to start a minimal server
  const FALLBACK_PORT = process.env.PORT || 2000;
  app.listen(FALLBACK_PORT, () => {
    console.log(`⚠️  Backend running on http://localhost:${FALLBACK_PORT} (degraded mode)`);
  });
});
