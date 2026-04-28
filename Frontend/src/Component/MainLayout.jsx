import React, { useContext, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { ThemeContext } from "../context/ThemeContext";
import ScrollToTop from "./ScrollToTop";
import Footer from "./Footer";
import { useData } from "../context/DataContext";

export default function MainLayout() {
    const { theme } = useContext(ThemeContext);
    const { data } = useData();
    const darkMode = theme === "dark";
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    const isReportPath = location.pathname.startsWith("/report") || 
                         location.pathname === "/technical-performance" || 
                         location.pathname === "/on-page-seo" || 
                         location.pathname === "/accessibility" || 
                         location.pathname === "/security-compliance" || 
                         location.pathname === "/ux-content-structure" || 
                         location.pathname === "/conversion-lead-flow" || 
                         location.pathname === "/aio";

    const showSidebar = !!data && data.report === "All" && isReportPath;

    return (
        <div className={`min-h-screen flex flex-col ${darkMode ? "bg-gray-900 text-white" : "bg-gray-50 text-black"}`}>
            {/* Skip to Main Content Link */}
            <a 
                href="#main-content" 
                className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[999] focus:px-6 focus:py-3 focus:bg-emerald-600 focus:text-white focus:font-bold focus:rounded-xl focus:shadow-2xl focus:ring-4 focus:ring-emerald-500/50 transition-all outline-none"
            >
                Skip to main content
            </a>

            {/* Navbar */}
            <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

            <div className="flex flex-1 relative">
                {/* Sidebar - Desktop: Fixed, Mobile: Fixed Overlay */}
                {showSidebar && (
                    <aside
                        className={`
              fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 z-40
              transition-transform duration-300 ease-in-out
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
              lg:translate-x-0
              shadow-lg
            `}
                    >
                        <Sidebar darkMode={darkMode} />
                    </aside>
                )}

                {/* Mobile Overlay */}
                {showSidebar && sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main Content */}
                <main
                    id="main-content"
                    className={`
            flex-1 w-full transition-all duration-300 
            ${showSidebar ? "lg:ml-64" : ""} 
      overflow-x-hidden flex flex-col
          `}
                >
                    <ScrollToTop />
                    <div className="flex-grow">
                        <Outlet />
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}
