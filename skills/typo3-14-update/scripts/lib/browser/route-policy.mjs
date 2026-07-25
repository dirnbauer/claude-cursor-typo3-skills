/**
 * Request interception. One handler, two jobs:
 *
 *  - Determinism: a Google Font or an analytics beacon that answers slowly on one run and
 *    fast on the next is a difference nobody caused.
 *  - Exfiltration: the page under test is untrusted customer content, and it is trivially
 *    able to phone home. Blocking non-allow-listed origins closes both at once.
 *
 * Every blocked request is COUNTED and reported. Silent blocking would trade one invisible
 * problem for another.
 */

import { normalizeOrigin } from '../net/url-guard.mjs';

export function createRoutePolicy({ allowedOrigins = [], blockThirdParty = true } = {}) {
  const allowed = new Set(allowedOrigins.map(normalizeOrigin));
  const blocked = new Map();
  const permitted = new Map();

  const decide = (rawUrl) => {
    let origin;
    try { origin = normalizeOrigin(new URL(rawUrl).origin); }
    catch { return { allow: false, origin: '(unparseable)' }; }
    if (!blockThirdParty) return { allow: true, origin };
    return { allow: allowed.has(origin), origin };
  };

  return {
    decide,
    allowedOrigins: [...allowed],

    /** Attach to a Playwright BrowserContext. */
    async attach(context) {
      await context.route('**/*', async (route) => {
        const url = route.request().url();
        const { allow, origin } = decide(url);
        if (allow) {
          permitted.set(origin, (permitted.get(origin) ?? 0) + 1);
          return route.continue();
        }
        blocked.set(origin, (blocked.get(origin) ?? 0) + 1);
        return route.abort('blockedbyclient');
      });
    },

    report() {
      return {
        blockThirdParty,
        allowedOrigins: [...allowed],
        blockedOrigins: Object.fromEntries([...blocked.entries()].sort()),
        blockedRequests: [...blocked.values()].reduce((a, b) => a + b, 0),
        permittedRequests: [...permitted.values()].reduce((a, b) => a + b, 0),
      };
    },
  };
}

/**
 * Quiet-period detector.
 *
 * networkidle is explicitly NOT used: it is unreliable and, worse, it hides which requests
 * were in flight. Counting them ourselves means a page that never settles tells us what it
 * was waiting for.
 */
export function createQuietDetector(page, { quietMs = 500, hardCapMs = 15000 } = {}) {
  let inFlight = 0;
  const pending = new Set();
  const onRequest = (req) => { inFlight += 1; pending.add(req.url()); };
  const onDone = (req) => { inFlight = Math.max(0, inFlight - 1); pending.delete(req.url()); };

  page.on('request', onRequest);
  page.on('requestfinished', onDone);
  page.on('requestfailed', onDone);

  return {
    async wait() {
      const started = Date.now();
      let quietSince = null;
      while (Date.now() - started < hardCapMs) {
        if (inFlight === 0) {
          quietSince ??= Date.now();
          if (Date.now() - quietSince >= quietMs) break;
        } else {
          quietSince = null;
        }
        await new Promise((r) => setTimeout(r, 50));
      }
      const timedOut = Date.now() - started >= hardCapMs;
      return { timedOut, stillPending: timedOut ? [...pending].slice(0, 10) : [] };
    },
    dispose() {
      page.off('request', onRequest);
      page.off('requestfinished', onDone);
      page.off('requestfailed', onDone);
    },
  };
}

/**
 * Guard every navigation, including ones the page initiates itself. A redirect chain that
 * ends off-origin must abort the capture rather than quietly photograph a foreign site.
 */
export function attachNavigationGuard(page, guard, trustedOrigin, { onViolation } = {}) {
  const check = (url) => {
    try {
      guard.assertSameOrigin(url, trustedOrigin, { purpose: 'navigation' });
    } catch (err) {
      onViolation?.(err, url);
      throw err;
    }
  };
  page.on('framenavigated', (frame) => { if (frame === page.mainFrame()) check(frame.url()); });
  return { check };
}
