# P10 — Feature parity (loops 200–230)

Track `invariance`. Solr, Visual Editor, CKEditor RTE, security headers.

Full procedures in `references/feature-upgrades.md`.

Each is a declared-change loop: re-shoot the affected sample pages after the block, and any rendering
change needs an approval per difference class or it is a `regression`.

| Loop | Scope | Exit |
|---|---|---|
| 200 | Solr | matrix-supported server, full reindex, Info module active, frontend search verified including empty and paginated results |
| 210 | Visual Editor | inline editing verified, frontend rendering unchanged |
| 220 | CKEditor RTE | preset loads with language and abbreviation controls; `abbr[title]` and `span[lang]` styled in `contentsCss` and the frontend, language spans left undecorated |
| 230 | Security headers | verified on DDEV responses at a single layer, no duplicates, 0 CSP violations during a sample walk |

## Blocking
Loosening global `minimum-stability` to install a single package — use a per-package stability flag.
A rendering change absorbed without an approval.

