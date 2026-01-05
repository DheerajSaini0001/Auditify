import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import auditRoutes from "./routes/auditRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 2000;
connectDB();

const app = express();

// 1. Basic Security Headers
app.use(helmet());

// 2. Restrict CORS
const allowedOrigins = [
  "http://localhost:5173", // Frontend Dev URL
  // "https://your-production-domain.com" // Add production URL here
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ["GET", "POST"],
  credentials: true
}));

// 3. Rate Limiter (Prevent DoS)
const auditLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 Minutes
  max: 5, // Max 5 audits per IP per 15 mins
  message: { error: "Too many audit requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(express.json({ limit: "10kb" })); // Limit body size

// Apply limiter ONLY to audit route
app.use("/audit", auditLimiter, auditRoutes);
app.use("/report", reportRoutes);

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
