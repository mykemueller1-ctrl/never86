import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as passwordPost } from './route';
import { POST as accessPost } from '../person-access/route';

function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('admin person password / access', () => {
  it('fails closed without admin cookie or CRON bearer', async () => {
    const pw = await passwordPost(
      post('https://www.never86.ai/api/admin/person-password', {
        email: 'ktmaduna@gmail.com',
        password: 'shared-password-1',
      }),
    );
    const access = await accessPost(
      post('https://www.never86.ai/api/admin/person-access', {
        email: 'ktmaduna@gmail.com',
        operatorId: 1_000_000,
      }),
    );
    expect(pw.status).toBe(401);
    expect(access.status).toBe(401);
  });
});
