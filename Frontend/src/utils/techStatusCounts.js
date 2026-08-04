/**
 * Technical Performance tallies its own statuses because its metrics are nested
 * (LCP.lab / LCP.crux / …) rather than flat like every other section, so the usual
 * "count direct children with a status" does not reach them.
 *
 * Exported so PillarHeader can render these counts in the same row, in the same
 * order, as the other seven pillars — this page used to be the only one whose
 * header showed no tallies at all.
 */
export const techStatusCounts = (tech) => {
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
    checkStatus(tech?.FID?.lab?.status);
    checkStatus(tech?.FID?.crux?.status);
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
    checkStatus(tech?.Inventory_Load_Time?.status);
    checkStatus(tech?.Service_Load_Time?.status);

    // Mobile Experience & Rendering (PageSpeed Score is informational — not tallied)
    checkStatus(tech?.Mobile_Usability?.status);
    checkStatus(tech?.Mobile_Load_Speed?.status);
    checkStatus(tech?.Rendering_Performance?.status);
    checkStatus(tech?.Lazy_Loading?.status);
    checkStatus(tech?.Third_Party_Optimization?.status);
    checkStatus(tech?.JS_Execution?.status);

    return { passed: passedCount, warning: warningCount, failed: failedCount };
};
