// BullMQ producer. The API server uses this to enqueue jobs; it does NOT process them.
import { Queue, QueueEvents } from "bullmq";
import { bullConnection } from "../config/redis.js";
import { env } from "../config/env.js";

export const auditQueue = new Queue(env.QUEUE_NAME, {
  connection: bullConnection,
  defaultJobOptions: {
    attempts: env.JOB_ATTEMPTS, // 3
    backoff: { type: "exponential", delay: env.JOB_BACKOFF_MS }, // 5s, then 10s
    removeOnComplete: { age: 3600, count: 1000 }, // BullMQ housekeeping; Mongo is the record of truth
    removeOnFail: false, // keep failed jobs for inspection until manually cleared
  },
});

// The BullMQ job id IS the audit _id (a UUID). This makes orphan reconciliation trivial:
// we can look up a job by audit id directly.
export async function enqueueAudit(auditId, data) {
  return auditQueue.add(
    "audit",
    data, // { auditId, url, options }
    { jobId: auditId }
  );
}

// Used by recovery to check whether a job already exists for a given audit id.
export async function jobExists(auditId) {
  const job = await auditQueue.getJob(auditId);
  return !!job;
}

// Optional events stream (useful for logging/metrics; not required for the flow).
export const auditQueueEvents = new QueueEvents(env.QUEUE_NAME, { connection: bullConnection });

export default auditQueue;
