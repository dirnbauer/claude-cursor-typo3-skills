/**
 * Normalised DOM comparison.
 *
 * The allow-list is the whole point. We normalise ONLY things that are provably volatile:
 * CSRF tokens, nonces, session ids, random element ids, timestamps, debug comments and
 * asset hashes. We never touch text, element order, visually meaningful classes, semantic
 * or ARIA attributes, image sources, srcset, link targets or form structure — because each
 * of those is exactly what a migration is most likely to break.
 *
 * Over-normalisation is itself reported. A rule that suddenly touches an anomalous number
 * of nodes is a finding, not a convenience: an over-broad normaliser silently hides the
 * regression it was supposed to expose, and nothing else in the system would notice.
 */

import { sha256 } from '../run/paths.mjs';

/** Each rule: id, what it replaces, and why it is safe to replace. */
export const RULES = Object.freeze([
  // Two shapes: a token in a JSON/JS assignment, and the far more common HTML form field
  // where name and value are separate attributes.
  // [A-Za-z_]* after the name covers the real-world spellings: csrfToken, csrf_token, csrfValue.
  { id: 'csrf-token', why: 'per-request token in an assignment', re: /((?:csrf|__RequestToken|request_?token|authenticity_token)[A-Za-z_]*["'\s:=]+["']?)[A-Za-z0-9_\-]{8,}/gi, to: '$1<T>' },
  { id: 'csrf-field', why: 'per-request token in a form field', re: /(name=["'](?:__RequestToken|_csrf[A-Za-z_]*|csrf[A-Za-z_]*|authenticity_token)["'][^>]*?\svalue=["'])[^"']{8,}(["'])/gi, to: '$1<T>$2' },
  { id: 'typo3-chash', why: 'cache hash varies per URL build', re: /(\bcHash=)[a-f0-9]{8,}/gi, to: '$1<T>' },
  { id: 'nonce', why: 'CSP nonce is per-response by design', re: /(\bnonce=["'])[A-Za-z0-9+/=_\-]{8,}(["'])/gi, to: '$1<N>$2' },
  { id: 'session-id', why: 'session identifier', re: /((?:PHPSESSID|fe_typo_user|be_typo_user)=)[A-Za-z0-9]{8,}/gi, to: '$1<S>' },
  { id: 'random-id', why: 'framework-generated element id', re: /\b(id=["'])(?:c|el|uid|tx-|ce-)?[a-f0-9]{8}-?[a-f0-9]{4,}(["'])/gi, to: '$1<ID>$2' },
  { id: 'asset-hash', why: 'build hash; the delivered content is compared separately', re: /([._-])[a-f0-9]{8,32}(\.(?:js|css|mjs|woff2?|png|jpe?g|webp|avif|svg))/gi, to: '$1<H>$2' },
  { id: 'asset-query', why: 'cache-busting query on an asset', re: /(\.(?:js|css|mjs|woff2?|png|jpe?g|webp|avif|svg)\?)(?:v=)?[0-9a-f]{6,}/gi, to: '$1<V>' },
  { id: 'iso-timestamp', why: 'render time', re: /\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?/g, to: '<TS>' },
  { id: 'epoch-ms', why: 'render time in milliseconds', re: /\b1[6-9]\d{11}\b/g, to: '<EPOCH>' },
  { id: 'debug-comment', why: 'parse-time debug output', re: /<!--\s*(?:parsetime|generated|cached|debug)[^>]*-->/gi, to: '<!--<D>-->' },
]);

/** Attributes and structures that must NEVER be normalised. Used by the guard below. */
export const NEVER_NORMALISE = Object.freeze([
  'textContent', 'element order', 'class', 'aria-*', 'role',
  'href', 'src', 'srcset', 'sizes', 'alt', 'form structure', 'lang',
]);

const DEFAULT_OVERREACH_LIMIT = 200;

/**
 * @returns {{html:string, hits:Record<string,number>, overreach:string[]}}
 */
export function normalizeHtml(html, { overreachLimit = DEFAULT_OVERREACH_LIMIT } = {}) {
  let out = String(html);
  const hits = {};
  const overreach = [];

  for (const rule of RULES) {
    let count = 0;
    out = out.replace(rule.re, (...args) => {
      count += 1;
      // Re-run the replacement template manually so $1/$2 work with our counter.
      const groups = args.slice(0, -2);
      return rule.to.replace(/\$(\d)/g, (_, n) => groups[Number(n)] ?? '');
    });
    hits[rule.id] = count;
    if (count > overreachLimit) overreach.push(rule.id);
  }

  // Collapse insignificant whitespace between tags only. Text content is untouched.
  out = out.replace(/>\s+</g, '><').trim();

  return { html: out, hits, overreach };
}

export function domHash(html, opts) {
  const { html: normalized, hits, overreach } = normalizeHtml(html, opts);
  return { hash: sha256(normalized), normalized, hits, overreach };
}

/**
 * Template signature: the structural skeleton with text and volatile attributes removed.
 *
 * This is what makes tiered coverage honest rather than a guess. 4,198 news detail pages
 * collapse to one cluster because they share a skeleton, so the report can state truthfully
 * that all of them were proven identical at stages 1 and 2 while a representative carried
 * the pixel proof.
 *
 * Deliberately dependency-free: a tag+class sequence is enough to identify a template, and
 * a full DOM parse here would make the harness need an install to do arithmetic.
 */
export function templateSignature(html) {
  const tokens = [];
  const tagRe = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^>]*)?)>/g;
  let m;
  while ((m = tagRe.exec(String(html))) !== null) {
    const tag = m[1].toLowerCase();
    if (tag === 'script' || tag === 'style') continue;
    const attrs = m[2] ?? '';
    const cls = attrs.match(/\bclass=["']([^"']*)["']/i);
    // Class names carry the template identity; text does not.
    const classes = cls
      ? cls[1].trim().split(/\s+/).filter((c) => !/\d{3,}/.test(c)).sort().join('.')
      : '';
    tokens.push(classes ? `${tag}.${classes}` : tag);
  }
  return { signature: tokens.join('>'), hash: sha256(tokens.join('>')), tagCount: tokens.length };
}

/**
 * Compare two normalised documents. Reports a bounded, readable diff rather than the whole
 * document — a 5,000-URL run must not produce megabytes of prose.
 */
export function compareDom(beforeHtml, afterHtml, { maxSegments = 5, context = 60 } = {}) {
  const b = domHash(beforeHtml);
  const a = domHash(afterHtml);

  if (b.hash === a.hash) {
    return { identical: true, hash: a.hash, segments: [], overreach: [...new Set([...b.overreach, ...a.overreach])] };
  }

  const segments = [];
  const bs = b.normalized;
  const as = a.normalized;

  // First divergence, then a coarse scan for further ones.
  let i = 0;
  const min = Math.min(bs.length, as.length);
  while (i < min && bs[i] === as[i]) i += 1;
  segments.push({
    at: i,
    before: bs.slice(Math.max(0, i - context), i + context),
    after: as.slice(Math.max(0, i - context), i + context),
  });

  if (bs.length !== as.length) {
    segments.push({ at: min, lengthDelta: as.length - bs.length, before: null, after: null });
  }

  return {
    identical: false,
    hash: { before: b.hash, after: a.hash },
    segments: segments.slice(0, maxSegments),
    hits: { before: b.hits, after: a.hits },
    overreach: [...new Set([...b.overreach, ...a.overreach])],
  };
}
