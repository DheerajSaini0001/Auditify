import dns from "dns";

const dnsLookup = dns.promises.lookup;

/**
 * Returns true if an IPv4/IPv6 address is private, loopback, link-local,
 * unique-local, CGNAT, or a cloud-metadata address — i.e. must NOT be reachable
 * by a user-supplied-URL fetcher (SSRF protection).
 */
const isPrivateIp = (ip) => {
  if (!ip) return true;

  // Normalise IPv4-mapped IPv6 (e.g. ::ffff:127.0.0.1)
  const mapped = ip.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  if (mapped) ip = mapped[1];

  // IPv4
  if (/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    const o = ip.split(".").map(Number);
    if (o.some((n) => Number.isNaN(n) || n < 0 || n > 255)) return true;
    const [a, b] = o;
    if (a === 0) return true;                         // 0.0.0.0/8
    if (a === 10) return true;                        // 10.0.0.0/8
    if (a === 127) return true;                       // loopback
    if (a === 169 && b === 254) return true;          // link-local + cloud metadata (169.254.169.254)
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true;          // 192.168.0.0/16
    if (a === 100 && b >= 64 && b <= 127) return true;// CGNAT 100.64.0.0/10
    if (a >= 224) return true;                        // multicast / reserved
    return false;
  }

  // IPv6
  const lower = ip.toLowerCase();
  if (lower === "::1" || lower === "::") return true;    // loopback / unspecified
  if (lower.startsWith("fe80")) return true;             // link-local
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // unique-local fc00::/7
  return false;
};

/**
 * Validates a user-supplied URL for fetching. Rejects non-http(s) protocols and
 * any host that resolves to a private/internal/metadata address.
 * @param {string} input
 * @returns {Promise<boolean>}
 */
export const isSafeUrl = async (input) => {
  let url;
  try {
    url = new URL(input);
  } catch {
    return false;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname.replace(/^\[|\]$/g, ""); // strip IPv6 brackets

  // Obvious local hostnames
  if (host === "localhost" || host.endsWith(".localhost") || host === "metadata.google.internal") {
    return false;
  }

  // If the host is a literal IP, check it directly.
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(":")) {
    return !isPrivateIp(host);
  }

  // Otherwise resolve DNS and reject if ANY resolved address is private.
  try {
    const addresses = await dnsLookup(host, { all: true });
    if (!addresses.length) return false;
    return addresses.every((a) => !isPrivateIp(a.address));
  } catch {
    return false; // unresolvable host
  }
};

export default isSafeUrl;
