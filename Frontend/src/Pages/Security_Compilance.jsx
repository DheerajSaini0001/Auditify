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

// ------------------------------------------------------
// ✅ Icon Mapping
// ------------------------------------------------------
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

// ------------------------------------------------------
// ✅ Educational Content
// ------------------------------------------------------
const educationalContent = {
  HTTPS: {
    title: "HTTPS Encryption",
    desc: "Ensures secure HTTPS protocol.",
    why: "Encrypts data in transit.",
    use: "Hypertext Transfer Protocol Secure (HTTPS) uses TLS to encrypt communication.",
    impact: " Prevents eavesdropping and tampering. Essential for trust and SEO.",
    improvement: "Obtain an SSL certificate and force redirect HTTP to HTTPS."
  },
  SSL: {
    title: "SSL Certificate",
    desc: "Checks for valid SSL certificate.",
    why: "Authenticates site identity.",
    use: "Verifies that the website has a valid, trusted SSL/TLS certificate.",
    impact: "Invalid certificates trigger browser warnings, scaring away visitors.",
    improvement: "Renew certificates before expiry and ensure the chain of trust is complete."
  },
  SSL_Expiry: {
    title: "SSL Expiry",
    desc: "Verifies SSL expiry date.",
    why: "Expired certificates block users.",
    use: "Checks the expiration date of the SSL certificate.",
    impact: "An expired certificate causes 'Not Secure' warnings immediately.",
    improvement: "Set up auto-renewal (e.g., Let's Encrypt) to avoid downtime."
  },
  HSTS: {
    title: "HSTS Header",
    desc: "Enforces HTTPS connections.",
    why: "Prevents downgrade attacks.",
    use: "HTTP Strict Transport Security tells browsers to ONLY use HTTPS.",
    impact: "Protects against man-in-the-middle attacks stripping SSL.",
    improvement: "Add 'Strict-Transport-Security' header with a long max-age."
  },
  TLS_Version: {
    title: "TLS Protocol",
    desc: "Validates TLS version.",
    why: "Older versions are insecure.",
    use: "Checks the version of Transport Layer Security protocol used.",
    impact: "TLS 1.0/1.1 have known vulnerabilities (POODLE, BEAST).",
    improvement: "Disable TLS 1.0/1.1 and enable TLS 1.2 or 1.3 on the server."
  },
  X_Frame_Options: {
    title: "X-Frame-Options",
    desc: "Protects against clickjacking.",
    why: "Prevents malicious embedding.",
    use: "Controls whether the site can be embedded in an <iframe>.",
    impact: "Prevents attackers from overlaying invisible frames to trick users into clicking.",
    improvement: "Set header to 'DENY' or 'SAMEORIGIN'."
  },
  CSP: {
    title: "Content Security Policy",
    desc: "Content Security Policy.",
    why: "Mitigates XSS and injection attacks.",
    use: "Whitelists sources of approved content (scripts, styles, images).",
    impact: "Stop malicious scripts from running even if injected.",
    improvement: "Define a strict 'Content-Security-Policy' header."
  },
  X_Content_Type_Options: {
    title: "MIME Sniffing",
    desc: "Prevents MIME sniffing.",
    why: "Stops file type exploits.",
    use: "Prevents browsers from interpreting files as a different MIME type.",
    impact: "Stops drive-by download attacks disguised as images.",
    improvement: "Set 'X-Content-Type-Options: nosniff'."
  },
  Cookies_Secure: {
    title: "Secure Cookies",
    desc: "Ensures Secure flag on cookies.",
    why: "Protects cookies over network.",
    use: "Ensures cookies are only sent over encrypted HTTPS connections.",
    impact: "Prevents cookies from being stolen over unencrypted HTTP.",
    improvement: "Set the 'Secure' flag when setting cookies."
  },
  Cookies_HttpOnly: {
    title: "HttpOnly Cookies",
    desc: "Prevents JS access to cookies.",
    why: "Mitigates XSS cookie theft.",
    use: "Prevents client-side scripts (JavaScript) from accessing cookies.",
    impact: "Even if XSS occurs, the attacker cannot steal session tokens.",
    improvement: "Set the 'HttpOnly' flag for session identifiers."
  },
  Google_Safe_Browsing: {
    title: "Safe Browsing",
    desc: "Checks Google blacklist.",
    why: "Ensures site isn't flagged.",
    use: "Checks if the domain is listed in Google's database of unsafe sites.",
    impact: "Flagged sites show a 'Deceptive Site Ahead' red screen to users.",
    improvement: "Request a review in Google Search Console if flagged."
  },
  Blacklist: {
    title: "Domain Blacklist",
    desc: "Domain blacklist check.",
    why: "Protects reputation.",
    use: "Checks multiple DNS blacklists (spam, malware).",
    impact: "Being blacklisted affects email deliverability and trust.",
    improvement: "Monitor domain reputation and clean up malware if infected."
  },
  Malware_Scan: {
    title: "Malware Detection",
    desc: "Scans for malware.",
    why: "Detects malicious code.",
    use: "Scans page content for known malicious signatures or obfuscated code.",
    impact: "Malware steals user data and ruins site reputation.",
    improvement: "Use security plugins, scanners, and keep software updated."
  },
  SQLi_Exposure: {
    title: "SQL Injection",
    desc: "SQL Injection check.",
    why: "Prevents database compromise.",
    use: "Checks if inputs can manipulate database queries.",
    impact: "Attackers can dump the entire database or delete data.",
    improvement: "Use prepared statements (parameterized queries) and validate inputs."
  },
  XSS: {
    title: "XSS Protection",
    desc: "Cross-Site Scripting check.",
    why: "Prevents script injection.",
    use: "Checks if user input is properly escaped before rendering.",
    impact: "XSS allows account takeover and defacement.",
    improvement: "Sanitize all user inputs and escape outputs."
  },
  Cookie_Consent: {
    title: "Cookie Consent",
    desc: "GDPR Cookie Consent.",
    why: "Legal compliance.",
    use: "Verifies if a cookie consent banner is present.",
    impact: "Required by GDPR/CCPA. Non-compliance leads to fines.",
    improvement: "Implement a compliant cookie consent manager."
  },
  Privacy_Policy: {
    title: "Privacy Policy",
    desc: "Privacy Policy check.",
    why: "Builds user trust.",
    use: "Checks for the existence of a privacy policy page.",
    impact: "Legal requirement in most jurisdictions.",
    improvement: "Create a clear Privacy Policy page and link it in the footer."
  },
  Forms_Use_HTTPS: {
    title: "Secure Forms",
    desc: "Secure form submission.",
    why: "Protects user input.",
    use: "Ensures login and contact forms submit data over HTTPS.",
    impact: "Sending passwords over HTTP exposes them to attackers.",
    improvement: "Update <form action=...> URLs to use https://."
  },
  GDPR_CCPA: {
    title: "GDPR/CCPA",
    desc: "Data protection compliance.",
    why: "Avoids legal fines.",
    use: "Checks for signs of data privacy regulation compliance.",
    impact: "Protects user rights regarding their personal data.",
    improvement: "Audit data collection and provide opt-out mechanisms."
  },
  Data_Collection: {
    title: "Data Collection",
    desc: "Data collection disclosure.",
    why: "Transparency with users.",
    use: "Identifies if the site collects sensitive data.",
    impact: "Users demand transparency about what data is collected.",
    improvement: "Clearly state data collection practices."
  },
  Weak_Default_Credentials: {
    title: "Default Credentials",
    desc: "Checks default passwords.",
    why: "Prevents easy takeovers.",
    use: "Checks for exposed default login paths or credentials.",
    impact: "Easiest way for botnets to hijack a site.",
    improvement: "Change default admin usernames and passwords."
  },
  MFA_Enabled: {
    title: "MFA Status",
    desc: "Multi-Factor Authentication.",
    why: "Adds security layer.",
    use: "Checks if MFA is enforced for sensitive areas.",
    impact: "Prevents 99.9% of account compromise attacks.",
    improvement: "Enable 2FA/MFA for all admin accounts."
  },
  Admin_Panel_Public: {
    title: "Admin Exposure",
    desc: "Exposed admin panel.",
    why: "Reduces attack surface.",
    use: "Checks if admin login pages are publicly accessible.",
    impact: "Invites brute-force attacks.",
    improvement: "Restrict admin access by IP or use a VPN."
  },
  Viewport_Meta_Tag: {
    title: "Viewport Meta",
    desc: "Mobile responsiveness.",
    why: "Essential for UX.",
    use: "Controls layout on mobile browsers.",
    impact: "Without it, mobile users see a microscopic desktop version.",
    improvement: "Add <meta name='viewport' content='width=device-width, initial-scale=1'>"
  },
  HTML_Doctype: {
    title: "Doctype",
    desc: "HTML Doctype declaration.",
    why: "Ensures correct rendering.",
    use: "Specifies the HTML version to the browser.",
    impact: "Prevents 'Quirks Mode' which breaks layout consistency.",
    improvement: "Start every HTML document with <!DOCTYPE html>."
  },
  Character_Encoding: {
    title: "Charset",
    desc: "UTF-8 encoding.",
    why: "Prevents text issues.",
    use: "Specifies how characters are represented.",
    impact: "Incorrect encoding turns special characters into garbled text.",
    improvement: "Use <meta charset='UTF-8'> in the <head>."
  },
  Browser_Console_Errors: {
    title: "Console Errors",
    desc: "Console errors.",
    why: "Indicates broken code.",
    use: "Checks for JavaScript errors in the browser console.",
    impact: "Errors often mean broken functionality for the user.",
    improvement: "Debug and fix JavaScript runtime errors."
  },
  Geolocation_Request: {
    title: "Geolocation",
    desc: "Geolocation permissions.",
    why: "Respects user privacy.",
    use: "Checks if the site requests location data immediately on load.",
    impact: "Requesting location without context annoys users/leads to high denial rates.",
    improvement: "Request location only after a user interaction."
  },
  Input_Paste_Allowed: {
    title: "Paste Check",
    desc: "Paste restrictions.",
    why: "Bad UX and security.",
    use: "Checks if pasting is blocked in password fields.",
    impact: "Blocking paste forces manual entry, encouraging weak passwords and frustrating users.",
    improvement: "Allow pasting in password fields (NIST recommendation)."
  },
  Notification_Request: {
    title: "Notifications",
    desc: "Notification permissions.",
    why: "Avoids user annoyance.",
    use: "Checks for push notification prompts on load.",
    impact: "Immediate prompts lead to high block rates and bounce.",
    improvement: "Ask for notification permission only when relevant."
  },
  Third_Party_Cookies: {
    title: "3rd Party Cookies",
    desc: "Third-party cookies.",
    why: "Privacy concern.",
    use: "Cookies set by domains other than the website itself.",
    impact: "Track users across the web; increasingly blocked by browsers.",
    improvement: "Reduce reliance on third-party tracking pixels."
  },
  Deprecated_APIs: {
    title: "Deprecated APIs",
    desc: "Deprecated APIs.",
    why: "Avoids security holes.",
    use: "Checks for usage of old, insecure browser features.",
    impact: "Deprecated features may be removed, breaking the site.",
    improvement: "Update code to use modern standard APIs."
  },
};

// ------------------------------------------------------
// ✅ Score Calculation Info (Weighted Average)
// ------------------------------------------------------
const scoreCalculationInfo = {
  title: "Score Calculation",
  use: "The Security score is a weighted assessment of critical security headers and vulnerabilities.",
  impact: "A high security score builds trust and prevents data breaches.",
  improvement: "Ensure SSL, HSTS, and Content Security Policy (CSP) are enabled.",
  weightage: [
    { param: "Vulnerability Scanning", weight: "35%" },
    { param: "Browser Security & Best Practices", weight: "20%" },
    { param: "SSL & HTTPS Security", weight: "15%" },
    { param: "Security Headers", weight: "15%" },
    { param: "Compliance & Privacy", weight: "10%" },
    { param: "Access Control", weight: "5%" }
  ]
};

// ------------------------------------------------------
// ✅ Enhanced Shimmer
// ------------------------------------------------------
const ShimmerBlock = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-lg ${className}`}>
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent"></div>
  </div>
);

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

// ------------------------------------------------------
// ✅ Metric Card (Security Style)
// ------------------------------------------------------
const MetricCard = ({ metricKey, data, darkMode, onInfo }) => {
  const { score, details, meta } = data || {};
  const isPassed = score === 100;
  const isWarning = score === 50;

  const Icon = iconMap[metricKey] || Shield;
  const content = educationalContent[metricKey] || { desc: "Security check.", why: "Important for security." };
  const title = metricKey.replaceAll("_", " ");

  // Simple Colors
  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";

  let statusColor = "text-red-600 bg-red-50 border-red-100";
  let statusText = "Failed";

  if (darkMode) {
    statusColor = "text-red-400 bg-red-900/20 border-red-800/30";
  }

  if (isPassed) {
    statusColor = darkMode ? "text-green-400 bg-green-900/20 border-green-800/30" : "text-green-600 bg-green-50 border-green-100";
    statusText = "Passed";
  } else if (isWarning) {
    statusColor = darkMode ? "text-yellow-400 bg-yellow-900/20 border-yellow-800/30" : "text-yellow-600 bg-yellow-50 border-yellow-100";
    statusText = "Warning";
  }

  const hasMetaDetails = meta && Object.keys(meta).some(k => k !== 'count' && k !== 'value');

  return (
    <div className={`relative overflow-hidden rounded-xl border ${cardBg} shadow-sm hover:shadow-md transition-shadow group`}>
      <div className="p-5 space-y-4">
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
          {onInfo && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onInfo();
              }}
              className={`p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${darkMode ? "text-gray-400 hover:text-white" : "text-gray-400 hover:text-gray-900"}`}
              title="Learn more"
            >
              <Info size={18} />
            </button>
          )}
        </div>

        {/* Dynamic Details */}
        <div>
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            Status Detail
          </h4>
          <p className={`text-sm font-medium ${isPassed ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
            {details || "No details available"}
          </p>
          {meta?.value && (
            <div className="mt-2 text-xs">
              <span className={`font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Detected: </span>
              <code className={`px-1.5 py-0.5 rounded ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`}>
                {String(meta.value)}
              </code>
            </div>
          )}
        </div>

        {/* Technical Data */}
        {!isPassed && hasMetaDetails && (
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Technical Data
            </h4>
            <div className={`p-2 rounded text-xs font-mono overflow-x-auto ${darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
              {Object.entries(meta).map(([k, v]) => {
                if (k === 'count' || k === 'value') return null;
                return (
                  <div key={k} className="flex flex-col sm:flex-row sm:gap-2 mb-1 last:mb-0">
                    <span className="font-semibold opacity-70">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>
                    <span className="break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Educational Content */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className={`text-sm ${subTextColor}`}>
            {content.desc}
          </p>
          <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            <span className="font-semibold">Why:</span> {content.why}
          </p>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Simple Section
// ------------------------------------------------------
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

// ------------------------------------------------------
// ✅ Main Component
// ------------------------------------------------------
export default function Security_Compilance() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const [selectedMetricInfo, setSelectedMetricInfo] = React.useState(null);
  const darkMode = theme === "dark";

  const auditSteps = useMemo(() => [
    { icon: <Lock className="w-8 h-8 text-blue-500" />, title: "SSL & Encryption", text: "Verifying HTTPS, SSL certificates, and HSTS headers for secure connections..." },
    { icon: <Shield className="w-8 h-8 text-purple-500" />, title: "Vulnerability Scan", text: "Scanning for XSS, SQL Injection, and known malware signatures..." },
    { icon: <FileText className="w-8 h-8 text-teal-500" />, title: "Security Headers", text: "Checking Content Security Policy (CSP), X-Frame-Options, and secure cookies..." },
    { icon: <Globe2 className="w-8 h-8 text-indigo-500" />, title: "Compliance", text: "Auditing GDPR/CCPA readiness, privacy policies, and cookie consent banners..." },
    { icon: <Key className="w-8 h-8 text-amber-500" />, title: "Access Control", text: "Testing for exposed admin panels, weak credentials, and MFA status..." },
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
          {/* ✅ Unified Master Card Loading State */}
          <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

            {/* 1. URL Header */}
            <div>
              <UrlHeader data={data} darkMode={darkMode} />
            </div>

            <div className="flex flex-col xl:flex-row min-h-[300px]">
              {/* Left Panel: Live Preview (Only if not All) */}
              {data.report !== "All" && (
                <div className={`w-full xl:w-[45%] p-3 lg:p-4 flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                  <div className="w-full relative z-10">
                    <LivePreview data={data} loading={loading} variant="plain" />
                  </div>
                </div>
              )}

              {/* Right/Full Panel: Audit Steps */}
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
  const textColor = darkMode ? "text-white" : "text-gray-900";

  const allMetrics = Object.values(metric).filter(val => typeof val === 'object' && val !== null && 'score' in val);
  const passedCount = allMetrics.filter(m => m.score === 100).length;
  const failedCount = allMetrics.filter(m => m.score < 100).length;

  return (
    <div className={`w-full ${mainBg} transition-colors duration-300`}>
      <main className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${data?.report === "All" ? "pt-8" : "pt-0"} pb-8 space-y-8`}>

        {/* ✅ Unified Master Card */}
        <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${darkMode ? "bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-slate-800 shadow-xl shadow-black/20" : "bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-purple-50/40 border border-slate-200 shadow-xl shadow-slate-200/50"}`}>

          {/* 1. URL Header */}
          <div>
            <UrlHeader data={data} darkMode={darkMode} />
          </div>

          {/* 2. Card Body */}
          <div className={`flex flex-col xl:flex-row ${data.report === "All" ? "" : "min-h-[300px]"}`}>

            {/* Left Panel: Live Preview (Only if not All) */}
            {data.report !== "All" && (
              <div className={`w-full xl:w-[45%] ${data.report === "All" ? "p-6 lg:p-10" : "p-3 lg:p-4"} flex items-center justify-center border-b xl:border-b-0 xl:border-r relative overflow-hidden ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50/50 border-slate-100"}`}>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-500/5 blur-3xl rounded-full pointer-events-none"></div>
                <div className="w-full relative z-10">
                  <LivePreview data={data} loading={loading} variant="plain" />
                </div>
              </div>
            )}

            {/* Right Panel: Metrics & Score */}
            <div className={`flex-1 ${data.report === "All" ? "px-6 pb-4 pt-2 lg:px-10 lg:pt-2" : "px-6 pb-4 pt-4 lg:px-12 lg:pt-6"} flex flex-col justify-center`}>
              <div className={`w-full ${data.report === "All" ? "" : "max-w-2xl mx-auto"} ${data.report === "All" ? "space-y-10" : "space-y-8"}`}>

                {/* Top Content Area */}
                <div className={`flex flex-col md:flex-row items-center ${data.report === "All" ? "gap-10 md:gap-14 justify-between" : "gap-8 md:gap-12 justify-center"}`}>

                  {/* Text Content */}
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

                    {/* Stats & Tools */}
                    <div className={`flex flex-wrap items-center ${data.report === "All" ? "gap-6" : "gap-5"}`}>
                      <div className={`flex items-center ${data.report === "All" ? "gap-5" : "gap-4"}`}>
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-emerald-500" />
                          <span className="text-sm font-bold">{passedCount} Passed</span>
                        </div>
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
                        <span className="border-b border-transparent hover:border-current">Methodology</span>
                      </button>
                    </div>
                  </div>

                  {/* Circular Progress */}
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

        {/* Section 1: Network & Encryption */}
        <Section title="Network & Encryption" icon={Lock} darkMode={darkMode}>
          {["HTTPS", "SSL", "SSL_Expiry", "HSTS", "TLS_Version"].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} onInfo={() => setSelectedMetricInfo({ ...educationalContent[key], icon: iconMap[key] || Shield })} />
          ))}
        </Section>

        {/* Section 2: Security Headers */}
        <Section title="Security Headers" icon={Shield} darkMode={darkMode}>
          {["X_Frame_Options", "CSP", "X_Content_Type_Options", "Cookies_Secure", "Cookies_HttpOnly"].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} onInfo={() => setSelectedMetricInfo({ ...educationalContent[key], icon: iconMap[key] || Shield })} />
          ))}
        </Section>

        {/* Section 3: Compliance & Privacy */}
        <Section title="Compliance & Privacy" icon={FileText} darkMode={darkMode}>
          {["Cookie_Consent", "Privacy_Policy", "GDPR_CCPA", "Data_Collection", "Forms_Use_HTTPS"].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} onInfo={() => setSelectedMetricInfo({ ...educationalContent[key], icon: iconMap[key] || Shield })} />
          ))}
        </Section>

        {/* Section 4: Vulnerability & Browser Checks */}
        <Section title="Vulnerabilities & Browser Security" icon={AlertTriangle} darkMode={darkMode}>
          {[
            "Google_Safe_Browsing", "Blacklist", "Malware_Scan", "SQLi_Exposure", "XSS",
            "Weak_Default_Credentials", "MFA_Enabled", "Admin_Panel_Public", "Viewport_Meta_Tag",
            "HTML_Doctype", "Character_Encoding", "Browser_Console_Errors", "Geolocation_Request",
            "Input_Paste_Allowed", "Notification_Request", "Third_Party_Cookies", "Deprecated_APIs",
          ].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} onInfo={() => setSelectedMetricInfo({ ...educationalContent[key], icon: iconMap[key] || Shield })} />
          ))}
        </Section>

      </main>
      <MetricInfoModal
        isOpen={!!selectedMetricInfo}
        onClose={() => setSelectedMetricInfo(null)}
        info={selectedMetricInfo}
        darkMode={darkMode}
      />
    </div>
  );
}