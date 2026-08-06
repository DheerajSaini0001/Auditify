/**
 * Flatten one audit section into the flat list of parameter results behind its score.
 *
 * A section is a bag of named metrics, each `{ score, status, details, meta, analysis }`.
 * Core Web Vitals nest one level deeper (`{ lab, crux }`) because they carry both a
 * lab measurement and real-user field data, and both are worth reporting.
 *
 * The shape this returns is deliberately the same one the PDF export builds from —
 * a finding shown on screen and the same finding in the downloaded report must not
 * be able to disagree.
 */

// Section-level bookkeeping, not parameters. `Percentage` is the score itself, the
// rest are provenance. The four Keyboard_* keys are folded into Keyboard_Navigation
// by the scorer, so listing them again would double-report the same check.
// Same transform as pdfGenerator's cleanKey, deliberately copied rather than
// imported: that module pulls jspdf + html2canvas in at module scope, and this one
// is loaded by the summary page, which has no business shipping a PDF engine.
const prettyName = (key) =>
    String(key)
        .replace(/_/g, " ")
        .replace(/([a-z])([A-Z])/g, "$1 $2")
        .replace(/\b\w/g, (c) => c.toUpperCase());

const NON_METRIC_KEYS = new Set([
    "Percentage", "Graded_Percentage", "Score_Breakdown", "Confidence", "Coverage",
    "Note", "Band", "Real_User_Experience", "Schema", "siteSchema", "Section_Score",
    "score", "grade", "Focus_Order", "Focusable_Content", "Tab_Index", "Aria_Hidden_Focus",
]);

/** pass | warning | fail | na — one vocabulary, whatever the scorer spelled it. */
const normalizeStatus = (metric) => {
    // A renormalized-out metric carries a null score AND no status: it was not
    // measured, which is not the same as failing.
    if (metric?.meta?.notScored || metric?.score == null) {
        if (!metric?.status) return "na";
    }
    const raw = String(metric?.status ?? metric?.Status ?? "").toLowerCase();
    if (raw.includes("pass") || raw === "good") return "pass";
    if (raw.includes("warn") || raw.includes("needs")) return "warning";
    if (raw.includes("fail") || raw.includes("poor")) return "fail";
    if (typeof metric?.score === "number") {
        return metric.score >= 90 ? "pass" : metric.score >= 50 ? "warning" : "fail";
    }
    return "na";
};

const readMetric = (metric, name) => {
    if (!metric || typeof metric !== "object" || Array.isArray(metric)) return null;

    const status = normalizeStatus(metric);
    return {
        name,
        status,
        score: typeof metric.score === "number" ? metric.score : null,
        details: metric.details || metric.Details || (metric.value != null ? String(metric.value) : ""),
        value: metric.meta?.value ?? null,
        cause: metric.cause || metric.analysis?.cause || metric.meta?.why_this_occurred || "",
        // Same precedence chain the PDF uses, so both surfaces quote the same fix.
        recommendation:
            metric.recommendation ||
            metric.analysis?.recommendation ||
            metric.meta?.how_to_fix ||
            metric.suggestion ||
            metric.Suggestion ||
            "",
    };
};

export const flattenSectionMetrics = (section) => {
    if (!section || typeof section !== "object") return [];

    const out = [];
    for (const [key, value] of Object.entries(section)) {
        if (NON_METRIC_KEYS.has(key)) continue;
        if (!value || typeof value !== "object" || Array.isArray(value)) continue;

        const label = prettyName(key);
        if (value.lab || value.crux) {
            const lab = readMetric(value.lab, `${label} (lab)`);
            const crux = readMetric(value.crux, `${label} (real-world)`);
            if (lab) out.push(lab);
            if (crux) out.push(crux);
        } else {
            const metric = readMetric(value, label);
            if (metric) out.push(metric);
        }
    }
    return out;
};

const SEVERITY = { fail: 0, warning: 1, pass: 2, na: 3 };

/**
 * Merge the same section across every audited page into one site-level view.
 *
 * A parameter checked on six page types produces six results; the summary is about
 * the site, so each parameter appears once — represented by its WORST result, with
 * a count of how many pages share that verdict. Showing the best result would let a
 * clean home page hide a broken VDP, which is the opposite of what this page is for.
 */
export const collectSectionFindings = (reportList, sectionKey) => {
    const byName = new Map();

    for (const report of reportList) {
        for (const metric of flattenSectionMetrics(report?.[sectionKey])) {
            const existing = byName.get(metric.name);
            if (!existing) {
                byName.set(metric.name, { ...metric, pageCount: 1 });
                continue;
            }
            existing.pageCount += 1;
            if (SEVERITY[metric.status] < SEVERITY[existing.status]) {
                byName.set(metric.name, { ...metric, pageCount: existing.pageCount });
            }
        }
    }

    const findings = [...byName.values()].sort(
        (a, b) => SEVERITY[a.status] - SEVERITY[b.status] || a.name.localeCompare(b.name)
    );

    return {
        findings,
        issues: findings.filter((f) => f.status === "fail" || f.status === "warning"),
        // Only fixes for things actually broken — a recommendation attached to a
        // passing check is noise, not an action.
        recommendations: findings.filter(
            (f) => f.recommendation && (f.status === "fail" || f.status === "warning")
        ),
    };
};
