// Orphan reconciliation. Handles the failure case: "API crashed during enqueue" —
// a MongoDB doc exists with status=queued but no matching BullMQ job. On startup we
// find queued docs older than ORPHAN_AGE_MS with no live job and re-enqueue them.
import Audit from "../models/Audit.js";
import { enqueueAudit, jobExists } from "./auditQueue.js";
import { env } from "../config/env.js";
import createLogger from "../utils/logger.js";

const log = createLogger("recovery");

export async function requeueOrphans() {
  const cutoff = new Date(Date.now() - env.ORPHAN_AGE_MS);
  const orphans = await Audit.find({ status: "queued", queuedAt: { $lt: cutoff } })
    .select("_id url options")
    .lean();

  let requeued = 0;
  for (const a of orphans) {
    if (await jobExists(a._id)) continue; // job is alive — not an orphan
    await enqueueAudit(a._id, { auditId: a._id, url: a.url, options: a.options || {} });
    requeued++;
    log.warn(`Re-enqueued orphaned audit ${a._id}`);
  }
  if (requeued) log.info(`Recovery complete: re-enqueued ${requeued} orphaned audit(s)`);
  return requeued;
}

export default requeueOrphans;
