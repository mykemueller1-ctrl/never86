import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { CTAP_TOAST_CONTAMINANT_FAIL } from '@/lib/ctapPosLock';
import { NAG_TOAST_GT } from '@/lib/reportAdapters/nagToastGt';
import { PDQ_INGEST_PRIMARY_EMAIL, PDQ_INGEST_SECONDARY_EMAIL } from '@/lib/pdqIngest';
import { createMemoryObjectStore } from './objectStore';
import { createMemoryRepository } from './repository';
import { createSimpleOwnerDemoService } from './service';

const TOAST_GT_LEAK = /1,211\.85|3,408\.15|36,827\.34|6,619(?:\.00)?|3,570\.50|44,444\.44|99,999\.01/;

function assertNoToastLeak(body: string, sampleDollars?: string) {
  expect(body).not.toMatch(TOAST_GT_LEAK);
  expect(body).not.toContain(String(NAG_TOAST_GT.dayNetSales));
  expect(body).not.toContain(String(NAG_TOAST_GT.laborCost));
  if (sampleDollars) expect(sampleDollars).not.toMatch(/^toast-/);
}

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
    now: () => new Date('2026-08-25T17:00:00.000Z'),
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

  it('Fails contaminant and never lets Toast / NAG / Taco Bamba answer CTAP dollars', async () => {
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
    const body = `${asked.answer.headline} ${asked.answer.facts.join(' ')}`;
    expect(body).toMatch(/Verified · Menu Category · Food \$400\.00/);
    expect(body).toMatch(/Fail/);
    expect(asked.answer.sampleDollars).toBe('pdq-verified');
    assertNoToastLeak(body, asked.answer.sampleDollars);
  });

  it('Wave 0: net sales yesterday + ZReport → Verified Grand Total; voids from Void_Promo', async () => {
    const { svc, operatorId } = await loadCtapMorningPack();
    const asked = await svc.ask({
      operatorId,
      question: 'net sales yesterday',
      tray: 'action',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.headline).toMatch(/Verified Grand Total \$1,123\.50/);
    expect(asked.answer.verifiedClose).toBe(true);
    expect(asked.answer.sampleDollars).toBe('pdq-verified');
    expect(asked.answer.facts.join(' ')).toMatch(/Verified · Void_Promo # Voids \$12\.00/);
    assertNoToastLeak(`${asked.answer.headline} ${asked.answer.facts.join(' ')}`, asked.answer.sampleDollars);
  });

  it('thin EOD: other-day Z does not answer yesterday', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-other-day';
    const uploaded = await svc.upload({
      operatorId,
      filename: '8-23-2026 ZReport_Summary.pdf',
      contentType: 'text/plain',
      bytes: loadPdq('sample-z-missing-pop.txt'),
    });
    expect(uploaded.ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: 'net sales yesterday',
      tray: 'action',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.headline).toMatch(/Missing — no ZReport_Summary for that business date/);
    expect(asked.answer.facts.join(' ')).toMatch(/Hard Missing/);
    expect(asked.answer.facts.join(' ')).toMatch(/regen|another business date/);
    expect(`${asked.answer.headline} ${asked.answer.facts.join(' ')}`).not.toMatch(/\$540\.00|\$1,123\.50/);
  });

  it('thin EOD: secondary same-morning Z is Verified before Missing', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-thin-secondary-z';
    const voidOnly = await svc.upload({
      operatorId,
      filename: '8-24-2026 Void_Promo_Report.pdf',
      contentType: 'text/plain',
      bytes: new TextEncoder().encode(`To: ${PDQ_INGEST_PRIMARY_EMAIL}\n\n${readFileSync(path.join(process.cwd(), 'tests/fixtures/pdq/sample-void-promo-negatives.txt'), 'utf8')}`),
    });
    expect(voidOnly.ok).toBe(true);
    const secondaryZ = await svc.upload({
      operatorId,
      filename: '8-24-2026 ZReport_Summary.pdf',
      contentType: 'text/plain',
      bytes: new TextEncoder().encode(`To: ${PDQ_INGEST_SECONDARY_EMAIL}\n\n${readFileSync(path.join(process.cwd(), 'tests/fixtures/pdq/sample-z-large-pizzas.txt'), 'utf8')}`),
    });
    expect(secondaryZ.ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: 'net sales yesterday',
      tray: 'action',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.headline).toMatch(/Verified Grand Total \$1,123\.50/);
    expect(asked.answer.facts.join(' ')).toMatch(/secondary CC/);
    expect(asked.answer.facts.join(' ')).toMatch(/Verified · Void_Promo # Voids \$12\.00/);
    expect(asked.answer.facts.join(' ')).not.toMatch(/mykemueller1@gmail\.com|communitypizza2026@gmail\.com/);
  });

  it('thin EOD: void-only pack Verifies voids and keeps totals Missing', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-void-thin';
    const uploaded = await svc.upload({
      operatorId,
      filename: '8-24-2026 Void_Promo_Report.pdf',
      contentType: 'text/plain',
      bytes: loadPdq('sample-void-promo-negatives.txt'),
    });
    expect(uploaded.ok).toBe(true);
    const totals = await svc.ask({
      operatorId,
      question: 'What were PDQ net sales and Grand Total?',
      tray: 'action',
    });
    expect(totals.ok).toBe(true);
    if (!totals.ok) return;
    expect(totals.answer.headline).toMatch(/Missing/);
    expect(totals.answer.facts.join(' ')).toMatch(/Void-only thin pack/);
    expect(totals.answer.facts.join(' ')).not.toMatch(/\$1,123\.50|\$1,050\.00/);

    const voids = await svc.ask({
      operatorId,
      question: 'What were voids on Void_Promo?',
      tray: 'action',
    });
    expect(voids.ok).toBe(true);
    if (!voids.ok) return;
    expect(voids.answer.headline).toMatch(/Verified voids \$12\.00/);
    expect(voids.answer.verifiedClose).toBe(true);
  });

  it('Wave 0: net sales yesterday with no pack → Missing', async () => {
    const svc = service();
    const asked = await svc.ask({
      operatorId: 'demo:ctap-empty',
      question: 'net sales yesterday',
      tray: 'action',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.headline).toMatch(/Missing/);
    expect(asked.answer.verifiedClose).toBe(false);
    expect(asked.answer.sampleDollars).toBe('none-verified');
    expect(`${asked.answer.headline} ${asked.answer.facts.join(' ')}`).not.toMatch(/\$\d/);
  });

  it('default food today is Verified Food alone — not combined', async () => {
    const { svc, operatorId } = await loadCtapMorningPack();
    const asked = await svc.ask({
      operatorId,
      question: 'food today',
      tray: 'food',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.headline).toBe('Verified Food $400.00');
    expect(asked.answer.sampleDollars).toBe('pdq-verified');
    expect(asked.answer.facts.join(' ')).toMatch(/Verified · Menu Category · Large Pizzas \$250\.00/);
    expect(asked.answer.headline).not.toMatch(/\$650/);
    expect(asked.answer.facts.join(' ')).not.toMatch(/400 \+ 250 = 650/);
  });

  it('prefers primary fuller EOD over secondary Z-only and does not print mailboxes', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-ingest-lanes';
    const secondary = `To: ${PDQ_INGEST_SECONDARY_EMAIL}\n\n${readFileSync(path.join(process.cwd(), 'tests/fixtures/pdq/sample-z-large-pizzas.txt'), 'utf8')}`;
    const primary = `To: ${PDQ_INGEST_PRIMARY_EMAIL}\n\n${readFileSync(path.join(process.cwd(), 'tests/fixtures/pdq/sample-z-summary.txt'), 'utf8')}`;
    expect((await svc.upload({
      operatorId,
      filename: '8-24-2026 ZReport_Summary-secondary.pdf',
      contentType: 'text/plain',
      bytes: new TextEncoder().encode(secondary),
    })).ok).toBe(true);
    expect((await svc.upload({
      operatorId,
      filename: '8-24-2026 ZReport_Summary-primary.pdf',
      contentType: 'text/plain',
      bytes: new TextEncoder().encode(primary),
    })).ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: 'food today',
      tray: 'food',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.headline).toBe('Verified Food $600.00');
    const body = `${asked.answer.headline} ${asked.answer.facts.join(' ')}`;
    expect(body).toMatch(/primary inbox \(fuller EOD\)/);
    expect(body).not.toMatch(/mykemueller1@gmail\.com|communitypizza2026@gmail\.com/);
  });
});

describe('CTAP Seat 1 hard lock — Toast packs cannot answer CTAP sales', () => {
  it('Toast-only CTAP seat + net sales stays Fail/Missing — no NAG Toast $', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-toast-poison';
    const uploaded = await svc.upload({
      operatorId,
      filename: 'SalesSummary_2026-08-31.csv',
      contentType: 'text/csv',
      bytes: loadToast('SalesSummary_2026-08-31.csv'),
    });
    expect(uploaded.ok).toBe(true);
    if (uploaded.ok) {
      const blob = uploaded.upload.sourceTags.map((tag) => tag.source).join(' ');
      expect(blob).toMatch(/ctap-pos-lock:toast-contaminant:fail/);
      expect(blob).not.toMatch(/toast-parse:v1:/);
      expect(blob).not.toMatch(TOAST_GT_LEAK);
    }
    const asked = await svc.ask({
      operatorId,
      question: 'What were net sales Aug 31?',
      tray: 'action',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    const body = `${asked.answer.headline} ${asked.answer.facts.join(' ')}`;
    expect(asked.answer.sampleDollars).toBe('none-verified');
    expect(asked.answer.verifiedClose).toBe(false);
    expect(asked.answer.sampleDollars).not.toMatch(/^toast-/);
    expect(body).toContain(CTAP_TOAST_CONTAMINANT_FAIL);
    expect(body).toMatch(/PDQ|ZReport/);
    assertNoToastLeak(body, asked.answer.sampleDollars);
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
    expect(`${asked.answer.headline} ${asked.answer.facts.join(' ')}`).toMatch(/Humes is not on this path/);
    expect(`${asked.answer.headline} ${asked.answer.facts.join(' ')}`).not.toMatch(/\bTom\b|seat 2|PFG day-before/i);
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
    expect(asked.answer.headline).not.toMatch(/\$120\.00/);
    expect(asked.answer.facts.join(' ')).toMatch(/No delivered \$ invented|delivery invoice is not on this seat/);
  });

  it('invoice OCR alone Verifies delivered $ and leaves order-match / slip Missing', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-hyvee-invoice-only';
    const uploaded = await svc.upload({
      operatorId,
      filename: 'hyvee-delivery-invoice.txt',
      contentType: 'text/plain',
      bytes: loadHyvee('delivery-invoice.txt'),
    });
    expect(uploaded.ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: 'What got delivered on the Hy-Vee invoice?',
      tray: 'food',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.headline).toMatch(/Verified delivered \$120\.00/);
    expect(asked.answer.facts.join(' ')).toMatch(/order-match stays Missing/);
    expect(asked.answer.facts.join(' ')).toMatch(/slip reconciliation stays Missing/);
    expect(asked.answer.facts.join(' ')).not.toMatch(/94016902/);
  });

  it('Monday one-check is Verified when the labeled check paper is on the seat', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-hyvee-monday-verified';
    const uploaded = await svc.upload({
      operatorId,
      filename: 'hyvee-monday-batch.txt',
      contentType: 'text/plain',
      bytes: loadHyvee('monday-batch.txt'),
    });
    expect(uploaded.ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: 'What is the Hy-Vee Monday one check?',
      tray: 'food',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.headline).toMatch(/Verified Monday one check \$120\.00/);
    expect(asked.answer.verifiedClose).toBe(true);
    expect(asked.answer.facts.join(' ')).toMatch(/Verified · Monday lock: one check/);
    expect(asked.answer.facts.join(' ')).toMatch(/labeled check total/);
  });

  it('Monday one-check is Missing when pay pattern is only invoices', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-hyvee-monday-gap';
    const uploaded = await svc.upload({
      operatorId,
      filename: 'hyvee-delivery-invoice.txt',
      contentType: 'text/plain',
      bytes: loadHyvee('delivery-invoice.txt'),
    });
    expect(uploaded.ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: 'What is the Hy-Vee Monday one check?',
      tray: 'food',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.headline).toMatch(/Verified Monday lock — check total Missing/);
    expect(asked.answer.verifiedClose).toBe(false);
    expect(asked.answer.facts.join(' ')).toMatch(/Verified · Monday lock: one check/);
    expect(asked.answer.facts.join(' ')).toMatch(/no partial invented/i);
  });

  it('Wave 0b: Hy-Vee AP / 30-60 is Missing — OCR the mess, not AP', async () => {
    const svc = service();
    const asked = await svc.ask({
      operatorId: 'demo:ctap-hyvee-ap',
      question: 'Show me Hy-Vee AP aging 30/60',
      tray: 'food',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.headline).toMatch(/OCR into the mess, not AP/);
    expect(asked.answer.verifiedClose).toBe(false);
    expect(asked.answer.sampleDollars).toBe('none-verified');
  });

  it('does not need Seat 2 / PFG paper to answer Hy-Vee', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-hyvee-no-seat2';
    const uploaded = await svc.upload({
      operatorId,
      filename: 'hyvee-delivery-invoice.txt',
      contentType: 'text/plain',
      bytes: loadHyvee('delivery-invoice.txt'),
    });
    expect(uploaded.ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: 'What got delivered on the Hy-Vee invoice?',
      tray: 'food',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.headline).toMatch(/Verified delivered \$120\.00/);
    expect(`${asked.answer.headline} ${asked.answer.facts.join(' ')}`).not.toMatch(/\bTom\b|seat 2|PFG day-before/i);
  });
});

describe('CTAP papers wave order on a mixed seat', () => {
  it('answers food today from PDQ even when Hy-Vee papers are also on the seat', async () => {
    const { svc, operatorId } = await loadCtapMorningPack();
    const hyvee = await svc.upload({
      operatorId,
      filename: 'hyvee-delivery-invoice.txt',
      contentType: 'text/plain',
      bytes: loadHyvee('delivery-invoice.txt'),
    });
    expect(hyvee.ok).toBe(true);
    const food = await svc.ask({
      operatorId,
      question: 'food today',
      tray: 'food',
    });
    expect(food.ok).toBe(true);
    if (!food.ok) return;
    expect(food.answer.headline).toBe('Verified Food $400.00');
    expect(food.answer.sampleDollars).toBe('pdq-verified');

    const liquor = await svc.ask({
      operatorId,
      question: 'What got delivered on the Hy-Vee invoice?',
      tray: 'food',
    });
    expect(liquor.ok).toBe(true);
    if (!liquor.ok) return;
    expect(liquor.answer.headline).toMatch(/Verified delivered \$120\.00/);
    expect(liquor.answer.sampleDollars).toBe('hyvee-verified');
  });

  it('coaches PFG / Sysco / Pepsi as Missing rhythms, not Verified AP $', async () => {
    const svc = service();
    const pfg = await svc.ask({
      operatorId: 'demo:ctap-pfg-hook',
      question: 'What is the PFG invoice total?',
      tray: 'food',
    });
    expect(pfg.ok).toBe(true);
    if (!pfg.ok) return;
    expect(pfg.answer.verifiedClose).toBe(false);
    expect(pfg.answer.sampleDollars).toBe('none-verified');
    expect(pfg.answer.headline).toMatch(/Missing/);
    expect(pfg.answer.facts.join(' ')).toMatch(/21-day/);
    expect(pfg.answer.facts.join(' ')).toMatch(/Not AP automation/);
    expect(pfg.answer.facts.join(' ')).not.toMatch(/\bTom\b|communitypizza2026|\$88/);

    const sysco = await svc.ask({
      operatorId: 'demo:ctap-sysco-hook',
      question: 'Sysco invoice — nothing in this week',
      tray: 'food',
    });
    expect(sysco.ok).toBe(true);
    if (!sysco.ok) return;
    expect(sysco.answer.facts.join(' ')).toMatch(/nothing in/);
    expect(sysco.answer.facts.join(' ')).not.toMatch(/you did not order/i);

    const pepsi = await svc.ask({
      operatorId: 'demo:ctap-pepsi-hook',
      question: 'Pepsi ticket for the first week',
      tray: 'food',
    });
    expect(pepsi.ok).toBe(true);
    if (!pepsi.ok) return;
    expect(pepsi.answer.facts.join(' ')).toMatch(/papers-in/);
    expect(pepsi.answer.facts.join(' ')).not.toMatch(/CO2 savings/i);

    const usFoods = await svc.ask({
      operatorId: 'demo:ctap-usfoods-hook',
      question: 'US Foods invoice this week',
      tray: 'food',
    });
    expect(usFoods.ok).toBe(true);
    if (!usFoods.ok) return;
    expect(usFoods.answer.verifiedClose).toBe(false);
    expect(usFoods.answer.facts.join(' ')).toMatch(/same PFG pattern/);
    expect(usFoods.answer.facts.join(' ')).toMatch(/21-day/);
  });

  it('does not invent a Humes dollar on this draft', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-humes-later';
    const uploaded = await svc.upload({
      operatorId,
      filename: 'humes-inv.pdf',
      contentType: 'text/plain',
      bytes: new TextEncoder().encode('From: accountspayable@humesdist.com\nInvoice total: $88.00\n'),
    });
    expect(uploaded.ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: 'What is the Humes invoice total?',
      tray: 'food',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.verifiedClose).toBe(false);
    expect(asked.answer.sampleDollars).toBe('none-verified');
    expect(asked.answer.headline).toMatch(/Missing/);
    expect(asked.answer.facts.join(' ')).toMatch(/later wave/);
    expect(`${asked.answer.headline} ${asked.answer.facts.join(' ')}`).not.toMatch(/\$88/);
  });
});
