/**
 * Bounded sitemap walker.
 *
 * The previous implementation followed sitemap-index files recursively with no visited
 * set, no depth cap, no document cap, no size cap and no origin check, and it downgraded
 * every fetch failure to a warning - so a run could "succeed" having discovered nothing.
 *
 * Here: every loc is guarded before it is queued AND before it is persisted, recursion is
 * bounded in three independent ways, and every failure is RECORDED in the manifest rather
 * than logged and forgotten. A gap you cannot see is worse than one you can.
 */

import { safeFetch, CONTENT_TYPES } from './safe-fetch.mjs';
import { PolicyError } from '../cli/exit-codes.mjs';

export const SITEMAP_LIMITS = Object.freeze({
  maxDepth: 3,
  maxDocuments: 50,
  maxUrls: 20_000,
  maxBytesPerDocument: 5 * 1024 * 1024,
});

/** Minimal, entity-expansion-free XML tag extraction.
 *  We deliberately do NOT use a general XML parser with entity processing enabled:
 *  XXE and billion-laughs both arrive through entities, and we only need <loc>. */
export function extractLocs(xml) {
  if (/<!ENTITY/i.test(xml)) {
    throw new PolicyError('Sitemap declares XML entities; refusing to parse', { reason: 'xxe-guard' });
  }
  const locs = [];
  const re = /<loc\b[^>]*>([\s\S]*?)<\/loc>/gi;
  let m;
  while ((m = re.exec(xml)) !== null) {
    const raw = m[1]
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .trim()
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'");
    if (raw) locs.push(raw);
  }
  return locs;
}

export function isSitemapIndex(xml) {
  return /<sitemapindex\b/i.test(xml);
}

/**
 * @returns {Promise<{urls:string[], documents:Array<{url:string,status:string,httpStatus:number|null,
 *          urlCount:number,depth:number,bytes:number,error:string|null}>, truncated:boolean}>}
 */
export async function walkSitemaps(guard, entryPoints, {
  limits = SITEMAP_LIMITS,
  fetchImpl,
  onDocument,
} = {}) {
  const visited = new Set();
  const urls = new Set();
  const documents = [];
  let truncated = false;

  const queue = [];
  for (const e of entryPoints) queue.push({ url: e, depth: 0 });

  while (queue.length) {
    const { url, depth } = queue.shift();

    let normalized;
    try {
      normalized = (await guard.assertUrl(url, { purpose: 'sitemap' })).url.href;
    } catch (err) {
      documents.push({ url: redactUrl(url), status: 'guard-blocked', httpStatus: null,
                       urlCount: 0, depth, bytes: 0, error: err.message });
      continue;
    }

    if (visited.has(normalized)) continue;
    visited.add(normalized);

    if (depth > limits.maxDepth) {
      documents.push({ url: normalized, status: 'truncated', httpStatus: null, urlCount: 0,
                       depth, bytes: 0, error: `maxDepth ${limits.maxDepth} exceeded` });
      truncated = true;
      continue;
    }
    if (documents.length >= limits.maxDocuments) {
      documents.push({ url: normalized, status: 'truncated', httpStatus: null, urlCount: 0,
                       depth, bytes: 0, error: `maxDocuments ${limits.maxDocuments} reached` });
      truncated = true;
      break;
    }

    let res;
    try {
      res = await safeFetch(guard, normalized, {
        purpose: 'sitemap',
        accept: 'sitemap',
        maxBytes: limits.maxBytesPerDocument,
        fetchImpl,
      });
    } catch (err) {
      documents.push({ url: normalized, status: 'failed', httpStatus: null, urlCount: 0,
                       depth, bytes: 0, error: err.message });
      continue;
    }

    if (res.status !== 200) {
      documents.push({ url: normalized, status: 'failed', httpStatus: res.status, urlCount: 0,
                       depth, bytes: res.bytes, error: `HTTP ${res.status}` });
      continue;
    }

    let locs;
    try {
      locs = extractLocs(res.body);
    } catch (err) {
      documents.push({ url: normalized, status: 'failed', httpStatus: res.status, urlCount: 0,
                       depth, bytes: res.bytes, error: err.message });
      continue;
    }

    const index = isSitemapIndex(res.body);
    let accepted = 0;

    for (const loc of locs) {
      if (index) {
        queue.push({ url: loc, depth: depth + 1 });
        accepted += 1;
      } else {
        if (urls.size >= limits.maxUrls) { truncated = true; break; }
        // Guard again before PERSISTING, not only before fetching.
        try {
          const ok = await guard.assertUrl(loc, { purpose: 'sitemap-entry' });
          urls.add(ok.url.href);
          accepted += 1;
        } catch { /* recorded via the document status below */ }
      }
    }

    const doc = {
      url: normalized,
      status: index ? 'index' : 'ok',
      httpStatus: res.status,
      urlCount: accepted,
      rejected: locs.length - accepted,
      depth,
      bytes: res.bytes,
      error: null,
    };
    documents.push(doc);
    onDocument?.(doc);
  }

  return { urls: [...urls].sort(), documents, truncated };
}

function redactUrl(u) {
  try {
    const url = new URL(u);
    if (url.search) url.search = '[redacted]';
    return url.href;
  } catch { return '[unparseable]'; }
}
