import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createMemoryObjectStore } from './objectStore';
import { createMemoryRepository } from './repository';
import { createSimpleOwnerDemoService } from './service';

function loadPdq(name: string): Uint8Array {
  return new Uint8Array(readFileSync(path.join(process.cwd(), 'tests/fixtures/pdq', name)));
}

function loadHyvee(name: string): Uint8Array {
  return new Uint8Array(readFileSync(path.join(process.cwd(), 'tests/fixtures/hyvee', name)));
}

function loadToast(name: string): Uint8Array {
  return new Uint8Array(readFileSync(path.join(process.cwd(), 'tests/fixtures/toast', name)));
}

function service() {
  return createSimpleOwnerDemoService({
    repo: createMemoryRepository(),
    objects: createMemoryObjectStore(),
    now: () => new Date('2026-09-08T12:00:00.000Z'),
  });
}

async function loadCtapMorningPack() {
  const svc = service();
  const operatorId = 'demo:ctap-seat1';
  const files: Array<[string, string]> = [
    ['8-24-2026 ZReport_Summary.pdf', 'sample-z-large-pizzas.txt'],
    ['8-24-2026 Hourly_Sales_Report.pdf', 'sample-hourly.txt'],
    ['8-24-2026 Void_Promo_Report.pdf', 'sample-void-promo-negatives.txt'],
  ];
  for (const [filename, fixture] of files) {
    const uploaded = await svc.upload({
      operatorId,
      filename,
      contentType: 'text/plain',
      bytes: loadPdq(fixture),
    });
    expect(uploaded.ok).toBe(true);
  }
  return { svc, operatorId };
}

describe('CTAP papers-in desk — PDQ morning pack', () => {
  it('quotes Food and Large Pizzas as separate Verified lines', async () => {
    const { svc, operatorId } = await loadCtapMorningPack();
    const asked = await svc.ask({
      operatorId,
      question: 'What was Food vs Large Pizzas on the PDQ Z report?',
      tray: 'food',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.verifiedClose).toBe(true);
    expect(asked.answer.sampleDollars).toBe('pdq-verified');
    expect(asked.answer.inventedClose).toBe(false);
    const body = asked.answer.facts.join(' ');
    expect(body).toMatch(/Verified · Menu Category · Food \$400\.00/);
    expect(body).toMatch(/Verified · Menu Category · Large Pizzas \$250\.00/);
    expect(body).toMatch(/Large Pizzas ≠ Food/);
    expect(body).not.toMatch(/\$650\.00/);
  });

  it('Estimates combined food only when asked, with both Verified inputs', async () => {
    const { svc, operatorId } = await loadCtapMorningPack();
    const asked = await svc.ask({
      operatorId,
      question: 'Give me the combined food bucket including Large Pizzas',
      tray: 'food',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.sampleDollars).toBe('pdq-estimated');
    expect(asked.answer.verifiedClose).toBe(false);
    const body = asked.answer.facts.join(' ');
    expect(asked.answer.headline).toMatch(/Estimated combined food bucket \$650\.00/);
    expect(body).toMatch(/Verified Food \$400\.00/);
    expect(body).toMatch(/Verified Large Pizzas \$250\.00/);
    expect(body).toMatch(/400 \+ 250 = 650/);
    expect(asked.answer.sourceTags.some((tag) => tag.tag === 'estimated')).toBe(true);
  });

  it('Missing when ZReport is absent — does not invent sales', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-void-only';
    const uploaded = await svc.upload({
      operatorId,
      filename: '8-24-2026 Void_Promo_Report.pdf',
      contentType: 'text/plain',
      bytes: loadPdq('sample-void-promo-negatives.txt'),
    });
    expect(uploaded.ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: 'What were PDQ net sales and Grand Total?',
      tray: 'action',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.verifiedClose).toBe(false);
    expect(asked.answer.sampleDollars).toBe('none-verified');
    expect(asked.answer.headline).toMatch(/Missing/);
    expect(asked.answer.facts.join(' ')).toMatch(/ZReport_Summary/);
    expect(asked.answer.facts.join(' ')).not.toMatch(/\$1,050\.00|\$1,123\.50|\$400\.00/);
  });

  it('quotes Void_Promo negatives without a theft story', async () => {
    const { svc, operatorId } = await loadCtapMorningPack();
    const asked = await svc.ask({
      operatorId,
      question: 'What were voids, Spec Instruction, Neg Menu, and UKNOWN on Void_Promo?',
      tray: 'action',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.verifiedClose).toBe(true);
    const body = asked.answer.facts.join(' ');
    expect(body).toMatch(/Verified · # Voids \$12\.00/);
    expect(body).toMatch(/Spec Instruction \$5\.00/);
    expect(body).toMatch(/Neg Menu \$3\.00/);
    expect(body).toMatch(/Neg Special Instruction \$2\.00/);
    expect(body).toMatch(/Promo \$8\.00/);
    expect(body).toMatch(/UKNOWN \$1\.50/);
    expect(body.toLowerCase()).not.toMatch(/thief|theft|steal|caught/);
  });

  it('never lets Kristin NAG Toast / Taco Bomba answer CTAP dollars', async () => {
    const { svc, operatorId } = await loadCtapMorningPack();
    const nag = await svc.upload({
      operatorId,
      filename: 'missions/kristin-nag/related-not-nag-tacobamba/LaborBreakDown.csv',
      contentType: 'text/csv',
      bytes: loadToast('training-shape-LaborBreakDown.csv'),
    });
    expect(nag.ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: 'What was Food vs Large Pizzas on the PDQ Z report?',
      tray: 'food',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    const body = asked.answer.facts.join(' ');
    expect(body).toMatch(/Verified · Menu Category · Food \$400\.00/);
    expect(body).not.toMatch(/44,444\.44|99,999\.01|1,211\.85/);
    expect(body).toMatch(/Taco Bomba|NAG|Toast/);
  });
});

describe('CTAP papers-in desk — Hy-Vee liquor path', () => {
  it('glues invoice / order / slip / batch without inventing a total', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-hyvee';
    for (const filename of [
      'order-email.txt',
      'customer-charge-slip.txt',
      'delivery-invoice.txt',
      'monday-batch.txt',
    ]) {
      const uploaded = await svc.upload({
        operatorId,
        filename: `hyvee-${filename}`,
        contentType: 'text/plain',
        bytes: loadHyvee(filename),
      });
      expect(uploaded.ok).toBe(true);
    }
    const asked = await svc.ask({
      operatorId,
      question: 'Glue the Hy-Vee wine papers',
      tray: 'food',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.verifiedClose).toBe(true);
    expect(asked.answer.sampleDollars).toBe('hyvee-verified');
    expect(asked.answer.facts.join(' ')).toMatch(/\$120\.00/);
    expect(asked.answer.facts.join(' ')).not.toMatch(/94016902/);
  });

  it('Missing when Hy-Vee invoice paper is absent', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-hyvee-gap';
    const uploaded = await svc.upload({
      operatorId,
      filename: 'hyvee-order-email.txt',
      contentType: 'text/plain',
      bytes: loadHyvee('order-email.txt'),
    });
    expect(uploaded.ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: 'What is the Hy-Vee invoice total?',
      tray: 'food',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.verifiedClose).toBe(false);
    expect(asked.answer.headline).toMatch(/Missing/);
    expect(asked.answer.facts.join(' ')).not.toMatch(/\$120\.00/);
  });
});
