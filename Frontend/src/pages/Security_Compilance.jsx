import React, { useContext, useMemo } from "react";
import { AuditShimmer } from "../components/reusablecomponent/AuditShimmer";
import UrlHeader from "../components/UrlHeader";
import ReportRestrictionWrapper from "../components/ReportRestrictionWrapper";
import PillarHeader from "../components/reusablecomponent/PillarHeader";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import LivePreview from "../components/LivePreview";
import {
  Shield, Lock, AlertTriangle, CheckCircle, XCircle,
  Info, Server, Eye, FileText,
  Layout, Code, Bug, Share2, CalendarClock,
  Database, Key, Globe2, Layers, ShieldCheck, Loader2, CreditCard
} from "lucide-react";
import MetricInfoModal from "../components/MetricInfoModal";
import ParameterInfoModal from "../components/ParameterInfoModal";
import { InfoDetails } from "../components/InfoDetails";
import AskAIButton from "../components/AskAIButton";
import { isVisibleForAudience, isActionableParam } from "../config/parameterAudience";

const iconMap = {
  HTTPS: Lock,
  SSL: ShieldCheck,
  SSL_Expiry: CalendarClock,
  HSTS: Server,
  TLS_Version: Layers,
  X_Frame_Options: Layout,
  CSP: Code,
  X_Content_Type_Options: FileText,
  Cookie_Flags: Lock,
  Reputation: ShieldCheck,
  SQLi_Exposure: Database,
  XSS: Code,
  Cookie_Consent: Info,
  Privacy_Policy: FileText,
  Privacy_Compliance: Globe2,
  Legal_Disclaimers: FileText,
  Forms_Use_HTTPS: Lock,
  Weak_Default_Credentials: Key,
  Admin_Panel_Public: Eye,
  Third_Party_Cookies: Share2,
  Finance_Form_Security: CreditCard,
};

const educationalContent = InfoDetails;
const scoreCalculationInfo = InfoDetails.Security_And_Compliance_Methodology;


const MetricCard = ({ metricKey, data, darkMode, onInfo }) => {
  const { status, details, meta, analysis } = data || {};
  const isPassed = status === "pass";
  const isWarning = status === "warning";
  const isNA = status === "not_applicable" || data?.infoOnly;
  const [showAnalysis, setShowAnalysis] = React.useState(false);

  const Icon = iconMap[metricKey] || Shield;
  const content = educationalContent[metricKey] || { desc: "Security check.", why: "Important for security." };
  const reasons = content.actualReasonsForFailure || [];
  const recommendations = content.howToOvercomeFailure || [];
  const title = metricKey.replaceAll("_", " ");

  // Simple Colors
  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-card border-line";
  const textColor = darkMode ? "text-gray-100" : "text-ink";
  const subTextColor = darkMode ? "text-gray-400" : "text-muted";

  let statusColor = darkMode ? "text-rose-400 bg-rose-500/10 border-rose-500/20" : "text-rose-600 bg-rose-50 border-rose-100";
  let statusText = "Failed";

  if (isPassed) {
    statusColor = darkMode ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-emerald-600 bg-emerald-50 border-emerald-100";
    statusText = "Passed";
  } else if (isWarning) {
    statusColor = darkMode ? "text-amber-400 bg-amber-500/10 border-amber-500/20" : "text-amber-600 bg-amber-50 border-amber-100";
    statusText = "Warning";
  } else if (isNA) {
    statusColor = darkMode ? "text-slate-400 bg-slate-500/10 border-slate-500/20" : "text-slate-600 bg-slate-100 border-slate-200";
    statusText = "Not Applicable";
  }

  const hasMetaDetails = meta && Object.keys(meta).some(k => k !== 'count' && k !== 'value');

  return (
    <div className={`relative overflow-hidden rounded-xl border ${cardBg} shadow-sm hover:shadow-md transition-shadow group flex flex-col`}>
      <div className="p-5 space-y-4 flex-grow">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-lg ${darkMode ? "bg-gray-700" : "bg-accentsoft"} group-hover:scale-110 transition-transform duration-300`}>
              <Icon size={24} className={darkMode ? "text-blue-400" : "text-accent"} />
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${textColor}`}>
                {title}
                {(data?.infoOnly || meta?.informational) && status !== "not_applicable" && <span className={`font-medium ${subTextColor}`} title="Informational — not counted in the section score"> (Info-only)</span>}
              </h3>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit border ${statusColor}`}>
                  {statusText}
                </span>
                {data?.confidence && (
                  <span
                    title="Measurement confidence: field = real-data API, measured = transport/header/cert, heuristic = DOM inference"
                    className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${darkMode ? "text-slate-400 border-slate-600 bg-slate-700/40" : "text-slate-500 border-slate-200 bg-slate-100"}`}
                  >
                    {data.confidence}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPassed && !isNA && isActionableParam(metricKey) && (
              <button
                onClick={() => setShowAnalysis(!showAnalysis)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${showAnalysis
                  ? (darkMode ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-accentsoft text-accent border border-accentsoft")
                  : (darkMode ? "text-gray-400 hover:text-white hover:bg-gray-700 border border-transparent" : "text-faint hover:text-ink hover:bg-cardsoft border border-transparent")
                  }`}
                title={showAnalysis ? "Hide Detail" : "View Detail"}
              >
                <span className="text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap">
                  {showAnalysis ? "Hide Detail" : "View Detail"}
                </span>
              </button>
            )}
            {onInfo && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInfo({ ...content, icon: Icon, thresholds: meta?.threshold || content.thresholds });
                }}
                className={`p-2 rounded-lg hover:bg-line dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-faint hover:text-ink"}`}
                title="View Methodology"
              >
                <Info size={18} />
              </button>
            )}
          </div>
        </div>



        {/* Dynamic Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className={`text-[10px] font-semibold uppercase tracking-widest ${darkMode ? "text-gray-500" : "text-faint"}`}>
                Status Detail
              </h4>
              <div className={`h-[1px] flex-grow ${darkMode ? "bg-gray-700/50" : "bg-line"}`}></div>
            </div>
            <div className={`p-3 rounded-lg border transition-all duration-300 ${isPassed ? (darkMode ? "bg-emerald-500/5 border-emerald-500/10" : "bg-emerald-50/50 border-emerald-100") :
              isWarning ? (darkMode ? "bg-amber-500/5 border-amber-500/20" : "bg-amber-50/50 border-amber-100") :
                isNA ? (darkMode ? "bg-slate-500/5 border-slate-500/20" : "bg-slate-50 border-slate-200") :
                (darkMode ? "bg-rose-500/5 border-rose-500/20" : "bg-rose-50/50 border-rose-100")
              }`}>
              <p className={`text-sm font-semibold leading-relaxed ${isPassed ? "text-emerald-600 dark:text-emerald-400" :
                isWarning ? "text-amber-600 dark:text-amber-400" :
                  isNA ? "text-slate-500 dark:text-slate-400" :
                  "text-rose-600 dark:text-rose-400"
                }`}>
                {details || "No details available"}
              </p>
            </div>
          </div>

          {/* Ask AI Button */}
          {!isPassed && !isNA && (
            <AskAIButton
              finding={{
                type: 'Security & Compliance',
                title: title,
                details: details || '',
                severity: isPassed ? 'pass' : isWarning ? 'warning' : 'critical',
                url: ''
              }}
              darkMode={darkMode}
              meta={meta}
              paramKey={metricKey}
            />
          )}

          {metricKey === "HTTPS" && meta?.protocol && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Protocol:</span>
                <code className={`px-1.5 py-0.5 rounded font-mono font-semibold ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-accentsoft text-accent"}`}>
                  {meta.protocol}
                </code>
              </div>
              {(meta.activeCount !== undefined || meta.passiveCount !== undefined) && (
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Mixed Content:</span>
                  <span className={`font-semibold ${meta.activeCount > 0 ? "text-rose-500" : meta.passiveCount > 0 ? "text-amber-500" : "text-emerald-500"}`}>
                    {meta.activeCount > 0 || meta.passiveCount > 0 ? `${meta.activeCount || 0} active / ${meta.passiveCount || 0} passive` : "None"}
                  </span>
                </div>
              )}
            </div>
          )}

          {metricKey === "SSL" && meta?.validTo && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Expires:</span>
                <code className={`px-1.5 py-0.5 rounded font-mono font-semibold ${darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-700"}`}>
                  {new Date(meta.validTo).toLocaleDateString()}
                </code>
              </div>
            </div>
          )}

          {metricKey === "TLS_Version" && meta?.version && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Version:</span>
                <code className={`px-1.5 py-0.5 rounded font-mono font-semibold ${darkMode ? "bg-purple-500/10 text-purple-400" : "bg-purple-50 text-purple-700"}`}>
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
              <div className={`mt-3 p-2 rounded border border-dashed ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"} space-y-1.5`}>
                <div className="flex justify-between text-xs items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Max Age:</span>
                  <span className={`font-mono font-semibold ${darkMode ? "text-gray-200" : "text-inksoft"}`}>
                    {days} days
                  </span>
                </div>
                {subdomains && (
                  <div className="flex justify-between text-xs items-center">
                    <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Subdomains:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[10px] uppercase tracking-wider">Included</span>
                  </div>
                )}
                {preload && (
                  <div className="flex justify-between text-xs items-center">
                    <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Preload:</span>
                    <span className="text-purple-600 dark:text-purple-400 font-semibold text-[10px] uppercase tracking-wider">Enabled</span>
                  </div>
                )}
              </div>
            )
          })()}

          {metricKey === "X_Frame_Options" && meta?.value && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Policy:</span>
                <code className={`px-1.5 py-0.5 rounded font-semibold ${darkMode ? "bg-gray-700 text-purple-300" : "bg-line text-purple-700"}`}>
                  {meta.value}
                </code>
              </div>
            </div>
          )}

          {metricKey === "CSP" && meta?.value && (() => {
            const directives = (meta.value || "").split(';').filter(d => d.trim());
            return (
              <div className={`mt-3 p-2 rounded border border-dashed ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"} space-y-2`}>
                <div className="flex justify-between text-xs items-center mb-1 border-b border-dashed pb-2 border-gray-500/20">
                  <span className={`font-semibold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-muted"}`}>Directives</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${darkMode ? "bg-blue-500/20 text-blue-300" : "bg-accentsoft text-accent"}`}>{directives.length} Rules</span>
                </div>
                <div className="max-h-32 overflow-y-auto pr-1 space-y-1.5 custom-scrollbar text-[10px] font-mono leading-relaxed">
                  {directives.map((d, i) => (
                    <div key={i} className={`p-1.5 rounded break-all border ${darkMode ? "bg-gray-900/50 border-gray-700 text-gray-300" : "bg-card border-line text-muted"}`}>
                      {d.trim()}
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {metricKey === "X_Content_Type_Options" && meta?.value && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>MIME Sniffing:</span>
                <span className={`font-semibold ${meta.value.includes('nosniff') ? "text-emerald-500" : "text-rose-500"}`}>
                  {meta.value.includes('nosniff') ? "Disabled (Safe)" : "Enabled (Unsafe)"}
                </span>
              </div>
              <div className={`mt-1 font-mono text-[10px] opacity-70 p-1 rounded ${darkMode ? "bg-black/20" : "bg-line/50"}`}>
                Header: {meta.value}
              </div>
            </div>
          )}

          {metricKey === "Third_Party_Cookies" && meta?.thirdPartyCookies && (() => {
            const total = meta.thirdPartyCookies?.length || 0;
            const domainCount = Array.isArray(meta.uniqueDomains)
              ? meta.uniqueDomains.length
              : (meta.uniqueDomains ? String(meta.uniqueDomains).split(',').length : 0);
            const disclosed = meta.disclosed;

            return (
              <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"} space-y-1.5`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>3rd-Party Cookies:</span>
                  <span className={`font-semibold ${total > 0 ? (disclosed ? "text-amber-500" : "text-rose-500") : "text-emerald-500"}`}>{total}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Unique Domains:</span>
                  <span className={`font-semibold ${darkMode ? "text-gray-300" : "text-inksoft"}`}>{domainCount}</span>
                </div>
                {total > 0 && (
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Disclosed:</span>
                    <span className={`font-semibold ${disclosed ? "text-emerald-500" : "text-rose-500"}`}>
                      {disclosed ? `Yes (${meta.hasConsent ? "consent" : ""}${meta.hasConsent && meta.hasPrivacyPolicy ? " + " : ""}${meta.hasPrivacyPolicy ? "policy" : ""})` : "No"}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}

          {(metricKey === "SQLi_Exposure" || metricKey === "XSS") && data?.payload && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"}`}>
              <div className="flex flex-col gap-1">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Testing Payload:</span>
                <code className={`p-1.5 rounded break-all font-mono text-[10px] ${darkMode ? "bg-gray-900/80 text-rose-300" : "bg-rose-50 text-rose-700"}`}>
                  {data.payload}
                </code>
              </div>
            </div>
          )}

          {metricKey === "Admin_Panel_Public" && meta?.url && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"}`}>
              <div className="flex flex-col gap-1">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Exposed URL:</span>
                <div className={`p-1.5 rounded truncate font-mono text-[10px] ${darkMode ? "bg-gray-900/80 text-blue-300" : "bg-accentsoft text-accent"}`}>
                  {meta.url}
                </div>
              </div>
            </div>
          )}

          {metricKey === "Weak_Default_Credentials" && meta?.credentials && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"}`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Credentials Found:</span>
                <span className="text-rose-500 font-semibold font-mono">{meta.credentials}</span>
              </div>
            </div>
          )}

          {metricKey === "Forms_Use_HTTPS" && meta?.insecureForms && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"}`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Insecure Forms:</span>
                <span className={`font-semibold ${meta.insecureForms.length > 0 ? "text-rose-500" : "text-emerald-500"}`}>{meta.insecureForms.length} Found</span>
              </div>
            </div>
          )}

          {metricKey === "SSL_Expiry" && meta?.validTo && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Expires:</span>
                <code className={`px-1.5 py-0.5 rounded font-mono font-semibold ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-accentsoft text-accent"}`}>{new Date(meta.validTo).toLocaleDateString()}</code>
              </div>
              {typeof meta.daysUntilExpiry === "number" && (
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Days Left:</span>
                  <span className={`font-semibold ${meta.daysUntilExpiry < 14 ? "text-rose-500" : meta.daysUntilExpiry < 30 ? "text-amber-500" : "text-emerald-500"}`}>{meta.daysUntilExpiry}</span>
                </div>
              )}
            </div>
          )}

          {metricKey === "Reputation" && meta && (meta.googleSafeBrowsing || meta.virusTotal) && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"} space-y-1.5`}>
              {["googleSafeBrowsing", "virusTotal"].map((src) => {
                const r = meta[src];
                if (!r) return null;
                const label = src === "googleSafeBrowsing" ? "Safe Browsing" : "VirusTotal";
                const txt = r.status === "pass" ? "Clean" : r.status === "fail" ? "Flagged" : "N/A";
                const col = r.status === "pass" ? "text-emerald-500" : r.status === "fail" ? "text-rose-500" : "text-slate-400";
                return (
                  <div key={src} className="flex justify-between items-center">
                    <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>{label}:</span>
                    <span className={`font-semibold ${col}`}>{txt}</span>
                  </div>
                );
              })}
            </div>
          )}

          {metricKey === "Cookie_Flags" && meta?.cookies && (() => {
            const total = meta.total ?? meta.cookies.length ?? 0;
            const rows = [
              ["Total Cookies", total, false],
              ["Missing Secure", meta.insecureCookies?.length || 0, true],
              ["Missing HttpOnly", meta.scriptAccessibleCookies?.length || 0, true],
              ["Missing SameSite", meta.noSameSiteCookies?.length || 0, true],
            ];
            return (
              <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"} space-y-1.5`}>
                {rows.map(([label, val, bad]) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>{label}:</span>
                    <span className={`font-semibold ${bad ? (val > 0 ? "text-rose-500" : "text-emerald-500") : (darkMode ? "text-gray-200" : "text-inksoft")}`}>{val}</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {metricKey === "Privacy_Compliance" && meta && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>GDPR/CCPA Notice:</span>
                <span className={`font-semibold ${meta.gdprPass ? "text-emerald-500" : "text-rose-500"}`}>{meta.gdprPass ? "Found" : "Missing"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Data Disclosure:</span>
                <span className={`font-semibold ${meta.dcPass ? "text-emerald-500" : "text-rose-500"}`}>{meta.dcPass ? "Found" : "Missing"}</span>
              </div>
            </div>
          )}

          {metricKey === "Legal_Disclaimers" && meta?.pageType && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"} space-y-1.5`}>
              <div className="flex justify-between items-center">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Page Type:</span>
                <code className={`px-1.5 py-0.5 rounded font-mono font-semibold uppercase ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-accentsoft text-accent"}`}>{meta.pageType}</code>
              </div>
              {meta.details && Object.entries(meta.details).map(([label, present]) => (
                <div key={label} className="flex justify-between items-center gap-2">
                  <span className={`font-medium truncate ${darkMode ? "text-gray-400" : "text-muted"}`}>{label}:</span>
                  <span className={`font-semibold flex items-center gap-1 flex-shrink-0 ${present ? "text-emerald-500" : "text-rose-500"}`}>
                    {present ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {present ? "Present" : "Missing"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {meta?.breakdown?.length > 0 && (() => {
            const detected = meta.detectedProviders?.length
              ? { label: "Detected Provider", items: meta.detectedProviders }
              : null;
            const scoreLabel = metricKey === "Finance_Form_Security" ? "PCI Score" : "Score";
            const missing = (meta.maxScore ?? 10) - (meta.rawScore ?? 0);
            return (
              <div className={`mt-3 p-2 rounded border border-dashed text-xs space-y-2 ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"}`}>
                <div className="flex justify-between items-center">
                  <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>{scoreLabel}:</span>
                  <span className={`font-semibold ${(meta.rawScore ?? 0) >= (meta.maxScore ?? 10) ? "text-emerald-500" : (meta.rawScore ?? 0) > 0 ? "text-amber-500" : "text-rose-500"}`}>{meta.rawScore ?? 0} / {meta.maxScore ?? 10}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  {meta.breakdown.map((b, i) => (
                    <div key={i} className="flex flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 min-w-0">
                          {b.earned
                            ? <CheckCircle className="w-3 h-3 flex-shrink-0 text-emerald-500" />
                            : <XCircle className="w-3 h-3 flex-shrink-0 text-rose-500" />}
                          <span className={`truncate ${b.earned ? "text-emerald-600" : (darkMode ? "text-gray-300" : "text-inksoft")}`}>{b.label}</span>
                        </span>
                        <span className={`flex-shrink-0 font-semibold ${b.earned ? "text-emerald-500" : "text-gray-400"}`}>{b.earned ? `+${b.points}` : `0 / ${b.points}`}</span>
                      </div>
                      {!b.earned && (
                        <span className={`pl-[18px] text-[10px] leading-snug ${darkMode ? "text-gray-400" : "text-muted"}`}>
                          To earn: {b.detail}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {missing > 0 && (
                  <div className={`pt-1.5 mt-0.5 border-t text-[10px] font-semibold ${darkMode ? "border-gray-700 text-amber-300" : "border-gray-200 text-amber-600"}`}>
                    Missing {missing} pt{missing === 1 ? "" : "s"} to reach {meta.maxScore ?? 10}/{meta.maxScore ?? 10} — complete the unchecked steps above.
                  </div>
                )}

                {detected && (
                  <div className="flex flex-col gap-1">
                    <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>{detected.label}:</span>
                    <div className={`p-1.5 rounded truncate italic text-[10px] ${darkMode ? "bg-gray-900/80 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                      {detected.items.join(", ")}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {metricKey === "Cookie_Consent" && meta?.selector && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"}`}>
              <div className="flex flex-col gap-1">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Banner Selector:</span>
                <div className={`p-1.5 rounded truncate font-mono text-[10px] ${darkMode ? "bg-gray-900/80 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>
                  {meta.selector}
                </div>
              </div>
            </div>
          )}

          {metricKey === "Privacy_Policy" && meta?.foundLink && (
            <div className={`mt-3 p-2 rounded border border-dashed text-xs ${darkMode ? "border-gray-700 bg-gray-800/50" : "border-line bg-cardsoft"}`}>
              <div className="flex flex-col gap-1">
                <span className={`font-medium ${darkMode ? "text-gray-400" : "text-muted"}`}>Policy Link:</span>
                <div className={`p-1.5 rounded truncate font-mono text-[10px] ${darkMode ? "bg-gray-900/80 text-blue-300" : "bg-accentsoft text-accent"}`}>
                  {meta.foundLink}
                </div>
              </div>
            </div>
          )}

        </div>


        {!isPassed && showAnalysis && (
          <div className={`p-5 border-t animate-in fade-in slide-in-from-top-2 ${darkMode ? "border-gray-700 bg-gray-900/50" : "border-linesoft bg-cardsoft"}`}>
            <div className="space-y-3">
              {(analysis?.cause || reasons.length > 0) && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1.5 text-rose-500`}>Root Cause</h5>
                  {analysis?.cause ? (
                    <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-200" : "text-inksoft"}`}>
                      {analysis.cause}
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {reasons.map((reason, idx) => (
                        <li key={idx} className={`text-sm leading-relaxed flex items-start gap-2 ${darkMode ? "text-gray-200" : "text-inksoft"}`}>
                          <span className="w-1.5 h-1.5 mt-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                          <span>{reason}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
              {(analysis?.recommendation || recommendations.length > 0) && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1.5 text-accent`}>Recommendation</h5>
                  {analysis?.recommendation ? (
                    <p className={`text-sm leading-relaxed ${darkMode ? "text-gray-200" : "text-inksoft"}`}>
                      {analysis.recommendation}
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {recommendations.map((rec, idx) => (
                        <li key={idx} className={`text-sm leading-relaxed flex items-start gap-2 ${darkMode ? "text-gray-200" : "text-inksoft"}`}>
                          <span className="w-1.5 h-1.5 mt-1.5 bg-accent rounded-full flex-shrink-0"></span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {metricKey === "HTTPS" && meta?.protocol && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-rose-500`}>Detected Protocol</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                    {meta.protocol}
                  </div>
                </div>
              )}

              {metricKey === "SSL" && meta?.validTo && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-amber-500`}>Certificate Expiry</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-amber-500/5 border-amber-500/20 text-amber-300" : "bg-amber-50 border-amber-100 text-amber-700"}`}>
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full flex-shrink-0"></span>
                    {new Date(meta.validTo).toLocaleString()}
                  </div>
                </div>
              )}

              {metricKey === "TLS_Version" && meta?.version && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-rose-500`}>Detected Version</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                    {meta.version}
                  </div>
                </div>
              )}

              {metricKey === "HSTS" && meta?.value && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-rose-500`}>HSTS Header Value</h5>
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
                    <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-rose-500`}>CSP Directives</h5>
                    <div className={`mt-1 p-2 rounded max-h-48 overflow-y-auto custom-scrollbar border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-card border-line"}`}>
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
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-rose-500`}>X-Frame-Options Value</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                    {meta.value}
                  </div>
                </div>
              )}

              {metricKey === "X_Content_Type_Options" && meta?.value && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-rose-500`}>X-Content-Type-Options Value</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                    {meta.value}
                  </div>
                </div>
              )}

              {/* Dynamic Evidence for Remaining Parameters */}
              {(metricKey === "SQLi_Exposure" || metricKey === "XSS") && meta?.payload && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-rose-500`}>Testing Payload</h5>
                  <div className={`mt-1 p-2 rounded border font-mono text-[10px] break-all ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                    <div className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1 flex-shrink-0"></span>
                      <span>{meta.payload}</span>
                    </div>
                  </div>
                </div>
              )}

              {metricKey === "Admin_Panel_Public" && meta?.url && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-rose-500`}>Exposed URL</h5>
                  <div className={`mt-1 p-2 rounded border ${darkMode ? "bg-blue-500/5 border-blue-500/20" : "bg-accentsoft border-accentsoft"}`}>
                    <a href={meta.url} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-2 p-1 text-[10px] font-mono break-all hover:underline ${darkMode ? "text-blue-400" : "text-accent"}`}>
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></span>
                      {meta.url}
                    </a>
                  </div>
                </div>
              )}

              {metricKey === "Forms_Use_HTTPS" && meta?.insecureForms?.length > 0 && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-rose-500`}>Insecure Form Actions</h5>
                  <div className={`mt-1 p-2 rounded max-h-32 overflow-y-auto custom-scrollbar border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-card border-line"}`}>
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
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-rose-500`}>Identified Credentials</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-rose-500/5 border-rose-500/20 text-rose-300" : "bg-rose-50 border-rose-100 text-rose-700"}`}>
                    <span className="w-1.5 h-1.5 bg-rose-500 rounded-full flex-shrink-0"></span>
                    {meta.credentials}
                  </div>
                </div>
              )}

              {metricKey === "Finance_Form_Security" && meta && (
                <div className="space-y-2">
                  {meta.checkedUrl && (
                    <div>
                      <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-300" : "text-muted"}`}>Page Tested</h5>
                      <a href={meta.checkedUrl} target="_blank" rel="noopener noreferrer" className={`block p-2 rounded text-[10px] font-mono break-all hover:underline ${darkMode ? "bg-gray-800 text-blue-400" : "bg-accentsoft text-accent"}`}>
                        {meta.checkedUrl}
                      </a>
                    </div>
                  )}
                  {meta.breakdown?.length > 0 && (
                    <div>
                      <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-300" : "text-muted"}`}>PCI Breakdown ({meta.rawScore ?? 0}/{meta.maxScore ?? 10})</h5>
                      <ul className="space-y-1.5">
                        {meta.breakdown.map((b, idx) => (
                          <li key={idx} className={`p-2 rounded text-[10px] border ${b.earned ? (darkMode ? "bg-emerald-500/5 border-emerald-500/20" : "bg-emerald-50 border-emerald-100") : (darkMode ? "bg-gray-800 border-gray-700" : "bg-card border-line")}`}>
                            <div className="flex items-center justify-between gap-2">
                              <span className="flex items-center gap-1.5">
                                {b.earned ? <CheckCircle className="w-3 h-3 text-emerald-500" /> : <XCircle className="w-3 h-3 text-rose-500" />}
                                <span className={b.earned ? "text-emerald-600 font-semibold" : (darkMode ? "text-gray-300" : "text-inksoft")}>{b.label}</span>
                              </span>
                              <span className={`font-semibold ${b.earned ? "text-emerald-500" : "text-gray-400"}`}>{b.earned ? `+${b.points}` : `0 / ${b.points}`}</span>
                            </div>
                            {!b.earned && <div className={`mt-0.5 pl-[18px] ${darkMode ? "text-gray-400" : "text-muted"}`}>To earn: {b.detail}</div>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {meta.detectedProviders?.length > 0 && (
                    <div>
                      <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-emerald-500`}>Finance Providers</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {meta.detectedProviders.map((p, idx) => (
                          <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-mono ${darkMode ? "bg-emerald-500/10 text-emerald-300" : "bg-emerald-50 text-emerald-700"}`}>{p}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {meta.sensitiveFields?.length > 0 && (
                    <div>
                      <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${meta.sensitiveDataHandledSecurely ? "text-amber-500" : "text-rose-500"}`}>Sensitive Fields Collected</h5>
                      <div className="flex flex-wrap gap-1.5">
                        {meta.sensitiveFields.map((f, idx) => (
                          <span key={idx} className={`px-2 py-0.5 rounded text-[10px] font-mono ${darkMode ? "bg-rose-500/10 text-rose-300" : "bg-rose-50 text-rose-600"}`}>{f}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {metricKey === "Privacy_Policy" && meta?.foundLink && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-emerald-500`}>Detected Link</h5>
                  <a href={meta.foundLink} target="_blank" rel="noopener noreferrer" className={`block p-2 rounded text-[10px] font-mono break-all hover:underline ${darkMode ? "bg-gray-800 text-blue-400" : "bg-accentsoft text-accent"}`}>
                    {meta.foundLink}
                  </a>
                </div>
              )}

              {metricKey === "Third_Party_Cookies" && meta?.uniqueDomains && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-rose-500`}>Third-Party Domains</h5>
                  <div className={`mt-1 p-3 rounded max-h-32 overflow-y-auto custom-scrollbar border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-card border-line"}`}>
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

              {metricKey === "Cookie_Consent" && meta?.selector && (
                <div>
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-emerald-500`}>Detected Selector</h5>
                  <div className={`mt-1 p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                    {meta.selector}
                  </div>
                </div>
              )}

              {metricKey === "Cookie_Consent" && meta?.trackingData && (
                <div className="space-y-3 mt-3">
                  <h5 className={`text-xs font-semibold uppercase tracking-wider mb-1 text-rose-500`}>Detected Tracking Activity</h5>

                  {meta.trackingData.detectedTrackers?.length > 0 && (
                    <div className={`p-2 rounded border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                      <span className={`text-[10px] uppercase font-semibold opacity-70 mb-1 block ${darkMode ? "text-gray-400" : "text-muted"}`}>Tracking Scripts Found:</span>
                      <ul className="space-y-1.5 mt-1 max-h-32 overflow-y-auto custom-scrollbar">
                        {meta.trackingData.detectedTrackers.map((src, idx) => (
                          <li key={idx} className={`p-1.5 rounded flex items-start gap-2 border font-mono text-[10px] break-all ${darkMode ? "bg-gray-900/50 border-gray-700 text-gray-300" : "bg-card border-line text-muted"}`}>
                            <span className="w-1.5 h-1.5 bg-rose-500 rounded-full mt-1 flex-shrink-0"></span>
                            {src}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {meta.trackingData.cookiesUsed && (
                    <div className={`p-2 rounded border ${darkMode ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                      <span className={`text-[10px] uppercase font-semibold opacity-70 mb-1 block ${darkMode ? "text-gray-400" : "text-muted"}`}>Active Cookies String:</span>
                      <div className={`p-1.5 rounded font-mono text-[10px] break-all border max-h-24 overflow-y-auto custom-scrollbar ${darkMode ? "bg-gray-900/50 border-gray-700 text-gray-300" : "bg-card border-line text-muted"}`}>
                        {meta.trackingData.cookieString}
                      </div>
                    </div>
                  )}

                  {!meta.trackingData.hasTracking && (
                    <div className={`p-2 rounded border flex items-center gap-2 font-mono text-[10px] ${darkMode ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-300" : "bg-emerald-50 border-emerald-100 text-emerald-700"}`}>
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full flex-shrink-0"></span>
                      No tracking scripts or cookies detected.
                    </div>
                  )}
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
      <div className={`p-2 rounded-lg ${darkMode ? "bg-blue-500/20 text-blue-400" : "bg-accentsoft text-accent"}`}>
        <Icon size={20} />
      </div>
      <h2 className={`text-xl font-semibold ${darkMode ? "text-white" : "text-ink"}`}>
        {title}
      </h2>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
      {children}
    </div>
  </div>
);

const Security_Compilance_Inner = React.memo(function Security_Compilance_Inner({ data, loading, darkMode }) {
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const [selectedParameterInfo, setSelectedParameterInfo] = React.useState(null);
  const { audienceMode } = useData();

  const auditSteps = useMemo(() => [
    { icon: <Lock className="w-8 h-8 text-blue-500" />, title: "SSL & Encryption", text: "Verifying HTTPS redirection, SSL certificate validity, TLS handshake versions, and HSTS enforcement..." },
    { icon: <Bug className="w-8 h-8 text-rose-500" />, title: "Vulnerability Scan", text: "Simulating SQL Injection and XSS attacks, while cross-referencing with global threat intelligence databases..." },
    { icon: <ShieldCheck className="w-8 h-8 text-teal-500" />, title: "Security Headers", text: "Auditing Content Security Policy (CSP), anti-clickjacking headers, and secure HttpOnly cookie flags..." },
    { icon: <Globe2 className="w-8 h-8 text-indigo-500" />, title: "Compliance", text: "Evaluating GDPR/CCPA readiness, privacy policy visibility, and auditing third-party cookie tracking..." },
    { icon: <Key className="w-8 h-8 text-amber-500" />, title: "Access Control", text: "Testing for exposed admin panels, weak default credentials, and secure form submission..." },
  ], []);

  const metric = data?.securityOrCompliance || {};

  if (!data?.securityOrCompliance) {
    return (
      <div className={`w-full ${darkMode ? "bg-gray-900" : "bg-surface"} transition-colors duration-300`}>
        <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-6`}>
          {/* ✅ Card 1: URL Header Card */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
            <UrlHeader
              data={data}
              darkMode={darkMode}
              sectionName="Security & Compliance"
              sectionData={metric}
              auditScore={metric?.Percentage}
              hideBorder={true}
            />
          </div>

          {/* ✅ Card 2: Overview / Preview Card */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
            <div className={`flex flex-col xl:flex-row ${data?.report === "All" ? "" : "min-h-[300px]"}`}>
              {/* Left Panel: Live Preview (Only if not All) */}
              {data?.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-cardsoft border-linesoft"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}
              {/* Right Panel: Shimmer */}
              <div className="flex-1 flex flex-col justify-center">
                <AuditShimmer darkMode={darkMode} steps={auditSteps} />
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const mainBg = darkMode ? "bg-gray-900" : "bg-surface";

  // For a signed-out visitor this section arrives with its detail stripped, so the
  // per-metric tallies would all be 0 next to a real score. The server sends the
  // counts instead — see Backend/utils/reportGating.js.
  const allMetrics = Object.values(metric).filter(val => typeof val === 'object' && val !== null && 'status' in val);
  const passedCount = metric?.locked ? (metric.passedCount ?? 0) : allMetrics.filter(m => m.status === "pass").length;
  const warningCount = metric?.locked ? (metric.warningCount ?? 0) : allMetrics.filter(m => m.status === "warning").length;
  const failedCount = metric?.locked ? (metric.failedCount ?? 0) : allMetrics.filter(m => m.status === "fail").length;

  return (
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-6`}>

        {/* ✅ Card 1: URL Header Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
          <UrlHeader
            data={data}
            darkMode={darkMode}
            sectionName="Security & Compliance"
            sectionData={metric}
            auditScore={metric?.Percentage}
            hideBorder={true}
          />
        </div>

        {/* ✅ Card 2: Overview / Preview Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-card border border-line shadow-xl shadow-slate-200/50"}`}>
          <div className={`flex flex-col xl:flex-row ${data.report === "All" ? "" : "min-h-[300px]"}`}>
            {data.report !== "All" && (
              <div className={`w-full xl:w-[45%] ${data.report === "All" ? "p-6 lg:p-10" : "p-3 lg:p-4"} flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-cardsoft border-linesoft"}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                <div className="w-full relative z-10">
                  <LivePreview data={data} loading={loading} variant="plain" />
                </div>
              </div>
            )}

            <PillarHeader
              darkMode={darkMode}
              fullReport={data.report === "All"}
              badge={{ icon: ShieldCheck, label: "Security Audit" }}
              note={<>
                {metric?.Confidence && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1" title={metric?.Note || ""}>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${darkMode ? "text-slate-300 border-slate-700 bg-slate-800/60" : "text-slate-600 border-slate-200 bg-slate-100"}`}>
                      <Info className="w-3 h-3" /> Confidence: {metric.Confidence}
                    </span>
                    {metric?.Coverage && (
                      <span className={`text-[10px] leading-snug opacity-70 ${darkMode ? "text-slate-400" : "text-muted"}`}>
                        {metric.Coverage}
                      </span>
                    )}
                  </div>
                )}
              </>}
              title="Security &"
              titleAccent="Compliance"
              description="Comprehensive analysis of your web application's security posture."
              stats={{ passed: passedCount, warning: warningCount, failed: failedCount }}
              score={metric?.Percentage || 0}
              onMethodology={() => setSelectedMetricInfo(scoreCalculationInfo)}
            />
          </div>
        </div>

        <ReportRestrictionWrapper section="Security/Compliance">
          <div className="space-y-8">
            {(() => {
              // Params that don't apply to this page are hidden outright rather than
              // rendered as an "N/A" card — e.g. XSS / SQLi_Exposure on a URL with no
              // query params, or Finance_Form_Security on a non-finance page. They are
              // already dropped from the score denominator server-side, so an N/A card
              // is pure noise. `infoOnly` params still render (they carry a real
              // reading, just uncounted) — only a true not_applicable is dropped.
              // Defensive: every non-applicable branch in securityCompliance.js
              // currently returns status "not_applicable", but a metric that was
              // never measured can also surface as a null status or an explicit
              // notCalculated flag. Drop all three rather than only the first, so
              // a future backend change can't start leaking empty cards.
              const didNotApply = (m) =>
                m.status === "not_applicable" || m.notCalculated === true || m.status == null;
              const visible = (keys) => keys.filter(
                (k) => metric[k] && !didNotApply(metric[k]) && isVisibleForAudience(k, audienceMode)
              );
              const networkKeys = visible(["HTTPS", "SSL", "SSL_Expiry", "TLS_Version", "HSTS"]);
              const vulnKeys = visible(["Reputation", "SQLi_Exposure", "XSS"]);
              const accessKeys = visible(["Weak_Default_Credentials", "Admin_Panel_Public", "Forms_Use_HTTPS"]);
              const headerKeys = visible(["Header_Security", "CSP", "X_Frame_Options", "X_Content_Type_Options", "Referrer_Policy", "Permissions_Policy", "Cookie_Flags", "Third_Party_Cookies"]);
              const complianceKeys = visible(["Cookie_Consent", "Privacy_Compliance", "Privacy_Policy"]);
              const financeKeys = visible(["Finance_Form_Security", "Legal_Disclaimers"]);
              const card = (key) => <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} onInfo={(info) => setSelectedParameterInfo(info)} />;
              return (
                <>
                  {networkKeys.length > 0 && (
                    <Section title="Network & Encryption" icon={Lock} darkMode={darkMode}>{networkKeys.map(card)}</Section>
                  )}
                  {vulnKeys.length > 0 && (
                    <Section title="Vulnerability Detection" icon={Bug} darkMode={darkMode}>{vulnKeys.map(card)}</Section>
                  )}
                  {accessKeys.length > 0 && (
                    <Section title="Access Control & Authentication" icon={Key} darkMode={darkMode}>{accessKeys.map(card)}</Section>
                  )}
                  {headerKeys.length > 0 && (
                    <Section title="Security Headers & Cookies" icon={ShieldCheck} darkMode={darkMode}>{headerKeys.map(card)}</Section>
                  )}
                  {complianceKeys.length > 0 && (
                    <Section title="Compliance & Privacy" icon={Globe2} darkMode={darkMode}>{complianceKeys.map(card)}</Section>
                  )}
                  {financeKeys.length > 0 && (
                    <Section title="Finance & Legal Compliance" icon={CreditCard} darkMode={darkMode}>{financeKeys.map(card)}</Section>
                  )}
                </>
              );
            })()}
          </div>
        </ReportRestrictionWrapper>
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
});

export default function Security_Compilance({ data: propData, loading: propLoading, darkMode: propDarkMode }) {
  const contextData = useData();
  const { theme } = useContext(ThemeContext);

  const data = propData !== undefined ? propData : contextData.data;
  const loading = propLoading !== undefined ? propLoading : contextData.loading;
  const darkMode = propDarkMode !== undefined ? propDarkMode : (theme === "dark");

  return <Security_Compilance_Inner data={data} loading={loading} darkMode={darkMode} />;
}