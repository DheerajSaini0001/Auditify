import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Check, X } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import Sidebar from "../Component/Sidebar"; // ✅ 1. Imported Sidebar

// ✅ 2. Reusable Badge moved outside component
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

export default function AIO() {
  // ✅ Use ThemeContext for global theme
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const { data: rawData, loading } = useData();
  const data = rawData;

  // ✅ 3. Added Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading data...
      </div>
    );
  }

  // ✅ 3. Added specific data check to prevent errors
  if (!data || !data.AIO_Readiness) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 dark:text-gray-400">
        No data available. Please submit input on Home page.
      </div>
    );
  }

  const metricData = data.AIO_Readiness;

  // ✅ Theme-based dynamic styles
  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  const textColor = darkMode ? "text-white" : "text-black";

  // ✅ 1. Added sidebarClass constant
  const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;

  return (
    // ✅ 1. Added Layout structure
    <>
      <div className="relative flex w-full h-full">
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
          {/* ✅ 4. Original Content pasted inside main */}

          {/* ✅ Header */}
          <h1 className="responsive text-heading-25 flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6 text-center">
            AIO (AI-Optimization) Readiness{" "}
            <CircularProgress value={metricData.Percentage} size={70} stroke={5} />
          </h1>

          {/* ✅ AIO Readiness Metrics */}
          <div
            className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
          >
            <h2 className={`text-xl font-bold mb-4 ${textColor}`}>
              Most Important Metrics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Technical AI Foundation */}
              <div className="flex justify-between items-center">
                <span className={textColor}>Structured Data</span>
                <ScoreBadge
                  score={metricData.Technical_AI_Foundation.Structured_Data.Score}
                  out={
                    metricData.Technical_AI_Foundation.Structured_Data.Score
                      ? "Structured data is complete"
                      : "Structured data is incomplete"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Metadata Completion</span>
                <ScoreBadge
                  score={
                    metricData.Technical_AI_Foundation.Metadata_Complete.Score
                  }
                  out={
                    metricData.Technical_AI_Foundation.Metadata_Complete.Score
                      ? "Metadata fully complete"
                      : "Metadata incomplete"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Page Load Speed</span>
                <ScoreBadge
                  score={metricData.Technical_AI_Foundation.Fast_Page_Load.Score}
                  out={
                    metricData.Technical_AI_Foundation.Fast_Page_Load.Score
                      ? "Pages load quickly"
                      : "Pages load slowly"
                  }
                />
              </div>

              {/* Content AI Optimization */}
              <div className="flex justify-between items-center">
                <span className={textColor}>NLP-Friendly Content</span>
                <ScoreBadge
                  score={
                    metricData.Content_AI_Optimization.Content_NLP_Friendly.Score
                  }
                  out={
                    metricData.Content_AI_Optimization.Content_NLP_Friendly.Score
                      ? "Content is NLP-friendly"
                      : "Content is not NLP-friendly"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Keyword & Entity Annotation</span>
                <ScoreBadge
                  score={
                    metricData.Content_AI_Optimization
                      .Keywords_Entities_Annotated.Score
                  }
                  out={
                    metricData.Content_AI_Optimization
                      .Keywords_Entities_Annotated.Score
                      ? "Keywords/entities annotated"
                      : "Annotations missing"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Content Updates</span>
                <ScoreBadge
                  score={
                    metricData.Content_AI_Optimization.Content_Updated_Regularly
                      .Score
                  }
                  out={
                    metricData.Content_AI_Optimization.Content_Updated_Regularly
                      .Score
                      ? "Content updated regularly"
                      : "Content rarely updated"
                  }
                />
              </div>

              {/* Data Intelligence Integration */}
              <div className="flex justify-between items-center">
                <span className={textColor}>Behavior Tracking</span>
                <ScoreBadge
                  score={
                    metricData.Data_Intelligence_Integration
                      .Behavior_Tracking_Implemented.Score
                  }
                  out={
                    metricData.Data_Intelligence_Integration
                      .Behavior_Tracking_Implemented.Score
                      ? "Behavior tracking implemented"
                      : "Behavior tracking missing"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Event & Goal Tracking</span>
                <ScoreBadge
                  score={
                    metricData.Data_Intelligence_Integration
                      .Event_Goal_Tracking_Integrated.Score
                  }
                  out={
                    metricData.Data_Intelligence_Integration
                      .Event_Goal_Tracking_Integrated.Score
                      ? "Event tracking integrated"
                      : "Event tracking missing"
                  }
                />
              </div>

              {/* AI Content Delivery */}
              <div className="flex justify-between items-center">
                <span className={textColor}>Dynamic Personalization</span>
                <ScoreBadge
                  score={
                    metricData.AI_Content_Delivery.Dynamic_Personalization.Score
                  }
                  out={
                    metricData.AI_Content_Delivery.Dynamic_Personalization.Score
                      ? "Dynamic personalization enabled"
                      : "Dynamic personalization missing"
                  }
                />
              </div>
            </div>
          </div>

          {/* ✅ Dropdowns */}
          <AuditDropdown
            items={metricData.Passed}
            title="Passed Audit"
            darkMode={darkMode}
          />
          <AuditDropdown
            items={metricData.Warning}
            title="Warnings"
            darkMode={darkMode}
          />
          <AuditDropdown
            items={metricData.Improvements}
            title="Failed Audits"
            darkMode={darkMode}
          />
        </main>
      </div>
    </>
  );
}