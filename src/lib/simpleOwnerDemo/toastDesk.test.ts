import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { NAG_TOAST_GT } from '@/lib/reportAdapters/nagToastGt';
import { createMemoryObjectStore } from './objectStore';
import { createMemoryRepository } from './repository';
import { createSimpleOwnerDemoService } from './service';

function load(name: string): Uint8Array {
  return new Uint8Array(readFileSync(path.join(process.cwd(), 'tests/fixtures/toast', name)));
}

function service() {
  return createSimpleOwnerDemoService({
    repo: createMemoryRepository(),
    objects: createMemoryObjectStore(),
    now: () => new Date('2026-09-08T12:00:00.000Z'),
  });
}

async function loadToastSeat() {
  const svc = service();
  const operatorId = 'demo:nag-toast';
  for (const filename of [
    'LaborBreakDown_2026-08-31.csv',
    'SalesSummary_2026-08-31.csv',
    'SalesSummary_2026-08-24_2026-08-30.csv',
    'ItemSelectionDetails.csv',
    'TimeEntries.csv',
  ]) {
    const uploaded = await svc.upload({
      operatorId,
      filename,
      contentType: 'text/csv',
      bytes: load(filename),
    });
    expect(uploaded.ok).toBe(true);
  }
  return { svc, operatorId };
}

describe('Toast seat desk — upload then ask', () => {
  it('Q1 labor is Verified from LaborBreakDown', async () => {
    const { svc, operatorId } = await loadToastSeat();
    const asked = await svc.ask({
      operatorId,
      question: 'What was labor cost and labor percent on Aug 31?',
      tray: 'labor',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.verifiedClose).toBe(true);
    expect(asked.answer.sampleDollars).toBe('toast-verified');
    expect(asked.answer.inventedClose).toBe(false);
    expect(asked.answer.facts.join(' ')).toContain(NAG_TOAST_GT.laborCost.toLocaleString('en-US', { minimumFractionDigits: 2 }));
    expect(asked.answer.facts.join(' ')).toContain(String(NAG_TOAST_GT.laborPctNet));
    expect(asked.answer.facts.join(' ')).toContain(
      NAG_TOAST_GT.dayNetSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
    );
    expect(asked.record.verifiedClose).toBe(true);
  });

  it('Q8 net sales Verified and strongest day Estimated from ItemSelectionDetails', async () => {
    const { svc, operatorId } = await loadToastSeat();
    const asked = await svc.ask({
      operatorId,
      question: 'What were net sales Aug 31 and the week Aug 24-30? Strongest day?',
      tray: 'action',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.verifiedClose).toBe(true);
    expect(asked.answer.facts.join(' ')).toContain(
      NAG_TOAST_GT.dayNetSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
    );
    expect(asked.answer.facts.join(' ')).toContain(
      NAG_TOAST_GT.weekNetSales.toLocaleString('en-US', { minimumFractionDigits: 2 }),
    );
    expect(asked.answer.facts.join(' ')).toMatch(/Estimated/);
    expect(asked.answer.facts.join(' ')).toContain(
      NAG_TOAST_GT.strongestItemNet.toLocaleString('en-US', { minimumFractionDigits: 2 }),
    );
    expect(asked.answer.sourceTags.some((tag) => tag.tag === 'estimated')).toBe(true);
  });

  it('Q10 voids are Verified from ItemSelectionDetails and do not demand PDQ', async () => {
    const { svc, operatorId } = await loadToastSeat();
    const asked = await svc.ask({
      operatorId,
      question: 'What were voids Aug 24-30?',
      tray: 'action',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.verifiedClose).toBe(true);
    expect(asked.answer.headline).toContain(String(NAG_TOAST_GT.voidLines));
    expect(asked.answer.facts.join(' ').toLowerCase()).not.toMatch(/\b(karlee|sturtz|server 1|employee)\b/);
    expect(asked.answer.facts.join(' ')).toMatch(/Burger × 6/);
    expect(asked.answer.needs).not.toMatch(/PDQ Void_Promo/);
    expect(asked.answer.facts.join(' ').toLowerCase()).not.toMatch(/thief|theft/);
  });

  it('Q11 30/60/90 payables stay Missing', async () => {
    const { svc, operatorId } = await loadToastSeat();
    const asked = await svc.ask({
      operatorId,
      question: 'What is 30/60/90 payables?',
      tray: 'food',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.verifiedClose).toBe(false);
    expect(asked.answer.sampleDollars).toBe('none-verified');
    expect(asked.answer.headline).toMatch(/Missing/);
    expect(asked.answer.facts.join(' ')).not.toMatch(/\$\d/);
  });

  it('ignores a Taco Bomba training-shape file on the same NAG seat', async () => {
    const { svc, operatorId } = await loadToastSeat();
    const uploaded = await svc.upload({
      operatorId,
      filename: 'related-not-nag-tacobamba-LaborBreakDown.csv',
      contentType: 'text/csv',
      bytes: load('training-shape-LaborBreakDown.csv'),
    });
    expect(uploaded.ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: 'What was labor cost and labor percent on Aug 31?',
      tray: 'labor',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.verifiedClose).toBe(true);
    expect(asked.answer.facts.join(' ')).toContain(
      NAG_TOAST_GT.laborCost.toLocaleString('en-US', { minimumFractionDigits: 2 }),
    );
    expect(asked.answer.facts.join(' ')).not.toMatch(/44,444\.44/);
    expect(asked.answer.facts.join(' ')).not.toMatch(/99,999\.01/);
    expect(asked.answer.facts.join(' ')).not.toMatch(/125,273\.41/);
  });

  it('training-corpus-only upload does not unlock a NAG labor dollar', async () => {
    const svc = service();
    const operatorId = 'demo:nag-training-only';
    const uploaded = await svc.upload({
      operatorId,
      filename: 'missions/kristin-nag/related-not-nag-tacobamba/LaborBreakDown.csv',
      contentType: 'text/csv',
      bytes: load('training-shape-LaborBreakDown.csv'),
    });
    expect(uploaded.ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: 'What was labor cost and labor percent on Aug 31?',
      tray: 'labor',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.verifiedClose).toBe(false);
    expect(asked.answer.headline).toMatch(/Missing/);
    expect(asked.answer.facts.join(' ')).not.toMatch(/44,444\.44/);
    expect(asked.answer.facts.join(' ')).not.toMatch(/1,211\.85/);
  });

  it('re-parses a stored Toast file that was tagged but not fact-packed', async () => {
    const repo = createMemoryRepository();
    const objects = createMemoryObjectStore();
    const svc = createSimpleOwnerDemoService({ repo, objects });
    const operatorId = 'demo:legacy-tag';
    const filename = 'LaborBreakDown_2026-08-31.csv';
    const bytes = load(filename);
    const put = await objects.put({
      operatorId,
      objectKey: 'simple-owner/demo:legacy-tag/labor.csv',
      bytes,
      contentType: 'text/csv',
    });
    await repo.insertUpload({
      id: 'legacy-1',
      operatorId,
      filename,
      contentType: 'text/csv',
      byteLength: bytes.byteLength,
      evidenceKind: 'other',
      sourceTags: [{ tag: 'unverified', source: 'operator-upload:other' }],
      objectKey: put.objectKey,
      storageBackend: 'memory',
      createdAt: '2026-09-07T12:00:00.000Z',
    });
    const asked = await svc.ask({
      operatorId,
      question: 'Labor cost Aug 31?',
      tray: 'labor',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.verifiedClose).toBe(true);
    expect(asked.answer.facts.join(' ')).toMatch(/1,211\.85/);
  });
});
