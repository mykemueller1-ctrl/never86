import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from './route';

describe('POST /api/operator/set-password', () => {
  it('fails closed with 401 when there is no signed operator session cookie', async () => {
    const req = new NextRequest('https://www.never86.ai/api/operator/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'a-long-enough-password' }),
    });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body).toEqual({ success: false, error: 'Sign in first.' });
  });
});
