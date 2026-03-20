import express from "express";
import cors from "cors";
import helmet from "helmet";
import singleAuditRoutes from "./routes/singleAuditRoutes.js";
import bulkAuditRoutes from "./routes/bulkAuditRoutes.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 2000;
connectDB();

const app = express();

app.set('trust proxy', 1);

app.use(helmet());

app.use(cors());

app.use(express.json({ limit: "10kb" }));

app.use("/single-audit", singleAuditRoutes);
app.use("/bulk-audit", bulkAuditRoutes);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
