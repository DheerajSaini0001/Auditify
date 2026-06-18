import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext.jsx';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Globe,
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreVertical,
  FileText,
  Download,
  ExternalLink,
  User as UserIcon,
  X,
  Loader2,
  RefreshCw,
  Info,
  Plus,
  ChevronDown,
  LayoutDashboard,
  Lock,
  History,
  Star,
  Menu,
  HelpCircle,
  ShieldCheck,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const AuditHistoryPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const navigate = useNavigate();
  const darkMode = theme === "dark";

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");

  // Read starred IDs from the same localStorage key used by DashboardPage
  const [starredIds] = useState(() => {
    try {
      const stored = localStorage.getItem('auditify_starred_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between select-none">
      <div className="flex flex-col p-4 gap-4 overflow-y-auto">
        {/* Create Project Button */}
         <div className="relative">
                 <button
                   onClick={() => setCreateDropdownOpen(!createDropdownOpen)}
                   className="w-full flex items-center justify-between px-4 py-2.5 bg-orange-600 hover:bg-orange-350 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-orange-600/10 active:scale-[0.98]"
                 >
                   <div className="flex items-center gap-2">
                     <Plus size={16} />
                     <span>Create Project</span>
                   </div>
                   <ChevronDown size={14} className="opacity-80" />
                 </button>
       
                 {createDropdownOpen && (
                   <div className={`absolute top-full left-0 right-0 mt-1.5 rounded-xl shadow-xl z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150 border transition-all duration-300 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-card border-line'}`}>
                     <button
                       onClick={() => { setCreateDropdownOpen(false); navigate("/dashboard/add-website"); }}
                       className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-inksoft hover:bg-cardsoft'}`}
                     >
                       Add Google Search Console Site
                     </button>
                   </div>
                 )}
               </div>

        {/* Search project box */}
        <div className="relative">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-300 ${darkMode ? 'text-slate-400' : 'text-faint'}`} size={14} />
          <input
            id="project-search-input"
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search projects..."
            className={`w-full pl-9 pr-8 py-2 border rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500/50 transition-colors duration-300 ${darkMode ? 'bg-slate-850 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-cardsoft border-line text-inksoft placeholder-faint'}`}
          />
          <span className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-black border px-1 py-0.5 rounded leading-none transition-colors duration-300 ${darkMode ? 'text-slate-400 bg-slate-800/80 border-slate-700/50' : 'text-muted bg-slate-200/50 border-slate-300/30'}`}>
            ⌘K
          </span>
        </div>

        {/* Menu Links */}
        <nav className="flex flex-col gap-1 mt-2">
          <button
            onClick={() => navigate("/dashboard")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-muted hover:text-inksoft hover:bg-cardsoft'}`}
          >
            <LayoutDashboard size={16} />
            <span>Projects</span>
          </button>



          <button
            onClick={() => navigate("/audit-history")}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 border-none ${darkMode ? 'bg-emerald-950/40 text-emerald-400' : 'bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 shadow-sm'}`}
          >
            <FileText size={16} />
            <span>Report History</span>
          </button>



          <button
            onClick={() => navigate('/dashboard?tab=starred')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-muted hover:text-inksoft hover:bg-cardsoft'}`}
          >
            <Star size={16} />
            <span>Starred</span>
            {starredIds.length > 0 && (
              <span className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-cardsoft text-muted'}`}>
                {starredIds.length}
              </span>
            )}
          </button>

          {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <button
              onClick={() => navigate("/admin")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-muted hover:text-inksoft hover:bg-cardsoft'}`}
            >
              <ShieldCheck size={16} className="text-blue-500 shrink-0" />
              <span>Admin Panel</span>
            </button>
          )}

          {user?.role === 'super_admin' && (
            <button
              onClick={() => navigate("/admin/setup")}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-muted hover:text-inksoft hover:bg-cardsoft'}`}
            >
              <Settings size={16} className="text-indigo-500 shrink-0" />
              <span>System Setup</span>
            </button>
          )}

          <div className={`my-1.5 border-t transition-colors duration-300 ${darkMode ? 'border-slate-800' : 'border-line'}`}></div>

          <button
            onClick={() => toggleTheme()}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-muted hover:text-inksoft hover:bg-cardsoft'}`}
          >
            <div className="flex items-center gap-3">
              {darkMode ? <Sun size={16} className="text-amber-400 shrink-0" /> : <Moon size={16} className="text-indigo-500 shrink-0" />}
              <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
            </div>
            <div className={`w-8 h-4 rounded-full relative transition-colors duration-300 ${darkMode ? "bg-amber-400/20" : "bg-slate-200"}`}>
              <div className={`absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300 ${darkMode ? "right-0.5 bg-amber-400" : "left-0.5 bg-slate-400"}`}></div>
            </div>
          </button>
        </nav>


      </div>

      {/* Premium promotional block */}
      <div className={`p-4 border-t transition-colors duration-300 ${darkMode ? 'border-slate-800' : 'border-line'}`}>
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
            className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-xs shadow-md shadow-emerald-600/10 transition-all active:scale-[0.98]"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [audits, setAudits] = useState([]);
  const [totalAudits, setTotalAudits] = useState(0);
  const [loading, setLoading] = useState(true);
  const itemsPerPage = 10;

  // Debounce logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/user/history?page=${currentPage}&limit=${itemsPerPage}&search=${debouncedSearch}`);
      setAudits(response.data.audits);
      setTotalAudits(response.data.total);
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error('Could not load audit history');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const totalPages = Math.ceil(totalAudits / itemsPerPage);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'pending':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'failed':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle2 size={14} />;
      case 'pending': return <Clock size={14} />;
      case 'failed': return <AlertCircle size={14} />;
      default: return null;
    }
  };

  const getScoreColor = (score) => {
    if (score >= 90) return 'text-emerald-500';
    if (score >= 70) return 'text-amber-500';
    return 'text-rose-500';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isExpired = (createdAt) => {
    const createdDate = new Date(createdAt);
    const now = new Date();
    const diffInMs = now - createdDate;
    const diffInHours = diffInMs / (1000 * 60 * 60);
    return diffInHours >= 3;
  };

  const getAuditTypeBadge = (type) => {
    const reportType = type || 'All';
    switch (reportType) {
      case 'All':
        return {
          label: 'Full Audit',

        };
      case 'Technical Performance':
        return {
          label: 'Tech Performance',

        };
      case 'On Page SEO':
        return {
          label: 'On-Page SEO',

        };
      case 'Accessibility':
        return {
          label: 'Accessibility',

        };
      case 'Security/Compliance':
      case 'Security':
        return {
          label: 'Security & Comp.',

        };
      case 'UX & Content Structure':
      case 'UX':
        return {
          label: 'UX & Content',

        };
      case 'Conversion & Lead Flow':
      case 'Conversion':
        return {
          label: 'Conversion & Lead',

        };
      case 'AIO (AI-Optimization) Readiness':
      case 'AIO':
        return {
          label: 'AIO Readiness',

        };
      default:
        return {
          label: reportType,

        };
    }
  };

  return (
    <div className={`w-full min-h-[calc(100vh-4rem)] flex flex-col md:flex-row font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-50 dark' : 'bg-surface text-ink'}`}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className={`hidden md:flex flex-col w-60 shrink-0 border-r justify-between transition-colors duration-300 sticky top-0 h-[calc(100vh-4rem)] ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-card border-line'}`}>
        <SidebarContent />
      </aside>

      {/* ── MOBILE SIDEBAR DRAWER ── */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 border-r flex flex-col justify-between pt-1 transform transition-transform duration-300 ease-in-out md:hidden
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-card border-line'}
      `}>
        <div className={`flex justify-between items-center p-4 border-b transition-colors duration-300 ${darkMode ? 'border-slate-800' : 'border-line'}`}>
          <span className="text-xs font-black uppercase tracking-widest text-muted">Menu Options</span>
          <button onClick={() => setSidebarOpen(false)} className={`p-1 rounded-lg transition-colors ${darkMode ? 'hover:bg-slate-800 text-white' : 'hover:bg-cardsoft text-muted'}`}>
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
        <div className="max-w-7xl mx-auto w-full">

          {/* Header section with Search & User Profile */}
          <div className="mb-7 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-indigo-600/10 text-indigo-500">
                    <UserIcon size={18} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-500">
                    Logged in as {user?.name || user?.email}
                  </span>
                </div>
                <div className="flex items-center justify-between md:justify-start gap-4">
                  <h1 className={`text-4xl font-semibold tracking-tight ${darkMode ? "text-white" : "text-ink"}`}>
                    Audit <span className="text-indigo-600">History</span>
                  </h1>
                  {/* Mobile Sidebar Toggle Button */}
                  <button
                    onClick={() => setSidebarOpen(true)}
                    className={`md:hidden flex items-center gap-1.5 px-3 py-1.5 border rounded-xl text-xs font-semibold transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-card border-line text-muted hover:bg-cardsoft'}`}
                  >
                    <Menu size={14} />
                    <span>Menu</span>
                  </button>
                </div>
                <p className={`text-lg mt-2 ${darkMode ? "text-slate-400" : "text-muted"}`}>
                  Your complete performance tracking database.
                </p>
              </div>

              <div className="relative w-full md:w-96 group">
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${darkMode ? "text-slate-500 group-focus-within:text-indigo-400" : "text-faint group-focus-within:text-indigo-600"}`}>
                  {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
                </div>
                <input
                  type="text"
                  placeholder="Search by URL..."
                  className={`block w-full pl-12 pr-12 py-4 rounded-2xl border-none outline-none transition-all shadow-xl font-medium ${darkMode
                    ? "bg-slate-800/50 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50"
                    : "bg-card text-ink placeholder-faint focus:ring-2 focus:ring-indigo-500/30"
                    }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${darkMode ? "text-slate-500 hover:text-white" : "text-faint hover:text-ink"}`}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          </div>

          {/* Data Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative overflow-hidden rounded-[2.5rem] shadow-2xl border transition-colors ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-card border-line"
              }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`border-b transition-colors ${darkMode ? "border-slate-800 bg-slate-900/80" : "border-line bg-surface-2/50"}`}>
                    <th className="px-8 py-6 text-xs font-semibold uppercase tracking-widest text-muted">Date</th>
                    <th className="px-8 py-6 text-xs font-semibold uppercase tracking-widest text-muted">Website URL & Device</th>
                    <th className="px-8 py-6 text-xs font-semibold uppercase tracking-widest text-muted">Audit Type</th>
                    <th className="px-8 py-6 text-xs font-semibold uppercase tracking-widest text-muted">Performance Score</th>
                    <th className="px-8 py-6 text-xs font-semibold uppercase tracking-widest text-muted">Status</th>
                    <th className="px-8 py-6 text-xs font-semibold uppercase tracking-widest text-muted text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y transition-colors ${darkMode ? "divide-slate-800" : "divide-line"}`}>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="6" className="px-8 py-6">
                          <div className={`h-12 rounded-2xl ${darkMode ? "bg-slate-800" : "bg-cardsoft"}`} />
                        </td>
                      </tr>
                    ))
                  ) : audits.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-8 py-14 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${darkMode ? "bg-slate-800 text-slate-600" : "bg-cardsoft text-faint"}`}>
                            <Globe size={32} />
                          </div>
                          <p className={`font-medium ${darkMode ? "text-slate-500" : "text-muted"}`}>No audits found matching your criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    audits.map((audit, index) => (
                      <motion.tr
                        key={audit._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group transition-all ${darkMode ? "hover:bg-slate-800/30" : "hover:bg-indigo-50/30"}`}
                      >
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-800 text-slate-400" : "bg-cardsoft text-muted"}`}>
                              <Calendar size={16} />
                            </div>
                            <span className="font-semibold text-sm">
                              {formatDate(audit.createdAt)}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2 mb-1">
                              <Globe size={14} className="text-indigo-500" />
                              <span className={`font-semibold text-sm truncate max-w-[250px] ${darkMode ? "text-slate-200" : "text-inksoft"}`}>
                                {audit.url}
                              </span>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-faint"}`}>
                              {audit.device || 'Desktop'} Profile
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {(() => {
                            const badge = getAuditTypeBadge(audit.reportType);
                            return (
                              <span className={`inline-flex items-center px-3 py-1.5  text-[10px] font-semibold uppercase  ${badge.style}`}>
                                {badge.label}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-8 py-6">
                          {audit.status === 'success' ? (
                            <div className="flex items-center gap-4">
                              <div className="flex-1 h-2 w-24 bg-cardsoft dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${audit.score}%` }}
                                  transition={{ duration: 1, delay: index * 0.1 }}
                                  className={`h-full rounded-full ${audit.score >= 90 ? 'bg-emerald-500' : audit.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                />
                              </div>
                              <span className={`font-black text-lg min-w-[2.5rem] ${getScoreColor(audit.score)}`}>
                                {audit.score}
                              </span>
                            </div>
                          ) : (
                            <span className={`text-xs font-semibold uppercase ${darkMode ? "text-slate-600" : "text-faint"}`}>
                              Data Pending
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col gap-1.5">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${getStatusStyle(audit.status)}`}>
                              {getStatusIcon(audit.status)}
                              {audit.status === 'success' ? 'Completed' : audit.status === 'pending' ? 'Processing' : 'Failed'}
                            </span>
                            {audit.status === 'success' && isExpired(audit.createdAt) && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-500/10 text-slate-500 border border-slate-500/20 text-[8px] font-semibold uppercase tracking-widest self-start">
                                <Clock size={8} /> Expired
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {audit.status === 'success' && (isExpired(audit.createdAt) || audit.reportExists === false) ? (
                              <button
                                onClick={() => {
                                  const url = encodeURIComponent(audit.url);

                                  // Ensure device is capitalized for backend validation
                                  let rawDevice = audit.device || 'Desktop';
                                  const normalizedDevice =
                                    rawDevice.charAt(0).toUpperCase() +
                                    rawDevice.slice(1).toLowerCase();

                                  const device = encodeURIComponent(normalizedDevice);
                                  const report = encodeURIComponent(audit.reportType || 'All');

                                  // ONLY rerun audit
                                  navigate(
                                    `/dashboard?url=${url}&device=${device}&report=${report}`
                                  );
                                }}
                                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-sm font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
                              >
                                <RefreshCw size={14} />
                                Run Again
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => {
                                    // ONLY open report
                                    if (audit.reportId) {
                                      const params = new URLSearchParams({
                                        url: audit.url || "",
                                        device: audit.device || "Desktop",
                                        report: audit.reportType || "All"
                                      });

                                      window.open(
                                        `/report/${audit.reportId}?${params.toString()}`,
                                        '_blank'
                                      );
                                    } else {
                                      toast.error(
                                        "Report details are currently unavailable."
                                      );
                                    }
                                  }}
                                  className={`p-2.5 rounded-xl transition-all shadow-lg border ${darkMode
                                    ? "bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white border-slate-700"
                                    : "bg-card hover:bg-indigo-50 text-muted hover:text-indigo-600 border-line"
                                    }`}
                                  title="View Report"
                                >
                                  <FileText size={18} />
                                </button>

                                <button
                                  onClick={() => {
                                    // ONLY download PDF
                                    const rId = audit.reportId || null;

                                    if (!rId) {
                                      return toast.error(
                                        'PDF unavailable for this audit'
                                      );
                                    }

                                    toast.promise(
                                      (async () => {
                                        const token = localStorage.getItem(
                                          'dealerpulse_token'
                                        );

                                        const API_URL =
                                          import.meta.env.VITE_API_URL ||
                                          'http://localhost:2000';

                                        const response = await fetch(
                                          `${API_URL}/single-audit/${rId}/export/pdf`,
                                          {
                                            headers: {
                                              ...(token
                                                ? {
                                                  Authorization: `Bearer ${token}`
                                                }
                                                : {})
                                            }
                                          }
                                        );

                                        if (!response.ok) {
                                          throw new Error(
                                            'Failed to generate PDF'
                                          );
                                        }

                                        const blob = await response.blob();

                                        const url =
                                          window.URL.createObjectURL(blob);

                                        const link =
                                          document.createElement('a');

                                        link.href = url;

                                        link.download = `Auditify-Report-${audit.url.replace(
                                          /[^a-z0-9]/gi,
                                          '-'
                                        )}.pdf`;

                                        document.body.appendChild(link);

                                        link.click();

                                        document.body.removeChild(link);

                                        window.URL.revokeObjectURL(url);
                                      })(),
                                      {
                                        loading: 'Generating PDF report...',
                                        success: 'Report downloaded!',
                                        error: 'Failed to generate PDF',
                                      }
                                    );
                                  }}
                                  className={`p-2.5 rounded-xl transition-all shadow-lg border ${darkMode
                                    ? "bg-slate-800 hover:bg-emerald-600 text-slate-400 hover:text-white border-slate-700"
                                    : "bg-card hover:bg-emerald-50 text-muted hover:text-emerald-600 border-line"
                                    }`}
                                  title="Download PDF"
                                >
                                  <Download size={18} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && audits.length > 0 && (
              <div className={`px-8 py-6 flex items-center justify-between border-t transition-colors ${darkMode ? "border-slate-800 bg-slate-900/50" : "border-line bg-surface-2/50"}`}>
                <p className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-muted"}`}>
                  Showing <span className={darkMode ? "text-white" : "text-ink"}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span className={darkMode ? "text-white" : "text-ink"}>{Math.min(currentPage * itemsPerPage, totalAudits)}</span> of <span className={darkMode ? "text-white" : "text-ink"}>{totalAudits}</span> audits
                </p>

                <div className="flex items-center gap-2">
                  {/* Prev button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-xl transition-all ${currentPage === 1
                      ? "opacity-30 cursor-not-allowed"
                      : darkMode ? "hover:bg-slate-800 text-white" : "hover:bg-card text-muted shadow-sm border border-line"
                      }`}
                  >
                    <ChevronLeft size={20} />
                  </button>

                  {/* Smart page buttons with ellipsis */}
                  <div className="flex items-center gap-1">
                    {(() => {
                      const delta = 2; // pages shown each side of current
                      const pages = [];
                      const rangeStart = Math.max(2, currentPage - delta);
                      const rangeEnd = Math.min(totalPages - 1, currentPage + delta);

                      // Always show page 1
                      pages.push(1);

                      // Left ellipsis
                      if (rangeStart > 2) pages.push('left-ellipsis');

                      // Middle window
                      for (let p = rangeStart; p <= rangeEnd; p++) pages.push(p);

                      // Right ellipsis
                      if (rangeEnd < totalPages - 1) pages.push('right-ellipsis');

                      // Always show last page
                      if (totalPages > 1) pages.push(totalPages);

                      return pages.map((page, idx) => {
                        if (page === 'left-ellipsis' || page === 'right-ellipsis') {
                          return (
                            <span
                              key={page}
                              className={`w-10 h-10 flex items-center justify-center text-sm font-semibold select-none ${darkMode ? 'text-slate-500' : 'text-faint'}`}
                            >
                              …
                            </span>
                          );
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-xl text-sm font-semibold transition-all ${currentPage === page
                              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                              : darkMode
                                ? "hover:bg-slate-800 text-slate-400"
                                : "hover:bg-card text-muted border border-transparent hover:border-line"
                              }`}
                          >
                            {page}
                          </button>
                        );
                      });
                    })()}
                  </div>

                  {/* Next button */}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-xl transition-all ${currentPage === totalPages
                      ? "opacity-30 cursor-not-allowed"
                      : darkMode ? "hover:bg-slate-800 text-white" : "hover:bg-card text-muted shadow-sm border border-line"
                      }`}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>

          {/* Expiration Note */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className={`mt-8 p-4 rounded-2xl border flex items-start gap-3 ${darkMode ? "bg-indigo-500/5 border-indigo-500/10 text-slate-400" : "bg-indigo-50 border-indigo-100 text-slate-600"
              }`}
          >
            <Info size={18} className="text-indigo-500 mt-0.5 shrink-0" />
            <p className="text-sm font-medium leading-relaxed">
              <span className="font-semibold text-indigo-500">Note:</span> Audit reports are automatically cleared from active storage after 3 hours for security and performance reasons. You can always run a fresh audit for any URL using the <strong>Run Again</strong> button.
            </p>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AuditHistoryPage;
