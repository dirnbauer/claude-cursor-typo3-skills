/**
 * STATUS.md, regenerated from state.json. Never hand-edited: an edited dashboard stops
 * matching the evidence it summarises, and it is the first thing a person reads.
 */

export function renderStatus(state) {
  const s = state ?? {};
  const loops = Object.entries(s.loops ?? {}).sort(([a], [b]) => a.localeCompare(b));

  const rows = loops.length
    ? loops.map(([id, verdict]) => `| \`${id}\` | ${bandFor(id)} | ${badge(verdict)} |`).join('\n')
    : '| — | — | no loops yet |';

  const blocked = s.blocked
    ? `> **BLOCKED** since ${s.blocked.since}: ${s.blocked.reason} (loop ${s.blocked.loop_id})`
    : '';

  return `# Update run — ${s.project?.name ?? '(unnamed)'}

> Regenerated from \`state.json\`. Do not hand-edit.

${blocked}

| | |
|---|---|
| Run id | \`${s.run_id ?? '—'}\` |
| Target | TYPO3 ${s.target?.typo3_from || '?'} → ${s.target?.typo3_to || '14.3'}, PHP ${s.target?.php_from || '?'} → ${s.target?.php_to || '8.4'} |
| PHP 8.5 evaluated | ${php85(s)} |
| Phase | ${s.contract_a?.phase ?? '—'} |
| Contract A | ${s.contract_a?.status ?? '—'}${s.contract_a?.closed_at ? ` (closed ${s.contract_a.closed_at})` : ''} |
| Contract B | ${s.contract_b?.unlocked ? 'unlocked' : 'locked'} |
| Open findings | ${s.open_findings ?? 0} |
| Updated | ${s.updated_at ?? '—'} |

## Integrity

| Check | Value |
|---|---|
| Baseline \`A-original\` | ${s.baselines?.['A-original']?.sealed ? `sealed ${s.baselines['A-original'].sealed_at}` : '**not sealed**'} |
| Environment fingerprint | ${code(s.fingerprints?.environment)} |
| Content fingerprint | ${code(s.fingerprints?.content)} |
| Determinism self-test | ${s.selftest?.status ?? 'never-run'}${s.selftest?.at ? ` (${s.selftest.at})` : ''} |
| URL manifest | ${code(s.manifest?.hash)} |
| Quarantined captures | ${(s.selftest?.quarantined_captures ?? []).length} |

## Loops

| Loop | Band | Verdict |
|---|---|---|
${rows}

## Approvals and decisions

- Approvals: ${(s.approvals ?? []).length ? s.approvals.map((a) => `\`${a}\``).join(', ') : 'none'}
- Decisions: ${(s.decisions ?? []).length ? s.decisions.map((d) => `\`${d}\``).join(', ') : 'none'}
- Snapshots: ${(s.snapshots ?? []).length ? s.snapshots.map((x) => `\`${x}\``).join(', ') : 'none'}
`;
}

function php85(s) {
  const e = s.target?.php_85_evaluated;
  if (e === null || e === undefined) return '**not yet checked**';
  if (e === true && !(s.target?.php_85_blockers ?? []).length) return 'yes — no blockers';
  return `yes — blocked by ${(s.target?.php_85_blockers ?? []).join(', ') || 'unknown'}`;
}

function badge(v) {
  return { green: '✓ green', open: '· open', aborted: '✗ aborted', planned: '· planned', superseded: '~ superseded' }[v] ?? v;
}

function code(v) { return v ? `\`${v}\`` : '—'; }

function bandFor(id) {
  const n = Number(id);
  if (n < 10) return 'harness';
  if (n < 100) return 'pre-update';
  if (n < 200) return 'migration';
  if (n < 300) return 'features';
  if (n < 400) return 'closure';
  if (n < 900) return 'elevation';
  return 'reporting';
}
