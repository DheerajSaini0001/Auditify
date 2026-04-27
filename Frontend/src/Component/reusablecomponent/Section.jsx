import React from 'react';

const Section = ({ title, subtitle, icon: Icon, children, darkMode, action, shouldAlignStart }) => (
    <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${darkMode ? "bg-violet-500/20 text-violet-400" : "bg-violet-100 text-violet-600"}`}>
                    <Icon size={20} />
                </div>
                <div>
                    <h2 className={`text-xl font-bold ${darkMode ? "text-white" : "text-gray-900"}`}>{title}</h2>
                    <p className={`text-sm ${darkMode ? "text-gray-400" : "text-gray-500"}`}>{subtitle}</p>
                </div>
            </div>
            {action && <div>{action}</div>}
        </div>
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 ${shouldAlignStart ? 'items-start' : ''}`}>
            {children}
        </div>
    </div>
);

export default Section;
