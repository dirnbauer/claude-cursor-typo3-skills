# TYPO3 Coding Guidelines

**Source:** TYPO3 Core API Reference - Coding Guidelines
**Purpose:** TYPO3-specific deltas from PSR-12, not a PSR-12 restatement.

TYPO3 follows [PSR-12: Extended Coding Style](https://www.php-fig.org/psr/psr-12/) and [PSR-1: Basic Coding Standard](https://www.php-fig.org/psr/psr-1/) for indentation, brace placement, naming (camelCase methods/vars, UpperCamelCase classes, SCREAMING_SNAKE_CASE constants), array syntax, and namespace/use-statement layout — read the specs for those rules. This file covers only where TYPO3 differs from or adds to PSR-12, plus one convention PSR-12 is silent on: TYPO3 prefers single quotes for non-interpolated strings, double quotes only when interpolating (`"Hello, {$name}!"`).

## PHP 8.4 Explicit Nullable Types (Critical)

PHP 8.4 deprecates **implicit nullable parameters**. Parameters with `null` default values MUST use explicit nullable syntax.

**Search Pattern:**
```bash
grep -rn '\(.*\$[a-zA-Z_]* = null\)' Classes/ | grep -v '?[a-zA-Z_\\]*\s*\$'
```

**Severity:** High (E_DEPRECATED in PHP 8.4, Error in PHP 9.0)

```php
// ❌ Wrong: Implicit nullable (deprecated in PHP 8.4)
public function process(string $data = null): void {}

// ✅ Right: Explicit nullable type
public function process(?string $data = null): void {}
```

**Rector Rule:** Use `NullableTypeDeclarationRector` to auto-fix.

## PHPStan Level 10 and Baseline Hygiene

TYPO3 extensions target **PHPStan level 10** (strictest). **Critical Rule:** new code must never add entries to `phpstan-baseline.neon` — the baseline exists only for legacy code not yet refactored.

```bash
# Verify a change didn't grow the baseline
git diff HEAD~1 Build/phpstan-baseline.neon
# count: 8 -> count: 9 means you added 1 new error — fix it, don't commit the baseline
```

The most common level-10 failure is casting `mixed` (TypoScript config, user input, API responses) without a type guard:

```php
// ❌ Wrong: PHPStan "Cannot cast mixed to int"
$maxSize = (int) ($conf['maxSize'] ?? 0);

// ✅ Right: type-guard before casting
$value = $conf['maxSize'] ?? 0;
$maxSize = is_numeric($value) ? (int) $value : 0;
```

Run `composer ci:php:stan` before every commit and re-check the baseline diff.

## php-cs-fixer: ext_emconf.php Exclusion (Critical)

**Problem:** If `declare_strict_types` is enabled in php-cs-fixer, it adds `declare(strict_types=1);` to every PHP file, including `ext_emconf.php`. TYPO3's Extension Manager requires `ext_emconf.php` to NOT have a strict-types declaration — it is processed in a special context during install/update and strict types can break that.

**Solution:** Always exclude it:
```php
$config->getFinder()
    ->in('Classes')
    ->in('Configuration')
    ->in('Tests')
    ->notName('ext_emconf.php');  // CRITICAL: Must exclude
```

**CI Failure Pattern:** CGL failures with exit code 8 touching `declare(strict_types=1)` in `ext_emconf.php` mean this exclusion is missing.

Use the `typo3/coding-standards` package for a current base config; see `assets/Build/php-cs-fixer/php-cs-fixer.php` for the template this skill ships.

## CGL vs PHPStan Conflict Resolution

When CGL (php-cs-fixer) and PHPStan disagree, **CGL is authoritative for code style**.

**Static Assertions in PHPUnit 11:** CGL enforces `self::assertEquals()`, but PHPUnit 11 marks assertion methods non-static, so PHPStan reports a false positive. Suppress PHPStan, not CGL:
```yaml
# Build/phpstan/phpstan.neon
parameters:
    ignoreErrors:
        -
            message: '#Call to an undefined static method .+::(assert[A-Z]\w*|fail|markTest\w*)#'
            reportUnmatched: false
```

`reportUnmatched: false` because on TYPO3 12.4 with testing-framework v8 (PHPUnit 10) the pattern has no matches — this stays safe across the 12.4/13.4/14.0 matrix.

## Required File Header

TYPO3 extension source files use this license header (GPL-2.0-or-later, matching TYPO3 core). `ext_emconf.php` is the one exception — no `declare(strict_types=1)`, see above.
```php
<?php
declare(strict_types=1);

/*
 * This file is part of the TYPO3 CMS project.
 *
 * It is free software; you can redistribute it and/or modify it under
 * the terms of the GNU General Public License, either version 2
 * of the License, or any later version.
 *
 * For the full copyright and license information, please read the
 * LICENSE.txt file that was distributed with this source code.
 *
 * The TYPO3 project - inspiring people to share!
 */
```

## Conformance Checklist

- [ ] `declare(strict_types=1)` at top of all PHP files (except `ext_emconf.php`)
- [ ] PHP 8.4: no implicit nullable parameters
- [ ] PHPStan level 10 passes; no new `phpstan-baseline.neon` entries
- [ ] Type-guards before casting mixed values (`is_numeric`, `is_string`, `is_array`)
- [ ] php-cs-fixer excludes `ext_emconf.php` via `->notName('ext_emconf.php')`
- [ ] CGL vs PHPStan conflicts resolved in favor of CGL
