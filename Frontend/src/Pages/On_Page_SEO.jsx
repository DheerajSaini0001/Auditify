import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext"; // ✅ Use ThemeContext
import { Check, X ,Loader2} from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";

export default function On_Page_SEO() {
  const { data, loading } = useData();
  const { theme } = useContext(ThemeContext); // ✅ Access theme
  const darkMode = theme === "dark"; // ✅ Determine mode

  if (!data) return <div />;

  const seo = data.On_Page_SEO;

  // ✅ Score Badge Component
  const ScoreBadge = ({ score, out, des }) => {
    const cssscore = score ? "bg-green-300" : "bg-red-300";
    const hasValue = score ? <Check size={18} /> : <X size={18} />;

    return (
      <span
        className={`px-2.5 flex py-1 mobilebutton rounded-full text-black font-semibold text-sm shadow-md transform transition-transform ${cssscore}`}
      >
        {hasValue} {out} {des}
      </span>
    );
  };

  // ✅ Theme-based background/text colors
  const containerBg = darkMode
    ? "bg-zinc-900 border-gray-700 text-white"
    : "bg-gray-100 border-gray-300 text-black";

  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  const textColor = darkMode ? "text-white" : "text-black";

  return (
    <>
 {seo ?  
    <div
      id="OnPageSEO"
      className={`min-h-fit pt-20 pb-16 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 m-4 flex flex-col items-center justify-start p-6 space-y-6 ${containerBg}`}
    >
      {/* --- Header --- */}
      <h1
        className={`responsive flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6 ${textColor}`}
      >
        On-Page SEO
        <CircularProgress value={seo.Percentage} size={70} stroke={5} />
      </h1>

      {/* --- Essentials Section --- */}
      <div
        className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
      >
        <h2 className="text-xl font-bold mb-4">Essentials</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="flex justify-between items-center">
            <span>Title</span>
            {seo.Title.Title_Exist ? (
              <ScoreBadge
                score={seo.Title.Score}
                out={seo.Title.Title_Length}
                des={"characters"}
              />
            ) : (
              "No Title Found"
            )}
          </div>

          <div className="flex justify-between items-center">
            <span>Meta Description</span>
            <ScoreBadge
              score={seo.Meta_Description.Score}
              out={seo.Meta_Description.MetaDescription_Length}
              des={"characters"}
            />
          </div>

          <div className="flex justify-between items-center">
            <span>URL Structure</span>
            <ScoreBadge
              score={seo.URL_Structure.Score}
              des={seo.URL_Structure.Score ? "Good" : "Bad"}
            />
          </div>

          <div className="flex justify-between items-center">
            <span>Canonical Tag Existence</span>
            <ScoreBadge
              score={seo.Canonical.Canonical_Exist}
              des={seo.Canonical.Canonical_Exist ? "Exist" : "Not Exist"}
            />
          </div>

          <div className="flex justify-between items-center">
            <span>Self Referencing</span>
            <ScoreBadge
              score={seo.Canonical.Score}
              des={seo.Canonical.Score ? "Yes" : "No"}
            />
          </div>

          <div className="flex justify-between items-center">
            <span>Pagination</span>
            <ScoreBadge
              score={seo.Pagination_Tags.Score}
              des={
                seo.Pagination_Tags.Score
                  ? "Good"
                  : "Bad"
              }
            />
          </div>

          <div className="flex justify-between items-center">
            <span>Descriptive Internal Links</span>
            <ScoreBadge
              score={seo.Internal_Links.Descriptive_Score}
              des={
                seo.Internal_Links.Descriptive_Score
                  ? "Good"
                  : "Bad"
              }
            />
          </div>

          <div className="flex justify-between items-center">
            <span>ALT Text Relevance</span>
            <ScoreBadge
              score={seo.ALT_Text_Relevance.Score}
              des={
                seo.ALT_Text_Relevance.Score
                  ? "Good ALT Text"
                  : "Bad ALT Text"
              }
            />
          </div>

          <div className="flex justify-between items-center">
            <span>HTTPS</span>
            <ScoreBadge
              score={seo.HTTPS.Score}
              des={
                seo.HTTPS.Score
                  ? "Found https"
                  : "No https"
              }
            />
          </div>
        </div>
      </div>

      {/* --- Audit Results --- */}
      <AuditDropdown
        items={seo.Passed}
        title="Passed Audits"
        darkMode={darkMode}
      />
      <AuditDropdown
        items={seo.Warning}
        title="Warnings"
        darkMode={darkMode}
      />
      <AuditDropdown
        items={seo.Improvements}
        title="Failed Audits"
        darkMode={darkMode}
      />
    </div>
     : <Loader2 size={20} className="animate-spin w-5 h-5" />}
        </>
  );
}
