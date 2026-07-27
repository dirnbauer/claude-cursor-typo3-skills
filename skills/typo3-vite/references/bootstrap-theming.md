# Bootstrap Theming Guide

Standard approach for customizing Bootstrap 5.3+ in sitepackage projects.

## Theming Flow

```
Theme/_colors.scss          -> Project CI colors
Basic/_variables.scss       -> Bootstrap variable overrides
_global-basics.scss         -> Loads Bootstrap foundations with overrides
Vendor/_bootstrap.scss      -> Selective component imports
Theme/_theme-main.scss      -> Post-Bootstrap overrides
```

The order matters: variables must be defined before Bootstrap processes them.

## Selective Bootstrap Imports

`Vendor/_bootstrap.scss` never imports Bootstrap as a whole -- only the
components actually used in the project. See
[`references/scss-architecture.md`](scss-architecture.md) (Bootstrap
Integration) for the concrete `bootstrap/scss/*` import list and naming
conventions.

Bootstrap's own variable reference documents every override point
(`$primary`, `$font-size-base`, `$spacer`, `$grid-breakpoints`,
`$btn-padding-y`, and so on); this project's convention is only to route
project CI colors through `Theme/_colors.scss` before mapping them onto
Bootstrap's variable slots in `Basic/_variables.scss`, per the flow above.

## Theme Checklist

When setting up a new project theme:

- [ ] CI colors defined in `Theme/_colors.scss`
- [ ] Colors mapped to Bootstrap variables in `Basic/_variables.scss`
- [ ] Only needed Bootstrap components imported in `Vendor/_bootstrap.scss`
