# CI/CD Integration for TYPO3 Testing

Continuous Integration and Continuous Deployment workflows for automated TYPO3 extension testing.

## GitHub Actions

### Basic Workflow

Create `.github/workflows/tests.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  lint:
    name: Lint PHP
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.4'

      - name: Install dependencies
        run: composer install --no-progress

      - name: Run linting
        run: composer ci:test:php:lint

  phpstan:
    name: PHPStan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.4'

      - name: Install dependencies
        run: composer install --no-progress

      - name: Run PHPStan
        run: composer ci:test:php:phpstan

  unit:
    name: Unit Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        php: ['8.1', '8.2', '8.3', '8.4']

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP ${{ matrix.php }}
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          coverage: xdebug

      - name: Install dependencies
        run: composer install --no-progress

      - name: Run unit tests
        run: composer ci:test:php:unit

      - name: Upload coverage
        # Upload coverage for all PHP versions
        uses: codecov/codecov-action@v3

  functional:
    name: Functional Tests
    runs-on: ubuntu-latest
    strategy:
      matrix:
        php: ['8.1', '8.2', '8.3', '8.4']
        database: ['mysqli', 'pdo_mysql', 'postgres', 'sqlite']

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: typo3_test
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=3

      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: typo3_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP ${{ matrix.php }}
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          extensions: ${{ matrix.database == 'postgres' && 'pdo_pgsql' || 'mysqli' }}

      - name: Install dependencies
        run: composer install --no-progress

      - name: Run functional tests
        run: |
          export typo3DatabaseDriver=${{ matrix.database }}
          export typo3DatabaseHost=127.0.0.1
          export typo3DatabaseName=typo3_test
          export typo3DatabaseUsername=${{ matrix.database == 'postgres' && 'postgres' || 'root' }}
          export typo3DatabasePassword=${{ matrix.database == 'postgres' && 'postgres' || 'root' }}
          composer ci:test:php:functional
```

### Matrix Strategy

Test multiple PHP and TYPO3 versions:

```yaml
strategy:
  fail-fast: false
  matrix:
    php: ['8.1', '8.2', '8.3', '8.4']
    typo3: ['12.4', '13.0']
    exclude:
      - php: '8.1'
        typo3: '13.0'  # TYPO3 v13 requires PHP 8.2+

steps:
  - name: Install TYPO3 v${{ matrix.typo3 }}
    run: |
      composer require "typo3/cms-core:^${{ matrix.typo3 }}" --no-update
      composer update --no-progress
```

### Caching Dependencies

```yaml
- name: Cache Composer dependencies
  uses: actions/cache@v3
  with:
    path: ~/.composer/cache
    key: composer-${{ runner.os }}-${{ matrix.php }}-${{ hashFiles('composer.lock') }}
    restore-keys: |
      composer-${{ runner.os }}-${{ matrix.php }}-
      composer-${{ runner.os }}-

- name: Install dependencies
  run: composer install --no-progress --prefer-dist
```

### Code Coverage

```yaml
- name: Run tests with coverage
  run: vendor/bin/phpunit -c Build/phpunit/UnitTests.xml --coverage-clover coverage.xml

- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage.xml
    flags: unittests
    name: codecov-umbrella
```

### Xdebug vs PCOV for Coverage

**Xdebug is recommended for CI/CD.** PCOV is faster but gives up enough diagnostic fidelity and local/CI parity that the tradeoff rarely pays off in practice.

| Aspect | Xdebug | PCOV |
|--------|--------|------|
| **Local/CI parity** | ✅ Local coverage runs typically set `XDEBUG_MODE=coverage`; keeping CI on xdebug means local and CI behave identically | ❌ Mismatches local; leaks `beStrictAboutCoverageMetadata`-style drift |
| **Branch coverage** | ✅ Branch + path coverage | ❌ Line-only |
| **Purpose** | Debugger + Profiler + Coverage | Coverage only |
| **Speed** | Slower (debugger overhead) | 2-5× faster |
| **Memory** | Higher (full debugger loaded) | Lower footprint |

**Why Xdebug is the better default:**
- **Strict coverage metadata**: PHPUnit's `beStrictAboutCoverageMetadata="true"` marks tests as "risky" when they execute code outside their declared `#[CoversClass]` / `#[UsesClass]` attributes. The check only runs under active coverage. Mixing local Xdebug with CI PCOV produced "green locally, red in CI" surprises — switching both to Xdebug eliminates that drift. Observed concretely in [t3x-nr-image-optimize#93](https://github.com/netresearch/t3x-nr-image-optimize/pull/93).
- **Branch + path coverage**: Xdebug sees `if/else` branches and early returns. PCOV reports only which lines executed, losing the "did we actually test the else-branch?" signal. Matters for Codecov trend reports and mutation testing preparation.
- **Cost**: ~2-3 min extra CI runtime across a typical 8-job matrix. Acceptable for the diagnostic gain.

**When PCOV is still the right call:**
- CI matrix has so many jobs (e.g. 20+ combinations) that the 2-5× coverage speed-up genuinely matters.
- Coverage runs are gated (only on the default branch, not every PR).
- You're comfortable maintaining `[CoversClass]` / `[UsesClass]` declarations that pass locally and in CI — see the "Strict coverage metadata" note below.

**Via `netresearch/typo3-ci-workflows`:**

As of [netresearch/typo3-ci-workflows#72](https://github.com/netresearch/typo3-ci-workflows/pull/72), the default `coverage-tool` is `xdebug`. Consumers can still override explicitly:

```yaml
jobs:
  ci:
    uses: netresearch/typo3-ci-workflows/.github/workflows/ci.yml@main
    with:
      upload-coverage: true
      # coverage-tool defaults to xdebug (recommended)
      # coverage-tool: 'pcov'  # opt in to pcov for faster runs
```

**Standalone GitHub Actions setup:**
```yaml
- name: Setup PHP with Xdebug (recommended)
  uses: shivammathur/setup-php@v2
  with:
    php-version: ${{ matrix.php }}
    coverage: xdebug

# Or opt into PCOV when CI runtime matters more than coverage fidelity:
- name: Setup PHP with PCOV
  uses: shivammathur/setup-php@v2
  with:
    php-version: ${{ matrix.php }}
    coverage: pcov
```

**Local execution via `Build/Scripts/runTests.sh`:**

The canonical TYPO3 core-testing pattern runs the suite inside the
`ghcr.io/typo3/core-testing-*` Docker images, which already have
xdebug available. Pass `XDEBUG_MODE=coverage` into the container so
PHPUnit picks xdebug (not pcov, when both are installed):

```bash
# Recommended: xdebug coverage via runTests.sh
XDEBUG_MODE=coverage Build/Scripts/runTests.sh -s unit -- \
    --coverage-clover=coverage.xml

# Functional suite with coverage
XDEBUG_MODE=coverage Build/Scripts/runTests.sh -s functional -- \
    --coverage-clover=coverage-functional.xml
```

**Direct PHPUnit (when runTests.sh is not in use):**

```bash
# xdebug (matches CI default)
php -d xdebug.mode=coverage vendor/bin/phpunit \
    --coverage-clover coverage.xml

# pcov (opt-in, speed over fidelity)
php -d pcov.enabled=1 -d xdebug.mode=off vendor/bin/phpunit \
    --coverage-clover coverage.xml
```

#### Strict coverage metadata

If `Build/UnitTests.xml` / `Build/FunctionalTests.xml` sets `beStrictAboutCoverageMetadata="true"` together with `failOnRisky="true"`, every test must declare every class it executes via `#[CoversClass]` or `#[UsesClass]` — otherwise the coverage-driven check flags the test as risky and fails the run.

- Unit tests: strict metadata is natural — a unit test touches exactly one class.
- Functional / integration tests: expect to declare the full transitive dependency chain via `#[UsesClass]`. Example:

```php
#[CoversClass(ProcessingMiddleware::class)]
#[UsesClass(Processor::class)]
#[UsesClass(ImageManagerAdapter::class)]
#[UsesClass(ImageManagerFactory::class)]
#[UsesClass(VariantServedEvent::class)]
final class ProcessingMiddlewareTest extends FunctionalTestCase
```

If maintaining those lists across DI refactorings costs too much, relax to `beStrictAboutCoverageMetadata="false"` *on functional tests only* — keep unit tests strict.

> **Note:** PHPUnit auto-detects available coverage drivers. If both are
> present (some Docker images install both), PHPUnit prefers PCOV — set
> `XDEBUG_MODE=coverage` or pass `-d pcov.enabled=0` to force Xdebug.

## E2E Testing in CI

> **IMPORTANT: Do NOT use DDEV in CI!**
>
> DDEV is for local development only. Use GitHub Services + PHP built-in server for E2E tests in CI.

### Why NOT DDEV in CI?

| Issue | Impact |
|-------|--------|
| **Slow startup** | 2-3+ minutes for Docker orchestration |
| **Complexity** | Docker-in-Docker, networking, volumes |
| **Resource heavy** | Multiple containers exceed runner limits |
| **Fragile** | Port conflicts, DNS issues, cert problems |
| **Non-standard** | TYPO3 Core uses direct PHP, not DDEV |

### Correct E2E CI Pattern: GitHub Services

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    # GitHub Services - database container
    services:
      db:
        image: mariadb:11.4
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: typo3
          MYSQL_CHARSET: utf8mb4
          MYSQL_COLLATION: utf8mb4_unicode_ci
        ports:
          - 3306:3306
        options: >-
          --health-cmd="healthcheck.sh --connect --innodb_initialized"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5

    steps:
      - uses: actions/checkout@v4

      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '8.4'
          extensions: mysqli, pdo_mysql, gd, intl

      - name: Install Composer dependencies
        run: composer install --prefer-dist --no-progress

      - name: Setup TYPO3
        run: |
          mkdir -p .Build/Web/typo3conf
          cat > .Build/Web/typo3conf/LocalConfiguration.php << 'EOF'
          <?php
          return [
              'DB' => ['Connections' => ['Default' => [
                  'driver' => 'mysqli',
                  'host' => '127.0.0.1',
                  'dbname' => 'typo3',
                  'user' => 'root',
                  'password' => 'root',
              ]]],
              'SYS' => [
                  'encryptionKey' => '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef',
                  'trustedHostsPattern' => 'localhost|127\\.0\\.0\\.1',
              ],
          ];
          EOF

          # Wait for database
          for i in {1..30}; do
            mysqladmin ping -h127.0.0.1 -uroot -proot --silent 2>/dev/null && break
            sleep 2
          done

          .Build/bin/typo3 extension:setup --no-interaction
          .Build/bin/typo3 backend:user:create --username=admin --password='Joh316!!' --admin --no-interaction
          .Build/bin/typo3 cache:flush

      - uses: actions/setup-node@v4
        with:
          node-version: '20'  # Use LTS

      - name: Install Playwright
        run: |
          npm ci
          npx playwright install --with-deps chromium

      # PHP built-in server (NOT DDEV)
      - name: Start PHP server
        run: |
          php -S 0.0.0.0:8080 -t .Build/Web > /tmp/php-server.log 2>&1 &
          for i in $(seq 1 30); do
            curl -sf http://localhost:8080/typo3/ > /dev/null 2>&1 && break
            sleep 1
          done

      - name: Run Playwright tests
        env:
          TYPO3_BASE_URL: http://localhost:8080
        run: npm run test:e2e

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: Tests/E2E/Playwright/reports/
```

### Dual-Mode Playwright Configuration

Support both local (DDEV) and CI (localhost) environments:

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    // DDEV for local, CI sets TYPO3_BASE_URL=http://localhost:8080
    baseURL: process.env.TYPO3_BASE_URL || 'https://my-extension.ddev.site',
    ignoreHTTPSErrors: true, // For DDEV self-signed certs
  },
});
```

### runTests.sh Integration

The `runTests.sh` script should support both modes:

```bash
run_playwright_tests() {
    local typo3_base_url="${TYPO3_BASE_URL:-https://my-extension.ddev.site}"

    # Check if TYPO3 is accessible (use -k for https/DDEV)
    local curl_opts="-s"
    [[ "${typo3_base_url}" == https://* ]] && curl_opts="-sk"

    if ! curl ${curl_opts} "${typo3_base_url}/typo3/" > /dev/null 2>&1; then
        if [[ "${PLAYWRIGHT_FORCE:-0}" != "1" ]]; then
            echo "Error: TYPO3 not responding at ${typo3_base_url}"
            echo "Set PLAYWRIGHT_FORCE=1 to override."
            exit 1
        fi
    fi

    export TYPO3_BASE_URL="${typo3_base_url}"
    npm run test:e2e
}
```

## GitLab CI

### Basic Pipeline

Create `.gitlab-ci.yml`:

```yaml
variables:
  COMPOSER_CACHE_DIR: ".composer-cache"
  MYSQL_ROOT_PASSWORD: "root"
  MYSQL_DATABASE: "typo3_test"

cache:
  key: "$CI_COMMIT_REF_SLUG"
  paths:
    - .composer-cache/

stages:
  - lint
  - analyze
  - test

.php:
  image: php:${PHP_VERSION}-cli
  before_script:
    - apt-get update && apt-get install -y git zip unzip
    - curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    - composer install --no-progress

lint:
  extends: .php
  stage: lint
  variables:
    PHP_VERSION: "8.2"
  script:
    - composer ci:test:php:lint

phpstan:
  extends: .php
  stage: analyze
  variables:
    PHP_VERSION: "8.2"
  script:
    - composer ci:test:php:phpstan

cgl:
  extends: .php
  stage: analyze
  variables:
    PHP_VERSION: "8.2"
  script:
    - composer ci:test:php:cgl

unit:8.1:
  extends: .php
  stage: test
  variables:
    PHP_VERSION: "8.1"
  script:
    - composer ci:test:php:unit

unit:8.2:
  extends: .php
  stage: test
  variables:
    PHP_VERSION: "8.2"
  script:
    - composer ci:test:php:unit
  coverage: '/^\s*Lines:\s*\d+.\d+\%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml

functional:8.2:
  extends: .php
  stage: test
  variables:
    PHP_VERSION: "8.2"
    typo3DatabaseDriver: "mysqli"
    typo3DatabaseHost: "mysql"
    typo3DatabaseName: "typo3_test"
    typo3DatabaseUsername: "root"
    typo3DatabasePassword: "root"
  services:
    - mysql:8.0
  script:
    - composer ci:test:php:functional
```

### Multi-Database Testing

```yaml
.functional:
  extends: .php
  stage: test
  variables:
    PHP_VERSION: "8.2"
  script:
    - composer ci:test:php:functional

functional:mysql:
  extends: .functional
  variables:
    typo3DatabaseDriver: "mysqli"
    typo3DatabaseHost: "mysql"
    typo3DatabaseName: "typo3_test"
    typo3DatabaseUsername: "root"
    typo3DatabasePassword: "root"
  services:
    - mysql:8.0

functional:postgres:
  extends: .functional
  variables:
    typo3DatabaseDriver: "pdo_pgsql"
    typo3DatabaseHost: "postgres"
    typo3DatabaseName: "typo3_test"
    typo3DatabaseUsername: "postgres"
    typo3DatabasePassword: "postgres"
  services:
    - postgres:15
  before_script:
    - apt-get update && apt-get install -y libpq-dev
    - docker-php-ext-install pdo_pgsql

functional:sqlite:
  extends: .functional
  variables:
    typo3DatabaseDriver: "pdo_sqlite"
```

## Best Practices

### 1. Fast Feedback Loop

Order jobs by execution time (fastest first):

```yaml
stages:
  - lint        # ~30 seconds
  - analyze     # ~1-2 minutes (PHPStan, CGL)
  - unit        # ~2-5 minutes
  - functional  # ~5-15 minutes
  - acceptance  # ~15-30 minutes
```

### 2. Fail Fast

```yaml
strategy:
  fail-fast: true  # Stop on first failure
  matrix:
    php: ['8.1', '8.2', '8.3', '8.4']
```

### 3. Parallel Execution

```yaml
# GitHub Actions - parallel jobs
jobs:
  lint: ...
  phpstan: ...
  unit: ...
  # All run in parallel

# GitLab CI - parallel jobs
test:
  parallel:
    matrix:
      - PHP_VERSION: ['8.1', '8.2', '8.3']
```

### 4. Cache Dependencies

GitHub Actions:
```yaml
- uses: actions/cache@v3
  with:
    path: ~/.composer/cache
    key: ${{ runner.os }}-composer-${{ hashFiles('**/composer.lock') }}
```

GitLab CI:
```yaml
cache:
  key: ${CI_COMMIT_REF_SLUG}
  paths:
    - .composer-cache/
```

### 5. Matrix Testing

Test critical combinations:

```yaml
strategy:
  matrix:
    include:
      # Minimum supported versions
      - php: '8.1'
        typo3: '12.4'

      # Current stable
      - php: '8.2'
        typo3: '12.4'

      # Latest versions
      - php: '8.3'
        typo3: '13.0'
```

### 6. Artifacts and Reports

```yaml
- name: Archive test results
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: test-results
    path: |
      var/log/
      typo3temp/var/tests/
```

### 7. Notifications

GitHub Actions:
```yaml
- name: Slack Notification
  if: failure()
  uses: rtCamp/action-slack-notify@v2
  env:
    SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
```

## Quality Gates

### Required Checks

Define which checks must pass:

GitHub:
```yaml
# .github/branch-protection.json
{
  "required_status_checks": {
    "strict": true,
    "contexts": [
      "lint",
      "phpstan",
      "unit (8.2)",
      "functional (8.2, mysqli)"
    ]
  }
}
```

GitLab:
```yaml
# .gitlab-ci.yml
unit:8.2:
  only:
    - merge_requests
  allow_failure: false  # Required check
```

### Coverage Driver Issues

When PHPUnit config files include `<coverage>` sections, tests will fail if no coverage driver (xdebug/pcov) is available. Add `--no-coverage` flag when coverage is disabled:

```yaml
- name: Run unit tests
  run: |
    if [ "$COVERAGE_ENABLED" = "true" ]; then
      vendor/bin/phpunit -c Build/phpunit/UnitTests.xml
    else
      vendor/bin/phpunit -c Build/phpunit/UnitTests.xml --no-coverage
    fi
```

**Common error**: `PHPUnit\Framework\InvalidArgumentException: No code coverage driver available`

**Solution**: Either install a coverage driver (xdebug, pcov) or pass `--no-coverage`:

```bash
# Install pcov for faster coverage
pecl install pcov

# Or disable coverage in CI
vendor/bin/phpunit --no-coverage
```

### Coverage Requirements

```yaml
- name: Check code coverage
  run: |
    coverage=$(vendor/bin/phpunit --coverage-text | grep "Lines:" | awk '{print $2}' | sed 's/%//')
    if (( $(echo "$coverage < 80" | bc -l) )); then
      echo "Coverage $coverage% is below 80%"
      exit 1
    fi
```

### Debugging "green before, red now" on unchanged code

TYPO3 extensions are libraries and **do not commit `composer.lock`** — so every
CI run does a fresh `composer update` and resolves dependencies (including the
dev toolchain: PHPStan, Rector, php-cs-fixer, testing-framework) to the latest
versions allowed by `composer.json`. A green pipeline can therefore turn red with
**no change to your code**, simply because an upstream package published a new
release between runs.

When a check fails on a commit (or PR) that previously passed with identical
code, suspect a fresh upstream release before touching your own code:

```bash
# Which version did the failing run install vs. a previous green run?
# composer logs full package names, e.g. "Installing phpstan/phpstan (2.2.2)".
gh run view <run-id> --log | grep -iE "Installing (phpstan|rector|friendsofphp|typo3/testing-framework)/"
# Cross-check release dates on Packagist. The /p2/ endpoint returns versions
# newest-first, so the first entries are the most recent releases.
curl -s https://repo.packagist.org/p2/phpstan/phpstan.json \
  | php -r '$d = json_decode(file_get_contents("php://stdin"), true); foreach (array_slice($d["packages"]["phpstan/phpstan"], 0, 6) as $v) { echo $v["version"] . " " . $v["time"] . PHP_EOL; }'
```

Reproduce deterministically by pinning the suspect version locally
(`composer require --dev "phpstan/phpstan:X.Y.Z"`), confirm it fails, then revert
to the floating constraint after the fix. Note that a newer analyzer release is
often a **true positive** surfacing a latent bug — fix the code, don't pin to
escape it. Pin only as a temporary, documented escape hatch when the release is
genuinely broken — and exclude just the broken release *in addition to* your
normal range (e.g. `^1.12,!=1.12.3`), never a bare `!=1.12.3` (which would also
permit unexpected major upgrades), so future fixes still flow in.

## Environment-Specific Configuration

### Development Branch

```yaml
on:
  push:
    branches: [ develop ]

# Run all checks, allow failures
jobs:
  experimental:
    continue-on-error: true
    strategy:
      matrix:
        php: ['8.4']  # Experimental PHP version
```

### Production Branch

```yaml
on:
  push:
    branches: [ main ]

# Strict checks only
jobs:
  tests:
    strategy:
      fail-fast: true
      matrix:
        php: ['8.2']  # LTS version only
```

### Pull Requests

```yaml
on:
  pull_request:

# Full test matrix
jobs:
  tests:
    strategy:
      matrix:
        php: ['8.1', '8.2', '8.3', '8.4']
        database: ['mysqli', 'postgres']
```

## Netresearch CI Integration

Netresearch TYPO3 extensions use reusable workflows from `netresearch/typo3-ci-workflows` instead of defining CI steps directly in project repositories.

### Core Principle

**NEVER add direct GitHub Actions steps (checkout, setup-php, composer install, etc.) to project workflows.** All CI logic is centralized in reusable workflows provided by `netresearch/typo3-ci-workflows`. Projects only configure inputs and call the shared workflows.

### Single Dev Dependency

```bash
composer require --dev netresearch/typo3-ci-workflows:^1.1
```

This single package transitively provides all quality tools (PHPStan, php-cs-fixer, Rector, PHPUnit, Infection, phpat, captainhook, etc.), shared configurations, and reusable GitHub Actions workflows.

### Workflow Configuration (.github/workflows/ci.yml)

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  ci:
    uses: netresearch/typo3-ci-workflows/.github/workflows/ci.yml@main
    with:
      php-versions: '["8.2", "8.3", "8.4", "8.5"]'
      typo3-versions: '["^13.4"]'
```

### Push Trigger: Restrict to main

The `push` trigger MUST be restricted to `branches: [main]` to avoid duplicate CI runs. Without this restriction, pushing to a branch with an open PR triggers both a `push` event and a `pull_request` event, resulting in duplicate workflow runs:

```yaml
# Correct: push only on main, PR on all branches
on:
  push:
    branches: [main]
  pull_request:

# Wrong: push on all branches causes duplicate runs with PRs
on:
  push:
  pull_request:
```

### Test Matrix

The reusable workflow handles the full test matrix based on inputs:

| Dimension | Values | Notes |
|-----------|--------|-------|
| PHP | 8.2, 8.3, 8.4, 8.5 | All versions TYPO3 v13 supports |
| TYPO3 | ^13.4 | Current LTS |
| Database | pdo_sqlite (default) | Configurable per project |

### PHPStan Extensions Auto-Discovery

When using `netresearch/typo3-ci-workflows`, PHPStan extensions (phpstan-strict-rules, phpstan-typo3, phpstan-phpunit, etc.) are auto-discovered by `phpstan/extension-installer`. Do NOT manually include extension neon files in your `phpstan.neon`:

```neon
# Correct: only include shared config and baseline
includes:
    - %currentWorkingDirectory%/.Build/vendor/netresearch/typo3-ci-workflows/config/phpstan/phpstan.neon
    - phpstan-baseline.neon

parameters:
    paths:
        - ../Classes
        - ../Tests/Architecture
```

```neon
# Wrong: manual includes cause duplicate registration errors
includes:
    - %currentWorkingDirectory%/.Build/vendor/phpstan/phpstan-strict-rules/rules.neon
    - %currentWorkingDirectory%/.Build/vendor/saschaegerer/phpstan-typo3/extension.neon
```

**Exception:** When using git worktrees with `composer install --no-plugins`, use the explicit includes file `includes-no-extension-installer.neon` instead (see quality-tools.md for details).

### What the Reusable Workflow Runs

The CI workflow executes these checks (projects do not need to define them):

1. **Linting** -- PHP syntax validation
2. **Code style** -- php-cs-fixer dry-run
3. **Static analysis** -- PHPStan at level 10
4. **Unit tests** -- across PHP version matrix
5. **Functional tests** -- across PHP version matrix
6. **Mutation testing** -- Infection PHP
7. **Architecture tests** -- phpat rules
8. **Security audit** -- `composer audit`

## Coverage Reporting Pitfalls

### A "coverage drop" can be an expired flag, not missing tests

Codecov merges per-flag sessions (`unit`, `functional`, …) into the project
number. Flags with `carryforward: true` reuse the last uploaded session — and
when that session **expires** (no fresh upload within the retention window),
the flag silently contributes 0/0 lines and the project number collapses to
the remaining flags. The repo then *looks* like it lost coverage with no code
change.

Before writing tests to close a coverage gap, verify each flag is alive:

```bash
# 0/0 lines => the flag expired; the gap is a reporting artifact
curl -s "https://api.codecov.io/api/v2/github/<org>/repos/<repo>/report/?flag=functional" \
  | jq '.totals | {coverage, hits, lines}'
```

Restore an expired flag by re-running the upload path — in the standard
Netresearch split (PR runs = parallel, no coverage; `schedule`/
`workflow_dispatch` = serial + Xdebug + upload) that is one dispatch:

```bash
gh workflow run ci.yml --ref main   # ~15 min; matrix cells upload the flag
```

Real case: a "coverage >= 80%" goal opened against a repo reading 68.6% —
the functional flag had expired; the true full-suite number was 86%. The
dispatch met the goal; the phantom gap would have cost days of test-writing.
Corollary: measure locally only for per-file gap analysis — a full functional
suite under Xdebug on WSL2 projects to hours; the CI dispatch is the fast path.

### Stale coverage cache fails the suite with zero failing tests

PHPUnit's static-analysis cache (`.Build/cache/phpunit/code-coverage/`) is
written by the container user of whoever ran coverage last. A later run under
a different uid gets `file_put_contents(): Permission denied` **warnings** —
and with `failOnWarning="true"` the suite exits 1 with 0 failures/errors.
Remove the cache dir before coverage runs when containers/users alternate:

```bash
rm -rf .Build/cache/phpunit/code-coverage
```

## Resources

- [GitHub Actions Documentation](https://docs.github.com/actions)
- [GitLab CI Documentation](https://docs.gitlab.com/ee/ci/)
- [TYPO3 Tea Extension CI](https://github.com/TYPO3BestPractices/tea/tree/main/.github/workflows)
- [shivammathur/setup-php](https://github.com/shivammathur/setup-php)
- [netresearch/typo3-ci-workflows](https://github.com/netresearch/typo3-ci-workflows)
