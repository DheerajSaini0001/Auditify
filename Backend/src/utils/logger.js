// Minimal structured logger. Swap for pino/winston later without touching callers.
const ts = () => new Date().toISOString();
const fmt = (level, scope, msg, extra) =>
  `${ts()} [${level}]${scope ? ` (${scope})` : ""} ${msg}` +
  (extra !== undefined ? ` ${typeof extra === "string" ? extra : JSON.stringify(extra)}` : "");

export const createLogger = (scope = "") => ({
  info: (msg, extra) => console.log(fmt("INFO", scope, msg, extra)),
  warn: (msg, extra) => console.warn(fmt("WARN", scope, msg, extra)),
  error: (msg, extra) => console.error(fmt("ERROR", scope, msg, extra instanceof Error ? extra.message : extra)),
  debug: (msg, extra) => { if (process.env.DEBUG) console.log(fmt("DEBUG", scope, msg, extra)); },
});

export default createLogger;
