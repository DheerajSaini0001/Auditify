# tools/

Standalone utilities. Neither app builds or imports these — they are run by hand,
which is why they live outside `Backend/` and `Frontend/` rather than in either
package's `scripts/`.

| File | What it does |
|---|---|
| `_build_report.js` | Builds a timing report from audit-pipeline data. Output lands in `docs/reports/`. |
| `generate_seo_pdf.py` | Renders an SEO report as PDF. |

Both were sitting loose at the repo root with zero references anywhere in the
codebase. They are kept because they produce the artefacts in `docs/reports/`, not
because anything depends on them.

If either becomes part of a build, move it into that package's `scripts/` folder so
it runs with the right dependencies and gets covered by lint.
