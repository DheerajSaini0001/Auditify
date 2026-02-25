import React from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const StatusSummary = ({ tech, className = "gap-4" }) => {
    let passedCount = 0;
    let failedCount = 0;
    let warningCount = 0;

    const checkStatus = (status) => {
        if (!status) return;
        if (status === "pass") passedCount++;
        else if (status === "warning") warningCount++;
        else failedCount++;
    };

    // Core & Lab Metrics
    checkStatus(tech?.LCP?.lab?.status);
    checkStatus(tech?.LCP?.crux?.status);
    checkStatus(tech?.TBT?.lab?.status);
    checkStatus(tech?.INP?.lab?.status);
    checkStatus(tech?.INP?.crux?.status);
    checkStatus(tech?.FCP?.lab?.status);
    checkStatus(tech?.FCP?.crux?.status);
    checkStatus(tech?.SI?.lab?.status);
    checkStatus(tech?.TTFB?.lab?.status);
    checkStatus(tech?.TTFB?.crux?.status);
    checkStatus(tech?.CLS?.lab?.status);
    checkStatus(tech?.CLS?.crux?.status);

    // Assets & Optimization
    checkStatus(tech?.Compression?.status);
    checkStatus(tech?.Caching?.status);
    checkStatus(tech?.Render_Blocking?.status);
    checkStatus(tech?.Resource_Optimization?.status);
    checkStatus(tech?.Redirect_Chains?.status);

    return (
        <div className={`flex items-center ${className}`}>
            <div className="flex items-center gap-2">
                <CheckCircle size={18} className="text-emerald-500" />
                <span className="text-sm font-bold">{passedCount} Passed</span>
            </div>
            <div className="flex items-center gap-2">
                <XCircle size={18} className="text-rose-500" />
                <span className="text-sm font-bold">{failedCount} Failed</span>
            </div>
            <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <span className="text-sm font-bold">{warningCount} Warning</span>
            </div>
        </div>
    );
};

export default StatusSummary;
