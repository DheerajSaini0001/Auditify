import express from "express";
import { getReportById } from "../controllers/reportController.js";

const router = express.Router();

router.get("/:id", getReportById);

export default router;
