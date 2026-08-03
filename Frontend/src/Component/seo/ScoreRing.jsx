import React from 'react';

const TONES = {
  good: '#10b981', // emerald-500
  ok: '#f59e0b',   // amber-500
  poor: '#f43f5e', // rose-500
};

/**
 * Circular 0-100 score. Pure SVG — no chart dependency, and it inherits the page
 * background rather than painting its own, so it works in both themes unchanged.
 */
const ScoreRing = ({ score = 0, size = 76, stroke = 7, darkMode, label }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const tone = clamped >= 80 ? TONES.good : clamped >= 60 ? TONES.ok : TONES.poor;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = (clamped / 100) * circumference;

  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} role="img" aria-label={`SEO score ${clamped} out of 100`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={darkMode ? '#1e293b' : '#E7E0D2'}
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={tone}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 400ms ease, stroke 300ms ease' }}
        />
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={size * 0.3}
          fontWeight="800"
          fill={darkMode ? '#fff' : '#16213E'}
        >
          {clamped}
        </text>
      </svg>
      {label && (
        <span className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-muted'}`}>
          {label}
        </span>
      )}
    </div>
  );
};

export default ScoreRing;
