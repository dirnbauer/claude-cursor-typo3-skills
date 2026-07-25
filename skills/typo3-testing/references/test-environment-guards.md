# Test Environment Guards

Patterns for writing robust tests that handle different runtime environments gracefully (CI containers running as root, missing PHP extensions, filesystem permissions).

## Initialise `Environment` in `Tests/bootstrap.php`

Production code that uses `TYPO3\CMS\Core\Http\NormalizedParams::createFromServerParams()` (typically as a CLI / non-request fallback for the deprecated `GeneralUtility::getIndpEnv()` -- deprecated in TYPO3 v14.3, removed in v15.0) will TypeError under PHPUnit unless `Environment` has been initialised:

```
TypeError: TYPO3\CMS\Core\Core\Environment::getCurrentScript():
Return value must be of type string, null returned
```

`createFromServerParams()` calls `Environment::getCurrentScript()` and `Environment::getPublicPath()` to populate the path-related fields of `NormalizedParams`. In unit tests TYPO3's `SystemEnvironmentBuilder` does not run, so `Environment` is uninitialised and those getters return `null`.

**Fix:** initialise `Environment` once in `Tests/bootstrap.php`:

```php
<?php

declare(strict_types=1);

require_once dirname(__DIR__) . '/.Build/vendor/autoload.php';

$projectPath = \dirname(__DIR__);

\TYPO3\CMS\Core\Core\Environment::initialize(
    new \TYPO3\CMS\Core\Core\ApplicationContext('Testing'),
    true,                       // cli
    true,                       // composerMode
    $projectPath,               // projectPath
    $projectPath,               // publicPath
    $projectPath . '/var',      // varPath
    $projectPath . '/config',   // configPath
    __FILE__,                   // currentScript (this Tests/bootstrap.php file)
    'UNIX',                     // os
);
```

Reference the bootstrap from `phpunit.xml` at the project root, or from `Build/phpunit/UnitTests.xml` (note the relative path differs by config location):

```xml
<!-- phpunit.xml at project root -->
<phpunit bootstrap="Tests/bootstrap.php" ...>

<!-- Build/phpunit/UnitTests.xml (two levels deep) -->
<phpunit bootstrap="../../Tests/bootstrap.php" ...>
```

**Where this matters:**
- Code paths that call `NormalizedParams::createFromServerParams($_SERVER, $sysConf)` from CLI / non-request contexts
- Migrations away from `GeneralUtility::getIndpEnv()` (deprecated v14.3, removed v15.0)
- Any unit test that exercises code touching `Environment::getCurrentScript()` / `Environment::getPublicPath()`

### Define the `LF` constant for TYPO3 v12 unit tests

TYPO3 v12's `PageRenderer` (and a few other v12-only code paths) reference the `LF` global constant that `SystemEnvironmentBuilder::defineBaseConstants()` defines during a normal request bootstrap. Unit tests do not run that bootstrap, so any test that exercises v12 PageRenderer code dies with `Undefined constant "LF"` (PHP 8.x: a fatal `Error`).

Add this guard early in `Tests/bootstrap.php`, next to the `Environment::initialize()` call:

```php
if (!\defined('LF')) {
    \define('LF', "\n");
}
```

The constant was effectively retired in v13+ (replaced by `PHP_EOL` / explicit `"\n"` at call sites), but the guard is harmless on v13/v14 and is required while the extension still supports v12.

## PHPUnit `backupGlobals="true"` Resets `$GLOBALS` Between Tests

Many TYPO3 extension `phpunit.xml` files set `backupGlobals="true"`. PHPUnit runs the suite bootstrap once, then snapshots `$GLOBALS` per test (before `setUp()`) and restores the snapshot after the test finishes. Globals set by the suite bootstrap survive that cycle, but globals introduced inside `setUp()` or mutated by a previous test do not -- they are reset to whatever was captured in the snapshot. Combined with CLI / non-request contexts where `$GLOBALS['TYPO3_CONF_VARS']` may simply never have been populated, production code that reads it at runtime can see `null` -- typically resulting in:

```
TypeError: ... must be of type array, null given
```

or PHPStan level 10 `offsetAccess.nonOffsetAccessible` errors when statically analysing array access on `$GLOBALS['TYPO3_CONF_VARS']`.

**Fix:** never assume bootstrap-set globals are present at runtime. Read them defensively with explicit narrowing and a safe default:

```php
use TYPO3\CMS\Core\Http\NormalizedParams;

$confVars = $GLOBALS['TYPO3_CONF_VARS'] ?? null;
$sysConf  = \is_array($confVars) && isset($confVars['SYS']) && \is_array($confVars['SYS'])
    ? $confVars['SYS']
    : [];

return NormalizedParams::createFromServerParams($_SERVER, $sysConf);
```

This pattern:
- Survives `backupGlobals="true"` snapshot/restore cycles
- Handles CLI / non-request contexts where `$GLOBALS['TYPO3_CONF_VARS']` may not be populated
- Satisfies PHPStan level 10 strict-mode rules on `$GLOBALS['TYPO3_CONF_VARS']` access

**Alternative:** set `backupGlobals="false"` in `phpunit.xml` if no test relies on global isolation -- but the defensive read pattern above is preferred because it also hardens production code for genuinely uninitialised CLI contexts.

## Transient `HashService`/`encryptionKey` E_WARNING When a Functional Test Builds a DI Container

**Symptom:** a functional test that realises a dependency-injection container which
loads a package (e.g. `dashboard`) fails with `failOnWarning=true` on an
`E_WARNING` — "Undefined array key" / "Trying to access array offset on null" —
raised from core `TYPO3\CMS\Core\Crypto\HashService::hmac()` reading
`$GLOBALS['TYPO3_CONF_VARS']['SYS']['encryptionKey']`. The tell-tale traits:

- It fires only on **one matrix cell** (seen on PHP 8.2 × TYPO3 `^14.3`), only on
  the cold CI container — **not reproducible locally**, and the test **passes in
  isolation** and in a functional-only run.
- The warning originates inside `parent::setUp()`'s container build, not in your
  own test body.

**Cause:** realising the container makes TYPO3 core reset and repopulate
`$GLOBALS['TYPO3_CONF_VARS']` mid-build; a service instantiated during that window
calls `HashService::hmac()` while `['SYS']['encryptionKey']` is momentarily unset.
It is benign — production's error handler suppresses it, and the functional test
runner sets `errorHandler=''`, so only `failOnWarning=true` turns it into a failure.

**Why the obvious fixes don't work:** the build clears the global itself, so pinning
`encryptionKey` or using `#[BackupGlobals(false)]` doesn't help; the warning fires
inside `parent::setUp()`, so an in-body `try` can't catch it; `#[WithoutErrorHandler]`
works but is too broad (an AI reviewer will rightly flag it — it disables *all*
error-to-exception conversion for the test).

**Fix:** wrap the `parent::setUp()` call in a **scoped** `set_error_handler` that
suppresses *only* this specific warning, and restore it **inside the same method**
so the handler stack stays balanced (a set-in-`setUp` / restore-in-`tearDown` split
trips `failOnRisky`):

```php
protected function setUp(): void
{
    // Benign core-boot warning on PHP 8.2 × TYPO3 ^14.3 cold CI containers:
    // building the DI container transiently unsets ['SYS']['encryptionKey']
    // while HashService::hmac() reads it. Suppress ONLY that warning and
    // delegate everything else back to the handler that was active (PHPUnit's),
    // so failOnWarning still catches unrelated warnings during parent::setUp().
    $previous = set_error_handler(
        static function (int $errno, string $errstr, string $errfile, int $errline) use (&$previous): bool {
            // Normalise separators so the match also holds on Windows (backslash paths).
            $isBenignBootWarning = str_contains(str_replace('\\', '/', $errfile), 'Crypto/HashService.php')
                && (str_contains($errstr, 'TYPO3_CONF_VARS')
                    || str_contains($errstr, 'array offset')      // "…array offset on null"
                    || str_contains($errstr, 'Undefined array key'));

            if ($isBenignBootWarning) {
                return true; // swallow only this one
            }

            // Not ours: hand back to the previously-registered (PHPUnit) handler so
            // real warnings still fail the test; false only if there was none.
            return $previous !== null
                ? (bool) $previous($errno, $errstr, $errfile, $errline)
                : false;
        },
        \E_WARNING,
    );

    try {
        parent::setUp();
    } finally {
        restore_error_handler();
    }

    // ... rest of setUp ...
}
```

The delegation is what keeps the guard honest: the matched benign warning returns
`true` (swallowed), but every other warning is handed back to the handler that was
active — PHPUnit's — so `failOnWarning` still catches real issues during
`parent::setUp()`. (Returning `false` there instead would fall through to PHP's
*internal* handler, silently blinding `failOnWarning` for that window.) Capture the
previous handler by reference so the closure can delegate to it, and match on both
`errfile` (`Crypto/HashService.php`) **and** `errstr` to keep the guard narrow.

## GD/Imagick Extension Guard

Tests involving image processing (thumbnails, resizing, format conversion) must check for the GD or Imagick extension. CI environments may not have image libraries installed.

```php
protected function setUp(): void
{
    parent::setUp();

    if (!extension_loaded('gd') && !extension_loaded('imagick')) {
        self::markTestSkipped('GD or Imagick extension required for image processing tests.');
    }
}
```

For tests that specifically need GD (e.g., testing GD-specific behavior):

```php
if (!extension_loaded('gd')) {
    self::markTestSkipped('GD extension not available.');
}
```

**Where this matters:**
- `ImageService` tests
- Thumbnail generation tests
- Image dimension/metadata extraction
- Any class wrapping `GdImage` or Imagick objects

## Root User Guard for Permission Tests

Tests that use `chmod(0o000)` to simulate unreadable/unwritable files will always pass when running as root (UID 0), because root bypasses filesystem permissions. Docker CI containers often run as root.

```php
if (function_exists('posix_geteuid') && posix_geteuid() === 0) {
    self::markTestSkipped('Cannot test unreadable files when running as root.');
}
```

**Full pattern in context:**

```php
#[Test]
public function throwsExceptionForUnreadableFile(): void
{
    if (function_exists('posix_geteuid') && posix_geteuid() === 0) {
        self::markTestSkipped('Cannot test unreadable files when running as root.');
    }

    $path = $this->tempDir . '/unreadable.txt';
    file_put_contents($path, 'data');
    chmod($path, 0o000);

    $this->expectException(\RuntimeException::class);
    $this->subject->readFile($path);
}
```

**Where this matters:**
- Tests that verify error handling for permission-denied scenarios
- Filesystem security tests
- Configuration file access tests

## Filesystem tearDown Cleanup

Tests that create temporary files or directories MUST clean up in `tearDown()`. Use instance properties (not local variables) so `tearDown()` can always find and remove them, even when a test fails mid-execution.

### Pattern: Temp Directory Cleanup

```php
final class FileProcessorTest extends UnitTestCase
{
    private ?string $tempDir = null;

    protected function setUp(): void
    {
        parent::setUp();
        $this->tempDir = sys_get_temp_dir() . '/typo3_test_' . uniqid('', true);
        mkdir($this->tempDir, 0o777, true);
    }

    protected function tearDown(): void
    {
        if ($this->tempDir !== null && is_dir($this->tempDir)) {
            $this->removeDirectory($this->tempDir);
        }
        parent::tearDown();
    }

    private function removeDirectory(string $path): void
    {
        $items = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($path, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST,
        );
        foreach ($items as $item) {
            // Restore permissions before removal (handles chmod 0o000 tests)
            chmod($item->getPathname(), 0o777);
            $item->isDir() ? rmdir($item->getPathname()) : unlink($item->getPathname());
        }
        rmdir($path);
    }
}
```

### Key Rules

1. **Use instance properties** (`$this->tempDir`) not local variables -- `tearDown()` must access them
2. **Check for null** in `tearDown()` -- `setUp()` may not have completed
3. **Restore permissions** before removal -- files made unreadable with `chmod(0o000)` cannot be deleted otherwise
4. **Always call `parent::tearDown()`** -- TYPO3 testing framework cleanup depends on it
5. **Use `sys_get_temp_dir()`** -- never hardcode `/tmp`, it varies across platforms

### Pattern: Single Temp File Cleanup

```php
private ?string $tempFile = null;

protected function tearDown(): void
{
    if ($this->tempFile !== null && file_exists($this->tempFile)) {
        // Restore permissions in case chmod tests made it unreadable
        chmod($this->tempFile, 0o644);
        unlink($this->tempFile);
    }
    parent::tearDown();
}
```

## Recovering from Root-Owned Test Artifacts (Docker Leftovers)

A functional run inside a Docker container that runs as **root** (no `--user` flag) writes `public/typo3temp/var/tests/` (and `.Build/`, `var/`) as root. A later run on the host (or as a non-root user) then can't remove or recreate those dirs, and every test errors in `setUp()`/bootstrap:

```
TYPO3\TestingFramework\Core\Exception: Can not remove folder:
  .../public/typo3temp/var/tests/functional-XXXXXXX
Directory ".../public/typo3temp/var/tests" could not be created
```

This is a **cascade** — one permission fatal aborts the whole class, so you see N identical `setUp()` errors, not N real failures. Read the *first* one.

**Prevent:** always pass `--user "$(id -u):$(id -g)"` to `docker run` for test containers (the skill's `runTests.sh` does this on Linux; see `test-runners.md`).

**Recover** (the dirs already exist root-owned and the host can't touch them) — delete or chown via a throwaway root container, then re-run:

```bash
# Remove the root-owned test dirs
docker run --rm -v "$PWD:/app" -w /app alpine rm -rf public/typo3temp/var/tests

# ...or hand ownership of the whole tree back to your user
docker run --rm -v "$PWD:/app" -w /app alpine chown -R "$(id -u):$(id -g)" public/typo3temp
```

## PHPUnit Version Compatibility: createMock vs createStub

### AllowMockObjectsWithoutExpectations Is PHPUnit 12 Only

The `#[AllowMockObjectsWithoutExpectations]` attribute does NOT exist in PHPUnit 11, which is used in CI for PHP 8.2. Using it causes a fatal error on PHPUnit 11.

**Never use this attribute** in code that must run on PHPUnit 11 (PHP 8.2 CI environments).

### Solution: Use createStub() Instead

When a test double has no configured expectations (no `expects()` calls), use `createStub()` instead of `createMock()`:

```php
// BAD: createMock without expectations triggers PHPUnit notice
// Adding #[AllowMockObjectsWithoutExpectations] breaks PHPUnit 11
$dependency = $this->createMock(SomeInterface::class);

// GOOD: createStub() is designed for doubles without expectations
$dependency = $this->createStub(SomeInterface::class);
$dependency->method('getValue')->willReturn('test');
```

### When to Use Each

| Method | Use When | Supports expects() |
|--------|----------|-------------------|
| `createMock()` | You need to verify interactions (`expects()`, `with()`) | Yes |
| `createStub()` | You only need return values, no interaction verification | No |

### Decision Guide

```
Need to assert method was called with specific args?
├── Yes → createMock() + expects() + with()
└── No
    Need to assert call count?
    ├── Yes → createMock() + expects(self::once())
    └── No → createStub() + method()->willReturn()
```

## Acceptance Tests with DOMDocument

For testing rendered HTML output without a full TYPO3 frontend bootstrap, create acceptance tests that parse HTML with DOMDocument.

### Directory Structure

```
Tests/
├── Unit/              # Pure logic, no TYPO3 bootstrap
├── Functional/        # TYPO3 bootstrap, database
└── Acceptance/        # HTML output verification via DOMDocument
```

### Pattern: DOMDocument-Based HTML Verification

```php
<?php

declare(strict_types=1);

namespace Vendor\Extension\Tests\Acceptance;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class RenderedOutputTest extends TestCase
{
    #[Test]
    public function renderedHtmlContainsExpectedStructure(): void
    {
        $html = $this->renderTemplate('EXT:my_ext/Resources/Private/Templates/List.html', [
            'items' => [['title' => 'Test Item']],
        ]);

        $doc = new \DOMDocument();
        @$doc->loadHTML($html, LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        $xpath = new \DOMXPath($doc);

        $items = $xpath->query('//ul[@class="item-list"]/li');
        self::assertNotFalse($items);
        self::assertSame(1, $items->length);
        self::assertSame('Test Item', trim($items->item(0)->textContent));
    }
}
```

**When to use acceptance tests:**
- Verifying ViewHelper output structure
- Testing that templates render expected DOM elements
- Checking accessibility attributes in rendered HTML
- Validating SEO meta tags in output

**When NOT to use (use functional tests instead):**
- Tests that need TYPO3 database
- Tests that need TypoScript configuration
- Tests that need site/routing configuration

## Infection Mutation Testing Configuration

When setting up Infection for a TYPO3 extension that uses `.Build/` for vendor dependencies:

```json5
{
    "$schema": ".Build/vendor/infection/infection/resources/schema.json",
    "source": {
        "directories": ["Classes"]
    },
    "timeout": 30,
    "mutators": {
        "@default": true
    }
}
```

**Key difference from generic setup:** The `$schema` path uses `.Build/vendor/` (TYPO3 convention) rather than `vendor/`. This enables IDE autocompletion and validation for the config file.

See [Mutation Testing](mutation-testing.md) for full configuration with log paths, MSI thresholds, and mutator customization.
