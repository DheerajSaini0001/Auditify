import express from "express";
import cors from "cors";
import main from "./Main/main.js";
import connectDB from "./DB/db.js";
import dotenv from "dotenv";
import SiteReport from "./Model/SiteReport.js"; 

dotenv.config();
const PORT = process.env.PORT || 2000;
connectDB();

const app = express();
app.use(express.json());
app.use(cors());


app.post("/data", async (req, res) => {
  const message = req.body;

  try {
    const data = await main(message);
    
    // ✅ Save Raw_Data to MongoDB
    const rawData = data.Raw_Data;
    const newData = new SiteReport(rawData);
    await newData.save();

    res.json({
      success: true,
      Metric: data.Metrices_Data,
      Raw: data.Raw_Data,
      saved: true,
    });
    
    console.log("✅ Audit Completed & Data Saved to MongoDB");
  } catch (error) {
    console.error("❌ Error fetching/saving PageSpeed data:", error);
    res.status(500).json({ success: false, error: "Failed to fetch or save PageSpeed data" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
