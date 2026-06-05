# Audit Processing Pipeline (BullMQ + Redis + MongoDB)

A self-contained audit system that touches MongoDB **at most 3 times per audit**. All
intermediate progress lives in Redis. Workers run as **separate processes** from the API.

```
User → API (POST /audits) → BullMQ/Redis → Worker process → Redis progress → MongoDB (final only)
```

## The 3 MongoDB writes (never more)
1. **POST /audits** → create doc, `status: "queued"`
2. **Worker finishes** → one update: `status: "completed"` + full `report`
3. **Worker fails permanently** (after all 3 attempts) → one update: `status: "failed"` + error

Everything else (per-page crawl progress, per-check status) is written **only to Redis**
at `audit:{auditId}:progress` (TTL 24h).

## Folder layout
```
src/config/     env, MongoDB connection, Redis client + BullMQ connection
src/models/     Audit schema (the only collection)
src/queues/     BullMQ producer (auditQueue) + orphan recovery
src/progress/   Redis read/write helpers
src/workers/    worker, processor, crawler, checks/
src/api/        Express server, routes, middleware
src/utils/      logger
scripts/        startApi.js, startWorker.js  (separate processes)
```

## Run it
Requires a running **Redis** and **MongoDB**.

```bash
# 1) API server (stateless — run one per CPU core behind a load balancer)
npm run audit:api          # listens on AUDIT_API_PORT (default 4000)

# 2) Worker(s) — run as MANY separate processes as you need (PM2/Docker)
npm run audit:worker       # each handles AUDIT_WORKER_CONCURRENCY (default 10) jobs
```

## API
| Method | Path | Reads from | Notes |
|---|---|---|---|
| `POST` | `/audits` | — | `{ url, options:{ maxPages, checks } }` → `{ auditId, status, progressUrl, resultUrl }`. Mongo write #1. |
| `GET`  | `/audits/:id/progress` | **Redis** (Mongo fallback) | Poll every 2s. |
| `GET`  | `/audits/:id` | **MongoDB** | Full doc incl. report. |
| `GET`  | `/audits` | **MongoDB** | Paginated list, newest first, **without** report. |

## Config (env vars, all optional)
`AUDIT_API_PORT`, `MONGO_URI`, `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`,
`AUDIT_QUEUE_NAME`, `AUDIT_JOB_ATTEMPTS` (3), `AUDIT_JOB_BACKOFF_MS` (5000 → 5s/10s),
`AUDIT_WORKER_CONCURRENCY` (10), `AUDIT_PROGRESS_TTL_SECONDS` (86400),
`AUDIT_DEFAULT_MAX_PAGES` (20), `AUDIT_RETENTION_DAYS` (90), `AUDIT_ORPHAN_AGE_MS` (300000).

## Scaling & failure handling
- **More load** → start more worker processes (API unchanged).
- **Worker crash mid-job** → BullMQ detects the stalled job and re-queues it.
- **API crash during enqueue** → on worker startup, `requeueOrphans()` re-enqueues any
  `queued` doc older than 5 min that has no live BullMQ job.
- **Redis down** → progress writes are best-effort (logged, skipped); the audit still
  completes and writes to Mongo.
- **Mongo down** → `POST /audits` returns 503; in-flight final writes fail → BullMQ retries.
