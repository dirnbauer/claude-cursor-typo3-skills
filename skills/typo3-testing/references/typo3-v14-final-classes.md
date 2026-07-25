# Testing TYPO3 v14 Final Classes

TYPO3 v14 introduces many `final` and `readonly` classes that cannot be mocked directly. This guide covers patterns to maintain testability.

## The Problem

TYPO3 v14 follows modern PHP best practices with `final readonly` classes:

```php
// TYPO3 Core - cannot be mocked
final readonly class SiteConfigurationLoadedEvent
{
    public function __construct(
        private string $siteIdentifier,
        private array $configuration,
    ) {}
}
```

Attempting to mock these classes throws:

```
PHPUnit\Framework\MockObject\Generator\ClassIsFinalException:
Class "TYPO3\CMS\Core\Configuration\Event\SiteConfigurationLoadedEvent" is declared "final" and cannot be mocked.
```

## Pattern 1: Interface Extraction for Dependencies

When your class depends on a final class that you control, extract an interface.

### Before (Untestable)

```php
// Your final class
final class SiteConfigurationVaultProcessor
{
    public function processConfiguration(array $configuration): array { }
}

// Consumer - cannot mock the dependency
final readonly class SiteConfigurationVaultListener
{
    public function __construct(
        private SiteConfigurationVaultProcessor $processor,  // Cannot mock!
    ) {}
}
```

### After (Testable)

**Step 1: Create Interface**

```php
<?php

declare(strict_types=1);

namespace Vendor\Extension\Configuration;

interface SiteConfigurationVaultProcessorInterface
{
    /**
     * @param array<string, mixed> $configuration
     * @return array<string, mixed>
     */
    public function processConfiguration(array $configuration): array;
}
```

**Step 2: Implement Interface**

```php
final class SiteConfigurationVaultProcessor implements SiteConfigurationVaultProcessorInterface
{
    public function processConfiguration(array $configuration): array
    {
        // Implementation
    }
}
```

**Step 3: Register in Services.yaml**

```yaml
services:
  Vendor\Extension\Configuration\SiteConfigurationVaultProcessorInterface:
    alias: Vendor\Extension\Configuration\SiteConfigurationVaultProcessor
    public: true
```

**Step 4: Inject Interface**

```php
final readonly class SiteConfigurationVaultListener
{
    public function __construct(
        private SiteConfigurationVaultProcessorInterface $processor,  // Mockable!
    ) {}
}
```

**Step 5: Mock Interface in Tests**

```php
final class SiteConfigurationVaultListenerTest extends UnitTestCase
{
    private SiteConfigurationVaultProcessorInterface&MockObject $processor;
    private SiteConfigurationVaultListener $listener;

    protected function setUp(): void
    {
        parent::setUp();
        $this->processor = $this->createMock(SiteConfigurationVaultProcessorInterface::class);
        $this->listener = new SiteConfigurationVaultListener($this->processor);
    }

    #[Test]
    public function processesConfigurationWithVaultReferences(): void
    {
        $originalConfig = ['apiKey' => '%vault(my_key)%'];
        $processedConfig = ['apiKey' => 'resolved_secret'];

        $this->processor
            ->expects($this->once())
            ->method('processConfiguration')
            ->with($originalConfig)
            ->willReturn($processedConfig);

        // Test your listener...
    }
}
```

## Pattern 2: Real Event Instances for Final Events

TYPO3 PSR-14 events are often final. Create real instances instead of mocks.

### Wrong - Will Fail

```php
#[Test]
public function handlesEvent(): void
{
    // ClassIsFinalException!
    $event = $this->createMock(SiteConfigurationLoadedEvent::class);
}
```

### Correct - Real Instance

```php
#[Test]
public function handlesEvent(): void
{
    // Create real event - it's a simple value object
    $config = ['apiKey' => '%vault(my_key)%'];
    $event = new SiteConfigurationLoadedEvent('test-site', $config);

    // Mock the dependency, not the event
    $this->processor
        ->method('processConfiguration')
        ->willReturn(['apiKey' => 'resolved']);

    ($this->listener)($event);

    self::assertSame(['apiKey' => 'resolved'], $event->getConfiguration());
}
```

### Complete Test Example

```php
<?php

declare(strict_types=1);

namespace Vendor\Extension\Tests\Unit\EventListener;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;
use TYPO3\CMS\Core\Configuration\Event\SiteConfigurationLoadedEvent;
use Vendor\Extension\Configuration\SiteConfigurationVaultProcessorInterface;
use Vendor\Extension\EventListener\SiteConfigurationVaultListener;

#[CoversClass(SiteConfigurationVaultListener::class)]
final class SiteConfigurationVaultListenerTest extends TestCase
{
    private SiteConfigurationVaultProcessorInterface&MockObject $processor;
    private SiteConfigurationVaultListener $listener;

    protected function setUp(): void
    {
        parent::setUp();
        $this->processor = $this->createMock(SiteConfigurationVaultProcessorInterface::class);
        $this->listener = new SiteConfigurationVaultListener($this->processor);
    }

    #[Test]
    public function skipsProcessingWhenNoVaultReferences(): void
    {
        $config = [
            'base' => 'https://example.com',
            'languages' => [],
        ];

        // Real event instance - not mocked
        $event = new SiteConfigurationLoadedEvent('test-site', $config);

        $this->processor->expects($this->never())->method('processConfiguration');

        ($this->listener)($event);

        self::assertSame($config, $event->getConfiguration());
    }

    #[Test]
    public function processesConfigurationWithVaultReferences(): void
    {
        $originalConfig = ['apiKey' => '%vault(my_key)%'];
        $processedConfig = ['apiKey' => 'resolved_secret'];

        // Real event instance
        $event = new SiteConfigurationLoadedEvent('test-site', $originalConfig);

        $this->processor
            ->expects($this->once())
            ->method('processConfiguration')
            ->with($originalConfig)
            ->willReturn($processedConfig);

        ($this->listener)($event);

        self::assertSame($processedConfig, $event->getConfiguration());
    }

    #[Test]
    public function handlesEmptyConfiguration(): void
    {
        $config = [];
        $event = new SiteConfigurationLoadedEvent('test-site', $config);

        $this->processor->expects($this->never())->method('processConfiguration');

        ($this->listener)($event);

        self::assertSame($config, $event->getConfiguration());
    }
}
```

## Pattern 3: Test Suite Organization

Separate tests by bootstrap requirements to avoid skipped tests.

### Directory Structure

```
Tests/
├── Build/
│   ├── phpunit.xml           # Unit + Fuzz (no TYPO3 bootstrap)
│   └── FunctionalTests.xml   # Functional (requires TYPO3)
├── Unit/                     # Fast, isolated, mockable
├── Functional/               # Database, framework integration
└── Fuzz/                     # Property-based testing
```

### phpunit.xml (Unit Tests Only)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="https://schema.phpunit.de/12.5/phpunit.xsd"
    bootstrap="../bootstrap.php"
    colors="true"
    failOnRisky="true"
    failOnWarning="true"
>
    <testsuites>
        <testsuite name="Unit">
            <directory>../Unit</directory>
        </testsuite>
        <testsuite name="Fuzz">
            <directory>../Fuzz</directory>
        </testsuite>
        <!-- Functional tests require TYPO3 bootstrap - run separately -->
    </testsuites>
</phpunit>
```

### FunctionalTests.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<phpunit
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:noNamespaceSchemaLocation="https://schema.phpunit.de/12.5/phpunit.xsd"
    bootstrap="FunctionalTestsBootstrap.php"
    colors="true"
>
    <testsuites>
        <testsuite name="Functional">
            <directory>../Functional</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

### composer.json Scripts

```json
{
    "scripts": {
        "test:unit": "phpunit -c Tests/Build/phpunit.xml",
        "test:functional": "phpunit -c Tests/Build/FunctionalTests.xml",
        "test:all": ["@test:unit", "@test:functional"]
    }
}
```

## Decision Tree: What to Test Where

```
Is the class under test final?
├── Yes → Can you create it directly (simple constructor)?
│   ├── Yes → Create real instance (Pattern 2)
│   └── No → Does it need framework services?
│       ├── Yes → Move to Functional tests
│       └── No → Extract interface for dependency (Pattern 1)
└── No → Mock normally with createMock()
```

## Common TYPO3 v14 Final Classes

| Class | Testing Strategy |
|-------|------------------|
| `SiteConfigurationLoadedEvent` | Create real instance |
| `AfterStdWrapFunctionsExecutedEvent` | Create real instance |
| `ModifyButtonBarEvent` | Create real instance |
| `FlexFormValueContainer` | Move to functional test |
| `DataHandler` (partial) | Mock via interface or functional test |
| `ModuleTemplateFactory` | `newInstanceWithoutConstructor()` + reflection |
| `ModuleTemplate` | `newInstanceWithoutConstructor()` + reflection |

## Pattern 4: ReflectionMethod for Backend Module Controllers

Backend module controllers depend on `ModuleTemplateFactory` and `ModuleTemplate` which are both `final`. When the controller has private methods with testable logic, use reflection:

```php
// Create controller with real (non-final) mocks + uninitialized final dep
$controller = new StatusController(
    $this->createMock(DiagnosticService::class),
    $this->createMock(BackendUriBuilder::class),
    (new \ReflectionClass(ModuleTemplateFactory::class))
        ->newInstanceWithoutConstructor(),
);

// Test private method via reflection
$method = new \ReflectionMethod(StatusController::class, 'buildFixUrls');
$method->setAccessible(true); // Required for private methods
$result = $method->invoke($controller, $checks);
```

### BackendUriBuilder Return Type

`BackendUriBuilder::buildUriFromRoute()` returns `UriInterface` (not string). Mocks must return a proper Uri object:

```php
// WRONG — causes TypeError since buildUriFromRoute() returns UriInterface
$mock->method('buildUriFromRoute')->willReturn('/typo3/module/path');

// CORRECT
$mock->method('buildUriFromRoute')
    ->willReturn(new \TYPO3\CMS\Core\Http\Uri('/typo3/module/path'));
```

## Pattern 5: `dg/bypass-finals` for Your Own `final` Classes

Patterns 1-4 cover **TYPO3 framework** classes you cannot change. They do not help when **your own** production classes are `final` (enforced via phpat / architecture tests) and are constructed by factories you would otherwise want to mock.

For that case, use [`dg/bypass-finals`](https://github.com/dg/bypass-finals): it strips the `final` keyword **at PHPUnit runtime only**, leaving production bytecode untouched. Production code keeps the architectural guarantee; tests can `createMock()` your final classes.

### Setup

```bash
composer require --dev dg/bypass-finals
```

In `Tests/bootstrap.php` -- **before** any test class is autoloaded:

```php
<?php

declare(strict_types=1);

require_once __DIR__ . '/../.Build/vendor/autoload.php';

\DG\BypassFinals::enable();

// ... your existing Environment::initialize(), LF, etc.
```

Wire the bootstrap into `phpunit.xml` (`bootstrap="Tests/bootstrap.php"`). Order matters: `BypassFinals::enable()` must run before any `final` class is loaded -- if PHPUnit autoloads a test that references `final class Foo` before the call, the rewrite is too late.

### When to Reach for It

- You have phpat finality rules enforcing `final` on production code (recommended, see `architecture-testing.md`).
- You need to `createMock()` a class you authored (DTOs, services, event listeners) without writing an interface for every one.
- The mocked class is **yours** -- bypassing finals on third-party classes (especially TYPO3 core) is brittle and re-introduces the upstream-change risk that `final` was meant to flag.

### When Not to Reach for It

- The class belongs to TYPO3 core or another vendor library -- use Patterns 1-4 instead. Bypassing finals on third-party code couples your tests to upstream internals.
- The dependency cleanly fits an interface -- extracting the interface (Pattern 1) keeps coupling explicit and works without `bypass-finals`.

### Verification

A quick sanity check that the rewrite is active:

```php
#[Test]
public function bypassFinalsIsEnabled(): void
{
    self::assertFalse(
        (new \ReflectionClass(\Vendor\Extension\Domain\Dto\SomeFinalDto::class))->isFinal(),
        'BypassFinals is not enabled - check Tests/bootstrap.php load order.',
    );
}
```

If this assertion fails, the bootstrap is not being loaded or `enable()` runs too late.

## Anti-Patterns to Avoid

### Don't Skip Tests

```php
// BAD - leaves gaps in coverage
#[Test]
public function testSomething(): void
{
    $this->markTestSkipped('Cannot mock final class');
}
```

### Don't Use Reflection to Bypass Final

```php
// BAD - fragile and defeats the purpose
$reflection = new ReflectionClass(FinalClass::class);
// ... hack to make it non-final
```

> **Exception:** Using `newInstanceWithoutConstructor()` and `ReflectionMethod` is acceptable when testing controllers that depend on final TYPO3 framework classes where no interface exists. This is different from trying to make a class non-final — you're passing an uninitialized instance as a placeholder for a parameter you won't use.

### Don't Copy TYPO3 Classes

```php
// BAD - maintenance nightmare
namespace Vendor\Extension\Tests\Fixtures;
class SiteConfigurationLoadedEvent { } // Copy of TYPO3's class
```

## Cross-Version `readonly` Trap (13.4 vs 14) — a fixture subclass can fatal on one matrix leg

`readonly` is applied to different classes in different core versions. A class
that is a plain `class` on 13.4 becomes `readonly class` on 14 (and vice versa
for some). This breaks the common "subclass the concrete framework class and
override one method" test-double trick across a `^13.4 || ^14.3` matrix,
because PHP forbids a `readonly` child extending a non-`readonly` parent **and**
a non-`readonly` child extending a `readonly` parent:

```php
// Test double subclassing the concrete class:
final readonly class FakeRequestFactory extends RequestFactory { /* ... */ }
```

`TYPO3\CMS\Core\Http\RequestFactory` is `readonly` on 14.x but a plain `class`
on 13.4. So this fixture:

- compiles on 14.x, and
- **fatals at parse time on 13.4** —
  `Readonly class ...FakeRequestFactory cannot extend non-readonly class ...RequestFactory`.

The failure is invisible locally if you only run one PHP/TYPO3 version; it only
appears on the 13.4 legs of the CI matrix (and it's a *fatal*, so PHPStan/unit
locally on 8.4/14 stay green). Two independent gotchas compound it: PHPUnit also
cannot mock a `readonly` class at all (same `ClassIsFinalException` family), so
"just mock it" is not an escape either.

**Fix — don't subclass the concrete class.** Introduce a one-method interface
your production code depends on, wrap the concrete factory in a tiny production
implementation, and have the test double implement the interface directly:

```php
interface HttpFetcherInterface { public function get(string $url): \Psr\Http\Message\ResponseInterface; }

final readonly class HttpFetcher implements HttpFetcherInterface { /* wraps RequestFactory */ }

// Test double: implements the interface, extends nothing version-dependent.
final class FakeHttpFetcher implements HttpFetcherInterface { /* records + replays */ }
```

The interface is version-neutral, so the double compiles on every matrix cell.
This is the same "Interface Extraction" pattern above, applied specifically
because the parent's `readonly`-ness is not stable across the supported versions.

## Summary

1. **Interface Extraction**: For dependencies you control that are final
2. **Real Instances**: For simple value objects like events
3. **Test Suite Separation**: Unit vs Functional based on requirements
4. **Reflection for Controllers**: Use `newInstanceWithoutConstructor()` for final framework deps in controllers
5. **`dg/bypass-finals`**: For your own `final` production classes that you want to mock without extracting an interface
6. **Zero Skipped Tests**: Every test should run - reorganize if needed
7. **Cross-version `readonly`**: Never subclass a concrete core class whose `readonly`-ness differs across the supported versions — a fixture subclass fatals on the leg where parent and child disagree; extract an interface instead
