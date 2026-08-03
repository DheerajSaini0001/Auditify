import React from 'react';
import { motion } from 'framer-motion';

const PageHeader = ({ 
    icon: Icon, 
    logo,
    badge, 
    title, 
    titleAccent, 
    subtitle, 
    darkMode,
    variant = "default" // "default" or "iconic"
}) => {
    return (
        <header className="relative text-center space-y-6 mb-10 px-4 pt-8">
            {/* Background Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-64 bg-gradient-to-r from-[#ea580c]/8 via-[#f97316]/6 to-[#ea580c]/8 blur-[100px] pointer-events-none -z-10"></div>

            {logo && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex justify-center mb-8"
                >
                    {logo}
                </motion.div>
            )}

            {variant === "default" && badge && (
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`inline-flex items-center gap-2 px-6 py-2 rounded-full border shadow-xl backdrop-blur-md transition-all duration-500 ${
                        darkMode 
                            ? "bg-slate-900/40 border-[#ea580c]/25 text-orange-400 shadow-orange-500/10"
                            : "bg-white/80 border-[#ea580c]/20 text-accent shadow-slate-200"
                    }`}
                >
                    {Icon && <Icon size={16} className="animate-pulse" />}
                    <span className="text-xs font-black tracking-[0.2em] uppercase">{badge}</span>
                </motion.div>
            )}

            {variant === "iconic" && Icon && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                    animate={{ opacity: 1, scale: 1, rotate: 3 }}
                    className={`mx-auto w-24 h-24 rounded-[2.5rem] flex items-center justify-center border-2 shadow-2xl transition-all duration-500 ${
                        darkMode 
                            ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-indigo-500/20" 
                            : "bg-indigo-50 border-indigo-100 text-indigo-600 shadow-indigo-200/50"
                    }`}
                >
                    <Icon size={40} className="-rotate-3" />
                </motion.div>
            )}

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
            >
                <h1 className={`text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] ${darkMode ? "text-white" : "text-ink"}`}>
                    {title}
                    {titleAccent && (
                        <>
                            <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#EA580C] via-[#F97316] to-[#FB923C] drop-shadow-2xl">
                                {titleAccent}
                            </span>
                        </>
                    )}
                </h1>
                
                {subtitle && (
                    <p className={`text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed ${darkMode ? "text-slate-400" : "text-muted"}`}>
                        {subtitle}
                    </p>
                )}
            </motion.div>

            {/* Decorative line */}
            <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "80px" }}
                transition={{ delay: 0.5, duration: 1 }}
                className={`h-1.5 mx-auto rounded-full bg-gradient-to-r from-[#EA580C] to-[#F97316] mt-8 shadow-lg shadow-orange-500/20`}
            ></motion.div>
        </header>
    );
};

export default PageHeader;
