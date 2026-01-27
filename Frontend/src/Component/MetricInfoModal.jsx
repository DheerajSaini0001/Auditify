import React from 'react';
import { Activity, Zap, CheckCircle, XCircle, FileText, ChevronRight } from 'lucide-react';

// ------------------------------------------------------
// ✅ Reusable Section Card (Clean & Minimal)
// ------------------------------------------------------
const SectionCard = ({ title, icon: Icon, colorClass, children, darkMode }) => (
    <div className={`rounded-xl border h-full flex flex-col transition-all shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] hover:shadow-md ${darkMode ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"}`}>
        <div className="px-5 py-4 flex items-center gap-2.5 border-b border-gray-100 dark:border-gray-800">
            <div className={`p-1.5 rounded-md bg-opacity-10 ${darkMode ? "bg-white/5" : "bg-gray-50"}`}>
                <Icon size={16} className={colorClass} strokeWidth={2.5} />
            </div>
            <h4 className={`font-bold text-xs uppercase tracking-widest ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{title}</h4>
        </div>
        <div className="p-5 flex-grow">
            {children}
        </div>
    </div>
);

// ------------------------------------------------------
// ✅ Metric Info Modal (Production Level)
// ------------------------------------------------------
const MetricInfoModal = ({ isOpen, onClose, info, darkMode }) => {
    if (!isOpen || !info) return null;

    const Icon = info.icon || Activity;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" style={{ zIndex: 9999 }}>
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div
                className={`flex flex-col relative w-full max-w-2xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden transform transition-all ${darkMode ? "bg-gray-900 ring-1 ring-gray-800" : "bg-white"} animate-in zoom-in-95 duration-200`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Top Bar */}
                <div className={`h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 flex-shrink-0`} />

                {/* Header - Sticky */}
                <div className={`px-6 md:px-8 pt-6 pb-2 flex items-start justify-between flex-shrink-0 bg-inherit z-10`}>
                    <div className="flex items-center gap-5">
                        <div className={`p-3 rounded-2xl shadow-sm ${darkMode ? "bg-gray-800 text-blue-400" : "bg-white border border-gray-100 text-blue-600"}`}>
                            <Icon size={32} strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                            <h3 className={`text-2xl font-bold tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
                                {info.title}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${darkMode ? "bg-blue-500/10 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                                    Metric Insights
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-all duration-200 ${darkMode ? "hover:bg-gray-800 text-gray-500 hover:text-white" : "hover:bg-gray-50 text-gray-400 hover:text-gray-900"}`}
                    >
                        <XCircle size={28} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Content Body - Scrollable */}
                <div className="px-6 md:px-8 pb-8 pt-4 space-y-6 overflow-y-auto custom-scrollbar">

                    {/* Definition Section */}
                    {info.use && (
                        <div className={`p-4 rounded-xl border ${darkMode ? "bg-blue-500/5 border-blue-500/20 text-blue-100" : "bg-blue-50/50 border-blue-100 text-slate-700"}`}>
                            <div className="flex gap-3">
                                <FileText size={20} className={`mt-0.5 flex-shrink-0 ${darkMode ? "text-blue-400" : "text-blue-600"}`} />
                                <p className="text-sm leading-relaxed font-medium">
                                    {info.use}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Impact & Improvement Grid */}
                    {(info.impact || info.improvement) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {info.impact && (
                                <SectionCard
                                    title="Why it Matters"
                                    icon={Zap}
                                    colorClass={darkMode ? "text-amber-400" : "text-amber-500"}
                                    darkMode={darkMode}
                                >
                                    <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                        {info.impact}
                                    </p>
                                </SectionCard>
                            )}

                            {info.improvement && (
                                <SectionCard
                                    title="How to Improve"
                                    icon={CheckCircle}
                                    colorClass={darkMode ? "text-emerald-400" : "text-emerald-600"}
                                    darkMode={darkMode}
                                >
                                    <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                                        {info.improvement}
                                    </p>
                                </SectionCard>
                            )}
                        </div>
                    )}

                    {/* Weightage Section (New) */}
                    {info.weightage && (
                        <SectionCard
                            title="Score Distribution"
                            icon={Activity}
                            colorClass={darkMode ? "text-indigo-400" : "text-indigo-600"}
                            darkMode={darkMode}
                        >
                            {/* List */}
                            <div className="space-y-4">
                                {info.weightage.map((item, i) => {
                                    const percent = parseInt(item.weight.replace('%', '')) || 0;
                                    return (
                                        <div key={i} className="group">
                                            <div className="flex justify-between items-end mb-2">
                                                <span className={`text-sm font-medium transition-colors ${darkMode ? "text-gray-300 group-hover:text-white" : "text-gray-700 group-hover:text-black"}`}>
                                                    {item.param}
                                                </span>
                                                <span className={`text-xs font-bold font-mono ${darkMode ? "text-indigo-300" : "text-indigo-600"}`}>
                                                    {item.weight}
                                                </span>
                                            </div>
                                            {/* Visual Bar */}
                                            <div className={`h-2 w-full rounded-full overflow-hidden ${darkMode ? "bg-gray-800" : "bg-gray-100"}`}>
                                                <div
                                                    className={`h-full rounded-full transition-all duration-700 ease-out shadow-sm ${darkMode ? "bg-gradient-to-r from-blue-600 to-indigo-500" : "bg-gradient-to-r from-blue-500 to-indigo-600"}`}
                                                    style={{ width: `${percent}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </SectionCard>
                    )}
                </div>

                {/* Footer */}
                <div className={`px-6 md:px-8 py-4 flex justify-end gap-3 ${darkMode ? "bg-gray-900 border-t border-gray-800" : "bg-gray-50 border-t border-gray-100"}`}>
                    <button
                        onClick={onClose}
                        className={`px-5 py-2 rounded-lg text-sm font-semibold transition-colors ${darkMode ? "bg-gray-800 text-white hover:bg-gray-700" : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-black hover:border-gray-300"}`}
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
};

export default MetricInfoModal;
