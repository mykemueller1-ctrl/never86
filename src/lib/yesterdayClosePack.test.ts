import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ingestCloseDocuments } from './deskClose';
import { parsePdqZSummary } from './pdqEodParse';
import { TOM_ORDER_PATH, buildStaffRoleDayDesk } from './staffRoleDayPack';
import {
  OPERATOR_SUPPLIED_CLOSES,
  YESTERDAY_CLOSE_FIELD_MAP,
  YESTERDAY_CLOSE_STORE,
  ingestOperatorSuppliedClose,
  operatorCloseForDate,
  ownerYesterdayCloseStrip,
  serializeOperatorCloseShorthand,
} from './yesterdayClosePack';

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), '../../tests/fixtures/pdq');
const load = (name: string) => readFileSync(join(fixtureDir, name), 'utf8');

describe('8/26 and 8/27 yesterday-close pack', () => {
  it('documents the same PDQ field map used for 8/24', () => {
    expect(YESTERDAY_CLOSE_FIELD_MAP).toEqual(expect.arrayContaining([
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
      'deliveryChannel=in_house',
    ]));
    expect(OPERATOR_SUPPLIED_CLOSES.map((row) => row.businessDate)).toEqual([
      '2026-08-26',
      '2026-08-27',
    ]);
  });

  it('parses the 8/26 PDQ fixture onto the desk: grand, mix, labor, late, in-house delivery', () => {
    const result = ingestCloseDocuments([
      { channel: 'file', filename: '8-26-2026 ZReport_Summary Sample Kitchen Lab.pdf', text: load('sample-z-8-26.txt') },
    ], YESTERDAY_CLOSE_STORE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.desk.businessDate).toBe('2026-08-26');
    expect(result.desk.sales.value).toBe(5195.97);
    expect(result.desk.grandTotal.value).toBe(5195.97);
    expect(result.desk.mix.food.value).toBe(2776);
    expect(result.desk.mix.beer.value).toBe(847);
    expect(result.desk.mix.liquor.value).toBe(597);
    expect(result.desk.mix.pop.value).toBe(147);
    expect(result.desk.labor.value).toBe(1407);
    expect(result.desk.lateDeliveryCount).toBe(5);
    expect(result.desk.lateDeliverySales.value).toBe(433);
    expect(result.desk.inHouseDeliveryCount).toBe(21);
    expect(result.desk.inHouseDeliverySales.value).toBe(957);
    expect(result.desk.deliveryChannel).toBe('in_house');
    expect(result.desk.missingEvidence.some((line) => /in-house, not DoorDash/i.test(line))).toBe(true);
  });

  it('parses the 8/27 PDQ fixture including expected cash 1351.46 with unentered actual', () => {
    const result = ingestCloseDocuments([
      { channel: 'file', filename: '8-27-2026 ZReport_Summary Sample Kitchen Lab.pdf', text: load('sample-z-8-27.txt') },
    ], YESTERDAY_CLOSE_STORE);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.desk.businessDate).toBe('2026-08-27');
    expect(result.desk.sales.value).toBe(4386.65);
    expect(result.desk.mix.food.value).toBe(2409);
    expect(result.desk.labor.value).toBe(1448);
    expect(result.desk.lateDeliveryCount).toBe(4);
    expect(result.desk.lateDeliverySales.value).toBe(152);
    expect(result.desk.inHouseDeliveryCount).toBe(15);
    expect(result.desk.inHouseDeliverySales.value).toBe(776);
    expect(result.desk.cash.status).toBe('unentered');
    const z = parsePdqZSummary(load('sample-z-8-27.txt'), '8-27-2026 ZReport_Summary Sample Kitchen Lab.pdf');
    expect(z.expectedCash.value).toBe(1351.46);
  });

  it('parses owner shorthand Late 5/433 and Delivery 21/957 as in-house', () => {
    const wed = operatorCloseForDate('2026-08-26')!;
    const z = parsePdqZSummary(
      serializeOperatorCloseShorthand(wed),
      '8-26-2026 ZReport_Summary Sample Kitchen Lab.pdf',
    );
    expect(z.grandTotal.value).toBe(5195.97);
    expect(z.mix.food.value).toBe(2776);
    expect(z.laborDollars.value).toBe(1407);
    expect(z.lateDeliveryCount).toBe(5);
    expect(z.lateDeliverySales.value).toBe(433);
    expect(z.inHouseDeliveryCount).toBe(21);
    expect(z.inHouseDeliverySales.value).toBe(957);
    expect(z.deliveryChannel).toBe('in_house');
  });

  it('owner seat ranks deposit before close and does not rank late tickets', () => {
    const wed = ingestOperatorSuppliedClose('2026-08-26', 'owner', 'pdq');
    const thu = ingestOperatorSuppliedClose('2026-08-27', 'owner', 'pdq');
    expect(wed.ok && thu.ok).toBe(true);
    if (!wed.ok || !thu.ok) return;
    expect(wed.desk.actionShift?.morningActions.map((action) => action.id)).toContain('cash-proof');
    expect(wed.desk.actionShift?.morningActions.map((action) => action.id)).not.toContain('delivery-clock');
    expect(thu.desk.actionShift?.morningActions.map((action) => action.id)).toContain('cash-proof');
    expect(thu.desk.actionShift?.morningActions.map((action) => action.id)).not.toContain('delivery-clock');
    expect(thu.desk.actionShift?.morningActions[0]).toEqual(expect.objectContaining({
      id: 'cash-proof',
      owner: 'Owner',
      title: 'Run the deposit before close',
    }));
    expect(thu.desk.actionShift?.morningActions[0].evidence).toMatch(/deposit was there/i);
    expect(thu.desk.actionShift?.morningActions[0].evidence).toMatch(/not driver late/i);
    expect(thu.desk.actionShift?.morningActions[0].claimBoundary).toMatch(/not a shortage/i);
    expect(thu.desk.actionShift?.morningActions[0].proof.verbalYesCloses).toBe(false);
  });

  it('kitchen seat ranks late tickets, not the drawer, and uses ticket → driver area → dispatch', () => {
    const thu = ingestOperatorSuppliedClose('2026-08-27', 'kitchen_manager', 'pdq');
    expect(thu.ok).toBe(true);
    if (!thu.ok) return;
    expect(thu.desk.actionShift?.morningActions.map((action) => action.id)).toContain('delivery-clock');
    expect(thu.desk.actionShift?.morningActions.map((action) => action.id)).not.toContain('cash-proof');
    const late = thu.desk.actionShift?.morningActions.find((action) => action.id === 'delivery-clock');
    expect(late?.move).toMatch(/ticket out of the printer/i);
    expect(late?.move).toMatch(/driver area/i);
    expect(late?.move).toMatch(/dispatch/i);
    expect(late?.proof.nightCheck).toMatch(/ticket → driver area → dispatch/i);
  });

  it('owner strip on 8/26 and 8/27 stays deposit-first with in-house delivery', () => {
    const wed = ownerYesterdayCloseStrip('2026-08-26');
    const thu = ownerYesterdayCloseStrip('2026-08-27');
    expect(wed?.grandTotal).toBe('$5,195.97');
    expect(wed?.late).toBe('5 / $433.00');
    expect(wed?.inHouseDelivery).toBe('21 / $957.00');
    expect(wed?.move).toBe('Deposit before close. Not late tickets.');
    expect(thu?.cash).toMatch(/1,351\.46/);
    expect(thu?.cash).toMatch(/deposit was there/i);
    expect(thu?.deliveryNote).toBe('In-house delivery, not DoorDash.');
  });

  it('keeps Tom\'s order path on the kitchen desk and invents no roster names', () => {
    const friday = buildStaffRoleDayDesk({ seatKey: 'kitchen_manager', weekday: 'Friday' });
    const blob = JSON.stringify(friday);
    expect(blob).toContain(TOM_ORDER_PATH);
    expect(blob).toContain('Friday and Saturday: three drivers.');
    expect(blob).toMatch(/Tom/);
    expect(blob).not.toMatch(/karlee|sturtz|ashley|holding/i);
  });
});
