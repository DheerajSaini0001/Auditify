#!/usr/bin/env node
// CLI entry point to start the audit API server (stateless; run one per CPU core).
//   node scripts/startApi.js
import { startServer } from "../src/api/server.js";
import createLogger from "../src/utils/logger.js";

const log = createLogger("api-main");

startServer().catch((e) => {
  log.error("API process failed to start", e);
  process.exit(1);
});
