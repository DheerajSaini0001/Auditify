import React, { useContext } from "react";
import Assets from '../assets/Assets.js';
import Footer from "../Component/Footer";
import { ThemeContext } from "../ThemeContext"; // ThemeContext import

export default function AboutPage({darkMode}) {
  const { theme } = useContext(ThemeContext); // ThemeContext se theme access

  console.log();

  const bgClass =darkMode 
    ? "bg-gradient-to-br from-gray-900 via-gray-800 to-black" 
    : "bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300";

    const navbarClass = darkMode
    ? "fixed top-0 left-0 w-full h-16 bg-gray-900 border-b border-gray-700 flex items-center justify-between px-4 z-50"
    : "fixed top-0 left-0 w-full h-16 bg-gray-200 border-b border-gray-300 flex items-center justify-between px-4 z-50";

 
    const textClass =darkMode ? "text-white" : "text-gray-900";
  const subTextClass =darkMode ? "text-gray-300" : "text-gray-700";
  const navClass =darkMode ? "bg-gray-900 border-b border-gray-700" : "bg-white border-b border-gray-300";

  return (
    <>
      <div className={`${navClass} min-h-screen py-12 px-6`}>
        {/* Navbar */}
        <nav className={`fixed top-0 left-0 w-full h-16 ${navClass} flex items-center justify-between px-6 z-50`}>
          <a href="/">
            <div className={darkMode?"flex flex-col-rev justify-center items-center gap-4 font-serif text-4xl font-bold bg-gradient-to-r from-sky-200 via-rose-200 to-orange-200 bg-clip-text text-transparent":"flex flex-col-rev justify-center items-center gap-4 font-serif text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#000428] to-[#004e92]"}>
              <img src={darkMode?Assets.Logo:Assets.DarkLogo} alt="Site Audit Logo" className="h-12 w-12" />
              <span>Site Audits</span>
            </div>
          </a>
        </nav>

        {/* Main Content */}
        <div className="mt-20 max-w-6xl mx-auto">
          {/* Heading */}
          <h1 className={`text-4xl font-bold mb-6 text-center ${textClass}`}>
            About Our Site Audit Tool
          </h1>
          <p className={`text-lg text-center max-w-3xl mx-auto mb-12 ${subTextClass}`}>
            Our Site Audit tool helps developers, marketers, and businesses
            improve their website performance, SEO, and accessibility. 
            We aim to simplify the process of finding issues and boosting online presence.
          </p>

          {/* Sections */}
          <section className="grid md:grid-cols-2 gap-10">
            {/* Mission */}
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-lg rounded-2xl p-8 hover:shadow-xl hover:scale-105 transition-transform duration-300">
              <h2 className="text-2xl text-gray-100 mb-4 font-extrabold">Our Mission</h2>
              <p className="text-gray-100">
                👉 To empower website owners and developers by providing actionable 
                insights that enhance site speed, SEO performance, and user experience.
              </p>
            </div>

            {/* Features */}
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-lg rounded-2xl p-8 hover:shadow-xl hover:scale-105 transition-transform duration-300">
              <h2 className="text-2xl text-gray-100 mb-4 font-extrabold">What We Offer</h2>
              <ul className="list-disc list-inside text-gray-100 space-y-2">
                <li>Comprehensive SEO Audits</li>
                <li>Performance & Speed Optimization Tips</li>
                <li>Accessibility & Compliance Checks</li>
                <li>Detailed Reporting Dashboard</li>
              </ul>
            </div>
          </section>

          {/* Team */}
          <section className="mt-20 text-center px-4 sm:px-6 lg:px-8">
            <h2 className={`text-3xl font-bold mb-6 ${textClass}`}>Meet the Team</h2>
            <p className={`mb-10 max-w-2xl mx-auto ${subTextClass}`}>
              We are a passionate group of developers and analysts committed 
              to making the web faster and more accessible for everyone.
            </p>

           < div className="bg-gradient-to-r m-4 from-pink-500 via-purple-500 to-indigo-500 shadow-lg rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-transform duration-300">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4">
                      <img src={Assets.Aditya} alt="Aditya Senior Developer" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-lg text-gray-100 font-extrabold">Aditya</h3>
                    <p className="text-sm text-gray-100">Senior FullStack Developer</p>
                  </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-2 gap-10">
            
               
                  <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-lg rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-transform duration-300">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4">
                      <img src={Assets.Dheeraj} alt="Dheeraj" className=" object-cover" />
                    </div>
                    <h3 className="text-lg text-gray-100 font-extrabold">Dheeraj</h3>
                    <p className="text-sm text-gray-100">FullStack Developer</p>
                  </div>
                  <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 shadow-lg rounded-2xl p-6 hover:shadow-xl hover:scale-105 transition-transform duration-300">
                    <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-4">
                      <img src={Assets.Piyush} alt="Piyush" className="w-full h-full object-cover" />
                    </div>
                    <h3 className="text-lg text-gray-100 font-extrabold">Piyush</h3>
                    <p className="text-sm text-gray-100">FullStack Developer</p>
                  </div>
                 
              
            
            </div>
          </section>
        </div>
      </div>

      <Footer/>
    </>
  );
}
