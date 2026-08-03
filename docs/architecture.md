# Architecture

How this codebase is laid out, and — where it diverges from
[`mern-architecture-implementation-prompt.md`](../mern-architecture-implementation-prompt.md) —
why.

## Where we are against the document

That document describes scaffolding a **new** project. This is a live application
with 19 controllers, 21 models, 110 React components and a running deployment, so it
was adopted rather than applied literally. What that means concretely:

| Doc says | Here | Why |
|---|---|---|
| `server/` and `client/` | `Backend/` and `Frontend/` | Both deploy workflows filter on the exact paths `Backend/**` and `Frontend/**`. Renaming the folders silently stops all deploys — the precise failure we spent a day diagnosing. Not worth it for a directory name. |
| Every module in `src/modules/<m>/` × 6 files | `modules/seo/`, `modules/health/` are; `controllers/` + `routes/` are not yet | New work uses the layered pattern. Existing controllers migrate when touched. Both styles coexist deliberately during migration. |
| One response shape everywhere | `/api/v1/*` yes; legacy mounts not yet | ~208 response sites answer in three shapes. Rewriting them at once breaks a deployed frontend. |
| `client/src/features/*` | `Frontend/src/Pages` + `Component` | A 110-component restructure with no functional gain. Deferred, not refused. |

The audit engine (`Backend/metricServices/`, 25 files) is deliberately **exempt** from
the layering rules. It is a measurement pipeline, not CRUD — there is no repository
layer to extract from "measure the LCP of this page", and forcing one would add
indirection without removing coupling.

## Request flow (new modules)

```
Route → (validate) → Controller → Service → Repository → MongoDB
```

Each layer has exactly one job, and the boundaries are testable:

| Layer | Does | Must never |
|---|---|---|
| **Routes** | mount paths, attach auth + validation, carry OpenAPI docs | contain logic |
| **Controller** | parse request, call service, shape response | import a model, branch on business rules |
| **Service** | business logic, orchestration, permissions | import a model or touch `req`/`res` |
| **Repository** | Mongoose queries | contain business logic |

The practical test: a service must be callable from a cron job with no `req`. If it
isn't, logic has leaked into the controller.

`modules/seo/` is the reference implementation — all six files, and the one to copy
when converting the next module.

## Layout

```
Backend/
├── config/           db, passport, swagger
├── middleware/       auth, validate, errorHandler, rateLimiter, tracking
├── models/           Mongoose schemas only (+ models/cms/ for the CMS)
├── modules/          ← layered modules (the target pattern)
│   ├── health/       health.routes.js
│   └── seo/          controller · service · repository · routes · validation · schema
├── controllers/      ← legacy flat controllers, migrating
├── routes/           ← legacy route files, migrating
├── metricServices/   audit engine — exempt, see above
├── services/         cross-cutting services (config, CMS scoring)
├── utils/            apiResponse, logger, browser pool, WAF guard …
└── workers/          audit pipeline workers

Frontend/src/
├── Component/        shared components (+ Component/seo/ feature folder)
├── Pages/            route-level pages
├── config/           seoConfig.js — the SEO source of truth
├── context/          Auth, Data, Theme
├── hooks/            data hooks (useSeoDashboard …)
└── utils/            helpers
```

## Conventions

- **ES Modules everywhere.** `"type": "module"`; no `require`.
- **Responses** go through `utils/apiResponse.js` — `sendSuccess` / `sendCreated` /
  `sendError`. Controllers do not hand-roll `res.json()`.
- **Errors** are thrown, never returned. `AppError(message, status)` for expected
  failures; anything else becomes a 500 with a generic message and a full log.
- **Validation** is a Zod schema per route via `middleware/validate.js`. Schemas use
  `.strict()`, so an unknown key is rejected rather than ignored — that is what stops
  a client writing a server-derived field like `keywordSeo.presence`.
- **Versioning**: new endpoints mount under `/api/v1`. Legacy mounts stay until migrated.

## Docs and health

- Swagger UI: `/api-docs`, generated from `@openapi` blocks on the route files so it
  cannot drift from the routes.
- Health: `GET /api/v1/health` — returns **503, not 200**, when Mongo is unreachable.
  A health check that reports healthy during a database outage turns an outage into a
  silent one.

## Running it

```bash
docker compose up          # mongo + api + web
# or
cd Backend  && npm run dev
cd Frontend && npm run dev
```

Copy `Backend/.env.example` to `Backend/.env` first — it lists every key the code
reads, generated from the actual `process.env` and `getConfig()` call sites.

## Deployment

Push to `main`. `Backend/**` deploys the API to Azure App Service via ACR;
`Frontend/**` deploys the Static Web App. Both workflows authenticate to Azure by
OIDC federated credential — no secrets in the repo. See the workflow files for the
path filters, which are load-bearing.
