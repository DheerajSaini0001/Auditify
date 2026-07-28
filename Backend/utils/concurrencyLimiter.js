/**
 * A minimal counting semaphore for bounding how many copies of an expensive,
 * resource-heavy operation (e.g. a stealth browser launch) run at once within
 * this process. Extra callers queue (FIFO) and are released in order as slots
 * free up — nothing is dropped or rejected, it just waits its turn.
 *
 * Scope note: this only coordinates work inside THIS process/thread. It does
 * NOT span across Node worker_threads (each worker gets its own module
 * instance, no shared memory for plain JS state) — so this limits concurrent
 * browser launches triggered from the main Express process (site-type
 * detection during /discover and /audit), not the per-page browser launches
 * the audit worker threads run independently.
 */
export function createLimiter(maxConcurrent) {
  let active = 0;
  const queue = [];

  function acquire() {
    return new Promise((resolve) => {
      const tryAcquire = () => {
        if (active < maxConcurrent) {
          active++;
          resolve();
        } else {
          queue.push(tryAcquire);
        }
      };
      tryAcquire();
    });
  }

  function release() {
    active--;
    const next = queue.shift();
    if (next) next();
  }

  /** Run `fn` once a slot is free; always releases the slot, even on throw. */
  async function run(fn) {
    await acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  }

  return { run };
}

export default createLimiter;
