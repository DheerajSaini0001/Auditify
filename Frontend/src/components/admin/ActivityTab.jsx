import React, { useState, useEffect, useCallback } from 'react';
import { History, X, Globe, Users, Activity as ActivityIcon, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import {
  Card, SearchBox, Select, ExportButton, Pagination, StatusPill,
  TableShell, LoadingRow, EmptyRow, RangePicker, StatTile,
} from './AdminPrimitives.jsx';
import { fmtNumber, fmtDateTime, fmtDuration } from './adminViz.js';

const PAGE_SIZE = 25;

// Grouped so the dropdown reads like the product rather than like the enum.
const ACTION_OPTIONS = [
  { value: '', label: 'All actions' },
  { value: 'AUDIT_BUTTON_CLICK', label: 'Site Audit clicked' },
  { value: 'AUDIT_DISCOVER', label: 'Discovery run' },
  { value: 'AUDIT_RUN,AUDIT_RUN_CACHED', label: 'Audit started' },
  { value: 'AUDIT_COMPLETED', label: 'Audit completed' },
  { value: 'AUDIT_FAILED', label: 'Audit failed' },
  { value: 'REPORT_VIEW', label: 'Report viewed' },
  { value: 'REPORT_DOWNLOAD', label: 'Report downloaded' },
  { value: 'LOGIN,LOGOUT,REGISTER,FAILED_LOGIN', label: 'Account activity' },
  { value: 'BLOCKED,UNBLOCKED,ROLE_CHANGED', label: 'Admin actions' },
  { value: 'PAGE_VIEW', label: 'Page views' },
  { value: 'SESSION_START,SESSION_END', label: 'Session lifecycle' },
];

/**
 * Activity Logs tab — every recorded action, plus the live session list.
 *
 * Replaces the old "User Logs" panel, which showed the ten most recent rows from
 * the overview payload under a heading that said "Critical Issues Detected" and
 * had no filters, no search, no paging and no export. This is the same data made
 * actually usable: filter by action or outcome, search across user/IP/URL/session,
 * page through it all, and export exactly what is on screen.
 */
const ActivityTab = ({ darkMode }) => {
  const [view, setView] = useState('activity'); // 'activity' | 'sessions'

  return (
    <div className="space-y-5">
      <div className={`inline-flex p-1 rounded-xl gap-1 ${darkMode ? 'bg-white/5' : 'bg-cardsoft'}`}>
        {[
          { id: 'activity', label: 'Activity Log', icon: History },
          { id: 'sessions', label: 'Sessions', icon: Clock },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[11px] font-semibold transition-all ${
              view === v.id
                ? 'bg-accent text-white shadow-sm'
                : darkMode ? 'text-gray-500 hover:text-white hover:bg-white/5' : 'text-muted hover:text-ink hover:bg-card'
            }`}
          >
            <v.icon size={13} /> {v.label}
          </button>
        ))}
      </div>

      {view === 'activity' ? <ActivityLogView darkMode={darkMode} /> : <SessionsView darkMode={darkMode} />}
    </div>
  );
};

const ActivityLogView = ({ darkMode }) => {
  const [logs, setLogs] = useState([]);
  const [breakdown, setBreakdown] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [range, setRange] = useState('30d');

  const filterParams = useCallback(() => {
    const p = new URLSearchParams();
    if (search) p.set('search', search);
    if (action) p.set('action', action);
    if (status) p.set('status', status);
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    return p;
  }, [search, action, status, from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = filterParams();
      p.set('page', page);
      p.set('limit', PAGE_SIZE);
      const { data } = await api.get(`/api/admin/activity-logs?${p.toString()}`);
      setLogs(data.logs || []);
      setBreakdown(data.breakdown || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Activity log error:', err);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  }, [filterParams, page]);

  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => { setPage(1); }, [search, action, status, from, to]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
      const token = localStorage.getItem('dealerpulse_token');
      const res = await fetch(`${API_URL}/api/admin/activity-logs/export?${filterParams().toString()}`, {
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
      a.download = named ? named[1] : 'activity-logs.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(href);
      toast.success('Activity log exported');
    } catch (err) {
      toast.error(err.message || 'Failed to export activity');
    } finally {
      setExporting(false);
    }
  };

  const failures = breakdown.reduce((sum, b) => sum + (b.failures || 0), 0);

  return (
    <div className="space-y-5">
      <div className={`border rounded-2xl p-4 space-y-3 ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-card border-line shadow-sm'}`}>
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <SearchBox
            className="flex-1"
            value={search} onChange={setSearch} darkMode={darkMode}
            placeholder="Search by user, email, IP, URL, session ID or action…"
          />
          <RangePicker
            range={range} onRange={(r) => { setRange(r); setFrom(''); setTo(''); }}
            from={from} to={to} onFrom={setFrom} onTo={setTo}
            darkMode={darkMode}
          />
          <ExportButton onClick={handleExport} busy={exporting} count={total} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select ariaLabel="Action" value={action} onChange={setAction} options={ACTION_OPTIONS} darkMode={darkMode} />
          <Select
            ariaLabel="Outcome" value={status} onChange={setStatus} darkMode={darkMode}
            options={[
              { value: '', label: 'Any outcome' },
              { value: 'SUCCESS', label: 'Success only' },
              { value: 'FAILURE', label: 'Failures only' },
            ]}
          />
          {(search || action || status || from || to) && (
            <button
              onClick={() => { setSearch(''); setAction(''); setStatus(''); setFrom(''); setTo(''); }}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-semibold transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-muted hover:text-ink hover:bg-cardsoft'}`}
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      </div>

      {/* What the current filter actually contains — counts as text, so the
          summary is readable without any colour encoding at all. */}
      {!!breakdown.length && (
        <Card title="Action Breakdown" subtitle={`${fmtNumber(total)} events · ${fmtNumber(failures)} failures`} darkMode={darkMode}>
          <div className="flex flex-wrap gap-2">
            {breakdown.map((b) => (
              <button
                key={b.action}
                onClick={() => setAction(b.action)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold border transition-colors ${
                  darkMode ? 'border-white/10 hover:border-accent text-gray-300' : 'border-line hover:border-accent text-inksoft'
                }`}
              >
                {b.action.replace(/_/g, ' ').toLowerCase()}
                <span className={`ml-2 font-black tabular-nums ${darkMode ? 'text-white' : 'text-ink'}`}>{fmtNumber(b.count)}</span>
                {b.failures > 0 && <span className="ml-1.5 text-rose-500 font-black">{b.failures} failed</span>}
              </button>
            ))}
          </div>
        </Card>
      )}

      <TableShell darkMode={darkMode}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className={`border-b text-[9px] uppercase tracking-[0.15em] font-black ${darkMode ? 'border-white/5 text-gray-500' : 'border-line text-faint'}`}>
                <th className="px-5 py-4">Timestamp</th>
                <th className="px-5 py-4">Action</th>
                <th className="px-5 py-4">User</th>
                <th className="px-5 py-4">IP / Location</th>
                <th className="px-5 py-4">Device</th>
                <th className="px-5 py-4">Session</th>
                <th className="px-5 py-4 text-center">Result</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-line'}`}>
              {loading ? (
                <LoadingRow colSpan={7} label="Loading activity…" />
              ) : logs.length === 0 ? (
                <EmptyRow colSpan={7} icon={History} label="No activity matches these filters" />
              ) : logs.map((l) => (
                <tr key={l._id} className={`transition-colors ${darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-cardsoft'}`}>
                  <td className={`px-5 py-3.5 text-[10px] font-semibold tabular-nums whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-inksoft'}`}>
                    {fmtDateTime(l.timestamp)}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className={`text-[11px] font-bold capitalize ${darkMode ? 'text-white' : 'text-ink'}`}>
                      {l.action.replace(/_/g, ' ').toLowerCase()}
                    </p>
                    {l.url && (
                      <p className={`text-[10px] truncate max-w-[240px] ${darkMode ? 'text-gray-500' : 'text-muted'}`} title={l.url}>
                        {String(l.url).replace(/^https?:\/\//, '')}
                      </p>
                    )}
                    {l.errorMessage && <p className="text-[10px] text-rose-500 truncate max-w-[240px]">{l.errorMessage}</p>}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className={`text-[11px] font-semibold truncate max-w-[170px] ${darkMode ? 'text-gray-200' : 'text-inksoft'}`}>
                      {l.userId?.name || 'Guest'}
                    </p>
                    <p className={`text-[10px] truncate max-w-[170px] ${darkMode ? 'text-gray-600' : 'text-faint'}`}>{l.identity}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className={`text-[10px] font-mono ${darkMode ? 'text-gray-300' : 'text-inksoft'}`}>{l.ip}</p>
                    <p className={`text-[9px] ${darkMode ? 'text-gray-600' : 'text-faint'}`}>
                      {[l.city, l.country].filter((v) => v && v !== 'unknown').join(', ') || 'Unknown'}
                    </p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className={`text-[10px] font-semibold capitalize ${darkMode ? 'text-gray-300' : 'text-inksoft'}`}>{l.device || '—'}</p>
                    <p className={`text-[9px] truncate max-w-[130px] ${darkMode ? 'text-gray-600' : 'text-faint'}`}>
                      {[l.browser, l.os].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </td>
                  <td className={`px-5 py-3.5 text-[9px] font-mono ${darkMode ? 'text-gray-600' : 'text-faint'}`}>
                    {String(l.sessionId || '').slice(0, 8)}…
                  </td>
                  <td className="px-5 py-3.5 text-center"><StatusPill status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} limit={PAGE_SIZE} onPage={setPage} darkMode={darkMode} />
      </TableShell>
    </div>
  );
};

const SessionsView = ({ darkMode }) => {
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [active, setActive] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (search) p.set('search', search);
      if (active) p.set('active', active);
      p.set('page', page);
      p.set('limit', PAGE_SIZE);
      const { data } = await api.get(`/api/admin/sessions?${p.toString()}`);
      setSessions(data.sessions || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Sessions error:', err);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [search, active, page]);

  useEffect(() => {
    const t = setTimeout(load, 400);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => { setPage(1); }, [search, active]);

  return (
    <div className="space-y-5">
      <div className={`flex flex-col lg:flex-row lg:items-center gap-3 border rounded-2xl p-4 ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-card border-line shadow-sm'}`}>
        <SearchBox
          className="flex-1"
          value={search} onChange={setSearch} darkMode={darkMode}
          placeholder="Search by user, email, IP, city or session ID…"
        />
        <Select
          ariaLabel="Session state" value={active} onChange={setActive} darkMode={darkMode}
          options={[
            { value: '', label: 'All sessions' },
            { value: 'true', label: 'Live now' },
            { value: 'false', label: 'Ended' },
          ]}
        />
      </div>

      <TableShell darkMode={darkMode}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className={`border-b text-[9px] uppercase tracking-[0.15em] font-black ${darkMode ? 'border-white/5 text-gray-500' : 'border-line text-faint'}`}>
                <th className="px-5 py-4">Visitor</th>
                <th className="px-5 py-4">Started</th>
                <th className="px-5 py-4">Ended</th>
                <th className="px-5 py-4">Duration</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Device</th>
                <th className="px-5 py-4 text-center">Activity</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-line'}`}>
              {loading ? (
                <LoadingRow colSpan={7} label="Loading sessions…" />
              ) : sessions.length === 0 ? (
                <EmptyRow colSpan={7} icon={Clock} label="No sessions recorded yet" />
              ) : sessions.map((s) => (
                <tr key={s._id} className={`transition-colors ${darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-cardsoft'}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {s.isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" title="Live" />
                      )}
                      <div className="min-w-0">
                        <p className={`text-[11px] font-semibold truncate max-w-[180px] ${darkMode ? 'text-gray-100' : 'text-inksoft'}`}>
                          {s.identity}
                        </p>
                        <p className={`text-[9px] font-mono ${darkMode ? 'text-gray-600' : 'text-faint'}`}>
                          {String(s.sessionId || '').slice(0, 8)}…
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-5 py-3.5 text-[10px] font-semibold tabular-nums whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-inksoft'}`}>
                    {fmtDateTime(s.startedAt)}
                  </td>
                  <td className={`px-5 py-3.5 text-[10px] font-semibold tabular-nums whitespace-nowrap ${darkMode ? 'text-gray-300' : 'text-inksoft'}`}>
                    {s.endedAt ? fmtDateTime(s.endedAt) : <span className="text-emerald-500">Live</span>}
                  </td>
                  <td className={`px-5 py-3.5 text-[10px] font-bold tabular-nums ${darkMode ? 'text-white' : 'text-ink'}`}>
                    {fmtDuration(s.durationMs)}
                  </td>
                  <td className="px-5 py-3.5">
                    <p className={`text-[10px] font-semibold ${darkMode ? 'text-gray-300' : 'text-inksoft'}`}>
                      {[s.city, s.country].filter((v) => v && v !== 'unknown').join(', ') || 'Unknown'}
                    </p>
                    <p className={`text-[9px] font-mono ${darkMode ? 'text-gray-600' : 'text-faint'}`}>{s.ip}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className={`text-[10px] font-semibold capitalize ${darkMode ? 'text-gray-300' : 'text-inksoft'}`}>{s.device}</p>
                    <p className={`text-[9px] truncate max-w-[130px] ${darkMode ? 'text-gray-600' : 'text-faint'}`}>{s.browser}</p>
                  </td>
                  <td className={`px-5 py-3.5 text-center text-[10px] tabular-nums ${darkMode ? 'text-gray-300' : 'text-inksoft'}`}>
                    <span title="Page views">{fmtNumber(s.pageViews)} pages</span>
                    <span className={darkMode ? 'text-gray-600' : 'text-faint'}> · </span>
                    <span title="Audits started">{fmtNumber(s.auditsStarted)} audits</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} total={total} limit={PAGE_SIZE} onPage={setPage} darkMode={darkMode} />
      </TableShell>
    </div>
  );
};

export default ActivityTab;
