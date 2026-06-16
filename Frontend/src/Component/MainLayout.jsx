import React, { useContext, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import { ThemeContext } from "../context/ThemeContext";
import ScrollToTop from "./ScrollToTop";
import Footer from "./Footer";
import { useData } from "../context/DataContext";
import { isSectionVisibleForAudience } from "../config/parameterAudience";
import DeveloperViewNotice from "./reusablecomponent/DeveloperViewNotice";
import MoreParamsFooter from "./reusablecomponent/MoreParamsFooter";

// Section route prefix → { key used by parameterAudience.js, display label }.
const SECTION_BY_PREFIX = {
    "/technical-performance": { key: "technicalPerformance", label: "Technical Performance" },
    "/on-page-seo": { key: "onPageSEO", label: "On-Page SEO" },
    "/accessibility": { key: "accessibility", label: "Accessibility" },
    "/security-compliance": { key: "securityOrCompliance", label: "Security & Compliance" },
    "/ux-content-structure": { key: "UXOrContentStructure", label: "UX & Content" },
    "/conversion-lead-flow": { key: "conversionAndLeadFlow", label: "Conversion & Lead Flow" },
    "/aio": { key: "aioReadiness", label: "AIO Readiness" },
};

export default function MainLayout() {
    const { theme } = useContext(ThemeContext);
    const { data, audienceMode, setAudienceMode } = useData();
    const darkMode = theme === "dark";
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // When the section we're on has no parameters for the current audience (e.g.
    // viewing AIO Readiness in Dealer mode — it has only technical params), keep the
    // section but show a "switch to Developer mode" notice instead of a blank page.
    const sectionPrefix = Object.keys(SECTION_BY_PREFIX).find((p) => location.pathname.startsWith(p));
    const currentSection = sectionPrefix ? SECTION_BY_PREFIX[sectionPrefix] : null;
    const sectionHiddenForAudience =
        !!data && data.report === "All" && currentSection &&
        !isSectionVisibleForAudience(currentSection.key, audienceMode);

    const isReportPath = location.pathname.startsWith("/report") ||
        location.pathname.startsWith("/technical-performance") ||
        location.pathname.startsWith("/on-page-seo") ||
        location.pathname.startsWith("/accessibility") ||
        location.pathname.startsWith("/security-compliance") ||
        location.pathname.startsWith("/ux-content-structure") ||
        location.pathname.startsWith("/conversion-lead-flow") ||
        location.pathname.startsWith("/aio");

    const showSidebar = !!data && data.report === "All" && isReportPath;

    return (
        <div>
            {/* Skip to Main Content Link */}
            <a
                href="#main-content"
               
            >
            
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
              shadow-xl lg:shadow-none
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
                        {sectionHiddenForAudience ? (
                            <DeveloperViewNotice
                                darkMode={darkMode}
                                sectionName={currentSection.label}
                                onSwitch={() => setAudienceMode("developer")}
                            />
                        ) : (
                            <Outlet />
                        )}
                        {/* On a mixed section in Dealer mode, invite the user to see the
                            developer-only params (the component self-hides otherwise). */}
                        {currentSection && data?.report === "All" && !sectionHiddenForAudience && (
                            <MoreParamsFooter sectionKey={currentSection.key} darkMode={darkMode} />
                        )}
                    </div>
                    <Footer />
                </main>
            </div>
        </div>
    );
}
