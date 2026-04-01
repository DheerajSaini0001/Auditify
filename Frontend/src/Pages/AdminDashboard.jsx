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
  Bot
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const [stats, setStats] = useState({ totalUsers: 0, totalAudits: 0, activeToday: 0, blockedUsers: 0, uniqueIpsCount: 0, suspiciousCount: 0 });
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [statusFilter]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  useEffect(() => {
    fetchUsers();
  }, [page]);

  const fetchStats = async () => {
    try {
      const response = await api.get('/api/admin/stats');
      setStats(response.data);
    } catch (err) {
      console.error('Stats Error:', err);
      toast.error('Admin Panel: Session Expired');
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get(`/api/admin/users?page=${page}&search=${search}`);
      const data = response.data;
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
    } catch (err) {
      console.error('Users Error:', err);
      toast.error('Failed to access User Management');
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/admin/audit-logs?status=${statusFilter}`);
      const data = response.data;
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Logs Error:', err);
      toast.error('Unauthorized: Audit Log access failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBlock = async (userId, reason = 'Administrative block') => {
    if (!window.confirm('Are you sure you want to block this user?')) return;
    try {
      await api.post('/api/admin/users/block', { userId, reason });
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to block user');
    }
  };

  const handleUnblock = async (userId) => {
    try {
      await api.post('/api/admin/users/unblock', { userId });
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to unblock user');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('PERMANENT DELETE! Are you sure? This cannot be undone.')) return;
    try {
      await api.delete(`/api/admin/users/${userId}`);
      fetchUsers();
      fetchStats();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete user');
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

  const handleRefresh = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchUsers(), fetchLogs()]);
    setLoading(false);
    toast.success('Dashboard Updated');
  };

  return (
    <div className={`min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${darkMode ? 'bg-[#0a0a10] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-[1400px] mx-auto space-y-12">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className={`text-4xl font-extrabold tracking-tight flex items-center gap-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              <ShieldAlert className="text-blue-500" size={36} />
              Admin Dashboard
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>Monitor audit activity and track user sessions.</p>
          </motion.div>

          <div className="flex items-center gap-4">
             <button
              onClick={handleRefresh}
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-xl
                ${darkMode ? 'bg-white/5 border border-white/10 hover:bg-white/10' : 'bg-white border border-slate-100 hover:bg-slate-50'}
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Activity className={`w-4 h-4 text-blue-500 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Syncing...' : 'Sync Data'}</span>
            </button>

            <div className={`flex gap-2 p-1 rounded-2xl border shadow-xl transition-colors ${darkMode ? 'bg-[#16161e] border-white/5' : 'bg-white border-slate-200'}`}>
              {['users', 'logs'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === tab 
                      ? 'bg-blue-600 text-white shadow-lg' 
                      : `${darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`
                  }`}
                >
                  {tab === 'users' ? 'User Accounts' : 'Audit Logs'}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Dynamic Context-Aware KPIs */}
        <AnimatePresence mode="wait">
          {activeTab === 'users' ? (
            <motion.div 
              key="user-kpis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-600/20 text-blue-500" delay={0.1} />
              <StatCard icon={Activity} label="Active Today" value={stats.activeToday} color="bg-emerald-600/20 text-emerald-500" delay={0.2} />
              <StatCard icon={Lock} label="Suspended" value={stats.blockedUsers} color="bg-amber-600/20 text-amber-500" delay={0.3} />
              <StatCard icon={ShieldAlert} label="Verified" value={users.filter(u => u.isEmailVerified).length} color="bg-indigo-600/20 text-indigo-500" delay={0.4} />
            </motion.div>
          ) : (
            <motion.div 
              key="audit-kpis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <StatCard icon={Activity} label="Total Audits" value={stats.totalAudits} color="bg-blue-600/20 text-blue-500" delay={0.1} />
              <StatCard icon={Users} label="Unique IPs" value={stats.uniqueIpsCount} color="bg-indigo-600/20 text-indigo-500" delay={0.2} />
              <StatCard icon={ShieldAlert} label="Suspicious IPs" value={stats.suspiciousCount} color="bg-red-600/20 text-red-500" delay={0.3} />
              <StatCard icon={Activity} label="Avg Duration" value={logs.length > 0 ? (logs.reduce((acc, l) => acc + (l.auditDuration || 0), 0) / logs.length / 1000).toFixed(1) + 's' : '0s'} color="bg-emerald-600/20 text-emerald-500" delay={0.4} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {activeTab === 'users' ? (
            <motion.div
              key="users-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className={`flex items-center gap-4 backdrop-blur-xl border rounded-2xl p-4 shadow-lg transition-colors ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-white border-slate-200'}`}>
                <div className="relative flex-1">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`} size={18} />
                  <input 
                    type="text"
                    placeholder="Search users..."
                    className={`w-full pl-12 pr-4 py-3 border border-transparent rounded-xl focus:border-blue-500/50 focus:outline-none transition-all ${
                      darkMode ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-slate-100 text-slate-900 placeholder:text-slate-400'
                    }`}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className={`backdrop-blur-xl border rounded-3xl overflow-hidden shadow-2xl overflow-x-auto transition-colors ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-white border-slate-200'}`}>
                <table className="w-full text-left">
                  <thead>
                    <tr className={`border-b text-[10px] uppercase tracking-widest font-bold ${darkMode ? 'border-white/5 text-gray-500' : 'border-slate-100 text-slate-500'}`}>
                      <th className="px-8 py-6">User Account</th>
                      <th className="px-8 py-6 text-center">Auth</th>
                      <th className="px-8 py-6 text-center">Verified</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6">Joined</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                    {users.map((u) => (
                      <tr key={u._id} className={`transition-colors group ${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                              u.role === 'admin' 
                                ? 'bg-blue-600/20 text-blue-500 shadow-inner' 
                                : darkMode ? 'bg-gray-700/20 text-gray-400' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {u.avatar ? (
                                <img src={u.avatar} alt="" className="w-10 h-10 rounded-full" />
                              ) : (
                                u.name.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div>
                               <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{u.name}</p>
                               <p className={`text-sm whitespace-nowrap ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                            u.authProvider === 'google' ? 'bg-blue-500/10 text-blue-500' : 'bg-slate-500/10 text-gray-400'
                          }`}>
                            {u.authProvider}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-center">
                          {u.isEmailVerified ? (
                            <div className="flex justify-center"><CheckCircle size={16} className="text-emerald-500" /></div>
                          ) : (
                            <div className="flex justify-center"><XCircle size={16} className="text-red-500" /></div>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center w-fit gap-1.5 ${
                            u.isBlocked ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${u.isBlocked ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`}></div>
                            {u.isBlocked ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td className={`px-8 py-5 text-[11px] whitespace-nowrap ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                          {formatTimestamp(u.createdAt)}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.isBlocked ? (
                              <button onClick={() => handleUnblock(u._id)} className="p-2 bg-emerald-600/10 text-emerald-500 rounded-lg hover:bg-emerald-600/20 transition-all shadow-sm">
                                <Unlock size={14} />
                              </button>
                            ) : (
                              <button onClick={() => handleBlock(u._id)} disabled={u.role === 'admin'} className="p-2 bg-amber-600/10 text-amber-500 rounded-lg hover:bg-amber-600/20 disabled:opacity-20 transition-all shadow-sm">
                                <Lock size={14} />
                              </button>
                            )}
                            <button onClick={() => handleDelete(u._id)} disabled={u.role === 'admin'} className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600/20 disabled:opacity-20 transition-all shadow-sm">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="logs-tab"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xl border rounded-2xl p-4 shadow-lg transition-colors ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-black uppercase tracking-widest mr-4 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Audit Result:</span>
                  {[
                    { id: '', label: 'All Activities' },
                    { id: 'success', label: 'Success Only' },
                    { id: 'failed', label: 'Failed Only' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setStatusFilter(f.id)}
                      className={`px-4 py-1.5 rounded-full text-[10px] font-bold transition-all border ${
                        statusFilter === f.id 
                        ? 'bg-blue-600 border-blue-500 text-white shadow-lg' 
                        : `${darkMode ? 'bg-white/5 border-white/10 text-gray-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-900'}`
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                  {statusFilter && (
                    <button 
                      onClick={() => setStatusFilter('')}
                      className="ml-4 p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>

              <div className={`backdrop-blur-xl border rounded-3xl overflow-hidden shadow-2xl transition-colors ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-white border-slate-200'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                  <thead>
                    <tr className={`border-b text-[10px] uppercase tracking-widest font-bold ${darkMode ? 'border-white/5 text-gray-500' : 'border-slate-100 text-slate-500'}`}>
                      <th className="px-6 py-5">Target URL</th>
                      <th className="px-6 py-5">Identity (IP / Geo)</th>
                      <th className="px-6 py-5">Auditor</th>
                      <th className="px-6 py-5">Tech Profile</th>
                      <th className="px-6 py-5 text-center">Score</th>
                      <th className="px-6 py-5 text-center">Result</th>
                      <th className="px-6 py-5">Timeline</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-xs ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                    {loading ? (
                       <tr><td colSpan="7" className={`px-6 py-10 text-center animate-pulse ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Loading logs...</td></tr>
                    ) : logs.length === 0 ? (
                       <tr><td colSpan="7" className={`px-6 py-16 text-center italic ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>No activity logs found.</td></tr>
                    ) : logs.map((log) => (
                      <tr key={log._id} className={`transition-colors whitespace-nowrap group ${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                        {/* URL */}
                        <td className="px-6 py-4 max-w-[180px] truncate">
                          <span className="font-bold text-blue-500 hover:underline cursor-pointer">
                            {log.url.split('://')[1] || log.url}
                          </span>
                        </td>

                        {/* Identity: IP & Geo */}
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-1">
                             <span className={`font-mono font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-800'}`}>{log.ip}</span>
                             <div className="flex items-center gap-1.5">
                               <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{log.region || 'Geo Blocked'},</span>
                               <span className={`text-[10px] font-black uppercase text-rose-500`}>{log.country}</span>
                             </div>
                           </div>
                        </td>

                        {/* Auditor: Account */}
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                             <span className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                               {log.userId?.name || 'Guest'}
                             </span>
                             <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                               {log.userId?.email || 'not-logged-in'}
                             </span>
                           </div>
                        </td>

                        {/* Tech Profile: Device/OS/Bot */}
                        <td className="px-6 py-4">
                           <div className="flex flex-col gap-1">
                             <div className="flex items-center gap-2">
                               <span className={`px-1.5 py-0.5 rounded bg-slate-500/10 text-[9px] font-black uppercase ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
                                 {log.device}
                               </span>
                               <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{log.os}</span>
                             </div>
                             <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 w-fit">
                               {log.captchaPassed ? <CheckCircle size={10} className="text-emerald-500" /> : <XCircle size={10} className="text-rose-500" />}
                               <span className={`text-[9px] font-bold ${log.captchaPassed ? 'text-emerald-500' : 'text-rose-500'}`}>
                                 {log.captchaPassed ? 'Verified Human' : 'Bot Flagged'}
                               </span>
                             </div>
                           </div>
                        </td>

                        {/* Performance Score */}
                        <td className="px-6 py-4 text-center">
                          <div className={`text-sm font-black mx-auto w-10 h-10 rounded-full flex items-center justify-center border-2 
                            ${log.score > 80 ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' : 
                              log.score > 50 ? 'border-amber-500/20 text-amber-500 bg-amber-500/5' : 
                              'border-rose-500/20 text-rose-500 bg-rose-500/5'}`}>
                            {log.score !== null ? `${log.score}` : '-'}
                          </div>
                        </td>

                        {/* Result/Status */}
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                            log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            log.status === 'failed' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                          }`}>
                            {log.status}
                          </span>
                        </td>

                        {/* Timeline */}
                        <td className="px-6 py-4">
                           <div className="flex flex-col">
                             <span className={`font-bold ${darkMode ? 'text-gray-400' : 'text-slate-700'}`}>
                               {formatTimestamp(log.createdAt)}
                             </span>
                             <span className={`text-[10px] italic ${darkMode ? 'text-gray-600' : 'text-slate-400'}`}>
                               Took {log.auditDuration ? `${(log.auditDuration / 1000).toFixed(1)}s` : 'N/A'}
                             </span>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
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
