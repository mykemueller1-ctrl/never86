import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOUSE_CODE_BRAND_BLUE, HOUSE_CODE_SEAT_DOOR } from './houseCode';

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

describe('post-merge deploy-verify locks', () => {
  it('keeps the stranger funnel email-first to /onboard', () => {
    const home = read('src/components/HomePage.tsx');
    expect(home).toMatch(/Claim the free owner seat/);
    expect(home).toContain('href="/onboard"');
    expect(home).not.toMatch(/Start playing/);
    expect(read('src/components/HumanSiteShell.tsx')).toMatch(/href="\/onboard"/);
  });

  it('redirects /communities to the house-code /portal door', () => {
    expect(HOUSE_CODE_SEAT_DOOR).toBe('/portal');
    expect(read('src/app/communities/page.tsx')).toMatch(/redirect\(HOUSE_CODE_SEAT_DOOR\)/);
    expect(read('next.config.js')).toMatch(/source: '\/communities'/);
    expect(read('next.config.js')).toMatch(/destination: '\/portal'/);
    expect(read('src/app/portal/page.tsx')).toMatch(/only community seat/i);
    expect(read('src/app/login/page.tsx')).toMatch(/href="\/portal"/);
  });

  it('keeps SimpleOwnerDemo wired to real ask and upload', () => {
    const phone = read('src/components/FreeOperatorPhone.tsx');
    expect(phone).toContain('export const SimpleOwnerDemo = FreeOperatorPhone');
    expect(phone).toContain("fetch('/api/ask'");
    expect(phone).toContain("fetch('/api/upload'");
    expect(read('src/app/operator/page.tsx')).toContain('SimpleOwnerDemo');
    expect(read('src/app/api/ask/route.ts')).toMatch(/getSimpleOwnerDemoService/);
    expect(read('src/app/api/upload/route.ts')).toMatch(/getSimpleOwnerDemoService/);
  });

  it('keeps Void Hunter blue-only with no orange or gold', () => {
    expect(HOUSE_CODE_BRAND_BLUE).toBe('#0066ff');
    const hunter = read('src/components/VoidHunterView.tsx');
    const findings = read('src/components/VoidFindingsSection.tsx');
    for (const source of [hunter, findings]) {
      expect(source).not.toMatch(/amber/);
      expect(source).not.toMatch(/gold-/);
      expect(source).not.toMatch(/warning-500/);
      expect(source).not.toMatch(/#d4a017|#eab308|#f59e0b|#ff9500|#E66B27/i);
    }
    expect(hunter).toMatch(/text-void-500/);
    expect(findings).toMatch(/text-void-500/);
  });
});
