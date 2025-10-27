import React, { useContext } from "react";
import { ThemeContext } from "../ThemeContext";
import { Check, X } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";

export default function Conversion_Lead_Flow({darkMode}) {
  
    var { data, loading } = useData(); 
    data=data.Metric;

  if (!data) return <div />;

  // Responsive ScoreBadge


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
      id="ConversionLeadFlow"
      className={`min-h-fit pt-20 pb-16 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 m-4 flex flex-col items-center justify-start p-6 space-y-6 ${containerBg}`}
    >
      <h1 className="responsive text-heading-25 flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6">
        Conversion Lead Flow
        <CircularProgress
          value={data.Conversion_and_Lead_Flow.Percentage}
          size={70}
          stroke={5}
        />
      </h1>

      {/* Conversion & Lead Flow Card */}
 <div className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500  ${cardBg}`}>
  <h2 className={`text-xl font-bold mb-4 ${textColor}`}>Conversion & UX Metrics</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

    {/* Conversion Readiness */}
    <div className="flex justify-between items-center">
      <span className={textColor}>Primary Call-to-Actions</span>
      <ScoreBadge
        score={data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Visibility.Score}
        textGood="CTAs visible"
        textBad="CTAs not visible"
      />
    </div>

    <div className="flex justify-between items-center">
      <span className={textColor}>CTA Clarity</span>
      <ScoreBadge
        score={data.Conversion_and_Lead_Flow.CTA_and_Forms.CTA_Clarity.Score}
        textGood="CTAs are clear"
        textBad="CTAs are unclear"
      />
    </div>

    <div className="flex justify-between items-center">
      <span className={textColor}>Form Presence</span>
      <ScoreBadge
        score={data.Conversion_and_Lead_Flow.CTA_and_Forms.Form_Presence.Score}
        textGood="Form is present"
        textBad="Form is missing"
      />
    </div>

    <div className="flex justify-between items-center">
      <span className={textColor}>Form Length</span>
      <ScoreBadge
        score={data.Conversion_and_Lead_Flow.CTA_and_Forms.Form_Length.Score}
        textGood="Form length is optimal"
        textBad="Form length is not optimal"
      />
    </div>

    {/* Trust & Credibility */}
    {["Testimonials", "Reviews", "Trust_Badges", "Client_Logos"].map((item) => (
      <div key={item} className="flex justify-between items-center">
        <span className={textColor}>{item.replace("_", " ")}</span>
        <ScoreBadge
          score={data.Conversion_and_Lead_Flow.Trust_and_SocialProof[item].Score}
          textGood={`${item.replace("_", " ")} visible`}
          textBad={`${item.replace("_", " ")} missing`}
        />
      </div>
    ))}

    {/* UX & Retention */}
    {["Mobile_CTA_Adaptation", "Progress_Indicators", "Friendly_Error_Handling"].map((item) => (
      <div key={item} className="flex justify-between items-center">
        <span className={textColor}>{item.replace("_", " ")}</span>
        <ScoreBadge
          score={data.Conversion_and_Lead_Flow.UX_and_Interaction[item].Score}
          textGood={`${item.replace("_", " ")} is good`}
          textBad={`${item.replace("_", " ")} is bad`}
        />
      </div>
    ))}

    <div className="flex justify-between items-center">
      <span className={textColor}>Exit Intent Triggers</span>
      <ScoreBadge
        score={data.Conversion_and_Lead_Flow.Lead_Funnel.Exit_Intent_Triggers.Score}
        textGood="Exit triggers active"
        textBad="Exit triggers missing"
      />
    </div>

  </div>
</div>

      {/* Audit Dropdowns */}
      <AuditDropdown
        items={data.Conversion_and_Lead_Flow.Passed}
        title="Passed Audits"
        darkMode={darkMode}
      />
      <AuditDropdown
        items={data.Conversion_and_Lead_Flow.Warning}
        title="Warning"
        darkMode={darkMode}
      />
      <AuditDropdown
        items={data.Conversion_and_Lead_Flow.Improvements}
        title="Failed Audits"
        darkMode={darkMode}
      />
    </div>
  );
}
