import express from "express";
import cors from "cors";
import main from "./Main/main.js";

import dotenv from "dotenv";
dotenv.config();
const PORT =process.env.PORT;

const app = express();
app.use(express.json());
app.use(cors());

app.post('/data', async (req, res) => {

  const  message  = req.body;
  try {
  const data = await main(message)
  res.json({Metric:data.Metrices_Data, Raw:data.Raw_Data});
  console.log(data.Metrices_Data);
  // console.log(data.Raw_Data);
    
  } catch (error) {
    console.error("Error fetching PageSpeed data:", error);
    res.status(500).json({ success: false, error: "Failed to fetch PageSpeed data" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});