import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { allowPapersRescan, applyPapersScanEdit, drainPapersScan, enqueuePapersScan, papersScanSnapshot, resetPapersScanStore } from './papersScanJob';
import { papersSkuCompareForStore } from './papersInvoicePath';
import { extractPdfTokens } from './pdfTextTokens';
import { isoWeekKeyFromDate, parsePapersSkuLines, type PapersSkuRow } from './papersSkuParse';
import { papersSkuRowsForStore, replacePapersSkuDocument, resetPapersSkuStore } from './papersSkuStore';

function paper(tokens: string[]): string {
  return tokens.join('\n');
}

function row(lines: PapersSkuRow[], name: string): PapersSkuRow {
  const found = lines.find((line) => line.productName.value === name || line.itemCode.value === name);
  if (!found) throw new Error(`missing ${name}`);
  return found;
}

function flatePdf(content: string): Uint8Array {
  const raw = deflateSync(Buffer.from(content, 'latin1'));
  const head = Buffer.from(`%PDF-1.4\n1 0 obj\n<< /Length ${raw.length} /Filter /FlateDecode >>\nstream\n`);
  const tail = Buffer.from('\nendstream\nendobj\n%%EOF\n');
  return new Uint8Array(Buffer.concat([head, raw, tail]));
}

describe('papers SKU line parsers', () => {
  it('reads a synthetic foodservice invoice without multiplying qty by price', () => {
    const parsed = parsePapersSkuLines({
      filename: 'fixture-pfg.txt',
      text: paper([
        'Performance',
        'Foodservice',
        'Date:',
        '06/05/26',
        '06/05/26',
        '900001',
        '64',
        'DRY',
        '1',
        'CS',
        '6/#10CANFixture',
        'Sauce',
        'TH100',
        '1',
        '1',
        'EA',
        '1.250',
        '**',
        '12.50',
        '2',
        'CS',
        '1/50LBFixture',
        'Dough',
        '24400',
        '2',
        '2',
        'EA',
        '0.082',
        '10.00',
        '20.00',
        '1',
        'CS',
        '1/100Fixture',
        'Canliner',
        'TH200',
        '1',
        '1',
        'EA',
        '3.000',
        '3.00',
      ]),
    });
    expect(parsed.lines).toHaveLength(3);
    expect(parsed.lines[0].isoWeek).toBe('2026-W23');
    expect(parsed.lines[0].documentNumber).toMatchObject({ honesty: 'Verified', value: '900001' });
    expect(parsed.lines[0].vendor).toMatchObject({ honesty: 'Verified', value: 'Performance Foodservice' });
    const sauce = row(parsed.lines, 'TH100');
    expect(sauce.productName.value).toBe('6/#10 CANFixture Sauce');
    expect(sauce.itemCode).toMatchObject({ honesty: 'Verified', value: 'TH100' });
    expect(sauce.quantity).toMatchObject({ honesty: 'Verified', amount: 1 });
    expect(sauce.unit).toMatchObject({ value: 'CS' });
    expect(sauce.unitPrice).toMatchObject({ honesty: 'Verified', amount: 12.5 });
    expect(sauce.extendedPrice).toMatchObject({ honesty: 'Verified', amount: 12.5 });
    expect(sauce.category).toMatchObject({ honesty: 'Verified', value: 'food' });
    const dough = row(parsed.lines, '24400');
    expect(dough.productName.value).toContain('Dough');
    expect(dough.unitPrice.amount).toBe(10);
    expect(dough.extendedPrice.amount).toBe(20);
    expect(dough.extendedPrice.amount).not.toBeCloseTo(0.164, 3);
    expect(dough.quantity.amount).toBe(2);
    expect(dough.unit.value).toBe('CS');
    expect(row(parsed.lines, 'TH200').category.value).toBe('other');
  });

  it('keeps linen rental rows and a charge that sits after subtotal', () => {
    const parsed = parsePapersSkuLines({
      filename: 'fixture-vestis.txt',
      text: paper([
        'Vestis',
        'INVOICE DATE',
        '06/04/2026',
        'INVOICE NUMBER',
        '9000000001',
        'BILL QTY',
        'ABC123',
        'Fixture Towel',
        'L',
        'Rent',
        '4',
        '1.25',
        '5.00',
        'SUBTOTAL',
        'BAG001',
        'Fixture Bag',
        'OS',
        'Wash',
        '1',
        '2.00',
        '2.00',
        'Energy Surcharge',
        '1.50',
      ]),
    });
    expect(parsed.lines).toHaveLength(3);
    expect(parsed.lines[0].isoWeek).toBe(isoWeekKeyFromDate('2026-06-04'));
    expect(row(parsed.lines, 'Fixture Towel').extendedPrice.amount).toBe(5);
    expect(row(parsed.lines, 'Fixture Bag').itemCode.value).toBe('BAG001');
    const charge = row(parsed.lines, 'Energy Surcharge');
    expect(charge.quantity.honesty).toBe('Missing');
    expect(charge.unitPrice.honesty).toBe('Missing');
    expect(charge.extendedPrice).toMatchObject({ honesty: 'Verified', amount: 1.5 });
    expect(charge.category.value).toBe('other');
  });

  it('keeps flour as food and a souffle lid as other', () => {
    const parsed = parsePapersSkuLines({
      filename: 'fixture-northern.txt',
      text: paper([
        'Northern Lights',
        'Invoice Date:',
        '06/01/2026',
        'Invoice #:',
        '880002',
        'Item #',
        'Extended',
        '** DRY ITEMS **',
        '101',
        '000111222333',
        'Fixture Flour',
        '50LB',
        '1',
        '20.00',
        '20.00',
        '102',
        '000111222334',
        'Fixture Lid',
        '1/500',
        '3',
        '4.00',
        '12.00',
      ]),
    });
    expect(parsed.lines).toHaveLength(2);
    expect(row(parsed.lines, 'Fixture Flour').category).toMatchObject({ honesty: 'Verified', value: 'food' });
    expect(row(parsed.lines, 'Fixture Lid').category).toMatchObject({ honesty: 'Verified', value: 'other' });
    expect(parsed.lines[0].documentNumber.value).toBe('880002');
    expect(parsed.lines[0].documentDate.value).toBe('2026-06-01');
    expect(row(parsed.lines, 'Fixture Flour').itemCode.value).toBe('101');
    expect(row(parsed.lines, 'Fixture Flour').category.value).toBe('food');
    expect(row(parsed.lines, 'Fixture Lid').extendedPrice.amount).toBe(12);
    expect(row(parsed.lines, 'Fixture Lid').category.value).toBe('other');
    expect(row(parsed.lines, 'Fixture Lid').quantity.amount).toBe(3);
    expect(row(parsed.lines, 'Fixture Lid').unit.value).toBe('1/500');
  });

  it('keeps disposable boxes and lids as other without converting the printed pack', () => {
    const boxes = parsePapersSkuLines({
      filename: 'fixture-pfg-box.txt',
      text: paper([
        'Performance',
        'Foodservice',
        'Date:',
        '06/05/26',
        '06/05/26',
        '900001',
        'DRY',
        '1',
        'CS',
        '1/50Fixture',
        'Pizza Box',
        'BX100',
        '1',
        '1',
        'EA',
        '1.250',
        '**',
        '12.50',
        '1',
        'CS',
        '6/#10Fixture',
        'Sauce',
        'TH100',
        '1',
        '1',
        'EA',
        '2.000',
        '8.00',
      ]),
    });
    const box = row(boxes.lines, 'BX100');
    expect(box.productName.value).toContain('Pizza Box');
    expect(box.category).toMatchObject({ honesty: 'Verified', value: 'other' });
    expect(box.quantity).toMatchObject({ honesty: 'Verified', amount: 1 });
    expect(box.unit.value).toBe('CS');
    expect(box.unitPrice.amount).toBe(12.5);
    expect(box.extendedPrice.amount).toBe(12.5);
    expect(box.quantity.amount).not.toBe(50);
    expect(row(boxes.lines, 'TH100').category.value).toBe('food');

    const lids = parsePapersSkuLines({
      filename: 'fixture-northern-lid.txt',
      text: paper([
        'Northern Lights',
        'Invoice Date:',
        '06/01/2026',
        'Invoice #:',
        '880002',
        'Item #',
        'Extended',
        '** DRY ITEMS **',
        '201',
        '000111222335',
        'Fixture Souffle Cup',
        '2500ct',
        '1',
        '9.00',
        '9.00',
        '101',
        '000111222333',
        'Fixture Flour Bag',
        '50#',
        '2',
        '20.00',
        '40.00',
      ]),
    });
    const cup = row(lids.lines, '201');
    expect(cup.category.value).toBe('other');
    expect(cup.quantity.amount).toBe(1);
    expect(cup.unit.value).toBe('2500ct');
    expect(cup.extendedPrice.amount).toBe(9);
    expect(row(lids.lines, '101').category.value).toBe('food');
    expect(row(lids.lines, '101').quantity.amount).toBe(2);
  });

  it('keeps a credit line and does not invent a liquor category', () => {
    const parsed = parsePapersSkuLines({
      filename: 'fixture-humes.txt',
      text: paper([
        'Humes',
        'Fri Jul 03, 2026',
        'Invoice#:',
        '44100',
        'ITEM#',
        'U.P.C.',
        '55110',
        '2',
        'Fixture Lager',
        '012345678901',
        '12.00',
        '0.00',
        '0.00',
        '24.00',
        '55111',
        '1',
        'Fixture Vodka',
        '012345678903',
        '18.00',
        '0.00',
        '0.00',
        '18.00',
        '90011',
        '-15',
        'Unsorted Bottle',
        '012345678902',
        '1.20',
        '0.00',
        '0.00',
        '-18.00',
      ]),
    });
    expect(parsed.lines).toHaveLength(3);
    expect(parsed.lines[0].isoWeek).toBe('2026-W27');
    expect(row(parsed.lines, 'Fixture Lager').category).toMatchObject({ honesty: 'Verified', value: 'beer' });
    expect(row(parsed.lines, 'Fixture Vodka').category).toMatchObject({ honesty: 'Verified', value: 'liquor' });
    const credit = row(parsed.lines, 'Unsorted Bottle');
    expect(credit.quantity.amount).toBe(-15);
    expect(credit.extendedPrice).toMatchObject({ honesty: 'Verified', amount: -18 });
    expect(credit.category.honesty).toBe('Missing');
  });

  it('reads Z categories with extended dollars and a missing unit price', () => {
    const parsed = parsePapersSkuLines({
      filename: 'pdq-z-fixture.txt',
      text: paper([
        'Business Date: 9/14/2025',
        'Menu Category',
        'Category Name',
        'QTY',
        'Total',
        'Food',
        '10',
        '100.00',
        'Pop',
        '2',
        '8.50',
        'Liquor',
        '1',
        '6.00',
        'Beer',
        '4',
        '16.00',
        'Total:',
      ]),
    });
    expect(parsed.lines).toHaveLength(4);
    expect(parsed.lines[0].isoWeek).toBe('2025-W37');
    expect(parsed.lines[0].vendor).toMatchObject({ honesty: 'Estimated', value: 'PDQ' });
    const underscored = parsePapersSkuLines({
      filename: '2025-09-14_pdq-z.txt',
      text: paper([
        'Business Date: 9/14/2025',
        'Menu Category',
        'Category Name',
        'QTY',
        'Total',
        'Food',
        '10',
        '100.00',
        'Total:',
      ]),
    });
    expect(underscored.lines[0].vendor).toMatchObject({ honesty: 'Estimated', value: 'PDQ' });
    expect(parsed.lines[0].documentNumber.honesty).toBe('Missing');
    const food = row(parsed.lines, 'Food');
    expect(food.unitPrice.honesty).toBe('Missing');
    expect(food.unitPrice.amount).toBeNull();
    expect(food.extendedPrice).toMatchObject({ honesty: 'Verified', amount: 100 });
    expect(food.category.value).toBe('food');
    expect(row(parsed.lines, 'Pop').category.value).toBe('pop');
    expect(row(parsed.lines, 'Liquor').category.value).toBe('liquor');
    expect(row(parsed.lines, 'Beer').category.value).toBe('beer');
  });

  it('reads shift rows across weeks without adding overtime into the line', () => {
    const parsed = parsePapersSkuLines({
      filename: 'pdq-time-clock-fixture.txt',
      text: paper([
        'Time Clock',
        'Emp Name',
        'Bus Date',
        'Emp ID',
        'Pay Roll',
        'Job Desc',
        'Rate',
        'Time In',
        'Time Out',
        'Shift Time',
        'Reg Time',
        'Reg Pay',
        'Overtime',
        'Overtime Pay',
        'Cook, Fixture',
        '5/11/2026',
        '1001',
        '2002',
        'Cook',
        '15.00',
        '4:00',
        '12:00',
        '8.00',
        '8.00',
        '120.00',
        '1.00',
        '22.50',
        '5/18/2026',
        '1001',
        'Cook',
        '15.00',
        '4:00',
        '10:30',
        '6.50',
        '6.50',
        '97.50',
        '0.00',
        '0.00',
        'Emp Name',
        'Bus Date',
        'Overtime Pay',
        '5/18/2026',
        '1001',
        'Cook',
        '15.00',
        '5:00',
        '9:00',
        '4.00',
        '4.00',
        '60.00',
        '0.00',
        '0.00',
      ]),
    });
    expect(parsed.lines).toHaveLength(3);
    expect(parsed.lines.map((line) => line.isoWeek)).toEqual(['2026-W20', '2026-W21', '2026-W21']);
    expect(parsed.lines.every((line) => line.category.value === 'labor')).toBe(true);
    const first = parsed.lines[0];
    expect(first.productName.value).toBe('Cook, Fixture · Cook');
    expect(first.quantity).toMatchObject({ honesty: 'Verified', amount: 8 });
    expect(first.unit.value).toBe('hours');
    expect(first.unitPrice.amount).toBe(15);
    expect(first.extendedPrice.amount).toBe(120);
    expect(first.extendedPrice.amount).not.toBe(142.5);
  });

  it('keeps a two-word printed surname on its own shifts', () => {
    const parsed = parsePapersSkuLines({
      filename: 'pdq-time-clock-fixture.txt',
      text: paper([
        'Time Clock',
        'Emp Name',
        'Bus Date',
        'Overtime Pay',
        'Cook, Fixture',
        '5/11/2026',
        '1001',
        'Cook',
        '15.00',
        '4:00',
        '12:00',
        '8.00',
        '8.00',
        '120.00',
        '0.00',
        '0.00',
        'Two Word, Person',
        '5/12/2026',
        '1002',
        'Server',
        '12.00',
        '5:00',
        '11:00',
        '6.00',
        '6.00',
        '72.00',
        '1.00',
        '18.00',
        '5/13/2026',
        '1002',
        'Cook',
        '12.00',
        '5:00',
        '9:00',
        '4.00',
        '4.00',
        '48.00',
        '0.00',
        '0.00',
        'two word, person',
        '5/14/2026',
        '1001',
        'Cook',
        '15.00',
        '4:00',
        '8:00',
        '4.00',
        '4.00',
        '60.00',
        '0.00',
        '0.00',
        'Cook, Fixture',
        '5/15/2026',
        '1001',
        'Cook',
        '15.00',
        '4:00',
        '8:00',
        '4.00',
        '4.00',
        '60.00',
        '0.00',
        '0.00',
      ]),
    });
    expect(parsed.lines.map((line) => line.productName.value)).toEqual([
      'Cook, Fixture · Cook',
      'Two Word, Person · Server',
      'Two Word, Person · Cook',
      'Two Word, Person · Cook',
      'Cook, Fixture · Cook',
    ]);
    expect(parsed.lines.some((line) => line.productName.value?.includes('two word'))).toBe(false);
    const server = parsed.lines[1];
    expect(server.productName.honesty).toBe('Verified');
    expect(server.extendedPrice).toMatchObject({ honesty: 'Verified', amount: 72 });
    expect(server.extendedPrice.amount).not.toBe(90);
    expect(server.category).toMatchObject({ honesty: 'Verified', value: 'labor' });
    expect(server.quantity).toMatchObject({ honesty: 'Verified', amount: 6 });
  });

  it('pairs delivery statement labels with the amount on that line', () => {
    const parsed = parsePapersSkuLines({
      filename: 'fixture-doordash.txt',
      text: paper([
        'DoorDash',
        'Jul 1-31, 2026 • Statement #FIXSTMT1',
        'Subtotal',
        '$100.00',
        'Staff tips',
        '$10.00',
        'Commission',
        '-$20.00',
        'Adjustments',
        '$0.00',
        'Net total',
        '$80.00',
        '$1,234.50',
        'Sales',
        '-$30.00',
        'Marketing spend',
        '-$15.00',
        'Commission & fees',
        'Payouts',
        'Staff tips',
        '$999.00',
      ]),
    });
    expect(parsed.lines).toHaveLength(8);
    expect(parsed.lines[0].documentNumber.value).toBe('FIXSTMT1');
    expect(parsed.lines[0].documentDate.value).toBe('2026-07-31');
    expect(parsed.lines[0].isoWeek).toBe('2026-W31');
    expect(row(parsed.lines, 'Subtotal').extendedPrice.amount).toBe(100);
    expect(row(parsed.lines, 'Staff Tips').extendedPrice.amount).toBe(10);
    expect(row(parsed.lines, 'Commission').extendedPrice.amount).toBe(-20);
    expect(row(parsed.lines, 'Adjustments').extendedPrice).toMatchObject({ honesty: 'Verified', amount: 0 });
    expect(row(parsed.lines, 'Net Total').extendedPrice.amount).toBe(80);
    expect(row(parsed.lines, 'Sales').extendedPrice.amount).toBe(1234.5);
    expect(row(parsed.lines, 'Marketing Spend').extendedPrice.amount).toBe(-30);
    expect(row(parsed.lines, 'Commission & Fees').extendedPrice.amount).toBe(-15);
    expect(parsed.lines.every((line) => line.quantity.honesty === 'Missing' && line.unitPrice.honesty === 'Missing')).toBe(true);
  });

  it('leaves a photo and a dateless paper Missing instead of inventing dollars or a week', () => {
    const photo = parsePapersSkuLines({ filename: 'ticket.heic', bytes: new Uint8Array([0, 1, 2]) });
    expect(photo.lines).toEqual([]);
    expect(photo.note).toMatch(/OCR is a later step/);
    const blank = parsePapersSkuLines({
      filename: 'fixture-pfg.txt',
      text: paper([
        'Performance',
        'Foodservice',
        '1',
        'CS',
        '6/#10Fixture',
        'Sauce',
        'TH100',
        '1',
        '1',
        'EA',
        '1.250',
        '12.50',
      ]),
    });
    expect(blank.lines).toHaveLength(1);
    expect(blank.lines[0].isoWeek).toBeNull();
    expect(blank.lines[0].documentDate.honesty).toBe('Missing');
    expect(blank.lines[0].extendedPrice.amount).toBe(12.5);
  });

  it('inflates a synthetic FlateDecode stream and splits a wide TJ gap', () => {
    const bytes = flatePdf('BT [(Left) -100 (Right)] TJ (Fixture Token) Tj ET');
    expect(extractPdfTokens(bytes)).toEqual(['Left', 'Right', 'Fixture Token']);
  });

  it('stores lines by store and ISO week and compares two weeks of the same SKU', async () => {
    resetPapersSkuStore();
    resetPapersScanStore();
    const earlier = parsePapersSkuLines({
      filename: 'fixture-pfg-a.txt',
      text: paper([
        'Performance',
        'Foodservice',
        'Date:',
        '06/05/26',
        '06/05/26',
        '900001',
        '1',
        'CS',
        '6/#10Fixture',
        'Sauce',
        'TH100',
        '1',
        '1',
        'EA',
        '1.250',
        '12.50',
      ]),
    });
    const later = parsePapersSkuLines({
      filename: 'fixture-pfg-b.txt',
      text: paper([
        'Performance',
        'Foodservice',
        'Date:',
        '06/12/26',
        '06/12/26',
        '900002',
        '1',
        'CS',
        '6/#10Fixture',
        'Sauce',
        'TH100',
        '1',
        '1',
        'EA',
        '1.500',
        '15.00',
      ]),
    });
    expect(earlier.lines[0].isoWeek).toBe('2026-W23');
    expect(later.lines[0].isoWeek).toBe('2026-W24');
    await replacePapersSkuDocument('seat:fixture', 'pfg-a', earlier.lines);
    const one = papersSkuCompareForStore('seat:fixture');
    expect(one?.honesty).not.toBe('Verified');
    expect(one?.compare?.rows[0].priorPrice).toBeNull();
    expect(one?.compare?.rows[0].currentPrice).toBe(12.5);
    expect(one?.missing).toMatch(/Missing/);
    await replacePapersSkuDocument('seat:fixture', 'pfg-b', later.lines);
    expect(papersSkuRowsForStore('seat:fixture', '2026-W23')).toHaveLength(1);
    expect(papersSkuRowsForStore('seat:fixture', '2026-W24')).toHaveLength(1);
    const both = papersSkuCompareForStore('seat:fixture');
    expect(both?.compare?.rows[0]).toEqual(expect.objectContaining({
      sku: 'TH100',
      priorPeriod: '2026-W23',
      currentPeriod: '2026-W24',
      priorPrice: 12.5,
      currentPrice: 15,
    }));
    expect(both?.honesty).toBe('Verified');

    enqueuePapersScan('seat:scan-sku');
    await drainPapersScan({
      operatorId: 'seat:scan-sku',
      listGmail: async () => [{
        source: 'gmail',
        externalId: 'msg-sku',
        filename: 'fixture-pfg.txt',
        bytes: new TextEncoder().encode(paper([
          'Performance',
          'Foodservice',
          'Date:',
          '06/05/26',
          '06/05/26',
          '900001',
          'DRY',
          '1',
          'CS',
          '6/#10Fixture',
          'Sauce',
          'TH100',
          '1',
          '1',
          'EA',
          '1.250',
          '12.50',
        ])),
      }],
      listDrive: async () => [],
    });
    const snap = papersScanSnapshot('seat:scan-sku');
    expect(snap.rows[0].lineItems).toHaveLength(1);
    expect(snap.rows[0].isoWeek).toBe('2026-W23');
    expect(snap.rows[0].lineItems[0].extendedPrice.amount).toBe(12.5);
    expect(snap.rows[0].lineItems[0].category.value).toBe('food');
    expect(papersSkuRowsForStore('seat:scan-sku', '2026-W23')).toHaveLength(1);
    expect(snap.job?.kept).toBe(1);
    expect(snap.job?.deduped).toBe(0);

    const repeat = await drainPapersScan({
      operatorId: 'seat:scan-sku',
      listGmail: async () => [{
        source: 'gmail',
        externalId: 'msg-sku',
        filename: 'fixture-pfg.txt',
        bytes: new TextEncoder().encode('ignored because the finished job does not scan again'),
      }],
      listDrive: async () => [],
    });
    expect(repeat.deduped).toBe(0);
    expect(papersScanSnapshot('seat:scan-sku').rows).toHaveLength(1);
    expect(papersSkuRowsForStore('seat:scan-sku', '2026-W23')).toHaveLength(1);

    allowPapersRescan('seat:scan-sku');
    enqueuePapersScan('seat:scan-sku');
    const forced = await drainPapersScan({
      operatorId: 'seat:scan-sku',
      listGmail: async () => [{
        source: 'gmail',
        externalId: 'msg-sku',
        filename: 'fixture-pfg.txt',
        bytes: new TextEncoder().encode(paper([
          'Performance',
          'Foodservice',
          'Date:',
          '06/05/26',
          '06/05/26',
          '900001',
          'DRY',
          '1',
          'CS',
          '6/#10Fixture',
          'Sauce',
          'TH100',
          '1',
          '1',
          'EA',
          '1.250',
          '12.50',
        ])),
      }],
      listDrive: async () => [],
    });
    expect(forced.deduped).toBe(1);
    expect(forced.kept).toBe(0);
    expect(papersScanSnapshot('seat:scan-sku').rows).toHaveLength(1);
    expect(papersSkuRowsForStore('seat:scan-sku', '2026-W23')).toHaveLength(1);
    expect(papersSkuRowsForStore('seat:scan-sku', '2026-W24')).toEqual([]);
  });

  it('isolates two stores of one owner from each other and from a second owner', async () => {
    resetPapersSkuStore();
    const ownerA = 'owner-a@example.com';
    const ownerB = 'owner-b@example.com';
    const sku = (date: string, invoice: string, price: string, extended: string) => parsePapersSkuLines({
      filename: `fixture-${invoice}.txt`,
      text: paper([
        'Performance',
        'Foodservice',
        'Date:',
        date,
        date,
        invoice,
        'DRY',
        '1',
        'CS',
        '6/#10Fixture',
        'Sauce',
        'TH100',
        '1',
        '1',
        'EA',
        price,
        extended,
      ]),
    }).lines;

    await expect(replacePapersSkuDocument(ownerA, 'doc', sku('06/05/26', '900001', '1.250', '12.50'), ownerA)).resolves.toEqual([]);
    await replacePapersSkuDocument('seat:101', 'doc-a', sku('06/05/26', '900001', '1.250', '12.50'), ownerA);
    await replacePapersSkuDocument('seat:101', 'doc-b', sku('06/12/26', '900002', '1.500', '15.00'), ownerA);
    await replacePapersSkuDocument('seat:102', 'doc-a', sku('06/05/26', '900001', '9.000', '9.00'), ownerA);
    await replacePapersSkuDocument('seat:201', 'doc-a', sku('06/05/26', '900001', '4.000', '4.00'), ownerB);
    await replacePapersSkuDocument('seat:101', 'doc-a', sku('06/05/26', '900001', '1.250', '12.50'), ownerA);

    expect(papersSkuRowsForStore(ownerA)).toEqual([]);
    expect(papersSkuRowsForStore('seat:101', '2026-W23')).toHaveLength(1);
    expect(papersSkuRowsForStore('seat:101', '2026-W24')).toHaveLength(1);
    expect(papersSkuRowsForStore('seat:101', '2026-W99')).toEqual([]);
    expect(papersSkuRowsForStore('seat:101')).toHaveLength(2);
    expect(papersSkuRowsForStore('seat:102', '2026-W23')[0].unitPrice.amount).toBe(9);
    expect(papersSkuRowsForStore('seat:201', '2026-W23')[0].unitPrice.amount).toBe(4);
    expect(papersSkuRowsForStore('seat:101').every((line) => line.storeId === 'seat:101' && line.ownerId === ownerA)).toBe(true);
    expect(papersSkuRowsForStore('seat:102')[0].ownerId).toBe(ownerA);
    expect(papersSkuRowsForStore('seat:201')[0].ownerId).toBe(ownerB);

    expect(papersSkuCompareForStore('seat:101')?.compare?.rows[0]).toEqual(expect.objectContaining({
      priorPeriod: '2026-W23',
      currentPeriod: '2026-W24',
      priorPrice: 12.5,
      currentPrice: 15,
    }));
    expect(papersSkuCompareForStore('seat:102')?.compare?.rows[0]).toEqual(expect.objectContaining({
      currentPrice: 9,
      priorPrice: null,
    }));
    expect(papersSkuCompareForStore('seat:201')?.compare?.rows[0]).toEqual(expect.objectContaining({
      currentPrice: 4,
      priorPrice: null,
    }));
    expect(papersSkuCompareForStore(ownerA)).toBeNull();
  });

  it('copies a reviewed SKU, price, and date into the compare store and drops the old week', async () => {
    resetPapersSkuStore();
    resetPapersScanStore();
    const seat = 'seat:edit-sku';
    enqueuePapersScan(seat);
    await drainPapersScan({
      operatorId: seat,
      listGmail: async () => [{
        source: 'gmail',
        externalId: 'msg-edit-sku',
        filename: 'fixture-pfg.txt',
        bytes: new TextEncoder().encode(paper([
          'Performance', 'Foodservice', 'Date:', '06/05/26', '06/05/26', '900001', 'DRY',
          '1', 'CS', '6/#10Fixture', 'Sauce', 'TH100', '1', '1', 'EA', '1.250', '12.50',
        ])),
      }],
      listDrive: async () => [],
    });
    const stayed = parsePapersSkuLines({
      filename: 'fixture-pfg-stay.txt',
      text: paper([
        'Performance', 'Foodservice', 'Date:', '06/05/26', '06/05/26', '900009', 'DRY',
        '1', 'CS', '6/#10Fixture', 'Sauce', 'TH900', '1', '1', 'EA', '1.250', '12.50',
      ]),
    });
    await replacePapersSkuDocument(seat, 'stay-doc', stayed.lines);
    const review = papersScanSnapshot(seat).rows[0];
    const edited = await applyPapersScanEdit(seat, {
      id: review.id,
      fields: {
        dates: '06/12/26',
        lineItems: [{ index: 0, sku: 'TH200', quantity: '4', unitPrice: '2.50' }],
      },
    });
    expect(edited?.isoWeek).toBe('2026-W24');
    expect(edited?.dates.honesty).toBe('Estimated');
    expect(edited?.lineItems[0].sku).toMatchObject({ honesty: 'Estimated', value: 'TH200' });
    expect(edited?.lineItems[0].quantity).toMatchObject({ honesty: 'Estimated', amount: 4 });
    expect(edited?.lineItems[0].unitPrice).toMatchObject({ honesty: 'Estimated', amount: 2.5 });
    expect(edited?.lineItems[0].extendedPrice).toMatchObject({ honesty: 'Verified', amount: 12.5 });
    const moved = papersSkuRowsForStore(seat, '2026-W24');
    expect(moved).toHaveLength(1);
    expect(moved[0].itemCode.value).toBe('TH200');
    expect(moved[0].unitPrice.amount).toBe(2.5);
    expect(moved[0].extendedPrice.amount).toBe(12.5);
    expect(papersSkuRowsForStore(seat, '2026-W23').map((line) => line.itemCode.value)).toEqual(['TH900']);
    expect(papersSkuCompareForStore(seat)?.compare?.rows.map((line) => line.sku).sort()).toEqual(['TH200', 'TH900']);

    const cleared = await applyPapersScanEdit(seat, {
      id: review.id,
      fields: { dates: 'not-a-date' },
    });
    expect(cleared?.isoWeek).toBeNull();
    expect(papersSkuRowsForStore(seat, '2026-W24')).toEqual([]);
    expect(papersSkuRowsForStore(seat).some((line) => line.documentKey === review.dedupeKey && line.isoWeek)).toBe(false);
    expect(papersSkuRowsForStore(seat, '2026-W23')).toHaveLength(1);
  });
});
