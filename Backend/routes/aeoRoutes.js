import express from "express";
import { analyzeAEO, getAEOReport, batchAEO } from "../controllers/aeoController.js";

const router = express.Router();

router.post("/analyze", analyzeAEO);
router.get("/report/:id", getAEOReport);
router.post("/batch", batchAEO);

export default router;
