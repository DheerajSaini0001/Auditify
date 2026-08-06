import mongoose from 'mongoose';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import ActivityLog from '../models/ActivityLog.js';
import UserSession from '../models/UserSession.js';
import ReportLead from '../models/ReportLead.js';
import logger from '../utils/logger.js';

/**
 * Admin analytics — the numbers behind the Admin Dashboard.
 *
 * Split from adminController.js on purpose: that file owns *acting on* users and
 * config (block, delete, promote, save a key), while everything here is read-only
 * aggregation. Keeping the destructive endpoints away from the reporting ones
 * makes both easier to reason about, and this file is where the expensive
 * aggregation pipelines live.
 *
 * A note that applies to every date bucket below: days and hours are bucketed in
 * ONE declared timezone (REPORT_TZ), never in whatever zone the container happens
 * to run in. "How many audits today" has to mean the same thing in the totals, in
 * the chart, and in the CSV, and the only way to guarantee that is for every
 * boundary — Mongo-side and JS-side — to come from the same zone.
 */

// The timezone every day/hour bucket is computed in. Set ANALYTICS_TIMEZONE to
// the team's own zone (e.g. 'America/Chicago') so "today" on the dashboard means
// their today rather than UTC's. Deliberately NOT the container's local zone:
// that would silently change every historical number if the host moved.
const REPORT_TZ = process.env.ANALYTICS_TIMEZONE || 'UTC';

/* ===========================
   Shared helpers
=========================== */

const escapeRegex = (str) => String(str).replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');

/**
 * Cast a userId from the query string to an ObjectId.
 *
 * Mongoose casts automatically for find(), but NOT inside an aggregate $match —
 * and the activity-log endpoint feeds the SAME query object to both. Left as a
 * string, the table would list rows while the breakdown built from the identical
 * filter came back empty. Returns null for anything that isn't a valid id, which
 * the callers treat as "no user filter" rather than as a match-nothing clause.
 */
const toObjectId = (value) =>
  mongoose.Types.ObjectId.isValid(value) ? new mongoose.Types.ObjectId(String(value)) : null;

/* ---------------------------
   Calendar days, in REPORT_TZ
   ---------------------------
   Mongo buckets days with $dateToString(timezone: REPORT_TZ), so every boundary
   computed here and every day-walk MUST use the same zone or the two silently
   disagree. They did: day boundaries were taken with Date#setHours (the SERVER's
   zone) and then labelled with toISOString() (UTC). On the UTC+5:30 box this runs
   on, that shifted every point in the chart back one day and pushed today's
   bucket past the end of the series, so today's audits vanished from the graph
   while still being counted in the totals beside it.

   The day-stepping below is done on the 'YYYY-MM-DD' key itself via UTC-anchored
   arithmetic — never by adding 24h to an instant — so a DST transition cannot
   add, drop or duplicate a day mid-walk. */

// 'YYYY-MM-DD' for an instant. en-CA is the locale whose short date format IS
// ISO, so this needs no reassembly from parts.
const dayKeyFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: REPORT_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
});
const dayKey = (d = new Date()) => dayKeyFmt.format(d);

// How far REPORT_TZ sits from UTC at a given instant, in ms. DST-aware, because
// it asks Intl what the wall clock actually reads there at that moment.
const wallClockFmt = new Intl.DateTimeFormat('en-US', {
  timeZone: REPORT_TZ, hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});
const tzOffsetMs = (d) => {
  const p = Object.fromEntries(
    wallClockFmt.formatToParts(d)
      .filter((x) => x.type !== 'literal')
      .map((x) => [x.type, Number(x.value)])
  );
  // Some ICU builds render midnight as hour 24 rather than 0.
  return Date.UTC(p.year, p.month - 1, p.day, p.hour % 24, p.minute, p.second) - d.getTime();
};

// Move a day key forward/back by whole calendar days.
const shiftKey = (key, days) => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

// The exact instant a REPORT_TZ calendar day begins — what a $gte filter needs.
// Resolved in two passes so a day that starts on a DST boundary uses the offset
// in force at ITS midnight, not the one from 24h earlier.
const keyToInstant = (key) => {
  const [y, m, d] = key.split('-').map(Number);
  const utcMidnight = Date.UTC(y, m - 1, d);
  const firstPass = utcMidnight - tzOffsetMs(new Date(utcMidnight));
  return new Date(utcMidnight - tzOffsetMs(new Date(firstPass)));
};

const startOfDay = (d = new Date()) => keyToInstant(dayKey(d));
const daysAgo = (n) => keyToInstant(shiftKey(dayKey(), -n));

/**
 * Resolve the requested window into a { from, to, days } triple.
 *
 * `range` is the quick picker (7d / 30d / 90d / all); explicit from/to always
 * win over it, so the UI can offer both without the two fighting. `to` covers the
 * WHOLE end day — someone asking for "1 Aug to 5 Aug" means through the end of
 * the 5th, matching the audit-log filters in adminController.
 */
const resolveRange = ({ range, from, to } = {}) => {
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;

  // End of the requested day in REPORT_TZ: the instant the NEXT day begins, minus
  // a millisecond. Derived rather than written as 23:59:59.999 so it stays right
  // on a DST day, which is 23 or 25 hours long.
  const end = toDate && !isNaN(toDate)
    ? new Date(keyToInstant(shiftKey(dayKey(toDate), 1)).getTime() - 1)
    : new Date();

  let start;
  if (fromDate && !isNaN(fromDate)) {
    start = startOfDay(fromDate);
  } else {
    const presets = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };
    // 'all' → epoch. Mongo compares against it happily and it keeps every query
    // below on the same shape rather than needing a "no filter" branch.
    start = range === 'all' ? new Date(0) : daysAgo(presets[range] ?? 30);
  }

  return {
    from: start,
    to: end,
    days: Math.max(1, Math.round((end - start) / 86400000)),
  };
};

// Most days a daily chart is ever worth plotting. Beyond this the x-axis is
// unreadable anyway, and the series stops being a chart and becomes a payload.
const MAX_DAILY_POINTS = 180;

/**
 * Fill in the days a range contains but the data doesn't.
 *
 * A growth chart plotted straight from a $group skips days with no rows, so a
 * quiet week renders as a straight line between two busy days — it looks like
 * steady traffic instead of a gap.
 *
 * The start is clamped to the first day that actually HAS data (and then to
 * MAX_DAILY_POINTS as a hard ceiling). Without that clamp, `range=all` resolves
 * `from` to the epoch and the series comes back as 180 empty days in 1970 with
 * the real data cut off past the end — a chart of nothing, from before the
 * product existed.
 */
const fillDailySeries = (rows, from, to, keys = ['count']) => {
  const byDate = new Map(rows.map((r) => [r._id, r]));

  // Both ends as day keys in REPORT_TZ — the same strings Mongo grouped by, so a
  // lookup either hits or the day genuinely had no rows.
  const endKey = dayKey(to);
  const ceilingKey = shiftKey(endKey, -(MAX_DAILY_POINTS - 1));

  // Earliest day the caller asked for, but never earlier than the first row we
  // actually have, and never more than MAX_DAILY_POINTS before the end. String
  // comparison is safe here: 'YYYY-MM-DD' sorts chronologically as text.
  let startKey = dayKey(from);
  if (rows.length && rows[0]._id > startKey) startKey = rows[0]._id;
  if (startKey < ceilingKey) startKey = ceilingKey;

  const out = [];
  let key = startKey;
  for (let guard = 0; key <= endKey && guard < MAX_DAILY_POINTS; guard++) {
    const row = byDate.get(key) || {};
    const [, month, day] = key.split('-');
    out.push({
      date: key,
      label: `${Number(month)}/${Number(day)}`,
      ...Object.fromEntries(keys.map((k) => [k, row[k] || 0])),
    });
    key = shiftKey(key, 1);
  }
  return out;
};

const dayBucket = (field) => ({
  $dateToString: { format: '%Y-%m-%d', date: field, timezone: REPORT_TZ },
});

/**
 * Group a "Name Version" string (`Chrome 123.0.1`, `Windows 11`) by its NAME.
 *
 * The version has to go or every minor release becomes its own bar and a 5-bar
 * chart turns into a 60-bar one. It is stripped by cutting at the first digit
 * rather than by taking the first space-separated token, because these names are
 * routinely multi-word — "Mobile Safari", "Samsung Internet", "Chrome OS". Taking
 * the first token reported a browser called "Mobile" and hid Safari completely.
 *
 * A value with no digits at all (`unknown`) has no match, so it falls through
 * $ifNull and is kept whole.
 */
const stripVersion = (field) => ({
  $let: {
    vars: { hit: { $regexFind: { input: { $ifNull: [field, 'unknown'] }, regex: /^[^0-9]+/ } } },
    in: { $trim: { input: { $ifNull: ['$$hit.match', 'unknown'] } } },
  },
});

/* ===========================
   1. User registrations
=========================== */

/**
 * GET /api/admin/analytics/registrations
 *
 * Totals + today/week/month + a daily growth series.
 *
 * "This week" and "this month" are CALENDAR periods (since Monday / since the
 * 1st), not rolling 7/30-day windows. That is what someone reading a dashboard
 * means by the words, and mixing the two — a calendar "today" beside a rolling
 * "week" — produces figures that don't add up against each other.
 */
export const getRegistrationAnalytics = async (req, res) => {
  try {
    const { from, to } = resolveRange(req.query);

    // All four boundaries are derived from today's REPORT_TZ day key, so they
    // agree with the growth series plotted next to them.
    const todayKey = dayKey();
    const [yy, mm] = todayKey.split('-');

    const today = keyToInstant(todayKey);

    // getUTCDay() on the UTC-anchored key: 0=Sun … 6=Sat. Shift so weeks start Monday.
    const weekday = new Date(`${todayKey}T00:00:00Z`).getUTCDay();
    const weekStart = keyToInstant(shiftKey(todayKey, -((weekday + 6) % 7)));

    const monthStart = keyToInstant(`${yy}-${mm}-01`);
    const yearStart = keyToInstant(`${yy}-01-01`);

    const [total, newToday, newThisWeek, newThisMonth, newThisYear, verified, blocked, growthRows, providerSplit] =
      await Promise.all([
        User.countDocuments(),
        User.countDocuments({ createdAt: { $gte: today } }),
        User.countDocuments({ createdAt: { $gte: weekStart } }),
        User.countDocuments({ createdAt: { $gte: monthStart } }),
        User.countDocuments({ createdAt: { $gte: yearStart } }),
        User.countDocuments({ isEmailVerified: true }),
        User.countDocuments({ isBlocked: true }),
        User.aggregate([
          { $match: { createdAt: { $gte: from, $lte: to } } },
          { $group: { _id: dayBucket('$createdAt'), count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
        User.aggregate([
          { $group: { _id: '$authProvider', count: { $sum: 1 } } },
        ]),
      ]);

    // Cumulative total alongside the per-day count: "growth" reads much better as
    // a rising line than as a bar chart of daily noise, and both come off the same
    // series so they can never disagree.
    const baseline = await User.countDocuments({ createdAt: { $lt: from } });
    let running = baseline;
    const growth = fillDailySeries(growthRows, from, to).map((d) => {
      running += d.count;
      return { ...d, cumulative: running };
    });

    res.json({
      success: true,
      totals: {
        total,
        newToday,
        newThisWeek,
        newThisMonth,
        newThisYear,
        verified,
        unverified: total - verified,
        blocked,
      },
      growth,
      providerSplit: providerSplit.map((p) => ({
        name: p._id === 'google' ? 'Google' : 'Email',
        count: p.count,
      })),
    });
  } catch (error) {
    logger.error('[Analytics] getRegistrationAnalytics failed', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

/* ===========================
   2. Site audit activity funnel
=========================== */

/**
 * GET /api/admin/analytics/audit-activity
 *
 * The click → start → complete funnel, plus the failure tail.
 *
 * Clicks come from ActivityLog (the browser is the only thing that sees a button
 * press), everything after that comes from AuditLog (the server is the authority
 * on what actually ran). Reading each number from whichever source genuinely
 * observed it is what keeps the funnel honest — a client could otherwise inflate
 * its own completion count.
 */
export const getAuditActivity = async (req, res) => {
  try {
    const { from, to } = resolveRange(req.query);
    const window = { $gte: from, $lte: to };

    const [
      buttonClicks,
      uniqueClickers,
      discoveries,
      statusRows,
      totalStarted,
      reportViews,
      reportDownloads,
      failureRows,
    ] = await Promise.all([
      ActivityLog.countDocuments({ action: 'AUDIT_BUTTON_CLICK', timestamp: window }),
      // Distinct sessions, not distinct users: most clicks come from signed-out
      // visitors, and counting only userIds would report a handful of people on a
      // day when hundreds of guests clicked.
      //
      // $group + $count rather than .distinct(): distinct returns the whole list
      // of values in ONE document, so it dies against the 16MB BSON cap once the
      // range covers enough sessions — exactly when the number matters most. The
      // pipeline only ever carries a count.
      ActivityLog.aggregate([
        { $match: { action: 'AUDIT_BUTTON_CLICK', timestamp: window } },
        { $group: { _id: '$sessionId' } },
        { $count: 'total' },
      ]).then((r) => r[0]?.total || 0),
      ActivityLog.countDocuments({ action: 'AUDIT_DISCOVER', timestamp: window }),
      AuditLog.aggregate([
        { $match: { createdAt: window } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      AuditLog.countDocuments({ createdAt: window }),
      AuditLog.countDocuments({ createdAt: window, reportViewed: true }),
      AuditLog.countDocuments({ createdAt: window, reportDownloaded: true }),
      AuditLog.aggregate([
        { $match: { createdAt: window, status: 'failed' } },
        {
          $group: {
            // Group by the reason, normalized to a short bucket. Raw worker
            // messages carry URLs and stack fragments, so grouping on them
            // verbatim yields one bucket per failure and no insight at all.
            _id: { $ifNull: ['$failureReason', 'Unknown'] },
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 50 },
      ]),
    ]);

    const byStatus = Object.fromEntries(statusRows.map((r) => [r._id, r.count]));
    const completed = byStatus.success || 0;
    const failed = byStatus.failed || 0;
    const cancelled = byStatus.cancelled || 0;
    const inFlight = (byStatus.pending || 0) + (byStatus.queued || 0) + (byStatus.running || 0);

    res.json({
      success: true,
      funnel: {
        buttonClicks,
        uniqueClickers,
        discoveries,
        started: totalStarted,
        completed,
        failed,
        cancelled,
        inFlight,
        reportViews,
        reportDownloads,
        // Conversion rates the dashboard would otherwise recompute (and could get
        // subtly different). Guarded against divide-by-zero on a quiet range.
        //
        // Clicks → starts is deliberately a RATIO, not a percentage. One "Run
        // Audit" click on a full-site run fans out into one /audit call per key
        // page (13–15 of them), so starts legitimately exceed clicks and a
        // percentage reads as a broken "4800% conversion". `null` when there are
        // no clicks in the window at all — that is "not measured", which is a
        // different statement from "zero", and only the former is true for audits
        // that pre-date click tracking.
        auditsPerClick: buttonClicks ? Math.round((totalStarted / buttonClicks) * 10) / 10 : null,
        startToCompleteRate: totalStarted ? Math.round((completed / totalStarted) * 100) : 0,
        completeToViewRate: completed ? Math.round((reportViews / completed) * 100) : 0,
        completeToDownloadRate: completed ? Math.round((reportDownloads / completed) * 100) : 0,
        failureRate: totalStarted ? Math.round((failed / totalStarted) * 100) : 0,
      },
      failureReasons: failureRows.map((f) => ({ reason: normalizeFailure(f._id), count: f.count }))
        // Re-aggregate after normalization: several raw messages collapse into one
        // bucket, and they must be summed rather than listed as duplicates.
        .reduce((acc, row) => {
          const hit = acc.find((a) => a.reason === row.reason);
          if (hit) hit.count += row.count;
          else acc.push({ ...row });
          return acc;
        }, [])
        .sort((a, b) => b.count - a.count),
    });
  } catch (error) {
    logger.error('[Analytics] getAuditActivity failed', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

/**
 * Collapse a raw failure message into a bucket an admin can act on.
 *
 * Worker errors embed the URL, a port, a timeout value — so `$group` on the raw
 * string produces one bucket per failure, which is a list, not a breakdown. These
 * patterns are ordered most-specific first.
 */
const FAILURE_BUCKETS = [
  [/timeout|timed out|ETIMEDOUT/i, 'Timeout'],
  [/navigation|net::ERR|ERR_CONNECTION|ECONNREFUSED|ECONNRESET/i, 'Connection failed'],
  [/dns|ENOTFOUND|EAI_AGAIN/i, 'DNS / host not found'],
  [/certificate|SSL|TLS|ERR_CERT/i, 'TLS / certificate error'],
  [/bot|captcha|cloudflare|403|forbidden|blocked/i, 'Blocked by site (WAF/bot protection)'],
  [/not an automotive|site type|unknown site/i, 'Not an automotive site'],
  [/website not found/i, 'Website not found'],
  [/worker|thread|spawn|crash/i, 'Worker crashed'],
  [/memory|heap|ENOMEM/i, 'Out of memory'],
  [/pagespeed|psi|quota|rate limit/i, 'PageSpeed API error'],
];

const normalizeFailure = (raw) => {
  if (!raw) return 'Unknown';
  const text = String(raw);
  for (const [pattern, label] of FAILURE_BUCKETS) {
    if (pattern.test(text)) return label;
  }
  // Nothing matched — keep a readable prefix so a new failure mode is visible
  // (and can be given its own bucket) rather than disappearing into "Other".
  return text.slice(0, 60);
};

/* ===========================
   3. Dashboard analytics
=========================== */

/**
 * GET /api/admin/analytics/dashboard
 *
 * Everything the analytics tab plots: volume over time, top sites/users/countries
 * /browsers/devices, averages, and peak hours.
 *
 * Runs as one endpoint with a Promise.all rather than eight endpoints so the tab
 * paints in one round trip — eight parallel requests each re-scanning AuditLog is
 * strictly more work for the database, not less.
 */
export const getDashboardAnalytics = async (req, res) => {
  try {
    const { from, to } = resolveRange(req.query);
    const window = { $gte: from, $lte: to };
    const match = { createdAt: window };

    // Sessions are only ever read here, so this is where they get swept closed.
    // Awaited (not fire-and-forget) so the numbers below include the sweep.
    await UserSession.closeStaleSessions().catch(() => 0);

    const [
      dailyRows,
      weeklyRows,
      monthlyRows,
      topSites,
      topUsers,
      avgRow,
      topCountries,
      topBrowsers,
      topDevices,
      topOS,
      peakHourRows,
      categorySplit,
      sessionStats,
    ] = await Promise.all([
      // Per-day volume, split by outcome.
      AuditLog.aggregate([
        { $match: match },
        {
          $group: {
            _id: dayBucket('$createdAt'),
            count: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            avgScore: { $avg: { $cond: [{ $eq: ['$status', 'success'] }, '$score', null] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Per ISO week. %G-W%V (not %Y-W%U) so the last days of December land in the
      // ISO week that actually contains them instead of a phantom week 53/01 pair.
      AuditLog.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%G-W%V', date: '$createdAt', timezone: REPORT_TZ } },
            count: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 60 },
      ]),

      AuditLog.aggregate([
        { $match: match },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: REPORT_TZ } },
            count: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 36 },
      ]),

      // Most audited websites, by host rather than full URL — the same dealer
      // audited at /, /inventory and /service is one site, not three.
      AuditLog.aggregate([
        { $match: match },
        {
          $group: {
            _id: '$url',
            count: { $sum: 1 },
            avgScore: { $avg: { $cond: [{ $eq: ['$status', 'success'] }, '$score', null] } },
            lastAudited: { $max: '$createdAt' },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            siteType: { $last: '$siteType' },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 15 },
      ]),

      // Most active users. Guest runs (userId: null) are excluded here on purpose
      // — they are counted in the funnel, but "most active USERS" is a list of
      // accounts, and a single "Guest" row at the top would tell an admin nothing.
      AuditLog.aggregate([
        { $match: { ...match, userId: { $ne: null } } },
        {
          $group: {
            _id: '$userId',
            audits: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            avgScore: { $avg: { $cond: [{ $eq: ['$status', 'success'] }, '$score', null] } },
            lastActive: { $max: '$createdAt' },
            downloads: { $sum: { $cond: ['$reportDownloaded', 1, 0] } },
          },
        },
        { $sort: { audits: -1 } },
        { $limit: 15 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: 1, audits: 1, completed: 1, downloads: 1, lastActive: 1,
            avgScore: { $round: [{ $ifNull: ['$avgScore', 0] }, 0] },
            name: '$user.name', email: '$user.email', role: '$user.role',
          },
        },
      ]),

      // Averages over SUCCESSFUL runs only. A failed audit's duration is the time
      // it took to give up, which is not "how long an audit takes", and its score
      // is null — including either would drag both averages toward nonsense.
      AuditLog.aggregate([
        { $match: { ...match, status: 'success' } },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$auditDuration' },
            minDuration: { $min: '$auditDuration' },
            maxDuration: { $max: '$auditDuration' },
            avgScore: { $avg: '$score' },
            avgQueueWait: { $avg: '$queueWaitMs' },
            count: { $sum: 1 },
          },
        },
      ]),

      AuditLog.aggregate([
        { $match: match },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Browser and OS, grouped by NAME — see stripVersion().
      AuditLog.aggregate([
        { $match: match },
        { $group: { _id: stripVersion('$browser'), count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      AuditLog.aggregate([
        { $match: match },
        { $group: { _id: { $toLower: { $ifNull: ['$device', 'unknown'] } }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      AuditLog.aggregate([
        { $match: match },
        { $group: { _id: stripVersion('$os'), count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Peak usage hours, 0–23 in the reporting timezone.
      AuditLog.aggregate([
        { $match: match },
        { $group: { _id: { $hour: { date: '$createdAt', timezone: REPORT_TZ } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // What kind of sites are being audited (the auto-detected category).
      AuditLog.aggregate([
        { $match: match },
        {
          $group: {
            _id: { type: { $ifNull: ['$siteType', 'unknown'] }, sub: { $ifNull: ['$siteSubType', null] } },
            count: { $sum: 1 },
            avgScore: { $avg: { $cond: [{ $eq: ['$status', 'success'] }, '$score', null] } },
          },
        },
        { $sort: { count: -1 } },
      ]),

      UserSession.aggregate([
        { $match: { startedAt: window } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            avgDurationMs: { $avg: '$durationMs' },
            avgPageViews: { $avg: '$pageViews' },
            withAudit: { $sum: { $cond: [{ $gt: ['$auditsStarted', 0] }, 1, 0] } },
            active: { $sum: { $cond: [{ $eq: ['$endedAt', null] }, 1, 0] } },
          },
        },
      ]),
    ]);

    const avg = avgRow[0] || {};
    const sessions = sessionStats[0] || {};

    // Every hour of the day present, so the chart has a flat bar at 3am rather
    // than silently dropping the hour and shifting the axis.
    const hourly = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${String(h).padStart(2, '0')}:00`,
      count: peakHourRows.find((r) => r._id === h)?.count || 0,
    }));
    const peakHour = hourly.reduce((best, cur) => (cur.count > best.count ? cur : best), hourly[0]);

    res.json({
      success: true,
      perDay: fillDailySeries(dailyRows, from, to, ['count', 'completed', 'failed']).map((d) => {
        const src = dailyRows.find((r) => r._id === d.date);
        return { ...d, avgScore: Math.round(src?.avgScore || 0) };
      }),
      perWeek: weeklyRows.map((w) => ({ label: w._id, count: w.count, completed: w.completed, failed: w.failed })),
      perMonth: monthlyRows.map((m) => ({ label: m._id, count: m.count, completed: m.completed, failed: m.failed })),
      topSites: topSites.map((s) => ({
        url: s._id,
        count: s.count,
        failed: s.failed,
        siteType: s.siteType || 'unknown',
        avgScore: Math.round(s.avgScore || 0),
        lastAudited: s.lastAudited,
      })),
      topUsers,
      averages: {
        durationSeconds: Math.round((avg.avgDuration || 0) / 1000),
        minDurationSeconds: Math.round((avg.minDuration || 0) / 1000),
        maxDurationSeconds: Math.round((avg.maxDuration || 0) / 1000),
        queueWaitSeconds: Math.round((avg.avgQueueWait || 0) / 1000),
        score: Math.round(avg.avgScore || 0),
        sampleSize: avg.count || 0,
      },
      topCountries: topCountries.map((c) => ({ name: c._id || 'Unknown', count: c.count })),
      topBrowsers: topBrowsers.map((b) => ({ name: b._id || 'Unknown', count: b.count })),
      topDevices: topDevices.map((d) => ({
        name: d._id ? d._id.charAt(0).toUpperCase() + d._id.slice(1) : 'Unknown',
        count: d.count,
      })),
      topOS: topOS.map((o) => ({ name: o._id || 'Unknown', count: o.count })),
      hourly,
      peakHour: { label: peakHour?.label || '00:00', count: peakHour?.count || 0 },
      categorySplit: categorySplit.map((c) => ({
        siteType: c._id.type,
        siteSubType: c._id.sub,
        label: c._id.sub ? `${c._id.type} / ${c._id.sub}` : c._id.type,
        count: c.count,
        avgScore: Math.round(c.avgScore || 0),
      })),
      sessions: {
        total: sessions.total || 0,
        active: sessions.active || 0,
        avgDurationSeconds: Math.round((sessions.avgDurationMs || 0) / 1000),
        avgPageViews: Math.round((sessions.avgPageViews || 0) * 10) / 10,
        withAudit: sessions.withAudit || 0,
      },
      range: { from, to, timezone: REPORT_TZ },
    });
  } catch (error) {
    logger.error('[Analytics] getDashboardAnalytics failed', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

/* ===========================
   4. User journeys
=========================== */

/**
 * Translate the journey filter query string into a Mongo query.
 *
 * Shared by the table and its CSV export for the same reason adminController's
 * audit-log filters are: an export that quietly applies different filters than
 * the screen it was clicked from is worse than no export, because the numbers
 * look authoritative and are wrong.
 */
const buildJourneyQuery = async ({
  search, status, country, device, browser, os, siteType,
  scoreMin, scoreMax, viewed, downloaded, userId, sessionId, ip, from, to,
} = {}) => {
  const query = {};

  if (status) query.status = { $in: String(status).split(',').map((s) => s.trim()).filter(Boolean) };
  if (country) query.country = { $regex: escapeRegex(country), $options: 'i' };
  if (device) query.device = { $regex: `^${escapeRegex(device)}$`, $options: 'i' };
  if (browser) query.browser = { $regex: escapeRegex(browser), $options: 'i' };
  if (os) query.os = { $regex: escapeRegex(os), $options: 'i' };
  if (siteType) query.siteType = siteType;
  if (sessionId) query.sessionId = sessionId;
  if (ip) query.ip = { $regex: escapeRegex(ip), $options: 'i' };
  if (userId) {
    // ObjectId, not the raw string — see toObjectId.
    const oid = toObjectId(userId);
    if (oid) query.userId = oid;
  }

  if (viewed === 'true') query.reportViewed = true;
  else if (viewed === 'false') query.reportViewed = { $ne: true };

  if (downloaded === 'true') query.reportDownloaded = true;
  else if (downloaded === 'false') query.reportDownloaded = { $ne: true };

  const score = {};
  if (scoreMin !== undefined && scoreMin !== '') score.$gte = Number(scoreMin);
  if (scoreMax !== undefined && scoreMax !== '') score.$lte = Number(scoreMax);
  if (Object.keys(score).length) query.score = score;

  const createdAt = {};
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (fromDate && !isNaN(fromDate)) { fromDate.setHours(0, 0, 0, 0); createdAt.$gte = fromDate; }
  if (toDate && !isNaN(toDate)) { toDate.setHours(23, 59, 59, 999); createdAt.$lte = toDate; }
  if (Object.keys(createdAt).length) query.createdAt = createdAt;

  if (search) {
    const safe = escapeRegex(search);
    // Resolve names/emails to ids first — AuditLog stores a reference, so a text
    // search on the log alone can never match "audits run by someone called Dave".
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
      ],
    }).select('_id').limit(500);

    query.$or = [
      { url: { $regex: safe, $options: 'i' } },
      { userId: { $in: matchingUsers.map((u) => u._id) } },
      { guestEmail: { $regex: safe, $options: 'i' } },
      { ip: { $regex: safe, $options: 'i' } },
      { city: { $regex: safe, $options: 'i' } },
      { sessionId: { $regex: safe, $options: 'i' } },
    ];
  }

  return query;
};

/**
 * GET /api/admin/journeys
 *
 * The complete audit journey table — one row per audit, carrying who ran it,
 * from where, on what, what was audited, how long it took, how it ended, and
 * whether the report was ever read or downloaded.
 */
export const getJourneys = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 25));

    const query = await buildJourneyQuery(req.query);

    const [rows, total] = await Promise.all([
      AuditLog.find(query)
        .populate('userId', 'name email role avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      journeys: rows.map(shapeJourney),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    logger.error('[Analytics] getJourneys failed', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

/**
 * One journey row, flattened for the client.
 *
 * `durationMs` prefers the recorded duration but falls back to completedAt −
 * startedAt: rows written before the duration field existed still have both
 * stamps, and showing a real elapsed time beats showing a dash.
 */
const shapeJourney = (log) => {
  const durationMs = log.auditDuration
    ?? (log.completedAt && log.startedAt ? new Date(log.completedAt) - new Date(log.startedAt) : null);

  return {
    _id: log._id,
    user: log.userId
      ? { _id: log.userId._id, name: log.userId.name, email: log.userId.email, role: log.userId.role, avatar: log.userId.avatar }
      : null,
    guestEmail: log.guestEmail || null,
    identity: log.userId?.email || log.guestEmail || 'Guest',
    sessionId: log.sessionId,
    ip: log.ip,
    country: log.country,
    region: log.region,
    city: log.city,
    device: log.device,
    browser: log.browser,
    os: log.os,
    screenResolution: log.screenResolution,
    url: log.url,
    siteType: log.siteType,
    siteSubType: log.siteSubType,
    category: log.siteSubType ? `${log.siteType} / ${log.siteSubType}` : (log.siteType || 'unknown'),
    pageType: log.pageType,
    reportId: log.reportId,
    reportType: log.reportType,
    status: log.status,
    failureReason: log.failureReason,
    score: log.score,
    grade: log.grade,
    startedAt: log.startedAt || log.createdAt,
    completedAt: log.completedAt,
    durationMs,
    queueWaitMs: log.queueWaitMs,
    reportViewed: !!log.reportViewed,
    reportViewedAt: log.reportViewedAt,
    reportViewCount: log.reportViewCount || 0,
    reportDownloaded: !!log.reportDownloaded,
    reportDownloadedAt: log.reportDownloadedAt,
    reportDownloadCount: log.reportDownloadCount || 0,
    referrer: log.referrer,
    createdAt: log.createdAt,
  };
};

/**
 * GET /api/admin/journeys/:id
 *
 * One journey plus its session and the activity timeline around it — the "show me
 * everything this person did" view. Scoped by sessionId rather than userId so it
 * works for guests, who are most of the traffic and have no account to scope to.
 */
export const getJourneyDetail = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id).populate('userId', 'name email role avatar').lean();
    if (!log) return res.status(404).json({ error: 'Journey not found', code: 'NOT_FOUND' });

    const [session, timeline, siblingAudits] = await Promise.all([
      UserSession.findOne({ sessionId: log.sessionId }).lean(),
      ActivityLog.find({ sessionId: log.sessionId })
        .sort({ timestamp: 1 })
        .limit(200)
        .populate('userId', 'name email')
        .lean(),
      AuditLog.find({ sessionId: log.sessionId, _id: { $ne: log._id } })
        .select('url status score createdAt siteType')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean(),
    ]);

    res.json({
      success: true,
      journey: shapeJourney(log),
      session: session || null,
      timeline,
      siblingAudits,
    });
  } catch (error) {
    logger.error('[Analytics] getJourneyDetail failed', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

/* ===========================
   CSV export
=========================== */

/**
 * One CSV cell.
 *
 * Quotes everything, so commas, quotes and newlines inside a URL or a name cannot
 * shift the columns. The leading-apostrophe guard is for spreadsheets, not for
 * CSV: Excel and Sheets execute a cell that starts with = + - @, and url and
 * guestEmail are attacker-controlled, so an exported row could otherwise run a
 * formula on the admin's machine that opens it.
 *
 * (Same rule as adminController's export — deliberately duplicated rather than
 * shared, because a change to one must be a considered change to the other.)
 */
const csvCell = (value) => {
  if (value == null) return '""';
  let text = String(value).replace(/[\r\n]+/g, ' ');
  if (/^[=+\-@\t]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
};

const iso = (d) => (d ? new Date(d).toISOString() : '');
const secs = (ms) => (ms == null ? '' : Math.round(ms / 1000));

const JOURNEY_COLUMNS = [
  ['Audit ID', (j) => j._id],
  ['Started (UTC)', (j) => iso(j.startedAt)],
  ['Completed (UTC)', (j) => iso(j.completedAt)],
  ['Duration (s)', (j) => secs(j.durationMs)],
  ['Queue Wait (s)', (j) => secs(j.queueWaitMs)],
  ['Status', (j) => j.status],
  ['Failure Reason', (j) => j.failureReason || ''],
  ['User Name', (j) => j.user?.name || ''],
  ['User Email', (j) => j.user?.email || j.guestEmail || 'Guest'],
  ['User ID', (j) => j.user?._id || ''],
  ['Session ID', (j) => j.sessionId],
  ['IP', (j) => j.ip],
  ['Country', (j) => j.country],
  ['Region', (j) => j.region],
  ['City', (j) => j.city],
  ['Device', (j) => j.device],
  ['Browser', (j) => j.browser],
  ['OS', (j) => j.os],
  ['Screen', (j) => j.screenResolution],
  ['Website URL', (j) => j.url],
  ['Category', (j) => j.category],
  ['Page Type', (j) => j.pageType || ''],
  ['Report Type', (j) => j.reportType || ''],
  ['Score', (j) => (j.score == null ? '' : j.score)],
  ['Grade', (j) => j.grade || ''],
  ['Report Viewed', (j) => (j.reportViewed ? 'Yes' : 'No')],
  ['Viewed At (UTC)', (j) => iso(j.reportViewedAt)],
  ['View Count', (j) => j.reportViewCount],
  ['Report Downloaded', (j) => (j.reportDownloaded ? 'Yes' : 'No')],
  ['Downloaded At (UTC)', (j) => iso(j.reportDownloadedAt)],
  ['Download Count', (j) => j.reportDownloadCount],
  ['Referrer', (j) => j.referrer || ''],
];

/**
 * Stream the filtered journeys as a CSV download.
 *
 * Streamed from a cursor rather than collected into an array first: a wide date
 * range is tens of thousands of rows, and buffering all of them to build one
 * string is how an export endpoint takes the process down. That also means no row
 * cap is needed — the export is never quietly truncated.
 */
export const exportJourneys = async (req, res) => {
  try {
    const query = await buildJourneyQuery(req.query);

    const stamp = new Date().toISOString().slice(0, 10);
    const range = [req.query.from, req.query.to].filter(Boolean).join('_to_');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="user-journeys_${range || stamp}.csv"`);

    // BOM so Excel opens UTF-8 (accented city names, non-Latin URLs) correctly
    // instead of mojibake.
    res.write('﻿');
    res.write(JOURNEY_COLUMNS.map(([h]) => csvCell(h)).join(',') + '\r\n');

    let rows = 0;
    const cursor = AuditLog.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .lean()
      .cursor();

    for await (const log of cursor) {
      const j = shapeJourney(log);
      res.write(JOURNEY_COLUMNS.map(([, read]) => csvCell(read(j))).join(',') + '\r\n');
      rows++;
    }

    logger.info(`[Analytics] Exported ${rows} journey rows (by ${req.user.userId})`);
    res.end();
  } catch (error) {
    logger.error('[Analytics] exportJourneys failed', error);
    // Headers may already be out the door mid-stream; a half-written file the
    // admin can see is better than a silent truncation that looks complete.
    if (res.headersSent) res.end('\r\n"EXPORT FAILED — this file is incomplete"\r\n');
    else res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

/* ===========================
   5. Activity logs
=========================== */

const buildActivityQuery = async ({ search, action, status, userId, sessionId, ip, country, from, to } = {}) => {
  const query = {};

  if (action) query.action = { $in: String(action).split(',').map((a) => a.trim()).filter(Boolean) };
  if (status) query.status = status;
  if (userId) {
    const oid = toObjectId(userId);
    if (oid) query.userId = oid;
  }
  if (sessionId) query.sessionId = sessionId;
  if (ip) query.ip = { $regex: escapeRegex(ip), $options: 'i' };
  if (country) query.country = { $regex: escapeRegex(country), $options: 'i' };

  const timestamp = {};
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (fromDate && !isNaN(fromDate)) { fromDate.setHours(0, 0, 0, 0); timestamp.$gte = fromDate; }
  if (toDate && !isNaN(toDate)) { toDate.setHours(23, 59, 59, 999); timestamp.$lte = toDate; }
  if (Object.keys(timestamp).length) query.timestamp = timestamp;

  if (search) {
    const safe = escapeRegex(search);
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: safe, $options: 'i' } },
        { email: { $regex: safe, $options: 'i' } },
      ],
    }).select('_id').limit(500);

    query.$or = [
      { url: { $regex: safe, $options: 'i' } },
      { userId: { $in: matchingUsers.map((u) => u._id) } },
      { guestEmail: { $regex: safe, $options: 'i' } },
      { ip: { $regex: safe, $options: 'i' } },
      { sessionId: { $regex: safe, $options: 'i' } },
      { action: { $regex: safe, $options: 'i' } },
    ];
  }

  return query;
};

/**
 * GET /api/admin/activity-logs
 *
 * Every recorded action, filterable and searchable. Also returns the action
 * breakdown for the current filter so the UI can show what it is looking at
 * without a second request.
 */
export const getActivityLogs = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 25));

    const query = await buildActivityQuery(req.query);

    const [logs, total, breakdown] = await Promise.all([
      ActivityLog.find(query)
        .populate('userId', 'name email role avatar')
        .sort({ timestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ActivityLog.countDocuments(query),
      ActivityLog.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            failures: { $sum: { $cond: [{ $eq: ['$status', 'FAILURE'] }, 1, 0] } },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

    res.json({
      success: true,
      logs: logs.map((l) => ({
        ...l,
        identity: l.userId?.email || l.guestEmail || 'Guest',
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      breakdown: breakdown.map((b) => ({ action: b._id, count: b.count, failures: b.failures })),
    });
  } catch (error) {
    logger.error('[Analytics] getActivityLogs failed', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

const ACTIVITY_COLUMNS = [
  ['Timestamp (UTC)', (l) => iso(l.timestamp)],
  ['Action', (l) => l.action],
  ['Status', (l) => l.status],
  ['User Name', (l) => l.userId?.name || ''],
  ['User Email', (l) => l.userId?.email || l.guestEmail || 'Guest'],
  ['User ID', (l) => l.userId?._id || ''],
  ['Session ID', (l) => l.sessionId],
  ['IP', (l) => l.ip],
  ['Country', (l) => l.country || ''],
  ['Region', (l) => l.region || ''],
  ['City', (l) => l.city || ''],
  ['Device', (l) => l.device || ''],
  ['Browser', (l) => l.browser || ''],
  ['OS', (l) => l.os || ''],
  ['URL', (l) => l.url || ''],
  ['Error', (l) => l.errorMessage || ''],
  ['Metadata', (l) => (l.metadata ? JSON.stringify(l.metadata) : '')],
];

export const exportActivityLogs = async (req, res) => {
  try {
    const query = await buildActivityQuery(req.query);

    const stamp = new Date().toISOString().slice(0, 10);
    const range = [req.query.from, req.query.to].filter(Boolean).join('_to_');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="activity-logs_${range || stamp}.csv"`);

    res.write('﻿');
    res.write(ACTIVITY_COLUMNS.map(([h]) => csvCell(h)).join(',') + '\r\n');

    let rows = 0;
    const cursor = ActivityLog.find(query)
      .populate('userId', 'name email')
      .sort({ timestamp: -1 })
      .lean()
      .cursor();

    for await (const log of cursor) {
      res.write(ACTIVITY_COLUMNS.map(([, read]) => csvCell(read(log))).join(',') + '\r\n');
      rows++;
    }

    logger.info(`[Analytics] Exported ${rows} activity rows (by ${req.user.userId})`);
    res.end();
  } catch (error) {
    logger.error('[Analytics] exportActivityLogs failed', error);
    if (res.headersSent) res.end('\r\n"EXPORT FAILED — this file is incomplete"\r\n');
    else res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

/* ===========================
   5b. Report leads
=========================== */

const buildLeadQuery = ({ search, from, to, delivered }) => {
  const query = {};

  if (delivered === 'true') query.delivered = true;
  else if (delivered === 'false') query.delivered = false;

  const createdAt = {};
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (fromDate && !isNaN(fromDate)) createdAt.$gte = fromDate;
  if (toDate && !isNaN(toDate)) { toDate.setHours(23, 59, 59, 999); createdAt.$lte = toDate; }
  if (Object.keys(createdAt).length) query.createdAt = createdAt;

  if (search) {
    const safe = escapeRegex(search);
    query.$or = [
      { name: { $regex: safe, $options: 'i' } },
      { email: { $regex: safe, $options: 'i' } },
      { url: { $regex: safe, $options: 'i' } },
      { domain: { $regex: safe, $options: 'i' } },
      { ip: { $regex: safe, $options: 'i' } },
    ];
  }

  return query;
};

/**
 * GET /api/admin/report-leads
 *
 * Everyone who asked us to email them a report — the signed-out download flow's
 * output (see controllers/pdfController.js#emailReportToLead).
 *
 * `repeat` counts how many times each address has been through the flow, because
 * "this person has now pulled three reports" is the single most useful thing this
 * list can tell a salesperson, and it is not visible from one row.
 */
export const getReportLeads = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 25));
    const query = buildLeadQuery(req.query);

    const [leads, total, stats] = await Promise.all([
      ReportLead.find(query)
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      ReportLead.countDocuments(query),
      ReportLead.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            uniqueEmails: { $addToSet: '$email' },
            delivered: { $sum: { $cond: ['$delivered', 1, 0] } },
            failed: { $sum: { $cond: ['$delivered', 0, 1] } },
            avgScore: { $avg: '$score' },
          },
        },
      ]),
    ]);

    // One extra query rather than one per row.
    const emails = [...new Set(leads.map((l) => l.email))];
    const repeats = emails.length
      ? await ReportLead.aggregate([
          { $match: { email: { $in: emails } } },
          { $group: { _id: '$email', count: { $sum: 1 } } },
        ])
      : [];
    const repeatBy = new Map(repeats.map((r) => [r._id, r.count]));

    const summary = stats[0] || {};
    res.json({
      success: true,
      leads: leads.map((l) => ({ ...l, repeat: repeatBy.get(l.email) || 1 })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      summary: {
        total,
        uniqueEmails: summary.uniqueEmails?.length || 0,
        delivered: summary.delivered || 0,
        failed: summary.failed || 0,
        avgScore: summary.avgScore != null ? Math.round(summary.avgScore * 10) / 10 : null,
      },
    });
  } catch (error) {
    logger.error('[Analytics] getReportLeads failed', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

const LEAD_COLUMNS = [
  ['Captured (UTC)', (l) => iso(l.createdAt)],
  ['Name', (l) => l.name],
  ['Email', (l) => l.email],
  ['Website audited', (l) => l.url || ''],
  ['Domain', (l) => l.domain || ''],
  ['Score', (l) => (l.score == null ? '' : l.score)],
  ['Grade', (l) => l.grade || ''],
  ['Report scope', (l) => l.reportType || ''],
  ['Audit device', (l) => l.auditDevice || ''],
  ['Delivered', (l) => (l.delivered ? 'yes' : 'no')],
  ['Delivery error', (l) => l.deliveryError || ''],
  ['Account', (l) => l.userId?.email || 'Guest'],
  ['IP', (l) => l.ip || ''],
  ['Country', (l) => l.country || ''],
  ['Region', (l) => l.region || ''],
  ['City', (l) => l.city || ''],
  ['Visitor device', (l) => l.visitorDevice || ''],
  ['Browser', (l) => l.browser || ''],
  ['OS', (l) => l.os || ''],
  ['Referrer', (l) => l.referrer || ''],
  ['Session ID', (l) => l.sessionId || ''],
  ['Report ID', (l) => String(l.reportId || '')],
];

export const exportReportLeads = async (req, res) => {
  try {
    const query = buildLeadQuery(req.query);

    const stamp = new Date().toISOString().slice(0, 10);
    const range = [req.query.from, req.query.to].filter(Boolean).join('_to_');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="report-leads_${range || stamp}.csv"`);

    res.write('﻿');
    res.write(LEAD_COLUMNS.map(([h]) => csvCell(h)).join(',') + '\r\n');

    let rows = 0;
    const cursor = ReportLead.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean()
      .cursor();

    for await (const lead of cursor) {
      res.write(LEAD_COLUMNS.map(([, read]) => csvCell(read(lead))).join(',') + '\r\n');
      rows++;
    }

    logger.info(`[Analytics] Exported ${rows} report leads (by ${req.user.userId})`);
    res.end();
  } catch (error) {
    logger.error('[Analytics] exportReportLeads failed', error);
    if (res.headersSent) res.end('\r\n"EXPORT FAILED — this file is incomplete"\r\n');
    else res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

/* ===========================
   6. Sessions
=========================== */

/**
 * GET /api/admin/sessions
 *
 * Session list — when each visit started, when it ended, and what happened in it.
 * Sweeps stale sessions first so an open-looking session really is one.
 */
export const getSessions = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 25));
    const { search, active, from, to } = req.query;

    await UserSession.closeStaleSessions().catch(() => 0);

    const query = {};
    if (active === 'true') query.endedAt = null;
    else if (active === 'false') query.endedAt = { $ne: null };

    const startedAt = {};
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if (fromDate && !isNaN(fromDate)) { fromDate.setHours(0, 0, 0, 0); startedAt.$gte = fromDate; }
    if (toDate && !isNaN(toDate)) { toDate.setHours(23, 59, 59, 999); startedAt.$lte = toDate; }
    if (Object.keys(startedAt).length) query.startedAt = startedAt;

    if (search) {
      const safe = escapeRegex(search);
      const matchingUsers = await User.find({
        $or: [{ name: { $regex: safe, $options: 'i' } }, { email: { $regex: safe, $options: 'i' } }],
      }).select('_id').limit(500);

      query.$or = [
        { sessionId: { $regex: safe, $options: 'i' } },
        { ip: { $regex: safe, $options: 'i' } },
        { city: { $regex: safe, $options: 'i' } },
        { country: { $regex: safe, $options: 'i' } },
        { userId: { $in: matchingUsers.map((u) => u._id) } },
      ];
    }

    const [sessions, total] = await Promise.all([
      UserSession.find(query)
        .populate('userId', 'name email role')
        .sort({ startedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      UserSession.countDocuments(query),
    ]);

    res.json({
      success: true,
      sessions: sessions.map((s) => ({
        ...s,
        identity: s.userId?.email || s.guestEmail || 'Guest',
        // Live sessions have no durationMs yet — show how long they have been
        // open so far rather than a blank cell.
        durationMs: s.durationMs ?? (new Date(s.lastSeenAt) - new Date(s.startedAt)),
        isActive: !s.endedAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    logger.error('[Analytics] getSessions failed', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};

/**
 * GET /api/admin/users/:id/journey
 *
 * Everything one account has ever done: their audits, their activity, and their
 * sessions. The "complete activity and audit journey" view for a single user.
 */
export const getUserJourney = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 100));

    const user = await User.findById(id).select('-password').lean();
    if (!user) return res.status(404).json({ error: 'User not found', code: 'USER_NOT_FOUND' });

    const [audits, activity, sessions, totals] = await Promise.all([
      AuditLog.find({ userId: id }).sort({ createdAt: -1 }).limit(limit).lean(),
      ActivityLog.find({ userId: id }).sort({ timestamp: -1 }).limit(limit).lean(),
      UserSession.find({ userId: id }).sort({ startedAt: -1 }).limit(limit).lean(),
      AuditLog.aggregate([
        { $match: { userId: user._id } },
        {
          $group: {
            _id: null,
            audits: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] } },
            failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
            avgScore: { $avg: { $cond: [{ $eq: ['$status', 'success'] }, '$score', null] } },
            avgDuration: { $avg: '$auditDuration' },
            views: { $sum: { $cond: ['$reportViewed', 1, 0] } },
            downloads: { $sum: { $cond: ['$reportDownloaded', 1, 0] } },
          },
        },
      ]),
    ]);

    const t = totals[0] || {};

    res.json({
      success: true,
      user,
      totals: {
        audits: t.audits || 0,
        completed: t.completed || 0,
        failed: t.failed || 0,
        avgScore: Math.round(t.avgScore || 0),
        avgDurationSeconds: Math.round((t.avgDuration || 0) / 1000),
        reportsViewed: t.views || 0,
        reportsDownloaded: t.downloads || 0,
        sessions: sessions.length,
      },
      audits: audits.map(shapeJourney),
      activity,
      sessions,
    });
  } catch (error) {
    logger.error('[Analytics] getUserJourney failed', error);
    res.status(500).json({ error: 'Internal server error', code: 'SERVER_ERROR' });
  }
};
