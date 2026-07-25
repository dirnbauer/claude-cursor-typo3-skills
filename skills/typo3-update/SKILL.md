---
name: "typo3-update"
description: "Guides TYPO3 v14 extension development and upgrades, including version constraints, PHP requirements, controllers, ViewFactory, Fluid, events, backend modules, TCA, QueryBuilder, CLI commands, tests, and v14-only manual changes. Use when the user asks about TYPO3 v14, upgrades, migrations, extension modernization, LTS constraints, or current Core APIs."
compatibility: "TYPO3 14.x"
metadata:
  version: "2.0.0"
  origin: "webconsulting"
license: "MIT / CC-BY-SA-4.0"
---
# TYPO3 v14 development

> Source: https://github.com/dirnbauer/webconsulting-skills

> **Strategy:** This collection targets **TYPO3 v14.x only**. Patterns here assume a v14 codebase.
> For migrating from older majors, use `typo3-rector`, `typo3-extension-upgrade`, Fractor, and the official upgrade guide first.

> **Scope — read this before using any constraint below.** This skill is the **v14 API reference**: how v14 code is written. It does not run upgrades.
> Upgrading a whole project or site from v12/v13 is `typo3-14-update`, which owns the version constraints, the PHP target, the `ext_emconf.php` policy and the migration process end to end.
> **Where the two differ, `typo3-14-update` wins** — load it first for an upgrade run and use this skill as the API reference during its manual-migration phase.

> **TYPO3 API First:** Always use TYPO3's built-in APIs, core features, and established conventions before creating custom implementations. Do not reinvent what TYPO3 already provides. Always verify that the APIs and methods you use exist and are not deprecated in TYPO3 v14 by checking the official TYPO3 documentation.

## 1. Version Strategy

### Target: TYPO3 v14.x only

| Version | Role for this collection |
|---------|--------------------------|
| **v14.x** | **Supported target** — examples and constraints assume TYPO3 v14 |
| Older majors | **Not targeted** — complete a core upgrade, then use these patterns |

**Best Practice:** Declare TYPO3 **v14-only** constraints in `composer.json`. Composer is the single source of truth in v14 — see the `ext_emconf.php` note below before adding one.

### Version Constraints

```json
// composer.json — TYPO3 v14
{
    "name": "vendor/my-extension",
    "type": "typo3-cms-extension",
    "require": {
        "php": "^8.4",
        "typo3/cms-core": "^14.3"
    },
    "extra": {
        "typo3/cms": {
            "extension-key": "my_extension"
        }
    }
}
```

Target **`^14.3`, not `^14.0`**: 14.3 is the supported LTS line, and 14.0 through 14.2 no longer receive security updates. A reusable package that genuinely tests a broader range may widen the constraint, but it must then prove it in CI rather than assert it.

> **Content Blocks:** `friendsoftypo3/content-blocks` requires **`typo3/cms-core` ^14.3** or higher — match the [Packagist constraint](https://packagist.org/packages/friendsoftypo3/content-blocks) before pinning anything lower.

### `ext_emconf.php` — Classic mode and TER publishing only

TYPO3 feature [#108345](https://docs.typo3.org/c/typo3/cms-core/main/en-us/Changelog/14.0/Feature-108345-ExtensionMetadataInComposerJson.html) deprecates `ext_emconf.php` in v14; v15 no longer evaluates it. Composer-mode extensions should **not** ship one. Keep it only where a tool still requires it — TER/Tailor publishing, or a Classic-mode installation — and then keep it exactly in sync with `composer.json`:

```php
<?php
// ext_emconf.php — only for Classic mode or TER publishing
$EM_CONF[$_EXTKEY] = [
    'title' => 'My Extension',
    'version' => '2.0.0',
    'state' => 'stable',
    'constraints' => [
        'depends' => [
            'typo3' => '14.3.0-14.99.99',
            'php' => '8.4.0-8.5.99',
        ],
        'conflicts' => [],
        'suggests' => [],
    ],
];
```

For a full project or site upgrade, `typo3-14-update` owns this policy and removes the file for project-local extensions in `packages/`.

## 2. PHP Requirements

### Core floor 8.2 — project target 8.4 (8.5 where it resolves)

TYPO3 v14 Core requires PHP 8.2+, so a reusable package that tests and documents the broader range may declare `^8.2`. **Project and site work in this collection targets PHP 8.4 as the standard**, and PHP 8.5 is supported and preferred where the whole dependency set resolves on it — check `composer why-not php 8.5` and fall back to 8.4 when a package blocks. `typo3-14-update` enforces the 8.4 floor and gates on it.

Use modern PHP features:

```php
<?php
declare(strict_types=1);

namespace Vendor\Extension\Service;

// ✅ Constructor property promotion (PHP 8.0+)
final class MyService
{
    public function __construct(
        private readonly SomeDependency $dependency,
        private readonly AnotherService $anotherService,
    ) {}
}

// ✅ Named arguments (PHP 8.0+)
$result = $this->doSomething(
    name: 'value',
    options: ['key' => 'value'],
);

// ✅ Match expressions (PHP 8.0+)
$type = match ($input) {
    'a' => 'Type A',
    'b' => 'Type B',
    default => 'Unknown',
};

// ✅ Enums (PHP 8.1+)
enum Status: string
{
    case Draft = 'draft';
    case Published = 'published';
}
```

## 3. Controller Patterns (TYPO3 v14)

### Extbase Action Controller

```php
<?php
declare(strict_types=1);

namespace Vendor\Extension\Controller;

use Psr\Http\Message\ResponseInterface;
use TYPO3\CMS\Extbase\Mvc\Controller\ActionController;
use Vendor\Extension\Domain\Repository\ItemRepository;

final class ItemController extends ActionController
{
    public function __construct(
        private readonly ItemRepository $itemRepository,
    ) {}

    // ✅ Must return ResponseInterface (required in TYPO3 v14)
    public function listAction(): ResponseInterface
    {
        $items = $this->itemRepository->findAll();
        $this->view->assign('items', $items);
        return $this->htmlResponse();
    }

    public function showAction(int $item): ResponseInterface
    {
        $item = $this->itemRepository->findByUid($item);
        $this->view->assign('item', $item);
        return $this->htmlResponse();
    }

    // ✅ JSON response
    public function apiAction(): ResponseInterface
    {
        $data = ['success' => true, 'items' => []];
        return $this->jsonResponse(json_encode($data));
    }

    // ✅ Redirect
    public function createAction(): ResponseInterface
    {
        // Process creation...
        $this->addFlashMessage('Item created');
        return $this->redirect('list');
    }
}
```

### Backend Module Controller

```php
<?php
declare(strict_types=1);

namespace Vendor\Extension\Controller;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Backend\Attribute\AsController;
use TYPO3\CMS\Backend\Template\ModuleTemplateFactory;

#[AsController]
final class BackendModuleController
{
    public function __construct(
        private readonly ModuleTemplateFactory $moduleTemplateFactory,
    ) {}

    public function indexAction(ServerRequestInterface $request): ResponseInterface
    {
        $moduleTemplate = $this->moduleTemplateFactory->create($request);
        $moduleTemplate->assign('items', []);
        
        return $moduleTemplate->renderResponse('Backend/Index');
    }
}
```

## 4. View & Templating (TYPO3 v14)

### ViewFactory (Preferred Pattern)

```php
<?php
declare(strict_types=1);

namespace Vendor\Extension\Service;

use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Core\View\ViewFactoryData;
use TYPO3\CMS\Core\View\ViewFactoryInterface;

final class RenderingService
{
    public function __construct(
        private readonly ViewFactoryInterface $viewFactory,
    ) {}

    public function renderEmail(ServerRequestInterface $request, array $data): string
    {
        $viewFactoryData = new ViewFactoryData(
            templateRootPaths: ['EXT:my_extension/Resources/Private/Templates/Email'],
            partialRootPaths: ['EXT:my_extension/Resources/Private/Partials'],
            layoutRootPaths: ['EXT:my_extension/Resources/Private/Layouts'],
            request: $request,
        );
        
        $view = $this->viewFactory->create($viewFactoryData);
        $view->assignMultiple($data);
        
        return $view->render('Notification');
    }
}
```

### Fluid Template Best Practices

```html
<html xmlns:f="http://typo3.org/ns/TYPO3/CMS/Fluid/ViewHelpers"
      xmlns:core="http://typo3.org/ns/TYPO3/CMS/Core/ViewHelpers"
      data-namespace-typo3-fluid="true">

<f:layout name="Default" />

<f:section name="Main">
    <div class="content">
        <!-- ✅ Auto-escaped output -->
        <h1>{item.title}</h1>
        
        <!-- ✅ Explicit HTML (use with caution) -->
        <f:format.html>{item.bodytext}</f:format.html>
        
        <!-- ✅ Conditional rendering -->
        <f:if condition="{items}">
            <f:then>
                <f:for each="{items}" as="item">
                    <f:render partial="Item" arguments="{item: item}" />
                </f:for>
            </f:then>
            <f:else>
                <p>No items found.</p>
            </f:else>
        </f:if>
        
        <!-- ✅ Link building -->
        <f:link.action action="show" arguments="{item: item.uid}">
            View Details
        </f:link.action>
    </div>
</f:section>

</html>
```

## 5. Event System (TYPO3 v14)

### PSR-14 Event Listeners

PSR-14 events are the standard in TYPO3 v14. Always prefer events over hooks.

```php
<?php
declare(strict_types=1);

namespace Vendor\Extension\EventListener;

use TYPO3\CMS\Core\Attribute\AsEventListener;
use TYPO3\CMS\Frontend\Event\ModifyCacheLifetimeForPageEvent;

#[AsEventListener(identifier: 'vendor-extension/modify-cache-lifetime')]
final class ModifyCacheLifetimeListener
{
    public function __invoke(ModifyCacheLifetimeForPageEvent $event): void
    {
        // Reduce cache lifetime for certain pages
        if ($event->getPageId() === 123) {
            $event->setCacheLifetime(300); // 5 minutes
        }
    }
}
```

### Common Events (TYPO3 v14)

| Event | Purpose |
|-------|---------|
| `ModifyPageLinkConfigurationEvent` | Modify link building |
| `ModifyCacheLifetimeForPageEvent` | Adjust page cache |
| `BeforeStdWrapFunctionsInitializedEvent` | Modify stdWrap |
| *(DataHandler)* | Core ships **no** generic `BeforeRecordOperationEvent` / `AfterRecordOperationEvent`; use **`SC_OPTIONS`** DataHandler hooks or documented `TYPO3\CMS\Core\DataHandling\Event\*` only ([list](https://docs.typo3.org/m/typo3/reference-coreapi/main/en-us/ApiOverview/Events/Events/Core/DataHandling/Index.html)) |

### Services.yaml Registration

```yaml
# Configuration/Services.yaml
services:
  _defaults:
    autowire: true
    autoconfigure: true
    public: false

  Vendor\Extension\:
    resource: '../Classes/*'
    exclude:
      - '../Classes/Domain/Model/*'

  # Event listener (alternative to #[AsEventListener] attribute)
  Vendor\Extension\EventListener\MyListener:
    tags:
      - name: event.listener
        identifier: 'vendor-extension/my-listener'
```


## Detailed Reference

Read [the full guide](references/full-guide.md) when the task needs detailed examples, long templates, troubleshooting matrices, appendices, or sections not included above. Keep this file unloaded for narrow tasks so the skill follows progressive disclosure.
