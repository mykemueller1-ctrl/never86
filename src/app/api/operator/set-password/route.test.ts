import { beforeAll, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { signOperatorSession, OPERATOR_COOKIE } from '@/lib/operatorSession';
import * as operatorActivation from '@/lib/operatorActivation';
import { POST } from './route';


beforeAll(() => {
  process.env.OPERATOR_SESSION_SECRET = 'test-secret-please-change';
});

function requestWithCookie(cookie: string | null, body: unknown) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookie) headers.cookie = `${OPERATOR_COOKIE}=${cookie}`;
  return new NextRequest('https://www.never86.ai/api/operator/set-password', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('POST /api/operator/set-password', () => {
  it('fails closed with 401 when there is no signed operator session cookie', async () => {
    const req = requestWithCookie(null, { password: 'a-long-enough-password' });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(401);
    expect(body).toEqual({ success: false, error: 'Sign in first.' });
  });

  it('rejects a signed-in request with too short a password before writing anything', async () => {
    const token = await signOperatorSession(1_000_001, 'owner@example.test', Date.now());
    const spy = vi.spyOn(operatorActivation, 'setFreeSeatPassword');
    const req = requestWithCookie(token!, { password: 'short' });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(400);
    expect(body.success).toBe(false);
    expect(spy).toHaveBeenCalledWith(1_000_001, 'owner@example.test', 'short');
    spy.mockRestore();
  });

  it('saves the password for a signed-in operator and returns success', async () => {
    const token = await signOperatorSession(1_000_002, 'owner2@example.test', Date.now());
    const spy = vi
      .spyOn(operatorActivation, 'setFreeSeatPassword')
      .mockResolvedValue({ ok: true });
    const req = requestWithCookie(token!, { password: 'a-long-enough-password' });
    const res = await POST(req);
    const body = await res.json();
    expect(res.status).toBe(200);
    expect(body).toEqual({ success: true });
    expect(spy).toHaveBeenCalledWith(1_000_002, 'owner2@example.test', 'a-long-enough-password');
    spy.mockRestore();
  });
});
