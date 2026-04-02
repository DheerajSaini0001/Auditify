import React from "react";
import { ArrowLeft, ExternalLink, Shield, ShieldAlert, FileText, Globe, Search, Download } from "lucide-react";

export default function BulkAuditDrillDown({ issue, pages, onBack, darkMode }) {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
            {/* Breadcrumb & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={onBack}
                        className={`p-2 rounded-full transition-colors ${darkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-600"}`}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-emerald-500">
                            <span>Issues</span>
                            <span className="text-slate-500">/</span>
                            <span className={darkMode ? "text-slate-300" : "text-slate-700"}>{issue.title}</span>
                        </div>
                        <h2 className={`text-2xl font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{issue.title}</h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border transition-all ${darkMode ? "bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600" : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"}`}>
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all">
                        Create New Issue
                    </button>
                </div>
            </div>

            {/* Filter Bar Mockup */}
            <div className={`p-4 rounded-2xl border flex flex-wrap items-center gap-4 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100 shadow-sm"}`}>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border flex-grow max-w-md ${darkMode ? "bg-slate-800 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                    <Search className="w-4 h-4 text-slate-500" />
                    <input 
                        type="text" 
                        placeholder="Filter by URL or phrase..." 
                        className="bg-transparent outline-none text-sm w-full"
                    />
                </div>
                <div className="flex gap-2">
                    {["All URLs", "Indexable", "Non-indexable"].map((tab) => (
                        <button key={tab} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === 'All URLs' ? 'bg-emerald-500 text-white' : (darkMode ? 'bg-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}`}>
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            <div className={`rounded-2xl border overflow-hidden ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl"}`}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className={`border-b ${darkMode ? "bg-slate-800/50 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">URL</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Depth</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Indexable</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider">Inlinks</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className={`divide-y ${darkMode ? "divide-slate-800" : "divide-slate-100"}`}>
                            {pages.map((page, idx) => {
                                const isBroken = page.technicalPerformance?.status >= 400 || page.status === 'failed';
                                const httpStatus = page.technicalPerformance?.status || (page.status === 'failed' ? 404 : 200);
                                const isIndexable = !(page.onPageSEO?.Robots_Txt?.content?.toLowerCase().includes('noindex') || page.onPageSEO?.On_Page_SEO?.metaRobots?.toLowerCase().includes('noindex'));
                                
                                // Mockup values for advanced metrics not yet in crawl
                                const depth = Math.floor(Math.random() * 3) + 1;
                                const inlinks = Math.floor(Math.random() * 50);

                                return (
                                    <tr key={idx} className={`group transition-colors ${darkMode ? "hover:bg-slate-800/30" : "hover:bg-slate-50/50"}`}>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-lg ${darkMode ? "bg-slate-800" : "bg-slate-100"}`}>
                                                    <Globe className={`w-4 h-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`} />
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className={`text-sm font-bold truncate max-w-[200px] lg:max-w-md ${darkMode ? "text-slate-200" : "text-slate-800"}`}>
                                                        {page.url}
                                                    </span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">HTML</span>
                                                        {isBroken && <span className="text-[10px] font-black uppercase tracking-widest text-red-500">Broken</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-black ${
                                                httpStatus >= 400 ? 'bg-red-500/10 text-red-500' : 
                                                httpStatus >= 300 ? 'bg-blue-500/10 text-blue-500' : 'bg-emerald-500/10 text-emerald-500'
                                            }`}>
                                                {httpStatus}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`text-sm font-bold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                                                {depth}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                {isIndexable ? (
                                                    <Shield className="w-4 h-4 text-emerald-500" />
                                                ) : (
                                                    <ShieldAlert className="w-4 h-4 text-amber-500" />
                                                )}
                                                <span className={`text-xs font-bold ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                                                    {isIndexable ? "Yes" : "No"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`text-sm font-bold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                                                {inlinks}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <a 
                                                href={page.url} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className={`p-2 rounded-lg inline-flex items-center transition-colors ${darkMode ? "bg-slate-800 text-slate-400 hover:text-emerald-400" : "bg-slate-100 text-slate-500 hover:text-emerald-600"}`}
                                            >
                                                <ExternalLink className="w-4 h-4" />
                                            </a>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                
                {/* Empty State */}
                {pages.length === 0 && (
                    <div className="py-20 text-center">
                        <FileText className={`w-12 h-12 mx-auto mb-4 ${darkMode ? "text-slate-700" : "text-slate-200"}`} />
                        <h3 className={`text-lg font-bold ${darkMode ? "text-slate-400" : "text-slate-600"}`}>No pages found for this issue</h3>
                    </div>
                )}
            </div>
        </div>
    );
}
