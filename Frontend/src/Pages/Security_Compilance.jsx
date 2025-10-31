import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { Check, X ,Loader2} from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import Sidebar from "../Component/Sidebar"; // ✅ 1. Imported Sidebar

// ✅ 2. Reusable Badge moved outside component for performance
const ScoreBadge = ({ score, out }) => {
  const badgeClass = score ? "bg-green-300" : "bg-red-300";
  const icon = score ? <Check size={18} /> : <X size={18} />;
  return (
    <span
      className={`px-2.5 flex items-center gap-1.5 py-1 rounded-full text-black font-semibold text-sm shadow-md transform transition-transform mobilebutton ${badgeClass}`}
    >
      {icon} {out}
    </span>
  );
};

export default function Security_Compilance() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const { data: rawData, loading } = useData();
  const data = rawData;
  const reportType = data?.Report;

  const metric = data.Security_or_Compliance;

  // ✅ Theme-based dynamic styles
  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  const textColor = darkMode ? "text-white" : "text-black";

  // ✅ 1. Added sidebarClass constant
  const sidebarClass = `fixed top-0 mt-16 left-0 h-full w-64 bg-white dark:bg-gray-900 shadow-lg`;

  return (
    // ✅ 1. Added Layout structure
    <>
    {metric ? (     reportType === "All" ? ( <div className="relative  flex w-full h-full">
        {/* Sidebar */}
       <div
          className={`${sidebarClass} lg:translate-x-0 transition-transform duration-300 ease-in-out z-40`}
        >
          
          <Sidebar darkMode={darkMode} />
        </div>
        {/* Main content */}
        <main
          className={`flex-1  lg:ml-64 flex flex-col justify-center items-center pt-20 pb-0 pr-4 pl-4 lg:pl-0 space-y-8 ${
            darkMode ? " text-gray-100" : " text-gray-800"
          }`}
        >
          {/* Header with progress */}
          <h1 className="responsive text-heading-25 flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6">
            Security/Compliance{" "}
            <CircularProgress value={metric.Percentage} size={70} stroke={5} />
          </h1>

          {/* Metrics card */}
          <div
            className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center">
                <span className={textColor}>HTTPS</span>
                <ScoreBadge
                  score={metric.HTTPS.Score}
                  out={metric.HTTPS.Score ? "HTTPS enabled" : "HTTPS missing"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>SSL</span>
                <ScoreBadge
                  score={metric.SSL.Score}
                  out={metric.SSL.Score ? "SSL reachable" : "SSL issue"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>TLS Version</span>
                <ScoreBadge
                  score={metric.TLS_Version.Score}
                  out={
                    metric.TLS_Version.Score ? "TLS 1.2+" : "Lower than TLS 1.2"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Secure Cookies</span>
                <ScoreBadge
                  score={metric.Cookies_Secure.Score}
                  out={metric.Cookies_Secure.Score ? "Enabled" : "Missing"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>HttpOnly Cookies</span>
                <ScoreBadge
                  score={metric.Cookies_HttpOnly.Score}
                  out={metric.Cookies_HttpOnly.Score ? "Enabled" : "Missing"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Third-Party Cookies</span>
                <ScoreBadge
                  score={metric.Third_Party_Cookies?.Score}
                  out={
                    metric.Third_Party_Cookies?.Score
                      ? "Not detected"
                      : "Detected"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Google Safe Browsing</span>
                <ScoreBadge
                  score={metric.Google_Safe_Browsing.Score}
                  out={
                    metric.Google_Safe_Browsing.Score
                      ? "Safe"
                      : "Threat detected"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Domain Blacklist / Malware Scan</span>
                <ScoreBadge
                  score={metric.Blacklist.Score}
                  out={metric.Blacklist.Score ? "Clean" : "Blacklisted"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Weak/Default Credentials</span>
                <ScoreBadge
                  score={metric.Weak_Default_Credentials.Score}
                  out={
                    metric.Weak_Default_Credentials.Score
                      ? "Safe"
                      : "Weak/default detected"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>SQL Injection Exposure</span>
                <ScoreBadge
                  score={metric.SQLi_Exposure.Score}
                  out={metric.SQLi_Exposure.Score ? "Safe" : "Vulnerable"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>XSS Exposure</span>
                <ScoreBadge
                  score={metric.XSS.Score}
                  out={metric.XSS.Score ? "Safe" : "VVulnerable"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Privacy Policy</span>
                <ScoreBadge
                  score={metric.Privacy_Policy.Score}
                  out={metric.Privacy_Policy.Score ? "Present" : "Missing"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Forms Using HTTPS</span>
                <ScoreBadge
                  score={metric.Forms_Use_HTTPS.Score}
                  out={metric.Forms_Use_HTTPS.Score ? "Enabled" : "Missing"}
                />
              </div>
            </div>
          </div>

          {/* ✅ Audit Dropdowns */}
          <AuditDropdown
            items={metric.Passed}
            title="Passed Audit"
            darkMode={darkMode}
          />
          <AuditDropdown
            items={metric.Warning}
            title="Warnings"
            darkMode={darkMode}
          />
          <AuditDropdown
            items={metric.Improvements}
            title="Failed Audits"
            darkMode={darkMode}
          />
        </main>
      </div>):(<main
          className={`flex flex-col justify-center items-center min-h-auto ${
            darkMode ? " text-gray-100" : " text-gray-800"
          }`}
        >
          {/* Header with progress */}
          <h1 className="responsive text-heading-25 flex items-center justify-center sm:gap-10 text-3xl font-extrabold mb-6">
            Security/Compliance{" "}
            <CircularProgress value={metric.Percentage} size={70} stroke={5} />
          </h1>

          {/* Metrics card */}
          <div
            className={`w-full max-w-4xl p-6 mb-5 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between items-center">
                <span className={textColor}>HTTPS</span>
                <ScoreBadge
                  score={metric.HTTPS.Score}
                  out={metric.HTTPS.Score ? "HTTPS enabled" : "HTTPS missing"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>SSL</span>
                <ScoreBadge
                  score={metric.SSL.Score}
                  out={metric.SSL.Score ? "SSL reachable" : "SSL issue"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>TLS Version</span>
                <ScoreBadge
                  score={metric.TLS_Version.Score}
                  out={
                    metric.TLS_Version.Score ? "TLS 1.2+" : "Lower than TLS 1.2"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Secure Cookies</span>
                <ScoreBadge
                  score={metric.Cookies_Secure.Score}
                  out={metric.Cookies_Secure.Score ? "Enabled" : "Missing"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>HttpOnly Cookies</span>
                <ScoreBadge
                  score={metric.Cookies_HttpOnly.Score}
                  out={metric.Cookies_HttpOnly.Score ? "Enabled" : "Missing"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Third-Party Cookies</span>
                <ScoreBadge
                  score={metric.Third_Party_Cookies?.Score}
                  out={
                    metric.Third_Party_Cookies?.Score
                      ? "Not detected"
                      : "Detected"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Google Safe Browsing</span>
                <ScoreBadge
                  score={metric.Google_Safe_Browsing.Score}
                  out={
                    metric.Google_Safe_Browsing.Score
                      ? "Safe"
                      : "Threat detected"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Domain Blacklist / Malware Scan</span>
                <ScoreBadge
                  score={metric.Blacklist.Score}
                  out={metric.Blacklist.Score ? "Clean" : "Blacklisted"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Weak/Default Credentials</span>
                <ScoreBadge
                  score={metric.Weak_Default_Credentials.Score}
                  out={
                    metric.Weak_Default_Credentials.Score
                      ? "Safe"
                      : "Weak/default detected"
                  }
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>SQL Injection Exposure</span>
                <ScoreBadge
                  score={metric.SQLi_Exposure.Score}
                  out={metric.SQLi_Exposure.Score ? "Safe" : "Vulnerable"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>XSS Exposure</span>
                <ScoreBadge
                  score={metric.XSS.Score}
                  out={metric.XSS.Score ? "Safe" : "VVulnerable"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Privacy Policy</span>
                <ScoreBadge
                  score={metric.Privacy_Policy.Score}
                  out={metric.Privacy_Policy.Score ? "Present" : "Missing"}
                />
              </div>

              <div className="flex justify-between items-center">
                <span className={textColor}>Forms Using HTTPS</span>
                <ScoreBadge
                  score={metric.Forms_Use_HTTPS.Score}
                  out={metric.Forms_Use_HTTPS.Score ? "Enabled" : "Missing"}
                />
              </div>
            </div>
          </div>

          {/* ✅ Audit Dropdowns */}
          <AuditDropdown
            items={metric.Passed}
            title="Passed Audit"
            darkMode={darkMode}
          />
          <AuditDropdown
            items={metric.Warning}
            title="Warnings"
            darkMode={darkMode}
          />
          <AuditDropdown
            items={metric.Improvements}
            title="Failed Audits"
            darkMode={darkMode}
          />
        </main>)): (<Loader2 size={20} className="animate-spin w-5 h-5" />)}

     
    </>
  );
}