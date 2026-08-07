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
import { verifyEmailTransport } from "./utils/sendEmail.js";
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

  // ── 2b. Can this environment actually send mail? ──
  // Every send site swallows its own failure on purpose — a dead relay must not take
  // an audit, a signup or a password reset down with it. The cost is that a
  // misconfigured SMTP is completely invisible until a user reports a mail that never
  // came. So it is proved here instead, once, out loud, at the only moment anyone is
  // watching the logs. Deliberately not awaited and never fatal: the app is still
  // worth serving without mail, and a transient relay blip must not become a boot loop.
  //
  // Worth knowing when this fires in a container: .env is excluded from the image
  // (.dockerignore), so SMTP_* can only come from App Service application settings or
  // the PlatformConfig collection — a local .env that works proves nothing about prod.
  verifyEmailTransport()
    .then((result) => {
      if (result.ok) {
        logger.info(`📧 SMTP ready — ${result.user} via ${result.host}:${result.port} (sending as: ${result.from})`);

        // Authenticating as one domain and sending As: another is the failure that
        // survives every check above — the relay accepts it, the log says "sent",
        // and the mail is then dropped or spam-filed downstream because SPF/DKIM
        // cannot align for a domain this account doesn't own. From the visitor's
        // side that is indistinguishable from never sending it, which is exactly
        // how it presented: signup OTPs, password resets and completion mail all
        // "succeeded" for weeks while nothing arrived.
        //
        // sendEmail.js now repairs this rather than merely reporting it, so this is
        // no longer a warning about broken mail — it is a notice that the CONFIGURED
        // sender identity is being overridden, which is still worth one line at boot.
        if (result.fromRewritten) {
          logger.warn(
            `📧 EMAIL_FROM is "${result.configuredFrom}", which @${(result.user.match(/@(.+)$/) || [])[1]} is not authorised to send as — ` +
            `mail is going out as "${result.from}" so it survives SPF/DKIM at the recipient. ` +
            `To send under your own domain, point SMTP_* at a mailbox on it (or verify the alias) and set EMAIL_FROM_VERIFIED=true.`
          );
        }
      } else {
        logger.error(
          `📧 EMAIL IS NOT WORKING — ${result.error}. ` +
          `Audit-completion mail, signup OTPs and password resets will all fail silently until this is fixed ` +
          `(set the SMTP_* keys as App Service application settings, or in Admin → Config, then POST /api/admin/config/test-email to confirm).`
        );
      }
    })
    .catch((err) => logger.error("📧 SMTP verification threw", err));

  // The emailed report link is built from FRONTEND_URL. Left at its localhost
  // default, the mail still sends and still looks fine in the logs — and every
  // "Open your report" button in it points at a machine the recipient doesn't have.
  if (IS_PROD && /localhost|127\.0\.0\.1/i.test(FRONTEND_URL)) {
    logger.error(`🔗 FRONTEND_URL is "${FRONTEND_URL}" in production — every emailed report link will point at localhost. Set FRONTEND_URL.`);
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
