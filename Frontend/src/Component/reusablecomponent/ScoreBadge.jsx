import React from 'react';

const ScoreBadge = ({ status, value, darkMode, className = "" }) => {
    const getBadgeColor = () => {
        // Handle both "good"/"pass" for success
        if (status === "good" || status === "pass") {
            return darkMode
                ? "bg-emerald-900/20 text-emerald-400 border border-emerald-800/30"
                : "bg-emerald-50 text-emerald-600 border border-emerald-100";
        }
        // Handle "needs_improvement"
        else if (status === "needs_improvement" || status === "average") {
            return darkMode
                ? "bg-amber-900/20 text-amber-400 border border-amber-800/30"
                : "bg-amber-50 text-amber-600 border border-amber-100";
        }
        // Default to poor/fail
        else {
            return darkMode
                ? "bg-rose-900/20 text-rose-400 border border-rose-800/30"
                : "bg-rose-50 text-rose-600 border border-rose-100";
        }
    };

    return (
        <span className={`text-xs font-black px-3 py-1 rounded-lg ${getBadgeColor()} ${className}`}>
            {value}
        </span>
    );
};

export default ScoreBadge;
