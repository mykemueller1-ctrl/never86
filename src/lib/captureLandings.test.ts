import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import robots from '../app/robots';
import sitemap from '../app/sitemap';
import {
  CAPTURE_LANDING_PATHS,
  CAPTURE_LANDING_SLUGS,
  CAPTURE_SITEMAP_PRIORITY,
  CAPTURE_SHIP_ORDER,
  INVOICE_CAPTURE,
  LABOR_CAPTURE,
  POS_CAPTURE,
  THREE_P_CAPTURE,
  captureLandingCorpus,
} from './captureLandings';
import { ROBOTS_DISALLOW, WWW } from './seoAeo';
import { GOLD_LABOR, GOLD_MOZZARELLA } from './oneSeatPublicWin';

const HOME_PAGE = readFileSync(resolve(__dirname, '../app/page.tsx'), 'utf8');
const POS_PAGE = readFileSync(resolve(__dirname, '../app/restaurant-pos-alternative-toast-aloha-pdq/page.tsx'), 'utf8');
const INVOICE_PAGE = readFileSync(
  resolve(__dirname, '../app/restaurant-invoice-price-increase-check/page.tsx'),
  'utf8',
);
const LABOR_PAGE = readFileSync(
  resolve(__dirname, '../app/restaurant-labor-cost-overtime-prime-cost/page.tsx'),
  'utf8',
);
const THREE_P_PAGE = readFileSync(resolve(__dirname, '../app/third-party-delivery-fee-truth/page.tsx'), 'utf8');

describe('2026-09-16 capture landings', () => {
  it('ships Tom first, then Marcus, Dana, and Jess, and leaves homepage as One Seat', () => {
    expect([...CAPTURE_SHIP_ORDER]).toEqual(['labor', 'pos', 'invoices', 'threeP']);
    expect(CAPTURE_LANDING_SLUGS).toEqual([
      '/restaurant-labor-cost-overtime-prime-cost',
      '/restaurant-pos-alternative-toast-aloha-pdq',
      '/restaurant-invoice-price-increase-check',
      '/third-party-delivery-fee-truth',
    ]);
    expect(CAPTURE_SITEMAP_PRIORITY.labor).toBeGreaterThan(CAPTURE_SITEMAP_PRIORITY.pos);
    expect(HOME_PAGE).toMatch(/One Seat/);
    expect(HOME_PAGE).not.toMatch(/command-center/i);
    expect(HOME_PAGE).toContain("canonical: 'https://www.never86.ai/'");
  });

  it('locks POS copy: keep the POS, not a replacement, not Command Center', () => {
    expect(POS_CAPTURE.title).toBe(
      'Restaurant POS alternative when Toast, Aloha, or PDQ still runs the floor',
    );
    expect(POS_CAPTURE.geo).toMatch(/You do not need to rip out Toast, Aloha, or PDQ/);
    expect(POS_CAPTURE.geo).toMatch(/not a contract-cancel service and not Command Center/);
    expect(POS_CAPTURE.kill).toContain('Not a Toast replacement.');
    expect(POS_PAGE).toContain('POS_CAPTURE.kill');
    expect(POS_PAGE).toMatch(/\/connect\/toast/);
    expect(POS_PAGE).toContain('ONE_SEAT_PATHS.try');
    expect(POS_PAGE).not.toMatch(/rip out your (Toast|Aloha|PDQ) contract/i);
    expect(POS_PAGE).not.toMatch(/Command Center desk/i);
  });

  it('locks invoice copy: two-invoice honesty, not MarginEdge, not full COGS', () => {
    expect(INVOICE_CAPTURE.title).toMatch(/compare two invoices free/);
    expect(INVOICE_CAPTURE.geo).toMatch(/Missing, not \$0/);
    expect(INVOICE_CAPTURE.geo).toMatch(/Not MarginEdge\. Not full COGS/);
    expect(INVOICE_PAGE).toContain('ONE_SEAT_PATHS.checkInvoices');
    expect(INVOICE_PAGE).toContain('ONE_SEAT_PATHS.try');
    expect(INVOICE_PAGE).toContain('InvoiceWinCard');
    expect(INVOICE_CAPTURE.related.map((link) => link.href)).toContain('/check/invoices');
    expect(GOLD_MOZZARELLA.claimBoundary).toMatch(/not money recovered/);
  });

  it('locks labor copy: schedule vs clock + prime-cost target, no hit-65 claim', () => {
    expect(LABOR_CAPTURE.geo).toMatch(/missing punch stays Missing, not zero/);
    expect(LABOR_CAPTURE.primeBandNote).toMatch(/target, not a guaranteed result/);
    expect(LABOR_CAPTURE.primeBandNote).toMatch(/we do not invent “you’ll hit 65%.”/i);
    expect(LABOR_PAGE).toContain('ONE_SEAT_PATHS.checkLabor');
    expect(LABOR_PAGE).toContain('GOLD_LABOR.driftHours');
    expect(LABOR_PAGE).toContain('HonestyLegend');
    expect(LABOR_PAGE).toMatch(/Honesty labels only/);
    expect(LABOR_PAGE).not.toContain('GOLD_LABOR.sampleDollars');
    expect(LABOR_PAGE).not.toContain('GOLD_LABOR.claimBoundary');
    expect(LABOR_PAGE).toMatch(/hours, not dollars/);
    expect(LABOR_CAPTURE.related.map((link) => link.href)).toContain('/check/labor');
    expect(LABOR_PAGE).not.toMatch(/guaranteed.*65/);
  });

  it('keeps the 3P slug as a thin /audit wrapper with no new dollars', () => {
    expect(THREE_P_CAPTURE.canonical).toBe(`${WWW}/audit`);
    expect(THREE_P_CAPTURE.geo).toMatch(/Commission is not total marketplace cost/);
    expect(THREE_P_CAPTURE.geo).toMatch(/not a contract violation or guaranteed recovery/);
    expect(THREE_P_PAGE).toContain('THREE_P_CAPTURE.canonical');
    expect(THREE_P_PAGE).toMatch(/\/audit#true-cost-snapshot|\/audit/);
    expect(THREE_P_PAGE).not.toMatch(/\$[\d,]+/);
    expect(THREE_P_PAGE).not.toMatch(/MarketplaceCostSnapshot/);
    expect(THREE_P_PAGE).not.toMatch(/787\.55|1,764\.29/);
  });

  it('does not invent savings claims across the capture corpus', () => {
    const corpus = [
      captureLandingCorpus(),
      POS_PAGE,
      INVOICE_PAGE,
      LABOR_PAGE,
      THREE_P_PAGE,
    ].join('\n');
    expect(corpus).not.toMatch(/we guarantee/i);
    expect(corpus).not.toMatch(/you.?ll save/i);
    expect(corpus).not.toMatch(/recover \$/i);
    expect(corpus).not.toMatch(/save you \$/i);
    expect(corpus).toMatch(/not money recovered/);
    expect(corpus).toMatch(/not a contract violation or guaranteed recovery/);
  });

  it('adds the four slugs to the sitemap and keeps /command-center/ disallowed', async () => {
    const entries = await sitemap();
    const urls = new Set(entries.map((entry) => entry.url));
    for (const path of Object.values(CAPTURE_LANDING_PATHS)) {
      expect(urls.has(`${WWW}${path}`), path).toBe(true);
    }
    const captureUrls = entries
      .filter((entry) => CAPTURE_LANDING_SLUGS.some((path) => entry.url === `${WWW}${path}`))
      .map((entry) => entry.url);
    expect(captureUrls[0]).toBe(`${WWW}${CAPTURE_LANDING_PATHS.labor}`);
    expect([...ROBOTS_DISALLOW]).toContain('/command-center/');
    const doc = robots();
    const rule = Array.isArray(doc.rules) ? doc.rules[0] : doc.rules;
    expect((rule as { disallow: string[] }).disallow).toContain('/command-center/');
  });
});
