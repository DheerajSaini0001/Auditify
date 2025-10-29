import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext.jsx"; // ✅ consistent import path
import { Check, X } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";

export default function Security_Compilance() {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const { data: rawData, loading } = useData();
  const data = rawData;

  if (!data || !data.Security_or_Compliance) return <div />;

  const metric = data.Security_or_Compliance;

  // ✅ Reusable Badge Component
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

  // ✅ Theme-based dynamic styles
  const containerBg = darkMode
    ? "bg-zinc-900 border-gray-700 text-white"
    : "bg-gray-100 border-gray-300 text-black";

  const cardBg = darkMode
    ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black"
    : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";

  const textColor = darkMode ? "text-white" : "text-black";

  return (
    <div
      id="SecurityCompliance"
      className={`min-h-fit pt-20 pb-16 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 m-4 flex flex-col items-center justify-start p-6 space-y-6 ${containerBg}`}
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
              out={metric.TLS_Version.Score ? "TLS 1.2+" : "Lower than TLS 1.2"}
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
              out={
                metric.SQLi_Exposure.Score ? "Safe" : "Vulnerable"
              }
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={textColor}>XSS Exposure</span>
            <ScoreBadge
              score={metric.XSS.Score}
              out={metric.XSS.Score ? "Safe" : "Vulnerable"}
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={textColor}>Privacy Policy</span>
            <ScoreBadge
              score={metric.Privacy_Policy.Score}
              out={
                metric.Privacy_Policy.Score ? "Present" : "Missing"
              }
            />
          </div>

          <div className="flex justify-between items-center">
            <span className={textColor}>Forms Using HTTPS</span>
            <ScoreBadge
              score={metric.Forms_Use_HTTPS.Score}
              out={
                metric.Forms_Use_HTTPS.Score ? "Enabled" : "Missing"
              }
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
    </div>
  );
}
