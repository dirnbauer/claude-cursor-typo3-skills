---
schema: typo3-14-update/loop-doc@1
run_id: "{{RUN_ID}}"
loop_id: "{{LOOP_ID}}"
loop_slug: "{{LOOP_SLUG}}"
track: "{{TRACK}}"
contract: "{{CONTRACT}}"
phase: "{{PHASE}}"
doc: plan
baseline_ref: "{{BASELINE_REF}}"
status: open
created_at: "{{NOW}}"
updated_at: "{{NOW}}"

hypotheses: []
ordered_causes: []
measurement_command: ""
determinism_proof: "loops/000-harness-determinism-selftest/report.json#verdict"
---

# Plan — loop {{LOOP_ID}}

## Measurement

The exact command, run unchanged for every iteration of this loop. Changing the
measurement mid-loop makes the iterations incomparable.

```bash

```

Determinism proof this loop relies on: loop 000 verdict `green`, self-test lock valid.

## Hypotheses

| Id | Statement | Confidence |
|---|---|---|
| H1 | | |

## Ordered causes

One cause per iteration, in this order. The order is a decision: fix the cause most
likely to explain the largest group of findings first, so the next measurement is
maximally informative.

| Id | Cause | Expected to close | Evidence for the attribution |
|---|---|---|---|
| C1 | | | |
| C2 | | | |

## Triage aid

When a difference appears, the cheapest discriminator is which stage caught it:

| Stage 1 (HTTP) | Stage 2 (DOM) | Stage 3 (pixels) | Likely cause class |
|---|---|---|---|
| differs | differs | differs | Routing, redirect, or template change |
| same | differs | differs | Template, Fluid, or extension markup change |
| same | same | differs | CSS, asset, font, or image-processing change |
| same | same | same | No finding |

Running the stages in order and reading this table first is what turns a forty-iteration
pixel hunt into a three-iteration fix.
