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

  {/* 🧩 GROUP 1 – Conversion Readiness */}
  <h2 className="col-span-2 text-base font-semibold mt-4 mb-2 text-blue-500">
    Conversion Readiness
  </h2>

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
      textGood="Clear CTAs"
      textBad="Unclear CTAs"
    />
  </div>

  <div className="flex justify-between items-center">
    <span className={textColor}>Form Presence</span>
    <ScoreBadge
      score={data.Conversion_and_Lead_Flow.CTA_and_Forms.Form_Presence.Score}
      textGood="Form present"
      textBad="Form missing"
    />
  </div>

  <div className="flex justify-between items-center">
    <span className={textColor}>Form Length</span>
    <ScoreBadge
      score={data.Conversion_and_Lead_Flow.CTA_and_Forms.Form_Length.Score}
      textGood="Optimal length"
      textBad="Too long or short"
    />
  </div>

  {/* 🛡️ GROUP 2 – Trust & Credibility */}
  <h2 className="col-span-2 text-base font-semibold mt-6 mb-2 text-green-500">
    Trust & Credibility
  </h2>

  <div className="flex justify-between items-center">
    <span className={textColor}>Testimonials</span>
    <ScoreBadge
      score={data.Conversion_and_Lead_Flow.Trust_and_SocialProof.Testimonials.Score}
      textGood="Testimonials visible"
      textBad="Testimonials missing"
    />
  </div>

  <div className="flex justify-between items-center">
    <span className={textColor}>Reviews</span>
    <ScoreBadge
      score={data.Conversion_and_Lead_Flow.Trust_and_SocialProof.Reviews.Score}
      textGood="Reviews displayed"
      textBad="Reviews missing"
    />
  </div>

  <div className="flex justify-between items-center">
    <span className={textColor}>Trust Badges</span>
    <ScoreBadge
      score={data.Conversion_and_Lead_Flow.Trust_and_SocialProof.Trust_Badges.Score}
      textGood="Trust badges shown"
      textBad="Trust badges missing"
    />
  </div>

  <div className="flex justify-between items-center">
    <span className={textColor}>Client Logos</span>
    <ScoreBadge
      score={data.Conversion_and_Lead_Flow.Trust_and_SocialProof.Client_Logos.Score}
      textGood="Client logos visible"
      textBad="Client logos missing"
    />
  </div>

  {/* 💡 GROUP 3 – UX & Retention */}
  <h2 className="col-span-2 text-base font-semibold mt-6 mb-2 text-purple-500">
    UX & Retention
  </h2>

  <div className="flex justify-between items-center">
    <span className={textColor}>Mobile CTA Adaptation</span>
    <ScoreBadge
      score={data.Conversion_and_Lead_Flow.UX_and_Interaction.Mobile_CTA_Adaptation.Score}
      textGood="Mobile CTA adapted"
      textBad="Mobile CTA not adapted"
    />
  </div>

  <div className="flex justify-between items-center">
    <span className={textColor}>Progress Indicators</span>
    <ScoreBadge
      score={data.Conversion_and_Lead_Flow.UX_and_Interaction.Progress_Indicators.Score}
      textGood="Progress indicators clear"
      textBad="Progress indicators unclear"
    />
  </div>

  <div className="flex justify-between items-center">
    <span className={textColor}>Friendly Error Handling</span>
    <ScoreBadge
      score={data.Conversion_and_Lead_Flow.UX_and_Interaction.Friendly_Error_Handling.Score}
      textGood="Errors handled well"
      textBad="Errors handled poorly"
    />
  </div>

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
      <AuditDropdown items={data.Conversion_and_Lead_Flow.Passed} title="Passed Audits" darkMode={darkMode} />
      <AuditDropdown items={data.Conversion_and_Lead_Flow.Warning} title="Warning" darkMode={darkMode} />
      <AuditDropdown items={data.Conversion_and_Lead_Flow.Improvements} title="Failed Audits" darkMode={darkMode} />
     
    </div>
  );
}
