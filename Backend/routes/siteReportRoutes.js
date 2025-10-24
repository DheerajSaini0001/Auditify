// routes/siteReportRoutes.js
import express from "express";
import { saveSiteReport } from "../Controllers/siteReportController.js";

const router = express.Router();

router.post("/", saveSiteReport); // POST /api/sitereports

export default router;
