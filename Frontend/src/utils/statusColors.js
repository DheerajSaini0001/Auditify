// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for score bands and status colours, so a score's colour
// and its label can never drift between cards again.
//
// Two separate systems live here — do not mix them up:
//
//   • SCORE BANDS (5 levels). Anything that renders a raw 0–100 number: pillar
//     rings, overall score, dashboard ratings, glows. Use scoreBand().
//
//         90–100  Excellent          #22C55E  green
//         75–89   Good               #84CC16  yellow-green
//         50–74   Needs Improvement  #F59E0B  orange
//         25–49   Poor               #F97316  dark orange
//          0–24   Critical           #EF4444  red
//
//   • STATUS (3 levels: pass / warning / fail). Per-metric cards that compute
//     their own pass/fail from that metric's own thresholds and pass a `status`
//     string. Use statusText / statusBadge / statusLabelText.
//
// The band hexes are fixed product values, deliberately outside the brand palette
// — a score readout has to be instantly legible as good/bad, which is a different
// job from brand expression. They are registered as `--color-score-*` in
// index.css so Tailwind emits real utilities for them; writing `text-green-500`
// would NOT work here, because the brand override remaps Tailwind's own ramps.
// ─────────────────────────────────────────────────────────────────────────────

// Ordered high → low. `hex` is the exact spec colour, used for rings, dots, fills
// and glows. `text` is a darkened tone of the same hue, used only for small label
// text — #84CC16 on ivory is about 2:1 contrast and unreadable at 12px, so labels
// step down to the 700-weight of the same hue while the indicator keeps the spec
// colour. Class names are written as literal strings so Tailwind's scanner emits
// them; do not build them by interpolation.
export const SCORE_BANDS = [
  {
    key: "excellent",
    min: 90,
    label: "Excellent",
    hex: "#22C55E",
    ring: "text-score-excellent",
    solidBg: "bg-score-excellent",
    softBg: "bg-score-excellent/10",
    text: "text-score-excellent-ink",
    glow: "drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]",
  },
  {
    key: "good",
    min: 75,
    label: "Good",
    hex: "#84CC16",
    ring: "text-score-good",
    solidBg: "bg-score-good",
    softBg: "bg-score-good/10",
    text: "text-score-good-ink",
    glow: "drop-shadow-[0_0_10px_rgba(132,204,22,0.5)]",
  },
  {
    key: "needs_improvement",
    min: 50,
    label: "Needs Improvement",
    hex: "#F59E0B",
    ring: "text-score-warn",
    solidBg: "bg-score-warn",
    softBg: "bg-score-warn/10",
    text: "text-score-warn-ink",
    glow: "drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]",
  },
  {
    key: "poor",
    min: 25,
    label: "Poor",
    hex: "#F97316",
    ring: "text-score-poor",
    solidBg: "bg-score-poor",
    softBg: "bg-score-poor/10",
    text: "text-score-poor-ink",
    glow: "drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]",
  },
  {
    key: "critical",
    min: 0,
    label: "Critical",
    hex: "#EF4444",
    ring: "text-score-critical",
    solidBg: "bg-score-critical",
    softBg: "bg-score-critical/10",
    text: "text-score-critical-ink",
    glow: "drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]",
  },
];

// The one place a 0–100 score becomes a band. A non-numeric score is "unknown",
// not "critical" — callers decide how to render that (usually a neutral ring),
// because painting a missing score bright red is a lie about the site.
export const scoreBand = (score) => {
  const n = Number(score);
  if (score === null || score === undefined || score === "" || !Number.isFinite(n)) return null;
  return SCORE_BANDS.find((b) => n >= b.min) || SCORE_BANDS[SCORE_BANDS.length - 1];
};

export const scoreBandLabel = (score) => scoreBand(score)?.label ?? "—";
export const scoreBandHex = (score) => scoreBand(score)?.hex ?? "#8B949E";

// Ring stroke colour + glow for CircularProgress. Unknown scores render in the
// neutral track colour rather than a status colour.
const NEUTRAL_RING = { color: "text-faint", glow: "" };
export const scoreRing = (score) => {
  const band = scoreBand(score);
  return band ? { color: band.ring, glow: band.glow } : NEUTRAL_RING;
};

// ── Status (3-level) — for per-metric cards that carry their own pass/fail ──

// Normalise every status spelling used across the app to pass | warning | fail.
export const normStatus = (status) => {
  if (status === "pass" || status === "good") return "pass";
  if (status === "warning" || status === "needs_improvement" || status === "needs-improvement") return "warning";
  if (status === "fail" || status === "poor") return "fail";
  return null;
};

// Collapse a 0–100 score to the 3-level status vocabulary. Kept for consumers
// that genuinely need pass/warning/fail rather than a band; anything rendering
// the score itself should use scoreBand() so all five levels stay visible.
export const scoreToStatus = (score) => {
  const band = scoreBand(score);
  if (!band) return null;
  if (band.key === "excellent" || band.key === "good") return "pass";
  if (band.key === "needs_improvement") return "warning";
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

// Solid colour (theme-independent) for legend dots, glows, fills.
const SOLID = { pass: "bg-emerald-500", warning: "bg-amber-500", fail: "bg-rose-500" };
export const statusSolidBg = (status) => SOLID[normStatus(status) || "fail"];
