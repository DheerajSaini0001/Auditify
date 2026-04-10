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
import aeoRoutes from "./routes/aeoRoutes.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import trackingMiddleware from "./middleware/tracking.js";
import captchaRoutes from "./routes/captchaRoutes.js";
import passportConfig from "./config/passport.js";

dotenv.config();
const PORT = process.env.PORT || 2000;
connectDB();

const app = express();

app.set('trust proxy', 1);

// Standard CORS Package
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    "http://localhost:5173",
    "http://localhost:3000"
  ].filter(Boolean),
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://static.cloudflareinsights.com", "https://accounts.google.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://*.googleusercontent.com", "https://www.gstatic.com"],
      connectSrc: ["'self'", "https://*.googleapis.com", "http://localhost:2000", "ws://localhost:2000"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginOpenerPolicy: { policy: "unsafe-none" } 
}));

passportConfig(passport);

app.use(express.json({ limit: "5mb" })); 
app.use(cookieParser());
app.use(trackingMiddleware);

// 4.2.3 Session + Passport Middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'dealerpulse_secret_2026',
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

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
