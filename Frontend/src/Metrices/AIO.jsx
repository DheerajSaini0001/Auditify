import React, { useContext } from "react";
import { ThemeContext } from "../ThemeContext";
import { Check, X, AlertTriangle } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import Auditdropdown from "../Component/Auditdropdown";

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

      {/* Entity & Organization Clarity */}
      <div className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 hover:scale-105 transition-transform duration-300 ${cardBg}`}>
        <h2 className={`text-xl font-bold mb-4 ${textColor}`}>Entity & Organization Clarity</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Technical_AI_Foundation.Structured_Data.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Technical_AI_Foundation.Metadata_Complete.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Technical_AI_Foundation.Fast_Page_Load.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Technical_AI_Foundation.API_Data_Access.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Technical_AI_Foundation.Dynamic_Content_Available.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Technical_AI_Foundation.Multilingual_Support.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Content_AI_Optimization.Content_NLP_Friendly.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Content_AI_Optimization.Keywords_Entities_Annotated.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Content_AI_Optimization.Content_Updated_Regularly.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Content_AI_Optimization.Internal_Linking_AI_Friendly.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Content_AI_Optimization.Duplicate_Content_Detection_Ready.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Data_Intelligence_Integration.Behavior_Tracking_Implemented.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Data_Intelligence_Integration.Segmentation_Profiling_Ready.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Data_Intelligence_Integration.Event_Goal_Tracking_Integrated.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Data_Intelligence_Integration.AB_Testing_Ready.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.Data_Intelligence_Integration.User_Feedback_Loops_Present.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.AI_Content_Delivery.Dynamic_Personalization.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.AI_Content_Delivery.AI_Content_Distribution.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Consistent NAP</span>
            <ScoreBadge
              score={data.AIO_Readiness.AI_Content_Delivery.AI_Friendly_Structure.Score}
              textGood="NAP consistent"
              textBad="NAP inconsistent"
            />
          </div>
          
         
          
        </div>
<Auditdropdown items={data.AIO_Readiness.Passed} darkMode={darkMode} title="Passed Audit" />
<Auditdropdown items={data.AIO_Readiness.Warning} darkMode={darkMode} title="Warnings" />
<Auditdropdown items={data.AIO_Readiness.Improvements} darkMode={darkMode} title="Failed Audits" />

      </div>
    </div>
  );
}
