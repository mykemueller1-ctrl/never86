import { buildActionShift, type ActionShiftAction, type ActionShiftResult } from './actionShift';
import { scanInjection, scanIntakeSecrets, type IntakeChannel, type IntakeDocument } from './closeIntake';
import {
  parsePdqNativeText,
  type HourlyRow,
  type MoneyEvidence,
  type PdqHourly,
  type PdqVoidPromo,
  type PdqZSummary,
} from './pdqEodParse';
import {
  looksLikePurchaseOrder,
  looksLikeTheoreticalUsage,
} from './poReceiveParse';
import {
  buildPoReceiveUsageActionShift,
  feedPoReceiveUsageIntoActionShift,
} from './poReceiveUsageActionShift';
import {
  buildVendorDriftActionShift,
  feedVendorDriftIntoActionShift,
} from './vendorDriftActionShift';
import { looksLikeVendorInvoice } from './vendorInvoiceParse';
import {
  buildVendorSilenceActionShift,
  feedVendorSilenceIntoActionShift,
} from './vendorSilenceActionShift';
import { looksLikeVendorSilence } from './vendorSilenceParse';

export type DeskNumber = {
  label: string;
  value: number | null;
  display: string;
  state: MoneyEvidence['state'];
};

export type DeskClose = {
  store: string;
  businessDate: string | null;
  channel: IntakeChannel;
  families: Array<'z-summary' | 'hourly' | 'void-promo' | 'vendor-invoice' | 'purchase-order' | 'theoretical-usage' | 'vendor-silence'>;
  injectionSuspected: boolean;
  sales: DeskNumber;
  grandTotal: DeskNumber;
  mix: {
    food: DeskNumber;
    beer: DeskNumber;
    liquor: DeskNumber;
    pop: DeskNumber;
    wine: DeskNumber;
  };
  labor: DeskNumber;
  cash: DeskNumber & { status: PdqZSummary['cashStatus'] };
  hourlyPeak: HourlyRow | null;
  voids: DeskNumber;
  lateDeliveryCount: number | null;
  lateDeliverySales: DeskNumber;
  inHouseDeliveryCount: number | null;
  inHouseDeliverySales: DeskNumber;
  deliveryChannel: 'in_house' | null;
  missingEvidence: string[];
  actionShift: ActionShiftResult | null;
  actionShiftError: string | null;
};

function deskMoney(label: string, field: MoneyEvidence): DeskNumber {
  return {
    label,
    value: field.value,
    display: field.value == null
      ? 'Missing Evidence'
      : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(field.value),
    state: field.state,
  };
}

function moneyLine(field: MoneyEvidence, name: string, missing: string[]): number | undefined {
  if (field.state === 'missing-evidence' || field.value == null) {
    missing.push(name);
    return undefined;
  }
  return field.value;
}

export function buildDeskFromPdqParts(input: {
  store?: string;
  channel: IntakeChannel;
  z?: PdqZSummary;
  hourly?: PdqHourly;
  voids?: PdqVoidPromo;
  injectionSuspected?: boolean;
  seat?: 'owner' | 'kitchen_manager' | 'default';
  ownerSaidDepositPresent?: boolean;
}): DeskClose {
  const missingEvidence: string[] = [];
  const z = input.z;
  const hourly = input.hourly;
  const voids = input.voids;
  const families: DeskClose['families'] = [];
  if (z) families.push('z-summary');
  if (hourly) families.push('hourly');
  if (voids) families.push('void-promo');

  if (!z) missingEvidence.push('PDQ ZReport_Summary for the same store and business date.');
  if (!hourly) missingEvidence.push('PDQ Hourly_Sales_Report for the same business date.');
  if (!voids) missingEvidence.push('PDQ Void_Promo_Report for the same business date.');

  const food = z?.mix.food ?? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Food' };
  const beer = z?.mix.beer ?? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Beer' };
  const liquor = z?.mix.liquor ?? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Liquor' };
  const pop = z?.mix.pop ?? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Pop' };
  const wine = z?.mix.wine ?? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Wine' };
  for (const [field, name] of [
    [food, 'Menu Category · Food'],
    [beer, 'Menu Category · Beer'],
    [liquor, 'Menu Category · Liquor'],
    [pop, 'Menu Category · Pop'],
  ] as const) {
    if (field.state === 'missing-evidence') missingEvidence.push(`${name} is Missing Evidence, not $0.`);
  }

  const cashStatus = z?.cashStatus ?? 'missing-evidence';
  const cashField = cashStatus === 'unentered'
    ? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Cash (unentered POS field)' }
    : (z?.actualDeposit ?? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Actual Deposit' });
  if (cashStatus === 'unentered') {
    missingEvidence.push('Cash was not entered in the POS. Unentered cash is not a shortage.');
  }

  const net = z?.netSales ?? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Subtotal' };
  const grand = z?.grandTotal ?? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Grand Total' };
  const labor = z?.laborDollars ?? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Labor Summary' };
  const voidField = voids?.voids ?? z?.voids ?? { value: null, state: 'missing-evidence' as const, sourceLabel: '# Voids' };
  const promoField = voids?.promotions ?? z?.promotions ?? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Promo' };
  const lateSales = z?.lateDeliverySales ?? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Late Deliverys' };
  const inHouseSales = z?.inHouseDeliverySales ?? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Sales Summary · Delivery (in-house)' };
  const salesField = net.value != null ? net : grand;

  const salesValue = moneyLine(salesField, salesField.sourceLabel, missingEvidence);
  if (net.value == null && grand.value != null) {
    missingEvidence.push('Subtotal is Missing Evidence. Desk is using Grand Total until net sales land.');
  }
  if (z?.deliveryChannel === 'in_house' || (z?.inHouseDeliveryCount ?? 0) > 0 || (inHouseSales.value ?? 0) > 0) {
    missingEvidence.push('Delivery on the Z is in-house, not DoorDash.');
  }
  if (input.seat === 'owner' && cashStatus === 'unentered') {
    missingEvidence.push('Owner seat: prove the deposit before close. Unentered cash is not driver late.');
  }
  let actionShift: ActionShiftResult | null = null;
  let actionShiftError: string | null = null;
  const ownerExpected = input.seat === 'owner' && z?.expectedCash.value != null && z.expectedCash.value > 0
    ? z.expectedCash.value
    : undefined;
  const enteredExpected = cashStatus === 'entered' ? z?.expectedCash.value ?? undefined : undefined;
  if (salesValue != null && salesValue > 0) {
    const built = buildActionShift({
      store: input.store || z?.store || 'Unspecified store',
      businessDate: z?.businessDate || hourly?.businessDate || voids?.businessDate || undefined,
      grossSales: salesValue,
      laborDollars: moneyLine(labor, 'Labor Summary · Total', missingEvidence),
      expectedCash: ownerExpected ?? enteredExpected,
      enteredDeposit: cashStatus === 'entered' ? z?.actualDeposit.value ?? undefined : undefined,
      cashEntered: cashStatus === 'entered',
      ownerSaidDepositPresent: input.ownerSaidDepositPresent,
      seat: input.seat,
      payouts: moneyLine(z?.payouts ?? { value: null, state: 'missing-evidence', sourceLabel: 'Pay Outs' }, 'Pay Outs', []),
      voids: moneyLine(voidField, '# Voids', missingEvidence),
      promotions: moneyLine(promoField, 'Promo', []),
      lateDeliveryCount: z?.lateDeliveryCount ?? undefined,
      lateDeliverySales: lateSales.value ?? undefined,
      averageDeliveryMinutes: z?.averageDeliveryMinutes ?? undefined,
      inHouseDeliveryCount: z?.inHouseDeliveryCount ?? undefined,
      inHouseDeliverySales: inHouseSales.value ?? undefined,
    });
    if (built.ok) actionShift = built.result;
    else actionShiftError = built.error;
  } else {
    actionShiftError = 'No Grand Total or Subtotal on the Z. Missing Evidence — not a $0 night.';
  }

  const uniqueMissing = [...new Set([
    ...missingEvidence,
    ...(actionShift?.missingEvidence ?? []),
  ])];

  return {
    store: input.store || z?.store || 'Unspecified store',
    businessDate: z?.businessDate || hourly?.businessDate || voids?.businessDate || null,
    channel: input.channel,
    families,
    injectionSuspected: Boolean(input.injectionSuspected),
    sales: deskMoney(salesField.sourceLabel === 'Grand Total' ? 'Grand total' : 'Net sales', salesField),
    grandTotal: deskMoney('Grand total', grand),
    mix: {
      food: deskMoney('Food', food),
      beer: deskMoney('Beer', beer),
      liquor: deskMoney('Liquor', liquor),
      pop: deskMoney('Pop', pop),
      wine: deskMoney('Wine', wine),
    },
    labor: deskMoney('Labor', labor),
    cash: { ...deskMoney('Cash', cashField), status: cashStatus },
    hourlyPeak: hourly?.peak ?? null,
    voids: deskMoney('Voids', voidField),
    lateDeliveryCount: z?.lateDeliveryCount ?? null,
    lateDeliverySales: deskMoney('Late tickets', lateSales),
    inHouseDeliveryCount: z?.inHouseDeliveryCount ?? null,
    inHouseDeliverySales: deskMoney('In-house delivery', inHouseSales),
    deliveryChannel: z?.deliveryChannel ?? null,
    missingEvidence: uniqueMissing,
    actionShift,
    actionShiftError,
  };
}

function missingMoneyField(label: string): MoneyEvidence {
  return { value: null, state: 'missing-evidence', sourceLabel: label };
}

export function buildVendorInvoiceDesk(input: {
  store?: string;
  channel: IntakeChannel;
  vendorShift: ActionShiftResult;
  injectionSuspected?: boolean;
  families?: DeskClose['families'];
}): DeskClose {
  const missing = missingMoneyField('Vendor invoice desk — POS close not in this packet');
  return {
    store: input.store || input.vendorShift.store,
    businessDate: input.vendorShift.businessDate === 'Unspecified business date'
      ? null
      : input.vendorShift.businessDate,
    channel: input.channel,
    families: input.families?.length ? input.families : ['vendor-invoice'],
    injectionSuspected: Boolean(input.injectionSuspected),
    sales: deskMoney('Net sales', missing),
    grandTotal: deskMoney('Grand total', missingMoneyField('Grand Total')),
    mix: {
      food: deskMoney('Food', missingMoneyField('Food')),
      beer: deskMoney('Beer', missingMoneyField('Beer')),
      liquor: deskMoney('Liquor', missingMoneyField('Liquor')),
      pop: deskMoney('Pop', missingMoneyField('Pop')),
      wine: deskMoney('Wine', missingMoneyField('Wine')),
    },
    labor: deskMoney('Labor', missingMoneyField('Labor')),
    cash: { ...deskMoney('Cash', missingMoneyField('Cash')), status: 'missing-evidence' },
    hourlyPeak: null,
    voids: deskMoney('Voids', missingMoneyField('Voids')),
    lateDeliveryCount: null,
    lateDeliverySales: deskMoney('Late tickets', missingMoneyField('Late Deliverys')),
    inHouseDeliveryCount: null,
    inHouseDeliverySales: deskMoney('In-house delivery', missingMoneyField('Sales Summary · Delivery (in-house)')),
    deliveryChannel: null,
    missingEvidence: input.vendorShift.missingEvidence,
    actionShift: input.vendorShift,
    actionShiftError: null,
  };
}

function intakeFamilies(input: {
  poDocs: IntakeDocument[];
  invoiceDocs: IntakeDocument[];
  usageDocs: IntakeDocument[];
  silenceDocs: IntakeDocument[];
}): DeskClose['families'] {
  const families: DeskClose['families'] = [];
  if (input.poDocs.length) families.push('purchase-order');
  if (input.invoiceDocs.length) families.push('vendor-invoice');
  if (input.usageDocs.length) families.push('theoretical-usage');
  if (input.silenceDocs.length) families.push('vendor-silence');
  return families;
}

export function ingestCloseDocuments(
  docs: IntakeDocument[],
  store?: string,
  options?: {
    seat?: 'owner' | 'kitchen_manager' | 'default';
    ownerSaidDepositPresent?: boolean;
  },
): { ok: true; desk: DeskClose } | { ok: false; error: string; status: number } {
  if (!docs.length) {
    return { ok: false, error: 'Paste, upload, or forward yesterday\'s close first.', status: 400 };
  }
  let z: PdqZSummary | undefined;
  let hourly: PdqHourly | undefined;
  let voids: PdqVoidPromo | undefined;
  const invoiceDocs: IntakeDocument[] = [];
  const poDocs: IntakeDocument[] = [];
  const usageDocs: IntakeDocument[] = [];
  const silenceDocs: IntakeDocument[] = [];
  let injectionSuspected = false;
  let channel: IntakeChannel = docs[0].channel;

  for (const doc of docs) {
    const secret = scanIntakeSecrets(doc.text);
    if (secret) return { ok: false, error: secret.error, status: 400 };
    if (scanInjection(doc.text)) injectionSuspected = true;
    const parsed = parsePdqNativeText(doc.text, doc.filename || '');
    if (parsed.family === 'z-summary') z = parsed;
    else if (parsed.family === 'hourly') hourly = parsed;
    else if (parsed.family === 'void-promo') voids = parsed;
    else if (looksLikeVendorSilence(doc.text, doc.filename || '')) silenceDocs.push(doc);
    else if (looksLikeTheoreticalUsage(doc.text, doc.filename || '')) usageDocs.push(doc);
    else if (looksLikePurchaseOrder(doc.text, doc.filename || '')) poDocs.push(doc);
    else if (looksLikeVendorInvoice(doc.text, doc.filename || '')) invoiceDocs.push(doc);
    if (doc.channel === 'email') channel = 'email';
  }

  const vendorBuilt = invoiceDocs.length
    ? buildVendorDriftActionShift({
      store,
      documents: invoiceDocs.map((doc) => ({ text: doc.text, filename: doc.filename })),
    })
    : null;
  const vendorShift = vendorBuilt?.ok ? vendorBuilt.result : null;

  const poBuilt = (poDocs.length || invoiceDocs.length || usageDocs.length) && (poDocs.length || usageDocs.length)
    ? buildPoReceiveUsageActionShift({
      store,
      purchaseOrders: poDocs.map((doc) => ({ text: doc.text, filename: doc.filename })),
      invoices: invoiceDocs.map((doc) => ({ text: doc.text, filename: doc.filename })),
      usage: usageDocs.map((doc) => ({ text: doc.text, filename: doc.filename })),
    })
    : null;
  const poShift = poBuilt?.ok ? poBuilt.result : null;

  const silenceBuilt = silenceDocs.length
    ? buildVendorSilenceActionShift({
      store,
      documents: silenceDocs.map((doc) => ({ text: doc.text, filename: doc.filename })),
    })
    : null;
  const silenceShift = silenceBuilt?.ok ? silenceBuilt.result : null;

  if (!z && !hourly && !voids) {
    const merged = feedVendorSilenceIntoActionShift(
      feedPoReceiveUsageIntoActionShift(vendorShift, poShift),
      silenceShift,
    );
    if (merged) {
      return {
        ok: true,
        desk: buildVendorInvoiceDesk({
          store,
          channel,
          vendorShift: merged,
          injectionSuspected,
          families: intakeFamilies({ poDocs, invoiceDocs, usageDocs, silenceDocs }),
        }),
      };
    }
    return {
      ok: false,
      error: silenceBuilt && !silenceBuilt.ok
        ? silenceBuilt.error
        : poBuilt && !poBuilt.ok
          ? poBuilt.error
          : vendorBuilt && !vendorBuilt.ok
            ? vendorBuilt.error
            : 'Could not read a PDQ Z, Hourly, Void/Promo, vendor invoice, purchase order, theoretical-usage, or vendor-silence packet from that text. Paste native text — no POS or vendor-portal password.',
      status: 422,
    };
  }

  const desk = buildDeskFromPdqParts({
    store,
    channel,
    z,
    hourly,
    voids,
    injectionSuspected,
    seat: options?.seat,
    ownerSaidDepositPresent: options?.ownerSaidDepositPresent,
  });
  if (vendorShift) {
    desk.families = [...desk.families, 'vendor-invoice'];
    desk.actionShift = feedVendorDriftIntoActionShift(desk.actionShift, vendorShift);
    desk.missingEvidence = [...new Set([
      ...desk.missingEvidence,
      ...vendorShift.missingEvidence,
    ])];
    if (desk.actionShift) desk.actionShiftError = null;
  }
  if (poShift) {
    desk.families = [...new Set([
      ...desk.families,
      ...intakeFamilies({ poDocs, invoiceDocs, usageDocs, silenceDocs: [] }),
    ])] as DeskClose['families'];
    desk.actionShift = feedPoReceiveUsageIntoActionShift(desk.actionShift, poShift);
    desk.missingEvidence = [...new Set([
      ...desk.missingEvidence,
      ...poShift.missingEvidence,
    ])];
    if (desk.actionShift) desk.actionShiftError = null;
  }
  if (silenceShift) {
    desk.families = [...new Set([...desk.families, 'vendor-silence'])] as DeskClose['families'];
    desk.actionShift = feedVendorSilenceIntoActionShift(desk.actionShift, silenceShift);
    desk.missingEvidence = [...new Set([
      ...desk.missingEvidence,
      ...silenceShift.missingEvidence,
    ])];
    if (desk.actionShift) desk.actionShiftError = null;
  }
  return { ok: true, desk };
}

export const PROOF_KINDS = [
  'deposit-slip',
  'pos-close',
  'time-clock',
  'schedule',
  'ticket-detail',
  'exception-log',
  'invoice-packet',
  'po-packet',
  'receiving-log',
  'photo',
  'other-source',
] as const;

export const LAST_SEEN_RESET_PROOF_KINDS = [
  'receiving-log',
  'invoice-packet',
  'po-packet',
  'exception-log',
] as const;

export type ProofKind = typeof PROOF_KINDS[number];
export type LastSeenResetProofKind = typeof LAST_SEEN_RESET_PROOF_KINDS[number];
export type ProofOutcome =
  | 'acknowledged'
  | 'done-awaiting-proof'
  | 'verified'
  | 'not-done'
  | 'data-missing'
  | 'fix-failed';

export function applyNightProof(input: {
  action: Pick<ActionShiftAction, 'id' | 'proof'>;
  outcome: ProofOutcome;
  proofKind?: string;
  proofNote?: string;
}): { ok: true; state: ProofOutcome; lastSeenReset?: boolean } | { ok: false; error: string } {
  if (input.outcome === 'verified') {
    if (!input.proofKind || input.proofKind === 'verbal') {
      return { ok: false, error: 'A verbal yes does not close the action. Attach the proof object from the shift.' };
    }
    if (input.action.id === 'vendor-silence') {
      if (!LAST_SEEN_RESET_PROOF_KINDS.includes(input.proofKind as LastSeenResetProofKind)) {
        return {
          ok: false,
          error: 'Closing vendor silence requires proof that resets last-seen: receiving log, invoice, confirmation, or operator-approved exception.',
        };
      }
      return { ok: true, state: 'verified', lastSeenReset: true };
    }
    if (!PROOF_KINDS.includes(input.proofKind as ProofKind)) {
      return { ok: false, error: 'Choose a source proof object (deposit slip, close, clock, ticket, invoice packet, or exception log).' };
    }
  }
  if (input.outcome === 'acknowledged') {
    return { ok: true, state: 'acknowledged' };
  }
  if (input.outcome === 'verified') return { ok: true, state: 'verified' };
  return { ok: true, state: input.outcome };
}
