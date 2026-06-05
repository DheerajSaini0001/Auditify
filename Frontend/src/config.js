// Single source of truth for the API base URL.
// In production, VITE_API_URL MUST be set at build time. We only fall back to
// localhost during local dev — in a prod build we fall back to a relative origin
// (same-domain/proxy) and log loudly, instead of silently pointing at localhost.
const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? 'http://localhost:2000' : '');

if (!import.meta.env.VITE_API_URL && !import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.error(
    '[config] VITE_API_URL is not set for this production build — API calls will use a relative origin.'
  );
}

export { API_URL };
export default API_URL;
