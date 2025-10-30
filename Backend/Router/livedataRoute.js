import SiteReport from "../Model/SiteReport.js";
import express from "express";

const router = express.Router();

router.get("/:id", async (req, res) => {
  try {
    const report = await SiteReport.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Not found" });
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching report" });
  }
});

export default router;