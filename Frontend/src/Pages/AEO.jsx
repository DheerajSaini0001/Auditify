import React, { useContext } from "react";
import UrlHeader from "../Component/UrlHeader";
import ReportRestrictionWrapper from "../Component/ReportRestrictionWrapper";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import AEOPage from "./AEOPage";

// AEO section page (spec §2.8 — Answer Engine Optimization).
// Headline is the spec-weighted Percentage (aeo.Percentage); the per-engine gauges
// and signal breakdown live inside AEOPage below.
const AEO_Inner = React.memo(({ data, loading, darkMode }) => {
  const aeo = data?.aeo || {};
  const headlineScore = typeof aeo?.Percentage === "number" ? aeo.Percentage : (aeo?.overallScore || 0);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);

  const mainBg = darkMode ? "bg-gray-900" : "bg-surface";

  return (
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-6`}>

        {/* URL Header Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
          <UrlHeader
            data={data}
            darkMode={darkMode}
            sectionName="AEO (Answer Engine Optimization)"
            sectionData={aeo}
            auditScore={headlineScore}
            hideBorder={true}
          />
        </div>

        {/* Answer-Engine breakdown (gauges + signals + recommendations) */}
        <ReportRestrictionWrapper>
          <AEOPage
            auditData={data}
            darkMode={darkMode}
            onInfo={(info) => setSelectedParameterInfo(info)}
            hideScreenshot={data?.report === "All"}
          />
        </ReportRestrictionWrapper>

      </main>

      <ParameterInfoModal
        isOpen={!!selectedParameterInfo}
        onClose={() => setSelectedParameterInfo(null)}
        info={selectedParameterInfo}
        darkMode={darkMode}
      />
    </div>
  );
});

export default function AEO({ data: propData, loading: propLoading, darkMode: propDarkMode }) {
  const contextData = useData();
  const { theme } = useContext(ThemeContext);

  const data = propData !== undefined ? propData : contextData.data;
  const loading = propLoading !== undefined ? propLoading : contextData.loading;
  const darkMode = propDarkMode !== undefined ? propDarkMode : (theme === "dark");

  return <AEO_Inner data={data} loading={loading} darkMode={darkMode} />;
}
