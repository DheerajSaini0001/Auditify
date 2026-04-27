import React from 'react';

const ScoreBadge = ({ status, value, darkMode, className = "" }) => {
    const getBadgeColor = () => {
        // Handle both "good"/"pass" for success
        if (status === "pass") {
            return darkMode
                ? "bg-violet-900/20 text-violet-400 border border-violet-800/30"
                : "bg-violet-50 text-violet-600 border border-violet-100";
        }
        // Handle "needs_improvement"
        else if (status === "warning") {
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
