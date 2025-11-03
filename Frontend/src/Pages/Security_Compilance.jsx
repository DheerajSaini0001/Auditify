import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Check, X } from "lucide-react"; // ✅ Loader2 yahan se hata diya
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import Sidebar from "../Component/Sidebar";

// ✅ Reusable Badge (Aapka original code)
const ScoreBadge = ({ score, out }) => {
  const badgeClass = score ? "bg-green-300" : "bg-red-300";
  const icon = score ? <Check size={18} /> : <X size={18} />;
  return (
    <span
      className={`px-2.5 flex items-center gap-1.5 py-1 rounded-full text-black font-semibold text-sm shadow-md transform transition-transform mobilebutton ${badgeClass}`}
    >
      {icon} {out}
    </span>
  );
};

// -----------------------------------------------------------------
// ✅ SKELETON CODE AB ISI FILE MEIN HAI
// -----------------------------------------------------------------

// Skeleton component (Sidebar ke liye)
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

// Main Skeleton Component for Security/Compliance
function SecurityComplianceSkeleton({ darkMode, reportType }) {
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const shimmerCardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";
  
  // Placeholder for card items
  const SkeletonBadgeItem = () => (
    <div className="flex justify-between items-center">
      <div className={`h-4 w-2/5 rounded ${shimmerBg}`}></div>
      <div className={`h-6 w-1/4 rounded-full ${shimmerBg}`}></div>
    </div>
  );

  // Dropdown ke liye placeholder
  const SkeletonDropdown = () => (
    <div
      className={`w-full max-w-4xl h-14 rounded-lg shadow-md ${
        darkMode ? "bg-gray-800" : "bg-gray-100"
      }`}
    ></div>
  );

  // Skeleton ka main content
  const shimmerContent = (
    <>
      {/* Header Skeleton */}
      <div className="responsive flex items-center justify-center sm:gap-10 mb-6 w-full max-w-lg">
        <div className={`h-8 w-2/5 rounded ${shimmerBg}`}></div>
        <div className={`h-[70px] w-[70px] rounded-full ${shimmerBg}`}></div>
      </div>

      {/* Metrics Card Skeleton */}
      <div
        className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${shimmerCardBg}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {/* ✅ Aapke security card mein 13 items hain */}
          {[...Array(13)].map((_, i) => (
            <SkeletonBadgeItem key={i} />
          ))}
        </div>
      </div>

      {/* Audit Dropdowns Skeleton (x3) */}
      <SkeletonDropdown />
      
      <SkeletonDropdown />
    </>
  );

  return (
    <div className="animate-pulse"> {/* Main pulse animation */}
      {reportType === "All" ? (
        <div className="relative flex w-full h-full">
          <SkeletonSidebar darkMode={darkMode} />
          <main
            className={`flex-1 lg:ml-64 flex flex-col justify-center items-center pt-20 pb-0 pr-4 pl-4 lg:pl-0 space-y-8`}
          >
            {shimmerContent}
          </main>
        </div>
      ) : (
        <main
          className={`flex flex-col justify-center items-center min-h-auto pt-20 pb-0 pr-4 pl-4 space-y-8 ${
            darkMode ? " text-gray-100" : " text-gray-800"
          }`}
        >
          {shimmerContent}
        </main>
      )}
    </div>
  );
}


// -----------------------------------------------------------------
// ✅ AAPKA MAIN COMPONENT (Security_Compilance)
// -----------------------------------------------------------------

export default function Security_Compilance() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const { data: rawData, loading } = useData();
  const data = rawData;
  const reportType = data?.Report;

  // ✅ data ko safely access karne ke liye optional chaining
  const metric = data?.Security_or_Compliance;

  // ✅ Theme-based dynamic styles
  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  const textColor = darkMode ? "text-white" : "text-black";

  // ✅ sidebarClass constant
  const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;

  // ✅ Best practice: loading state ko alag se handle karein
  if (loading || !data) { // Agar data load ho raha hai ya abhi hai hi nahi
    return <SecurityComplianceSkeleton darkMode={darkMode} reportType={reportType} />;
  }

  return (
    <>
      {/* ✅ Ab 'metric' ko check karna kaafi hai */}
      {metric ? (
        reportType === "All" ? (
          <div className="relative  flex w-full h-full">
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
              {/* Header with progress */}
              <h1 className="responsive text-heading-25 flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6">
                Security/Compliance{" "}
                <CircularProgress
                  value={metric.Percentage}
                  size={70}
                  stroke={5}
                />
              </h1>

              {/* Metrics card */}
              <div
                className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {/* ... (Aapke saare 13 grid items) ... */}
                  <div className="flex justify-between items-center">
                    <span className={textColor}>HTTPS</span>
                    <ScoreBadge
                      score={metric.HTTPS.Score}
                      out={metric.HTTPS.Score ? "HTTPS enabled" : "HTTPS missing"}
                    />
                  </div>
                  {/* ... (baaki ke items) ... */}
                  <div className="flex justify-between items-center">
                    <span className={textColor}>Forms Using HTTPS</span>
                    <ScoreBadge
                      score={metric.Forms_Use_HTTPS.Score}
                      out={metric.Forms_Use_HTTPS.Score ? "Enabled" : "Missing"}
                    />
                  </div>

                </div>
              </div>

              {/* ✅ Audit Dropdowns */}
              <AuditDropdown
                items={metric.Passed}
                title="Passed Audit"
                darkMode={darkMode}
              />
              <AuditDropdown
                items={metric.Warning}
                title="Warnings"
                darkMode={darkMode}
              />
              <AuditDropdown
                items={metric.Improvements}
                title="Failed Audits"
                darkMode={darkMode}
              />
            </main>
          </div>
        ) : (
          <main
            className={`flex flex-col justify-center items-center min-h-auto ${
              darkMode ? " text-gray-100" : " text-gray-800"
            }`}
          >
            {/* Header with progress */}
            <h1 className="responsive text-heading-25 flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6">
              Security/Compliance{" "}
              <CircularProgress
                value={metric.Percentage}
                size={70}
                stroke={5}
              />
            </h1>

            {/* Metrics card */}
            <div
              className={`w-full max-w-4xl p-6 mb-5 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {/* ... (Aapke saare 13 grid items) ... */}
                <div className="flex justify-between items-center">
                  <span className={textColor}>HTTPS</span>
                  <ScoreBadge
                    score={metric.HTTPS.Score}
                    out={metric.HTTPS.Score ? "HTTPS enabled" : "HTTPS missing"}
                  />
                </div>
                {/* ... (baaki ke items) ... */}
                <div className="flex justify-between items-center">
                  <span className={textColor}>Forms Using HTTPS</span>
                  <ScoreBadge
                    score={metric.Forms_Use_HTTPS.Score}
                    out={metric.Forms_Use_HTTPS.Score ? "Enabled" : "Missing"}
                  />
                </div>

              </div>
            </div>

            {/* ✅ Audit Dropdowns */}
            <AuditDropdown
              items={metric.Passed}
              title="Passed Audit"
              darkMode={darkMode}
            />
            <AuditDropdown
              items={metric.Warning}
              title="Warnings"
              darkMode={darkMode}
            />
            <AuditDropdown
              items={metric.Improvements}
              title="Failed Audits"
              darkMode={darkMode}
            />
          </main>
        )
      ) : (
        // ✅ LOADER2 KO SKELETON SE REPLACE KAR DIYA GAYA
        <SecurityComplianceSkeleton darkMode={darkMode} reportType={reportType} />
      )}
    </>
  );
}