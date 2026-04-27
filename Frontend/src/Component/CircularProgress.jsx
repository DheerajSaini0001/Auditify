import React from "react";

export default function CircularProgress({ value = 65, size = 120, stroke = 10 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  // Determine color based on score
  let colorClass = "text-red-500";
  let shadowClass = "drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]"; // Red glow

  if (value >= 90) {
    colorClass = "text-green-500";
    shadowClass = "drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]"; // Green glow
  } else if (value >= 50) {
    colorClass = "text-yellow-500";
    shadowClass = "drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]"; // Yellow glow
  }

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track circle (Background Ring) */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          className="text-gray-200 dark:text-gray-700 opacity-50"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />

        {/* Progress circle (Foreground Ring) */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`transition-all duration-1000 ease-out ${colorClass} ${shadowClass}`}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
    </div>
  );
}