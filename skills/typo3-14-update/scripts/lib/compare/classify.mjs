/**
 * Finding classification — the decision tree from rules/30-finding-classification.md,
 * implemented so the same logic cannot drift between skill text and tool.
 *
 * The class decides WHERE the repair goes: a regression is fixed in the site,
 * harness-noise in the harness, content-drift means the comparison is void. Getting the
 * class wrong sends the work to the wrong place, which is why this is code and not prose.
 */

export const CLASSES = Object.freeze([
  'regression', 'declared-change', 'pre-existing',
  'harness-noise', 'environment', 'content-drift', 'improvement',
]);

/** Classes that block Contract A. `declared-change` blocks only without an approval. */
export const BLOCKING = Object.freeze(['regression', 'harness-noise', 'content-drift']);

export const SEVERITIES = Object.freeze(['blocker', 'major', 'minor', 'info']);

export class Unclassifiable extends Error {
  constructor(target, detail) {
    super(`Finding cannot be classified: ${target}`);
    this.name = 'Unclassifiable';
    this.detail = detail;
  }
}

/**
 * First match wins, top to bottom.
 *
 * @param {object} f
 * @param {boolean} f.contentDrift      content fingerprint changed during the run
 * @param {boolean|null} f.reproduced   did it reproduce on an immediate re-shoot?
 * @param {boolean} f.inBaseline        reproduces against baseline A on the unmodified site
 * @param {string|null} f.approvalRef   an approval naming this difference class
 * @param {boolean} f.ddevOnly          exists only because this is DDEV
 * @param {boolean} f.visitorVisible    a visitor would see or receive something different
 * @param {boolean} f.isOpportunity     an opportunity rather than a difference
 */
export function classify(f) {
  if (f.contentDrift) return 'content-drift';
  if (f.reproduced === false) return 'harness-noise';
  if (f.inBaseline) return 'pre-existing';
  if (f.approvalRef) return 'declared-change';
  if (f.ddevOnly) return 'environment';
  if (f.visitorVisible) return 'regression';
  if (f.isOpportunity) return 'improvement';
  throw new Unclassifiable(f.target ?? '(unknown)', f);
}

/** Severity is triage priority only. It never converts a class into an acceptable one:
 *  a `minor` regression still blocks. This is the opposite of v1, where "minor" passed. */
export function severityFor({ broken = false, primaryTemplate = false, defaultState = true, visuallyApparent = true }) {
  if (broken) return 'blocker';
  if (!visuallyApparent) return 'info';
  if (primaryTemplate && defaultState) return 'major';
  return 'minor';
}

export function isBlocking(finding) {
  if (finding.class === 'declared-change') return !finding.approval_ref;
  return BLOCKING.includes(finding.class);
}

export function countByClass(findings) {
  const counts = Object.fromEntries(CLASSES.map((c) => [c, 0]));
  counts.unclassified = 0;
  for (const f of findings) {
    if (!f.class || !CLASSES.includes(f.class)) counts.unclassified += 1;
    else counts[f.class] += 1;
  }
  return counts;
}

/**
 * A loop is green only when nothing blocking is open AND nothing is unclassified.
 * Residuals may only be the three non-blocking classes.
 */
export function loopVerdict(findings, { idempotenceDiff = 0 } = {}) {
  const counts = countByClass(findings);
  const openBlocking = findings.filter((f) => f.status !== 'closed' && isBlocking(f));
  const reasons = [];

  if (counts.unclassified > 0) reasons.push(`${counts.unclassified} unclassified finding(s)`);
  for (const f of openBlocking) reasons.push(`${f.id} (${f.class}) is open`);
  if (idempotenceDiff > 0) reasons.push(`idempotence re-run produced ${idempotenceDiff} difference(s)`);

  return {
    verdict: reasons.length === 0 ? 'green' : 'open',
    blockingReasons: reasons,
    counts,
    residual: findings
      .filter((f) => f.status !== 'closed' && !isBlocking(f))
      .map((f) => f.id),
  };
}

/** Oscillation: a finding that closed and reopened once means the fix addressed a symptom. */
export function oscillationDetected(findings) {
  return findings.filter((f) => (f.reopened_count ?? 0) >= 1).map((f) => f.id);
}
