import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { applyNightProof, ingestCloseDocuments, mergeDeskCloses } from './deskClose';

const fixtureDir = join(dirname(fileURLToPath(import.meta.url)), '../../tests/fixtures/pdq');
const load = (name: string) => readFileSync(join(fixtureDir, name), 'utf8');

describe('desk close from PDQ EOD packet', () => {
  it('shows sales, mix, labor, unentered cash, peak hour, and ≤3 Action Shift moves', () => {
    const result = ingestCloseDocuments([
      { channel: 'file', filename: '8-24-2026 ZReport_Summary Sample Kitchen Lab.pdf', text: load('sample-z-summary.txt') },
      { channel: 'file', filename: '8-24-2026 Hourly_Sales_Report Sample Kitchen Lab.pdf', text: load('sample-hourly.txt') },
      { channel: 'file', filename: '8-24-2026 Void_Promo_Report Sample Kitchen Lab.pdf', text: load('sample-void-promo.txt') },
    ], 'Sample Kitchen Lab');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const desk = result.desk;
    expect(desk.businessDate).toBe('2026-08-24');
    expect(desk.sales.value).toBe(1000);
    expect(desk.mix.food.value).toBe(600);
    expect(desk.mix.beer.value).toBe(200);
    expect(desk.mix.liquor.value).toBe(150);
    expect(desk.mix.pop.value).toBe(50);
    expect(desk.labor.value).toBe(280);
    expect(desk.cash.status).toBe('unentered');
    expect(desk.cash.display).toBe('Missing Evidence');
    expect(desk.hourlyPeak).toEqual({ hour: '6:00 PM', sales: 220, guests: 16 });
    expect(desk.actionShift).not.toBeNull();
    expect(desk.actionShift!.morningActions.length).toBeGreaterThan(0);
    expect(desk.actionShift!.morningActions.length).toBeLessThanOrEqual(3);
    expect(desk.actionShift!.morningActions.map((a) => a.id)).not.toContain('cash-proof');
    const move = desk.actionShift!.morningActions[0];
    expect(move.owner).toBeTruthy();
    expect(move.claimBoundary).toBeTruthy();
    expect(move.proof.object).toBeTruthy();
    expect(move.proof.verbalYesCloses).toBe(false);
    expect(desk.missingEvidence.some((line) => /unentered cash is not a shortage/i.test(line))).toBe(true);
  });

  it('does not turn a missing mix category into $0', () => {
    const result = ingestCloseDocuments([
      { channel: 'paste', filename: '8-23-2026 ZReport_Summary Sample Kitchen Lab.pdf', text: load('sample-z-missing-pop.txt') },
    ]);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.desk.mix.pop.value).toBeNull();
    expect(result.desk.mix.pop.display).toBe('Missing Evidence');
    expect(result.desk.missingEvidence.some((line) => /Pop is Missing Evidence, not \$0/i.test(line))).toBe(true);
  });

  it('keeps a Void-only EOD as Missing Evidence and does not invent sales', () => {
    const result = ingestCloseDocuments([
      {
        channel: 'email',
        from: 'pdqreports@pdqpos.com',
        filename: '9-2-2026 Void_Promo_Report Sample Kitchen Lab.pdf',
        text: load('sample-void-promo.txt').replace('8/24/2026', '9/2/2026'),
      },
      {
        channel: 'email',
        from: 'pdqreports@pdqpos.com',
        filename: 'EOD Reports Generated From Sample Kitchen Lab',
        text: [
          'EOD Reports Generated From Sample Kitchen Lab',
          '9-2-2026 ZReport_Summary Sample Kitchen Lab.pdf',
          '9-2-2026 Hourly_Sales_Report Sample Kitchen Lab.pdf',
          '9-2-2026 Void_Promo_Report Sample Kitchen Lab.pdf',
        ].join('\n'),
      },
    ], 'Sample Kitchen Lab');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.desk.businessDate).toBe('2026-09-02');
    expect(result.desk.families).toEqual(['void-promo']);
    expect(result.desk.sales.value).toBeNull();
    expect(result.desk.sales.display).toBe('Missing Evidence');
    expect(result.desk.actionShift?.morningActions[0].id).toBe('close-packet');
    expect(result.desk.actionShift?.morningActions[0].dollarsObserved).toBeNull();
    expect(result.desk.missingEvidence.join('\n')).toMatch(/ZReport_Summary/);
    expect(result.desk.missingEvidence.join('\n')).toMatch(/Hourly_Sales_Report/);
    expect(result.desk.missingEvidence.join('\n')).toMatch(/PDQ Reports/);
  });

  it('merges a later Z and Hourly onto a Void-only desk for the same date', () => {
    const voidOnly = ingestCloseDocuments([
      { channel: 'email', filename: '9-2-2026 Void_Promo_Report Sample Kitchen Lab.pdf', text: load('sample-void-promo.txt').replace('8/24/2026', '9/2/2026') },
    ], 'Sample Kitchen Lab');
    const rest = ingestCloseDocuments([
      { channel: 'email', filename: '9-2-2026 ZReport_Summary Sample Kitchen Lab.pdf', text: load('sample-z-summary.txt').replace('8/24/2026', '9/2/2026') },
      { channel: 'email', filename: '9-2-2026 Hourly_Sales_Report Sample Kitchen Lab.pdf', text: load('sample-hourly.txt').replace('8/24/2026', '9/2/2026') },
    ], 'Sample Kitchen Lab');
    expect(voidOnly.ok && rest.ok).toBe(true);
    if (!voidOnly.ok || !rest.ok) return;
    const merged = mergeDeskCloses(voidOnly.desk, rest.desk);
    expect(merged.families).toEqual(expect.arrayContaining(['z-summary', 'hourly', 'void-promo']));
    expect(merged.sales.value).toBe(1000);
    expect(merged.hourlyPeak?.hour).toBe('6:00 PM');
    expect(merged.voids.value).toBe(12);
    expect(merged.missingEvidence.join('\n')).not.toMatch(/ZReport_Summary.*Missing Evidence, not \$0/);
  });

  it('refuses a POS password paste', () => {
    const result = ingestCloseDocuments([
      { channel: 'paste', text: 'password: letmein\nSubtotal: $1,000.00' },
    ]);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error).toMatch(/password/i);
  });
});

describe('night proof', () => {
  const action = {
    id: 'close-packet' as const,
    proof: {
      object: 'Complete same-scope close packet',
      nightCheck: 'Save the packet.',
      verbalYesCloses: false as const,
    },
  };

  it('will not verify from a verbal yes', () => {
    expect(applyNightProof({ action, outcome: 'verified', proofKind: 'verbal' })).toEqual({
      ok: false,
      error: 'A verbal yes does not close the action. Attach the proof object from the shift.',
    });
  });

  it('verifies only with a source proof object', () => {
    expect(applyNightProof({ action, outcome: 'verified', proofKind: 'pos-close' })).toEqual({
      ok: true,
      state: 'verified',
    });
    expect(applyNightProof({ action, outcome: 'verified', proofKind: 'invoice-packet' })).toEqual({
      ok: true,
      state: 'verified',
    });
  });
});
