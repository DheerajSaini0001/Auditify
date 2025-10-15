import React, { useContext } from "react";
import { ThemeContext } from "../ThemeContext";
import { Check, X } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import Auditdropdown from "../Component/AuditDropdown";

export default function AIO({ data }) {
  const { darkMode } = useContext(ThemeContext);

  if (!data) return <div />;

  // ScoreBadge with descriptive text
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
      id="AIOReadiness"
      className={`min-h-fit pt-20 pb-16 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-2 transition-all duration-300 m-4 flex flex-col items-center justify-start p-6 space-y-6 ${containerBg}`}
    >
      <h1 className={`responsive text-heading-25 flex sm:gap-10 justify-center items-center text-3xl font-extrabold mb-6 text-center ${textColor}`}>
        AIO (AI-Optimization) Readiness
        <CircularProgress
          value={data.AIO_Readiness.Percentage}
          size={70}
          stroke={5}
        />
      </h1>

      {/* Important Metrics Only */}
      <div className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500  ${cardBg}`}>
        <h2 className={`text-xl font-bold mb-4 ${textColor}`}>Most Important Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Technical AI Foundation */}
          <div className="flex justify-between items-center">
            <span className={textColor}>Structured Data</span>
            <ScoreBadge
              score={data.AIO_Readiness.Technical_AI_Foundation.Structured_Data.Score}
              textGood="Structured data is complete"
              textBad="Structured data is incomplete"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={textColor}>Metadata Completion</span>
            <ScoreBadge
              score={data.AIO_Readiness.Technical_AI_Foundation.Metadata_Complete.Score}
              textGood="Metadata fully complete"
              textBad="Metadata incomplete"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={textColor}>Page Load Speed</span>
            <ScoreBadge
              score={data.AIO_Readiness.Technical_AI_Foundation.Fast_Page_Load.Score}
              textGood="Pages load quickly"
              textBad="Pages load slowly"
            />
          </div>

          {/* Content AI Optimization */}
          <div className="flex justify-between items-center">
            <span className={textColor}>NLP-Friendly Content</span>
            <ScoreBadge
              score={data.AIO_Readiness.Content_AI_Optimization.Content_NLP_Friendly.Score}
              textGood="Content is NLP-friendly"
              textBad="Content is not NLP-friendly"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={textColor}>Keyword & Entity Annotation</span>
            <ScoreBadge
              score={data.AIO_Readiness.Content_AI_Optimization.Keywords_Entities_Annotated.Score}
              textGood="Keywords/entities annotated"
              textBad="Annotations missing"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={textColor}>Content Updates</span>
            <ScoreBadge
              score={data.AIO_Readiness.Content_AI_Optimization.Content_Updated_Regularly.Score}
              textGood="Content updated regularly"
              textBad="Content rarely updated"
            />
          </div>

          {/* Data Intelligence Integration */}
          <div className="flex justify-between items-center">
            <span className={textColor}>Behavior Tracking</span>
            <ScoreBadge
              score={data.AIO_Readiness.Data_Intelligence_Integration.Behavior_Tracking_Implemented.Score}
              textGood="Behavior tracking implemented"
              textBad="Behavior tracking missing"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={textColor}>Event & Goal Tracking</span>
            <ScoreBadge
              score={data.AIO_Readiness.Data_Intelligence_Integration.Event_Goal_Tracking_Integrated.Score}
              textGood="Event tracking integrated"
              textBad="Event tracking missing"
            />
          </div>

          {/* AI Content Delivery */}
          <div className="flex justify-between items-center">
            <span className={textColor}>Dynamic Personalization</span>
            <ScoreBadge
              score={data.AIO_Readiness.AI_Content_Delivery.Dynamic_Personalization.Score}
              textGood="Dynamic personalization enabled"
              textBad="Dynamic personalization missing"
            />
          </div>
        </div>
      </div>

      {/* Optional dropdowns for Passed/Warning/Improvements */}
      <Auditdropdown items={data.AIO_Readiness.Passed} darkMode={darkMode} title="Passed Audit" />
      <Auditdropdown items={data.AIO_Readiness.Warning} darkMode={darkMode} title="Warnings" />
      <Auditdropdown items={data.AIO_Readiness.Improvements} darkMode={darkMode} title="Failed Audits" />
    </div>
  );
}
