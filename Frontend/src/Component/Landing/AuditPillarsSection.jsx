import React, { useContext, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Search, Accessibility, ShieldCheck, LayoutDashboard, Cpu, Target, ArrowUpRight, Sparkles } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext.jsx';

// ─── Color tokens ────────────────────────────────────────────────────────────
const COLOR_MAP = {
    emerald: {
        bg: 'from-emerald-500/10 to-teal-500/5',
        text: 'text-emerald-500',
        glow: 'rgba(16, 185, 129, 0.15)',
        ring: 'ring-emerald-500/20',
    },
    blue: {
        bg: 'from-blue-500/10 to-indigo-500/5',
        text: 'text-blue-500',
        glow: 'rgba(59, 130, 246, 0.15)',
        ring: 'ring-blue-500/20',
    },
    purple: {
        bg: 'from-violet-500/10 to-purple-600/5',
        text: 'text-violet-500',
        glow: 'rgba(139, 92, 246, 0.15)',
        ring: 'ring-violet-500/20',
    },
    red: {
        bg: 'from-rose-500/10 to-red-600/5',
        text: 'text-rose-500',
        glow: 'rgba(244, 63, 94, 0.15)',
        ring: 'ring-rose-500/20',
    },
    cyan: {
        bg: 'from-cyan-400/10 to-sky-500/5',
        text: 'text-cyan-500',
        glow: 'rgba(6, 182, 212, 0.15)',
        ring: 'ring-cyan-500/20',
    },
    orange: {
        bg: 'from-orange-400/10 to-amber-500/5',
        text: 'text-orange-500',
        glow: 'rgba(249, 115, 22, 0.15)',
         ring: 'ring-orange-500/20',
    },
    pink: {
        bg: 'from-pink-500/10 to-rose-500/5',
        text: 'text-pink-500',
        glow: 'rgba(236, 72, 153, 0.15)',
        ring: 'ring-pink-500/20',
    },
};

// ─── PillarCard ───────────────────────────────────────────────────────────────
const PillarCard = ({ icon: Icon, title, tag, description, color, index, darkMode, isWide }) => {
    const c = COLOR_MAP[color];
    const cardRef = useRef(null);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        setMousePosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={`group relative h-full rounded-[2.5rem] overflow-hidden backdrop-blur-xl transition-all duration-700
                ${darkMode 
                    ? 'bg-slate-900/40 border border-white/5 hover:border-white/10 shadow-2xl shadow-black/20' 
                    : 'bg-white/60 hover:bg-white border border-slate-200/60 hover:border-slate-300 shadow-xl shadow-slate-200/20'}
                ${isWide ? 'md:col-span-2 lg:col-span-2 lg:flex lg:items-center' : 'flex flex-col'}
            `}
        >
            {/* Subtle Sub-background Fill on Hover */}
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-gradient-to-br ${c.bg} pointer-events-none`} />

            {/* Premium Mouse Tracking Glow Effect */}
            <div
                className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
                style={{
                    background: isHovered ? `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, ${c.glow}, transparent 40%)` : 'none',
                }}
            />

            {/* Content Container */}
            <div className={`relative z-10 p-8 sm:p-10 ${isWide ? 'lg:w-1/2 lg:pr-4' : 'flex-1 flex flex-col'}`}>
                {/* Header (Icon + Badge) */}
                <div className="flex items-start justify-between mb-8">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center
                        transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3
                        ring-1 ring-inset ${c.ring}
                        ${darkMode ? 'bg-white/5 shadow-inner shadow-white/10' : 'bg-slate-50 shadow-inner shadow-slate-200/50'}
                        ${c.text}
                    `}>
                        <Icon size={26} strokeWidth={2} />
                    </div>

                    {!isWide && (
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] border
                            transition-colors duration-500
                            ${darkMode 
                                ? 'bg-white/5 border-white/5 text-slate-400 group-hover:border-white/10 group-hover:text-slate-200' 
                                : 'bg-slate-50 border-slate-200 text-slate-500 group-hover:bg-white group-hover:border-slate-300 group-hover:text-slate-700'}
                        `}>
                            {tag}
                        </span>
                    )}
                </div>

                {/* Text Content */}
                <div className={`${!isWide && 'mt-auto'} space-y-4`}>
                    <h3 className={`text-2xl lg:text-[1.7rem] font-bold tracking-tight leading-none
                        ${darkMode ? 'text-white' : 'text-slate-900'}
                    `}
                        style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                        {title}
                    </h3>
                    <p className={`text-[15px] leading-relaxed
                        ${darkMode ? 'text-slate-400 group-hover:text-slate-300' : 'text-slate-500 group-hover:text-slate-600'}
                        transition-colors duration-300
                    `}>
                        {description}
                    </p>
                </div>

                {/* Corner Arrow (for non-wide cards) */}
                {!isWide && (
                    <div className={`absolute bottom-8 right-8 w-10 h-10 rounded-full flex items-center justify-center
                        opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0
                        transition-all duration-500 ease-out
                        ${darkMode ? 'bg-white/10 text-white' : 'bg-slate-900 text-white shadow-lg'}
                    `}>
                        <ArrowUpRight size={18} strokeWidth={2} />
                    </div>
                )}
            </div>

            {/* Custom visual for the wide card on desktop */}
            {isWide && (
                <div className="hidden lg:flex relative z-10 flex-1 p-8 items-center justify-center">
                    <div className={`absolute inset-0 ml-10 rounded-tl-3xl border-t border-l ${darkMode ? 'border-white/10 bg-white/[0.02]' : 'border-slate-200 bg-slate-50/50'} overflow-hidden`}>
                         <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none"
                            style={{ background: `radial-gradient(circle, ${c.glow}, transparent 70%)`, filter: 'blur(40px)' }} />
                         
                         {/* Abstract UI placeholder */}
                         <div className="w-full h-full p-8 space-y-4">
                             <div className={`w-32 h-4 rounded-full ${darkMode ? 'bg-white/10' : 'bg-slate-200'}`}></div>
                             <div className={`w-48 h-4 rounded-full ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}></div>
                             <div className="flex gap-4 mt-8">
                                 <div className={`w-16 h-16 rounded-2xl ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}></div>
                                 <div className={`w-24 h-16 rounded-2xl ${darkMode ? 'bg-white/5' : 'bg-slate-100'}`}></div>
                             </div>
                         </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};

// ─── Section ──────────────────────────────────────────────────────────────────
const AuditPillarsSection = () => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === 'dark';

    const pillars = [
        {
            icon: Zap,
            title: 'Performance',
            tag: 'Core Web Vitals',
            description: 'Deep core web vitals analysis including LCP, FID, and CLS directly from the source to guarantee lightning speed.',
            color: 'emerald',
        },
        {
            icon: Search,
            title: 'On-Page SEO',
            tag: 'Search Visibility',
            description: 'Meta coverage, internal linking architecture, schema validation, and precision keyword density mapping.',
            color: 'blue',
        },
        {
            icon: Accessibility,
            title: 'Accessibility',
            tag: 'WCAG 2.1',
            description: 'Determine WCAG compliance levels using advanced axe-core intelligence to ensure universal access.',
            color: 'purple',
        },
        {
            icon: ShieldCheck,
            title: 'Security',
            tag: 'Vulnerability',
            description: 'WAF detection, SSL validation, HTTP header hardening, and comprehensive vulnerability scanning.',
            color: 'red',
        },
        {
            icon: LayoutDashboard,
            title: 'UX & Structure',
            tag: 'User Experience',
            description: 'Heatmap-style element distribution, content hierarchy mapping, and touch target scaling analysis.',
            color: 'cyan',
        },
        {
            icon: Cpu,
            title: 'AIO Readiness',
            tag: 'AI Optimization',
            description: 'Ensure your content is perfectly structured for the LLM-search era with advanced AEO readiness scoring.',
            color: 'orange',
        },
        {
            icon: Target,
            title: 'Conversion Flow',
            tag: 'Lead Opimization',
            description: 'Analyze lead-flow friction points, CTA placements, interactive visibility, and critical form optimizations.',
            color: 'pink',
            isWide: true // Flags the last item to be wide in the bento grid
        },
    ];

    return (
        <section
            id="features"
            className={`relative py-32 transition-colors duration-500 overflow-hidden ${darkMode ? 'bg-[#080E1C]' : 'bg-[#F5F7FA]'}`}
        >
            {/* ── Background Aesthetics ── */}
            <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-5%] w-[800px] h-[800px] rounded-full opacity-30"
                    style={{ background: 'radial-gradient(circle, #10b98120 0%, transparent 60%)', filter: 'blur(80px)' }} />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
                    style={{ background: 'radial-gradient(circle, #3b82f620 0%, transparent 60%)', filter: 'blur(80px)' }} />
                
                {/* Tech Grid Pattern */}
                <div className="absolute inset-0"
                    style={{
                        backgroundImage: `linear-gradient(${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px), linear-gradient(90deg, ${darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'} 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                        maskImage: 'radial-gradient(circle at center, black, transparent 80%)',
                        WebkitMaskImage: 'radial-gradient(circle at center, black, transparent 80%)'
                    }}
                />
            </div>

            <div className="container mx-auto px-6 relative z-10 max-w-7xl">

                {/* ── Header ── */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-20">
                    <div className="space-y-6 max-w-2xl">
                        {/* Eyebrow Pill */}
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-full border text-[11px] font-bold uppercase tracking-[0.25em] backdrop-blur-md
                                ${darkMode ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 shadow-sm border-emerald-200 text-emerald-700'}
                            `}
                        >
                            <Sparkles size={14} className="text-emerald-500" />
                            The Standard for Auditing
                        </motion.div>

                        {/* Animated Headline */}
                        <motion.h2
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                            className={`text-5xl lg:text-[4.5rem] font-black tracking-tight leading-[0.95]
                                ${darkMode ? 'text-white' : 'text-slate-900'}
                            `}
                            style={{ fontFamily: "'Syne', sans-serif" }}
                        >
                            The Dimensions of{' '}
                            <br className="hidden sm:block" />
                            <span className="relative inline-block pb-2">
                                <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 bg-clip-text text-transparent">
                                    Website Intelligence.
                                </span>
                                {/* Decorative underline */}
                                <div className="absolute bottom-0 left-0 w-full h-[6px] rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500 opacity-50 blur-[2px]" />
                            </span>
                        </motion.h2>
                    </div>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className={`text-lg font-medium lg:max-w-[280px] leading-relaxed
                            ${darkMode ? 'text-slate-400' : 'text-slate-500'}
                        `}
                    >
                        Comprehensive testing across 7 core vectors to ensure absolute peak digital performance.
                    </motion.p>
                </div>

                {/* ── Bento Grid ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                    {pillars.map((p, i) => (
                         <div key={p.title} className={p.isWide ? 'md:col-span-2 lg:col-span-3' : ''}>
                             <PillarCard {...p} index={i} darkMode={darkMode} />
                         </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AuditPillarsSection;
