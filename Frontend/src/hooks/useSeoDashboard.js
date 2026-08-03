import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { SEO_CONFIGS } from '../config/seoConfig.js';

const BLANK_SEO = {
  title: '', description: '', keywords: [], canonicalUrl: '',
  noIndex: false, noFollow: false,
  ogTitle: '', ogDescription: '', ogImage: null, ogType: 'website',
  twitterCard: 'summary_large_image', structuredData: null,
  keywordSeo: {
    primaryKeyword: '', secondaryKeywords: [], relatedKeywords: [],
    density: 0, position: 0, searchIntent: '',
    presence: { title: false, description: false, slug: false, excerpt: false },
  },
  schemas: [],
  advanced: {
    hreflang: [], language: 'en',
    pageRedirect: { type: null, target: '' },
    headerScripts: '', footerScripts: '',
  },
};

/** Deep-merge a loaded seo block over the blanks so no nested field is undefined. */
const hydrateSeo = (seo = {}) => ({
  ...BLANK_SEO,
  ...seo,
  keywordSeo: { ...BLANK_SEO.keywordSeo, ...(seo.keywordSeo || {}),
    presence: { ...BLANK_SEO.keywordSeo.presence, ...(seo.keywordSeo?.presence || {}) } },
  advanced: { ...BLANK_SEO.advanced, ...(seo.advanced || {}),
    pageRedirect: { ...BLANK_SEO.advanced.pageRedirect, ...(seo.advanced?.pageRedirect || {}) } },
  schemas: Array.isArray(seo.schemas) ? seo.schemas : [],
});

/**
 * All data/state for the SEO dashboard.
 *
 * The editor works on a local `draft` so typing never round-trips to the server;
 * `dirty` is a plain JSON comparison against the last saved copy, which is honest
 * about "did anything actually change" in a way a boolean set on every keystroke
 * is not (edit a field, undo the edit, and the Save button correctly goes quiet).
 */
export const useSeoDashboard = () => {
  const { apiFetch } = useAuth();

  const [summary, setSummary] = useState(null);
  const [pages, setPages] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState(null);

  const [selectedId, setSelectedId] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(null);
  const [serverChecks, setServerChecks] = useState([]);
  const [loadingDraft, setLoadingDraft] = useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [notice, setNotice] = useState(null);
  const [revisions, setRevisions] = useState([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [importing, setImporting] = useState(false);

  // Guards against a slow response for an earlier selection overwriting a newer one.
  const requestRef = useRef(0);

  const dirty = !!draft && !!saved && JSON.stringify(draft.seo) !== JSON.stringify(saved.seo);

  const flash = useCallback((message, tone = 'success') => {
    setNotice({ message, tone });
    setTimeout(() => setNotice(null), 3500);
  }, []);

  const loadSummary = useCallback(async () => {
    const { ok, data } = await apiFetch('/api/v1/seo/summary');
    if (ok) setSummary(data.data);
  }, [apiFetch]);

  const loadPages = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    const qs = new URLSearchParams();
    if (search.trim()) qs.set('search', search.trim());
    if (status) qs.set('status', status);
    const { ok, data } = await apiFetch(`/api/v1/seo/pages?${qs.toString()}`);
    if (ok) setPages(data.data.pages || []);
    else setListError(data?.message || 'Could not load pages.');
    setLoadingList(false);
  }, [apiFetch, search, status]);

  const loadPage = useCallback(async (id) => {
    if (!id) return;
    const ticket = ++requestRef.current;
    setLoadingDraft(true);
    const { ok, data } = await apiFetch(`/api/v1/seo/pages/${id}`);
    if (ticket !== requestRef.current) return; // a newer selection won
    if (ok) {
      const page = { ...data.data.page, seo: hydrateSeo(data.data.page.seo) };
      setDraft(page);
      setSaved(JSON.parse(JSON.stringify(page)));
      setServerChecks(data.data.checks || []);
    } else {
      flash(data?.message || 'Could not load that page.', 'error');
    }
    setLoadingDraft(false);
  }, [apiFetch, flash]);

  // Debounced so typing in the search box doesn't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => { loadPages(); }, 250);
    return () => clearTimeout(t);
  }, [loadPages]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => { if (selectedId) loadPage(selectedId); }, [selectedId, loadPage]);

  /** Set one leaf of the seo block. */
  const setSeo = useCallback((key, value) => {
    setDraft((d) => (d ? { ...d, seo: { ...d.seo, [key]: value } } : d));
  }, []);

  const save = useCallback(async () => {
    if (!draft || saving) return;
    setSaving(true);
    const { ok, data } = await apiFetch(`/api/v1/seo/pages/${draft._id}`, {
      method: 'PUT',
      body: JSON.stringify({ seo: draft.seo }),
    });
    if (ok) {
      const page = { ...data.data.page, seo: hydrateSeo(data.data.page.seo) };
      setDraft(page);
      setSaved(JSON.parse(JSON.stringify(page)));
      setServerChecks(data.data.checks || []);
      flash('SEO settings saved.');
      loadPages();
      loadSummary();
    } else {
      flash(data?.message || 'Save failed.', 'error');
    }
    setSaving(false);
  }, [apiFetch, draft, saving, flash, loadPages, loadSummary]);

  const createPage = useCallback(async ({ title, slug }) => {
    const { ok, data } = await apiFetch('/api/v1/seo/pages', {
      method: 'POST',
      body: JSON.stringify({ title, slug }),
    });
    if (ok) {
      flash('Page created.');
      await loadPages();
      await loadSummary();
      setSelectedId(data.data.page._id);
      return true;
    }
    flash(data?.message || 'Could not create the page.', 'error');
    return false;
  }, [apiFetch, flash, loadPages, loadSummary]);

  const revert = useCallback(() => {
    if (saved) setDraft(JSON.parse(JSON.stringify(saved)));
  }, [saved]);

  const loadRevisions = useCallback(async () => {
    if (!selectedId) return;
    setLoadingRevisions(true);
    const { ok, data } = await apiFetch(`/api/v1/seo/pages/${selectedId}/revisions`);
    setRevisions(ok ? data.data.revisions || [] : []);
    setLoadingRevisions(false);
  }, [apiFetch, selectedId]);

  // Only fetch history when the History tab is actually open — it is the one call
  // that returns snapshots, so loading it eagerly would cost every page selection.
  useEffect(() => {
    if (activeTab === 'history' && selectedId) loadRevisions();
  }, [activeTab, selectedId, loadRevisions]);

  const rollback = useCallback(async (version) => {
    if (!selectedId) return;
    const { ok, data } = await apiFetch(`/api/v1/seo/pages/${selectedId}/rollback/${version}`, {
      method: 'POST',
    });
    if (ok) {
      const page = { ...data.data.page, seo: hydrateSeo(data.data.page.seo) };
      setDraft(page);
      setSaved(JSON.parse(JSON.stringify(page)));
      flash(data.message || `Rolled back to version ${version}.`);
      loadRevisions();
      loadPages();
      loadSummary();
    } else {
      flash(data?.message || 'Rollback failed.', 'error');
    }
  }, [apiFetch, selectedId, flash, loadRevisions, loadPages, loadSummary]);

  /**
   * Seed the CMS from the site's own route table. Only `exact` routes are sent —
   * a `prefix` route like /report is a template for many URLs, not one page, so
   * importing it would create an entry that matches nothing in particular.
   */
  const importSitePages = useCallback(async () => {
    setImporting(true);
    const routes = SEO_CONFIGS
      .filter((c) => c.exact)
      .map(({ path, title, description, keywords, noindex }) => ({ path, title, description, keywords, noindex }));
    const { ok, data } = await apiFetch('/api/v1/seo/pages/import', {
      method: 'POST',
      body: JSON.stringify({ routes }),
    });
    if (ok) {
      flash(data.message || 'Site pages imported.');
      await loadPages();
      await loadSummary();
    } else {
      flash(data?.message || 'Import failed.', 'error');
    }
    setImporting(false);
  }, [apiFetch, flash, loadPages, loadSummary]);

  const removePage = useCallback(async () => {
    if (!selectedId) return;
    const { ok, data } = await apiFetch(`/api/v1/seo/pages/${selectedId}`, { method: 'DELETE' });
    if (ok) {
      flash('Page deleted.');
      setSelectedId(null);
      setDraft(null);
      setSaved(null);
      loadPages();
      loadSummary();
    } else {
      flash(data?.message || 'Could not delete the page.', 'error');
    }
  }, [apiFetch, selectedId, flash, loadPages, loadSummary]);

  return {
    summary, pages, loadingList, listError,
    selectedId, setSelectedId, draft, setSeo, dirty, saving, loadingDraft, serverChecks,
    search, setSearch, status, setStatus,
    activeTab, setActiveTab,
    revisions, loadingRevisions, rollback, removePage,
    importSitePages, importing,
    notice, save, revert, createPage, reload: loadPages,
  };
};

export default useSeoDashboard;
