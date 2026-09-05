import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';
import { POST } from './route';

describe('POST /api/portal/house', () => {
  it('fails closed without HOUSE_CODE_PORTAL_ENABLED', async () => {
    const response = await POST(
      new NextRequest('http://localhost/api/portal/house', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: 'N86-SAMPLE-HOUSE' }),
      }),
    );
    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.liveIssuance).toBe('blocked');
    expect(JSON.stringify(body)).not.toMatch(/karlee|sturtz|pin/i);
  });
});
