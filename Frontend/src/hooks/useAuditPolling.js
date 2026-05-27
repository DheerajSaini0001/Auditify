import { useEffect, useRef } from 'react';

export const useAuditPolling = (inProgressAudits, apiFetch, updateProjectScore) => {
  const intervalsRef = useRef({}); // { [auditId]: intervalId }
  const auditsRef = useRef(inProgressAudits);
  const isHiddenRef = useRef(document.hidden);

  // Keep audits reference updated
  useEffect(() => {
    auditsRef.current = inProgressAudits;
  }, [inProgressAudits]);

  const startPolling = (audit) => {
    const { auditId, url } = audit;
    if (intervalsRef.current[auditId]) return;

    let retryCount = 0;

    const pollFn = async () => {
      if (isHiddenRef.current) return;

      try {
        const res = await apiFetch(`/api/user/report/${auditId}`);
        
        // Handle unauthorized or not found safely
        if (!res.ok) {
          if (res.status === 404) {
            clearInterval(intervalsRef.current[auditId]);
            delete intervalsRef.current[auditId];
            updateProjectScore(url, { status: 'not_started' });
            return;
          }
          throw new Error(`Fetch failed with status ${res.status}`);
        }

        const data = res.data;
        if (!data) return;

        const status = data.status; // "completed" | "inprogress" | "failed"

        if (status === 'completed') {
          clearInterval(intervalsRef.current[auditId]);
          delete intervalsRef.current[auditId];

          updateProjectScore(url, {
            status: 'completed',
            performance: data.technicalPerformance?.Percentage ?? Math.round(data.score) ?? 0,
            seo: data.onPageSEO?.Percentage ?? Math.round(data.score) ?? 0,
            accessibility: data.accessibility?.Percentage ?? Math.round(data.score) ?? 0,
            security: data.securityOrCompliance?.Percentage ?? Math.round(data.score) ?? 0,
            onPage: data.UXOrContentStructure?.Percentage ?? Math.round(data.score) ?? 0,
            conversion: data.conversionAndLeadFlow?.Percentage ?? Math.round(data.score) ?? 0,
            aiReadiness: data.aioReadiness?.Percentage ?? Math.round(data.score) ?? 0,
            rating: data.grade || (data.score >= 90 ? "Excellent" : data.score >= 80 ? "Very Good" : data.score >= 70 ? "Good" : "Needs Improvement"),
            auditId: data._id
          });
        } else if (status === 'failed') {
          clearInterval(intervalsRef.current[auditId]);
          delete intervalsRef.current[auditId];

          updateProjectScore(url, {
            status: 'failed',
            auditId
          });
        } else {
          // Reset retry count on successful response
          retryCount = 0;
          // If previously connection was lost, restore "in_progress" status
          updateProjectScore(url, {
            status: 'in_progress',
            auditId
          });
        }
      } catch (err) {
        console.error(`Polling error for ${auditId}:`, err);
        retryCount++;
        if (retryCount >= 3) {
          // Update status to show temporary "connection lost"
          updateProjectScore(url, {
            status: 'connection_lost',
            auditId
          });
        }
      }
    };

    // Trigger poll immediately and set interval
    pollFn();
    intervalsRef.current[auditId] = setInterval(pollFn, 2000);
  };

  const stopAllPolling = () => {
    Object.keys(intervalsRef.current).forEach((auditId) => {
      clearInterval(intervalsRef.current[auditId]);
    });
    intervalsRef.current = {};
  };

  const startAllPolling = () => {
    auditsRef.current.forEach((audit) => {
      startPolling(audit);
    });
  };

  useEffect(() => {
    // 1. Clear intervals for audits that are no longer in progress
    const activeAuditIds = inProgressAudits.map((a) => a.auditId);
    Object.keys(intervalsRef.current).forEach((auditId) => {
      if (!activeAuditIds.includes(auditId)) {
        clearInterval(intervalsRef.current[auditId]);
        delete intervalsRef.current[auditId];
      }
    });

    // 2. Start intervals for newly active in-progress audits (if page is visible)
    if (!isHiddenRef.current) {
      inProgressAudits.forEach((audit) => {
        startPolling(audit);
      });
    }
  }, [inProgressAudits]);

  // Document visibility visibilitychange management
  useEffect(() => {
    const handleVisibilityChange = () => {
      isHiddenRef.current = document.hidden;
      if (document.hidden) {
        stopAllPolling();
      } else {
        startAllPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopAllPolling();
    };
  }, []);
};
