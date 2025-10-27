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
import { NotebookPen } from "lucide-react";


import CircularProgress from "./CircularProgress";
import { useData } from "../context/DataContext";

export default function Dashboard2({darkMode }) {
  
   var { data, loading } = useData(); 
    data=data.Metric;
  

  if (!data) return <div />;
  const barData = [
    { name: "Technical Performance", value: data.Technical_Performance.Percentage},
    { name: "On-Page SEO", value: data.On_Page_SEO.Percentage },
    { name: "Accessibility", value: data.Accessibility.Percentage },
    { name: "Security/Compliance", value: data.Security_or_Compliance.Percentage },
    { name: "UX & Content", value: data.UX_or_Content_Structure.Percentage },
    { name: "Conversion & Lead Flow", value: data.Conversion_and_Lead_Flow.Percentage },
    { name: "AIO Readiness", value: data.AIO_Readiness.Percentage },
  ];

  const sectionLabels = {
    A: "Technical Performance",
    B: "On Page SEO",
    C: "Accessibility",
    D: "Security/Compliance",
    E: "UX & Content",
    F: "Conversion & Lead Flow",
    G: "AIO Readiness",
  };
  const sectionOutOf = {
    A: 28,
    B: 22,
    C: 12,
    D: 8,
    E: 10,
    F: 10,
    G: 10,
  };

  const { Section_Score, Top_Fixes} = data;

  const COLORS = [
  "#3B82F6", // soft blue
  "#34D399", // soft emerald
  "#FBBF24", // warm amber
  "#F87171", // soft red
  "#A78BFA", // soft violet
  "#22D3EE", // soft cyan
  "#E879F9", // soft fuchsia
  ];

  // ✅ Dynamic theme classes
  const cardBg = darkMode ? "bg-zinc-900 text-white" : "bg-white text-black";
  const cardBorder = darkMode ? "border-gray-700" : "border-gray-300";
  const sectionText = darkMode ? "text-gray-400" : "text-gray-600";
  const btnBg = darkMode ? "bg-green-500 hover:bg-green-600 text-white " : "bg-green-400 hover:bg-green-500 text-black";

  return (
    <div
      id="deshboard"
      className={`min-h-screen w-full p-4 sm:p-6 grid grid-cols-1 gap-6 ${darkMode ? "text-white bg-gray-800 " : "text-black bg-gray-100"}`}
    >
      {/* URL + Button */}
      <div className={`flex justify-between items-center p-4 rounded-lg ${darkMode ? "bg-zinc-900" : "bg-gray-300"}`}>
        <p className={`${darkMode ? "text-white" : "text-black"} sm:text-xl lg:text-3xl`}>
          URL - <a href={`${data.Site}`} target="_blank" className="text-blue-400 hover:underline">{data.Site}</a>
        </p>
        <a href="/">
          <button className={`font-semibold flex gap-2 justify-center items-center px-2 py-2 sm:px-2 md:px-2 lg:px-4 lg:py-2   rounded-xl shadow-md transition ${btnBg}`}>
            <NotebookPen size={20} /> Check for Other
          </button>
        </a>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-indigo-200 via-blue-400 to-indigo-200 rounded-2xl shadow-xl p-6 text-center flex flex-col sm:flex-row sm:justify-center sm:items-center sm:gap-20
       lg:gap-30">
        <CircularProgress value={data.Score.toFixed(0)} size={120} stroke={10} />
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Overall Score</h2>
          <p className="text-4xl sm:text-5xl font-extrabold mt-2">{data.Score}/100</p>
          <p className="text-gray-200 text-sm sm:text-base mt-1">Website Health Index</p>
        </div>
        <div>
         
          <h1  className={`text-xl sm:text-2xl lg:text-3xl font-bold rounded-4xl 
    ${["A", "B"].includes(data.Grade)
      ? "bg-green-400"
      : ["C", "D"].includes(data.Grade)
      ? "bg-orange-400"
      : ["E", "F"].includes(data.Grade)
      ? "bg-red-400"
      : "bg-gray-300" // default color
    }`}>Grade - {data.Grade}</h1>
          <p className="text-lg sm:text-xl mt-1 font-semibold">AIO Compatibility - {data.AIO_Compatibility_Badge}</p>
          <p className="text-lg sm:text-xl mt-1 font-semibold">Device - {data.Device}</p>
        </div>
      </div>

      {/* Section Score Cards */}
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
  {data.Section_Score.map((item, index) => (
    <div
      key={item.name}
      className={`rounded-xl p-4 shadow-lg border ${cardBorder} text-center ${cardBg}`}
    >
      <h3 className={`text-xs sm:text-sm ${sectionText}`}>
        {item.name}
      </h3>
      <p
        className="text-lg sm:text-xl lg:text-2xl font-bold"
        style={{ color: COLORS[index % COLORS.length] }}
      >
        {item.score}%
      </p>
    </div>
  ))}
</div>



      {/* Bar Chart */}
<div className={`rounded-xl p-4 shadow-lg border ${cardBorder} ${cardBg}`}>
  <h3 className="text-base sm:text-lg font-semibold mb-4">Bar Graph</h3>
  <div className="w-full h-64 sm:h-72 lg:h-96">
  <ResponsiveContainer width="100%" height="100%">
        <BarChart data={barData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
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



    </div>
  );
}
