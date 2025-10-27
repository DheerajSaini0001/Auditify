import React, { useContext } from "react";
import { DataContext } from "../context/DataContext"; // ✅ Context
import { Check, X } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";

export default function Technical_Performance({ darkMode,data }) {
  // const { data } = useContext(DataContext); // ✅ get data from context

  if (!data) return <div>No data available. Please submit input on Home page.</div>;

  // ScoreBadge component
  const ScoreBadge = ({ score, out, unit, des }) => {
    const cssscore = score ? "bg-green-300" : "bg-red-300";
    const hasValue = score ? <Check size={18} /> : <X size={18} />;
    return (
      <span
        className={`px-2.5 mobilebutton flex items-center gap-1.5 py-1 rounded-full text-black font-semibold text-sm shadow-md transform transition-transform ${cssscore}`}
      >
        {hasValue} {out} {unit} {des}
      </span>
    );
  };

  const containerBg = darkMode ? "bg-zinc-900 border-gray-700 text-white" : "bg-gray-100 border-gray-300 text-black";
  const cardBg = darkMode ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black" : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";
  const textColor = darkMode ? "text-white" : "text-black";

  return (
    <div
      id="TechnicalPerformance"
      className={`min-h-fit pt-20 pb-16 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 m-4 flex flex-col items-center justify-start p-6 space-y-6 ${containerBg}`}
    >
      <h1 className={`responsive text-heading-25 flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6 ${textColor}`}>
        Technical Performance
        <CircularProgress
          value={data.Technical_Performance.Percentage}
          size={70}
          stroke={5}
        />
      </h1>

      {/* Core Web Vitals */}
      <div className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between items-center">
            <span className={textColor}>Largest Contentful Paint (LCP)</span>
            <ScoreBadge
              score={data.Technical_Performance.Core_Web_Vitals.LCP.Score}
              out={data.Technical_Performance.Core_Web_Vitals.LCP.Value}
              unit={"Sec"}
              des={data.Technical_Performance.Core_Web_Vitals.LCP.Score ? "Good" : "Poor"}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Cumulative Layout Shift (CLS)</span>
            <ScoreBadge
              score={data.Technical_Performance.Core_Web_Vitals.CLS.Score}
              out={data.Technical_Performance.Core_Web_Vitals.CLS.Value}
              des={data.Technical_Performance.Core_Web_Vitals.CLS.Score ? "Good" : "Poor"}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>First Contentful Paint (FCP)</span>
            <ScoreBadge
              score={data.Technical_Performance.Core_Web_Vitals.FCP.Score}
              out={data.Technical_Performance.Core_Web_Vitals.FCP.Value}
              unit={"Sec"}
              des={data.Technical_Performance.Core_Web_Vitals.FCP.Score ? "Good" : "Poor"}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Time to First Byte (TTFB)</span>
            <ScoreBadge
              score={data.Technical_Performance.Core_Web_Vitals.TTFB.Score}
              out={data.Technical_Performance.Core_Web_Vitals.TTFB.Value}
              unit={"Sec"}
              des={data.Technical_Performance.Core_Web_Vitals.TTFB.Score ? "Good" : "Poor"}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Total Blocking Time (TBT)</span>
            <ScoreBadge
              score={data.Technical_Performance.Core_Web_Vitals.TBT.Score}
              out={data.Technical_Performance.Core_Web_Vitals.TBT.Value}
              unit={"Sec"}
              des={data.Technical_Performance.Core_Web_Vitals.TBT.Score ? "Good" : "Poor"}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Speed Index (SI)</span>
            <ScoreBadge
              score={data.Technical_Performance.Core_Web_Vitals.SI.Score}
              out={data.Technical_Performance.Core_Web_Vitals.SI.Value}
              unit={"Sec"}
              des={data.Technical_Performance.Core_Web_Vitals.SI.Score ? "Good" : "Poor"}
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Interaction to Next Paint (INP)</span>
            <ScoreBadge
              score={data.Technical_Performance.Core_Web_Vitals.INP.Score}
              out={data.Technical_Performance.Core_Web_Vitals.INP.Value}
              unit={"Sec"}
              des={data.Technical_Performance.Core_Web_Vitals.INP.Score ? "Good" : "Poor"}
            />
          </div>
        </div>
      </div>

      {/* Audit Results */}
      <AuditDropdown title="Passed Audits" items={data.Technical_Performance.Passed} darkMode={darkMode} />
      <AuditDropdown title="Warning" items={data.Technical_Performance.Warning} darkMode={darkMode} />
      <AuditDropdown title="Failed Audits" items={data.Technical_Performance.Improvements} darkMode={darkMode} />
    </div>
  );
}
