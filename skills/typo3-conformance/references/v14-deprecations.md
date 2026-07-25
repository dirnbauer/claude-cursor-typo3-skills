# TYPO3 v14 Removals & Deprecations — Conformance Reference

**Canonical owner:** this file is the canonical v13/v14 breaking-change fact catalog. Other skills (`typo3-extension-upgrade`, `typo3-upgrade-effort-model`, etc.) cross-link here instead of restating the fact lists — see the fact-ownership rule in `skill-repo-skill` `skills/skill-repo/references/skill-quality.md` ("Fact and trigger ownership"). When a new TYPO3 release changes these facts, edit only this file.

**Sources:** TYPO3 Core Changelog [14.0](https://docs.typo3.org/c/typo3/cms-core/main/en-us/Changelog/14.0/Index.html) · [14.1](https://docs.typo3.org/c/typo3/cms-core/main/en-us/Changelog/14.1/Index.html) · [14.2](https://docs.typo3.org/c/typo3/cms-core/main/en-us/Changelog/14.2/Index.html) · [14.3](https://docs.typo3.org/c/typo3/cms-core/main/en-us/Changelog/14.3/Index.html)
**Purpose:** Score extensions against v14 removals (must fix now) and v14 deprecations (must fix before v15).
**Release context:** v14.3 LTS released 2026-04-21. v14.0 landed all 98 breaking changes; v14.1/14.2/14.3 are feature-freeze / stabilization.

---

## Part 1 — Removed in v14.0 (must fix before v14 upgrade)

Break the code. Conformance: if found, flag as **critical issue** for any extension claiming v14 support.

### 1.1 Fluid 5 strict typing (#108148)

**Removed:**
- `\TYPO3\CMS\Fluid\View\StandaloneView`
- `\TYPO3\CMS\Fluid\View\TemplateView`
- `\TYPO3\CMS\Fluid\View\AbstractTemplateView`
- `renderStatic()` on `AbstractViewHelper`
- ViewHelpers without typed arguments/return types
- Variable names starting with `_` in Fluid templates
- `ViewHelperResolver` standalone methods (#104223)
- `overrideArgument` in Standalone (#104463)

**Detection:**
```bash
grep -rn 'StandaloneView\|AbstractTemplateView\|renderStatic' Classes/ --include='*.php'
grep -rn 'class.*ViewHelper' Classes/ViewHelpers/ --include='*.php' | grep -vE 'function render\(.*\):'
grep -rEn '\{_[a-zA-Z]' Resources/Private --include='*.html'
```

**Replacement:** Inject `\TYPO3\CMS\Core\View\ViewFactoryInterface`; typed `render(): string` / arguments.

---

### 1.2 Extbase annotation + magic finders (#107229, #105377)

**Removed:**
- Docblock annotations namespace (`@TYPO3\CMS\Extbase\Annotation\...`) — use PHP attributes
- `findByX()`, `findOneByX()`, `countByX()` magic methods
- `TYPO3.CMS.Extbase` shorthand namespace
- `Extbase\Security\Cryptography\HashService` class
- `Backend\Toolbar\Enumeration\InformationStatus`
- `Core\Type\Enumeration`, `Core\Type\Icon\IconState`
- `GeneralUtility::hmac()`, `MathUtility::convertToPositiveInteger()`
- `BackendUtility::getTcaFieldConfiguration()`, `BackendUtility::thumbCode()`
- `ExtensionManagementUtility::addPItoST43/addPageTSConfig/addUserTSConfig/getExtensionIcon`
- `ExtensionUtility::PLUGIN_TYPE_PLUGIN` constant
- `Icon::SIZE_*`, `AbstractFile::FILETYPE_*` constants

**Detection:**
```bash
grep -rn '@Extbase\\Annotation\|->findBy[A-Z]\|->findOneBy[A-Z]\|->countBy[A-Z]' Classes/ --include='*.php'
grep -rn 'HashService\|GeneralUtility::hmac\|Icon::SIZE_\|FILETYPE_' Classes/ --include='*.php'
```

**Replacement:** `#[Validate]`, `#[IgnoreValidation]` attributes; `createQuery()` builder; symmetric cipher service (#108002); enum types.

---

### 1.3 TypoScriptFrontendController removal (#107831)

**Removed:**
- `\TYPO3\CMS\Frontend\Controller\TypoScriptFrontendController` class
- `$GLOBALS['TSFE']` access
- `$request->getAttribute('frontend.controller')`
- `$contentObjectRenderer->getTypoScriptFrontendController()`

**Detection:**
```bash
grep -rn "GLOBALS\['TSFE'\]\|TypoScriptFrontendController\|getAttribute('frontend.controller')" Classes/ --include='*.php'
```

**Replacement:**
- Page data: `$request->getAttribute('frontend.page.information')`
- Header/footer: `PageRenderer::addHeaderData()` / `addFooterData()`
- Site: `$request->getAttribute('site')`
- Language: `$request->getAttribute('language')`

---

### 1.4 FAL strong-typing (#106427, #107403, #107735)

**Removed:**
- `AbstractFile::getIdentifier()` / `setIdentifier()`
- `FileInterface::rename()` (moved to concrete `File`)
- `FileNameValidator` custom regex in `__construct()`
- Metadata extractor registration via `registerExtractionService()`
- Backend avatar provider registration via `$GLOBALS`
- `LocalPreviewHelper`, `LocalCropScaleMaskHelper` classes

**Replacement:** Use concrete `File::rename()`; implement `MetadataExtractorInterface`; register via autoconfigure tags; `Folder->getSubFolder()` throws `FolderDoesNotExistException`.

---

### 1.5 Cache interfaces strict-typed (#107315)

**Removed:**
- `AbstractBackend::__construct($context, $options)` signature — `$context` dropped
- `FreezableBackendInterface` (#107310)
- `CacheHashCalculator` public methods (#108277)

**Detection:** Any extension implementing a custom cache backend must align with new strict-typed interfaces (`BackendInterface`, `PhpCapableBackendInterface`, `TransientBackendInterface`, `FrontendInterface`).

---

### 1.6 TCA sweep (#105377, #106863, #106972, #107047)

**Removed TCA options:**
| Option | Replacement |
|---|---|
| `types.subtype_value_field` | record-type flex-form handling |
| `types.subtypes_addlist` | — |
| `types.subtypes_excludelist` | — |
| `control.searchFields` | configurable search TCA (#106972, #106976) |
| `control.is_static` (#106863) | — |
| `eval=year` (#98070) | — |
| value picker `prepend`/`append` modes (#107677) | — |
| `interface` settings for list view (#106412) | — |
| `pages.url` field (#17406) | typolink page type |
| `tt_content.list_type` + `tt_content.list` (#105538, #105377) | Register plugins as CTypes instead — use `ExtensionUtility::registerPlugin()` (v13+) or direct TCA overrides; remove `addPItoST43()` and `addPlugin()` with a plugin-type argument (both removed in v14). |
| flex pointer field functionality (#107047) | — |
| duplicate doktype restriction config (#106949) | — |
| Scheduler frequency options (moved to TCA #107488) | native TCA table (#106739) |

**Detection:**
```bash
grep -rn 'subtype_value_field\|subtypes_addlist\|searchFields\|is_static\|eval.*year\|list_type' Configuration/TCA/ --include='*.php'
```

---

### 1.7 Backend / UI

**Removed:**
- Modal migrated from Bootstrap to native `<dialog>` (#107443) — JS API changed
- "Database Relations" module (#97151)
- Reports interfaces (#107791)
- `@typo3/backend/document-save-actions.js`, `@typo3/backend/wizard.js`, `@typo3/t3editor/*`
- Backend layout data provider `$GLOBALS` registration (#107784)
- `LoginProviderInterface::render()` → implement `modifyView()`
- Workspace "Freeze Editing" (#107323)
- Button API reworked (#107884, #107823)

---

### 1.8 EXT:form hooks (use PSR-14 events)

All **removed** in v14.0:
- `afterBuildingFinished` (#98239)
- `beforeFormCreate` (#107343)
- `beforeFormDuplicate` (#107380)
- `beforeFormDelete` (#107382)
- `beforeFormSave` (#107388)
- `initializeFormElement` (#107518)
- `beforeRemoveFromParentRenderable` (#107528)
- `afterInitializeCurrentPage` (#107566)
- `afterSubmit` (#107568)
- `beforeRendering` (#107569)
- Legacy form templates (#106596)

---

### 1.9 TypoScript / TSconfig

**Removed:**
- `<INCLUDE_TYPOSCRIPT: ...>` — use `@import`
- TypoScript condition `getTSFE()` (#107473)
- `config.tx_extbase.persistence.updateReferenceIndex` toggle (#106041)
- TSconfig `options.pageTree.backgroundColor`
- `$GLOBALS['TYPO3_CONF_VARS']['BE']['defaultPageTSconfig']`, `defaultUserTSconfig`

**New opt-in required:**
- TypoScript/TSconfig callables (userFunc) now require explicit allow-listing (#108054)

---

### 1.10 Security / crypto changes

**Changed behavior:**
- HMAC algorithm strengthened: SHA1 → SHA256 family (#106307). Persisted HMACs minted on v13 may need regeneration.

**Removed:**
- `AuthenticationService` static function parameter (#106869)
- `AfterMailerInitializationEvent` (#105809)
- `MailMessage->send()` (#108097)
- `Extbase HashService` — replaced by `TYPO3\CMS\Core\Crypto\HashService` + built-in symmetric cipher service (#108002)

---

### 1.11 Install / packaging

**Removed:**
- `typo3/install.php` entry point — integrated into backend routing (#107536, BC preserved)
- `typo3/index.php` legacy entry + composer.json setting
- `Environment::getComposerRootPath()` (#107482)

**New requirements:**
- **Classic mode: `composer.json` is now required** (#108310). Extensions detected via composer.
- Extension title auto-populated from `composer.json` (#108304).

---

## Part 2 — Deprecated in v14 (must fix before v15)

No removals; all removed in v15.0.

### 2.1 v14.0 deprecations

| Ticket | Item | Replacement |
|---|---|---|
| #93981 | `GraphicalFunctions->gif_or_jpg` | native-format decisions |
| #97559 | Array-of-config to Extbase attributes | individual attrs |
| #97857 | `__inheritances` form config operator | explicit inheritance |
| #98453 | Scheduler task via `SC_OPTIONS` | `#[AsScheduledTask]` attribute |
| #106393 | Various `BackendUtility` methods | see ticket |
| #106405 | `AbstractTypolinkBuilder->build()` | `TypolinkBuilderInterface::build()` |
| #106527 | `markFieldAsChanged()` location | FormEngine main module |
| #106618 | `GeneralUtility::resolveBackPath` | `PathUtility::resolveBackPath` |
| #106947 | Upgrade wizard interfaces | moved to EXT:core |
| #106969 | TSconfig `auth.BE.redirectToURL` | new mechanism |
| #107047 | `ExtensionManagementUtility::addPiFlexFormValue()` | — |
| #107057 | Auto-render assets sections | explicit render |
| #107225 | Boolean sort direction in `FileList->start()` | enum |
| #107229 | Annotation namespace of Extbase attributes | PHP attrs |
| #107287 | `FileCollectionRegistry->addTypeToTCA()` | — |
| #107413 | `PathUtility::getRelativePath*` methods | — |
| #107436 | Custom localization Parsers | Symfony Translation Loaders |
| #107537 | `GeneralUtility::createVersionNumberedFilename`, `FilePathSanitizer`, `PathUtility::getPublicResourceWebPath` | System Resource API |
| #107550 | Table GC task config via `$GLOBALS` | TCA |
| #107562 | IP Anonymization task config via `$GLOBALS` | TCA |
| #107648 | `InfoboxViewHelper::STATE_*` constants | enum |
| #107725 | Array for password in Redis cache backend auth | username+password fields |
| #107813 | `MetaInformation` API in DocHeader | new API |
| #107823 | ButtonBar/Menu/MenuRegistry `make*` methods | ComponentFactory |
| #107938 | Unused XLIFF files | — |
| #107963 | sys_redirect default type renamed to `default` | — |
| #108008 | Manual shortcut button creation | — |
| #108148 | Fluid `LenientArgumentProcessor` | strict arg processing |
| #108227 | `#[IgnoreValidation]` / `#[Validate]` at **method level** | attach to parameter instead |

### 2.2 v14.1 deprecations

| Ticket | Item |
|---|---|
| #108086 | Deprecation error on using deprecated labels |
| #108524 | Fluid namespaces in `TYPO3_CONF_VARS` |
| #108667 | `CommandNameAlreadyInUseException` |

### 2.3 v14.2 deprecations

| Ticket | Item | Replacement |
|---|---|---|
| #69190 | Random password generator for FE/BE users | new wizard |
| #100887 | `useNonce` argument in `f:asset:css`/`script` | CSP hashes |
| #107068 | `fieldExplanationText` | `description` |
| #107208 | `<f:debug.render>` ViewHelper | `<f:debug>` |
| #107802 | Array for password in Redis session backend | username+password |
| **#108345** | **`ext_emconf.php` as primary metadata** | **`composer.json`** |
| #108557 | TCA `allowedRecordTypes` for Page Types | `isViewable` (#97898) |
| #108568 | `BackendUserAuthentication::recordEditAccessInternals()` | — |
| #108653 | **Form file-based (YAML) storage** | **DB storage** |
| #108761 | `BackendUtility` TSconfig methods | — |
| #108810 | `BackendUtility` localization methods | — |
| #108843 | `ExtensionManagementUtility::addFieldsToUserSettings` | TCA |
| #108963 | `PageRenderer->addInlineLanguageDomain()` | — |
| #109027 | `language:update` command moved to EXT:core | — |
| #109029 | FormEngine `doSave` hidden field | — |
| #109102 | FormEngine `additionalHiddenFields` key | — |
| #109152 | Form DatePicker element | — |
| **#109171** | **Bootstrap tab events** | native events |
| #109192 | FormEngine OuterWrapContainer | — |
| #109196 | `doktypesToShowInNewPageDragArea` user TSconfig | — |
| #109230 | FormResultCompiler | — |
| #109280 | FormEngine TcaDescription fieldInformation | — |
| #109286 | Explicit request handling in PageRenderer | — |
| #109295 | `DatabaseWriter::setLogTable()/getLogTable()` | — |
| #109306 | Form editor stage template rendering | — |
| #109329 | `PageRenderer` get() methods | — |
| #109409 | Arbitrary resource access + "Allowed paths" config | System Resource API |
| #109412 | TypoScript-based form YAML registration | auto-discovery |

### 2.4 v14.3 deprecations (v15-preparation, last chance)

| Ticket | Item | Replacement |
|---|---|---|
| #107931 | Lowlevel `DatabaseIntegrityCheck` | — |
| #109107 | CacheAction key `href` | JSON response |
| **#109438** | **`ext_tables.php` in extensions** | **`Configuration/Backend/Modules.php`, `Routes.php`, `TCA/Overrides/be_users.php` + `pages.php`** |
| #109517 | `AddJavaScriptModulesEvent` in EXT:setup (ext merged into backend) | — |
| #109519 | `BackendUtility` item list label methods | — |
| #109523 | `GeneralUtility::isOnCurrentHost()` without PSR-7 request | pass `$request` |
| #109529 | Page module section markup events | — |
| #109544 | `GeneralUtility::sanitizeLocalUrl()` without PSR-7 request | pass `$request` |
| #109548 | `GeneralUtility::locationHeaderUrl()` without PSR-7 request | pass `$request` |
| #109551 | `GeneralUtility::getIndpEnv()` | PSR-7 request attributes |
| #109575 | Various `ContentObjectRenderer` properties/methods | — |

**Direction of travel:** v15 drives out superglobals and static state in favor of injected PSR-7 request + stateless services.

---

## Part 3 — New v14 capabilities to recommend (excellence bonus)

Award excellence bonus for extensions that adopt these early:

| Feature | Ticket | Bonus |
|---|---|---|
| `#[Authorize(requireLogin: true, requireGroups: [...])]` on sensitive actions | #107826 | +2 |
| `#[RateLimit(limit: N, interval: 'Ns')]` on login / password-reset / import | #108982, #109080 | +2 |
| TCA `type=country` for country fields | #99911 | +1 |
| `allowedRecordTypes` per colPos (content element restrictions) | #108623 | +1 |
| Symfony Validators via Extbase attributes (`#[Assert\\...]`) | #106945 | +1 |
| SRI `integrity` attribute on `f:asset:css/script` | #109187 | +1 |
| `f:render.contentArea` / `f:render.record` / `f:render.text` | #108726, #108868 | +1 |
| Symfony Translation Component integration + XLIFF 2.x | #107436, #107710 | +1 |
| `fluid:analyze` CLI clean | #108763 | +1 |
| `composer.json`-only metadata (no `ext_emconf.php`) | #108345 | +2 |
| No `ext_tables.php` (split to `Configuration/Backend/*.php`) | #109438 | +2 |
| Site configurations shipped as Site Sets | v13+ | +1 |

---

## Part 4 — v14-specific post-upgrade operations

### Important #109585 — serialized credential data fix

**Scope:** Any site that ran **v14.2** (not 14.0, not 14.1).
**Issue:** Password change during v14.2 runtime may have persisted serialized plaintext into `be_users.uc`/`user_settings`.
**Action:** Run the v14.3 upgrade wizard that unserializes, strips password fields, re-serializes.
**Detection:** Install Tool → Upgrade → Upgrade Wizards (the wizard auto-appears if applicable).

See [Important-109585-SerializedCredentialDataInBeUsersDatabaseTable](https://docs.typo3.org/c/typo3/cms-core/main/en-us/Changelog/14.3/Important-109585-SerializedCredentialDataInBeUsersDatabaseTable.html).

---

## Part 5 — Quick conformance grep recipes for v14

```bash
# Removals (must fix)
grep -rn 'HashService\|GeneralUtility::hmac(' Classes/ --include='*.php'
grep -rn '->findBy[A-Z]\|->findOneBy[A-Z]\|->countBy[A-Z]' Classes/ --include='*.php'
grep -rn "GLOBALS\['TSFE'\]\|TypoScriptFrontendController" Classes/ --include='*.php'
grep -rn 'StandaloneView\|AbstractTemplateView\|renderStatic' Classes/ --include='*.php'
grep -rn '@Extbase\\Annotation' Classes/ --include='*.php'
grep -rn 'subtype_value_field\|subtypes_addlist\|control.searchFields\|eval.*year\|list_type' Configuration/TCA/ --include='*.php'

# Deprecations (fix before v15)
[ -f ext_tables.php ] && echo "WARN: ext_tables.php deprecated (#109438)"
[ -f ext_emconf.php ] && echo "INFO: ext_emconf.php present - ensure composer.json has complete metadata (#108345)"
grep -rn 'useNonce' Resources/Private --include='*.html'
grep -rn 'GeneralUtility::getIndpEnv\|GeneralUtility::sanitizeLocalUrl\|GeneralUtility::locationHeaderUrl\|GeneralUtility::isOnCurrentHost' Classes/ --include='*.php'

# Excellence / adoption
grep -rn '#\[Authorize\|#\[RateLimit' Classes/Controller --include='*.php'
grep -rn 'f:render.contentArea\|f:render.record\|f:render.text' Resources/Private --include='*.html'
```

---

## Part 6 — Migration tooling

- **TYPO3 Rector** — 47 v14 rules in `rules/TYPO314/v{0,2}/`. Invoke with `vendor/bin/rector process`; target individual rules with `--only <RuleClass>` (new CLI in v14 Rector).
- **TYPO3 Fractor** (`a9f/typo3-fractor`) — handles TypoScript, FlexForm XML, `composer.json` normalization, `.htaccess`, `ext_emconf.php` → `composer.json` migration, `ext_tables.php` split-off helpers.
- **Extension Scanner** — Install Tool → Upgrade → Scan Extension Files. Matchers cover the #105377 umbrella, Fluid 5 strictness, FAL strong-typing, cache interface strict-typing.
- **PHPStan** — `saschaegerer/phpstan-typo3` bundle covers strict-types expectations.

---

## Scoring impact

| Situation | Score effect |
|---|---|
| Any Part 1 removal present | Critical issue — **block v14 support** |
| Extension supports v14 but uses HashService/TSFE/magic finders | -20 points (architecture) |
| `ext_tables.php` present in extension claiming v14.3+ | -5 points + deprecation warning |
| `ext_emconf.php` still sole metadata source | -3 points |
| Uses `#[Authorize]`/`#[RateLimit]` on sensitive actions | +4 excellence bonus |
| No removed/deprecated usage, full v14 adoption | +8 excellence bonus |
