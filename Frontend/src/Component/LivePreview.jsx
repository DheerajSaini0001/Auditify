import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { Monitor, Smartphone, ScanLine, Laptop, Wifi } from "lucide-react";
import { API_URL } from "../config";

const LivePreview = ({ data, showInFullAudit = true, variant = "card" }) => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === "dark";

    // Use data.screenshot (base64) OR data.screenshotUrl OR saved url
    let screenshotSrc = null;
    if (data?.screenshot) {
        if (data.screenshot.startsWith("http://") || data.screenshot.startsWith("https://") || data.screenshot.startsWith("data:")) {
            screenshotSrc = data.screenshot;
        } else {
            screenshotSrc = `data:image/jpeg;base64,${data.screenshot}`;
        }
    } else if (data?.screenshotUrl) {
        screenshotSrc = data.screenshotUrl.startsWith("http") ? data.screenshotUrl : `${API_URL}${data.screenshotUrl}`;
    }

    // Logic to hide if in Full Audit mode and explicitly told to hide
    const isFullAudit = data?.report === "All";
    if (isFullAudit && !showInFullAudit) return null;

    // Show if we have a screenshot OR if the audit is in progress (waiting for screenshot)
    // REMOVED: if (!screenshotSrc && data?.status !== "inprogress") return null;
    // We now always render the placeholder if no screenshot is present.

    const isMobile = data?.device === "Mobile";
    // A finished audit (completed/failed) must stop showing the perpetual "Rendering" state.
    const isFinished = data?.status === "completed" || data?.status === "failed";
    const isScanning = !isFinished && (data?.status === "inprogress" || !screenshotSrc);
    const statusText = isFinished
        ? (screenshotSrc ? "Live Preview Ready" : "Preview Unavailable")
        : "Running Visual Scan...";

    // Variant "card" now implies the inner styling, but we remove the outer border/shadow 
    // because the parent Dashboard container already handles the main "box".
    // We just want a clean layout inside.
    const containerClasses = "w-full h-full flex flex-col justify-between";

    return (
        <div className={containerClasses}>

            {/* Header Section matching the reference */}
            <div className="flex items-center justify-between gap-4 mb-4 px-2">
                <div className="flex items-center gap-4">
                    {/* Icon Box */}
                    <div className={`p-3 rounded-2xl shadow-sm border ${darkMode ? "bg-slate-800 border-slate-700 text-indigo-400" : "bg-white border-slate-100 text-indigo-600"}`}>
                        {isMobile ? <Smartphone className="w-6 h-6" strokeWidth={2} /> : <Monitor className="w-6 h-6" strokeWidth={2} />}
                    </div>

                    {/* Text Info */}
                    <div>
                        <h3 className={`text-xs fontsemibold uppercase tracking-widest mb-1 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                            {isMobile ? "Mobile Viewport" : "Desktop Viewport"}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></span>
                            <span className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                {statusText}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Relocated Pill Style Badge (Above the SS, Right Aligned) */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm ${darkMode ? "bg-slate-800/40 border-slate-700 text-slate-400" : "bg-white/80 border-slate-200 text-slate-600 shadow-sm"}`}>
                    <div className="flex items-center gap-2">
                        {isMobile ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                    </div>
                    <div className={`w-px h-3 ${darkMode ? "bg-slate-700" : "bg-slate-300"}`}></div>
                    <span className="text-[10px] font-mono font-medium opacity-80">{isMobile ? "393 x 852" : "1920 x 1080"}</span>
                </div>
            </div>


            {/* Main Viewport Window */}
            <div className="flex-1 flex items-center justify-center w-full relative">
                <div className={`
                    relative overflow-hidden transition-all duration-500 shadow-xl rounded-xl
                    ${isMobile
                        ? "w-[220px] aspect-[393/852] border-4"
                        : "w-full max-w-[480px] aspect-[16/9] border-2"
                    }
                    ${darkMode
                        ? "bg-slate-900 border-slate-700"
                        : "bg-white border-slate-100" // White bg for the window itself
                    }
                `}>
                    {/* Inner Content - Forced Light Background for Canvas */}
                    <div className="w-full h-full overflow-hidden relative bg-slate-50">
                        {/* Scanning Overlay - Global (Visible over screenshot too if scanning) */}
                        {(isScanning && screenshotSrc) && (
                            <div className="absolute inset-0 z-30 pointer-events-none">
                                {/* Green Tint */}
                                <div className="absolute inset-0 bg-emerald-500/5"></div>
                                {/* Grid Overlay */}
                                <div className="w-full h-full bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>

                                {/* Scanning Line */}
                                <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-transparent via-emerald-500 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-[scan-x_2s_linear_infinite]"></div>
                            </div>
                        )}

                        {screenshotSrc ? (
                            <div className="w-full h-full overflow-y-auto scrollbar-hide bg-white">
                                <img
                                    src={screenshotSrc}
                                    alt="Audit Preview"
                                    title="Audit Preview"
                                    className="w-full min-h-full object-top object-cover"
                                />
                            </div>
                        ) : (
                            /* Reverted to Clean Centered State (Green Theme) */
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 overflow-hidden">

                                {/* Scanning Overlay - only while still scanning (not on a finished audit) */}
                                {!isFinished && (
                                    <div className="absolute inset-0 z-0 pointer-events-none">
                                        {/* Green Tint */}
                                        <div className="absolute inset-0 bg-emerald-500/5"></div>
                                        {/* Grid Overlay */}
                                        <div className="w-full h-full bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>

                                        {/* Scanning Line */}
                                        <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-transparent via-emerald-500 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-[scan-x_2s_linear_infinite]"></div>
                                    </div>
                                )}

                                <div className="relative z-10 mb-3">
                                    {!isFinished && <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse"></div>}
                                    <div className={`relative p-3 rounded-full border shadow-sm ${isFinished
                                        ? (darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-white border-slate-200 text-slate-400")
                                        : (darkMode ? "bg-slate-800 border-slate-700 text-emerald-400" : "bg-white border-emerald-100 text-emerald-600")}`}>
                                        <ScanLine className={`w-6 h-6 ${isFinished ? "" : "animate-pulse"}`} strokeWidth={1.5} />
                                    </div>
                                </div>
                                <div className="space-y-0.5 relative z-10">
                                    <h3 className={`text-xs fontsemibold uppercase tracking-wider ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                                        {isFinished ? "Preview Unavailable" : "Rendering"}
                                    </h3>
                                    <p className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                                        {isFinished ? "Screenshot could not be captured" : "Capturing visuals..."}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>


        </div>
    );
};

export default LivePreview;
