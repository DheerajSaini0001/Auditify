import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Zap, Search, Accessibility, ShieldCheck, LayoutDashboard, Cpu, Target, Sparkles } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext.jsx';

const COLOR_MAP = {
    orange: { text: 'text-orange-400', accent: '#f97316', bg: '#f9731610' },
    blue: { text: 'text-blue-400', accent: '#3b82f6', bg: '#3b82f610' },
    purple: { text: 'text-violet-400', accent: '#8b5cf6', bg: '#8b5cf610' },
    red: { text: 'text-rose-400', accent: '#f43f5e', bg: '#f43f5e10' },
    cyan: { text: 'text-cyan-400', accent: '#06b6d4', bg: '#06b6d410' },
    amber: { text: 'text-amber-400', accent: '#f59e0b', bg: '#f59e0b10' },
    indigo: { text: 'text-indigo-400', accent: '#6366f1', bg: '#6366f110' },
};

const PillarCard = ({ icon: Icon, title, tag, description, color, index, darkMode, isWide }) => {
    const c = COLOR_MAP[color];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.5, delay: index * 0.06 }}
            className={`relative h-full rounded-2xl border p-7 flex flex-col gap-5
                ${isWide ? 'lg:flex-row lg:items-stretch' : ''}
                ${darkMode
                    ? 'bg-white/[0.02] border-white/8 hover:border-white/14'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'}
                transition-colors duration-300`}
        >
            {/* Left / Main content */}
            <div className={`flex flex-col gap-4 ${isWide ? 'lg:flex-1' : 'flex-1'}`}>
                {/* Icon + Tag */}
                <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: c.bg, color: c.accent }}>
                        <Icon size={20} strokeWidth={2} />
                    </div>
                    <span className={`text-[9px] fontsemibold uppercase tracking-[0.2em] px-3 py-1 rounded-full border
                        ${darkMode
                            ? 'bg-white/4 border-white/8 text-slate-500'
                            : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                        {tag}
                    </span>
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h3 className={`text-lg fontsemibold leading-snug
                        ${darkMode ? 'text-white' : 'text-slate-900'}`}
                        style={{ fontFamily: "'Syne', sans-serif" }}>
                        {title}
                    </h3>
                    <p className={`text-sm leading-relaxed
                        ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        {description}
                    </p>
                </div>
            </div>

            {/* Wide card right panel — simple stats */}
            {isWide && (
                <div className={`lg:w-72 flex flex-col justify-center gap-4 lg:pl-8
                    ${darkMode ? 'lg:border-l border-white/6' : 'lg:border-l border-slate-100'}`}>
                    {[
                        { label: 'Form Completion Rate', value: '94%', bar: 94 },
                        { label: 'CRM Webhook Health', value: '100%', bar: 100 },
                        { label: 'Lead Response Time', value: '< 2min', bar: 78 },
                    ].map((stat) => (
                        <div key={stat.label} className="space-y-1.5">
                            <div className="flex justify-between items-center">
                                <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{stat.label}</span>
                                <span className={`text-xs fontsemibold ${c.text}`}>{stat.value}</span>
                            </div>
                            <div className={`h-1 rounded-full w-full ${darkMode ? 'bg-white/6' : 'bg-slate-100'}`}>
                                <motion.div
                                    initial={{ width: 0 }}
                                    whileInView={{ width: `${stat.bar}%` }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.9, ease: 'easeOut' }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: c.accent }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

const AuditPillarsSection = () => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === 'dark';

    const pillars = [
        { icon: Zap, title: 'Website Performance', tag: 'Speed & Loading', description: 'We check how fast your website loads on mobile and desktop, including page speed, layout stability, and user interaction performance.', color: 'orange' },
        { icon: Search, title: 'SEO Optimization', tag: 'Search Visibility', description: 'We analyze your SEO setup including page titles, keywords, indexing, schema markup, and search visibility to help rank better on Google.', color: 'blue' },
        { icon: Accessibility, title: 'Accessibility Check', tag: 'WCAG Compliance', description: 'We test your website for accessibility issues to make sure it can be used by everyone, including people with disabilities.', color: 'purple' },
        { icon: ShieldCheck, title: 'Website Security', tag: 'Security Audit', description: 'We scan for SSL issues, security risks, unsafe headers, firewall problems, and suspicious activity to keep your website secure.', color: 'red' },
        { icon: LayoutDashboard, title: 'User Experience', tag: 'Layout & Navigation', description: 'We review your website design, navigation, spacing, mobile responsiveness, and button accessibility for easy browsing.', color: 'cyan' },
        { icon: Cpu, title: 'AI Search Optimization', tag: 'AI & Smart Search', description: 'We check whether your content and structure are optimized for AI-based search platforms like ChatGPT, Gemini, and voice search.', color: 'amber' },
        { icon: Target, title: 'Conversion Tracking', tag: 'Conversion Flow', description: 'We test contact forms, integrations, tracking systems, and lead flows to make sure users can submit inquiries without issues.', color: 'indigo', isWide: true },
    ];

    return (
        <section
            id="features"
            className={`py-24 transition-colors duration-500 ${darkMode ? 'bg-[#07070f]' : 'bg-[#f0f2f7]'}`}
        >
            <div className="container mx-auto px-6 max-w-7xl">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
                    <div className="space-y-4 max-w-xl">
                        <motion.div
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[9px] fontsemibold uppercase tracking-[0.25em]
                                ${darkMode ? 'bg-orange-350/8 border-orange-350/15 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-600'}`}
                        >
                            <Sparkles size={11} className="text-orange-350" />
                            Powered by DealerSales.co
                        </motion.div>

                        <motion.h2
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className={`text-4xl lg:text-5xl font-black tracking-tight leading-[1.05]
                                ${darkMode ? 'text-white' : 'text-slate-900'}`}
                            style={{ fontFamily: "'Syne', sans-serif" }}
                        >
                            The Dimensions of{' '}
                            <span style={{ color: '#ea580c' }}>Dealership Intelligence.</span>
                        </motion.h2>
                    </div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className={`lg:max-w-[240px] text-sm leading-relaxed
                            ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}
                    >
                        Comprehensive scanning across 7 critical channels to guarantee peak visibility.
                    </motion.p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pillars.map((p, i) => (
                        <div key={p.title}
                            className={p.isWide ? 'col-span-1 md:col-span-2 lg:col-span-3' : ''}
                        >
                            <PillarCard {...p} index={i} darkMode={darkMode} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AuditPillarsSection;