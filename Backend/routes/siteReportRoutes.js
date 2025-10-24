// routes/siteReportRoutes.js
import express from "express";
import { generateAndSaveReport } from "../Controllers/siteReportController.js";

const router = express.Router();

router.post("/saveReport", generateAndSaveReport);

export default router;
