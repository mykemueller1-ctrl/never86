/**
 * Public One Seat / Action Shift first-win.
 * Sample dollars are fictional and disclosed. Formulas decide. LLM does not invent $.
 * One Seat = Action Shift = Community logic for 1–5 unit independents.
 */

import { buildVendorDriftActionShift, compareVendorInvoiceDocuments } from './vendorDriftActionShift';
import { parseVendorInvoice } from './vendorInvoiceParse';

export const ONE_SEAT_ICP = '1–5 unit independents';
export const ONE_SEAT_EQUALS = 'One Seat = Action Shift = Community logic';
export const ONE_SEAT_CLAIM = 'One location + one owner seat is free. Extra seats paid.';
export const ONE_SEAT_LOOP = 'yesterday → one action → night proof';

export const GOLD_MOZZARELLA = {
  sku: 'MZ-452',
  item: 'Whole Milk Mozzarella 20 lb case',
  vendor: 'Sample Dairy',
  priorPrice: 48,
  currentPrice: 56,
  delta: 8,
  driftPct: 8 / 48,
  days: 7,
  pack: '20 lb case',
  priorPeriod: '2026-09-01',
  currentPeriod: '2026-09-08',
  nextMove: 'Check the new price with your rep.',
  suggestedWording: 'MZ-452 was $48.00 and is now $56.00 on the same 20 lb case. What changed before the next order?',
  claimBoundary: 'This is a fictional sample price increase, not money recovered and not a live store savings claim.',
} as const;

export const GOLD_FLOUR = {
  sku: 'FL-100',
  item: 'All Purpose Flour 50 lb',
  priorPrice: 25,
  currentPrice: 25,
} as const;

export const GOLD_LABOR = {
  scheduledHours: 8,
  clockedHours: 9.5,
  driftHours: 1.5,
  sampleDollars: 31,
  nextMove: 'Ask who stayed and whether the extra hour was posted before the next schedule.',
  claimBoundary: 'Fictional sample hours and dollars. Clock ≠ schedule until both papers exist. Not recovered cash.',
} as const;

export const GOLD_RECIPE = {
  plateCost: 4,
  menuPrice: 16,
  foodCostPct: 0.25,
  nextMove: 'If the cheese case stays at the new price, re-cost this plate before the next print.',
  claimBoundary: 'Fictional sample plate math. No count → no food cost. Not a live recipe book.',
} as const;

export const GOLD_PRIOR_INVOICE_CSV = `Vendor,SKU,Description,Period,Unit Price,Qty
Sample Dairy,MZ-452,Whole Milk Mozzarella 20 LB case,2026-09-01,48.00,1
Sample Dairy,FL-100,All Purpose Flour 50 LB,2026-09-01,25.00,1
`;

export const GOLD_CURRENT_INVOICE_CSV = `Vendor,SKU,Description,Period,Unit Price,Qty
Sample Dairy,MZ-452,Whole Milk Mozzarella 20 LB case,2026-09-08,56.00,1
Sample Dairy,FL-100,All Purpose Flour 50 LB,2026-09-08,25.00,1
`;

export function goldInvoiceCompare() {
  const documents = [
    parseVendorInvoice(GOLD_PRIOR_INVOICE_CSV, 'sample-mozzarella-prior.csv'),
    parseVendorInvoice(GOLD_CURRENT_INVOICE_CSV, 'sample-mozzarella-current.csv'),
  ];
  const compare = compareVendorInvoiceDocuments(documents);
  const action = buildVendorDriftActionShift({
    store: 'Sample independent (fictional)',
    documents: [
      { text: GOLD_PRIOR_INVOICE_CSV, filename: 'sample-mozzarella-prior.csv' },
      { text: GOLD_CURRENT_INVOICE_CSV, filename: 'sample-mozzarella-current.csv' },
    ],
  });
  return { compare, action };
}

export function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function pctLabel(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export const PUBLIC_DOOR_VOICE = {
  neverSay: ['desk', 'chatgpt.site', 'Pulse'],
  say: ['One Seat', 'Action Shift', 'seat', 'app'],
  grok: 'Grok can explain the card. Deterministic formulas decide the dollars. This is not a Grok-resale product.',
} as const;
