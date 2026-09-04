import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('open play door', () => {
  it('ships suck-in HTML with CTAP seat 1 and open play for any operator', () => {
    const html = readFileSync(resolve('public/demo/action-shift.html'), 'utf8');
    expect(html).toMatch(/Seat 1 · Community Tap/);
    expect(html).toMatch(/Any operator · no login/);
    expect(html).toMatch(/Open play for any operator/);
    expect(html).toMatch(/No portal passwords/);
    expect(html).not.toMatch(/\bPIN\b/);
    expect(html).toMatch(/not Community Tap private dollars/);
    expect(html).toMatch(/canonical" href="https:\/\/www\.never86\.ai\/play"/);
  });

  it('rewrites /play to the suck-in desk (no iframe)', () => {
    const config = readFileSync(resolve('next.config.js'), 'utf8');
    expect(config).toMatch(/source: '\/play'/);
    expect(config).toMatch(/destination: '\/demo\/action-shift\.html'/);
  });

  it('marks Community Tap as seat 1 on /action-shift', () => {
    const page = readFileSync(resolve('src/app/action-shift/page.tsx'), 'utf8');
    expect(page).toMatch(/Community Tap · first store · assigned/);
    expect(page).toMatch(/href="\/play"/);
  });
});
