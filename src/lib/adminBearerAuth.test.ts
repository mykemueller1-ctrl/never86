import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { adminBearerOk, adminOk, isOwnerPersonEmail } from './adminBearerAuth';
import { OPERATOR_COOKIE, signOperatorSession } from './operatorSession';

const ORIGINAL = {
  CRON_SECRET: process.env.CRON_SECRET,
  ADMIN_API_SECRET: process.env.ADMIN_API_SECRET,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  OWNER_EMAIL: process.env.OWNER_EMAIL,
  OPERATOR_SESSION_SECRET: process.env.OPERATOR_SESSION_SECRET,
};

beforeAll(() => {
  process.env.OPERATOR_SESSION_SECRET = 'test-secret-please-change';
});

afterEach(() => {
  restore('CRON_SECRET', ORIGINAL.CRON_SECRET);
  restore('ADMIN_API_SECRET', ORIGINAL.ADMIN_API_SECRET);
  restore('ADMIN_PASSWORD', ORIGINAL.ADMIN_PASSWORD);
  restore('OWNER_EMAIL', ORIGINAL.OWNER_EMAIL);
  process.env.OPERATOR_SESSION_SECRET = 'test-secret-please-change';
});

function restore(
  name: 'CRON_SECRET' | 'ADMIN_API_SECRET' | 'ADMIN_PASSWORD' | 'OWNER_EMAIL',
  value: string | undefined,
) {
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

function clearAdminSecrets() {
  delete process.env.CRON_SECRET;
  delete process.env.ADMIN_API_SECRET;
  delete process.env.ADMIN_PASSWORD;
}

describe('adminBearerOk', () => {
  it('fails closed when no admin secrets are set', () => {
    clearAdminSecrets();
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

describe('adminOk owner person session', () => {
  it('allows a signed n86_operator session for mykemueller1@gmail.com without Vercel secrets', async () => {
    clearAdminSecrets();
    delete process.env.OWNER_EMAIL;
    const token = await signOperatorSession(1, '  MykeMueller1@gmail.com ', Date.now());
    expect(await adminOk(req({}, `${OPERATOR_COOKIE}=${token}`))).toBe(true);
  });

  it('allows a signed session whose email matches OWNER_EMAIL', async () => {
    clearAdminSecrets();
    process.env.OWNER_EMAIL = '  Owner.Desk@Never86.ai ';
    const token = await signOperatorSession(2, 'owner.desk@never86.ai', Date.now());
    expect(await adminOk(req({}, `${OPERATOR_COOKIE}=${token}`))).toBe(true);
  });

  it('denies a random signed-in person session', async () => {
    clearAdminSecrets();
    delete process.env.OWNER_EMAIL;
    const token = await signOperatorSession(3, 'ktmaduna@gmail.com', Date.now());
    expect(await adminOk(req({}, `${OPERATOR_COOKIE}=${token}`))).toBe(false);
  });

  it('refuses a plus-alias of the owner email even when the cookie verifies', async () => {
    clearAdminSecrets();
    delete process.env.OWNER_EMAIL;
    const token = await signOperatorSession(4, 'mykemueller1+cos@gmail.com', Date.now());
    expect(await adminOk(req({}, `${OPERATOR_COOKIE}=${token}`))).toBe(false);
    expect(isOwnerPersonEmail('mykemueller1+cos@gmail.com')).toBe(false);
    expect(isOwnerPersonEmail('mykemueller1@gmail.com')).toBe(true);
  });

  it('still accepts Bearer ADMIN_API_SECRET when no owner cookie is present', async () => {
    delete process.env.CRON_SECRET;
    delete process.env.ADMIN_PASSWORD;
    process.env.ADMIN_API_SECRET = 'admin-api-test-secret';
    expect(await adminOk(req({ authorization: 'Bearer admin-api-test-secret' }))).toBe(true);
  });

  it('fails closed on a missing or forged operator cookie', async () => {
    clearAdminSecrets();
    expect(await adminOk(req())).toBe(false);
    expect(await adminOk(req({}, `${OPERATOR_COOKIE}=not-a-token`))).toBe(false);
  });
});
