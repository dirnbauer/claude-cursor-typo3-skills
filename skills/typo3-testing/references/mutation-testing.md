# Mutation Testing for TYPO3 Extensions

## Overview

Mutation testing verifies test suite quality by introducing small bugs (mutants) into the code and checking if tests catch them. If a test suite has good coverage but low mutation score, the tests may not be actually testing the important behaviors.

> **Key Distinction**: Mutation testing mutates **code** to verify test quality. For testing that mutates **inputs** to find crashes, see [Fuzz Testing](fuzz-testing.md).

| Aspect | Mutation Testing | Fuzz Testing |
|--------|-----------------|--------------|
| **Mutates** | Source code | Input data |
| **Purpose** | Verify test quality | Find crashes/vulnerabilities |
| **Example** | `if (x != y)` → `if (x == y)` | `<img src="` → `<img src="../../../../etc/passwd` |
| **Finds** | Weak/missing tests | Parsing bugs, security issues |
| **Tool (PHP)** | Infection | nikic/php-fuzzer |

## When to Use Mutation Testing

- After achieving high code coverage (70%+) to verify test quality
- Before releases to ensure critical paths are well-tested
- When refactoring to ensure tests catch regressions
- To identify "weak spots" in test coverage

## The Single-Mutant Check: Prove One Regression Guard By Hand

A full Infection run is the wrong tool when the question is narrow: *does the test I just
wrote actually catch the bug I just fixed?* Answer it directly — revert the production line
to its buggy form, run the affected tests, and require them to **fail**; then restore the
fix and require them to pass. A test that stays green both ways guards nothing, and it looks
identical to a working one in a passing suite.

Do this whenever the bug is one a test could plausibly miss: a silently dropped argument, a
default that quietly substitutes for a rejected value, a mocked collaborator that accepts any
call shape. Mock-based tests are especially prone to it — a mock cannot reproduce the real
library's argument filtering, so asserting *how* it was called is the only thing that binds.

Run it through `runTests.sh` so the check inherits the project's Docker PHP-version isolation —
a pass/fail signal is only worth as much as the environment it came from:

```bash
# 1. Baseline: the guard passes
Build/Scripts/runTests.sh -s unit -- --filter=theGuardingTest

# 2. Reintroduce the bug (exact string replace, not a regex sed)
python3 - <<'PY'
p = 'Classes/Service/Thing.php'
s = open(p).read()
old, new = "save($path, quality: $quality)", "save($path, $quality)"
assert s.count(old) == 1, f'expected 1 occurrence, found {s.count(old)}'
open(p, 'w').write(s.replace(old, new))
PY
grep -n 'save(\$path' Classes/Service/Thing.php   # confirm the edit applied

# 3. The guard MUST fail now
Build/Scripts/runTests.sh -s unit -- --filter=theGuardingTest

# 4. Restore and confirm green again
git checkout -- Classes/Service/Thing.php
git diff --quiet -- Classes/ && Build/Scripts/runTests.sh -s unit -- --filter=theGuardingTest
```

Where the project has no `runTests.sh` — or you are already inside the container — the direct
equivalent is `vendor/bin/phpunit -c Build/phpunit/UnitTests.xml --filter=theGuardingTest`. This is
the single-class case that [`test-runners.md`](test-runners.md) reserves plain `phpunit --filter`
for; do not generalise it to running whole suites outside the entry point.

Two traps make this check lie:

- **Verify the mutation applied.** A `sed` pattern that silently matches nothing leaves the
  file untouched, and the suite then "fails" for some unrelated reason — or passes, and you
  conclude the guard is worthless. Assert the occurrence count when replacing, and `grep`
  the file afterwards. Restore from a byte copy and confirm with `git diff --quiet`.
- **Read the failure, not just the exit code.** In an environment with pre-existing failures
  (a missing `gd`/`imagick` extension makes unrelated tests error), a non-zero exit proves
  nothing on its own. Scope the run with `--filter`, or compare the failing-test set against
  the baseline.

Re-run this after any refactor of the test itself — consolidating duplicated test setup can
quietly detach the assertion from the behaviour it was guarding.

## Tools

### Infection (Recommended)

PHP mutation testing framework with PHPUnit integration.

**Installation:**
```bash
composer require --dev infection/infection:^0.27
```

**Key features:**
- Mutates PHP code with various operators
- Integrates with PHPUnit and Pest
- Generates HTML and JSON reports
- Supports incremental analysis

## Preflight: Tests Must Pass Before Mutating

Infection runs the configured PHPUnit suite **once, unmutated**, before applying any mutations. If that initial run reports failures or errors -- even a single one -- Infection aborts and reports nothing. In practice, two recurring causes blow up the preflight:

1. **Flaky fuzz tests.** `random_int(0, $n)` legitimately returns `0`, and `random_bytes(0)` then throws `\ValueError("random_bytes(): Argument #1 ($length) must be greater than 0")` (PHP 8.0+ — was `\Error` before). The fuzz suite passes most of the time and randomly fails inside Infection's preflight. **Fix:** use `random_int(1, $n)` (or `max(1, $n)`) anywhere a randomly-chosen length feeds into `random_bytes()` / `openssl_random_pseudo_bytes()` / similar zero-rejecting APIs.
2. **Functional tests included in the unit suite.** If `phpunit.xml` mixes unit and functional suites, Infection tries to boot a database it cannot reach during local mutation runs.

**Rule of thumb:** before running `infection`, run the exact same command Infection will run (`testFrameworkOptions` from `infection.json5`) and confirm it is green. Fix flakes there, not in Infection's CI logs.

## Suite Layout: Split Unit/Fuzz From Functional

Keep two PHPUnit configs:

- `phpunit.xml` (or `Build/phpunit/UnitTests.xml`) -- unit + fuzz suites only, no DB, fast.
- `phpunit.functional.xml` (or `Build/phpunit/FunctionalTests.xml`) -- functional tests, requires MySQL/MariaDB.

Point Infection's `testFrameworkOptions` at the unit/fuzz config so the preflight is fast and DB-free:

```json5
"testFrameworkOptions": "-c Build/phpunit/UnitTests.xml"
```

Infection also auto-discovers a `phpunit.xml` (or `phpunit.xml.dist`) in `phpUnit.configDir` (defaults to project root) when `testFrameworkOptions` is not used -- it expects the **standard file names**, so do not rename to `phpunit-unit.xml` or similar without setting `phpUnit.configDir` explicitly:

```json5
"phpUnit": {
    "configDir": "Build/phpunit"
}
```

Either pin the config explicitly (`testFrameworkOptions`) or keep the default name and use `phpUnit.configDir` -- never both implicit. This keeps `composer ci:test:php:unit` and `composer ci:test:mutation` running the same PHPUnit invocation, which is the point of the split.

## Configuration

Create `infection.json5` in project root.

> **TYPO3 convention:** When using `.Build/` for vendor dependencies, use the local schema path
> `".Build/vendor/infection/infection/resources/schema.json"` instead of the remote URL. This
> works offline and reflects the actual installed version.

```json5
{
    "$schema": ".Build/vendor/infection/infection/resources/schema.json",
    "source": {
        "directories": [
            "Classes"
        ],
        "excludes": [
            "Domain/Model"  // Skip simple DTOs
        ]
    },
    "logs": {
        "html": ".Build/logs/infection.html",
        "text": ".Build/logs/infection.log",
        "summary": ".Build/logs/infection-summary.log"
    },
    "mutators": {
        "@default": true,
        // Disable noisy mutators if needed
        "TrueValue": false,
        "FalseValue": false
    },
    "minMsi": 60,           // Minimum Mutation Score Indicator
    "minCoveredMsi": 80,    // Minimum MSI for covered code only
    "testFramework": "phpunit",
    "testFrameworkOptions": "-c Build/phpunit/UnitTests.xml"
}
```

## Mutation Operators

Infection applies these types of mutations:

### Arithmetic Operators
```php
// Original
$result = $a + $b;

// Mutants
$result = $a - $b;  // PlusToMinus
$result = $a * $b;  // PlusToMultiplication
```

### Comparison Operators
```php
// Original
if ($value > 10) { ... }

// Mutants
if ($value >= 10) { ... }  // GreaterThan to GreaterThanOrEqual
if ($value < 10) { ... }   // GreaterThan to LessThan
if (true) { ... }          // Always truthy
```

### Boolean Operators
```php
// Original
if ($a && $b) { ... }

// Mutants
if ($a || $b) { ... }  // LogicalAnd to LogicalOr
if ($a) { ... }        // Remove operand
```

### Return Values
```php
// Original
return $value;

// Mutants
return null;           // Return null
return [];             // Return empty array
return !$value;        // Negate boolean
```

### Method Calls
```php
// Original
$this->save($entity);

// Mutant
// Line removed (method call deleted)
```

## Running Mutation Tests

### Via Composer Scripts

```json
{
    "scripts": {
        "ci:test:mutation": [
            "@ci:test:php:unit",
            ".Build/bin/infection --threads=4"
        ],
        "ci:test:mutation:quick": [
            ".Build/bin/infection --threads=4 --only-covered --min-msi=60"
        ]
    }
}
```

### Via runTests.sh

```bash
# Add to Build/Scripts/runTests.sh
mutation)
    # Run unit tests first to generate coverage
    COMMAND=(.Build/bin/phpunit -c Build/phpunit/UnitTests.xml --coverage-xml=.Build/logs/coverage-xml --coverage-html=.Build/logs/coverage-html)
    ${CONTAINER_BIN} run ${CONTAINER_COMMON_PARAMS} --name unit-${SUFFIX} ${IMAGE_PHP} "${COMMAND[@]}"

    # Run mutation testing
    COMMAND=(.Build/bin/infection --threads=4 --coverage=.Build/logs/coverage-xml)
    ${CONTAINER_BIN} run ${CONTAINER_COMMON_PARAMS} --name mutation-${SUFFIX} ${IMAGE_PHP} "${COMMAND[@]}"
    SUITE_EXIT_CODE=$?
    ;;
```

### Directly

```bash
# Full mutation test run
.Build/bin/infection --threads=4

# Quick run (only test covered code)
.Build/bin/infection --threads=4 --only-covered

# With existing coverage
.Build/bin/infection --threads=4 --coverage=.Build/logs/coverage-xml

# Filter to specific directory
.Build/bin/infection --threads=4 --filter=Classes/Service
```

## Interpreting Results

### Mutation Score Indicator (MSI)

```
Mutations:       150 total
Killed:          120 (80%)    ← Tests caught the mutation
Escaped:          15 (10%)    ← Tests MISSED the mutation (bad!)
Errors:            5 (3%)     ← Mutation caused fatal error
Uncovered:        10 (7%)     ← No tests for this code

MSI: 80%                      ← (Killed + Errors) / Total
Covered MSI: 86%              ← MSI for covered code only
```

### Understanding Results

| Status | Meaning | Action |
|--------|---------|--------|
| **Killed** | Test failed when mutant introduced | Good - test is effective |
| **Escaped** | Test passed with mutant | **Bad - add/improve tests** |
| **Errors** | Mutant caused fatal error | Usually OK (type errors) |
| **Uncovered** | No test coverage | Add coverage first |
| **Timeout** | Test took too long with mutant | Usually OK |
| **Skipped** | Mutant not tested | Check config |

### Target Scores

| Level | MSI | Covered MSI | Use Case |
|-------|-----|-------------|----------|
| Basic | 50%+ | 60%+ | Initial implementation |
| Good | 70%+ | 80%+ | Production code |
| Excellent | 85%+ | 90%+ | Critical/security code |

## Improving Mutation Score

### 1. Fix Escaped Mutants

Review the HTML report to find escaped mutants:

```html
<!-- .Build/logs/infection.html -->
<!-- Shows: Original code, Mutated code, Test that should have caught it -->
```

### 2. Add Boundary Tests

```php
// If this escapes:
//   if ($age >= 18) → if ($age > 18)
// Add boundary test:
public function testAgeExactly18IsAllowed(): void
{
    self::assertTrue($this->validator->isAdult(18));
}
```

### 3. Add Negative Tests

```php
// If method removal escapes:
//   $logger->error($message);  // removed
// Add test verifying the call:
public function testErrorIsLogged(): void
{
    $logger = $this->createMock(LoggerInterface::class);
    $logger->expects(self::once())
        ->method('error')
        ->with('Expected message');

    $service = new MyService($logger);
    $service->doSomethingThatLogs();
}
```

### 4. Test Return Values

```php
// If return value mutation escapes:
//   return $result; → return null;
// Verify return value explicitly:
public function testReturnsCalculatedValue(): void
{
    $result = $calculator->compute(5, 3);
    self::assertSame(8, $result);  // Not just assertNotNull!
}
```

### 5. Kill Common TYPO3 Escaped Mutants

#### Concat mutations (string reordering/removal)
```php
// WEAK — Concat mutations escape because substring order doesn't matter
$message = $service->getErrorMessage();
self::assertStringContainsString('provider', $message);
self::assertStringContainsString('LLM module', $message);

// STRONG — kills Concat mutations by asserting the exact string
$message = $service->getErrorMessage();
self::assertSame(
    'No LLM provider configured. Create a provider in Admin Tools > LLM > Providers.',
    $message,
);
```

#### LogicalOr to LogicalAnd mutations
```php
// Given this code under test:
//
// public function getStatusMessage(\Throwable $e): string {
//     $msg = $e->getMessage();
//     if (str_contains($msg, '401') || str_contains($msg, 'Unauthorized')) {
//         return 'The API key was rejected.';
//     }
//     return 'An unknown error occurred.';
// }
//
// Test each OR branch individually to kill the LogicalAnd mutation:

#[Test]
public function recognizes401Code(): void
{
    // Only "401", no "Unauthorized" — kills LogicalAnd mutation
    $result = $this->subject->getStatusMessage(
        new \RuntimeException('HTTP 401 error'),
    );
    self::assertSame('The API key was rejected.', $result);
}

#[Test]
public function recognizesUnauthorized(): void
{
    // Only "Unauthorized", no "401"
    $result = $this->subject->getStatusMessage(
        new \RuntimeException('Request Unauthorized'),
    );
    self::assertSame('The API key was rejected.', $result);
}
```

#### GreaterThan to GreaterThanOrEqual mutations
```php
// If code has: $check = $count > 0 ? createOkCheck() : createErrorCheck();
// You must assert BOTH branches to kill the mutation.

// 1. Test for count > 0 (e.g., count = 1)
$passingCheck = $this->service->runCheck(1);
self::assertSame(Severity::Ok, $passingCheck->severity);
self::assertNull($passingCheck->fixRoute);

// 2. Test for count = 0. This kills the `>` to `>=` mutation.
$failingCheck = $this->service->runCheck(0);
self::assertSame(Severity::Error, $failingCheck->severity);
self::assertSame('nrllm_providers', $failingCheck->fixRoute);
```

## CI Integration

### GitHub Actions

```yaml
# .github/workflows/tests.yml
mutation:
  name: Mutation Testing
  runs-on: ubuntu-latest
  needs: [unit]  # Run after unit tests pass
  steps:
    - uses: actions/checkout@v4
    - uses: shivammathur/setup-php@v2
      with:
        php-version: '8.2'
        coverage: xdebug

    - run: composer install

    - name: Run unit tests with coverage
      run: |
        .Build/bin/phpunit -c Build/phpunit/UnitTests.xml \
          --coverage-xml=.Build/logs/coverage-xml \
          --log-junit=.Build/logs/phpunit.xml

    - name: Run mutation testing
      run: |
        .Build/bin/infection \
          --threads=4 \
          --coverage=.Build/logs/coverage-xml \
          --min-msi=60 \
          --min-covered-msi=80 \
          --skip-initial-tests

    - name: Upload mutation report
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: mutation-report
        path: .Build/logs/infection.html
```

### Quality Gate

```yaml
# Fail CI if mutation score drops
- name: Check mutation score
  run: |
    .Build/bin/infection \
      --threads=4 \
      --min-msi=60 \
      --min-covered-msi=80 \
      --only-covered
```

## Best Practices

1. **Run unit tests first** - Mutation testing needs passing tests
2. **Start with low thresholds** - Increase gradually (50% → 60% → 70%)
3. **Focus on covered code** - Use `--only-covered` for actionable results
4. **Prioritize escaped mutants** - These indicate weak tests
5. **Exclude trivial code** - Skip getters/setters/DTOs in config
6. **Run incrementally** - Use `--git-diff-filter=AM` for changed files only
7. **Document exclusions** - Explain why code is excluded from mutation testing

## Incremental Mutation Testing

For large codebases, run mutation testing only on changed files:

```bash
# Only test files changed in current branch
.Build/bin/infection \
  --threads=4 \
  --git-diff-filter=AM \
  --git-diff-base=origin/main \
  --only-covered
```

## Directory Structure

```
project/
├── infection.json5           # Infection configuration
├── .Build/
│   └── logs/
│       ├── infection.html    # HTML report
│       ├── infection.log     # Detailed log
│       └── infection-summary.log
└── Tests/
    └── Unit/
        └── Service/
            └── MyServiceTest.php
```

## Resources

- [Infection PHP](https://infection.github.io/) - PHP mutation testing framework
- [Mutation Testing](https://en.wikipedia.org/wiki/Mutation_testing) - Concept overview
- [Pitest](https://pitest.org/) - Java mutation testing (for comparison)
- [Stryker](https://stryker-mutator.io/) - JavaScript/TypeScript mutation testing
