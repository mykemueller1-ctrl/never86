import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OWNER_DESK_POST_AUTH_REDIRECT } from './ownerDeskAuth';

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

const AUTH_FILES = [
  'src/app/login/LoginClient.tsx',
  'src/app/login/page.tsx',
  'src/app/activate/ActivateClient.tsx',
  'src/app/api/operator/login/route.ts',
  'src/app/api/operator/set-password/route.ts',
  'src/app/api/auth/login/route.ts',
  'src/app/api/auth/set-password/route.ts',
  'src/app/api/admin/person-password/route.ts',
  'src/app/api/admin/person-access/route.ts',
  'src/lib/personAuth.ts',
] as const;

describe('email+password live door', () => {
  it('wires /login to /api/operator/login and keeps magic-link as backup', () => {
    const login = read('src/app/login/LoginClient.tsx');
    expect(login).toContain("fetch('/api/operator/login'");
    expect(login).toContain("fetch('/api/onboard/request'");
    expect(login).toContain('Email + password');
    expect(login).toContain('Email link');
    expect(login).toContain('OWNER_DESK_POST_AUTH_REDIRECT');
    expect(login).not.toMatch(/\bPulse\b/);
    expect(OWNER_DESK_POST_AUTH_REDIRECT).toBe('/operator');
  });

  it('exposes the probed /api/auth/login and /api/auth/set-password aliases', () => {
    expect(read('src/app/api/auth/login/route.ts')).toContain("export { POST } from '../../operator/login/route'");
    expect(read('src/app/api/auth/login/route.ts')).toContain("export const dynamic = 'force-dynamic'");
    expect(read('src/app/api/auth/set-password/route.ts')).toContain("export { POST } from '../../operator/set-password/route'");
    expect(read('src/app/api/auth/set-password/route.ts')).toContain("export const runtime = 'nodejs'");
  });

  it('keeps public second-store claim as 409 and does not invent plus-alias seats', () => {
    const activation = read('src/lib/operatorActivation.ts');
    expect(activation).toContain('refuseExistingSeatStoreMismatch');
    expect(read('src/lib/personAuth.ts')).toContain('isPlusAliasEmail');
    expect(read('src/lib/personAuth.ts')).toContain('Do not mint plus-alias seats');
    expect(read('src/app/api/admin/person-access/route.ts')).toContain('grantPersonAccess');
  });

  it('does not reintroduce Pulse or invented honesty labels on the auth door', () => {
    for (const file of AUTH_FILES) {
      const source = read(file);
      expect(source).not.toMatch(/\bPulse\b/);
      expect(source).not.toMatch(/honesty/i);
    }
  });
});

describe('returning owners land in the desk, not the claim/login forms', () => {
  it('redirects a signed-in /login visit straight to the owner desk', () => {
    const page = read('src/app/login/page.tsx');
    expect(page).toContain('readOperatorSession');
    expect(page).toMatch(/redirect\(OWNER_DESK_POST_AUTH_REDIRECT\)/);
    expect(page).toContain("from './LoginClient'");
  });

  it('redirects a signed-in /onboard visit straight to the owner desk', () => {
    const page = read('src/app/onboard/page.tsx');
    expect(page).toContain('readOperatorSession');
    expect(page).toMatch(/redirect\(OWNER_DESK_POST_AUTH_REDIRECT\)/);
    expect(page).toContain("from './OnboardClient'");
  });
});

describe('activation flow prompts a one-time password set before opening the desk', () => {
  const client = read('src/app/activate/ActivateClient.tsx');

  it('calls the set-password endpoint and shares the min/max length constants', () => {
    expect(client).toContain("fetch('/api/operator/set-password'");
    expect(client).toContain('MAX_FREE_SEAT_PASSWORD_LEN');
    expect(client).toContain('MIN_FREE_SEAT_PASSWORD_LEN');
    expect(client).toMatch(/password\.length > MAX_FREE_SEAT_PASSWORD_LEN/);
  });

  it('lets the operator skip straight to the desk without setting a password', () => {
    expect(client).toContain('Skip for now');
    expect(client).toContain('function goToDesk()');
    expect(client).toMatch(/onClick=\{goToDesk\}/);
  });
});
