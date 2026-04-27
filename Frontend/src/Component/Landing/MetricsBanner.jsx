import React, { useContext, useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { Activity, Globe2, ShieldCheck, Zap, TrendingUp, Cpu, Eye, Lock, Layers } from 'lucide-react';

/* ─────────────────────────────────────────
   Animated number count-up hook
───────────────────────────────────────── */
const useCountUp = (target, duration = 1800, isActive = false) => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        if (!isActive) return;
        let start = null;
        const numeric = parseFloat(target);
        const isDecimal = target.toString().includes('.');

        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            const value = eased * numeric;
            setCurrent(isDecimal ? value.toFixed(1) : Math.floor(value));
            if (progress < 1) requestAnimationFrame(step);
            else setCurrent(isDecimal ? numeric.toFixed(1) : numeric);
        };

        requestAnimationFrame(step);
    }, [isActive, target, duration]);

    return current;
};

/* ─────────────────────────────────────────
   Single Metric Card
───────────────────────────────────────── */
const MetricCard = ({ value, suffix, label, sublabel, icon: Icon, accentColor, delay, darkMode }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-60px" });
    const counted = useCountUp(value, 1600, isInView);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 28 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
            className={`relative group flex flex-col justify-between gap-6 p-7 rounded-[2rem] border overflow-hidden transition-all duration-400
                ${darkMode
                    ? 'bg-[#020617]/70 border-white/6 hover:border-white/12'
                    : 'bg-white border-slate-100 shadow-sm shadow-slate-100 hover:shadow-md hover:shadow-slate-200/60'}`}
        >
            {/* Ambient corner glow */}
            <div
                className="absolute -top-6 -right-6 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`, filter: 'blur(20px)' }}
            />

            {/* Top row: icon + label */}
            <div className="flex items-start justify-between">
                <div>
                    <p className={`text-[10px] font-bold uppercase tracking-[0.22em] mb-1
                        ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                        {label}
                    </p>
                    <p className={`text-[11px] font-medium leading-snug max-w-[140px]
                        ${darkMode ? 'text-slate-600' : 'text-slate-400'}`}>
                        {sublabel}
                    </p>
                </div>
                <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-[-6deg]"
                    style={{ background: `${accentColor}18`, color: accentColor }}
                >
                    <Icon size={20} strokeWidth={2} />
                </div>
            </div>

            {/* Number */}
            <div className="flex items-baseline gap-1">
                <span
                    className="text-5xl font-black tabular-nums tracking-tight leading-none"
                    style={{ color: darkMode ? '#f1f5f9' : '#0f172a' }}
                >
                    {counted}
                </span>
                {suffix && (
                    <span className="text-2xl font-black" style={{ color: accentColor }}>
                        {suffix}
                    </span>
                )}
            </div>

            {/* Bottom accent line */}
            <div
                className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-700 rounded-full"
                style={{ background: `linear-gradient(90deg, ${accentColor}, transparent)` }}
            />
        </motion.div>
    );
};

/* ─────────────────────────────────────────
   Audit type list — displayed as a strip
───────────────────────────────────────── */
const AUDIT_DIMS = [
    { icon: <TrendingUp size={12} />, label: "Technical Performance" },
    { icon: <Eye size={12} />,        label: "On-Page SEO" },
    { icon: <Layers size={12} />,     label: "Accessibility" },
    { icon: <Lock size={12} />,       label: "Security & Compliance" },
    { icon: <Activity size={12} />,   label: "UX & Content" },
    { icon: <Globe2 size={12} />,     label: "Conversion & Lead Flow" },
    { icon: <Cpu size={12} />,        label: "AIO Readiness" },
];

/* ─────────────────────────────────────────
   Main Banner
───────────────────────────────────────── */
const MetricsBanner = () => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === 'dark';

    const metrics = [
        {
            value: "12",
            suffix: "K+",
            label: "Audits Run",
            sublabel: "Websites analysed across all 7 dimensions",
            icon: Activity,
            accentColor: "#8b5cf6",
        },
        {
            value: "7",
            suffix: null,
            label: "Audit Types",
            sublabel: "From core SEO to AI-readiness checks",
            icon: Cpu,
            accentColor: "#3b82f6",
        },
        {
            value: "98",
            suffix: "%",
            label: "Uptime",
            sublabel: "Always-on infrastructure, zero queuing",
            icon: Zap,
            accentColor: "#f59e0b",
        },
        {
            value: "4.9",
            suffix: "/5",
            label: "User Rating",
            sublabel: "Rated by founders, devs & SEO teams",
            icon: ShieldCheck,
            accentColor: "#a78bfa",
        },
    ];

    const sectionRef = useRef(null);
    const isSectionInView = useInView(sectionRef, { once: true, margin: "-80px" });

    return (
        <section
            ref={sectionRef}
            className={`relative pt-10 pb-20 overflow-hidden transition-colors duration-500
                ${darkMode ? 'bg-[#020617]' : 'bg-[#F8FAFC]'}`}
        >
            {/* Subtle background texture */}
            <div
                className="absolute inset-0 pointer-events-none opacity-[0.025]"
                style={{
                    backgroundImage: `radial-gradient(circle, ${darkMode ? '#fff' : '#000'} 1px, transparent 1px)`,
                    backgroundSize: '24px 24px',
                }}
            />

            <div className="container mx-auto px-6 relative z-10 max-w-7xl space-y-12">

                {/* Section header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={isSectionInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
                >
                    <div className="space-y-2">
                        <span className={`inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em]
                            ${darkMode ? 'text-violet-400' : 'text-violet-600'}`}>
                            <span className="w-4 h-px bg-current inline-block" />
                            Platform at a glance
                        </span>
                        <h2 className={`text-3xl lg:text-4xl font-black tracking-tight leading-tight
                            ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Built for teams who take <br className="hidden lg:block" />
                            <span className="text-transparent bg-clip-text"
                                style={{ backgroundImage: 'linear-gradient(135deg, #8b5cf6, #a78bfa)' }}>
                                website quality seriously.
                            </span>
                        </h2>
                    </div>

                    {/* 7 audit type pills — horizontal on desktop */}
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                        {AUDIT_DIMS.map((d, i) => (
                            <motion.span
                                key={d.label}
                                initial={{ opacity: 0, scale: 0.88 }}
                                animate={isSectionInView ? { opacity: 1, scale: 1 } : {}}
                                transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold border
                                    ${darkMode
                                        ? 'bg-white/4 border-white/8 text-slate-400'
                                        : 'bg-white border-slate-200 text-slate-500 shadow-sm'}`}
                            >
                                <span className="text-violet-500">{d.icon}</span>
                                {d.label}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>

                {/* Metric cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {metrics.map((m, i) => (
                        <MetricCard key={i} {...m} delay={i * 0.12} darkMode={darkMode} />
                    ))}
                </div>

                {/* Bottom thin divider */}
                <div className={`w-full h-px ${darkMode
                    ? 'bg-gradient-to-r from-transparent via-white/8 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-slate-200 to-transparent'}`}
                />
            </div>
        </section>
    );
};

export default MetricsBanner;
