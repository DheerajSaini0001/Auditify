import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Search, Accessibility, ShieldCheck, LayoutDashboard, Cpu, Target } from 'lucide-react';

const PillarCard = ({ icon: Icon, title, description, color, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -10, transition: { duration: 0.2 } }}
            className={`
                group relative p-8 h-full rounded-[2.5rem] border transition-all duration-500
                bg-slate-900/40 border-white/5 hover:border-${color}-500/50 hover:bg-slate-900/60 shadow-2xl backdrop-blur-xl
            `}
        >
            {/* Colorful Glow Effect */}
            <div className={`absolute -inset-2 rounded-[3.5rem] blur-2xl opacity-0 group-hover:opacity-10 transition duration-1000 bg-${color}-500`}></div>

            <div className={`w-14 h-14 rounded-2xl mb-6 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-12 bg-${color}-500/10 text-${color}-400 border border-${color}-500/20`}>
                <Icon size={28} />
            </div>

            <h3 className="text-2xl font-black mb-4 group-hover:text-white transition-colors">{title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">
                {description}
            </p>
            
            <div className={`absolute bottom-8 right-8 w-12 h-1 rounded-full group-hover:w-20 transition-all duration-700 bg-${color}-500/30`}></div>
        </motion.div>
    );
};

const AuditPillarsSection = () => {
    const pillars = [
        { icon: Zap, title: "Performance", description: "Deep core web vitals analysis including LCP, FID, and CLS directly from the source.", color: "emerald" },
        { icon: Search, title: "On-Page SEO", description: "Meta coverage, internal linking, schema validation, and keyword density mapping.", color: "blue" },
        { icon: Accessibility, title: "Accessibility", description: "WCAG 2.1 compliance check using advanced axe-core intelligence engines.", color: "purple" },
        { icon: ShieldCheck, title: "Security", description: "WAF detection, SSL validation, header hardening, and common vulnerability scans.", color: "red" },
        { icon: LayoutDashboard, title: "UX & Structure", description: "Heatmap-style element distribution, content hierarchy, and touch target scaling.", color: "cyan" },
        { icon: Cpu, title: "AIO Readiness", description: "AI Optimization — ensure your content is perfectly ready for the LLM-search era.", color: "orange" },
        { icon: Target, title: "Conversion", description: "Lead-flow friction analysis, CTA placement and visibility, and form optimization.", color: "pink" }
    ];

    return (
        <section id="features" className="relative py-24 pb-32">
            <div className="container mx-auto px-6 relative z-10 max-w-7xl">
                <div className="text-center mb-20 space-y-4">
                    <h2 className="text-4xl lg:text-6xl font-black tracking-tight">The 7 <span className="text-emerald-500 italic px-2 bg-emerald-500/10 rounded-2xl mx-1 shadow-lg shadow-emerald-500/10 tracking-widest">Dimensions</span> of Auditify.</h2>
                    <p className="text-slate-500 font-bold text-lg max-w-2xl mx-auto uppercase tracking-tighter">Everything we test, every single time. No compromises.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {pillars.map((p, i) => (
                        <div key={i} className={i >= 6 ? "md:col-span-2 lg:col-span-1" : ""}>
                            <PillarCard {...p} index={i} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default AuditPillarsSection;
