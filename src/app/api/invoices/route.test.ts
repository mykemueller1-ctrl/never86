import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDbMock, makeJsonRequest, makeGetRequest } from '@/test/db-mock';
import { invoices } from '@/db/schema';

const { dbHolder } = vi.hoisted(() => ({ dbHolder: { current: null as any } }));
vi.mock('@/db', () => ({
  db: new Proxy({}, { get: (_t, prop: string) => dbHolder.current?.[prop] }),
}));

const { parseInvoice } = vi.hoisted(() => ({ parseInvoice: vi.fn() }));
vi.mock('@/lib/anthropic', () => ({ parseInvoice }));

import { POST, GET } from './route';

beforeEach(() => {
  parseInvoice.mockReset();
});

describe('POST /api/invoices', () => {
  it('parses the invoice and stores the returned row', async () => {
    parseInvoice.mockResolvedValue({
      vendorName: 'Sysco',
      invoiceNumber: 'INV-9',
      invoiceDate: '2026-05-20',
      totalAmount: 482.55,
      category: 'food',
      lineItems: [],
    });
    dbHolder.current = createDbMock(new Map([[invoices, [{ id: 'uuid-1', vendorName: 'Sysco' }]]]));

    const res = await POST(makeJsonRequest({ rawText: 'INVOICE TEXT', userId: 'store-1' }));
    const data = await res.json();

    expect(parseInvoice).toHaveBeenCalledWith('INVOICE TEXT');
    expect(data.success).toBe(true);
    expect(data.invoice.vendorName).toBe('Sysco');
  });

  it('returns 400 when parsing fails', async () => {
    parseInvoice.mockRejectedValue(new Error('model exploded'));
    dbHolder.current = createDbMock();

    const res = await POST(makeJsonRequest({ rawText: 'bad' }));
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toMatch(/model exploded/);
  });

  it('returns 400 for empty rawText', async () => {
    dbHolder.current = createDbMock();

    const res = await POST(makeJsonRequest({ rawText: '' }));

    expect(res.status).toBe(400);
    expect(parseInvoice).not.toHaveBeenCalled();
  });
});

describe('GET /api/invoices', () => {
  it('filters by userId so it cannot leak other tenants rows (regression)', async () => {
    const dbMock = createDbMock(new Map([[invoices, [{ id: 'uuid-1', userId: 'store-7' }]]]));
    dbHolder.current = dbMock;

    const res = await GET(makeGetRequest({ searchParams: { userId: 'store-7' } }));
    const data = await res.json();

    expect(data.invoices).toHaveLength(1);
    // The query must apply a WHERE user filter rather than selecting every row.
    const selectBuilder = dbMock.select.mock.results[0].value;
    expect(selectBuilder.where).toHaveBeenCalledOnce();
  });
});
