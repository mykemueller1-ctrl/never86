import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createDbMock, makeGetRequest } from '@/test/db-mock';
import { zReports, invoices, briefings } from '@/db/schema';

const { dbHolder } = vi.hoisted(() => ({ dbHolder: { current: null as any } }));
vi.mock('@/db', () => ({
  db: new Proxy({}, { get: (_t, prop: string) => dbHolder.current?.[prop] }),
}));

const { generateBriefing } = vi.hoisted(() => ({ generateBriefing: vi.fn() }));
vi.mock('@/lib/anthropic', () => ({ generateBriefing }));

const { sendMorningBriefing } = vi.hoisted(() => ({ sendMorningBriefing: vi.fn() }));
vi.mock('@/lib/email', () => ({ sendMorningBriefing }));

import { GET } from './route';

const authorized = { headers: { authorization: 'Bearer test-cron-secret' } };

beforeEach(() => {
  generateBriefing.mockReset();
  generateBriefing.mockResolvedValue('<html>briefing</html>');
  sendMorningBriefing.mockReset();
  sendMorningBriefing.mockResolvedValue({ id: 'e1' });
});

describe('GET /api/briefing', () => {
  it('rejects requests without the cron secret', async () => {
    dbHolder.current = createDbMock();

    const res = await GET(makeGetRequest());

    expect(res.status).toBe(401);
    expect(generateBriefing).not.toHaveBeenCalled();
    expect(sendMorningBriefing).not.toHaveBeenCalled();
  });

  it('rejects a wrong secret', async () => {
    dbHolder.current = createDbMock();

    const res = await GET(makeGetRequest({ headers: { authorization: 'Bearer wrong' } }));

    expect(res.status).toBe(401);
  });

  it('generates and emails the briefing, flagging off-target costs', async () => {
    dbHolder.current = createDbMock(
      new Map<unknown, unknown>([
        [zReports, [{ foodCostPercent: '35.00', primeCostPercent: '65.00' }]],
        [invoices, [{ id: 'inv-1' }]],
        [briefings, [{ id: 'b1' }]],
      ]),
    );

    const res = await GET(makeGetRequest(authorized));
    const data = await res.json();

    expect(data.success).toBe(true);
    expect(data.briefingId).toBe('b1');
    expect(sendMorningBriefing).toHaveBeenCalledOnce();

    const briefingData = generateBriefing.mock.calls[0][0];
    expect(briefingData.alerts).toEqual([
      expect.stringMatching(/Food cost at 35% — above 32%/),
      expect.stringMatching(/Prime cost at 65% — above 62%/),
    ]);
  });

  it('raises no alerts when costs are within target', async () => {
    dbHolder.current = createDbMock(
      new Map<unknown, unknown>([
        [zReports, [{ foodCostPercent: '28.00', primeCostPercent: '58.00' }]],
        [invoices, []],
        [briefings, [{ id: 'b2' }]],
      ]),
    );

    await GET(makeGetRequest(authorized));

    expect(generateBriefing.mock.calls[0][0].alerts).toEqual([]);
  });
});
