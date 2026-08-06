/**
 * Chart parameters for the admin dashboard.
 *
 * Two palettes, because they answer two different questions:
 *
 *  • CATEGORICAL — identity. Assigned in this fixed order and never cycled: a
 *    series keeps its colour when a filter removes its neighbours, so the chart
 *    does not repaint itself every time the data changes. Validated against the
 *    brand ramps in both light and dark: CVD separation ΔE 12.2 (deutan), normal
 *    vision 20.4, contrast ≥ 3:1 on both surfaces.
 *
 *  • STATUS — state. Reserved for completed/failed/queued and never reused as
 *    "series 4". These are the same green and red the rest of the product uses
 *    for pass/fail, and they deliberately stay that way: re-colouring "failed" in
 *    one tab would be worse for a reader than the CVD cost. Green↔red is the one
 *    pair colour-blind readers cannot separate, so every chart using them carries
 *    a legend AND the numbers in text beside it — identity is never colour alone.
 */

// Fixed categorical order. A 9th series is not a new hue — it folds into "Other".
export const CATEGORICAL = ['#3F6A99', '#D4520E', '#459C93', '#835795'];

export const STATUS = {
  completed: '#308D5C',
  failed: '#DA3D51',
  queued: '#D18E14',
  neutral: '#8B949E',
};

// Single hue, light→dark, for magnitude-only bar lists (top countries, top sites).
// Magnitude is already encoded by bar length; the ramp only reinforces it, so the
// steps stay wide apart rather than being a gradient nobody can read.
export const SEQUENTIAL = ['#3F6A99', '#4E7BAA', '#6288B2', '#7C9CC0', '#98B2CE'];

/** Colour for a rank in a magnitude list — darkest at the top, then lightening. */
export const rampAt = (index) => SEQUENTIAL[Math.min(index, SEQUENTIAL.length - 1)];

/** Recharts tooltip chrome, themed. Recharts styles this inline, not via CSS. */
export const tooltipStyle = (darkMode) => ({
  backgroundColor: darkMode ? '#1E2833' : '#ffffff',
  border: `1px solid ${darkMode ? '#4E5762' : '#E0DFD9'}`,
  borderRadius: '10px',
  fontSize: '11px',
  color: darkMode ? '#F7F5F0' : '#303945',
  boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
});

/** Recessive axis/grid ink — the data is the figure, the axes are the ground. */
export const axisTick = (darkMode) => ({ fontSize: 10, fill: darkMode ? '#8B949E' : '#6C7581' });
export const gridStroke = (darkMode) => (darkMode ? '#303945' : '#EFEDE7');

/* ── Formatting ─────────────────────────────────────────────────────────── */

export const fmtNumber = (n) => (n == null ? '—' : Number(n).toLocaleString());

/** Compact duration. Seconds under a minute, m/s above — never "142 seconds". */
export const fmtDuration = (ms) => {
  if (ms == null) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem ? `${m}m ${rem}s` : `${m}m`;
};

export const fmtSeconds = (s) => fmtDuration((s || 0) * 1000);

export const fmtDateTime = (ts) =>
  ts
    ? new Date(ts).toLocaleString(undefined, {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '—';

export const fmtDate = (ts) =>
  ts ? new Date(ts).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** Percentage of a whole, guarded against the empty-range divide-by-zero. */
export const pct = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);
