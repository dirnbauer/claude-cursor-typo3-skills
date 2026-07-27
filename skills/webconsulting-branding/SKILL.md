---
name: "webconsulting-branding"
description: "Applies the current webconsulting.at design system: borderless square surfaces, Hanken Grotesk typography, teal/ink color tokens, invoice-led information hierarchy, a header-only brand notice, logo-first project icons, MDX patterns, dark mode, accessibility, and shadcn/ui integration. Use when building or reviewing webconsulting.at pages, internal tools, tracker/GitLab themes, project catalogs, TYPO3 templates, brand assets, or visual consistency."
compatibility: "TYPO3 14.x"
metadata:
  version: "3.0.0"
  origin: "webconsulting"
license: "MIT / CC-BY-SA-4.0"
---

# webconsulting Design System

> Source: https://github.com/dirnbauer/webconsulting-skills

The current webconsulting language is flat, square, precise, and content-led. It
uses typography, spacing, surface color, and filled emphasis to create hierarchy.
Decorative borders and rounded cards are legacy styling.

## 1. Reference hierarchy

When references disagree, use this order:

1. The current invoice UI for dense information, forms, tables, and document hierarchy.
2. Current internal products such as the project tracker and the GitLab theme.
3. The current public `webconsulting.at` site for editorial layout, marketing pages, and large-scale composition.
4. This skill for reusable tokens and implementation rules.

Inspect the live surface when it is available. Do not reintroduce an older pattern
merely because it already exists in a component library.

## 2. Non-negotiable visual rules

- Use square corners: `border-radius: 0` and Tailwind `rounded-none`.
- Use no decorative borders around cards, panels, callouts, buttons, tables, or sections.
- Create separation with whitespace, background changes, type weight, zebra rows, and alignment.
- Use shadows only for temporary elevation such as menus, dialogs, and sticky overlays.
- Keep one brand notice or accent at the top of the header. Never repeat it above or inside the footer.
- Keep the footer open and quiet: no top border, accent stripe, duplicated system notice, or boxed columns.
- Use a filled teal or near-black control for the primary action. Do not outline the secondary action.
- Keep focus indicators. A keyboard focus outline is an accessibility affordance, not a decorative border.
- Use actual project identity assets. Prefer the project logo; use the project favicon when no logo is available.

### Legacy patterns to remove

Do not generate:

- `border`, `border-*`, `divide-*`, or card outlines for visual grouping
- `rounded`, `rounded-md`, `rounded-lg`, pill cards, or rounded table shells
- duplicate header and footer announcement bars
- a footer `border-top`, signature rule, or cyan/teal stripe
- generic Lucide pictograms when a project logo or favicon exists
- bordered secondary buttons or bordered callouts
- framed content inside framed content

Native document separators, chart axes, diagram edges, underlined text links, and
focus outlines are not decorative container borders. Use them only when they carry
meaning.

## 3. Brand identity and voice

**Persona:** innovative, technical, professional; a senior solutions architect.

**Tone:** clear, concise, specific, and authoritative. Avoid marketing fluff.

**Language:** German for public and business-facing content; English for technical
documentation unless the project specifies otherwise.

## 4. Visual tokens

### Core palette

| Token | Light | Dark | Use |
|---|---:|---:|---|
| `--webcon-primary` | `#1b7a95` | `#66c4e1` | Primary actions, links, active states |
| `--webcon-primary-dark` | `#155d73` | `#9dd8eb` | Hover states, strong teal text |
| `--webcon-primary-strong` | `#0f4555` | `#c5e8f2` | Deep brand surfaces |
| `--webcon-accent` | `#66c4e1` | `#66c4e1` | Header signature, non-text accents |
| `--webcon-primary-pale` | `#e8f4f8` | `#0f3d4a` | Selected and informational surfaces |
| `--webcon-canvas` | `#f5f8f9` | `#071f26` | App background |
| `--webcon-surface` | `#ffffff` | `#0f252c` | Main reading surface |
| `--webcon-surface-muted` | `#eef2f3` | `#16343d` | Navigation and metadata bands |
| `--webcon-ink` | `#171a1d` | `#f8fafb` | Primary text |
| `--webcon-muted` | `#5e6870` | `#b8c5ca` | Secondary text |

Light cyan is an accent, not body text on white. Verify contrast before using any
brand color for text.

### Semantic states

| State | Foreground | Light surface | Dark surface |
|---|---:|---:|---:|
| Success | `#166534` | `#dcfce7` | `#14532d` |
| Error | `#b42318` | `#fee2e2` | `#450a0a` |
| Warning | `#9a4a00` | `#fef3c7` | `#451a03` |
| Info | `#155d73` | `#e8f4f8` | `#0f3d4a` |

Express state with a filled surface, icon, label, and text. Do not use a colored
border as the only signal.

### CSS foundation

```css
:root {
  --webcon-primary: #1b7a95;
  --webcon-primary-dark: #155d73;
  --webcon-primary-strong: #0f4555;
  --webcon-accent: #66c4e1;
  --webcon-primary-pale: #e8f4f8;
  --webcon-canvas: #f5f8f9;
  --webcon-surface: #ffffff;
  --webcon-surface-muted: #eef2f3;
  --webcon-ink: #171a1d;
  --webcon-muted: #5e6870;
  --radius: 0;
}

*, *::before, *::after {
  border-radius: 0;
}
```

Do not apply a global `border: 0`; that can erase meaningful controls, focus
indicators, chart axes, and third-party widgets. Remove decorative borders at the
component level.

## 5. Typography

Use Hanken Grotesk throughout the product and public site.

| Role | Weight | Guidance |
|---|---:|---|
| Body | 400 | 16px base, 1.5-1.65 line height |
| Display and page headings | 500-650 | Tight tracking, compact line height |
| UI labels and secondary headings | 600-650 | Short and scannable |
| Primary actions and table headers | 650-700 | Reserve for emphasis |
| Code and identifiers | 400-700 | JetBrains Mono or system monospace |

```typescript
import { Hanken_Grotesk } from 'next/font/google'

export const hankenGrotesk = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--font-hanken-grotesk',
  display: 'swap',
})
```

```css
--font-sans: var(--font-hanken-grotesk), ui-sans-serif, system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, monospace;
```

For public-page hero headings, use approximately `clamp(2.5rem, 5vw, 4.75rem)`,
weight 500, and slight negative tracking. Internal tools should remain denser.

## 6. Layout and spacing

Use a 4px base grid.

| Token | Value | Use |
|---|---:|---|
| `space-1` | 4px | Tight icon/text alignment |
| `space-2` | 8px | Inline groups |
| `space-3` | 12px | Compact controls |
| `space-4` | 16px | Component padding |
| `space-6` | 24px | Related blocks |
| `space-8` | 32px | Page groups |
| `space-12` | 48px | Compact sections |
| `space-16` | 64px | Standard public sections |
| `space-24` | 96px | Large section rhythm |
| `space-32` | 128px | Editorial/hero separation |

- Public pages: generous whitespace, full-width black/white or pale surface changes,
  and a readable content measure.
- Internal tools: a pale canvas with one open white work surface and restrained density.
- Avoid grids of identical bordered cards. Use open columns, bands, and typographic groups.
- Keep alignment exact. The square system looks poor when baselines and edges drift.

## 7. Header and footer

The system may use one header announcement or one thin accent rule. It must occur
once, at the top of the experience.

```jsx
<header className="bg-white text-webcon-ink">
  <div aria-hidden="true" className="h-1 w-full bg-webcon-accent" />
  <nav className="mx-auto flex max-w-7xl items-center px-6 py-5">
    {/* logo, navigation, utilities */}
  </nav>
</header>

<main>{/* page */}</main>

<footer className="bg-webcon-ink px-6 py-16 text-white">
  {/* no top border, no accent rule, no repeated announcement */}
</footer>
```

For systems such as GitLab that expose both a header and footer notice, configure
the header notice only and leave the footer notice empty. Do not duplicate security
or platform copy at both edges of every page.

## 8. Component patterns

### Buttons

```html
<button class="bg-webcon-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-webcon-primary-dark focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-webcon-primary-dark">
  Primary action
</button>

<button class="bg-neutral-100 px-6 py-3 font-semibold text-webcon-ink transition-colors hover:bg-webcon-primary-pale focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-webcon-primary-dark">
  Secondary action
</button>

<button class="bg-transparent px-4 py-2 font-semibold text-webcon-muted hover:bg-neutral-100 hover:text-webcon-primary-dark focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-webcon-primary-dark">
  Ghost action
</button>
```

All buttons are `border-0 rounded-none shadow-none`. A subtle shadow is acceptable
for the single primary action when it needs elevation from a busy background.

### Forms

- Put form controls on a contrasting filled surface instead of drawing a box around them.
- Use `bg-neutral-100 border-0 rounded-none` for light inputs.
- Use persistent labels; placeholders do not replace labels.
- Use a 3px focus outline with at least 3:1 contrast.
- Group related fields with spacing and a heading, not a surrounding fieldset border.
- Keep native checkbox/radio affordances or use `accent-color: #1b7a95`.

### Tables and lists

- Use a filled teal table header with white text for ledger-like tables.
- Use white and `#f8fafb` zebra rows; use pale teal for hover and selection.
- Do not use an outer table border, cell grid, or rounded table shell.
- Align numbers to the right and identifiers in monospace.
- Keep row actions compact and visually quiet until hover or focus.
- For mobile, choose horizontal scrolling, a priority-column view, or a semantic list.

### Cards and panels

- Prefer no card. Let content sit on the page or a full-width surface band.
- When grouping is necessary, use `bg-white` or `bg-webcon-primary-pale` with padding.
- Do not add a border or radius to compensate for weak hierarchy.
- Use no shadow for static content.

### Tabs and navigation

- Use typography, filled selection, or a short active indicator.
- Do not draw a full rectangle around every tab.
- Keep the header accent distinct from tab selection; do not create another page-wide line.

### Callouts, code, and overlays

- Callouts: tinted square surface, clear icon, title, and text; no border.
- Code: near-black square surface, syntax color, filename label; no decorative frame.
- Menus/dialogs: square surfaces with a restrained shadow; no persistent card border.

## 9. Project identity and icons

Project icons must represent the project, not the category chosen by the interface.

Use this source order:

1. Official project logo from the project repository, brand kit, or deployed site.
2. Product/app icon supplied by the project.
3. Highest-quality favicon declared by the deployed site (`SVG`, web manifest, Apple touch icon, then PNG/ICO).
4. A neutral webconsulting fallback only when no logo or favicon can be found.

Rules:

- Do not replace an available logo with a generic Lucide, emoji, letter, or category pictogram.
- Do not redraw, recolor, crop, or add a teal tile behind a third-party logo unless its brand guidance permits it.
- Prefer SVG. Otherwise use the largest clean raster source and keep its aspect ratio.
- Normalize project avatars to a square canvas with `object-fit: contain` and 12-16% safe space.
- Use a transparent or quiet neutral canvas; no border and no rounded mask.
- Keep the logo optically centered. Do not force wordmarks to fill the square.
- Record the source URL or repository path so the asset can be refreshed later.
- If the icon is immediately followed by the visible project name, use empty alt text;
  otherwise use the project name as the accessible label.

Favicon resolution must use the page metadata or web manifest when possible. Do not
default to a third-party favicon proxy when the project site can supply its own asset.

## 10. MDX components

Use the project MDX components instead of raw HTML when a component exists.

```jsx
<Tabs defaultValue="v14">
  <TabsList>
    <TabsTrigger value="v14">TYPO3 v14</TabsTrigger>
  </TabsList>
  <TabsContent value="v14">Content for TYPO3 v14...</TabsContent>
</Tabs>
```

```jsx
<ComparisonTable
  headers={['Feature', 'TYPO3 v14']}
  rows={[
    { label: 'Content Blocks 2.x', values: [true] },
    { label: 'Symfony 7.4', values: [true] },
  ]}
/>
```

```jsx
<Callout type="info" title="Best Practice">
  Use a filled semantic surface without a border.
</Callout>
```

```jsx
<MDXImage
  src="/images/architecture-diagram.png"
  alt="TYPO3 extension architecture"
  caption="Figure 1: Domain-driven TYPO3 architecture"
/>
```

Implement these components with square, borderless surfaces even if an upstream
component ships with a border or radius.

## 11. Mermaid diagrams

Keep semantic graph edges, but remove decorative node and cluster strokes.

```markdown
%%{init: {'theme': 'base', 'themeVariables': {
  'primaryColor': '#1b7a95',
  'primaryTextColor': '#ffffff',
  'primaryBorderColor': '#1b7a95',
  'lineColor': '#5e6870',
  'secondaryColor': '#e8f4f8',
  'tertiaryColor': '#f5f8f9',
  'clusterBorder': '#f5f8f9',
  'edgeLabelBackground': '#ffffff'
}}}%%
graph TD
    A[Client request] --> B[TYPO3]
    B --> C[Response]
```

Apply `rx: 0`, `ry: 0`, and `stroke-width: 0` to rectangular nodes and clusters.
Do not remove arrows and relationship lines; they carry information.

## 12. Accessibility (WCAG 2.2 AA)

- Normal text: at least 4.5:1 contrast.
- Large text and essential UI graphics: at least 3:1.
- Use `:focus-visible` with a 3px high-contrast outline and 2px offset.
- Keep a logical DOM and tab order; never use positive `tabindex`.
- Provide skip links for content, navigation, and footer where appropriate.
- Give every informative image meaningful alt text; use `alt=""` for decorative images.
- Do not communicate state through color alone.
- Keep touch targets at least 24×24 CSS px; prefer 44×44 for primary controls.
- Ensure reflow at 320 CSS px without two-dimensional page scrolling.

## 13. Responsive behavior

| Breakpoint | Width | Tailwind |
|---|---:|---|
| Mobile | `< 640px` | default |
| Tablet | `>= 640px` | `sm:` |
| Desktop | `>= 1024px` | `lg:` |
| Wide | `>= 1280px` | `xl:` |

Reduce columns before reducing readable type. Preserve surface hierarchy and avoid
turning each mobile item into a rounded bordered card.

## 14. Dark mode

Dark mode keeps the same square, borderless hierarchy. Use near-black/navy canvases,
slightly lighter work surfaces, light cyan for interactive emphasis, and light text.
Do not reveal structure by adding borders that do not exist in light mode.

## 15. shadcn/ui integration

Map semantic tokens, then remove the default card treatment:

```css
:root {
  --radius: 0rem;
  --background: 195 20% 97%;
  --foreground: 210 11% 10%;
  --primary: 193 69% 35%;
  --primary-foreground: 0 0% 100%;
  --muted: 195 17% 94%;
  --accent: 195 61% 94%;
  --ring: 193 69% 27%;
}
```

- Add `rounded-none border-0 shadow-none` to cards, buttons, fields, tabs, and callouts.
- Rebuild field boundaries with filled surfaces and focus outlines.
- Retain Radix semantics, keyboard behavior, and focus management.
- Do not globally hide focus rings or native disabled states.

## 16. Review checklist

Before shipping, verify:

- All radii are zero except inherently circular data or icon geometry.
- Static containers use no decorative borders.
- Header notice/accent appears once; footer notice/accent is absent.
- Footer has no top rule and does not duplicate header copy.
- Primary action is visually obvious without an outline button.
- Hierarchy remains clear through surfaces, spacing, and type alone.
- Project icons use real logos or favicon fallbacks with recorded sources.
- Focus remains visible after border removal.
- Light/dark contrast and 320px reflow pass.

Source: https://github.com/dirnbauer/webconsulting-skills
