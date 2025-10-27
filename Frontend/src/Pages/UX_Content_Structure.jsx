import React, { useContext } from "react";
import { ThemeContext } from "../ThemeContext";
import { Check, X } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";

export default function UX_Content_Structure({ darkMode}) {

  var { data, loading } = useData(); 
  data=data.Metric;
  if (!data) return <div />;

  // ScoreBadge component
  const ScoreBadge = ({ score, textGood, textBad }) => {
    const cssscore = score ? "mobilebutton bg-green-300" : "mobilebutton bg-red-300";
    const hasValue = score ? <Check size={18} /> : <X size={18} />;
    return (
      <span
        className={`px-2.5 flex items-center gap-1.5 py-1 rounded-full text-black font-semibold text-sm shadow-md transform transition-transform ${cssscore}`}
      >
        {hasValue} {score ? textGood : textBad}
      </span>
    );
  };

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
      <h1 className={`responsive text-heading-25 flex sm:gap-10 justify-center items-center text-3xl font-extrabold mb-6 text-center ${textColor}`}>
        UX Content Structure
        <CircularProgress
          value={data.UX_or_Content_Structure.Percentage}
          size={70}
          stroke={5}
        />
      </h1>

      <div
        className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500  ${cardBg}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {/* Must-Show Top 5 UX Metrics */}
          <div className="flex justify-between items-center">
            <span className={textColor}>Navigation Clarity</span>
            <ScoreBadge
              score={data.UX_or_Content_Structure.Navigation_Clarity.Score}
              textGood="Easy to navigate"
              textBad="Hard to navigate"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={textColor}>Mobile Responsiveness</span>
            <ScoreBadge
              score={data.UX_or_Content_Structure.Mobile_Responsiveness.Score}
              textGood="Mobile-friendly"
              textBad="Not mobile-friendly"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={textColor}>Content Relevance</span>
            <ScoreBadge
              score={data.UX_or_Content_Structure.Content_Relevance.Score}
              textGood="Relevant content"
              textBad="Irrelevant content"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={textColor}>Call to Action Clarity</span>
            <ScoreBadge
              score={data.UX_or_Content_Structure.Call_to_Action_Clarity.Score}
              textGood="Clear CTA"
              textBad="Unclear CTA"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={textColor}>Interactive Feedback</span>
            <ScoreBadge
              score={data.UX_or_Content_Structure.Interactive_Feedback.Score}
              textGood="Effective feedback"
              textBad="Ineffective feedback"
            />
          </div>
        </div>
      </div>

      {/* AuditDropdowns */}
      <AuditDropdown
        items={data.UX_or_Content_Structure.Passed}
        title="Passed Audits"
        darkMode={darkMode}
      />
      <AuditDropdown
        items={data.UX_or_Content_Structure.Warning}
        title="Warning"
        darkMode={darkMode}
      />
      <AuditDropdown
        items={data.UX_or_Content_Structure.Improvements}
        title="Failed Audits"
        darkMode={darkMode}
      />
    </div>
  );
}
