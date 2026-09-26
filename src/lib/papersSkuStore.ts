/**
 * SKU lines kept by store id + ISO week.
 * The compare step reads these rows. A missing week is Missing, not $0.
 */

import { neon } from '@neondatabase/serverless';
import type { PapersSkuRow } from '@/lib/papersSkuParse';

export type StoredSkuRow = PapersSkuRow & {
  storeId: string;
  documentKey: string;
  lineIndex: number;
};

const memory = new Map<string, StoredSkuRow[]>();
let schemaReady: Promise<void> | null = null;

export function resetPapersSkuStore(): void {
  memory.clear();
  schemaReady = null;
}

export function papersSkuRowsForStore(storeId: string, isoWeek?: string): StoredSkuRow[] {
  const rows = memory.get(storeId) ?? [];
  if (!isoWeek) return rows;
  return rows.filter((row) => row.isoWeek === isoWeek);
}

export function replacePapersSkuDocument(storeId: string, documentKey: string, rows: PapersSkuRow[]): StoredSkuRow[] {
  const kept = (memory.get(storeId) ?? []).filter((row) => row.documentKey !== documentKey);
  const stored: StoredSkuRow[] = rows.map((row, lineIndex) => ({
    ...row,
    storeId,
    documentKey,
    lineIndex,
  }));
  memory.set(storeId, kept.concat(stored));
  void persistPapersSku(storeId).catch(() => undefined);
  return stored;
}

async function ensureSkuSchema(url: string): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      const sql = neon(url);
      await sql`
        create table if not exists papers_sku_lines (
          operator_id text not null,
          document_key text not null,
          line_index integer not null,
          iso_week text,
          row_json jsonb not null,
          updated_at timestamptz not null default now(),
          primary key (operator_id, document_key, line_index)
        )
      `;
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
    await sql`delete from papers_sku_lines where operator_id = ${storeId} and document_key = ${documentKey}`;
    const group = rows.filter((row) => row.documentKey === documentKey);
    for (const row of group) {
      await sql`
        insert into papers_sku_lines (operator_id, document_key, line_index, iso_week, row_json, updated_at)
        values (${storeId}, ${documentKey}, ${row.lineIndex}, ${row.isoWeek}, ${JSON.stringify(row)}::jsonb, now())
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
      where operator_id = ${storeId}
      order by document_key, line_index
    `;
    const rows = found.map((row) => row.row_json as StoredSkuRow);
    memory.set(storeId, rows);
  } catch {
    memory.set(storeId, memory.get(storeId) ?? []);
  }
}
