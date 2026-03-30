import express from "express";
import cors from "cors";
import helmet from "helmet";
import singleAuditRoutes from "./routes/singleAuditRoutes.js";
import bulkAuditRoutes from "./routes/bulkAuditRoutes.js";
import aiExplainRoutes from "./routes/aiExplainRoutes.js";
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

app.use(cors());

app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(trackingMiddleware);

app.use("/single-audit", singleAuditRoutes);
app.use("/bulk-audit", bulkAuditRoutes);
app.use("/api/ai", aiExplainRoutes);
app.use("/api/admin", adminRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
