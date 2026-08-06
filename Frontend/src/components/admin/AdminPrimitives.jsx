import React from 'react';
import { Download, RefreshCw, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { rampAt, fmtNumber, pct } from './adminViz.js';

/**
 * The pieces every admin analytics tab is built from.
 *
 * Extracted here rather than repeated per tab so the three tabs cannot drift into
 * three slightly different tables with three slightly different empty states —
 * and so the styling stays in step with AdminDashboard's existing cards, which is
 * what these deliberately mirror.
 */

export const Card = ({ title, subtitle, action, darkMode, className = '', children }) => (
  <div
    className={`border rounded-2xl p-6 ${
      darkMode ? 'bg-[#111111] border-white/5' : 'bg-card border-line shadow-sm'
    } ${className}`}
  >
    {(title || action) && (
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          {title && (
            <h3 className={`text-[10px] font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-muted'}`}>
              {title}
            </h3>
          )}
          {subtitle && (
            <p className={`text-[10px] mt-1 ${darkMode ? 'text-gray-600' : 'text-faint'}`}>{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    )}
    {children}
  </div>
);

/**
 * A single number with its label.
 *
 * Deliberately not a chart: one value has no shape to show, and a sparkline or
 * donut around a single figure adds ink without adding information.
 */
export const StatTile = ({ label, value, hint, tone = 'default', icon: Icon, darkMode }) => {
  const toneInk = {
    default: darkMode ? 'text-white' : 'text-ink',
    good: 'text-emerald-500',
    bad: 'text-rose-500',
    warn: 'text-amber-500',
  }[tone];

  return (
    <div className={`border rounded-2xl p-5 flex flex-col justify-between ${darkMode ? 'bg-[#111111] border-white/5' : 'bg-card border-line shadow-sm'}`}>
      <div className="flex justify-between items-start gap-2">
        <p className={`text-[10px] font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-faint'}`}>
          {label}
        </p>
        {Icon && <Icon size={15} className={darkMode ? 'text-gray-600' : 'text-faint'} />}
      </div>
      <div className="mt-3">
        <h3 className={`text-2xl font-black ${toneInk}`}>{value}</h3>
        {hint && (
          <p className={`text-[10px] font-semibold mt-1 ${darkMode ? 'text-gray-500' : 'text-muted'}`}>{hint}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Horizontal magnitude list — top countries, top browsers, top sites.
 *
 * A bar list rather than a pie: comparing lengths against a shared baseline is
 * something people do accurately, comparing angles is not, and this shape also
 * carries the label and the exact count as text, so the colour is reinforcement
 * rather than the only channel.
 */
export const BarList = ({ items, total, darkMode, emptyText = 'No data yet.', renderLabel }) => {
  if (!items?.length) {
    return <div className={`text-center py-8 text-[11px] ${darkMode ? 'text-gray-600' : 'text-faint'}`}>{emptyText}</div>;
  }
  const max = Math.max(...items.map((i) => i.count), 1);
  const whole = total ?? items.reduce((a, b) => a + b.count, 0);

  return (
    <div className="space-y-3.5">
      {items.map((item, i) => (
        <div key={`${item.name}-${i}`} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <span className={`text-[11px] font-semibold truncate ${darkMode ? 'text-gray-200' : 'text-inksoft'}`}>
              {renderLabel ? renderLabel(item) : item.name}
            </span>
            {/* Count AND share as text: the bar shows the shape, these give the
                exact value without a hover, and keep the row readable if colour
                is unavailable. */}
            <span className={`text-[10px] font-semibold shrink-0 tabular-nums ${darkMode ? 'text-gray-400' : 'text-muted'}`}>
              {fmtNumber(item.count)}
              <span className={darkMode ? 'text-gray-600' : 'text-faint'}> · {pct(item.count, whole)}%</span>
            </span>
          </div>
          <div className={`h-1.5 w-full rounded-full ${darkMode ? 'bg-white/5' : 'bg-surface-2'}`}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${(item.count / max) * 100}%`, backgroundColor: rampAt(i) }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/** Range picker shared by every analytics view. */
export const RangePicker = ({ range, onRange, from, to, onFrom, onTo, darkMode }) => (
  <div className="flex flex-wrap items-center gap-2">
    <div className={`p-1 rounded-xl flex items-center gap-1 ${darkMode ? 'bg-white/5' : 'bg-cardsoft'}`}>
      {[
        { id: '7d', label: '7D' },
        { id: '30d', label: '30D' },
        { id: '90d', label: '90D' },
        { id: 'all', label: 'All' },
      ].map((r) => (
        <button
          key={r.id}
          onClick={() => onRange(r.id)}
          className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all ${
            range === r.id && !from && !to
              ? 'bg-accent text-white shadow-sm'
              : darkMode
                ? 'text-gray-500 hover:text-white hover:bg-white/5'
                : 'text-muted hover:text-ink hover:bg-card'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>

    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-surface-2'}`}>
      <input
        type="date" aria-label="From" value={from} max={to || undefined}
        onChange={(e) => onFrom(e.target.value)}
        className={`bg-transparent text-[11px] font-semibold outline-none ${darkMode ? 'text-white' : 'text-ink'}`}
      />
      <span className={`text-[10px] ${darkMode ? 'text-gray-600' : 'text-faint'}`}>to</span>
      <input
        type="date" aria-label="To" value={to} min={from || undefined}
        onChange={(e) => onTo(e.target.value)}
        className={`bg-transparent text-[11px] font-semibold outline-none ${darkMode ? 'text-white' : 'text-ink'}`}
      />
      {(from || to) && (
        <button
          onClick={() => { onFrom(''); onTo(''); }}
          title="Clear date range"
          className={`p-1 rounded-lg ${darkMode ? 'text-gray-500 hover:text-white hover:bg-white/10' : 'text-faint hover:text-ink hover:bg-card'}`}
        >
          <X size={12} />
        </button>
      )}
    </div>
  </div>
);

export const SearchBox = ({ value, onChange, placeholder, darkMode, className = '' }) => (
  <div className={`relative ${className}`}>
    <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-muted'}`} size={15} />
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full pl-10 pr-8 py-2.5 rounded-xl text-xs border border-transparent focus:border-accent focus:outline-none transition-all ${
        darkMode ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-surface-2 text-ink placeholder:text-faint'
      }`}
    />
    {value && (
      <button
        onClick={() => onChange('')}
        className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg ${darkMode ? 'text-gray-500 hover:text-white' : 'text-faint hover:text-ink'}`}
      >
        <X size={12} />
      </button>
    )}
  </div>
);

export const Select = ({ value, onChange, options, darkMode, ariaLabel }) => (
  <select
    aria-label={ariaLabel}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className={`px-3 py-2.5 rounded-xl text-xs font-semibold border border-transparent focus:border-accent focus:outline-none cursor-pointer ${
      darkMode ? 'bg-white/5 text-white' : 'bg-surface-2 text-ink'
    }`}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value}>{o.label}</option>
    ))}
  </select>
);

/**
 * CSV export button.
 *
 * The count in the label is the point: it tells the admin exactly how many rows
 * they are about to download, so an export can never quietly disagree with the
 * table it was clicked from.
 */
export const ExportButton = ({ onClick, busy, count, label = 'Export CSV' }) => (
  <button
    onClick={onClick}
    disabled={busy || count === 0}
    title={count === 0 ? 'Nothing to export for these filters' : `Download these ${count} rows as CSV`}
    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-accent hover:bg-accenthover text-white shadow-md shadow-accent/20 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
  >
    {busy
      ? <><RefreshCw size={13} className="animate-spin" /> Exporting…</>
      : <><Download size={13} /> {label}{count != null ? ` (${fmtNumber(count)})` : ''}</>}
  </button>
);

export const Pagination = ({ page, totalPages, total, limit, onPage, darkMode }) => {
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);
  return (
    <div className={`px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 ${darkMode ? 'border-white/5' : 'border-line'}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-muted'}`}>
        Showing <span className={darkMode ? 'text-white' : 'text-ink'}>{fmtNumber(first)}</span>–
        <span className={darkMode ? 'text-white' : 'text-ink'}>{fmtNumber(last)}</span> of {fmtNumber(total)}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className={`p-2 rounded-lg border text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-line hover:bg-cardsoft'}`}
        >
          <ChevronLeft size={14} />
        </button>
        <span className={`text-[10px] font-semibold px-2 ${darkMode ? 'text-gray-400' : 'text-muted'}`}>
          {page} / {Math.max(1, totalPages)}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className={`p-2 rounded-lg border text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-colors ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-line hover:bg-cardsoft'}`}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

/** Status pill. Carries the WORD as well as the colour — never colour alone. */
export const StatusPill = ({ status }) => {
  const map = {
    success: ['Completed', 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'],
    failed: ['Failed', 'bg-rose-500/10 text-rose-500 border-rose-500/20'],
    cancelled: ['Cancelled', 'bg-gray-500/10 text-gray-500 border-gray-500/20'],
    queued: ['Queued', 'bg-amber-500/10 text-amber-500 border-amber-500/20'],
    running: ['Running', 'bg-blue-500/10 text-blue-500 border-blue-500/20'],
    pending: ['Pending', 'bg-amber-500/10 text-amber-500 border-amber-500/20'],
    SUCCESS: ['Success', 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'],
    FAILURE: ['Failure', 'bg-rose-500/10 text-rose-500 border-rose-500/20'],
  };
  const [label, cls] = map[status] || [status || 'Unknown', 'bg-gray-500/10 text-gray-500 border-gray-500/20'];
  return (
    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border whitespace-nowrap ${cls}`}>
      {label}
    </span>
  );
};

/** Yes/no cell that reads as text, not as a coloured dot. */
export const YesNo = ({ value, whenTrue = 'Yes', whenFalse = 'No', darkMode }) => (
  <span className={`text-[10px] font-bold ${value ? 'text-emerald-500' : darkMode ? 'text-gray-600' : 'text-faint'}`}>
    {value ? whenTrue : whenFalse}
  </span>
);

export const TableShell = ({ darkMode, children, className = '' }) => (
  <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-[#111111] border-white/5' : 'bg-card border-line shadow-sm'} ${className}`}>
    {children}
  </div>
);

export const LoadingRow = ({ colSpan, label = 'Loading records…' }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-14 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{label}</p>
      </div>
    </td>
  </tr>
);

export const EmptyRow = ({ colSpan, icon: Icon, label = 'No records found' }) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-14 text-center">
      <div className="flex flex-col items-center gap-3 opacity-25">
        {Icon && <Icon size={44} />}
        <p className="text-sm font-black uppercase tracking-widest">{label}</p>
      </div>
    </td>
  </tr>
);
