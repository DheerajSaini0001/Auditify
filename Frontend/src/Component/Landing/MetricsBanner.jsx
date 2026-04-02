import React from 'react';
import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';

const CountUpMetric = ({ value, label, delay }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <motion.div 
            ref={ref}
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay }}
            className="flex flex-col items-center gap-2 p-6 rounded-3xl group bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
            <div className="flex items-baseline gap-1">
                <span className="text-4xl lg:text-5xl font-black text-white group-hover:scale-110 transition-transform">{value}</span>
                <span className="text-xl font-bold text-emerald-400">+</span>
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 group-hover:text-white transition-colors">{label}</p>
        </motion.div>
    );
};

const MetricsBanner = () => {
    const metrics = [
        { value: "542", label: "Audits Daily" },
        { value: "128", label: "Countries" },
        { value: "85", label: "Million PageScans" },
        { value: "99", label: "Success Rate" }
    ];

    return (
        <section className="relative py-16 bg-blue-600 overflow-hidden">
            {/* Background Texture/Shine */}
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-blue-700 to-indigo-700 opacity-90 overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            </div>

            <div className="container mx-auto px-6 relative z-10 max-w-7xl">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {metrics.map((m, i) => (
                        <CountUpMetric key={i} {...m} delay={i * 0.15} />
                    ))}
                </div>
            </div>

            {/* Decorative waves */}
            <div className="absolute top-0 left-0 w-full h-2 bg-black/10"></div>
            <div className="absolute bottom-0 left-0 w-full h-2 bg-black/10"></div>
        </section>
    );
};

export default MetricsBanner;
