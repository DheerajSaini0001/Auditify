import React, { useContext } from "react";
import { Check, X, Home, BarChart2, Settings, Moon, Sun } from "lucide-react"; // Loader2 hata diya
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import Sidebar from "../Component/Sidebar";

// -----------------------------------------------------------------
// ✅ UPDATED SKELETON COMPONENT AB ISI FILE MEIN HAI
// -----------------------------------------------------------------

// Skeleton component (Sidebar ke liye - agar 'All' report type hai)
const SkeletonSidebar = ({ darkMode }) => (
  <div
    className={`fixed top-0 mt-16 left-0 h-full w-64 ${
      darkMode ? "bg-gray-900" : "bg-white"
    } shadow-lg p-6`}
  >
    <div className={`h-7 rounded mb-5 ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
    <div className={`h-7 rounded mb-5 ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
    <div className={`h-7 rounded mb-5 ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
    <div className={`h-7 rounded ${darkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
  </div>
);


// ✅ Main Shimmer/Skeleton Component for Technical Performance
function TechnicalPerformanceShimmer({ darkMode, reportType }) { // reportType bhi pass kiya taaki sidebar ka logic handle ho sake
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const shimmerCardBg = darkMode ? "bg-gray-800" : "bg-gray-200";

  // ✅ NEW: Individual Badge-like skeleton for Core Web Vitals items
  const SkeletonScoreBadge = () => (
    <div className="flex justify-between items-center">
      <div className={`h-4 w-2/5 rounded ${shimmerBg}`}></div>
      <div className={`h-6 w-1/4 rounded-full ${shimmerBg}`}></div>
    </div>
  );

  // ✅ NEW: Skeleton for a dropdown component
  const SkeletonAuditDropdown = () => (
    <div className={`w-full max-w-4xl h-14 rounded-lg shadow-md ${shimmerCardBg}`}></div>
  );

  const shimmerContent = (
    <>
      {/* H1 + Circular Progress Skeleton */}
      <div className="responsive flex items-center justify-center sm:gap-10 mb-6 w-full max-w-4xl">
        <div className={`h-10 w-3/5 rounded ${shimmerBg}`}></div>
        <div className={`h-[70px] w-[70px] rounded-full ${shimmerBg}`}></div>
      </div>

      {/* Core Web Vitals Box Skeleton */}
      <div
        className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-transparent ${shimmerCardBg}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ✅ CHANGE: 4 Core Web Vitals items ke liye badges ka skeleton */}
          <SkeletonScoreBadge />
          <SkeletonScoreBadge />
          <SkeletonScoreBadge />
          <SkeletonScoreBadge />
        </div>
      </div>

      {/* Audit Dropdowns (x3) Skeleton */}
      {/* ✅ CHANGE: AuditDropdowns ke liye dedicated skeleton */}
      <SkeletonAuditDropdown />
      <SkeletonAuditDropdown />
      <SkeletonAuditDropdown />
    </>
  );

  return (
    <div className="animate-pulse">
      {reportType === "All" ? (
        <div className="relative flex w-full h-full">
          {/* Sidebar */}
          <SkeletonSidebar darkMode={darkMode} /> {/* Sidebar skeleton dikhao */}
          {/* Main content area */}
          <main
            className={`flex-1 lg:ml-64 flex flex-col justify-center items-center pt-20 pb-0 pr-4 pl-4 lg:pl-0 space-y-8`}
          >
            {shimmerContent}
          </main>
        </div>
      ) : (
        <main
          className={`flex justify-center flex-col items-center min-h-auto pt-20 pb-0 pr-4 pl-4 lg:pl-0 space-y-8 ${
            darkMode ? " text-gray-100" : " text-gray-800"
          }`}
        >
          <div className="flex w-full flex-col items-center justify-center space-y-8">
            {shimmerContent}
          </div>
        </main>
      )}
    </div>
  );
}

// -----------------------------------------------------------------
// ✅ AAPKA MAIN COMPONENT YAHA SE SHURU HOTA HAI
// -----------------------------------------------------------------

export default function Technical_Performance() {
  const { data, loading } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const metric = data;
  const reportType = data?.Report;

  // ✅ Local component: ScoreBadge
  const ScoreBadge = ({ score, out, unit, des }) => {
    const cssscore = score ? "bg-green-300" : "bg-red-300";
    const hasValue = score ? <Check size={18} /> : <X size={18} />;
    return (
      <span
        className={`px-2.5 flex items-center gap-1.5 py-1 rounded-full text-black font-semibold text-sm shadow-md ${cssscore}`}
      >
        {hasValue} {out} {unit} {des}
      </span>
    );
  };

  // ✅ Theme styles
  const containerBg = darkMode
    ? "bg-zinc-900 border-gray-700 text-white"
    : "bg-gray-100 border-gray-300 text-black";

  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  const textColor = darkMode ? "text-white" : "text-black";
  const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;

  // ✅ Main Layout
  // Loading state ko handle karein:
  if (loading || !metric) { // metric bhi check karein, agar data abhi aaya nahi hai
    return <TechnicalPerformanceShimmer darkMode={darkMode} reportType={reportType} />;
  }


  return (
    <>
      {/* metric.Technical_Performance ko yahan optional chaining se access karna better hai */}
      {metric?.Technical_Performance ? (
        reportType === "All" ? (
          <div className="relative flex w-full h-full">
            {/* Sidebar */}
            <div
              className={`${sidebarClass} lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
            >
              <Sidebar darkMode={darkMode} />
            </div>
            {/* Main content */}
            <main
              className={`flex-1  lg:ml-64 flex flex-col justify-center items-center pt-20 pb-0 pr-4 pl-4 lg:pl-0 space-y-8 ${
                darkMode ? " text-gray-100" : " text-gray-800"
              }`}
            >
              <h1
                className={`responsive flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6 ${textColor}`}
              >
                Technical Performance
                <CircularProgress
                  value={metric.Technical_Performance.Percentage}
                  size={70}
                  stroke={5}
                />
              </h1>

              {/* Core Web Vitals */}
              <div
                className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {/* Filter out non-metric properties like 'Passed', 'Warning', 'Improvements', 'Percentage' */}
                  {Object.entries(metric.Technical_Performance)
                    .filter(([key]) => !["Passed", "Warning", "Improvements", "Percentage"].includes(key))
                    .map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className={textColor}>{key.replace(/_/g, " ")}</span>
                        <ScoreBadge
                          score={val.Score}
                          out={val.Value}
                          unit={key !== "CLS" ? "Sec" : ""} // CLS ka unit nahi hota
                          des={val.Score ? "Good" : "Poor"}
                        />
                      </div>
                    ))}
                </div>
              </div>

              {/* Audit Results */}
              <AuditDropdown
                title="Passed Audits"
                items={metric.Technical_Performance.Passed}
                darkMode={darkMode}
              />
              <AuditDropdown
                title="Warning"
                items={metric.Technical_Performance.Warning}
                darkMode={darkMode}
              />
              <AuditDropdown
                title="Failed Audits"
                items={metric.Technical_Performance.Improvements}
                darkMode={darkMode}
              />
            </main>
          </div>
        ) : (
          <main
            className={`flex justify-center flex-col items-center min-h-auto${
              darkMode ? " text-gray-100" : " text-gray-800"
            }`}
          >
            {/* This new div centers all the content below */}
            <div className="flex w-full flex-col items-center justify-center space-y-8">
              <h1
                className={`responsive flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6 ${textColor}`}
              >
                Technical Performance
                <CircularProgress
                  value={metric.Technical_Performance.Percentage}
                  size={70}
                  stroke={5}
                />
              </h1>

              {/* Core Web Vitals */}
              <div
                className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {/* Filter out non-metric properties */}
                  {Object.entries(metric.Technical_Performance)
                    .filter(([key]) => !["Passed", "Warning", "Improvements", "Percentage"].includes(key))
                    .map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center">
                        <span className={textColor}>{key.replace(/_/g, " ")}</span>
                        <ScoreBadge
                          score={val.Score}
                          out={val.Value}
                          unit={key !== "CLS" ? "Sec" : ""}
                          des={val.Score ? "Good" : "Poor"}
                        />
                      </div>
                    ))}
                </div>
              </div>
              {/* Audit Results */}
              <AuditDropdown
                title="Passed Audits"
                items={metric.Technical_Performance.Passed}
                darkMode={darkMode}
              />
              <AuditDropdown
                title="Warning"
                items={metric.Technical_Performance.Warning}
                darkMode={darkMode}
              />
              <AuditDropdown
                title="Failed Audits"
                items={metric.Technical_Performance.Improvements}
                darkMode={darkMode}
              />
            </div>
          </main>
        )
      ) : (
        // ✅ CHANGED: Replaced <Loader2 /> with the new Shimmer component
        <TechnicalPerformanceShimmer darkMode={darkMode} reportType={reportType} />
      )}
    </>
  );
}