// Guest audit grant — persistence + reuse.
//
// A guest clears ONE single-digit addition; /single-audit/verify-captcha returns a
// signed JWT grant (default 2 hours, GUEST_AUDIT_TOKEN_TTL_MIN). We keep that grant in
// localStorage and replay it on subsequent audits, so the guest is asked again only
// once it actually expires — matching the backend, which accepts the same token (and a
// session-cookie fallback) for the whole TTL window. It's localStorage, not session
// storage, on purpose: the grant has to survive a refresh and a new tab to be worth
// anything.

const KEY = 'dealerpulse_guest_grant';

// The backend's "you still need to verify" rejection. Callers that kept only the
// message string test it against this; the 401 also carries code VERIFICATION_REQUIRED.
// The retired email/OTP wording is matched too — the gate still honors grants that flow
// minted, so a stale message must not leave the user stuck on a dead form.
export const NEEDS_VERIFY_RE = /verification|verify your email/i;
// Don't send a token that's about to expire mid-request — treat the last 30s as expired.
const EXPIRY_SKEW_MS = 30 * 1000;

// Read the `exp` claim (seconds since epoch) out of a JWT without a library. base64url →
// base64 (+ padding) → JSON. Returns 0 when the token is malformed/opaque.
function jwtExpiryMs(token) {
  try {
    const payload = token.split('.')[1];
    if (!payload) return 0;
    let b64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const json = JSON.parse(atob(b64));
    return typeof json.exp === 'number' ? json.exp * 1000 : 0;
  } catch {
    return 0;
  }
}

// Persist the grant returned by verify-captcha.
export function saveGuestGrant(token) {
  if (!token) return;
  try { localStorage.setItem(KEY, token); } catch { /* storage unavailable */ }
}

// Return the stored grant only while it's still comfortably valid; otherwise drop it and
// return null (caller then shows the verify modal again).
export function getValidGuestGrant() {
  try {
    const token = localStorage.getItem(KEY);
    if (!token) return null;
    const exp = jwtExpiryMs(token);
    // exp === 0 → couldn't read an expiry; keep it (the backend will reject a truly dead
    // token, and that path clears it). Otherwise honor the real expiry minus the skew.
    if (exp === 0 || exp - EXPIRY_SKEW_MS > Date.now()) return token;
    localStorage.removeItem(KEY);
    return null;
  } catch {
    return null;
  }
}

// Drop the grant — call this when the backend says verification is required again.
export function clearGuestGrant() {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable */ }
}
