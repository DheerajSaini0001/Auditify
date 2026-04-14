import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { 
  Users, 
  Activity, 
  Lock, 
  Unlock, 
  Trash2, 
  Search, 
  Filter, 
  ShieldAlert,
  LayoutDashboard,
  ExternalLink,
  Bot,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const [stats, setStats] = useState({ totalUsers: 0, totalAudits: 0, totalDownloads: 0, totalProjects: 0, activeToday: 0 });
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  
  // Detail Modal State
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);
  const [userDetails, setUserDetails] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    } else {
        const delayDebounceFn = setTimeout(() => {
            fetchLogs();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }
  }, [activeTab, search, countryFilter, page]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Stats Error:', err);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/users?page=${page}&search=${search}`);
      const data = response.data;
      setUsers(data.users || []);
      setTotalItems(data.total || 0);
    } catch (err) {
      console.error('Users Error:', err);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/audit-logs?page=${page}&search=${search}&country=${countryFilter}`);
      const data = response.data;
      setLogs(data.logs || []);
      setTotalItems(data.total || 0);
    } catch (err) {
      console.error('Logs Error:', err);
      toast.error('Failed to load website logs');
    } finally {
      setLoading(false);
    }
  };

  const handleUserClick = async (user) => {
    setSelectedUser(user);
    setUserDetailLoading(true);
    try {
      const { data } = await api.get(`/api/admin/users/${user._id}`);
      setUserDetails(data);
    } catch (err) {
      toast.error('Failed to load user details');
    } finally {
      setUserDetailLoading(false);
    }
  };

  const handleBlock = async (userId, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to block this user?')) return;
    try {
      await api.post('/api/admin/users/block', { userId, reason: 'Administrative block' });
      fetchUsers();
      fetchStats();
      toast.success('User blocked');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to block user');
    }
  };

  const handleUnblock = async (userId, e) => {
    e.stopPropagation();
    try {
      await api.post('/api/admin/users/unblock', { userId });
      fetchUsers();
      fetchStats();
      toast.success('User unblocked');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to unblock user');
    }
  };

  const handleDelete = async (userId, e) => {
    e.stopPropagation();
    if (!window.confirm('PERMANENT DELETE! Are you sure?')) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      fetchUsers();
      fetchStats();
      toast.success('User removed');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const formatTimestamp = (ts) => new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const StatCard = ({ icon: Icon, label, value, color, delay }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`backdrop-blur-xl border rounded-3xl p-6 shadow-xl transition-colors ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-white border-slate-200'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`p-4 rounded-2xl ${color}`}>
          <Icon className={darkMode ? "text-white" : "text-black"} size={24} />
        </div>
        <div>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-slate-500"}`}>{label}</p>
          <p className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{value}</p>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className={`min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${darkMode ? 'bg-[#0a0a10] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-[1400px] mx-auto space-y-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className={`text-4xl font-extrabold tracking-tight flex items-center gap-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <ShieldAlert className="text-blue-500" size={36} />
              Admin Panel
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Real-time platform overview and management.</p>
          </div>

          <div className={`flex gap-2 p-1 rounded-2xl border shadow-xl transition-colors ${darkMode ? 'bg-[#16161e] border-white/5' : 'bg-white border-slate-200'}`}>
            {['users', 'websites'].map((tab) => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setPage(1); setSearch(''); }}
                className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : `${darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`
                }`}
              >
                {tab === 'users' ? 'Registered Users' : 'My Websites'}
              </button>
            ))}
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-600/10 text-blue-500" delay={0.1} />
          <StatCard icon={Activity} label="Sites Scanned" value={stats.totalAudits} color="bg-emerald-600/10 text-emerald-500" delay={0.2} />
          <StatCard icon={ExternalLink} label="Reports Downloaded" value={stats.totalDownloads} color="bg-amber-600/10 text-amber-500" delay={0.3} />
          <StatCard icon={LayoutDashboard} label="Total Projects" value={stats.totalProjects} color="bg-indigo-600/10 text-indigo-500" delay={0.4} />
        </div>

        {/* Controls */}
        <div className={`flex flex-col md:flex-row md:items-center gap-4 backdrop-blur-xl border rounded-2xl p-4 shadow-lg transition-colors ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="relative flex-1">
                <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`} size={18} />
                <input 
                  type="text"
                  placeholder={activeTab === 'users' ? "Search by name or email..." : "Search by URL..."}
                  className={`w-full pl-12 pr-4 py-3 border border-transparent rounded-xl focus:border-blue-500/50 focus:outline-none transition-all ${
                    darkMode ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-slate-100 text-slate-900 placeholder:text-slate-400'
                  }`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
            </div>
            {activeTab === 'websites' && (
               <div className="relative">
                  <Filter className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`} size={18} />
                  <input 
                    type="text"
                    placeholder="Filter by Country..."
                    className={`pl-12 pr-4 py-3 border border-transparent rounded-xl focus:border-blue-500/50 focus:outline-none transition-all ${
                      darkMode ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-slate-100 text-slate-900 placeholder:text-slate-400'
                    }`}
                    value={countryFilter}
                    onChange={(e) => setCountryFilter(e.target.value)}
                  />
               </div>
            )}
        </div>

        {/* Data Table */}
        <div className={`backdrop-blur-xl border rounded-3xl overflow-hidden shadow-2xl transition-colors ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-white border-slate-200'}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={`border-b text-[10px] uppercase tracking-widest font-bold ${darkMode ? 'border-white/5 text-gray-500' : 'border-slate-100 text-slate-500'}`}>
                  {activeTab === 'users' ? (
                    <>
                      <th className="px-8 py-6">User / Account</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6">Joined</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </>
                  ) : (
                    <>
                      <th className="px-8 py-6">Audited Website</th>
                      <th className="px-8 py-6">User / Country</th>
                      <th className="px-8 py-6 text-center">Score</th>
                      <th className="px-8 py-6 text-right">Timestamp</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                {loading ? (
                  <tr><td colSpan="4" className="px-8 py-12 text-center animate-pulse">Synchronizing database...</td></tr>
                ) : (activeTab === 'users' ? users : logs).map((item) => (
                  <tr 
                    key={item._id} 
                    onClick={activeTab === 'users' ? () => handleUserClick(item) : undefined}
                    className={`transition-colors group cursor-pointer ${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}
                  >
                    {activeTab === 'users' ? (
                      <>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold bg-blue-600/10 text-blue-500`}>
                              {item.avatar ? <img src={item.avatar} alt="" className="w-10 h-10 rounded-full" /> : item.name.charAt(0)}
                            </div>
                            <div>
                               <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.name}</p>
                               <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>{item.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${item.isBlocked ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                            {item.isBlocked ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-sm opacity-50">{formatTimestamp(item.createdAt)}</td>
                        <td className="px-8 py-5 text-right">
                           <div className="flex justify-end gap-2">
                             {item.isBlocked ? (
                               <button onClick={(e) => handleUnblock(item._id, e)} className="p-2 text-emerald-500 bg-emerald-500/5 hover:bg-emerald-500/10 rounded-lg"><Unlock size={14}/></button>
                             ) : (
                               <button onClick={(e) => handleBlock(item._id, e)} disabled={item.role === 'admin'} className="p-2 text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 rounded-lg disabled:opacity-10"><Lock size={14}/></button>
                             )}
                             <button onClick={(e) => handleDelete(item._id, e)} disabled={item.role === 'admin'} className="p-2 text-red-500 bg-red-500/5 hover:bg-red-500/10 rounded-lg disabled:opacity-10"><Trash2 size={14}/></button>
                           </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                              <span className="font-bold text-blue-500 truncate max-w-[300px]">{item.url}</span>
                              <span className="text-[10px] opacity-40 uppercase font-black">{item.device} Audit</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                              <span className="font-medium">{item.userId?.email || 'Anonymous'}</span>
                              <span className="text-[10px] text-rose-500 font-bold uppercase">{item.country || 'Unknown'}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                           <div className={`inline-flex w-10 h-10 rounded-full items-center justify-center font-black text-sm border-2 ${
                              item.status === 'pending' ? 'border-amber-500/20 text-amber-500 animate-pulse' :
                              item.score >= 80 ? 'border-emerald-500/20 text-emerald-500' :
                              item.score >= 50 ? 'border-amber-500/20 text-amber-500' : 'border-red-500/20 text-red-500'
                           }`}>
                              {item.status === 'pending' ? '...' : (item.score !== null ? item.score : '-')}
                           </div>
                        </td>
                        <td className="px-8 py-5 text-right text-sm opacity-50 font-mono">{formatTimestamp(item.createdAt)}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        <AnimatePresence>
          {selectedUser && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }}
                onClick={() => setSelectedUser(null)}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className={`relative w-full max-w-4xl max-h-[80vh] overflow-y-auto rounded-3xl shadow-2xl border ${darkMode ? 'bg-[#11111a] border-white/10' : 'bg-white border-slate-200'}`}
              >
                <div className="p-8 space-y-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                        {selectedUser.name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-3xl font-black">{selectedUser.name}</h3>
                        <p className="text-gray-500 font-bold">{selectedUser.email}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedUser(null)} className="p-2 hover:bg-white/5 rounded-full"><Trash2 className="rotate-45" /></button>
                  </div>

                  {userDetailLoading ? (
                    <div className="py-12 text-center animate-pulse">Fetching user profile and history...</div>
                  ) : userDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Projects/Websites */}
                      <div className="space-y-4">
                        <h4 className="font-black uppercase text-xs tracking-widest text-blue-500">Connected Projects</h4>
                        <div className="space-y-2">
                          {selectedUser.websites?.length > 0 ? selectedUser.websites.map((w, i) => (
                            <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                              <p className="font-bold truncate">{w.url}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${w.verified ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                  {w.verified ? 'Verified' : 'Unverified'}
                                </span>
                              </div>
                            </div>
                          )) : <p className="text-sm opacity-40">No projects added yet.</p>}
                        </div>
                      </div>

                      {/* Recent Scans */}
                      <div className="space-y-4">
                        <h4 className="font-black uppercase text-xs tracking-widest text-emerald-500">Recent Audit History</h4>
                        <div className="space-y-2">
                          {userDetails.auditHistory?.length > 0 ? userDetails.auditHistory.map((h, i) => (
                            <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                              <p className="font-bold truncate text-sm">{h.url}</p>
                              <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] opacity-50">{formatTimestamp(h.createdAt)}</span>
                                <span className={`font-black text-xs ${
                                  h.status === 'pending' ? 'text-amber-500 animate-pulse' : 
                                  h.status === 'failed' ? 'text-rose-500' : 'text-blue-500'
                                }`}>
                                  {h.status === 'pending' ? 'In Progress' : (h.status === 'success' ? `${h.score}%` : 'Fail')}
                                </span>
                              </div>
                            </div>
                          )) : <p className="text-sm opacity-40">No scans recorded.</p>}
                        </div>
                      </div>
                      
                      {/* Downloads */}
                      <div className="col-span-1 md:col-span-2 space-y-4">
                        <h4 className="font-black uppercase text-xs tracking-widest text-amber-500">Report Download History</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {userDetails.downloadHistory?.length > 0 ? userDetails.downloadHistory.map((d, i) => (
                            <div key={i} className={`p-4 rounded-2xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'} flex items-center gap-4`}>
                              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                                <Download size={18} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold truncate text-blue-500">{d.metadata?.url || 'Direct Export'}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-slate-500/10 opacity-60">
                                    {d.metadata?.reportType || 'Standard'} PDF
                                  </span>
                                  <span className="text-[10px] opacity-40">•</span>
                                  <span className="text-[10px] opacity-40 font-mono">{formatTimestamp(d.timestamp)}</span>
                                </div>
                              </div>
                            </div>
                          )) : <p className="text-sm opacity-40 px-4">No downloads recorded for this user.</p>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Internal icon helpers for cleaner code
const CheckCircle = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
  </svg>
);

const XCircle = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export default AdminDashboard;
