import React, { useContext } from "react";
import Assets from "../assets/Assets.js";
import { ThemeContext } from "../ThemeContext"; // ThemeContext import

export default function AboutPage({ darkMode }) {
  const { theme } = useContext(ThemeContext); // If you use theme context globally

  // 🌗 Background based on darkMode
  const bgStyle = {
    backgroundImage: `url(${darkMode ? Assets.DarkBg : Assets.Bg})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    transition: "background-image 0.5s ease-in-out",
  };

  // 🎨 Dynamic classes
  const textClass = darkMode ? "text-white" : "text-gray-900";
  const subTextClass = darkMode ? "text-gray-300" : "text-gray-700";
  const sectionBg = darkMode
    ? "bg-gray-800/50 backdrop-blur-md border border-gray-700"
    : "bg-white/50 backdrop-blur-md border border-gray-200";

  return (
    <>
      <div
        className={`min-h-screen py-16 px-6 flex flex-col items-center justify-center transition-colors duration-300 ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
          }`}
        style={bgStyle}
      >
        <div className="   text-center space-y-12">
          {/* Heading */}
          <div>
            <h1
              className={`text-3xl sm:text-5xl font-extrabold mb-6 drop-shadow-lg ${textClass}`}
            >
              About Our Site Audit Tool
            </h1>
            <p
              className={`text-lg   leading-relaxed ${subTextClass}`}
            >
              Our Site Audit Tool helps developers, marketers, and businesses
              improve website performance, SEO, and accessibility — making it
              easier than ever to diagnose issues and grow your online presence.
            </p>
          </div>

          {/* Sections */}
          <section className="grid md:grid-cols-2 gap-10">
            {/* Mission */}
            <div
              className={`p-8 rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300 ${sectionBg}`}
            >
              <h2 className="text-2xl font-extrabold mb-4">Our Mission</h2>
              <p className="text-base leading-relaxed">
                👉 To empower website owners and developers by providing
                actionable insights that enhance site speed, SEO performance,
                and user experience.
              </p>
            </div>

            {/* Features */}
            <div
              className={`p-8 rounded-2xl shadow-xl hover:scale-105 transition-transform duration-300 ${sectionBg}`}
            >
              <h2 className="text-2xl font-extrabold mb-4">What We Offer</h2>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li>Comprehensive SEO Audits</li>
                <li>Performance & Speed Optimization Tips</li>
                <li>Accessibility & Compliance Checks</li>
                <li>Detailed Reporting Dashboard</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
