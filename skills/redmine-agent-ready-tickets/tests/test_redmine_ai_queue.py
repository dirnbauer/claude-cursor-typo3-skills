from __future__ import annotations

import importlib.util
from pathlib import Path
from types import SimpleNamespace
import unittest


SCRIPT = Path(__file__).parents[1] / "scripts" / "redmine_ai_queue.py"
SPEC = importlib.util.spec_from_file_location("redmine_ai_queue", SCRIPT)
assert SPEC and SPEC.loader
queue = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(queue)


class FakeClient:
    field_id = 42

    def __init__(self) -> None:
        self.states = {
            1: "",
            2: queue.STATE_NEEDS_INPUT,
            3: queue.STATE_FAILED,
            4: queue.STATE_READY,
        }
        self.changed: list[tuple[int, str]] = []

    def project(self, project_ref: str) -> dict[str, object]:
        return {"id": project_ref, "identifier": project_ref}

    def list_issues(self, params: dict[str, object]) -> list[dict[str, object]]:
        return [{"id": issue_id} for issue_id in (4, 2, 1, 3)]

    def issue(self, issue_id: int) -> dict[str, object]:
        return {
            "id": issue_id,
            "custom_fields": [{"id": self.field_id, "value": self.states[issue_id]}],
        }

    def set_state(self, issue_id: int, state: str, *, notes: str = "") -> None:
        self.states[issue_id] = state
        self.changed.append((issue_id, state))


class QueueTests(unittest.TestCase):
    def test_custom_state_reads_selected_field(self) -> None:
        issue = {
            "custom_fields": [
                {"id": 7, "value": "ignored"},
                {"id": 42, "value": queue.STATE_QUEUED},
            ]
        }
        self.assertEqual(queue.custom_state(issue, 42), queue.STATE_QUEUED)

    def test_bulk_queue_is_dry_run_by_default(self) -> None:
        client = FakeClient()
        args = SimpleNamespace(project=["ideas", "capexone"], execute=False)

        queue.command_bulk_queue(client, args)

        self.assertEqual(client.changed, [])

    def test_bulk_queue_does_not_overwrite_blocking_or_completed_states(self) -> None:
        client = FakeClient()
        args = SimpleNamespace(project=["ideas"], execute=True)

        queue.command_bulk_queue(client, args)

        self.assertEqual(client.changed, [(1, queue.STATE_QUEUED)])
        self.assertEqual(client.states[2], queue.STATE_NEEDS_INPUT)
        self.assertEqual(client.states[3], queue.STATE_FAILED)
        self.assertEqual(client.states[4], queue.STATE_READY)


if __name__ == "__main__":
    unittest.main()
