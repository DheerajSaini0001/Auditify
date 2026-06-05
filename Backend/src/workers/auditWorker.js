// The BullMQ Worker. Runs in a SEPARATE process from the API (see scripts/startWorker.js).
// Each worker handles `concurrency` jobs at once. The processor does the work; this file
// owns the lifecycle + the single permanent-failure MongoDB write.
import { Worker } from "bullmq";
import { bullConnection } from "../config/redis.js";
import { env } from "../config/env.js";
import { processAudit } from "./auditProcessor.js";
import { updateProgress } from "../progress/progressStore.js";
import Audit from "../models/Audit.js";
import createLogger from "../utils/logger.js";

const log = createLogger("worker");

export function startWorker() {
  const worker = new Worker(env.QUEUE_NAME, processAudit, {
    connection: bullConnection,
    concurrency: env.WORKER_CONCURRENCY,
  });

  worker.on("completed", (job) => log.info(`Job ${job.id} completed`));

  worker.on("failed", async (job, err) => {
    if (!job) return log.error("A job failed with no job reference", err);

    const attempts = job.opts?.attempts || env.JOB_ATTEMPTS;
    const exhausted = job.attemptsMade >= attempts;

    if (!exhausted) {
      // Intermediate failure → Redis ONLY. No MongoDB write during retries.
      log.warn(`Job ${job.id} failed (attempt ${job.attemptsMade}/${attempts}); retrying: ${err.message}`);
      await updateProgress(job.id, {
        status: "processing",
        error: `retrying, attempt ${job.attemptsMade + 1} of ${attempts}`,
      });
      return;
    }

    // Permanent failure → the ONE allowed failure write to MongoDB.
    log.error(`Job ${job.id} permanently failed after ${attempts} attempts: ${err.message}`);
    const failedAt = new Date();
    try {
      await Audit.updateOne(
        { _id: job.id },
        {
          $set: {
            status: "failed",
            failedAt,
            attemptsMade: job.attemptsMade,
            error: { message: err.message, code: err.code || "AUDIT_FAILED" },
          },
        }
      );
    } catch (e) {
      log.error(`Could not persist failure for ${job.id}`, e);
    }
    await updateProgress(job.id, { status: "failed", stage: "failed", error: err.message });
  });

  worker.on("error", (err) => log.error("Worker error", err));

  log.info(`Audit worker started (queue="${env.QUEUE_NAME}", concurrency=${env.WORKER_CONCURRENCY})`);
  return worker;
}

export default startWorker;
