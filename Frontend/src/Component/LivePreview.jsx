import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { Monitor, Smartphone, ScanLine, Laptop, Wifi } from "lucide-react";

const LivePreview = ({ data, showInFullAudit = true }) => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === "dark";

    // Use strictly data.Screenshot (base64) as per user instruction
    const screenshotSrc = data?.screenshot ? `data:image/jpeg;base64,${data.screenshot}` : null;

    // Logic to hide if in Full Audit mode and explicitly told to hide
    const isFullAudit = data?.report === "All";
    if (isFullAudit && !showInFullAudit) return null;

    // Show if we have a screenshot OR if the audit is in progress (waiting for screenshot)
    if (!screenshotSrc && data?.status !== "inprogress") return null;

    const isMobile = data.device === "Mobile";
    const statusText = data?.status === "inprogress" ? "Running Visual Scan..." : "Live Preview Ready";
    const isScanning = data?.status === "inprogress";

    return (
        <div className={`w-full relative group overflow-hidden rounded-3xl transition-all duration-500 hover:shadow-2xl border ${darkMode
            ? "bg-gradient-to-br from-gray-900 via-[#0B1120] to-gray-900 border-gray-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)]"
            : "bg-white border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
            }`}>

            {/* Background Texture/Glow (Subtle) */}
            <div className={`absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none ${darkMode ? "opacity-30" : "opacity-50"}`}></div>

            {/* Header / Status Bar */}
            <div className="relative px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between z-10">
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Device Icon Badge */}
                    <div className={`relative p-2 sm:p-2.5 rounded-2xl shadow-sm transition-transform group-hover:scale-105 duration-300 ${darkMode
                        ? "bg-gray-800/80 ring-1 ring-white/10 text-indigo-400"
                        : "bg-white ring-1 ring-gray-200 text-indigo-600"
                        }`}>
                        {isMobile ? <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} /> : <Laptop className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />}
                        {isScanning && (
                            <span className="absolute top-0 right-0 -mt-0.5 -mr-0.5 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                            </span>
                        )}
                    </div>

                    {/* Title & Status */}
                    <div className="space-y-0.5">
                        <h2 className={`text-xs sm:text-sm font-bold uppercase tracking-wide ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                            {isMobile ? "Mobile Viewport" : "Desktop Viewport"}
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className={`inline-block w-1.5 h-1.5 rounded-full ${isScanning ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />
                            <span className={`text-[10px] sm:text-xs font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                                {statusText}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Viewport Container */}
            <div className={`relative w-full flex justify-center items-center p-4 sm:p-6 pt-0 transition-opacity duration-500 ${isScanning ? "opacity-90" : "opacity-100"}`}>

                {/* Simple Output Container (Scrollable Window) */}
                <div className={`
                    relative transition-all duration-500 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent
                    ${isMobile ? "w-full max-w-[180px] rounded-2xl shadow-lg ring-4" : "w-full max-w-[500px] rounded-xl shadow-md ring-1"}
                    ${darkMode
                        ? (isMobile ? "bg-gray-900 ring-gray-800 scrollbar-thumb-gray-600" : "bg-gray-900 ring-white/10 scrollbar-thumb-gray-600")
                        : (isMobile ? "bg-white ring-gray-100" : "bg-gray-50 ring-black/5")
                    }
                `}
                    style={{ aspectRatio: isMobile ? '9/19' : '16/10' }} // Enforce viewport window shape
                >
                    <div className="relative w-full min-h-full">
                        {/* Scanning Scanline Effect - Now GREEN */}
                        {isScanning && (
                            <div className="absolute inset-0 z-30 pointer-events-none">
                                <div className="w-full h-full bg-emerald-500/10 absolute top-0 left-0"></div>
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(16,185,129,0.8)] animate-[scan-x_2s_linear_infinite]"></div>
                                {/* Grid Overlay */}
                                <div className="w-full h-full bg-[linear-gradient(rgba(0,0,0,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>
                            </div>
                        )}

                        {screenshotSrc ? (
                            <img
                                src={screenshotSrc}
                                alt="Audit Preview"
                                className={`w-full h-auto object-top block`}
                            />
                        ) : (
                            /* Loading Placeholder State */
                            <div className={`absolute inset-0 flex flex-col items-center justify-center text-center space-y-3 py-16 px-4 ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                                <div className="relative">
                                    <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse"></div>
                                    <div className={`relative p-3 rounded-xl border ${darkMode ? "bg-gray-900 border-gray-700 text-emerald-400" : "bg-white border-gray-200 text-emerald-600"}`}>
                                        <ScanLine className="w-6 h-6 animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                        Rendering
                                    </h3>
                                    <p className={`text-[10px] ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                        Capturing visuals...
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer / Info Bar */}
            <div className={`px-4 sm:px-6 py-3 text-[10px] font-medium border-t flex justify-between items-center opacity-80 ${darkMode ? "border-gray-800 bg-gray-900/30 text-gray-500" : "border-gray-100 bg-gray-50 text-gray-400"}`}>
                <span>Mode: {isMobile ? "Portrait" : "Landscape"}</span>
                <span className="font-mono opacity-70">{isMobile ? "375x812" : "1280x800"}</span>
            </div>

        </div>
    );
};

export default LivePreview;
