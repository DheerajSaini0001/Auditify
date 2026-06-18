// ============================================================================
// Parameter visibility (FRONTEND copy)
// ----------------------------------------------------------------------------
// The report now has a SINGLE mode that shows every parameter. The old
// Dealer / Developer split has been removed — every parameter is visible and
// every parameter shows its "View Details" / "AI Summary" actions.
//
// These helpers are kept (with their original signatures) so the many call
// sites across the report pages keep working unchanged; they now simply report
// "everything is visible / actionable". The `key` / `mode` arguments are
// accepted but ignored.
// ============================================================================

// Every parameter is visible in the single report mode.
export const isVisibleForAudience = () => true;

// Every parameter is actionable, so "View Details" and "AI Summary" always show.
export const isActionableParam = () => true;

// Every section is visible in the single report mode.
export const isSectionVisibleForAudience = () => true;

// No parameters are hidden, so there are never "more parameters" to reveal.
export const developerOnlyParamsInSection = () => [];
