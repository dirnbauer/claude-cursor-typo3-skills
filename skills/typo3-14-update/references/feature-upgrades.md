# Feature upgrades — Solr, Visual Editor, CKEditor RTE, security headers

Phase P10, loops 200–230. Each runs **after** the core upgrade and **before** invariance closure,
and each is a declared-change loop: re-shoot the affected sample pages afterwards, and any rendering
change needs an approval per difference class or it is a `regression`.

## Loop 200 — Solr

Only when the site uses `EXT:solr`.

1. Read the [EXT:solr version matrix](https://docs.typo3.org/p/apache-solr-for-typo3/solr/main/en-us/Appendix/VersionMatrix.html)
   for the row matching TYPO3 14.3.
2. Update the local DDEV Solr service through the official `ddev/ddev-solr` add-on to that Apache
   Solr version, with the matching configset.
3. Update EXT:solr, search templates and configuration following the `typo3-solr` skill.

Require the 14 line with a **per-package stability flag**:

```bash
ddev composer require apache-solr-for-typo3/solr:"^14.0@RC"
```

That line is currently a release candidate. The flag loosens stability for this one package while
leaving the project's global `minimum-stability: stable` and `prefer-stable: true` intact, and it
needs no later edit — Composer prefers the stable 14.0.0 automatically once it ships.

**Never loosen global stability to install a single package.** Verify the resolved version and its
TYPO3 requirement before continuing.

Exit: index queue rebuilt and fully reindexed; the backend Info module shows the site as active;
frontend search verified including empty and paginated results.

## Loop 210 — Visual Editor

Require the latest v14-compatible `friendsoftypo3/visual-editor`, verified on Packagist at execution
time. Migrate the Fluid templates with the `typo3-visual-editor` skill — `f:render.text`, content
areas, colPos migration.

Exit: inline editing verified on a representative page in the backend, **and frontend rendering
unchanged** — the visual sample is what proves the second half.

## Loop 220 — CKEditor RTE

Migrate old RTE presets into the current v14 `rte_ckeditor` YAML: import the old settings, drop
obsolete keys, and verify every option against the installed version.

Enable **text part language** so editors can mark passages with `<span lang="…">` for the site's
configured languages, and add **abbreviation support** through a maintained CKEditor 5 plugin
extension found on TER or Packagist and verified against v14 — never guess plugin package names.

Align the editor's content styles with the frontend, but scale down oversized elements (a very large
`h2`, for example) for editing ergonomics.

### Both features need styling on both sides

Semantic markup nobody can see does not survive the next editing round.

**Backend**, via `editor.config.contentsCss` in the preset: give `abbr[title]` and `span[lang]` a
visible affordance in the editing area — a dotted underline plus `cursor: help` for abbreviations, a
subtle marker for language spans — so editors can find, verify and maintain what they inserted.

TYPO3 v14 renders CKEditor inline and auto-prefixes this file client-side, so `:root` and `body`
rules work and resolve to the `.ck-content` scope. The file is browser-cached: append a `?v=`
parameter to the path and bump it after every change, or edits appear to do nothing.

**Frontend**, via the Vite/SCSS pipeline: give `abbr[title]` a consistent affordance across browsers,
whose native rendering is inconsistent, and keep the expansion understandable without hover — touch
and keyboard users cannot hover. Leave `span[lang]` visually **undecorated**: it is semantic markup
for assistive technology, not decoration for readers. Let the attribute do its typographic work
through `:lang()` rules for hyphenation, quotation marks and font stack.

Frontend CSS changes rendering, so this loop follows the re-shoot and approval rule.

Exit: open a rich-text element and confirm the preset loads with language and abbreviation controls,
applies the intended styling, and shows the affordances on marked-up text; confirm the same markup
renders correctly in the frontend; confirm the accessibility re-check stays green.

## Loop 230 — Security headers

Apply the `typo3-security` checklist: HSTS, `X-Content-Type-Options`, `X-Frame-Options` /
`frame-ancestors`, `Referrer-Policy`, `Permissions-Policy`, `trustedHostsPattern`, backend hardening,
and CSP through the TYPO3 v14 CSP API — configured at **a single layer without conflicting
duplicates**.

Verify the header values on DDEV responses. Differences that exist only on production layers (proxy,
CDN) belong in the deployment handover and are **never** applied to live from here.

Note honestly what DDEV cannot prove: DDEV terminates its own TLS, so HSTS is *present* locally but
only *meaningful* on the production layer; third-party embeds that exist only on live can hide CSP
violations that would appear in production. Both go into the handover as named gaps.

Exit: headers verified on DDEV responses at a single layer, no duplicates, and a Playwright walk of
the sample plus the backend module sweep records zero CSP violations.
