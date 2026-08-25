import { centsToDollars, dollarsToCents, requireNonNeg, requirePositive } from "../money.js";

export type ActionShiftInput = {
  store?: string;
  business_date?: string;
  gross_sales: number;
  order_count?: number;
  labor_dollars?: number;
  labor_target_pct?: number;
  expected_cash?: number;
  entered_deposit?: number;
  payouts?: number;
  discounts?: number;
  promotions?: number;
  voids?: number;
  late_delivery_count?: number;
  late_delivery_sales?: number;
  average_delivery_minutes?: number;
  target_delivery_minutes?: number;
};

type Candidate = {
  rank: number;
  owner: string;
  action: string;
  dollars_at_stake: number | null;
  claim_boundary: string;
  evidence_status: "UNVERIFIED";
};

export function buildActionShift(input: ActionShiftInput) {
  const sales = requirePositive("gross_sales", input.gross_sales);
  const labor = input.labor_dollars === undefined ? undefined : requireNonNeg("labor_dollars", input.labor_dollars);
  const laborTarget = input.labor_target_pct;
  const expectedCash =
    input.expected_cash === undefined ? undefined : requireNonNeg("expected_cash", input.expected_cash);
  const deposit =
    input.entered_deposit === undefined ? undefined : requireNonNeg("entered_deposit", input.entered_deposit);
  const voids = input.voids === undefined ? undefined : requireNonNeg("voids", input.voids);
  const discounts = input.discounts === undefined ? undefined : requireNonNeg("discounts", input.discounts);
  const lateSales =
    input.late_delivery_sales === undefined
      ? undefined
      : requireNonNeg("late_delivery_sales", input.late_delivery_sales);

  const candidates: Candidate[] = [];

  if (expectedCash !== undefined && deposit !== undefined) {
    const gap = centsToDollars(dollarsToCents(expectedCash) - dollarsToCents(deposit));
    if (Math.abs(gap) >= 0.02) {
      candidates.push({
        rank: 1,
        owner: "Store GM / Accounting",
        action: `Reconcile cash: expected ${expectedCash.toFixed(2)} vs entered deposit ${deposit.toFixed(2)}. Pull till tape + deposit slip before close talk.`,
        dollars_at_stake: Math.abs(gap),
        claim_boundary: "Cash variance is a review signal. It is not a theft finding.",
        evidence_status: "UNVERIFIED",
      });
    }
  }

  if (labor !== undefined && laborTarget !== undefined) {
    const laborPct = (labor / sales) * 100;
    const over = laborPct - laborTarget;
    if (over > 0.5) {
      const overDollars = centsToDollars(Math.round(((over / 100) * sales) * 100));
      candidates.push({
        rank: candidates.length + 1,
        owner: "Operations / Store GM",
        action: `Review prior-day labor vs operator target ${laborTarget}%. Observed ${laborPct.toFixed(2)}%. Check schedule vs clock, not people first.`,
        dollars_at_stake: overDollars,
        claim_boundary: "Labor dollars over target is not loaded labor or a discipline case.",
        evidence_status: "UNVERIFIED",
      });
    }
  }

  if (voids !== undefined && voids > 0 && voids / sales >= 0.02) {
    candidates.push({
      rank: candidates.length + 1,
      owner: "Store GM",
      action: `Pull void/refund detail for ${input.business_date ?? "prior day"}. Voids are ${((voids / sales) * 100).toFixed(2)}% of gross. Start with Unknown/system bucket.`,
      dollars_at_stake: voids,
      claim_boundary: "Void rate is a pattern to review. It is not proof of theft or comps abuse.",
      evidence_status: "UNVERIFIED",
    });
  }

  if (
    input.late_delivery_count &&
    input.late_delivery_count > 0 &&
    lateSales !== undefined &&
    lateSales > 0
  ) {
    candidates.push({
      rank: candidates.length + 1,
      owner: "Operations",
      action: `Review ${input.late_delivery_count} late deliveries (${lateSales.toFixed(2)} sales). Check make-time vs door time before blaming the channel.`,
      dollars_at_stake: lateSales,
      claim_boundary: "Late delivery sales are exposure, not recovered cash or a marketplace overcharge.",
      evidence_status: "UNVERIFIED",
    });
  }

  if (discounts !== undefined && discounts / sales >= 0.08) {
    candidates.push({
      rank: candidates.length + 1,
      owner: "Store GM / Marketing",
      action: `Discount/promo dollars are ${((discounts / sales) * 100).toFixed(1)}% of gross. Split restaurant-funded vs platform-funded before changing the menu.`,
      dollars_at_stake: discounts,
      claim_boundary: "Discount rate is not promo ROI.",
      evidence_status: "UNVERIFIED",
    });
  }

  const ranked = candidates.slice(0, 3).map((c, i) => ({ ...c, rank: i + 1 }));

  const verdict =
    ranked.length === 0
      ? "No ranked morning move from the typed close. Confirm the source file before calling the night clean."
      : ranked[0].action;

  return {
    store: input.store ?? null,
    business_date: input.business_date ?? null,
    evidence_status: "UNVERIFIED" as const,
    scope: "Prior complete restaurant business day only. Typed values are Unverified until reconciled to Z / POS / deposit.",
    verdict,
    actions: ranked,
    night_proof_checklist: [
      "Was the action acknowledged?",
      "Was it done?",
      "What proof did the shift create (deposit slip, void report, clock edit, ticket)?",
      "Was this not done, missing data, or a fix that failed?",
    ],
    what_it_does_not_prove:
      "Typed close numbers do not prove theft, contract breach, bank receipt, or that a fix held.",
  };
}
