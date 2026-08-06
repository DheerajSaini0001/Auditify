# tools/

Standalone utilities. Neither app builds or imports these — they are run by hand,
which is why they live outside `Backend/` and `Frontend/` rather than in either
package's `scripts/`.

| File | What it does |
|---|---|
| `_build_report.js` | Builds a timing report from audit-pipeline data. Output lands in `docs/reports/`. |
| `generate_seo_pdf.py` | Renders an SEO report as PDF. |
| `build_page_matrix_report.mjs` | Builds `docs/reports/Automotive-Page-Level-Parameter-Matrix.html` — every parameter's share of the page score across 4 site types × 6 key pages. |

The first two were sitting loose at the repo root with zero references anywhere in
the codebase. They are kept because they produce the artefacts in `docs/reports/`,
not because anything depends on them.

If any of them becomes part of a build, move it into that package's `scripts/`
folder so it runs with the right dependencies and gets covered by lint.

## build_page_matrix_report.mjs

```bash
node tools/build_page_matrix_report.mjs
```

Imports `Backend/config/parameterImportance.js` and `Backend/config/siteTypeProfiles.js`
directly, so the report cannot drift from the ratings and applicability the engine
actually applies. What it does *not* import is the in-section weights and page gates —
those live inside the eight metric services next to the checks they weight, and are
transcribed into the `REG` table at the top of this file, each block carrying the
source line it came from. **If you change a weight or a page gate in a metric service,
update `REG` and re-run**, or the report will quietly describe the old engine.

Re-render the PDF after regenerating:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf=docs/reports/Automotive-Page-Level-Parameter-Matrix.pdf "file://$PWD/docs/reports/Automotive-Page-Level-Parameter-Matrix.html"
```
