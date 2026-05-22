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
  ShieldCheck,
  Zap,
  LayoutDashboard,
  ExternalLink,
  Bot,
  Download,
  Settings,
  Bell,
  ChevronRight,
  MoreVertical,
  Globe,
  Plus,
  RefreshCw,
  Clock,
  LogOut,
  UserPlus,
  BarChart3,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
  Sun,
  Moon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line,
  Cell,
  AreaChart,
  Area
} from 'recharts';

// --- Helper Components ---

const CircularProgress = ({ score, label, color, darkMode }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="transparent"
            stroke={darkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
            strokeWidth="8"
          />
          <motion.circle
            cx="48"
            cy="48"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        <span className={`absolute text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{score}</span>
      </div>
      <span className={`text-[10px] font-bold uppercase text-center max-w-[80px] leading-tight ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{label}</span>
    </div>
  );
};

const MiniStat = ({ label, value, trend, trendValue, icon: Icon, color, darkMode }) => (
  <div className={`border rounded-2xl p-5 flex flex-col justify-between transition-all ${
    darkMode 
      ? 'bg-[#111111] border-white/5 shadow-xl' 
      : 'bg-white border-slate-200 shadow-sm'
  }`}>
    <div className="flex justify-between items-start">
      <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{label}</p>
      {Icon && <Icon size={16} className={darkMode ? 'text-gray-600' : 'text-slate-300'} />}
    </div>
    <div className="mt-2">
      <h3 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{value}</h3>
      <div className={`flex items-center gap-1 mt-1 text-[10px] font-bold ${trend === 'up' ? 'text-emerald-500' : 'text-rose-500'}`}>
        {trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        <span>{trendValue}</span>
      </div>
    </div>
  </div>
);


const AdminDashboard = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const [stats, setStats] = useState({ totalUsers: 0, totalAudits: 0, totalDownloads: 0, totalProjects: 0, activeToday: 0, avgScore: 0 });
  const [overviewData, setOverviewData] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'users', 'logs', 'settings'
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
    fetchOverviewStats();
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedUser) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.documentElement.style.overflow = 'unset';
    };
  }, [selectedUser]);

  useEffect(() => {
    if (activeTab === 'users') {
        const delayDebounceFn = setTimeout(() => {
            fetchUsers();
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    } else if (activeTab === 'logs') {
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

  const fetchOverviewStats = async () => {
    setOverviewLoading(true);
    try {
      const response = await api.get('/api/admin/overview-stats');
      setOverviewData(response.data);
    } catch (err) {
      console.error('Overview Stats Error:', err);
      toast.error('Failed to load dashboard overview');
    } finally {
      setOverviewLoading(false);
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

  const SidebarItem = ({ icon: Icon, label, id, active }) => (
    <button
      onClick={() => { setActiveTab(id); setPage(1); setSearch(''); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
        active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
          : `${darkMode ? 'text-gray-400 hover:bg-white/5 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`
      }`}
    >
      <Icon size={18} />
      <span>{label}</span>
      {active && (
        <motion.div layoutId="active-pill" className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
      )}
    </button>
  );

  const StatCard = ({ icon: Icon, label, value, color, trend, delay }) => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative overflow-hidden border rounded-3xl p-6 shadow-xl transition-all ${darkMode ? 'bg-[#16161e]/80 border-white/5 hover:border-white/10' : 'bg-white border-slate-200 hover:border-blue-200'}`}
    >
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10`}>
          <Icon className={color.replace('bg-', 'text-').replace('/10', '')} size={20} />
        </div>
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className={`text-[10px] font-bold uppercase tracking-wider ${darkMode ? "text-gray-400" : "text-slate-500"}`}>{label}</p>
        <p className={`text-3xl font-black mt-1 ${darkMode ? "text-white" : "text-slate-900"}`}>{value}</p>
      </div>
      {/* Decorative gradient */}
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 blur-3xl opacity-10 rounded-full ${color.replace('bg-', 'bg-')}`} />
    </motion.div>
  );

  const volumeData = overviewData?.volumeData || [];
  const distributionData = overviewData?.distribution || { good: 0, average: 0, poor: 0 };
  const deviceSplitData = overviewData?.deviceSplit || [];
  const recentAudits = overviewData?.recentAudits || [];
  const recentActivity = overviewData?.recentActivity || [];
  const activeUsersData = overviewData?.activeUsers || [];
  const countrySplitData = overviewData?.countrySplit || [];

  const scoreTrendData = overviewData?.scoreTrend || [];

  const failingMetrics = [
    { name: 'LCP > 4s', count: 847, color: 'text-rose-500' },
    { name: 'Missing H1', count: 612, color: 'text-orange-500' },
    { name: 'No Schema.org', count: 534, color: 'text-amber-500' },
    { name: 'No CSP header', count: 489, color: 'text-yellow-500' },
    { name: 'Alt tags missing', count: 411, color: 'text-blue-500' },
  ];

  const criticalIssues = [
    { id: 1, title: 'Missing SSL certificate on 3 sites', category: 'Security', level: 'critical' },
    { id: 2, title: 'LCP > 4s on 847 audited pages', category: 'Performance', level: 'critical' },
    { id: 3, title: 'Duplicate meta descriptions on 212 URLs', category: 'On-page SEO', level: 'warning' },
    { id: 4, title: 'No structured data / Schema.org on 534 sites', category: 'AIO Readiness', level: 'warning' },
    { id: 5, title: 'WCAG contrast failures (axe-core) on 178 sites', category: 'Accessibility', level: 'info' },
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#050505] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-[1600px] mx-auto p-4 sm:p-6 lg:p-8 space-y-8">

        
        {/* Header Area */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight">Admin Dashboard</h1>
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold rounded-full flex items-center gap-1.5 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Tab Switcher */}
            <div className="bg-white/5 p-1 rounded-xl flex items-center gap-1">
              {[
                { id: 'overview', label: 'Overview', icon: LayoutDashboard },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'logs', label: 'Audits', icon: Globe },
                { id: 'settings', label: 'Config', icon: Settings },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setPage(1); }}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' 
                      : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <tab.icon size={12} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 border-l border-white/10 pl-4 ml-2">
              <button 
                onClick={toggleTheme}
                className={`p-2 rounded-xl transition-all ${
                  darkMode ? 'bg-white/5 text-amber-400 hover:bg-white/10' : 'bg-slate-100 text-blue-600 hover:bg-slate-200'
                }`}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button className={`px-4 py-2 border rounded-lg text-[10px] font-bold transition-all flex items-center gap-2 ${
                darkMode ? 'bg-transparent border-white/10 hover:bg-white/5 text-white' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}>
                Export Report <ArrowUpRight size={14} />
              </button>
            
            </div>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                <MiniStat 
                  label="Total Audits" 
                  value={overviewLoading ? "..." : (overviewData?.stats?.totalAudits || 0).toLocaleString()} 
                  trend="up" 
                  trendValue="Live Data" 
                  darkMode={darkMode} 
                />
                <MiniStat 
                  label="Total Downloads" 
                  value={overviewLoading ? "..." : (overviewData?.stats?.totalDownloads || 0).toLocaleString()} 
                  trend="up" 
                  trendValue="Reports saved" 
                  icon={Download}
                  darkMode={darkMode} 
                />
                <MiniStat 
                  label="Active Users" 
                  value={overviewLoading ? "..." : (overviewData?.stats?.totalUsers || 0).toLocaleString()} 
                  trend="up" 
                  trendValue="Registered" 
                  darkMode={darkMode} 
                />
                <MiniStat 
                  label="Guest Sessions" 
                  value={overviewLoading ? "..." : (overviewData?.stats?.totalGuests || 0).toLocaleString()} 
                  trend="up" 
                  trendValue="Unregistered users" 
                  icon={Bot}
                  darkMode={darkMode} 
                />
                <MiniStat 
                  label="Active Today" 
                  value={overviewLoading ? "..." : (overviewData?.stats?.activeToday || 0).toLocaleString()} 
                  trend="up" 
                  trendValue="Active users" 
                  darkMode={darkMode} 
                />
                <MiniStat 
                  label="Avg Audit Time" 
                  value={overviewLoading ? "..." : `${overviewData?.stats?.avgDuration || 0}s`} 
                  trend="down" 
                  trendValue="Processing speed" 
                  icon={Clock}
                  darkMode={darkMode} 
                />
                <MiniStat 
                  label="Failed Audits" 
                  value={overviewLoading ? "..." : `${overviewData?.stats?.failedRate || 0}%`} 
                  trend="up" 
                  trendValue="Failure rate" 
                  icon={ShieldAlert}
                  darkMode={darkMode} 
                />
                <MiniStat 
                  label="Audits Today" 
                  value={overviewLoading ? "..." : (overviewData?.stats?.auditsToday || 0).toLocaleString()} 
                  trend="up" 
                  trendValue="Today's activity" 
                  icon={Activity}
                  darkMode={darkMode} 
                />
               
      
              </div>

             

              {/* Charts Row */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className={`xl:col-span-2 border rounded-2xl p-6 ${darkMode ? 'bg-[#111111] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Audit Volume — Last 14 Days</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={volumeData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#666' }} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#111', border: '1px solid #333', fontSize: '10px' }}
                          itemStyle={{ fontSize: '10px' }}
                        />
                        <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className={`border rounded-2xl p-6 ${darkMode ? 'bg-[#111111] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Score Distribution</h3>
                  {/* Distribution Placeholder */}
                  <div className="space-y-4">
                    {[
                      { label: 'Good (80+)', count: distributionData.good, color: 'bg-emerald-500' },
                      { label: 'Needs Improvement', count: distributionData.average, color: 'bg-amber-500' },
                      { label: 'Poor (< 50)', count: distributionData.poor, color: 'bg-rose-500' },
                      { label: 'Failed Audits', count: distributionData.failed || 0, color: 'bg-red-600' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-2">
                           <div className={`w-2 h-2 rounded-full ${item.color}`} />
                           <span className="text-xs text-gray-400">{item.label}</span>
                         </div>
                         <span className="text-xs font-bold">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Metrics & Trends Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                <div className={`border rounded-2xl p-6 ${darkMode ? 'bg-[#111111] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Device Split</h3>
                  <div className="mt-8 space-y-6">
                    <div className={`h-2 w-full rounded-full overflow-hidden flex ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                       {deviceSplitData.map((d, idx) => {
                         const total = deviceSplitData.reduce((acc, curr) => acc + curr.count, 0);
                         const percentage = total > 0 ? (d.count / total) * 100 : 0;
                         const colors = ['bg-emerald-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500'];
                         return (
                           <div key={idx} className={`h-full ${colors[idx % colors.length]}`} style={{ width: `${percentage}%` }} />
                         );
                       })}
                    </div>
                    <div className="flex flex-wrap gap-4 justify-between">
                      {deviceSplitData.map((d, idx) => {
                         const total = deviceSplitData.reduce((acc, curr) => acc + curr.count, 0);
                         const percentage = total > 0 ? Math.round((d.count / total) * 100) : 0;
                         const colors = ['bg-emerald-500', 'bg-orange-500', 'bg-blue-500', 'bg-purple-500'];
                         return (
                           <div key={idx} className="flex items-center gap-2">
                             <div className={`w-2 h-2 rounded-full ${colors[idx % colors.length]}`} />
                             <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{percentage}% {d.name}</span>
                           </div>
                         );
                      })}
                    </div>
                  </div>
                </div>
                <div className={`border rounded-2xl p-6 ${darkMode ? 'bg-[#111111] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Top Audited Locations</h3>
                  <div className="space-y-4 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                    {countrySplitData.length === 0 ? (
                      <div className="text-center py-8 text-[10px] text-gray-500">No location data available.</div>
                    ) : countrySplitData.map((c, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold ${darkMode ? 'text-white' : 'text-slate-700'}`}>{c.name}</span>
                          <span className={`text-[10px] font-bold ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>{c.count}</span>
                        </div>
                        <div className={`h-1.5 w-full rounded-full ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                          <div 
                            className="h-full bg-blue-500 rounded-full" 
                            style={{ 
                              width: `${(c.count / Math.max(...countrySplitData.map(x => x.count))) * 100}%` 
                            }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>


                <div className={`border rounded-2xl p-6 ${darkMode ? 'bg-[#111111] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Score Trend (AVG)</h3>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={scoreTrendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? "#222" : "#f1f5f9"} vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: darkMode ? '#666' : '#94a3b8' }} />
                        <YAxis yAxisId="left" hide />
                        <YAxis yAxisId="right" hide />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: darkMode ? '#111' : '#fff', 
                            border: `1px solid ${darkMode ? '#333' : '#e2e8f0'}`, 
                            fontSize: '10px',
                            color: darkMode ? '#fff' : '#1e293b'
                          }}
                        />
                        <Line yAxisId="left" type="monotone" dataKey="score" name="Avg Score" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6' }} />
                        <Line yAxisId="right" type="monotone" dataKey="count" name="Audits Run" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Lists Row */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className={`border rounded-2xl p-6 ${darkMode ? 'bg-[#111111] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Recent Audits</h3>
                  <div className="space-y-4">
                    {recentAudits.length === 0 ? (
                      <div className="text-center py-8 text-xs text-gray-500">No audits recorded yet.</div>
                    ) : recentAudits.map((audit) => (
                      <div key={audit._id} className={`flex items-center justify-between p-3 rounded-xl transition-all ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold ${
                            audit.score >= 80 ? 'bg-emerald-500/10 text-emerald-500' : audit.score >= 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                          }`}>
                            {audit.score || 'N/A'}
                          </div>
                          <div className="flex flex-col">
                            <span className={`text-xs font-bold truncate max-w-[200px] ${darkMode ? 'text-white' : 'text-slate-700'}`}>{audit.url}</span>
                            <span className="text-[9px] text-gray-500 uppercase">{audit.device} Audit</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-500">{new Date(audit.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`border rounded-2xl p-6 ${darkMode ? 'bg-[#111111] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-6 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Critical Issues Detected</h3>
                  <div className="space-y-4">
                    {recentActivity.length === 0 ? (
                      <div className="text-center py-8 text-xs text-gray-500">No recent activity detected.</div>
                    ) : recentActivity.map((activity) => (
                      <div key={activity._id} className={`flex items-start gap-4 p-3 rounded-xl transition-all ${darkMode ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                          activity.action.includes('FAIL') || activity.action === 'BLOCKED' ? 'bg-rose-500' : 
                          activity.action.includes('WARN') ? 'bg-amber-500' : 'bg-blue-500'
                        }`} />
                        <div>
                          <p className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-700'}`}>
                            {activity.userId?.name || 'Guest'} {activity.action.toLowerCase().replace('_', ' ')}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {activity.ip} • {new Date(activity.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active Users Table */}
              <div className={`border rounded-2xl overflow-hidden ${darkMode ? 'bg-[#111111] border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                 <div className={`p-6 border-b ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                   <h3 className={`text-[10px] font-bold uppercase tracking-widest ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>Active Users</h3>
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-left">
                     <thead>
                       <tr className={`text-[10px] uppercase tracking-wider border-b ${darkMode ? 'text-gray-500 border-white/5' : 'text-slate-400 border-slate-100'}`}>
                         <th className="px-6 py-4 font-bold">User</th>
                         <th className="px-6 py-4 font-bold">Audits Run</th>
                         <th className="px-6 py-4 font-bold">Avg Score</th>
                         <th className="px-6 py-4 font-bold">Last Active</th>
                         <th className="px-6 py-4 font-bold">Plan</th>
                       </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                         {activeUsersData.length === 0 ? (
                           <tr>
                             <td colSpan="5" className="px-6 py-12 text-center text-xs text-gray-500">No active users recorded.</td>
                           </tr>
                         ) : activeUsersData.map((user, i) => (
                           <tr key={user._id} className={`transition-all cursor-pointer ${darkMode ? 'hover:bg-white/5 border-white/5' : 'hover:bg-slate-50 border-slate-100'}`}>
                             <td className="px-6 py-4">
                               <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                   {user.name.split(' ').map(n => n[0]).join('')}
                                 </div>
                                 <div className="flex flex-col">
                                   <span className={`text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-700'}`}>{user.name}</span>
                                   <span className="text-[9px] text-gray-500">{user.email}</span>
                                 </div>
                               </div>
                             </td>
                             <td className={`px-6 py-4 text-xs font-bold ${darkMode ? 'text-white' : 'text-slate-700'}`}>{user.auditsRun}</td>
                             <td className={`px-6 py-4 text-xs font-bold ${
                               user.avgScore >= 80 ? 'text-emerald-500' : user.avgScore >= 50 ? 'text-amber-500' : 'text-rose-500'
                             }`}>{user.avgScore}%</td>
                             <td className="px-6 py-4 text-xs text-gray-500">
                               {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                             </td>
                             <td className="px-6 py-4">
                               <span className={`px-2 py-1 rounded text-[9px] font-bold ${user.role === 'admin' ? 'bg-purple-500/10 text-purple-500' : 'bg-blue-500/10 text-blue-500'}`}>
                                 {user.role === 'admin' ? 'Admin' : 'Pro'}
                               </span>
                             </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                 </div>
              </div>
            </motion.div>
          )}

          {(activeTab === 'users' || activeTab === 'logs') && (
            <motion.div 
              key="data-table"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Existing Controls Area */}
              <div className={`flex flex-col md:flex-row md:items-center gap-4 backdrop-blur-xl border rounded-[1.5rem] p-4 shadow-lg transition-colors ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-white border-slate-200'}`}>
                  <div className="relative flex-1">
                      <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`} size={18} />
                      <input 
                        type="text"
                        placeholder={activeTab === 'users' ? "Search users by name, email..." : "Search audits by website URL..."}
                        className={`w-full pl-12 pr-4 py-3 border border-transparent rounded-xl focus:border-blue-500/50 focus:outline-none transition-all ${
                          darkMode ? 'bg-white/5 text-white placeholder:text-gray-600' : 'bg-slate-100 text-slate-900 placeholder:text-slate-400'
                        }`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                  </div>
                  {activeTab === 'logs' && (
                     <div className="relative">
                        <Filter className={`absolute left-4 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-slate-400'}`} size={18} />
                        <input 
                          type="text"
                          placeholder="Country Filter..."
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
              <div className={`backdrop-blur-xl border rounded-[2rem] overflow-hidden shadow-2xl transition-colors ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-white border-slate-200'}`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className={`border-b text-[10px] uppercase tracking-[0.2em] font-black ${darkMode ? 'border-white/5 text-gray-500' : 'border-slate-100 text-slate-400'}`}>
                        {activeTab === 'users' ? (
                          <>
                            <th className="px-8 py-6">User Identity</th>
                            <th className="px-8 py-6">Status</th>
                            <th className="px-8 py-6">Origin IP</th>
                            <th className="px-8 py-6">Registration</th>
                            <th className="px-8 py-6 text-right">Actions</th>
                          </>
                        ) : (
                          <>
                            <th className="px-8 py-6">Target Property</th>
                            <th className="px-8 py-6">Requestor</th>
                            <th className="px-8 py-6 text-center">Score</th>
                            <th className="px-8 py-6 text-center">Country</th>
                            <th className="px-8 py-6 text-right">Timestamp</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                      {loading ? (
                        <tr>
                          <td colSpan="6" className="px-8 py-24 text-center">
                            <div className="flex flex-col items-center gap-4">
                              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                              <p className="text-sm font-black animate-pulse text-gray-500 uppercase tracking-widest">Accessing Secure Records...</p>
                            </div>
                          </td>
                        </tr>
                      ) : (activeTab === 'users' ? users : logs).length === 0 ? (
                        <tr>
                          <td colSpan="6" className="px-8 py-24 text-center">
                            <div className="flex flex-col items-center gap-4 opacity-20">
                              <ShieldAlert size={64} />
                              <p className="text-xl font-black uppercase tracking-widest">No Records Found</p>
                            </div>
                          </td>
                        </tr>
                      ) : (activeTab === 'users' ? users : logs).map((item) => (
                        <tr 
                          key={item._id} 
                          onClick={activeTab === 'users' ? () => handleUserClick(item) : undefined}
                          className={`transition-colors group cursor-pointer ${darkMode ? 'hover:bg-white/[0.03]' : 'hover:bg-slate-50'}`}
                        >
                          {activeTab === 'users' ? (
                            <>
                              <td className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 text-white`}>
                                    {item.avatar ? <img src={item.avatar} alt="" className="w-10 h-10 rounded-2xl" /> : item.name.charAt(0)}
                                  </div>
                                  <div className="min-w-0">
                                     <p className={`font-black text-sm truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{item.name}</p>
                                     <p className={`text-[10px] font-bold ${darkMode ? 'text-gray-500' : 'text-slate-400'}`}>{item.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${item.isBlocked ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                                  {item.isBlocked ? 'Suspended' : 'Verified'}
                                </span>
                              </td>
                              <td className="px-8 py-5">
                                <div className="flex flex-col">
                                   <span className={`text-[10px] font-mono font-black ${darkMode ? 'text-gray-300' : 'text-slate-700'}`}>{item.lastLoginIp || '0.0.0.0'}</span>
                                   <span className="text-[9px] text-blue-500 font-black uppercase tracking-widest">{item.lastLoginCountry || 'Unknown'}</span>
                                </div>
                              </td>
                              <td className="px-8 py-5 text-[10px] font-black text-gray-500 uppercase tracking-tighter">{formatTimestamp(item.createdAt)}</td>
                              <td className="px-8 py-5 text-right">
                                 <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                   {item.isBlocked ? (
                                     <button onClick={(e) => handleUnblock(item._id, e)} className="p-2.5 text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl transition-colors"><Unlock size={14}/></button>
                                   ) : (
                                     <button onClick={(e) => handleBlock(item._id, e)} disabled={item.role === 'admin'} className="p-2.5 text-amber-500 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors disabled:opacity-10"><Lock size={14}/></button>
                                   )}
                                   <button onClick={(e) => handleDelete(item._id, e)} disabled={item.role === 'admin'} className="p-2.5 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors disabled:opacity-10"><Trash2 size={14}/></button>
                                 </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                                      <Globe size={14} className="text-blue-500" />
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                       <span className="font-black text-sm truncate max-w-[280px]">{item.url}</span>
                                       <span className="text-[9px] opacity-40 uppercase font-black tracking-widest">{item.device} Audit</span>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 <p className="font-black text-xs">{item.userId?.email || 'Guest Session'}</p>
                                 <p className="text-[9px] text-gray-500 font-mono font-bold">{item.ip || '0.0.0.0'}</p>
                              </td>
                              <td className="px-8 py-5 text-center">
                                 <div className={`inline-flex px-3 py-1.5 rounded-xl items-center justify-center font-black text-xs border ${
                                    item.status === 'pending' ? 'border-amber-500/20 text-amber-500 animate-pulse bg-amber-500/5' :
                                    item.score >= 80 ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5' :
                                    item.score >= 50 ? 'border-amber-500/20 text-amber-500 bg-amber-500/5' : 'border-red-500/20 text-red-500 bg-red-500/5'
                                 }`}>
                                    {item.status === 'pending' ? 'PENDING' : (item.score !== null ? `${item.score}%` : 'N/A')}
                                 </div>
                              </td>
                              <td className="px-8 py-5 text-center">
                                 <span className="text-[9px] text-rose-500 font-black uppercase tracking-[0.15em] bg-rose-500/10 px-2.5 py-1.5 rounded-lg">{item.country || 'GLOBAL'}</span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">{formatTimestamp(item.createdAt)}</p>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination */}
                <div className={`px-8 py-6 border-t flex items-center justify-between ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Showing <span className={darkMode ? 'text-white' : 'text-slate-900'}>{((page - 1) * 10) + 1}</span> to <span className={darkMode ? 'text-white' : 'text-slate-900'}>{Math.min(page * 10, totalItems)}</span> of {totalItems}
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold disabled:opacity-30 transition-colors ${
                        darkMode ? 'border-white/10 hover:bg-blue-600 hover:text-white' : 'border-slate-200 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      Previous
                    </button>
                    <button 
                      onClick={() => setPage(p => p + 1)}
                      disabled={page * 10 >= totalItems}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold disabled:opacity-30 transition-colors ${
                        darkMode ? 'border-white/10 hover:bg-blue-600 hover:text-white' : 'border-slate-200 hover:bg-blue-600 hover:text-white'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
              key="settings"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* General Config */}
                <div className={`border rounded-[2rem] p-8 transition-colors ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h3 className={`text-xl font-black mb-8 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Settings className="text-blue-500" size={24} />
                    Platform Settings
                  </h3>
                  <div className="space-y-6">
                    {[
                      { label: "Maintenance Mode", desc: "Temporarily disable public access", toggle: false, icon: ShieldAlert },
                      { label: "Public Registration", desc: "Allow new users to sign up", toggle: true, icon: UserPlus },
                      { label: "Guest Audits", desc: "Allow non-logged users to scan", toggle: true, icon: Globe }
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center justify-between py-4 border-b last:border-0 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                            <item.icon size={18} className={darkMode ? 'text-gray-400' : 'text-slate-400'} />
                          </div>
                          <div>
                            <p className={`font-black text-sm ${darkMode ? 'text-white' : 'text-slate-700'}`}>{item.label}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">{item.desc}</p>
                          </div>
                        </div>
                        <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${item.toggle ? 'bg-blue-600' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${item.toggle ? 'left-6' : 'left-1'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature Flags / Advanced */}
                <div className={`border rounded-[2rem] p-8 transition-colors ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-white border-slate-200 shadow-sm'}`}>
                  <h3 className={`text-xl font-black mb-8 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Zap className="text-amber-500" size={24} />
                    Advanced Features
                  </h3>
                  <div className="space-y-6">
                    {[
                      { label: "AI Summarization", desc: "Gemini-powered audit summaries", toggle: true, icon: Bot },
                      { label: "Bulk Processing", desc: "Enable multi-site queueing", toggle: true, icon: Activity },
                      { label: "Webhook Events", desc: "Push results to external URLs", toggle: false, icon: ExternalLink }
                    ].map((item, i) => (
                      <div key={i} className={`flex items-center justify-between py-4 border-b last:border-0 ${darkMode ? 'border-white/5' : 'border-slate-100'}`}>
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-xl ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                            <item.icon size={18} className={darkMode ? 'text-gray-400' : 'text-slate-400'} />
                          </div>
                          <div>
                            <p className={`font-black text-sm ${darkMode ? 'text-white' : 'text-slate-700'}`}>{item.label}</p>
                            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-tighter">{item.desc}</p>
                          </div>
                        </div>
                        <div className={`w-11 h-6 rounded-full relative cursor-pointer transition-colors ${item.toggle ? 'bg-emerald-600' : 'bg-gray-300'}`}>
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${item.toggle ? 'left-6' : 'left-1'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className={`border rounded-[2.5rem] p-8 border-red-500/20 bg-red-500/5 relative overflow-hidden group`}>
                 <div className="relative z-10">
                   <h3 className="text-2xl font-black text-red-500 mb-2 flex items-center gap-3">
                     <ShieldAlert size={28} />
                     Danger Zone
                   </h3>
                   <p className="text-xs text-red-500/60 font-bold uppercase tracking-widest mb-8">System-wide irreversible actions</p>
                   <div className="flex flex-wrap gap-4">
                     <button className="px-8 py-4 bg-red-600 text-white rounded-[1.2rem] font-black text-xs uppercase tracking-widest hover:bg-red-700 hover:scale-105 transition-all shadow-lg shadow-red-600/20">Clear System Cache</button>
                     <button className="px-8 py-4 border-2 border-red-600/20 text-red-500 rounded-[1.2rem] font-black text-xs uppercase tracking-widest hover:bg-red-500/10 transition-all">Reset API Protocols</button>
                     <button className="px-8 py-4 bg-black text-white rounded-[1.2rem] font-black text-xs uppercase tracking-widest hover:bg-gray-900 transition-all ml-auto">Purge Audit Logs</button>
                    </div>
                  </div>
                  <Lock className="absolute -right-10 -bottom-10 text-red-500/5 group-hover:scale-110 transition-transform" size={200} />
               </div>
            </motion.div>
          )}
      </AnimatePresence>

      {/* Detail Modal - Enhanced */}
      <AnimatePresence>
        {selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className={`relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border ${darkMode ? 'bg-[#0f0f15] border-white/10' : 'bg-white border-slate-200'}`}
            >
              <div className="h-full flex flex-col">
                <div className="p-8 border-b border-white/5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl shadow-blue-500/40">
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-3xl font-black tracking-tight">{selectedUser.name}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-blue-500 font-bold text-sm">{selectedUser.email}</p>
                        <span className="w-1 h-1 rounded-full bg-gray-500" />
                        <p className="text-gray-500 font-bold text-sm">UID: {selectedUser._id.slice(-8).toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className={`p-4 rounded-full transition-all ${darkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                  {userDetailLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                      <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <p className="font-black text-gray-500 uppercase tracking-widest">Decrypting User Profile...</p>
                    </div>
                  ) : userDetails && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      {/* Left: Stats & Details */}
                      <div className="space-y-6">
                        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-4">Account Metrics</h4>
                          <div className="space-y-4">
                             <div className="flex justify-between items-center">
                               <span className="text-xs text-gray-500">Total Audits</span>
                               <span className="font-bold">{userDetails.auditHistory?.length || 0}</span>
                             </div>
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-500">Avg. Score</span>
                                <span className={`font-bold ${
                                  (() => {
                                    const scoredAudits = userDetails.auditHistory?.filter(h => h.status === 'success' && typeof h.score === 'number') || [];
                                    const avg = scoredAudits.length > 0 
                                      ? Math.round(scoredAudits.reduce((acc, curr) => acc + curr.score, 0) / scoredAudits.length)
                                      : 0;
                                    
                                    return avg >= 80 ? 'text-emerald-500' : avg >= 50 ? 'text-amber-500' : 'text-rose-500';
                                  })()
                                }`}>
                                  {(() => {
                                    const scoredAudits = userDetails.auditHistory?.filter(h => h.status === 'success' && typeof h.score === 'number') || [];
                                    return scoredAudits.length > 0 
                                      ? Math.round(scoredAudits.reduce((acc, curr) => acc + curr.score, 0) / scoredAudits.length) + '%'
                                      : '0%';
                                  })()}
                                </span>
                              </div>
                             <div className="flex justify-between items-center">
                               <span className="text-xs text-gray-500">Reports PDF</span>
                               <span className="font-bold text-amber-500">{userDetails.downloadHistory?.length || 0}</span>
                             </div>
                          </div>
                        </div>

                        <div className={`p-6 rounded-3xl border ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-4">Active Projects</h4>
                          <div className="space-y-3">
                            {selectedUser.websites?.length > 0 ? selectedUser.websites.map((w, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                <p className="text-xs font-bold truncate flex-1">{w.url}</p>
                                <ExternalLink size={10} className="text-gray-500" />
                              </div>
                            )) : <p className="text-xs text-gray-500 italic">No connected websites</p>}
                          </div>
                        </div>
                      </div>

                      {/* Right: History Timeline */}
                      <div className="md:col-span-2 space-y-6">
                        <div className={`p-6 rounded-3xl border h-full ${darkMode ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
                          <div className="flex items-center justify-between mb-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Recent Activity Log</h4>
                            <Calendar size={14} className="text-gray-500" />
                          </div>
                          <div className="space-y-4">
                            {userDetails.auditHistory?.length > 0 ? userDetails.auditHistory.slice(0, 10).map((h, i) => (
                              <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl ${darkMode ? 'bg-black/20 hover:bg-black/30' : 'bg-white hover:bg-slate-100/50'} transition-colors`}>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${
                                  h.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                }`}>
                                  {h.score || '!!'}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold truncate">{h.url}</p>
                                  <p className="text-[9px] text-gray-500 uppercase tracking-tighter">{formatTimestamp(h.createdAt)}</p>
                                </div>
                                <span className="text-[10px] font-black text-blue-500 px-2 py-1 bg-blue-500/5 rounded">AUDIT</span>
                              </div>
                            )) : (
                              <div className="flex flex-col items-center justify-center py-12 opacity-20">
                                <Activity size={48} />
                                <p className="font-bold mt-2">No history recorded</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-6 border-t border-white/5 flex justify-end shrink-0">
                   <button onClick={() => setSelectedUser(null)} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-blue-500/20 active:scale-95 transition-transform">
                     Close Profile
                   </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  </div>
);
};

export default AdminDashboard;

