import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { HOUSE_CODE_SEAT_DOOR, ORCHESTRATION_BRAND_BLUE, listInventory, listOrchestrationSeats } from './orchestration';

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

describe('rebuild resume v2 locks', () => {
  it('keeps one supervisor and five specialists on the active list', () => {
    expect(listOrchestrationSeats().map((seat) => seat.id)).toEqual([
      'supervisor',
      'labor',
      'vendor',
      'voids',
      'action-shift',
      'memory',
    ]);
    expect(listInventory('kill').map((row) => row.id)).toEqual(
      expect.arrayContaining(['design-qa', 'overnight-coordinator', 'grok-sales-org', 'current-system-context']),
    );
    expect(listInventory('replace').some((row) => row.id === 'communities-open-play')).toBe(true);
    expect(read('agents/README.md')).toMatch(/archive\/agents-v0/);
    expect(read('archive/agents-v0/README.md')).toMatch(/Archived agent manifests/);
  });

  it('keeps house-code /portal as the CTAP community door, not the stranger funnel', () => {
    expect(HOUSE_CODE_SEAT_DOOR).toBe('/portal');
    expect(read('src/app/communities/page.tsx')).toMatch(/redirect\(HOUSE_CODE_SEAT_DOOR\)/);
    expect(read('next.config.js')).toMatch(/source: '\/communities'/);
    expect(read('next.config.js')).toMatch(/destination: '\/portal'/);
    expect(read('src/app/portal/page.tsx')).toMatch(/community house-code/i);
    expect(read('src/app/portal/page.tsx')).toMatch(/\/onboard/);
    expect(read('src/app/login/LoginClient.tsx')).toMatch(/href="\/portal"/);
    expect(read('src/app/login/LoginClient.tsx')).not.toMatch(/href="\/communities"/);
  });

  it('keeps the stranger funnel email-first', () => {
    const home = read('src/components/HomePage.tsx');
    expect(home).toMatch(/Claim the free owner seat/);
    expect(home).toContain('href="/onboard"');
    expect(home).not.toMatch(/Start playing/);
    expect(read('src/components/HumanSiteShell.tsx')).toMatch(/href="\/onboard"/);
    expect(read('src/components/HumanSiteShell.tsx')).toMatch(/href="\/portal"/);
  });

  it('keeps SimpleOwnerDemo wired to real ask and upload', () => {
    const phone = read('src/components/FreeOperatorPhone.tsx');
    expect(phone).toContain("export const SimpleOwnerDemo = FreeOperatorPhone");
    expect(phone).toContain("fetch('/api/ask'");
    expect(phone).toContain("fetch('/api/upload'");
    expect(phone).toContain('OPERATOR_V2_PLATES');
    expect(phone).toContain('CTAP_SEAT1_PUBLIC_LABEL');
    expect(read('src/app/operator/page.tsx')).toContain('SimpleOwnerDemo');
    expect(read('src/app/api/ask/route.ts')).toMatch(/getSimpleOwnerDemoService/);
    expect(read('src/app/api/upload/route.ts')).toMatch(/getSimpleOwnerDemoService/);
  });

  it('keeps Void Hunter blue-only with no orange or gold', () => {
    expect(ORCHESTRATION_BRAND_BLUE).toBe('#0066ff');
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
