import React from "react";
import { scoreRing } from "../utils/statusColors";

export default function CircularProgress({ value = 65, size = 120, stroke = 10 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  // Colour from the canonical score band (<25 red · 25–74 amber · ≥75 green),
  // so the ring matches every other status colour in the app.
  const { color: colorClass, glow: shadowClass } = scoreRing(value);

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track circle (Background Ring) */}
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          className="text-line dark:text-gray-700 opacity-50"
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