import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";
import { Monitor, Smartphone, ScanLine, Laptop, Wifi, ShieldAlert } from "lucide-react";

const LivePreview = ({ data, showInFullAudit = true, variant = "card" }) => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === "dark";

    // Use data.screenshot (base64) OR data.screenshotUrl OR saved url
    let screenshotSrc = null;
    if (data?.screenshot) {
        if (data.screenshot.startsWith("http://") || data.screenshot.startsWith("https://") || data.screenshot.startsWith("data:")) {
            screenshotSrc = data.screenshot;
        } else {
            const isPng = data.screenshot.startsWith("iVBORw");
            const mime = isPng ? "image/png" : "image/jpeg";
            screenshotSrc = `data:${mime};base64,${data.screenshot}`;
        }
    } else if (data?.screenshotUrl) {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:2000";
        screenshotSrc = data.screenshotUrl.startsWith("http") ? data.screenshotUrl : `${API_URL}${data.screenshotUrl}`;
    }

    const [imageError, setImageError] = React.useState(false);
    React.useEffect(() => { setImageError(false); }, [screenshotSrc]);

    // Logic to hide if in Full Audit mode and explicitly told to hide
    const isFullAudit = data?.report === "All";
    if (isFullAudit && !showInFullAudit) return null;

    // Show if we have a screenshot OR if the audit is in progress (waiting for screenshot)
    // REMOVED: if (!screenshotSrc && data?.status !== "inprogress") return null;
    // We now always render the placeholder if no screenshot is present.

    const isMobile = data?.device === "Mobile";
    const isCompleted = data?.status === "completed" || data?.status === "success" || (data?.score !== undefined && data?.score !== null);
    const isScanning = !isCompleted && (data?.status === "inprogress" || data?.status === "pending");
    const statusText = isScanning ? "Running Visual Scan..." : "Live Preview Ready";

    // A completed audit with no screenshot on a bot-protected site should say WHY
    // (WAF/bot-wall blocked the capture) instead of looping the "Capturing visuals…"
    // scan state forever — that's what made the blank white box look broken.
    const showBotProtected = isCompleted && !screenshotSrc && !!data?.isBotProtected;

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
                    <div className={`p-3 rounded-2xl shadow-sm border ${darkMode ? "bg-slate-800 border-slate-700 text-indigo-400" : "bg-card border-line text-accent"}`}>
                        {isMobile ? <Smartphone className="w-6 h-6" strokeWidth={2} /> : <Monitor className="w-6 h-6" strokeWidth={2} />}
                    </div>

                    {/* Text Info */}
                    <div>
                        <h3 className={`text-xs font-semibold uppercase tracking-widest mb-1 ${darkMode ? "text-slate-200" : "text-ink"}`}>
                            {isMobile ? "Mobile Viewport" : "Desktop Viewport"}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${isScanning ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></span>
                            <span className={`text-xs font-medium ${darkMode ? "text-slate-400" : "text-muted"}`}>
                                {statusText}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Relocated Pill Style Badge (Above the SS, Right Aligned) */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm ${darkMode ? "bg-slate-800/40 border-slate-700 text-slate-400" : "bg-card/80 border-line text-muted shadow-sm"}`}>
                    <div className="flex items-center gap-2">
                        {isMobile ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                    </div>
                    <div className={`w-px h-3 ${darkMode ? "bg-slate-700" : "bg-line"}`}></div>
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
                        : "bg-card border-line" // White bg for the window itself
                    }
                `}>
                    {/* Inner Content - Theme-Adaptive Background */}
                    <div className={`w-full h-full overflow-hidden relative ${darkMode ? "bg-slate-900" : "bg-slate-50"}`}>
                        {/* Scanning Overlay - Global (Visible over screenshot too if scanning) */}
                        {(isScanning && screenshotSrc && !imageError) && (
                            <div className="absolute inset-0 z-30 pointer-events-none">
                                {/* Green Tint */}
                                <div className="absolute inset-0 bg-emerald-500/5"></div>
                                {/* Grid Overlay */}
                                <div className="w-full h-full bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>

                                {/* Scanning Line */}
                                <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-transparent via-emerald-500 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-[scan-x_2s_linear_infinite]"></div>
                            </div>
                        )}

                        {screenshotSrc && !imageError ? (
                            <div className={`w-full h-full overflow-y-auto scrollbar-hide ${darkMode ? "bg-slate-900" : "bg-slate-50"}`}>
                                <img
                                    src={screenshotSrc}
                                    alt="Audit Preview"
                                    title="Audit Preview"
                                    onError={() => setImageError(true)}
                                    className="w-full min-h-full object-top object-cover"
                                />
                            </div>
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 overflow-hidden">

                                {/* Scanning overlay — only while actually scanning (not on a
                                    completed/bot-protected preview, where it looked "stuck"). */}
                                {isScanning && (
                                    <div className="absolute inset-0 z-0 pointer-events-none">
                                        <div className="absolute inset-0 bg-emerald-500/5"></div>
                                        <div className="w-full h-full bg-[linear-gradient(rgba(16,185,129,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.1)_1px,transparent_1px)] bg-[size:20px_20px] opacity-20"></div>
                                        <div className="absolute top-0 left-0 w-[3px] h-full bg-gradient-to-b from-transparent via-emerald-500 to-transparent shadow-[0_0_20px_rgba(16,185,129,0.6)] animate-[scan-x_2s_linear_infinite]"></div>
                                    </div>
                                )}

                                {showBotProtected ? (
                                    <>
                                        <div className="relative z-10 mb-3">
                                            <div className={`relative p-3 rounded-full border shadow-sm ${darkMode ? "bg-slate-800 border-amber-900/50 text-amber-400" : "bg-amber-50 border-amber-200 text-amber-600"}`}>
                                                <ShieldAlert className="w-6 h-6" strokeWidth={1.5} />
                                            </div>
                                        </div>
                                        <div className="space-y-1 relative z-10 max-w-[240px]">
                                            <h3 className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-amber-300" : "text-amber-700"}`}>
                                                Bot Protected
                                            </h3>
                                            <p className={`text-[10px] leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                                                This site blocks automated tools (WAF / bot protection), so a live preview couldn't be captured.
                                            </p>
                                        </div>
                                    </>
                                ) : isCompleted ? (
                                    <>
                                        <div className="relative z-10 mb-3">
                                            <div className={`relative p-3 rounded-full border shadow-sm ${darkMode ? "bg-slate-800 border-slate-700 text-slate-400" : "bg-card border-slate-200 text-slate-500"}`}>
                                                <ScanLine className="w-6 h-6" strokeWidth={1.5} />
                                            </div>
                                        </div>
                                        <div className="space-y-0.5 relative z-10">
                                            <h3 className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-slate-300" : "text-ink"}`}>
                                                Preview unavailable
                                            </h3>
                                            <p className={`text-[10px] ${darkMode ? "text-slate-500" : "text-faint"}`}>
                                                The page couldn't be captured.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="relative z-10 mb-3">
                                            <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-20 animate-pulse"></div>
                                            <div className={`relative p-3 rounded-full border shadow-sm ${darkMode ? "bg-slate-800 border-slate-700 text-emerald-400" : "bg-card border-emerald-100 text-emerald-600"}`}>
                                                <ScanLine className="w-6 h-6 animate-pulse" strokeWidth={1.5} />
                                            </div>
                                        </div>
                                        <div className="space-y-0.5 relative z-10">
                                            <h3 className={`text-xs font-semibold uppercase tracking-wider ${darkMode ? "text-slate-300" : "text-ink"}`}>
                                                Rendering
                                            </h3>
                                            <p className={`text-[10px] ${darkMode ? "text-slate-500" : "text-faint"}`}>
                                                Capturing visuals...
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>


        </div>
    );
};

export default LivePreview;
