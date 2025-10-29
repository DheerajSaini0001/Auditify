import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Check, X } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import Sidebar from "../Component/Sidebar"; // ✅ 1. Imported Sidebar

// ✅ 2. Reusable ScoreBadge moved outside component
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

export default function UX_Content_Structure() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const { data: rawData, loading } = useData();
  const data = rawData;

  // ✅ 3. Added Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading data...
      </div>
    );
  }

  // ✅ 3. Added specific data check to prevent errors
  if (!data || !data.UX_or_Content_Structure) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 dark:text-gray-400">
        No data available. Please submit input on Home page.
      </div>
    );
  }

  const metric = data.UX_or_Content_Structure;

  // ✅ Theme-based styles
  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  const textColor = darkMode ? "text-white" : "text-black";

  // ✅ 1. Added sidebarClass constant
  const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;

  return (
    // ✅ 1. Added Layout structure
    <>
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
          {/* ✅ 4. Original Content pasted inside main */}

          {/* Header */}
          <h1 className="responsive text-heading-25 flex sm:gap-10 justify-center items-center text-3xl font-extrabold mb-6">
            UX Content Structure
            <CircularProgress value={metric.Percentage} size={70} stroke={5} />
          </h1>

          {/* Main Card */}
          <div
            className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center">
                <span className={textColor}>Navigation Clarity</span>
                <ScoreBadge
                  score={metric.Navigation_Clarity.Score}
                  out={
                    metric.Navigation_Clarity.Score
                      ? "Easy to navigate"
                      : "Hard to navigate"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Mobile Responsiveness</span>
                <ScoreBadge
                  score={metric.Mobile_Responsiveness.Score}
                  out={
                    metric.Mobile_Responsiveness.Score
                      ? "Mobile-friendly"
                      : "Not mobile-friendly"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Content Relevance</span>
                <ScoreBadge
                  score={metric.Content_Relevance.Score}
                  out={
                    metric.Content_Relevance.Score
                      ? "Relevant content"
                      : "Irrelevant content"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Call to Action Clarity</span>
                <ScoreBadge
                  score={metric.Call_to_Action_Clarity.Score}
                  out={
                    metric.Call_to_Action_Clarity.Score
                      ? "Clear CTA"
                      : "Unclear CTA"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Interactive Feedback</span>
                <ScoreBadge
                  score={metric.Interactive_Feedback.Score}
                  out={
                    metric.Interactive_Feedback.Score
                      ? "Effective feedback"
                      : "Ineffective feedback"
                  }
                />
              </div>
            </div>
          </div>

          {/* ✅ Audit Dropdowns with theme support */}
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
    </>
  );
}