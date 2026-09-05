import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { OWNER_DESK_POST_AUTH_REDIRECT } from './ownerDeskAuth';

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

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
    expect(read('src/app/login/LoginClient.tsx')).toContain("'use client'");
    expect(read('src/app/onboard/OnboardClient.tsx')).toContain("'use client'");
  });
});
