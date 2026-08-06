import React, { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell,
  ReferenceLine
} from "recharts";
import { ArrowRight, ChevronDown, Loader2, Bot, CheckCircle2, AlertCircle, Server, Search, Eye, ShieldCheck, LayoutTemplate, TrendingUp, Globe } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CircularProgress from "./CircularProgress";
import { SectionDetailsPanel } from "./CategoryScoreCards";
import { scoreBand } from "../utils/statusColors";
import LivePreview from "./LivePreview";
import UrlHeader from "./UrlHeader";
import { useData } from "../context/DataContext";
import { useAuth } from "../context/AuthContext";

// Presentational component wrapped in React.memo
const Dashboard2_Inner = React.memo(function Dashboard2_Inner({ data, loading, clearData, darkMode, isAuthenticated }) {
  const navigate = useNavigate();

  const sectionMappings = useMemo(() => [
    { key: "technicalPerformance", name: "Technical Performance", link: "technical-performance" },
    { key: "onPageSEO", name: "On-Page SEO", link: "on-page-seo" },
    { key: "accessibility", name: "Accessibility", link: "accessibility" },
    { key: "securityOrCompliance", name: "Security/Compliance", link: "security-compliance" },
    { key: "UXOrContentStructure", name: "UX & Content", link: "ux-content-structure" },
    { key: "conversionAndLeadFlow", name: "Conversion & Lead Flow", link: "conversion-lead-flow" },
    { key: "aioReadiness", name: "AIO Readiness", link: "aio" },
    { key: "aeo", name: "AEO", link: "aeo" },
  ], []);

  // Rotating Audit Steps (Process for all 8 Metrics)
  const auditSteps = useMemo(() => [
    {
      icon: <Server className="w-8 h-8 text-blue-500" />,
      title: "Technical Performance",
      text: "Analyzing server response time, identifying render-blocking resources, and measuring load speeds..."
    },
    {
      icon: <Search className="w-8 h-8 text-purple-500" />,
      title: "On-Page SEO",
      text: "Crawling meta tags, heading structure, keyword density, and checking for broken links..."
    },
    {
      icon: <Eye className="w-8 h-8 text-teal-500" />,
      title: "Accessibility Check",
      text: "Verifying ARIA labels, contrast ratios, and keyboard navigation support for all users..."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-red-500" />,
      title: "Security & Compliance",
      text: "Inspecting SSL certificates, HTTPS protocols, and scanning for vulnerability exposure..."
    },
    {
      icon: <LayoutTemplate className="w-8 h-8 text-indigo-500" />,
      title: "UX & Content Structure",
      text: "Evaluating visual hierarchy, mobile responsiveness, and content readability..."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-amber-500" />,
      title: "Conversion & Lead Flow",
      text: "Analyzing call-to-action placement, form accessibility, and user journey friction..."
    },
    {
      icon: <Bot className="w-8 h-8 text-emerald-500" />,
      title: "AIO Intelligence",
      text: "Simulating AI Search bots to ensure your content is optimized for ChatGPT and Gemini..."
    },
  ], []);

  // Calculate completed sections based on real data
  const completedSections = useMemo(() => {
    if (!data) return 0;
    // Count how many keys from sectionMappings exist in data AND have a valid Percentage calculated
    return sectionMappings.filter(section =>
      data[section.key] &&
      data[section.key].Percentage !== undefined &&
      data[section.key].Percentage !== null
    ).length;
  }, [data, sectionMappings]);

  // Report view is ready when backend status is completed/success, all sections have
  // reported, OR the worker published its provisional Stage-1 rollup (seven pillars
  // scored, only PageSpeed still running — psiPending marks the refining state).
  const isAuditComplete = Boolean(
    data && (
      data.status === "completed" ||
      data.status === "success" ||
      data.rawStatus === "completed" ||
      data.rawStatus === "success" ||
      (completedSections === sectionMappings.length && sectionMappings.length > 0) ||
      (data.stage1Completed === true && typeof data.score === "number")
    )
  );
  const isLoadingView = loading || !isAuditComplete;

  // Current audit PHASE (no timer). Driven by the backend's raw status (data.rawStatus);
  // the overall status is normalized elsewhere to pending/success/failed. Each phase
  // maps to a checkpoint % and a plain-language title + description shown while loading.
  const stageInfo = useMemo(() => {
    // Browser/crawl phases only cover the first ~45% of the bar. The remaining 55% is
    // driven by SECTIONS completing (they run concurrently and finish at different
    // times) — so the bar keeps moving through the analysis instead of jumping to ~90%
    // and stalling while every section finishes.
    const phases = {
      launching: { base: 8, title: "Launching browser", desc: "Spinning up a secure headless browser to load your website." },
      navigating: { base: 18, title: "Opening your website", desc: "Navigating to the target URL." },
      waiting_for_render: { base: 30, title: "Rendering the page", desc: "Waiting for the page and its dynamic content to fully load." },
      screenshot_ready: { base: 40, title: "Capturing the page", desc: "Page loaded — capturing a snapshot and crawling the content." },
      extracting_data: { base: 45, title: "Analyzing your site", desc: "Extracting page data and scoring the report sections." },
    };
    if (data?.status === "failed") {
      return { progress: 100, title: "Audit failed", desc: data?.error || "Something went wrong while auditing this site." };
    }
    // Admitted but not started — another audit holds the slot. Concurrent audits
    // starve each other's browsers, so they're queued rather than run together.
    if (data?.rawStatus === "queued") {
      return {
        progress: 5,
        title: "Waiting in queue",
        desc: data?.queuePosition > 1
          ? `Another audit is running — this one is #${data.queuePosition} in line and will start automatically.`
          : "Another audit is running — this one starts the moment it finishes.",
      };
    }
    const total = sectionMappings.length;
    const phase = phases[data?.rawStatus];
    // Once any section reports, the bar tracks section completion across 45% → 100%.
    if (completedSections > 0) {
      return {
        progress: Math.min(99, 45 + Math.round((completedSections / total) * 55)),
        title: "Analyzing your site",
        desc: "Scoring SEO, performance, accessibility, security and more.",
      };
    }
    if (phase) return { progress: phase.base, title: phase.title, desc: phase.desc };
    return { progress: 8, title: "Auditing your site", desc: "Running checks across all report sections." };
  }, [data?.rawStatus, data?.status, data?.error, data?.queuePosition, completedSections, sectionMappings.length]);

  // AI Visibility summary — derived as soon as AEO (or AIO Readiness) reports, which
  // normally happens well before the rest of the audit finishes. The moment this is
  // non-null the overview panel swaps the progress bar out for the real numbers, so the
  // client sees a result instead of a spinner while the remaining sections finish.
  const aiVisibility = useMemo(() => {
    const aeoPct = data?.aeo?.Percentage;
    const aioPct = data?.aioReadiness?.Percentage;
    if (aeoPct == null && aioPct == null) return null;

    const headlineScore = Math.round(aioPct ?? aeoPct);
    const headlineLabel = aioPct != null ? "AIO Readiness" : "AEO Visibility";
    // Per-engine reach comes from AEO, and ONLY from AEO. This used to fall back to
    // the headline score, which meant that in the usual case — AIO Readiness lands
    // first, AEO is still running — all three engine cards showed the same number,
    // and that number was the AIO score wearing a "Google Gemini" label. It read as
    // a measured per-engine result and was not one. `null` now means "this engine
    // has not reported yet" and the card shows a spinner until the real score lands.
    const engineScore = (key) => {
      const score = data?.aeo?.platforms?.[key]?.score;
      return score != null ? Math.round(score) : null;
    };

    // A signed-out viewer gets `aeo` stripped to its headline by reportGating, so
    // `platforms` is not "still loading" — it is never arriving for this viewer, and
    // a spinner here would turn forever. Drop the grid instead.
    const engines = data?.aeo?.locked
      ? []
      : [
          { title: "Google Gemini", score: engineScore("gemini"), color: "#4285F4" },
          { title: "OpenAI ChatGPT", score: engineScore("chatgpt"), color: "#10A37F" },
          { title: "Perplexity", score: engineScore("perplexity"), color: "#A259FF" },
        ];

    return { headlineScore, headlineLabel, engines };
  }, [data?.aeo, data?.aioReadiness]);

  // Progress view is only for the window BEFORE any AI visibility result exists.
  const showProgressView = (loading || !isAuditComplete) && !aiVisibility;

  // Rotating "did you know" quotes to keep the user engaged while they wait.
  const loadingQuotes = useMemo(() => [
    "53% of mobile visitors leave a page that takes longer than 3 seconds to load.",
    "Nearly 95% of car buyers research online before stepping into a dealership.",
    "75% of users judge a business's credibility on its website design alone.",
    "Most shoppers never scroll past page one of Google — local visibility is everything.",
    "A one-second delay in load time can cut conversions by around 7%.",
    "Clear calls-to-action and visible trust signals turn more visitors into leads.",
  ], []);
  const [quoteIndex, setQuoteIndex] = React.useState(0);
  React.useEffect(() => {
    if (!isLoadingView) return;
    const t = setInterval(() => setQuoteIndex((p) => (p + 1) % loadingQuotes.length), 5000);
    return () => clearInterval(t);
  }, [isLoadingView, loadingQuotes.length]);

  // Rotating Audit Steps (Timer-based for visual engagement)
  const [currentStepIndex, setCurrentStepIndex] = React.useState(0);

  React.useEffect(() => {
    // Check if audit is finished
    if (completedSections === sectionMappings.length) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % auditSteps.length);
    }, 2000); // Rotate card every 2 seconds

    return () => clearInterval(interval);
  }, [completedSections, sectionMappings.length, auditSteps.length]);

  // Which category card has its Findings / Issues / Recommendations open. One at a
  // time — eight expanded panels at once is a wall of text, not an answer.
  const [openSectionKey, setOpenSectionKey] = useState(null);

  // The findings collector merges a section across every audited page. This view is
  // one report, so that is a list of one.
  const detailReportList = useMemo(() => (data ? [data] : []), [data]);

  const barData = useMemo(() => sectionMappings.map((section) => ({
    name: section.name,
    key: section.key,
    value: data?.[section.key]?.Percentage,
    hasPercentage: data?.[section.key]?.Percentage !== undefined && data?.[section.key]?.Percentage !== null,
    Link: section.link,
  })), [data, sectionMappings]);

  // Styles
  const bgClass = darkMode ? "bg-[#0B1120] text-slate-300" : "bg-surface text-muted";
  const cardClass = darkMode
    ? "bg-slate-900 border border-slate-800 shadow-xl shadow-black/20"
    : "bg-card border border-line shadow-xl shadow-slate-200/50";

  // Define grade colors
  const gradeColor = (grade) => {
    if (["A+", "A", "B"].includes(grade)) return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20";
    if (["C", "D"].includes(grade)) return "text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20";
    return "text-red-600 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20";
  };

  // Plain-language summary of what the overall score means for the business.
  const healthSummary = (score) => {
    const s = Number(score) || 0;

    // Score-band intro (plain language, business-focused).
    let intro;
    if (s >= 90) intro = "Your website is in excellent shape — fast, easy to use, and well set up to win leads and rank in search.";
    else if (s >= 75) intro = "Your website is performing well, with a few areas to tidy up to capture more leads, bookings, and search visibility.";
    else if (s >= 50) intro = "Your website works, but it's leaving leads and search traffic on the table.";
    else intro = "Your website has issues that are likely costing you leads, customers, and search ranking.";

    // Lowest-scoring sections (below 75) = the priorities to work on first.
    const weak = sectionMappings
      .map((sec) => ({ name: sec.name, value: data?.[sec.key]?.Percentage }))
      .filter((sec) => typeof sec.value === "number" && sec.value < 75)
      .sort((a, b) => a.value - b.value);
    const top = weak.slice(0, 3).map((w) => `${w.name} (${Math.round(w.value)}%)`);

    let focus;
    if (top.length === 0) {
      focus = " No major problem areas — focus on maintenance and fine-tuning.";
    } else {
      const joined =
        top.length === 1 ? top[0]
          : top.length === 2 ? `${top[0]} and ${top[1]}`
            : `${top[0]}, ${top[1]}, and ${top[2]}`;
      const extra = weak.length > 3 ? `, plus ${weak.length - 3} more` : "";
      const label = top.length === 1 ? "Top priority" : `Top ${top.length} priorities`;
      focus = ` ${label} to work on: ${joined}${extra}.`;
    }

    return intro + focus;
  };

  return (
    <div id="dashboard" className={`w-full font-sans transition-colors duration-300 ${bgClass}`}>

      <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ✅ Card 1: URL Header Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${cardClass}`}>
          <UrlHeader data={data} darkMode={darkMode} hideBorder={true} />
        </div>

        {/* ✅ Card 2: Overview / Preview Card — visible to everyone (guests included) */}
        {true && (
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${cardClass}`}>
            <div className="flex flex-col xl:flex-row min-h-[300px]">

              {/* Left Panel: Live Preview (Widened) */}
              <div className={`w-full xl:w-1/2 border-b xl:border-b-0 xl:border-r p-6 flex items-center justify-center relative overflow-hidden ${darkMode ? "bg-slate-900/30 border-slate-800" : "bg-cardsoft border-line"}`}>
                {/* Decorative Background Blob */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>

                <div className="w-full relative z-10 px-2 lg:px-6">
                  <LivePreview data={data} loading={loading} variant="plain" />
                </div>
              </div>

              {/* Right Panel: Metrics & Score — visible to everyone */}
              {true && (
                <div className="flex-1 p-8 lg:p-12 flex flex-col justify-center">

                  {showProgressView ? (
                    /* Loading State: Dynamic status & countdown */
                    <div className="flex flex-col justify-center h-full min-h-[300px] animate-in fade-in duration-500">
                      <div className="w-full max-w-lg mx-auto space-y-6">

                        {/* No progress bar here on purpose: <AuditProgressPanel> already
                            renders one at the top of the page off the same status poll, so
                            a second copy just restated the same percentage twice on screen. */}

                        {/* Current audit phase / status — shown until the report is ready */}
                        <div className="relative overflow-hidden rounded-2xl border bg-cardsoft dark:bg-slate-800/30 border-line dark:border-slate-700/50 p-10 text-center transition-all duration-500 flex flex-col items-center">
                          <div className="relative mb-6">
                            <div className="absolute inset-0 bg-emerald-500/20 rounded-full blur-xl animate-pulse"></div>
                            <div className="relative w-20 h-20 bg-card dark:bg-slate-800 rounded-full shadow-lg border border-line dark:border-slate-700 flex items-center justify-center text-emerald-500">
                              <Loader2 className="w-9 h-9 animate-spin" />
                            </div>
                          </div>
                          <div key={stageInfo.title} className="animate-in fade-in slide-in-from-bottom-2 duration-500 space-y-2 max-w-md">
                            <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500">Current Step</span>
                            <h3 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-ink"}`}>{stageInfo.title}</h3>
                            <p className={`text-sm leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>{stageInfo.desc}</p>
                          </div>
                        </div>

                        {/* Rotating quote to pass the time */}
                        <p
                          key={quoteIndex}
                          className={`text-center text-sm italic leading-relaxed animate-in fade-in duration-700 ${darkMode ? "text-slate-400" : "text-muted"}`}
                        >
                          “{loadingQuotes[quoteIndex]}”
                        </p>

                      </div>
                    </div>
                  ) : (
                    /* Real Data */
                    <div className="space-y-7 animate-in fade-in slide-in-from-right-4 duration-500 max-w-2xl mx-auto w-full">


                      {/* ✅ AI Visibility Score Card — shown as soon as AEO / AIO Readiness
                          reports, even while the remaining sections are still being audited. */}
                      {aiVisibility && (
                        <div className={`mt-6 pt-6 border-t ${darkMode ? "border-slate-800" : "border-linesoft"} space-y-4`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Bot className="w-5 h-5 text-emerald-500" />
                                <h4 className={`text-lg font-bold ${darkMode ? "text-white" : "text-ink"}`}>AI Visibility Score</h4>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${darkMode ? "bg-slate-800 border-slate-700 text-emerald-400" : "bg-emerald-50 border-emerald-200 text-emerald-700"}`}>
                                  {aiVisibility.headlineLabel} {aiVisibility.headlineScore}%
                                </span>
                              </div>
                              <p className={`text-xs mt-1 leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                                How visible this website is to AI answer engines — the search channel your next customers are switching to. Per-engine reach shown alongside.
                              </p>
                            </div>

                            <button
                              onClick={() => navigate(data?._id ? `/aeo/${data._id}` : "/aeo")}
                              className={`shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${darkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                            >
                              View AI report
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Per-engine reach cards grid — absent entirely for a gated
                              (signed-out) viewer, who has no per-engine data to wait for. */}
                          {aiVisibility.engines.length > 0 && (
                          <div className="grid grid-cols-3 gap-3">
                            {aiVisibility.engines.map((eng) => (
                              <div key={eng.title} className={`p-3 rounded-2xl border flex flex-col items-center text-center ${darkMode ? "bg-slate-800/50 border-slate-700/60" : "bg-cardsoft border-line"}`}>
                                {/* Fixed-height slot so the card does not resize when the
                                    spinner is replaced by the real score. */}
                                <span className="h-7 flex items-center justify-center">
                                  {eng.score != null ? (
                                    <span className="text-xl font-black" style={{ color: eng.color }}>{eng.score}%</span>
                                  ) : (
                                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: eng.color }} aria-label={`${eng.title} score still loading`} />
                                  )}
                                </span>
                                <span className={`text-[11px] font-semibold mt-0.5 ${darkMode ? "text-slate-300" : "text-inksoft"}`}>{eng.title}</span>
                              </div>
                            ))}
                          </div>
                          )}

                          {/* The AI result landed early — tell the user the rest is still running
                              (this replaces the progress bar, which is gone from this panel). */}
                          {!isAuditComplete && (
                            <div className={`flex items-center gap-2 text-xs font-medium ${darkMode ? "text-slate-400" : "text-muted"}`}>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                              <span>{stageInfo.title} — remaining sections are still being scored.</span>
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

    

        {/* Guest lock removed — reports are open to everyone, so guests see the
            same full Overview + Category grid as authenticated users. */}


        {/* ✅ Detailed Metrics Grid & Charts — visible to everyone once loaded */}
        {!loading && isAuditComplete && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Category Breakdown - Production Ready */}
            <div className={`p-8 rounded-3xl border ${cardClass}`}>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className={`text-2xl font-semibold ${darkMode ? "text-white" : "text-ink"}`}>Category Performance</h3>
                  <p className={`text-sm mt-1 ${darkMode ? "text-slate-400" : "text-muted"}`}>Detailed analysis across key audit verticals</p>
                  {data?.psiPending && (
                    <p className={`flex items-center gap-1.5 text-xs font-medium mt-2 ${darkMode ? "text-amber-400" : "text-amber-600"}`}>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Google PageSpeed is still analyzing — Technical Performance and the overall score will refine in a moment.
                    </p>
                  )}
                </div>
              </div>

              {/* Two per row at most — the cards carry a score, a status and an
                  expandable findings panel, which needs the width to read well. */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {barData.map((item, index) => {
                  /* Determine Color & Status — a section without a Percentage keeps its
                     "Analyzing..." spinner even while the (provisional) report is open,
                     e.g. Technical Performance while PageSpeed is still running. */
                  const isDone = item.hasPercentage;
                  const score = isDone ? (item.value || 0) : 0;

                  // Label and ring both derive from the same scoreBand() call, so
                  // they cannot disagree. This block used to hardcode its own bands
                  // and pass a `ringColor` hex to <CircularProgress color={…}> — a
                  // prop that component never accepted, so the hex was dropped and
                  // the ring coloured itself from a different band. Reading this file
                  // alone the two looked consistent; on screen an 87% pillar drew a
                  // green ring under an amber "NEEDS WORK".
                  const band = isDone ? scoreBand(score) : null;
                  const statusColor = band ? band.text : "text-score-warn-ink";
                  const statusText = band ? band.label : "Analyzing...";

                  const isOpen = openSectionKey === item.key;

                  return (
                    /* A card, not a button: it now holds two separate actions — the
                       ring opens the full section report, "View Details" expands the
                       findings inline. Nesting those inside one <button> would be
                       invalid markup and unreachable by keyboard. */
                    <div
                      key={item.name}
                      className={`group relative rounded-2xl border transition-all duration-300 hover:shadow-xl flex flex-col ${isOpen ? "md:col-span-2" : ""} ${darkMode ? "bg-slate-800/30 border-slate-700" : "bg-card border-linesoft"}`}
                    >
                      <button
                        onClick={() => navigate(data?._id ? `/${item.Link}/${data._id}` : `/${item.Link}`)}
                        title={`Open the full ${item.name} report`}
                        className="p-6 pb-3 flex flex-col items-center text-center rounded-t-2xl"
                      >
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1">
                          <ArrowRight className={`w-5 h-5 ${darkMode ? "text-slate-400" : "text-faint"}`} />
                        </div>

                        <div className="mb-5 mt-2 relative">
                          {/* Glowing Background for Score */}
                          {/* Hover glow reuses the card's own band, so it can never
                              disagree with the ring or the label above it. */}
                          <div className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-20 transition-opacity duration-500 ${band ? band.solidBg : "bg-faint"}`}></div>
                          <CircularProgress value={isDone ? score : 0} size={110} stroke={8} />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            {isDone ? (
                              <span className={`text-2xl font-black ${darkMode ? "text-white" : "text-ink"}`}>
                                {score}%
                              </span>
                            ) : (
                              <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                            )}
                          </div>
                        </div>

                        <h4 className={`text-base font-semibold mb-1 ${darkMode ? "text-slate-200" : "text-inksoft"}`}>
                          {item.name}
                        </h4>
                        {/* Score out of 100 in words as well as the ring — the ring
                            reads as a proportion, the client asked for the number. */}
                        <span className={`text-sm font-bold tabular-nums ${darkMode ? "text-slate-300" : "text-inksoft"}`}>
                          {isDone ? `${score}/100` : "—/100"}
                        </span>
                        <span className={`text-xs font-semibold uppercase tracking-wider mt-1 ${statusColor}`}>
                          {statusText}
                        </span>
                      </button>

                      <div className="px-6 pb-5">
                        <button
                          onClick={() => setOpenSectionKey(isOpen ? null : item.key)}
                          aria-expanded={isOpen}
                          className={`w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all active:scale-[0.98]
                            ${darkMode ? "border-slate-700 text-slate-300 hover:bg-slate-800" : "border-line text-inksoft hover:bg-surface-2"}`}
                        >
                          {/* Label tracks the state — a rotating chevron alone does not
                              answer "did my click do anything?" */}
                          {isOpen ? "Hide Details" : "View Details"}
                          <ChevronDown size={13} className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                        </button>
                      </div>

                      {isOpen && (
                        <SectionDetailsPanel
                          section={{ key: item.key, label: item.name, link: item.Link }}
                          reportList={detailReportList}
                          reportId={data?._id || null}
                          darkMode={darkMode}
                          onOpenSection={(id, link) => navigate(`/${link}/${id}`)}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ✅ Stage 2 Discovered & Crawled Key Pages Card */}
            {(data?.crawledPagesSummary?.length > 0 || data?.stage2Progress) && (
              <div className={`rounded-3xl border p-6 lg:p-8 space-y-6 ${cardClass}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Globe className="w-5 h-5 text-emerald-500" />
                      <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-ink"}`}>
                        Site-Wide Crawled Key Pages (Stage 2 Audit)
                      </h3>
                      {data?.stage2Completed ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          ✓ Parallel Crawl Complete
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Crawling in Parallel
                        </span>
                      )}
                    </div>
                    <p className={`text-xs mt-1 leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                      Parallel Puppeteer instances crawled these key domain pages in the background to enrich site-wide signals.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      const summaryPages = [
                        { key: data?.pageType || 'home', label: 'Home Page', url: data?.url, id: data?._id, status: 'done' }
                      ];
                      (data?.crawledPagesSummary || []).forEach((cp) => {
                        if (cp.url && !summaryPages.some((s) => s.url === cp.url)) {
                          summaryPages.push({
                            key: cp.pageType || 'generic',
                            label: cp.label || 'Key Page',
                            url: cp.url,
                            // Each key page has its OWN full child report — open that.
                            id: cp.reportId || data?._id,
                            status: cp.isProcessing ? 'pending' : (cp.success ? 'done' : 'pending')
                          });
                        }
                      });

                      const payload = {
                        siteUrl: data?.url,
                        device: data?.device || 'Desktop',
                        pages: summaryPages
                      };

                      try {
                        sessionStorage.setItem("auditSummary", JSON.stringify(payload));
                      } catch {}

                      navigate("/audit-summary", { state: payload });
                    }}
                    className={`shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold border transition-all ${darkMode ? "bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700" : "bg-emerald-600 text-white hover:bg-emerald-700"}`}
                  >
                    View Multi-Page Matrix
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(data?.crawledPagesSummary || []).map((pg, idx) => {
                    const scored = typeof pg.score === "number";
                    const openable = !pg.isProcessing && pg.success && pg.reportId;
                    const gradeCls = !scored
                      ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20"
                      : pg.score >= 80
                        ? "bg-emerald-500/15 text-emerald-500 border-emerald-500/20"
                        : pg.score >= 60
                          ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                          : "bg-rose-500/15 text-rose-400 border-rose-500/20";
                    return (
                    <div
                      key={idx}
                      onClick={openable ? () => navigate(`/report/${pg.reportId}`) : undefined}
                      title={openable ? `Open full report — ${pg.label || pg.url}` : pg.url}
                      className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all ${openable ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""} ${darkMode ? "bg-slate-800/40 border-slate-700/60" : "bg-cardsoft border-line"}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold ${darkMode ? "text-slate-200" : "text-ink"}`}>
                          {pg.label || "Key Automotive Page"}
                        </span>
                        {pg.isProcessing ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
                            Auditing…
                          </span>
                        ) : scored ? (
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${gradeCls}`}>
                            {pg.score}{pg.grade ? ` · ${pg.grade}` : ""}
                          </span>
                        ) : pg.success ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/15 text-emerald-500 border border-emerald-500/20">
                            ✓ Done
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/20">
                            Failed
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-mono truncate block opacity-70" title={pg.url}>
                        {pg.url}
                      </span>

                      {openable && (
                        <span className="text-[10px] font-semibold opacity-60">Open full report →</span>
                      )}
                    </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

export default function Dashboard2({ data: propData, loading: propLoading, clearData: propClearData, darkMode }) {
  const contextData = useData();
  const authData = useAuth();

  const data = propData !== undefined ? propData : contextData.data;
  const loading = propLoading !== undefined ? propLoading : contextData.loading;
  const clearData = propClearData !== undefined ? propClearData : contextData.clearData;
  const isAuthenticated = authData?.isAuthenticated;

  return <Dashboard2_Inner data={data} loading={loading} clearData={clearData} darkMode={darkMode} isAuthenticated={isAuthenticated} />;
}