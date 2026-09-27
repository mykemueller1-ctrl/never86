/**
 * SKU lines kept by store id + ISO week.
 * One email can open several stores. Each store is its own operator seat
 * (`seat:<id>`). That seat id is the store id. The person email is not a key.
 * A missing week is Missing, not $0.
 *
 * Scan and pull share one compare key: `paper:` plus the sha256 of the file.
 * A later unreviewed import does not replace lines once a review row exists
 * for that hash. Older `provider:filename` keys are removed in that same
 * database transaction.
 *
 * One document is deleted and reinserted inside a single transaction.
 * A confirmed review edit writes that document and the review row in the
 * same transaction. Memory changes only after commit. Same-store saves in
 * this process wait their turn so two writes cannot report success on a
 * half-written pair. On one database connection, two transactions for the
 * same document were serialized. The survivor was one complete document.
 * Two OS processes were not run.
 */

export const PAPERS_REVIEW_PERSIST_ERROR = 'Review and compare were not saved. The prior lines stay in place.';

import { createHash } from 'node:crypto';
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

/**
 * SQL drivers return plain row objects. Keep only those objects and expose
 * them as the caller's row type. Arrays and other values are dropped.
 */
export function checkedQueryRows<T>(rows: readonly unknown[]): T[] {
  const parsed: T[] = [];
  for (const row of rows) {
    if (typeof row === 'object' && row !== null && !Array.isArray(row)) parsed.push(row as T);
  }
  return parsed;
}

/** Seat id for the selected store. An email is a person, not a store. */
export function papersStoreKey(storeId: string): string | null {
  const id = storeId.trim();
  if (!id || id.includes('@')) return null;
  return id;
}

type PaperIdentity = {
  sourceHash?: string | null;
  legacyKeys?: string[];
  /** Delete other keys that end with this hash. Only when this transaction inserts the canonical document. */
  replaceHashSiblings?: boolean;
  /** Remove alias keys and leave the canonical document in place. */
  aliasesOnly?: boolean;
};

function isSha256(hash: string): boolean {
  return /^[a-f0-9]{64}$/.test(hash);
}

function contentHashFromReview(value: unknown): string | null {
  let row: { contentHash?: unknown; skuDocumentKey?: unknown } | null = null;
  if (typeof value === 'string') {
    try {
      row = JSON.parse(value) as { contentHash?: unknown; skuDocumentKey?: unknown };
    } catch {
      return null;
    }
  } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    row = value as { contentHash?: unknown; skuDocumentKey?: unknown };
  }
  if (!row) return null;
  if (typeof row.contentHash === 'string' && isSha256(row.contentHash.trim().toLowerCase())) {
    return row.contentHash.trim().toLowerCase();
  }
  if (typeof row.skuDocumentKey === 'string' && row.skuDocumentKey.startsWith('paper:')) {
    const hash = row.skuDocumentKey.slice('paper:'.length);
    if (isSha256(hash)) return hash;
  }
  return null;
}

function noteReviewedPaper(storeId: string, rowJson: unknown): void {
  const hash = contentHashFromReview(rowJson);
  if (!hash) return;
  const bucket = reviewedHashes.get(storeId) ?? new Set<string>();
  bucket.add(hash);
  reviewedHashes.set(storeId, bucket);
}

function isPaperAlias(row: StoredSkuRow, canonical: string, hash: string, legacyKeys: readonly string[]): boolean {
  if (row.documentKey === canonical) return false;
  if (legacyKeys.includes(row.documentKey)) return true;
  return Boolean(hash) && row.sourceHash === hash;
}

const memory = new Map<string, StoredSkuRow[]>();
const queues = new Map<string, Promise<unknown>>();
const reviewedHashes = new Map<string, Set<string>>();
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
  reviewedHashes.clear();
  schemaReady = null;
}

export function papersContentHash(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Stable compare key for one file. Scan and pull both use it. */
export function papersSkuDocumentKey(contentHash: string): string {
  return `paper:${contentHash.trim().toLowerCase()}`;
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
    async query<T>(text: string, values: unknown[] = []): Promise<T[]> {
      const rows = await sql.query(text, values);
      return checkedQueryRows<T>(rows);
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
      await db.query(`
        create table if not exists papers_scan_rows (
          operator_id text not null,
          dedupe_key text not null,
          row_json jsonb not null,
          updated_at timestamptz not null default now(),
          primary key (operator_id, dedupe_key)
        )
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

export function commitReviewedDocument(
  storeId: string,
  documentKey: string,
  rows: PapersSkuRow[],
  review: { dedupeKey: string; rowJson: unknown },
  ownerId?: string | null,
  identity?: PaperIdentity,
): Promise<StoredSkuRow[]> {
  const key = papersStoreKey(storeId);
  if (!key || !review.dedupeKey) return Promise.resolve([]);
  const stored = storedFrom(key, documentKey, rows, ownerId);
  const reviewJson = JSON.stringify(review.rowJson);
  return enqueue(key, async () => {
    await persistDocument(key, documentKey, stored, {
      dedupeKey: review.dedupeKey,
      rowJson: reviewJson,
      failureMessage: PAPERS_REVIEW_PERSIST_ERROR,
    }, identity);
    const hash = identity?.sourceHash?.trim().toLowerCase() ?? '';
    const legacy = identity?.legacyKeys ?? [];
    const dropSiblings = Boolean(identity?.replaceHashSiblings && isSha256(hash));
    const kept = (memory.get(key) ?? []).filter((row) => {
      if (row.documentKey === documentKey) return false;
      if (legacy.includes(row.documentKey)) return false;
      if (hash && row.sourceHash === hash) return false;
      if (dropSiblings && row.documentKey.endsWith(`:${hash}`)) return false;
      return true;
    });
    memory.set(key, kept.concat(stored));
    noteReviewedPaper(key, review.rowJson);
    return stored;
  });
}

/**
 * Pull path. The same bytes as a reviewed scan keep the reviewed lines.
 * The provider:filename key is removed either way so it cannot average in.
 */
export function replaceUnreviewedPaperDocument(
  storeId: string,
  contentHash: string,
  rows: PapersSkuRow[],
  legacyKeys: string[] = [],
  ownerId?: string | null,
): Promise<'kept' | 'replaced'> {
  const key = papersStoreKey(storeId);
  const hash = contentHash.trim().toLowerCase();
  if (!key || !isSha256(hash)) return Promise.resolve('kept');
  const canonical = papersSkuDocumentKey(hash);
  const tagged = rows.map((row) => ({ ...row, documentKey: canonical, sourceHash: hash }));
  return enqueue(key, async () => {
    const identity: PaperIdentity = { sourceHash: hash, legacyKeys, replaceHashSiblings: true };
    if (await reviewExistsForContentHash(key, hash)) {
      await dropAliases(key, canonical, { ...identity, replaceHashSiblings: false, aliasesOnly: true });
      return 'kept' as const;
    }
    const stored = storedFrom(key, canonical, tagged, ownerId);
    const had = memory.has(key);
    await persistDocument(key, canonical, stored, undefined, identity);
    if (had) {
      const kept = (memory.get(key) ?? []).filter((row) => {
        if (row.documentKey === canonical) return false;
        if (isPaperAlias(row, canonical, hash, legacyKeys)) return false;
        if (row.documentKey.endsWith(`:${hash}`)) return false;
        return true;
      });
      memory.set(key, kept.concat(stored));
    }
    return 'replaced' as const;
  });
}

/** Remove a filename alias without replacing a reviewed document. */
export function dropUnreviewedPaperCopies(
  storeId: string,
  contentHash: string,
  legacyKeys: string[] = [],
): Promise<void> {
  const key = papersStoreKey(storeId);
  const hash = contentHash.trim().toLowerCase();
  if (!key || !isSha256(hash)) return Promise.resolve();
  return enqueue(key, () => dropAliases(key, papersSkuDocumentKey(hash), {
    sourceHash: hash,
    legacyKeys,
    aliasesOnly: true,
  }));
}

async function dropAliases(storeId: string, canonical: string, identity: PaperIdentity): Promise<void> {
  const hash = identity.sourceHash?.trim().toLowerCase() ?? '';
  const legacy = identity.legacyKeys ?? [];
  const had = memory.has(storeId);
  await persistDocument(storeId, canonical, [], undefined, { ...identity, aliasesOnly: true });
  if (had) {
    memory.set(storeId, (memory.get(storeId) ?? []).filter((row) => !isPaperAlias(row, canonical, hash, legacy)));
  }
}

export async function reviewExistsForContentHash(storeId: string, contentHash: string): Promise<boolean> {
  const key = papersStoreKey(storeId);
  const hash = contentHash.trim().toLowerCase();
  if (!key || !isSha256(hash)) return false;
  if (reviewedHashes.get(key)?.has(hash)) return true;
  const db = activeExecutor();
  if (!db) return false;
  try {
    await ensureSkuSchema(db);
    const found = await db.query<{ row_json: unknown }>(
      `select row_json from papers_scan_rows
       where operator_id = $1
       limit 200`,
      [key],
    );
    let exists = false;
    for (const row of found) {
      const seen = contentHashFromReview(readJson(row.row_json));
      if (!seen) continue;
      noteReviewedPaper(key, { contentHash: seen });
      if (seen === hash) exists = true;
    }
    return exists;
  } catch (error) {
    if (error instanceof PapersSkuPersistError) throw error;
    throw new PapersSkuPersistError(PAPERS_REVIEW_PERSIST_ERROR);
  }
}

async function persistDocument(
  storeId: string,
  documentKey: string,
  stored: StoredSkuRow[],
  review?: { dedupeKey: string; rowJson: string; failureMessage: string },
  identity?: PaperIdentity,
): Promise<void> {
  const db = activeExecutor();
  if (!db) return;
  const hash = identity?.sourceHash?.trim().toLowerCase() ?? '';
  const siblings = identity?.replaceHashSiblings && isSha256(hash) ? 'yes' : 'no';
  const statements: SkuStatement[] = [];
  if (identity?.aliasesOnly) {
    statements.push({
      text: `delete from papers_sku_lines
             where (store_id = $2 or operator_id = $2)
               and document_key <> $1
               and $3 <> ''
               and row_json->>'sourceHash' = $3`,
      values: [documentKey, storeId, hash],
    });
  } else {
    statements.push({
      text: `delete from papers_sku_lines
             where (store_id = $2 or operator_id = $2)
               and (
                 document_key = $1
                 or ($3 <> '' and row_json->>'sourceHash' = $3)
                 or ($4 = 'yes' and $3 <> '' and document_key like '%:' || $3)
               )`,
      values: [documentKey, storeId, hash, siblings],
    });
    statements.push(...stored.map((row) => ({
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
    })));
    if (review) {
      statements.push({
        text: `insert into papers_scan_rows (operator_id, dedupe_key, row_json, updated_at)
               values ($1, $2, $3::jsonb, now())
               on conflict (operator_id, dedupe_key) do update set
                 row_json = excluded.row_json,
                 updated_at = now()`,
        values: [storeId, review.dedupeKey, review.rowJson],
      });
    }
  }
  for (const legacy of identity?.legacyKeys ?? []) {
    if (!legacy || legacy === documentKey) continue;
    statements.push({
      text: `delete from papers_sku_lines
             where (store_id = $2 or operator_id = $2)
               and document_key = $1`,
      values: [legacy, storeId],
    });
  }
  try {
    await ensureSkuSchema(db);
    await db.transaction(statements);
  } catch (error) {
    if (error instanceof PapersSkuPersistError) throw error;
    throw new PapersSkuPersistError(review?.failureMessage || undefined);
  }
}

function readStored(value: unknown): StoredSkuRow {
  if (typeof value === 'string') return JSON.parse(value) as StoredSkuRow;
  return value as StoredSkuRow;
}

export async function loadPapersReviewRows(storeId: string): Promise<unknown[] | null> {
  const key = papersStoreKey(storeId);
  if (!key) return [];
  const db = activeExecutor();
  if (!db) return null;
  try {
    await ensureSkuSchema(db);
    const found = await db.query<{ row_json: unknown }>(
      `select row_json from papers_scan_rows
       where operator_id = $1
       order by updated_at asc
       limit 200`,
      [key],
    );
    return found.map((row) => readJson(row.row_json));
  } catch (error) {
    if (error instanceof PapersSkuPersistError) throw error;
    throw new PapersSkuPersistError('Review rows were not loaded. Compare was not shown.');
  }
}

function readJson(value: unknown): unknown {
  if (typeof value === 'string') return JSON.parse(value) as unknown;
  return value;
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
