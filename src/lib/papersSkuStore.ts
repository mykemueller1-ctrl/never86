/**
 * SKU lines kept by store id + ISO week.
 * In this product one email can open several stores. Each store is its own
 * operator seat (`seat:<id>`). That seat id is the store id. The person email
 * is not a key. A missing week is Missing, not $0.
 */

import { neon } from '@neondatabase/serverless';
import type { PapersSkuRow } from '@/lib/papersSkuParse';

export type StoredSkuRow = PapersSkuRow & {
  storeId: string;
  ownerId: string | null;
  documentKey: string;
  lineIndex: number;
};

/** Seat id for the selected store. An email is a person, not a store. */
export function papersStoreKey(storeId: string): string | null {
  const id = storeId.trim();
  if (!id || id.includes('@')) return null;
  return id;
}

const memory = new Map<string, StoredSkuRow[]>();
let schemaReady: Promise<void> | null = null;

export function resetPapersSkuStore(): void {
  memory.clear();
  schemaReady = null;
}

export function papersSkuRowsForStore(storeId: string, isoWeek?: string): StoredSkuRow[] {
  const key = papersStoreKey(storeId);
  if (!key) return [];
  const rows = memory.get(key) ?? [];
  if (!isoWeek) return rows;
  return rows.filter((row) => row.isoWeek === isoWeek);
}

export function replacePapersSkuDocument(
  storeId: string,
  documentKey: string,
  rows: PapersSkuRow[],
  ownerId?: string | null,
): StoredSkuRow[] {
  const key = papersStoreKey(storeId);
  if (!key) return [];
  const kept = (memory.get(key) ?? []).filter((row) => row.documentKey !== documentKey);
  const stored: StoredSkuRow[] = rows.map((row, lineIndex) => ({
    ...row,
    storeId: key,
    ownerId: ownerId?.trim() || null,
    documentKey,
    lineIndex,
  }));
  memory.set(key, kept.concat(stored));
  void persistPapersSku(key).catch(() => undefined);
  return stored;
}

async function ensureSkuSchema(url: string): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = neon(url);
      await sql`
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
      `;
      await sql`alter table papers_sku_lines add column if not exists store_id text`;
      await sql`alter table papers_sku_lines add column if not exists owner_id text`;
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  await schemaReady;
}

async function persistPapersSku(storeId: string): Promise<void> {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return;
  await ensureSkuSchema(url);
  const sql = neon(url);
  const rows = memory.get(storeId) ?? [];
  const keys = [...new Set(rows.map((row) => row.documentKey))];
  for (const documentKey of keys) {
    await sql`
      delete from papers_sku_lines
      where document_key = ${documentKey}
        and (store_id = ${storeId} or operator_id = ${storeId})
    `;
    const group = rows.filter((row) => row.documentKey === documentKey && row.storeId === storeId);
    for (const row of group) {
      await sql`
        insert into papers_sku_lines (
          operator_id, store_id, owner_id, document_key, line_index, iso_week, row_json, updated_at
        )
        values (
          ${storeId}, ${storeId}, ${row.ownerId}, ${documentKey}, ${row.lineIndex},
          ${row.isoWeek}, ${JSON.stringify(row)}::jsonb, now()
        )
      `;
    }
  }
}

export async function hydratePapersSku(storeId: string): Promise<void> {
  if (memory.has(storeId)) return;
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return;
  try {
    await ensureSkuSchema(url);
    const sql = neon(url);
    const found = await sql`
      select row_json from papers_sku_lines
      where store_id = ${storeId}
         or (store_id is null and operator_id = ${storeId})
      order by document_key, line_index
    `;
    const rows = found.map((row) => row.row_json as StoredSkuRow);
    memory.set(storeId, rows);
  } catch {
    memory.set(storeId, memory.get(storeId) ?? []);
  }
}
