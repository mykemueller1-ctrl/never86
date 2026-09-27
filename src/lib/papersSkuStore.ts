/**
 * SKU lines kept by store id + ISO week.
 * One email can open several stores. Each store is its own operator seat
 * (`seat:<id>`). That seat id is the store id. The person email is not a key.
 * A missing week is Missing, not $0.
 *
 * One document is deleted and reinserted inside a single transaction.
 * Memory changes only after that transaction commits. Same-store saves in
 * this process wait their turn so two writes cannot report success on a
 * half-written map.
 */

import { neon } from '@neondatabase/serverless';
import type { PapersSkuRow } from '@/lib/papersSkuParse';

export type StoredSkuRow = PapersSkuRow & {
  storeId: string;
  ownerId: string | null;
  documentKey: string;
  lineIndex: number;
};

export class PapersSkuPersistError extends Error {
  constructor(message = 'SKU lines were not saved. Compare was not updated.') {
    super(message);
    this.name = 'PapersSkuPersistError';
  }
}

export function papersSkuFailureMessage(error: unknown): string | null {
  return error instanceof PapersSkuPersistError ? error.message : null;
}

export type SkuStatement = { text: string; values: unknown[] };

export type SkuExecutor = {
  transaction(statements: SkuStatement[]): Promise<void>;
  query<T = Record<string, unknown>>(text: string, values?: unknown[]): Promise<T[]>;
};

/** Seat id for the selected store. An email is a person, not a store. */
export function papersStoreKey(storeId: string): string | null {
  const id = storeId.trim();
  if (!id || id.includes('@')) return null;
  return id;
}

const memory = new Map<string, StoredSkuRow[]>();
const queues = new Map<string, Promise<unknown>>();
let schemaReady: Promise<void> | null = null;
let executorOverride: SkuExecutor | null = null;
let neonCached: { url: string; executor: SkuExecutor } | null = null;

export function setPapersSkuExecutorForTests(executor: SkuExecutor | null): void {
  executorOverride = executor;
  schemaReady = null;
}

export function resetPapersSkuStore(): void {
  memory.clear();
  queues.clear();
  schemaReady = null;
}

/** Drop the in-process copy so the next read has to load the database. */
export function forgetPapersSkuMemory(storeId?: string): void {
  if (!storeId) {
    memory.clear();
    return;
  }
  const key = papersStoreKey(storeId);
  if (key) memory.delete(key);
}

export function papersSkuRowsForStore(storeId: string, isoWeek?: string): StoredSkuRow[] {
  const key = papersStoreKey(storeId);
  if (!key) return [];
  const rows = memory.get(key) ?? [];
  if (!isoWeek) return rows;
  return rows.filter((row) => row.isoWeek === isoWeek);
}

function enqueue<T>(storeId: string, work: () => Promise<T>): Promise<T> {
  const previous = queues.get(storeId) ?? Promise.resolve();
  const run = previous.then(work, work);
  queues.set(storeId, run.then(() => undefined, () => undefined));
  return run;
}

function activeExecutor(): SkuExecutor | null {
  if (executorOverride) return executorOverride;
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!neonCached || neonCached.url !== url) {
    neonCached = { url, executor: neonSkuExecutor(url) };
  }
  return neonCached.executor;
}

function neonSkuExecutor(url: string): SkuExecutor {
  const sql = neon(url);
  return {
    async transaction(statements) {
      if (!statements.length) return;
      await sql.transaction(statements.map((statement) => sql.query(statement.text, statement.values)));
    },
    async query(text, values = []) {
      const rows = await sql.query(text, values);
      return rows as Record<string, unknown>[];
    },
  };
}

function storedFrom(storeId: string, documentKey: string, rows: PapersSkuRow[], ownerId?: string | null): StoredSkuRow[] {
  const owner = ownerId?.trim() || null;
  return rows.map((row, lineIndex) => ({
    ...row,
    storeId,
    ownerId: owner,
    documentKey,
    lineIndex,
  }));
}

export function replacePapersSkuDocument(
  storeId: string,
  documentKey: string,
  rows: PapersSkuRow[],
  ownerId?: string | null,
): Promise<StoredSkuRow[]> {
  const key = papersStoreKey(storeId);
  if (!key) return Promise.resolve([]);
  const stored = storedFrom(key, documentKey, rows, ownerId);
  return enqueue(key, async () => {
    await persistDocument(key, documentKey, stored);
    const kept = (memory.get(key) ?? []).filter((row) => row.documentKey !== documentKey);
    memory.set(key, kept.concat(stored));
    return stored;
  });
}

async function ensureSkuSchema(db: SkuExecutor): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await db.query(`
        create table if not exists papers_sku_lines (
          operator_id text not null,
          store_id text,
          owner_id text,
          document_key text not null,
          line_index integer not null,
          iso_week text,
          row_json jsonb not null,
          updated_at timestamptz not null default now(),
          primary key (operator_id, document_key, line_index)
        )
      `);
      await db.query(`alter table papers_sku_lines add column if not exists store_id text`);
      await db.query(`alter table papers_sku_lines add column if not exists owner_id text`);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

async function persistDocument(storeId: string, documentKey: string, stored: StoredSkuRow[]): Promise<void> {
  const db = activeExecutor();
  if (!db) return;
  const statements: SkuStatement[] = [
    {
      text: `delete from papers_sku_lines
             where document_key = $1
               and (store_id = $2 or operator_id = $2)`,
      values: [documentKey, storeId],
    },
    ...stored.map((row) => ({
      text: `insert into papers_sku_lines (
               operator_id, store_id, owner_id, document_key, line_index, iso_week, row_json, updated_at
             ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, now())`,
      values: [
        storeId,
        storeId,
        row.ownerId,
        documentKey,
        row.lineIndex,
        row.isoWeek,
        JSON.stringify(row),
      ],
    })),
  ];
  try {
    await ensureSkuSchema(db);
    await db.transaction(statements);
  } catch (error) {
    if (error instanceof PapersSkuPersistError) throw error;
    throw new PapersSkuPersistError();
  }
}

function readStored(value: unknown): StoredSkuRow {
  if (typeof value === 'string') return JSON.parse(value) as StoredSkuRow;
  return value as StoredSkuRow;
}

export async function hydratePapersSku(storeId: string): Promise<void> {
  const key = papersStoreKey(storeId);
  if (!key || memory.has(key)) return;
  const db = activeExecutor();
  if (!db) return;
  try {
    await ensureSkuSchema(db);
    const found = await db.query<{ row_json: unknown }>(
      `select row_json from papers_sku_lines
       where store_id = $1
          or (store_id is null and operator_id = $1)
       order by document_key, line_index`,
      [key],
    );
    memory.set(key, found.map((row) => readStored(row.row_json)));
  } catch (error) {
    if (error instanceof PapersSkuPersistError) throw error;
    throw new PapersSkuPersistError('SKU lines were not loaded. Compare was not updated.');
  }
}
