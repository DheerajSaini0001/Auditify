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
import { DataProvider } from "./context/DataContext.jsx";
import AppContent from "./AppContent.jsx"; 
function App() {
  return (
    <ThemeProvider>
      <DataProvider>
        <AppContent />
      </DataProvider>
    </ThemeProvider>
  );
}

export default App;
