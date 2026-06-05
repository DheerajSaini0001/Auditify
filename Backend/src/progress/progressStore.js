// Redis-only progress tracking. The worker writes here after every meaningful step;
// the API reads here for GET /audits/:id/progress. MongoDB is NEVER touched here.
//
// Key:  audit:{auditId}:progress   (JSON string, TTL = env.PROGRESS_TTL_SECONDS)
//
// All operations are best-effort: if Redis is down we log and continue so the audit
// still completes (the final MongoDB write is the source of truth).
import { getRedis } from "../config/redis.js";
import { env } from "../config/env.js";
import createLogger from "../utils/logger.js";

const log = createLogger("progress");

const key = (auditId) => `audit:${auditId}:progress`;

export function defaultProgress(auditId, url, options = {}) {
  const now = new Date().toISOString();
  const wanted = Array.isArray(options.checks) && options.checks.length ? options.checks : ["seo", "performance", "accessibility", "security"];
  const checks = {};
  for (const c of wanted) checks[c] = "pending";
  return {
    auditId,
    url,
    status: "queued",
    stage: "queued",
    percent: 0,
    pagesFound: 0,
    pagesScanned: 0,
    currentUrl: null,
    checks,
    startedAt: null,
    updatedAt: now,
    error: null,
  };
}

// Full write (used to seed initial progress).
export async function setProgress(auditId, progress) {
  try {
    const value = JSON.stringify({ ...progress, updatedAt: new Date().toISOString() });
    await getRedis().set(key(auditId), value, "EX", env.PROGRESS_TTL_SECONDS);
  } catch (err) {
    log.warn(`Failed to set progress for ${auditId} (continuing)`, err);
  }
}

// Read current progress; null if the key is missing/expired or Redis is unavailable.
export async function getProgress(auditId) {
  try {
    const raw = await getRedis().get(key(auditId));
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    log.warn(`Failed to read progress for ${auditId}`, err);
    return null;
  }
}

// Merge-patch the existing progress (read-modify-write). Best-effort.
export async function updateProgress(auditId, patch) {
  try {
    const current = (await getProgress(auditId)) || { auditId };
    const next = {
      ...current,
      ...patch,
      checks: { ...(current.checks || {}), ...(patch.checks || {}) },
      updatedAt: new Date().toISOString(),
    };
    await getRedis().set(key(auditId), JSON.stringify(next), "EX", env.PROGRESS_TTL_SECONDS);
    return next;
  } catch (err) {
    log.warn(`Failed to update progress for ${auditId} (continuing)`, err);
    return null;
  }
}

export default { defaultProgress, setProgress, getProgress, updateProgress };
