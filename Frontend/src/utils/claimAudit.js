const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';

/**
 * Hand the guest report the visitor just signed in for over to their account.
 *
 * An audit run signed-out is stored with no owner, and past reports are filtered
 * by owner — so without this the one report someone created an account *for* was
 * the one report missing from their history.
 *
 * Called straight after login, before the redirect, so it relies on the token in
 * localStorage rather than the AuthContext user (which has not loaded yet).
 * Fire-and-forget: the redirect must not wait on it, and the server call is
 * idempotent and refuses to reassign an already-owned report.
 */
export const claimAuditForCurrentUser = async (auditId) => {
    if (!auditId) return false;

    const token = localStorage.getItem('dealerpulse_token');
    if (!token) return false;

    try {
        const res = await fetch(`${API_URL}/single-audit/${auditId}/claim`, {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            console.warn('[ClaimAudit] Claim rejected:', res.status);
            return false;
        }

        const data = await res.json();
        console.log('[ClaimAudit] Report', auditId, data.claimed ? 'claimed' : 'already owned');
        return !!data.claimed;
    } catch (e) {
        // Not worth blocking sign-in over — the report is still readable, it just
        // will not be listed under past reports.
        console.error('[ClaimAudit] Claim failed:', e);
        return false;
    }
};
