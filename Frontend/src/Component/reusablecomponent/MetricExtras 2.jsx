import React from "react";
// Reason banner shown inside a card when a metric could not be measured at all
// (backend returned a `notCalculated()` result flagged meta.notScored).
export const NotCalculatedNote = ({ metric, darkMode }) => (
  <div className={`p-4 rounded-xl border ${darkMode ? "bg-amber-900/10 border-amber-800/30" : "bg-amber-50 border-amber-100"}`}>
    <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-1 ${darkMode ? "text-amber-400" : "text-amber-600"}`}>Why this wasn't calculated</p>
    <p className={`text-xs leading-relaxed ${darkMode ? "text-amber-200/80" : "text-amber-700"}`}>{metric?.details || metric?.meta?.reason}</p>
    {metric?.analysis?.recommendation && (
      <p className={`text-[11px] mt-2 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{metric.analysis.recommendation}</p>
    )}
  </div>
);

// The "affected files/elements" list shown inside a card — same styling the
// Compression / Caching / Render-Blocking cards use for their resource lists.
export const AffectedList = ({ title, items, darkMode, renderLabel, renderBadge }) => {
  if (!items || items.length === 0) return null;
  return (
    <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-700/50" : "bg-gray-50/50 border-gray-100"}`}>
      <p className={`text-[10px] fontsemibold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>{title}</p>
      <div className="flex flex-col gap-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center gap-2">
            <p className={`text-[10px] truncate max-w-[70%] font-mono ${darkMode ? "text-gray-300" : "text-gray-600"}`} title={typeof item === "string" ? item : (item.src || item.text || "")}>
              {renderLabel(item)}
            </p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${darkMode ? "bg-rose-900/20 text-rose-400" : "bg-rose-100 text-rose-600"}`}>
              {renderBadge(item)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
