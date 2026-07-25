---
id: security-no-claim-without-evidence
title: "Never report a check as passed without the tool output that proves it"
category: security
severity: error
appliesTo: ["**/*.md", "**/*.php", "**/*.mjs", "**/*.cjs", "**/*.py", "**/*.sh"]
typo3: ">=14.0"
php: ">=8.2"
trigger: "Use when reporting test, lint, audit, migration, upgrade or browser-check results."
---
# Never report a check as passed without the tool output that proves it

A claim is only as good as the command behind it. "Tests pass", "the wizards ran", "the modules all
open" are assertions; the exit code and the output are evidence.

**Do:** run it, record the command and its exit code, and quote the output.
**Don't:** infer a result from a previous run, from the code looking right, or from a plausible expectation.

Two failure modes this prevents, both common and both silent:

- **A tool that cannot fail.** A check whose script always exits `0` reports success for every input.
  Before trusting a gate, verify it can actually go red — a suite that has never failed may be
  measuring nothing.
- **A skipped step counted as a pass.** "12 ok, 3 skipped" exiting `0` hides three unchecked items.
  Distinguish *expected* skips from unexpected ones, and fail on the unexpected.

```bash
ddev exec vendor/bin/phpunit --testsuite=unit; echo "exit=$?"
```

When a check could not run, say which one, why, and what evidence does exist — then leave the task
incomplete. A gate that "does not apply" needs an explicit not-applicable record with a reason.
Silence is a failure, not a pass.

> Why: an unverified pass is worse than a known gap, because it stops anyone looking. Recording the
> command and exit code alongside every claim makes a report auditable by someone who was not there.
