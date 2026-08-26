/**
 * Ordered (PO) vs invoiced vs theoretical usage → Action Shift.
 *
 * Three legs present: compute qty/dollar gap. Still not food cost (no count).
 * Two legs present: Partial. One leg: Missing Evidence, dollarsObserved null.
 * Invoice ≠ COGS. POS sold ≠ theoretical usage without recipe + yield.
 * No LLM dollar math. Synthetic fixtures only.
 */

import type { ActionShiftAction, ActionShiftResult } from './actionShift';
import {
  parsePurchaseOrder,
  parseTheoreticalUsage,
  type PurchaseOrderDocument,
  type TheoreticalUsageDocument,
} from './poReceiveParse';
import {
  parseVendorInvoice,
  type VendorInvoiceDocument,
} from './vendorInvoiceParse';

export type PoUsageEvidenceState = 'unverified' | 'partial' | 'missing-evidence';

export type PoUsageSkuRow = {
  vendor: string;
  sku: string;
  description: string;
  period: string | null;
  orderedQty: number | null;
  invoicedQty: number | null;
  theoreticalQty: number | null;
  unitPrice: number | null;
  receiveQtyGap: number | null;
  usageQtyGap: number | null;
  dollarsObserved: number | null;
  legsPresent: 0 | 1 | 2 | 3;
  flagged: boolean;
  evidenceState: PoUsageEvidenceState;
  missingEvidence: string | null;
};

export type PoUsageCompareResult = {
  rows: PoUsageSkuRow[];
  flagged: PoUsageSkuRow[];
  missingEvidence: string[];
  period: string | null;
  purchaseOrders: PurchaseOrderDocument[];
  invoices: VendorInvoiceDocument[];
  usage: TheoreticalUsageDocument[];
};

function skuKey(sku: string): string {
  return sku.trim().toLowerCase();
}

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function roundCents(value: number): number {
  return Math.round(value * 100) / 100;
}

function firstPrice(...prices: Array<number | null | undefined>): number | null {
  for (const price of prices) {
    if (price != null && Number.isFinite(price) && price > 0) return price;
  }
  return null;
}

function qtyGap(left: number | null, right: number | null): number | null {
  if (left == null || right == null) return null;
  return roundCents(left - right);
}

function dollarFromQty(qty: number | null, price: number | null): number | null {
  if (qty == null || price == null) return null;
  return roundCents(Math.abs(qty) * price);
}

type Bucket = {
  vendor: string;
  sku: string;
  description: string;
  periods: Set<string>;
  orderedQty: number | null;
  invoicedQty: number | null;
  theoreticalQty: number | null;
  poPrice: number | null;
  invoicePrice: number | null;
  usageCost: number | null;
};

function bucketFor(map: Map<string, Bucket>, sku: string, vendor: string, description: string): Bucket {
  const key = skuKey(sku);
  const existing = map.get(key);
  if (existing) {
    if (!existing.vendor && vendor) existing.vendor = vendor;
    if (!existing.description && description) existing.description = description;
    return existing;
  }
  const created: Bucket = {
    vendor,
    sku,
    description,
    periods: new Set<string>(),
    orderedQty: null,
    invoicedQty: null,
    theoreticalQty: null,
    poPrice: null,
    invoicePrice: null,
    usageCost: null,
  };
  map.set(key, created);
  return created;
}

export function comparePoInvoiceUsage(input: {
  purchaseOrders: PurchaseOrderDocument[];
  invoices: VendorInvoiceDocument[];
  usage: TheoreticalUsageDocument[];
}): PoUsageCompareResult {
  const missingEvidence: string[] = [];
  const bySku = new Map<string, Bucket>();

  for (const doc of input.purchaseOrders) {
    missingEvidence.push(...doc.missingFields);
    for (const line of doc.lines) {
      if (line.status === 'unreadable' || line.qtyOrdered == null || !line.sku) {
        missingEvidence.push(
          line.sku
            ? `Unreadable PO line for ${line.vendor || 'unknown vendor'} ${line.sku} is Missing Evidence, not $0.`
            : 'Unreadable PO line is Missing Evidence, not $0.',
        );
        continue;
      }
      const bucket = bucketFor(bySku, line.sku, line.vendor, line.description);
      bucket.orderedQty = (bucket.orderedQty ?? 0) + line.qtyOrdered;
      if (line.unitPrice != null) bucket.poPrice = line.unitPrice;
      if (line.period) bucket.periods.add(line.period);
    }
  }

  for (const doc of input.invoices) {
    missingEvidence.push(...doc.missingFields);
    for (const line of doc.lines) {
      if (line.status === 'unreadable' || line.quantity == null || !line.sku) {
        missingEvidence.push(
          line.sku
            ? `Unreadable invoice qty for ${line.vendor || 'unknown vendor'} ${line.sku} is Missing Evidence, not $0.`
            : 'Unreadable invoice line is Missing Evidence, not $0.',
        );
        continue;
      }
      const bucket = bucketFor(bySku, line.sku, line.vendor, line.description);
      bucket.invoicedQty = (bucket.invoicedQty ?? 0) + line.quantity;
      if (line.unitPrice != null) bucket.invoicePrice = line.unitPrice;
      if (line.period) bucket.periods.add(line.period);
    }
  }

  for (const doc of input.usage) {
    missingEvidence.push(...doc.missingFields);
    for (const line of doc.lines) {
      if (line.missingEvidence) missingEvidence.push(line.missingEvidence);
      if (line.status === 'unreadable' || line.theoreticalQty == null || !line.sku) {
        if (!line.missingEvidence) {
          missingEvidence.push(
            line.sku
              ? `Theoretical usage for ${line.sku} is Missing Evidence, not $0.`
              : 'Unreadable theoretical-usage line is Missing Evidence, not $0.',
          );
        }
        continue;
      }
      const bucket = bucketFor(bySku, line.sku, '', line.description);
      bucket.theoreticalQty = (bucket.theoreticalQty ?? 0) + line.theoreticalQty;
      if (line.unitCost != null) bucket.usageCost = line.unitCost;
      if (line.period) bucket.periods.add(line.period);
    }
  }

  if (!input.purchaseOrders.length) {
    missingEvidence.push('Purchase order (ordered qty) is Missing Evidence, not $0.');
  }
  if (!input.invoices.length) {
    missingEvidence.push('Matching invoice / receiving qty is Missing Evidence, not $0.');
  }
  if (!input.usage.length) {
    missingEvidence.push('Theoretical usage (recipe × sold ÷ yield) is Missing Evidence, not $0. POS sold quantity is not theoretical usage.');
  }

  const rows: PoUsageSkuRow[] = [];
  for (const bucket of bySku.values()) {
    const orderedQty = bucket.orderedQty;
    const invoicedQty = bucket.invoicedQty;
    const theoreticalQty = bucket.theoreticalQty;
    const legs = [orderedQty, invoicedQty, theoreticalQty].filter((qty) => qty != null).length as 0 | 1 | 2 | 3;
    const unitPrice = firstPrice(bucket.invoicePrice, bucket.poPrice, bucket.usageCost);
    const periods = [...bucket.periods].sort();
    const period = periods.length ? periods[periods.length - 1] : null;
    const receiveQtyGap = qtyGap(invoicedQty, orderedQty);
    const usageQtyGap = qtyGap(invoicedQty, theoreticalQty);
    const twoLegGap = receiveQtyGap ?? usageQtyGap ?? qtyGap(orderedQty, theoreticalQty);

    let evidenceState: PoUsageEvidenceState;
    let dollarsObserved: number | null = null;
    let missing: string | null = null;

    if (legs <= 1) {
      evidenceState = 'missing-evidence';
      dollarsObserved = null;
      const have = orderedQty != null ? 'PO' : invoicedQty != null ? 'invoice' : 'theoretical usage';
      missing = `Only ${have} qty exists for ${bucket.vendor ? `${bucket.vendor} ` : ''}${bucket.sku}. One leg is Missing Evidence — dollarsObserved is null, not $0.`;
    } else if (legs === 2) {
      evidenceState = 'partial';
      dollarsObserved = dollarFromQty(twoLegGap, unitPrice);
      const absent = orderedQty == null
        ? 'purchase order'
        : invoicedQty == null
          ? 'invoice / receiving qty'
          : 'theoretical usage (recipe × sold ÷ yield)';
      missing = `Two legs present for ${bucket.sku}; ${absent} is missing. Gap is Partial — not food cost, not $0.`;
    } else {
      evidenceState = 'unverified';
      const receiveDollars = dollarFromQty(receiveQtyGap, unitPrice);
      const usageDollars = dollarFromQty(usageQtyGap, unitPrice);
      const ranked = [receiveDollars, usageDollars].filter((value): value is number => value != null);
      dollarsObserved = ranked.length ? Math.max(...ranked) : null;
    }

    const qtyMismatch = (receiveQtyGap != null && Math.abs(receiveQtyGap) >= 0.01)
      || (usageQtyGap != null && Math.abs(usageQtyGap) >= 0.01)
      || (legs === 2 && twoLegGap != null && Math.abs(twoLegGap) >= 0.01);

    rows.push({
      vendor: bucket.vendor,
      sku: bucket.sku,
      description: bucket.description,
      period,
      orderedQty,
      invoicedQty,
      theoreticalQty,
      unitPrice,
      receiveQtyGap,
      usageQtyGap,
      dollarsObserved,
      legsPresent: legs,
      flagged: qtyMismatch && (legs >= 2),
      evidenceState,
      missingEvidence: missing,
    });
  }

  rows.sort((left, right) => (right.dollarsObserved ?? -1) - (left.dollarsObserved ?? -1));
  return {
    rows,
    flagged: rows.filter((row) => row.flagged),
    missingEvidence: [...new Set(missingEvidence)],
    period: rows.find((row) => row.period)?.period ?? null,
    purchaseOrders: input.purchaseOrders,
    invoices: input.invoices,
    usage: input.usage,
  };
}

const CLAIM_BOUNDARY =
  'Invoice spend is not COGS. Theoretical usage is not actual food cost without a complete physical count. A quantity gap is review work, not theft, shortage, or recoverable cash.';

function proofFor(row?: PoUsageSkuRow): ActionShiftAction['proof'] {
  if (!row || row.legsPresent <= 1) {
    return {
      object: 'Matching PO, invoice/receiving copy, and recipe/yield usage for the same SKU and period',
      nightCheck: 'Attach the missing PO, invoice, or theoretical-usage source. A verbal yes does not close it.',
      verbalYesCloses: false,
    };
  }
  if (row.legsPresent === 2) {
    return {
      object: 'The two supplied legs plus the missing third (PO, invoice, or recipe/yield usage)',
      nightCheck: 'Attach the missing third source and confirm SKU, pack, qty, and period before treating the gap as more than Partial.',
      verbalYesCloses: false,
    };
  }
  return {
    object: 'Signed receiving copy + matching PO + recipe/yield usage for the same SKU and period',
    nightCheck: 'Attach PO, invoice/receiving, and theoretical-usage sources. A physical count is still required before any food-cost claim.',
    verbalYesCloses: false,
  };
}

function gapAction(row: PoUsageSkuRow, index: number): ActionShiftAction {
  const label = row.description || row.sku;
  const vendor = row.vendor ? `${row.vendor} ` : '';
  if (row.legsPresent <= 1) {
    return {
      id: 'po-receive-usage',
      instanceKey: `po-receive-usage:missing:${row.sku}:${index}`,
      title: `Get the missing PO / invoice / usage evidence for ${vendor}${label}`,
      owner: 'Chef or kitchen manager',
      evidence: row.missingEvidence || `Only one leg exists for ${row.sku}. Missing Evidence — not $0.`,
      move: 'Upload or forward the missing purchase order, invoice/receiving qty, or recipe/yield theoretical usage. Do not invent a variance dollar.',
      dollarsObserved: null,
      sourceStatus: 'unverified',
      claimBoundary: CLAIM_BOUNDARY,
      proof: proofFor(row),
    };
  }

  if (row.legsPresent === 2) {
    const ordered = row.orderedQty == null ? 'missing' : String(row.orderedQty);
    const invoiced = row.invoicedQty == null ? 'missing' : String(row.invoicedQty);
    const theoretical = row.theoreticalQty == null ? 'missing' : String(row.theoreticalQty);
    return {
      id: 'po-receive-usage',
      instanceKey: `po-receive-usage:partial:${row.sku}:${index}`,
      title: `Review Partial PO / invoice / usage gap on ${vendor}${label}`,
      owner: 'Chef or kitchen manager',
      evidence: `${vendor}${row.sku} ordered ${ordered}, invoiced ${invoiced}, theoretical ${theoretical}. Two legs only — Partial. ${row.dollarsObserved == null ? 'dollarsObserved is null until the third qty and a unit price exist.' : `Two-leg observed gap ${money(row.dollarsObserved)}.`} ${row.missingEvidence || ''}`,
      move: 'Confirm pack size, then attach the missing third source. Do not book food cost or treat this as recovered cash.',
      dollarsObserved: row.dollarsObserved,
      sourceStatus: 'unverified',
      claimBoundary: CLAIM_BOUNDARY,
      proof: proofFor(row),
    };
  }

  return {
    id: 'po-receive-usage',
    instanceKey: `po-receive-usage:${row.sku}:${index}`,
    title: `Reconcile ordered vs invoiced vs theoretical usage on ${vendor}${label}`,
    owner: 'Chef or kitchen manager',
    evidence: `${vendor}${row.sku} ordered ${row.orderedQty}, invoiced ${row.invoicedQty}, theoretical ${row.theoreticalQty}. Receive qty gap ${row.receiveQtyGap}; invoice vs theoretical qty gap ${row.usageQtyGap}. ${row.dollarsObserved == null ? 'No unit price — dollarsObserved is null, not $0.' : `Observed gap ${money(row.dollarsObserved)}.`} Still not food cost: no count.`,
    move: 'Match the signed receiving copy to the PO, then check recipe/yield vs invoiced qty. Do not convert the gap into theft or guaranteed savings.',
    dollarsObserved: row.dollarsObserved,
    sourceStatus: 'unverified',
    claimBoundary: CLAIM_BOUNDARY,
    proof: proofFor(row),
  };
}

function missingPacketAction(): ActionShiftAction {
  return {
    id: 'po-receive-usage',
    instanceKey: 'po-receive-usage:missing-packet',
    title: 'Get PO, invoice, and theoretical usage before calling a receive gap',
    owner: 'Chef or kitchen manager',
    evidence: 'Fewer than two qty legs were readable. Missing Evidence is not a $0 variance and not food cost.',
    move: 'Upload the purchase order, matching invoice/receiving qty, and recipe/yield theoretical usage for the same SKUs. Do not invent dollars.',
    dollarsObserved: null,
    sourceStatus: 'unverified',
    claimBoundary: CLAIM_BOUNDARY,
    proof: proofFor(),
  };
}

export function buildPoReceiveUsageActionShift(input: {
  store?: string;
  purchaseOrders?: Array<{ text: string; filename?: string }>;
  invoices?: Array<{ text: string; filename?: string }>;
  usage?: Array<{ text: string; filename?: string }>;
}): { ok: true; result: ActionShiftResult; compare: PoUsageCompareResult } | { ok: false; error: string } {
  const purchaseOrders = (input.purchaseOrders ?? []).map((doc) => parsePurchaseOrder(doc.text, doc.filename || ''));
  const invoices = (input.invoices ?? []).map((doc) => parseVendorInvoice(doc.text, doc.filename || ''));
  const usage = (input.usage ?? []).map((doc) => parseTheoreticalUsage(doc.text, doc.filename || ''));

  const poLines = purchaseOrders.flatMap((doc) => doc.lines);
  const invoiceLines = invoices.flatMap((doc) => doc.lines);
  const usageLines = usage.flatMap((doc) => doc.lines);
  if (!poLines.length && !invoiceLines.length && !usageLines.length) {
    return { ok: false, error: 'Paste or upload a purchase order, invoice, or theoretical-usage file first. No vendor-portal login.' };
  }

  const compare = comparePoInvoiceUsage({ purchaseOrders, invoices, usage });
  const actions: ActionShiftAction[] = compare.flagged.slice(0, 3).map((row, index) => gapAction(row, index));
  if (actions.length === 0) {
    const incomplete = compare.rows.find((row) => row.legsPresent <= 1)
      ?? compare.rows.find((row) => row.legsPresent === 2);
    actions.push(incomplete ? gapAction(incomplete, 0) : missingPacketAction());
  }

  const morningActions = actions.slice(0, 3);
  const missingEvidence = [
    ...compare.missingEvidence,
    ...compare.rows.filter((row) => row.missingEvidence).map((row) => row.missingEvidence as string),
  ].filter((line, index, all) => all.indexOf(line) === index);

  const flaggedCount = compare.flagged.length;
  const summary = flaggedCount
    ? `${morningActions.length} ranked PO / receive / usage action${morningActions.length === 1 ? '' : 's'} from ${flaggedCount} SKU gap${flaggedCount === 1 ? '' : 's'}. Two legs = Partial. One leg = Missing Evidence, dollarsObserved null.`
    : 'No two-leg qty gap to rank. Missing legs stay Missing Evidence — not $0 and not food cost.';

  return {
    ok: true,
    compare,
    result: {
      store: input.store?.trim() || 'Unspecified store',
      businessDate: compare.period || 'Unspecified business date',
      sourceStatus: 'unverified',
      summary,
      morningActions,
      nightCloseCheck: morningActions.map((action) => action.proof.nightCheck),
      missingEvidence,
      policy: {
        maxMorningActions: 3,
        benchmark: 'operator-supplied targets only',
        boundary: 'This tool ranks review work. It does not make theft, discipline, contract, bank-reconciliation, or guaranteed-savings claims.',
      },
    },
  };
}

const POS_SCORE: Record<ActionShiftAction['id'], number> = {
  'cash-proof': 100,
  'labor-window': 80,
  'payout-proof': 75,
  'delivery-clock': 70,
  'approval-proof': 60,
  'close-packet': 1,
  'vendor-drift': 90,
  'vendor-silence': 88,
  'po-receive-usage': 85,
};

function actionScore(action: ActionShiftAction): number {
  if (action.id === 'vendor-drift') {
    return 90 + Math.min(Math.max(action.dollarsObserved ?? 0, 0), 40);
  }
  if (action.id === 'po-receive-usage') {
    const base = action.dollarsObserved == null ? 55 : 85;
    return base + Math.min(Math.max(action.dollarsObserved ?? 0, 0), 40);
  }
  return POS_SCORE[action.id] ?? 0;
}

export function feedPoReceiveUsageIntoActionShift(
  existing: ActionShiftResult | null,
  po: ActionShiftResult | null,
): ActionShiftResult | null {
  if (!existing && !po) return null;
  if (!existing) return po;
  if (!po) return existing;

  const combined = [...po.morningActions, ...existing.morningActions]
    .sort((left, right) => actionScore(right) - actionScore(left))
    .slice(0, 3);

  const nightCloseCheck = combined.map((action) => action.proof.nightCheck);
  const dropClosePacketEvidence = existing.morningActions.some((action) => action.id === 'close-packet')
    && combined.every((action) => action.id !== 'close-packet');
  const missingEvidence = [...new Set([
    ...po.missingEvidence,
    ...existing.missingEvidence.filter((line) => (
      dropClosePacketEvidence ? !/complete same-scope close packet/i.test(line) : true
    )),
  ])];

  const poSelected = combined.some((action) => action.id === 'po-receive-usage');
  return {
    store: existing.store,
    businessDate: existing.businessDate !== 'Unspecified business date' ? existing.businessDate : po.businessDate,
    sourceStatus: 'unverified',
    summary: poSelected
      ? `${combined.length} ranked action${combined.length === 1 ? '' : 's'} mixing close, vendor drift, and PO / receive / usage. Verify against source evidence before acting.`
      : existing.summary,
    morningActions: combined,
    nightCloseCheck,
    missingEvidence,
    policy: existing.policy,
  };
}
