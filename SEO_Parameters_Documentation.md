# SEO Audit — Complete Parameter & Calculation Documentation

> Source of truth: `Backend/metricServices/seoMetrics.js` (single file, ~3838 lines).
> Entry point: `export default async function seoMetrics(url, $, page)` at line 3689.
> Called from: `Backend/workers/singleAuditWorker.js` and `Backend/workers/bulkAuditWorker.js`.

---

## 1. How a single parameter is scored

Almost every parameter is wrapped by the shared helper `evaluateParameter(score, details, meta)` (lines 4–21):

```js
const evaluateParameter = (score, details, meta) => {
  const status = score === 1 ? "pass" : score >= 0.5 ? "warning" : "fail";
  return {
    score: Math.round(score * 100),      // 0–100 integer
    status,                              // pass | warning | fail
    details,
    meta: { ...rest, value: `${Math.round(score*100)}%` },
    analysis: status === "pass" ? null : { cause, recommendation }
  };
};
```

Key facts:
- Each check produces a **fraction `0–1`**. Common values are `0`, `0.5`, `0.7`, `1`.
- `status` is derived from the **raw fraction** (before rounding): `=== 1` → **pass**, `>= 0.5` → **warning**, `< 0.5` → **fail**.
- The stored `score` is the fraction × 100, rounded to an integer.
- `analysis` (cause + recommendation) is only attached when the parameter is not passing.

**Data sources used in this file:** Cheerio DOM (`$`), Puppeteer `page.evaluate(...)`, and direct HTTP `fetch` (HEAD/GET). **No external PageSpeed/Lighthouse API** is used here (Core Web Vitals live in `technicalMetrics.js`, a separate file).

---

## 2. Master parameter table

23 parameters are **weighted** into the SEO percentage. The weights sum to **1.06** (`totalWeight`), and the final score is divided by that sum, so the "Effective %" column below is each parameter's true share of the SEO score.

| # | Parameter (key) | Weight | Effective share | Data source | Implementation |
|---|---|---|---|---|---|
| 1 | `H1` | 0.10 | 9.43% | Cheerio | Full |
| 2 | `Content_Relevance` | 0.10 | 9.43% | Cheerio (text vs keywords) | Full* |
| 3 | `Image` | 0.08 | 7.55% | Cheerio + HTTP HEAD | Full |
| 4 | `Canonical` | 0.08 | 7.55% | Cheerio | Full |
| 5 | `Contextual_Linking` | 0.08 | 7.55% | Cheerio + HTTP GET | Full |
| 6 | `EEAT` | 0.08 | 7.55% | Page fetches + regex | Full |
| 7 | `Structured_Data` | 0.06 | 5.66% | Puppeteer | Full (presence only) |
| 8 | `Meta_Description` | 0.05 | 4.72% | Cheerio | Full |
| 9 | `Sitemap` | 0.05 | 4.72% | HTTP fetch | Full |
| 10 | `Title` | 0.04 | 3.77% | Cheerio | Full |
| 11 | `Title_Uniqueness` | 0.04 | 3.77% | Multi-page HTTP | Full |
| 12 | `Title_Keyword_Optimization` | 0.04 | 3.77% | Multi-page HTTP | Full |
| 13 | `Robots_Txt` | 0.04 | 3.77% | HTTP fetch | Full |
| 14 | `Title_Location_Optimization` | 0.03 | 2.83% | Schema/footer/contact | Full |
| 15 | `Meta_Description_Uniqueness` | 0.03 | 2.83% | Multi-page HTTP | Full |
| 16 | `Heading_Hierarchy` | 0.03 | 2.83% | Cheerio | Full |
| 17 | `URL_Slugs` | 0.03 | 2.83% | URL parsing | Full |
| 18 | `Links` | 0.03 | 2.83% | Cheerio | Full |
| 19 | `Open_Graph` | 0.02 | 1.89% | Cheerio | Full |
| 20 | `Twitter_Card` | 0.02 | 1.89% | Cheerio | Full |
| 21 | `Semantic_Tags` | 0.01 | 0.94% | Cheerio | Full |
| 22 | `Video` | 0.01 | 0.94% | Cheerio | Full |
| 23 | `Social_Links` | 0.01 | 0.94% | Cheerio | Full |
| — | **Total (weighted)** | **1.06** | **100%** | | |

\* `Content_Relevance` is weighted using its raw `.percentage` field, not the standard `.score` — see §5.

**Display-only (computed and returned, but NOT in the percentage):**

| Parameter (key) | Scale | Data source | Status |
|---|---|---|---|
| `URL_Structure` | 0–100 | URL parsing | Full, but **not weighted** (no entry in `weights`) |
| `Service_Content_Quality` | 0–10 | Service-page fetch | Full, output-only |
| `Content_Depth_Quality` | 0–10 | Up to 6 typed-page fetches | Full, output-only |
| `Local_SEO` | 0–100 (avg of 8 sub-signals) | Mixed | Full, output-only (2 sub-signals **partial**) |

**Dead weight:** `Duplicate_Content: 0.02` exists in the `weights` object but has **no metric, no term in the formula, and no key in the output**. It is deliberately excluded from `totalWeight`. (Duplicate detection is effectively folded into the two Uniqueness checks and `Content_Depth_Quality`.)

---

## 3. Detailed calculation flow — weighted parameters

### Title — `Title` (0.04) — Cheerio `$("title")`
- No tag / empty → **0** (fail)
- length `< 30` → **0.5** (warning, too short)
- length `> 60` → **0.5** (warning, too long)
- 30–60 chars → **1** (pass)

### Title Uniqueness — `Title_Uniqueness` (0.04) — multi-page HTTP
- Samples up to 5 eligible internal pages once (`tuSamplePages`), fetching each via Puppeteer `fetch` (node-fetch fallback).
- Score = fraction of **unique** titles across the sampled set; duplicates/missing lower it.
- If the sample isn't usable → **0.5** (inconclusive).

### Title Keyword Optimization — `Title_Keyword_Optimization` (0.04) — multi-page HTTP
- For each sampled page, derives a target keyword (URL slug → H1 → most-frequent content word).
- `score = optimizedCount / pagesChecked` (title contains keyword).
- Not enough eligible pages → **0.5**.

### Title Location Optimization — `Title_Location_Optimization` (0.03) — schema → footer → contact → body
- Resolves the business city/state from JSON-LD address, then footer, then a contact-page fetch, then body text.
- Title mentions the location → **1**; doesn't → **0**; location undeterminable → **0.5**.

### Meta Description — `Meta_Description` (0.05) — Cheerio `meta[name=description]`
- Missing/empty → **0**
- `< 50` chars → **0.5**; `> 160` chars → **0.5**
- 50–160 chars → **1**

### Meta Description Uniqueness — `Meta_Description_Uniqueness` (0.03) — multi-page HTTP
- Same cross-page uniqueness logic as Title Uniqueness, applied to meta descriptions.

### H1 — `H1` (0.10) — Cheerio `$("h1")`
- 0 H1 → **0.5** (warning, not a hard fail)
- exactly 1 but empty → **0.5**
- exactly 1 with text → **1**
- multiple H1 → **0.5**

### Content Relevance — `Content_Relevance` (0.10) — Cheerio body text vs title/meta keywords
- Extracts target keywords from title + meta description, stem-matches against page content (single words + 2-word phrases + brand substrings).
- `P = round(matched / total * 100)`.
- Keyword-stuffing penalty: any word exceeding 7% frequency subtracts 10 each → `finalScore = clamp(P − penalty, 0, 100)`.
- Labels: `P ≥ 75` HIGH/pass, `≥ 40` MEDIUM/warning, else LOW/fail.
- **Weighting note:** the formula multiplies `contentRelevanceMetric.percentage` (the raw `P`), not the penalized `finalScore`, and not a 0–1 fraction. See §5.

### Image — `Image` (0.08) — Cheerio `$("img")` + HTTP HEAD (up to 15 srcs)
- Composite: `altScore*0.5 + meaningfulScore*0.2 + titleScore*0.1 + sizeScore*0.2`.
- `sizeScore` loses 0.1 per image > 150 KB; broken-image detection via HEAD status/content-type.
- Floors: a sub-`0.5` result is lifted to **0.5**; any broken image forces **0.5**.

### Canonical — `Canonical` (0.08) — Cheerio `link[rel=canonical]`
- Missing → **0.5**; multiple tags → **0**; empty href → **0**
- Self-referencing → **1**; points to another same-domain URL → **1**
- Points to external domain → **0**; invalid URL → **0**

### Contextual Linking — `Contextual_Linking` (0.08) — Cheerio + HTTP GET (up to 150 links)
- Starts at **1**, drops to **0.5** if any of: zero contextual links, > 100 (spam), ratio < 0.3, > 5 important menu links missing contextually, or any broken contextual link.
- Links containing "inventory" are skipped from the broken check.

### Sitemap — `Sitemap` (0.05) — HTTP fetch (robots-declared + `/sitemap.xml`, `/sitemap_index.xml`)
- Missing → **0.5**; found but invalid structure → **0**
- Valid but no `<lastmod>` or any lastmod > 180 days → **0.5** (outdated)
- Valid + fresh → **1**

### Robots.txt — `Robots_Txt` (0.04) — HTTP fetch `/robots.txt`
- Missing or empty → **0.5**
- Full-site `Disallow: /` → **0**
- Query-params blocked (`/*?`) → **0.7** (rounds to 70, warning)
- Otherwise → **1**

### Structured Data — `Structured_Data` (0.06) — Puppeteer `script[type=application/ld+json]`
- Any JSON-LD present → **1**; none → **0.5**; parse error → **0**.
- Presence check only — does **not** validate schema correctness.

### Heading Hierarchy — `Heading_Hierarchy` (0.03) — Cheerio `h1..h6`
- Starts **1**; no headings at all → **0**; any issue (skipped level, missing/multiple H1) → **0.5**.

### URL Slugs — `URL_Slugs` (0.03) — URL parsing only
- Root URL → **1**. Last path segment penalized for: > 50 chars, uppercase, underscores, numbers (when depth > 2). Any issue → **0.5**, else **1**.

### Links — `Links` (0.03) — Cheerio `$("a")` (no network)
- Counts internal/external/unique; flags generic anchors ("click here", etc.).
- `descRatio = descriptive / total`. Bad links OR `descRatio < 0.75` → **0.5**, else **1**.

### Semantic Tags — `Semantic_Tags` (0.01) — Cheerio
- `<main>` missing/multiple → **0.5**; missing header/nav/footer → **0.5**
- Only `<main>` with no div-heuristic replacements → **0**; with replacements → **0.5**; all good → **1**.

### Video — `Video` (0.01) — Cheerio
- No videos → **1**. Otherwise `score = (embedScore + lazyScore + metaScore) / 3`, where `embedScore = 1`, `lazyScore = lazyLoaded/total`, `metaScore = withMetadata/total`.

### Open Graph — `Open_Graph` (0.02) — Cheerio `meta[property=og:*]`
- Requires `og:title, og:image, og:url`. All present → **1**, else **0.5**.

### Twitter Card — `Twitter_Card` (0.02) — Cheerio
- Requires `twitter:card, twitter:title`. Both present → **1**, else **0.5**.

### Social Links — `Social_Links` (0.01) — Cheerio `$("a")` vs social-domain list
- ≥ 1 social profile link → **1**, else **0.5**.

### EEAT — `EEAT` (0.08) — page fetches + regex
- Discovers trust pages (About/Contact/Team/Privacy/Terms) and fetches up to 5 (HEAD-probe fallback).
- Five 0–2 checks: About presence, Contact info, Author/Team credentials, Experience/expertise, Trust signals (HTTPS/privacy/terms).
- `score10 = sum (0–10)` → `fraction = score10 / 10`.
- The **only** 0–10 "advanced" metric that is weighted.

---

## 4. Display-only parameters (returned, not scored)

### URL Structure — `URL_Structure`
- URL parsing; penalizes uppercase, underscores, query params, depth > 3. Any issue → 0.5, else 1.
- Returned for display; **no weight entry** so it never affects the percentage.

### Service Content Quality — `Service_Content_Quality` (0–10)
- Finds a service page, scores 4 checks (description, content length, booking, pre-service info) at 0–2 each (raw 0–8 → 0–10). Output-only.

### Content Depth Quality — `Content_Depth_Quality` (0–10)
- Fetches up to 6 typed pages (SRP/VDP/Service/Trade-In/About/Contact), scores each on Relevance/Depth/Uniqueness (Jaccard fingerprint) at 0–2 each, averages across pages. Output-only.

### Local SEO — `Local_SEO` (0–100, average of 8 sub-signals)
Each sub-signal lives under `meta.parameters`:
1. `NAP_Consistency` — name/address/phone present & consistent (`pts/4`)
2. `LocalBusiness_Schema` — JSON-LD LocalBusiness fields (`present/6`)
3. `Location_Targeting` — city/state in title/meta/body (`hits/3`)
4. `Local_Keyword_Usage` — geo / "near me" keywords (1 / 0.5 / 0)
5. `Local_Landing_Pages` — dedicated location pages (1 / 0.5 / 0)
6. `Location_Page_Completeness` — map/hours/directions/phone (`present/4`)
7. `Google_Business_Profile` — GBP/Maps link detection (1 / 0) — **`partial: true`** (link-only; full data needs Places API)
8. `Review_Signals` — AggregateRating schema / review links / star widget (1 / 0.5 / 0) — **`partial: true`**

Final `Local_SEO` score = simple average of the 8 sub-scores. Output-only (not weighted).

---

## 5. Final SEO percentage computation

```js
const getScore = (metric) => metric?.score || 0;   // 0–100 integer

const weightedScore =
  (getScore(titleMetric)            * weights.Title) +
  (getScore(titleUniquenessMetric)  * weights.Title_Uniqueness) +
  (getScore(titleKeywordMetric)     * weights.Title_Keyword_Optimization) +
  (getScore(titleLocationMetric)    * weights.Title_Location_Optimization) +
  (getScore(metaDescMetric)         * weights.Meta_Description) +
  (getScore(metaDescUniquenessMetric) * weights.Meta_Description_Uniqueness) +
  (getScore(h1Metric)               * weights.H1) +
  (contentRelevanceMetric.percentage * weights.Content_Relevance) +   // .percentage, not .score
  (getScore(imageMetric)            * weights.Image) +
  (getScore(canonicalMetric)        * weights.Canonical) +
  (getScore(contextualMetric)       * weights.Contextual_Linking) +
  (getScore(sitemapMetric)          * weights.Sitemap) +
  (getScore(robotsMetric)           * weights.Robots_Txt) +
  (getScore(structuredDataMetric)   * weights.Structured_Data) +
  (getScore(hierarchyMetric)        * weights.Heading_Hierarchy) +
  (getScore(slugMetric)             * weights.URL_Slugs) +
  (getScore(linksMetric)            * weights.Links) +
  (getScore(semanticMetric)         * weights.Semantic_Tags) +
  (getScore(videoMetric)            * weights.Video) +
  (getScore(ogMetric)               * weights.Open_Graph) +
  (getScore(twitterMetric)          * weights.Twitter_Card) +
  (getScore(socialLinksMetric)      * weights.Social_Links) +
  (getScore(eeatMetric)             * weights.EEAT);

const totalWeight = /* explicit sum of the 23 used weights */ = 1.06;

const actualPercentage = parseFloat((weightedScore / totalWeight).toFixed(0));
```

- Each parameter's 0–100 score is multiplied by its weight, all summed, then **normalized by `totalWeight` (1.06)** so the result is a true 0–100 figure.
- Result rounded to an integer.

### Worked example
If every weighted parameter scored 100:
`weightedScore = 100 × 1.06 = 106` → `106 / 1.06 = 100`. ✅

If `H1` and `Content_Relevance` were 0 (the two heaviest at 0.10 each) and everything else 100:
`weightedScore = 106 − (100 × 0.20) = 86` → `86 / 1.06 = 81.1` → **81%**. So those two together can swing the score by ~19 points.

---

## 6. Discrepancies / things to be aware of

1. **`Duplicate_Content: 0.02` is a dead weight** — in the `weights` object but never computed, never in the formula, never in the output, and excluded from `totalWeight`.
2. **`URL_Structure` is computed and returned but never weighted** — there is no `URL_Structure` key in `weights` (only `URL_Slugs` is weighted).
3. **`Content_Relevance` uses `.percentage`, not `.score`** — it is the only metric not wrapped by `evaluateParameter`. The weighted sum reads the raw match percentage (before the keyword-stuffing penalty); the penalized `finalScore` is computed but discarded.
4. **Three 0–10 "advanced" metrics** (`Service_Content_Quality`, `Content_Depth_Quality`, `Local_SEO`) are output-only. Only **`EEAT`** (also 0–10) feeds the score.
5. **Two Local SEO sub-signals are explicitly `partial`** (`Google_Business_Profile`, `Review_Signals`) — link-detection only; full accuracy needs the Google Places API. They still produce real scores, but only feed the display-only `Local_SEO`.
6. **`Structured_Data` is presence-only** — any JSON-LD passes; it does not validate that the schema is correct or complete.
7. **No stubs/TODOs** in the weighted path — every weighted parameter has real logic. The only true "not calculated" item is the orphaned `Duplicate_Content` weight.
8. **The in-code comment** claims weights "sum to 1.0"; the actual `totalWeight` is **1.06**. This is harmless because the code divides by that exact sum, keeping the score on a 0–100 scale — but the comment is inaccurate.
