import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

/**
 * Shared primitives for the SEO dashboard.
 *
 * The reference implementation these are modelled on was dark-only, with hardcoded
 * hex values. Auditify has a light/dark toggle and a semantic token set, so these
 * use the tokens (bg-card, text-ink, border-line, bg-accent …) and take `darkMode`
 * where a token has no dark equivalent. That keeps the dashboard from being the one
 * screen in the app that ignores the theme switch.
 */

export const Card = ({ darkMode, className = '', children, ...props }) => (
  <div
    className={`rounded-2xl border shadow-sm ${
      darkMode ? 'bg-[#111827] border-slate-800' : 'bg-card border-line'
    } ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const Button = ({ variant = 'primary', darkMode, className = '', children, ...props }) => {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-accent hover:bg-accenthover text-white shadow-sm',
    ghost: darkMode
      ? 'bg-white/5 hover:bg-white/10 text-slate-200 border border-slate-700'
      : 'bg-cardsoft hover:bg-surface-2 text-ink border border-line',
    danger: 'bg-rose-500/90 hover:bg-rose-500 text-white',
    subtle: darkMode
      ? 'bg-transparent hover:bg-white/5 text-slate-400 hover:text-slate-200'
      : 'bg-transparent hover:bg-cardsoft text-muted hover:text-ink',
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export const Field = ({ label, hint, darkMode, children, right }) => (
  <label className="block space-y-1.5">
    <div className="flex items-center justify-between gap-3">
      <span className={`text-xs font-semibold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
        {label}
      </span>
      {right}
    </div>
    {children}
    {hint && <p className={`text-[11px] ${darkMode ? 'text-slate-500' : 'text-faint'}`}>{hint}</p>}
  </label>
);

const inputBase = (darkMode) =>
  `w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-colors border ${
    darkMode
      ? 'bg-[#0B1120] border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-accent'
      : 'bg-cardsoft border-line text-ink placeholder:text-faint focus:border-accent'
  } focus:ring-2 focus:ring-accent/20`;

export const TextInput = ({ darkMode, className = '', ...props }) => (
  <input className={`${inputBase(darkMode)} ${className}`} {...props} />
);

export const Select = ({ darkMode, className = '', children, ...props }) => (
  <select className={`${inputBase(darkMode)} cursor-pointer ${className}`} {...props}>
    {children}
  </select>
);

/** Colour of the character counter: amber under range, rose over, emerald inside. */
const counterTone = (len, recommended) => {
  if (!recommended) return 'text-faint';
  const [min, max] = recommended;
  if (len === 0) return 'text-faint';
  if (len < min) return 'text-amber-500';
  if (len > max) return 'text-rose-500';
  return 'text-emerald-500';
};

const Counter = ({ len, recommended }) =>
  recommended ? (
    <div className={`mt-1 text-right text-[11px] font-semibold ${counterTone(len, recommended)}`}>
      {len} / {recommended[1]}
      {len >= recommended[0] && len <= recommended[1] ? ' · ideal' : ''}
    </div>
  ) : null;

export const CounterInput = ({ value = '', recommended, darkMode, ...props }) => (
  <div>
    <input value={value} className={inputBase(darkMode)} {...props} />
    <Counter len={(value || '').length} recommended={recommended} />
  </div>
);

export const CounterTextArea = ({ value = '', recommended, rows = 3, darkMode, ...props }) => (
  <div>
    <textarea value={value} rows={rows} className={`${inputBase(darkMode)} resize-y leading-relaxed`} {...props} />
    <Counter len={(value || '').length} recommended={recommended} />
  </div>
);

export const Toggle = ({ checked, onChange, label, darkMode }) => (
  <button type="button" onClick={() => onChange(!checked)} className="inline-flex items-center gap-2.5">
    <span
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
        checked ? 'bg-emerald-500' : darkMode ? 'bg-slate-700' : 'bg-line'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </span>
    {label && <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-inksoft'}`}>{label}</span>}
  </button>
);

/** Chip input — Enter adds, duplicates are ignored. value: string[] */
export const TagInput = ({ value = [], onChange, darkMode, placeholder = 'Type and press Enter' }) => {
  const [draft, setDraft] = useState('');
  const add = () => {
    const v = draft.trim();
    if (v && !value.includes(v)) onChange([...value, v]);
    setDraft('');
  };
  return (
    <div
      className={`rounded-xl border px-2.5 py-2 flex flex-wrap gap-2 focus-within:border-accent ${
        darkMode ? 'bg-[#0B1120] border-slate-700' : 'bg-cardsoft border-line'
      }`}
    >
      {value.map((tag, i) => (
        <span
          key={tag}
          className={`inline-flex items-center gap-1 rounded-lg text-xs px-2 py-1 ${
            i === 0 ? 'bg-accent/15 text-accent font-semibold' : darkMode ? 'bg-white/10 text-slate-300' : 'bg-surface-2 text-inksoft'
          }`}
          title={i === 0 ? 'Focus keyword — the first keyword is scored against the title and slug' : undefined}
        >
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`}>
            <X size={12} />
          </button>
        </span>
      ))}
      <div className="flex items-center gap-1 flex-1 min-w-[140px]">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder={placeholder}
          className={`flex-1 bg-transparent text-sm outline-none py-1 ${
            darkMode ? 'text-slate-100 placeholder:text-slate-600' : 'text-ink placeholder:text-faint'
          }`}
        />
        {draft && (
          <button type="button" onClick={add} aria-label="Add keyword" className="text-muted hover:text-accent">
            <Plus size={14} />
          </button>
        )}
      </div>
    </div>
  );
};

const statusStyles = {
  indexed: 'bg-emerald-500/15 text-emerald-600',
  not_indexed: 'bg-slate-500/15 text-slate-500',
  excluded: 'bg-rose-500/15 text-rose-600',
  ok: 'bg-emerald-500/15 text-emerald-600',
  missing: 'bg-rose-500/15 text-rose-600',
  published: 'bg-emerald-500/15 text-emerald-600',
  draft: 'bg-amber-500/15 text-amber-600',
  scheduled: 'bg-blue-500/15 text-blue-600',
  archived: 'bg-slate-500/15 text-slate-500',
};

export const StatusPill = ({ status }) => (
  <span
    className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${
      statusStyles[status] || 'bg-slate-500/15 text-slate-500'
    }`}
  >
    {(status || '').replace('_', ' ')}
  </span>
);

export const Skeleton = ({ darkMode, className = '' }) => (
  <div className={`animate-pulse rounded-xl ${darkMode ? 'bg-white/5' : 'bg-surface-2'} ${className}`} />
);

export const EmptyState = ({ icon: Icon, title, subtitle, action, darkMode }) => (
  <div className="flex flex-col items-center justify-center text-center py-16 px-6">
    {Icon && (
      <div
        className={`mb-4 h-14 w-14 rounded-2xl flex items-center justify-center ${
          darkMode ? 'bg-white/5 text-slate-500' : 'bg-surface-2 text-faint'
        }`}
      >
        <Icon size={26} />
      </div>
    )}
    <h3 className={`font-bold ${darkMode ? 'text-slate-200' : 'text-ink'}`}>{title}</h3>
    {subtitle && <p className={`text-sm mt-1 max-w-sm ${darkMode ? 'text-slate-500' : 'text-muted'}`}>{subtitle}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);
