// Redis connections.
//
// BullMQ requires a connection with `maxRetriesPerRequest: null`. We expose:
//   - bullConnection: the options object BullMQ Queue/Worker use to make their own clients
//   - getRedis():     a shared ioredis client for the progress store (reads/writes)
import IORedis from "ioredis";
import { env } from "./env.js";
import createLogger from "../utils/logger.js";

const log = createLogger("redis");

// Connection options handed to BullMQ (it creates/owns its own clients from these).
export const bullConnection = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  db: env.REDIS_DB,
  maxRetriesPerRequest: null, // required by BullMQ
};

let _client = null;

// Shared client for the progress store (general commands).
export function getRedis() {
  if (_client) return _client;
  _client = new IORedis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
    lazyConnect: false,
    maxRetriesPerRequest: 2,
  });
  _client.on("error", (err) => log.error("Redis client error", err));
  _client.on("connect", () => log.info("Redis client connected"));
  return _client;
}

export async function closeRedis() {
  if (_client) {
    await _client.quit().catch(() => {});
    _client = null;
  }
}

export default getRedis;
