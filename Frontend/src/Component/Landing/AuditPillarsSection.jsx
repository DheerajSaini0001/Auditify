import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Zap, Search, Accessibility, ShieldCheck, LayoutDashboard, Cpu, Target, ArrowUpRight } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext.jsx';

const PillarCard = ({ icon: Icon, title, description, color, index, darkMode }) => {
    const colors = {
        emerald: 'from-emerald-500 to-teal-500',
        blue: 'from-blue-500 to-indigo-500',
        purple: 'from-purple-500 to-pink-500',
        red: 'from-rose-500 to-red-600',
        cyan: 'from-cyan-400 to-blue-500',
        orange: 'from-orange-400 to-amber-600',
        pink: 'from-pink-500 to-rose-500'
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, delay: index * 0.1, ease: "easeOut" }}
            className="group relative h-full"
        >
            <div className={`
                relative z-10 h-full p-8 rounded-[3rem] border transition-all duration-500 overflow-hidden flex flex-col items-start
                ${darkMode 
                    ? "bg-slate-900/40 border-white/5 hover:bg-slate-900/60 hover:border-white/10" 
                    : "bg-white border-slate-200 hover:border-slate-300 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-slate-200/60"}
            `}>
                {/* Background Gradient on Hover */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-700 bg-gradient-to-br ${colors[color]}`}></div>
                
                <div className={`
                    w-16 h-16 rounded-2xl mb-8 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-[15deg] shadow-lg
                    bg-gradient-to-br ${colors[color]} text-white
                `}>
                    <Icon size={28} strokeWidth={2.5} />
                </div>

                <div className="flex-1 space-y-4">
                    <h3 className={`text-2xl lg:text-3xl font-black tracking-tight leading-tight transition-colors duration-500 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {title}
                    </h3>
                    <p className={`text-md font-medium leading-relaxed transition-colors duration-500 ${darkMode ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-700'}`}>
                        {description}
                    </p>
                </div>

                <div className="pt-8 mt-4 w-full border-t border-transparent group-hover:border-slate-500/10 transition-colors">
                    <div className="flex items-center justify-between w-full">
                        <span className={`text-[10px] font-black uppercase tracking-[0.25em] ${darkMode ? 'text-slate-600 group-hover:text-slate-400' : 'text-slate-400 group-hover:text-slate-600'}`}>Core Vector {index + 1}</span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500 translate-x-4 group-hover:translate-x-0 ${darkMode ? 'bg-white/5 text-white' : 'bg-slate-100 text-slate-900'}`}>
                            <ArrowUpRight size={14} strokeWidth={3} />
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Float Decoration */}
            <div className={`absolute -top-4 -right-4 w-24 h-24 blur-[60px] opacity-0 group-hover:opacity-20 transition-opacity duration-1000 bg-gradient-to-br ${colors[color]}`}></div>
        </motion.div>
    );
};

const AuditPillarsSection = () => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === 'dark';

    const pillars = [
        { icon: Zap, title: "Performance", description: "Deep core web vitals analysis including LCP, FID, and CLS directly from the source.", color: "emerald" },
        { icon: Search, title: "On-Page SEO", description: "Meta coverage, internal linking, schema validation, and keyword density mapping.", color: "blue" },
        { icon: Accessibility, title: "Accessibility", description: "WCAG 2.1 compliance check using advanced axe-core intelligence engines.", color: "purple" },
        { icon: ShieldCheck, title: "Security", description: "WAF detection, SSL validation, header hardening, and vulnerability scanning.", color: "red" },
        { icon: LayoutDashboard, title: "UX & Structure", description: "Heatmap-style element distribution, content hierarchy, and touch target scaling.", color: "cyan" },
        { icon: Cpu, title: "AIO Readiness", description: "AI Optimization — ensure your content is perfectly ready for the LLM-search era.", color: "orange" },
        { icon: Target, title: "Conversion", description: "Lead-flow friction analysis, CTA placement and visibility, and form optimization.", color: "pink" }
    ];

    return (
        <section id="features" className={`relative py-32 transition-colors duration-500 ${darkMode ? 'bg-[#0A0F1E]' : 'bg-slate-50'}`}>
            <div className="container mx-auto px-6 relative z-10 max-w-7xl">
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-24">
                    <div className="space-y-6 max-w-3xl">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-black text-[11px] uppercase tracking-[0.25em]"
                        >
                            The Standard for Auditing
                        </motion.div>
                        <h2 className={`text-5xl lg:text-[5rem] font-black tracking-tight leading-[0.95] ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            The Dimensions of <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Website Intelligence.</span>
                        </h2>
                    </div>
                    <p className={`text-xl font-bold lg:max-w-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Comprehensive testing across 7 core vectors to ensure peak digital performance.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pillars.map((p, i) => (
                        <div key={i} className={i >= 6 ? "md:col-span-2 lg:col-span-1" : ""}>
                            <PillarCard {...p} index={i} darkMode={darkMode} />
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Global Gradient Blob Background */}
            <div className="absolute top-[30%] left-[-10%] w-[40%] h-[600px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="absolute bottom-[20%] right-[-10%] w-[40%] h-[600px] bg-blue-500/5 blur-[120px] rounded-full pointer-events-none"></div>
        </section>
    );
};

export default AuditPillarsSection;

