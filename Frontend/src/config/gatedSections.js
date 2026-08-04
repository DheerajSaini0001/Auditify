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
export const FREE_SECTIONS = [
  'Technical Performance',
  'On Page SEO',
  'Accessibility',
];

export const GATED_SECTIONS = [
  'Security/Compliance',
  'UX & Content Structure',
  'Conversion & Lead Flow',
  'AIO (AI-Optimization) Readiness',
  'AEO (Answer Engine Optimization)',
];

/** True when this section's detail requires an account. */
export const isSectionGated = (section) => GATED_SECTIONS.includes(section);

/** Copy for the unlock overlay. Kept here so all gated sections read consistently. */
export const GATE_HEADLINE = 'Sign up free to see this';
export const GATE_BODY =
  'Your scores are yours to keep. Create a free account to read the full findings and the exact steps to fix them.';
