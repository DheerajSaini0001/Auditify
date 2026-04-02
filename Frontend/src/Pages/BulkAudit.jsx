import React, { useState, useContext, useEffect, useRef } from "react";
import { Loader2, Monitor, Smartphone, ChevronDown, Settings, AlertCircle, Globe, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { ThemeContext } from "../context/ThemeContext.jsx";
import { useData } from "../context/DataContext";
import SkeletonLoader from "../Component/SkeletonLoader";

// Custom Dropdown Component
const CustomDropdown = ({ value, onChange, options, icon, darkMode, disabled }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`
          flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-all duration-300
          ${darkMode
                        ? "bg-slate-800/50 border-slate-700 text-slate-300 hover:border-slate-600 shadow-lg shadow-black/20"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 shadow-sm"
                    }
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        `}
            >
                <div className="flex items-center gap-3">
                    {icon && <span className={`${darkMode ? "text-emerald-400" : "text-emerald-500"}`}>{icon}</span>}
                    <span className="font-semibold">{value}</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && (
                <div className={`
          absolute z-50 w-full mt-2 rounded-xl border p-2 shadow-2xl animate-in zoom-in-95 duration-200
          ${darkMode ? "bg-slate-900 border-slate-700 shadow-black" : "bg-white border-slate-100 shadow-slate-200"}
        `}>
                    {options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => {
                                onChange(option);
                                setIsOpen(false);
                            }}
                            className={`
                w-full text-left px-4 py-2.5 rounded-lg font-medium transition-all
                ${value === option
                                    ? (darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600")
                                    : (darkMode ? "text-slate-400 hover:bg-slate-800" : "text-slate-600 hover:bg-slate-50")
                                }
              `}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default function BulkAudit() {
    const { theme } = useContext(ThemeContext);
    const { isAuthenticated } = useAuth();
    const { setData, discoverUrls, startBulkAudit, getBulkAuditStatus } = useData();
    const darkMode = theme === "dark";
    const navigate = useNavigate();
    const { id: paramId } = useParams(); // Get ID from URL if present

    // Step 1: URL Discovery
    const [inputValue, setInputValue] = useState("");
    const [maxPages, setMaxPages] = useState(50);
    const [discovering, setDiscovering] = useState(false);
    const [discoveredUrls, setDiscoveredUrls] = useState([]);
    const [baseUrl, setBaseUrl] = useState("");

    // Step 2: URL Selection & Audit
    const [selectedUrls, setSelectedUrls] = useState([]);
    const [device, setDevice] = useState("Desktop");
    const [report, setReport] = useState("All");
    const [auditing, setAuditing] = useState(false);
    const [bulkAuditId, setBulkAuditId] = useState(null);
    const [bulkAuditData, setBulkAuditData] = useState(null);
    const [pollingInterval, setPollingInterval] = useState(null);
    const [isRestoring, setIsRestoring] = useState(true);

    // reCAPTCHA State
    const recaptchaRef = useRef(null);
    const [showCaptcha, setShowCaptcha] = useState(false);
    const [captchaError, setCaptchaError] = useState(false);
    const [captchaAction, setCaptchaAction] = useState(null); // 'discover' | 'audit'

    // Restore session / Handle URL ID / Handle Auto-run from Dashboard
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const queryUrl = params.get("url");

        // Priority 1: URL Param (Direct Link)
        if (paramId) {
            setBulkAuditId(paramId);
            setAuditing(true);
            setIsRestoring(false);
            return;
        }

        // Priority 2: Auto-run from Dashboard (via ?url=...&auto=true)
        if (queryUrl) {
            setInputValue(queryUrl);
            // If it's a verified property or explicit auto-run request
            if (params.get("auto") === "true") {
                // We show captcha first for security, then it proceeds
                setCaptchaAction('discover');
                setShowCaptcha(true);
            }
        }

        // Priority 3: Session Storage (Restore previous session if no URL param)
        const savedId = sessionStorage.getItem("activeBulkAuditId");
        if (savedId) {
            setBulkAuditId(savedId);
            setAuditing(true);
        }
        setIsRestoring(false);
    }, [paramId]);

    const [error, setError] = useState(null);

    // Poll for bulk audit status
    useEffect(() => {
        let isMounted = true;
        let interval = null;

        const processPollResponse = (response) => {
            if (!isMounted) return;

            if (response.success) {
                setBulkAuditData(response.data);

                if (response.data.status === "completed" || response.data.status === "failed") {
                    if (interval) clearInterval(interval);
                    setPollingInterval(null);
                    setAuditing(false);
                }
            } else {
                console.error("Error polling bulk audit status");
                const status = response.status;

                if (status === 404) {
                    console.warn("Bulk Audit Not Found (404). Redirecting...");
                    if (interval) clearInterval(interval);
                    setPollingInterval(null);
                    setBulkAuditId(null);
                    setBulkAuditData(null);
                    sessionStorage.removeItem("activeBulkAuditId");
                    setAuditing(false);

                    if (paramId) {
                        navigate("/bulk-audit", { replace: true });
                    }
                    return;
                }

                if (status === 429 || status === 500) {
                    console.warn("Polling stopping due to error:", status);
                    if (interval) clearInterval(interval);
                    setPollingInterval(null);
                    setAuditing(false);

                    if (status === 429) setError("Too many requests. Please try again later.");
                    else if (status === 500) setError("Server error. Session reset.");
                }
            }
        };

        if (bulkAuditId && !pollingInterval) {
            // Start polling (3s)
            interval = setInterval(async () => {
                if (!isMounted) return;
                const response = await getBulkAuditStatus(bulkAuditId);
                processPollResponse(response);
            }, 3000);

            setPollingInterval(interval);

            // Immediate first check
            (async () => {
                if (!isMounted) return;
                const response = await getBulkAuditStatus(bulkAuditId);
                processPollResponse(response);
            })();
        }

        return () => {
            isMounted = false;
            // Cleanup standard polling interval
            if (interval) clearInterval(interval);
            // Cleanup any interval stored in state (though usually same)
            if (pollingInterval) clearInterval(pollingInterval);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [bulkAuditId]);

    // Step 1: Discover URLs (Trigger CAPTCHA)
    const handleDiscoverUrls = async (e) => {
        e.preventDefault();
        setError(null);

        if (!inputValue.trim()) {
            setError("Please enter a URL before proceeding!");
            return;
        }

        if (isAuthenticated) {
            proceedDiscovery(null);
            return;
        }

        setCaptchaAction('discover');
        setShowCaptcha(true);
        setCaptchaError(false);
    };

    const handleCaptchaChange = (token) => {
        if (token) {
            setCaptchaError(false);
            if (captchaAction === 'discover') {
                proceedDiscovery(token);
            } else if (captchaAction === 'audit') {
                proceedBulkAudit(token);
            }
        }
    };

    const handleCaptchaExpired = () => {
        setCaptchaError(true);
    };

    const proceedDiscovery = async (token) => {
        setShowCaptcha(false);
        setError(null);

        let urlToFetch = inputValue.trim();
        if (!/^https?:\/\//i.test(urlToFetch)) {
            urlToFetch = `https://${urlToFetch}`;
        }

        setDiscovering(true);
        const response = await discoverUrls(urlToFetch, maxPages, token);

        if (response.success) {
            setDiscoveredUrls(response.data.urls);
            setBaseUrl(response.data.site);
            setSelectedUrls(response.data.urls); // Select all by default

        } else {
            console.error("Error discovering URLs:", response.error);
            setError(response.error || "Failed to discover URLs");
        }

        setDiscovering(false);
    };

    // Step 2: Start Audit for Selected URLs (Trigger CAPTCHA)
    const handleStartAudit = async () => {
        setError(null);

        if (selectedUrls.length === 0) {
            setError("Please select at least one URL to audit");
            return;
        }

        if (isAuthenticated) {
            proceedBulkAudit(null);
            return;
        }

        setCaptchaAction('audit');
        setShowCaptcha(true);
        setCaptchaError(false);
    };

    const proceedBulkAudit = async (token) => {
        setShowCaptcha(false);
        setError(null);

        // Fallback to inputValue if baseUrl is missing
        const auditUrl = baseUrl || inputValue;
        if (!auditUrl) {
            setError("Base URL is missing. Please try discovering URLs again.");
            return;
        }

        setAuditing(true);
        const response = await startBulkAudit(auditUrl, selectedUrls, device, report, token);

        if (response.success) {
            setBulkAuditId(response.data.bulkAuditId);
            sessionStorage.setItem("activeBulkAuditId", response.data.bulkAuditId);
            
        } else {
            console.error("Error starting audit:", response.error);
            setError(response.error || "Failed to start audit");
            setAuditing(false);
        }
    };

    // Toggle URL selection
    const toggleUrlSelection = (url) => {
        setSelectedUrls(prev =>
            prev.includes(url)
                ? prev.filter(u => u !== url)
                : [...prev, url]
        );
    };

    // Select/Deselect all
    const toggleSelectAll = () => {
        if (selectedUrls.length === discoveredUrls.length) {
            setSelectedUrls([]);
        } else {
            setSelectedUrls([...discoveredUrls]);
        }
    };

    const viewSingleReport = (page) => {
        const reportData = {
            url: page.url,
            device: bulkAuditData.device,
            report: bulkAuditData.report,
            status: page.status,
            score: page.score,
            grade: page.grade,
            overallScore: page.score, // added to mirror SingleAuditReport
            timeTaken: page.timeTaken,
            sectionScore: page.sectionScore,

            // Actual audit data
            technicalPerformance: page.technicalPerformance,
            onPageSEO: page.onPageSEO,
            accessibility: page.accessibility,
            securityOrCompliance: page.securityOrCompliance,
            UXOrContentStructure: page.UXOrContentStructure,
            conversionAndLeadFlow: page.conversionAndLeadFlow,
            aioReadiness: page.aioReadiness,

            screenshot: page.screenshot,
            fromBulkAudit: true
        };

        setData(reportData);
        navigate("/report");
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case "completed":
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case "failed":
                return <XCircle className="w-5 h-5 text-red-500" />;
            case "inprogress":
                return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
            default:
                return <Clock className="w-5 h-5 text-yellow-500" />;
        }
    };

    const containerClass = darkMode
        ? "min-h-screen flex flex-col items-center bg-[#0B1120] text-white relative font-sans py-12"
        : "min-h-screen flex flex-col items-center bg-slate-50 text-slate-900 relative font-sans py-12";

    return (
        <div className={containerClass}>
            {/* Background Grid Pattern */}
            <div className={`absolute inset-0 ${darkMode ? 'bg-grid-white/[0.03]' : 'bg-grid-black/[0.03]'} pointer-events-none`} />

            {/* Content Wrapper */}
            <div className="relative z-10 w-full max-w-6xl px-4">

                {/* Header Section */}
                <div className="text-center mb-10 space-y-5 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
                        Audit <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500">Selected Pages</span>
                    </h1>
                    <p className={`max-w-2xl mx-auto text-lg ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                        Discover all pages, select which ones to audit, and get comprehensive reports.
                    </p>
                </div>

                {/* Step 1: URL Discovery Form */}
                {!isRestoring && !bulkAuditId && discoveredUrls.length === 0 && (
                    <form onSubmit={handleDiscoverUrls} className="w-full max-w-4xl mx-auto relative animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                        <div className={`
              flex flex-col lg:flex-row items-center p-2 rounded-2xl border transition-all duration-300
              ${darkMode
                                ? "bg-slate-900/90 border-slate-700 shadow-2xl shadow-black/50 hover:border-slate-600"
                                : "bg-white border-slate-200 shadow-xl shadow-slate-200/50 hover:border-slate-300"
                            }
            `}>
                            <div className="relative flex-grow flex items-center w-full px-4 mb-4 lg:mb-0">
                                <Globe className={`w-5 h-5 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Enter website URL (e.g., example.com)"
                                    className={`w-full py-4 px-4 bg-transparent outline-none font-medium ${darkMode ? "text-white" : "text-slate-900"}`}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                                <input
                                    type="number"
                                    value={maxPages}
                                    onChange={(e) => setMaxPages(Math.min(Math.max(1, parseInt(e.target.value) || 1), 100))}
                                    min="1"
                                    max="100"
                                    disabled={discovering}
                                    className={`w-24 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${darkMode
                                        ? "bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600"
                                        : "bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300"
                                        } ${discovering ? "opacity-50 cursor-not-allowed" : ""}`}
                                    placeholder="Max"
                                />

                                {/* Discover Button */}
                                <button
                                    type="submit"
                                    disabled={discovering}
                                    className={`
                    flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all 
                    bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 hover:shadow-emerald-500/25 active:scale-95
                    disabled:opacity-70 disabled:cursor-wait min-w-[140px]
                  `}
                                >
                                    {discovering ? <Loader2 className="animate-spin w-5 h-5" /> : "Discover URLs"}
                                </button>
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="absolute -bottom-16 left-0 right-0 mx-auto w-full max-w-md animate-in slide-in-from-top-2 fade-in">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 backdrop-blur-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="text-sm font-medium">{error}</span>
                                </div>
                            </div>
                        )}
                    </form>
                )}

                {/* Step 2: URL Selection & Configuration */}
                {!isRestoring && !bulkAuditId && discoveredUrls.length > 0 && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-700">
                        {/* Control Bar */}
                        <div className={`p-6 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-6 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/50"}`}>
                            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
                                <CustomDropdown
                                    value={device}
                                    onChange={setDevice}
                                    options={["Desktop", "Mobile"]}
                                    icon={device === "Desktop" ? <Monitor className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
                                    darkMode={darkMode}
                                    disabled={auditing}
                                />
                                <CustomDropdown
                                    value={report}
                                    onChange={setReport}
                                    options={["All", "Technical Performance", "On Page SEO", "Accessibility", "Security/Compliance", "UX & Content Structure", "Conversion & Lead Flow", "AIO (AI-Optimization) Readiness"]}
                                    icon={<Settings className="w-5 h-5" />}
                                    darkMode={darkMode}
                                    disabled={auditing}
                                />
                            </div>

                            <button
                                onClick={handleStartAudit}
                                disabled={auditing || selectedUrls.length === 0}
                                className={`
                  flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all
                  bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 hover:shadow-emerald-500/25 active:scale-95
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
                            >
                                {auditing ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                Start Bulk Audit ({selectedUrls.length} Pages)
                            </button>
                        </div>

                        {/* URL Selection List */}
                        <div className={`rounded-2xl border overflow-hidden ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100 shadow-xl"}`}>
                            <div className={`px-6 py-4 border-b flex items-center justify-between ${darkMode ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                                <h3 className={`font-bold flex items-center gap-2 ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                                    Discovered URLs
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">{discoveredUrls.length}</span>
                                </h3>
                                <button
                                    onClick={toggleSelectAll}
                                    className={`text-sm font-bold transition-colors ${darkMode ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-700"}`}
                                >
                                    {selectedUrls.length === discoveredUrls.length ? "Deselect All" : "Select All"}
                                </button>
                            </div>

                            <div className="max-h-[500px] overflow-y-auto overflow-x-hidden">
                                <div className="divide-y divide-slate-800/20">
                                    {discoveredUrls.map((url, index) => (
                                        <div
                                            key={index}
                                            onClick={() => toggleUrlSelection(url)}
                                            className={`
                        px-6 py-4 flex items-center gap-4 transition-all cursor-pointer group
                        ${selectedUrls.includes(url)
                                                    ? (darkMode ? "bg-emerald-500/5" : "bg-emerald-50/50")
                                                    : (darkMode ? "hover:bg-slate-800/50" : "hover:bg-slate-50/50")
                                                }
                      `}
                                        >
                                            <div className={`
                        w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-all
                        ${selectedUrls.includes(url)
                                                    ? "bg-emerald-500 border-emerald-500"
                                                    : (darkMode ? "border-slate-700 group-hover:border-slate-600" : "border-slate-300 group-hover:border-slate-400")
                                                }
                      `}>
                                                {selectedUrls.includes(url) && <div className="w-1.5 h-3 border-r-2 border-b-2 border-white rotate-45 mb-0.5" />}
                                            </div>
                                            <span className={`text-sm font-medium truncate ${selectedUrls.includes(url)
                                                ? (darkMode ? "text-emerald-400" : "text-emerald-700")
                                                : (darkMode ? "text-slate-400" : "text-slate-600")
                                                }`}>{url}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Real-time Audit Progress */}
                {(bulkAuditId || auditing) && (
                    <div className="space-y-8 animate-in fade-in duration-1000">
                        {/* Status Summary */}
                        <div className={`p-8 rounded-3xl border ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-2xl shadow-slate-200/50"}`}>
                            {!bulkAuditData ? (
                                <div className="flex flex-col items-center gap-5 py-8">
                                    <div className="relative">
                                        <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <RefreshCw className="w-8 h-8 text-emerald-500 animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-2xl font-black mb-2">Preparing Audit</h3>
                                        <p className={`${darkMode ? "text-slate-400" : "text-slate-500"}`}>Configuring engines and allocating resources...</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                                    <div className="space-y-2">
                                        <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Progress</p>
                                        <div className="flex items-end gap-2">
                                            <span className="text-4xl font-black">{bulkAuditData.progress}%</span>
                                            <span className={`text-sm font-bold mb-1.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>({bulkAuditData.completedAudits}/{bulkAuditData.totalAudits})</span>
                                        </div>
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                                                style={{ width: `${bulkAuditData.progress}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Avg. Score</p>
                                        <div className="flex items-baseline gap-2">
                                            <span className={`text-4xl font-black ${bulkAuditData.averageScore >= 80 ? "text-emerald-400" : "text-yellow-400"}`}>{bulkAuditData.averageScore}</span>
                                            <span className="text-sm font-bold text-slate-500">/ 100</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Audit Mode</p>
                                        <p className="text-xl font-bold flex items-center gap-2">
                                            {bulkAuditData.device === "Desktop" ? <Monitor className="w-5 h-5 text-emerald-400" /> : <Smartphone className="w-5 h-5 text-emerald-400" />}
                                            {bulkAuditData.report}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-slate-400"}`}>Status</p>
                                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full font-bold text-xs uppercase tracking-widest bg-emerald-500/10 text-emerald-500 border border-emerald-500/20`}>
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                            {bulkAuditData.status}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Results List */}
                        {bulkAuditData && (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-4">
                                    <h3 className="text-2xl font-black">Audit Results</h3>
                                    <div className="flex gap-2">
                                        {/* Status badges summary */}
                                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            {bulkAuditData.pages.filter(p => p.status === "inprogress").length} In Progress
                                        </span>
                                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                            {bulkAuditData.pages.filter(p => p.status === "completed").length} Done
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {bulkAuditData.pages.map((page, index) => (
                                        <div
                                            key={index}
                                            onClick={() => page.status === "completed" && viewSingleReport(page)}
                                            className={`
                        p-5 rounded-2xl border transition-all duration-300 flex items-center gap-4 group
                        ${page.status === "completed" ? "cursor-pointer hover:border-emerald-500/50 hover:shadow-lg hover:shadow-emerald-500/5" : "opacity-60"}
                        ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl shadow-slate-200/30"}
                      `}
                                        >
                                            <div className="flex-grow min-w-0">
                                                <div className="flex items-center gap-2 mb-1.5">
                                                    {getStatusIcon(page.status)}
                                                    <span className={`text-sm font-bold truncate ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{page.url}</span>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {page.status === "completed" ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className={`text-base font-black ${page.score >= 80 ? "text-emerald-400" : "text-yellow-400"}`}>
                                                                {page.score}%
                                                            </div>
                                                            <div className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${page.score >= 90 ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                                                                Grade {page.grade}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className={`text-xs font-bold uppercase tracking-widest ${darkMode ? "text-slate-600" : "text-slate-400"}`}>
                                                            {page.status === "inprogress" ? "Analyzing..." : "Waiting..."}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {page.status === "completed" && (
                                                <div className="flex flex-col items-end gap-2">
                                                    <div className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-600"}`}>
                                                        ⏱️ Completed in {page.timeTaken}
                                                    </div>
                                                    {page.status === "completed" && (
                                                        <div className={`text-xs font-bold flex items-center gap-1 ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                                                            View Report <ExternalLink className="w-3 h-3" />
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                    </div>
                )}

            </div>

            {/* reCAPTCHA v2 Modal Overlay */}
            {showCaptcha && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md transition-all duration-300">
                    <div className={`
                    ${darkMode ? "bg-slate-900 border-slate-700 shadow-emerald-500/10" : "bg-white border-slate-100 shadow-slate-200/50"}
                    border border-solid rounded-[2.5rem] shadow-2xl p-8 flex flex-col items-center gap-6 max-w-sm w-full mx-4 animate-in zoom-in-95 duration-200
                  `}>
                        <div className={`p-5 rounded-full ${darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}`}>
                            <Monitor className="w-10 h-10" />
                        </div>

                        <div className="text-center space-y-2">
                            <h3 className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>Verify Security</h3>
                            <p className={`text-sm font-medium leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                                {captchaAction === 'discover'
                                    ? "Confirm you're human to discover website URLs."
                                    : "Confirm you're human to start your bulk audit report."}
                            </p>
                        </div>

                        <div className={`p-2 rounded-2xl border ${darkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                            <ReCAPTCHA
                                ref={recaptchaRef}
                                sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                                onChange={handleCaptchaChange}
                                onExpired={handleCaptchaExpired}
                                theme={darkMode ? "dark" : "light"}
                            />
                        </div>

                        {captchaError && (
                            <div className="flex items-center gap-2 text-rose-500 px-4 py-2 rounded-full bg-rose-500/10 border border-rose-500/20 animate-pulse">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-xs font-bold uppercase tracking-widest">Verification Expired</span>
                            </div>
                        )}

                        <button
                            onClick={() => setShowCaptcha(false)}
                            className={`text-xs font-bold uppercase tracking-[0.2em] ${darkMode ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-900"} transition-all duration-200 hover:scale-110 active:scale-95`}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
