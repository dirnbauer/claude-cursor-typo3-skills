# Backend-User Access in Functional Tests (non-admin, page & file mounts)

> **Source**: netresearch/t3x-nr-llm — testing per-user access enforcement on tools that egress data to an external LLM (2026-07). Verified on TYPO3 v13.4 / v14.3.

Testing that a **non-admin** backend user is correctly *confined* (to pages, languages, file mounts) is a common security requirement — and the framework setup is unobvious. These recipes let a functional test drive a real non-admin who genuinely passes or fails the core access checks, instead of a check that passes for the wrong reason.

## `groupData` overrides apply live after `setUpBackendUser()`

`setUpBackendUser($uid)` authenticates the user (so `fetchGroupData()` has run). You can then override the resolved permission data directly on `$GLOBALS['BE_USER']->groupData` and the core access methods honour it immediately — no re-auth needed:

```php
$this->setUpBackendUser(2); // a non-admin from BeUsers.csv
$beUser = $GLOBALS['BE_USER'];
self::assertInstanceOf(BackendUserAuthentication::class, $beUser); // narrows mixed for PHPStan
$beUser->groupData['webmounts']         = '5';           // getWebmounts() reads this
$beUser->groupData['tables_select']     = 'tt_content';  // check('tables_select', …) reads this
$beUser->groupData['allowed_languages'] = '0';           // checkLanguageAccess() reads this
```

## A non-admin reading a page: `readPageAccess` needs a web mount over the rootline

`BackendUtility::readPageAccess($uid, $permsClause)` returns `false` unless **both**:

1. the page matches the perms clause (`getPagePermsClause(Permission::PAGE_SHOW)`), **and**
2. `isInWebMount($uid, …)` is true — the page's **rootline** intersects `getWebmounts()`.

The web-mount step is the one that bites: giving a page `perms_everybody` is *not enough*. The web mount must cover the page's rootline. The simplest isolation is a **root page** (`pid = 0`, so its rootline is just itself) with the web mount pointing at it:

```php
$conn = $this->get(ConnectionPool::class)->getConnectionForTable('pages');
$conn->insert('pages', [
    'uid' => 5, 'pid' => 0, 'title' => 'Public', 'doktype' => 1,
    'sorting' => 5, 'perms_everybody' => Permission::PAGE_SHOW,
]);
$this->setUpBackendUser(2);
$GLOBALS['BE_USER']->groupData['webmounts'] = '5'; // rootline of page 5 is [5]
```

**Why it matters for a security test:** if the non-admin cannot reach *any* page, a "denied" assertion passes trivially (denied by page access, not by the thing you meant to test — e.g. a language gate). Make the user genuinely able to read the page, so the gate under test is the only variable.

## A non-admin confined to a file mount (real FAL enforcement)

To test that a tool only surfaces files inside the user's file mount, the `ResourceStorage` object must be built **while the non-admin is logged in inside a backend request** — only then does the core `StoragePermissionsAspect` (on `AfterResourceStorageInitializationEvent`) attach that user's file mounts and permissions to the storage. So insert the storage as a **DB row**, never instantiate it in `setUp`, and set a BE request in the test:

```php
private const STORAGE_CONFIGURATION = '<?xml version="1.0" ...>
<T3FlexForms><data><sheet index="sDEF"><language index="lDEF">
<field index="basePath"><value index="vDEF">fileadmin/</value></field>
<field index="pathType"><value index="vDEF">relative</value></field>
</language></sheet></data></T3FlexForms>';

// setUp: real files on disk + rows only (no ResourceStorage object yet)
GeneralUtility::mkdir_deep($this->instancePath . '/fileadmin/docs');
file_put_contents($this->instancePath . '/fileadmin/docs/manual.txt', 'in');
file_put_contents($this->instancePath . '/fileadmin/top-secret.txt', 'out');
$conn->insert('sys_file_storage', ['uid' => 1, 'pid' => 0, 'name' => 'Main', 'driver' => 'Local',
    'configuration' => self::STORAGE_CONFIGURATION, 'is_online' => 1, 'is_browsable' => 1, 'is_public' => 1]);
$conn->insert('sys_filemounts', ['uid' => 1, 'pid' => 0, 'title' => 'Docs', 'identifier' => '1:/docs/']);
$conn->insert('be_groups', ['uid' => 9, 'pid' => 0, 'title' => 'Docs', 'file_mountpoints' => '1',
    'file_permissions' => 'readFolder,readFile']);
$conn->update('be_users', ['usergroup' => '9', 'options' => 3], ['uid' => 2]); // options=3: inherit db+file mounts

// sys_file index rows — the *_hash columns must be the real sha1 identifier hash
// that core computes, or getFile() will not resolve the row:
$conn->insert('sys_file', ['uid' => 10, 'pid' => 0, 'storage' => 1, 'identifier' => '/docs/manual.txt',
    'identifier_hash' => sha1('/docs/manual.txt'), 'folder_hash' => sha1('/docs'),
    'name' => 'manual.txt', 'extension' => 'txt', 'mime_type' => 'text/plain', 'size' => 2, 'missing' => 0]);

// in the test: fake the backend request so StoragePermissionsAspect fires on first storage build
$this->setUpBackendUser(2);
$GLOBALS['TYPO3_REQUEST'] = (new ServerRequest('https://typo3-testing.local/typo3/'))
    ->withAttribute('applicationType', SystemEnvironmentBuilder::REQUESTTYPE_BE);
// tearDown(): unset($GLOBALS['TYPO3_REQUEST']);
```

A single indexed file's `sys_file` row needs no file on disk for `getFile()` to *resolve* it (the driver stats disk only for content reads), but the `identifier_hash` **must** be `sha1($identifier)`.

## FAL permission API: `getFile()` does NOT assert — the mock-validity trap

The most dangerous mistake here is testing enforcement against a **fabricated** mock. `ResourceStorage::getFile($identifier)` only *resolves* the index row; it never calls `assureFileReadPermission()` / `isWithinFileMountBoundaries()` and so **`setEvaluatePermissions(true)` has no effect on it**. Stubbing `getFile()->willThrowException()` for "out of mount" invents a behaviour core never exhibits — the test goes green while the production gate enforces nothing (security-theater).

The methods that *do* assert (honour `evaluatePermissions` + the attached file mounts):

- `checkFileActionPermission('read', $file)` — returns `bool` (no throw), the cleanest per-file gate;
- `isWithinFileMountBoundaries($file)` — returns `bool`;
- `getFolder($id)` / `getFilesInFolder()` — **throw** outside the mount (this is why `getFolder`-based browsing enforces while `getFile` does not).

So: verify FAL mount enforcement with the **real storage + file-mount functional recipe above**, not a `getFile` stub. See also `mock-validity.md`.
