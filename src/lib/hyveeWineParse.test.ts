import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  answerHyveeDeskQuestion,
  collectHyveeFacts,
  detectHyveeFamily,
  parseHyveeWineReport,
  routeHyveeDeskQuestion,
} from './hyveeWineParse';

function load(name: string): string {
  return readFileSync(path.join(process.cwd(), 'tests/fixtures/hyvee', name), 'utf8');
}

describe('Hy-Vee Wine papers-in parse', () => {
  it('detects the four glue legs', () => {
    expect(detectHyveeFamily('order-email.txt', load('order-email.txt'))).toBe('order-email');
    expect(detectHyveeFamily('customer-charge-slip.txt', load('customer-charge-slip.txt'))).toBe('charge-slip');
    expect(detectHyveeFamily('delivery-invoice.txt', load('delivery-invoice.txt'))).toBe('invoice');
    expect(detectHyveeFamily('monday-batch.txt', load('monday-batch.txt'))).toBe('monday-batch');
  });

  it('quotes labeled totals and does not invent a blended number', () => {
    const invoice = parseHyveeWineReport(load('delivery-invoice.txt'), 'delivery-invoice.txt');
    expect(invoice?.labeledTotal).toBe(120);
    expect(invoice?.invoiceNumber).toBe('HV-LAB-1001');
    expect(invoice?.location).toBe('Fort Dodge');
    const monday = parseHyveeWineReport(load('monday-batch.txt'), 'monday-batch.txt');
    expect(monday?.family).toBe('monday-batch');
    expect(monday?.labeledTotal).toBe(120);
  });

  it('does not detect Humes as Hy-Vee', () => {
    expect(detectHyveeFamily('humes-inv.pdf', 'From: accountspayable@humesdist.com\nInvoice total: $88.00')).toBeNull();
  });

  it('uses the bar-manager order email, not Seat 2 / PFG', () => {
    const order = parseHyveeWineReport(load('order-email.txt'), 'order-email.txt');
    expect(order?.family).toBe('order-email');
    expect(load('order-email.txt')).toMatch(/winespiritsmgr@hy-vee/);
    expect(load('order-email.txt')).not.toMatch(/pfg|performance food|seat 2|\bTom\b/i);
    expect(routeHyveeDeskQuestion('What is the Hy-Vee order email total?')).toBe('order');
  });
});

describe('Hy-Vee desk honesty', () => {
  it('Missing when the asked invoice paper is absent', () => {
    const order = parseHyveeWineReport(load('order-email.txt'), 'order-email.txt');
    const facts = collectHyveeFacts([
      { filename: 'order-email.txt', sourceTags: [{ tag: 'verified', source: `hyvee-parse:v1:${JSON.stringify(order)}` }] },
    ]);
    expect(routeHyveeDeskQuestion('What is the Hy-Vee invoice total?')).toBe('invoice');
    const answer = answerHyveeDeskQuestion('What is the Hy-Vee invoice total?', facts);
    expect(answer?.headline).toMatch(/Missing/);
    expect(answer?.facts.join(' ')).not.toMatch(/\$88/);
    expect(answer?.verifiedClose).toBe(false);
  });

  it('glues four matching legs as Verified without inventing a fifth total', () => {
    const uploads = [
      ['order-email.txt', load('order-email.txt')],
      ['customer-charge-slip.txt', load('customer-charge-slip.txt')],
      ['delivery-invoice.txt', load('delivery-invoice.txt')],
      ['monday-batch.txt', load('monday-batch.txt')],
    ].map(([filename, text]) => {
      const pack = parseHyveeWineReport(text, filename);
      return {
        filename,
        sourceTags: [{ tag: 'verified' as const, source: `hyvee-parse:v1:${JSON.stringify(pack)}` }],
      };
    });
    const facts = collectHyveeFacts(uploads);
    const answer = answerHyveeDeskQuestion('Glue the Hy-Vee wine papers', facts);
    expect(answer?.verifiedClose).toBe(true);
    expect(answer?.headline).toMatch(/Verified/);
    expect(answer?.facts.join(' ')).toMatch(/\$120\.00/);
    expect(answer?.facts.join(' ')).toMatch(/three-paper glue|order email ↔ yellow slip ↔ delivery invoice/);
    expect(answer?.facts.join(' ')).not.toMatch(/94016902/);
    expect(answer?.facts.join(' ').toLowerCase()).not.toMatch(/thief|theft/);
  });

  it('invoice OCR alone is Verified delivered $; order-match / slip stay Missing', () => {
    const invoice = parseHyveeWineReport(load('delivery-invoice.txt'), 'delivery-invoice.txt');
    const facts = collectHyveeFacts([
      { filename: 'delivery-invoice.txt', sourceTags: [{ tag: 'verified', source: `hyvee-parse:v1:${JSON.stringify(invoice)}` }] },
    ]);
    const delivered = answerHyveeDeskQuestion('What got delivered on the Hy-Vee invoice?', facts);
    expect(delivered?.headline).toMatch(/Verified delivered \$120\.00/);
    expect(delivered?.verifiedClose).toBe(true);
    expect(delivered?.facts.join(' ')).toMatch(/order-match stays Missing/);
    expect(delivered?.facts.join(' ')).toMatch(/slip reconciliation stays Missing/);

    const monday = answerHyveeDeskQuestion('What is the Hy-Vee Monday one check?', facts);
    expect(monday?.headline).toMatch(/Verified Monday lock — check total Missing/);
    expect(monday?.verifiedClose).toBe(false);
    expect(monday?.facts.join(' ')).toMatch(/Verified · Monday lock: one check/);
    expect(monday?.facts.join(' ')).toMatch(/no partial invented/i);
  });

  it('Wave 0b refuses AP / 30-60-90', () => {
    expect(routeHyveeDeskQuestion('Show me Hy-Vee AP aging 30/60')).toBe('glue');
    const facts = collectHyveeFacts([]);
    const answer = answerHyveeDeskQuestion('Show me Hy-Vee AP aging 30/60', facts);
    expect(answer?.headline).toMatch(/Missing — Hy-Vee is OCR into the mess, not AP/);
    expect(answer?.facts.join(' ')).toMatch(/Not AP/);
    expect(answer?.verifiedClose).toBe(false);
  });
});
