# RST Syntax Reference

TYPO3-specific reStructuredText conventions. Generic RST/Sphinx syntax
(inline formatting, code-block basics, plain tables, admonitions, images,
toctree, comments, substitutions) is not repeated here — see
[`code-structure-elements.md`](code-structure-elements.md) for code blocks
and `literalinclude`, [`content-directives.md`](content-directives.md) for
tables, admonitions, and comments, [`screenshots.md`](screenshots.md) for
images, [`coding-guidelines.md`](coding-guidelines.md) for
indentation/whitespace, [`file-structure.md`](file-structure.md) for
toctree and substitutions, and [`typo3-directives.md`](typo3-directives.md)
for permalink anchors and intersphinx `:ref:` targets.

## Headings

```rst
===========================
Page title in sentence case
===========================

Section heading
===============

Subsection heading
------------------
```

| Level | Character | Usage |
|-------|-----------|-------|
| 1 (Title) | `=` above and below | Page title only |
| 2 | `=` below | Major sections |
| 3 | `-` below | Subsections |
| 4 | `~` below | Sub-subsections |
| 5 | `"` below | Paragraphs |
| 6 | `'` below | Deep nesting |
| 7+ | `^`, `#` | Rarely used |

Underline-length and sentence-case rules are in
[`coding-guidelines.md`](coding-guidelines.md#heading-hierarchy); permalink
anchor requirements are in
[`typo3-directives.md`](typo3-directives.md#permalink-anchors-labels).

## Lists

RST bullet/numbered/definition list syntax is standard Sphinx. TYPO3 house
style adds one rule:

**Punctuation Rules:**
- **End with periods**: All list items should end with a period (`.`)
- ✅ Correct: `1. Retrieve project metadata to get available languages.`
- ❌ Wrong: `1. Retrieve project metadata to get available languages`
- Exception: Single-word or very short items may omit periods for readability

## README.md and Documentation/ Synchronization

Keep README.md and Documentation/ in sync to avoid contradictions.

**Content Parity:**
- Topics covered in README.md should have corresponding coverage in Documentation/.
- New features added to README.md should be documented in the appropriate .rst files.
- README.md serves as a quick-start; Documentation/ provides comprehensive details.

**Consistency (No Contradictions):**
When README.md and Documentation/ cover the same topics, they must not contradict each other:

- **CLI commands**: Command names and option flags must match.
  - ❌ README: `vault:master-key:rotate --new-key-file=...`
  - ✅ Docs: `vault:rotate-master-key --new-key=...`
  - Fix: Update README to match Documentation/.
- **Code examples**: TCA configs, API usage, class names must be consistent.
  - ❌ README: `'type' => 'user'`
  - ✅ Docs: `'type' => 'input'`
  - Fix: Update README to match Documentation/.
- **Configuration values**: Defaults and option names must align.

**Source of Truth:**
- Documentation/ is the authoritative source.
- When inconsistencies are found, update README.md to match Documentation/.
- Commit README.md and Documentation/ changes together atomically.

## Common Documentation Errors

Patterns of errors found during TYPO3 v13 extension documentation reviews. Check for these issues before publishing.

### Version Directive Accuracy

`versionadded` and `versionchanged` directives must reference actually released versions, not planned or future versions:

```rst
.. Good -- references a released version
.. versionadded:: 3.0.0
   Added support for TYPO3 v13.

.. Bad -- references a version that does not exist yet
.. versionadded:: 3.2.0
   Will add multi-site support.
```

**Validation:** Cross-check every version number in directives against git tags (`git tag --list`) and `ext_emconf.php`.

### ChangeLog Completeness

The ChangeLog section must include ALL released versions. Missing versions create gaps in the project history:

- Check git tags: `git tag --list --sort=-version:refname`
- Every tagged release must have a corresponding ChangeLog entry
- Entries must be in reverse chronological order (newest first)

### Language and Feature Count Claims

Numeric claims in documentation must be verifiable:

- **Language count:** "Supports N languages" must match the actual number of files in `Resources/Private/Language/`. Count with: `ls -1 Resources/Private/Language/*.xlf | wc -l`
- **Feature lists:** If documentation claims "5 CLI commands", verify with: `grep -rl 'extends Command' Classes/Command/ | wc -l`
- **Configuration option counts:** Verify against `ext_conf_template.txt` or TCA definitions

### Speculative Roadmap Content

Documentation for unreleased versions (e.g., 3.1.0, 3.2.0, 4.0.0 planned features) must be handled carefully:

- Remove speculative feature descriptions from published documentation entirely, OR
- Clearly mark roadmap content with an explicit admonition:

```rst
.. note::
   The following features are planned for future releases and are
   subject to change. They are not available in the current version.
```

- Never use `versionadded` or `versionchanged` for unreleased versions

### Unresolved TODO Directives

`.. todo::` directives should not appear in published documentation. Before release:

- Search for all TODOs: `grep -rn '.. todo::' Documentation/`
- Either resolve each TODO with actual content, or remove it
- If a TODO must remain (rare), move it to a comment so it does not render

### TypoScript Documentation Accuracy

TypoScript examples must reflect actual file contents:

- **Backend modules** use `module.` prefix, not `plugin.`:
  ```typoscript
  # Correct for backend modules
  module.tx_myext {
      settings.itemsPerPage = 20
  }

  # Wrong -- plugin. prefix is for frontend plugins only
  plugin.tx_myext {
      settings.itemsPerPage = 20
  }
  ```
- Sub-key paths must match the actual TypoScript setup files in `Configuration/TypoScript/`
- Default values in documentation must match the values in the shipped `.typoscript` files

### Screenshot Placeholders

Screenshot sections must contain actual images or be clearly marked:

- Every `.. figure::` or `.. image::` directive must reference an existing file
- Validate with: `grep -rn '.. figure::\|.. image::' Documentation/ | while read line; do file=$(echo "$line" | grep -oP '(?<=:: ).*'); [ ! -f "$file" ] && echo "MISSING: $line"; done`
- If screenshots are not yet available, use a visible placeholder admonition instead of an empty or broken image reference:

```rst
.. note::
   Screenshot pending. This section will be updated with actual
   screenshots in a future revision.
```

- Never leave empty `Images/` directories or broken image references in published docs

## References

- **Sphinx RST Guide:** https://www.sphinx-doc.org/en/master/usage/restructuredtext/basics.html
- **Docutils RST:** https://docutils.sourceforge.io/rst.html
- **TYPO3 Documentation Guide:** https://docs.typo3.org/m/typo3/docs-how-to-document/main/en-us/
