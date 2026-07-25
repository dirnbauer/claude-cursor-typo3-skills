# P08 — Manual v14 migration (loop 130)

Track `invariance`. Everything Rector and Fractor could not do.

Load `typo3-update` here as the **v14 API reference** — but constraints, PHP target and process stay
with this skill.

## Steps
1. Resolve v14 changelog items and extension-scanner findings for every used API surface, including
   what the tools do not cover.
2. Remove `TYPO3_version` branches, v12/v13 constraints, compatibility helpers, deprecated hooks that
   have documented event replacements, legacy backend module registration, obsolete TypoScript,
   unused XLF keys and dead imports.
3. **Keep legitimate DataHandler hooks where no real PSR-14 event exists.** Never replace a hook with
   a guessed event name — verify against the installed source.
4. Make TCA and schema v14-compliant, preserve localisation and relations, and add upgrade wizards
   for persisted data changes. Test migrations with representative data.
5. Make record reads, writes, previews, overlays, file handling and rendering workspace-aware. Add
   tests for create, edit, preview, publish, discard, localisation and relations. Account explicitly
   for FAL's workspace limitations.
6. Preserve extension behaviour unless the user approved a breaking change. Add regression tests
   **before** risky rewrites, not after.

## Exit
0 strong extension-scanner matches; no `TYPO3_version` branch or v12/v13 constraint left in
executable code or configuration.

## Blocking
A guessed event name. A behaviour change without an approval.

## Note
Historical mentions of v12/v13 may remain in upgrade documentation and the changelog — that is
documentation, not executable code.

