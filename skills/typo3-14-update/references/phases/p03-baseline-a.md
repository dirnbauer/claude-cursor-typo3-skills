# P03 — Baseline A capture and seal (loop 001)

Track `harness`. The single most order-sensitive phase in the skill.

## Preconditions
Loop 000 green. **No site change of any kind has been made yet.**

## Allowed
*Read-only* sitemap inventory — validate but **do not fix**. URL discovery, sampling, capture,
sealing. No remediation of any kind.

## Why remediation waits
It feels sensible to fix the sitemaps first, since they are the sampling source. It is wrong: a
baseline captured after a fix cannot show what the fix broke, and a change made before the baseline
exists can never be audited. **Seal first, remediate second.**

## Steps
1. Validate sitemaps read-only: each language has a reachable variant, entries use the right base and
   language prefixes, hreflang and canonical are consistent, URLs answer 200 and are indexable, the
   expected page tree is covered with no excluded doktypes leaking. **Record the defects as findings
   for loop 010; fix nothing.**
2. Discover URLs through the guarded walker, with the seed from `config/run.yml`.
3. Derive the sample: tier 1 mandatory pages, template-cluster representatives, seeded remainder
   within the capture budget. Persist `config/sample.txt`.
4. Capture stage 1 (HTTP), stage 2 (DOM) and stage 3 (screenshots) across the viewport and state
   matrix.
5. Seal: `MANIFEST.sha256` over every artifact, `LOCK.json`, and `SEAL.md` recording who, when, both
   fingerprints and the sample hash.

## Evidence
`config/sample.txt` · `baseline/A-original/{SEAL.md,MANIFEST.sha256,LOCK.json,http,dom,shots}`

## Exit
Every sample URL captured; manifest written; `state.baselines["A-original"].sealed == true`.

## Blocking
Sitemaps too broken to derive a sample. Record `ADR-002-degraded-sampling`, derive the sample from a
page-tree crawl instead, seal **that**, and name the degradation in the closure certificate. Never
fix the sitemaps first.

