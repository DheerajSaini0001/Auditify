import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { useData } from '../context/DataContext.jsx';
import {
  Plus,
  Globe,
  CheckCircle,
  AlertCircle,
  Trash2,
  ExternalLink,
  LayoutDashboard,
  FileText,
  Download,
  ShieldCheck,
  LogOut,
  RefreshCw,
  Zap,
  Activity,
  Search,
  X,
  History,
  Star,
  MoreVertical,
  Lock,
  ChevronDown,
  Languages,
  HelpCircle,
  Menu,
  ChevronRight,
  Sparkles,
  Users,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import toast from 'react-hot-toast';

// Custom absolute-centered Circular Progress
const CircularProgress = ({ score, size = 66, strokeWidth = 4, color = "#3b82f6", darkMode = false }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center font-sans" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={darkMode ? "#1e293b" : "#f1f5f9"}
          strokeWidth={strokeWidth}
          className="transition-colors duration-300"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className={`absolute font-extrabold text-[15px] leading-none tracking-tight transition-colors duration-300 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
        {score}
      </div>
    </div>
  );
};

const DashboardPage = () => {
  const { user, apiFetch, logout } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const navigate = useNavigate();
  const { fetchData: runAudit } = useData();

  const [websites, setWebsites] = useState([]);
  const [history, setHistory] = useState([]);
  const [detailedScores, setDetailedScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("Overview");

  // Backend search with debouncing states
  const [apiSearchInput, setApiSearchInput] = useState("");
  const [apiSearchResults, setApiSearchResults] = useState([]);
  const [apiSearchLoading, setApiSearchLoading] = useState(false);
  const [isApiSearching, setIsApiSearching] = useState(false);

  // Dropdown States
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [timeDropdownOpen, setTimeDropdownOpen] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);

  // Card action menu state
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Single audit: track which project is currently being audited
  const [auditingProjectId, setAuditingProjectId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user verified websites
      const sitesRes = await apiFetch('/api/websites');
      const websitesList = sitesRes.ok ? (sitesRes.data.websites || []) : [];
      setWebsites(websitesList);

      // 2. Fetch user audit history — fetch up to 100 to avoid missing recent audits
      const historyRes = await apiFetch('/api/user/history?limit=100');
      const historyList = historyRes.ok ? (historyRes.data.audits || []) : [];
      setHistory(historyList);

      // 3. For each website, find the most recent successful audit in history
      // Normalize helper: strip protocol, www, trailing slash, and lowercase
      const normalizeUrl = (u) =>
        u.toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .replace(/\/$/, '');

      // Build a map: normalizedUrl → reportId (most recent successful audit)
      const uniqueUrlAudits = {};
      historyList.forEach(audit => {
        const hasReport = audit.reportId || audit._id;
        if (audit.status === 'success' && hasReport) {
          const normUrl = normalizeUrl(audit.url);
          // Keep only the first (most recent, since sorted desc by createdAt)
          if (!uniqueUrlAudits[normUrl]) {
            uniqueUrlAudits[normUrl] = audit.reportId || audit._id;
          }
        }
      });

      // 4. Fetch detailed scores for each matched URL
      const scoresMap = {};
      await Promise.all(
        Object.keys(uniqueUrlAudits).map(async (normUrl) => {
          const reportId = uniqueUrlAudits[normUrl];
          try {
            const reportRes = await apiFetch(`/api/user/report/${reportId}`);
            if (reportRes.ok && reportRes.data) {
              const r = reportRes.data;
              scoresMap[normUrl] = {
                performance: r.technicalPerformance?.Percentage ?? Math.round(r.score) ?? 0,
                seo: r.onPageSEO?.Percentage ?? Math.round(r.score) ?? 0,
                accessibility: r.accessibility?.Percentage ?? Math.round(r.score) ?? 0,
                security: r.securityOrCompliance?.Percentage ?? Math.round(r.score) ?? 0,
                onPage: r.UXOrContentStructure?.Percentage ?? Math.round(r.score) ?? 0,
                conversion: r.conversionAndLeadFlow?.Percentage ?? Math.round(r.score) ?? 0,
                aiReadiness: r.aioReadiness?.Percentage ?? Math.round(r.score) ?? 0,
                rating: r.grade || (r.score >= 90 ? "Excellent" : r.score >= 80 ? "Very Good" : r.score >= 70 ? "Good" : "Needs Improvement"),
                auditId: r._id
              };
            }
          } catch (e) {
            console.error(`Failed to fetch report for ${normUrl}:`, e);
          }
        })
      );
      setDetailedScores(scoresMap);
    } catch (err) {
      console.error('Data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto GSC Sync on mount for Google Account users
    if (user?.authProvider === 'google' && user?.googleAccessToken) {
      handleSync();
    }
  }, [apiFetch]);

  // Handle Search Hotkey (CMD+K or CTRL+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInputEl = document.getElementById('project-search-input');
        if (searchInputEl) {
          searchInputEl.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cache ref to prevent duplicate server queries
  const searchCache = useRef({});

  // Debounced API search effect
  useEffect(() => {
    if (apiSearchInput.trim() === "") {
      setApiSearchResults([]);
      setIsApiSearching(false);
      setApiSearchLoading(false);
      return;
    }

    setIsApiSearching(true);

    const query = apiSearchInput.trim().toLowerCase();

    // If query matches cache, return immediately to eliminate latency and server fetches
    if (searchCache.current[query]) {
      setApiSearchResults(searchCache.current[query]);
      setApiSearchLoading(false);
      return;
    }

    setApiSearchLoading(true);

    const handler = setTimeout(async () => {
      try {
        const res = await apiFetch(`/api/websites?q=${encodeURIComponent(query)}`);
        if (res.ok && res.data) {
          const results = res.data.websites || [];
          searchCache.current[query] = results;
          setApiSearchResults(results);
        } else {
          setApiSearchResults([]);
        }
      } catch (err) {
        console.error("API search failed:", err);
        setApiSearchResults([]);
      } finally {
        setApiSearchLoading(false);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [apiSearchInput, apiFetch]);

  const handleSync = async () => {
    setSyncing(true);
    const { ok, data } = await apiFetch('/api/websites/sync', { method: 'POST' });
    if (ok) {
      toast.success(data.message || 'Properties synchronized successfully');
      setWebsites(data.websites || []);
    } else {
      toast.error(data.message || 'Synchronization failed');
    }
    setSyncing(false);
  };

  const handleDelete = async (id, url) => {
    if (!window.confirm(`Are you sure you want to remove ${url}?`)) return;

    const { ok } = await apiFetch(`/api/websites/${id}`, { method: 'DELETE' });
    if (ok) {
      toast.success('Website removed');
      fetchData();
    } else {
      toast.error('Failed to remove website');
    }
  };

  // Run a single-page audit directly from the dashboard card
  const handleSingleAudit = async (projId, url) => {
    if (auditingProjectId) {
      toast('An audit is already running. Please wait.', { icon: '⏳' });
      return;
    }
    setAuditingProjectId(projId);
    toast.loading('Starting audit...', { id: 'single-audit-toast' });

    let urlToAudit = url.trim();
    if (!/^https?:\/\//i.test(urlToAudit)) urlToAudit = `https://${urlToAudit}`;

    const result = await runAudit(urlToAudit, 'Desktop', 'All', null);

    toast.dismiss('single-audit-toast');
    setAuditingProjectId(null);

    if (result?.success === false) {
      toast.error(result.error || 'Audit failed. Please try again.');
      return;
    }

    // Navigate directly using the audit ID returned by runAudit
    // No useEffect needed — avoids triggering on stale DataContext data
    if (result?.id) {
      navigate(`/report/${result.id}`);
    }
  };

  // Helper: map user added properties to fetched score details
  const getProjectScores = (url) => {
    // Normalize: strip protocol, www, trailing slash — same as fetchData normalizeUrl
    const normUrl = url.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

    // Return exact scores synchronized from database audit logs if present
    if (detailedScores[normUrl]) {
      return { ...detailedScores[normUrl], isAudited: true };
    }

    return { isAudited: false };
  };

  // Helper for metric dot rating
  const getRatingInfo = (score, type) => {
    if (score >= 90) return { label: "Excellent", dotColor: "bg-emerald-500" };
    if (score >= 80) {
      if (type === 'aiReadiness') return { label: "Very Good", dotColor: "bg-teal-500" };
      return { label: "Very Good", dotColor: "bg-blue-500" };
    }
    if (score >= 70) {
      if (type === 'aiReadiness') return { label: "Good", dotColor: "bg-teal-500" };
      return { label: "Good", dotColor: "bg-purple-500" };
    }
    return { label: "Needs Improvement", dotColor: "bg-orange-500" };
  };

  // Filter GSC + local properties
  const filteredWebsites = websites.filter(site =>
    site.url.toLowerCase().includes(searchInput.toLowerCase())
  );

  const allProjects = filteredWebsites.map((w) => ({
    _id: w._id,
    url: w.url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''),
    subtext: `${w.url}/*`,
    verified: w.verified,
    permissionLevel: w.permissionLevel || "owner",
    isDemo: false
  }));

  const displayProjects = isApiSearching ? apiSearchResults.map((w) => ({
    _id: w._id,
    url: w.url.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, ''),
    subtext: `${w.url}/*`,
    verified: w.verified,
    permissionLevel: w.permissionLevel || "owner",
    isDemo: false
  })) : allProjects;

  // Sidebar content
  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between select-none">
      <div className="flex flex-col p-4 gap-4 overflow-y-auto">
        {/* Create Project Button */}
        <div className="relative">
          <button
            onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
            className="w-full flex items-center justify-between px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-md shadow-emerald-600/10 active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Plus size={16} />
              <span>Create Project</span>
            </div>
            <ChevronDown size={14} className="opacity-80" />
          </button>

          {createDropdownOpen && (
            <div className={`absolute top-full left-0 right-0 mt-1.5 rounded-xl shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150 border transition-all duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
              <button
                onClick={() => { setCreateDropdownOpen(false); navigate("/dashboard/add-website"); }}
                className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                Add Google Search Console Site
              </button>
              <button
                onClick={() => { setCreateDropdownOpen(false); navigate("/bulk-audit"); }}
                className={`w-full text-left px-4 py-2 text-xs font-bold transition-colors ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                Quick Manual Audit Page
              </button>
            </div>
          )}
        </div>

        {/* Search project box */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${darkMode ? 'text-slate-400' : 'text-slate-455'}`} size={14} />
          <input
            id="project-search-input"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search projects..."
            className={`w-full pl-9 pr-8 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500/50 transition-colors duration-300 ${darkMode ? 'bg-slate-850 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'}`}
          />
          <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black border px-1 py-0.5 rounded leading-none transition-colors duration-300 ${darkMode ? 'text-slate-400 bg-slate-800/80 border-slate-700/50' : 'text-slate-500 bg-slate-200/50 border-slate-300/30'}`}>
            ⌘K
          </span>
        </div>

        {/* Menu Links */}
        <nav className="flex flex-col gap-1 mt-2">
          <button
            onClick={() => navigate("/dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-extrabold transition-all duration-300 border-none ${darkMode ? 'bg-emerald-950/40 text-emerald-400' : 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shadow-sm'}`}
          >
            <LayoutDashboard size={16} />
            <span>Projects</span>
          </button>

          <button
            onClick={() => toast('Portfolios are unlocked in Advanced premium tier!')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <div className="flex items-center gap-3">
              <Activity size={16} />
              <span>Portfolios</span>
            </div>
            <Lock size={12} className="opacity-40" />
          </button>

          <button
            onClick={() => navigate("/audit-history")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <FileText size={16} />
            <span>Reports</span>
          </button>

          <button
            onClick={() => toast('Keyword Rank Tracker is unlocking soon!')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <div className="flex items-center gap-3">
              <History size={16} />
              <span>Keyword Lists</span>
            </div>
            <Lock size={12} className="opacity-40" />
          </button>

          <button
            onClick={() => toast('Feature Starred Projects coming soon!')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
          >
            <Star size={16} />
            <span>Starred</span>
          </button>
        </nav>

        {/* Folders list */}
        <div className={`mt-4 border-t pt-4 transition-colors duration-300 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <div className={`flex items-center justify-between px-2 mb-2 text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            <span>Folders</span>
            <button
              onClick={() => toast('Add custom project folder is a Premium feature')}
              className={`p-0.5 rounded transition-all duration-300 ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-300' : 'hover:bg-slate-100 text-slate-450 hover:text-slate-600'}`}
            >
              <Plus size={12} />
            </button>
          </div>
          <p className={`px-2 text-xs font-medium italic transition-colors duration-300 ${darkMode ? 'text-slate-500' : 'text-slate-450'}`}>No folders</p>
        </div>
      </div>

      {/* Premium promotional block */}
      <div className={`p-4 border-t transition-colors duration-300 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className={`p-4 rounded-2xl border flex flex-col gap-3 transition-colors duration-300 ${darkMode ? 'bg-emerald-950/20 border-emerald-900/30' : 'bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/5'}`}>
          <div className={`flex items-center gap-2 transition-colors duration-300 ${darkMode ? 'text-emerald-400' : 'text-emerald-800'}`}>
            <Lock size={14} className={`transition-colors duration-300 ${darkMode ? 'fill-emerald-400/20 text-emerald-400' : 'fill-emerald-600/20 text-emerald-700'}`} />
            <span className="text-[11px] font-black uppercase tracking-wider">Unlock Advanced</span>
          </div>
          <p className={`text-[10px] font-semibold leading-relaxed transition-colors duration-300 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Get deeper insights, historical data, and AI-powered recommendations.
          </p>
          <button
            onClick={() => toast.success('Premium checkout is launching soon!')}
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/10 transition-all active:scale-[0.98]"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`w-full min-h-[calc(100vh-4rem)] flex flex-col md:flex-row font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-50 dark' : 'bg-slate-50 text-slate-900'}`}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={`hidden md:flex flex-col w-60 shrink-0 border-r justify-between transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
        <SidebarContent />
      </aside>

      {/* ── MOBILE SIDEBAR DRAWER ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r flex flex-col justify-between pt-1 transform transition-transform duration-300 ease-in-out md:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}
      `}>
        <div className={`flex justify-between items-center p-4 border-b transition-colors duration-300 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          <span className="text-xs font-black uppercase tracking-widest text-slate-500">Menu Options</span>
          <button onClick={() => setSidebarOpen(false)} className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-slate-50 text-slate-600'}`}>
            <X size={16} />
          </button>
        </div>
        <div className="flex-grow overflow-y-auto">
          <SidebarContent />
        </div>
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <main className="flex-grow flex flex-col min-w-0 p-6 md:p-8 space-y-6 overflow-y-auto">

        {/* Section title & Tools bar */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between gap-3">
            <h1 className={`text-2xl font-black tracking-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-slate-800'}`}>Projects</h1>
            {/* Mobile Sidebar Toggle Button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className={`md:hidden flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-bold transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Menu size={14} />
              <span>Menu</span>
            </button>
          </div>

          {/* Right dropdown filters */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={`text-xs font-bold flex items-center gap-1 transition-colors duration-300 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
              Metrics based on monthly volume <HelpCircle size={12} className="cursor-help" title="Based on average GSC and audit impressions" />
            </span>

            {/* Date drop */}
            <div className="relative">
              <button
                onClick={() => setTimeDropdownOpen(!timeDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <History size={14} />
                <span>Last 30 days</span>
                <ChevronDown size={12} />
              </button>
              {timeDropdownOpen && (
                <div className={`absolute right-0 mt-1 border rounded-lg shadow-xl z-50 py-1 w-40 animate-in fade-in slide-in-from-top-1 duration-150 transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <button onClick={() => setTimeDropdownOpen(false)} className={`w-full text-left px-4 py-1.5 text-xs font-bold transition-colors duration-250 ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>Last 7 days</button>
                  <button onClick={() => setTimeDropdownOpen(false)} className={`w-full text-left px-4 py-1.5 text-xs font-bold transition-colors duration-250 ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>Last 30 days</button>
                  <button onClick={() => setTimeDropdownOpen(false)} className={`w-full text-left px-4 py-1.5 text-xs font-bold transition-colors duration-250 ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>Last 90 days</button>
                </div>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <button
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-bold transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900'}`}
              >
                <Settings size={14} />
                <span>Newest first</span>
                <ChevronDown size={12} />
              </button>
              {sortDropdownOpen && (
                <div className={`absolute right-0 mt-1 border rounded-lg shadow-xl z-50 py-1 w-40 animate-in fade-in slide-in-from-top-1 duration-150 transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <button onClick={() => setSortDropdownOpen(false)} className={`w-full text-left px-4 py-1.5 text-xs font-bold transition-colors duration-250 ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>Newest first</button>
                  <button onClick={() => setSortDropdownOpen(false)} className={`w-full text-left px-4 py-1.5 text-xs font-bold transition-colors duration-250 ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>Alphabetical</button>
                  <button onClick={() => setSortDropdownOpen(false)} className={`w-full text-left px-4 py-1.5 text-xs font-bold transition-colors duration-250 ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}>By health score</button>
                </div>
              )}
            </div>

            {/* Manual Sync Button */}
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all duration-300 active:scale-[0.98] disabled:opacity-50"
              title="Force Sync with Backend"
            >
              <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
              <span>Sync Data</span>
            </button>
          </div>
        </div>

        {/* Tab selector Pills */}
        <div className={`flex border-b gap-1 pb-px transition-colors duration-300 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
          {["Overview"].map(tab => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                if (tab !== "Overview") {
                  toast(`${tab} views are loading custom Search Console metrics!`);
                }
              }}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all border-none ${activeTab === tab
                  ? (darkMode ? 'bg-emerald-950/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600')
                  : (darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50')
                }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Sync status & loader if GSC syncing */}
        {syncing && (
          <div className={`p-3 border rounded-xl flex items-center justify-center gap-2 text-xs font-bold animate-pulse animate-in fade-in duration-300 transition-colors duration-300 ${darkMode ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
            <RefreshCw size={14} className="animate-spin" />
            <span>Synchronizing GSC properties with Google Search Console API...</span>
          </div>
        )}

        {/* ── DEBOUNCED API SEARCH BAR ── */}
        <div className={`p-4 border rounded-2xl flex flex-col md:flex-row items-center gap-4 transition-all duration-300 shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800/80' : 'bg-white border-slate-200'}`}>
          <div className="relative flex-grow w-full">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`} size={16} />
            <input
              type="text"
              value={apiSearchInput}
              onChange={(e) => setApiSearchInput(e.target.value)}
              placeholder="Search website projects..."
              className={`w-full pl-11 pr-12 py-2.5 border rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500/50 transition-all duration-300 shadow-sm ${
                darkMode 
                  ? 'bg-slate-850 border-slate-700 text-slate-100 placeholder-slate-500 focus:shadow-emerald-950/20' 
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:shadow-emerald-500/5'
              }`}
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {apiSearchLoading ? (
                <RefreshCw size={14} className="animate-spin text-emerald-500" />
              ) : isApiSearching ? (
                <button 
                  onClick={() => {
                    setApiSearchInput("");
                    setApiSearchResults([]);
                    setIsApiSearching(false);
                  }}
                  className={`p-0.5 rounded hover:bg-slate-200 transition-colors ${darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-800'}`}
                >
                  <X size={14} />
                </button>
              ) : (
                <span className={`text-[10px] font-black border px-1.5 py-0.5 rounded leading-none transition-colors duration-300 ${darkMode ? 'text-slate-500 bg-slate-800/80 border-slate-700/50' : 'text-slate-450 bg-slate-200/50 border-slate-350/30'}`}>
                  Debounced
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── PROJECTS LIST ── */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw size={32} className="animate-spin text-emerald-500" />
              <p className={`text-xs font-bold uppercase tracking-wider animate-pulse transition-colors duration-300 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Syncing latest database records...</p>
            </div>
          ) : (isApiSearching && apiSearchLoading) ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw size={32} className="animate-spin text-emerald-500" />
              <p className={`text-xs font-bold uppercase tracking-wider animate-pulse transition-colors duration-300 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Searching projects on server...</p>
            </div>
          ) : displayProjects.length === 0 ? (
            <div className={`rounded-2xl p-12 text-center flex flex-col items-center justify-center gap-4 animate-in fade-in duration-300 transition-all duration-300 border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
              <Globe size={40} className={`transition-colors duration-300 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} />
              <div>
                <h3 className={`font-bold text-sm transition-colors duration-300 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                  {isApiSearching ? 'No matching projects found' : 'No properties added yet'}
                </h3>
                <p className={`text-xs mt-1 transition-colors duration-300 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                  {isApiSearching ? `No added properties match your search for "${apiSearchInput}".` : 'Connect your websites with Google Search Console or start a manual audit.'}
                </p>
              </div>
              {!isApiSearching && (
                <button
                  onClick={() => navigate("/dashboard/add-website")}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all duration-300 active:scale-[0.98]"
                >
                  Add Website
                </button>
              )}
            </div>
          ) : (
            displayProjects.map((proj, idx) => {
              const scores = getProjectScores(proj.url, idx);

              return (
                <div
                  key={proj._id}
                  className={`rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative animate-in fade-in duration-300 border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}
                >
                  {/* Top Row: Info & Actions */}
                  <div className={`flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-4 transition-colors duration-300 ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>

                    {/* Left Block: Domain Brand & Badges */}
                    <div className="flex items-center gap-3">
                      {proj.hasBlackIcon ? (
                        <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white shrink-0 font-bold text-sm">
                          {/* Waveform graphic */}
                          <svg viewBox="0 0 100 100" className="w-5 h-5 fill-none stroke-emerald-400" strokeWidth="8" strokeLinecap="round">
                            <line x1="20" y1="50" x2="20" y2="80" />
                            <line x1="40" y1="30" x2="40" y2="80" />
                            <line x1="60" y1="15" x2="60" y2="80" />
                            <line x1="80" y1="40" x2="80" y2="80" />
                          </svg>
                        </div>
                      ) : (
                        <div className={`w-10 h-10 rounded-xl border overflow-hidden flex items-center justify-center font-bold shrink-0 text-sm transition-all duration-300 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
                          <img 
                            src={`https://www.google.com/s2/favicons?sz=128&domain=${proj.url}`} 
                            alt={proj.url} 
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallbackEl = e.currentTarget.parentElement?.querySelector('.fallback-letter');
                              if (fallbackEl) {
                                fallbackEl.classList.remove('hidden');
                              }
                            }}
                          />
                          <span className="fallback-letter hidden">
                            {proj.url.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-extrabold text-[15px] truncate max-w-xs leading-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
                            {proj.url}
                          </span>
                          {proj.verified && (
                            <CheckCircle size={14} className="text-emerald-500 fill-emerald-100/50 shrink-0" />
                          )}
                        </div>
                        <div className={`flex items-center gap-1 mt-0.5 text-[11px] font-bold truncate cursor-pointer transition-colors duration-300 ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-450 hover:text-slate-700'}`}>
                          <span>{proj.subtext}</span>
                          <ChevronDown size={10} />
                        </div>
                      </div>
                    </div>

                    {/* Right Block: Badge tags & dropdowns */}
                    <div className={`flex items-center gap-2 self-end sm:self-auto relative transition-colors duration-300`}>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border transition-colors duration-300 ${darkMode ? 'bg-emerald-950/30 text-emerald-400 border-emerald-900/30' : 'bg-emerald-50 text-emerald-600 border-emerald-100/50'}`}>
                        Basic
                      </span>

                      <button
                        onClick={() => toast('Configure project sharing settings')}
                        className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-lg text-[10px] font-black transition-all duration-300 ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white' : 'bg-slate-50 border-slate-200/50 text-slate-500 hover:text-slate-700 hover:bg-slate-100'}`}
                      >
                        <Users size={12} />
                        <span>Shared</span>
                      </button>

                      <button
                        onClick={() => toast.success('Added to Starred list')}
                        className={`p-1.5 border rounded-lg text-slate-400 hover:text-amber-500 transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                      >
                        <Star size={14} />
                      </button>

                      {/* Triple Dot Action Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === proj._id ? null : proj._id)}
                          className={`p-1.5 border rounded-lg text-slate-400 hover:text-slate-750 transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:text-white' : 'bg-white border-slate-200 hover:bg-slate-50 hover:text-slate-700'}`}
                        >
                          <MoreVertical size={14} />
                        </button>

                        {activeMenuId === proj._id && (
                          <div className={`absolute right-0 mt-1 border rounded-xl shadow-xl z-50 py-1 w-44 animate-in fade-in slide-in-from-top-1 duration-150 transition-colors duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                navigate(`/bulk-audit?url=https://${proj.url}&auto=true`);
                              }}
                              className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors duration-200 ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                            >
                              <Zap size={12} className="text-emerald-500" />
                              <span>Re-Audit Website</span>
                            </button>
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                navigate(`/bulk-audit?url=https://${proj.url}&auto=true`);
                              }}
                              className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors duration-200 ${darkMode ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-50 text-slate-700'}`}
                            >
                              <History size={12} className="text-indigo-500" />
                              <span>Run Bulk Audit</span>
                            </button>

                            <div className={`border-t my-1 transition-colors duration-300 ${darkMode ? 'border-slate-700' : 'border-slate-100'}`} />
                            <button
                              onClick={() => {
                                setActiveMenuId(null);
                                handleDelete(proj._id, proj.url);
                              }}
                              className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors duration-200 ${darkMode ? 'hover:bg-rose-950/20 text-rose-500' : 'hover:bg-rose-50 text-rose-600'}`}
                            >
                              <Trash2 size={12} />
                              <span>Delete Property</span>
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {scores.isAudited ? (
                    <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-4 pt-5 animate-in fade-in duration-300">

                      {/* Metric 1: Performance */}
                      <button
                        onClick={() => navigate(scores.auditId ? `/technical-performance/${scores.auditId}` : `/technical-performance`)}
                        className={`flex flex-col items-center text-center p-2 rounded-xl transition-all duration-300 border-none bg-transparent group ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                      >
                        <CircularProgress score={scores.performance} color="#0070f3" darkMode={darkMode} />
                        <span className={`text-[11px] font-black uppercase tracking-wide mt-3 transition-colors duration-300 ${darkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-800'}`}>
                          Performance
                        </span>
                        <div className={`flex items-center gap-1 mt-1 text-[10px] font-extrabold transition-colors duration-300 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getRatingInfo(scores.performance, 'performance').dotColor}`} />
                          <span>{getRatingInfo(scores.performance, 'performance').label}</span>
                        </div>
                      </button>

                      {/* Metric 2: SEO Score */}
                      <button
                        onClick={() => navigate(scores.auditId ? `/on-page-seo/${scores.auditId}` : `/on-page-seo`)}
                        className={`flex flex-col items-center text-center p-2 rounded-xl transition-all duration-300 border-none bg-transparent group ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                      >
                        <CircularProgress score={scores.seo} color="#10b981" darkMode={darkMode} />
                        <span className={`text-[11px] font-black uppercase tracking-wide mt-3 transition-colors duration-300 ${darkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-800'}`}>
                          SEO Score
                        </span>
                        <div className={`flex items-center gap-1 mt-1 text-[10px] font-extrabold transition-colors duration-300 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getRatingInfo(scores.seo, 'seo').dotColor}`} />
                          <span>{getRatingInfo(scores.seo, 'seo').label}</span>
                        </div>
                      </button>

                      {/* Metric 3: Accessibility */}
                      <button
                        onClick={() => navigate(scores.auditId ? `/accessibility/${scores.auditId}` : `/accessibility`)}
                        className={`flex flex-col items-center text-center p-2 rounded-xl transition-all duration-300 border-none bg-transparent group ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                      >
                        <CircularProgress score={scores.accessibility} color="#7c3aed" darkMode={darkMode} />
                        <span className={`text-[11px] font-black uppercase tracking-wide mt-3 transition-colors duration-300 ${darkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-800'}`}>
                          Accessibility
                        </span>
                        <div className={`flex items-center gap-1 mt-1 text-[10px] font-extrabold transition-colors duration-300 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getRatingInfo(scores.accessibility, 'accessibility').dotColor}`} />
                          <span>{getRatingInfo(scores.accessibility, 'accessibility').label}</span>
                        </div>
                      </button>

                      {/* Metric 4: Security */}
                      <button
                        onClick={() => navigate(scores.auditId ? `/security-compliance/${scores.auditId}` : `/security-compliance`)}
                        className={`flex flex-col items-center text-center p-2 rounded-xl transition-all duration-300 border-none bg-transparent group ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                      >
                        <CircularProgress score={scores.security} color="#10b981" darkMode={darkMode} />
                        <span className={`text-[11px] font-black uppercase tracking-wide mt-3 transition-colors duration-300 ${darkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-800'}`}>
                          Security
                        </span>
                        <div className={`flex items-center gap-1 mt-1 text-[10px] font-extrabold transition-colors duration-300 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getRatingInfo(scores.security, 'security').dotColor}`} />
                          <span>{getRatingInfo(scores.security, 'security').label}</span>
                        </div>
                      </button>

                      {/* Metric 5: On-Page SEO */}
                      <button
                        onClick={() => navigate(scores.auditId ? `/ux-content-structure/${scores.auditId}` : `/ux-content-structure`)}
                        className={`flex flex-col items-center text-center p-2 rounded-xl transition-all duration-300 border-none bg-transparent group ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                      >
                        <CircularProgress score={scores.onPage} color="#f97316" darkMode={darkMode} />
                        <span className={`text-[11px] font-black uppercase tracking-wide mt-3 transition-colors duration-300 ${darkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-800'}`}>
                          On-Page SEO
                        </span>
                        <div className={`flex items-center gap-1 mt-1 text-[10px] font-extrabold transition-colors duration-300 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getRatingInfo(scores.onPage, 'onPage').dotColor}`} />
                          <span>{getRatingInfo(scores.onPage, 'onPage').label}</span>
                        </div>
                      </button>

                      {/* Metric 6: Conversion */}
                      <button
                        onClick={() => navigate(scores.auditId ? `/conversion-lead-flow/${scores.auditId}` : `/conversion-lead-flow`)}
                        className={`flex flex-col items-center text-center p-2 rounded-xl transition-all duration-300 border-none bg-transparent group ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                      >
                        <CircularProgress score={scores.conversion} color="#eab308" darkMode={darkMode} />
                        <span className={`text-[11px] font-black uppercase tracking-wide mt-3 transition-colors duration-300 ${darkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-800'}`}>
                          Conversion
                        </span>
                        <div className={`flex items-center gap-1 mt-1 text-[10px] font-extrabold transition-colors duration-300 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getRatingInfo(scores.conversion, 'conversion').dotColor}`} />
                          <span>{getRatingInfo(scores.conversion, 'conversion').label}</span>
                        </div>
                      </button>

                      {/* Metric 7: AI Readiness */}
                      <button
                        onClick={() => navigate(scores.auditId ? `/aio/${scores.auditId}` : `/aio`)}
                        className={`flex flex-col items-center text-center p-2 rounded-xl transition-all duration-300 border-none bg-transparent group ${darkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
                      >
                        <CircularProgress score={scores.aiReadiness} color="#0d9488" darkMode={darkMode} />
                        <span className={`text-[11px] font-black uppercase tracking-wide mt-3 transition-colors duration-300 ${darkMode ? 'text-slate-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-800'}`}>
                          AI Readiness
                        </span>
                        <div className={`flex items-center gap-1 mt-1 text-[10px] font-extrabold transition-colors duration-300 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getRatingInfo(scores.aiReadiness, 'aiReadiness').dotColor}`} />
                          <span>{getRatingInfo(scores.aiReadiness, 'aiReadiness').label}</span>
                        </div>
                      </button>

                    </div>
                  ) : (
                    <div className={`mt-5 p-5 rounded-2xl border flex flex-col gap-4 transition-all duration-300 ${darkMode ? 'bg-slate-800/20 border-slate-800/40' : 'bg-slate-50 border-slate-200/60'}`}>
                      {/* Info Row */}
                      <div className="flex items-center gap-3.5">
                        <div className={`p-3 rounded-xl flex items-center justify-center shrink-0 ${darkMode ? 'bg-emerald-950/30' : 'bg-emerald-500/10'}`}>
                          <Sparkles size={20} className={darkMode ? 'text-emerald-400' : 'text-emerald-600'} />
                        </div>
                        <div className="text-left">
                          <h4 className={`text-[13px] font-extrabold transition-colors duration-300 ${darkMode ? 'text-white' : 'text-slate-800'}`}>No Audit Data Available</h4>
                          <p className={`text-[11px] font-semibold mt-0.5 leading-relaxed transition-colors duration-300 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Choose how you want to audit this property — run a quick single-page audit or a full site bulk audit.</p>
                        </div>
                      </div>

                      {/* Action Buttons Row */}
                      <div className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1 border-t transition-colors duration-300 ${darkMode ? 'border-slate-700/50' : 'border-slate-200/70'}`}>
                        {/* Single Audit */}
                        <button
                          onClick={() => handleSingleAudit(proj._id, proj.url)}
                          disabled={!!auditingProjectId}
                          className={`flex items-center justify-center gap-2 flex-1 px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 active:scale-[0.98] border disabled:opacity-60 disabled:cursor-wait ${darkMode ? 'bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700 hover:border-emerald-700/50' : 'bg-white border-slate-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-200'}`}
                        >
                          {auditingProjectId === proj._id ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <Zap size={13} className={darkMode ? 'text-emerald-400' : 'text-emerald-600'} />
                          )}
                          <div className="text-left">
                            <div className="font-extrabold">
                              {auditingProjectId === proj._id ? 'Auditing...' : 'Run Single Audit'}
                            </div>
                            <div className={`text-[9px] font-semibold uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                              {auditingProjectId === proj._id ? 'Please wait' : 'Homepage only · Fast'}
                            </div>
                          </div>
                        </button>

                        {/* Bulk Audit */}
                        <button
                          onClick={() => navigate(`/bulk-audit?url=https://${proj.url}&auto=true`)}
                          className="flex items-center justify-center gap-2 flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all duration-300 active:scale-[0.98] shadow-md shadow-emerald-600/10"
                        >
                          <History size={13} className="fill-emerald-100/20" />
                          <div className="text-left">
                            <div className="font-extrabold">Run Bulk Audit</div>
                            <div className="text-[9px] font-semibold uppercase tracking-wider text-emerald-200">All pages · Comprehensive</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Debounced search bar deleted from bottom to keep layout perfectly neat */}

      </main>

    </div>
  );
};

export default DashboardPage;
