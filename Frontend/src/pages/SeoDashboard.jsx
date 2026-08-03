import React, { useContext, useMemo, useState } from 'react';
import {
  Plus, FileText, Hash, Share2, Braces, Eye, ExternalLink, CheckCircle2, AlertCircle,
  SlidersHorizontal, History as HistoryIcon, DownloadCloud,
} from 'lucide-react';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { Card, Button, Skeleton, EmptyState, StatusPill } from '../components/seo/SeoUI.jsx';
import SeoPageList from '../components/seo/SeoPageList.jsx';
import SeoRightRail from '../components/seo/SeoRightRail.jsx';
import NewPageModal from '../components/seo/NewPageModal.jsx';
import GeneralTab from '../components/seo/tabs/GeneralTab.jsx';
import KeywordsTab from '../components/seo/tabs/KeywordsTab.jsx';
import SocialTab from '../components/seo/tabs/SocialTab.jsx';
import SchemaTab from '../components/seo/tabs/SchemaTab.jsx';
import PreviewTab from '../components/seo/tabs/PreviewTab.jsx';
import AdvancedTab from '../components/seo/tabs/AdvancedTab.jsx';
import HistoryTab from '../components/seo/tabs/HistoryTab.jsx';
import { useSeoDashboard } from '../hooks/useSeoDashboard.js';
import { computeClientScore } from '../utils/seoScore.js';

const TABS = [
  { id: 'general', label: 'General', icon: FileText, View: GeneralTab },
  { id: 'keywords', label: 'Keywords', icon: Hash, View: KeywordsTab },
  { id: 'social', label: 'Social', icon: Share2, View: SocialTab },
  { id: 'schema', label: 'Schema', icon: Braces, View: SchemaTab },
  { id: 'advanced', label: 'Advanced', icon: SlidersHorizontal, View: AdvancedTab },
  { id: 'preview', label: 'Preview', icon: Eye, View: PreviewTab },
  { id: 'history', label: 'History', icon: HistoryIcon, View: HistoryTab },
];

const KpiStrip = ({ summary, loading, darkMode }) => {
  const kpis = [
    { label: 'Avg SEO score', value: summary?.averageSeoScore ?? '—', accent: 'text-accent' },
    { label: 'Total pages', value: summary?.pages ?? '—' },
    { label: 'Indexed', value: summary?.indexedPages ?? '—', accent: 'text-emerald-600' },
    { label: 'Missing meta', value: summary?.missingMeta ?? '—', accent: 'text-rose-600' },
    { label: 'Below 60', value: summary?.pagesWithErrors ?? '—', accent: 'text-amber-600' },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
      {kpis.map((kpi) => (
        <Card key={kpi.label} darkMode={darkMode} className="p-4">
          {loading ? (
            <Skeleton darkMode={darkMode} className="h-8 w-14" />
          ) : (
            <div className={`text-2xl font-black ${kpi.accent || (darkMode ? 'text-white' : 'text-ink')}`}>{kpi.value}</div>
          )}
          <div className={`text-[11px] uppercase tracking-wide mt-1 ${darkMode ? 'text-slate-500' : 'text-muted'}`}>
            {kpi.label}
          </div>
        </Card>
      ))}
    </div>
  );
};

/**
 * SEO management for CMS pages.
 *
 * Edits the `seo` block that already exists on every CmsContentEntry rather than
 * introducing a parallel store, so there is exactly one source of truth for a page's
 * metadata. Nothing here touches the audit pipeline — the audit scores somebody
 * else's live site; this manages ours.
 */
const SeoDashboard = () => {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === 'dark';
  const dash = useSeoDashboard();
  const [showNew, setShowNew] = useState(false);

  const { draft, activeTab } = dash;

  // Scored on the client as you type; every save replaces this with the server's
  // own result, which stays authoritative.
  const live = useMemo(
    () => (draft ? computeClientScore(draft) : { score: 0, checks: [] }),
    [draft],
  );

  const ActiveTab = TABS.find((t) => t.id === activeTab)?.View || GeneralTab;

  return (
    <div className={`w-full min-h-screen ${darkMode ? 'bg-[#0B1120] text-slate-200' : 'bg-surface text-ink'}`}>
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className={`text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-ink'}`}>
              SEO <span className="text-accent">Management</span>
            </h1>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-500' : 'text-muted'}`}>
              Titles, meta descriptions, keywords, social cards and structured data — per page.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              variant="ghost"
              darkMode={darkMode}
              onClick={dash.importSitePages}
              disabled={dash.importing}
              title="Create a CMS page for every route in the site's route table"
            >
              <DownloadCloud size={15} /> {dash.importing ? 'Importing…' : 'Import site pages'}
            </Button>
            <Button darkMode={darkMode} onClick={() => setShowNew(true)}>
              <Plus size={16} /> New page
            </Button>
          </div>
        </div>

        {dash.notice && (
          <div
            role="status"
            className={`mb-5 flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
              dash.notice.tone === 'error'
                ? 'bg-rose-500/10 text-rose-600'
                : 'bg-emerald-500/10 text-emerald-600'
            }`}
          >
            {dash.notice.tone === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            {dash.notice.message}
          </div>
        )}

        <KpiStrip summary={dash.summary} loading={dash.loadingList} darkMode={darkMode} />

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-5 items-start">
          <SeoPageList dash={dash} darkMode={darkMode} onNewPage={() => setShowNew(true)} />

          {!dash.selectedId ? (
            <Card darkMode={darkMode} className="min-h-[420px] flex items-center justify-center">
              <EmptyState
                darkMode={darkMode}
                icon={FileText}
                title="Select a page to edit"
                subtitle="Pick a page on the left, or create a new one, to manage its SEO."
              />
            </Card>
          ) : dash.loadingDraft || !draft ? (
            <Card darkMode={darkMode} className="p-6 space-y-4">
              <Skeleton darkMode={darkMode} className="h-8 w-1/3" />
              <Skeleton darkMode={darkMode} className="h-32 w-full" />
              <Skeleton darkMode={darkMode} className="h-32 w-full" />
            </Card>
          ) : (
            <div className="space-y-5">
              <Card darkMode={darkMode} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className={`text-xl font-bold truncate ${darkMode ? 'text-white' : 'text-ink'}`}>
                      {draft.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <StatusPill status={draft.status} />
                      <span className={`inline-flex items-center gap-1 text-xs ${darkMode ? 'text-slate-500' : 'text-muted'}`}>
                        <ExternalLink size={12} /> {draft.path || `/${draft.slug}`}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-5 items-start">
                <Card darkMode={darkMode} className="overflow-hidden">
                  <div className={`flex items-center gap-1 px-3 pt-3 overflow-x-auto border-b ${darkMode ? 'border-slate-800' : 'border-line'}`}>
                    {TABS.map((tab) => {
                      const TabIcon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => dash.setActiveTab(tab.id)}
                          aria-current={activeTab === tab.id ? 'true' : undefined}
                          className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-sm font-semibold rounded-t-lg whitespace-nowrap transition-colors border-b-2 -mb-px ${
                            activeTab === tab.id
                              ? 'border-accent text-accent'
                              : `border-transparent ${darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-muted hover:text-ink'}`
                          }`}
                        >
                          <TabIcon size={15} /> {tab.label}
                        </button>
                      );
                    })}
                  </div>
                  <div className="p-5">
                    {activeTab === 'history'
                      ? <HistoryTab dash={dash} darkMode={darkMode} />
                      : <ActiveTab draft={draft} setSeo={dash.setSeo} darkMode={darkMode} />}
                  </div>
                </Card>

                <SeoRightRail
                  onDelete={dash.removePage}
                  pageTitle={draft.title}
                  live={live}
                  dirty={dash.dirty}
                  saving={dash.saving}
                  onSave={dash.save}
                  onRevert={dash.revert}
                  darkMode={darkMode}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showNew && (
        <NewPageModal darkMode={darkMode} onClose={() => setShowNew(false)} onCreate={dash.createPage} />
      )}
    </div>
  );
};

export default SeoDashboard;
