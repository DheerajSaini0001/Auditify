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
    impact: "Prevents eavesdropping. Without it, anyone on the network can read the data your users send.",
    improvement: "Install an SSL certificate and force your site to load over 'https://'.",
    calculation: "We check if your site is securely served over an encrypted connection."
  },
  SSL: {
    title: "SSL Certificate",
    desc: "Checks for valid SSL certificate.",
    why: "Authenticates site identity.",
    use: "Verifies that the website has a valid, trusted SSL/TLS certificate.",
    impact: "Verifies your identity. Users trust the padlock icon; a warning scares them away immediately.",
    improvement: "Ensure your security certificate is valid, trusted, and up to date.",
    calculation: "We verify the validity and chain of trust of your SSL certificate."
  },
  SSL_Expiry: {
    title: "SSL Expiry",
    desc: "Verifies SSL expiry date.",
    why: "Expired certificates block users.",
    use: "Checks the expiration date of the SSL certificate.",
    impact: "An expired certificate triggers a 'Not Secure' warning, blocking users from entering your site.",
    improvement: "Set up auto-renewal for your certificate so it never expires unexpectedly.",
    calculation: "We check the expiration date to warn you if your certificate is about to expire."
  },
  HSTS: {
    title: "HSTS Header",
    desc: "Enforces HTTPS connections.",
    why: "Prevents downgrade attacks.",
    use: "HTTP Strict Transport Security tells browsers to ONLY use HTTPS.",
    impact: "Stops attacks that try to downgrade your secure connection to an insecure one.",
    improvement: "Enable 'HSTS' on your server to force browsers to always use a secure connection.",
    calculation: "We look for a specific header that strictly enforces HTTPS connections."
  },
  TLS_Version: {
    title: "TLS Protocol",
    desc: "Validates TLS version.",
    why: "Older versions are insecure.",
    use: "Checks the version of Transport Layer Security protocol used.",
    impact: "Old security protocols have holes that hackers can exploit.",
    improvement: "Update your server to support only modern security protocols (TLS 1.2 or 1.3).",
    calculation: "We check which version of the security protocol your server uses to communicate."
  },
  X_Frame_Options: {
    title: "X-Frame-Options",
    desc: "Protects against clickjacking.",
    why: "Prevents malicious embedding.",
    use: "Controls whether the site can be embedded in an <iframe>.",
    impact: "Prevents hackers from putting your site inside an invisible frame to trick users (Clickjacking).",
    improvement: "Add the 'X-Frame-Options' header to stop other sites from embedding yours.",
    calculation: "We verify if you have rules preventing your site from being embedded in a frame."
  },
  CSP: {
    title: "Content Security Policy",
    desc: "Content Security Policy.",
    why: "Mitigates XSS and injection attacks.",
    use: "Whitelists sources of approved content (scripts, styles, images).",
    impact: "A strong shield that stops unauthorized scripts from running on your page.",
    improvement: "Define a policy that allows content only from trusted sources.",
    calculation: "We check if you have a policy that restricts where content can be loaded from."
  },
  X_Content_Type_Options: {
    title: "MIME Sniffing",
    desc: "Prevents MIME sniffing.",
    why: "Stops file type exploits.",
    use: "Prevents browsers from interpreting files as a different MIME type.",
    impact: "Stops browsers from being tricked into running a file as a script when it shouldn't be.",
    improvement: "Add this header to tell browsers to strictly follow the file types you declare.",
    calculation: "We look for a header that prevents 'MIME-sniffing' attacks."
  },
  Cookies_Secure: {
    title: "Secure Cookies",
    desc: "Ensures Secure flag on cookies.",
    why: "Protects cookies over network.",
    use: "Ensures cookies are only sent over encrypted HTTPS connections.",
    impact: "Ensures cookies (like login sessions) are only sent over secure channels.",
    improvement: "Add the 'Secure' flag to your cookies so they never travel over plain HTTP.",
    calculation: "We verify that sensitive cookies are marked to be sent only over HTTPS."
  },
  Cookies_HttpOnly: {
    title: "HttpOnly Cookies",
    desc: "Prevents JS access to cookies.",
    why: "Mitigates XSS cookie theft.",
    use: "Prevents client-side scripts (JavaScript) from accessing cookies.",
    impact: "Prevents malicious scripts from stealing your users' login cookies.",
    improvement: "Add the 'HttpOnly' flag to cookies so JavaScript cannot access them.",
    calculation: "We check if your cookies are protected from being accessed by client-side scripts."
  },
  Google_Safe_Browsing: {
    title: "Safe Browsing",
    desc: "Checks Google blacklist.",
    why: "Ensures site isn't flagged.",
    use: "Checks if the domain is listed in Google's database of unsafe sites.",
    impact: "If Google thinks your site is unsafe, they will show a giant red warning screen to users.",
    improvement: "Keep your site clean of malware and request a review if you are flagged.",
    calculation: "We check if your domain is listed on Google's blacklist of unsafe sites."
  },
  Blacklist: {
    title: "Domain Blacklist",
    desc: "Domain blacklist check.",
    why: "Protects reputation.",
    use: "Checks multiple DNS blacklists (spam, malware).",
    impact: "Being blacklisted ruins your reputation and causes your emails to go to spam.",
    improvement: "Monitor your domain's health and remove any malware immediately.",
    calculation: "We check multiple global blacklists to see if your domain has been flagged."
  },
  Malware_Scan: {
    title: "Malware Detection",
    desc: "Scans for malware.",
    why: "Detects malicious code.",
    use: "Scans page content for known malicious signatures or obfuscated code.",
    impact: "Malware steals user data and destroys trust. It can get your site banned.",
    improvement: "Use security scanners and keep your software/plugins updated to prevent infection.",
    calculation: "We scan your page source for signatures of common malicious code."
  },
  SQLi_Exposure: {
    title: "SQL Injection",
    desc: "SQL Injection check.",
    why: "Prevents database compromise.",
    use: "Checks if inputs can manipulate database queries.",
    impact: "A major hole that lets attackers steal or delete your entire database.",
    improvement: "Sanitize all user inputs (forms, search bars) to prevent code injection.",
    calculation: "We test your input fields to see if they are vulnerable to database manipulation attacks."
  },
  XSS: {
    title: "XSS Protection",
    desc: "Cross-Site Scripting check.",
    why: "Prevents script injection.",
    use: "Checks if user input is properly escaped before rendering.",
    impact: "Allows attackers to inject malicious scripts that can steal accounts or deface your site.",
    improvement: "Ensure your code 'escapes' (cleans) any user input before showing it on screen.",
    calculation: "We check if your site properly handles and neutralizes potential script injections."
  },
  Cookie_Consent: {
    title: "Cookie Consent",
    desc: "GDPR Cookie Consent.",
    why: "Legal compliance.",
    use: "Verifies if a cookie consent banner is present.",
    impact: "Required by law (GDPR/CCPA). Ignoring it can lead to heavy fines.",
    improvement: "Add a clear banner asking users for permission to track them with cookies.",
    calculation: "We look for a visible banner or popup that manages user consent."
  },
  Privacy_Policy: {
    title: "Privacy Policy",
    desc: "Privacy Policy check.",
    why: "Builds user trust.",
    use: "Checks for the existence of a privacy policy page.",
    impact: "Building trust is key. Users and laws require you to explain how you handle data.",
    improvement: "Create a clear Privacy Policy page and link to it from your footer.",
    calculation: "We verify that your site has a page explaining your privacy practices."
  },
  Forms_Use_HTTPS: {
    title: "Secure Forms",
    desc: "Secure form submission.",
    why: "Protects user input.",
    use: "Ensures login and contact forms submit data over HTTPS.",
    impact: "Sending passwords or messages over an insecure connection allows hackers to read them.",
    improvement: "Ensure all login and contact forms submit data specifically to 'https' URLs.",
    calculation: "We check that your forms send data securely, not over plain text connections."
  },
  GDPR_CCPA: {
    title: "GDPR/CCPA",
    desc: "Data protection compliance.",
    why: "Avoids legal fines.",
    use: "Checks for signs of data privacy regulation compliance.",
    impact: "Protects user rights. Users want to know they can control their personal data.",
    improvement: "Provide a clear way for users to request or delete their data ('Do Not Sell My Info').",
    calculation: "We check for specific legal compliance links and keywords on your site."
  },
  Data_Collection: {
    title: "Data Collection",
    desc: "Data collection disclosure.",
    why: "Transparency with users.",
    use: "Identifies if the site collects sensitive data.",
    impact: "Users are wary of giving info. Transparency increases likelihood of conversion.",
    improvement: "Only ask for data you need and explain clearly why you need it.",
    calculation: "We identify what data you are collecting through forms and check for transparency."
  },
  Weak_Default_Credentials: {
    title: "Default Credentials",
    desc: "Checks default passwords.",
    why: "Prevents easy takeovers.",
    use: "Checks for exposed default login paths or credentials.",
    impact: "Leaving default passwords (like 'admin') is the easiest way to get hacked.",
    improvement: "Change all default usernames and passwords immediately after installation.",
    calculation: "We check if common default admin pages are accessible."
  },
  MFA_Enabled: {
    title: "MFA Status",
    desc: "Multi-Factor Authentication.",
    why: "Adds security layer.",
    use: "Checks if MFA is enforced for sensitive areas.",
    impact: "The single most effective way to prevent unauthorized account access.",
    improvement: "Enable Two-Factor Authentication (2FA) for all administrator accounts.",
    calculation: "We look for signs that extra login security is required for admin areas."
  },
  Admin_Panel_Public: {
    title: "Admin Exposure",
    desc: "Exposed admin panel.",
    why: "Reduces attack surface.",
    use: "Checks if admin login pages are publicly accessible.",
    impact: "Exposing your login page to the whole world invites brute-force attacks.",
    improvement: "Hide your admin login page or restrict access to trusted IP addresses.",
    calculation: "We check if your administrative login page is visible to the public."
  },
  Viewport_Meta_Tag: {
    title: "Viewport Meta",
    desc: "Mobile responsiveness.",
    why: "Essential for UX.",
    use: "Controls layout on mobile browsers.",
    impact: "Without this, mobile phones will display a tiny, unreadable desktop version of your site.",
    improvement: "Add the viewport tag to ensure your site is mobile-friendly.",
    calculation: "We check if your code tells mobile browsers how to scale the page correctly."
  },
  HTML_Doctype: {
    title: "Doctype",
    desc: "HTML Doctype declaration.",
    why: "Ensures correct rendering.",
    use: "Specifies the HTML version to the browser.",
    impact: "Tells the browser which version of code you are using. Prevents layout errors.",
    improvement: "Start every HTML file with the standard DOCTYPE declaration.",
    calculation: "We verify that your document starts with the correct type declaration."
  },
  Character_Encoding: {
    title: "Charset",
    desc: "UTF-8 encoding.",
    why: "Prevents text issues.",
    use: "Specifies how characters are represented.",
    impact: "Without this, special characters (like emojis or accents) will look like broken symbols.",
    improvement: "Set your encoding to 'UTF-8' so text displays correctly in all languages.",
    calculation: "We check if you have declared the correct text character set."
  },
  Browser_Console_Errors: {
    title: "Console Errors",
    desc: "Console errors.",
    why: "Indicates broken code.",
    use: "Checks for JavaScript errors in the browser console.",
    impact: "Errors in the code indicate broken features that frustrate users.",
    improvement: "Check your browser console and fix any red error messages.",
    calculation: "We monitor the browser console for errors that occur while the page loads."
  },
  Geolocation_Request: {
    title: "Geolocation",
    desc: "Geolocation permissions.",
    why: "Respects user privacy.",
    use: "Checks if the site requests location data immediately on load.",
    impact: "Asking for location immediately annoys users and leads to high 'Block' rates.",
    improvement: "Only ask for location when the user actually taps a button (like 'Find Store').",
    calculation: "We check if your site requests location access without user interaction."
  },
  Input_Paste_Allowed: {
    title: "Paste Check",
    desc: "Paste restrictions.",
    why: "Bad UX and security.",
    use: "Checks if pasting is blocked in password fields.",
    impact: "Blocking paste forces users to type long passwords, leading to typos and frustration.",
    improvement: "Allow users to paste into password fields. It improves security (password managers).",
    calculation: "We verify that you have not disabled the 'paste' functionality on forms."
  },
  Notification_Request: {
    title: "Notifications",
    desc: "Notification permissions.",
    why: "Avoids user annoyance.",
    use: "Checks for push notification prompts on load.",
    impact: "Popups asking for notifications on load are universally hated and usually blocked.",
    improvement: "Ask for permission only after the user requests to be notified.",
    calculation: "We check if your site interrupts the user with a notification prompt immediately."
  },
  Third_Party_Cookies: {
    title: "3rd Party Cookies",
    desc: "Third-party cookies.",
    why: "Privacy concern.",
    use: "Cookies set by domains other than the website itself.",
    impact: "Tracking users across the web is becoming restricted and lowers trust.",
    improvement: "Focus on first-party data. Reduce reliance on external advertising trackers.",
    calculation: "We identify cookies set by other domains that track user behavior."
  },
  Deprecated_APIs: {
    title: "Deprecated APIs",
    desc: "Deprecated APIs.",
    why: "Avoids security holes.",
    use: "Checks for usage of old, insecure browser features.",
    impact: "Using old, removed code features can make your site stop working in new browsers.",
    improvement: "Update your codebase to use modern, standard browser features.",
    calculation: "We scan your code for outdated features that browsers are removing."
  },
};

// ------------------------------------------------------
// ✅ Score Calculation Info (Weighted Average)
// ------------------------------------------------------
const scoreCalculationInfo = {
  icon: ShieldCheck,
  title: "Security & Compliance",
  guideLink: "https://owasp.org/www-project-top-ten/",
  use: (
    <div className="space-y-2">
      <p>Evaluates how securely your website is configured and whether it follows modern security, privacy, and compliance best practices.</p>
      <p>It checks encryption, security headers, vulnerabilities, malware risks, data protection, authentication safeguards, and user privacy signals.</p>
    </div>
  ),
  impact: "Security issues put users, data, and your business at risk. Weak configurations can lead to breaches, malware infections, regulatory violations, and loss of trust. A secure and compliant website protects users, reduces legal exposure, and builds credibility with customers and search engines.",
  improvement: (
    <ul className="list-disc pl-5 space-y-2">
      <li>
        <span className="font-semibold">Secure your site with HTTPS and valid SSL:</span> Ensure your site uses HTTPS, has a valid SSL certificate, and supports modern encryption protocols.
      </li>
      <li>
        <span className="font-semibold">Harden security headers:</span> Use headers that protect against common attacks, such as clickjacking, content injection, and MIME sniffing.
      </li>
      <li>
        <span className="font-semibold">Protect against common vulnerabilities:</span> Prevent exposure to issues like SQL injection, cross-site scripting (XSS), and insecure admin access.
      </li>
      <li>
        <span className="font-semibold">Avoid weak or default credentials:</span> Ensure login systems are protected with secure credentials, proper access controls, and modern authentication practices.
      </li>
      <li>
        <span className="font-semibold">Enable multi-factor authentication where possible:</span> Adding MFA or secure single sign-on greatly reduces account takeover risks.
      </li>
      <li>
        <span className="font-semibold">Ensure cookies and forms are handled securely:</span> Cookies should be properly flagged, and forms should submit data over secure connections only.
      </li>
      <li>
        <span className="font-semibold">Comply with privacy and data protection expectations:</span> Display cookie consent notices, privacy policies, and disclosures about how user data is collected and used.
      </li>
      <li>
        <span className="font-semibold">Prevent unnecessary permission requests:</span> Avoid requesting sensitive permissions (such as notifications or location) without clear user intent.
      </li>
    </ul>
  ),
  calculation: (
    <div className="space-y-2">
      <p>We evaluate your site across multiple security and compliance categories, including encryption, headers, vulnerabilities, authentication, malware reputation, and privacy practices.</p>
      <p>Each check is weighted based on risk severity. Critical security issues have a stronger impact on the final score, ensuring the result reflects real-world security risk rather than cosmetic issues.</p>
    </div>
  ),
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
              title="View Methodology"
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
                        <span className="border-b border-transparent hover:border-current">Metric Methodology</span>
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