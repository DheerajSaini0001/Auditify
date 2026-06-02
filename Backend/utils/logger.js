import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ── Resolve __dirname for ES modules ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Config ──
const LOG_DIR = path.resolve(__dirname, "..", "logs");
const LOG_LEVELS = { DEBUG: "DEBUG", INFO: "INFO", WARN: "WARN", ERROR: "ERROR" };

// Keep only this many days of log files (0 = unlimited)
const MAX_LOG_DAYS = 30;

// ── Console colors ──
const COLORS = {
  DEBUG: "\x1b[36m",  // cyan
  INFO:  "\x1b[32m",  // green
  WARN:  "\x1b[33m",  // yellow
  ERROR: "\x1b[31m",  // red
  RESET: "\x1b[0m",
  DIM:   "\x1b[2m",
};

// ── Ensure logs directory exists ──
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

/**
 * Get the log file path for a given date (daily rotation).
 * Format: logs/app-2026-06-01.log
 */
function getLogFilePath(date = new Date()) {
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD
  return path.join(LOG_DIR, `app-${dateStr}.log`);
}

/**
 * Format a log entry as a human-readable string for the file.
 */
function formatFileEntry(level, message, meta) {
  const timestamp = new Date().toISOString();
  let entry = `[${timestamp}] [${level}] ${message}`;

  if (meta) {
    if (meta instanceof Error) {
      entry += `\n  Error: ${meta.message}`;
      if (meta.stack) {
        entry += `\n  Stack: ${meta.stack}`;
      }
    } else if (typeof meta === "object") {
      try {
        entry += `\n  Meta: ${JSON.stringify(meta, null, 2)}`;
      } catch {
        entry += `\n  Meta: [Circular or non-serializable object]`;
      }
    } else {
      entry += ` | ${meta}`;
    }
  }

  return entry;
}

/**
 * Format a log entry for console output (with colors).
 */
function formatConsoleEntry(level, message, meta) {
  const timestamp = new Date().toISOString();
  const color = COLORS[level] || COLORS.RESET;
  let entry = `${COLORS.DIM}${timestamp}${COLORS.RESET} ${color}[${level}]${COLORS.RESET} ${message}`;

  if (meta) {
    if (meta instanceof Error) {
      entry += `\n  ${COLORS.ERROR}Error: ${meta.message}${COLORS.RESET}`;
      if (meta.stack) {
        entry += `\n  ${COLORS.DIM}${meta.stack}${COLORS.RESET}`;
      }
    } else if (typeof meta === "object") {
      try {
        entry += `\n  ${COLORS.DIM}${JSON.stringify(meta, null, 2)}${COLORS.RESET}`;
      } catch {
        entry += `\n  [Circular or non-serializable object]`;
      }
    } else {
      entry += ` ${COLORS.DIM}| ${meta}${COLORS.RESET}`;
    }
  }

  return entry;
}

/**
 * Write a log entry to both console and log file.
 */
function writeLog(level, message, meta) {
  // Console output
  const consoleEntry = formatConsoleEntry(level, message, meta);
  if (level === "ERROR") {
    console.error(consoleEntry);
  } else if (level === "WARN") {
    console.warn(consoleEntry);
  } else {
    console.log(consoleEntry);
  }

  // File output (async, fire-and-forget to avoid blocking)
  const fileEntry = formatFileEntry(level, message, meta);
  const logFile = getLogFilePath();
  fs.appendFile(logFile, fileEntry + "\n", (err) => {
    if (err) {
      console.error(`[LOGGER] Failed to write to log file: ${err.message}`);
    }
  });
}

/**
 * Cleanup old log files beyond MAX_LOG_DAYS.
 */
function cleanupOldLogs() {
  if (MAX_LOG_DAYS <= 0) return;

  try {
    const files = fs.readdirSync(LOG_DIR);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - MAX_LOG_DAYS);

    for (const file of files) {
      // Match app-YYYY-MM-DD.log pattern
      const match = file.match(/^app-(\d{4}-\d{2}-\d{2})\.log$/);
      if (match) {
        const fileDate = new Date(match[1]);
        if (fileDate < cutoff) {
          fs.unlinkSync(path.join(LOG_DIR, file));
          console.log(`[LOGGER] Cleaned up old log file: ${file}`);
        }
      }
    }
  } catch (err) {
    console.error(`[LOGGER] Error cleaning up old logs: ${err.message}`);
  }
}

// ── Run cleanup on startup ──
cleanupOldLogs();

// ── Public API ──

const logger = {
  /**
   * Log an informational message.
   * @param {string} message
   * @param {*} [meta] - Optional additional data
   */
  info(message, meta) {
    writeLog(LOG_LEVELS.INFO, message, meta);
  },

  /**
   * Log a debug message.
   * @param {string} message
   * @param {*} [meta] - Optional additional data
   */
  debug(message, meta) {
    writeLog(LOG_LEVELS.DEBUG, message, meta);
  },

  /**
   * Log a warning message.
   * @param {string} message
   * @param {*} [meta] - Optional additional data
   */
  warn(message, meta) {
    writeLog(LOG_LEVELS.WARN, message, meta);
  },

  /**
   * Log an error with full stack trace.
   * @param {string} message
   * @param {Error|*} [error] - Error object (stack will be captured) or any metadata
   */
  error(message, error) {
    // If a plain string or non-Error is passed, wrap it so we still get a stack
    if (error && !(error instanceof Error)) {
      const wrapper = new Error(typeof error === "string" ? error : JSON.stringify(error));
      writeLog(LOG_LEVELS.ERROR, message, wrapper);
    } else {
      writeLog(LOG_LEVELS.ERROR, message, error);
    }
  },
};

export default logger;
