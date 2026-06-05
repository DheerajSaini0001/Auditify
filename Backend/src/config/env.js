// Centralized environment configuration for the audit pipeline.
// Every tunable lives here with a sane default so the system boots without a full .env.
import dotenv from "dotenv";
dotenv.config();

const num = (v, d) => (v === undefined || v === "" || Number.isNaN(Number(v)) ? d : Number(v));

export const env = {
  // API
  API_PORT: num(process.env.AUDIT_API_PORT, 4000),

  // MongoDB
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/auditify",

  // Redis (used by BullMQ AND the progress store)
  REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",
  REDIS_PORT: num(process.env.REDIS_PORT, 6379),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
  REDIS_DB: num(process.env.REDIS_DB, 0),

  // Queue
  QUEUE_NAME: process.env.AUDIT_QUEUE_NAME || "audits",
  JOB_ATTEMPTS: num(process.env.AUDIT_JOB_ATTEMPTS, 3),
  JOB_BACKOFF_MS: num(process.env.AUDIT_JOB_BACKOFF_MS, 5000), // exponential: 5s, 10s

  // Worker
  WORKER_CONCURRENCY: num(process.env.AUDIT_WORKER_CONCURRENCY, 10),

  // Progress (Redis) TTL — how long a finished audit's progress lives. 24h default.
  PROGRESS_TTL_SECONDS: num(process.env.AUDIT_PROGRESS_TTL_SECONDS, 24 * 60 * 60),

  // Crawl defaults
  DEFAULT_MAX_PAGES: num(process.env.AUDIT_DEFAULT_MAX_PAGES, 20),
  CRAWL_REQUEST_TIMEOUT_MS: num(process.env.AUDIT_CRAWL_TIMEOUT_MS, 10000),

  // Recovery: queued docs older than this with no live job get re-enqueued on startup.
  ORPHAN_AGE_MS: num(process.env.AUDIT_ORPHAN_AGE_MS, 5 * 60 * 1000),

  // Mongo TTL for auto-deleting old audits (days)
  AUDIT_RETENTION_DAYS: num(process.env.AUDIT_RETENTION_DAYS, 90),
};

export default env;
