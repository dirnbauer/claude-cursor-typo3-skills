# Redmine KI workflow

Use an **issue custom field**, not a Redmine delivery status, for AI orchestration. Delivery status (`Neu`, `Zugewiesen`, `Test`, `Gelöst`, and so on) describes the product workflow. The custom field describes whether an agent should prepare or implement the issue. Keeping these axes separate avoids breaking tracker workflows and makes the queue filterable across projects and trackers.

## Field definition

- Name: `KI-Workflow`
- Type: single-value list
- Required: no
- Used as a filter: yes
- Searchable: yes
- Visible: all users
- Trackers: all trackers that may be prepared
- Available for all projects: yes
- Initial automated queue scope: `Ideas` and `CapexOne`

Possible values, in order:

1. `Vorbereitung angefordert`
2. `Vorbereitung läuft`
3. `Rückfrage erforderlich`
4. `Bereit zur KI-Umsetzung`
5. `KI-Umsetzung läuft`
6. `Menschliches Review`
7. `Vorbereitung fehlgeschlagen`
8. `Nicht automatisieren`

Leave the field empty for ordinary tickets that are outside the AI workflow. The
field is globally available so other projects can opt in without an
administrator changing the custom-field definition; Hermes still limits its
default scheduled queue to `Ideas` and `CapexOne`.

## State transitions

| From | To | Who/what | Meaning |
|---|---|---|---|
| empty | Vorbereitung angefordert | human or explicit bulk operation | enqueue for preparation |
| Vorbereitung angefordert | Vorbereitung läuft | preparation worker | claim before research |
| Vorbereitung läuft | Rückfrage erforderlich | preparation worker | one material HITL decision remains |
| Rückfrage erforderlich | Vorbereitung angefordert | human | answer was added; requeue |
| Vorbereitung läuft | Bereit zur KI-Umsetzung | preparation worker | readiness gate passed |
| Vorbereitung läuft | Vorbereitung fehlgeschlagen | preparation worker | non-transient failure with diagnostic note |
| Vorbereitung fehlgeschlagen | Vorbereitung angefordert | human | failure corrected; retry requested |
| Bereit zur KI-Umsetzung | KI-Umsetzung läuft | implementation worker | implementation claimed |
| KI-Umsetzung läuft | Menschliches Review | implementation worker | code, tests, and review complete |
| any non-final state | Nicht automatisieren | human | automation explicitly disabled |

Do not make automatic transitions out of `Nicht automatisieren` or `Menschliches Review`.

## Queue ordering and concurrency

- Default to open issues only.
- Process `Vorbereitung angefordert` issues oldest first (`id:asc`) unless a user names an issue.
- Process at most one root issue per scheduled run.
- Claim before expensive work.
- Re-read after claiming. If the state is not `Vorbereitung läuft`, stop; another worker won.
- Keep writes idempotent. Re-running a completed ticket must not duplicate children, relations, or comments.

## Scheduled failure handling

- Empty queue: return exactly `[SILENT]`.
- Missing credentials or custom-field configuration: make no issue changes and report one concise configuration error.
- Transient network/provider failure before a useful comment exists: set `Vorbereitung fehlgeschlagen` with a short diagnostic that contains no secrets.
- Missing human decision: use `Rückfrage erforderlich`, not `Vorbereitung fehlgeschlagen`.
- Validation failure: leave `Vorbereitung läuft` only while actively repairing; otherwise set `Vorbereitung fehlgeschlagen` and name the failed readiness checks.

## Manual phrases

- `Hermes, prepare the next Redmine ticket for AI.`
- `Hermes, prepare Redmine #<id> for AI implementation.`
- `Hermes, continue the Wayfinder map in Redmine #<id>.`
- `Hermes, requeue Redmine #<id>; I answered the question.`

## API operations

Use the Redmine REST API with `X-Redmine-API-Key`. The bundled script never prints the key.

```bash
# Verify endpoint, field, allowed values, and projects
python3 scripts/redmine_ai_queue.py config-check

# List the default Ideas/CapexOne queue
python3 scripts/redmine_ai_queue.py list

# Read full issue context
python3 scripts/redmine_ai_queue.py show 10534

# Claim and later publish a validated contract
python3 scripts/redmine_ai_queue.py claim 10534
python3 scripts/redmine_ai_queue.py apply 10534 --description-file /tmp/10534.txt

# Stop for one human decision
python3 scripts/redmine_ai_queue.py needs-input 10534 --comment-file /tmp/10534-question.txt
```

Official Redmine references:

- [REST issues](https://www.redmine.org/projects/redmine/wiki/rest_issues)
- [REST issue relations](https://www.redmine.org/projects/redmine/wiki/Rest_IssueRelations)
- [REST custom fields](https://www.redmine.org/projects/redmine/wiki/Rest_CustomFields)
- [Custom field configuration](https://www.redmine.org/projects/redmine/wiki/RedmineCustomFields)
