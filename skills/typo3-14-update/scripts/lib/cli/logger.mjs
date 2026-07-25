/**
 * Console output. Single-line, prefixed, non-TTY-safe.
 * Findings and errors go to stderr so stdout stays parseable when --json is used.
 */

const COLOUR = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code, s) => (COLOUR ? `[${code}m${s}[0m` : s);

export function createLogger({ quiet = false, verbose = false, scope = 't3u' } = {}) {
  const tag = (label) => `[${scope}] ${label}`;
  return {
    info: (m) => { if (!quiet) process.stdout.write(`${tag('·')} ${m}\n`); },
    step: (m) => { if (!quiet) process.stdout.write(`${tag(c('36', '→'))} ${m}\n`); },
    success: (m) => { if (!quiet) process.stdout.write(`${tag(c('32', '✓'))} ${m}\n`); },
    warn: (m) => process.stderr.write(`${tag(c('33', '!'))} ${m}\n`),
    error: (m) => process.stderr.write(`${tag(c('31', '✗'))} ${m}\n`),
    finding: (m) => process.stderr.write(`${tag(c('33', '●'))} ${m}\n`),
    debug: (m) => { if (verbose) process.stderr.write(`${tag('debug')} ${m}\n`); },
    json: (obj) => process.stdout.write(`${JSON.stringify(obj, null, 2)}\n`),
  };
}
