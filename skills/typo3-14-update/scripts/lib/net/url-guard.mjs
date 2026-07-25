/**
 * The URL guard.
 *
 * Every URL this harness touches passes through here, and every one passes through
 * again immediately before it is used - a manifest is a file on disk and can be edited
 * between discovery and navigation.
 *
 * The DDEV tension, and how it is resolved:
 *   A DDEV project is https://acme.ddev.site -> 127.0.0.1. Blanket-blocking private
 *   address space would break the only environment this skill supports. So the guard is
 *   not "block private ranges". It is PINNED-ORIGIN ALLOW-LISTING WITH A PRIVATE-RANGE
 *   BACKSTOP: each allowed origin is resolved once at construction and its addresses are
 *   pinned. Thereafter a private address is permitted only if it is in the pinned set AND
 *   the request's origin is allow-listed.
 *
 *     https://acme.ddev.site -> 127.0.0.1      pass  (pinned + allow-listed)
 *     http://169.254.169.254/                  fail  (origin)
 *     http://redis:6379/                       fail  (origin + port)
 *     https://evil.ddev.site -> 127.0.0.1      fail  (origin)
 *     acme.ddev.site rebinding to 169.254.x    fail  (not in the pinned set)
 *
 *   The pinned set also defeats DNS-rebinding TOCTOU: resolution at check time and the
 *   address actually connected to are compared against the same frozen set.
 */

import dns from 'node:dns/promises';
import net from 'node:net';
import { PolicyError } from '../cli/exit-codes.mjs';

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const DEFAULT_EXTRA_PORTS = new Set([80, 443]);

/* ------------------------------------------------------------------ IP ranges */

/** IPv4 ranges blocked unless pinned. */
const V4_BLOCKED = [
  ['0.0.0.0', 8],          // "this" network
  ['10.0.0.0', 8],         // private
  ['100.64.0.0', 10],      // CGNAT
  ['127.0.0.0', 8],        // loopback
  ['169.254.0.0', 16],     // link-local - cloud metadata lives here
  ['172.16.0.0', 12],      // private
  ['192.0.0.0', 24],       // IETF protocol assignments
  ['192.0.2.0', 24],       // TEST-NET-1
  ['192.88.99.0', 24],     // 6to4 relay anycast
  ['192.168.0.0', 16],     // private
  ['198.18.0.0', 15],      // benchmarking
  ['198.51.100.0', 24],    // TEST-NET-2
  ['203.0.113.0', 24],     // TEST-NET-3
  ['224.0.0.0', 4],        // multicast
  ['240.0.0.0', 4],        // reserved
  ['255.255.255.255', 32], // broadcast
];

function v4ToInt(ip) {
  const parts = ip.split('.');
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const v = Number(p);
    if (v > 255) return null;
    n = (n << 8) | v;
  }
  return n >>> 0;
}

function inV4Range(ip, base, bits) {
  const a = v4ToInt(ip);
  const b = v4ToInt(base);
  if (a === null || b === null) return false;
  if (bits === 0) return true;
  const mask = (0xffffffff << (32 - bits)) >>> 0;
  return (a & mask) === (b & mask);
}

/** Expand IPv6 to 8 groups of 4 hex digits. */
function expandV6(ip) {
  let addr = ip.replace(/^\[|\]$/g, '');
  const zone = addr.indexOf('%');
  if (zone !== -1) addr = addr.slice(0, zone);

  // IPv4-mapped / NAT64 / 6to4 tails are handled by the caller via embeddedV4.
  const [head, tail = ''] = addr.split('::');
  const headGroups = head ? head.split(':').filter(Boolean) : [];
  const tailGroups = tail ? tail.split(':').filter(Boolean) : [];
  const fill = 8 - headGroups.length - tailGroups.length;
  if (fill < 0) return null;
  const groups = [
    ...headGroups,
    ...Array(addr.includes('::') ? fill : 0).fill('0'),
    ...tailGroups,
  ];
  if (groups.length !== 8) return null;
  return groups.map((g) => g.padStart(4, '0').toLowerCase());
}

/** Pull an embedded IPv4 address out of ::ffff:x, 64:ff9b::x (NAT64) or 2002:x (6to4). */
function embeddedV4(ip) {
  const dotted = ip.match(/(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (dotted && /^::ffff:/i.test(ip)) return dotted[1];

  const g = expandV6(ip);
  if (!g) return null;
  const joined = g.join(':');
  if (joined.startsWith('0000:0000:0000:0000:0000:ffff')) {
    return [
      parseInt(g[6].slice(0, 2), 16), parseInt(g[6].slice(2), 16),
      parseInt(g[7].slice(0, 2), 16), parseInt(g[7].slice(2), 16),
    ].join('.');
  }
  if (joined.startsWith('0064:ff9b:')) {            // NAT64 well-known prefix
    return [
      parseInt(g[6].slice(0, 2), 16), parseInt(g[6].slice(2), 16),
      parseInt(g[7].slice(0, 2), 16), parseInt(g[7].slice(2), 16),
    ].join('.');
  }
  if (g[0] === '2002') {                             // 6to4 embeds v4 in groups 1-2
    return [
      parseInt(g[1].slice(0, 2), 16), parseInt(g[1].slice(2), 16),
      parseInt(g[2].slice(0, 2), 16), parseInt(g[2].slice(2), 16),
    ].join('.');
  }
  return null;
}

const V6_BLOCKED_PREFIXES = [
  '0000:0000:0000:0000:0000:0000:0000:0000', // ::/128 unspecified
  '0000:0000:0000:0000:0000:0000:0000:0001', // ::1/128 loopback
  '2001:0db8',                                // documentation
  '0100:0000:0000:0000',                      // 100::/64 discard
];

export function isBlockedAddress(ip) {
  if (net.isIPv4(ip)) {
    return V4_BLOCKED.some(([base, bits]) => inV4Range(ip, base, bits));
  }
  if (net.isIPv6(ip)) {
    const v4 = embeddedV4(ip);
    if (v4) return isBlockedAddress(v4);       // unmap, then re-check as IPv4
    const g = expandV6(ip);
    if (!g) return true;                        // unparseable -> refuse
    const joined = g.join(':');
    if (V6_BLOCKED_PREFIXES.some((p) => joined.startsWith(p))) return true;
    const first = parseInt(g[0], 16);
    if ((first & 0xfe00) === 0xfc00) return true;  // fc00::/7 unique local
    if ((first & 0xffc0) === 0xfe80) return true;  // fe80::/10 link-local
    if ((first & 0xff00) === 0xff00) return true;  // ff00::/8 multicast
    return false;
  }
  return true;                                  // not an IP literal -> refuse
}

/**
 * Reject obfuscated IPv4 literals that bypass naive string checks:
 *   2130706433, 0x7f000001, 0177.0.0.1, 127.1
 * A hostname that is entirely numeric/hex is never a legitimate DDEV host.
 */
export function isObfuscatedIpLiteral(host) {
  if (net.isIP(host)) return false;                 // a proper literal is handled elsewhere
  if (/^0x[0-9a-f]+$/i.test(host)) return true;     // hex
  if (/^\d+$/.test(host)) return true;              // decimal
  if (/^0[0-7]+(\.[0-7]+)*$/.test(host)) return true; // octal
  if (/^\d{1,3}(\.\d{1,3}){1,2}$/.test(host)) return true; // short form 127.1
  return false;
}

/* ------------------------------------------------------------------ the guard */

export class UrlGuard {
  /**
   * @param {object}   opts
   * @param {string[]} opts.allowedOrigins  exact origins (scheme + host + port)
   * @param {Map<string,string[]>} [opts.pinnedAddresses]  host -> resolved addresses
   * @param {number[]} [opts.extraPorts]
   * @param {(h:string)=>Promise<string[]>} [opts.resolver]  injectable for tests
   */
  constructor({ allowedOrigins = [], pinnedAddresses = new Map(), extraPorts = [], resolver } = {}) {
    this.allowedOrigins = new Set(allowedOrigins.map(normalizeOrigin));
    this.pinnedAddresses = pinnedAddresses;
    this.allowedPorts = new Set([...DEFAULT_EXTRA_PORTS, ...extraPorts]);
    for (const o of this.allowedOrigins) {
      const u = new URL(o);
      if (u.port) this.allowedPorts.add(Number(u.port));
    }
    this._resolve = resolver ?? (async (host) => {
      const rs = await dns.lookup(host, { all: true, verbatim: true });
      return rs.map((r) => r.address);
    });
  }

  /** Resolve every allowed origin once and freeze its addresses. */
  static async create({ allowedOrigins = [], extraPorts = [], resolver } = {}) {
    const guard = new UrlGuard({ allowedOrigins, extraPorts, resolver });
    for (const origin of guard.allowedOrigins) {
      const host = new URL(origin).hostname;
      if (guard.pinnedAddresses.has(host)) continue;
      if (net.isIP(host)) { guard.pinnedAddresses.set(host, [stripBrackets(host)]); continue; }
      try {
        guard.pinnedAddresses.set(host, await guard._resolve(host));
      } catch (err) {
        throw new PolicyError(`Cannot resolve allowed origin host: ${host}`, { host, cause: String(err) });
      }
    }
    return guard;
  }

  isAllowedOrigin(origin) { return this.allowedOrigins.has(normalizeOrigin(origin)); }

  /**
   * The one entry point. Throws PolicyError (exit 5) on refusal.
   * @returns {Promise<{url: URL, origin: string, addresses: string[], pinned: boolean}>}
   */
  async assertUrl(raw, { purpose = 'fetch' } = {}) {
    let url;
    try {
      url = new URL(String(raw));
    } catch {
      throw new PolicyError(`Unparseable URL (${purpose})`, { purpose, raw: String(raw).slice(0, 200) });
    }

    if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
      throw new PolicyError(`Unsupported protocol: ${url.protocol}`, { purpose, protocol: url.protocol });
    }
    if (url.username || url.password) {
      throw new PolicyError('URL carries embedded credentials', { purpose });
    }

    // Normalise, but NEVER rewrite the scheme. Rewriting http -> https is precisely how
    // the old getSitemapTargets() made an http:// DDEV project discover zero URLs.
    url.hash = '';
    const host = stripBrackets(url.hostname.toLowerCase().replace(/\.$/, ''));

    if (isObfuscatedIpLiteral(host)) {
      throw new PolicyError(`Obfuscated IP literal rejected: ${host}`, { purpose, host });
    }

    if (!this.isAllowedOrigin(url.origin)) {
      throw new PolicyError(`Cross-origin URL rejected: ${url.origin}`, {
        purpose, origin: url.origin, allowed: [...this.allowedOrigins],
      });
    }

    const port = url.port ? Number(url.port) : (url.protocol === 'https:' ? 443 : 80);
    if (!this.allowedPorts.has(port)) {
      throw new PolicyError(`Port not allowed: ${port}`, { purpose, port });
    }

    const pinned = this.pinnedAddresses.get(host) ?? null;
    let addresses;
    if (net.isIP(host)) {
      addresses = [host];
    } else {
      try {
        addresses = await this._resolve(host);
      } catch (err) {
        throw new PolicyError(`DNS resolution failed for ${host}`, { purpose, host, cause: String(err) });
      }
    }
    if (!addresses.length) {
      throw new PolicyError(`No addresses for ${host}`, { purpose, host });
    }

    // EVERY returned address must pass. A multi-A record with one good and one bad
    // address is a rebinding primitive, not a valid host.
    for (const addr of addresses) {
      const isPinned = pinned ? pinned.includes(addr) : false;
      if (isBlockedAddress(addr) && !isPinned) {
        throw new PolicyError(`Address in blocked range: ${addr} (${host})`, {
          purpose, host, address: addr, pinned: pinned ?? [],
        });
      }
      if (pinned && !isPinned) {
        // Resolved to something outside the frozen set - DNS rebinding.
        throw new PolicyError(`Host resolved outside its pinned address set: ${host} -> ${addr}`, {
          purpose, host, address: addr, pinned,
        });
      }
    }

    return { url, origin: url.origin, addresses, pinned: Boolean(pinned) };
  }

  /** Re-validate a redirect target resolved against the current URL. */
  async assertRedirect(location, currentUrl, { purpose = 'redirect' } = {}) {
    const next = new URL(location, currentUrl);
    const result = await this.assertUrl(next.href, { purpose });
    const sameOrigin = new URL(currentUrl).origin === result.origin;
    return { ...result, sameOrigin };
  }

  /** Assert a post-navigation URL never left the trusted origin. Used after every
   *  page.goto, on framenavigated, and around the backend login POST. */
  assertSameOrigin(actualUrl, expectedOrigin, { purpose = 'navigation' } = {}) {
    let actual;
    try { actual = new URL(actualUrl); } catch {
      throw new PolicyError(`Unparseable URL after ${purpose}`, { purpose });
    }
    if (normalizeOrigin(actual.origin) !== normalizeOrigin(expectedOrigin)) {
      throw new PolicyError(
        `Navigation left the trusted origin during ${purpose}: ${actual.origin} != ${expectedOrigin}`,
        { purpose, actual: actual.origin, expected: expectedOrigin },
      );
    }
    return true;
  }
}

function stripBrackets(h) { return h.replace(/^\[|\]$/g, ''); }

export function normalizeOrigin(origin) {
  try {
    const u = new URL(origin);
    const host = stripBrackets(u.hostname.toLowerCase().replace(/\.$/, ''));
    const port = u.port ? Number(u.port) : (u.protocol === 'https:' ? 443 : 80);
    const isDefault = (u.protocol === 'https:' && port === 443) || (u.protocol === 'http:' && port === 80);
    return `${u.protocol}//${host}${isDefault ? '' : `:${port}`}`;
  } catch {
    return String(origin);
  }
}
