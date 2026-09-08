import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
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
    expect(asked.answer.facts.join(' ')).toMatch(/1,211\.85/);
    expect(asked.answer.facts.join(' ')).toMatch(/35\.56/);
    expect(asked.answer.facts.join(' ')).toMatch(/3,408\.15/);
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
    expect(asked.answer.facts.join(' ')).toMatch(/3,408\.15/);
    expect(asked.answer.facts.join(' ')).toMatch(/36,827\.34/);
    expect(asked.answer.facts.join(' ')).toMatch(/Estimated/);
    expect(asked.answer.facts.join(' ')).toMatch(/6,619\.00/);
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
    expect(asked.answer.headline).toMatch(/24/);
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
