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
  buildVendorDriftActionShift,
  feedVendorDriftIntoActionShift,
} from './vendorDriftActionShift';
import { looksLikeVendorInvoice } from './vendorInvoiceParse';

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
  families: Array<'z-summary' | 'hourly' | 'void-promo' | 'vendor-invoice'>;
  injectionSuspected: boolean;
  sales: DeskNumber;
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
  const labor = z?.laborDollars ?? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Labor Summary' };
  const voidField = voids?.voids ?? z?.voids ?? { value: null, state: 'missing-evidence' as const, sourceLabel: '# Voids' };
  const promoField = voids?.promotions ?? z?.promotions ?? { value: null, state: 'missing-evidence' as const, sourceLabel: 'Promo' };

  const salesValue = moneyLine(net, 'Z-report Subtotal / net sales', missingEvidence);
  let actionShift: ActionShiftResult | null = null;
  let actionShiftError: string | null = null;
  if (salesValue != null && salesValue > 0) {
    const built = buildActionShift({
      store: input.store || z?.store || 'Unspecified store',
      businessDate: z?.businessDate || hourly?.businessDate || voids?.businessDate || undefined,
      grossSales: salesValue,
      laborDollars: moneyLine(labor, 'Labor Summary · Total', missingEvidence),
      expectedCash: cashStatus === 'entered' ? z?.expectedCash.value ?? undefined : undefined,
      enteredDeposit: cashStatus === 'entered' ? z?.actualDeposit.value ?? undefined : undefined,
      cashEntered: cashStatus === 'entered',
      payouts: moneyLine(z?.payouts ?? { value: null, state: 'missing-evidence', sourceLabel: 'Pay Outs' }, 'Pay Outs', []),
      voids: moneyLine(voidField, '# Voids', missingEvidence),
      promotions: moneyLine(promoField, 'Promo', []),
      lateDeliveryCount: z?.lateDeliveryCount ?? undefined,
      lateDeliverySales: z?.lateDeliverySales.value ?? undefined,
      averageDeliveryMinutes: z?.averageDeliveryMinutes ?? undefined,
    });
    if (built.ok) actionShift = built.result;
    else actionShiftError = built.error;
  } else {
    actionShiftError = 'No net sales on the Z. Missing Evidence — not a $0 night.';
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
    sales: deskMoney('Net sales', net),
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
}): DeskClose {
  const missing = missingMoneyField('Vendor invoice desk — POS close not in this packet');
  return {
    store: input.store || input.vendorShift.store,
    businessDate: input.vendorShift.businessDate === 'Unspecified business date'
      ? null
      : input.vendorShift.businessDate,
    channel: input.channel,
    families: ['vendor-invoice'],
    injectionSuspected: Boolean(input.injectionSuspected),
    sales: deskMoney('Net sales', missing),
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
    missingEvidence: input.vendorShift.missingEvidence,
    actionShift: input.vendorShift,
    actionShiftError: null,
  };
}

export function ingestCloseDocuments(
  docs: IntakeDocument[],
  store?: string,
): { ok: true; desk: DeskClose } | { ok: false; error: string; status: number } {
  if (!docs.length) {
    return { ok: false, error: 'Paste, upload, or forward yesterday\'s close first.', status: 400 };
  }
  let z: PdqZSummary | undefined;
  let hourly: PdqHourly | undefined;
  let voids: PdqVoidPromo | undefined;
  const invoiceDocs: IntakeDocument[] = [];
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

  if (!z && !hourly && !voids) {
    if (vendorShift) {
      return {
        ok: true,
        desk: buildVendorInvoiceDesk({ store, channel, vendorShift, injectionSuspected }),
      };
    }
    return {
      ok: false,
      error: vendorBuilt && !vendorBuilt.ok
        ? vendorBuilt.error
        : 'Could not read a PDQ Z, Hourly, Void/Promo, or vendor invoice from that text. Paste native text — no POS password.',
      status: 422,
    };
  }

  const desk = buildDeskFromPdqParts({ store, channel, z, hourly, voids, injectionSuspected });
  if (vendorShift) {
    desk.families = [...desk.families, 'vendor-invoice'];
    desk.actionShift = feedVendorDriftIntoActionShift(desk.actionShift, vendorShift);
    desk.missingEvidence = [...new Set([
      ...desk.missingEvidence,
      ...vendorShift.missingEvidence,
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
  'photo',
  'other-source',
] as const;

export type ProofKind = typeof PROOF_KINDS[number];
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
}): { ok: true; state: ProofOutcome } | { ok: false; error: string } {
  if (input.outcome === 'verified') {
    if (!input.proofKind || input.proofKind === 'verbal') {
      return { ok: false, error: 'A verbal yes does not close the action. Attach the proof object from the shift.' };
    }
    if (!input.proofKind || !PROOF_KINDS.includes(input.proofKind as ProofKind)) {
      return { ok: false, error: 'Choose a source proof object (deposit slip, close, clock, ticket, invoice packet, or exception log).' };
    }
  }
  if (input.outcome === 'acknowledged') {
    return { ok: true, state: 'acknowledged' };
  }
  if (input.outcome === 'verified') return { ok: true, state: 'verified' };
  return { ok: true, state: input.outcome };
}
