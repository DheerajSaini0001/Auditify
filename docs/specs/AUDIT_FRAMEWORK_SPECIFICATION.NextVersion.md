# Auditify — Master Audit Framework Specification (Next Version)

> **Status:** Planning / documentation only. **No code was read for correctness, no code was changed, nothing was implemented.** This document is a rebuild blueprint.
>
> **Author lens:** Enterprise SEO consultant + technical auditor + AI-search optimization expert + accessibility specialist + product architect.
>
> **Date:** 2026-06-18
>
> **Scope of analysis:** Every audit parameter currently computed by the platform's eight metric services (`technicalMetrics.js`, `seoMetrics.js`, `accessibilityMetrics.js`, `securityCompliance.js`, `uxContentStructure.js`, `conversionLeadFlow.js`, `aioReadiness.js`, `aeoService.js` + `signals/*`). Parameter behaviour below is described from the inventory; **correctness was deliberately NOT judged from code** — every measurement-methodology critique is grounded in external industry standards (Google/Bing guidance, Core Web Vitals, WCAG 2.2, Schema.org, PageSpeed/Lighthouse methodology, current AEO/AIO practice).

---

## How To Read This Document

1. **Section 1** — Complete inventory of every existing parameter, grouped by the *current* code module, with the count and current scoring role.
2. **Per-Parameter Deep Dive** — The bulk of the document. Every parameter analysed under the required template (Category / Common-or-Page-Specific / What / Why / How Measured / High & Low score indicators / Improvements / Suggested weightage). Organised by the **new** 8-section taxonomy so reclassification is visible at a glance.
3. **Sections 2–3** — Common-parameter table and page-type-specific tables (Home, SRP, VDP, Offers, Trade-In, Finance, Service, About/Contact, Blog/FAQ).
4. **Sections 4–6** — AIO, AEO and the new **AI Agentic Browsing** frameworks.
5. **Section 7** — Recommended scoring architecture (section score → page score → site score) and the 100% weight distribution.
6. **Appendices** — Duplicates to merge, parameters to remove, missing parameters, and the page-discovery / page-classification model the new flow requires.

A recurring **critique flag** convention is used:
- 🟥 **Accuracy risk** — methodology is likely to produce misleading scores by industry standards.
- 🟧 **Overlap / duplication** — the parameter is measured (in whole or part) elsewhere.
- 🟦 **Reclassify** — belongs in a different section than today.
- 🟩 **Sound** — methodology broadly matches industry standard.

---

## The Target Taxonomy (8 Sections)

| # | Section | Core question it answers |
|---|---------|--------------------------|
| 1 | **Technical** | Can the page be loaded fast, rendered, and crawled efficiently on every device? |
| 2 | **On-Page SEO** | Will classic search engines understand, index, and rank this page? |
| 3 | **Accessibility** | Can people with disabilities (and assistive tech) use this page? |
| 4 | **Security & Compliance** | Is the page safe, encrypted, and legally compliant? |
| 5 | **UX & Content** | Is the page usable, readable, and well-structured for humans? |
| 6 | **Conversion Flow** | Does the page move a shopper toward a lead/sale? |
| 7 | **AIO (AI Optimization)** | Can an LLM *ingest and understand* this content correctly? |
| 8 | **AEO (Answer Engine Optimization)** | Will answer engines *cite/surface* this business as the answer? |

> **AIO vs AEO — the dividing line used throughout this document.**
> - **AIO** is about *machine comprehension of the page itself*: structure, chunking, semantic HTML, schema for parsing, NLP-friendliness, freshness signals, content completeness, and **agent operability** (the new Agentic Browsing layer). "Can the machine read and act on this page?"
> - **AEO** is about *off-page/page-level visibility inside answer engines*: being allowed in (AI bot access), being citable (citations, entity/NAP consistency, topical authority), being surfaced as a direct answer (answer-first, FAQ/HowTo schema), and per-engine readiness (Gemini/ChatGPT/Perplexity/Google AI Overviews). "Will the answer engine pick and cite this business?"
>
> The current codebase blurs these: `aioReadiness.js` and `aeoService.js` both measure schema, structured content, answer-oriented structure, freshness, internal linking and author attribution. Section 4/5 below de-duplicate them.

---

# SECTION 1 — Complete Inventory of Current Audit Parameters

Eight sections exist in code today. Total distinct scored/info parameters ≈ **160** (some duplicated across modules — flagged later).

### 1.1 Technical (`technicalMetrics.js`) — 24 parameters + 4 informational variants
Core Web Vitals (lab + CrUX field): **LCP, INP, CLS, FCP, TTFB, FID, TBT, SI**; Asset/Resource: **Text Compression, Browser Caching, Resource Optimization, Render-Blocking, Redirect Chains**; Rendering: **Rendering Performance, Lazy Loading, Third-Party Script Optimization, JS Execution**; Official score: **PageSpeed/Lighthouse Performance Score** (info-only); Mobile: **Mobile Load Speed, Mobile Usability**; Dealership timed pages: **Inventory Load Time, Service Load Time**.

### 1.2 On-Page SEO (`seoMetrics.js`) — 25 weighted + 3 info parameters
**Title, Title Uniqueness, Title Keyword Optimization, Title Location Optimization, Meta Description, Meta Description Uniqueness, H1, Content Relevance, Content Freshness, URL Structure** (info), **URL Slugs, Canonical, Heading Hierarchy (H1–H6), Semantic Tags, Image, Video, Links, Contextual Linking, Robots.txt, Sitemap, Structured Data, Open Graph, Twitter Card, Social Links / sameAs, EEAT**; info-only: **Service Content Quality, Content Depth Quality, Local SEO** (8 sub-signals: NAP, schema, location targeting, local keywords, local landing pages, business-info completeness, GBP signals, review signals).

### 1.3 Accessibility (`accessibilityMetrics.js`) — 19 weighted + 2 composite/info
**Color Contrast, Focus Order, Focusable Content, Tab Index, Interactive Element Affordance, Form Label, ARIA Allowed Attr, ARIA Roles, ARIA Hidden Focus, Image Alt, Link Name, Button Name, Document Title, HTML Lang, Meta Viewport, List Structure, Heading Order, Skip Links, Landmarks**; composites: **Keyboard Navigation** (aggregate, not scored), **WCAG 2.1 AA Compliance** (info-only). axe-core driven.

### 1.4 Security & Compliance (`securityCompliance.js`) — 25 parameters
**HTTPS (+ mixed content), SSL, TLS Version, SQLi Exposure, XSS, Google Safe Browsing, Domain Blacklist, Malware Scan (VirusTotal), Weak Default Credentials, Admin Panel Public, Forms Use HTTPS, CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Cookies Secure, Cookies HttpOnly, MFA Enabled, Cookie Consent, Privacy Policy, GDPR/CCPA, Third-Party Cookies, Data Collection Disclosure, CRM Integration, Finance Form Security (PCI)**; display-only passthrough: GA4/GTM/Conversion Tracking.

### 1.5 UX & Content (`uxContentStructure.js`) — 19 weighted + 4 info
**Text Readability, Sticky Header Usage, Intrusive Interstitials, Breadcrumbs, Navigation Discoverability, Above-the-Fold Content, Interactive Click Feedback, Loading Feedback, Broken Links, UX Content Hierarchy Clarity, Section Labeling Clarity, Content Density Balance, Page-to-Page Flow, Layout Consistency, Mobile Experience, Mobile Usability, In-Page Navigation, Inventory Filtering, Pricing Transparency**; info-only: **No Results UX, Certifications & Awards, Vehicle History (CARFAX/AutoCheck), Staff Profiles**.

### 1.6 Conversion Flow (`conversionLeadFlow.js`) — 31 parameters
CTA: **CTA Presence, CTA Clarity, CTA Crowding, CTA Flow Alignment, Link Relevance**; Forms: **Form Presence, Form Length, Required vs Optional Fields, Inline Validation, Submit Button Clarity, Multi-Step Form Progress**; Trust: **Testimonials, Reviews, Trust Badges, Client Logos, Case Studies**; Form UX: **Progress Indicators, Friendly Error Handling, Microcopy Clarity**; Incentives: **Lead Magnets, Incentives Displayed**; Dealer flows: **Trade-In Flow, Financing Flow, Finance Calculator, Appointment Booking, Thank-You Pages**; Real-time: **Chat Experience, Click-to-Call**; Analytics: **GA4 Installed, GTM Configuration, Conversion Tracking**.

### 1.7 AIO (`aioReadiness.js`) — 14 parameters
**Structured Data, Content NLP Friendly, Keywords & Entities Annotated, Content Updated Regularly, Internal Linking AI-Friendly, Duplicate Content Detection Ready, Topical Focus Clarity, Answer-Oriented Structure, Content Chunking, Lists & Structured Blocks, Terminology Consistency, Author/Source Attribution, Fact vs Opinion Separation, Content Completeness**.

### 1.8 AEO (`aeoService.js` + `signals/*` + `aeoWeights.js`) — 15 signals (11 weighted, 4 info)
Weighted: **Answer-First, llms.txt, Schema (FAQ/HowTo/Product), Structured Content, Bot Access & Indexability, Markdown Headers, Citations & Trust, Index Coverage, Entity Recognition, Citation Consistency (NAP), Topical Authority**; info-only: **Brand Entity Strength, Experience Signals, Expertise Signals, Authority Signals**. Scored per engine (Gemini / ChatGPT / Perplexity), each weight-set summing to 100; overall AEO = average of the three.

### 1.9 NEW (not present today)
**AI Agentic Browsing** (Lighthouse 13.3 "Agentic Browsing" category: llms.txt quality, WebMCP, accessibility-tree integrity, CLS-for-agents). Detailed in Section 6.

---

# PER-PARAMETER DEEP DIVE

> Organised by the **new** target section. Where a parameter currently lives in a different module, a 🟦 **Reclassify** note explains the move. Weightage is expressed both as a priority tier (Critical/High/Medium/Low) and a within-section %.

---

## ▶ SECTION 1 — TECHNICAL

**Section intent:** Measure delivery speed, rendering quality, and crawl efficiency. Field data (CrUX) and lab data (Lighthouse) are both first-class; field data should always outrank lab when present.

### 1.1 Core Web Vitals — LCP / INP / CLS (the "big three")

- **Category:** Technical (LCP/CLS also feed UX perception; INP feeds UX responsiveness). 🟩
- **Common or page-specific:** **Page-specific** — CWV must be measured per template (Home, SRP, VDP, etc.). VDP and SRP are image/JS-heavy and behave very differently from the Home page. Today only the home URL + two dealership pages are timed; this is the single biggest gap for a page-level audit.
- **What:** LCP = time to render the largest above-the-fold element; INP = responsiveness across all interactions (replaced FID March 2024); CLS = visual-stability score (unexpected layout movement).
- **Why:** These three are Google's ranking-relevant page-experience signals and the strongest proxy for perceived speed. INP regressions are common on dealership SRPs (filter JS) and VDPs (image galleries, payment widgets).
- **How measured:** Lab via Lighthouse audits (`largest-contentful-paint`, `interactive`→should be the INP/responsiveness audit, `cumulative-layout-shift`); field via CrUX p75. Thresholds — LCP good ≤2.5s / poor ≥4s; CLS good ≤0.1 / poor ≥0.25; INP good ≤200ms / poor ≥500ms.
  - 🟥 **Accuracy risk:** the lab "INP" is sourced from the `interactive`/`max-potential-fid` audit with thresholds of **≤3800ms good / ≥7300ms poor**. That is TTI/TBT-era math, not INP. Real INP is good ≤200ms. A page can show "good" lab INP while real INP is 400ms+. Lab cannot measure INP at all (no real interactions) — only field INP or a TBT proxy is valid. Recommend: report **field INP** as the INP metric, and label the lab value explicitly as "TBT-based responsiveness proxy."
  - 🟧 CLS is also recomputed inside "Rendering Performance" (Technical) and surfaced again in UX and in AEO/Agentic. Measure once, reference many.
- **High score:** field p75 within "good" on mobile; stable element sizing; reserved image/ad slots; minimal main-thread blocking.
- **Low score:** hero images without dimensions, late-loading fonts, injected promo banners (common on dealer "Offers" pages), heavy third-party chat/finance widgets.
- **Improvements:** set explicit width/height on media; preload LCP image; defer non-critical JS; reserve space for sticky bars and chat widgets; lazy-init filter JS on SRP.
- **Suggested weightage:** **Critical.** Within Technical, the field "big three" together ≈ **35–40%** (LCP ~13%, INP ~13%, CLS ~12%). Lab equivalents are fallback only and should carry roughly half the weight of field when both exist.

### 1.2 Supporting load metrics — FCP / TTFB / TBT / Speed Index

- **Category:** Technical. 🟩
- **Common or page-specific:** Page-specific (TTFB is partly server/site-wide but varies by template caching).
- **What:** FCP = first pixel of content; TTFB = server response latency; TBT = main-thread blocking 50ms+ tasks (lab INP proxy); SI = how fast the viewport visually fills.
- **Why:** Diagnostic drivers behind the big three. TTFB exposes slow dealer CMS/DMS back-ends; TBT exposes heavy vendor JS.
- **How measured:** Lighthouse lab (`first-contentful-paint`, `server-response-time`, `total-blocking-time`, `speed-index`) + CrUX where available. Thresholds: FCP ≤1.8s/≥3s; TTFB ≤0.8s/≥1.8s; TBT ≤200ms/≥600ms; SI ≤3.4s/≥5.8s. 🟩 thresholds are standard.
- **High / Low score:** high = fast CDN, edge caching, minimal blocking JS; low = origin-rendered pages, no caching, synchronous vendor tags.
- **Improvements:** CDN + edge cache, compress + defer JS, server response budget <600ms, reduce third-party tags.
- **Suggested weightage:** **High** collectively ≈ **15%** within Technical (TTFB ~5%, TBT ~5%, FCP ~3%, SI ~2%). These are diagnostics; weight below the big three to avoid double-counting.

### 1.3 First Input Delay (FID)

- **Category:** Technical. 🟥 **Remove / deprecate.**
- **What/Why:** Legacy responsiveness metric; **Google fully retired FID in September 2024**, replaced by INP.
- **Recommendation:** Drop FID as a scored parameter. Keep at most an informational note for historical CrUX. Its weight should be reassigned to INP.
- **Suggested weightage:** **Low → 0%** (deprecate).

### 1.4 Text Compression

- **Category:** Technical. 🟩
- **Common or page-specific:** Common (server/CDN config; sample any page).
- **What:** Share of text resources served with gzip/brotli/deflate.
- **Why:** Uncompressed JS/CSS inflates transfer size and LCP/FCP.
- **How measured:** HEAD requests on up to 10 sampled script/CSS URLs, checking `Content-Encoding`; score = compressed/total ×100. 🟧 Lighthouse already has `uses-text-compression`; sampling 10 may under/over-state. 🟥 minor accuracy risk: HEAD responses sometimes omit `Content-Encoding` even when the GET is compressed.
- **High/Low:** high = brotli everywhere; low = plain-text JS bundles.
- **Improvements:** enable brotli at CDN; ensure dynamic HTML is compressed.
- **Suggested weightage:** **Medium ≈ 4%.**

### 1.5 Browser Caching

- **Category:** Technical. 🟩
- **Common or page-specific:** Common.
- **What:** Share of cacheable static assets with `Cache-Control: max-age ≥ 7 days`.
- **Why:** Repeat-visit performance; reduces origin load.
- **How measured:** HEAD on up to 10 image/script/CSS URLs; cached/total ×100 (good ≥90). 🟧 overlaps Lighthouse `uses-long-cache-ttl`.
- **High/Low:** high = fingerprinted assets with 1-year TTL; low = no cache headers / short TTL.
- **Improvements:** long-TTL immutable hashed assets; CDN cache rules.
- **Suggested weightage:** **Medium ≈ 4%.**

### 1.6 Resource Optimization (images + scripts)

- **Category:** Technical. 🟧 image part overlaps SEO "Image" and Technical "Lazy Loading."
- **Common or page-specific:** Page-specific (image weight differs hugely VDP vs About).
- **What:** Avg of (images displayed at appropriate size) and (scripts minified).
- **Why:** Oversized images dominate dealership LCP; unminified JS inflates payload.
- **How measured:** DOM inspection (natural vs display size; `.min`/`cdn` heuristic for scripts). 🟥 the ".min/cdn in URL" heuristic is weak — many minified bundles have neither marker; better to compare transfer size vs unminified estimate or use Lighthouse `unminified-javascript`.
- **High/Low:** high = correctly sized next-gen images, minified bundles; low = full-res hero images scaled down in CSS.
- **Improvements:** responsive `srcset`, AVIF/WebP, build-time minification.
- **Suggested weightage:** **Medium ≈ 5%.**

### 1.7 Render-Blocking Resources

- **Category:** Technical. 🟩
- **Common or page-specific:** Page-specific.
- **What:** Count of synchronous head scripts + non-media stylesheets blocking first paint.
- **Why:** Directly delays FCP/LCP.
- **How measured:** DOM head inspection; score = 100 − (blocking×10). 🟧 overlaps Lighthouse `render-blocking-resources` which also quantifies *wasted ms* (more accurate than a flat −10/resource).
- **Improvements:** inline critical CSS, defer/async JS, `media` attrs on print CSS.
- **Suggested weightage:** **Medium ≈ 4%.**

### 1.8 Redirect Chains

- **Category:** Technical. 🟩
- **Common or page-specific:** Common (URL-level; but should be evaluated per discovered URL).
- **What:** Number of redirect hops to final URL.
- **Why:** Each hop adds latency and dilutes crawl/link equity.
- **How measured:** Inspect redirect chain; ≤1 hop → 100, >1 → 0. 🟥 binary scoring is harsh: 2 hops scoring 0 equals 5 hops scoring 0. Recommend graduated (0 hops 100, 1 hop 90, 2 hops 60, 3+ 20).
- **Improvements:** single 301 to canonical https/non-www; fix http→https→www→trailing-slash chains.
- **Suggested weightage:** **Medium ≈ 3%.**

### 1.9 Rendering Performance

- **Category:** Technical. 🟧 **Merge into CLS.** It is CLS re-expressed.
- **Recommendation:** fold into CLS; drop as a separate scored line to remove double-count.
- **Suggested weightage:** **Low / 0% (merge).**

### 1.10 Lazy Loading

- **Category:** Technical. 🟩
- **Common or page-specific:** Page-specific (SRP/VDP image grids matter most).
- **What:** Share of below-the-fold media using `loading="lazy"` / video `preload`.
- **Why:** Defers offscreen bytes → faster LCP, lower data.
- **How measured:** DOM bounding-rect vs viewport, cross-checked with Lighthouse `offscreen-images`; capped at 85 if waste remains. 🟩 reasonable. ⚠ caution: never lazy-load the LCP/hero image (hurts LCP) — the parameter should *penalize* lazy-loading the LCP element, not reward blanket lazy-loading.
- **Improvements:** lazy-load offscreen only; eager-load hero.
- **Suggested weightage:** **Medium ≈ 3%.**

### 1.11 Third-Party Script Optimization

- **Category:** Technical. 🟩 (very relevant to dealerships — chat, finance, inventory, tracking vendors).
- **Common or page-specific:** Page-specific.
- **What:** Share of cross-origin scripts using async/defer; penalty for high third-party blocking time.
- **Why:** Vendor JS (Gubagoo, CarNow, finance widgets, GA/GTM) is the dominant cause of dealer TBT/INP.
- **How measured:** DOM attrs + Lighthouse `third-party-summary` blocking ms (caps at 80 if >250ms, 50 if >600ms). 🟩 sound and dealership-appropriate.
- **Improvements:** facade/lazy-load chat & video; load tags via GTM with triggers; audit vendor count.
- **Suggested weightage:** **High ≈ 6%** (dealership-specific severity).

### 1.12 JS Execution Efficiency

- **Category:** Technical. 🟧 overlaps TBT.
- **Common or page-specific:** Page-specific.
- **What:** Total JS bootup/parse + main-thread breakdown.
- **How measured:** Lighthouse `bootup-time`, `mainthread-work-breakdown` (≤2s good / ≥3.5s poor). 🟩 thresholds fine.
- **Improvements:** code-split, tree-shake, remove unused vendor JS.
- **Suggested weightage:** **Medium ≈ 4%** (kept lighter because correlated with TBT).

### 1.13 PageSpeed / Lighthouse Performance Score

- **Category:** Technical — **informational only** (correctly excluded from the weighted total to avoid double counting CWV). 🟩
- **Recommendation:** keep displayed for both Mobile and Desktop; never fold into the section score.
- **Suggested weightage:** **0% (info).**

### 1.14 Mobile Load Speed

- **Category:** Technical. 🟩
- **Common or page-specific:** Common (rendered via throttled mobile emulation).
- **What:** Full load time under emulated mid-tier mobile (Slow-4G + 4× CPU).
- **Why:** Dealership traffic is mobile-dominant; throttled timing exposes real-world feel.
- **How measured:** Puppeteer mobile emulation timed to `onload` (≤5s good/≥10s poor). 🟧 overlaps CWV/SI but justified as an explicit throttled whole-page number.
- **Suggested weightage:** **Medium ≈ 4%.**

### 1.15 Mobile Usability (Technical variant)

- **Category:** 🟦 **Reclassify to UX & Content** (it measures tap targets, font legibility, viewport, overflow — ergonomics, not delivery). 🟧 **Duplicate:** the same concept exists in UX (`Mobile_Usability`, `Mobile_Experience`) and partly in Accessibility (`Meta_Viewport`).
- **Recommendation:** Consolidate all mobile-ergonomics checks into ONE UX "Mobile Usability" parameter; keep only *mobile load speed* in Technical.
- **Suggested weightage:** see UX §5.

### 1.16 Inventory Load Time / 1.17 Service Load Time (dealership timed pages)

- **Category:** Technical. 🟩 valuable but architecturally redundant in the new model.
- **Common or page-specific:** Page-specific (SRP / Service).
- **What:** Timed full load of the discovered inventory (SRP) and service-scheduling pages.
- **Why:** These templates are the slowest and most revenue-critical; isolating them is smart.
- **How measured:** dedicated tab timed to `onload` (≤4s good/≥8s poor). 🟦 **Architecture note:** in the new *page-level* audit, every page (including SRP and Service) already gets full Technical scoring. These bespoke timers become **redundant** — replace with "run the full Technical suite on each discovered page type." Keep the *intent* (flag slow SRP/Service) as a site-level insight, not a separate parameter.
- **Suggested weightage:** **Medium today; → fold into per-page Technical in new model.**

> **Technical section — net recommendations:** Promote field CWV; fix the lab-INP threshold bug (🟥); deprecate FID; merge "Rendering Performance" into CLS; move "Mobile Usability" to UX; convert the bespoke Inventory/Service timers into standard per-page Technical runs; add the **missing** parameters: **HTTP/2-3 protocol**, **font-display/FOIT**, **next-gen image coverage as % bytes**, **DOM size**, **CrUX origin-vs-URL distinction**, **HTTP status of discovered URLs**, **structured 4xx/5xx logging across the crawl**.

---

## ▶ SECTION 2 — ON-PAGE SEO

**Section intent:** Classic crawl/understand/index/rank signals. Many are page-specific (title/meta/H1/content), some are site-wide (robots, sitemap), and several overlap AIO/AEO and must be measured once.

### 2.1 Title Tag

- **Category:** On-Page SEO. 🟩
- **Common or page-specific:** **Page-specific** — every template needs its own pattern (VDP: `Year Make Model Trim — City Dealer`; SRP: `Used [Make] in [City]`).
- **What/Why:** Presence + length (30–60 chars) of `<title>`; primary relevance + SERP CTR driver.
- **How measured:** parse `<title>`; 0 missing / 0.5 out-of-range / 1 in-range. 🟩 standard, though Google now renders by **pixel width (~600px)** not char count — recommend pixel-width check as refinement.
- **High/Low:** high = unique, keyword-front-loaded, branded, in length window; low = missing/duplicated/truncated/boilerplate.
- **Improvements:** template per page type; front-load make/model/location; include brand suffix.
- **Suggested weightage:** **Critical ≈ 8%** within SEO.

### 2.2 Title Uniqueness

- **Category:** On-Page SEO. 🟩
- **Common or page-specific:** Site-wide (cross-page).
- **What/Why:** % unique titles across sampled pages; duplicate titles cannibalise and confuse indexing.
- **How measured:** sample up to 5 pages, exclude templated (VDP/inventory/legal). 🟥 **Accuracy risk:** 5-page sample is far too small for a dealership with thousands of VDPs; uniqueness is exactly where templated inventory fails. Recommend sampling per template class with larger N, and judging *template* uniqueness (does the title template inject unique Year/Make/Model/VIN?).
- **Suggested weightage:** **High ≈ 4%.**

### 2.3 Title Keyword Optimization / 2.4 Title Location Optimization

- **Category:** On-Page SEO (Location ties to Local SEO). 🟩/🟧
- **Common or page-specific:** Page-specific (Location especially Home/About/Service/SRP).
- **What/Why:** Title contains body/H1 keywords; title contains city/state. Local intent is huge for dealers.
- **How measured:** keyword overlap; location string + LocalBusiness schema. 🟧 Location overlaps Local SEO sub-signals — measure city/state once, reuse.
- **Suggested weightage:** Keyword **Medium ≈ 3%**; Location **Medium ≈ 3%** (High for Home/SRP/Service).

### 2.5 Meta Description / 2.6 Meta Description Uniqueness

- **Category:** On-Page SEO. 🟩
- **Common or page-specific:** Page-specific (+ uniqueness site-wide).
- **What/Why:** presence + length (50–160) and cross-page uniqueness. Not a ranking factor but drives CTR; duplicates trigger Google rewrites.
- **How measured:** parse meta; sample ≤5 for uniqueness. 🟥 same small-sample caveat as titles.
- **Suggested weightage:** Description **Medium ≈ 3%**; Uniqueness **Low ≈ 2%.**

### 2.7 H1

- **Category:** On-Page SEO (also AIO topical clarity). 🟩
- **Common or page-specific:** Page-specific.
- **What/Why:** exactly one meaningful H1; primary topic signal for users, search & LLMs.
- **How measured:** count + content; 1 → 1.0, 0/many/empty → 0.5, no headings → 0. 🟩 sound. (Modern HTML5 allows multiple H1 in sectioning roots, but one-H1 remains best practice for clarity.)
- **Suggested weightage:** **High ≈ 6%** (currently weighted 0.10 — arguably too high relative to content; rebalance down).

### 2.8 Content Relevance

- **Category:** On-Page SEO. 🟧 overlaps AIO Topical Focus + AEO Topical Authority.
- **Common or page-specific:** Page-specific.
- **What/Why:** % of title/meta keywords present in body, with keyword-stuffing penalty >7%.
- **How measured:** keyword frequency match. 🟥 **Accuracy risk:** raw keyword-overlap is a dated TF-style proxy; modern relevance is semantic (entities, intent coverage). Keep as a *basic* signal but don't over-weight; consider entity/embedding-based relevance as the upgrade.
- **Suggested weightage:** **Medium ≈ 5%** (down-weight from current 0.10; correlated with AIO/AEO).

### 2.9 Content Freshness

- **Category:** On-Page SEO. 🟧 **Duplicate** of AIO "Content Updated Regularly" and overlaps AEO. **Measure once.**
- **Common or page-specific:** Page-specific (Blog/Offers/Service most sensitive).
- **What/Why:** days since last update via meta/JSON-LD/`<time>`. Matters for Offers (expiry), Blog, inventory.
- **How measured:** date extraction; ≤180d 1.0 / ≤365d 0.7 / >365 0.4. 🟩 reasonable; trust `dateModified` only if corroborated (sites fake it).
- **Suggested weightage:** **Medium ≈ 3%.**

### 2.10 URL Structure (info) / 2.11 URL Slugs

- **Category:** On-Page SEO. 🟩
- **Common or page-specific:** Page-specific.
- **What/Why:** clean, shallow, descriptive, hyphenated URLs; readability + minor ranking/UX.
- **How measured:** parse path (lowercase, hyphens, depth ≤3, no query/ext, keyword richness). 🟩 fine; URL_Structure being info-only is acceptable (merge with Slugs into one "URL Quality").
- **Suggested weightage:** **Low ≈ 2%** (merge the two into one).

### 2.12 Canonical

- **Category:** On-Page SEO / Technical-crawl. 🟩 **important for dealers** (faceted SRP duplication).
- **Common or page-specific:** Page-specific.
- **What/Why:** valid self/consolidating canonical; controls duplicate-URL sprawl from inventory filters & tracking params.
- **How measured:** parse `<link rel=canonical>`, validity, self-ref, pagination/noindex conflicts. 🟩 solid and dealership-critical.
- **Suggested weightage:** **High ≈ 6%.**

### 2.13 Heading Hierarchy (H1–H6) / 2.14 Semantic Tags

- **Category:** On-Page SEO. 🟧 **Triple-counted:** also in Accessibility (`Heading_Order`, `Landmarks`), UX (`UX_Content_Hierarchy_Clarity`), AIO (`Markdown headers` / structure). **Consolidate measurement; surface in each section by reference.**
- **Common or page-specific:** Page-specific.
- **What/Why:** logical nesting + semantic landmarks; structure for SEO, a11y, and machine parsing.
- **How measured:** hierarchy validity; landmark/ARIA scoring. 🟩
- **Suggested weightage:** Hierarchy **Medium ≈ 3%**; Semantic Tags **Low ≈ 1%** (most weight belongs to Accessibility's version).

### 2.15 Image (SEO)

- **Category:** On-Page SEO. 🟧 overlaps Technical "Resource Optimization/Lazy Loading" and Accessibility "Image Alt."
- **Common or page-specific:** Page-specific (VDP gallery dominant).
- **What/Why:** alt coverage, meaningful alt, file size, next-gen format, lazy, descriptive naming.
- **How measured:** weighted composite (alt 35%, meaningful 13%, title 5%, size 15%, next-gen 12%, lazy 10%, naming 10%). 🟥 **Overlap risk:** alt-text is the Accessibility concern; file size/next-gen/lazy are the Technical concern. SEO's image parameter should focus on **alt quality + descriptive filenames + image sitemap/structured image data**; delegate byte/format to Technical and alt-presence to Accessibility to stop triple scoring.
- **Suggested weightage:** **Medium ≈ 4%** (scoped to SEO-specific aspects).

### 2.16 Video

- **Category:** On-Page SEO. 🟩 (low weight)
- **Common or page-specific:** Page-specific (VDP walkarounds, Blog).
- **What/Why:** embedding + lazy + VideoObject microdata; video rich results & engagement.
- **How measured:** embed/lazy/microdata thirds. 🟩
- **Suggested weightage:** **Low ≈ 1%.**

### 2.17 Links / 2.18 Contextual Linking

- **Category:** On-Page SEO. 🟧 overlaps AIO "Internal Linking AI-Friendly."
- **Common or page-specific:** Page-specific.
- **What/Why:** anchor descriptiveness, internal/external balance, in-content link ratio, topical relatedness, broken links.
- **How measured:** anchor analysis, content-vs-nav ratio (≥0.3), relatedness, status checks. 🟩 broken-link check overlaps UX "Broken Links" — dedupe.
- **Suggested weightage:** Links **Medium ≈ 3%**; Contextual **High ≈ 5%** (internal linking is a real dealership weakness — VDPs rarely link to related inventory/finance/service).

### 2.19 Robots.txt / 2.20 Sitemap

- **Category:** On-Page SEO (crawl/index foundation). 🟩 **site-wide.**
- **Common or page-specific:** Site-wide.
- **What/Why:** robots correctness + sitemap presence/validity/freshness/coverage/health. Foundational for indexation of large inventory.
- **How measured:** fetch + parse; sitemap urlCount, lastmod coverage, broken-URL sample, image/hreflang presence. 🟩 strong; broken-URL sample of 5 is small for huge sitemaps — scale sample.
- **Suggested weightage:** Robots **Medium ≈ 3%**; Sitemap **High ≈ 5%.**

### 2.21 Structured Data (SEO)

- **Category:** On-Page SEO. 🟧 **Heavily duplicated:** also AIO "Structured Data," AEO "Schema." **This is the single most duplicated parameter in the platform (3 modules).**
- **Common or page-specific:** Page-specific (AutoDealer on Home/About; Vehicle/Offer on VDP; FAQPage on FAQ; BreadcrumbList sitewide).
- **What/Why:** valid JSON-LD for rich results; the backbone of SEO rich snippets, AIO parsing, and AEO citation.
- **How measured:** parse JSON-LD, validate required/recommended per type. 🟩 the SEO version is the most complete; make it the **single source of truth** and let AIO/AEO consume its output.
- **Suggested weightage:** **Critical ≈ 7%** within SEO (and reused, not re-scored, by AIO/AEO).

### 2.22 Open Graph / 2.23 Twitter Card / 2.24 Social Links (sameAs)

- **Category:** On-Page SEO (social/entity). 🟩/🟧 sameAs overlaps AEO Entity Recognition.
- **Common or page-specific:** Page-specific (OG/Twitter), site-wide (sameAs identity).
- **What/Why:** social share rendering + entity disambiguation via sameAs.
- **How measured:** required-tag presence; social-link + sameAs consistency. 🟩
- **Suggested weightage:** OG **Low ≈ 2%**; Twitter **Low ≈ 1%**; sameAs **Low ≈ 1%** (entity weight lives in AEO).

### 2.25 EEAT (SEO version)

- **Category:** 🟦 **Reclassify / split.** The on-page detectable parts (author, credentials, trust, experience) are **duplicated** by AEO `experienceSignals` / `expertiseSignals` / `authoritySignals` and AIO `Author/Source Attribution`. 🟧🟧
- **Recommendation:** EEAT is a *cross-cutting theme*, not a single SEO parameter. Measure its components once (in AEO/AIO trust signals) and surface an "EEAT roll-up" view. Remove the standalone multi-page SEO EEAT crawl to stop duplicate crawling.
- **Suggested weightage:** **Medium**, but as a *derived* roll-up (≈3% if kept in SEO; preferably 0% and shown as cross-section index).

### 2.26 Service Content Quality (info) / 2.27 Content Depth Quality (info)

- **Category:** 🟦 **Reclassify to UX & Content** (depth/word-count/uniqueness/heading structure are content-quality, not classic SEO). 🟧 overlaps AIO "Content Completeness."
- **Suggested weightage:** info-only; fold into UX content-quality + AIO completeness.

### 2.28 Local SEO (8 sub-signals)

- **Category:** On-Page SEO (Local). 🟩 **Critical for dealerships.** 🟧 NAP/schema/reviews overlap AEO Citation Consistency, Entity Recognition, and Conversion trust.
- **Common or page-specific:** Mostly site-wide; Home/About/Contact/Service heaviest.
- **Sub-signals:** NAP consistency, LocalBusiness/AutoDealer schema, location targeting, local keywords, local landing pages, business-info completeness, GBP signals, review signals.
- **How measured:** multi-page crawl + schema. 🟥 **GBP signals "not directly fetchable / placeholder"** — flag as unreliable; integrate the **Google Business Profile API / Places API** for real GBP data (reviews, hours, categories) as the upgrade path. Today's heuristic should be labelled low-confidence.
- **Suggested weightage:** **Critical ≈ 8%** within SEO (dealerships live or die on local). Treat NAP/review portions as shared with AEO.

> **On-Page SEO — net recommendations:** Designate Structured Data as the single schema source of truth (kill the AIO/AEO re-scores); split/relocate EEAT and the content-quality "info" params; scale up uniqueness/sitemap sampling for large inventories; integrate GBP/Places API for Local; dedupe heading/image/broken-link/internal-link overlaps; add **missing**: **hreflang validation, pagination (`rel=next/prev` / canonical strategy for SRP), index bloat detection (faceted-URL explosion), 404/soft-404 detection, XML vs HTML sitemap, structured-data error reporting via Rich Results test rules**.

---

## ▶ SECTION 3 — ACCESSIBILITY

**Section intent:** WCAG 2.2 AA conformance (legally meaningful: ADA Title III / dealership lawsuit exposure is high in automotive). axe-core covers ~30–50% of criteria — automated pass is **necessary but not sufficient**; the report must state this.

> All 19 axe-driven checks below are **page-specific** and share the same scoring scale (pass 100 / warning 50 / fail 0). I group them by WCAG principle and give consolidated analysis to avoid 19 near-identical blocks; per-parameter weight follows.

### 3.1 Perceivable — Color Contrast, Image Alt, Document Title, Meta Viewport

- **Category:** Accessibility. 🟩
- **Common or page-specific:** Page-specific (Image Alt heaviest on VDP galleries; Color Contrast on Offers/CTA buttons).
- **What/Why:** text/background contrast (4.5:1 / 3:1), alt text, unique descriptive title, zoomable viewport. These are the highest-frequency real-world failures and carry legal weight.
- **How measured:** axe rules `color-contrast`, `image-alt`, `document-title` (+ cross-page uniqueness sampling), `meta-viewport`. 🟩 sound. 🟧 Image Alt overlaps SEO "Image" and AIO alt checks — Accessibility owns *presence/quality of alt*; SEO owns *keyword value of alt*.
- **High/Low:** high = AA contrast on all text incl. buttons, every informative image has meaningful alt, decorative images empty-alt; low = light-grey-on-white pricing, icon buttons with no name, missing alt on inventory photos.
- **Improvements:** enforce contrast tokens; mandate alt in DMS image pipeline; never disable zoom.
- **Suggested weightage:** **Critical.** Color Contrast ≈ **9%**, Image Alt ≈ **9%**, Document Title ≈ **3%**, Meta Viewport ≈ **3%**.

### 3.2 Operable — Focus Order, Focusable Content, Tab Index, Skip Links, Landmarks, Keyboard Navigation (composite)

- **Category:** Accessibility. 🟩
- **Common or page-specific:** Page-specific (SRP filters & VDP galleries are the hardest keyboard targets).
- **What/Why:** keyboard operability and wayfinding for AT users. Faceted SRP filters and modal lead forms are classic keyboard traps.
- **How measured:** axe `focus-order`, `focusable-content`, `tabindex`, DOM skip-link + landmark detection; Keyboard Navigation is a weighted composite (correctly excluded from section total to avoid double counting). 🟩 🟧 Landmarks overlaps SEO "Semantic Tags."
- **Improvements:** logical DOM order, no positive tabindex, visible focus ring, skip-to-content link, proper landmark regions, focus-trap management in modals.
- **Suggested weightage:** Focus Order **High ≈ 7%**, Focusable Content **Medium ≈ 5%**, Tab Index **Medium ≈ 4%**, Skip Links **Low ≈ 2%**, Landmarks **Low ≈ 3%**.

### 3.3 Understandable — HTML Lang, List, Heading Order, Button Name, Link Name, Form Label

- **Category:** Accessibility. 🟩
- **Common or page-specific:** Page-specific (Form Label & Button Name critical on Finance/Trade-In/Contact forms; Link Name on SRP card links).
- **What/Why:** language declared, lists structured, logical heading order, every control/link/label discernible. Form labelling is the highest-risk lead-flow accessibility failure.
- **How measured:** axe `html-has-lang`, `list`, `heading-order`, `button-name`, `link-name`, `label`. 🟩 🟧 Heading Order duplicates SEO/UX hierarchy checks.
- **Improvements:** `<label for>` on every field, descriptive button/link text (not "click here"/"more"), one logical heading tree.
- **Suggested weightage:** Form Label **Critical ≈ 9%**, Link Name **High ≈ 7%**, Button Name **High ≈ 7%**, Heading Order **Medium ≈ 4%**, HTML Lang **Medium ≈ 4%**, List **Low ≈ 2%**.

### 3.4 Robust — ARIA Roles, ARIA Allowed Attr, ARIA Hidden Focus, Interactive Element Affordance

- **Category:** Accessibility. 🟩
- **Common or page-specific:** Page-specific.
- **What/Why:** valid ARIA so AT and (increasingly) AI agents parse the accessibility tree correctly. 🟦 **Bridge to Agentic Browsing:** the same accessibility-tree integrity is now scored by Lighthouse's Agentic Browsing category — Accessibility owns the human side, AIO/Agentic owns the agent side; share the underlying tree audit.
- **How measured:** axe `aria-roles`, `aria-allowed-attr`, `aria-hidden-focus`, `interactive-element-affordance`. 🟩
- **Improvements:** valid roles, no conflicting ARIA, never aria-hidden a focusable node, native elements over ARIA where possible.
- **Suggested weightage:** ARIA Roles **Medium ≈ 4%**, ARIA Allowed Attr **Low ≈ 3%**, ARIA Hidden Focus **Low ≈ 3%**, Interactive Affordance **Low ≈ 2%**.

### 3.5 WCAG 2.1 AA Compliance (composite, info-only)

- **Category:** Accessibility — **info-only** (correctly excluded; capped by worst severity). 🟩
- **Recommendation:** upgrade label to **WCAG 2.2 AA** (current standard, adds target-size, focus-appearance, dragging-movements, consistent-help — all relevant to mobile dealership UIs). Keep the "manual review still required / ~30–50% coverage" disclaimer prominent.
- **Suggested weightage:** **0% (info)** but headline-visible.

> **Accessibility — net recommendations:** Move to **WCAG 2.2 AA** ruleset; explicitly run axe on **each discovered template** (a clean Home page tells you nothing about VDP gallery or finance-form accessibility); add **missing**: **target-size (2.2 AA), focus-not-obscured (2.2), reflow/resize-text, motion/animation prefers-reduced-motion, accessible name for form errors, video captions/transcripts (VDP walkarounds), PDF accessibility for finance docs**. Dedupe heading-order/landmarks/alt with SEO & UX (measure once).

---

## ▶ SECTION 4 — SECURITY & COMPLIANCE

**Section intent:** Encryption, infrastructure hygiene, vulnerability exposure, privacy/legal compliance. Mostly **site-wide/origin-level**, with form-level checks page-specific. Dealerships handle SSN/credit/PII → PCI & privacy are high-stakes.

### 4.1 HTTPS (+ Mixed Content) / 4.2 SSL / 4.3 TLS Version

- **Category:** Security. 🟩 **site-wide.**
- **What/Why:** transport encryption, cert validity/expiry, modern TLS (1.2+). Table-stakes; also a ranking signal.
- **How measured:** protocol + mixed-content scan; cert expiry (warn <30d); TLS protocol (1.2/1.3 → 100, <1.2 → 0). 🟩 sound and well-graduated (active vs passive mixed content scored 30/65).
- **Improvements:** force HTTPS, HSTS preload, fix mixed-content asset URLs, auto-renew certs, disable TLS<1.2.
- **Suggested weightage:** HTTPS **Critical ≈ 10%**, SSL **High ≈ 6%**, TLS **High ≈ 5%**.

### 4.4 SQLi Exposure / 4.5 XSS / 4.9 Weak Default Credentials

- **Category:** Security (active vulnerability probing). 🟧🟥 **Caution.**
- **Common or page-specific:** Page-specific (tested on home/forms).
- **What/Why:** detect injectable params, reflected/stored XSS, default creds. Real risks.
- **How measured:** payload injection (6 SQLi payloads on `q/id/search`; `<script>alert</script>` via `xss_test`; login attempts with admin/admin). 🟥 **Accuracy & ethics risk:** (a) **active payload submission and login attempts against a third-party site you don't own may be unauthorized** — for an audit SaaS run only on consented/owned domains, or restrict to passive detection; (b) testing only fixed param names (`q/id/search`) yields high false-negatives; (c) blind-SQLi by 25% length-diff is noisy. Recommend: gate active tests behind explicit ownership/authorization; otherwise downgrade to passive header/library-version checks. Surface this as a **methodology limitation**, not a guarantee.
- **Suggested weightage:** SQLi **High ≈ 7%**, XSS **High ≈ 7%**, Weak Creds **Medium ≈ 5%** — but only when authorized; else info-only.

### 4.6 Google Safe Browsing / 4.7 Domain Blacklist / 4.8 Malware Scan (VirusTotal)

- **Category:** Security (reputation). 🟩 🟧 Safe Browsing is reused inside Blacklist (dedupe display).
- **What/Why:** domain flagged for malware/phishing; reputational + user-safety.
- **How measured:** Safe Browsing API v4; VirusTotal v3 malicious/suspicious counts. 🟩 (note: missing API key → auto-pass 100, which can mask unknowns — label "not checked" instead of "pass").
- **Suggested weightage:** Safe Browsing **Critical ≈ 8%**, Malware/Blacklist **High ≈ 6%** (merge the two reputation outputs into one).

### 4.10 Admin Panel Public

- **Category:** Security. 🟩
- **What/Why:** common admin paths reachable unauthenticated.
- **How measured:** GET 14 paths + keyword match; exposed → 0. 🟩 reasonable surface scan.
- **Suggested weightage:** **High ≈ 6%.**

### 4.11 Forms Use HTTPS / 4.12 CSP / 4.13 HSTS / 4.14 X-Frame-Options / 4.15 X-Content-Type-Options

- **Category:** Security (headers & form transport). 🟩
- **Common or page-specific:** Forms page-specific; headers site-wide.
- **What/Why:** secure form posting + defense-in-depth headers (clickjacking, MIME-sniffing, transport enforcement, injection mitigation).
- **How measured:** header presence (binary 100/0). 🟥 **CSP binary scoring is crude:** a `Content-Security-Policy: default-src *` "present" header scores 100 yet provides almost no protection. Recommend grading CSP *quality* (unsafe-inline/eval, wildcard sources). Same for X-Frame-Options vs frame-ancestors in CSP (dedupe).
- **Improvements:** add HSTS w/ preload, strict CSP, `nosniff`, `frame-ancestors`/XFO, HTTPS form actions.
- **Suggested weightage:** Forms-HTTPS **High ≈ 6%**, CSP **High ≈ 6%** (quality-graded), HSTS **Medium ≈ 5%**, XFO **Medium ≈ 4%**, X-Content-Type **Medium ≈ 4%**.

### 4.16 Cookies Secure / 4.17 Cookies HttpOnly

- **Category:** Security. 🟩
- **Common or page-specific:** Page-specific (set at session/login).
- **What/Why:** cookie flags to resist interception/XSS theft.
- **How measured:** inspect cookie flags; any insecure → 0. 🟩 (consider also `SameSite` — currently missing).
- **Suggested weightage:** Secure **Medium ≈ 4%**, HttpOnly **Medium ≈ 4%.**

### 4.18 MFA Enabled

- **Category:** Security. 🟩 (info-aware: not_applicable when no auth surface — good design).
- **Common or page-specific:** Page-specific (login/portal pages).
- **What/Why:** detects MFA/SSO at auth surfaces. Most dealer marketing sites have no login → correctly n/a.
- **How measured:** input/keyword/SSO heuristics; SSO 70 / password-only 40 / n/a info. 🟩
- **Suggested weightage:** **Low ≈ 3%** (only where auth exists).

### 4.19 Cookie Consent / 4.20 Privacy Policy / 4.21 GDPR-CCPA / 4.22 Third-Party Cookies / 4.23 Data Collection Disclosure

- **Category:** Security & **Compliance**. 🟩 increasingly important (CCPA/CPRA apply to many US dealers; state privacy laws expanding).
- **Common or page-specific:** Site-wide (policy/banners), page-specific (cookies present).
- **What/Why:** lawful tracking consent, disclosed data practices, privacy-rights notices. Disclosure-aware scoring (only require banner when tracking detected) is well designed.
- **How measured:** tracking-keyword + CMP-selector detection; policy/keyword link detection. 🟩 🟧 Privacy Policy presence also matters to AEO citations/trust — reuse signal.
- **Improvements:** deploy a CMP (consent mode v2), linked privacy policy in footer, CCPA "Do Not Sell" link, document data collection.
- **Suggested weightage:** Cookie Consent **Medium ≈ 4%**, Privacy Policy **Medium ≈ 4%**, GDPR/CCPA **Medium ≈ 4%**, Third-Party Cookies **Low ≈ 3%**, Data Collection **Low ≈ 3%**.

### 4.24 CRM Integration

- **Category:** 🟦 **Reclassify to Conversion Flow.** It measures lead-routing to a CRM (HubSpot/Salesforce/DealerCRM) — a *conversion/lead* concern, not security. 🟧 also actively submits forms (same authorization caveat as 4.4/4.5).
- **Suggested weightage:** see Conversion §6; remove from Security score.

### 4.25 Finance Form Security (PCI)

- **Category:** Security (PCI) **and** Conversion (finance flow). 🟩 keep the **PCI/HTTPS/sensitive-field** part in Security; the *finance lead UX* belongs to Conversion. Split.
- **Common or page-specific:** Page-specific (Finance/credit-application).
- **What/Why:** PCI-readiness for credit apps (HTTPS, no raw card/SSN collection, trusted provider like RouteOne/Dealertrack, secure endpoint).
- **How measured:** field-pattern + provider detection; graded 0–10. 🟩 sensible.
- **Suggested weightage:** **High ≈ 6%** (Security portion).

### 4.x GA4 / GTM / Conversion Tracking (display-only passthrough)

- **Category:** 🟦 **Belongs to Conversion Flow** (they originate there). Their appearance in Security is display-only — correct to keep them out of the Security score; just stop surfacing them under Security to avoid confusion.

> **Security — net recommendations:** Gate all *active* exploit/credential/form-submission tests behind domain ownership/authorization (legal + accuracy); grade CSP and headers by *quality* not mere presence; merge Safe Browsing+Blacklist+Malware into one reputation score; add `SameSite` cookies; relabel "missing API key = pass" as "not checked"; move CRM to Conversion and split Finance-PCI; add **missing**: **security.txt, subresource integrity (SRI) for vendor scripts, outdated-library/CVE detection (jQuery etc.), exposed `.git`/backup files, email/DMARC-SPF (for lead deliverability), CMP consent-mode-v2 verification**.

---

## ▶ SECTION 5 — UX & CONTENT

**Section intent:** Human usability, readability, layout quality, and dealership-shopping UX. Highly **page-specific** and device-aware (the module already varies thresholds by mobile/desktop — good).

### 5.1 Text Readability

- **Category:** UX & Content. 🟩
- **Common or page-specific:** Page-specific (Blog/Guides target 50–70 Flesch; VDP/product 40–60).
- **What/Why:** Flesch reading ease vs page-type target; comprehension & engagement.
- **How measured:** Flesch formula on innerText with type-aware bands. 🟧 readability also matters to AIO chunking — share text extraction. 🟥 minor: Flesch is English-centric and skews on spec-heavy VDP copy; treat as soft signal.
- **Suggested weightage:** **Low ≈ 3%.**

### 5.2 Sticky Header Usage / 5.12 Content Density Balance / 5.14 Layout Consistency / 5.17 In-Page Navigation

- **Category:** UX & Content (layout ergonomics). 🟩 (low individual weight)
- **Common or page-specific:** Page-specific, device-aware.
- **What/Why:** sticky header not eating viewport; text-to-scroll density balanced; modern consistent layout (flex/grid); anchor/back-to-top on long pages. Quality-of-life signals.
- **How measured:** computed styles/heights/scroll ratios. 🟩 reasonable heuristics; low confidence individually → keep low weight.
- **Suggested weightage:** Sticky Header **Low ≈ 2%**, Content Density **Low ≈ 3%**, Layout Consistency **Low ≈ 2%**, In-Page Nav **Low ≈ 2%**.

### 5.3 Intrusive Interstitials

- **Category:** UX & Content. 🟩 (Google penalizes intrusive mobile interstitials — also an SEO signal).
- **Common or page-specific:** Page-specific (Offers/promo modals worst offenders).
- **What/Why:** full-screen overlays / scroll-blocking modals hurt mobile UX and rankings.
- **How measured:** overlay geometry + scroll-block detection. 🟩
- **Suggested weightage:** **Medium ≈ 4%.**

### 5.4 Breadcrumbs

- **Category:** UX & Content. 🟧 overlaps SEO BreadcrumbList schema + Navigation.
- **Common or page-specific:** Page-specific (non-home; SRP→VDP depth).
- **What/Why:** orientation in deep inventory hierarchies.
- **How measured:** DOM/schema breadcrumb; home auto-pass. 🟩
- **Suggested weightage:** **Low ≈ 3%.**

### 5.5 Navigation Discoverability

- **Category:** UX & Content. 🟩
- **Common or page-specific:** Common (site-wide nav).
- **What/Why:** primary menu + mobile hamburger + header search discoverable & functional. Inventory search entry point is make-or-break.
- **How measured:** weighted component score (nav 40 / hamburger 30 / search 15 / discover 8 / function 7). 🟩 thoughtful.
- **Suggested weightage:** **High ≈ 6%.**

### 5.6 Above-the-Fold Content

- **Category:** UX & Content. 🟩 🟧 relates to LCP/CLS.
- **Common or page-specific:** Page-specific, device-aware.
- **What/Why:** important content visible without scroll (weighted by element importance).
- **How measured:** viewport visibility × tag weight. 🟩
- **Suggested weightage:** **Medium ≈ 4%.**

### 5.7 Interactive Click Feedback / 5.8 Loading Feedback

- **Category:** UX & Content. 🟩
- **Common or page-specific:** Page-specific, device-aware.
- **What/Why:** hover/active/focus state feedback; spinner/skeleton on async (SRP filtering, inventory load).
- **How measured:** pseudo-state computed-style diffs; loading-indicator selectors. 🟩 🟧 focus-state feedback overlaps Accessibility focus-visible.
- **Suggested weightage:** Click Feedback **Low ≈ 3%**, Loading Feedback **Low ≈ 3%.**

### 5.9 Broken Links

- **Category:** UX & Content. 🟧 **Duplicate** of SEO Links/Contextual broken-link check. **Measure once** (crawl-level), surface in both.
- **Common or page-specific:** Page-specific.
- **What/Why:** dead links hurt UX, crawl, and trust.
- **How measured:** HEAD/GET status with false-positive filtering (403/429/999/405/406). 🟩 good FP handling.
- **Suggested weightage:** **Medium ≈ 4%** (single owner; reference from SEO).

### 5.10 UX Content Hierarchy Clarity / 5.11 Section Labeling Clarity

- **Category:** UX & Content. 🟧🟧 **Triple-duplicate** with SEO Heading Hierarchy + Accessibility Heading Order.
- **Recommendation:** measure heading structure ONCE; UX expresses the *human-clarity* view, others reference it.
- **Suggested weightage:** Hierarchy **Low ≈ 3%**, Section Labeling **Low ≈ 2%** (most weight in SEO/A11y).

### 5.13 Page-to-Page Flow

- **Category:** UX & Content. 🟧 overlaps Conversion CTA flow + SEO internal linking.
- **Common or page-specific:** Page-specific.
- **What/Why:** avoids dead-end pages (footer + internal links + CTA → next step).
- **How measured:** footer/internal-link/CTA presence. 🟩
- **Suggested weightage:** **Low ≈ 3%.**

### 5.15 Mobile Experience / 5.16 Mobile Usability

- **Category:** UX & Content. 🟧🟧 **Duplicated** with Technical "Mobile Usability" and Accessibility "Meta Viewport"/target-size.
- **Common or page-specific:** Page-specific, device-aware.
- **What/Why:** viewport meta, no horizontal overflow, responsive images, media queries (Experience); tap-target ≥44px, font ≥12px, thumb reach (Usability).
- **How measured:** meta/overflow/srcset/media-query scoring; touch-target composite. 🟩 🟦 **Consolidate** all mobile ergonomics into this single UX home; Technical keeps only mobile *load speed*; Accessibility's target-size (WCAG 2.2) cross-references this.
- **Suggested weightage:** Mobile Experience **High ≈ 6%**, Mobile Usability **High ≈ 6%** (mobile-dominant audience).

### 5.18 Inventory Filtering (SRP faceted search)

- **Category:** UX & Content (dealership-specific). 🟩 **excellent, SRP-defining parameter.**
- **Common or page-specific:** **SRP-specific** (homepage finder = info; non-inventory = n/a).
- **What/Why:** breadth/richness of facets (make/model/year/price/mileage/body + bonus) and result feedback (counts, chips, clear, sort). The core SRP experience.
- **How measured:** context detection + facet/control/feedback scoring (presence 20 / breadth 40 / mechanism 15 / feedback 25). 🟩 sophisticated and appropriate.
- **Suggested weightage:** **Critical for SRP ≈ 10%** of SRP UX weight (n/a elsewhere).

### 5.19 Pricing Transparency

- **Category:** UX & Content (overlaps Conversion + Compliance). 🟩 🟧
- **Common or page-specific:** Page-specific (VDP/Offers/Finance).
- **What/Why:** real prices shown, fee disclosure, financing info, no-hidden-fees. Trust + FTC dealer-pricing scrutiny.
- **How measured:** price/fee/disclaimer/financing/transparency keyword scoring; info-only when no pricing. 🟩
- **Suggested weightage:** **High ≈ 6%** (VDP/Offers).

### 5.20 Info-only — No Results UX / Certifications & Awards / Vehicle History (CARFAX) / Staff Profiles

- **Category:** UX & Content (+ Conversion trust). 🟩 keep as info/contextual.
- **Common or page-specific:** No Results UX = SRP; Vehicle History = used/CPO VDP; Certifications & Staff = Home/About.
- **What/Why:** zero-result recovery; trust badges; CARFAX/AutoCheck on used VDP; team humanization. Strong dealership-shopping signals.
- **How measured:** state/keyword/schema detection. 🟩 🟧 Certifications/Staff overlap AEO Expertise/Experience and Conversion trust.
- **Suggested weightage:** keep **info-only**, but promote **Vehicle History to weighted on used VDP (Medium ≈ 4%)** — it materially affects used-car conversion.

> **UX & Content — net recommendations:** Consolidate the mobile-ergonomics trio and the heading-hierarchy trio; designate single owners for broken-links and heading structure; promote Vehicle History (used VDP) to weighted; add **missing**: **font legibility/line-length, search-result relevance & sorting correctness, comparison tool (compare vehicles), saved/favourite vehicles, gallery UX (image count/zoom on VDP), error-state copy quality, 404-page UX, consent/UX of chat auto-popups**.

---

## ▶ SECTION 6 — CONVERSION FLOW

**Section intent:** Does the page convert a shopper into a lead/sale? Strongest dealership differentiator. Currently many checks are **site-wide keyword/selector scans** — the new model should make them **page-type-aware** (a VDP needs different CTAs than a Blog post). 🟥 most "site-wide" scoping here is an accuracy weakness: scanning the whole DOM for any testimonial/offer keyword over-credits pages that don't actually present the element.

### 6.1 CTA group — Presence / Clarity / Crowding / Flow Alignment / Link Relevance

- **Category:** Conversion Flow. 🟩
- **Common or page-specific:** Common baseline, but **intent differs by page** (VDP: "Check availability / Get e-price / Schedule test drive"; SRP: "View details / Filter"; Finance: "Get pre-approved").
- **What/Why:** presence, action-clarity, not-too-many, positioned across the decision journey, linking to relevant conversion pages.
- **How measured:** selector/keyword detection; Flow Alignment uses rendered geometry (above-fold 40 / coverage 35 / end 25) — the most sophisticated of the group. 🟩 Flow Alignment is sound; the others are keyword-list dependent (🟥 brittle to wording).
- **Improvements:** primary CTA above fold on every template; one dominant action; relevant destinations.
- **Suggested weightage:** Presence **High ≈ 7%**, Flow Alignment **High ≈ 6%**, Link Relevance **High ≈ 6%**, Clarity **Medium ≈ 5%**, Crowding **Low ≈ 2%**.

### 6.2 Form group — Presence / Length / Required-vs-Optional / Inline Validation / Submit Clarity / Multi-Step Progress

- **Category:** Conversion Flow. 🟩 🟧 Form labelling overlaps Accessibility "Form Label"; validation overlaps Security inline checks.
- **Common or page-specific:** Page-specific (Contact/Finance/Trade-In/Service forms).
- **What/Why:** concise, well-labelled, validated forms with clear submit and step progress → higher completion.
- **How measured:** field counts, `required`/pattern/type attrs, button text, step selectors. 🟩 🟥 "optimal ≤6 fields" is a fair heuristic but finance apps legitimately need more — make field-count thresholds page-type-aware.
- **Improvements:** minimise fields, inline validation, clear required markers, progress on multi-step credit apps.
- **Suggested weightage:** Form Presence **High ≈ 6%**, Inline Validation **Medium ≈ 5%**, Length **Medium ≈ 4%**, Submit Clarity **Medium ≈ 4%**, Required/Optional **Low ≈ 3%**, Multi-Step Progress **Low ≈ 2%**.

### 6.3 Trust group — Testimonials / Reviews / Trust Badges / Client Logos / Case Studies

- **Category:** Conversion Flow. 🟧🟧 **heavily overlaps** AEO Experience/Authority signals, UX Certifications, and Local SEO review signals.
- **Common or page-specific:** Page-specific (Home/About/VDP); Case Studies/Client Logos are weak fits for dealerships (B2B language).
- **What/Why:** social proof drives lead confidence.
- **How measured:** class/keyword/selector detection (payment-gated for badges — good). 🟥 keyword scans over-trigger; "Case Studies / Client Logos" are mismatched to auto-retail (recommend replace with **Dealer reviews rating/volume, Google review stars, manufacturer awards**).
- **Improvements:** surface aggregate review rating + count, DealerRater/Google reviews, BBB, manufacturer certifications.
- **Suggested weightage:** Reviews **High ≈ 6%**, Testimonials **Medium ≈ 4%**, Trust Badges **Medium ≈ 4%**; **remove/replace** Client Logos & Case Studies (**Low → repurpose**).

### 6.4 Form UX — Progress Indicators / Friendly Error Handling / Microcopy Clarity

- **Category:** Conversion Flow. 🟧 Progress Indicators duplicates "Multi-Step Form Progress"; Error Handling overlaps Inline Validation. **Merge into the Form group.**
- **Suggested weightage:** Error Handling **Medium ≈ 4%**, Microcopy **Low ≈ 2%**, Progress **(merge).**

### 6.5 Incentives — Lead Magnets / Incentives Displayed

- **Category:** Conversion Flow. 🟩 🟦 "Lead Magnets" (ebooks/whitepapers) is a B2B/SaaS concept — for dealers, reframe as **Offers/Specials presence** (lease specials, rebates, service coupons).
- **Common or page-specific:** Offers page-specific.
- **How measured:** body keyword scan. 🟥 brittle.
- **Suggested weightage:** Incentives/Offers **Medium ≈ 4%**, Lead Magnets **Low ≈ 1% (repurpose to Offers).**

### 6.6 Dealer flows — Trade-In / Financing / Finance Calculator / Appointment Booking / Thank-You Pages

- **Category:** Conversion Flow (dealership core). 🟩 **the most valuable, dealer-specific conversion parameters.**
- **Common or page-specific:** **Strongly page-specific** — Trade-In (Trade-In page + VDP/SRP entry), Financing (Finance page), Calculator (Finance/SRP/VDP), Appointment (Service + VDP test-drive), Thank-You (any form endpoint).
- **What/Why:** the real dealership conversion engines — valuation tools, pre-approval, payment calculators, scheduling, post-submit confirmation.
- **How measured:** tiered widget→CTA→form→text detection (KBB/TradePending, RouteOne/AutoFi, Xtime/myKaarma/Calendly, etc.); 100 widget / 50 text-only / 0 none. 🟩 well-modelled with named vendor detection.
- **Improvements:** embed real tools (not just "call us"); confirmation pages for tracking; calculator on VDP.
- **Suggested weightage:** Trade-In **High ≈ 6%**, Financing **High ≈ 6%**, Appointment **High ≈ 6%**, Finance Calculator **Medium ≈ 5%**, Thank-You **Medium ≈ 4%** (each applied to its relevant template).

### 6.7 Real-time — Chat Experience / Click-to-Call

- **Category:** Conversion Flow. 🟩 🟧 Chat vendors overlap Technical third-party JS; Click-to-Call overlaps AEO citations transparency.
- **Common or page-specific:** Common (site-wide).
- **What/Why:** instant engagement + one-tap mobile calling (huge for dealers).
- **How measured:** widget/launcher/keyword detection; tel: link detection. 🟩
- **Suggested weightage:** Click-to-Call **High ≈ 6%** (mobile dealer calls are top conversions), Chat **Medium ≈ 4%.**

### 6.8 Analytics — GA4 Installed / GTM Configuration / Conversion Tracking

- **Category:** Conversion Flow (measurement). 🟩 🟦 these currently also appear under Security display — Conversion is the right home.
- **Common or page-specific:** Site-wide.
- **What/Why:** without GA4 + conversion events, lead optimization is blind; call-tracking (CallRail etc.) detection is dealer-appropriate.
- **How measured:** GA4/GTM ID patterns; form+call conversion-event detection. 🟩 strong.
- **Suggested weightage:** Conversion Tracking **High ≈ 6%**, GA4 **Medium ≈ 5%**, GTM **Medium ≈ 4%.**

> **Conversion Flow — net recommendations:** Make every check **page-type-aware** instead of whole-DOM keyword scans (biggest accuracy win); merge the Form-UX subset into the Form group; replace SaaS-flavoured params (Lead Magnets, Case Studies, Client Logos) with auto-retail equivalents (Offers/Specials, review rating+volume, manufacturer awards); pull CRM Integration in from Security; add **missing**: **lead-form spam/bot protection (reCAPTCHA) as UX-vs-friction, payment-calculator accuracy presence on VDP, inventory "alert me / notify on price drop", finance pre-qual soft-pull detection, exit-intent/retargeting, phone-number consistency vs NAP, form abandonment friction (number of steps to lead)**.

---

## ▶ SECTION 7 — AIO (AI OPTIMIZATION)

**Section intent (the clean definition):** *Can an LLM ingest, parse, and correctly understand THIS page's content?* AIO is about **machine readability of the page itself** — structure, chunking, semantic HTML, schema-as-parsing-aid, NLP-friendliness, freshness, completeness, and **agent operability**. It is **on-page and page-specific**.

> **Source today:** `aioReadiness.js` (14 page-level checks, flat weighted average, total weight 30, "Yes" badge at ≥50%). The methodology is reasonable for a v1 but **massively overlaps three other modules**. The job here is to *keep AIO as the comprehension layer* and route visibility concerns to AEO.

### Reclassification verdict for the 14 current AIO params

| Current AIO param | Keep in AIO? | Reason |
|---|---|---|
| Structured Data | ❌ → **reference SEO** | Duplicate of SEO + AEO schema. Measure once in SEO; AIO *consumes* it. |
| Content NLP Friendly | ✅ **AIO core** | Semantic HTML for parsing — pure comprehension signal. |
| Keywords & Entities Annotated | ✅ AIO (light) | Entity/keyword annotation aids machine understanding. |
| Content Updated Regularly | ❌ → **reference SEO Freshness** | Duplicate of SEO Content Freshness. |
| Internal Linking AI-Friendly | ❌ → **reference SEO Contextual Linking** | Duplicate; descriptive-anchor logic identical. |
| Duplicate Content Detection Ready | ❌ → **reference SEO Canonical** | Canonical/noindex already in SEO. |
| Topical Focus Clarity | ✅ AIO | Title/H1 alignment = topic comprehension (light overlap w/ SEO H1). |
| Answer-Oriented Structure | 🟦 → **move to AEO** | Q&A/FAQ pairing is an *answer-engine* visibility signal, not comprehension. |
| Content Chunking | ✅ **AIO core** | Paragraph/heading density for LLM scannability — pure AIO. |
| Lists & Structured Blocks | ✅ **AIO core** (🟧 w/ AEO structuredContent) | Machine-readable blocks; coordinate with AEO Perplexity signal. |
| Terminology Consistency | ✅ AIO | Consistent vocabulary aids entity resolution. |
| Author/Source Attribution | 🟦 → **AEO/EEAT trust** | Authorship is a citation/trust signal → AEO. |
| Fact vs Opinion Separation | ✅ AIO (light) | Citations/evidence structure aids machine grounding. |
| Content Completeness | ✅ **AIO core** | Intro/body/conclusion depth = comprehension completeness. |

**Result — AIO retains these as its own scored params:** Content NLP Friendly, Content Chunking, Content Completeness, Lists & Structured Blocks, Topical Focus Clarity, Terminology Consistency, Keywords/Entities Annotated, Fact vs Opinion. Everything else becomes a *referenced* signal (measured once elsewhere) so AIO stops re-crawling and double-scoring. **Plus the new AI Agentic Browsing operability layer (Section 6 below) joins AIO.**

### AIO per-parameter (retained core)

For each: page-specific; data source = on-page DOM (Cheerio) parsing.

- **Content NLP Friendly** — *What:* semantic tags + heading hierarchy + paragraphs/lists present. *Why:* LLMs parse the DOM/accessibility tree; semantic structure yields cleaner extraction. *High:* article/section/main + h1–h3 + paragraphs. *Low:* div-soup, no headings. *Improve:* semantic HTML5, proper heading tree. **Weight: High ≈ 18% of AIO.**
- **Content Chunking** — *What:* % long paragraphs (>80 words) + heading density. *Why:* LLMs retrieve and quote *chunks*; short, headed sections are more extractable/citable. *High:* short paragraphs under frequent subheads. *Low:* walls of text. *Improve:* break copy into ≤80-word chunks with descriptive H2/H3. **Weight: High ≈ 16%.**
- **Content Completeness** — *What:* >400 words + intro + conclusion. *Why:* complete coverage → better summarization & topic authority. *High:* thorough, structured articles. *Low:* thin pages. *Improve:* depth, explicit intro/summary. **Weight: Medium ≈ 14%.**
- **Lists & Structured Blocks** — *What:* presence of lists/tables/blockquotes. *Why:* tabular/list data is the most reliably extracted by LLMs (and Perplexity prefers it). *High:* spec tables, FAQ lists. *Low:* data trapped in images. *Improve:* HTML tables for specs/pricing, not image screenshots. **Weight: Medium ≈ 12%** (🟧 coordinate with AEO structuredContent).
- **Topical Focus Clarity** — *What:* title/H1 keyword alignment. *Why:* clear single-topic signal for embeddings. **Weight: Medium ≈ 12%.**
- **Keywords & Entities Annotated** — *What:* meta keywords + alt text + headings. *Why:* entity hints aid disambiguation. *Caveat:* meta keywords are ignored by Google; value is alt/entity annotation. **Weight: Low ≈ 10%.**
- **Terminology Consistency** — *What:* primary heading terms repeated in body. *Why:* consistent naming aids entity resolution. **Weight: Low ≈ 6%.**
- **Fact vs Opinion Separation** — *What:* citations/`<sup>`/references. *Why:* grounded, attributable claims are preferred by RAG systems. **Weight: Medium ≈ 12%.**

🟥 **Cross-cutting accuracy note for AIO:** the current flat 0/50/100 + simple weighted average is coarse. Recommend graduated 0–100 per signal and, crucially, **measuring AIO per discovered template** (a thin VDP and a deep Blog post have very different AIO profiles). The "Yes/No at 50%" badge should become a tiered (Poor/Developing/Strong) label.

### AIO Framework (deliverable Section 4)

- **Parameters:** the 8 retained comprehension signals + the **Agentic Browsing operability sub-block** (Section 6) + *referenced* signals (schema, freshness, internal linking, canonical) pulled from SEO.
- **Measurement methodology:** on-page DOM parse per page; graduated 0–100 each; reference (don't recompute) shared signals.
- **Weighting model (within AIO):** Comprehension cluster ~70% (NLP-friendly, chunking, completeness, lists, topical focus, terminology, keywords, fact/opinion), Agentic-operability cluster ~30% (accessibility-tree integrity, llms.txt quality, WebMCP, layout stability for agents).
- **Scoring model:** `AIO_page = Σ(signal×weight)/Σweight`; site AIO = template-weighted mean of page AIO scores (see Section 7 architecture). Tiered badge: <40 Poor / 40–74 Developing / ≥75 Strong (aligns with the platform's existing 3-tier colour rule).

---

## ▶ SECTION 8 — AEO (ANSWER ENGINE OPTIMIZATION)

**Section intent (the clean definition):** *Will answer engines (ChatGPT, Gemini, Perplexity, Google AI Overviews, Copilot) be ALLOWED in, and will they CITE/surface this business as the answer?* AEO is about **visibility & citation inside generative answers** — access (AI bot allow), citability (citations, entity & NAP consistency, topical authority, brand strength), and direct-answer formatting (answer-first, FAQ/HowTo schema), measured **per engine**.

> **Source today:** `aeoService.js` + 15 `signals/*` + per-engine weight matrix (`aeoWeights.js`, each engine summing to 100; overall = average of 3 engines). This is the **most mature** subsystem in the platform and largely correct. Main issues: (a) it **re-scores schema/structured content/freshness** already owned by SEO/AIO; (b) it folds **pageSpeed** (a Technical metric) into engine weights; (c) 4 info-only EEAT signals overlap each other and SEO EEAT.

### AEO per-signal analysis (all page-specific unless noted)

- **Answer-First (TL;DR)** — *Category:* AEO. *What:* 1–2 sentence direct answer in first 100 words. *Why:* answer engines extract concise lead answers; strongest ChatGPT signal. *How:* sentence-count of opening block (1–2→100, 3–4→60, 5+→30, 0→0). 🟩 *Improve:* lead every page with a direct answer. **Weight: High** (ChatGPT 17%, Gemini 5%).
- **llms.txt** — *Category:* AEO (🟧 also the new Agentic Browsing audit). *What/site-wide:* `/llms.txt` manifest quality (H1, sections, links, summary, relevance). *Why:* emerging convention; **caveat: no major AI engine confirmed to consume it yet, and server logs show little real fetching** — so weighting it at **40% of ChatGPT is far too high** 🟥. *How:* fetch + format/relevance grading. *Improve:* publish a real llms.txt but don't expect ranking impact. **Weight: recommend Low–Medium (cut ChatGPT 40%→~10%); shift freed weight to citations/entity/topical authority.**
- **Schema (FAQ/HowTo/Product)** — 🟧 **Duplicate of SEO Structured Data.** *Recommendation:* AEO references SEO's schema result and applies an *answer-engine lens* (does it have FAQ/HowTo/Vehicle/Offer rich types?) rather than re-parsing. **Weight: High for Gemini (30%)** — but as a derived view.
- **Structured Content (tables vs images)** — 🟧 overlaps AIO Lists & Structured Blocks. *Why:* Perplexity strongly prefers tabular data (40% weight). *Recommendation:* one measurement, two lenses. **Weight: High (Perplexity 40%, Gemini 10%).**
- **Bot Access & Indexability** — *Category:* AEO **gatekeeper**. *What:* GPTBot/Google-Extended/PerplexityBot allowed + not noindex; path-aware robots + X-Robots-Tag. *Why:* if the AI crawler is blocked, visibility is **zero** regardless of content — the hard-fail override (blocked bot → that engine = 0) is **exactly right** 🟩. *Improve:* allow AI bots in robots.txt; remove accidental noindex. **Weight: Critical gate** (5% each engine but with veto power). **Add missing bots:** ClaudeBot/Claude-Web, CCBot, Bytespider, Amazonbot, Applebot-Extended, Meta-ExternalAgent, OAI-SearchBot, cohere-ai — currently only reported, should be partly scored.
- **Markdown Headers** — 🟧 **Duplicate of heading hierarchy** (SEO/A11y/UX/AIO). *Recommendation:* reference shared heading analysis. **Weight: ChatGPT 10%** (derived).
- **Citations & Trust** — *Category:* AEO. *What:* external sources, citation markers, policies, contact transparency, HTTPS, dates. *Why:* Perplexity is citation-driven; grounded pages get cited. 🟩 *Improve:* cite authoritative sources, show contact/author/dates. **Weight: High (Perplexity 20%).**
- **Index Coverage** — *Category:* AEO (🟧 overlaps SEO Sitemap). *What/site-wide:* estimated % of sitemap URLs indexable (sampled). *Why:* unindexed pages can't be surfaced. 🟥 it's a **sitemap estimate, not real index status** — the real-data upgrade is **GSC URL Inspection API** (free, ownership-gated). Label confidence accordingly. **Weight: Medium (10% each).**
- **Entity Recognition** — *Category:* AEO. *What:* Org/LocalBusiness schema + optional Knowledge Graph presence. *Why:* answer engines resolve businesses as entities; KG presence boosts citation. 🟩 *Improve:* complete Organization schema, sameAs, pursue KG/Wikidata. **Weight: High (Gemini 10%).** 🟧 overlaps SEO sameAs + Local NAP.
- **Citation Consistency (NAP)** — *Category:* AEO (🟧 overlaps Local SEO NAP). *What:* Name/Address/Phone agreement across on-page sources. *Why:* inconsistent NAP erodes entity confidence. 🟩 *Caveat:* on-page only — **real citation consistency needs Places/GBP + directory APIs**. **Weight: Medium (3–5%).**
- **Topical Authority** — *Category:* AEO (🟧 overlaps SEO Content Relevance + AIO completeness). *What:* depth + heading breadth + verified internal cluster + industry-topic coverage + local signals. *Why:* answer engines favour demonstrably authoritative sources. 🟩 best-designed signal. **Weight: High (Perplexity 7%, others 5%).**
- **Brand Entity Strength** *(info-only)* — magnitude of brand signals (sameAs breadth, Wikipedia, review volume, schema completeness). 🟩 correctly info-only to avoid double-counting Entity Recognition. **Weight: 0% (info).**
- **Experience / Expertise / Authority Signals** *(info-only, E-E-A-T)* — 🟧🟧🟧 **these three overlap each other AND SEO EEAT AND Conversion trust.** *Recommendation:* collapse into **one "E-E-A-T / Trust" composite** measured once, displayed across AEO + SEO. Keep info-only (they're proxies; real authority needs backlink APIs — Ahrefs/Moz). **Weight: 0% (info composite).**
- **pageSpeed (inside AEO weights)** — 🟦 **Remove from AEO weighting.** It's a Technical metric; AEO should *reference* the Technical CWV score for the "fast enough for engines" check, not embed a 10–20% pageSpeed weight that double-counts Technical.

### AEO Framework (deliverable Section 5)

- **Parameters:** Answer-First, Bot Access (gate), Citations, Topical Authority, Entity Recognition, Citation/NAP Consistency, + *derived lenses* on Schema, Structured Content, Headers; + info-only Brand & E-E-A-T composite; llms.txt down-weighted.
- **Measurement methodology:** per-page on-page parse + robots/header checks + optional KG/GSC/Places APIs (clearly labelled real-data vs estimate). Bot access is a **hard gate** (block → engine score 0).
- **Weighting model — per engine (recommended rebalance, each sums to 100):**

| Signal | Gemini | ChatGPT | Perplexity | Rationale |
|---|---|---|---|---|
| Bot Access (gate) | 8 | 8 | 8 | Access first; veto to 0 if blocked |
| Schema (derived) | 25 | 8 | 5 | Gemini/Google rich-type heavy |
| Structured Content | 12 | 8 | 35 | Perplexity tables |
| Answer-First | 8 | 22 | 5 | ChatGPT TL;DR |
| Citations | 7 | 8 | 22 | Perplexity citation engine |
| Topical Authority | 10 | 10 | 10 | All value depth |
| Entity Recognition | 12 | 8 | 5 | Entity grounding |
| Citation/NAP Consistency | 6 | 4 | 3 | Local entity trust |
| Index Coverage | 8 | 8 | 5 | Must be indexable |
| Markdown Headers (derived) | 4 | 6 | 2 | Parse cleanliness |
| llms.txt | 0 | 10 | 0 | **Down-weighted** (unproven) |
| **Total** | **100** | **100** | **100** | |

- **Scoring model:** `engine_score = Σ(signal×weight)/100`, apply bot-access veto; `AEO_page = mean(gemini, chatgpt, perplexity)` (consider adding **Google AI Overviews** and **Copilot** as a 4th/5th engine). Site AEO = template-weighted mean. Tiered badge per the 3-tier rule.

🟥 **AEO accuracy notes:** cut llms.txt weight (unproven); remove embedded pageSpeed; convert duplicated schema/headers/structured-content to *referenced* signals; integrate GSC URL Inspection (real coverage) and Places/GBP (real NAP); add the missing AI bots to scoring; add **Google AI Overview eligibility** signals (concise answers + FAQ + freshness).

---

## ▶ NEW PARAMETER — AI AGENTIC BROWSING

> **Sources:** [Chrome for Developers — Lighthouse Agentic Browsing scoring](https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring), [Chrome for Developers — llms.txt audit](https://developer.chrome.com/docs/lighthouse/agentic-browsing/llms-txt), [DebugBear — Lighthouse Agentic Browsing](https://www.debugbear.com/blog/lighthouse-agentic-browsing), [Search Engine Land — Google adds llms.txt to Lighthouse](https://searchengineland.com/google-llms-txt-chrome-lighthouse-478246), [accessiBe explainer](https://accessibe.com/blog/knowledgebase/google-lighthouses-agentic-browsing-audit-explained).

### What it is
**Agentic Browsing** is a **new Lighthouse category** (shipped in **Lighthouse 13.3.0, May 7 2026**, and inherited by **PageSpeed Insights** within ~2 weeks). It sits beside Performance, Accessibility, Best Practices and SEO and scores **how easily an AI agent can read, understand, and transact on a page**. Unlike the new model isn't a single weighted 0–100 score — the spec team deliberately chose **actionable per-audit signals + fractional pass ratios** because agentic-web standards are still emerging. It audits four areas:

1. **llms.txt discoverability & quality** — presence of `/llms.txt`; flags missing H1, too-short content, or no links.
2. **WebMCP (Web Model Context Protocol)** — whether the site exposes agent-callable "tools," via declarative HTML form annotations or imperative `navigator.modelContext.registerTool`; validates tool schemas (can emit errors/warnings); surfaces registered tools.
3. **Agent-centric accessibility (accessibility-tree integrity)** — programmatic names for interactive elements, valid roles, content visible in the accessibility tree (agents parse the a11y tree far more efficiently than raw HTML/screenshots).
4. **Cumulative Layout Shift (for agents)** — reports CLS because screenshot-taking agents get confused by shifting layouts.

> Note: a plain, well-built site can already pass (e.g. example.com scoring 2/2) **without** AI-specific work — you don't fail merely for not optimizing for agents. The category is explicitly "under development."

### Why it matters (especially for dealerships)
The shopping journey is shifting toward **AI agents that browse, compare, and transact on a user's behalf** (price a car, check availability, book a test drive, start a finance pre-qual). A dealership site that an agent can parse and *act on* (clean a11y tree + WebMCP tools + stable layout) will be transactable by the next generation of AI shopping assistants; one that can't will be skipped. It is also a **forward indicator**: Google shipping this into PSI signals that agent-readability is becoming a measurable quality bar.

### How it is measured
- **Engine:** Lighthouse 13.3+ (run locally, via PSI API, or Chrome DevTools). Auditify should call the **PSI API** (it already calls PageSpeed for Technical) and read the new `categories['agentic-browsing']` audits, OR run Lighthouse directly.
- **Outputs:** per-audit **pass/fail/warning** + **informational counts** (e.g., # registered WebMCP tools, llms.txt link count) + **fractional pass ratio** for the category. **No single weighted score is provided by Lighthouse.**
- **Industry thresholds:** llms.txt must have an H1, be non-trivial in length, and contain links; accessibility-tree checks reuse axe/Lighthouse a11y rules (so a clean Accessibility section largely satisfies this); CLS reuses the ≤0.1 good threshold.

### Suggested scoring methodology (for Auditify)
Because Lighthouse intentionally avoids a single number, Auditify should compute its **own composite 0–100** from the sub-audits so it fits the platform's tiered model, while preserving the raw pass/fail detail in "View Details":

| Sub-audit | Auditify points | Pass condition |
|---|---|---|
| Accessibility-tree integrity | 35 | reuse Accessibility section result (names/roles/visible) |
| Layout stability (CLS for agents) | 20 | CLS ≤ 0.1 (reference Technical CLS) |
| llms.txt present & valid | 25 | file exists + H1 + ≥1 link + adequate length |
| WebMCP tools exposed & valid | 20 | ≥1 valid registered tool / valid form annotation |
| **Total** | **100** | tiered: <40 Poor / 40–74 Developing / ≥75 Strong |

> Rationale for weights: a11y-tree + layout (55%) are *available today* and reuse existing measurements; llms.txt (25%) and WebMCP (20%) are emerging/aspirational and shouldn't dominate a dealer's score yet. **Mark WebMCP & llms.txt as "forward-looking / low-confidence"** in the UI.

### Which section it belongs to
🟦 **AIO (AI Optimization)** — it measures whether a *machine/agent can read and act on the page*, which is the AIO definition. It **shares measurements** with Accessibility (a11y tree), Technical (CLS), and AEO (llms.txt). Recommendation: house "AI Agentic Browsing" as a **named sub-block inside AIO** (the operability cluster), reusing Accessibility/Technical/AEO results rather than recomputing.

### Recommended weightage
- **Within AIO:** the Agentic-operability cluster ≈ **30% of the AIO section** (a11y-tree integrity being the bulk, since it's real today).
- **Priority:** **Medium now, rising to High** over the next 12–24 months. Treat as a strategic/forward metric: report it prominently, but don't let unproven sub-signals (WebMCP/llms.txt) heavily penalise dealers in the current scoring.

### Common or page-specific
- **Accessibility-tree & CLS:** page-specific (run per template).
- **llms.txt:** site-wide (one file).
- **WebMCP:** page-specific (tools are page/flow-scoped — e.g., a WebMCP "search inventory" tool on SRP, "schedule service" on Service).

---

# SECTION 2 — COMMON PARAMETERS ACROSS ALL PAGES

These parameters apply to (and should be scored on) **every discovered page** regardless of template. Weightage shown is **within its section**; importance is the priority tier.

| Parameter | Section | Weightage (within section) | Importance |
|---|---|---|---|
| LCP / INP / CLS (field-first) | Technical | ~37% combined | Critical |
| TTFB / FCP / TBT / Speed Index | Technical | ~15% | High |
| Text Compression / Caching / Render-Blocking | Technical | ~12% | Medium |
| Third-Party Script Optimization | Technical | ~6% | High |
| Title (+ uniqueness) | On-Page SEO | ~12% | Critical |
| Meta Description | On-Page SEO | ~5% | Medium |
| H1 / Heading Hierarchy | On-Page SEO | ~9% | High |
| Canonical | On-Page SEO | ~6% | High |
| Structured Data (single source) | On-Page SEO | ~7% | Critical |
| Robots.txt / Sitemap (site-wide) | On-Page SEO | ~8% | High |
| Color Contrast | Accessibility | ~9% | Critical |
| Image Alt | Accessibility | ~9% | Critical |
| Form Label / Link Name / Button Name | Accessibility | ~23% | Critical/High |
| Keyboard operability (focus/skip/landmarks) | Accessibility | ~21% | High |
| HTML Lang / Document Title / Viewport | Accessibility | ~10% | Medium |
| HTTPS / SSL / TLS | Security | ~21% | Critical |
| Security headers (CSP/HSTS/XFO/X-CTO) | Security | ~19% | High/Medium |
| Cookies Secure/HttpOnly | Security | ~8% | Medium |
| Privacy/Consent/GDPR-CCPA | Security | ~18% | Medium |
| Reputation (Safe Browsing/Malware) | Security | ~14% | Critical/High |
| Navigation Discoverability | UX & Content | ~6% | High |
| Mobile Experience / Mobile Usability | UX & Content | ~12% | High |
| Above-the-Fold / Intrusive Interstitials | UX & Content | ~8% | Medium |
| Broken Links (single owner) | UX & Content | ~4% | Medium |
| CTA Presence / Clarity / Flow | Conversion | ~18% | High |
| Click-to-Call / Chat | Conversion | ~10% | High/Medium |
| GA4 / GTM / Conversion Tracking | Conversion | ~15% | High |
| Content NLP-Friendly / Chunking / Completeness | AIO | ~48% | High |
| Accessibility-tree (Agentic) | AIO | ~20% | Medium→High |
| Bot Access (AI crawlers) | AEO | gate (veto) | Critical |
| Topical Authority / Entity Recognition | AEO | ~20% | High |
| Citations / Citation-NAP Consistency | AEO | ~12% | Medium |

---

# SECTION 3 — PAGE-SPECIFIC PARAMETERS

Parameters that **only exist or only make sense** on specific templates (in addition to the common set above). "Why it exists" is the dealership rationale; weightage is *relative emphasis on that page type*.

### Home Page
| Parameter | Why It Exists | Weightage |
|---|---|---|
| AutoDealer/LocalBusiness schema + NAP | Establishes the business entity for SEO/AEO/Local | Critical |
| Inventory finder widget (homepage facet entry) | Primary path into SRP | High |
| Navigation Discoverability + global search | Wayfinding to all departments | High |
| Featured Offers / Specials surfacing | Promotes high-intent paths | Medium |
| Certifications & Awards / Reviews | Trust at first impression | Medium |
| Entity Recognition / Brand Entity Strength | Brand grounding for answer engines | High |

### SRP (Inventory / Search Results)
| Parameter | Why It Exists | Weightage |
|---|---|---|
| Inventory Filtering (facets + feedback) | Core SRP UX | Critical |
| No-Results UX | Recover zero-result searches | High |
| Canonical / pagination strategy | Controls faceted-URL duplication/index bloat | Critical |
| SRP load time (per-page Technical) | Filter JS makes SRP slowest template | High |
| Vehicle list schema (ItemList/Vehicle) | Rich results + AEO extraction | High |
| Sort controls / result counts | Findability | Medium |
| Compare / save vehicle (missing today) | Shopping enablement | Medium |

### VDP (Vehicle Detail Page)
| Parameter | Why It Exists | Weightage |
|---|---|---|
| Vehicle + Offer schema (price, VIN, availability) | Rich results, AEO, Shopping | Critical |
| Pricing Transparency (price + fees) | Trust + FTC scrutiny | Critical |
| Image gallery (alt, count, next-gen, lazy non-hero) | VDPs are image-dominant; LCP/a11y/SEO | High |
| Trade-In entry + Finance Calculator + Check Availability CTA | On-VDP conversion engines | High |
| Vehicle History (CARFAX/AutoCheck) — used/CPO | Used-car conversion driver | High (used) |
| Test-drive / appointment CTA | Lead capture | High |
| Video walkaround (VideoObject) | Engagement + rich results | Medium |

### Offers / Promotions / Lease Specials
| Parameter | Why It Exists | Weightage |
|---|---|---|
| Content Freshness / expiry dates | Expired offers = trust + legal risk | Critical |
| Offer schema + disclaimers | Rich results + compliance fine print | High |
| Intrusive Interstitials (promo modals) | Common UX/SEO offender here | Medium |
| Offer CTA → relevant VDP/SRP/lead form | Convert promo interest | High |
| Pricing Transparency / fee disclosure | Compliance | High |

### Trade-In
| Parameter | Why It Exists | Weightage |
|---|---|---|
| Trade-In valuation tool (KBB/TradePending/etc.) | The page's entire purpose | Critical |
| Lead form (vehicle identifying fields) + CRM routing | Capture trade lead | High |
| Form length/validation appropriate to VIN/condition | Completion rate | High |
| Thank-You / confirmation + tracking | Measure lead | Medium |

### Finance
| Parameter | Why It Exists | Weightage |
|---|---|---|
| Finance Form Security (PCI/HTTPS/sensitive fields/provider) | Handles SSN/credit | Critical |
| Pre-approval / credit-application flow | Core finance conversion | Critical |
| Payment Calculator (APR/term/monthly) | Shopper self-serve | High |
| Trusted lender integration (RouteOne/Dealertrack/AutoFi) | Secure submission | High |
| Multi-step progress + clear required fields | Long-form completion | Medium |
| Soft-pull / "won't affect credit" messaging (missing) | Reduces friction | Medium |

### Service & Repair
| Parameter | Why It Exists | Weightage |
|---|---|---|
| Appointment Booking (Xtime/myKaarma/Calendly) | The page's purpose | Critical |
| Service load time (per-page Technical) | Scheduling widgets are heavy | High |
| Service schema (AutoRepair/Service, hours, offers) | Local + rich results | High |
| Service coupons/specials | Conversion incentive | Medium |
| Click-to-Call (service line) | Mobile booking | High |
| Service content depth/quality | SEO + AIO | Medium |

### About / Contact
| Parameter | Why It Exists | Weightage |
|---|---|---|
| NAP completeness + LocalBusiness schema | Local SEO + entity + AEO | Critical |
| Map / directions / hours | Conversion + local | High |
| Staff Profiles (humanization/E-E-A-T) | Trust + experience signal | Medium |
| Contact form + CRM routing | Lead capture | High |
| Privacy Policy / data disclosure links | Compliance | Medium |
| Click-to-Call / multiple contact methods | Conversion | High |

### Blog / FAQ / Guides / How-To
| Parameter | Why It Exists | Weightage |
|---|---|---|
| Answer-First (TL;DR) | AEO answer extraction | High |
| FAQPage / HowTo / Article schema | Rich results + AEO | High |
| Content Completeness / Chunking / Readability | AIO comprehension | High |
| Author/Source Attribution + dates (E-E-A-T) | Trust/citation | Medium |
| Content Freshness | Topical relevance | Medium |
| Internal links → inventory/service/finance | Convert informational traffic | High |

> **Deliverable Sections 4 (AIO Framework), 5 (AEO Framework) and 6 (AI Agentic Browsing Framework)** are defined in full within the per-parameter deep dives above (▶ Section 7 AIO, ▶ Section 8 AEO, ▶ AI Agentic Browsing). They specify parameters, measurement methodology, weighting model, and scoring model as required.

---

# SECTION 7 — RECOMMENDED SCORING ARCHITECTURE

The new platform audits **each discovered page**, scores it across the 8 sections, then rolls up to **page scores** and a **site score**. Three levels:

### 7.1 Section Score (per page)
For each of the 8 sections on a given page:

```
SectionScore(page, section) = Σ(paramScore × paramWeight) / Σ(paramWeight)   ... for PRESENT, applicable params only
```
- **Graduated 0–100** per parameter (replace binary 0/100 where used — see 🟥 flags: Redirect Chains, CSP, headers).
- **Applicability gating:** params that are not-applicable on a template (e.g., Inventory Filtering on a Blog) are **excluded from the denominator**, not scored 0 — this prevents unfair penalties. (The codebase already does this with `infoOnly`/`notApplicable` — keep it.)
- **Info-only params** (PageSpeed score, WCAG composite, Brand Entity Strength, E-E-A-T composite) are displayed but **never in the denominator**.
- **Hard gates / vetoes:** AEO Bot-Access blocked → that engine = 0; a Critical security failure (no HTTPS, active mixed content, malware flag) should **cap** the Security section (e.g., ≤40) regardless of other passes.
- **3-tier colour** per the platform rule: <25 Red, 25–74 Orange, ≥75 Green (note: this differs from the Poor/Developing/Strong <40/40–74/≥75 content tiers — keep colour thresholds as the existing site-wide rule).

### 7.2 Page Score
```
PageScore(page) = Σ(SectionScore(page, s) × SectionWeight(s, template)) / Σ SectionWeight
```
- **Template-aware section weights:** the 8-section weight mix should shift by page type. Examples:
  - **VDP / Trade-In / Finance / Service** → boost **Conversion Flow** and (Finance) **Security**.
  - **Blog / FAQ** → boost **AIO/AEO** and **On-Page SEO**, lower Conversion.
  - **SRP** → boost **UX & Content** (filtering) + **Technical** (load).
  - **About/Contact** → boost **On-Page SEO (Local)** + Conversion (contact).
- Provide a **default (Home/general) mix** (Section 7.4) and per-template overrides.

### 7.3 Site Score
```
SiteScore = Σ over templates [ TemplateWeight × mean(PageScore of pages in that template) ]
```
- **Template-weighted, not flat-averaged:** weight templates by business value and volume so 5,000 VDPs don't drown out the Home page, yet VDP quality still counts. Suggested template weights: Home 12%, SRP 14%, VDP 22%, Finance 10%, Service 10%, Trade-In 7%, Offers 7%, About/Contact 8%, Blog/FAQ 10% (tune per dealer).
- **Site-wide-only params** (robots, sitemap, llms.txt, domain reputation, TLS) are scored **once** and injected into the relevant section at site level, not re-scored per page.
- Also report **per-section site scores** (e.g., "site Accessibility = 68") and **worst-offender pages** per section.

### 7.4 Recommended Section Weight Distribution (default mix, sums to 100%)

| Section | Weight | Rationale |
|---|---:|---|
| **Technical** | **18%** | Speed/CWV/crawl underpin everything; mobile-dominant audience. |
| **On-Page SEO** | **18%** | Still the primary organic-visibility driver for inventory. |
| **Conversion Flow** | **17%** | The dealership's commercial purpose — leads/appointments/sales. |
| **UX & Content** | **13%** | Usability + shopping experience (filtering, pricing, mobile). |
| **Accessibility** | **12%** | Legal exposure (ADA) + real users + feeds agent-readability. |
| **Security & Compliance** | **9%** | Table-stakes + PII/PCI/privacy; gates rather than dominates. |
| **AEO** | **8%** | Rising answer-engine visibility; real but still emerging. |
| **AIO** | **7%** | Machine comprehension + agent operability; forward-looking. |
| **Total** | **100%** | |

> **Rationale for the split:** Technical, SEO and Conversion form the "earn traffic + convert it" core (53%) appropriate to a revenue-driven dealership. UX + Accessibility (25%) protect experience and legal standing. Security (9%) gates but shouldn't dwarf marketing concerns on a brochure-ware dealer site (it can veto via caps when truly broken). AEO+AIO (15%) reflect that AI search is material and growing but not yet the majority of dealership traffic — weighted to *increase over time*. As AI-driven discovery grows, shift ~5–8% from SEO into AEO/AIO.

---

# APPENDIX A — DUPLICATES, OVERLAPS, MERGES, REMOVALS

### A.1 Duplicate parameters (measured in 2+ modules — measure once, reference elsewhere)
| Concept | Appears in | Recommendation |
|---|---|---|
| **Structured Data / Schema** | SEO, AIO, AEO | **SEO owns** the parse+validate; AIO/AEO consume the result with their own lens. |
| **Heading hierarchy** | SEO (Heading Hierarchy), Accessibility (Heading Order), UX (Hierarchy Clarity), AIO (Markdown Headers) | Measure once; **Accessibility owns** correctness; others reference. |
| **Content Freshness** | SEO (Freshness), AIO (Updated Regularly) | **SEO owns**; AIO references. |
| **Internal Linking** | SEO (Links/Contextual), AIO (Internal Linking AI-Friendly) | **SEO owns**; AIO references. |
| **Canonical / duplicate control** | SEO (Canonical), AIO (Duplicate Detection Ready) | **SEO owns**; AIO references. |
| **Broken Links** | SEO (Contextual), UX (Broken Links) | **UX owns** (crawl-level); SEO references. |
| **Mobile usability/ergonomics** | Technical (Mobile Usability), UX (Mobile Experience + Usability), Accessibility (Viewport/target-size) | **UX owns** ergonomics; Technical keeps only mobile *load speed*; A11y owns target-size. |
| **Image alt** | SEO (Image), Accessibility (Image Alt), AIO (keywords/alt) | **Accessibility owns** presence/quality; SEO owns keyword value. |
| **CLS** | Technical (CLS + Rendering Performance), UX (above-fold), AEO/Agentic | Measure once in Technical; reference. **Merge "Rendering Performance" into CLS.** |
| **E-E-A-T** | SEO (EEAT), AEO (Experience/Expertise/Authority), AIO (Author Attribution), Conversion (trust) | Build **one E-E-A-T/Trust composite**, measured once, displayed across sections. |
| **NAP / entity** | SEO (Local NAP), AEO (Citation Consistency, Entity Recognition), Conversion (trust) | One NAP/entity measurement; section-specific lenses. |
| **GA4/GTM/Conversion Tracking** | Conversion + Security display | **Conversion owns**; drop from Security display. |
| **Safe Browsing** | Security (Safe Browsing + inside Blacklist) | Merge reputation signals into one. |
| **Multi-step progress / error handling** | Conversion (Form group + Form-UX group) | Merge Form-UX subset into Form group. |

### A.2 Parameters to RECLASSIFY (🟦)
| Parameter | From → To | Reason |
|---|---|---|
| Mobile Usability | Technical → UX | Ergonomics, not delivery. |
| CRM Integration | Security → Conversion | Lead routing, not security. |
| Finance Form Security | split: PCI→Security, finance-UX→Conversion | Two concerns. |
| Service/Content Depth Quality | SEO (info) → UX + AIO | Content quality, not classic SEO. |
| Answer-Oriented Structure | AIO → AEO | Answer-engine visibility, not comprehension. |
| Author/Source Attribution | AIO → AEO/E-E-A-T | Trust/citation signal. |
| GA4/GTM/Tracking | Security display → Conversion | Measurement of conversion. |
| pageSpeed weight in AEO | AEO → reference Technical | Don't double-count CWV. |

### A.3 Parameters to REMOVE / deprecate / repurpose
| Parameter | Action | Reason |
|---|---|---|
| **FID** | Remove (info only) | Retired by Google Sept 2024; INP replaces it. |
| **Rendering Performance** | Merge into CLS | Same metric re-expressed. |
| **URL Structure (info)** | Merge into URL Slugs → "URL Quality" | Two views of one thing. |
| **Lead Magnets** | Repurpose → "Offers/Specials" | SaaS concept; wrong for auto retail. |
| **Case Studies / Client Logos** | Repurpose → reviews/awards | B2B language; mismatched to dealerships. |
| **Active SQLi/XSS/credential tests** | Gate behind ownership or downgrade to passive | Authorization/accuracy/ethics risk on third-party domains. |
| **GBP signals (heuristic)** | Replace with GBP/Places API | Current placeholder is unreliable. |
| **Bespoke Inventory/Service timers** | Fold into per-page Technical | Redundant once every page gets Technical scoring. |

### A.4 Accuracy risks worth fixing (🟥 summary)
1. **Lab "INP" uses TTI/TBT thresholds (≤3.8s/≥7.3s)** mislabeled as INP — report field INP; relabel lab as TBT proxy.
2. **5-page sampling** for title/meta uniqueness — far too small for large inventory; sample per template class.
3. **Binary scoring** on Redirect Chains, CSP, security headers — grade by degree/quality.
4. **Keyword/selector whole-DOM scans** in Conversion/Trust over-credit pages — make page-type-aware and element-anchored.
5. **llms.txt at 40% of ChatGPT** — unproven convention; down-weight.
6. **"Missing API key = pass"** (Safe Browsing/Malware/KG) masks unknowns — label "not checked."
7. **Index Coverage is a sitemap estimate** — integrate GSC URL Inspection for real data.
8. **NAP/Local is on-page only** — integrate Places/GBP for real citation consistency.
9. **Active exploit/login tests on unowned domains** — legal/accuracy hazard.

---

# APPENDIX B — MISSING PARAMETERS (recommended additions)

**Technical:** HTTP/2-3 protocol, font-display/FOIT, next-gen image % of bytes, DOM size, CrUX origin-vs-URL, HTTP status codes across crawl, soft-404 detection.
**On-Page SEO:** hreflang validation, SRP pagination strategy, index-bloat (faceted URL explosion), XML+HTML sitemap parity, Rich-Results-style schema error reporting, image sitemap.
**Accessibility (WCAG 2.2):** target-size, focus-not-obscured, dragging-movements, consistent-help, prefers-reduced-motion, video captions/transcripts (VDP walkarounds), finance-PDF accessibility.
**Security:** security.txt, SRI for vendor scripts, outdated-library/CVE detection, exposed `.git`/backups, SameSite cookies, DMARC/SPF, consent-mode-v2 verification.
**UX & Content:** vehicle comparison tool, saved/favourite vehicles, gallery zoom UX, 404-page UX, search-result relevance/sorting correctness, line-length/legibility.
**Conversion:** reCAPTCHA/spam-protection (friction balance), price-drop alerts, finance soft-pull detection, exit-intent, phone-vs-NAP consistency, steps-to-lead friction score.
**AIO/AEO/Agentic:** Google AI Overview eligibility, Copilot/Bing-chat readiness, additional AI bots (ClaudeBot, CCBot, Bytespider, Applebot-Extended, OAI-SearchBot, Amazonbot, Meta-ExternalAgent), GSC URL Inspection integration, WebMCP tool coverage per flow, accessibility-tree-for-agents reuse.

---

# APPENDIX C — PAGE DISCOVERY & CLASSIFICATION MODEL (required by the new flow)

The new user flow ("enter a URL → discover & classify pages → audit each") needs a discovery+classifier layer that doesn't fully exist today (the code only finds *inventory* and *service* pages via path ranking). Recommended design:

1. **Discovery:** robots.txt → sitemap.xml / sitemap_index.xml (preferred); fallback to intelligent BFS crawl (bounded depth + budget, dedupe by canonical, respect robots).
2. **Classification into the 9 categories** (Home, SRP, VDP, Offers, Trade-In, Finance, Service, About/Contact, Blog/FAQ) using a **signal blend** (don't rely on URL alone):
   - **URL patterns** (the existing rank regexes are a good seed: used/new inventory, schedule-service, etc.).
   - **Schema type** (Vehicle/Product → VDP; ItemList of Vehicles → SRP; AutoDealer → Home/About; FAQPage → FAQ; Service → Service).
   - **DOM fingerprints** (single VIN/price + gallery → VDP; many vehicle cards + filters → SRP; credit fields → Finance; date/time picker → Service; valuation widget → Trade-In).
   - **Title/H1 keywords** as tiebreakers.
3. **Sampling:** for huge templates (VDP/SRP), audit a representative **sample per template** (e.g., 3–10 VDPs across price/condition), not all — report sample size explicitly (no silent caps).
4. **Output:** every page tagged with `template`, `confidence`, and the applicable parameter set; scores roll up per Section 7.

---

# APPENDIX D — SUMMARY OF KEY RECOMMENDATIONS

1. **De-duplicate aggressively** — one measurement per concept (schema, headings, freshness, internal links, CLS, NAP, E-E-A-T, mobile); sections *reference* shared results.
2. **Cleanly separate AIO (comprehension + agent operability) from AEO (visibility + citation)** — move Answer-Oriented Structure and Author Attribution to AEO; keep chunking/NLP/completeness in AIO.
3. **Add AI Agentic Browsing** as an AIO sub-block, reusing Accessibility (a11y tree) + Technical (CLS); compute a composite but mark WebMCP/llms.txt forward-looking.
4. **Make everything page-type-aware** — per-template scoring, applicability gating, template-weighted site roll-up.
5. **Fix the accuracy risks** (Appendix A.4) — especially lab-INP labeling, binary→graduated scoring, whole-DOM keyword scans, and "missing key = pass."
6. **Integrate real-data APIs** where heuristics are weak — GSC URL Inspection (index coverage), Places/GBP (NAP/reviews/Local), and treat backlink-based authority as out-of-scope until a paid API is added.
7. **Adopt the 8-section weight split** (Technical 18 / SEO 18 / Conversion 17 / UX 13 / Accessibility 12 / Security 9 / AEO 8 / AIO 7) with a planned drift toward AEO/AIO over time.
8. **Deprecate FID; merge Rendering Performance into CLS; relabel WCAG to 2.2 AA.**

---

# APPENDIX E — MASTER DISPOSITION MATRIX

> The single rebuild reference: every current parameter, its **current** module, its **target** section, the **disposition**, and the recommended within-section weight. Disposition key: **KEEP** (as-is, sound) · **FIX** (keep but correct methodology) · **MERGE** (fold into another param) · **MOVE** (reclassify section) · **REF** (measure once elsewhere, reference here) · **DROP** (remove/deprecate) · **REPURPOSE** (replace with dealer-appropriate equivalent) · **INFO** (display only, unweighted).

### Technical
| Current parameter | → Target | Disposition | Wt | Notes |
|---|---|---|---:|---|
| LCP (field) | Technical | KEEP | 13% | Field-first |
| INP (field) | Technical | FIX | 13% | Use field; relabel lab as TBT proxy 🟥 |
| CLS (field) | Technical | KEEP | 12% | |
| FCP / TTFB / TBT / Speed Index | Technical | KEEP | 15% | Diagnostics |
| FID | — | DROP | 0% | Retired Sept 2024 |
| Text Compression / Caching | Technical | KEEP | 8% | |
| Resource Optimization | Technical | FIX | 5% | Weak .min/cdn heuristic |
| Render-Blocking | Technical | KEEP | 4% | |
| Redirect Chains | Technical | FIX | 3% | Graduate scoring |
| Rendering Performance | Technical | MERGE→CLS | 0% | Duplicate of CLS |
| Lazy Loading | Technical | FIX | 3% | Don't reward lazy hero |
| Third-Party Script Opt | Technical | KEEP | 6% | Dealer-critical |
| JS Execution | Technical | KEEP | 4% | Correlated w/ TBT |
| PageSpeed Score | Technical | INFO | 0% | |
| Mobile Load Speed | Technical | KEEP | 4% | |
| Mobile Usability | UX | MOVE | — | Ergonomics |
| Inventory/Service Load Time | Technical | MERGE | — | Into per-page Technical |

### On-Page SEO
| Current parameter | → Target | Disposition | Wt | Notes |
|---|---|---|---:|---|
| Title (+ Uniqueness) | SEO | FIX | 12% | Sample per template, pixel-width |
| Title Keyword / Location Opt | SEO | KEEP | 6% | Location ↔ Local |
| Meta Description (+ Uniqueness) | SEO | FIX | 5% | Larger sample |
| H1 | SEO | KEEP | 6% | Down-weight from 0.10 |
| Content Relevance | SEO | FIX | 5% | Dated TF proxy |
| Content Freshness | SEO | KEEP (owner) | 3% | AIO refs this |
| URL Structure + URL Slugs | SEO | MERGE | 2% | One "URL Quality" |
| Canonical | SEO | KEEP | 6% | Dealer-critical |
| Heading Hierarchy | SEO | REF | 3% | A11y owns correctness |
| Semantic Tags | SEO | REF | 1% | |
| Image | SEO | FIX | 4% | Scope to alt-value + naming |
| Video | SEO | KEEP | 1% | |
| Links / Contextual Linking | SEO | KEEP (owner) | 8% | AIO refs; broken→UX |
| Robots.txt / Sitemap | SEO | FIX | 8% | Scale broken-URL sample |
| Structured Data | SEO | KEEP (owner) | 7% | Single schema source |
| Open Graph / Twitter / sameAs | SEO | KEEP | 4% | |
| EEAT | cross-section | MOVE/split | — | One E-E-A-T composite |
| Service/Content Depth Quality | UX+AIO | MOVE | — | Content quality |
| Local SEO (8 sub-signals) | SEO (Local) | FIX | 8% | GBP API; share NAP w/ AEO |

### Accessibility (all → Accessibility, KEEP unless noted; upgrade ruleset to WCAG 2.2 AA)
| Current parameter | Disposition | Wt |
|---|---|---:|
| Color Contrast | KEEP | 9% |
| Image Alt | KEEP (owner) | 9% |
| Form Label | KEEP | 9% |
| Link Name / Button Name | KEEP | 14% |
| Focus Order / Focusable / Tab Index | KEEP | 16% |
| Skip Links / Landmarks | KEEP | 5% |
| HTML Lang / Document Title / Viewport | KEEP | 11% |
| Heading Order | KEEP (owner) | 4% |
| List | KEEP | 2% |
| ARIA Roles / Allowed-Attr / Hidden-Focus / Affordance | KEEP | 12% |
| Keyboard Navigation (composite) | INFO | 0% |
| WCAG AA Compliance | INFO (→2.2) | 0% |

### Security & Compliance
| Current parameter | → Target | Disposition | Wt | Notes |
|---|---|---|---:|---|
| HTTPS / SSL / TLS | Security | KEEP | 21% | |
| SQLi / XSS / Weak Creds | Security | FIX/gate | 19%* | *Only if authorized 🟥 |
| Safe Browsing / Blacklist / Malware | Security | MERGE | 14% | One reputation score |
| Admin Panel Public | Security | KEEP | 6% | |
| Forms HTTPS | Security | KEEP | 6% | |
| CSP / HSTS / XFO / X-CTO | Security | FIX | 19% | Grade by quality |
| Cookies Secure / HttpOnly | Security | FIX | 8% | Add SameSite |
| MFA Enabled | Security | KEEP | 3% | |
| Cookie Consent / Privacy / GDPR-CCPA / 3rd-party / Data Collection | Security | KEEP | 18% | |
| CRM Integration | Conversion | MOVE | — | |
| Finance Form Security | Security+Conv | SPLIT | 6% | PCI→Sec, UX→Conv |
| GA4 / GTM / Tracking | Conversion | MOVE | — | Drop from Sec display |

### UX & Content
| Current parameter | → Target | Disposition | Wt | Notes |
|---|---|---|---:|---|
| Text Readability | UX | KEEP | 3% | |
| Sticky Header / Density / Layout / In-Page Nav | UX | KEEP | 9% | Low-confidence each |
| Intrusive Interstitials | UX | KEEP | 4% | |
| Breadcrumbs | UX | KEEP | 3% | |
| Navigation Discoverability | UX | KEEP | 6% | |
| Above-the-Fold | UX | KEEP | 4% | |
| Click Feedback / Loading Feedback | UX | KEEP | 6% | |
| Broken Links | UX | KEEP (owner) | 4% | SEO refs |
| Hierarchy Clarity / Section Labeling | UX | REF | 5% | |
| Page-to-Page Flow | UX | KEEP | 3% | |
| Mobile Experience / Mobile Usability | UX | KEEP (owner) | 12% | Consolidate trio |
| Inventory Filtering | UX (SRP) | KEEP | 10%(SRP) | Excellent |
| Pricing Transparency | UX | KEEP | 6% | |
| No-Results UX / Certs & Awards / Staff Profiles | UX | INFO | 0% | |
| Vehicle History | UX (used VDP) | PROMOTE | 4% | Was info |

### Conversion Flow
| Current parameter | → Target | Disposition | Wt | Notes |
|---|---|---|---:|---|
| CTA Presence / Flow / Link Relevance | Conversion | FIX | 19% | Page-type-aware |
| CTA Clarity / Crowding | Conversion | KEEP | 7% | |
| Form Presence / Length / Validation / Submit / Required / Multi-step | Conversion | FIX | 24% | Page-aware field limits |
| Reviews / Testimonials / Trust Badges | Conversion | KEEP | 14% | |
| Client Logos / Case Studies | Conversion | REPURPOSE | — | →awards/reviews |
| Progress / Error Handling / Microcopy | Conversion | MERGE | 6% | Into Form group |
| Lead Magnets | Conversion | REPURPOSE | — | →Offers/Specials |
| Incentives Displayed | Conversion | KEEP | 4% | |
| Trade-In / Financing / Calculator / Appointment / Thank-You | Conversion | KEEP | 27% | Core dealer flows |
| Chat / Click-to-Call | Conversion | KEEP | 10% | |
| GA4 / GTM / Conversion Tracking | Conversion | KEEP (owner) | 15% | Pulled from Security |
| CRM Integration | Conversion | MOVE-IN | incl. | From Security |

### AIO
| Current parameter | → Target | Disposition | Wt | Notes |
|---|---|---|---:|---|
| Content NLP Friendly | AIO | KEEP | 18% | Core |
| Content Chunking | AIO | KEEP | 16% | Core |
| Content Completeness | AIO | KEEP | 14% | Core |
| Lists & Structured Blocks | AIO | KEEP | 12% | Coord w/ AEO |
| Topical Focus Clarity | AIO | KEEP | 12% | |
| Fact vs Opinion | AIO | KEEP | 12% | |
| Keywords/Entities Annotated | AIO | KEEP | 10% | |
| Terminology Consistency | AIO | KEEP | 6% | |
| Structured Data | SEO | REF | — | |
| Content Updated Regularly | SEO | REF | — | |
| Internal Linking AI-Friendly | SEO | REF | — | |
| Duplicate Content Ready | SEO | REF | — | |
| Answer-Oriented Structure | AEO | MOVE | — | |
| Author/Source Attribution | AEO/E-E-A-T | MOVE | — | |
| *(new)* Agentic operability cluster | AIO | ADD | 30%† | †Of AIO; reuses A11y/Tech |

### AEO (per-engine weights in §8; dispositions here)
| Current signal | Disposition | Notes |
|---|---|---|
| Answer-First | KEEP | + receives Answer-Oriented from AIO |
| Bot Access (gate) | KEEP+EXTEND | Add ClaudeBot/CCBot/OAI-SearchBot etc. |
| Citations & Trust | KEEP | |
| Topical Authority | KEEP | Best-designed |
| Entity Recognition | KEEP | Share NAP/sameAs w/ SEO |
| Citation Consistency (NAP) | FIX | Integrate Places/GBP |
| Index Coverage | FIX | Integrate GSC URL Inspection |
| Schema | REF | From SEO, AEO lens |
| Structured Content | REF/coord | With AIO Lists |
| Markdown Headers | REF | From shared heading analysis |
| llms.txt | DOWN-WEIGHT | Unproven (40%→~10%) |
| pageSpeed (in weights) | REF Technical | Remove embedded weight |
| Brand/Experience/Expertise/Authority | MERGE→INFO | One E-E-A-T composite |

### New
| Parameter | → Target | Disposition |
|---|---|---|
| AI Agentic Browsing (llms.txt/WebMCP/a11y-tree/CLS) | AIO sub-block | ADD |

---

*End of specification.*
