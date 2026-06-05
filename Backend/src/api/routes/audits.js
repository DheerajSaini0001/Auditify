// The 4 audit endpoints — nothing more, nothing less.
import express from "express";
import { v4 as uuidv4 } from "uuid";
import Audit from "../../models/Audit.js";
import { enqueueAudit } from "../../queues/auditQueue.js";
import { defaultProgress, setProgress, getProgress } from "../../progress/progressStore.js";
import { env } from "../../config/env.js";
import { asyncHandler } from "../middleware.js";

const router = express.Router();

const isHttpUrl = (s) => {
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

// POST /audits — create the audit (Mongo write #1), seed Redis, enqueue, return immediately.
router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { url, options = {} } = req.body || {};
    if (!url || !isHttpUrl(url)) {
      return res.status(400).json({ error: "A valid http(s) `url` is required", code: "INVALID_URL" });
    }

    const auditId = uuidv4();
    const cleanOptions = {
      maxPages: Math.max(1, Math.min(Number(options.maxPages) || env.DEFAULT_MAX_PAGES, 200)),
      checks: Array.isArray(options.checks) ? options.checks : undefined,
    };

    // 1) MongoDB write #1 — status=queued. If Mongo is down, 503 (per spec).
    try {
      await Audit.create({ _id: auditId, url, options: cleanOptions, status: "queued", queuedAt: new Date() });
    } catch (err) {
      return res.status(503).json({ error: "Audit store unavailable, please retry", code: "STORE_UNAVAILABLE" });
    }

    // 2) Seed Redis progress (best-effort).
    await setProgress(auditId, defaultProgress(auditId, url, cleanOptions));

    // 3) Enqueue the BullMQ job (jobId === auditId).
    await enqueueAudit(auditId, { auditId, url, options: cleanOptions });

    // 4) Immediate response — audit runs in the background.
    res.status(202).json({
      auditId,
      status: "queued",
      progressUrl: `/audits/${auditId}/progress`,
      resultUrl: `/audits/${auditId}`,
    });
  })
);

// GET /audits/:id/progress — Redis first; fall back to Mongo basic status if expired.
router.get(
  "/:id/progress",
  asyncHandler(async (req, res) => {
    const progress = await getProgress(req.params.id);
    if (progress) return res.json(progress);

    // Redis key missing/expired → minimal status from Mongo (NOT the full report).
    const doc = await Audit.findById(req.params.id).select("_id status summary error queuedAt completedAt failedAt").lean();
    if (!doc) return res.status(404).json({ error: "Audit not found", code: "NOT_FOUND" });

    return res.json({
      auditId: doc._id,
      status: doc.status,
      stage: doc.status,
      percent: doc.status === "completed" ? 100 : doc.status === "failed" ? 100 : 0,
      summary: doc.summary || null,
      error: doc.error?.message || null,
      source: "mongo-fallback",
    });
  })
);

// GET /audits/:id — full document including the report (from MongoDB).
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const doc = await Audit.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: "Audit not found", code: "NOT_FOUND" });
    res.json(doc);
  })
);

// GET /audits — paginated list, newest first, WITHOUT the (large) report field.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(parseInt(req.query.limit) || 20, 100));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;

    const [items, total] = await Promise.all([
      Audit.find(filter).select("-report").sort({ queuedAt: -1 }).skip(skip).limit(limit).lean(),
      Audit.countDocuments(filter),
    ]);

    res.json({ items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  })
);

export default router;
