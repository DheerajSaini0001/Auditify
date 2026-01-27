import React, { useContext } from "react";
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

const SecurityShimmer = ({ darkMode }) => (
  <div className="space-y-12 animate-in fade-in zoom-in duration-300">
    {/* Header Loading */}
    <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-lg ${darkMode ? "bg-gray-900 border border-gray-800" : "bg-white border border-gray-200"}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent animate-[shimmer_2s_infinite]"></div>
      <div className="flex flex-col md:flex-row gap-8 items-center justify-between relative z-10">
        <div className="space-y-6 w-full max-w-2xl text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-sm font-medium animate-pulse">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Initializing Audit</span>
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 animate-pulse">Running Security Audit...</h1>
            <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>Verifying SSL, Security Headers, and Scanning for Vulnerabilities.</p>
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className={`w-24 h-24 animate-spin ${darkMode ? "text-blue-500" : "text-blue-600"} opacity-20`} />
          <span className="text-sm font-bold animate-pulse">Calculating Score...</span>
        </div>
      </div>
    </div>

    {/* Metric Cards Loading */}
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-4 px-2 opacity-50">
        <div className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800">
          <ShieldCheck size={24} />
        </div>
        <div className="space-y-2">
          <div className="h-6 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {["Verifying SSL Certificate...", "Scanning for XSS Vulnerabilities...", "Checking Content Security Policy...", "Analyzing Security Headers...", "Detecting Malware Information...", "Validating HTTPS Usage..."].map((text, i) => (
          <div key={i} className={`h-56 rounded-xl border p-6 flex flex-col justify-center items-center gap-4 text-center ${darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
            <Loader2 className="w-8 h-8 animate-spin text-blue-500 opacity-50" />
            <div className="space-y-1">
              <div className={`font-semibold ${darkMode ? "text-gray-300" : "text-gray-700"}`}>{text}</div>
              <div className="text-xs opacity-50">Please wait...</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

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

  if (!data?.securityOrCompliance) {
    return (
      <div className={`min-h-screen w-full ${darkMode ? "bg-gray-900" : "bg-gray-50"} transition-colors duration-300`}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          <UrlHeader darkMode={darkMode} />
          {/* ✅ Live Preview (Only for Full Audit) */}
          <LivePreview data={data} showInFullAudit={false} />
          <SecurityShimmer darkMode={darkMode} />
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
    <div className={`min-h-screen w-full ${mainBg} transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        <UrlHeader darkMode={darkMode} />

        {/* ✅ Live Preview (Only for Full Audit) */}
        <LivePreview data={data} showInFullAudit={false} />

        {/* Header Section */}
        <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl ${darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium border border-blue-500/20">
                <ShieldCheck size={14} />
                <span>Security Audit</span>
              </div>
              <h1 className={`text-4xl sm:text-5xl font-black tracking-tight ${textColor}`}>
                Security & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400">Compliance</span>
              </h1>
              <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Comprehensive analysis of your web application's security posture.
              </p>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  <CheckCircle size={16} className="text-emerald-500" />
                  <span>{passedCount} Passed</span>
                </div>
                <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                  <XCircle size={16} className="text-rose-500" />
                  <span>{failedCount} Failed</span>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 justify-center md:justify-start">
                <button
                  onClick={() => setSelectedMetricInfo(scoreCalculationInfo)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${darkMode ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}
                >
                  <Info size={14} />
                  <span>How is this calculated?</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <CircularProgress value={metric?.Percentage || 0} size={140} stroke={12} />
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className={`text-3xl font-bold ${textColor}`}>{metric?.Percentage || 0}%</span>
                  <span className={`text-xs font-medium uppercase tracking-wider ${darkMode ? "text-gray-500" : "text-gray-400"}`}>Score</span>
                </div>
              </div>
              {data.report !== "All" && (
                <div className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Time Taken: {data.timeTaken}
                </div>
              )}
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
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