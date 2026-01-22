import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

const SkeletonLoader = ({ className, count = 1 }) => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === "dark";

    return (
        <div className="w-full space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className={`
            animate-pulse rounded-lg 
            ${darkMode ? "bg-slate-800" : "bg-slate-200"} 
            ${className}
          `}
                />
            ))}
        </div>
    );
};

export default SkeletonLoader;
