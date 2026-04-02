import React from 'react';
import { motion } from 'framer-motion';
import { Search, Zap, FileText, ArrowRight } from 'lucide-react';

const StepCard = ({ number, icon: Icon, title, description, index }) => {
    return (
        <motion.div
            initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: index * 0.2 }}
            className="flex-1 relative group p-10 rounded-3xl bg-[#1E293B] border border-[#334155] hover:border-emerald-500/50 shadow-2xl transition-all duration-300"
        >
            <div className="absolute -top-6 -left-6 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-emerald-500/30">
                {number}
            </div>
            
            <div className="w-16 h-16 rounded-2xl mb-8 flex items-center justify-center bg-slate-800 text-emerald-400 border border-slate-700/50 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                <Icon size={32} />
            </div>

            <h3 className="text-2xl font-black text-white mb-4">{title}</h3>
            <p className="text-slate-400 font-medium leading-relaxed group-hover:text-slate-300 transition-colors">
                {description}
            </p>

            <motion.div 
                className="absolute bottom-10 right-10 opacity-0 group-hover:opacity-100 transition-opacity"
                animate={{ x: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
            >
                <ArrowRight className="text-emerald-500" />
            </motion.div>
        </motion.div>
    );
};

const HowItWorksSection = () => {
    const steps = [
        { 
            number: "01", icon: Search, title: "Enter Site URL", 
            description: "Simply paste the link of any live website. Our intelligent crawler handles both desktop and mobile layouts automatically." 
        },
        { 
            number: "02", icon: Zap, title: "Run 7D Audit", 
            description: "Our distributed audit engines analyze your site across all 7 dimensions—Performance to AIO readiness—at hyper-speed." 
        },
        { 
            number: "03", icon: FileText, title: "Get Results", 
            description: "Receive a professional, scored report card with prioritied fix recommendations. Download as one-click PDF for your team." 
        }
    ];

    return (
        <section id="how-it-works" className="relative py-32 bg-[#0A0F1E] overflow-hidden">
            <div className="container mx-auto px-6 relative z-10 max-w-7xl">
                <div className="text-center mb-24 space-y-4">
                    <h2 className="text-4xl lg:text-6xl font-black tracking-tighter">Wait, how does <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">Auditify</span> work?</h2>
                    <p className="text-slate-600 font-bold text-lg max-w-2xl mx-auto uppercase tracking-widest leading-loose">Automating the complexity of professional web auditing into three simple clicks.</p>
                </div>

                <div className="flex flex-col lg:flex-row gap-12 lg:gap-8 relative">
                    {/* Connecting Arrows - Desktop Only */}
                    <div className="hidden lg:block absolute top-1/2 left-1/3 -translate-y-1/2 -ml-8 z-0">
                        <motion.div 
                            animate={{ opacity: [0.2, 0.4, 0.2], x: [0, 20, 0] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                        >
                            <ArrowRight className="w-16 h-16 text-slate-800" />
                        </motion.div>
                    </div>
                    <div className="hidden lg:block absolute top-1/2 left-2/3 -translate-y-1/2 -ml-8 z-0">
                        <motion.div 
                            animate={{ opacity: [0.2, 0.4, 0.2], x: [0, 20, 0] }}
                            transition={{ repeat: Infinity, duration: 3, delay: 1.5 }}
                        >
                            <ArrowRight className="w-16 h-16 text-slate-800" />
                        </motion.div>
                    </div>

                    {steps.map((s, i) => (
                        <StepCard key={i} {...s} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
