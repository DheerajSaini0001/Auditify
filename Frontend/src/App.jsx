import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Homepage from "./pages/Homepage";
import AboutPage from "./pages/AboutPage";
import Technical_Performance from "./pages/Technical_Performance";
import On_Page_SEO from "./pages/On_Page_SEO";
import Accessibility from "./pages/Accessibility";
import UX_Content_Structure from "./pages/UX_Content_Structure";
import Conversion_Lead_Flow from "./pages/Conversion_Lead_Flow";
import Security_Compilance from "./pages/Security_Compilance";
import AIO from "./pages/AIO";
import { ThemeProvider } from "./context/ThemeContext";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { DataProvider } from "./context/DataContext.jsx";
import AppContent from "./AppContent.jsx"; 


function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;

