# TYPO3 Extension Best Practices

**Source:** TYPO3 Best Practices (Tea Extension) and Core API Standards
**Purpose:** Real-world patterns and organizational best practices for TYPO3 extensions

## Project Structure

### Complete Extension Layout

```
my_extension/
├── .ddev/                          # DDEV configuration
│   └── config.yaml
├── .github/                        # GitHub Actions CI/CD
│   └── workflows/
│       └── tests.yml
├── Build/                          # Build tools and configs
│   ├── phpunit/
│   │   ├── UnitTests.xml
│   │   └── FunctionalTests.xml
│   └── Scripts/
│       └── runTests.sh
├── Classes/                        # PHP source code
│   ├── Controller/
│   ├── Domain/
│   │   ├── Model/
│   │   └── Repository/
│   ├── Service/
│   ├── Utility/
│   ├── EventListener/
│   └── ViewHelper/
├── Configuration/                  # TYPO3 configuration
│   ├── Backend/
│   │   └── Modules.php
│   ├── Services.yaml
│   ├── TCA/
│   ├── TypoScript/
│   │   ├── setup.typoscript
│   │   └── constants.typoscript
│   └── Sets/                       # TYPO3 v13+
│       └── MySet/
│           └── config.yaml
├── Documentation/                  # RST documentation
│   ├── Index.rst
│   ├── guides.xml                  # Modern (replaces Settings.cfg)
│   ├── Introduction/
│   ├── Installation/
│   ├── Configuration/
│   ├── Developer/
│   └── Editor/
├── Resources/
│   ├── Private/
│   │   ├── Language/
│   │   │   ├── locallang.xlf
│   │   │   └── de.locallang.xlf
│   │   ├── Layouts/
│   │   ├── Partials/
│   │   └── Templates/
│   └── Public/
│       ├── Css/
│       ├── Icons/
│       ├── Images/
│       └── JavaScript/
├── Tests/
│   ├── Unit/
│   └── Functional/
│       └── Fixtures/
├── Build/
│   ├── playwright.config.ts      # Playwright E2E configuration
│   ├── package.json              # Node dependencies
│   ├── .nvmrc                    # Node version (>=22.18)
│   ├── phpunit/
│   │   ├── UnitTests.xml
│   │   └── FunctionalTests.xml
│   ├── Scripts/
│   │   └── runTests.sh
│   └── tests/
│       └── playwright/           # Playwright E2E tests
│           ├── config.ts
│           ├── e2e/
│           ├── accessibility/
│           ├── fixtures/
│           └── helper/
├── .editorconfig                   # Editor configuration
├── .gitattributes                  # Git attributes
├── .gitignore                      # Git ignore rules
├── .php-cs-fixer.dist.php          # PHP CS Fixer config
├── composer.json                   # Composer configuration
├── ext_emconf.php                  # Extension metadata
├── ext_localconf.php               # Global configuration
├── LICENSE                         # License file
├── phpstan.neon                    # PHPStan configuration
└── README.md                       # Project README
```

## Best Practices by Category

### Dependency Management

**composer.json Best Practices:**

```json
{
    "name": "vendor/my-extension",
    "type": "typo3-cms-extension",
    "description": "Clear, concise extension description",
    "license": "GPL-2.0-or-later",
    "authors": [
        {
            "name": "Author Name",
            "email": "author@example.com",
            "role": "Developer"
        }
    ],
    "require": {
        "php": "^8.1",
        "typo3/cms-core": "^12.4 || ^13.0",
        "typo3/cms-backend": "^12.4 || ^13.0",
        "typo3/cms-extbase": "^12.4 || ^13.0",
        "typo3/cms-fluid": "^12.4 || ^13.0"
    },
    "require-dev": {
        "typo3/coding-standards": "^0.7",
        "typo3/testing-framework": "^8.0",
        "phpunit/phpunit": "^10.5",
        "phpstan/phpstan": "^1.10",
        "friendsofphp/php-cs-fixer": "^3.0"
    },
    "autoload": {
        "psr-4": {
            "Vendor\\MyExtension\\": "Classes/"
        }
    },
    "autoload-dev": {
        "psr-4": {
            "Vendor\\MyExtension\\Tests\\": "Tests/"
        }
    },
    "config": {
        "vendor-dir": ".Build/vendor",
        "bin-dir": ".Build/bin",
        "sort-packages": true,
        "allow-plugins": {
            "typo3/class-alias-loader": true,
            "typo3/cms-composer-installers": true
        }
    },
    "extra": {
        "typo3/cms": {
            "extension-key": "my_extension",
            "web-dir": ".Build/Web"
        }
    }
}
```

### Code Quality Tools

**.php-cs-fixer.dist.php:**

```php
<?php
declare(strict_types=1);

$config = \TYPO3\CodingStandards\CsFixerConfig::create();
$config->getFinder()
    ->in(__DIR__ . '/Classes')
    ->in(__DIR__ . '/Configuration')
    ->in(__DIR__ . '/Tests');

return $config;
```

**phpstan.neon:**

```neon
includes:
    - .Build/vendor/phpstan/phpstan/conf/bleedingEdge.neon

parameters:
    level: 9
    paths:
        - Classes
        - Configuration
        - Tests
    excludePaths:
        - .Build
        - vendor
```

#### PHPStan Level 10 Best Practices for TYPO3

**Handling $GLOBALS['TCA'] in Tests:**

PHPStan cannot infer types for runtime-configured `$GLOBALS` arrays. Use ignore annotations:

```php
// ✅ Right: Suppress offsetAccess warnings for $GLOBALS['TCA']
/** @var array<string, mixed> $tcaConfig */
$tcaConfig = [
    'type'           => 'text',
    'enableRichtext' => true,
];
// @phpstan-ignore-next-line offsetAccess.nonOffsetAccessible
$GLOBALS['TCA']['tt_content']['columns']['bodytext']['config'] = $tcaConfig;

// ❌ Wrong: No type annotation or suppression
$GLOBALS['TCA']['tt_content']['columns']['bodytext']['config'] = [
    'type' => 'text',
]; // PHPStan error: offsetAccess.nonOffsetAccessible
```

**Factory Methods vs Property Initialization:**

Avoid uninitialized property errors in test classes:

```php
// ❌ Wrong: PHPStan warns about uninitialized property
final class MyServiceTest extends UnitTestCase
{
    private MyService $subject; // Uninitialized property

    protected function setUp(): void
    {
        parent::setUp();
        $this->subject = new MyService();
    }
}

// ✅ Right: Use factory method
final class MyServiceTest extends UnitTestCase
{
    private function createSubject(): MyService
    {
        return new MyService();
    }

    #[Test]
    public function testSomething(): void
    {
        $subject = $this->createSubject();
        // Use $subject
    }
}
```

**Type Assertions for Dynamic Arrays:**

When testing arrays modified by reference:

```php
// ❌ Wrong: PHPStan cannot verify type after modification
public function testFieldProcessing(): void
{
    $fieldArray = ['bodytext' => '<p>Test</p>'];
    $this->subject->processFields($fieldArray);

    // PHPStan error: Cannot access offset on mixed
    self::assertStringContainsString('Test', $fieldArray['bodytext']);
}

// ✅ Right: Add type assertions
public function testFieldProcessing(): void
{
    $fieldArray = ['bodytext' => '<p>Test</p>'];
    $this->subject->processFields($fieldArray);

    self::assertArrayHasKey('bodytext', $fieldArray);
    self::assertIsString($fieldArray['bodytext']);
    self::assertStringContainsString('Test', $fieldArray['bodytext']);
}
```

**Intersection Types for Mocks:**

Use intersection types for proper PHPStan analysis of mocks:

```php
// ✅ Right: Intersection type for mock
/** @var ResourceFactory&MockObject $resourceFactoryMock */
$resourceFactoryMock = $this->createMock(ResourceFactory::class);

// Alternative: @phpstan-var annotation
$resourceFactoryMock = $this->createMock(ResourceFactory::class);
/** @phpstan-var ResourceFactory&MockObject $resourceFactoryMock */
```

**Common PHPStan Suppressions for TYPO3:**

```php
// Suppress $GLOBALS['TCA'] access
// @phpstan-ignore-next-line offsetAccess.nonOffsetAccessible
$GLOBALS['TCA']['table']['columns']['field'] = $config;

// Suppress $GLOBALS['TYPO3_CONF_VARS'] access
// @phpstan-ignore-next-line offsetAccess.nonOffsetAccessible
$GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['key'] = MyClass::class;

// Suppress mixed type from legacy code
// @phpstan-ignore-next-line argument.type
$this->view->assign('data', $legacyArray);
```

**Type Hints for Service Container Retrieval:**

```php
// ✅ Right: Type hint service retrieval
/** @var DataHandler $dataHandler */
$dataHandler = $this->get(DataHandler::class);

/** @var ResourceFactory $resourceFactory */
$resourceFactory = $this->get(ResourceFactory::class);
```

### Service Configuration

**Configuration/Services.yaml:**

```yaml
services:
  _defaults:
    autowire: true
    autoconfigure: true
    public: false

  # Auto-register all classes
  Vendor\MyExtension\:
    resource: '../Classes/*'

  # Exclude specific directories
  Vendor\MyExtension\Domain\Model\:
    resource: '../Classes/Domain/Model/*'
    autoconfigure: false

  # Explicit service configuration example
  Vendor\MyExtension\Service\EmailService:
    arguments:
      $fromEmail: '%env(DEFAULT_FROM_EMAIL)%'
      $fromName: 'TYPO3 Extension'

  # Tag configuration example
  Vendor\MyExtension\Command\ImportCommand:
    tags:
      - name: 'console.command'
        command: 'myext:import'
        description: 'Import data from external source'
```

**Conditional DI for optional system extensions (e.g. dashboard widgets):**

When an extension integrates with an optional system extension (`dashboard`,
`reports`, …), guard the registration so installs without that extension do not
fail container compilation on unresolvable class references. Two non-obvious
rules make this work — and each fails differently if you get it wrong (rule #1
*silently* skips registration, rule #2 throws a hard container-compile error):

1. **Guard interfaces with `interface_exists()`, not `class_exists()`.** PHP's
   `class_exists()` returns `false` for interfaces and traits, so a guard like
   `class_exists(WidgetInterface::class)` is *always false* — the body never
   runs and the feature silently never registers. Use `interface_exists()` for
   interfaces and `trait_exists()` for traits. (PHPStan ≥ 2.2.2 reports the dead
   `class_exists()` guard as `function.impossibleType`.)

2. **Import a `.php` config from `Services.php`, never a `.yaml`.** TYPO3 loads
   `Configuration/Services.php` with a standalone Symfony `PhpFileLoader` whose
   resolver has no YAML loader, so `$containerConfigurator->import('Foo.yaml')`
   throws `Cannot load resource "Foo.yaml"`. Convert the optional service
   definitions to a PHP config file and import it with an absolute path.

```php
// Configuration/Services.php
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use TYPO3\CMS\Dashboard\Widgets\WidgetInterface;

return static function (ContainerConfigurator $containerConfigurator): void {
    // interface_exists(): class_exists() is always false for an interface.
    if (interface_exists(WidgetInterface::class)) {
        // .php, not .yaml: the PhpFileLoader has no YAML loader in its resolver.
        $containerConfigurator->import(__DIR__ . '/Services.Dashboard.php');
    }
};
```

```php
// Configuration/Services.Dashboard.php
use Symfony\Component\DependencyInjection\Loader\Configurator\ContainerConfigurator;
use TYPO3\CMS\Dashboard\Widgets\NumberWithIconWidget;

use function Symfony\Component\DependencyInjection\Loader\Configurator\service;

return static function (ContainerConfigurator $containerConfigurator): void {
    $services = $containerConfigurator->services();
    $services->defaults()->autowire()->autoconfigure()->private();

    $services->set(\Vendor\MyExtension\Widgets\DataProvider\CostDataProvider::class);
    $services->set('dashboard.widget.myext.cost', NumberWithIconWidget::class)
        ->arg('$dataProvider', service(\Vendor\MyExtension\Widgets\DataProvider\CostDataProvider::class))
        ->tag('dashboard.widget', ['identifier' => 'myext-cost', 'groupNames' => 'general']);
};
```

Add a functional test that loads the optional system extension
(`$coreExtensionsToLoad[] = 'dashboard';`) and asserts the services register
(e.g. `WidgetRegistry::getAllWidgets()` contains your identifiers) — extend
`FunctionalTestCase` directly so a container-compile failure surfaces as a test
failure rather than being swallowed into a skip.

### Backend Module Configuration

**Configuration/Backend/Modules.php:**

```php
<?php
return [
    'web_myext' => [
        'parent' => 'web',
        'position' => ['after' => 'web_info'],
        'access' => 'user',
        'workspaces' => 'live',
        'path' => '/module/web/myext',
        'labels' => 'LLL:EXT:my_extension/Resources/Private/Language/locallang_mod.xlf',
        'extensionName' => 'MyExtension',
        'controllerActions' => [
            \Vendor\MyExtension\Controller\BackendController::class => [
                'list',
                'show',
                'edit',
                'update',
            ],
        ],
    ],
];
```

**Backend SVG icons** (`Resources/Public/Icons/*.svg`, registered in `Configuration/Icons.php`):

- Use SVG **presentation attributes** — `fill="currentColor"`, `fill-rule="evenodd"`, `<g opacity="...">` — **never inline `style="..."`**. TYPO3 inlines icon SVGs into the backend DOM, so a `style=` attribute depends on `style-src-attr 'unsafe-inline'` and breaks under a hardened CSP. Core icons use presentation attributes exclusively (Illustrator/Figma exports often emit `style=` — strip it).
- Use `fill="currentColor"` so the icon adapts to the v14 light/dark backend. For a second tone use `var(--icon-color-accent)` (the themeable accent) or a fixed brand hex.
- The backend **module** icon should differ from the **extension** icon (`Extension.svg`): the extension icon identifies the package, the module icon identifies the feature.
- When the colored v12/v13 variant and the flat v14 variant differ, version-split the source in `Configuration/Icons.php` via `Typo3Version`:

```php
$source = (new \TYPO3\CMS\Core\Information\Typo3Version())->getMajorVersion() >= 14
    ? 'EXT:my_extension/Resources/Public/Icons/Module.svg'        // flat, currentColor
    : 'EXT:my_extension/Resources/Public/Icons/Module.legacy.svg'; // colored tile
```

### Testing Infrastructure

**Build/Scripts/runTests.sh:**

```bash
#!/usr/bin/env bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Run unit tests
if [ "$1" = "unit" ]; then
    php vendor/bin/phpunit -c Build/phpunit/UnitTests.xml
fi

# Run functional tests
if [ "$1" = "functional" ]; then
    typo3DatabaseDriver=pdo_sqlite \
    php vendor/bin/phpunit -c Build/phpunit/FunctionalTests.xml
fi

# Run all tests
if [ "$1" = "all" ]; then
    php vendor/bin/phpunit -c Build/phpunit/UnitTests.xml
    typo3DatabaseDriver=pdo_sqlite \
    php vendor/bin/phpunit -c Build/phpunit/FunctionalTests.xml
fi
```

### CI/CD Configuration

**.github/workflows/ci.yml** (OpenSSF Scorecard-optimized):

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
  workflow_dispatch:

# CRITICAL: deny-all at top level scores 10/10 on Token-Permissions
permissions: {}

jobs:
  lint:
    name: Lint (PHP ${{ matrix.php }})
    runs-on: ubuntu-latest
    permissions:
      contents: read  # Only what this job needs
    strategy:
      fail-fast: false
      matrix:
        php: ['8.2', '8.3', '8.4']
    steps:
      - name: Harden Runner
        uses: step-security/harden-runner@SHA # vX.Y.Z
        with:
          egress-policy: audit

      - name: Checkout
        uses: actions/checkout@SHA # vX.Y.Z

      - name: Setup PHP
        uses: shivammathur/setup-php@SHA # vX.Y.Z
        with:
          php-version: ${{ matrix.php }}
          tools: php-cs-fixer
          coverage: none

      - name: Install dependencies
        run: composer install --prefer-dist --no-progress

      - name: PHP CS Fixer
        run: vendor/bin/php-cs-fixer fix --dry-run --diff

  unit:
    name: Unit Tests (PHP ${{ matrix.php }}, TYPO3 ${{ matrix.typo3 }})
    runs-on: ubuntu-latest
    permissions:
      contents: read
    strategy:
      fail-fast: false
      matrix:
        include:
          - php: '8.2'
            typo3: '^13.4'
          - php: '8.3'
            typo3: '^13.4'
          - php: '8.4'
            typo3: '^13.4'
    steps:
      - name: Harden Runner
        uses: step-security/harden-runner@SHA # vX.Y.Z
        with:
          egress-policy: audit

      - name: Checkout
        uses: actions/checkout@SHA # vX.Y.Z

      - name: Setup PHP
        uses: shivammathur/setup-php@SHA # vX.Y.Z
        with:
          php-version: ${{ matrix.php }}
          coverage: pcov

      - name: Install TYPO3
        run: |
          composer require --no-update "typo3/cms-core:${{ matrix.typo3 }}"
          composer install --prefer-dist --no-progress

      - name: Unit Tests
        run: vendor/bin/phpunit -c Build/phpunit/UnitTests.xml --coverage-clover=coverage.xml

      - name: Upload coverage
        uses: codecov/codecov-action@SHA # vX.Y.Z
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
          files: coverage.xml
          fail_ci_if_error: false
```

**Key Scorecard requirements** (apply to ALL workflow files, not just `ci.yml`):

| Requirement | Pattern | Scorecard Check |
|-------------|---------|-----------------|
| Deny-all permissions | `permissions: {}` at workflow top | Token-Permissions (0→10) |
| Per-job permissions | `permissions: contents: read` per job | Token-Permissions |
| SHA-pinned actions | `uses: action@SHA # vX.Y.Z` | Pinned-Dependencies (0→9) |
| Harden Runner | `step-security/harden-runner` first step | Workflow Hardening |
| Coverage upload | `codecov/codecov-action` with token | Enterprise readiness |
| Security audit | `composer audit --abandoned=ignore` | Vulnerabilities |

**Common mistake**: Adding `permissions: {}` only to `ci.yml` but forgetting `codeql.yml`, `scorecard.yml`, `dependency-review.yml`. Scorecard checks ALL workflow files.

#### Required Supporting Workflows

Every TYPO3 extension should have these additional workflows:

| Workflow | Purpose | Scorecard Impact |
|----------|---------|------------------|
| `codeql.yml` | Security scanning (JS + Actions) | SAST (0→10) |
| `scorecard.yml` | OpenSSF Scorecard analysis | Enables scoring |
| `dependency-review.yml` | PR dependency CVE check | Vulnerabilities |

**Note**: CodeQL does NOT support PHP. Configure it for `javascript-typescript` and `actions` languages only.

#### Scorecard Checks That Cannot Be Fixed

| Check | Why | Score |
|-------|-----|-------|
| Fuzzing | Only recognizes OSS-Fuzz/ClusterFuzzLite, not PHPUnit fuzz | 0 |
| Packaging | Requires GitHub Packages, not Packagist/TER | -1 |
| Maintained | Based on recent commit frequency — penalizes stable projects | 0-10 |

### Documentation Standards

**Documentation/Index.rst:**

```rst
.. include:: /Includes.rst.txt

My Extension

:Extension key:
   my_extension

:Package name:
   vendor/my-extension

:Version:
   |release|

:Language:
   en

:Author:
   Author Name

:License:
   This document is published under the
   `Creative Commons BY 4.0 <https://creativecommons.org/licenses/by/4.0/>`__
   license.

:Rendered:
   |today|

----

Clear and concise extension description explaining the purpose and main features.

----

**Table of Contents:**

.. toctree::
   :maxdepth: 2
   :titlesonly:

   Introduction/Index
   Installation/Index
   Configuration/Index
   Editor/Index
   Developer/Index
   Sitemap
```

**Page Size Guidelines:**

Follow TYPO3 documentation best practices for page organization and sizing:

**Index.rst (Landing Page):**
- **Target:** 80-150 lines
- **Maximum:** 200 lines
- **Purpose:** Entry point with metadata, brief description, and navigation only
- **Contains:** Extension metadata, brief description, card-grid (optional), toctree, license
- **Anti-pattern:** ❌ Embedding all content (introduction, requirements, contributing, credits, etc.)

**Content Pages:**
- **Target:** 100-300 lines per file
- **Optimal:** 150-200 lines
- **Maximum:** 400 lines (split if larger)
- **Structure:** Focused on single topic or logically related concepts
- **Split Strategy:** Create subdirectories for complex topics with multiple aspects

**Red Flags:**
- ❌ Index.rst >200 lines → Extract content to Introduction/, Contributing/, etc.
- ❌ Single file >400 lines → Split into multiple focused pages
- ❌ All content in Index.rst → Create proper section directories
- ❌ Navigation by scrolling → Use card-grid + toctree structure

**Proper Structure Example:**
```
Documentation/
├── Index.rst              # Landing page (80-150 lines)
├── Introduction/          # Getting started
│   └── Index.rst         # Features, requirements, quick start
├── Installation/          # Setup instructions
│   └── Index.rst
├── Configuration/         # Configuration guides
│   ├── Index.rst
│   ├── Basic.rst
│   └── Advanced.rst
├── Contributing/          # Contribution guidelines
│   └── Index.rst         # Code, translations, credits, resources
├── Examples/              # Usage examples
├── Troubleshooting/       # Problem solving
└── API/                   # Developer reference
```

**Benefits:**
- ✅ Better user experience (focused, scannable pages)
- ✅ Easier maintenance (smaller, manageable files)
- ✅ Improved search results (specific pages rank better)
- ✅ Clear information architecture
- ✅ Follows TYPO3 documentation standards
- ✅ Mobile-friendly navigation

**Reference:** [TYPO3 tea extension](https://github.com/TYPO3BestPractices/tea) - exemplary documentation structure

### Version Control

Branch naming, protection rulesets, and PR review-thread resolution are `github-project` / `git-workflow` territory — see those skills.

**TYPO3-specific:** do not commit `composer.lock` in extensions (libraries) — without a lock file, `composer install` resolves versions appropriate to the consumer's PHP version. A lock committed from one dev PHP version fails CI on other matrix entries with cryptic "Your requirements could not be resolved" errors. This inverts for application projects (site packages, deployable apps), where reproducibility demands the lock.

### Language File Organization

**Resources/Private/Language/locallang.xlf:**

```xml
<?xml version="1.0" encoding="UTF-8"?>
<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">
    <file source-language="en" datatype="plaintext"
          original="EXT:my_extension/Resources/Private/Language/locallang.xlf"
          date="2024-01-01T12:00:00Z"
          product-name="my_extension">
        <header/>
        <body>
            <trans-unit id="plugin.title" resname="plugin.title">
                <source>My Extension Plugin</source>
            </trans-unit>
            <trans-unit id="plugin.description" resname="plugin.description">
                <source>Displays product list with filters</source>
            </trans-unit>
        </body>
    </file>
</xliff>
```

### TCA Best Practices

**Configuration/TCA/tx_myext_domain_model_product.php:**

```php
<?php
return [
    'ctrl' => [
        'title' => 'LLL:EXT:my_extension/Resources/Private/Language/locallang_db.xlf:tx_myext_domain_model_product',
        'label' => 'title',
        'tstamp' => 'tstamp',
        'crdate' => 'crdate',
        'delete' => 'deleted',
        'sortby' => 'sorting',
        'versioningWS' => true,
        'origUid' => 't3_origuid',
        'languageField' => 'sys_language_uid',
        'transOrigPointerField' => 'l10n_parent',
        'transOrigDiffSourceField' => 'l10n_diffsource',
        'translationSource' => 'l10n_source',
        'enablecolumns' => [
            'disabled' => 'hidden',
            'starttime' => 'starttime',
            'endtime' => 'endtime',
        ],
        'searchFields' => 'title,description',
        'iconfile' => 'EXT:my_extension/Resources/Public/Icons/product.svg',
    ],
    'types' => [
        '1' => [
            'showitem' => '
                --div--;LLL:EXT:core/Resources/Private/Language/Form/locallang_tabs.xlf:general,
                    title, description,
                --div--;LLL:EXT:core/Resources/Private/Language/Form/locallang_tabs.xlf:access,
                    hidden, starttime, endtime
            ',
        ],
    ],
    'columns' => [
        'title' => [
            'label' => 'LLL:EXT:my_extension/Resources/Private/Language/locallang_db.xlf:tx_myext_domain_model_product.title',
            'config' => [
                'type' => 'input',
                'size' => 30,
                'eval' => 'trim,required',
                'max' => 255,
            ],
        ],
        'description' => [
            'label' => 'LLL:EXT:my_extension/Resources/Private/Language/locallang_db.xlf:tx_myext_domain_model_product.description',
            'config' => [
                'type' => 'text',
                'enableRichtext' => true,
                'richtextConfiguration' => 'default',
            ],
        ],
    ],
];
```

### Security

Input validation, SQL injection prevention, and CSRF protection are `security-audit` territory — see that skill. TYPO3-specific security patterns (shell execution, secure random data, serialization, template escaping, XML/CDATA safety, file upload validation, libxml cleanup) are covered in `## Security Patterns` below, not duplicated here.

### GrumPHP Configuration

**Pre-commit Hook Best Practices:**

When using GrumPHP with PHPStan, configure it to fail gracefully when no PHP files are staged:

```yaml
# grumphp.yml
grumphp:
    tasks:
        phpstan:
            configuration: Build/phpstan.neon
            use_grumphp_paths: true
            triggered_by: ['php']
```

**Common Issue: "No files found" Error**

GrumPHP+PHPStan fails with "No files found to process" when staging only non-PHP files:

```
❌ WRONG: Commit with only .md, .yaml, or config file changes fails PHPStan
```

**Solutions:**

1. **Trigger PHPStan only for PHP files** (recommended):
   ```yaml
   phpstan:
       triggered_by: ['php']
   ```

2. **Skip PHPStan for commits without PHP changes**:
   ```yaml
   phpstan:
       skip_on_empty_paths: true
   ```

3. **Use `--error-format=raw` with ignore pattern**:
   ```yaml
   phpstan:
       extra_args:
           - '--error-format=raw'
   ```

**CI/CD Consideration:**

When running php-cs-fixer in CI, exclude directories that aren't PHP-focused:

```yaml
# .github/workflows/ci.yml
- name: PHP CS Fixer
  run: |
    vendor/bin/php-cs-fixer fix --dry-run --diff \
      --path-mode=intersection \
      -- Classes Tests Configuration
```

## Common Anti-Patterns to Avoid

### ❌ Don't: Use GeneralUtility::makeInstance() for Services
```php
// Old way (deprecated)
$repository = GeneralUtility::makeInstance(ProductRepository::class);
```

### ✅ Do: Use Dependency Injection
```php
// Modern way
public function __construct(
    private readonly ProductRepository $repository
) {}
```

### ❌ Don't: Access $GLOBALS directly
```php
// Avoid global state
$user = $GLOBALS['BE_USER'];
$tsfe = $GLOBALS['TSFE'];
```

### ✅ Do: Inject Context and Services
```php
public function __construct(
    private readonly Context $context,
    private readonly TypoScriptService $typoScriptService
) {}
```

### ❌ Don't: Use ext_tables.php for configuration
```php
// ext_tables.php (deprecated for most uses)
```

### ✅ Do: Use dedicated configuration files
```php
// Configuration/Backend/Modules.php
// Configuration/TCA/
// Configuration/Services.yaml
```

## Netresearch CI Integration

Netresearch extensions use the shared `netresearch/typo3-ci-workflows` package to standardize tooling and CI pipelines across all TYPO3 projects.

### Single require-dev Dependency

Extensions should use `netresearch/typo3-ci-workflows` as the **single** `require-dev` dependency instead of listing individual tools (phpstan, php-cs-fixer, rector, etc.) separately.

```json
{
    "require-dev": {
        "netresearch/typo3-ci-workflows": "^1.0"
    }
}
```

**Do NOT add individual tool packages to require-dev:**

```json
// ❌ Wrong: Individual tool packages
{
    "require-dev": {
        "phpstan/phpstan": "^1.10",
        "friendsofphp/php-cs-fixer": "^3.0",
        "rector/rector": "^1.0",
        "phpunit/phpunit": "^10.5"
    }
}
```

### Required allowed-plugins

All allowed-plugins from the CI workflow must be listed in `composer.json`:

```json
{
    "config": {
        "allow-plugins": {
            "typo3/class-alias-loader": true,
            "typo3/cms-composer-installers": true,
            "phpstan/extension-installer": true,
            "a9f/fractor-extension-installer": true,
            "infection/extension-installer": true,
            "captainhook/hook-installer": true,
            "dg/bypass-finals": true
        }
    }
}
```

### Reusable CI Workflows

CI workflows must only use **reusable workflows** from `netresearch/typo3-ci-workflows`. Never use direct actions or define jobs inline.

```yaml
# ✅ Right: Reusable workflow
jobs:
  ci:
    uses: netresearch/typo3-ci-workflows/.github/workflows/ci.yml@main
```

```yaml
# ❌ Wrong: Direct actions and inline jobs
jobs:
  phpstan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: vendor/bin/phpstan analyse
```

### Push Trigger Restriction

The `push` trigger in `ci.yml` must be restricted to `branches: [main]` to avoid duplicate runs on pull requests (PRs already trigger their own workflow run).

```yaml
on:
  push:
    branches: [main]  # ✅ Only main — prevents duplicate runs on PRs
  pull_request:
```

```yaml
# ❌ Wrong: Unrestricted push trigger causes duplicate CI runs
on:
  push:
  pull_request:
```

## TYPO3 v13 TCA Requirements

### l10n_parent Field Type

The `l10n_parent` field **MUST** use `type=select` / `renderType=selectSingle` with `foreign_table`, **NOT** `type=group`.

```php
// ✅ Right: select/selectSingle for l10n_parent
'l10n_parent' => [
    'label' => 'LLL:EXT:core/Resources/Private/Language/locallang_general.xlf:LGL.l18n_parent',
    'config' => [
        'type' => 'select',
        'renderType' => 'selectSingle',
        'items' => [
            ['label' => '', 'value' => 0],
        ],
        'foreign_table' => 'tx_myext_domain_model_item',
        'foreign_table_where' =>
            'AND {#tx_myext_domain_model_item}.{#pid}=###CURRENT_PID###'
            . ' AND {#tx_myext_domain_model_item}.{#sys_language_uid} IN (-1,0)',
        'default' => 0,
    ],
],
```

```php
// ❌ Wrong: type=group for l10n_parent (not supported in v13)
'l10n_parent' => [
    'config' => [
        'type' => 'group',
        'allowed' => 'tx_myext_domain_model_item',
    ],
],
```

### Deprecated eval Values

`eval=trim` is **deprecated** for `type=input` and `type=text` in TYPO3 v13. Remove it from all TCA column definitions.

```php
// ✅ Right: No eval=trim in v13
'title' => [
    'config' => [
        'type' => 'input',
        'size' => 30,
        'max' => 255,
        'required' => true,  // Use 'required' as standalone config key
    ],
],

// ❌ Wrong: eval=trim is deprecated
'title' => [
    'config' => [
        'type' => 'input',
        'eval' => 'trim,required',
    ],
],
```

### Removed ctrl Options

`prependAtCopy` and `hideAtCopy` were **removed** in TYPO3 v13. Remove them from `ctrl` sections.

```php
// ❌ Wrong: Removed in v13
'ctrl' => [
    'prependAtCopy' => 'LLL:EXT:core/...:LGL.prependAtCopy',
    'hideAtCopy' => true,
],
```

### Select Field Defaults

Select fields referencing foreign tables should have an explicit `default => 0`:

```php
'category' => [
    'config' => [
        'type' => 'select',
        'renderType' => 'selectSingle',
        'foreign_table' => 'tx_myext_category',
        'default' => 0,  // ✅ Explicit default
    ],
],
```

### System Column Definitions

System columns (`uid`, `pid`, `tstamp`, `crdate`, `deleted`, `hidden`) should **NOT** have explicit column definitions in TCA. TYPO3 v13 auto-creates them from `ctrl` settings.

```php
// ✅ Right: Only declare in ctrl, not in columns
'ctrl' => [
    'tstamp' => 'tstamp',
    'crdate' => 'crdate',
    'delete' => 'deleted',
    'enablecolumns' => [
        'disabled' => 'hidden',
    ],
],
'columns' => [
    // Do NOT add uid, pid, tstamp, crdate, deleted, hidden here
    'title' => [ /* ... */ ],
],
```

```php
// ❌ Wrong: Explicit column definitions for system fields
'columns' => [
    'hidden' => [
        'label' => 'Hidden',
        'config' => ['type' => 'check'],
    ],
    'tstamp' => [
        'label' => 'Timestamp',
        'config' => ['type' => 'passthrough'],
    ],
],
```

## Security Patterns

### Shell Execution

Never use `shell_exec()` or similar shell functions. Use PHP file functions instead.

```php
// ✅ Right: PHP file functions
$content = file_get_contents($filePath);
$files = scandir($directory);
copy($source, $destination);
unlink($tempFile);

// ❌ Wrong: Shell execution
$content = shell_exec('cat ' . $filePath);
$files = shell_exec('ls ' . $directory);
```

### Secure Random Data

Use `random_bytes()` for generating tokens and secrets, not `md5(uniqid())`.

```php
// ✅ Right: Cryptographically secure
$token = bin2hex(random_bytes(32));

// ❌ Wrong: Predictable, not cryptographically secure
$token = md5(uniqid('', true));
```

### Data Serialization

Use `json_encode`/`json_decode` for data storage, not `serialize`/`unserialize` (which can lead to object injection attacks).

```php
// ✅ Right: JSON for data storage
$stored = json_encode($data, JSON_THROW_ON_ERROR);
$restored = json_decode($stored, true, 512, JSON_THROW_ON_ERROR);

// ❌ Wrong: PHP serialization (object injection risk)
$stored = serialize($data);
$restored = unserialize($stored);
```

### Template Output Escaping

All template output of user-controlled data must use `f:format.htmlspecialchars()` or rely on Fluid auto-escaping.

```html
<!-- ✅ Right: Explicit escaping -->
<span>{entry.title -> f:format.htmlspecialchars()}</span>

<!-- ✅ Right: Fluid auto-escaping (default for inline notation) -->
<span>{entry.title}</span>

<!-- ❌ Wrong: Raw output of user data -->
<f:format.raw>{entry.userInput}</f:format.raw>
```

### XML Export Safety

When generating XML output, escape attributes properly and handle CDATA breakout:

```php
// ✅ Right: Proper XML attribute escaping
$attr = htmlspecialchars($value, ENT_XML1 | ENT_QUOTES, 'UTF-8');
echo '<element attr="' . $attr . '">';

// ✅ Right: Handle CDATA ]]> breakout
$cdataContent = str_replace(']]>', ']]]]><![CDATA[>', $value);
echo '<![CDATA[' . $cdataContent . ']]>';
```

### File Upload Validation

Always check the upload error code before processing uploaded files:

```php
// ✅ Right: Check error code first
if ($uploadedFile->getError() === UPLOAD_ERR_OK) {
    $stream = $uploadedFile->getStream();
    // Process file...
}

// ❌ Wrong: Skip error check
$stream = $uploadedFile->getStream(); // May fail silently
```

### libxml Error Cleanup

Always call `libxml_clear_errors()` after `libxml_get_errors()` to prevent memory leaks:

```php
// ✅ Right: Clear errors after retrieval
$errors = libxml_get_errors();
libxml_clear_errors();
foreach ($errors as $error) {
    // Handle error...
}

// ❌ Wrong: Errors accumulate in memory
$errors = libxml_get_errors();
// Missing libxml_clear_errors()
```

## Performance Patterns

### TYPO3 Cache Configuration — No Hardcoded Backend

When declaring a cache frontend in `ext_localconf.php`, **never specify a `'backend'` array key**. Only declare `frontend`, `options`, and `groups`. TYPO3 uses the instance's default backend.

**Bad — hardcodes backend, defeats admin's Redis/Valkey/Memcached setup:**

```php
$GLOBALS['TYPO3_CONF_VARS']['SYS']['caching']['cacheConfigurations']['myext_cache'] = [
    'backend'  => \TYPO3\CMS\Core\Cache\Backend\SimpleFileBackend::class,   // ← no
    'frontend' => \TYPO3\CMS\Core\Cache\Frontend\VariableFrontend::class,
    'options'  => ['defaultLifetime' => 3600],
];
```

**Good — follows the instance default (Redis, DB, file, whatever the admin configured):**

```php
$GLOBALS['TYPO3_CONF_VARS']['SYS']['caching']['cacheConfigurations']['myext_cache'] = [
    'frontend' => \TYPO3\CMS\Core\Cache\Frontend\VariableFrontend::class,
    'options'  => ['defaultLifetime' => 3600],
    'groups'   => ['myext'],
    // NO 'backend' key — TYPO3 uses the instance default.
];
```

If you need a *specific* backend for correctness reasons (e.g., `TransientMemoryBackend` because the cache must be per-request), state that in a code comment so the choice is clear to reviewers.

### In-Memory Caching

Add in-memory translation and result caches in services, keyed by lookup parameters:

```php
final class TranslationService
{
    /** @var array<string, string> */
    private array $translationCache = [];

    public function translate(string $key, string $language): string
    {
        $cacheKey = $key . ':' . $language;
        if (!isset($this->translationCache[$cacheKey])) {
            $this->translationCache[$cacheKey] = $this->performLookup($key, $language);
        }
        return $this->translationCache[$cacheKey];
    }
}
```

### Config Lookup Caching

Cache configuration lookups (e.g., `getConfiguredPageId()`) in instance properties to avoid repeated database or configuration queries:

```php
final class ConfigService
{
    private ?int $configuredPageId = null;

    public function getConfiguredPageId(): int
    {
        if ($this->configuredPageId === null) {
            $this->configuredPageId = (int)$this->extensionConfiguration->get(
                'my_extension',
                'storagePid'
            );
        }
        return $this->configuredPageId;
    }
}
```

### Efficient Query Result Checks

Use `getFirst()` with a null check instead of `count() === 0` followed by `getFirst()`. The count pattern executes an extra `COUNT` SQL query.

```php
// ✅ Right: Single query
$result = $repository->findByIdentifier($id);
if ($result === null) {
    return; // Not found
}
// Use $result...

// ✅ Right: getFirst() null check
$first = $queryResult->getFirst();
if ($first === null) {
    return;
}

// ❌ Wrong: Two queries (COUNT + SELECT)
if ($queryResult->count() === 0) {
    return;
}
$first = $queryResult->getFirst();
```

### Batch Persistence

Batch `persistAll()` calls at the end of an import operation, not per-entry:

```php
// ✅ Right: Single persistAll at end
foreach ($entries as $entry) {
    $model = $this->mapToModel($entry);
    $this->repository->add($model);
}
$this->persistenceManager->persistAll();  // One flush

// ❌ Wrong: persistAll per entry (N database flushes)
foreach ($entries as $entry) {
    $model = $this->mapToModel($entry);
    $this->repository->add($model);
    $this->persistenceManager->persistAll();  // Flush per entry
}
```

### ViewHelper Delegation

ViewHelpers should delegate to cached service methods, not duplicate lookup logic:

```php
// ✅ Right: Delegate to cached service
final class TranslateViewHelper extends AbstractViewHelper
{
    public function __construct(
        private readonly TranslationService $translationService
    ) {}

    public function render(): string
    {
        return $this->translationService->translate(
            $this->arguments['key'],
            $this->arguments['language']
        );
    }
}

// ❌ Wrong: Duplicate lookup logic in ViewHelper
final class TranslateViewHelper extends AbstractViewHelper
{
    public function render(): string
    {
        // Performs uncached DB query on every render call
        $repository = GeneralUtility::makeInstance(TranslationRepository::class);
        return $repository->findByKey($this->arguments['key'])->getValue();
    }
}
```

## Template Patterns (TYPO3 v13 / Bootstrap 5)

### Bootstrap 5 Class Migration

Use Bootstrap 5 utility classes. Many Bootstrap 3/4 classes are removed or renamed:

| Bootstrap 3/4 (Wrong) | Bootstrap 5 (Right) | Notes |
|----------------------|---------------------|-------|
| `form-inline` | `d-flex gap-3` | Inline forms use flex utilities |
| `form-row` | `row g-3` | Form rows use gutter utilities |
| `btn-default` | `btn-secondary` | Default button renamed |
| `form-group` | `mb-3` | Form groups use margin utilities |
| `form-control-file` | `form-control` | File inputs use standard class |

```html
<!-- ✅ Right: Bootstrap 5 -->
<div class="d-flex gap-3 align-items-end mb-3">
    <div>
        <label class="form-label">Filter</label>
        <input class="form-control" type="text" />
    </div>
    <button class="btn btn-secondary">Apply</button>
</div>

<!-- ❌ Wrong: Bootstrap 3/4 classes -->
<div class="form-inline form-group">
    <input class="form-control" type="text" />
    <button class="btn btn-default">Apply</button>
</div>
```

### Table Semantics

Do not use `role="grid"` on data tables. Use native HTML table semantics:

```html
<!-- ✅ Right: Native table semantics -->
<table class="table table-striped" aria-label="Product list">
    <thead>
        <tr>
            <th scope="col">Name</th>
            <th scope="col">Price</th>
        </tr>
    </thead>
    <tbody>
        <f:for each="{products}" as="product">
            <tr>
                <td>{product.name -> f:format.htmlspecialchars()}</td>
                <td>{product.price}</td>
            </tr>
        </f:for>
    </tbody>
</table>

<!-- ❌ Wrong: role="grid" on a data table -->
<table role="grid">
    <tr><th>Name</th></tr>
</table>
```

### Accessibility Attributes

Add proper accessibility attributes to interactive elements:

- `scope="col"` on all `<th>` elements
- `aria-label` on `<form>`, `<nav>`, and `<table>` elements
- `f:format.htmlspecialchars()` on all user-controlled output

```html
<nav aria-label="{f:translate(key: 'pagination.label')}">
    <!-- pagination markup -->
</nav>

<form aria-label="{f:translate(key: 'filter.label')}" method="post">
    <!-- form fields -->
</form>

<table class="table" aria-label="{f:translate(key: 'results.label')}">
    <thead>
        <tr>
            <th scope="col">{f:translate(key: 'column.name')}</th>
            <th scope="col">{f:translate(key: 'column.status')}</th>
        </tr>
    </thead>
</table>
```

||||||| parent of 4cac7a1 (feat: add learnings from 60+ agent review cycles):references/best-practices.md
## XLIFF Translation Hygiene

Periodically audit for unused translation keys defined in `locallang.xlf` (and language variants like `de.locallang.xlf`) but never referenced in PHP or Fluid templates. Dead keys accumulate during refactoring and clutter translation files.

**Detection:**
```bash
# Extract all trans-unit IDs from XLIFF files
grep -ohP 'id="[^"]+"' Resources/Private/Language/locallang*.xlf | \
    sed 's/id="//;s/"//' | sort -u > /tmp/xliff_keys.txt

# Search for each key in PHP and Fluid files
while IFS= read -r key; do
    if ! grep -rq "$key" Classes/ Resources/Private/Templates/ Resources/Private/Layouts/ Resources/Private/Partials/ Configuration/ 2>/dev/null; then
        echo "UNUSED: $key"
    fi
done < /tmp/xliff_keys.txt
```

**Action:** Remove unused keys from ALL translation files (base `locallang.xlf` and every language variant). Do not leave orphaned keys in language-specific files when the base key is removed.

**Severity:** 🟢 Recommended - Keeps translation files clean and reduces translator workload

---

## CI Workflow: Prevent Duplicate Runs

When a GitHub Actions workflow has both `push:` and `pull_request:` triggers, pushes to PR branches trigger **two** CI runs (one for push, one for PR event). Restrict the `push:` trigger to `branches: [main]` to prevent duplicate runs.

**Before (DUPLICATE RUNS):**
```yaml
on:
  push:           # Triggers on ALL branch pushes
  pull_request:
    branches: [main]
```

**After (CORRECT):**
```yaml
on:
  push:
    branches: [main]    # Only trigger push on main (release/merge)
  pull_request:
    branches: [main]    # PR events handle feature branch CI
```

**Detection:**
```bash
# Check for push trigger without branch restriction
grep -A 2 'push:' .github/workflows/*.yml | grep -v 'branches:'
```

**Severity:** 🟡 Important - Duplicate runs waste CI minutes and create confusing status checks

---

## Conformance Checklist

- [ ] Complete directory structure following best practices
- [ ] composer.json with proper PSR-4 autoloading
- [ ] Quality tools configured (php-cs-fixer, phpstan)
- [ ] CI/CD pipeline (GitHub Actions or GitLab CI)
- [ ] CI push trigger restricted to `branches: [main]` when `pull_request:` is also configured
- [ ] Comprehensive test coverage (unit, functional, acceptance)
- [ ] Complete documentation in RST format
- [ ] Service configuration in Services.yaml
- [ ] Backend modules in Configuration/Backend/
- [ ] TCA files in Configuration/TCA/
- [ ] Language files in XLIFF format
- [ ] No unused XLIFF translation keys (periodic audit)
- [ ] Dependency injection throughout
- [ ] No global state access
- [ ] Security best practices followed
- [ ] .editorconfig for consistent formatting
- [ ] .gitignore with standard patterns (caches, build artifacts, vendor)
- [ ] README.md with clear instructions
- [ ] LICENSE file present
- [ ] Branch protection with required conversation resolution enabled
- [ ] Netresearch CI workflows used (not individual tool packages)
- [ ] TCA l10n_parent uses select/selectSingle (not group)
- [ ] No eval=trim on type=input or type=text fields
- [ ] No prependAtCopy or hideAtCopy in ctrl
- [ ] System columns not redefined in TCA columns
- [ ] No shell_exec usage
- [ ] random_bytes() used for token generation
- [ ] json_encode/json_decode used (not serialize/unserialize)
- [ ] Template output properly escaped
- [ ] In-memory caches for repeated lookups
- [ ] Batch persistAll() for import operations
- [ ] Bootstrap 5 classes used (not 3/4)
- [ ] Proper table semantics (no role="grid" on data tables)
- [ ] Accessibility attributes on forms, nav, and tables
- [ ] Custom exception handlers registered in `additional.php` (not `ext_localconf.php`)

## Bootstrap & error-handling gotchas

### Custom exception handlers belong in `additional.php`, not `ext_localconf.php`

TYPO3 reads `$GLOBALS['TYPO3_CONF_VARS']['SYS']['debugExceptionHandler']` and
`$GLOBALS['TYPO3_CONF_VARS']['SYS']['productionExceptionHandler']` during EARLY bootstrap (`Bootstrap::initializeErrorHandling()`),
which runs BEFORE any extension's `ext_localconf.php` is loaded. Registering a custom exception
handler in `ext_localconf.php` is therefore **silently ignored** — the override never takes effect.

Register it in the project's `config/system/additional.php` instead:

```php
// Register for both contexts so the override applies in Development and Production.
$GLOBALS['TYPO3_CONF_VARS']['SYS']['debugExceptionHandler']
    = \Vendor\Ext\Error\MyExceptionHandler::class;
$GLOBALS['TYPO3_CONF_VARS']['SYS']['productionExceptionHandler']
    = \Vendor\Ext\Error\MyExceptionHandler::class;
```

This only manifests at runtime in a booted instance — a static scan or `php -l` will not catch it.

**Audit:** if an extension ships an exception-handler subclass, verify its registration is documented
for `additional.php`, not (ineffectively) placed in `ext_localconf.php`.
