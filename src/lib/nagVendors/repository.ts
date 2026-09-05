import { neon } from '@neondatabase/serverless';
import type { NagVendorPhotoRecord, NagVendorRecord, NagVendorRepository } from './types';

export function createMemoryRepository(): NagVendorRepository & {
  vendors: NagVendorRecord[];
  photos: NagVendorPhotoRecord[];
} {
  const vendors: NagVendorRecord[] = [];
  const photos: NagVendorPhotoRecord[] = [];
  return {
    vendors,
    photos,
    async insertVendor(row) {
      vendors.push(row);
      return row;
    },
    async listVendors(operatorId) {
      return vendors.filter((row) => row.operatorId === operatorId);
    },
    async getVendor(operatorId, vendorId) {
      return vendors.find((row) => row.operatorId === operatorId && row.id === vendorId) ?? null;
    },
    async insertPhoto(row) {
      photos.push(row);
      return row;
    },
    async listPhotos(operatorId, vendorId) {
      return photos.filter((row) => row.operatorId === operatorId && row.vendorId === vendorId);
    },
  };
}

export async function ensureNagVendorSchema(databaseUrl: string): Promise<void> {
  const sql = neon(databaseUrl);
  await sql`
    create table if not exists nag_vendors (
      id text primary key,
      operator_id text not null,
      name text not null,
      category text not null,
      contact_name text,
      contact_phone text,
      contact_email text,
      notes text,
      created_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists nag_vendors_operator_idx on nag_vendors (operator_id, created_at desc)`;
  await sql`
    create table if not exists nag_vendor_photos (
      id text primary key,
      operator_id text not null,
      vendor_id text not null,
      filename text not null,
      content_type text not null,
      byte_length integer not null,
      object_key text not null,
      storage_backend text not null,
      source_tags jsonb not null default '[]'::jsonb,
      created_at timestamptz not null default now()
    )
  `;
  await sql`create index if not exists nag_vendor_photos_vendor_idx on nag_vendor_photos (vendor_id, created_at desc)`;
  await sql`create index if not exists nag_vendor_photos_operator_idx on nag_vendor_photos (operator_id)`;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNullableString(value: unknown): string | null {
  return value == null ? null : asString(value);
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

function mapVendor(row: Record<string, unknown>): NagVendorRecord {
  return {
    id: asString(row.id),
    operatorId: asString(row.operator_id),
    name: asString(row.name),
    category: asString(row.category, 'food') as NagVendorRecord['category'],
    contactName: asNullableString(row.contact_name),
    contactPhone: asNullableString(row.contact_phone),
    contactEmail: asNullableString(row.contact_email),
    notes: asNullableString(row.notes),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : asString(row.created_at),
  };
}

function mapPhoto(row: Record<string, unknown>): NagVendorPhotoRecord {
  return {
    id: asString(row.id),
    operatorId: asString(row.operator_id),
    vendorId: asString(row.vendor_id),
    filename: asString(row.filename),
    contentType: asString(row.content_type),
    byteLength: Number(row.byte_length ?? 0),
    objectKey: asString(row.object_key),
    storageBackend: asString(row.storage_backend, 'memory') as NagVendorPhotoRecord['storageBackend'],
    sourceTags: asJson(row.source_tags, []),
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : asString(row.created_at),
  };
}

export function createNeonRepository(databaseUrl: string): NagVendorRepository {
  const sql = neon(databaseUrl);
  return {
    async insertVendor(row) {
      await ensureNagVendorSchema(databaseUrl);
      await sql`
        insert into nag_vendors (
          id, operator_id, name, category, contact_name, contact_phone, contact_email, notes, created_at
        ) values (
          ${row.id}, ${row.operatorId}, ${row.name}, ${row.category}, ${row.contactName},
          ${row.contactPhone}, ${row.contactEmail}, ${row.notes}, ${row.createdAt}
        )
      `;
      return row;
    },
    async listVendors(operatorId) {
      await ensureNagVendorSchema(databaseUrl);
      const rows = await sql`
        select id, operator_id, name, category, contact_name, contact_phone, contact_email, notes, created_at
        from nag_vendors
        where operator_id = ${operatorId}
        order by created_at asc
      `;
      return (rows as Record<string, unknown>[]).map(mapVendor);
    },
    async getVendor(operatorId, vendorId) {
      await ensureNagVendorSchema(databaseUrl);
      const rows = await sql`
        select id, operator_id, name, category, contact_name, contact_phone, contact_email, notes, created_at
        from nag_vendors
        where operator_id = ${operatorId} and id = ${vendorId}
        limit 1
      `;
      const row = (rows as Record<string, unknown>[])[0];
      return row ? mapVendor(row) : null;
    },
    async insertPhoto(row) {
      await ensureNagVendorSchema(databaseUrl);
      await sql`
        insert into nag_vendor_photos (
          id, operator_id, vendor_id, filename, content_type, byte_length,
          object_key, storage_backend, source_tags, created_at
        ) values (
          ${row.id}, ${row.operatorId}, ${row.vendorId}, ${row.filename}, ${row.contentType},
          ${row.byteLength}, ${row.objectKey}, ${row.storageBackend},
          ${JSON.stringify(row.sourceTags)}::jsonb, ${row.createdAt}
        )
      `;
      return row;
    },
    async listPhotos(operatorId, vendorId) {
      await ensureNagVendorSchema(databaseUrl);
      const rows = await sql`
        select id, operator_id, vendor_id, filename, content_type, byte_length,
               object_key, storage_backend, source_tags, created_at
        from nag_vendor_photos
        where operator_id = ${operatorId} and vendor_id = ${vendorId}
        order by created_at asc
      `;
      return (rows as Record<string, unknown>[]).map(mapPhoto);
    },
  };
}
