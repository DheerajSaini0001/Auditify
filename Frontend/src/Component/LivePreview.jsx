import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { Monitor, Smartphone, ScanLine, Laptop, Wifi } from "lucide-react";

const LivePreview = ({ data, showInFullAudit = true, variant = "card" }) => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === "dark";

    // Use strictly data.Screenshot (base64) as per user instruction
    const screenshotSrc = data?.screenshot ? `data:image/jpeg;base64,${data.screenshot}` : null;

    // Logic to hide if in Full Audit mode and explicitly told to hide
    const isFullAudit = data?.report === "All";
    if (isFullAudit && !showInFullAudit) return null;

    // Show if we have a screenshot OR if the audit is in progress (waiting for screenshot)
    // REMOVED: if (!screenshotSrc && data?.status !== "inprogress") return null;
    // We now always render the placeholder if no screenshot is present.

    const isMobile = data.device === "Mobile";
    const statusText = data?.status === "inprogress" ? "Running Visual Scan..." : "Live Preview Ready";
    const isScanning = data?.status === "inprogress";

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
                        <h3 className={`text-xs font-bold uppercase tracking-widest mb-1 ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
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
                    <span className="text-[10px] font-mono font-medium opacity-80">{isMobile ? "375 x 812" : "1280 x 800"}</span>
                </div>
            </div>


            {/* Main Viewport Window */}
            <div className="flex-1 flex items-center justify-center w-full relative">
                <div className={`
                    relative overflow-hidden transition-all duration-500 shadow-xl
                    ${isMobile
                        ? "w-[220px] aspect-[9/19] rounded-[2rem] border-4"
                        : "w-full aspect-[16/10] rounded-xl border"
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
                                    className="w-full min-h-full object-top object-cover"
                                />
                            </div>
                        ) : (
                            /* Reverted to Clean Centered State (Green Theme) */
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 overflow-hidden">

                                {/* Scanning Overlay - Inside Placeholder */}
                                    <div className="absolute inset-0 z-0 pointer-events-none">
                                        {/* Green Tint */}
                                        <div className="absolute inset-0 bg-emerald-500/5"></div>
                                        {/* Grid Overlay */}
                                        <div className="w-full h-full bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>

                                        {/* Scanning Line */}
                                        <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-transparent via-emerald-500 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-[scan-x_2s_linear_infinite]"></div>
                                    </div>

                                <div className="relative z-10 mb-3">
                                    <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse"></div>
                                    <div className={`relative p-3 rounded-full border shadow-sm ${darkMode ? "bg-slate-800 border-slate-700 text-emerald-400" : "bg-white border-emerald-100 text-emerald-600"}`}>
                                        <ScanLine className="w-6 h-6 animate-pulse" strokeWidth={1.5} />
                                    </div>
                                </div>
                                <div className="space-y-0.5 relative z-10">
                                    <h3 className={`text-xs font-bold uppercase tracking-wider ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                                        Rendering
                                    </h3>
                                    <p className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                                        Capturing visuals...
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
