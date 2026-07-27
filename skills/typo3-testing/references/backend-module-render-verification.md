# Backend Module Render Verification

> Fluid templates escape every static gate — render the actual module before calling it done.

## Why this matters

`cgl`, `phpstan` (even level 10), and unit tests do **not** parse Fluid. A backend
module can have green CI across the board and still throw an HTTP 500 the moment a
human opens it, because the only thing that exercises the template is an actual
render. "All checks pass" is **not** evidence that a backend module renders.

Two real failure modes that no static gate catches:

| Trap | Symptom | Cause |
|------|---------|-------|
| Wrong ViewHelper namespace | **Whole module 500s** (parse-time, before any output) | e.g. `<be:infobox>` instead of `<f:be.infobox>` — an unregistered namespace prefix is a template **parse** error, not a runtime one, so it takes down the entire view |
| Unbounded chart/canvas | Page balloons (a `<canvas>` grew to 6543px tall) | Chart.js (or similar) with `maintainAspectRatio: false` inside a container that has no fixed height — the canvas keeps growing every reflow |

## Verify the render — three complementary layers

### 1. StandaloneView (functional, no browser)

For ViewHelper-level correctness, render the template through `StandaloneView` in a
functional test (see `functional-testing.md`). This catches namespace registration,
argument, and output errors **without** a browser and runs in CI.

Limitation: it does **not** reproduce the `ModuleTemplate` / backend doc-header
context, asset inclusion (CSS/JS), or browser layout — so it cannot catch the
canvas-height trap or a CSS/JS load-order problem.

### 2. Render-action functional test (automated, CI-able)

Between StandaloneView and a live browser sits a layer that renders the WHOLE
action — controller, `ModuleTemplateFactory`, Fluid template, doc-header
buttons — inside a functional test. Construct the controller from real
container services and set only the Extbase request by reflection:

```php
$controller = new TaskListController(
    $this->get(ModuleTemplateFactory::class),
    $this->get(IconFactory::class),
    $this->get(TaskRepository::class),
    $this->get(BackendUriBuilder::class),
    $this->get(UsageAnalyticsServiceInterface::class),
);
// Backend request: applicationType BE + backend Route (packageName resolves
// the template root paths) + extbase params + normalizedParams; assign it to
// $GLOBALS['TYPO3_REQUEST'] and reflection-set the controller's $request.
$this->setPrivateProperty($controller, 'request', $this->createBackendRequest());

$response = $controller->listAction();
self::assertSame(200, $response->getStatusCode());
self::assertStringContainsString('Test Manual Task', (string)$response->getBody());
```

Also set up a backend admin (`setUpBackendUser(1)`) and `$GLOBALS['LANG']` via
`LanguageServiceFactory::createFromUserPreferences()` — `LocalizationUtility`
and flash queues need them. Unset `BE_USER`/`TYPO3_REQUEST`/`LANG` in `tearDown()`.

Traps this layer has hit in practice:

| Trap | Symptom | Rule |
|------|---------|------|
| Asserting the route *identifier* | `record_edit` never appears in markup | Backend URLs render the route **path** — assert `record/edit` |
| Guard-path redirects via Extbase `uriFor()` | `location` header is `''` in the harness | The module router isn't fully wired; assert `RedirectResponse` + a non-empty flash-message queue instead of the URL string |
| Service that degrades instead of throwing | Error-path test gets a 200 preview | Read the service first — e.g. a wizard `generateTask()` that falls back to a canned result never reaches the controller's catch; test the fallback render |
| `final` constructor dependency | `createMock()` impossible in a unit test | That class is functional-test territory by construction — don't fight it with reflection hacks |
| PHPUnit ≥ 12 mock notices | "No expectations were configured…" per test | Use `self::createStub()` when only return values matter |

### 3. Live render (browser)

For anything with layout, charts, JS modules, or `ModuleTemplate` chrome, open the
module in a running backend (a live render is a browser/manual step, **not** an
automated test — run schema/CLI against the same binaries CI uses, not through DDEV):

```bash
# 1. Apply the schema (v14: extension:setup — NOT database:updateschema, which was removed)
vendor/bin/typo3 extension:setup
# (or: php vendor/bin/typo3 extension:setup)

# 2. Open the module in a running backend (the typo3-ddev skill covers spinning one
#    up locally + the URL scheme), then check:
#    - HTTP 200, not 500 (a 500 here is almost always a Fluid parse error)
#    - no console errors / no "Chart.js not available" (classic-script vs ES-module load order)
#    - canvases/charts have a sane bounded height
```

Take the verification screenshot at **≥1440px** viewport (narrow viewports hide
sidebar/column overflow). The screenshot doubles as documentation evidence.

## Checklist before declaring a backend module "done"

- [ ] Module opens with **HTTP 200** in a real backend (not just green CI)
- [ ] Every ViewHelper namespace used in the template is registered (`<f:…>`, or a declared custom namespace) — a typo'd prefix is a whole-template 500
- [ ] Charts/canvases sit in a **fixed-height** wrapper; no unbounded growth
- [ ] Browser console is clean (no asset load-order / missing-global errors)
- [ ] (Optional but cheap) a `StandaloneView` functional test renders each custom template/partial
