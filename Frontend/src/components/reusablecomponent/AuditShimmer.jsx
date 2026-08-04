import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

/**
 * AuditShimmer — the one loading state every audit section shows while its
 * results are still coming in.
 *
 * Four pages had each grown a private copy of this markup (AccessibilityShimmer,
 * SecurityShimmer, UxShimmer, ConversionShimmer) plus their own copy of the
 * step-rotation effect, while AIO showed a bare spinner and AEO showed skeleton
 * blocks. Same moment in the same flow, five different answers. This is the only
 * one now.
 *
 * Purely presentational and self-contained: it rotates the steps itself, so a page
 * only decides *whether* to show it. It used to also take `data` + `metricKey` and
 * second-guess readiness internally — which was already wrong on On-Page SEO,
 * where it checked `data.onPageSEO.technicalPerformance` and so could never
 * resolve. Every call site already sits inside its own loading branch, so that
 * second opinion was never needed.
 *
 * @param steps [{ icon: <LucideIcon />, title, text }] — what is being analysed.
 *              Rotates every 2s; renders nothing if empty.
 * @param statusLine optional live progress text under the Processing chip. AEO
 *              streams real status messages from the server; without somewhere to
 *              put them, consolidating onto this component would have thrown that
 *              information away. Sections with nothing live to say just omit it.
 */
export const AuditShimmer = ({ darkMode, steps = [], statusLine = null }) => {
    const [activeStep, setActiveStep] = useState(0);

    useEffect(() => {
        if (steps.length <= 1) return;
        const interval = setInterval(() => {
            setActiveStep((prev) => (prev + 1) % steps.length);
        }, 2000);
        return () => clearInterval(interval);
    }, [steps.length]);

    const step = steps[activeStep] || steps[0];
    if (!step) return null;

    return (
        <div className="flex flex-col items-center justify-center py-8 px-4 animate-in fade-in zoom-in duration-500 min-h-[350px]">
            <div className={`w-full max-w-xl rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-500 ${darkMode ? "bg-slate-800/40 border border-slate-700/50" : "bg-cardsoft/60 border border-line/50"}`}>

                {/* Icon Container (Circle) */}
                <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${darkMode ? "bg-slate-900 shadow-black/40 text-white" : "bg-[#303945] shadow-slate-400/30 text-white"}`}>
                    <div className="animate-pulse">
                        {React.cloneElement(step.icon, {
                            className: "w-8 h-8",
                            strokeWidth: 2.5
                        })}
                    </div>
                </div>

                {/* Title */}
                <h2 className={`mt-6 text-2xl font-semibold tracking-tight transition-all duration-500 ${darkMode ? "text-white" : "text-ink"}`}>
                    {step.title}
                </h2>

                {/* Description */}
                <p className={`mt-4 text-base leading-relaxed max-w-sm mx-auto transition-all duration-500 ${darkMode ? "text-slate-400" : "text-muted"}`}>
                    {step.text}
                </p>

                {/* Processing State */}
                <div className="mt-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-accentsoft text-accent">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span className="text-xs font-semibold uppercase tracking-wider">Processing</span>
                </div>

                {statusLine && (
                    <p className={`mt-3 text-xs text-center max-w-sm ${darkMode ? "text-slate-500" : "text-faint"}`}>
                        {statusLine}
                    </p>
                )}

                {/* Progress Indicators */}
                <div className="flex items-center gap-2 mt-6">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === activeStep
                                ? "w-6 bg-accent"
                                : i < activeStep
                                    ? "w-6 bg-accent/40"
                                    : "w-2 bg-faint/30"
                                }`}
                        />
                    ))}
                </div>

            </div>
        </div>
    );
};

export default AuditShimmer;
