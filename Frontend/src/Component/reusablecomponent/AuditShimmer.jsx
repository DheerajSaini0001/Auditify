import React, { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";

export const AuditShimmer = ({ darkMode, loading, data, auditSteps = [], metricKey = "technicalPerformance", isFinished = false }) => {
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        if ((loading || !data?.[metricKey]) && !isFinished) {
            if (auditSteps.length > 0) {
                const interval = setInterval(() => {
                    setActiveStep((prev) => (prev + 1) % auditSteps.length);
                }, 2000);
                return () => clearInterval(interval);
            }
        }
    }, [loading, data, auditSteps.length, metricKey, isFinished]);

    if (!loading && data?.[metricKey]) return null;

    // The audit finished but this section returned no data — stop spinning forever.
    if (isFinished) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-12 px-6 min-h-[350px]">
                <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
                <h2 className={`text-2xl fontsemibold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                    Section data unavailable
                </h2>
                <p className={`mt-3 max-w-sm text-base leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    The audit finished but didn’t return data for this section (often a slow or bot-protected
                    site, or the performance API was unreachable). Please re-run the audit.
                </p>
            </div>
        );
    }

    const step = auditSteps[activeStep] || auditSteps[0];
    if (!step) return null;

    return (
        <div className="flex flex-col items-center justify-center py-8 px-4 animate-in fade-in zoom-in duration-500 min-h-[350px]">
            <div className={`w-full max-w-xl rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-500 ${darkMode ? "bg-slate-800/40 border border-slate-700/50" : "bg-slate-100/60 border border-slate-200/50"
                }`}>

                {/* Icon Container (Circle) */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${darkMode ? "bg-slate-900 shadow-black/40 text-white" : "bg-[#1e293b] shadow-slate-400/30 text-white"
                    }`}>
                    <div className="animate-pulse">
                        {React.cloneElement(step.icon, {
                            className: "w-8 h-8",
                            strokeWidth: 2.5
                        })}
                    </div>
                </div>

                {/* Title */}
                <h2 className={`mt-6 text-2xl fontsemibold tracking-tight transition-all duration-500 ${darkMode ? "text-white" : "text-slate-900"
                    }`}>
                    {step.title}
                </h2>

                {/* Description (3 lines focused) */}
                <p className={`mt-4 text-base leading-relaxed max-w-sm mx-auto transition-all duration-500 ${darkMode ? "text-slate-400" : "text-slate-500"
                    }`}>
                    {step.text}
                </p>

                {/* Processing State */}
                <div className="mt-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs fontsemibold uppercase tracking-wider">Processing</span>
                </div>

                {/* Progress Indicators */}
                <div className="flex items-center gap-2 mt-6">
                    {auditSteps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === activeStep
                                ? "w-6 bg-blue-500"
                                : i < activeStep
                                    ? "w-6 bg-blue-500/40"
                                    : "w-2 bg-slate-400/30"
                                }`}
                        />
                    ))}
                </div>

            </div>
        </div>
    );
};
