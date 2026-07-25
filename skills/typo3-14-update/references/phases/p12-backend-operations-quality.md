# P12 — Backend, operations and quality gates (loops 310, 320)

Track `invariance`.

## Loop 310 — backend and operations
- **Backend module sweep**: every module opens without exception output, server errors or severe
  console errors. **100% coverage is required** — module *groups* are distinguished from real
  modules, and an unexpected skip fails the run. A sweep that reports "12 ok, 3 skipped" and exits 0
  is how unchecked modules ship.
- Scheduler: run due tasks, confirm success, verify any mail in Mailpit.
- Redirects: `EXT:redirects` entries resolve without loops or dead targets.
- Linkvalidator where installed; triage broken links.
- Review `sys_log` and the deprecation log for entries raised since the update.
- Smoke test: homepage, a standard content page, news or detail pages, search including empty and
  paginated results, login and password recovery, forms, the 404 response, `robots.txt`, every
  sitemap entry point. DDEV routes all mail to Mailpit (`ddev launch -m`), so no real recipient is
  ever contacted.

The smoke test is a **deterministic read-only flow**, not random link clicking. Even GET links can
trigger logout, cache clearing, deletion, unsubscribe, scheduler actions or large downloads.

## Loop 320 — static analysis and tests
- PHPStan level 9+ (10 for `packages/`); never lower an existing stricter level. No new suppressions
  or baseline entries for new or touched code; the baseline must shrink.
- PHP lint, code style, Rector dry-run, Fractor dry-run, unit, functional/integration and E2E tests
  through the repository's canonical commands inside DDEV.
- Conformance, simplification, `typo3-security` and `security-audit` passes. Fix verified actionable
  findings, then rerun the affected gate.
- `ddev composer audit` — unresolved advisories block completion.
- Prove a clean install: a fresh `ddev composer install` from the committed lockfile resolves against
  14.3 and the claimed PHP versions.
- Verify the PHP target across the whole extension set: `why-not php 8.4` empty, every local or
  forked package declares the target, PHPStan runs with `phpVersion` set to it, and lint plus all
  suites execute in the target container with a clean deprecation log.
- Reusable extensions keep a CI matrix with a 14.3 job and every claimed PHP version.

## Exit
Every sweep item green · 0 unresolved advisories · deprecation log clean · PHPStan baseline strictly
smaller than before the update.

