# Test Runners and Orchestration

The `runTests.sh` script is the **required** TYPO3 pattern for test orchestration, following TYPO3 core conventions.

## Requirements

Extensions **MUST** have a Docker-based `Build/Scripts/runTests.sh` that:

1. Uses **TYPO3 core-testing images** (`ghcr.io/typo3/core-testing-php*`)
2. Supports **multiple databases** (SQLite default, MariaDB, MySQL, PostgreSQL)
3. Supports **multiple PHP versions** (8.2, 8.3, 8.4, 8.5)
4. Works in **CI environments** (auto-detects non-TTY)
5. Handles **database container orchestration** for functional tests
6. Uses **--user flag** on Linux to prevent root-owned files

## Template

Use `assets/Build/Scripts/runTests.sh` as starting point. Customize:

1. `NETWORK` variable: Replace `my-extension` with your extension key
2. `COMPOSER_ROOT_VERSION`: Set to your extension version
3. `TYPO3_BASE_URL`: Set the TYPO3 URL for E2E tests (default: `http://localhost:8080`)

## Basic Usage

```bash
# Show help
./Build/Scripts/runTests.sh -h

# Run unit tests (default)
./Build/Scripts/runTests.sh -s unit

# Run functional tests with SQLite (fastest, no container)
./Build/Scripts/runTests.sh -s functional

# Run functional tests in parallel (2-3x faster)
./Build/Scripts/runTests.sh -s functionalParallel

# Run functional tests with MariaDB
./Build/Scripts/runTests.sh -s functional -d mariadb

# Run with specific PHP version
./Build/Scripts/runTests.sh -p 8.3 -s unit

# Run E2E tests (PHP built-in server + MySQL container, NOT DDEV)
./Build/Scripts/runTests.sh -s e2e

# Run quality tools
./Build/Scripts/runTests.sh -s lint
./Build/Scripts/runTests.sh -s phpstan
./Build/Scripts/runTests.sh -s cgl
```

## Script Options

| Option | Description | Values |
|--------|-------------|--------|
| `-s` | Test suite | `unit`, `functional`, `functionalParallel`, `e2e`, `lint`, `phpstan`, `cgl`, `rector`, `fuzz`, `mutation`, `composer` (runs a composer command, e.g. `-s composer dump-autoload`) |
| `-d` | Database | `sqlite` (default), `mariadb`, `mysql`, `postgres` |
| `-i` | DB version | mariadb: 10.11, mysql: 8.0, postgres: 16 |
| `-p` | PHP version | `8.2`, `8.3`, `8.4`, `8.5` |
| `-x` | Enable Xdebug | |
| `-n` | Dry-run | For cgl, rector |
| `-u` | Update images | |

## Test Parallelization

### E2E Tests (Playwright)

Playwright parallelizes by spec file. Configure in `playwright.config.ts`:

```typescript
export default defineConfig({
  fullyParallel: false, // Tests within file run sequentially (safer)
  workers: process.env.CI ? 4 : undefined, // CI: fixed, Local: half of CPUs
});
```

**Performance**: 3x speedup (3.8min → 1.3min for 111 tests)

**Note**: Workers are capped at the number of spec files when `fullyParallel: false`.

### Functional Tests (functionalParallel)

Uses `xargs -P` to run test files concurrently with SQLite:

```bash
# CI: 4 parallel jobs for predictable resource usage
# Local: half of available CPUs
if [ "${CI}" == "true" ]; then
    PARALLEL_JOBS=4
else
    PARALLEL_JOBS="$(($(nproc) + 1) / 2)"
fi

find Tests/Functional -name '*Test.php' | xargs -P${PARALLEL_JOBS} ...
```

**Performance**: 2-3x speedup (24s → 10s for 62 tests). On CI's slower shared runners the win is larger — an 8-11min serial functional cell drops to ~2.5min.

**Why one process per file is collision-free (and works on MariaDB too):** the testing-framework derives BOTH the test instance directory AND the database name from the same per-class identifier — `substr(sha1(static::class), 0, 7)` (`FunctionalTestCase::getInstanceIdentifier`), used as `functional-<id>/` for the SQLite file and as `<originalDatabaseName>_ft<id>` for MySQL/MariaDB (`FunctionalTestCase.php`, the non-sqlite branch). So each **file** gets its own database on a shared server — no CREATE race, safe at `-P4` well under a default `max_connections` of 151. Shard by **file**, never by test *method* (`--filter`): several methods of one class share one instance.

**Glob every suite `FunctionalTests.xml` declares, not just `Tests/Functional`.** If the config runs a second testsuite (e.g. an `e2e-backend` directory `Tests/E2E/Backend/`), a sharder that globs only `Tests/Functional` **silently drops it** — the classes never run and CI stays green. Match the config:

```bash
find Tests/Functional Tests/E2E/Backend -name '*Test.php' | xargs -P${PARALLEL_JOBS} ...
```

**Force `XDEBUG_MODE=off` on non-coverage parallel runs.** If setup-php installed Xdebug as the coverage driver, it stays in coverage mode and taxes runtime ~1.6x **even when no coverage is collected** (measured: 61s vs 37.6s on the same 126-test subset). Only enable it on the serial coverage run.

**Requirement**: SQLite with tmpfs (or MySQL/MariaDB, per above) for isolated databases per test file.

### Unit Tests

Unit tests are typically fast enough (<1s) that parallelization overhead would be counterproductive. PHPUnit's native parallelization (ParaTest) doesn't support PHPUnit 12 yet.

## Gotcha: Single-Process PHPUnit OOMs on Large Functional Suites

Running the whole functional suite through plain single-process PHPUnit (`vendor/bin/phpunit -c phpunit.xml.dist`, no parallelization) accumulates every test's compiled DI container and TYPO3 bootstrap in one PHP process. On a few hundred functional tests this exhausts `memory_limit` — typically a fatal deep in Symfony's container dumper:

```
PHP Fatal error:  Allowed memory size of 536870912 bytes exhausted ...
  in .../symfony/dependency-injection/Dumper/PhpDumper.php
```

The symptom is misleading: progress dots stop part-way with **no PHPUnit summary line**, and a `timeout`/wrapper around the call may still report exit 0 — so it looks like "passed" when it actually died mid-run.

**Fix:** run the suite the way the project's entry point does — in **isolated worker processes**, one slice per worker, so container compilation never accumulates:

```bash
./Build/Scripts/runTests.sh -s functionalParallel   # xargs -P, one phpunit process per test file
# or, for a paratest-based project entry point:
composer test
```

Reserve plain `phpunit --filter=SomeClass` for a single class. (This is the concrete reason behind Best Practice "Single Entry Point — all tests via `runTests.sh`, not direct PHPUnit".)

## Database Support

### SQLite (Default)
- **Fastest**: No container startup
- **CI-friendly**: No external services needed
- **Parallelizable**: Each test file gets isolated DB

```bash
./Build/Scripts/runTests.sh -s functional  # Uses SQLite
```

### MariaDB/MySQL
- Required for MySQL-specific syntax
- Mark incompatible tests with `#[Group('not-sqlite')]`

```bash
./Build/Scripts/runTests.sh -s functional -d mariadb -i 10.11
./Build/Scripts/runTests.sh -s functional -d mysql -i 8.0
```

### PostgreSQL
- For PostgreSQL compatibility testing

```bash
./Build/Scripts/runTests.sh -s functional -d postgres -i 16
```

## E2E Test Integration

E2E tests use a PHP built-in server + MySQL container. **Do NOT use DDEV for tests.**
In CI, use the reusable `e2e.yml` workflow from `netresearch/typo3-ci-workflows`.

```bash
# Run E2E tests locally (starts PHP server + DB automatically)
./Build/Scripts/runTests.sh -s e2e

# With custom URL (e.g., if TYPO3 is already running)
TYPO3_BASE_URL=http://localhost:8080 ./Build/Scripts/runTests.sh -s e2e
```

### Playwright Docker Image

Use the official Playwright image with pre-installed browsers:

```bash
IMAGE_PLAYWRIGHT="mcr.microsoft.com/playwright:v1.57.0-noble"
```

**Important**: Keep Playwright versions in sync between:
- `package.json`: `"@playwright/test": "^1.57.0"`
- `runTests.sh`: `IMAGE_PLAYWRIGHT="mcr.microsoft.com/playwright:v1.57.0-noble"`

## Helper Functions

### waitFor (TCP port)

Wait for a service to be available on a TCP port:

```bash
waitFor() {
    local HOST=${1}
    local PORT=${2}
    # Uses netcat to check port availability
    # Retries up to 10 times with 1 second delay
}

# Usage
waitFor mariadb-container 3306
```

### waitForHttp (HTTP endpoint)

Wait for an HTTP endpoint to respond:

```bash
waitForHttp() {
    local URL=${1}
    local MAX_ATTEMPTS=${2:-30}
    # Uses wget to check HTTP availability
}

# Usage: Wait for mock OAuth server
waitForHttp "http://mock-oauth-container:8080/.well-known/openid-configuration"
```

## Mock Services

### Mock OAuth Server

For testing OAuth integration without real providers:

```bash
IMAGE_MOCK_OAUTH="ghcr.io/navikt/mock-oauth2-server:3.0.1"

${CONTAINER_BIN} run --rm -d --name mock-oauth-${SUFFIX} --network ${NETWORK} \
    -e SERVER_PORT=8080 \
    -e JSON_CONFIG_PATH=/config/config.json \
    -v "${ROOT_DIR}/.ddev/mock-oauth:/config:ro" \
    ${IMAGE_MOCK_OAUTH}

waitFor mock-oauth-${SUFFIX} 8080

# Pass URL to tests
-e MOCK_OAUTH_URL="http://mock-oauth-${SUFFIX}:8080"
```

## PHP Performance Optimization

Enable opcache and JIT for faster test execution:

```bash
PHP_OPCACHE_OPTS="-d opcache.enable_cli=1 -d opcache.jit=1255 -d opcache.jit_buffer_size=128M"
```

**Note**: Disable JIT for coverage (`-d opcache.jit=off`) as it's incompatible with Xdebug.

## Permission Handling

### Linux --user Flag

On Linux, containers run as the host user to prevent root-owned files:

```bash
if [ $(uname) != "Darwin" ]; then
    USERSET="--user $(id -u)"
fi
```

### Root-owned Files Detection

For E2E tests, detect and warn about root-owned node_modules:

```bash
if [ "$(find node_modules -maxdepth 1 -user root 2>/dev/null | head -1)" ]; then
    echo "Error: node_modules contains root-owned files."
    echo "Please remove: sudo rm -rf node_modules"
    exit 1
fi
```

## Makefile Integration

Create a `Makefile` for convenient shortcuts:

```makefile
RUNTESTS = Build/Scripts/runTests.sh

.PHONY: test unit functional lint phpstan cs fix ci e2e

test: unit
unit:
	$(RUNTESTS) -s unit

functional:
	$(RUNTESTS) -s functional

functional-fast:
	$(RUNTESTS) -s functionalParallel

e2e:
	$(RUNTESTS) -s e2e

lint:
	$(RUNTESTS) -s lint

phpstan:
	$(RUNTESTS) -s phpstan

cs:
	$(RUNTESTS) -s cgl -n

fix:
	$(RUNTESTS) -s cgl

ci: lint cs phpstan unit functional
```

## CI/CD Integration

### GitHub Actions (Recommended)

```yaml
name: CI

on: [push, pull_request]

jobs:
  tests:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        php: ['8.2', '8.3', '8.4']
        suite: ['unit', 'functional']
        database: ['sqlite']
        include:
          - php: '8.4'
            suite: 'functional'
            database: 'mariadb'

    steps:
      - uses: actions/checkout@v4

      - name: Run ${{ matrix.suite }} tests
        run: |
          Build/Scripts/runTests.sh \
            -s ${{ matrix.suite }} \
            -p ${{ matrix.php }} \
            -d ${{ matrix.database }}

  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: Build/Scripts/runTests.sh -s lint
      - run: Build/Scripts/runTests.sh -s phpstan
      - run: Build/Scripts/runTests.sh -s cgl -n

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ddev/github-action-setup-ddev@v1
      - run: ddev start
      - run: Build/Scripts/runTests.sh -s e2e
```

## Fast setup in a fresh worktree (rsync a known-good `.Build`)

A newly created worktree has no `.Build/` (it's gitignored), so `runTests.sh`
fails with `Could not open input file: .Build/bin/phpunit`. A fresh `composer
install` works but is slow, and on WSL2 a fresh resolution can segfault the
full-config PHPUnit run (flaky exit 139). Faster and stable: rsync a **known-good**
`.Build` from a sibling worktree, then regenerate the autoloader so the new
worktree's own classes are registered.

```bash
rsync -a --delete ../<sibling-worktree>/.Build/ ./.Build/
Build/Scripts/runTests.sh -s composer dump-autoload   # register new PSR-4 classes
Build/Scripts/runTests.sh -s unit
```

Only reuse a `.Build` whose resolved dependency versions are compatible with this
branch (e.g. the same `nr-llm` minor). If they differ, the reused vendor can carry
a different API than your code targets — a symptom is a value object's constructor
requiring an argument your code/tests omit (signatures drift across minors).
Verify the constructor at the **resolved** version, not the library's `main`, and
run the static analyzer **after** the tests are written (test files are analyzed
too). CI remains authoritative — treat the rsynced `.Build` as a local fast path,
not a substitute for the CI matrix.

## Troubleshooting

### TTY Errors
Script auto-detects non-TTY environments. If issues persist:
```bash
CI=true ./Build/Scripts/runTests.sh -s unit
```

### Database Connection Errors
```bash
# Check container is running
docker ps

# Use SQLite to rule out DB issues
./Build/Scripts/runTests.sh -s functional -d sqlite
```

### SQLite functional tests fail with "unable to open database file" (rootless / WSL2)

On **rootless Docker** or **WSL2** hosts, the SQLite functional run can fail with
`unable to open database file` even though the same command works on a standard
Docker-CE host. Cause: `runTests.sh` mounts the SQLite working directory as a `tmpfs`,
but the container process runs as a non-root user that has no write permission on the
default-mode tmpfs.

Fix: add `,mode=1777` (world-writable, sticky — like `/tmp`) to the SQLite `tmpfs`
mount option in `Build/Scripts/runTests.sh` (every occurrence):

```diff
- --tmpfs ${CORE_ROOT}/.Build/Web/typo3temp/var/tests/functional-sqlite-dbs/:rw,noexec,nosuid
+ --tmpfs ${CORE_ROOT}/.Build/Web/typo3temp/var/tests/functional-sqlite-dbs/:rw,noexec,nosuid,mode=1777
```

This is CI-safe (standard Docker hosts are unaffected) and unblocks local functional
testing on rootless/WSL2.

### Root-owned Files
```bash
# Remove root-owned files (requires sudo)
sudo rm -rf node_modules .Build
```

### Update Images
```bash
./Build/Scripts/runTests.sh -u
```

## Best Practices

1. **SQLite First**: Use SQLite for most functional tests (fastest)
2. **Parallel Tests**: Use `functionalParallel` for faster CI
3. **Matrix Testing**: Test all supported PHP versions in CI
4. **Group Incompatible Tests**: Use `#[Group('not-sqlite')]` for DB-specific tests
5. **Single Entry Point**: All tests via `runTests.sh`, not direct PHPUnit
6. **Makefile Shortcuts**: Provide `make test`, `make ci` for convenience
7. **Update Images**: Run `-u` periodically to get latest TYPO3 images
8. **Keep Versions Synced**: Playwright versions in package.json and runTests.sh

## Gotcha: `-s unit` Green ≠ Safe When You Touch a Shared Type

`./Build/Scripts/runTests.sh -s unit` covers **only** `Tests/Unit/`. When you
change a **widely-consumed** type — a shared value object, DTO, enum, or a
method on a public service interface — its consumers and their assertions live
in the **functional** suite (and integration/e2e), which `-s unit` never runs.

A green unit run then hides a real break, and it surfaces later in CI or a
reviewer's comment instead of on your machine. (Real case: a change to a
`ToolSpec` value object passed `-s unit` locally but broke a functional test
asserting the old shape — caught by CI + the PR bot, not the local unit run.)

Before pushing a change to a shared type:

```bash
# Find who depends on it, then run the suites that exercise them.
# Use -e per pattern (portable across GNU/BSD grep; escaped \| is not).
grep -rn -e 'YourValueObject' -e '->yourChangedMethod' Classes/ Tests/
./Build/Scripts/runTests.sh -s unit
./Build/Scripts/runTests.sh -s functional     # the assertions on the old shape live here
```

If the extension's CI runs functional tests (it should — a functional job that
is silently skipped is its own bug), treat "did I run the same suites CI will?"
as the pre-push checklist, not "is unit green?".

## Resources

- [TYPO3 Tea Extension](https://github.com/TYPO3BestPractices/tea) - Reference implementation
- [TYPO3 Core Testing](https://github.com/typo3/typo3) - Core approach
- [typo3/core-testing images](https://github.com/typo3/core-testing) - Official images
- [nr-vault](https://github.com/netresearch/t3x-nr-vault) - Reference with all patterns
