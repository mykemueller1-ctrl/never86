import { describe, expect, it } from 'vitest';
import { answerSeatAsk, SEAT_TABS, tabFromSeatHash } from './oneSeatPanels';

describe('one seat panels', () => {
  it('names the five public papers and never returns Verified from Ask', () => {
    expect(SEAT_TABS.map((tab) => tab.label)).toEqual([
      "What's missing",
      'Invoices',
      'Labor',
      'Menu',
      "Ask Never86'd",
    ]);
    const answers = [
      answerSeatAsk('where is the mozzarella invoice'),
      answerSeatAsk('who clocked extra hours'),
      answerSeatAsk('what is the plate food cost'),
      answerSeatAsk('is gmail connected', { googleReady: true }),
      answerSeatAsk('invoice labor and menu'),
      answerSeatAsk('we lost $999 today'),
    ];
    expect(answers.map((row) => row.honesty)).not.toContain('Verified');
    expect(answers.map((row) => row.tab)).toEqual([
      'invoices',
      'labor',
      'menu',
      'missing',
      'missing',
      'ask',
    ]);
  });

  it('quotes only disclosed samples and drops typed dollars', () => {
    const invoice = answerSeatAsk('invoice was $999');
    expect(invoice.honesty).toBe('Estimated');
    expect(invoice.reply).toMatch(/MZ-452/);
    expect(invoice.reply).toMatch(/not evidence/);
    expect(invoice.reply).not.toMatch(/\$999/);
    expect(invoice.reply).not.toMatch(/\$48|\$56/);

    expect(tabFromSeatHash('#photo')).toBe('ask');
    expect(tabFromSeatHash('#pdf')).toBe('invoices');
    expect(tabFromSeatHash('#labor')).toBe('labor');
    expect(tabFromSeatHash('#menu')).toBe('menu');
    expect(tabFromSeatHash('')).toBeNull();

    const labor = answerSeatAsk('labor drift');
    expect(labor.reply).toMatch(/8\.00 h/);
    expect(labor.reply).toMatch(/\$31/);
    expect(labor.reply).toMatch(/Fictional/);

    const ready = answerSeatAsk('gmail', { googleReady: true });
    expect(ready.honesty).toBe('Missing');
    expect(ready.reply).toMatch(/not connected/);
    expect(ready.reply).toMatch(/PDF/);
    expect(ready.reply).toMatch(/Papers stay Missing/);
  });
});
