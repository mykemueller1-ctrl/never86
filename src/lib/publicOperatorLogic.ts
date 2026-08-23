import {
  calculateMarketplaceCost,
  type MarketplaceCostInputs,
} from './marketplaceCost';

export const PUBLIC_LOGIC_DOMAINS = [
  'all',
  'evidence',
  'action-shift',
  'pos-routing',
  'invoices-daily-prime',
  'marketplace-3p',
  'voids-refunds',
  'ticket-leaks',
  'labor',
  'tips',
  'catering',
  'vendor-drift',
  'beverage',
  'product-mix-pars',
] as const;

export type PublicLogicDomain = (typeof PUBLIC_LOGIC_DOMAINS)[number];

const evidence = {
  purpose: 'Keep facts, reconciliation, assumptions, and missing evidence visibly separate.',
  states: {
    verified: 'Directly reproduced from supplied primary evidence for the exact declared scope.',
    reconciled: 'A deterministic bridge agrees within the declared tolerance.',
    partial: 'Useful evidence exists, but scope, attribution, or corroboration is incomplete.',
    estimated: 'Calculated from a named assumption.',
    unverified: 'Typed, sample, ambiguous, or not yet reconciled to a source.',
    missingEvidence: 'Stop and name the exact next file, export, field, or source needed.',
  },
  universalRules: [
    'Never request credentials, API keys, card data, bank account or routing numbers, tax IDs, guest PII, employee PII, or unrelated identifiers.',
    'Preserve source headers, report/version, store, exact period, timezone, business-day cutoff, filters, export time, identifiers, status, signs, and money basis.',
    'Show parsed source, scope, row count, totals, fields found, and missing fields before computing.',
    'Never silently drop failed rows, repair a source, invent a field meaning, or upgrade one evidence silo into another.',
    'Every finding ends with why it matters, an owner, one next action, dollars at stake, and evidence status.',
  ],
};

const actionShift = {
  promise: 'One store gets one morning decision and one night proof loop, not another dashboard.',
  morning: [
    'Use only the prior complete business day and preserve store, timezone, cutoff, filters, and source status.',
    'Rank no more than three moves by supported dollars, urgency, controllability, and evidence quality.',
    'Every move names one owner, one concrete action, the observed dollars at stake, and the claim boundary.',
  ],
  night: [
    'Ask whether the move happened and require the proof created by the shift: deposit record, receipt, schedule/time clock, ticket detail, or exception log.',
    'Carry an unresolved move forward with the missing evidence; never mark it complete from a verbal yes alone.',
  ],
  limits: [
    'Typed values remain Unverified until reconciled to the source.',
    'Use only the operator\'s own targets and comparable history; never silently import an industry benchmark.',
    'A variance ranks review work. It does not prove theft, wrongdoing, contract breach, loss, or guaranteed savings.',
  ],
};

const posRouting = {
  boundary: 'POS evidence proves what the restaurant recorded. It does not prove marketplace fees, promotion funding, contract compliance, marketplace payout, or bank receipt.',
  attributionPrecedence: [
    'Exact marketplace external/POS ID to POS external ID.',
    'Exact marketplace order number to POS ticket/check/receipt ID.',
    'Router marketplace ID plus router POS receipt ID.',
    'Store + business date + normalized local time + subtotal/tax/total + final status is a human-review candidate only.',
    'Zero or multiple candidates remain unresolved.',
  ],
  stopRule: 'Delivery, Pickup, Web, Mobile, eCommerce, House Account, dining option, tender, order type, revenue center, or service mode is not marketplace identity without an exact external/source/integration ID or reviewed configuration mapping.',
  systems: {
    toast: 'Use untouched OrderDetails.csv and PaymentDetails.csv for the exact store/date/timezone/cutoff. Require two agreeing attribution signals among Order Source, Dining Option, and Revenue Center unless an exact external ID exists.',
    pdq: 'Use native-text Z-report plus Sales Details, payment/tender, void/refund/discount/tax/tip/EOD detail, and Third Party Orders when applicable. An empty Third Party Orders report means no qualifying configured payment rows for that scope, not no marketplace sales.',
    square: 'Preserve every exported column and filter from Transactions, Orders, Payments, and Transfers, including creation_source and identifiers. Transfers can cross cutoffs and locations.',
    aloha: 'Preserve product/dataset version and request Sales Summary, Transactions, Payments, Revenue Centers, Taxes, Discounts, Refunds, and Voids.',
    simphony: 'Preserve Standard Export version. Use check-level CHDR/CDTL plus relevant tender, discount, tax, item, and service-charge records. Aggregate OCD is not enough for exact matching.',
    parBrink: 'Preserve approved Data Service/Sales2 data, business date, location, EOD rules, external tenders, payments, deposits, and tills.',
    lightspeed: 'Use a current All Orders export with payments, profiles, timezone/cutoff, export time, and final state. Pickup or Delivery profile alone is not marketplace identity.',
    secondary: 'For Clover, Revel, SpotOn, HungerRush, TouchBistro, and Qu, preserve native labels and request order/check, payment, tender, discount, void, refund, source, status, configuration, version, and filter evidence. Do not invent stable headers.',
  },
};

const invoicesDailyPrime = {
  extractionFields: ['vendor', 'invoice number', 'store', 'document date/service period', 'currency', 'line item', 'quantity', 'unit/pack', 'unit price', 'line total', 'subtotal', 'tax', 'fees', 'credits', 'grand total'],
  reconciliation: 'Line totals must bridge to subtotal, then tax/fees/credits must bridge to grand total to the cent. Any failure goes to human review.',
  duplicateCandidate: 'Flag only when vendor + normalized invoice number + store + date + total support it. A collision is a review candidate, not a proven duplicate.',
  buckets: ['Food', 'Liquor', 'Beer', 'Pop/NA Beverage', 'Chemicals/Paper/Supplies', 'Labor', 'Other/uncategorized'],
  rules: [
    'Keep Other/uncategorized visible and exclude it from a confident category conclusion until reviewed.',
    'Reuse a vendor+item category correction only after human approval with a traceable correction record.',
    'Daily Prime needs same-scope verified sales and document-backed costs; show dollars and percent by bucket versus the operator\'s own target and a comparable prior period.',
    'Manager-reported food cost without invoice evidence is Estimated / manager-reported.',
    'Prime cost or contribution remains Missing Evidence when required food, labor, occupancy, or other inputs are absent.',
  ],
};

const marketplace3p = {
  quickWinFormula: {
    documentedDeductions: 'commission + merchantFees + restaurantFundedPromotionsAndAds + refundsErrorChargesAndAdjustments + otherDocumentedDeductions - supportedCredits',
    observedMarketplaceCostPct: 'documentedDeductions / eligibleSales * 100',
    expectedPayout: 'eligibleSales - documentedDeductions',
    payoutVariance: 'reportedPayout - expectedPayout',
  },
  evidenceLadder: {
    finalizedStatement: 'Observed cost composition and statement payout math.',
    contractRateCard: 'Applicable rule, rate, fee base, and effective date for a contract test.',
    payoutDetail: 'Batch composition and timing, not cash receipt.',
    bankDeposit: 'Cash receipt amount/date, not why the platform calculated it that way.',
    pos: 'Restaurant-recorded sales and order completeness for an exact matched scope.',
    orderDetail: 'Refund, error-charge, dispute, duplicate, and campaign exceptions.',
  },
  hardRules: [
    'Commission is not total marketplace cost.',
    'Disclose numerator, denominator, inclusions, exclusions, and formula.',
    'Exclude tips, taxes, customer pass-through fees, and platform-funded incentives unless governing evidence says otherwise.',
    'Never use a generic industry rate as if it describes this restaurant.',
    'Never call a variance an overcharge, theft, breach, shortage, or recovered cash without the evidence required for that claim.',
    'If the math is clean, say it is clean.',
  ],
  doorDash: {
    authority: 'Use Page 1 as the finalized calendar-month authority. Use later payout pages for payout IDs and transaction weeks, not as a replacement for Page 1.',
    mappings: {
      Subtotal: 'eligibleSales',
      Sales: 'salesPassedToRestaurant',
      Commission: 'commission',
      'Merchant fees + fee tax': 'merchantFees',
      'Marketing fees': 'restaurantFundedAds',
      'Customer discounts funded by you': 'restaurantFundedPromotions',
      'Error charges': 'errorRefundCharges',
      Adjustments: 'signed otherAdjustments',
      'Net total': 'reportedPayout',
    },
    tolerance: 0.02,
  },
  otherMarketplaces: {
    uberEats: 'Prefer Payment Details, Payout Summary, and weekly statement for the same store/week. Preserve documented field meanings and signs; ignore percent columns as money and do not subtract offers twice.',
    grubhub: 'Keep Marketing, Deliveries, Order Processing, Promotion Redemptions, Account Adjustments, and Total Paid separate and preserve native signs.',
    ezCaterOther: 'Normalize only visible finalized evidence. Unclear sign, funding source, scope, or column remains unresolved.',
  },
};

const voidsRefunds = {
  storeFlag: 'median > 0 and store rate > 1.5x the operator peer median',
  employeeFlag: 'employee rate > 1.5x peer median and amount > $200',
  rules: [
    'Use the operator\'s own peer median, never an industry benchmark.',
    'Annualize only a complete input window with an explicit multiplier.',
    'Patterns are not verdicts. Check shift assignment, tenure, activity, shared till, Unknown/system bucket, channel mistag, and marketplace dispute context before interpretation.',
    'Never make theft, HR, firing, or discipline conclusions.',
  ],
};

const ticketLeaks = {
  signals: {
    voidAfterPayment: 'Any paid-then-voided count.',
    cashOnlyVoider: 'At least 5 voids and at least 80% cash-tender voids.',
    promoStacking: 'At least 2 discounts on one ticket.',
    compAbuse: 'Comp dollars >= $200 and rate > 1.5x peer median or > 10% of own net sales.',
    discountAfterClose: 'Discount timestamp is later than close timestamp.',
    dayOfWeekCluster: 'At least 5 voids and at least 40% on one weekday.',
    microCompPattern: 'At least 10 comps averaging more than $0 and less than $5.',
  },
  boundary: 'Risk score sorts review work. It is not proof. Show underlying counts, dollars, dates, tender, and peer basis.',
};

const labor = {
  earlyClockIn: 'More than 5 minutes before scheduled start.',
  lateClockOut: 'More than 15 minutes after scheduled end.',
  overtimeDrift: 'max(0, clocked duration - scheduled duration)',
  ghostShiftCandidate: 'Clocked at least 60 minutes with zero attached sales.',
  dollars: 'overtime hours * wage * 1.5; when wage is missing, $15/hour is an explicit Estimated assumption.',
  boundary: 'Training, prep, manager work, shared assignments, or missing sales linkage can explain a ghost-shift candidate.',
};

const tips = {
  scope: 'Compare the latest two complete weeks for the same employee and store; require at least two weeks.',
  formula: 'tipRate = tips / netSales; deltaPp = (current tipRate - prior tipRate) * 100',
  flag: 'deltaPp < -2 and prior tips > $50; skip rows where combined net sales < $100',
  boundary: 'A tip-rate drop is a leading service/reconciliation signal, not wage-theft evidence.',
};

const catering = {
  formula: 'gap = max(0, invoiceAmount - posAmount); gapRatio = totalGap / totalInvoice',
  unmatched: 'invoiceAmount > 0 and posAmount = 0',
  partialMismatch: 'invoiceAmount > 0, posAmount > 0, gap > $50, and gap/invoiceAmount > 10%',
  concentration: 'Surface a customer only when total customer gap > $100.',
  boundary: 'Investigate timing, credits, deposits, split tenders, canceled events, and mapping before calling a gap a leak.',
};

const vendorDrift = {
  requiredFields: ['vendor', 'SKU/item', 'period or invoice date', 'unit price'],
  formula: '(current average price - prior average price) / prior average price',
  flag: 'Upward drift > 5% across the latest two complete comparable periods for the same vendor+SKU.',
  boundary: 'Without purchase quantity, dollar drift is per unit—not extended impact, savings, or recoverable cash.',
};

const beverage = {
  formulas: {
    shrinkUnits: 'max(0, inventoryConsumed - posPoured)',
    shrinkPct: 'shrinkUnits / inventoryConsumed',
    revenueLost: 'shrinkUnits * unitPrice only when unit price is supplied',
    bcs: 'clamp(round(100 - shrinkPct / 0.30 * 100), 0, 100)',
  },
  boundary: 'This is a pour-vs-inventory heuristic. Transfers, waste, unit/pack mismatch, comps, recipes, and count timing can explain it.',
};

const productMixPars = {
  purpose: 'Turn comparable POS item mix plus operator-approved inventory rules into a reviewable par and order draft.',
  requiredScope: ['location', 'raw item/SKU', 'complete business dates', 'units sold', 'unit/pack definition', 'inventory/on-hand basis'],
  strongerInputs: ['channel/daypart', 'modifiers', 'waste', 'comps', 'transfers', 'open purchase orders', 'lead time', 'delivery cadence', 'shelf life', 'minimum order', 'case pack', 'recipe/yield', 'seasonal/LTO flag', 'stockouts', 'manager override'],
  formulas: {
    averageDailyUnits: 'comparable units sold / comparable open days',
    leadTimeDemand: 'average daily units * lead time days',
    reviewPeriodDemand: 'average daily units * days between deliveries',
    effectiveOnHand: 'on hand + confirmed on order + transfers in - reserved - transfers out',
    targetStock: 'lead time demand + review period demand + operator-approved safety stock',
    suggestedOrderUnits: 'max(0, target stock - effective on hand)',
    suggestedOrderCases: 'ceil(suggested order units / verified units per case)',
  },
  rules: [
    'Never copy one restaurant\'s par into another.',
    'Never invent case conversion, yield, lead time, shelf life, vendor minimum, or safety stock. When missing, show Missing Evidence and a units-only baseline.',
    'Preserve raw labels while mapping POS menu item to modifier, recipe/inventory SKU, vendor SKU, and pack/unit. Ambiguous mappings require human approval.',
    'Use complete comparable open days. Disclose any closure, partial day, event, or stockout exclusion and keep the original rows visible.',
    'A stockout censors demand; do not lower par because the item was unavailable.',
    'Vendor price drift is separate from quantity/par drift. POS sold quantity is not theoretical ingredient usage without recipe and yield evidence.',
    'Par is a starting control, not a promise. The kitchen or bar manager approves the physical count and order.',
  ],
};

export const PUBLIC_OPERATOR_LOGIC = {
  evidence,
  'action-shift': actionShift,
  'pos-routing': posRouting,
  'invoices-daily-prime': invoicesDailyPrime,
  'marketplace-3p': marketplace3p,
  'voids-refunds': voidsRefunds,
  'ticket-leaks': ticketLeaks,
  labor,
  tips,
  catering,
  'vendor-drift': vendorDrift,
  beverage,
  'product-mix-pars': productMixPars,
} as const;

export function getPublicOperatorLogic(domain: PublicLogicDomain) {
  if (domain === 'all') return PUBLIC_OPERATOR_LOGIC;
  return PUBLIC_OPERATOR_LOGIC[domain];
}

export type MarketplaceQuickWinInput = {
  platform?: string;
  period?: string;
  eligibleSales: number;
  commission: number;
  merchantFees: number;
  promotions: number;
  refundsAdjustments: number;
  otherFees: number;
  credits: number;
  reportedPayout?: number;
};

export type MarketplaceQuickWinResult = {
  input: MarketplaceQuickWinInput;
  calculation: NonNullable<ReturnType<typeof calculateMarketplaceCost>>;
  formula: typeof marketplace3p.quickWinFormula;
  status: 'unverified';
  interpretation: string;
  claimBoundary: string;
  nextEvidence: string[];
  links: { quickWin: string; evidenceDesk: string };
};

function validMoney(name: string, value: number | undefined, optional = false): string | null {
  if (value === undefined && optional) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    return `${name} must be a finite, non-negative number.`;
  }
  return null;
}

export function calculateMarketplaceQuickWin(
  input: MarketplaceQuickWinInput,
): { ok: true; result: MarketplaceQuickWinResult } | { ok: false; error: string } {
  if (!Number.isFinite(input.eligibleSales) || input.eligibleSales <= 0) {
    return { ok: false, error: 'eligibleSales must be greater than zero.' };
  }

  const checks: Array<[string, number | undefined, boolean?]> = [
    ['commission', input.commission],
    ['merchantFees', input.merchantFees],
    ['promotions', input.promotions],
    ['refundsAdjustments', input.refundsAdjustments],
    ['otherFees', input.otherFees],
    ['credits', input.credits],
    ['reportedPayout', input.reportedPayout, true],
  ];
  for (const [name, value, optional] of checks) {
    const error = validMoney(name, value, Boolean(optional));
    if (error) return { ok: false, error };
  }

  const calculatorInput: MarketplaceCostInputs = {
    eligibleSales: input.eligibleSales,
    commission: input.commission,
    merchantFees: input.merchantFees,
    promotions: input.promotions,
    refundsAdjustments: input.refundsAdjustments,
    otherFees: input.otherFees,
    credits: input.credits,
    reportedPayout: input.reportedPayout,
  };
  const calculation = calculateMarketplaceCost(calculatorInput);
  if (!calculation) return { ok: false, error: 'Unable to calculate marketplace cost.' };

  const interpretation = calculation.payoutVariance === null
    ? 'Reported payout was not supplied, so payout variance is unknown.'
    : Math.abs(calculation.payoutVariance) < 0.01
      ? 'The reported payout matches the entered statement math to the cent.'
      : calculation.payoutVariance > 0
        ? `The reported payout is $${calculation.payoutVariance.toFixed(2)} above the calculation.`
        : `The reported payout is $${Math.abs(calculation.payoutVariance).toFixed(2)} below the calculation.`;

  return {
    ok: true,
    result: {
      input,
      calculation,
      formula: marketplace3p.quickWinFormula,
      status: 'unverified',
      interpretation,
      claimBoundary: 'This is deterministic math from user-entered values. It is not a verified audit, contract finding, bank reconciliation, overcharge finding, or recovery claim.',
      nextEvidence: [
        'Finalized marketplace statement for observed cost composition.',
        'Current contract or rate card plus the correct fee base for a contract test.',
        'Matching payout detail and bank deposit for cash reconciliation.',
      ],
      links: {
        quickWin: 'https://www.never86.ai/audit',
        evidenceDesk: 'https://www.never86.ai/delivery-marketplace-reconciliation',
      },
    },
  };
}
