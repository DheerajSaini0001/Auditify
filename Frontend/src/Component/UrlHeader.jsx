import React from "react";
import { useData } from "../context/DataContext";

const UrlHeader = ({darkMode }) => {
  
   var { data, loading } = useData(); 
     const site=data.Metric.Site;

  // Theme-based styles
  const cardBg = darkMode ? "bg-zinc-900 text-white" : "bg-white text-black";
  const cardBorder = darkMode ? "border-gray-700" : "border-gray-300";
  const sectionText = darkMode ? "text-gray-400" : "text-gray-600";
  const btnBg = darkMode
    ? "bg-green-500 hover:bg-green-600 text-white"
    : "bg-green-400 hover:bg-green-500 text-black";
  return (
    <div
      className={`flex flex-col sm:flex-row m-6 justify-between items-center p-4 rounded-lg border ${cardBg} ${cardBorder}`}
    >
      <p
        className={`${sectionText} sm:text-xl lg:text-3xl mb-3 sm:mb-0 text-center sm:text-left`}
      >
        URL -{" "}
        <a
          href={data || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:underline"
        >
          {site|| "No Site Provided"}
        </a>
      </p>

      <a href="/" className="w-full sm:w-auto">
        <button
          className={`font-semibold w-full sm:w-auto px-3 py-2 lg:px-4 lg:py-2 rounded-xl shadow-md transition ${btnBg}`}
        >
          Check for Other
        </button>
      </a>
    </div>
  );
};

export default UrlHeader;
