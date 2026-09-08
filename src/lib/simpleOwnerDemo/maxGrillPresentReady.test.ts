import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { NAG_TOAST_GT } from '@/lib/reportAdapters/nagToastGt';
import { CTAP_SEAT1_PUBLIC_LABEL } from '@/lib/ctapSeat1';
import { LAST_WEEK_PRIME_LOAD_ASK } from '@/lib/lastWeekPrimeCost';
import { deskSeatLabel, deskSeatTitle } from '@/lib/seatIsolation';
import { createMemoryObjectStore } from './objectStore';
import { createMemoryRepository } from './repository';
import { createSimpleOwnerDemoService } from './service';

function loadToast(name: string): Uint8Array {
  return new Uint8Array(readFileSync(path.join(process.cwd(), 'tests/fixtures/toast', name)));
}

function loadPdq(name: string): Uint8Array {
  return new Uint8Array(readFileSync(path.join(process.cwd(), 'tests/fixtures/pdq', name)));
}

function service() {
  return createSimpleOwnerDemoService({
    repo: createMemoryRepository(),
    objects: createMemoryObjectStore(),
    now: () => new Date('2026-09-08T12:00:00.000Z'),
  });
}

const TOAST_LEAK = /1,211\.85|3,408\.15|36,827\.34|6,619(?:\.00)?/;

describe('Max Grill present-ready — isolation + honesty + Action Shift', () => {
  it('header copy isolates New American Grill from Community Tap Seat 1', () => {
    const phone = readFileSync(path.join(process.cwd(), 'src/components/FreeOperatorPhone.tsx'), 'utf8');
    const page = readFileSync(path.join(process.cwd(), 'src/app/operator/page.tsx'), 'utf8');
    expect(phone).toContain('deskSeatTitle');
    expect(phone).toContain('deskSeatLabel');
    expect(phone).not.toMatch(/title=\{CTAP_SEAT1_PUBLIC_LABEL\}/);
    expect(page).toContain('deskSeatLabel');
    expect(page).toMatch(/Action Shift/);
    expect(deskSeatTitle('New American Grill')).toBe('New American Grill');
    expect(deskSeatTitle('New American Grill')).not.toBe(CTAP_SEAT1_PUBLIC_LABEL);
    expect(deskSeatLabel('Max Grill')).toBe('New American Grill');
  });

  it('CTAP Missing answers never carry Toast dollars or Toast desk copy', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-present';
    expect((await svc.upload({
      operatorId,
      filename: '8-24-2026 Void_Promo_Report.pdf',
      contentType: 'text/plain',
      bytes: loadPdq('sample-void-promo-negatives.txt'),
    })).ok).toBe(true);
    expect((await svc.upload({
      operatorId,
      filename: 'SalesSummary_2026-08-31.csv',
      contentType: 'text/csv',
      bytes: loadToast('SalesSummary_2026-08-31.csv'),
    })).ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: 'What were net sales Aug 31?',
      tray: 'action',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    const body = `${asked.answer.headline} ${asked.answer.facts.join(' ')} ${asked.answer.coachTomorrow} ${asked.answer.needs} ${asked.answer.tags.join(' ')}`;
    expect(asked.answer.verifiedClose).toBe(false);
    expect(asked.answer.sampleDollars).toBe('none-verified');
    expect(body).not.toMatch(TOAST_LEAK);
    expect(body).not.toMatch(/Toast|Taco Bamba|New American Grill|Max Grill/i);
    expect(asked.answer.sourceTags.some((tag) => tag.source.includes('toast-contaminant'))).toBe(true);
  });

  it('desk / coach copy says Action Shift, not Pulse', () => {
    const files = [
      'src/lib/pdqDesk.ts',
      'src/lib/toastParse.ts',
      'src/lib/simpleOwnerDemo/compose.ts',
      'src/lib/lastWeekPrimeCost.ts',
      'src/lib/day1Coach.ts',
      'src/components/FreeOperatorPhone.tsx',
      'src/app/operator/page.tsx',
    ];
    for (const file of files) {
      const text = readFileSync(path.join(process.cwd(), file), 'utf8');
      expect(text).not.toMatch(/\bPulse\b/);
    }
    expect(readFileSync(path.join(process.cwd(), 'src/lib/pdqDesk.ts'), 'utf8')).toMatch(/Action Shift/);
  });

  it('NAG Q1 / Q8 / Q10 Verified from stored Toast families; Q11 stays Missing', async () => {
    const svc = service();
    const operatorId = 'demo:nag-present';
    for (const filename of [
      'LaborBreakDown_2026-08-31.csv',
      'SalesSummary_2026-08-31.csv',
      'SalesSummary_2026-08-24_2026-08-30.csv',
      'ItemSelectionDetails.csv',
      'TimeEntries.csv',
    ]) {
      expect((await svc.upload({
        operatorId,
        filename,
        contentType: 'text/csv',
        bytes: loadToast(filename),
        restaurantName: 'New American Grill',
      })).ok).toBe(true);
    }

    const q1 = await svc.ask({
      operatorId,
      question: 'What was labor cost and labor percent on Aug 31?',
      tray: 'labor',
      restaurantName: 'New American Grill',
    });
    expect(q1.ok && q1.answer.verifiedClose).toBe(true);
    if (q1.ok) {
      expect(q1.answer.sampleDollars).toBe('toast-verified');
      expect(q1.answer.facts.join(' ')).toContain(
        NAG_TOAST_GT.laborCost.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      );
    }

    const q8 = await svc.ask({
      operatorId,
      question: 'What were net sales Aug 31 and the week Aug 24-30? Strongest day?',
      tray: 'action',
      restaurantName: 'New American Grill',
    });
    expect(q8.ok && q8.answer.verifiedClose).toBe(true);
    if (q8.ok) {
      expect(q8.answer.facts.join(' ')).toMatch(/Estimated/);
      expect(q8.answer.sourceTags.some((tag) => tag.tag === 'estimated' || tag.tag === 'verified')).toBe(true);
    }

    const q10 = await svc.ask({
      operatorId,
      question: 'What were voids Aug 24-30?',
      tray: 'action',
      restaurantName: 'New American Grill',
    });
    expect(q10.ok && q10.answer.verifiedClose).toBe(true);

    const q11 = await svc.ask({
      operatorId,
      question: 'What is 30/60/90 payables?',
      tray: 'food',
      restaurantName: 'New American Grill',
    });
    expect(q11.ok).toBe(true);
    if (!q11.ok) return;
    expect(q11.answer.verifiedClose).toBe(false);
    expect(q11.answer.headline).toMatch(/Missing/);
    expect(q11.answer.facts.join(' ')).not.toMatch(/\$\d/);
  });

  it('One-Seat last-week prime is the path: Toast week+labor Verified, bev/food Missing, no invented %', async () => {
    const svc = service();
    const operatorId = 'demo:nag-present';
    for (const filename of [
      'LaborBreakDown_2026-08-31.csv',
      'SalesSummary_2026-08-31.csv',
      'SalesSummary_2026-08-24_2026-08-30.csv',
    ]) {
      expect((await svc.upload({
        operatorId,
        filename,
        contentType: 'text/csv',
        bytes: loadToast(filename),
        restaurantName: 'New American Grill',
      })).ok).toBe(true);
    }
    const invoice = await svc.upload({
      operatorId,
      filename: 'sysco-truck-ticket.txt',
      contentType: 'text/plain',
      bytes: new TextEncoder().encode('SYSCO Invoice Number: INV-88\nGrand Total: 184.50\n'),
      restaurantName: 'New American Grill',
    });
    expect(invoice.ok).toBe(true);

    const ready = invoice.ok ? invoice.readiness.lastWeekPrime : null;
    expect(ready?.weekSales).toBe(NAG_TOAST_GT.weekNetSales);
    expect(ready?.families.find((row) => row.id === 'labor')?.amount).toBe(NAG_TOAST_GT.laborCost);
    expect(ready?.missingIds).toEqual(['food', 'pop', 'liquor', 'beer']);
    expect(ready?.primePct).toBeNull();
    expect(ready?.honesty).toBe('Missing');
    expect(ready?.headline).toMatch(/Food, Pop, Liquor, Beer/);

    const asked = await svc.ask({
      operatorId,
      question: LAST_WEEK_PRIME_LOAD_ASK,
      tray: 'action',
      restaurantName: 'New American Grill',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    expect(asked.answer.slug).toBe('action-shift');
    expect(asked.answer.verifiedClose).toBe(false);
    expect(asked.answer.sampleDollars).toBe('none-verified');
    expect(asked.answer.headline).toMatch(/Missing — last-week prime/);
    expect(asked.answer.facts.join(' ')).toMatch(/Action Shift/);
    expect(asked.answer.facts.join(' ')).toMatch(/Missing · Food/);
    expect(asked.answer.facts.join(' ')).toMatch(/Missing · Pop/);
    expect(asked.answer.facts.join(' ')).toMatch(/Missing · Liquor/);
    expect(asked.answer.facts.join(' ')).toMatch(/Missing · Beer/);
    expect(asked.answer.facts.join(' ')).toMatch(/Prime % stays Missing/);
    expect(asked.answer.facts.join(' ')).not.toMatch(/\bPulse\b/);
    expect(asked.answer.headline).not.toMatch(/prime %/i);

    const phone = readFileSync(path.join(process.cwd(), 'src/components/FreeOperatorPhone.tsx'), 'utf8');
    expect(phone).toContain('LAST_WEEK_PRIME_LOAD_ASK');
    expect(phone).toContain('owner-desk-lastweek');
    expect(phone).toContain('Action Shift');
    expect(phone).not.toContain('Prime Cost Coach');
    expect(phone).not.toMatch(/\bPulse\b/);
  });

  it('CTAP last-week prime never speaks NAG Toast week or labor $', async () => {
    const svc = service();
    const operatorId = 'demo:ctap-present';
    expect((await svc.upload({
      operatorId,
      filename: 'SalesSummary_2026-08-24_2026-08-30.csv',
      contentType: 'text/csv',
      bytes: loadToast('SalesSummary_2026-08-24_2026-08-30.csv'),
    })).ok).toBe(true);
    const asked = await svc.ask({
      operatorId,
      question: LAST_WEEK_PRIME_LOAD_ASK,
      tray: 'action',
    });
    expect(asked.ok).toBe(true);
    if (!asked.ok) return;
    const body = `${asked.answer.headline} ${asked.answer.facts.join(' ')}`;
    expect(asked.answer.verifiedClose).toBe(false);
    expect(body).not.toMatch(TOAST_LEAK);
    expect(body).toMatch(/Missing · Week sales/);
    expect(body).toMatch(/Missing · Labor/);
    expect(asked.readiness.lastWeekPrime.weekSales).toBeNull();
  });
});
