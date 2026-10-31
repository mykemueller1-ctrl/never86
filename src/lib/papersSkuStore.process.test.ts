import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import net from 'node:net';
import { tmpdir } from 'node:os';
import path from 'node:path';
import postgres from 'postgres';
import { afterAll, describe, expect, it } from 'vitest';

const HASH = createHash('sha256').update('synthetic-race-file').digest('hex');
const SEAT = 'seat:race-proc';

function pgBin(name: string): string | null {
  const root = '/usr/lib/postgresql';
  if (!existsSync(root)) return null;
  const versions = readdirSync(root).filter((entry) => existsSync(path.join(root, entry, 'bin', name)));
  const version = versions.sort().at(-1);
  return version ? path.join(root, version, 'bin', name) : null;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      if (!address || typeof address === 'string') {
        reject(new Error('no local port'));
        return;
      }
      const { port } = address;
      server.close(() => resolve(port));
    });
  });
}

function run(bin: string, args: string[], env: NodeJS.ProcessEnv): void {
  const result = spawnSync(bin, args, { env, encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`${path.basename(bin)} ${args.join(' ')} failed\n${result.stderr || result.stdout}`);
  }
}

function waitFor(child: ChildProcess): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });
    child.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    child.once('error', reject);
    child.once('exit', (code) => resolve({ code, stdout, stderr }));
  });
}

describe('two OS processes racing one paper', () => {
  const initdb = pgBin('initdb');
  const pgctl = pgBin('pg_ctl');
  const createdb = pgBin('createdb');
  let dataDir = '';
  let sql: postgres.Sql | null = null;

  afterAll(async () => {
    await sql?.end({ timeout: 5 }).catch(() => undefined);
    if (pgctl && dataDir) {
      spawnSync(pgctl, ['-D', dataDir, '-m', 'immediate', 'stop'], { encoding: 'utf8' });
    }
    if (dataDir) rmSync(dataDir, { recursive: true, force: true });
  });

  it('keeps the confirmed price when the raw import blocks on the other process lock', async () => {
    expect(initdb && pgctl && createdb, 'local Postgres binaries').toBeTruthy();
    if (!initdb || !pgctl || !createdb) return;
    const port = await freePort();
    const root = mkdtempSync(path.join(tmpdir(), 'never86-papers-race-'));
    dataDir = path.join(root, 'data');
    const socketDir = path.join(root, 'sock');
    const signalDir = path.join(root, 'signal');
    mkdirSync(socketDir);
    mkdirSync(signalDir);
    const env: NodeJS.ProcessEnv = { ...process.env, LC_ALL: 'C.UTF-8', LANG: 'C.UTF-8' };
    delete env.DATABASE_URL;
    run(initdb, ['-D', dataDir, '-U', 'papers', '--auth-local=trust', '--auth-host=trust', '--no-sync'], env);
    run(pgctl, [
      '-D', dataDir,
      '-l', path.join(root, 'postgres.log'),
      '-o', `-p ${port} -k ${socketDir} -c listen_addresses=127.0.0.1 -c unix_socket_directories=${socketDir}`,
      '-w',
      'start',
    ], env);
    run(createdb, ['-h', '127.0.0.1', '-p', String(port), '-U', 'papers', 'papers'], env);
    const url = `postgres://papers@127.0.0.1:${port}/papers`;
    sql = postgres(url, { max: 1, ssl: false, connect_timeout: 10 });

    const tsx = path.join(process.cwd(), 'node_modules/tsx/dist/cli.mjs');
    const worker = path.join(process.cwd(), 'src/lib/papersSkuRaceWorker.ts');
    const childEnv: NodeJS.ProcessEnv = {
      ...env,
      PAPERS_RACE_URL: url,
      PAPERS_RACE_DIR: signalDir,
      PAPERS_RACE_HASH: HASH,
    };
    delete childEnv.DATABASE_URL;
    const review = spawn(process.execPath, [tsx, worker], {
      env: { ...childEnv, PAPERS_RACE_ROLE: 'review' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const reviewDone = waitFor(review);
    const holding = path.join(signalDir, 'review-holding');
    const holdStarted = Date.now();
    while (!existsSync(holding)) {
      if (review.exitCode !== null) {
        const ended = await reviewDone;
        throw new Error(`review process exited before taking the lock\n${ended.stderr}`);
      }
      if (Date.now() - holdStarted > 20_000) throw new Error('review process did not take the lock');
      await new Promise((resolve) => setTimeout(resolve, 30));
    }

    const raw = spawn(process.execPath, [tsx, worker], {
      env: { ...childEnv, PAPERS_RACE_ROLE: 'raw' },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const rawDone = waitFor(raw);
    const waitStarted = Date.now();
    let rawWaited = false;
    while (!rawWaited) {
      if (raw.exitCode !== null) break;
      if (Date.now() - waitStarted > 15_000) throw new Error('raw process did not wait on the review lock');
      const activity = await sql<{ wait_event_type: string | null; query: string }[]>`
        select wait_event_type, left(query, 160) as query
        from pg_stat_activity
        where datname = 'papers'
          and pid <> pg_backend_pid()
          and state = 'active'
      `;
      rawWaited = activity.some((row) =>
        (row.wait_event_type === 'Lock' || row.wait_event_type === 'transactionid')
        && /papers_sku_hash_locks/i.test(row.query));
      if (!rawWaited) await new Promise((resolve) => setTimeout(resolve, 30));
    }
    expect(rawWaited).toBe(true);
    const { writeFileSync } = await import('node:fs');
    writeFileSync(path.join(signalDir, 'release-review'), '1');

    const [reviewResult, rawResult] = await Promise.all([reviewDone, rawDone]);
    expect(reviewResult.stderr).toBe('');
    expect(rawResult.stderr).toBe('');
    expect(reviewResult.code).toBe(0);
    expect(rawResult.code).toBe(0);
    expect(reviewResult.stdout.trim()).toBe('committed');
    expect(rawResult.stdout.trim()).toBe('kept');

    const lines = await sql<{ document_key: string; iso_week: string | null; row_json: { unitPrice?: { amount?: number; honesty?: string }; storeId?: string } }[]>`
      select document_key, iso_week, row_json
      from papers_sku_lines
      where store_id = ${SEAT} or store_id = 'seat:race-other'
      order by store_id, document_key
    `;
    const raced = lines.filter((row) => row.document_key === `paper:${HASH}`);
    expect(raced).toHaveLength(1);
    expect(raced[0].iso_week).toBe('2026-W24');
    expect(raced[0].row_json.unitPrice).toMatchObject({ amount: 2.25, honesty: 'Estimated' });
    expect(lines.some((row) => row.document_key === 'other-doc' && row.row_json.unitPrice?.amount === 4)).toBe(true);
    expect(lines.some((row) => row.row_json.storeId === 'seat:race-other' && row.row_json.unitPrice?.amount === 4)).toBe(true);
    const reviews = await sql<{ row_json: { confirmed?: boolean; isoWeek?: string; contentHash?: string } }[]>`
      select row_json from papers_scan_rows where operator_id = ${SEAT}
    `;
    expect(reviews).toHaveLength(1);
    expect(reviews[0].row_json).toMatchObject({ confirmed: true, isoWeek: '2026-W24', contentHash: HASH });
  }, 60_000);
});
