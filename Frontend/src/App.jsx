import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Homepage from "./Pages/Homepage";
import AboutPage from "./Pages/AboutPage";
import Technical_Performance from "./Pages/Technical_Performance";
import On_Page_SEO from "./Pages/On_Page_SEO";
import Accessibility from "./Pages/Accessibility";
import UX_Content_Structure from "./Pages/UX_Content_Structure";
import Conversion_Lead_Flow from "./Pages/Conversion_Lead_Flow";
import Security_Compilance from "./Pages/Security_Compilance";
import AIO from "./Pages/AIO";
import { ThemeProvider } from "./ThemeContext"; // ✅ Theme context
import Navbar from "./Component/Navbar.jsx"; // ✅ Import Navbar
import Footer from "./Component/Footer.jsx"; // ✅ Import Footer
import DarkCard from "./Component/DarkCard";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [result, setResult] = useState(true); // assuming `result` controls logo & toggle
    const [data, setData] = useState(null);
  
  const toggleTheme = () => setDarkMode((prev) => !prev);

  const navbarClass = `flex justify-between items-center px-4 py-3 shadow-md sticky top-0 z-50 ${
    darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
  }`;

  return (
<ThemeProvider>
  <div
    className={darkMode ? "bg-gray-900 text-white min-h-screen flex flex-col" : "bg-gray-50 text-black min-h-screen flex flex-col"}
  >
    {/* ✅ Navbar on top */}
    <Navbar
      result={result}
      darkMode={darkMode}
      toggleTheme={toggleTheme}
      sidebarOpen={sidebarOpen}
      setSidebarOpen={setSidebarOpen}
      navbarClass={navbarClass}
    />

    {/* ✅ Main content grows to fill available space */}
    <main className="flex-grow ">
      <Routes>
        <Route path="/" element={<Homepage darkMode={darkMode} setData={setData} />} />
       
         <Route
    path="/technical-performance"
    element={<Technical_Performance darkMode={darkMode} data={data ? data.Metric : null} />}
  />
  <Route
    path="/on-page-seo"
    element={<On_Page_SEO darkMode={darkMode} data={data ? data.Metric : null} />}
  />
  <Route
    path="/accessibility"
    element={<Accessibility darkMode={darkMode} data={data ? data.Metric : null} />}
  />
  <Route
    path="/ux-content-structure"
    element={<UX_Content_Structure darkMode={darkMode} data={data ? data.Metric : null} />}
  />
  <Route
    path="/security-compliance"
    element={<Security_Compilance darkMode={darkMode} data={data ? data.Metric : null} />}
  />
  <Route
    path="/conversion-lead-flow"
    element={<Conversion_Lead_Flow darkMode={darkMode} data={data ? data.Metric : null} />}
  />
  <Route
    path="/aio"
    element={<AIO darkMode={darkMode} data={data ? data.Metric : null} />}
  />

       
        <Route path="/about" element={<AboutPage darkMode={darkMode} />} />
      </Routes>
    </main>

    {/* ✅ Footer stays at bottom */}
    <Footer darkMode={darkMode} />
  </div>
</ThemeProvider>

  );
}

export default App;
