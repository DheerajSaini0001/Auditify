/**
 * Countries offered on the home-page audit form.
 *
 * The audit itself is country-agnostic today — local signals are read from what
 * the site publishes (see seoMetrics' geographic-term collection), not from a
 * dropdown. This captures the market the visitor says they operate in so it can
 * be stored with the run; nothing scores differently because of it yet.
 *
 * ISO 3166-1 alpha-2 codes, so the value is stable if the label ever changes.
 */
// The two markets the product serves. Deliberately short: the list is what the
// home-page dropdown offers, not what the backend accepts — it still stores any
// ISO code, so an older link or a saved run carrying another market is kept as-is
// rather than rewritten to something the visitor never picked.
export const COUNTRIES = [
    { code: 'US', name: 'United States' },
    { code: 'AU', name: 'Australia' },
];

export const DEFAULT_COUNTRY = 'US';

export const isValidCountry = (code) => COUNTRIES.some((c) => c.code === code);
