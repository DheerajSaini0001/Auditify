import mongoose from "mongoose";
import logger from "../utils/logger.js";

let listenersBound = false;

const dbConnect = async (options = {}) => {
  const defaultOptions = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
    socketTimeoutMS: 45000,
  };

  // Bind connection listeners ONCE per process (avoid duplicate-listener warnings on retries).
  if (!listenersBound) {
    listenersBound = true;
    mongoose.connection.on("error", (err) => logger.error("MongoDB connection error", err));
    mongoose.connection.on("disconnected", () => logger.warn("⚠️  MongoDB disconnected — driver will attempt to reconnect"));
    mongoose.connection.on("reconnected", () => logger.info("✅ MongoDB reconnected"));
  }

  const maxRetries = parseInt(process.env.DB_CONNECT_RETRIES || "5", 10);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { ...defaultOptions, ...options });
      logger.info("✅ MongoDB Connected");
      return;
    } catch (err) {
      const msg = err?.message || String(err);
      logger.error(`❌ MongoDB connect attempt ${attempt}/${maxRetries} failed: ${msg}`);

      if (/whitelist|IP address|isn't whitelisted|Atlas/i.test(msg)) {
        logger.error("➡️  Likely cause: your current IP is NOT whitelisted in MongoDB Atlas.");
        logger.error("   Fix: Atlas → Network Access → Add IP Address → 'Add Current IP Address' (or 0.0.0.0/0 for dev).");
      }

      if (attempt < maxRetries) {
        // Backoff: 2s, 4s, 6s, 8s (capped 10s). Atlas free-tier clusters can take ~30s to wake.
        const wait = Math.min(2000 * attempt, 10000);
        logger.warn(`Retrying MongoDB connection in ${Math.round(wait / 1000)}s... (paused Atlas clusters take ~30s to wake)`);
        await new Promise((r) => setTimeout(r, wait));
      } else {
        // Fail fast after all retries: do NOT boot "healthy" with no database.
        logger.error("❌ MongoDB connection failed after all retries — exiting");
        process.exit(1);
      }
    }
  }
};

export default dbConnect;
