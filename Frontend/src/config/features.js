/**
 * Front-end feature flags.
 *
 * Flags here hide UI without deleting it, so turning a feature back on is a
 * one-line change rather than an archaeology exercise. Anything switched off for
 * more than a release or two is better deleted outright — a flag that never flips
 * back is just dead code with extra steps.
 */

/**
 * The AI summary entry points in the report:
 *   • the "Ask AI" button in the report header (components/UrlHeader.jsx)
 *   • the per-metric "AI Summary ✨" button (components/AskAIButton.jsx), which
 *     appears on every metric card across the report pages
 *
 * Turned off together — leaving one visible while the other is hidden would make
 * AI look broken rather than absent. Flipping this to `true` restores both.
 *
 * Note this hides the buttons only. The floating AI chat widget is a separate
 * component (components/AIChatWidget.jsx) and is unaffected, as are the backend
 * AI routes — nothing here revokes access, it just stops offering it in the UI.
 */
export const AI_SUMMARY_ENABLED = false;
