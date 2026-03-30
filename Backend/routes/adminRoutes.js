import express from "express";
import { getLogs, getStats } from "../controllers/adminController.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.get("/logs", adminAuth, getLogs);
router.get("/stats", adminAuth, getStats);

export default router;
