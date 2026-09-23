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
import CheckInvoices from '../app/check/invoices/page';
import { InvoiceWinCard } from '../components/InvoiceWinCard';
import {
  GOLD_CURRENT_INVOICE_CSV,
  GOLD_FLOUR,
  GOLD_LABOR,
  GOLD_MOZZARELLA,
  GOLD_PRIOR_INVOICE_CSV,
  GOLD_RECIPE,
  GOLD_SAMPLE_HONESTY,
  GOLD_SAMPLE_HONESTY_NOTE,
  HONESTY_LABELS,
  ONE_SEAT_EQUALS,
  ONE_SEAT_ICP,
  attachPublicHonesty,
  goldInvoiceCompare,
  honestyFromVendorRow,
  isGoldSampleInvoices,
  money,
  pctLabel,
  publicDoorHonesty,
} from './oneSeatPublicWin';
import { buildVendorDriftActionShift } from './vendorDriftActionShift';

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
    expect(config).toMatch(/allowedDevOrigins/);
    expect(config).not.toContain(CHATGPT_SITES_ARCHIVE_URL);
    expect(home).not.toMatch(/chatgpt\.site/);
    expect(read('src/components/HumanSiteShell.tsx')).not.toMatch(/chatgpt\.site/);
    expect(read('src/components/HomePage.tsx')).not.toMatch(/chatgpt\.site/);
  });

  it('does not redirect login, onboard, or the three checks off never86.ai', () => {
    expect(config).toMatch(/source: '\/communities'/);
    expect(config).toMatch(/destination: '\/portal'/);
    expect(config).not.toContain("source: '/seat'");
    expect(read('src/app/seat/page.tsx')).toMatch(/OneSeatPanels/);
    expect(read('src/app/seat/page.tsx')).not.toMatch(/chatgpt\.site/);
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

  it('labels honesty Verified / Estimated / Missing and never invents a missing dollar', () => {
    const { compare } = goldInvoiceCompare();
    const mozzarella = compare.rows.find((row) => row.sku === GOLD_MOZZARELLA.sku);
    const flour = compare.rows.find((row) => row.sku === GOLD_FLOUR.sku);
    expect(HONESTY_LABELS).toEqual(['Verified', 'Estimated', 'Missing']);
    expect(mozzarella && honestyFromVendorRow(mozzarella)).toBe('Verified');
    expect(flour && honestyFromVendorRow(flour)).toBe('Verified');
    expect(isGoldSampleInvoices(GOLD_PRIOR_INVOICE_CSV, GOLD_CURRENT_INVOICE_CSV)).toBe(true);
    expect(isGoldSampleInvoices(GOLD_CURRENT_INVOICE_CSV, GOLD_PRIOR_INVOICE_CSV)).toBe(true);
    expect(publicDoorHonesty({ row: mozzarella, disclosedSample: true })).toBe('Estimated');
    const sampleRows = attachPublicHonesty(compare.rows, true);
    expect(sampleRows).toHaveLength(2);
    expect(sampleRows.every((row) => row.honesty === 'Estimated')).toBe(true);

    const oneInvoice = buildVendorDriftActionShift({
      documents: [{ text: GOLD_CURRENT_INVOICE_CSV, filename: 'current-only.csv' }],
    });
    expect(oneInvoice.ok).toBe(true);
    if (!oneInvoice.ok) return;
    expect(oneInvoice.compare.flagged).toHaveLength(0);
    expect(oneInvoice.compare.rows.every((row) => row.dollarsObserved == null)).toBe(true);
    expect(oneInvoice.compare.rows.every((row) => honestyFromVendorRow(row) === 'Missing')).toBe(true);
    expect(oneInvoice.result.morningActions[0].dollarsObserved).toBeNull();
    expect(oneInvoice.result.missingEvidence.join(' ')).toMatch(/Missing Evidence, not \$0/);
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
    expect(home).toContain('Verified');
    expect(home).toContain('Estimated');
    expect(home).toContain('Missing');
    expect(home).toContain(GOLD_SAMPLE_HONESTY);
    expect(home).toContain(GOLD_SAMPLE_HONESTY_NOTE);

    expect(GOLD_SAMPLE_HONESTY_NOTE).toMatch(/Demo · Estimated/);
    expect(GOLD_SAMPLE_HONESTY_NOTE).not.toMatch(/Verified/);
    const win = renderToStaticMarkup(createElement(InvoiceWinCard));
    const invoices = renderToStaticMarkup(createElement(CheckInvoices));
    for (const html of [win, invoices]) {
      expect(html).toContain(money(GOLD_MOZZARELLA.priorPrice));
      expect(html).toContain(money(GOLD_MOZZARELLA.currentPrice));
      expect(html).toContain('Demo · Estimated');
      expect(html).toContain('Missing');
      expect(html).not.toMatch(/Verified/);
      expect(html).not.toMatch(/\bdesk\b/i);
      expect(html).not.toMatch(/chatgpt\.site/);
    }
  });

  it('keeps labor and recipe samples disclosed and formula-honest', () => {
    expect(GOLD_LABOR.driftHours).toBeCloseTo(1.5);
    expect(GOLD_LABOR.sampleDollars).toBe(31);
    expect(GOLD_LABOR.claimBoundary).toMatch(/Fictional/);
    expect(GOLD_RECIPE.foodCostPct).toBe(0.25);
    expect(GOLD_RECIPE.claimBoundary).toMatch(/No count/);
    for (const path of [
      'src/app/try/labor/page.tsx',
      'src/app/try/recipes/page.tsx',
      'src/app/check/labor/page.tsx',
      'src/app/check/menu/page.tsx',
    ]) {
      const source = read(path);
      expect(source).toMatch(/HonestyLegend/);
      expect(source).toMatch(/Estimated/);
      expect(source).not.toMatch(/\bdesk\b/i);
      expect(source).not.toMatch(/chatgpt\.site/);
    }
    for (const path of ['src/app/try/page.tsx', 'src/app/check/invoices/page.tsx']) {
      const source = read(path);
      expect(source).toMatch(/InvoiceWinCard/);
      expect(source).not.toMatch(/\bdesk\b/i);
      expect(source).not.toMatch(/chatgpt\.site/);
    }
  });
});
