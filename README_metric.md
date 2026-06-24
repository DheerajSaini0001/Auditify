# Auditify — Scoring Metric Reference

> **Source of truth:** This document is reverse-engineered **purely from the code** (Backend `metricServices/*`, `workers/singleAuditWorker.js`, `controllers/singleAuditController.js`, and `Frontend/src/Pages/AuditSummaryPage.jsx`). No specification or `.md` file was consulted. Where the code and any spec disagree, **the code wins** — this describes what actually runs.

## 0. How a score is built (three levels)

```
parameter score (0–100)
        │  weighted, with N/A renormalization
        ▼
SECTION score  (each section's `Percentage`, 0–100)   ← computed in metricServices/*.js
        │  simple average of the 8 sections ÷ 8
        ▼
PAGE score     (one audited URL's overall `score`)    ← OverAll() in singleAuditWorker.js
        │  simple average of the per-page scores
        ▼
SITE score     (whole-site rollup)                    ← AuditSummaryPage.jsx
```

A single audit run scores **one URL** (= one "page"). The 8 sections are scored independently, averaged equally to the **page** score. The frontend audits a *batch* of discovered pages (home, SRP, VDP, service, …) and averages their page scores into the **site** score.

---

## 1. Formula for each SECTION score

Every section returns a `Percentage` (0–100). All eight use the same shape — a **weighted average with N/A renormalization** (parameters that are not applicable to the page are dropped from *both* numerator and denominator) — but each has section-specific caps/gates.

General form:

```
Percentage = Σ(scoreᵢ × weightᵢ) / Σ(weightᵢ)        over applicable parameters only
```

| Section | File | Exact formula & section-specific rules |
|---|---|---|
| **Technical Performance** | `technicalMetrics.js` | `Σ(score×w)/Σw` over `present` components. Weights are raw points (Σ = **103**; AI Agentic Browsing/WebMCP relocated to AIO per spec §5.1). CrUX field value used per metric when available else lab (each CWV weighted **once**). No N/A renorm by page type. Section confidence = `"field"` only if LCP+CLS+INP all came from CrUX, else `"lab"`. |
| **On-Page SEO** | `seoMetrics.js` | `parseFloat((Σ(score×w)/Σw).toFixed(0))`, skipping params with `meta.present === false`. Decimal weights (common Σ = **1.00**); VDP/SRP add-ons increase Σ and renormalize everything down. Confidence always `"heuristic"`. |
| **Accessibility** | `accessibilityMetrics.js` | `earned = Σ(score/100 × w)`, `pct = earned/Σw × 100`. Then **fail caps**: any Critical-tier `fail` → `pct = min(pct, 70)`; any Serious-tier `fail` → `min(pct, 85)`. Hard **coverage cap** `pct = min(pct, 96)` (never claims 100%). `score === null` params drop from Σw. Confidence `"heuristic"`. |
| **Security/Compliance** | `securityCompliance.js` | `pct = earned/Σw × 100`. Then **hard gates**: no-HTTPS → `min(pct, 30)`; reputation `fail` → `min(pct, 25)`. N/A / `infoOnly` params drop from Σw. Section confidence = lowest rank across applicable metrics (`heuristic`=1, `measured`=2, `field`=3). |
| **UX & Content Structure** | `uxContentStructure.js` | `round(Σ(clamp(score,0,100)×w)/Σw)`. `infoOnly` / undefined-score params excluded. Decimal weights. Confidence `"heuristic"`. |
| **Conversion & Lead Flow** | `conversionLeadFlow.js` | `parseFloat(((earned/Σw)×100).toFixed(0))`. Page-type gating sets non-applicable params to `null` (dropped); self-flagged `infoOnly`/`meta.notApplicable` also dropped. Decimal weights (Σ ≈ 1.00 across applicable). Confidence `"heuristic"`. |
| **AIO Readiness** | `aioReadiness.js` | `round(Σ(score×w)/Σw)` over 8 weighted params with `present !== false` (Duplicate_Content_Detection_Ready demoted to info-only per Bucket-3; AI Agentic Browsing/WebMCP relocated in from Technical per spec §5.1, weight 0.06). Decimal weights **Σ = 0.94** (renormalized). **No page-type gating.** Confidence `"heuristic"`. |
| **AEO** | `aeoService.js` + `aeoWeights.js` | Headline `Percentage = round(Σ(score×w)/Σw)` over **applicable** params (page-type gating drops `faqQa`/`eeat`/`sameAs` off their page types). Decimal weights. *Additionally* computes 3 independent **per-platform gauges** (Gemini/ChatGPT/Perplexity) from `aeoWeights.js` (each platform's weights sum to 100); bot-blocked platforms forced to 0. Confidence `"heuristic"`. |

---

## 2. Formula for each PAGE score

`workers/singleAuditWorker.js → OverAll(pcts, pageType)`, backed by `utils/sectionWeights.js` (spec §5.4 + §5.6):

```js
pageScore = Σ( sectionᵢ × w_section(pageType)ᵢ ) / Σ( w_section(pageType)ᵢ )
```

Where `pcts` are the eight section `Percentage` values, in order:

`A` Technical · `B` On-Page SEO · `C` Accessibility · `D` Security · `E` UX · `F` Conversion · `G` AIO · `H` AEO.

- **Sections are weighted by the audited page's type** (see §8). The page type is derived from the **post-redirect URL** via `classifyPageType()`; an unknown URL falls back to the `generic` base weights `[18,17,10,12,13,15,8,7]`.
- Weights are **renormalized over the applicable sections** — a section with no score (N/A) drops from the denominator.
- In a **full audit** all 8 sections are present; a missing/errored section is coerced to 0 (still counted) so the denominator is the full page-type column (sum 100).
- A **subset audit** (user picks 2–7 sections) scores only the selected sections, renormalized by the page-type tilt: `computePageScoreFromMap(selected, pageType)`.
- A **single-section** audit reduces to that section's own `Percentage` (one section renormalizes to weight 1).
- **Section-extract from a cached full audit** (`singleAuditController.js`) uses the same `computePageScoreFromMap(extracted, classifyPageType(url))`.

Grade bands (used at every level):

```
≥90 A+ · ≥80 A · ≥70 B · ≥60 C · ≥50 D · else F
```

---

## 3. Formula for each SITE score

`Frontend/src/Pages/AuditSummaryPage.jsx`:

```js
scores  = pages.map(p => report[p.id].score).filter(isNumber)   // per-page overall scores
siteScore = Math.round( scores.reduce((a,b)=>a+b,0) / scores.length )
siteGrade = gradeFor(siteScore)
```

- The site score is the **plain mean of the per-page overall scores** that loaded successfully (pages whose report failed/has no numeric `score` are excluded).
- Pages come from the discovery batch (`discoverDealerPages`): home, SRP, VDP, service, finance, etc. Each is a normal single-URL audit.
- **No section-level or page-type weighting** is applied at the site level — every successfully-audited page counts equally.

---

## 4. Duplicate parameters (same concept, scored in more than one section)

Two kinds exist. **(A) Actively double-counted** — weighted in *both* sections. **(B) Deliberately de-duplicated** — computed in one section but set to weight-0 / hidden in another to avoid double counting.

### A. Actively double-counted (the same underlying signal contributes to ≥2 section scores)

| Underlying signal | Sections that each weight it | Notes |
|---|---|---|
| **Meta viewport tag** | On-Page SEO `Viewport` (0.03) **and** Accessibility `Meta_Viewport` (w 2) | Same `<meta name=viewport>` graded twice. |
| **Image alt text** | On-Page SEO `Image` (0.08, incl. alt) · Accessibility `Image_Alt` (w 2) · AIO `Keywords_Entities_Annotated` (0.10, uses alt) | Alt coverage influences 3 sections. |
| **Heading hierarchy / order** | On-Page SEO `Heading_Hierarchy` (0.04) · Accessibility `Heading_Order` (w 1) | **Tag-order correctness (H1-count, level-skips) is now owned only here.** UX `Hierarchy_Flow_Clarity` and AIO `Content_NLP_Friendly` measure distinct facets (scannability / heading *presence*), not tag order — see Bucket-3 fix below. |
| **Page/Document title** | On-Page SEO `Title` (0.07) · Accessibility `Document_Title` (w 2) | Both weighted. |
| **Robots / bot crawl access** | On-Page SEO `Robots_Txt` (0.08) · AEO `botAccess` (0.11) · AIO `Duplicate…Ready`/index (canonical/noindex) | Robots & indexability across sections. |
| **Canonical / duplicate-content control** | On-Page SEO `Canonical` (0.11) · AIO `Duplicate_Content_Detection_Ready` (0.12) · AEO `indexCoverage` (0.04) | Canonical/noindex reused. |
| **Internal linking** | On-Page SEO `Contextual_Linking` (0.04) + `Links` (0.03) · AIO `Internal_Linking_AI_Friendly` (0.10) | Link graph scored in 2 sections. |
| **Forms over HTTPS / PII forms** | Security `Forms_Use_HTTPS` (4) · Conversion form-quality params · Accessibility `Label` (PII-form escalation) | Same forms inspected by 3 sections. |
| **Mobile experience** | Technical (mobile lab device choice) · UX `Mobile_Experience` (0.09, absorbs Mobile_Usability) | Mobile signal split across 2. |

### B. Deliberately de-duplicated (computed once, hidden/zero-weighted elsewhere)

| Signal | Weighted in | Hidden / weight-0 in | Mechanism |
|---|---|---|---|
| **Canonical / duplicate-content** | On-Page SEO `Canonical` (0.11) | AIO `Duplicate_Content_Detection_Ready` (now **`infoOnly`, weight 0**) | **Bucket-3 fix:** AIO scored 100 for mere canonical presence — fully redundant with On-Page `Canonical`, which grades self-ref, param-variant canonicalization, noindex-conflict and pagination. Demoted to info-only (single-page audits can't observe cross-variant dedup, the only distinct facet). |
| **Structured data / Schema** | AIO `Structured_Data` (0.20), AEO `schema` (0.20) | On-Page SEO `Structured_Data` (computed but **not** weighted) | SEO keeps it only to feed Title-Location & Local-SEO checks. |
| **Content freshness / dateModified** | AIO `Content_Updated_Regularly` (0.10) | On-Page SEO `Content_Freshness` (computed, hidden) | SEO comment: "double-counts AIO freshness". |
| **Structured content (chunking/lists/tables)** | AEO `structuredContent` (0.09) | AIO `Structured_Content` (merge, `infoOnly`, weight 0) | AIO merges chunking+lists but leaves it info-only. |
| **Certifications & Awards** | Conversion `Certifications_Awards` (0.01) | UX (dead code, removed); AEO Expertise (info-only) | Relocated UX → Conversion. |
| **Pricing transparency** | Conversion `Pricing_Transparency` (0.06) | UX (dead code, removed) | Relocated UX → Conversion. |
| **Vehicle history** | Conversion `Vehicle_History` (0.04) | UX (dead code, removed) | Relocated UX → Conversion. |
| **Staff / team profiles** | — (info-only) | UX (dead code, removed); AEO Expertise signal (info-only) | Folded into AEO E-E-A-T (info). |
| **E-E-A-T (experience/expertise/authority)** | AEO `eeat` composite (0.10, editorial pages) | On-Page SEO `EEAT` (removed); the 3 raw signals are info-only | 3 signals averaged into one composite. |
| **FID (First Input Delay)** | — | Technical (deprecated, folded into `INP·TBT` slot 20) | Field-beats-lab, weighted once. |
| **Lighthouse Performance score** | — | Technical `PageSpeed_Score` (`informational:true`) | Aggregate of already-scored CWV. |

---

## 5. Zero-weight parameters (displayed / computed but contribute 0 to the score)

| Section | Zero-weight / info-only parameters |
|---|---|
| **Technical** | `PageSpeed_Score` (Lighthouse perf, `informational:true`). Plus deprecated/diagnostic functions never called: FID (lab & field), Mobile Load Speed, Mobile Usability, Inventory/Service Load Time, Rendering Performance, Lazy Loading, Third-Party Script Optimization, JS Execution Efficiency. |
| **On-Page SEO** | `Sitemap` (returned, weight 0). Computed-but-hidden: `Structured_Data`, `Content_Freshness`, `Video`. Not computed here: `Service_Content_Quality`, `Content_Depth_Quality`, `EEAT`, `Local_SEO`. |
| **Accessibility** | `WCAG_AA_Compliance`, `Text_Spacing`, `Focus_Not_Obscured`, `Reduced_Motion` (all `infoOnly:true`). Keyboard sub-checks (`Focus_Order`, `Focusable_Content`, `Tab_Index`, `Aria_Hidden_Focus`) — display-only, weighted **once** via the `Keyboard_Navigation` composite. |
| **Security** | When N/A: `SSL_Expiry` (HTTP page), `MFA_Enabled` (no auth surface), `Cookie_Consent` (no tracking), `Finance_Form_Security`, `Legal_Disclaimers`, `Reputation` (no API keys). CRM relocated out of this section. |
| **UX** | `Pricing_Transparency`, `Vehicle_History`, `Staff_Profiles`, `Certifications_Awards` — dead code, **not** computed/returned (moved to Conversion). Page-specific params become `infoOnly` off their page type (see §7). |
| **Conversion** | `Link_Relevance` (folded into CTA), `Progress_Indicators` (dup of MultiStep). `Pricing_Transparency` & `Vehicle_History` self-flag `infoOnly`/`notApplicable` when irrelevant. |
| **AIO** | `Duplicate_Content_Detection_Ready` (`infoOnly` — Bucket-3 de-dup), `Structured_Content` (`infoOnly`), `Terminology_Consistency` (`infoOnly`). Computed but not in weights map: `Author_Source_Attribution`, `Fact_vs_Opinion_Separation`, `Content_Completeness`. |
| **AEO** | `Brand_Entity_Strength`, `Markdown_Structure`, `Page_Speed` — all `weight 0, infoOnly:true` in the headline. (Page-Speed & Markdown *are* weighted inside the per-platform gauges, not the headline.) |

---

## 6. Weightage of all COMMON parameters (scored on every page type)

> "Common" = applicable regardless of page type. Weights are quoted **verbatim from code**. Different sections use different weight scales (raw points vs decimals); the **% column** normalizes each weight against its own section's common-weight total so they are comparable within a section.

### Technical Performance (raw points, common Σ = 103)
| Parameter | Weight | % of section |
|---|---|---|
| LCP | 22 | 21.4% |
| INP·TBT | 20 | 19.4% |
| CLS | 18 | 17.5% |
| FCP | 8 | 7.8% |
| TTFB | 8 | 7.8% |
| SI (Speed Index) | 6 | 5.8% |
| Render-Blocking Resources | 5 | 4.9% |
| Resource Optimization | 5 | 4.9% |
| Compression | 4 | 3.9% |
| Caching | 4 | 3.9% |
| Redirect Chains | 3 | 2.9% |

*(AI Agentic Browsing / WebMCP — formerly weight 6 here — now lives in AIO per spec Part 3 + §5.1.)*

### On-Page SEO (decimal, common Σ = 1.00)
| Parameter | Weight | Parameter | Weight |
|---|---|---|---|
| Canonical | 0.11 | Heading_Hierarchy | 0.04 |
| Robots_Txt | 0.08 | Contextual_Linking | 0.04 |
| Image | 0.08 | Title_Uniqueness | 0.03 |
| Title | 0.07 | Meta_Description_Uniqueness | 0.03 |
| H1 | 0.07 | URL_Slugs | 0.03 |
| Meta_Description | 0.06 | Title_Keyword_Optimization | 0.03 |
| Content_Relevance | 0.06 | Links | 0.03 |
| URL_Structure | 0.05 | Viewport | 0.03 |
| Semantic_Tags | 0.05 | Open_Graph | 0.03 |
| | | Title_Location_Optimization | 0.02 |
| | | Twitter_Card | 0.02 |
| | | Social_Links | 0.01 |

### Accessibility (tier points, common Σ = 35)
| Parameter | Weight (tier) | Parameter | Weight (tier) |
|---|---|---|---|
| Color_Contrast | 3 (Critical) | Aria_Allowed_Attr | 2 (Serious) |
| Label | 3 (Critical) | Document_Title | 2 (Serious) |
| Html_Has_Lang | 3 (Critical) | Meta_Viewport | 2 (Serious) |
| Keyboard_Navigation | 3 (Critical) | Target_Size | 2 (Serious) |
| Image_Alt | 2 (Serious) | Reflow | 2 (Serious) |
| Link_Name | 2 (Serious) | Heading_Order | 1 (Moderate) |
| Button_Name | 2 (Serious) | Landmarks | 1 (Moderate) |
| Aria_Roles | 2 (Serious) | Skip_Links | 1 (Moderate) |
| | | Interactive_Element_Affordance | 1 (Moderate) |
| | | List | 1 (Moderate, N/A if no lists) |

### Security/Compliance (raw points, common Σ = 92; +18 when finance pages present)
| Parameter | Weight | Parameter | Weight |
|---|---|---|---|
| HTTPS | 13 *(gate ≤30)* | SQLi_Exposure | 4 |
| CSP | 9 | XSS | 4 |
| Reputation | 9 *(gate ≤25)* | Forms_Use_HTTPS | 4 |
| SSL | 7 | Privacy_Compliance | 4 |
| TLS_Version | 5 | Cookie_Consent | 3 |
| HSTS | 5 | Privacy_Policy | 3 |
| Cookie_Flags | 5 | X_Content_Type_Options | 3 |
| SSL_Expiry | 4 | Third_Party_Cookies | 2 |
| X_Frame_Options | 4 | Weak_Default_Credentials | 2 |
| | | Admin_Panel_Public | 1 |
| | | MFA_Enabled | 1 |

### UX & Content Structure (decimal, common Σ = 1.13)
| Parameter | Weight | Parameter | Weight |
|---|---|---|---|
| Intrusive_Interstitials | 0.11 | Loading_Feedback | 0.05 |
| Navigation_Discoverability | 0.11 | Content_Density_Balance | 0.05 |
| Broken_Links | 0.11 | Layout_Consistency | 0.05 |
| Text_Readability | 0.10 | Sticky_Header_Usage | 0.05 |
| Above_the_Fold_Content | 0.09 | Interactive_Click_Feedback | 0.06 |
| Mobile_Experience | 0.09 | | |
| Hierarchy_Flow_Clarity | 0.07 | | |

### Conversion & Lead Flow (decimal — common/site-wide subset)
| Parameter | Weight | Parameter | Weight |
|---|---|---|---|
| CTA_Presence | 0.07 | Click_To_Call | 0.04 |
| CTA_Flow_Alignment | 0.06 | Conversion_Tracking | 0.04 |
| CTA_Clarity | 0.05 | Chat_Experience | 0.03 |
| CTA_Crowding | 0.05 | GTM_Configuration | 0.03 |
| GA4_Installed | 0.05 | Reviews | 0.03 |
| Testimonials | 0.04 | Lead_Magnets | 0.02 |
| | | CRM_Integration | 0.02 |
| | | Client_Logos | 0.01 |
| | | Case_Studies_Accessibility | 0.01 |
| | | Certifications_Awards | 0.01 |

### AIO Readiness (decimal, Σ = 0.94 → renormalized; **all common, no gating**)
| Parameter | Weight | Parameter | Weight |
|---|---|---|---|
| Structured_Data | 0.20 | Internal_Linking_AI_Friendly | 0.10 |
| Content_NLP_Friendly | 0.16 | Topical_Focus_Clarity | 0.10 |
| Answer_Oriented_Structure | 0.12 | AI_Agentic_Browsing (WebMCP) | 0.06 |
| Keywords_Entities_Annotated | 0.10 | | |
| Content_Updated_Regularly | 0.10 | | |

*(`Duplicate_Content_Detection_Ready` was 0.12 — now `infoOnly`/weight 0 per Bucket-3. `AI_Agentic_Browsing` relocated in from Technical per spec §5.1. The 8 weights sum to 0.94 and renormalize via `Σ(score×w)/Σw`.)*

### AEO — headline (decimal) common params
| Parameter | Weight | Parameter | Weight |
|---|---|---|---|
| schema | 0.20 | citationConsistency | 0.06 |
| answerFirst | 0.15 | citations | 0.05 |
| botAccess | 0.11 | topicalAuthority | 0.05 |
| structuredContent | 0.09 | indexCoverage | 0.04 |
| entityRecognition | 0.07 | llmsTxt | 0.02 |

---

## 7. Weightage of all PAGE-SPECIFIC parameters (only active on certain page types)

> These carry a weight only when the audited URL matches the page type; otherwise they are `infoOnly`/`null` and **drop from the section denominator** (N/A renormalization), so the remaining params rescale to 100%.

| Section | Parameter | Weight | Active on page type(s) | Off-type behavior |
|---|---|---|---|---|
| On-Page SEO | `VDP_Content_Uniqueness` | 0.12 | VDP | `present:false`, dropped |
| On-Page SEO | `SRP_Index_Control` | 0.08 | SRP | dropped |
| On-Page SEO | `SRP_To_VDP_Links` | 0.06 | SRP | dropped |
| UX | `Inventory_Filtering` | 0.10 | SRP | `infoOnly` on home/other |
| UX | `Vehicle_Image_Gallery` | 0.10 | VDP | `infoOnly`, dropped |
| UX | `No_Results_UX` | 0.06 | SRP | `infoOnly` off-SRP |
| UX | `Breadcrumbs` | 0.05 | SRP / VDP / Service / Blog (not home) | `infoOnly` on home |
| UX | `In_Page_Navigation` | 0.04 | long pages (VDP/Blog/long) | `infoOnly` on short pages |
| Conversion | `TradeIn_Flow` | 0.15 | tradein | `null`, dropped |
| Conversion | `Appointment_Booking` | 0.12 | service | dropped |
| Conversion | `Financing_Flow` | 0.10 | finance | dropped |
| Conversion | `Finance_Calculator` | 0.10 | finance, VDP | dropped |
| Conversion | `Form_Presence` | 0.09 | contact/finance/tradein/service (`isFormPage`) | dropped |
| Conversion | `Pricing_Transparency` | 0.06 | VDP/offers/lease/finance | `infoOnly` if no pricing |
| Conversion | `Incentives_Displayed` | 0.06 | service, offers | dropped |
| Conversion | `Trust_Badges` | 0.05 | form pages (near PII) | dropped |
| Conversion | `Vehicle_History` | 0.04 | VDP | `infoOnly` off-VDP |
| Conversion | `Inline_Validation` | 0.05 | pages with forms (`hasForms`) | dropped |
| Conversion | `Form_Length` | 0.04 | `hasForms` | dropped |
| Conversion | `Required_vs_Optional_Fields` | 0.04 | `hasForms` | dropped |
| Conversion | `Thank_You_Pages` | 0.03 | `hasForms` | dropped |
| Conversion | `Submit_Button_Clarity` | 0.025 | `hasForms` | dropped |
| Conversion | `Friendly_Error_Handling` | 0.02 | `hasForms` | dropped |
| Conversion | `Microcopy_Clarity` | 0.02 | `hasForms` | dropped |
| Conversion | `MultiStep_Form_Progress` | 0.015 | `hasForms` | dropped |
| AEO | `eeat` (E-E-A-T composite) | 0.10 | about / blog / service | `applicable:false`, dropped |
| AEO | `faqQa` (FAQ/Q&A blocks) | 0.07 | faq / finance / service / vdp | dropped |
| AEO | `sameAs` (sameAs validation) | 0.04 | home / about / contact | dropped |

*Technical, Accessibility, Security and AIO have **no** page-type-gated weighted parameters* (Security's `Finance_Form_Security` 10 and `Legal_Disclaimers` 8 are content-discovered, not URL-page-type gated, and drop to N/A when no such page/section is found).

---

## 8. Weightage of each SECTION per page

Section weights are **tilted by page type** (`utils/sectionWeights.js`, spec §5.6). Each row sums to 100; the page score is the weighted average of the 8 section scores using the audited page type's row, renormalized over applicable sections.

### 8a. Section weight per page type (overall page score)
| Page type | Tech | SEO | A11y | Security | UX | Conversion | AIO | AEO |
|---|---|---|---|---|---|---|---|---|
| Home | 18 | 18 | 10 | 12 | 12 | 14 | 8 | 8 |
| SRP (inventory) | 20 | 20 | 9 | 8 | 13 | 14 | 8 | 8 |
| VDP (vehicle) | 18 | 18 | 9 | 8 | 13 | 18 | 7 | 9 |
| Offers | 15 | 16 | 9 | 13 | 12 | 17 | 6 | 12 |
| Lease | 15 | 16 | 9 | 14 | 12 | 16 | 6 | 12 |
| Trade-In | 14 | 12 | 11 | 16 | 13 | 22 | 6 | 6 |
| Finance | 14 | 12 | 11 | **22** | 11 | 18 | 6 | 6 |
| Service | 16 | 16 | 10 | 10 | 13 | 19 | 8 | 8 |
| About / Contact | 14 | 16 | 11 | 10 | 15 | 12 | 10 | 12 |
| Blog / FAQ | 14 | 22 | 11 | 9 | 15 | 7 | 10 | 12 |
| *generic (fallback)* | 18 | 17 | 10 | 12 | 13 | 15 | 8 | 7 |

> Finance tilts hard to Security (PII/Reg-Z); Trade-In to Conversion; Blog/FAQ to On-Page+AEO; SRP raises Technical+On-Page. A **subset audit** renormalizes these weights over only the selected sections; a **single-section** audit yields that section's score directly.

> **Not yet implemented (spec §5.5):** the *site* score is still a plain mean of per-page scores (`AuditSummaryPage.jsx`); the spec's `page_importance × type_count` weighting is a separate follow-up.

### 8b. Which sections actually *change* per page type (parameter activation, not section weight)
| Page type | Sections whose internal parameter set changes (extra weighted params activate) |
|---|---|
| Home | UX drops `Breadcrumbs`; Conversion uses only common subset; AEO adds `sameAs` |
| About | AEO adds `eeat` + `sameAs` |
| Contact | Conversion adds `Form_Presence`/`Trust_Badges`/form-quality; AEO adds `sameAs` |
| SRP | SEO adds `SRP_Index_Control` + `SRP_To_VDP_Links`; UX adds `Inventory_Filtering` + `No_Results_UX` + `Breadcrumbs` |
| VDP | SEO adds `VDP_Content_Uniqueness`; UX adds `Vehicle_Image_Gallery` + `Breadcrumbs`; Conversion adds `Pricing_Transparency` + `Vehicle_History` + `Finance_Calculator`; AEO adds `faqQa` |
| Service | Conversion adds `Appointment_Booking` + `Incentives_Displayed` + forms; AEO adds `eeat` + `faqQa`; UX adds `Breadcrumbs` |
| Finance / Lease | Conversion adds `Financing_Flow` + `Finance_Calculator` + `Pricing_Transparency` + forms; AEO adds `faqQa`; Security may add `Finance_Form_Security` + `Legal_Disclaimers` |
| Offers | Conversion adds `Pricing_Transparency` + `Incentives_Displayed`; Security may add `Legal_Disclaimers` |
| Blog | UX adds `Breadcrumbs` + `In_Page_Navigation`; AEO adds `eeat` |
| FAQ | AEO adds `faqQa` |
| Tradein | Conversion adds `TradeIn_Flow` + forms + `Trust_Badges` |

---

### Appendix — section ↔ output field ↔ file map
| Section (display) | Worker var | Report field | Service file |
|---|---|---|---|
| Technical Performance | A | `technicalPerformance` | `technicalMetrics.js` |
| On-Page SEO | B | `onPageSEO` | `seoMetrics.js` |
| Accessibility | C | `accessibility` | `accessibilityMetrics.js` |
| Security/Compliance | D | `securityOrCompliance` | `securityCompliance.js` |
| UX & Content Structure | E | `UXOrContentStructure` | `uxContentStructure.js` |
| Conversion & Lead Flow | F | `conversionAndLeadFlow` | `conversionLeadFlow.js` |
| AIO Readiness | G | `aioReadiness` | `aioReadiness.js` |
| AEO | H | `aeo` | `aeoService.js` + `aeoWeights.js` |
