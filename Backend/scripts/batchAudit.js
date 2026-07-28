// Batch audit runner — weight-calibration data collection.
//
// Drives workers/singleAuditWorker.js directly (no server, no Mongo) over a list
// of URLs and writes one JSON per audit with the FULL parameter-level report,
// for the objective weighting analysis (entropy/CRITIC across sites).
//
// Usage:
//   node scripts/batchAudit.js <urls.txt> <outDir> [--device desktop] [--concurrency 2] [--timeout 480]
//
//   urls.txt  one URL per line (# comments allowed). Optional "url,pageType" to
//             force a page type (else the worker classifies from the URL).
//   outDir    per-audit JSONs land here as <host>__<pageType>.json
//
// Each output JSON = merge of every progress patch + the done patch:
//   { url, pageType, status, score, grade, sectionScore, technicalPerformance,
//     onPageSEO, accessibility, securityOrCompliance, UXOrContentStructure,
//     conversionAndLeadFlow, aioReadiness, aeo, error?, timeTaken }

import fs from "fs";
import path from "path";
import { Worker } from "worker_threads";
import { registerWorkerWithManager } from "../utils/browserManager.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const args = process.argv.slice(2);
const urlsFile = args[0];
const outDir = args[1];
const opt = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? args[i + 1] : dflt;
};
const device = opt("device", "desktop");
const concurrency = Number(opt("concurrency", 2));
const timeoutSec = Number(opt("timeout", 480));

if (!urlsFile || !outDir) {
  console.error("Usage: node scripts/batchAudit.js <urls.txt> <outDir> [--device desktop] [--concurrency 2] [--timeout 480]");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const jobs = fs.readFileSync(urlsFile, "utf8")
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"))
  .map((l) => {
    const [url, pageType] = l.split(",").map((s) => s.trim());
    return { url, pageType: pageType || null };
  });

const workerPath = path.join(process.cwd(), "workers", "singleAuditWorker.js");

const slug = (url, pageType) => {
  try {
    const u = new URL(url);
    const p = u.pathname.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").slice(0, 40);
    return `${u.hostname.replace(/^www\./, "")}${p ? "__" + p : ""}__${pageType || "auto"}`;
  } catch {
    return url.replace(/[^a-z0-9]+/gi, "-").slice(0, 60);
  }
};

const runOne = (job) =>
  new Promise((resolve) => {
    const started = Date.now();
    const report = { url: job.url, requestedPageType: job.pageType };
    const auditId = slug(job.url, job.pageType);
    const outFile = path.join(outDir, `${auditId}.json`);

    if (fs.existsSync(outFile)) {
      console.log(`SKIP (exists)  ${job.url}`);
      return resolve({ ...job, status: "skipped" });
    }

    const worker = new Worker(workerPath, {
      workerData: { url: job.url, device, report: "All", auditId, pageType: job.pageType, siteType: "dealer" },
    });

    registerWorkerWithManager(worker);

    let finished = false;
    const finalize = (status, extra = {}) => {
      if (finished) return;
      finished = true;
      clearTimeout(killTimer);
      Object.assign(report, extra, { batchStatus: status, elapsedSec: Math.round((Date.now() - started) / 1000) });
      fs.writeFileSync(outFile, JSON.stringify(report, null, 2));
      console.log(`${status.toUpperCase().padEnd(9)} ${job.url}  score=${report.score ?? "-"}  ${report.elapsedSec}s${report.error ? "  [" + String(report.error).slice(0, 80) + "]" : ""}`);
      worker.terminate().catch(() => {});
      resolve({ ...job, status });
    };

    const killTimer = setTimeout(() => finalize("timeout", { error: `batch timeout after ${timeoutSec}s` }), timeoutSec * 1000);

    worker.on("message", (msg) => {
      if (msg?.patch) {
        const { screenshot, ...rest } = msg.patch; // screenshots are base64 blobs — not needed for weight analysis
        Object.assign(report, rest);
      }
      if (msg?.type === "done") finalize(report.status === "failed" ? "failed" : "completed");
      if (msg?.type === "error") finalize("failed", { error: msg.error });
    });
    worker.on("error", (err) => finalize("failed", { error: err.message }));
    worker.on("exit", (code) => {
      if (!finished) finalize(code === 0 ? "completed" : "failed", code === 0 ? {} : { error: `worker exit ${code}` });
    });
  });

(async () => {
  console.log(`Batch audit: ${jobs.length} URLs, device=${device}, concurrency=${concurrency}, timeout=${timeoutSec}s`);
  const queue = [...jobs];
  const results = [];
  const lanes = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (queue.length) {
      const job = queue.shift();
      results.push(await runOne(job));
    }
  });
  await Promise.all(lanes);

  const counts = results.reduce((a, r) => ((a[r.status] = (a[r.status] || 0) + 1), a), {});
  console.log(`\nDone. ${JSON.stringify(counts)}`);
  process.exit(0);
})();
