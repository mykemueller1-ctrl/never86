/**
 * One-tap Google papers scan. Read-only. No invented dollars.
 * Verified = read from labeled document text.
 * Estimated = inferred, or a low-confidence read.
 * Missing = the paper did not say it. Missing is not $0.
 */

import { PAPERS_GOOGLE_SCOPES } from '@/lib/papersInbox';

export const PAPERS_SCAN_LOOKBACK_DAYS = 90;
export const PAPERS_SCAN_MAX_BYTES = 8 * 1024 * 1024;
export const PAPERS_SCAN_MAX_GMAIL_MESSAGES = 40;
export const PAPERS_SCAN_MAX_DRIVE_FILES = 40;

export const PAPERS_SCAN_CATEGORIES = [
  { id: 'eod-z', label: 'EOD / Z reports' },
  { id: 'vendor-invoice', label: 'Vendor invoices' },
  { id: 'labor', label: 'Labor / timesheets' },
  { id: 'liquor-beer', label: 'Liquor & beer deliveries' },
  { id: 'delivery-app', label: 'Delivery-app statements' },
  { id: 'menu-recipe', label: 'Menu / recipe docs' },
] as const;

export type PapersScanCategory = (typeof PAPERS_SCAN_CATEGORIES)[number]['id'];

export type PapersFieldHonesty = 'Verified' | 'Estimated' | 'Missing';

export type PapersLabeledField = {
  honesty: PapersFieldHonesty;
  value: string | null;
  amount: number | null;
  note: string | null;
};

export type PapersLineItem = {
  sku: PapersLabeledField;
  description: PapersLabeledField;
  quantity: PapersLabeledField;
  unit: PapersLabeledField;
  unitPrice: PapersLabeledField;
  extendedPrice: PapersLabeledField;
  category: PapersLabeledField;
};

export type PapersShift = {
  employee: PapersLabeledField;
  hours: PapersLabeledField;
};

export type PapersDeliveryFields = {
  platform: PapersLabeledField;
  gross: PapersLabeledField;
  fees: PapersLabeledField;
  net: PapersLabeledField;
};

export type PapersScanCandidate = {
  source: 'gmail' | 'drive';
  externalId: string;
  filename: string;
  subject?: string;
  bytes?: Uint8Array;
  byteLength?: number;
  skip?: 'oversize';
};

export type PapersScanRow = {
  id: string;
  dedupeKey: string;
  source: 'gmail' | 'drive';
  externalId: string;
  contentHash: string;
  filename: string;
  subject: string;
  category: PapersScanCategory;
  categoryHonesty: PapersFieldHonesty;
  vendorName: PapersLabeledField;
  invoiceNumber: PapersLabeledField;
  dates: PapersLabeledField;
  total: PapersLabeledField;
  lineItems: PapersLineItem[];
  isoWeek: string | null;
  shifts: PapersShift[];
  delivery: PapersDeliveryFields;
  confirmed: boolean;
  fixture: boolean;
  note: string;
};

export type PapersScanJobState = {
  id: string;
  operatorId: string;
  status: 'queued' | 'running' | 'done' | 'failed';
  phase: 'queued' | 'gmail' | 'drive' | 'done';
  scanned: number;
  kept: number;
  skipped: number;
  deduped: number;
  lookbackDays: number;
  maxBytes: number;
  gmail: 'read' | 'missing';
  drive: 'read' | 'missing';
  error: string | null;
  startedAt: string;
  updatedAt: string;
};

export function papersCategoryLabel(id: PapersScanCategory): string {
  return PAPERS_SCAN_CATEGORIES.find((row) => row.id === id)?.label ?? id;
}

export function missingField(): PapersLabeledField {
  return { honesty: 'Missing', value: null, amount: null, note: null };
}

export function textField(
  value: string,
  honesty: Exclude<PapersFieldHonesty, 'Missing'>,
  note: string | null = null,
): PapersLabeledField {
  return { honesty, value, amount: null, note };
}

export function formatPapersMoney(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(amount);
  const [dollars, cents] = abs.toFixed(2).split('.');
  const withCommas = dollars.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}$${withCommas}.${cents}`;
}

export function amountField(
  amount: number,
  honesty: Exclude<PapersFieldHonesty, 'Missing'>,
  note: string | null = null,
): PapersLabeledField {
  return { honesty, value: formatPapersMoney(amount), amount, note };
}

/** Parse a money token that was already pulled off a labeled line. Bare integers are not money. */
export function parsePapersMoney(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const neg = /^\(.*\)$/.test(trimmed) || trimmed.startsWith('-');
  const cleaned = trimmed.replace(/[$,\s()~≈]/g, '').replace(/approx\.?|est\.?/gi, '');
  if (!/^\d+\.\d{1,2}$/.test(cleaned)) return null;
  const amount = Number(cleaned);
  if (!Number.isFinite(amount)) return null;
  const signed = neg ? -amount : amount;
  return Math.round(signed * 100) / 100;
}

export function emptyDelivery(): PapersDeliveryFields {
  return {
    platform: missingField(),
    gross: missingField(),
    fees: missingField(),
    net: missingField(),
  };
}

/** OAuth stays on the existing read scopes. No send, modify, delete, label, or share. */
export function papersGoogleScopesStayReadOnly(
  scopes: readonly string[] = PAPERS_GOOGLE_SCOPES,
): boolean {
  if (!scopes.some((scope) => scope.endsWith('/auth/gmail.readonly'))) return false;
  if (!scopes.some((scope) => scope.endsWith('/auth/drive.readonly') || scope.endsWith('/auth/drive.file'))) {
    return false;
  }
  return scopes.every((scope) => {
    if (scope === 'openid' || scope === 'email') return true;
    if (scope.endsWith('/auth/gmail.readonly')) return true;
    if (scope.endsWith('/auth/drive.readonly')) return true;
    if (scope.endsWith('/auth/drive.file')) return true;
    return false;
  });
}
