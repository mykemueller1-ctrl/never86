/**
 * Invoice identity = invoice number.
 * Same vendor + same total twice = red-flag review candidate, not a proven duplicate.
 * Never invent a total. Never call anyone a thief.
 */

export type InvoiceIdentityInput = {
  id?: string;
  vendor?: string | null;
  invoiceNumber?: string | null;
  totalCents?: number | null;
  filename?: string;
};

export type InvoiceIdentityFlag =
  | 'identity'
  | 'vendor-total';

export type InvoiceIdentityHit = {
  flag: InvoiceIdentityFlag;
  key: string;
  ids: string[];
  invoiceNumber: string | null;
  vendor: string | null;
  totalCents: number | null;
  review: 'candidate';
  provenDuplicate: false;
  message: string;
};

export function normalizeInvoiceNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/^#/, '').replace(/\s+/g, '').toUpperCase();
  if (trimmed.length < 3) return null;
  if (!/^[A-Z0-9][A-Z0-9._-]*$/.test(trimmed)) return null;
  return trimmed;
}

export function normalizeVendorKey(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const key = raw.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
  return key || null;
}

export function invoiceIdentityKey(invoiceNumber: string | null | undefined): string | null {
  const normalized = normalizeInvoiceNumber(invoiceNumber);
  return normalized ? `inv#:${normalized}` : null;
}

export function vendorTotalKey(
  vendor: string | null | undefined,
  totalCents: number | null | undefined,
): string | null {
  const vendorKey = normalizeVendorKey(vendor);
  if (!vendorKey) return null;
  if (totalCents == null || !Number.isInteger(totalCents) || totalCents <= 0) return null;
  return `vendor+total:${vendorKey}:${totalCents}`;
}

/** Labeled document total only. Does not sum line items. */
export function parseLabeledInvoiceTotalCents(text: string): number | null {
  const labeled =
    text.match(/(?:grand\s*)?total\s*[:#]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i) ??
    text.match(/amount\s*due\s*[:#]?\s*\$?\s*([\d,]+(?:\.\d{2})?)/i);
  if (!labeled?.[1]) return null;
  const n = Number(labeled[1].replace(/,/g, ''));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n * 100);
}

export function flagInvoiceDuplicates(records: readonly InvoiceIdentityInput[]): InvoiceIdentityHit[] {
  const byIdentity = new Map<string, InvoiceIdentityInput[]>();
  const byVendorTotal = new Map<string, InvoiceIdentityInput[]>();

  for (const row of records) {
    const identity = invoiceIdentityKey(row.invoiceNumber);
    if (identity) {
      const list = byIdentity.get(identity) ?? [];
      list.push(row);
      byIdentity.set(identity, list);
    }
    const collision = vendorTotalKey(row.vendor, row.totalCents);
    if (collision) {
      const list = byVendorTotal.get(collision) ?? [];
      list.push(row);
      byVendorTotal.set(collision, list);
    }
  }

  const hits: InvoiceIdentityHit[] = [];

  for (const [key, rows] of byIdentity) {
    if (rows.length < 2) continue;
    hits.push({
      flag: 'identity',
      key,
      ids: rows.map((row, index) => row.id ?? row.filename ?? `row-${index}`),
      invoiceNumber: normalizeInvoiceNumber(rows[0]?.invoiceNumber) ,
      vendor: rows[0]?.vendor ?? null,
      totalCents: rows[0]?.totalCents ?? null,
      review: 'candidate',
      provenDuplicate: false,
      message: `Same invoice number ${normalizeInvoiceNumber(rows[0]?.invoiceNumber)} landed twice. Review candidate — not a proven duplicate.`,
    });
  }

  for (const [key, rows] of byVendorTotal) {
    const numbers = new Set(rows.map((row) => normalizeInvoiceNumber(row.invoiceNumber)).filter(Boolean));
    if (rows.length < 2) continue;
    if (numbers.size === 1 && rows.every((row) => normalizeInvoiceNumber(row.invoiceNumber))) continue;
    hits.push({
      flag: 'vendor-total',
      key,
      ids: rows.map((row, index) => row.id ?? row.filename ?? `row-${index}`),
      invoiceNumber: null,
      vendor: rows[0]?.vendor ?? null,
      totalCents: rows[0]?.totalCents ?? null,
      review: 'candidate',
      provenDuplicate: false,
      message: `Same vendor and same total landed twice. Red flag for review — not proof they double-billed.`,
    });
  }

  return hits;
}

export function invoiceIdentityFromTags(sourceTags: readonly { source: string }[]): InvoiceIdentityInput {
  const idTag = sourceTags.find((tag) => tag.source.startsWith('invoice-id:'));
  const vendorTotal = sourceTags.find((tag) => tag.source.startsWith('invoice-vendor-total:'));
  const [, vendor, totalRaw] = vendorTotal?.source.match(/^invoice-vendor-total:([^:]+):(\d+)$/) ?? [];
  return {
    invoiceNumber: idTag?.source.slice('invoice-id:'.length) || null,
    vendor: vendor || null,
    totalCents: totalRaw ? Number(totalRaw) : null,
  };
}
