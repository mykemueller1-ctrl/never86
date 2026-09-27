/**
 * FIXTURE papers. Fake restaurant documents for tests and the review-screen preview.
 * Not an operator inbox. Not Community Tap. No live dollars.
 */

import { draftFromCandidateText, type PapersExtractDraft } from '@/lib/papersScanExtract';
import { parsePapersSkuLines, skuRowToLineItem } from '@/lib/papersSkuParse';
import type { PapersScanRow } from '@/lib/papersScanTypes';

export const PAPERS_SCAN_FIXTURE_BANNER =
  'FIXTURE — not your inbox. These rows are fake papers. Verified was labeled on the fixture. Estimated was inferred or marked low-confidence. Missing was not on the page.';

export const PAPERS_SCAN_FIXTURE_DOCS: Array<{ id: string; filename: string; subject: string; text: string }> = [
  {
    id: 'eod',
    filename: 'FIXTURE-z-report-2026-09-20.txt',
    subject: 'FIXTURE EOD',
    text: [
      'FIXTURE — not a real restaurant',
      'Z Report',
      'Business Date: 09/20/2026',
      'Net Sales: $4,280.15',
      'A margin note says 999.99 and is not a total.',
    ].join('\n'),
  },
  {
    id: 'invoice',
    filename: 'FIXTURE-invoice-FIX-1001.txt',
    subject: 'FIXTURE vendor invoice',
    text: [
      'FIXTURE — not a real restaurant',
      'Vendor: Fixture Foods',
      'Invoice Number: FIX-1001',
      'Invoice Date: 09/18/2026',
      'Invoice Total: $246.80',
      'SKU,Description,Qty,Unit Price',
      'FIX-SKU-1,Fixture Chicken,4,18.50',
      'FIX-SKU-2,Fixture Rice,2,12.40',
    ].join('\n'),
  },
  {
    id: 'invoice-missing',
    filename: 'FIXTURE-invoice-unreadable.txt',
    subject: 'FIXTURE invoice scan',
    text: [
      'FIXTURE — not a real restaurant',
      'Vendor: Fixture Foods',
      'Invoice Number: FIX-1002',
      'Someone wrote 999.99 in the margin.',
      'Invoice Total:',
    ].join('\n'),
  },
  {
    id: 'labor',
    filename: 'FIXTURE-timesheet-week.txt',
    subject: 'FIXTURE timesheet',
    text: [
      'FIXTURE — not a real restaurant',
      'Timesheet',
      'Week of: 2026-09-14',
      'Employee,Hours',
      'Fixture Cook,32.50',
      'Fixture Server,~28.00',
      'Fixture Host,',
    ].join('\n'),
  },
  {
    id: 'liquor',
    filename: 'FIXTURE-beer-delivery.txt',
    subject: 'FIXTURE beer delivery',
    text: [
      'FIXTURE — not a real restaurant',
      'Vendor: Fixture Beverage',
      'Invoice Number: BEER-55',
      'Invoice Date: 2026-09-12',
      'Invoice Total: $510.00',
      'SKU,Description,Qty,Unit Price',
      'KEG-1,Fixture Lager Keg,2,180.00',
    ].join('\n'),
  },
  {
    id: 'doordash',
    filename: 'FIXTURE-doordash-statement.txt',
    subject: 'FIXTURE DoorDash statement',
    text: [
      'FIXTURE — not a real restaurant',
      'DoorDash statement',
      'Period: 2026-09-01 to 2026-09-07',
      'Gross Sales: $1,200.00',
      'Fees: $360.00',
      'Net Payout: $840.00',
    ].join('\n'),
  },
  {
    id: 'ubereats',
    filename: 'FIXTURE-ubereats-statement.txt',
    subject: 'FIXTURE Uber Eats statement',
    text: [
      'FIXTURE — not a real restaurant',
      'Uber Eats statement',
      'Period: 2026-09-08 to 2026-09-14',
      'Gross Sales: $100.00',
      'Fees: $30.00',
    ].join('\n'),
  },
  {
    id: 'sku-layout',
    filename: 'FIXTURE-invoice-sku-layout.txt',
    subject: 'FIXTURE invoice line layout',
    text: [
      'FIXTURE — not a real restaurant',
      'Invoice Total: $12.50',
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
      '**',
      '12.50',
      '1',
      'CS',
      '1/50Fixture',
      'Pizza Box',
      'BX100',
      '1',
      '1',
      'EA',
      '0.400',
      '**',
      '4.00',
    ].join('\n'),
  },
  {
    id: 'menu',
    filename: 'FIXTURE-recipe-burger.txt',
    subject: 'FIXTURE recipe',
    text: [
      'FIXTURE — not a real restaurant',
      'Recipe: Fixture Burger',
      'Date: 2026-09-01',
      'Plate cost: $4.25',
    ].join('\n'),
  },
];

function rowFromDraft(id: string, draft: PapersExtractDraft): PapersScanRow {
  return {
    ...draft,
    id: `fixture:${id}`,
    dedupeKey: `fixture:${id}:fixture-hash`,
    source: 'gmail',
    externalId: `fixture-message:${id}`,
    contentHash: `fixture-hash-${id}`,
    confirmed: false,
    fixture: true,
    note: 'FIXTURE. Not an operator inbox.',
  };
}

export function fixturePapersScanRows(): PapersScanRow[] {
  const rows: PapersScanRow[] = [];
  for (const doc of PAPERS_SCAN_FIXTURE_DOCS) {
    const draft = draftFromCandidateText({
      filename: doc.filename,
      subject: doc.subject,
      text: doc.text,
    });
    if (!draft) continue;
    const sku = parsePapersSkuLines({ filename: doc.filename, text: doc.text });
    if (sku.lines.length) {
      const first = sku.lines[0];
      draft.lineItems = sku.lines.map(skuRowToLineItem);
      const weeks = [...new Set(sku.lines.map((line) => line.isoWeek).filter((week): week is string => Boolean(week)))];
      draft.isoWeek = weeks.length ? weeks.join(', ') : null;
      if (draft.vendorName.honesty === 'Missing' && first.vendor.honesty !== 'Missing') draft.vendorName = first.vendor;
      if (draft.invoiceNumber.honesty === 'Missing' && first.documentNumber.honesty !== 'Missing') draft.invoiceNumber = first.documentNumber;
      if (draft.dates.honesty === 'Missing' && first.documentDate.honesty !== 'Missing') draft.dates = first.documentDate;
    }
    rows.push(rowFromDraft(doc.id, draft));
  }
  return rows;
}
