/**
 * Stage 1: HTTP and metadata comparison, 100% of URLs, no exception.
 *
 * The cheapest stage and the one that catches most routing and SEO regressions. If it
 * cannot cover every URL the run is INVALID, not "sampled" — a partial stage 1 undermines
 * every claim the later stages make.
 *
 * Header handling is deliberate: values that legitimately vary per response are ignored,
 * but Set-Cookie NAMES are compared, because a new cookie appearing after an update is a
 * finding (privacy, caching, and consent all change) even though its value is noise.
 */

export const COMPARED_FIELDS = Object.freeze([
  'status', 'finalUrl', 'redirectChain', 'contentType', 'contentLanguage',
  'canonical', 'hreflang', 'title', 'metaDescription', 'robots',
  'openGraph', 'twitter', 'jsonLd', 'htmlLang', 'headers', 'cookieNames',
]);

export const HEADER_ALLOWLIST = Object.freeze([
  'content-type', 'content-language', 'cache-control', 'x-robots-tag', 'link', 'vary',
  'content-security-policy', 'x-frame-options', 'x-content-type-options',
  'referrer-policy', 'permissions-policy', 'strict-transport-security',
]);

export const VOLATILE_HEADERS = Object.freeze([
  'date', 'etag', 'last-modified', 'age', 'x-request-id', 'server-timing', 'set-cookie',
]);

/** Extract the comparable record from a fetched response + body. Pure, so it is testable. */
export function extractRecord({ url, status, headers, body, redirects = [] }) {
  const h = normaliseHeaders(headers);
  return {
    url,
    status,
    finalUrl: url,
    redirectChain: redirects,
    contentType: (h['content-type'] ?? '').split(';')[0].trim() || null,
    contentLanguage: h['content-language'] ?? null,
    canonical: matchAttr(body, /<link[^>]+rel=["']canonical["'][^>]*>/i, /href=["']([^"']+)["']/i),
    hreflang: matchAll(body, /<link[^>]+rel=["']alternate["'][^>]*>/gi)
      .map((tag) => ({
        lang: pick(tag, /hreflang=["']([^"']+)["']/i),
        href: pick(tag, /href=["']([^"']+)["']/i),
      }))
      .filter((x) => x.lang)
      .sort((a, b) => String(a.lang).localeCompare(String(b.lang))),
    title: decode(pick(body, /<title[^>]*>([\s\S]*?)<\/title>/i)),
    metaDescription: metaContent(body, 'description'),
    robots: metaContent(body, 'robots'),
    openGraph: metaProps(body, /property=["']og:([^"']+)["']/i),
    twitter: metaProps(body, /name=["']twitter:([^"']+)["']/i),
    jsonLd: matchAll(body, /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)
      .map((block) => {
        const inner = block.replace(/^[\s\S]*?>/, '').replace(/<\/script>$/i, '');
        try {
          const parsed = JSON.parse(inner);
          return { valid: true, types: jsonLdTypes(parsed) };
        } catch (err) {
          return { valid: false, error: String(err.message).slice(0, 120) };
        }
      }),
    htmlLang: pick(body, /<html[^>]+lang=["']([^"']+)["']/i),
    headers: Object.fromEntries(HEADER_ALLOWLIST.filter((k) => k in h).map((k) => [k, h[k]])),
    cookieNames: cookieNames(headers),
  };
}

/** @returns {{identical:boolean, differences:Array<{field:string,before:*,after:*}>}} */
export function compareRecords(before, after) {
  const differences = [];
  const diff = (field, b, a) => {
    if (JSON.stringify(b ?? null) !== JSON.stringify(a ?? null)) {
      differences.push({ field, before: b ?? null, after: a ?? null });
    }
  };

  diff('status', before.status, after.status);
  diff('finalUrl', before.finalUrl, after.finalUrl);
  diff('redirectChain', before.redirectChain, after.redirectChain);
  diff('contentType', before.contentType, after.contentType);
  diff('contentLanguage', before.contentLanguage, after.contentLanguage);
  diff('canonical', before.canonical, after.canonical);
  diff('hreflang', before.hreflang, after.hreflang);
  diff('title', before.title, after.title);
  diff('metaDescription', before.metaDescription, after.metaDescription);
  diff('robots', before.robots, after.robots);
  diff('openGraph', before.openGraph, after.openGraph);
  diff('twitter', before.twitter, after.twitter);
  diff('jsonLd', before.jsonLd, after.jsonLd);
  diff('htmlLang', before.htmlLang, after.htmlLang);
  diff('headers', before.headers, after.headers);
  diff('cookieNames', before.cookieNames, after.cookieNames);

  return { identical: differences.length === 0, differences };
}

/* ---------------------------------------------------------------- helpers */

function normaliseHeaders(headers) {
  const out = {};
  const entries = headers instanceof Headers ? [...headers.entries()] : Object.entries(headers ?? {});
  for (const [k, v] of entries) {
    const key = k.toLowerCase();
    if (VOLATILE_HEADERS.includes(key) && key !== 'set-cookie') continue;
    out[key] = v;
  }
  return out;
}

function cookieNames(headers) {
  const raw = headers instanceof Headers
    ? (headers.getSetCookie?.() ?? [headers.get('set-cookie')].filter(Boolean))
    : [].concat(headers?.['set-cookie'] ?? []);
  return raw
    .map((c) => String(c).split('=')[0].trim())
    .filter(Boolean)
    .sort();
}

function pick(text, re) { const m = String(text ?? '').match(re); return m ? m[1] : null; }
function matchAll(text, re) { return String(text ?? '').match(re) ?? []; }
function matchAttr(text, tagRe, attrRe) { const tag = String(text ?? '').match(tagRe); return tag ? pick(tag[0], attrRe) : null; }

function metaContent(body, name) {
  const tag = matchAll(body, /<meta[^>]*>/gi).find((t) => new RegExp(`name=["']${name}["']`, 'i').test(t));
  return tag ? decode(pick(tag, /content=["']([^"']*)["']/i)) : null;
}

function metaProps(body, keyRe) {
  const out = {};
  for (const tag of matchAll(body, /<meta[^>]*>/gi)) {
    const key = pick(tag, keyRe);
    if (key) out[key] = decode(pick(tag, /content=["']([^"']*)["']/i));
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

function jsonLdTypes(node, acc = []) {
  if (Array.isArray(node)) { for (const n of node) jsonLdTypes(n, acc); return acc.sort(); }
  if (node && typeof node === 'object') {
    if (node['@type']) acc.push(...[].concat(node['@type']));
    for (const v of Object.values(node)) if (v && typeof v === 'object') jsonLdTypes(v, acc);
  }
  return acc.sort();
}

function decode(s) {
  if (s === null || s === undefined) return null;
  return String(s)
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
