---
name: "typo3-shadcn-content-elements"
description: "Produces, audits, and overhauls TYPO3 Content Blocks content elements styled with shadcn/ui presets, semantic tokens, Fluid atoms, backend previews, icons, and seed data. Use when the user asks to create, restyle, review, seed, iconize, or preview TYPO3 Content Blocks with shadcn/ui, Tailwind v4 tokens, no-hardcoded-style rules, or local registry presets."
compatibility: "TYPO3 14.x"
metadata:
  version: "1.7.0"
  origin: "webconsulting"
license: "MIT / CC-BY-SA-4.0"
---

# TYPO3 shadcn Content Elements

> Source: https://github.com/dirnbauer/webconsulting-skills

## Purpose

Use this skill to build TYPO3 Content Blocks content elements that behave like a coherent shadcn/ui system:
preset-driven tokens, shared Fluid atoms/molecules, complete field coverage, useful backend previews, semantic
icons, local shadcn registry items, and seed data that makes the styleguide pages credible.

This skill assumes Content Blocks are the source of truth for schema and TYPO3 owns rendering. shadcn/ui is
the source for theme tokens, component class contracts, data attributes, states, spacing, borders, radius, and
typography.

The styling rule is strict: content elements should not hardcode colors or theme-specific visual values. Raw
`oklch()`, `hsl()`, `rgb()`, hex colors, and fixed light/dark assumptions belong in the committed shadcn theme
token source only. Templates, element CSS, backend preview CSS, generated icons, and chart scripts should
consume semantic tokens or Tailwind/shadcn utility classes.

## Desiderio Creation Contract

When creating or overhauling Desiderio shadcn/ui content elements, respect these project-specific rules before general preferences:

- Use TYPO3 14, Content Blocks 2.x, and Fluid 5.3 templates. Frontend entrypoints stay in
  `templates/frontend.fluid.html` (the Content Blocks 2.x default since 2.0.4; plain `frontend.html` is the
  legacy 1.x name); backend previews stay in `templates/backend-preview.fluid.html`.
- TYPO3 owns rendering. Do not copy React, Radix, or Astro framework components into the runtime. shadcn/ui is
  the source for tokens, class contracts, states, radius, spacing, focus rings, and component anatomy.
- Use Desiderio Fluid atoms/molecules/components where they exist, especially `d:layout.section`,
  `d:layout.container`, `d:atom.typography`, `d:atom.icon`, buttons, badges, cards, form controls, tabs,
  accordions, tables, alerts, dialogs, and chart wrappers.
- Respect responsive design in every element: mobile-first grids, stable dimensions for fixed-format UI, no
  text overflow, no incoherent overlap, and layouts that still read well at narrow and wide widths.
- Keep designs genuinely polished. Prefer clear editorial/product systems with strong hierarchy, deliberate
  spacing, real media or useful demo content, and restrained shadcn surfaces. Avoid decorative-only gradients,
  orphan cards, nested cards, and generic placeholder copy.
- Use only semantic tokens and shadcn/Tailwind classes in templates and CSS. Raw color values are allowed only
  in theme token files and generated Tailwind output.
- Use XLIFF 2.0 labels with modern stable ids such as `copy_code`, `preview.uid`, or `field.headline`. Provide
  English base labels and German labels for editor-facing strings. Use ICU MessageFormat for variable or
  pluralized labels instead of concatenating strings.
- Use `LLL:` references for labels in Content Blocks YAML, backend previews, and templates. Do not hardcode
  editor-facing labels in Fluid when they belong in XLIFF.
- For behavior that pure HTML, CSS, and shadcn classes cannot cover, use the shared Desiderio Astro runtime in
  `Resources/Public/Js/astro.js`. Templates should emit data attributes such as `data-astro-counter`,
  `data-astro-reveal`, `data-astro-highlight`, `data-astro-copy`, `data-astro-tilt`, or `data-astro-marquee`.
- Do not add inline `<script>` blocks to content element templates. Add idempotent behavior to shared JS
  include files, register them through TypoScript or AssetCollector, and make reduced-motion behavior
  explicit.
- Code examples should use the editorial code-block element with `data-astro-highlight` and the copy control.
  Keep source text escaped in Fluid and let the runtime decorate tokens after load.
- For forms, use TYPO3 Form Framework definitions under `Resources/Private/Forms`, TypoScript renderers in the
  Site Set, and `typo3/cms-form` as a Composer runtime dependency. Do not hand-roll mail forms in Fluid
  templates.
- Configure form mail routing through TYPO3 form finishers and Site Settings (`desiderio.forms.*`). Use a
  PSR-14 listener, such as `BeforeEmailFinisherInitializedEvent`, only to map site-specific sender/receiver
  options. Do not invent a `setup.php` mail mapping layer.
- CAPTCHA is opt-in and must be TYPO3 Form-compatible. Prefer honeypot, validation, throttling, and
  server-side spam checks first. If a real CAPTCHA provider is required, keep provider keys in Site Settings
  or environment configuration, never in templates, fixtures, or registry items.
- Seed data is part of the design. Every element needs credible English/German demo copy, valid links,
  meaningful icons, realistic metrics, useful code snippets, structured repeatables, image alt/source data,
  and select values that match the current `config.yaml`.
- Verify visually in the browser after changes. For Desiderio styleguide work, check the local DDEV site and
  the relevant page URL, including the full styleguide/catalog pages, not just the element that was edited.
- Finish with project checks: `php scripts/audit-content-elements.php`, PHPUnit/static checks, Tailwind sync,
  registry build when registry files changed, JS syntax checks when shared JS changed, and a browser pass.

## Default Workflow

1. **Establish the preset source.**
   - If a shadcn/create URL or preset id is given, extract the id, for example `b4hb38Fyj`.
   - Run `npx shadcn@latest info --json` in the project when `components.json` exists. If a TYPO3/non-TS repo
     fails path resolution, add a small `tsconfig.json` plus scratch aliases so `components`, `ui`, `lib`,
     `utils`, and `hooks` resolve without copying React runtime code into TYPO3.
   - Use `shadcn create` or `https://ui.shadcn.com/create?item=preview` as a design-system source. Use an
     Astro scratch app when the user asks for Astro/include-file JavaScript patterns; use a Vite/React scratch
     app only to inspect primitive class contracts.
   - Do not install React/Astro components as TYPO3 runtime code. TYPO3 owns rendering; shadcn owns tokens, component contracts, and registry metadata.
   - Commit the preset as local CSS variables and Site Settings, for example
     `body[data-shadcn-preset="b4hb38Fyj"]`; do not add a runtime preset downloader or binary switcher.
   - Treat `:root` as the light-mode base and `.dark` as the dark-mode override, matching shadcn. Do not write
     content elements that only look correct in one mode.
   - Read `references/shadcn-preset-workflow.md` before changing theme tokens or primitive class strings.

2. **Audit before editing.**
   - Run `php <skill>/scripts/audit-content-elements.php <repo-root>` when working on a repo with `ContentBlocks/ContentElements`.
   - For Desiderio, also run the project audit script (`php scripts/audit-content-elements.php`) because it
     contains repo-specific hard checks for inline styles, raw colors, variant branches, undeclared rendered
     fields, and seed gaps.
   - If local PHP cannot load Composer because the extension requires PHP 8.3+, run the audit and PHPUnit
     through DDEV PHP 8.3. Copy the repo to a temporary path inside the DDEV project first so you do not
     mutate a dirty vendor checkout.
   - Use the output to prioritize missing previews, undeclared rendered fields, unused configured fields,
     missing labels, missing icons, and repeatable-field gaps.
   - Treat the audit as a starting point, then manually inspect high-risk templates. `fixture_missing_field`
     and `collection_child_seed_gap` can be soft signals when the project seeder auto-fills missing demo
     values, but the rendered seeded pages still need a visual pass.
   - Do not stop after icon-like fields. Loop through every Content Block element in the catalog and classify
     each issue as schema, template, CSS/token, JavaScript/include, backend preview, fixture, or seed-fallback
     work.
   - Search for structural workaround leftovers before declaring a pass complete: `f:split(`, pipe-delimited
     links such as `Label|https://...`, legacy list fields such as `features_list`, `specs_text`, `row_data`,
     comma-delimited `tier_values`, and monolithic `shadcn2fluid_*` fixture maps.
   - Classify leftovers carefully: compatibility converters in a seed script can remain only when they convert
     old input into current structured fields; templates, fixtures, Content Blocks schema, tests, and docs
     should demonstrate the current structured model.
   - Apply the Fluid safety checks from `references/content-element-contract.md`, especially for date/time
     formatting, `typolink` attributes, resource paths, and string-only ViewHelpers.

3. **Fix the shared component layer first.**
   - Update `Resources/Private/Components` atoms/molecules from generated shadcn class contracts before editing hundreds of individual templates.
   - Prefer shared Fluid components over bespoke content-element CSS.
   - Keep semantic shadcn tokens such as `bg-background`, `text-foreground`, `bg-card`, `border-border`,
     `ring-ring`, `text-muted-foreground`, `bg-primary`, and `text-primary-foreground`.
   - Put client-side behavior in shared include files registered through TypoScript, `f:asset.script`, or
     TYPO3's AssetCollector. Templates should emit data attributes and JSON payload attributes; they should
     not contain inline `<script>` renderers.
   - For charts and interactive patterns, mirror the shadcn component contract: data attributes, CSS variables
     such as `--chart-1` through `--chart-5`, idempotent initialization, and no hardcoded color fallbacks.
   - Read `references/styling-token-contract.md` before adding or changing element CSS, SVG icon colors, chart
     colors, shadows, overlays, or backend preview styling.

4. **Keep the local shadcn registry valid.**
   - If the project exposes Desiderio/shadcn patterns for reuse, keep a root `registry.json` and build output
     under a public registry endpoint such as `Resources/Public/ShadcnRegistry`.
   - Add a `components.json` registry namespace such as `"@desiderio": "Resources/Public/ShadcnRegistry/{name}.json"`.
   - Add scripts such as `shadcn:info` and `registry:build`, then run both after changing tokens, runtime assets, or registry item files.
   - Use current shadcn CLI commands as the source of truth: `shadcn info --json` for project configuration
     and `shadcn build --output <dir>` for registry output. The upstream registry is framework-agnostic, so a
     TYPO3 registry item may package Fluid, TypoScript, CSS token sources, JavaScript include files, and Site
     Settings when the item type describes that contract.
   - Registry items should package theme token sources, Tailwind source files, Site Settings, TypoScript asset
     includes, and shared runtime assets. Do not put generated Tailwind output or one-off page CSS into a
     registry item unless consumers actually need that build artifact.

5. **Audit each content element against its contract.**
   - Read `references/content-element-contract.md`.
   - For every element, compare `config.yaml`, `templates/frontend.fluid.html`, `language/labels.xlf`,
     `assets/icon.svg`, CSS/JS assets, backend preview, and seed coverage.
   - Treat `config.yaml:title` as an editor-facing product name. Prefer names like `Text & Media`, `Image Call
     to Action`, and `Logo Cloud Hero` over raw slugs such as `textmedia`, `CTA With Image`, or `Hero Logo
     Cloud`.
   - Use the `typo3-translations` skill for XLIFF format choices, English/German localization, ICU
     MessageFormat strings, `LLL:` references, and localized wizard group labels.
   - Generate element descriptions from the element purpose and schema so each description explains what
     editors can build. Do not reuse a single generic sentence across the catalog.
   - Every configured editor field should be rendered or intentionally marked backend-only.
   - Every rendered field should exist in `config.yaml`.
   - Every Collection child field should be rendered or intentionally omitted.
   - Treat editor `Style` / `variant` fields as contracts, not decorative metadata. Keep one only when the
     value is passed to an existing shadcn-backed Fluid component feature (for example Button/Badge/Alert
     variants or TabsList `default`/`line`) or when the template has a real layout/behavior branch. Do not
     keep `variant` fields that only append unused BEM modifier classes.
   - Prefer removing unsupported style fields over inventing bespoke visual variants. If a style option cannot
     be expressed by the shared shadcn atoms/molecules or existing shadcn class contracts, remove the field
     from `config.yaml`, frontend templates, backend previews, and fixtures.
   - If a repo-level test requires every content element to keep `assets/frontend.css`, use an
     empty/comment-only marker file when the shared component layer handles all styling. Do not re-add
     `f:asset.css` includes or style rules merely to satisfy the file-presence contract.
   - Use nested `Collection` fields for second-level repeatables when the installed Content Blocks version
     supports nested Collections; keep seed scripts recursive so child rows are created after their parent
     IRRE rows.
   - Give every `Collection` field an explicit `table:` key. Without it, Content Blocks derives the table from
     the `identifier` alone, so unrelated elements that pick the same name (`rows`, `posts`, `column_items`,
     `cells`, `items`, `links`...) silently share one physical table — schema migrations break,
     `foreign_table_parent_uid` drifts to the wrong type, and renames lose data. Names like
     `<contentblock-slug>_<identifier>` are safe, for example `blog_teasers_posts` or `feature_matrix_rows`.
     See `references/content-element-contract.md` "Collection Table Naming".
   - Use TYPO3 `Link` fields for editor-managed URLs. Keep visible link text in a separate text field and never encode `Label|https://...` pairs in textareas.
   - File fields need alt text and copyright/source strategy in seed data and previews.
   - Date and time fields must be formatted to strings before they are passed to visual-editor text rendering or HTML attributes.

6. **Add backend previews for the page/layout module.**
   - Read `references/backend-preview-pattern.md`.
   - Add `templates/backend-preview.fluid.html` using Content Blocks `Preview` layout with `Content` and optionally `Footer`.
   - Keep `<f:section name="Header"></f:section>` **empty** — never render a duplicate headline above the
     formatted card. The card itself shows the title inside `d-ce-preview__title`. Removing the section
     instead of emptying it triggers TYPO3's `InvalidSectionException` fallback to the standard renderer,
     which re-adds the duplicate.
   - Inside `d-ce-preview__meta`, surface the editor-facing element name, the Content Block identifier, the
     record `uid`, and the page `pid` as small pills. Use `<f:translate
     key="LLL:EXT:desiderio/Resources/Private/Language/labels.xlf:preview.uid"/>` and `:preview.page` — never
     hardcode the labels.
   - Show the most important data: title/headline, summary, bullets/repeatables, CTA/link, chart metrics, and thumbnails.
   - Never rely on TYPO3’s Core fallback preview for custom Content Blocks.

7. **Create or refresh icons.**
   - Read `references/icon-pattern.md`.
   - Each element gets a semantic `assets/icon.svg`.
   - Use TYPO3-style 16x16 SVGs: transparent background, root color `var(--icon-color-primary,currentColor)`,
     `currentColor` primary paint, `var(--icon-color-accent,currentColor)` accent, readable in light and dark.
   - For large catalogs, actively prevent look-alike icons: audit normalized SVG bodies with titles removed,
     inspect same-family groups such as heroes/pricing/nav/footers/features, and add per-element geometry
     instead of relying on one family template.
   - If the user asks for GPT Image / Image GPT / `gpt-image-*`, first verify the currently available OpenAI
     image model and API credentials. Use image generation for metaphor boards or visual direction; redraw the
     final asset as clean, editable SVG because TYPO3 backend icons need tiny, token-colored vectors.
   - Treat Lucide, Tabler, and TYPO3 backend icons as metaphor references, not as a reason to reuse the same glyph across many content elements.

8. **Update seed scripts.**
   - Fill all top-level and repeatable fields for every element.
   - Fill nested repeatables as structured arrays; never collapse a second-level list into a newline-separated textarea when an IRRE Collection is available.
   - Add real dummy images from Unsplash or committed demo assets, with alt text and copyright/source fields where available.
   - Seed links as structured data or distinct fields, for example `{"label": "Docs", "link":
     "https://example.com/docs"}` or `link_1_label` plus `link_1`. Do not generate pipe-delimited link
     strings.
   - Seed chart/data elements with valid JSON that the frontend template actually parses.
   - When the seeder auto-fills omitted optional fields, inspect the generated pages anyway. Empty fixtures
     are acceptable only when the fallback content is specific enough for visual QA and editor demos.
   - If a full-catalog audit reports many `fixture_missing_field` or `collection_child_seed_gap` rows but hard
     template/style checks are clean, improve the project seeder first. Fallback copy should read like real
     pattern-library content (`Pattern Library`, realistic product/demo copy, useful CTA labels, valid links,
     valid icon keys, token names such as `primary`) and must not expose generic placeholder phrases such as
     `Complete demo content`.
   - Prefer shadcn token `Select` fields over freeform `Color` fields for elements whose appearance should
     track theme changes. If an element needs editor color choice, render it through token-backed data
     attributes or CSS variables and keep raw color values out of fixtures and fallback seed data.
   - Validate seeded `Select` values against the current `config.yaml` items before insertion. Stale fixture
     values from removed style variants should fall back to the configured default instead of seeding inert
     editor choices.
   - Keep Desiderio fixtures in each `ContentBlocks/ContentElements/<element>/fixture.json` file. Do not
     create or restore monolithic `shadcn2fluid_*` fixture mappings.
   - If old fixture keys must be accepted for migration, convert them at seed time into current fields or
     nested Collections and keep those aliases out of new fixtures and examples.

9. **Verify and commit in reviewable slices.**
   - Run CSS build, PHP unit/static checks, and Content Blocks/TYPO3 cache validation.
   - Run `npx shadcn@latest info --json` and `npx shadcn@latest build --output <public-registry-dir>` when `components.json` or `registry.json` changed.
   - Scan content elements and shared generated preview code for raw color literals; allowed raw preset values
     should be confined to the shadcn theme token file and generated Tailwind output.
   - Scan templates for inline scripts when shared JavaScript was introduced: `rg -n "<script>|JSON\\.parse"
     ContentBlocks/ContentElements/*/templates/frontend.fluid.html`.
   - For a user-requested full pass, run the complete content-element audit loop repeatedly over all elements,
     not just changed files. Ten iterations are acceptable when the user explicitly asks to loop 10 times;
     report the stable summary and the element count.
   - For large overhauls, commit by layer: preset/theme, primitives, generated previews, icons, per-element fixes, seed data.
   - Browser-check frontend pages and TYPO3 backend layout module previews.

## Critical Rules — Collection Table Naming

**This is the single most damaging mistake when authoring Content Blocks. Read this before creating any `type: Collection` field.**

Every `type: Collection` field generates a separate physical database table. Without an explicit `table:` key,
Content Blocks falls back to using the bare `identifier` as the table name. That breaks production in three
escalating ways:

1. **Reserved-word collisions.** Identifiers like `rows`, `groups`, `order`, `range`, `system`, `values`,
   `user` are MySQL/MariaDB reserved words. Doctrine quotes at runtime so the table works inside TYPO3, but
   `mysqldump`, `mysqlcheck`, ad-hoc CLI queries, schema-diff tools, and IDE introspection all stumble on the
   unquoted name.
2. **Cross-element table sharing.** When two Content Blocks both pick a common identifier (`posts`,
   `column_items`, `rows`, `cells`, `items`, `links`, `features`, `tabs`, `members`, `slides`, `stats`,
   `tiers`, `partners`, `clients`, `reviews`, `routes`, `metrics`, `specs`, `jobs`, `awards`...), Content
   Blocks merges their schemas into one shared table. The shared table becomes the union of every consuming
   element's columns, schema migrations get confused, and renaming one block later requires a parent-aware
   data migration to split records back apart.
3. **`foreign_table_parent_uid` type drift.** Older Content Blocks versions created the parent reference
   column as `varchar(255) DEFAULT '' NOT NULL`. Newer TCA-driven schema migration wants `int unsigned DEFAULT
   0 NOT NULL`. The migration fails with `Truncated incorrect INTEGER value: ''` because existing rows hold
   empty-string values that strict-mode MySQL refuses to coerce. Recovery requires `UPDATE <table> SET
   foreign_table_parent_uid = 0 WHERE foreign_table_parent_uid = ''` before the ALTER. Adding `table:` from
   the start avoids the legacy column path entirely on fresh tables.

### Don't

- Do not declare a `type: Collection` field without `table:`.
- Do not use bare names like `rows`, `posts`, `column_items`, `cells`, `items`, `links`, `features`, `tabs`,
  `members`, `slides`, `stats`, `tiers`, `groups`, `users`, `range`, `order`, `system`, `values` as a `table:`
  value — they collide with other extensions or with reserved SQL keywords.
- Do not assume "it works in TYPO3" means it is safe — Doctrine's identifier quoting hides the problem until a dump, restore, or schema migration uncovers it.
- Do not rename a Collection's `table:` after editor data exists without a parent-aware data migration:
  dropping a shared table loses every block's content, and renaming without migration orphans the rows.

### Do

- Give every `type: Collection` field an explicit `table:` directive in the YAML.
- Use the pattern `<contentblock-slug-as-snake_case>_<collection-identifier>`, for example
  `blog_teasers_posts`, `feature_matrix_rows`, `footer_mega_column_items`, `pricing_plan_features`,
  `data_table_cells`.
- For nested Collections, fold the parent collection name into the child's table name (`pricing_plan_features`
  for a `features` Collection nested inside `plans`).
- When auditing or porting an existing extension, add `table:` to every Collection in the same pass — schema
  migrations regress as soon as one block falls through.
- Before declaring a Collection sweep complete, run the audit grep below.

### Audit

```bash
# Every Collection field that lacks an explicit table: directive (should print nothing).
rg -nP '^\s*type: Collection\s*$' --no-heading -A1 ContentBlocks/ContentElements \
  | rg -B1 -v 'table:'

# Bare table names that match MySQL/MariaDB reserved words.
rg -n '^\s+table:\s+(rows|groups|range|order|system|values|user|cross|dense_rank|window)\s*$' \
  ContentBlocks/ContentElements

# Bare unprefixed names — risky for cross-extension collision even if not reserved.
rg -nP '^\s+table:\s+[a-z][a-z0-9_]*\s*$' ContentBlocks/ContentElements \
  | rg -v '_[a-z]'   # everything kept after this filter has no underscore — review by hand.
```

The full reasoning, migration playbook for an already-shared table, and additional examples live in
`references/content-element-contract.md` "Collection Table Naming".

## Quality Bar

- Preset changes must visibly change design through committed tokens and shared component classes.
- Content elements should look like shadcn/ui, not generic Bootstrap or one-off CSS.
- Content elements must be light/dark capable because they consume semantic tokens rather than fixed color values.
- Backend previews should help editors recognize content without opening the form.
- Icons should form a coherent family, not random drawings, and every content element should remain distinguishable in the new content element wizard at 16px.
- Generated or bulk changes need deterministic scripts and tests where possible.
- Active content elements must not depend on `shadcn2fluid`; allowed mentions are limited to package
  conflicts, migration notes, and tests/docs that explicitly prevent the old package or fixture map from
  returning.
- Every `type: Collection` field has an explicit `table:` key with a `<contentblock-slug>_<identifier>` value.
  No bare names, no reserved SQL words. Audit grep in "Critical Rules — Collection Table Naming" should print
  nothing.

## References

- `references/shadcn-preset-workflow.md`: scratch-app preset workflow and token expectations.
- `references/styling-token-contract.md`: no-hardcoded-style rules, light/dark behavior, and verification scans.
- `references/content-element-contract.md`: field/template/label/seed audit contract.
- `references/backend-preview-pattern.md`: Content Blocks backend preview pattern.
- `references/icon-pattern.md`: TYPO3 backend icon rules.
- `../typo3-translations/SKILL.md`: XLIFF, localization, ICU MessageFormat, and `LLL:` label rules.

## Scripts

- `scripts/audit-content-elements.php <repo-root>`: JSON audit for Content Blocks directories.
