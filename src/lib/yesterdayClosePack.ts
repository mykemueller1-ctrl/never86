/**
 * Operator-supplied yesterday-close field maps for 2026-08-26 and 2026-08-27.
 *
 * Same ingest path as the 8/24 Sample Kitchen Lab PDQ packet: parse → desk → Action Shift.
 * Delivery on the Z is in-house, not DoorDash. Typed values stay Unverified until a source PDF is attached.
 * Owner seat: deposit before close. Not late tickets.
 * Kitchen seat (Tom): late on Z / dispatch. Not the drawer.
 *
 * No phones, PINs, roster names, or homepage dump. Owner/staff surfaces are noindex.
 */

import { buildDeskFromPdqParts, ingestCloseDocuments, type DeskClose } from './deskClose';
import { parsePdqZSummary, type PdqZSummary } from './pdqEodParse';

export const YESTERDAY_CLOSE_PACK_ID = 'ctap-yesterday-close-826-827';
export const YESTERDAY_CLOSE_PACK_STATUS = 'drafted' as const;
export const YESTERDAY_CLOSE_STORE = 'Sample Kitchen Lab';

export const YESTERDAY_CLOSE_FIELD_MAP = [
  'businessDate',
  'grandTotal',
  'food',
  'beer',
  'liquor',
  'pop',
  'laborDollars',
  'lateDeliveryCount',
  'lateDeliverySales',
  'inHouseDeliveryCount',
  'inHouseDeliverySales',
  'expectedCash',
  'ownerSaidDepositPresent',
  'deliveryChannel=in_house',
] as const;

export type OperatorSuppliedClose = {
  businessDate: '2026-08-26' | '2026-08-27';
  weekday: 'Wednesday' | 'Thursday';
  grandTotal: number;
  food: number;
  beer: number;
  liquor: number;
  pop: number;
  laborDollars: number;
  lateDeliveryCount: number;
  lateDeliverySales: number;
  inHouseDeliveryCount: number;
  inHouseDeliverySales: number;
  expectedCash: number | null;
  ownerSaidDepositPresent: boolean;
  deliveryChannel: 'in_house';
};

export const OPERATOR_SUPPLIED_CLOSES: readonly OperatorSuppliedClose[] = [
  {
    businessDate: '2026-08-26',
    weekday: 'Wednesday',
    grandTotal: 5195.97,
    food: 2776,
    beer: 847,
    liquor: 597,
    pop: 147,
    laborDollars: 1407,
    lateDeliveryCount: 5,
    lateDeliverySales: 433,
    inHouseDeliveryCount: 21,
    inHouseDeliverySales: 957,
    expectedCash: null,
    ownerSaidDepositPresent: false,
    deliveryChannel: 'in_house',
  },
  {
    businessDate: '2026-08-27',
    weekday: 'Thursday',
    grandTotal: 4386.65,
    food: 2409,
    beer: 920,
    liquor: 487,
    pop: 131,
    laborDollars: 1448,
    lateDeliveryCount: 4,
    lateDeliverySales: 152,
    inHouseDeliveryCount: 15,
    inHouseDeliverySales: 776,
    expectedCash: 1351.46,
    ownerSaidDepositPresent: true,
    deliveryChannel: 'in_house',
  },
];

export function operatorCloseForDate(businessDate: string): OperatorSuppliedClose | null {
  return OPERATOR_SUPPLIED_CLOSES.find((row) => row.businessDate === businessDate) ?? null;
}

/** Native-text Z shape used by the 8/24 path. Store label stays Sample Kitchen Lab. */
export function serializeOperatorCloseAsPdq(close: OperatorSuppliedClose): string {
  const expected = close.expectedCash != null
    ? `Expected Cash: $${close.expectedCash.toFixed(2)}`
    : 'Expected Cash: $0.00';
  return [
    'Z Report / End Of Day',
    YESTERDAY_CLOSE_STORE,
    `Business Date: ${close.weekday === 'Wednesday' ? '8/26/2026' : '8/27/2026'}`,
    '',
    'Sales Summary',
    'Trans Type QTY Amount Avg Check % Last Year',
    `Delivery ${close.inHouseDeliveryCount} $${close.inHouseDeliverySales.toFixed(2)} $0.00 0.00 $0.00`,
    `Total: ${close.inHouseDeliveryCount} $${close.grandTotal.toFixed(2)}`,
    '',
    `Grand Total: $${close.grandTotal.toFixed(2)}`,
    expected,
    '',
    'Shift Deposit',
    'Dep Shift Expected Deposit Actual Deposit Over Under',
    close.expectedCash != null
      ? `1 $${close.expectedCash.toFixed(2)} $0.00 $0.00`
      : '1 $0.00 $0.00 $0.00',
    'Total: $0.00 $0.00 $0.00',
    '',
    'Labor Summary',
    'Job Description QTY Total %',
    `Total: 1 $${close.laborDollars.toFixed(2)} 0.00`,
    '',
    'Misc Summary',
    'Description Num Value',
    `Late Deliverys ${close.lateDeliveryCount} $${close.lateDeliverySales.toFixed(2)}`,
    '',
    'Menu Category',
    'Category Name QTY Total',
    `Food 1 $${close.food.toFixed(2)}`,
    `Beer 1 $${close.beer.toFixed(2)}`,
    `Liquor 1 $${close.liquor.toFixed(2)}`,
    `Pop 1 $${close.pop.toFixed(2)}`,
  ].join('\n');
}

/** Owner shorthand: Grand 5195.97 Food 2776 … Late 5/433 Delivery 21/957 */
export function serializeOperatorCloseShorthand(close: OperatorSuppliedClose): string {
  const cash = close.expectedCash != null ? ` Expected Cash ${close.expectedCash}` : '';
  return [
    `Z Report / End Of Day`,
    YESTERDAY_CLOSE_STORE,
    `Business Date: ${close.businessDate === '2026-08-26' ? '8/26/2026' : '8/27/2026'}`,
    `Grand ${close.grandTotal} Food ${close.food} Beer ${close.beer} Liquor ${close.liquor} Pop ${close.pop} Labor ${close.laborDollars} Late ${close.lateDeliveryCount}/${close.lateDeliverySales} Delivery ${close.inHouseDeliveryCount}/${close.inHouseDeliverySales}${cash}`,
  ].join('\n');
}

export function parseOperatorSuppliedClose(close: OperatorSuppliedClose, kind: 'pdq' | 'shorthand' = 'pdq'): PdqZSummary {
  const filename = close.businessDate === '2026-08-26'
    ? '8-26-2026 ZReport_Summary Sample Kitchen Lab.pdf'
    : '8-27-2026 ZReport_Summary Sample Kitchen Lab.pdf';
  const text = kind === 'pdq' ? serializeOperatorCloseAsPdq(close) : serializeOperatorCloseShorthand(close);
  return parsePdqZSummary(text, filename);
}

export function ingestOperatorSuppliedClose(
  businessDate: string,
  seat: 'owner' | 'kitchen_manager' | 'default' = 'default',
  kind: 'pdq' | 'shorthand' = 'pdq',
): { ok: true; desk: DeskClose; close: OperatorSuppliedClose } | { ok: false; error: string } {
  const close = operatorCloseForDate(businessDate);
  if (!close) return { ok: false, error: `No operator-supplied close for ${businessDate}.` };
  const filename = close.businessDate === '2026-08-26'
    ? '8-26-2026 ZReport_Summary Sample Kitchen Lab.pdf'
    : '8-27-2026 ZReport_Summary Sample Kitchen Lab.pdf';
  const ingested = ingestCloseDocuments(
    [{
      channel: 'paste',
      filename,
      text: kind === 'pdq' ? serializeOperatorCloseAsPdq(close) : serializeOperatorCloseShorthand(close),
    }],
    YESTERDAY_CLOSE_STORE,
    { seat, ownerSaidDepositPresent: close.ownerSaidDepositPresent },
  );
  if (!ingested.ok) return { ok: false, error: ingested.error };
  return { ok: true, desk: ingested.desk, close };
}

export function buildOwnerYesterdayCloseDesk(businessDate: string): ReturnType<typeof buildDeskFromPdqParts> | null {
  const close = operatorCloseForDate(businessDate);
  if (!close) return null;
  const z = parseOperatorSuppliedClose(close, 'pdq');
  return buildDeskFromPdqParts({
    store: YESTERDAY_CLOSE_STORE,
    channel: 'paste',
    z,
    seat: 'owner',
    ownerSaidDepositPresent: close.ownerSaidDepositPresent,
  });
}

export function ownerYesterdayCloseStrip(businessDate: string): {
  businessDate: string;
  weekday: string;
  grandTotal: string;
  food: string;
  beer: string;
  liquor: string;
  pop: string;
  labor: string;
  late: string;
  inHouseDelivery: string;
  cash: string;
  move: string;
  deliveryNote: string;
} | null {
  const close = operatorCloseForDate(businessDate);
  if (!close) return null;
  const money = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  return {
    businessDate: close.businessDate,
    weekday: close.weekday,
    grandTotal: money(close.grandTotal),
    food: money(close.food),
    beer: money(close.beer),
    liquor: money(close.liquor),
    pop: money(close.pop),
    labor: money(close.laborDollars),
    late: `${close.lateDeliveryCount} / ${money(close.lateDeliverySales)}`,
    inHouseDelivery: `${close.inHouseDeliveryCount} / ${money(close.inHouseDeliverySales)}`,
    cash: close.expectedCash != null
      ? `${money(close.expectedCash)} expected. Owner said the deposit was there.`
      : 'Expected cash not on this close.',
    move: 'Deposit before close. Not late tickets.',
    deliveryNote: 'In-house delivery, not DoorDash.',
  };
}

export const OWNER_YESTERDAY_CLOSE_DATES = OPERATOR_SUPPLIED_CLOSES.map((row) => row.businessDate);
