export type MarketplaceCostInputs = {
  eligibleSales: number;
  commission: number;
  merchantFees: number;
  promotions: number;
  refundsAdjustments: number;
  otherFees: number;
  credits: number;
  reportedPayout?: number;
};

export type MarketplaceCostResult = {
  documentedDeductions: number;
  effectiveMarketplaceCostPct: number;
  expectedPayout: number;
  payoutVariance: number | null;
};

function cents(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.round(value * 100);
}

export function calculateMarketplaceCost(
  input: MarketplaceCostInputs
): MarketplaceCostResult | null {
  const eligibleSales = cents(input.eligibleSales);
  if (eligibleSales <= 0) return null;

  const grossDeductions =
    cents(input.commission) +
    cents(input.merchantFees) +
    cents(input.promotions) +
    cents(input.refundsAdjustments) +
    cents(input.otherFees);
  const documentedDeductions = grossDeductions - cents(input.credits);
  const expectedPayout = eligibleSales - documentedDeductions;
  const hasReportedPayout =
    typeof input.reportedPayout === 'number' &&
    Number.isFinite(input.reportedPayout) &&
    input.reportedPayout >= 0;
  const payoutVariance = hasReportedPayout
    ? cents(input.reportedPayout as number) - expectedPayout
    : null;

  return {
    documentedDeductions: documentedDeductions / 100,
    effectiveMarketplaceCostPct:
      (documentedDeductions / eligibleSales) * 100,
    expectedPayout: expectedPayout / 100,
    payoutVariance: payoutVariance === null ? null : payoutVariance / 100,
  };
}
