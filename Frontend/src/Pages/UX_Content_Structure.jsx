import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx"; // ✅ Correct path for ThemeContext
import { Check, X } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";

export default function UX_Content_Structure() {
  const { theme } = useContext(ThemeContext); // ✅ use theme context
  const darkMode = theme === "dark"; // ✅ determine dark/light mode

  const { data: rawData, loading } = useData();
  const data = rawData?.Metric;

  if (!data) return <div />;

  const metric = data.UX_or_Content_Structure;

  // ✅ Reusable ScoreBadge component
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

  // ✅ Theme-based styles
  const containerBg = darkMode
    ? "bg-zinc-900 border-gray-700 text-white"
    : "bg-gray-100 border-gray-300 text-black";

  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  const textColor = darkMode ? "text-white" : "text-black";

  return (
    <div
      id="UXContentStructure"
      className={`min-h-fit pt-20 pb-16 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 m-4 flex flex-col items-center justify-start p-6 space-y-6 ${containerBg}`}
    >
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
    </div>
  );
}
