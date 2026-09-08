/**
 * HARD LOCK — CTAP Seat 1 = PDQ POS only.
 *
 * Toast Wave 0 stays NAG / lab. Taco Bamba/Bomba training shapes stay
 * off this seat. Contaminant path = Fail. Never answer CTAP $ from a
 * Toast pack.
 */

import { CTAP_SEAT1_OPERATOR_ID } from '@/lib/ctapSeat1';
import { isToastTrainingCorpusOnly } from '@/lib/reportAdapters/trainingCorpus';
import {
  isCtapSeat,
  toastMayAnswerSeat as toastMayAnswerIsolatedSeat,
} from '@/lib/seatIsolation';
import type { SourceTag } from '@/lib/simpleOwnerDemo/types';
import { detectToastFamily } from '@/lib/toastParse';

const TOAST_CONTAMINANT_RE = /kristin[\s._-]*nag|new american grill|max grill|taco[\s._-]*bomb/i;

export const CTAP_SEAT1_POS = 'pdq' as const;

export const CTAP_TOAST_CONTAMINANT_FAIL =
  'Fail — CTAP Seat 1 is PDQ POS only. Toast / NAG / Taco Bamba cannot answer Community Tap dollars.';

/**
 * Legacy id check. Prefer `isCtapSeat(operatorId, restaurantName)` —
 * `seat:1000000` is the free-seat floor, not automatically Community Tap.
 */
export function isCtapSeat1Id(operatorId: string, restaurantName?: string | null): boolean {
  return isCtapSeat(operatorId, restaurantName);
}

/** Toast desk may run on NAG/lab seats only — never CTAP Seat 1. */
export function toastMayAnswerSeat(operatorId: string, restaurantName?: string | null): boolean {
  return toastMayAnswerIsolatedSeat(operatorId, restaurantName);
}

export { CTAP_SEAT1_OPERATOR_ID };

export function uploadLooksLikeToastContaminant(
  filename: string,
  sourceTags: readonly Pick<SourceTag, 'source'>[] = [],
): boolean {
  const hay = filename;
  if (isToastTrainingCorpusOnly(hay) || TOAST_CONTAMINANT_RE.test(hay)) return true;
  if (detectToastFamily(filename) != null) return true;
  return sourceTags.some((tag) => (
    tag.source.startsWith('toast-parse:')
    || tag.source.startsWith('toast:')
    || /taco[\s._-]*bomb|kristin[\s._-]*nag|new american grill/.test(tag.source)
  ));
}

export function ctapSeatHasToastContaminant(
  uploads: readonly { filename: string; sourceTags?: readonly Pick<SourceTag, 'source'>[] }[],
): boolean {
  return uploads.some((row) => uploadLooksLikeToastContaminant(row.filename, row.sourceTags ?? []));
}

export function assertNoToastPosForCtapSales(pos: string): void {
  if (pos === 'toast') {
    throw new Error(CTAP_TOAST_CONTAMINANT_FAIL);
  }
}
