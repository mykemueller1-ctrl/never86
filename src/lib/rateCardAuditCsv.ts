// Rate Card Audit — contract rule versus statement charge.
// Both sources required. Missing contract or fee base stays unresolved.
// A variance is not an overcharge, breach, or recovery claim.

import { parseCsv, findColumn, num, type CsvAnalysisError } from './csv/core';

/** DoorDash evidence-ladder tolerance, in dollars. */
export const RATE_CARD_TOLERANCE_DOLLARS = 0.02;

export type RateCardAuditStatus = 'clean' | 'variance-review' | 'unresolved';

export type RateCardAuditRow = {
  store: string;
  platform: string;
  period: string;
  eligibleSales: number | null;
  contractRatePct: number | null;
  expectedCharge: number | null;
  observedCharge: number | null;
  difference: number | null;
  status: RateCardAuditStatus;
  sourceStatus: 'unverified' | 'missingEvidence';
  claimBoundary: string;
  missingEvidence: string[];
};

export type RateCardAuditCsv = {
  rowsParsed: number;
  toleranceDollars: typeof RATE_CARD_TOLERANCE_DOLLARS;
  formula: 'expectedCharge = eligibleSales * (contractRatePct / 100)';
  rows: RateCardAuditRow[];
  portalLoginRequired: false;
};

const CLAIM_BOUNDARY =
  'A contract-versus-statement difference is a review packet, not an overcharge, breach, theft, or recoverable-cash claim.';

function presentFlag(value: string | undefined): boolean {
  if (!value) return false;
  const t = value.trim().toLowerCase();
  return t === 'yes' || t === 'y' || t === 'true' || t === '1';
}

export function runRateCardAudit(csv: string): RateCardAuditCsv | CsvAnalysisError {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length || !rows.length) {
    return { ok: false, error: 'CSV looked empty', hint: 'Rate-card + statement CSV with a header row is required. No portal login.' };
  }

  const iStore = findColumn(headers, ['Store', 'Location', 'LocationName', 'Site']);
  const iPlatform = findColumn(headers, ['Platform', 'Marketplace', 'Partner']);
  const iPeriod = findColumn(headers, ['Period', 'StatementPeriod', 'Month']);
  const iEligible = findColumn(headers, ['EligibleSales', 'FeeBase', 'Subtotal']);
  const iRate = findColumn(headers, ['ContractRatePct', 'ContractRate', 'RatePct', 'Rate']);
  const iObserved = findColumn(headers, ['ObservedCharge', 'Commission', 'StatementCharge', 'Charge']);
  const iFeeBase = findColumn(headers, ['FeeBasePresent', 'FeeBase']);
  const iContract = findColumn(headers, ['ContractPresent', 'AgreementPresent', 'RateCardPresent']);

  const missing: string[] = [];
  if (iEligible < 0) missing.push('Eligible Sales / Fee Base');
  if (iObserved < 0) missing.push('Observed Charge');
  if (missing.length) {
    return {
      ok: false,
      error: `Couldn't find required columns: ${missing.join(', ')}`,
      hint: 'Need Eligible Sales and Observed Charge. Contract Rate %, Contract Present, and Fee Base Present decide whether the test can run.',
      detectedColumns: headers,
    };
  }

  const out: RateCardAuditRow[] = [];
  for (const r of rows) {
    const store = iStore >= 0 ? (r[iStore] || '').trim() : '';
    const platform = iPlatform >= 0 ? (r[iPlatform] || '').trim() : '';
    if (!store && !platform && !String(r[iEligible] || '').trim()) continue;

    const contractPresent = iContract < 0 ? Boolean(iRate >= 0 && String(r[iRate] || '').trim()) : presentFlag(r[iContract]);
    const feeBasePresent = iFeeBase < 0 ? Boolean(String(r[iEligible] || '').trim()) : presentFlag(r[iFeeBase]);
    const eligibleSales = String(r[iEligible] || '').trim() ? num(r[iEligible]) : null;
    const contractRatePct = iRate >= 0 && String(r[iRate] || '').trim() ? num(r[iRate]) : null;
    const observedCharge = String(r[iObserved] || '').trim() ? num(r[iObserved]) : null;

    const gaps: string[] = [];
    if (!contractPresent || contractRatePct == null) gaps.push('Signed or current rate card for this store and period.');
    if (!feeBasePresent || eligibleSales == null || eligibleSales <= 0) {
      gaps.push('Governing eligible-sales / fee-base figure used by the statement.');
    }
    if (observedCharge == null) gaps.push('Statement charge line for the same store and period.');

    if (gaps.length) {
      out.push({
        store,
        platform,
        period: iPeriod >= 0 ? (r[iPeriod] || '').trim() : '',
        eligibleSales,
        contractRatePct,
        expectedCharge: null,
        observedCharge,
        difference: null,
        status: 'unresolved',
        sourceStatus: 'missingEvidence',
        claimBoundary: CLAIM_BOUNDARY,
        missingEvidence: gaps,
      });
      continue;
    }

    const expectedCharge = (eligibleSales as number) * ((contractRatePct as number) / 100);
    const difference = (observedCharge as number) - expectedCharge;
    const clean = Math.abs(difference) <= RATE_CARD_TOLERANCE_DOLLARS;

    out.push({
      store,
      platform,
      period: iPeriod >= 0 ? (r[iPeriod] || '').trim() : '',
      eligibleSales,
      contractRatePct,
      expectedCharge,
      observedCharge,
      difference,
      status: clean ? 'clean' : 'variance-review',
      sourceStatus: 'unverified',
      claimBoundary: CLAIM_BOUNDARY,
      missingEvidence: [
        'Original agreement page showing the rate and fee base.',
        'Finalized statement calculation for the same identifiers.',
      ],
    });
  }

  if (!out.length) {
    return {
      ok: false,
      error: 'No rate-card rows after parsing',
      hint: 'Each row needs a store or platform plus Eligible Sales and Observed Charge.',
      detectedColumns: headers,
    };
  }

  return {
    rowsParsed: out.length,
    toleranceDollars: RATE_CARD_TOLERANCE_DOLLARS,
    formula: 'expectedCharge = eligibleSales * (contractRatePct / 100)',
    rows: out,
    portalLoginRequired: false,
  };
}
