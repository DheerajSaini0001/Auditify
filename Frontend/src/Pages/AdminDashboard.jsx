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

const AdminDashboard = () => {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const [stats, setStats] = useState({ totalUsers: 0, totalAudits: 0, activeToday: 0, blockedUsers: 0, uniqueIpsCount: 0, suspiciousCount: 0 });
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    fetchStats();
    fetchUsers();
    fetchLogs();
  }, []);

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
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get(`/api/admin/users?page=${page}&search=${search}`);
      setUsers(response.data.users);
      setTotalUsers(response.data.total);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/admin/audit-logs');
      setLogs(response.data.logs);
    } catch (err) {
      console.error('Failed to fetch logs:', err);
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
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Activity} label="Total Audits" value={stats.totalAudits} color="bg-blue-600/20 text-blue-500" delay={0.1} />
          <StatCard icon={Users} label="Unique IPs" value={stats.uniqueIpsCount} color="bg-emerald-600/20 text-emerald-500" delay={0.2} />
          <StatCard icon={ShieldAlert} label="Suspicious IPs" value={stats.suspiciousCount} color="bg-red-600/20 text-red-500" delay={0.3} />
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-indigo-600/20 text-indigo-500" delay={0.4} />
        </div>

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
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6">Last Login</th>
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
                                ? 'bg-blue-600/20 text-blue-500' 
                                : darkMode ? 'bg-gray-700/20 text-gray-400' : 'bg-slate-200 text-slate-500'
                            }`}>
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{u.name}</p>
                              <p className={`text-sm whitespace-nowrap ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center w-fit gap-1.5 ${
                            u.isBlocked ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'
                          }`}>
                            {u.isBlocked ? 'Suspended' : 'Active'}
                          </span>
                        </td>
                        <td className={`px-8 py-5 text-sm whitespace-nowrap ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>
                          {u.lastLogin ? formatTimestamp(u.lastLogin) : 'Never'}
                        </td>
                        <td className="px-8 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {u.isBlocked ? (
                              <button onClick={() => handleUnblock(u._id)} className="p-2 bg-emerald-600/10 text-emerald-500 rounded-lg hover:bg-emerald-600/20 transition-all">
                                <Unlock size={16} />
                              </button>
                            ) : (
                              <button onClick={() => handleBlock(u._id)} disabled={u.role === 'admin'} className="p-2 bg-amber-600/10 text-amber-500 rounded-lg hover:bg-amber-600/20 disabled:opacity-20 transition-all">
                                <Lock size={16} />
                              </button>
                            )}
                            <button onClick={() => handleDelete(u._id)} disabled={u.role === 'admin'} className="p-2 bg-red-600/10 text-red-500 rounded-lg hover:bg-red-600/20 disabled:opacity-20 transition-all">
                              <Trash2 size={16} />
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
              className={`backdrop-blur-xl border rounded-3xl overflow-hidden shadow-2xl transition-colors ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-white border-slate-200'}`}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className={`border-b text-[10px] uppercase tracking-widest font-bold ${darkMode ? 'border-white/5 text-gray-500' : 'border-slate-100 text-slate-500'}`}>
                      <th className="px-6 py-5">URL</th>
                      <th className="px-6 py-5">Visitor</th>
                      <th className="px-6 py-5">Browser</th>
                      <th className="px-6 py-5">OS</th>
                      <th className="px-6 py-5">Device</th>
                      <th className="px-6 py-5">Resolution</th>
                      <th className="px-6 py-5">Bot Check</th>
                      <th className="px-6 py-5">Score</th>
                      <th className="px-6 py-5">Duration</th>
                      <th className="px-6 py-5">Status</th>
                      <th className="px-6 py-5">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-xs ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                    {loading ? (
                       <tr><td colSpan="11" className={`px-6 py-10 text-center animate-pulse ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Loading logs...</td></tr>
                    ) : logs.length === 0 ? (
                      <tr><td colSpan="11" className={`px-6 py-16 text-center italic ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>No logs found matching your filters.</td></tr>
                    ) : logs.map((log) => (
                      <tr key={log._id} className={`transition-colors whitespace-nowrap group ${darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                        <td className="px-6 py-4 max-w-[150px] truncate">
                          <span className="font-bold text-blue-500 group-hover:text-blue-400 transition-colors">
                            {log.url}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{log.ip}</span>
                            <span className={`text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>{log.userId?.email || 'Guest'}</span>
                          </div>
                        </td>
                        <td className={`px-6 py-4 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{log.browser}</td>
                        <td className={`px-6 py-4 ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>{log.os}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${log.device === 'Mobile' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'}`}>
                            {log.device}
                          </span>
                        </td>
                        <td className={`px-6 py-4 ${darkMode ? 'text-gray-400' : 'text-slate-600'}`}>{log.screenResolution}</td>
                        <td className="px-6 py-4">
                           <div className="flex items-center gap-1.5">
                            {log.captchaPassed ? (
                              <CheckCircle size={12} className="text-emerald-500" />
                            ) : (
                              <XCircle size={12} className="text-red-500" />
                            )}
                            <span className={log.captchaPassed ? 'text-emerald-500' : 'text-red-500'}>
                              {log.captchaPassed ? 'Passed' : 'Failed'}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-black ${log.score > 80 ? 'text-emerald-500' : log.score > 50 ? 'text-amber-500' : 'text-rose-500'}`}>
                            {log.score !== null ? `${log.score}%` : '-'}
                          </span>
                        </td>
                        <td className={`px-6 py-4 ${darkMode ? 'text-gray-500' : 'text-slate-500'}`}>
                           {log.auditDuration ? `${(log.auditDuration / 1000).toFixed(1)}s` : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter ${
                            log.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                            log.status === 'failed' ? 'bg-red-500/10 text-red-500' : 'bg-amber-500/10 text-amber-500'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className={`px-6 py-4 text-[10px] ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                          {formatTimestamp(log.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
