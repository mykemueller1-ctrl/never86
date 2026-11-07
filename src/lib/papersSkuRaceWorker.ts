/**
 * One side of the two-process papers race. The parent starts Postgres,
 * then starts this file twice. Nothing here reads DATABASE_URL.
 */
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import postgres from 'postgres';
import type { PapersLabeledField } from './papersScanTypes';
import type { PapersSkuRow } from './papersSkuParse';
import {
  checkedQueryRows,
  commitReviewedDocument,
  papersSkuDocumentKey,
  replacePapersSkuDocument,
  replaceUnreviewedPaperDocument,
  setPapersSkuExecutorForTests,
  type SkuExecutor,
  type SkuStatement,
} from './papersSkuStore';

const role = process.env.PAPERS_RACE_ROLE;
const url = process.env.PAPERS_RACE_URL?.trim() ?? '';
const signalDir = process.env.PAPERS_RACE_DIR?.trim() ?? '';
const hash = process.env.PAPERS_RACE_HASH?.trim().toLowerCase() ?? '';
const seat = 'seat:race-proc';
const otherSeat = 'seat:race-other';

function fail(message: string): never {
  process.stderr.write(`${message}\n`);
  process.exit(1);
}

function field(value: string, amount: number | null, honesty: PapersLabeledField['honesty']): PapersLabeledField {
  return { honesty, value, amount, note: null };
}

function line(amount: number, week: string, honesty: PapersLabeledField['honesty']): PapersSkuRow {
  return {
    productName: field('Fixture Sauce', null, 'Verified'),
    itemCode: field('TH100', null, 'Verified'),
    quantity: field('1', 1, 'Verified'),
    unit: field('EA', null, 'Verified'),
    unitPrice: field(amount.toFixed(3), amount, honesty),
    extendedPrice: field('12.50', 12.5, 'Verified'),
    vendor: field('Performance Foodservice', null, 'Verified'),
    documentDate: field(week === '2026-W24' ? '2026-06-12' : '2026-06-05', null, 'Verified'),
    documentNumber: field('900001', null, 'Verified'),
    category: field('food', null, 'Verified'),
    isoWeek: week,
    documentKey: papersSkuDocumentKey(hash),
    sourceHash: hash,
  };
}

/** postgres.js json-encodes every bound value. A JSON string would be stored as a string scalar, so object text is parsed back first. */
function pgValue(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return value;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (parsed && typeof parsed === 'object') return parsed;
  } catch {
    return value;
  }
  return value;
}

function executor(sql: postgres.Sql, pauseAfterLock: boolean): SkuExecutor {
  return {
    async transaction(statements: SkuStatement[]) {
      const results = await sql.begin(async (tx) => {
        const out: unknown[][] = [];
        for (const statement of statements) {
          const rows = await tx.unsafe(statement.text, statement.values.map(pgValue) as never[]);
          out.push(checkedQueryRows(rows as readonly unknown[]));
          if (pauseAfterLock && /for update/i.test(statement.text)) {
            writeFileSync(path.join(signalDir, 'review-holding'), '1');
            const release = path.join(signalDir, 'release-review');
            const started = Date.now();
            while (!existsSync(release)) {
              if (Date.now() - started > 20_000) throw new Error('review held the lock until the wait expired');
              await new Promise((resolve) => setTimeout(resolve, 30));
            }
          }
        }
        return out;
      });
      return results;
    },
    async query<T>(text: string, values: unknown[] = []): Promise<T[]> {
      const rows = await sql.unsafe(text, values.map(pgValue) as never[]);
      return checkedQueryRows<T>(rows as readonly unknown[]);
    },
  };
}

async function main(): Promise<void> {
  if ((role !== 'review' && role !== 'raw') || !url || !signalDir || !/^[a-f0-9]{64}$/.test(hash)) {
    fail('race worker is missing its role, url, signal dir, or hash');
  }
  const sql = postgres(url, {
    max: 1,
    ssl: false,
    idle_timeout: 5,
    connect_timeout: 10,
    onnotice: () => undefined,
  });
  setPapersSkuExecutorForTests(executor(sql, role === 'review'));
  try {
    if (role === 'review') {
      const other = line(4, '2026-W23', 'Verified');
      other.documentKey = 'other-doc';
      other.sourceHash = null;
      await replacePapersSkuDocument(otherSeat, 'other-seat-doc', [{ ...other, documentKey: 'other-seat-doc' }]);
      await replacePapersSkuDocument(seat, 'other-doc', [other]);
      await commitReviewedDocument(
        seat,
        papersSkuDocumentKey(hash),
        [line(2.25, '2026-W24', 'Estimated')],
        {
          dedupeKey: `gmail:msg-race:${hash}`,
          rowJson: {
            contentHash: hash,
            skuDocumentKey: papersSkuDocumentKey(hash),
            confirmed: true,
            isoWeek: '2026-W24',
          },
        },
        null,
        { sourceHash: hash, legacyKeys: ['gmail:fixture-race.txt'], replaceHashSiblings: true },
      );
      process.stdout.write('committed\n');
      return;
    }
    const outcome = await replaceUnreviewedPaperDocument(
      seat,
      hash,
      [line(1.25, '2026-W23', 'Verified')],
      ['gmail:fixture-race.txt'],
    );
    process.stdout.write(`${outcome}\n`);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error: unknown) => {
  fail(error instanceof Error ? error.message : 'race worker failed');
});
