import express from "express";
import cors from "cors";
import main from "./Main/main.js";
import siteReportRoutes from "./routes/siteReportRoutes.js";
import connectDB from "./DB/db.js";
import dotenv from "dotenv";
import SiteReport from "./Model/SiteReport.js"; // 👈 import your Mongoose model

dotenv.config();
const PORT = process.env.PORT || 2000;

const app = express();
app.use(express.json());
app.use(cors());

// ✅ Connect to MongoDB
connectDB();

// 📍 POST Route to process + save data
app.post("/data", async (req, res) => {
  const message = req.body;

  try {
    // Run your main() function
    const data = await main(message);
    const rawData = data.Raw_Data;

    // ✅ Save Raw_Data to MongoDB
    const newReport = new SiteReport(rawData);
    await newReport.save();

    console.log("✅ Audit Completed & Data Saved to MongoDB");

    // Response back to client
    res.json({
      success: true,
      Metric: data.Metrices_Data,
      Raw: data.Raw_Data,
      saved: true,
    });
  } catch (error) {
    console.error("❌ Error fetching/saving PageSpeed data:", error);
    res
      .status(500)
      .json({ success: false, error: "Failed to fetch or save PageSpeed data" });
  }
});

// Other routes
app.use("/api/sitereports", siteReportRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
