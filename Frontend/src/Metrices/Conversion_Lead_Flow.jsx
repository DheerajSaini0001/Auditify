import React, { useContext } from "react";
import { ThemeContext } from "../ThemeContext";
import { Check, X, AlertTriangle } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";

export default function Conversion_Lead_Flow({ data }) {
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

  // Check if any Conversion metric failed


  return (
    <div
      id="ConversionLeadFlow"
      className={`min-h-fit pt-20 pb-16 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 m-4 flex flex-col items-center justify-start p-6 space-y-6 ${containerBg}`}
    >
      <h1 className={`responsive text-heading-25 flex sm:gap-10 justify-center items-center text-3xl font-extrabold mb-6 text-center ${textColor}`}>
        Conversion Lead Flow
        <CircularProgress
          value={data.Conversion_and_Lead_Flow.Percentage}
          size={70}
          stroke={5}
        />
      </h1>

      <div
        className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500  ${cardBg}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between items-center">
            <span className={textColor}>Primary (Call-to-Actions) CTAs</span>
            <ScoreBadge
              score={data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Visibility.Score}
              textGood="CTAs implemented"
              textBad="CTAs missing"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>CTA_Clarity</span>
            <ScoreBadge
              score={data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Clarity.Score}
              textGood="CTAs implemented"
              textBad="CTAs missing"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>CTA_Contrast</span>
            <ScoreBadge
              score={data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Contrast.Score}
              textGood="CTAs implemented"
              textBad="CTAs missing"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>CTA_Crowding</span>
            <ScoreBadge
              score={data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Crowding.Score}
              textGood="CTAs implemented"
              textBad="CTAs missing"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>CTA_Flow_Alignment</span>
            <ScoreBadge
              score={data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Flow_Alignment.Score}
              textGood="CTAs implemented"
              textBad="CTAs missing"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Form_Presence</span>
            <ScoreBadge
              score={data.Conversion_and_Lead_Flow.CTA_and_Forms.Form_Presence.Score}
              textGood="CTAs implemented"
              textBad="CTAs missing"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Form_Length</span>
            <ScoreBadge
              score={data.Conversion_and_Lead_Flow.CTA_and_Forms.Form_Length.Score}
              textGood="CTAs implemented"
              textBad="CTAs missing"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Required_vs_Optional_Fields</span>
            <ScoreBadge
              score={data.Conversion_and_Lead_Flow.CTA_and_Forms.Required_vs_Optional_Fields.Score}
              textGood="CTAs implemented"
              textBad="CTAs missing"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Inline_Validation</span>
            <ScoreBadge
              score={data.Conversion_and_Lead_Flow.CTA_and_Forms.Inline_Validation.Score}
              textGood="CTAs implemented"
              textBad="CTAs missing"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Submit_Button_Clarity</span>
            <ScoreBadge
              score={data.Conversion_and_Lead_Flow.CTA_and_Forms.Submit_Button_Clarity.Score}
              textGood="CTAs implemented"
              textBad="CTAs missing"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>AutoFocus_Field</span>
            <ScoreBadge
              score={data.Conversion_and_Lead_Flow.CTA_and_Forms.AutoFocus_Field.Score}
              textGood="CTAs implemented"
              textBad="CTAs missing"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>MultiStep_Form_Progress</span>
            <ScoreBadge
              score={data.Conversion_and_Lead_Flow.CTA_and_Forms.MultiStep_Form_Progress.Score}
              textGood="CTAs implemented"
              textBad="CTAs missing"
            />
          </div>
      
        </div>   
      </div>
      <AuditDropdown items={data.Conversion_and_Lead_Flow.Passed} title="Passed Audits" darkMode={darkMode} />
      <AuditDropdown items={data.Conversion_and_Lead_Flow.Warning} title="Warning" darkMode={darkMode} />
      <AuditDropdown items={data.Conversion_and_Lead_Flow.Improvements} title="Failed Audits" darkMode={darkMode} />
     
    </div>
  );
}
