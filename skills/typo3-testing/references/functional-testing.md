# Functional Testing in TYPO3

Functional tests verify components that interact with external systems like databases, using a full TYPO3 instance.

## When to Use Functional Tests

- Testing database operations (repositories, queries)
- Controller and plugin functionality
- Hook and event implementations
- DataHandler operations
- File and folder operations
- Extension configuration behavior

## Base Class

All functional tests extend `TYPO3\TestingFramework\Core\Functional\FunctionalTestCase`:

```php
<?php

declare(strict_types=1);

namespace Vendor\Extension\Tests\Functional\Domain\Repository;

use TYPO3\TestingFramework\Core\Functional\FunctionalTestCase;
use Vendor\Extension\Domain\Model\Product;
use Vendor\Extension\Domain\Repository\ProductRepository;

final class ProductRepositoryTest extends FunctionalTestCase
{
    protected ProductRepository $subject;

    protected array $testExtensionsToLoad = [
        'typo3conf/ext/my_extension',
    ];

    protected function setUp(): void
    {
        parent::setUp();
        $this->subject = $this->get(ProductRepository::class);
    }

    /**
     * @test
     */
    public function findsProductsByCategory(): void
    {
        $this->importCSVDataSet(__DIR__ . '/../Fixtures/Products.csv');

        $products = $this->subject->findByCategory(1);

        self::assertCount(3, $products);
    }
}
```

## Gotcha: a green functional suite can prove nothing

A passing functional run is not proof the tests ran. Three ways CI stays green while nothing is verified — check for all three:

1. **A wrapped `setUp` swallows a broken environment into a skip.** A base class that guards `parent::setUp()` like this:

   ```php
   protected function setUp(): void
   {
       try {
           parent::setUp();
       } catch (\Throwable $e) {
           self::markTestSkipped('Failed to initialize functional test: ' . $e->getMessage());
       }
   }
   ```

   turns an **unreachable database** — or a broken fixture, or a TCA error — into `OK, Tests: 25, Assertions: 0, Skipped: 25`, exit 0. The suite tested nothing and CI is green. Proven: pointing the run at a not-yet-ready MariaDB produced exactly that. Prefer letting the environment failure fail the test (keep only a deliberate "no database configured" skip, and put that check *before* `parent::setUp()`), and **gate the run on assertion count, not exit code** — `Assertions: 0` across the suite means it proved nothing.

2. **A coverage flag that never reaches the runner.** `composer ci:test:php:functional -- --coverage-clover=cov.xml` silently produces no file if the composer script wraps its command in `sh -c '… runTests.sh …'` — composer appends the args *after* the quoted string, so they become `$0`/`$@` of the wrapper and never reach `runTests.sh` (nor the PHPUnit it drives). Forward them: `sh -c '… runTests.sh … "$@"' --`. (One extension uploaded no coverage for three months this way.)

3. **A coverage config with no `<source>`.** Even with the flag, PHPUnit answers `No filter is configured, code coverage will not be processed` and writes nothing unless `FunctionalTests.xml` has a `<source>` block. And because the Codecov step runs with `fail_ci_if_error: false`, uploading a file that was never written never fails. **Verify coverage actually lands** (the Codecov commit/flag updates), don't assume a green upload step means it worked.

The through-line: **success reported ≠ behaviour proven.** Gate on a produced artifact (assertions, a non-empty clover), not on exit 0.

## Test Database

Functional tests use an isolated test database:

- Created before test execution
- Populated with fixtures
- Destroyed after test completion
- Supports: MySQL, MariaDB, PostgreSQL, SQLite

### Database Configuration

Set via environment or `FunctionalTests.xml`:

```xml
<php>
    <env name="typo3DatabaseDriver" value="mysqli"/>
    <env name="typo3DatabaseHost" value="localhost"/>
    <env name="typo3DatabasePort" value="3306"/>
    <env name="typo3DatabaseUsername" value="root"/>
    <env name="typo3DatabasePassword" value=""/>
    <env name="typo3DatabaseName" value="typo3_test"/>
</php>
```

## Database Fixtures

> **Migration note (`typo3/testing-framework` v9):** the legacy XML loader `importDataSet()` was removed and replaced by `importCSVDataSet()`. Convert XML fixtures to CSV: one row per record, a leading `,"uid","pid",...` header line per table, and a quoted table-name row above each table. The CSV loader is stricter about column order and quoting -- see the rules below. Extensions on `typo3/testing-framework: ^8.2 || ^9.0` should standardise on CSV so the same fixtures work on TYPO3 v12, v13 and v14.

### CSV Format

Create fixtures in `Tests/Functional/Fixtures/`:

```csv
"pages"
,"uid","pid","title","doktype"
,1,0,"Root",1
,2,1,"Products",1
,3,1,"Services",1
```

```csv
"tx_myext_domain_model_product"
,"uid","pid","title","price","category"
,1,2,"Product A",10.00,1
,2,2,"Product B",20.00,1
,3,2,"Product C",15.00,2
```

**CSV fixture format rules:**

1. **First row is the table name** (quoted): `"pages"`, `"tx_myext_domain_model_product"`
2. **Second row is the column header** (leading comma, quoted column names): `,"uid","pid","title"`
3. **Data rows** start with a leading comma: `,1,0,"Root",1`
4. **Foreign key references must be consistent**: if a product references `pid=2`, a pages fixture must contain `uid=2`. Inconsistent references cause silent test failures where records appear missing.
5. **Multiple tables can share a single CSV file** by repeating the table-name + header pattern

### Import Fixtures

```php
/**
 * @test
 */
public function findsProducts(): void
{
    // Import fixture
    $this->importCSVDataSet(__DIR__ . '/../Fixtures/Products.csv');

    // Test repository
    $products = $this->subject->findAll();

    self::assertCount(3, $products);
}
```

### Multiple Fixtures

```php
protected function setUp(): void
{
    parent::setUp();

    // Import common fixtures
    $this->importCSVDataSet(__DIR__ . '/../Fixtures/pages.csv');
    $this->importCSVDataSet(__DIR__ . '/../Fixtures/be_users.csv');

    $this->subject = $this->get(ProductRepository::class);
}
```

## Dependency Injection

Use `$this->get()` to retrieve services:

```php
protected function setUp(): void
{
    parent::setUp();

    // Get service from container
    $this->subject = $this->get(ProductRepository::class);
    $this->dataMapper = $this->get(DataMapper::class);
}
```

## Testing Extensions

### Load Test Extensions

```php
// Composer package name format — use 'vendor/extension-name' from composer.json
protected array $testExtensionsToLoad = [
    'vendor/my-extension',
    'vendor/dependency-extension',
];
```

**Important:** Always use the `vendor/extension-name` pattern matching the `name` field in the extension's `composer.json`. This is the only format that works reliably across all testing setups (local, CI, DDEV). The legacy `typo3conf/ext/my_extension` path format is deprecated and should not be used in new tests.

### Core Extensions

```php
protected array $coreExtensionsToLoad = [
    'form',
    'workspaces',
];
```

### Load ALL hard dependencies (or the bootstrap fails cryptically)

`coreExtensionsToLoad` / `testExtensionsToLoad` must include **every** TYPO3
extension your extension hard-depends on — both the `ext_emconf.php`
`constraints.depends` AND every `typo3/cms-*` in the composer `require`
(composer-only extensions on v14.3 derive their dependencies from `require`; see
the typo3-conformance skill's ext_emconf migration notes).

If a declared dependency is not loaded, the package graph is unsatisfiable, the
DI container falls back to the **failsafe container**, and the real cause is
hidden behind a misleading error:

```
TYPO3\CMS\Core\DependencyInjection\NotFoundException:
  Container entry "TYPO3\CMS\Core\Configuration\Extension\ExtTablesFactory" is not available.
```

When you see that `ExtTablesFactory` / failsafe-container error, the fix is almost
always "a declared dependency is not loaded" — add it to `coreExtensionsToLoad`.
(Example: an extension that requires `typo3/cms-reports` for a Reports status
provider must list `'reports'` in **every** functional test's `coreExtensionsToLoad`,
not just one.)

## Site Configuration

Create site configuration for frontend tests:

```php
protected function setUp(): void
{
    parent::setUp();

    $this->importCSVDataSet(__DIR__ . '/../Fixtures/pages.csv');

    $this->writeSiteConfiguration(
        'test',
        [
            'rootPageId' => 1,
            'base' => 'http://localhost/',
        ]
    );
}
```

## Frontend Requests

Test frontend rendering:

```php
use TYPO3\TestingFramework\Core\Functional\Framework\Frontend\InternalRequest;

/**
 * @test
 */
public function rendersProductList(): void
{
    $this->importCSVDataSet(__DIR__ . '/../Fixtures/pages.csv');
    $this->importCSVDataSet(__DIR__ . '/../Fixtures/Products.csv');

    $this->writeSiteConfiguration('test', ['rootPageId' => 1]);

    $response = $this->executeFrontendSubRequest(
        new InternalRequest('http://localhost/products')
    );

    self::assertStringContainsString('Product A', (string)$response->getBody());
}
```

## Testing DataHandler Hooks (SC_OPTIONS)

Test DataHandler SC_OPTIONS hook integration with real framework:

```php
<?php

declare(strict_types=1);

namespace Vendor\Extension\Tests\Functional\Database;

use TYPO3\CMS\Core\DataHandling\DataHandler;
use TYPO3\TestingFramework\Core\Functional\FunctionalTestCase;
use Vendor\Extension\Database\MyDataHandlerHook;

final class MyDataHandlerHookTest extends FunctionalTestCase
{
    protected array $testExtensionsToLoad = [
        'typo3conf/ext/my_extension',
    ];

    protected array $coreExtensionsToLoad = [
        'typo3/cms-rte-ckeditor', // If testing RTE-related hooks
    ];

    protected function setUp(): void
    {
        parent::setUp();

        $this->importCSVDataSet(__DIR__ . '/Fixtures/pages.csv');
        $this->importCSVDataSet(__DIR__ . '/Fixtures/tt_content.csv');
    }

    private function createSubject(): MyDataHandlerHook
    {
        // Get services from container with proper DI
        return new MyDataHandlerHook(
            $this->get(ExtensionConfiguration::class),
            $this->get(LogManager::class),
            $this->get(ResourceFactory::class),
        );
    }

    /**
     * @test
     */
    public function processDatamapPostProcessFieldArrayHandlesRteField(): void
    {
        $subject = $this->createSubject();

        $status     = 'update';
        $table      = 'tt_content';
        $id         = '1';
        $fieldArray = [
            'bodytext' => '<p>Test content with <img src="image.jpg" /></p>',
        ];

        /** @var DataHandler $dataHandler */
        $dataHandler = $this->get(DataHandler::class);

        // Configure TCA for RTE field
        /** @var array<string, mixed> $tcaConfig */
        $tcaConfig = [
            'type'           => 'text',
            'enableRichtext' => true,
        ];
        // @phpstan-ignore-next-line offsetAccess.nonOffsetAccessible
        $GLOBALS['TCA']['tt_content']['columns']['bodytext']['config'] = $tcaConfig;

        $subject->processDatamap_postProcessFieldArray(
            $status,
            $table,
            $id,
            $fieldArray,
            $dataHandler,
        );

        // Field should be processed by hook
        self::assertArrayHasKey('bodytext', $fieldArray);
        self::assertIsString($fieldArray['bodytext']);
        self::assertNotEmpty($fieldArray['bodytext']);
        self::assertStringContainsString('Test content', $fieldArray['bodytext']);
    }

    /**
     * @test
     */
    public function hookIsRegisteredInGlobals(): void
    {
        // Verify hook is properly registered in TYPO3_CONF_VARS
        self::assertIsArray($GLOBALS['TYPO3_CONF_VARS']);
        self::assertArrayHasKey('SC_OPTIONS', $GLOBALS['TYPO3_CONF_VARS']);

        $scOptions = $GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS'];
        self::assertIsArray($scOptions);
        self::assertArrayHasKey('t3lib/class.t3lib_tcemain.php', $scOptions);

        $tcemainOptions = $scOptions['t3lib/class.t3lib_tcemain.php'];
        self::assertIsArray($tcemainOptions);
        self::assertArrayHasKey('processDatamapClass', $tcemainOptions);

        $registeredHooks = $tcemainOptions['processDatamapClass'];
        self::assertIsArray($registeredHooks);

        // Hook class should be registered
        self::assertContains(MyDataHandlerHook::class, $registeredHooks);
    }
}
```

### Key Patterns for DataHandler Hook Testing

1. **Use Factory Method Pattern**: Create `createSubject()` method to avoid uninitialized property PHPStan errors
2. **Test Real Framework Integration**: Don't mock DataHandler, test actual hook execution
3. **Configure TCA Dynamically**: Set up `$GLOBALS['TCA']` in tests for field configuration
4. **Verify Hook Registration**: Test that hooks are properly registered in `$GLOBALS['TYPO3_CONF_VARS']`
5. **Test Multiple Scenarios**: new vs update, single vs multiple fields, RTE vs non-RTE

## Testing File Abstraction Layer (FAL)

Test ResourceFactory and FAL storage integration:

```php
<?php

declare(strict_types=1);

namespace Vendor\Extension\Tests\Functional\Controller;

use TYPO3\CMS\Core\Resource\File;
use TYPO3\CMS\Core\Resource\Folder;
use TYPO3\CMS\Core\Resource\ResourceFactory;
use TYPO3\CMS\Core\Resource\ResourceStorage;
use TYPO3\TestingFramework\Core\Functional\FunctionalTestCase;
use Vendor\Extension\Controller\ImageRenderingController;

final class ImageRenderingControllerTest extends FunctionalTestCase
{
    protected array $testExtensionsToLoad = [
        'typo3conf/ext/my_extension',
    ];

    protected function setUp(): void
    {
        parent::setUp();

        $this->importCSVDataSet(__DIR__ . '/Fixtures/sys_file_storage.csv');
        $this->importCSVDataSet(__DIR__ . '/Fixtures/sys_file.csv');
    }

    /**
     * @test
     */
    public function storageIsAccessible(): void
    {
        /** @var ResourceFactory $resourceFactory */
        $resourceFactory = $this->get(ResourceFactory::class);
        $storage         = $resourceFactory->getStorageObject(1);

        self::assertInstanceOf(ResourceStorage::class, $storage);
        self::assertTrue($storage->isOnline());
    }

    /**
     * @test
     */
    public function canRetrieveFileFromStorage(): void
    {
        /** @var ResourceFactory $resourceFactory */
        $resourceFactory = $this->get(ResourceFactory::class);

        // Get file from test data
        $file = $resourceFactory->getFileObject(1);

        self::assertInstanceOf(File::class, $file);
        self::assertSame('test-image.jpg', $file->getName());
    }

    /**
     * @test
     */
    public function canAccessStorageRootFolder(): void
    {
        /** @var ResourceFactory $resourceFactory */
        $resourceFactory = $this->get(ResourceFactory::class);
        $storage         = $resourceFactory->getStorageObject(1);

        $rootFolder = $storage->getRootLevelFolder();

        self::assertInstanceOf(Folder::class, $rootFolder);
        self::assertSame('/', $rootFolder->getIdentifier());
    }
}
```

### FAL Test Fixtures

**sys_file_storage.csv:**
```csv
uid,pid,name,driver,configuration,is_default,is_browsable,is_public,is_writable,is_online
1,0,"fileadmin","Local","<?xml version=""1.0"" encoding=""utf-8"" standalone=""yes"" ?><T3FlexForms><data><sheet index=""sDEF""><language index=""lDEF""><field index=""basePath""><value index=""vDEF"">fileadmin/</value></field><field index=""pathType""><value index=""vDEF"">relative</value></field><field index=""caseSensitive""><value index=""vDEF"">1</value></field></language></sheet></data></T3FlexForms>",1,1,1,1,1
```

**sys_file.csv:**
```csv
uid,pid,storage,identifier,name,type,mime_type,size,sha1,extension
1,0,1,"/test-image.jpg","test-image.jpg",2,"image/jpeg",12345,"da39a3ee5e6b4b0d3255bfef95601890afd80709","jpg"
```

### Key Patterns for FAL Testing

1. **Test Storage Configuration**: Verify storage is properly configured and online
2. **Test File Retrieval**: Use `getFileObject()` to retrieve files from sys_file
3. **Test Folder Operations**: Verify folder access and structure
4. **Use CSV Fixtures**: Import sys_file_storage and sys_file test data
5. **Test Real Services**: Use container's ResourceFactory, don't mock

## PHPStan Type Safety in Functional Tests

### Handling $GLOBALS['TCA'] with PHPStan Level 9

PHPStan cannot infer types for runtime-configured `$GLOBALS` arrays. Use ignore annotations:

```php
// Configure TCA for RTE field
/** @var array<string, mixed> $tcaConfig */
$tcaConfig = [
    'type'           => 'text',
    'enableRichtext' => true,
];
// @phpstan-ignore-next-line offsetAccess.nonOffsetAccessible
$GLOBALS['TCA']['tt_content']['columns']['bodytext']['config'] = $tcaConfig;
```

### Type Assertions for Dynamic Arrays

When testing field arrays that are modified by reference:

```php
// ❌ PHPStan cannot verify this is still an array
self::assertStringContainsString('Test', $fieldArray['bodytext']);

// ✅ Add type assertions
self::assertArrayHasKey('bodytext', $fieldArray);
self::assertIsString($fieldArray['bodytext']);
self::assertStringContainsString('Test', $fieldArray['bodytext']);
```

### Avoiding Uninitialized Property Errors

Use factory methods instead of properties initialized in setUp():

```php
// ❌ PHPStan warns about uninitialized property
private MyService $subject;

protected function setUp(): void
{
    $this->subject = $this->get(MyService::class);
}

// ✅ Use factory method
private function createSubject(): MyService
{
    return $this->get(MyService::class);
}

public function testSomething(): void
{
    $subject = $this->createSubject();
    // Use $subject
}
```

### PHPStan Annotations for Functional Tests

Common patterns:

```php
// Ignore $GLOBALS access
// @phpstan-ignore-next-line offsetAccess.nonOffsetAccessible
$GLOBALS['TCA']['table']['columns']['field']['config'] = $config;

// Type hint service retrieval
/** @var DataHandler $dataHandler */
$dataHandler = $this->get(DataHandler::class);

// Type hint config arrays
/** @var array<string, mixed> $tcaConfig */
$tcaConfig = ['type' => 'text'];
```

## Backend User Context

Test with backend user:

```php
use TYPO3\TestingFramework\Core\Functional\Framework\Frontend\InternalRequest;

/**
 * @test
 */
public function editorCanEditRecord(): void
{
    $this->importCSVDataSet(__DIR__ . '/../Fixtures/be_users.csv');
    $this->importCSVDataSet(__DIR__ . '/../Fixtures/Products.csv');

    $this->setUpBackendUser(1); // uid from be_users.csv

    $dataHandler = $this->get(DataHandler::class);
    $dataHandler->start(
        [
            'tx_myext_domain_model_product' => [
                1 => ['title' => 'Updated Product']
            ]
        ],
        []
    );
    $dataHandler->process_datamap();

    self::assertEmpty($dataHandler->errorLog);
}
```

## File Operations

Test file handling:

```php
/**
 * @test
 */
public function uploadsFile(): void
{
    $fileStorage = $this->get(StorageRepository::class)->getDefaultStorage();

    $file = $fileStorage->addFile(
        __DIR__ . '/../Fixtures/Files/test.jpg',
        $fileStorage->getDefaultFolder(),
        'test.jpg'
    );

    self::assertFileExists($file->getForLocalProcessing(false));
}
```

## Configuration

### PHPUnit XML (Build/phpunit/FunctionalTests.xml)

```xml
<phpunit
    bootstrap="FunctionalTestsBootstrap.php"
    cacheResult="false"
    beStrictAboutTestsThatDoNotTestAnything="true"
    beStrictAboutOutputDuringTests="false"
    failOnDeprecation="true"
    failOnNotice="true"
    failOnWarning="true">
    <testsuites>
        <testsuite name="Functional tests">
            <directory>../../Tests/Functional/</directory>
        </testsuite>
    </testsuites>
    <php>
        <const name="TYPO3_TESTING_FUNCTIONAL_REMOVE_ERROR_HANDLER" value="true" />
        <env name="TYPO3_CONTEXT" value="Testing"/>
        <env name="typo3DatabaseDriver" value="pdo_sqlite"/>
    </php>
</phpunit>
```

**Key configuration notes:**

- **`bootstrap="FunctionalTestsBootstrap.php"`**: Always use `FunctionalTestsBootstrap.php` (not the vendor autoload). This bootstrap initializes the TYPO3 testing framework, creates temp directories, and sets up the test instance environment.
- **`beStrictAboutOutputDuringTests="false"`**: Required when testing ViewHelpers via `StandaloneView`, since rendering output triggers PHPUnit's output-during-tests strictness check. Without this, ViewHelper E2E tests will fail as risky.
- **`typo3DatabaseDriver` env var**: Use `pdo_sqlite` for fast local/CI testing without requiring a database server. SQLite is sufficient for most functional tests and eliminates external service dependencies. Use `mysqli` or `pdo_mysql` only when testing database-specific behavior.

> **⚠️ SQLite hides MySQL/MariaDB strict-mode bugs — don't claim "cross-DBMS green" from an SQLite-only run.** SQLite is permissive where a production MySQL/MariaDB in strict mode rejects. A functional/E2E suite that passes on SQLite can fail on MySQL for bugs SQLite never surfaces:
> - **Overlong values**: SQLite silently truncates a value longer than a `varchar(N)` column; MySQL strict mode rejects the insert (error → often a 500 on an AJAX-persist path that bypasses FormEngine's `max` eval). The test only fails on MySQL.
> - **`decimal(p,s)` scale**: SQLite stores the full float; MySQL rounds to the column scale, so the same entity round-trips a *different* value per DBMS (`0.123456789` → `0.12`). Assertions pinned to the full value pass on SQLite, fail on MySQL.
> - **Error-path coverage**: an insert that *only* fails under strict mode runs an error branch SQLite never reaches — where an uninitialized property (e.g. a reflection-constructed controller's injected logger) then fatals. The bug is real in production but invisible to SQLite tests.
>
> For any code with DB-specific behavior (length limits, decimal columns, strict-mode-sensitive inserts), run the **full functional + e2e suite on MariaDB** locally — `runTests.sh -s functional -d mariadb` — before asserting it's cross-DBMS clean, and add a MariaDB leg to CI (see `ci-workflows-meta-package.md`). A suite that has *only ever* run on SQLite silently rots for MySQL.

### Bootstrap (Build/phpunit/FunctionalTestsBootstrap.php)

```php
<?php

declare(strict_types=1);

call_user_func(static function () {
    $testbase = new \TYPO3\TestingFramework\Core\Testbase();
    $testbase->defineOriginalRootPath();
    $testbase->createDirectory(ORIGINAL_ROOT . 'typo3temp/var/tests');
    $testbase->createDirectory(ORIGINAL_ROOT . 'typo3temp/var/transient');
});
```

## Running Functional Tests with DDEV

Functional tests require the mysqli extension which is typically not available on the host system. Run tests inside the DDEV container:

```bash
# ❌ Wrong - mysqli not available on host PHP
./vendor/bin/phpunit -c Build/phpunit/FunctionalTests.xml

# ✅ Correct - Run inside DDEV with database credentials
ddev exec typo3DatabaseHost=db typo3DatabaseUsername=db typo3DatabasePassword=db typo3DatabaseName=db \
    ./vendor/bin/phpunit -c Build/phpunit/FunctionalTests.xml
```

### DDEV Database Configuration

When using DDEV, the database credentials are:
- **Host**: `db`
- **Username**: `db`
- **Password**: `db`
- **Database**: `db`

## Handling cHash Validation Errors

Frontend tests with query parameters may fail with "cHash empty" errors. Exclude test parameters from cHash validation:

```php
final class MyFunctionalTest extends FunctionalTestCase
{
    /**
     * Exclude test parameters from cHash validation to avoid errors.
     */
    protected array $configurationToUseInTestInstance = [
        'FE' => [
            'cacheHash' => [
                'excludedParameters' => ['test', 'myTestParam'],
            ],
        ],
    ];
}
```

## InternalRequest Query Parameters

`InternalRequest` does not parse URL-embedded query strings. Always use `withQueryParameters()`:

```php
// ❌ Wrong - Query string not parsed by InternalRequest
$request = new InternalRequest('http://localhost/?id=1&test=1');

// ✅ Correct - Use withQueryParameters()
$request = (new InternalRequest('http://localhost/'))
    ->withQueryParameters(['id' => 1, 'test' => 1]);

$response = $this->executeFrontendSubRequest($request);
```

## Singleton Reset for Test Isolation

Singleton classes must provide a `reset()` method to ensure fresh state between tests:

```php
// Singleton class with reset capability
final class Container
{
    private static ?self $instance = null;

    public static function get(): self
    {
        return self::$instance ??= new self();
    }

    public static function reset(): void
    {
        self::$instance = null;
    }
}

// In test setUp()
protected function setUp(): void
{
    parent::setUp();
    Container::reset(); // Ensure fresh state between tests
}
```

## Session State Isolation in Fixtures

When testing contexts or features that use session storage, disable sessions in test fixtures to prevent test pollution:

```csv
# tx_contexts_contexts.csv
# Column: use_session - Set to 0 to prevent session state from persisting between tests
"tx_contexts_contexts"
,"uid","pid","title","alias","type","type_conf","invert","use_session","disabled","hide_in_backend"
,1,1,"test get","testget","getparam","...",0,0,0,0
```

**Why this matters**: Session-based contexts can cause flaky tests when session state persists between test runs. Always set `use_session=0` in fixtures unless specifically testing session functionality.

## Safe tearDown Pattern

When `setUp()` might fail (e.g., database connection issues), `tearDown()` should handle incomplete initialization:

```php
protected function tearDown(): void
{
    // Clean up test-specific globals
    unset($_GET['test']);

    // Handle cases where setUp() didn't complete
    try {
        parent::tearDown();
    } catch (Error) {
        // Setup didn't complete, nothing to tear down
    }
}
```

## Site Configuration (TYPO3 v12+)

Use `SiteWriter` instead of the deprecated `writeSiteConfiguration()`:

```php
use TYPO3\CMS\Core\Configuration\SiteWriter;

protected function setUp(): void
{
    parent::setUp();

    $this->importCSVDataSet(__DIR__ . '/Fixtures/pages.csv');

    // ❌ Deprecated in TYPO3 v12
    // $this->writeSiteConfiguration('test', ['rootPageId' => 1, 'base' => '/']);

    // ✅ TYPO3 v12+ with SiteWriter
    $siteWriter = $this->get(SiteWriter::class);
    $siteWriter->createNewBasicSite('website-local', 1, 'http://localhost/');

    // Set up TypoScript for frontend rendering
    $this->setUpFrontendRootPage(1, [
        'EXT:my_extension/Tests/Functional/Fixtures/TypoScript/Basic.typoscript',
    ]);
}
```

## Running Functional Tests

```bash
# Via runTests.sh
Build/Scripts/runTests.sh -s functional

# Via PHPUnit directly (on host with mysqli)
vendor/bin/phpunit -c Build/phpunit/FunctionalTests.xml

# Via DDEV (recommended)
ddev exec typo3DatabaseHost=db typo3DatabaseUsername=db typo3DatabasePassword=db typo3DatabaseName=db \
    vendor/bin/phpunit -c Build/phpunit/FunctionalTests.xml

# Via Composer
composer ci:test:php:functional

# With specific database driver
typo3DatabaseDriver=pdo_mysql vendor/bin/phpunit -c Build/phpunit/FunctionalTests.xml

# Single test
vendor/bin/phpunit Tests/Functional/Domain/Repository/ProductRepositoryTest.php
```

## Functional Test Limitations

The functional test framework provides a database and DI container but does **NOT** provide a full TYPO3 frontend (TSFE) context. This means certain operations are unavailable or require extra setup:

### What Does NOT Work

| Operation | Error (v13) | Error (v14) | Alternative |
|-----------|-------------|-------------|-------------|
| `$cObj->parseFunc($html, null, '< lib.parseFunc_RTE')` | `parseFunc without any configuration` | `No valid attribute "applicationType"` | Unit test with mocked cObj + E2E test |
| TypoScript reference resolution (`< lib.*`) | LogicException | LogicException | Provide inline TS config array instead of reference |
| `typoLink_URL()` with page UIDs | Missing site config | Missing TSFE | Write YAML site config to filesystem in setUp |
| `$GLOBALS['TSFE']` access | null | null | Use `FrontendRequestHandler` for full rendering |

### Setting `$GLOBALS['TYPO3_REQUEST']`

**Caution:** Setting `$GLOBALS['TYPO3_REQUEST']` in `setUp()` affects ALL tests in the class and can cause unexpected side effects:
- v14 requires `applicationType` attribute (use `ApplicationType::FRONTEND`)
- Existing tests may break because TYPO3 enables additional processing paths when the global is present
- **Best practice:** Set the global only in specific test methods that need it, with `try/finally` cleanup:

```php
public function testThatNeedsRequest(): void
{
    $GLOBALS['TYPO3_REQUEST'] = $this->request
        ->withAttribute('applicationType', ApplicationType::FRONTEND);

    try {
        // test code
    } finally {
        unset($GLOBALS['TYPO3_REQUEST']);
    }
}
```

### When to Use Unit Tests Instead

If your code calls `parseFunc()`, `typoLink()`, or any method that requires the full TypoScript/TSFE pipeline, write:
1. **Unit test** with a mocked `ContentObjectRenderer` to verify your code calls the right method with the right arguments
2. **E2E test** to verify the actual rendered output in a real TYPO3 frontend

This split gives you fast feedback (unit) plus real-world confidence (E2E) without fighting the functional test framework.

## Mocking ExtensionConfiguration with GeneralUtility::addInstance()

In functional tests, `ExtensionConfiguration` is resolved from the DI container. To substitute it with a mock (e.g., to control configuration values without a real `ext_conf_template.txt`), use `GeneralUtility::addInstance()`:

```php
use TYPO3\CMS\Core\Configuration\ExtensionConfiguration;
use TYPO3\CMS\Core\Utility\GeneralUtility;

protected function setUp(): void
{
    parent::setUp();

    $extensionConfigurationMock = $this->createMock(ExtensionConfiguration::class);
    $extensionConfigurationMock
        ->method('get')
        ->willReturnCallback(function (string $extension, string $key): mixed {
            return match ($key) {
                'enableFeature' => true,
                'timeout' => 30,
                default => null,
            };
        });

    // Register the mock so TYPO3's DI resolves it instead of the real instance
    GeneralUtility::addInstance(ExtensionConfiguration::class, $extensionConfigurationMock);
}
```

**Why this is needed:** Functional tests bootstrap a real TYPO3 instance, so `$this->get(ExtensionConfiguration::class)` returns the actual service. `GeneralUtility::addInstance()` queues a replacement that is consumed on the next `makeInstance()` call for that class.

## Repository Instance Cache Pattern

When a repository maintains an internal object cache (non-static), each test gets a fresh repository instance via `$this->get()`, which means the cache is empty at the start of each test. This eliminates the need for reflection-based cache resets between tests:

```php
final class TranslationRepository
{
    /** @var array<string, Translation> */
    private array $cache = [];

    public function findByKey(string $key): ?Translation
    {
        if (isset($this->cache[$key])) {
            return $this->cache[$key];
        }

        // ... query database ...
        $this->cache[$key] = $result;
        return $result;
    }
}
```

```php
// In functional tests — no cache reset needed
protected function setUp(): void
{
    parent::setUp();
    // Each call to $this->get() returns a fresh instance with empty cache
    $this->subject = $this->get(TranslationRepository::class);
}
```

**Key insight:** Use instance (non-static) properties for repository caches. Static caches persist across tests and require reflection hacks (`ReflectionProperty::setValue(null, [])`) to reset, making tests fragile and coupled to implementation details.

## ViewHelper E2E Tests with StandaloneView

Test Fluid ViewHelpers end-to-end by rendering templates through `StandaloneView`. This verifies the full rendering pipeline including namespace registration, argument handling, and output:

```php
use TYPO3\CMS\Fluid\View\StandaloneView;

final class MyViewHelperTest extends FunctionalTestCase
{
    protected array $testExtensionsToLoad = [
        'vendor/my-extension',
    ];

    #[Test]
    public function viewHelperRendersExpectedOutput(): void
    {
        $view = $this->get(StandaloneView::class);
        $view->setTemplateSource(
            '{namespace myext=Vendor\MyExtension\ViewHelpers}'
            . '<myext:myViewHelper argument="value" />'
        );

        $result = $view->render();

        self::assertStringContainsString('expected output', $result);
    }

    #[Test]
    public function viewHelperHandlesEmptyArgument(): void
    {
        $view = $this->get(StandaloneView::class);
        $view->setTemplateSource(
            '{namespace myext=Vendor\MyExtension\ViewHelpers}'
            . '<myext:myViewHelper argument="" />'
        );

        $result = $view->render();

        self::assertSame('', trim($result));
    }
}
```

**Key patterns:**

1. **`setTemplateSource()`**: Inline template string avoids file dependencies. Register the ViewHelper namespace with `{namespace myext=...}` at the start of the template.
2. **`beStrictAboutOutputDuringTests="false"`**: Required in `FunctionalTests.xml` because `StandaloneView::render()` produces output that PHPUnit's strict mode would flag as risky.
3. **Test both success and edge cases**: Verify expected output, empty arguments, missing arguments, and invalid input.

## Resources

- [TYPO3 Functional Testing Documentation](https://docs.typo3.org/m/typo3/reference-coreapi/main/en-us/Testing/FunctionalTests.html)
- [Testing Framework](https://github.com/typo3/testing-framework)
- [CSV Fixture Format](https://docs.typo3.org/m/typo3/reference-coreapi/main/en-us/Testing/FunctionalTests.html#importing-data)
