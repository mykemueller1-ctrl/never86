import {
  SUPPORTED_MIME_TYPES,
  type IntakeKind,
  type SupportedMimeType,
} from './types';

const PDF = [0x25, 0x50, 0x44, 0x46];
const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47];

function startsWith(bytes: Uint8Array, magic: number[]): boolean {
  return magic.length <= bytes.length && magic.every((b, i) => bytes[i] === b);
}

function asciiAt(bytes: Uint8Array, offset: number, length: number): string {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

export function detectMime(
  bytes: Uint8Array,
  _declaredMime: string,
  _filename: string,
): SupportedMimeType | 'unsupported' {
  if (startsWith(bytes, PDF)) return 'application/pdf';
  if (startsWith(bytes, JPEG)) return 'image/jpeg';
  if (startsWith(bytes, PNG)) return 'image/png';
  if (bytes.length >= 12 && asciiAt(bytes, 4, 4) === 'ftyp') {
    const brand = asciiAt(bytes, 8, 4).toLowerCase();
    if (['heic', 'heix', 'hevc', 'hevx'].includes(brand)) return 'image/heic';
    if (['heif', 'mif1', 'msf1'].includes(brand)) return 'image/heif';
  }

  const declared = _declaredMime.toLowerCase().trim();
  if (bytes.length === 0 && (SUPPORTED_MIME_TYPES as readonly string[]).includes(declared)) {
    if (declared === 'image/jpg') return 'image/jpeg';
    return declared as SupportedMimeType;
  }

  return 'unsupported';
}

export function classifyIntakeKind(input: {
  mimeType: SupportedMimeType | 'unsupported';
  filename: string;
  nativeText: string;
}): IntakeKind {
  if (input.mimeType === 'unsupported') return 'unclassified';
  if (input.mimeType !== 'application/pdf') return 'photo-receipt';

  const blob = `${input.filename}\n${input.nativeText}`.toLowerCase();
  if (blob.includes('invoice')) return 'invoice';
  if (blob.includes('z-report') || blob.includes('pos close') || blob.includes('netsales')) {
    return 'pos-close';
  }
  if (
    blob.includes('doordash') ||
    blob.includes('uber eats') ||
    blob.includes('grubhub') ||
    blob.includes('marketplace')
  ) {
    return 'marketplace-statement';
  }
  return 'unclassified';
}

export function defaultRequiredFields(kind: IntakeKind): string[] {
  switch (kind) {
    case 'invoice':
      return ['InvoiceNumber', 'InvoiceDate', 'InvoiceTotal'];
    case 'pos-close':
      return ['BusinessDate', 'NetSales'];
    case 'marketplace-statement':
      return ['Platform', 'PeriodStart', 'PeriodEnd', 'EligibleSales'];
    default:
      return [];
  }
}
