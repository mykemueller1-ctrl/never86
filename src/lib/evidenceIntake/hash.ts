import { createHash } from 'node:crypto';
import type { IntakePageInput } from './types';

export function sha256Hex(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function orderedPageBytes(pages: IntakePageInput[]): Uint8Array {
  const ordered = [...pages].sort((a, b) => a.pageIndex - b.pageIndex);
  const parts = ordered.map((page) => {
    const prefix = Buffer.alloc(8);
    prefix.writeUInt32BE(page.pageIndex, 0);
    prefix.writeUInt32BE(page.bytes.length, 4);
    return Buffer.concat([prefix, Buffer.from(page.bytes)]);
  });
  return new Uint8Array(Buffer.concat(parts));
}

export function contentBytes(input: { bytes: Uint8Array; pages?: IntakePageInput[] }): Uint8Array {
  if (input.pages && input.pages.length > 0) return orderedPageBytes(input.pages);
  return input.bytes;
}

export function rawObjectPointer(tenantId: string, storeId: string, contentSha256: string): string {
  return `raw://tenant/${encodeURIComponent(tenantId)}/store/${encodeURIComponent(storeId)}/sha256/${contentSha256}`;
}

export function dedupeKey(tenantId: string, storeId: string, contentSha256: string): string {
  return `${tenantId}\0${storeId}\0${contentSha256}`;
}
