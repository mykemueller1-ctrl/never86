import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { composeAskAnswer, readinessFromUploads } from '@/lib/simpleOwnerDemo/compose';
import { createMemoryObjectStore } from '@/lib/simpleOwnerDemo/objectStore';
import { createMemoryRepository } from '@/lib/simpleOwnerDemo/repository';
import { createSimpleOwnerDemoService } from '@/lib/simpleOwnerDemo/service';
import { compareVendorInvoiceDocuments } from '@/lib/vendorDriftActionShift';
import { parsePapersSkuLines } from '@/lib/papersSkuParse';
import { parseSeatInvoiceBytes } from '@/lib/papersInvoicePath';
import { classifyPapersFolder, foldersWithReceived, emptyBohFolders } from '@/lib/papersInbox';
import { paperFromUpload } from '@/lib/papersDirectIntake';
import { PUBLIC_PREVIEW_COPY } from '@/lib/freeOperatorDemo';
import {
  answerFromPaperFacts,
  extractPaperFacts,
  paperFactTags,
} from '@/lib/ownerPaperFacts';

const encoder = new TextEncoder();

function paper(lines: string[]): string {
  return lines.join('\n');
}

const Z_JUNE_1 = paper([
  'Z Report',
  'Business Date 06/01/2026',
  'Net Sales $2,700.00',
  'Grand Total $2,731.50',
]);

const PFG_INVOICE = paper([
  'Performance Foodservice',
  'Invoice Number 214983',
  'Invoice Date 06/02/2026',
  'Tax $44.37',
  'Invoice Total $2,679.01',
]);

const CLOCK = paper([
  'Time Clock Report',
  'Date 06/01/2026',
  'Total Hours 1364.69',
  'Total Labor $18,008.12',
  'Labor % 24.48',
  'Sales $73,575.48',
]);

const SALES_CSV = paper([
  'date,amount',
  '2026-06-01,2731.50',
  '2026-06-02,4177.02',
]);

describe('owner paper facts', () => {
  it('reads a Z grand total, a time clock, a sales file, and an invoice total as Verified', () => {
    const zed = extractPaperFacts('z-0601.txt', Z_JUNE_1)[0];
    expect(zed).toMatchObject({ kind: 'z', date: '2026-06-01', amount: 2731.5, netSales: 2700 });
    const labor = extractPaperFacts('time-clock.txt', CLOCK)[0];
    expect(labor).toMatchObject({ kind: 'labor', amount: 18008.12, laborPct: 24.48, hours: 1364.69, salesBasis: 73575.48 });
    const sales = extractPaperFacts('sales-by-date.csv', SALES_CSV);
    expect(sales.map((row) => row.kind)).toEqual(['sales', 'sales']);
    expect(sales[0]).toMatchObject({ date: '2026-06-01', amount: 2731.5 });
    const invoice = extractPaperFacts('pfg-214983.txt', PFG_INVOICE)[0];
    expect(invoice).toMatchObject({
      kind: 'invoice',
      amount: 2679.01,
      tax: 44.37,
      invoiceNumber: '214983',
      vendor: 'Performance Foodservice',
    });
    expect(extractPaperFacts('sku-sample.csv', 'Vendor,SKU,Description,Period,Unit Price,Qty\nSample,MZ,Milk,2026-09-08,56.00,1\n')).toEqual([]);
  });

  it('answers a dated sales question and an invoice total from stored tags', () => {
    const uploads = [
      { filename: 'z-0601.txt', sourceTags: paperFactTags('z-0601.txt', Z_JUNE_1) },
      { filename: 'pfg-214983.txt', sourceTags: paperFactTags('pfg-214983.txt', PFG_INVOICE) },
    ];
    const sales = answerFromPaperFacts('What were my total sales on 6/1?', uploads);
    expect(sales?.headline).toMatch(/\$2,731\.50/);
    expect(sales?.verifiedClose).toBe(true);
    expect(sales?.headline).not.toMatch(/Estimated/);
    const total = answerFromPaperFacts('What was my PFG invoice total?', uploads);
    expect(total?.headline).toMatch(/2,679\.01/);
    expect(total?.headline).toMatch(/214983/);
    expect(answerFromPaperFacts("What's going on with labor?", uploads)).toBeNull();
  });

  it('keeps papers on the signed-in account and answers from them after another read', async () => {
    const svc = createSimpleOwnerDemoService({
      repo: createMemoryRepository(),
      objects: createMemoryObjectStore(),
    });
    const first = await svc.upload({
      operatorId: 'seat:1000009',
      filename: 'z-0601.txt',
      contentType: 'text/plain',
      bytes: encoder.encode(Z_JUNE_1),
    });
    const other = await svc.upload({
      operatorId: 'seat:2000001',
      filename: 'secret-z.txt',
      contentType: 'text/plain',
      bytes: encoder.encode(Z_JUNE_1.replace('2,731.50', '9,999.00')),
    });
    expect(first.ok && other.ok).toBe(true);
    const again = await svc.readiness('seat:1000009', 'Test Kitchen');
    expect(again.papers.map((row) => row.filename)).toEqual(['z-0601.txt']);
    expect(again.papers[0]?.summary).toMatch(/2,731\.50/);
    expect(again.uploadCount).toBe(1);
    const asked = await svc.ask({
      operatorId: 'seat:1000009',
      question: 'What were my total sales on 6/1?',
      restaurantName: 'Test Kitchen',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.headline).toMatch(/\$2,731\.50/);
    expect(JSON.stringify(asked.answer)).not.toMatch(/9,999/);
    const stranger = await svc.readiness('seat:2000001');
    expect(stranger.papers.map((row) => row.filename)).toEqual(['secret-z.txt']);
  });

  it('does not coach a new account with store-only or developer text', () => {
    const readiness = readinessFromUploads('seat:1000009', [], 0, 'Test Kitchen');
    const answer = composeAskAnswer({
      question: 'What was my PFG invoice total?',
      tray: 'action',
      readiness,
      uploads: [],
      restaurantName: 'Test Kitchen',
    });
    const blob = JSON.stringify(answer);
    expect(blob).not.toMatch(/pdqreports@pdqpos\.com|BOH \/ Seat 2|21-day|later-wave|XAI_API_KEY|private CTAP/i);
    expect(answer.headline).toMatch(/Missing/);
    expect(PUBLIC_PREVIEW_COPY).not.toMatch(/CTAP|XAI_API_KEY|pdqreports/i);
  });
});

describe('invoice case price and one-line papers', () => {
  it('flags soy fry oil when the case price rises 5.2%', () => {
    const prior = parsePapersSkuLines({
      filename: 'pfg-a.txt',
      text: paper([
        'Performance', 'Foodservice', 'Date:', '05/26/26', '05/26/26', '214100',
        'DRY', '1', 'CS', '6/5LB', 'SOY', 'FRY', 'OIL', 'CATG78', 'DV470',
        '1', '1', 'OZ', '0.0707', '39.58', '39.58',
      ]),
    });
    const current = parsePapersSkuLines({
      filename: 'pfg-b.txt',
      text: paper([
        'Performance', 'Foodservice', 'Date:', '06/02/26', '06/02/26', '214983',
        'DRY', '1', 'CS', '6/5LB', 'SOY', 'FRY', 'OIL', 'DV470',
        '1', '1', 'OZ', '0.0743', '41.62', '41.62',
        'RESTAURANT',
      ]),
    });
    const priorOil = prior.lines.find((line) => line.itemCode.value === 'DV470');
    const currentOil = current.lines.find((line) => line.itemCode.value === 'DV470');
    expect(priorOil?.itemCode.value).toBe('DV470');
    expect(priorOil?.unitPrice.amount).toBe(39.58);
    expect(currentOil?.unitPrice.amount).toBe(41.62);
    expect(priorOil?.productName.value).not.toMatch(/CATG78|RESTAURANT|SELIM/);
    const compare = compareVendorInvoiceDocuments([
      {
        vendor: 'Performance Foodservice',
        invoiceNumber: '214100',
        invoiceDate: '2026-05-26',
        period: '2026-05-26',
        filename: 'pfg-a.txt',
        lines: [{
          vendor: 'Performance Foodservice',
          sku: 'DV470',
          description: 'SOY FRY OIL',
          pack: '6/5LB',
          period: '2026-05-26',
          unitPrice: priorOil?.unitPrice.amount ?? null,
          quantity: 1,
          status: 'readable',
          evidenceState: 'unverified',
          sourceLabel: 'pfg-a.txt',
          raw: '',
        }],
        unreadableCount: 0,
        missingFields: [],
      },
      {
        vendor: 'Performance Foodservice',
        invoiceNumber: '214983',
        invoiceDate: '2026-06-02',
        period: '2026-06-02',
        filename: 'pfg-b.txt',
        lines: [{
          vendor: 'Performance Foodservice',
          sku: 'DV470',
          description: 'SOY FRY OIL',
          pack: '6/5LB',
          period: '2026-06-02',
          unitPrice: currentOil?.unitPrice.amount ?? null,
          quantity: 1,
          status: 'readable',
          evidenceState: 'unverified',
          sourceLabel: 'pfg-b.txt',
          raw: '',
        }],
        unreadableCount: 0,
        missingFields: [],
      },
    ]);
    expect(compare.flagged[0]).toMatchObject({ sku: 'DV470', flagged: true });
    expect(compare.flagged[0]?.driftPct).toBeGreaterThan(0.05);
  });

  it('says which invoice is missing a one-sided item', () => {
    const compare = compareVendorInvoiceDocuments([
      {
        vendor: 'Performance Foodservice',
        invoiceNumber: '1',
        invoiceDate: '2026-05-01',
        period: '2026-05-01',
        filename: 'old.txt',
        lines: [{
          vendor: 'Performance Foodservice', sku: 'OLD1', description: 'Only old', pack: null,
          period: '2026-05-01', unitPrice: 10, quantity: 1, status: 'readable',
          evidenceState: 'unverified', sourceLabel: 'old.txt', raw: '',
        }],
        unreadableCount: 0,
        missingFields: [],
      },
      {
        vendor: 'Performance Foodservice',
        invoiceNumber: '2',
        invoiceDate: '2026-06-01',
        period: '2026-06-01',
        filename: 'new.txt',
        lines: [{
          vendor: 'Performance Foodservice', sku: 'NEW1', description: 'Only new', pack: null,
          period: '2026-06-01', unitPrice: 12, quantity: 1, status: 'readable',
          evidenceState: 'unverified', sourceLabel: 'new.txt', raw: '',
        }],
        unreadableCount: 0,
        missingFields: [],
      },
    ]);
    expect(compare.rows.find((row) => row.sku === 'OLD1')?.missingEvidence).toMatch(/newer invoice is missing OLD1/);
    expect(compare.rows.find((row) => row.sku === 'NEW1')?.missingEvidence).toMatch(/older invoice is missing NEW1/);
    expect(compare.rows.every((row) => /Missing Evidence, not \$0/.test(row.missingEvidence ?? ''))).toBe(true);
  });

  it('reads a one-line Central Iowa invoice number and total', () => {
    const parsed = parseSeatInvoiceBytes(encoder.encode(paper([
      'Central Iowa',
      'INVOICE',
      '315216',
      'Date 06/02/2026',
      'Linen service',
      '70.00',
      'Tax 4.90',
      'Invoice Total 74.90',
    ])), 'central-iowa.txt');
    expect(parsed.document.invoiceNumber).toBe('315216');
    expect(parsed.document.invoiceNumber).not.toBe('INVOICE');
    expect(parsed.lines[0]?.unitPrice).toBe(70);
    expect(parsed.note).toMatch(/74\.90/);
    expect(parsed.note).toMatch(/315216/);
  });
});

describe('public paper routing', () => {
  it('sends a sales file to sales and keeps a printed total Verified', () => {
    expect(classifyPapersFolder('sales-by-date.csv')).toBe('z-eod');
    const sales = paperFromUpload(encoder.encode(SALES_CSV), 'sales-by-date.csv', 'text/csv');
    expect(sales.folder).toBe('z-eod');
    expect(sales.honesty).toBe('Verified');
    expect(sales.text).toMatch(/2731\.50/);
    const printed = paperFromUpload(encoder.encode('Grand Total $2,731.50\n'), 'z-report.txt', 'text/plain');
    expect(printed.honesty).toBe('Verified');
    expect(printed.note).not.toMatch(/Estimated/);
    const clock = paperFromUpload(encoder.encode(CLOCK), 'time-clock.txt', 'text/plain');
    expect(clock.folder).toBe('labor');
    expect(clock.honesty).toBe('Verified');
    expect(clock.note).toMatch(/18,008\.12/);
    expect(clock.note).toMatch(/24\.48%/);
    const folders = foldersWithReceived(emptyBohFolders(), [
      { evidenceKind: 'invoice', filename: 'pfg.txt' },
      { evidenceKind: 'z', filename: 'z-report.txt' },
      { evidenceKind: 'timeclock', filename: 'time-clock.txt' },
    ]);
    expect(folders.find((folder) => folder.id === 'invoices')?.status).toBe('received');
    expect(folders.find((folder) => folder.id === 'z-eod')?.status).toBe('received');
    expect(folders.find((folder) => folder.id === 'labor')?.status).toBe('received');
    expect(folders.find((folder) => folder.id === 'liquor-beer')?.status).toBe('missing');
  });

  it('keeps customer-visible pages free of store coaching and developer keys', () => {
    const files = [
      'src/components/InvoiceCompareClient.tsx',
      'src/components/FreeOperatorPhone.tsx',
      'src/components/PapersInboxConnect.tsx',
      'src/components/PapersChatIntake.tsx',
      'src/components/PublicPaperDrop.tsx',
      'src/app/operator/page.tsx',
      'src/app/check/labor/page.tsx',
      'src/app/check/menu/page.tsx',
    ];
    const blob = files.map((file) => readFileSync(resolve(file), 'utf8')).join('\n');
    expect(blob).not.toMatch(/pdqreports@pdqpos\.com|BOH \/ Seat 2|21-day clock|later-wave rhythm|XAI_API_KEY|private CTAP/i);
  });
});
