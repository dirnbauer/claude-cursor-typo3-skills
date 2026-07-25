import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { walkSitemaps, extractLocs, isSitemapIndex, SITEMAP_LIMITS } from '../../lib/net/sitemap.mjs';
import { UrlGuard } from '../../lib/net/url-guard.mjs';
import { EXIT } from '../../lib/cli/exit-codes.mjs';

const ORIGIN = 'https://acme.ddev.site';
const resolver = async (h) => (h === 'acme.ddev.site' ? ['127.0.0.1'] : (() => { throw new Error('ENOTFOUND'); })());
const guard = () => UrlGuard.create({ allowedOrigins: [ORIGIN], resolver });

/** Serve a fixed map of url -> xml, as a fetch replacement. */
function fetchFrom(map, { contentType = 'application/xml' } = {}) {
  return async (url) => {
    const body = map[url];
    if (body === undefined) {
      return new Response('not found', { status: 404, headers: { 'content-type': contentType } });
    }
    return new Response(body, { status: 200, headers: { 'content-type': contentType } });
  };
}

const urlset = (locs) =>
  `<?xml version="1.0"?><urlset>${locs.map((l) => `<loc>${l}</loc>`).join('')}</urlset>`;
const index = (locs) =>
  `<?xml version="1.0"?><sitemapindex>${locs.map((l) => `<loc>${l}</loc>`).join('')}</sitemapindex>`;

describe('extractLocs', () => {
  test('reads plain and CDATA locs and decodes entities', () => {
    const xml = `<urlset><loc>${ORIGIN}/a</loc><loc><![CDATA[${ORIGIN}/b]]></loc><loc>${ORIGIN}/c?x=1&amp;y=2</loc></urlset>`;
    assert.deepEqual(extractLocs(xml), [`${ORIGIN}/a`, `${ORIGIN}/b`, `${ORIGIN}/c?x=1&y=2`]);
  });

  test('refuses a document declaring entities (XXE / billion laughs)', () => {
    const xxe = `<?xml version="1.0"?><!DOCTYPE r [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><urlset><loc>&xxe;</loc></urlset>`;
    assert.throws(() => extractLocs(xxe), (e) => e.exitCode === EXIT.BLOCKED_BY_POLICY);

    const lol = `<?xml version="1.0"?><!DOCTYPE lolz [<!ENTITY lol "lol"><!ENTITY lol2 "&lol;&lol;">]><urlset><loc>&lol2;</loc></urlset>`;
    assert.throws(() => extractLocs(lol), (e) => e.exitCode === EXIT.BLOCKED_BY_POLICY);
  });

  test('detects a sitemap index', () => {
    assert.equal(isSitemapIndex(index([`${ORIGIN}/s1.xml`])), true);
    assert.equal(isSitemapIndex(urlset([`${ORIGIN}/a`])), false);
  });
});

describe('walkSitemaps - bounds', () => {
  test('terminates on a cyclic index pair instead of hanging', async () => {
    const g = await guard();
    const map = {
      [`${ORIGIN}/a.xml`]: index([`${ORIGIN}/b.xml`]),
      [`${ORIGIN}/b.xml`]: index([`${ORIGIN}/a.xml`]),
    };
    const r = await walkSitemaps(g, [`${ORIGIN}/a.xml`], { fetchImpl: fetchFrom(map) });
    assert.ok(r.documents.length <= 2, 'visited set must stop the cycle');
    assert.equal(r.urls.length, 0);
  });

  test('stops at maxDepth and records the truncation', async () => {
    const g = await guard();
    const map = {};
    for (let i = 1; i <= 6; i += 1) {
      map[`${ORIGIN}/s${i}.xml`] = i < 6 ? index([`${ORIGIN}/s${i + 1}.xml`]) : urlset([`${ORIGIN}/deep`]);
    }
    const r = await walkSitemaps(g, [`${ORIGIN}/s1.xml`], { fetchImpl: fetchFrom(map) });
    assert.equal(r.truncated, true);
    assert.ok(r.documents.some((d) => d.status === 'truncated' && /maxDepth/.test(d.error)));
    assert.equal(r.urls.length, 0, 'the deep urlset must never be reached');
  });

  test('stops at maxDocuments', async () => {
    const g = await guard();
    const children = Array.from({ length: 200 }, (_, i) => `${ORIGIN}/c${i}.xml`);
    const map = { [`${ORIGIN}/root.xml`]: index(children) };
    for (const c of children) map[c] = urlset([`${c}#page`]);
    const r = await walkSitemaps(g, [`${ORIGIN}/root.xml`], { fetchImpl: fetchFrom(map) });
    assert.ok(r.documents.length <= SITEMAP_LIMITS.maxDocuments + 1);
    assert.equal(r.truncated, true);
  });

  test('rejects an oversized document', async () => {
    const g = await guard();
    const big = urlset([`${ORIGIN}/x`]) + ' '.repeat(SITEMAP_LIMITS.maxBytesPerDocument + 10);
    const r = await walkSitemaps(g, [`${ORIGIN}/big.xml`], {
      fetchImpl: fetchFrom({ [`${ORIGIN}/big.xml`]: big }),
    });
    assert.equal(r.documents[0].status, 'failed');
    assert.match(r.documents[0].error, /exceeds/);
  });

  test('rejects a sitemap served as text/html', async () => {
    const g = await guard();
    const r = await walkSitemaps(g, [`${ORIGIN}/s.xml`], {
      fetchImpl: fetchFrom({ [`${ORIGIN}/s.xml`]: urlset([`${ORIGIN}/a`]) }, { contentType: 'text/html' }),
    });
    assert.equal(r.documents[0].status, 'failed');
    assert.match(r.documents[0].error, /content-type/);
  });
});

describe('walkSitemaps - hostile entries', () => {
  test('drops internal-IP and service-name entries but keeps the good ones', async () => {
    const g = await guard();
    const hostile = urlset([
      `${ORIGIN}/good-1`,
      'http://169.254.169.254/latest/meta-data/',
      'http://127.0.0.1:6379/',
      'http://redis:6379/',
      'http://solr:8983/solr/',
      'http://host.docker.internal/',
      'http://[::1]/',
      'http://2130706433/',
      'file:///etc/passwd',
      `${ORIGIN}/good-2`,
    ]);
    const r = await walkSitemaps(g, [`${ORIGIN}/s.xml`], {
      fetchImpl: fetchFrom({ [`${ORIGIN}/s.xml`]: hostile }),
    });
    assert.deepEqual(r.urls, [`${ORIGIN}/good-1`, `${ORIGIN}/good-2`]);
    assert.equal(r.documents[0].rejected, 8, 'every hostile entry must be rejected');
  });

  test('records a guard-blocked entry point instead of failing silently', async () => {
    const g = await guard();
    const r = await walkSitemaps(g, ['http://169.254.169.254/sitemap.xml'], {
      fetchImpl: fetchFrom({}),
    });
    assert.equal(r.documents[0].status, 'guard-blocked');
    assert.equal(r.urls.length, 0);
  });

  test('records a 404 entry point rather than downgrading it to a warning', async () => {
    const g = await guard();
    const r = await walkSitemaps(g, [`${ORIGIN}/missing.xml`], { fetchImpl: fetchFrom({}) });
    assert.equal(r.documents[0].status, 'failed');
    assert.equal(r.documents[0].httpStatus, 404);
  });
});
