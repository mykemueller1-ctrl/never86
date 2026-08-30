// 3P Fee Finder — CSV-first statement math.
// Uses the public Quick Win formulas only. A statement is not a contract
// test, bank receipt, or overcharge claim.

import { parseCsv, findColumn, num, type CsvAnalysisError } from './csv/core';
import { calculateMarketplaceCost } from './marketplaceCost';

export const THREE_P_QUICK_WIN_FORMULA = {
  documentedDeductions:
    'commission + merchantFees + restaurantFundedPromotionsAndAds + refundsErrorChargesAndAdjustments + otherDocumentedDeductions - supportedCredits',
  observedMarketplaceCostPct: 'documentedDeductions / eligibleSales * 100',
  expectedPayout: 'eligibleSales - documentedDeductions',
  payoutVariance: 'reportedPayout - expectedPayout',
} as const;

export type ThreePFeeRow = {
  store: string;
  platform: string;
  period: string;
  eligibleSales: number;
  commission: number;
  merchantFees: number;
  restaurantFundedPromotionsAds: number;
  refundsAdjustments: number;
  otherDeductions: number;
  credits: number;
  reportedPayout: number | null;
  documentedDeductions: number;
  observedMarketplaceCostPct: number;
  expectedPayout: number;
  payoutVariance: number | null;
  sourceStatus: 'unverified';
  claimBoundary: string;
  missingEvidence: string[];
};

export type ThreePFeeFinderCsv = {
  rowsParsed: number;
  formula: typeof THREE_P_QUICK_WIN_FORMULA;
  rows: ThreePFeeRow[];
  portalLoginRequired: false;
};

const CLAIM_BOUNDARY =
  'Statement math is observed cost and payout variance only. It is not a contract test, bank receipt, theft finding, or guaranteed recovery.';

export function runThreePFeeFinder(csv: string): ThreePFeeFinderCsv | CsvAnalysisError {
  const { headers, rows } = parseCsv(csv);
  if (!headers.length || !rows.length) {
    return { ok: false, error: 'CSV looked empty', hint: 'Marketplace statement CSV with a header row is required. No portal login.' };
  }

  const iStore = findColumn(headers, ['Store', 'Location', 'LocationName', 'Site']);
  const iPlatform = findColumn(headers, ['Platform', 'Marketplace', 'Partner', 'Channel']);
  const iPeriod = findColumn(headers, ['Period', 'StatementPeriod', 'Month']);
  const iEligible = findColumn(headers, ['EligibleSales', 'Subtotal', 'FeeBase', 'Sales']);
  const iCommission = findColumn(headers, ['Commission']);
  const iFees = findColumn(headers, ['MerchantFees', 'Fees', 'FeeTax']);
  const iPromos = findColumn(headers, ['RestaurantFundedPromotionsAds', 'Promotions', 'MarketingFees', 'Ads']);
  const iRefunds = findColumn(headers, ['RefundsAdjustments', 'Refunds', 'ErrorCharges', 'Adjustments']);
  const iOther = findColumn(headers, ['OtherDeductions', 'OtherFees', 'Other']);
  const iCredits = findColumn(headers, ['Credits', 'SupportedCredits']);
  const iPayout = findColumn(headers, ['ReportedPayout', 'NetTotal', 'Payout']);

  const missing: string[] = [];
  if (iEligible < 0) missing.push('Eligible Sales / Subtotal');
  if (iCommission < 0) missing.push('Commission');
  if (iFees < 0) missing.push('Merchant Fees');
  if (iPromos < 0) missing.push('Restaurant-funded promotions/ads');
  if (iRefunds < 0) missing.push('Refunds / adjustments');
  if (iOther < 0) missing.push('Other deductions');
  if (iCredits < 0) missing.push('Credits');
  if (missing.length) {
    return {
      ok: false,
      error: `Couldn't find required columns: ${missing.join(', ')}`,
      hint: 'Need Eligible Sales, Commission, Merchant Fees, restaurant-funded promotions/ads, refunds/adjustments, other deductions, and credits. Reported payout is optional.',
      detectedColumns: headers,
    };
  }

  const out: ThreePFeeRow[] = [];
  for (const r of rows) {
    const eligibleSales = num(r[iEligible]);
    if (eligibleSales <= 0) continue;
    const reportedRaw = iPayout >= 0 ? r[iPayout] : undefined;
    const reportedPayout = reportedRaw != null && String(reportedRaw).trim() !== '' ? num(reportedRaw) : null;
    const input = {
      eligibleSales,
      commission: num(r[iCommission]),
      merchantFees: num(r[iFees]),
      promotions: num(r[iPromos]),
      refundsAdjustments: num(r[iRefunds]),
      otherFees: num(r[iOther]),
      credits: num(r[iCredits]),
      ...(reportedPayout != null ? { reportedPayout } : {}),
    };
    const math = calculateMarketplaceCost(input);
    if (!math) continue;

    const missingEvidence = [
      'Finalized marketplace statement for the same store and period.',
      'Contract or rate card only if testing the agreement.',
      'Matching payout detail and bank deposit before any cash-receipt claim.',
    ];

    out.push({
      store: iStore >= 0 ? (r[iStore] || '').trim() : '',
      platform: iPlatform >= 0 ? (r[iPlatform] || '').trim() : '',
      period: iPeriod >= 0 ? (r[iPeriod] || '').trim() : '',
      eligibleSales,
      commission: input.commission,
      merchantFees: input.merchantFees,
      restaurantFundedPromotionsAds: input.promotions,
      refundsAdjustments: input.refundsAdjustments,
      otherDeductions: input.otherFees,
      credits: input.credits,
      reportedPayout,
      documentedDeductions: math.documentedDeductions,
      observedMarketplaceCostPct: math.effectiveMarketplaceCostPct,
      expectedPayout: math.expectedPayout,
      payoutVariance: math.payoutVariance,
      sourceStatus: 'unverified',
      claimBoundary: CLAIM_BOUNDARY,
      missingEvidence,
    });
  }

  if (!out.length) {
    return {
      ok: false,
      error: 'No statement rows with eligible sales greater than zero',
      hint: 'Each row needs a positive Eligible Sales / Subtotal figure from the finalized statement.',
      detectedColumns: headers,
    };
  }

  return {
    rowsParsed: out.length,
    formula: THREE_P_QUICK_WIN_FORMULA,
    rows: out,
    portalLoginRequired: false,
  };
}
