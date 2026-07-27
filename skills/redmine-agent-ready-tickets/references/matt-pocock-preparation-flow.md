# Matt Pocock workflow adapted to Redmine

## What the videos establish

Matt Pocock's current main flow is:

```text
align/grill → spec → vertical tickets → implement → two-axis code review → commit
```

Wayfinder is a situational on-ramp for a loose effort too large or foggy for one agent session. It creates a shared issue-tracker map and resolves decision tickets one session at a time before producing the spec.

The preparation skill stops before `implement`. It prepares Redmine so a later implementation session can run TDD, verify regularly, review against both standards and the originating spec, and commit.

## Preparation decision model

### Direct contract

Use when the desired outcome, constraints, and route fit one fresh agent session. Research facts as needed, write the contract, validate it, and mark it ready.

### Research (AFK)

Use when a decision waits on facts in repositories, documentation, APIs, or other primary sources. Capture findings with links and dates. Research answers facts; it does not choose stakeholder preferences.

### Grilling (HITL)

Use when product intent, risk appetite, priority, UX preference, or another stakeholder decision is missing. Ask one question at a time. Separate facts learned from decisions made. Confirm the decisions before synthesizing the spec.

### Prototype (HITL)

Use when a cheap artifact will raise discussion fidelity: rough UI alternatives, a state-machine sketch, a runnable logic stub, or a benchmark. Build only enough to answer the named question. Link the artifact from Redmine; do not mistake prototype code for production implementation.

### Task (AFK or HITL)

Use for prerequisite work that unblocks a decision without delivering the destination: provisioning access, moving sample data, or enabling a test environment. The resolution records what changed and the facts later tickets depend on.

### Wayfinder

Use when the destination is known but the route will exceed one session or has fog that cannot yet be ticketed precisely.

The Redmine parent body contains:

```text
h2. Destination

<the spec, decision, or change this map is finding a route to>

h2. Notes

<domain, standing preferences, repositories, skills>

h2. Decisions so far

* "<closed child title>":<url> — <one-line answer>

h2. Not yet specified

* <in-scope fog that is not yet a sharp question>

h2. Out of scope

* <work beyond the destination and why>
```

Create only sharp current-frontier questions as children. Use Redmine parent/child links and native `blocks` relations. Refer to tickets by linked subject, not bare IDs, in prose.

## Spec and tickets

When decisions are complete, create the spec in the parent description. If implementation spans more than one session, create vertical child tickets:

- a narrow but complete behavior through all affected layers
- independently demoable or verifiable
- sized for one fresh context window
- acceptance criteria and validation
- native blocking relations

Do not split into database/API/UI/test horizontal layers. A wide mechanical refactor may use expand–migrate–contract because ordinary vertical slicing cannot keep intermediate changes green.

## Implementation handoff contract

The ready ticket tells the implementation agent to:

1. orient to the spec and repository instructions
2. use red/green TDD at the pre-agreed highest practical seams
3. run focused tests and type/static checks throughout
4. run the full required suite once at the end
5. review in separate passes against repository standards and the originating spec
6. address findings, record evidence, and commit on the current branch

This skill records that handoff; it does not claim implementation occurred.

## Primary sources reviewed

- [Matt Pocock: New Skills v1.1](https://www.youtube.com/watch?v=A8mokin_YOs), July 2026
- [Matt Pocock: complete AI coding workflow](https://www.youtube.com/watch?v=M6mYodf0dJM), July 2026
- [mattpocock/skills repository](https://github.com/mattpocock/skills)
- [Wayfinder skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/wayfinder/SKILL.md)
- [to-spec skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/to-spec/SKILL.md)
- [to-tickets skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/to-tickets/SKILL.md)
- [implement skill](https://github.com/mattpocock/skills/blob/main/skills/engineering/implement/SKILL.md)

The workflow concepts are adapted under the upstream repository's MIT license. Redmine field names, state transitions, ticket contracts, validation, and Hermes automation are webconsulting.at-specific additions.
