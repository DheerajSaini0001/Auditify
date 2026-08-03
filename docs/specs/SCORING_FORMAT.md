# Scoring Format — Before & After

**Date:** 6 July 2026
**Trigger:** Manager demo — our Accessibility score showed **85** while [AccessibilityChecker.org](https://www.accessibilitychecker.org/) showed **18** for the same site. Both tools use the same scanning engine (axe-core), so the violations found were the same — the difference was entirely in how a score is *calculated* from those violations. This document records the scoring format before that discussion and the format adopted at the end of it.

---

## 1. Shared building blocks (unchanged)

These apply in both the old and new formats:

- Every section is made of **parameters** (e.g. Color Contrast, Image Alt, Keyboard Navigation). Each parameter produces a `score` (0–100), a `status` (`pass` / `warning` / `fail`), details, cause and recommendation.
- **N/A renormalization** (spec rule 6): a parameter with nothing to measure on the page (e.g. Form Labels on a page with no inputs) returns `notCalculated` and is dropped from the calculation instead of scoring 0.
- **Info-only parameters** (e.g. WCAG AA Compliance summary, Text Spacing, Focus Not Obscured, Reduced Motion) are displayed but carry **zero weight**.
- **Confidence flag**: automated DOM/accessibility-tree inference is always reported as `heuristic`. Automated checks cover only ~30–40% of WCAG 2.2 success criteria, so no score ever claims full conformance.

---

## 2. CURRENT format (before this discussion) — "Graded node-ratio" model

*This was Accessibility's model until now. The other 7 sections all use the same weighted-average skeleton (`Σ(score × weight) ÷ Σ(weights)` with N/A renormalization) but grade parameters differently — see Part 2 §8 for each section's actual model and its specific inflation sources.*

### Parameter score
```
parameter score = (passing elements ÷ total applicable elements) × 100
```
Example: 800 links on the page, 40 have no accessible name → Link Name scores **95**.

### Section headline
```
Percentage = Σ(parameter score × tier weight) ÷ Σ(tier weights)
```
Accessibility tier weights: **Critical ×3** (Color Contrast, Form Labels, HTML Lang, Keyboard Navigation), **Serious ×2** (Image Alt, Link/Button Name, ARIA, Document Title, Meta Viewport, Target Size, Reflow), **Moderate ×1** (Heading Order, Landmarks, List, Skip Links, Affordance).

### Caps
- Any Critical-tier `fail` → headline capped at **70**
- Any Serious-tier `fail` → capped at **85**
- Always capped at **96** (automated coverage is partial)

### Why it read 85 when external tools read 18
Node-ratio grading gives credit for every passing element. On a large page, thousands of passing nodes dilute every violation, so nearly all parameters float above 90 and only the caps pull the headline down. Industry checkers (Lighthouse, AccessibilityChecker.org) are **rule-binary**: a rule with *any* failing element counts as fully failed. Same data, 40–60 points apart — structurally, not accidentally.

**Strength of this model:** answers "how much of the page passes?" — good for tracking incremental fix progress.
**Weakness:** reads far higher than every mainstream checker, so it fails cross-check credibility.

---

## 3. NEW format (end of discussion) — "Severity-weighted deduction" model

*Adopted for the **Accessibility** section headline. Aligned with AccessibilityChecker.org / Lighthouse-style rule-binary scoring.*

### Formula
```
Percentage = max(0, round(90 − effective deductions))
```

**Base = 90, not 100.** The last 10 points are reserved for manual review that automated tools cannot perform — mirroring AccessibilityChecker.org, where 90 is the maximum for automated-only scans.

### Deductions — per failed axe RULE (not per element)
A rule with any failing element deducts in full; sibling passing elements earn no credit.

| Impact | Deduction | If widespread (>10 failing elements) |
|---|---|---|
| Critical | −12 | −18 (×1.5) |
| Serious | −6 | −9 (×1.5) |
| Moderate | −2.5 | −3.75 (×1.5) |
| Minor | −1 | −1.5 (×1.5) |

### Deductions — DOM probes axe cannot see
| Check | Tier | On `fail` | On `warning` |
|---|---|---|---|
| Target Size (WCAG 2.5.8) | Serious | −6 | −3 |
| Reflow (WCAG 1.4.10) | Serious | −6 | −3 |
| Landmarks | Moderate | −2.5 | −1.25 |
| Skip Links | Moderate | −2.5 | −1.25 |
| Interactive Element Affordance | Moderate | −2.5 | −1.25 |
| Duplicate page titles | Serious | — | −3 |
| Unlabeled **PII/finance** form fields | Blocking escalation | extra −5 | — |

N/A probes deduct nothing (renormalization preserved).

### Diminishing returns
Past **40 points** of raw deductions, each further point counts **half**:
```
effective = raw ≤ 40 ? raw : 40 + (raw − 40) × 0.5
```
This keeps heavily broken sites spread across ≈0–30 instead of all clamping to 0 (external tools still differentiate very bad pages — an 18 must stay distinguishable from a 2).

### Fields in the report payload
| Field | Meaning |
|---|---|
| `Percentage` | **Headline** — the deduction score above. Read by summary, worker, admin averages, AI explain, page-score weighting. |
| `Graded_Percentage` | The old node-ratio score, kept as a diagnostic ("page-level element pass rate", shown in the coverage note). |
| `Score_Breakdown` | Full audit trail: base, per-rule deduction log (rule, impact, node count, points), raw vs effective total. Excluded from the PDF. |

### Expected bands (simulated)
| Site profile | Old graded headline | New deduction headline | AccessibilityChecker.org band |
|---|---|---|---|
| Badly broken dealer site (3 critical + 5 serious rules + probe issues) | ~85 | **~26** | 0–49 "Poor" (their demo read 18) |
| Decent site (1 serious rule on few nodes, minor issues) | ~90+ | **~80** | 70–89 "Fair" |
| Clean automated scan | 96 | **90** | 90 "Highly accessible, manual pending" |
| Single critical rule failing | ≤70 | **~78** | 70–89 "Fair" |

Exact number-for-number parity with AccessibilityChecker.org is not possible (their formula is proprietary), but both scores now land in the same band and move in the same direction — which is what cross-check credibility requires.

---

## 4. How to verify scores stay accurate (any section)

1. **Data layer** — compare detected *violations* (rule IDs + element counts), not scores, against a reference tool on the same URL. Accessibility: axe DevTools extension (same engine → lists should match ~1:1). Technical: PageSpeed Insights. Security: Mozilla Observatory / SecurityHeaders.com. SEO: Lighthouse.
2. **Math layer** — fixture pages with planted defects; assert each defect is detected and the section score lands in an expected band.
3. **Calibration layer** — run 15–20 real sites through our audit and a reference tool; the *ranking* must agree even if absolute numbers differ.

---

## 5. Open item

The **other 7 sections still use their original models** and can show a "reads too high" mismatch if cross-checked against external tools (most likely: Technical vs PageSpeed, Security vs SecurityHeaders.com). Part 2 below is the proposal for aligning all sections.

---
---

# PART 2 — Proposed scoring for all 8 sections (end of discussion)

**Goal:** every section score should be (a) philosophically consistent with how external checkers score, and (b) for sections where a public reference tool exists, land **close to that tool** when someone cross-checks on any website.

## 6. What "close" can honestly mean

Exact number-for-number equality with external tools is **not achievable** — their formulas are partly proprietary, performance scores vary run-to-run (Google's own docs say to treat performance "as a distribution of scores", not a single number), and results differ by test location, device emulation and time of day. The defensible commitments are:

| Section | Reference tool | Closeness target |
|---|---|---|
| Technical Performance | PageSpeed Insights (Lighthouse) | within ±10 points, same colour band |
| On-Page SEO | Lighthouse SEO category | within ±10 on the shared audit subset |
| Accessibility | AccessibilityChecker.org / Lighthouse a11y | same band (Poor / Fair / Good) |
| Security (headers subset) | SecurityHeaders.com / Mozilla HTTP Observatory | same letter grade (±1 step) |
| UX, Conversion, AIO, AEO | *none exists* | labelled proprietary index — nothing to mismatch against |

## 7. Unified scoring policy (all sections)

1. **Rule-binary / deduction philosophy for headlines.** An issue counts in full — no dilution by the number of passing sibling elements. (This is what caused the 85-vs-18 incident.)
2. **Adopt published formulas where they exist** (Lighthouse curves and weights, Observatory deductions) instead of inventing our own for the same measurements.
3. **Absence of a feature scores 0, not 50.** Several parameters currently award 50–75 points when the measured thing simply doesn't exist (e.g. AIO Answer-Oriented Structure gives 50 with zero Q/A blocks; Content Freshness gives 50 with no timestamp at all). External tools never award points for absence. Warnings (50) should be reserved for "present but flawed".
4. **N/A means "genuinely not applicable"**, never "we couldn't measure it". A failed probe reports *not calculated*, and must never default to a pass (see the axe-crash bug fix).
5. **Keep the graded/diagnostic score** as a secondary field (`Graded_Percentage` pattern) — it's genuinely useful for tracking fix progress.
6. **Label proprietary sections as proprietary.** UX/Conversion/AIO/AEO gauges should carry a visible "Auditify Index — no industry-standard equivalent" note, with each parameter's threshold citing its source (Google guidance, WCAG, Baymard, NN/g) in InfoDetails. A score no one can cross-check must instead be *explainable*.
7. **Calibration harness before every demo/release:** a script that runs our audit + the reference tool's API on 15–20 dealer sites and reports per-section deltas and rank agreement. Failing the closeness targets above blocks the release.

## 8. Section-by-section proposal

### 8.1 Technical Performance — align exactly to Lighthouse
**Current:** already the best-positioned section — measures via Lighthouse + CrUX with proper log-normal curves. But the headline blends Lighthouse metrics at non-Lighthouse weights (LCP 22 / INP-TBT 20 / CLS 18 / FCP 8 / TTFB 8 / SI 6) with infra checks (compression 4, caching 4, redirects 3, render-blocking 5, resource optimization 5, sold-vehicle 5). PSI has no TTFB/caching/etc. in its score, so our number drifts from PSI's on every cross-check.
**Proposed:**
- Headline = **exact Lighthouse formula**: FCP 10%, Speed Index 10%, LCP 25%, TBT 30%, CLS 25%, computed from **lab** values (that is what PSI's headline gauge shows). Result: cross-checks agree within normal run variance.
- Move TTFB, compression, caching, redirects, render-blocking, resource optimization, sold-vehicle into a separately displayed **"Delivery Hygiene" sub-score** (they're valuable dealer insights — they just don't belong in the number people compare to PSI).
- Show field (CrUX) data as its own "Real-user experience" panel, as PSI itself does — never blended into the lab score.

### 8.2 On-Page SEO — already strict; add a comparable subset
**Current:** ternary (0 / 0.5 / 1) and ratio scoring over ~24 weighted markup checks. Philosophy already matches external tools (no node dilution); lowest mismatch risk.
**Proposed:**
- Keep the model. Add a **"Lighthouse-comparable" sub-score**: the weighted-binary result over just the audits Lighthouse SEO also runs (title, meta description, canonical, robots.txt, viewport, descriptive anchors, alt text). Lighthouse SEO reads high (most sites score 85–100) — showing this subset explains any gap instantly.
- Tighten per policy #3: checks that award 0.5 for a missing feature (not a flawed one) drop to 0.

### 8.3 Accessibility — done (this discussion)
Deduction model, base 90, per-rule severity deductions, diminishing returns — see Part 1 §3.

### 8.4 Security — adopt Observatory-style deductions + close the header gap
**Current:** weighted average with two hard gates (no HTTPS → cap 30, flagged reputation → cap 25). Checks only 4 of the 6 headers SecurityHeaders.com grades: **Referrer-Policy and Permissions-Policy are not tested at all** — so a manager's SecurityHeaders.com cross-check can show failures our report never mentions.
**Proposed:**
- **Add Referrer-Policy and Permissions-Policy checks** (both are simple header-presence/value tests).
- Compute a **"Header Security" sub-grade** using Mozilla HTTP Observatory's public model: baseline 100, deduct per failed test, bonuses only above 90; map to their published letter-grade table (100+ = A+, 90–99 = A, … 0–24 = F). This sub-grade is the externally comparable number.
- Headline becomes **deduction-based from 100** with severity tiers, keeping the existing HTTPS/reputation gates as floor caps. The dealer-specific checks external tools don't cover (SQLi/XSS probes, finance-form security, legal disclaimers, privacy) still deduct, but the report labels them "beyond external checker scope" so a SecurityHeaders.com comparison is made against the sub-grade, not the headline.

### 8.5 UX & Content Structure — proprietary index, tightened
**Current:** pure weighted average of 18 params, mix of composite/binary/ratio grading. No external tool produces a comparable "UX score".
**Proposed:** label it **"Auditify UX Index"**; keep the weighted model but (a) apply policy #3 (absence ≠ 50), (b) cite the public source for every threshold (Google's interstitial guidance, WCAG 2.5.8 target size, sticky-header limits, Flesch bands) in InfoDetails, (c) where a check counts elements (e.g. % of controls with click feedback), keep grading — element coverage is the honest measure there.

### 8.6 Conversion & Lead Flow — proprietary index, mostly fine
**Current:** largely binary checks (100/50/0) with page-type gating — already external-checker philosophy. No reference tool exists.
**Proposed:** label as proprietary index; audit the handful of "presence keyword" checks for false positives (a testimonial keyword ≠ testimonials); keep everything else.

### 8.7 AIO Readiness — biggest "generous floor" cleanup
**Current:** graded weighted average, but several parameters award 50–75 for absent features (no Q/A blocks → 50; no timestamp → 50; weak topical focus → 50 floor). This inflates baselines exactly the way node-ratio did for accessibility.
**Proposed:** apply policy #3 across all 8 weighted params (absent → 0, flawed → 50); keep weights and page gating. Label as proprietary index — no standard external AIO scorer exists yet.

### 8.8 AEO — same floor cleanup; per-platform gauges unchanged
**Current:** spec-weighted headline + three per-platform gauges (Gemini/ChatGPT/Perplexity) re-weighting the same signals; derived params (FAQ, sameAs, E-E-A-T) with 20–25 point floors.
**Proposed:** apply policy #3 to the derived-parameter floors; keep the platform gauges (they're a differentiator, not a comparability claim); label as proprietary index.

## 9. Calibration harness (the "prove it on any website" mechanism)

A small script (run manually or in CI) that, for a list of 15–20 dealer URLs:
1. Runs our audit.
2. Pulls **PageSpeed Insights API** (free key: performance + SEO + accessibility Lighthouse scores) and **SecurityHeaders.com / Observatory** results.
3. Emits a table: our score vs reference per section, delta, band match yes/no, plus Spearman rank correlation per section.
4. **Pass criteria:** Technical ±10 & same band; SEO subset ±10; Accessibility same band; Header grade ±1 letter step. Any failure = scoring bug or data bug to investigate before demoing.

This converts "is our score accurate?" from an opinion into a repeatable report you can hand to a manager.

## 10. Implementation status (all items implemented 6 July 2026)

1. ✅ **Security header gap** — `Referrer_Policy` (value-graded) and `Permissions_Policy` checks added to `securityCompliance.js` and the Security page.
2. ✅ **Technical headline realignment** — `Percentage` is now the official Lighthouse category score from PSI for the audited device (fallback: official metric weights over Lighthouse per-audit scores). Infra checks moved to the info-only `Delivery_Hygiene` composite; old blend kept as `Graded_Percentage`.
3. ✅ **Observatory-style Security sub-grade** — `Header_Security` info-only param (baseline 100, per-test deductions, Observatory letter table). Headline is now deduction-from-100 in spec points (N/A can't deduct), gates preserved, old average kept as `Graded_Percentage`, `Score_Breakdown` logs every deduction.
4. ✅ **Absence = 0 floor cleanup** — AIO (Answer_Oriented none→0, no-timestamp→0, zero-topical-overlap→0), AEO (FAQ absent 25→0, zero sameAs 20→0, no-sitemap Index Coverage 20→0), SEO (10 cases incl. missing H1/canonical/OG/Twitter/robots.txt/sitemap/structured-data/freshness → 0).
   - ✅ **N/A plumbing for crashed probes (follow-up, same day)** — a crashed or timed-out AEO signal probe now returns `score: null, notCalculated: true` (8 signal scorers + the orchestrator's timeout/stream fallbacks) instead of a fake neutral 50. Not-calculated signals are renormalized out of the section score (incl. gated derived params and a scored-only E-E-A-T composite), renormalized out of the per-platform gauges (with a `skippedSignals` list), excluded from recommendations, and shown as a neutral "Not Run · excluded from score" state on the AEO cards and platform detail lists. Real GSC field data still overrides a crashed bot-access probe.
5. ✅ **Proprietary-index labels** — "Auditify Index · no external equivalent" badge on the UX, Conversion, AIO and AEO pages.
6. ✅ **Calibration harness** — `Backend/scripts/calibrateScores.js`: reference sweep (PSI perf/a11y/seo + securityheaders.com grade) per URL; with `--ours <json>` computes deltas, band matches, Spearman, and a PASS/FAIL verdict per §6 targets.
