import React, { useContext } from "react";
import { Check, X } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext"; // ✅ Added ThemeContext

export default function Technical_Performance() {
  const { data, loading } = useData();
  const { theme } = useContext(ThemeContext); // ✅ Access theme from context
  const darkMode = theme === "dark"; // ✅ Convert to boolean

  if (!data ) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 dark:text-gray-400">
        No data available. Please submit input on Home page.
      </div>
    );
  }

  const metric = data;

  // ✅ Local component: ScoreBadge
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

  // ✅ Dynamic color styles
  const containerBg = darkMode
    ? "bg-zinc-900 border-gray-700 text-white"
    : "bg-gray-100 border-gray-300 text-black";

  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  const textColor = darkMode ? "text-white" : "text-black";

  return (
    <div
      id="TechnicalPerformance"
      className={`min-h-fit pt-20 pb-16 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 m-4 flex flex-col items-center justify-start p-6 space-y-6 ${containerBg}`}
    >
      {/* Heading */}
      <h1
        className={`responsive flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6 ${textColor}`}
      >
        Technical Performance
        <CircularProgress
          value={metric.Technical_Performance.Percentage}
          size={70}
          stroke={5}
        />
      </h1>

      {/* Core Web Vitals */}
      <div
        className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          {Object.entries(metric.Technical_Performance.Core_Web_Vitals).map(
            ([key, val]) => (
              <div key={key} className="flex justify-between items-center">
                <span className={textColor}>{key.replace(/_/g, " ")}</span>
                <ScoreBadge
                  score={val.Score}
                  out={val.Value}
                  unit={key !== "CLS" ? "Sec" : ""}
                  des={val.Score ? "Good" : "Poor"}
                />
              </div>
            )
          )}
        </div>
      </div>

      {/* Audit Results */}
      <AuditDropdown
        title="Passed Audits"
        items={metric.Technical_Performance.Passed}
        darkMode={darkMode}
      />
      <AuditDropdown
        title="Warning"
        items={metric.Technical_Performance.Warning}
        darkMode={darkMode}
      />
      <AuditDropdown
        title="Failed Audits"
        items={metric.Technical_Performance.Improvements}
        darkMode={darkMode}
      />
    </div>
  );
}
