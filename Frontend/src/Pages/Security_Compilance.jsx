import React, { useContext } from 'react';
import { ThemeContext } from '../ThemeContext';
import { Check, X } from "lucide-react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";

export default function Security_Compilance({darkMode }) {
  
    var { data, loading } = useData(); 
    data=data.Metric;

  if (!data) return <div />;

  const ScoreBadge = ({ score, textGood, textBad }) => {
    const cssscore = score ? "mobilebutton bg-green-300" : "mobilebutton bg-red-300";
    const hasValue = score ? <Check size={18} /> : <X size={18} />;
    return (
      <span className={`px-2.5 flex items-center gap-1.5 py-1 rounded-full text-black font-semibold text-sm shadow-md transform transition-transform ${cssscore}`}>
        {hasValue} {score ? textGood : textBad}
      </span>
    );
  };

  const containerBg = darkMode ? "bg-zinc-900 border-gray-700 text-white" : "bg-gray-100 border-gray-300 text-black";
  const cardBg = darkMode ? "bg-gradient-to-br from-blue-900 via-gray-900 to-black" : "bg-gradient-to-br from-blue-200 via-gray-200 to-white";
  const textColor = darkMode ? "text-white" : "text-black";

  return (
    <div
      id="SecurityCompliance"
      className={`min-h-fit pt-20 pb-16 rounded-2xl shadow-lg hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300 m-4 flex flex-col items-center justify-start p-6 space-y-6 ${containerBg}`}
    >
      <h1 className={`responsive text-heading-25 flex sm:gap-10 justify-center items-center text-3xl font-extrabold mb-6 text-center ${textColor}`}>
        Security/Compliance 
        <CircularProgress
          value={data.Security_or_Compliance.Percentage}
          size={70}
          stroke={5}
        />
      </h1>

      <div className={`w-full max-w-4xl p-6 rounded-2xl shadow-lg border-l-4 border-indigo-500 ${cardBg}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">

          {/* HTTPS / SSL / TLS */}
          <div className="flex justify-between items-center">
            <span className={textColor}>HTTPS</span>
            <ScoreBadge 
              score={data.Security_or_Compliance.HTTPS.Score} 
              textGood="HTTPS enabled" 
              textBad="HTTPS missing"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>SSL</span>
            <ScoreBadge 
              score={data.Security_or_Compliance.SSL.Score} 
              textGood="SSL reachable" 
              textBad="SSL issue"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>TLS Version</span>
            <ScoreBadge 
              score={data.Security_or_Compliance.TLS_Version.Score} 
              textGood="TLS 1.2+" 
              textBad="Lower than TLS 1.2"
            />
          </div>

          {/* Secure Cookies / HttpOnly / Third-party cookies */}
          <div className="flex justify-between items-center">
            <span className={textColor}>Secure Cookies</span>
            <ScoreBadge 
              score={data.Security_or_Compliance.Cookies_Secure.Score} 
              textGood="Enabled" 
              textBad="Missing"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>HttpOnly Cookies</span>
            <ScoreBadge 
              score={data.Security_or_Compliance.Cookies_HttpOnly.Score} 
              textGood="Enabled" 
              textBad="Missing"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Third-Party Cookies</span>
            <ScoreBadge 
              score={data.Security_or_Compliance.Third_Party_Cookies?.Score} 
              textGood="Not detected" 
              textBad="Detected"
            />
          </div>

        
          

          {/* Google Safe Browsing / Malware Scan */}
          <div className="flex justify-between items-center">
            <span className={textColor}>Google Safe Browsing</span>
            <ScoreBadge 
              score={data.Security_or_Compliance.Google_Safe_Browsing.Score} 
              textGood="Safe" 
              textBad="Threat detected"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>Domain Blacklist / Malware Scan</span>
            <ScoreBadge 
              score={data.Security_or_Compliance.Blacklist.Score} 
              textGood="Clean" 
              textBad="Blacklisted"
            />
          </div>

          {/* Weak / Default Credentials & MFA */}
          <div className="flex justify-between items-center">
            <span className={textColor}>Weak/Default Credentials</span>
            <ScoreBadge 
              score={data.Security_or_Compliance.Weak_Default_Credentials.Score} 
              textGood="Safe" 
              textBad="Weak/default detected"
            />
          </div>
        

          {/* SQLi & XSS Exposure */}
          <div className="flex justify-between items-center">
            <span className={textColor}>SQL Injection Exposure</span>
            <ScoreBadge 
              score={data.Security_or_Compliance.SQLi_Exposure.Score} 
              textGood="Safe" 
              textBad="Vulnerable"
            />
          </div>
          <div className="flex justify-between items-center">
            <span className={textColor}>XSS Exposure</span>
            <ScoreBadge 
              score={data.Security_or_Compliance.XSS.Score} 
              textGood="Safe" 
              textBad="Vulnerable"
            />
          </div>

          {/* Privacy Policy & Cookie Consent */}
          <div className="flex justify-between items-center">
            <span className={textColor}>Privacy Policy</span>
            <ScoreBadge 
              score={data.Security_or_Compliance.Privacy_Policy.Score} 
              textGood="Present" 
              textBad="Missing"
            />
          </div>
       

          {/* Forms Using HTTPS */}
          <div className="flex justify-between items-center">
            <span className={textColor}>Forms Using HTTPS</span>
            <ScoreBadge 
              score={data.Security_or_Compliance.Forms_Use_HTTPS.Score} 
              textGood="Enabled" 
              textBad="Missing"
            />
          </div>

        </div>
      </div>

      <AuditDropdown items={data.Security_or_Compliance.Passed} title="Passed Audits" darkMode={darkMode} />
      <AuditDropdown items={data.Security_or_Compliance.Warning} title="Warning" darkMode={darkMode} />
      <AuditDropdown items={data.Security_or_Compliance.Improvements} title="Failed Audits" darkMode={darkMode} />
    </div>
  );
}
