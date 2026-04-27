import React from 'react';
import {
    X,
    Gauge,
    Star,
    Wrench,
    ClipboardCheck,
    ArrowUpRight,
    Activity
} from 'lucide-react';

const MetricInfoModal = ({ isOpen, onClose, info, darkMode }) => {
    if (!isOpen || !info) return null;

    // Use specific icon from info if available, otherwise default to Activity for the header
    const HeaderIcon = info.icon || Activity;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Main Modal Card */}
            <div className={`relative w-full max-w-4xl rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200 ${darkMode ? "bg-gray-900 border border-gray-800" : "bg-white"}`}>

                {/* Header Section */}
                <div className="p-8 pb-2 flex items-start gap-5 flex-shrink-0">
                    {/* Header Icon Circle */}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 ${darkMode ? "bg-blue-900/20 border border-blue-800/50" : "bg-violet-50 border border-violet-100"}`}>
                        <HeaderIcon className={`w-8 h-8 ${darkMode ? "text-violet-400" : "text-violet-600"}`} strokeWidth={1.5} />
                    </div>

                    {/* Title & Badge */}
                    <div className="flex-1 pt-1.5">
                        <h2 className={`text-2xl font-bold leading-tight mb-2 ${darkMode ? "text-white" : "text-gray-900"}`}>
                            {info.title}
                        </h2>
                        {info.badge && (
                            <span className={`inline-block text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${darkMode ? "bg-violet-500/10 text-violet-300" : "bg-violet-50 text-violet-600"}`}>
                                {info.badge}
                            </span>
                        )}
                    </div>

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-colors ${darkMode ? "text-gray-400 hover:bg-gray-800 hover:text-white" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"}`}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar">

                    {/* 1. What this metric is (info.whatThisMetricIs) */}
                    {info.whatThisMetricIs && (
                        <div className={`p-5 rounded-2xl border transition-colors ${darkMode ? "bg-gray-800/40 border-gray-700 hover:border-gray-600" : "bg-white border-gray-100 hover:border-violet-100 hover:shadow-sm"}`}>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 mt-0.5">
                                    <Gauge className="w-6 h-6 text-violet-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold text-base mb-1.5 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>What this metric is</h3>
                                    <div className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                        {info.whatThisMetricIs}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Why it matters (info.whyItMatters) */}
                    {info.whyItMatters && (
                        <div className={`p-5 rounded-2xl border transition-colors ${darkMode ? "bg-gray-800/40 border-gray-700 hover:border-gray-600" : "bg-white border-gray-100 hover:border-amber-100 hover:shadow-sm"}`}>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 mt-0.5">
                                    <Star className="w-6 h-6 text-amber-500" fill="currentColor" fillOpacity={0.2} />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold text-base mb-1.5 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>Why it matters</h3>
                                    <div className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                        {info.whyItMatters}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 3. What to do for a good score (info.whatToDoForAGoodScore) */}
                    {info.whatToDoForAGoodScore && (
                        <div className={`p-5 rounded-2xl border transition-colors ${darkMode ? "bg-gray-800/40 border-gray-700 hover:border-gray-600" : "bg-white border-gray-100 hover:border-violet-100 hover:shadow-sm"}`}>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 mt-0.5">
                                    <Wrench className="w-6 h-6 text-violet-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold text-base mb-1.5 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>What to do for a good score</h3>
                                    <div className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                        {info.whatToDoForAGoodScore}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. How this score is calculated (info.howThisScoreIsCalculated) */}
                    {(info.howThisScoreIsCalculated || info.weightage) && (
                        <div className={`p-5 rounded-2xl border transition-colors ${darkMode ? "bg-gray-800/40 border-gray-700 hover:border-gray-600" : "bg-white border-gray-100 hover:border-indigo-100 hover:shadow-sm"}`}>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 mt-0.5">
                                    <ClipboardCheck className="w-6 h-6 text-indigo-500" />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-bold text-base mb-1.5 ${darkMode ? "text-gray-100" : "text-gray-900"}`}>How this score is calculated</h3>
                                    {info.howThisScoreIsCalculated && (
                                        <div className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                            {info.howThisScoreIsCalculated}
                                        </div>
                                    )}

                                    {/* Weightage Breakdown */}
                                    {info.weightage && (
                                        <div className={`mt-4 pt-4 border-t border-dashed ${darkMode ? "border-gray-700" : "border-gray-200"}`}>
                                            <h4 className={`text-xs font-bold uppercase tracking-wider mb-3 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                                Weight Distribution
                                            </h4>
                                            <div className="space-y-3">
                                                {info.weightage.map((item, i) => (
                                                    <div key={i}>
                                                        <div className="flex justify-between text-xs mb-1.5">
                                                            <span className={`font-medium ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{item.param}</span>
                                                            <span className={`font-bold font-mono ${darkMode ? "text-indigo-400" : "text-indigo-600"}`}>{item.weight}</span>
                                                        </div>
                                                        <div className={`h-1.5 w-full rounded-full overflow-hidden ${darkMode ? "bg-gray-900" : "bg-gray-100"}`}>
                                                            <div
                                                                className={`h-full rounded-full ${darkMode ? "bg-indigo-500" : "bg-indigo-500"}`}
                                                                style={{ width: item.weight }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 5. Footer Link / Disclaimer */}
                    {info.guideLink && (
                        <div className={`pt-6 mt-4 border-t ${darkMode ? "border-gray-800" : "border-gray-100"}`}>
                            <a
                                href={info.guideLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group cursor-pointer inline-flex items-center gap-2 mb-2"
                            >
                                <span className={`font-bold text-base ${darkMode ? "text-violet-400 group-hover:text-violet-300" : "text-violet-600 group-hover:text-violet-700"}`}>
                                    Read full guide
                                </span>
                                <ArrowUpRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${darkMode ? "text-violet-400" : "text-violet-600"}`} />
                            </a>
                            <p className={`text-xs leading-relaxed ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                                Learn how to improve your website's performance in detail. Opens a detailed guide in a new tab.
                            </p>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default MetricInfoModal;
