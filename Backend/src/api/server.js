// The stateless audit API server. Enqueues work and reads progress/results.
// It NEVER processes audits (that's the worker's job) and only writes to Mongo on POST.
import express from "express";
import { connectMongo } from "../config/db.js";
import auditsRouter from "./routes/audits.js";
import { errorHandler } from "./middleware.js";
import { env } from "../config/env.js";
import createLogger from "../utils/logger.js";

const log = createLogger("api");

export async function createApp() {
  const app = express();
  app.use(express.json({ limit: "256kb" }));
  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/audits", auditsRouter);
  app.use(errorHandler);
  return app;
}

export async function startServer() {
  await connectMongo();
  const app = await createApp();
  return app.listen(env.API_PORT, () => log.info(`Audit API listening on :${env.API_PORT}`));
}

// Run directly: `node src/api/server.js`
if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((e) => {
    log.error("API failed to start", e);
    process.exit(1);
  });
}

export default startServer;
