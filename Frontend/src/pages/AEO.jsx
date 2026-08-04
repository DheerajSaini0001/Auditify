import React, { useContext } from "react";
import UrlHeader from "../components/UrlHeader";
import ReportRestrictionWrapper from "../components/ReportRestrictionWrapper";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import ParameterInfoModal from "../components/ParameterInfoModal";
import MetricInfoModal from "../components/MetricInfoModal";
import { InfoDetails } from "../components/InfoDetails";
import PillarHeader from "../components/reusablecomponent/PillarHeader";
import AEOPage from "./AEOPage";
import LivePreview from "../components/LivePreview";
import { AuditShimmer } from "../components/reusablecomponent/AuditShimmer";
import { Sparkles, Database, MessageSquareText, Bot, Quote } from "lucide-react";

const scoreCalculationInfo = InfoDetails.AEO_Methodology;

// What the AEO engine is doing while the user waits. Rotated by <AuditShimmer>,
// the shared loading state used by every audit section.
const AEO_AUDIT_STEPS = [
  { icon: <Database className="w-8 h-8 text-accent" />, title: "Reading Your Markup", text: "Checking the schema an answer engine would use to understand this page..." },
  { icon: <MessageSquareText className="w-8 h-8 text-accent" />, title: "Looking For Answers", text: "Finding whether your pages answer questions directly, in the first paragraph..." },
  { icon: <Bot className="w-8 h-8 text-accent" />, title: "Testing Engine Access", text: "Confirming Gemini, ChatGPT and Perplexity are each allowed to read your site..." },
  { icon: <Quote className="w-8 h-8 text-accent" />, title: "Weighing Trust Signals", text: "Assessing citations, attribution and consistency an engine would rely on before quoting you..." },
];

// AEO section page (spec §2.8 — Answer Engine Optimization).
// Headline is the spec-weighted Percentage (aeo.Percentage); the per-engine gauges
// and signal breakdown live inside AEOPage below.
const AEO_Inner = React.memo(({ data, loading, darkMode }) => {
  const aeo = data?.aeo || {};
  const headlineScore = typeof aeo?.Percentage === "number" ? aeo.Percentage : (aeo?.overallScore || 0);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);

  // AEO keeps its per-check statuses under `params`, not as direct children like the
  // other sections — so these cannot be counted the same way the sibling pages do.
  // A signed-out visitor gets the section stripped, and the server sends the tallies
  // instead (see Backend/utils/reportGating.js).
  // Computed inline rather than memoised: `aeo` is a fresh object on every render
  // (`data?.aeo || {}`), so a useMemo keyed on it would recompute every time anyway
  // while adding a dependency-array footgun. Filtering ~16 params costs nothing.
  const aeoStats = (() => {
    if (aeo?.locked) {
      return {
        passed: aeo.passedCount ?? 0,
        warning: aeo.warningCount ?? 0,
        failed: aeo.failedCount ?? 0,
      };
    }
    const params = Object.values(aeo?.params || {});
    return {
      passed: params.filter((p) => p?.status === "pass").length,
      warning: params.filter((p) => p?.status === "warning").length,
      failed: params.filter((p) => p?.status === "fail").length,
    };
  })();

  // Has this section actually reported? A gated guest copy counts — it carries the
  // Percentage and the tallies, which is everything the header renders.
  const hasAeoData =
    typeof aeo?.Percentage === "number" ||
    typeof aeo?.overallScore === "number" ||
    Object.keys(aeo?.params || {}).length > 0;

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

        {/* Pillar header — same card every other section uses. AEO had none: its
            title, score and description lived inside AEOPage in a bespoke layout,
            which is why this was the one pillar with no pass/warn/fail tallies and
            no score ring. That block is removed from AEOPage so this is the single
            place the section introduces itself.

            The card swaps between the shared shimmer and the header on `hasAeoData`,
            exactly as the other pillars do. Two things were wrong before: the header
            rendered "0% · 0 Passed · 0 Failed" mid-audit (a real score, and a wrong
            one), and AEO's loading state lived inside AEOPage where there is no card
            wrapper — so it appeared with no background while every other section
            showed a white card. AEOPage returns null while loading now. */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
          {!hasAeoData ? (
          <div className={`flex flex-col xl:flex-row ${data?.report === "All" ? "" : "min-h-[300px]"}`}>
            {/* Left Panel: Live Preview (Only if not All) */}
            {data?.report !== "All" && (
              <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-cardsoft border-line"}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                <div className="w-full relative z-10">
                  <LivePreview data={data} loading={loading} variant="plain" />
                </div>
              </div>
            )}
            {/* Right Panel: Shimmer */}
            <div className="flex-1 flex flex-col justify-center">
              <AuditShimmer darkMode={darkMode} steps={AEO_AUDIT_STEPS} />
            </div>
          </div>
          ) : (
          <div className="flex flex-col xl:flex-row">
            <PillarHeader
              darkMode={darkMode}
              fullReport={data?.report === "All"}
              badge={{ icon: Sparkles, label: "AEO Audit" }}
              chips={<>
                <span
                  title="This score is Auditify's own composite index for answer-engine readiness. No industry-standard external tool produces a comparable AEO score to cross-check against."
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider border ${darkMode ? "bg-slate-800/60 text-slate-400 border-slate-700" : "bg-cardsoft text-muted border-line"}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${darkMode ? "bg-slate-500" : "bg-slate-400"}`} />
                  Auditify Index · no external equivalent
                </span>
              </>}
              title="Answer Engine"
              titleAccent="Optimization"
              description="Measuring your site's readiness for the next generation of AI search."
              stats={aeoStats}
              score={headlineScore}
              onMethodology={() => setSelectedMetricInfo(scoreCalculationInfo)}
            />
          </div>
          )}
        </div>

        {/* Answer-Engine breakdown (gauges + signals + recommendations) */}
        <ReportRestrictionWrapper section="AEO (Answer Engine Optimization)">
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

      <MetricInfoModal
        isOpen={!!selectedMetricInfo}
        onClose={() => setSelectedMetricInfo(null)}
        info={selectedMetricInfo}
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
