import React from "react";
import { useData } from "../context/DataContext";
// NEW: Added FileText and Smartphone icons
import { NotebookPen, FileText, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

const UrlHeader = ({ darkMode }) => {
  var { data, loading } = useData();
  const site = data.Site;
  const { clearData } = useData();

  // Theme-based styles
  const cardBg = darkMode ? "bg-zinc-900 text-white" : "bg-white text-black";
  const cardBorder = darkMode ? "border-gray-700" : "border-gray-300";
  const sectionText = darkMode ? "text-gray-400" : "text-gray-600";
  // NEW: Added a style for the values
  const valueText = darkMode ? "text-gray-100" : "text-gray-900";
  const btnBg = darkMode
    ? "bg-green-500 hover:bg-green-600 text-white"
    : "bg-green-400 hover:bg-green-500 text-black";
    
  return (
    <>
    <div className={`flex flex-col justify-center items-center ${cardBorder}`}>

    
    <div
      className={`flex flex-col sm:flex-row m-6 gap-14 justify-between items-center p-4 rounded-lg border `}
    >
      {/* Left Section: URL and new details */}
      <div className="flex flex-col gap-3 mb-4 sm:mb-0 text-center sm:text-left w-full sm:w-auto">
        
        {/* URL (existing) */}
        <p
          className={`${sectionText} sm:text-xl lg:text-3xl break-words`}
        >
          URL -{" "}
          <Link
            replace
            to={data || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            {site || "No Site Provided"}
          </Link>
        </p>

        {/* --- NEW: Additional Info Section --- */}
       
        {/* --- End of New Section --- */}

      </div>

      {/* Right Section: Button (existing) */}
      <Link to="/" replace className="w-full sm:w-auto sm:ml-4 flex-shrink-0">
        <button
          onClick={clearData}
          className={`font-semibold flex gap-2 justify-center items-center w-full sm:w-auto px-3 py-2 lg:px-4 lg:py-2 rounded-xl shadow-md transition ${btnBg}`}
        >
          <NotebookPen size={20} /> Check for Other
        </button>
      </Link>
      
    </div>
     <div className="flex flex-col items-center  sm:flex-row sm:gap-6 justify-center sm:justify-start">
          
          {/* Report Type */}
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <FileText size={18} className="text-blue-400" />
            <span className={`${sectionText} text-sm`}>Report:</span>
            <span className={`font-semibold ${valueText} text-base`}>
              {/* NOTE: Assuming 'data.reportType' exists in your context */}
              {data?.Report.toUpperCase() || "N/A"}
            </span>
          </div>

          {/* Device */}
          <div className="flex items-center gap-2 justify-center sm:justify-start mt-2 sm:mt-0">
            <Smartphone size={18} className="text-green-400" />
            <span className={`${sectionText} text-sm`}>Device:</span>
            <span className={`font-semibold ${valueText} text-base`}>
              {/* NOTE: Assuming 'data.device' exists in your context */}
              {data?.Device.toUpperCase() || "N/A"}
            </span>
          </div>
        </div>
        </div>
        </>
  );
};

export default UrlHeader;