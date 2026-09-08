/**
 * CTAP PDQ ingest lanes (CoS lock).
 *
 * Primary inbox gets the fuller EOD pack. Secondary CC is often ZReport-only.
 * Desk copy names the lane, not the mailbox, on public answers.
 */

import { CTAP_SEAT1_EMAIL_DEFAULT } from '@/lib/ctapSeat1';

export const PDQ_INGEST_PRIMARY_EMAIL = 'mykemueller1@gmail.com';
export const PDQ_INGEST_SECONDARY_EMAIL = CTAP_SEAT1_EMAIL_DEFAULT;

export type PdqIngestLane = 'primary' | 'secondary' | 'unknown';

export function detectPdqIngestLane(text: string, filename = ''): PdqIngestLane {
  const hay = `${filename}\n${text}`.toLowerCase();
  const primary = PDQ_INGEST_PRIMARY_EMAIL.toLowerCase();
  const secondary = PDQ_INGEST_SECONDARY_EMAIL.toLowerCase();
  const hasPrimary = hay.includes(primary);
  const hasSecondary = hay.includes(secondary);
  if (hasPrimary) return 'primary';
  if (hasSecondary) return 'secondary';
  return 'unknown';
}

export function pdqIngestLaneRank(lane: PdqIngestLane | undefined): number {
  if (lane === 'primary') return 2;
  if (lane === 'unknown') return 1;
  return 0;
}

export function pdqIngestLaneLabel(lane: PdqIngestLane | undefined): string {
  if (lane === 'primary') return 'primary inbox (fuller EOD)';
  if (lane === 'secondary') return 'secondary CC (often ZReport-only)';
  return 'unlabeled inbox';
}
