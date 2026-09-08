/**
 * CoS wave lock for CTAP papers-in.
 *
 * Draft this PR: PDQ Wave 0 (mornings) → Hy-Vee Wave 0b (liquor).
 * Humes is a later wave. Not Humes-first. Seat 2 / BOH / PFG day-before
 * is not required for Hy-Vee (bar-manager email path).
 *
 * Docs hub Verified cadence (coach / Missing only — no new parsers):
 * Hy-Vee Monday owner-email order; M/W/F photo. Fort Dodge beer Tuesday.
 * PFG + NL + Humes Tue/Fri. Humes AP = company AP inbox; vendor invoices
 * also use the primary vendor-AP inbox. Do not print mailboxes or names.
 *
 * Desk copy names lanes and roles, not mailboxes or staff names.
 */

import { PDQ_INGEST_PRIMARY_EMAIL, PDQ_INGEST_SECONDARY_EMAIL } from '@/lib/pdqIngest';

export const CTAP_PAPERS_WAVES = [
  {
    id: 'pdq-morning',
    wave: '0',
    status: 'drafting',
    pos: 'pdq',
  },
  {
    id: 'hyvee-liquor',
    wave: '0b',
    status: 'drafting',
    pos: 'hy-vee',
  },
] as const;

export const HUMES_LATER_WAVE = {
  id: 'humes',
  wave: 'later',
  status: 'hook',
  days: ['Tue', 'Fri'] as const,
  apInboxLane: 'company-ap' as const,
  vendorInvoiceInboxLane: 'primary-vendor-ap' as const,
  photoOcrBackup: true,
  thisDraft: false,
};

export const HYVEE_MONDAY_CONFIRMED = {
  lock: 'one-check',
  covers: 'that week’s yellow slips + delivery invoice batch',
  defaultGuess: false,
} as const;

/** Roles, not names, on the desk. Monday = owner-email order. M/W/F = photo. */
export const HYVEE_CAPTURE = {
  mondayOrder: 'owner-email',
  photoDays: ['Mon', 'Wed', 'Fri'] as const,
} as const;

export const BOH_SEAT2 = {
  role: 'boh-seat-2',
  laterWork: 'pfg-day-before',
  requiredForHyvee: false,
  hyveePath: 'bar-manager-email',
} as const;

export function ctapPapersWaveOrder(): readonly string[] {
  return CTAP_PAPERS_WAVES.map((row) => row.id);
}

export function humesIsThisDraft(): boolean {
  return HUMES_LATER_WAVE.thisDraft;
}

export function bohSeat2RequiredForHyvee(): boolean {
  return BOH_SEAT2.requiredForHyvee;
}

export function pdqSalesPrimaryInbox(): string {
  return PDQ_INGEST_PRIMARY_EMAIL;
}

export function humesApInboxLane(): 'company-ap' {
  return HUMES_LATER_WAVE.apInboxLane;
}

/** Company AP inbox — tests only. Do not print on desk copy. */
export function humesApInboxForTests(): string {
  return 'myke@n86.app';
}

/** Primary vendor-invoice AP inbox — tests only. Do not print on desk copy. */
export function vendorInvoiceApInboxForTests(): string {
  return PDQ_INGEST_SECONDARY_EMAIL;
}
