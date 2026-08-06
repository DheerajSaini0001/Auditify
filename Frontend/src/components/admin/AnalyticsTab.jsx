import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, AreaChart, Area,
} from 'recharts';
import {
  Users, UserPlus, MousePointerClick, PlayCircle, CheckCircle2, XCircle,
  Eye, Download, Clock, Gauge, Globe, Monitor, Activity, AlertTriangle, RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import { Card, StatTile, BarList, RangePicker } from './AdminPrimitives.jsx';
import {
  CATEGORICAL, STATUS, tooltipStyle, axisTick, gridStroke,
  fmtNumber, fmtSeconds, pct,
} from './adminViz.js';

/**
 * Analytics tab — registrations, the audit funnel, and usage breakdowns.
 *
 * One range control drives all three endpoints, so every number on screen
 * describes the same window. Splitting them would let an admin read a funnel for
 * "last 7 days" beside a country chart for "all time" and compare the two.
 */
const AnalyticsTab = ({ darkMode }) => {
  const [range, setRange] = useState('30d');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const [registrations, setRegistrations] = useState(null);
  const [activity, setActivity] = useState(null);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  const rangeQuery = useCallback(() => {
    const p = new URLSearchParams();
    // Explicit dates win over the preset — matching the server, which ignores
    // `range` once either bound is supplied.
    if (from) p.set('from', from);
    if (to) p.set('to', to);
    if (!from && !to) p.set('range', range);
    return p.toString();
  }, [range, from, to]);

  const load = useCallback(async () => {
    setLoading(true);
    const q = rangeQuery();
    try {
      // Fetched together so the three panels can never paint different windows.
      const [reg, act, dash] = await Promise.all([
        api.get(`/api/admin/analytics/registrations?${q}`),
        api.get(`/api/admin/analytics/audit-activity?${q}`),
        api.get(`/api/admin/analytics/dashboard?${q}`),
      ]);
      setRegistrations(reg.data);
      setActivity(act.data);
      setDashboard(dash.data);
    } catch (err) {
      console.error('Analytics error:', err);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, [rangeQuery]);

  useEffect(() => { load(); }, [load]);

  const totals = registrations?.totals || {};
  const funnel = activity?.funnel || {};
  const averages = dashboard?.averages || {};
  const sessions = dashboard?.sessions || {};

  const growth = registrations?.growth || [];
  const perDay = dashboard?.perDay || [];
  const hourly = dashboard?.hourly || [];
  const failureReasons = activity?.failureReasons || [];

  if (loading && !dashboard) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">Crunching analytics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters sit in one row above every chart they govern. */}
      <div className={`flex flex-wrap items-center justify-between gap-4 border rounded-2xl p-4 ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-card border-line shadow-sm'}`}>
        <RangePicker
          range={range} onRange={setRange}
          from={from} to={to} onFrom={setFrom} onTo={setTo}
          darkMode={darkMode}
        />
        <button
          onClick={load}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold transition-colors ${darkMode ? 'text-gray-400 hover:text-white hover:bg-white/5' : 'text-muted hover:text-ink hover:bg-cardsoft'}`}
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* ── 1. User registrations ─────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-inksoft'}`}>
          User Registrations
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatTile label="Total Users" value={fmtNumber(totals.total)} icon={Users} darkMode={darkMode} />
          <StatTile label="New Today" value={fmtNumber(totals.newToday)} icon={UserPlus} darkMode={darkMode} />
          <StatTile label="This Week" value={fmtNumber(totals.newThisWeek)} hint="Since Monday" darkMode={darkMode} />
          <StatTile label="This Month" value={fmtNumber(totals.newThisMonth)} hint="Since the 1st" darkMode={darkMode} />
          <StatTile label="Verified" value={fmtNumber(totals.verified)} hint={`${fmtNumber(totals.unverified)} unverified`} tone="good" darkMode={darkMode} />
          <StatTile label="Blocked" value={fmtNumber(totals.blocked)} tone={totals.blocked > 0 ? 'bad' : 'default'} darkMode={darkMode} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Cumulative total. One series, so the title names it and no legend
              box is needed. Deliberately NOT plotted on a second axis against the
              daily count below — two scales in one frame invite comparisons
              between lines that share no units. */}
          <Card title="Registration Growth" subtitle="Cumulative registered users" darkMode={darkMode} className="xl:col-span-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={growth} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CATEGORICAL[0]} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={CATEGORICAL[0]} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke(darkMode)} vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick(darkMode)} minTickGap={24} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick(darkMode)} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle(darkMode)} labelFormatter={(l, p) => p?.[0]?.payload?.date || l} />
                  <Area
                    type="monotone" dataKey="cumulative" name="Total users"
                    stroke={CATEGORICAL[0]} strokeWidth={2} fill="url(#growthFill)"
                    dot={false} activeDot={{ r: 4, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="New Sign-ups Per Day" subtitle="Same window, daily count" darkMode={darkMode}>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={growth} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke(darkMode)} vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick(darkMode)} minTickGap={24} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick(darkMode)} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle(darkMode)} cursor={{ fill: darkMode ? '#ffffff08' : '#00000008' }} />
                  <Bar dataKey="count" name="New users" fill={CATEGORICAL[0]} radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>

      {/* ── 2. Site audit activity ────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-inksoft'}`}>
          Site Audit Activity
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatTile
            label="Button Clicks" value={fmtNumber(funnel.buttonClicks)}
            hint={`${fmtNumber(funnel.uniqueClickers)} unique sessions`}
            icon={MousePointerClick} darkMode={darkMode}
          />
          <StatTile
            label="Audits Started" value={fmtNumber(funnel.started)}
            // A ratio, not a percentage: one full-site click starts one audit per
            // key page, so this is routinely above 1. `null` means no clicks were
            // recorded in this window, which is not the same as a zero rate.
            hint={funnel.auditsPerClick == null ? 'no click data in range' : `${funnel.auditsPerClick} per click`}
            icon={PlayCircle} darkMode={darkMode}
          />
          <StatTile
            label="Completed" value={fmtNumber(funnel.completed)}
            hint={`${funnel.startToCompleteRate || 0}% success`}
            icon={CheckCircle2} tone="good" darkMode={darkMode}
          />
          <StatTile
            label="Failed" value={fmtNumber(funnel.failed)}
            hint={`${funnel.failureRate || 0}% failure rate`}
            icon={XCircle} tone={funnel.failed > 0 ? 'bad' : 'default'} darkMode={darkMode}
          />
          <StatTile
            label="In Flight" value={fmtNumber(funnel.inFlight)}
            hint={`${fmtNumber(funnel.cancelled)} cancelled`}
            icon={Activity} tone="warn" darkMode={darkMode}
          />
          <StatTile
            label="Reports Read" value={fmtNumber(funnel.reportViews)}
            hint={`${fmtNumber(funnel.reportDownloads)} downloaded`}
            icon={Eye} darkMode={darkMode}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Funnel as stacked proportional bars: each stage is measured against
              the FIRST stage, so the drop-off is the visible thing. */}
          <Card title="Conversion Funnel" subtitle="Each stage as a share of button clicks" darkMode={darkMode}>
            <div className="space-y-4">
              {[
                { label: 'Site Audit clicked', value: funnel.buttonClicks || 0, color: CATEGORICAL[0] },
                { label: 'Discovery run', value: funnel.discoveries || 0, color: CATEGORICAL[1] },
                { label: 'Audit started', value: funnel.started || 0, color: CATEGORICAL[2] },
                { label: 'Audit completed', value: funnel.completed || 0, color: STATUS.completed },
                { label: 'Report opened', value: funnel.reportViews || 0, color: CATEGORICAL[3] },
                { label: 'Report downloaded', value: funnel.reportDownloads || 0, color: STATUS.queued },
              ].map((stage) => {
                const base = Math.max(funnel.buttonClicks || 0, funnel.started || 0, 1);
                return (
                  <div key={stage.label} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-[11px] font-semibold ${darkMode ? 'text-gray-200' : 'text-inksoft'}`}>{stage.label}</span>
                      <span className={`text-[10px] font-semibold tabular-nums ${darkMode ? 'text-gray-400' : 'text-muted'}`}>
                        {fmtNumber(stage.value)}
                        <span className={darkMode ? 'text-gray-600' : 'text-faint'}> · {pct(stage.value, base)}%</span>
                      </span>
                    </div>
                    <div className={`h-2 w-full rounded-full ${darkMode ? 'bg-white/5' : 'bg-surface-2'}`}>
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, pct(stage.value, base))}%`, backgroundColor: stage.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {!funnel.buttonClicks && (
              <p className={`mt-5 text-[10px] leading-relaxed ${darkMode ? 'text-gray-600' : 'text-faint'}`}>
                Button-click tracking starts recording from the next visit — earlier
                audits pre-date it, so the first two stages will read zero until then.
              </p>
            )}
          </Card>

          {/* Two series → legend always present, plus the counts in the tiles
              above. Green/red cannot be separated by a colour-blind reader, so
              identity here never rests on the colour alone. */}
          <Card title="Audits Per Day" subtitle="Completed vs failed" darkMode={darkMode} className="xl:col-span-2">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={perDay} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke(darkMode)} vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick(darkMode)} minTickGap={24} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick(darkMode)} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle(darkMode)} cursor={{ fill: darkMode ? '#ffffff08' : '#00000008' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} iconType="circle" iconSize={7} />
                  {/* stackId + a 2px surface-coloured stroke gives the segments a
                      visible gap, so two stacked bars never read as one block. */}
                  <Bar dataKey="completed" name="Completed" stackId="a" fill={STATUS.completed} maxBarSize={22} />
                  <Bar dataKey="failed" name="Failed" stackId="a" fill={STATUS.failed} radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>

      {/* ── 3. Usage breakdowns ───────────────────────────────────────────── */}
      <section className="space-y-4">
        <h2 className={`text-xs font-black uppercase tracking-widest ${darkMode ? 'text-gray-400' : 'text-inksoft'}`}>
          Usage Analytics
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatTile label="Avg Audit Time" value={fmtSeconds(averages.durationSeconds)} hint={`over ${fmtNumber(averages.sampleSize)} runs`} icon={Clock} darkMode={darkMode} />
          <StatTile label="Avg Score" value={averages.score ?? '—'} icon={Gauge} darkMode={darkMode} />
          <StatTile label="Avg Queue Wait" value={fmtSeconds(averages.queueWaitSeconds)} hint="before a worker starts" darkMode={darkMode} />
          <StatTile label="Peak Hour" value={dashboard?.peakHour?.label || '—'} hint={`${fmtNumber(dashboard?.peakHour?.count)} audits`} darkMode={darkMode} />
          <StatTile label="Sessions" value={fmtNumber(sessions.total)} hint={`${fmtNumber(sessions.active)} live now`} icon={Activity} darkMode={darkMode} />
          <StatTile label="Avg Session" value={fmtSeconds(sessions.avgDurationSeconds)} hint={`${sessions.avgPageViews ?? 0} pages`} darkMode={darkMode} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <Card title="Most Audited Websites" darkMode={darkMode}>
            <BarList
              darkMode={darkMode}
              emptyText="No audits in this window."
              items={(dashboard?.topSites || []).map((s) => ({ name: s.url, count: s.count, ...s }))}
              renderLabel={(s) => (
                <span title={s.url}>{String(s.url).replace(/^https?:\/\//, '')}</span>
              )}
            />
          </Card>

          <Card title="Top Countries" darkMode={darkMode}>
            <BarList items={dashboard?.topCountries || []} darkMode={darkMode} emptyText="No location data." />
          </Card>

          <Card title="Peak Usage Hours" subtitle={`Audits by hour (${dashboard?.range?.timezone || 'UTC'})`} darkMode={darkMode}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourly} margin={{ top: 4, right: 8, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke(darkMode)} vertical={false} />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={axisTick(darkMode)} interval={3} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick(darkMode)} allowDecimals={false} />
                  <Tooltip
                    contentStyle={tooltipStyle(darkMode)}
                    cursor={{ fill: darkMode ? '#ffffff08' : '#00000008' }}
                    labelFormatter={(h) => `${String(h).padStart(2, '0')}:00`}
                  />
                  <Bar dataKey="count" name="Audits" fill={CATEGORICAL[0]} radius={[3, 3, 0, 0]} maxBarSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Top Browsers" darkMode={darkMode}>
            <BarList items={dashboard?.topBrowsers || []} darkMode={darkMode} emptyText="No browser data." />
          </Card>

          <Card title="Devices" darkMode={darkMode}>
            <BarList items={dashboard?.topDevices || []} darkMode={darkMode} emptyText="No device data." />
          </Card>

          <Card title="Operating Systems" darkMode={darkMode}>
            <BarList items={dashboard?.topOS || []} darkMode={darkMode} emptyText="No OS data." />
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card title="Most Active Users" subtitle="Signed-in accounts only — guest runs appear in the funnel" darkMode={darkMode}>
            {!(dashboard?.topUsers || []).length ? (
              <div className={`text-center py-8 text-[11px] ${darkMode ? 'text-gray-600' : 'text-faint'}`}>
                No signed-in audits in this window.
              </div>
            ) : (
              <div className="space-y-2">
                {dashboard.topUsers.map((u, i) => (
                  <div key={u._id} className={`flex items-center justify-between gap-3 p-2.5 rounded-xl ${darkMode ? 'hover:bg-white/5' : 'hover:bg-cardsoft'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-6 text-[10px] font-black tabular-nums ${darkMode ? 'text-gray-600' : 'text-faint'}`}>
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <p className={`text-[11px] font-bold truncate ${darkMode ? 'text-white' : 'text-ink'}`}>{u.name || 'Unknown'}</p>
                        <p className={`text-[10px] truncate ${darkMode ? 'text-gray-500' : 'text-muted'}`}>{u.email}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-[11px] font-black tabular-nums ${darkMode ? 'text-white' : 'text-ink'}`}>{fmtNumber(u.audits)} audits</p>
                      <p className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-muted'}`}>
                        avg {u.avgScore || 0} · {fmtNumber(u.downloads)} downloads
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card
            title="Failed Audits & Reasons"
            subtitle="Raw worker errors grouped into actionable buckets"
            darkMode={darkMode}
          >
            {!failureReasons.length ? (
              <div className={`text-center py-8 text-[11px] flex flex-col items-center gap-2 ${darkMode ? 'text-gray-600' : 'text-faint'}`}>
                <CheckCircle2 size={26} className="text-emerald-500 opacity-60" />
                No failures in this window.
              </div>
            ) : (
              <div className="space-y-3">
                {failureReasons.map((f, i) => (
                  <div key={i} className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <AlertTriangle size={13} className="text-rose-500 mt-0.5 shrink-0" />
                      <span className={`text-[11px] font-semibold ${darkMode ? 'text-gray-200' : 'text-inksoft'}`}>{f.reason}</span>
                    </div>
                    <span className={`text-[11px] font-black tabular-nums shrink-0 ${darkMode ? 'text-white' : 'text-ink'}`}>
                      {fmtNumber(f.count)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card title="Website Categories" subtitle="Auto-detected site type of every audited URL" darkMode={darkMode}>
            <BarList
              darkMode={darkMode}
              emptyText="No categorised audits yet."
              items={(dashboard?.categorySplit || []).map((c) => ({ name: c.label, count: c.count, avgScore: c.avgScore }))}
              renderLabel={(c) => (
                <span className="capitalize">
                  {c.name}
                  <span className={`ml-2 font-normal ${darkMode ? 'text-gray-600' : 'text-faint'}`}>avg {c.avgScore}</span>
                </span>
              )}
            />
          </Card>

          <Card title="Audits Per Month" subtitle="Longer-term volume" darkMode={darkMode}>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard?.perMonth || []} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke(darkMode)} vertical={false} />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={axisTick(darkMode)} />
                  <YAxis axisLine={false} tickLine={false} tick={axisTick(darkMode)} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle(darkMode)} cursor={{ fill: darkMode ? '#ffffff08' : '#00000008' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} iconType="circle" iconSize={7} />
                  <Bar dataKey="completed" name="Completed" stackId="m" fill={STATUS.completed} maxBarSize={34} />
                  <Bar dataKey="failed" name="Failed" stackId="m" fill={STATUS.failed} radius={[4, 4, 0, 0]} maxBarSize={34} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default AnalyticsTab;
