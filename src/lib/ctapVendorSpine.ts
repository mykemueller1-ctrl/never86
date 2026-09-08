/**
 * At-scale small-operator vendor spine — coach / Missing rhythms.
 *
 * Do not boil AP automation. Wave order UNCHANGED: PDQ Wave 0 →
 * Hy-Vee Wave 0b first. Later waves are hooks. Parse = null. No $.
 * Desk copy names roles and lanes, not mailboxes or staff names.
 */

import { CTAP_PAPERS_WAVES } from '@/lib/ctapPapersWave';
import {
  CTAP_VENDOR_CADENCE,
  missingInvoiceNudge,
  type VendorCadenceVendor,
} from '@/lib/vendorCadenceConfig';

export const CTAP_VENDOR_SCALE_RULE = {
  day1: 'one-folder-ready',
  capture: 'photo-or-email',
  dedup: 'invoice-number',
  missing: 'soft-nudge-by-rhythm',
  ocr: 'into-the-mess',
  paper: 'never-redesign',
  apAutomation: false,
} as const;

export const CTAP_VENDOR_SCALE_COPY =
  'Day-1: one folder Ready. Photo or email. Invoice-number dedup. Soft missing nudges by vendor rhythm. OCR into the mess. Never redesign the paper. Not AP automation.';

/** Cadence later-waves plus US Foods (registry hook only — not a 9th cadence row). */
export const VENDOR_SPINE_HOOK_IDS = [
  'fort-dodge-distributing',
  'humes',
  'confluence',
  'pepsi',
  'northern-lights',
  'performance-foodservice',
  'sysco',
  'us-foods',
] as const;

export const US_FOODS_SCALE_NUDGE =
  'US Foods at scale follows the same PFG pattern: day-before order must match the invoice — mismatch is short, credit, or OOS. EFT often sits on a 21-day clock; do not treat the statement pile as this week’s due. Later-wave hook. Not a Wave 0 parser.';

type SpineVendor = {
  id: string;
  label: string;
  missingNudge: string;
};

export type VendorSpineDeskAnswer = {
  slug: 'boh-invoice';
  headline: string;
  facts: string[];
  coachTomorrow: string;
  needs: string;
  verifiedClose: false;
  sampleDollars: 'none-verified';
  vendorId: string;
};

export function vendorSpineWaveOrder(): readonly string[] {
  return [...CTAP_PAPERS_WAVES.map((row) => row.id), 'vendor-spine-later'];
}

export function vendorHasVerifiedParserThisDraft(vendorId: string): boolean {
  return vendorId === 'hy-vee-wine';
}

function escapeRe(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function questionNamesVendor(question: string, vendor: VendorCadenceVendor): boolean {
  const hay = question.toLowerCase();
  return [vendor.label, vendor.id, ...vendor.aliases].some((alias) => {
    const token = alias.toLowerCase();
    if (token.length <= 3) {
      return new RegExp(`\\b${escapeRe(token)}\\b`, 'i').test(question);
    }
    return hay.includes(token);
  });
}

function looksLikeUsFoodsAsk(question: string): boolean {
  return /\bus\s*foods\b|\busfoods\b/i.test(question);
}

export function matchVendorSpine(question: string): SpineVendor | undefined {
  if (looksLikeUsFoodsAsk(question)) {
    return { id: 'us-foods', label: 'US Foods', missingNudge: US_FOODS_SCALE_NUDGE };
  }
  const named = CTAP_VENDOR_CADENCE.vendors.find((vendor) => questionNamesVendor(question, vendor));
  if (!named || vendorHasVerifiedParserThisDraft(named.id)) return undefined;
  return { id: named.id, label: named.label, missingNudge: missingInvoiceNudge(named.label) };
}

export function answerVendorSpineQuestion(question: string): VendorSpineDeskAnswer | null {
  const vendor = matchVendorSpine(question);
  if (!vendor) return null;
  return {
    slug: 'boh-invoice',
    headline: `Missing — ${vendor.label} is a later-wave rhythm this draft.`,
    facts: [
      vendor.missingNudge,
      CTAP_VENDOR_SCALE_COPY,
      'Coach / Missing only. No AP aging. No invented dollar. OCR the paper into the mess.',
    ],
    coachTomorrow: 'Snap or forward the ticket when it lands. Do not redesign the paper.',
    needs: `${vendor.label} photo or email on this seat. Parser is a later-wave hook.`,
    verifiedClose: false,
    sampleDollars: 'none-verified',
    vendorId: vendor.id,
  };
}
