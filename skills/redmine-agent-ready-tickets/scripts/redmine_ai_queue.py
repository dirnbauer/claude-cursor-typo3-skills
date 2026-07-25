#!/usr/bin/env python3
"""Read and update the Redmine KI preparation queue using the REST API.

The script uses only Python's standard library. It never prints credentials and
does not provide delete operations. Bulk queue changes are dry-run unless the
caller passes --execute explicitly.
"""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import sys
from typing import Any, Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


FIELD_NAME = "KI-Workflow"
STATE_QUEUED = "Vorbereitung angefordert"
STATE_PREPARING = "Vorbereitung läuft"
STATE_NEEDS_INPUT = "Rückfrage erforderlich"
STATE_READY = "Bereit zur KI-Umsetzung"
STATE_FAILED = "Vorbereitung fehlgeschlagen"
STATE_DO_NOT_AUTOMATE = "Nicht automatisieren"

EXPECTED_STATES = (
    STATE_QUEUED,
    STATE_PREPARING,
    STATE_NEEDS_INPUT,
    STATE_READY,
    "KI-Umsetzung läuft",
    "Menschliches Review",
    STATE_FAILED,
    STATE_DO_NOT_AUTOMATE,
)

DISCLAIMER = (
    "_Diese Vorbereitung wurde von KI erstellt und muss vor der Umsetzung "
    "menschlich geprüft werden._"
)


class RedmineError(RuntimeError):
    """A safe, credential-free Redmine error."""


class RedmineClient:
    def __init__(self) -> None:
        self.base_url = required_env("REDMINE_URL").rstrip("/")
        self.api_key = required_env("REDMINE_API_KEY")
        raw_field_id = required_env("REDMINE_AI_WORKFLOW_FIELD_ID")
        try:
            self.field_id = int(raw_field_id)
        except ValueError as exc:
            raise RedmineError(
                "REDMINE_AI_WORKFLOW_FIELD_ID must be a numeric custom-field ID"
            ) from exc

    def request(
        self,
        method: str,
        path: str,
        *,
        params: dict[str, Any] | None = None,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        query = ""
        if params:
            normalized = {
                key: value
                for key, value in params.items()
                if value is not None and value != ""
            }
            query = "?" + urlencode(normalized, doseq=True)

        data = None
        headers = {
            "Accept": "application/json",
            "X-Redmine-API-Key": self.api_key,
            "User-Agent": "webconsulting-redmine-ai-preparation/2.0",
        }
        if payload is not None:
            data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
            headers["Content-Type"] = "application/json"

        request = Request(
            f"{self.base_url}{path}{query}",
            data=data,
            headers=headers,
            method=method,
        )
        try:
            with urlopen(request, timeout=45) as response:
                body = response.read()
        except HTTPError as exc:
            detail = exc.read(2048).decode("utf-8", errors="replace")
            raise RedmineError(
                f"Redmine returned HTTP {exc.code} for {method} {path}: "
                f"{safe_error_detail(detail)}"
            ) from exc
        except URLError as exc:
            raise RedmineError(
                f"Redmine request failed for {method} {path}: {exc.reason}"
            ) from exc

        if not body:
            return {}
        try:
            decoded = json.loads(body)
        except json.JSONDecodeError as exc:
            raise RedmineError(
                f"Redmine returned non-JSON data for {method} {path}"
            ) from exc
        if not isinstance(decoded, dict):
            raise RedmineError(f"Unexpected Redmine response for {method} {path}")
        return decoded

    def issue(self, issue_id: int) -> dict[str, Any]:
        data = self.request(
            "GET",
            f"/issues/{issue_id}.json",
            params={
                "include": "journals,relations,children,attachments,watchers,allowed_statuses"
            },
        )
        issue = data.get("issue")
        if not isinstance(issue, dict):
            raise RedmineError(f"Issue {issue_id} was not returned by Redmine")
        return issue

    def project(self, identifier_or_id: str) -> dict[str, Any]:
        data = self.request("GET", f"/projects/{identifier_or_id}.json")
        project = data.get("project")
        if not isinstance(project, dict):
            raise RedmineError(f"Project {identifier_or_id!r} was not returned")
        return project

    def list_issues(self, params: dict[str, Any]) -> list[dict[str, Any]]:
        limit = 100
        offset = 0
        result: list[dict[str, Any]] = []
        while True:
            page_params = dict(params)
            page_params.update({"limit": limit, "offset": offset})
            data = self.request("GET", "/issues.json", params=page_params)
            issues = data.get("issues", [])
            if not isinstance(issues, list):
                raise RedmineError("Unexpected issue-list response")
            result.extend(item for item in issues if isinstance(item, dict))
            total = int(data.get("total_count", len(result)))
            offset += len(issues)
            if not issues or offset >= total:
                break
        return result

    def update_issue(self, issue_id: int, attributes: dict[str, Any]) -> None:
        self.request(
            "PUT", f"/issues/{issue_id}.json", payload={"issue": attributes}
        )

    def set_state(self, issue_id: int, state: str, *, notes: str = "") -> None:
        attributes: dict[str, Any] = {
            "custom_fields": [{"id": self.field_id, "value": state}]
        }
        if notes:
            attributes["notes"] = notes
        self.update_issue(issue_id, attributes)

    def create_child(
        self,
        parent: dict[str, Any],
        *,
        subject: str,
        description: str,
        tracker_id: int | None,
        state: str,
    ) -> dict[str, Any]:
        project = parent.get("project") or {}
        parent_tracker = parent.get("tracker") or {}
        issue: dict[str, Any] = {
            "project_id": project.get("id"),
            "tracker_id": tracker_id or parent_tracker.get("id"),
            "parent_issue_id": parent.get("id"),
            "subject": subject,
            "description": description,
            "custom_fields": [{"id": self.field_id, "value": state}],
        }
        priority = parent.get("priority") or {}
        if priority.get("id"):
            issue["priority_id"] = priority["id"]
        data = self.request("POST", "/issues.json", payload={"issue": issue})
        created = data.get("issue")
        if not isinstance(created, dict) or not created.get("id"):
            raise RedmineError("Redmine did not return the created child issue")
        return created


def required_env(name: str) -> str:
    value = os.environ.get(name, "").strip()
    if not value:
        raise RedmineError(f"Missing required environment variable: {name}")
    return value


def safe_error_detail(detail: str) -> str:
    compact = " ".join(detail.split())
    return compact[:600] if compact else "no response detail"


def custom_state(issue: dict[str, Any], field_id: int) -> str:
    for field in issue.get("custom_fields", []):
        if isinstance(field, dict) and int(field.get("id", -1)) == field_id:
            value = field.get("value", "")
            return str(value).strip()
    return ""


def default_projects() -> list[str]:
    raw = os.environ.get("REDMINE_AI_PROJECTS", "ideas,capexone")
    return [item.strip() for item in raw.split(",") if item.strip()]


def issue_summary(issue: dict[str, Any], client: RedmineClient) -> dict[str, Any]:
    return {
        "id": issue.get("id"),
        "url": f"{client.base_url}/issues/{issue.get('id')}",
        "project": (issue.get("project") or {}).get("name"),
        "subject": issue.get("subject"),
        "tracker": (issue.get("tracker") or {}).get("name"),
        "status": (issue.get("status") or {}).get("name"),
        "ki_workflow": custom_state(issue, client.field_id),
        "created_on": issue.get("created_on"),
        "updated_on": issue.get("updated_on"),
    }


def print_json(value: Any) -> None:
    print(json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True))


def read_file(path: Path) -> str:
    if not path.is_file():
        raise RedmineError(f"File not found: {path}")
    return path.read_text(encoding="utf-8").strip()


def with_disclaimer(text: str) -> str:
    stripped = text.strip()
    if stripped.startswith(DISCLAIMER):
        return stripped
    return f"{DISCLAIMER}\n\n{stripped}"


def queue_issues(
    client: RedmineClient, projects: Iterable[str], *, state: str = STATE_QUEUED
) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for project_ref in projects:
        project = client.project(project_ref)
        result.extend(
            client.list_issues(
                {
                    "project_id": project["id"],
                    "subproject_id": "!*",
                    "status_id": "open",
                    f"cf_{client.field_id}": state,
                    "sort": "id:asc",
                    "include": "relations",
                }
            )
        )
    deduplicated = {int(issue["id"]): issue for issue in result if issue.get("id")}
    return [deduplicated[key] for key in sorted(deduplicated)]


def command_config_check(client: RedmineClient, args: argparse.Namespace) -> None:
    data = client.request("GET", "/custom_fields.json")
    fields = data.get("custom_fields", [])
    selected = next(
        (
            field
            for field in fields
            if isinstance(field, dict) and int(field.get("id", -1)) == client.field_id
        ),
        None,
    )
    if not selected:
        raise RedmineError(f"Custom field {client.field_id} does not exist")
    values = [
        str(item.get("value", "")) if isinstance(item, dict) else str(item)
        for item in selected.get("possible_values", [])
    ]
    missing_states = [state for state in EXPECTED_STATES if state not in values]
    projects = []
    for project_ref in args.project or default_projects():
        project = client.project(project_ref)
        projects.append({"id": project.get("id"), "identifier": project.get("identifier")})
    result = {
        "redmine_url": client.base_url,
        "field": {
            "id": selected.get("id"),
            "name": selected.get("name"),
            "format": selected.get("field_format"),
            "is_filter": selected.get("is_filter"),
            "missing_states": missing_states,
        },
        "projects": projects,
        "ok": (
            selected.get("name") == FIELD_NAME
            and selected.get("field_format") == "list"
            and bool(selected.get("is_filter"))
            and not missing_states
        ),
    }
    print_json(result)
    if not result["ok"]:
        raise RedmineError("KI-Workflow custom-field configuration is incomplete")


def command_list(client: RedmineClient, args: argparse.Namespace) -> None:
    issues = queue_issues(client, args.project or default_projects(), state=args.state)
    print_json([issue_summary(issue, client) for issue in issues])


def command_show(client: RedmineClient, args: argparse.Namespace) -> None:
    print_json(client.issue(args.issue_id))


def command_claim(client: RedmineClient, args: argparse.Namespace) -> None:
    before = client.issue(args.issue_id)
    current = custom_state(before, client.field_id)
    if current != STATE_QUEUED:
        raise RedmineError(
            f"Issue {args.issue_id} is not claimable: KI-Workflow is {current!r}"
        )
    client.set_state(
        args.issue_id,
        STATE_PREPARING,
        notes=with_disclaimer("KI-Vorbereitung wurde gestartet."),
    )
    after = client.issue(args.issue_id)
    if custom_state(after, client.field_id) != STATE_PREPARING:
        raise RedmineError(f"Issue {args.issue_id} could not be claimed")
    print_json(issue_summary(after, client))


def command_apply(client: RedmineClient, args: argparse.Namespace) -> None:
    description = with_disclaimer(read_file(args.description_file))
    attributes: dict[str, Any] = {
        "description": description,
        "custom_fields": [{"id": client.field_id, "value": STATE_READY}],
        "notes": with_disclaimer(
            args.note
            or "Vorbereitung abgeschlossen; Ticketvertrag und Prüfschritte wurden aktualisiert."
        ),
    }
    if args.subject:
        attributes["subject"] = args.subject
    client.update_issue(args.issue_id, attributes)
    after = client.issue(args.issue_id)
    if custom_state(after, client.field_id) != STATE_READY:
        raise RedmineError(f"Issue {args.issue_id} was not marked ready")
    if after.get("description", "").strip() != description:
        raise RedmineError(f"Issue {args.issue_id} description verification failed")
    print_json(issue_summary(after, client))


def command_needs_input(client: RedmineClient, args: argparse.Namespace) -> None:
    comment = with_disclaimer(read_file(args.comment_file))
    client.set_state(args.issue_id, STATE_NEEDS_INPUT, notes=comment)
    after = client.issue(args.issue_id)
    if custom_state(after, client.field_id) != STATE_NEEDS_INPUT:
        raise RedmineError(f"Issue {args.issue_id} was not marked as needing input")
    print_json(issue_summary(after, client))


def command_fail(client: RedmineClient, args: argparse.Namespace) -> None:
    comment = with_disclaimer(read_file(args.comment_file))
    client.set_state(args.issue_id, STATE_FAILED, notes=comment)
    after = client.issue(args.issue_id)
    print_json(issue_summary(after, client))


def command_transition(client: RedmineClient, args: argparse.Namespace) -> None:
    if args.state not in EXPECTED_STATES:
        raise RedmineError(f"Unsupported KI-Workflow value: {args.state}")
    note = with_disclaimer(args.note) if args.note else ""
    client.set_state(args.issue_id, args.state, notes=note)
    after = client.issue(args.issue_id)
    if custom_state(after, client.field_id) != args.state:
        raise RedmineError(f"Issue {args.issue_id} state verification failed")
    print_json(issue_summary(after, client))


def command_create_child(client: RedmineClient, args: argparse.Namespace) -> None:
    parent = client.issue(args.parent_id)
    created = client.create_child(
        parent,
        subject=args.subject,
        description=with_disclaimer(read_file(args.description_file)),
        tracker_id=args.tracker_id,
        state=args.state,
    )
    fresh = client.issue(int(created["id"]))
    print_json(issue_summary(fresh, client))


def command_relate(client: RedmineClient, args: argparse.Namespace) -> None:
    client.request(
        "POST",
        f"/issues/{args.issue_id}/relations.json",
        payload={
            "relation": {
                "issue_to_id": args.to_id,
                "relation_type": args.type,
            }
        },
    )
    fresh = client.issue(args.issue_id)
    relation_exists = any(
        isinstance(item, dict)
        and int(item.get("issue_to_id", -1)) == args.to_id
        and item.get("relation_type") == args.type
        for item in fresh.get("relations", [])
    )
    if not relation_exists:
        raise RedmineError("Relation verification failed")
    print_json(
        {
            "issue_id": args.issue_id,
            "issue_to_id": args.to_id,
            "relation_type": args.type,
        }
    )


def command_bulk_queue(client: RedmineClient, args: argparse.Namespace) -> None:
    issue_ids: list[int] = []
    for project_ref in args.project:
        project = client.project(project_ref)
        issues = client.list_issues(
            {
                "project_id": project["id"],
                "subproject_id": "!*",
                "status_id": "open",
                "sort": "id:asc",
            }
        )
        issue_ids.extend(int(issue["id"]) for issue in issues if issue.get("id"))
    issue_ids = sorted(set(issue_ids))
    if not args.execute:
        print_json({"dry_run": True, "issue_ids": issue_ids, "count": len(issue_ids)})
        return
    changed: list[int] = []
    for issue_id in issue_ids:
        issue = client.issue(issue_id)
        state = custom_state(issue, client.field_id)
        # Bulk initialization is intentionally conservative: never erase a
        # human-question or failure state. Requeue those issues explicitly with
        # the transition command after the underlying blocker is resolved.
        if state == "":
            client.set_state(
                issue_id,
                STATE_QUEUED,
                notes=with_disclaimer("Ticket wurde zur KI-Vorbereitung eingereiht."),
            )
            changed.append(issue_id)
    print_json({"dry_run": False, "changed_issue_ids": changed, "count": len(changed)})


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)

    config = subparsers.add_parser("config-check", help="Verify field and projects")
    config.add_argument("--project", action="append")
    config.set_defaults(handler=command_config_check)

    listing = subparsers.add_parser("list", help="List queued issues")
    listing.add_argument("--project", action="append")
    listing.add_argument("--state", default=STATE_QUEUED, choices=EXPECTED_STATES)
    listing.set_defaults(handler=command_list)

    show = subparsers.add_parser("show", help="Show full issue context")
    show.add_argument("issue_id", type=int)
    show.set_defaults(handler=command_show)

    claim = subparsers.add_parser("claim", help="Claim a queued issue")
    claim.add_argument("issue_id", type=int)
    claim.set_defaults(handler=command_claim)

    apply_command = subparsers.add_parser("apply", help="Publish a validated contract")
    apply_command.add_argument("issue_id", type=int)
    apply_command.add_argument("--description-file", type=Path, required=True)
    apply_command.add_argument("--subject")
    apply_command.add_argument("--note")
    apply_command.set_defaults(handler=command_apply)

    needs_input = subparsers.add_parser("needs-input", help="Request one human decision")
    needs_input.add_argument("issue_id", type=int)
    needs_input.add_argument("--comment-file", type=Path, required=True)
    needs_input.set_defaults(handler=command_needs_input)

    fail = subparsers.add_parser("fail", help="Record a preparation failure")
    fail.add_argument("issue_id", type=int)
    fail.add_argument("--comment-file", type=Path, required=True)
    fail.set_defaults(handler=command_fail)

    transition = subparsers.add_parser("transition", help="Set an explicit workflow state")
    transition.add_argument("issue_id", type=int)
    transition.add_argument("--state", required=True, choices=EXPECTED_STATES)
    transition.add_argument("--note")
    transition.set_defaults(handler=command_transition)

    child = subparsers.add_parser("create-child", help="Create a Wayfinder or vertical child")
    child.add_argument("parent_id", type=int)
    child.add_argument("--subject", required=True)
    child.add_argument("--description-file", type=Path, required=True)
    child.add_argument("--tracker-id", type=int)
    child.add_argument("--state", default=STATE_QUEUED, choices=EXPECTED_STATES)
    child.set_defaults(handler=command_create_child)

    relate = subparsers.add_parser("relate", help="Create a native issue relation")
    relate.add_argument("issue_id", type=int)
    relate.add_argument("--to-id", type=int, required=True)
    relate.add_argument(
        "--type",
        default="blocks",
        choices=(
            "relates",
            "duplicates",
            "duplicated",
            "blocks",
            "blocked",
            "precedes",
            "follows",
            "copied_to",
            "copied_from",
        ),
    )
    relate.set_defaults(handler=command_relate)

    bulk = subparsers.add_parser(
        "bulk-queue", help="Queue all open issues in named projects (dry-run by default)"
    )
    bulk.add_argument("--project", action="append", required=True)
    bulk.add_argument("--execute", action="store_true")
    bulk.set_defaults(handler=command_bulk_queue)

    return parser


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    try:
        client = RedmineClient()
        args.handler(client, args)
    except RedmineError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
