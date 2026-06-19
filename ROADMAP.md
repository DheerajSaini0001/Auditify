# 🚀 Auditify — Master Implementation Roadmap

> **Source Documents:** `new.txt`, `Automotive_Dealer_Website_Audit_Framework.docx`, `Dealership Audit.docx`
> **Generated:** 2026-06-08 | **Status:** PLANNING

---

## Phase 0 — Infrastructure Hardening & Critical Fixes
> **Priority:** 🔴 CRITICAL | **Estimated Effort:** 3–5 days
> **Rationale:** Must stabilize the platform before adding new features.

### TASK-001: Remove Mandatory Login Requirement
- **Source:** `new.txt` line 35
- **Files:** `Backend/middleware/auth.js`, `Backend/routes/singleAuditRoutes.js`, `Frontend/src/Component/GuestReportPage.jsx`, `Frontend/src/Component/ReportRestrictionWrapper.jsx`, `Frontend/src/AppContent.jsx`
- **Current State:** Audit start (`/single-audit/audit`) uses `tryAuthenticate` (optional auth ✅), but PDF export (`/:id/export/pdf`) requires `verifyToken` (mandatory). Report detail pages wrap in `GuestRouteWrapper` → shows blurred lock card for unauthenticated users.
- **Required Changes:**
  1. Remove blurred lock gate on report pages — show full report to all users
  2. Replace login-gated PDF download with **email-gate**: user enters email → receives download link or direct download
  3. Add new `POST /api/report/:id/request-download` endpoint: validates email, logs it, returns signed PDF URL
  4. Create `EmailGateModal` component on frontend to replace `LoginOverlay`
  5. Remove `verifyToken` from PDF export route; add email-based access instead
  6. Keep `tryAuthenticate` on audit routes for optional user association
- **Dependencies:** None — can start immediately

### TASK-002: Worker Crash Recovery & Audit Retry System
- **Source:** `new.txt` lines 47–49
- **Files:** `Backend/controllers/singleAuditController.js`, `Backend/workers/singleAuditWorker.js`, `Backend/utils/workerPool.js`
- **Current State:** Worker has `safeMetric()` wrapper, watchdog timeout (5 min), and exit handler that marks failed reports. But: no automatic retry, no dead-letter queue, no recovery from OOM kills.
- **Required Changes:**
  1. Add `retryCount` field to `SingleAuditReport` model (default: 0, max: 2)
  2. In controller's `worker.on("exit")` handler: if code ≠ 0 and retryCount < 2, spawn a new worker
  3. Add `workerQueue` using BullMQ (already in `package.json`) with Redis/IORedis (already in deps) for persistent queue management
  4. Implement dead-letter tracking: after max retries, mark report as `failed_permanent`
  5. Add exponential backoff between retries (5s, 15s)
  6. Add admin dashboard widget showing queue depth and failed audits
- **Dependencies:** None

### TASK-003: Parallel Execution Architecture
- **Source:** `new.txt` line 50
- **Files:** `Backend/workers/singleAuditWorker.js`, `Backend/utils/workerPool.js`, `Backend/controllers/singleAuditController.js`
- **Current State:** Single process → Worker Threads (1 per audit) → parallel metric execution within worker (6 metrics parallel, security sequential). `MAX_CONCURRENT_BROWSERS=4` caps concurrency.
- **Required Changes:**
  1. Refactor into: **API Process** → **BullMQ Queue** → **Worker Process(es)**
  2. Each worker process runs its own browser pool, processes audit jobs from queue
  3. Within each audit: implement **nested worker threads** for each category (reduces overall time)
  4. Implement `scripts/startApi.js` and `scripts/startWorker.js` properly (stubs exist in `package.json`)
  5. Move from process-level `workerPool.js` semaphore to Redis-backed concurrency with BullMQ
- **Dependencies:** TASK-002 (queue system)

### TASK-004: Browser/Page Pooling for XSS Scans
- **Source:** `new.txt` line 51
- **Files:** `Backend/metricServices/securityCompliance.js`, `Backend/utils/puppeteer_cheerio.js`
- **Current State:** Each XSS test launches a new browser page with a 30-second timeout (noted in `new.txt` line 28). This is extremely slow and resource-heavy.
- **Required Changes:**
  1. Create `BrowserPool` class: pre-launches N browser instances, reuses pages
  2. XSS scans check out a page from pool, run test, return page
  3. Add pool warm-up on worker start, graceful shutdown on exit
  4. Share pool across security scans within the same audit worker
- **Dependencies:** TASK-003 (worker architecture)

---

## Phase 1 — New Audit Parameters & Metric Enhancements
> **Priority:** 🟠 HIGH | **Estimated Effort:** 8–12 days
> **Rationale:** Core value proposition — the new parameters from the Framework document.

### TASK-005: AIO/AEO/GEO Readiness Enhancements
- **Source:** `new.txt` lines 4, `Dealership Audit.docx` lines 1447–1524
- **Files:** `Backend/metricServices/aioReadiness.js`, `Backend/metricServices/aeoService.js`, `Backend/metricServices/signals/*`
- **Current State:** AIO Readiness and AEO Service exist. Signals: `answerFirst.js`, `botAccess.js`, `citations.js`, `llmsTxt.js`, `markdownHeaders.js`, `schemaMarkup.js`, `structuredContent.js`.
- **Required New Sub-signals:**
  1. **Knowledge Graph Presence** — check if brand appears in Google Knowledge Graph
  2. **Content NLP Friendliness** — readability score optimized for AI parsing
  3. **Topical Authority Score** — measure depth of content across topic clusters
  4. **E-E-A-T Signal Scoring** (consolidated from TASK-010)
  5. **GEO (Generative Engine Optimization)** — new signal category for Gemini/ChatGPT/Perplexity discoverability
  6. **AI Discoverability Score** — check if site appears in AI search results (Perplexity, ChatGPT browse)
- **Dependencies:** None

### TASK-006: Advanced Content Relevance Scoring
- **Source:** `new.txt` line 5, `Dealership Audit.docx` lines 1122–1134
- **Files:** `Backend/metricServices/seoMetrics.js` (new section), new file `Backend/metricServices/signals/contentRelevance.js`
- **Required Changes:**
  1. **Content Depth Analysis** — word count, unique copy detection, boilerplate ratio
  2. **Content Uniqueness** — MD5 hash comparison across VDPs for duplicate detection
  3. **Content Freshness** — `<lastmod>` analysis, date extraction from page content
  4. **Local Relevance** — city/area keyword density in copy and metadata
  5. **VDP Description Quality** — per `Framework` parameters #4 and #5 (150+ words, no Lorem Ipsum, readability score)
  6. **Topic Clustering** — detect internal links forming topic groups
- **Dependencies:** None

### TASK-007: Contextual Link Analysis
- **Source:** `new.txt` lines 6, 19, `Dealership Audit.docx` lines 1131–1134
- **Files:** New file `Backend/metricServices/signals/contextualLinks.js`, update `Backend/metricServices/seoMetrics.js`
- **Required Changes:**
  1. **Internal Linking Density** — avg links per page, orphan page detection
  2. **Related Content Linking** — detect if blog/service pages link to inventory/VDPs
  3. **Topic Clustering via Links** — group pages by internal link patterns
  4. **Anchor Text Analysis** — keyword relevance of internal anchor text
  5. **Broken Link Detection** — HEAD request sample of internal links
- **Dependencies:** None

### TASK-008: sameAs Authority Validation
- **Source:** `new.txt` line 7, `Dealership Audit.docx` lines 1187–1194
- **Files:** New file `Backend/metricServices/signals/sameAsValidation.js`, update `Backend/metricServices/seoMetrics.js`
- **Required Changes:**
  1. Extract `sameAs` URLs from JSON-LD `Organization`/`LocalBusiness` schema
  2. Validate each `sameAs` URL resolves (HEAD request → 200)
  3. Verify profile consistency (name match across social profiles)
  4. Score based on: count of valid profiles, platform diversity (Google, Facebook, LinkedIn, Yelp, DealerRater)
- **Dependencies:** None

### TASK-009: LLMs.txt Quality Scoring Enhancement
- **Source:** `new.txt` line 8
- **Files:** `Backend/metricServices/signals/llmsTxt.js`
- **Current State:** Already implemented with 5 cases (missing, empty, unverifiable, poor match, good match). Has intrinsic quality check and UI content matching.
- **Required Enhancements:**
  1. Add **full llms.txt spec compliance check** — required sections per the llms.txt standard
  2. Add **llms-full.txt** detection (companion file)
  3. Add **freshness check** — HTTP Last-Modified / ETag headers
  4. Improve content match: use TF-IDF instead of simple keyword overlap
  5. Score breakdown: existence (25%), structure (25%), content quality (25%), UI alignment (25%)
- **Dependencies:** None

### TASK-010: Citation & Backlink Analysis
- **Source:** `new.txt` lines 9–13, `Dealership Audit.docx` lines 1175–1178, 1467–1470
- **Files:** `Backend/metricServices/signals/citations.js` (enhance), new file `Backend/metricServices/signals/backlinkAnalysis.js`
- **Current State:** `citations.js` does basic external link counting and reference section detection.
- **Required Enhancements:**
  1. **Outbound Citation Quality** — classify external links (authoritative sources vs. random), domain authority heuristic
  2. **Backlink Metrics** — integrate with Moz/Ahrefs API (or free alternatives) for domain authority, backlink count
  3. **Citation Consistency** — NAP consistency check across external profiles
  4. **Brand Mention Detection** — search for brand mentions without links (unlinked citations)
  5. **External Citation Metrics** — how many external sites link back (reciprocal analysis)
- **Dependencies:** API keys for backlink services (optional — can use crawl-based heuristics as fallback)

### TASK-011: E-E-A-T Scoring Engine
- **Source:** `new.txt` line 11, `Dealership Audit.docx` lines 1189–1194, 1504–1524
- **Files:** New file `Backend/metricServices/signals/eeatScoring.js`
- **Required Implementation:**
  1. **Experience** — first-hand expertise signals (case studies, testimonials, staff bios)
  2. **Expertise** — author profiles, credentials, "About Us" quality
  3. **Authoritativeness** — backlink profile, mentions, industry awards
  4. **Trustworthiness** — SSL, privacy policy, contact info, citation transparency
  5. Composite E-E-A-T score weighted across all 4 dimensions
  6. Integration into AIO Readiness overall score
- **Dependencies:** TASK-010 (backlink data feeds into Authority score)

### TASK-012: Security & Compliance Enhancements
- **Source:** `new.txt` lines 26–28, `Dealership Audit.docx` lines 1252–1319
- **Files:** `Backend/metricServices/securityCompliance.js`
- **Current State:** Already implemented (~49KB): SSL, headers, XSS, SQL injection, Safe Browsing, cookie analysis.
- **Required Enhancements:**
  1. **MFA Detection Improvements** — detect MFA prompts on admin/login pages more reliably
  2. **XSS Scan Performance** — use browser pool instead of per-test browser launch (linked to TASK-004)
  3. **Analytics & Tracking Detection** — GA4, GTM, conversion tracking, call tracking scripts
  4. **CRM Integration Detection** — identify CRM vendor scripts (VinSolutions, DealerSocket, eLead)
  5. **Automotive Compliance** — TCPA, CAN-SPAM, dealer license, Reg Z disclosure detection
  6. **FTC Disclosure Detection** — price disclaimers, finance disclosures, trade-in disclaimers
- **Dependencies:** TASK-004 (for XSS performance), rest can proceed independently

### TASK-013: Accessibility Enhancements
- **Source:** `new.txt` line 23, `Dealership Audit.docx` lines 1204–1251
- **Files:** `Backend/metricServices/accessibilityMetrics.js`
- **Current State:** Uses axe-core for WCAG 2.1 compliance checking (~26KB).
- **Required Enhancements:**
  1. **Color Contrast AI Summary Issue** — fix the AI summary generation for color contrast failures (mentioned as bug in `new.txt` line 23)
  2. Enhance reporting with specific WCAG success criterion references
  3. Add interactive element affordance checks
  4. Add skip link detection
- **Dependencies:** None

---

## Phase 2 — Dealer-Specific Audit Framework (New Parameters from Framework Doc)
> **Priority:** 🟠 HIGH | **Estimated Effort:** 10–15 days
> **Rationale:** The 32-parameter automotive dealer framework is the core differentiator.

### TASK-014: Sitemap Evaluation Protocol
- **Source:** `Framework` Section 1.2
- **Files:** `Backend/utils/sitemapCrawler.js` (enhance), new file `Backend/metricServices/dealerMetrics/sitemapEvaluation.js`
- **Required Implementation:**
  1. Sitemap existence check (fetch `/sitemap.xml`, `/sitemap_index.xml`)
  2. Sitemap freshness (check `<lastmod>` tags — flag if >7 days for inventory)
  3. URL count validation (20+ URLs; <10 = critical fail)
  4. Broken link sampling (HEAD request 10% of URLs)
  5. Image sitemap detection
  6. Inventory URL presence in sitemap
  7. Hreflang/alternate tag detection
- **Dependencies:** None

### TASK-015: Crawlable Dealer Parameters (1–23)
- **Source:** `Framework` Section 2 — all 23 directly crawlable parameters
- **Files:** New directory `Backend/metricServices/dealerMetrics/` with individual files per parameter group
- **Required Implementation (grouped by complexity):**

  **Group A — Site Architecture & Navigation (Parameters 1–3):**
  1. `siteArchitecture.js` — Nav completeness, footer links, breadcrumbs, schema, internal linking density, orphan page detection
  2. `clickDepth.js` — Click depth from homepage to core pages, URL path depth analysis
  3. `urlHierarchy.js` — URL pattern consistency, VIN in VDP URLs, no session params, lowercase-only

  **Group B — Inventory & Content (Parameters 4–7):**
  4. `inventoryContent.js` — VDP spec extraction (15 sub-params: Year/Make/Model, trim, mileage, engine, drivetrain, colors, fuel/MPG, VIN, stock#, price, photos, 360°, condition, availability, features)
  5. `vdpDescriptions.js` — Word count, uniqueness (MD5), local relevance, readability, placeholder detection
  6. `serviceContent.js` — Service landing page, sub-pages, scheduler, specials, FAQ, parts, hours
  7. `blogContentHub.js` — Blog existence, post count, recency, categories, author attribution, internal links, schema

  **Group C — Local & Location (Parameters 8–10):**
  8. `localLandingPages.js` — City-targeted pages, unique content per location, local keywords, NAP consistency, LocalBusiness schema
  9. `locationPages.js` — Contact page, address, map embed, hours, phone numbers, schema
  10. `clickToCall.js` — `tel:` href detection, consistency, schema telephone property

  **Group D — Lead Flow & Conversion (Parameters 11–15):**
  11. `tradeInFlow.js` — Trade-in page, 3P tool integration, CTAs, form fields, mobile optimization
  12. `financeFlow.js` — Finance page, secure form, credit app completeness, VDP CTAs, FAQ
  13. `appointmentBooking.js` — Scheduler presence, date picker, vehicle info, service type selection
  14. `chatbot.js` — Chat widget detection, vendor identification, VDP persistence, mobile, off-hours
  15. `financeCalculator.js` — Calculator presence, fields, real-time calc, VDP integration

  **Group E — Search & Filtering (Parameters 16–19):**
  16. `siteSearch.js` — Search input detection, result quality, autocomplete, no-results UX
  17. `inventoryFiltering.js` — Filter dimensions, URL-based filters, dynamic count, clear-all
  18. `vdpLayout.js` — Hero image placement, price above fold, CTA prominence, specs table, related vehicles
  19. `noResultsUX.js` — Custom no-results page, suggestions, lead capture, contact CTA

  **Group F — Trust & Compliance (Parameters 20–23):**
  20. `staffProfiles.js` — Team page, profiles with photo/name/role/bio, contact links, Person schema
  21. `reviewWidget.js` — Review widget detection, Google attribution, rating/count, recency, AggregateRating schema
  22. `ftcDisclosures.js` — Price disclaimers, finance disclosures, privacy policy, cookie consent
  23. `vehicleHistory.js` — CARFAX/AutoCheck badge, functional links, VIN-specific reports

- **Dependencies:** TASK-014 (sitemap data feeds into several parameters)

### TASK-016: Partially Crawlable Parameters (24–31)
- **Source:** `Framework` Section 3
- **Files:** New files in `Backend/metricServices/dealerMetrics/`
- **Required Implementation:**
  24. `oemCompliance.js` — CSS font check, logo validation, incentives page, CPO representation (crawlable portion)
  25. `reviewFreshness.js` — On-site review widget date parsing, Google Places API integration
  26. `photoQualityAudit.js` — VDP photo count, image dimensions, stock photo domain detection
  27. `inventoryFeedSpeed.js` — Sitemap `<lastmod>` age, inventory count comparison, feed provider detection
  28. `dealerRaterReviews.js` — DealerRater badge detection, profile scraping
  29. `gbpOptimization.js` — Google Places API integration, NAP comparison
  30. `crmIntegration.js` — CRM script fingerprint detection, form action URL analysis
  31. `automotiveCompliance.js` — Dealer license, TCPA, CAN-SPAM, ADA/WCAG, state-specific disclosures
- **Dependencies:** API keys for Google Places (for parameters 25, 29)

### TASK-017: Dealer Scoring Engine
- **Source:** `Framework` Section 4 — Master Parameter Scoring Reference
- **Files:** New file `Backend/metricServices/dealerMetrics/scoringEngine.js`
- **Required Implementation:**
  1. Implement weighted scoring across all 32 parameters (total 300 points)
  2. Grade calculation: Excellent (270–300), Good (230–269), Average (180–229), Poor (0–179)
  3. Per-parameter priority classification (Critical, High, Medium)
  4. Overall dealer audit score separate from existing 7-pillar score
  5. Integration with existing `OverAll()` function or new parallel scoring path
- **Dependencies:** TASK-015, TASK-016

---

## Phase 3 — Dual Report Generation & UI
> **Priority:** 🟡 MEDIUM-HIGH | **Estimated Effort:** 5–8 days
> **Rationale:** Business-critical feature for user-facing value.

### TASK-018: Dual Report System (Dealer vs Developer)
- **Source:** `new.txt` lines 36–45
- **Files:** `Backend/controllers/pdfController.js`, new file `Backend/services/reportGenerator.js`, Frontend report pages
- **Required Implementation:**

  **Dealer Report:**
  1. Business-focused insights — plain language explanations
  2. Simple recommendations — prioritized action items with estimated impact
  3. Executive summary — overall score, top 3 wins, top 3 risks
  4. Visual dashboard with charts (existing Recharts infrastructure)

  **Developer Report:**
  1. Technical findings — code-level details, specific element selectors
  2. Code-level recommendations — exact fixes with examples
  3. Implementation guidance — priority order with score-increase estimates
  4. Email-based report retrieval (linked to TASK-001 email gate)
  5. Detailed metric breakdowns with raw data

- **Dependencies:** TASK-001 (email gate for report access)

### TASK-019: Update & Merge UI
- **Source:** `new.txt` line 52
- **Files:** All `Frontend/src/Pages/*.jsx` and `Frontend/src/Component/*.jsx`
- **Required Changes:**
  1. Integrate new dealer-specific metric pages into the report layout
  2. Add dealer audit report section to `DashboardPage.jsx`
  3. Create new `DealerScoreCard` component for the 32-parameter breakdown
  4. Update `Sidebar.jsx` with new navigation items for dealer metrics
  5. Update `ReportLayout.jsx` to support Dealer vs Developer view toggle
  6. Add parameter drill-down pages for each of the 32 dealer parameters
  7. Ensure all new components follow existing Tailwind CSS 4 + Framer Motion patterns
- **Dependencies:** TASK-017 (dealer scoring data), TASK-018 (dual report structure)

### TASK-020: Make It Dealer-Specific
- **Source:** `new.txt` line 53
- **Files:** Frontend landing page, input form, backend audit flow
- **Required Changes:**
  1. Auto-detect dealer type from URL (franchise, used, multi-brand, EV) using schema/content analysis
  2. Tailor parameter weights based on dealer type
  3. Dealer-specific recommendations based on classification
  4. Industry benchmark comparisons ("Your VDP score vs. average franchise dealer")
  5. Dealer-specific terminology in reports
- **Dependencies:** TASK-015, TASK-017

### TASK-021: Change Default Mode to Mobile
- **Source:** `new.txt` line 54
- **Files:** `Frontend/src/Component/InputForm.jsx`, `Backend/controllers/singleAuditController.js`
- **Required Changes:**
  1. Change default `device` selection from "Desktop" to "Mobile" in `InputForm.jsx`
  2. Update any backend defaults that assume Desktop
  3. Update UI to show Mobile-first in device toggle
- **Dependencies:** None — trivial change

---

## Phase 4 — Reporting Infrastructure
> **Priority:** 🟡 MEDIUM | **Estimated Effort:** 3–5 days

### TASK-022: Email-Based Report Retrieval
- **Source:** `new.txt` line 45
- **Files:** `Backend/utils/sendEmail.js`, `Backend/controllers/pdfController.js`, new endpoint
- **Required Implementation:**
  1. `POST /api/report/:id/email` — validate email, generate PDF, send via Nodemailer
  2. Email template with branding (Auditify/DealerPulse header)
  3. Option to send Dealer Report or Developer Report (or both)
  4. Rate limit email sending (max 3 per audit per hour)
  5. Track email sends in AuditLog
- **Dependencies:** TASK-001, TASK-018

### TASK-023: Enhanced PDF Report Generation
- **Source:** `Dealership Audit.docx` — Audit Explainability Framework
- **Files:** `Backend/controllers/pdfController.js`, `Frontend/src/utils/` (PDF generation utilities)
- **Required Enhancements:**
  1. For every finding include: What was detected, Why it matters, Impact level, Evidence, Recommended fix, Estimated business impact
  2. Add the 32-parameter dealer scoring breakdown to PDF
  3. Add dealer type classification section
  4. Add trend/comparison data if previous audits exist
- **Dependencies:** TASK-017, TASK-018

---

## Phase 5 — Polish & Advanced Features
> **Priority:** 🟢 MEDIUM-LOW | **Estimated Effort:** 5–8 days

### TASK-024: Deep Link Sampling & VDP Extraction
- **Source:** `Framework` Section 1.1 Steps 4–5
- **Files:** `Backend/utils/sitemapCrawler.js`, new file `Backend/metricServices/dealerMetrics/deepLinkSampler.js`
- **Required Implementation:**
  1. Follow 3–5 links per major category (Inventory, Service, Finance, About)
  2. Pull 5–10 live VDPs from sitemap for content analysis
  3. Calculate click-depth for each sampled page
  4. Feed results into parameters 1–5 and 18
- **Dependencies:** TASK-014, TASK-015

### TASK-025: Audit Explainability for AI Summary
- **Source:** `Dealership Audit.docx` — Audit Explainability Framework
- **Files:** `Frontend/src/Component/AISummaryBlock.jsx`, `Backend/routes/aiExplainRoutes.js`
- **Required Changes:**
  1. Enhance AI explanations to follow the 6-point framework (What, Why, Impact, Evidence, Fix, Business Impact)
  2. Add per-parameter AI explanations for the 32 dealer parameters
  3. Improve prompt engineering for dealer-specific context
- **Dependencies:** TASK-015, TASK-016

### TASK-026: Admin Dashboard Enhancements
- **Source:** Various — operational visibility
- **Files:** `Frontend/src/Pages/AdminDashboard.jsx`, `Backend/controllers/adminController.js`
- **Required Changes:**
  1. Add audit queue depth and status widget (from TASK-002 queue system)
  2. Add failed audit list with retry button
  3. Add API key configuration for external services (Google Places, backlink APIs)
  4. Add dealer type analytics (what types of dealers are being audited)
- **Dependencies:** TASK-002, TASK-003

### TASK-027: MongoDB Optimization
- **Source:** Existing technical debt (SRS_MongoDB_Fix.docx)
- **Files:** `Backend/models/singleAuditReport.js`, `Backend/config/db.js`
- **Required Changes:**
  1. Review and optimize indexes for query patterns
  2. Add compound indexes for common admin queries
  3. Consider TTL index tuning (currently 10800s = 3 hours)
  4. Add connection pool sizing recommendations for production
- **Dependencies:** None

---

## Dependency Graph

```
TASK-001 (Remove Login) ──────────────────────────┐
                                                   ├──→ TASK-018 (Dual Reports) ──→ TASK-019 (Merge UI)
TASK-002 (Crash Recovery) ──→ TASK-003 (Parallel) ─┤                                    ↑
                                  ↓                │                                    │
                           TASK-004 (Browser Pool)  │    TASK-015 (Crawlable Params) ───┤
                                  ↓                │         ↓                          │
                           TASK-012 (Security+)    │    TASK-017 (Scoring Engine) ──────┤
                                                   │         ↑                          │
TASK-005–011 (New Signals) ────────────────────────┘    TASK-016 (Partial Params) ──────┘
                                                              ↓
TASK-014 (Sitemap) ──→ TASK-015, TASK-024                TASK-020 (Dealer Specific)
                                                              ↓
TASK-021 (Mobile Default) ── Independent              TASK-022, TASK-023 (Reporting)
TASK-013 (A11y) ── Independent
TASK-027 (MongoDB) ── Independent
```

---

## Execution Priority Order

| Order | Task | Name | Priority | Dependencies |
|-------|------|------|----------|--------------|
| 1 | TASK-021 | Change Default to Mobile | 🟢 Quick Win | None |
| 2 | TASK-001 | Remove Mandatory Login | 🔴 Critical | None |
| 3 | TASK-002 | Worker Crash Recovery | 🔴 Critical | None |
| 4 | TASK-013 | Accessibility Fixes | 🟠 High | None |
| 5 | TASK-003 | Parallel Architecture | 🔴 Critical | TASK-002 |
| 6 | TASK-004 | Browser Pool | 🔴 Critical | TASK-003 |
| 7 | TASK-005 | AIO/AEO/GEO | 🟠 High | None |
| 8 | TASK-006 | Content Relevance | 🟠 High | None |
| 9 | TASK-007 | Contextual Links | 🟠 High | None |
| 10 | TASK-008 | sameAs Validation | 🟠 High | None |
| 11 | TASK-009 | LLMs.txt Enhancement | 🟠 High | None |
| 12 | TASK-010 | Citation/Backlink | 🟠 High | None |
| 13 | TASK-011 | E-E-A-T Scoring | 🟠 High | TASK-010 |
| 14 | TASK-012 | Security Enhancements | 🟠 High | TASK-004 |
| 15 | TASK-014 | Sitemap Evaluation | 🟠 High | None |
| 16 | TASK-015 | Crawlable Params (23) | 🟠 High | TASK-014 |
| 17 | TASK-016 | Partial Params (8) | 🟠 High | API Keys |
| 18 | TASK-017 | Dealer Scoring Engine | 🟠 High | TASK-015, 016 |
| 19 | TASK-018 | Dual Reports | 🟡 Medium-High | TASK-001 |
| 20 | TASK-019 | Merge UI | 🟡 Medium-High | TASK-017, 018 |
| 21 | TASK-020 | Dealer Specific | 🟡 Medium-High | TASK-015, 017 |
| 22 | TASK-022 | Email Reports | 🟡 Medium | TASK-001, 018 |
| 23 | TASK-023 | Enhanced PDF | 🟡 Medium | TASK-017, 018 |
| 24 | TASK-024 | Deep Link Sampling | 🟢 Medium-Low | TASK-014, 015 |
| 25 | TASK-025 | AI Explainability | 🟢 Medium-Low | TASK-015, 016 |
| 26 | TASK-026 | Admin Dashboard | 🟢 Medium-Low | TASK-002, 003 |
| 27 | TASK-027 | MongoDB Optimization | 🟢 Medium-Low | None |
