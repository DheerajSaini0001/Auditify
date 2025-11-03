import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { Check, X } from "lucide-react"; // ✅ Loader2 yahan se hata diya
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import Sidebar from "../Component/Sidebar";

// ✅ Score Badge (Aapka original code)
const ScoreBadge = ({ score, out, des }) => {
  const cssscore = score ? "bg-green-300" : "bg-red-300";
  const hasValue = score ? <Check size={18} /> : <X size={18} />;

  return (
    <span
      className={`px-2.5 flex py-1 mobilebutton rounded-full text-black font-semibold text-sm shadow-md transform transition-transform ${cssscore}`}
    >
      {hasValue} {out} {des}
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

// Main Skeleton Component for On-Page SEO
function OnPageSeoSkeleton({ darkMode, reportType }) {
  const shimmerBg = darkMode ? "bg-gray-700" : "bg-gray-300";
  const shimmerCardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";
  
  // Essentials card ke items ke liye placeholder
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
        darkMode ? "bg-gray-800" : "bg-gray-100" // Alag background
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

      {/* Essentials Card Skeleton */}
      <div
        className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${shimmerCardBg}`}
      >
        <div className={`h-6 w-1/4 mb-4 rounded ${shimmerBg}`}></div> {/* "Essentials" Title */}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {/* ✅ Aapke essentials card mein 9 items hain, toh 9 placeholders */}
          {[...Array(9)].map((_, i) => (
            <SkeletonBadgeItem key={i} />
          ))}
        </div>
      </div>

      {/* Audit Dropdowns Skeleton (x3) */}
      <SkeletonDropdown />
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
// ✅ AAPKA MAIN COMPONENT (On_Page_SEO)
// -----------------------------------------------------------------

export default function On_Page_SEO() {
  const { data, loading } = useData(); // loading variable ab use ho sakta hai
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  // ✅ data ko safely access karne ke liye optional chaining
  const seo = data?.On_Page_SEO;
  const reportType = data?.Report;

  // ✅ Theme-based background/text colors
  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  const textColor = darkMode ? "text-white" : "text-black";

  // ✅ sidebarClass constant
  const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;

  // ✅ Best practice: loading state ko alag se handle karein
  if (loading) {
    return <OnPageSeoSkeleton darkMode={darkMode} reportType={reportType} />
  }

  return (
    <>
      {/* ✅ Ab 'seo' ko check karna kaafi hai */}
      {seo ? (
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
              {/* --- Header --- */}
              <h1
                className={`responsive flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6 ${textColor}`}
              >
                On-Page SEO
                <CircularProgress value={seo.Percentage} size={70} stroke={5} />
              </h1>

              {/* --- Essentials Section --- */}
              <div
                className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
              >
                <h2 className="text-xl font-bold mb-4">Essentials</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {/* ... (Aapka saara 9 items ka grid content) ... */}
                  <div className="flex justify-between items-center">
                    <span>Title</span>
                    {seo.Title.Title_Exist ? (
                      <ScoreBadge
                        score={seo.Title.Score}
                        out={seo.Title.Title_Length}
                        des={"characters"}
                      />
                    ) : (
                      "No Title Found"
                    )}
                  </div>
                  {/* ... (baaki ke items) ... */}
                  <div className="flex justify-between items-center">
                    <span>HTTPS</span>
                    <ScoreBadge
                      score={seo.HTTPS.Score}
                      des={
                        seo.HTTPS.Score
                          ? "Found https"
                          : "No https"
                      }
                    />
                  </div>

                </div>
              </div>

              {/* --- Audit Results --- */}
              <AuditDropdown
                items={seo.Passed}
                title="Passed Audits"
                darkMode={darkMode}
              />
              <AuditDropdown
                items={seo.Warning}
                title="Warnings"
                darkMode={darkMode}
              />
              <AuditDropdown
                items={seo.Improvements}
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
            {/* --- Header --- */}
            <h1
              className={`responsive flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6 ${textColor}`}
            >
              On-Page SEO
              <CircularProgress value={seo.Percentage} size={70} stroke={5} />
            </h1>

            {/* --- Essentials Section --- */}
            <div
              className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 mb-5 border-indigo-500 ${cardBg}`}
            >
              <h2 className="text-xl font-bold mb-4">Essentials</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {/* ... (Aapka saara 9 items ka grid content) ... */}
                <div className="flex justify-between items-center">
                  <span>Title</span>
                  {seo.Title.Title_Exist ? (
                    <ScoreBadge
                      score={seo.Title.Score}
                      out={seo.Title.Title_Length}
                      des={"characters"}
                    />
                  ) : (
                    "No Title Found"
                  )}
                </div>
                {/* ... (baaki ke items) ... */}
                <div className="flex justify-between items-center">
                  <span>HTTPS</span>
                  <ScoreBadge
                    score={seo.HTTPS.Score}
                    des={
                      seo.HTTPS.Score
                        ? "Found https"
                        : "No https"
                    }
                  MAIN
                  />
                </div>
              </div>
            </div>

            {/* --- Audit Results --- */}
            <AuditDropdown
              items={seo.Passed}
              title="Passed Audits"
              darkMode={darkMode}
            />
            <AuditDropdown
              items={seo.Warning}
              title="Warnings"
              darkMode={darkMode}
            />
            <AuditDropdown
              items={seo.Improvements}
              title="Failed Audits"
              darkMode={darkMode}
            />
          </main>
        )
      ) : (
        // ✅ LOADER2 KO SKELETON SE REPLACE KAR DIYA GAYA
        <OnPageSeoSkeleton darkMode={darkMode} reportType={reportType} />
      )}
    </>
  );
}