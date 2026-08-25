import { centsToDollars, dollarsToCents, requireNonNeg, requirePositive } from "../money.js";

export type MarketplaceCostInput = {
  platform: string;
  period?: string;
  eligible_sales: number;
  commission: number;
  merchant_fees: number;
  restaurant_funded_promotions_ads: number;
  refunds_adjustments: number;
  other_deductions: number;
  credits: number;
  reported_payout?: number;
};

export function calculate3pMarketplaceCost(input: MarketplaceCostInput) {
  const eligible = requirePositive("eligible_sales", input.eligible_sales);
  const commission = requireNonNeg("commission", input.commission);
  const merchant = requireNonNeg("merchant_fees", input.merchant_fees);
  const promos = requireNonNeg(
    "restaurant_funded_promotions_ads",
    input.restaurant_funded_promotions_ads
  );
  const refunds = requireNonNeg("refunds_adjustments", input.refunds_adjustments);
  const other = requireNonNeg("other_deductions", input.other_deductions);
  const credits = requireNonNeg("credits", input.credits);

  const documentedCents =
    dollarsToCents(commission) +
    dollarsToCents(merchant) +
    dollarsToCents(promos) +
    dollarsToCents(refunds) +
    dollarsToCents(other) -
    dollarsToCents(credits);

  const eligibleCents = dollarsToCents(eligible);
  const expectedPayoutCents = eligibleCents - documentedCents;
  const observedPct = (documentedCents / eligibleCents) * 100;

  const reported =
    input.reported_payout === undefined
      ? undefined
      : requireNonNeg("reported_payout", input.reported_payout);
  const payoutVariance =
    reported === undefined
      ? undefined
      : centsToDollars(dollarsToCents(reported) - expectedPayoutCents);

  return {
    platform: input.platform,
    period: input.period ?? null,
    evidence_status: "UNVERIFIED" as const,
    formula: {
      documented_deductions:
        "commission + merchant_fees + restaurant_funded_promotions_ads + refunds_adjustments + other_deductions - credits",
      observed_marketplace_cost_pct: "documented_deductions / eligible_sales * 100",
      expected_payout: "eligible_sales - documented_deductions",
      payout_variance: "reported_payout - expected_payout",
    },
    inclusions:
      "restaurant-borne commission, merchant/processing/service fees, restaurant-funded promos/ads, refunds/error charges/adjustments, other documented deductions, minus supported credits",
    exclusions:
      "tips, taxes, customer pass-through fees, and platform-funded incentives unless governing evidence says otherwise",
    numbers: {
      eligible_sales: centsToDollars(eligibleCents),
      commission: centsToDollars(dollarsToCents(commission)),
      merchant_fees: centsToDollars(dollarsToCents(merchant)),
      restaurant_funded_promotions_ads: centsToDollars(dollarsToCents(promos)),
      refunds_adjustments: centsToDollars(dollarsToCents(refunds)),
      other_deductions: centsToDollars(dollarsToCents(other)),
      credits: centsToDollars(dollarsToCents(credits)),
      documented_deductions: centsToDollars(documentedCents),
      observed_marketplace_cost_pct: Number(observedPct.toFixed(4)),
      expected_payout: centsToDollars(expectedPayoutCents),
      reported_payout: reported === undefined ? null : centsToDollars(dollarsToCents(reported)),
      payout_variance: payoutVariance ?? null,
    },
    claim_boundary:
      "This is statement math from typed or extracted inputs. It is not an overcharge, theft, contract breach, bank shortage, or recovered-cash claim. Commission is not total marketplace cost.",
    data_needed_next: [
      "Finalized marketplace statement Page 1 / Payment Details for the exact store and period",
      "If testing payout cash: matching bank deposit",
      "If testing POS completeness: same-scope POS export with external IDs",
    ],
  };
}
