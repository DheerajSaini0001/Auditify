import React, { useState, useContext, useEffect } from "react";
import { Loader2, Monitor, Smartphone, ChevronDown, Settings, AlertCircle, Globe, CheckCircle2, XCircle, Clock, ExternalLink, RefreshCw } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
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

    const selectedLabel = options.find((opt) => opt.value === value)?.label || value;

    return (
        <div className="relative" ref={dropdownRef}>
            <div
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors border ${darkMode
                    ? "hover:bg-slate-800 border-transparent hover:border-slate-700"
                    : "hover:bg-slate-50 border-transparent hover:border-slate-200"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
                {icon}
                <span className={`text-sm font-medium ${darkMode ? "text-slate-300" : "text-slate-700"} truncate`}>
                    {selectedLabel}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""} ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
            </div>

            {isOpen && (
                <div className={`absolute top-full mt-2 left-0 w-max min-w-full z-50 rounded-xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${darkMode ? "bg-slate-900 border-slate-700 text-slate-300" : "bg-white border-slate-100 text-slate-700"
                    }`}>
                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium cursor-pointer transition-colors ${darkMode
                                    ? "hover:bg-slate-800 hover:text-white"
                                    : "hover:bg-slate-50 hover:text-black"
                                    } ${value === option.value ? (darkMode ? "bg-slate-800 text-white" : "bg-slate-50 text-black") : ""}`}
                            >
                                {value === option.value && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                                {option.label}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default function BulkAudit() {
    const { theme } = useContext(ThemeContext);
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

    // Restore session / Handle URL ID
    useEffect(() => {
        // Priority 1: URL Param (Direct Link)
        if (paramId) {
            setBulkAuditId(paramId);
            setAuditing(true);
            setIsRestoring(false);
            return;
        }

        // Priority 2: Session Storage (Restore previous session if no URL param)
        const savedId = sessionStorage.getItem("activeBulkAuditId");
        if (savedId) {
            setBulkAuditId(savedId);
            setAuditing(true);
        }
        setIsRestoring(false);
    }, [paramId]);

    const [error, setError] = useState(null);

    // Poll for bulk audit status
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

    // Step 1: Discover URLs
    const handleDiscoverUrls = async (e) => {
        e.preventDefault();
        setError(null);

        if (!inputValue.trim()) {
            setError("Please enter a URL before proceeding!");
            return;
        }

        let urlToFetch = inputValue.trim();
        if (!/^https?:\/\//i.test(urlToFetch)) {
            urlToFetch = `https://${urlToFetch}`;
        }

        setDiscovering(true);

        const response = await discoverUrls(urlToFetch, maxPages);

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

    // Step 2: Start Audit for Selected URLs
    const handleStartAudit = async () => {
        setError(null);

        if (selectedUrls.length === 0) {
            setError("Please select at least one URL to audit");
            return;
        }

        // Fallback to inputValue if baseUrl is missing (should not happen normally)
        const auditUrl = baseUrl || inputValue;
        if (!auditUrl) {
            setError("Base URL is missing. Please try discovering URLs again.");
            return;
        }

        setAuditing(true);

        const response = await startBulkAudit(auditUrl, selectedUrls, device, report);

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

    // Reset to start over
    const handleReset = () => {
        setDiscoveredUrls([]);
        setSelectedUrls([]);
        setBulkAuditId(null);
        sessionStorage.removeItem("activeBulkAuditId");
        setBulkAuditData(null);
        setInputValue("");
        setError(null);
    };



    const handleViewReport = (page) => {
        if (page.status !== "completed") return;

        const reportData = {
            url: page.url,
            device: bulkAuditData?.device || device,
            // Logic: If backend has specific report (e.g. SEO), use it. 
            // If backend has "All" (e.g. reused), but user selected "SEO", use user selection.
            report: (bulkAuditData?.report && bulkAuditData.report !== "All") ? bulkAuditData.report : report,
            status: "completed",

            score: page.score,
            grade: page.grade,
            timeTaken: page.timeTaken,
            siteSchema: page.siteSchema,
            aioCompatibilityBadge: page.aioCompatibilityBadge,
            sectionScore: page.sectionScore,

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

                            {/* Main Input */}
                            <div className="flex-1 w-full relative flex items-center px-4 h-14">
                                <Globe className={`w-5 h-5 flex-shrink-0 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    disabled={discovering}
                                    placeholder="Enter website URL (e.g. example.com)"
                                    className={`w-full h-full bg-transparent border-none outline-none text-lg px-4 font-medium placeholder-slate-500 ${darkMode ? "text-white" : "text-slate-900"}`}
                                />
                            </div>

                            {/* Divider */}
                            <div className={`hidden lg:block w-px h-8 ${darkMode ? "bg-slate-700" : "bg-slate-200"} mx-2`}></div>
                            <div className={`lg:hidden w-full h-px ${darkMode ? "bg-slate-700" : "bg-slate-200"} my-2`}></div>

                            {/* Max Pages Input */}
                            <div className="flex items-center gap-2 px-2">
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

                {/* Step 2: URL Selection & Audit Configuration */}
                {discoveredUrls.length > 0 && !bulkAuditId && (
                    <div className="w-full max-w-6xl mx-auto mt-10 space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-700">

                        {/* Configuration Panel */}
                        <div className={`p-6 rounded-2xl border ${darkMode ? "bg-slate-900/90 border-slate-700" : "bg-white border-slate-200"}`}>
                            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Configure Audit</h2>
                                    <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                                        Found {discoveredUrls.length} pages • {selectedUrls.length} selected
                                    </p>
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Device Selector */}
                                    <CustomDropdown
                                        value={device}
                                        onChange={setDevice}
                                        options={[
                                            { value: "Desktop", label: "Desktop" },
                                            { value: "Mobile", label: "Mobile" },
                                        ]}
                                        icon={device === "Desktop" ? <Monitor className="w-4 h-4 text-blue-500" /> : <Smartphone className="w-4 h-4 text-purple-500" />}
                                        darkMode={darkMode}
                                        disabled={auditing}
                                    />

                                    {/* Report Selector */}
                                    <CustomDropdown
                                        value={report}
                                        onChange={setReport}
                                        options={[
                                            { value: "All", label: "Full Audit" },
                                            { value: "Technical Performance", label: "Technical Performance" },
                                            { value: "On Page SEO", label: "On Page SEO" },
                                            { value: "Accessibility", label: "Accessibility" },
                                            { value: "Security/Compliance", label: "Security & Compliance" },
                                            { value: "UX & Content Structure", label: "UX & Content" },
                                            { value: "Conversion & Lead Flow", label: "Conversion & Lead Flow" },
                                            { value: "AIO (AI-Optimization) Readiness", label: "AIO Readiness" },
                                        ]}
                                        icon={<Settings className="w-4 h-4 text-emerald-500" />}
                                        darkMode={darkMode}
                                        disabled={auditing}
                                    />

                                    <button
                                        onClick={handleStartAudit}
                                        disabled={auditing || selectedUrls.length === 0}
                                        className={`
                      flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all 
                      bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 hover:shadow-emerald-500/25 active:scale-95
                      disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]
                    `}
                                    >
                                        {auditing ? <Loader2 className="animate-spin w-5 h-5" /> : "Start Audit"}
                                    </button>
                                </div>
                            </div>

                            {/* Select All / Deselect All */}
                            <div className="flex items-center justify-between mb-4">
                                <button
                                    onClick={toggleSelectAll}
                                    className={`text-sm font-medium transition-colors ${darkMode ? "text-emerald-400 hover:text-emerald-300" : "text-emerald-600 hover:text-emerald-700"
                                        }`}
                                >
                                    {selectedUrls.length === discoveredUrls.length ? "Deselect All" : "Select All"}
                                </button>
                                <button
                                    onClick={handleReset}
                                    className={`flex items-center gap-2 text-sm font-medium transition-colors ${darkMode ? "text-slate-400 hover:text-slate-300" : "text-slate-600 hover:text-slate-700"
                                        }`}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Start Over
                                </button>
                            </div>

                            {/* Error Message (Step 2) */}
                            {error && (
                                <div className="mb-4 animate-in slide-in-from-top-2 fade-in">
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 backdrop-blur-sm">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                        <span className="text-sm font-medium">{error}</span>
                                    </div>
                                </div>
                            )}

                            {/* URL List with Checkboxes */}
                            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
                                {discoveredUrls.map((url, index) => (
                                    <label
                                        key={index}
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${selectedUrls.includes(url)
                                            ? darkMode
                                                ? "bg-emerald-500/10 border-emerald-500/30"
                                                : "bg-emerald-50 border-emerald-200"
                                            : darkMode
                                                ? "bg-slate-800 border-slate-700 hover:border-slate-600"
                                                : "bg-slate-50 border-slate-200 hover:border-slate-300"
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedUrls.includes(url)}
                                            onChange={() => toggleUrlSelection(url)}
                                            className="w-5 h-5 rounded border-2 border-slate-400 text-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-offset-0"
                                        />
                                        <span className={`text-sm font-medium flex-1 truncate ${selectedUrls.includes(url)
                                            ? darkMode ? "text-emerald-300" : "text-emerald-700"
                                            : darkMode ? "text-slate-300" : "text-slate-700"
                                            }`}>
                                            {url}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 3: Audit Progress & Results */}
                {/* Restoration Loading State */}
                {/* Restoration / Loading Skeleton */}
                {(isRestoring || (bulkAuditId && !bulkAuditData)) && (
                    <div className="w-full max-w-6xl mx-auto mt-10 space-y-6 animate-in fade-in">
                        {/* Header Skeleton */}
                        <div className={`p-6 rounded-2xl border ${darkMode ? "bg-slate-900/90 border-slate-700" : "bg-white border-slate-200"}`}>
                            <div className="flex justify-between items-center mb-6">
                                <div className="space-y-2">
                                    <SkeletonLoader className="h-8 w-48" />
                                    <SkeletonLoader className="h-4 w-64" />
                                </div>
                                <SkeletonLoader className="h-10 w-24 rounded-lg" />
                            </div>

                            {/* Progress Bar Skeleton */}
                            <div className="mb-6 space-y-2">
                                <div className="flex justify-between">
                                    <SkeletonLoader className="h-4 w-20" />
                                    <SkeletonLoader className="h-4 w-12" />
                                </div>
                                <SkeletonLoader className="h-3 w-full rounded-full" />
                            </div>

                            {/* Stats Grid Skeleton */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <SkeletonLoader className="h-24 rounded-lg" />
                                <SkeletonLoader className="h-24 rounded-lg" />
                                <SkeletonLoader className="h-24 rounded-lg" />
                            </div>
                        </div>

                        {/* Pages List Skeleton */}
                        <div className={`p-6 rounded-2xl border ${darkMode ? "bg-slate-900/90 border-slate-700" : "bg-white border-slate-200"}`}>
                            <SkeletonLoader className="h-8 w-32 mb-6" />
                            <div className="space-y-3">
                                <SkeletonLoader className="h-20 w-full rounded-lg" count={5} />
                            </div>
                        </div>
                    </div>
                )}

                {bulkAuditData && (
                    <div className="w-full max-w-6xl mx-auto mt-10 animate-in fade-in slide-in-from-bottom-5 duration-700">

                        {/* Error Message (Polling) */}
                        {error && (
                            <div className="mb-6 animate-in slide-in-from-top-2 fade-in">
                                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 backdrop-blur-sm shadow-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                    <span className="font-medium">{error}</span>
                                </div>
                            </div>
                        )}

                        {/* Status Header */}
                        <div className={`p-6 rounded-2xl border mb-6 ${darkMode ? "bg-slate-900/90 border-slate-700" : "bg-white border-slate-200"}`}>
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-2xl font-bold mb-2">Audit Progress</h2>
                                    <p className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                                        {bulkAuditData.site} • <span className="font-semibold text-emerald-500">{bulkAuditData.report === "All" ? "Full Audit" : bulkAuditData.report}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className={`px-4 py-2 rounded-lg font-semibold ${bulkAuditData.status === "completed" ? "bg-green-500/20 text-green-500" :
                                        bulkAuditData.status === "failed" ? "bg-red-500/20 text-red-500" :
                                            "bg-blue-500/20 text-blue-500"
                                        }`}>
                                        {bulkAuditData.status.toUpperCase()}
                                    </div>
                                    {bulkAuditData.status === "completed" && (
                                        <button
                                            onClick={handleReset}
                                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                            New Audit
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Progress Bar */}
                            {bulkAuditData.totalPages > 0 && (
                                <div className="mb-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className={darkMode ? "text-slate-400" : "text-slate-600"}>
                                            Progress: {bulkAuditData.completedPages + bulkAuditData.failedPages} / {bulkAuditData.totalPages}
                                        </span>
                                        <span className={darkMode ? "text-slate-400" : "text-slate-600"}>
                                            {Math.round(((bulkAuditData.completedPages + bulkAuditData.failedPages) / bulkAuditData.totalPages) * 100)}%
                                        </span>
                                    </div>
                                    <div className={`w-full h-3 rounded-full overflow-hidden ${darkMode ? "bg-slate-800" : "bg-slate-200"}`}>
                                        <div
                                            className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-500"
                                            style={{ width: `${((bulkAuditData.completedPages + bulkAuditData.failedPages) / bulkAuditData.totalPages) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className={`p-4 rounded-lg ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                    <div className="text-2xl font-bold text-emerald-500">{bulkAuditData.completedPages}</div>
                                    <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Completed</div>
                                </div>
                                <div className={`p-4 rounded-lg ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                    <div className="text-2xl font-bold text-red-500">{bulkAuditData.failedPages}</div>
                                    <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Failed</div>
                                </div>
                                <div className={`p-4 rounded-lg ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                    <div className="text-2xl font-bold text-blue-500">{bulkAuditData.totalPages}</div>
                                    <div className={`text-sm ${darkMode ? "text-slate-400" : "text-slate-600"}`}>Total Pages</div>
                                </div>
                            </div>
                        </div>

                        {/* Pages List */}
                        {bulkAuditData.pages && bulkAuditData.pages.length > 0 && (
                            <div className={`p-6 rounded-2xl border ${darkMode ? "bg-slate-900/90 border-slate-700" : "bg-white border-slate-200"}`}>
                                <h3 className="text-xl font-bold mb-4">Pages</h3>
                                <div className="space-y-3 max-h-[600px] overflow-y-auto custom-scrollbar">
                                    {bulkAuditData.pages.map((page, index) => (
                                        <div
                                            key={index}
                                            onClick={() => handleViewReport(page)}
                                            className={`p-4 rounded-lg border transition-all ${darkMode ? "bg-slate-800 border-slate-700 hover:border-slate-600" : "bg-slate-50 border-slate-200 hover:border-slate-300"
                                                } ${page.status === "completed" ? "cursor-pointer hover:shadow-md active:scale-[0.99] hover:bg-emerald-500/5" : ""}`}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    {getStatusIcon(page.status)}
                                                    <div className="flex-1 min-w-0">
                                                        <div className={`text-sm font-medium truncate ${darkMode ? "text-slate-300" : "text-slate-700"}`}>
                                                            {page.url}
                                                        </div>
                                                        {page.error && (
                                                            <div className="text-xs text-red-500 mt-1">{page.error}</div>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Show Score and Grade for completed audits */}
                                                {page.status === "completed" && page.score !== null && (
                                                    <div className="flex items-center gap-3 ml-4">
                                                        <div className={`px-3 py-1 rounded-lg font-bold ${page.grade === "A" ? "bg-green-500/20 text-green-500" :
                                                            page.grade === "B" ? "bg-blue-500/20 text-blue-500" :
                                                                page.grade === "C" ? "bg-yellow-500/20 text-yellow-500" :
                                                                    page.grade === "D" ? "bg-orange-500/20 text-orange-500" :
                                                                        "bg-red-500/20 text-red-500"
                                                            }`}>
                                                            Grade {page.grade}
                                                        </div>
                                                        <div className={`text-lg font-bold ${darkMode ? "text-emerald-400" : "text-emerald-600"}`}>
                                                            {page.score}/100
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Show Time Taken if available */}
                                            {page.timeTaken && (
                                                <div className="flex items-center justify-between mt-2">
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
        </div>
    );
}
