// MongoDB connection for the audit pipeline. Shared by the API server and the worker.
import mongoose from "mongoose";
import { env } from "./env.js";
import createLogger from "../utils/logger.js";

const log = createLogger("db");

export async function connectMongo() {
  mongoose.connection.on("error", (err) => log.error("Mongo connection error", err));
  mongoose.connection.on("disconnected", () => log.warn("Mongo disconnected"));
  mongoose.connection.on("reconnected", () => log.info("Mongo reconnected"));

  await mongoose.connect(env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 20,
  });
  log.info(`Connected to MongoDB`);
  return mongoose.connection;
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}

export default connectMongo;
