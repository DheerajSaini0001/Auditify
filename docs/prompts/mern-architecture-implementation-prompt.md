# MERN Stack — Production Architecture Implementation Prompt

**Role:** Act as a Senior Software Architect (10+ years, scalable MERN systems). Implement a production-ready MERN application using the **latest stable versions** of React, Node.js, Express.js, and MongoDB, with JavaScript ES Modules throughout (no CommonJS `require`).

**Versioning rule:** Do not hardcode version numbers from memory. Before installing, run `npm view <package> version` (or check `npm outdated` after scaffolding) to confirm the current latest stable release of each dependency, and pin those exact versions in `package.json`.

---

## 1. Root Structure

```
project/
├── client/                 # React app
├── server/                 # Express API
├── docs/                   # Architecture + API docs
├── README.md
├── .gitignore
├── package.json            # root scripts (concurrently run client+server)
└── docker-compose.yml
```

---

## 2. Frontend (`client/src`)

```
src/
├── assets/
├── components/
│   ├── common/              # generic, no feature logic (Button, Modal, Spinner)
│   ├── ui/                  # design-system primitives
│   └── layouts/             # page shells (DashboardLayout, AuthLayout)
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── users/
│   ├── settings/
│   └── notifications/
│       # each feature folder self-contains: components/, hooks/, api.js, slice.js (or context.js), types.js
├── hooks/                   # shared cross-feature hooks
├── context/
├── routes/                  # route definitions, ProtectedRoute, lazy-loaded pages
├── services/                # axios instance + API clients only — no UI code
├── utils/
├── constants/
├── styles/
├── pages/
├── App.jsx
└── main.jsx
```

### Frontend Rules
- React 19 (functional components + hooks only, no class components).
- React Router for routing; all routes lazy-loaded via `React.lazy` + `Suspense`.
- One shared Axios instance in `services/api.js` with request/response interceptors (auth token attach, 401 refresh handling).
- `ProtectedRoute` wrapper component checks auth state before rendering.
- A top-level `ErrorBoundary` wraps the app; feature-level boundaries where useful.
- State: Context API for light global state; Redux Toolkit only if the app needs complex cross-feature shared state — pick one, don't mix both without justification.
- **No business logic inside components.** Components call hooks/services; hooks/services hold the logic.
- Styling: TailwindCSS. Icons: Lucide.
- Each `features/*` folder is self-contained and only imports shared code from `components/common`, `hooks`, `utils` — never reaches into another feature's internals directly.

---

## 3. Backend (`server/src`)

```
src/
├── config/                  # env loader, db config, third-party config
├── database/                # connection setup, migrations/seeders if any
├── middleware/               # auth, error handler, rate limiter, request logger
├── models/                   # Mongoose schemas only
├── modules/
│   ├── auth/
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   ├── auth.repository.js
│   │   ├── auth.routes.js
│   │   ├── auth.validation.js
│   │   └── auth.schema.js
│   ├── users/
│   ├── audit/
│   ├── payments/
│   └── notifications/
│       # every module mirrors the auth/ file set above
├── helpers/
├── utils/
├── jobs/                     # background job definitions (Redis/Bull-ready)
├── sockets/                  # Socket.IO namespaces/handlers (ready structure)
├── validations/
├── app.js                    # express app, middleware wiring, route mounting
└── server.js                 # http server bootstrap, port binding, graceful shutdown
```

### Backend Rules — Strict Layering
Every module (`auth`, `users`, `payments`, etc.) must contain exactly these 6 files: **controller, service, repository, routes, validation, schema**.

**Request flow (never skip a layer):**
```
Route → Controller → Service → Repository → MongoDB
```

| Layer | Allowed to do | NOT allowed to do |
|---|---|---|
| Controller | parse req, call service, shape res | contain business logic, touch models directly |
| Service | business logic, orchestration | talk to MongoDB directly |
| Repository | MongoDB/Mongoose queries only | contain business logic |

No controller may import a Mongoose model directly — it must go through the service → repository chain.

---

## 4. Security Checklist
- `helmet` for HTTP headers
- `cors` configured with an explicit allowed-origins list (no wildcard `*` in production)
- Rate limiter (`express-rate-limit`) on auth and public endpoints
- JWT access token (short-lived) + refresh token (long-lived, httpOnly secure cookie)
- Passwords hashed with `bcrypt` (min. cost factor 10)
- Role-based access control middleware (`requireRole('admin')` style guards)
- All secrets in environment variables — never committed; `.env.example` provided
- Cookies: `httpOnly`, `secure`, `sameSite: 'strict'`
- Input validation on every route (see §6)
- One central error-handling middleware — all `next(err)` calls resolve there

## 5. Logging
- `winston` (or `pino`) for structured app logs — separate files/streams for `error` and `combined`.
- `morgan` for HTTP request logging, piped into the winston stream (not to stdout separately).
- Logs must never contain passwords, tokens, or full card numbers.

## 6. Database & Validation
- MongoDB via Mongoose. Models live only in `models/`.
- Repositories are the only layer allowed to import/query models directly.
- Validation via **Zod** (preferred) or Joi — every route validates `body`/`params`/`query` before hitting the controller logic, via a `validate(schema)` middleware.

## 7. API Response Standard
All success responses:
```json
{
  "success": true,
  "message": "Success",
  "data": {}
}
```
All error responses:
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": []
}
```
Enforce this shape via the central error handler and a shared `sendResponse()` helper — controllers must not hand-roll `res.json()` with a different shape.

## 8. Naming Conventions
- All folders: lowercase, no PascalCase — `auth`, `users`, `payments`, `audit`.
- Files: `<module>.<layer>.js` (e.g. `auth.controller.js`).
- React components: PascalCase filenames (`UserCard.jsx`); everything else in `client` stays camelCase/kebab-case as appropriate.

## 9. Code Style
- ES Modules (`import`/`export`) everywhere, both client and server.
- `async/await` with `try/catch` — no unhandled promise chains.
- Optional chaining / nullish coalescing where it improves safety.
- SOLID, DRY, clean separation of concerns enforced by the layering rules above.
- ESLint + Prettier configured and passing with zero errors before considering a module "done."
- Husky pre-commit hook runs lint + format check.

## 10. Additional Infrastructure
- Swagger/OpenAPI docs served at `/api-docs`
- Docker: separate `Dockerfile` for client and server + root `docker-compose.yml`
- `GET /api/v1/health` health-check endpoint (checks DB connectivity)
- API versioning: all routes mounted under `/api/v1`
- Global error handler + request logger + response logger middleware
- File uploads via `multer` with size/type limits
- Email service module (transactional, provider-agnostic interface)
- Redis-ready structure (`config/redis.js` stub + job queue wiring point)
- Socket.IO-ready structure (`sockets/` with a sample namespace)
- Background-jobs-ready structure (`jobs/` with a sample scheduled/queued job)

## 11. Documentation Deliverables
- `README.md`: project overview, tech stack, prerequisites
- Folder-by-folder explanation (can live in `docs/architecture.md`)
- Installation guide (clone → install → env setup → run)
- `.env.example` listing every required environment variable with a description
- API documentation (Swagger link + brief usage examples)
- Deployment instructions (Docker + manual)

---

## 12. Build Order (execute in this sequence)
1. Scaffold root folder + `.gitignore` + root `package.json` with `concurrently` scripts (`dev`, `client`, `server`).
2. Scaffold `server/`: init Express app, env config, DB connection, health-check endpoint — confirm it boots before adding modules.
3. Build the `auth` module end-to-end (all 6 files + JWT + refresh token) — this validates the layering pattern before replicating it.
4. Add `middleware/` (helmet, cors, rate limiter, error handler, request logger) and wire into `app.js`.
5. Replicate the module pattern for `users`, `audit`, `payments`, `notifications`.
6. Add logging (winston/morgan), Swagger docs, Docker files.
7. Scaffold `client/`: Vite + React 19, Tailwind, routing, Axios instance, `ProtectedRoute`, `ErrorBoundary`.
8. Build the `auth` feature UI end-to-end against the real API before replicating to other features.
9. Build remaining `features/*`.
10. Add ESLint, Prettier, Husky hooks at repo root.
11. Write documentation (`docs/`, `README.md`, `.env.example`).
12. Final pass: run through the Acceptance Checklist below.

## 13. Acceptance Checklist (self-verify before calling any module "done")
- [ ] Module has all 6 required files, no more, no fewer roles blended
- [ ] No controller imports a Mongoose model directly
- [ ] No repository contains business logic
- [ ] Every route has a validation middleware attached
- [ ] Every response (success and error) matches the standard shape in §7
- [ ] Folder names are lowercase, no PascalCase
- [ ] No component in `client` contains business logic beyond calling hooks/services
- [ ] ESLint + Prettier pass with zero warnings
- [ ] `.env.example` is in sync with every `process.env.*` used in the code
- [ ] Health-check endpoint returns 200 with DB status
- [ ] Swagger docs reflect all implemented routes

---

**Goal:** Architecture must scale to millions of users and match patterns used by production-grade product companies — strict layering, no shortcuts, no logic bleeding across layers.
