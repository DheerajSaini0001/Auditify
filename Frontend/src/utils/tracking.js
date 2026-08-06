const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:2000';

/**
 * Client-side analytics beacons.
 *
 * Only fires for the handful of events the SERVER cannot observe: a button being
 * clicked (a click that fails validation never reaches an API, but it is exactly
 * the drop-off the admin funnel needs to see), a report page being opened, and a
 * session ending when the tab closes. Everything else — audits started, audits
 * completed, downloads, logins — is recorded server-side where it cannot be faked.
 *
 * Every call here is best-effort and silent. Analytics must never break a page:
 * a failed beacon is swallowed, and nothing in the app awaits one.
 */

/**
 * Send one event.
 *
 * `credentials: 'include'` matters more than it looks — the sessionId cookie is
 * what ties an anonymous visitor's events together into one journey, and without
 * it every beacon would look like a brand new session.
 */
export const trackEvent = (action, payload = {}) => {
  try {
    const token = localStorage.getItem('dealerpulse_token');
    fetch(`${API_URL}/api/track/event`, {
      method: 'POST',
      credentials: 'include',
      keepalive: true, // survive a navigation started by the same click
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action, ...payload }),
    }).catch(() => { /* analytics must never surface an error to the user */ });
  } catch {
    /* localStorage can throw in private-mode Safari — never let that break a click */
  }
};

/**
 * End-of-session beacon.
 *
 * Uses sendBeacon, not fetch: once the tab is closing the browser will cancel an
 * in-flight fetch, and this is the one event that has nothing after it to retry.
 * sendBeacon is queued by the browser and delivered regardless.
 *
 * It cannot set an Authorization header, which is fine — the session cookie is
 * what identifies the session, and the server already knows which account (if
 * any) claimed it.
 */
export const trackSessionEnd = (exitPage = null) => {
  try {
    const body = JSON.stringify({ action: 'SESSION_END', exitPage: exitPage || window.location.pathname });
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        `${API_URL}/api/track/event`,
        new Blob([body], { type: 'application/json' })
      );
    }
  } catch {
    /* nothing useful to do while the tab is closing */
  }
};

/**
 * Keep the current session marked alive (and claim it for the account after a
 * login). Deliberately separate from trackEvent so a long-lived tab does not
 * write an activity row every few minutes — the activity log records what
 * someone did, not that their tab stayed open.
 */
export const trackHeartbeat = () => {
  try {
    const token = localStorage.getItem('dealerpulse_token');
    fetch(`${API_URL}/api/track/heartbeat`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).catch(() => {});
  } catch { /* ignore */ }
};

export default { trackEvent, trackSessionEnd, trackHeartbeat };
