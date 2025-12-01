import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import React, { useState } from "react";
import { generatePDF, filterRawData } from "../utils/pdfGenerator";

const ShimmerBlock = ({ className = "" }) => (
  <div
    className={`bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-shimmer bg-[length:400%_100%] rounded-md ${className}`}
  ></div>
);

const shimmerStyle = `
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.animate-shimmer {
  animation: shimmer 1.6s infinite linear;
}
`;

const RawData = ({ data, darkMode }) => {
  const [visibleLines, setVisibleLines] = useState(50);

  // --- Styles ---
  const containerBg = darkMode
    ? "bg-gray-900 border-gray-700"
    : "bg-gray-100 border-gray-300";

  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  if (!data?.Site) {
    return (
      <div
        className={`min-h-fit pt-20 pb-16 rounded-2xl shadow-lg m-4 flex flex-col items-center justify-start p-6 space-y-6 ${containerBg}`}
      >
        <style>{shimmerStyle}</style>
        <ShimmerBlock className="h-8 w-40 mb-6 rounded-md" />
        <div
          className={`w-full    p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
        >
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <ShimmerBlock key={i} className="h-4 w-full rounded-md" />
            ))}
          </div>
        </div>
        <div className="flex gap-4">
          <ShimmerBlock className="h-10 w-40 rounded-lg" />
        </div>
      </div>
    );
  }

  const filteredData = filterRawData(data);
  const jsonString = JSON.stringify(filteredData, null, 2);
  const lines = jsonString.split('\n');
  const totalLines = lines.length;
  const displayedContent = lines.slice(0, visibleLines).join('\n');

  const handleShowMore = () => {
    setVisibleLines((prev) => Math.min(prev + 50, totalLines));
  };

  return (
    <div
      id="Rawdata"
      className={`min-h-fit pt-20 pb-16 rounded-2xl shadow-lg m-4 flex flex-col items-center justify-start p-6 space-y-6 ${containerBg}`}
    >
      <style>{shimmerStyle}</style>

      <div className="flex justify-between items-center w-full mb-6">
        <h1
          className={`text-3xl font-extrabold ${darkMode ? "text-white" : "text-black"
            }`}
        >
          Raw Data
        </h1>
      </div>

      <div
        className={`w-full p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
      >
        <pre
          className={`whitespace-pre-wrap break-words text-sm ${darkMode ? "text-white" : "text-black"
            }`}
        >
          {displayedContent}
        </pre>
        {visibleLines < totalLines && (
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleShowMore}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow transition ${darkMode
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "bg-blue-500 hover:bg-blue-600 text-white"
                }`}
            >
              Show More <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => generatePDF(data)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow transition ${darkMode
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-green-400 hover:bg-green-500 text-black"
            }`}
        >
          <FileText className="w-5 h-5" />
          Download PDF
        </button>
      </div>
    </div>
  );
};

export default RawData;