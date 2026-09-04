/**
 * PDQ EOD packet contract (#118).
 *
 * One scheduled `EOD Reports` email from pdqreports@pdqpos.com should attach
 * three native PDFs for the same store and business date:
 *   - ZReport_Summary
 *   - Hourly_Sales_Report
 *   - Void_Promo_Report
 *
 * Filename `M-D-YYYY` is the business date. A Void-only message is an
 * incomplete packet. Missing Z/Hourly is Missing Evidence, not $0 sales.
 * Do not invent dollars. No POS portal password.
 */

import type { ActionShiftResult } from './actionShift';
import type { PdqHourly, PdqReportFamily, PdqVoidPromo, PdqZSummary } from './pdqEodParse';

export const REQUIRED_PDQ_EOD_FAMILIES = [
  'z-summary',
  'hourly',
  'void-promo',
] as const;

export type RequiredPdqEodFamily = (typeof REQUIRED_PDQ_EOD_FAMILIES)[number];

export const PDQ_EOD_EXPORT_PATH = [
  'PDQ scheduled EOD should attach three native PDFs in one EOD Reports email from pdqreports@pdqpos.com: ZReport_Summary, Hourly_Sales_Report, and Void_Promo_Report.',
  'If a family is missing from that message, export the native PDF from PDQ Reports for the same store and business date (Z Report / End of Day, Hourly Sales, Void Promo). Do not type dollars. No POS portal password.',
  'Forward the missing native PDFs to the operator close mailbox, or drop them on the free-seat desk. A later complete EOD email for the same date should merge, not overwrite.',
  'Operator Drive dated copies are a fallback only when the exact M-D-YYYY filename already exists. Missing Evidence is not $0.',
].join(' ');

export function pdqEodFilenamePrefix(isoDate: string): string | null {
  const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return `${Number(m[2])}-${Number(m[3])}-${m[1]}`;
}

export function expectedPdqEodFilenames(isoDate: string): Record<RequiredPdqEodFamily, string> | null {
  const prefix = pdqEodFilenamePrefix(isoDate);
  if (!prefix) return null;
  return {
    'z-summary': `${prefix} ZReport_Summary.pdf`,
    hourly: `${prefix} Hourly_Sales_Report.pdf`,
    'void-promo': `${prefix} Void_Promo_Report.pdf`,
  };
}

export function pdqFamilyLabel(family: RequiredPdqEodFamily): string {
  if (family === 'z-summary') return 'ZReport_Summary';
  if (family === 'hourly') return 'Hourly_Sales_Report';
  return 'Void_Promo_Report';
}

export function zSummaryHasFields(z: PdqZSummary): boolean {
  return z.netSales.value != null
    || z.grandTotal.value != null
    || z.mix.food.value != null
    || z.mix.beer.value != null
    || z.mix.liquor.value != null
    || z.mix.pop.value != null;
}

export function hourlyHasFields(hourly: PdqHourly): boolean {
  return hourly.rows.length > 0;
}

export function voidPromoHasFields(voids: PdqVoidPromo): boolean {
  return voids.voids.value != null || voids.promotions.value != null;
}

export function landedPdqEodFamilies(input: {
  z?: PdqZSummary;
  hourly?: PdqHourly;
  voids?: PdqVoidPromo;
}): RequiredPdqEodFamily[] {
  const landed: RequiredPdqEodFamily[] = [];
  if (input.z && zSummaryHasFields(input.z)) landed.push('z-summary');
  if (input.hourly && hourlyHasFields(input.hourly)) landed.push('hourly');
  if (input.voids && voidPromoHasFields(input.voids)) landed.push('void-promo');
  return landed;
}

export type PdqEodPacketStatus = {
  complete: boolean;
  businessDate: string | null;
  landed: RequiredPdqEodFamily[];
  missing: RequiredPdqEodFamily[];
  expectedFilenames: Record<RequiredPdqEodFamily, string> | null;
  missingEvidence: string[];
  exportPath: string;
};

export function describePdqEodPacket(input: {
  businessDate?: string | null;
  landed: readonly PdqReportFamily[];
}): PdqEodPacketStatus {
  const landed = REQUIRED_PDQ_EOD_FAMILIES.filter((family) => input.landed.includes(family));
  const missing = REQUIRED_PDQ_EOD_FAMILIES.filter((family) => !landed.includes(family));
  const expectedFilenames = input.businessDate ? expectedPdqEodFilenames(input.businessDate) : null;
  const missingEvidence = missing.map((family) => {
    const expected = expectedFilenames?.[family];
    return expected
      ? `PDQ ${pdqFamilyLabel(family)} (${expected}) for the same store and business date is Missing Evidence, not $0.`
      : `PDQ ${pdqFamilyLabel(family)} for the same store and business date is Missing Evidence, not $0.`;
  });
  if (missing.length) missingEvidence.push(PDQ_EOD_EXPORT_PATH);
  return {
    complete: missing.length === 0,
    businessDate: input.businessDate ?? null,
    landed,
    missing,
    expectedFilenames,
    missingEvidence,
    exportPath: PDQ_EOD_EXPORT_PATH,
  };
}

export function buildIncompletePdqPacketActionShift(input: {
  store: string;
  businessDate: string | null;
  landed: readonly RequiredPdqEodFamily[];
  missing: readonly RequiredPdqEodFamily[];
}): ActionShiftResult {
  const missingLabels = input.missing.map(pdqFamilyLabel).join(' and ');
  const landedLabels = input.landed.map(pdqFamilyLabel).join(', ') || 'no PDQ families';
  const expected = input.businessDate ? expectedPdqEodFilenames(input.businessDate) : null;
  const expectedMissing = input.missing
    .map((family) => expected?.[family] || pdqFamilyLabel(family))
    .join(', ');

  return {
    store: input.store,
    businessDate: input.businessDate || 'Unspecified business date',
    sourceStatus: 'unverified',
    summary: `PDQ EOD packet is incomplete (${landedLabels} landed). Action Shift stays on Missing Evidence — not a $0 night.`,
    morningActions: [{
      id: 'close-packet',
      title: 'Land the missing PDQ EOD native PDFs',
      owner: 'Closing manager',
      evidence: `This intake landed ${landedLabels}. Missing ${missingLabels}. No sales, labor, or hourly dollars were invented.`,
      move: `Export ${expectedMissing} as native PDFs from PDQ Reports for this store and business date, or forward a later complete EOD Reports email. Do not type dollars. No POS portal password.`,
      dollarsObserved: null,
      sourceStatus: 'unverified',
      claimBoundary: 'A Void_Promo_Report alone is not a close. Missing ZReport_Summary or Hourly_Sales_Report is Missing Evidence, not $0 sales and not a clean night.',
      proof: {
        object: 'Native PDQ ZReport_Summary and Hourly_Sales_Report PDFs for the same business date',
        nightCheck: 'Confirm all three EOD families are on file before ranking sales, labor, or hourly moves.',
        verbalYesCloses: false,
      },
    }],
    nightCloseCheck: [
      'Save the missing native PDQ PDFs for the same store and business date before ranking a sales move.',
    ],
    missingEvidence: describePdqEodPacket({
      businessDate: input.businessDate,
      landed: input.landed,
    }).missingEvidence,
    policy: {
      maxMorningActions: 3,
      benchmark: 'operator-supplied targets only',
      boundary: 'This tool ranks review work. It does not make theft, discipline, contract, bank-reconciliation, or guaranteed-savings claims.',
    },
  };
}
