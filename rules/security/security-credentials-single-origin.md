---
id: security-credentials-single-origin
title: "Send credentials only to the expected origin, and re-check after every redirect"
category: security
severity: error
appliesTo: ["**/*.php", "**/*.mjs", "**/*.cjs", "**/*.js", "**/*.py", "**/*.sh", "**/*.yaml", "**/*.yml"]
typo3: ">=14.0"
php: ">=8.2"
trigger: "Use when a script or agent logs in, drives a browser, follows redirects, or reads secrets from the environment."
---
# Send credentials only to the expected origin, and re-check after every redirect

A base URL is an input. Before any credential is typed or sent, assert the target origin is the one
expected — and assert it **again** after every navigation and every redirect hop, because a 302 can
move the request to a host that was never approved.

**Do:** pin the trusted origin, drop `Authorization`/`Cookie` on any origin change, fail closed.
**Don't:** follow redirects with credentials attached, or trust that the host you started on is the host you ended on.

```js
const trusted = new URL(baseUrl).origin;              // pinned once
assertSameOrigin(page.url(), trusted);                 // before typing credentials
await page.fill('input[name="username"]', user);
await page.fill('input[type="password"]', pass);
await page.click('button[type="submit"]');
assertSameOrigin(page.url(), trusted);                 // again, after the POST settles
```

Secrets come from the process environment or an explicitly passed secret file outside the
repository with mode `0600`. Never auto-load `.env` from a shared tool or skill directory: it leaks
one project's credentials into every other project using that tool, and it invites committing them.

For automated checks, create a **dedicated, least-privilege, deletable** account rather than reusing
a production login.

> Why: credential exfiltration through a cross-origin redirect needs no exploit — only a script that
> follows redirects with headers attached. Re-asserting the origin after navigation is the check that
> catches it, and it costs one line.
