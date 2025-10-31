import React, { useContext } from "react";
import { Check, X, Home, BarChart2, Settings, Moon, Sun, Loader2 } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import Sidebar from "../Component/Sidebar";

// ✅ Sidebar Component

// ✅ Main Component
export default function Technical_Performance() {
  const { data, loading } = useData();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const metric = data;
  const reportType = data?.Report;

  // ✅ Local component: ScoreBadge
  const ScoreBadge = ({ score, out, unit, des }) => {
    const cssscore = score ? "bg-green-300" : "bg-red-300";
    const hasValue = score ? <Check size={18} /> : <X size={18} />;
    return (
      <span
        className={`px-2.5 flex items-center gap-1.5 py-1 rounded-full text-black font-semibold text-sm shadow-md ${cssscore}`}
      >
        {hasValue} {out} {unit} {des}
      </span>
    );
  };

  // ✅ Theme styles
  const containerBg = darkMode
    ? "bg-zinc-900 border-gray-700 text-white"
    : "bg-gray-100 border-gray-300 text-black";

  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  const textColor = darkMode ? "text-white" : "text-black";
const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;

  // ✅ Main Layout
  return (
    <>{metric.Technical_Performance?(
   
  reportType === "All" ? (<div className="relative flex w-full h-full">
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
            {Object.entries(metric.Technical_Performance).map(
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
          </main>
        </div>):<main
  className={`flex justify-center flex-col items-center min-h-auto${
    darkMode ? " text-gray-100" : " text-gray-800"
  }`}
>
  {/* This new div centers all the content below */}
  <div className="flex w-full flex-col items-center justify-center space-y-8">
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
        {Object.entries(metric.Technical_Performance).map(
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
</main>

    ):(<Loader2 size={20} className="animate-spin w-5 h-5" />)}</>
  );
}
