import React from "react";
import { Code2, ArrowRight } from "lucide-react";

// Shown when a report section has no parameters for the current audience (e.g. an
// all-technical section like AIO Readiness while in Dealer mode). Instead of hiding
// the section, we keep it and invite the user to switch to Developer mode.
// Renders its own themed full-area background so it matches the other report sections
// (which provide their own dark/light page background).
const DeveloperViewNotice = ({ darkMode, sectionName, onSwitch }) => (
    <div className={`w-full min-h-[65vh] flex items-start justify-center px-4 py-10 ${darkMode ? "bg-gray-900" : "bg-surface"}`}>
        <div
            className={`w-full max-w-2xl flex flex-col items-center text-center rounded-2xl border px-8 py-10 shadow-sm ${darkMode ? "bg-gray-800 border-gray-700 text-gray-300" : "bg-card border-line text-muted"
                }`}
        >
            <div className={`p-4 rounded-2xl mb-6 ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-accentsoft text-accent"}`}>
                <Code2 className="w-8 h-8" />
            </div>
            <h3 className={`text-xl font-semibold mb-2 ${darkMode ? "text-white" : "text-ink"}`}>
                {sectionName ? `${sectionName} — Developer view` : "Developer parameters"}
            </h3>
            <p className="max-w-md text-sm leading-relaxed mb-7">
                The parameters in this section are technical and intended for developers.
                Switch to <span className="font-semibold">Developer</span> mode to view them.
            </p>
            {onSwitch && (
                <button
                    onClick={onSwitch}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-accent hover:bg-accenthover shadow-md shadow-accent/20 transition-all active:scale-[0.98]"
                >
                    Switch to Developer mode <ArrowRight className="w-4 h-4" />
                </button>
            )}
        </div>
    </div>
);

export default DeveloperViewNotice;
