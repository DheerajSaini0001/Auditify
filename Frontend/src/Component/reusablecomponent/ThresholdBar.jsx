import React from "react";

const ThresholdBar = ({
    activeData,
    metricData,
    isPassed,
    isWarning,
    darkMode,
    scaleFactor = 1.33
}) => {
    const data = activeData || metricData;
    const thresholdsSource = data?.meta?.thresholds;

    if (!thresholdsSource) return null;

    // Parse threshold values from strings like "0-2500ms" or "2500-4000ms"
    const parseUpperBound = (str) => {
        if (!str || typeof str !== 'string') return undefined;
        // Extract all numbers from the string
        const matches = str.match(/(\d+(\.\d+)?)/g);
        if (!matches) return undefined;

        // If we have multiple numbers (e.g., "2500-4000ms"), take the second one (upper bound)
        if (matches.length >= 2) {
            return parseFloat(matches[1]);
        }
        // If we have one number (e.g., "0-2500ms"), take it
        else if (matches.length === 1) {
            return parseFloat(matches[0]);
        }
        return undefined;
    };

    // Extract the upper bounds from Good and Warning thresholds
    let goodVal = parseUpperBound(thresholdsSource.Good);
    let niVal = parseUpperBound(thresholdsSource.Warning);

    // If we can't parse the values, don't render the component
    if (!goodVal || !niVal) return null;

    let maxScale = niVal * scaleFactor;
    let goodWidth = (goodVal / maxScale) * 100;
    let niWidth = ((niVal - goodVal) / maxScale) * 100;
    let poorWidth = 100 - goodWidth - niWidth;

    // Parse numeric value from the data
    let numericValue = parseFloat(String(data.meta.value).replace(/[^0-9.]/g, ''));

    const currentPercent = Math.min((numericValue / maxScale) * 100, 100);

    const passed = isPassed !== undefined ? isPassed : (data.status === "pass");
    const warning = isWarning !== undefined ? isWarning : (data.status === "warning");

    return (
        <div className="mt-4">
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                Thresholds Distribution
            </h4>

            <div className="relative pt-6 pb-4">
                <div className="relative">
                    {/* Bar Container */}
                    <div className="h-2 w-full rounded-full overflow-hidden flex text-[0px] relative bg-gray-100 dark:bg-gray-800">
                        <div style={{ width: `${goodWidth}%` }} className="h-full bg-emerald-500 transition-all opacity-80 hover:opacity-100" title={`Good (≤${goodVal})`}></div>
                        <div style={{ width: `${niWidth}%` }} className="h-full bg-amber-500 transition-all opacity-80 hover:opacity-100" title={`Needs Improvement (${goodVal}-${niVal})`}></div>
                        <div style={{ width: `${poorWidth}%` }} className="h-full bg-rose-500 transition-all opacity-80 hover:opacity-100" title={`Poor (>${niVal})`}></div>
                    </div>

                    {/* Marker */}
                    <div
                        className="absolute top-0 bottom-0 w-1 bg-black dark:bg-white z-10 shadow-[0_0_8px_rgba(0,0,0,0.5)] transform -translate-x-1/2 pointer-events-none"
                        style={{ left: `${currentPercent}%` }}
                    >
                        <div className={`absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-2 h-2 rotate-45 border border-white dark:border-gray-900 ${passed ? "bg-emerald-500" : warning ? "bg-amber-500" : "bg-rose-500"}`}></div>
                        <div className={`absolute bottom-full mb-1 left-1/2 transform -translate-x-1/2 text-[10px] font-bold px-1 py-0.5 rounded bg-white shadow-sm border border-gray-200 whitespace-nowrap z-20 ${passed ? "text-emerald-600" : warning ? "text-amber-600" : "text-rose-600"}`}>
                            {data.meta.value}
                        </div>
                    </div>
                </div>
            </div>

            {/* Labels */}
            <div className="flex text-[10px] mt-1.5 font-medium opacity-70">
                <div style={{ width: `${goodWidth}%` }} className="flex flex-col items-center">
                    <span className="text-emerald-600 dark:text-emerald-400">Good</span>
                    <span className="text-[9px] opacity-70">
                        {thresholdsSource.Good}
                    </span>
                </div>
                <div style={{ width: `${niWidth}%` }} className="flex flex-col items-center">
                    <span className="text-amber-600 dark:text-amber-400 text-center">Warning</span>
                    <span className="text-[9px] opacity-70">
                        {thresholdsSource.Warning}
                    </span>
                </div>
                <div style={{ width: `${poorWidth}%` }} className="flex flex-col items-center">
                    <span className="text-rose-600 dark:text-rose-400">Poor</span>
                    <span className="text-[9px] opacity-70">
                        {thresholdsSource.Poor}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ThresholdBar;
