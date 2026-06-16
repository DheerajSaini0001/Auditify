import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Tooltip = ({ children, content, darkMode }) => {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <div 
            className="relative flex items-center"
           
        >
            {children}
            <AnimatePresence>
                {isVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className={`absolute right-0 bottom-full mb-3 z-[100] w-72 p-4 rounded-xl shadow-2xl border backdrop-blur-md ${
                            darkMode 
                                ? "bg-slate-900/95 border-slate-700 text-slate-200"
                                : "bg-card/95 border-line text-muted"
                        }`}
                    >
                        <div className="space-y-3">
                            {content}
                        </div>
                        {/* Tooltip Arrow */}
                        <div className={`absolute -bottom-1.5 right-4 w-3 h-3 rotate-45 border-r border-b ${
                            darkMode ? "bg-slate-900 border-slate-700" : "bg-card border-line"
                        }`} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Tooltip;
