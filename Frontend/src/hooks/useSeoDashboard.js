import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';

const BLANK_SEO = {
  title: '', description: '', keywords: [], canonicalUrl: '',
  noIndex: false, noFollow: false,
  ogTitle: '', ogDescription: '', ogImage: null, ogType: 'website',
  twitterCard: 'summary_large_image', structuredData: null,
};

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

  // Guards against a slow response for an earlier selection overwriting a newer one.
  const requestRef = useRef(0);

  const dirty = !!draft && !!saved && JSON.stringify(draft.seo) !== JSON.stringify(saved.seo);

  const flash = useCallback((message, tone = 'success') => {
    setNotice({ message, tone });
    setTimeout(() => setNotice(null), 3500);
  }, []);

  const loadSummary = useCallback(async () => {
    const { ok, data } = await apiFetch('/api/cms/seo/summary');
    if (ok) setSummary(data.data);
  }, [apiFetch]);

  const loadPages = useCallback(async () => {
    setLoadingList(true);
    setListError(null);
    const qs = new URLSearchParams();
    if (search.trim()) qs.set('search', search.trim());
    if (status) qs.set('status', status);
    const { ok, data } = await apiFetch(`/api/cms/seo/pages?${qs.toString()}`);
    if (ok) setPages(data.data.pages || []);
    else setListError(data?.message || 'Could not load pages.');
    setLoadingList(false);
  }, [apiFetch, search, status]);

  const loadPage = useCallback(async (id) => {
    if (!id) return;
    const ticket = ++requestRef.current;
    setLoadingDraft(true);
    const { ok, data } = await apiFetch(`/api/cms/seo/pages/${id}`);
    if (ticket !== requestRef.current) return; // a newer selection won
    if (ok) {
      const page = { ...data.data.page, seo: { ...BLANK_SEO, ...(data.data.page.seo || {}) } };
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
    const { ok, data } = await apiFetch(`/api/cms/seo/pages/${draft._id}`, {
      method: 'PUT',
      body: JSON.stringify({ seo: draft.seo }),
    });
    if (ok) {
      const page = { ...data.data.page, seo: { ...BLANK_SEO, ...(data.data.page.seo || {}) } };
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
    const { ok, data } = await apiFetch('/api/cms/seo/pages', {
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

  return {
    summary, pages, loadingList, listError,
    selectedId, setSelectedId, draft, setSeo, dirty, saving, loadingDraft, serverChecks,
    search, setSearch, status, setStatus,
    activeTab, setActiveTab,
    notice, save, revert, createPage, reload: loadPages,
  };
};

export default useSeoDashboard;
