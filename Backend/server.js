// Load .env BEFORE anything else: ESM hoists and evaluates the whole static import
// graph before the first statement of this file runs, so a `dotenv.config()` call
// placed below the imports executed AFTER modules like utils/browserManager.js had
// already read process.env at module scope — every module-level tunable in .env
// (MAX_CONCURRENT_BROWSERS, MAX_KEY_PAGES, …) was silently ignored. The
// side-effect import form is the one way to guarantee env vars exist first.
import "dotenv/config";
import logger from "./utils/logger.js";

import { createApp } from "./app.js";
import connectDB from "./database/connection.js";
import configService from "./services/configService.js";
import auditStore from "./utils/auditStore.js";
import SingleAuditReport, { REPORT_TTL_SECONDS } from "./models/singleAuditReport.js";
import { syncCmsIndexes } from "./models/cms/index.js";
import bootstrapSuperAdmin from "./utils/bootstrapSuperAdmin.js"; // ⚠️ TEMPORARY — remove with the file

/**
 * Process bootstrap (doc §3): connect dependencies, build the app, bind the port,
 * and shut down cleanly. All request-handling lives in app.js.
 */

let httpServer = null;

const startServer = async () => {
  // ── 1. DB ──
  await connectDB();

  // ── 1b. Index migration ──
  // The report TTL moved from field-level `expires` (3h) to an explicit index with
  // REPORT_TTL_SECONDS (default 24h). Mongo keeps whatever expireAfterSeconds the
  // existing index was created with, so syncIndexes() must drop and recreate it once.
  // Never fatal: on failure the old TTL simply stays in effect until the next boot.
  try {
    await SingleAuditReport.syncIndexes();
    logger.info(`[DB] Report indexes synced — TTL ${REPORT_TTL_SECONDS}s (${(REPORT_TTL_SECONDS / 3600).toFixed(1)}h reuse window)`);
  } catch (err) {
    logger.error("[DB] Report index sync failed (old TTL stays in effect)", err);
  }

  // The CMS collections are new, so syncing them is additive — see the warning in
  // models/cms/index.js about never adding a pre-existing model to that list.
  await syncCmsIndexes();

  // ── 1c. One-time super-admin grant ──
  // ⚠️ TEMPORARY — see utils/bootstrapSuperAdmin.js. Delete this call and the file
  // once the grant is confirmed. Self-contained and never throws.
  await bootstrapSuperAdmin();

  // ── 2. Config ──
  // Loaded here, not inside app.js, so the app receives plain values and stays
  // independent of where configuration happens to come from.
  await configService.initialize();

  const FRONTEND_URL = configService.getConfig("FRONTEND_URL", "http://localhost:5173");
  const SESSION_SECRET = configService.getConfig("SESSION_SECRET");
  const PORT = parseInt(configService.getConfig("PORT", "2000"), 10);
  const IS_PROD = process.env.NODE_ENV === "production";

  // Refuse to start with a missing/guessable session secret (was hardcoded "secret_2026").
  if (!SESSION_SECRET || SESSION_SECRET.length < 16) {
    throw new Error("SESSION_SECRET must be set to a strong value (>= 16 chars).");
  }

  // ── 3. App ──
  const app = createApp({ FRONTEND_URL, SESSION_SECRET, IS_PROD });

  // ── 4. Listen ──
  httpServer = app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
  });
};

// ── Graceful shutdown ──
// Completed audits are buffered in memory and written to Mongo in batches. On a
// graceful stop, stop accepting new connections first, then flush whatever is still
// buffered so finished work isn't lost.
let shuttingDown = false;
const gracefulShutdown = async (signal) => {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`⏳ ${signal} received — draining connections and flushing buffered reports...`);

  // Stop taking new requests before flushing, so nothing lands mid-flush.
  if (httpServer) {
    await new Promise((resolve) => httpServer.close(resolve)).catch(() => {});
  }

  try {
    await auditStore.flushAll();
  } catch (err) {
    logger.error("Error flushing audit store on shutdown", err);
  }
  process.exit(0);
};
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// ── Main-process crash safety net ──
// singleAuditWorker.js (the worker_threads path) already has this exact
// handler — mirrored here because site-type detection (discoveryController.js
// / singleAuditController.js's fallback path) calls the SAME shared Playwright
// browser pool (puppeteer_cheerio.js) directly on the MAIN process, not inside
// a worker. Without this, a late/background CDP session error firing after a
// page or context has already closed (confirmed under concurrent load — see
// getSharedBrowser's activeContexts gating) would crash the entire server,
// taking down every in-flight request, not just one audit. Detached-frame /
// closed-session errors are expected during page teardown and are silently
// suppressed; anything else is logged so it isn't silently lost.
function handleProcessSafetyError(error) {
  const msg = error?.message || (typeof error === "string" ? error : "");
  const lmsg = msg.toLowerCase();
  const isPageTeardownError =
    lmsg.includes("detached") ||
    lmsg.includes("session closed") ||
    lmsg.includes("target closed") ||
    lmsg.includes("context was destroyed") ||
    lmsg.includes("frame is not ready") ||
    lmsg.includes("cdpsession") ||
    !error;
  if (!isPageTeardownError) {
    logger.warn("[Server] Uncaught safety exception/promise rejection (non-fatal):", error);
  }
}
process.on("unhandledRejection", handleProcessSafetyError);
process.on("uncaughtException", handleProcessSafetyError);

startServer().catch((err) => {
  logger.error("❌ Startup Error", err);
  process.exit(1);
});
