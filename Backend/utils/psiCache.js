/**
 * PageSpeed Insights (PSI) RESULT CACHE — gzipped files under Backend/.psi-cache.
 *
 * Why a FILE cache: PSI is the audit's slowest single call (~50-75s) and its
 * result barely changes hour to hour, so re-audits of the same URL should not
 * pay it again. The audit worker is deliberately DB-FREE (it streams results to
 * the main thread; see singleAuditWorker.js), so Mongo would need a new IPC
 * protocol — while the filesystem is already shared by the main process and
 * every worker_thread, survives worker exit, and (locally) survives restarts.
 * In the production container it lives for the container's lifetime — exactly
 * the window repeat audits happen in.
 *
 * Entry = { cachedAt, url, device, data } → gzip → atomic rename. A Lighthouse
 * JSON is multi-MB raw but ~5-10x smaller gzipped. Only responses that actually
 * carry a lighthouseResult are cached — errors/partials are never memoized.
 *
 * Tunables:
 *   PSI_CACHE_TTL_MS      default 43200000 (12h). 0 disables the cache entirely.
 *   PSI_CACHE_MAX_ENTRIES default 300 files (oldest evicted on sweep).
 */

import { createHash } from "crypto";
import { gzipSync, gunzipSync } from "zlib";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import logger from "./logger.js";

const TTL_MS = Math.max(0, parseInt(process.env.PSI_CACHE_TTL_MS || `${12 * 60 * 60 * 1000}`, 10) || 0);
const MAX_ENTRIES = Math.max(10, parseInt(process.env.PSI_CACHE_MAX_ENTRIES || "300", 10) || 300);
const CACHE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", ".psi-cache");

// mkdir once per process, lazily; failures make every set() a silent no-op.
let dirReady = null;
const ensureDir = () => (dirReady ??= fs.mkdir(CACHE_DIR, { recursive: true }).catch(() => {}));

const normDevice = (d) => (String(d || "mobile").toLowerCase() === "desktop" ? "desktop" : "mobile");
const fileFor = (url, device) =>
  path.join(CACHE_DIR, createHash("sha1").update(`${url}::${normDevice(device)}`).digest("hex") + ".json.gz");

/** Fresh cached PSI payload ({ cachedAt, url, device, data }) or null. */
export async function getCachedPsi(url, device) {
  if (!TTL_MS) return null;
  try {
    const buf = await fs.readFile(fileFor(url, device));
    const payload = JSON.parse(gunzipSync(buf).toString("utf8"));
    if (typeof payload?.cachedAt !== "number" || !payload?.data?.lighthouseResult) return null;
    if (Date.now() - payload.cachedAt > TTL_MS) return null; // stale — replaced on next fetch
    return payload;
  } catch {
    return null; // missing/corrupt/unreadable = miss, never an error
  }
}

/** Cache a successful PSI response. No-op for failures/partials or when disabled. */
export async function setCachedPsi(url, device, data) {
  if (!TTL_MS || !data?.lighthouseResult) return;
  try {
    await ensureDir();
    const file = fileFor(url, device);
    // Write-then-rename so a concurrent reader can never see a half-written gzip.
    const tmp = `${file}.tmp-${process.pid}-${Math.random().toString(36).slice(2)}`;
    await fs.writeFile(tmp, gzipSync(JSON.stringify({ cachedAt: Date.now(), url, device: normDevice(device), data })));
    await fs.rename(tmp, file);
    sweepSoon();
  } catch (err) {
    logger.warn(`[PsiCache] write skipped (${err.message}) — audits still work, just uncached`);
  }
}

// ── Housekeeping: drop stale/excess entries and orphaned tmp files ──
// At most once per 10 min per process, entirely async and error-swallowing.
let lastSweep = 0;
function sweepSoon() {
  const now = Date.now();
  if (now - lastSweep < 10 * 60 * 1000) return;
  lastSweep = now;
  (async () => {
    try {
      const names = await fs.readdir(CACHE_DIR);
      const entries = [];
      for (const n of names) {
        const p = path.join(CACHE_DIR, n);
        let s;
        try { s = await fs.stat(p); } catch { continue; }
        if (n.includes(".tmp-")) {
          // Orphaned temp from a crashed writer — reap after an hour.
          if (now - s.mtimeMs > 60 * 60 * 1000) fs.unlink(p).catch(() => {});
        } else if (n.endsWith(".json.gz")) {
          if (now - s.mtimeMs > TTL_MS) fs.unlink(p).catch(() => {});
          else entries.push({ p, m: s.mtimeMs });
        }
      }
      // Oldest-first eviction beyond the size bound.
      entries.sort((a, b) => a.m - b.m);
      for (let i = 0; i < entries.length - MAX_ENTRIES; i++) fs.unlink(entries[i].p).catch(() => {});
    } catch { /* cache dir may not exist yet — nothing to sweep */ }
  })();
}

export default { getCachedPsi, setCachedPsi };
