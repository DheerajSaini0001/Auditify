import express from "express";
import { analyzeAEO, getAEOReport, batchAEO, streamAEO } from "../controllers/aeoController.js";

const router = express.Router();

router.post("/analyze", analyzeAEO);
router.post("/stream", streamAEO);
router.get("/report/:id", getAEOReport);
router.post("/batch", batchAEO);

export default router;
