import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { NotebookPen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import CircularProgress from "./CircularProgress";
import { useData } from "../context/DataContext";

// ✅ Custom shimmer component
const ShimmerBlock = ({ className = "" }) => (
  <div
    className={`bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 animate-shimmer bg-[length:400%_100%] rounded-md ${className}`}
  ></div>
);

// ✅ Shimmer keyframes (inline style)
const shimmerStyle = `
@keyframes shimmer {
  0% { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
.animate-shimmer {
  animation: shimmer 1.6s infinite linear;
}
`;

export default function Dashboard2({ darkMode }) {
  const { data, loading, clearData } = useData();
  const navigate = useNavigate();

  const sectionMappings = [
    { key: "Technical_Performance", name: "Technical Performance", link: "technical-performance" },
    { key: "On_Page_SEO", name: "On-Page SEO", link: "on-page-seo" },
    { key: "Accessibility", name: "Accessibility", link: "accessibility" },
    { key: "Security_or_Compliance", name: "Security/Compliance", link: "security-compliance" },
    { key: "UX_or_Content_Structure", name: "UX & Content", link: "ux-content-structure" },
    { key: "Conversion_and_Lead_Flow", name: "Conversion & Lead Flow", link: "conversion-lead-flow" },
    { key: "AIO_Readiness", name: "AIO Readiness", link: "aio" },
  ];

  const barData = sectionMappings.map((section) => ({
    name: section.name,
    value: data?.[section.key]?.Percentage || 0,
    Link: section.link,
  }));

  const COLORS = [
    "#3B82F6",
    "#34D399",
    "#FBBF24",
    "#F87171",
    "#A78BFA",
    "#22D3EE",
    "#E879F9",
  ];

  const cardBg = darkMode ? "bg-zinc-900 text-white" : "bg-white text-black";
  const cardBorder = darkMode ? "border-gray-700" : "border-gray-300";
  const sectionText = darkMode ? "text-gray-400" : "text-gray-600";
  const btnBg = darkMode
    ? "bg-green-500 hover:bg-green-600 text-white"
    : "bg-green-400 hover:bg-green-500 text-black";

  const handleCheckOther = () => {
    clearData();
    navigate("/", { replace: true });
    setTimeout(() => {
      window.history.pushState(null, "", window.location.href);
    }, 100);
  };

  // ✅ Shimmer (Loading State)
  if (loading || !data?.Section_Score) {
    return (
      <div
        className={`min-h-screen w-full p-4 sm:p-6 flex flex-col gap-6 overflow-x-hidden ${
          darkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
        }`}
      >
        <style>{shimmerStyle}</style>

        {/* 🔹 URL & Button */}
        <div
          className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-lg ${
            darkMode ? "bg-zinc-900" : "bg-gray-300"
          }`}
        >
          <div className="w-full sm:flex-1 min-w-0">
            <p className={`sm:text-xl lg:text-3xl truncate ${darkMode ? "text-white" : "text-black"}`}>
              URL - <span className="text-blue-400">{data?.Site || "Loading..."}</span>
            </p>
          </div>

          {/* ✅ Clickable even in shimmer */}
          <button
            onClick={handleCheckOther}
            className={`font-semibold shrink-0 flex gap-2 justify-center items-center px-4 py-2 rounded-xl shadow-md transition w-full sm:w-auto ${btnBg}`}
          >
            <NotebookPen size={20} /> Check for Other
          </button>
        </div>

        {/* 🔹 Overall score shimmer */}
        <div className="rounded-2xl shadow-xl p-6 flex flex-col lg:flex-row items-center gap-6 lg:gap-16 bg-gradient-to-r from-gray-200 to-gray-300">
          <ShimmerBlock className="h-28 w-28 rounded-full shrink-0" />
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <ShimmerBlock className="h-5 w-full" />
            <ShimmerBlock className="h-8 w-2/3" />
            <ShimmerBlock className="h-4 w-full" />
          </div>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <ShimmerBlock className="h-8 w-2/3 rounded-md" />
            <ShimmerBlock className="h-5 w-full" />
            <ShimmerBlock className="h-5 w-3/4" />
          </div>
        </div>

        {/* 🔹 Section Cards shimmer */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`rounded-xl p-4 shadow-lg border ${cardBorder} ${cardBg}`}
            >
              <ShimmerBlock className="h-4 w-3/4 mb-3" />
              <ShimmerBlock className="h-6 w-1/3" />
            </div>
          ))}
        </div>

        {/* 🔹 Bar chart shimmer */}
        <div className={`rounded-xl p-4 shadow-lg border ${cardBorder} ${cardBg}`}>
          <ShimmerBlock className="h-5 w-32 mb-4" />
          <ShimmerBlock className="h-64 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // ✅ Normal Dashboard (After Load)
  return (
    <div
      id="dashboard"
      className={`min-h-screen w-full p-4 sm:p-6 flex flex-col gap-6 overflow-x-hidden ${
        darkMode ? "text-white bg-gray-800" : "text-black bg-gray-100"
      }`}
    >
      {/* ✅ URL + Button */}
      <div
        className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4 rounded-lg ${
          darkMode ? "bg-zinc-900" : "bg-gray-300"
        }`}
      >
        <div className="w-full sm:flex-1 min-w-0">
          <p className={`${darkMode ? "text-white" : "text-black"} sm:text-xl lg:text-3xl break-all sm:break-words`}>
            URL -{" "}
            <Link
              replace
              to={`${data.Site}`}
              target="_blank"
              className="text-blue-400 hover:underline"
            >
              {data.Site}
            </Link>
          </p>
        </div>

        <button
          onClick={handleCheckOther}
          className={`font-semibold shrink-0 flex gap-2 justify-center items-center px-4 py-2 rounded-xl shadow-md transition w-full sm:w-auto ${btnBg}`}
        >
          <NotebookPen size={20} /> Check for Other
        </button>
      </div>

      {/* ✅ Overall Score */}
      <div className="bg-gradient-to-r from-indigo-200 via-blue-400 to-indigo-200 rounded-2xl shadow-xl p-6 text-center flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-20">
        {data?.Score && (
          <div className="shrink-0">
            <CircularProgress value={data.Score.toFixed(0)} size={120} stroke={10} />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl sm:text-2xl font-bold">Overall Score</h2>
          <p className="text-4xl sm:text-5xl font-extrabold mt-2">
            {data?.Score ?? "-"} /100
          </p>
          <p className="text-gray-200 text-sm sm:text-base mt-1">
            Website Health Index
          </p>
        </div>
        <div className="flex flex-col gap-1 w-full lg:w-auto">
          <h1
            className={`text-xl sm:text-2xl lg:text-3xl font-bold py-2 px-4 rounded-4xl ${
              ["A", "B"].includes(data?.Grade ?? "-")
                ? "bg-green-400"
                : ["C", "D"].includes(data?.Grade ?? "-")
                ? "bg-orange-400"
                : ["E", "F"].includes(data?.Grade ?? "-")
                ? "bg-red-400"
                : "bg-gray-300"
            }`}
          >
            Grade - {data?.Grade ?? "-"}
          </h1>
          <p className="text-lg sm:text-xl mt-1 font-semibold break-words">
            AIO Compatibility - {data?.AIO_Compatibility_Badge ?? "-"}
          </p>
          <p className="text-lg sm:text-xl mt-1 font-semibold">
            Device - {data.Device}
          </p>
          <p className="text-lg sm:text-xl mt-1 font-semibold">
            Time Taken - {data.Time_Taken}
          </p>
        </div>
      </div>

      {/* ✅ Section Score Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {barData.map((item, index) => (
          <button
            key={item.name}
            onClick={() => navigate(`/${item.Link}`)}
            className={`rounded-xl p-4 shadow-lg border ${cardBorder} text-center ${cardBg} hover:opacity-80 transition flex flex-col justify-between min-h-[120px]`}
          >
            <h3 className={`text-xs sm:text-sm font-medium ${sectionText} line-clamp-2`}>{item.name}</h3>
            <p
              className="text-lg sm:text-xl lg:text-2xl font-bold mt-2"
              style={{ color: COLORS[index % COLORS.length] }}
            >
              {item.value}%
            </p>
          </button>
        ))}
      </div>

      {/* ✅ Bar Chart */}
      <div className={`rounded-xl p-4 shadow-lg border ${cardBorder} ${cardBg} overflow-hidden`}>
        <h3 className="text-base sm:text-lg font-semibold mb-4">Bar Graph</h3>
        <div className="w-full h-64 sm:h-72 lg:h-96 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 10 }} 
                interval={0}
                // Logic intact, but hiding labels on tiny screens via CSS if needed handled by tick formatter or props
              />
              <YAxis width={30} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}