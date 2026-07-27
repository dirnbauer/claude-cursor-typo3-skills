# netresearch/typo3-ci-workflows Meta-Package

## What It Is

`netresearch/typo3-ci-workflows` is a Composer meta-package that bundles the full
set of dev-time tools used across all Netresearch TYPO3 extensions into one
`require-dev` entry. Instead of maintaining 10+ individual version constraints in
each extension's `composer.json`, one line brings everything in:

```bash
composer require --dev netresearch/typo3-ci-workflows
```

## What It Bundles (representative list)

| Package | Purpose |
|---|---|
| `phpunit/phpunit` (transitive via `typo3/testing-framework`) | PHPUnit test runner |
| `phpstan/phpstan` | Static analysis |
| `phpstan/phpstan-phpunit` | PHPUnit-specific rules |
| `phpstan/phpstan-strict-rules` | Strict rule set |
| `phpstan/phpstan-deprecation-rules` | Deprecation detection |
| `phpstan/extension-installer` | Auto-registers PHPStan extensions |
| `phpat/phpat` | Architecture testing |
| `saschaegerer/phpstan-typo3` | TYPO3-specific PHPStan extension |
| `infection/infection` | Mutation testing |
| `captainhook/captainhook` | Git hook automation |
| `friendsofphp/php-cs-fixer` | Code style |
| `rector/rector` | Automated refactoring |

Because `phpunit/phpunit` is transitive, **do not add a direct `phpunit/phpunit`
entry to `require-dev`** — it pins a phpunit version that may conflict with the
PHP version constraint of the extension (phpunit 12.5.8+ requires PHP >= 8.3, which
breaks the PHP-8.2 matrix cell).

## Adoption

Replace individual dev dependencies:

```json
// Before
"require-dev": {
    "phpunit/phpunit": "^11 || ^12",
    "phpstan/phpstan": "^2",
    "phpat/phpat": "^0.11",
    "infection/infection": "^0.29",
    "friendsofphp/php-cs-fixer": "^3"
}

// After
"require-dev": {
    "netresearch/typo3-ci-workflows": "^1"
}
```

## composer install --no-plugins Workaround

`captainhook/hook-installer` (bundled transitively) registers git hooks on every
`composer install`. In git worktree environments the `.git` directory is a file
(pointer), not a directory, which confuses the installer and emits warnings or
errors.

**Workaround for local development in a worktree:**

```bash
composer install --no-plugins
```

This skips all Composer plugins, including the hook installer. Git hooks are
managed by the bare repository's worktree setup instead.

Create a shell alias or Makefile target:

```makefile
composer-install-local:
	composer install --no-plugins
```

## Build/phpstan.no-plugins.neon Pattern

When running PHPStan locally **without** `phpstan/extension-installer` (e.g. after
`composer install --no-plugins`), the auto-registered extensions are absent and
PHPStan will error on unknown rules.

Create `Build/phpstan.no-plugins.neon` for this case:

```neon
# Build/phpstan.no-plugins.neon
# Use this file locally when extension-installer is inactive
# (e.g. after: composer install --no-plugins)
#
# Usage: phpstan analyse --configuration Build/phpstan.no-plugins.neon

includes:
    - phpstan.neon
    - vendor/phpstan/phpstan-phpunit/extension.neon
    - vendor/phpstan/phpstan-phpunit/rules.neon
    - vendor/phpstan/phpstan-strict-rules/rules.neon
    - vendor/phpstan/phpstan-deprecation-rules/rules.neon
    - vendor/saschaegerer/phpstan-typo3/extension.neon

parameters:
    # Override anything set by extension-installer in the main neon
```

**Do not add these `includes:` to the main `phpstan.neon`.** When extension-installer
is active (in CI and standard `composer install`), it already registers them, and
duplicate includes cause PHPStan to exit 1 with "These files are included multiple
times".

## Reusable CI Workflow Integration

Pair the meta-package with the reusable GitHub Actions workflow:

```yaml
# .github/workflows/ci.yml
jobs:
  ci:
    uses: netresearch/typo3-ci-workflows/.github/workflows/ci.yml@<SHA>
    with:
      php-versions: '["8.2", "8.3", "8.4"]'
      typo3-versions: '["13", "14"]'
      upload-coverage: true
    secrets:
      CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```

Pin to a full 40-character SHA. Checkpoints TT-22, TT-23, TT-24, and TT-41 are
all satisfied by this single workflow call.

## Functional tests are OPT-IN — `run-functional-tests` defaults to `false`

The reusable `netresearch/typo3-ci-workflows/.github/workflows/ci.yml` gates its
functional jobs (both the SQLite job and the DB-service job) on the boolean input
`run-functional-tests`, and **its default is `false`**. A caller that never sets
it has the **entire functional job SKIPPED on every event** — pull_request,
`merge_group`, and push alike. `Functional Tests` and `Functional Tests SQLite`
show up as `skipped`, not failing, so nothing looks wrong — meanwhile the whole
`Build/FunctionalTests.xml` (every `<testsuite>` in it) never runs in CI, and
functional/backend test rot accumulates silently for months.

Turn it on explicitly:

```yaml
    with:
      run-functional-tests: true
```

**Verify** it actually runs, don't assume: after enabling, open a `merge_group`
(or PR) run and confirm the functional cells show `success`, not `skipped`
(`gh run view <id> --json jobs --jq '.jobs[] | select(.name | test("Functional")) | {name, conclusion}'`).

**Trade-offs of enabling it:**

- Functional now runs on PRs too, expanding the matrix (≈ one cell per
  PHP × TYPO3 combination) — CI gets slower.
- If your functional suite makes real outbound calls (e.g. provider-connection
  smoke tests hitting an unreachable host and waiting for a timeout), those cells
  are *slow*; mock the transport or gate such tests behind a marker.
- Enabling a job that was skipped changes its required-status-check context. While
  skipped, the job reported a single **bare** context (`ci / Functional Tests SQLite`)
  that satisfied the required check. Enabling it makes GitHub expand that into N
  **matrix** contexts (`ci / Functional Tests SQLite (8.2, ^13.4)` … `(8.5, ^14.3)`),
  so the bare required context no longer reports and PRs sit permanently `BLOCKED`
  with every visible check green. Fix: update the branch ruleset's
  `required_status_checks` (via `gh api -X PUT repos/O/R/rulesets/<id>`, or
  `gh api -X PATCH repos/O/R/branches/main/protection/required_status_checks` for
  classic branch protection) to
  replace the bare context with the matrix-expanded ones — mirror how Unit/PHPStan
  are already listed. This is also what makes the newly-enabled job actually *gate*
  merges.

## Adding a MariaDB functional leg (and its two silent traps)

The reusable `ci.yml`'s functional job runs on **one** DBMS per call, chosen by
`functional-test-db` (default `sqlite`); its two functional jobs are mutually
exclusive per call (`== sqlite` vs `!= sqlite`). To keep an extension's
MySQL-only code paths (e.g. `MATCH … AGAINST` fulltext, strict-mode inserts —
see `functional-testing.md`) exercised in CI, add a **second, narrow call** of
the reusable workflow rather than trying to run both engines in one:

```yaml
  ci-functional-mariadb:
    uses: netresearch/typo3-ci-workflows/.github/workflows/ci.yml@<SHA>  # pin to a commit SHA
    with:
      php-versions: '["8.4"]'
      typo3-versions: '["^14.3"]'
      run-functional-tests: true
      functional-test-db: mariadb
      db-image: 'mariadb:10.11'
```

Two traps that make the leg silently *not* test MariaDB, or fail to start:

- **`db-image` defaults to `mysql:9.6`.** Setting `functional-test-db: mariadb`
  alone does **not** run against MariaDB — the DB service image is a separate
  input. Without `db-image: 'mariadb:...'` the "MariaDB leg" runs on MySQL. Set
  both.
- **MariaDB images ≥ 11 break the reusable workflow's health check.** The job
  health-checks the DB service with a hardcoded `mysqladmin ping`. MariaDB
  dropped the `mysql*` compatibility symlinks at 11.0 and ships only
  `mariadb-admin`, so `mariadb:11.x` never turns healthy → "Failed to initialize
  container". Pin **`mariadb:10.11`** (LTS, still carries the `mysql*` symlinks)
  until the reusable workflow's health check covers both binaries.

Also expect the enabled leg to surface **pre-existing** MySQL-strict-mode bugs
in an e2e-backend suite that has only ever run on SQLite — file those separately
and, if needed, scope the leg to `--testsuite functional` (via
`functional-test-command`) until they're fixed, then drop the scoping.
