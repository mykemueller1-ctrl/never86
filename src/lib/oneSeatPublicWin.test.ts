import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import Home from '../components/OwnerHome';
import {
  CHATGPT_SITES_ARCHIVE_URL,
  ONE_SEAT_ORIGIN,
  ONE_SEAT_PATHS,
  SELECTED_SITES_BASE_URL,
  SELECTED_SITES_CHECK_URLS,
  SELECTED_SITES_CONTACT_URL,
  isChatgptSitesHost,
} from './selectedSites';
import {
  GOLD_FLOUR,
  GOLD_LABOR,
  GOLD_MOZZARELLA,
  GOLD_RECIPE,
  ONE_SEAT_EQUALS,
  ONE_SEAT_ICP,
  goldInvoiceCompare,
  money,
  pctLabel,
} from './oneSeatPublicWin';

function read(path: string): string {
  return readFileSync(resolve(path), 'utf8');
}

describe('Grok-native One Seat public door', () => {
  const config = read('next.config.js');
  const home = renderToStaticMarkup(createElement(Home));

  it('keeps the ChatGPT Sites host archived and off the public core win', () => {
    expect(isChatgptSitesHost(CHATGPT_SITES_ARCHIVE_URL)).toBe(true);
    expect(SELECTED_SITES_BASE_URL).toBe(ONE_SEAT_ORIGIN);
    expect(SELECTED_SITES_CONTACT_URL).toBe('/contact');
    expect(SELECTED_SITES_CHECK_URLS.invoices).toBe('/check/invoices');
    expect(config).not.toMatch(/chatgpt\.site/);
    expect(config).not.toContain(CHATGPT_SITES_ARCHIVE_URL);
    expect(home).not.toMatch(/chatgpt\.site/);
    expect(read('src/components/HumanSiteShell.tsx')).not.toMatch(/chatgpt\.site/);
    expect(read('src/components/HomePage.tsx')).not.toMatch(/chatgpt\.site/);
  });

  it('does not redirect login, onboard, or the three checks off never86.ai', () => {
    expect(config).toMatch(/source: '\/communities'/);
    expect(config).toMatch(/destination: '\/portal'/);
    for (const path of ['/check/invoices', '/check/labor', '/check/menu', '/login', '/onboard']) {
      expect(config).not.toContain(`source: '${path}'`);
    }
  });

  it('ships the gold two-invoice mozzarella win with disclosed sample dollars', () => {
    const { compare, action } = goldInvoiceCompare();
    expect(action.ok).toBe(true);
    if (!action.ok) return;
    const mozzarella = compare.rows.find((row) => row.sku === GOLD_MOZZARELLA.sku);
    const flour = compare.rows.find((row) => row.sku === GOLD_FLOUR.sku);
    expect(mozzarella).toEqual(expect.objectContaining({
      flagged: true,
      priorPrice: GOLD_MOZZARELLA.priorPrice,
      currentPrice: GOLD_MOZZARELLA.currentPrice,
      dollarsObserved: GOLD_MOZZARELLA.delta,
    }));
    expect(mozzarella?.driftPct).toBeCloseTo(GOLD_MOZZARELLA.driftPct, 5);
    expect(flour).toEqual(expect.objectContaining({
      flagged: false,
      priorPrice: 25,
      currentPrice: 25,
    }));
    expect(action.result.morningActions[0].move).toMatch(/confirm pack|vendor question|do not treat this as recovered cash/i);
    expect(action.result.morningActions[0].claimBoundary).toMatch(/not.*recoverable cash/i);
  });

  it('leads the homepage with the gold mozzarella card, free-seat CTA, and 1–5 One Seat voice', () => {
    expect(home).toContain(money(GOLD_MOZZARELLA.priorPrice));
    expect(home).toContain(money(GOLD_MOZZARELLA.currentPrice));
    expect(home).toContain(pctLabel(GOLD_MOZZARELLA.driftPct));
    expect(home).toContain(GOLD_MOZZARELLA.nextMove);
    expect(home).toContain('FICTIONAL EXAMPLE');
    expect(home).toContain('not money recovered');
    expect(home).toContain(ONE_SEAT_ICP);
    expect(home).toContain(ONE_SEAT_EQUALS);
    expect(home).toContain(`href="${ONE_SEAT_PATHS.try}"`);
    expect(home).toContain(`href="${ONE_SEAT_PATHS.onboard}"`);
    expect(home).toContain(`href="${ONE_SEAT_PATHS.checkInvoices}"`);
    expect(home).not.toMatch(/\bdesk\b/i);
    expect(home).toMatch(/Grok/i);
  });

  it('keeps labor and recipe samples disclosed and formula-honest', () => {
    expect(GOLD_LABOR.driftHours).toBeCloseTo(1.5);
    expect(GOLD_LABOR.sampleDollars).toBe(31);
    expect(GOLD_LABOR.claimBoundary).toMatch(/Fictional/);
    expect(GOLD_RECIPE.foodCostPct).toBe(0.25);
    expect(GOLD_RECIPE.claimBoundary).toMatch(/No count/);
  });
});
