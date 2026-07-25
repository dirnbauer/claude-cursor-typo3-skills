# Rule 30 — Finding classification

Normative. Every difference, failure, and violation produced by any measurement is a **finding**, and every finding carries exactly one class. Unclassified findings block the gate.

Classification is not bookkeeping. The class determines who fixes what, and where: a `regression` is fixed in the site, `harness-noise` is fixed in the harness, and `content-drift` means the comparison itself is void. Getting the class wrong sends the repair to the wrong place.

## 30.1 The seven classes

| Class | Meaning | Where it is fixed | Blocks Contract A? |
|---|---|---|---|
| `regression` | The update changed what visitors see or receive. A Contract A violation. | The site | **Yes** |
| `declared-change` | An intentional, approved change with a recorded `approval_ref`. | Nowhere — it is recorded | No, with approval |
| `pre-existing` | Reproduces in baseline A. Not caused by this update. | Out of scope for A; candidate for B | No |
| `harness-noise` | Non-determinism in the measurement, not in the site. | The harness / stabilisation, via loop 000 | **Yes** |
| `environment` | A DDEV-local artifact — absolute URLs, mail transport, TLS termination. | Nowhere — goes to the handover | No |
| `content-drift` | The database or `fileadmin` changed under the run. | Escalate; the comparison is void | **Yes** |
| `improvement` | A Contract B candidate noticed during A. | Logged, not acted on inside A | No |

## 30.2 The decision tree

Work top to bottom. The first match wins.

1. **Did the content fingerprint change?** → `content-drift`. Stop. Do not classify anything else in this run until the drift is resolved; every other finding is suspect.
2. **Does it reproduce on an immediate re-shoot of the same URL?** If no → `harness-noise`. A difference that does not reproduce is a property of the measurement.
3. **Does it reproduce against baseline A on the *unmodified* site?** If yes → `pre-existing`. It was already there.
4. **Is there an approval record naming this exact difference class?** If yes → `declared-change`. If the approval is missing, it is **not** a declared change — it is a `regression` until the approval exists.
5. **Does it exist only because this is DDEV** (a `.ddev.site` URL in a canonical, mail landing in Mailpit, a header a production proxy would set)? → `environment`.
6. **Would a visitor see or receive something different?** → `regression`.
7. **Is it a genuine opportunity rather than a difference?** → `improvement`.
8. **None of the above** → the loop aborts on `unclassifiable`. Escalate to the user with the evidence. Do not invent a class, and do not fall back to `regression` to keep moving — an unclassifiable finding means the model of the system is wrong somewhere, and that is worth a human's attention.

## 30.3 `harness-noise` is a defect, not a dismissal

Classifying a finding as `harness-noise` does not close it. It moves it: the loop stays blocked, and the missing stabilisation goes back to loop 000 to be fixed.

`harness-noise` count must be **zero** in every Contract A loop at exit. A run that tolerates noise cannot distinguish a real regression from a flake, which is the same as not testing.

## 30.4 Severity

Independent of class, for triage order only. Severity never converts a `regression` into something acceptable.

| Severity | Meaning |
|---|---|
| `blocker` | Page broken, content missing, error output, 5xx |
| `major` | Visible layout, spacing, colour, font, or content change on a primary template |
| `minor` | Visible change on a rarely-reached page or a non-default state |
| `info` | Structurally different, not visually apparent (for example an attribute order change that survived normalisation) |

`minor` here is a *priority*, not a verdict. A `minor` `regression` still blocks Contract A. This is deliberately different from the old harness, where `minor` silently meant "passed".

## 30.5 Finding lifecycle

`open` → `closed`, and back to `open` if it recurs.

Each finding records `reopened_count`. A single reopen triggers the oscillation abort in `10-loop-protocol.md`: a finding that closes and reopens means the fix addressed a symptom, and continuing to iterate will not find the cause.

Status changes go into `04-findings.md` (current state) and `journal.jsonl` (history). The register shows where things stand; the journal shows how they got there.

## 30.6 Residual findings at exit

A loop may exit green with residual findings **only** in the non-blocking classes: `pre-existing`, `environment`, `improvement`. Each is listed in `06-exit.md` under `residual_findings[]` and carried into the final report.

`regression`, `harness-noise`, `content-drift`, and unapproved `declared-change` findings never survive a green exit. If they cannot be resolved, the loop aborts and the user decides — the skill does not decide on its own that a regression is acceptable.
