/**
 * Vendor Drift → Action Shift.
 *
 * Formula: (current avg unit price - prior avg unit price) / prior avg unit price
 * Flag: upward drift > 5% on the same vendor+SKU across two complete comparable periods.
 * Missing prior period or unreadable line = Missing Evidence, never $0, never fake savings.
 * Observed dollars are per-unit only, and only when both periods exist.
 */

import type { ActionShiftAction, ActionShiftResult } from './actionShift';
import {
  parseVendorInvoice,
  type VendorInvoiceDocument,
} from './vendorInvoiceParse';

export const VENDOR_DRIFT_THRESHOLD = 0.05;

export type VendorDriftSkuRow = {
  vendor: string;
  sku: string;
  description: string;
  currentPeriod: string | null;
  priorPeriod: string | null;
  currentPrice: number | null;
  priorPrice: number | null;
  driftPct: number | null;
  dollarsObserved: number | null;
  flagged: boolean;
  evidenceState: 'unverified' | 'missing-evidence' | 'partial';
  missingEvidence: string | null;
};

export type VendorDriftCompareResult = {
  rows: VendorDriftSkuRow[];
  flagged: VendorDriftSkuRow[];
  missingEvidence: string[];
  currentPeriod: string | null;
  priorPeriod: string | null;
  documents: VendorInvoiceDocument[];
};

function skuKey(vendor: string, sku: string): string {
  return `${vendor.trim().toLowerCase()}::${sku.trim().toLowerCase()}`;
}

function average(values: number[]): number {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function money(value: number): string {
  return `$${value.toFixed(2)}`;
}

function pctLabel(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function compareVendorInvoiceDocuments(
  documents: VendorInvoiceDocument[],
): VendorDriftCompareResult {
  const missingEvidence: string[] = [];
  const bySku = new Map<string, {
    vendor: string;
    sku: string;
    description: string;
    periods: Map<string, number[]>;
    unreadable: number;
  }>();

  for (const doc of documents) {
    missingEvidence.push(...doc.missingFields);
    for (const line of doc.lines) {
      if (line.status === 'unreadable' || line.unitPrice == null || !line.vendor || !line.sku || !line.period) {
        missingEvidence.push(
          line.sku
            ? `Unreadable line for ${line.vendor || 'unknown vendor'} ${line.sku} is Missing Evidence, not $0.`
            : 'Unreadable invoice line is Missing Evidence, not $0.',
        );
        if (line.vendor && line.sku) {
          const key = skuKey(line.vendor, line.sku);
          const bucket = bySku.get(key) || {
            vendor: line.vendor,
            sku: line.sku,
            description: line.description,
            periods: new Map<string, number[]>(),
            unreadable: 0,
          };
          bucket.unreadable += 1;
          bySku.set(key, bucket);
        }
        continue;
      }
      const key = skuKey(line.vendor, line.sku);
      const bucket = bySku.get(key) || {
        vendor: line.vendor,
        sku: line.sku,
        description: line.description,
        periods: new Map<string, number[]>(),
        unreadable: 0,
      };
      const prices = bucket.periods.get(line.period) || [];
      prices.push(line.unitPrice);
      bucket.periods.set(line.period, prices);
      if (!bucket.description && line.description) bucket.description = line.description;
      bySku.set(key, bucket);
    }
  }

  const allPeriods = new Set<string>();
  for (const bucket of bySku.values()) {
    for (const period of bucket.periods.keys()) allPeriods.add(period);
  }
  const periods = [...allPeriods].sort();
  const currentPeriod = periods.length ? periods[periods.length - 1] : null;
  const priorPeriod = periods.length >= 2 ? periods[periods.length - 2] : null;

  if (!priorPeriod) {
    missingEvidence.push('Prior comparable invoice / period for the same vendor+SKU is Missing Evidence, not $0.');
  }

  const rows: VendorDriftSkuRow[] = [];
  for (const bucket of bySku.values()) {
    const skuPeriods = [...bucket.periods.keys()].sort();
    const skuCurrent = skuPeriods.length ? skuPeriods[skuPeriods.length - 1] : null;
    const skuPrior = skuPeriods.length >= 2 ? skuPeriods[skuPeriods.length - 2] : null;
    const currentPrices = skuCurrent ? bucket.periods.get(skuCurrent) : undefined;
    const priorPrices = skuPrior ? bucket.periods.get(skuPrior) : undefined;
    const currentPrice = currentPrices?.length ? average(currentPrices) : null;
    const priorPrice = priorPrices?.length ? average(priorPrices) : null;

    if (skuPeriods.length < 2 || currentPrice == null || priorPrice == null || priorPrice <= 0) {
      rows.push({
        vendor: bucket.vendor,
        sku: bucket.sku,
        description: bucket.description,
        currentPeriod: skuCurrent,
        priorPeriod: skuPrior,
        currentPrice,
        priorPrice,
        driftPct: null,
        dollarsObserved: null,
        flagged: false,
        evidenceState: 'missing-evidence',
        missingEvidence: `Prior period unit price for ${bucket.vendor} ${bucket.sku} is Missing Evidence, not $0.`,
      });
      continue;
    }

    const driftPct = (currentPrice - priorPrice) / priorPrice;
    const dollarsObserved = currentPrice - priorPrice;
    const flagged = driftPct > VENDOR_DRIFT_THRESHOLD;
    rows.push({
      vendor: bucket.vendor,
      sku: bucket.sku,
      description: bucket.description,
      currentPeriod: skuCurrent,
      priorPeriod: skuPrior,
      currentPrice,
      priorPrice,
      driftPct,
      dollarsObserved,
      flagged,
      evidenceState: bucket.unreadable ? 'partial' : 'unverified',
      missingEvidence: bucket.unreadable
        ? `One or more unreadable lines for ${bucket.vendor} ${bucket.sku} were excluded; they are Missing Evidence, not $0.`
        : null,
    });
  }

  rows.sort((left, right) => (right.driftPct ?? -1) - (left.driftPct ?? -1));
  const flagged = rows.filter((row) => row.flagged);
  return {
    rows,
    flagged,
    missingEvidence: [...new Set(missingEvidence)],
    currentPeriod,
    priorPeriod,
    documents,
  };
}

function vendorProof(row?: VendorDriftSkuRow): ActionShiftAction['proof'] {
  if (!row || row.dollarsObserved == null) {
    return {
      object: 'Prior comparable invoice for the same vendor+SKU',
      nightCheck: 'Attach the prior-period invoice and confirm SKU, pack, and unit price before any drift dollar is shown.',
      verbalYesCloses: false,
    };
  }
  return {
    object: 'Current and prior invoice lines for the same vendor+SKU',
    nightCheck: 'Attach both invoice files and confirm SKU, pack, period, and unit price match the flag.',
    verbalYesCloses: false,
  };
}

const CLAIM_BOUNDARY =
  'Without purchase quantity, dollar drift is per unit — not extended impact, savings, or recoverable cash. A price increase is not a contract breach.';

function flaggedAction(row: VendorDriftSkuRow, index: number): ActionShiftAction {
  const label = row.description || row.sku;
  return {
    id: 'vendor-drift',
    instanceKey: `vendor-drift:${row.vendor}:${row.sku}:${index}`,
    title: `Review ${row.vendor} ${label} — ${pctLabel(row.driftPct ?? 0)} unit-price drift`,
    owner: 'Chef or kitchen manager',
    evidence: `${row.vendor} ${row.sku} was ${money(row.priorPrice ?? 0)} in ${row.priorPeriod} and ${money(row.currentPrice ?? 0)} in ${row.currentPeriod} (${pctLabel(row.driftPct ?? 0)}). Per-unit observed drift ${money(row.dollarsObserved ?? 0)}.`,
    move: 'Confirm pack size is the same on both invoices, then accept, substitute, or draft a vendor question for human send. Do not treat this as recovered cash.',
    dollarsObserved: row.dollarsObserved,
    sourceStatus: 'unverified',
    claimBoundary: CLAIM_BOUNDARY,
    proof: vendorProof(row),
  };
}

function missingPriorAction(row?: VendorDriftSkuRow): ActionShiftAction {
  const target = row ? `${row.vendor} ${row.sku}` : 'the uploaded SKUs';
  return {
    id: 'vendor-drift',
    instanceKey: `vendor-drift:missing-prior:${row?.sku || 'packet'}`,
    title: 'Get the prior-period invoice before calling vendor drift',
    owner: 'Chef or kitchen manager',
    evidence: `Current invoice lines exist for ${target}, but the prior comparable period is Missing Evidence. That is not $0 and not savings.`,
    move: 'Upload or forward the previous comparable invoice for the same vendor. Do not invent a baseline price.',
    dollarsObserved: null,
    sourceStatus: 'unverified',
    claimBoundary: CLAIM_BOUNDARY,
    proof: vendorProof(),
  };
}

export function buildVendorDriftActionShift(input: {
  store?: string;
  documents: Array<{ text: string; filename?: string }>;
}): { ok: true; result: ActionShiftResult; compare: VendorDriftCompareResult } | { ok: false; error: string } {
  if (!input.documents.length) {
    return { ok: false, error: 'Paste or upload a current vendor invoice first.' };
  }

  const parsed = input.documents.map((doc) => parseVendorInvoice(doc.text, doc.filename || ''));
  const readable = parsed.flatMap((doc) => doc.lines).filter((line) => line.status === 'readable');
  if (!readable.length) {
    return { ok: false, error: 'Could not read SKU, vendor, unit price, and period from that invoice. Native-text CSV or PDF, not a portal login.' };
  }

  const compare = compareVendorInvoiceDocuments(parsed);
  const actions: ActionShiftAction[] = compare.flagged.slice(0, 3).map((row, index) => flaggedAction(row, index));
  if (actions.length === 0) {
    const missing = compare.rows.find((row) => row.evidenceState === 'missing-evidence')
      ?? (compare.priorPeriod ? undefined : compare.rows[0]);
    actions.push(missingPriorAction(missing));
  }

  const morningActions = actions.slice(0, 3);
  const missingEvidence = [
    ...compare.missingEvidence,
    ...compare.rows.filter((row) => row.missingEvidence).map((row) => row.missingEvidence as string),
  ].filter((line, index, all) => all.indexOf(line) === index);

  const store = input.store?.trim() || 'Unspecified store';
  const businessDate = compare.currentPeriod || 'Unspecified business date';
  const flaggedCount = compare.flagged.length;
  const summary = flaggedCount
    ? `${morningActions.length} ranked vendor-drift action${morningActions.length === 1 ? '' : 's'} from ${flaggedCount} SKU${flaggedCount === 1 ? '' : 's'} above 5% upward unit-price drift. Per-unit dollars only; two periods required.`
    : 'No two-period SKU crossed 5% upward drift. Missing prior period stays Missing Evidence — not $0.';

  return {
    ok: true,
    compare,
    result: {
      store,
      businessDate,
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
  return POS_SCORE[action.id] ?? 0;
}

export function feedVendorDriftIntoActionShift(
  pos: ActionShiftResult | null,
  vendor: ActionShiftResult | null,
): ActionShiftResult | null {
  if (!pos && !vendor) return null;
  if (!pos) return vendor;
  if (!vendor) return pos;

  const combined = [...vendor.morningActions, ...pos.morningActions]
    .sort((left, right) => actionScore(right) - actionScore(left))
    .slice(0, 3);

  const nightCloseCheck = combined.map((action) => action.proof.nightCheck);
  const dropClosePacketEvidence = pos.morningActions.some((action) => action.id === 'close-packet')
    && combined.every((action) => action.id !== 'close-packet');
  const missingEvidence = [...new Set([
    ...vendor.missingEvidence,
    ...pos.missingEvidence.filter((line) => (
      dropClosePacketEvidence ? !/complete same-scope close packet/i.test(line) : true
    )),
  ])];

  const vendorSelected = combined.some((action) => action.id === 'vendor-drift');
  return {
    store: pos.store,
    businessDate: pos.businessDate !== 'Unspecified business date' ? pos.businessDate : vendor.businessDate,
    sourceStatus: 'unverified',
    summary: vendorSelected
      ? `${combined.length} ranked action${combined.length === 1 ? '' : 's'} mixing yesterday's close and vendor unit-price drift. Verify against source evidence before acting.`
      : pos.summary,
    morningActions: combined,
    nightCloseCheck,
    missingEvidence,
    policy: pos.policy,
  };
}
