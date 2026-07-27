# Quality Tools for TYPO3 Development

Automated code quality and static analysis tools for TYPO3 extensions.

## Overview

- **PHPStan**: Static analysis for type safety and bugs
- **Rector**: Automated code refactoring and modernization
- **php-cs-fixer**: Code style enforcement (PSR-12, TYPO3 CGL)
- **phplint**: PHP syntax validation

## Centralized CI Tooling: netresearch/typo3-ci-workflows

Netresearch TYPO3 extensions use a centralized dev-dependency package that provides all quality tools, shared configurations, and CI infrastructure.

### What typo3-ci-workflows provides

**Dev-dependencies (transitively installed):**
- `phpstan/phpstan` + `phpstan-strict-rules` + `phpstan-deprecation-rules` + `phpstan-phpunit`
- `saschaegerer/phpstan-typo3` (TYPO3-aware PHPStan rules)
- `phpat/phpat` (architecture testing)
- `ergebnis/phpstan-rules` (additional strict rules)
- `friendsofphp/php-cs-fixer` (code style)
- `rector/rector` + `ssch/typo3-rector` (automated refactoring)
- `captainhook/captainhook` (git hooks)
- `phpunit/phpunit` + `typo3/testing-framework`
- `infection/infection` (mutation testing)
- `giorgiosironi/eris` (property-based/fuzz testing)

**Shared configurations:**
- `config/phpstan/phpstan.neon` — shared parameters (level 10, excludePaths, bootstrapFiles, common ignoreErrors)
- `config/phpstan/includes-no-extension-installer.neon` — explicit PHPStan plugin includes for `--no-plugins` environments (captainhook + git worktree)
- `.php-cs-fixer.php` — shared code style rules
- `captainhook.json` — pre-commit hook configuration

**Template scripts:**
- `assets/Build/Scripts/runTests.sh.dist` — generic test runner (unit, functional, fuzz, mutation, phpstan, cgl, rector)

### Installation (recommended)

```bash
composer require --dev netresearch/typo3-ci-workflows
```

This single package replaces individual `composer require --dev` for all quality tools.

### PHPStan Configuration with typo3-ci-workflows

Create `Build/phpstan.neon`:

```neon
includes:
    - %currentWorkingDirectory%/.Build/vendor/netresearch/typo3-ci-workflows/config/phpstan/phpstan.neon
    - phpstan-baseline.neon

parameters:
    paths:
        - ../Classes
        - ../Tests/Architecture
    tmpDir: ../.Build/var/phpstan
    ignoreErrors:
        # Extension-specific ignores only — shared ignores are in the included config
        -
            message: '#no value type specified in iterable type array#'
            path: ../Classes/SomeFile.php

services:
    -
        class: Vendor\Extension\Tests\Architecture\ArchitectureTest
        tags:
            - phpat.test
```

**Important notes:**
- The shared `phpstan.neon` sets `level: 10`, `reportUnmatchedIgnoredErrors: true`, common excludePaths, and bootstrapFiles
- Only add extension-specific ignoreErrors in your local config; shared ignores (ergebnis, test infrastructure, upgrade wizards) are handled centrally
- Always regenerate baseline after changing config: `.Build/bin/phpstan analyse -c Build/phpstan.neon --generate-baseline Build/phpstan-baseline.neon`

### captainhook + git worktree + explicit PHPStan includes

When using git worktrees with bare repositories, `composer install --no-plugins` is needed for the captainhook workaround. This means `phpstan/extension-installer` cannot auto-register plugins. Use the explicit includes file instead:

```neon
includes:
    - %currentWorkingDirectory%/.Build/vendor/netresearch/typo3-ci-workflows/config/phpstan/includes-no-extension-installer.neon
    - phpstan-baseline.neon
```

This file explicitly lists all PHPStan plugin neon files that `extension-installer` would auto-load.

**Do NOT mix both approaches** — if `extension-installer` is active AND you include `includes-no-extension-installer.neon`, PHPStan will error about duplicate includes.

#### Symptom when the includes are missing (`InvocationStubber::with()`)

If PHPStan runs in such a worktree **without** the explicit-includes config — e.g. after a `composer install --no-scripts` fallback, or in an extension that ships no `phpstan.no-plugins.neon` to point at — `phpstan-phpunit` is not active and every ordinary mock chain trips a false error:

```text
Call to an undefined method PHPUnit\Framework\MockObject\InvocationStubber::with().
Cannot call method willReturn() on mixed.
```

on lines like `$this->createMock(X::class)->method('m')->with(...)->willReturn(...)`. These are **not real** and are **not caused by your change** — the tell is that only a handful of files show them while hundreds of other mock-using tests pass.

Prefer the `--no-plugins` + explicit-includes approach above. When the repo has no no-plugins config to point PHPStan at, **verify with a controlled stash**:

```bash
git stash push -u          # revert your change -> clean tree
# run PHPStan -> note the identical baseline error set (same untouched test files)
git stash pop
# re-run PHPStan -> confirm your change keeps the count unchanged (adds zero)
```

CI installs in a real (non-worktree) checkout where the hooks install cleanly and `extension-installer` registers the plugins, so these errors never appear there — **CI is authoritative** for the full-tree PHPStan result.

### If NOT using typo3-ci-workflows

For extensions that cannot use the centralized package, install tools individually:

```bash
composer require --dev \
    phpstan/phpstan \
    phpstan/phpstan-strict-rules \
    phpstan/phpstan-deprecation-rules \
    phpstan/phpstan-phpunit \
    saschaegerer/phpstan-typo3 \
    ergebnis/phpstan-rules \
    friendsofphp/php-cs-fixer \
    rector/rector \
    ssch/typo3-rector
```

## PHPStan

### Configuration (standalone, without typo3-ci-workflows)

Create `Build/phpstan.neon`:

```neon
includes:
    - vendor/phpstan/phpstan-strict-rules/rules.neon
    - vendor/saschaegerer/phpstan-typo3/extension.neon

parameters:
    level: max  # Level 10 - maximum strictness
    paths:
        - Classes
        - Tests
    excludePaths:
        - Tests/Acceptance/_output/*
    reportUnmatchedIgnoredErrors: true
    checkGenericClassInNonGenericObjectType: false
    checkMissingIterableValueType: false
```

### Running PHPStan

```bash
# Via runTests.sh
Build/Scripts/runTests.sh phpstan

# Directly
.Build/bin/phpstan analyse -c Build/phpstan.neon

# With baseline (ignore existing errors)
.Build/bin/phpstan analyse -c Build/phpstan.neon --generate-baseline Build/phpstan-baseline.neon

# Clear cache
rm -rf .Build/var/phpstan
```

### PHPStan Rule Levels

**Level 0-10** (use `max` for level 10): Increasing strictness
- **Level 0**: Basic checks (undefined variables, unknown functions)
- **Level 5**: Type checks, unknown properties, unknown methods
- **Level 9**: Strict mixed types, unused parameters
- **Level 10 (max)**: Maximum strictness - explicit mixed types, pure functions

**Recommendation**:
- **New projects**: Start with level 5, aim for level 10 (max)
- **Existing extensions**: Level 8 is practical - levels 9/10 require extensive type annotations for `$GLOBALS`, TCA, and dynamic TYPO3 patterns

**Why Level 8 for existing extensions?**
- Strict boolean conditions and nullability checks
- Avoids excessive ignoreErrors for TYPO3's inherently untyped patterns
- Good balance between strictness and maintainability

**Why Level 10 for new projects?**
- Enforces explicit type declarations (`mixed` must be declared, not implicit)
- Catches more potential bugs at development time
- Aligns with TYPO3 13 strict typing standards (`declare(strict_types=1)`)
- Required for PHPStan Level 10 compliant extensions

### Ignoring Errors

```php
/** @phpstan-ignore-next-line */
$value = $this->legacyMethod();

// Or in neon file
parameters:
    ignoreErrors:
        - '#Call to an undefined method.*::getRepository\(\)#'
```

### TYPO3-Specific ignoreErrors (Level 8)

For existing TYPO3 extensions, these ignoreErrors handle common TYPO3 patterns:

```neon
parameters:
    level: 8
    ignoreErrors:
        # TYPO3 TCA/GLOBALS access patterns - inherently untyped
        - '#Cannot access offset .* on mixed#'
        - '#Parameter .* of function array_key_exists expects array, mixed given#'
        - '#Parameter .* of function array_merge expects array, mixed given#'
        - '#Parameter .* of function in_array expects array, mixed given#'
        - '#Argument of an invalid type mixed supplied for foreach#'
        - '#Cannot cast mixed to int#'
        - '#Cannot cast mixed to string#'
        - '#Possibly invalid array key type#'

        # Legacy code array type specifications
        - '#no value type specified in iterable type array#'
        - '#return type has no value type specified in iterable type#'
        - '#type has no value type specified in iterable type#'

        # TYPO3 v12/v13 API changes - during migration
        - '#deprecated class TYPO3\\CMS\\Frontend\\Controller\\TypoScriptFrontendController#'
        - '#Call to an undefined method TYPO3\\CMS\\Core\\Database\\Query\\QueryBuilder::execute#'

        # Doctrine DBAL 4.x type parameter changes (int -> ParameterType enum)
        - '~Parameter \\#2 \\$type of method .* expects .*, int given~'

        # PHPStan strict rules violations in legacy code
        - '#Construct empty\\(\\) is not allowed#'
        - '#Strict comparison using .* will always evaluate to#'
```

### CI Workflow Paths with Build/ Configuration

When configs are in Build/, update CI workflows:

```yaml
# .github/workflows/ci.yml
- name: Run PHPStan
  run: vendor/bin/phpstan analyse -c Build/phpstan.neon --no-progress

- name: Run PHP-CS-Fixer
  run: vendor/bin/php-cs-fixer fix --config=Build/php-cs-fixer.php --dry-run --diff

- name: Run PHPCS
  run: vendor/bin/phpcs --standard=Build/phpcs.xml
```

**Path resolution note**: PHPStan's `paths:` and `includes:` are resolved relative to the config file location. When config is in Build/:

```neon
# Build/phpstan.neon
includes:
    - ../vendor/phpstan/phpstan-strict-rules/rules.neon  # <- Note ../
parameters:
    paths:
        - ../Classes/     # <- Note ../
        - ../Tests/
    excludePaths:
        - ../vendor/*
        - ../.Build/*
```

### PHPStan in Tests - Common Patterns

When writing tests that validate runtime behavior guaranteed by PHPDoc types, PHPStan Level 9+ may report "alreadyNarrowedType" errors. These tests are still valuable as they verify implementation matches type declarations.

**Common Test-Specific Ignore Identifiers:**

| Identifier | When to Use |
|------------|-------------|
| `staticMethod.alreadyNarrowedType` | `assertTrue()`, `assertFalse()`, `assertIsArray()` when PHPStan knows the result |
| `function.alreadyNarrowedType` | `is_subclass_of()`, `is_array()`, `is_string()` when type is known from PHPDoc |

**Example - Testing Contract Guarantees:**

```php
#[Test]
public function allDiscoveredClassesExtendBaseClass(): void
{
    $registry = new MatcherRegistry();
    $result = $registry->getMatcherClasses(); // Returns array<class-string<AbstractCoreMatcher>>

    foreach ($result as $matcherClass) {
        // PHPStan knows this is always true from PHPDoc, but test validates runtime behavior
        // @phpstan-ignore staticMethod.alreadyNarrowedType
        self::assertTrue(
            is_subclass_of($matcherClass, AbstractCoreMatcher::class), // @phpstan-ignore function.alreadyNarrowedType
            sprintf('%s should extend AbstractCoreMatcher', $matcherClass)
        );
    }
}

#[Test]
public function allConfigurationsAreArrays(): void
{
    $registry = new MatcherRegistry();
    $configurations = $registry->getMatcherConfigurations(); // Returns array<class-string, array<string, mixed>>

    foreach ($configurations as $matcherClass => $configuration) {
        // @phpstan-ignore staticMethod.alreadyNarrowedType
        self::assertIsArray(
            $configuration,
            sprintf('Configuration for %s should be an array', $matcherClass)
        );
    }
}
```

**When to Use These Ignores:**
- Tests validating that implementation matches PHPDoc contracts
- Tests checking class hierarchies or type relationships
- Tests ensuring configuration structures are correct
- Not in production code (fix the types instead)
- Not in tests where the assertion actually could fail

**Placement Rules:**
- **Next-line comment** (`// @phpstan-ignore ...`): Applies to the **next** line
- **Inline comment**: Applies to the **same** line where it appears
- Multiple identifiers: Separate with comma (`// @phpstan-ignore id1, id2`)

### TYPO3-Specific Rules

```php
// PHPStan understands TYPO3 classes
$queryBuilder = GeneralUtility::makeInstance(ConnectionPool::class)
    ->getQueryBuilderForTable('pages');
// PHPStan knows this returns QueryBuilder

// Detects TYPO3 API misuse
TYPO3\CMS\Core\Utility\GeneralUtility::makeInstance(MyService::class);
// Checks if MyService is a valid class
```

## Rector

### Installation (if not using typo3-ci-workflows)

```bash
composer require --dev rector/rector ssch/typo3-rector
```

### Configuration

Create `rector.php`:

```php
<?php

declare(strict_types=1);

use Rector\Config\RectorConfig;
use Rector\Set\ValueObject\LevelSetList;
use Rector\Set\ValueObject\SetList;
use Ssch\TYPO3Rector\Set\Typo3SetList;

return RectorConfig::configure()
    ->withPaths([
        __DIR__ . '/Classes',
        __DIR__ . '/Tests',
    ])
    ->withSkip([
        __DIR__ . '/Tests/Acceptance/_output',
    ])
    ->withPhpSets(php82: true)
    ->withSets([
        LevelSetList::UP_TO_PHP_82,
        SetList::CODE_QUALITY,
        SetList::DEAD_CODE,
        SetList::TYPE_DECLARATION,
        Typo3SetList::TYPO3_13,
    ]);
```

### Running Rector

```bash
# Dry run (show changes)
Build/Scripts/runTests.sh rector

# Apply changes
Build/Scripts/runTests.sh rector:fix

# Directly
.Build/bin/rector process --dry-run
.Build/bin/rector process
```

### Common Refactorings

**TYPO3 API Modernization**:
```php
// Before
$GLOBALS['TYPO3_DB']->exec_SELECTgetRows('*', 'pages', 'uid=1');

// After (Rector auto-refactors)
GeneralUtility::makeInstance(ConnectionPool::class)
    ->getConnectionForTable('pages')
    ->select(['*'], 'pages', ['uid' => 1])
    ->fetchAllAssociative();
```

**Type Declarations**:
```php
// Before
public function process($data)
{
    return $data;
}

// After
public function process(array $data): array
{
    return $data;
}
```

## php-cs-fixer

### Installation (if not using typo3-ci-workflows)

```bash
composer require --dev friendsofphp/php-cs-fixer
```

### Configuration

Create `Build/.php-cs-fixer.php`:

```php
<?php

declare(strict_types=1);

$finder = (new PhpCsFixer\Finder())
    ->in(__DIR__ . '/../Classes')
    ->in(__DIR__ . '/../Tests')
    ->exclude('_output');

return (new PhpCsFixer\Config())
    ->setRules([
        '@PSR12' => true,
        '@PhpCsFixer' => true,
        'array_syntax' => ['syntax' => 'short'],
        'concat_space' => ['spacing' => 'one'],
        'declare_strict_types' => true,
        'ordered_imports' => ['sort_algorithm' => 'alpha'],
        'no_unused_imports' => true,
        'single_line_throw' => false,
        'phpdoc_align' => false,
        'phpdoc_no_empty_return' => false,
        'phpdoc_summary' => false,
    ])
    ->setRiskyAllowed(true)
    ->setFinder($finder);
```

### Running php-cs-fixer

```bash
# Check only (dry run)
Build/Scripts/runTests.sh cgl

# Fix files
Build/Scripts/runTests.sh cgl:fix

# Directly
.Build/bin/php-cs-fixer fix --config=Build/.php-cs-fixer.php --dry-run --diff
.Build/bin/php-cs-fixer fix --config=Build/.php-cs-fixer.php
```

### Common Rules

```php
// array_syntax: short
$array = [1, 2, 3]; // correct
$array = array(1, 2, 3); // incorrect

// concat_space: one
$message = 'Hello ' . $name; // correct
$message = 'Hello '.$name; // incorrect

// declare_strict_types
<?php

declare(strict_types=1); // Required at top of file

// ordered_imports
use Vendor\Extension\Domain\Model\Product; // Alphabetical
use Vendor\Extension\Domain\Repository\ProductRepository;
```

## phplint

### Installation (if not using typo3-ci-workflows)

```bash
composer require --dev overtrue/phplint
```

### Configuration

Create `.phplint.yml`:

```yaml
path: ./
jobs: 10
cache: var/cache/phplint.cache
exclude:
    - vendor
    - var
    - .Build
extensions:
    - php
```

### Running phplint

```bash
# Lint all PHP files
vendor/bin/phplint

# Via runTests.sh
Build/Scripts/runTests.sh lint

# Specific directory
vendor/bin/phplint Classes/
```

## Composer Script Integration

With typo3-ci-workflows, use `Build/Scripts/runTests.sh` as the entry point:

```json
{
    "scripts": {
        "ci:cgl": "Build/Scripts/runTests.sh cgl:fix",
        "ci:test:php:cgl": "Build/Scripts/runTests.sh cgl",
        "ci:test:php:phpstan": "Build/Scripts/runTests.sh phpstan",
        "ci:test:php:unit": "Build/Scripts/runTests.sh unit",
        "ci:test:php:functional": "Build/Scripts/runTests.sh functional",
        "ci:test:php:fuzz": "Build/Scripts/runTests.sh fuzz",
        "ci:mutation": "Build/Scripts/runTests.sh mutation",
        "ci:test:php:all": [
            "@ci:test:php:unit",
            "@ci:test:php:functional"
        ]
    }
}
```

> **Security Note**: `composer audit` checks for known security vulnerabilities in dependencies. Run this regularly and especially before releases.

## Pre-commit Hook

With typo3-ci-workflows, captainhook handles pre-commit hooks automatically. Configure in `Build/captainhook.json`.

For manual setup, create `.git/hooks/pre-commit`:

```bash
#!/bin/sh

echo "Running quality checks..."

# Lint
vendor/bin/phplint || exit 1

# PHPStan
vendor/bin/phpstan analyze --configuration Build/phpstan.neon --error-format=table --no-progress || exit 1

# Code style
vendor/bin/php-cs-fixer fix --config Build/php-cs-fixer.php --dry-run --diff || exit 1

echo "All checks passed"
```

## CI/CD Integration

### GitHub Actions

For Netresearch extensions using typo3-ci-workflows, CI is provided by reusable workflows. See the [typo3-ci-workflows repository](https://github.com/netresearch/typo3-ci-workflows) for workflow configuration.

For standalone CI:

```yaml
quality:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: shivammathur/setup-php@v2
      with:
        php-version: '8.4'  # Use latest PHP for quality tools
    - run: composer install
    - run: composer ci:test:php:lint
    - run: composer ci:test:php:phpstan
    - run: composer ci:test:php:cgl
    - run: composer ci:test:php:rector
    - run: composer ci:test:php:security
```

## IDE Integration

### PHPStorm

1. **PHPStan**: Settings -> PHP -> Quality Tools -> PHPStan
2. **php-cs-fixer**: Settings -> PHP -> Quality Tools -> PHP CS Fixer
3. **File Watchers**: Auto-run on file save

### VS Code

```json
{
    "php.validate.executablePath": "/usr/bin/php",
    "phpstan.enabled": true,
    "phpstan.configFile": "Build/phpstan.neon",
    "php-cs-fixer.onsave": true,
    "php-cs-fixer.config": "Build/php-cs-fixer.php"
}
```

## Best Practices

1. **Use typo3-ci-workflows**: Centralized tooling ensures consistency across extensions
2. **PHPStan Level 10**: Aim for `level: max` in modern TYPO3 13+ projects
3. **Baseline for Legacy**: Use baselines to track existing issues during migration
4. **Security Audits**: Run `composer audit` regularly and in CI
5. **Auto-fix in CI**: Run fixes automatically, fail on violations
6. **Consistent Rules**: Share config via typo3-ci-workflows
7. **Pre-commit Checks**: Use captainhook for lint, PHPStan, CGL, security
8. **Latest PHP**: Run quality tools with latest PHP version (8.4+)
9. **Regular Updates**: Keep tools and rules updated

## Mutation Testing with Infection PHP

Mutation testing verifies that your tests actually catch bugs, not just execute code paths. Infection PHP introduces small changes (mutants) to source code and checks whether tests fail.

### Configuration (infection.json5)

Create `infection.json5` in the project root:

```json5
{
    "$schema": "https://raw.githubusercontent.com/infection/infection/master/resources/schema.json",
    "source": {
        "directories": [
            "Classes"
        ]
    },
    "phpUnit": {
        "configDir": "Build/phpunit",
        "customPath": ".Build/bin/phpunit"
    },
    "logs": {
        "text": ".Build/var/infection/infection.log",
        "html": ".Build/var/infection/infection.html",
        "summary": ".Build/var/infection/summary.log"
    },
    "tmpDir": ".Build/var/infection",
    "mutators": {
        "@default": true
    },
    "minMsi": 30,
    "minCoveredMsi": 60
}
```

**Key configuration details:**

- **`source.directories`**: Point at `Classes` (your production code). Never include `Tests/`.
- **`phpUnit.configDir`**: Directory containing `UnitTests.xml` (Infection auto-detects PHPUnit config files there).
- **`phpUnit.customPath`**: Path to the PHPUnit binary. When using `typo3-ci-workflows`, the binary is at `.Build/bin/phpunit` (not `vendor/bin/phpunit`).
- **`minMsi` / `minCoveredMsi`**: Mutation Score Indicator thresholds. Start conservatively (30% MSI, 60% covered MSI) and increase as test coverage improves. Aiming for 80%+ covered MSI is a good long-term target.

### Realistic MSI Thresholds

| Stage | minMsi | minCoveredMsi | Notes |
|-------|--------|---------------|-------|
| Initial setup | 30 | 60 | Baseline for new extensions |
| Growing coverage | 50 | 70 | After addressing low-hanging fruit |
| Mature test suite | 70 | 80 | Well-tested extension |

### Composer Script Integration

```json
{
    "scripts": {
        "ci:test:php:mutation": [
            "infection --configuration=infection.json5 --threads=4"
        ]
    }
}
```

### Installation

When using `netresearch/typo3-ci-workflows`, `infection/infection` is provided transitively -- no separate `composer require` is needed. For standalone setups:

```bash
composer require --dev infection/infection
```

### Running Mutation Tests

```bash
# Via Composer script
composer ci:test:php:mutation

# Directly with thread control
infection --configuration=infection.json5 --threads=4

# Only mutate specific directories
infection --configuration=infection.json5 --filter=Classes/Domain

# Show escaped mutants (mutants that were NOT caught by tests)
infection --configuration=infection.json5 --show-mutations
```

## Resources

- [PHPStan Documentation](https://phpstan.org/user-guide/getting-started)
- [Rector Documentation](https://getrector.com/documentation)
- [PHP CS Fixer Documentation](https://github.com/PHP-CS-Fixer/PHP-CS-Fixer)
- [TYPO3 Coding Guidelines](https://docs.typo3.org/m/typo3/reference-coreapi/main/en-us/CodingGuidelines/)
- [netresearch/typo3-ci-workflows](https://github.com/netresearch/typo3-ci-workflows)
- [Infection PHP Documentation](https://infection.github.io/guide/)
