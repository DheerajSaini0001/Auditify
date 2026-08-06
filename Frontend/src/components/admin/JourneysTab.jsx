import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe, Monitor, MapPin, Clock, Eye, Download, X, User as UserIcon,
  ShieldAlert, ExternalLink, Fingerprint, Route,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  Card, SearchBox, Select, ExportButton, Pagination, StatusPill, YesNo,
  TableShell, LoadingRow, EmptyRow, RangePicker,
} from './AdminPrimitives.jsx';
import { fmtNumber, fmtDuration, fmtDateTime } from './adminViz.js';

const PAGE_SIZE = 25;

/**
 * User Journey tab.
 *
 * One row per audit, carrying the whole journey: who ran it, from where, on what
 * device, which site (and its detected category), when it started and finished,
 * how long it took, how it ended, and whether the report was ever read or
 * downloaded. Clicking a row opens the full session timeline around it.
 */
const JourneysTab = ({ darkMode }) => {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [siteType, setSiteType] = useState('');
  const [device, setDevice] = useState('');
  const [viewed, setViewed] = useState('');
  const [downloaded, setDownloaded] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [range, setRange] = useState('30d');

  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /**
   * Built once and shared by the table and the export, so a downloaded file can
   * never hold a different slice of data than the screen it came from.
   */
  const filterParams = useCallback(() => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (status) p.set('status', status);
    if (siteType) p.set('siteType', siteType);
    if (device) p.set('device', device);
    if (viewed) p.set('viewed', viewed);
    if (downloaded) p.set('downloaded', downloaded);
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    return p;
  }, [search, status, siteType, device, viewed, downloaded, from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = filterParams();
      p.set('page', page);
      p.set('limit', PAGE_SIZE);
      const { data } = await api.get(`/api/admin/journeys?${p.toString()}`);
      setRows(data.journeys || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Journeys error:', err);
      toast.error('Failed to load journeys');
    } finally {
      setLoading(false);
    }
  }, [filterParams, page]);

  // Debounced so typing in the search box does not fire a query per keystroke.
  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [load]);

  // Any filter change invalidates the current page number — staying on page 7 of
  // a result set that now has 2 pages shows an empty table that looks like "no
  // results" for a filter that actually matched plenty.
  useEffect(() => { setPage(1); }, [search, status, siteType, device, viewed, downloaded, from, to]);

  /**
   * Download the filtered journeys.
   *
   * A raw fetch rather than the shared `api` helper: that helper parses every
   * response as JSON, which would turn the CSV body into a parse failure. The
   * blob + object-URL dance is what lets an authenticated fetch produce a file
   * download — a plain <a href> could not carry the bearer token.
   */
  const handleExport = async () => {
    setExporting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
      const token = localStorage.getItem('dealerpulse_token');
      const res = await fetch(`${API_URL}/api/admin/journeys/export?${filterParams().toString()}`, {
        credentials: 'include',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Export failed (${res.status})`);
      }
      const disposition = res.headers.get('Content-Disposition') || '';
      const named = disposition.match(/filename="?([^"]+)"?/);
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = named ? named[1] : 'user-journeys.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      toast.success('Journeys exported');
    } catch (err) {
      toast.error(err.message || 'Failed to export journeys');
    } finally {
      setExporting(false);
    }
  };

  const openDetail = async (row) => {
    setDetail({ journey: row });
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/api/admin/journeys/${row._id}`);
      setDetail(data);
    } catch {
      toast.error('Failed to load journey detail');
    } finally {
      setDetailLoading(false);
    }
  };

  // Lock the page behind the modal — a scrollable body under an open overlay
  // moves the content the reader is pointing at.
  useEffect(() => {
    document.body.style.overflow = detail ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [detail]);

  const activeFilters = [search, status, siteType, device, viewed, downloaded, from, to].filter(Boolean).length;

  return (
    <div className="space-y-5">
      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className={`border rounded-2xl p-4 space-y-3 ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-card border-line shadow-sm'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <SearchBox
            className="flex-1"
            value={search} onChange={setSearch} darkMode={darkMode}
            placeholder="Search by user, email, website, IP, city or session ID…"
          />
          <RangePicker
            range={range} onRange={(r) => { setRange(r); setFrom(''); setTo(''); }}
            from={from} to={to} onFrom={setFrom} onTo={setTo}
            darkMode={darkMode}
          />
          <ExportButton onClick={handleExport} busy={exporting} count={total} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            ariaLabel="Status" value={status} onChange={setStatus} darkMode={darkMode}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'success', label: 'Completed' },
              { value: 'failed', label: 'Failed' },
              { value: 'cancelled', label: 'Cancelled' },
              { value: 'running,queued,pending', label: 'In flight' },
            ]}
          />
          <Select
            ariaLabel="Website category" value={siteType} onChange={setSiteType} darkMode={darkMode}
            options={[
              { value: '', label: 'All categories' },
              { value: 'dealer', label: 'Dealer' },
              { value: 'service', label: 'Service / Repair' },
              { value: 'corporate', label: 'Corporate / OEM' },
            ]}
          />
          <Select
            ariaLabel="Device" value={device} onChange={setDevice} darkMode={darkMode}
            options={[
              { value: '', label: 'All devices' },
              { value: 'Desktop', label: 'Desktop' },
              { value: 'Mobile', label: 'Mobile' },
              { value: 'Tablet', label: 'Tablet' },
            ]}
          />
          <Select
            ariaLabel="Report viewed" value={viewed} onChange={setViewed} darkMode={darkMode}
            options={[
              { value: '', label: 'Viewed: any' },
              { value: 'true', label: 'Report viewed' },
              { value: 'false', label: 'Never viewed' },
            ]}
          />
          <Select
            ariaLabel="Report downloaded" value={downloaded} onChange={setDownloaded} darkMode={darkMode}
            options={[
              { value: '', label: 'Downloaded: any' },
              { value: 'true', label: 'Report downloaded' },
              { value: 'false', label: 'Never downloaded' },
            ]}
          />
          {activeFilters > 0 && (
            <button
              onClick={() => {
                setSearch(''); setStatus(''); setSiteType(''); setDevice('');
                setViewed(''); setDownloaded(''); setFrom(''); setTo('');
              }}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-semibold transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-muted hover:text-ink hover:bg-cardsoft'}`}
            >
              <X size={12} /> Clear {activeFilters} filter{activeFilters > 1 ? 's' : ''}
            </button>
          )}
        </div>
      </div>

      {/* ── Table ───────────────────────────────────────────────────────── */}
      <TableShell darkMode={darkMode}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className={`border-b text-[9px] uppercase tracking-[0.15em] font-black ${darkMode ? 'border-white/5 text-gray-500' : 'border-line text-faint'}`}>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">Website / Category</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Device</th>
                <th className="px-5 py-4">Timing</th>
                <th className="px-5 py-4 text-center">Status</th>
                <th className="px-5 py-4 text-center">Score</th>
                <th className="px-5 py-4 text-center">Report</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-line'}`}>
              {loading ? (
                <LoadingRow colSpan={8} label="Loading journeys…" />
              ) : rows.length === 0 ? (
                <EmptyRow colSpan={8} icon={Route} label="No journeys match these filters" />
              ) : rows.map((j) => (
                <tr
                  key={j._id}
                  onClick={() => openDetail(j)}
                  className={`cursor-pointer transition-colors ${darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-cardsoft'}`}
                >
                  <td className="px-5 py-4">
                    <div className="min-w-0">
                      <p className={`text-[11px] font-bold truncate max-w-[180px] ${darkMode ? 'text-white' : 'text-ink'}`}>
                        {j.user?.name || (j.guestEmail ? 'Guest' : 'Anonymous')}
                      </p>
                      <p className={`text-[10px] truncate max-w-[180px] ${darkMode ? 'text-gray-500' : 'text-muted'}`}>
                        {j.identity}
                      </p>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Globe size={13} className="text-accent shrink-0" />
                      <div className="min-w-0">
                        <p className={`text-[11px] font-semibold truncate max-w-[220px] ${darkMode ? 'text-gray-100' : 'text-inksoft'}`} title={j.url}>
                          {String(j.url).replace(/^https?:\/\//, '')}
                        </p>
                        <p className={`text-[9px] uppercase font-bold tracking-wider capitalize ${darkMode ? 'text-gray-600' : 'text-faint'}`}>
                          {j.category}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <p className={`text-[11px] font-semibold ${darkMode ? 'text-gray-200' : 'text-inksoft'}`}>{j.country}</p>
                    <p className={`text-[9px] font-mono ${darkMode ? 'text-gray-600' : 'text-faint'}`}>
                      {j.city !== 'unknown' ? `${j.city} · ` : ''}{j.ip}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className={`text-[11px] font-semibold capitalize ${darkMode ? 'text-gray-200' : 'text-inksoft'}`}>{j.device}</p>
                    <p className={`text-[9px] truncate max-w-[130px] ${darkMode ? 'text-gray-600' : 'text-faint'}`}>
                      {j.browser} · {j.os}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <p className={`text-[10px] font-semibold ${darkMode ? 'text-gray-200' : 'text-inksoft'}`}>{fmtDateTime(j.startedAt)}</p>
                    <p className={`text-[9px] ${darkMode ? 'text-gray-600' : 'text-faint'}`}>
                      {j.completedAt ? `took ${fmtDuration(j.durationMs)}` : 'not finished'}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-center"><StatusPill status={j.status} /></td>

                  <td className="px-5 py-4 text-center">
                    <span className={`text-[12px] font-black tabular-nums ${
                      j.score == null ? (darkMode ? 'text-gray-600' : 'text-faint')
                        : j.score >= 80 ? 'text-emerald-500'
                          : j.score >= 50 ? 'text-amber-500' : 'text-rose-500'
                    }`}>
                      {j.score == null ? '—' : j.score}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {/* Icons carry a text label rather than standing alone, so
                        "viewed" and "downloaded" are readable without colour. */}
                    <div className="flex items-center justify-center gap-3">
                      <span className="flex items-center gap-1" title={j.reportViewed ? `Viewed ${j.reportViewCount}×` : 'Never opened'}>
                        <Eye size={12} className={j.reportViewed ? 'text-emerald-500' : darkMode ? 'text-gray-700' : 'text-faint'} />
                        <YesNo value={j.reportViewed} darkMode={darkMode} />
                      </span>
                      <span className="flex items-center gap-1" title={j.reportDownloaded ? `Downloaded ${j.reportDownloadCount}×` : 'Never downloaded'}>
                        <Download size={12} className={j.reportDownloaded ? 'text-emerald-500' : darkMode ? 'text-gray-700' : 'text-faint'} />
                        <YesNo value={j.reportDownloaded} darkMode={darkMode} />
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page} totalPages={totalPages} total={total} limit={PAGE_SIZE}
          onPage={setPage} darkMode={darkMode}
        />
      </TableShell>

      {/* ── Detail drawer ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {detail && (
          <JourneyDetailModal
            detail={detail}
            loading={detailLoading}
            darkMode={darkMode}
            onClose={() => setDetail(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/** Full journey: the audit, its session, and every action in that session. */
const JourneyDetailModal = ({ detail, loading, darkMode, onClose }) => {
  const j = detail.journey || {};
  const s = detail.session;

  const Field = ({ label, value, mono }) => (
    <div>
      <p className={`text-[9px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-600' : 'text-faint'}`}>{label}</p>
      <p className={`text-[11px] font-semibold mt-0.5 break-all ${mono ? 'font-mono' : ''} ${darkMode ? 'text-gray-100' : 'text-inksoft'}`}>
        {value ?? '—'}
      </p>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-4xl my-8 rounded-3xl border shadow-2xl ${darkMode ? 'bg-[#111111] border-white/10' : 'bg-card border-line'}`}
      >
        <div className={`flex items-start justify-between gap-4 p-6 border-b ${darkMode ? 'border-white/5' : 'border-line'}`}>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className={`text-base font-black truncate ${darkMode ? 'text-white' : 'text-ink'}`}>
                {String(j.url || '').replace(/^https?:\/\//, '')}
              </h3>
              <StatusPill status={j.status} />
            </div>
            <p className={`text-[11px] mt-1 ${darkMode ? 'text-gray-500' : 'text-muted'}`}>
              {j.identity} · {fmtDateTime(j.startedAt)}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {j.reportId && (
              <a
                href={`/report/${j.reportId}`} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-semibold bg-accent hover:bg-accenthover text-white transition-colors"
              >
                <ExternalLink size={12} /> Report
              </a>
            )}
            <button onClick={onClose} className={`p-2 rounded-xl ${darkMode ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-cardsoft text-muted'}`}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {j.failureReason && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <ShieldAlert size={15} className="text-rose-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-rose-500">Failure reason</p>
                <p className={`text-[11px] mt-1 ${darkMode ? 'text-gray-200' : 'text-inksoft'}`}>{j.failureReason}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            <Field label="User ID" value={j.user?._id || 'Guest'} mono />
            <Field label="Session ID" value={j.sessionId} mono />
            <Field label="IP Address" value={j.ip} mono />
            <Field label="Location" value={[j.city, j.region, j.country].filter((v) => v && v !== 'unknown').join(', ') || 'Unknown'} />
            <Field label="Browser" value={j.browser} />
            <Field label="Operating System" value={j.os} />
            <Field label="Device" value={j.device} />
            <Field label="Screen" value={j.screenResolution} />
            <Field label="Website Category" value={j.category} />
            <Field label="Page Type" value={j.pageType || 'All key pages'} />
            <Field label="Report Scope" value={j.reportType} />
            <Field label="Referrer" value={j.referrer} />
            <Field label="Started" value={fmtDateTime(j.startedAt)} />
            <Field label="Completed" value={j.completedAt ? fmtDateTime(j.completedAt) : 'Not finished'} />
            <Field label="Duration" value={fmtDuration(j.durationMs)} />
            <Field label="Queue Wait" value={j.queueWaitMs != null ? fmtDuration(j.queueWaitMs) : '—'} />
            <Field label="Final Score" value={j.score == null ? 'N/A' : `${j.score} (${j.grade || '—'})`} />
            <Field
              label="Report Viewed"
              value={j.reportViewed ? `Yes · ${j.reportViewCount}× · first ${fmtDateTime(j.reportViewedAt)}` : 'No'}
            />
            <Field
              label="Report Downloaded"
              value={j.reportDownloaded ? `Yes · ${j.reportDownloadCount}× · first ${fmtDateTime(j.reportDownloadedAt)}` : 'No'}
            />
            <Field
              label="Session Window"
              value={s ? `${fmtDateTime(s.startedAt)} → ${s.endedAt ? fmtDateTime(s.endedAt) : 'still open'}` : 'Not recorded'}
            />
          </div>

          {s && (
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-surface-2'}`}>
              <Field label="Pages Viewed" value={fmtNumber(s.pageViews)} />
              <Field label="Audits This Session" value={fmtNumber(s.auditsStarted)} />
              <Field label="Reports Read" value={fmtNumber(s.reportsViewed)} />
              <Field label="Session Length" value={s.durationMs != null ? fmtDuration(s.durationMs) : 'ongoing'} />
            </div>
          )}

          <div>
            <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-gray-500' : 'text-muted'}`}>
              Session Activity Timeline
            </h4>
            {loading ? (
              <p className={`text-[11px] ${darkMode ? 'text-gray-600' : 'text-faint'}`}>Loading timeline…</p>
            ) : !detail.timeline?.length ? (
              <p className={`text-[11px] ${darkMode ? 'text-gray-600' : 'text-faint'}`}>
                No other activity recorded for this session.
              </p>
            ) : (
              <div className="space-y-0 max-h-72 overflow-y-auto pr-2">
                {detail.timeline.map((t) => (
                  <div key={t._id} className={`flex items-start gap-3 py-2.5 border-b last:border-0 ${darkMode ? 'border-white/5' : 'border-line'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${t.status === 'FAILURE' ? 'bg-rose-500' : 'bg-accent'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[11px] font-bold ${darkMode ? 'text-gray-100' : 'text-inksoft'}`}>
                          {t.action.replace(/_/g, ' ').toLowerCase()}
                        </span>
                        {t.status === 'FAILURE' && <StatusPill status="FAILURE" />}
                      </div>
                      {t.url && (
                        <p className={`text-[10px] truncate ${darkMode ? 'text-gray-500' : 'text-muted'}`}>{t.url}</p>
                      )}
                      {t.errorMessage && (
                        <p className="text-[10px] text-rose-500 mt-0.5">{t.errorMessage}</p>
                      )}
                    </div>
                    <span className={`text-[9px] shrink-0 tabular-nums ${darkMode ? 'text-gray-600' : 'text-faint'}`}>
                      {fmtDateTime(t.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!!detail.siblingAudits?.length && (
            <div>
              <h4 className={`text-[10px] font-black uppercase tracking-widest mb-3 ${darkMode ? 'text-gray-500' : 'text-muted'}`}>
                Other Audits In This Session ({detail.siblingAudits.length})
              </h4>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
                {detail.siblingAudits.map((a) => (
                  <div key={a._id} className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-surface-2'}`}>
                    <span className={`text-[11px] truncate ${darkMode ? 'text-gray-200' : 'text-inksoft'}`}>
                      {String(a.url).replace(/^https?:\/\//, '')}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-bold tabular-nums ${darkMode ? 'text-white' : 'text-ink'}`}>
                        {a.score ?? '—'}
                      </span>
                      <StatusPill status={a.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default JourneysTab;
