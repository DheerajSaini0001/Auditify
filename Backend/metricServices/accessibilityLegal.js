// ============================================================================
// Legal-framework conformance mapping (INFORMATIONAL)
// ----------------------------------------------------------------------------
// ADA, Section 508, EAA, AODA and the DDA are NOT separate test suites — they
// are laws, and every one of them points back at WCAG. So this module runs no
// extra scan: it re-slices the SINGLE axe result set that accessibilityMetrics
// already collected, filtered to the tag set each law actually requires.
//
// accessibilityMetrics runs axe with wcag2a + wcag2aa + wcag21a + wcag21aa +
// wcag22aa, which is a strict SUPERSET of every framework below, so each one is
// answerable from the same pass/violation lists.
//
// Two honesty rules are hard-coded here and must not be relaxed:
//   1. Automated tooling covers only ~30–40% of WCAG success criteria, so no
//      result may ever read "compliant" — the best available verdict is
//      "passes the automated checks this law relies on".
//   2. Every one of these laws imposes obligations BEYOND the website (Section
//      508 covers software/hardware/docs, the EAA covers ATMs, e-books and
//      banking, AODA adds policy/training/feedback duties, the ADA and DDA
//      cover physical premises). A clean web scan is evidence, never proof.
// Both are surfaced on every framework result so a report cannot imply more
// than was measured.
// ============================================================================

// WCAG version → the axe tags that carry that version's A + AA rules.
// Cumulative: 2.1 AA includes everything 2.0 AA requires, and so on.
const WCAG_TAGS = {
  "2.0": ["wcag2a", "wcag2aa"],
  "2.1": ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"],
  "2.2": ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"],
};

// The frameworks themselves. `markets` uses ISO 3166-1 alpha-2 so it lines up
// with the country stored on the audit run (Frontend/src/config/countries.js).
export const LEGAL_FRAMEWORKS = [
  {
    id: "WCAG_2_2_AA",
    name: "WCAG 2.2 Level AA",
    kind: "standard",
    jurisdiction: "International",
    authority: "W3C",
    requires: "2.2",
    markets: ["*"],
    basis: "W3C Web Content Accessibility Guidelines 2.2, Level AA.",
    enforcement:
      "Not a law in itself — it is the technical standard the laws below adopt by reference.",
  },
  {
    id: "ADA",
    name: "ADA (Americans with Disabilities Act)",
    kind: "law",
    jurisdiction: "United States",
    authority: "US Department of Justice; private right of action",
    // The statute names no technical standard. Courts and settlements treat
    // WCAG 2.1 AA as the benchmark, and the DOJ's 2024 Title II rule fixes 2.1
    // AA for state/local government. A dealer is a Title III public
    // accommodation, so 2.1 AA is the defensible bar to report against.
    requires: "2.1",
    markets: ["US"],
    basis:
      "ADA Title III (public accommodations). The Act specifies no technical standard; WCAG 2.1 AA is the de facto benchmark, and the DOJ's 2024 Title II rule adopts WCAG 2.1 AA for state and local government.",
    enforcement:
      "Private lawsuits and demand letters rather than regulator fines. In California the Unruh Civil Rights Act adds statutory damages with a $4,000 minimum per violation.",
  },
  {
    id: "SECTION_508",
    name: "Section 508",
    kind: "law",
    jurisdiction: "United States (federal agencies and their contractors)",
    authority: "US Access Board; procuring agency",
    requires: "2.0",
    markets: ["US"],
    basis:
      "Revised Section 508 Standards (36 CFR Part 1194) incorporate WCAG 2.0 Level AA by reference.",
    enforcement:
      "Federal procurement conditions and administrative complaints. Relevant to a dealer only when selling to federal government — for example fleet contracts.",
  },
  {
    id: "DDA",
    name: "DDA (Disability Discrimination Act 1992)",
    kind: "law",
    jurisdiction: "Australia",
    authority: "Australian Human Rights Commission",
    requires: "2.1",
    markets: ["AU"],
    basis:
      "DDA 1992 s24. The AHRC's World Wide Web Access advisory notes point to WCAG 2.1 Level AA; AS EN 301 549 is the adopted procurement standard.",
    enforcement:
      "Complaint-driven conciliation through the AHRC, escalating to the Federal Court if unresolved. Far lower volume than US litigation.",
  },
  {
    id: "EAA",
    name: "EAA (European Accessibility Act)",
    kind: "law",
    jurisdiction: "European Union",
    authority: "National market-surveillance authorities",
    requires: "2.1",
    markets: ["EU"],
    basis:
      "Directive (EU) 2019/882, applicable from 28 June 2025. The harmonised standard EN 301 549 maps to WCAG 2.1 Level AA.",
    enforcement:
      "National market-surveillance authorities; penalties are set per member state. Applies only if the business offers products or services to consumers in the EU.",
  },
  {
    id: "AODA",
    name: "AODA",
    kind: "law",
    jurisdiction: "Ontario, Canada",
    authority: "Government of Ontario",
    requires: "2.0",
    markets: ["CA"],
    basis:
      "Integrated Accessibility Standards Regulation (O. Reg. 191/11) s14 — WCAG 2.0 Level AA, excluding success criteria 1.2.4 (live captions) and 1.2.5 (audio description).",
    enforcement:
      "Administrative monetary penalties issued by the province, plus mandatory compliance reporting for larger organisations.",
  },
];

const AUTOMATED_COVERAGE_NOTE =
  "Automated testing reaches roughly 30–40% of WCAG success criteria. A clean result means the automated checks passed — it is not a determination of legal compliance.";

const BEYOND_WEB_NOTE =
  "This law also imposes obligations beyond the website. A web scan is supporting evidence, not proof of compliance.";

/**
 * Does this axe rule result belong to the framework's required tag set?
 * Rules carrying only `best-practice`, `experimental` or `ACT` tags are
 * excluded by construction — they are not WCAG success criteria, so they must
 * never influence a legal-conformance verdict.
 */
const inScope = (node, tagSet) =>
  Array.isArray(node?.tags) && node.tags.some((t) => tagSet.has(t));

/**
 * Evaluate one framework against an axe result set.
 * Mirrors checkWcagAACompliance's grading so the numbers are consistent with
 * the WCAG_AA_Compliance card the section already shows.
 */
const evaluateFramework = (framework, axeResults, axeFailed) => {
  const tagSet = new Set(WCAG_TAGS[framework.requires]);

  const violations = (axeResults.violations || []).filter((v) => inScope(v, tagSet));
  const passes = (axeResults.passes || []).filter((p) => inScope(p, tagSet));

  const byImpact = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const failingCriteria = [];
  violations.forEach((v) => {
    const impact = v.impact || "moderate";
    if (byImpact[impact] !== undefined) byImpact[impact]++;
    if (failingCriteria.length < 20) {
      failingCriteria.push({
        id: v.id,
        impact,
        help: v.help,
        nodes: v.nodes ? v.nodes.length : 0,
      });
    }
  });

  const base = {
    id: framework.id,
    name: framework.name,
    kind: framework.kind,
    jurisdiction: framework.jurisdiction,
    authority: framework.authority,
    requiredStandard: `WCAG ${framework.requires} Level AA`,
    basis: framework.basis,
    enforcement: framework.enforcement,
    coverageNote: AUTOMATED_COVERAGE_NOTE,
    ...(framework.kind === "law" ? { scopeNote: BEYOND_WEB_NOTE } : {}),
  };

  // A failed axe run cannot support any verdict — say so rather than defaulting
  // to a pass, which would be the most damaging possible failure mode here.
  if (axeFailed) {
    return {
      ...base,
      status: null,
      notCalculated: true,
      score: null,
      verdict: "Not determined",
      details:
        "The accessibility scan did not complete, so no conformance verdict can be given for this framework.",
    };
  }

  const violationCount = violations.length;
  const passCount = passes.length;
  const totalRules = passCount + violationCount;
  const ratio = totalRules > 0 ? (passCount / totalRules) * 100 : 100;

  // Same severity ceilings as the WCAG rollup: a blocking issue must not be
  // able to sit behind a high ratio just because most rules passed.
  let score = Math.round(ratio);
  if (byImpact.critical > 0) score = Math.min(score, 50);
  else if (byImpact.serious > 0) score = Math.min(score, 70);
  else if (byImpact.moderate > 0) score = Math.min(score, 85);
  score = Math.max(0, Math.min(100, score));

  // Wording is deliberate. "Compliant" is never used — only what was measured.
  let verdict;
  let status;
  if (violationCount === 0) {
    verdict = `Passes all ${passCount} automated ${base.requiredStandard} checks`;
    status = "pass";
  } else if (byImpact.critical > 0 || score < 60) {
    verdict = "Automated checks failing";
    status = "fail";
  } else {
    verdict = "Automated checks partially passing";
    status = "warning";
  }

  return {
    ...base,
    status,
    score,
    verdict,
    conformanceRatio: Math.round(ratio),
    passedRules: passCount,
    violatedRuleCount: violationCount,
    byImpact,
    failingCriteria,
    details:
      violationCount === 0
        ? `No automated ${base.requiredStandard} failures detected. ${AUTOMATED_COVERAGE_NOTE}`
        : `${violationCount} ${base.requiredStandard} rule(s) failing (${byImpact.critical} critical, ${byImpact.serious} serious, ${byImpact.moderate} moderate, ${byImpact.minor} minor).`,
  };
};

/**
 * Build the legal-framework block for the Accessibility section.
 *
 * @param {object} axeResults  the axe result set accessibilityMetrics already has
 * @param {boolean} axeFailed  true when the scan could not run
 * @param {string|null} market ISO alpha-2 for the audited market ("US", "AU").
 *                             When null every framework is returned, so the
 *                             block still works before the market is plumbed
 *                             through to the worker.
 */
export function evaluateLegalFrameworks(axeResults, axeFailed = false, market = null) {
  const wanted = market
    ? LEGAL_FRAMEWORKS.filter(
        (f) => f.markets.includes("*") || f.markets.includes(market)
      )
    : LEGAL_FRAMEWORKS;

  // If a market was supplied but matched nothing beyond the standard itself,
  // fall back to the full list rather than showing a near-empty card.
  const frameworks = wanted.length > 1 ? wanted : LEGAL_FRAMEWORKS;

  return {
    market: market || "all",
    evaluated: frameworks.map((f) => evaluateFramework(f, axeResults, axeFailed)),
    note:
      "These frameworks are laws, not separate test suites — each one adopts a WCAG version by reference, so all of them are answered from the same scan. Verdicts describe the automated checks only.",
  };
}

export default evaluateLegalFrameworks;
