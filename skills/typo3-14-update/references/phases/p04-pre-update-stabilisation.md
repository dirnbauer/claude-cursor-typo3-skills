# P04 — Pre-update stabilisation (loops 010, 020, 030, 040)

Track `invariance`. These changes happen **after** the baseline is sealed, and each is measured
against it.

| Loop | Slug | Scope |
|---|---|---|
| 010 | `sitemap-and-routing` | per-language sitemaps, hreflang, canonicals, excluded doktypes, `EXT:seo` |
| 020 | `build-pipeline-vite` | plain Vite: hashed output plus a manifest, referenced from Fluid/TypoScript, no bridge extension |
| 030 | `bootstrap-5-latest` | latest 5.x, in small verified steps |
| 040 | `accessibility-automated-green` | axe-core to 0 serious/critical per language |

## Expectation per loop
- **010 and 020 must be pixel-identical.** They change routing metadata and asset delivery, not
  rendering. Any difference is a `regression`.
- **030 and 040 are declared-change loops.** Differences are expected, but each needs an approval per
  difference class with before/after evidence.

## Loop 030 — Bootstrap, in order
Dependency bump → removed or renamed utilities → component markup → custom SCSS overrides. Re-shoot
the affected pages after **each** step rather than making one large jump, and read the diffs instead
of skimming the pass/fail count. Inspect grid and container behaviour, spacing utilities, typography
scale, buttons, forms, navigation, modals and tables at every breakpoint.

Repairs available: map new utility classes onto the old behaviour, add SCSS compatibility rules, set
changed variables back to their previous values, adjust component markup, align grid and container
widths, correct form-control heights, override new default spacing, restore typography defaults.

The goal is not to preserve old Bootstrap internals. It is **new Bootstrap implementation, same
rendered result**.

## Loop 040 — Accessibility
Audit representative pages per language with `typo3-wcag22-aa-agentic`, fix with `typo3-accessibility`
patterns, re-audit until 0 serious/critical.

Most fixes are visually neutral. Where one is not — a new focus indicator, for example — it changes
one interaction *state*, which is why states are captured separately. Name the permitted visible
changes concretely, limit them to specific states, and get them approved. The default state of a page
is never changed wholesale because an accessibility audit happens to be running.

## Exit
Compared against `A-original`: 0 unclassified findings, every `declared-change` carrying an approval,
idempotence re-run clean.

## Blocking
Any difference without a cause. Any attempt to update `baseline/A-original/`. Newly reachable URLs go
to `A-supplemental/` and are excluded from the invariance claim.

