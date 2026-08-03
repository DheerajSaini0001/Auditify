import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Globe, ArrowLeft, Loader2, PlusCircle, Sparkles, ShieldCheck, Link2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const AddWebsitePage = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { apiFetch } = useAuth();
  const { theme } = useContext(ThemeContext);
  const darkMode = theme === 'dark';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;

    setLoading(true);
    try {
      const { ok, data } = await apiFetch('/api/websites/add', {
        method: 'POST',
        body: JSON.stringify({ url }),
      });

      if (ok) {
        toast.success(data.message || 'Website added successfully!');
        navigate('/dashboard', { state: { invalidateCache: true } });
      } else {
        toast.error(data.message || 'Failed to add website');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6 relative overflow-hidden transition-colors duration-500">
      {/* Dynamic Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, -50, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className={`absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-1000 ${darkMode ? 'bg-blue-500/5' : 'bg-blue-400/20'
            }`}
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            x: [0, -50, 0],
            y: [0, 50, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className={`absolute -bottom-24 -right-24 w-[500px] h-[500px] rounded-full blur-[120px] transition-colors duration-1000 ${darkMode ? 'bg-indigo-500/5' : 'bg-indigo-400/20'
            }`}
        />
        <div className={`absolute inset-0 bg-[center_top_-1px] [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] transition-colors duration-1000 ${darkMode ? 'bg-grid-white' : 'bg-grid-black/[0.03]'
          }`} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full relative group"
      >
        {/* Subtle Outer Glow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-400 to-indigo-400 dark:from-blue-600 dark:to-indigo-600 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>

        <div className={`relative p-8 md:p-10 rounded-[2.5rem] backdrop-blur-3xl overflow-hidden transition-all duration-300 border shadow-2xl ${darkMode
            ? 'bg-[#16161e]/90 text-white border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.3)]'
            : 'bg-card/90 text-ink border-line shadow-[0_20px_60px_rgba(0,0,0,0.05)]'
          }`}>
          {/* Animated Scan Line */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-scan" />

          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0.5, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="mx-auto flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white mb-6 shadow-xl shadow-blue-500/40 relative overflow-hidden group/icon"
            >
              <Globe className="h-8 w-8 group-hover/icon:rotate-12 transition-transform duration-500 z-10" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/icon:opacity-100 transition-opacity" />
              <motion.div
                animate={{ top: ["-100%", "200%"] }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 w-full h-1/2 bg-white/30 -skew-y-12 pointer-events-none"
              />
            </motion.div>

            <h1 className={`text-3xl font-black tracking-tight mb-3 leading-tight transition-colors duration-300 ${darkMode ? 'text-white' : 'text-ink'
              }`}>
              Add <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Property</span>
            </h1>
            <p className={`text-xs font-semibold uppercase tracking-widest opacity-80 transition-colors duration-300 ${darkMode ? 'text-slate-400' : 'text-muted'
              }`}>
              Auditify Pro Engine
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className={`text-[10px] font-black uppercase tracking-[0.2em] transition-colors duration-300 ${darkMode ? 'text-slate-500' : 'text-faint'
                  }`}>
                  Website URL
                </label>
              </div>
              <div className="relative group">
                <div className={`absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-colors duration-300 ${darkMode ? 'group-focus-within:text-blue-400' : 'group-focus-within:text-blue-600'
                  }`}>
                  <Link2 className={`h-5 w-5 transition-colors duration-300 ${darkMode ? 'text-slate-600' : 'text-faint'
                    }`} />
                </div>
                <input
                  type="url"
                  required
                  autoFocus
                  className={`block w-full pl-14 pr-5 py-4 rounded-2xl border-2 transition-all text-base font-semibold shadow-sm outline-none ${darkMode
                      ? 'bg-white/5 border-white/5 text-white placeholder:text-slate-600 focus:bg-white/10 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10'
                      : 'bg-cardsoft border-line text-ink placeholder:text-faint focus:bg-card focus:border-accent focus:ring-4 focus:ring-accent/10'
                    }`}
                  placeholder="https://example.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </div>

            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`border rounded-2xl p-4 flex gap-4 items-start shadow-sm transition-all duration-300 ${darkMode
                  ? 'bg-blue-500/5 border-blue-500/10 shadow-blue-500/5'
                  : 'bg-blue-50/50 border-blue-100/50 shadow-blue-500/5'
                }`}
            >
              <div className="flex-shrink-0">
                <div className={`h-8 w-8 rounded-xl shadow-sm flex items-center justify-center transition-colors duration-300 ${darkMode ? 'bg-slate-900' : 'bg-white'
                  }`}>
                  <ShieldCheck className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <h4 className={`text-[10px] font-black mb-0.5 tracking-[0.1em] uppercase transition-colors duration-300 ${darkMode ? 'text-blue-200' : 'text-blue-900'
                  }`}>Security Note</h4>
                <p className={`text-[10px] font-semibold leading-relaxed transition-colors duration-300 ${darkMode ? 'text-blue-400/70' : 'text-blue-700/80'
                  }`}>
                  Ownership verification via GSC is required for full SEO & Traffic analytics.
                </p>
              </div>
            </motion.div>

            <div className="flex flex-col gap-4 pt-2">
              <motion.button
                whileHover={{ scale: 1.02, translateY: -1 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full h-14 flex items-center justify-center gap-3 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:shadow-xl hover:shadow-blue-500/30 disabled:opacity-50 transition-all uppercase tracking-widest relative overflow-hidden group/btn shadow-lg shadow-blue-600/20"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
                {loading ? (
                  <Loader2 className="animate-spin h-6 w-6" />
                ) : (
                  <>
                    <PlusCircle className="h-5 w-5" />
                    <span>Add Website</span>
                  </>
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className={`group flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] py-2 transition-all ${darkMode ? 'text-slate-500 hover:text-slate-200' : 'text-faint hover:text-ink'
                  }`}
              >
                <ArrowLeft className="h-3 w-3 transition-transform group-hover:-translate-x-1" />
                <span>Go Back</span>
              </button>
            </div>
          </form>
        </div>
      </motion.div>

    </div>
  );
};

export default AddWebsitePage;

