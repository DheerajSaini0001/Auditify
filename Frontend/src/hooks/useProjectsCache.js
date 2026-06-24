import { useState, useEffect, useCallback, useRef } from 'react';

// Module-level singleton cache to survive React unmounts (e.g. tab switches)
let projectsCache = {
  websites: null,
  detailedScores: null,
  lastFetched: null,
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const useProjectsCache = (apiFetch) => {
  const [websites, setWebsites] = useState(projectsCache.websites || []);
  const [detailedScores, setDetailedScores] = useState(projectsCache.detailedScores || {});
  const [loading, setLoading] = useState(false);

  const normalizeUrl = (u) =>
    u.toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

  const fetchProjects = useCallback(async (force = false) => {
    const now = Date.now();
    
    // Check if we can serve from cache
    if (
      !force &&
      projectsCache.websites &&
      projectsCache.detailedScores &&
      projectsCache.lastFetched &&
      (now - projectsCache.lastFetched < CACHE_TTL)
    ) {
      setWebsites(projectsCache.websites);
      setDetailedScores(projectsCache.detailedScores);
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch user verified websites
      const sitesRes = await apiFetch('/api/websites');
      const websitesList = sitesRes.ok ? (sitesRes.data.websites || []) : [];

      // 2. Fetch user audit history — up to 100 to avoid missing recent audits
      const historyRes = await apiFetch('/api/user/history?limit=100');
      const historyList = historyRes.ok ? (historyRes.data.audits || []) : [];

      // 3. Find the most recent audit (regardless of status) for each website
      const latestAuditsMap = {};
      historyList.forEach(audit => {
        const normUrl = normalizeUrl(audit.url);
        if (!latestAuditsMap[normUrl]) {
          latestAuditsMap[normUrl] = audit;
        }
      });

      // 4. Build scores map, fetching reports for successful audits
      const scoresMap = {};
      
      await Promise.all(
        websitesList.map(async (site) => {
          const normUrl = normalizeUrl(site.url);
          const latestAudit = latestAuditsMap[normUrl];

          if (!latestAudit) {
            scoresMap[normUrl] = { status: 'not_started' };
            return;
          }

          const hasReport = latestAudit.reportId || latestAudit._id;
          
          if (latestAudit.status === 'success' && hasReport) {
            const reportId = latestAudit.reportId || latestAudit._id;
            try {
              const reportRes = await apiFetch(`/api/user/report/${reportId}`);
              if (reportRes.ok && reportRes.data) {
                const r = reportRes.data;
                scoresMap[normUrl] = {
                  status: 'completed',
                  performance: r.technicalPerformance?.Percentage ?? Math.round(r.score) ?? 0,
                  seo: r.onPageSEO?.Percentage ?? Math.round(r.score) ?? 0,
                  accessibility: r.accessibility?.Percentage ?? Math.round(r.score) ?? 0,
                  security: r.securityOrCompliance?.Percentage ?? Math.round(r.score) ?? 0,
                  onPage: r.UXOrContentStructure?.Percentage ?? Math.round(r.score) ?? 0,
                  conversion: r.conversionAndLeadFlow?.Percentage ?? Math.round(r.score) ?? 0,
                  aiReadiness: r.aioReadiness?.Percentage ?? Math.round(r.score) ?? 0,
                  aeo: r.aeo?.Percentage ?? Math.round(r.score) ?? 0,
                  rating: r.grade || (r.score >= 90 ? "Excellent" : r.score >= 80 ? "Very Good" : r.score >= 70 ? "Good" : "Needs Improvement"),
                  auditId: r._id
                };
              } else {
                scoresMap[normUrl] = { status: 'not_started' };
              }
            } catch (e) {
              console.error(`Failed to fetch report for ${normUrl}:`, e);
              scoresMap[normUrl] = { status: 'not_started' };
            }
          } else if (latestAudit.status === 'pending' || latestAudit.status === 'inprogress') {
            scoresMap[normUrl] = {
              status: 'in_progress',
              auditId: latestAudit._id
            };
          } else if (latestAudit.status === 'failed') {
            scoresMap[normUrl] = {
              status: 'failed',
              auditId: latestAudit._id
            };
          } else {
            scoresMap[normUrl] = { status: 'not_started' };
          }
        })
      );

      // Update state and singleton cache
      projectsCache = {
        websites: websitesList,
        detailedScores: scoresMap,
        lastFetched: now,
      };

      setWebsites(websitesList);
      setDetailedScores(scoresMap);
    } catch (err) {
      console.error('Data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  // Method to manually clear the cache (useful on logout, or forced deletions)
  const invalidateCache = useCallback(() => {
    projectsCache = {
      websites: null,
      detailedScores: null,
      lastFetched: null,
    };
  }, []);

  // Update a single project's status/scores in cache without full refetch
  const updateProjectScore = useCallback((url, updatedScore) => {
    const normUrl = normalizeUrl(url);
    
    setDetailedScores(prev => {
      const nextScores = {
        ...prev,
        [normUrl]: {
          ...prev[normUrl],
          ...updatedScore,
        }
      };
      
      if (projectsCache.detailedScores) {
        projectsCache.detailedScores[normUrl] = {
          ...projectsCache.detailedScores[normUrl],
          ...updatedScore,
        };
      }
      return nextScores;
    });
  }, []);

  return {
    websites,
    detailedScores,
    loading,
    refresh: fetchProjects,
    invalidateCache,
    updateProjectScore,
  };
};
