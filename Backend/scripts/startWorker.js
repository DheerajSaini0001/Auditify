#!/usr/bin/env node
// CLI entry point to start a worker process SEPARATELY from the API.
// Run multiple of these (PM2/Docker) to scale processing horizontally.
//   node scripts/startWorker.js
import { connectMongo, disconnectMongo } from "../src/config/db.js";
import { startWorker } from "../src/workers/auditWorker.js";
import { requeueOrphans } from "../src/queues/recovery.js";
import { closeRedis } from "../src/config/redis.js";
import createLogger from "../src/utils/logger.js";

const log = createLogger("worker-main");

(async () => {
  await connectMongo();

  // Recover any audits orphaned by an API crash during enqueue.
  await requeueOrphans().catch((e) => log.error("Recovery pass failed", e));

  const worker = startWorker();

  const shutdown = async (signal) => {
    log.info(`Received ${signal} — draining worker...`);
    try { await worker.close(); } catch (e) { log.error("worker.close error", e); }
    try { await disconnectMongo(); } catch {}
    try { await closeRedis(); } catch {}
    process.exit(0);
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Don't let a stray async error kill the whole worker silently.
  process.on("unhandledRejection", (reason) => log.error("Unhandled rejection in worker", reason));
})().catch((e) => {
  log.error("Worker process failed to start", e);
  process.exit(1);
});
