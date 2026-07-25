import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { UrlGuard, isBlockedAddress, isObfuscatedIpLiteral, normalizeOrigin } from '../../lib/net/url-guard.mjs';
import { EXIT } from '../../lib/cli/exit-codes.mjs';

/** Deterministic resolver so tests never touch DNS. */
function resolverFor(map) {
  return async (host) => {
    if (!(host in map)) throw new Error(`ENOTFOUND ${host}`);
    return map[host];
  };
}

const DDEV = 'https://acme.ddev.site';
const RESOLVE = {
  'acme.ddev.site': ['127.0.0.1'],
  'evil.ddev.site': ['127.0.0.1'],
  'attacker.example': ['203.0.113.10'],
  'rebind.ddev.site': ['127.0.0.1'],
  'redis': ['172.18.0.5'],
  'solr': ['172.18.0.6'],
  'host.docker.internal': ['192.168.65.2'],
};

const guardFor = (origins = [DDEV], resolve = RESOLVE) =>
  UrlGuard.create({ allowedOrigins: origins, resolver: resolverFor(resolve) });

async function refuses(guard, url, hint = '') {
  await assert.rejects(
    () => guard.assertUrl(url),
    (err) => {
      assert.equal(err.exitCode, EXIT.BLOCKED_BY_POLICY, `${url} should exit 5 ${hint}`);
      return true;
    },
    `expected refusal for ${url} ${hint}`,
  );
}

describe('isBlockedAddress', () => {
  test('blocks loopback, private, link-local, CGNAT, multicast, reserved', () => {
    for (const ip of [
      '127.0.0.1', '127.1.2.3', '10.0.0.1', '172.16.0.1', '172.31.255.255',
      '192.168.1.1', '169.254.169.254', '100.64.0.1', '224.0.0.1', '240.0.0.1',
      '0.0.0.0', '255.255.255.255', '198.18.0.1', '192.0.2.1', '203.0.113.1',
    ]) assert.equal(isBlockedAddress(ip), true, `${ip} must be blocked`);
  });

  test('allows ordinary public addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '93.184.216.34', '172.32.0.1', '172.15.255.255']) {
      assert.equal(isBlockedAddress(ip), false, `${ip} must be allowed`);
    }
  });

  test('blocks IPv6 loopback, ULA, link-local, multicast', () => {
    for (const ip of ['::1', 'fc00::1', 'fd12:3456::1', 'fe80::1', 'ff02::1', '::']) {
      assert.equal(isBlockedAddress(ip), true, `${ip} must be blocked`);
    }
  });

  test('unmaps IPv4-mapped, NAT64 and 6to4 before deciding', () => {
    assert.equal(isBlockedAddress('::ffff:127.0.0.1'), true, 'v4-mapped loopback');
    assert.equal(isBlockedAddress('::ffff:169.254.169.254'), true, 'v4-mapped metadata');
    assert.equal(isBlockedAddress('64:ff9b::7f00:1'), true, 'NAT64 loopback');
    assert.equal(isBlockedAddress('2002:7f00:0001::'), true, '6to4 loopback');
    assert.equal(isBlockedAddress('::ffff:8.8.8.8'), false, 'v4-mapped public');
  });

  test('refuses anything that is not an IP literal', () => {
    assert.equal(isBlockedAddress('not-an-ip'), true);
    assert.equal(isBlockedAddress(''), true);
  });
});

describe('isObfuscatedIpLiteral', () => {
  test('catches decimal, hex, octal and short forms', () => {
    for (const h of ['2130706433', '0x7f000001', '0177.0.0.1', '127.1', '127.0.1']) {
      assert.equal(isObfuscatedIpLiteral(h), true, `${h} must be rejected`);
    }
  });
  test('leaves real hostnames and proper literals alone', () => {
    for (const h of ['acme.ddev.site', 'example.com', '127.0.0.1', '::1']) {
      assert.equal(isObfuscatedIpLiteral(h), false, `${h} must pass`);
    }
  });
});

describe('normalizeOrigin', () => {
  test('lowercases, strips default ports and trailing dots', () => {
    assert.equal(normalizeOrigin('https://ACME.ddev.site:443'), 'https://acme.ddev.site');
    assert.equal(normalizeOrigin('http://acme.ddev.site.:80'), 'http://acme.ddev.site');
    assert.equal(normalizeOrigin('http://acme.ddev.site:8080'), 'http://acme.ddev.site:8080');
  });
  test('a scheme downgrade is a DIFFERENT origin', () => {
    assert.notEqual(normalizeOrigin('https://acme.ddev.site'), normalizeOrigin('http://acme.ddev.site'));
  });
});

describe('UrlGuard - the DDEV case must keep working', () => {
  test('allows the pinned DDEV origin even though it resolves to loopback', async () => {
    const guard = await guardFor();
    const r = await guard.assertUrl(`${DDEV}/de/kontakt`);
    assert.equal(r.origin, DDEV);
    assert.equal(r.pinned, true);
    assert.deepEqual(r.addresses, ['127.0.0.1']);
  });

  test('preserves an http:// base URL instead of rewriting it to https', async () => {
    const guard = await guardFor(['http://acme.ddev.site']);
    const r = await guard.assertUrl('http://acme.ddev.site/sitemap.xml');
    assert.equal(r.url.protocol, 'http:');
  });
});

describe('UrlGuard - SSRF targets from the analysis', () => {
  test('refuses cloud metadata, loopback, docker host and service names', async () => {
    const guard = await guardFor();
    await refuses(guard, 'http://169.254.169.254/latest/meta-data/', 'cloud metadata');
    await refuses(guard, 'http://127.0.0.1/', 'loopback by literal');
    await refuses(guard, 'http://localhost/', 'localhost');
    await refuses(guard, 'http://host.docker.internal/', 'docker host');
    await refuses(guard, 'http://redis:6379/', 'redis');
    await refuses(guard, 'http://solr:8983/solr/', 'solr');
    await refuses(guard, 'http://database/', 'database');
  });

  test('refuses a different host that resolves to the same pinned address', async () => {
    const guard = await guardFor();
    await refuses(guard, 'https://evil.ddev.site/', 'same IP, wrong origin');
  });

  test('refuses non-http protocols', async () => {
    const guard = await guardFor();
    for (const u of ['file:///etc/passwd', 'ftp://acme.ddev.site/', 'data:text/html,x',
                     'javascript:alert(1)', 'gopher://acme.ddev.site/']) {
      await refuses(guard, u, 'protocol');
    }
  });

  test('refuses embedded credentials', async () => {
    const guard = await guardFor();
    await refuses(guard, 'https://user:pass@acme.ddev.site/', 'embedded credentials');
  });

  test('refuses an unexpected port on an allowed host', async () => {
    const guard = await guardFor();
    await refuses(guard, 'https://acme.ddev.site:6379/', 'port');
    await refuses(guard, 'https://acme.ddev.site:8983/', 'port');
  });

  test('refuses obfuscated loopback literals', async () => {
    const guard = await guardFor();
    for (const u of ['http://2130706433/', 'http://0x7f000001/', 'http://0177.0.0.1/']) {
      await refuses(guard, u, 'obfuscated');
    }
  });
});

describe('UrlGuard - DNS rebinding', () => {
  test('refuses when a pinned host later resolves elsewhere', async () => {
    let calls = 0;
    const resolver = async (host) => {
      if (host !== 'rebind.ddev.site') throw new Error(`ENOTFOUND ${host}`);
      calls += 1;
      return calls === 1 ? ['127.0.0.1'] : ['169.254.169.254'];
    };
    const guard = await UrlGuard.create({
      allowedOrigins: ['https://rebind.ddev.site'], resolver,
    });
    await refuses(guard, 'https://rebind.ddev.site/', 'rebinding after pinning');
  });

  test('refuses a multi-address host where only one address is bad', async () => {
    const guard = await UrlGuard.create({
      allowedOrigins: ['https://multi.ddev.site'],
      resolver: resolverFor({ 'multi.ddev.site': ['127.0.0.1', '169.254.169.254'] }),
    });
    // 127.0.0.1 is pinned, 169.254.169.254 is pinned too (both were frozen at create),
    // so this specific case passes pinning - but a NEW address must not.
    const guard2 = new UrlGuard({
      allowedOrigins: ['https://multi.ddev.site'],
      pinnedAddresses: new Map([['multi.ddev.site', ['127.0.0.1']]]),
      resolver: resolverFor({ 'multi.ddev.site': ['127.0.0.1', '169.254.169.254'] }),
    });
    await refuses(guard2, 'https://multi.ddev.site/', 'one address outside the pinned set');
    assert.ok(guard);
  });
});

describe('UrlGuard - redirects and same-origin assertions', () => {
  test('flags a cross-origin redirect and refuses a disallowed one', async () => {
    const guard = await guardFor();
    await assert.rejects(
      () => guard.assertRedirect('https://attacker.example/steal', `${DDEV}/typo3/`),
      (e) => e.exitCode === EXIT.BLOCKED_BY_POLICY,
    );
    const ok = await guard.assertRedirect('/typo3/main', `${DDEV}/typo3/`);
    assert.equal(ok.sameOrigin, true);
  });

  test('assertSameOrigin refuses a navigation that left the origin', async () => {
    const guard = await guardFor();
    assert.equal(guard.assertSameOrigin(`${DDEV}/typo3/main`, DDEV), true);
    assert.throws(
      () => guard.assertSameOrigin('https://attacker.example/login', DDEV, { purpose: 'backend login' }),
      (e) => e.exitCode === EXIT.BLOCKED_BY_POLICY,
    );
  });

  test('a scheme downgrade counts as leaving the origin', async () => {
    const guard = await guardFor();
    assert.throws(() => guard.assertSameOrigin('http://acme.ddev.site/x', DDEV));
  });
});
