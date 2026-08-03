# Documentation

Everything except the top-level `README.md`, which stays at the repo root by
convention (architecture doc §11).

## Start here

| Document | What it covers |
|---|---|
| [architecture.md](architecture.md) | Folder layout, request flow, layering rules, and where this codebase deliberately diverges from the MERN prompt |
| [ROADMAP.md](ROADMAP.md) | Planned work |
| [SECURITY_REMEDIATION.md](SECURITY_REMEDIATION.md) | Security findings and their fixes |
| [CMS_DESIGN.md](CMS_DESIGN.md) | CMS design notes — currently an empty placeholder |

## `specs/` — how the audit engine scores

These are the source of truth for the audit pillars. Code in
`Backend/metricServices/` cites them by section (e.g. `SCORING_FORMAT §7 rule 3`),
so a threshold in code and its justification here should always agree.

| Document | What it covers |
|---|---|
| [AUDIT_FRAMEWORK_SPECIFICATION.md](specs/AUDIT_FRAMEWORK_SPECIFICATION.md) | The framework every pillar is built against |
| [AUDIT_FRAMEWORK_SPECIFICATION.NextVersion.md](specs/AUDIT_FRAMEWORK_SPECIFICATION.NextVersion.md) | Proposed next revision |
| [AUDIT_PARAMETER_METHODOLOGY.md](specs/AUDIT_PARAMETER_METHODOLOGY.md) | How each parameter is measured |
| [SCORING_FORMAT.md](specs/SCORING_FORMAT.md) | Scoring rules the metric services implement |
| [SCORE_CALCULATION.md](specs/SCORE_CALCULATION.md) | How pillar and overall scores are computed |
| [SEO_Parameters_Documentation.md](specs/SEO_Parameters_Documentation.md) | The on-page SEO parameter set |
| [README_metric.md](specs/README_metric.md) | Per-metric reference |
| [SPEC_VS_CODE_RECONCILIATION.md](specs/SPEC_VS_CODE_RECONCILIATION.md) | Where the spec and the implementation differ |

## `reference/` — source material and working notes

Original documents the audit framework was built from, plus working notes. These are
inputs to read, not anything the code loads: Word/PDF briefs, the parameter-status
sheets, the June work log, and `to-do.txt`.

## `reports/` — generated output

Artefacts from past runs, kept for comparison: the audit-parameter and pipeline
timing reports, and a sample dealership PDF report. Nothing regenerates these on
build; they are snapshots.

## `prompts/` — implementation briefs

Requirement documents handed to the team, kept because the code cites them and
because they record what was asked for, which is not always what shipped. Each
implementation notes its own divergences.

| Document | Status |
|---|---|
| [seo-technical-implementation-prompt.md](prompts/seo-technical-implementation-prompt.md) | Implemented. All 13 rules pass; `npm run seo:verify` enforces them at build time |
| [mern-architecture-implementation-prompt.md](prompts/mern-architecture-implementation-prompt.md) | Adopted, not applied literally — see [architecture.md](architecture.md) for each divergence and why |
| [dealership_detection_prompt.md](prompts/dealership_detection_prompt.md) | Reference for the site-type detector |
