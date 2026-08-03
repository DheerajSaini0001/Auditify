# Auditify — Dealership Audit Parameter & Scoring Methodology

> **Purpose of this document.** Define, per audit section, (a) which parameters apply to *every* page, (b) which are *page-type specific*, and (c) the **correct** way to score each parameter — thresholds/formula, why a score is low or high, how to fix it, and its weight inside the section. This is a *specification of the ideal*, written from web-standards (Core Web Vitals, WCAG 2.2, Lighthouse, schema.org, OWASP) and dealership SEO best practice — **not** a description of how the current code computes anything.
>
> **Status:** design reference for the multi-page dealership audit. Not yet wired into code.
> **Date:** 2026-06-18

---

## 0. Model overview

### 0.1 The two axes
Every audit is a matrix of **Parameters × Pages**.

**Sections (8):**
1. Technical (performance & delivery)
2. On-Page SEO
3. Accessibility
4. Security & Compliance
5. UX & Content
6. Conversion Flow
7. **AEO** — Answer Engine Optimization (split out of the old "AIO Readiness")
8. **AIO** — AI Input/Ingestion Optimization (split out of the old "AIO Readiness")

**Page types audited (8):** discovered via sitemap first, fallback to crawl + URL/DOM heuristics.

| # | Page type | Detection hints (URL + DOM) |
|---|-----------|------------------------------|
| A | **Homepage** | `/` root; org logo + global nav + hero |
| B | **Inventory / SRP** | `/inventory`, `/used`, `/new`, `/search`; repeating vehicle cards, filters/facets, pagination |
| C | **VDP** (Vehicle Detail) | `/vehicle/`, VIN/stock# in URL, single vehicle, price + gallery + spec table |
| D | **Offers / Promotions / Lease Specials** | `/specials`, `/offers`, `/lease`; APR/lease terms, expiry dates, disclaimers |
| E | **Trade-In** | `/trade`, `/value-your-trade`; valuation form / KBB-style tool |
| F | **Finance** | `/finance`, `/credit-application`, `/payment-calculator`; PII form, calculator, disclosures |
| G | **Service & Repair** | `/service`, `/schedule-service`, `/parts`; appointment scheduler, service menu, coupons |
| H | **About / Contact / Blog / FAQ / How-To** | `/about`, `/contact`, `/blog`, `/faq`, `/how-to`; editorial/info content |

### 0.2 Scoring philosophy (the rules that fix "inaccurate" scoring)
These five principles are where most audit tools go wrong. Apply them everywhere below.

1. **Graded, not binary.** A parameter is rarely pass/fail. Use a 0–100 continuous curve (or banded 0/50/100 only when truly binary, e.g. "HTTPS present"). Example: LCP of 2.6 s is *not* "fail" — it scores ~88, not 0.
2. **Field data beats lab data.** For Core Web Vitals, use CrUX **p75 field** values when available; fall back to Lighthouse **lab** only when no field data exists, and flag it as an estimate. Never average lab+field.
3. **Quality, not presence.** "Has H1" is presence; "exactly one descriptive, keyword-relevant H1" is quality. Score the quality. A meta description that exists but is 12 chars long should not score 100.
4. **No double counting.** If a signal is already weighted in one section (e.g. "page speed" inside AEO), keep it *informational* there and let Technical own the weighted version. (This is the standing rule already used for AEO brand/entity overlaps.)
5. **Context-weight by page.** The same parameter matters differently per page. Vehicle schema is critical on a VDP (high weight) and irrelevant on an About page (excluded). Section weights and parameter weights both shift per page type — see §0.4.

### 0.3 How scores roll up
```
parameter_score (0–100)
   → section_score   = Σ(parameter_score × parameter_weight_in_section)   [weights sum to 1 within the applicable set]
   → page_score      = Σ(section_score × section_weight_for_that_page)    [weights sum to 1]
   → site_score      = weighted avg of page_scores (weight pages by traffic/importance; default: Homepage 2×, VDP/SRP 1.5×, others 1×)
```
**Critical detail — renormalize when a parameter is N/A.** If a parameter doesn't apply to a page (e.g. "Form length" on a page with no form), it is **removed from the denominator**, not scored 0. Scoring inapplicable parameters as 0 is the single most common cause of artificially low scores.

### 0.4 Recommended section weights per page (sum to 100 each)
Base weights, then per-page tilt. These are recommendations to replace flat/equal weighting.

| Section | Home | SRP | VDP | Offers | Trade-In | Finance | Service | Info/Blog |
|---|---|---|---|---|---|---|---|---|
| Technical | 18 | 20 | 18 | 15 | 14 | 14 | 16 | 14 |
| On-Page SEO | 18 | 20 | 18 | 16 | 12 | 12 | 16 | 22 |
| Accessibility | 10 | 9 | 9 | 9 | 11 | 11 | 10 | 11 |
| Security & Compliance | 12 | 8 | 8 | 12 | 16 | **22** | 10 | 10 |
| UX & Content | 12 | 13 | 13 | 12 | 13 | 11 | 13 | 15 |
| Conversion Flow | 14 | 14 | 18 | 18 | **22** | 18 | 19 | 8 |
| AEO | 8 | 8 | 9 | 7 | 6 | 6 | 8 | 12 |
| AIO | 8 | 8 | 7 | 6 | 6 | 6 | 8 | 8 |
| **Total** | 100 | 100 | 100 | 100 | 100 | 100 | 100 | 100 |

Rationale highlights: **Finance** tilts hard to Security (sensitive PII / Reg-Z disclosures). **Trade-In** and **Offers/VDP** tilt to Conversion (they exist to capture leads). **Info/Blog** tilts to SEO + AEO (discovery + AI citation is their job).

---

## 1. Parameter applicability — common vs page-specific

### 1.1 Common to ALL pages
These are scored on every page (renormalize if a sub-check is genuinely absent).

**Technical (all):** LCP, CLS, FCP, TTFB, INP, TBT, Speed Index, Compression, Caching policy, Render-blocking resources, Redirect chains, Resource optimization (images/scripts).

**On-Page SEO (all):** Meta title, Meta description, Canonical tag, Robots meta, Viewport meta, Open Graph tags, Heading hierarchy (single H1 + order), URL slug/structure, Image optimization (alt/format/lazy), Semantic tags/landmarks, Internal link profile, Content relevance to title/H1.
(Meta keywords = ignored; deprecated — see §2.2.)

**Accessibility (all):** Color contrast, Focus order/visible focus, Focusable content, Tabindex hygiene, Form labels, ARIA roles/attributes/hidden-focus, Image alt, Link names, Button names, Document title, HTML lang, Meta viewport scaling, List structure, Heading order, Landmarks, Skip links, Keyboard navigation.

**Security & Compliance (all):** HTTPS + mixed-content, SSL validity, TLS version, HSTS, X-Frame-Options/`frame-ancestors`, CSP, X-Content-Type-Options, cookie Secure/HttpOnly/SameSite, Safe Browsing, domain blacklist/VirusTotal, forms-use-HTTPS. **Site-wide (audit once, attribute to every page):** Cookie consent banner, Privacy policy link, GDPR/CCPA disclosure, admin-panel exposure, weak-credential/MFA posture.

**UX & Content (all):** Readability, Sticky-header height, Intrusive interstitials, Primary navigation discoverability, Above-the-fold content, Click feedback (hover/active/focus), Loading feedback, Broken links, Heading/hierarchy clarity, Layout consistency, In-page navigation.

**Conversion Flow (mostly all):** CTA effectiveness/clarity/crowding/flow-alignment, Trust badges, Testimonials/reviews visibility, GA4 install, GTM config, Conversion tracking. *(Forms are page-specific — see below.)*

**AEO (all, but content-type weighted):** Answer-first structure, Bot access (robots + X-Robots + UA blocking), Markdown/header structure, Structured content (tables/lists), Citations/attribution, Schema presence (type varies), Entity recognition, Citation/NAP consistency, Topical authority, Page-speed signal *(informational — owned by Technical)*. **Site-wide:** llms.txt, Index coverage (GSC).

**AIO (all):** Structured data validity (JSON-LD), NLP-friendly content, Keyword/entity annotation, Content freshness markers, AI-friendly internal linking, Duplicate-content readiness (canonical/noindex), Topical focus clarity, Answer-oriented structure.

### 1.2 Page-specific parameters
Scored **only** on the listed page types (excluded from the denominator elsewhere).

| Parameter | Pages | Section | Why page-specific |
|---|---|---|---|
| **Vehicle/Car schema** (make, model, year, VIN, mileage, condition) | VDP; model landing | AEO/AIO | Only a single-vehicle page can carry it |
| **Offer schema** (price, `availability` In/OutOfStock, `priceValidUntil`, seller) | VDP, Offers | AEO/AIO | Requires a priced item |
| **Vehicle image gallery quality** (count, resolution, alt, lazy, real-photos vs stock) | VDP | On-Page SEO / UX | Inventory differentiator |
| **Unique VDP description / duplicate-vs-OEM check** | VDP | On-Page SEO / AIO | Thin/duplicate OEM copy is the #1 VDP ranking killer |
| **Sold-vehicle handling** (301 to similar/model SRP, not 404/soft-404) | VDP | Technical / SEO | Inventory churn only happens on VDPs |
| **Price transparency / payment context** | VDP, Offers, Finance | Conversion | — |
| **ItemList schema** | SRP/Inventory | AEO/AIO | List of vehicles |
| **Faceted navigation & filters** (usability + crawl control) | SRP | UX / SEO | — |
| **Pagination handling** (load-more or `rel=next/prev`; canonical strategy; noindex thin filter combos) | SRP | Technical / SEO | Index-bloat risk is SRP-only |
| **Results count / empty-state quality** | SRP | UX | — |
| **Internal links SRP→VDP** | SRP | SEO / AIO | Crawl depth to inventory |
| **Offer expiry / freshness** (`priceValidUntil`, visible end date) | Offers | AEO / UX | — |
| **Legal/financial disclaimers** (APR, lease terms, "with approved credit") | Offers, Finance | Security & Compliance | FTC / Reg-Z requirement |
| **Trade-in valuation tool / form** | Trade-In | Conversion | — |
| **Payment / finance calculator** | Finance, VDP | Conversion / UX | — |
| **Credit-application PII security** (HTTPS form, encryption-in-transit, no sensitive autocomplete leakage, no PII in URL/GET) | Finance, Trade-In | Security & Compliance | These pages collect SSN/financial PII |
| **FAQPage schema** | FAQ, Finance, Service, VDP | AEO | Q&A blocks |
| **HowTo schema** | How-To | AEO | Step content |
| **Article/BlogPosting schema** (+ author, datePublished/dateModified) | Blog | AEO / AIO | Editorial only |
| **E-E-A-T signals** (author bio, credentials, team, reviews) | About, Blog, (Service) | AEO | Experience/Expertise/Authority live in editorial + about |
| **AutoRepair / Service schema + service menu + scheduler** | Service | AEO / Conversion | — |
| **Service specials / coupons** | Service, Offers | Conversion | — |
| **AutoDealer / Organization schema + NAP consistency** | Home, About, Contact | AEO/AIO | Org identity pages |
| **LocalBusiness + map + hours + NAP** | Home, Contact, Service | AEO / UX | Local pack |
| **Value proposition / multi-CTA hub** (inventory/service/finance routes) | Home | Conversion / UX | Home is the router |
| **ContactPage / AboutPage schema** | Contact / About | AEO | — |

---

## 2. Section scoring detail

For each parameter: **What** (what it measures) · **Score** (correct calculation) · **Low/High** (drivers) · **Fix** · **w** (weight within section, summing to ~1.0 across the applicable set). Weights shift per page where noted.

---

### 2.1 Technical (performance & delivery)

**Core principle:** mirror Lighthouse's empirically-derived weighting, but prefer **CrUX field p75** for the three Core Web Vitals when available. Lighthouse v10–v12 metric weights: **TBT 30%, LCP 25%, CLS 25%, FCP 10%, Speed Index 10%**. INP is the real-world interactivity metric; TBT is its best lab proxy. FID is deprecated (do not weight it — informational only).

| Parameter | What / Score | Low → / High → | Fix | w |
|---|---|---|---|---|
| **LCP** | Largest contentful paint. Good ≤2.5 s, NI 2.6–4.0 s, Poor >4.0 s. Score on log-normal curve (mobile p10≈2.5 s, median≈4.0 s). Use CrUX p75; lab fallback. | Slow = large hero image, slow TTFB, render-blocking CSS / High = optimized hero, CDN | Preload LCP image, `fetchpriority=high`, compress hero, fast server | **0.22** |
| **CLS** | Layout shift = Σ(impact × distance). Good ≤0.1, Poor >0.25. | Images/ads without dimensions, late fonts, injected banners | Set width/height/aspect-ratio, reserve ad/space, `font-display:optional` | **0.18** |
| **INP** (field) / **TBT** (lab proxy) | INP good ≤200 ms, NI 201–500, Poor >500. TBT good ≤200 ms (mobile). Combine: if field INP exists weight it; else use TBT. | Heavy JS, long tasks, big third-party tags | Code-split, defer/remove unused JS, break long tasks, limit tag-manager bloat | **0.20** |
| **FCP** | First contentful paint. Good ≤1.8 s. | Render-blocking, slow TTFB | Inline critical CSS, defer JS | **0.08** |
| **TTFB** | Server response. Good ≤0.8 s. | Slow host, no cache, redirect before TTFB | CDN, server cache, reduce redirects | **0.08** |
| **Speed Index** | Visual completeness rate. Good ≤3.4 s. | Slow progressive render | Optimize above-fold paint | **0.06** |
| **Compression** | Brotli/Gzip on text assets. Binary-ish: score by % of compressible bytes actually compressed. | Uncompressed HTML/CSS/JS | Enable Brotli at CDN/server | **0.05** |
| **Caching policy** | `Cache-Control`/`max-age` + immutable on static assets. Score by % static bytes with efficient TTL (≥30 days). | No/short cache headers | Long-cache fingerprinted assets | **0.05** |
| **Render-blocking resources** | Count + estimated savings (ms). Score inversely to blocking ms. | Sync CSS/JS in head | Defer/async, inline critical CSS | **0.04** |
| **Resource optimization** | Oversized images, unminified JS/CSS, next-gen formats. Score by wasted-bytes ratio. | Unoptimized media/code | WebP/AVIF, minify, responsive `srcset` | **0.03** |
| **Redirect chains** | Hops before final 200. Score: 0 hops=100, 1=85, 2=60, ≥3<40. *(VDP: combine with sold-vehicle 301 correctness.)* | Multi-hop http→https→www→path | Collapse to single redirect | **0.01** |

> **VDP add-on:** *Sold-vehicle handling* — a sold VIN should `301` to a similar in-stock vehicle or the model SRP, never `404`/soft-404. Score 100 for correct 301, 40 for 404, 0 for soft-404 (200 with "no longer available"). Inject into Technical at w≈0.05 on VDPs (renormalize others down).

**Section→overall:** see §0.4 (14–20 across pages).

---

### 2.2 On-Page SEO

| Parameter | What / Score | Low → / High → | Fix | w |
|---|---|---|---|---|
| **Meta title** | Presence + length 30–60 chars + unique + primary keyword near front + brand suffix. Score: presence 40 / length-in-range 25 / keyword-relevance 20 / uniqueness 15. | Missing, too long (truncated), duplicated across inventory | Template `{Year} {Make} {Model} {Trim} for Sale in {City} | {Dealer}` | **0.16** |
| **Meta description** | Presence + 120–160 chars + compelling + keyword + unique. Graded by length band + keyword + uniqueness. | Missing, OEM-duplicated, truncated | Unique per VDP/SRP, include price/CTA | **0.10** |
| **Heading hierarchy** | Exactly one H1, no skipped levels, descriptive. Score: 1 H1=40, no skips=30, keyword-relevant=30. | 0 or >1 H1, jumps H1→H4 | One H1 = page topic; nest logically | **0.12** |
| **URL slug/structure** | Short, lowercase, hyphenated, keyword, shallow depth (≤4), no params/dates/extensions. | Query-string SRPs, deep paths, IDs only | Readable slugs `/2024-honda-civic-ex` | **0.10** |
| **Canonical tag** | Present, self-referencing (or correct target), absolute URL, one per page. | Missing on SRP filters, pointing wrong, multiple | Self-canonical primary; filtered SRPs → canonical to base or noindex | **0.12** |
| **Image optimization** | Alt coverage %, next-gen format %, lazy-load below fold, descriptive filenames, no broken. Score weighted by alt% (0.4) + format (0.3) + lazy (0.2) + naming (0.1). | Missing alts (also a11y), giant JPEGs | Alt all content imgs, WebP/AVIF, `loading=lazy` | **0.10** |
| **Open Graph / social** | og:title/description/image (+ Twitter card). Score by completeness. | Missing → poor social/AI cards | Add OG block; 1200×630 image | **0.06** |
| **Robots meta** | Correct index/noindex intent; no accidental `noindex`/`nofollow` on money pages. | Accidental noindex on VDP/SRP | Index VDP/SRP; noindex thin filter combos only | **0.08** |
| **Viewport meta** | `width=device-width, initial-scale=1`, no `maximum-scale=1`/`user-scalable=no`. | Missing or scaling disabled (also a11y) | Standard responsive viewport | **0.04** |
| **Internal link profile** | Count, descriptive anchors (not "click here"), no orphan, reasonable density. Score anchor-quality + reachability. | Generic anchors, orphan VDPs | Descriptive anchors; link SRP→VDP, related vehicles | **0.06** |
| **Content relevance** | Keyword agreement across Title↔H1↔body↔meta (TF/entity overlap). | Title/body mismatch, thin body | Align topic; expand thin pages | **0.06** |
| **Meta keywords** | **Deprecated — informational only, weight 0.** Do not score; ignored by all engines since ~2009. | — | Remove or ignore | 0 |

> **VDP add-on (high weight on VDPs):** *Unique description / duplicate-vs-OEM* — fingerprint body text, compare against OEM boilerplate and the dealer's other VDPs. Score by uniqueness ratio. Inject at w≈0.12 on VDP.
> **SRP add-on:** *Pagination/faceted index control* — self-canonical page 1, consistent param ordering, noindex thin combos. w≈0.08 on SRP.

---

### 2.3 Accessibility (WCAG 2.2 AA)

**Correct calculation:** automated checks cover ~30–40% of WCAG; **never report "100% accessible"** from automated alone — cap the automated score and label it "automated AA coverage." Weight checks by **severity × instance count**, not equal per-check. A single critical violation (e.g. no labels on a finance form) should hurt more than ten minor ones.

Severity tiers → weight multiplier: **Critical ×3** (keyboard trap, no form label, contrast fail on body text, missing lang), **Serious ×2** (alt missing, link/button name, ARIA misuse), **Moderate ×1** (heading order, list structure, skip link).

| Parameter | What / Score | Low → / Fix | Tier |
|---|---|---|---|
| **Color contrast** | Body ≥4.5:1, large ≥3:1, UI/icons ≥3:1. Score = % text nodes passing. | Light-grey-on-white / Darken text, tokens | Critical |
| **Form labels** | Every input has programmatic label (`<label for>`/`aria-label`). % inputs labeled. | Placeholder-only labels / Add `<label>` | Critical |
| **HTML lang** | `<html lang>` present & valid. Binary. | Missing / Set `lang="en"` | Critical |
| **Keyboard nav / focus order / focusable / no aria-hidden trap** | All interactive reachable + logical order + visible focus, no positive tabindex. | Mouse-only widgets / Native elements, manage focus | Critical |
| **Image alt** | Content images have meaningful alt; decorative `alt=""`. % correct. | Missing/duplicated alt / Describe purpose | Serious |
| **Link & button names** | Discernible accessible name. % named. | Icon-only nav, "read more" / aria-label | Serious |
| **ARIA roles/attributes** | Valid roles, allowed attrs, required props. | Invalid/redundant ARIA / Prefer native HTML | Serious |
| **Document title** | Present, unique, descriptive. | Generic/duplicate / Per-page title | Serious |
| **Meta viewport scaling** | Zoom not disabled. | `user-scalable=no` / Remove | Serious |
| **Heading order** | No skipped levels. | H1→H4 / Sequential | Moderate |
| **Landmarks** | main/nav/header/footer present, one `main`. | No landmarks / Add semantic regions | Moderate |
| **List structure** | Real `ul/ol/li` for lists. | Faux lists / Use list elements | Moderate |
| **Skip link** | "Skip to content" before nav. | None / Add skip link | Moderate |

> **Finance/Trade-In emphasis:** form-label and contrast failures on PII forms are blocking — treat as Critical and surface prominently.

---

### 2.4 Security & Compliance

**Correct calculation:** group into **Transport, Headers, Cookies, Reputation, App-exposure, Privacy/Legal**. Transport + critical headers are near-binary gates; missing HTTPS or a malware flag should cap the whole section low regardless of other passes.

| Parameter | What / Score | Low → / Fix | w |
|---|---|---|---|
| **HTTPS + no mixed content** | All resources over HTTPS, no http subresources. Gate: no HTTPS → section ≤30. | Mixed content / Upgrade all refs, HSTS | **0.14** |
| **SSL validity** | Cert valid, not expired, trusted chain, matches host. | Expired/self-signed / Renew, valid CA | **0.08** |
| **TLS version** | TLS 1.2 min, 1.3 preferred; no SSLv3/TLS1.0/1.1. | Old TLS / Disable legacy | **0.06** |
| **HSTS** | `Strict-Transport-Security` w/ long max-age (+preload). | Missing / Add header | **0.06** |
| **CSP** | Content-Security-Policy present & not trivially unsafe (`unsafe-inline`/`*`). Graded by directive coverage. | None / Start report-only, tighten | **0.10** |
| **X-Frame-Options / frame-ancestors** | Clickjacking protection. | Missing / `frame-ancestors 'self'` | **0.05** |
| **X-Content-Type-Options** | `nosniff`. | Missing / Add | **0.04** |
| **Cookie flags** | Secure + HttpOnly + SameSite on session cookies. % compliant. | Flags absent / Set flags | **0.06** |
| **Safe Browsing / VirusTotal / blacklist** | Not flagged for malware/phishing. Gate: flagged → section ≤25. | Compromised / Clean & request review | **0.10** |
| **Injection exposure (SQLi/XSS surface)** | Reflected params, unescaped output indicators. Heuristic — label "surface indicator," not proof. | Reflected input / Server-side validation, encode output | **0.06** |
| **Forms use HTTPS** | All form `action` over HTTPS, method POST for PII. | http action / Force HTTPS POST | **0.05** |
| **Admin exposure / weak creds / MFA** | `/admin`,`/wp-admin` reachable, default creds, MFA posture. *Site-wide.* | Public admin / Restrict, MFA | **0.04** |
| **Cookie consent banner** | Present before non-essential cookies fire. *Site-wide.* | None / CMP | **0.03** |
| **Privacy policy link** | Reachable from footer. *Site-wide.* | Missing / Add link | **0.03** |
| **GDPR/CCPA disclosure + data-collection notice** | "Do Not Sell", consent text, collection disclosure. *Site-wide.* | Absent / Add notices | **0.04** |

> **Finance/Trade-In add-on (raises section to ~22% weight):** *PII-form security* — no SSN/credit fields in GET/URL, HTTPS POST, no sensitive `autocomplete` leakage, encryption-in-transit; *legal disclaimers* (APR/Reg-Z, "with approved credit", lease terms) present and legible. These can each be scored 0/50/100 and weighted ~0.10 within Finance.

---

### 2.5 UX & Content

| Parameter | What / Score | Low → / Fix | w |
|---|---|---|---|
| **Readability** | Flesch Reading Ease; target 50–70 for consumer auto content. Score by distance from band. | Wall-of-jargon / Shorter sentences | **0.10** |
| **Intrusive interstitials** | Penalize content-blocking modals/overlays on load (Google interstitial penalty). Score: none=100, dismissible-small=70, blocking=20. | Email-gate popup on entry / Defer/shrink | **0.12** |
| **Primary navigation discoverability** | Visible nav, search present & functional, mobile menu. | Hidden/broken nav / Persistent nav + search | **0.12** |
| **Above-the-fold content** | Meaningful content + primary CTA visible without scroll; not all hero/whitespace. | Empty ATF / Surface value + CTA | **0.10** |
| **Broken links** | % internal/external links returning 4xx/5xx. Score = 100 − (broken% scaled). | Dead VDP links / Fix/redirect | **0.12** |
| **Sticky header height** | ≤ ~15% viewport on mobile; not crowding content. | Oversized sticky / Slim/auto-hide | **0.06** |
| **Click feedback** | hover/active/focus states on interactive. | No states / Add states | **0.08** |
| **Loading feedback** | Spinners/skeletons for async (inventory load). | Blank waits / Skeletons | **0.06** |
| **Hierarchy/section clarity** | Clear visual hierarchy, labeled sections, scannable. | Flat undifferentiated / Headings, spacing | **0.08** |
| **Content density balance** | Not too sparse/dense; reasonable text-to-element ratio. | Cramped or empty / Balance | **0.06** |
| **Layout consistency** | Consistent grid/flex, no shifting columns across pages. | Inconsistent templates / Design system | **0.06** |
| **In-page navigation** | Anchor links / back-to-top on long pages (long VDP spec lists). | None on long pages / Add jump links | **0.04** |

> **SRP add-on:** *Faceted nav usability* (filter clarity, applied-filter visibility, results count, empty-state) — w≈0.10 on SRP.

---

### 2.6 Conversion Flow

**Correct calculation:** weight by funnel impact. CTAs + forms (the actual lead mechanism) dominate; trust/social proof is a multiplier; analytics is "measurability" (can't optimize what you can't measure).

| Parameter | What / Score | Low → / Fix | w |
|---|---|---|---|
| **CTA effectiveness** (clarity + prominence + funnel alignment) | Action-oriented verbs, visible, above-fold + repeated, page-appropriate ("Check Availability"/"Get ePrice" on VDP). Composite. | Vague "Submit", buried / Specific high-contrast CTAs | **0.20** |
| **CTA crowding** | Too many competing CTAs dilutes. Penalize >~5 primary CTAs/viewport. | CTA soup / Prioritize one primary | **0.06** |
| **Form presence** *(page-specific)* | Lead form exists where expected (Trade-In, Finance, Contact, Service). N/A elsewhere — renormalize. | No form on lead page / Add | **0.10** |
| **Form length / required vs optional** | Minimal fields; only essentials required. Score by friction (field count + required ratio). | 15-field forms / Cut to essentials, progressive | **0.10** |
| **Inline validation** | HTML5/JS validation with clear messages. | No validation / Real-time, friendly errors | **0.06** |
| **Submit clarity / multi-step progress** | Clear submit label; progress indicator on multi-step. | "Submit" + no progress / Specific label, stepper | **0.05** |
| **Friendly error handling / microcopy** | Helpful errors, helper text, placeholders. | Cryptic errors / Human microcopy | **0.05** |
| **Trust badges** | SSL/secure/BBB/verified icons near forms. | None near PII form / Add legit badges | **0.06** |
| **Testimonials / reviews / ratings** | Visible social proof, ideally with Review schema. | Hidden/none / Surface reviews | **0.07** |
| **Client logos / case studies** | OEM/awards/financing-partner logos. | None / Add credibility marks | **0.03** |
| **GA4 install** | gtag/GA4 present & firing. | Missing / Install GA4 | **0.06** |
| **GTM config** | Container present, not empty. | No GTM / Add + configure | **0.04** |
| **Conversion tracking** | Form-submit / call / chat events configured. | No goals / Define key events | **0.05** |

> **Trade-In add-on (section ≈22% on that page):** *valuation tool present & functional*, lead capture, KBB/partner trust signal — w≈0.15.
> **Finance/VDP add-on:** *payment calculator present & working*; *price transparency* — w≈0.10.
> **Service add-on:** *appointment scheduler present & functional*; *service specials/coupons visible* — w≈0.12.

---

### 2.7 AEO — Answer Engine Optimization

**Goal:** be quotable/citable by AI answer engines (Gemini, ChatGPT, Perplexity, Google AI Overviews). **Correct calculation:** score per-engine where access rules differ (bot access), then average; keep *page speed* and *brand/entity overlaps* **informational** (Technical and a single entity check own the weighted versions — no double counting).

| Parameter | What / Score | Low → / Fix | w |
|---|---|---|---|
| **Schema markup** (type per page: Vehicle/Offer on VDP, ItemList on SRP, FAQ/HowTo/Article/LocalBusiness/AutoDealer elsewhere) | Right type present + valid + complete required props. Score by type-match + validity + completeness. | Missing/invalid/wrong type / Add page-appropriate JSON-LD, pass Rich Results Test | **0.22** |
| **Answer-first structure** | Direct answer in first ~40–60 words / lead paragraph; TL;DR. | Buried answer / Lead with the answer | **0.16** |
| **Bot access** (per engine) | robots.txt + meta + X-Robots allow GPTBot/Google-Extended/PerplexityBot etc.; not blocked. Score per engine, then avg. | UA-blocked / Allow reputable AI crawlers (policy choice) | **0.12** |
| **Structured content** | Tables/lists/spec grids that machines parse (vehicle specs, comparison tables). | Spec-as-image / Real tables/`<dl>` | **0.10** |
| **FAQ / Q&A blocks + FAQPage schema** | Question-headed sections with concise answers. | No Q&A / Add FAQ + schema | **0.08** |
| **Citations / attribution / outbound authority** | Links to authoritative sources; cite data. | No sourcing / Cite OEM, NHTSA, etc. | **0.06** |
| **Entity recognition** | Org schema + Knowledge Graph presence (`sameAs`, consistent name). *(Single weighted entity check.)* | No entity links / `sameAs` to GBP, socials, Wikidata | **0.08** |
| **Citation / NAP consistency** | Name/address/phone identical on-page & vs GBP. | NAP mismatch / Standardize NAP | **0.06** |
| **Topical authority** | Depth + clustering around dealership topics (models, financing, service). | Thin coverage / Build topic clusters, link them | **0.06** |
| **Index coverage** (GSC URL Inspection — site-wide) | Are key pages actually indexed? | Not indexed / Fix crawl/index issues | **0.04** |
| **llms.txt** (site-wide) | `/llms.txt` present & well-formed (emerging convention). | Absent / Add llms.txt | **0.02** |
| **Brand entity strength** | Brand authority meter. **Informational (w 0)** — overlaps Entity Recognition. | — | — |
| **Experience / Expertise / Authority (E-E-A-T)** | On About/Blog/Service: author bios, credentials, reviews, mentions. **Informational on most pages; weighted on Info/Blog (w≈0.10) and About.** | Anonymous content / Author bylines + credentials | ctx |
| **Page speed signal** | **Informational (w 0)** — owned by Technical (§2.1). | — | — |

> **Per-page note:** on **Info/Blog/About**, AEO is the dealership's citation engine — raise E-E-A-T to weighted and section weight to ~12% (§0.4).

---

### 2.8 AIO — AI Input / Ingestion Optimization

**Goal:** make the page maximally *machine-ingestible* (clean structure an LLM/crawler can parse without rendering). Overlaps AEO but focuses on **input hygiene** rather than answerability.

| Parameter | What / Score | Low → / Fix | w |
|---|---|---|---|
| **Structured data validity** | JSON-LD present, parses, no errors/warnings, matches visible content. | Invalid/incomplete JSON-LD / Validate, fill required props | **0.20** |
| **NLP-friendly content** | Semantic HTML, hierarchical headings, real paragraphs/lists, content in HTML not images/JS-only. | Content needs JS render / Server-render key content, semantic tags | **0.16** |
| **Answer-oriented structure** | Question-style headings each followed by a self-contained answer. | Narrative-only / Add Q-headings + answers | **0.12** |
| **Duplicate-content readiness** | Canonical + noindex used correctly so AI ingests one canonical version. | Dup VDPs no canonical / Canonicalize, noindex thin | **0.12** |
| **Keyword/entity annotation** | Entities surfaced in headings, alt text, meta; consistent naming. | Ambiguous entities / Name make/model/trim explicitly | **0.10** |
| **Content freshness markers** | `dateModified` schema, visible "updated" date, `Last-Modified` header. | No dates / Stamp publish/updated dates | **0.10** |
| **AI-friendly internal linking** | Descriptive anchors, crawlable `<a href>` (not JS onclick), shallow path to inventory. | JS-only nav / Real anchors, link to related vehicles | **0.10** |
| **Topical focus clarity** | One clear topic per page; Title/H1/URL aligned. | Mixed topics / One page = one topic | **0.10** |

> **VDP/SRP note:** AIO leans on *structured data validity* (Vehicle/ItemList) and *duplicate-content readiness* (the OEM-copy problem). On Blog, *freshness* and *answer-oriented structure* matter most.

---

## 3. Common scoring mistakes this methodology corrects

1. **Scoring N/A parameters as 0** → renormalize the denominator (§0.3). Biggest source of false-low scores.
2. **Binary pass/fail on continuous metrics** → use the graded curves in §2.1/§2.2.
3. **Equal-weighting every check** → severity/impact weights (esp. Accessibility §2.3, Conversion §2.6).
4. **Averaging lab + field CWV** → prefer field p75; lab only as flagged fallback (§0.2).
5. **Presence ≠ quality** → a 10-char meta description or duplicate OEM VDP copy must score low even though the element "exists."
6. **Double-counting** → page speed and brand entity stay informational in AEO; Technical and one entity check own them.
7. **Flat section weights across page types** → tilt per page (§0.4): Finance→Security, Trade-In→Conversion, Blog→SEO/AEO.
8. **Claiming full accessibility from automated checks** → cap and label "automated AA coverage (~40% of WCAG)."
9. **Indexing every filtered SRP / 404-ing sold VDPs** → canonical/noindex strategy + 301s (§2.1 VDP add-on, §2.2 SRP add-on).

---

## 4. Page × Section applicability summary

✓ = scored · ◐ = scored, special weight/add-on · — = excluded (renormalize)

| Section | Home | SRP | VDP | Offers | Trade-In | Finance | Service | Info/Blog |
|---|---|---|---|---|---|---|---|---|
| Technical | ✓ | ◐ pagination | ◐ sold-301 | ✓ | ✓ | ✓ | ✓ | ✓ |
| On-Page SEO | ✓ | ◐ facet/index | ◐ unique copy | ✓ | ✓ | ✓ | ✓ | ◐ depth |
| Accessibility | ✓ | ✓ | ✓ | ✓ | ◐ form-crit | ◐ form-crit | ✓ | ✓ |
| Security & Compliance | ✓ | ✓ | ✓ | ◐ disclaimers | ◐ PII | ◐ PII+Reg-Z | ✓ | ✓ |
| UX & Content | ✓ | ◐ facets | ◐ gallery | ✓ | ✓ | ✓ | ✓ | ✓ |
| Conversion Flow | ✓ multi-CTA | ✓ | ◐ calc/price | ◐ claim | ◐ valuation | ◐ calc | ◐ scheduler | ◐ light |
| AEO | ✓ AutoDealer | ✓ ItemList | ◐ Vehicle/Offer | ◐ Offer/expiry | ✓ | ◐ FAQ | ◐ Service/Local | ◐ E-E-A-T/FAQ/HowTo |
| AIO | ✓ Org | ✓ list | ◐ Vehicle valid | ✓ | ✓ | ✓ | ✓ | ◐ freshness |

---

*Next step (when you're ready to build): encode (1) the page-type detector, (2) this parameter registry with `appliesTo[pageType]` flags + per-page weights, (3) the renormalizing roll-up in §0.3. No code has been changed by this document.*
