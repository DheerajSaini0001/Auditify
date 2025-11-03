import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Check, X } from "lucide-react"; // ✅ Loader2 yahan se hata diya
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import Sidebar from "../Component/Sidebar";

// ✅ Reusable ScoreBadge (Aapka original code)
const ScoreBadge = ({ score, textGood, textBad }) => {
  const badgeColor = score ? "bg-green-300" : "bg-red-300";
  const icon = score ? <Check size={18} /> : <X size={18} />;
  return (
    <span
      className={`px-2.5 flex items-center gap-1.5 py-1 rounded-full text-black font-semibold text-sm shadow-md transform transition-transform mobilebutton ${badgeColor}`}
    >
      {icon} {score ? textGood : textBad}
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

// Main Skeleton Component for Conversion/Lead Flow
function ConversionLeadFlowSkeleton({ darkMode, reportType }) {
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

  // Common header skeleton
  const skeletonHeader = (
    <div className="responsive flex items-center justify-center sm:gap-10 mb-6 w-full max-w-lg">
      <div className={`h-8 w-2/5 rounded ${shimmerBg}`}></div>
      <div className={`h-[70px] w-[70px] rounded-full ${shimmerBg}`}></div>
    </div>
  );

  // Common dropdowns skeleton
  const skeletonDropdowns = (
    <>
      <SkeletonDropdown />
      <SkeletonDropdown />
      <SkeletonDropdown />
    </>
  );

  // Card skeleton (content will be conditional)
  const SkeletonMetricsCard = ({ itemCount }) => (
    <div
      className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${shimmerCardBg} ${reportType !== 'All' ? 'mb-5' : ''}`}
    >
      <div className={`h-6 w-1/3 mb-4 rounded ${shimmerBg}`}></div> {/* "Conversion & UX Metrics" Title */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {[...Array(itemCount)].map((_, i) => (
          <SkeletonBadgeItem key={i} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="animate-pulse">
      {reportType === "All" ? (
        // Skeleton for 'All' view (with Sidebar)
        <div className="relative flex w-full h-full">
          <SkeletonSidebar darkMode={darkMode} />
          <main
            className={`flex-1 lg:ml-64 flex flex-col justify-center items-center pt-20 pb-0 pr-4 pl-4 lg:pl-0 space-y-8`}
          >
            {skeletonHeader}
            <SkeletonMetricsCard itemCount={5} /> {/* ✅ 5 items for 'All' view */}
            {skeletonDropdowns}
          </main>
        </div>
      ) : (
        // Skeleton for 'non-All' view (no Sidebar)
        <main
          className={`flex flex-col justify-center items-center min-h-auto pt-20 pb-0 pr-4 pl-4 space-y-8 ${
            darkMode ? " text-gray-100" : " text-gray-800"
          }`}
        >
          {skeletonHeader}
          <SkeletonMetricsCard itemCount={12} /> {/* ✅ 12 items for 'non-All' view */}
          {skeletonDropdowns}
        </main>
      )}
    </div>
  );
}


// -----------------------------------------------------------------
// ✅ AAPKA MAIN COMPONENT (Conversion_Lead_Flow)
// -----------------------------------------------------------------

export default function Conversion_Lead_Flow() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const { data: rawData, loading } = useData();
  const data = rawData;
  const reportType = data?.Report;

  // ✅ 3. Loading state ko skeleton se replace kar diya gaya
  if (loading) {
    return <ConversionLeadFlowSkeleton darkMode={darkMode} reportType={reportType} />;
  }

  // ✅ 3. Added specific data check (Aapka original code)
  if (!data || !data.Conversion_and_Lead_Flow) {
    return (
   <ConversionLeadFlowSkeleton darkMode={darkMode} reportType={reportType} />
    );
  }

  const metric = data.Conversion_and_Lead_Flow;

  // ✅ Theme-based styles
  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  const textColor = darkMode ? "text-white" : "text-black";

  // ✅ sidebarClass constant
  const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;

  return (
    <>
      {reportType === "All" ? (
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
            {/* Title with Circular Progress */}
            <h1 className="responsive text-heading-25 flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6">
              Conversion Lead Flow{" "}
              <CircularProgress value={metric.Percentage} size={70} stroke={5} />
            </h1>

            {/* Conversion & UX Metrics Card */}
            <div
              className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
            >
              <h2 className={`text-xl font-bold mb-4 ${textColor}`}>
                Conversion & UX Metrics
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                {/* ... (Aapke 5 items yahan) ... */}
                <div className="flex justify-between items-center">
                  <span className={textColor}>Primary Call-to-Actions</span>
                  <ScoreBadge
                    score={metric.CTA_Visibility.Score}
                    textGood="CTAs visible"
                    textBad="CTAs not visible"
                  />
                </div>
                {/* ... */}
                <div className="flex justify-between items-center">
                  <span className={textColor}>Form Length</span>
                  <ScoreBadge
                    score={metric.Form_Length.Score}
                    textGood="Form length optimal"
                    textBad="Form length not optimal"
                  />
                </div>
                {/* ... */}
                <div className="flex justify-between items-center">
                  <span className={textColor}>Exit Intent Triggers</span>
                  <ScoreBadge
                    score={metric.Score}
                    textGood="Exit triggers active"
                    textBad="Exit triggers missing"
                  />
                </div>
              </div>
            </div>

            {/* Audit Dropdowns */}
            <AuditDropdown
              items={metric.Passed}
              title="Passed Audits"
              darkMode={darkMode}
            />
            <AuditDropdown
              items={metric.Warning}
              title="Warning"
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
          {/* Title with Circular Progress */}
          <h1 className="responsive text-heading-25 flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6">
            Conversion Lead Flow{" "}
            <CircularProgress value={metric.Percentage} size={70} stroke={5} />
          </h1>

          {/* Conversion & UX Metrics Card */}
          <div
            className={`w-full max-w-4xl p-6 mb-5 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
          >
            <h2 className={`text-xl font-bold mb-4 ${textColor}`}>
              Conversion & UX Metrics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* ... (Aapke poore 12 items yahan) ... */}
              <div className="flex justify-between items-center">
                <span className={textColor}>Primary Call-to-Actions</span>
                <ScoreBadge
                  score={metric.CTA_Visibility.Score}
                  textGood="CTAs visible"
                  textBad="CTAs not visible"
                />
              </div>
              {/* ... (baaki items) ... */}
              {["Testimonials", "Reviews", "Trust_Badges", "Client_Logos"].map(
                (item) => (
                  <div key={item} className="flex justify-between items-center">
                    <span className={textColor}>{item.replace("_", " ")}</span>
                    <ScoreBadge
                      score={metric.Score}
                      textGood={`${item.replace("_", " ")} visible`}
                      textBad={`${item.replace("_", " ")} missing`}
                    />
                  </div>
                )
              )}
              {/* ... (baaki items) ... */}
              <div className="flex justify-between items-center">
                <span className={textColor}>Exit Intent Triggers</span>
                <ScoreBadge
                  score={metric.Score}
                  textGood="Exit triggers active"
                  textBad="Exit triggers missing"
                />
              </div>
            </div>
          </div>

          {/* Audit Dropdowns */}
          <AuditDropdown
            items={metric.Passed}
            title="Passed Audits"
            darkMode={darkMode}
          />
          <AuditDropdown
            items={metric.Warning}
            title="Warning"
            darkMode={darkMode}
          />
          <AuditDropdown
            items={metric.Improvements}
            title="Failed Audits"
            darkMode={darkMode}
          />
        </main>
      )}
    </>
  );
}