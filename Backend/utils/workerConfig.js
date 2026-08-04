import configService from "../services/configService.js";

/**
 * Config bridge: main thread → audit worker_thread.
 *
 * THE BUG THIS FIXES
 * ------------------
 * configService.getConfig() reads an in-memory NodeCache that is primed from
 * Mongo by initialize(), which runs in exactly one place: server.js, on the MAIN
 * thread. worker_threads get their own module registry and therefore their own
 * EMPTY cache, so inside an audit worker getConfig() can only ever fall through
 * to process.env.
 *
 * Locally that is invisible: Backend/.env exists, dotenv populates process.env,
 * and the worker finds every key. In the container there is no .env at all (it
 * is in both .gitignore and .dockerignore, and the image is built from a clean
 * checkout), so any key configured through the admin UI — which writes to the
 * PlatformConfig collection, not to the environment — is readable by the main
 * thread and INVISIBLE to every audit.
 *
 * Confirmed in production 2026-08-04: technicalPerformance.Percentage was null
 * on every page because googleAPI's `API_KEY` resolved to undefined in the
 * worker, while the exact same key from PlatformConfig returned HTTP 200 with a
 * full Lighthouse result when called directly.
 *
 * WHY THIS SHAPE
 * --------------
 * The worker is deliberately DB-free (it streams results to the main thread and
 * never opens a Mongo connection), so it cannot simply read PlatformConfig
 * itself. The main thread already holds the resolved, decrypted values, so it
 * hands them over at spawn time and the worker seeds its own cache from them.
 *
 * Only the keys the worker actually reads are carried — an allow-list, so a
 * spawn payload can never become an accidental dump of every platform secret.
 * Keep it in sync with the getConfig() calls under metricServices/ and utils/.
 */

// Every key reachable from worker-side code:
//   API_KEY     → utils/googleAPI.js (PageSpeed), signals/{brandEntityStrength,entityRecognition}
//   KG_API_KEY  → signals/{brandEntityStrength,entityRecognition} (Knowledge Graph)
//   SafeBrowsing→ metricServices/securityCompliance.js
//   vt_key      → metricServices/securityCompliance.js (VirusTotal)
export const WORKER_CONFIG_KEYS = ["API_KEY", "KG_API_KEY", "SafeBrowsing", "vt_key"];

/**
 * Snapshot the worker-relevant config on the MAIN thread. Call this when
 * building workerData. Keys with no value are omitted rather than sent as
 * undefined, so the worker's own process.env fallback still applies to them.
 */
export function collectWorkerConfig() {
  const out = {};
  for (const key of WORKER_CONFIG_KEYS) {
    const value = configService.getConfig(key);
    if (value) out[key] = value;
  }
  return out;
}

/**
 * Seed this worker's configService cache from the snapshot. Call once at worker
 * startup, BEFORE any metric service runs. Safe to call with undefined/empty.
 *
 * Returns the key NAMES that were seeded — never the values, so this can be
 * logged. Nothing in here should ever print a secret.
 */
export function applyWorkerConfig(config) {
  if (!config || typeof config !== "object") return [];
  const applied = [];
  for (const key of WORKER_CONFIG_KEYS) {
    const value = config[key];
    if (value) {
      configService.setConfig(key, value);
      applied.push(key);
    }
  }
  return applied;
}
