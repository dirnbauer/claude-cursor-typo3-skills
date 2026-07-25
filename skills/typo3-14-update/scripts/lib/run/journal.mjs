/**
 * Append-only event log. The audit trail behind every claim in the final report.
 *
 * Never rewritten. Redaction happens before the write, and argv is redacted rather than
 * omitted: knowing THAT a command ran with a secret argument is useful; the value is not.
 */

import { appendFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { redactArgv, redactUrl } from '../util/redact.mjs';

export const EVENTS = Object.freeze([
  'command', 'finding', 'approval', 'decision', 'transition',
  'snapshot', 'policy-block', 'drift', 'abort', 'note',
]);

export class Journal {
  constructor(journalPath, { now = () => new Date().toISOString() } = {}) {
    this.path = journalPath;
    this.now = now;
  }

  async append(event, payload = {}) {
    if (!EVENTS.includes(event)) throw new Error(`Unknown journal event: ${event}`);
    const line = JSON.stringify({ ts: this.now(), event, ...sanitise(payload) });
    await mkdir(path.dirname(this.path), { recursive: true });
    await appendFile(this.path, `${line}\n`, 'utf8');
  }

  async commandStart({ argv, cwd, loopId, envFp }) {
    await this.append('command', {
      phase: 'start', loop_id: loopId ?? null,
      argv: redactArgv(argv), cwd, env_fp: envFp ?? null,
    });
  }

  async commandEnd({ argv, loopId, exitCode, durationMs, verdict, reports = [] }) {
    await this.append('command', {
      phase: 'end', loop_id: loopId ?? null, argv: redactArgv(argv),
      exit_code: exitCode, duration_ms: durationMs, verdict: verdict ?? null, reports,
    });
  }

  /** Security refusals get their own event so they are greppable rather than buried. */
  async policyBlock({ loopId, reason, target, purpose }) {
    await this.append('policy-block', {
      loop_id: loopId ?? null, reason, purpose: purpose ?? null,
      target: target ? redactUrl(target) : null,
    });
  }

  async read() {
    try {
      const raw = await readFile(this.path, 'utf8');
      return raw.split('\n').filter(Boolean).map((l) => {
        try { return JSON.parse(l); } catch { return { event: 'note', malformed: true, raw: l.slice(0, 200) }; }
      });
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }
}

function sanitise(payload) {
  const out = {};
  for (const [k, v] of Object.entries(payload)) {
    out[k] = typeof v === 'string' && /^https?:\/\//.test(v) ? redactUrl(v) : v;
  }
  return out;
}
