import dns from "dns/promises";
import net from "net";

/**
 * SSRF guard for user-supplied audit targets.
 *
 * The old per-controller `isValidUrl()` did lexical string checks on the
 * hostname (`startsWith("10.")` etc). That misses the cloud-metadata IP
 * (169.254.169.254), decimal/hex/octal IP encodings, IPv6, IPv4-mapped IPv6,
 * and — most importantly — any DNS name that *resolves* to an internal address.
 *
 * This guard instead resolves the hostname and validates every resolved IP
 * against the private/reserved ranges. A target is only accepted if it parses
 * as http(s) AND every A/AAAA record is a public address.
 *
 * NOTE (residual risk): the downstream fetchers (axios, Puppeteer) re-resolve
 * DNS independently, so a TTL-0 rebind between this check and the fetch is still
 * theoretically possible. Pinning the resolved IP through every egress path
 * (ideally a vetting forward proxy) is the complete fix; this guard closes the
 * direct-IP / internal-hostname / metadata vectors, which are the real-world ones.
 */

// Parse "a.b.c.d" → true if it falls in a private/reserved/loopback/link-local range.
function isPrivateIPv4(ip) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true; // malformed → treat as unsafe
  }
  const [a, b] = parts;
  if (a === 0) return true;                          // 0.0.0.0/8 "this host"
  if (a === 10) return true;                         // 10.0.0.0/8 private
  if (a === 127) return true;                        // 127.0.0.0/8 loopback
  if (a === 169 && b === 254) return true;           // 169.254.0.0/16 link-local (cloud metadata)
  if (a === 172 && b >= 16 && b <= 31) return true;  // 172.16.0.0/12 private
  if (a === 192 && b === 168) return true;           // 192.168.0.0/16 private
  if (a === 100 && b >= 64 && b <= 127) return true; // 100.64.0.0/10 CGNAT
  if (a === 192 && b === 0) return true;             // 192.0.0.0/24 + 192.0.2.0/24 special-use
  if (a === 198 && (b === 18 || b === 19)) return true; // 198.18.0.0/15 benchmark
  if (a === 198 && b === 51) return true;            // 198.51.100.0/24 test-net-2
  if (a === 203 && b === 0) return true;             // 203.0.113.0/24 test-net-3
  if (a >= 224) return true;                         // 224.0.0.0/4 multicast + 240.0.0.0/4 reserved/broadcast
  return false;
}

function isPrivateIPv6(ip) {
  const addr = ip.toLowerCase().split("%")[0]; // strip zone id

  // IPv4-mapped IPv6 in dotted form (::ffff:127.0.0.1) or — as Node normalizes it
  // — hex form (::ffff:7f00:1). Convert the embedded v4 and validate that.
  const mapped = addr.match(/^::ffff:(.+)$/);
  if (mapped) {
    const rest = mapped[1];
    if (rest.includes(".")) return isPrivateIPv4(rest);
    const groups = rest.split(":");
    if (groups.length === 2) {
      const hi = parseInt(groups[0] || "0", 16) || 0;
      const lo = parseInt(groups[1] || "0", 16) || 0;
      return isPrivateIPv4(`${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`);
    }
    return true; // unparseable mapped form → unsafe
  }
  // Deprecated IPv4-compatible (::a.b.c.d)
  const compat = addr.match(/^::(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (compat) return isPrivateIPv4(compat[1]);

  if (addr === "::1" || addr === "::") return true;  // loopback / unspecified
  if (addr.startsWith("fe8") || addr.startsWith("fe9") ||
      addr.startsWith("fea") || addr.startsWith("feb")) return true; // fe80::/10 link-local
  if (addr.startsWith("fc") || addr.startsWith("fd")) return true;   // fc00::/7 unique-local
  if (addr.startsWith("ff")) return true;            // ff00::/8 multicast
  if (addr.startsWith("2001:db8")) return true;      // documentation
  if (addr.startsWith("64:ff9b")) {                  // NAT64 → embedded v4
    const tail = addr.split(":").pop();
    if (tail && tail.includes(".")) return isPrivateIPv4(tail);
  }
  return false;
}

export function isPrivateIp(ip) {
  const kind = net.isIP(ip);
  if (kind === 4) return isPrivateIPv4(ip);
  if (kind === 6) return isPrivateIPv6(ip);
  return true; // not a valid IP literal → unsafe
}

/**
 * Validate a user-supplied URL for safe outbound fetching.
 * @param {string} rawUrl
 * @returns {Promise<{ ok: boolean, reason?: string, url?: string }>}
 */
export async function validateUrlSafety(rawUrl) {
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "Malformed URL" };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, reason: "Only http and https URLs are allowed" };
  }

  // Reject embedded credentials (http://user:pass@host) — common SSRF/abuse vector.
  if (parsed.username || parsed.password) {
    return { ok: false, reason: "Credentials in URL are not allowed" };
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, ""); // unwrap [IPv6]

  // If the host is already an IP literal, check it directly (covers decimal/hex
  // forms too, since new URL normalizes 0x7f000001 / 2130706433 to dotted-quad).
  if (net.isIP(hostname)) {
    if (isPrivateIp(hostname)) {
      return { ok: false, reason: "URL points to a private or reserved IP address" };
    }
    return { ok: true, url: parsed.toString() };
  }

  // Otherwise resolve the hostname and reject if ANY record is internal.
  let addresses;
  try {
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    // Let the existence check downstream produce the user-facing "site not found".
    return { ok: false, reason: "Host could not be resolved" };
  }

  if (!addresses.length) {
    return { ok: false, reason: "Host could not be resolved" };
  }

  for (const { address } of addresses) {
    if (isPrivateIp(address)) {
      return { ok: false, reason: "URL resolves to a private or reserved IP address" };
    }
  }

  return { ok: true, url: parsed.toString() };
}

export default validateUrlSafety;
