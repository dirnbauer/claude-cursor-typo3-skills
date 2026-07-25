# Functional Test Patterns for TYPO3 12/13

> **Source**: Real-world patterns from netresearch/contexts extension testing (2024-12)

## Container Reset Between Tests

When testing classes that use dependency injection, reset the container between tests:

```php
protected function setUp(): void
{
    parent::setUp();
    // Reset container to ensure clean DI state
    $this->resetContainer();
}
```

**Why**: Prevents test pollution from cached service instances.

## Site Configuration in Functional Tests

Create site configuration via YAML files, not PHP APIs:

```php
protected function setUp(): void
{
    parent::setUp();
    $this->importCSVDataSet(__DIR__ . '/Fixtures/pages.csv');

    // Create site configuration directory
    $siteConfigPath = $this->instancePath . '/config/sites/main';
    GeneralUtility::mkdir_p($siteConfigPath);

    // Write YAML configuration directly
    file_put_contents(
        $siteConfigPath . '/config.yaml',
        Yaml::dump([
            'rootPageId' => 1,
            'base' => '/',
            'languages' => [
                [
                    'languageId' => 0,
                    'title' => 'English',
                    'locale' => 'en_US.UTF-8',
                    'base' => '/',
                ],
            ],
        ])
    );
}
```

### `Site::getBase()` with `baseVariants` is functional-only

Code that resolves a site base URL — egress/SSRF policy, probe-URL builders,
anything calling `$site->getBase()` — cannot be **unit**-tested when the site
carries `baseVariants`. `baseVariants` are evaluated through TYPO3's
ExpressionLanguage provider, which needs the DI/provider bootstrap the unit
`UnitTestCase` does not set up; a plain unit test throws
`ArgumentCountError` from `ProviderConfigurationLoader` the moment `getBase()`
touches a variant.

Test such code as **functional** — write the site YAML with a `baseVariants` block
(extending the site-config example above) so ExpressionLanguage is wired:

```yaml
rootPageId: 1
base: '/'
baseVariants:
  -
    base: 'https://staging.example.com/'
    condition: 'applicationContext == "Production/Staging"'
```

Reserve unit tests for site code that never resolves a variant base.

## Disabling Session for Context Fixtures

When testing contexts that don't need session:

```php
// Fixture: Tests/Functional/Fixtures/tx_contexts_contexts.csv
"uid","pid","title","type","type_conf","disabled","hide_in_backend"
1,0,"Test Context","ip","","0","0"

// Test class
protected function setUp(): void
{
    parent::setUp();
    $this->importCSVDataSet(__DIR__ . '/Fixtures/tx_contexts_contexts.csv');

    // Disable session to avoid "session not available" errors
    $GLOBALS['TYPO3_CONF_VARS']['FE']['sessionDataLifetime'] = 0;
}
```

## LinkVars Warning Fix

Avoid `linkVars not set` warnings in functional tests:

```php
// In test setup or fixture TypoScript
$GLOBALS['TSFE']->config['config']['linkVars'] = '';
```

Or in site TypoScript fixture:
```typoscript
config.linkVars =
```

## PHPUnit 10/11/12 Migration Patterns

### Removed: `$this->at()` Matcher

**PHPUnit 9** (deprecated):
```php
$mock->expects($this->at(0))->method('foo')->willReturn('first');
$mock->expects($this->at(1))->method('foo')->willReturn('second');
```

**PHPUnit 10+**:
```php
$mock->expects($this->exactly(2))
    ->method('foo')
    ->willReturnOnConsecutiveCalls('first', 'second');
```

### Callback Matcher for Complex Sequences

```php
$callCount = 0;
$mock->method('foo')
    ->willReturnCallback(function () use (&$callCount) {
        return match (++$callCount) {
            1 => 'first',
            2 => 'second',
            default => 'default',
        };
    });
```

### Mock Objects Without Expectations

PHPUnit 12 shows notices when mocks created with `createMock()` have no configured expectations.

> **WARNING:** `#[AllowMockObjectsWithoutExpectations]` is a PHPUnit 12-only attribute. It does NOT exist in PHPUnit 11 (used on PHP 8.2 CI). Using it causes a fatal error on PHPUnit 11. **Do not use this attribute** in projects that must support PHPUnit 11.

**Solution: Use `createStub()` instead of `createMock()`** when no expectations are needed:

```php
use PHPUnit\Framework\Attributes\CoversClass;

#[CoversClass(MyService::class)]
final class MyServiceTest extends FunctionalTestCase
{
    public function testSomething(): void
    {
        // GOOD: createStub() for doubles without expectations
        $stub = $this->createStub(DependencyInterface::class);
        $stub->method('getValue')->willReturn('default');
        $service = new MyService($stub);

        self::assertTrue($service->isValid());
    }
}
```

**When to use `createStub()`:**
- Test doubles used only for satisfying type hints
- Fuzz tests where the double's interactions aren't the focus
- Tests where the double's behavior is irrelevant

**When to use `createMock()`:**
- You need `expects()` to verify call counts or arguments

See [Test Environment Guards](test-environment-guards.md#phpunit-version-compatibility-createmock-vs-createstub) for the full decision guide.

### PHPUnit 12: Attribute-Based Annotations

PHPUnit 12 prefers PHP 8 attributes over docblock annotations:

```php
// Old (deprecated)
/**
 * @covers \MyClass
 * @group slow
 */
class MyTest extends TestCase {}

// New (PHPUnit 10+)
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\Test;

#[CoversClass(MyClass::class)]
#[Group('slow')]
final class MyTest extends TestCase
{
    #[Test]
    public function itDoesTheThing(): void {}
}
```

### Common PHPUnit 12 Attributes

| Attribute | Purpose |
|-----------|---------|
| `#[Test]` | Mark method as test |
| `#[CoversClass(Foo::class)]` | Code coverage target |
| `#[CoversNothing]` | Exclude from coverage |
| `#[Group('slow')]` | Test grouping |
| `#[DataProvider('dataMethod')]` | Data provider |
| `#[Depends('testFirst')]` | Test dependencies |
| `#[AllowMockObjectsWithoutExpectations]` | Suppress mock notices (PHPUnit 12 ONLY -- use `createStub()` instead) |

## Database Credentials for DDEV

In `Build/phpunit/FunctionalTests.xml`:

```xml
<php>
    <env name="typo3DatabaseDriver" value="mysqli"/>
    <env name="typo3DatabaseHost" value="db"/>
    <env name="typo3DatabasePort" value="3306"/>
    <env name="typo3DatabaseUsername" value="db"/>
    <env name="typo3DatabasePassword" value="db"/>
    <env name="typo3DatabaseName" value="func_tests"/>
</php>
```

## Test Framework Compatibility Matrix

| PHPUnit | TYPO3 Testing Framework | TYPO3 Version |
|---------|------------------------|---------------|
| ^10.5   | ^8.0                   | 12.4 LTS      |
| ^11.0   | ^8.2 \|\| ^9.0         | 12.4, 13.4    |
| ^12.0   | ^9.0                   | 13.4 LTS      |

## Functional Test with Request Attribute (v13)

Testing code that uses PSR-7 request attributes:

```php
use TYPO3\CMS\Core\Http\ServerRequest;
use TYPO3\CMS\Frontend\Page\PageInformation;

public function testWithPageInformation(): void
{
    $pageInfo = new PageInformation();
    $pageInfo->setId(1);
    $pageInfo->setRootLine([['uid' => 1]]);

    $request = (new ServerRequest())
        ->withAttribute('frontend.page.information', $pageInfo);

    $result = $this->subject->process($request);

    self::assertSame(1, $result->getPageId());
}
```

## Backend controller & AJAX gotchas (found while functional-testing controllers)

Three traps that surface when functional-testing TYPO3 backend controllers and
running the suite locally:

### `-s functional` hangs on WSL2 under Docker contention

The full functional suite can hang indefinitely (many minutes, **zero output** =
a setup hang, not a test failure) when it competes for the Docker daemon with a
running `ddev` project and/or Playwright. Run **targeted files** locally and
treat **CI functional as authoritative**:

```bash
# Not the whole suite while ddev/Playwright are busy:
./Build/Scripts/runTests.sh -s functional Tests/Functional/Controller/Backend/FooControllerTest.php
```

### `JsonResponse` 500s on non-UTF-8 and takes no encode flags

TYPO3's `\TYPO3\CMS\Core\Http\JsonResponse` encodes with `JSON_THROW_ON_ERROR`
and accepts **no** encoding-options argument. An AJAX action that echoes
untrusted bytes back to the browser — tool output, log lines, injected text —
throws an uncaught exception on a single malformed byte, returning an **HTML 500
page** the frontend can't parse (it surfaces as a bare "Unknown error"). Build
the response via the injected PSR-17 factory so bad bytes degrade instead of
throwing (prefer the factory over `new \TYPO3\CMS\Core\Http\Response()` — that
class is not public API):

```php
// $this->responseFactory is an injected Psr\Http\Message\ResponseFactoryInterface
$json = json_encode($data, JSON_THROW_ON_ERROR | JSON_INVALID_UTF8_SUBSTITUTE);
$response = $this->responseFactory->createResponse($status)
    ->withHeader('Content-Type', 'application/json; charset=utf-8');
$response->getBody()->write($json);
$response->getBody()->rewind(); // else getContents() in an emitter/middleware sees an empty stream
return $response;
```

A functional test for this: run the action with a scripted provider/model whose
response carries `"\xFF\xFE"`, and assert the action returns `200` with
decodable JSON — not that it throws.

### `jsonResponse()` is a FATAL name clash on an Extbase `ActionController`

`ActionController` already declares `protected function jsonResponse(?string $json = null)`.
A helper named `jsonResponse` with a narrower visibility or different signature
is a **fatal** "access level must be …" / signature error at class-load time —
not a lint warning. Name controller JSON helpers something else (`respondJson`,
`streamLine`, …).
