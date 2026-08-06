/**
 * Which audit sections a signed-out visitor can read in full.
 *
 * Guests get the whole report's *scores* — every pillar ring and headline number
 * stays visible, because that is the hook. What is gated is the detail underneath
 * the gated pillars: the per-parameter findings and fix recommendations.
 *
 * `value` strings must match SECTIONS in components/Landing/HeroSection.jsx and
 * the section names the backend stores in `report`, because the same strings are
 * used to gate the API response — see Backend/utils/reportGating.js. If you rename
 * a section, rename it in all three places or the gate silently stops matching.
 *
 * IMPORTANT: this list is a *product* decision, not a security boundary. The blur
 * is cosmetic — the real gate is the backend stripping these sections out of the
 * payload for signed-out requests. Adding a section here without adding it to the
 * backend list gives you a paywall that DevTools defeats in ten seconds.
 */
// Nothing is free in full any more. A signed-out visitor keeps every pillar's
// score — that is the hook — and the findings, causes and fixes behind all eight
// require an account.
export const FREE_SECTIONS = [];

export const GATED_SECTIONS = [
  'Technical Performance',
  'On Page SEO',
  'Accessibility',
  'Security/Compliance',
  'UX & Content Structure',
  'Conversion & Lead Flow',
  'AIO (AI-Optimization) Readiness',
  'AEO (Answer Engine Optimization)',
];

/** True when this section's detail requires an account. */
export const isSectionGated = (section) => GATED_SECTIONS.includes(section);

/**
 * Canonical section name → the key its findings live under on the report document.
 *
 * Same three-way coupling as GATED_SECTIONS above: these keys must match what the
 * worker writes and what Backend/utils/reportGating.js strips. Rename one, rename
 * all three.
 */
export const SECTION_DATA_KEY = {
  'Technical Performance': 'technicalPerformance',
  'On Page SEO': 'onPageSEO',
  'Accessibility': 'accessibility',
  'Security/Compliance': 'securityOrCompliance',
  'UX & Content Structure': 'UXOrContentStructure',
  'Conversion & Lead Flow': 'conversionAndLeadFlow',
  'AIO (AI-Optimization) Readiness': 'aioReadiness',
  'AEO (Answer Engine Optimization)': 'aeo',
};

/**
 * Has this section actually reported yet?
 *
 * The eight pillars stream in one at a time over a multi-minute run, so for most of
 * that run a given section simply does not exist on the report yet. A signed-out
 * visitor's gated copy DOES count as reported — the server strips the detail but
 * still sends `{ locked, Percentage, passedCount… }`, which is a real result.
 *
 * Callers with no section (or an unmapped one) get `true`: never hold back a gate
 * we cannot reason about.
 */
export const sectionHasReported = (report, section) => {
  const key = SECTION_DATA_KEY[section];
  if (!key) return true;
  const s = report?.[key];
  return !!s && typeof s === 'object' && Object.keys(s).length > 0;
};

/** Copy for the unlock overlay. Kept here so all gated sections read consistently. */
export const GATE_HEADLINE = 'Sign up free to see this';
export const GATE_BODY =
  'Your scores are yours to keep. Create a free account to read the full findings and the exact steps to fix them.';
