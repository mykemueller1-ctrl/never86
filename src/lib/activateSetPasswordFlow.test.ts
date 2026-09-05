import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

describe('activation flow prompts a one-time password set before opening the desk', () => {
  const client = read('src/app/activate/ActivateClient.tsx');

  it('calls the set-password endpoint and shares the min/max length constants', () => {
    expect(client).toContain("fetch('/api/operator/set-password'");
    expect(client).toContain("import { MAX_FREE_SEAT_PASSWORD_LEN, MIN_FREE_SEAT_PASSWORD_LEN");
    expect(client).toMatch(/minLength=\{MIN_FREE_SEAT_PASSWORD_LEN\}/);
    expect(client).toMatch(/maxLength=\{MAX_FREE_SEAT_PASSWORD_LEN\}/);
    expect(client).toMatch(/password\.length > MAX_FREE_SEAT_PASSWORD_LEN/);
  });

  it('lets the operator skip straight to the desk without setting a password', () => {
    expect(client).toContain('Skip for now');
    expect(client).toContain('function goToDesk()');
    expect(client).toMatch(/onClick=\{goToDesk\}/);
  });

  it('only opens the operator desk after activation succeeds, via the shared redirect', () => {
    expect(client).toContain('OWNER_DESK_POST_AUTH_REDIRECT');
    expect(client).toContain('window.location.replace(redirect)');
  });
});
