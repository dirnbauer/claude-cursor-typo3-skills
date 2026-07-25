/**
 * The content fingerprint — proof that the INPUTS did not change during the run.
 *
 * Without it, an editor saving one content element in the local backend mid-run looks
 * exactly like an update regression. That is a common and expensive failure mode: a day
 * spent hunting a change the update never made.
 *
 * Self-changing tables are excluded, or the fingerprint would never match itself.
 * _processed_ is excluded from the INPUT hash on purpose — it is a rendering result, not an
 * input — but its warm/cold state is recorded separately because it changes timing.
 */

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir, stat, readFile } from 'node:fs/promises';
import path from 'node:path';
import { sha256 } from '../run/paths.mjs';
import { InvalidRunError } from '../cli/exit-codes.mjs';

const exec = promisify(execFile);

export const TRACKED_TABLES = Object.freeze([
  'pages', 'tt_content', 'sys_file', 'sys_file_reference', 'sys_file_metadata',
  'sys_redirect', 'sys_template', 'sys_category', 'sys_category_record_mm',
]);

/** Excluded because they change without anyone editing content. */
export const EXCLUDED_TABLES = Object.freeze([
  'cf_*', 'sys_log', 'be_sessions', 'fe_sessions', 'sys_lockedrecords',
  'tx_scheduler_task', 'sys_history', 'sys_refindex',
]);

export const EXCLUDED_FILE_DIRS = Object.freeze(['_processed_', '_temp_']);

const CONTENT_HASH_MAX_BYTES = 8 * 1024 * 1024;

export async function collectContent({
  ddevProject = null,
  fileadmin = 'fileadmin',
  tables = TRACKED_TABLES,
  allowMissing = false,
  runner = ddevSql,
} = {}) {
  const database = await collectDatabase({ ddevProject, tables, runner });

  if (!database.available && !allowMissing) {
    throw new InvalidRunError(
      'Content fingerprint unavailable: the database could not be queried. '
      + 'Without it a mid-run content change is indistinguishable from a regression. '
      + 'Pass --allow-missing to proceed, and the report will record that you did.',
      { reason: database.error },
    );
  }

  const files = await collectFiles(fileadmin);
  const body = {
    database: database.available
      ? { tables: database.tables, excludedTables: [...EXCLUDED_TABLES], collectedVia: database.via }
      : { available: false, error: database.error },
    files,
  };

  return {
    kind: 'content-fingerprint',
    fingerprintHash: `sha256:${sha256(JSON.stringify(body))}`,
    degraded: !database.available,
    ...body,
    capturedAt: new Date().toISOString(),
  };
}

async function collectDatabase({ ddevProject, tables, runner }) {
  const rows = [];
  try {
    for (const table of tables) {
      const sql = `SELECT COUNT(*) AS c, COALESCE(MAX(tstamp),0) AS t, COALESCE(MAX(uid),0) AS u FROM ${table}`;
      const out = await runner(sql, ddevProject);
      if (out === null) continue;
      const [c, t, u] = out;
      rows.push({ table, rowCount: Number(c), maxTstamp: Number(t), maxUid: Number(u), method: 'count+max' });
    }
    if (!rows.length) return { available: false, error: 'no tables could be queried' };
    return { available: true, tables: rows, via: 'ddev mysql' };
  } catch (err) {
    return { available: false, error: String(err.message ?? err) };
  }
}

async function ddevSql(sql, project) {
  const args = ['mysql', '--no-tablespaces'];
  if (project) args.push('--project', project);
  try {
    const { stdout } = await exec('ddev', args, { input: `${sql};`, timeout: 20000, encoding: 'utf8' });
    const lines = String(stdout).trim().split('\n');
    if (lines.length < 2) return null;
    return lines[1].split('\t');
  } catch {
    return null;
  }
}

export async function collectFiles(root) {
  const entries = [];
  let totalBytes = 0;
  let processedCount = 0;

  async function walk(dir, rel = '') {
    let items;
    try { items = await readdir(dir, { withFileTypes: true }); }
    catch (err) { if (err.code === 'ENOENT') return; throw err; }

    for (const item of items.sort((a, b) => a.name.localeCompare(b.name))) {
      const abs = path.join(dir, item.name);
      const relPath = rel ? `${rel}/${item.name}` : item.name;

      if (item.isDirectory()) {
        if (EXCLUDED_FILE_DIRS.includes(item.name)) {
          processedCount += await countFiles(abs);
          continue;
        }
        await walk(abs, relPath);
        continue;
      }
      if (!item.isFile()) continue;

      const s = await stat(abs);
      totalBytes += s.size;
      let contentHash = null;
      if (s.size <= CONTENT_HASH_MAX_BYTES) {
        contentHash = sha256(await readFile(abs));
      }
      entries.push(`${relPath}|${s.size}|${Math.floor(s.mtimeMs / 1000)}|${contentHash ?? 'large'}`);
    }
  }

  await walk(root);
  return {
    root,
    fileCount: entries.length,
    totalBytes,
    treeHash: `sha256:${sha256(entries.join('\n'))}`,
    method: 'sha256 over sorted (relpath,size,mtime@1s,contentSha256 for files<8MiB)',
    excluded: [...EXCLUDED_FILE_DIRS],
    imageProcessingWarm: { processedFileCount: processedCount },
  };
}

async function countFiles(dir) {
  let n = 0;
  try {
    for (const item of await readdir(dir, { withFileTypes: true })) {
      if (item.isDirectory()) n += await countFiles(path.join(dir, item.name));
      else n += 1;
    }
  } catch { /* unreadable is zero for counting purposes */ }
  return n;
}

export function compareContent(sealed, current) {
  const drifted = [];
  const bTables = new Map((sealed.database?.tables ?? []).map((t) => [t.table, t]));
  for (const t of current.database?.tables ?? []) {
    const b = bTables.get(t.table);
    if (!b) { drifted.push({ key: `table:${t.table}`, before: null, after: t }); continue; }
    if (b.rowCount !== t.rowCount || b.maxTstamp !== t.maxTstamp || b.maxUid !== t.maxUid) {
      drifted.push({ key: `table:${t.table}`, before: b, after: t });
    }
  }
  if (sealed.files?.treeHash !== current.files?.treeHash) {
    drifted.push({
      key: 'files.treeHash',
      before: sealed.files?.treeHash ?? null,
      after: current.files?.treeHash ?? null,
    });
  }
  return { match: drifted.length === 0, drifted };
}
