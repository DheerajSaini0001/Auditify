import React from 'react';

const AEOScoreGauge = ({ score, label, color, size = 120, darkMode }) => {
    const radius = size * 0.4;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center p-4">
            <div className="relative" style={{ width: size, height: size }}>
                <svg className="transform -rotate-90" width={size} height={size}>
                    {/* Background Circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={darkMode ? "#1e293b" : "#e2e8f0"}
                        strokeWidth="8"
                        fill="transparent"
                    />
                    {/* Foreground Circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth="8"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black tracking-tighter" style={{ color }}>{score}%</span>
                </div>
            </div>
            <span className={`mt-2 text-sm font-bold uppercase tracking-widest ${darkMode ? "text-slate-400" : "text-gray-700"}`}>{label}</span>
        </div>
    );
};

export default AEOScoreGauge;
