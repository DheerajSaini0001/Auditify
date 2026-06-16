import React, { useContext, useRef, useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ThemeContext } from '../../context/ThemeContext.jsx';
import { Activity, Globe2, ShieldCheck, Zap, TrendingUp, Cpu, Eye, Lock, Layers } from 'lucide-react';
import metricsBg from '../../assets/metrics_bg.png';

const useCountUp = (target, duration = 1600, isActive = false) => {
    const [current, setCurrent] = useState(0);
    useEffect(() => {
        if (!isActive) return;
        let start = null;
        const numeric = parseFloat(target);
        const isDecimal = target.toString().includes('.');
        const step = (timestamp) => {
            if (!start) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const value = eased * numeric;
            setCurrent(isDecimal ? value.toFixed(1) : Math.floor(value));
            if (progress < 1) requestAnimationFrame(step);
            else setCurrent(isDecimal ? numeric.toFixed(1) : numeric);
        };
        requestAnimationFrame(step);
    }, [isActive, target, duration]);
    return current;
};

const MetricCard = ({ value, suffix, label, sublabel, icon: Icon, accentColor, delay, darkMode }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: '-60px' });
    const counted = useCountUp(value, 1600, isInView);

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
            className={`relative flex flex-col gap-4 p-6 rounded-2xl border
                ${darkMode
                    ? 'bg-white/[0.03] border-white/8 hover:border-white/14'
                    : 'bg-card border-line hover:border-line shadow-sm'}
                transition-colors duration-300`}
        >
            {/* Top row */}
            <div className="flex items-center justify-between">
                <p className={`text-xs font-semibold uppercase tracking-[0.2em]
                    ${darkMode ? 'text-white' : 'text-muted'}`}>
                    {label}
                </p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${accentColor}15`, color: accentColor }}>
                    <Icon size={17} strokeWidth={2} />
                </div>
            </div>

            {/* Number */}
            <div className="flex items-baseline gap-0.5">
                <span className={`text-5xl font-black tabular-nums tracking-tight
                    ${darkMode ? 'text-white' : 'text-ink'}`}>
                    {counted}
                </span>
                {suffix && (
                    <span className="text-2xl font-black" style={{ color: accentColor }}>{suffix}</span>
                )}
            </div>

            {/* Sublabel */}
            <p className={`text-sm leading-relaxed
                ${darkMode ? 'text-white/90' : 'text-muted'}`}>
                {sublabel}
            </p>
        </motion.div>
    );
};

const AUDIT_DIMS = [
    { icon: <TrendingUp size={11} />, label: 'Technical Performance' },
    { icon: <Eye size={11} />, label: 'On-Page SEO' },
    { icon: <Layers size={11} />, label: 'Accessibility' },
    { icon: <Lock size={11} />, label: 'Security' },
    { icon: <Activity size={11} />, label: 'UX & Content' },
    { icon: <Globe2 size={11} />, label: 'Lead Flow' },
    { icon: <Cpu size={11} />, label: 'AIO Readiness' },
];

const MetricsBanner = () => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === 'dark';

    const metrics = [
        { value: '12', suffix: 'K+', label: 'Audits Run', sublabel: 'Websites analyzed across all 7 automotive dimensions', icon: Activity, accentColor: '#ea580c' },
        { value: '7', suffix: null, label: 'Audit Types', sublabel: 'From local map pack SEO to AI search rankings', icon: Cpu, accentColor: '#3b82f6' },
        { value: '98', suffix: '%', label: 'Risk Removed', sublabel: 'Average reduction in ADA lawsuit vulnerability', icon: Zap, accentColor: '#f97316' },
        { value: '4.9', suffix: '/5', label: 'Dealer Rating', sublabel: 'Rated by general managers & marketing directors', icon: ShieldCheck, accentColor: '#6366f1' },
    ];

    const sectionRef = useRef(null);
    const isInView = useInView(sectionRef, { once: true, margin: '-80px' });

    return (
        <section
            ref={sectionRef}
            className="relative pt-16 pb-10 transition-colors duration-500 bg-surface overflow-hidden"
        >
            {/* Dark theme keeps the photographic background + blue overlay.
                Light theme uses the plain cream surface (no image). */}
            {darkMode && (
                <>
                    <div
                        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat bg-fixed"
                        style={{ backgroundImage: `url(${metricsBg})` }}
                    />
                    <div className="absolute inset-0 z-0 bg-blue-900/90 transition-colors duration-500" />
                </>
            )}

            <div className="container mx-auto px-6 max-w-7xl space-y-12 relative z-10">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col lg:flex-row lg:items-end justify-between gap-8"
                >
                    <div className="space-y-3">
                        <p className={`text-xs font-semibold uppercase tracking-[0.25em]
                            ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                            DealerPulse at a Glance
                        </p>
                        <h2 className={`text-3xl lg:text-4xl font-black tracking-tight leading-tight
                            ${darkMode ? 'text-white' : 'text-ink'}`}
                            style={{ fontFamily: "'Syne', sans-serif" }}>
                            Built for dealers who take{' '}
                            <span style={{ color: '#ea580c' }}>website performance seriously.</span>
                        </h2>
                    </div>

                    {/* Pills */}
                    <div className="flex flex-wrap gap-2 lg:justify-end lg:max-w-xs">
                        {AUDIT_DIMS.map((d, i) => (
                            <motion.span
                                key={d.label}
                                initial={{ opacity: 0 }}
                                animate={isInView ? { opacity: 1 } : {}}
                                transition={{ delay: 0.1 + i * 0.05 }}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border
                                    ${darkMode
                                        ? 'bg-white/4 border-white/8 text-white'
                                        : 'bg-card border-line text-muted shadow-sm'}`}
                            >
                                <span className="text-orange-350">{d.icon}</span>
                                {d.label}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>

                {/* Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {metrics.map((m, i) => (
                        <MetricCard key={i} {...m} delay={i * 0.08} darkMode={darkMode} />
                    ))}
                </div>

                {/* Divider */}
                <div className={`w-full h-px ${darkMode ? 'bg-white/8' : 'bg-line'}`} />
            </div>
        </section>
    );
};

export default MetricsBanner;