import { isOperatorV2PlateId, plateById } from '@/lib/operatorV2';
import type { EvidenceKind, SourceTag } from './types';

const KIND_PATTERNS: readonly { kind: EvidenceKind; pattern: RegExp; source: string }[] = [
  { kind: 'hourly', pattern: /hourly|hour[_-\s]?sales/, source: 'operator-upload:hourly' },
  { kind: 'timeclock', pattern: /time[_-\s]?clock|timesheet|punch|clock[_-\s]?in|clock[_-\s]?out/, source: 'operator-upload:timeclock' },
  { kind: 'labor-cards', pattern: /labor[_-\s]?card|role[_-\s]?card|shift[_-\s]?role/, source: 'operator-upload:labor-cards' },
  { kind: 'schedule', pattern: /schedule|roster|labor[_-\s]?plan/, source: 'operator-upload:schedule' },
  { kind: 'order-guide', pattern: /order[_-\s]?guide|par[_-\s]?sheet/, source: 'operator-upload:order-guide' },
  { kind: 'menu', pattern: /\bmenu\b|plate[_-\s]?list/, source: 'operator-upload:menu' },
  { kind: 'z', pattern: /\bz[_-\s]?report|zreport|end[_-\s]?of[_-\s]?day|\beod\b/, source: 'operator-upload:z' },
  { kind: 'void', pattern: /void|promo[_-\s]?report/, source: 'operator-upload:void' },
  { kind: 'invoice', pattern: /invoice|vendor[_-\s]?bill/, source: 'operator-upload:invoice' },
];

export function classifyUpload(
  filename: string,
  contentType = '',
  folderHint?: string,
): {
  kind: EvidenceKind;
  sourceTags: SourceTag[];
} {
  const haystack = `${filename} ${contentType}`.toLowerCase();
  for (const row of KIND_PATTERNS) {
    if (row.pattern.test(haystack)) {
      return {
        kind: row.kind,
        sourceTags: [{ tag: 'unverified', source: row.source }],
      };
    }
  }

  if (folderHint && isOperatorV2PlateId(folderHint)) {
    const plate = plateById(folderHint);
    if (plate) {
      return {
        kind: plate.evidenceKind,
        sourceTags: [{ tag: 'unverified', source: `operator-upload:${plate.evidenceKind}:folder` }],
      };
    }
  }

  return {
    kind: 'other',
    sourceTags: [{ tag: 'unverified', source: 'operator-upload:other' }],
  };
}

export function safeObjectFilename(filename: string): string {
  const base = filename.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
  return (base || 'upload').slice(0, 80);
}

export function buildObjectKey(operatorId: string, filename: string, now = new Date()): string {
  const yyyy = String(now.getUTCFullYear());
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const id = crypto.randomUUID();
  const seat = operatorId.replace(/[^a-zA-Z0-9._:-]+/g, '-');
  return `simple-owner/${seat}/${yyyy}/${mm}/${id}-${safeObjectFilename(filename)}`;
}
