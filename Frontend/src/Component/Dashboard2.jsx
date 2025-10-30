import React, { useContext } from "react";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { NotebookPen ,Loader2} from "lucide-react";
import { Link } from "react-router-dom"; // ✅ ADD THIS IMPORT
import CircularProgress from "./CircularProgress";
import { useData } from "../context/DataContext";

export default function Dashboard2({ darkMode }) {
  var { data, loading } = useData();
  data = data;

  if (!data) return <div />;

  // ✅ Create barData dynamically
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

  // ✅ Theme handling
  const cardBg = darkMode ? "bg-zinc-900 text-white" : "bg-white text-black";
  const cardBorder = darkMode ? "border-gray-700" : "border-gray-300";
  const sectionText = darkMode ? "text-gray-400" : "text-gray-600";
  const btnBg = darkMode
    ? "bg-green-500 hover:bg-green-600 text-white"
    : "bg-green-400 hover:bg-green-500 text-black";

  return (
    <div
      id="dashboard"
      className={`min-h-screen w-full p-4 sm:p-6 grid grid-cols-1 gap-6 ${
        darkMode ? "text-white bg-gray-800" : "text-black bg-gray-100"
      }`}
    >
      {/* URL + Button */}
      <div
        className={`flex justify-between items-center p-4 rounded-lg ${
          darkMode ? "bg-zinc-900" : "bg-gray-300"
        }`}
      >
        <p
          className={`${
            darkMode ? "text-white" : "text-black"
          } sm:text-xl lg:text-3xl`}
        >
          URL -{" "}
          <a
            href={`${data.Site}`}
            target="_blank"
            className="text-blue-400 hover:underline"
          >
            {data.Site}
          </a>
        </p>
        <a href="/">
          <button
            className={`font-semibold flex gap-2 justify-center items-center px-2 py-2 sm:px-2 md:px-2 lg:px-4 lg:py-2 rounded-xl shadow-md transition ${btnBg}`}
          >
            <NotebookPen size={20} /> Check for Other
          </button>
        </a>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-indigo-200 via-blue-400 to-indigo-200 rounded-2xl shadow-xl p-6 text-center flex flex-col sm:flex-row sm:justify-center sm:items-center sm:gap-20 lg:gap-30">
        <CircularProgress value={data?.Score ? data.Score.toFixed(0) : '-'} size={120} stroke={10} />
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Overall Score</h2>
          <p className="text-4xl sm:text-5xl font-extrabold mt-2">
            {data?.Score ?? '-'}/100
          </p>
          <p className="text-gray-200 text-sm sm:text-base mt-1">
            Website Health Index
          </p>
        </div>
        <div>
          <h1
            className={`text-xl sm:text-2xl lg:text-3xl font-bold rounded-4xl ${
              ["A", "B"].includes(data?.Grade ?? '-')
                ? "bg-green-400"
                : ["C", "D"].includes(data?.Grade  ?? '-')
                ? "bg-orange-400"
                : ["E", "F"].includes(data?.Grade  ?? '-')
                ? "bg-red-400"
                : "bg-gray-300"
            }`}
          >
            Grade - {data?.Grade ?? '-'}
          </h1>
          <p className="text-lg sm:text-xl mt-1 font-semibold">
            AIO Compatibility - {data?.AIO_Compatibility_Badge ?? '-'}
          </p>
          <p className="text-lg sm:text-xl mt-1 font-semibold">
            Device - {data.Device}
          </p>
        </div>
      </div>

      {/* ✅ Section Score Cards (linked correctly) */}
      {data?.Section_Score ?
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {barData.map((item, index) => (
          <Link
            key={item.name}
            to={`/${item.Link}`}
            className={`rounded-xl p-4 shadow-lg border ${cardBorder} text-center ${cardBg} hover:opacity-80 transition`}
          >
            <h3 className={`text-xs sm:text-sm ${sectionText}`}>{item.name}</h3>
            <p
              className="text-lg sm:text-xl lg:text-2xl font-bold"
              style={{ color: COLORS[index % COLORS.length] }}
            >
              {item.value}%
            </p>
          </Link>
        ))}
      </div>
          :     <Loader2 size={20} className="animate-spin w-5 h-5" />}
      {/* Bar Chart */}
      {data?.Section_Score ?
      <div
        className={`rounded-xl p-4 shadow-lg border ${cardBorder} ${cardBg}`}
      >
        <h3 className="text-base sm:text-lg font-semibold mb-4">Bar Graph</h3>
        <div className="w-full h-64 sm:h-72 lg:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
          :     <Loader2 size={20} className="animate-spin w-5 h-5" />}
    </div>
  );
}
