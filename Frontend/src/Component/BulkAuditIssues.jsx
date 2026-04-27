import React, { useMemo } from "react";
import { AlertCircle, ChevronDown, ChevronRight, CheckCircle2, XCircle, Info, ExternalLink, ListFilter } from "lucide-react";

const IssueRow = ({ issue, pages, darkMode, onDrillDown }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const affectedPages = useMemo(() => {
        return pages.filter(issue.check);
    }, [pages, issue]);

    if (affectedPages.length === 0) return null;

    return (
        <div className={`border-b ${darkMode ? "border-slate-800" : "border-slate-100"} last:border-0`}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between px-6 py-4 cursor-pointer transition-colors ${darkMode ? "hover:bg-slate-800/30" : "hover:bg-slate-50/50"}`}
            >
                <div className="flex items-center gap-4 flex-1">
                    <div className={`p-1.5 rounded-lg ${issue.severity === 'error' ? 'bg-red-500/10 text-red-500' : issue.severity === 'warning' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-blue-500/10 text-blue-500'}`}>
                        {issue.severity === 'error' ? <XCircle className="w-4 h-4" /> : issue.severity === 'warning' ? <AlertCircle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                    </div>
                    <div>
                        <h4 className={`text-sm font-bold ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{issue.title}</h4>
                        <p className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{issue.description}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            onDrillDown(issue, affectedPages);
                        }}
                        className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${darkMode ? "bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700" : "bg-slate-50 border-slate-200 text-emerald-600 hover:bg-slate-100"}`}
                    >
                        <ListFilter className="w-3 h-3" />
                        View Details
                    </button>
                    
                    <div className="text-right min-w-[70px]">
                        <span className={`text-sm font-black ${issue.severity === 'error' ? 'text-red-500' : issue.severity === 'warning' ? 'text-yellow-500' : 'text-blue-500'}`}>
                            {affectedPages.length}
                        </span>
                        <span className={`text-[10px] ml-1 font-bold uppercase tracking-wider ${darkMode ? "text-slate-600" : "text-slate-400"}`}>Pages</span>
                    </div>
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                </div>
            </div>

            {isOpen && (
                <div className={`px-6 pb-4 animate-in slide-in-from-top-2 duration-200 ${darkMode ? "bg-slate-900/50" : "bg-slate-50/30"}`}>
                    <div className="pt-2 space-y-2">
                        {affectedPages.map((page, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 group">
                                <span className={`text-xs truncate max-w-md ${darkMode ? "text-slate-400" : "text-slate-600"}`}>{page.url}</span>
                                <a 
                                    href={page.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    Visit <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const IssueCategory = ({ title, description, issues, pages, darkMode, onDrillDown }) => {
    // Check if any issue in this category has affected pages
    const hasIssues = useMemo(() => {
        return issues.some(issue => pages.some(issue.check));
    }, [issues, pages]);

    if (!hasIssues) return null;

    return (
        <div className={`rounded-2xl border mb-8 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 ${darkMode ? "bg-slate-900/50 border-slate-800" : "bg-white border-slate-100 shadow-xl"}`}>
            <div className={`px-6 py-4 border-b ${darkMode ? "bg-slate-800/30 border-slate-800" : "bg-slate-50 border-slate-100"}`}>
                <h3 className={`text-lg font-black ${darkMode ? "text-slate-200" : "text-slate-800"}`}>{title}</h3>
                {description && <p className={`text-xs mt-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>{description}</p>}
            </div>
            <div>
                {issues.map((issue, idx) => (
                    <IssueRow key={idx} issue={issue} pages={pages} darkMode={darkMode} onDrillDown={onDrillDown} />
                ))}
            </div>
        </div>
    );
};

export default function BulkAuditIssues({ pages, darkMode, onDrillDown }) {
    const categories = [
        {
            title: "Internal pages",
            description: "HTTP status code issues and reachability",
            issues: [
                {
                    title: "404 page",
                    description: "Requested page was not found by the crawler",
                    severity: "error",
                    check: (p) => p.status === 'failed' || p.technicalPerformance?.status === 404
                },
                {
                    title: "4XX page",
                    description: "Client error (e.g. 403 Forbidden, 401 Unauthorized)",
                    severity: "error",
                    check: (p) => p.technicalPerformance?.status >= 400 && p.technicalPerformance?.status < 500 && p.technicalPerformance?.status !== 404
                }
            ]
        },
        {
            title: "Indexability",
            description: "Issues related to search engine visibility",
            issues: [
                {
                    title: "Canonical points to redirect",
                    description: "The canonical URL of the page redirects to another location",
                    severity: "warning",
                    check: (p) => p.onPageSEO?.Canonical?.status === 'fail' || p.onPageSEO?.Canonical?.details?.toLowerCase().includes('redirect')
                },
                {
                    title: "Noindex page",
                    description: "Page is explicitly set to not be indexed by search engines",
                    severity: "info",
                    check: (p) => p.onPageSEO?.Robots_Txt?.content?.toLowerCase().includes('noindex') || p.onPageSEO?.On_Page_SEO?.metaRobots?.toLowerCase().includes('noindex')
                },
                {
                    title: "Page size exceeds 2 MB",
                    description: "Heavy pages load slowly and consume crawl budget",
                    severity: "warning",
                    check: (p) => {
                        const sizeStr = p.technicalPerformance?.Resource_Optimization?.meta?.totalSize;
                        if (!sizeStr) return false;
                        const sizeMB = parseFloat(sizeStr);
                        return sizeStr.includes('MB') && sizeMB > 2;
                    }
                }
            ]
        },
        {
            title: "Links",
            description: "Structure and health of internal and external links",
            issues: [
                {
                    title: "Broken internal links",
                    description: "Links pointing to internal pages that don't exist",
                    severity: "error",
                    check: (p) => p.onPageSEO?.Contextual_Linking?.broken_links_count > 0 || p.onPageSEO?.Links?.bad_links_count > 0
                },
                {
                    title: "Broken external links",
                    description: "Links pointing to external websites that return an error",
                    severity: "warning",
                    check: (p) => p.onPageSEO?.Links?.meta?.external_broken > 0
                },
                {
                    title: "Orphan page",
                    description: "Page has no internal incoming links (risky for indexing)",
                    severity: "warning",
                    check: (p) => p.onPageSEO?.Links?.internal === 0
                }
            ]
        },
        {
            title: "Images & Media",
            description: "Optimization and accessibility for visual content",
            issues: [
                {
                    title: "Broken images",
                    description: "Images that failed to load (404 or bad source)",
                    severity: "error",
                    check: (p) => p.onPageSEO?.Image?.meta?.broken_images_count > 0
                },
                {
                    title: "Missing alt text",
                    description: "Images without descriptive alt attributes",
                    severity: "warning",
                    check: (p) => p.onPageSEO?.Image?.meta?.missing_alt_count > 0
                }
            ]
        },
        {
            title: "Content",
            description: "On-page quality and SEO metadata",
            issues: [
                {
                    title: "H1 tag missing or empty",
                    description: "Every page should have a unique H1 heading",
                    severity: "error",
                    check: (p) => p.onPageSEO?.H1?.score === 0 || !p.onPageSEO?.H1
                },
                {
                    title: "Duplicate Title",
                    description: "Multiple pages sharing the same title tag",
                    severity: "warning",
                    check: (p, index, allPages) => {
                        const title = p.onPageSEO?.Title?.meta?.value;
                        if (!title) return false;
                        return allPages.some((other, oIdx) => oIdx !== index && other.onPageSEO?.Title?.meta?.value === title);
                    }
                },
                {
                    title: "Meta description missing or empty",
                    description: "Critical for search engine result snippets",
                    severity: "warning",
                    check: (p) => p.onPageSEO?.Meta_Description?.score === 0
                },
                {
                    title: "Title too long",
                    description: "Titles longer than 60 characters may be truncated in search results",
                    severity: "info",
                    check: (p) => p.onPageSEO?.Title?.meta?.length > 60
                },
                {
                    title: "Thin content",
                    description: "Page has fewer than 250 words of descriptive text",
                    severity: "warning",
                    check: (p) => p.onPageSEO?.Duplicate_Content?.meta?.wordCount < 250
                }
            ]
        }
    ];

    const completedPages = pages.filter(p => p.status === "completed");

    if (completedPages.length === 0) {
        return (
            <div className={`p-12 rounded-3xl border text-center ${darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-slate-100 shadow-xl"}`}>
                <Info className={`w-12 h-12 mx-auto mb-4 ${darkMode ? "text-slate-700" : "text-slate-200"}`} />
                <h3 className="text-xl font-bold mb-2">No data yet</h3>
                <p className={`${darkMode ? "text-slate-500" : "text-slate-400"}`}>Complete audits to see aggregate issue reports.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {categories.map((cat, idx) => (
                <IssueCategory 
                    key={idx} 
                    title={cat.title} 
                    description={cat.description} 
                    issues={cat.issues} 
                    pages={completedPages} 
                    darkMode={darkMode} 
                    onDrillDown={onDrillDown}
                />
            ))}
        </div>
    );
}
