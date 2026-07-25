# Unit Testing in TYPO3

Unit tests are fast, isolated tests that verify individual components without external dependencies like databases or file systems.

## When to Use Unit Tests

✅ **Ideal for:**
- Testing pure business logic
- Validators, calculators, transformers
- Value objects and DTOs
- Utilities and helper functions
- Domain models without persistence
- **Controllers with dependency injection** (new in TYPO3 13)
- **Services with injected dependencies**

❌ **Not suitable for:**
- Database operations (use functional tests)
- File system operations
- Methods using `BackendUtility` or global state
- Complex TYPO3 framework integration
- Parent class behavior from framework classes

## Base Class

All unit tests extend `TYPO3\TestingFramework\Core\Unit\UnitTestCase`:

```php
<?php

declare(strict_types=1);

namespace Vendor\Extension\Tests\Unit\Domain\Validator;

use PHPUnit\Framework\Attributes\Test;
use TYPO3\TestingFramework\Core\Unit\UnitTestCase;
use Vendor\Extension\Domain\Validator\EmailValidator;

/**
 * Unit tests for EmailValidator.
 *
 * @covers \Vendor\Extension\Domain\Validator\EmailValidator
 */
final class EmailValidatorTest extends UnitTestCase
{
    private EmailValidator $subject;

    protected function setUp(): void
    {
        parent::setUp();
        $this->subject = new EmailValidator();
    }

    #[Test]
    public function validEmailPassesValidation(): void
    {
        $result = $this->subject->validate('user@example.com');

        self::assertFalse($result->hasErrors());
    }

    #[Test]
    public function invalidEmailFailsValidation(): void
    {
        $result = $this->subject->validate('invalid-email');

        self::assertTrue($result->hasErrors());
    }
}
```

> **Note:** TYPO3 13+ with PHPUnit 11/12 uses PHP attributes (`#[Test]`) instead of `@test` annotations.
> Use `private` instead of `protected` for properties when possible (better encapsulation).

## Testing with Dependency Injection (TYPO3 13+)

Modern TYPO3 13 controllers and services use constructor injection. Here's how to test them:

### Basic Constructor Injection Test

```php
<?php

declare(strict_types=1);

namespace Vendor\Extension\Tests\Unit\Controller;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\MockObject\MockObject;
use TYPO3\CMS\Core\Resource\ResourceFactory;
use TYPO3\TestingFramework\Core\Unit\UnitTestCase;
use Vendor\Extension\Controller\ImageController;

final class ImageControllerTest extends UnitTestCase
{
    private ImageController $subject;

    /** @var ResourceFactory&MockObject */
    private ResourceFactory $resourceFactoryMock;

    protected function setUp(): void
    {
        parent::setUp();

        /** @var ResourceFactory&MockObject $resourceFactoryMock */
        $resourceFactoryMock = $this->createMock(ResourceFactory::class);

        $this->resourceFactoryMock = $resourceFactoryMock;
        $this->subject             = new ImageController($this->resourceFactoryMock);
    }

    #[Test]
    public function getFileRetrievesFileFromFactory(): void
    {
        $fileId = 123;
        $fileMock = $this->createMock(\TYPO3\CMS\Core\Resource\File::class);

        $this->resourceFactoryMock
            ->expects(self::once())
            ->method('getFileObject')
            ->with($fileId)
            ->willReturn($fileMock);

        $result = $this->subject->getFile($fileId);

        self::assertSame($fileMock, $result);
    }
}
```

### Multiple Dependencies with Intersection Types

PHPUnit mocks require proper type hints using intersection types for PHPStan compliance:

```php
<?php

declare(strict_types=1);

namespace Vendor\Extension\Tests\Unit\Controller;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\MockObject\MockObject;
use TYPO3\CMS\Core\Log\LogManager;
use TYPO3\CMS\Core\Resource\ResourceFactory;
use TYPO3\TestingFramework\Core\Unit\UnitTestCase;
use Vendor\Extension\Controller\ImageController;
use Vendor\Extension\Utils\ImageProcessor;

final class ImageControllerTest extends UnitTestCase
{
    private ImageController $subject;

    /** @var ResourceFactory&MockObject */
    private ResourceFactory $resourceFactoryMock;

    /** @var ImageProcessor&MockObject */
    private ImageProcessor $imageProcessorMock;

    /** @var LogManager&MockObject */
    private LogManager $logManagerMock;

    protected function setUp(): void
    {
        parent::setUp();

        /** @var ResourceFactory&MockObject $resourceFactoryMock */
        $resourceFactoryMock = $this->createMock(ResourceFactory::class);

        /** @var ImageProcessor&MockObject $imageProcessorMock */
        $imageProcessorMock = $this->createMock(ImageProcessor::class);

        /** @var LogManager&MockObject $logManagerMock */
        $logManagerMock = $this->createMock(LogManager::class);

        $this->resourceFactoryMock = $resourceFactoryMock;
        $this->imageProcessorMock  = $imageProcessorMock;
        $this->logManagerMock      = $logManagerMock;

        $this->subject = new ImageController(
            $this->resourceFactoryMock,
            $this->imageProcessorMock,
            $this->logManagerMock,
        );
    }

    #[Test]
    public function processImageUsesInjectedProcessor(): void
    {
        $fileMock = $this->createMock(\TYPO3\CMS\Core\Resource\File::class);
        $processedFileMock = $this->createMock(\TYPO3\CMS\Core\Resource\ProcessedFile::class);

        $this->imageProcessorMock
            ->expects(self::once())
            ->method('process')
            ->with($fileMock, ['width' => 800])
            ->willReturn($processedFileMock);

        $result = $this->subject->processImage($fileMock, ['width' => 800]);

        self::assertSame($processedFileMock, $result);
    }
}
```

**Key Points:**
- Use intersection types: `ResourceFactory&MockObject` for proper PHPStan type checking
- Assign mocks to properly typed variables before passing to constructor
- This pattern works with PHPUnit 11/12 and PHPStan Level 10

### Handling $GLOBALS and Singleton State

Some TYPO3 components still use global state. Handle this properly:

```php
final class BackendControllerTest extends UnitTestCase
{
    protected bool $resetSingletonInstances = true;

    #[Test]
    public function checksBackendUserPermissions(): void
    {
        // Mock backend user
        $backendUserMock = $this->createMock(BackendUserAuthentication::class);
        $backendUserMock->method('isAdmin')->willReturn(true);

        $GLOBALS['BE_USER'] = $backendUserMock;

        $result = $this->subject->hasAccess();

        self::assertTrue($result);
    }

    #[Test]
    public function returnsFalseWhenNoBackendUser(): void
    {
        $GLOBALS['BE_USER'] = null;

        $result = $this->subject->hasAccess();

        self::assertFalse($result);
    }
}
```

**Important:** Set `protected bool $resetSingletonInstances = true;` when tests interact with TYPO3 singletons to prevent test pollution.

### `setSingletonInstance()` vs `addInstance()` for `SingletonInterface`

`GeneralUtility::makeInstance()` honours two registries:

| API | Lifetime | Use for |
|-----|----------|---------|
| `GeneralUtility::addInstance($class, $obj)` | **Drains** -- one `makeInstance($class)` consumes the entry, the next call returns a fresh instance | Non-singleton dependencies, one-shot replacements |
| `GeneralUtility::setSingletonInstance($class, $obj)` | **Persists** -- every subsequent `makeInstance($class)` returns the same registered object until reset | Anything implementing `\TYPO3\CMS\Core\SingletonInterface` |

`PageRenderer`, `BackendUserAuthentication` and `LanguageService` all implement `SingletonInterface`. Registering them with `addInstance()` works for the first call inside the subject under test and silently breaks on the second:

```php
// WRONG -- second makeInstance(PageRenderer::class) returns a real PageRenderer
GeneralUtility::addInstance(PageRenderer::class, $pageRendererMock);

// CORRECT -- mock persists for the whole test
GeneralUtility::setSingletonInstance(PageRenderer::class, $pageRendererMock);
```

Pair this with `protected bool $resetSingletonInstances = true;` so the mock is cleared between tests.

## Mocking Dependencies

Use PHPUnit's built-in mocking (PHPUnit 11/12):

```php
<?php

declare(strict_types=1);

namespace Vendor\Extension\Tests\Unit\Service;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\MockObject\MockObject;
use TYPO3\TestingFramework\Core\Unit\UnitTestCase;
use Vendor\Extension\Domain\Model\User;
use Vendor\Extension\Domain\Repository\UserRepository;
use Vendor\Extension\Service\UserService;

final class UserServiceTest extends UnitTestCase
{
    private UserService $subject;

    /** @var UserRepository&MockObject */
    private UserRepository $repositoryMock;

    protected function setUp(): void
    {
        parent::setUp();

        /** @var UserRepository&MockObject $repositoryMock */
        $repositoryMock = $this->createMock(UserRepository::class);

        $this->repositoryMock = $repositoryMock;
        $this->subject        = new UserService($this->repositoryMock);
    }

    #[Test]
    public function findsUserByEmail(): void
    {
        $email = 'test@example.com';
        $user  = new User('John');

        $this->repositoryMock
            ->expects(self::once())
            ->method('findByEmail')
            ->with($email)
            ->willReturn($user);

        $result = $this->subject->getUserByEmail($email);

        self::assertSame('John', $result->getName());
    }

    #[Test]
    public function throwsExceptionWhenUserNotFound(): void
    {
        $email = 'nonexistent@example.com';

        $this->repositoryMock
            ->method('findByEmail')
            ->with($email)
            ->willReturn(null);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('User not found');

        $this->subject->getUserByEmail($email);
    }
}
```

> **Note:** TYPO3 13+ with PHPUnit 11/12 uses `createMock()` instead of Prophecy.
> Prophecy is deprecated and should not be used in new tests.
>
> **Multi-version dependencies:** When mocking interfaces from dependencies with `^major1 || ^major2` constraints, verify mocked methods exist on the interface in all supported versions. See `mock-validity.md` for patterns including callback signature verification and adapter pattern testing.

## PHPUnit 12 Compatibility

PHPUnit 12 introduces stricter defaults. Follow these patterns to avoid notices and deprecations.

**Static assertions:** call assertions via `self::` (`self::assertSame(...)`), not `$this->assertSame(...)` — PHPUnit 12 treats the assertion methods as static, and the instance form is deprecated. Every example in this file uses `self::`.

### Mock vs Stub Discipline (PHPUnit 12+)

PHPUnit 12 reports notices when mock objects have no expectations configured. The correct fix is to use the right test double for the job.

**Rule:** Use `createStub()` when you only need return values. Use `createMock()` only when you need to verify method calls with `expects()`.

```php
// WRONG - creates a mock but sets no expectations (triggers PHPUnit notice)
$model = $this->createMock(Model::class);
$model->method('getName')->willReturn('test');

// CORRECT - use stub when no expectations needed
$model = $this->createStub(Model::class);
$model->method('getName')->willReturn('test');

// CORRECT - use mock when verifying calls
$logger = $this->createMock(LoggerInterface::class);
$logger->expects(self::once())->method('warning');
```

**Detection:** Run tests with `--display-phpunit-notices` flag. Any "No expectations were configured for the mock object" notice indicates a mock that should be a stub.

**Decision guide:**

| Scenario | Use | Method |
|----------|-----|--------|
| Only need return values (`->method()->willReturn()`) | `createStub()` | No expectations |
| Satisfying a type hint for DI | `createStub()` | No expectations |
| Verifying a method was called | `createMock()` | `->expects(self::once())` |
| Verifying call count or arguments | `createMock()` | `->expects()->with()` |

**Example with stubs and mocks in the same test class:**

```php
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\MockObject\Stub;

#[CoversClass(MyController::class)]
final class MyControllerTest extends UnitTestCase
{
    private MyController $subject;

    /** @var SomeDependency&Stub */
    private SomeDependency $dependencyStub;

    /** @var LoggerInterface&MockObject */
    private LoggerInterface $loggerMock;

    protected function setUp(): void
    {
        parent::setUp();
        // Stub - only provides return values, no expectations
        $this->dependencyStub = $this->createStub(SomeDependency::class);
        $this->dependencyStub->method('getValue')->willReturn('test');

        // Mock - will verify method calls in tests
        /** @var LoggerInterface&MockObject $loggerMock */
        $loggerMock = $this->createMock(LoggerInterface::class);
        $this->loggerMock = $loggerMock;

        $this->subject = new MyController($this->dependencyStub, $this->loggerMock);
    }

    #[Test]
    public function processLogsWarningOnEmptyInput(): void
    {
        $this->loggerMock->expects(self::once())->method('warning');

        $this->subject->process('');
    }
}
```

> **Note:** Stubs created with `createStub()` do not need `MockObject` intersection types in PHPDoc. The `&MockObject` intersection is only for objects created with `createMock()`. If you want static analysis tools (PHPStan, Psalm) to understand calls like `method()` / `willReturn()` on a stub variable, you can add an explicit intersection with `Stub`, for example:
> `/** @var SomeDependency&\PHPUnit\Framework\MockObject\Stub $dependencyStub */`.

**Fallback - `#[AllowMockObjectsWithoutExpectations]`:**

> **Warning:** The `#[AllowMockObjectsWithoutExpectations]` attribute is only available in PHPUnit 12+. It does **not** exist in PHPUnit 11 (used in CI for PHP 8.2) and will cause a fatal error. Only use this fallback when the project runs PHPUnit 12 exclusively.

When migrating existing test classes with many mocks, you can temporarily suppress the notice with the class-level attribute instead of converting all mocks to stubs at once:

```php
use PHPUnit\Framework\Attributes\AllowMockObjectsWithoutExpectations;

#[AllowMockObjectsWithoutExpectations]
final class LegacyControllerTest extends UnitTestCase
{
    // Existing mocks without expectations are allowed
    // TODO: Migrate createMock() to createStub() where no expects() is used
}
```

This attribute should be treated as **technical debt** and removed once the test class is migrated to use `createStub()` properly.

### Deprecated Type Assertions

PHPUnit 12 deprecates generic `isType()` in favor of specific methods:

| Deprecated | Use Instead |
|------------|-------------|
| `$this->isType('string')` | `$this->isString()` |
| `$this->isType('int')` | `$this->isInt()` |
| `$this->isType('array')` | `$this->isArray()` |
| `$this->isType('bool')` | `$this->isBool()` |
| `$this->isType('float')` | `$this->isFloat()` |
| `$this->isType('null')` | `$this->isNull()` |
| `$this->isType('object')` | `$this->isInstanceOf(ClassName::class)` |

### Constructor Dependency Drift

When a class constructor gains new dependencies, all tests instantiating it will fail with `TypeError`. Use a factory method pattern to centralize instantiation:

```php
final class MyControllerTest extends TestCase
{
    private MyController $subject;
    private DependencyA&MockObject $depAMock;
    private DependencyB&MockObject $depBMock;
    private DependencyC&MockObject $depCMock; // Added later

    protected function setUp(): void
    {
        parent::setUp();

        $this->depAMock = $this->createMock(DependencyA::class);
        $this->depBMock = $this->createMock(DependencyB::class);
        $this->depCMock = $this->createMock(DependencyC::class);

        // Single point of instantiation - update here when constructor changes
        $this->subject = $this->createSubject();
    }

    /**
     * Factory method - single place to update when dependencies change.
     */
    private function createSubject(): MyController
    {
        return new MyController(
            $this->depAMock,
            $this->depBMock,
            $this->depCMock, // Add new dependencies here
        );
    }
}
```

**Benefits:**
- One place to update when constructor signature changes
- Tests clearly show all dependencies
- Easy to create subject with custom mocks in specific tests

## Coverage Attribution with #[CoversClass]

When `beStrictAboutCoverageMetadata` is enabled (recommended), PHPUnit restricts coverage reporting to classes listed in `#[CoversClass]`. Code executed during a test but not listed in `#[CoversClass]` will not appear in the coverage report for that test.

If your test exercises DTOs or value objects indirectly (e.g., a service test creates DTO instances), add `#[CoversClass]` for ALL exercised classes:

```php
// DiagnosticServiceTest creates DiagnosticCheck and DiagnosticResult
// instances via DiagnosticService — list them all for coverage
#[CoversClass(DiagnosticService::class)]
#[CoversClass(DiagnosticCheck::class)]
#[CoversClass(DiagnosticResult::class)]
#[CoversClass(Severity::class)]
final class DiagnosticServiceTest extends TestCase
```

Without this, coverage tools (e.g., codecov) may report 0% for the DTOs even though they are fully exercised by the service test.

## Configuration

### PHPUnit XML (Build/phpunit/UnitTests.xml)

```xml
<phpunit
    bootstrap="../../vendor/autoload.php"
    cacheResult="false"
    beStrictAboutTestsThatDoNotTestAnything="true"
    beStrictAboutOutputDuringTests="true"
    failOnDeprecation="true"
    failOnNotice="true"
    failOnWarning="true"
    failOnRisky="true">
    <testsuites>
        <testsuite name="Unit tests">
            <directory>../../Tests/Unit/</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

### Coverage Exclusion Review

When `phpunit.xml` excludes directories from coverage (like `Domain/Model`), verify the exclusion is justified:

1. **Justified exclusions**: Truly trivial getters/setters, pure data containers (DTOs/Value Objects with no logic)
2. **Unjustified exclusions**: Models with business logic, validation, computed properties, or state transitions
3. **Cross-check with mutation testing**: The same exclusion in `infection.json5` / `infection.json.dist` should also be justified

**Audit command:**

```bash
# Check what's excluded from coverage
grep -A 5 '<exclude>' Build/phpunit.xml Build/phpunit/UnitTests.xml 2>/dev/null

# Check what's excluded from mutation testing
grep -A 10 '"excludePaths"' infection.json5 infection.json.dist 2>/dev/null

# Find models with non-trivial logic that might be wrongly excluded
grep -rn 'function [a-z].*(' Classes/Domain/Model/ | grep -v 'get\|set\|is\|has'
```

## Testing PHP Syntax Variants

When testing code that parses or analyzes PHP (like Extension Scanner matchers), test all syntax variants that PHP allows. Different syntaxes may be parsed differently.

### Dynamic Method Calls

PHP supports multiple forms of dynamic method calls:

```php
// DataProvider for testing dynamic call handling
public static function dynamicCallSyntaxDataProvider(): array
{
    return [
        // Standard dynamic method call - variable holds method name
        'dynamic method call with variable' => [
            '<?php
            $methodName = "someMethod";
            $object->$methodName();',
            [], // no match expected, must not crash
        ],
        // Expression-based dynamic call - expression evaluated for method name
        'dynamic method call with expression' => [
            '<?php
            $object->{$this->getMethodName()}();',
            [], // no match expected, must not crash
        ],
        // Curly brace syntax with variable
        'dynamic method call with curly brace variable' => [
            '<?php
            $object->{$methodName}();',
            [], // no match expected, must not crash
        ],
    ];
}
```

**Why This Matters**: PhpParser represents these differently:
- `$obj->$var()` → `$node->name` is `PhpParser\Node\Expr\Variable`
- `$obj->{$expr}()` → `$node->name` is `PhpParser\Node\Expr\MethodCall` or other expression
- `$obj->method()` → `$node->name` is `PhpParser\Node\Identifier`

Code assuming `$node->name` is always an `Identifier` will crash on dynamic calls.

### Dynamic Function Calls

```php
'dynamic function call' => [
    '<?php
    $func = "myFunction";
    $func();',
    [],
],
'variable function with call_user_func' => [
    '<?php
    call_user_func($callback, $arg);',
    [],
],
```

### Static Method Variants

```php
'dynamic static method call' => [
    '<?php
    $method = "staticMethod";
    SomeClass::$method();',
    [],
],
'variable class static call' => [
    '<?php
    $class = "SomeClass";
    $class::staticMethod();',
    [],
],
```

### Testing Pattern

Always include regression tests with clear comments:

```php
// Regression test for issue #108413: $object->$var() syntax must not crash
'no match for dynamic method call with variable' => [
    [
        'Foo->aMethod' => [
            'numberOfMandatoryArguments' => 0,
            'maximumNumberOfArguments' => 2,
            'restFiles' => ['Foo-1.rst'],
        ],
    ],
    '<?php
    $methodName = "someMethod";
    $someVar->$methodName();',
    [], // no match, must not crash
],
```

## Running Unit Tests

```bash
# Via runTests.sh
Build/Scripts/runTests.sh -s unit

# Via PHPUnit directly
vendor/bin/phpunit -c Build/phpunit/UnitTests.xml

# Via Composer
composer ci:test:php:unit

# Single test file
vendor/bin/phpunit Tests/Unit/Domain/Validator/EmailValidatorTest.php

# Single test method
vendor/bin/phpunit --filter testValidEmail
```

## Troubleshooting Common Issues

### PHPStan Errors with Mocks

**Problem**: PHPStan complains about mock type mismatches.
```
Method expects ResourceFactory but got ResourceFactory&MockObject
```

**Solution**: Use intersection type annotations:
```php
/** @var ResourceFactory&MockObject */
private ResourceFactory $resourceFactoryMock;

protected function setUp(): void
{
    parent::setUp();

    /** @var ResourceFactory&MockObject $resourceFactoryMock */
    $resourceFactoryMock = $this->createMock(ResourceFactory::class);

    $this->resourceFactoryMock = $resourceFactoryMock;
    $this->subject = new MyController($this->resourceFactoryMock);
}
```

### Undefined Array Key Warnings

**Problem**: Tests throw warnings about missing array keys.
```
Undefined array key "fileId"
```

**Solution**: Always provide all required keys in mock arrays:
```php
// ❌ Incomplete mock data
$requestMock->method('getQueryParams')->willReturn([
    'fileId' => 123,
]);

// ✅ Complete mock data
$requestMock->method('getQueryParams')->willReturn([
    'fileId' => 123,
    'table'  => 'tt_content',
    'P'      => [],
]);
```

### Tests Requiring Functional Setup

**Problem**: Unit tests fail with cache or framework errors.
```
NoSuchCacheException: A cache with identifier "runtime" does not exist.
```

**Solution**: Identify methods that require TYPO3 framework infrastructure and move them to functional tests:
- Methods using `BackendUtility::getPagesTSconfig()`
- Methods calling parent class framework behavior
- Methods requiring global state like `$GLOBALS['TYPO3_CONF_VARS']`

Add comments explaining the limitation:
```php
// Note: getMaxDimensions tests require functional test setup due to BackendUtility dependency
// These are better tested in functional tests
```

### Uninitialised `Environment` / `NormalizedParams::createFromServerParams`

**Problem**: Code migrated from the deprecated `GeneralUtility::getIndpEnv()` to `NormalizedParams::createFromServerParams($_SERVER, $sysConf)` fails with a `TypeError` in unit tests:
```
TypeError: TYPO3\CMS\Core\Core\Environment::getCurrentScript():
Return value must be of type string, null returned
```

**Solution**: Call `Environment::initialize()` once in `Tests/bootstrap.php`. See [Test Environment Guards](test-environment-guards.md#initialise-environment-in-testsbootstrapphp) for the full bootstrap snippet and the matching defensive read pattern needed when `phpunit.xml` has `backupGlobals="true"`.

### Singleton State Pollution

**Problem**: Tests interfere with each other due to singleton state.

**Solution**: Enable singleton reset in your test class:
```php
final class MyControllerTest extends UnitTestCase
{
    protected bool $resetSingletonInstances = true;

    #[Test]
    public function testWithGlobals(): void
    {
        $GLOBALS['BE_USER'] = $this->createMock(BackendUserAuthentication::class);
        // Test will clean up automatically
    }
}
```

### Exception Flow Issues

**Problem**: Catching and re-throwing exceptions masks the original error.
```php
// ❌ Inner exception caught by outer catch
try {
    $file = $this->factory->getFile($id);
    if ($file->isDeleted()) {
        throw new RuntimeException('Deleted', 1234);
    }
} catch (Exception $e) {
    throw new RuntimeException('Not found', 5678);
}
```

**Solution**: Separate concerns - catch only what you need:
```php
// ✅ Proper exception flow
try {
    $file = $this->factory->getFile($id);
} catch (Exception $e) {
    throw new RuntimeException('Not found', 5678, $e);
}

if ($file->isDeleted()) {
    throw new RuntimeException('Deleted', 1234);
}
```

## Testing DataHandler Hooks

DataHandler hooks (`processDatamap_*`, `processCmdmap_*`) require careful testing as they interact with TYPO3 globals.

### Example: Testing processDatamap_postProcessFieldArray

```php
<?php

declare(strict_types=1);

namespace Vendor\Extension\Tests\Unit\Database;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\MockObject\MockObject;
use TYPO3\CMS\Core\Configuration\ExtensionConfiguration;
use TYPO3\CMS\Core\Context\Context;
use TYPO3\CMS\Core\DataHandling\DataHandler;
use TYPO3\CMS\Core\Http\RequestFactory;
use TYPO3\CMS\Core\Log\LogManager;
use TYPO3\CMS\Core\Log\Logger;
use TYPO3\CMS\Core\Resource\DefaultUploadFolderResolver;
use TYPO3\CMS\Core\Resource\ResourceFactory;
use TYPO3\TestingFramework\Core\Unit\UnitTestCase;
use Vendor\Extension\Database\MyDataHandlerHook;

/**
 * Unit tests for MyDataHandlerHook.
 *
 * @covers \Vendor\Extension\Database\MyDataHandlerHook
 */
final class MyDataHandlerHookTest extends UnitTestCase
{
    protected bool $resetSingletonInstances = true;

    private MyDataHandlerHook $subject;

    /** @var ExtensionConfiguration&MockObject */
    private ExtensionConfiguration $extensionConfigurationMock;

    /** @var LogManager&MockObject */
    private LogManager $logManagerMock;

    /** @var ResourceFactory&MockObject */
    private ResourceFactory $resourceFactoryMock;

    /** @var Context&MockObject */
    private Context $contextMock;

    /** @var RequestFactory&MockObject */
    private RequestFactory $requestFactoryMock;

    /** @var DefaultUploadFolderResolver&MockObject */
    private DefaultUploadFolderResolver $uploadFolderResolverMock;

    /** @var Logger&MockObject */
    private Logger $loggerMock;

    protected function setUp(): void
    {
        parent::setUp();

        // Create all required mocks with intersection types for PHPStan compliance
        /** @var ExtensionConfiguration&MockObject $extensionConfigurationMock */
        $extensionConfigurationMock = $this->createMock(ExtensionConfiguration::class);

        /** @var LogManager&MockObject $logManagerMock */
        $logManagerMock = $this->createMock(LogManager::class);

        /** @var ResourceFactory&MockObject $resourceFactoryMock */
        $resourceFactoryMock = $this->createMock(ResourceFactory::class);

        /** @var Context&MockObject $contextMock */
        $contextMock = $this->createMock(Context::class);

        /** @var RequestFactory&MockObject $requestFactoryMock */
        $requestFactoryMock = $this->createMock(RequestFactory::class);

        /** @var DefaultUploadFolderResolver&MockObject $uploadFolderResolverMock */
        $uploadFolderResolverMock = $this->createMock(DefaultUploadFolderResolver::class);

        /** @var Logger&MockObject $loggerMock */
        $loggerMock = $this->createMock(Logger::class);

        // Configure extension configuration mock with willReturnCallback
        $extensionConfigurationMock
            ->method('get')
            ->willReturnCallback(function ($extension, $key) {
                if ($extension === 'my_extension') {
                    return match ($key) {
                        'enableFeature' => true,
                        'timeout'       => 30,
                        default         => null,
                    };
                }

                return null;
            });

        // Configure log manager to return logger mock
        $logManagerMock
            ->method('getLogger')
            ->with(MyDataHandlerHook::class)
            ->willReturn($loggerMock);

        // Assign mocks to properties
        $this->extensionConfigurationMock = $extensionConfigurationMock;
        $this->logManagerMock             = $logManagerMock;
        $this->resourceFactoryMock        = $resourceFactoryMock;
        $this->contextMock                = $contextMock;
        $this->requestFactoryMock         = $requestFactoryMock;
        $this->uploadFolderResolverMock   = $uploadFolderResolverMock;
        $this->loggerMock                 = $loggerMock;

        // Create subject with all dependencies
        $this->subject = new MyDataHandlerHook(
            $this->extensionConfigurationMock,
            $this->logManagerMock,
            $this->resourceFactoryMock,
            $this->contextMock,
            $this->requestFactoryMock,
            $this->uploadFolderResolverMock,
        );
    }

    #[Test]
    public function constructorInitializesWithDependencyInjection(): void
    {
        // Verify subject was created successfully with all dependencies
        self::assertInstanceOf(MyDataHandlerHook::class, $this->subject);
    }

    #[Test]
    public function processDatamapPostProcessFieldArrayHandlesFieldCorrectly(): void
    {
        $status     = 'update';
        $table      = 'tt_content';
        $id         = '123';
        $fieldArray = ['bodytext' => '<p>Content with processing</p>'];

        /** @var DataHandler&MockObject $dataHandlerMock */
        $dataHandlerMock = $this->createMock(DataHandler::class);

        // Mock TCA configuration for RTE field
        $GLOBALS['TCA']['tt_content']['columns']['bodytext']['config'] = [
            'type'        => 'text',
            'enableRichtext' => true,
        ];

        // Test the hook processes the field
        $this->subject->processDatamap_postProcessFieldArray(
            $status,
            $table,
            $id,
            $fieldArray,
            $dataHandlerMock,
        );

        // Assert field was processed (actual assertion depends on implementation)
        self::assertNotEmpty($fieldArray['bodytext']);
    }

    #[Test]
    public function constructorLoadsExtensionConfiguration(): void
    {
        /** @var ExtensionConfiguration&MockObject $configMock */
        $configMock = $this->createMock(ExtensionConfiguration::class);
        $configMock
            ->expects(self::exactly(2))
            ->method('get')
            ->willReturnCallback(function ($extension, $key) {
                self::assertSame('my_extension', $extension);

                return match ($key) {
                    'enableFeature' => true,
                    'timeout'       => 30,
                    default         => null,
                };
            });

        new MyDataHandlerHook(
            $configMock,
            $this->logManagerMock,
            $this->resourceFactoryMock,
            $this->contextMock,
            $this->requestFactoryMock,
            $this->uploadFolderResolverMock,
        );
    }
}
```

**Key Testing Patterns for DataHandler Hooks:**

1. **Intersection Types for PHPStan**: Use `ResourceFactory&MockObject` for strict type compliance
2. **TCA Globals**: Set `$GLOBALS['TCA']` in tests to simulate TYPO3 table configuration
3. **Extension Configuration**: Use `willReturnCallback` with `match` expressions for flexible config mocking
4. **DataHandler Mock**: Create mock for `$dataHandler` parameter (required in hook signature)
5. **Reset Singletons**: Always set `protected bool $resetSingletonInstances = true;`
6. **Constructor DI**: Inject all dependencies via constructor (TYPO3 13+ best practice)

## Test Patterns for TYPO3 Extensions

### Coverage Attributes: #[CoversClass] and #[CoversNothing]

Every test class MUST declare which production class it covers using `#[CoversClass]`. This is enforced when `beStrictAboutCoverageMetadata` is enabled in PHPUnit configuration.

```php
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\UsesClass;
use Vendor\Extension\Domain\Model\Translation;
use Vendor\Extension\Domain\Repository\TranslationRepository;

#[CoversClass(TranslationRepository::class)]
#[UsesClass(Translation::class)]
final class TranslationRepositoryTest extends UnitTestCase
{
    // ...
}
```

**`#[CoversNothing]`** is used for tests that do not cover application code -- for example, security-oriented tests that validate PHP/libxml behavior rather than extension logic:

```php
use PHPUnit\Framework\Attributes\CoversNothing;

#[CoversNothing]
final class XxeProtectionTest extends UnitTestCase
{
    #[Test]
    public function libxmlDisablesExternalEntityLoading(): void
    {
        // This tests PHP/libxml behavior, not application code
        $previousValue = libxml_disable_entity_loader(true);
        self::assertTrue($previousValue || true);
    }
}
```

### #[UsesClass] for Domain Model Dependencies

When a test exercises domain models indirectly (e.g., a repository test creates model instances), declare them with `#[UsesClass]` to keep coverage reports accurate:

```php
#[CoversClass(TranslationService::class)]
#[UsesClass(Translation::class)]
#[UsesClass(Language::class)]
final class TranslationServiceTest extends UnitTestCase
{
    // Translation and Language are used by TranslationService but not the
    // primary subject under test — #[UsesClass] prevents coverage gaps
}
```

### Mocking All Repository Dependencies

Always mock repository dependencies with `$this->createMock()`. Repositories interact with the database and cannot function in unit tests:

```php
#[CoversClass(TranslationService::class)]
final class TranslationServiceTest extends UnitTestCase
{
    private TranslationService $subject;

    /** @var TranslationRepository&MockObject */
    private TranslationRepository $translationRepositoryMock;

    /** @var LanguageRepository&MockObject */
    private LanguageRepository $languageRepositoryMock;

    protected function setUp(): void
    {
        parent::setUp();

        /** @var TranslationRepository&MockObject $translationRepositoryMock */
        $translationRepositoryMock = $this->createMock(TranslationRepository::class);

        /** @var LanguageRepository&MockObject $languageRepositoryMock */
        $languageRepositoryMock = $this->createMock(LanguageRepository::class);

        $this->translationRepositoryMock = $translationRepositoryMock;
        $this->languageRepositoryMock = $languageRepositoryMock;

        $this->subject = new TranslationService(
            $this->translationRepositoryMock,
            $this->languageRepositoryMock,
        );
    }
}
```

## Resources

- [TYPO3 Unit Testing Documentation](https://docs.typo3.org/m/typo3/reference-coreapi/main/en-us/Testing/UnitTests.html)
- [PHPUnit Documentation](https://phpunit.de/documentation.html)
- [PHPUnit 11 Migration Guide](https://phpunit.de/announcements/phpunit-11.html)
- [TYPO3 DataHandler Hooks](https://docs.typo3.org/m/typo3/reference-coreapi/main/en-us/ApiOverview/Hooks/DataHandler/Index.html)
- [Symfony Clock Component](https://symfony.com/doc/current/clock.html)
- [PSR-20 Clock Interface](https://www.php-fig.org/psr/psr-20/)
