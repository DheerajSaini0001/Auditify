// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for status (pass / warning / fail) colours and the
// score → band mapping. Replaces the per-component hardcoded emerald/amber/rose
// ternaries that were duplicated across ~12 files, so a status' colour and a
// score's band can never drift between cards again.
//
//   • Per-metric cards pass an explicit `status` (computed from that metric's own
//     thresholds) → use statusText / statusBadge / statusLabelText.
//   • Aggregate score rings / glows pass a raw 0–100 number → scoreToStatus()
//     applies the canonical product band, then the same helpers colour it.
//
// Canonical band (the product's signal-card rule): <25 fail · 25–74 warning · ≥75 pass.
// ─────────────────────────────────────────────────────────────────────────────

// Normalise every status spelling used across the app to pass | warning | fail.
export const normStatus = (status) => {
  if (status === "pass" || status === "good") return "pass";
  if (status === "warning" || status === "needs_improvement" || status === "needs-improvement") return "warning";
  if (status === "fail" || status === "poor") return "fail";
  return null;
};

// Map a 0–100 score to a status band (the one canonical place this decision lives).
export const scoreToStatus = (score) => {
  const n = Number(score);
  if (!Number.isFinite(n)) return null;
  if (n >= 75) return "pass";
  if (n >= 25) return "warning";
  return "fail";
};

export const statusLabelText = (status) => {
  const s = normStatus(status);
  return s === "pass" ? "Passed" : s === "warning" ? "Warning" : s === "fail" ? "Poor" : "—";
};

// Text colour. tier: "label" (lighter) | "value" (stronger). Null/unknown → neutral.
const TEXT = {
  pass: { light: { label: "text-emerald-600", value: "text-emerald-700" }, dark: { label: "text-emerald-400", value: "text-emerald-300" } },
  warning: { light: { label: "text-amber-600", value: "text-amber-700" }, dark: { label: "text-amber-400", value: "text-amber-300" } },
  fail: { light: { label: "text-rose-600", value: "text-rose-700" }, dark: { label: "text-rose-400", value: "text-rose-300" } },
};
export const statusText = (status, darkMode, tier = "value") => {
  const s = normStatus(status);
  if (!s) return darkMode ? "text-gray-400" : "text-faint";
  return TEXT[s][darkMode ? "dark" : "light"][tier];
};

// Badge: background + text + border-colour (consumer supplies the `border` keyword).
const BADGE = {
  pass: { light: "bg-emerald-50 text-emerald-600 border-emerald-100", dark: "bg-emerald-900/30 text-emerald-400 border-emerald-800" },
  warning: { light: "bg-amber-50 text-amber-600 border-amber-100", dark: "bg-amber-900/30 text-amber-400 border-amber-800" },
  fail: { light: "bg-rose-50 text-rose-600 border-rose-100", dark: "bg-rose-900/30 text-rose-400 border-rose-800" },
};
export const statusBadge = (status, darkMode) => BADGE[normStatus(status) || "fail"][darkMode ? "dark" : "light"];

// Solid brand colour (theme-independent) for legend dots, glows, fills.
const SOLID = { pass: "bg-emerald-500", warning: "bg-amber-500", fail: "bg-rose-500" };
export const statusSolidBg = (status) => SOLID[normStatus(status) || "fail"];

// Ring stroke colour + glow for CircularProgress, keyed off the score band.
const RING = {
  pass: { color: "text-emerald-500", glow: "drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" },
  warning: { color: "text-amber-500", glow: "drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" },
  fail: { color: "text-rose-500", glow: "drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]" },
};
export const scoreRing = (score) => RING[scoreToStatus(score) || "fail"];
