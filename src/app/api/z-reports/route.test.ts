import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDbMock, makeJsonRequest } from '@/test/db-mock';
import { zReports } from '@/db/schema';

const { dbHolder } = vi.hoisted(() => ({ dbHolder: { current: null as any } }));
vi.mock('@/db', () => ({
  db: new Proxy({}, { get: (_t, prop: string) => dbHolder.current?.[prop] }),
}));

const { parseZReport } = vi.hoisted(() => ({ parseZReport: vi.fn() }));
vi.mock('@/lib/anthropic', () => ({ parseZReport }));

import { POST } from './route';

beforeEach(() => {
  parseZReport.mockReset();
});

describe('POST /api/z-reports', () => {
  it('computes cost percentages from the parsed numbers and stores them', async () => {
    parseZReport.mockResolvedValue({
      reportDate: '2026-05-20',
      grossSales: 1100,
      netSales: 1000,
      foodSales: 300,
      liquorSales: 150,
      laborCost: 320,
      guestCount: 80,
      checkAverage: 12.5,
    });
    const dbMock = createDbMock(new Map([[zReports, [{ id: 'z-1' }]]]));
    dbHolder.current = dbMock;

    const res = await POST(makeJsonRequest({ rawText: 'Z REPORT', userId: 'store-1' }));
    const data = await res.json();

    expect(data.success).toBe(true);
    // Assert the computed percentages reach the insert payload.
    const inserted = dbMock.insert.mock.results[0].value.values.mock.calls[0][0];
    expect(inserted.foodCostPercent).toBe('30.00');
    expect(inserted.liquorCostPercent).toBe('15.00');
    expect(inserted.primeCostPercent).toBe('62.00');
  });

  it('returns 400 when the parser fails', async () => {
    parseZReport.mockRejectedValue(new Error('parse failed'));
    dbHolder.current = createDbMock();

    const res = await POST(makeJsonRequest({ rawText: 'junk' }));

    expect(res.status).toBe(400);
  });

  it('returns 400 for empty rawText', async () => {
    dbHolder.current = createDbMock();

    const res = await POST(makeJsonRequest({ rawText: '' }));

    expect(res.status).toBe(400);
    expect(parseZReport).not.toHaveBeenCalled();
  });
});
