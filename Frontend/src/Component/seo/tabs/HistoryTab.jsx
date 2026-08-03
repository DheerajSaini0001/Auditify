import React from 'react';
import { RotateCcw, Clock, User as UserIcon } from 'lucide-react';
import { Button, Skeleton, EmptyState } from '../SeoUI.jsx';

const ACTION_STYLES = {
  UPDATE: 'bg-blue-500/15 text-blue-600',
  CREATE: 'bg-emerald-500/15 text-emerald-600',
  ROLLBACK: 'bg-amber-500/15 text-amber-600',
  DELETE: 'bg-rose-500/15 text-rose-600',
};

const when = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return d.toLocaleDateString();
};

/**
 * The revision timeline, newest first.
 *
 * Rolling back does not rewrite history — it appends a ROLLBACK entry restoring the
 * chosen snapshot, so the action is itself auditable and reversible. The list shows
 * that entry like any other, which is why an undo of an undo reads correctly.
 */
const HistoryTab = ({ dash, darkMode }) => {
  const { revisions, loadingRevisions, rollback } = dash;

  if (loadingRevisions) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={`rev-skeleton-${i}`} darkMode={darkMode} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!revisions?.length) {
    return (
      <EmptyState
        darkMode={darkMode}
        icon={Clock}
        title="No history yet"
        subtitle="Every save records a version here. Make a change and save to start the trail."
      />
    );
  }

  const latest = revisions[0]?.version;

  return (
    <ul className="space-y-2">
      {revisions.map((rev) => {
        const isLatest = rev.version === latest;
        return (
          <li
            key={rev.version}
            className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 ${
              darkMode ? 'border-slate-800' : 'border-line'
            } ${isLatest ? 'bg-accent/5' : ''}`}
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-bold ${darkMode ? 'text-slate-100' : 'text-ink'}`}>
                  v{rev.version}
                </span>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  ACTION_STYLES[rev.action] || 'bg-slate-500/15 text-slate-500'
                }`}>
                  {rev.action}
                </span>
                {isLatest && (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-accent">current</span>
                )}
                {rev.restoredFromVersion && (
                  <span className={`text-[11px] ${darkMode ? 'text-slate-500' : 'text-muted'}`}>
                    restored v{rev.restoredFromVersion}
                  </span>
                )}
              </div>
              <div className={`text-[12px] mt-1 truncate ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
                {rev.snapshot?.seo?.title || <em>no SEO title at this version</em>}
              </div>
              <div className={`flex items-center gap-3 text-[11px] mt-1 ${darkMode ? 'text-slate-500' : 'text-faint'}`}>
                <span className="inline-flex items-center gap-1"><UserIcon size={11} /> {rev.changedByName}</span>
                <span className="inline-flex items-center gap-1"><Clock size={11} /> {when(rev.createdAt)}</span>
              </div>
            </div>

            {!isLatest && (
              <Button
                variant="ghost"
                darkMode={darkMode}
                className="!px-2.5 !py-1 !text-[11px] shrink-0"
                onClick={() => rollback(rev.version)}
              >
                <RotateCcw size={12} /> Restore
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default HistoryTab;
