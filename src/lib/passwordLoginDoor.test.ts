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
  'src/app/api/operator/stores/route.ts',
  'src/app/api/operator/switch-store/route.ts',
  'src/app/api/auth/login/route.ts',
  'src/app/api/auth/set-password/route.ts',
  'src/app/api/login/route.ts',
  'src/app/api/password/route.ts',
  'src/app/api/portal/login/route.ts',
  'src/app/portal/login/page.tsx',
  'src/app/api/admin/person-password/route.ts',
  'src/app/api/admin/person-access/route.ts',
  'src/lib/personAuth.ts',
  'src/components/OperatorStoreSwitcher.tsx',
] as const;

describe('email+password live door', () => {
  it('makes /login email+password only — magic link is set-password / reset, not a daily tab', () => {
    const login = read('src/app/login/LoginClient.tsx');
    expect(login).toContain("fetch('/api/operator/login'");
    expect(login).toContain("fetch('/api/onboard/request'");
    expect(login).toContain("purpose: 'reset'");
    expect(login).toContain("sourcePage: '/login/reset'");
    expect(login).toContain('Email + password');
    expect(login).toContain('Forgot password? Email a set-password link');
    expect(login).toContain('window.location.assign');
    expect(login).toContain('OWNER_DESK_POST_AUTH_REDIRECT');
    expect(login).not.toContain('Email link');
    expect(login).not.toMatch(/magic-link tab/i);
    expect(login).not.toMatch(/\bPulse\b/);
    expect(OWNER_DESK_POST_AUTH_REDIRECT).toBe('/operator');
  });

  it('exposes the probed login aliases so CTAP portal login is not a 404', () => {
    expect(read('src/app/api/auth/login/route.ts')).toContain("export { POST } from '../../operator/login/route'");
    expect(read('src/app/api/auth/login/route.ts')).toContain("export const dynamic = 'force-dynamic'");
    expect(read('src/app/api/auth/set-password/route.ts')).toContain("export { POST } from '../../operator/set-password/route'");
    expect(read('src/app/api/auth/set-password/route.ts')).toContain("export const runtime = 'nodejs'");
    expect(read('src/app/api/login/route.ts')).toContain("export { POST } from '../operator/login/route'");
    expect(read('src/app/api/password/route.ts')).toContain("export { POST } from '../operator/set-password/route'");
    expect(read('src/app/api/portal/login/route.ts')).toContain("export { POST } from '../../operator/login/route'");
    expect(read('src/app/portal/login/page.tsx')).toContain("from '../../login/LoginClient'");
    expect(read('src/app/portal/login/page.tsx')).toContain('readOperatorSession');
  });

  it('kills the 1-store-per-email 409 and refuses plus-alias seats', () => {
    const activation = read('src/lib/operatorActivation.ts');
    const schema = read('src/lib/ensureFreeSeatSchema.ts');
    expect(activation).toContain('decideSeatClaim');
    expect(activation).toContain("action !== 'create-isolated'");
    expect(activation).not.toContain('refuseExistingSeatStoreMismatch(restaurantName, existingName)');
    expect(schema).toContain('drop constraint if exists seat_operators_email_key');
    expect(schema).toContain('drop constraint if exists seat_credentials_email_key');
    expect(schema).toContain('seat_credentials_one_per_operator_idx');
    expect(read('src/lib/personAuth.ts')).toContain('isPlusAliasEmail');
    expect(read('src/lib/personAuth.ts')).toContain('Do not mint plus-alias seats');
    expect(read('src/app/api/admin/person-access/route.ts')).toContain('grantPersonAccess');
    expect(read('src/app/api/onboard/request/route.ts')).toContain("purpose: z.enum(['activate', 'reset'])");
    expect(read('sql/0010_person_password.sql')).toContain('drop constraint if exists seat_operators_email_key');
  });

  it('switches isolated stores on the same signed-in email without a second login email', () => {
    const switcher = read('src/components/OperatorStoreSwitcher.tsx');
    const operatorPage = read('src/app/operator/page.tsx');
    const stores = read('src/app/api/operator/stores/route.ts');
    const switchStore = read('src/app/api/operator/switch-store/route.ts');
    expect(operatorPage).toContain('OperatorStoreSwitcher');
    expect(operatorPage).toContain('SimpleOwnerDemo');
    expect(switcher).toContain("fetch('/api/operator/stores'");
    expect(switcher).toContain("fetch('/api/operator/switch-store'");
    expect(stores).toContain('listAccessibleSeats');
    expect(switchStore).toContain('signOperatorSession');
    expect(switchStore).toContain('pickAccessibleSeat');
    expect(switchStore).not.toContain('verifyPassword');
    expect(switchStore).not.toMatch(/body\?\.password/);
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

describe('activation flow requires a one-time password set before opening the desk', () => {
  const client = read('src/app/activate/ActivateClient.tsx');

  it('calls the set-password endpoint and shares the min/max length constants', () => {
    expect(client).toContain("fetch('/api/operator/set-password'");
    expect(client).toContain('MAX_FREE_SEAT_PASSWORD_LEN');
    expect(client).toContain('MIN_FREE_SEAT_PASSWORD_LEN');
    expect(client).toMatch(/password\.length > MAX_FREE_SEAT_PASSWORD_LEN/);
  });

  it('does not let the operator skip the password', () => {
    expect(client).not.toContain('Skip for now');
    expect(client).toContain('Save password & open my operator');
    expect(client).toMatch(/required/);
  });
});
