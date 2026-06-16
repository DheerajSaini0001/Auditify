import React from "react";
import { Code2, ArrowRight } from "lucide-react";
import { useData } from "../../context/DataContext";
import { developerOnlyParamsInSection } from "../../config/parameterAudience";

// Shown at the bottom of a section that displays SOME dealer params but also hides
// developer-only ones (a "mixed" section). In dealer mode it tells the user how many
// more (technical) parameters exist and lets them switch to Developer mode. Renders
// nothing in developer mode or when the section has no hidden params.
const MoreParamsFooter = ({ sectionKey, darkMode }) => {
    const { audienceMode, setAudienceMode } = useData();
    if (audienceMode !== "dealer") return null;

    const count = developerOnlyParamsInSection(sectionKey).length;
    if (count === 0) return null;

    return (
        <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-surface"} pb-8`}>
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div
                    className={`flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-dashed px-6 py-5 ${darkMode ? "bg-slate-900/40 border-slate-700 text-slate-400" : "bg-card border-line text-muted"
                        }`}
                >
                    <div className="flex items-center gap-3 text-sm text-center sm:text-left">
                        <Code2 className={`w-5 h-5 shrink-0 ${darkMode ? "text-blue-400" : "text-accent"}`} />
                        <span>
                            You're viewing dealer parameters.{" "}
                            <span className={darkMode ? "text-slate-200 font-semibold" : "text-ink font-semibold"}>
                                {count} more technical {count === 1 ? "parameter" : "parameters"}
                            </span>{" "}
                            {count === 1 ? "is" : "are"} available in Developer mode.
                        </span>
                    </div>
                    <button
                        onClick={() => setAudienceMode("developer")}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-md transition-all active:scale-[0.98] shrink-0 ${darkMode ? "bg-blue-600 hover:bg-blue-500 shadow-blue-600/20" : "bg-accent hover:bg-accenthover shadow-accent/20"}`}
                    >
                        Switch to Developer mode <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MoreParamsFooter;
