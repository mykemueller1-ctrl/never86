import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './route';

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

function post(body: unknown) {
  return POST(
    new NextRequest('http://localhost/api/audit-intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('POST /api/audit-intake', () => {
  it('rejects a bad identity payload', async () => {
    const res = await post({ email: 'not-an-email', platform: 'DoorDash' });
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
  });

  it('fails closed when Resend is not configured', async () => {
    vi.stubEnv('RESEND_API_KEY', '');
    delete process.env.RESEND_API_KEY;
    const res = await post({
      email: 'owner@restaurant.test',
      name: 'Ada',
      restaurantName: 'Ada’s',
      platform: 'DoorDash',
      utmCampaign: '100_statement_audit',
    });
    const body = await res.json();
    expect(res.status).toBe(503);
    expect(body.success).toBe(false);
    expect(body.emailSent).toBe(false);
    expect(body.code).toBe('email_unavailable');
  });
});
