import React from "react";
import { Code2, ArrowRight } from "lucide-react";

// Shown when a report section has no parameters for the current audience (e.g. an
// all-technical section like AIO Readiness while in Dealer mode). Instead of hiding
// the section, we keep it and invite the user to switch to Developer mode.
const DeveloperViewNotice = ({ darkMode, sectionName, onSwitch }) => (
    <div className="w-full flex justify-center px-4 mt-10">
        <div
            className={`w-full max-w-2xl flex flex-col items-center text-center rounded-3xl border border-dashed px-8 py-16 ${darkMode ? "bg-slate-900/40 border-slate-700 text-slate-300" : "bg-slate-50 border-slate-300 text-slate-600"
                }`}
        >
            <div className={`p-4 rounded-2xl mb-6 ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                <Code2 className="w-8 h-8" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-slate-900"}`}>
                {sectionName ? `${sectionName} — Developer view` : "Developer parameters"}
            </h3>
            <p className="max-w-md text-sm leading-relaxed mb-7">
                The parameters in this section are technical and intended for developers.
                Switch to <span className="font-semibold">Developer</span> mode to view them.
            </p>
            {onSwitch && (
                <button
                    onClick={onSwitch}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-600/20 transition-all active:scale-[0.98]"
                >
                    Switch to Developer mode <ArrowRight className="w-4 h-4" />
                </button>
            )}
        </div>
    </div>
);

export default DeveloperViewNotice;
