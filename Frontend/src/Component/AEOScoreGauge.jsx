import React from 'react';

const AEOScoreGauge = ({ score, title, subtitle, color, size = 160, darkMode }) => {
    const radius = size * 0.42;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;

    return (
        <div className="flex flex-col w-full max-w-[160px] mx-auto">
            <div className="relative mx-auto" style={{ width: size, height: size }}>
                <svg className="transform -rotate-90" width={size} height={size}>
                    {/* Background Circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={darkMode ? "#0a0a0a" : "#f1f5f9"}
                        strokeWidth="10"
                        fill="transparent"
                    />
                    {/* Foreground Circle */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        stroke={color}
                        strokeWidth="10"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        fill="transparent"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[2rem] font-black tracking-tighter" style={{ color }}>{score}%</span>
                </div>
            </div>
            <div className={`mt-6 flex flex-col text-[13px] fontsemibold tracking-[0.15em] ml-2 ${darkMode ? "text-slate-400" : "text-gray-700"}`}>
                <span>{title}</span>
                <span>{subtitle}</span>
            </div>
        </div>
    );
};

export default AEOScoreGauge;
