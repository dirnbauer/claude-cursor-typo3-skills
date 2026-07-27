# Code Review Quality Patterns

Language-agnostic code review checklist and patterns for ensuring production-quality code.
These patterns apply to Go, PHP, TypeScript, Python, and other languages.

## Code Review Checklist

Before approving any PR, verify these patterns:

### 1. Test Resource Management

**Issue:** Tests creating multiple instances of the same resource when only one is needed.

**Check:**
- [ ] Is there exactly ONE instance of each configurable resource per test?
- [ ] Is the resource fully configured at creation time (not reconfigured later)?
- [ ] Are shared counters/state isolated between test resources?

**Bad Example:**
```go
func TestFeature(t *testing.T) {
    // BAD: Creates two instances, first is unused
    c := NewClient(WithTimeout(5))
    _, _ = c.AddJob("* * * * *", myJob)

    c = NewClient(WithTimeout(5), WithLogger(logger))  // Replaced!
    _, _ = c.AddJob("* * * * *", myJob)
    c.Start()
}
```

**Good Example:**
```go
func TestFeature(t *testing.T) {
    // GOOD: Single instance, fully configured
    c := NewClient(
        WithTimeout(5),
        WithLogger(logger),
    )
    _, _ = c.AddJob("* * * * *", myJob)
    c.Start()
}
```

### 2. State Mutation Completeness

**Issue:** Operations that logically change state but don't update tracking fields.

**Check:**
- [ ] After operations complete, are ALL related tracking fields updated?
- [ ] On restart/retry, will the state be correct?
- [ ] Are side effects committed atomically with the main operation?

**Bad Example:**
```go
func (s *Scheduler) handleMissedRuns(entry *Entry, missed []time.Time) {
    for _, t := range missed {
        s.runJob(entry, t)
    }
    // BAD: entry.LastRun not updated - will re-run on restart!
}
```

**Good Example:**
```go
func (s *Scheduler) handleMissedRuns(entry *Entry, missed []time.Time) {
    for _, t := range missed {
        s.runJob(entry, t)
    }
    // GOOD: Update tracking state after execution
    entry.LastRun = missed[len(missed)-1]
}
```

### 3. Defensive Enum/Const Handling

**Issue:** Switch statements on enums without handling unknown values.

**Check:**
- [ ] Does the enum type have a `Valid()` or `IsValid()` method?
- [ ] Do switch statements have a `default` case?
- [ ] Is the default case tested explicitly?
- [ ] Are unexpected values logged for debugging?

**Bad Example:**
```go
func (p Policy) Apply() {
    switch p {
    case PolicyA:
        doA()
    case PolicyB:
        doB()
    // BAD: No default case - silently ignores invalid values
    }
}
```

**Good Example:**
```go
// Valid returns true if the policy is a known valid value
func (p Policy) Valid() bool {
    return p >= PolicyA && p <= PolicyB
}

func (p Policy) Apply() error {
    switch p {
    case PolicyA:
        doA()
    case PolicyB:
        doB()
    default:
        // GOOD: Log and handle unexpected values
        log.Warn("unexpected policy value", "policy", int(p))
        return fmt.Errorf("invalid policy: %d", p)
    }
    return nil
}
```

**Testing Default Case:**
```go
func TestPolicyApply_InvalidPolicy(t *testing.T) {
    p := Policy(99)  // Invalid value
    err := p.Apply()
    if err == nil {
        t.Error("expected error for invalid policy")
    }
}
```

### 4. Documentation Accuracy

**Issue:** Documentation claims that don't match actual behavior or benchmarks.

**Check:**
- [ ] Are performance claims verified against actual benchmark output?
- [ ] Are negative trade-offs documented (memory increase, complexity)?
- [ ] Do code examples include all necessary imports?
- [ ] Do code examples handle errors appropriately?

**Bad Example:**
```markdown
## Performance
WithCapacity provides ~6% improvement in bulk operations.
```
(When benchmarks actually show 12% improvement)

**Good Example:**
```markdown
## Performance
WithCapacity provides ~12% improvement in bulk addition time (based on
BenchmarkBulkAdd: 128342 ns/op without vs 113338 ns/op with capacity).

Trade-off: ~3% higher memory usage due to pre-allocated capacity.
```

### 5. Platform-Specific Code

**Issue:** Code that only works on certain platforms without documentation.

**Check:**
- [ ] Is platform-specific code clearly marked?
- [ ] Are limitations documented in comments?
- [ ] Are alternatives provided for unsupported platforms?
- [ ] Are build tags used where appropriate?

**Bad Example:**
```go
func lockFile(f *os.File) error {
    return syscall.Flock(int(f.Fd()), syscall.LOCK_EX)
}
```

**Good Example:**
```go
// lockFile acquires an exclusive lock on the file.
// NOTE: This uses flock() which is Unix-specific (Linux, macOS, BSD).
// On Windows, use LockFileEx from golang.org/x/sys/windows.
//
//go:build !windows
func lockFile(f *os.File) error {
    return syscall.Flock(int(f.Fd()), syscall.LOCK_EX)
}
```

### 6. Defensive Code Coverage

**Issue:** Defensive code paths (error handling, edge cases) not tested.

**Check:**
- [ ] Are `default` switch cases covered by tests?
- [ ] Are error paths tested (not just happy path)?
- [ ] Are boundary conditions tested?
- [ ] Is validation logic tested with invalid inputs?

**Strategy for Testing Defensive Code:**
```go
// To test defensive code that's normally unreachable,
// bypass normal validation and call internal functions directly

func TestHandleInvalidState(t *testing.T) {
    // Create object in invalid state (bypassing constructor validation)
    obj := &MyObject{
        state: InvalidState(99),
    }

    // Call method that has defensive handling
    err := obj.Process()

    // Verify defensive code executed correctly
    if err == nil {
        t.Error("expected error for invalid state")
    }
}
```

## Review Process Quality

### Required Conversation Resolution (Branch Protection)

Enable `required_conversation_resolution` in branch protection to **enforce** that all review threads are resolved before merging. Without this, review feedback can be silently ignored — especially problematic when automated reviewers (e.g., GitHub Copilot) leave actionable comments.

```bash
# Check if enabled
gh api repos/{owner}/{repo}/branches/main/protection \
  --jq 'if .required_conversation_resolution.enabled then "✅ Enabled" else "❌ NOT enabled" end'
```

See `references/github.md` → "Review Enforcement" for full setup instructions.

### PR Review Thread Resolution

When addressing review feedback:

1. **Fix the code** - Address the feedback
2. **Reply to the thread** - Explain what was changed (use GraphQL API to reply to thread, not new comment)
3. **Resolve the thread** - Mark as resolved after fix is pushed
4. **Verify CI** - Ensure all checks still pass

### Review Comment Quality

Good review comments:
- Explain WHY something is problematic
- Provide a concrete suggestion or example
- Reference documentation or standards when applicable

## Language-Specific Implementations

| Pattern | Go | PHP | TypeScript |
|---------|-----|-----|------------|
| Enum validation | `func (e Enum) Valid() bool` | `enum_exists()` or cases match | `Object.values(Enum).includes(v)` |
| Time mocking | `FakeClock` interface | `Carbon::setTestNow()` | `jest.useFakeTimers()` |
| Platform detection | Build tags `//go:build` | `PHP_OS_FAMILY` | `process.platform` |

## Integration with CI

Add these checks to your CI pipeline:

```yaml
# Example: Ensure test coverage for new code
- name: Check patch coverage
  run: |
    # Fail if new code has < 90% coverage
    diff-cover coverage.xml --fail-under=90
```

## Related References

- `references/ci-patterns.md` - CI/CD automation
- `references/security-hardening.md` - Security patterns
