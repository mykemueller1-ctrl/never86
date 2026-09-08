import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OWNER_DESK_POST_AUTH_REDIRECT } from './ownerDeskAuth';

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

const CTAP_PII = /communitypizza2026@gmail\.com|Kenzy|Karlee|Ashley/;

describe('returning owners land in the desk, not the claim/login forms', () => {
  it('redirects a signed-in /login visit straight to the owner desk', () => {
    const page = read('src/app/login/page.tsx');
    expect(page).toContain('readOperatorSession');
    expect(page).toMatch(/redirect\(OWNER_DESK_POST_AUTH_REDIRECT\)/);
    expect(page).toContain("from './LoginClient'");
    expect(OWNER_DESK_POST_AUTH_REDIRECT).toBe('/operator');
  });

  it('redirects a signed-in /onboard (Claim seat) visit straight to the owner desk', () => {
    const page = read('src/app/onboard/page.tsx');
    expect(page).toContain('readOperatorSession');
    expect(page).toMatch(/redirect\(OWNER_DESK_POST_AUTH_REDIRECT\)/);
    expect(page).toContain("from './OnboardClient'");
  });

  it('keeps the magic-link and password forms in their own client components', () => {
    const loginClient = read('src/app/login/LoginClient.tsx');
    expect(loginClient).toContain("'use client'");
    expect(read('src/app/onboard/OnboardClient.tsx')).toContain("'use client'");
    expect(loginClient).toContain('OWNER_DESK_POST_AUTH_REDIRECT');
    expect(loginClient).toContain('/api/operator/login');
    expect(loginClient).toContain('/api/onboard/request');
    expect(loginClient).not.toMatch(/\|\|\s*'\/operator'/);
    expect(loginClient).not.toMatch(CTAP_PII);
    expect(loginClient).toContain('you@restaurant.com');
  });

  it('asks unsigned /operator visitors to sign in instead of rendering the desk', () => {
    const page = read('src/app/operator/page.tsx');
    const gate = read('src/app/operator/OperatorSignIn.tsx');
    expect(page).toContain('readOperatorSession');
    expect(page).toContain('OperatorSignIn');
    expect(page).toContain('SimpleOwnerDemo');
    expect(gate).toMatch(/Sign in to your operator/);
    expect(gate).toContain('href="/login"');
    expect(gate).not.toMatch(/Claim the owner seat/);
    expect(gate).not.toContain('Prime Cost Coach');
    expect(gate).not.toMatch(/useState\(\s*['"]Fun['"]/);
    expect(gate).not.toMatch(CTAP_PII);
  });
});
