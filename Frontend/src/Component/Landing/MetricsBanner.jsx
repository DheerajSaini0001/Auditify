import React, { useContext, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { Activity, Globe2, ShieldCheck, Zap } from 'lucide-react';

const CountUpMetric = ({ value, label, delay, icon: Icon, darkMode }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div 
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay, ease: "easeOut" }}
            className={`
                relative flex flex-col items-center lg:items-start gap-4 p-8 rounded-[2.5rem] border transition-all duration-500 overflow-hidden group
                ${darkMode 
                    ? "bg-slate-900/40 border-white/5 hover:bg-slate-800/60 hover:border-emerald-500/30" 
                    : "bg-white border-slate-200 hover:bg-emerald-50 hover:border-emerald-200 shadow-xl shadow-slate-200/50 hover:shadow-emerald-500/5"}
            `}
        >
            {/* Background Glow on Hover */}
            <div className={`absolute -right-10 -bottom-10 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-700 bg-emerald-500`}></div>

            <div className={`
                w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 rotate-[10deg] group-hover:rotate-0 group-hover:scale-110
                ${darkMode ? "bg-emerald-500/10 text-emerald-400" : "bg-emerald-50 text-emerald-600"}
            `}>
                <Icon size={28} strokeWidth={2.5} />
            </div>
            
            <div className="space-y-1">
                <div className="flex items-baseline gap-1">
                    <span className={`text-4xl lg:text-5xl font-black transition-colors duration-500 ${darkMode ? 'text-white' : 'text-slate-900 hover:text-emerald-600'}`}>{value}</span>
                    <span className="text-xl font-black text-emerald-500">M+</span>
                </div>
                <p className={`text-[10px] font-black uppercase tracking-[0.25em] transition-colors duration-500 ${darkMode ? 'text-slate-500 group-hover:text-slate-300' : 'text-slate-400 group-hover:text-emerald-700'}`}>{label}</p>
            </div>
        </motion.div>
    );
};

const MetricsBanner = () => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === 'dark';
    
    const metrics = [
        { value: "4.2", label: "Monthly Audits", icon: Activity },
        { value: "190", label: "Global Nodes", icon: Globe2 },
        { value: "98", label: "Uptime Score", icon: Zap },
        { value: "500", label: "Billion Scans", icon: ShieldCheck }
    ];

    return (
        <section className={`relative pt-12 pb-24 overflow-hidden transition-colors duration-500 ${darkMode ? 'bg-[#0A0F1E]' : 'bg-slate-50'}`}>
            <div className="container mx-auto px-6 relative z-10 max-w-7xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {metrics.map((m, i) => (
                        <CountUpMetric key={i} {...m} delay={i * 0.15} darkMode={darkMode} />
                    ))}
                </div>
            </div>

            {/* Decorative Gradient Line */}
            <div className={`absolute bottom-0 left-0 w-full h-[1px] ${darkMode ? 'bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent' : 'bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent'}`}></div>
        </section>
    );
};

export default MetricsBanner;

