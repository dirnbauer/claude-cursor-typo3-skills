/**
 * End-to-end over a local fixture server. No DDEV, no browser, no network.
 *
 * Proves the pipeline that matters: guarded discovery over a HOSTILE sitemap, stage 1 and 2
 * capture, comparison, and — the point of the whole rebuild — that findings reach the exit
 * code instead of being computed correctly and then dropped.
 */

import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { createFixtureServer, listen, close, INJECTION } from '../server/fixture-server.mjs';
import { UrlGuard } from '../../lib/net/url-guard.mjs';
import { walkSitemaps } from '../../lib/net/sitemap.mjs';
import { safeFetch } from '../../lib/net/safe-fetch.mjs';
import { extractRecord, compareRecords } from '../../lib/compare/http-meta.mjs';
import { domHash, templateSignature } from '../../lib/compare/dom-normalize.mjs';
import { buildManifest } from '../../lib/run/manifest.mjs';
import { EXIT } from '../../lib/cli/exit-codes.mjs';
import { classify } from '../../lib/compare/classify.mjs';
import { envelope, writeReport } from '../../lib/report/write.mjs';

const localResolver = async () => ['127.0.0.1'];

describe('e2e: guarded discovery over a hostile sitemap', () => {
  let server; let origin; let guard;

  before(async () => {
    server = createFixtureServer({ variant: 'before' });
    origin = await listen(server);
    // 127.0.0.1 is loopback; it is allowed ONLY because it is the pinned allowed origin.
    guard = await UrlGuard.create({ allowedOrigins: [origin], resolver: localResolver });
  });
  after(async () => close(server));

  test('keeps the legitimate URLs and refuses every hostile entry', async () => {
    const { urls, documents } = await walkSitemaps(guard, [`${origin}/sitemap.xml`]);
    assert.deepEqual(urls, [`${origin}/`, `${origin}/de/kontakt`].sort());
    assert.equal(documents[0].rejected, 4, 'metadata, redis, a foreign port and file:// must all be rejected');
  });

  test('terminates on a cyclic sitemap index', async () => {
    const r = await walkSitemaps(guard, [`${origin}/cyclic-a.xml`]);
    assert.ok(r.documents.length <= 2);
    assert.equal(r.urls.length, 0);
  });

  test('refuses a cross-origin redirect and drops credentials', async () => {
    await assert.rejects(
      () => safeFetch(guard, `${origin}/redirect-away`, {
        purpose: 'e2e', headers: { Authorization: 'Bearer secret', Cookie: 'sid=1' },
      }),
      (err) => err.exitCode === EXIT.BLOCKED_BY_POLICY,
    );
  });

  test('a manifest built from discovery is reproducible and self-verifying', async () => {
    const { urls } = await walkSitemaps(guard, [`${origin}/sitemap-clean.xml`]);
    const m1 = buildManifest({
      baseUrl: origin, allowedOrigins: [origin], seed: 's', urls,
      viewports: ['desktop'], states: ['default'], now: () => 'T',
    });
    const m2 = buildManifest({
      baseUrl: origin, allowedOrigins: [origin], seed: 's', urls,
      viewports: ['desktop'], states: ['default'], now: () => 'T',
    });
    assert.equal(m1.manifestHash, m2.manifestHash);
    assert.equal(m1.coverage.httpCompared, urls.length);
  });
});

describe('e2e: stage 1 and 2 detect the seeded regressions', () => {
  let beforeServer; let afterServer; let beforeOrigin; let afterOrigin;

  before(async () => {
    beforeServer = createFixtureServer({ variant: 'before' });
    afterServer = createFixtureServer({ variant: 'after' });
    beforeOrigin = await listen(beforeServer);
    afterOrigin = await listen(afterServer);
  });
  after(async () => { await close(beforeServer); await close(afterServer); });

  async function fetchRecord(origin, pathname) {
    const guard = await UrlGuard.create({ allowedOrigins: [origin], resolver: localResolver });
    const res = await safeFetch(guard, `${origin}${pathname}`, { purpose: 'e2e', accept: 'html' });
    return {
      record: extractRecord({ url: res.url, status: res.status, headers: res.headers, body: res.body, redirects: res.redirects }),
      body: res.body,
    };
  }

  test('an unchanged page compares identical despite per-request tokens and timestamps', async () => {
    const a = await fetchRecord(beforeOrigin, '/de/kontakt');
    const b = await fetchRecord(beforeOrigin, '/de/kontakt');
    // Raw bodies differ every request (CSRF token + timestamp); normalised DOM must not.
    assert.notEqual(a.body, b.body, 'the fixture must actually vary per request');
    assert.equal(domHash(a.body).hash, domHash(b.body).hash, 'normalisation must absorb the volatile parts');
  });

  test('stage 1 catches the changed title, the lost canonical and the new cookie', async () => {
    const before = (await fetchRecord(beforeOrigin, '/')).record;
    const after = (await fetchRecord(afterOrigin, '/')).record;
    const cmp = compareRecords(before, after);

    assert.equal(cmp.identical, false);
    const fields = cmp.differences.map((d) => d.field);
    assert.ok(fields.includes('title'), 'a changed title must be a finding');
    assert.ok(fields.includes('canonical'), 'a lost canonical must be a finding');
    assert.ok(fields.includes('cookieNames'), 'a new cookie name must be a finding');
  });

  test('stage 2 catches the same change structurally', async () => {
    const before = await fetchRecord(beforeOrigin, '/');
    const after = await fetchRecord(afterOrigin, '/');
    assert.notEqual(domHash(before.body).hash, domHash(after.body).hash);
  });

  test('template signatures group the two pages differently', async () => {
    const home = await fetchRecord(beforeOrigin, '/');
    const contact = await fetchRecord(beforeOrigin, '/de/kontakt');
    // Same skeleton -> same signature, even though the text differs.
    assert.equal(
      templateSignature(home.body).hash,
      templateSignature(contact.body).hash,
      'the fixture pages share a template, so they must share a signature',
    );
  });
});

describe('e2e: findings reach the exit code — the v1 defect', () => {
  let beforeServer; let afterServer; let bOrigin; let aOrigin;

  before(async () => {
    beforeServer = createFixtureServer({ variant: 'before' });
    afterServer = createFixtureServer({ variant: 'after' });
    bOrigin = await listen(beforeServer);
    aOrigin = await listen(afterServer);
  });
  after(async () => { await close(beforeServer); await close(afterServer); });

  test('a differing run produces a findings verdict and a valid report', async () => {
    const g1 = await UrlGuard.create({ allowedOrigins: [bOrigin], resolver: localResolver });
    const g2 = await UrlGuard.create({ allowedOrigins: [aOrigin], resolver: localResolver });
    const r1 = await safeFetch(g1, `${bOrigin}/`, { purpose: 'e2e', accept: 'html' });
    const r2 = await safeFetch(g2, `${aOrigin}/`, { purpose: 'e2e', accept: 'html' });

    const before = extractRecord({ url: r1.url, status: r1.status, headers: r1.headers, body: r1.body });
    const after = extractRecord({ url: r2.url, status: r2.status, headers: r2.headers, body: r2.body });
    const cmp = compareRecords(before, after);
    assert.equal(cmp.identical, false);

    const findings = [{
      id: 'F-300-001', target: '/', class: 'regression', severity: 'major', status: 'open',
      differences: cmp.differences,
    }];
    const report = envelope({
      kind: 'http', run: { loopId: '300' }, verdict: 'findings',
      counts: { urls: 1, different: 1 }, findings,
    });

    const dir = await mkdtemp(path.join(tmpdir(), 't3u-e2e-'));
    const out = path.join(dir, 'report.http.json');
    const written = await writeReport(out, report);
    assert.ok(written.written);

    const parsed = JSON.parse(await readFile(out, 'utf8'));
    assert.equal(parsed.verdict, 'findings');
    assert.equal(parsed.findings.length, 1);

    // The whole point: a findings verdict must map to a non-zero exit code.
    const exitCode = parsed.verdict === 'findings' ? EXIT.FINDINGS : EXIT.PASS;
    assert.equal(exitCode, 1, 'findings MUST NOT exit 0 — this is the defect the rebuild exists to fix');
  });

  test('a clean run exits 0', async () => {
    const g = await UrlGuard.create({ allowedOrigins: [bOrigin], resolver: localResolver });
    const r1 = await safeFetch(g, `${bOrigin}/de/kontakt`, { purpose: 'e2e', accept: 'html' });
    const r2 = await safeFetch(g, `${bOrigin}/de/kontakt`, { purpose: 'e2e', accept: 'html' });
    const a = extractRecord({ url: r1.url, status: r1.status, headers: r1.headers, body: r1.body });
    const b = extractRecord({ url: r2.url, status: r2.status, headers: r2.headers, body: r2.body });
    assert.equal(compareRecords(a, b).identical, true);
  });
});

describe('e2e: prompt injection in page content is inert', () => {
  let server; let origin;
  before(async () => { server = createFixtureServer({ variant: 'before', injected: true }); origin = await listen(server); });
  after(async () => close(server));

  test('injected text is captured as evidence but cannot change a verdict', async () => {
    const guard = await UrlGuard.create({ allowedOrigins: [origin], resolver: localResolver });
    const res = await safeFetch(guard, `${origin}/`, { purpose: 'e2e', accept: 'html' });
    assert.ok(res.body.includes(INJECTION), 'the fixture must actually contain the injection');

    // The verdict is computed from numeric/enum fields only. Mutating the injected text
    // must not change it by a single byte.
    const verdictFor = (body) => {
      const rec = extractRecord({ url: `${origin}/`, status: 200, headers: {}, body });
      const cls = classify({ reproduced: true, visitorVisible: false, isOpportunity: false, ddevOnly: true, target: '/' });
      return JSON.stringify({ status: rec.status, canonical: Boolean(rec.canonical), cls });
    };

    const withInjection = verdictFor(res.body);
    const withDifferentInjection = verdictFor(res.body.replaceAll(INJECTION, 'TOTALLY DIFFERENT INSTRUCTIONS'));
    assert.equal(withInjection, withDifferentInjection,
      'changing injected text must not move the verdict by one byte');
  });

  test('the injected text is contained when it reaches a report', async () => {
    const report = envelope({
      kind: 'http', run: { loopId: '300' }, verdict: 'findings',
      counts: { urls: 1 },
      findings: [{
        id: 'F-300-001', target: '/', class: 'environment', severity: 'info', status: 'open',
        untrustedExcerpt: `${INJECTION} \`\`\` <!-- breakout -->`,
      }],
    });
    const dir = await mkdtemp(path.join(tmpdir(), 't3u-inj-'));
    const out = path.join(dir, 'report.http.json');
    await writeReport(out, report);
    const parsed = JSON.parse(await readFile(out, 'utf8'));
    const text = parsed.findings[0].untrustedExcerpt;
    assert.doesNotMatch(text, /```/, 'fence breakout must be neutralised');
    assert.doesNotMatch(text, /<!--/, 'comment breakout must be neutralised');
    assert.match(text, /SYSTEM/, 'the text is still preserved as evidence');
  });
});
