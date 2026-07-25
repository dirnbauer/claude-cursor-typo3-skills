# P13 — Contract A closure certificate

Gate, no loop. The document that lets Contract B start.

## Preconditions
Loops 000–320 all `green`, or `aborted` with a user-approved residual.

## Steps
1. Run `gate-check --group A`.
2. Write `report/contract-a-closure.md`.
3. Set `contract_a.status = "closed"`, `contract_a.closed_at`, and `contract_b.unlocked = true`.

## The certificate must state
- Every loop id with its verdict and iteration count.
- Residual findings by class, with why each is acceptable.
- The `A-original` manifest hash and the sample hash.
- Coverage actually achieved: URLs discovered, HTTP compared, DOM compared, pixels captured, and
  **every URL not pixel-compared with its reason**.
- Every URL excluded from the invariance claim: `A-supplemental` entries and any `unstable_urls`,
  each with its ADR.
- Every approval that reclassified a difference as `declared-change`.
- Any way in which the claim is weaker than "all public URLs proven identical" — stated plainly.

## The claim being certified

> After the update the site runs TYPO3 14.3 with modernised, secure code. For visitors it looks and
> behaves as it did before, and that has been proven by complete, reproducible, unaltered evidence.

If that sentence needs a qualifier, **write the qualifier**. A claim that quietly overstates its
coverage is worse than a narrower claim stated honestly.

## Blocking
Any Contract B work before this file exists is a rules violation and must be reverted. Gate B1.1
compares timestamps, so it is detectable after the fact.

