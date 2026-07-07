# How Auditify Scores Are Calculated

**Date:** 7 July 2026
**Scope:** the complete scoring pipeline — from individual parameter checks up to the site-wide overall score. Companion to `SCORING_FORMAT.md` (which records *why* the current formats were chosen).

---

## 0. The scoring pipeline at a glance

Scores roll up through **four levels**. Each level has its own weighting model:

```
Level 1  PARAMETER score (0–100)      e.g. Meta_Title = 85, CSP = 0
              │  weighted per section's model
              ▼
Level 2  SECTION score (Percentage)   e.g. On-Page SEO = 74, Security = 61
              │  weighted per PAGE TYPE (spec §5.6)
              ▼
Level 3  PAGE score                    e.g. the VDP scores 68.4
              │  weighted per PAGE IMPORTANCE (spec §5.5)
              ▼
Level 4  OVERALL site score            e.g. dealer site = 71 → grade "B"
```

| Level | Formula family | Where in code |
|---|---|---|
| Parameter | binary / graded / ratio / probe (0–100 each) | each `Backend/metricServices/*.js` check function |
| Section | weighted average **or** deduction model (per section, below) | end-of-file aggregator in each metric service |
| Page | `Σ(section% × w_section(pageType)) / Σw` | [sectionWeights.js:95](Backend/utils/sectionWeights.js:95) `computePageScore`, [singleAuditWorker.js:146](Backend/workers/singleAuditWorker.js:146) `OverAll` |
| Overall | `Σ(page_score × importance) / Σ(importance)` | [AuditSummaryPage.jsx:179](Frontend/src/Pages/AuditSummaryPage.jsx:179) |

**Grade bands** (used at page and overall level):

| Score | ≥90 | 80–89 | 70–79 | 60–69 | 50–59 | <50 |
|---|---|---|---|---|---|---|
| Grade | A+ | A | B | C | D | F |

**UI colour bands** (score/status cards): `<25` Red · `25–74` Orange · `≥75` Green.

---

## 1. How each PARAMETER is calculated

Every parameter produces a `score` (0–100), a `status` (`pass` / `warning` / `fail`), details, cause and recommendation. Four scoring shapes are used:

| Shape | How it scores | Example |
|---|---|---|
| **Binary** | present & correct = 100, present-but-flawed = 50, absent = 0 | Canonical tag, Trust badges, Cookie consent |
| **Graded / stepped** | fixed steps against a published threshold | Redirect chains (0 hops=100, 1=85, 2=60, ≥3 decays); sameAs breadth (≥3 links=100, 2=80, 1=60, 0=0) |
| **Ratio** | `passing elements ÷ applicable elements × 100` | Image alt coverage, % of sections with headings |
| **Curve / probe** | value mapped through an official curve or an external API | Core Web Vitals via Lighthouse log-normal curves; Reputation via Safe Browsing + VirusTotal |

Rules that apply to **every** parameter (spec + `SCORING_FORMAT.md` §7):

1. **Absence scores 0, not 50.** A missing feature (no FAQ blocks, no timestamp, no sitemap) is 0. Warnings (50) are reserved for "present but flawed".
2. **N/A renormalization (rule 6).** A parameter with nothing to measure on the page (e.g. Form Labels on a page with no forms) returns `notCalculated` and is **dropped from the denominator** — it neither helps nor hurts.
3. **Crashed probe ≠ pass.** A probe that crashes or times out returns `score: null, notCalculated: true` and is renormalized out — never a fake neutral 50.
4. **Info-only parameters carry zero weight.** They are displayed (with View Details + info button) but never move the section score.
5. **Confidence flag** per parameter: `field` (real-user / external API) > `measured` (headers, certs, lab run) > `heuristic` (DOM inference). The section inherits its lowest-confidence input.

---

## 2. How each SECTION is calculated

Three different headline models are in use, chosen so each section cross-checks against its external reference tool (`SCORING_FORMAT.md` Part 2):

| # | Section | Headline model | Reference tool |
|---|---|---|---|
| A | Technical Performance | **Official Lighthouse score** (PSI category score; fallback = Lighthouse metric weights) | PageSpeed Insights |
| B | On-Page SEO | Weighted average, ~24 params | Lighthouse SEO (subset) |
| C | Accessibility | **Deduction from 90** (severity-weighted, per rule) | AccessibilityChecker.org / Lighthouse a11y |
| D | Security/Compliance | **Deduction from 100** in spec points + 2 hard gates | SecurityHeaders.com / Mozilla Observatory |
| E | UX & Content Structure | Weighted average, page-type gated | — (Auditify Index) |
| F | Conversion & Lead Flow | Weighted average, page-type gated | — (Auditify Index) |
| G | AIO Readiness | Weighted average, 8 params | — (Auditify Index) |
| H | AEO | Weighted average, 13 params + 3 platform gauges | — (Auditify Index) |

The weighted-average sections all share one aggregator:

```
Percentage = Σ(parameter score × weight) ÷ Σ(weights of APPLICABLE parameters)
```

N/A / info-only / crashed parameters drop out of both numerator and denominator, so the remaining weights automatically renormalize.

The section-by-section detail (with each parameter's exact weight) is in **§3**, since "how a section is calculated" and "how each parameter contributes to it" are the same table.

---

## 3. How each PARAMETER contributes to its SECTION score

A parameter's effective contribution is `its weight ÷ Σ(weights applicable on that page)`. On pages where page-specific parameters activate (e.g. VDP add-ons), every other parameter's share shrinks proportionally.

### 3.A Technical Performance — [technicalMetrics.js](Backend/metricServices/technicalMetrics.js)

Headline = the **official PSI Lighthouse performance category score** for the audited device. Fallback (when PSI's category score is unavailable) = official Lighthouse metric weights over per-metric scores:

| Metric | Weight |
|---|---|
| Total Blocking Time (TBT, INP proxy) | 30% |
| Largest Contentful Paint (LCP) | 25% |
| Cumulative Layout Shift (CLS) | 25% |
| First Contentful Paint (FCP) | 10% |
| Speed Index (SI) | 10% |

**Info-only (0 weight):** `Delivery_Hygiene` composite (compression, caching, redirects, render-blocking, resource optimization, sold-vehicle pages) and the CrUX field-data panel. They are dealer insights, deliberately kept out of the number people compare to PSI.

### 3.B On-Page SEO — [seoMetrics.js:4634](Backend/metricServices/seoMetrics.js:4634)

Weighted average. Common parameters:

| Parameter | Weight | Parameter | Weight |
|---|---|---|---|
| Canonical | 0.11 | URL_Structure | 0.05 |
| Robots_Txt | 0.08 | Semantic_Tags | 0.05 |
| Image (alt/optimization) | 0.08 | Heading_Hierarchy | 0.04 |
| Title | 0.07 | Contextual_Linking | 0.04 |
| H1 | 0.07 | Title_Uniqueness | 0.03 |
| Meta_Description | 0.06 | Title_Keyword_Optimization | 0.03 |
| Content_Relevance | 0.06 | Meta_Description_Uniqueness | 0.03 |
| | | URL_Slugs | 0.03 |
| | | Links | 0.03 |
| | | Open_Graph | 0.03 |
| | | Viewport | 0.03 |
| | | Title_Location_Optimization | 0.02 |
| | | Twitter_Card | 0.02 |
| | | Social_Links | 0.01 |

Page-type add-ons (only weighted on the relevant page; common params renormalize down):

| Add-on | Page type | Weight |
|---|---|---|
| VDP_Content_Uniqueness (unique vs OEM boilerplate) | VDP | 0.12 |
| SRP_Index_Control (pagination / faceted URLs) | SRP | 0.08 |
| SRP_To_VDP_Links (crawl depth) | SRP | 0.06 |

### 3.C Accessibility — [accessibilityMetrics.js](Backend/metricServices/accessibilityMetrics.js) (deduction model)

```
Percentage = max(0, round(90 − effective deductions))
```

Base is **90** (the last 10 points require manual review — mirrors AccessibilityChecker.org). Parameters don't carry weights; each **failed rule deducts** by severity:

| Impact | Deduction per rule | Widespread (>10 failing nodes) |
|---|---|---|
| Critical | −12 | −18 |
| Serious | −6 | −9 |
| Moderate | −2.5 | −3.75 |
| Minor | −1 | −1.5 |

DOM probes axe can't see: Target Size / Reflow −6 (fail) / −3 (warn); Landmarks / Skip Links / Affordance −2.5 / −1.25; duplicate titles −3; unlabeled PII/finance form fields extra −5. Past 40 raw points, each further point counts **half** (diminishing returns). N/A probes deduct nothing.

**Diagnostic field:** `Graded_Percentage` keeps the old node-ratio model (Critical ×3 / Serious ×2 / Moderate ×1 tier weights, caps 70/85/96) for tracking fix progress.

### 3.D Security/Compliance — [securityCompliance.js:2334](Backend/metricServices/securityCompliance.js:2334) (deduction model)

Each control deducts its **spec weight × (1 − score/100)** from 100 — a passing control deducts nothing, a total failure deducts its full weight:

```
Percentage = max(0, 100 − Σ deductions)   then apply gates:
  no HTTPS        → capped at 30
  reputation fail → capped at 25
```

| Group | Parameter | Weight (points) |
|---|---|---|
| Transport | HTTPS *(gate)* | 13 |
| | SSL | 7 |
| | TLS_Version | 5 |
| | HSTS | 5 |
| | SSL_Expiry | 4 |
| Headers | CSP | 9 |
| | X_Frame_Options | 4 |
| | X_Content_Type_Options | 3 |
| | Referrer_Policy | 2 |
| | Permissions_Policy | 2 |
| Cookies | Cookie_Flags | 5 |
| | Third_Party_Cookies | 2 |
| Reputation | Reputation (Safe Browsing + VirusTotal) *(gate)* | 9 |
| App exposure | SQLi_Exposure | 4 |
| | XSS | 4 |
| | Forms_Use_HTTPS | 4 |
| | Weak_Default_Credentials | 2 |
| | Admin_Panel_Public | 1 |
| | MFA_Enabled | 1 |
| Privacy / legal | Privacy_Compliance | 4 |
| | Cookie_Consent | 3 |
| | Privacy_Policy | 3 |
| Page-specific | Finance_Form_Security (finance pages) | 10 |
| | Legal_Disclaimers (finance/service pages) | 8 |

N/A controls cannot deduct. **Info-only:** `Header_Security` Observatory-style sub-grade (baseline 100, per-test deductions, letter grade A+–F) — the externally comparable number. `Graded_Percentage` keeps the old renormalized weighted average. GA4/GTM/CRM belong to Conversion, not Security.

### 3.E UX & Content Structure — [uxContentStructure.js:2272](Backend/metricServices/uxContentStructure.js:2272)

Weighted average (Auditify Index — no external equivalent). Common parameters:

| Parameter | Weight | Parameter | Weight |
|---|---|---|---|
| Intrusive_Interstitials | 0.11 | Interactive_Click_Feedback | 0.06 |
| Navigation_Discoverability | 0.11 | Loading_Feedback | 0.05 |
| Broken_Links | 0.11 | Content_Density_Balance | 0.05 |
| Text_Readability | 0.10 | Layout_Consistency | 0.05 |
| Above_the_Fold_Content | 0.09 | Sticky_Header_Usage | 0.05 |
| Mobile_Experience | 0.09 | | |
| Hierarchy_Flow_Clarity | 0.07 | | |

Page-specific add-ons (weight only on their page type; N/A elsewhere):

| Add-on | Page type | Weight |
|---|---|---|
| Inventory_Filtering | SRP | 0.10 |
| Vehicle_Image_Gallery | VDP | 0.10 |
| No_Results_UX | SRP | 0.06 |
| Breadcrumbs | inner pages | 0.05 |
| In_Page_Navigation | long pages | 0.04 |

Pricing / Vehicle-History / Staff / Certifications checks were moved to Conversion (hidden here).

### 3.F Conversion & Lead Flow — [conversionLeadFlow.js:2189](Backend/metricServices/conversionLeadFlow.js:2189)

Weighted average with page-type gating (`classifyPageType` on the post-redirect URL). Sub-cards split a spec parameter's weight so they **sum to the spec value** (e.g. CTA effectiveness 0.18 = Presence 0.07 + Clarity 0.05 + Flow 0.06).

| Group | Parameter | Weight |
|---|---|---|
| CTA | CTA_Presence | 0.07 |
| | CTA_Flow_Alignment | 0.06 |
| | CTA_Clarity | 0.05 |
| | CTA_Crowding | 0.05 |
| Forms *(form pages: trade/finance/about/service)* | Form_Presence | 0.09 |
| | Inline_Validation | 0.05 |
| | Form_Length | 0.04 |
| | Required_vs_Optional_Fields | 0.04 |
| | Thank_You_Pages | 0.03 |
| | Submit_Button_Clarity | 0.025 |
| | MultiStep_Form_Progress | 0.015 |
| | Friendly_Error_Handling | 0.02 |
| | Microcopy_Clarity | 0.02 |
| Trust / social proof | Trust_Badges | 0.05 |
| | Testimonials | 0.04 |
| | Reviews | 0.03 |
| | Client_Logos | 0.01 |
| | Case_Studies_Accessibility | 0.01 |
| | Certifications_Awards | 0.01 |
| Commercial *(page-specific)* | Pricing_Transparency (VDP/offers/lease/finance) | 0.06 |
| | Vehicle_History (VDP) | 0.04 |
| Engagement | Click_To_Call | 0.04 |
| | Chat_Experience | 0.03 |
| | Lead_Magnets | 0.02 |
| Analytics (site-wide) | GA4_Installed | 0.05 |
| | Conversion_Tracking | 0.04 |
| | GTM_Configuration | 0.03 |
| | CRM_Integration | 0.02 |
| Lead tools *(page-specific)* | TradeIn_Flow (trade-in pages) | 0.15 |
| | Appointment_Booking (service) | 0.12 |
| | Financing_Flow (finance) | 0.10 |
| | Finance_Calculator (finance) | 0.10 |
| | Incentives_Displayed (offers/lease) | 0.06 |

**Hidden (double-counted elsewhere):** Link_Relevance, Progress_Indicators.

### 3.G AIO Readiness — [aioReadiness.js:974](Backend/metricServices/aioReadiness.js:974)

Weighted average of 8 parameters (no page-type gating; weights sum to 1.0):

| Parameter | Weight |
|---|---|
| Structured_Data (JSON-LD validity) | 0.20 |
| Content_NLP_Friendly (semantic HTML + headings) | 0.16 |
| Answer_Oriented_Structure (Q&A / FAQ blocks) | 0.12 |
| Keywords_Entities_Annotated | 0.10 |
| Content_Updated_Regularly (freshness) | 0.10 |
| Internal_Linking_AI_Friendly (descriptive anchors) | 0.10 |
| Topical_Focus_Clarity (title ↔ H1 alignment) | 0.10 |
| AI_Agentic_Browsing (WebMCP readiness) | 0.06 |

**Info-only:** Duplicate_Content_Detection_Ready (owned by On-Page SEO), Structured_Content (chunking + lists), Terminology_Consistency. **Hidden:** Author, Fact-density, Completeness (double-counted). Badge: "AIO-compatible" when Percentage ≥ 50.

### 3.H AEO — [aeoService.js:54](Backend/metricServices/aeoService.js:54)

Headline = weighted average over the applicable spec parameters (`computeSectionScore`):

| Signal | Weight | Applicability |
|---|---|---|
| Schema markup | 0.20 | all pages |
| Answer-first structure | 0.15 | all pages |
| Bot access (per-engine, averaged) | 0.11 | all pages |
| E-E-A-T composite (Experience+Expertise+Authority) | 0.10 | About / Blog / Service only |
| Structured content (tables/lists) | 0.09 | all pages |
| FAQ / Q&A blocks | 0.07 | FAQ / Finance / Service / VDP only |
| Entity recognition (Org schema + Knowledge Graph) | 0.07 | all pages |
| Citation consistency (NAP/brand) | 0.06 | all pages |
| Citations & attribution (outbound) | 0.05 | all pages |
| Topical authority (depth + clustering) | 0.05 | all pages |
| Index coverage (GSC real / sitemap estimate) | 0.04 | all pages |
| sameAs validation | 0.04 | Home / About only |
| llms.txt present & well-formed | 0.02 | all pages |

**Info-only:** Brand_Entity_Strength, Markdown_Structure, Page_Speed (owned by Technical) — kept at weight 0 to avoid triple-counting "dealer authority". Crashed signals return `null` and are renormalized out ("Not Run · excluded from score").

**Per-platform gauges (Gemini / ChatGPT / Perplexity)** are separate displays, NOT part of the headline: each platform re-weights the same signals with its own weight table (`aeoWeights.js`), and a platform whose bot is blocked in robots.txt scores 0. Their mean is the displayed `overallScore` for the platform panel.

---

## 4. How each PAGE audit score is calculated (and how sections contribute to it)

The page score is **not** a flat average of the 8 sections. Each page type tilts the section weights (spec §5.4 + §5.6) — a Finance page leans on Security, a Trade-In page on Conversion:

```
page_score = Σ(section Percentage × w_section(pageType)) ÷ Σ(w of applicable sections)
```

Code: [sectionWeights.js:95](Backend/utils/sectionWeights.js:95) (`computePageScore`, renormalizes N/A sections out) and [singleAuditWorker.js:146](Backend/workers/singleAuditWorker.js:146) (`OverAll`, full 8-section audits). The page type comes from the URL classifier ([sectionWeights.js:61](Backend/utils/sectionWeights.js:61)), most-specific pattern first (VDP before SRP, finance before lease).

**Section weights per page type** (each row sums to 100 — i.e. the % contribution of each section to that page's score):

| Page type | Tech | On-Page SEO | A11y | Security | UX | Conversion | AIO | AEO |
|---|---|---|---|---|---|---|---|---|
| generic (fallback) | 18 | 17 | 8 | 12 | 11 | 14 | 8 | 12 |
| home | 18 | 18 | 8 | 12 | 10 | 14 | 8 | 12 |
| srp (inventory) | 20 | 20 | 7 | 8 | 11 | 14 | 8 | 12 |
| vdp (vehicle detail) | 18 | 18 | 8 | 8 | 11 | 18 | 7 | 12 |
| offers / specials | 15 | 16 | 8 | 13 | 11 | 17 | 8 | 12 |
| lease | 15 | 16 | 8 | 14 | 11 | 16 | 8 | 12 |
| trade-in | 14 | 12 | 9 | 16 | 11 | 22 | 7 | 9 |
| finance | 14 | 12 | 9 | 22 | 9 | 18 | 7 | 9 |
| service | 16 | 16 | 8 | 10 | 11 | 19 | 8 | 12 |
| about / contact | 14 | 16 | 11 | 10 | 15 | 12 | 10 | 12 |
| blog / content | 14 | 22 | 9 | 9 | 15 | 7 | 10 | 14 |
| models (corporate) | 18 | 20 | 10 | 8 | 14 | 10 | 9 | 11 |
| locator (corporate) | 16 | 14 | 8 | 8 | 14 | 20 | 8 | 12 |
| press (corporate) | 14 | 18 | 10 | 8 | 14 | 6 | 10 | 20 |

> **AI-forward tilt (July 2026):** AIO+AEO carry ~20 points combined on customer-facing pages (AEO leads, as the reach/visibility signal), funded by Accessibility and UX. Transactional pages (trade-in, finance) stay ~16 — bots don't submit credit apps. This is a strategic, forward-looking weighting (AI referral growth), not a current-traffic-share claim.

If a section is missing (subset audit / N/A), its weight is dropped and the rest renormalize.

**Worked example** — a VDP scoring Tech 70, SEO 80, A11y 60, Sec 90, UX 75, Conv 50, AIO 65, AEO 55:

```
page = (70×18 + 80×18 + 60×9 + 90×8 + 75×13 + 50×18 + 65×7 + 55×9) / 100 = 69.1 → grade "C"
```

---

## 5. How the OVERALL audit score is calculated (and how pages contribute to it)

Two steps happen before the site rollup:

1. **Sample merge.** Categories audited on several sample pages (VDP = up to 5 cars, SRP = new + used) are merged into ONE averaged report (`POST /single-audit/merge`): every section cell is the mean of the samples' Percentages, and the row's page score is the mean of the samples' scores. A multi-car VDP therefore counts **once** in the site score, as its average.
2. **Importance weighting.** Each merged page-type row is weighted by how much that page matters to a dealership (spec §5.5):

```
overall = Σ(page_score × importance) ÷ Σ(importance of audited pages)
```

**Page importance weights** ([AuditSummaryPage.jsx:24](Frontend/src/Pages/AuditSummaryPage.jsx:24)):

| Page type | Importance | Share of overall (all 10 rows audited, Σ = 12.5) |
|---|---|---|
| Home | 2.00 | 16.0% |
| VDP | 1.75 | 14.0% |
| SRP | 1.50 | 12.0% |
| Finance | 1.25 | 10.0% |
| Trade-in | 1.25 | 10.0% |
| Offers/Specials | 1.25 | 10.0% |
| Lease | 1.25 | 10.0% |
| Service | 1.00 | 8.0% |
| About | 0.75 | 6.0% |
| Blog/Content | 0.75 | 6.0% |
| *(any unknown type)* | 1.00 | — |

Pages that failed to audit are simply excluded — the remaining importance weights renormalize. The result is rounded and graded with the same A+–F bands as §0.

**Worked example** — Home 78, VDP 69, SRP 72 audited (nothing else):

```
overall = (78×2.0 + 69×1.75 + 72×1.5) / (2.0 + 1.75 + 1.5)
        = (156 + 120.75 + 108) / 5.25 = 73.3 → 73 → grade "B"
```

---

## 6. Summary — one line per question

| Question | Answer |
|---|---|
| How is a **parameter** calculated? | Its check function returns 0–100 (binary / graded / ratio / curve); absence = 0; N/A = dropped; crashed = dropped; info-only = displayed at weight 0. |
| How does a parameter contribute to its **section**? | `weight ÷ Σ(applicable weights)` in the weighted-average sections; via severity/spec-point **deductions** in Accessibility (from 90) and Security (from 100, with HTTPS ≤30 and reputation ≤25 gates); Technical is the official Lighthouse score. |
| How is a **section** calculated? | §2 table: Lighthouse-official (Technical), deduction (Accessibility, Security), spec-weighted average with N/A renormalization (SEO, UX, Conversion, AIO, AEO). |
| How does a section contribute to the **page score**? | By the page-type weight row in §4 (e.g. Security is 22% of a finance page but 8% of an SRP). |
| How is a **page score** calculated? | `Σ(section% × page-type weight) / Σ(weights)`, renormalized over applicable sections. |
| How does a page contribute to the **overall**? | Sample pages merge into one row per page type; each row then counts `importance ÷ Σ(importance)` (Home 2.0 … Blog 0.75). |
| How is the **overall score** calculated? | Importance-weighted mean of the merged page scores, rounded, graded A+ (≥90) … F (<50). |
