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
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';

const AuditHistoryPage = () => {
  const { user } = useAuth();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  
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

  return (
    <div className={`min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${darkMode ? "bg-[#0f172a] text-slate-200" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header section with Search & User Profile */}
        <div className="mb-10 space-y-8">
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
              <h1 className={`text-4xl font-extrabold tracking-tight mb-2 ${darkMode ? "text-white" : "text-slate-900"}`}>
                Audit <span className="text-indigo-600">History</span>
              </h1>
              <p className={`text-lg ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Your complete performance tracking database.
              </p>
            </div>
            
            <div className="relative w-full md:w-96 group">
              <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors ${darkMode ? "text-slate-500 group-focus-within:text-indigo-400" : "text-slate-400 group-focus-within:text-indigo-600"}`}>
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Search size={20} />}
              </div>
              <input
                type="text"
                placeholder="Search by URL..."
                className={`block w-full pl-12 pr-12 py-4 rounded-2xl border-none outline-none transition-all shadow-xl font-medium ${
                  darkMode 
                    ? "bg-slate-800/50 text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500/50" 
                    : "bg-white text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500/30"
                }`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className={`absolute inset-y-0 right-0 pr-4 flex items-center transition-colors ${darkMode ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-900"}`}
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
          className={`relative overflow-hidden rounded-[2.5rem] shadow-2xl border transition-colors ${
            darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-200"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b transition-colors ${darkMode ? "border-slate-800 bg-slate-900/80" : "border-slate-100 bg-slate-50/50"}`}>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-500">Date</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-500">Website URL & Device</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-500">Performance Score</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-8 py-6 text-xs font-bold uppercase tracking-widest text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y transition-colors ${darkMode ? "divide-slate-800" : "divide-slate-100"}`}>
                <AnimatePresence mode='wait'>
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan="5" className="px-8 py-6">
                          <div className={`h-12 rounded-2xl ${darkMode ? "bg-slate-800" : "bg-slate-100"}`} />
                        </td>
                      </tr>
                    ))
                  ) : audits.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${darkMode ? "bg-slate-800 text-slate-600" : "bg-slate-100 text-slate-400"}`}>
                            <Globe size={32} />
                          </div>
                          <p className={`font-medium ${darkMode ? "text-slate-500" : "text-slate-500"}`}>No audits found matching your criteria.</p>
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
                            <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"}`}>
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
                              <span className={`font-bold text-sm truncate max-w-[250px] ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                                {audit.url}
                              </span>
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                              {audit.device || 'Desktop'} Profile
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          {audit.status === 'success' ? (
                            <div className="flex items-center gap-4">
                              <div className="flex-1 h-2 w-24 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${audit.score}%` }}
                                  transition={{ duration: 1, delay: index * 0.1 }}
                                  className={`h-full rounded-full ${
                                    audit.score >= 90 ? 'bg-emerald-500' : audit.score >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}
                                />
                              </div>
                              <span className={`font-black text-lg min-w-[2.5rem] ${getScoreColor(audit.score)}`}>
                                {audit.score}
                              </span>
                            </div>
                          ) : (
                            <span className={`text-xs font-bold uppercase ${darkMode ? "text-slate-600" : "text-slate-300"}`}>
                              Data Pending
                            </span>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-sm ${getStatusStyle(audit.status)}`}>
                            {getStatusIcon(audit.status)}
                            {audit.status === 'success' ? 'Completed' : audit.status === 'pending' ? 'Processing' : 'Failed'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                if (audit.reportId) {
                                  const params = new URLSearchParams({
                                    url: audit.url || "",
                                    device: audit.device || "Desktop",
                                    report: audit.reportType || "All"
                                  }).toString();
                                  window.open(`/report/${audit.reportId}?${params}`, '_blank');
                                } else {
                                  toast.error("Report details are currently unavailable.");
                                }
                              }}
                              className={`p-2.5 rounded-xl transition-all shadow-lg border ${darkMode 
                                ? "bg-slate-800 hover:bg-indigo-600 text-slate-400 hover:text-white border-slate-700" 
                                : "bg-white hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 border-slate-200"}`}
                              title="View Report"
                            >
                              <FileText size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                if (!audit.reportId) return toast.error('PDF unavailable for this audit');
                                
                                toast.promise(
                                  (async () => {
                                    const token = localStorage.getItem('dealerpulse_token');
                                    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
                                    const response = await fetch(`${API_URL}/single-audit/${audit.reportId}/export/pdf`, {
                                      headers: {
                                        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                                      }
                                    });
                                    if (!response.ok) throw new Error('Failed to generate PDF');
                                    
                                    const blob = await response.blob();
                                    const url = window.URL.createObjectURL(blob);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.download = `Auditify-Report-${audit.url.replace(/[^a-z0-9]/gi, '-')}.pdf`;
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
                                : "bg-white hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 border-slate-200"}`}
                              title="Download PDF"
                            >
                              <Download size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && audits.length > 0 && (
            <div className={`px-8 py-6 flex items-center justify-between border-t transition-colors ${darkMode ? "border-slate-800 bg-slate-900/50" : "border-slate-100 bg-slate-50/50"}`}>
              <p className={`text-sm font-medium ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Showing <span className={darkMode ? "text-white" : "text-slate-900"}>{(currentPage - 1) * itemsPerPage + 1}</span> to <span className={darkMode ? "text-white" : "text-slate-900"}>{Math.min(currentPage * itemsPerPage, totalAudits)}</span> of <span className={darkMode ? "text-white" : "text-slate-900"}>{totalAudits}</span> audits
              </p>
              
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-xl transition-all ${
                    currentPage === 1 
                      ? "opacity-30 cursor-not-allowed" 
                      : darkMode ? "hover:bg-slate-800 text-white" : "hover:bg-white text-slate-600 shadow-sm border border-slate-200"
                  }`}
                >
                  <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        currentPage === i + 1
                          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                          : darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-white text-slate-600 border border-transparent hover:border-slate-200"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-xl transition-all ${
                    currentPage === totalPages 
                      ? "opacity-30 cursor-not-allowed" 
                      : darkMode ? "hover:bg-slate-800 text-white" : "hover:bg-white text-slate-600 shadow-sm border border-slate-200"
                  }`}
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AuditHistoryPage;
