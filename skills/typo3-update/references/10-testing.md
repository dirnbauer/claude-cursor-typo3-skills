# 10. Testing

Continues `typo3-update` from [full guide](full-guide.md).

## 10. Testing

### PHPUnit Setup

```xml
<!-- phpunit.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/typo3/testing-framework/Resources/Core/Build/UnitTestsBootstrap.php"
         colors="true">
    <testsuites>
        <testsuite name="Unit">
            <directory>Tests/Unit</directory>
        </testsuite>
        <testsuite name="Functional">
            <directory>Tests/Functional</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

### CI matrix (TYPO3 v14)

```yaml
# .github/workflows/ci.yaml
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        typo3: ['^14.3']
        php: ['8.4', '8.5']
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: ${{ matrix.php }}
          extensions: intl, pdo_mysql
      
      - name: Install dependencies
        run: |
          composer require typo3/cms-core:${{ matrix.typo3 }} --no-update
          composer install --prefer-dist --no-progress
      
      - name: Run tests
        run: vendor/bin/phpunit
```
