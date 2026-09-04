import type { EvidenceKind, SourceTag } from './types';

const KIND_PATTERNS: readonly { kind: EvidenceKind; pattern: RegExp; source: string }[] = [
  { kind: 'hourly', pattern: /hourly|hour[_-\s]?sales/, source: 'operator-upload:hourly' },
  { kind: 'timeclock', pattern: /time[_-\s]?clock|timesheet|punch|clock[_-\s]?in/, source: 'operator-upload:timeclock' },
  { kind: 'schedule', pattern: /schedule|roster|labor[_-\s]?plan/, source: 'operator-upload:schedule' },
  { kind: 'z', pattern: /\bz[_-\s]?report|zreport|end[_-\s]?of[_-\s]?day|\beod\b/, source: 'operator-upload:z' },
  { kind: 'void', pattern: /void|promo[_-\s]?report/, source: 'operator-upload:void' },
  { kind: 'invoice', pattern: /invoice|vendor[_-\s]?bill/, source: 'operator-upload:invoice' },
];

export function classifyUpload(filename: string, contentType = ''): {
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
