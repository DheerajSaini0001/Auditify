import React from 'react';
import { Search, FileText, Plus } from 'lucide-react';
import { Card, TextInput, Select, Skeleton, EmptyState, Button, StatusPill } from './SeoUI.jsx';

const scoreTone = (n) =>
  n >= 80 ? 'text-emerald-600 bg-emerald-500/10'
    : n >= 60 ? 'text-amber-600 bg-amber-500/10'
      : 'text-rose-600 bg-rose-500/10';

/** Left column: search, status filter, and the selectable page list. */
const SeoPageList = ({ dash, darkMode, onNewPage }) => {
  const { pages, loadingList, listError, selectedId, setSelectedId, search, setSearch, status, setStatus } = dash;

  return (
    <Card darkMode={darkMode} className="p-4 h-fit lg:sticky lg:top-4">
      <div className="space-y-2.5 mb-4">
        <div className="relative">
          <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-500' : 'text-faint'}`} />
          <TextInput
            darkMode={darkMode}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search pages…"
            className="!pl-9"
          />
        </div>
        <Select darkMode={darkMode} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </Select>
      </div>

      {loadingList ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={`page-skeleton-${i}`} darkMode={darkMode} className="h-14 w-full" />
          ))}
        </div>
      ) : listError ? (
        <p className="text-sm text-rose-500 py-6 text-center">{listError}</p>
      ) : pages.length === 0 ? (
        <EmptyState
          darkMode={darkMode}
          icon={FileText}
          title={search || status ? 'No matching pages' : 'No pages yet'}
          subtitle={
            search || status
              ? 'Try a different search or clear the status filter.'
              : 'Create your first page to start managing its SEO.'
          }
          action={
            !search && !status ? (
              <Button darkMode={darkMode} onClick={onNewPage}>
                <Plus size={15} /> New page
              </Button>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-0.5">
          {pages.map((p) => {
            const active = p._id === selectedId;
            return (
              <li key={p._id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(p._id)}
                  aria-current={active ? 'true' : undefined}
                  className={`w-full text-left rounded-xl px-3 py-2.5 border transition-colors ${
                    active
                      ? 'border-accent bg-accent/10'
                      : darkMode
                        ? 'border-transparent hover:bg-white/5'
                        : 'border-transparent hover:bg-cardsoft'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className={`text-sm font-semibold leading-snug line-clamp-2 ${darkMode ? 'text-slate-100' : 'text-ink'}`}>
                      {p.seo?.title || p.title}
                    </span>
                    <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${scoreTone(p.seoScore)}`}>
                      {p.seoScore}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <StatusPill status={p.status} />
                    {p.metaStatus === 'missing' && <StatusPill status="missing" />}
                  </div>
                  <div className={`text-[11px] mt-1 truncate ${darkMode ? 'text-slate-500' : 'text-faint'}`}>
                    {p.path || `/${p.slug}`}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

export default SeoPageList;
