import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader2, ArrowRight } from 'lucide-react';

const CTASection = ({ onSubmit, isLoading }) => {
    const [url, setUrl] = useState('');

    const handleFormSubmit = (e) => {
        e.preventDefault();
        onSubmit(url, 'Desktop'); // Default to desktop CTA
    };

    return (
        <section className="relative py-32 px-6 overflow-hidden">
            {/* Gradient Background - #1E3A5F to #0F172A */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#1E3A5F] to-[#0F172A] z-0"></div>
            
            <div className="container mx-auto relative z-10 max-w-4xl text-center space-y-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="space-y-6"
                >
                    <h2 className="text-5xl lg:text-7xl font-black text-white tracking-tighter leading-none">
                        Your Website&apos;s <span className="text-emerald-400">Report Card</span> Awaits.
                    </h2>
                    <p className="text-xl text-slate-300 font-medium">Free. Fast. No signup. Just a URL.</p>
                </motion.div>

                {/* Lower URL Input Bar */}
                <form 
                    onSubmit={handleFormSubmit}
                    className="relative max-w-2xl mx-auto group"
                >
                    <div className="flex flex-col sm:flex-row items-center p-2 rounded-2xl bg-white/10 border border-white/10 shadow-2xl backdrop-blur-xl group-focus-within:border-emerald-400/50 transition-all duration-500">
                        
                        <div className="flex-1 w-full relative flex items-center px-4 h-14">
                            <Search className="w-5 h-5 text-white/50 mr-4" />
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://example.com"
                                disabled={isLoading}
                                className="w-full bg-transparent border-none outline-none text-white font-bold placeholder:text-white/30"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading || !url}
                            className="w-full sm:w-auto px-10 h-14 rounded-xl bg-white text-[#1E3A5F] font-black uppercase tracking-widest transition-all hover:bg-emerald-400 hover:text-white active:scale-95 flex items-center justify-center gap-2 group/btn shadow-xl shadow-black/20"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin w-5 h-5" />
                            ) : (
                                <>
                                    <span>Analyze Now</span>
                                    <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Audit Pillar Badges as Visual Recap */}
                <div className="flex flex-wrap justify-center gap-3 pt-8">
                    {["SEO Insights", "Accessibility Engine", "Security WAF Scan", "Performance Matrix", "AIO Check"].map((pill, i) => (
                        <div key={i} className="px-4 py-2 rounded-full border border-white/5 bg-white/5 text-white/40 text-xs font-black uppercase tracking-widest">
                            {pill}
                        </div>
                    ))}
                </div>
            </div>

            {/* Floating particles - lightweight purely decorative */}
            <div className="absolute top-20 left-20 w-2 h-2 bg-emerald-500 rounded-full blur-[2px] opacity-20 animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-3 h-3 bg-cyan-500 rounded-full blur-[2px] opacity-20 animate-pulse"></div>
        </section>
    );
};

export default CTASection;
