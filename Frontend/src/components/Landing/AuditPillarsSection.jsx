import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { Zap, Search, Accessibility, ShieldCheck, LayoutDashboard, Cpu, Target, Sparkles } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext.jsx';

// The pillars used to run through a seven-hue rainbow (blue/purple/rose/cyan/amber/
// indigo), none of which are brand colours. Colour was never carrying meaning here —
// each card is already identified by its icon, title and tag — so these now cycle
// through the three approved neutrals-plus-accent, which keeps the grid varied
// without inventing palette. Keys keep their old names so the pillar list below
// (and anything else referencing them) does not have to change.
const COLOR_MAP = {
    orange: { text: 'text-accent', accent: '#F26419', bg: '#F2641914' },  /* Performance Orange */
    blue: { text: 'text-ink', accent: '#101C2C', bg: '#101C2C12' },       /* Heritage Navy      */
    purple: { text: 'text-inksoft', accent: '#303945', bg: '#30394512' }, /* Graphite           */
    red: { text: 'text-accent', accent: '#F26419', bg: '#F2641914' },
    cyan: { text: 'text-ink', accent: '#101C2C', bg: '#101C2C12' },
    amber: { text: 'text-inksoft', accent: '#303945', bg: '#30394512' },
    indigo: { text: 'text-ink', accent: '#101C2C', bg: '#101C2C12' },
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
                    : 'bg-card border-line hover:border-line shadow-sm'}
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
                   
                </div>

                {/* Text */}
                <div className="space-y-2">
                    <h3 className={`text-lg font-semibold leading-snug
                        ${darkMode ? 'text-white' : 'text-ink'}`}>
                        {title}
                    </h3>
                    <p className={`text-sm leading-relaxed
                        ${darkMode ? 'text-slate-500' : 'text-muted'}`}>
                        {description}
                    </p>
                </div>
            </div>

        
        </motion.div>
    );
};

const AuditPillarsSection = () => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === 'dark';

    const pillars = [
        { icon: Zap, title: 'Speed', tag: 'Website Performance', description: 'How quickly your pages open on a phone and on a computer, and what is slowing them down.', color: 'orange' },
        { icon: Search, title: 'SEO', tag: 'Website SEO', description: 'Whether Google can find, read and rank your pages — titles, headings, links and broken pages.', color: 'blue' },
        { icon: Accessibility, title: 'Accessibility', tag: 'Website Accessibility', description: 'Whether people with poor eyesight or other needs can use your site comfortably.', color: 'purple' },
        { icon: ShieldCheck, title: 'Security', tag: 'Website Security', description: 'Whether your site and your customers\' details are protected, and where the gaps are.', color: 'red' },
        { icon: LayoutDashboard, title: 'Mobile & design', tag: 'User Experience', description: 'Whether your pages are easy to use on a phone — buttons, text size and navigation.', color: 'cyan' },
        { icon: Cpu, title: 'AI readiness', tag: 'AI Readiness', description: 'Whether AI tools like ChatGPT and Gemini can read your site and mention your business.', color: 'amber' },
        { icon: Sparkles, title: 'Answers', tag: 'AEO', description: 'Whether your pages answer the questions customers actually search for.', color: 'orange' },
        { icon: Target, title: 'Enquiries', tag: 'Conversion Flow', description: 'Whether a visitor can easily call you, book a service or send an enquiry without a problem.', color: 'indigo' },
    ];

    return (
        <section
            id="features"
            className={`pt-12 pb-20 transition-colors duration-500 ${darkMode ? 'bg-[#07070f]' : 'bg-surface'}`}>
            <div className="container mx-auto px-6 max-w-7xl">

                {/* Header */}
                <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-14">
                    <div className="space-y-4 max-w-xl">
                      

                        <motion.h2
                            initial={{ opacity: 0, y: 16 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className={`text-4xl lg:text-5xl font-black tracking-tight leading-[1.05]
                                ${darkMode ? 'text-white' : 'text-ink'}`}>
                           Website Check Areas
                        </motion.h2>
                    </div>

                    <motion.p
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className={`lg:max-w-[240px] text-sm leading-relaxed
                            ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
                        A complete website check across 8 important areas.
                    </motion.p>
                </div>

                {/* Grid — 8 areas, so a clean 4 × 2 on a laptop */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {pillars.map((p, i) => (
                        <PillarCard key={p.title} {...p} index={i} darkMode={darkMode} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AuditPillarsSection;