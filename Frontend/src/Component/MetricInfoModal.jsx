import React from 'react';
import { Activity, Zap, CheckCircle, XCircle } from 'lucide-react';

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
                className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Modal Card */}
            <div
                className={`relative w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden transform transition-all ${darkMode ? "bg-gray-900 ring-1 ring-gray-800" : "bg-white"} animate-in zoom-in-95 duration-200`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Top Bar */}
                <div className={`h-1.5 w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500`} />

                {/* Header */}
                <div className="px-6 md:px-8 pt-8 pb-4 flex items-start justify-between">
                    <div className="flex items-center gap-5">
                        <div className={`p-3.5 rounded-xl shadow-inner ${darkMode ? "bg-gray-800 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                            <Icon size={32} strokeWidth={1.5} />
                        </div>
                        <div className="space-y-1">
                            <h3 className={`text-2xl font-bold tracking-tight ${darkMode ? "text-white" : "text-gray-900"}`}>
                                {info.title}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide ${darkMode ? "bg-gray-800 text-gray-400" : "bg-gray-100 text-gray-500"}`}>
                                    Metric Guide
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-all duration-200 ${darkMode ? "hover:bg-gray-800 text-gray-500 hover:text-white" : "hover:bg-gray-100 text-gray-400 hover:text-gray-900"}`}
                    >
                        <XCircle size={28} strokeWidth={1.5} />
                    </button>
                </div>

                {/* Content Body */}
                <div className="px-6 md:px-8 pb-8 space-y-8">

                    {/* Definition Section */}
                    <div className={`p-4 rounded-xl border-l-4 ${darkMode ? "bg-gray-800/50 border-blue-500 text-gray-300" : "bg-blue-50/50 border-blue-500 text-gray-700"}`}>
                        <p className="text-base leading-relaxed font-medium">
                            {info.use}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Impact - Visual Box */}
                        <div className={`flex flex-col p-5 rounded-2xl border transition-colors hover:border-purple-500/50 ${darkMode ? "bg-purple-900/10 border-purple-800/20" : "bg-white border-purple-100 shadow-sm"}`}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className={`p-2 rounded-lg ${darkMode ? "bg-purple-500/20 text-purple-300" : "bg-purple-100 text-purple-600"}`}>
                                    <Zap size={18} />
                                </div>
                                <h4 className={`font-bold text-sm uppercase tracking-wide ${darkMode ? "text-purple-200" : "text-purple-900"}`}>Why it Matters</h4>
                            </div>
                            <p className={`text-sm leading-relaxed flex-grow ${darkMode ? "text-purple-100/80" : "text-gray-600"}`}>
                                {info.impact}
                            </p>
                        </div>

                        {/* Improvement - Visual Box */}
                        <div className={`flex flex-col p-5 rounded-2xl border transition-colors hover:border-emerald-500/50 ${darkMode ? "bg-emerald-900/10 border-emerald-800/20" : "bg-white border-emerald-100 shadow-sm"}`}>
                            <div className="flex items-center gap-2.5 mb-4">
                                <div className={`p-2 rounded-lg ${darkMode ? "bg-emerald-500/20 text-emerald-300" : "bg-emerald-100 text-emerald-600"}`}>
                                    <CheckCircle size={18} />
                                </div>
                                <h4 className={`font-bold text-sm uppercase tracking-wide ${darkMode ? "text-emerald-200" : "text-emerald-900"}`}>How to Improve</h4>
                            </div>
                            <p className={`text-sm leading-relaxed flex-grow ${darkMode ? "text-emerald-100/80" : "text-gray-600"}`}>
                                {info.improvement}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`px-6 md:px-8 py-5 flex justify-end gap-3 ${darkMode ? "bg-gray-800/50 border-t border-gray-800" : "bg-gray-50 border-t border-gray-100"}`}>
                    <button
                        onClick={onClose}
                        className={`px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] ${darkMode ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"}`}
                    >
                        Close
                    </button>
                </div>

            </div>
        </div>
    );
};

export default MetricInfoModal;
