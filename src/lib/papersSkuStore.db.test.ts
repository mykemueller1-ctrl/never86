import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { pickAccessibleSeat, type AccessibleSeat } from './personAuth';
import { pullLastWeekPapers, rememberPapersToken, resetPapersTokenStore } from './papersInboxHttp';
import { papersSkuCompareForStore } from './papersInvoicePath';
import {
  allowPapersRescan,
  applyPapersScanEdit,
  drainPapersScan,
  enqueuePapersScan,
  forgetPapersScanMemory,
  hydratePapersScan,
  papersScanSnapshot,
  resetPapersScanStore,
} from './papersScanJob';
import { parsePapersSkuLines } from './papersSkuParse';
import {
  forgetPapersSkuMemory,
  hydratePapersSku,
  PAPERS_REVIEW_PERSIST_ERROR,
  papersContentHash,
  papersSkuDocumentKey,
  papersSkuRowsForStore,
  PapersSkuPersistError,
  checkedQueryRows,
  replacePapersSkuDocument,
  resetPapersSkuStore,
  setPapersSkuExecutorForTests,
  type SkuExecutor,
  type SkuStatement,
} from './papersSkuStore';

type SavedLine = { document_key: string; iso_week: string | null; row_json: { itemCode?: { value?: string }; unitPrice?: { amount?: number } } };

const hooks = {
  delayMs: 0,
  depth: 0,
  maxDepth: 0,
  inserts: 0,
  failInsertNumber: 0,
  failReviewWrite: false,
  reviewFailedAfterSku: false,
};

let database: PGlite;
let dir = '';

function sauce(date: string, invoice: string, code: string, price: string, extended: string) {
  return parsePapersSkuLines({
    filename: `fixture-${invoice}.txt`,
    text: [
      'Performance', 'Foodservice', 'Date:', date, date, invoice, 'DRY',
      '1', 'CS', '6/#10Fixture', 'Sauce', code, '1', '1', 'EA', price, extended,
    ].join('\n'),
  }).lines;
}

function executorFor(db: PGlite): SkuExecutor {
  return {
    async transaction(statements: SkuStatement[]) {
      hooks.depth += 1;
      hooks.maxDepth = Math.max(hooks.maxDepth, hooks.depth);
      if (hooks.delayMs) await new Promise((resolve) => setTimeout(resolve, hooks.delayMs));
      try {
        await db.transaction(async (tx) => {
          let preparedSku = false;
          for (const statement of statements) {
            const insert = /^\s*insert/i.test(statement.text);
            if (insert && /papers_sku_lines/i.test(statement.text)) preparedSku = true;
            if (hooks.failReviewWrite && /papers_scan_rows/i.test(statement.text)) {
              hooks.reviewFailedAfterSku = preparedSku;
              throw new Error('forced review failure');
            }
            if (insert) {
              hooks.inserts += 1;
              if (hooks.failInsertNumber && hooks.inserts === hooks.failInsertNumber) {
                throw new Error('forced insert failure');
              }
            }
            await tx.query(statement.text, statement.values);
          }
        });
      } finally {
        hooks.depth -= 1;
      }
    },
    async query<T>(text: string, values?: unknown[]): Promise<T[]> {
      const result = await db.query(text, values ?? []);
      return checkedQueryRows<T>(result.rows);
    },
  };
}

type SavedReview = {
  dedupe_key: string;
  row_json: {
    confirmed?: boolean;
    isoWeek?: string | null;
    lineItems?: Array<{
      unitPrice?: { amount?: number; honesty?: string };
      extendedPrice?: { amount?: number; honesty?: string };
    }>;
  };
};

async function savedReviews(storeId: string): Promise<SavedReview[]> {
  const result = await database.query<SavedReview>(
    `select dedupe_key, row_json from papers_scan_rows where operator_id = $1 order by dedupe_key`,
    [storeId],
  );
  return result.rows.map((row) => ({
    ...row,
    row_json: typeof row.row_json === 'string' ? JSON.parse(row.row_json) as SavedReview['row_json'] : row.row_json,
  }));
}

async function savedLines(storeId: string): Promise<SavedLine[]> {
  const result = await database.query<SavedLine>(
    `select document_key, iso_week, row_json
     from papers_sku_lines
     where store_id = $1
     order by document_key, line_index`,
    [storeId],
  );
  return result.rows.map((row) => ({
    ...row,
    row_json: typeof row.row_json === 'string' ? JSON.parse(row.row_json) : row.row_json,
  }));
}

async function reopenDatabase(): Promise<void> {
  await database.close();
  forgetPapersSkuMemory();
  database = new PGlite(dir);
  await database.waitReady;
  setPapersSkuExecutorForTests(executorFor(database));
}

describe('papers sku database durability', () => {
  beforeAll(async () => {
    dir = mkdtempSync(path.join(tmpdir(), 'never86-sku-'));
    database = new PGlite(dir);
    await database.waitReady;
    setPapersSkuExecutorForTests(executorFor(database));
  }, 120_000);

  afterAll(async () => {
    setPapersSkuExecutorForTests(null);
    await database.close();
  });

  beforeEach(() => {
    resetPapersSkuStore();
    resetPapersScanStore();
    hooks.delayMs = 0;
    hooks.depth = 0;
    hooks.maxDepth = 0;
    hooks.inserts = 0;
    hooks.failInsertNumber = 0;
    hooks.failReviewWrite = false;
    hooks.reviewFailedAfterSku = false;
    setPapersSkuExecutorForTests(executorFor(database));
  });

  it('serializes two saves for one store and lets two stores commit together', async () => {
    hooks.delayMs = 60;
    await Promise.all([
      replacePapersSkuDocument('seat:same', 'doc-a', sauce('06/05/26', '900001', 'TH100', '1.250', '12.50')),
      replacePapersSkuDocument('seat:same', 'doc-b', sauce('06/12/26', '900002', 'TH100', '1.500', '15.00')),
    ]);
    expect(hooks.maxDepth).toBe(1);
    expect((await savedLines('seat:same')).map((row) => row.document_key).sort()).toEqual(['doc-a', 'doc-b']);

    hooks.maxDepth = 0;
    await Promise.all([
      replacePapersSkuDocument('seat:left', 'doc', sauce('06/05/26', '900001', 'TH100', '1.250', '12.50')),
      replacePapersSkuDocument('seat:right', 'doc', sauce('06/05/26', '900001', 'TH100', '9.000', '9.00')),
    ]);
    expect(hooks.maxDepth).toBe(2);
    expect((await savedLines('seat:left'))[0].row_json.unitPrice?.amount).toBe(1.25);
    expect((await savedLines('seat:right'))[0].row_json.unitPrice?.amount).toBe(9);
  }, 30_000);

  it('rolls a failed document write back and leaves the other document in place', async () => {
    const seat = 'seat:rollback';
    await replacePapersSkuDocument(seat, 'keep', sauce('06/05/26', '900001', 'TH100', '1.250', '12.50'));
    await replacePapersSkuDocument(seat, 'edit', sauce('06/05/26', '900002', 'TH200', '4.000', '4.00'));
    hooks.inserts = 0;
    hooks.failInsertNumber = 2;
    const replacement = [
      ...sauce('06/12/26', '900002', 'TH201', '8.000', '8.00'),
      ...sauce('06/12/26', '900002', 'TH202', '9.000', '9.00'),
    ];
    await expect(replacePapersSkuDocument(seat, 'edit', replacement)).rejects.toBeInstanceOf(PapersSkuPersistError);
    expect(papersSkuRowsForStore(seat).map((row) => row.itemCode.value).sort()).toEqual(['TH100', 'TH200']);
    forgetPapersSkuMemory(seat);
    await hydratePapersSku(seat);
    const lines = papersSkuRowsForStore(seat);
    expect(lines.map((row) => row.itemCode.value).sort()).toEqual(['TH100', 'TH200']);
    expect(lines.find((row) => row.documentKey === 'edit')?.unitPrice.amount).toBe(4);
    expect((await savedLines(seat)).filter((row) => row.document_key === 'edit')).toHaveLength(1);
    expect((await savedLines(seat)).filter((row) => row.document_key === 'keep')).toHaveLength(1);
  }, 30_000);

  it('does not double lines when the same document is saved again or rescanned', async () => {
    const seat = 'seat:rescan';
    const lines = sauce('06/05/26', '900001', 'TH100', '1.250', '12.50');
    await replacePapersSkuDocument(seat, 'doc-a', lines);
    await replacePapersSkuDocument(seat, 'doc-a', lines);
    expect(await savedLines(seat)).toHaveLength(1);

    enqueuePapersScan(seat);
    const bytes = new TextEncoder().encode([
      'Performance', 'Foodservice', 'Date:', '06/05/26', '06/05/26', '900001', 'DRY',
      '1', 'CS', '6/#10Fixture', 'Sauce', 'TH100', '1', '1', 'EA', '1.250', '12.50',
    ].join('\n'));
    await drainPapersScan({
      operatorId: seat,
      listGmail: async () => [{ source: 'gmail', externalId: 'msg-db', filename: 'fixture-pfg.txt', bytes }],
      listDrive: async () => [],
    });
    expect(papersScanSnapshot(seat).rows).toHaveLength(1);
    allowPapersRescan(seat);
    enqueuePapersScan(seat);
    const forced = await drainPapersScan({
      operatorId: seat,
      listGmail: async () => [{ source: 'gmail', externalId: 'msg-db', filename: 'fixture-pfg.txt', bytes }],
      listDrive: async () => [],
    });
    expect(forced.deduped).toBe(1);
    expect(forced.kept).toBe(0);
    const scanRow = papersScanSnapshot(seat).rows[0];
    expect(scanRow.skuDocumentKey).toBe(`paper:${scanRow.contentHash}`);
    expect((await savedLines(seat)).filter((row) => row.document_key === scanRow.skuDocumentKey)).toHaveLength(1);
    expect((await savedLines(seat)).some((row) => row.document_key === scanRow.dedupeKey)).toBe(false);

    hooks.inserts = 0;
    hooks.failInsertNumber = 1;
    resetPapersScanStore();
    enqueuePapersScan('seat:fail-scan');
    const failed = await drainPapersScan({
      operatorId: 'seat:fail-scan',
      listGmail: async () => [{ source: 'gmail', externalId: 'msg-fail', filename: 'fixture-pfg.txt', bytes }],
      listDrive: async () => [],
    });
    expect(failed.error).toBe(PAPERS_REVIEW_PERSIST_ERROR);
    expect(failed.kept).toBe(0);
    expect(papersScanSnapshot('seat:fail-scan').rows).toEqual([]);
    expect(await savedLines('seat:fail-scan')).toEqual([]);
    expect(await savedReviews('seat:fail-scan')).toEqual([]);
  }, 30_000);

  it('stores a reviewed price and week, then reads them from a cold database', async () => {
    const seat = 'seat:edit-db';
    enqueuePapersScan(seat);
    await drainPapersScan({
      operatorId: seat,
      listGmail: async () => [{
        source: 'gmail',
        externalId: 'msg-edit-db',
        filename: 'fixture-pfg.txt',
        bytes: new TextEncoder().encode([
          'Performance', 'Foodservice', 'Date:', '06/05/26', '06/05/26', '900001', 'DRY',
          '1', 'CS', '6/#10Fixture', 'Sauce', 'TH100', '1', '1', 'EA', '1.250', '12.50',
        ].join('\n')),
      }],
      listDrive: async () => [],
    });
    await replacePapersSkuDocument(seat, 'prior-doc', sauce('06/05/26', '900000', 'TH100', '1.000', '10.00'));
    const review = papersScanSnapshot(seat).rows[0];
    const edited = await applyPapersScanEdit(seat, {
      id: review.id,
      fields: {
        dates: '2026-06-12',
        lineItems: [{ index: 0, sku: 'TH100', unitPrice: '2.25' }],
      },
    });
    expect(edited?.lineItems[0].unitPrice.honesty).toBe('Estimated');
    expect(edited?.lineItems[0].extendedPrice).toMatchObject({ honesty: 'Verified', amount: 12.5 });
    expect(papersSkuRowsForStore(seat, '2026-W23').map((row) => row.documentKey)).toEqual(['prior-doc']);
    expect(papersSkuRowsForStore(seat, '2026-W24')[0]).toEqual(expect.objectContaining({
      documentKey: review.skuDocumentKey,
    }));
    expect(papersSkuRowsForStore(seat, '2026-W24')[0].unitPrice.amount).toBe(2.25);
    expect(papersSkuCompareForStore(seat)?.compare?.rows[0]).toEqual(expect.objectContaining({
      sku: 'TH100',
      priorPeriod: '2026-W23',
      currentPeriod: '2026-W24',
      priorPrice: 1,
      currentPrice: 2.25,
    }));

    hooks.inserts = 0;
    hooks.failInsertNumber = 1;
    await expect(applyPapersScanEdit(seat, {
      id: review.id,
      fields: { lineItems: [{ index: 0, sku: 'NOPE', unitPrice: '9.99' }], dates: '2026-06-19' },
    })).rejects.toBeInstanceOf(PapersSkuPersistError);
    expect(papersScanSnapshot(seat).rows[0].lineItems[0].sku.value).toBe('TH100');
    expect(papersScanSnapshot(seat).rows[0].isoWeek).toBe('2026-W24');
    expect(papersSkuRowsForStore(seat, '2026-W24')[0].unitPrice.amount).toBe(2.25);
    expect(papersSkuRowsForStore(seat, '2026-W25')).toEqual([]);

    forgetPapersSkuMemory();
    await hydratePapersSku(seat);
    expect(papersSkuRowsForStore(seat, '2026-W24')[0].unitPrice.amount).toBe(2.25);
    expect(papersSkuRowsForStore(seat, '2026-W23')[0].documentKey).toBe('prior-doc');

    await reopenDatabase();
    forgetPapersScanMemory(seat);
    await hydratePapersScan(seat);
    await hydratePapersSku(seat);
    expect(papersScanSnapshot(seat).rows[0].lineItems[0].unitPrice.amount).toBe(2.25);
    expect(papersScanSnapshot(seat).rows[0].isoWeek).toBe('2026-W24');
    expect(papersSkuRowsForStore(seat, '2026-W24')[0].itemCode.value).toBe('TH100');
    expect(papersSkuRowsForStore(seat, '2026-W24')[0].unitPrice.amount).toBe(2.25);
    expect(papersSkuRowsForStore(seat, '2026-W23').map((row) => row.documentKey)).toEqual(['prior-doc']);
    expect((await savedLines(seat)).map((row) => row.iso_week).sort()).toEqual(['2026-W23', '2026-W24']);
  }, 30_000);

  it('keeps review and compare together when the review write fails, then retries', async () => {
    const seat = 'seat:pair';
    const bytes = new TextEncoder().encode([
      'Performance', 'Foodservice', 'Date:', '06/05/26', '06/05/26', '900001', 'DRY',
      '1', 'CS', '6/#10Fixture', 'Sauce', 'TH100', '1', '1', 'EA', '1.250', '12.50',
    ].join('\n'));
    enqueuePapersScan(seat);
    await drainPapersScan({
      operatorId: seat,
      listGmail: async () => [{ source: 'gmail', externalId: 'msg-pair', filename: 'fixture-pfg.txt', bytes }],
      listDrive: async () => [],
    });
    await replacePapersSkuDocument(seat, 'other-doc', sauce('06/05/26', '900009', 'TH900', '1.250', '12.50'));
    const review = papersScanSnapshot(seat).rows[0];
    const agreed = await applyPapersScanEdit(seat, {
      id: review.id,
      confirm: true,
      fields: { dates: '2026-06-12', lineItems: [{ index: 0, unitPrice: '2.25' }] },
    });
    expect(agreed?.confirmed).toBe(true);
    expect(agreed?.lineItems[0].unitPrice).toMatchObject({ honesty: 'Estimated', amount: 2.25 });
    expect(agreed?.lineItems[0].extendedPrice).toMatchObject({ honesty: 'Verified', amount: 12.5 });

    hooks.failReviewWrite = true;
    hooks.reviewFailedAfterSku = false;
    await expect(applyPapersScanEdit(seat, {
      id: review.id,
      confirm: true,
      fields: { dates: '2026-06-19', lineItems: [{ index: 0, unitPrice: '8.00' }] },
    })).rejects.toThrow(PAPERS_REVIEW_PERSIST_ERROR);
    expect(hooks.reviewFailedAfterSku).toBe(true);
    expect(papersScanSnapshot(seat).rows[0].lineItems[0].unitPrice.amount).toBe(2.25);
    expect(papersScanSnapshot(seat).rows[0].isoWeek).toBe('2026-W24');
    expect(papersSkuRowsForStore(seat, '2026-W24')[0].unitPrice.amount).toBe(2.25);
    expect(papersSkuRowsForStore(seat, '2026-W25')).toEqual([]);
    expect(papersSkuRowsForStore(seat, '2026-W23').map((row) => row.documentKey)).toEqual(['other-doc']);

    forgetPapersScanMemory(seat);
    forgetPapersSkuMemory(seat);
    await hydratePapersScan(seat);
    await hydratePapersSku(seat);
    expect(papersScanSnapshot(seat).rows[0].lineItems[0].unitPrice.amount).toBe(2.25);
    expect(papersScanSnapshot(seat).rows[0].confirmed).toBe(true);
    expect(papersSkuRowsForStore(seat, '2026-W24')[0].unitPrice.amount).toBe(2.25);
    expect((await savedReviews(seat))[0].row_json.lineItems?.[0].unitPrice?.amount).toBe(2.25);
    expect((await savedLines(seat)).find((row) => row.document_key === 'other-doc')?.row_json.itemCode?.value).toBe('TH900');

    hooks.failReviewWrite = false;
    const retried = await applyPapersScanEdit(seat, {
      id: review.id,
      confirm: true,
      fields: { dates: '2026-06-19', lineItems: [{ index: 0, unitPrice: '8.00' }] },
    });
    expect(retried?.lineItems[0].unitPrice.amount).toBe(8);
    expect(retried?.lineItems[0].extendedPrice).toMatchObject({ honesty: 'Verified', amount: 12.5 });
    expect(retried?.isoWeek).toBe('2026-W25');
    await applyPapersScanEdit(seat, {
      id: review.id,
      confirm: true,
      fields: { lineItems: [{ index: 0, unitPrice: '8.00' }] },
    });
    const pairKey = review.skuDocumentKey ?? '';
    expect(pairKey.startsWith('paper:')).toBe(true);
    expect((await savedLines(seat)).filter((row) => row.document_key === pairKey)).toHaveLength(1);
    expect((await savedReviews(seat)).filter((row) => row.dedupe_key === review.dedupeKey)).toHaveLength(1);
    expect(papersSkuRowsForStore(seat, '2026-W24')).toEqual([]);
    expect(papersSkuRowsForStore(seat, '2026-W23').map((row) => row.documentKey)).toEqual(['other-doc']);

    hooks.delayMs = 40;
    hooks.maxDepth = 0;
    const [first, second] = await Promise.all([
      applyPapersScanEdit(seat, {
        id: review.id,
        fields: { lineItems: [{ index: 0, unitPrice: '4.00' }] },
      }).then((row) => {
        const sku = papersSkuRowsForStore(seat).find((line) => line.documentKey === pairKey);
        expect(row?.lineItems[0].unitPrice.amount).toBe(sku?.unitPrice.amount);
        expect(row?.lineItems[0].unitPrice.amount).toBe(4);
        return row;
      }),
      applyPapersScanEdit(seat, {
        id: review.id,
        fields: { lineItems: [{ index: 0, unitPrice: '5.00' }] },
      }).then((row) => {
        const sku = papersSkuRowsForStore(seat).find((line) => line.documentKey === pairKey);
        expect(row?.lineItems[0].unitPrice.amount).toBe(sku?.unitPrice.amount);
        expect(row?.lineItems[0].unitPrice.amount).toBe(5);
        return row;
      }),
    ]);
    expect(hooks.maxDepth).toBe(1);
    expect(first?.lineItems[0].unitPrice.amount).toBe(4);
    expect(second?.lineItems[0].unitPrice.amount).toBe(5);

    await reopenDatabase();
    forgetPapersScanMemory(seat);
    await hydratePapersScan(seat);
    await hydratePapersSku(seat);
    const coldReview = papersScanSnapshot(seat).rows[0];
    const coldSku = papersSkuRowsForStore(seat, '2026-W25')[0];
    expect(coldReview.lineItems[0].unitPrice.amount).toBe(coldSku.unitPrice.amount);
    expect(coldReview.lineItems[0].unitPrice.amount).toBe(5);
    expect(coldReview.lineItems[0].unitPrice.honesty).toBe('Estimated');
    expect(coldReview.lineItems[0].extendedPrice).toMatchObject({ honesty: 'Verified', amount: 12.5 });
    expect(coldSku.extendedPrice).toMatchObject({ honesty: 'Verified', amount: 12.5 });
    expect(papersSkuRowsForStore(seat, '2026-W23')[0].itemCode.value).toBe('TH900');
    expect(papersSkuRowsForStore(seat).some((row) => row.storeId !== seat)).toBe(false);
  }, 30_000);

  it('follows the seat chosen by a location switch and keeps the other location', async () => {
    const email = 'owner@example.com';
    const seats: AccessibleSeat[] = [
      { operatorId: 301, email, restaurantName: 'Fixture North', plane: 'neon' },
      { operatorId: 302, email, restaurantName: 'Fixture South', plane: 'neon' },
    ];
    expect(pickAccessibleSeat(seats)).toEqual({ ok: false, code: 'pick_store', seats });
    const northPick = pickAccessibleSeat(seats, 'Fixture North');
    const southPick = pickAccessibleSeat(seats, 'Fixture South');
    expect(northPick.ok && northPick.seat.operatorId).toBe(301);
    expect(southPick.ok && southPick.seat.operatorId).toBe(302);
    if (!northPick.ok || !southPick.ok) throw new Error('switch failed');
    const north = `seat:${northPick.seat.operatorId}`;
    const south = `seat:${southPick.seat.operatorId}`;

    await replacePapersSkuDocument(north, 'week', sauce('06/05/26', '900001', 'TH100', '1.250', '12.50'), email);
    await replacePapersSkuDocument(south, 'week', sauce('06/12/26', '900002', 'TH100', '9.000', '9.00'), email);
    let active = south;
    expect(papersSkuRowsForStore(active, '2026-W24')[0].unitPrice.amount).toBe(9);
    expect(papersSkuRowsForStore(north, '2026-W23')[0].unitPrice.amount).toBe(1.25);
    expect(papersSkuRowsForStore(email)).toEqual([]);
    active = north;
    expect(papersSkuCompareForStore(active)?.compare?.rows[0].currentPrice).toBe(1.25);
    expect(papersSkuCompareForStore(south)?.compare?.rows[0].currentPrice).toBe(9);

    await reopenDatabase();
    await hydratePapersSku(north);
    await hydratePapersSku(south);
    expect(papersSkuRowsForStore(north, '2026-W23')[0].storeId).toBe(north);
    expect(papersSkuRowsForStore(south, '2026-W24')[0].unitPrice.amount).toBe(9);
    expect(papersSkuRowsForStore(north, '2026-W24')).toEqual([]);
    expect(await savedLines(south)).toHaveLength(1);
    expect(await savedLines(north)).toHaveLength(1);
  }, 30_000);

  it('does not let a pull of the same paper duplicate or undo a confirmed correction', async () => {
    const paper = [
      'Performance', 'Foodservice', 'Date:', '06/05/26', '06/05/26', '900001', 'DRY',
      '1', 'CS', '6/#10Fixture', 'Sauce', 'TH100', '1', '1', 'EA', '1.250', '12.50',
    ].join('\n');
    const bytes = new TextEncoder().encode(paper);
    const filename = 'fixture-pfg-invoice.txt';
    const weekSeat = 'seat:cross-week';
    const priceSeat = 'seat:cross-price';

    async function scan(seat: string, externalId: string) {
      enqueuePapersScan(seat);
      return drainPapersScan({
        operatorId: seat,
        listGmail: async () => [{ source: 'gmail', externalId, filename, bytes }],
        listDrive: async () => [],
      });
    }

    async function pull(seat: string) {
      rememberPapersToken({ operatorId: seat, accessToken: 'tok', email: 'owner@example.com' });
      return pullLastWeekPapers({
        operatorId: seat,
        fetchGoogle: false,
        listGmail: async () => [{ filename, subject: 'PFG invoice', bytes }],
        listDrive: async () => [],
      });
    }

    resetPapersTokenStore();
    const scanned = await scan(weekSeat, 'msg-cross-week');
    expect(scanned.kept).toBe(1);
    expect(papersScanSnapshot(weekSeat).rows).toHaveLength(1);
    const weekReview = papersScanSnapshot(weekSeat).rows[0];
    const corrected = await applyPapersScanEdit(weekSeat, {
      id: weekReview.id,
      confirm: true,
      fields: { dates: '2026-06-12', lineItems: [{ index: 0, unitPrice: '2.25' }] },
    });
    expect(corrected?.isoWeek).toBe('2026-W24');
    expect(corrected?.lineItems[0].extendedPrice).toMatchObject({ honesty: 'Verified', amount: 12.5 });
    await pull(weekSeat);
    expect(papersSkuRowsForStore(weekSeat, '2026-W24')).toHaveLength(1);
    expect(papersSkuRowsForStore(weekSeat, '2026-W24')[0].unitPrice.amount).toBe(2.25);
    expect(papersSkuRowsForStore(weekSeat, '2026-W23')).toEqual([]);
    expect(new Set(papersSkuRowsForStore(weekSeat).map((row) => row.documentKey)).size).toBe(1);
    expect(papersSkuCompareForStore(weekSeat)?.compare?.rows[0]).toEqual(expect.objectContaining({
      sku: 'TH100',
      currentPrice: 2.25,
      priorPrice: null,
    }));
    expect(weekReview.skuDocumentKey).toBe(`paper:${weekReview.contentHash}`);
    expect((await savedLines(weekSeat)).map((row) => row.document_key)).toEqual([weekReview.skuDocumentKey]);

    await scan(priceSeat, 'msg-cross-price');
    const priceReview = papersScanSnapshot(priceSeat).rows[0];
    await applyPapersScanEdit(priceSeat, {
      id: priceReview.id,
      confirm: true,
      fields: { lineItems: [{ index: 0, unitPrice: '2.25' }] },
    });
    await pull(priceSeat);
    expect(papersSkuRowsForStore(priceSeat)).toHaveLength(1);
    expect(papersSkuRowsForStore(priceSeat)[0].unitPrice.amount).toBe(2.25);
    expect(papersSkuRowsForStore(priceSeat)[0].isoWeek).toBe('2026-W23');
    expect(papersSkuCompareForStore(priceSeat)?.compare?.rows[0].currentPrice).toBe(2.25);
    expect(papersSkuRowsForStore(weekSeat, '2026-W24')[0].unitPrice.amount).toBe(2.25);

    const confirmedLine = structuredClone(papersSkuRowsForStore(priceSeat)[0]);
    confirmedLine.unitPrice = { ...confirmedLine.unitPrice, amount: 1.25, honesty: 'Verified' };
    await replacePapersSkuDocument(priceSeat, `gmail:${filename}`, [confirmedLine]);
    expect(papersSkuRowsForStore(priceSeat)).toHaveLength(2);
    expect(papersSkuCompareForStore(priceSeat)?.compare?.rows).toEqual([
      expect.objectContaining({ sku: 'TH100', currentPrice: 1.75, priorPrice: null }),
    ]);
    await applyPapersScanEdit(priceSeat, {
      id: priceReview.id,
      confirm: true,
      fields: { lineItems: [{ index: 0, unitPrice: '2.25' }] },
    });
    expect(papersSkuRowsForStore(priceSeat)).toHaveLength(1);
    expect(papersSkuRowsForStore(priceSeat)[0].unitPrice.amount).toBe(2.25);
    expect(papersSkuCompareForStore(priceSeat)?.compare?.rows[0].currentPrice).toBe(2.25);
    expect((await savedLines(priceSeat)).some((row) => row.document_key === `gmail:${filename}`)).toBe(false);

    allowPapersRescan(priceSeat);
    enqueuePapersScan(priceSeat);
    const drive = await drainPapersScan({
      operatorId: priceSeat,
      listGmail: async () => [],
      listDrive: async () => [{ source: 'drive', externalId: 'drive-cross-price', filename, bytes }],
    });
    expect(drive.deduped).toBe(1);
    expect(drive.kept).toBe(0);
    expect(papersScanSnapshot(priceSeat).rows).toHaveLength(1);
    expect(papersSkuRowsForStore(priceSeat)[0].unitPrice.amount).toBe(2.25);

    const pullFirst = 'seat:pull-first';
    await pull(pullFirst);
    await pull(pullFirst);
    expect(papersSkuRowsForStore(pullFirst)).toHaveLength(1);
    expect(papersSkuRowsForStore(pullFirst)[0].documentKey.startsWith('paper:')).toBe(true);
    await scan(pullFirst, 'msg-pull-first');
    const openReview = papersScanSnapshot(pullFirst).rows[0];
    expect(papersSkuRowsForStore(pullFirst)).toHaveLength(1);
    await applyPapersScanEdit(pullFirst, {
      id: openReview.id,
      fields: { lineItems: [{ index: 0, unitPrice: '4.00' }] },
    });
    await pull(pullFirst);
    expect(papersSkuRowsForStore(pullFirst)).toHaveLength(1);
    expect(papersSkuRowsForStore(pullFirst)[0].unitPrice).toMatchObject({ honesty: 'Estimated', amount: 4 });
    expect(papersScanSnapshot(pullFirst).rows[0].lineItems[0].unitPrice.amount).toBe(4);

    forgetPapersSkuMemory();
    forgetPapersScanMemory();
    await reopenDatabase();
    await hydratePapersScan(weekSeat);
    await hydratePapersSku(weekSeat);
    await hydratePapersSku(priceSeat);
    expect(papersScanSnapshot(weekSeat).rows[0].confirmed).toBe(true);
    expect(papersScanSnapshot(weekSeat).rows[0].lineItems[0].unitPrice.amount).toBe(2.25);
    expect(papersSkuRowsForStore(weekSeat, '2026-W24')[0].unitPrice.amount).toBe(2.25);
    expect(papersSkuRowsForStore(weekSeat, '2026-W23')).toEqual([]);
    expect(papersSkuRowsForStore(priceSeat)[0].unitPrice.amount).toBe(2.25);
    expect((await savedLines(weekSeat)).map((row) => row.document_key)).toHaveLength(1);
    expect((await savedLines(priceSeat))).toHaveLength(1);

    await pull(weekSeat);
    await pull(priceSeat);
    expect(papersSkuRowsForStore(weekSeat, '2026-W24')[0].unitPrice.amount).toBe(2.25);
    expect(papersSkuRowsForStore(priceSeat)).toHaveLength(1);
    expect(papersSkuRowsForStore(weekSeat).some((row) => row.storeId === priceSeat)).toBe(false);
  }, 30_000);

  it('keeps one complete document when two database transactions write the same key', async () => {
    const seat = 'seat:db-race';
    const documentKey = 'paper:racehashracehashracehashracehashracehashracehashraceha';
    await replacePapersSkuDocument(seat, documentKey, sauce('06/05/26', '900001', 'TH100', '1.250', '12.50'));
    let overlap = 0;
    let maxOverlap = 0;

    async function write(amount: number) {
      const line = sauce('06/05/26', '900001', 'TH100', amount.toFixed(3), '12.50')[0];
      const stored = {
        ...line,
        storeId: seat,
        ownerId: null,
        documentKey,
        lineIndex: 0,
        unitPrice: { ...line.unitPrice, amount, honesty: 'Estimated' as const },
      };
      await database.transaction(async (tx) => {
        overlap += 1;
        maxOverlap = Math.max(maxOverlap, overlap);
        try {
          await tx.query(
            `delete from papers_sku_lines
             where document_key = $1 and (store_id = $2 or operator_id = $2)`,
            [documentKey, seat],
          );
          await tx.query(
            `insert into papers_sku_lines (
               operator_id, store_id, owner_id, document_key, line_index, iso_week, row_json, updated_at
             ) values ($1, $2, $3, $4, $5, $6, $7::jsonb, now())`,
            [seat, seat, null, documentKey, 0, stored.isoWeek, JSON.stringify(stored)],
          );
        } finally {
          overlap -= 1;
        }
      });
    }

    const settled = await Promise.allSettled([write(4), write(5)]);
    const lines = (await savedLines(seat)).filter((row) => row.document_key === documentKey);
    expect(lines).toHaveLength(1);
    expect([4, 5]).toContain(lines[0].row_json.unitPrice?.amount);
    expect(settled.some((row) => row.status === 'fulfilled')).toBe(true);
    // One PGlite connection serialized these two transactions (overlap 1).
    // The survivor is one complete document. Two OS processes were not started.
    expect(maxOverlap).toBe(1);
  }, 30_000);

  it('reloads a cold store after pull and keeps a confirmed price beside the other documents', async () => {
    resetPapersTokenStore();
    const seat = 'seat:cold-pull';
    const other = 'seat:cold-other';
    const firstName = 'fixture-pfg-invoice.txt';
    const firstText = [
      'Performance', 'Foodservice', 'Date:', '06/05/26', '06/05/26', '900001', 'DRY',
      '1', 'CS', '6/#10Fixture', 'Sauce', 'TH100', '1', '1', 'EA', '1.250', '12.50',
    ].join('\n');
    const firstBytes = new TextEncoder().encode(firstText);
    const firstKey = papersSkuDocumentKey(papersContentHash(firstBytes));
    const thirdName = 'fixture-pfg-third-invoice.txt';
    const thirdBytes = new TextEncoder().encode([
      'Performance', 'Foodservice', 'Date:', '06/19/26', '06/19/26', '900003', 'DRY',
      '1', 'CS', '6/#10Fixture', 'Sauce', 'TH300', '1', '1', 'EA', '3.000', '3.00',
    ].join('\n'));
    const thirdKey = papersSkuDocumentKey(papersContentHash(thirdBytes));

    enqueuePapersScan(seat);
    await drainPapersScan({
      operatorId: seat,
      listGmail: async () => [{ source: 'gmail', externalId: 'msg-cold-first', filename: firstName, bytes: firstBytes }],
      listDrive: async () => [],
    });
    const review = papersScanSnapshot(seat).rows[0];
    await applyPapersScanEdit(seat, {
      id: review.id,
      confirm: true,
      fields: { dates: '2026-06-12', lineItems: [{ index: 0, unitPrice: '2.25' }] },
    });
    await replacePapersSkuDocument(seat, 'second-doc', sauce('05/29/26', '900002', 'TH900', '9.000', '9.00'));
    await replacePapersSkuDocument(other, 'other-doc', sauce('06/05/26', '900001', 'TH100', '4.000', '4.00'));

    forgetPapersSkuMemory(seat);
    await replacePapersSkuDocument(seat, 'third-doc', sauce('06/19/26', '900003', 'TH300', '3.000', '3.00'));
    expect(papersSkuRowsForStore(seat).map((row) => row.documentKey)).toEqual(['third-doc']);
    await hydratePapersSku(seat);
    expect(papersSkuRowsForStore(seat).map((row) => row.documentKey).sort()).toEqual([
      firstKey,
      'second-doc',
      'third-doc',
    ].sort());
    expect(papersSkuRowsForStore(seat).find((row) => row.documentKey === firstKey)?.unitPrice.amount).toBe(2.25);
    expect((await savedLines(seat)).map((row) => row.document_key).sort()).toEqual([
      firstKey,
      'second-doc',
      'third-doc',
    ].sort());

    resetPapersSkuStore();
    forgetPapersScanMemory();
    setPapersSkuExecutorForTests(executorFor(database));
    rememberPapersToken({ operatorId: seat, accessToken: 'tok', email: 'owner@example.com' });
    const pulledThird = await pullLastWeekPapers({
      operatorId: seat,
      fetchGoogle: false,
      listGmail: async () => [{ filename: thirdName, subject: 'PFG invoice', bytes: thirdBytes }],
      listDrive: async () => [],
    });
    expect(papersSkuRowsForStore(seat).map((row) => row.documentKey).sort()).toEqual([
      firstKey,
      'second-doc',
      'third-doc',
      thirdKey,
    ].sort());
    expect(pulledThird.compare?.compare?.rows.map((row) => row.sku).sort()).toEqual(['TH100', 'TH300', 'TH900']);
    expect(pulledThird.compare?.compare?.rows.find((row) => row.sku === 'TH100')).toEqual(expect.objectContaining({
      currentPrice: 2.25,
      currentPeriod: '2026-W24',
    }));
    expect(papersSkuRowsForStore(seat, '2026-W23').map((row) => row.itemCode.value)).toEqual([]);
    await hydratePapersSku(other);
    expect(papersSkuRowsForStore(other)[0].unitPrice.amount).toBe(4);
    expect(papersSkuRowsForStore(other).some((row) => row.storeId === seat)).toBe(false);

    const again = await pullLastWeekPapers({
      operatorId: seat,
      fetchGoogle: false,
      listGmail: async () => [{ filename: thirdName, subject: 'PFG invoice', bytes: thirdBytes }],
      listDrive: async () => [],
    });
    expect(again.compare?.compare?.rows.find((row) => row.sku === 'TH300')?.currentPrice).toBe(3);
    expect((await savedLines(seat)).filter((row) => row.document_key === thirdKey)).toHaveLength(1);

    forgetPapersSkuMemory();
    await replacePapersSkuDocument(seat, `gmail:${firstName}`, sauce('06/05/26', '900001', 'TH100', '1.250', '12.50'));
    expect(papersSkuRowsForStore(seat).map((row) => row.unitPrice.amount)).toEqual([1.25]);
    await hydratePapersSku(seat);
    expect(papersSkuRowsForStore(seat).find((row) => row.documentKey === firstKey)?.unitPrice.amount).toBe(2.25);
    expect(papersSkuRowsForStore(seat).some((row) => row.documentKey === `gmail:${firstName}` && row.unitPrice.amount === 1.25)).toBe(true);

    const pulledSame = await pullLastWeekPapers({
      operatorId: seat,
      fetchGoogle: false,
      listGmail: async () => [{ filename: firstName, subject: 'PFG invoice', bytes: firstBytes }],
      listDrive: async () => [],
    });
    expect(papersSkuRowsForStore(seat).filter((row) => row.itemCode.value === 'TH100')).toEqual([
      expect.objectContaining({ documentKey: firstKey, isoWeek: '2026-W24', unitPrice: expect.objectContaining({ amount: 2.25 }) }),
    ]);
    expect(papersSkuRowsForStore(seat).some((row) => row.documentKey === `gmail:${firstName}`)).toBe(false);
    expect(pulledSame.compare?.compare?.rows.find((row) => row.sku === 'TH100')?.currentPrice).toBe(2.25);
    expect(papersSkuRowsForStore(seat).find((row) => row.documentKey === 'second-doc')?.isoWeek).toBe('2026-W22');
    await hydratePapersScan(seat);
    expect(papersScanSnapshot(seat).rows[0].confirmed).toBe(true);
    expect(papersScanSnapshot(seat).rows[0].lineItems[0].unitPrice.amount).toBe(2.25);

    forgetPapersSkuMemory(seat);
    await Promise.all([
      replacePapersSkuDocument(seat, 'race-left', sauce('06/05/26', '900004', 'TH400', '4.000', '4.00')),
      replacePapersSkuDocument(seat, 'race-right', sauce('06/12/26', '900005', 'TH500', '5.000', '5.00')),
    ]);
    await hydratePapersSku(seat);
    expect(papersSkuRowsForStore(seat).find((row) => row.documentKey === firstKey)?.unitPrice.amount).toBe(2.25);
    expect(papersSkuRowsForStore(seat).find((row) => row.documentKey === 'race-left')?.unitPrice.amount).toBe(4);
    expect(papersSkuRowsForStore(seat).find((row) => row.documentKey === 'race-right')?.unitPrice.amount).toBe(5);

    await reopenDatabase();
    await hydratePapersSku(seat);
    await hydratePapersSku(other);
    await hydratePapersScan(seat);
    expect(papersSkuRowsForStore(seat).find((row) => row.documentKey === firstKey)?.unitPrice.amount).toBe(2.25);
    expect(papersSkuRowsForStore(seat).find((row) => row.documentKey === 'second-doc')?.unitPrice.amount).toBe(9);
    expect(papersSkuRowsForStore(seat, '2026-W23').map((row) => row.itemCode.value)).toEqual(['TH400']);
    expect(papersSkuRowsForStore(other)[0].unitPrice.amount).toBe(4);
    expect(papersScanSnapshot(seat).rows[0].lineItems[0].unitPrice.amount).toBe(2.25);
    expect((await savedLines(seat)).some((row) => row.document_key === `gmail:${firstName}`)).toBe(false);
  }, 30_000);
});
