import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext.jsx';
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
  History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const { user, apiFetch } = useAuth();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";
  const navigate = useNavigate();
  const location = useLocation();

  // Handle Scroll to Hash or Top
  useEffect(() => {
    if (location.hash === '#audit-history') {
      const element = document.getElementById('audit-history');
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    } else {
      // Scroll to top if no hash (to ensure fresh dashboard view)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [location]);

  const [websites, setWebsites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Search Debouncing Logic
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300); // 300ms delay

    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch GSC Websites
      const sitesRes = await apiFetch('/api/websites');
      if (sitesRes.ok) setWebsites(sitesRes.data.websites);

      // Fetch Audit History
      const historyRes = await apiFetch('/api/user/history');
      if (historyRes.ok) setHistory(historyRes.data.audits || []);
      
    } catch (err) {
      console.error('Data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiFetch]);

  // Poll for updates if there are pending audits
  useEffect(() => {
    const hasPending = history.some(audit => audit.status === 'pending');
    let interval;

    if (hasPending) {
      interval = setInterval(() => {
        // Silently refresh history
        apiFetch('/api/user/history').then(res => {
          if (res.ok) setHistory(res.data.audits || []);
        });
      }, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [history, apiFetch]);

  const handleVerify = async (url) => {
    setVerifying(url);
    const { ok, data } = await apiFetch('/api/websites/verify', {
      method: 'POST',
      body: JSON.stringify({ url }),
    });

    if (ok && data.success) {
      toast.success(data.message);
      fetchData();
    } else {
      toast.error(data.message || 'Verification failed');
    }
    setVerifying(null);
  };

  const handleSync = async () => {
    setSyncing(true);
    const { ok, data } = await apiFetch('/api/websites/sync', { method: 'POST' });
    if (ok) {
      toast.success(data.message);
      setWebsites(data.websites);
    } else {
      toast.error(data.message || 'Sync failed');
    }
    setSyncing(false);
  };

  const handleDelete = async (id, url) => {
    if (!window.confirm(`Remove ${url} from your list?`)) return;

    const { ok } = await apiFetch(`/api/websites/${id}`, { method: 'DELETE' });
    if (ok) {
      toast.success('Website removed');
      fetchData();
    } else {
      toast.error('Failed to remove website');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const filteredWebsites = websites.filter(site => 
    site.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${darkMode ? "bg-[#0a0a0f] text-white" : "bg-slate-50 text-slate-900"}`}>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Header Area */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <LayoutDashboard className="text-blue-500" size={20} />
              <span className="text-blue-500 font-black tracking-widest text-[10px] uppercase">Command Center</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h1>
            <p className={`mt-1 text-sm font-medium ${darkMode ? "text-gray-500" : "text-slate-400"}`}>Manage your verified properties and audit history.</p>
          </div>
        </header>

        {/* Websites Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Globe className="text-blue-500" size={20} /> Your Websites
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative group min-w-[240px]">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? "text-gray-500" : "text-slate-400"} group-focus-within:text-blue-500 transition-colors`} size={16} />
                <input 
                  type="text" 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search websites..." 
                  className={`w-full pl-11 pr-10 py-3 rounded-2xl text-sm font-medium outline-none transition-all border ${
                    darkMode 
                      ? "bg-white/5 border-white/5 focus:bg-white/10 focus:border-blue-500/30 text-white" 
                      : "bg-white border-slate-200 focus:border-blue-500/30 text-slate-900"
                  }`}
                />
                {searchInput && (
                   <button 
                    onClick={() => setSearchInput("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-red-500 transition-colors"
                   >
                     <X size={14} />
                   </button>
                )}
              </div>
              
              {user?.authProvider === 'google' && (
                <button 
                  onClick={handleSync}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm transition-all border ${
                    darkMode ? "bg-white/5 border-white/5 hover:bg-blue-500/10 text-blue-500" : "bg-white border-slate-200 hover:bg-blue-50 text-blue-600"
                  }`}
                  title="Force Sync with GSC"
                  disabled={syncing}
                >
                  <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
                  <span className="hidden sm:inline">Sync GSC</span>
                </button>
              )}
              <Link 
                to="/dashboard/add-website"
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/20 transition-all active:scale-95"
              >
                <Plus size={18} /> Add Website
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence mode="popLayout">
              {loading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className={`h-48 rounded-3xl animate-pulse ${darkMode ? "bg-white/5" : "bg-white border border-slate-100"}`}></div>
                ))
              ) : websites.length === 0 ? (
                <div className={`col-span-full py-16 rounded-[40px] border-2 border-dashed flex flex-col items-center justify-center gap-4 ${darkMode ? "border-white/5 bg-white/[0.02]" : "border-slate-200 bg-white"}`}>
                   <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                      <Globe size={32} />
                   </div>
                   <p className="font-bold text-gray-500">No websites added yet.</p>
                   <Link to="/dashboard/add-website" className="text-blue-500 font-bold underline">Add your first website to start auditing</Link>
                </div>
              ) : filteredWebsites.length === 0 ? (
                <div className={`col-span-full py-12 text-center font-bold ${darkMode ? "text-gray-500" : "text-slate-400"}`}>
                  No websites matching "{searchQuery}"
                </div>
              ) : (
                filteredWebsites.map((site) => (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={site._id} 
                    className={`group p-6 rounded-[32px] border transition-all shadow-xl hover:shadow-2xl ${
                      darkMode ? "bg-[#11111a] border-white/5 hover:border-blue-500/30" : "bg-white border-slate-100 hover:border-blue-200"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${site.url}&sz=64`} 
                        alt="" 
                        className="w-10 h-10 rounded-xl shadow-md"
                        onError={(e) => e.target.src = 'https://www.google.com/s2/favicons?domain=example.com&sz=64'}
                      />
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleDelete(site._id, site.url)}
                          className={`p-2 rounded-lg transition-colors ${darkMode ? "hover:bg-red-500/10 text-gray-600 hover:text-red-500" : "hover:bg-red-50 text-slate-300 hover:text-red-600"}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <h3 className="font-black text-lg truncate mb-1">{site.url.replace(/^https?:\/\//, '')}</h3>
                    <div className="flex items-center gap-2 mb-6">
                      {site.verified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-wider">
                          <CheckCircle size={10} /> Verified Property
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider">
                          <AlertCircle size={10} /> Unverified
                        </span>
                      )}
                    </div>

                    {!site.verified && user?.authProvider === 'google' && (
                      <div className="flex flex-col gap-2">
                        <button 
                          onClick={() => handleVerify(site.url)}
                          disabled={verifying === site.url}
                          className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/10"
                        >
                          {verifying === site.url ? <RefreshCw className="animate-spin" size={14} /> : <ShieldCheck size={14} />}
                          Verify with GSC
                        </button>
                        <button 
                          onClick={() => navigate(`/?url=${site.url}`)}
                          className={`w-full py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 border ${
                            darkMode ? "bg-white/5 border-white/5 text-gray-400 hover:text-white" : "bg-slate-50 border-slate-100 text-slate-500 hover:text-slate-900"
                          }`}
                        >
                          <Activity size={14} className="text-blue-500" />
                          Quick Audit
                        </button>
                      </div>
                    )}

                    {site.verified && (
                      <div className="flex flex-col gap-4">
                        <button 
                          onClick={() => navigate(`/?url=${site.url}`)}
                          className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                          <Zap size={14} className="fill-white" />
                          Analyze Site
                        </button>
                        <div className={`p-3 rounded-xl text-[9px] font-bold flex flex-col gap-1 ${darkMode ? "bg-white/5 text-gray-500" : "bg-slate-50 text-slate-500"}`}>
                           <div className="flex justify-between uppercase"><span>Permission</span> <span className="text-blue-500">{site.permissionLevel?.replace('site', '') || 'Owner'}</span></div>
                           <div className="flex justify-between uppercase"><span>Verified</span> <span>{formatDate(site.verifiedAt)}</span></div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Audit History section */}
        <section id="audit-history" className="space-y-6">
           <h2 className="text-xl font-black flex items-center gap-2">
              <History className="text-indigo-500" size={20} /> Recent Audit Activity
           </h2>
           
           <div className={`rounded-[40px] border shadow-2xl overflow-hidden transition-colors ${darkMode ? "bg-[#16161e]/30 border-white/5" : "bg-white border-slate-100"}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className={`border-b text-[10px] uppercase tracking-widest font-black ${darkMode ? "border-white/5 text-gray-500" : "border-slate-100 text-slate-400"}`}>
                      <tr>
                         <th className="px-8 py-5">Scan Target</th>
                         <th className="px-8 py-5 text-center">Audit Type</th>
                         <th className="px-8 py-5 text-center">Status</th>
                         <th className="px-8 py-5 text-center">Score</th>
                         <th className="px-8 py-5">Date</th>
                         <th className="px-8 py-5 text-right">Actions</th>
                      </tr>
                   </thead>
                   <tbody className={`divide-y ${darkMode ? "divide-white/5" : "divide-slate-50"}`}>
                      {loading ? (
                        [1,2].map(i => <tr key={i}><td colSpan="6" className="px-8 py-8 animate-pulse text-center font-bold text-gray-400 uppercase tracking-tighter">Syncing...</td></tr>)
                      ) : history.length === 0 ? (
                        <tr><td colSpan="6" className="px-8 py-16 text-center text-gray-500 font-bold italic">No scan history found. Run an audit to see results here.</td></tr>
                      ) : (
                        history.slice(0, 10).map((audit) => (
                           <tr key={audit._id} className="group hover:bg-blue-500/[0.02] transition-colors">
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform"><FileText size={14} /></div>
                                    <div className="flex flex-col">
                                       <span className="font-bold text-sm truncate max-w-xs">{audit.url?.replace(/^https?:\/\//, '') || 'N/A'}</span>
                                       <span className={`text-[10px] font-medium ${darkMode ? "text-gray-500" : "text-slate-400"}`}>{audit.device}</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-center">
                                 <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${darkMode ? "bg-white/5 text-gray-400" : "bg-slate-100 text-slate-500"}`}>
                                    {audit.reportType || 'Full Audit'}
                                 </span>
                              </td>
                              <td className="px-8 py-5 text-center">
                                 <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                    audit.status === 'success' ? (darkMode ? "bg-emerald-500/10 text-emerald-500" : "bg-emerald-50 text-emerald-600") :
                                    audit.status === 'pending' ? (darkMode ? "bg-blue-500/10 text-blue-400" : "bg-blue-50 text-blue-600") :
                                    (darkMode ? "bg-red-500/10 text-red-500" : "bg-red-50 text-red-600")
                                 }`}>
                                    {audit.status === 'pending' && <RefreshCw size={10} className="animate-spin" />}
                                    {audit.status || 'Success'}
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-center">
                                 <div className={`inline-block px-3 py-1 rounded-lg font-black text-xs ${
                                    (audit.score || 0) >= 90 ? "bg-emerald-500/10 text-emerald-500" :
                                    (audit.score || 0) >= 70 ? "bg-amber-500/10 text-amber-500" : "bg-red-500/10 text-red-500"
                                 }`}>
                                    {audit.status === 'success' ? (audit.score || 0) : '—'}
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-sm font-medium text-gray-500">{formatDate(audit.createdAt)}</td>
                              <td className="px-8 py-5 text-right">
                                 <div className="flex justify-end gap-2 text-gray-400 group-hover:text-blue-500 transition-colors">
                                    <button 
                                      onClick={() => {
                                        if (audit.status === 'failed') {
                                           toast.error('Audit failed. Please re-run it.');
                                        } else {
                                          navigate(`/report/${audit.reportId}`);
                                        }
                                      }}
                                      className="p-2 hover:bg-blue-500/10 rounded-lg transition-all" 
                                      title={audit.status === 'pending' ? "View Progress" : "View Report"}
                                    >
                                      <ExternalLink size={16} />
                                    </button>
                                    <button 
                                      onClick={async () => {
                                        toast.promise(
                                          (async () => {
                                            const token = localStorage.getItem('auditify_token');
                                            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';
                                            
                                            // Backend route attached at /single-audit in server.js
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
                                            error: (err) => err.message,
                                          }
                                        );
                                      }}
                                      className="p-2 hover:bg-indigo-500/10 rounded-lg disabled:opacity-20 transition-all" 
                                      title="Download PDF"
                                      disabled={audit.status !== 'success'}
                                    >
                                      <Download size={16} />
                                    </button>
                                 </div>
                              </td>
                           </tr>
                        ))
                      )}
                   </tbody>
                </table>
              </div>
           </div>
        </section>

      </div>
    </div>
  );
};

export default DashboardPage;
