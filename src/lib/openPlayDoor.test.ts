import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('never86.ai open play front door', () => {
  it('ships suck-in HTML branded as Never 86\'d with CTAP seat 1', () => {
    const html = readFileSync(resolve('public/demo/action-shift.html'), 'utf8');
    expect(html).toMatch(/Never 86'd/);
    expect(html).toMatch(/never86\.ai/);
    expect(html).toMatch(/Seat 1 · Community Tap/);
    expect(html).toMatch(/Any operator · no login/);
    expect(html).toMatch(/Open play for any operator|Sample shop only/);
    expect(html).not.toMatch(/\bPIN\b/);
    expect(html).toMatch(/canonical" href="https:\/\/www\.never86\.ai\/"/);
    expect(html).toMatch(/\/product/);
  });

  it('keeps /play as the sample-shop suck-in and parks open play off the homepage', () => {
    const config = readFileSync(resolve('next.config.js'), 'utf8');
    expect(config).not.toMatch(/source: '\/'/);
    expect(config).toMatch(/source: '\/play'/);
    expect(config).toMatch(/destination: '\/demo\/action-shift\.html'/);
    expect(config).toMatch(/source: '\/communities'/);
    expect(config).toMatch(/destination: '\/portal'/);
  });

  it('keeps the marketing story on /product', () => {
    const page = readFileSync(resolve('src/app/product/page.tsx'), 'utf8');
    expect(page).toMatch(/canonical: 'https:\/\/www\.never86\.ai\/product'/);
    expect(page).toMatch(/HomePage/);
  });

  it('marks Community Tap as seat 1 on /action-shift', () => {
    const page = readFileSync(resolve('src/app/action-shift/page.tsx'), 'utf8');
    expect(page).toMatch(/Community Tap · first store · assigned/);
    expect(page).toMatch(/href="\/play"/);
  });
});
