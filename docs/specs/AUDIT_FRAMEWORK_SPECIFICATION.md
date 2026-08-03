# Auditify — Master Audit Framework Specification (v2)

> **What this document is.** The single source of truth for rebuilding the dealership audit engine. It defines (1) the page-discovery model, (2) the 8-section taxonomy with **AEO and AIO split apart**, (3) a deep per-parameter specification for **every parameter currently in the product** plus the parameters that are missing, (4) the new **AI Agentic Browsing** parameter, (5) a critical audit of duplicate / overlapping / mergeable / removable parameters, and (6) the scoring math for parameter → section → page → site, with a recommended weight distribution.
>
> **What this document is NOT.** It is not a description of how the current code computes anything. Every "How to measure" section below describes the *correct* method from first principles (Core Web Vitals / CrUX, Lighthouse v12+ methodology, WCAG 2.2 AA, schema.org, OWASP/MDN security headers, Google & Bing guidance, and current AEO/AIO/agentic-web practice), **not** the current implementation.
>
> **Authoring rule honored:** No code was read for *how* parameters are scored; only the **inventory of parameter names** and the product's section structure were used. Scoring guidance is derived from external standards and the author's domain expertise.
>
> **Date:** 2026-06-18 · **Supersedes:** `AUDIT_PARAMETER_METHODOLOGY.md` (kept as background reference) · **Status:** design spec, not yet wired into code.

---

## Table of contents

- [Part 0 — Model overview (pages, discovery, scoring philosophy)](#part-0)
- [Part 1 — The 8 sections and 10 page types](#part-1)
- [Part 2 — Per-parameter deep specification](#part-2)
  - [2.1 Technical](#sec-technical)
  - [2.2 On-Page SEO](#sec-onpage)
  - [2.3 Accessibility](#sec-a11y)
  - [2.4 Security & Compliance](#sec-security)
  - [2.5 UX & Content](#sec-ux)
  - [2.6 Conversion Flow](#sec-conversion)
  - [2.7 AIO — AI Optimization (ingestion)](#sec-aio)
  - [2.8 AEO — Answer Engine Optimization](#sec-aeo)
- [Part 3 — NEW parameter: AI Agentic Browsing](#part-3)
- [Part 4 — Critical analysis (duplicate / overlap / merge / remove / missing)](#part-4)
- [Part 5 — Deliverables (common table, page tables, scoring design, weight distribution)](#part-5)

---

<a name="part-0"></a>
## Part 0 — Model overview

### 0.1 The two axes
Every audit is a **Parameters × Pages** matrix. A parameter is scored 0–100 on each page it applies to; section scores roll up per page; page scores roll up to a site score. The two failure modes that make existing tools "inaccurate" are (a) scoring inapplicable parameters as 0 and (b) treating graded metrics as binary pass/fail. Both are corrected below.

### 0.2 Page discovery
1. **Sitemap first.** Fetch `/sitemap.xml`, `/sitemap_index.xml`, and `robots.txt`'s `Sitemap:` directive. Parse nested index sitemaps. Read `<lastmod>` for freshness signals.
2. **Crawl fallback.** If no/partial sitemap, BFS-crawl from the homepage to depth ≤ 3, respecting `robots.txt`.
3. **Classify each URL** into one of the 10 page types using URL patterns **and** DOM heuristics (never URL alone — dealer platforms vary). Sample 5–10 URLs per type for deep audit; do not audit every VDP.
4. **Renormalize per page type.** Each page is audited only against the parameters that apply to it (§0.4).

### 0.3 Scoring philosophy — the seven rules that fix "inaccurate" scoring
1. **Graded, not binary.** Use continuous 0–100 curves. LCP 2.6 s scores ~88, not 0. Reserve banded 0/50/100 only for genuinely binary facts (HTTPS present, `lang` attribute present).
2. **Field data beats lab data.** For Core Web Vitals use **CrUX field p75** when available; fall back to Lighthouse **lab** only when there is no field data, and label it an estimate. Never average lab + field.
3. **Quality, not presence.** "Has an H1" is presence; "exactly one descriptive, keyword-relevant H1" is quality. A 12-character meta description must not score 100 just because the tag exists.
4. **No double counting.** A signal weighted in one section stays **informational (weight 0)** in any other section that also surfaces it (e.g. page speed is owned by Technical and is info-only in AEO/AIO).
5. **Severity × instance weighting.** Especially in Accessibility and Security, a single critical failure (no label on a finance form) must outweigh ten cosmetic ones.
6. **Renormalize N/A.** A parameter that doesn't apply to a page is **removed from the denominator**, not scored 0. This is the single biggest source of false-low scores.
7. **Context-weight by page.** The same parameter matters differently per page type. Vehicle schema is critical on a VDP, excluded on an About page. Both *section* weights and *parameter* weights shift per page.

### 0.4 Roll-up math (formal)
```
parameter_score ∈ [0,100]
section_score(page) = Σ( parameter_score × w_param ) / Σ( w_param )      // only applicable params; weights renormalized
page_score          = Σ( section_score(page) × w_section(page) )         // section weights for that page type, sum = 1
site_score          = Σ( page_score × page_importance ) / Σ( page_importance )
```
Default `page_importance`: Homepage ×2.0, VDP ×1.75, SRP ×1.5, Finance/Trade-In/Offers ×1.25, Service ×1.0, About/Contact ×0.75, Blog/FAQ ×0.75. Multiply by the **count of sampled pages** of that type so a 5,000-VDP site is not dominated by one About page.

### 0.5 Confidence flag (new, required)
Every parameter result must carry a `confidence` enum: `field` (CrUX/real data), `lab` (Lighthouse/synthetic), `heuristic` (DOM inference, e.g. "XSS surface indicator"), or `estimate`. Surface it in the report. This is how the platform stops over-claiming (e.g. "100% accessible" or "no vulnerabilities").

---

<a name="part-1"></a>
## Part 1 — The 8 sections and 10 page types

**Sections (8):** the old "AIO Readiness" is split into **AIO** (ingestion/parse hygiene) and **AEO** (answerability/citation).

| # | Section | One-line scope |
|---|---|---|
| 1 | **Technical** | Performance, delivery, crawl-health, Core Web Vitals |
| 2 | **On-Page SEO** | Meta/markup/heading/URL/link signals search engines read |
| 3 | **Accessibility** | WCAG 2.2 AA automated coverage, severity-weighted |
| 4 | **Security & Compliance** | Transport, headers, cookies, reputation, privacy/legal |
| 5 | **UX & Content** | Readability, navigation, layout, friction, content quality |
| 6 | **Conversion Flow** | CTAs, forms, trust, dealer lead tools, analytics |
| 7 | **AIO** (AI Optimization) | Machine-*ingestibility*: clean structure an LLM can parse |
| 8 | **AEO** (Answer Engine Optimization) | Machine-*answerability*: being quoted/cited by AI engines |

**Page types (10):** the task's list, with Offers/Promotions and Lease Specials kept distinct.

| Code | Page type | Detection hints (URL **and** DOM) |
|---|---|---|
| A | **Home** | `/` root; org logo + global nav + hero + multi-CTA hub |
| B | **Inventory / SRP** | `/inventory`,`/new`,`/used`,`/search`; repeating vehicle cards, filters/facets, pagination, results count |
| C | **VDP** (Vehicle Detail) | `/vehicle/`, VIN/stock# in URL; single vehicle, price, gallery, spec table |
| D | **Offers / Promotions** | `/specials`,`/offers`; rebates/APR, expiry dates, disclaimers |
| E | **Lease Specials** | `/lease`,`/lease-specials`; monthly payment, term, due-at-signing, lease disclaimers |
| F | **Trade-In** | `/trade`,`/value-your-trade`; valuation form / KBB-style tool |
| G | **Finance** | `/finance`,`/credit-application`,`/payment-calculator`; PII form, calculator, disclosures |
| H | **Service & Repair** | `/service`,`/schedule-service`,`/parts`; scheduler, service menu, coupons |
| I | **About / Contact** | `/about`,`/contact`,`/staff`; NAP, map, hours, team bios |
| J | **Blog / FAQ / Guides / How-To** | `/blog`,`/faq`,`/how-to`,`/guides`; editorial/info content |

> **Note on D vs E.** Offers and Lease Specials share most parameters (Offer schema, expiry, disclaimers). Lease adds lease-specific disclosure rigor (Reg-M: capitalized cost, residual, money factor, due-at-signing). Treat E as D + lease-disclosure add-on.

---

<a name="part-2"></a>
## Part 2 — Per-parameter deep specification

**Format per parameter:**
`**Name** — Applicability · Priority · Weight-in-section`
followed by **What / Why / Measure (correct) / High / Low**. "Weight-in-section" is the base weight within the applicable set; per-page tilts are noted where they matter. Priority ∈ {Critical, High, Medium, Low}. Applicability ∈ {Common | Page-specific: <pages>}.

---

<a name="sec-technical"></a>
### 2.1 Technical (performance & delivery)

**Section principle.** Mirror Lighthouse v10–v12 metric weighting (**TBT 30%, LCP 25%, CLS 25%, FCP 10%, Speed Index 10%**) but **prefer CrUX field p75** for the three CWV (LCP, CLS, INP). INP is the real interactivity metric; TBT is its lab proxy. **FID is deprecated** (removed from CrUX Sept 2024) — informational only, weight 0. Use log-normal scoring curves, not thresholds.

**LCP (Largest Contentful Paint)** — Common · Critical · **22%**
- *What:* time to render the largest above-the-fold element.
- *Why:* the headline loading-experience metric and a confirmed ranking signal; dealer hero images and VDP galleries make it the most-failed metric.
- *Measure:* CrUX p75 field; good ≤ 2.5 s, needs-improvement 2.5–4.0 s, poor > 4.0 s. Score on a log-normal curve (mobile p10 ≈ 2.5 s, median ≈ 4.0 s) so 2.6 s ≈ 88, not 0. Lab fallback flagged `lab`.
- *High:* preloaded/`fetchpriority=high` hero, CDN, compressed AVIF/WebP, fast TTFB.
- *Low:* huge uncompressed hero, render-blocking CSS/JS, slow host.

**CLS (Cumulative Layout Shift)** — Common · Critical · **18%**
- *What:* sum of unexpected layout-shift impact × distance.
- *Why:* shifting "Buy/Check Availability" buttons cause misclicks; ranking signal; also feeds AI Agentic Browsing (Part 3).
- *Measure:* CrUX p75; good ≤ 0.1, poor > 0.25. Continuous curve between.
- *High:* explicit width/height/`aspect-ratio` on all media, reserved ad/banner slots, `font-display:optional`.
- *Low:* dimensionless images, late-injected sale banners, web-font FOIT/FOUT.

**INP (Interaction to Next Paint) / TBT (lab proxy)** — Common · Critical · **20%**
- *What:* INP = responsiveness across all interactions (field); TBT = total main-thread blocking 0–TTI (lab).
- *Why:* INP replaced FID as the Core Web Vital in March 2024; heavy dealer tag stacks (chat, CRM, inventory widgets) wreck it.
- *Measure:* if CrUX INP exists, score it (good ≤ 200 ms, NI 201–500, poor > 500) and weight it; else score TBT (good ≤ 200 ms mobile). Never both.
- *High:* code-split/deferred JS, short tasks, lean third-party stack.
- *Low:* long tasks, monolithic bundles, multiple tag managers.

**FCP (First Contentful Paint)** — Common · High · **8%**
- *What:* time to first DOM paint. *Why:* perceived speed; supporting CWV. *Measure:* CrUX p75, good ≤ 1.8 s, log-normal curve. *High:* inline critical CSS, deferred JS, fast TTFB. *Low:* render-blocking head resources.

**TTFB (Time To First Byte)** — Common · High · **8%**
- *What:* server response latency. *Why:* upstream cause of poor LCP/FCP; dealer platforms (DealerOn, Dealer.com) vary widely. *Measure:* good ≤ 0.8 s, NI 0.8–1.8 s. *High:* CDN, edge cache, no pre-TTFB redirect. *Low:* slow origin, cold cache, redirect before first byte.

**Speed Index** — Common · Medium · **6%**
- *What:* how quickly above-the-fold visually completes. *Why:* perceived-completeness proxy. *Measure:* lab, good ≤ 3.4 s, log-normal. *High:* progressive above-fold paint. *Low:* late large paints.

**Total Blocking Time** — see INP/TBT (do **not** double-weight; TBT is the lab arm of the INP/TBT parameter).

**Render-blocking resources** — Common · Medium · **5%**
- *What:* sync CSS/JS in `<head>` delaying first paint. *Why:* direct LCP/FCP cause. *Measure:* count + estimated savings (ms); score inversely to blocking ms. *High:* deferred/async JS, inlined critical CSS. *Low:* multiple synchronous stylesheets/scripts in head.

**Resource optimization** (images/JS/CSS) — Common · Medium · **5%**
- *What:* oversized images, unminified/legacy JS-CSS, next-gen format coverage, unused bytes. *Why:* wasted bytes inflate LCP/INP and mobile data cost. *Measure:* wasted-bytes ratio across responsive `srcset`, modern formats (AVIF/WebP), minification, tree-shaking. *High:* responsive images, AVIF/WebP, minified, code-split. *Low:* full-res JPEGs scaled in CSS, unminified bundles.

**Compression** — Common · Medium · **4%**
- *What:* Brotli/Gzip on text assets. *Measure:* % of compressible bytes actually compressed (not binary). *High:* Brotli at CDN/origin. *Low:* uncompressed HTML/CSS/JS.

**Caching policy** — Common · Medium · **4%**
- *What:* `Cache-Control`/`max-age`/`immutable` on static assets. *Measure:* % static bytes with efficient TTL (≥ 30 days). *High:* long-cached fingerprinted assets. *Low:* no/short cache headers.

**Redirect chains** — Common · Low · **3%**
- *What:* hops before final 200. *Measure:* 0 hops = 100, 1 = 85, 2 = 60, ≥ 3 < 40. *High:* single hop. *Low:* `http→https→www→path` cascades.

**Sold-vehicle / 404 handling** — **Page-specific: VDP, SRP** · High · **5% on VDP** (renormalize others)
- *What:* whether a sold/removed VIN returns a correct `301` to a similar in-stock vehicle or model SRP. *Why:* inventory churn creates thousands of dead VDPs; soft-404s (200 with "no longer available") cause index bloat and crawl waste. *Measure:* sample removed/expired URLs; 301-to-relevant = 100, hard 404 = 40, soft-404 (200 + empty/placeholder) = 0. *High:* graceful 301s. *Low:* soft-404s, blanket 404s, redirect-to-homepage (also bad).

> **Removed/relocated from Technical (see Part 4):** *FID* → informational (deprecated). *Mobile Usability* → deprecated by Google (Search Console report retired Dec 2023); fold into Accessibility (viewport/target-size) + UX (mobile experience). *Inventory Page Load Time / Service Page Load Time* → these are **page-scoped LCP/Speed-Index measurements**, not separate parameters; express them as the standard CWV measured on the SRP/Service page, not as bespoke metrics. *Rendering Performance, JavaScript Execution Efficiency, Lazy Loading, Third-Party Script Optimization* → these are **diagnostics that already roll into INP/TBT, Resource optimization, and Render-blocking**; keep as evidence/diagnostics under those parameters, not as independently-weighted scores (double counting).

---

<a name="sec-onpage"></a>
### 2.2 On-Page SEO

**Meta title** — Common · Critical · **15%**
- *What:* presence + 30–60 char length + uniqueness + primary keyword near front + brand suffix. *Why:* primary relevance + SERP CTR signal; templated dealer titles are often duplicated across thousands of VDPs. *Measure:* presence 40 / in-range length 25 / keyword-relevance 20 / uniqueness vs other sampled pages 15. *High:* `{Year} {Make} {Model} {Trim} for Sale in {City} | {Dealer}`. *Low:* missing, > 60 (truncated), site-wide duplicate.

**Meta description** — Common · High · **9%**
- *What:* presence + 120–160 chars + compelling + keyword + unique. *Measure:* length band + keyword + uniqueness (graded). *High:* unique per VDP with price/CTA. *Low:* missing, OEM-duplicated, 12 chars, truncated.

**Heading hierarchy (H1 + order)** — Common · High · **11%**
- *What:* exactly one descriptive H1, no skipped levels. *Measure:* one H1 = 40 / no level skips = 30 / keyword-relevant = 30. *High:* single topical H1, logical nesting. *Low:* 0 or many H1s, H1→H4 jumps.

**Canonical tag** — Common · High · **11%**
- *What:* present, self-referencing or correct target, absolute, single. *Why:* the primary defense against VDP/SRP duplicate-content and faceted index bloat. *Measure:* presence + correctness + uniqueness. *High:* self-canonical money pages; filtered SRPs canonical-to-base or noindex. *Low:* missing on filters, wrong target, multiple canonicals.

**URL slug / structure** — Common · Medium · **8%**
- *What:* short, lowercase, hyphenated, keyword-bearing, shallow (≤ 4 segments), no session params/dates/extensions. *Measure:* composite of the above. *High:* `/2024-honda-civic-ex-vin1234`. *Low:* query-string SRPs, deep paths, opaque IDs.

**Image optimization (SEO view)** — Common · Medium · **8%**
- *What:* alt-coverage %, next-gen format %, lazy-load below fold, descriptive filenames. *Measure:* alt 0.4 / format 0.3 / lazy 0.2 / naming 0.1. *Note:* alt coverage is **shared evidence** with Accessibility's Image-alt — measure once, weight in both (different intent: SEO indexing vs a11y). *High:* alt on all content images, WebP/AVIF, lazy below fold. *Low:* missing alts, giant JPEGs.

**Robots meta + robots.txt intent** — Common · High · **8%**
- *What:* correct index/noindex/nofollow intent; no accidental `noindex` on money pages; `robots.txt` not blocking inventory. *Why:* an accidental `noindex` on VDP/SRP is catastrophic and invisible to users. *Measure:* detect noindex/nofollow on indexable templates (penalize), confirm thin filter combos are noindexed (reward). *High:* VDP/SRP indexable, thin facets noindexed. *Low:* money pages noindexed, inventory blocked in robots.txt.

**Open Graph / social card tags** — Common · Medium · **6%** *(currently MISSING from product — see Part 4)*
- *What:* `og:title/description/image/type/url` + Twitter card. *Why:* controls social + AI/answer-engine card rendering and CTR. *Measure:* completeness + image dimensions (1200×630). *High:* full OG block. *Low:* none → engines guess.

**Internal link profile** — Common · Medium · **7%**
- *What:* count, descriptive anchors (not "click here"), no orphans, reasonable density, crawlable `<a href>` (not JS `onclick`). *Measure:* anchor-quality + reachability + orphan detection. *High:* descriptive anchors, SRP→VDP and related-vehicle links. *Low:* generic anchors, orphaned VDPs, JS-only nav. *(This is the correct home for the product's "Contextual Link Analysis.")*

**Content relevance** — Common · Medium · **6%**
- *What:* keyword/entity agreement across Title ↔ H1 ↔ body ↔ meta. *Measure:* TF/entity overlap; penalize thin body. *High:* aligned topic, sufficient depth. *Low:* title/body mismatch, thin content.

**Semantic structure / landmarks (SEO view)** — Common · Medium · **5%**
- *What:* semantic HTML5 (`header/nav/main/article/footer`) the parser uses for structure. *Note:* **shared** with Accessibility landmarks — measure once. *High:* correct semantic regions. *Low:* div-soup.

**Viewport meta** — Common · Low · **3%**
- *What:* `width=device-width, initial-scale=1`, no `user-scalable=no`/`maximum-scale=1`. *Note:* **shared** with Accessibility (zoom) — measure once, this is the SEO/mobile-readiness arm. *High:* standard responsive viewport. *Low:* missing or zoom disabled.

**Meta keywords** — Common · informational · **0%**
- Deprecated since ~2009; ignored by all engines. Report as info, never weight. **Recommend removal from any scored set.**

> **VDP add-on:** *Unique description / duplicate-vs-OEM* (Page-specific: VDP, Blog) · High · **+12% on VDP**. Fingerprint body text; compare against OEM boilerplate and the dealer's other sampled VDPs. Score by uniqueness ratio. Thin/duplicate OEM copy is the #1 VDP ranking killer. *(This is the correct home for "VDP Descriptions" / content uniqueness.)*
>
> **SRP add-on:** *Pagination & faceted index control* (Page-specific: SRP) · High · **+8% on SRP**. Self-canonical page 1, consistent param ordering, noindex thin filter combinations, `rel=next/prev` or load-more handled. *(Currently MISSING — Part 4.)*

---

<a name="sec-a11y"></a>
### 2.3 Accessibility (WCAG 2.2 AA)

**Section principle.** Automated checks cover **~30–40 %** of WCAG. **Never report "100 % accessible"** — cap automated score and label it "automated AA coverage (~40 % of WCAG)." Weight by **severity × instance count**, not equal-per-check. Severity multipliers: **Critical ×3** (keyboard trap, missing form label, body-text contrast fail, missing `lang`), **Serious ×2** (missing alt, no link/button name, ARIA misuse), **Moderate ×1** (heading order, list structure, skip link). On Finance/Trade-In, label/contrast failures on PII forms are blocking and surfaced first.

| Parameter | Applicability | Tier | What / Correct measure | High | Low |
|---|---|---|---|---|---|
| **Color contrast** | Common | Critical | Body ≥ 4.5:1, large ≥ 3:1, UI/icon ≥ 3:1; score = % text nodes passing | tokens with adequate contrast | grey-on-white, low-contrast CTAs |
| **Form labels** | Common (Critical on F/G) | Critical | every input programmatically labeled (`<label for>`/`aria-label`); % labeled | all inputs labeled | placeholder-only "labels" |
| **HTML `lang`** | Common | Critical | `<html lang>` present & valid (binary 0/100) | `lang="en"` set | missing/invalid |
| **Keyboard nav / focus order / focusable** | Common | Critical | all interactive reachable, logical order, visible focus, no positive tabindex, no aria-hidden focus trap | native controls, managed focus | mouse-only widgets, focus traps |
| **Image alt** | Common | Serious | content images have meaningful alt, decorative `alt=""`; % correct (shared w/ SEO) | purposeful alt | missing/duplicated alt |
| **Link & button names** | Common | Serious | discernible accessible name; % named | aria-labels on icon controls | icon-only nav, "read more" |
| **ARIA roles / allowed attributes** | Common | Serious | valid roles, allowed attrs, required props present | prefers native HTML | invalid/redundant ARIA |
| **Document title** | Common | Serious | present, unique, descriptive | per-page titles | generic/duplicate |
| **Viewport scaling (zoom)** | Common | Serious | zoom not disabled (shared w/ SEO viewport) | scalable | `user-scalable=no` |
| **Heading order** | Common | Moderate | no skipped levels (shared evidence w/ On-Page H1) | sequential | H1→H4 |
| **Landmarks** | Common | Moderate | one `main`, nav/header/footer present (shared w/ semantic structure) | full landmark set | none |
| **List structure** | Common | Moderate | real `ul/ol/li` | semantic lists | faux lists |
| **Skip link** | Common | Moderate | "skip to content" before nav | present | none on long nav |
| **Interactive element affordance** | Common | Moderate | interactive elements look interactive; non-buttons not styled as buttons | clear affordances | div "buttons" with no role |

> **WCAG 2.2 additions to ADD (Part 4 — missing):** **Target size (2.5.8)** ≥ 24×24 px (huge for mobile dealer CTAs), **Focus not obscured (2.4.11)** by sticky headers (ties to UX sticky-header), **Reflow (1.4.10)** at 320 px / 400 % zoom, **Text spacing (1.4.12)**, **Prefers-reduced-motion** respect.

---

<a name="sec-security"></a>
### 2.4 Security & Compliance

**Section principle.** Group into **Transport · Headers · Cookies · Reputation · App-exposure · Privacy/Legal**. Transport + reputation are **gates**: missing HTTPS caps the section ≤ 30; a Safe-Browsing/malware flag caps ≤ 25, regardless of other passes. Note that DOM-level injection checks are **heuristics** — label "surface indicator," never "vulnerability proven."

| Parameter | Applicability | Priority | What / Correct measure | w |
|---|---|---|---|---|
| **HTTPS + no mixed content** | Common | Critical (gate) | all subresources HTTPS; no http refs on https page | **0.13** |
| **SSL/TLS certificate validity** | Common | Critical | valid, unexpired, trusted chain, host match | **0.07** |
| **SSL expiry window** | Common | High | days-to-expiry; < 14 d warn, expired = fail | **0.04** |
| **TLS version** | Common | High | TLS 1.2 min, 1.3 preferred; no SSLv3/TLS1.0/1.1 | **0.05** |
| **HSTS** | Common | High | `Strict-Transport-Security` long max-age (+preload) | **0.05** |
| **CSP** | Common | High | present & not trivially unsafe (`unsafe-inline`/`*`); graded by directive coverage | **0.09** |
| **X-Frame-Options / frame-ancestors** | Common | Medium | clickjacking protection | **0.04** |
| **X-Content-Type-Options** | Common | Medium | `nosniff` | **0.03** |
| **Cookie flags (Secure/HttpOnly/SameSite)** | Common | Medium | % session cookies compliant | **0.05** |
| **Third-party cookies** | Common | Low | count + consent-gating of non-essential cookies | **0.02** |
| **Safe Browsing / blacklist / malware scan** | Common (site-wide) | Critical (gate) | not flagged for malware/phishing | **0.09** |
| **SQLi exposure (surface)** | Common | Medium | reflected-param/error indicators — heuristic only | **0.04** |
| **XSS vulnerability (surface)** | Common | Medium | reflected/unescaped output indicators — heuristic only | **0.04** |
| **Forms use HTTPS** | Common | High | all form `action` over HTTPS; POST for PII | **0.04** |
| **Cookie consent banner** | Site-wide | Medium | present before non-essential cookies fire | **0.03** |
| **Privacy policy link** | Site-wide | Medium | reachable from footer | **0.03** |
| **GDPR/CCPA disclosure + data-collection notice** | Site-wide | Medium | "Do Not Sell", consent text, collection disclosure | **0.04** |
| **Admin exposure / weak default creds / MFA** | Site-wide | High | `/admin`,`/wp-admin` reachable, default creds, MFA posture | **0.04** |
| **Finance-form PII security** | Page-specific: **Finance, Trade-In** | Critical | no SSN/credit fields in GET/URL, HTTPS POST, no sensitive `autocomplete` leak, encryption-in-transit | **0.10 on F/T** |
| **Legal/financial disclaimers (Reg-Z/Reg-M, FTC)** | Page-specific: **Finance, Offers, Lease, VDP** | High | APR/lease terms, "with approved credit", price disclaimers present & legible | **0.08 on F/D/E** |

> **RELOCATE OUT of Security (Part 4):** *Viewport Meta Tag* → On-Page/Accessibility. *HTML Doctype, Character Encoding, Browser Console Errors, Deprecated APIs* → Technical "Best Practices" diagnostics (low/info weight). *Geolocation Request, Notification Request, Input Paste Allowed* → UX/Best-Practices (intrusive-permission UX), not security gates. *GA4 Installed, GTM Configuration, Conversion Tracking* → **Conversion Flow** (they are measurement, not security). *CRM Integration* → Conversion Flow. These are currently mis-sectioned and inflate/deflate the Security score incorrectly.

---

<a name="sec-ux"></a>
### 2.5 UX & Content

| Parameter | Applicability | Priority | What / Correct measure | w |
|---|---|---|---|---|
| **Text readability** | Common | High | Flesch Reading Ease; target 50–70 for consumer auto; score by distance from band | **0.10** |
| **Intrusive interstitials** | Common | High | penalize content-blocking modals on load (Google interstitial penalty); none=100, dismissible-small=70, blocking=20 | **0.11** |
| **Primary navigation discoverability** | Common | High | visible persistent nav, working search, functional mobile menu | **0.11** |
| **Above-the-fold content** | Common | High | meaningful content + primary CTA visible without scroll | **0.09** |
| **Broken links** | Common | High | % internal/external links 4xx/5xx; 100 − scaled broken% | **0.11** |
| **Mobile experience** | Common | High | responsive layout, no horizontal scroll, tap targets, readable text (absorbs retired "Mobile Usability") | **0.09** |
| **Click feedback** | Common | Medium | hover/active/focus states on interactive | **0.06** |
| **Loading feedback** | Common | Medium | spinners/skeletons for async inventory loads | **0.05** |
| **Hierarchy / section-labeling clarity** | Common | Medium | scannable visual hierarchy, labeled sections | **0.07** |
| **Content density balance** | Common | Low | reasonable text-to-element ratio (not sparse/cramped) | **0.05** |
| **Layout consistency** | Common | Medium | consistent grid/templates across pages | **0.05** |
| **Sticky-header height** | Common | Low | ≤ ~15 % mobile viewport; not obscuring content/focus | **0.05** |
| **In-page navigation** | Page-specific: VDP, Blog, long pages | Low | anchor/jump links, back-to-top on long spec/article pages | **0.04** |
| **Breadcrumbs** | Page-specific: SRP, VDP, Service, Blog | Medium | visible breadcrumb trail + BreadcrumbList schema | **0.05** |
| **Inventory filtering usability** | Page-specific: **SRP** | High | filter clarity, applied-filter visibility, dynamic count, clear-all, URL-stable filters | **+0.10 on SRP** |
| **No-results UX** | Page-specific: **SRP, Search** | Medium | helpful empty-state, suggestions, lead capture, contact CTA | **+0.06 on SRP** |
| **Vehicle image gallery quality** | Page-specific: **VDP** | High | photo count, resolution, real-vs-stock detection, alt, lazy | **+0.10 on VDP** |

> **RELOCATE/RECLASSIFY (Part 4):** *Pricing Transparency* → **Conversion Flow** (it is a lead/trust driver, page-specific to VDP/Offers/Finance). *Vehicle History (CARFAX/AutoCheck)* → **Conversion Flow / Trust** (VDP). *Staff Profiles* → split: **Conversion/Trust** (contactable team) and **AEO E-E-A-T** (credentials); not a generic UX metric. *Certifications & Awards* → **Conversion/Trust** + **AEO Authority**. *Mobile Usability* (UX duplicate of Technical) → merged into **Mobile experience** here; remove from Technical. *Section Labeling Clarity / Content Hierarchy Clarity / Page-to-Page Flow* → these three overlap heavily; **merge into one "Hierarchy & flow clarity."**

---

<a name="sec-conversion"></a>
### 2.6 Conversion Flow

**Section principle.** Weight by funnel impact: CTAs + forms (the lead mechanism) dominate; trust/social proof multiplies; analytics is measurability ("can't optimize what you can't measure"). Forms are page-specific (renormalize where absent).

| Parameter | Applicability | Priority | What / Correct measure | w |
|---|---|---|---|---|
| **CTA effectiveness** (clarity + prominence + funnel alignment) | Common | Critical | action verbs, above-fold + repeated, page-appropriate ("Check Availability"/"Get ePrice" on VDP, "Value Your Trade" on Trade-In) | **0.18** |
| **CTA crowding** | Common | Medium | penalize > ~5 competing primary CTAs per viewport | **0.05** |
| **Form presence** | Page-specific: Trade-In, Finance, Contact, Service | High | lead form exists where expected; N/A elsewhere (renormalize) | **0.09** |
| **Form length / required-vs-optional** | Page-specific (forms) | High | minimal fields, only essentials required; friction score | **0.08** |
| **Inline validation** | Page-specific (forms) | Medium | real-time HTML5/JS validation, clear messages | **0.05** |
| **Submit clarity / multi-step progress** | Page-specific (forms) | Medium | specific submit label; stepper on multi-step | **0.04** |
| **Friendly error handling / microcopy** | Page-specific (forms) | Medium | helpful errors, helper text, placeholders | **0.04** |
| **Trust badges** | Common (near forms) | Medium | SSL/secure/BBB/verified near PII forms | **0.05** |
| **Testimonials / reviews / ratings** | Common | High | visible social proof, ideally Review/AggregateRating schema | **0.07** |
| **Client logos / case studies / certifications & awards** | Common | Low | OEM/award/financing-partner credibility marks | **0.03** |
| **Pricing transparency** | Page-specific: **VDP, Offers, Lease, Finance** | High | actual price/payment shown, not "call for price"; fees disclosed | **0.06** |
| **Vehicle history (CARFAX/AutoCheck)** | Page-specific: **VDP** | Medium | functional VIN-specific report badge/link | **0.04** |
| **Click-to-call** | Common (mobile) | Medium | `tel:` href, consistent number, schema `telephone` | **0.04** |
| **Chat experience** | Common | Low | chat widget present, mobile-friendly, persists to VDP, off-hours capture | **0.03** |
| **Thank-you pages / lead confirmation** | Page-specific (forms) | Low | confirmation page/state for conversion tracking + UX | **0.03** |
| **GA4 installed** | Site-wide | High | gtag/GA4 present & firing | **0.05** |
| **GTM configuration** | Site-wide | Medium | container present, not empty | **0.03** |
| **Conversion tracking** | Site-wide | High | form-submit / call / chat events configured | **0.04** |
| **CRM integration** | Site-wide | Low | CRM vendor script (VinSolutions/DealerSocket/eLead) + form action wired | **0.02** |
| **Trade-in valuation tool** | Page-specific: **Trade-In** | Critical | valuation tool present & functional; KBB/partner trust | **+0.15 on Trade-In** |
| **Finance / payment calculator** | Page-specific: **Finance, VDP** | High | calculator present, fields, real-time calc | **+0.10 on Finance/VDP** |
| **Appointment booking** | Page-specific: **Service** | Critical | scheduler present, date picker, service-type selection | **+0.12 on Service** |
| **Service specials / coupons / incentives displayed** | Page-specific: **Service, Offers** | Medium | current offers visible, not expired | **+0.06** |
| **Lead magnets** | Common | Low | gated value (price alerts, guides) as soft conversion | **0.02** |

> Note: "Incentives Displayed," "Progress Indicators," "Microcopy Clarity," "Case Studies Accessibility" in the current product are **sub-facets** of the parameters above — fold them in rather than scoring separately (Part 4).

---

<a name="sec-aio"></a>
### 2.7 AIO — AI Optimization (ingestion / parse hygiene)

**Goal.** Make the page maximally *machine-ingestible* — clean structure an LLM/crawler parses without rendering. Distinct from AEO (answerability). **Page speed and brand-entity overlaps stay informational here (weight 0)** — Technical and AEO own them.

| Parameter | Applicability | Priority | What / Correct measure | w |
|---|---|---|---|---|
| **Structured-data validity** (JSON-LD parses, no errors/warnings, matches visible content) | Common | Critical | validate against schema.org + Rich Results criteria; type-appropriate (Vehicle/Offer/ItemList/FAQ/Article/LocalBusiness) | **0.20** |
| **NLP-friendly content** (semantic HTML, real text not image/JS-only, hierarchical headings) | Common | High | content present in raw HTML (server-rendered), semantic tags, real paragraphs/lists | **0.16** |
| **Answer-oriented structure** | Common | High | question-style headings each followed by a self-contained answer | **0.12** |
| **Duplicate-content readiness** | Common | High | canonical + noindex used correctly so AI ingests one version (VDP/OEM-copy problem) | **0.12** |
| **Keyword/entity annotation** | Common | Medium | entities surfaced in headings/alt/meta; consistent make/model/trim naming | **0.10** |
| **Content freshness markers** | Common (High on Blog/Offers) | Medium | `dateModified` schema, visible "updated" date, `Last-Modified` header | **0.10** |
| **AI-friendly internal linking** | Common | Medium | crawlable `<a href>` (not JS onclick), descriptive anchors, shallow path to inventory | **0.10** |
| **Topical focus clarity** | Common | Medium | one topic per page; Title/H1/URL aligned | **0.10** |

> **Vehicle/ItemList schema validity** is the dominant AIO factor on VDP/SRP; **freshness + answer-oriented structure** dominate on Blog.
>
> **CHALLENGE / REMOVE (Part 4):** the current AIO params *Fast Page Load* (double counts Technical → make informational, weight 0), *API Data Access* and *Dynamic Content Available* and *User Feedback Loops Present* (not standard AIO signals, low evidentiary basis → remove or demote to info). *Content Chunking, Lists & Structured Blocks, Terminology Consistency, Fact vs Opinion, Content Completeness, Author & Source Attribution* are real but **overlap AEO structured-content/E-E-A-T and UX readability** — keep the strongest (structured blocks, terminology consistency) and merge the rest to avoid a bloated 18-item AIO section.

---

<a name="sec-aeo"></a>
### 2.8 AEO — Answer Engine Optimization

**Goal.** Be quotable/citable by AI answer engines (Google AI Overviews, Gemini, ChatGPT-search, Perplexity). Score per-engine where access rules differ (bot access), then average. **Page speed and brand-entity stay informational (weight 0)** — no double counting.

| Parameter | Applicability | Priority | What / Correct measure | w |
|---|---|---|---|---|
| **Schema markup (page-appropriate)** | Common (type varies) | Critical | right type + valid + complete required props: Vehicle/Offer (VDP), ItemList (SRP), FAQPage/HowTo/Article (Blog/FAQ), AutoDealer/LocalBusiness (Home/Contact) | **0.20** |
| **Answer-first structure** | Common | High | direct answer in first ~40–60 words / TL;DR lead | **0.15** |
| **Bot access (per engine)** | Common (site-wide) | High | robots.txt + meta + X-Robots allow GPTBot/Google-Extended/PerplexityBot/etc.; score per engine, avg | **0.11** |
| **Structured content (tables/lists)** | Common | Medium | machine-parseable spec tables/`<dl>`, comparison tables (not spec-as-image) | **0.09** |
| **FAQ / Q&A blocks + FAQPage schema** | Page-specific: FAQ, Finance, Service, VDP | Medium | question-headed sections + concise answers + schema | **0.07** |
| **Citations / attribution / outbound authority** | Common | Medium | links to authoritative sources (OEM, NHTSA, IIHS) | **0.05** |
| **Entity recognition** (single weighted entity check) | Common | Medium | Org schema + Knowledge Graph presence (`sameAs`, consistent name) | **0.07** |
| **Citation / NAP consistency** | Common (Home/Contact/Service) | Medium | name/address/phone identical on-page & vs GBP | **0.06** |
| **Topical authority** | Common (High on Blog) | Medium | depth + clustering around dealership topics | **0.05** |
| **Index coverage (GSC URL Inspection)** | Site-wide | Medium | are key pages actually indexed (real data via GSC; sitemap-estimate fallback flagged `estimate`) | **0.04** |
| **`sameAs` authority validation** | Common (Home/About) | Low | extracted `sameAs` URLs resolve + name-match (GBP/FB/LinkedIn/Yelp/DealerRater) | **0.04** |
| **llms.txt** | Site-wide | Low | `/llms.txt` present & well-formed (also feeds AI Agentic Browsing) | **0.02** |
| **E-E-A-T: Experience / Expertise / Authority** | Page-specific: **About, Blog, Service** | High on Info/Blog | author bios, credentials, team, reviews, mentions; **one consolidated E-E-A-T score**, weighted only where editorial content lives | **0.10 on Blog/About** |
| **Brand entity strength** | Common | informational · **0%** | brand-authority meter; overlaps Entity Recognition — info only | — |
| **Page-speed signal** | Common | informational · **0%** | owned by Technical (§2.1) | — |

> **CONSOLIDATE (Part 4):** the product currently has **separate** *Experience Signals*, *Expertise Signals*, and *Authority Signals* **plus** *Brand Entity Strength* **plus** *Entity Recognition* **plus** *Citation Consistency*. These are six overlapping authority/identity signals. Collapse to: **(1) Entity Recognition** (weighted identity), **(2) E-E-A-T composite** (weighted on editorial pages), **(3) NAP/Citation consistency** (weighted on local pages). Keep Brand Entity Strength informational. This removes the triple-counting of "dealer authority."

---

<a name="part-3"></a>
## Part 3 — NEW parameter: AI Agentic Browsing

**Status:** Shipped in **Lighthouse 13.3.0 (May 7 2026)** as a new top-level category and inherited by **PageSpeed Insights** within ~2 weeks. Experimental / "under development." Requires Chrome 150+ (and WebMCP origin-trial registration for the WebMCP audits).

**Section to place it in:** **AIO** (it measures machine-*interactability* — how well an AI agent can read, understand, and *transact* on the page). Cross-reference its sub-checks to existing parameters to avoid double counting.

**What it is.** A category of **deterministic audits** scoring how well a site is built for **AI agents** (not human readers) to navigate and act on — the "agentic web." Unlike Performance/SEO, it deliberately has **no single weighted 0–100 score**; it returns a **fractional pass ratio + per-audit pass/fail + informational counts**, because the standards are still emerging and Google wants signal-gathering, not a definitive rank.

**Sub-checks (what each measures):**
1. **WebMCP integration** — does the site expose tools an agent can call? Audits: *registered WebMCP tools* (declarative HTML-defined + imperative JS-defined), *forms missing declarative WebMCP annotation*, *WebMCP schema validity*. This is the frontier signal — lets a site offer explicit machine commands (e.g. "search inventory", "book service").
2. **Accessibility for agents** — is the accessibility tree well-formed? Names/labels on interactive elements, valid roles, correct parent-child relationships, content visible to the a11y tree. **(Shares evidence with §2.3 Accessibility — measure the a11y tree once, surface in both, but only weight it once.)**
3. **Stability — CLS** — layout shift assessed specifically because shifts break agent click targeting. **(Shares evidence with §2.1 CLS — informational here.)**
4. **Discoverability — llms.txt** — presence of a machine-readable summary at the domain root. **(Shares evidence with §2.8 AEO llms.txt.)**

**Why it matters (dealership context).** AI agents are starting to shop and book on behalf of users ("find me a 2024 RAV4 under $35k near me and schedule a test drive"). A dealer site that an agent can parse and *transact* on (inventory search, trade valuation, service booking exposed via WebMCP + clean a11y tree) will win agent-mediated traffic. Early adoption is a competitive moat precisely because the category is new.

**How it SHOULD be measured (correctly):**
- Run it as a **diagnostic panel**, not a heavily-weighted score, mirroring Google's own stance (it is intentionally unweighted upstream).
- Report **three independent sub-scores**: *WebMCP readiness* (fraction of forms/actions annotated + schema-valid), *agent accessibility* (a11y-tree integrity %), *agent stability* (CLS pass). Plus a binary *llms.txt present*.
- **Weight only the genuinely-new dimension (WebMCP) inside AIO at a small weight (≈5–8 %)**; keep agent-accessibility, CLS, and llms.txt **informational here** because they are already weighted in Accessibility, Technical, and AEO respectively. This is the only way to add the parameter without inflating three sections.
- Flag `confidence: lab` and `experimental: true`; expect run-to-run variability (dynamic tool registration timing).

**High score indicators:** WebMCP tools registered, all lead/search forms annotated declaratively with valid schema, well-formed accessibility tree (names/roles/relationships), low CLS, llms.txt present and well-formed, semantic HTML + proper ARIA.

**Low score indicators:** no WebMCP, JS-only forms with no machine affordance, broken/missing a11y tree (unlabeled controls, wrong roles), high CLS, no llms.txt, content rendered only via client-side JS.

**Suggested weightage:** **Within AIO: ~6 %** (WebMCP arm only; rest informational). **Relative importance:** Medium-rising — Low impact today, High strategic priority for early movers. **Priority:** Medium (Monitor + early-adopt). **Page-type tilt:** highest value on **SRP** (agent inventory search), **VDP** (agent "check availability"), **Service** (agent booking), **Trade-In/Finance** (agent valuation/pre-qual); near-zero on Blog/About.

**Sources:**
- [Lighthouse agentic browsing scoring — Chrome for Developers](https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring)
- [Google Lighthouse Has A New Agentic Browsing Category — DebugBear](https://www.debugbear.com/blog/lighthouse-agentic-browsing)
- [Chrome added an Agentic Browsing audit to Lighthouse — Bridge to Agent](https://www.bridgetoagent.com/blog/lighthouse-agentic-browsing)

---

<a name="part-4"></a>
## Part 4 — Critical analysis

> Rationale is given for every recommendation. "Inaccuracy" here is mostly **mis-sectioning, double counting, presence-not-quality scoring, and N/A-as-zero** — not arithmetic bugs.

### 4.1 Duplicate parameters (same thing scored twice)
| Duplicate | Where it appears now | Fix | Rationale |
|---|---|---|---|
| **GA4 Installed, GTM Configuration, Conversion Tracking** | Security **and** Conversion | Keep in **Conversion** only | They measure marketing measurability, not security; scoring them in Security distorts both section scores. |
| **Mobile Usability** | Technical **and** UX | Keep **one** "Mobile experience" in **UX**; remove from Technical | Google retired the Mobile Usability report (Dec 2023); it is a UX/responsive concern, not a CWV. |
| **CLS** | Technical **and** AI Agentic Browsing | Weight in **Technical**; informational in Agentic | Same measurement; double-weighting inflates "stability." |
| **llms.txt** | AEO **and** AI Agentic Browsing | Weight in **AEO**; informational in Agentic | Same file, one weighted home. |
| **Viewport meta** | On-Page, Accessibility, **and** Security ("Viewport Meta Tag") | Measure once; weight in **On-Page** (mobile-readiness) + **Accessibility** (zoom); remove from Security | Three sections scoring one tag is triple-counting. |
| **Accessibility tree / names-labels** | Accessibility **and** AI Agentic Browsing | Weight in **Accessibility**; informational in Agentic | Same a11y tree. |
| **Image alt** | On-Page ("Image Optimization") **and** Accessibility ("Image Alt Text") | Measure alt once; weight in **both** but with distinct intent (indexing vs a11y) and **shared evidence** | Acceptable dual-weight *only because intents differ*; must use one measurement to stay consistent. |

### 4.2 Overlapping parameters (partial overlap; clarify boundaries)
| Overlap cluster | Members | Resolution |
|---|---|---|
| **Dealer authority/identity** | Entity Recognition, Brand Entity Strength, Authority Signals, Experience Signals, Expertise Signals, Citation Consistency, `sameAs` | Collapse to **3 weighted** (Entity Recognition, E-E-A-T composite, NAP/Citation consistency) + Brand Entity Strength informational. Eliminates 3× authority counting. |
| **Internal linking** | On-Page "Internal link profile", On-Page "Contextual Link Analysis", AIO "AI-friendly internal linking" | One **measurement** of the link graph; weight the SEO arm (On-Page) and the crawlability arm (AIO) from shared evidence. |
| **Readability / NLP** | UX "Text Readability", AIO "Content NLP Friendly" | UX owns human readability (Flesch); AIO owns machine-parse hygiene (semantic HTML, server-rendered text). Keep both but redefine AIO's as *parse-ability*, not readability. |
| **Answer structure** | AEO "Answer-first", AIO "Answer-oriented structure" | AEO = "is the answer first and quotable"; AIO = "is each section a self-contained Q→A block". Keep distinct with these sharpened definitions, else merge into AEO. |
| **Schema/structured data** | AIO "Structured Data", AEO "FAQ & HowTo Schema", AEO schemaMarkup | AIO owns **validity** (does JSON-LD parse, match content); AEO owns **type-appropriateness** (right schema for page type). Distinct, complementary. |
| **Trust/credibility** | Conversion "Trust Badges/Client Logos", UX "Certifications & Awards", AEO "Authority Signals" | Conversion owns near-form trust; AEO owns citation authority; merge UX "Certifications & Awards" into Conversion. |
| **Hierarchy/flow** | UX "Content Hierarchy Clarity", "Section Labeling Clarity", "Page-to-Page Flow" | Merge into **one** "Hierarchy & flow clarity." |
| **Disclaimers vs Pricing transparency** | Security "Finance Form Security/disclaimers", Conversion "Pricing Transparency", UX "Pricing Transparency" | Legal disclaimers → Security/Compliance; commercial price visibility → Conversion. Remove UX "Pricing Transparency." |

### 4.3 Parameters to MERGE
- **Inventory Page Load Time + Service Page Load Time → "CWV measured on that page type"** (not bespoke metrics).
- **Rendering Performance + JS Execution Efficiency + Lazy Loading + Third-Party Script Optimization → diagnostics under INP/TBT + Resource optimization + Render-blocking** (they are evidence, not independent scores).
- **Content Chunking + Lists & Structured Blocks → AIO "Structured content."**
- **Microcopy Clarity + Friendly Error Handling + Progress Indicators → Conversion "Form quality" facets** of Form length / validation / submit-clarity.
- **Section Labeling + Hierarchy Clarity + Page-to-Page Flow → one UX clarity parameter.**
- **Experience + Expertise + Authority Signals → one E-E-A-T composite.**
- **Cookies Secure + Cookies HttpOnly → one "Cookie flags" parameter** (plus SameSite).

### 4.4 Parameters to REMOVE (or demote to informational, weight 0)
| Parameter | Why remove/demote |
|---|---|
| **Meta keywords** | Deprecated since ~2009; ignored by all engines. Info only. |
| **FID** | Removed from CrUX (Sept 2024); replaced by INP. Info only. |
| **Fast Page Load (in AIO)** | Pure double-count of Technical CWV. Informational. |
| **Mobile Usability (in Technical)** | Retired Google report; merged into UX Mobile experience. |
| **API Data Access / Dynamic Content Available / User Feedback Loops Present (AIO)** | Not standard AIO signals; low evidentiary basis; ambiguous to measure reliably. Demote to info or remove. |
| **Brand Entity Strength (as a weighted score)** | Overlaps Entity Recognition → double counts. Informational (already the standing rule). |
| **Page-speed signal (in AEO)** | Owned by Technical. Informational. |
| **Malware Scan vs Blacklist Status vs Safe Browsing as 3 params** | Largely the same reputation gate; keep one composite "Reputation" with 3 evidence sources. |

### 4.5 Parameters MISSING (should be added)
| Missing parameter | Section | Why it matters |
|---|---|---|
| **AI Agentic Browsing / WebMCP** | AIO | The explicit new requirement (Part 3); frontier agent-readiness signal. |
| **Open Graph / social card tags** | On-Page SEO | Controls social + AI-card rendering; currently absent from On-Page set. |
| **Robots meta / robots.txt index intent** | On-Page SEO | Accidental `noindex` on money pages is catastrophic and invisible; must be checked. |
| **Sitemap quality** (presence, freshness `<lastmod>`, URL count, broken-URL sample, inventory coverage) | Technical | Foundation of page discovery; stale inventory sitemaps hurt indexing. |
| **Pagination & faceted index control** | On-Page SEO (SRP) | Index-bloat is the #1 SRP SEO problem; currently unscored. |
| **Sold-vehicle / soft-404 handling** | Technical (VDP) | Inventory churn creates dead VDPs; soft-404s waste crawl budget. |
| **Unique VDP description / duplicate-vs-OEM** | On-Page SEO (VDP) | #1 VDP ranking killer; only partially present. |
| **Hreflang / alternate** | Technical/On-Page | For bilingual (EN/FR/ES) dealer markets. |
| **WCAG 2.2 new criteria** (Target size, Focus not obscured, Reflow, Text spacing, Reduced-motion) | Accessibility | Product appears anchored to WCAG 2.1; 2.2 is current AA. |
| **Review / AggregateRating schema** | AEO + Conversion | Star ratings in SERP/AI answers; high CTR + trust. |
| **GBP / local-pack optimization** (NAP vs Google Business Profile via Places API) | AEO | Local pack is the dominant dealer discovery surface. |
| **Font / web-font optimization (`font-display`, preconnect)** | Technical | Common CLS/LCP cause on dealer themes. |
| **Image gallery quality (VDP)** | UX/On-Page (VDP) | Inventory differentiator; real-vs-stock photos. |

### 4.6 Assumptions challenged
- **"More parameters = better audit" is false.** The current ~140-item set over-counts authority, page speed, and linking. Consolidating to ~70 well-defined, correctly-sectioned parameters will produce *more* accurate scores, not fewer insights.
- **"Lab data is fine for CWV" is false.** Lab (Lighthouse) systematically diverges from field (CrUX). Prefer field; flag lab as estimate.
- **"Automated = full accessibility coverage" is false.** Cap and label ~40 %.
- **"Every parameter applies to every page" is false.** Renormalize N/A — the biggest accuracy fix.
- **"Security headers are pass/fail" is partly false.** HTTPS/malware are gates (near-binary); CSP/cookies are graded by coverage.

---

<a name="part-5"></a>
## Part 5 — Deliverables

### 5.1 Common parameters across ALL pages
Scored on every page (renormalize sub-checks if genuinely absent). Weightage shown is **within its section**.

| Parameter | Section | Weightage (in section) | Importance |
|---|---|---|---|
| LCP | Technical | 22% | Critical |
| INP / TBT | Technical | 20% | Critical |
| CLS | Technical | 18% | Critical |
| FCP | Technical | 8% | High |
| TTFB | Technical | 8% | High |
| Speed Index | Technical | 6% | Medium |
| Render-blocking resources | Technical | 5% | Medium |
| Resource optimization | Technical | 5% | Medium |
| Compression | Technical | 4% | Medium |
| Caching policy | Technical | 4% | Medium |
| Meta title | On-Page SEO | 15% | Critical |
| Canonical tag | On-Page SEO | 11% | High |
| Heading hierarchy (H1) | On-Page SEO | 11% | High |
| Meta description | On-Page SEO | 9% | High |
| Robots meta / index intent | On-Page SEO | 8% | High |
| URL structure | On-Page SEO | 8% | Medium |
| Image optimization | On-Page SEO | 8% | Medium |
| Internal link profile | On-Page SEO | 7% | Medium |
| Open Graph tags | On-Page SEO | 6% | Medium |
| Content relevance | On-Page SEO | 6% | Medium |
| Color contrast | Accessibility | Critical tier | Critical |
| Form labels | Accessibility | Critical tier | Critical |
| HTML lang | Accessibility | Critical tier | Critical |
| Keyboard nav / focus | Accessibility | Critical tier | Critical |
| Image alt | Accessibility | Serious tier | High |
| Link & button names | Accessibility | Serious tier | High |
| HTTPS + mixed content | Security | 13% (gate) | Critical |
| Safe Browsing / reputation | Security | 9% (gate) | Critical |
| CSP | Security | 9% | High |
| SSL/TLS validity | Security | 7% | Critical |
| HSTS | Security | 5% | High |
| Text readability | UX & Content | 10% | High |
| Intrusive interstitials | UX & Content | 11% | High |
| Navigation discoverability | UX & Content | 11% | High |
| Broken links | UX & Content | 11% | High |
| Above-the-fold content | UX & Content | 9% | High |
| Mobile experience | UX & Content | 9% | High |
| CTA effectiveness | Conversion | 18% | Critical |
| Testimonials / reviews | Conversion | 7% | High |
| Trust badges | Conversion | 5% | Medium |
| GA4 installed | Conversion | 5% | High |
| Conversion tracking | Conversion | 4% | High |
| Click-to-call | Conversion | 4% | Medium |
| Structured-data validity | AIO | 20% | Critical |
| NLP-friendly content | AIO | 16% | High |
| Answer-oriented structure | AIO | 12% | High |
| Duplicate-content readiness | AIO | 12% | High |
| AI-friendly internal linking | AIO | 10% | Medium |
| Topical focus clarity | AIO | 10% | Medium |
| Content freshness markers | AIO | 10% | Medium |
| AI Agentic Browsing (WebMCP arm) | AIO | 6% | Medium (rising) |
| Schema markup (page-appropriate) | AEO | 20% | Critical |
| Answer-first structure | AEO | 15% | High |
| Bot access (per engine) | AEO | 11% | High |
| Structured content (tables/lists) | AEO | 9% | Medium |
| Entity recognition | AEO | 7% | Medium |
| Citation / NAP consistency | AEO | 6% | Medium |
| Citations / attribution | AEO | 5% | Medium |
| Topical authority | AEO | 5% | Medium |

### 5.2 Page-specific parameters
Scored **only** on the listed page(s); excluded from the denominator elsewhere. Weightage = added weight within that page's relevant section (renormalize the section's common params downward).

#### Home (A)
| Parameter | Why it exists | Weightage |
|---|---|---|
| AutoDealer / Organization schema | Org identity for Knowledge Graph + AI | +8% AEO |
| Value proposition / multi-CTA hub (inventory/service/finance routes) | Home is the router to every funnel | +10% Conversion |
| LocalBusiness + NAP + hours + map | Local pack eligibility | +6% AEO/UX |
| `sameAs` authority validation | Entity disambiguation | +4% AEO |

#### Inventory / SRP (B)
| Parameter | Why it exists | Weightage |
|---|---|---|
| ItemList schema | List of vehicles for rich/AI results | +10% AEO/AIO |
| Pagination & faceted index control | Prevent index bloat (SRP-only risk) | +8% On-Page |
| Inventory filtering usability | Core SRP task | +10% UX |
| No-results UX | Recover dead-end searches into leads | +6% UX |
| Internal links SRP→VDP | Crawl depth to inventory | +6% On-Page/AIO |
| AI Agentic Browsing (inventory search via WebMCP) | Agent shopping | info/+ AIO |

#### VDP (C)
| Parameter | Why it exists | Weightage |
|---|---|---|
| Vehicle/Car schema (make/model/year/VIN/mileage/condition) | Only a single-vehicle page can carry it | +12% AEO/AIO |
| Offer schema (price, availability, priceValidUntil) | Priced item for rich/AI results | +8% AEO |
| Unique description / duplicate-vs-OEM | #1 VDP ranking killer | +12% On-Page |
| Vehicle image gallery quality | Inventory differentiator | +10% UX |
| Sold-vehicle / 404 handling | Inventory churn → dead pages | +5% Technical |
| Pricing transparency / payment context | Lead driver | +6% Conversion |
| Finance / payment calculator | On-VDP conversion | +10% Conversion |
| Vehicle history (CARFAX/AutoCheck) | Trust | +4% Conversion |

#### Offers / Promotions (D)
| Parameter | Why it exists | Weightage |
|---|---|---|
| Offer schema + expiry (`priceValidUntil`, visible end date) | Time-bound deals | +8% AEO/UX |
| Legal/financial disclaimers (FTC/Reg-Z) | Compliance requirement | +8% Security |
| Pricing transparency | Deal clarity | +6% Conversion |
| Service specials / coupons (if applicable) | Conversion | +6% Conversion |

#### Lease Specials (E)
| Parameter | Why it exists | Weightage |
|---|---|---|
| Lease Offer schema + monthly/term/due-at-signing | Lease-specific structured data | +8% AEO |
| Reg-M lease disclosures (cap cost, residual, money factor, total due) | Federal Consumer Leasing Act | +10% Security |
| Offer expiry / freshness | Time-bound | +6% UX |

#### Trade-In (F)
| Parameter | Why it exists | Weightage |
|---|---|---|
| Trade-in valuation tool present & functional | The reason the page exists | +15% Conversion |
| Credit/PII form security | Collects financial PII | +10% Security |
| Form length / friction | Valuation conversion | +8% Conversion |

#### Finance (G)
| Parameter | Why it exists | Weightage |
|---|---|---|
| Credit-application PII security (HTTPS POST, no PII in GET, no autocomplete leak) | SSN/financial data | +10% Security |
| Reg-Z / FTC finance disclosures | Federal Truth-in-Lending | +8% Security |
| Finance / payment calculator | Core conversion tool | +10% Conversion |
| FAQ / FAQPage schema | Finance questions for AI answers | +7% AEO |
| Form labels / contrast (Critical tier on PII form) | Blocking a11y on PII | severity-boosted Accessibility |

#### Service & Repair (H)
| Parameter | Why it exists | Weightage |
|---|---|---|
| Appointment booking scheduler | The reason the page exists | +12% Conversion |
| AutoRepair / Service schema + service menu | Local + AI discovery | +8% AEO |
| Service specials / coupons | Conversion | +6% Conversion |
| LocalBusiness + hours + NAP | Local pack | +6% AEO |
| AI Agentic Browsing (booking via WebMCP) | Agent booking | info/+ AIO |

#### About / Contact (I)
| Parameter | Why it exists | Weightage |
|---|---|---|
| AutoDealer / Organization + ContactPage/AboutPage schema | Org identity | +8% AEO |
| NAP consistency + map + hours | Local pack + trust | +6% AEO/UX |
| Staff profiles (Person schema, photos, contact) | Trust + E-E-A-T | +6% Conversion/AEO |
| E-E-A-T composite | Authority on identity pages | +10% AEO |

#### Blog / FAQ / Guides / How-To (J)
| Parameter | Why it exists | Weightage |
|---|---|---|
| Article/BlogPosting schema (+author, datePublished/Modified) | Editorial rich/AI results | +8% AEO/AIO |
| FAQPage / HowTo schema | Q&A and step content for AI answers | +8% AEO |
| E-E-A-T composite (author bios, credentials) | Citation engine for the dealer | +10% AEO |
| Content freshness markers | Recency for AI citation | +10% AIO |
| Topical authority / clustering | Depth for ranking + citation | High |

### 5.3 Section score — how to calculate
```
section_score(page) = Σ(parameter_score × w_param) / Σ(w_param)   over APPLICABLE params only
```
Rules: (1) renormalize weights over the applicable set (N/A params dropped, not zeroed); (2) apply severity multipliers in Accessibility (Critical ×3 / Serious ×2 / Moderate ×1) and gates in Security (HTTPS missing → ≤30; malware flag → ≤25); (3) carry the lowest `confidence` of contributing params; (4) cap Accessibility at "automated coverage" and label it.

### 5.4 Page score — how to calculate
```
page_score = Σ(section_score(page) × w_section(page))     where Σ w_section(page) = 1
```
Use the per-page section-weight table in §5.6. Sections that don't apply to a page (rare) are renormalized out.

### 5.5 Site score — how to calculate
```
site_score = Σ(page_score × page_importance × type_count) / Σ(page_importance × type_count)
```
`page_importance`: Home 2.0, VDP 1.75, SRP 1.5, Finance/Trade-In/Offers/Lease 1.25, Service 1.0, About/Contact 0.75, Blog/FAQ 0.75. Multiply by the count of sampled pages of that type so the site score reflects the real page mix, not a single outlier. Report site score **with** a per-section site rollup and a per-page-type breakdown (never a single number alone).

### 5.6 Weight distribution across the 8 sections
**Base weights (sum = 100):**

| Section | Base weight |
|---|---|
| Technical | **18%** |
| On-Page SEO | **17%** |
| Accessibility | **10%** |
| Security & Compliance | **12%** |
| UX & Content | **13%** |
| Conversion Flow | **15%** |
| AIO | **8%** |
| AEO | **7%** |
| **Total** | **100%** |

**Per-page tilt (each column sums to 100):** apply these instead of the flat base on each page type.

| Section | Home | SRP | VDP | Offers | Lease | Trade-In | Finance | Service | About/Contact | Blog/FAQ |
|---|---|---|---|---|---|---|---|---|---|---|
| Technical | 18 | 20 | 18 | 15 | 15 | 14 | 14 | 16 | 14 | 14 |
| On-Page SEO | 18 | 20 | 18 | 16 | 16 | 12 | 12 | 16 | 16 | 22 |
| Accessibility | 10 | 9 | 9 | 9 | 9 | 11 | 11 | 10 | 11 | 11 |
| Security & Compliance | 12 | 8 | 8 | 13 | 14 | 16 | **22** | 10 | 10 | 9 |
| UX & Content | 12 | 13 | 13 | 12 | 12 | 13 | 11 | 13 | 15 | 15 |
| Conversion Flow | 14 | 14 | 18 | 17 | 16 | **22** | 18 | 19 | 12 | 7 |
| AIO | 8 | 8 | 7 | 6 | 6 | 6 | 6 | 8 | 10 | 10 |
| AEO | 8 | 8 | 9 | 12 | 12 | 6 | 6 | 8 | 12 | 12 |
| **Total** | 100 | 100 | 100 | 100 | 100 | 100 | 100 | 100 | 100 | 100 |

**Rationale:** **Finance** tilts hard to Security (PII + Reg-Z). **Trade-In** tilts to Conversion (the page exists to capture a lead). **Offers/Lease** raise Security (FTC/Reg-Z/Reg-M disclaimers) and AEO (Offer schema/expiry). **Blog/FAQ** tilt to On-Page + AEO (discovery + AI citation are their job). **SRP** raises Technical + On-Page (CWV under inventory load + index control). **About/Contact** raise UX + AEO (trust + entity/E-E-A-T).

---

## Appendix — How to use this spec to rebuild scoring
When you return to implement: (1) build the **page-type detector** (URL + DOM heuristics, §1); (2) encode a **parameter registry** with `appliesTo[pageType]` flags, `w_in_section`, `priority`, `confidence_source`, and `informational` boolean (so double-counted signals are weight-0 in their non-owning section); (3) implement the **renormalizing roll-up** (§5.3–5.5); (4) apply **severity multipliers** (Accessibility) and **gates** (Security); (5) add the **AI Agentic Browsing** diagnostic with only the WebMCP arm weighted (§3); (6) execute the **consolidations/removals** in §4.3–4.4 before adding the §4.5 missing parameters. The result is ~70 correctly-sectioned, correctly-weighted, graded parameters replacing the current ~140 over-counted ones.

*No code was changed by this document.*
