import configService from '../services/configService.js';

/**
 * reportBudget — per-IP budget counted in REPORTS, not HTTP requests.
 *
 * One "report" = one audited site run. A single "Run Full Audit" click fans out
 * ~10-12 parallel page audits (VDP 2-car sample, separate new/used SRPs), and all
 * of those belong to the SAME report, so they charge the budget exactly once.
 * A request is recognised as part of an in-flight run when it's the same IP +
 * same site and the run is still warm (< RUN_CONTINUATION_MS since that run's
 * last audit request); anything else is a new report.
 *
 * Once an IP has started MAX_REPORTS runs inside the window, the whole audit
 * surface is closed for that IP — new audits AND discovery — until the oldest
 * run ages out of the window.
 */

// Same-site audit requests arriving within this gap continue the existing run.
// A batch's parallel POSTs land within seconds; 5 minutes comfortably covers
// stragglers without letting a genuinely new re-audit of the site ride free.
const RUN_CONTINUATION_MS = 5 * 60 * 1000;

// Lazy config reads (same pattern as rateLimiter.js) with env-tunable overrides.
const getWindowMs = () => parseInt(configService.getConfig('REPORT_BUDGET_WINDOW_MS', String(15 * 60 * 1000)));
const getMaxReports = () => parseInt(configService.getConfig('REPORT_BUDGET_MAX', '5'));

const runsByIp = new Map(); // ip -> [{ host, startedAt, lastSeenAt }]

const hostOf = (raw) => {
  try {
    const u = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    return new URL(u).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return String(raw || '').trim().toLowerCase();
  }
};

// Drop runs that have aged out of the window; keep the map tidy as we go.
const liveRuns = (ip, now, windowMs) => {
  const runs = (runsByIp.get(ip) || []).filter((r) => now - r.startedAt < windowMs);
  if (runs.length) runsByIp.set(ip, runs);
  else runsByIp.delete(ip);
  return runs;
};

const reject = (res, runs, now, windowMs, max) => {
  const oldest = Math.min(...runs.map((r) => r.startedAt));
  const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
  res.set('Retry-After', String(retryAfterSec));
  return res.status(429).json({
    error: `Report limit reached — up to ${max} site audits per ${Math.round(windowMs / 60000)} minutes. Try again in ~${Math.max(1, Math.ceil(retryAfterSec / 60))} min.`,
    code: 'REPORT_LIMIT_EXCEEDED',
    retryAfterSeconds: retryAfterSec,
  });
};

// POST /audit — charges the budget. The first request for a site opens a run
// (one report); the rest of that batch rides along free.
export const chargeReportBudget = (req, res, next) => {
  const now = Date.now();
  const windowMs = getWindowMs();
  const max = getMaxReports();
  const ip = req.ip || 'unknown';
  const host = hostOf(req.body?.url);
  const runs = liveRuns(ip, now, windowMs);

  const current = runs.find((r) => r.host === host && now - r.lastSeenAt < RUN_CONTINUATION_MS);
  if (current) {
    current.lastSeenAt = now;
    return next();
  }

  if (runs.length >= max) return reject(res, runs, now, windowMs, max);

  runs.push({ host, startedAt: now, lastSeenAt: now });
  runsByIp.set(ip, runs);
  next();
};

// POST /discover — never charges, but is closed once the IP is at its limit so
// a maxed-out user can't even start scoping the next audit.
export const enforceReportBudget = (req, res, next) => {
  const now = Date.now();
  const windowMs = getWindowMs();
  const max = getMaxReports();
  const runs = liveRuns(req.ip || 'unknown', now, windowMs);
  if (runs.length >= max) return reject(res, runs, now, windowMs, max);
  next();
};

// Periodic sweep so IPs that never come back don't pin stale entries in memory.
setInterval(() => {
  const now = Date.now();
  const windowMs = getWindowMs();
  for (const ip of runsByIp.keys()) liveRuns(ip, now, windowMs);
}, 10 * 60 * 1000).unref();
