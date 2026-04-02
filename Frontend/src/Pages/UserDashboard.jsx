import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { History, FileText, Download, Calendar, ExternalLink, Activity, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';

const UserDashboard = () => {
  const { user } = useAuth();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const [history, setHistory] = useState([]);
  const [totalAudits, setTotalAudits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await api.get('/api/user/history');
        setHistory(response.data.audits);
        setTotalAudits(response.data.total);
      } catch (error) {
        console.error('Failed to fetch history:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`min-h-screen pt-32 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${darkMode ? "bg-[#0a0a10] text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
               <LayoutDashboard className="text-blue-500" size={24} />
               <span className="text-blue-500 font-black tracking-widest text-xs uppercase">Personal Overview</span>
            </div>
            <h1 className={`text-4xl font-extrabold tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
              Welcome, {user?.name}
            </h1>
            <p className={`mt-2 text-lg ${darkMode ? "text-gray-400" : "text-slate-500"}`}>Your audit performance and history at a glance.</p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex gap-4"
          >
            <div className={`backdrop-blur-xl border rounded-3xl p-6 flex items-center gap-5 shadow-2xl transition-colors ${darkMode ? "bg-[#16161e]/50 border-white/5" : "bg-white border-slate-200"}`}>
              <div className="w-14 h-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-blue-500">
                <Activity size={28} />
              </div>
              <div>
                <p className={`text-xs uppercase tracking-widest font-black ${darkMode ? "text-gray-500" : "text-slate-500"}`}>Total Audits</p>
                <p className={`text-3xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{loading ? '...' : totalAudits}</p>
              </div>
            </div>
          </motion.div>
        </header>

        {/* Recent History Table */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`backdrop-blur-2xl border rounded-[40px] overflow-hidden shadow-2xl transition-colors ${darkMode ? "bg-[#16161e]/30 border-white/5" : "bg-white border-slate-200"}`}
        >
          <div className={`p-8 border-b flex items-center justify-between ${darkMode ? "border-white/5 bg-white/[0.02]" : "border-slate-100 bg-slate-50"}`}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 flex items-center justify-center text-indigo-500">
                <History size={24} />
              </div>
              <div>
                <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-slate-900"}`}>Recent Audits</h2>
                <p className={`text-xs ${darkMode ? "text-gray-500" : "text-slate-500"}`}>Your latest 10 security and performance inspections</p>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`border-b text-[10px] uppercase tracking-widest font-black ${darkMode ? "border-white/5 text-gray-500" : "border-slate-200 text-slate-500"}`}>
                  <th className="px-10 py-6">Website URL</th>
                  <th className="px-10 py-6">Timestamp</th>
                  <th className="px-10 py-6">Device Profile</th>
                  <th className="px-10 py-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? "divide-white/5" : "divide-slate-100"}`}>
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan="4" className="px-10 py-10">
                        <div className={`h-8 rounded-2xl animate-pulse w-full ${darkMode ? "bg-white/5" : "bg-slate-200"}`} />
                      </td>
                    </tr>
                  ))
                ) : history.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-10 py-24 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${darkMode ? "bg-white/5 text-gray-600" : "bg-slate-100 text-slate-400"}`}>
                          <FileText size={32} />
                        </div>
                        <p className={`font-medium ${darkMode ? "text-gray-500" : "text-slate-500"}`}>No audit history found for this account.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  history.map((audit) => (
                    <tr key={audit._id} className={`transition-all group ${darkMode ? "hover:bg-white/[0.03]" : "hover:bg-slate-50"}`}>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform ${darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600"}`}>
                            <ExternalLink size={16} />
                          </div>
                          <span className={`font-bold truncate max-w-sm ${darkMode ? "text-gray-200" : "text-slate-700"}`}>{audit.url}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <div className="flex flex-col">
                          <span className={`font-medium ${darkMode ? "text-gray-300" : "text-slate-700"}`}>{formatDate(audit.createdAt).split(',')[0]}</span>
                          <span className={`text-[10px] uppercase tracking-tighter ${darkMode ? "text-gray-500" : "text-slate-500"}`}>{formatDate(audit.createdAt).split(',')[1]}</span>
                        </div>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm ${
                          audit.device === 'Mobile' 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}>
                          {audit.device || 'Desktop'}
                        </span>
                      </td>
                      <td className="px-10 py-6 text-right">
                        <div className="flex items-center justify-end gap-3">
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
                                alert("This report details are currently unavailable.");
                              }
                            }}
                            className={`p-3 rounded-xl transition-all shadow-lg border ${darkMode 
                              ? "bg-white/5 hover:bg-blue-600 text-gray-400 hover:text-white border-white/5" 
                              : "bg-white hover:bg-blue-50 text-slate-500 hover:text-blue-600 border-slate-200"}`}
                            title="View Report"
                          >
                            <FileText size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              if (!audit.reportId) return toast.error('PDF unavailable for this audit');
                              
                              toast.promise(
                                (async () => {
                                  const token = localStorage.getItem('auditify_token');
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
                                  loading: 'Generating professional PDF report...',
                                  success: 'Report downloaded successfully!',
                                  error: 'Failed to generate PDF',
                                }
                              );
                            }}
                            className={`p-3 rounded-xl transition-all shadow-lg border ${darkMode 
                              ? "bg-white/5 hover:bg-emerald-600 text-gray-400 hover:text-white border-white/5" 
                              : "bg-white hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 border-slate-200"}`}
                            title="Download PDF"
                          >
                            <Download size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.section>
      </div>
    </div>
  );
};

export default UserDashboard;
