import React, { useState, useEffect, useContext, useCallback } from 'react';
import api from '../utils/api';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { 
  Search, Eye, EyeOff, MoreVertical, Plus, RefreshCw, Lock, Unlock,
  Save, X, Trash2, Settings, ShieldCheck, Terminal, History,
  RotateCcw, Download, Upload, Filter, Clock, User, Activity,
  ChevronDown, AlertTriangle, CheckCircle2, Database, Zap, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

// ── Category & Environment Config ───────────────────────────────────
const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'auth', label: 'Authentication', color: '#8b5cf6' },
  { value: 'email', label: 'Email / SMTP', color: '#f59e0b' },
  { value: 'api', label: 'API Keys', color: '#3b82f6' },
  { value: 'database', label: 'Database', color: '#10b981' },
  { value: 'security', label: 'Security', color: '#ef4444' },
  { value: 'frontend', label: 'Frontend', color: '#06b6d4' },
  { value: 'general', label: 'General', color: '#6b7280' },
];

const ENVIRONMENTS = [
  { value: 'all', label: 'All Environments', icon: Globe },
  { value: 'development', label: 'Development', color: '#22c55e' },
  { value: 'staging', label: 'Staging', color: '#f59e0b' },
  { value: 'production', label: 'Production', color: '#ef4444' },
];

const ACTION_COLORS = {
  CREATE: '#22c55e',
  UPDATE: '#3b82f6',
  DELETE: '#ef4444',
  ROLLBACK: '#f59e0b',
  REVEAL: '#8b5cf6',
  BULK_IMPORT: '#06b6d4',
  CACHE_REFRESH: '#6b7280',
};

const getCategoryColor = (cat) => CATEGORIES.find(c => c.value === cat)?.color || '#6b7280';
const getCategoryLabel = (cat) => CATEGORIES.find(c => c.value === cat)?.label || cat;
const getEnvColor = (env) => ENVIRONMENTS.find(e => e.value === env)?.color || '#6b7280';

// ── Main Component ──────────────────────────────────────────────────
const AdminConfig = () => {
  const { theme } = useContext(ThemeContext);
  const dk = theme === 'dark';

  // ── State ──
  const [activeTab, setActiveTab] = useState('configs');
  const [configs, setConfigs] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [envFilter, setEnvFilter] = useState('all');
  const [revealedValues, setRevealedValues] = useState({});
  const [openMenu, setOpenMenu] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [modalData, setModalData] = useState({ key: '', value: '', description: '', isSensitive: true, category: 'general', environment: 'all' });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyKey, setHistoryKey] = useState('');
  const [versions, setVersions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Audit Logs
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsPagination, setLogsPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // ── Data Fetching ──
  const fetchConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/admin/config');
      setConfigs(res.data.configs || []);
      setStats(res.data.stats || {});
    } catch {
      toast.error('Failed to load configurations');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (page = 1) => {
    setLogsLoading(true);
    try {
      const res = await api.get(`/api/admin/config/logs?page=${page}&limit=30`);
      setLogs(res.data.logs || []);
      setLogsPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLogsLoading(false);
    }
  }, []);

  useEffect(() => { fetchConfigs(); }, [fetchConfigs]);
  useEffect(() => { if (activeTab === 'audit') fetchLogs(); }, [activeTab, fetchLogs]);

  // ── Actions ──
  const handleReveal = async (key) => {
    if (revealedValues[key]) {
      setRevealedValues(prev => { const n = { ...prev }; delete n[key]; return n; });
      return;
    }
    try {
      const res = await api.get(`/api/admin/config/${encodeURIComponent(key)}/reveal`);
      setRevealedValues(prev => ({ ...prev, [key]: res.data.value }));
      // Auto-hide after 30 seconds
      setTimeout(() => {
        setRevealedValues(prev => { const n = { ...prev }; delete n[key]; return n; });
      }, 30000);
    } catch {
      toast.error('Failed to reveal value');
    }
  };

  const handleRefreshCache = async () => {
    setRefreshing(true);
    try {
      await api.post('/api/admin/config/refresh');
      toast.success('Cache refreshed from database');
      fetchConfigs();
    } catch {
      toast.error('Cache refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  const handleOpenModal = (config = null) => {
    if (config) {
      setModalData({
        key: config.key,
        value: revealedValues[config.key] || '',
        description: config.description || '',
        isSensitive: config.isSensitive,
        category: config.category || 'general',
        environment: config.environment || 'all',
      });
      setIsEditing(true);
    } else {
      setModalData({ key: '', value: '', description: '', isSensitive: true, category: 'general', environment: 'all' });
      setIsEditing(false);
    }
    setModalOpen(true);
    setOpenMenu(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!modalData.key || !modalData.value) return toast.error('Key and Value are required');
    setSaving(true);
    try {
      await api.put('/api/admin/config', modalData);
      toast.success(isEditing ? 'Configuration updated' : 'Configuration created');
      setModalOpen(false);
      setRevealedValues(prev => { const n = { ...prev }; delete n[modalData.key]; return n; });
      fetchConfigs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (key) => {
    if (!window.confirm(`Delete "${key}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/api/admin/config/${encodeURIComponent(key)}`);
      toast.success('Configuration deleted');
      fetchConfigs();
    } catch {
      toast.error('Failed to delete');
    }
    setOpenMenu(null);
  };

  const handleViewHistory = async (key) => {
    setHistoryKey(key);
    setHistoryModalOpen(true);
    setHistoryLoading(true);
    setOpenMenu(null);
    try {
      const res = await api.get(`/api/admin/config/${encodeURIComponent(key)}/history`);
      setVersions(res.data.versions || []);
    } catch {
      toast.error('Failed to load version history');
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRollback = async (key, targetVersion) => {
    if (!window.confirm(`Rollback "${key}" to version ${targetVersion}?`)) return;
    try {
      const res = await api.post(`/api/admin/config/${encodeURIComponent(key)}/rollback`, { targetVersion });
      toast.success(res.data.message);
      setHistoryModalOpen(false);
      fetchConfigs();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rollback failed');
    }
  };

  const handleExport = () => {
    const exportData = configs.map(c => ({
      key: c.key,
      isSensitive: c.isSensitive,
      description: c.description,
      category: c.category,
      environment: c.environment,
      version: c.version,
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auditify-configs-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Config keys exported');
  };

  // ── Filtering ──
  const filtered = configs.filter(c => {
    if (searchQuery && !c.key.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
    if (envFilter !== 'all' && c.environment !== envFilter && c.environment !== 'all') return false;
    return true;
  });

  const sensitiveCount = configs.filter(c => c.isSensitive).length;
  const categoryGroups = [...new Set(configs.map(c => c.category || 'general'))];

  // ── Styles ──
  const card = dk ? 'bg-[#0a0a0f] border-white/[0.06]' : 'bg-white border-slate-200 shadow-sm';
  const inputCls = dk
    ? 'bg-transparent border-white/[0.08] text-white placeholder-white/20 focus:border-indigo-500/50 focus:ring-indigo-500/20'
    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm';

  return (
    <div className={`min-h-screen pt-24 pb-16 transition-colors duration-300 ${dk ? 'bg-[#000000] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <header className="flex flex-col lg:flex-row items-start lg:items-center gap-6 mb-10">
          <div className="flex items-center gap-4 flex-1">
            <div className={`p-4 rounded-2xl border ${dk ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
              <ShieldCheck size={28} className="text-indigo-500" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight">Configuration Vault</h1>
              <p className={`text-sm mt-1 ${dk ? 'text-white/30' : 'text-slate-400'}`}>
                AES-256 encrypted • Hot reload • Version controlled
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefreshCache}
              disabled={refreshing}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${dk ? 'border-white/10 hover:bg-white/5 text-white/50 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-500'}`}
            >
              <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
              Sync Cache
            </button>
            <button
              onClick={handleExport}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${dk ? 'border-white/10 hover:bg-white/5 text-white/50 hover:text-white' : 'border-slate-200 hover:bg-slate-100 text-slate-500'}`}
            >
              <Download size={14} />
              Export
            </button>
            <button
              onClick={() => handleOpenModal()}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all active:scale-95 ${dk ? 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'}`}
            >
              <Plus size={14} strokeWidth={3} />
              Add Secret
            </button>
          </div>
        </header>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Configs" value={configs.length} icon={Database} color="#6366f1" dk={dk} />
          <StatCard label="Sensitive" value={sensitiveCount} icon={Lock} color="#ef4444" dk={dk} />
          <StatCard label="Categories" value={categoryGroups.length} icon={Filter} color="#f59e0b" dk={dk} />
          <StatCard
            label="Cache Status"
            value={stats.initialized ? 'Active' : 'Degraded'}
            icon={stats.initialized ? Zap : AlertTriangle}
            color={stats.initialized ? '#22c55e' : '#ef4444'}
            dk={dk}
          />
        </div>

        {/* ── Tab Navigation ── */}
        <div className={`flex items-center gap-1 p-1.5 rounded-2xl border mb-8 w-fit ${dk ? 'bg-white/[0.02] border-white/[0.06]' : 'bg-slate-100 border-slate-200'}`}>
          {[
            { id: 'configs', label: 'Configurations', icon: Settings },
            { id: 'audit', label: 'Audit Trail', icon: Activity },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === tab.id
                  ? (dk ? 'bg-white/10 text-white' : 'bg-white text-slate-900 shadow-sm')
                  : (dk ? 'text-white/30 hover:text-white/60' : 'text-slate-400 hover:text-slate-600')
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'configs' ? (
            <motion.div key="configs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {/* Filters */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 mb-6">
                <div className="relative flex-1">
                  <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${dk ? 'text-white/20' : 'text-slate-400'}`} size={16} />
                  <input
                    type="text"
                    placeholder="Search by key name..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${inputCls}`}
                  />
                </div>
                <SelectFilter
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={CATEGORIES}
                  dk={dk}
                />
                <SelectFilter
                  value={envFilter}
                  onChange={setEnvFilter}
                  options={ENVIRONMENTS}
                  dk={dk}
                />
              </div>

              {/* Config List */}
              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw size={24} className="animate-spin text-indigo-500" />
                </div>
              ) : filtered.length === 0 ? (
                <div className={`rounded-2xl border py-20 text-center ${card}`}>
                  <Database size={40} className={`mx-auto mb-4 ${dk ? 'text-white/10' : 'text-slate-200'}`} />
                  <p className={`text-sm font-medium ${dk ? 'text-white/20' : 'text-slate-400'}`}>No configurations found</p>
                </div>
              ) : (
                <div className={`rounded-2xl border overflow-hidden ${card}`}>
                  <div className={`divide-y ${dk ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
                    {filtered.map((config, idx) => (
                      <ConfigRow
                        key={config.key}
                        config={config}
                        idx={idx}
                        total={filtered.length}
                        dk={dk}
                        revealedValue={revealedValues[config.key]}
                        onReveal={() => handleReveal(config.key)}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        onEdit={() => handleOpenModal(config)}
                        onDelete={() => handleDelete(config.key)}
                        onHistory={() => handleViewHistory(config.key)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div key="audit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              <AuditTrail
                logs={logs}
                loading={logsLoading}
                pagination={logsPagination}
                onPageChange={fetchLogs}
                dk={dk}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Create / Edit Modal ── */}
        <AnimatePresence>
          {modalOpen && (
            <ModalOverlay onClose={() => setModalOpen(false)} dk={dk}>
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${dk ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                    {isEditing ? <Settings size={22} /> : <Plus size={22} />}
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">{isEditing ? 'Update Configuration' : 'Create Configuration'}</h2>
                    <p className={`text-xs mt-0.5 ${dk ? 'text-white/30' : 'text-slate-400'}`}>Values are AES-256 encrypted before storage</p>
                  </div>
                </div>
                <button onClick={() => setModalOpen(false)} className={`p-2.5 rounded-xl transition-colors ${dk ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
                  <X size={20} className="opacity-40" />
                </button>
              </div>

              <form onSubmit={handleSave} className="space-y-5">
                <FormField label="Variable Key" dk={dk}>
                  <input
                    disabled={isEditing}
                    type="text"
                    placeholder="e.g. JWT_SECRET"
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 transition-all ${inputCls} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                    value={modalData.key}
                    onChange={e => setModalData({ ...modalData, key: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                  />
                </FormField>

                <FormField label="Value" dk={dk}>
                  <textarea
                    rows={3}
                    placeholder="Enter value..."
                    className={`w-full px-4 py-3 rounded-xl border text-sm font-mono focus:outline-none focus:ring-2 transition-all resize-none ${inputCls}`}
                    value={modalData.value}
                    onChange={e => setModalData({ ...modalData, value: e.target.value })}
                  />
                </FormField>

                <FormField label="Description (optional)" dk={dk}>
                  <input
                    type="text"
                    placeholder="What this config is used for..."
                    className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${inputCls}`}
                    value={modalData.description}
                    onChange={e => setModalData({ ...modalData, description: e.target.value })}
                  />
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField label="Category" dk={dk}>
                    <select
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${inputCls}`}
                      value={modalData.category}
                      onChange={e => setModalData({ ...modalData, category: e.target.value })}
                    >
                      {CATEGORIES.filter(c => c.value !== 'all').map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                      ))}
                    </select>
                  </FormField>

                  <FormField label="Environment" dk={dk}>
                    <select
                      className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 transition-all ${inputCls}`}
                      value={modalData.environment}
                      onChange={e => setModalData({ ...modalData, environment: e.target.value })}
                    >
                      {ENVIRONMENTS.map(e => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                      ))}
                    </select>
                  </FormField>
                </div>

                {/* Sensitive Toggle */}
                <div className={`flex items-center justify-between py-4 px-4 rounded-xl border ${dk ? 'border-white/[0.06] bg-white/[0.02]' : 'border-slate-100 bg-slate-50'}`}>
                  <div>
                    <p className="font-bold text-sm">Sensitive Value</p>
                    <p className={`text-xs mt-0.5 ${dk ? 'text-white/30' : 'text-slate-400'}`}>Masked in API responses & audit logs</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalData({ ...modalData, isSensitive: !modalData.isSensitive })}
                    className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${modalData.isSensitive ? 'bg-indigo-600' : (dk ? 'bg-white/10' : 'bg-slate-300')}`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 flex items-center justify-center ${modalData.isSensitive ? 'translate-x-5' : 'translate-x-0'}`}>
                      {modalData.isSensitive ? <Lock size={10} className="text-indigo-600" /> : <Unlock size={10} className="text-slate-400" />}
                    </div>
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className={`w-full py-4 rounded-xl font-bold text-sm uppercase tracking-wider transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 ${dk ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'}`}
                >
                  {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                  {isEditing ? 'Update Configuration' : 'Create Configuration'}
                </button>
              </form>
            </ModalOverlay>
          )}
        </AnimatePresence>

        {/* ── History / Rollback Modal ── */}
        <AnimatePresence>
          {historyModalOpen && (
            <ModalOverlay onClose={() => setHistoryModalOpen(false)} dk={dk}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${dk ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'}`}>
                    <History size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">Version History</h2>
                    <p className={`text-xs font-mono mt-0.5 ${dk ? 'text-white/40' : 'text-slate-400'}`}>{historyKey}</p>
                  </div>
                </div>
                <button onClick={() => setHistoryModalOpen(false)} className={`p-2.5 rounded-xl transition-colors ${dk ? 'hover:bg-white/5' : 'hover:bg-slate-100'}`}>
                  <X size={20} className="opacity-40" />
                </button>
              </div>

              {historyLoading ? (
                <div className="flex justify-center py-12">
                  <RefreshCw size={24} className="animate-spin text-indigo-500" />
                </div>
              ) : versions.length === 0 ? (
                <div className="text-center py-12">
                  <History size={32} className={`mx-auto mb-3 ${dk ? 'text-white/10' : 'text-slate-200'}`} />
                  <p className={`text-sm ${dk ? 'text-white/30' : 'text-slate-400'}`}>No previous versions recorded yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1 custom-scrollbar">
                  {versions.map(v => (
                    <div key={v._id} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${dk ? 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-black px-2 py-0.5 rounded-md ${dk ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>v{v.version}</span>
                          {v.isSensitive && <Lock size={10} className="text-amber-500" />}
                          <span className={`text-xs ${dk ? 'text-white/20' : 'text-slate-400'}`}>
                            {new Date(v.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className={`text-xs font-mono truncate ${dk ? 'text-white/40' : 'text-slate-500'}`}>
                          {v.value}
                        </p>
                        {v.changedBy && (
                          <p className={`text-[10px] mt-1 ${dk ? 'text-white/15' : 'text-slate-300'}`}>
                            by {v.changedBy.name || v.changedBy.email}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRollback(historyKey, v.version)}
                        className={`ml-4 flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all active:scale-95 ${dk ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/20' : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'}`}
                      >
                        <RotateCcw size={12} />
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </ModalOverlay>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
};

// ── Sub-Components ──────────────────────────────────────────────────

const StatCard = ({ label, value, icon: Icon, color, dk }) => (
  <div className={`p-5 rounded-2xl border transition-colors ${dk ? 'bg-[#0a0a0f] border-white/[0.06]' : 'bg-white border-slate-200 shadow-sm'}`}>
    <div className="flex items-center justify-between">
      <div>
        <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${dk ? 'text-white/25' : 'text-slate-400'}`}>{label}</p>
        <p className="text-2xl font-black" style={{ color }}>{value}</p>
      </div>
      <div className={`p-3 rounded-xl ${dk ? 'bg-white/[0.03]' : 'bg-slate-50'}`}>
        <Icon size={20} style={{ color }} />
      </div>
    </div>
  </div>
);

const SelectFilter = ({ value, onChange, options, dk }) => (
  <div className="relative">
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className={`appearance-none pl-4 pr-10 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider cursor-pointer focus:outline-none focus:ring-2 transition-all ${
        dk
          ? 'bg-transparent border-white/[0.08] text-white/60 focus:border-indigo-500/50 focus:ring-indigo-500/20'
          : 'bg-white border-slate-200 text-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20 shadow-sm'
      }`}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} className={dk ? 'bg-[#111]' : 'bg-white'}>{o.label}</option>
      ))}
    </select>
    <ChevronDown size={14} className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${dk ? 'text-white/20' : 'text-slate-400'}`} />
  </div>
);

const FormField = ({ label, children, dk }) => (
  <div>
    <label className={`text-[10px] uppercase font-bold tracking-wider mb-2 block ${dk ? 'text-white/30' : 'text-slate-400'}`}>{label}</label>
    {children}
  </div>
);

const ModalOverlay = ({ onClose, dk, children }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 bg-black/70 backdrop-blur-sm"
    />
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.2 }}
      className={`relative w-full max-w-lg rounded-2xl border p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto ${dk ? 'bg-[#0c0c12] border-white/[0.08]' : 'bg-white border-slate-200'}`}
    >
      {children}
    </motion.div>
  </div>
);

const ConfigRow = ({ config, idx, total, dk, revealedValue, onReveal, openMenu, setOpenMenu, onEdit, onDelete, onHistory }) => {
  const displayValue = revealedValue || config.value;
  const isRevealed = !!revealedValue;
  const catColor = getCategoryColor(config.category);

  return (
    <div className={`group relative px-6 py-5 transition-colors ${dk ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50/80'}`}>
      <div className="flex flex-col md:flex-row md:items-center gap-4">

        {/* Key + Badges */}
        <div className="flex items-center gap-3 md:w-[240px] min-w-0">
          <div className="w-1 h-8 rounded-full flex-shrink-0" style={{ backgroundColor: catColor }} />
          <div className="min-w-0">
            <h3 className={`font-bold text-sm font-mono truncate transition-colors ${dk ? 'group-hover:text-indigo-400' : 'group-hover:text-indigo-600'}`}>
              {config.key}
            </h3>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                style={{ backgroundColor: catColor + '18', color: catColor }}
              >
                {getCategoryLabel(config.category)}
              </span>
              {config.environment !== 'all' && (
                <span
                  className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                  style={{ backgroundColor: getEnvColor(config.environment) + '18', color: getEnvColor(config.environment) }}
                >
                  {config.environment}
                </span>
              )}
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${dk ? 'bg-white/5 text-white/25' : 'bg-slate-100 text-slate-400'}`}>
                v{config.version}
              </span>
            </div>
          </div>
        </div>

        {/* Value Display */}
        <div className="flex-1 flex items-center gap-2">
          <button
            onClick={onReveal}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${dk ? 'hover:bg-white/5 text-white/30' : 'hover:bg-slate-100 text-slate-400'}`}
            title={isRevealed ? 'Hide value' : 'Reveal value'}
          >
            {isRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
          <div className={`flex-1 px-3 py-2 rounded-lg border font-mono text-xs truncate ${
            dk
              ? `border-white/[0.05] ${isRevealed ? 'bg-indigo-500/5 text-indigo-300 border-indigo-500/20' : 'bg-white/[0.02] text-white/25'}`
              : `${isRevealed ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-400 border-slate-100'}`
          }`}>
            {displayValue}
          </div>
          {config.isSensitive && <Lock size={12} className="text-amber-500/60 flex-shrink-0" />}
        </div>

        {/* Meta + Actions */}
        <div className="flex items-center gap-4 md:w-[200px] justify-end">
          <div className="text-right">
            <p className={`text-[10px] font-bold whitespace-nowrap ${dk ? 'text-white/20' : 'text-slate-300'}`}>
              {config.updatedAt ? new Date(config.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
            </p>
            {config.description && (
              <p className={`text-[9px] truncate max-w-[100px] ${dk ? 'text-white/10' : 'text-slate-300'}`} title={config.description}>
                {config.description}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === config._id ? null : config._id)}
              className={`p-2 rounded-lg border transition-colors ${dk ? 'border-white/[0.06] hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <MoreVertical size={16} className="opacity-50" />
            </button>

            <AnimatePresence>
              {openMenu === config._id && (
                <>
                  <div className="fixed inset-0 z-[60]" onClick={() => setOpenMenu(null)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`absolute right-0 ${idx > total - 3 && total > 2 ? 'bottom-full mb-2' : 'top-full mt-2'} w-48 z-[70] rounded-xl border shadow-2xl p-1.5 ${dk ? 'bg-[#111] border-white/[0.08]' : 'bg-white border-slate-200'}`}
                  >
                    <MenuButton icon={Settings} label="Edit" color="#6366f1" onClick={onEdit} dk={dk} />
                    <MenuButton icon={History} label="History" color="#f59e0b" onClick={onHistory} dk={dk} />
                    <div className={`my-1 border-t ${dk ? 'border-white/[0.06]' : 'border-slate-100'}`} />
                    <MenuButton icon={Trash2} label="Delete" color="#ef4444" onClick={onDelete} dk={dk} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

const MenuButton = ({ icon: Icon, label, color, onClick, dk }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-2.5 text-xs font-bold tracking-wide transition-colors ${dk ? 'hover:bg-white/5 text-white/50 hover:text-white' : 'hover:bg-slate-50 text-slate-600'}`}
  >
    <Icon size={14} style={{ color }} />
    {label}
  </button>
);

const AuditTrail = ({ logs, loading, pagination, onPageChange, dk }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <RefreshCw size={24} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className={`rounded-2xl border py-20 text-center ${dk ? 'bg-[#0a0a0f] border-white/[0.06]' : 'bg-white border-slate-200'}`}>
        <Activity size={40} className={`mx-auto mb-4 ${dk ? 'text-white/10' : 'text-slate-200'}`} />
        <p className={`text-sm font-medium ${dk ? 'text-white/20' : 'text-slate-400'}`}>No audit logs recorded yet</p>
      </div>
    );
  }

  return (
    <div>
      <div className={`rounded-2xl border overflow-hidden ${dk ? 'bg-[#0a0a0f] border-white/[0.06]' : 'bg-white border-slate-200 shadow-sm'}`}>
        <div className={`divide-y ${dk ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
          {logs.map(log => (
            <div key={log._id} className={`px-6 py-4 flex items-start gap-4 transition-colors ${dk ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
              {/* Action Badge */}
              <div
                className="w-2 h-2 rounded-full mt-2 flex-shrink-0"
                style={{ backgroundColor: ACTION_COLORS[log.action] || '#6b7280' }}
              />

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md"
                    style={{
                      backgroundColor: (ACTION_COLORS[log.action] || '#6b7280') + '18',
                      color: ACTION_COLORS[log.action] || '#6b7280'
                    }}
                  >
                    {log.action}
                  </span>
                  <span className={`text-sm font-mono font-bold ${dk ? 'text-white/80' : 'text-slate-700'}`}>{log.key}</span>
                  {log.version && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${dk ? 'bg-white/5 text-white/20' : 'bg-slate-100 text-slate-400'}`}>
                      v{log.version}
                    </span>
                  )}
                </div>

                {(log.oldValue || log.newValue) && (
                  <div className={`mt-2 text-xs font-mono ${dk ? 'text-white/20' : 'text-slate-400'}`}>
                    {log.oldValue && <span>{log.oldValue}</span>}
                    {log.oldValue && log.newValue && <span className="mx-2">→</span>}
                    {log.newValue && <span>{log.newValue}</span>}
                  </div>
                )}

                <div className={`flex items-center gap-3 mt-2 text-[10px] ${dk ? 'text-white/15' : 'text-slate-300'}`}>
                  <span className="flex items-center gap-1">
                    <User size={10} />
                    {log.updatedBy?.name || log.updatedBy?.email || 'System'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  {log.ipAddress && log.ipAddress !== 'unknown' && (
                    <span>{log.ipAddress}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
            const page = i + 1;
            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                  pagination.page === page
                    ? 'bg-indigo-600 text-white'
                    : (dk ? 'bg-white/5 text-white/40 hover:bg-white/10' : 'bg-slate-100 text-slate-500 hover:bg-slate-200')
                }`}
              >
                {page}
              </button>
            );
          })}
          {pagination.totalPages > 5 && (
            <span className={`text-xs ${dk ? 'text-white/20' : 'text-slate-400'}`}>... of {pagination.totalPages}</span>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminConfig;
