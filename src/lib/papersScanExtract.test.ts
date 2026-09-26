import { describe, expect, it } from 'vitest';
import { draftFromCandidateText } from './papersScanExtract';
import { PAPERS_SCAN_FIXTURE_DOCS, fixturePapersScanRows } from './papersScanFixtures';
import { paperTextFromBytes } from './papersScanText';

function doc(id: string) {
  const found = PAPERS_SCAN_FIXTURE_DOCS.find((row) => row.id === id);
  if (!found) throw new Error(`missing fixture ${id}`);
  return found;
}

function draft(id: string) {
  const found = doc(id);
  const row = draftFromCandidateText({ filename: found.filename, subject: found.subject, text: found.text });
  if (!row) throw new Error(`fixture ${id} did not classify`);
  return row;
}

describe('papers scan extractors', () => {
  it('reads labeled fixture fields and never promotes 999.99', () => {
    const rows = fixturePapersScanRows();
    expect(rows).toHaveLength(PAPERS_SCAN_FIXTURE_DOCS.length);
    expect(rows.every((row) => row.fixture && row.note.startsWith('FIXTURE'))).toBe(true);
    const amounts = rows.flatMap((row) => [
      row.total.amount,
      row.delivery.gross.amount,
      row.delivery.fees.amount,
      row.delivery.net.amount,
      ...row.lineItems.map((line) => line.unitPrice.amount),
    ]);
    expect(amounts).not.toContain(999.99);

    const eod = draft('eod');
    expect(eod.category).toBe('eod-z');
    expect(eod.dates).toMatchObject({ honesty: 'Verified', value: '2026-09-20' });
    expect(eod.total).toMatchObject({ honesty: 'Verified', amount: 4280.15 });
    expect(eod.vendorName.honesty).toBe('Missing');
    expect(eod.invoiceNumber.honesty).toBe('Missing');

    const invoice = draft('invoice');
    expect(invoice.vendorName).toMatchObject({ honesty: 'Verified', value: 'Fixture Foods' });
    expect(invoice.invoiceNumber).toMatchObject({ honesty: 'Verified', value: 'FIX-1001' });
    expect(invoice.dates).toMatchObject({ honesty: 'Verified', value: '2026-09-18' });
    expect(invoice.total).toMatchObject({ honesty: 'Verified', amount: 246.8 });
    expect(invoice.lineItems.map((line) => line.sku.value)).toEqual(['FIX-SKU-1', 'FIX-SKU-2']);
    expect(invoice.lineItems[0].unitPrice).toMatchObject({ honesty: 'Verified', amount: 18.5 });
    expect(invoice.lineItems[0].quantity).toMatchObject({ honesty: 'Verified', amount: 4 });

    const missing = draft('invoice-missing');
    expect(missing.total.honesty).toBe('Missing');
    expect(missing.total.amount).toBeNull();
    expect(missing.lineItems).toEqual([]);

    const labor = draft('labor');
    expect(labor.shifts.map((shift) => [shift.employee.value, shift.hours.honesty, shift.hours.amount])).toEqual([
      ['Fixture Cook', 'Verified', 32.5],
      ['Fixture Server', 'Estimated', 28],
      ['Fixture Host', 'Missing', null],
    ]);
    expect(labor.total.honesty).toBe('Missing');

    const liquor = draft('liquor');
    expect(liquor.category).toBe('liquor-beer');
    expect(liquor.total).toMatchObject({ honesty: 'Verified', amount: 510 });
    expect(liquor.lineItems[0].sku.value).toBe('KEG-1');

    const door = draft('doordash');
    expect(door.delivery.platform).toMatchObject({ honesty: 'Verified', value: 'DoorDash' });
    expect(door.delivery.gross).toMatchObject({ honesty: 'Verified', amount: 1200 });
    expect(door.delivery.fees).toMatchObject({ honesty: 'Verified', amount: 360 });
    expect(door.delivery.net).toMatchObject({ honesty: 'Verified', amount: 840 });
    expect(door.delivery.net.note ?? '').not.toMatch(/minus/);

    const uber = draft('ubereats');
    expect(uber.delivery.gross).toMatchObject({ honesty: 'Verified', amount: 100 });
    expect(uber.delivery.fees).toMatchObject({ honesty: 'Verified', amount: 30 });
    expect(uber.delivery.net).toMatchObject({ honesty: 'Estimated', amount: 70 });
    expect(uber.delivery.net.note).toMatch(/gross minus/);

    const menu = draft('menu');
    expect(menu.category).toBe('menu-recipe');
    expect(menu.total).toMatchObject({ honesty: 'Verified', amount: 4.25 });
    expect(menu.invoiceNumber.honesty).toBe('Missing');
    expect(menu.vendorName.honesty).toBe('Missing');
  });

  it('does not invent a total from a subtotal, a tilde, or a missing fee', () => {
    const tilde = draftFromCandidateText({
      filename: 'invoice.txt',
      text: 'FIXTURE\nVendor: Fixture Foods\nInvoice Total: ~$88.00\n',
    });
    expect(tilde?.total).toMatchObject({ honesty: 'Estimated', amount: 88 });

    const subtotal = draftFromCandidateText({
      filename: 'invoice.txt',
      text: 'FIXTURE invoice\nSubtotal: $10.00\n',
    });
    expect(subtotal?.total.honesty).toBe('Missing');
    expect(subtotal?.total.amount).toBeNull();

    const grubhub = draftFromCandidateText({
      filename: 'grubhub-statement.txt',
      text: 'FIXTURE\nGrubhub statement\nGross Sales: $50.00\n',
    });
    expect(grubhub?.delivery.fees.honesty).toBe('Missing');
    expect(grubhub?.delivery.net.honesty).toBe('Missing');
    expect(grubhub?.delivery.net.amount).toBeNull();

    const named = draftFromCandidateText({
      filename: 'invoice-2026-09-03.txt',
      text: 'Invoice\nVendor: Fixture Foods\n',
    });
    expect(named?.dates).toMatchObject({
      honesty: 'Estimated',
      value: '2026-09-03',
    });
  });

  it('does not read dollar amounts out of spreadsheet bytes', () => {
    const bytes = Uint8Array.from([
      0x50, 0x4b, 0x03, 0x04, 0x24, 0x39, 0x39, 0x39, 0x2e, 0x39, 0x39,
    ]);
    expect(paperTextFromBytes('timesheet.xlsx', bytes)).toBe('');
    const fromName = draftFromCandidateText({
      filename: 'timesheet.xlsx',
      text: paperTextFromBytes('timesheet.xlsx', bytes),
    });
    expect(fromName?.category).toBe('labor');
    expect(fromName?.total.honesty).toBe('Missing');
    expect(fromName?.shifts).toEqual([]);
  });
});
