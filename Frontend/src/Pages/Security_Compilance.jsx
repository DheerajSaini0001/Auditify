import React, { useContext, useMemo } from "react";
import UrlHeader from "../Component/UrlHeader";
import CircularProgress from "../Component/CircularProgress";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../Component/LivePreview";
import {
  Shield, Lock, Globe, AlertTriangle, CheckCircle, XCircle,
  Info, Server, Eye, FileText, AlertOctagon, Smartphone,
  Layout, Code, Terminal, Bug, MapPin, Share2, CalendarClock,
  Database, EyeOff, MousePointer, Bell, Key, Globe2, Layers, ShieldCheck, Search, Loader2
} from "lucide-react";
import MetricInfoModal from "../Component/MetricInfoModal";
import ParameterInfoModal from "../Component/ParameterInfoModal";
import { InfoDetails } from "../Component/InfoDetails";

const iconMap = {
  HTTPS: Lock,
  SSL: ShieldCheck,
  SSL_Expiry: CalendarClock,
  HSTS: Server,
  TLS_Version: Layers,
  X_Frame_Options: Layout,
  CSP: Code,
  X_Content_Type_Options: FileText,
  Cookies_Secure: Lock,
  Cookies_HttpOnly: EyeOff,
  Google_Safe_Browsing: Search,
  Blacklist: AlertOctagon,
  Malware_Scan: Bug,
  SQLi_Exposure: Database,
  XSS: Code,
  Cookie_Consent: Info,
  Privacy_Policy: FileText,
  Forms_Use_HTTPS: Lock,
  GDPR_CCPA: Globe2,
  Data_Collection: Database,
  Weak_Default_Credentials: Key,
  MFA_Enabled: Smartphone,
  Admin_Panel_Public: Eye,
  Viewport_Meta_Tag: Smartphone,
  HTML_Doctype: Code,
  Character_Encoding: Globe,
  Browser_Console_Errors: Terminal,
  Geolocation_Request: MapPin,
  Input_Paste_Allowed: MousePointer,
  Notification_Request: Bell,
  Third_Party_Cookies: Share2,
  Deprecated_APIs: AlertTriangle,
};

const educationalContent = InfoDetails;
const scoreCalculationInfo = InfoDetails.Security_And_Compliance_Methodology;

const SecurityShimmer = ({ darkMode, steps = [], currentStep = 0 }) => {
  const step = steps[currentStep] || steps[0];

  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 animate-in fade-in zoom-in duration-500 min-h-[350px]">
      <div className={`w-full max-w-xl rounded-[32px] p-8 flex flex-col items-center text-center transition-all duration-500 ${darkMode ? "bg-slate-800/40 border border-slate-700/50" : "bg-slate-100/60 border border-slate-200/50"}`}>
        {/* Icon Container (Circle) */}
        <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${darkMode ? "bg-slate-900 shadow-black/40 text-white" : "bg-[#1e293b] shadow-slate-400/30 text-white"}`}>
          <div className="animate-pulse">
            {React.cloneElement(step.icon, {
              className: "w-8 h-8",
              strokeWidth: 2.5
            })}
          </div>
        </div>

        {/* Title */}
        <h2 className={`mt-6 text-2xl font-bold tracking-tight transition-all duration-500 ${darkMode ? "text-white" : "text-slate-900"}`}>
          {step.title}
        </h2>

        {/* Description */}
        <p className={`mt-4 text-base leading-relaxed max-w-sm mx-auto transition-all duration-500 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
          {step.text}
        </p>

        {/* Processing State */}
        <div className="mt-8 flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span className="text-xs font-bold uppercase tracking-wider">Processing</span>
        </div>

        {/* Progress Indicators */}
        <div className="flex items-center gap-2 mt-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-500 ${i === currentStep ? "w-6 bg-blue-500" : i < currentStep ? "w-6 bg-blue-500/40" : "w-2 bg-slate-400/30"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ metricKey, data, darkMode, onInfo }) => {
  const { status, details, meta, analysis } = data || {};
  const isPassed = status === "pass";
  const isWarning = status === "warning";
  const [showAnalysis, setShowAnalysis] = React.useState(false);

  const Icon = iconMap[metricKey] || Shield;
  const content = educationalContent[metricKey] || { desc: "Security check.", why: "Important for security." };
  const title = metricKey.replaceAll("_", " ");

  // Simple Colors
  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";

  let statusColor = darkMode ? "text-rose-400 bg-rose-500/10 border-rose-500/20" : "text-rose-600 bg-rose-50 border-rose-100";
  let statusText = "Failed";

  if (isPassed) {
    statusColor = darkMode ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-emerald-600 bg-emerald-50 border-emerald-100";
    statusText = "Passed";
  } else if (isWarning) {
    statusColor = darkMode ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-amber-600 bg-amber-50 border-amber-100";
    statusText = "Warning";
  }

  const hasMetaDetails = meta && Object.keys(meta).some(k => k !== 'count' && k !== 'value');

  return (
    <div className={`relative overflow-hidden rounded-xl border ${cardBg} shadow-sm hover:shadow-md transition-shadow group flex flex-col`}>
      <div className="p-5 space-y-4 flex-grow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-gray-100"} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} className={darkMode ? "text-blue-400" : "text-blue-600"} />
            </div>
            <div>
              <h3 className={`font-bold text-lg ${textColor}`}>{title}</h3>
              <p className={`text-xs font-medium mt-1 px-2 py-0.5 rounded-full w-fit border ${statusColor}`}>
                {statusText}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPassed && analysis && (
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${showAnalysis
                  ? (darkMode ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-blue-50 text-blue-700 border border-blue-100")
                  : (darkMode ? "text-gray-400 hover:text-white hover:bg-gray-700 border border-transparent" : "text-gray-400 hover:text-gray-900 hover:bg-gray-100 border border-transparent")
                  }`}
                title={showAnalysis ? "Hide Detail" : "View Detail"}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                  {showAnalysis ? "Hide Detail" : "View Detail"}
                </span>
              </button>
            )}
            {onInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo();
                }}
                className={`p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
                title="View Methodology"
              >
                <Info size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Educational Content */}
        <div className="space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
            Description: <span className={`normal-case font-normal opacity-100 text-xs leading-relaxed ${subTextColor}`}>{content.whatThisParameterIs || content.desc}</span>
          </p>
        </div>

        {/* Dynamic Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
                Status Detail
              </h4>
              <div className={`h-[1px] flex-grow ${darkMode ? "bg-gray-700/50" : "bg-gray-100"}`}></div>
            </div>
            <div className={`p-3 rounded-lg border transition-all duration-300 ${isPassed ? (darkMode ? "bg-emerald-500/5 border-emerald-500/10" : "bg-emerald-50/50 border-emerald-100") :
              isWarning ? (darkMode ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50/50 border-amber-100") :
                (darkMode ? "bg-rose-500/5 border-rose-500/20" : "bg-rose-50/50 border-rose-100")
              }`}>
              <p className={`text-sm font-semibold leading-relaxed ${isPassed ? "text-emerald-600 dark:text-emerald-400" :
                isWarning ? "text-amber-600 dark:text-amber-400" :
                  "text-rose-600 dark:text-rose-400"
                }`}>
                {details || "No details available"}
              </p>
            </div>
          </div>

          {metricKey === "HTTPS" && meta?.protocol && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Protocol:</span>
                <code className={`px-1.5 py-0.5 rounded font-mono font-bold ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-700"}`}>
                  {meta.protocol}
                </code>
              </div>
            </div>
          )}

          {metricKey === "SSL" && meta?.validTo && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Expires:</span>
                <code className={`px-1.5 py-0.5 rounded font-mono font-bold ${darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
                  {new Date(meta.validTo).toLocaleDateString()}
                </code>
              </div>
            </div>
          )}

          {metricKey === "TLS_Version" && meta?.version && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Version:</span>
                <code className={`px-1.5 py-0.5 rounded font-mono font-bold ${darkMode ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-700"}`}>
                  {meta.version}
                </code>
              </div>
            </div>
          )}

          {metricKey === "HSTS" && meta?.value && (() => {
            const parts = (meta.value || "").split(';').map(p => p.trim().toLowerCase());
            const maxAgePart = parts.find(p => p.startsWith('max-age='));
            const maxAgeSeconds = maxAgePart ? parseInt(maxAgePart.split('=')[1] || "0", 10) : 0;
            const days = Math.round(maxAgeSeconds / 86400);
            const subdomains = parts.includes('includesubdomains');
            const preload = parts.includes('preload');

            return (
              <div className={`mt-3 p-2 rounded border border-dashed ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"} space-y-1.5`}>
                <div className="flex justify-between text-xs items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Max Age:</span>
                  <span className={`font-mono font-bold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>
                    {days} days
                  </span>
                </div>
                {subdomains && (
                  <div className="flex justify-between text-xs items-center">
                    <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Subdomains:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider">Included</span>
                  </div>
                )}
                {preload && (
                  <div className="flex justify-between text-xs items-center">
                    <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Preload:</span>
                    <span className="text-purple-600 dark:text-purple-400 font-bold text-[10px] uppercase tracking-wider">Enabled</span>
                  </div>
                )}
              </div>
            )
          })()}

          {metricKey === "X_Frame_Options" && meta?.value && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Policy:</span>
                <code className={`px-1.5 py-0.5 rounded font-bold ${darkMode ? "bg-gray-700 text-purple-300" : "bg-gray-200 text-purple-700"}`}>
                  {meta.value}
                </code>
              </div>
            </div>
          )}

          {metricKey === "CSP" && meta?.value && (() => {
            const directives = (meta.value || "").split(';').filter(d => d.trim());
            return (
              <div className={`mt-3 p-2 rounded border border-dashed ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"} space-y-2`}>
                <div className="flex justify-between text-xs items-center mb-1 border-b border-dashed pb-2 border-gray-500/20">
                  <span className={`font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Directives</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${darkMode ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"}`}>{directives.length} Rules</span>
                </div>
                <div className="max-h-32 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar text-[10px] font-mono leading-relaxed">
                  {directives.map((d, i) => (
                    <div key={i} className={`p-1.5 rounded break-all border ${darkMode ? "bg-gray-900/50 border-gray-700 text-gray-300" : "bg-white border-gray-200 text-gray-600"}`}>
                      {d.trim()}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {metricKey === "X_Content_Type_Options" && meta?.value && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>MIME Sniffing:</span>
                <span className={`font-bold ${meta.value.includes('nosniff') ? "text-emerald-500" : "text-rose-500"}`}>
                  {meta.value.includes('nosniff') ? "Disabled (Safe)" : "Enabled (Unsafe)"}
                </span>
              </div>
              <div className={`mt-1 font-mono text-[10px] opacity-70 p-1 rounded ${darkMode ? "bg-black/20" : "bg-gray-200/50"}`}>
                Header: {meta.value}
              </div>
            </div>
          )}

          {metricKey === "Cookies_Secure" && meta?.cookies && (() => {
            const total = meta.cookies.length || 0;
            const insecureCount = meta.insecureCookies?.length || 0;
            const secureCount = total - insecureCount;

            return (
              <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"} space-y-1.5`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Cookies:</span>
                  <span className={`font-bold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Secure (HTTPS only):</span>
                  <span className="text-emerald-500 font-bold">{secureCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Insecure (Missing Flag):</span>
                  <span className={`${insecureCount > 0 ? "text-rose-500" : "text-gray-500"} font-bold`}>{insecureCount}</span>
                </div>
              </div>
            );
          })()}

          {metricKey === "Cookies_HttpOnly" && meta?.cookies && (() => {
            const total = meta.cookies.length || 0;
            const exposedCount = meta.scriptAccessibleCookies?.length || 0;
            const protectedCount = total - exposedCount;

            return (
              <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"} space-y-1.5`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Total Cookies:</span>
                  <span className={`font-bold ${darkMode ? "text-gray-200" : "text-gray-800"}`}>{total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>HttpOnly (No JS Access):</span>
                  <span className="text-emerald-500 font-bold">{protectedCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Exposed (Standard):</span>
                  <span className={`${exposedCount > 0 ? "text-rose-500" : "text-gray-500"} font-bold`}>{exposedCount}</span>
                </div>
              </div>
            );
          })()}

          {metricKey === "Third_Party_Cookies" && meta?.thirdPartyCookies && (() => {
            const total = meta.thirdPartyCookies?.length || 0;
            const domainCount = meta.uniqueDomains ? meta.uniqueDomains.split(',').length : 0;

            return (
              <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"} space-y-1.5`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>3rd-Party Cookies:</span>
                  <span className={`font-bold ${total > 0 ? "text-rose-500" : "text-emerald-500"}`}>{total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Unique Domains:</span>
                  <span className={`font-bold ${domainCount > 0 ? "text-rose-500" : "text-emerald-500"}`}>{domainCount}</span>
                </div>
              </div>
            );
          })()}

          {metricKey === "Google_Safe_Browsing" && meta?.matches && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Security Matches:</span>
                <span className={`font-bold ${meta.matches.length > 0 ? "text-rose-500" : "text-emerald-500"}`}>{meta.matches.length} Threats</span>
              </div>
            </div>
          )}

          {metricKey === "Malware_Scan" && meta?.stats && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"} space-y-1.5`}>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <div className="flex justify-between">
                  <span className="opacity-60">Malicious:</span>
                  <span className={`font-bold ${meta.stats.malicious > 0 ? "text-rose-500" : "text-emerald-500"}`}>{meta.stats.malicious}</span>
                </div>
                <div className="flex justify-between">
                  <span className="opacity-60">Suspicious:</span>
                  <span className={`font-bold ${meta.stats.suspicious > 0 ? "text-amber-500" : "text-emerald-500"}`}>{meta.stats.suspicious}</span>
                </div>
              </div>
            </div>
          )}

          {metricKey === "Blacklist" && meta && (meta.googleSafeBrowsing || meta.virusTotal) && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Safe Browsing:</span>
                <span className={`font-bold ${meta.googleSafeBrowsing?.status === "pass" ? "text-emerald-500" : "text-rose-500"}`}>
                  {meta.googleSafeBrowsing?.status === "pass" ? "Clean" : "Flagged"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>VirusTotal:</span>
                <span className={`font-bold ${meta.virusTotal?.status === "pass" ? "text-emerald-500" : "text-rose-500"}`}>
                  {meta.virusTotal?.status === "pass" ? "Clean" : "Flagged"}
                </span>
              </div>
            </div>
          )}

          {(metricKey === "SQLi_Exposure" || metricKey === "XSS") && data?.payload && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex flex-col gap-1">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Testing Payload:</span>
                <code className={`p-1.5 rounded break-all font-mono text-[10px] ${darkMode ? "bg-gray-900/80 text-rose-300" : "bg-rose-50 text-rose-700"}`}>
                  {data.payload}
                </code>
              </div>
            </div>
          )}

          {metricKey === "Admin_Panel_Public" && meta?.url && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex flex-col gap-1">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Exposed URL:</span>
                <div className={`p-1.5 rounded truncate font-mono text-[10px] ${darkMode ? "bg-gray-900/80 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                  {meta.url}
                </div>
              </div>
            </div>
          )}

          {metricKey === "Weak_Default_Credentials" && meta?.credentials && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Credentials Found:</span>
                <span className="text-rose-500 font-bold font-mono">{meta.credentials}</span>
              </div>
            </div>
          )}

          {metricKey === "Forms_Use_HTTPS" && meta?.insecureForms && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Insecure Forms:</span>
                <span className={`font-bold ${meta.insecureForms.length > 0 ? "text-rose-500" : "text-emerald-500"}`}>{meta.insecureForms.length} Found</span>
              </div>
            </div>
          )}

          {metricKey === "MFA_Enabled" && meta && (meta.foundKeyword || meta.ssoFound) && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex flex-col gap-1">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Authentication Evidence:</span>
                <div className={`p-1.5 rounded truncate italic text-[10px] ${darkMode ? "bg-gray-900/80 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                  {meta.foundKeyword || meta.ssoFound}
                </div>
              </div>
            </div>
          )}

          {metricKey === "GDPR_CCPA" && meta && (meta.foundKeyword || meta.foundSelector) && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex flex-col gap-1">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Compliance Indicator:</span>
                <div className={`p-1.5 rounded truncate italic text-[10px] ${darkMode ? "bg-gray-900/80 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                  {meta.foundKeyword || meta.foundSelector}
                </div>
              </div>
            </div>
          )}

          {metricKey === "Cookie_Consent" && meta?.selector && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex flex-col gap-1">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Banner Selector:</span>
                <div className={`p-1.5 rounded truncate font-mono text-[10px] ${darkMode ? "bg-gray-900/80 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                  {meta.selector}
                </div>
              </div>
            </div>
          )}

          {metricKey === "Privacy_Policy" && meta?.foundLink && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex flex-col gap-1">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Policy Link:</span>
                <div className={`p-1.5 rounded truncate font-mono text-[10px] ${darkMode ? "bg-gray-900/80 text-blue-300" : "bg-blue-50 text-blue-700"}`}>
                  {meta.foundLink}
                </div>
              </div>
            </div>
          )}

          {metricKey === "Data_Collection" && meta && (meta.foundLink || meta.foundHeading) && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-gray-200 bg-gray-50"}`}>
              <div className="flex flex-col gap-1">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Disclosure Evidence:</span>
                <div className={`p-1.5 rounded truncate italic text-[10px] ${darkMode ? "bg-gray-900/80 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                  {meta.foundLink || meta.foundHeading}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className={`mt-auto border-t ${darkMode ? "border-gray-700" : "border-gray-100"}`}>
          <div className="py-3">
            <p className="text-[10px] font-semibold uppercase tracking-wide opacity-70">
              Why it matters: <span className="normal-case font-normal opacity-100">{content.whyItMatters || content.why}</span>
            </p>
          </div>
        </div>

        {!isPassed && analysis && showAnalysis && (
          <div className={`p-5 border-t animate-in fade-in slide-in-from-top-2 ${darkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-100 bg-slate-50"}`}>
            <div className="space-y-3">
              <div>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>Root Cause</h5>
                <p className={`text-xs leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {analysis.cause || "No specific cause identified."}
                </p>
              </div>
              <div>
                <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-blue-500`}>Recommendation</h5>
                <p className={`text-xs leading-relaxed ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                  {analysis.recommendation || "No specific recommendation available."}
                </p>
              </div>

              {metricKey === "Cookies_HttpOnly" && meta?.scriptAccessibleCookies?.length > 0 && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>Exposed Cookies (JS Accessible)</h5>
                  <div className={`mt-1 p-2 rounded max-h-32 overflow-y-auto custom-scrollbar border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <ul className="space-y-1">
                      {meta.scriptAccessibleCookies.map((cookieName, idx) => (
                        <li key={idx} className={`text-[10px] font-mono flex items-center gap-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                          <span className="break-all">{cookieName}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {metricKey === "Cookies_Secure" && meta?.insecureCookies?.length > 0 && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>Insecure Cookies (HTTP Only)</h5>
                  <div className={`mt-1 p-2 rounded max-h-32 overflow-y-auto custom-scrollbar border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <ul className="space-y-1">
                      {meta.insecureCookies.map((cookieName, idx) => (
                        <li key={idx} className={`text-[10px] font-mono flex items-center gap-2 ${darkMode ? "text-gray-300" : "text-gray-600"}`}>
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                          <span className="break-all">{cookieName}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {metricKey === "HTTPS" && meta?.protocol && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>Detected Protocol</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                    {meta.protocol}
                  </div>
                </div>
              )}

              {metricKey === "SSL" && meta?.validTo && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-amber-500`}>Certificate Expiry</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-amber-500/5 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-100 text-amber-700"}`}>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"></span>
                    {new Date(meta.validTo).toLocaleString()}
                  </div>
                </div>
              )}

              {metricKey === "TLS_Version" && meta?.version && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>Detected Version</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                    {meta.version}
                  </div>
                </div>
              )}

              {metricKey === "HSTS" && meta?.value && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>HSTS Header Value</h5>
                  <div className={`mt-1 p-2 rounded border flex items-start gap-2 font-mono text-[10px] break-all ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1 flex-shrink-0"></span>
                    {meta.value}
                  </div>
                </div>
              )}

              {metricKey === "CSP" && meta?.value && (() => {
                const directives = (meta.value || "").split(';').filter(d => d.trim());
                return (
                  <div>
                    <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>CSP Directives</h5>
                    <div className={`mt-1 p-2 rounded max-h-48 overflow-y-auto custom-scrollbar border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                      <ul className="space-y-1.5">
                        {directives.map((d, i) => (
                          <li key={i} className={`p-2 rounded text-[10px] font-mono flex items-start gap-2 border border-dashed ${darkMode ? "bg-gray-900/50 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1 flex-shrink-0"></span>
                            <span className="break-all">{d.trim()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}

              {metricKey === "X_Frame_Options" && meta?.value && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>X-Frame-Options Value</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                    {meta.value}
                  </div>
                </div>
              )}

              {metricKey === "X_Content_Type_Options" && meta?.value && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>X-Content-Type-Options Value</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                    {meta.value}
                  </div>
                </div>
              )}

              {/* Dynamic Evidence for Remaining Parameters */}
              {(metricKey === "SQLi_Exposure" || metricKey === "XSS") && meta?.payload && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>Testing Payload</h5>
                  <div className={`mt-1 p-2 rounded border font-mono text-[10px] break-all ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1 flex-shrink-0"></span>
                      <span>{meta.payload}</span>
                    </div>
                  </div>
                </div>
              )}

              {metricKey === "Google_Safe_Browsing" && meta?.matches?.length > 0 && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>Detected Threats</h5>
                  <div className={`mt-1 p-2 rounded max-h-32 overflow-y-auto custom-scrollbar border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <ul className="space-y-2">
                      {meta.matches.map((match, idx) => (
                        <li key={idx} className={`p-2 rounded border flex flex-col gap-1 ${darkMode ? "bg-rose-500/10 border-rose-500/20" : "bg-rose-50 border-rose-100"}`}>
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold uppercase text-rose-500 flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span>
                              {match.threatType}
                            </span>
                            <span className={`opacity-70 ${darkMode ? "text-gray-400" : "text-gray-600"}`}>{match.platformType}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {metricKey === "Malware_Scan" && meta?.stats && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-blue-500`}>Security Vendor Stats</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Malicious', val: meta.stats.malicious, color: 'text-rose-500' },
                      { label: 'Suspicious', val: meta.stats.suspicious, color: 'text-amber-500' },
                      { label: 'Harmless', val: meta.stats.harmless, color: 'text-emerald-500' },
                      { label: 'Undetected', val: meta.stats.undetected, color: 'text-gray-400' }
                    ].map(s => (
                      <div key={s.label} className={`p-1.5 rounded flex justify-between items-center ${darkMode ? "bg-gray-800" : "bg-gray-50"}`}>
                        <span className="text-[10px] opacity-70">{s.label}</span>
                        <span className={`text-[10px] font-bold ${s.color}`}>{s.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {metricKey === "Admin_Panel_Public" && meta?.url && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>Exposed URL</h5>
                  <div className={`mt-1 p-2 rounded border ${darkMode ? "bg-blue-500/5 border-blue-500/20" : "bg-blue-50 border-blue-100"}`}>
                    <a href={meta.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-1 text-[10px] font-mono break-all hover:underline ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                      {meta.url}
                    </a>
                  </div>
                </div>
              )}

              {metricKey === "Forms_Use_HTTPS" && meta?.insecureForms?.length > 0 && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>Insecure Form Actions</h5>
                  <div className={`mt-1 p-2 rounded max-h-32 overflow-y-auto custom-scrollbar border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <ul className="space-y-1.5">
                      {meta.insecureForms.map((action, idx) => (
                        <li key={idx} className={`p-2 rounded text-[10px] font-mono flex items-center gap-2 border border-dashed ${darkMode ? "bg-gray-900/50 border-gray-700 text-gray-300" : "bg-gray-50 border-gray-200 text-gray-600"}`}>
                          <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                          <span className="break-all">{action || "(Empty Action)"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {metricKey === "Weak_Default_Credentials" && meta?.credentials && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>Identified Credentials</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                    {meta.credentials}
                  </div>
                </div>
              )}

              {(metricKey === "MFA_Enabled" || metricKey === "GDPR_CCPA") && meta && (meta.foundKeyword || meta.ssoFound) && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-emerald-500`}>Evidence Found</h5>
                  <div className={`p-2 rounded text-[10px] italic ${darkMode ? "bg-gray-800 text-gray-300" : "bg-emerald-50 text-emerald-700"}`}>
                    "{meta.foundKeyword || meta.ssoFound}"
                  </div>
                </div>
              )}

              {(metricKey === "Privacy_Policy" || metricKey === "Data_Collection") && meta?.foundLink && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-emerald-500`}>Detected Link</h5>
                  <a href={meta.foundLink} target="_blank" rel="noopener noreferrer" className={`block p-2 rounded text-[10px] font-mono break-all hover:underline ${darkMode ? "bg-gray-800 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                    {meta.foundLink}
                  </a>
                </div>
              )}

              {metricKey === "Third_Party_Cookies" && meta?.uniqueDomains && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>Third-Party Domains</h5>
                  <div className={`mt-1 p-3 rounded max-h-32 overflow-y-auto custom-scrollbar border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
                    <div className="flex flex-wrap gap-1.5">
                      {meta.uniqueDomains.split(',').map((domain, idx) => (
                        <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-mono flex items-center gap-2 ${darkMode ? "bg-rose-500/10 border-rose-500/20 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-600"}`}>
                          <span className="w-1 h-1 bg-current rounded-full"></span>
                          {domain.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {metricKey === "Blacklist" && meta && (meta.googleSafeBrowsing || meta.virusTotal) && (
                <div className="space-y-2">
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-rose-500`}>Blacklist Sources</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {meta.googleSafeBrowsing && (
                      <div className={`p-2 rounded border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                        <div className="text-[10px] opacity-70">Google Safe</div>
                        <div className={`text-[10px] font-bold ${meta.googleSafeBrowsing.status === 'pass' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {meta.googleSafeBrowsing.status === 'pass' ? 'Clean' : 'Flagged'}
                        </div>
                      </div>
                    )}
                    {meta.virusTotal && (
                      <div className={`p-2 rounded border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`}>
                        <div className="text-[10px] opacity-70">VirusTotal</div>
                        <div className={`text-[10px] font-bold ${meta.virusTotal.status === 'pass' ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {meta.virusTotal.status === 'pass' ? 'Clean' : 'Flagged'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {metricKey === "Cookie_Consent" && meta?.selector && (
                <div>
                  <h5 className={`text-xs font-bold uppercase tracking-wider mb-1 text-emerald-500`}>Detected Selector</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                    {meta.selector}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Section = ({ title, icon: Icon, children, darkMode }) => (
  <div className="space-y-4">
    <div className="flex items-center gap-3 px-2">
      <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-600"}`}>
        <Icon size={20} />
      </div>
      <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>
        {title}
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

export default function Security_Compilance() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const darkMode = theme === "dark";

  const auditSteps = useMemo(() => [
    { icon: <Lock className="w-8 h-8 text-blue-500" />, title: "SSL & Encryption", text: "Verifying HTTPS redirection, SSL certificate validity, TLS handshake versions, and HSTS enforcement..." },
    { icon: <Bug className="w-8 h-8 text-rose-500" />, title: "Vulnerability Scan", text: "Simulating SQL Injection and XSS attacks, while cross-referencing with global threat intelligence databases..." },
    { icon: <ShieldCheck className="w-8 h-8 text-teal-500" />, title: "Security Headers", text: "Auditing Content Security Policy (CSP), anti-clickjacking headers, and secure HttpOnly cookie flags..." },
    { icon: <Globe2 className="w-8 h-8 text-indigo-500" />, title: "Compliance", text: "Evaluating GDPR/CCPA readiness, privacy policy visibility, and auditing third-party cookie tracking..." },
    { icon: <Key className="w-8 h-8 text-amber-500" />, title: "Access Control", text: "Testing for exposed admin panels, weak default credentials, secure form submission, and MFA availability..." },
  ], []);

  const [activeStep, setActiveStep] = React.useState(0);

  React.useEffect(() => {
    if (loading || !data?.securityOrCompliance) {
      const interval = setInterval(() => {
        setActiveStep((prev) => (prev + 1) % auditSteps.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading, data, auditSteps.length]);

  if (!data?.securityOrCompliance) {
    return (
      <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>
            <div>
              <UrlHeader data={data} darkMode={darkMode} />
            </div>

            <div className="flex flex-col xl:flex-row min-h-[300px]">
              {data?.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              <div className="flex-1 flex items-center justify-center">
                <div className="w-full">
                  <SecurityShimmer darkMode={darkMode} steps={auditSteps} currentStep={activeStep} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const metric = data?.securityOrCompliance || {};
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";

  const allMetrics = Object.values(metric).filter(val => typeof val === 'object' && val !== null && 'status' in val);
  const passedCount = allMetrics.filter(m => m.status === "pass").length;
  const warningCount = allMetrics.filter(m => m.status === "warning").length;
  const failedCount = allMetrics.filter(m => m.status === "fail").length;

  return (
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>
          <div>
            <UrlHeader data={data} darkMode={darkMode} />
          </div>

          <div className={`flex flex-col xl:flex-row ${data.report === "All" ? "" : "min-h-[300px]"}`}>
            {data.report !== "All" && (
              <div className={`w-full xl:w-[45%] ${data.report === "All" ? "p-6 lg:p-10" : "p-3 lg:p-4"} flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                <div className="w-full relative z-10">
                  <LivePreview data={data} loading={loading} variant="plain" />
                </div>
              </div>
            )}

            <div className={`flex-1 ${data.report === "All" ? "px-6 pb-4 pt-2 lg:px-10 lg:pt-2" : "px-6 pb-4 pt-4 lg:px-12 lg:pt-6"} flex flex-col justify-center`}>
              <div className={`w-full ${data.report === "All" ? "" : "max-w-2xl mx-auto"} ${data.report === "All" ? "space-y-10" : "space-y-8"}`}>
                <div className={`flex flex-col md:flex-row items-center ${data.report === "All" ? "gap-10 md:gap-14 justify-between" : "gap-8 md:gap-12 justify-center"}`}>
                  <div className={`flex-1 ${data.report === "All" ? "space-y-5" : "space-y-4"} text-left order-2 md:order-1`}>
                    <div className={`${data.report === "All" ? "space-y-2" : "space-y-1.5"}`}>
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${darkMode ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : "bg-blue-100/50 text-blue-600 border border-blue-200"}`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Security Audit</span>
                      </div>
                      <h3 className={`${data.report === "All" ? "text-3xl lg:text-5xl" : "text-2xl lg:text-4xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                        Security & <span className="text-blue-500">Compliance</span>
                      </h3>
                      <p className={`text-sm leading-relaxed opacity-70 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                        Comprehensive analysis of your web application's security posture.
                      </p>
                    </div>

                    <div className={`flex flex-wrap items-center ${data.report === "All" ? "gap-6" : "gap-5"}`}>
                      <div className={`flex items-center ${data.report === "All" ? "gap-5" : "gap-4"}`}>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-emerald-500" />
                          <span className="text-sm font-bold">{passedCount} Passed</span>
                        </div>
                        {warningCount > 0 && (
                          <div className="flex items-center gap-2">
                            <AlertTriangle size={18} className="text-amber-500" />
                            <span className="text-sm font-bold">{warningCount} Warning</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <XCircle size={18} className="text-rose-500" />
                          <span className="text-sm font-bold">{failedCount} Failed</span>
                        </div>
                      </div>
                      <div className={`w-px h-4 ${darkMode ? "bg-slate-800" : "bg-slate-200 hidden md:block"}`}></div>
                      <button
                        onClick={() => setSelectedMetricInfo(scoreCalculationInfo)}
                        className={`flex items-center gap-2 text-sm font-bold transition-all ${darkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"}`}
                      >
                        <Info size={16} />
                        <span className="border-b border-transparent hover:border-current">Metric Methodology</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative flex-shrink-0 group cursor-default order-1 md:order-2">
                    <div className={`absolute -inset-8 rounded-full blur-3xl opacity-25 transition-opacity duration-700 group-hover:opacity-40 ${metric?.Percentage >= 80 ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                    <CircularProgress value={metric?.Percentage || 0} size={data.report === "All" ? 180 : 150} stroke={14} />
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-0.5">
                      <span className={`${data.report === "All" ? "text-5xl" : "text-3xl"} font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>{metric?.Percentage || 0}%</span>
                      <span className="text-[11px] font-bold uppercase tracking-[0.2em] opacity-50">SCORE</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Section title="Network & Encryption" icon={Lock} darkMode={darkMode}>
          {["HTTPS", "SSL", "TLS_Version", "HSTS"].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} onInfo={() => setSelectedParameterInfo({ ...educationalContent[key], icon: iconMap[key] || Shield })} />
          ))}
        </Section>

        <Section title="Vulnerability Detection" icon={Bug} darkMode={darkMode}>
          {[
            "SQLi_Exposure", "XSS", "Google_Safe_Browsing", "Blacklist", "Malware_Scan"
          ].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} onInfo={() => setSelectedParameterInfo({ ...educationalContent[key], icon: iconMap[key] || Shield })} />
          ))}
        </Section>

        <Section title="Access Control & Authentication" icon={Key} darkMode={darkMode}>
          {[
            "Weak_Default_Credentials", "MFA_Enabled", "Admin_Panel_Public", "Forms_Use_HTTPS"
          ].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} onInfo={() => setSelectedParameterInfo({ ...educationalContent[key], icon: iconMap[key] || Shield })} />
          ))}
        </Section>

        <Section title="Security Headers & Cookies" icon={ShieldCheck} darkMode={darkMode}>
          {[
            "CSP", "X_Frame_Options", "X_Content_Type_Options", "Cookies_Secure", "Cookies_HttpOnly"
          ].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} onInfo={() => setSelectedParameterInfo({ ...educationalContent[key], icon: iconMap[key] || Shield })} />
          ))}
        </Section>

        <Section title="Compliance & Privacy" icon={Globe2} darkMode={darkMode}>
          {[
            "Cookie_Consent", "GDPR_CCPA", "Privacy_Policy",
            "Data_Collection", "Third_Party_Cookies"
          ].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} onInfo={() => setSelectedParameterInfo({ ...educationalContent[key], icon: iconMap[key] || Shield })} />
          ))}
        </Section>
      </main>

      <MetricInfoModal
        isOpen={!!selectedMetricInfo}
        onClose={() => setSelectedMetricInfo(null)}
        info={selectedMetricInfo}
        darkMode={darkMode}
      />
      <ParameterInfoModal
        isOpen={!!selectedParameterInfo}
        onClose={() => setSelectedParameterInfo(null)}
        info={selectedParameterInfo}
        darkMode={darkMode}
      />
    </div>
  );
}