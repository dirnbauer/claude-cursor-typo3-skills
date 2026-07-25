# Mock Validity for Multi-Version Dependencies

When extensions support multiple major versions of a dependency (e.g., `"intervention/image": "^3 || ^4"`), test mocks must remain compatible across all supported versions. This reference covers common pitfalls and patterns.

## The Problem

Mocking a method that exists on an interface in one version but not another causes silent test failures or runtime errors when CI runs against the other version.

```php
// WRONG - The mock targets Intervention\Image\Interfaces\ImageInterface,
// but it configures toWebp(), which is only implemented on the concrete
// Image class in intervention/image v3 and is not declared on ImageInterface
// in any supported version.
$imageMock = $this->createMock(ImageInterface::class);
$imageMock->expects(self::once())
    ->method('toWebp')  // Does not exist on ImageInterface in v4!
    ->willReturn($encodedMock);
```

## Rule: Verify Mocked Methods Exist on the Interface

Before mocking `->method('foo')` on an interface, verify that `foo` is declared on that interface in **all** supported versions of the dependency.

### Verification Checklist

1. Open the interface definition in `vendor/` for the current version
2. Check the method exists on the **interface**, not just concrete implementations
3. Repeat for each major version in the composer constraint
4. If the method only exists on a concrete class, either:
   - Mock the concrete class instead (if not final)
   - Use an adapter pattern (preferred -- see below)
   - Use `method_exists()` guards in the mock setup

### Example: Intervention Image v3 vs v4

```php
// intervention/image v3: Image class has ->toWebp(), ->toJpeg(), etc.
// intervention/image v4: Image class has ->encodeByPath(), ->encodeByExtension()
// Both versions: ImageInterface has ->save(), ->encode()

// WRONG - version-specific method on interface mock
$imageMock = $this->createMock(ImageInterface::class);
$imageMock->method('toWebp')->willReturn($encodedMock);

// CORRECT - use only methods defined on the interface in ALL versions
$imageMock = $this->createMock(ImageInterface::class);
$imageMock->method('save')->willReturn($imageMock);
```

## Scanning Mocks After Dependency Constraint Changes

When widening a dependency constraint (e.g., `"^3"` to `"^3 || ^4"`), perform a mock audit:

```bash
# Find all mocked methods on the dependency's interfaces
grep -rn "->method('" Tests/ | grep -i "intervention\|dependency-name"

# Cross-reference with the interface in each supported version
# Check vendor/intervention/image/src/Interfaces/ImageInterface.php
```

### Automated Check Pattern

```php
/**
 * Verify that all mocked methods exist on the interface.
 * Run this test against each supported dependency version.
 */
#[Test]
public function mockedMethodsExistOnInterface(): void
{
    $interface = new \ReflectionClass(ImageInterface::class);
    $methods = array_map(
        static fn(\ReflectionMethod $m) => $m->getName(),
        $interface->getMethods(),
    );

    // List every method your tests mock on this interface
    $mockedMethods = ['save', 'encode', 'width', 'height'];

    foreach ($mockedMethods as $method) {
        self::assertTrue(
            in_array($method, $methods, true),
            sprintf(
                'Test mocks %s::%s() but this method does not exist on the interface '
                . 'in the installed version. Check all supported versions.',
                ImageInterface::class,
                $method,
            ),
        );
    }
}
```

## Mock Callback Signature Verification

When using `willReturnCallback()`, the callback's parameter signature must match the actual method signature. If production code changes to pass additional arguments, callbacks silently ignore them or fail.

### The Problem

```php
// Production code changed from:
//   $processor->process($path)
// to:
//   $processor->process($path, $quality)

// WRONG - callback signature is stale, ignores $quality
$processorMock->method('process')
    ->willReturnCallback(function (string $path) {
        return '/processed/' . basename($path);
    });

// Test passes but $quality is silently dropped -- assertions on quality are missing
```

### Rule: Match Callback Signatures to Method Signatures

```php
// CORRECT - callback accepts all parameters the real method declares
$processorMock->method('process')
    ->willReturnCallback(function (string $path, int $quality = 80) {
        self::assertSame(75, $quality); // Verify the quality parameter
        return '/processed/' . basename($path);
    });
```

### Use Variadic Signatures for Forward Compatibility

When a method signature may evolve across versions, use a variadic callback:

```php
// FORWARD-COMPATIBLE - accepts any arguments the method might pass
$processorMock->method('process')
    ->willReturnCallback(function (string $path, mixed ...$options): string {
        // $options[0] would be quality if passed
        return '/processed/' . basename($path);
    });
```

### Callback Signature Audit

After any production code change that adds parameters to a method call, search for all test callbacks mocking that method:

```bash
# Find all willReturnCallback usages for a specific method
grep -rn "method('process')" Tests/ | grep -A5 "willReturnCallback"
```

## Test Assertion Specificity After Refactoring

When refactoring production code, test assertions must maintain equivalent specificity. A refactoring that changes the API surface (e.g., replacing `toWebp()->save()` with `save('output.webp')`) requires updated assertions that verify the same behavior.

### The Problem

```php
// OLD production code:
//   $image->toWebp()->save($path)
// OLD test assertion:
//   $imageMock->expects(self::never())->method('toWebp')
//   This asserts "WebP conversion never happens"

// NEW production code:
//   $image->save($path)  -- format determined by extension
// NEW test (WRONG - lost specificity):
//   $imageMock->expects(self::once())->method('save')
//   This only asserts "save was called" but not "save was NOT called with .webp"
```

### Rule: Maintain Equivalent Assertion Specificity

```php
// NEW test (CORRECT - equivalent specificity to the old assertion)
$imageMock->expects(self::exactly(2))
    ->method('save')
    ->willReturnCallback(function (string $path) use ($imageMock): ImageInterface {
        // Assert that no .webp save happens (equivalent to old "never toWebp()")
        self::assertStringNotContainsString(
            '.webp',
            $path,
            'Image should not be saved as WebP when WebP is disabled',
        );
        return $imageMock;
    });
```

### Specificity Mapping Guide

When refactoring, map old assertions to new ones:

| Old Assertion | New Equivalent |
|--------------|----------------|
| `expects(never())->method('toWebp')` | `save()` callback asserts path has no `.webp` extension |
| `expects(once())->method('toJpeg')` | `save()` callback asserts path ends with `.jpg` |
| `expects(once())->method('resize')->with(800, 600)` | `save()` callback verifies dimensions if applicable |
| Method-level `expects(exactly(N))` | `expects(exactly(N))` with path-based assertions in callback |

### Anti-Pattern: Generic Callbacks Without Assertions

```php
// WRONG - callback provides return value but asserts nothing
$mock->method('save')
    ->willReturnCallback(fn(string $path) => $mock);

// CORRECT - callback asserts expectations about the arguments
$mock->expects(self::exactly(2))
    ->method('save')
    ->willReturnCallback(function (string $path) use ($mock): ImageInterface {
        self::assertStringEndsWith('.jpg', $path);
        return $mock;
    });
```

### Gotcha: `->with()` Only Constrains the Arguments You Pass

`->with($a)` checks **only** the first argument; any further arguments in the actual
call are unconstrained. So when you add a parameter to a method, existing
single-argument expectations keep passing silently — they neither fail nor verify
the new argument:

```php
// Production change:
//   getCacheLifetime(Context $c)  ->  getCacheLifetime(Context $c, ?int $pageId)

// This existing expectation still PASSES after the change, even though the call
// is now getCacheLifetime($context, 42) — the extra arg is not checked:
$mock->expects(self::once())->method('getCacheLifetime')->with($context);
```

Consequences:

- Widening a signature (N -> N+1 args) will **not** break `->with()` assertions that
  only pin the original args — convenient, but a green suite does not prove the new
  argument is exercised.
- To verify the new argument, pin it explicitly: `->with($context, 42)` (or
  `self::anything()` for positions you intentionally leave open).

## Adapter Pattern Testing

When your extension wraps a version-specific third-party API behind an adapter interface, test through the adapter interface rather than creating complex version-specific mock setups.

### The Problem

```php
// WRONG - creates version-specific mocks that break across versions
$driverMock = $this->createMock(DriverInterface::class); // v3-only interface
$driverMock->method('init')->willReturn($driverMock);
$manager = new ImageManager($driverMock);
// ... complex setup that differs between v3 and v4
```

### The Solution: Mock the Adapter Interface

```php
// Define your adapter interface
interface ImageProcessorInterface
{
    public function resize(string $sourcePath, int $width, int $height): string;
    public function convert(string $sourcePath, string $targetFormat): string;
    public function optimize(string $sourcePath, int $quality): string;
}

// Your adapter wraps the version-specific API
final class InterventionImageProcessor implements ImageProcessorInterface
{
    public function __construct(private readonly ImageManager $manager) {}

    public function resize(string $sourcePath, int $width, int $height): string
    {
        $image = $this->manager->read($sourcePath);
        $image->resize($width, $height);
        return $image->save($sourcePath)->basePath(); // Note: This example overwrites the source file.
    }
}
```

```php
// TEST - mock the adapter interface, not the third-party library
final class ImageServiceTest extends UnitTestCase
{
    /** @var ImageProcessorInterface&MockObject */
    private ImageProcessorInterface $processorMock;

    protected function setUp(): void
    {
        parent::setUp();

        /** @var ImageProcessorInterface&MockObject $processorMock */
        $processorMock = $this->createMock(ImageProcessorInterface::class);
        $this->processorMock = $processorMock;

        $this->subject = new ImageService($this->processorMock);
    }

    #[Test]
    public function optimizeImageCallsProcessorWithCorrectQuality(): void
    {
        $this->processorMock
            ->expects(self::once())
            ->method('optimize')
            ->with('/path/to/image.jpg', 75)
            ->willReturn('/path/to/image.jpg');

        $this->subject->optimizeImage('/path/to/image.jpg', 75);
    }
}
```

### Benefits of Adapter Pattern Testing

| Concern | Without Adapter | With Adapter |
|---------|----------------|--------------|
| Version-specific mocks | Required for each version | None needed |
| Test complexity | High (mock internal APIs) | Low (mock your own interface) |
| Breakage on upgrade | Tests break when dependency updates | Only adapter implementation changes |
| Mock validity | Must verify methods on third-party interfaces | Mock your own stable interface |
| Test isolation | Coupled to dependency internals | Fully decoupled |

### When to Use Adapter Pattern

- The dependency has significantly different APIs across supported major versions
- Multiple classes in your extension interact with the dependency
- The dependency's interfaces are not stable across versions
- You need to support `^major1 || ^major2` in `composer.json`

### When NOT to Use Adapter Pattern

- The dependency has a stable, well-defined interface that does not change
- Only one class in your extension uses the dependency
- The overhead of the adapter exceeds the testing benefit
