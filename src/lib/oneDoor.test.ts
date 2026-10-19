import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ONE_DOOR_ALIAS_HOSTS,
  ONE_DOOR_CANONICAL_HOST,
  ONE_DOOR_CANONICAL_ORIGIN,
  canonicalOneDoorUrl,
  isOneDoorAliasHost,
  isOneDoorCanonicalHost,
  normalizeHost,
} from './oneDoor';

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

describe('one door — never86.ai only', () => {
  it('names the canonical host and known aliases', () => {
    expect(ONE_DOOR_CANONICAL_HOST).toBe('www.never86.ai');
    expect(ONE_DOOR_CANONICAL_ORIGIN).toBe('https://www.never86.ai');
    expect(ONE_DOOR_ALIAS_HOSTS).toContain('app.never86.app');
    expect(ONE_DOOR_ALIAS_HOSTS).toContain('never86.app');
  });

  it('detects alias hosts including port suffixes', () => {
    expect(normalizeHost('App.Never86.App:443')).toBe('app.never86.app');
    expect(isOneDoorAliasHost('app.never86.app')).toBe(true);
    expect(isOneDoorAliasHost('www.never86.app')).toBe(true);
    expect(isOneDoorAliasHost('never86.app')).toBe(true);
    expect(isOneDoorAliasHost('www.never86.ai')).toBe(false);
    expect(isOneDoorCanonicalHost('www.never86.ai')).toBe(true);
    expect(isOneDoorCanonicalHost('app.never86.app')).toBe(false);
  });

  it('builds canonical URLs with path and query', () => {
    expect(canonicalOneDoorUrl('/check/invoices')).toBe(
      'https://www.never86.ai/check/invoices',
    );
    expect(canonicalOneDoorUrl('/seat', '?from=app')).toBe(
      'https://www.never86.ai/seat?from=app',
    );
  });

  it('gates alias hosts in proxy before auth', () => {
    const proxy = read('src/proxy.ts');
    expect(proxy).toContain('isOneDoorAliasHost');
    expect(proxy).toContain('canonicalOneDoorUrl');
    expect(proxy).toContain('!_next/static');
    expect(proxy).toContain('isGatedPath');
  });

  it('keeps vercel.json host redirects for app.never86.app', () => {
    const vercel = read('vercel.json');
    expect(vercel).toContain('app.never86.app');
    expect(vercel).toContain('https://www.never86.ai/:path*');
  });

  it('locks agent docs to main + never86.ai', () => {
    const agents = read('AGENTS.md');
    const rule = read('.cursor/rules/never86.mdc');
    const door = read('docs/ONE-DOOR.md');
    expect(agents).toMatch(/www\.never86\.ai/);
    expect(agents).toMatch(/Work on `main`/);
    expect(agents).toMatch(/app\.never86\.app/);
    expect(rule).toMatch(/ONE DOOR/);
    expect(rule).toMatch(/recovery-apr12/);
    expect(door).toMatch(/Namecheap/);
    expect(door).toMatch(/cname\.vercel-dns\.com/);
  });
});
