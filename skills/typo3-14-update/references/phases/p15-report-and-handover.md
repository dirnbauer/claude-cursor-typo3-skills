# P15 — Report and handover (loop 900)

Track `report`.

## Preconditions
P13 closed. All approved Contract B tracks green or explicitly stopped.

## Steps
1. Rewrite `README.md` as a concise entry point: purpose, features, TYPO3/PHP requirements,
   installation, quick start, configuration, workspace behaviour, testing, limitations, links.
2. Update `Documentation/` per TYPO3 conventions with a v12/v13-to-v14 upgrade guide, migration
   commands, data upgrade steps, breaking changes and removed features.
3. Add a `CHANGELOG.md` entry: the 14.3-only requirement, dropped versions, dependency changes,
   workspace support, migrations. **Do not invent a release date or tag.**
4. Write `report/contract-b-summary.md`.
5. Generate the KPI document per `references/kpi-report.md`.
6. Write `report/handover-deployment.md`.

## The handover is information only
This skill executes none of it. It lists: the Composer, schema, wizard, reference-index, language and
cache commands to repeat per environment; required PHP and database versions; configuration that
changes outside DDEV (base URLs, mail transport, proxies, headers, CSP); reindexing needs such as
Solr; and every gap DDEV could not close — HSTS meaningfulness, production proxy headers, third-party
embeds absent locally.

## Reports are assembled, not written
Every figure comes from `state.json` and the loop reports. A number in the KPI document that appears
nowhere in the evidence is a fabrication, however plausible it looks.

Recommendations are proposals for the user, not changes this skill made. Keep observations,
assumptions and recommendations visually separate.

## Exit
`gate-check --group ALL` exits 0.

