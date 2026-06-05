// Global concurrency gate for audit worker threads (each launches a headless Chromium,
// ~150-300MB). Without a process-wide cap, concurrent audits exhaust RAM and OOM-kill the
// host. Shared across single + bulk audit flows.

const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT_BROWSERS || "4", 10);

let active = 0;
const waiters = [];

/** Acquire a slot, waiting (FIFO) until one is free. */
export const acquire = () =>
  new Promise((resolve) => {
    if (active < MAX_CONCURRENT) {
      active++;
      resolve();
    } else {
      waiters.push(resolve);
    }
  });

/** Release a slot and hand it to the next waiter, if any. */
export const release = () => {
  if (waiters.length > 0) {
    const next = waiters.shift();
    next(); // slot stays "active", just transferred
  } else {
    active = Math.max(0, active - 1);
  }
};

/** Current number of in-use slots (excludes queued waiters). */
export const activeCount = () => active;

/** Number of requests currently queued waiting for a slot. */
export const queuedCount = () => waiters.length;

export { MAX_CONCURRENT };
