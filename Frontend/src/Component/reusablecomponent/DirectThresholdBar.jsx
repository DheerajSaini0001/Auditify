import React from "react";

const DirectThresholdBar = ({ metricData, darkMode }) => {

    const { meta } = metricData;

    const thresholds = meta?.thresholds || {};
    const hasTextThresholds = thresholds.Good || thresholds.Warning || thresholds.Poor;

    return (
        <div className="w-full">

            {hasTextThresholds && (
                <div className={`mt-6 p-4 rounded-2xl border transition-all duration-300 ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-cardsoft border-line"}`}>
                    <h4 className={`text-[10px] font-semibold uppercase tracking-[0.1em] mb-4 ${darkMode ? "text-gray-500" : "text-faint"}`}>
                        Thresholds
                    </h4>
                    <div className="space-y-3">
                        {thresholds.Good && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-emerald-500">Good:</span>
                                <span className="text-sm font-semibold text-emerald-500"> {thresholds.Good}</span>
                            </div>
                        )}
                        {thresholds.Warning && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-amber-500">Warning:</span>
                                <span className="text-sm font-semibold text-amber-500">{thresholds.Warning}</span>
                            </div>
                        )}
                        {thresholds.Poor && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-rose-500">Poor:</span>
                                <span className="text-sm font-semibold text-rose-500">{thresholds.Poor}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DirectThresholdBar;
