import express from "express";
import cors from "cors";
import auditRoutes from "./routes/auditRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import connectDB from "./config/db.js";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 2000;
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/audit", auditRoutes);
app.use("/report", reportRoutes);

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
