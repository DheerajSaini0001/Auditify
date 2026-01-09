import React, { useMemo } from "react";
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
import { NotebookPen, ExternalLink, ArrowRight, Clock, Smartphone, Monitor, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CircularProgress from "./CircularProgress";
import LivePreview from "./LivePreview";
import { useData } from "../context/DataContext";

// ✅ Custom Shimmer (Modernized)
const ShimmerBlock = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-slate-200 dark:bg-slate-800 rounded-md ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent"></div>
  </div>
);

export default function Dashboard2({ darkMode }) {
  const { data, loading, clearData } = useData();
  const navigate = useNavigate();

  const sectionMappings = useMemo(() => [
    { key: "Technical_Performance", name: "Technical Performance", link: "technical-performance" },
    { key: "On_Page_SEO", name: "On-Page SEO", link: "on-page-seo" },
    { key: "Accessibility", name: "Accessibility", link: "accessibility" },
    { key: "Security_or_Compliance", name: "Security/Compliance", link: "security-compliance" },
    { key: "UX_or_Content_Structure", name: "UX & Content", link: "ux-content-structure" },
    { key: "Conversion_and_Lead_Flow", name: "Conversion & Lead Flow", link: "conversion-lead-flow" },
    { key: "AIO_Readiness", name: "AIO Readiness", link: "aio" },
  ], []);

  const barData = useMemo(() => sectionMappings.map((section) => ({
    name: section.name,
    value: data?.[section.key]?.Percentage || 0,
    Link: section.link,
  })), [data, sectionMappings]);

  // Modern SaaS Colors
  const COLORS = ["#10B981", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#6366F1"];

  const handleCheckOther = () => {
    clearData();
    navigate("/", { replace: true });
    // setTimeout(() => {
    //   window.history.pushState(null, "", window.location.href);
    // }, 100);
  };

  // Styles
  const bgClass = darkMode ? "bg-[#0B1120] text-slate-300" : "bg-slate-50 text-slate-600";
  const cardClass = darkMode
    ? "bg-slate-900 border border-slate-800 shadow-sm"
    : "bg-white border border-slate-200 shadow-sm";

  // Loading state handled inline to keep Header visible

  // Define grade colors
  const gradeColor = (grade) => {
    if (["A", "B"].includes(grade)) return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
    if (["C", "D"].includes(grade)) return "text-amber-500 bg-amber-500/10 border-amber-500/20";
    return "text-red-500 bg-red-500/10 border-red-500/20";
  };

  return (
    <div id="dashboard" className={`min-h-screen w-full font-sans transition-colors duration-300 ${bgClass}`}>

      <div className="max-w-[1440px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">

        {/* ✅ Header Bar */}
        <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 p-6 rounded-2xl ${cardClass}`}>
          <div className="space-y-1 w-full md:w-auto overflow-hidden">
            <h2 className="text-sm font-semibold uppercase tracking-wider opacity-60">Audit Report For</h2>
            <div className="flex items-center gap-2 group">
              <a href={data?.Site || "#"} target="_blank" rel="noopener noreferrer" className={`text-xl md:text-2xl font-bold truncate hover:underline ${darkMode ? "text-white" : "text-slate-900"}`}>
                {data?.Site || "Analyzing..."}
              </a>
              <ExternalLink className="w-5 h-5 opacity-40 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          <button
            onClick={handleCheckOther}
            className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg shadow-emerald-500/20 transition-all 
                bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 hover:scale-[1.02] active:scale-[0.98]
            `}
          >
            <NotebookPen className="w-5 h-5" />
            <span>New Audit</span>
          </button>
        </div>


        {/* ✅ Live Preview Component */}
        <LivePreview data={data} loading={loading} />


        {/* ✅ Loading State with Specific Cards */}
        {(loading || !data?.Section_Score) ? (
          <div className="flex flex-col gap-8 animate-in fade-in duration-500">
            {/* Score Card Loading */}
            <div className={`p-8 rounded-3xl ${cardClass} flex flex-col md:flex-row items-center justify-center gap-8 min-h-[300px]`}>
              <div className="relative">
                <Loader2 className="w-24 h-24 animate-spin text-emerald-500 opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold animate-pulse">...</span>
                </div>
              </div>
              <div className="space-y-4 text-center md:text-left">
                <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse"></div>
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse mx-auto md:mx-0"></div>
                <div className="flex gap-2 justify-center md:justify-start pt-2">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 animate-pulse">Identifying Device...</span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500 animate-pulse">Calculating Time...</span>
                </div>
              </div>
            </div>

            {/* Detailed Metrics Grid Loading */}
            <div>
              <h3 className="text-xl font-bold px-1 mb-6 animate-pulse w-48 h-6 bg-slate-200 dark:bg-slate-800 rounded"></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {sectionMappings.map((item, index) => (
                  <div
                    key={item.key}
                    className={`relative p-6 rounded-2xl border text-left flex flex-col justify-between h-40 overflow-hidden ${cardClass}`}
                  >
                    {/* Loading Scan Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>

                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      </div>
                    </div>

                    <div className="space-y-2 z-10">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium opacity-50">Analyzing</span>
                      </div>
                      <h4 className={`font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>
                        {item.name}
                      </h4>
                    </div>

                    {/* Progress Bar Placeholder */}
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
                      <div className="h-full bg-emerald-500/50 w-1/3 animate-[loading_1.5s_ease-in-out_infinite]"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart Loading */}
            <div className={`p-8 rounded-3xl border h-[400px] flex items-center justify-center ${cardClass}`}>
              <div className="flex flex-col items-center gap-4 opacity-50">
                <Loader2 className="w-10 h-10 animate-spin" />
                <span className="text-sm font-medium">Generating Performance Chart...</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* ✅ Main Score / Hero Section */}
            <div className="grid lg:grid-cols-3 gap-6">

              {/* Overall Score */}
              <div className={`lg:col-span-2 p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden ${darkMode ? "bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700" : "bg-gradient-to-br from-white to-slate-50 border-slate-200"} border shadow-lg`}>

                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 blur-[100px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/2`}></div>

                <div className="flex items-center gap-8 z-10">
                  <div className="relative">
                    <CircularProgress value={data.Score?.toFixed(0) || 0} size={140} stroke={12} />
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className={`text-4xl font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>{data.Score?.toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className={`text-2xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>Overall Health Score</h3>
                    <p className="opacity-70 max-w-xs">Your website's pulse check based on performance, SEO, and UX factors.</p>
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${gradeColor(data.Grade)}`}>
                      Grade {data.Grade || "-"}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-col gap-4 w-full md:w-auto z-10">
                  <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase opacity-50 mb-1">
                      {data.Device === "Mobile" ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                      Device
                    </div>
                    <div className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>{data.Device}</div>
                  </div>
                  <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}>
                    <div className="flex items-center gap-2 text-xs font-bold uppercase opacity-50 mb-1">
                      <Clock className="w-3 h-3" />
                      Time
                    </div>
                    <div className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>{data.Time_Taken}</div>
                  </div>
                </div>
              </div>

              {/* Quick Actions / AIO Badge */}
              <div className={`p-8 rounded-3xl flex flex-col justify-center gap-6 border ${cardClass}`}>
                <div className="space-y-2">
                  <h3 className="text-lg font-bold opacity-80">AI Optimization Readiness</h3>
                  <div className={`text-3xl font-extrabold ${data.AIO_Compatibility_Badge === "High" ? "text-emerald-500" : "text-amber-500"}`}>
                    {data.AIO_Compatibility_Badge || "Analysis Pending"}
                  </div>
                  <p className="text-sm opacity-60 leading-relaxed">
                    How well your site is optimized for AI search engines like ChatGPT and Gemini.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/aio')}
                  className={`mt-auto flex items-center justify-between px-4 py-3 rounded-xl font-semibold border transition-all ${darkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700" : "bg-slate-100 border-slate-200 hover:bg-slate-200"}`}
                >
                  <span>View AIO Report</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ✅ Detailed Metrics Grid */}
            <h3 className="text-xl font-bold px-1 mt-8">Category Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {barData.map((item, index) => (
                <button
                  key={item.name}
                  onClick={() => navigate(`/${item.Link}`)}
                  className={`group relative p-6 rounded-2xl border text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${cardClass}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: `${COLORS[index % COLORS.length]}20` }}>
                      {/* Icon placeholder logic or generic bar icon */}
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    </div>
                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-slate-400" />
                  </div>

                  <div className="space-y-1">
                    <div className="text-3xl font-bold" style={{ color: COLORS[index % COLORS.length] }}>
                      {item.value}%
                    </div>
                    <h4 className={`font-semibold ${darkMode ? "text-slate-200" : "text-slate-700"} group-hover:text-emerald-500 transition-colors`}>{item.name}</h4>
                  </div>

                  {/* Progress Bar visual */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-transparent group-hover:bg-slate-100 dark:group-hover:bg-slate-800 rounded-b-2xl overflow-hidden">
                    <div className="h-full transition-all duration-500" style={{ width: `${item.value}%`, backgroundColor: COLORS[index % COLORS.length] }}></div>
                  </div>
                </button>
              ))}
            </div>

            {/* ✅ Chart Section */}
            <div className={`p-6 md:p-8 rounded-3xl border ${cardClass}`}>
              <h3 className="text-xl font-bold mb-6">Performance Visualization</h3>
              <div className="w-full h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: darkMode ? "#94a3b8" : "#64748b", fontSize: 12 }}
                      dy={10}
                      interval={0}
                      // Formatter to truncate long names on mobile
                      tickFormatter={(value) => value.split(' ')[0]}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: darkMode ? "#94a3b8" : "#64748b", fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: darkMode ? '#ffffff10' : '#00000005', radius: 8 }}
                      contentStyle={{
                        backgroundColor: darkMode ? '#1e293b' : '#ffffff',
                        border: 'none',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                      }}
                      itemStyle={{ color: darkMode ? '#e2e8f0' : '#1e293b', fontWeight: 600 }}
                    />
                    <Bar
                      dataKey="value"
                      radius={[8, 8, 8, 8]}
                      barSize={40}
                      background={{ fill: darkMode ? '#33415550' : '#f1f5f9', radius: 8 }}
                    >
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

      </div>
    </div >
  );
}