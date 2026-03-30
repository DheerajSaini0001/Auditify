import express from "express";
import cors from "cors";
import helmet from "helmet";
import singleAuditRoutes from "./routes/singleAuditRoutes.js";
import bulkAuditRoutes from "./routes/bulkAuditRoutes.js";
import aiExplainRoutes from "./routes/aiExplainRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import trackingMiddleware from "./middleware/tracking.js";

dotenv.config();
const PORT = process.env.PORT || 2000;
connectDB();

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

app.use(cors({ 
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:5173',
  credentials: true 
}));

app.use(express.json({ limit: "10kb" })); // SRS Section 6.1: express.json({ limit: '10kb' })
app.use(cookieParser());
app.use(trackingMiddleware);

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/admin", adminRoutes);

// Existing routes (keeping for backward compatibility if needed, but RBAC routes are preferred)
app.use("/single-audit", singleAuditRoutes);
app.use("/bulk-audit", bulkAuditRoutes);
app.use("/api/ai", aiExplainRoutes);

app.get("/", (req, res) => {
  res.send("Auditify RBAC Server is running");
});

// Global Error Handler (Section 9)
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
