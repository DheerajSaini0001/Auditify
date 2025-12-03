import React, { useContext, useState } from "react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";

import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";

// ------------------------------------------------------
// ✅ High-Fidelity Skeleton Components
// ------------------------------------------------------
const SkeletonMetricCard = ({ darkMode }) => {
  // Increased contrast for skeletons
  const shimmerBg = darkMode ? "bg-slate-700" : "bg-slate-300";
  const shimmerCardBg = darkMode ? "bg-slate-800" : "bg-white";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";

  return (
    <div className={`p-6 rounded-2xl shadow-sm ${shimmerCardBg} border ${borderColor} animate-pulse`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`h-10 w-10 rounded-xl ${shimmerBg}`}></div>
        <div className={`h-6 w-16 rounded-full ${shimmerBg}`}></div>
      </div>
      <div className={`h-8 w-3/4 rounded ${shimmerBg} mb-3`}></div>
      <div className={`h-4 w-full rounded ${shimmerBg} mb-2`}></div>
      <div className={`h-4 w-2/3 rounded ${shimmerBg}`}></div>
    </div>
  );
};

const OnPageSeoShimmer = ({ darkMode }) => {
  const mainBg = darkMode ? "bg-slate-950" : "bg-slate-50";
  return (
    <div className={`relative flex w-full h-full min-h-screen ${mainBg} p-8`}>
      <div className="flex-1 space-y-8 max-w-7xl mx-auto">
        <div className={`h-48 w-full rounded-3xl ${darkMode ? "bg-slate-800" : "bg-white"} shadow-sm border ${darkMode ? "border-slate-700" : "border-slate-200"} animate-pulse`}></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonMetricCard key={i} darkMode={darkMode} />)}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------
// ✅ HELPER COMPONENTS (Refined for Visibility)
// ---------------------------------------------------------

function StatBadge({ label, value, color = "indigo" }) {
  const colors = {
    indigo: {
      light: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
      dark: "bg-indigo-900 text-indigo-200 border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
    },
    green: {
      light: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
      dark: "bg-emerald-900 text-emerald-200 border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
    },
    red: {
      light: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
      dark: "bg-rose-900 text-rose-200 border-rose-800 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
    },
    amber: {
      light: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
      dark: "bg-amber-900 text-amber-200 border-amber-800 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
    },
    slate: {
      light: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
      dark: "bg-slate-900 text-slate-200 border-slate-800 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800",
    },
  };

  // Added border property for better definition in light mode
  return (
    <div className={`flex flex-col items-center p-2 rounded-lg border ${colors[color] || colors.slate}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-80">{label}</span>
      <span className="text-lg font-black">{value}</span>
    </div>
  );
}

function LinksDisplay({ linksData, darkMode }) {
  const safeArray = (val) => (Array.isArray(val) ? val : []);
  const internal = safeArray(linksData.Internal_Links);
  const external = safeArray(linksData.External_Links);

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatBadge label="Total" value={linksData.Total} color="indigo" />
        <StatBadge label="Internal" value={internal.length} color="green" />
        <StatBadge label="External" value={external.length} color="slate" />
        <StatBadge label="Unique" value={linksData.Total_Unique} color="indigo" />
      </div>

      {internal.length > 0 && (
        <div className={`p-3  border  rounded-lg shadow-sm ${darkMode ? "scrollbar-thumb-slate-600 bg-slate-800/50 border-slate-700  " : "scrollbar-thumb-slate-600 bg-slate-100 border-slate-200"} `}>
          <h4 className={`font-bold text-xs mb-2 uppercase tracking-wide ${darkMode ? "text-slate-200" : "text-slate-800"}`}>Internal Links ({internal.length})</h4>
          <ul className={`space-y-2 max-h-32 overflow-y-auto scrollbar-thin   ${darkMode ? "text-slate-200 scrollbar-thumb-slate-600" : "text-slate-800 scrollbar-thumb-slate-300"}`}>
            {internal.map((l, i) => (
              <li key={i} className={`"text-xs  dark:ttruncate flex items-center gap-2 ${darkMode ? "text-slate-400 " : "text-slate-600"}`}>
                <span className={`font-semibold ${darkMode ? "text-indigo-400" : "text-indigo-600"} shrink-0`}>[{l.anchor}]</span>
                <span className="truncate">{l.link}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {external.length > 0 && (
        <div className={`p-3  border  rounded-lg shadow-sm ${darkMode ? "scrollbar-thumb-slate-600 bg-slate-800/50 border-slate-700  " : "scrollbar-thumb-slate-600 bg-slate-100 border-slate-200"} `}>
          <h4 className={`font-bold text-xs mb-2 uppercase tracking-wide ${darkMode ? "text-slate-200" : "text-slate-800"}`}>External Links ({external.length})</h4>
          <ul className={`space-y-2 max-h-32 overflow-y-auto scrollbar-thin ${darkMode ? "text-slate-200 scrollbar-thumb-slate-600" : "text-slate-800 scrollbar-thumb-slate-300"}`}>
            {external.map((l, i) => (
              <li key={i} className={`text-xs  dark:ttruncate flex items-center gap-2 ${darkMode ? "text-slate-400 " : "text-slate-600"}`}>
                <span className={`font-semibold ${darkMode ? "text-indigo-400" : "text-indigo-600"} shrink-0`}>[{l.anchor}]</span>
                <span className="truncate">{l.link}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ImageSizeDisplay({ sizeData, darkMode }) {
  const safeArray = (val) => (Array.isArray(val) ? val : []);
  const images = safeArray(sizeData);
  const heavyImages = images.filter(img => parseFloat(img.sizeKB) > 100);
  const optimizedImages = images.filter(img => parseFloat(img.sizeKB) <= 100);

  if (images.length === 0) return null;

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <StatBadge label="Total Images" value={images.length} color="indigo" />
        <StatBadge label="Heavy (>100KB)" value={heavyImages.length} color={heavyImages.length > 0 ? "red" : "green"} />
      </div>

      {heavyImages.length > 0 && (
        <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-200 dark:border-rose-800">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-2 uppercase">Needs Optimization:</p>
          <ul className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-rose-200 dark:scrollbar-thumb-rose-800">
            {heavyImages.map((img, i) => (
              <li key={i} className="flex justify-between items-center text-xs border-b border-rose-100 dark:border-rose-800/30 last:border-0 py-2">
                <span className="truncate w-3/4 text-slate-700 dark:text-slate-300 font-medium" title={img.src}>{img.src}</span>
                <span className="font-bold text-rose-600 bg-rose-100 dark:bg-rose-900/50 px-2 py-0.5 rounded">{img.sizeKB} KB</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {optimizedImages.length > 0 && (
        <div className={`p-3  border  ${darkMode ? "scrollbar-thumb-slate-600 bg-slate-800/50 border-slate-700  " : "scrollbar-thumb-slate-600 bg-slate-100 border-slate-200"}  rounded-lg shadow-sm`}>
          <p className={`text-xs font-bold ${darkMode ? "text-emerald-400" : "text-emerald-700"} mb-2 uppercase`}>Optimized Images ({optimizedImages.length})</p>
          <ul className={`space-y-1 max-h-32 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-200 ${darkMode ? "scrollbar-thumb-emerald-800" : "scrollbar-thumb-emerald-200"}`}>
            {optimizedImages.map((img, i) => (
              <li key={i} className="flex justify-between text-xs py-1">
                <span className={`truncate w-3/4 ${darkMode ? "text-emerald-400" : "text-emerald-700"}`}>{img.src}</span>
                <span className="text-emerald-600 font-bold">{img.sizeKB} KB</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function AltImagesDisplay({ imgData, darkMode }) {
  const safeArray = (val) => (Array.isArray(val) ? val : []);
  const withoutAlt = safeArray(imgData.Without_Alt_Incomplete_Status || imgData.Without_Alt || imgData.Missing_Alt);
  const withoutTitle = safeArray(imgData.Without_Title_Incomplete_Status || imgData.Missing_Title);
  const complete = safeArray(imgData.Complete_Status);
  const totalImages = Array.isArray(imgData.Image_Size) ? imgData.Image_Size.length : (withoutAlt.length + complete.length);

  return (
    <div className="mt-4 space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <StatBadge label="Total Images" value={totalImages} color="indigo" />
        <StatBadge label="Missing Alt" value={withoutAlt.length} color={withoutAlt.length > 0 ? "red" : "green"} />
        <StatBadge label="Missing Title" value={withoutTitle.length} color={withoutTitle.length > 0 ? "amber" : "green"} />
      </div>
      {/* 🔴 Missing Alt */}
      {withoutAlt.length > 0 && (
        <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-lg border border-rose-200 dark:border-rose-800">
          <h4 className="font-bold text-xs text-rose-700 dark:text-rose-300 mb-2 uppercase">Missing Alt Text ({withoutAlt.length})</h4>
          <ul className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-rose-200 dark:scrollbar-thumb-rose-800">
            {withoutAlt.map((img, i) => (
              <li key={i} className="text-xs text-slate-700 dark:text-slate-300 truncate py-1 border-b border-rose-100 dark:border-rose-800/30 last:border-0">
                {img.src || img}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 🟠 Missing Title */}
      {withoutTitle.length > 0 && (
        <div className={`p-3  ${darkMode ? "scrollbar-thumb-slate-600 bg-slate-800/50 border-slate-700  " : "scrollbar-thumb-slate-600 bg-slate-100 border-slate-200"}  rounded-lg border  `}>
          <h4 className="font-bold text-xs text-amber-700 dark:text-amber-300 mb-2 uppercase">Missing Title Attribute ({withoutTitle.length})</h4>
          <ul className="space-y-1 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-200 dark:scrollbar-thumb-amber-800">
            {withoutTitle.map((img, i) => (
              <li key={i} className={`text-xs ${darkMode ? "text-amber-300 border-amber-800/30" : "text-slate-700 border-amber-100"} truncate py-1`}>
                {img.src || "Unknown Source"}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 🟢 Fully Optimized */}
      {complete.length > 0 && (
        <div className={`p-3  border ${darkMode ? "scrollbar-thumb-slate-600 bg-slate-800/50 border-slate-700  " : "scrollbar-thumb-slate-600 bg-slate-100 border-slate-200"}  rounded-lg shadow-sm`}>
          <h4 className="font-bold text-xs text-emerald-700 dark:text-emerald-400 mb-2 uppercase">Fully Optimized ({complete.length})</h4>
          <ul className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            {complete.map((img, i) => (
              <li key={i} className={`text-xs ${darkMode ? "text-slate-300 border-slate-700/30" : "text-slate-700 border-slate-100"} truncate py-1 border-b border-slate-100 dark:border-slate-700 last:border-0 pb-2 mb-2 last:mb-0 last:pb-0`}>
                <div className="flex flex-col gap-1 mb-1">
                  <span className={`font-medium ${darkMode ? "text-slate-200" : "text-slate-800"}`}><span className={`text-emerald-600 font-bold ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>Alt:</span> "{img.alt}"</span>
                  <span className={`font-medium ${darkMode ? "text-slate-200" : "text-slate-800"}`}><span className={`text-indigo-500 font-bold ${darkMode ? "text-indigo-300" : "text-indigo-600"}`}>Title:</span> "{img.title}"</span>
                </div>
                <p className={`text-slate-400 ${darkMode ? "text-slate-300" : "text-slate-900"} truncate text-[10px]`}>{img.src}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function HeadingHierarchyCard({ data, darkMode }) {
  const headings = Array.isArray(data) ? data : data?.Heading || [];
  const issues = !Array.isArray(data) ? data?.Heading_Issues || [] : [];

  return (
    <div className="mt-4 space-y-3">
      {issues.length > 0 ? (
        <div className={`p-3 ${darkMode ? "bg-rose-900/10 border-rose-800" : "bg-rose-50 border-rose-200"} rounded-lg border  `}>
          <h4 className={`font-bold text-xs   mb-2 uppercase ${darkMode ? "text-rose-300" : "text-rose-700"}`}>Hierarchy Issues ({issues.length})</h4>
          <ul className="space-y-1">
            {issues.map((issue, i) => (
              <li key={i} className={`text-xs  py-1 font-medium ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                • {issue.finding}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className={`p-2  ${darkMode ? "bg-emerald-900/20 border-emerald-800" : "bg-emerald-50 border-emerald-200"}  rounded-lg text-center border `}>
          <span className={`text-xs font-bold uppercase ${darkMode ? "text-emerald-300" : "text-emerald-700"}`}>✅ Perfect Heading Structure</span>
        </div>
      )}

      {/* Full Heading List - Background fixed for light mode */}
      <div className={`max-h-64 overflow-y-auto scrollbar-thin  ${darkMode ? "scrollbar-thumb-slate-600 bg-slate-800/50 border-slate-700  " : "scrollbar-thumb-slate-600 bg-slate-100 border-slate-200"} border  p-4 rounded-lg shadow-inner`}>
        {headings.length === 0 ? (
          <p className={`text-xs italic ${darkMode ? "text-slate-300" : "text-slate-700"}`}>No headings found.</p>
        ) : (
          headings.map((h, i) => (
            <div
              key={i}
              className="flex items-center gap-2 mb-2 last:mb-0 group"
              style={{ paddingLeft: `${(parseInt(h.tag[1]) - 1) * 12}px` }}
            >
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border  shrink-0 ${h.tag === 'h1'
                ? (darkMode ? 'bg-indigo-500/20 text-slate-300 border-indigo-500/30 font-bold' : 'bg-indigo-100 text-slate-700 border-indigo-200')
                : (darkMode ? 'bg-indigo-500/20 text-slate-300 border-indigo-500/30 font-bold' : 'bg-indigo-100 text-slate-700 border-indigo-200')
                }  uppercase`}>
                {h.tag}
              </span>
              <p className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-800"} truncate ${h.tag === 'h1'
                ? (darkMode ? ' text-indigo-300 border-indigo-500/30 font-bold' : ' text-slate-700 border-indigo-200')
                : (darkMode ? ' text-indigo-300 border-indigo-500/30 font-bold' : ' text-slate-700 border-indigo-200')
                }`}>
                {h.text || <span className={`italic text-slate-400 ${darkMode ? "text-slate-300" : "text-slate-800"}`}>Empty Heading</span>}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ------------------------------------------------------
// ✅ ModernMetricCard Component (Revamped & High Contrast)
// ------------------------------------------------------
const ModernMetricCard = ({
  title,
  description,
  score,
  value,
  unit,
  darkMode,
  icon,
  Title,
  metaDiscription,
  heading,
  links,
  canonical,
  altData,
  imageData,
  imageSizeData,
  h1Data,
  contextualData,
  urlData,
  className
}) => {
  const displayScore = score !== undefined && score !== null ? (score > 1 ? 100 : Math.round(score * 100)) : 0;

  // Optimized Color Logic for Light/Dark
  let statusColor = "text-rose-600 dark:text-rose-400";
  let iconBg = "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800";

  if (displayScore >= 90) {
    statusColor = "text-emerald-600 dark:text-emerald-400";
    iconBg = "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
  } else if (displayScore >= 50) {
    statusColor = "text-amber-600 dark:text-amber-400";
    iconBg = "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
  }

  const hasContent = Title || metaDiscription || urlData || h1Data || contextualData || links || heading || altData || imageSizeData || canonical;

  return (
    <div className={`group relative rounded-2xl border ${darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"} shadow-sm hover:shadow-lg transition-all duration-300 ease-out ${className || ""}`}>

      {/* Top Bar */}
      <div className="flex justify-between items-start p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${iconBg} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 shadow-inner`}>
            {icon}
          </div>
          <div>
            <h3 className={`font-bold text-lg leading-tight ${darkMode ? "text-slate-100" : "text-slate-900"}`}>{title}</h3>
            <div className={`text-xs font-bold mt-1 ${statusColor}`}>Score: {displayScore}</div>
          </div>
        </div>
      </div>

      {/* Main Value */}
      <div className="px-6 pb-4">
        <div className={`text-3xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
          {value || "--"} <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">{unit}</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed font-medium">
          {description}
        </p>
      </div>

      {/* Content Area */}
      {hasContent && (
        <div className="px-6 pb-6 space-y-4">
          <div className={`h-px w-full ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}></div>

          {/* Title Tag */}
          {Title && (
            <div className={`text-sm `}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Content Preview</span>
              <p className={`font-medium mt-1 italic p-3 rounded-lg border ${darkMode ? "scrollbar-thumb-slate-600 bg-slate-800/50 border-slate-700  " : "scrollbar-thumb-slate-600 bg-slate-100 border-slate-200"} `}>
                "{Title.Title}"
              </p>
            </div>
          )}

          {/* Meta Description */}
          {metaDiscription && (
            <div className={`text-sm `}>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Content Preview</span>
              <p className={`font-medium mt-1 italic p-3 rounded-lg border ${darkMode ? "scrollbar-thumb-slate-600 bg-slate-800/50 border-slate-700  " : "scrollbar-thumb-slate-600 bg-slate-100 border-slate-200"} `}>
                "{metaDiscription.MetaDescription}"
              </p>
            </div>
          )}

          {/* Canonical */}
          {canonical && (
            <div className="text-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Canonical URL</span>
              <p className={`font-mono text-xs mt-1 break-all p-2 rounded border ${darkMode ? "bg-slate-800 border-slate-700 text-indigo-300" : "bg-slate-50 border-slate-200 text-indigo-700"}`}>
                {canonical}
              </p>
            </div>
          )}

          {/* URL Structure */}
          {urlData && (
            <div className="mt-2">
              {urlData.Issues && urlData.Issues.length > 0 ? (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800">
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">Analyzed URL:</p>
                  <p className="text-xs font-mono break-all text-rose-600 dark:text-rose-300 mb-3 border-b border-rose-200 dark:border-rose-800 pb-2">
                    {urlData.URL}
                  </p>
                  <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-2">Issues Found:</p>
                  <ul className="space-y-1">
                    {urlData.Issues.map((issue, i) => (
                      <li key={i} className="text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 font-medium break-words">
                        <span>•</span>
                        <span>
                          {issue.segment && (
                            <span className="font-mono font-bold text-rose-800 dark:text-rose-200 bg-rose-100 dark:bg-rose-900/50 px-1.5 py-0.5 rounded mr-1.5 text-[10px] border border-rose-200 dark:border-rose-700">
                              {issue.segment}
                            </span>
                          )}
                          {issue.reason || issue.finding || (typeof issue === 'string' ? issue : JSON.stringify(issue))}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className={`p-3 rounded-xl border ${darkMode ? "border-emerald-800 scrollbar-thumb-slate-600 bg-slate-800/50 border-slate-700  " : " border-emerald-200  scrollbar-thumb-slate-600 bg-slate-100 border-slate-200"}`}>
                  <p className={`text-xs font-bold  mb-1 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>Clean URL</p>
                  <p className={`text-xs font-mono  break-all ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{urlData.URL}</p>
                </div>
              )}
            </div>
          )}

          {/* H1 Details */}
          {h1Data && (
            <div className="mt-2">
              {h1Data.H1_Content?.map((h1, i) => (
                <div key={i} className={`text-sm font-bold p-3 rounded-xl border mb-2 ${darkMode ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-slate-50 text-slate-800 border-slate-200"}`}>
                  <span className="text-[10px] text-indigo-500 font-black uppercase block mb-1">H1 Tag</span>
                  {h1}
                </div>
              ))}
              {h1Data.H1_Issues?.length > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800 mt-2">
                  <p className="text-xs text-rose-600 font-bold">⚠️ {h1Data.H1_Issues[0].finding}</p>
                </div>
              )}
            </div>
          )}

          {/* Contextual Links */}
          {contextualData && (
            <div className="mt-3 space-y-3">
              {contextualData.Missing_Links?.length > 0 ? (
                <div className={`p-3   rounded-xl border ${darkMode ? "scrollbar-thumb-slate-600 bg-slate-800/50 border-slate-700  " : "scrollbar-thumb-slate-600 bg-slate-100 border-slate-200"} `}>
                  <p className={`text-xs font-bold  mb-2 ${darkMode ? "text-amber-400" : "text-amber-700"}`}>Missing Links from Menu ({contextualData.Missing_Links.length}):</p>
                  <div className={`flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-thin  ${darkMode ? "scrollbar-thumb-amber-800" : "scrollbar-thumb-amber-200"}`}>
                    {contextualData.Missing_Links.map((l, i) => (
                      <span key={i} className={`text-[10px] px-2.5 py-1 ${darkMode ? "bg-amber-900/40 text-amber-200 border-amber-700" : "bg-white text-amber-800 border-amber-200"} rounded-lg border  font-bold shadow-sm`}>
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl text-center border border-emerald-200 dark:border-emerald-800">
                  <span className="text-sm text-emerald-700 dark:text-emerald-400 font-bold">✅ All menu items linked</span>
                </div>
              )}
            </div>
          )}

          {/* Complex Components - Passed props allow them to handle their own light/dark styling */}
          {links && <LinksDisplay darkMode={darkMode} linksData={links} />}
          {heading && <HeadingHierarchyCard darkMode={darkMode} data={heading} />}
          {altData && <AltImagesDisplay darkMode={darkMode} imgData={altData} />}
          {imageSizeData && <ImageSizeDisplay darkMode={darkMode} sizeData={imageSizeData} />}

        </div>
      )}
    </div>
  );
};

// ------------------------------------------------------
// ✅ Section Component (Refined)
// ------------------------------------------------------
function Section({ title, icon, children, score, gridCols }) {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  // Gradient Score Bar
  let scoreColor = "bg-rose-500";
  let scoreText = "text-rose-600 dark:text-rose-400";
  if (score >= 90) { scoreColor = "bg-emerald-500"; scoreText = "text-emerald-600 dark:text-emerald-400"; }
  else if (score >= 50) { scoreColor = "bg-amber-500"; scoreText = "text-amber-600 dark:text-amber-400"; }

  return (
    <div className="mb-20">
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 p-6 rounded-2xl ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} border shadow-sm`}>
        <div className="flex items-center gap-5">
          {/* Enhanced Icon Box */}
          <div className={`flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/20 text-3xl`}>
            {icon}
          </div>
          <div>
            <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{title}</h2>
            <div className="flex items-center gap-3 mt-2">
              <div className="h-2 w-32 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div className={`h-full ${scoreColor} transition-all duration-1000 ease-out`} style={{ width: `${score}%` }}></div>
              </div>
              <span className={`text-sm font-bold ${darkMode ? "text-slate-400" : "text-slate-500"}`}>{Math.round(score)}% Optimized</span>
            </div>
          </div>
        </div>

        <div className={`flex items-center justify-center px-8 py-3 rounded-2xl ${darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"} border`}>
          <div className="text-center">
            <span className={`block text-3xl font-black ${scoreText}`}>{Math.round(score)}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Score</span>
          </div>
        </div>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 ${gridCols || "lg:grid-cols-3"} gap-8`}>
        {children}
      </div>
    </div>
  );
}

// ------------------------------------------------------
// ✅ MAIN COMPONENT
// ------------------------------------------------------
export default function On_Page_SEO() {
  const { data, loading } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  if (loading || !data || data.Status === "inprogress") {
    return <OnPageSeoShimmer darkMode={darkMode} />;
  }

  const seo = data?.On_Page_SEO || {};

  // Helper to normalize score to 0-100
  const getScore = (val) => (val !== undefined && val !== null ? (val > 1 ? 100 : Math.round(val * 100)) : 0);

  // Calculate Section Scores
  const contentScore = (
    getScore(seo.Title?.Score) +
    getScore(seo.Meta_Description?.Score) +
    getScore(seo.URL_Structure?.Score) +
    getScore(seo.Canonical?.Score) +
    getScore(seo.H1?.Score)
  ) / 5;

  const mediaScore = (
    getScore(seo.Image?.Image_Alt_Meaningfull_Exist) +
    getScore(seo.Video?.Video_Exist) +
    getScore(seo.Image?.Image_Compression_Exist)
  ) / 3;

  const structureScore = (
    getScore(seo.Heading_Hierarchy?.Score) +
    getScore(seo.Semantic_Tags?.Article_Score) +
    getScore(seo.Structured_Data?.Score) +
    getScore(seo.Contextual_Linking?.Score)
  ) / 4;

  const technicalScore = (
    getScore(seo.HTTPS?.Score) +
    getScore(seo.Pagination_Tags?.Score) +
    getScore(seo.Links?.Score) +
    getScore(seo.Duplicate_Content?.Score) +
    getScore(seo.URL_Slugs?.Slug_Check_Score)
  ) / 5;

  const linksData = {
    Total: seo.Links?.Total,
    Total_Internal: seo.Links?.Total_Internal,
    Total_External: seo.Links?.Total_External,
    Total_Unique: seo.Links?.Total_Unique,
    Internal_Links: seo.Links?.Internal_Links,
    External_Links: seo.Links?.External_Links
  };

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
    // Used Slate-50 for light mode background instead of gray-100 for a cleaner look
    <div className={`min-h-screen w-full ${darkMode ? "bg-slate-950" : "bg-slate-50"}`}>

      {/* Hero Header */}
      <div className={`relative w-full py-20 px-6 overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} border-b`}>
        <div className={`absolute inset-0 ${darkMode ? "bg-slate-900" : "bg-white"} -z-10`}></div>
        {/* Abstract Background Shapes - Adjusted colors */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl pointer-events-none">
          <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-violet-500/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
          <div className="text-center md:text-left">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full  border    ${darkMode ? "text-indigo-100 border-indigo-800 bg-indigo-900/30" : " text-indigo-700  border-indigo-800 . bg-indigo-50"} text-xs font-bold uppercase tracking-wider mb-6`}>
              🚀 SEO Audit Report
            </div>
            <h1 className={`text-5xl md:text-7xl font-black mb-6 tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
              On-Page <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Optimization</span>
            </h1>
            <p className={`text-xl max-w-2xl ${darkMode ? "text-slate-400" : "text-slate-600"} leading-relaxed font-medium`}>
              Deep dive into your content strategy, technical structure, and user experience signals.
            </p>
            <div className="mt-8 flex flex-wrap justify-center md:justify-start gap-4">
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold ${darkMode ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-white text-slate-700 shadow-sm border border-slate-200"}`}>
                ⏱ Time Taken: {data.Time_Taken}
              </div>
              <div className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold ${darkMode ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-white text-slate-700 shadow-sm border border-slate-200"}`}>
                📄 {seo.Links?.Total || 0} Links Analyzed
              </div>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-500"></div>
            <div className={`relative rounded-full p-2 shadow-2xl ${darkMode ? "bg-slate-900" : "bg-white"}`}>
              <CircularProgress value={seo?.Percentage || 0} size={160} stroke={12} />
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className={`text-4xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{seo?.Percentage}</span>
                <span className="text-xs text-slate-400 uppercase font-bold tracking-widest mt-1">Score</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-6 py-12">

        <Section title="Content Essentials" icon="🧠" score={contentScore}>
          <ModernMetricCard title="Title Tag" description={desc.title} score={seo.Title?.Score} Title={seo?.Title} value={seo.Title?.Title_Length + " chars"} darkMode={darkMode} icon="🏷️" />
          <ModernMetricCard title="Meta Description" description={desc.meta} score={seo.Meta_Description?.Score} metaDiscription={seo.Meta_Description} value={seo.Meta_Description?.MetaDescription_Length + " chars"} darkMode={darkMode} icon="📝" />
          <ModernMetricCard title="URL Structure" description={desc.url} score={seo.URL_Structure?.Score} value={seo.URL_Structure?.Score ? "Clean" : "Poor"} darkMode={darkMode} icon="🔗" urlData={seo.URL_Structure} />
          <ModernMetricCard title="Canonical Tag" description={desc.canonical} canonical={seo.Canonical?.Canonical} score={seo.Canonical?.Score} value={seo.Canonical?.Score ? "Valid" : "Invalid"} darkMode={darkMode} icon="📜" />
          <ModernMetricCard title="H1 Tag" description={desc.h1} score={seo.H1?.Score} value={seo.H1?.H1_Count + " Found"} darkMode={darkMode} icon="🔠" h1Data={seo.H1} />
        </Section>

        <Section title="Media & Accessibility" icon="🖼️" score={mediaScore} gridCols="lg:grid-cols-2">
          {seo.Image?.Image_Exist != 0 && (
            <ModernMetricCard
              title="Alt Text"
              description={desc.image}
              score={seo.Image?.Image_Alt_Meaningfull_Exist}
              value={seo.Image?.Image_Alt_Meaningfull_Exist ? "Optimized" : "Issues"}
              darkMode={darkMode}
              icon="🖼️"
              altData={seo.Image}
            />
          )}
          <ModernMetricCard
            title="Compression"
            description={desc.imagecompression}
            score={seo.Image?.Image_Compression_Exist}
            value={seo.Image?.Image_Compression_Exist ? "Good" : "Heavy"}
            darkMode={darkMode}
            icon="🗜️"
            imageSizeData={seo.Image?.Image_Size}
          />
          {seo.Video?.Video_Exist != 0 && <ModernMetricCard title="Video" description={desc.video} score={seo.Video?.Video_Exist} value={seo.Video?.Video_Exist ? "Present" : "Missing"} darkMode={darkMode} icon="🎥" />}
        </Section>

        <Section title="Structure & Semantics" icon="🛠️" score={structureScore}>

          <ModernMetricCard title="Semantic Tags" description={desc.semantic} score={seo.Semantic_Tags?.Article_Score} value={seo.Semantic_Tags?.Article_Score ? "Used" : "Unused"} darkMode={darkMode} icon="📄" />
          <ModernMetricCard title="Schema" description={desc.structured} score={seo.Structured_Data?.Score} value={seo.Structured_Data?.Score ? "Detected" : "None"} darkMode={darkMode} icon="🧩" />
          <ModernMetricCard
            title="Contextual Links"
            description={desc.contextual}
            score={seo.Contextual_Linking?.Score}
            value={seo.Contextual_Linking?.Total_Contextual + " Links"}
            darkMode={darkMode}
            icon="🔗"
            contextualData={seo.Contextual_Linking}
          />
          {seo.Heading_Hierarchy && <ModernMetricCard
            title="Hierarchy"
            description={desc.heading}
            heading={seo.Heading_Hierarchy}
            score={seo.Heading_Hierarchy?.Score}
            value={seo.Heading_Hierarchy?.Score ? "Logical" : "Broken"}
            darkMode={darkMode}
            icon="📚"
            className="md:col-span-2 lg:col-span-3"
          />}
        </Section>

        <Section title="Technical SEO" icon="⚙️" score={technicalScore}>
          <ModernMetricCard title="HTTPS" description={desc.https} score={seo.HTTPS?.Score} value={seo.HTTPS?.Score ? "Secure" : "Insecure"} darkMode={darkMode} icon="🔒" />
          <ModernMetricCard title="Pagination" description={desc.pagination} score={seo.Pagination_Tags?.Score} value={seo.Pagination_Tags?.Score ? "Valid" : "None"} darkMode={darkMode} icon="📑" />
          <ModernMetricCard title="Duplication" description={desc.duplicate} score={seo.Duplicate_Content?.Score} value={seo.Duplicate_Content?.Score ? "Unique" : "Duplicate"} darkMode={darkMode} icon="🧬" />
          <ModernMetricCard title="Link Profile" description={desc.links} links={linksData} score={seo.Links?.Score} value={seo.Links?.Total + " Total"} darkMode={darkMode} icon="🧭" className="md:col-span-2 lg:col-span-3" />
          {seo.URL_Slugs?.Slug_Check_Score == 1 && <ModernMetricCard title="Slugs" description={desc.slug} score={seo.URL_Slugs?.Slug_Check_Score} value="Valid" darkMode={darkMode} icon="🧾" />}
        </Section>
        {/* Schema Data - Made to look like a Code Block */}
        <div className={`mt-12 p-8 rounded-3xl ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} shadow-lg border`}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🧩</span>
            <h3 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>Detected Schema Markup</h3>
          </div>
          <div className={`p-6 rounded-2xl overflow-x-auto border ${darkMode ? "scrollbar-thumb-slate-600 bg-slate-800/50 border-slate-700  " : "scrollbar-thumb-slate-600 bg-slate-100 border-slate-200"}`}>
            <pre className={`text-xs font-mono leading-relaxed ${darkMode ? "text-indigo-300" : "text-slate-700"}`}>
              {JSON.stringify(data.Schema, null, 2)}
            </pre>
          </div>
        </div>

        {/* Audit Dropdowns */}
        <div className="mt-16 space-y-6">
          <AuditDropdown items={seo?.Passed} title="✅ Passed Audits" darkMode={darkMode} />
          <AuditDropdown items={seo?.Improvements} title="⚠️ Improvements Needed" darkMode={darkMode} />
        </div>



      </div>
    </div>
  );
}