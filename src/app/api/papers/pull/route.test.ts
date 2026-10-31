import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { NextRequest } from 'next/server';
import { POST as pullPost } from './route';
import { GET as scanGet, POST as scanPost } from '../scan/route';
import { POST as reviewPost } from '../scan/row/route';
import * as papersGoogle from '@/lib/papersGoogle';
import * as papersScanSources from '@/lib/papersScanSources';
import { rememberPapersToken, resetPapersTokenStore } from '@/lib/papersInboxHttp';
import { forgetPapersScanMemory, resetPapersScanStore } from '@/lib/papersScanJob';
import {
  checkedQueryRows,
  forgetPapersSkuMemory,
  papersSkuRowsForStore,
  resetPapersSkuStore,
  setPapersSkuExecutorForTests,
  type SkuExecutor,
  type SkuStatement,
} from '@/lib/papersSkuStore';
import { createMemoryObjectStore } from '@/lib/simpleOwnerDemo/objectStore';
import { createMemoryRepository } from '@/lib/simpleOwnerDemo/repository';
import { createSimpleOwnerDemoService, type SimpleOwnerDemoService } from '@/lib/simpleOwnerDemo/service';
import { setSimpleOwnerDemoServiceForTests } from '@/lib/simpleOwnerDemo/runtime';
import { OPERATOR_COOKIE, signOperatorSession } from '@/lib/operatorSession';

const FILENAME = 'fixture-pfg-invoice.txt';
const SUBJECT = 'PFG invoice';
const INVOICE = [
  'Performance', 'Foodservice', 'Date:', '06/05/26', '06/05/26', '900001', 'DRY',
  '1', 'CS', '6/#10Fixture', 'Sauce', 'TH100', '1', '1', 'EA', '1.250', '12.50',
].join('\n');
const BYTES = new TextEncoder().encode(INVOICE);

const envKeys = ['DATABASE_URL', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'OPERATOR_SESSION_SECRET'] as const;
const previousEnv: Partial<Record<(typeof envKeys)[number], string | undefined>> = {};

let database: PGlite;
let gmailPull: ReturnType<typeof vi.spyOn>;
let drivePull: ReturnType<typeof vi.spyOn>;
let gmailScan: ReturnType<typeof vi.spyOn>;
let driveScan: ReturnType<typeof vi.spyOn>;
let fetchSpy: ReturnType<typeof vi.spyOn>;

function executorFor(db: PGlite): SkuExecutor {
  return {
    async transaction(statements: SkuStatement[]) {
      const results: unknown[][] = [];
      await db.transaction(async (tx) => {
        for (const statement of statements) {
          const result = await tx.query(statement.text, statement.values);
          results.push(checkedQueryRows(result.rows));
        }
      });
      return results;
    },
    async query<T>(text: string, values?: unknown[]): Promise<T[]> {
      const result = await db.query(text, values ?? []);
      return checkedQueryRows<T>(result.rows);
    },
  };
}

function memoryDemo(): SimpleOwnerDemoService {
  return createSimpleOwnerDemoService({
    repo: createMemoryRepository(),
    objects: createMemoryObjectStore(),
  });
}

function request(path: string, method: string, cookie?: string, body?: unknown): NextRequest {
  const headers = new Headers();
  if (cookie) headers.set('cookie', cookie);
  if (body !== undefined) headers.set('content-type', 'application/json');
  return new NextRequest(`http://localhost${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function seatCookie(operatorId: number): Promise<string> {
  const token = await signOperatorSession(operatorId, `seat${operatorId}@example.com`, Date.now());
  if (!token) throw new Error('test session was not signed');
  return `${OPERATOR_COOKIE}=${token}`;
}

type CompareBody = {
  success?: boolean;
  honesty?: string;
  error?: string;
  code?: string;
  compare?: { rows?: Array<{ sku?: string; currentPrice?: number; currentPeriod?: string }> } | null;
};

function th100(body: CompareBody) {
  return body.compare?.rows?.find((row) => row.sku === 'TH100');
}

describe('POST /api/papers/pull with the scan and review handlers', () => {
  beforeAll(async () => {
    for (const key of envKeys) previousEnv[key] = process.env[key];
    delete process.env.DATABASE_URL;
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
    process.env.OPERATOR_SESSION_SECRET = 'test-operator-session-secret';

    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      if (/googleapis|google\.com|neon\.tech|amazonaws/i.test(url)) {
        throw new Error(`blocked outbound call ${url}`);
      }
      return new Response('not found', { status: 404 });
    });
    gmailPull = vi.spyOn(papersGoogle, 'listGmailOperatorPapers').mockResolvedValue([
      { filename: FILENAME, subject: SUBJECT, bytes: BYTES },
    ]);
    drivePull = vi.spyOn(papersGoogle, 'listDriveOperatorPapers').mockResolvedValue([]);
    gmailScan = vi.spyOn(papersScanSources, 'listGmailScanCandidates').mockResolvedValue([
      { source: 'gmail', externalId: 'msg-route-1', filename: FILENAME, subject: SUBJECT, bytes: BYTES },
    ]);
    driveScan = vi.spyOn(papersScanSources, 'listDriveScanCandidates').mockResolvedValue([]);

    const dir = mkdtempSync(path.join(tmpdir(), 'never86-pull-route-'));
    database = new PGlite(dir);
    await database.waitReady;
    setPapersSkuExecutorForTests(executorFor(database));
    setSimpleOwnerDemoServiceForTests(memoryDemo());
    resetPapersSkuStore();
    resetPapersScanStore();
    resetPapersTokenStore();
    setPapersSkuExecutorForTests(executorFor(database));
    rememberPapersToken({ operatorId: 'seat:11', accessToken: 'synthetic-access-token', refreshToken: null, email: null });
    rememberPapersToken({ operatorId: 'seat:22', accessToken: 'synthetic-access-token', refreshToken: null, email: null });
  }, 120_000);

  afterAll(async () => {
    gmailPull?.mockRestore();
    drivePull?.mockRestore();
    gmailScan?.mockRestore();
    driveScan?.mockRestore();
    fetchSpy?.mockRestore();
    setSimpleOwnerDemoServiceForTests(null);
    setPapersSkuExecutorForTests(null);
    resetPapersSkuStore();
    resetPapersScanStore();
    resetPapersTokenStore();
    for (const key of envKeys) {
      const value = previousEnv[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    await database?.close();
  });

  it('runs the pull, scan, and review handlers on one synthetic seat', async () => {
    const owner = await seatCookie(11);
    const other = await seatCookie(22);

    const forged = await pullPost(request('/api/papers/pull', 'POST', `${OPERATOR_COOKIE}=not-a-token`));
    const forgedBody = await forged.json() as CompareBody;
    expect(forged.status).toBe(200);
    expect(th100(forgedBody)?.currentPrice).toBeUndefined();
    expect(gmailPull).not.toHaveBeenCalled();

    const first = await pullPost(request('/api/papers/pull', 'POST', owner));
    const firstBody = await first.json() as CompareBody;
    expect(first.status).toBe(200);
    expect(firstBody.success).toBe(true);
    expect(th100(firstBody)).toEqual(expect.objectContaining({ currentPrice: 1.25, currentPeriod: '2026-W23' }));
    expect(gmailPull).toHaveBeenCalledTimes(1);
    expect(drivePull).toHaveBeenCalled();

    const scanned = await scanPost(request('/api/papers/scan', 'POST', owner, {}));
    const scannedBody = await scanned.json() as { success: boolean; rows: Array<{ id: string; contentHash: string }> };
    expect(scanned.status).toBe(200);
    expect(scannedBody.success).toBe(true);
    expect(scannedBody.rows).toHaveLength(1);
    expect(gmailScan).toHaveBeenCalledTimes(1);
    expect(driveScan).toHaveBeenCalled();
    const reviewId = scannedBody.rows[0].id;

    const denied = await reviewPost(request('/api/papers/scan/row', 'POST', other, {
      id: reviewId,
      confirm: true,
      fields: { dates: '2026-06-19', lineItems: [{ index: 0, unitPrice: '9.99' }] },
    }));
    const deniedBody = await denied.json() as { success: boolean; error: string };
    expect(denied.status).toBe(404);
    expect(deniedBody.success).toBe(false);
    expect(deniedBody.error).toBe('Row Missing.');
    expect(papersSkuRowsForStore('seat:11')[0].unitPrice.amount).toBe(1.25);
    expect(papersSkuRowsForStore('seat:22')).toEqual([]);

    const corrected = await reviewPost(request('/api/papers/scan/row', 'POST', owner, {
      id: reviewId,
      confirm: true,
      fields: { dates: '2026-06-12', lineItems: [{ index: 0, unitPrice: '2.25' }] },
    }));
    const correctedBody = await corrected.json() as {
      success: boolean;
      row: { confirmed: boolean; isoWeek: string; lineItems: Array<{ unitPrice: { amount: number; honesty: string }; extendedPrice: { amount: number; honesty: string } }> };
    };
    expect(corrected.status).toBe(200);
    expect(correctedBody.success).toBe(true);
    expect(correctedBody.row.confirmed).toBe(true);
    expect(correctedBody.row.isoWeek).toBe('2026-W24');
    expect(correctedBody.row.lineItems[0].unitPrice).toMatchObject({ honesty: 'Estimated', amount: 2.25 });
    expect(correctedBody.row.lineItems[0].extendedPrice).toMatchObject({ honesty: 'Verified', amount: 12.5 });

    const again = await pullPost(request('/api/papers/pull', 'POST', owner));
    const againBody = await again.json() as CompareBody;
    expect(again.status).toBe(200);
    expect(againBody.success).toBe(true);
    expect(th100(againBody)).toEqual(expect.objectContaining({ currentPrice: 2.25, currentPeriod: '2026-W24' }));
    expect(papersSkuRowsForStore('seat:11').filter((row) => row.itemCode.value === 'TH100')).toHaveLength(1);

    forgetPapersSkuMemory();
    forgetPapersScanMemory();
    const coldPull = await pullPost(request('/api/papers/pull', 'POST', owner));
    const coldBody = await coldPull.json() as CompareBody;
    expect(coldPull.status).toBe(200);
    expect(th100(coldBody)).toEqual(expect.objectContaining({ currentPrice: 2.25, currentPeriod: '2026-W24' }));
    const coldScan = await scanGet(request('/api/papers/scan', 'GET', owner));
    const coldScanBody = await coldScan.json() as { rows: Array<{ confirmed: boolean; isoWeek: string; lineItems: Array<{ unitPrice: { amount: number } }> }> };
    expect(coldScan.status).toBe(200);
    expect(coldScanBody.rows).toHaveLength(1);
    expect(coldScanBody.rows[0].confirmed).toBe(true);
    expect(coldScanBody.rows[0].isoWeek).toBe('2026-W24');
    expect(coldScanBody.rows[0].lineItems[0].unitPrice.amount).toBe(2.25);

    const forgedAfter = await pullPost(request('/api/papers/pull', 'POST', `${OPERATOR_COOKIE}=not-a-token`));
    const forgedAfterBody = await forgedAfter.json() as CompareBody;
    expect(forgedAfter.status).toBe(200);
    expect(th100(forgedAfterBody)?.currentPrice).toBeUndefined();
    const otherScan = await scanGet(request('/api/papers/scan', 'GET', other));
    const otherScanBody = await otherScan.json() as { rows: unknown[] };
    expect(otherScanBody.rows).toEqual([]);

    setSimpleOwnerDemoServiceForTests({
      async upload() {
        return { ok: false, status: 503, error: 'Desk upload failed.', code: 'upload_failed' };
      },
      async ask() {
        return { ok: false, status: 500, error: 'unused', code: 'unused' };
      },
      async readiness() {
        throw new Error('readiness must not run after the upload fails');
      },
    });
    const failed = await pullPost(request('/api/papers/pull', 'POST', owner));
    const failedBody = await failed.json() as CompareBody;
    expect(failed.status).toBe(503);
    expect(failedBody.success).toBe(false);
    expect(failedBody.honesty).toBe('Missing');
    expect(failedBody.code).toBe('papers_upload_failed');
    expect(failedBody.error).toMatch(/Papers were saved/);
    expect(failedBody.error).toMatch(/Desk upload failed/);
    expect(th100(failedBody)).toEqual(expect.objectContaining({ currentPrice: 2.25, currentPeriod: '2026-W24' }));

    forgetPapersSkuMemory('seat:11');
    const { hydratePapersSku } = await import('@/lib/papersSkuStore');
    await hydratePapersSku('seat:11');
    const kept = papersSkuRowsForStore('seat:11').find((row) => row.itemCode.value === 'TH100');
    expect(kept?.unitPrice).toMatchObject({ honesty: 'Estimated', amount: 2.25 });
    expect(kept?.extendedPrice).toMatchObject({ honesty: 'Verified', amount: 12.5 });
    expect(kept?.isoWeek).toBe('2026-W24');
    const saved = await database.query<{ n: number }>(
      `select count(*)::int as n from papers_sku_lines where store_id = 'seat:11' and row_json->'itemCode'->>'value' = 'TH100'`,
    );
    expect(saved.rows[0].n).toBe(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  }, 30_000);
});
