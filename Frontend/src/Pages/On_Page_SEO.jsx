import React, { use, useContext, useState } from "react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import Sidebar from "../Component/Sidebar";

// ------------------------------------------------------
// ✅ NEW: High-Fidelity Skeleton Components
// ------------------------------------------------------
const SkeletonSidebar = ({ darkMode }) => (
  <div
    className={`fixed top-0 mt-16 left-0 h-full w-64 ${
      darkMode ? "bg-gray-900" : "bg-white"
    } shadow-lg p-6`}
  >
    {[...Array(4)].map((_, i) => (
      <div
        key={i}
        className={`h-7 rounded mb-5 animate-pulse ${
          darkMode ? "bg-gray-700" : "bg-gray-300"
        }`}
      ></div>
    ))}
  </div>
);

const SkeletonMetricCard = ({ darkMode }) => {
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const shimmerCardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-gray-50 to-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <div className={`p-6 rounded-xl shadow-lg ${shimmerCardBg} border ${border}`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`h-5 w-1/3 rounded ${shimmerBg}`}></div>
        <div className={`h-6 w-16 rounded-full ${shimmerBg}`}></div>
      </div>
      <div className={`h-10 w-1/2 rounded ${shimmerBg} mb-4`}></div>
      <div className={`h-10 w-full rounded-lg ${shimmerBg} mt-2`}></div>
    </div>
  );
};

const SkeletonHeaderCard = ({ darkMode }) => {
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const shimmerCardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  
  const { data } = useData();
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <div className={`w-full ${data?.Report === "All" ? "  " : " "} p-8 rounded-2xl shadow-2xl ${shimmerCardBg} border-l-8 ${border} border-l-gray-500`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className={`h-12 w-80 rounded ${shimmerBg} mb-3`}></div>
          <div className={`h-4 w-64 rounded ${shimmerBg}`}></div>
        </div>
        <div className={`h-20 w-20 rounded-full ${shimmerBg}`}></div>
      </div>
      <div className={`h-8 w-1/3 rounded-full ${shimmerBg}`}></div>
    </div>
  );
};

const SkeletonSectionCard = ({ metricCount, darkMode }) => {
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const { data } = useData();
  const shimmerCardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  const border = darkMode ? "border-gray-700" : "border-gray-200";
  
  return (
    <div className={`w-full ${data?.Report === "All" ? "  " : " "} p-8 rounded-2xl shadow-2xl ${shimmerCardBg} border-l-8 ${border} border-l-gray-500`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`h-8 w-8 rounded ${shimmerBg}`}></div>
        <div className={`h-7 w-1/2 rounded ${shimmerBg}`}></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: metricCount }).map((_, index) => (
          <SkeletonMetricCard key={index} darkMode={darkMode} />
        ))}
      </div>
    </div>
  );
};

const SkeletonSchemaCard = ({ darkMode }) => {
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const shimmerCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";

  const { data } = useData();
  const preBg = darkMode ? "bg-gray-800" : "bg-gray-100";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <div className={`w-full ${data?.Report === "All" ? "  " : " "} p-6 rounded-2xl shadow-lg ${shimmerCardBg} border ${border}`}>
      <div className={`h-6 w-1/3 rounded ${shimmerBg} mb-4`}></div>
      <div className={`h-40 w-full rounded-xl ${preBg}`}></div>
    </div>
  );
};

const SkeletonAuditDropdown = ({ darkMode }) => {
  const shimmerCardBg = darkMode 
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900" 
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";

  const { data } = useData();
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const border = darkMode ? "border-gray-700" : "border-gray-200";

  return (
    <div className={`w-full ${data?.Report === "All" ? "  " : " "} p-5 rounded-lg shadow-xl ${shimmerCardBg} border ${border}`}>
      <div className={`h-6 w-1/3 rounded ${shimmerBg}`}></div>
    </div>
  );
};


function LinksDisplay({ linksData }) {
  const safeArray = (val) => {
    if (Array.isArray(val)) return val;
    if (val && typeof val === "object") return Object.values(val);
    return [];
  };

  const internal = safeArray(linksData.Internal_Links);
  const external = safeArray(linksData.External_Links);

  const [showInternalAll, setShowInternalAll] = useState(false);
  const [showExternalAll, setShowExternalAll] = useState(false);

  const INTERNAL_LIMIT = 2;
  const EXTERNAL_LIMIT = 2;

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
        <StatCard title="Total Links" value={linksData.Total} />
        <StatCard title="Internal Links" value={internal.length} />
        <StatCard title="External Links" value={external.length} />
        <StatCard title="Unique Links" value={linksData.Total_Unique} />
      </div>

      <div className="p-4 bg-white rounded-xl shadow">
        <h2 className="font-bold text-xl mb-4">Internal Links ({internal.length})</h2>
        {(showInternalAll ? internal : internal.slice(0, INTERNAL_LIMIT))
          .map((link, index) => (
            <LinkCard key={index} link={link} />
        ))}
        {internal.length > INTERNAL_LIMIT && (
          <button
            onClick={() => setShowInternalAll(!showInternalAll)}
            className="mt-3 text-blue-600 font-semibold hover:underline"
          >
            {showInternalAll ? "Show Less" : `Show More (${internal.length - INTERNAL_LIMIT} more)`}
          </button>
        )}
      </div>

      <div className="p-4 bg-white rounded-xl shadow">
        <h2 className="font-bold text-xl mb-4">External Links ({external.length})</h2>
        {(showExternalAll ? external : external.slice(0, EXTERNAL_LIMIT))
          .map((link, index) => (
            <LinkCard key={index} link={link} />
        ))}
        {external.length > EXTERNAL_LIMIT && (
          <button
            onClick={() => setShowExternalAll(!showExternalAll)}
            className="mt-3 text-blue-600 font-semibold hover:underline"
          >
            {showExternalAll ? "Show Less" : `Show More (${external.length - EXTERNAL_LIMIT} more)`}
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------
// ✅ IMAGE STATS & DETAILS COMPONENTS
// ---------------------------------------------------------

// 1. Overview Stats (Counts)
function ImageStatsDisplay({ imageData }) {
  return (
    <div className="mt-4 mb-6">
        <h4 className="font-bold text-gray-800 dark:text-gray-200 mb-4 px-1">Image Analysis Overview</h4>
        <div className="grid grid-cols-2 gap-4">
            <StatCard title="Total Images" value={imageData.Total_Image || 0} />
            <StatCard title="Missing Alt" value={imageData.Without_Alt_Image || 0} />
            <StatCard title="Missing Title" value={imageData.Without_Title_Image || 0} />
            <StatCard 
              title="Compression" 
              value={imageData.Image_Compression_Exist ? "Active" : "Inactive"} 
            />
        </div>
    </div>
  );
}

// 2. Detailed List Logic (Incomplete vs Complete)
function DetailedImageAnalysis({ imgData }) {
  const safeArray = (val) => (Array.isArray(val) ? val : []);
  
  // Mapping API specific keys
  const incomplete = safeArray(imgData.Without_Title_Incomplete_Status
);
  const complete = safeArray(imgData.Complete_Status);

  const [showAllIncomplete, setShowAllIncomplete] = useState(false);
  const [showAllComplete, setShowAllComplete] = useState(false);
  const LIMIT = 3;

  return (
    <div className="mt-4 space-y-6">
      
      {/* 🔴 Incomplete Status (Missing Alt or Title) */}
      {incomplete.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <h4 className="font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
            ⚠️ Issues Found ({incomplete.length})
          </h4>
          <div className="space-y-3">
            {(showAllIncomplete ? incomplete : incomplete.slice(0, LIMIT)).map((img, i) => {
               // ✅ LOGIC FIX: Explicitly check for empty strings
               const isMissingAlt = !img.alt || img.alt === "";
               const isMissingTitle = !img.title || img.title === "";

               return (
                <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm text-sm break-all">
                  {/* Image Details */}
                  <div className="grid grid-cols-1 gap-1">
                    <div className="text-gray-500 dark:text-gray-400 text-xs truncate">
                      <span className="font-bold">Src: </span>{img.src || "Unknown Source"}
                    </div>
                    
                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {isMissingAlt && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded font-bold border border-red-200">
                            Missing Alt
                          </span>
                      )}
                      {isMissingTitle && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded font-bold border border-orange-200">
                            Missing Title
                          </span>
                      )}
                    </div>

                    {/* Show what IS present just for context */}
                    {!isMissingAlt && (
                       <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <span className="font-semibold">Alt:</span> "{img.alt}"
                       </div>
                    )}
                  </div>
                </div>
               );
            })}
          </div>
          {incomplete.length > LIMIT && (
            <button
              onClick={() => setShowAllIncomplete(!showAllIncomplete)}
              className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              {showAllIncomplete ? "Show Less" : `Show ${incomplete.length - LIMIT} More`}
            </button>
          )}
        </div>
      )}

      {/* 🟢 Complete Status (Optimized Images) */}
      {complete.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <h4 className="font-bold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
            ✅ Optimized Images ({complete.length})
          </h4>
          <div className="space-y-3">
            {(showAllComplete ? complete : complete.slice(0, LIMIT)).map((img, i) => (
              <div key={i} className="p-3 bg-white dark:bg-gray-800 rounded shadow-sm text-sm break-all">
                <div className="mb-1">
                   <span className="font-semibold text-gray-700 dark:text-gray-300">Alt:</span> 
                   <span className="text-gray-900 dark:text-gray-100 font-medium ml-2">"{img.alt || "N/A"}"</span>
                </div>
                {img.title && (
                    <div className="mb-1">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">Title:</span> 
                        <span className="text-gray-900 dark:text-gray-100 font-medium ml-2">"{img.title}"</span>
                    </div>
                )}
                <div className="text-xs text-gray-400 mt-1 truncate">
                    {img.src || "Unknown Source"}
                </div>
              </div>
            ))}
          </div>
          {complete.length > LIMIT && (
            <button
              onClick={() => setShowAllComplete(!showAllComplete)}
              className="mt-3 text-sm font-semibold text-green-600 dark:text-green-400 hover:underline"
            >
              {showAllComplete ? "Show Less" : `Show ${complete.length - LIMIT} More`}
            </button>
          )}
        </div>
      )}

      {incomplete.length === 0 && complete.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No image data available to display details.</p>
      )}
    </div>
  );
}


// ---------------------------------------------------------
// ✅ Helper Components (Continued)
// ---------------------------------------------------------

function AltImagesDisplay({ imgData }) {
  const safeArray = (val) => (Array.isArray(val) ? val : []);
  
  const withAlt = safeArray(imgData.With_Alt || imgData.Images_With_Alt);
  const withoutAlt = safeArray(imgData.Without_Alt || imgData.Images_Without_Alt || imgData.Missing_Alt);

  const [showAllWith, setShowAllWith] = useState(false);
  const [showAllWithout, setShowAllWithout] = useState(false);
  const LIMIT = 3;

  return (
    <div className="mt-4 space-y-6">
      
      {/* 🔴 Images Without Alt */}
      {withoutAlt.length > 0 && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
          <h4 className="font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
            ⚠️ Images Without Alt Text ({withoutAlt.length})
          </h4>
          <div className="space-y-3">
            {(showAllWithout ? withoutAlt : withoutAlt.slice(0, LIMIT)).map((img, i) => (
              <div key={i} className="p-2 bg-white dark:bg-gray-800 rounded shadow-sm text-sm break-all">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Src:</span> 
                <span className="text-gray-500 dark:text-gray-400 ml-2">{img.src || img}</span>
              </div>
            ))}
          </div>
          {withoutAlt.length > LIMIT && (
            <button
              onClick={() => setShowAllWithout(!showAllWithout)}
              className="mt-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:underline"
            >
              {showAllWithout ? "Show Less" : `Show ${withoutAlt.length - LIMIT} More`}
            </button>
          )}
        </div>
      )}

      {/* 🟢 Images With Alt */}
      {withAlt.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
          <h4 className="font-bold text-green-600 dark:text-green-400 mb-3 flex items-center gap-2">
            ✅ Images With Alt Text ({withAlt.length})
          </h4>
          <div className="space-y-3">
            {(showAllWith ? withAlt : withAlt.slice(0, LIMIT)).map((img, i) => (
              <div key={i} className="p-2 bg-white dark:bg-gray-800 rounded shadow-sm text-sm break-all">
                <div className="mb-1">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Alt:</span> 
                  <span className="text-gray-900 dark:text-gray-100 font-medium ml-2">"{img.alt || "No description"}"</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-500 dark:text-gray-400 text-xs">Src:</span> 
                  <span className="text-gray-400 dark:text-gray-500 text-xs ml-2">{img.src || "Unknown"}</span>
                </div>
              </div>
            ))}
          </div>
          {withAlt.length > LIMIT && (
            <button
              onClick={() => setShowAllWith(!showAllWith)}
              className="mt-3 text-sm font-semibold text-green-600 dark:text-green-400 hover:underline"
            >
              {showAllWith ? "Show Less" : `Show ${withAlt.length - LIMIT} More`}
            </button>
          )}
        </div>
      )}

      {withAlt.length === 0 && withoutAlt.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No image data available to display details.</p>
      )}
    </div>
  );
}


function StatCard({ title, value }) {
  return (
    <div className="p-4 bg-white shadow rounded-xl text-center">
      <p className="text-sm text-gray-500">{title}</p>
      <h3 className="text-2xl font-semibold">{value}</h3>
    </div>
  );
}

function LinkCard({ link }) {
  const url = link.href || link.url || link.link || "";
  const anchor = link.anchor || link.text || link.label || "/";

  return (
    <div className="py-2 border-b">
      <p className="text-gray-900 font-medium break-all">{url}</p>
      <p className="text-gray-600 text-sm">
        <span className="font-semibold">Anchor:</span> {anchor}
      </p>
    </div>
  );
}

function OnPageSeoShimmer({ darkMode }) {
  const { data } = useData();
  const mainBg = darkMode 
    ? "bg-gray-900" 
    : "bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50";

  return (
    <div className={`relative flex w-full h-full min-h-screen ${mainBg} animate-pulse`}>
      {data?.Report === "All" && <SkeletonSidebar darkMode={darkMode} />}
      <main className={`flex-1 ${data?.Report === "All" ? "lg:ml-64" : ""} flex flex-col items-center pt-20 pb-12 px-4 space-y-8`}>
        <SkeletonHeaderCard darkMode={darkMode} />
        <SkeletonSectionCard metricCount={5} darkMode={darkMode} />
        <SkeletonSectionCard metricCount={2} darkMode={darkMode} />
        <SkeletonSectionCard metricCount={3} darkMode={darkMode} />
        <SkeletonSectionCard metricCount={5} darkMode={darkMode} />
        <SkeletonSchemaCard darkMode={darkMode} />
        <SkeletonAuditDropdown darkMode={darkMode} />
        <SkeletonAuditDropdown darkMode={darkMode} />
      </main>
    </div>
  );
}


// ------------------------------------------------------
// ✅ MetricCard Component (UPDATED with imageData & detailed lists)
// ------------------------------------------------------
const MetricCard = ({ title, description, score, value, unit, darkMode, icon, Title, metaDiscription, heading, links, canonical, altData, imageData }) => {
  const [showDescription, setShowDescription] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const isPassed = Boolean(score);

  const titleColor = darkMode ? "text-white" : "text-gray-900";
  const descriptionColor = darkMode ? "text-gray-300" : "text-gray-600";
  const valueColor = isPassed
    ? "text-green-500 dark:text-green-400"
    : "text-red-500 dark:text-red-400";
  const cardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-gray-50 to-white";

  const statusText = isPassed ? "Good" : "Needs Work";
  const statusColor = isPassed
    ? "bg-gradient-to-r from-green-400 to-emerald-500 text-white"
    : "bg-gradient-to-r from-red-500 to-rose-600 text-white";

  return (
    <div
      className={`group relative p-6 rounded-xl shadow-lg ${cardBg} 
        border ${darkMode ? "border-gray-700" : "border-gray-200"}
        transition-all duration-300  
       `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`absolute inset-0 rounded-xl opacity-0   
        ${
          isPassed
            ? "bg-gradient-to-br from-green-500/10 to-emerald-500/10"
            : "bg-gradient-to-br from-red-500/10 to-rose-500/10"
        }`}
      ></div>

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            {icon && <span className="text-2xl">{icon}</span>}
            <h3 className={`text-lg font-bold ${titleColor} leading-tight`}>
              {title}
            </h3>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${statusColor}`}
          >
            {statusText}
          </span>
        </div>

        {/* Value */}
        <div
          className={`text-3xl font-extrabold mb-4 ${valueColor} transition-all duration-300`}
        >
          {value !== null && value !== undefined ? `${value}${unit || ""}` : "--"}
        </div>

        {/* Toggle Details */}
        <button
          onClick={() => setShowDescription(!showDescription)}
          className={`w-full mt-2 px-4 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300
            ${
              darkMode
                ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white"
                : "bg-gradient-to-r from-blue-50 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white"
            }`}
        >
          {showDescription ? "Hide Details" : "Show Details"}
        </button>

        <div
          className={`overflow-hidden transition-all duration-300 ${
            showDescription ? "max-h-auto mt-4" : "max-h-0"
          }`}
        >
          <p
            className={`text-sm ${descriptionColor} border-t ${
              darkMode ? "border-gray-700" : "border-gray-200"
            } pt-4`}
          >
            {description}
          </p>
          
          {links && links.Internal_Links && links.Internal_Links.length > 0 && (
            <div className="mt-4">
              <LinksDisplay linksData={links} />
            </div>
          )}
          
          {Title && (
            <div className={`my-2 ${Title.Score ? "text-green-700" : "text-red-500"}`}>
              Title — {Title.Title}
            </div>
          )}
              
          {canonical && (
            <div className={`my-2 ${canonical?"text-green-700":"text-red-500"}`}>
              Self Referential-{canonical}
            </div>
          )}         
          
          {metaDiscription && (
            <div className={`my-2 ${metaDiscription.Score ? "text-green-700" : "text-red-500"}`}>
              Meta Description — {metaDiscription.MetaDescription}
            </div>
          )}

          {heading && <div className="mt-4"><HeadingHierarchyCard data={heading} /></div>}

          {/* Render Alt Images Display (Legacy - used by Alt Relevance Card) */}
          {altData && <div className="mt-4"><AltImagesDisplay imgData={altData} /></div>}

          {/* ✅ Renders Image Stats AND Detailed Lists (Complete/Incomplete) */}
          {imageData && (
            <>
                <ImageStatsDisplay imageData={imageData} />
                <DetailedImageAnalysis imgData={imageData} />
                <DetailedImageAnalysis imgData={imageData} />
            </>
          )}

        </div>
      </div>
    </div>
  );
};

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
  const linksData = {
    Total: seo.Links.Total,
    Total_Internal: seo.Links.Total_Internal,
    Total_External: seo.Links.Total_External,
    Total_Unique: seo.Links.Total_Unique,
    Internal_Links:seo.Links.Internal_Links ,
    External_Links: seo.Links.External_Links
  };

  const textColor = darkMode ? "text-white" : "text-gray-900";
  const mainCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";

 const desc = {
  title: `The page title is the main headline that appears as the blue clickable link in Google search results.`,
  meta: `This is the small paragraph of text under the blue link in Google search results.`,
  url: `This is the address of your webpage (like yoursite.com/about-us).`,
  canonical: `Canonical tags prevent duplicate URLs from confusing Google by marking the original page.`,
  h1: `The H1 is the main headline or title *on the page itself* (different from the search result title).`,
  image: `Images make your page engaging, but they can also slow it down if they are too large.`,
  video: `Videos are fantastic for keeping users on your page longer, which Google loves.`,
  heading: `Headings (like H1, H2, H3) create the structure of your page.`,
  alt: `"Alt text" (or alternative text) is a short, written description of an image on your page.`,
  semantic: `Semantic HTML tags are special code tags that describe the *meaning* of the content inside them.`,
  structured: `Structured data (or "Schema") is a special code vocabulary we add to your site to "spoon-feed" information to Google.`,
  https: `HTTPS is the secure version of HTTP. It's what gives your site the "padlock" icon.`,
  pagination: `If you have a blog, a category, or a product list that spans multiple pages, this is called "pagination."`,
  links: `Links connect pages and help Google understand your site.`,
  duplicate: `Duplicate content is when a large block of text on your site is identical to content on another page.`,
  slug: `The "slug" is the very last part of your URL that identifies the specific page.`
};
const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;

  return (
    <div className="relative flex w-full h-full min-h-screen">
      {data?.Report === "All" && (
      <div className={`${sidebarClass} lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}>
          <Sidebar darkMode={darkMode} />
        </div>
      )}

      <main
        className={`flex-1 ${
            data?.Report === "All" ? "lg:ml-64" : ""
          } flex flex-col items-center pt-20 pb-12 px-4 space-y-8 ${
          darkMode ? "bg-gray-900" : "bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50"
        }`}
      >
        {/* Header */}
        <div
          className={`w-full ${data.Report=="All" ? "  " : " "} p-8 rounded-2xl shadow-2xl border-l-8 border-indigo-500 ${mainCardBg}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                className={`text-5xl font-black ${textColor} mb-2 bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent`}
              >
                On-Page SEO
              </h2>
              <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Detailed analysis of your website’s on-page optimization factors
              </p>
            </div>
            <CircularProgress value={seo?.Percentage || 0} size={80} stroke={6} />
          </div>
          <div
            className={`inline-flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-full shadow-md
              ${darkMode
                ? "bg-gradient-to-r from-gray-700 to-gray-800 text-blue-400 border border-blue-700/40"
                : "bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200"
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Time Taken — {data.Time_Taken}
          </div>
        </div>

        {/* 🧠 Section 1: Content Essentials */}
        <Section title="Content Essentials" icon="🧠" color="indigo" textColor={textColor}>
          <MetricCard title="Title Tag" description={desc.title} score={seo.Title?.Score} Title={seo?.Title} value={seo.Title?.Title_Length + " chars"} darkMode={darkMode} icon="🏷️" />
          <MetricCard title="Meta Description" description={desc.meta} score={seo.Meta_Description?.Score} metaDiscription={seo.Meta_Description} value={seo.Meta_Description?.MetaDescription_Length + " chars"} darkMode={darkMode} icon="📝" />
          <MetricCard title="URL Structure" description={desc.url} score={seo.URL_Structure?.Score} value={seo.URL_Structure?.Score ? "Clean" : "Poor"} darkMode={darkMode} icon="🔗" />
          <MetricCard title="Canonical Tag" description={desc.canonical} canonical={seo.Canonical?.Canonical} score={seo.Canonical?.Score} value={seo.Canonical?.Score ? "Self Referential" : "Not Self Referential"} darkMode={darkMode} icon="📜" />
          <MetricCard title="H1 Tag" description={desc.h1} score={seo.H1?.Score} value={"H1 Count-"+(seo.H1?.H1_Count || 0)} darkMode={darkMode} icon="🔠" />
        </Section>

        {/* 🖼️ Section 2: Media & Accessibility */}
        <Section title="Media & Accessibility" icon="🖼️" color="purple" textColor={textColor}>
          {seo.Image?.Image_Exist!=0 && (
             // ✅ UPDATED: Passing imageData to Image Optimization card
             <MetricCard 
                title="Image Optimization" 
                description={desc.image} 
                score={seo.Image?.Image_Alt_Meaningfull_Exist} 
                value={seo.Image?.Image_Alt_Meaningfull_Exist ? "Optimized" : "Needs Work"} 
                darkMode={darkMode} 
                icon="🖼️" 
                imageData={seo.Image} 
             />
          )}    
          {seo.Video?.Video_Exist!=0 && <MetricCard title="Video Implementation" description={desc.video} score={seo.Video?.Video_Exist} value={seo.Video?.Video_Exist ? "Present" : "Missing"} darkMode={darkMode} icon="🎥" />} 
          
          <MetricCard 
            title="ALT Text Relevance" 
            description={desc.alt} 
            score={seo.ALT_Text_Relevance?.Score} 
            value={seo.ALT_Text_Relevance?.Score ? "Relevant" : "Irrelevant"} 
            darkMode={darkMode} 
            icon="🪶" 
            altData={seo.Image} 
          />
        </Section>

        {/* 🏗️ Section 3: Structure & Semantics */}
        <Section title="Structure & Semantics" icon="🏗️" color="green" textColor={textColor}>
       { (seo.Heading_Hierarchy.H1_Count!=0&&seo.Heading_Hierarchy.H2_Count!=0&&seo.Heading_Hierarchy.H3_Count!=0&&seo.Heading_Hierarchy.H4_Count!=0&&seo.Heading_Hierarchy.H5_Count!=0  &&seo.Heading_Hierarchy.H6_Count!=0)&&<MetricCard
  title="Heading Hierarchy"
  description={desc.heading}
  heading={seo.Heading_Hierarchy?.Heading}
  score={seo.Heading_Hierarchy?.Score}
  value={seo.Heading_Hierarchy?.Score ? "Proper" : "Needs Fix"}
  darkMode={darkMode}
  icon="📚"
/>}

          <MetricCard title="Semantic HTML Tags" description={desc.semantic} score={seo.Semantic_Tags?.Article_Score} value={seo.Semantic_Tags?.Article_Score ? "Present" : "Missing"} darkMode={darkMode} icon="📄" />
          <MetricCard title="Structured Data" description={desc.structured} score={seo.Structured_Data?.Score} value={seo.Structured_Data?.Score ? "Added" : "Missing"} darkMode={darkMode} icon="🧩" />
        </Section>

        {/* ⚙️ Section 4: Technical SEO */}
        <Section title="Technical SEO" icon="⚙️" color="blue" textColor={textColor}>
          <MetricCard title="HTTPS" description={desc.https} score={seo.HTTPS?.Score} value={seo.HTTPS?.Score ? "Secure" : "Insecure"} darkMode={darkMode} icon="🔒" />
          <MetricCard title="Pagination Tags" description={desc.pagination} score={seo.Pagination_Tags?.Score} value={seo.Pagination_Tags?.Score ? "Present" : "Missing"} darkMode={darkMode} icon="📑" />
          <MetricCard title="Links" description={desc.links} links={linksData} score={seo.Links.Score} value={seo.Links.Score || 0} darkMode={darkMode} icon="🧭" />
          <MetricCard title="Duplicate Content" description={desc.duplicate} score={seo.Duplicate_Content?.Score} value={seo.Duplicate_Content?.Score ? "Unique" : "Duplicate"} darkMode={darkMode} icon="🧬" />
       {seo.URL_Slugs?.Slug_Check_Score==1&&<MetricCard title="URL Slugs" description={desc.slug} score={seo.URL_Slugs?.Slug_Check_Score} value={seo.URL_Slugs?.Slug_Check_Score ? "Valid" : "Invalid"} darkMode={darkMode} icon="🧾" />}
        </Section>
        
        <div className={`w-full ${data.Report=="All" ? "  " : " "} p-6 rounded-2xl shadow-lg ${mainCardBg} border ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
            {data.Schema.length>0?<SchemaCard schema={data.Schema} />:<p>Schema Unavalible</p>} 
        </div>
        
        {/* Dropdowns */}
        <AuditDropdown items={seo?.Passed} title="✅ Passed Audits" darkMode={darkMode} />
        <AuditDropdown items={seo?.Improvements} title="⚠️ Improvements Needed" darkMode={darkMode} />
      </main>
    </div>
  );
}

// ------------------------------------------------------
// ✅ Helper Component for SchemaCard
// ------------------------------------------------------
function SchemaCard({ schema }) {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  return (
    <>
      <h2 className={`text-xl font-semibold mb-4 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>
        Schema Data
      </h2>

      <pre className={`p-4 rounded-xl text-sm overflow-x-auto whitespace-pre-wrap ${darkMode ? "bg-gray-800 text-gray-200" : "bg-gray-100 text-gray-700"}`}>
        {JSON.stringify(schema, null, 2)}
      </pre>
    </>
  );
}

// ------------------------------------------------------
// ✅ Helper Component for Section Layouts
// ------------------------------------------------------
function Section({ title, icon, color, children, textColor }) {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const { data } = useData();
  
  const mainCardBg = darkMode
    ? "bg-gradient-to-br from-gray-800 via-gray-850 to-gray-900"
    : "bg-gradient-to-br from-white via-blue-50/30 to-white";
  
  const borderColorMap = {
    indigo: "border-indigo-500",
    purple: "border-purple-500",
    green: "border-green-500",
    blue: "border-blue-500",
  };

  return (
    <div
      className={`w-full p-8 rounded-2xl shadow-2xl border-l-8 ${mainCardBg}
        ${data?.Report === "All" ? "  " : " "}
        ${borderColorMap[color] || "border-gray-500"}
      `}
    >
      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{icon}</span>
        <h2 className={`text-2xl font-bold ${textColor}`}>{title}</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">{children}</div>
    </div>
  );
}

function HeadingHierarchyCard({ data }) {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const getIndent = (tag) => {
    switch (tag) {
      case "h1": return "ml-0";
      case "h2": return "ml-4";
      case "h3": return "ml-8";
      case "h4": return "ml-12";
      default: return "ml-0";
    }
  };

  const getFont = (tag) => {
    switch (tag) {
      case "h1": return "text-xl font-bold";
      case "h2": return "text-lg font-semibold";
      case "h3": return "text-base font-medium";
      case "h4": return "text-sm";
      default: return "text-sm";
    }
  };

  return (
    <div
      className={`w-full   shadow-lg rounded-2xl p-4 space-y-4 
      ${darkMode ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}
    >
      <h2 className="text-lg font-bold mb-4 text-blue-600 dark:text-blue-400">Headings Structure</h2>
      <div
        className={`space-y-3 max-h-60 overflow-y-auto pr-2 scrollbar-thin 
        ${darkMode ? "scrollbar-thumb-gray-600" : "scrollbar-thumb-gray-400"}`}
      >
        {data?.map((item, index) => {
          if (!item || !item.tag) return null;
          
          const Tag = item.tag;
          return (
            <div
              key={index}
              className={`${getIndent(item.tag)} border-l-2 pl-3 
              ${darkMode ? "border-gray-700" : "border-gray-300"}`}
            >
              <div className="flex items-center space-x-2">
                <span className={`font-mono text-sm ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                  &lt;{item.tag}&gt;
                </span>
                {React.createElement(
                  Tag,
                  { className: `${getFont(item.tag)} leading-tight inline-block ${darkMode ? "text-gray-200" : "text-gray-800"}` },
                  item.text
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}