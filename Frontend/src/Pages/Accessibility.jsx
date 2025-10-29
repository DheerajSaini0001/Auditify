import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Check, X } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import Sidebar from "../Component/Sidebar";

// ✅ Reusable Badge moved outside component for performance
const ScoreBadge = ({ score, out }) => {
  const badgeClass = score ? "bg-green-300" : "bg-red-300";
  const icon = score ? <Check size={18} /> : <X size={18} />;
  return (
    <span
      className={`px-2.5 flex items-center gap-1.5 py-1 rounded-full text-black font-semibold text-sm shadow-md transform transition-transform mobilebutton ${badgeClass}`}
    >
      {icon} {out}
    </span>
  );
};

export default function Accessibility() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const { data: rawData, loading } = useData();
  const data = rawData;
  const reportType = data?.report;

  // ✅ Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Loading data...
      </div>
    );
  }

  // ✅ --- THIS IS THE FIX ---
  // We now check for !data OR !data.Accessibility
  // This ensures the nested object exists before we try to read from it.
  if (!data || !data.Accessibility) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-500 dark:text-gray-400">
        No data available. Please submit input on Home page.
      </div>
    );
  }
  // ✅ --- END OF FIX ---

  // ✅ Theme-based dynamic styles
  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  const textColor = darkMode ? "text-white" : "text-black";

  // ✅ Added sidebarClass constant
  const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;

  return (
    // ✅ Added Layout structure
    <>
      <div className="relative flex w-full h-full">
        {/* Sidebar */}
        {reportType === "All" && (<div
          className={`${sidebarClass} lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
        >
          
          <Sidebar darkMode={darkMode} />
        </div>)}
        

        {/* Main content */}
        <main
          className={`flex-1  lg:ml-64 flex flex-col justify-center items-center pt-20 pb-0 pr-4 pl-4 lg:pl-0 space-y-8 ${
            darkMode ? " text-gray-100" : " text-gray-800"
          }`}
        >
          {/* Title with Progress */}
          <h1 className="responsive text-heading-25 flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6">
            Accessibility{" "}
            <CircularProgress
              value={data.Accessibility.Percentage}
              size={70}
              stroke={5}
            />
          </h1>

          {/* Accessibility Summary Card */}
          <div
            className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center">
                <span className={textColor}>Color Contrast</span>
                <ScoreBadge
                  score={data.Accessibility.Color_Contrast.Score}
                  out={
                    data.Accessibility.Color_Contrast.Score
                      ? "Good Contrast"
                      : "Contrast Issues"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Focusable Keyboard Nav</span>
                <ScoreBadge
                  score={data.Accessibility.Focus_Order.Score}
                  out={
                    data.Accessibility.Focus_Order.Score
                      ? "Keyboard Accessibility Good"
                      : "Keyboard Accessibility Bad"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Focusable Content</span>
                <ScoreBadge
                  score={data.Accessibility.Focusable_Content.Score}
                  out={
                    data.Accessibility.Focusable_Content.Score
                      ? "Good"
                      : "Issues Found"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Tab Index</span>
                <ScoreBadge
                  score={data.Accessibility.Tab_Index.Score}
                  out={data.Accessibility.Tab_Index.Score ? "Good" : "Bad"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Interactive Element Affordance</span>
                <ScoreBadge
                  score={
                    data.Accessibility.Interactive_Element_Affordance.Score
                  }
                  out={
                    data.Accessibility.Interactive_Element_Affordance.Score
                      ? "Well Designed"
                      : "Needs Improvement"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Label</span>
                <ScoreBadge
                  score={data.Accessibility.Label.Score}
                  out={data.Accessibility.Label.Score ? "Found" : "Not Found"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Aria Allowed Attribute</span>
                <ScoreBadge
                  score={data.Accessibility.Aria_Allowed_Attr.Score}
                  out={
                    data.Accessibility.Aria_Allowed_Attr.Score
                      ? "Found"
                      : "Not Found"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Aria Roles</span>
                <ScoreBadge
                  score={data.Accessibility.Aria_Roles.Score}
                  out={
                    data.Accessibility.Aria_Roles.Score ? "Found" : "Not Found"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Aria Hidden Focus</span>
                <ScoreBadge
                  score={data.Accessibility.Aria_Hidden_Focus.Score}
                  out={
                    data.Accessibility.Aria_Hidden_Focus.Score
                      ? "Found"
                      : "Not Found"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Image Alt</span>
                <ScoreBadge
                  score={data.Accessibility.Image_Alt.Score}
                  out={
                    data.Accessibility.Image_Alt.Score ? "Found" : "Not Found"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Skip Links</span>
                <ScoreBadge
                  score={data.Accessibility.Skip_Links.Score}
                  out={
                    data.Accessibility.Skip_Links.Score ? "Found" : "Not Found"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Landmarks</span>
                <ScoreBadge
                  score={data.Accessibility.Landmarks.Score}
                  out={
                    data.Accessibility.Landmarks.Score ? "Found" : "Not Found"
                  }
                />
              </div>
            </div>
          </div>

          {/* ✅ Audit Dropdowns */}
          <AuditDropdown
            items={data.Accessibility.Passed}
            title="Passed Audit"
            darkMode={darkMode}
          />
          <AuditDropdown
            items={data.Accessibility.Warning}
            title="Warnings"
            darkMode={darkMode}
          />
        </main>
      </div>
    </>
  );
}