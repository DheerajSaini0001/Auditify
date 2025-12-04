import React, { useContext, useState } from "react";
import CircularProgress from "../Component/CircularProgress";
import AuditDropdown from "../Component/AuditDropdown";
import { useData } from "../context/DataContext";
import { ThemeContext } from "../context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Lock, Globe, AlertTriangle, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Info, Server, Eye, FileText,
  AlertOctagon, Smartphone, Layout, Code, Terminal,
  Wifi, Key, Globe2, Layers, ShieldAlert, ShieldCheck,
  Search, Database, EyeOff, MousePointer, Bell, Share2,
  CalendarClock, Bug, MapPin
} from "lucide-react";

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
// ✅ Descriptions & Educational Content
// ------------------------------------------------------
const educationalContent = {
  HTTPS: {
    desc: "Ensures your site uses the secure HTTPS protocol.",
    why: "HTTPS encrypts data between the user's browser and your server, preventing attackers from stealing sensitive information like passwords or credit card numbers."
  },
  SSL: {
    desc: "Checks for a valid SSL certificate.",
    why: "An SSL certificate authenticates your website's identity and enables an encrypted connection. Without it, browsers will warn users your site is unsafe."
  },
  SSL_Expiry: {
    desc: "Verifies SSL certificate expiry date.",
    why: "Expired certificates cause scary security warnings for users, driving them away immediately. It's crucial to renew them before they expire."
  },
  HSTS: {
    desc: "HTTP Strict Transport Security (HSTS).",
    why: "HSTS tells browsers to ONLY connect to your website via HTTPS, preventing downgrade attacks where hackers trick users into using an insecure connection."
  },
  TLS_Version: {
    desc: "Validates the TLS encryption version.",
    why: "Older versions of TLS (like 1.0 or 1.1) have known security holes. Using TLS 1.2 or 1.3 ensures modern, robust encryption."
  },
  X_Frame_Options: {
    desc: "Protects against clickjacking.",
    why: "Prevents your site from being embedded in an iframe on another site. This stops attackers from tricking users into clicking invisible buttons on your site."
  },
  CSP: {
    desc: "Content Security Policy (CSP).",
    why: "CSP is a powerful layer of security that helps detect and mitigate certain types of attacks, including Cross-Site Scripting (XSS) and data injection attacks."
  },
  X_Content_Type_Options: {
    desc: "Prevents MIME sniffing.",
    why: "Stops browsers from trying to 'guess' the file type, which can be exploited to execute malicious code disguised as images or other files."
  },
  Cookies_Secure: {
    desc: "Ensures cookies are marked Secure.",
    why: "The 'Secure' flag ensures cookies are only transmitted over encrypted HTTPS connections, preventing theft during transmission."
  },
  Cookies_HttpOnly: {
    desc: "Prevents JavaScript access to cookies.",
    why: "The 'HttpOnly' flag stops malicious scripts (XSS) from stealing your cookies, which often contain user session tokens."
  },
  Google_Safe_Browsing: {
    desc: "Checks Google's unsafe site list.",
    why: "Verifies that Google hasn't flagged your domain as hosting malware or phishing content, which would block users from visiting."
  },
  Blacklist: {
    desc: "Domain/IP Blacklist check.",
    why: "Checks if your domain is on major spam or malware blacklists, which can ruin your reputation and email deliverability."
  },
  Malware_Scan: {
    desc: "Scans for malware.",
    why: "Detects malicious code injected into your website that could harm your users or their devices."
  },
  SQLi_Exposure: {
    desc: "SQL Injection check.",
    why: "SQL injection allows attackers to interfere with database queries, potentially stealing or deleting your entire database."
  },
  XSS: {
    desc: "Cross-Site Scripting (XSS) check.",
    why: "XSS allows attackers to inject malicious scripts into pages viewed by other users, often to steal sessions or redirect users."
  },
  Cookie_Consent: {
    desc: "GDPR Cookie Consent.",
    why: "Legally required in many regions. Users must be informed about and consent to tracking cookies."
  },
  Privacy_Policy: {
    desc: "Privacy Policy accessibility.",
    why: "Builds trust and is legally required. Users need to know how you collect, use, and protect their data."
  },
  Forms_Use_HTTPS: {
    desc: "Secure Form Submission.",
    why: "Ensures that data entered into forms (login, contact, etc.) is sent securely. Insecure forms are a major privacy risk."
  },
  GDPR_CCPA: {
    desc: "GDPR & CCPA Compliance.",
    why: "Checks for indicators of compliance with major data protection regulations to avoid hefty fines and build user trust."
  },
  Data_Collection: {
    desc: "Data Collection Disclosure.",
    why: "Transparently disclosing what data you collect helps users make informed decisions and complies with privacy laws."
  },
  Weak_Default_Credentials: {
    desc: "Weak/Default Credentials.",
    why: "Using default passwords (like 'admin/admin') is the easiest way for hackers to take over your system."
  },
  MFA_Enabled: {
    desc: "Multi-Factor Authentication.",
    why: "Adds a second layer of security. Even if a password is stolen, the attacker cannot access the account without the second factor."
  },
  Admin_Panel_Public: {
    desc: "Exposed Admin Panel.",
    why: "Admin panels should be hidden or restricted. Exposing them to the public internet invites brute-force attacks."
  },
  Viewport_Meta_Tag: {
    desc: "Mobile Responsiveness.",
    why: "Ensures your site renders correctly on mobile devices. Essential for UX and SEO."
  },
  HTML_Doctype: {
    desc: "HTML Doctype Declaration.",
    why: "Tells the browser which version of HTML to use, ensuring the page renders consistently and correctly."
  },
  Character_Encoding: {
    desc: "Character Encoding (UTF-8).",
    why: "Ensures text displays correctly across all browsers and languages, preventing 'garbled' text issues."
  },
  Browser_Console_Errors: {
    desc: "Console Errors.",
    why: "Errors in the console often indicate broken functionality or security issues that need immediate attention."
  },
  Geolocation_Request: {
    desc: "Geolocation Permissions.",
    why: "Requesting location data without a clear need scares users and can be a privacy violation."
  },
  Input_Paste_Allowed: {
    desc: "Input Paste Restrictions.",
    why: "Blocking paste on password fields is bad UX and prevents the use of password managers, actually reducing security."
  },
  Notification_Request: {
    desc: "Notification Permissions.",
    why: "Aggressive notification prompts annoy users. They should only be requested when relevant."
  },
  Third_Party_Cookies: {
    desc: "Third-Party Cookies.",
    why: "Heavy reliance on third-party cookies is being phased out by browsers and can be a privacy concern for users."
  },
  Deprecated_APIs: {
    desc: "Deprecated APIs.",
    why: "Using old, unsupported web technologies can lead to security vulnerabilities and broken features in modern browsers."
  },
};

// ------------------------------------------------------
// ✅ Skeleton Components
// ------------------------------------------------------
const SkeletonMetricCard = ({ darkMode }) => {
  const shimmerBg = darkMode ? "bg-gray-800" : "bg-gray-200";
  return (
    <div className={`h-32 rounded-xl ${shimmerBg} animate-pulse`} />
  );
};

const SecurityShimmer = ({ darkMode }) => {
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  return (
    <div className={`min-h-screen ${mainBg} p-8 space-y-8`}>
      <div className={`h-48 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-gray-200"} animate-pulse`} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(9)].map((_, i) => (
          <SkeletonMetricCard key={i} darkMode={darkMode} />
        ))}
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ MetricCard Component
// ------------------------------------------------------
const MetricCard = ({ metricKey, data, darkMode }) => {
  const { score, details, meta } = data || {};
  const isPassed = score === 100;

  const Icon = iconMap[metricKey] || Shield;
  const content = educationalContent[metricKey] || { desc: "Security check.", why: "Important for site security." };
  const title = metricKey.replaceAll("_", " ");

  const cardBg = darkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200";
  const textColor = darkMode ? "text-gray-100" : "text-gray-900";
  const subTextColor = darkMode ? "text-gray-400" : "text-gray-500";

  const statusColor = isPassed
    ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
    : "text-rose-500 bg-rose-500/10 border-rose-500/20";

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
                {isPassed ? "Secure" : "Attention Needed"}
              </p>
            </div>
          </div>
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
              <span className={`font-semibold ${darkMode ? "text-gray-400" : "text-gray-500"}`}>Detected Value: </span>
              <code className={`px-1.5 py-0.5 rounded ${darkMode ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`}>
                {String(meta.value)}
              </code>
            </div>
          )}
        </div>

        {/* Meta Data (Debugging Info) */}
        {meta && Object.keys(meta).length > 0 && (
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-1 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
              Technical Data
            </h4>
            <div className={`p-2 rounded text-xs font-mono overflow-x-auto ${darkMode ? "bg-gray-900 text-gray-300" : "bg-gray-100 text-gray-700"}`}>
              {Object.entries(meta).map(([key, value]) => (
                <div key={key} className="flex flex-col sm:flex-row sm:gap-2 mb-1 last:mb-0">
                  <span className="font-semibold opacity-70">{key}:</span>
                  <span className="break-all">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Educational Content */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className={`text-sm ${subTextColor}`}>
            {content.desc}
          </p>
          <p className={`text-xs mt-2 ${darkMode ? "text-gray-500" : "text-gray-400"}`}>
            {content.why}
          </p>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------
// ✅ Section Component
// ------------------------------------------------------
const Section = ({ title, icon: Icon, children, darkMode }) => {
  return (
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
};

// ------------------------------------------------------
// ✅ MAIN COMPONENT
// ------------------------------------------------------
export default function Security_Compilance() {
  const { theme } = useContext(ThemeContext);
  const { data, loading } = useData();
  const darkMode = theme === "dark";

  if (loading || !data || data.Status === "inprogress") {
    return <SecurityShimmer darkMode={darkMode} />;
  }

  const metric = data?.Security_or_Compliance || {};
  const mainBg = darkMode ? "bg-gray-900" : "bg-gray-50";
  const textColor = darkMode ? "text-white" : "text-gray-900";

  return (
    <div className={`min-h-screen w-full ${mainBg} transition-colors duration-300`}>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">

        {/* Header Section */}
        <div className={`relative overflow-hidden rounded-3xl p-8 sm:p-10 shadow-2xl ${darkMode ? "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700" : "bg-white border border-gray-200"}`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium border border-blue-500/20">
                <ShieldCheck size={14} />
                <span>Security Audit Report</span>
              </div>
              <h1 className={`text-4xl sm:text-5xl font-black tracking-tight ${textColor}`}>
                Security & <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Compliance</span>
              </h1>
              <p className={`text-lg ${darkMode ? "text-gray-400" : "text-gray-600"}`}>
                Comprehensive analysis of your web application's security posture, including SSL, headers, privacy compliance, and vulnerability detection.
              </p>

              <div className="flex flex-wrap gap-4 justify-center md:justify-start pt-2">
                {(() => {
                  const allMetrics = Object.values(metric).filter(val => typeof val === 'object' && val !== null && 'score' in val);
                  const passedCount = allMetrics.filter(m => m.score === 100).length;
                  const failedCount = allMetrics.filter(m => m.score < 100).length;

                  return (
                    <>
                      <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                        <CheckCircle size={16} className="text-emerald-500" />
                        <span>{passedCount} Passed</span>
                      </div>
                      <div className={`flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-600"}`}>
                        <XCircle size={16} className="text-rose-500" />
                        <span>{failedCount} Failed</span>
                      </div>
                    </>
                  );
                })()}
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
              <div className={`text-sm font-medium ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                Time Taken: {data.Time_Taken}
              </div>
            </div>
          </div>

          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Section 1: Network & Encryption */}
        <Section title="Network & Encryption" icon={Lock} darkMode={darkMode}>
          {["HTTPS", "SSL", "SSL_Expiry", "HSTS", "TLS_Version"].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} />
          ))}
        </Section>

        {/* Section 2: Security Headers */}
        <Section title="Security Headers" icon={Shield} darkMode={darkMode}>
          {["X_Frame_Options", "CSP", "X_Content_Type_Options", "Cookies_Secure", "Cookies_HttpOnly"].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} />
          ))}
        </Section>

        {/* Section 3: Compliance & Privacy */}
        <Section title="Compliance & Privacy" icon={FileText} darkMode={darkMode}>
          {["Cookie_Consent", "Privacy_Policy", "GDPR_CCPA", "Data_Collection", "Forms_Use_HTTPS"].map((key) => (
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} />
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
            metric[key] && <MetricCard key={key} metricKey={key} data={metric[key]} darkMode={darkMode} />
          ))}
        </Section>
      </main>
    </div>
  );
}