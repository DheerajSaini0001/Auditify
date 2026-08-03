# Spec ↔ Code Reconciliation (authoritative)

> **Purpose.** A thorough, section-by-section reconciliation of the running code against `AUDIT_FRAMEWORK_SPECIFICATION.md` (the source of truth). For every divergence the rule is **spec wins**. This document records what was checked, what was fixed, what was *deliberately not changed* (and why), and the remaining backlog — so this audit does not have to be redone from scratch.
>
> **Method.** Compared at the spec-**parameter-group** level (the code intentionally decomposes some spec params into sub-cards that *sum* to the spec weight — e.g. spec "Meta title 15%" = `Title .07 + Title_Uniqueness .03 + Title_Keyword .03 + Title_Location .02`). A naive literal weight diff produces false positives; those are explicitly listed in §"Rejected false-positives".

## Verdict at a glance

| Section | Spec ref | Status | Notes |
|---|---|---|---|
| Technical Performance | §2.1 | ✅ compliant *(after fix)* | WebMCP relocated to AIO; weights match; CWV field-beats-lab, FID deprecated, Lighthouse info-only all correct. |
| On-Page SEO | §2.2 | ✅ compliant | All 13 spec params map exactly via sub-card decomposition; VDP/SRP add-ons correct; hidden params (Structured_Data/Freshness/Video) weight-0. |
| Accessibility | §2.3 | ✅ compliant | Tiers (Crit×3/Ser×2/Mod×1), fail caps (≤70/≤85), coverage cap ≤96, N/A renorm, keyboard composite-once all correct. 3 agent-flagged "issues" rejected (see below). |
| Security/Compliance | §2.4 | ✅ compliant | All weights match (Σ110 = spec ×100); HTTPS≤30 & reputation≤25 gates; cookie/reputation consolidations; GA4/GTM/CRM correctly relocated out. |
| UX & Content | §2.5 | ✅ compliant | All 17 weights match; page-type N/A gating correct; Hierarchy_Flow merge correct; Pricing/History/Staff/Certs relocated to Conversion. |
| Conversion & Lead Flow | §2.6 | ✅ compliant *(1 noted deviation)* | All 24 spec params map via decomposition; page-type gating + GA4/GTM/CRM relocation correct. `Financing_Flow` is an extra param (see backlog). |
| AIO Readiness | §2.7 + Part 3 | ✅ compliant *(after fix)* | WebMCP added (0.06); Duplicate_Content info-only (Bucket-3); removed params (Fast-Load/API/Dynamic/Feedback) absent. |
| AEO | §2.8 | ✅ compliant | All 13 headline weights match; E-E-A-T composite consolidation; Brand/PageSpeed/Markdown info-only; per-platform gauges separate. |
| Page-score roll-up | §5.4 + §5.6 | ✅ compliant *(after fix)* | Per-page-type section weights implemented (`sectionWeights.js`). |
| Site-score roll-up | §5.5 | ⚠️ **gap** | Still a plain mean of page scores; `page_importance × type_count` weighting not implemented (backlog). |

---

## Fixes applied (spec-prioritized)

### 1. AI Agentic Browsing (WebMCP) — relocated Technical → AIO  *(this pass)*
Spec Part 3 + §5.1 place the WebMCP arm in **AIO** (~6%), not Technical. The code had it weighted `6` in Technical.
- **`technicalMetrics.js`** — `evaluateAgenticBrowsing` now `export`ed; removed from Technical's weighted `components`, compute, and return. Technical weight sum 109 → **103**.
- **`aioReadiness.js`** — imports the evaluator, computes it, weights it **0.06** (`AI_Agentic_Browsing`). AIO weighted sum → **0.94** (renormalized). No circular import (Technical does not import AIO).
- **Frontend** — card removed from `Technical_Performance.jsx`; rendered in `AIO.jsx` (added to `foundationKeys` + `iconMap: Bot`); `InfoDetails.jsx` methodology tables moved the row Technical → AIO. Frontend build passes.

### 2. Duplicate_Content_Detection_Ready — demoted to info-only  *(prior pass, Bucket-3)*
On-Page `Canonical` already owns canonical scoring; the AIO check scored 100 for mere presence (double-count, spec §0.3 rule 4). Now `infoOnly` weight 0. The AIO agent confirmed this is consistent with §5.1 (which lists no separate AIO duplicate-content row).

### 3. UX Hierarchy_Flow_Clarity heading sub-score — de-duped  *(prior pass, Bucket-3)*
Was re-scoring H1-count / level-skip (owned by On-Page `Heading_Hierarchy` + A11y `Heading_Order`). Now measures heading **presence/scannability** (0/70/100).

### 4. Page score — per-page-type section weights  *(prior pass)*
`sectionWeights.js` implements spec §5.6 tilts (Finance→Security 22, Trade-In→Conversion 22, etc.), replacing the flat `/8`.

---

## Rejected false-positives (deliberately NOT changed — do not re-flag)

These were raised during comparison but contradict the spec or a documented decision. Recording them so they aren't "fixed" by mistake later.

| Flag | Why rejected |
|---|---|
| "Meta_Viewport weighted in both On-Page (0.03) and Accessibility (×2) — double count" | **Spec §4.1 explicitly sanctions this**: "Viewport meta — measure once; weight in On-Page (mobile-readiness) + Accessibility (zoom); remove from Security." Code is compliant (absent from Security). |
| "Target_Size / Reflow weighted ×2 — spec says exploratory, should be info-only" | Spec §2.3/§4.5 says to **ADD** these WCAG 2.2 criteria and calls Target Size "huge for mobile dealer CTAs". Weighting the two high-impact criteria (and keeping Text_Spacing/Focus_Not_Obscured/Reduced_Motion info-only) is a deliberate, spec-consistent choice. |
| "Aria_Allowed_Attr split from Aria_Roles inflates ARIA weight" | Spec §5.3 mandates **severity × instance** weighting (not equal-per-check); multiple distinct ARIA checks legitimately carry more weight. Defensible; left as-is. |
| "Conversion Incentives/Microcopy/Case_Studies not folded (spec §4.3)" | False reading: `Incentives_Displayed` **is** a spec param (§2.6, +0.06); `Microcopy` (.02) and `Case_Studies` (.01) are valid sum-preserving sub-cards of "Friendly error/microcopy 0.04" and "Client logos/case/certs 0.03". |

---

## Backlog — remaining spec items NOT yet in code

These are spec-acknowledged **additions** (§4.5 "missing parameters", §5.5), i.e. net-new features the spec itself marks "design spec, not yet wired" — not drift between two existing implementations. Each needs a product decision before building.

| Item | Spec ref | Why deferred | Effort |
|---|---|---|---|
| **Site-score `page_importance × type_count` weighting** | §5.5 | Site score is a plain mean of page scores (`AuditSummaryPage.jsx`). Needs per-page-type importance (Home 2.0, VDP 1.75, …) × sampled-count weighting. | Small (frontend aggregation) |
| **Sold-vehicle / soft-404 handling** (VDP/SRP, +5% VDP) | §2.1, §4.5 | Requires probing *removed* VDP URLs (301 vs hard-404 vs soft-404) — needs multi-URL fetch infra a single-page audit lacks. | Medium |
| **Hreflang / alternate** | §4.5 | Bilingual (EN/FR/ES) market signal; new detector. | Small |
| **GBP / local-pack (NAP vs Google Business Profile)** | §4.5 (AEO) | Needs Google Places API + billing. | Medium |
| **Review / AggregateRating schema** (AEO + Conversion) | §4.5 | New schema-type detector + weight slot. | Small |
| **Font / web-font optimization (`font-display`, preconnect)** | §4.5 (Technical) | New diagnostic; common CLS/LCP cause. | Small |
| **`Financing_Flow` (Conversion, 0.10 on finance)** — *deliberate deviation* | not in §2.6 | Extra param beyond spec (spec has only "Finance calculator +0.10 on Finance/VDP"). Kept by an explicit prior **user decision** (code comment + memory). On a finance page it stacks with `Finance_Calculator` → 0.20 finance-tooling weight vs spec's 0.10. **Decide: keep, or demote to info-only to match spec.** | Trivial (1-line) |

> The WCAG 2.2 additions (Target Size, Reflow, Text Spacing, Focus Not Obscured, Reduced Motion) and the new On-Page params (Open Graph, robots-meta intent, pagination/faceted index control, unique-VDP-description) from §4.5 are **already implemented** and compliant — they are *not* in this backlog.

---

## How to re-verify (for future passes)
1. Compare each section's `weights`/`components` object against the spec §2.x table **at the group level** (sub-cards summing to the spec weight = compliant).
2. Check the four structural rules per section: N/A renorm, page-type gating, gates/caps (Security/Accessibility), confidence flag.
3. Check the roll-up: page score uses `sectionWeights.js` §5.6 tilts; site score (§5.5) is the one known gap.
4. Cross-section duplicates: see `README_metric.md` §4 — sanctioned dual-weights vs de-duplicated info-only params.
