import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { ThemeContext } from '../context/ThemeContext.jsx';
import { 
  Settings, 
  Save, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  History, 
  AlertCircle,
  RefreshCw,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const AdminConfig = () => {
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === "dark";

  const [configs, setConfigs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showValues, setShowValues] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [configRes, logsRes] = await Promise.all([
        api.get('/api/admin/config'),
        api.get('/api/admin/config/logs')
      ]);
      setConfigs(configRes.data.configs);
      setLogs(logsRes.data.logs);
    } catch (err) {
      toast.error('Failed to load system configurations');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (config) => {
    if (editingKey !== config.key) return;
    
    setSaving(true);
    try {
      await api.put('/api/admin/config', {
        key: config.key,
        value: editValue,
        isSensitive: config.isSensitive,
        description: config.description
      });
      toast.success('Configuration updated');
      setEditingKey(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update config');
    } finally {
      setSaving(false);
    }
  };

  const toggleShowValue = (key) => {
    setShowValues(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const formatTimestamp = (ts) => new Date(ts).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className={`min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300 ${darkMode ? 'bg-[#0a0a10] text-white' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight flex items-center gap-4">
              <Settings className="text-indigo-500" size={36} />
              System Setup
            </h1>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              Manage application-wide configurations and sensitive credentials.
            </p>
          </div>

          <div className={`flex gap-2 p-1 rounded-2xl border shadow-xl transition-colors ${darkMode ? 'bg-[#16161e] border-white/5' : 'bg-white border-slate-200'}`}>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'settings' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : `${darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`
              }`}
            >
              <Settings size={16} /> Configs
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'logs' 
                  ? 'bg-indigo-600 text-white shadow-lg' 
                  : `${darkMode ? 'text-gray-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`
              }`}
            >
              <History size={16} /> Audit Logs
            </button>
          </div>
        </header>

        {/* Info Banner */}
        <div className={`p-4 rounded-2xl border flex gap-4 ${darkMode ? 'bg-amber-500/5 border-amber-500/20 text-amber-200' : 'bg-amber-50 border-amber-100 text-amber-800'}`}>
          <AlertCircle className="flex-shrink-0" size={20} />
          <p className="text-sm">
            <b>Database Priority:</b> Values defined here override environment variables. Sensitive data is stored using AES-256 encryption.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-20 text-center animate-pulse">
            <RefreshCw className="mx-auto mb-4 animate-spin text-indigo-500" size={40} />
            <p className="font-bold opacity-50 uppercase tracking-widest text-xs">Synchronizing System Data...</p>
          </div>
        ) : activeTab === 'settings' ? (
          <div className="grid gap-6">
            {configs.length === 0 && (
               <div className={`p-12 text-center border-2 border-dashed rounded-3xl ${darkMode ? 'border-white/5 text-gray-600' : 'border-slate-200 text-slate-400'}`}>
                  <p>No configurations found. Add your first key-value pair.</p>
               </div>
            )}
            
            {configs.map((config) => (
              <motion.div 
                layout
                key={config.key}
                className={`group backdrop-blur-xl border rounded-3xl p-6 shadow-xl transition-all ${
                  editingKey === config.key 
                    ? (darkMode ? 'bg-indigo-600/10 border-indigo-500/50' : 'bg-indigo-50 border-indigo-200')
                    : (darkMode ? 'bg-[#16161e]/50 border-white/5 hover:border-white/10' : 'bg-white border-slate-200 hover:border-slate-300')
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-black font-mono tracking-tight text-lg">{config.key}</h3>
                      {config.isSensitive && (
                        <span className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                          darkMode ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-50 text-rose-600'
                        }`}>
                          <Lock size={10} /> Sensitive
                        </span>
                      )}
                    </div>
                    <p className={`text-sm opacity-60`}>{config.description || 'No description provided.'}</p>
                    
                    <div className="mt-4 relative max-w-2xl">
                        {editingKey === config.key ? (
                          <div className="flex gap-2">
                             <input 
                               autoFocus
                               type={config.isSensitive && !showValues[config.key] ? 'password' : 'text'}
                               className={`w-full px-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all ${
                                 darkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'
                               }`}
                               value={editValue}
                               onChange={(e) => setEditValue(e.target.value)}
                               placeholder="Enter new value..."
                             />
                             {config.isSensitive && (
                                <button 
                                  onClick={() => toggleShowValue(config.key)}
                                  className={`p-2 rounded-xl border ${darkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-100'}`}
                                >
                                  {showValues[config.key] ? <EyeOff size={18}/> : <Eye size={18}/>}
                                </button>
                             )}
                          </div>
                        ) : (
                          <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-mono text-sm ${darkMode ? 'bg-white/5' : 'bg-slate-50'}`}>
                             <span className="truncate flex-1 py-1">
                               {config.isSensitive ? (showValues[config.key] ? 'ENCRYPTED' : '********') : config.value}
                             </span>
                             {config.isSensitive && (
                                <button onClick={() => toggleShowValue(config.key)} className="opacity-40 hover:opacity-100 transition-opacity">
                                   {showValues[config.key] ? <Lock size={14}/> : <Eye size={14}/>}
                                </button>
                             )}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {editingKey === config.key ? (
                       <>
                         <button 
                           onClick={() => setEditingKey(null)}
                           className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${darkMode ? 'text-gray-400 hover:bg-white/5' : 'text-slate-500 hover:bg-slate-100'}`}
                         >
                           Cancel
                         </button>
                         <button 
                           onClick={() => handleSave(config)}
                           disabled={saving}
                           className="flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50"
                         >
                           {saving ? <RefreshCw className="animate-spin" size={16} /> : <Save size={16} />}
                           Save Changes
                         </button>
                       </>
                    ) : (
                      <button 
                        onClick={() => {
                          setEditingKey(config.key);
                          setEditValue(config.isSensitive ? '' : config.value);
                          setShowValues(prev => ({ ...prev, [config.key]: false }));
                        }}
                        className={`px-6 py-2 rounded-xl text-sm font-bold border transition-all ${
                          darkMode ? 'border-white/10 hover:bg-white/5' : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
            
            <button className={`p-6 border-2 border-dashed rounded-3xl flex items-center justify-center gap-2 transition-all group ${
              darkMode ? 'border-white/5 hover:border-indigo-500/50 bg-white/[0.02]' : 'border-slate-200 hover:border-indigo-200 bg-slate-50'
            }`}>
               <Plus className="text-indigo-500 group-hover:scale-110 transition-transform" />
               <span className="font-bold text-sm">Add New Configuration Key</span>
            </button>
          </div>
        ) : (
          /* Logs View */
          <div className={`backdrop-blur-xl border rounded-[40px] overflow-hidden shadow-2xl transition-all ${darkMode ? 'bg-[#16161e]/50 border-white/5' : 'bg-white border-slate-200'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className={`border-b text-[10px] uppercase tracking-widest font-black ${darkMode ? 'border-white/5 text-gray-500' : 'border-slate-100 text-slate-500'}`}>
                    <th className="px-10 py-6">Timestamp</th>
                    <th className="px-10 py-6">Action</th>
                    <th className="px-10 py-6">Key</th>
                    <th className="px-10 py-6">Changed By</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-white/5' : 'divide-slate-100'}`}>
                  {logs.map((log) => (
                    <tr key={log._id} className={darkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}>
                      <td className="px-10 py-6 text-sm font-mono opacity-50">{formatTimestamp(log.timestamp)}</td>
                      <td className="px-10 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-500' : 
                          log.action === 'UPDATE' ? 'bg-blue-500/10 text-blue-500' : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-10 py-6 font-bold font-mono text-sm">{log.key}</td>
                      <td className="px-10 py-6">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-500 text-xs font-black">
                              {log.updatedBy?.name?.charAt(0)}
                           </div>
                           <div className="text-sm">
                              <p className="font-bold">{log.updatedBy?.name}</p>
                              <p className="opacity-40 text-[10px]">{log.updatedBy?.email}</p>
                           </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length === 0 && (
                 <div className="p-20 text-center opacity-30 font-bold uppercase tracking-widest">No activity recorded yet</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConfig;
