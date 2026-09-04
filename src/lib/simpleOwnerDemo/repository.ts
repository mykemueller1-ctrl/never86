import { neon } from '@neondatabase/serverless';
import type { SimpleOwnerAskRecord, SimpleOwnerRepository, SimpleOwnerUploadRecord } from './types';

export function createMemoryRepository(): SimpleOwnerRepository & {
  uploads: SimpleOwnerUploadRecord[];
  asks: SimpleOwnerAskRecord[];
} {
  const uploads: SimpleOwnerUploadRecord[] = [];
  const asks: SimpleOwnerAskRecord[] = [];
  return {
    uploads,
    asks,
    async insertUpload(row) {
      uploads.push(row);
      return row;
    },
    async listUploads(operatorId) {
      return uploads.filter((row) => row.operatorId === operatorId);
    },
    async insertAsk(row) {
      asks.push(row);
      return row;
    },
    async listAsks(operatorId) {
      return asks.filter((row) => row.operatorId === operatorId);
    },
    async countAsks(operatorId) {
      return asks.filter((row) => row.operatorId === operatorId).length;
    },
  };
}

export async function ensureSimpleOwnerDemoSchema(databaseUrl: string): Promise<void> {
  const sql = neon(databaseUrl);
  await sql`
    create table if not exists simple_owner_uploads (
      id text primary key,
      operator_id text not null,
      filename text not null,
      content_type text not null,
      byte_length integer not null,
      evidence_kind text not null,
      source_tags jsonb not null default '[]'::jsonb,
      object_key text not null,
      storage_backend text not null,
      created_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists simple_owner_uploads_operator_idx on simple_owner_uploads (operator_id, created_at desc)`;
  await sql`
    create table if not exists simple_owner_asks (
      id text primary key,
      operator_id text not null,
      question text not null,
      tray text not null,
      mouth text not null,
      slug text,
      headline text not null,
      facts jsonb not null default '[]'::jsonb,
      coach_tomorrow text not null,
      needs text not null,
      source_tags jsonb not null default '[]'::jsonb,
      invented_close boolean not null default false,
      sample_dollars text not null default 'none-verified',
      verified_close boolean not null default false,
      created_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists simple_owner_asks_operator_idx on simple_owner_asks (operator_id, created_at desc)`;
  await sql`
    create table if not exists simple_owner_blobs (
      object_key text primary key,
      operator_id text not null,
      content_type text not null,
      payload_b64 text not null,
      created_at timestamptz not null default now()
    )
  `;
}

export function createNeonRepository(databaseUrl: string): SimpleOwnerRepository {
  const sql = neon(databaseUrl);
  return {
    async insertUpload(row) {
      await ensureSimpleOwnerDemoSchema(databaseUrl);
      await sql`
        insert into simple_owner_uploads (
          id, operator_id, filename, content_type, byte_length, evidence_kind,
          source_tags, object_key, storage_backend, created_at
        ) values (
          ${row.id}, ${row.operatorId}, ${row.filename}, ${row.contentType}, ${row.byteLength},
          ${row.evidenceKind}, ${JSON.stringify(row.sourceTags)}::jsonb, ${row.objectKey},
          ${row.storageBackend}, ${row.createdAt}
        )
      `;
      return row;
    },
    async listUploads(operatorId) {
      await ensureSimpleOwnerDemoSchema(databaseUrl);
      const rows = await sql`
        select id, operator_id, filename, content_type, byte_length, evidence_kind,
               source_tags, object_key, storage_backend, created_at
        from simple_owner_uploads
        where operator_id = ${operatorId}
        order by created_at asc
      `;
      return (rows as Record<string, unknown>[]).map(mapUpload);
    },
    async insertAsk(row) {
      await ensureSimpleOwnerDemoSchema(databaseUrl);
      await sql`
        insert into simple_owner_asks (
          id, operator_id, question, tray, mouth, slug, headline, facts, coach_tomorrow,
          needs, source_tags, invented_close, sample_dollars, verified_close, created_at
        ) values (
          ${row.id}, ${row.operatorId}, ${row.question}, ${row.tray}, ${row.mouth}, ${row.slug},
          ${row.headline}, ${JSON.stringify(row.facts)}::jsonb, ${row.coachTomorrow}, ${row.needs},
          ${JSON.stringify(row.sourceTags)}::jsonb, false, ${row.sampleDollars}, false, ${row.createdAt}
        )
      `;
      return row;
    },
    async listAsks(operatorId) {
      await ensureSimpleOwnerDemoSchema(databaseUrl);
      const rows = await sql`
        select id, operator_id, question, tray, mouth, slug, headline, facts, coach_tomorrow,
               needs, source_tags, created_at
        from simple_owner_asks
        where operator_id = ${operatorId}
        order by created_at asc
      `;
      return (rows as Record<string, unknown>[]).map(mapAsk);
    },
    async countAsks(operatorId) {
      await ensureSimpleOwnerDemoSchema(databaseUrl);
      const rows = await sql`
        select count(*)::int as n from simple_owner_asks where operator_id = ${operatorId}
      `;
      return Number((rows[0] as { n?: number } | undefined)?.n ?? 0);
    },
  };
}

export function createNeonBlobWriter(databaseUrl: string) {
  const sql = neon(databaseUrl);
  return async function putBlob(input: {
    operatorId: string;
    objectKey: string;
    contentType: string;
    payloadB64: string;
  }): Promise<void> {
    await ensureSimpleOwnerDemoSchema(databaseUrl);
    await sql`
      insert into simple_owner_blobs (object_key, operator_id, content_type, payload_b64)
      values (${input.objectKey}, ${input.operatorId}, ${input.contentType}, ${input.payloadB64})
      on conflict (object_key) do update set
        content_type = excluded.content_type,
        payload_b64 = excluded.payload_b64
    `;
  };
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asJson<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

function mapUpload(row: Record<string, unknown>): SimpleOwnerUploadRecord {
  return {
    id: asString(row.id),
    operatorId: asString(row.operator_id),
    filename: asString(row.filename),
    contentType: asString(row.content_type),
    byteLength: Number(row.byte_length ?? 0),
    evidenceKind: asString(row.evidence_kind, 'other') as SimpleOwnerUploadRecord['evidenceKind'],
    sourceTags: asJson(row.source_tags, []),
    objectKey: asString(row.object_key),
    storageBackend: asString(row.storage_backend, 'memory') as SimpleOwnerUploadRecord['storageBackend'],
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : asString(row.created_at),
  };
}

function mapAsk(row: Record<string, unknown>): SimpleOwnerAskRecord {
  return {
    id: asString(row.id),
    operatorId: asString(row.operator_id),
    question: asString(row.question),
    tray: asString(row.tray, 'action') as SimpleOwnerAskRecord['tray'],
    mouth: asString(row.mouth, 'type') as SimpleOwnerAskRecord['mouth'],
    slug: row.slug == null ? null : asString(row.slug),
    headline: asString(row.headline),
    facts: asJson(row.facts, []),
    coachTomorrow: asString(row.coach_tomorrow),
    needs: asString(row.needs),
    sourceTags: asJson(row.source_tags, []),
    inventedClose: false,
    sampleDollars: 'none-verified',
    verifiedClose: false,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : asString(row.created_at),
  };
}
