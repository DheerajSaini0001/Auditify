import React, { useContext } from "react";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import {
  Search, FileText, Link, Image as ImageIcon, Video,
  Layout, FileCode, Lock, Copy, List, Tag, Globe,
  CheckCircle, AlertTriangle, XCircle, Info
} from "lucide-react";

// ------------------------------------------------------
// ✅ Simple Skeleton
// ------------------------------------------------------
const OnPageSeoShimmer = ({ darkMode }) => (
  <div className={`min-h-screen ${darkMode ? "bg-gray-900" : "bg-gray-50"} p-8 space-y-8`}>
    <div className={`h-64 rounded-3xl ${darkMode ? "bg-gray-800" : "bg-white"} animate-pulse`} />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(9)].map((_, i) => (
        <div key={i} className={`h-40 rounded-xl ${darkMode ? "bg-gray-800" : "bg-white"} animate-pulse`} />
      ))}
    </div>
  </div>
);

// ------------------------------------------------------
// ✅ Metric Card (Security Style)
// ------------------------------------------------------
const MetricCard = ({ title, description, score, value, unit, darkMode, icon: Icon, children, className }) => {
  const displayScore = score !== undefined && score !== null ? (score > 1 ? 100 : Math.round(score * 100)) : 0;
  const isPassed = displayScore >= 90;
  const isWarning = displayScore >= 50 && displayScore < 90;

  // Simple Colors
  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";

  let statusColor = "text-red-600 bg-red-50 border-red-100";
  let statusText = "Failed";

  if (darkMode) {
    statusColor = "text-red-400 bg-red-900/20 border-red-800/30";
  }

  if (isPassed) {
    statusColor = darkMode ? "text-green-400 bg-green-900/20 border-green-800/30" : "text-green-600 bg-green-50 border-green-100";
    statusText = "Passed";
  } else if (isWarning) {
    statusColor = darkMode ? "text-yellow-400 bg-yellow-900/20 border-yellow-800/30" : "text-yellow-600 bg-yellow-50 border-yellow-100";
    statusText = "Warning";
  }

  return (
    <div className={`relative overflow-hidden rounded-xl border ${cardBg} shadow-sm hover:shadow-md transition-shadow group ${className || ""}`}>
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
              <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full w-fit border ${statusColor}`}>
                {statusText}
              </p>
            </div>
          </div>
          <div className={`text-lg font-black ${isPassed ? "text-green-500" : isWarning ? "text-yellow-500" : "text-red-500"}`}>
            {value || "--"} <span className="text-sm font-semibold text-gray-400">{unit}</span>
          </div>
        </div>

        {/* Dynamic Details */}
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            Status Detail
          </h4>
          <p className={`text-sm font-medium ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {description}
          </p>
        </div>

        {/* Technical Data / Children */}
        {children && (
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Technical Data
            </h4>
            <div className={`p-2 rounded text-xs font-mono overflow-x-auto ${darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
              {children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Simple Section
// ------------------------------------------------------
const Section = ({ title, icon: Icon, children, darkMode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 px-2">
      <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
        <Icon size={20} />
      </div>
      <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
        {title}
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

// ------------------------------------------------------
// ✅ Main Component
// ------------------------------------------------------
export default function On_Page_SEO() {
  const { data, loading } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  if (!data?.On_Page_SEO) {
    return <OnPageSeoShimmer darkMode={darkMode} />;
  }

  const seo = data.On_Page_SEO;
  const overallScore = seo.Percentage || 0;
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  // Calculate Passed/Failed
  const allMetrics = [
    seo.Title, seo.Meta_Description, seo.URL_Structure, seo.Canonical, seo.H1,
    seo.Image, seo.Video, seo.Heading_Hierarchy, seo.Semantic_Tags, seo.Structured_Data,
    seo.Contextual_Linking, seo.HTTPS, seo.Pagination_Tags, seo.Links, seo.Duplicate_Content, seo.URL_Slugs
  ].filter(Boolean);

  const passedCount = allMetrics.filter(m => (m.Score !== undefined ? (m.Score > 1 ? 100 : m.Score * 100) : 0) >= 90).length;
  const failedCount = allMetrics.filter(m => (m.Score !== undefined ? (m.Score > 1 ? 100 : m.Score * 100) : 0) < 90).length;

  const desc = {
    title: "Main headline in search results.",
    meta: "Summary text in search results.",
    url: "Address bar structure.",
    canonical: "Prevents duplicate content.",
    h1: "Main page heading.",
    image: "Alt text for accessibility.",
    video: "Embedded video content.",
    imagecompression: "File size optimization.",
    heading: "Logical content structure.",
    semantic: "HTML5 structural tags.",
    structured: "Schema.org metadata.",
    contextual: "Internal links in content.",
    https: "Secure connection.",
    pagination: "Multi-page content.",
    links: "Internal and external navigation.",
    duplicate: "Content uniqueness.",
    slug: "URL path readability."
  };

  return (
    <div className={`min-h-screen w-full ${mainBg} transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* Header Section */}
        <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl ${darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium border border-blue-500/20">
                <Search size={14} />
                <span>SEO Audit</span>
              </div>
              <h1 className={`text-4xl sm:text-5xl font-black tracking-tight ${textColor}`}>
                On-Page <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">SEO</span>
              </h1>
              <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Deep dive into your content strategy, technical structure, and user experience signals.
              </p>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span>{passedCount} Passed</span>
                </div>
                <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  <XCircle size={16} className="text-rose-500" />
                  <span>{failedCount} Failed</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <CircularProgress value={overallScore} size={140} stroke={12} />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-3xl font-bold ${textColor}`}>{overallScore}</span>
                  <span className={`text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Score</span>
                </div>
              </div>
              <div className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Time Taken: {data.Time_Taken}
              </div>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Content Essentials */}
        <Section title="Content Essentials" icon={FileText} darkMode={darkMode}>
          <MetricCard title="Title Tag" description={desc.title} score={seo.Title?.Score} value={seo.Title?.Title_Length + " chars"} darkMode={darkMode} icon={Tag}>
            {seo.Title?.Title && <div className="italic">"{seo.Title.Title}"</div>}
          </MetricCard>
          <MetricCard title="Meta Description" description={desc.meta} score={seo.Meta_Description?.Score} value={seo.Meta_Description?.MetaDescription_Length + " chars"} darkMode={darkMode} icon={FileText}>
            {seo.Meta_Description?.MetaDescription && <div className="italic">"{seo.Meta_Description.MetaDescription}"</div>}
          </MetricCard>
          <MetricCard title="Canonical Tag" description={desc.canonical} score={seo.Canonical?.Score} value={seo.Canonical?.Score ? "Valid" : "Invalid"} darkMode={darkMode} icon={Copy}>
            {seo.Canonical?.Canonical && <div className="break-all">{seo.Canonical.Canonical}</div>}
          </MetricCard>
          <MetricCard title="URL Structure" description={desc.url} score={seo.URL_Structure?.Score} value={seo.URL_Structure?.Score ? "Clean" : "Poor"} darkMode={darkMode} icon={Link}>
            {seo.URL_Structure?.URL && <div className="break-all">{seo.URL_Structure.URL}</div>}
          </MetricCard>
          <MetricCard title="H1 Tag" description={desc.h1} score={seo.H1?.Score} value={seo.H1?.H1_Count + " Found"} darkMode={darkMode} icon={Layout}>
            {seo.H1?.H1_Content?.map((h, i) => <div key={i} className="mb-1">• {h}</div>)}
          </MetricCard>
        </Section>

        {/* Media & Accessibility */}
        <Section title="Media & Accessibility" icon={ImageIcon} darkMode={darkMode}>
          {seo.Image?.Image_Exist != 0 && (
            <MetricCard title="Image Metadata" description="Alt text and Titles." score={seo.Image?.Image_Alt_Meaningfull_Exist} value={seo.Image?.Image_Alt_Meaningfull_Exist ? "Optimized" : "Issues"} darkMode={darkMode} icon={ImageIcon}>
              {/* Missing Alt */}
              {seo.Image?.Without_Alt_Incomplete_Status?.length > 0 && (
                <div className="space-y-1 mb-2">
                  <div className="font-semibold text-red-500">Missing Alt Text ({seo.Image.Without_Alt_Incomplete_Status.length}):</div>
                  <div className="max-h-32 overflow-y-auto custom-scrollbar">
                    {seo.Image.Without_Alt_Incomplete_Status.map((img, i) => (
                      <div key={i} className="truncate text-xs opacity-80 mb-0.5" title={img.src}>{img.src.split('/').pop()}</div>
                    ))}
                  </div>
                </div>
              )}
              {/* Missing Title */}
              {seo.Image?.Without_Title_Incomplete_Status?.length > 0 && (
                <div className="space-y-1">
                  <div className="font-semibold text-red-500">Missing Title Text ({seo.Image.Without_Title_Incomplete_Status.length}):</div>
                  <div className="max-h-32 overflow-y-auto custom-scrollbar">
                    {seo.Image.Without_Title_Incomplete_Status.map((img, i) => (
                      <div key={i} className="truncate text-xs opacity-80 mb-0.5" title={img.src}>{img.src.split('/').pop()}</div>
                    ))}
                  </div>
                </div>
              )}
            </MetricCard>
          )}
          <MetricCard title="Compression" description={desc.imagecompression} score={seo.Image?.Image_Compression_Exist} value={seo.Image?.Image_Compression_Exist ? "Good" : "Heavy"} darkMode={darkMode} icon={ImageIcon}>
            {seo.Image?.Image_Size?.length > 0 && (
              <div className="space-y-4">
                {/* Heavy Images (> 100 KB) */}
                {seo.Image.Image_Size.filter(i => parseFloat(i.sizeKB) > 100).length > 0 && (
                  <div className="space-y-1">
                    <div className="font-semibold text-red-500">Heavy Images &gt; 100 KB ({seo.Image.Image_Size.filter(i => parseFloat(i.sizeKB) > 100).length}):</div>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                      {seo.Image.Image_Size.filter(i => parseFloat(i.sizeKB) > 100).map((img, i) => (
                        <div key={i} className="flex justify-between items-center text-xs border-b border-gray-700/10 dark:border-gray-200/10 pb-1 last:border-0">
                          <span className="truncate w-2/3" title={img.src}>{img.src.split('/').pop()}</span>
                          <span className="font-mono font-bold text-red-500">{img.sizeKB} KB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Optimized Images (< 100 KB) */}
                {seo.Image.Image_Size.filter(i => parseFloat(i.sizeKB) <= 100).length > 0 && (
                  <div className="space-y-1">
                    <div className="font-semibold text-green-500">Optimized Images &lt; 100 KB ({seo.Image.Image_Size.filter(i => parseFloat(i.sizeKB) <= 100).length}):</div>
                    <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                      {seo.Image.Image_Size.filter(i => parseFloat(i.sizeKB) <= 100).map((img, i) => (
                        <div key={i} className="flex justify-between items-center text-xs border-b border-gray-700/10 dark:border-gray-200/10 pb-1 last:border-0">
                          <span className="truncate w-2/3" title={img.src}>{img.src.split('/').pop()}</span>
                          <span className="font-mono font-bold text-green-500">{img.sizeKB} KB</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </MetricCard>
          {seo.Video?.Video_Exist != 0 && <MetricCard title="Video" description={desc.video} score={seo.Video?.Video_Exist} value={seo.Video?.Video_Exist ? "Present" : "Missing"} darkMode={darkMode} icon={Video} />}
        </Section>

        {/* Structure & Semantics */}
        <Section title="Structure & Semantics" icon={Layout} darkMode={darkMode}>
          <MetricCard title="Semantic Tags" description={desc.semantic} score={seo.Semantic_Tags?.Article_Score} value={seo.Semantic_Tags?.Article_Score ? "Used" : "Unused"} darkMode={darkMode} icon={FileCode} />
          <MetricCard title="Contextual Links" description={desc.contextual} score={seo.Contextual_Linking?.Score} value={seo.Contextual_Linking?.Total_Contextual + " Links"} darkMode={darkMode} icon={Link}>
            <div className="space-y-3">
              {seo.Contextual_Linking?.Missing_Links?.length > 0 && (
                <div className="space-y-1">
                  <div className="font-semibold text-yellow-500">Missing from Menu:</div>
                  <div className="flex flex-wrap gap-1">
                    {seo.Contextual_Linking.Missing_Links.map((link, i) => (
                      <span key={i} className={`px-2 py-0.5 rounded text-xs ${darkMode ? "bg-gray-700" : "bg-gray-100"}`}>{link}</span>
                    ))}
                  </div>
                </div>
              )}
              {seo.Contextual_Linking?.Issues?.length > 0 && (
                <div className="space-y-1">
                  <div className="font-semibold text-red-500">Issues Found:</div>
                  <ul className="list-disc list-inside text-xs opacity-90 space-y-1">
                    {seo.Contextual_Linking.Issues.map((issue, i) => (
                      <li key={i}>{issue.finding || issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </MetricCard>
          {seo.Heading_Hierarchy && (
            <MetricCard title="Hierarchy" description={desc.heading} score={seo.Heading_Hierarchy?.Score} value={seo.Heading_Hierarchy?.Score ? "Logical" : "Broken"} darkMode={darkMode} icon={List} className="md:col-span-2 lg:col-span-3">
              <div className="space-y-4">
                {/* Heading Counts */}
                <div className="grid grid-cols-6 gap-2 text-center">
                  {['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].map((tag) => (
                    <div key={tag} className={`p-2 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-50"}`}>
                      <div className="text-xs font-bold opacity-60">{tag}</div>
                      <div className={`font-bold text-lg ${seo.Heading_Hierarchy?.[`${tag}_Count`] > 0 ? (darkMode ? "text-blue-400" : "text-blue-600") : "text-gray-400"}`}>
                        {seo.Heading_Hierarchy?.[`${tag}_Count`] || 0}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Heading List */}
                {seo.Heading_Hierarchy?.Heading?.length > 0 && (
                  <div className={`rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-100 bg-gray-50"}`}>
                    <div className={`px-4 py-2 border-b text-xs font-bold uppercase tracking-wider ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                      Heading Structure
                    </div>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                      {seo.Heading_Hierarchy.Heading.map((h, i) => {
                        const indent = {
                          h1: '',
                          h2: 'ml-4',
                          h3: 'ml-8',
                          h4: 'ml-12',
                          h5: 'ml-16',
                          h6: 'ml-20'
                        };
                        return (
                          <div key={i} className={`flex items-start gap-3 p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${indent[h.tag] || ''}`}>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase flex-shrink-0 ${h.tag === 'h1' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" :
                              h.tag === 'h2' ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300" :
                                "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                              }`}>
                              {h.tag}
                            </span>
                            <span className={`text-sm truncate ${h.tag === 'h1' ? "font-bold" :
                              h.tag === 'h2' ? "font-semibold opacity-90" :
                                "opacity-80"
                              } ${darkMode ? "text-gray-200" : "text-gray-700"}`}>
                              {h.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Issues (if any) */}
                {seo.Heading_Hierarchy?.Heading_Issues?.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-dashed border-gray-200 dark:border-gray-700">
                    <div className="font-semibold text-red-500 text-sm">Hierarchy Issues:</div>
                    {seo.Heading_Hierarchy.Heading_Issues.map((issue, i) => (
                      <div key={i} className="text-xs opacity-90 flex items-start gap-2">
                        <AlertTriangle size={12} className="mt-0.5 flex-shrink-0 text-red-500" />
                        <span>{issue.finding}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </MetricCard>
          )}
        </Section>

        {/* Technical SEO */}
        <Section title="Technical SEO" icon={Lock} darkMode={darkMode}>
          <MetricCard title="HTTPS" description={seo.URL_Structure?.URL?.startsWith("https") ? "Secure connection." : "Insecure connection."} score={seo.HTTPS?.Score} value={seo.URL_Structure?.URL?.startsWith("https") ? "Secure Connection" : "Insecure Connection"} darkMode={darkMode} icon={Lock}>
            {seo.URL_Structure?.URL && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs font-bold ${seo.URL_Structure.URL.startsWith('https') ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}>
                    {seo.URL_Structure.URL.startsWith('https') ? "HTTPS" : "HTTP"}
                  </div>
                  <div className={`text-xs font-mono break-all ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                    {seo.URL_Structure.URL}
                  </div>
                </div>
              </div>
            )}
          </MetricCard>
          <MetricCard title="Pagination" description={desc.pagination} score={seo.Pagination_Tags?.Score} value={seo.Pagination_Tags?.Score ? "Valid" : "None"} darkMode={darkMode} icon={List} />
          <MetricCard title="Duplication" description={desc.duplicate} score={seo.Duplicate_Content?.Score} value={seo.Duplicate_Content?.Score ? "Unique" : "Duplicate"} darkMode={darkMode} icon={Copy} />
          <MetricCard title="Link Profile" description={desc.links} score={seo.Links?.Score} value={seo.Links?.Total + " Total"} darkMode={darkMode} icon={Globe} className="md:col-span-2 lg:col-span-3">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className={`p-3 rounded-lg text-center ${darkMode ? "bg-gray-700/50" : "bg-gray-100/50"}`}>
                <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">Internal</div>
                <div className={`text-2xl font-black ${darkMode ? "text-blue-400" : "text-blue-600"}`}>{seo.Links?.Total_Internal}</div>
              </div>
              <div className={`p-3 rounded-lg text-center ${darkMode ? "bg-gray-700/50" : "bg-gray-100/50"}`}>
                <div className="text-xs font-bold uppercase tracking-wider opacity-60 mb-1">External</div>
                <div className={`text-2xl font-black ${darkMode ? "text-purple-400" : "text-purple-600"}`}>{seo.Links?.Total_External}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Internal Links List */}
              {seo.Links?.Internal_Links?.length > 0 && (
                <div className={`rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-200 bg-gray-50/50"}`}>
                  <div className={`px-4 py-2 border-b text-xs font-bold uppercase tracking-wider ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                    Internal Links
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {seo.Links.Internal_Links.map((link, i) => (
                      <div key={i} className="group p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? "bg-blue-500" : "bg-blue-600"}`}></div>
                          <span className={`text-xs font-bold ${darkMode ? "text-gray-300" : "text-gray-700"} truncate`}>
                            {link.anchor || "No Anchor Text"}
                          </span>
                        </div>
                        <div className={`text-[10px] pl-3.5 font-mono truncate ${darkMode ? "text-blue-400/80" : "text-blue-600/80"}`} title={link.full}>
                          {link.link}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* External Links List */}
              {seo.Links?.External_Links?.length > 0 && (
                <div className={`rounded-xl border ${darkMode ? "border-gray-700 bg-gray-900/30" : "border-gray-200 bg-gray-50/50"}`}>
                  <div className={`px-4 py-2 border-b text-xs font-bold uppercase tracking-wider ${darkMode ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"}`}>
                    External Links
                  </div>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {seo.Links.External_Links.map((link, i) => (
                      <div key={i} className="group p-2 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-2 mb-1">
                          <div className={`w-1.5 h-1.5 rounded-full ${darkMode ? "bg-purple-500" : "bg-purple-600"}`}></div>
                          <span className={`text-xs font-bold ${darkMode ? "text-gray-300" : "text-gray-700"} truncate`}>
                            {link.anchor || "No Anchor Text"}
                          </span>
                          {/* External Icon */}
                          <Globe size={10} className="opacity-40" />
                        </div>
                        <div className={`text-[10px] pl-3.5 font-mono truncate ${darkMode ? "text-purple-400/80" : "text-purple-600/80"}`} title={link.full}>
                          {link.link}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Display Broken Link Counts if they exist */}
            {(seo.Links?.Broken_Internal > 0 || seo.Links?.Broken_External > 0) && (
              <div className="mt-4 flex gap-4 text-xs font-bold">
                {seo.Links?.Broken_Internal > 0 && <span className="text-red-500">Broken Internal: {seo.Links.Broken_Internal}</span>}
                {seo.Links?.Broken_External > 0 && <span className="text-red-500">Broken External: {seo.Links.Broken_External}</span>}
              </div>
            )}
          </MetricCard>
          {seo.URL_Slugs?.Slug_Check_Score == 1 && <MetricCard title="Slugs" description={desc.slug} score={seo.URL_Slugs?.Slug_Check_Score} value="Valid" darkMode={darkMode} icon={Link} />}
        </Section>

        {/* Schema Data */}
        <div className={`rounded-xl p-8 shadow-sm border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <div className="flex items-center gap-3 mb-4">
            <FileCode size={24} className={darkMode ? "text-indigo-400" : "text-indigo-600"} />
            <h3 className={`text-xl font-bold ${textColor}`}>Detected Schema Markup</h3>
          </div>
          <div className={`p-4 rounded-lg overflow-x-auto border ${darkMode ? "bg-gray-900 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-700"}`}>
            <pre className="text-xs font-mono leading-relaxed">
              {JSON.stringify(data.Schema, null, 2)}
            </pre>
          </div>
        </div>

      </main>
    </div>
  );
}