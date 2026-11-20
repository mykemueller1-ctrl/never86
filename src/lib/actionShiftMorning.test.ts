import { readFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  ACTION_SHIFT_APP_URL,
  ACTION_SHIFT_CASE_DELTA,
  ACTION_SHIFT_SAMPLE,
  ActionShiftMorning,
} from '../components/ActionShiftMorning';

const ALLOWED_DOLLARS = ['$48', '$56', '$8', '$0.20', '$77'];

function dollars(html: string): string[] {
  return [...html.matchAll(/\$\d+(?:\.\d+)?/g)].map((match) => match[0]);
}

describe('public Action Shift morning page', () => {
  it('keeps the sample chain to the published /try figures', () => {
    expect(ACTION_SHIFT_SAMPLE.priorCase).toBe(48);
    expect(ACTION_SHIFT_SAMPLE.currentCase).toBe(56);
    expect(ACTION_SHIFT_CASE_DELTA).toBe(8);
    expect(ACTION_SHIFT_SAMPLE.perPizza).toBe(0.2);
    expect(ACTION_SHIFT_SAMPLE.pizzasPerCase).toBe(40);
    expect(ACTION_SHIFT_CASE_DELTA / ACTION_SHIFT_SAMPLE.pizzasPerCase).toBe(0.2);
    expect(ACTION_SHIFT_SAMPLE.sold).toBe(385);
    expect(ACTION_SHIFT_SAMPLE.sold * ACTION_SHIFT_SAMPLE.perPizza).toBe(77);
    expect(ACTION_SHIFT_SAMPLE.week).toBe(77);
    expect(ACTION_SHIFT_APP_URL).toBe('https://app.never86.app');
  });

  it('shows one sample morning move and the four steps', () => {
    const html = renderToStaticMarkup(createElement(ActionShiftMorning, { page: 'home' }));
    expect(html).toContain('Find the leak. Assign the fix. Keep the receipt.');
    expect(html).toContain('Last night');
    expect(html).toContain('one move');
    expect(html).toContain('One owner');
    expect(html).toContain('One receipt');
    expect(html).toContain('Start my free seat');
    expect(html).toContain('See a sample morning');
    expect(html).toContain('href="/onboard"');
    expect(html).toContain('href="#morning"');
    expect(html).toContain('One thing to get ahead of');
    expect(html).toContain('40 pizzas a case (sample)');
    expect(html).toContain('Call your cheese rep, or change the pizza price.');
    expect(html).toContain('Sample');
    expect(html).toContain('Invoices');
    expect(html).toContain('Menu');
    expect(html).toContain('Sales');
    expect(html).toContain('Morning');
    expect(html).toContain('Labor');
    expect(html).toContain('Owner desk');
    expect(html).toContain('Example data');
    expect(html).not.toContain('myke@never86.app');
    expect(html).not.toContain('Skip to the morning card');
    expect(html).not.toContain('Previous homepage');
    expect(html).not.toContain('Previous try page');
    expect(html).toContain('href="https://app.never86.app"');
    for (const amount of dollars(html)) {
      expect(ALLOWED_DOLLARS).toContain(amount);
    }
    expect(dollars(html)).toEqual(expect.arrayContaining(ALLOWED_DOLLARS));
  });

  it('does not put a dollar on the labor section', () => {
    const html = renderToStaticMarkup(createElement(ActionShiftMorning));
    const labor = html.split('data-section="labor"')[1]?.split('</article>')[0] ?? '';
    const text = labor.replace(/<[^>]+>/g, ' ');
    expect(text).toContain('schedule');
    expect(text).not.toMatch(/\$/);
    expect(text).not.toMatch(/\d/);
  });

  it('stays a one-seat sample, with no store data and no retired name', () => {
    const html = renderToStaticMarkup(createElement(ActionShiftMorning, { page: 'try' }));
    expect(html).toContain('Here&#x27;s a sample morning.');
    expect(html).toContain('40 pizzas a case (sample)');
    expect(html).toContain('Owner desk');
    expect(html).not.toContain('myke@never86.app');
    expect(html).not.toContain('Skip to the morning card');
    expect(html).not.toContain('Previous homepage');
    expect(html).not.toMatch(/Pulse/);
    expect(html).not.toMatch(/Command Center/);
    expect(html).not.toMatch(/Community Tap/);
    expect(html).not.toMatch(/Fort Dodge/);
    expect(html).not.toMatch(/\bAlex\b/);
    expect(html).not.toMatch(/\$105|33\.35|42\.32|8\.97|\$80|\$31|\$40|16\.7/);
    expect(html).not.toMatch(/multi-store|seat 2|pricing/i);
  });

  it('keeps a restrained back-office palette', () => {
    const css = readFileSync(new URL('../components/action-shift-morning.module.css', import.meta.url), 'utf8');
    expect(css).toContain('tabular-nums');
    expect(css).not.toMatch(/#f3f0ea|#f6e7c1|#3b2a12|#e7e4fb|#f3e4e1|#8a4b2f|999px|Iowan/);
  });
});
