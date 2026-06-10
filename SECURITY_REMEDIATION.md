# Auditify — Security Remediation

Status of the vulnerability review and fixes. **Code-level critical + high issues have been
fixed in the working tree** (see "Fixed in code" below). The items in sections 1–3 require
**your** action — they touch live credentials, git history, and dependency installs.

---

## 1. URGENT — Rotate the leaked secrets

`Backend/.env` was committed to git history (commits `5d146d02`, `32e62aea`, `e24efd7d`) and only
removed later in `25e7cfe3`. The current tree is gitignored correctly, **but the values are still
recoverable from history** (`git show 5d146d02:Backend/.env`). Treat every secret that ever lived in
that file as compromised and rotate it. Rotation is the real fix — scrubbing history (section 2)
alone is not enough if the repo was ever pushed or cloned.

Rotate each of these, then update your local `Backend/.env` with the new values:

| Secret (env key) | Where to rotate |
|---|---|
| `MONGO_URI` | MongoDB Atlas → Database Access → edit the DB user → **Edit Password** (or create a new user and delete the old). Also tighten the IP allowlist. |
| `API_KEY` (Google PageSpeed) | Google Cloud Console → APIs & Services → Credentials → regenerate / create a new API key, restrict it to the PageSpeed API. |
| `SafeBrowsing` | Google Cloud Console → Credentials → rotate the Safe Browsing key. |
| `GEMINI_API_KEY` | Google AI Studio (aistudio.google.com) → API keys → delete old, create new. |
| `vt_key` (VirusTotal) | VirusTotal → profile → API key → reset. |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → OAuth 2.0 Client → reset secret (update callback URL allowlist while there). |
| `SMTP_PASS` | Your mail provider → revoke the app password / SMTP credential, issue a new one. |
| `JWT_SECRET` | Generate new: `openssl rand -hex 32`. NOTE: rotating this logs out all existing users. |
| `SESSION_SECRET` | Generate new: `openssl rand -hex 32`. |
| `CONFIG_ENCRYPTION_KEY` / `ENCRYPTION_KEY` | Generate new: `openssl rand -hex 32`. **See note below** — re-encrypt stored config. |

**Encryption-key note:** `utils/encryption.js` previously fell back to a key hardcoded in source
(now removed — the app fails to start without `CONFIG_ENCRYPTION_KEY`). If any `PlatformConfig`
values were ever encrypted while the env key was unset, they were encrypted under that public
fallback key and must be re-saved after you set a real key.

---

## 2. Scrub the secrets from git history

After rotating (so the leaked values are already dead), remove `.env` from history. Easiest tool is
`git filter-repo` (install via `pip install git-filter-repo` or `brew install git-filter-repo`):

```bash
# from the repo root, on a clean clone/backup first
git filter-repo --path Backend/.env --invert-paths
```

Or with the BFG:

```bash
bfg --delete-files .env
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

Then force-push (`git push --force` to every remote) and have all collaborators re-clone. This
rewrites history, so coordinate it.

---

## 3. Upgrade vulnerable dependencies

These were flagged by `npm audit` (run it yourself to see current state). They aren't auto-applied
because version bumps can break the build and need testing.

```bash
# Backend
cd Backend
npm audit
npm audit fix
npm i axios@latest mongoose@latest   # axios SSRF/proto-pollution advisories; mongoose $nor NoSQLi

# Frontend
cd ../Frontend
npm audit
npm audit fix
npm i jspdf@latest jspdf-autotable@latest react-router-dom@latest   # jspdf=critical (PDF injection/path traversal); react-router=RCE advisory
```

After upgrading, smoke-test PDF export (jspdf) and routing (react-router) before deploying.

---

## Fixed in code (already applied to the working tree)

| # | Issue | Fix | File(s) |
|---|---|---|---|
| C | SSRF — bypassable hostname blocklist | New DNS-resolving guard that blocks private/reserved/loopback/link-local + cloud-metadata (169.254.169.254), decimal/hex/IPv6/IPv4-mapped encodings, embedded credentials, non-http(s). Applied to every URL-fetching entry point. | `utils/ssrfGuard.js` (new); `controllers/singleAuditController.js`, `bulkAuditController.js`, `aeoController.js` |
| C | `/api/ai/*` & `/api/aeo/*` unauthenticated → billing/LLM abuse, resource drain | Added rate limiters + `tryAuthenticate` so abuse is bounded and per-user ownership applies. | `routes/aiExplainRoutes.js`, `routes/aeoRoutes.js` |
| C | AEO report IDOR (`getAEOReport`) | Fails closed: returns 401 without a user, scopes the query to the owner otherwise. | `controllers/aeoController.js` |
| C | Hardcoded AES key fallback | Removed; app now refuses to start without a valid `CONFIG_ENCRYPTION_KEY`. | `utils/encryption.js` |
| H | `updateProfile` leaked password hash + OAuth tokens | Returns only safe whitelisted fields; validates name. | `controllers/userController.js` |
| H | Single-audit rate limit was `max: 500000` | Set to `20` per 15 min (each audit spawns a Chromium worker). | `routes/singleAuditRoutes.js` |
| H | `isBlocked` never enforced | Blocked users rejected at login and in `verifyToken` (also refreshes role from DB, fixing stale-role tokens). | `controllers/authController.js`, `middleware/auth.js` |
| H | Admin search `$regex` injection / ReDoS | Escape user input before building the regex. | `controllers/adminController.js` |
| H | Stored XSS in PDF (scanned-site content rendered by `--no-sandbox` Chromium) | HTML-escape every dynamic value (URL, details, cause, recommendation, section names). | `controllers/pdfController.js` |
| H | Screenshot endpoint: no SSRF check, no ownership | Added SSRF validation + owner/admin check. | `controllers/singleAuditController.js` |
| M | OTP via `Math.random()` | Uses `crypto.randomInt`. | `utils/generateOTP.js` |
| M | Session cookie `secure:false`, guessable `SESSION_SECRET` fallback | `secure` gated on `NODE_ENV=production`; refuses to start without a strong `SESSION_SECRET`. | `server.js` |
| M | No-op `adminAuth` placeholder (authorized everyone) | Now fails closed (501) if ever mounted. Not wired into any route. | `middleware/adminAuth.js` |
| H | Auth endpoints had no rate limiting (brute force / email-bomb); the pre-existing `authLimiter` was defined but never applied | Added IP-based limiters — login (10/15m), password reset (5/15m), register (10/h), OTP (20/15m) — and a global per-IP backstop on state-changing requests (300/15m, skips GET polling). All key on `req.ip` (trust proxy is set). | `middleware/rateLimiter.js`, `routes/authRoutes.js`, `server.js` |

---

## Residual items — your call (not auto-applied)

1. **Active probing policy (legal/abuse).** `metricServices/securityCompliance.js` fires real SQLi/XSS
   payloads, probes admin paths, and attempts `admin/admin` logins against the target on every audit.
   The new SSRF guard stops these from being aimed at internal/cloud hosts, but scanning **third-party
   public sites** without authorization still carries legal/abuse exposure. Consider gating active
   probing behind proven domain ownership (you already have GSC verification in `websiteController.js`),
   or restricting it to opt-in.

2. **DNS-rebinding residual.** The guard resolves and validates at request time, but axios/Puppeteer
   re-resolve independently, so a TTL-0 rebind is still theoretically possible. Full fix: route all
   audit egress through a forward proxy that pins/validates the resolved IP. Low real-world likelihood;
   the direct-IP / internal-hostname / metadata vectors (the common ones) are now closed.

3. **OAuth token in URL fragment.** `googleCallback` redirects with `#token=<jwt>` and the frontend
   stores it in `localStorage`. Consider delivering the token via an httpOnly, Secure, SameSite cookie
   instead. (No active XSS sink was found — `formatMarkdown` escapes its input — so this is hardening,
   not an open hole.)

4. **CORS/CSP localhost entries** in `server.js` (`http://localhost:*`, `ws://localhost:2000`) should be
   dropped in production builds.

5. **Mixed-content / site-wide HTTPS** check (`securityCompliance.checkHTTPS`) only inspects the target
   URL, not sub-resources — enhancement, not a vuln in this app.

---

## Verification done

- SSRF guard unit-tested against 20+ bypass cases (metadata IP, decimal/hex/IPv6/IPv4-mapped encodings,
  credentials trick, non-http schemes) — all blocked; public IPs allowed.
- All 15 modified backend files pass `node --check`; runtime import smoke test passes.
- The frontend markdown→`dangerouslySetInnerHTML` path was reviewed and is **not** XSS-exploitable
  (input is escaped before any tags are added).
