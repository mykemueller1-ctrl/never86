import { beforeAll, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { POST as passwordPost } from './route';
import { POST as accessPost } from '../person-access/route';
import { OPERATOR_COOKIE, signOperatorSession } from '@/lib/operatorSession';

beforeAll(() => {
  process.env.OPERATOR_SESSION_SECRET = 'test-secret-please-change';
});

function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('admin person password / access', () => {
  it('fails closed without admin cookie or CRON / ADMIN_API bearer', async () => {
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

  it('accepts Bearer ADMIN_API_SECRET when CRON_SECRET is unset', async () => {
    const prevCron = process.env.CRON_SECRET;
    const prevAdmin = process.env.ADMIN_API_SECRET;
    delete process.env.CRON_SECRET;
    process.env.ADMIN_API_SECRET = 'admin-api-test-secret';
    try {
      const pw = await passwordPost(
        post(
          'https://www.never86.ai/api/admin/person-password',
          { email: 'ktmaduna@gmail.com', copyPasswordFrom: 'mykemueller1@gmail.com' },
          { authorization: 'Bearer admin-api-test-secret' },
        ),
      );
      const access = await accessPost(
        post(
          'https://www.never86.ai/api/admin/person-access',
          { email: 'mykemueller1@gmail.com', operatorId: 1_000_000, detach: true },
          { authorization: 'Bearer admin-api-test-secret' },
        ),
      );
      expect(pw.status).not.toBe(401);
      expect(access.status).not.toBe(401);
    } finally {
      if (prevCron === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = prevCron;
      if (prevAdmin === undefined) delete process.env.ADMIN_API_SECRET;
      else process.env.ADMIN_API_SECRET = prevAdmin;
    }
  });

  it('accepts a signed owner n86_operator session without bearer secrets', async () => {
    const prevCron = process.env.CRON_SECRET;
    const prevAdmin = process.env.ADMIN_API_SECRET;
    const prevPw = process.env.ADMIN_PASSWORD;
    delete process.env.CRON_SECRET;
    delete process.env.ADMIN_API_SECRET;
    delete process.env.ADMIN_PASSWORD;
    const token = await signOperatorSession(1, 'mykemueller1@gmail.com', Date.now());
    try {
      const pw = await passwordPost(
        post(
          'https://www.never86.ai/api/admin/person-password',
          { email: 'ktmaduna@gmail.com', copyPasswordFrom: 'mykemueller1@gmail.com' },
          { cookie: `${OPERATOR_COOKIE}=${token}` },
        ),
      );
      const access = await accessPost(
        post(
          'https://www.never86.ai/api/admin/person-access',
          { email: 'mykemueller1@gmail.com', operatorId: 1_000_000, detach: true },
          { cookie: `${OPERATOR_COOKIE}=${token}` },
        ),
      );
      expect(pw.status).not.toBe(401);
      expect(access.status).not.toBe(401);
    } finally {
      if (prevCron === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = prevCron;
      if (prevAdmin === undefined) delete process.env.ADMIN_API_SECRET;
      else process.env.ADMIN_API_SECRET = prevAdmin;
      if (prevPw === undefined) delete process.env.ADMIN_PASSWORD;
      else process.env.ADMIN_PASSWORD = prevPw;
    }
  });

  it('denies a random person session and a plus-alias owner session', async () => {
    const prevCron = process.env.CRON_SECRET;
    const prevAdmin = process.env.ADMIN_API_SECRET;
    const prevPw = process.env.ADMIN_PASSWORD;
    delete process.env.CRON_SECRET;
    delete process.env.ADMIN_API_SECRET;
    delete process.env.ADMIN_PASSWORD;
    const randomToken = await signOperatorSession(9, 'random.owner@example.com', Date.now());
    const plusToken = await signOperatorSession(10, 'mykemueller1+exact3@gmail.com', Date.now());
    try {
      const randomPw = await passwordPost(
        post(
          'https://www.never86.ai/api/admin/person-password',
          { email: 'ktmaduna@gmail.com', copyPasswordFrom: 'mykemueller1@gmail.com' },
          { cookie: `${OPERATOR_COOKIE}=${randomToken}` },
        ),
      );
      const plusAccess = await accessPost(
        post(
          'https://www.never86.ai/api/admin/person-access',
          { email: 'ktmaduna@gmail.com', operatorId: 1_000_000 },
          { cookie: `${OPERATOR_COOKIE}=${plusToken}` },
        ),
      );
      expect(randomPw.status).toBe(401);
      expect(plusAccess.status).toBe(401);
    } finally {
      if (prevCron === undefined) delete process.env.CRON_SECRET;
      else process.env.CRON_SECRET = prevCron;
      if (prevAdmin === undefined) delete process.env.ADMIN_API_SECRET;
      else process.env.ADMIN_API_SECRET = prevAdmin;
      if (prevPw === undefined) delete process.env.ADMIN_PASSWORD;
      else process.env.ADMIN_PASSWORD = prevPw;
    }
  });
});
