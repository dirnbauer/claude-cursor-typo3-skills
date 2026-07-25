/**
 * Baseline sealing and verification.
 *
 * A baseline that can be edited is not evidence. Sealing writes SHA256SUMS over every
 * artifact plus LOCK.json, which itself records the hash of SHA256SUMS — so tampering
 * requires editing two files consistently, and even then the environment, content and
 * manifest hashes recorded inside the lock still have to match.
 *
 * There is no unseal. A baseline goes unsealed -> sealed exactly once.
 */

import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { sha256 } from './paths.mjs';
import { InvalidRunError, PreconditionError, HarnessError } from '../cli/exit-codes.mjs';

export async function hashTree(root) {
  const files = [];
  async function walk(dir, rel = '') {
    let items;
    try { items = await readdir(dir, { withFileTypes: true }); }
    catch (err) { if (err.code === 'ENOENT') return; throw err; }
    for (const item of items.sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(dir, item.name);
      const relPath = rel ? `${rel}/${item.name}` : item.name;
      if (item.isDirectory()) { await walk(abs, relPath); continue; }
      if (!item.isFile()) continue;
      if (['SHA256SUMS', 'LOCK.json', 'SEAL.md'].includes(item.name)) continue;
      const buf = await readFile(abs);
      const s = await stat(abs);
      files.push({ path: relPath, sha256: sha256(buf), bytes: s.size });
    }
  }
  await walk(root);
  return files;
}

export function renderSums(files) {
  return `${files.map((f) => `${f.sha256}  ${f.path}`).join('\n')}\n`;
}

export function parseSums(text) {
  return String(text).split('\n').filter(Boolean).map((line) => {
    const [hash, ...rest] = line.split(/\s{2,}/);
    return { sha256: hash, path: rest.join('  ') };
  });
}

export async function sealBaseline(dir, {
  id = 'A-original',
  kind = 'mixed',
  manifestHash = null,
  environmentFingerprintHash = null,
  contentFingerprintHash = null,
  harnessVersion = '2.0.0',
  sealedBy = 't3u',
  now = () => new Date().toISOString(),
} = {}) {
  const lockPath = path.join(dir, 'LOCK.json');
  try {
    await readFile(lockPath, 'utf8');
    throw new HarnessError(`Baseline ${id} is already sealed. There is no unseal.`);
  } catch (err) {
    if (err instanceof HarnessError) throw err;
    if (err.code !== 'ENOENT') throw err;
  }

  const files = await hashTree(dir);
  if (!files.length) {
    throw new PreconditionError(`Nothing to seal in ${dir} — capture the baseline first.`);
  }

  const sums = renderSums(files);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, 'SHA256SUMS'), sums, 'utf8');

  const lock = {
    schema: 'typo3-14-update/baseline-lock@1',
    id, kind,
    sealedAt: now(), sealedBy,
    fileCount: files.length,
    totalBytes: files.reduce((a, f) => a + f.bytes, 0),
    sha256sumsSha256: sha256(sums),
    manifestHash, environmentFingerprintHash, contentFingerprintHash,
    harnessVersion,
  };
  await writeFile(lockPath, `${JSON.stringify(lock, null, 2)}\n`, 'utf8');
  return { lock, files: files.length, sumsPath: path.join(dir, 'SHA256SUMS') };
}

/**
 * Recompute, compare, then verify the lock's own hash of SHA256SUMS.
 * Any mismatch is INVALID: the comparison base cannot be trusted, which is a different
 * statement from the site being wrong.
 */
export async function verifyBaseline(dir, { id = 'A-original' } = {}) {
  let lock;
  try {
    lock = JSON.parse(await readFile(path.join(dir, 'LOCK.json'), 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new PreconditionError(`Baseline ${id} is not sealed (no LOCK.json in ${dir}).`);
    }
    throw new InvalidRunError(`Baseline lock unreadable: ${err.message}`);
  }

  let sumsText;
  try {
    sumsText = await readFile(path.join(dir, 'SHA256SUMS'), 'utf8');
  } catch {
    throw new InvalidRunError(`Baseline ${id} has a lock but no SHA256SUMS — it has been tampered with.`);
  }

  if (sha256(sumsText) !== lock.sha256sumsSha256) {
    throw new InvalidRunError(
      `SHA256SUMS for baseline ${id} does not match the hash recorded in LOCK.json.`,
      { expected: lock.sha256sumsSha256, actual: sha256(sumsText) },
    );
  }

  const recorded = new Map(parseSums(sumsText).map((f) => [f.path, f.sha256]));
  const current = new Map((await hashTree(dir)).map((f) => [f.path, f.sha256]));

  const changed = [];
  const removed = [];
  const added = [];
  for (const [p, h] of recorded) {
    if (!current.has(p)) removed.push(p);
    else if (current.get(p) !== h) changed.push(p);
  }
  for (const p of current.keys()) if (!recorded.has(p)) added.push(p);

  const ok = changed.length === 0 && removed.length === 0 && added.length === 0;
  if (!ok) {
    throw new InvalidRunError(
      `Baseline ${id} has been modified since sealing: `
      + `${changed.length} changed, ${removed.length} removed, ${added.length} added.`,
      { changed: changed.slice(0, 20), removed: removed.slice(0, 20), added: added.slice(0, 20) },
    );
  }
  return { ok, lock, fileCount: recorded.size };
}

export function renderSeal(lock, { sampleHash, urls, captures, notes = [] }) {
  return `# Baseline seal — ${lock.id}

| Field | Value |
|---|---|
| Sealed at | ${lock.sealedAt} |
| Sealed by | ${lock.sealedBy} |
| Files | ${lock.fileCount} |
| Total bytes | ${lock.totalBytes} |
| URLs | ${urls ?? 'n/a'} |
| Captures | ${captures ?? 'n/a'} |
| Sample hash | \`${sampleHash ?? 'n/a'}\` |
| Manifest hash | \`${lock.manifestHash ?? 'n/a'}\` |
| Environment fingerprint | \`${lock.environmentFingerprintHash ?? 'n/a'}\` |
| Content fingerprint | \`${lock.contentFingerprintHash ?? 'n/a'}\` |
| SHA256SUMS hash | \`${lock.sha256sumsSha256}\` |
| Harness | ${lock.harnessVersion} |

This baseline is **immutable**. Overwriting, editing or deleting anything in it is not
grantable by any approval — see \`rules/20-baseline-integrity.md\`.

${notes.length ? `## Notes\n\n${notes.map((n) => `- ${n}`).join('\n')}\n` : ''}`;
}
