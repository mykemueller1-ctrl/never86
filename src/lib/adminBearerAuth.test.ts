import { afterEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { adminBearerOk } from './adminBearerAuth';

const ORIGINAL = {
  CRON_SECRET: process.env.CRON_SECRET,
  ADMIN_API_SECRET: process.env.ADMIN_API_SECRET,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
};

afterEach(() => {
  restore('CRON_SECRET', ORIGINAL.CRON_SECRET);
  restore('ADMIN_API_SECRET', ORIGINAL.ADMIN_API_SECRET);
  restore('ADMIN_PASSWORD', ORIGINAL.ADMIN_PASSWORD);
});

function restore(name: 'CRON_SECRET' | 'ADMIN_API_SECRET' | 'ADMIN_PASSWORD', value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

function req(headers: Record<string, string> = {}, cookie?: string) {
  return new NextRequest('https://www.never86.ai/api/admin/person-access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
      ...(cookie ? { cookie } : {}),
    },
  });
}

describe('adminBearerOk', () => {
  it('fails closed when no admin secrets are set', () => {
    delete process.env.CRON_SECRET;
    delete process.env.ADMIN_API_SECRET;
    delete process.env.ADMIN_PASSWORD;
    expect(adminBearerOk(req({ authorization: 'Bearer anything' }))).toBe(false);
  });

  it('accepts Bearer ADMIN_API_SECRET when CRON_SECRET is unset', () => {
    delete process.env.CRON_SECRET;
    delete process.env.ADMIN_PASSWORD;
    process.env.ADMIN_API_SECRET = 'admin-api-test-secret';
    expect(adminBearerOk(req({ authorization: 'Bearer admin-api-test-secret' }))).toBe(true);
    expect(adminBearerOk(req({ authorization: 'Bearer wrong' }))).toBe(false);
  });

  it('still accepts Bearer CRON_SECRET', () => {
    delete process.env.ADMIN_API_SECRET;
    delete process.env.ADMIN_PASSWORD;
    process.env.CRON_SECRET = 'cron-test-secret';
    expect(adminBearerOk(req({ authorization: 'Bearer cron-test-secret' }))).toBe(true);
    expect(adminBearerOk(req({ authorization: 'Bearer admin-api-test-secret' }))).toBe(false);
  });

  it('does not treat an empty ADMIN_API_SECRET as a pass', () => {
    delete process.env.CRON_SECRET;
    delete process.env.ADMIN_PASSWORD;
    process.env.ADMIN_API_SECRET = '   ';
    expect(adminBearerOk(req({ authorization: 'Bearer    ' }))).toBe(false);
  });
});
