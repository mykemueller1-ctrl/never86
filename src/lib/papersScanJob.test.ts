import { describe, expect, it } from 'vitest';
import {
  allowPapersRescan,
  applyPapersScanEdit,
  drainPapersScan,
  enqueuePapersScan,
  papersScanSnapshot,
  resetPapersScanStore,
} from './papersScanJob';
import { PAPERS_SCAN_MAX_BYTES, type PapersScanCandidate } from './papersScanTypes';

function textCandidate(partial: Partial<PapersScanCandidate> & Pick<PapersScanCandidate, 'externalId' | 'filename'>): PapersScanCandidate {
  const text = partial.bytes ? '' : 'unused';
  const bytes = partial.bytes ?? new TextEncoder().encode(text);
  return {
    source: 'gmail',
    subject: '',
    bytes,
    byteLength: bytes.byteLength,
    ...partial,
  };
}

describe('papers scan job', () => {
  it('dedupes by message id plus content hash, skips junk and oversize files, and stays idempotent', async () => {
    resetPapersScanStore();
    const invoice = new TextEncoder().encode('FIXTURE\nVendor: Fixture Foods\nInvoice Number: FIX-9\nInvoice Date: 2026-09-02\nInvoice Total: $12.00\n');
    const changed = new TextEncoder().encode('FIXTURE\nVendor: Fixture Foods\nInvoice Number: FIX-9\nInvoice Date: 2026-09-02\nInvoice Total: $14.00\n');
    const candidates: PapersScanCandidate[] = [
      textCandidate({ externalId: 'msg-1:a', filename: 'invoice.txt', bytes: invoice }),
      textCandidate({ externalId: 'msg-1:a', filename: 'invoice.txt', bytes: invoice }),
      textCandidate({ externalId: 'msg-1:a', filename: 'invoice-v2.txt', bytes: changed }),
      textCandidate({ externalId: 'msg-2', filename: 'vacation-selfie.jpg', bytes: new TextEncoder().encode('not a paper') }),
      {
        source: 'drive',
        externalId: 'file-big',
        filename: 'huge-invoice.pdf',
        byteLength: PAPERS_SCAN_MAX_BYTES + 1,
        skip: 'oversize',
      },
    ];

    enqueuePapersScan('seat:scan');
    const first = await drainPapersScan({
      operatorId: 'seat:scan',
      listGmail: async () => candidates.filter((row) => row.source === 'gmail'),
      listDrive: async () => candidates.filter((row) => row.source === 'drive'),
    });
    expect(first.status).toBe('done');
    expect(first.gmail).toBe('read');
    expect(first.drive).toBe('read');
    expect(first.kept).toBe(2);
    expect(first.deduped).toBe(1);
    expect(first.skipped).toBe(2);
    const rows = papersScanSnapshot('seat:scan').rows;
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.total.amount).sort()).toEqual([12, 14]);
    expect(rows.every((row) => row.fixture === false)).toBe(true);

    const second = await drainPapersScan({
      operatorId: 'seat:scan',
      listGmail: async () => candidates.filter((row) => row.source === 'gmail'),
      listDrive: async () => [],
    });
    expect(second.kept).toBe(2);
    expect(papersScanSnapshot('seat:scan').rows).toHaveLength(2);

    allowPapersRescan('seat:scan');
    enqueuePapersScan('seat:scan');
    const third = await drainPapersScan({
      operatorId: 'seat:scan',
      listGmail: async () => [candidates[0]],
      listDrive: async () => [],
    });
    expect(third.deduped).toBe(1);
    expect(third.kept).toBe(0);
    expect(papersScanSnapshot('seat:scan').rows).toHaveLength(2);
  });

  it('keeps an operator edit Estimated and a blank field Missing', async () => {
    resetPapersScanStore();
    const bytes = new TextEncoder().encode('FIXTURE\nVendor: Fixture Foods\nInvoice Total: $12.00\nInvoice Date: 2026-09-02\n');
    await drainPapersScan({
      operatorId: 'seat:edit',
      listGmail: async () => [textCandidate({ externalId: 'msg-edit', filename: 'invoice.txt', bytes })],
      listDrive: async () => [],
    });
    const original = papersScanSnapshot('seat:edit').rows[0];
    expect(original.total.honesty).toBe('Verified');
    const same = await applyPapersScanEdit('seat:edit', {
      id: original.id,
      confirm: true,
      fields: { total: '$12.00', vendorName: '' },
    });
    expect(same?.confirmed).toBe(true);
    expect(same?.total.honesty).toBe('Verified');
    expect(same?.total.amount).toBe(12);
    expect(same?.vendorName.honesty).toBe('Missing');
    const edited = await applyPapersScanEdit('seat:edit', {
      id: original.id,
      fields: { total: '$15.00' },
    });
    expect(edited?.total).toMatchObject({ honesty: 'Estimated', amount: 15 });
    expect(edited?.total.note).toMatch(/Operator edited/);
    expect(edited?.confirmed).toBe(true);
  });

  it('fails closed when Google is not connected and invents no rows', async () => {
    resetPapersScanStore();
    const job = await drainPapersScan({ operatorId: 'seat:empty', accessToken: null });
    expect(job.status).toBe('failed');
    expect(job.error).toMatch(/Connect Google/);
    expect(papersScanSnapshot('seat:empty').rows).toEqual([]);
  });
});
