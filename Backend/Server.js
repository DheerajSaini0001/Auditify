import express from "express";
import cors from "cors";
import audits from "./Router/audit.js";
import liveData from "./Router/livedataRoute.js";
import connectDB from "./DB/db.js";
import dotenv from "dotenv";

dotenv.config();
const PORT = process.env.PORT || 2000;
connectDB();

const app = express();
app.use(express.json());
app.use(cors());

app.use("/audit", audits);
app.use("/live", liveData);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
