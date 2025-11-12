import express from "express";
import { startAudit } from "../controllers/auditController.js";

const router = express.Router();

router.post("/site", startAudit);

export default router;
