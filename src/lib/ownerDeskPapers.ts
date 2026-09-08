/**
 * One-Seat papers-in helpers — multi-image, receipt, last-week family attach.
 * Operator-facing copy never says "desk". Never invents $.
 */

import type { LastWeekPrimeFamilyId } from '@/lib/lastWeekPrimeCost';
import type { OperatorV2PlateId } from '@/lib/operatorV2';

export const MAX_PAPERS_PER_DROP = 12;

export const OPERATOR_PERSIST_FACT =
  'This ask is stored on this seat. Files stay source-tagged. No invented close.';

export function collectUploadFiles(form: FormData): File[] {
  const files: File[] = [];
  for (const key of ['file', 'files']) {
    for (const value of form.getAll(key)) {
      if (value instanceof File && value.size > 0) files.push(value);
    }
  }
  return files.slice(0, MAX_PAPERS_PER_DROP);
}

export function receivedPapersLine(filenames: string[]): string {
  const named = filenames.map((name) => name.trim()).filter(Boolean);
  if (named.length === 0) return 'No paper reached this seat.';
  if (named.length === 1) return `${named[0]} is on this seat.`;
  return `Received ${named.length} papers on this seat: ${named.join(', ')}.`;
}

export function receivingPapersLine(count: number): string {
  if (count <= 1) return 'Receiving that paper…';
  return `Receiving ${count} papers…`;
}

export function folderForLastWeekFamily(id: LastWeekPrimeFamilyId): OperatorV2PlateId | undefined {
  if (id === 'labor') return 'schedule';
  if (id === 'food') return 'menu';
  if (id === 'pop' || id === 'liquor' || id === 'beer') return 'invoice-truck';
  return undefined;
}
