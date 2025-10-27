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
import { ThemeProvider } from "./ThemeContext";
import Navbar from "./Component/Navbar.jsx";
import Footer from "./Component/Footer.jsx";
import { DataContext } from "./context/DataContext.js";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [result, setResult] = useState(true);
  const [data, setData] = useState(null); // ✅ data state

  const toggleTheme = () => setDarkMode((prev) => !prev);

  const navbarClass = `flex justify-between items-center px-4 py-3 shadow-md sticky top-0 z-50 ${
    darkMode ? "bg-gray-900 text-white" : "bg-white text-black"
  }`;

  return (
    <ThemeProvider>
      <DataContext.Provider value={{ data, setData }}>
        {/* This container div creates the sticky footer layout */}
        <div
          className={
            darkMode
              ? "bg-gray-900 text-white min-h-screen  flex flex-col"
              : "bg-gray-50 text-black min-h-screen flex flex-col"
          }
        >
          <Navbar
            result={result}
            darkMode={darkMode}
            toggleTheme={toggleTheme}
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            navbarClass={navbarClass}
          />

          {/* This main section grows to push the footer down */}
          <main className="flex-grow ">
            <Routes>
              <Route path="/" element={<Homepage darkMode={darkMode} />} />
              <Route
                path="/technical-performance"
                element={<Technical_Performance darkMode={darkMode} />}
              />
              <Route
                path="/on-page-seo"
                element={<On_Page_SEO darkMode={darkMode} />}
              />
              <Route
                path="/accessibility"
                element={<Accessibility darkMode={darkMode} />}
              />
              <Route
                path="/ux-content-structure"
                element={<UX_Content_Structure darkMode={darkMode} />}
              />
              <Route
                path="/security-compliance"
                element={<Security_Compilance darkMode={darkMode} />}
              />
              <Route
                path="/conversion-lead-flow"
                element={<Conversion_Lead_Flow darkMode={darkMode} />}
              />
              <Route path="/aio" element={<AIO darkMode={darkMode} />} />
              <Route path="/about" element={<AboutPage darkMode={darkMode} />} />
            </Routes>
          </main>

          {/* This Footer will be at the bottom */}
          <Footer darkMode={darkMode} />
        </div>
      </DataContext.Provider>
    </ThemeProvider>
  );
}

export default App;