import express from "express";
import { getReportById, getBulkAuditStatus } from "../controllers/auditReportController.js";

const router = express.Router();

router.get("/bulk/:bulkAuditId", getBulkAuditStatus);
router.get("/single/:singleAuditId", getReportById);

export default router;
