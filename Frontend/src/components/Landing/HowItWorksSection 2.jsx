import React, { useContext } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext.jsx';

const STEPS = [
    {
        n: '1',
        title: 'Enter your web address',
        desc: 'No setup and no code to install. Nothing on your website is changed.',
    },
    {
        n: '2',
        title: 'We check it like a customer',
        desc: 'We open your site as a phone visitor on a normal connection and run every check.',
    },
    {
        n: '3',
        title: 'You get a clear fix list',
        desc: 'A score for each area, with the most costly problems at the top of the list.',
    },
];

// Sends the visitor back to the URL field at the top of the page and opens the keyboard.
const focusAuditInput = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => document.getElementById('audit-url-input')?.focus(), 350);
};

const HowItWorksSection = () => {
    const { theme } = useContext(ThemeContext);
    const darkMode = theme === 'dark';

    const cardClass = darkMode
        ? 'bg-white/[0.02] border-white/8'
        : 'bg-card border-line shadow-sm';

    return (
        <section className={`py-20 transition-colors duration-500 ${darkMode ? 'bg-[#07070f]' : 'bg-surface'}`}>
            <div className="container mx-auto px-6 max-w-7xl space-y-12">

                <div className="text-center space-y-3">
                    <h2
                        className={`text-4xl lg:text-5xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-ink'}`}
                        style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                        How it works
                    </h2>
                    <p className={`text-base ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
                        Three steps, a few minutes.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {STEPS.map(({ n, title, desc }, i) => (
                        <motion.div
                            key={n}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-40px' }}
                            transition={{ duration: 0.5, delay: i * 0.08 }}
                            className={`rounded-2xl border p-7 ${cardClass}`}
                        >
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mb-4
                                ${darkMode ? 'bg-[#F26419]/15 text-orange-400' : 'bg-[#F26419]/10 text-[#F26419]'}`}>
                                {n}
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-ink'}`}>{title}</h3>
                            <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-muted'}`}>{desc}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Closing call to action */}
                <div className={`rounded-3xl border p-8 lg:p-12 text-center ${cardClass}`}>
                    <h3
                        className={`text-2xl lg:text-3xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-ink'}`}
                        style={{ fontFamily: "'Syne', sans-serif" }}
                    >
                        See how your website is doing
                    </h3>
                    <p className={`text-base max-w-xl mx-auto mb-7 ${darkMode ? 'text-slate-400' : 'text-muted'}`}>
                        Enter your web address and get your first report. No card needed.
                    </p>
                    <button
                        type="button"
                        onClick={focusAuditInput}
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#F26419] hover:bg-[#D4520E] transition-colors text-white font-semibold"
                    >
                        Check my website
                        <ArrowRight size={18} />
                    </button>
                </div>

            </div>
        </section>
    );
};

export default HowItWorksSection;
